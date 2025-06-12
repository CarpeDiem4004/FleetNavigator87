import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { CreditCard, Filter, Search, Calendar, CheckCircle2, XCircle, Clock, AlertCircle, TrendingUp, TrendingDown, DollarSign, Download, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import FuelCardRequestForm from '@/components/FuelCardRequestForm';

interface FuelCardSolicitation {
  id: number;
  placa: string;
  motorista: string;
  valor_solicitado: number;
  km_veiculo?: number;
  tipo_cartao?: string;
  observacoes?: string;
  status: 'Pendente' | 'Em Análise' | 'Recarga Efetuada' | 'Negado';
  data_solicitacao: string;
  atendido_por?: string;
  data_atendimento?: string;
  base?: string;
  origem_tipo?: string;
  numero_cartao?: string;
  cartao_combustivel?: string;
  id_rota?: string;
  tipo_combustivel?: string;
  litros_solicitados?: number;
  veiculo_modelo?: string;
  rota_origem?: string;
  rota_destino?: string;
  km_total?: number;
  horario_abastecimento?: string;
  telefone_motorista?: string;
  valor_calculado?: number;
  calculo_detalhes?: {
    km_rota: number;
    km_acrescimo: number;
    km_total: number;
    consumo_medio: number;
    litros_necessarios: string;
    valor_por_litro: number;
    valor_total: string;
  };
}

const FuelCardRequestsPanel: React.FC = () => {
  const [solicitations, setSolicitations] = useState<FuelCardSolicitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSolicitation, setSelectedSolicitation] = useState<FuelCardSolicitation | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [projects, setProjects] = useState<any[]>([]);
  const [editedStatus, setEditedStatus] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isNewRequestDialogOpen, setIsNewRequestDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Verificar se é usuário Line Hall para usar layout sem sidebar
  const isLineHallUser = user?.role === 'line_hall';
  
  useEffect(() => {
    fetchSolicitations();
    fetchProjects();
  }, []);

  const fetchSolicitations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest('GET', '/api/fuel-card-solicitations');
      const data = await response.json();
      
      if (data.success) {
        setSolicitations(data.data);
      } else {
        setError(data.message || 'Erro ao carregar solicitações');
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: data.message || 'Falha ao carregar solicitações'
        });
      }
    } catch (err) {
      console.error('Erro ao buscar solicitações:', err);
      setError('Erro ao conectar ao servidor');
      toast({
        variant: 'destructive',
        title: 'Erro de Conexão',
        description: 'Não foi possível conectar ao servidor'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await apiRequest('GET', '/api/projects-with-bases');
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.data);
      }
    } catch (err) {
      console.error('Erro ao buscar projetos:', err);
    }
  };
  
  const handleOpenSolicitation = (solicitation: FuelCardSolicitation) => {
    setSelectedSolicitation(solicitation);
    setEditedStatus(solicitation.status);
    setIsSheetOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedSolicitation) return;
    
    setUpdatingStatus(true);
    try {
      const response = await apiRequest('PUT', `/api/fuel-card-solicitations/${selectedSolicitation.id}`, {
        status: editedStatus,
        atendido_por: user?.name || 'Sistema'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Status atualizado',
          description: `Solicitação marcada como: ${editedStatus}`,
        });
        
        fetchSolicitations();
        setIsSheetOpen(false);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar o status',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredSolicitations = solicitations.filter(sol => {
    if (statusFilter !== 'all' && sol.status !== statusFilter) return false;
    if (dateFilter && !sol.data_solicitacao.includes(dateFilter)) return false;
    if (projectFilter !== 'all') {
      const selectedProject = projects.find(p => p.id.toString() === projectFilter);
      if (selectedProject) {
        const projectBases = selectedProject.bases?.map((base: any) => base.name) || [];
        if (!projectBases.includes(sol.base)) {
          return false;
        }
      }
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        sol.placa.toLowerCase().includes(query) ||
        sol.motorista.toLowerCase().includes(query)
      );
    }
    return true;
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Recarga Efetuada':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Recarga Efetuada</Badge>;
      case 'Negado':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" /> Negado</Badge>;
      case 'Em Análise':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100"><Clock className="w-3 h-3 mr-1" /> Em Análise</Badge>;
      case 'Pendente':
      default:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><AlertCircle className="w-3 h-3 mr-1" /> Pendente</Badge>;
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatistics = () => {
    const pendentes = solicitations.filter(s => s.status === 'Pendente' || s.status === 'Em Análise').length;
    const atendidas = solicitations.filter(s => s.status === 'Recarga Efetuada').length;
    
    const recargasEfetuadas = solicitations.filter(s => s.status === 'Recarga Efetuada');
    console.log('Debugging valor calculation:', {
      totalSolicitations: solicitations.length,
      recargasEfetuadas: recargasEfetuadas,
      sampleData: recargasEfetuadas.slice(0, 3)
    });

    const valorTotalAtendido = recargasEfetuadas.reduce((total, sol) => {
      let valorNumerico = 0;
      
      if (sol.valor_solicitado) {
        if (typeof sol.valor_solicitado === 'string') {
          valorNumerico = parseFloat(sol.valor_solicitado.replace(',', '.'));
        } else {
          valorNumerico = sol.valor_solicitado;
        }
      }
      
      console.log('Processing value:', {
        status: sol.status,
        valor_solicitado: sol.valor_solicitado,
        parsed: valorNumerico
      });
      
      return total + (isNaN(valorNumerico) ? 0 : valorNumerico);
    }, 0);

    console.log('Final valorTotalAtendido:', valorTotalAtendido);
    
    return {
      total: solicitations.length,
      pendentes,
      atendidas,
      valorTotalAtendido
    };
  };

  const stats = getStatistics();

  // Componente do conteúdo principal
  const PageContent = () => (
    <div className="space-y-6">
      {/* Navigation back button for Line Hall users */}
      {isLineHallUser && (
        <div className="flex items-center space-x-2 mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isLineHallUser ? 'Atendimento de Solicitações Line Hall' : 'Solicitações de Cartão Combustível'}
          </h1>
          <p className="text-muted-foreground">
            {isLineHallUser 
              ? 'Aprove ou rejeite solicitações dos motoristas Line Hall'
              : 'Gerencie solicitações de recarga de cartão combustível'
            }
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Total de Solicitações</p>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <p className="text-sm font-medium">Pendentes</p>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendentes}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-sm font-medium">Atendidas</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.atendidas}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-medium">Valor Total Atendido</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.valorTotalAtendido)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Em Análise">Em Análise</SelectItem>
                  <SelectItem value="Recarga Efetuada">Recarga Efetuada</SelectItem>
                  <SelectItem value="Negado">Negado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-filter">Data</Label>
              <Input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-filter">Projeto</Label>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger id="project-filter">
                  <SelectValue placeholder="Selecione o projeto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Projetos</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="search-filter">Buscar (Placa/Motorista)</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-filter"
                  placeholder="Buscar solicitação..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabela de Solicitações */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between">
            <div>
              <CardTitle>Solicitações de Recarga</CardTitle>
              <CardDescription>
                Mostrando {filteredSolicitations.length} solicitações
              </CardDescription>
            </div>
            <Button onClick={fetchSolicitations} variant="outline" size="sm">
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Erro ao carregar dados</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchSolicitations}>
                Tentar novamente
              </Button>
            </div>
          ) : filteredSolicitations.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma solicitação encontrada</h3>
              <p className="text-gray-600">Não há solicitações que correspondam aos filtros aplicados.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSolicitations.map((solicitation) => (
                <div
                  key={solicitation.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleOpenSolicitation(solicitation)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <h4 className="font-semibold">{solicitation.placa}</h4>
                          <p className="text-sm text-gray-600">{solicitation.motorista}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(solicitation.valor_solicitado)}</p>
                          <p className="text-sm text-gray-600">{formatDate(solicitation.data_solicitacao)}</p>
                        </div>
                        <div>
                          {getStatusBadge(solicitation.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sheet de detalhes */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes da Solicitação</SheetTitle>
            <SheetDescription>
              Visualize e gerencie os detalhes desta solicitação de recarga
            </SheetDescription>
          </SheetHeader>
          
          {selectedSolicitation ? (
            <div className="mt-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Placa do Veículo</Label>
                  <div className="text-lg font-bold">{selectedSolicitation.placa}</div>
                </div>
                
                <div>
                  <Label>Motorista</Label>
                  <div className="text-lg">{selectedSolicitation.motorista}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Valor Solicitado</Label>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(selectedSolicitation.valor_solicitado)}
                    </div>
                  </div>
                  <div>
                    <Label>Status Atual</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedSolicitation.status)}
                    </div>
                  </div>
                </div>

                {selectedSolicitation.origem_tipo === 'line_hall' && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <Label className="text-blue-800 font-semibold">Informações Line Hall Shopee</Label>
                    <div className="mt-2 space-y-2">
                      {selectedSolicitation.veiculo_modelo && (
                        <div className="text-sm">
                          <span className="font-medium">Modelo do Veículo:</span> {selectedSolicitation.veiculo_modelo}
                        </div>
                      )}
                      {selectedSolicitation.rota_origem && selectedSolicitation.rota_destino && (
                        <div className="text-sm">
                          <span className="font-medium">Rota:</span> {selectedSolicitation.rota_origem} → {selectedSolicitation.rota_destino}
                        </div>
                      )}
                      {selectedSolicitation.km_total && (
                        <div className="text-sm">
                          <span className="font-medium">KM Total:</span> {selectedSolicitation.km_total} km
                        </div>
                      )}
                      {selectedSolicitation.telefone_motorista && (
                        <div className="text-sm">
                          <span className="font-medium">Telefone:</span> {selectedSolicitation.telefone_motorista}
                        </div>
                      )}
                      {selectedSolicitation.horario_abastecimento && (
                        <div className="text-sm">
                          <span className="font-medium">Horário Abastecimento:</span> {selectedSolicitation.horario_abastecimento === 'antes_17h' ? 'Antes das 17h' : 'Após as 18h'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {selectedSolicitation.calculo_detalhes && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <Label className="text-green-800 font-semibold">Detalhes do Cálculo</Label>
                    <div className="mt-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">KM da Rota:</span> {selectedSolicitation.calculo_detalhes.km_rota} km
                        </div>
                        <div>
                          <span className="font-medium">KM Adicional:</span> {selectedSolicitation.calculo_detalhes.km_acrescimo} km
                        </div>
                        <div>
                          <span className="font-medium">Total KM:</span> {selectedSolicitation.calculo_detalhes.km_total} km
                        </div>
                        <div>
                          <span className="font-medium">Consumo Médio:</span> {selectedSolicitation.calculo_detalhes.consumo_medio} km/l
                        </div>
                        <div>
                          <span className="font-medium">Litros Necessários:</span> {selectedSolicitation.calculo_detalhes.litros_necessarios} L
                        </div>
                        <div>
                          <span className="font-medium">Valor por Litro:</span> R$ {selectedSolicitation.calculo_detalhes.valor_por_litro.toFixed(2)}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-green-300">
                        <div className="text-lg font-bold text-green-800">
                          <span className="font-medium">Valor Total:</span> R$ {selectedSolicitation.calculo_detalhes.valor_total}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <Label>Observações</Label>
                  <div className="bg-gray-50 p-3 rounded-md mt-1 min-h-[80px]">
                    {selectedSolicitation.observacoes || 'Nenhuma observação registrada.'}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data da Solicitação</Label>
                    <div className="text-sm">{formatDate(selectedSolicitation.data_solicitacao)}</div>
                  </div>
                  <div>
                    <Label>Atendido por</Label>
                    <div className="text-sm">{selectedSolicitation.atendido_por || '-'}</div>
                  </div>
                </div>
                
                {selectedSolicitation.data_atendimento && (
                  <div>
                    <Label>Data de Atendimento</Label>
                    <div className="text-sm">{formatDate(selectedSolicitation.data_atendimento)}</div>
                  </div>
                )}
                
                <Separator />
                
                {/* Seção de Controle de Status */}
                <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
                  <h3 className="font-semibold text-lg text-gray-900">Controle de Status</h3>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium">Alterar Status da Solicitação</Label>
                      <Select value={editedStatus} onValueChange={setEditedStatus}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o novo status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pendente">🟡 Pendente</SelectItem>
                          <SelectItem value="Em Análise">🔵 Em Análise</SelectItem>
                          <SelectItem value="Recarga Efetuada">🟢 Recarga Efetuada</SelectItem>
                          <SelectItem value="Negado">🔴 Negado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      onClick={handleStatusUpdate} 
                      className="w-full bg-blue-600 hover:bg-blue-700" 
                      disabled={updatingStatus || editedStatus === selectedSolicitation.status}
                      size="lg"
                    >
                      {updatingStatus ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );

  // Renderizar com layout condicional
  if (isLineHallUser) {
    return (
      <MainLayoutSimple>
        <PageContent />
      </MainLayoutSimple>
    );
  }

  return (
    <AppLayout>
      <PageContent />
    </AppLayout>
  );
};

export default FuelCardRequestsPanel;