import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, Search, Filter, TrendingUp, Users, Car, User,
  Calendar, RefreshCw, CheckCircle, Clock, AlertCircle, 
  BarChart3, PieChart, Eye, FileText, Trash2, Download, ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { PieChart as RechartsChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface Accident {
  id: number;
  operacao: string;
  reportado_por: string;
  base_unidade: string;
  data_ocorrencia: string;
  horario_ocorrencia: string;
  causa_imediata: string;
  descricao_detalhada: string;
  placa_veiculo: string;
  modelo_veiculo: string;
  nome_colaborador: string;
  terceiro_envolvido: boolean;
  dias_afastado: number;
  foi_socorrido: boolean;
  atendimento_medico: boolean;
  status: string;
  created_at: string;
  email_corporativo?: string;
  telefone_whatsapp?: string;
  coordenador_base?: string;
  nome_responsavel_meli?: string;
  milha?: string;
  regional?: string;
  endereco_ocorrencia?: string;
  id_rota?: string;
  transit_time_orh?: string;
  inicio_rota?: string;
  ano_veiculo?: string;
  frota_fixa?: string;
  tipo_frota?: string;
  id_matricula?: string;
  funcao?: string;
  idade?: string;
  contratacao?: string;
  data_admissao?: string;
  data_primeira_habilitacao?: string;
  partes_corpo_atingidas?: string;
  local_atendimento?: string;
  houve_internacao?: string;
  nome_medico_crm?: string;
  cid?: string;
  registro_policial?: string;
  protocolo_bo?: string;
  estado_saude_envolvidos?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  reportado: { label: 'Reportado', color: 'bg-blue-100 text-blue-800', icon: Clock },
  em_analise: { label: 'Em Análise', color: 'bg-yellow-100 text-yellow-800', icon: Eye },
  investigando: { label: 'Investigando', color: 'bg-orange-100 text-orange-800', icon: Search },
  concluido: { label: 'Concluído', color: 'bg-green-100 text-green-800', icon: CheckCircle }
};

const TIPO_OCORRENCIA: Record<string, string> = {
  colisao: 'Colisão',
  atropelamento: 'Atropelamento',
  capotamento: 'Capotamento',
  tombamento: 'Tombamento',
  quase_acidente: 'Quase Acidente',
  dano_material: 'Dano Material',
  dano_ambiental: 'Dano Ambiental',
  incendio: 'Incêndio',
  outro: 'Outro'
};

const CHART_COLORS = ['#DC2626', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'];

export default function WorkSafetyAccidentsPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [filterBase, setFilterBase] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedAccident, setSelectedAccident] = useState<Accident | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: accidentsResponse, isLoading, refetch } = useQuery({
    queryKey: ['/api/work-safety/accidents', filterBase, filterStatus, filterTipo, dateFrom, dateTo, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterBase) params.append('base', filterBase);
      if (filterTipo) params.append('tipo', filterTipo);
      
      const response = await fetch(`/api/work-safety/accidents?${params.toString()}`, {
        credentials: 'include'
      });
      return response.json();
    }
  });

  const { data: statsResponse } = useQuery({
    queryKey: ['/api/work-safety/accidents/stats'],
    queryFn: async () => {
      const response = await fetch('/api/work-safety/accidents/stats', {
        credentials: 'include'
      });
      return response.json();
    }
  });

  const cleanupTestDataMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/work-safety/accidents/cleanup-test-data', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao limpar dados de teste');
      }
      return response.json();
    },
    onSuccess: (response: any) => {
      toast({ 
        title: 'Dados de teste removidos com sucesso!',
        description: `${response.deletedCount} registros foram removidos.`
      });
      setCleanupDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/work-safety/accidents'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['/api/work-safety/accidents/stats'], exact: false });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao limpar dados', description: error.message, variant: 'destructive' });
    }
  });

  const allAccidents: Accident[] = accidentsResponse?.data || [];
  const stats = statsResponse?.data || { total: 0, acidentes: 0, quase_acidentes: 0, danos_materiais: 0, danos_ambientais: 0, com_vitima: 0, dias_sem_acidente: 0 };
  
  const filteredAccidents = useMemo(() => {
    let result = allAccidents;
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(a => 
        a.reportado_por?.toLowerCase().includes(search) ||
        a.nome_colaborador?.toLowerCase().includes(search) ||
        a.placa_veiculo?.toLowerCase().includes(search) ||
        a.base_unidade?.toLowerCase().includes(search)
      );
    }
    
    if (dateFrom) {
      result = result.filter(a => {
        const date = a.data_ocorrencia || a.created_at;
        return date >= dateFrom;
      });
    }
    
    if (dateTo) {
      result = result.filter(a => {
        const date = a.data_ocorrencia || a.created_at;
        return date <= dateTo;
      });
    }
    
    if (filterStatus) {
      result = result.filter(a => a.status === filterStatus);
    }
    
    return result;
  }, [allAccidents, searchTerm, dateFrom, dateTo, filterStatus]);

  const uniqueBases = useMemo(() => {
    const bases = new Set(allAccidents.map(a => a.base_unidade).filter(Boolean));
    return Array.from(bases).sort();
  }, [allAccidents]);

  const chartDataByBase = useMemo(() => {
    const byBase: Record<string, number> = {};
    filteredAccidents.forEach(a => {
      const base = a.base_unidade || 'Não informado';
      byBase[base] = (byBase[base] || 0) + 1;
    });
    return Object.entries(byBase).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [filteredAccidents]);

  const chartDataByType = useMemo(() => {
    const byType: Record<string, number> = {};
    filteredAccidents.forEach(a => {
      let tipo = 'Outro';
      const causa = a.causa_imediata?.toLowerCase() || '';
      if (causa.includes('colisão') || causa.includes('colisao')) tipo = 'Colisão';
      else if (causa.includes('atropelamento')) tipo = 'Atropelamento';
      else if (causa.includes('capotamento')) tipo = 'Capotamento';
      else if (causa.includes('tombamento')) tipo = 'Tombamento';
      else if (causa.includes('quase')) tipo = 'Quase Acidente';
      else if (causa.includes('dano') || causa.includes('avaria')) tipo = 'Dano Material';
      else if (causa.includes('ambiental') || causa.includes('incêndio')) tipo = 'Dano Ambiental';
      byType[tipo] = (byType[tipo] || 0) + 1;
    });
    return Object.entries(byType).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredAccidents]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterBase('');
    setFilterStatus('');
    setFilterTipo('');
    setDateFrom('');
    setDateTo('');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const exportToExcel = () => {
    if (filteredAccidents.length === 0) {
      toast({ title: 'Sem dados para exportar', variant: 'destructive' });
      return;
    }

    const exportData = filteredAccidents.map(acc => ({
      'Data Ocorrência': formatDate(acc.data_ocorrencia),
      'Horário': acc.horario_ocorrencia || 'N/A',
      'Tipo': acc.causa_imediata || 'N/A',
      'Base/Unidade': acc.base_unidade || 'N/A',
      'Operação': acc.operacao || 'N/A',
      'Colaborador': acc.nome_colaborador || 'N/A',
      'Placa': acc.placa_veiculo || 'N/A',
      'Modelo': acc.modelo_veiculo || 'N/A',
      'Descrição': acc.descricao_detalhada || 'N/A',
      'Terceiro Envolvido': acc.terceiro_envolvido ? 'Sim' : 'Não',
      'Dias Afastado': acc.dias_afastado || 0,
      'Foi Socorrido': acc.foi_socorrido ? 'Sim' : 'Não',
      'Atendimento Médico': acc.atendimento_medico ? 'Sim' : 'Não',
      'Status': STATUS_CONFIG[acc.status]?.label || acc.status || 'Reportado',
      'Reportado Por': acc.reportado_por || 'N/A',
      'Data Registro': acc.created_at ? format(new Date(acc.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Acidentes');
    
    const colWidths = [
      { wch: 15 }, { wch: 10 }, { wch: 25 }, { wch: 20 }, { wch: 15 },
      { wch: 25 }, { wch: 12 }, { wch: 20 }, { wch: 40 }, { wch: 15 },
      { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 18 }
    ];
    worksheet['!cols'] = colWidths;
    
    const fileName = `acidentes_incidentes_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast({ title: 'Excel exportado com sucesso!', description: `Arquivo ${fileName} baixado.` });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/work-safety">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-7 w-7 text-red-600" />
                Painel de Acidentes e Incidentes
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie e acompanhe ocorrências de segurança
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => refetch()} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button onClick={exportToExcel} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Excel
            </Button>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Lista de Ocorrências
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Ocorrências</p>
                      <p className="text-3xl font-bold text-red-600">{filteredAccidents.length}</p>
                    </div>
                    <AlertTriangle className="h-10 w-10 text-red-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Acidentes</p>
                      <p className="text-3xl font-bold text-orange-600">{stats.acidentes || 0}</p>
                    </div>
                    <Car className="h-10 w-10 text-orange-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Quase Acidentes</p>
                      <p className="text-3xl font-bold text-yellow-600">{stats.quase_acidentes || 0}</p>
                    </div>
                    <AlertCircle className="h-10 w-10 text-yellow-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Com Terceiro</p>
                      <p className="text-3xl font-bold text-purple-600">{stats.com_vitima || 0}</p>
                    </div>
                    <Users className="h-10 w-10 text-purple-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Dias Sem Acidente</p>
                      <p className="text-3xl font-bold text-green-600">{stats.dias_sem_acidente || '—'}</p>
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
                    <PieChart className="h-5 w-5 text-red-600" />
                    Ocorrências por Tipo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {chartDataByType.length > 0 ? (
                    <div style={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsChart>
                          <Pie
                            data={chartDataByType}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            innerRadius={40}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {chartDataByType.map((_, index) => (
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
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Ocorrências por Base
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {chartDataByBase.length > 0 ? (
                    <div style={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartDataByBase} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#DC2626" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">Sem dados disponíveis</p>
                  )}
                </CardContent>
              </Card>
            </div>
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
                        placeholder="Colaborador, placa, base..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Base</Label>
                    <Select value={filterBase || "_all"} onValueChange={(v) => setFilterBase(v === "_all" ? "" : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">Todas</SelectItem>
                        {uniqueBases.map(base => (
                          <SelectItem key={base} value={base}>{base}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select value={filterStatus || "_all"} onValueChange={(v) => setFilterStatus(v === "_all" ? "" : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">Todos</SelectItem>
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>{config.label}</SelectItem>
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
                  <CardTitle>Lista de Ocorrências ({filteredAccidents.length})</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                    <p className="text-gray-500 mt-2">Carregando...</p>
                  </div>
                ) : filteredAccidents.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-600">Nenhuma ocorrência encontrada.</p>
                    <p className="text-sm text-gray-500">Ajuste os filtros ou aguarde novos registros.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAccidents.map((accident) => {
                      const isColisao = accident.causa_imediata?.toLowerCase().includes('colisão') || accident.causa_imediata?.toLowerCase().includes('colisao');
                      const isTombamento = accident.causa_imediata?.toLowerCase().includes('tombamento');
                      const isAtropelamento = accident.causa_imediata?.toLowerCase().includes('atropelamento');
                      const statusConfig = STATUS_CONFIG[accident.status] || STATUS_CONFIG.reportado;
                      const StatusIcon = statusConfig.icon;

                      return (
                        <div 
                          key={accident.id} 
                          className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedAccident(accident);
                            setDetailsOpen(true);
                          }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full flex-shrink-0 ${
                                isColisao ? 'bg-red-100' :
                                isTombamento ? 'bg-orange-100' :
                                isAtropelamento ? 'bg-yellow-100' :
                                'bg-blue-100'
                              }`}>
                                {isColisao ? <Car className="h-5 w-5 text-red-600" /> :
                                 isTombamento ? <AlertTriangle className="h-5 w-5 text-orange-600" /> :
                                 isAtropelamento ? <AlertCircle className="h-5 w-5 text-yellow-600" /> :
                                 <AlertTriangle className="h-5 w-5 text-blue-600" />}
                              </div>
                              <div>
                                <p className="font-semibold">{accident.causa_imediata || accident.operacao || 'Ocorrência'}</p>
                                <p className="text-sm text-gray-500">
                                  {formatDate(accident.data_ocorrencia)}
                                  {accident.horario_ocorrencia && ` às ${accident.horario_ocorrencia}`}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {accident.base_unidade && (
                                    <Badge variant="outline" className="text-xs">{accident.base_unidade}</Badge>
                                  )}
                                  {accident.placa_veiculo && (
                                    <Badge variant="secondary" className="text-xs">{accident.placa_veiculo}</Badge>
                                  )}
                                  {accident.terceiro_envolvido && (
                                    <Badge variant="destructive" className="text-xs">Terceiro Envolvido</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                  Reportado por: {accident.reportado_por || 'Não informado'}
                                </p>
                              </div>
                            </div>
                            <Badge className={statusConfig.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Detalhes Completos da Ocorrência
              </DialogTitle>
            </DialogHeader>
            {selectedAccident && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <Badge className={STATUS_CONFIG[selectedAccident.status]?.color || 'bg-gray-100'}>
                    {STATUS_CONFIG[selectedAccident.status]?.label || 'Reportado'}
                  </Badge>
                  <span className="text-xs text-gray-500">ID: #{selectedAccident.id}</span>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Informações do Responsável
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Reportado por</Label>
                      <p className="font-medium">{selectedAccident.reportado_por || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">E-mail Corporativo</Label>
                      <p className="font-medium text-sm">{selectedAccident.email_corporativo || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Telefone/WhatsApp</Label>
                      <p className="font-medium">{selectedAccident.telefone_whatsapp || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Coordenador da Base</Label>
                      <p className="font-medium">{selectedAccident.coordenador_base || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Responsável MELI</Label>
                      <p className="font-medium">{selectedAccident.nome_responsavel_meli || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Dados da Ocorrência
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Data</Label>
                      <p className="font-medium">{formatDate(selectedAccident.data_ocorrencia)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Horário</Label>
                      <p className="font-medium">{selectedAccident.horario_ocorrencia || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Tipo/Causa</Label>
                      <p className="font-medium text-sm">{selectedAccident.causa_imediata || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Base/Unidade</Label>
                      <p className="font-medium">{selectedAccident.base_unidade || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Operação</Label>
                      <p className="font-medium">{selectedAccident.operacao || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Milha</Label>
                      <p className="font-medium">{selectedAccident.milha || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Regional</Label>
                      <p className="font-medium">{selectedAccident.regional || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">ID da Rota</Label>
                      <p className="font-medium">{selectedAccident.id_rota || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-gray-500">Endereço da Ocorrência</Label>
                      <p className="font-medium text-sm">{selectedAccident.endereco_ocorrencia || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Transit Time/ORH</Label>
                      <p className="font-medium">{selectedAccident.transit_time_orh || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Início da Rota</Label>
                      <p className="font-medium">{selectedAccident.inicio_rota || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-500">Descrição Detalhada</Label>
                  <p className="font-medium text-sm bg-gray-50 p-3 rounded-lg mt-1">
                    {selectedAccident.descricao_detalhada || 'Sem descrição detalhada.'}
                  </p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Dados do Veículo
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Placa</Label>
                      <p className="font-medium">{selectedAccident.placa_veiculo || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Modelo</Label>
                      <p className="font-medium">{selectedAccident.modelo_veiculo || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Ano</Label>
                      <p className="font-medium">{selectedAccident.ano_veiculo || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Frota Fixa</Label>
                      <p className="font-medium">{selectedAccident.frota_fixa || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Tipo de Frota</Label>
                      <p className="font-medium">{selectedAccident.tipo_frota || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Dados do Colaborador Envolvido
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Nome</Label>
                      <p className="font-medium">{selectedAccident.nome_colaborador || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">ID/Matrícula</Label>
                      <p className="font-medium">{selectedAccident.id_matricula || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Função</Label>
                      <p className="font-medium">{selectedAccident.funcao || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Idade</Label>
                      <p className="font-medium">{selectedAccident.idade || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Tipo de Contratação</Label>
                      <p className="font-medium">{selectedAccident.contratacao || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Data de Admissão</Label>
                      <p className="font-medium">{selectedAccident.data_admissao ? formatDate(selectedAccident.data_admissao) : 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Data 1ª Habilitação</Label>
                      <p className="font-medium">{selectedAccident.data_primeira_habilitacao ? formatDate(selectedAccident.data_primeira_habilitacao) : 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Terceiro Envolvido</Label>
                      <p className="font-medium">{selectedAccident.terceiro_envolvido ? 'Sim' : 'Não'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Consequências e Atendimento Médico
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Partes do Corpo Atingidas</Label>
                      <p className="font-medium text-sm">{selectedAccident.partes_corpo_atingidas || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Dias Afastado</Label>
                      <p className="font-medium">{selectedAccident.dias_afastado || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Foi Socorrido</Label>
                      <p className="font-medium">{selectedAccident.foi_socorrido ? 'Sim' : 'Não'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Atendimento Médico</Label>
                      <p className="font-medium">{selectedAccident.atendimento_medico ? 'Sim' : 'Não'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Local de Atendimento</Label>
                      <p className="font-medium">{selectedAccident.local_atendimento || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Houve Internação</Label>
                      <p className="font-medium">{selectedAccident.houve_internacao || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Médico/CRM</Label>
                      <p className="font-medium">{selectedAccident.nome_medico_crm || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">CID</Label>
                      <p className="font-medium">{selectedAccident.cid || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-gray-500">Estado de Saúde dos Envolvidos</Label>
                      <p className="font-medium text-sm">{selectedAccident.estado_saude_envolvidos || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Registro Policial
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Registro Policial</Label>
                      <p className="font-medium">{selectedAccident.registro_policial || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Protocolo B.O.</Label>
                      <p className="font-medium">{selectedAccident.protocolo_bo || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 text-xs text-gray-500">
                  Registrado em: {selectedAccident.created_at ? format(new Date(selectedAccident.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
