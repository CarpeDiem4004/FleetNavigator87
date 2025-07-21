import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { 
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage 
} from '@/components/ui/form';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { 
  CreditCard, 
  Plus, 
  History, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Fuel,
  Eye,
  ExternalLink,
  Building,
  Send
} from 'lucide-react';

// Interfaces
interface FuelCardRequest {
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
  baseId: number;
  baseName: string;
}

interface FuelCard {
  id: number;
  cardNumber: string;
  cardType: string;
  plate?: string;
  currentBalance: number;
  lastUpdate: string;
  status: 'ativo' | 'inativo' | 'bloqueado';
}

// Esquemas de validação
const fuelCardRequestSchema = z.object({
  plate: z.string().min(7, { message: 'Placa deve ter pelo menos 7 caracteres' }),
  cardNumber: z.string().min(1, { message: 'Número do cartão é obrigatório' }),
  amount: z.number().min(10, { message: 'Valor mínimo é R$ 10,00' }).max(5000, { message: 'Valor máximo é R$ 5.000,00' }),
  reason: z.string().min(10, { message: 'Justificativa deve ter pelo menos 10 caracteres' }),
  requestedBy: z.string().min(2, { message: 'Nome do solicitante é obrigatório' }),
});

type FuelCardRequestFormData = z.infer<typeof fuelCardRequestSchema>;

const CartaoCombustivelCampinasExterno: React.FC = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FuelCardRequest | null>(null);

  // Form para nova solicitação
  const form = useForm<FuelCardRequestFormData>({
    resolver: zodResolver(fuelCardRequestSchema),
    defaultValues: {
      plate: '',
      cardNumber: '',
      amount: 0,
      reason: '',
      requestedBy: '',
    },
  });

  // Função para fazer requisições sem autenticação
  const makePublicRequest = async (method: string, endpoint: string, data?: any) => {
    const url = `${window.location.origin}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  };

  // Query para buscar solicitações da base Campinas (últimas 20)
  const { data: requests, isLoading: loadingRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['/api/public/fuel-card/campinas'],
    queryFn: async () => {
      try {
        const data = await makePublicRequest('GET', '/api/public/fuel-card/campinas');
        return data.success ? data.data : [];
      } catch (error) {
        console.error('Erro ao buscar solicitações:', error);
        return [];
      }
    },
  });

  // Query para buscar cartões disponíveis
  const { data: fuelCards, isLoading: loadingCards } = useQuery({
    queryKey: ['/api/public/fuel-cards/campinas'],
    queryFn: async () => {
      try {
        const data = await makePublicRequest('GET', '/api/public/fuel-cards/campinas');
        return data.success ? data.data : [];
      } catch (error) {
        console.error('Erro ao buscar cartões:', error);
        return [];
      }
    },
  });

  // Mutation para criar nova solicitação
  const createRequestMutation = useMutation({
    mutationFn: async (data: FuelCardRequestFormData) => {
      return await makePublicRequest('POST', '/api/public/fuel-card/request', {
        ...data,
        baseId: 2, // ID da base Campinas
        baseName: 'Base Campinas',
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Solicitação enviada com sucesso!',
          description: 'Sua solicitação de recarga foi enviada para aprovação da gestão.',
        });
        form.reset();
        setIsDialogOpen(false);
        refetchRequests();
      } else {
        toast({
          title: 'Erro ao enviar solicitação',
          description: data.message || 'Ocorreu um erro ao processar sua solicitação.',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Erro ao enviar solicitação',
        description: 'Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FuelCardRequestFormData) => {
    createRequestMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'aprovado':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'rejeitado':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      case 'processado':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Processado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCardStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'inativo':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inativo</Badge>;
      case 'bloqueado':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Bloqueado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center">
            <Building className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Cartão Combustível - Base Campinas
              </h1>
              <p className="text-gray-600 mt-1">
                Acesso externo para solicitações de recarga
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="request" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="request">Nova Solicitação</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="cards">Cartões</TabsTrigger>
          </TabsList>

          <TabsContent value="request" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Solicitação de Recarga
                </CardTitle>
                <CardDescription>
                  Preencha os dados para solicitar recarga do cartão combustível
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="plate"
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
                        name="cardNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Placa do Cartão</FormLabel>
                            <FormControl>
                              <Input placeholder="1234567890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor da Recarga (R$)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                min="10"
                                max="5000"
                                placeholder="100.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormDescription>
                              Valor entre R$ 10,00 e R$ 5.000,00
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="requestedBy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Solicitante</FormLabel>
                            <FormControl>
                              <Input placeholder="Seu nome completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Justificativa</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva o motivo da solicitação..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Explique detalhadamente o motivo da solicitação
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button type="submit" disabled={createRequestMutation.isPending} className="min-w-[200px]">
                        {createRequestMutation.isPending ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Enviar Solicitação
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  Histórico de Solicitações
                </CardTitle>
                <CardDescription>
                  Acompanhe o status das suas solicitações recentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRequests ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Carregando histórico...</p>
                  </div>
                ) : requests && requests.length > 0 ? (
                  <div className="space-y-4">
                    {requests.map((request: FuelCardRequest) => (
                      <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium text-lg">{request.plate}</span>
                            {getStatusBadge(request.status)}
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(request.requestedAt)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Cartão:</span>
                            <span className="ml-2 font-medium">{request.cardNumber}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Valor:</span>
                            <span className="ml-2 font-medium">{formatCurrency(request.amount)}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-600">Solicitado por:</span>
                            <span className="ml-2 font-medium">{request.requestedBy}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-600">Justificativa:</span>
                            <p className="mt-1 text-sm">{request.reason}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma solicitação encontrada</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cards" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Fuel className="w-5 h-5 mr-2" />
                  Cartões Disponíveis
                </CardTitle>
                <CardDescription>
                  Consulte o saldo atual dos cartões combustível
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingCards ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Carregando cartões...</p>
                  </div>
                ) : fuelCards && fuelCards.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {fuelCards.map((card: FuelCard) => (
                      <Card key={card.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-lg">{card.cardNumber}</h3>
                            {getCardStatusBadge(card.status)}
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tipo:</span>
                              <span className="font-medium">{card.cardType}</span>
                            </div>
                            {card.plate && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Placa:</span>
                                <span className="font-medium">{card.plate}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-600">Saldo:</span>
                              <span className="font-bold text-green-600">{formatCurrency(card.currentBalance)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Última atualização:</span>
                              <span className="text-xs text-gray-500">{formatDate(card.lastUpdate)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Fuel className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum cartão encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="border-t bg-white mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <ExternalLink className="w-4 h-4 mr-2" />
              Acesso Externo - Base Campinas
            </div>
            <div className="text-sm text-gray-500">
              Sistema de Gestão de Frotas
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartaoCombustivelCampinasExterno;