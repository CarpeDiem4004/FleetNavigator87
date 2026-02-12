import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { 
  BarChart3, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Building2,
  RefreshCw,
  History,
  TrendingUp,
  Search,
  Calendar,
  Wrench,
  Route,
  Users,
  Activity,
  FileWarning,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Gauge,
  ChevronRight,
  X
} from 'lucide-react';

interface BaseResumo {
  baseId: number;
  baseName: string;
  totalVeiculos: number;
  atualizados: number;
  pendentes: number;
  percentualAtualizado: string;
  statusCount: Record<string, number>;
  inadimplente: boolean;
}

interface TopOsVehicle {
  placa: string;
  modelo: string;
  baseOrigem: string;
  totalOs: number;
  osAtivas: number;
  ultimaOs: string;
}

interface DashboardData {
  dataReferencia: string;
  totais: {
    totalVeiculos: number;
    atualizados: number;
    pendentes: number;
    percentualAtualizado: string;
    totalBases: number;
    basesInadimplentes: number;
    emRota: number;
    emManutencao: number;
    semEquipe: number;
    emprestado: number;
    utilizacaoFrota: string;
    osAbertas: number;
  };
  statusGlobal: Record<string, number>;
  osStats: Record<string, number>;
  topOsVehicles: TopOsVehicle[];
  resumoPorBase: BaseResumo[];
  basesInadimplentes: BaseResumo[];
}

interface HistoryRecord {
  id: number;
  vehicle_plate: string;
  base_name: string;
  status_anterior: string;
  status_novo: string;
  observacao: string;
  updated_by_name: string;
  data_alteracao: string;
}

const STATUS_LABELS: Record<string, string> = {
  em_rota: 'Em Rota',
  sem_equipe: 'Sem Equipe',
  manutencao: 'Manutenção',
  emprestado: 'Emprestado',
  devolvido: 'Devolvido',
  nao_informado: 'Não Informado'
};

const STATUS_COLORS: Record<string, string> = {
  em_rota: 'bg-green-500',
  sem_equipe: 'bg-yellow-500',
  manutencao: 'bg-red-500',
  emprestado: 'bg-blue-500',
  devolvido: 'bg-purple-500',
  nao_informado: 'bg-gray-500'
};

const OS_STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  em_andamento: 'Em Andamento',
  finalizado: 'Finalizado',
  recusado: 'Recusado'
};

interface BaseVehicle {
  id: number;
  plate: string;
  model: string;
  make: string;
  vehicle_type: string;
  daily_status: string | null;
  observacao: string | null;
}

function getTodayBrasil() {
  const now = new Date();
  const br = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  return `${br.getFullYear()}-${String(br.getMonth() + 1).padStart(2, '0')}-${String(br.getDate()).padStart(2, '0')}`;
}

function KpiCard({ icon: Icon, label, value, subtitle, color, bgColor }: {
  icon: any; label: string; value: string | number; subtitle?: string; color: string; bgColor: string;
}) {
  return (
    <Card className={`${bgColor} border-0 shadow-sm hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <div className={`p-2 rounded-lg ${bgColor === 'bg-white' ? 'bg-gray-100' : 'bg-white/50'}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBar({ statusGlobal, total }: { statusGlobal: Record<string, number>; total: number }) {
  if (total === 0) return null;
  const statuses = [
    { key: 'em_rota', color: '#22c55e', label: 'Em Rota' },
    { key: 'sem_equipe', color: '#eab308', label: 'Sem Equipe' },
    { key: 'manutencao', color: '#ef4444', label: 'Manutenção' },
    { key: 'emprestado', color: '#3b82f6', label: 'Emprestado' },
    { key: 'devolvido', color: '#a855f7', label: 'Devolvido' },
  ];
  const informados = Object.values(statusGlobal).reduce((a, b) => a + b, 0);
  const naoInformado = total - informados;

  return (
    <div className="space-y-2">
      <div className="flex h-4 rounded-full overflow-hidden bg-gray-200">
        {statuses.map(s => {
          const count = statusGlobal[s.key] || 0;
          if (count === 0) return null;
          const pct = (count / total) * 100;
          return (
            <div
              key={s.key}
              style={{ width: `${pct}%`, backgroundColor: s.color }}
              title={`${s.label}: ${count} (${pct.toFixed(1)}%)`}
              className="transition-all"
            />
          );
        })}
        {naoInformado > 0 && (
          <div
            style={{ width: `${(naoInformado / total) * 100}%`, backgroundColor: '#9ca3af' }}
            title={`Não Informado: ${naoInformado} (${((naoInformado / total) * 100).toFixed(1)}%)`}
            className="transition-all"
          />
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {statuses.map(s => {
          const count = statusGlobal[s.key] || 0;
          if (count === 0) return null;
          return (
            <div key={s.key} className="flex items-center gap-1.5 text-xs">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-gray-600">{s.label}: <strong>{count}</strong></span>
            </div>
          );
        })}
        {naoInformado > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
            <span className="text-gray-600">Não Informado: <strong>{naoInformado}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FleetStatusDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDate, setSelectedDate] = useState(getTodayBrasil());
  const [selectedBase, setSelectedBase] = useState<BaseResumo | null>(null);
  const { user } = useAuth();
  const userId = user?.id;

  const isToday = selectedDate === getTodayBrasil();

  const { data: dashboardData, isLoading, refetch } = useQuery<{ success: boolean; data: DashboardData }>({
    queryKey: ['/api/fleet-status/public/dashboard', userId, selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/fleet-status/public/dashboard?userId=${userId || ''}&date=${selectedDate}`, {
        credentials: 'include'
      });
      return response.json();
    },
    enabled: !!userId,
    refetchInterval: isToday ? 60000 : false
  });

  const { data: historyData } = useQuery<{ success: boolean; data: HistoryRecord[] }>({
    queryKey: ['/api/fleet-status/history'],
    enabled: activeTab === 'history'
  });

  const { data: baseVehiclesData, isLoading: isLoadingVehicles } = useQuery<{ success: boolean; data: BaseVehicle[] }>({
    queryKey: ['/api/fleet-status/public/base-vehicles', selectedBase?.baseId, selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/fleet-status/public/base-vehicles/${selectedBase!.baseId}?date=${selectedDate}`, {
        credentials: 'include'
      });
      return response.json();
    },
    enabled: !!selectedBase
  });

  const dashboard = dashboardData?.data;
  const history = historyData?.data || [];
  const totais = dashboard?.totais;

  const filteredBases = dashboard?.resumoPorBase.filter(base => 
    base.baseName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const displayDate = new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR');

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gauge className="w-7 h-7 text-blue-600" />
            Dashboard Executivo da Frota
          </h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {displayDate}
            {!isToday && (
              <Badge variant="outline" className="ml-2 text-amber-600 border-amber-300">Histórico</Badge>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={getTodayBrasil()}
            className="w-[160px]"
          />
          {!isToday && (
            <Button onClick={() => setSelectedDate(getTodayBrasil())} variant="outline" size="sm">
              Hoje
            </Button>
          )}
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16">
          <RefreshCw className="w-10 h-10 animate-spin mx-auto text-gray-400" />
          <p className="mt-3 text-gray-500">Carregando dashboard...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards - Row 1 */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <KpiCard icon={Truck} label="Total Frota" value={totais?.totalVeiculos || 0} color="text-blue-700" bgColor="bg-blue-50" />
            <KpiCard icon={Route} label="Em Rota" value={totais?.emRota || 0} subtitle={`${totais?.utilizacaoFrota || 0}% da frota`} color="text-green-700" bgColor="bg-green-50" />
            <KpiCard icon={Users} label="Sem Equipe" value={totais?.semEquipe || 0} color="text-yellow-700" bgColor="bg-yellow-50" />
            <KpiCard icon={Wrench} label="Manutenção" value={totais?.emManutencao || 0} color="text-red-700" bgColor="bg-red-50" />
            <KpiCard icon={FileWarning} label="OS Abertas" value={totais?.osAbertas || 0} color="text-orange-700" bgColor="bg-orange-50" />
            <KpiCard icon={TrendingUp} label="Utilização" value={`${totais?.utilizacaoFrota || 0}%`} color="text-emerald-700" bgColor="bg-emerald-50" />
            <KpiCard icon={Building2} label="Total Bases" value={totais?.totalBases || 0} color="text-slate-700" bgColor="bg-slate-50" />
            <KpiCard icon={AlertTriangle} label="Inadimplentes" value={totais?.basesInadimplentes || 0} color="text-red-700" bgColor="bg-red-50" />
          </div>

          {/* Status Distribution Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Distribuição de Status da Frota
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">{totais?.atualizados || 0} de {totais?.totalVeiculos || 0} veículos informados</span>
                  <Badge variant="outline" className={Number(totais?.percentualAtualizado || 0) >= 80 ? 'text-green-600 border-green-300' : 'text-amber-600 border-amber-300'}>
                    {totais?.percentualAtualizado || 0}%
                  </Badge>
                </div>
              </div>
              <StatusBar statusGlobal={dashboard?.statusGlobal || {}} total={totais?.totalVeiculos || 0} />
            </CardContent>
          </Card>

          {/* Gargalos - Quick Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Veículos Produtivos</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">{totais?.emRota || 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{totais?.utilizacaoFrota || 0}%</p>
                    <p className="text-xs text-gray-500">da frota</p>
                  </div>
                </div>
                <Progress value={Number(totais?.utilizacaoFrota || 0)} className="h-1.5 mt-3" />
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Frota Parada</p>
                    <p className="text-3xl font-bold text-red-600 mt-1">{(totais?.emManutencao || 0) + (totais?.semEquipe || 0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-red-600"><Wrench className="w-3 h-3 inline mr-1" />{totais?.emManutencao || 0} manutenção</p>
                    <p className="text-sm text-yellow-600"><Users className="w-3 h-3 inline mr-1" />{totais?.semEquipe || 0} sem equipe</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">OS de Manutenção</p>
                    <p className="text-3xl font-bold text-orange-600 mt-1">{totais?.osAbertas || 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">ordens ativas</p>
                    <div className="flex flex-wrap gap-1 mt-1 justify-end">
                      {Object.entries(dashboard?.osStats || {}).map(([status, count]) => (
                        !['recusado', 'finalizado'].includes(status) && (count as number) > 0 && (
                          <Badge key={status} variant="outline" className="text-[10px]">
                            {OS_STATUS_LABELS[status] || status}: {count as number}
                          </Badge>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Card>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b px-4 pt-4">
                  <TabsList className="mb-0">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Visão por Base
                    </TabsTrigger>
                    <TabsTrigger value="alerts" className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Pendentes
                      {(dashboard?.basesInadimplentes?.length || 0) > 0 && (
                        <Badge variant="destructive" className="ml-1 text-[10px] px-1.5">
                          {dashboard?.basesInadimplentes?.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="topOs" className="flex items-center gap-2">
                      <Wrench className="w-4 h-4" />
                      Top OS por Veículo
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Histórico
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-4">
                  <TabsContent value="overview" className="mt-0">
                    <div className="mb-4">
                      <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Buscar base..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Base</TableHead>
                            <TableHead className="text-center">Total</TableHead>
                            <TableHead className="text-center">Em Rota</TableHead>
                            <TableHead className="text-center">Manutenção</TableHead>
                            <TableHead className="text-center">Atualizados</TableHead>
                            <TableHead className="text-center">Pendentes</TableHead>
                            <TableHead className="w-[180px]">% Utilização</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredBases.map((base) => {
                            const emRotaBase = base.statusCount?.em_rota || 0;
                            const manutBase = base.statusCount?.manutencao || 0;
                            const utilizBase = base.totalVeiculos > 0 ? ((emRotaBase / base.totalVeiculos) * 100).toFixed(1) : '0.0';
                            return (
                              <TableRow key={base.baseId} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedBase(base)}>
                                <TableCell className="font-medium text-blue-600">{base.baseName}</TableCell>
                                <TableCell className="text-center">{base.totalVeiculos}</TableCell>
                                <TableCell className="text-center">
                                  <span className="text-green-600 font-semibold">{emRotaBase}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                  {manutBase > 0 ? (
                                    <span className="text-red-600 font-semibold">{manutBase}</span>
                                  ) : (
                                    <span className="text-gray-400">0</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center text-green-600">{base.atualizados}</TableCell>
                                <TableCell className="text-center text-yellow-600">{base.pendentes}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Progress value={Number(utilizBase)} className="h-2" />
                                    <span className="text-sm text-gray-500 w-12">{utilizBase}%</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {base.inadimplente ? (
                                    <Badge variant="destructive" className="text-[10px]">
                                      <AlertTriangle className="w-3 h-3 mr-1" />
                                      Pendente
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-green-500 text-[10px]">
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      OK
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="alerts" className="mt-0">
                    {(dashboard?.basesInadimplentes?.length || 0) === 0 ? (
                      <Card className="bg-green-50 border-0">
                        <CardContent className="p-8 text-center">
                          <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
                          <h3 className="text-xl font-bold text-green-700">
                            Todas as bases estão em dia!
                          </h3>
                          <p className="text-green-600 mt-2">
                            Nenhuma base com atualizações pendentes.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
                          <AlertTriangle className="w-5 h-5" />
                          <span className="font-semibold">
                            {dashboard?.basesInadimplentes?.length} bases com atualizações pendentes
                          </span>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {dashboard?.basesInadimplentes?.map((base) => (
                            <Card 
                              key={base.baseId} 
                              className="border-yellow-200 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300"
                              onClick={() => setSelectedBase(base)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-bold text-sm">{base.baseName}</h4>
                                    <p className="text-xs text-gray-500">
                                      {base.pendentes} pendentes de {base.totalVeiculos}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Badge variant="outline" className="text-yellow-600 border-yellow-300 text-xs">
                                      {base.percentualAtualizado}%
                                    </Badge>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  </div>
                                </div>
                                <Progress 
                                  value={Number(base.percentualAtualizado)} 
                                  className="h-1.5 mt-3"
                                />
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {Object.entries(base.statusCount || {}).map(([status, count]) => (
                                    <Badge 
                                      key={status} 
                                      variant="secondary"
                                      className={`${STATUS_COLORS[status] || 'bg-gray-500'} text-white text-[10px]`}
                                    >
                                      {STATUS_LABELS[status] || status}: {count as number}
                                    </Badge>
                                  ))}
                                </div>
                                <p className="text-[10px] text-blue-500 mt-2 flex items-center gap-1">
                                  <Search className="w-3 h-3" /> Clique para ver veículos
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="topOs" className="mt-0">
                    <div className="mb-4">
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2 text-orange-700">
                        <Wrench className="w-5 h-5" />
                        <span className="font-semibold">
                          Veículos com mais Ordens de Serviço (OS) abertas no sistema
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>Placa</TableHead>
                            <TableHead>Modelo</TableHead>
                            <TableHead>Base</TableHead>
                            <TableHead className="text-center">Total OS</TableHead>
                            <TableHead className="text-center">OS Ativas</TableHead>
                            <TableHead>Última OS</TableHead>
                            <TableHead>Criticidade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(dashboard?.topOsVehicles || []).map((vehicle, idx) => (
                            <TableRow key={vehicle.placa}>
                              <TableCell>
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${
                                  idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-orange-500' : idx === 2 ? 'bg-yellow-500' : 'bg-gray-400'
                                }`}>
                                  {idx + 1}
                                </span>
                              </TableCell>
                              <TableCell className="font-mono font-bold">{vehicle.placa}</TableCell>
                              <TableCell className="text-sm text-gray-600">{vehicle.modelo || '-'}</TableCell>
                              <TableCell className="text-sm">{vehicle.baseOrigem || '-'}</TableCell>
                              <TableCell className="text-center">
                                <span className="text-lg font-bold text-gray-800">{vehicle.totalOs}</span>
                              </TableCell>
                              <TableCell className="text-center">
                                {vehicle.osAtivas > 0 ? (
                                  <Badge variant="destructive" className="text-xs">{vehicle.osAtivas} ativa{vehicle.osAtivas > 1 ? 's' : ''}</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs text-green-600 border-green-300">Nenhuma</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {vehicle.ultimaOs ? new Date(vehicle.ultimaOs).toLocaleDateString('pt-BR') : '-'}
                              </TableCell>
                              <TableCell>
                                {vehicle.totalOs >= 5 ? (
                                  <Badge className="bg-red-500 text-white text-[10px]">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Crítico
                                  </Badge>
                                ) : vehicle.totalOs >= 3 ? (
                                  <Badge className="bg-orange-500 text-white text-[10px]">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Atenção
                                  </Badge>
                                ) : (
                                  <Badge className="bg-green-500 text-white text-[10px]">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Normal
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {(!dashboard?.topOsVehicles || dashboard.topOsVehicles.length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                          <Wrench className="w-8 h-8 mx-auto mb-2" />
                          Nenhuma OS registrada
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="mt-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data/Hora</TableHead>
                            <TableHead>Placa</TableHead>
                            <TableHead>Base</TableHead>
                            <TableHead>Status Anterior</TableHead>
                            <TableHead>Novo Status</TableHead>
                            <TableHead>Atualizado Por</TableHead>
                            <TableHead>Observação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {history.slice(0, 50).map((record) => (
                            <TableRow key={record.id}>
                              <TableCell className="text-sm">
                                {new Date(record.data_alteracao).toLocaleString('pt-BR')}
                              </TableCell>
                              <TableCell className="font-mono font-bold">
                                {record.vehicle_plate}
                              </TableCell>
                              <TableCell>{record.base_name}</TableCell>
                              <TableCell>
                                {record.status_anterior ? (
                                  <Badge 
                                    variant="outline"
                                    className={`${STATUS_COLORS[record.status_anterior] || ''} text-white`}
                                  >
                                    {STATUS_LABELS[record.status_anterior] || record.status_anterior}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  className={`${STATUS_COLORS[record.status_novo] || 'bg-gray-500'} text-white`}
                                >
                                  {STATUS_LABELS[record.status_novo] || record.status_novo}
                                </Badge>
                              </TableCell>
                              <TableCell>{record.updated_by_name}</TableCell>
                              <TableCell className="max-w-xs truncate">
                                {record.observacao || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {history.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <History className="w-8 h-8 mx-auto mb-2" />
                          Nenhum histórico encontrado
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialog: Veículos da Base */}
      <Dialog open={!!selectedBase} onOpenChange={(open) => !open && setSelectedBase(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              {selectedBase?.baseName}
            </DialogTitle>
            <p className="text-sm text-gray-500">
              {selectedBase?.totalVeiculos} veículos | {selectedBase?.atualizados} atualizados | {selectedBase?.pendentes} pendentes
            </p>
          </DialogHeader>

          {isLoadingVehicles ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Carregando veículos...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status Hoje</TableHead>
                    <TableHead>Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(baseVehiclesData?.data || []).map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-mono font-bold">{vehicle.plate}</TableCell>
                      <TableCell className="text-sm">{vehicle.model || vehicle.make || '-'}</TableCell>
                      <TableCell className="text-sm text-gray-500">{vehicle.vehicle_type || '-'}</TableCell>
                      <TableCell>
                        {vehicle.daily_status ? (
                          <Badge className={`${STATUS_COLORS[vehicle.daily_status] || 'bg-gray-500'} text-white text-xs`}>
                            {STATUS_LABELS[vehicle.daily_status] || vehicle.daily_status}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-400 border-gray-300 text-xs">
                            Não Informado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">
                        {vehicle.observacao || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {(baseVehiclesData?.data || []).length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <Truck className="w-8 h-8 mx-auto mb-2" />
                  Nenhum veículo encontrado nesta base
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
