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
  dailyAverage?: number;
  todayConsumption?: number;
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

export interface RealFuelConsumption {
  periodo: {
    inicio: string;
    fim: string;
  };
  resumo: {
    valor_total: number;
    litros_total: number;
    custo_medio_por_litro: number;
  };
  consumo_por_tipo: Array<{
    tipo: string;
    origem: string;
    valor_total: number;
    litros_calculados?: number;
    litros_reais?: number;
    litros_registrados?: number;
    preco_litro: number;
    quantidade_registros: number;
  }>;
  precos_referencia: { [key: string]: number };
}

export interface MaintenanceStats {
  totalEmManutencao: number;
  totalFinalizado: number;
  emManutencao: number;
  aguardandoPeca: number;
  emOrcamento: number;
  aguardandoAprovacao: number;
  emExecucao: number;
  liberados: number;
  veiculosUnicos: number;
  totalLiberados: number;
  preventivas: number;
  corretivas: number;
}

export interface MaintenanceRecord {
  id: number;
  date: string;
  placa: string;
  vehicle: string;
  serviceType: string;
  status: string;
  oficina: string;
  km: number;
  cost: number;
}

export interface DashboardData {
  kpis: KPIGroup[];
  timeSeriesData: TimeSeriesData[];
  fleetAvailability: TimeSeriesData[];
  costPerKm: TimeSeriesData[];
  maintenanceTime: TimeSeriesData[];
  fuelEfficiency: TimeSeriesData[];
  kmPerBase: BaseKm[];
  expenseDistribution?: Array<{category: string; value: number; color: string}>;
  topVehiclesCost?: Array<{plate: string; model: string; totalCost: number; avgCostPerKm: number; totalKm: number}>;
  recentMaintenances?: Array<{date: string; vehiclePlate: string; vehicleModel: string; base: string; status: string; cost: number}>;
  maintenanceRecords?: MaintenanceRecord[];
  maintenanceStats?: MaintenanceStats;
  referenceDate?: string;
  updateTime?: string;
  realFuelConsumption?: RealFuelConsumption;
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

// Função para buscar dados reais de quilometragem por base
export async function getKmPerBase(): Promise<BaseKm[]> {
  try {
    const response = await apiRequest('GET', '/api/dashboard/km-per-base');
    
    if (!response.ok) {
      throw new Error('Erro ao obter dados de quilometragem por base');
    }
    
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Erro ao carregar quilometragem por base:', error);
    return [];
  }
}

// Função para buscar consumo real de combustível com base nos preços
export async function getRealFuelConsumption(dateParam?: string): Promise<RealFuelConsumption | null> {
  try {
    const url = dateParam ? `/api/dashboard/fuel-consumption-real?date=${dateParam}` : '/api/dashboard/fuel-consumption-real';
    const response = await apiRequest('GET', url);
    
    if (!response.ok) {
      throw new Error('Erro ao obter consumo real de combustível');
    }
    
    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error('Erro ao carregar consumo real de combustível:', error);
    return null;
  }
}

// Função para buscar dados para o dashboard executivo
export async function fetchDashboardData(dateParam?: string): Promise<DashboardData> {
  try {
    // Adiciona parâmetro de data se fornecido - usando endpoint executivo
    const url = dateParam ? `/api/executive/dashboard?date=${dateParam}` : '/api/executive/dashboard';
    
    const response = await apiRequest('GET', url);
    
    if (!response.ok) {
      throw new Error('Erro ao obter dados do dashboard executivo');
    }
    
    const data = await response.json();
    
    // Tentar buscar dados reais de quilometragem por base
    const kmPerBaseData = await getKmPerBase();
    
    if (kmPerBaseData.length > 0) {
      console.log('Dados reais de quilometragem por base integrados:', kmPerBaseData);
      data.data.kmPerBase = kmPerBaseData;
    }
    
    // Tentar buscar dados reais de consumo de combustível
    const realFuelData = await getRealFuelConsumption(dateParam);
    
    if (realFuelData) {
      console.log('Dados reais de consumo de combustível integrados:', realFuelData);
      data.data.realFuelConsumption = realFuelData;
    }
    
    return data.data;
  } catch (error) {
    console.error('Erro ao carregar dados do dashboard executivo:', error);
    
    // Tentar buscar dados reais de quilometragem mesmo em fallback
    const kmPerBaseData = await getKmPerBase();
    
    // Importar e usar a função de geração de dados simulados
    const { generateDashboardData } = await import('@/utils/dashboardData');
    const fallbackData = generateDashboardData();
    
    if (kmPerBaseData.length > 0) {
      console.log('Usando dados reais de quilometragem em fallback:', kmPerBaseData);
      fallbackData.kmPerBase = kmPerBaseData;
    }
    
    return fallbackData;
  }
}