import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { format } from 'date-fns';
import { AlertTriangle, ArrowLeft, DropletIcon, FileText, Fuel, Plus, RefreshCw } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

// Interfaces para os tipos de dados
interface Abastecimento {
  id: number;
  placa: string;
  data: string;
  motorista: string;
  litros: number;
  valor_total: number;
}

interface HistoricoVolume {
  data: string;
  volume: number;
}

interface PostoDetalhes {
  id: number;
  nome: string;
  localizacao: string;
  capacidade_total: number;
  volume_atual: number;
  total_abastecimentos: number;
  total_litros: number;
  alerta_nivel_baixo: boolean;
  percentual: number;
  ultima_atualizacao: string;
  abastecimentos: Abastecimento[];
  historico_volume: HistoricoVolume[];
}

// Função para formatação de números
const formatarNumero = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR').format(Math.round(valor));
};

// Função para formatação de moeda
const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

// Função para formatação de percentual
const formatarPercentual = (valor: number): string => {
  return valor.toFixed(1).replace('.', ',') + '%';
};

export default function PostoDetalhesPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [entradaForm, setEntradaForm] = useState({
    volume: '',
    nota_fiscal: '',
    fornecedor: '',
    data: format(new Date(), 'yyyy-MM-dd')
  });
  const { toast } = useToast();

  // Buscar detalhes do posto
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [`/api/postos/${params.id}`],
    queryFn: async () => {
      const res = await fetch(`/api/postos/${params.id}`);
      if (!res.ok) {
        throw new Error('Erro ao buscar detalhes do posto');
      }
      const data = await res.json();
      return data.data as PostoDetalhes;
    }
  });

  // Determinar a classe de cor para o indicador de nível
  const getNivelColorClass = (percentual: number): string => {
    if (percentual < 15) {
      return 'text-red-600';
    }
    if (percentual < 30) {
      return 'text-amber-500';
    }
    return 'text-green-600';
  };

  // Função para lidar com alterações no formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEntradaForm(prev => ({ ...prev, [name]: value }));
  };

  // Função para registrar entrada de diesel
  const handleSubmitEntrada = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!entradaForm.volume || !entradaForm.nota_fiscal || !entradaForm.fornecedor) {
      toast({
        title: "Erro no formulário",
        description: "Todos os campos são obrigatórios",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const res = await fetch(`/api/postos/${params.id}/entrada-combustivel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entradaForm)
      });
      
      const responseData = await res.json();
      
      if (!res.ok) {
        throw new Error(responseData.message || 'Erro ao registrar entrada de combustível');
      }
      
      toast({
        title: "Sucesso!",
        description: responseData.message || "Entrada de combustível registrada com sucesso",
      });
      
      // Fechar o diálogo e resetar o formulário
      setDialogOpen(false);
      setEntradaForm({
        volume: '',
        nota_fiscal: '',
        fornecedor: '',
        data: format(new Date(), 'yyyy-MM-dd')
      });
      
      // Atualizar os dados
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao registrar a entrada de combustível",
        variant: "destructive"
      });
    }
  };

  // Componente de carregamento
  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-500">Carregando detalhes do posto...</p>
          </div>
        </div>
      </div>
    );
  }

  // Componente de erro
  if (isError || !data) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-8 text-red-500">
            <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
            <p>Erro ao carregar detalhes do posto. Por favor, tente novamente.</p>
            <div className="flex justify-center gap-4 mt-4">
              <Button variant="outline" onClick={() => setLocation('/postos')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Processamento dos dados para o gráfico
  const historicoProcessado = data.historico_volume.map(item => ({
    data: item.data.split('T')[0],
    volume: item.volume
  }));

  return (
    <div className="container mx-auto p-4">
      {/* Cabeçalho */}
      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={() => setLocation('/postos')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para lista de postos
        </Button>
      </div>
      
      {/* Resumo do Posto */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl flex items-center">
                  {data.nome}
                  {data.alerta_nivel_baixo && (
                    <AlertTriangle className="ml-2 h-5 w-5 text-red-500" />
                  )}
                </CardTitle>
                <CardDescription className="text-lg">{data.localizacao}</CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar Entrada de Diesel
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar Entrada de Diesel</DialogTitle>
                    <DialogDescription>
                      Adicione combustível ao tanque de {data.nome}.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmitEntrada}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="volume" className="text-right">
                          Volume (L)
                        </Label>
                        <Input
                          id="volume"
                          name="volume"
                          type="number"
                          min="1"
                          className="col-span-3"
                          value={entradaForm.volume}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="nota_fiscal" className="text-right">
                          Nota Fiscal
                        </Label>
                        <Input
                          id="nota_fiscal"
                          name="nota_fiscal"
                          className="col-span-3"
                          value={entradaForm.nota_fiscal}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fornecedor" className="text-right">
                          Fornecedor
                        </Label>
                        <Input
                          id="fornecedor"
                          name="fornecedor"
                          className="col-span-3"
                          value={entradaForm.fornecedor}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="data" className="text-right">
                          Data
                        </Label>
                        <Input
                          id="data"
                          name="data"
                          type="date"
                          className="col-span-3"
                          value={entradaForm.data}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Registrar Entrada</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-500 mb-1">Nível do Tanque</div>
              <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`absolute h-full ${data.percentual < 15 ? 'bg-red-500' : 
                    data.percentual < 30 ? 'bg-amber-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(100, data.percentual)}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                  {formatarPercentual(data.percentual)}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Fuel className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <div className="text-sm text-gray-500">Volume Atual</div>
                <div className="text-xl font-bold">{formatarNumero(data.volume_atual)} L</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Fuel className="h-6 w-6 mx-auto mb-2 text-gray-500" />
                <div className="text-sm text-gray-500">Capacidade Total</div>
                <div className="text-xl font-bold">{formatarNumero(data.capacidade_total)} L</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <DropletIcon className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <div className="text-sm text-gray-500">Total Abastecido</div>
                <div className="text-xl font-bold">{formatarNumero(data.total_litros)} L</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <FileText className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <div className="text-sm text-gray-500">Abastecimentos</div>
                <div className="text-xl font-bold">{formatarNumero(data.total_abastecimentos)}</div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-sm text-gray-500 justify-between border-t pt-4">
            <div>
              Última atualização: {format(new Date(data.ultima_atualizacao), 'dd/MM/yyyy HH:mm')}
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Volume</CardTitle>
            <CardDescription>Evolução do nível de diesel no tanque</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {historicoProcessado.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicoProcessado}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="data" 
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return format(date, 'dd/MM');
                    }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${formatarNumero(value)} L`, 'Volume']}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return format(date, 'dd/MM/yyyy');
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="volume" 
                    stroke="#3b82f6" 
                    activeDot={{ r: 8 }} 
                    name="Volume"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Nenhum histórico de volume disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs para dados detalhados */}
      <Tabs defaultValue="abastecimentos" className="bg-white rounded-lg shadow-md">
        <TabsList className="px-6 pt-4">
          <TabsTrigger value="abastecimentos">Histórico de Abastecimentos</TabsTrigger>
          <TabsTrigger value="grafico">Gráfico de Consumo</TabsTrigger>
        </TabsList>
        
        <TabsContent value="abastecimentos" className="p-6">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-medium">Histórico de Abastecimentos</h3>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
          
          {data.abastecimentos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum abastecimento registrado para este posto.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Litros</TableHead>
                    <TableHead>Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.abastecimentos.map((abastecimento) => (
                    <TableRow key={abastecimento.id}>
                      <TableCell>{format(new Date(abastecimento.data), 'dd/MM/yyyy HH:mm')}</TableCell>
                      <TableCell className="font-medium">{abastecimento.placa}</TableCell>
                      <TableCell>{abastecimento.motorista}</TableCell>
                      <TableCell>{formatarNumero(abastecimento.litros)} L</TableCell>
                      <TableCell>{formatarMoeda(abastecimento.valor_total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="grafico" className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium">Gráfico de Consumo</h3>
            <p className="text-sm text-gray-500">Volume de diesel abastecido ao longo do tempo</p>
          </div>
          
          <div className="h-96">
            {data.abastecimentos.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                Nenhum dado de abastecimento disponível para gerar o gráfico.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.abastecimentos.map(a => ({
                    data: a.data.split('T')[0],
                    litros: a.litros,
                    placa: a.placa
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="data" 
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return format(date, 'dd/MM');
                    }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${formatarNumero(value)} L`, 'Litros']}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return format(date, 'dd/MM/yyyy');
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="litros" 
                    stroke="#10b981" 
                    activeDot={{ r: 8 }} 
                    name="Litros"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}