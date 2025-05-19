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
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/layout/PageHeader';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

// Ícones
import { 
  FileText, 
  Truck, 
  Search, 
  Clock, 
  Filter, 
  CalendarRange,
  MapPin, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Plus
} from 'lucide-react';

// Tipos
interface TowingRequest {
  id: number;
  partner_id: number;
  partner_name: string;
  vehicle_plate: string;
  driver_name: string;
  pickup_location: string;
  destination: string;
  status: 'pendente' | 'aprovado' | 'em_andamento' | 'concluido' | 'cancelado';
  created_at: string;
  updated_at: string | null;
  service_type: string;
  urgency: 'baixa' | 'media' | 'alta';
  estimated_cost: number;
  rating?: number;
  comments?: string;
}

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

// Formatador de data
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('pt-BR', options);
};

// Página principal de Solicitações de Guincho
const TowingRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('todos');
  const [filterPartner, setFilterPartner] = useState<string | null>(null);
  
  // Buscar solicitações de guincho
  const {
    data: requests,
    isLoading,
    error,
  } = useQuery<TowingRequest[]>({
    queryKey: ['/api/towing/requests'],
    enabled: !!user,
  });
  
  // Buscar parceiros para filtro
  const {
    data: partners,
    isLoading: isPartnersLoading,
  } = useQuery<{id: number, name: string}[]>({
    queryKey: ['/api/towing/partners'],
    enabled: !!user,
  });
  
  // Filtrar solicitações com base na pesquisa e na aba ativa
  const filteredRequests = requests
    ? requests.filter(request => {
        // Filtro de pesquisa
        const matchesSearch = 
          request.vehicle_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.partner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.pickup_location.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Filtro de status
        const matchesStatus = 
          activeTab === 'todos' || 
          request.status === activeTab;
        
        // Filtro de parceiro
        const matchesPartner = 
          !filterPartner || 
          request.partner_id.toString() === filterPartner;
        
        return matchesSearch && matchesStatus && matchesPartner;
      })
    : [];
  
  // Verificar se o usuário tem permissão para adicionar novas solicitações
  const canManageRequests = user && ['admin', 'gestor_frota', 'gestor', 'operador'].includes(user.role);
  
  // Estatísticas das solicitações
  const requestStats = {
    total: filteredRequests.length,
    pendentes: filteredRequests.filter(r => r.status === 'pendente').length,
    aprovados: filteredRequests.filter(r => r.status === 'aprovado').length,
    emAndamento: filteredRequests.filter(r => r.status === 'em_andamento').length,
    concluidos: filteredRequests.filter(r => r.status === 'concluido').length,
    cancelados: filteredRequests.filter(r => r.status === 'cancelado').length,
  };
  
  // Verificar se há erro na busca
  if (error) {
    console.error('Erro ao buscar solicitações de guincho:', error);
  }
  
  // Componentes de carregamento
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
        title="Solicitações de Guincho"
        description="Gerencie todas as solicitações de serviço de guincho e reboque"
        icon={<FileText size={28} />}
      />
      
      {/* Ações Principais */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por placa, motorista, parceiro..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <div className="w-48">
            <Select value={filterPartner || ""} onValueChange={setFilterPartner}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar parceiro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos parceiros</SelectItem>
                {partners?.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id.toString()}>
                    {partner.name || `Parceiro #${partner.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {canManageRequests && (
            <Link to="/fleet-management/towing-partners/requests/new">
              <Button size="sm" className="gap-2">
                <Plus size={16} />
                Nova Solicitação
              </Button>
            </Link>
          )}
        </div>
      </div>
      
      {/* Estatísticas de solicitações */}
      {!isLoading && requests && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{requestStats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">{requestStats.pendentes}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aprovados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{requestStats.aprovados}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Em Andamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-500">{requestStats.emAndamento}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Concluídos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{requestStats.concluidos}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cancelados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{requestStats.cancelados}</div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Abas para filtrar por status */}
      <Tabs defaultValue="todos" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="pendente">Pendentes</TabsTrigger>
          <TabsTrigger value="aprovado">Aprovados</TabsTrigger>
          <TabsTrigger value="em_andamento">Em Andamento</TabsTrigger>
          <TabsTrigger value="concluido">Concluídos</TabsTrigger>
          <TabsTrigger value="cancelado">Cancelados</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{activeTab === 'todos' ? 'Todas as Solicitações' : 
                activeTab === 'pendente' ? 'Solicitações Pendentes' :
                activeTab === 'aprovado' ? 'Solicitações Aprovadas' :
                activeTab === 'em_andamento' ? 'Solicitações Em Andamento' :
                activeTab === 'concluido' ? 'Solicitações Concluídas' :
                'Solicitações Canceladas'}</CardTitle>
              <CardDescription>
                {filteredRequests.length} {filteredRequests.length === 1 ? 'solicitação encontrada' : 'solicitações encontradas'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                renderSkeletonTable()
              ) : filteredRequests.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Veículo</TableHead>
                        <TableHead>Parceiro</TableHead>
                        <TableHead>Local</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Urgência</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">#{request.id}</TableCell>
                          <TableCell>{request.vehicle_plate}</TableCell>
                          <TableCell>{request.partner_name}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={request.pickup_location}>
                            {request.pickup_location}
                          </TableCell>
                          <TableCell>{formatDate(request.created_at)}</TableCell>
                          <TableCell>
                            <UrgencyBadge urgency={request.urgency} />
                          </TableCell>
                          <TableCell>
                            <RequestStatusBadge status={request.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {request.status === 'pendente' && canManageRequests && (
                                <>
                                  <Button variant="outline" size="sm" className="h-8 px-2">
                                    <XCircle className="h-4 w-4 mr-1" /> Recusar
                                  </Button>
                                  <Button size="sm" className="h-8 px-2">
                                    <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
                                  </Button>
                                </>
                              )}
                              <Link to={`/fleet-management/towing-partners/requests/${request.id}`}>
                                <Button variant="ghost" size="sm" className="h-8 px-2">
                                  Detalhes
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Nenhuma solicitação encontrada</h3>
                  <p className="mt-2">Tente ajustar os filtros ou criar uma nova solicitação.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TowingRequestsPage;