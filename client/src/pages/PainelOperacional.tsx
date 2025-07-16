import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Car, 
  Wrench, 
  Fuel, 
  Calendar as CalendarIcon,
  BarChart3,
  PieChart,
  TrendingUp,
  Clock,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import { formatCurrency } from '@/lib/currency';

interface MaintenanceData {
  vehiclesInMaintenance: number;
  averageMaintenanceDays: number;
  vehiclesOver5Days: Array<{
    id: number;
    plate: string;
    daysInMaintenance: number;
    workshop: string;
    entryDate: string;
  }>;
  totalMaintenanceCost: number;
  averageCostPerVehicle: number;
}

interface FuelData {
  totalRefuels: number;
  totalLiters: {
    diesel: number;
    gasoline: number;
    alcohol: number;
  };
  averageConsumption: number;
  monthlyData: Array<{
    month: string;
    refuels: number;
    liters: number;
    cost: number;
  }>;
}

interface FilterState {
  baseId: string;
  projectId: string;
  startDate: Date | null;
  endDate: Date | null;
  period: 'week' | 'month';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function PainelOperacional() {
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceData | null>(null);
  const [fuelData, setFuelData] = useState<FuelData | null>(null);
  const [bases, setBases] = useState<Array<{ id: string; name: string }>>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [filters, setFilters] = useState<FilterState>({
    baseId: '',
    projectId: '',
    startDate: null,
    endDate: null,
    period: 'month'
  });
  const [isLoading, setIsLoading] = useState(false);

  // Carregar bases e projetos
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [basesResponse, projectsResponse] = await Promise.all([
          fetch('/api/bases'),
          fetch('/api/projects')
        ]);
        
        if (basesResponse.ok) {
          const basesData = await basesResponse.json();
          setBases(Array.isArray(basesData) ? basesData : []);
        }
        
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(Array.isArray(projectsData) ? projectsData : []);
        }
      } catch (error) {
        console.error('Erro ao carregar filtros:', error);
        setBases([]);
        setProjects([]);
      }
    };
    
    loadFilters();
  }, []);

  // Carregar dados do painel
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.baseId) queryParams.append('baseId', filters.baseId);
      if (filters.projectId) queryParams.append('projectId', filters.projectId);
      if (filters.startDate) queryParams.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) queryParams.append('endDate', filters.endDate.toISOString());
      queryParams.append('period', filters.period);

      const [maintenanceResponse, fuelResponse] = await Promise.all([
        fetch(`/api/operational-dashboard/maintenance?${queryParams.toString()}`),
        fetch(`/api/operational-dashboard/fuel?${queryParams.toString()}`)
      ]);

      if (maintenanceResponse.ok) {
        const maintenanceResult = await maintenanceResponse.json();
        // Validar estrutura dos dados de manutenção
        if (maintenanceResult && typeof maintenanceResult === 'object') {
          setMaintenanceData({
            vehiclesInMaintenance: maintenanceResult.vehiclesInMaintenance || 0,
            averageMaintenanceDays: maintenanceResult.averageMaintenanceDays || 0,
            vehiclesOver5Days: Array.isArray(maintenanceResult.vehiclesOver5Days) ? maintenanceResult.vehiclesOver5Days : [],
            totalMaintenanceCost: maintenanceResult.totalMaintenanceCost || 0,
            averageCostPerVehicle: maintenanceResult.averageCostPerVehicle || 0
          });
        }
      }

      if (fuelResponse.ok) {
        const fuelResult = await fuelResponse.json();
        // Validar estrutura dos dados de combustível
        if (fuelResult && typeof fuelResult === 'object') {
          setFuelData({
            totalRefuels: fuelResult.totalRefuels || 0,
            totalLiters: fuelResult.totalLiters || { diesel: 0, gasoline: 0, alcohol: 0 },
            averageConsumption: fuelResult.averageConsumption || 0,
            monthlyData: Array.isArray(fuelResult.monthlyData) ? fuelResult.monthlyData : []
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do painel:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Gráfico de combustível por tipo
  const fuelTypeData = fuelData ? [
    { name: 'Diesel', value: fuelData.totalLiters.diesel, color: '#0088FE' },
    { name: 'Gasolina', value: fuelData.totalLiters.gasoline, color: '#00C49F' },
    { name: 'Álcool', value: fuelData.totalLiters.alcohol, color: '#FFBB28' }
  ].filter(item => item.value > 0) : [];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel Operacional da Frota</h1>
          <p className="text-muted-foreground">Indicadores em tempo real de manutenção e abastecimento</p>
        </div>
        <Button onClick={loadDashboardData} disabled={isLoading}>
          {isLoading ? 'Carregando...' : 'Atualizar Dados'}
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="base-select">Base</Label>
              <Select value={filters.baseId} onValueChange={(value) => setFilters({...filters, baseId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as bases" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as bases</SelectItem>
                  {bases.map((base) => (
                    <SelectItem key={base.id} value={base.id}>
                      {base.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="project-select">Projeto</Label>
              <Select value={filters.projectId} onValueChange={(value) => setFilters({...filters, projectId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os projetos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os projetos</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Data Inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate ? format(filters.startDate, 'dd/MM/yyyy') : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) => setFilters({...filters, startDate: date})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>Data Final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.endDate ? format(filters.endDate, 'dd/MM/yyyy') : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.endDate}
                    onSelect={(date) => setFilters({...filters, endDate: date})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center space-x-2">
              <Label>Período:</Label>
              <Select value={filters.period} onValueChange={(value: 'week' | 'month') => setFilters({...filters, period: value})}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={loadDashboardData} disabled={isLoading}>
              Aplicar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Indicadores de Manutenção */}
      <Tabs defaultValue="maintenance" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="maintenance">
            <Wrench className="mr-2 h-4 w-4" />
            Manutenção
          </TabsTrigger>
          <TabsTrigger value="fuel">
            <Fuel className="mr-2 h-4 w-4" />
            Abastecimento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance" className="space-y-6">
          {/* Cards de Indicadores de Manutenção */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center space-x-2">
                  <Car className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Veículos em Manutenção</p>
                    <p className="text-2xl font-bold">{maintenanceData?.vehiclesInMaintenance || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tempo Médio</p>
                    <p className="text-2xl font-bold">{maintenanceData?.averageMaintenanceDays || 0} dias</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Mais de 5 dias</p>
                    <p className="text-2xl font-bold">{maintenanceData?.vehiclesOver5Days?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Custo Total</p>
                    <p className="text-lg font-bold">{formatCurrency(maintenanceData?.totalMaintenanceCost || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Veículos com mais de 5 dias */}
          {maintenanceData?.vehiclesOver5Days && maintenanceData.vehiclesOver5Days.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Veículos com mais de 5 dias parados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {maintenanceData.vehiclesOver5Days.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Badge variant="destructive">{vehicle.plate}</Badge>
                        <div>
                          <p className="font-medium">{vehicle.workshop}</p>
                          <p className="text-sm text-muted-foreground">
                            Entrada: {format(new Date(vehicle.entryDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {vehicle.daysInMaintenance} dias
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="fuel" className="space-y-6">
          {/* Cards de Indicadores de Combustível */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center space-x-2">
                  <Fuel className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de Abastecimentos</p>
                    <p className="text-2xl font-bold">{fuelData?.totalRefuels || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Consumo Médio</p>
                    <p className="text-2xl font-bold">{fuelData?.averageConsumption?.toFixed(2) || 0} L/km</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">D</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Diesel</p>
                    <p className="text-2xl font-bold">{fuelData?.totalLiters?.diesel?.toFixed(0) || 0}L</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">G</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Gasolina</p>
                    <p className="text-2xl font-bold">{fuelData?.totalLiters?.gasoline?.toFixed(0) || 0}L</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos de Combustível */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Pizza - Tipos de Combustível */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Tipo de Combustível</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={fuelTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {fuelTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} L`} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Barras - Abastecimentos Mensais */}
            <Card>
              <CardHeader>
                <CardTitle>Abastecimentos por Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fuelData?.monthlyData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="refuels" fill="#8884d8" name="Abastecimentos" />
                      <Bar dataKey="liters" fill="#82ca9d" name="Litros" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}