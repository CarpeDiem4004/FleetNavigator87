// Definindo tipos para estações de combustível

export interface FuelStation {
  id: number;
  nome: string;
  endereco: string;
  telefone: string;
  responsavel: string;
  status: string;
  capacidade_total: number;
  volume_atual: number;
  ultima_medicao: string;
  tipo: 'próprio' | 'parceiro';
  latitude: number;
  longitude: number;
}

export interface StationTank {
  id: number;
  posto_id: number;
  tipo_combustivel: string;
  capacidade: number;
  nivel_atual: number;
  ultima_medicao: string;
  status: 'operacional' | 'em_manutenção' | 'inativo';
}

export interface FuelSupply {
  id: number;
  posto_id: number;
  veiculo_placa: string;
  quantidade: number;
  tipo_combustivel: string;
  valor: number;
  km_veiculo: number;
  motorista: string;
  data_abastecimento: string;
  tanque_id?: number;
  cartao_id?: number;
}