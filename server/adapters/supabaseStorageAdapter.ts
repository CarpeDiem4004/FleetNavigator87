/**
 * Adaptador de armazenamento para Supabase com resiliência
 * Implementa mecanismos para garantir que dados sejam salvos mesmo com problemas de conexão
 */

import {
  supabase,
  supabaseAdmin,
  executeWithRetry,
  checkSupabaseConnection
} from '../utils/supabaseConnection';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Inicialização do pool de conexão do PostgreSQL local (backup)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Configure o diretório de cache de dados em memória
const CACHE_DIR = process.env.PERSISTENCE_DIR || path.join(os.tmpdir(), 'murici-cache');
const PENDING_OPERATIONS_FILE = path.join(CACHE_DIR, 'pending-operations.json');

// Certifique-se de que o diretório de cache existe
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Status das operações pendentes
type PendingOperation = {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  filter?: Record<string, any>;
  timestamp: number;
  retries: number;
};

// Carrega operações pendentes do arquivo
function loadPendingOperations(): PendingOperation[] {
  try {
    if (fs.existsSync(PENDING_OPERATIONS_FILE)) {
      const data = fs.readFileSync(PENDING_OPERATIONS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[SupabaseAdapter] Erro ao carregar operações pendentes:', error);
  }
  return [];
}

// Salva operações pendentes em arquivo
function savePendingOperations(operations: PendingOperation[]): void {
  try {
    fs.writeFileSync(PENDING_OPERATIONS_FILE, JSON.stringify(operations, null, 2));
  } catch (error) {
    console.error('[SupabaseAdapter] Erro ao salvar operações pendentes:', error);
  }
}

// Adiciona operação pendente
function addPendingOperation(operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retries'>): void {
  const operations = loadPendingOperations();
  const newOperation: PendingOperation = {
    ...operation,
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: Date.now(),
    retries: 0
  };
  operations.push(newOperation);
  savePendingOperations(operations);
}

// Remove operação pendente
function removePendingOperation(id: string): void {
  const operations = loadPendingOperations();
  const filteredOperations = operations.filter(op => op.id !== id);
  if (filteredOperations.length !== operations.length) {
    savePendingOperations(filteredOperations);
  }
}

// Processa operações pendentes
async function processPendingOperations(): Promise<void> {
  const isConnected = await checkSupabaseConnection();
  if (!isConnected) {
    console.log('[SupabaseAdapter] Sem conexão com Supabase, adiando processamento de operações pendentes');
    return;
  }

  const operations = loadPendingOperations();
  if (operations.length === 0) return;

  console.log(`[SupabaseAdapter] Processando ${operations.length} operações pendentes`);
  
  const remainingOperations: PendingOperation[] = [];
  
  for (const operation of operations) {
    try {
      const { table, data, operation: opType, filter } = operation;
      
      if (opType === 'insert') {
        await insertRecordToSupabase(table, data);
      } else if (opType === 'update' && filter) {
        await updateRecordInSupabase(table, data, filter);
      } else if (opType === 'delete' && filter) {
        await deleteRecordFromSupabase(table, filter);
      }
      
      // Se chegou aqui, a operação foi bem-sucedida
      console.log(`[SupabaseAdapter] Operação pendente ${operation.id} processada com sucesso`);
    } catch (error) {
      // Incrementar contagem de tentativas e manter operação se < 10 tentativas
      if (operation.retries < 10) {
        operation.retries += 1;
        remainingOperations.push(operation);
        console.error(`[SupabaseAdapter] Falha ao processar operação ${operation.id} (tentativa ${operation.retries}/10)`, error);
      } else {
        console.error(`[SupabaseAdapter] Abandonando operação ${operation.id} após 10 tentativas`);
      }
    }
  }
  
  // Atualizar lista de operações pendentes
  savePendingOperations(remainingOperations);
}

// Iniciar processamento periódico de operações pendentes
setInterval(processPendingOperations, 60000); // Tentar a cada minuto
// Primeira verificação após 5 segundos
setTimeout(processPendingOperations, 5000);

/**
 * Insere um registro no Supabase de forma resiliente
 * @param table Nome da tabela
 * @param data Dados a serem inseridos
 * @returns Resultado da operação
 */
export async function insertRecordToSupabase(table: string, data: any): Promise<any> {
  try {
    const result = await executeWithRetry(
      async (client) => {
        const { data: insertedData, error } = await client
          .from(table)
          .insert([data])
          .select();
        
        if (error) throw error;
        return insertedData?.[0] || null;
      },
      { 
        operationName: `Inserção em ${table}`,
        fallbackToAdmin: true 
      }
    );
    
    return result;
  } catch (error) {
    console.error(`[SupabaseAdapter] Erro ao inserir em ${table}, salvando operação para retry:`, error);
    
    // Salvar operação para tentativa posterior
    addPendingOperation({
      table,
      operation: 'insert',
      data
    });
    
    // Se disponível, salvar no PostgreSQL local também como backup
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `
        INSERT INTO ${table} (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const pgResult = await pool.query(query, values);
      return pgResult.rows[0];
    } catch (pgError) {
      console.error(`[SupabaseAdapter] Erro ao inserir no PostgreSQL local:`, pgError);
      // Retorna os dados originais para que a aplicação continue funcionando
      return { ...data, id: 'pending', _status: 'pending' };
    }
  }
}

/**
 * Atualiza um registro no Supabase de forma resiliente
 * @param table Nome da tabela
 * @param data Dados a serem atualizados
 * @param filter Filtro para identificar o(s) registro(s)
 * @returns Resultado da operação
 */
export async function updateRecordInSupabase(
  table: string, 
  data: any, 
  filter: Record<string, any>
): Promise<any> {
  try {
    const result = await executeWithRetry(
      async (client) => {
        let query = client
          .from(table)
          .update(data);
        
        // Aplicar filtros
        Object.entries(filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
        
        const { data: updatedData, error } = await query.select();
        
        if (error) throw error;
        return updatedData || null;
      },
      { 
        operationName: `Atualização em ${table}`,
        fallbackToAdmin: true 
      }
    );
    
    return result;
  } catch (error) {
    console.error(`[SupabaseAdapter] Erro ao atualizar em ${table}, salvando operação para retry:`, error);
    
    // Salvar operação para tentativa posterior
    addPendingOperation({
      table,
      operation: 'update',
      data,
      filter
    });
    
    // Se disponível, atualizar no PostgreSQL local também como backup
    try {
      const setColumns = Object.keys(data)
        .map((key, i) => `${key} = $${i + 1}`)
        .join(', ');
      
      const values = [...Object.values(data)];
      
      let whereClause = '';
      if (Object.keys(filter).length > 0) {
        whereClause = 'WHERE ' + Object.keys(filter)
          .map((key, i) => `${key} = $${i + values.length + 1}`)
          .join(' AND ');
        
        values.push(...Object.values(filter));
      }
      
      const query = `
        UPDATE ${table}
        SET ${setColumns}
        ${whereClause}
        RETURNING *
      `;
      
      const pgResult = await pool.query(query, values);
      return pgResult.rows;
    } catch (pgError) {
      console.error(`[SupabaseAdapter] Erro ao atualizar no PostgreSQL local:`, pgError);
      // Retorna os dados originais para que a aplicação continue funcionando
      return { ...data, _status: 'pending_update' };
    }
  }
}

/**
 * Exclui um registro no Supabase de forma resiliente
 * @param table Nome da tabela
 * @param filter Filtro para identificar o(s) registro(s)
 * @returns Resultado da operação
 */
export async function deleteRecordFromSupabase(
  table: string, 
  filter: Record<string, any>
): Promise<boolean> {
  try {
    await executeWithRetry(
      async (client) => {
        let query = client
          .from(table)
          .delete();
        
        // Aplicar filtros
        Object.entries(filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
        
        const { error } = await query;
        
        if (error) throw error;
        return true;
      },
      { 
        operationName: `Exclusão em ${table}`,
        fallbackToAdmin: true 
      }
    );
    
    return true;
  } catch (error) {
    console.error(`[SupabaseAdapter] Erro ao excluir de ${table}, salvando operação para retry:`, error);
    
    // Salvar operação para tentativa posterior
    addPendingOperation({
      table,
      operation: 'delete',
      data: {},
      filter
    });
    
    // Se disponível, excluir no PostgreSQL local também como backup
    try {
      let whereClause = '';
      const values = [];
      
      if (Object.keys(filter).length > 0) {
        whereClause = 'WHERE ' + Object.keys(filter)
          .map((key, i) => `${key} = $${i + 1}`)
          .join(' AND ');
        
        values.push(...Object.values(filter));
      }
      
      const query = `
        DELETE FROM ${table}
        ${whereClause}
        RETURNING id
      `;
      
      await pool.query(query, values);
      return true;
    } catch (pgError) {
      console.error(`[SupabaseAdapter] Erro ao excluir no PostgreSQL local:`, pgError);
      return false;
    }
  }
}

/**
 * Busca registros no Supabase de forma resiliente
 * @param table Nome da tabela
 * @param options Opções de busca
 * @returns Registros encontrados
 */
export async function fetchRecordsFromSupabase(
  table: string,
  options: { 
    columns?: string; 
    filter?: Record<string, any>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
    single?: boolean;
  } = {}
): Promise<any> {
  try {
    const result = await executeWithRetry(
      async (client) => {
        let query = client
          .from(table)
          .select(options.columns || '*');
        
        // Aplicar filtros
        if (options.filter) {
          Object.entries(options.filter).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (typeof value === 'object' && 'op' in value && 'value' in value) {
                // Filtro avançado com operador personalizado
                const { op, value: filterValue } = value as unknown as { op: string; value: any };
                switch (op) {
                  case 'eq': query = query.eq(key, filterValue); break;
                  case 'neq': query = query.neq(key, filterValue); break;
                  case 'gt': query = query.gt(key, filterValue); break;
                  case 'gte': query = query.gte(key, filterValue); break;
                  case 'lt': query = query.lt(key, filterValue); break;
                  case 'lte': query = query.lte(key, filterValue); break;
                  case 'like': query = query.like(key, `%${filterValue}%`); break;
                  case 'ilike': query = query.ilike(key, `%${filterValue}%`); break;
                  case 'in': query = query.in(key, filterValue); break;
                  default: query = query.eq(key, filterValue);
                }
              } else {
                // Filtro simples por igualdade
                query = query.eq(key, value);
              }
            }
          });
        }
        
        // Aplicar ordenação
        if (options.order) {
          const { column, ascending = true } = options.order;
          query = query.order(column, { ascending });
        }
        
        // Aplicar limite
        if (options.limit) {
          query = query.limit(options.limit);
        }
        
        // Executar a consulta
        const { data, error } = options.single 
          ? await query.single() 
          : await query;
        
        if (error) throw error;
        return data;
      },
      { 
        operationName: `Consulta em ${table}`,
        fallbackToAdmin: false,
        logSuccess: false
      }
    );
    
    return result;
  } catch (error) {
    console.error(`[SupabaseAdapter] Erro ao consultar ${table}, tentando fallback:`, error);
    
    // Se estiver disponível, buscar no PostgreSQL local
    try {
      let query = `SELECT ${options.columns || '*'} FROM ${table}`;
      const values = [];
      let paramCount = 1;
      
      // Adicionar WHERE
      if (options.filter && Object.keys(options.filter).length > 0) {
        const conditions = [];
        
        for (const [key, value] of Object.entries(options.filter)) {
          if (value !== undefined && value !== null) {
            // Tratar diferentes tipos de filtros
            if (typeof value === 'object' && 'op' in value && 'value' in value) {
              const { op, value: filterValue } = value as unknown as { op: string; value: any };
              
              switch (op) {
                case 'eq': 
                  conditions.push(`${key} = $${paramCount++}`);
                  values.push(filterValue);
                  break;
                case 'neq': 
                  conditions.push(`${key} != $${paramCount++}`);
                  values.push(filterValue);
                  break;
                case 'gt': 
                  conditions.push(`${key} > $${paramCount++}`);
                  values.push(filterValue);
                  break;
                case 'gte': 
                  conditions.push(`${key} >= $${paramCount++}`);
                  values.push(filterValue);
                  break;
                case 'lt': 
                  conditions.push(`${key} < $${paramCount++}`);
                  values.push(filterValue);
                  break;
                case 'lte': 
                  conditions.push(`${key} <= $${paramCount++}`);
                  values.push(filterValue);
                  break;
                case 'like': 
                  conditions.push(`${key} LIKE $${paramCount++}`);
                  values.push(`%${filterValue}%`);
                  break;
                case 'ilike': 
                  conditions.push(`${key} ILIKE $${paramCount++}`);
                  values.push(`%${filterValue}%`);
                  break;
                case 'in': 
                  conditions.push(`${key} IN ($${paramCount++})`);
                  values.push(filterValue);
                  break;
                default:
                  conditions.push(`${key} = $${paramCount++}`);
                  values.push(filterValue);
              }
            } else {
              conditions.push(`${key} = $${paramCount++}`);
              values.push(value);
            }
          }
        }
        
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
      }
      
      // Adicionar ORDER BY
      if (options.order) {
        const { column, ascending = true } = options.order;
        query += ` ORDER BY ${column} ${ascending ? 'ASC' : 'DESC'}`;
      }
      
      // Adicionar LIMIT
      if (options.limit) {
        query += ` LIMIT ${options.limit}`;
      }
      
      const pgResult = await pool.query(query, values);
      
      return options.single ? pgResult.rows[0] : pgResult.rows;
    } catch (pgError) {
      console.error(`[SupabaseAdapter] Erro ao consultar no PostgreSQL local:`, pgError);
      // Retorna array vazio ou null se single
      return options.single ? null : [];
    }
  }
}

// Interface simplificada do adaptador
export default {
  insert: insertRecordToSupabase,
  update: updateRecordInSupabase,
  delete: deleteRecordFromSupabase,
  fetch: fetchRecordsFromSupabase,
};