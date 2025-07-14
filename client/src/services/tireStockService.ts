import { apiRequest } from "@/lib/queryClient";
import { TireStock, InsertTireStock, TireMounting, InsertTireMounting } from "@/shared/schema";

// Interface para estatísticas de estoque
export interface TireStockStats {
  totalTires: number;
  tiresInStock: number;
  tiresInUse: number;
  tiresDiscarded: number;
  totalValue: number;
  averageValue: number;
}

// CRUD operations for tire stock
export async function getAllTireStock(filters?: { 
  status?: string; 
  localizacao?: string;
  marca?: string;
  tipo?: string;
}) {
  let url = '/api/tire-stock';
  const queryParams = [];
  
  if (filters?.status) {
    queryParams.push(`status=${encodeURIComponent(filters.status)}`);
  }
  
  if (filters?.localizacao) {
    queryParams.push(`localizacao=${encodeURIComponent(filters.localizacao)}`);
  }
  
  if (filters?.marca) {
    queryParams.push(`marca=${encodeURIComponent(filters.marca)}`);
  }
  
  if (filters?.tipo) {
    queryParams.push(`tipo=${encodeURIComponent(filters.tipo)}`);
  }
  
  if (queryParams.length > 0) {
    url += `?${queryParams.join('&')}`;
  }
  
  const response = await apiRequest('GET', url);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao buscar estoque de pneus');
  }
  
  return await response.json();
}

export async function getTireStockById(id: string) {
  const response = await apiRequest('GET', `/api/tire-stock/${id}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erro ao buscar pneu ${id}`);
  }
  
  return await response.json();
}

export async function createTireStock(tire: InsertTireStock) {
  const response = await apiRequest('POST', '/api/tire-stock', tire);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao cadastrar pneu no estoque');
  }
  
  return await response.json();
}

export async function updateTireStock(id: string, tire: Partial<InsertTireStock>) {
  const response = await apiRequest('PUT', `/api/tire-stock/${id}`, tire);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao atualizar pneu do estoque');
  }
  
  return await response.json();
}

export async function deleteTireStock(id: string) {
  const response = await apiRequest('DELETE', `/api/tire-stock/${id}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao excluir pneu do estoque');
  }
  
  return await response.json();
}

// Get available tires for mounting (status = "Em estoque")
export async function getAvailableTires(filters?: { marca?: string; medida?: string }) {
  return await getAllTireStock({ 
    status: 'Em estoque', 
    ...filters 
  });
}

// Get tire stock statistics
export async function getTireStockStats(): Promise<TireStockStats> {
  const response = await apiRequest('GET', '/api/tire-stock/stats');
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao buscar estatísticas do estoque');
  }
  
  return await response.json();
}

// CRUD operations for tire mounting
export async function getAllTireMounting(filters?: { 
  placaVeiculo?: string; 
  desmontado?: boolean;
}) {
  let url = '/api/tire-mounting';
  const queryParams = [];
  
  if (filters?.placaVeiculo) {
    queryParams.push(`placaVeiculo=${encodeURIComponent(filters.placaVeiculo)}`);
  }
  
  if (filters?.desmontado !== undefined) {
    queryParams.push(`desmontado=${filters.desmontado}`);
  }
  
  if (queryParams.length > 0) {
    url += `?${queryParams.join('&')}`;
  }
  
  const response = await apiRequest('GET', url);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao buscar montagens de pneus');
  }
  
  return await response.json();
}

export async function getMountingsByVehicle(placa: string) {
  return await getAllTireMounting({ placaVeiculo: placa, desmontado: false });
}

export async function createTireMounting(mounting: InsertTireMounting) {
  const response = await apiRequest('POST', '/api/tire-mounting', mounting);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao registrar montagem de pneu');
  }
  
  return await response.json();
}

export async function dismountTire(mountingId: string, data: {
  dataDesmontagem: string;
  kmDesmontagem: number;
  motivoDesmontagem?: string;
}) {
  const response = await apiRequest('PUT', `/api/tire-mounting/${mountingId}/dismount`, data);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao desmontar pneu');
  }
  
  return await response.json();
}

// Get tire mounting history by tire ID
export async function getTireMountingHistory(tireId: string) {
  const response = await apiRequest('GET', `/api/tire-mounting/history/${tireId}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao buscar histórico de montagens');
  }
  
  return await response.json();
}

// Get vehicles with mounted tires
export async function getVehiclesWithTires() {
  const response = await apiRequest('GET', '/api/tire-mounting/vehicles');
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao buscar veículos com pneus montados');
  }
  
  return await response.json();
}