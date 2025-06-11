import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { CreditCard, Plus, FileText, History, CheckCircle2, XCircle, DollarSign, CircleCheck, BarChart3, Search, Calendar, Filter } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// Definição do esquema de validação para solicitação de recarga
const fuelCardRequestSchema = z.object({
  plate: z.string().min(1, { message: 'A placa do veículo é obrigatória' }),
  cardNumber: z.string().min(1, { message: 'O número do cartão é obrigatório' }),
  amount: z.string().min(1, { message: 'O valor da recarga é obrigatório' }),
  reason: z.string().min(1, { message: 'O motivo da recarga é obrigatório' }),
  requestedBy: z.string().min(1, { message: 'Nome do solicitante é obrigatório' }),
  fuelType: z.string().min(1, { message: 'O tipo de combustível é obrigatório' }),
  baseId: z.string().optional(),
});

type FuelCardRequest = z.infer<typeof fuelCardRequestSchema>;

// Interface para o histórico de solicitações
interface FuelCardRequestHistory {
  id: number;
  plate: string;
  cardNumber: string;
  amount: number;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'processado';
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  baseId?: number;
  baseName?: string;
  processedBy?: string;
  processedAt?: string;
}

// Esquema para as operações de adição de saldo
const cardOperationSchema = z.object({
  requestId: z.string().min(1, { message: 'A solicitação é obrigatória' }),
  operationDate: z.string().min(1, { message: 'A data da operação é obrigatória' }),
  confirmationCode: z.string().min(1, { message: 'O código de confirmação é obrigatório' }),
  operationNotes: z.string().optional(),
});

// Interface para dados de relatório de consumo
interface ConsumptionReport {
  id: number;
  placa: string;
  base_name: string;
  projeto: string;
  periodo: string;
  total_litros: number;
  total_valor: number;
  numero_abastecimentos: number;
  media_consumo: number;
  tipo_combustivel: string;
}

// Componente para exibir o histórico de solicitações
const FuelCardHistory: React.FC = () => {
  const [history, setHistory] = useState<FuelCardRequestHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('GET', '/api/fuel-card');
        const data = await response.json();
        
        if (data.success) {
          setHistory(data.data);
        } else {
          toast({
            title: 'Erro ao carregar histórico',
            description: data.message || 'Não foi possível carregar o histórico de solicitações',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        toast({
          title: 'Erro ao carregar histórico',
          description: 'Não foi possível carregar o histórico de solicitações',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [toast]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Aprovado</span>;
      case 'rejeitado':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Rejeitado</span>;
      case 'processado':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><CircleCheck className="w-3 h-3 mr-1" /> Processado</span>;
      case 'pendente':
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><FileText className="w-3 h-3 mr-1" /> Pendente</span>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Nenhuma solicitação de recarga encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Veículo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cartão</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitante</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.map((request) => (
              <tr key={request.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{request.plate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{request.cardNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{formatCurrency(request.amount)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{request.requestedBy}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(request.requestedAt)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{request.baseName || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(request.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Componente para fazer solicitação de recarga
const FuelCardRequestForm: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [vehicles, setVehicles] = useState<{ plate: string; model: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<FuelCardRequest>({
    resolver: zodResolver(fuelCardRequestSchema),
    defaultValues: {
      plate: '',
      cardNumber: '',
      amount: '',
      reason: '',
      requestedBy: user?.name || '',
      fuelType: '',
      baseId: user?.baseId?.toString() || '',
    },
  });

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('GET', '/api/vehicles');
        const data = await response.json();
        
        if (data.success) {
          setVehicles(data.data);
        } else {
          toast({
            title: 'Erro ao carregar veículos',
            description: data.message || 'Não foi possível carregar a lista de veículos',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Erro ao buscar veículos:', error);
        toast({
          title: 'Erro ao carregar veículos',
          description: 'Não foi possível carregar a lista de veículos',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [toast]);

  const onSubmit = async (data: FuelCardRequest) => {
    try {
      setIsSubmitting(true);

      const requestData = {
        ...data,
        amount: parseFloat(data.amount.replace(',', '.')),
        baseId: user?.baseId || parseInt(data.baseId || '0'),
      };

      const response = await apiRequest('POST', '/api/fuel-card', requestData);
      const responseData = await response.json();

      if (responseData.success) {
        toast({
          title: 'Solicitação enviada',
          description: 'Sua solicitação de recarga foi enviada com sucesso!',
        });
        form.reset();
        setIsDialogOpen(false);
      } else {
        toast({
          title: 'Erro ao enviar solicitação',
          description: responseData.message || 'Não foi possível enviar a solicitação',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      toast({
        title: 'Erro ao enviar solicitação',
        description: 'Não foi possível enviar a solicitação',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mb-4">
            <Plus className="mr-2 h-4 w-4" />
            Nova Solicitação
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Solicitar Recarga de Cartão de Abastecimento</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="plate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa do Veículo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o veículo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loading ? (
                          <SelectItem value="loading" disabled>Carregando...</SelectItem>
                        ) : (
                          vehicles.map((vehicle) => (
                            <SelectItem key={vehicle.plate} value={vehicle.plate}>
                              {vehicle.plate} - {vehicle.model}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cardNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Cartão</FormLabel>
                    <FormControl>
                      <Input placeholder="Número do cartão de abastecimento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Recarga (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="0,00" 
                        {...field} 
                        onChange={(e) => {
                          // Permite apenas números e vírgula/ponto
                          const value = e.target.value.replace(/[^0-9.,]/g, '');
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="fuelType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Combustível</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de combustível" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="gasolina">Gasolina</SelectItem>
                        <SelectItem value="alcool">Álcool</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="arla">Arla</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo da Recarga</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva o motivo da solicitação de recarga" 
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="requestedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Solicitante</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nome do solicitante" 
                        {...field} 
                        disabled={!!user?.name}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Enviando...
                    </>
                  ) : (
                    'Enviar Solicitação'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Card>
        <CardHeader>
          <CardTitle>Instruções para Solicitação</CardTitle>
          <CardDescription>
            Preencha o formulário para solicitar recargas nos cartões de abastecimento da frota.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>1.</strong> Clique em "Nova Solicitação" acima.</p>
            <p><strong>2.</strong> Selecione o veículo para o qual a recarga é destinada.</p>
            <p><strong>3.</strong> Informe o número do cartão de abastecimento vinculado ao veículo.</p>
            <p><strong>4.</strong> Indique o valor necessário para a recarga.</p>
            <p><strong>5.</strong> Detalhe o motivo da solicitação.</p>
            <p className="text-muted-foreground text-sm mt-4">
              As solicitações são revisadas pelo setor responsável e serão processadas conforme a disponibilidade e urgência.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Componente para processar operações de adição de saldo
const FuelCardOperations: React.FC = () => {
  const [approvedRequests, setApprovedRequests] = useState<FuelCardRequestHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<FuelCardRequestHistory | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm({
    resolver: zodResolver(cardOperationSchema),
    defaultValues: {
      requestId: '',
      operationDate: new Date().toISOString().split('T')[0],
      confirmationCode: '',
      operationNotes: ''
    }
  });

  useEffect(() => {
    const fetchApprovedRequests = async () => {
      try {
        setLoading(true);
        // Buscar solicitações aprovadas que ainda não foram processadas
        const response = await apiRequest('GET', '/api/fuel-card/approved');
        const data = await response.json();
        
        if (data.success) {
          setApprovedRequests(data.data);
        } else {
          toast({
            title: 'Erro ao carregar solicitações',
            description: data.message || 'Não foi possível carregar as solicitações aprovadas',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Erro ao buscar solicitações aprovadas:', error);
        toast({
          title: 'Erro ao carregar solicitações',
          description: 'Não foi possível carregar as solicitações aprovadas',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedRequests();
  }, [toast]);

  const handleSelectRequest = (request: FuelCardRequestHistory) => {
    setSelectedRequest(request);
    form.setValue('requestId', request.id.toString());
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: any) => {
    if (!selectedRequest) return;
    
    try {
      setIsProcessing(true);
      
      const operationData = {
        requestId: parseInt(data.requestId),
        operationDate: data.operationDate,
        confirmationCode: data.confirmationCode,
        operationNotes: data.operationNotes,
        processedBy: user?.name
      };
      
      const response = await apiRequest('POST', '/api/fuel-card/process', operationData);
      const responseData = await response.json();
      
      if (responseData.success) {
        toast({
          title: 'Operação registrada',
          description: 'A recarga do cartão foi registrada com sucesso',
        });
        
        // Atualizar a lista de solicitações aprovadas
        setApprovedRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
        setIsDialogOpen(false);
        form.reset();
      } else {
        toast({
          title: 'Erro ao registrar operação',
          description: responseData.message || 'Não foi possível registrar a operação',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao processar operação:', error);
      toast({
        title: 'Erro ao registrar operação',
        description: 'Ocorreu um erro ao registrar a operação',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (approvedRequests.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Não há solicitações aprovadas pendentes de processamento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Cartões Aprovados Pendentes de Recarga</CardTitle>
          <CardDescription>
            Registre aqui as operações de adição de saldo realizadas nos cartões de abastecimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Veículo</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cartão</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitante</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Aprovação</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {approvedRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{request.plate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{request.cardNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{formatCurrency(request.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{request.requestedBy}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{request.approvedAt ? formatDate(request.approvedAt) : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button size="sm" onClick={() => handleSelectRequest(request)}>
                        <DollarSign className="h-4 w-4 mr-1" />
                        Registrar Recarga
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Operação de Recarga</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p><strong>Veículo:</strong> {selectedRequest.plate}</p>
              <p><strong>Cartão:</strong> {selectedRequest.cardNumber}</p>
              <p><strong>Valor:</strong> {formatCurrency(selectedRequest.amount)}</p>
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="operationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Operação</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmationCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Confirmação</FormLabel>
                    <FormControl>
                      <Input placeholder="Código de confirmação da operação" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="operationNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações (opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observações sobre a operação"
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isProcessing}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={isProcessing}
                >
                  {isProcessing && (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  )}
                  Confirmar Recarga
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Componente para aprovação/rejeição de solicitações (somente para administradores)
const FuelCardApproval: React.FC = () => {
  const [pendingRequests, setPendingRequests] = useState<FuelCardRequestHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<FuelCardRequestHistory | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('GET', '/api/fuel-card/pending');
        const data = await response.json();
        
        if (data.success) {
          setPendingRequests(data.data);
        } else {
          toast({
            title: 'Erro ao carregar solicitações',
            description: data.message || 'Não foi possível carregar as solicitações pendentes',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Erro ao buscar solicitações pendentes:', error);
        toast({
          title: 'Erro ao carregar solicitações',
          description: 'Não foi possível carregar as solicitações pendentes',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'admin' || user?.role === 'gestor') {
      fetchPendingRequests();
    }
  }, [toast, user]);

  const handleApproval = async (requestId: number, approve: boolean) => {
    try {
      setIsProcessing(true);
      
      const endpoint = approve 
        ? `/api/fuel-card/${requestId}/approve` 
        : `/api/fuel-card/${requestId}/reject`;
      
      const requestData = approve 
        ? { approvedBy: user?.name } 
        : { rejectedBy: user?.name, rejectionReason };
      
      const response = await apiRequest('POST', endpoint, requestData);
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: approve ? 'Solicitação aprovada' : 'Solicitação rejeitada',
          description: approve 
            ? 'A solicitação de recarga foi aprovada com sucesso' 
            : 'A solicitação de recarga foi rejeitada',
        });
        
        // Atualiza a lista removendo a solicitação processada
        setPendingRequests(pendingRequests.filter(req => req.id !== requestId));
        setIsDialogOpen(false);
        setRejectionReason('');
        setSelectedRequest(null);
      } else {
        toast({
          title: 'Erro ao processar solicitação',
          description: data.message || 'Não foi possível processar a solicitação',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao processar solicitação:', error);
      toast({
        title: 'Erro ao processar solicitação',
        description: 'Ocorreu um erro ao processar a solicitação',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  // Se o usuário não tem permissão para aprovação
  if (user?.role !== 'admin' && user?.role !== 'gestor') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Área restrita</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Somente administradores ou gestores podem aprovar solicitações de recarga.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (pendingRequests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aprovações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Não há solicitações pendentes de aprovação.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Solicitações Pendentes</h3>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="rejectionReason">Motivo da Rejeição</Label>
              <Textarea 
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Informe o motivo da rejeição"
                className="resize-none mt-1"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => selectedRequest && handleApproval(selectedRequest.id, false)}
                disabled={isProcessing || !rejectionReason.trim()}
              >
                {isProcessing ? 'Processando...' : 'Confirmar Rejeição'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Veículo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cartão</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitante</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pendingRequests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm">{request.plate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{request.cardNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{formatCurrency(request.amount)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{request.requestedBy}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(request.requestedAt)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{request.baseName || '-'}</td>
                <td className="px-6 py-4 text-sm max-w-xs truncate">{request.reason}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => handleApproval(request.id, true)}
                      disabled={isProcessing}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => {
                        setSelectedRequest(request);
                        setIsDialogOpen(true);
                      }}
                      disabled={isProcessing}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Componente para relatórios de consumo das operações
const ConsumptionReports: React.FC = () => {
  const [reports, setReports] = useState<ConsumptionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    base: '',
    fuelType: '',
    project: '',
    searchTerm: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchConsumptionReports();
  }, [filters]);

  const fetchConsumptionReports = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await apiRequest('GET', `/api/fuel-consumption-reports?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        setReports(data.data);
      } else {
        toast({
          title: 'Erro ao carregar relatórios',
          description: data.message || 'Não foi possível carregar os relatórios de consumo',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
      toast({
        title: 'Erro ao carregar relatórios',
        description: 'Não foi possível carregar os relatórios de consumo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Placa', 'Base', 'Projeto', 'Período', 'Total Litros', 'Total Valor', 'Nº Abastecimentos', 'Média Consumo', 'Combustível'],
      ...reports.map(report => [
        report.placa,
        report.base_name,
        report.projeto,
        report.periodo,
        report.total_litros,
        report.total_valor,
        report.numero_abastecimentos,
        report.media_consumo,
        report.tipo_combustivel
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_consumo_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Relatórios de Consumo das Operações</h3>
        <Button onClick={exportToCSV} variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros de Pesquisa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Data Inicial</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateTo">Data Final</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fuelType">Combustível</Label>
              <Select value={filters.fuelType} onValueChange={(value) => setFilters(prev => ({ ...prev, fuelType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="arla">Arla</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="project">Projeto</Label>
              <Input
                id="project"
                placeholder="Nome do projeto"
                value={filters.project}
                onChange={(e) => setFilters(prev => ({ ...prev, project: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="base">Base</Label>
              <Input
                id="base"
                placeholder="Nome da base"
                value={filters.base}
                onChange={(e) => setFilters(prev => ({ ...prev, base: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="searchTerm">Buscar Placa</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="searchTerm"
                  placeholder="Placa do veículo"
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button 
              variant="outline" 
              onClick={() => setFilters({ dateFrom: '', dateTo: '', base: '', fuelType: '', project: '', searchTerm: '' })}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Resumidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Veículos</p>
                <p className="text-xl font-bold">{reports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Gasto</p>
                <p className="text-xl font-bold">
                  {formatCurrency(reports.reduce((sum, r) => sum + r.total_valor, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Litros</p>
                <p className="text-xl font-bold">
                  {reports.reduce((sum, r) => sum + r.total_litros, 0).toLocaleString('pt-BR')} L
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <History className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Abastecimentos</p>
                <p className="text-xl font-bold">
                  {reports.reduce((sum, r) => sum + r.numero_abastecimentos, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Relatórios */}
      {reports.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Nenhum dado encontrado para os filtros aplicados.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento por Veículo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projeto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Combustível</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Litros</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abastecimentos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Média Consumo</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {report.placa}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.base_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.projeto}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          report.tipo_combustivel === 'diesel' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {report.tipo_combustivel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.total_litros.toLocaleString('pt-BR')} L
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(report.total_valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.numero_abastecimentos}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.media_consumo.toFixed(2)} km/L
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Página principal do Cartão de Abastecimento - Updated v3.0
const FuelCardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('request');
  const { toast } = useToast();
  
  console.log('FuelCardPage - User data:', user);
  console.log('FuelCardPage - Component rendering at:', new Date().toISOString());
  
  // Forçar re-render para debug
  const [forceUpdate, setForceUpdate] = useState(0);
  
  useEffect(() => {
    console.log('FuelCardPage mounted/updated');
    setForceUpdate(prev => prev + 1);
  }, [user]);
  
  const handleExportExcel = async () => {
    try {
      const response = await apiRequest('GET', '/api/fuel-consumption-reports?format=excel');
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        // Criar CSV dos dados
        const csvContent = [
          ['Placa', 'Base', 'Projeto', 'Período', 'Total Litros', 'Total Valor', 'Nº Abastecimentos', 'Média Consumo', 'Combustível'],
          ...data.data.map((report: any) => [
            report.placa,
            report.base_name,
            report.projeto,
            report.periodo,
            report.total_litros,
            report.total_valor,
            report.numero_abastecimentos,
            report.media_consumo,
            report.tipo_combustivel
          ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a') as HTMLAnchorElement;
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `relatorio_consumo_completo_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: 'Relatório exportado com sucesso',
          description: 'O arquivo foi baixado para seu computador',
        });
      } else {
        toast({
          title: 'Nenhum dado encontrado',
          description: 'Não há dados de consumo disponíveis para exportar',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast({
        title: 'Erro ao exportar relatório',
        description: 'Não foi possível gerar o arquivo de relatório',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="w-full mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight">
              <CreditCard className="inline-block mr-2" />
              Cartão de Abastecimento
            </h1>
            
            {/* BOTÕES FORÇADOS - SEMPRE VISÍVEIS */}
            <div 
              className="flex gap-3 p-3" 
              style={{
                backgroundColor: '#ff0000', 
                border: '3px solid #000', 
                borderRadius: '8px',
                minWidth: '300px',
                minHeight: '60px',
                zIndex: 9999,
                position: 'relative'
              }}
            >
              <div 
                style={{
                  backgroundColor: '#0066cc',
                  color: 'white',
                  padding: '10px 15px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: '2px solid white'
                }}
                onClick={() => {
                  console.log('BOTÃO RELATÓRIOS CLICADO!');
                  setActiveTab('reports');
                }}
              >
                📊 VER RELATÓRIOS
              </div>
              
              <div 
                style={{
                  backgroundColor: '#00aa00',
                  color: 'white',
                  padding: '10px 15px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: '2px solid white'
                }}
                onClick={handleExportExcel}
              >
                📄 BAIXAR EXCEL
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="request">
              <Plus className="w-4 h-4 mr-2" />
              Solicitar Recarga
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              Histórico
            </TabsTrigger>
            {(user?.role === 'admin' || user?.role === 'gestor') && (
              <TabsTrigger value="approval">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Aprovações
              </TabsTrigger>
            )}
            {(user?.role === 'admin' || user?.role === 'gestor') && (
              <TabsTrigger value="operations">
                <DollarSign className="w-4 h-4 mr-2" />
                Operações
              </TabsTrigger>
            )}
            {(user?.role === 'admin' || user?.role === 'gestor') && (
              <TabsTrigger value="reports">
                <BarChart3 className="w-4 h-4 mr-2" />
                Relatórios
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="request" className="space-y-4">
            <FuelCardRequestForm />
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            <FuelCardHistory />
          </TabsContent>
          
          {(user?.role === 'admin' || user?.role === 'gestor') && (
            <TabsContent value="approval" className="space-y-4">
              <FuelCardApproval />
            </TabsContent>
          )}
          
          {(user?.role === 'admin' || user?.role === 'gestor') && (
            <TabsContent value="operations" className="space-y-4">
              <FuelCardOperations />
            </TabsContent>
          )}
          
          {(user?.role === 'admin' || user?.role === 'gestor') && (
            <TabsContent value="reports" className="space-y-4">
              <ConsumptionReports />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default FuelCardPage;