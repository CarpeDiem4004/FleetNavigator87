import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardData } from '@/types/dashboard';
import { fetchDashboardData } from '@/utils/dashboardData';
import AppLayout from '@/components/layout/AppLayout';
import KPIGroupSection from '@/components/dashboard/KPIGroupSection';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, PieChart, TrendingDown, TrendingUp, CalendarClock, Truck, Fuel, Wrench, DollarSign, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardPage: React.FC = () => {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Painel de Controle</h1>
              <p className="text-muted-foreground">
                Análise de desempenho da frota e indicadores estratégicos
              </p>
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="mb-8">
            <Skeleton className="h-64 w-full mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-80 w-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-80 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout>
        <div className="container mx-auto py-12">
          <Card>
            <CardHeader>
              <CardTitle>Erro ao carregar dados do dashboard</CardTitle>
              <CardDescription>
                Não foi possível obter os dados necessários para exibir o painel de controle.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Detalhes do erro: {error instanceof Error ? error.message : 'Erro desconhecido'}</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const getIconForKPI = (kpiName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'Disponibilidade da frota': <Truck className="h-4 w-4" />,
      'Dias parados por veículo': <CalendarClock className="h-4 w-4" />,
      'Tempo médio de manutenção': <Wrench className="h-4 w-4" />,
      'Atendimentos dentro do SLA': <Target className="h-4 w-4" />,
      'Tempo médio de atendimento': <CalendarClock className="h-4 w-4" />,
      'Custo médio por km': <DollarSign className="h-4 w-4" />,
      'Eficiência dos abastecimentos': <Fuel className="h-4 w-4" />
    };

    return iconMap[kpiName] || <TrendingUp className="h-4 w-4" />;
  };

  // Encontrar os KPIs principais para o header
  const findMainKPIs = () => {
    const mainKpis: Array<KPI> = [];
    data.kpis.forEach(group => {
      group.metrics.forEach(kpi => {
        if (
          kpi.name === 'Disponibilidade da frota' || 
          kpi.name === 'Custo médio por km' || 
          kpi.name === 'Eficiência dos abastecimentos' ||
          kpi.name === 'Tempo médio de manutenção'
        ) {
          mainKpis.push(kpi);
        }
      });
    });
    return mainKpis;
  };

  const mainKPIs = findMainKPIs();

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Painel de Controle</h1>
            <p className="text-muted-foreground">
              Análise de desempenho da frota e indicadores estratégicos
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Tabs defaultValue="kpis">
              <TabsList>
                <TabsTrigger value="kpis" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>KPIs</span>
                </TabsTrigger>
                <TabsTrigger value="charts" className="flex items-center gap-2">
                  <BarChart className="h-4 w-4" />
                  <span>Gráficos</span>
                </TabsTrigger>
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  <span>Todos</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Resumo de KPIs principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {mainKPIs.map((kpi, index) => (
            <Card key={`main-kpi-${index}`}>
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    {getIconForKPI(kpi.name)}
                    <h3 className="text-sm font-medium text-muted-foreground">{kpi.name}</h3>
                  </div>
                  
                  <div className="flex justify-between items-end mt-2">
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold">
                        {kpi.unit === 'R$' 
                          ? `${kpi.value.toFixed(2).replace('.', ',')}${kpi.unit}` 
                          : `${kpi.value.toFixed(1)}${kpi.unit}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Mês anterior: {kpi.unit === 'R$' 
                          ? `${kpi.previousValue.toFixed(2).replace('.', ',')}${kpi.unit}` 
                          : `${kpi.previousValue.toFixed(1)}${kpi.unit}`}
                      </span>
                    </div>
                    
                    <div className={`flex items-center px-2 py-1 rounded-full ${
                      kpi.isPositive 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    }`}>
                      {kpi.trend === 'up' ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      <span className="text-xs font-medium">
                        {kpi.changePercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Conteúdo com abas */}
        <Tabs defaultValue="all" className="mb-6">
          <TabsContent value="kpis" className="mt-0">
            {data.kpis.map((group, index) => (
              <KPIGroupSection key={`group-${index}`} group={group} />
            ))}
          </TabsContent>
          
          <TabsContent value="charts" className="mt-0">
            <DashboardCharts data={data} />
          </TabsContent>
          
          <TabsContent value="all" className="mt-0">
            {/* Seções de KPIs */}
            {data.kpis.map((group, index) => (
              <KPIGroupSection key={`group-${index}`} group={group} />
            ))}
            
            {/* Gráficos */}
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Análise de Tendências</h2>
              <DashboardCharts data={data} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;