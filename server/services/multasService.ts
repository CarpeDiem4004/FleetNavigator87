/**
 * Serviço para gerenciamento de multas com persistência resiliente
 * Garante que todos os dados de multas sejam persistidos no Supabase
 */

import { universalPersistenceService } from '../api/universalPersistenceService';

// Módulo para identificação no sistema de persistência
const MODULE_NAME = 'multas';

// Tabelas relacionadas a multas
const TABLES = {
  MULTAS: 'multas',
  MULTAS_CICLO_VIDA: 'multas_ciclo_vida',
  MULTAS_DOCUMENTOS: 'multas_documentos',
  MULTAS_ASSINATURAS: 'multas_assinaturas'
};

/**
 * Classe principal de serviço de multas
 */
class MultasService {
  /**
   * Verifica o status da conexão
   */
  async checkConnection(): Promise<boolean> {
    return await universalPersistenceService.checkConnection();
  }

  /**
   * Busca todas as multas com opção de filtros
   */
  async getMultas(filtros: Record<string, any> = {}, limit: number = 100): Promise<any[]> {
    try {
      const multas = await universalPersistenceService.fetch(
        TABLES.MULTAS,
        {
          filter: filtros,
          limit,
          order: { column: 'created_at', ascending: false }
        }
      ) as any[];

      return multas;
    } catch (error) {
      console.error('[MultasService] Erro ao buscar multas:', error);
      return [];
    }
  }

  /**
   * Busca multas de uma base específica
   */
  async getMultasPorBase(baseId: number): Promise<any[]> {
    return this.getMultas({ base_id: baseId });
  }

  /**
   * Busca multas por status de ciclo de vida
   */
  async getMultasPorStatusCiclo(status: string): Promise<any[]> {
    return this.getMultas({ lifecycle: status });
  }

  /**
   * Busca multas de um veículo específico
   */
  async getMultasPorVeiculo(placa: string): Promise<any[]> {
    return this.getMultas({ veiculo_placa: placa });
  }

  /**
   * Registra uma nova multa
   */
  async registrarMulta(dados: any): Promise<any> {
    try {
      const agora = new Date().toISOString();
      
      // Adicionar campos de controle
      const dadosCompletos = {
        ...dados,
        lifecycle: dados.lifecycle || 'aguardando_base',
        created_at: agora,
        updated_at: agora
      };

      // Persistir com garantia de salvamento
      const multa = await universalPersistenceService.insert(
        MODULE_NAME,
        TABLES.MULTAS,
        dadosCompletos
      );

      // Registrar no ciclo de vida
      await this.registrarCicloVida(multa.id, 'criacao', 'Multa registrada no sistema');

      return multa;
    } catch (error) {
      console.error('[MultasService] Erro ao registrar multa:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma multa existente
   */
  async atualizarMulta(id: number, dados: any): Promise<any> {
    try {
      // Adicionar timestamp de atualização
      const dadosAtualizados = {
        ...dados,
        updated_at: new Date().toISOString()
      };

      // Persistir com garantia de salvamento
      const multa = await universalPersistenceService.update(
        MODULE_NAME,
        TABLES.MULTAS,
        dadosAtualizados,
        { id }
      );

      // Registrar no ciclo de vida se houve mudança de status
      if (dados.lifecycle) {
        await this.registrarCicloVida(
          id, 
          'atualizacao_status',
          `Status atualizado para: ${dados.lifecycle}`
        );
      }

      return multa;
    } catch (error) {
      console.error('[MultasService] Erro ao atualizar multa:', error);
      throw error;
    }
  }

  /**
   * Atualiza o status do ciclo de vida de uma multa
   */
  async atualizarStatus(id: number, status: string, observacao?: string): Promise<any> {
    try {
      // Persistir atualização de status com garantia de salvamento
      const multa = await universalPersistenceService.update(
        MODULE_NAME,
        TABLES.MULTAS,
        {
          lifecycle: status,
          updated_at: new Date().toISOString()
        },
        { id }
      );

      // Registrar no ciclo de vida
      await this.registrarCicloVida(
        id, 
        'atualizacao_status',
        observacao || `Status atualizado para: ${status}`
      );

      return multa;
    } catch (error) {
      console.error('[MultasService] Erro ao atualizar status da multa:', error);
      throw error;
    }
  }

  /**
   * Adiciona um documento à multa (ex: notificação, defesa)
   */
  async adicionarDocumento(
    multaId: number, 
    tipo: string, 
    url: string, 
    observacao?: string
  ): Promise<any> {
    try {
      const agora = new Date().toISOString();
      
      // Criar registro de documento
      const documento = await universalPersistenceService.insert(
        MODULE_NAME,
        TABLES.MULTAS_DOCUMENTOS,
        {
          multa_id: multaId,
          tipo,
          url,
          observacao,
          created_at: agora
        }
      );

      // Registrar no ciclo de vida
      await this.registrarCicloVida(
        multaId, 
        'documento_adicionado',
        `Documento do tipo ${tipo} adicionado`
      );

      // Se for do tipo notificação, atualizar campo na multa
      if (tipo === 'notificacao') {
        await this.atualizarMulta(multaId, { notificationFileUrl: url });
      }

      return documento;
    } catch (error) {
      console.error('[MultasService] Erro ao adicionar documento à multa:', error);
      throw error;
    }
  }

  /**
   * Registra assinatura do motorista
   */
  async registrarAssinatura(
    multaId: number, 
    assinaturaUrl: string, 
    motoristaNome: string
  ): Promise<any> {
    try {
      const agora = new Date().toISOString();
      
      // Criar registro de assinatura
      const assinatura = await universalPersistenceService.insert(
        MODULE_NAME,
        TABLES.MULTAS_ASSINATURAS,
        {
          multa_id: multaId,
          assinatura_url: assinaturaUrl,
          motorista_nome: motoristaNome,
          data_assinatura: agora,
          created_at: agora
        }
      );

      // Atualizar multa com informações de assinatura e ciclo de vida
      await this.atualizarMulta(multaId, {
        driverSignatureUrl: assinaturaUrl,
        signatureDate: agora,
        lifecycle: 'assinado'
      });

      // Registrar no ciclo de vida
      await this.registrarCicloVida(
        multaId, 
        'assinatura',
        `Multa assinada pelo motorista: ${motoristaNome}`
      );

      return assinatura;
    } catch (error) {
      console.error('[MultasService] Erro ao registrar assinatura:', error);
      throw error;
    }
  }

  /**
   * Registra etapa no ciclo de vida da multa
   */
  async registrarCicloVida(
    multaId: number, 
    tipo: string, 
    descricao: string
  ): Promise<any> {
    try {
      const agora = new Date().toISOString();
      
      // Criar registro de ciclo de vida
      return await universalPersistenceService.insert(
        MODULE_NAME,
        TABLES.MULTAS_CICLO_VIDA,
        {
          multa_id: multaId,
          tipo,
          descricao,
          created_at: agora,
          usuario_id: null // TODO: Adicionar usuário quando disponível
        }
      );
    } catch (error) {
      console.error('[MultasService] Erro ao registrar ciclo de vida:', error);
      // Não propagar erro para não impedir operações principais
      return null;
    }
  }

  /**
   * Busca o histórico do ciclo de vida de uma multa
   */
  async getHistoricoCicloVida(multaId: number): Promise<any[]> {
    try {
      return await universalPersistenceService.fetch(
        TABLES.MULTAS_CICLO_VIDA,
        {
          filter: { multa_id: multaId },
          order: { column: 'created_at', ascending: false }
        }
      ) as any[];
    } catch (error) {
      console.error('[MultasService] Erro ao buscar histórico do ciclo de vida:', error);
      return [];
    }
  }

  /**
   * Exclui uma multa e todos os seus registros relacionados
   * Obs: Na maioria dos casos, é preferível inativar ao invés de excluir
   */
  async excluirMulta(id: number): Promise<boolean> {
    try {
      // Excluir registros relacionados
      await universalPersistenceService.delete(
        MODULE_NAME,
        TABLES.MULTAS_ASSINATURAS,
        { multa_id: id }
      );

      await universalPersistenceService.delete(
        MODULE_NAME,
        TABLES.MULTAS_DOCUMENTOS,
        { multa_id: id }
      );

      await universalPersistenceService.delete(
        MODULE_NAME,
        TABLES.MULTAS_CICLO_VIDA,
        { multa_id: id }
      );

      // Excluir a multa
      await universalPersistenceService.delete(
        MODULE_NAME,
        TABLES.MULTAS,
        { id }
      );

      return true;
    } catch (error) {
      console.error('[MultasService] Erro ao excluir multa:', error);
      throw error;
    }
  }
}

// Exportar instância única do serviço
export const multasService = new MultasService();

// Exportar como default para compatibilidade
export default multasService;