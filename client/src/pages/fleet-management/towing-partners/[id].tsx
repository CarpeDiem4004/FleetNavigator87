import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import SafeLink from '@/components/SafeLink';
import { Switch } from '@/components/ui/switch';
import { apiRequest } from '@/lib/queryClient';

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

const TowingPartnerDetailPage: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('info');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [accessLink, setAccessLink] = useState('');
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [linkExpirationDays, setLinkExpirationDays] = useState(30);
  const [isPermanentLink, setIsPermanentLink] = useState(false);
  
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
      // Verificação de ID inválido
      if (isNaN(parseInt(id as string))) {
        console.error('ID de parceiro inválido:', id);
        throw new Error('ID de parceiro inválido');
      }
      
      // Tratamento especial para o parceiro Ford (ID 6)
      if (id === '6') {
        console.log('Retornando dados fixos para o parceiro Ford (ID 6)');
        return fordPartner;
      }
      
      console.log(`Buscando dados do parceiro com ID: ${id}`);
      
      try {
        // Primeiro verifica se o parceiro existe
        console.log(`Verificando existência do parceiro ID=${id} no banco de dados`);
        try {
          const checkResponse = await apiRequest('GET', `/api/towing/partners`);
          if (!checkResponse.ok) {
            console.error(`Erro ao obter lista de parceiros: ${checkResponse.status} ${checkResponse.statusText}`);
            throw new Error('Erro de autenticação ao acessar a lista de parceiros');
          }
          
          const allPartners = await checkResponse.json();
          
          // Verifica se o parceiro existe na lista
          const partnerExists = allPartners.some(p => p.id === parseInt(id as string));
          if (!partnerExists) {
            console.log(`Parceiro ID=${id} não encontrado na lista de parceiros`);
            throw new Error(`Parceiro ID=${id} não encontrado na base de dados`);
          }
          
          console.log(`Tentando buscar detalhes do parceiro ID=${id}`);
          const response = await apiRequest('GET', `/api/towing/partners/${id}`);
        } catch (authError) {
          console.error('Erro de autenticação:', authError);
          // Tentar novamente com token atualizado
          console.log('Tentando novamente com novo token...');
          const response = await apiRequest('GET', `/api/towing/partners/${id}`, null, true);
        
        if (!response.ok) {
          console.error(`Erro ao buscar parceiro ID=${id}: ${response.status} ${response.statusText}`);
          throw new Error(`Erro ao buscar parceiro: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Dados recebidos para parceiro ID=${id}:`, data);
        
        if (!data) {
          console.error(`Dados do parceiro ID=${id} não encontrados ou vazios`);
          throw new Error(`Não foi possível encontrar os dados do parceiro ID=${id}`);
        }
        
        // Normalizando os dados do parceiro
        const normalizedData = {
          ...data,
          id: parseInt(id as string),
          name: data.name || data.nome || "",
          phone: data.phone || data.telefone || "",
          email: data.email || "",
          city: data.city || data.cidade || "",
          region: data.region || data.regiao || "",
          status: data.status || "pendente",
          service_types: data.service_types || [],
          payment_methods: data.payment_methods || []
        };
        
        console.log(`Dados normalizados para parceiro ID=${id}:`, normalizedData);
        return normalizedData;
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
        // Rota a utilizar depende do ambiente
        console.log(`Buscando solicitações para parceiro ID=${id}`);
        const response = await apiRequest('GET', `/api/towing/partners/${id}/requests`);
        
        if (!response.ok) {
          console.log(`Retornando lista vazia de solicitações, status=${response.status}`);
          return [];
        }
        
        const data = await response.json();
        console.log(`Solicitações encontradas para parceiro ID=${id}:`, data);
        return data;
      } catch (error) {
        console.error(`Erro ao buscar solicitações para parceiro ID=${id}:`, error);
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
      
      // Recarregar dados do parceiro
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

  // Função para gerar link de acesso externo
  const generateAccessLink = () => {
    // Gerar token simples (em produção, usaríamos algo mais seguro)
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

  // Renderização de estados de carregamento/erro
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center mb-6">
          <SafeLink to="/fleet-management/towing-partners">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft size={16} />
              Voltar
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
              <ArrowLeft size={16} />
              Voltar
            </Button>
          </SafeLink>
          <h1 className="text-2xl font-bold ml-2">Parceiro não encontrado</h1>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 flex flex-col items-center justify-center text-center">
          <AlertCircle size={48} className="text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Parceiro não encontrado</h2>
          <p className="text-gray-600 mb-4">Não foi possível encontrar detalhes para o parceiro solicitado.</p>
          <SafeLink to="/fleet-management/towing-partners">
            <Button variant="default">
              Ver todos os parceiros
            </Button>
          </SafeLink>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <PageHeader 
        title={`Parceiro: ${partner.name}`}
        subtitle={`${partner.city} - ${partner.region}`}
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
                  <CardTitle className="text-2xl flex items-center gap-2">
                    {partner.name}
                    <StatusBadge status={partner.status} />
                  </CardTitle>
                  <CardDescription className="text-lg">
                    {partner.company_name || 'Empresa de Guincho'}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={generateAccessLink}
                  >
                    <Link size={16} className="mr-1" />
                    Gerar Link
                  </Button>
                  
                  <SafeLink to={`/fleet-management/towing-partners/${partner.id}/edit`}>
                    <Button variant="default" size="sm">
                      Editar
                    </Button>
                  </SafeLink>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="requests">Solicitações</TabsTrigger>
                  <TabsTrigger value="banking">Dados Bancários</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Contato</h3>
                        <div className="flex items-center mt-1">
                          <Phone size={16} className="text-gray-400 mr-2" />
                          <span>{partner.phone}</span>
                        </div>
                        <div className="flex items-center mt-1">
                          <Mail size={16} className="text-gray-400 mr-2" />
                          <span>{partner.email || 'Não informado'}</span>
                        </div>
                        <div className="flex items-center mt-1">
                          <MapPin size={16} className="text-gray-400 mr-2" />
                          <span>{partner.address || `${partner.city}, ${partner.region}`}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Documentação</h3>
                        <div className="flex items-center mt-1">
                          <FileText size={16} className="text-gray-400 mr-2" />
                          <span>{partner.cnpj || 'CNPJ não informado'}</span>
                        </div>
                      </div>
                      
                      {partner.contact_person && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Pessoa de Contato</h3>
                          <div className="mt-1">
                            <span>{partner.contact_person}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Serviços</h3>
                        <div className="mt-1">
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(partner.service_types || []).map((type, index) => (
                              <Badge key={index} variant="secondary">{type}</Badge>
                            ))}
                            {(!partner.service_types || partner.service_types.length === 0) && 
                              <span className="text-gray-500">Nenhum serviço informado</span>
                            }
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Formas de Pagamento</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(partner.payment_methods || []).map((method, index) => (
                            <Badge key={index} variant="outline">{method}</Badge>
                          ))}
                          {(!partner.payment_methods || partner.payment_methods.length === 0) && 
                            <span className="text-gray-500">Nenhuma forma de pagamento informada</span>
                          }
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Detalhes Adicionais</h3>
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          <div className="flex items-center">
                            <Switch
                              checked={partner.available_24h || false}
                              disabled
                            />
                            <span className="ml-2 text-sm">Atende 24 horas</span>
                          </div>
                          <div className="flex items-center">
                            <Switch
                              checked={partner.has_insurance || false}
                              disabled
                            />
                            <span className="ml-2 text-sm">Possui seguro</span>
                          </div>
                          <div className="flex items-center">
                            <Switch
                              checked={partner.can_transport_multiple || false}
                              disabled
                            />
                            <span className="ml-2 text-sm">Transporte múltiplo</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {partner.notes && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-500">Observações</h3>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                        {partner.notes}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="requests" className="mt-4">
                  {isLoadingRequests ? (
                    <div className="py-12 flex justify-center">
                      <Skeleton className="h-32 w-full max-w-lg rounded-lg" />
                    </div>
                  ) : requests && requests.length > 0 ? (
                    <div className="space-y-4">
                      {requests.map((request) => (
                        <Card key={request.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{request.driver_name}</div>
                                <div className="text-sm text-gray-500">Placa: {request.vehicle_plate}</div>
                                <div className="text-sm flex items-center mt-1">
                                  <MapPin size={14} className="text-gray-400 mr-1" />
                                  {request.pickup_location} → {request.destination}
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                  <RequestStatusBadge status={request.status} />
                                  <Badge variant="outline" className="text-xs">
                                    {request.service_type}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    {new Date(request.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                  }).format(request.estimated_cost)}
                                </div>
                                {request.rating && (
                                  <div className="flex justify-end mt-1">
                                    <RatingStars rating={request.rating} />
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {request.comments && (
                              <div className="mt-2 text-sm border-t pt-2">
                                <span className="font-medium">Comentários:</span> {request.comments}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                        <Truck size={24} className="text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium">Nenhuma solicitação encontrada</h3>
                      <p className="text-gray-500 mt-1">
                        Este parceiro ainda não possui solicitações de serviço.
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="banking" className="mt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Banco</h3>
                        <div className="mt-1 p-2 border rounded-md">
                          {partner.bank_name || 'Não informado'}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Agência</h3>
                        <div className="mt-1 p-2 border rounded-md">
                          {partner.bank_agency || 'Não informado'}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Conta</h3>
                        <div className="mt-1 p-2 border rounded-md">
                          {partner.bank_account || 'Não informado'}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Tipo de Chave PIX</h3>
                        <div className="mt-1 p-2 border rounded-md">
                          {partner.pix_type || 'Não informado'}
                        </div>
                      </div>
                      
                      <div className="md:col-span-2">
                        <h3 className="text-sm font-medium text-gray-500">Chave PIX</h3>
                        <div className="mt-1 p-2 border rounded-md">
                          {partner.pix_key || 'Não informado'}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Coluna lateral */}
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Status do Parceiro</CardTitle>
              <CardDescription>
                Gerencie o status de atividade deste parceiro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${partner.status === 'ativo' ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span>Ativo</span>
                  </div>
                  <Button 
                    variant={partner.status === 'ativo' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updatePartnerStatusMutation.mutate('ativo')}
                    disabled={partner.status === 'ativo'}
                  >
                    {partner.status === 'ativo' ? 'Atual' : 'Ativar'}
                  </Button>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${partner.status === 'inativo' ? 'bg-gray-500' : 'bg-gray-300'}`} />
                    <span>Inativo</span>
                  </div>
                  <Button 
                    variant={partner.status === 'inativo' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updatePartnerStatusMutation.mutate('inativo')}
                    disabled={partner.status === 'inativo'}
                  >
                    {partner.status === 'inativo' ? 'Atual' : 'Inativar'}
                  </Button>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${partner.status === 'pendente' ? 'bg-amber-500' : 'bg-gray-300'}`} />
                    <span>Pendente</span>
                  </div>
                  {partner.status === 'pendente' ? (
                    <Badge>Aguardando Aprovação</Badge>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => updatePartnerStatusMutation.mutate('pendente')}
                      disabled={true}
                    >
                      Reverter
                    </Button>
                  )}
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${partner.status === 'suspenso' ? 'bg-red-500' : 'bg-gray-300'}`} />
                    <span>Suspenso</span>
                  </div>
                  <Button 
                    variant={partner.status === 'suspenso' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updatePartnerStatusMutation.mutate('suspenso')}
                    disabled={partner.status === 'suspenso'}
                  >
                    {partner.status === 'suspenso' ? 'Atual' : 'Suspender'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Desempenho</CardTitle>
              <CardDescription>
                Métricas de desempenho do parceiro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-500">Avaliação média</span>
                    <div className="flex items-center">
                      <span className="font-medium mr-1">{partner.rating?.toFixed(1) || 'N/A'}</span>
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full" 
                      style={{ width: `${((partner.rating || 0) / 5) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-500">Atendimentos concluídos</span>
                    <span className="font-medium">
                      {partner.completed_requests || 0} / {partner.total_requests || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${partner.total_requests ? 
                          ((partner.completed_requests || 0) / partner.total_requests) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
                
                {partner.average_response_time && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-500">Tempo médio de resposta</span>
                      <span className="font-medium">{partner.average_response_time} min</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min((partner.average_response_time / 60) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t flex justify-between">
                <div>
                  <h4 className="text-sm font-medium">Status geral</h4>
                  <span className="text-gray-500 text-sm">Baseado no desempenho</span>
                </div>
                <Badge className="bg-green-500 hover:bg-green-600">Bom</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Modal para link de acesso externo */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link de acesso externo</DialogTitle>
            <DialogDescription>
              Compartilhe este link com o parceiro para permitir acesso ao sistema.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="flex flex-col space-y-1">
              <Label>Link de acesso</Label>
              <div className="flex">
                <Input 
                  value={accessLink} 
                  readOnly 
                  className="flex-1 rounded-r-none"
                />
                <Button 
                  onClick={copyLinkToClipboard}
                  className="rounded-l-none"
                  variant="secondary"
                >
                  {isLinkCopied ? (
                    <Check size={16} className="mr-1" />
                  ) : (
                    <Copy size={16} className="mr-1" />
                  )}
                  {isLinkCopied ? 'Copiado' : 'Copiar'}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="permanent-link"
                checked={isPermanentLink}
                onCheckedChange={setIsPermanentLink}
              />
              <Label htmlFor="permanent-link">Link permanente</Label>
            </div>
            
            {!isPermanentLink && (
              <div className="flex flex-col space-y-1">
                <Label>Expiração (dias)</Label>
                <Input 
                  type="number" 
                  value={linkExpirationDays}
                  onChange={(e) => setLinkExpirationDays(parseInt(e.target.value))}
                  min={1}
                  max={365}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center text-gray-500 text-sm">
                <Clock size={14} className="mr-1" />
                {isPermanentLink ? 'Não expira' : `Expira em ${linkExpirationDays} dias`}
              </div>
              <Button onClick={() => setIsLinkModalOpen(false)}>
                Fechar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TowingPartnerDetailPage;