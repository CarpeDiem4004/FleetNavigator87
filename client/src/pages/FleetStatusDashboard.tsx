import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
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
  Calendar
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

interface DashboardData {
  dataReferencia: string;
  totais: {
    totalVeiculos: number;
    atualizados: number;
    pendentes: number;
    percentualAtualizado: string;
    totalBases: number;
    basesInadimplentes: number;
  };
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

export default function FleetStatusDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();
  const userId = user?.id;

  const { data: dashboardData, isLoading, refetch } = useQuery<{ success: boolean; data: DashboardData }>({
    queryKey: ['/api/fleet-status/public/dashboard', userId],
    queryFn: async () => {
      const response = await fetch(`/api/fleet-status/public/dashboard?userId=${userId || ''}`, {
        credentials: 'include'
      });
      return response.json();
    },
    enabled: !!userId,
    refetchInterval: 60000
  });

  const { data: historyData } = useQuery<{ success: boolean; data: HistoryRecord[] }>({
    queryKey: ['/api/fleet-status/history'],
    enabled: activeTab === 'history'
  });

  const dashboard = dashboardData?.data;
  const history = historyData?.data || [];

  const filteredBases = dashboard?.resumoPorBase.filter(base => 
    base.baseName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const today = new Date().toLocaleDateString('pt-BR');

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Dashboard de Status da Frota
              </CardTitle>
              <CardDescription className="mt-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Monitoramento centralizado - {today}
              </CardDescription>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">Carregando dashboard...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                <Card className="bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <Truck className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                    <div className="text-2xl font-bold text-blue-600">
                      {dashboard?.totais.totalVeiculos || 0}
                    </div>
                    <div className="text-xs text-gray-600">Total Veículos</div>
                  </CardContent>
                </Card>
                <Card className="bg-green-50">
                  <CardContent className="p-4 text-center">
                    <CheckCircle2 className="w-6 h-6 mx-auto text-green-600 mb-2" />
                    <div className="text-2xl font-bold text-green-600">
                      {dashboard?.totais.atualizados || 0}
                    </div>
                    <div className="text-xs text-gray-600">Atualizados</div>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-50">
                  <CardContent className="p-4 text-center">
                    <Clock className="w-6 h-6 mx-auto text-yellow-600 mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">
                      {dashboard?.totais.pendentes || 0}
                    </div>
                    <div className="text-xs text-gray-600">Pendentes</div>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="w-6 h-6 mx-auto text-purple-600 mb-2" />
                    <div className="text-2xl font-bold text-purple-600">
                      {dashboard?.totais.percentualAtualizado || 0}%
                    </div>
                    <div className="text-xs text-gray-600">Progresso</div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50">
                  <CardContent className="p-4 text-center">
                    <Building2 className="w-6 h-6 mx-auto text-slate-600 mb-2" />
                    <div className="text-2xl font-bold text-slate-600">
                      {dashboard?.totais.totalBases || 0}
                    </div>
                    <div className="text-xs text-gray-600">Total Bases</div>
                  </CardContent>
                </Card>
                <Card className="bg-red-50">
                  <CardContent className="p-4 text-center">
                    <AlertTriangle className="w-6 h-6 mx-auto text-red-600 mb-2" />
                    <div className="text-2xl font-bold text-red-600">
                      {dashboard?.totais.basesInadimplentes || 0}
                    </div>
                    <div className="text-xs text-gray-600">Inadimplentes</div>
                  </CardContent>
                </Card>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Visão por Base
                  </TabsTrigger>
                  <TabsTrigger value="alerts" className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Bases Pendentes
                    {(dashboard?.basesInadimplentes?.length || 0) > 0 && (
                      <Badge variant="destructive" className="ml-1">
                        {dashboard?.basesInadimplentes?.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Histórico
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
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
                          <TableHead className="text-center">Atualizados</TableHead>
                          <TableHead className="text-center">Pendentes</TableHead>
                          <TableHead className="w-[200px]">Progresso</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBases.map((base) => (
                          <TableRow key={base.baseId}>
                            <TableCell className="font-medium">{base.baseName}</TableCell>
                            <TableCell className="text-center">{base.totalVeiculos}</TableCell>
                            <TableCell className="text-center text-green-600">{base.atualizados}</TableCell>
                            <TableCell className="text-center text-yellow-600">{base.pendentes}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={Number(base.percentualAtualizado)} 
                                  className="h-2"
                                />
                                <span className="text-sm text-gray-500 w-12">
                                  {base.percentualAtualizado}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {base.inadimplente ? (
                                <Badge variant="destructive">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Pendente
                                </Badge>
                              ) : (
                                <Badge className="bg-green-500">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Completo
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="alerts">
                  {(dashboard?.basesInadimplentes?.length || 0) === 0 ? (
                    <Card className="bg-green-50">
                      <CardContent className="p-8 text-center">
                        <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
                        <h3 className="text-xl font-bold text-green-700">
                          Todas as bases estão em dia!
                        </h3>
                        <p className="text-green-600 mt-2">
                          Nenhuma base com atualizações pendentes para hoje.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      <Card className="bg-red-50 border-red-200">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 text-red-700">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="font-semibold">
                              {dashboard?.basesInadimplentes?.length} bases com atualizações pendentes
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {dashboard?.basesInadimplentes?.map((base) => (
                          <Card key={base.baseId} className="border-yellow-200">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-bold">{base.baseName}</h4>
                                  <p className="text-sm text-gray-500">
                                    {base.pendentes} veículos pendentes de {base.totalVeiculos}
                                  </p>
                                </div>
                                <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                                  {base.percentualAtualizado}%
                                </Badge>
                              </div>
                              <Progress 
                                value={Number(base.percentualAtualizado)} 
                                className="h-2 mt-3"
                              />
                              <div className="mt-3 flex flex-wrap gap-1">
                                {Object.entries(base.statusCount || {}).map(([status, count]) => (
                                  <Badge 
                                    key={status} 
                                    variant="secondary"
                                    className={`${STATUS_COLORS[status] || 'bg-gray-500'} text-white text-xs`}
                                  >
                                    {STATUS_LABELS[status] || status}: {count as number}
                                  </Badge>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history">
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
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
