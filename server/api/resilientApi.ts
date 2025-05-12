/**
 * API cliente resiliente para o Supabase
 * Implementa operações de persistência com comportamento resiliente
 * para garantir que dados sejam salvos mesmo com problemas de conexão
 */

import supabaseAdapter from '../adapters/supabaseStorageAdapter';
import { checkSupabaseConnection } from '../utils/supabaseConnection';

/**
 * Classe para operações resilientes de banco de dados
 */
class ResilientDataService {
  /**
   * Verifica a conexão com o Supabase
   * @returns Status da conexão
   */
  async checkConnection(): Promise<boolean> {
    return await checkSupabaseConnection();
  }

  /**
   * Insere um registro em uma tabela
   * @param table Nome da tabela
   * @param data Dados a serem inseridos
   * @returns Resultado da operação
   */
  async insertRecord<T extends Record<string, any>>(table: string, data: T): Promise<T> {
    try {
      console.log(`[ResilientAPI] Inserindo registro em ${table}`);
      const result = await supabaseAdapter.insert(table, data);
      return result as T;
    } catch (error) {
      console.error(`[ResilientAPI] Erro ao inserir em ${table}:`, error);
      throw error;
    }
  }

  /**
   * Atualiza um registro em uma tabela
   * @param table Nome da tabela
   * @param id ID do registro
   * @param data Dados a serem atualizados
   * @param idField Nome do campo de ID (padrão: 'id')
   * @returns Resultado da operação
   */
  async updateRecord<T extends Record<string, any>>(
    table: string, 
    id: number | string, 
    data: Partial<T>,
    idField: string = 'id'
  ): Promise<T> {
    try {
      console.log(`[ResilientAPI] Atualizando registro em ${table} com ${idField}=${id}`);
      const filter = { [idField]: id };
      const result = await supabaseAdapter.update(table, data, filter);
      return result as T;
    } catch (error) {
      console.error(`[ResilientAPI] Erro ao atualizar em ${table}:`, error);
      throw error;
    }
  }

  /**
   * Exclui um registro de uma tabela
   * @param table Nome da tabela
   * @param id ID do registro
   * @param idField Nome do campo de ID (padrão: 'id')
   * @returns Resultado da operação
   */
  async deleteRecord(
    table: string, 
    id: number | string,
    idField: string = 'id'
  ): Promise<boolean> {
    try {
      console.log(`[ResilientAPI] Excluindo registro de ${table} com ${idField}=${id}`);
      const filter = { [idField]: id };
      return await supabaseAdapter.delete(table, filter);
    } catch (error) {
      console.error(`[ResilientAPI] Erro ao excluir de ${table}:`, error);
      throw error;
    }
  }

  /**
   * Busca registros em uma tabela
   * @param table Nome da tabela
   * @param options Opções de busca
   * @returns Registros encontrados
   */
  async getRecords<T>(
    table: string,
    options: { 
      columns?: string; 
      filter?: Record<string, any>;
      order?: { column: string; ascending?: boolean };
      limit?: number;
    } = {}
  ): Promise<T[]> {
    try {
      return await supabaseAdapter.fetch(table, { ...options, single: false }) as T[];
    } catch (error) {
      console.error(`[ResilientAPI] Erro ao buscar registros de ${table}:`, error);
      throw error;
    }
  }

  /**
   * Busca um registro em uma tabela
   * @param table Nome da tabela
   * @param id ID do registro
   * @param options Opções de busca
   * @returns Registro encontrado ou null
   */
  async getRecordById<T>(
    table: string,
    id: number | string,
    options: {
      columns?: string;
      idField?: string;
    } = {}
  ): Promise<T | null> {
    try {
      const { columns = '*', idField = 'id' } = options;
      const filter = { [idField]: id };
      
      return await supabaseAdapter.fetch(table, {
        columns,
        filter,
        single: true
      }) as T;
    } catch (error) {
      console.error(`[ResilientAPI] Erro ao buscar registro por ID de ${table}:`, error);
      throw error;
    }
  }

  /**
   * Busca um registro em uma tabela por um filtro personalizado
   * @param table Nome da tabela
   * @param filter Filtro para a busca
   * @param options Opções de busca
   * @returns Registro encontrado ou null
   */
  async getRecordByFilter<T>(
    table: string,
    filter: Record<string, any>,
    options: {
      columns?: string;
    } = {}
  ): Promise<T | null> {
    try {
      const { columns = '*' } = options;
      
      return await supabaseAdapter.fetch(table, {
        columns,
        filter,
        single: true
      }) as T;
    } catch (error) {
      console.error(`[ResilientAPI] Erro ao buscar registro por filtro de ${table}:`, error);
      throw error;
    }
  }

  /**
   * Conta registros em uma tabela
   * @param table Nome da tabela
   * @param filter Filtro opcional
   * @returns Número de registros
   */
  async countRecords(
    table: string,
    filter?: Record<string, any>
  ): Promise<number> {
    try {
      const result = await supabaseAdapter.fetch(table, {
        columns: 'count(*)',
        filter,
        single: true
      });
      
      if (result && typeof result.count === 'number') {
        return result.count;
      }
      
      // Fallback: buscar todos os registros e contar
      const records = await supabaseAdapter.fetch(table, {
        filter
      });
      
      return Array.isArray(records) ? records.length : 0;
    } catch (error) {
      console.error(`[ResilientAPI] Erro ao contar registros de ${table}:`, error);
      return 0;
    }
  }

  /**
   * Verifica se um registro existe em uma tabela
   * @param table Nome da tabela
   * @param filter Filtro para a verificação
   * @returns Verdadeiro se o registro existir
   */
  async recordExists(
    table: string,
    filter: Record<string, any>
  ): Promise<boolean> {
    try {
      const count = await this.countRecords(table, filter);
      return count > 0;
    } catch (error) {
      console.error(`[ResilientAPI] Erro ao verificar existência em ${table}:`, error);
      return false;
    }
  }

  /**
   * Busca registros em uma tabela com paginação
   * @param table Nome da tabela
   * @param page Número da página (começando em 1)
   * @param pageSize Tamanho da página
   * @param options Opções de busca
   * @returns Registros paginados e contagem total
   */
  async getPaginatedRecords<T>(
    table: string,
    page: number = 1,
    pageSize: number = 10,
    options: {
      columns?: string;
      filter?: Record<string, any>;
      order?: { column: string; ascending?: boolean };
    } = {}
  ): Promise<{ data: T[]; total: number }> {
    try {
      const { columns = '*', filter, order } = options;
      
      // Buscar contagem total
      const total = await this.countRecords(table, filter);
      
      // Calcular offset
      const offset = (page - 1) * pageSize;
      
      // Buscar registros paginados
      const data = await this.getRecords<T>(table, {
        columns,
        filter,
        order,
        limit: pageSize
      });
      
      return { data, total };
    } catch (error) {
      console.error(`[ResilientAPI] Erro ao buscar registros paginados de ${table}:`, error);
      return { data: [], total: 0 };
    }
  }
}

// Exportar uma instância única do serviço
export const resilientDataService = new ResilientDataService();

// Exportar a classe para quem precisar estendê-la
export { ResilientDataService };