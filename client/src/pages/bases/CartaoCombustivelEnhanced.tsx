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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  DollarSign,
  User,
  Phone,
  MapPin,
  Gauge
} from 'lucide-react';
import { useLocation } from 'wouter';
import BaseCampinasLayout from '@/components/layouts/BaseCampinasLayout';

// Interfaces
interface FuelCardRequest {
  id: number;
  plate: string;
  odometer: number;
  cardNumber: string;
  cardType: 'vinculado' | 'especifico';
  amount: number;
  provider: string;
  fuelType: string;
  driverName: string;
  driverPhone: string;
  projectId: number;
  projectName: string;
  baseId: number;
  baseName: string;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'processado';
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
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

interface Project {
  id: number;
  name: string;
  description?: string;
}

interface Base {
  id: number;
  name: string;
  description?: string;
}

// Esquemas de validação
const fuelCardRequestSchema = z.object({
  plate: z.string().min(7, { message: 'Placa deve ter pelo menos 7 caracteres' }),
  odometer: z.number().min(0, { message: 'Quilometragem deve ser um número positivo' }),
  cardType: z.enum(['vinculado', 'especifico'], { message: 'Tipo de cartão é obrigatório' }),
  cardNumber: z.string().min(1, { message: 'Número do cartão é obrigatório' }),
  amount: z.number().min(10, { message: 'Valor mínimo é R$ 10,00' }).max(5000, { message: 'Valor máximo é R$ 5.000,00' }),
  provider: z.string().min(1, { message: 'Provedor do cartão é obrigatório' }),
  fuelType: z.string().min(1, { message: 'Tipo de combustível é obrigatório' }),
  driverName: z.string().min(2, { message: 'Nome do motorista é obrigatório' }),
  driverPhone: z.string().min(10, { message: 'Telefone deve ter pelo menos 10 dígitos' }),
  projectId: z.number().min(1, { message: 'Projeto é obrigatório' }),
  baseId: z.number().min(1, { message: 'Base é obrigatória' }),
  reason: z.string().min(10, { message: 'Observações devem ter pelo menos 10 caracteres' }),
});

type FuelCardRequestFormData = z.infer<typeof fuelCardRequestSchema>;

interface CartaoCombustivelProps {
  baseId: number;
  baseName: string;
}

const CartaoCombustivelEnhanced: React.FC<CartaoCombustivelProps> = ({ baseId, baseName }) => {
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
      odometer: 0,
      cardType: 'vinculado',
      cardNumber: '',
      amount: 0,
      provider: '',
      fuelType: '',
      driverName: '',
      driverPhone: '',
      projectId: 0,
      baseId: baseId,
      reason: '',
    },
  });

  // Queries
  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['/api/fuel-card/requests', baseId],
    queryFn: () => apiRequest(`/api/fuel-card/requests?baseId=${baseId}`),
  });

  const { data: fuelCards, isLoading: cardsLoading } = useQuery({
    queryKey: ['/api/fuel-cards', baseId],
    queryFn: () => apiRequest(`/api/fuel-cards?baseId=${baseId}`),
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: () => apiRequest('/api/projects'),
  });

  const { data: bases, isLoading: basesLoading } = useQuery({
    queryKey: ['/api/bases'],
    queryFn: () => apiRequest('/api/bases'),
  });

  // Mutations
  const createRequestMutation = useMutation({
    mutationFn: (data: FuelCardRequestFormData) => 
      apiRequest('/api/fuel-card/request', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          requestedBy: user?.name || 'Sistema',
          baseId: baseId,
        }),
      }),
    onSuccess: () => {
      toast({
        title: 'Solicitação criada',
        description: 'Sua solicitação de cartão combustível foi criada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/fuel-card/requests'] });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar solicitação',
        description: error.message || 'Ocorreu um erro ao criar a solicitação.',
        variant: 'destructive',
      });
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: number; action: 'approve' | 'reject'; reason?: string }) =>
      apiRequest(`/api/fuel-card/request/${id}/${action}`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      toast({
        title: 'Solicitação atualizada',
        description: 'Status da solicitação foi atualizado com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/fuel-card/requests'] });
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar solicitação',
        description: error.message || 'Ocorreu um erro ao atualizar a solicitação.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FuelCardRequestFormData) => {
    createRequestMutation.mutate(data);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      aprovado: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejeitado: { color: 'bg-red-100 text-red-800', icon: XCircle },
      processado: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  return (
    <BaseCampinasLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/bases/campinas')}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="text-blue-600" size={28} />
                Cartão Combustível - {baseName}
              </h1>
              <p className="text-gray-600">Gerenciamento de solicitações de cartão combustível</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus size={16} className="mr-2" />
                Nova Solicitação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="bg-blue-50 -mx-6 -mt-6 px-6 py-4 border-b">
                <DialogTitle className="flex items-center gap-2 text-blue-800">
                  <CreditCard className="text-blue-600" size={20} />
                  Solicitação de Cartão
                </DialogTitle>
                <DialogDescription className="text-blue-700">
                  Preencha os dados para solicitar recarga de combustível
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
                  {/* Dados da Solicitação */}
                  <div className="bg-white rounded-lg">
                    <div className="bg-orange-50 p-4 rounded-t-lg border-l-4 border-orange-400">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <FileText className="text-orange-600" size={16} />
                        Dados da Solicitação
                      </h3>
                      <div className="text-sm text-gray-600">
                        Informe os dados do veículo e do cartão desejado
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="plate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 text-red-600 font-medium">
                                <Car size={14} />
                                Placa do Veículo
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="ABC1234"
                                  {...field}
                                  className="uppercase bg-blue-50 border-blue-200 focus:border-blue-400"
                                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                />
                              </FormControl>
                              <FormDescription className="text-xs text-gray-500">
                                Informe a placa sem traços ou espaços
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="odometer"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 text-gray-600 font-medium">
                                <Gauge size={14} />
                                Quilometragem
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="123456"
                                  {...field}
                                  className="bg-blue-50 border-blue-200 focus:border-blue-400"
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription className="text-xs text-gray-500">
                                KM atual do veículo
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 text-orange-600 font-medium">
                                <DollarSign size={14} />
                                Valor (R$)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="150.00"
                                  step="0.01"
                                  {...field}
                                  className="bg-blue-50 border-blue-200 focus:border-blue-400"
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription className="text-xs text-gray-500">
                                Valor em reais para carregar
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Tipo de Cartão */}
                      <div className="mt-6">
                        <FormField
                          control={form.control}
                          name="cardType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold mb-3 block">Tipo de Cartão</FormLabel>
                              <FormControl>
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      id="vinculado"
                                      value="vinculado"
                                      checked={field.value === 'vinculado'}
                                      onChange={() => field.onChange('vinculado')}
                                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <Label htmlFor="vinculado" className="text-sm font-medium">
                                      Cartão vinculado à placa do veículo
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      id="especifico"
                                      value="especifico"
                                      checked={field.value === 'especifico'}
                                      onChange={() => field.onChange('especifico')}
                                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <Label htmlFor="especifico" className="text-sm font-medium">
                                      Cartão específico por número
                                    </Label>
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Provedor e Combustível */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <FormField
                          control={form.control}
                          name="provider"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-medium">Provedor do Cartão</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-blue-50 border-blue-200 focus:border-blue-400">
                                    <SelectValue placeholder="Ticket" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Ticket">Ticket</SelectItem>
                                  <SelectItem value="Alelo">Alelo</SelectItem>
                                  <SelectItem value="VR">VR</SelectItem>
                                  <SelectItem value="Shell">Shell</SelectItem>
                                  <SelectItem value="Ipiranga">Ipiranga</SelectItem>
                                  <SelectItem value="Petrobras">Petrobras</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-xs text-gray-500">
                                Empresa que fornece o cartão de combustível
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="fuelType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-medium">Tipo de Combustível</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-blue-50 border-blue-200 focus:border-blue-400">
                                    <SelectValue placeholder="Diesel" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Diesel">Diesel</SelectItem>
                                  <SelectItem value="Gasolina">Gasolina</SelectItem>
                                  <SelectItem value="Etanol">Etanol</SelectItem>
                                  <SelectItem value="GNV">GNV</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-xs text-gray-500">
                                Tipo de combustível para o veículo
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Dados do Motorista */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <FormField
                          control={form.control}
                          name="driverName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 font-medium">
                                <User size={14} />
                                Nome do Motorista
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="João da Silva"
                                  {...field}
                                  className="bg-blue-50 border-blue-200 focus:border-blue-400"
                                />
                              </FormControl>
                              <FormDescription className="text-xs text-gray-500">
                                Nome completo do motorista
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="driverPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 font-medium">
                                <Phone size={14} />
                                Celular (WhatsApp)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="(11) 99999-9999"
                                  {...field}
                                  className="bg-blue-50 border-blue-200 focus:border-blue-400"
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    field.onChange(value);
                                  }}
                                  value={formatPhone(field.value)}
                                />
                              </FormControl>
                              <FormDescription className="text-xs text-gray-500">
                                Para receber notificação quando aprovado
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Projeto e Base */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <FormField
                          control={form.control}
                          name="projectId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-medium">Projeto</FormLabel>
                              <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger className="bg-blue-50 border-blue-200 focus:border-blue-400">
                                    <SelectValue placeholder="Selecione um projeto" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {projects?.data?.map((project: Project) => (
                                    <SelectItem key={project.id} value={project.id.toString()}>
                                      {project.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-xs text-gray-500">
                                Selecione o projeto para esta solicitação
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="baseId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-medium">Base</FormLabel>
                              <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger className="bg-blue-50 border-blue-200 focus:border-blue-400">
                                    <SelectValue placeholder="Selecione um projeto primeiro" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {bases?.data?.map((base: Base) => (
                                    <SelectItem key={base.id} value={base.id.toString()}>
                                      {base.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-xs text-gray-500">
                                Base onde o veículo está alocado
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Observações */}
                      <FormField
                        control={form.control}
                        name="reason"
                        render={({ field }) => (
                          <FormItem className="mt-6">
                            <FormLabel className="font-medium">Observações (opcional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Informe detalhes adicionais, se necessário"
                                className="resize-none bg-blue-50 border-blue-200 focus:border-blue-400 min-h-[100px]"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Botões */}
                      <div className="flex flex-col gap-3 mt-8">
                        <Button 
                          type="submit" 
                          disabled={createRequestMutation.isPending}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          {createRequestMutation.isPending ? 'Enviando...' : 'Solicitar Recarga'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          className="w-full border-blue-300 text-blue-600 py-3 text-base"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="requests">Solicitações</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="cards">Cartões</TabsTrigger>
          </TabsList>
          
          <TabsContent value="requests" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="text-blue-600" size={20} />
                  Solicitações Pendentes
                </CardTitle>
                <CardDescription>
                  Solicitações aguardando aprovação
                </CardDescription>
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">Carregando solicitações...</div>
                  </div>
                ) : requests?.data?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma solicitação encontrada
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Placa</TableHead>
                          <TableHead>Motorista</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Combustível</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requests?.data?.map((request: FuelCardRequest) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">{request.plate}</TableCell>
                            <TableCell>{request.driverName}</TableCell>
                            <TableCell>{formatCurrency(request.amount)}</TableCell>
                            <TableCell>{request.fuelType}</TableCell>
                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                            <TableCell>{formatDate(request.requestedAt)}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedRequest(request)}
                              >
                                <Eye size={14} className="mr-1" />
                                Ver
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="text-blue-600" size={20} />
                  Histórico de Solicitações
                </CardTitle>
                <CardDescription>
                  Todas as solicitações processadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Conteúdo do histórico similar ao tab de requests */}
                <div className="text-center py-8 text-gray-500">
                  Histórico será carregado aqui
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="cards" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="text-blue-600" size={20} />
                  Cartões Disponíveis
                </CardTitle>
                <CardDescription>
                  Cartões combustível ativos na base
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cardsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">Carregando cartões...</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {fuelCards?.data?.map((card: FuelCard) => (
                      <Card key={card.id} className="border-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <CreditCard className="text-blue-600" size={20} />
                            {card.cardType}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Cartão:</span>
                            <span className="font-medium">{card.cardNumber}</span>
                          </div>
                          {card.plate && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Placa:</span>
                              <span className="font-medium">{card.plate}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Saldo:</span>
                            <span className="font-bold text-green-600">
                              {formatCurrency(card.currentBalance)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Status:</span>
                            <Badge variant={card.status === 'ativo' ? 'default' : 'secondary'}>
                              {card.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </BaseCampinasLayout>
  );
};

export default CartaoCombustivelEnhanced;