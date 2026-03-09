/**
 * Tipos para os dados do dashboard
 */

// KPI individual
export interface KPI {
  name: string;           // Nome do KPI
  value: number;          // Valor atual
  previousValue: number;  // Valor do período anterior
  unit: string;           // Unidade (%, dias, km, litros, etc)
  target?: number;        // Meta (opcional)
  trend: 'up' | 'down';   // Tendência (para cima ou para baixo)
  isPositive: boolean;    // Se a tendência é positiva
  changePercentage: number; // Percentual de mudança
}

// Grupo de KPIs para seções do dashboard
export interface KPIGroup {
  title: string;
  metrics: KPI[];
}

// Dados de gráficos de série temporal
export interface TimeSeriesData {
  month: string;          // Mês (ex: 'Jan', 'Fev')
  [key: string]: any;     // Valores dinâmicos para diferentes métricas
}

// Tipos de dados completos para o dashboard
export interface DashboardData {
  kpis: KPIGroup[];
  timeSeriesData: TimeSeriesData[];
  fleetAvailability: TimeSeriesData[];
  costPerKm: TimeSeriesData[];
  maintenanceTime: TimeSeriesData[];
  fuelEfficiency: TimeSeriesData[];
  kmPerBase: {
    base: string;
    currentMonth: number;
    previousMonth: number;
  }[];
}