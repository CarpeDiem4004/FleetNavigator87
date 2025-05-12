/**
 * Serviço para gerenciamento de manutenções com persistência resiliente
 * Garante que todos os dados de manutenções sejam persistidos no Supabase
 */

import { universalPersistenceService } from '../api/universalPersistenceService';

// Módulo para identificação no sistema de persistência
const MODULE_NAME = 'manutencao';

// Tabelas relacionadas a manutenções
const TABLES = {
  MANUTENCOES: 'manutencoes',
  MANUTENCOES_ITENS: 'manutencoes_itens',
  MANUTENCOES_HISTORICO: 'manutencoes_historico',
  MANUTENCOES_ANEXOS: 'manutencoes_anexos',
  SOLICITACOES_MANUTENCAO: 'solicitacoes_manutencao',
  OFICINA_MURICI_MANUTENCOES: 'oficina_murici_manutencoes'
};

/**
 * Classe principal de serviço de manutenções
 */
class ManutencaoService {
  /**
   * Verifica o status da conexão
   */
  async checkConnection(): Promise<boolean> {
    return await universalPersistenceService.checkConnection();
  }

  /**
   * Busca todas as manutenções com opção de filtros
   */
  async getManutencoes(filtros: Record<string, any> = {}, limit: number = 100): Promise<any[]> {
    try {
      const manutencoes = await universalPersistenceService.fetch(
        TABLES.MANUTENCOES,
        {
          filter: filtros,
          limit,
          order: { column: 'created_at', ascending: false }
        }
      ) as any[];

      return manutencoes;
    } catch (error) {
      console.error('[ManutencaoService] Erro ao buscar manutenções:', error);
      return [];
    }
  }

  /**
   * Busca manutenções da oficina Murici
   */
  async getManutencoesOficinaMurici(filtros: Record<string, any> = {}, limit: number = 100): Promise<any[]> {
    try {
      const manutencoes = await universalPersistenceService.fetch(
        TABLES.OFICINA_MURICI_MANUTENCOES,
        {
          filter: filtros,
          limit,
          order: { column: 'created_at', ascending: false }
        }
      ) as any[];

      return manutencoes;
    } catch (error) {
      console.error('[ManutencaoService] Erro ao buscar manutenções da oficina Murici:', error);
      return [];
    }
  }

  /**
   * Busca manutenções por veículo
   */
  async getManutencoesVeiculo(placa: string): Promise<any[]> {
    return this.getManutencoes({ placa });
  }

  /**
   * Busca manutenções por base
   */
  async getManutencoesPorBase(baseId: number): Promise<any[]> {
    return this.getManutencoes({ base_id: baseId });
  }

  /**
   * Busca manutenções por status
   */
  async getManutencoesPorStatus(status: string): Promise<any[]> {
    return this.getManutencoes({ status });
  }

  /**
   * Registra uma nova manutenção
   */
  async registrarManutencao(dados: any): Promise<any> {
    try {
      const agora = new Date().toISOString();
      
      // Adicionar campos de controle
      const dadosCompletos = {
        ...dados,
        status: dados.status || 'pendente',
        created_at: agora,
        updated_at: agora
      };

      // Persistir com garantia de salvamento
      const manutencao = await universalPersistenceService.insert(
        MODULE_NAME,
        TABLES.MANUTENCOES,
        dadosCompletos
      );

      // Registrar no histórico
      await this.registrarHistorico(manutencao.id, 'criacao', 'Manutenção registrada no sistema');

      return manutencao;
    } catch (error) {
      console.error('[ManutencaoService] Erro ao registrar manutenção:', error);
      throw error;
    }
  }

  /**
   * Registra uma nova manutenção na oficina Murici
   */
  async registrarManutencaoOficinaMurici(dados: any): Promise<any> {
    try {
      const agora = new Date().toISOString();
      
      // Adicionar campos de controle
      const dadosCompletos = {
        ...dados,
        status: dados.status || 'pendente',
        data_hora_inicio: agora,
        created_at: agora,
        updated_at: agora
      };

      // Persistir com garantia de salvamento
      const manutencao = await universalPersistenceService.insert(
        MODULE_NAME,
        TABLES.OFICINA_MURICI_MANUTENCOES,
        dadosCompletos
      );

      return manutencao;
    } catch (error) {
      console.error('[ManutencaoService] Erro ao registrar manutenção na oficina Murici:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma manutenção existente
   */
  async atualizarManutencao(id: number, dados: any): Promise<any> {
    try {
      // Adicionar timestamp de atualização
      const dadosAtualizados = {
        ...dados,
        updated_at: new Date().toISOString()
      };

      // Persistir com garantia de salvamento
      const manutencao = await universalPersistenceService.update(
        MODULE_NAME,
        TABLES.MANUTENCOES,
        dadosAtualizados,
        { id }
      );

      // Registrar no histórico se houve mudança de status
      if (dados.status) {
        await this.registrarHistorico(
          id, 
          'atualizacao_status',
          `Status atualizado para: ${dados.status}`
        );
      }

      return manutencao;
    } catch (error) {
      console.error('[ManutencaoService] Erro ao atualizar manutenção:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma manutenção na oficina Murici
   */
  async atualizarManutencaoOficinaMurici(id: number, dados: any): Promise<any> {
    try {
      // Adicionar timestamp de atualização
      const dadosAtualizados = {
        ...dados,
        updated_at: new Date().toISOString()
      };

      // Se o status for finalizado, adicionar data de finalização
      if (dados.status === 'finalizado' && !dados.data_hora_fim) {
        dadosAtualizados.data_hora_fim = new Date().toISOString();
      }

      // Persistir com garantia de salvamento
      const manutencao = await universalPersistenceService.update(
        MODULE_NAME,
        TABLES.OFICINA_MURICI_MANUTENCOES,
        dadosAtualizados,
        { id }
      );

      return manutencao;
    } catch (error) {
      console.error('[ManutencaoService] Erro ao atualizar manutenção na oficina Murici:', error);
      throw error;
    }
  }

  /**
   * Atualiza o status de uma manutenção
   */
  async atualizarStatus(id: number, status: string, observacao?: string): Promise<any> {
    try {
      // Persistir atualização de status com garantia de salvamento
      const manutencao = await universalPersistenceService.update(
        MODULE_NAME,
        TABLES.MANUTENCOES,
        {
          status,
          updated_at: new Date().toISOString()
        },
        { id }
      );

      // Registrar no histórico
      await this.registrarHistorico(
        id, 
        'atualizacao_status',
        observacao || `Status atualizado para: ${status}`
      );

      return manutencao;
    } catch (error) {
      console.error('[ManutencaoService] Erro ao atualizar status da manutenção:', error);
      throw error;
    }
  }

  /**
   * Adiciona um item à manutenção
   */
  async adicionarItem(
    manutencaoId: number, 
    nome: string, 
    quantidade: number, 
    valorUnitario: number,
    observacao?: string
  ): Promise<any> {
    try {
      const agora = new Date().toISOString();
      
      // Calcular valor total
      const valorTotal = quantidade * valorUnitario;
      
      // Criar registro de item
      const item = await universalPersistenceService.insert(
        MODULE_NAME,
        TABLES.MANUTENCOES_ITENS,
        {
          manutencao_id: manutencaoId,
          nome,
          quantidade,
          valor_unitario: valorUnitario,
          valor_total: valorTotal,
          observacao,
          created_at: agora
        }
      );

      // Registrar no histórico
      await this.registrarHistorico(
        manutencaoId, 
        'item_adicionado',
        `Item adicionado: ${nome} (${quantidade} un.)`
      );

      return item;
    } catch (error) {
      console.error('[ManutencaoService] Erro ao adicionar item à manutenção:', error);
      throw error;
    }
  }

  /**
   * Adiciona um anexo à manutenção
   */
  async adicionarAnexo(
    manutencaoId: number, 
    tipo: string, 
    url: string, 
    descricao?: string
  ): Promise<any> {
    try {
      const agora = new Date().toISOString();
      
      // Criar registro de anexo
      const anexo = await universalPersistenceService.insert(
        MODULE_NAME,
        TABLES.MANUTENCOES_ANEXOS,
        {
          manutencao_id: manutencaoId,
          tipo,
          url,
          descricao,
          created_at: agora
        }
      );

      // Registrar no histórico
      await this.registrarHistorico(
        manutencaoId, 
        'anexo_adicionado',
        `Anexo do tipo ${tipo} adicionado`
      );

      return anexo;
    } catch (error) {
      console.error('[ManutencaoService] Erro ao adicionar anexo à manutenção:', error);
      throw error;
    }
  }

  /**
   * Registra uma solicitação de manutenção
   */
  async registrarSolicitacao(dados: any): Promise<any> {
    try {
      const agora = new Date().toISOString();
      
      // Adicionar campos de controle
      const dadosCompletos = {
        ...dados,
        status: dados.status || 'pendente',
        created_at: agora,
        updated_at: agora
      };

      // Persistir com garantia de salvamento
      return await universalPersistenceService.insert(
        MODULE_NAME,
        TABLES.SOLICITACOES_MANUTENCAO,
        dadosCompletos
      );
    } catch (error) {
      console.error('[ManutencaoService] Erro ao registrar solicitação de manutenção:', error);
      throw error;
    }
  }

  /**
   * Busca solicitações de manutenção
   */
  async getSolicitacoes(filtros: Record<string, any> = {}, limit: number = 100): Promise<any[]> {
    try {
      const solicitacoes = await universalPersistenceService.fetch(
        TABLES.SOLICITACOES_MANUTENCAO,
        {
          filter: filtros,
          limit,
          order: { column: 'created_at', ascending: false }
        }
      ) as any[];

      return solicitacoes;
    } catch (error) {
      console.error('[ManutencaoService] Erro ao buscar solicitações de manutenção:', error);
      return [];
    }
  }

  /**
   * Atualiza uma solicitação de manutenção
   */
  async atualizarSolicitacao(id: number, dados: any): Promise<any> {
    try {
      // Adicionar timestamp de atualização
      const dadosAtualizados = {
        ...dados,
        updated_at: new Date().toISOString()
      };

      // Persistir com garantia de salvamento
      return await universalPersistenceService.update(
        MODULE_NAME,
        TABLES.SOLICITACOES_MANUTENCAO,
        dadosAtualizados,
        { id }
      );
    } catch (error) {
      console.error('[ManutencaoService] Erro ao atualizar solicitação de manutenção:', error);
      throw error;
    }
  }

  /**
   * Registra etapa no histórico da manutenção
   */
  async registrarHistorico(
    manutencaoId: number, 
    tipo: string, 
    descricao: string
  ): Promise<any> {
    try {
      const agora = new Date().toISOString();
      
      // Criar registro de histórico
      return await universalPersistenceService.insert(
        MODULE_NAME,
        TABLES.MANUTENCOES_HISTORICO,
        {
          manutencao_id: manutencaoId,
          tipo,
          descricao,
          created_at: agora,
          usuario_id: null // TODO: Adicionar usuário quando disponível
        }
      );
    } catch (error) {
      console.error('[ManutencaoService] Erro ao registrar histórico:', error);
      // Não propagar erro para não impedir operações principais
      return null;
    }
  }

  /**
   * Busca o histórico de uma manutenção
   */
  async getHistorico(manutencaoId: number): Promise<any[]> {
    try {
      return await universalPersistenceService.fetch(
        TABLES.MANUTENCOES_HISTORICO,
        {
          filter: { manutencao_id: manutencaoId },
          order: { column: 'created_at', ascending: false }
        }
      ) as any[];
    } catch (error) {
      console.error('[ManutencaoService] Erro ao buscar histórico:', error);
      return [];
    }
  }

  /**
   * Exclui uma manutenção e todos os seus registros relacionados
   * Obs: Na maioria dos casos, é preferível inativar ao invés de excluir
   */
  async excluirManutencao(id: number): Promise<boolean> {
    try {
      // Excluir registros relacionados
      await universalPersistenceService.delete(
        MODULE_NAME,
        TABLES.MANUTENCOES_ITENS,
        { manutencao_id: id }
      );

      await universalPersistenceService.delete(
        MODULE_NAME,
        TABLES.MANUTENCOES_ANEXOS,
        { manutencao_id: id }
      );

      await universalPersistenceService.delete(
        MODULE_NAME,
        TABLES.MANUTENCOES_HISTORICO,
        { manutencao_id: id }
      );

      // Excluir a manutenção
      await universalPersistenceService.delete(
        MODULE_NAME,
        TABLES.MANUTENCOES,
        { id }
      );

      return true;
    } catch (error) {
      console.error('[ManutencaoService] Erro ao excluir manutenção:', error);
      throw error;
    }
  }
}

// Exportar instância única do serviço
export const manutencaoService = new ManutencaoService();

// Exportar como default para compatibilidade
export default manutencaoService;