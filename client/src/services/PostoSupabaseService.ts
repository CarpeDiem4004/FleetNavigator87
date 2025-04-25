/**
 * Serviço para gerenciar o acesso a tabelas específicas de cada posto no Supabase
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Verifica se as variáveis de ambiente estão definidas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

// Verifica se as variáveis estão definidas
if (!supabaseUrl || (!supabaseAnonKey && !supabaseServiceKey)) {
  console.error('Variáveis de ambiente do Supabase não estão configuradas corretamente');
}

// Interface para definir o formato dos dados de abastecimento
export interface AbastecimentoPosto {
  id?: number;
  placa: string;
  km_atual?: number;
  tipo_combustivel?: string;
  litros: number;
  quantidade_litros?: number; // Alias para compatibilidade
  nome_motorista?: string;
  nome_operador?: string;
  posto?: string;
  project?: string;
  preco_litro?: number;
  valor_total?: number;
  rg_motorista?: string;
  tipo_veiculo?: string;
  created_at?: string;
  updated_at?: string;
}

class PostoSupabaseService {
  private client: SupabaseClient;
  private serviceModeEnabled: boolean;

  constructor() {
    // Inicializa o cliente Supabase, preferindo a service key se disponível
    if (supabaseServiceKey) {
      this.client = createClient(supabaseUrl, supabaseServiceKey);
      this.serviceModeEnabled = true;
      console.log('PostoSupabaseService: Modo de serviço ativado com service key');
    } else {
      this.client = createClient(supabaseUrl, supabaseAnonKey);
      this.serviceModeEnabled = false;
      console.log('PostoSupabaseService: Modo anônimo ativado');
    }
  }

  /**
   * Obtém o nome da tabela específica para um posto
   */
  private getTableName(posto: string): string {
    // Sanitiza o nome do posto para usar como nome de tabela
    const postoSanitizado = posto.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `abastecimentos_posto_${postoSanitizado}`;
  }

  /**
   * Registra um abastecimento na tabela específica do posto
   */
  async registrarAbastecimento(
    posto: string,
    dados: AbastecimentoPosto
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const tableName = this.getTableName(posto);
      console.log(`Registrando abastecimento em ${tableName}`, dados);

      // Adiciona o campo posto se não estiver presente
      const dadosCompletos = {
        ...dados,
        posto: dados.posto || posto,
        created_at: new Date().toISOString(),
      };

      // Insere na tabela específica do posto
      const { data, error } = await this.client
        .from(tableName)
        .insert([dadosCompletos])
        .select();

      if (error) {
        console.error(`Erro ao registrar abastecimento em ${tableName}:`, error);
        return { success: false, error };
      }

      console.log(`Abastecimento registrado com sucesso em ${tableName}:`, data);
      return { success: true, data };
    } catch (error) {
      console.error(`Exceção ao registrar abastecimento para ${posto}:`, error);
      return { success: false, error };
    }
  }

  /**
   * Obtém o histórico de abastecimentos de um posto específico
   */
  async obterHistorico(
    posto: string,
    limite?: number
  ): Promise<{ success: boolean; data?: AbastecimentoPosto[]; error?: any }> {
    try {
      const tableName = this.getTableName(posto);
      console.log(`Obtendo histórico de ${tableName}${limite ? ` (limite: ${limite})` : ''}`);

      // Monta a query base
      let query = this.client
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      // Adiciona limite se especificado
      if (limite) {
        query = query.limit(limite);
      }

      // Executa a query
      const { data, error } = await query;

      if (error) {
        console.error(`Erro ao obter histórico de ${tableName}:`, error);
        return { success: false, error };
      }

      console.log(`Histórico obtido com sucesso de ${tableName}: ${data?.length} registros`);
      return { success: true, data: data as AbastecimentoPosto[] };
    } catch (error) {
      console.error(`Exceção ao obter histórico para ${posto}:`, error);
      return { success: false, error };
    }
  }

  /**
   * Verifica se a tabela de um posto específico existe
   */
  async verificarTabelaPosto(posto: string): Promise<boolean> {
    try {
      const tableName = this.getTableName(posto);
      
      // Tenta fazer uma consulta simples para verificar se a tabela existe
      const { data, error } = await this.client
        .from(tableName)
        .select('id')
        .limit(1);
      
      if (error && error.code === '42P01') {
        // Código de erro "undefined_table" no PostgreSQL
        console.log(`Tabela ${tableName} não existe`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Erro ao verificar tabela para ${posto}:`, error);
      return false;
    }
  }

  /**
   * Verifica se o serviço está no modo de serviço (com service key)
   */
  isInServiceMode(): boolean {
    return this.serviceModeEnabled;
  }

  /**
   * Obtém o cliente Supabase para operações personalizadas
   */
  getClient(): SupabaseClient {
    return this.client;
  }
}

// Exporta uma instância única do serviço
export const postoSupabaseService = new PostoSupabaseService();