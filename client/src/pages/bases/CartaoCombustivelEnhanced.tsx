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
  Gauge,
  FileText,
  Car,
  Building
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
  specificCardData: z.string().optional(),
  amount: z.number().min(10, { message: 'Valor mínimo é R$ 10,00' }).max(5000, { message: 'Valor máximo é R$ 5.000,00' }),
  provider: z.string().min(1, { message: 'Provedor do cartão é obrigatório' }),
  fuelType: z.string().min(1, { message: 'Tipo de combustível é obrigatório' }),
  fuelTime: z.string().min(1, { message: 'Horário de abastecimento é obrigatório' }),
  driverName: z.string().min(2, { message: 'Nome do motorista é obrigatório' }),
  driverPhone: z.string().min(10, { message: 'Telefone deve ter pelo menos 10 dígitos' }),
  projectId: z.number().min(1, { message: 'Projeto é obrigatório' }),
  baseId: z.number().min(1, { message: 'Base é obrigatória' }),
  reason: z.string().min(1, { message: 'Observações são obrigatórias' }),
}).refine((data) => {
  // Se cartão específico for selecionado, o campo specificCardData deve ser preenchido
  if (data.cardType === 'especifico') {
    return data.specificCardData && data.specificCardData.trim().length > 0;
  }
  return true;
}, {
  message: 'Dados específicos do cartão são obrigatórios quando "Cartão específico por número" é selecionado',
  path: ['specificCardData'],
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
  
  // Debug: Verificar se está autenticado
  useEffect(() => {
    console.log('[FUEL-CARD-ENHANCED] Verificando autenticação...');
    console.log('[FUEL-CARD-ENHANCED] Usuário:', user);
    console.log('[FUEL-CARD-ENHANCED] BaseId:', baseId);
    console.log('[FUEL-CARD-ENHANCED] BaseName:', baseName);
    
    if (!user) {
      console.log('[FUEL-CARD-ENHANCED] Usuário não autenticado, redirecionando para login...');
      navigate('/login');
      return;
    }
  }, [user, baseId, baseName, navigate]);

  // Form para nova solicitação
  const form = useForm<FuelCardRequestFormData>({
    resolver: zodResolver(fuelCardRequestSchema),
    defaultValues: {
      plate: '',
      odometer: 0,
      cardType: 'vinculado',
      cardNumber: '',
      specificCardData: '',
      amount: 0,
      provider: '',
      fuelType: '',
      fuelTime: '',
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
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/fuel-card/requests?baseId=${baseId}`);
      return response.json();
    },
  });

  const { data: fuelCards, isLoading: cardsLoading } = useQuery({
    queryKey: ['/api/fuel-cards', baseId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/fuel-cards?baseId=${baseId}`);
      return response.json();
    },
  });

  const { data: projects, isLoading: projectsLoading, error: projectsError } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/projects');
      return response.json();
    },
  });

  const { data: bases, isLoading: basesLoading, error: basesError } = useQuery({
    queryKey: ['/api/bases'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/bases');
      return response.json();
    },
  });

  const { data: projectBases, isLoading: projectBasesLoading, error: projectBasesError } = useQuery({
    queryKey: ['/api/project-bases'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/project-bases');
      return response.json();
    },
  });

  // Debug logging to see what data is being returned
  console.log('Projects data:', projects);
  console.log('Projects error:', projectsError);
  console.log('Projects loading:', projectsLoading);
  console.log('Bases data:', bases);
  console.log('Bases error:', basesError);
  console.log('Bases loading:', basesLoading);
  console.log('Project-Bases data:', projectBases);
  console.log('Project-Bases error:', projectBasesError);
  console.log('Project-Bases loading:', projectBasesLoading);

  // Watch for project selection changes
  const selectedProjectId = form.watch('projectId');
  
  // Filter bases based on selected project
  const filteredBases = React.useMemo(() => {
    if (!bases?.data || !selectedProjectId || !projectBases?.data) {
      return bases?.data || [];
    }
    
    // Get base IDs that belong to the selected project
    const projectBaseIds = projectBases.data
      .filter((pb: any) => pb.project_id === selectedProjectId && pb.base_id)
      .map((pb: any) => pb.base_id);
    
    // Also check for base names that match (fallback)
    const projectBaseNames = projectBases.data
      .filter((pb: any) => pb.project_id === selectedProjectId)
      .map((pb: any) => pb.base_name);
    
    // Filter bases that belong to the selected project
    return bases.data.filter((base: Base) => {
      return projectBaseIds.includes(base.id) || projectBaseNames.includes(base.name);
    });
  }, [bases?.data, selectedProjectId, projectBases?.data]);

  // Reset base selection when project changes
  React.useEffect(() => {
    if (selectedProjectId) {
      form.setValue('baseId', 0); // Reset base selection
    }
  }, [selectedProjectId, form]);

  // Atualizar o campo cardNumber quando a placa ou tipo de cartão mudar
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'plate' || name === 'cardType') {
        if (value.cardType === 'vinculado' && value.plate) {
          form.setValue('cardNumber', value.plate);
        } else if (value.cardType === 'especifico') {
          form.setValue('cardNumber', '');
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  // Mutations
  const createRequestMutation = useMutation({
    mutationFn: async (data: FuelCardRequestFormData) => {
      console.log('[FUEL-CARD-MUTATION] Dados sendo enviados:', {
        ...data,
        requestedBy: user?.name || 'Sistema',
        baseId: baseId,
      });
      
      const response = await apiRequest('POST', '/api/fuel-card/request', {
        ...data,
        requestedBy: user?.name || 'Sistema',
        baseId: baseId,
      });
      
      console.log('[FUEL-CARD-MUTATION] Resposta do servidor:', response.status);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Solicitação enviada com sucesso!',
        description: 'Sua solicitação foi enviada e está aguardando retorno da gestão de combustível. Você será notificado quando houver uma resposta.',
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
    mutationFn: async ({ id, action, reason }: { id: number; action: 'approve' | 'reject'; reason?: string }) => {
      const response = await apiRequest('POST', `/api/fuel-card/request/${id}/${action}`, { reason });
      return response.json();
    },
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
    console.log('[FUEL-CARD-FORM] ===== INÍCIO DA SUBMISSÃO =====');
    console.log('[FUEL-CARD-FORM] Dados do formulário:', data);
    console.log('[FUEL-CARD-FORM] Usuário autenticado:', user);
    console.log('[FUEL-CARD-FORM] Base ID:', baseId);
    console.log('[FUEL-CARD-FORM] Form errors:', form.formState.errors);
    console.log('[FUEL-CARD-FORM] Form is valid:', form.formState.isValid);
    
    // Se o cartão for vinculado à placa, usar a placa como número do cartão
    if (data.cardType === 'vinculado') {
      data.cardNumber = data.plate;
      console.log('[FUEL-CARD-FORM] Cartão vinculado: usando placa como número do cartão:', data.cardNumber);
    }
    
    // Verificar se todos os campos obrigatórios estão preenchidos
    const requiredFields = ['plate', 'cardNumber', 'amount', 'reason', 'provider', 'fuelType', 'fuelTime', 'driverName', 'driverPhone', 'projectId', 'baseId'];
    const missingFields = requiredFields.filter(field => {
      const value = data[field as keyof FuelCardRequestFormData];
      return !value || value === 0 || value === '';
    });
    
    console.log('[FUEL-CARD-FORM] Campos obrigatórios faltando:', missingFields);
    
    if (missingFields.length > 0) {
      toast({
        title: 'Erro de validação',
        description: `Os seguintes campos são obrigatórios: ${missingFields.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }
    
    // Validação especial para cartão específico
    if (data.cardType === 'especifico' && (!data.specificCardData || data.specificCardData.trim().length === 0)) {
      toast({
        title: 'Erro de validação',
        description: 'Dados específicos do cartão são obrigatórios quando "Cartão específico por número" é selecionado.',
        variant: 'destructive',
      });
      return;
    }
    
    console.log('[FUEL-CARD-FORM] Validações passaram, executando mutação...');
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

  const formatPhone = (phone: string | undefined | null) => {
    if (!phone || typeof phone !== 'string') return '';
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

                      {/* Campo de número do cartão - condicional baseado no tipo */}
                      <div className="mt-4">
                        <FormField
                          control={form.control}
                          name="cardNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 text-red-600 font-medium">
                                <CreditCard size={14} />
                                {form.watch('cardType') === 'vinculado' ? 'Placa do Veículo (Cartão)' : 'Número do Cartão'}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={form.watch('cardType') === 'vinculado' ? 'Placa será usada automaticamente' : 'Ex: 1234567890123456'}
                                  {...field}
                                  value={form.watch('cardType') === 'vinculado' ? form.watch('plate') : field.value}
                                  readOnly={form.watch('cardType') === 'vinculado'}
                                  className={`${form.watch('cardType') === 'vinculado' ? 'bg-gray-100' : 'bg-blue-50'} border-blue-200 focus:border-blue-400`}
                                />
                              </FormControl>
                              <FormDescription className="text-xs text-gray-500">
                                {form.watch('cardType') === 'vinculado' 
                                  ? 'Para cartão vinculado, a placa do veículo será usada automaticamente' 
                                  : 'Digite o número do cartão específico'}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Campo condicional para dados específicos do cartão */}
                      {form.watch('cardType') === 'especifico' && (
                        <div className="mt-4">
                          <FormField
                            control={form.control}
                            name="specificCardData"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base font-medium">Dados específicos do cartão</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Digite os dados específicos do cartão (número, código, etc.)"
                                    {...field}
                                    className="bg-blue-50 border-blue-200 focus:border-blue-400"
                                  />
                                </FormControl>
                                <FormDescription className="text-xs text-gray-500">
                                  Insira os dados específicos do cartão que será utilizado
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

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

                      {/* Horário de Abastecimento */}
                      <div className="mt-6">
                        <FormField
                          control={form.control}
                          name="fuelTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-medium">Horário de Abastecimento</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-blue-50 border-blue-200 focus:border-blue-400">
                                    <SelectValue placeholder="Selecione o horário" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Antes das 17h">Antes das 17h</SelectItem>
                                  <SelectItem value="Após as 18h">Após as 18h</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-xs text-gray-500">
                                Escolha o horário preferido para abastecimento
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
                                  {projectsLoading ? (
                                    <SelectItem value="loading" disabled>Carregando projetos...</SelectItem>
                                  ) : projects?.data?.length > 0 ? (
                                    projects.data.map((project: Project) => (
                                      <SelectItem key={project.id} value={project.id.toString()}>
                                        {project.name}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value="empty" disabled>Nenhum projeto encontrado</SelectItem>
                                  )}
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
                                  {basesLoading ? (
                                    <SelectItem value="loading" disabled>Carregando bases...</SelectItem>
                                  ) : selectedProjectId && filteredBases?.length > 0 ? (
                                    filteredBases.map((base: Base) => (
                                      <SelectItem key={base.id} value={base.id.toString()}>
                                        {base.name}
                                      </SelectItem>
                                    ))
                                  ) : selectedProjectId && filteredBases?.length === 0 ? (
                                    <SelectItem value="empty" disabled>Nenhuma base encontrada para este projeto</SelectItem>
                                  ) : !selectedProjectId ? (
                                    <SelectItem value="empty" disabled>Selecione um projeto primeiro</SelectItem>
                                  ) : (
                                    <SelectItem value="empty" disabled>Nenhuma base encontrada</SelectItem>
                                  )}
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
                            <FormLabel className="font-medium">Observações</FormLabel>
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
                          onClick={() => {
                            console.log('[FUEL-CARD-BUTTON] Botão clicado');
                            console.log('[FUEL-CARD-BUTTON] Form state:', form.formState);
                            console.log('[FUEL-CARD-BUTTON] Form values:', form.getValues());
                          }}
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

        {/* Modal de Detalhes da Solicitação */}
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="text-blue-600" size={20} />
                Detalhes da Solicitação
              </DialogTitle>
              <DialogDescription>
                Visualizar informações completas da solicitação de cartão combustível
              </DialogDescription>
            </DialogHeader>
            
            {selectedRequest && (
              <div className="space-y-6">
                {/* Informações do Veículo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Placa do Veículo</Label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-lg">{selectedRequest.plate}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Quilometragem</Label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{selectedRequest.odometer ? `${selectedRequest.odometer.toLocaleString()} km` : 'Não informado'}</span>
                    </div>
                  </div>
                </div>

                {/* Informações do Cartão */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Tipo de Cartão</Label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{selectedRequest.cardType === 'vinculado' ? 'Vinculado à Placa' : 'Específico por Número'}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Número do Cartão</Label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{selectedRequest.cardNumber}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Valor Solicitado</Label>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <span className="font-bold text-green-600">{formatCurrency(selectedRequest.amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Informações do Combustível */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Provedor do Cartão</Label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{selectedRequest.provider || 'Não informado'}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Tipo de Combustível</Label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{selectedRequest.fuelType || 'Não informado'}</span>
                    </div>
                  </div>
                </div>

                {/* Informações do Motorista */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Nome do Motorista</Label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{selectedRequest.driverName || 'Não informado'}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Telefone do Motorista</Label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{selectedRequest.driverPhone || 'Não informado'}</span>
                    </div>
                  </div>
                </div>

                {/* Informações do Projeto */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Projeto</Label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{selectedRequest.projectName || 'Não informado'}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Base</Label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{selectedRequest.baseName || 'Não informado'}</span>
                    </div>
                  </div>
                </div>

                {/* Status e Datas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {getStatusBadge(selectedRequest.status)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Data da Solicitação</Label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{formatDate(selectedRequest.requestedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Observações */}
                {selectedRequest.reason && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Observações</Label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{selectedRequest.reason}</span>
                    </div>
                  </div>
                )}

                {/* Informações de Processamento */}
                {(selectedRequest.approvedBy || selectedRequest.rejectedBy) && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-800 mb-3">Informações de Processamento</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedRequest.approvedBy && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Aprovado por</Label>
                          <div className="p-3 bg-green-50 rounded-lg">
                            <span className="font-medium text-green-700">{selectedRequest.approvedBy}</span>
                          </div>
                        </div>
                      )}
                      
                      {selectedRequest.rejectedBy && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Rejeitado por</Label>
                          <div className="p-3 bg-red-50 rounded-lg">
                            <span className="font-medium text-red-700">{selectedRequest.rejectedBy}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {selectedRequest.rejectionReason && (
                      <div className="space-y-2 mt-4">
                        <Label className="text-sm font-medium text-gray-600">Motivo da Rejeição</Label>
                        <div className="p-3 bg-red-50 rounded-lg">
                          <span className="font-medium text-red-700">{selectedRequest.rejectionReason}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedRequest(null)}
                className="w-full"
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </BaseCampinasLayout>
  );
};

export default CartaoCombustivelEnhanced;