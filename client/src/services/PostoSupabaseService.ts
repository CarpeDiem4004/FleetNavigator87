/**
 * Serviço para interação com as tabelas específicas de postos no Supabase
 */

import axios from 'axios';
import { 
  formatarNomePosto, 
  formatarNomeTabela, 
  isPostoValido,
  obterNomeViewConsolidada,
  obterNomeViewConsumoPorVeiculo,
  obterNomeViewConsumoMensal,
  obterNomeViewComparativoCombustiveis,
  obterNomeViewUltimosAbastecimentos
} from '../utils/posto-utils';

/**
 * Interface para dados de abastecimento
 */
export interface AbastecimentoData {
  id?: number;
  placa: string;
  hodometro_atual?: number;
  km_atual?: number;
  tipo_combustivel?: string;
  litros?: number;
  quantidade_litros?: number;
  quantity_litros?: number;
  motorista?: string;
  nome_motorista?: string;
  motorista_nome?: string;
  motorista_rg?: string;
  rg_motorista?: string;
  operador?: string;
  nome_operador?: string;
  valor_litro?: number;
  preco_litro?: number;
  valor_total: number;
  posto?: string;
  tipo_veiculo?: string;
  observacoes?: string;
  lavagem?: boolean;
  tipo_lavagem?: string;
  project?: string;
  data_registro?: Date;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Interface para dados estatísticos
 */
export interface EstatisticaData {
  mes?: Date;
  mes_ano?: string;
  tipo_combustivel: string;
  total_abastecimentos: number;
  total_veiculos?: number;
  total_litros: number;
  media_litros_por_abastecimento?: number;
  valor_total: number;
  preco_medio_litro?: number;
}

/**
 * Interface para dados de consumo por veículo
 */
export interface ConsumoPorVeiculoData {
  placa: string;
  total_abastecimentos: number;
  total_litros: number;
  valor_total: number;
  ultimo_km?: number;
  primeiro_km?: number;
  km_percorridos?: number;
  consumo_medio_100km?: number;
  primeiro_abastecimento?: Date;
  ultimo_abastecimento?: Date;
}

/**
 * Classe de serviço para acesso aos dados de postos no Supabase
 */
class PostoSupabaseService {
  /**
   * Obtém abastecimentos para um posto específico
   * 
   * @param posto Nome do posto
   * @returns Dados de abastecimentos
   */
  async obterAbastecimentos(posto: string): Promise<AbastecimentoData[]> {
    try {
      if (!isPostoValido(posto)) {
        throw new Error(`Posto inválido: ${posto}`);
      }
      
      const postoFormatado = formatarNomePosto(posto);
      const response = await axios.get(`/api/posto/${postoFormatado}/abastecimentos`);
      
      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Erro ao obter abastecimentos');
      }
    } catch (error) {
      console.error(`Erro ao obter abastecimentos para posto ${posto}:`, error);
      throw error;
    }
  }
  
  /**
   * Obtém estatísticas mensais para um posto específico
   * 
   * @param posto Nome do posto
   * @returns Dados estatísticos mensais
   */
  async obterEstatisticasMensais(posto: string): Promise<EstatisticaData[]> {
    try {
      if (!isPostoValido(posto)) {
        throw new Error(`Posto inválido: ${posto}`);
      }
      
      const postoFormatado = formatarNomePosto(posto);
      const response = await axios.get(`/api/posto/${postoFormatado}/estatisticas-mensais`);
      
      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Erro ao obter estatísticas mensais');
      }
    } catch (error) {
      console.error(`Erro ao obter estatísticas mensais para posto ${posto}:`, error);
      throw error;
    }
  }
  
  /**
   * Obtém consumo por veículo para um posto específico
   * 
   * @param posto Nome do posto
   * @returns Dados de consumo por veículo
   */
  async obterConsumoPorVeiculo(posto: string): Promise<ConsumoPorVeiculoData[]> {
    try {
      if (!isPostoValido(posto)) {
        throw new Error(`Posto inválido: ${posto}`);
      }
      
      const postoFormatado = formatarNomePosto(posto);
      const response = await axios.get(`/api/posto/${postoFormatado}/consumo-por-veiculo`);
      
      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Erro ao obter consumo por veículo');
      }
    } catch (error) {
      console.error(`Erro ao obter consumo por veículo para posto ${posto}:`, error);
      throw error;
    }
  }
  
  /**
   * Obtém consumo mensal para um posto específico
   * 
   * @param posto Nome do posto
   * @returns Dados de consumo mensal
   */
  async obterConsumoMensal(posto: string): Promise<any[]> {
    try {
      if (!isPostoValido(posto)) {
        throw new Error(`Posto inválido: ${posto}`);
      }
      
      const postoFormatado = formatarNomePosto(posto);
      const response = await axios.get(`/api/posto/${postoFormatado}/consumo-mensal`);
      
      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Erro ao obter consumo mensal');
      }
    } catch (error) {
      console.error(`Erro ao obter consumo mensal para posto ${posto}:`, error);
      throw error;
    }
  }
  
  /**
   * Obtém comparativo de combustíveis para um posto específico
   * 
   * @param posto Nome do posto
   * @returns Dados de comparativo de combustíveis
   */
  async obterComparativoCombustiveis(posto: string): Promise<any[]> {
    try {
      if (!isPostoValido(posto)) {
        throw new Error(`Posto inválido: ${posto}`);
      }
      
      const postoFormatado = formatarNomePosto(posto);
      const response = await axios.get(`/api/posto/${postoFormatado}/comparativo-combustiveis`);
      
      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Erro ao obter comparativo de combustíveis');
      }
    } catch (error) {
      console.error(`Erro ao obter comparativo de combustíveis para posto ${posto}:`, error);
      throw error;
    }
  }
  
  /**
   * Obtém dados agregados para relatórios para um posto específico
   * 
   * @param posto Nome do posto
   * @returns Dados agregados para relatórios
   */
  async obterDadosRelatorios(posto: string): Promise<any[]> {
    try {
      if (!isPostoValido(posto)) {
        throw new Error(`Posto inválido: ${posto}`);
      }
      
      const postoFormatado = formatarNomePosto(posto);
      const response = await axios.get(`/api/posto/${postoFormatado}/relatorios`);
      
      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Erro ao obter dados para relatórios');
      }
    } catch (error) {
      console.error(`Erro ao obter dados para relatórios para posto ${posto}:`, error);
      throw error;
    }
  }
  
  /**
   * Obtém últimos abastecimentos para um posto específico
   * 
   * @param posto Nome do posto
   * @returns Dados dos últimos abastecimentos
   */
  async obterUltimosAbastecimentos(posto: string): Promise<AbastecimentoData[]> {
    try {
      if (!isPostoValido(posto)) {
        throw new Error(`Posto inválido: ${posto}`);
      }
      
      const postoFormatado = formatarNomePosto(posto);
      const response = await axios.get(`/api/posto/${postoFormatado}/ultimos-abastecimentos`);
      
      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Erro ao obter últimos abastecimentos');
      }
    } catch (error) {
      console.error(`Erro ao obter últimos abastecimentos para posto ${posto}:`, error);
      throw error;
    }
  }
  
  /**
   * Registra um novo abastecimento para um posto específico
   * 
   * @param posto Nome do posto
   * @param dados Dados do abastecimento
   * @returns Dados do abastecimento registrado
   */
  async registrarAbastecimento(posto: string, dados: AbastecimentoData): Promise<AbastecimentoData> {
    try {
      if (!isPostoValido(posto)) {
        throw new Error(`Posto inválido: ${posto}`);
      }
      
      // Verificar campos obrigatórios
      if (!dados.placa) {
        throw new Error("O campo 'placa' é obrigatório");
      }
      
      if (!dados.valor_total || dados.valor_total <= 0) {
        throw new Error("O campo 'valor_total' é obrigatório e deve ser maior que zero");
      }
      
      const postoFormatado = formatarNomePosto(posto);
      const response = await axios.post(`/api/posto/${postoFormatado}/abastecimento`, dados);
      
      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Erro ao registrar abastecimento');
      }
    } catch (error) {
      console.error(`Erro ao registrar abastecimento para posto ${posto}:`, error);
      throw error;
    }
  }
}

// Exportar uma instância única do serviço
export const postoSupabaseService = new PostoSupabaseService();