import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, Search, Filter, TrendingUp, Users, Truck, 
  Calendar, RefreshCw, ChevronDown, AlertOctagon, CheckCircle,
  Clock, AlertCircle, BarChart3, PieChart, Eye, Edit
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { PieChart as RechartsChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Deviation {
  id: number;
  placa: string;
  motorista_nome: string;
  data_desvio: string;
  tipo_desvio: string;
  observacoes: string | null;
  responsavel_registro: string;
  base_operacao: string;
  status: string;
  reincidente: boolean;
  quantidade_desvios: number;
  created_at: string;
}

interface DeviationStats {
  total: number;
  recurrentDrivers: number;
  byStatus: { status: string; label: string; count: number }[];
  byType: { type: string; label: string; count: number }[];
  topDrivers: { name: string; count: number; isRecurrent: boolean }[];
  byBase: { base: string; count: number }[];
}

const DEVIATION_TYPES: Record<string, string> = {
  excesso_velocidade: 'Excesso de velocidade',
  jornada_acima_permitido: 'Jornada acima do permitido',
  falha_checklist: 'Falha no checklist',
  nao_uso_epi: 'Não uso de EPI',
  uso_indevido_veiculo: 'Uso indevido do veículo',
  avaria_conducao_inadequada: 'Avaria por condução inadequada',
  descumprimento_procedimento: 'Descumprimento de procedimento',
  outro: 'Outro'
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  registrado: { label: 'Registrado', color: 'bg-blue-100 text-blue-800', icon: Clock },
  em_acompanhamento: { label: 'Em Acompanhamento', color: 'bg-yellow-100 text-yellow-800', icon: Eye },
  tratado: { label: 'Tratado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  recorrente: { label: 'Recorrente', color: 'bg-red-100 text-red-800', icon: AlertCircle }
};

const CHART_COLORS = ['#DB0145', '#F39C12', '#3498db', '#2ecc71', '#9b59b6', '#e74c3c', '#1abc9c', '#34495e'];

export default function WorkSafetyDeviationsPanel() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBase, setFilterBase] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedDeviation, setSelectedDeviation] = useState<Deviation | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: deviationsResponse, isLoading, refetch } = useQuery({
    queryKey: ['/api/work-safety/deviations', filterBase, filterStatus, filterType, dateFrom, dateTo, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterBase) params.append('base', filterBase);
      if (filterStatus) params.append('status', filterStatus);
      if (filterType) params.append('tipoDesvio', filterType);
      if (dateFrom) params.append('dataInicio', dateFrom);
      if (dateTo) params.append('dataFim', dateTo);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/work-safety/deviations?${params.toString()}`, {
        credentials: 'include'
      });
      return response.json();
    }
  });

  const { data: statsResponse } = useQuery({
    queryKey: ['/api/work-safety/deviations/stats', filterBase, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterBase) params.append('base', filterBase);
      if (dateFrom) params.append('dataInicio', dateFrom);
      if (dateTo) params.append('dataFim', dateTo);
      
      const response = await fetch(`/api/work-safety/deviations/stats?${params.toString()}`, {
        credentials: 'include'
      });
      return response.json();
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, observacoes }: { id: number; status: string; observacoes?: string }) => {
      return await apiRequest('PUT', `/api/work-safety/deviations/${id}/status`, { status, observacoes });
    },
    onSuccess: () => {
      toast({ title: 'Status atualizado com sucesso!' });
      setDialogOpen(false);
      setSelectedDeviation(null);
      queryClient.invalidateQueries({ queryKey: ['/api/work-safety/deviations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/work-safety/deviations/stats'] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar status', description: error.message, variant: 'destructive' });
    }
  });

  const deviations: Deviation[] = deviationsResponse?.data || [];
  const stats: DeviationStats | null = statsResponse?.data || null;

  const uniqueBases = useMemo(() => {
    const bases = new Set(deviations.map(d => d.base_operacao));
    return Array.from(bases).sort();
  }, [deviations]);

  const handleUpdateStatus = () => {
    if (!selectedDeviation || !newStatus) return;
    updateStatusMutation.mutate({
      id: selectedDeviation.id,
      status: newStatus,
      observacoes: statusNotes || undefined
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterBase('');
    setFilterStatus('');
    setFilterType('');
    setDateFrom('');
    setDateTo('');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertOctagon className="h-7 w-7 text-[#DB0145]" />
              Painel de Desvios de Motoristas
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie e acompanhe desvios operacionais e comportamentais
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Lista de Desvios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {stats && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-l-4 border-l-[#DB0145]">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Total de Desvios</p>
                          <p className="text-3xl font-bold text-[#DB0145]">{stats.total}</p>
                        </div>
                        <AlertTriangle className="h-10 w-10 text-[#DB0145] opacity-50" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-red-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Motoristas Reincidentes</p>
                          <p className="text-3xl font-bold text-red-600">{stats.recurrentDrivers}</p>
                        </div>
                        <Users className="h-10 w-10 text-red-500 opacity-50" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Em Acompanhamento</p>
                          <p className="text-3xl font-bold text-yellow-600">
                            {stats.byStatus.find(s => s.status === 'em_acompanhamento')?.count || 0}
                          </p>
                        </div>
                        <Eye className="h-10 w-10 text-yellow-500 opacity-50" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Tratados</p>
                          <p className="text-3xl font-bold text-green-600">
                            {stats.byStatus.find(s => s.status === 'tratado')?.count || 0}
                          </p>
                        </div>
                        <CheckCircle className="h-10 w-10 text-green-500 opacity-50" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-[#DB0145]" />
                        Desvios por Tipo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stats.byType.length > 0 ? (
                        <div style={{ height: 300 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsChart>
                              <Pie
                                data={stats.byType}
                                dataKey="count"
                                nameKey="label"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                innerRadius={40}
                                label={({ label, percent }) => `${label.substring(0, 12)}... (${(percent * 100).toFixed(0)}%)`}
                              >
                                {stats.byType.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </RechartsChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-8">Sem dados disponíveis</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-red-600" />
                        Top 10 Motoristas com Desvios
                      </CardTitle>
                      <CardDescription>
                        Motoristas com mais ocorrências registradas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-72 overflow-y-auto">
                        {stats.topDrivers.map((driver, idx) => (
                          <div 
                            key={driver.name} 
                            className={`flex items-center justify-between p-3 rounded-lg ${
                              driver.isRecurrent ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span 
                                className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center"
                                style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                              >
                                {idx + 1}
                              </span>
                              <div>
                                <span className="font-medium text-sm">{driver.name}</span>
                                {driver.isRecurrent && (
                                  <Badge variant="destructive" className="ml-2 text-xs">
                                    Reincidente
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline" className="font-bold">
                              {driver.count} desvio{driver.count !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        ))}
                        {stats.topDrivers.length === 0 && (
                          <p className="text-center text-gray-500 py-4">Nenhum motorista encontrado</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div className="lg:col-span-2">
                    <Label className="text-xs">Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Motorista, placa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Base</Label>
                    <Select value={filterBase} onValueChange={setFilterBase}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas</SelectItem>
                        {uniqueBases.map(base => (
                          <SelectItem key={base} value={base}>{base}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Tipo</Label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        {Object.entries(DEVIATION_TYPES).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button variant="outline" onClick={clearFilters} className="w-full">
                      Limpar
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  <div>
                    <Label className="text-xs">Data Inicial</Label>
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Data Final</Label>
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Lista de Desvios ({deviations.length})</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
                    <p className="text-gray-500 mt-2">Carregando...</p>
                  </div>
                ) : deviations.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto" />
                    <p className="text-gray-500 mt-2">Nenhum desvio encontrado</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-3 font-medium">Data</th>
                          <th className="text-left p-3 font-medium">Motorista</th>
                          <th className="text-left p-3 font-medium">Placa</th>
                          <th className="text-left p-3 font-medium">Tipo</th>
                          <th className="text-left p-3 font-medium">Base</th>
                          <th className="text-left p-3 font-medium">Status</th>
                          <th className="text-left p-3 font-medium">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deviations.map((deviation) => {
                          const statusConfig = STATUS_CONFIG[deviation.status] || STATUS_CONFIG.registrado;
                          const StatusIcon = statusConfig.icon;
                          
                          return (
                            <tr 
                              key={deviation.id} 
                              className={`border-b hover:bg-gray-50 ${
                                deviation.reincidente ? 'bg-red-50' : ''
                              }`}
                            >
                              <td className="p-3">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-gray-400" />
                                  {formatDate(deviation.data_desvio)}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{deviation.motorista_nome}</span>
                                  {deviation.reincidente && (
                                    <Badge variant="destructive" className="text-xs">
                                      Reincidente
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-1">
                                  <Truck className="h-3 w-3 text-gray-400" />
                                  {deviation.placa}
                                </div>
                              </td>
                              <td className="p-3 max-w-[150px] truncate" title={DEVIATION_TYPES[deviation.tipo_desvio]}>
                                {DEVIATION_TYPES[deviation.tipo_desvio] || deviation.tipo_desvio}
                              </td>
                              <td className="p-3">{deviation.base_operacao}</td>
                              <td className="p-3">
                                <Badge className={`${statusConfig.color} gap-1`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {statusConfig.label}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <Dialog open={dialogOpen && selectedDeviation?.id === deviation.id} onOpenChange={(open) => {
                                  setDialogOpen(open);
                                  if (!open) {
                                    setSelectedDeviation(null);
                                    setNewStatus('');
                                    setStatusNotes('');
                                  }
                                }}>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => {
                                        setSelectedDeviation(deviation);
                                        setNewStatus(deviation.status);
                                        setStatusNotes('');
                                        setDialogOpen(true);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Atualizar Status do Desvio</DialogTitle>
                                      <DialogDescription>
                                        Motorista: {deviation.motorista_nome} | Placa: {deviation.placa}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                      <div>
                                        <Label>Tipo de Desvio</Label>
                                        <p className="text-sm text-gray-600 mt-1">
                                          {DEVIATION_TYPES[deviation.tipo_desvio] || deviation.tipo_desvio}
                                        </p>
                                      </div>
                                      <div>
                                        <Label>Novo Status</Label>
                                        <Select value={newStatus} onValueChange={setNewStatus}>
                                          <SelectTrigger className="mt-1">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                              <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label>Observações</Label>
                                        <Textarea
                                          placeholder="Adicione observações sobre a atualização..."
                                          value={statusNotes}
                                          onChange={(e) => setStatusNotes(e.target.value)}
                                          className="mt-1"
                                        />
                                      </div>
                                      <Button 
                                        onClick={handleUpdateStatus}
                                        className="w-full bg-[#DB0145] hover:bg-[#B50139]"
                                        disabled={updateStatusMutation.isPending}
                                      >
                                        {updateStatusMutation.isPending ? 'Atualizando...' : 'Atualizar Status'}
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
