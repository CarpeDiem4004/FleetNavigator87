/**
 * Serviço para gerenciamento de postos de combustível
 * Implementa operações com resiliência para garantir persistência dos dados
 */

import { resilientDataService } from '../api/resilientApi';

// Interface para configuração de tanques
interface TanqueConfig {
  id?: number;
  posto: string;
  diesel_capacidade: string;
  diesel_nivel: string;
  arla_capacidade: string;
  arla_nivel: string;
  diesel_valor_litro: string;
  arla_valor_litro: string;
  diesel_consumo_total: string;
  diesel_valor_total: string;
  arla_consumo_total: string;
  arla_valor_total: string;
  created_at?: string | Date;
  updated_at?: string | Date;
}

// Interface para abastecimento
interface Abastecimento {
  id?: number;
  data: string | Date;
  placa: string;
  motorista: string;
  hodometro?: string | null;
  quantidade_litros: number;
  tipo_combustivel: string;
  valor_litro: number;
  valor_total: number;
  posto: string;
  projeto?: string | null;
  base?: string | null;
  veiculo_id?: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

// Interface para recebimento de combustível
interface RecebimentoCombustivel {
  id?: number;
  data: string | Date;
  posto: string;
  tipo_combustivel: string;
  quantidade_litros: number;
  valor_litro: number;
  valor_total: number;
  nota_fiscal?: string | null;
  fornecedor?: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

// Interface para movimentação de pátio
interface MovimentacaoPatio {
  id?: number;
  data: string | Date;
  placa: string;
  motorista: string;
  tipo: 'entrada' | 'saida';
  hodometro?: string | null;
  destino?: string | null;
  origem?: string | null;
  projeto?: string | null;
  posto: string;
  observacao?: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

/**
 * Classe para gerenciamento de postos
 */
class PostoService {
  constructor(private dataService = resilientDataService) {}

  /**
   * Busca configuração de tanques para um posto
   * @param posto Nome do posto
   * @returns Configuração de tanques ou null se não encontrada
   */
  async getConfiguracaoTanques(posto: string): Promise<TanqueConfig | null> {
    console.log(`[PostoService] Buscando configuração de tanques para posto: ${posto}`);
    
    try {
      const config = await this.dataService.getRecordByFilter<TanqueConfig>(
        'configuracao_tanques',
        { posto }
      );
      
      if (config) {
        console.log(`[PostoService] Configuração de tanques encontrada para posto: ${posto}`);
        return config;
      }
      
      console.log(`[PostoService] Configuração de tanques não encontrada para posto: ${posto}`);
      return null;
    } catch (error) {
      console.error(`[PostoService] Erro ao buscar configuração de tanques para ${posto}:`, error);
      return null;
    }
  }

  /**
   * Atualiza ou cria configuração de tanques para um posto
   * @param config Dados da configuração
   * @returns Configuração atualizada
   */
  async salvarConfiguracaoTanques(config: TanqueConfig): Promise<TanqueConfig | null> {
    console.log(`[PostoService] Salvando configuração de tanques para posto: ${config.posto}`);
    
    try {
      // Verificar se já existe configuração para este posto
      const existingConfig = await this.getConfiguracaoTanques(config.posto);
      
      // Adicionar timestamps
      const now = new Date().toISOString();
      config.updated_at = now;
      
      if (existingConfig?.id) {
        // Atualizar configuração existente
        console.log(`[PostoService] Atualizando configuração existente (ID: ${existingConfig.id})`);
        
        return await this.dataService.updateRecord<TanqueConfig>(
          'configuracao_tanques',
          existingConfig.id,
          config
        );
      } else {
        // Criar nova configuração
        console.log(`[PostoService] Criando nova configuração para posto: ${config.posto}`);
        config.created_at = now;
        
        return await this.dataService.insertRecord<TanqueConfig>(
          'configuracao_tanques',
          config
        );
      }
    } catch (error) {
      console.error(`[PostoService] Erro ao salvar configuração de tanques:`, error);
      return null;
    }
  }

  /**
   * Registra um abastecimento
   * @param abastecimento Dados do abastecimento
   * @returns Abastecimento registrado
   */
  async registrarAbastecimento(
    abastecimento: Abastecimento,
    posto: string
  ): Promise<Abastecimento | null> {
    console.log(`[PostoService] Registrando abastecimento para posto: ${posto}`);
    
    try {
      // Normalizar nome do posto e adicionar timestamps
      const now = new Date().toISOString();
      
      // Determinar a tabela correta baseada no nome do posto
      const tableName = `abastecimentos_posto_${posto.toLowerCase()}`;
      
      // Complementar dados
      const abastecimentoCompleto: Abastecimento = {
        ...abastecimento,
        posto: posto,
        created_at: now,
        updated_at: now
      };
      
      // Inserir abastecimento
      console.log(`[PostoService] Inserindo abastecimento na tabela: ${tableName}`);
      
      // Atualizar nível do tanque após abastecimento
      await this.atualizarNivelTanqueAposAbastecimento(
        posto, 
        abastecimento.tipo_combustivel, 
        abastecimento.quantidade_litros
      );
      
      return await this.dataService.insertRecord<Abastecimento>(
        tableName,
        abastecimentoCompleto
      );
    } catch (error) {
      console.error(`[PostoService] Erro ao registrar abastecimento:`, error);
      return null;
    }
  }

  /**
   * Atualiza o nível do tanque após um abastecimento
   * @param posto Nome do posto
   * @param tipoCombustivel Tipo de combustível
   * @param quantidadeLitros Quantidade de litros
   */
  private async atualizarNivelTanqueAposAbastecimento(
    posto: string,
    tipoCombustivel: string,
    quantidadeLitros: number
  ): Promise<void> {
    try {
      const config = await this.getConfiguracaoTanques(posto);
      
      if (!config) {
        console.warn(`[PostoService] Configuração de tanque não encontrada para ${posto}`);
        return;
      }
      
      // Determinar qual tanque atualizar
      if (tipoCombustivel.toLowerCase() === 'diesel') {
        const nivelAtual = parseFloat(config.diesel_nivel);
        const consumoAtual = parseFloat(config.diesel_consumo_total);
        const valorLitro = parseFloat(config.diesel_valor_litro);
        
        // Atualizar nível e consumo
        config.diesel_nivel = Math.max(0, nivelAtual - quantidadeLitros).toString();
        config.diesel_consumo_total = (consumoAtual + quantidadeLitros).toString();
        config.diesel_valor_total = (parseFloat(config.diesel_valor_total) + (quantidadeLitros * valorLitro)).toString();
      } else if (tipoCombustivel.toLowerCase() === 'arla') {
        const nivelAtual = parseFloat(config.arla_nivel);
        const consumoAtual = parseFloat(config.arla_consumo_total);
        const valorLitro = parseFloat(config.arla_valor_litro);
        
        // Atualizar nível e consumo
        config.arla_nivel = Math.max(0, nivelAtual - quantidadeLitros).toString();
        config.arla_consumo_total = (consumoAtual + quantidadeLitros).toString();
        config.arla_valor_total = (parseFloat(config.arla_valor_total) + (quantidadeLitros * valorLitro)).toString();
      }
      
      // Salvar configuração atualizada
      await this.salvarConfiguracaoTanques(config);
    } catch (error) {
      console.error(`[PostoService] Erro ao atualizar nível do tanque:`, error);
    }
  }

  /**
   * Registra recebimento de combustível
   * @param recebimento Dados do recebimento
   * @returns Recebimento registrado
   */
  async registrarRecebimentoCombustivel(
    recebimento: RecebimentoCombustivel,
    posto: string
  ): Promise<RecebimentoCombustivel | null> {
    console.log(`[PostoService] Registrando recebimento de combustível para posto: ${posto}`);
    
    try {
      // Normalizar nome do posto e adicionar timestamps
      const now = new Date().toISOString();
      
      // Determinar a tabela correta baseada no nome do posto
      const tableName = `recebimentos_${posto.toLowerCase()}`;
      
      // Complementar dados
      const recebimentoCompleto: RecebimentoCombustivel = {
        ...recebimento,
        posto: posto,
        created_at: now,
        updated_at: now
      };
      
      // Inserir recebimento
      console.log(`[PostoService] Inserindo recebimento na tabela: ${tableName}`);
      
      // Atualizar nível do tanque após recebimento
      await this.atualizarNivelTanqueAposRecebimento(
        posto, 
        recebimento.tipo_combustivel, 
        recebimento.quantidade_litros
      );
      
      return await this.dataService.insertRecord<RecebimentoCombustivel>(
        tableName,
        recebimentoCompleto
      );
    } catch (error) {
      console.error(`[PostoService] Erro ao registrar recebimento:`, error);
      return null;
    }
  }

  /**
   * Atualiza o nível do tanque após um recebimento
   * @param posto Nome do posto
   * @param tipoCombustivel Tipo de combustível
   * @param quantidadeLitros Quantidade de litros
   */
  private async atualizarNivelTanqueAposRecebimento(
    posto: string,
    tipoCombustivel: string,
    quantidadeLitros: number
  ): Promise<void> {
    try {
      const config = await this.getConfiguracaoTanques(posto);
      
      if (!config) {
        console.warn(`[PostoService] Configuração de tanque não encontrada para ${posto}`);
        return;
      }
      
      // Determinar qual tanque atualizar
      if (tipoCombustivel.toLowerCase() === 'diesel') {
        const nivelAtual = parseFloat(config.diesel_nivel);
        const capacidade = parseFloat(config.diesel_capacidade);
        
        // Atualizar nível sem exceder capacidade
        config.diesel_nivel = Math.min(capacidade, nivelAtual + quantidadeLitros).toString();
      } else if (tipoCombustivel.toLowerCase() === 'arla') {
        const nivelAtual = parseFloat(config.arla_nivel);
        const capacidade = parseFloat(config.arla_capacidade);
        
        // Atualizar nível sem exceder capacidade
        config.arla_nivel = Math.min(capacidade, nivelAtual + quantidadeLitros).toString();
      }
      
      // Salvar configuração atualizada
      await this.salvarConfiguracaoTanques(config);
    } catch (error) {
      console.error(`[PostoService] Erro ao atualizar nível do tanque após recebimento:`, error);
    }
  }

  /**
   * Registra movimentação de pátio
   * @param movimentacao Dados da movimentação
   * @returns Movimentação registrada
   */
  async registrarMovimentacaoPatio(
    movimentacao: MovimentacaoPatio,
    posto: string
  ): Promise<MovimentacaoPatio | null> {
    console.log(`[PostoService] Registrando movimentação de pátio para posto: ${posto}`);
    
    try {
      // Normalizar nome do posto e adicionar timestamps
      const now = new Date().toISOString();
      
      // Determinar a tabela correta baseada no nome do posto
      const tableName = `movimentacoes_patio_${posto.toLowerCase()}`;
      
      // Complementar dados
      const movimentacaoCompleta: MovimentacaoPatio = {
        ...movimentacao,
        posto: posto,
        created_at: now,
        updated_at: now
      };
      
      // Inserir movimentação
      console.log(`[PostoService] Inserindo movimentação na tabela: ${tableName}`);
      
      return await this.dataService.insertRecord<MovimentacaoPatio>(
        tableName,
        movimentacaoCompleta
      );
    } catch (error) {
      console.error(`[PostoService] Erro ao registrar movimentação:`, error);
      return null;
    }
  }

  /**
   * Busca abastecimentos de um posto
   * @param posto Nome do posto
   * @param limit Limite de registros
   * @returns Lista de abastecimentos
   */
  async getAbastecimentos(posto: string, limit: number = 100): Promise<Abastecimento[]> {
    console.log(`[PostoService] Buscando abastecimentos para posto: ${posto}`);
    
    try {
      // Determinar a tabela correta baseada no nome do posto
      const tableName = `abastecimentos_posto_${posto.toLowerCase()}`;
      
      // Buscar abastecimentos
      return await this.dataService.getRecords<Abastecimento>(
        tableName,
        {
          order: { column: 'data', ascending: false },
          limit
        }
      );
    } catch (error) {
      console.error(`[PostoService] Erro ao buscar abastecimentos:`, error);
      return [];
    }
  }

  /**
   * Busca recebimentos de combustível de um posto
   * @param posto Nome do posto
   * @param limit Limite de registros
   * @returns Lista de recebimentos
   */
  async getRecebimentos(posto: string, limit: number = 100): Promise<RecebimentoCombustivel[]> {
    console.log(`[PostoService] Buscando recebimentos para posto: ${posto}`);
    
    try {
      // Determinar a tabela correta baseada no nome do posto
      const tableName = `recebimentos_${posto.toLowerCase()}`;
      
      // Buscar recebimentos
      return await this.dataService.getRecords<RecebimentoCombustivel>(
        tableName,
        {
          order: { column: 'data', ascending: false },
          limit
        }
      );
    } catch (error) {
      console.error(`[PostoService] Erro ao buscar recebimentos:`, error);
      return [];
    }
  }

  /**
   * Busca movimentações de pátio de um posto
   * @param posto Nome do posto
   * @param limit Limite de registros
   * @returns Lista de movimentações
   */
  async getMovimentacoesPatio(posto: string, limit: number = 100): Promise<MovimentacaoPatio[]> {
    console.log(`[PostoService] Buscando movimentações de pátio para posto: ${posto}`);
    
    try {
      // Determinar a tabela correta baseada no nome do posto
      const tableName = `movimentacoes_patio_${posto.toLowerCase()}`;
      
      // Buscar movimentações
      return await this.dataService.getRecords<MovimentacaoPatio>(
        tableName,
        {
          order: { column: 'data', ascending: false },
          limit
        }
      );
    } catch (error) {
      console.error(`[PostoService] Erro ao buscar movimentações:`, error);
      return [];
    }
  }
}

// Exportar uma instância única do serviço
export const postoService = new PostoService();

// Exportar a classe para quem precisar estendê-la
export { PostoService };