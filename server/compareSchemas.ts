import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { db } from './db';
import { sql } from 'drizzle-orm';

// Configuração Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';

// Função auxiliar para criar cliente Supabase
function createSupabaseClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

/**
 * Compara os esquemas entre Replit PostgreSQL e Supabase
 */
export async function compareSchemas() {
  try {
    console.log("Iniciando comparação de esquemas entre Replit PostgreSQL e Supabase...");
    
    // Obter tabelas do Replit
    const replitTables = await getPostgresqlTables();
    
    // Obter tabelas do Supabase
    const supabaseTables = await getSupabaseTables();
    
    // Comparar tabelas
    const comparison = {
      replitTables,
      supabaseTables,
      onlyInReplit: replitTables.filter(table => !supabaseTables.includes(table)),
      onlyInSupabase: supabaseTables.filter(table => !replitTables.includes(table)),
      inBoth: replitTables.filter(table => supabaseTables.includes(table))
    };
    
    // Obter colunas de tabelas que existem em ambos
    const columnComparison: Record<string, any> = {};
    
    for (const table of comparison.inBoth) {
      const replitColumns = await getPostgresqlTableColumns(table);
      const supabaseColumns = await getSupabaseTableColumns(table);
      
      columnComparison[table] = {
        replitColumns,
        supabaseColumns,
        onlyInReplit: replitColumns.filter(col => !supabaseColumns.includes(col)),
        onlyInSupabase: supabaseColumns.filter(col => !replitColumns.includes(col)),
        inBoth: replitColumns.filter(col => supabaseColumns.includes(col))
      };
    }
    
    return {
      tableComparison: comparison,
      columnComparison
    };
  } catch (error) {
    console.error("Erro ao comparar esquemas:", error);
    return {
      error: String(error),
      message: "Falha ao comparar esquemas"
    };
  }
}

/**
 * Obtém lista de tabelas do PostgreSQL do Replit
 */
async function getPostgresqlTables(): Promise<string[]> {
  try {
    const result = await db.execute(sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    return result.rows.map((row: any) => row.tablename).sort();
  } catch (error) {
    console.error("Erro ao obter tabelas do PostgreSQL:", error);
    return [];
  }
}

/**
 * Obtém lista de colunas de uma tabela específica do PostgreSQL do Replit
 */
async function getPostgresqlTableColumns(tableName: string): Promise<string[]> {
  try {
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = ${tableName}
    `);
    
    return result.rows.map((row: any) => row.column_name).sort();
  } catch (error) {
    console.error(`Erro ao obter colunas da tabela ${tableName} do PostgreSQL:`, error);
    return [];
  }
}

/**
 * Obtém lista de tabelas do Supabase
 */
async function getSupabaseTables(): Promise<string[]> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (error) {
      console.error("Erro ao obter tabelas do Supabase:", error);
      return [];
    }
    
    return data.map(row => row.tablename).sort();
  } catch (error) {
    console.error("Erro ao obter tabelas do Supabase:", error);
    return [];
  }
}

/**
 * Obtém lista de colunas de uma tabela específica do Supabase
 */
async function getSupabaseTableColumns(tableName: string): Promise<string[]> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName);
    
    if (error) {
      console.error(`Erro ao obter colunas da tabela ${tableName} do Supabase:`, error);
      return [];
    }
    
    return data.map(row => row.column_name).sort();
  } catch (error) {
    console.error(`Erro ao obter colunas da tabela ${tableName} do Supabase:`, error);
    return [];
  }
}