import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Calendar, 
  Filter,
  Loader2,
  CheckCircle,
  Wrench,
  Car,
  Truck
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { apiRequest } from '@/lib/queryClient';

interface DashboardData {
  checklistsByPeriod: Array<{ date: string; concluidos: number; pendentes: number }>;
  maintenanceByStatus: Array<{ name: string; value: number; color: string }>;
  vehiclesByStatus: Array<{ name: string; value: number; color: string }>;
  operationsByStatus: Array<{ name: string; value: number; color: string }>;
  summary: {
    totalChecklists: number;
    totalMaintenance: number;
    totalVehicles: number;
    totalOperations: number;
    checklistsConcluidosPercentage: number;
    maintenanceConcluidasPercentage: number;
  };
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899'];

const LineHaulExecutiveDashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [dataInicial, setDataInicial] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [dataFinal, setDataFinal] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    checklistsByPeriod: [],
    maintenanceByStatus: [],
    vehiclesByStatus: [],
    operationsByStatus: [],
    summary: {
      totalChecklists: 0,
      totalMaintenance: 0,
      totalVehicles: 0,
      totalOperations: 0,
      checklistsConcluidosPercentage: 0,
      maintenanceConcluidasPercentage: 0
    }
  });

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('GET', `/api/line-hall/executive-dashboard?dataInicial=${dataInicial}&dataFinal=${dataFinal}`);
      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApplyFilters = () => {
    fetchDashboardData();
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Header do Dashboard Executivo */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Dashboard Executivo
          </h2>
          <p className="text-white/70 text-sm mt-1">
            Análise de desempenho e métricas operacionais
          </p>
        </div>
      </div>

      {/* Filtros por Data */}
      <Card className="bg-white/90 backdrop-blur-sm border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center text-blue-700">
            <Filter className="h-5 w-5 mr-2" />
            Filtros por Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="dataInicial" className="text-sm font-medium text-gray-700">
                Data Inicial
              </Label>
              <Input
                id="dataInicial"
                type="date"
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
                className="mt-1"
                data-testid="input-data-inicial"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="dataFinal" className="text-sm font-medium text-gray-700">
                Data Final
              </Label>
              <Input
                id="dataFinal"
                type="date"
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
                className="mt-1"
                data-testid="input-data-final"
              />
            </div>
            <Button 
              onClick={handleApplyFilters}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
              data-testid="btn-aplicar-filtros"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              Aplicar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Checklists</p>
                <h3 className="text-3xl font-bold mt-1">{dashboardData.summary.totalChecklists}</h3>
                <p className="text-blue-200 text-xs mt-2">
                  {dashboardData.summary.checklistsConcluidosPercentage.toFixed(1)}% concluídos
                </p>
              </div>
              <CheckCircle className="h-12 w-12 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Total Manutenções</p>
                <h3 className="text-3xl font-bold mt-1">{dashboardData.summary.totalMaintenance}</h3>
                <p className="text-orange-200 text-xs mt-2">
                  {dashboardData.summary.maintenanceConcluidasPercentage.toFixed(1)}% concluídas
                </p>
              </div>
              <Wrench className="h-12 w-12 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Veículos na Garagem</p>
                <h3 className="text-3xl font-bold mt-1">{dashboardData.summary.totalVehicles}</h3>
                <p className="text-green-200 text-xs mt-2">
                  Em monitoramento
                </p>
              </div>
              <Car className="h-12 w-12 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Operações</p>
                <h3 className="text-3xl font-bold mt-1">{dashboardData.summary.totalOperations}</h3>
                <p className="text-purple-200 text-xs mt-2">
                  No período selecionado
                </p>
              </div>
              <Truck className="h-12 w-12 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Checklists por Período */}
        <Card className="bg-white/90 backdrop-blur-sm border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center text-blue-700">
              <TrendingUp className="h-5 w-5 mr-2" />
              Checklists por Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.checklistsByPeriod.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData.checklistsByPeriod}>
                  <defs>
                    <linearGradient id="colorConcluidos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPendentes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('pt-BR');
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="concluidos" 
                    name="Concluídos"
                    stroke="#10B981" 
                    fillOpacity={1} 
                    fill="url(#colorConcluidos)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pendentes" 
                    name="Pendentes"
                    stroke="#F59E0B" 
                    fillOpacity={1} 
                    fill="url(#colorPendentes)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>Nenhum dado disponível para o período</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Status das Operações */}
        <Card className="bg-white/90 backdrop-blur-sm border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center text-purple-700">
              <PieChart className="h-5 w-5 mr-2" />
              Status das Operações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.operationsByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={dashboardData.operationsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardData.operationsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <PieChart className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>Nenhuma operação no período</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Manutenções por Status */}
        <Card className="bg-white/90 backdrop-blur-sm border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center text-orange-700">
              <Wrench className="h-5 w-5 mr-2" />
              Manutenções por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.maintenanceByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.maintenanceByStatus} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="value" name="Quantidade" radius={[0, 4, 4, 0]}>
                    {dashboardData.maintenanceByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Wrench className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>Nenhuma manutenção no período</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Veículos por Status */}
        <Card className="bg-white/90 backdrop-blur-sm border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center text-green-700">
              <Car className="h-5 w-5 mr-2" />
              Distribuição de Veículos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.vehiclesByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={dashboardData.vehiclesByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {dashboardData.vehiclesByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Car className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>Nenhum veículo para exibir</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela Resumo */}
      <Card className="bg-white/90 backdrop-blur-sm border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center text-gray-700">
            <BarChart3 className="h-5 w-5 mr-2" />
            Resumo Geral do Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Métrica</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Total</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Concluídos</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Pendentes</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Taxa</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Checklists</span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">
                    <Badge variant="outline" className="bg-blue-50">
                      {dashboardData.summary.totalChecklists}
                    </Badge>
                  </td>
                  <td className="text-center py-3 px-4">
                    <Badge className="bg-green-500">
                      {Math.round(dashboardData.summary.totalChecklists * dashboardData.summary.checklistsConcluidosPercentage / 100)}
                    </Badge>
                  </td>
                  <td className="text-center py-3 px-4">
                    <Badge className="bg-yellow-500">
                      {dashboardData.summary.totalChecklists - Math.round(dashboardData.summary.totalChecklists * dashboardData.summary.checklistsConcluidosPercentage / 100)}
                    </Badge>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="text-green-600 font-semibold">
                      {dashboardData.summary.checklistsConcluidosPercentage.toFixed(1)}%
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-orange-600" />
                      <span className="font-medium">Manutenções</span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">
                    <Badge variant="outline" className="bg-orange-50">
                      {dashboardData.summary.totalMaintenance}
                    </Badge>
                  </td>
                  <td className="text-center py-3 px-4">
                    <Badge className="bg-green-500">
                      {Math.round(dashboardData.summary.totalMaintenance * dashboardData.summary.maintenanceConcluidasPercentage / 100)}
                    </Badge>
                  </td>
                  <td className="text-center py-3 px-4">
                    <Badge className="bg-yellow-500">
                      {dashboardData.summary.totalMaintenance - Math.round(dashboardData.summary.totalMaintenance * dashboardData.summary.maintenanceConcluidasPercentage / 100)}
                    </Badge>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="text-green-600 font-semibold">
                      {dashboardData.summary.maintenanceConcluidasPercentage.toFixed(1)}%
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">Operações</span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">
                    <Badge variant="outline" className="bg-purple-50">
                      {dashboardData.summary.totalOperations}
                    </Badge>
                  </td>
                  <td className="text-center py-3 px-4" colSpan={2}>
                    <span className="text-gray-500 text-sm">Ver gráfico de status</span>
                  </td>
                  <td className="text-center py-3 px-4">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LineHaulExecutiveDashboard;
