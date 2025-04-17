import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, API_KEY } from '../constants/supabase';

// Inicializa o cliente Supabase
export const supabase = createClient(SUPABASE_URL.replace('/rest/v1', ''), API_KEY);

// Função para excluir um registro por ID
export async function deleteRecord(table: string, id: number) {
  console.log(`[SUPABASE] Excluindo registro com ID ${id} da tabela ${table}`);
  
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`[SUPABASE] Erro ao excluir registro:`, error);
    throw new Error(`Erro ao excluir: ${error.message}`);
  }
  
  console.log(`[SUPABASE] Registro excluído com sucesso:`, data);
  return data;
}

// Função para excluir múltiplos registros com base em um filtro
export async function deleteRecords(table: string, filterColumn: string, filterValue: any) {
  console.log(`[SUPABASE] Excluindo registros da tabela ${table} onde ${filterColumn}=${filterValue}`);
  
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq(filterColumn, filterValue);
  
  if (error) {
    console.error(`[SUPABASE] Erro ao excluir registros:`, error);
    throw new Error(`Erro ao excluir: ${error.message}`);
  }
  
  console.log(`[SUPABASE] Registros excluídos com sucesso:`, data);
  return data;
}

// Função para buscar registros
export async function fetchRecords(table: string, options: {
  filterColumn?: string;
  filterValue?: any;
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
} = {}) {
  console.log(`[SUPABASE] Buscando registros da tabela ${table}`);
  
  let query = supabase.from(table).select('*');
  
  // Aplicar filtro se fornecido
  if (options.filterColumn && options.filterValue !== undefined) {
    query = query.eq(options.filterColumn, options.filterValue);
  }
  
  // Aplicar ordenação se fornecida
  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: options.ascending ?? false });
  }
  
  // Aplicar limite se fornecido
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error(`[SUPABASE] Erro ao buscar registros:`, error);
    throw new Error(`Erro ao buscar dados: ${error.message}`);
  }
  
  console.log(`[SUPABASE] Registros recuperados:`, data?.length || 0);
  return data || [];
}