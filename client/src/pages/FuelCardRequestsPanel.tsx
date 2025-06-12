import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
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
import { CreditCard, Filter, Search, Calendar, CheckCircle2, XCircle, Clock, AlertCircle, TrendingUp, TrendingDown, DollarSign, Download, Plus, Trash2 } from 'lucide-react';
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
  cartao_combustivel?: string; // Cartão vinculado ao veículo
  id_rota?: string;
  tipo_combustivel?: string;
  litros_solicitados?: number;
  // Campos do Line Hall Shopee
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

  const handleDeleteSolicitation = async (solicitacao: FuelCardSolicitation) => {
    if (!user || user.role !== 'admin') {
      toast({
        title: 'Acesso negado',
        description: 'Apenas administradores podem excluir solicitações.',
        variant: 'destructive',
      });
      return;
    }

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a solicitação de ${solicitacao.motorista} (${solicitacao.placa})?`
    );

    if (!confirmed) return;

    try {
      let endpoint = '';
      
      // Determinar endpoint baseado no tipo de origem
      if (solicitacao.origem_tipo === 'line_hall') {
        endpoint = `/api/line-hall/fuel-requests/${solicitacao.id}`;
      } else {
        endpoint = `/api/fuel-card-solicitations/${solicitacao.id}`;
      }

      const response = await apiRequest('DELETE', endpoint);
      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Solicitação excluída',
          description: 'A solicitação foi removida com sucesso.',
        });
        
        // Remover da lista local
        setSolicitations(prev => prev.filter(s => 
          !(s.id === solicitacao.id && s.origem_tipo === solicitacao.origem_tipo)
        ));
      } else {
        throw new Error(data.message || 'Erro ao excluir solicitação');
      }
    } catch (error) {
      console.error('Erro ao excluir solicitação:', error);
      toast({
        title: 'Erro ao excluir',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };
  
  const handleStatusUpdate = async () => {
    if (!selectedSolicitation) return;
    
    try {
      setUpdatingStatus(true);
      
      const updateData = {
        id: selectedSolicitation.id,
        status: editedStatus,
        origem_tipo: selectedSolicitation.origem_tipo,
        atendido_por: user?.name,
        observacoes: selectedSolicitation.observacoes
      };
      
      const response = await apiRequest('PUT', `/api/fuel-card-solicitations/${selectedSolicitation.id}/status`, updateData);
      const data = await response.json();
      
      if (data.success) {
        // Atualizar a lista de solicitações
        setSolicitations(solicitations.map(sol => 
          sol.id === selectedSolicitation.id ? {...sol, status: editedStatus as FuelCardSolicitation['status'], atendido_por: user?.name, data_atendimento: new Date().toISOString()} : sol
        ));
        
        setSelectedSolicitation({
          ...selectedSolicitation,
          status: editedStatus as any,
          atendido_por: user?.name,
          data_atendimento: new Date().toISOString()
        });
        
        toast({
          title: 'Sucesso',
          description: 'Status da solicitação atualizado com sucesso'
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: data.message || 'Falha ao atualizar status'
        });
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar o status'
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const filteredData = getFilteredSolicitations();
      
      const response = await apiRequest('POST', '/api/fuel-card-solicitations/export', {
        solicitations: filteredData
      });
      
      if (response.ok) {
        // Criar URL para download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `solicitacoes-cartao-combustivel-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Exportação concluída',
          description: 'Relatório Excel gerado com sucesso',
        });
      } else {
        throw new Error('Erro ao exportar dados');
      }
    } catch (error) {
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível gerar o arquivo Excel',
        variant: 'destructive',
      });
    }
  };
  
  const getFilteredSolicitations = () => {
    return solicitations.filter(sol => {
      // Filtro por status
      if (statusFilter !== 'all' && sol.status !== statusFilter) {
        return false;
      }
      
      // Filtro por data
      if (dateFilter) {
        const solDate = new Date(sol.data_solicitacao).toISOString().split('T')[0];
        if (solDate !== dateFilter) {
          return false;
        }
      }
      
      // Filtro por projeto
      if (projectFilter !== 'all') {
        // Buscar o projeto selecionado e suas bases
        const selectedProject = projects.find(p => p.id.toString() === projectFilter);
        if (selectedProject) {
          const projectBases = selectedProject.bases?.map((b: any) => b.base_name) || [];
          if (!projectBases.includes(sol.base)) {
            return false;
          }
        }
      }
      
      // Filtro por busca (placa ou motorista)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          sol.placa.toLowerCase().includes(query) ||
          sol.motorista.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  };
  
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

  // Funções para calcular estatísticas
  const getStatistics = () => {
    const pendentes = solicitations.filter(s => s.status === 'Pendente' || s.status === 'Em Análise').length;
    const atendidas = solicitations.filter(s => s.status === 'Recarga Efetuada').length;
    
    // Debug: verificar estrutura dos dados
    console.log('Debugging valor calculation:', {
      totalSolicitations: solicitations.length,
      recargasEfetuadas: solicitations.filter(s => s.status === 'Recarga Efetuada'),
      sampleData: solicitations.slice(0, 2)
    });
    
    // Calcular valor total atendido com validação numérica
    const valorTotalAtendido = solicitations
      .filter(s => s.status === 'Recarga Efetuada')
      .reduce((total, s) => {
        const valor = parseFloat(s.valor_solicitado?.toString() || '0');
        console.log('Processing value:', { 
          status: s.status, 
          valor_solicitado: s.valor_solicitado, 
          parsed: valor 
        });
        return total + (isNaN(valor) ? 0 : valor);
      }, 0);
    
    console.log('Final valorTotalAtendido:', valorTotalAtendido);
    
    return { pendentes, atendidas, valorTotalAtendido };
  };
  
  const statistics = getStatistics();
  const filteredSolicitations = getFilteredSolicitations();
  
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            <CreditCard className="inline-block mr-2" />
            Painel de Solicitações de Cartão de Abastecimento
          </h1>
          <div className="flex items-center gap-3">
            <Dialog open={isNewRequestDialogOpen} onOpenChange={setIsNewRequestDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Solicitação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nova Solicitação de Cartão de Combustível</DialogTitle>
                </DialogHeader>
                <FuelCardRequestForm
                  onRequestCreated={() => {
                    fetchSolicitations();
                    setIsNewRequestDialogOpen(false);
                  }}
                  onClose={() => setIsNewRequestDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
            <Button onClick={handleExportExcel} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Baixar Relatório Excel
            </Button>
          </div>
        </div>
        
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solicitações Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{statistics.pendentes}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando processamento
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solicitações Atendidas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.atendidas}</div>
              <p className="text-xs text-muted-foreground">
                Recargas efetuadas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total Atendido</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(statistics.valorTotalAtendido)}</div>
              <p className="text-xs text-muted-foreground">
                Soma das recargas efetuadas
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Em Análise">Em Análise</SelectItem>
                    <SelectItem value="Recarga Efetuada">Recarga Efetuada</SelectItem>
                    <SelectItem value="Negado">Negado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date-filter">Data</Label>
                <div className="flex items-center">
                  <Input 
                    id="date-filter" 
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                  {dateFilter && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setDateFilter('')}
                      className="ml-2"
                    >
                      Limpar
                    </Button>
                  )}
                </div>
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
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
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
              <div className="text-center py-6 text-red-500">
                <AlertCircle className="w-10 h-10 mx-auto mb-2" />
                <p>{error}</p>
                <Button onClick={fetchSolicitations} className="mt-4">
                  Tentar novamente
                </Button>
              </div>
            ) : filteredSolicitations.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                Nenhuma solicitação encontrada com os filtros atuais.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placa</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motorista</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KM</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operação</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSolicitations.map((solicitacao, index) => (
                      <tr 
                        key={`${solicitacao.id}-${solicitacao.origem_tipo}-${index}`} 
                        className={`hover:bg-gray-50 ${solicitacao.status === 'Pendente' ? 'bg-yellow-50' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{solicitacao.placa}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{solicitacao.motorista}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{formatCurrency(solicitacao.valor_solicitado)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{solicitacao.km_total || solicitacao.km_veiculo || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Badge variant="outline" className={
                            solicitacao.origem_tipo === 'line_hall' 
                              ? "bg-blue-100 text-blue-800" 
                              : "bg-green-100 text-green-800"
                          }>
                            {solicitacao.origem_tipo === 'line_hall' ? 'Line Hall Shopee' : 'Tradicional'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{solicitacao.base || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(solicitacao.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(solicitacao.data_solicitacao).split(',')[0]}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleOpenSolicitation(solicitacao)}
                            >
                              Visualizar
                            </Button>
                            {user?.role === 'admin' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteSolicitation(solicitacao)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Painel Lateral */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto max-h-screen">
            {selectedSolicitation ? (
              <div className="space-y-6 pb-6">
                <SheetHeader>
                  <SheetTitle>Detalhes da Solicitação</SheetTitle>
                  <SheetDescription>
                    Solicitation ID: #{selectedSolicitation.id}
                  </SheetDescription>
                </SheetHeader>
                
                <div className="grid gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Placa do Veículo</Label>
                      <div className="text-lg font-medium">{selectedSolicitation.placa}</div>
                    </div>
                    <div>
                      <Label>Motorista</Label>
                      <div className="text-lg font-medium">{selectedSolicitation.motorista}</div>
                    </div>
                  </div>
                  
                  {selectedSolicitation.veiculo_modelo && (
                    <div>
                      <Label>Modelo do Veículo</Label>
                      <div className="text-lg font-medium">{selectedSolicitation.veiculo_modelo}</div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Valor Solicitado</Label>
                      <div className="text-lg font-medium">{formatCurrency(selectedSolicitation.valor_solicitado)}</div>
                    </div>
                    <div>
                      <Label>Quilometragem</Label>
                      <div className="text-lg font-medium">{selectedSolicitation.km_veiculo || 'Não informado'}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de Cartão</Label>
                      <div className="text-lg font-medium">{selectedSolicitation.tipo_cartao || 'Padrão'}</div>
                    </div>
                    <div>
                      <Label>Status Atual</Label>
                      <div className="mt-1">{getStatusBadge(selectedSolicitation.status)}</div>
                    </div>
                  </div>
                  
                  {(selectedSolicitation.numero_cartao || selectedSolicitation.cartao_combustivel) && (
                    <div>
                      <Label>Cartão de Combustível Vinculado</Label>
                      <div className="text-lg font-medium font-mono bg-blue-50 p-2 rounded border border-blue-200">
                        <CreditCard className="inline mr-2 h-4 w-4 text-blue-600" />
                        {selectedSolicitation.cartao_combustivel || selectedSolicitation.numero_cartao}
                      </div>
                    </div>
                  )}
                  
                  {/* ID da Rota e Quantidade de Litros */}
                  <div className="grid grid-cols-2 gap-4">
                    {selectedSolicitation.id_rota && (
                      <div>
                        <Label>ID da Rota</Label>
                        <div className="text-lg font-medium bg-blue-50 p-2 rounded border border-blue-200">
                          {selectedSolicitation.id_rota}
                        </div>
                      </div>
                    )}
                    {(selectedSolicitation.litros_solicitados != null && selectedSolicitation.litros_solicitados !== undefined && selectedSolicitation.litros_solicitados > 0) && (
                      <div>
                        <Label>Quantidade de Litros</Label>
                        <div className="text-lg font-medium bg-green-50 p-2 rounded border border-green-200">
                          {selectedSolicitation.litros_solicitados} L
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Tipo de Combustível */}
                  {selectedSolicitation.tipo_combustivel && (
                    <div>
                      <Label>Tipo de Combustível</Label>
                      <div className="text-lg font-medium bg-yellow-50 p-2 rounded border border-yellow-200 capitalize">
                        {selectedSolicitation.tipo_combustivel}
                      </div>
                    </div>
                  )}
                  
                  {/* Seção específica do Line Hall Shopee */}
                  {selectedSolicitation.rota_origem && selectedSolicitation.rota_destino && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <Label className="text-blue-800 font-semibold">Detalhes da Rota (Line Hall)</Label>
                      <div className="mt-2 space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Rota:</span> {selectedSolicitation.rota_origem} → {selectedSolicitation.rota_destino}
                        </div>
                        {selectedSolicitation.km_total && (
                          <div className="text-sm">
                            <span className="font-medium">KM da Rota:</span> {selectedSolicitation.km_total} km
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
                  
                  {/* Detalhes do Cálculo */}
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
    </AppLayout>
  );
};

export default FuelCardRequestsPanel;