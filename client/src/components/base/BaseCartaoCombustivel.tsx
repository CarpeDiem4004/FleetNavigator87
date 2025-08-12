/**
 * Componente genérico de cartão combustível para bases
 * Pode ser usado por qualquer base com customização de nome e cor
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Fuel, 
  CreditCard, 
  Clock, 
  Building2, 
  CheckCircle,
  AlertCircle,
  Loader2,
  History,
  Eye
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

interface BaseCartaoCombustivelProps {
  baseId: number;
  baseName?: string;
  primaryColor?: string;
}

interface Project {
  id: number;
  name: string;
}

interface Base {
  id: number;
  name: string;
  location: string;
}

const formSchema = z.object({
  motorista: z.string().min(1, 'Nome do motorista é obrigatório'),
  solicitante: z.string().min(1, 'Nome do solicitante é obrigatório'),
  telefone_celular: z.string().optional(),
  placa: z.string().min(1, 'Placa do veículo é obrigatória'),
  valor: z.string().min(1, 'Valor é obrigatório'),
  projeto: z.string().min(1, 'Projeto é obrigatório'),
  base: z.string().min(1, 'Base é obrigatória'),
  tipo_cartao: z.enum(['vinculado', 'especifico'], {
    required_error: 'Tipo de cartão é obrigatório',
  }),
  provedor_cartao: z.enum(['Ticket', 'Alelo'], {
    required_error: 'Provedor do cartão é obrigatório',
  }),
  numero_cartao: z.string().optional(),
  dados_cartao_especifico: z.string().optional(),
  horario_abastecimento: z.enum(['antes_17h', 'apos_18h'], {
    required_error: 'Horário de abastecimento é obrigatório',
  }),
  observacoes: z.string().optional(),
});

export default function BaseCartaoCombustivel({ 
  baseId, 
  baseName, 
  primaryColor = '#2563eb' 
}: BaseCartaoCombustivelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('solicitar');
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar usuário logado
  const { data: currentUser } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/user');
      return res.json();
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      motorista: '',
      solicitante: '',
      telefone_celular: '',
      placa: '',
      valor: '',
      projeto: '3', // Fixo para MERCADO LIVRE baseado na base
      base: baseId.toString(), // Fixo baseado na baseId passada
      tipo_cartao: 'vinculado',
      provedor_cartao: 'Ticket',
      numero_cartao: '',
      dados_cartao_especifico: '',
      horario_abastecimento: 'antes_17h',
      observacoes: '',
    },
  });

  // Auto-preencher solicitante quando usuário for carregado
  useEffect(() => {
    if (currentUser?.name) {
      form.setValue('solicitante', currentUser.name);
    }
  }, [currentUser, form]);

  // Buscar projetos
  const { data: projects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/projects');
      const data = await res.json();
      return data.data || [];
    },
  });

  // Buscar bases
  const { data: bases } = useQuery<Base[]>({
    queryKey: ['/api/bases'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/bases');
      const data = await res.json();
      return data.data || [];
    },
  });

  // Mutation para criar solicitação
  const createSolicitation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      setIsSubmitting(true);
      
      // Definir o número do cartão baseado no tipo
      let finalCardNumber = '';
      if (data.tipo_cartao === 'vinculado') {
        finalCardNumber = data.placa;
      } else {
        finalCardNumber = data.dados_cartao_especifico || '';
      }

      const solicitation = {
        ...data,
        numero_cartao: finalCardNumber,
        base_id: baseId,
        base_name: baseName,
        valor: parseFloat(data.valor.replace(/[^\d.,]/g, '').replace(',', '.')),
        data_solicitacao: new Date().toISOString(),
        status: 'pendente',
        origem: 'base_system',
      };

      const res = await apiRequest('POST', '/api/fuel-card-solicitations', solicitation);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao criar solicitação');
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitação enviada com sucesso!",
        description: "Sua solicitação foi enviada e está aguardando retorno da gestão de combustível",
      });
      
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/fuel-card-solicitations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Validação adicional para cartão específico
    if (data.tipo_cartao === 'especifico' && !data.dados_cartao_especifico?.trim()) {
      form.setError('dados_cartao_especifico', {
        message: 'Dados do cartão específico são obrigatórios quando selecionado',
      });
      return;
    }

    createSolicitation.mutate(data);
  };

  const watchTipoCartao = form.watch('tipo_cartao');
  const watchProjeto = form.watch('projeto');

  // Query para buscar histórico de solicitações da base
  const { data: solicitationsResponse, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['/api/fuel-card-solicitations'],
    refetchInterval: 30000,
    retry: 3
  });
  
  const solicitations = solicitationsResponse?.data || [];
  const baseSolicitations = solicitations.filter((s: any) => {
    // Filtrar solicitações da base atual
    if (!baseName) return false;
    return s.base && (
      s.base.toLowerCase().includes(baseName.toLowerCase()) ||
      s.base.toLowerCase().includes('gp03') ||
      s.base.toLowerCase().includes('gp02') ||
      s.base.toLowerCase().includes('gp01')
    );
  });

  // Filtrar bases baseado no projeto selecionado
  const filteredBases = bases?.filter(base => {
    if (!watchProjeto) return true;
    // Aqui você pode implementar lógica para filtrar bases por projeto
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendente':
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">Pendente</Badge>;
      case 'atendido':
      case 'aprovado':
      case 'recarga efetuada':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Atendido</Badge>;
      case 'rejeitado':
      case 'negado':
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" style={{ color: primaryColor }} />
            Cartão Combustível - {baseName || 'Base'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Solicite recargas de cartão combustível e acompanhe o histórico das suas solicitações.
          </p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="solicitar" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Nova Solicitação
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico ({baseSolicitations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="solicitar" className="mt-6">

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados da Solicitação</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="motorista"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Motorista</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo do motorista" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="solicitante"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Solicitante</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          placeholder="Nome completo do solicitante (preenchido automaticamente)"
                          className="bg-gray-50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="placa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placa do Veículo</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="telefone_celular"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone do Solicitante</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor da Recarga (R$)</FormLabel>
                      <FormControl>
                        <Input placeholder="150,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="projeto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Projeto</FormLabel>
                      <FormControl>
                        <Input 
                          value="MERCADO LIVRE" 
                          disabled 
                          className="bg-gray-100 text-gray-600"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="base"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base operacional</FormLabel>
                    <FormControl>
                      <Input 
                        value={baseName || `Base ${baseId}`} 
                        disabled 
                        className="bg-gray-100 text-gray-600"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipo_cartao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Cartão</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vinculado">Vinculado à placa</SelectItem>
                          <SelectItem value="especifico">Cartão específico por número</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="provedor_cartao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provedor do Cartão</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o provedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Ticket">Ticket</SelectItem>
                          <SelectItem value="Alelo">Alelo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {watchTipoCartao === 'especifico' && (
                <FormField
                  control={form.control}
                  name="dados_cartao_especifico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dados específicos do cartão</FormLabel>
                      <FormControl>
                        <Input placeholder="Número do cartão ou outras informações" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="horario_abastecimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Abastecimento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o horário" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="antes_17h">Antes das 17h</SelectItem>
                        <SelectItem value="apos_18h">Após as 18h</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Informações adicionais sobre a solicitação..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Solicitar Recarga
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="historico" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" style={{ color: primaryColor }} />
              Histórico de Solicitações
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Acompanhe todas as suas solicitações de cartão combustível
            </p>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Carregando histórico...</span>
              </div>
            ) : baseSolicitations.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma solicitação encontrada</h3>
                <p className="text-muted-foreground">
                  Você ainda não fez nenhuma solicitação de cartão combustível.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {baseSolicitations.filter(s => s.status?.toLowerCase() === 'pendente').length}
                    </div>
                    <div className="text-sm text-yellow-600">Pendentes</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {baseSolicitations.filter(s => 
                        ['atendido', 'aprovado', 'recarga efetuada'].includes(s.status?.toLowerCase())
                      ).length}
                    </div>
                    <div className="text-sm text-green-600">Atendidas</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      R$ {(baseSolicitations
                        .filter(s => ['atendido', 'aprovado', 'recarga efetuada'].includes(s.status?.toLowerCase()))
                        .reduce((sum, s) => sum + (parseFloat(s.valor_solicitado || s.valor || 150)), 0) || 0)
                        .toFixed(2).replace('.', ',')}
                    </div>
                    <div className="text-sm text-blue-600">Total Atendido</div>
                  </div>
                </div>

                {/* Tabela */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Motorista</TableHead>
                        <TableHead>Placa</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {baseSolicitations.map((solicitation: any) => (
                        <TableRow key={solicitation.id}>
                          <TableCell className="font-medium">
                            {solicitation.data_solicitacao ? 
                              format(new Date(solicitation.data_solicitacao), 'dd/MM/yyyy HH:mm') : 
                              'N/A'
                            }
                          </TableCell>
                          <TableCell>{solicitation.motorista}</TableCell>
                          <TableCell className="font-mono">{solicitation.placa}</TableCell>
                          <TableCell>
                            R$ {(parseFloat(solicitation.valor_solicitado || solicitation.valor || 150) || 150).toFixed(2).replace('.', ',')}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(solicitation.status)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {solicitation.observacoes || 'Sem observações'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>
    </div>
  );
}