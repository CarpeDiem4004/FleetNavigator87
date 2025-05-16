import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
}

interface TowingPartnerSummary extends TowingPartner {
  total_requests: number;
  completed_requests: number;
  avg_rating: number;
  last_request_date: string | null;
}

// Componente para cartão/card de parceiro
const PartnerCard: React.FC<{ partner: TowingPartner }> = ({ partner }) => {
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
        <Link to={`/fleet-management/towing-partners/${partner.id}`}>
          <Button variant="ghost" size="sm" className="w-full text-primary">
            Ver detalhes <ChevronRight size={16} className="ml-1" />
          </Button>
        </Link>
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
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('todos');
  
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
            <Link to="/fleet-management/towing-partners/new">
              <Button size="sm" className="gap-2">
                <Plus size={16} />
                Novo Parceiro
              </Button>
            </Link>
          )}
          
          <Link to="/fleet-management/towing-partners/requests">
            <Button variant="outline" size="sm" className="gap-2">
              <FileText size={16} />
              Solicitações
            </Button>
          </Link>
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
                            <div className="flex items-center">
                              <RatingStars rating={partner.rating} />
                              <span className="ml-1 text-sm">{partner.rating.toFixed(1)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={partner.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Link to={`/fleet-management/towing-partners/${partner.id}`}>
                              <Button variant="ghost" size="sm">
                                Ver detalhes
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Nenhum parceiro encontrado</h3>
                    <p className="mt-2">Tente ajustar os filtros ou adicione um novo parceiro.</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Visualização em cards (alternativa) */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Parceiros Destacados</h3>
              <Separator className="mb-6" />
              
              {isLoading ? (
                renderSkeletonCards()
              ) : filteredPartners.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPartners
                    .filter(p => p.status === 'ativo')
                    .slice(0, 6)
                    .map(partner => (
                      <PartnerCard key={partner.id} partner={partner} />
                    ))}
                </div>
              ) : null}
            </div>
          </div>
        </TabsContent>
        
        {/* Conteúdo duplicado para outras abas, usando o mesmo filtro */}
        <TabsContent value="ativo" className="mt-6">
          <div className="my-4 grid gap-6">
            {/* Tabela de parceiros ativos */}
            {/* Mesma estrutura mas filtrada pelos status */}
            <Card>
              <CardHeader>
                <CardTitle>Parceiros Ativos</CardTitle>
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
                        <TableHead>Avaliação</TableHead>
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
                            <div className="flex items-center">
                              <RatingStars rating={partner.rating} />
                              <span className="ml-1 text-sm">{partner.rating.toFixed(1)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link to={`/fleet-management/towing-partners/${partner.id}`}>
                              <Button variant="ghost" size="sm">
                                Ver detalhes
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Nenhum parceiro ativo encontrado</h3>
                    <p className="mt-2">Tente ajustar os filtros ou adicione um novo parceiro.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="pendente" className="mt-6">
          <div className="my-4">
            <Card>
              <CardHeader>
                <CardTitle>Parceiros Pendentes</CardTitle>
                <CardDescription>Parceiros aguardando aprovação ou em processo de credenciamento</CardDescription>
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
                        <TableHead>Contato</TableHead>
                        <TableHead>Serviços</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPartners.map((partner) => (
                        <TableRow key={partner.id}>
                          <TableCell className="font-medium">{partner.name}</TableCell>
                          <TableCell>{partner.city}, {partner.region}</TableCell>
                          <TableCell>{partner.phone}</TableCell>
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
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {canAddPartners && (
                                <Button variant="default" size="sm">
                                  Aprovar
                                </Button>
                              )}
                              <Link to={`/fleet-management/towing-partners/${partner.id}`}>
                                <Button variant="ghost" size="sm">
                                  Ver detalhes
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Nenhum parceiro pendente</h3>
                    <p className="mt-2">Todos os parceiros estão com status definido.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="inativo" className="mt-6">
          <div className="my-4">
            <Card>
              <CardHeader>
                <CardTitle>Parceiros Inativos</CardTitle>
                <CardDescription>Parceiros desativados ou com contrato suspenso</CardDescription>
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
                        <TableHead>Contato</TableHead>
                        <TableHead>Desde</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPartners.map((partner) => (
                        <TableRow key={partner.id}>
                          <TableCell className="font-medium">{partner.name}</TableCell>
                          <TableCell>{partner.city}, {partner.region}</TableCell>
                          <TableCell>{partner.phone}</TableCell>
                          <TableCell>01/05/2025</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {canAddPartners && (
                                <Button variant="outline" size="sm">
                                  Reativar
                                </Button>
                              )}
                              <Link to={`/fleet-management/towing-partners/${partner.id}`}>
                                <Button variant="ghost" size="sm">
                                  Ver detalhes
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Nenhum parceiro inativo</h3>
                    <p className="mt-2">Todos os parceiros estão ativos no momento.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
      </Tabs>
    </div>
  );
};

export default TowingPartnersPage;