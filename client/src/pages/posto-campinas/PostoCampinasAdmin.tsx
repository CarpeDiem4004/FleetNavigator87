import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  Loader2,
  Droplet,
  AlertCircle,
  FileText,
  Calendar,
  Download,
  Search,
  Plus,
  Filter,
  TrendingUp,
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

// Schema para validação do formulário de abastecimento de tanque
const abastecimentoTanqueSchema = z.object({
  tanqueId: z.coerce.number().positive('Selecione um tanque'),
  quantidadeLitros: z.coerce.number().positive('Quantidade deve ser maior que zero'),
  valorLitro: z.coerce.number().positive('Valor do litro deve ser maior que zero'),
  notaFiscal: z.string().optional(),
  fornecedor: z.string().optional(),
});

// Schema para validação do formulário de atualização de valores
const atualizacaoValoresSchema = z.object({
  tanqueId: z.coerce.number().positive('Selecione um tanque'),
  valorLitroFrota: z.coerce.number().positive('Valor do litro deve ser maior que zero'),
  valorLitroAgregado: z.coerce.number().positive('Valor do litro deve ser maior que zero'),
});

// Schema para validação do formulário de criação de tanque
const criacaoTanqueSchema = z.object({
  tipo: z.enum(['diesel', 'arla'], {
    required_error: 'Selecione o tipo de combustível',
  }),
  capacidadeTotal: z.coerce.number().positive('Capacidade deve ser maior que zero'),
  nivelAtual: z.coerce.number().min(0, 'Nível não pode ser negativo'),
  valorLitroFrota: z.coerce.number().positive('Valor do litro deve ser maior que zero'),
  valorLitroAgregado: z.coerce.number().positive('Valor do litro deve ser maior que zero'),
});

type AbastecimentoTanqueValues = z.infer<typeof abastecimentoTanqueSchema>;
type AtualizacaoValoresValues = z.infer<typeof atualizacaoValoresSchema>;
type CriacaoTanqueValues = z.infer<typeof criacaoTanqueSchema>;

export default function PostoCampinasAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [dialogAbastecimento, setDialogAbastecimento] = useState(false);
  const [dialogValores, setDialogValores] = useState(false);
  const [dialogTanque, setDialogTanque] = useState(false);
  const [filtroPlaca, setFiltroPlaca] = useState('');
  const [filtroTipoCombustivel, setFiltroTipoCombustivel] = useState('');
  const [filtroTipoVeiculo, setFiltroTipoVeiculo] = useState('');
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  
  // Formulário de abastecimento de tanque
  const formAbastecimento = useForm<AbastecimentoTanqueValues>({
    resolver: zodResolver(abastecimentoTanqueSchema),
    defaultValues: {
      tanqueId: undefined,
      quantidadeLitros: undefined,
      valorLitro: undefined,
      notaFiscal: '',
      fornecedor: '',
    },
  });
  
  // Formulário de atualização de valores
  const formValores = useForm<AtualizacaoValoresValues>({
    resolver: zodResolver(atualizacaoValoresSchema),
    defaultValues: {
      tanqueId: undefined,
      valorLitroFrota: undefined,
      valorLitroAgregado: undefined,
    },
  });
  
  // Formulário de criação de tanque
  const formTanque = useForm<CriacaoTanqueValues>({
    resolver: zodResolver(criacaoTanqueSchema),
    defaultValues: {
      tipo: 'diesel',
      capacidadeTotal: undefined,
      nivelAtual: 0,
      valorLitroFrota: undefined,
      valorLitroAgregado: undefined,
    },
  });

  // Buscar informações dos tanques
  const { data: tanques, isLoading: isLoadingTanques } = useQuery({
    queryKey: ['/api/posto-campinas/tanques'],
    queryFn: () => apiRequest('GET', '/api/posto-campinas/tanques').then(res => res.json()),
  });

  // Buscar estatísticas
  const { data: estatisticas, isLoading: isLoadingEstatisticas } = useQuery({
    queryKey: ['/api/posto-campinas/estatisticas', dateRange.from?.toISOString(), dateRange.to?.toISOString()],
    queryFn: () => apiRequest('GET', `/api/posto-campinas/estatisticas?dataInicio=${dateRange.from?.toISOString()}&dataFim=${dateRange.to?.toISOString()}`).then(res => res.json()),
  });

  // Buscar abastecimentos
  const { data: abastecimentos, isLoading: isLoadingAbastecimentos } = useQuery({
    queryKey: [
      '/api/posto-campinas/abastecimentos', 
      dateRange.from?.toISOString(), 
      dateRange.to?.toISOString(),
      filtroPlaca,
      filtroTipoCombustivel,
      filtroTipoVeiculo,
      page
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      if (dateRange.from) params.append('dataInicio', dateRange.from.toISOString());
      if (dateRange.to) params.append('dataFim', dateRange.to.toISOString());
      if (filtroPlaca) params.append('placa', filtroPlaca);
      if (filtroTipoCombustivel) params.append('tipoCombustivel', filtroTipoCombustivel);
      if (filtroTipoVeiculo) params.append('tipoVeiculo', filtroTipoVeiculo);
      params.append('offset', (page * 10).toString());
      params.append('limit', '10');
      
      return apiRequest('GET', `/api/posto-campinas/abastecimentos?${params.toString()}`).then(res => res.json());
    },
  });

  // Mutação para abastecer tanque
  const abastecerTanque = useMutation({
    mutationFn: async (values: AbastecimentoTanqueValues) => {
      const res = await apiRequest('POST', `/api/posto-campinas/tanques/${values.tanqueId}/abastecer`, values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Tanque abastecido',
        description: 'O tanque foi abastecido com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/posto-campinas/tanques'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posto-campinas/estatisticas'] });
      setDialogAbastecimento(false);
      formAbastecimento.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao abastecer tanque',
        description: error.message || 'Ocorreu um erro ao abastecer o tanque',
        variant: 'destructive',
      });
    },
  });

  // Mutação para atualizar valores do litro
  const atualizarValores = useMutation({
    mutationFn: async (values: AtualizacaoValoresValues) => {
      const res = await apiRequest('PUT', `/api/posto-campinas/tanques/${values.tanqueId}/valores`, values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Valores atualizados',
        description: 'Os valores do litro foram atualizados com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/posto-campinas/tanques'] });
      setDialogValores(false);
      formValores.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar valores',
        description: error.message || 'Ocorreu um erro ao atualizar os valores do litro',
        variant: 'destructive',
      });
    },
  });

  // Mutação para criar tanque
  const criarTanque = useMutation({
    mutationFn: async (values: CriacaoTanqueValues) => {
      const res = await apiRequest('POST', '/api/posto-campinas/tanques', values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Tanque criado',
        description: 'O tanque foi criado com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/posto-campinas/tanques'] });
      setDialogTanque(false);
      formTanque.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar tanque',
        description: error.message || 'Ocorreu um erro ao criar o tanque',
        variant: 'destructive',
      });
    },
  });

  // Função para pré-preencher o formulário de valores
  const preencherFormValores = (tanqueId: number) => {
    const tanque = tanques?.find((t: any) => t.id === tanqueId);
    if (tanque) {
      formValores.setValue('tanqueId', tanque.id);
      formValores.setValue('valorLitroFrota', parseFloat(tanque.valorLitroFrota));
      formValores.setValue('valorLitroAgregado', parseFloat(tanque.valorLitroAgregado));
      setDialogValores(true);
    }
  };

  // Função para pré-preencher o formulário de abastecimento
  const preencherFormAbastecimento = (tanqueId: number) => {
    formAbastecimento.setValue('tanqueId', tanqueId);
    setDialogAbastecimento(true);
  };

  // Cálculo de preço médio
  const calcularPrecoMedio = (tipo: string) => {
    if (!estatisticas || !estatisticas.resumo) return '0.00';
    
    const litros = tipo === 'diesel' ? estatisticas.resumo.diesel.litros : estatisticas.resumo.arla.litros;
    
    if (!litros || litros === 0) return '0.00';
    
    // Cálculo fictício aproximado já que não temos o valor total por tipo
    const valorTotal = estatisticas.resumo.totalValor * (litros / estatisticas.resumo.totalLitros);
    return (valorTotal / litros).toFixed(2);
  };

  // Função para exportar dados em CSV
  const exportarCSV = () => {
    if (!abastecimentos || !abastecimentos.data) return;
    
    const headers = ['ID', 'Placa', 'KM', 'Tipo Veículo', 'Tipo Combustível', 'Qtd. Litros', 'Valor Litro', 'Valor Total', 'Motorista', 'Data'];
    const csvRows = [headers.join(',')];
    
    abastecimentos.data.forEach((item: any) => {
      const row = [
        item.id,
        item.placa,
        item.km,
        item.tipoVeiculo,
        item.tipoCombustivel,
        item.quantidadeLitros,
        item.valorLitro,
        item.valorTotal,
        item.motorista,
        format(new Date(item.dataRegistro), 'dd/MM/yyyy HH:mm')
      ];
      csvRows.push(row.join(','));
    });
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `abastecimentos_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Posto Campinas - Administração</h1>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              Administrador: {user?.name || 'Não autenticado'}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="dashboard">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="abastecimentos">Abastecimentos</TabsTrigger>
            <TabsTrigger value="tanques">Tanques</TabsTrigger>
          </TabsList>
          
          {/* === Tab de Dashboard === */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Painel de Controle</h2>
              <div>
                <DateRangePicker
                  from={dateRange.from}
                  to={dateRange.to}
                  onFromChange={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                  onToChange={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                />
              </div>
            </div>

            {isLoadingEstatisticas ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !estatisticas ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>
                  Não foi possível carregar as estatísticas.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total de Abastecimentos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {estatisticas.resumo.totalAbastecimentos || 0}
                      </div>
                      <p className="text-xs text-muted-foreground pt-1">
                        No período selecionado
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Volume Total (L)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {parseFloat(estatisticas.resumo.totalLitros).toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground pt-1">
                        Diesel: {parseFloat(estatisticas.resumo.diesel.litros).toFixed(2)} L
                        • Arla: {parseFloat(estatisticas.resumo.arla.litros).toFixed(2)} L
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Valor Total (R$)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        R$ {parseFloat(estatisticas.resumo.totalValor).toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground pt-1">
                        Preço médio Diesel: R$ {calcularPrecoMedio('diesel')}
                        • Arla: R$ {calcularPrecoMedio('arla')}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Por Tipo de Veículo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {((parseFloat(estatisticas.resumo.frota.litros) / parseFloat(estatisticas.resumo.totalLitros)) * 100).toFixed(1)}% Frota
                      </div>
                      <p className="text-xs text-muted-foreground pt-1">
                        Frota: {parseFloat(estatisticas.resumo.frota.litros).toFixed(2)} L
                        • Agregado: {parseFloat(estatisticas.resumo.agregado.litros).toFixed(2)} L
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Consumo Diário</CardTitle>
                      <CardDescription>
                        Volume de combustível abastecido por dia
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {estatisticas.estatisticasDiarias && estatisticas.estatisticasDiarias.length > 0 ? (
                        <div className="h-[250px]">
                          {/* Renderizar gráficos de consumo diário */}
                          <div className="space-y-1">
                            {estatisticas.estatisticasDiarias.slice(0, 10).map((dia: any) => (
                              <div key={dia.data} className="relative pt-2">
                                <div className="flex justify-between text-xs mb-1">
                                  <span>{format(new Date(dia.data), 'dd/MM')}</span>
                                  <span>{parseFloat(dia.totalLitros).toFixed(0)} L</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div 
                                    className="bg-primary rounded-full h-2"
                                    style={{ 
                                      width: `${Math.min(100, (parseFloat(dia.totalLitros) / estatisticas.resumo.totalLitros * 5 * 100))}%` 
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                          Sem dados para o período selecionado
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top Veículos</CardTitle>
                      <CardDescription>
                        Veículos com maior consumo de combustível
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {estatisticas.top10Veiculos && estatisticas.top10Veiculos.length > 0 ? (
                        <div className="h-[250px] overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Placa</TableHead>
                                <TableHead>Abast.</TableHead>
                                <TableHead className="text-right">Volume</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {estatisticas.top10Veiculos.slice(0, 5).map((veiculo: any) => (
                                <TableRow key={veiculo.placa}>
                                  <TableCell className="font-medium">{veiculo.placa}</TableCell>
                                  <TableCell>{veiculo.totalAbastecimentos}</TableCell>
                                  <TableCell className="text-right">{parseFloat(veiculo.totalLitros).toFixed(0)} L</TableCell>
                                  <TableCell className="text-right">R$ {parseFloat(veiculo.totalValor).toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                          Sem dados para o período selecionado
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
          
          {/* === Tab de Abastecimentos === */}
          <TabsContent value="abastecimentos" className="space-y-4">
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-semibold">Histórico de Abastecimentos</h2>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <DateRangePicker
                    from={dateRange.from}
                    to={dateRange.to}
                    onFromChange={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                    onToChange={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                  />
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={exportarCSV}
                    disabled={!abastecimentos || !abastecimentos.data || abastecimentos.data.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>

              {showFilters && (
                <Card className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Placa</label>
                      <div className="flex items-center">
                        <Input
                          placeholder="Buscar por placa"
                          value={filtroPlaca}
                          onChange={(e) => setFiltroPlaca(e.target.value)}
                          className="w-full"
                        />
                        {filtroPlaca && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFiltroPlaca('')}
                            className="ml-2"
                          >
                            &times;
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Tipo de Combustível</label>
                      <Select
                        value={filtroTipoCombustivel}
                        onValueChange={setFiltroTipoCombustivel}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos</SelectItem>
                          <SelectItem value="diesel">Diesel</SelectItem>
                          <SelectItem value="arla">Arla 32</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Tipo de Veículo</label>
                      <Select
                        value={filtroTipoVeiculo}
                        onValueChange={setFiltroTipoVeiculo}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos</SelectItem>
                          <SelectItem value="frota">Frota</SelectItem>
                          <SelectItem value="agregado">Agregado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              )}

              <Card>
                <CardContent className="p-0">
                  {isLoadingAbastecimentos ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : !abastecimentos || !abastecimentos.data ? (
                    <div className="py-8 text-center text-muted-foreground">
                      Não foi possível carregar os abastecimentos.
                    </div>
                  ) : abastecimentos.data.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      Nenhum abastecimento encontrado para os filtros selecionados.
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Placa</TableHead>
                            <TableHead>Combustível</TableHead>
                            <TableHead>Quantidade</TableHead>
                            <TableHead>Valor Litro</TableHead>
                            <TableHead>Valor Total</TableHead>
                            <TableHead>Motorista</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Tipo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {abastecimentos.data.map((item: any) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.id}</TableCell>
                              <TableCell className="font-medium">{item.placa}</TableCell>
                              <TableCell>
                                <Badge variant={item.tipoCombustivel === 'diesel' ? 'default' : 'secondary'}>
                                  {item.tipoCombustivel === 'diesel' ? 'Diesel' : 'Arla 32'}
                                </Badge>
                              </TableCell>
                              <TableCell>{parseFloat(item.quantidadeLitros).toFixed(2)} L</TableCell>
                              <TableCell>R$ {parseFloat(item.valorLitro).toFixed(2)}</TableCell>
                              <TableCell>R$ {parseFloat(item.valorTotal).toFixed(2)}</TableCell>
                              <TableCell>{item.motorista}</TableCell>
                              <TableCell>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="cursor-help">
                                        {format(new Date(item.dataRegistro), 'dd/MM/yyyy')}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {format(new Date(item.dataRegistro), 'dd/MM/yyyy HH:mm:ss')}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell>
                                <Badge variant={item.tipoVeiculo === 'frota' ? 'outline' : 'destructive'} className="capitalize">
                                  {item.tipoVeiculo}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      <div className="p-4 border-t flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          Mostrando {abastecimentos.data.length} de {abastecimentos.pagination.total} registros
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(Math.max(0, page - 1))}
                            disabled={page === 0}
                          >
                            Anterior
                          </Button>
                          
                          <span className="text-sm">
                            Página {page + 1} de {Math.ceil(abastecimentos.pagination.total / 10) || 1}
                          </span>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page + 1)}
                            disabled={!abastecimentos.data.length || abastecimentos.data.length < 10}
                          >
                            Próxima
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* === Tab de Tanques === */}
          <TabsContent value="tanques" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Gestão de Tanques</h2>
              <Button onClick={() => setDialogTanque(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Tanque
              </Button>
            </div>

            {isLoadingTanques ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !tanques || tanques.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <div className="mb-4">
                    <Droplet className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Nenhum tanque cadastrado</h3>
                  <p>Clique em "Novo Tanque" para adicionar um tanque ao sistema.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tanques.map((tanque: any) => {
                  const percentual = (parseFloat(tanque.nivelAtual) / parseFloat(tanque.capacidadeTotal)) * 100;
                  
                  return (
                    <Card key={tanque.id} className="flex flex-col">
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-xl capitalize">
                            Tanque de {tanque.tipo === 'diesel' ? 'Diesel' : 'Arla 32'}
                          </CardTitle>
                          <Badge 
                            variant={percentual < 20 ? "destructive" : "secondary"}
                          >
                            {percentual.toFixed(1)}%
                          </Badge>
                        </div>
                        <CardDescription>
                          Código: {tanque.id} • Última atualização: {format(new Date(tanque.ultimaAtualizacao), 'dd/MM/yyyy HH:mm')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <div className="space-y-6">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Nível atual</span>
                              <span>{parseFloat(tanque.nivelAtual).toFixed(2)} / {parseFloat(tanque.capacidadeTotal).toFixed(0)} L</span>
                            </div>
                            <Progress 
                              value={percentual} 
                              className={
                                percentual < 10 ? 'bg-red-200' : 
                                percentual < 20 ? 'bg-orange-200' : 
                                percentual < 50 ? 'bg-yellow-200' : 
                                'bg-green-200'
                              }
                            />
                          </div>
                          
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="valores">
                              <AccordionTrigger>
                                <span className="text-sm font-medium">Valores por litro</span>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-2 pt-2">
                                  <div className="grid grid-cols-2 text-sm">
                                    <span>Frota:</span>
                                    <span className="font-medium text-right">R$ {parseFloat(tanque.valorLitroFrota).toFixed(2)}</span>
                                  </div>
                                  <div className="grid grid-cols-2 text-sm">
                                    <span>Agregado:</span>
                                    <span className="font-medium text-right">R$ {parseFloat(tanque.valorLitroAgregado).toFixed(2)}</span>
                                  </div>
                                  <div className="pt-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="w-full"
                                      onClick={() => preencherFormValores(tanque.id)}
                                    >
                                      Atualizar valores
                                    </Button>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between border-t pt-4">
                        <Button 
                          variant="secondary"
                          size="sm"
                          onClick={() => preencherFormAbastecimento(tanque.id)}
                        >
                          <Droplet className="h-4 w-4 mr-2" />
                          Abastecer Tanque
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ======= DIÁLOGOS ======= */}
      
      {/* Modal de Abastecimento de Tanque */}
      <Dialog open={dialogAbastecimento} onOpenChange={setDialogAbastecimento}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abastecer Tanque</DialogTitle>
          </DialogHeader>
          
          <Form {...formAbastecimento}>
            <form onSubmit={formAbastecimento.handleSubmit((values) => abastecerTanque.mutate(values))} className="space-y-4 pt-4">
              <FormField
                control={formAbastecimento.control}
                name="tanqueId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanque</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tanque" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tanques?.map((tanque: any) => (
                          <SelectItem key={tanque.id} value={tanque.id.toString()}>
                            Tanque de {tanque.tipo === 'diesel' ? 'Diesel' : 'Arla 32'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={formAbastecimento.control}
                  name="quantidadeLitros"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade (L)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={formAbastecimento.control}
                  name="valorLitro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor por Litro (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={formAbastecimento.control}
                name="notaFiscal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nota Fiscal</FormLabel>
                    <FormControl>
                      <Input placeholder="Número da nota fiscal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={formAbastecimento.control}
                name="fornecedor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do fornecedor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="pt-2 flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogAbastecimento(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={abastecerTanque.isPending}
                >
                  {abastecerTanque.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Abastecendo...
                    </>
                  ) : (
                    'Abastecer Tanque'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Atualização de Valores */}
      <Dialog open={dialogValores} onOpenChange={setDialogValores}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Valores do Combustível</DialogTitle>
          </DialogHeader>
          
          <Form {...formValores}>
            <form onSubmit={formValores.handleSubmit((values) => atualizarValores.mutate(values))} className="space-y-4 pt-4">
              <FormField
                control={formValores.control}
                name="tanqueId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanque</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tanque" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tanques?.map((tanque: any) => (
                          <SelectItem key={tanque.id} value={tanque.id.toString()}>
                            Tanque de {tanque.tipo === 'diesel' ? 'Diesel' : 'Arla 32'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={formValores.control}
                  name="valorLitroFrota"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Frota (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={formValores.control}
                  name="valorLitroAgregado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Agregado (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="pt-2 flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogValores(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={atualizarValores.isPending}
                >
                  {atualizarValores.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    'Atualizar Valores'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Criação de Tanque */}
      <Dialog open={dialogTanque} onOpenChange={setDialogTanque}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Tanque</DialogTitle>
          </DialogHeader>
          
          <Form {...formTanque}>
            <form onSubmit={formTanque.handleSubmit((values) => criarTanque.mutate(values))} className="space-y-4 pt-4">
              <FormField
                control={formTanque.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Combustível</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="arla">Arla 32</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={formTanque.control}
                  name="capacidadeTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidade Total (L)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={formTanque.control}
                  name="nivelAtual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível Atual (L)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={formTanque.control}
                  name="valorLitroFrota"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Frota (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={formTanque.control}
                  name="valorLitroAgregado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Agregado (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="pt-2 flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogTanque(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={criarTanque.isPending}
                >
                  {criarTanque.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Tanque'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}