import { DashboardData, KPI, KPIGroup, TimeSeriesData } from "@/types/dashboard";
import { apiRequest } from "@/lib/queryClient";

/**
 * Calcula a variação percentual entre dois valores
 */
export function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Determina se uma tendência é positiva com base no tipo de métrica
 * Para algumas métricas, como tempo de manutenção, menor é melhor (down is positive)
 * Para outras, como disponibilidade, maior é melhor (up is positive)
 */
export function isTrendPositive(metricName: string, trend: 'up' | 'down'): boolean {
  // Métricas onde menor é melhor
  const downIsPositive = [
    'Tempo médio de manutenção',
    'Dias parados por veículo',
    'Custo médio por km',
    'Tempo médio de atendimento'
  ];
  
  if (downIsPositive.includes(metricName)) {
    return trend === 'down';
  }
  
  // Para as demais métricas, maior é melhor
  return trend === 'up';
}

/**
 * Tenta buscar dados da API, caso não esteja disponível usa dados simulados
 */
export async function fetchDashboardData(): Promise<DashboardData> {
  try {
    // Tentar buscar da API
    const response = await apiRequest('GET', '/api/dashboard/kpis');
    // Verificar se a resposta tem o formato esperado
    if (response && 
        typeof response === 'object' && 
        'kpis' in response &&
        'timeSeriesData' in response &&
        'fleetAvailability' in response &&
        'costPerKm' in response &&
        'maintenanceTime' in response &&
        'fuelEfficiency' in response &&
        'kmPerBase' in response) {
      return response as unknown as DashboardData;
    }
    // Se não tiver o formato esperado, use dados simulados
    console.log('API de dashboard não retornou dados no formato esperado, usando dados simulados.');
    return generateDashboardData();
  } catch (error) {
    console.log('API de dashboard não disponível, usando dados simulados.');
    return generateDashboardData();
  }
}

/**
 * Gera um valor aleatório para simulação, entre o min e o max
 */
function randomValue(min: number, max: number, decimals: number = 0): number {
  const value = Math.random() * (max - min) + min;
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Cria um KPI com base nos parâmetros
 */
function createKPI(
  name: string,
  currentValue: number,
  previousValue: number,
  unit: string,
  target?: number
): KPI {
  const change = calculateChange(currentValue, previousValue);
  const trend = currentValue >= previousValue ? 'up' : 'down';
  
  return {
    name,
    value: currentValue,
    previousValue,
    unit,
    target,
    trend,
    isPositive: isTrendPositive(name, trend),
    changePercentage: Math.abs(change)
  };
}

/**
 * Gera dados de dashboard para demonstração
 */
export function generateDashboardData(): DashboardData {
  // Grupo 1: Disponibilidade e Utilização
  const disponibilidadeMetrics: KPI[] = [
    createKPI('Disponibilidade da frota', randomValue(85, 95, 1), randomValue(80, 90, 1), '%', 95),
    createKPI('Dias parados por veículo', randomValue(2, 5, 1), randomValue(3, 7, 1), 'dias', 2)
  ];

  // Grupo 2: Manutenção
  const manutencaoMetrics: KPI[] = [
    createKPI('Tempo médio de manutenção', randomValue(1.5, 3.5, 1), randomValue(2, 4, 1), 'dias', 2),
    createKPI('Atendimentos dentro do SLA', randomValue(85, 95, 1), randomValue(80, 92, 1), '%', 90),
    createKPI('Tempo médio de atendimento', randomValue(6, 12, 1), randomValue(8, 15, 1), 'horas', 8)
  ];

  // Grupo 3: Custos e Eficiência
  const custosMetrics: KPI[] = [
    createKPI('Custo médio por km', randomValue(1.2, 1.8, 2), randomValue(1.3, 2, 2), 'R$', 1.5),
    createKPI('Eficiência dos abastecimentos', randomValue(2.8, 3.8, 1), randomValue(2.5, 3.5, 1), 'km/l', 3.5)
  ];

  // Dados de série temporal para gráficos
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const currentMonth = new Date().getMonth();
  
  // Últimos 6 meses para gráficos
  const timeSeriesData: TimeSeriesData[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    timeSeriesData.push({
      month: months[monthIndex],
      'Disponibilidade': randomValue(80, 95, 1),
      'Custo por km': randomValue(1.2, 2, 2),
      'Eficiência': randomValue(2.5, 4, 1)
    });
  }

  // Dados específicos para cada gráfico
  const fleetAvailability: TimeSeriesData[] = timeSeriesData.map(data => ({
    month: data.month,
    'Disponibilidade': data['Disponibilidade'],
    'Meta': 95
  }));

  const costPerKm: TimeSeriesData[] = timeSeriesData.map(data => ({
    month: data.month,
    'Custo': data['Custo por km'],
    'Meta': 1.5
  }));

  const maintenanceTime: TimeSeriesData[] = timeSeriesData.map(data => ({
    month: data.month,
    'Tempo': randomValue(1, 4, 1),
    'Meta': 2
  }));

  const fuelEfficiency: TimeSeriesData[] = timeSeriesData.map(data => ({
    month: data.month,
    'Eficiência': data['Eficiência'],
    'Meta': 3.5
  }));

  // Quilometragem por base
  const baseNames = ['São Paulo', 'Campinas', 'Guarulhos', 'ABC', 'Sorocaba', 'Osasco'];
  const kmPerBase = baseNames.map(base => ({
    base,
    currentMonth: randomValue(15000, 35000, 0),
    previousMonth: randomValue(15000, 35000, 0)
  }));

  return {
    kpis: [
      { title: 'Disponibilidade e Utilização', metrics: disponibilidadeMetrics },
      { title: 'Manutenção', metrics: manutencaoMetrics },
      { title: 'Custos e Eficiência', metrics: custosMetrics }
    ],
    timeSeriesData,
    fleetAvailability,
    costPerKm,
    maintenanceTime,
    fuelEfficiency,
    kmPerBase
  };
}