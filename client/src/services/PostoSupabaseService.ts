import { Session } from '@supabase/supabase-js'
import { formatarNomePosto } from '@/utils/posto-utils'

/**
 * Serviço para gerenciar dados de postos no Supabase
 * Usa tabelas específicas para cada posto para maior organização e compatibilidade
 */
export class PostoSupabaseService {
  private static instance: PostoSupabaseService
  private apiUrl: string

  private constructor() {
    this.apiUrl = '/api'
  }

  /**
   * Obtém a instância única do serviço (padrão Singleton)
   */
  public static getInstance(): PostoSupabaseService {
    if (!PostoSupabaseService.instance) {
      PostoSupabaseService.instance = new PostoSupabaseService()
    }
    return PostoSupabaseService.instance
  }

  /**
   * Normaliza o nome do posto para o formato usado nas tabelas
   * @param posto Nome do posto
   * @returns Nome normalizado para uso em nome de tabela
   */
  private normalizarNomePosto(posto: string): string {
    return formatarNomePosto(posto).toLowerCase().replace(/[^a-z0-9]/g, '')
  }

  /**
   * Formata o nome da tabela para um posto específico
   * @param posto Nome do posto
   * @returns Nome da tabela formatado
   */
  private formatarNomeTabela(posto: string): string {
    return `abastecimentos_posto_${this.normalizarNomePosto(posto)}`
  }

  /**
   * Busca o histórico de abastecimentos de um posto específico
   * @param posto Nome do posto
   * @param limit Limite de registros (opcional)
   * @param session Sessão do usuário para autenticação (opcional)
   * @returns Promise com os dados de abastecimentos
   */
  async buscarHistoricoAbastecimentos(
    posto: string,
    limit?: number,
    session?: Session | null
  ): Promise<any[]> {
    try {
      const timestamp = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      const url = `${this.apiUrl}/historico-abastecimentos-supabase/${this.normalizarNomePosto(posto)}?timestamp=${timestamp}`
      
      // Configuração da requisição
      const requestOptions: RequestInit = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }

      // Adicionar token de autenticação se disponível
      if (session?.access_token) {
        requestOptions.headers = {
          ...requestOptions.headers,
          'Authorization': `Bearer ${session.access_token}`
        }
      }

      const response = await fetch(url, requestOptions)
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar histórico: ${response.status}`)
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Erro ao buscar histórico de abastecimentos:', error)
      return []
    }
  }

  /**
   * Registra um novo abastecimento na tabela específica do posto
   * @param posto Nome do posto
   * @param dadosAbastecimento Dados do abastecimento a registrar
   * @param session Sessão do usuário para autenticação (opcional)
   * @returns Promise com o resultado da operação
   */
  async registrarAbastecimento(
    posto: string,
    dadosAbastecimento: any,
    session?: Session | null
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Preparar dados do abastecimento com normalização de campos
      const dadosNormalizados = this.normalizarCamposAbastecimento(dadosAbastecimento, posto)
      
      const url = `${this.apiUrl}/registrar-abastecimento-supabase/${this.normalizarNomePosto(posto)}`
      
      // Configuração da requisição
      const requestOptions: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosNormalizados)
      }

      // Adicionar token de autenticação se disponível
      if (session?.access_token) {
        requestOptions.headers = {
          ...requestOptions.headers,
          'Authorization': `Bearer ${session.access_token}`
        }
      }

      const response = await fetch(url, requestOptions)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erro ao registrar abastecimento: ${response.status}`)
      }

      const data = await response.json()
      return { success: true, data: data.data }
    } catch (error) {
      console.error('Erro ao registrar abastecimento:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
    }
  }

  /**
   * Normaliza os campos do abastecimento para compatibilidade com diferentes formatos
   * @param dados Dados originais do abastecimento
   * @param posto Nome do posto para contextualização
   * @returns Dados normalizados
   */
  private normalizarCamposAbastecimento(dados: any, posto: string): any {
    // Clonar o objeto para não modificar o original
    const normalizado: any = { ...dados }
    
    // Garantir que o campo posto esteja preenchido
    normalizado.posto = normalizado.posto || posto
    
    // Normalização de campos de quantidade
    if (normalizado.quantidade && !normalizado.litros && !normalizado.quantidade_litros && !normalizado.quantity_litros) {
      normalizado.quantidade_litros = normalizado.quantidade
    }
    
    // Normalização de campos de hodômetro
    if (normalizado.km && !normalizado.km_atual && !normalizado.hodometro_atual) {
      normalizado.km_atual = normalizado.km
    }
    
    // Normalização de campos de motorista
    if (normalizado.motorista && !normalizado.nome_motorista && !normalizado.motorista_nome) {
      normalizado.motorista_nome = normalizado.motorista
    }
    
    // Normalização de RG
    if (normalizado.rg && !normalizado.rg_motorista && !normalizado.motorista_rg) {
      normalizado.rg_motorista = normalizado.rg
    }
    
    // Normalização de campos de preço
    if (normalizado.preco && !normalizado.preco_litro && !normalizado.valor_litro) {
      normalizado.valor_litro = normalizado.preco
    }
    
    // Data de registro padrão
    if (!normalizado.data_registro) {
      normalizado.data_registro = new Date()
    }
    
    return normalizado
  }

  /**
   * Busca estatísticas de consumo mensal para um posto
   * @param posto Nome do posto
   * @param session Sessão do usuário para autenticação (opcional)
   * @returns Promise com os dados de estatísticas
   */
  async buscarEstatisticasMensais(
    posto: string,
    session?: Session | null
  ): Promise<any[]> {
    try {
      const url = `${this.apiUrl}/estatisticas-mensais-supabase/${this.normalizarNomePosto(posto)}`
      
      // Configuração da requisição
      const requestOptions: RequestInit = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }

      // Adicionar token de autenticação se disponível
      if (session?.access_token) {
        requestOptions.headers = {
          ...requestOptions.headers,
          'Authorization': `Bearer ${session.access_token}`
        }
      }

      const response = await fetch(url, requestOptions)
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar estatísticas: ${response.status}`)
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Erro ao buscar estatísticas mensais:', error)
      return []
    }
  }

  /**
   * Busca o histórico de alterações de um abastecimento específico
   * @param posto Nome do posto
   * @param abastecimentoId ID do abastecimento
   * @param session Sessão do usuário para autenticação (opcional)
   * @returns Promise com o histórico de alterações
   */
  async buscarHistoricoAlteracoes(
    posto: string,
    abastecimentoId: number,
    session?: Session | null
  ): Promise<any[]> {
    try {
      const url = `${this.apiUrl}/historico-alteracoes-supabase/${this.normalizarNomePosto(posto)}/${abastecimentoId}`
      
      // Configuração da requisição
      const requestOptions: RequestInit = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }

      // Adicionar token de autenticação se disponível
      if (session?.access_token) {
        requestOptions.headers = {
          ...requestOptions.headers,
          'Authorization': `Bearer ${session.access_token}`
        }
      }

      const response = await fetch(url, requestOptions)
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar histórico de alterações: ${response.status}`)
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Erro ao buscar histórico de alterações:', error)
      return []
    }
  }

  /**
   * Busca resumo de abastecimentos de todos os postos
   * @param dias Número de dias para o resumo (padrão: 30)
   * @param session Sessão do usuário para autenticação (opcional)
   * @returns Promise com os dados de resumo de todos os postos
   */
  async buscarResumoTodosPosto(
    dias: number = 30,
    session?: Session | null
  ): Promise<any[]> {
    try {
      const url = `${this.apiUrl}/resumo-todos-postos-supabase?dias=${dias}`
      
      // Configuração da requisição
      const requestOptions: RequestInit = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }

      // Adicionar token de autenticação se disponível
      if (session?.access_token) {
        requestOptions.headers = {
          ...requestOptions.headers,
          'Authorization': `Bearer ${session.access_token}`
        }
      }

      const response = await fetch(url, requestOptions)
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar resumo de postos: ${response.status}`)
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Erro ao buscar resumo de todos os postos:', error)
      return []
    }
  }
}

// Exporta uma instância única do serviço
export default PostoSupabaseService.getInstance()