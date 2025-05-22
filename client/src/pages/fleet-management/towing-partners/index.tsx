import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import SafeLink from '@/components/SafeLink';
import { apiRequest } from '@/lib/queryClient';

// Componentes UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/layout/PageHeader';

// Ícones
import { Truck, Phone, MapPin, Star, AlertCircle, ChevronRight, Search, Plus, Filter, FileText } from 'lucide-react';

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
}

interface TowingPartnerSummary extends TowingPartner {
  total_requests: number;
  completed_requests: number;
  avg_rating: number;
  last_request_date: string | null;
}

// Componente para cartão/card de parceiro
const PartnerCard: React.FC<{ partner: TowingPartner }> = ({ partner }) => {
  // No Wouter, useLocation retorna [path, setPath]
  const [_, setLocation] = useLocation();
  
  const handleViewDetails = () => {
    console.log(`Navegando para parceiro: ${partner.id}`);
    // Usar diretamente a rota absoluta, garantindo que o ID está passando corretamente
    setLocation(`/fleet-management/towing-partners/${partner.id}`);
  };
  
  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{partner.name}</CardTitle>
          <StatusBadge status={partner.status} />
        </div>
        <CardDescription className="flex items-center gap-1 mt-1">
          <MapPin size={14} className="text-muted-foreground" />
          {partner.city}, {partner.region}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Phone size={16} className="text-primary" />
            <span className="text-sm">{partner.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck size={16} className="text-primary" />
            <span className="text-sm flex flex-wrap gap-1">
              {partner.service_types.slice(0, 2).map((type, i) => (
                <Badge key={i} variant="outline" className="font-normal text-xs">
                  {type}
                </Badge>
              ))}
              {partner.service_types.length > 2 && (
                <Badge variant="outline" className="font-normal text-xs">
                  +{partner.service_types.length - 2}
                </Badge>
              )}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <RatingStars rating={partner.rating} />
            <span className="text-sm font-medium ml-1">{partner.rating.toFixed(1)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 border-t">
        <Button 
          variant="default" 
          size="sm" 
          className="w-full"
          onClick={handleViewDetails}
        >
          Ver detalhes <ChevronRight size={16} className="ml-1" />
        </Button>
      </CardFooter>
    </Card>
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

// Componente para exibir as estrelas de avaliação
const RatingStars: React.FC<{ rating: number }> = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  
  return (
    <div className="flex">
      {[...Array(5)].map((_, i) => {
        if (i < fullStars) {
          return <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />;
        } else if (i === fullStars && hasHalfStar) {
          return <Star key={i} size={14} className="text-yellow-400 fill-yellow-400 [clip-path:inset(0_50%_0_0)]" />;
        } else {
          return <Star key={i} size={14} className="text-gray-300" />;
        }
      })}
    </div>
  );
};

// Página principal de Parceiros de Guincho
const TowingPartnersPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('todos');
  const [loadingApproval, setLoadingApproval] = useState<number | null>(null);
  
  // Buscar parceiros de guincho
  const {
    data: partners,
    isLoading,
    error,
  } = useQuery<TowingPartner[]>({
    queryKey: ['/api/towing/partners'],
    enabled: !!user,
  });

  // Buscar resumo dos parceiros (com estatísticas)
  const {
    data: partnersSummary,
    isLoading: isSummaryLoading,
  } = useQuery<TowingPartnerSummary[]>({
    queryKey: ['/api/towing/partners/summary'],
    enabled: !!user,
  });
  
  // Mutação para aprovar parceiros
  const approvePartnerMutation = useMutation({
    mutationFn: async (partnerId: number) => {
      console.log(`Iniciando aprovação do parceiro ID: ${partnerId}`);
      setLoadingApproval(partnerId);
      try {
        const response = await apiRequest(
          'PUT', 
          `/api/towing/partners/${partnerId}/status`, 
          { status: 'ativo' }
        );
        console.log(`Resposta da aprovação:`, response);
        return await response.json();
      } catch (error) {
        console.error(`Erro ao aprovar parceiro ID ${partnerId}:`, error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Dados retornados após aprovação:", data);
      // Verificar a estrutura da resposta para extrair o nome corretamente
      const partnerName = data.data?.name || data.name || "Parceiro";
      
      toast({
        title: "Parceiro aprovado",
        description: `${partnerName} foi aprovado com sucesso.`,
        variant: "default"
      });
      
      // Invalidar cache para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ['/api/towing/partners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/towing/partners/summary'] });
      
      // Após aprovação, mudar para a aba de parceiros ativos
      // em vez de tentar visualizar os detalhes
      setActiveTab('ativo');
      
      setLoadingApproval(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aprovar parceiro",
        description: error.message || "Ocorreu um erro ao aprovar o parceiro. Tente novamente.",
        variant: "destructive"
      });
      setLoadingApproval(null);
    }
  });
  
  // Filtrar parceiros com base na pesquisa e na aba ativa
  const filteredPartners = partners
    ? partners.filter(partner => {
        // Filtro de pesquisa
        const matchesSearch = 
          partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          partner.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          partner.region.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Filtro de status
        const matchesStatus = 
          activeTab === 'todos' || 
          partner.status === activeTab;
        
        return matchesSearch && matchesStatus;
      })
    : [];
  
  // Verificar se o usuário tem permissão para adicionar novos parceiros
  const canAddPartners = user && ['admin', 'gestor_frota'].includes(user.role);
  
  // Verificar se há erro na busca
  if (error) {
    console.error('Erro ao buscar parceiros de guincho:', error);
  }
  
  // Componentes de carregamento para diferentes partes da UI
  const renderSkeletonCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="h-64">
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-9 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
  
  const renderSkeletonTable = () => (
    <div className="space-y-2 my-4">
      <Skeleton className="h-10 w-full" />
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );

  return (
    <div className="container mx-auto py-6 space-y-8 max-w-7xl">
      <PageHeader
        title="Parceiros de Guincho"
        description="Gerencie suas parcerias com empresas de guincho e reboque"
        icon={<Truck size={28} />}
      />
      
      {/* Ações Principais */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nome, cidade ou região..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="hidden md:flex gap-2">
            <Filter size={16} />
            Filtros
          </Button>
          
          {canAddPartners && (
            <SafeLink to="/fleet-management/towing-partners/new">
              <Button size="sm" className="gap-2">
                <Plus size={16} />
                Novo Parceiro
              </Button>
            </SafeLink>
          )}
          
          <SafeLink to="/fleet-management/towing-partners/requests">
            <Button variant="outline" size="sm" className="gap-2">
              <FileText size={16} />
              Solicitações
            </Button>
          </SafeLink>

          <SafeLink to="/fleet-management/towing-partners/servicos-pendentes">
            <Button variant="secondary" size="sm" className="gap-2">
              <FileText size={16} />
              Serviços Pendentes
            </Button>
          </SafeLink>
        </div>
      </div>
      
      {/* Abas para filtrar por status */}
      <Tabs defaultValue="todos" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="ativo">Ativos</TabsTrigger>
          <TabsTrigger value="pendente">Pendentes</TabsTrigger>
          <TabsTrigger value="inativo">Inativos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="todos" className="mt-6">
          <div className="my-4 grid gap-6">
            {/* Estatísticas resumidas */}
            {!isSummaryLoading && partnersSummary && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total de Parceiros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{partners?.length || 0}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Parceiros Ativos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{partners?.filter(p => p.status === 'ativo').length || 0}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Solicitações do Mês</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {partnersSummary.reduce((sum, p) => sum + (p.total_requests || 0), 0)}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avaliação Média</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <div className="text-2xl font-bold mr-2">
                        {(partnersSummary.reduce((sum, p) => sum + p.rating, 0) / partnersSummary.length).toFixed(1)}
                      </div>
                      <RatingStars rating={partnersSummary.reduce((sum, p) => sum + p.rating, 0) / partnersSummary.length} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Tabela de parceiros */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Parceiros</CardTitle>
                <CardDescription>
                  {filteredPartners.length} parceiros encontrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  renderSkeletonTable()
                ) : filteredPartners.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Região</TableHead>
                        <TableHead>Serviços</TableHead>
                        <TableHead>Valor (R$/km)</TableHead>
                        <TableHead>Avaliação</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPartners.map((partner) => (
                        <TableRow key={partner.id}>
                          <TableCell className="font-medium">{partner.name}</TableCell>
                          <TableCell>{partner.city}, {partner.region}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {partner.service_types.slice(0, 2).map((type, i) => (
                                <Badge key={i} variant="outline" className="font-normal text-xs">
                                  {type}
                                </Badge>
                              ))}
                              {partner.service_types.length > 2 && (
                                <Badge variant="outline" className="font-normal text-xs">
                                  +{partner.service_types.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {partner.cost_per_km 
                              ? <span className="font-medium text-primary">R$ {partner.cost_per_km.toFixed(2)}</span>
                              : <span className="text-muted-foreground text-sm">Não informado</span>
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <RatingStars rating={partner.rating} />
                              <span className="ml-1 text-sm">{partner.rating.toFixed(1)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={partner.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <SafeLink to={`/fleet-management/towing-partners/${partner.id}`}>
                              <Button variant="default" size="sm">
                                Ver detalhes
                              </Button>
                            </SafeLink>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <AlertCircle className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
                    <h3 className="font-medium text-lg mb-2">Nenhum parceiro encontrado</h3>
                    <p>Não foram encontrados parceiros com os filtros selecionados.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="ativo" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              renderSkeletonCards()
            ) : filteredPartners.length > 0 ? (
              filteredPartners.map((partner) => (
                <PartnerCard key={partner.id} partner={partner} />
              ))
            ) : (
              <div className="col-span-3 text-center py-10 text-muted-foreground">
                <AlertCircle className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
                <h3 className="font-medium text-lg mb-2">Nenhum parceiro ativo encontrado</h3>
                <p>Não foram encontrados parceiros ativos com os filtros selecionados.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="pendente" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              renderSkeletonCards()
            ) : filteredPartners.length > 0 ? (
              filteredPartners.map((partner) => (
                <div key={partner.id} className="relative">
                  <div className="absolute -top-1 -right-1 z-10">
                    <Badge className="bg-amber-500 hover:bg-amber-600">Pendente</Badge>
                  </div>
                  <Card className="overflow-hidden">
                    <CardHeader>
                      <CardTitle>{partner.name}</CardTitle>
                      <CardDescription>{partner.city}, {partner.region}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm font-medium mb-1">Contato</div>
                          <div className="text-sm text-muted-foreground">{partner.phone}</div>
                          <div className="text-sm text-muted-foreground">{partner.email}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-1">Serviços oferecidos</div>
                          <div className="flex flex-wrap gap-1">
                            {partner.service_types.map((type, i) => (
                              <Badge key={i} variant="outline" className="font-normal">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => approvePartnerMutation.mutate(partner.id)}
                        disabled={loadingApproval === partner.id}
                      >
                        {loadingApproval === partner.id ? (
                          <span className="flex items-center">
                            <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-primary rounded-full"></span>
                            Aprovando...
                          </span>
                        ) : "Aprovar"}
                      </Button>
                      <SafeLink to={`/fleet-management/towing-partners/${partner.id}`}>
                        <Button variant="default" size="sm">
                          Ver detalhes
                        </Button>
                      </SafeLink>
                    </CardFooter>
                  </Card>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-10 text-muted-foreground">
                <AlertCircle className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
                <h3 className="font-medium text-lg mb-2">Nenhum parceiro pendente</h3>
                <p>Não há parceiros pendentes de aprovação no momento.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="inativo" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              renderSkeletonCards()
            ) : filteredPartners.length > 0 ? (
              filteredPartners.map((partner) => (
                <div key={partner.id} className="relative">
                  <div className="absolute -top-1 -right-1 z-10">
                    <Badge variant="secondary" className="bg-gray-400 hover:bg-gray-500">Inativo</Badge>
                  </div>
                  <Card className="overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                    <CardHeader>
                      <CardTitle>{partner.name}</CardTitle>
                      <CardDescription>{partner.city}, {partner.region}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm font-medium mb-1">Contato</div>
                          <div className="text-sm text-muted-foreground">{partner.phone}</div>
                          <div className="text-sm text-muted-foreground">{partner.email}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-1">Serviços oferecidos</div>
                          <div className="flex flex-wrap gap-1">
                            {partner.service_types.map((type, i) => (
                              <Badge key={i} variant="outline" className="font-normal">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm">
                        Reativar
                      </Button>
                      <SafeLink to={`/fleet-management/towing-partners/${partner.id}`}>
                        <Button variant="default" size="sm">
                          Ver detalhes
                        </Button>
                      </SafeLink>
                    </CardFooter>
                  </Card>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-10 text-muted-foreground">
                <AlertCircle className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
                <h3 className="font-medium text-lg mb-2">Nenhum parceiro inativo</h3>
                <p>Não foram encontrados parceiros inativos com os filtros selecionados.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TowingPartnersPage;