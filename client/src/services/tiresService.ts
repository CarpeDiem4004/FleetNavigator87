import { apiRequest } from "@/lib/queryClient";

// Interface para o modelo de pneus
export interface Tire {
  id?: number;
  codigo: string;
  marca: string;
  modelo: string;
  medida: string;
  aro?: string;
  tipo?: string;
  origem?: string;
  data_aquisicao?: string;
  veiculo_placa?: string | null;
  posicao?: string | null;
  km_inicial?: number;
  km_atual?: number;
  profundidade_sulco?: number;
  localizacao?: string;
  status?: string;
  observacao?: string;
  tem_estepe?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Obter todos os pneus
export async function getAllTires(filters?: { localizacao?: string, status?: string }) {
  let url = '/api/pneus';
  const queryParams = [];
  
  if (filters?.localizacao) {
    queryParams.push(`localizacao=${encodeURIComponent(filters.localizacao)}`);
  }
  
  if (filters?.status) {
    queryParams.push(`status=${encodeURIComponent(filters.status)}`);
  }
  
  if (queryParams.length > 0) {
    url += `?${queryParams.join('&')}`;
  }
  
  const response = await apiRequest('GET', url);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao buscar pneus');
  }
  
  const data = await response.json();
  return data;
}

// Obter um pneu pelo ID
export async function getTireById(id: number) {
  const response = await apiRequest('GET', `/api/pneus/${id}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erro ao buscar pneu com ID ${id}`);
  }
  
  const data = await response.json();
  return data;
}

// Cadastrar um novo pneu
export async function createTire(tire: Tire) {
  const response = await apiRequest('POST', '/api/pneus', tire);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao cadastrar novo pneu');
  }
  
  const data = await response.json();
  return data;
}

// Atualizar um pneu existente
export async function updateTire(id: number, tire: Partial<Tire>) {
  const response = await apiRequest('PUT', `/api/pneus/${id}`, tire);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erro ao atualizar pneu com ID ${id}`);
  }
  
  const data = await response.json();
  return data;
}

// Excluir um pneu
export async function deleteTire(id: number) {
  const response = await apiRequest('DELETE', `/api/pneus/${id}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erro ao excluir pneu com ID ${id}`);
  }
  
  const data = await response.json();
  return data;
}

// Cadastrar pneus em lote
export async function createTiresBatch(tires: Tire[]) {
  const promises = tires.map(tire => createTire(tire));
  return Promise.all(promises);
}