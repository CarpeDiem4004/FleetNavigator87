import { apiRequest } from "@/lib/queryClient";

// Interface para total de veículos
export interface TotalVehiclesData {
  total: number;
}

// Interface para veículos em manutenção
export interface VehiclesInMaintenanceData {
  total: number;
  previousTotal: number;
  variation: number;
}

// Interface para estatísticas de estoque de pneus
export interface TireStockStats {
  quantidade: number;
  valor_total: number;
}

// Interface para consumo de combustível
export interface FuelConsumptionData {
  total: number;
  previousTotal: number;
  variation: number;
}

// Interface para oficinas pendentes de aprovação
export interface PendingWorkshopsData {
  total: number;
}

// Interfaces para o Executive Dashboard
export interface KPI {
  name: string;
  value: number;
  previousValue: number;
  unit: string;
  target?: number;
  trend: 'up' | 'down';
  isPositive: boolean;
  changePercentage: number;
}

export interface KPIGroup {
  title: string;
  metrics: KPI[];
}

export interface TimeSeriesData {
  month: string;
  [key: string]: string | number;
}

export interface BaseKm {
  base: string;
  currentMonth: number;
  previousMonth: number;
}

export interface DashboardData {
  kpis: KPIGroup[];
  timeSeriesData: TimeSeriesData[];
  fleetAvailability: TimeSeriesData[];
  costPerKm: TimeSeriesData[];
  maintenanceTime: TimeSeriesData[];
  fuelEfficiency: TimeSeriesData[];
  kmPerBase: BaseKm[];
}

// Obter total de veículos cadastrados
export async function getTotalVehicles(): Promise<TotalVehiclesData> {
  const response = await apiRequest('GET', '/api/dashboard/veiculos/total');
  
  if (!response.ok) {
    throw new Error('Erro ao obter total de veículos');
  }
  
  const data = await response.json();
  return data.data;
}

// Obter veículos em manutenção
export async function getVehiclesInMaintenance(): Promise<VehiclesInMaintenanceData> {
  const response = await apiRequest('GET', '/api/dashboard/veiculos/manutencao');
  
  if (!response.ok) {
    throw new Error('Erro ao obter veículos em manutenção');
  }
  
  const data = await response.json();
  return data.data;
}

// Obter estatísticas de estoque de pneus
export async function getTireStockStats(): Promise<TireStockStats> {
  const response = await apiRequest('GET', '/api/pneus/estatisticas/estoque');
  
  if (!response.ok) {
    throw new Error('Erro ao obter estatísticas de estoque de pneus');
  }
  
  const data = await response.json();
  return data.data;
}

// Obter consumo de combustível
export async function getFuelConsumption(): Promise<FuelConsumptionData> {
  const response = await apiRequest('GET', '/api/dashboard/abastecimentos/litros');
  
  if (!response.ok) {
    throw new Error('Erro ao obter consumo de combustível');
  }
  
  const data = await response.json();
  return data.data;
}

// Obter oficinas pendentes de aprovação
export async function getPendingWorkshops(): Promise<PendingWorkshopsData> {
  try {
    const response = await apiRequest('GET', '/api/workshops/pending');
    
    if (!response.ok) {
      throw new Error('Erro ao obter oficinas pendentes');
    }
    
    const data = await response.json();
    
    // Filtrar apenas as oficinas com status pendente
    const pendingWorkshops = data.filter(workshop => 
      workshop.approval_status === 'pendente' || !workshop.approval_status
    );
    
    return {
      total: pendingWorkshops.length
    };
  } catch (error) {
    console.error('Erro ao buscar oficinas pendentes:', error);
    return { total: 0 };
  }
}

// Função para buscar dados para o dashboard executivo
export async function fetchDashboardData(dateParam?: string): Promise<DashboardData> {
  try {
    // Adiciona parâmetro de data se fornecido
    const url = dateParam ? `/api/dashboard/executive?date=${dateParam}` : '/api/dashboard/executive';
    
    const response = await apiRequest('GET', url);
    
    if (!response.ok) {
      throw new Error('Erro ao obter dados do dashboard executivo');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Erro ao carregar dados do dashboard executivo:', error);
    
    // Importar e usar a função de geração de dados simulados do utilitário dashboardData
    // para manter consistência com a implementação existente
    const { generateDashboardData } = await import('@/utils/dashboardData');
    return generateDashboardData();
  }
}