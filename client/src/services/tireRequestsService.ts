import { api } from './api';

export interface TireRequest {
  id?: number;
  base_id: number;
  base_nome: string;
  usuario_id: number;
  usuario_nome: string;
  placa_veiculo?: string;
  km_veiculo?: number;
  marca?: string;
  modelo?: string;
  medida: string;
  tipo?: string;
  quantidade: number;
  motivo: string;
  status: 'pendente' | 'aprovado' | 'negado' | 'em_analise' | 'concluido';
  data_solicitacao: string;
  data_aprovacao?: string;
  aprovador_id?: number;
  aprovador_nome?: string;
  data_previsao?: string;
  observacoes?: string;
  observacoes_aprovacao?: string;
  origem?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Busca todas as solicitações de pneus
 */
export async function getAllTireRequests(filters?: { base_id?: number, status?: string }) {
  try {
    let url = '/api/solicitacoes-pneus';
    const params = new URLSearchParams();
    
    if (filters?.base_id) {
      params.append('base_id', filters.base_id.toString());
    }
    
    if (filters?.status) {
      params.append('status', filters.status);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return {
      success: true,
      data: response.data && response.data.data ? response.data.data : []
    };
  } catch (error) {
    console.error('Erro ao buscar solicitações de pneus:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Cria uma nova solicitação de pneus
 */
export async function createTireRequest(request: TireRequest) {
  try {
    const response = await api.post('/api/solicitacoes-pneus', request);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Erro ao criar solicitação de pneus:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Atualiza o status de uma solicitação de pneus (aprovar/rejeitar)
 */
export async function updateTireRequestStatus(
  id: number, 
  status: 'aprovado' | 'negado' | 'pendente' | 'em_analise' | 'concluido',
  aprovador_id?: number,
  aprovador_nome?: string
) {
  try {
    const response = await api.put(`/api/solicitacoes-pneus/${id}/status`, {
      status,
      aprovador_id,
      aprovador_nome
    });
    
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Erro ao atualizar status da solicitação de pneus:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Responde a uma solicitação de pneus com data de previsão e observações
 */
export async function respondTireRequest(
  id: number,
  status: 'aprovado' | 'negado' | 'em_analise' | 'concluido',
  data_previsao?: string,
  observacoes_aprovacao?: string,
  aprovador_id?: number,
  aprovador_nome?: string
) {
  try {
    const response = await api.put(`/api/pneus/solicitacoes/${id}/responder`, {
      status,
      data_previsao,
      observacoes_aprovacao,
      aprovador_id,
      aprovador_nome
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Erro ao responder à solicitação de pneus:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}