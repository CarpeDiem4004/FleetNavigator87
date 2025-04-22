import axios from 'axios';

export interface DashboardKPI {
  title: string;
  value: number;
  unit?: string;
  previousValue?: number;
  changePercentage?: number;
  trend?: 'up' | 'down' | 'neutral';
  isPositive?: boolean;
  color?: string;
}

export interface FuelConsumptionByBase {
  base: string;
  litros: number;
  previousLitros?: number;
  changePercentage?: number;
}

export interface ExpenseDistribution {
  category: string;
  value: number;
  percentage: number;
  color: string;
}

export interface VehicleOperationalCost {
  plate: string;
  model: string;
  costType: string;
  totalCost: number;
  avgCostPerKm: number;
  totalKm: number;
}

export interface MaintenanceRecord {
  id: number;
  date: string;
  vehiclePlate: string;
  vehicleModel: string;
  description: string;
  status: string;
  cost: number;
  base: string;
}

export interface DashboardData {
  // KPIs
  kpis: {
    fuelExpenses: DashboardKPI;
    partsExpenses: DashboardKPI;
    tiresExpenses: DashboardKPI;
    daysInactive: DashboardKPI;
    tireUsage: DashboardKPI;
    fleetAvailability: DashboardKPI;
    workshopSLA: DashboardKPI;
    openClosedRequests: DashboardKPI;
    avgFuelConsumption: DashboardKPI;
  };
  
  // Gráficos
  fuelConsumptionByBase: FuelConsumptionByBase[];
  expenseDistribution: ExpenseDistribution[];
  topVehiclesCost: VehicleOperationalCost[];
  recentMaintenances: MaintenanceRecord[];
  
  // Dados de referência
  referenceDate: string;
  updateTime: string;
}

/**
 * Fetches dashboard data from the API
 */
export const fetchDashboardData = async (dateFilter?: string): Promise<DashboardData> => {
  try {
    const params = dateFilter ? { date: dateFilter } : {};
    const response = await axios.get('/api/dashboard', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw new Error('Failed to fetch dashboard data');
  }
};

/**
 * Fetch comparative data between current and previous month
 */
export const fetchComparativeData = async (): Promise<any> => {
  try {
    const response = await axios.get('/api/dashboard/comparative');
    return response.data;
  } catch (error) {
    console.error('Error fetching comparative data:', error);
    throw new Error('Failed to fetch comparative data');
  }
};

/**
 * Fetch KPIs data
 */
export const fetchKPIs = async (dateFilter?: string): Promise<any> => {
  try {
    const params = dateFilter ? { date: dateFilter } : {};
    const response = await axios.get('/api/dashboard/kpis', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    throw new Error('Failed to fetch KPIs');
  }
};