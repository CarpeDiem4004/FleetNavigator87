import { apiRequest } from "@/lib/queryClient";

// Interface para o modelo de movimentação de pneus
export interface TireMovement {
  id?: number;
  id_pneu: number;
  id_veiculo?: string; // Usando a placa como identificador
  tipo_movimentacao: 'montagem' | 'remocao' | 'descarte' | 'manutencao';
  km: number;
  data?: string;
  local?: string;
  responsavel?: string;
  possui_estepe?: boolean;
  motivo?: string;
  distancia_percorrida?: number;
}

// Obter todas as movimentações de pneus
export async function getAllTireMovements() {
  const response = await apiRequest('GET', '/api/movimentacao-pneu');
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao buscar movimentações de pneus');
  }
  
  const data = await response.json();
  return data;
}

// Obter movimentações por ID do pneu
export async function getTireMovementsByTireId(tireId: number) {
  const response = await apiRequest('GET', `/api/movimentacao-pneu/pneu/${tireId}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erro ao buscar movimentações do pneu ID ${tireId}`);
  }
  
  const data = await response.json();
  return data;
}

// Obter movimentações por veículo (placa)
export async function getTireMovementsByVehicle(vehiclePlate: string) {
  const response = await apiRequest('GET', `/api/movimentacao-pneu/veiculo/${vehiclePlate}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erro ao buscar movimentações do veículo ${vehiclePlate}`);
  }
  
  const data = await response.json();
  return data;
}

// Registrar nova movimentação de pneu
export async function createTireMovement(movement: TireMovement) {
  const response = await apiRequest('POST', '/api/movimentacao-pneu', movement);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao registrar movimentação de pneu');
  }
  
  const data = await response.json();
  return data;
}

// Atualizar movimentação de pneu
export async function updateTireMovement(id: number, movement: Partial<TireMovement>) {
  const response = await apiRequest('PUT', `/api/movimentacao-pneu/${id}`, movement);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erro ao atualizar movimentação de pneu ID ${id}`);
  }
  
  const data = await response.json();
  return data;
}

// Excluir movimentação de pneu
export async function deleteTireMovement(id: number) {
  const response = await apiRequest('DELETE', `/api/movimentacao-pneu/${id}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erro ao excluir movimentação de pneu ID ${id}`);
  }
  
  const data = await response.json();
  return data;
}