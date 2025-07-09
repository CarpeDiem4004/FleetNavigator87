import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { 
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage 
} from '@/components/ui/form';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
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
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Fuel,
  Eye,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useLocation } from 'wouter';
import BaseCampinasLayout from '@/components/layouts/BaseCampinasLayout';

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
  processedBy?: string;
  processedAt?: string;
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
});

type FuelCardRequestFormData = z.infer<typeof fuelCardRequestSchema>;

const CartaoCombustivelCampinas: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
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
    },
  });

  // Query para buscar solicitações da base Campinas
  const { data: requests, isLoading: loadingRequests } = useQuery({
    queryKey: ['/api/fuel-card', 'campinas', 2],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/fuel-card/base/2');
      const data = await response.json();
      return data.success ? data.data : [];
    },
  });

  // Query para buscar cartões disponíveis
  const { data: fuelCards, isLoading: loadingCards } = useQuery({
    queryKey: ['/api/fuel-cards', 'campinas'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/fuel-cards/base/2');
      const data = await response.json();
      return data.success ? data.data : [];
    },
  });

  // Mutation para criar nova solicitação
  const createRequestMutation = useMutation({
    mutationFn: async (data: FuelCardRequestFormData) => {
      const response = await apiRequest('POST', '/api/fuel-card/request', {
        ...data,
        baseId: 2, // ID da base Campinas
        baseName: 'Base Campinas',
        requestedBy: user?.name || 'Usuário',
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Solicitação enviada',
          description: 'Sua solicitação de recarga foi enviada para aprovação.',
        });
        form.reset();
        setIsDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ['/api/fuel-card'] });
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
        description: 'Ocorreu um erro ao processar sua solicitação.',
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
    <BaseCampinasLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/bases/campinas')}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Cartão Combustível - Base Campinas
            </h1>
            <p className="text-slate-600 mt-2">
              Gerenciamento de solicitações de recarga e histórico de cartões
            </p>
          </div>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="requests">Solicitações</TabsTrigger>
            <TabsTrigger value="cards">Cartões</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Solicitações de Recarga
                    </CardTitle>
                    <CardDescription>
                      Gerencie suas solicitações de recarga de cartão combustível
                    </CardDescription>
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Solicitação
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Nova Solicitação de Recarga</DialogTitle>
                        <DialogDescription>
                          Preencha os dados para solicitar recarga do cartão combustível
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                <FormLabel>Número do Cartão</FormLabel>
                                <FormControl>
                                  <Input placeholder="1234567890" {...field} />
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
                            name="reason"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Justificativa</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Descreva o motivo da solicitação..."
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button type="submit" disabled={createRequestMutation.isPending}>
                              {createRequestMutation.isPending ? 'Enviando...' : 'Enviar Solicitação'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loadingRequests ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Carregando solicitações...</p>
                  </div>
                ) : requests && requests.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Placa</TableHead>
                        <TableHead>Cartão</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((request: FuelCardRequest) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.plate}</TableCell>
                          <TableCell>{request.cardNumber}</TableCell>
                          <TableCell>{formatCurrency(request.amount)}</TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>{formatDate(request.requestedAt)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
                  Visualize o saldo e status dos cartões combustível
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingCards ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Carregando cartões...</p>
                  </div>
                ) : fuelCards && fuelCards.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {fuelCards.map((card: FuelCard) => (
                      <Card key={card.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{card.cardNumber}</h3>
                            {getCardStatusBadge(card.status)}
                          </div>
                          <div className="space-y-1 text-sm">
                            <p><strong>Tipo:</strong> {card.cardType}</p>
                            {card.plate && <p><strong>Placa:</strong> {card.plate}</p>}
                            <p><strong>Saldo:</strong> {formatCurrency(card.currentBalance)}</p>
                            <p className="text-gray-500">
                              <strong>Última atualização:</strong> {formatDate(card.lastUpdate)}
                            </p>
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

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  Histórico de Operações
                </CardTitle>
                <CardDescription>
                  Acompanhe todas as operações realizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Histórico será implementado em breve</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog para detalhes da solicitação */}
        {selectedRequest && (
          <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Detalhes da Solicitação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Placa</Label>
                    <p className="text-sm">{selectedRequest.plate}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Cartão</Label>
                    <p className="text-sm">{selectedRequest.cardNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Valor</Label>
                    <p className="text-sm">{formatCurrency(selectedRequest.amount)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Solicitado por</Label>
                    <p className="text-sm">{selectedRequest.requestedBy}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Data da Solicitação</Label>
                    <p className="text-sm">{formatDate(selectedRequest.requestedAt)}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Justificativa</Label>
                  <p className="text-sm mt-1">{selectedRequest.reason}</p>
                </div>
                {selectedRequest.rejectionReason && (
                  <div>
                    <Label className="text-sm font-medium text-red-500">Motivo da Rejeição</Label>
                    <p className="text-sm mt-1">{selectedRequest.rejectionReason}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </BaseCampinasLayout>
  );
};

export default CartaoCombustivelCampinas;