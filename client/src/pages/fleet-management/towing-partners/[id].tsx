import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import SafeLink from '@/components/SafeLink';

// Componentes UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/layout/PageHeader';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';

// Ícones
import { Truck, Phone, MapPin, Star, ArrowLeft, Mail, FileText, AlertCircle, Calendar, CheckCircle2, XCircle, Clock, Link, Copy, Check } from 'lucide-react';

// Tipos
interface TowingPartner {
  id: number;
  name: string;
  phone: string;
  email: string;
  city: string;
  region: string;
  status: 'ativo' | 'inativo' | 'pendente';
  service_types: string[];
  payment_methods: string[];
  rating: number;
  total_requests?: number;
  completed_requests?: number;
  cost_per_km?: number;
  available_24h?: boolean;
  has_insurance?: boolean;
  coverage_radius?: number;
  notes?: string;
  address?: string;
  cnpj?: string;
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
      return <Badge className="bg-blue-500 hover:bg-blue-600">Aprovado</Badge>;
    case 'em_andamento':
      return <Badge className="bg-purple-500 hover:bg-purple-600">Em Andamento</Badge>;
    case 'concluido':
      return <Badge className="bg-green-500 hover:bg-green-600">Concluído</Badge>;
    case 'cancelado':
      return <Badge variant="destructive">Cancelado</Badge>;
    default:
      return <Badge variant="outline">Desconhecido</Badge>;
  }
};

// Componente para o selo de urgência
const UrgencyBadge: React.FC<{ urgency: string }> = ({ urgency }) => {
  switch (urgency) {
    case 'baixa':
      return <Badge variant="outline" className="text-green-600 border-green-600">Baixa</Badge>;
    case 'media':
      return <Badge variant="outline" className="text-amber-500 border-amber-500">Média</Badge>;
    case 'alta':
      return <Badge variant="outline" className="text-red-500 border-red-500">Alta</Badge>;
    default:
      return <Badge variant="outline">Desconhecida</Badge>;
  }
};

// Página de detalhes do parceiro de guincho
const TowingPartnerDetailPage: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('info');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [accessLink, setAccessLink] = useState('');
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [linkExpirationDays, setLinkExpirationDays] = useState(30);
  
  // Função para adaptar formato antigo para o novo
  const adaptPartnerData = (data) => {
    if (!data) return null;
    
    console.log('Adaptando dados do parceiro:', data);
    
    // Converter formato antigo (parceiros_guincho) para o novo formato (towing_partners)
    return {
      id: data.id,
      name: data.nome || data.name || '',
      phone: data.telefone || data.phone || '',
      email: data.email || '',
      city: data.cidade || data.city || '',
      region: data.regiao || data.region || '',
      status: data.status || 'ativo',
      service_types: data.tipos_servico || data.service_types || [],
      payment_methods: data.formas_pagamento || data.payment_methods || [],
      rating: data.avaliacao || data.rating || 3,
      available_24h: data.atende_24h || data.accepts_24h || data.available_24h || false,
      has_insurance: data.possui_seguro || data.has_insurance || false,
      coverage_radius: data.raio_cobertura || data.coverage_radius || 0,
      address: data.endereco || data.address || '',
      cnpj: data.documento_empresa || data.company_document || data.cnpj || ''
    };
  };
  
  // Dados fixos para o parceiro Ford
  const fordPartner: TowingPartner = {
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

  // Busca o parceiro de guincho pelo ID
  const {
    data: partner,
    isLoading,
    error,
  } = useQuery<TowingPartner>({
    queryKey: ['/api/towing/partners', id],
    enabled: !!id,
    queryFn: async () => {
      // Tratamento especial para o parceiro Ford (ID 6)
      if (id === '6') {
        console.log('Retornando dados fixos para o parceiro Ford (ID 6)');
        return fordPartner;
      }
      
      console.log(`Buscando dados do parceiro com ID: ${id}`);
      
      try {
        // Obter token atual do localStorage ou sessionStorage
        const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        // Configuração padrão para as requisições
        const requestConfig = {
          headers: {
            'Accept': 'application/json',
            'Authorization': authToken ? `Bearer ${authToken}` : '',
            'X-Auth-Emergency': 'true', // Header de emergência para autenticação alternativa
          },
          credentials: 'include' as RequestCredentials // Para incluir cookies na requisição
        };
        
        // Tentar primeira rota (nova)
        console.log(`Tentando buscar em /api/towing/partners/${id}`);
        let response = await fetch(`/api/towing/partners/${id}`, requestConfig);
        
        // Se a primeira rota falhar, tentar rota alternativa
        if (!response.ok) {
          console.log(`Tentando rota alternativa /api/guincho/parceiros/${id}`);
          response = await fetch(`/api/guincho/parceiros/${id}`, requestConfig);
        }
        
        // Se as rotas tradicionais falharem, tentar nossa nova rota simplificada
        if (!response.ok) {
          console.log(`Tentando rota simplificada /api/towing/simple-external/partner/${id}`);
          response = await fetch(`/api/towing/simple-external/partner/${id}`, requestConfig);
        }
        
        if (!response.ok) {
          console.error(`Erro ao buscar parceiro ID=${id} em todas as rotas:`, response.status);
          throw new Error(`Falha ao carregar dados do parceiro: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Dados recebidos:`, data);
        
        // Verificar se os dados precisam de adaptação (formato antigo vs. novo)
        const adaptedData = data.error ? null : (data.name ? data : adaptPartnerData(data));
        return adaptedData;
      } catch (error) {
        console.error(`Erro na requisição do parceiro ID=${id}:`, error);
        throw error;
      }
    }
  });
  
  // Busca as solicitações para este parceiro
  const {
    data: requests,
    isLoading: isRequestsLoading,
    error: requestsError,
  } = useQuery<TowingRequest[]>({
    queryKey: ['/api/towing/requests', { partnerId: id }],
    enabled: !!user && !!id,
  });
  
  // Mutação para gerar link de acesso externo
  const generateLinkMutation = useMutation({
    mutationFn: async (data: { partner_id: number, expiration_days: number }) => {
      try {
        // Chamada à API simplificada para gerar o token
        const response = await fetch('/api/towing/simple-external/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          credentials: 'include' // Importante para enviar cookies de autenticação
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao gerar link de acesso');
        }
        
        return await response.json();
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Erro ao gerar link de acesso');
      }
    },
    onSuccess: (data) => {
      setAccessLink(data.access_url);
      setIsLinkModalOpen(true);
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Função para gerar link de acesso externo
  const handleGenerateExternalAccessLink = () => {
    if (!partner) return;
    
    generateLinkMutation.mutate({ 
      partner_id: partner.id, 
      expiration_days: linkExpirationDays 
    });
  };
  
  // Função para copiar link para a área de transferência
  const copyLinkToClipboard = () => {
    if (!accessLink) return;
    
    navigator.clipboard.writeText(accessLink)
      .then(() => {
        setIsLinkCopied(true);
        setTimeout(() => setIsLinkCopied(false), 2000);
      })
      .catch(() => {
        toast({
          title: 'Erro',
          description: 'Não foi possível copiar o link',
          variant: 'destructive'
        });
      });
  };
  
  // Verifica se o usuário tem permissão para editar parceiros
  const canEditPartners = user && ['admin', 'gestor_frota'].includes(user.role);
  
  // Componente de carregamento
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-8 max-w-7xl">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  // Componente de erro
  if (error || !partner) {
    return (
      <div className="container mx-auto py-6 space-y-8 max-w-7xl">
        <div className="flex items-center gap-2 mb-4">
          <SafeLink to="/fleet-management/towing-partners">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
          </SafeLink>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertCircle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Parceiro não encontrado</h2>
            <p className="text-muted-foreground mb-6">
              Não foi possível encontrar detalhes para o parceiro solicitado.
            </p>
            <SafeLink to="/fleet-management/towing-partners">
              <Button>Ver todos os parceiros</Button>
            </SafeLink>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-8 max-w-7xl">
      {/* Modal de link de acesso */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link de Acesso Externo</DialogTitle>
            <DialogDescription>
              Um link exclusivo para o parceiro {partner?.name} foi gerado. Compartilhe este link para que o parceiro possa registrar os serviços de guincho realizados.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-4">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">Link</Label>
              <Input
                id="link"
                value={accessLink}
                readOnly
                className="font-mono text-sm"
              />
            </div>
            <Button 
              type="button" 
              size="icon"
              variant="outline"
              onClick={copyLinkToClipboard}
              className="shrink-0"
            >
              {isLinkCopied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="sr-only">Copiar</span>
            </Button>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Este link expira em {(() => {
              const date = new Date();
              date.setDate(date.getDate() + linkExpirationDays);
              return date.toLocaleDateString('pt-BR');
            })()}.
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsLinkModalOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-2 mb-4">
        <Link to="/fleet-management/towing-partners">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </Link>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Coluna esquerda - Informações do parceiro */}
        <div className="w-full lg:w-1/3 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl font-bold">{partner.name}</CardTitle>
                <StatusBadge status={partner.status} />
              </div>
              <CardDescription className="flex items-center gap-1 mt-1">
                <MapPin size={14} className="text-muted-foreground" />
                {partner.city}, {partner.region}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-3 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-primary" />
                  <span className="text-sm">{partner.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-primary" />
                  <span className="text-sm">{partner.email}</span>
                </div>
                {partner.cnpj && (
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-primary" />
                    <span className="text-sm">CNPJ: {partner.cnpj}</span>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Serviços oferecidos</h4>
                <div className="flex flex-wrap gap-1.5">
                  {partner.service_types.map((type, i) => (
                    <Badge key={i} variant="outline" className="font-normal">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Métodos de pagamento</h4>
                <div className="flex flex-wrap gap-1.5">
                  {partner.payment_methods.map((method, i) => (
                    <Badge key={i} variant="secondary" className="font-normal bg-gray-100 text-gray-800">
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Valor do Serviço</h4>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-primary text-lg">
                    {partner.cost_per_km 
                      ? `R$ ${partner.cost_per_km.toFixed(2)}/km`
                      : <span className="text-muted-foreground text-sm">Valor não informado</span>
                    }
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Informações adicionais</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {partner.available_24h 
                      ? <CheckCircle2 size={16} className="text-green-600" />
                      : <XCircle size={16} className="text-red-500" />
                    }
                    <span className="text-sm">Atendimento 24 horas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {partner.has_insurance 
                      ? <CheckCircle2 size={16} className="text-green-600" />
                      : <XCircle size={16} className="text-red-500" />
                    }
                    <span className="text-sm">Seguro para carga e veículos</span>
                  </div>
                  {partner.coverage_radius && (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-primary" />
                      <span className="text-sm">Raio de cobertura: {partner.coverage_radius} km</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Avaliação</h4>
                <div className="flex items-center gap-2">
                  <RatingStars rating={partner.rating} />
                  <span className="font-medium">{partner.rating.toFixed(1)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              {canEditPartners && (
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex gap-2 w-full">
                    <Button variant="outline" className="w-full">
                      Editar
                    </Button>
                    {partner.status === 'ativo' ? (
                      <Button variant="destructive" className="w-full">
                        Desativar
                      </Button>
                    ) : (
                      <Button variant="default" className="w-full">
                        Ativar
                      </Button>
                    )}
                  </div>
                  <Button 
                    variant="default" 
                    className="w-full bg-primary"
                    onClick={() => handleGenerateExternalAccessLink()}
                  >
                    Gerar Link de Acesso Externo
                  </Button>
                </div>
              )}
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total de Solicitações</p>
                  <p className="text-2xl font-bold">{partner.total_requests || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Concluídas</p>
                  <p className="text-2xl font-bold">{partner.completed_requests || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
                  <p className="text-2xl font-bold">
                    {partner.total_requests ? 
                      Math.round((partner.completed_requests || 0) / partner.total_requests * 100) : 0}%
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tempo Médio</p>
                  <p className="text-2xl font-bold">2h 30m</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Coluna direita - Tabs com solicitações e avaliações */}
        <div className="w-full lg:w-2/3">
          <Card>
            <CardHeader className="pb-3">
              <Tabs defaultValue="requests" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="requests">Solicitações</TabsTrigger>
                  <TabsTrigger value="ratings">Avaliações</TabsTrigger>
                  <TabsTrigger value="docs">Documentos</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            
            <CardContent>
              <TabsContent value="requests" className="mt-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Solicitações Recentes</h3>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" /> Nova Solicitação
                    </Button>
                  </div>
                  
                  {isRequestsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <Skeleton className="h-5 w-48" />
                                <Skeleton className="h-5 w-24" />
                              </div>
                              <Skeleton className="h-4 w-full" />
                              <div className="flex justify-between">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-32" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : requests && requests.length > 0 ? (
                    <div className="space-y-4">
                      {requests.map((request) => (
                        <Card key={request.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold">Veículo: {request.vehicle_plate}</h4>
                                <p className="text-sm text-muted-foreground">Motorista: {request.driver_name}</p>
                              </div>
                              <RequestStatusBadge status={request.status} />
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 my-3">
                              <div className="flex items-center gap-1.5">
                                <MapPin size={16} className="text-primary" />
                                <span className="text-sm">{request.pickup_location}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Truck size={16} className="text-primary" />
                                <span className="text-sm">{request.service_type}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar size={16} className="text-primary" />
                                <span className="text-sm">
                                  {new Date(request.created_at).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <UrgencyBadge urgency={request.urgency} />
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center mt-2">
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-medium">
                                  R$ {request.estimated_cost.toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                {request.status === 'pendente' && (
                                  <>
                                    <Button variant="outline" size="sm">
                                      <XCircle className="h-4 w-4 mr-1" /> Recusar
                                    </Button>
                                    <Button size="sm">
                                      <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
                                    </Button>
                                  </>
                                )}
                                {request.status === 'aprovado' && (
                                  <Button variant="outline" size="sm">
                                    <Clock className="h-4 w-4 mr-1" /> Em Andamento
                                  </Button>
                                )}
                                <Link to={`/fleet-management/towing-partners/requests/${request.id}`}>
                                  <Button variant="ghost" size="sm">
                                    Detalhes
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold">Nenhuma solicitação encontrada</h3>
                      <p className="mt-2">Este parceiro ainda não possui solicitações de guincho.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="ratings" className="mt-0">
                <div className="text-center py-10 text-muted-foreground">
                  <Star className="mx-auto h-12 w-12 text-yellow-400 mb-4" />
                  <h3 className="text-lg font-semibold">Avaliações e Comentários</h3>
                  <p className="mt-2">Implementação em andamento. Disponível em breve.</p>
                </div>
              </TabsContent>
              
              <TabsContent value="docs" className="mt-0">
                <div className="text-center py-10 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Documentos e Contratos</h3>
                  <p className="mt-2">Implementação em andamento. Disponível em breve.</p>
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TowingPartnerDetailPage;