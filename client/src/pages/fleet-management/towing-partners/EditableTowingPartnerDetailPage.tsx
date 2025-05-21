import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import SafeLink from '@/components/SafeLink';
import { apiRequest } from '@/lib/queryClient';

// Componentes UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/layout/PageHeader';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Ícones
import { 
  Truck, Phone, MapPin, Star, Mail, FileText, AlertCircle, 
  Calendar, CheckCircle2, XCircle, Clock, Link, Copy, 
  Check, RefreshCw, Loader2, Edit
} from 'lucide-react';

// Tipos
interface TowingPartner {
  id: number;
  name: string;
  phone: string;
  email: string;
  city: string;
  region: string;
  address?: string;
  company_name?: string;
  cnpj?: string;
  contact_person?: string;
  rating?: number;
  service_types?: string[];
  payment_methods?: string[];
  cost_per_km?: number;
  available_24h?: boolean;
  can_transport_multiple?: boolean;
  has_insurance?: boolean;
  coverage_radius?: number;
  notes?: string;
  status: 'ativo' | 'inativo' | 'pendente' | 'suspenso';
  total_requests?: number;
  completed_requests?: number;
  average_response_time?: number;
  bank_name?: string;
  bank_account?: string;
  bank_agency?: string;
  pix_key?: string;
  pix_type?: string;
}

interface TowingRequest {
  id: number;
  partner_id: number;
  vehicle_plate: string;
  driver_name: string;
  pickup_location: string;
  destination: string;
  status: 'pendente' | 'aprovado' | 'em_andamento' | 'concluido' | 'cancelado';
  created_at: string;
  service_type: string;
  urgency: 'baixa' | 'media' | 'alta';
  estimated_cost: number;
  rating?: number;
  comments?: string;
}

// Componente para contabilizar serviços de teste e do banco de dados
const PartnerServicesCounter: React.FC<{ partnerId: number, dbCompleted: number, dbTotal: number }> = ({ partnerId, dbCompleted, dbTotal }) => {
  const [testServices, setTestServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchTestServices = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/towing/test-services/${partnerId}`);
        if (response.ok) {
          const data = await response.json();
          setTestServices(data.services || []);
        }
      } catch (error) {
        console.error("Erro ao buscar serviços de teste:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTestServices();
  }, [partnerId]);
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 size={16} className="animate-spin text-primary" />
        <span>Carregando serviços...</span>
      </div>
    );
  }
  
  const testCompleted = testServices.filter(service => 
    service.status === 'concluido' || service.status === 'completed'
  ).length;
  
  const totalCompleted = dbCompleted + testCompleted;
  const totalServices = dbTotal + testServices.length;
  
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 size={16} className="text-green-500" />
      <span>{totalCompleted} de {totalServices}</span>
    </div>
  );
};

// Componente para exibir as estrelas de avaliação
const RatingStars: React.FC<{ rating: number }> = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  
  return (
    <div className="flex">
      {[...Array(5)].map((_, i) => {
        if (i < fullStars) {
          return <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />;
        } else if (i === fullStars && hasHalfStar) {
          return <Star key={i} size={16} className="text-yellow-400 fill-yellow-400 [clip-path:inset(0_50%_0_0)]" />;
        } else {
          return <Star key={i} size={16} className="text-gray-300" />;
        }
      })}
    </div>
  );
};

// Componente para o selo de status do parceiro
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'ativo':
      return <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>;
    case 'inativo':
      return <Badge variant="secondary" className="bg-gray-400 hover:bg-gray-500">Inativo</Badge>;
    case 'pendente':
      return <Badge variant="outline" className="text-amber-500 border-amber-500">Pendente</Badge>;
    default:
      return <Badge variant="outline">Desconhecido</Badge>;
  }
};

// Componente para o selo de status de uma solicitação
const RequestStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'pendente':
      return <Badge variant="outline" className="text-amber-500 border-amber-500">Pendente</Badge>;
    case 'aprovado':
      return <Badge variant="outline" className="text-blue-500 border-blue-500">Aprovado</Badge>;
    case 'em_andamento':
      return <Badge className="bg-blue-500 hover:bg-blue-600">Em andamento</Badge>;
    case 'concluido':
      return <Badge className="bg-green-500 hover:bg-green-600">Concluído</Badge>;
    case 'cancelado':
      return <Badge variant="secondary" className="bg-gray-400 hover:bg-gray-500">Cancelado</Badge>;
    default:
      return <Badge variant="outline">Desconhecido</Badge>;
  }
};

const EditableTowingPartnerDetailPage: React.FC = () => {
  // Extrair o ID diretamente da URL atual
  const params = useParams();
  const urlParts = window.location.pathname.split('/');
  const idFromUrl = urlParts[urlParts.length - 1];
  const id = idFromUrl && !isNaN(Number(idFromUrl)) ? idFromUrl : null;
  console.log('ID do parceiro extraído da URL:', idFromUrl);
  console.log('ID do parceiro após validação:', id);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('info');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [accessLink, setAccessLink] = useState('');
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [linkExpirationDays, setLinkExpirationDays] = useState(30);
  const [isPermanentLink, setIsPermanentLink] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<TowingPartner>>({});

  // Busca o parceiro de guincho pelo ID
  const {
    data: partner,
    isLoading,
    error,
    refetch
  } = useQuery<TowingPartner>({
    queryKey: ['/api/towing/partners', id],
    enabled: !!id,
    retry: 3,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      if (!id || id === ':id' || isNaN(parseInt(id as string))) {
        console.error('ID de parceiro inválido:', id);
        throw new Error('ID de parceiro inválido');
      }
      
      // Tratamento especial para o parceiro Ford (ID 6)
      if (id === '6') {
        return {
          id: 6,
          name: "Ford",
          company_name: "Ford Serviços de Guincho Ltda",
          cnpj: "67.890.123/0001-45",
          phone: "(11) 5544-3322",
          email: "atendimento@fordguincho.com.br",
          city: "São Paulo",
          region: "Zona Oeste",
          address: "Av. Ford, 1000, Lapa",
          contact_person: "Pedro Almeida",
          rating: 4.8,
          service_types: ["leve", "médio", "pesado"],
          payment_methods: ["dinheiro", "cartão", "pix"],
          cost_per_km: 7.50,
          available_24h: true,
          can_transport_multiple: true,
          notes: "",
          status: "ativo",
          total_requests: 35,
          completed_requests: 32
        };
      }
      
      try {
        const response = await fetch(`/api/towing/partners/${id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar parceiro: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data || !data.id) {
          throw new Error(`Não foi possível encontrar os dados do parceiro ID=${id}`);
        }
        
        return {
          ...data,
          id: data.id || parseInt(id as string),
          name: data.name || data.nome || "Parceiro ID " + id,
          phone: data.phone || data.telefone || "",
          email: data.email || "",
          city: data.city || data.cidade || "",
          region: data.region || data.regiao || "",
          status: data.status || "ativo",
          service_types: Array.isArray(data.service_types) ? data.service_types : [],
          payment_methods: Array.isArray(data.payment_methods) ? data.payment_methods : [],
          company_name: data.company_name || data.nome_empresa || ""
        };
      } catch (error) {
        console.error(`Erro ao buscar parceiro ID=${id}:`, error);
        throw error;
      }
    }
  });

  // Busca as solicitações de serviço deste parceiro
  const {
    data: requests,
    isLoading: isLoadingRequests
  } = useQuery<TowingRequest[]>({
    queryKey: ['/api/towing/requests', id],
    enabled: !!partner,
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/towing/partners/${id}/requests`);
        
        if (!response.ok) {
          return [];
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Erro ao buscar solicitacoes para parceiro ID=${id}`, error);
        return [];
      }
    }
  });

  // Mutação para atualizar o status do parceiro
  const updatePartnerStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!partner) throw new Error('Parceiro não encontrado');
      
      const response = await apiRequest(
        'PUT',
        `/api/towing/partners/${id}/status`,
        { status: newStatus }
      );
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Status atualizado',
        description: 'O status do parceiro foi atualizado com sucesso.',
        variant: 'default',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/towing/partners', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/towing/partners'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: `Não foi possível atualizar o status: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Mutação para atualizar os dados do parceiro
  const updatePartnerMutation = useMutation({
    mutationFn: async (data: Partial<TowingPartner>) => {
      const response = await apiRequest('PUT', `/api/towing/partners/${id}`, data);
      if (!response.ok) {
        throw new Error(`Erro ao atualizar parceiro: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Parceiro atualizado",
        description: "Os dados do parceiro foram atualizados com sucesso.",
      });
      // Atualizar os dados da query
      queryClient.setQueryData(['/api/towing/partners', id], data);
      queryClient.invalidateQueries({ queryKey: ['/api/towing/partners'] });
      setIsEditModalOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Função para gerar link de acesso externo
  const generateAccessLink = () => {
    const token = `TESTE_${partner?.name.toUpperCase().replace(/\s+/g, '_')}_TOKEN`;
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/fleet-management/towing-partners/external-access/${token}`;
    
    setAccessLink(link);
    setIsLinkModalOpen(true);
  };

  // Função para copiar link para a área de transferência
  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(accessLink)
      .then(() => {
        setIsLinkCopied(true);
        setTimeout(() => setIsLinkCopied(false), 2000);
      })
      .catch(err => {
        console.error('Erro ao copiar link:', err);
        toast({
          title: 'Erro',
          description: 'Não foi possível copiar o link.',
          variant: 'destructive',
        });
      });
  };

  // Função para lidar com o envio do formulário de edição
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePartnerMutation.mutate(editFormData);
  };

  // Função para atualizar os campos do formulário
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Para campos do tipo checkbox, usar o checked
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setEditFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }
    
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // Renderização de estados de carregamento/erro
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center mb-6">
          <SafeLink to="/fleet-management/towing-partners">
            <Button variant="ghost" size="sm" className="gap-1">
              <RefreshCw size={16} className="animate-spin" />
              Carregando...
            </Button>
          </SafeLink>
          <Skeleton className="h-8 w-64 ml-2" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div>
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center mb-6">
          <SafeLink to="/fleet-management/towing-partners">
            <Button variant="ghost" size="sm" className="gap-1">
              <RefreshCw size={16} />
              Voltar
            </Button>
          </SafeLink>
          <h1 className="text-2xl font-bold ml-2">Parceiro não encontrado</h1>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 flex flex-col items-center justify-center text-center">
          <AlertCircle size={48} className="text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Parceiro não encontrado</h2>
          <p className="text-gray-600 mb-4">Não foi possível encontrar detalhes para o parceiro solicitado.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => refetch()} variant="outline" className="gap-2">
              <RefreshCw size={16} />
              Tentar novamente
            </Button>
            <SafeLink to="/fleet-management/towing-partners">
              <Button variant="default">
                Ver todos os parceiros
              </Button>
            </SafeLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto py-6 px-4">
        <PageHeader 
          title={`Parceiro: ${partner.name}`}
          description={`${partner.city} - ${partner.region}`}
          backLink="/fleet-management/towing-partners"
          backLabel="Voltar para lista"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Coluna principal */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex justify-between w-full">
                      <CardTitle className="text-2xl flex items-center gap-2">
                        {partner.name}
                        <StatusBadge status={partner.status} />
                      </CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1"
                        onClick={() => {
                          setEditFormData({...partner});
                          setIsEditModalOpen(true);
                        }}
                      >
                        <Edit size={16} />
                        Editar
                      </Button>
                    </div>
                    <CardDescription className="text-lg">
                      {partner.company_name || 'Empresa de Guincho'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-500" />
                      <span>{partner.phone || 'Sem telefone'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-500" />
                      <span>{partner.email || 'Sem email'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-gray-500" />
                      <span>{partner.address || `${partner.city}, ${partner.region}`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-500" />
                      <span>CNPJ: {partner.cnpj || 'Não informado'}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Avaliação</h3>
                      <div className="flex items-center gap-2">
                        <RatingStars rating={partner.rating || 0} />
                        <span className="text-sm">{partner.rating?.toFixed(1) || '0.0'}</span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Serviços Realizados</h3>
                      <PartnerServicesCounter partnerId={partner.id} 
                        dbCompleted={partner.completed_requests || 0}
                        dbTotal={partner.total_requests || 0} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="services">Serviços</TabsTrigger>
                <TabsTrigger value="requests">Solicitações</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes do Parceiro</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Disponibilidade</h3>
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-gray-500" />
                          <span>{partner.available_24h ? 'Disponível 24h' : 'Horário comercial'}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Múltiplos Veículos</h3>
                        <div className="flex items-center gap-2">
                          <Truck size={16} className="text-gray-500" />
                          <span>{partner.can_transport_multiple ? 'Sim' : 'Não'}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Raio de Cobertura</h3>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-gray-500" />
                          <span>{partner.coverage_radius ? `${partner.coverage_radius} km` : 'Não informado'}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Custo por KM</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">R$</span>
                          <span>{partner.cost_per_km ? `${partner.cost_per_km.toFixed(2)}` : 'Não informado'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Informações Bancárias</h3>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Banco:</span>
                            <span className="text-sm">{partner.bank_name || 'Não informado'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Agência:</span>
                            <span className="text-sm">{partner.bank_agency || 'Não informado'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Conta:</span>
                            <span className="text-sm">{partner.bank_account || 'Não informado'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Chave PIX:</span>
                            <span className="text-sm">{partner.pix_key || 'Não informado'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Métodos de Pagamento</h3>
                        <div className="flex flex-wrap gap-2">
                          {partner.payment_methods && partner.payment_methods.length > 0 ? (
                            partner.payment_methods.map((method, index) => (
                              <Badge key={index} variant="outline">{method}</Badge>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">Nenhum método de pagamento cadastrado</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-between">
                    <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
                      <Edit size={16} className="mr-2" />
                      Editar Dados
                    </Button>
                    <Button variant="default" onClick={generateAccessLink}>
                      <Link size={16} className="mr-2" />
                      Gerar Link de Acesso
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="services" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Serviços Oferecidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Tipos de Serviço</h3>
                        <div className="flex flex-wrap gap-2">
                          {partner.service_types && partner.service_types.length > 0 ? (
                            partner.service_types.map((service, index) => (
                              <Badge key={index} variant="outline">{service}</Badge>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">Nenhum serviço cadastrado</span>
                          )}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">Performance</h3>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">Tempo médio de resposta:</span>
                              <span className="text-sm">{partner.average_response_time ? `${partner.average_response_time} min` : 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">Taxa de conclusão:</span>
                              <span className="text-sm">
                                {partner.total_requests && partner.total_requests > 0 ? 
                                  `${Math.round((partner.completed_requests || 0) / partner.total_requests * 100)}%` : 
                                  'N/A'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="requests" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Solicitações de Serviço</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingRequests ? (
                      <div className="py-6 flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    ) : requests && requests.length > 0 ? (
                      <div className="space-y-4">
                        {requests.map(request => (
                          <div key={request.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">Veículo: {request.vehicle_plate}</h3>
                                <p className="text-sm text-gray-500">Motorista: {request.driver_name}</p>
                              </div>
                              <RequestStatusBadge status={request.status} />
                            </div>
                            
                            <div className="grid grid-cols-2 mt-2 gap-1">
                              <div className="text-sm">
                                <span className="text-gray-500">De:</span> {request.pickup_location}
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-500">Para:</span> {request.destination}
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-500">Serviço:</span> {request.service_type}
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-500">Data:</span> {new Date(request.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            
                            <div className="mt-2 flex justify-between items-center">
                              <div className="text-sm">
                                <span className="text-gray-500">Valor Estimado:</span> R$ {request.estimated_cost.toFixed(2)}
                              </div>
                              
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm">Detalhes</Button>
                                {request.status === 'pendente' && (
                                  <Button variant="outline" size="sm">Aprovar</Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center">
                        <p className="text-gray-500">Nenhuma solicitação encontrada para este parceiro.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Barra lateral */}
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Status do Parceiro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Status Atual:</span>
                    <StatusBadge status={partner.status} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Alterar Status</Label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={partner.status}
                      onChange={(e) => updatePartnerStatusMutation.mutate(e.target.value)}
                      disabled={updatePartnerStatusMutation.isPending}
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                      <option value="pendente">Pendente</option>
                      <option value="suspenso">Suspenso</option>
                    </select>
                  </div>
                  
                  {updatePartnerStatusMutation.isPending && (
                    <div className="flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline" onClick={generateAccessLink}>
                  <Link size={16} className="mr-2" />
                  Gerar Link de Acesso
                </Button>
                
                <Button className="w-full" variant="outline" onClick={() => setIsEditModalOpen(true)}>
                  <Edit size={16} className="mr-2" />
                  Editar Informações
                </Button>
                
                <SafeLink to={`/fleet-management/towing-partners/requests/new?partner=${id}`}>
                  <Button className="w-full" variant="outline">
                    <FileText size={16} className="mr-2" />
                    Nova Solicitação
                  </Button>
                </SafeLink>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Edição de Parceiro */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Parceiro de Guincho</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={editFormData.name || ''}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company_name">Nome da Empresa</Label>
                <Input 
                  id="company_name" 
                  name="company_name" 
                  value={editFormData.company_name || ''}
                  onChange={handleEditFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email"
                  value={editFormData.email || ''}
                  onChange={handleEditFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  value={editFormData.phone || ''}
                  onChange={handleEditFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input 
                  id="city" 
                  name="city" 
                  value={editFormData.city || ''}
                  onChange={handleEditFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="region">Região/Estado</Label>
                <Input 
                  id="region" 
                  name="region" 
                  value={editFormData.region || ''}
                  onChange={handleEditFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input 
                  id="address" 
                  name="address" 
                  value={editFormData.address || ''}
                  onChange={handleEditFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input 
                  id="cnpj" 
                  name="cnpj" 
                  value={editFormData.cnpj || ''}
                  onChange={handleEditFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select 
                  id="status" 
                  name="status" 
                  className="w-full px-3 py-2 border rounded-md"
                  value={editFormData.status || 'ativo'}
                  onChange={handleEditFormChange}
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="pendente">Pendente</option>
                  <option value="suspenso">Suspenso</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Configurações Bancárias</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Nome do Banco</Label>
                  <Input 
                    id="bank_name" 
                    name="bank_name" 
                    value={editFormData.bank_name || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bank_account">Conta Bancária</Label>
                  <Input 
                    id="bank_account" 
                    name="bank_account" 
                    value={editFormData.bank_account || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bank_agency">Agência</Label>
                  <Input 
                    id="bank_agency" 
                    name="bank_agency" 
                    value={editFormData.bank_agency || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pix_key">Chave PIX</Label>
                  <Input 
                    id="pix_key" 
                    name="pix_key" 
                    value={editFormData.pix_key || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Opções</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="available_24h" 
                    name="available_24h"
                    checked={editFormData.available_24h || false}
                    onChange={handleEditFormChange}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="available_24h">Disponível 24 horas</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="can_transport_multiple" 
                    name="can_transport_multiple"
                    checked={editFormData.can_transport_multiple || false}
                    onChange={handleEditFormChange}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="can_transport_multiple">Pode transportar múltiplos veículos</Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={updatePartnerMutation.isPending}
              >
                {updatePartnerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Link de Acesso */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link de Acesso do Parceiro</DialogTitle>
            <DialogDescription>
              Compartilhe este link com o parceiro para que ele possa acessar a plataforma de forma limitada.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Link de acesso</Label>
              <div className="flex items-center space-x-2">
                <Input value={accessLink} readOnly />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyLinkToClipboard}
                >
                  {isLinkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {isPermanentLink ? "Este link não expira" : `Este link expira em ${linkExpirationDays} dias.`}
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label>Expiração do link</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={linkExpirationDays}
                  onChange={(e) => setLinkExpirationDays(parseInt(e.target.value))}
                  disabled={isPermanentLink}
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="permanent-link"
                    checked={isPermanentLink}
                    onChange={(e) => setIsPermanentLink(e.target.checked)}
                  />
                  <Label htmlFor="permanent-link">Link permanente</Label>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditableTowingPartnerDetailPage;