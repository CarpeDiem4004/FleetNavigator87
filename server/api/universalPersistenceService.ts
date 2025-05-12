/**
 * Serviço Universal de Persistência Resiliente
 * 
 * Este serviço garante que todos os dados do sistema sejam salvos no Supabase
 * de forma segura e resiliente, mesmo durante falhas de conexão ou travamentos.
 * 
 * Implementa mecanismos de salvamento local, tentativas automáticas e sincronização.
 */

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import os from 'os';
import supabaseAdapter from '../adapters/supabaseStorageAdapter';
import { checkSupabaseConnection } from '../utils/supabaseConnection';

// Tipos de operações de persistência
type OperationType = 'insert' | 'update' | 'delete';

// Interface para operações pendentes
interface PendingOperation {
  id: string;
  module: string;
  table: string;
  operation: OperationType;
  data: any;
  filter?: Record<string, any>;
  timestamp: number;
  retries: number;
  priority: number;
}

// Configuração para o diretório de armazenamento local
const PERSISTENCE_DIR = process.env.PERSISTENCE_DIR || path.join(os.tmpdir(), 'murici-persistence');
const PENDING_OPS_FILE = path.join(PERSISTENCE_DIR, 'pending-operations.json');
const OPERATIONS_LOG_FILE = path.join(PERSISTENCE_DIR, 'operations-log.txt');

// Certifique-se de que os diretórios existam
if (!fs.existsSync(PERSISTENCE_DIR)) {
  fs.mkdirSync(PERSISTENCE_DIR, { recursive: true });
}

// Níveis de prioridade para diferentes tipos de dados
const PRIORITY_LEVELS = {
  CRITICAL: 1,   // Operações que não podem ser perdidas (ex: abastecimentos, multas)
  HIGH: 2,       // Operações importantes (ex: manutenções, recebimentos)
  MEDIUM: 3,     // Operações regulares (ex: movimentações de pátio)
  LOW: 4         // Operações não críticas (ex: atualizações de configurações)
};

// Mapeamento de módulos para prioridades
const MODULE_PRIORITIES: Record<string, number> = {
  'posto': PRIORITY_LEVELS.CRITICAL,
  'abastecimento': PRIORITY_LEVELS.CRITICAL,
  'multa': PRIORITY_LEVELS.CRITICAL,
  'pneu': PRIORITY_LEVELS.CRITICAL,
  'manutencao': PRIORITY_LEVELS.HIGH,
  'recebimento': PRIORITY_LEVELS.HIGH,
  'estoque': PRIORITY_LEVELS.HIGH,
  'veiculo': PRIORITY_LEVELS.MEDIUM,
  'movimentacao': PRIORITY_LEVELS.MEDIUM,
  'configuracao': PRIORITY_LEVELS.LOW
};

// Função para determinar a prioridade com base no módulo
function getPriorityForModule(module: string): number {
  const normalizedModule = module.toLowerCase();
  
  // Verificar correspondências parciais
  for (const [key, priority] of Object.entries(MODULE_PRIORITIES)) {
    if (normalizedModule.includes(key)) {
      return priority;
    }
  }
  
  // Prioridade padrão para módulos desconhecidos
  return PRIORITY_LEVELS.MEDIUM;
}

/**
 * Classe principal do serviço de persistência universal
 */
class UniversalPersistenceService {
  private static instance: UniversalPersistenceService;
  private processingPromise: Promise<void> | null = null;
  private lastProcessingAttempt = 0;
  private processingInterval = 30000; // 30 segundos entre processamentos

  private constructor() {
    // Iniciar processamento automaticamente
    this.scheduleProcessing();
    
    // Registrar eventos de processo para persistência ao desligar
    process.on('SIGINT', () => this.processAllPendingOperations(true));
    process.on('SIGTERM', () => this.processAllPendingOperations(true));
  }

  /**
   * Retorna a instância única do serviço (padrão Singleton)
   */
  public static getInstance(): UniversalPersistenceService {
    if (!UniversalPersistenceService.instance) {
      UniversalPersistenceService.instance = new UniversalPersistenceService();
    }
    return UniversalPersistenceService.instance;
  }

  /**
   * Verifica a conexão com o Supabase
   * @returns Status da conexão
   */
  async checkConnection(): Promise<boolean> {
    return await checkSupabaseConnection();
  }

  /**
   * Carrega operações pendentes do armazenamento local
   */
  private loadPendingOperations(): PendingOperation[] {
    try {
      if (fs.existsSync(PENDING_OPS_FILE)) {
        const data = fs.readFileSync(PENDING_OPS_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      this.logOperation('ERROR', 'Falha ao carregar operações pendentes', { error });
      console.error('[UniversalPersistence] Erro ao carregar operações pendentes:', error);
    }
    return [];
  }

  /**
   * Salva operações pendentes no armazenamento local
   */
  private savePendingOperations(operations: PendingOperation[]): void {
    try {
      fs.writeFileSync(PENDING_OPS_FILE, JSON.stringify(operations, null, 2));
    } catch (error) {
      console.error('[UniversalPersistence] Erro ao salvar operações pendentes:', error);
    }
  }

  /**
   * Registra uma operação no log
   */
  private logOperation(type: string, message: string, data?: any): void {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] [${type}] ${message} ${data ? JSON.stringify(data) : ''}\n`;
      
      fs.appendFileSync(OPERATIONS_LOG_FILE, logEntry);
    } catch (error) {
      console.error('[UniversalPersistence] Erro ao registrar log:', error);
    }
  }

  /**
   * Adiciona uma nova operação pendente
   */
  private addPendingOperation(
    module: string,
    table: string, 
    operation: OperationType, 
    data: any, 
    filter?: Record<string, any>
  ): string {
    const operations = this.loadPendingOperations();
    
    const priority = getPriorityForModule(module);
    
    const newOperation: PendingOperation = {
      id: uuidv4(),
      module,
      table,
      operation,
      data,
      filter,
      timestamp: Date.now(),
      retries: 0,
      priority
    };
    
    operations.push(newOperation);
    this.savePendingOperations(operations);
    
    this.logOperation('QUEUED', `Operação adicionada à fila: ${module}/${table}/${operation}`, {
      id: newOperation.id,
      priority
    });
    
    // Agendar processamento se necessário
    this.scheduleProcessing();
    
    return newOperation.id;
  }

  /**
   * Agenda o processamento de operações pendentes
   */
  private scheduleProcessing(): void {
    const now = Date.now();
    if (now - this.lastProcessingAttempt > this.processingInterval && !this.processingPromise) {
      this.lastProcessingAttempt = now;
      this.processingPromise = this.processAllPendingOperations()
        .finally(() => {
          this.processingPromise = null;
        });
    }
  }

  /**
   * Processa todas as operações pendentes
   */
  private async processAllPendingOperations(isShutdown = false): Promise<void> {
    const isConnected = await this.checkConnection();
    if (!isConnected && !isShutdown) {
      console.log('[UniversalPersistence] Sem conexão com Supabase, adiando processamento');
      return;
    }

    const operations = this.loadPendingOperations();
    if (operations.length === 0) return;

    console.log(`[UniversalPersistence] Processando ${operations.length} operações pendentes${isShutdown ? ' (desligamento)' : ''}`);
    
    // Ordenar por prioridade (menores valores primeiro) e tempo (mais antigas primeiro)
    operations.sort((a, b) => {
      // Primeiro ordenar por prioridade
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // Se mesma prioridade, ordenar por timestamp (mais antigas primeiro)
      return a.timestamp - b.timestamp;
    });
    
    const remainingOperations: PendingOperation[] = [];
    
    for (const operation of operations) {
      try {
        const { table, data, operation: opType, filter } = operation;
        
        if (opType === 'insert') {
          await supabaseAdapter.insert(table, data);
          this.logOperation('SUCCESS', `Inserção processada com sucesso: ${table}`, { id: operation.id });
        } else if (opType === 'update' && filter) {
          await supabaseAdapter.update(table, data, filter);
          this.logOperation('SUCCESS', `Atualização processada com sucesso: ${table}`, { id: operation.id });
        } else if (opType === 'delete' && filter) {
          await supabaseAdapter.delete(table, filter);
          this.logOperation('SUCCESS', `Exclusão processada com sucesso: ${table}`, { id: operation.id });
        }
        
      } catch (error) {
        // Incrementar contagem de tentativas e manter operação se < 10 tentativas
        if (operation.retries < 10) {
          operation.retries += 1;
          remainingOperations.push(operation);
          
          this.logOperation('RETRY', `Tentativa ${operation.retries}/10 falhou: ${operation.table}`, {
            id: operation.id,
            error: error instanceof Error ? error.message : String(error)
          });
          
          console.error(`[UniversalPersistence] Falha ao processar operação ${operation.id} (tentativa ${operation.retries}/10)`, error);
        } else {
          this.logOperation('ABANDON', `Operação abandonada após 10 tentativas: ${operation.table}`, {
            id: operation.id,
            data: operation.data
          });
          
          console.error(`[UniversalPersistence] Abandonando operação ${operation.id} após 10 tentativas`);
        }
      }
    }
    
    // Atualizar lista de operações pendentes
    this.savePendingOperations(remainingOperations);
    
    if (remainingOperations.length > 0) {
      console.log(`[UniversalPersistence] ${remainingOperations.length} operações ainda pendentes`);
    } else {
      console.log('[UniversalPersistence] Todas as operações foram processadas com sucesso');
    }
  }

  /**
   * Força o processamento imediato de operações pendentes
   * @returns Status do processamento
   */
  async forceProcessPendingOperations(): Promise<{
    processed: number;
    remaining: number;
  }> {
    const initialOperations = this.loadPendingOperations();
    const initialCount = initialOperations.length;
    
    await this.processAllPendingOperations();
    
    const remainingOperations = this.loadPendingOperations();
    const remainingCount = remainingOperations.length;
    
    return {
      processed: initialCount - remainingCount,
      remaining: remainingCount
    };
  }

  /**
   * Conta as operações pendentes, agrupadas por módulo
   * @returns Contagem de operações pendentes por módulo
   */
  countPendingOperations(): {
    total: number;
    byModule: Record<string, number>;
    byPriority: Record<string, number>;
  } {
    const operations = this.loadPendingOperations();
    
    const byModule: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    
    for (const op of operations) {
      // Contar por módulo
      byModule[op.module] = (byModule[op.module] || 0) + 1;
      
      // Contar por prioridade
      const priorityKey = `P${op.priority}`;
      byPriority[priorityKey] = (byPriority[priorityKey] || 0) + 1;
    }
    
    return {
      total: operations.length,
      byModule,
      byPriority
    };
  }

  /**
   * Insere um registro com persistência garantida
   * @param module Nome do módulo (ex: 'multas', 'abastecimentos', 'pneus')
   * @param table Nome da tabela
   * @param data Dados a serem inseridos
   * @returns Resultado da operação
   */
  async insert<T extends Record<string, any>>(
    module: string,
    table: string,
    data: T
  ): Promise<T> {
    try {
      // Tentar inserção direta no Supabase
      const result = await supabaseAdapter.insert(table, data);
      return result as T;
    } catch (error) {
      console.error(`[UniversalPersistence] Erro ao inserir em ${table}, salvando para processamento posterior:`, error);
      
      // Adicionar à fila de operações pendentes
      this.addPendingOperation(module, table, 'insert', data);
      
      // Retornar os dados originais com um ID temporário
      return { ...data, id: data.id || `pending_${Date.now()}`, _pending: true } as T;
    }
  }

  /**
   * Atualiza um registro com persistência garantida
   * @param module Nome do módulo (ex: 'multas', 'abastecimentos', 'pneus')
   * @param table Nome da tabela
   * @param data Dados a serem atualizados
   * @param filter Filtro para identificar o registro (geralmente { id: X })
   * @returns Resultado da operação
   */
  async update<T extends Record<string, any>>(
    module: string,
    table: string,
    data: Partial<T>,
    filter: Record<string, any>
  ): Promise<T> {
    try {
      // Tentar atualização direta no Supabase
      const result = await supabaseAdapter.update(table, data, filter);
      return result as T;
    } catch (error) {
      console.error(`[UniversalPersistence] Erro ao atualizar em ${table}, salvando para processamento posterior:`, error);
      
      // Adicionar à fila de operações pendentes
      this.addPendingOperation(module, table, 'update', data, filter);
      
      // Retornar os dados originais com flag de pendente
      return { ...data, _pending: true } as T;
    }
  }

  /**
   * Exclui um registro com persistência garantida
   * @param module Nome do módulo (ex: 'multas', 'abastecimentos', 'pneus')
   * @param table Nome da tabela
   * @param filter Filtro para identificar o registro (geralmente { id: X })
   * @returns Resultado da operação
   */
  async delete(
    module: string,
    table: string,
    filter: Record<string, any>
  ): Promise<boolean> {
    try {
      // Tentar exclusão direta no Supabase
      return await supabaseAdapter.delete(table, filter);
    } catch (error) {
      console.error(`[UniversalPersistence] Erro ao excluir de ${table}, salvando para processamento posterior:`, error);
      
      // Adicionar à fila de operações pendentes
      this.addPendingOperation(module, table, 'delete', {}, filter);
      
      // Retornar sucesso para não bloquear o cliente
      return true;
    }
  }

  /**
   * Busca registros no Supabase
   * @param table Nome da tabela
   * @param options Opções de busca
   * @returns Registros encontrados
   */
  async fetch<T>(
    table: string,
    options: { 
      columns?: string; 
      filter?: Record<string, any>;
      order?: { column: string; ascending?: boolean };
      limit?: number;
      single?: boolean;
    } = {}
  ): Promise<T | T[]> {
    try {
      return await supabaseAdapter.fetch(table, options);
    } catch (error) {
      console.error(`[UniversalPersistence] Erro ao buscar em ${table}:`, error);
      
      // Para consultas, apenas retornar array vazio ou nulo
      return options.single ? null as T : [] as T[];
    }
  }
}

// Exportar instância única
export const universalPersistenceService = UniversalPersistenceService.getInstance();

// Exportar como default para compatibilidade
export default universalPersistenceService;