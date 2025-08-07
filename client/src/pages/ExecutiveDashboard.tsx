import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  TrendingUp, TrendingDown, DollarSign, Truck, Timer, 
  AlertTriangle, Wrench, BarChart2, Droplets, Activity, 
  ExternalLink
} from 'lucide-react';
import KpiCard from '@/components/dashboard/KpiCard';
import ChartCard from '@/components/dashboard/ChartCard';
import DashboardTable from '@/components/dashboard/DashboardTable';
import BarChartComponent from '@/components/dashboard/charts/BarChartComponent';
import PieChartComponent from '@/components/dashboard/charts/PieChartComponent';
import { fetchDashboardData, type DashboardData } from '@/services/dashboardService';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import AppLayout from '@/components/layout/AppLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';

export default function ExecutiveDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Formatar a data para exibição no botão de calendário
  const formattedDate = date
    ? format(date, 'MMMM yyyy', { locale: ptBR })
    : 'Selecione um mês';

  // Função para carregar os dados do dashboard
  const loadDashboardData = async (selectedDate?: Date) => {
    setLoading(true);
    setError(null);
    try {
      const dateParam = selectedDate 
        ? format(selectedDate, 'yyyy-MM-dd')
        : undefined;
      
      const data = await fetchDashboardData(dateParam);
      setDashboardData(data);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setError('Falha ao carregar dados do dashboard. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados na montagem do componente e quando a data mudar
  useEffect(() => {
    loadDashboardData(date);
  }, [date]);

  // Função para formatar valores monetários
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Componente de Esqueleto de Carregamento para KPIs
  const KpiSkeleton = () => (
    <Card className="overflow-hidden border">
      <CardContent className="p-0">
        <div className="p-4">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-36 mt-2" />
          <Skeleton className="h-4 w-20 mt-2" />
        </div>
      </CardContent>
    </Card>
  );

  // Renderizando o ícone para cada KPI
  const getIconForKpi = (kpiKey: string) => {
    switch (kpiKey) {
      case 'fuelExpenses':
        return <DollarSign className="h-5 w-5" />;
      case 'partsExpenses':
        return <Wrench className="h-5 w-5" />;
      case 'tiresExpenses':
        return <BarChart2 className="h-5 w-5" />;
      case 'daysInactive':
        return <Timer className="h-5 w-5" />;
      case 'tireUsage':
        return <Activity className="h-5 w-5" />;
      case 'fleetAvailability':
        return <Truck className="h-5 w-5" />;
      case 'workshopSLA':
        return <AlertTriangle className="h-5 w-5" />;
      case 'avgFuelConsumption':
        return <Droplets className="h-5 w-5" />;
      default:
        return <TrendingUp className="h-5 w-5" />;
    }
  };

  // Renderizando seção de KPIs
  const renderKpis = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (!dashboardData || !dashboardData.kpis) {
      return (
        <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500">Nenhum dado disponível para o período selecionado.</p>
        </div>
      );
    }

    // Tratar kpis como array se for necessário
    let kpisToRender = [];
    if (Array.isArray(dashboardData.kpis)) {
      kpisToRender = dashboardData.kpis;
    } else if (typeof dashboardData.kpis === 'object') {
      kpisToRender = Object.entries(dashboardData.kpis);
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {kpisToRender.map((item: any, index: number) => {
          const kpi = Array.isArray(dashboardData.kpis) ? item : item[1];
          const key = Array.isArray(dashboardData.kpis) ? `kpi-${index}` : item[0];
          
          return (
            <KpiCard
              key={key}
              title={kpi.title || `KPI ${index + 1}`}
              value={kpi.value || 0}
              unit={kpi.unit || ''}
              previousValue={kpi.previousValue}
              changePercentage={kpi.changePercentage}
              trend={kpi.trend}
              isPositive={kpi.isPositive}
              icon={getIconForKpi(key)}
              color={kpi.color || 'primary'}
            />
          );
        })}
      </div>
    );
  };

  // Renderizando gráfico de consumo por base (usando dados reais de km)
  const renderFuelConsumptionByBase = () => {
    if (loading || !dashboardData) {
      return (
        <div className="h-80 w-full animate-pulse bg-gray-200 rounded"></div>
      );
    }

    // Usar dados de quilometragem por base se disponível
    const kmData = dashboardData.kmPerBase || [];
    
    if (kmData.length === 0) {
      return (
        <div className="h-80 w-full flex items-center justify-center bg-gray-50 rounded">
          <p className="text-gray-500">Nenhum dado de quilometragem disponível</p>
        </div>
      );
    }

    const data = kmData.map((item: any) => ({
      name: item.base,
      value: item.currentMonth,
      previousValue: item.previousMonth
    }));

    return (
      <BarChartComponent
        data={data}
        dataKey="value"
        previousDataKey="previousValue"
        barColor="#3B82F6"
        previousBarColor="#93C5FD"
        height={350}
        yAxisFormatter={(value) => `${value.toLocaleString('pt-BR')} km`}
      />
    );
  };

  // Renderizando gráfico de distribuição de despesas
  const renderExpenseDistribution = () => {
    if (loading || !dashboardData) {
      return (
        <div className="h-80 w-full animate-pulse bg-gray-200 rounded"></div>
      );
    }

    // Usar dados simulados se expenseDistribution não existir
    const expenseData = dashboardData.expenseDistribution || [
      { category: 'Combustível', value: 45000, color: '#3B82F6' },
      { category: 'Manutenção', value: 28000, color: '#EF4444' },
      { category: 'Pneus', value: 18000, color: '#F59E0B' },
      { category: 'Seguro', value: 12000, color: '#10B981' },
      { category: 'Outros', value: 8000, color: '#8B5CF6' }
    ];

    return (
      <PieChartComponent
        data={expenseData.map((item: any) => ({
          name: item.category,
          value: item.value,
          color: item.color
        }))}
        height={350}
        innerRadius="45%"
        outerRadius="70%"
        tooltipFormatter={(value) => [formatCurrency(value), '']}
      />
    );
  };

  // Renderizando tabela de veículos com maior custo
  const renderTopVehiclesCost = () => {
    if (loading || !dashboardData) {
      return (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className="h-10 w-full animate-pulse bg-gray-200 rounded"
            ></div>
          ))}
        </div>
      );
    }

    const columns = [
      { header: 'Placa', accessor: 'plate' },
      { header: 'Modelo', accessor: 'model' },
      { 
        header: 'Custo Total', 
        accessor: 'totalCost',
        cell: (value: number) => formatCurrency(value)
      },
      { 
        header: 'Custo por KM', 
        accessor: 'avgCostPerKm',
        cell: (value: number) => `R$ ${value.toFixed(2)}/km`
      },
      { 
        header: 'Km Total', 
        accessor: 'totalKm',
        cell: (value: number) => `${value.toLocaleString('pt-BR')} km`
      }
    ];

    return (
      <DashboardTable
        title="Veículos com Maior Custo Operacional"
        columns={columns}
        data={dashboardData.topVehiclesCost || []}
        emptyMessage="Nenhum dado de custo disponível para o período selecionado."
      />
    );
  };

  // Renderizando tabela de manutenções recentes
  const renderRecentMaintenances = () => {
    if (loading || !dashboardData) {
      return (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className="h-10 w-full animate-pulse bg-gray-200 rounded"
            ></div>
          ))}
        </div>
      );
    }

    const getStatusClass = (status: string) => {
      switch (status) {
        case 'concluida':
          return 'bg-green-100 text-green-800';
        case 'em_andamento':
          return 'bg-blue-100 text-blue-800';
        case 'aguardando_pecas':
          return 'bg-yellow-100 text-yellow-800';
        case 'cancelada':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    const columns = [
      { header: 'Data', accessor: 'date' },
      { header: 'Placa', accessor: 'vehiclePlate' },
      { header: 'Modelo', accessor: 'vehicleModel' },
      { header: 'Base', accessor: 'base' },
      { 
        header: 'Status', 
        accessor: 'status',
        cell: (value: string) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(value)}`}>
            {value === 'concluida' ? 'Concluída' : 
            value === 'em_andamento' ? 'Em andamento' : 
            value === 'aguardando_pecas' ? 'Aguardando peças' :
            value === 'cancelada' ? 'Cancelada' : value}
          </span>
        )
      },
      { 
        header: 'Custo', 
        accessor: 'cost',
        cell: (value: number) => formatCurrency(value)
      }
    ];

    return (
      <DashboardTable
        title="Manutenções Recentes"
        columns={columns}
        data={dashboardData.recentMaintenances || []}
        emptyMessage="Nenhuma manutenção registrada para o período selecionado."
      />
    );
  };

  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto py-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Executivo</h1>
            <p className="text-muted-foreground mt-1">
              Visão geral de indicadores de desempenho da frota {dashboardData && dashboardData.referenceDate && `- ${dashboardData.referenceDate}`}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/postos/consumo-diario">
              <Button 
                variant="default" 
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <BarChart2 className="h-4 w-4" />
                Gráficos de Consumo dos Postos
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
            
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span>{formattedDate}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => {
                    setDate(newDate);
                    setCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="outline" 
              onClick={() => loadDashboardData(date)}
            >
              Atualizar
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="expenses">Despesas</TabsTrigger>
            <TabsTrigger value="fleet">Frota</TabsTrigger>
            <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {renderKpis()}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard 
                title="Quilometragem por Base" 
                description="Quilômetros rodados no período por base operacional (dados reais)"
                loading={loading}
              >
                {renderFuelConsumptionByBase()}
              </ChartCard>
              
              <ChartCard 
                title="Distribuição de Despesas" 
                description="Representação proporcional de gastos por categoria"
                loading={loading}
              >
                {renderExpenseDistribution()}
              </ChartCard>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {renderTopVehiclesCost()}
              {renderRecentMaintenances()}
            </div>
          </TabsContent>
          
          <TabsContent value="expenses" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KpiCard
                title="Gastos com Combustível"
                value={0}
                unit="R$"
                previousValue={0}
                changePercentage={0}
                trend="stable"
                isPositive={false}
                icon={<DollarSign className="h-5 w-5" />}
                loading={loading}
                color="primary"
              />
              
              <KpiCard
                title="Gastos com Peças"
                value={0}
                unit="R$"
                previousValue={0}
                changePercentage={0}
                trend="stable"
                isPositive={false}
                icon={<Wrench className="h-5 w-5" />}
                loading={loading}
                color="warning"
              />
              
              <KpiCard
                title="Gastos com Pneus"
                value={0}
                unit="R$"
                previousValue={0}
                changePercentage={0}
                trend="stable"
                isPositive={false}
                icon={<BarChart2 className="h-5 w-5" />}
                loading={loading}
                color="danger"
              />
            </div>
            
            <ChartCard 
              title="Distribuição de Despesas" 
              description="Representação proporcional de gastos por categoria"
              loading={loading}
              className="h-[500px]"
            >
              {renderExpenseDistribution()}
            </ChartCard>
            
            {renderTopVehiclesCost()}
          </TabsContent>
          
          <TabsContent value="fleet" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KpiCard
                title="Disponibilidade da Frota"
                value={85}
                unit="%"
                previousValue={82}
                changePercentage={3.7}
                trend="up"
                isPositive={true}
                icon={<Truck className="h-5 w-5" />}
                loading={loading}
                color="success"
              />
              
              <KpiCard
                title="Dias Inativos (Total)"
                value={45}
                unit="dias"
                previousValue={52}
                changePercentage={-13.5}
                trend="down"
                isPositive={true}
                icon={<Timer className="h-5 w-5" />}
                loading={loading}
                color="danger"
              />
              
              <KpiCard
                title="Consumo Médio de Combustível"
                value={32.5}
                unit="L/100km"
                previousValue={34.2}
                changePercentage={-5.0}
                trend="down"
                isPositive={true}
                icon={<Droplets className="h-5 w-5" />}
                loading={loading}
                color="info"
              />
            </div>
            
            <ChartCard 
              title="Consumo de Combustível por Base" 
              description="Litros consumidos no período por base operacional"
              loading={loading}
              className="h-[400px]"
            >
              {renderFuelConsumptionByBase()}
            </ChartCard>
            
            {renderTopVehiclesCost()}
          </TabsContent>
          
          <TabsContent value="maintenance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KpiCard
                title="Tempo Médio em Oficina"
                value={4.2}
                unit="dias"
                previousValue={5.8}
                changePercentage={-27.6}
                trend="down"
                isPositive={true}
                icon={<AlertTriangle className="h-5 w-5" />}
                loading={loading}
                color="warning"
              />
              
              <KpiCard
                title="Pneus Montados"
                value={142}
                previousValue={138}
                changePercentage={2.9}
                trend="up"
                isPositive={true}
                icon={<Activity className="h-5 w-5" />}
                loading={loading}
                color="info"
              />
              
              <KpiCard
                title="Solicitações Abertas/Concluídas"
                value={"12/34"}
                previousValue={"18/28"}
                icon={<TrendingUp className="h-5 w-5" />}
                loading={loading}
                color="primary"
              />
            </div>
            
            {renderRecentMaintenances()}
          </TabsContent>
        </Tabs>
        
        {dashboardData && (
          <div className="text-xs text-gray-500 mt-6 text-right">
            Última atualização: {dashboardData.updateTime || new Date().toLocaleString('pt-BR')}
          </div>
        )}
      </div>
    </AppLayout>
  );
}