/**
 * Serviço para gerenciamento de pneus com persistência resiliente
 * Garante que todos os dados de pneus sejam persistidos no Supabase
 */

import { universalPersistenceService } from '../api/universalPersistenceService';

// Módulo para identificação no sistema de persistência
const MODULE_NAME = 'pneus';

// Tabelas relacionadas a pneus
const TABLES = {
  PNEUS: 'pneus',
  PNEUS_HISTORICO: 'pneus_historico',
  PNEUS_MEDICOES: 'pneus_medicoes',
  SOLICITACOES_PNEU: 'solicitacoes_pneu',
  SOLICITACOES_PNEU_ITENS: 'solicitacoes_pneu_itens'
};

/**
 * Classe principal de serviço de pneus
 */
class PneusService {
  /**
   * Verifica o status da conexão
   */
  async checkConnection(): Promise<boolean> {
    return await universalPersistenceService.checkConnection();
  }

  /**
   * Busca todos os pneus com opção de filtros
   */
  async getPneus(filtros: Record<string, any> = {}, limit: number = 500): Promise<any[]> {
    try {
      const pneus = await universalPersistenceService.fetch(
        TABLES.PNEUS,
        {
          filter: filtros,
          limit,
          order: { column: 'created_at', ascending: false }
        }
      ) as any[];

      return pneus;
    } catch (error) {
      console.error('[PneusService] Erro ao buscar pneus:', error);
      return [];
    }
  }

  /**
   * Busca pneus por base
   */
  async getPneusPorBase(baseId: number): Promise<any[]> {
    return this.getPneus({ base_id: baseId });
  }

  /**
   * Busca pneus por veículo
   */
  async getPneusPorVeiculo(placa: string): Promise<any[]> {
    return this.getPneus({ veiculo_placa: placa });
  }

  /**
   * Busca pneus por status
   */
  async getPneusPorStatus(status: string): Promise<any[]> {
    return this.getPneus({ status });
  }

  /**
   * Registra um novo pneu
   */
  async registrarPneu(dados: any): Promise<any> {
    try {
      const agora = new Date().toISOString();
      
      // Adicionar campos de controle
      const dadosCompletos = {
        ...dados,
        status: dados.status || 'disponivel',
        created_at: agora,
        updated_at: agora
      };

      // Persistir com garantia de salvamento
      const pneu = await universalPersistenceService.insert(
        MODULE_NAME,
        TABLES.PNEUS,
        dadosCompletos
      );

      // Registrar no histórico
      await this.registrarHistorico(
        pneu.id, 
        'cadastro', 
        `Pneu cadastrado no sistema: ${dados.codigo || ''} - ${dados.marca} ${dados.modelo}`
      );

      return pneu;
    } catch (error) {
      console.error('[PneusService] Erro ao registrar pneu:', error);
      throw error;
    }
  }

  /**
   * Atualiza um pneu existente
   */
  async atualizarPneu(id: number, dados: any): Promise<any> {
    try {
      // Adicionar timestamp de atualização
      const dadosAtualizados = {
        ...dados,
        updated_at: new Date().toISOString()
      };

      // Persistir com garantia de salvamento
      const pneu = await universalPersistenceService.update(
        MODULE_NAME,
        TABLES.PNEUS,
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

      return pneu;
    } catch (error) {
      console.error('[PneusService] Erro ao atualizar pneu:', error);
      throw error;
    }
  }

  /**
   * Atualiza o status de um pneu
   */
  async atualizarStatus(id: number, status: string, observacao?: string): Promise<any> {
    try {
      // Buscar pneu atual
      const [pneuAtual] = await this.getPneus({ id }) as any[];
      if (!pneuAtual) {
        throw new Error(`Pneu com ID ${id} não encontrado`);
      }

      // Persistir atualização de status com garantia de salvamento
      const pneu = await universalPersistenceService.update(
        MODULE_NAME,
        TABLES.PNEUS,
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
        observacao || `Status atualizado de ${pneuAtual.status} para: ${status}`
      );

      return pneu;
    } catch (error) {
      console.error('[PneusService] Erro ao atualizar status do pneu:', error);
      throw error;
    }
  }

  /**
   * Associa um pneu a um veículo
   */
  async associarVeiculo(
    id: number, 
    veiculoPlaca: string, 
    posicao: string,
    observacao?: string
  ): Promise<any> {
    try {
      // Buscar pneu atual
      const [pneuAtual] = await this.getPneus({ id }) as any[];
      if (!pneuAtual) {
        throw new Error(`Pneu com ID ${id} não encontrado`);
      }

      // Persistir associação com garantia de salvamento
      const pneu = await universalPersistenceService.update(
        MODULE_NAME,
        TABLES.PNEUS,
        {
          veiculo_placa: veiculoPlaca,
          posicao,
          status: 'em_uso',
          updated_at: new Date().toISOString()
        },
        { id }
      );

      // Registrar no histórico
      await this.registrarHistorico(
        id, 
        'associacao_veiculo',
        observacao || `Pneu associado ao veículo ${veiculoPlaca} na posição ${posicao}`
      );

      return pneu;
    } catch (error) {
      console.error('[PneusService] Erro ao associar pneu a veículo:', error);
      throw error;
    }
  }

  /**
   * Desassocia um pneu de um veículo
   */
  async desassociarVeiculo(
    id: number, 
    motivo: string,
    observacao?: string
  ): Promise<any> {
    try {
      // Buscar pneu atual
      const [pneuAtual] = await this.getPneus({ id }) as any[];
      if (!pneuAtual) {
        throw new Error(`Pneu com ID ${id} não encontrado`);
      }

      const veiculoAnterior = pneuAtual.veiculo_placa;
      const posicaoAnterior = pneuAtual.posicao;

      // Persistir desassociação com garantia de salvamento
      const pneu = await universalPersistenceService.update(
        MODULE_NAME,
        TABLES.PNEUS,
        {
          veiculo_placa: null,
          posicao: null,
          status: 'disponivel',
          updated_at: new Date().toISOString()
        },
        { id }
      );

      // Registrar no histórico
      await this.registrarHistorico(
        id, 
        'desassociacao_veiculo',
        observacao || `Pneu removido do veículo ${veiculoAnterior} (posição ${posicaoAnterior}). Motivo: ${motivo}`
      );

      return pneu;
    } catch (error) {
      console.error('[PneusService] Erro ao desassociar pneu de veículo:', error);
      throw error;
    }
  }

  /**
   * Transfere um pneu para outra base
   */
  async transferirBase(
    id: number, 
    baseIdDestino: number,
    baseNomeDestino: string,
    observacao?: string
  ): Promise<any> {
    try {
      // Buscar pneu atual
      const [pneuAtual] = await this.getPneus({ id }) as any[];
      if (!pneuAtual) {
        throw new Error(`Pneu com ID ${id} não encontrado`);
      }

      const baseIdOrigem = pneuAtual.base_id;
      const baseNomeOrigem = pneuAtual.base_nome;

      // Persistir transferência com garantia de salvamento
      const pneu = await universalPersistenceService.update(
        MODULE_NAME,
        TABLES.PNEUS,
        {
          base_id: baseIdDestino,
          base_nome: baseNomeDestino,
          updated_at: new Date().toISOString()
        },
        { id }
      );

      // Registrar no histórico
      await this.registrarHistorico(
        id, 
        'transferencia_base',
        observacao || `Pneu transferido da base ${baseNomeOrigem} (ID: ${baseIdOrigem}) para ${baseNomeDestino} (ID: ${baseIdDestino})`
      );

      return pneu;
    } catch (error) {
      console.error('[PneusService] Erro ao transferir pneu para outra base:', error);
      throw error;
    }
  }

  /**
   * Registra medição para um pneu
   */
  async registrarMedicao(
    pneuId: number, 
    profundidadeSulco: number,
    pressao: number,
    observacao?: string
  ): Promise<any> {
    try {
      const agora = new Date().toISOString();
      
      // Criar registro de medição
      const medicao = await universalPersistenceService.insert(
        MODULE_NAME,
        TABLES.PNEUS_MEDICOES,
        {
          pneu_id: pneuId,
          profundidade_sulco: profundidadeSulco,
          pressao,
          data_medicao: agora,
          observacao,
          created_at: agora
        }
      );

      // Atualizar pneu com medições mais recentes
      await universalPersistenceService.update(
        MODULE_NAME,
        TABLES.PNEUS,
        {
          ultima_medicao_sulco: profundidadeSulco,
          ultima_medicao_pressao: pressao,
          ultima_medicao_data: agora,
          updated_at: agora
        },
        { id: pneuId }
      );

      // Registrar no histórico
      await this.registrarHistorico(
        pneuId, 
        'medicao',
        `Medição registrada: Sulco ${profundidadeSulco}mm, Pressão ${pressao}psi`
      );

      return medicao;
    } catch (error) {
      console.error('[PneusService] Erro ao registrar medição de pneu:', error);
      throw error;
    }
  }

  /**
   * Busca medições de um pneu
   */
  async getMedicoes(pneuId: number, limit: number = 10): Promise<any[]> {
    try {
      return await universalPersistenceService.fetch(
        TABLES.PNEUS_MEDICOES,
        {
          filter: { pneu_id: pneuId },
          order: { column: 'data_medicao', ascending: false },
          limit
        }
      ) as any[];
    } catch (error) {
      console.error('[PneusService] Erro ao buscar medições do pneu:', error);
      return [];
    }
  }

  /**
   * Registra uma solicitação de pneus
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

      // Salvar itens separadamente se existirem
      const itens = dados.itens || [];
      delete dadosCompletos.itens;

      // Persistir com garantia de salvamento
      const solicitacao = await universalPersistenceService.insert(
        MODULE_NAME,
        TABLES.SOLICITACOES_PNEU,
        dadosCompletos
      );

      // Salvar itens
      if (itens && itens.length > 0) {
        for (const item of itens) {
          await this.adicionarItemSolicitacao(
            solicitacao.id,
            item.tipo,
            item.quantidade,
            item.medida,
            item.observacao
          );
        }
      }

      return solicitacao;
    } catch (error) {
      console.error('[PneusService] Erro ao registrar solicitação de pneus:', error);
      throw error;
    }
  }

  /**
   * Adiciona um item a uma solicitação de pneus
   */
  async adicionarItemSolicitacao(
    solicitacaoId: number,
    tipo: string,
    quantidade: number,
    medida: string,
    observacao?: string
  ): Promise<any> {
    try {
      const agora = new Date().toISOString();
      
      // Persistir com garantia de salvamento
      return await universalPersistenceService.insert(
        MODULE_NAME,
        TABLES.SOLICITACOES_PNEU_ITENS,
        {
          solicitacao_id: solicitacaoId,
          tipo,
          quantidade,
          medida,
          observacao,
          created_at: agora
        }
      );
    } catch (error) {
      console.error('[PneusService] Erro ao adicionar item à solicitação de pneus:', error);
      throw error;
    }
  }

  /**
   * Busca solicitações de pneus
   */
  async getSolicitacoes(filtros: Record<string, any> = {}, limit: number = 100): Promise<any[]> {
    try {
      return await universalPersistenceService.fetch(
        TABLES.SOLICITACOES_PNEU,
        {
          filter: filtros,
          limit,
          order: { column: 'created_at', ascending: false }
        }
      ) as any[];
    } catch (error) {
      console.error('[PneusService] Erro ao buscar solicitações de pneus:', error);
      return [];
    }
  }

  /**
   * Busca itens de uma solicitação de pneus
   */
  async getItensSolicitacao(solicitacaoId: number): Promise<any[]> {
    try {
      return await universalPersistenceService.fetch(
        TABLES.SOLICITACOES_PNEU_ITENS,
        {
          filter: { solicitacao_id: solicitacaoId }
        }
      ) as any[];
    } catch (error) {
      console.error('[PneusService] Erro ao buscar itens da solicitação de pneus:', error);
      return [];
    }
  }

  /**
   * Atualiza status de uma solicitação de pneus
   */
  async atualizarStatusSolicitacao(
    id: number,
    status: string,
    observacao?: string
  ): Promise<any> {
    try {
      // Persistir com garantia de salvamento
      return await universalPersistenceService.update(
        MODULE_NAME,
        TABLES.SOLICITACOES_PNEU,
        {
          status,
          observacao: observacao,
          updated_at: new Date().toISOString()
        },
        { id }
      );
    } catch (error) {
      console.error('[PneusService] Erro ao atualizar status da solicitação de pneus:', error);
      throw error;
    }
  }

  /**
   * Registra etapa no histórico do pneu
   */
  async registrarHistorico(
    pneuId: number, 
    tipo: string, 
    descricao: string
  ): Promise<any> {
    try {
      const agora = new Date().toISOString();
      
      // Criar registro de histórico
      return await universalPersistenceService.insert(
        MODULE_NAME,
        TABLES.PNEUS_HISTORICO,
        {
          pneu_id: pneuId,
          tipo,
          descricao,
          created_at: agora,
          usuario_id: null // TODO: Adicionar usuário quando disponível
        }
      );
    } catch (error) {
      console.error('[PneusService] Erro ao registrar histórico:', error);
      // Não propagar erro para não impedir operações principais
      return null;
    }
  }

  /**
   * Busca o histórico de um pneu
   */
  async getHistorico(pneuId: number): Promise<any[]> {
    try {
      return await universalPersistenceService.fetch(
        TABLES.PNEUS_HISTORICO,
        {
          filter: { pneu_id: pneuId },
          order: { column: 'created_at', ascending: false }
        }
      ) as any[];
    } catch (error) {
      console.error('[PneusService] Erro ao buscar histórico do pneu:', error);
      return [];
    }
  }
}

// Exportar instância única do serviço
export const pneusService = new PneusService();

// Exportar como default para compatibilidade
export default pneusService;