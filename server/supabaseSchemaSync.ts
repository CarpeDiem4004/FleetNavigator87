import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
 * Script para criar tabelas faltantes no Supabase
 * Baseado na análise de esquemas Replit vs Supabase
 */
export async function synchronizeSupabaseTables() {
  try {
    console.log("Iniciando sincronização de esquemas com o Supabase...");
    
    const supabase = createSupabaseClient();
    
    // 1. Mapeamento entre nomes de tabelas no Replit e no Supabase
    const tableMapping = {
      'status_tanques': 'tanques',                // Tabela existente que precisa ser mapeada
      'controle_patio': 'controle_patio',         // Tabela que precisa ser criada
      'abastecimentos_postos': 'abastecimentos',  // Tabela existente que precisa ser mapeada
      'recebimentos_combustivel': 'recebimentos_combustivel' // Tabela que precisa ser criada
    };

    // 2. Verificar quais tabelas existem no Supabase
    const existingTables = await getExistingTables(supabase);
    console.log("Tabelas existentes no Supabase:", existingTables);

    // 3. Criar tabelas faltantes baseado no mapeamento
    let createdTables = 0;
    let errors = 0;

    // Primeiro, verificar se a tabela status_tanques existe, e se não, verificar se 'tanques' existe
    if (!existingTables.includes('status_tanques')) {
      if (existingTables.includes('tanques')) {
        console.log("A tabela 'tanques' existe no Supabase e será usada como 'status_tanques'");
        
        // Verificar se a tabela 'tanques' tem todas as colunas necessárias
        await ensureColumnsExist(supabase, 'tanques', [
          { name: 'diesel_capacidade', type: 'numeric', isNullable: false, defaultValue: '20000' },
          { name: 'diesel_nivel', type: 'numeric', isNullable: false, defaultValue: '15000' },
          { name: 'arla_capacidade', type: 'numeric', isNullable: false, defaultValue: '1000' },
          { name: 'arla_nivel', type: 'numeric', isNullable: false, defaultValue: '750' },
          { name: 'posto', type: 'text', isNullable: false }
        ]);

      } else {
        // Criar a tabela status_tanques no Supabase
        console.log("Criando tabela 'status_tanques'...");
        try {
          const { error } = await supabase.rpc('execute_sql', {
            sql_query: `
              CREATE TABLE IF NOT EXISTS status_tanques (
                id SERIAL PRIMARY KEY,
                posto TEXT NOT NULL,
                diesel_capacidade NUMERIC NOT NULL DEFAULT 20000,
                diesel_nivel NUMERIC NOT NULL DEFAULT 15000,
                arla_capacidade NUMERIC NOT NULL DEFAULT 1000,
                arla_nivel NUMERIC NOT NULL DEFAULT 750,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
              );
            `
          });

          if (error) {
            console.error("Erro ao criar tabela 'status_tanques':", error);
            errors++;
          } else {
            console.log("Tabela 'status_tanques' criada com sucesso!");
            createdTables++;
          }
        } catch (error) {
          console.error("Exceção ao criar tabela 'status_tanques':", error);
          errors++;
        }
      }
    }

    // Criar tabela controle_patio se não existir
    if (!existingTables.includes('controle_patio')) {
      console.log("Criando tabela 'controle_patio'...");
      try {
        const { error } = await supabase.rpc('execute_sql', {
          sql_query: `
            CREATE TABLE IF NOT EXISTS controle_patio (
              id SERIAL PRIMARY KEY,
              posto TEXT NOT NULL,
              placa TEXT NOT NULL,
              motorista TEXT NOT NULL,
              data_entrada TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              data_saida TIMESTAMP WITH TIME ZONE,
              status TEXT NOT NULL DEFAULT 'no_patio',
              observacoes TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
          `
        });

        if (error) {
          console.error("Erro ao criar tabela 'controle_patio':", error);
          errors++;
        } else {
          console.log("Tabela 'controle_patio' criada com sucesso!");
          createdTables++;
        }
      } catch (error) {
        console.error("Exceção ao criar tabela 'controle_patio':", error);
        errors++;
      }
    }

    // Verificar se a tabela abastecimentos_postos existe, ou se 'abastecimentos' existe
    if (!existingTables.includes('abastecimentos_postos')) {
      if (existingTables.includes('abastecimentos')) {
        console.log("A tabela 'abastecimentos' existe no Supabase e será usada como 'abastecimentos_postos'");
        
        // Verificar se a tabela 'abastecimentos' tem todas as colunas necessárias
        await ensureColumnsExist(supabase, 'abastecimentos', [
          { name: 'posto', type: 'text', isNullable: false },
          { name: 'placa', type: 'text', isNullable: false },
          { name: 'tipo_produto', type: 'text', isNullable: false },
          { name: 'litros', type: 'numeric', isNullable: false },
          { name: 'data_abastecimento', type: 'timestamp with time zone', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
          { name: 'km', type: 'numeric', isNullable: true }
        ]);

      } else {
        // Criar a tabela abastecimentos_postos no Supabase
        console.log("Criando tabela 'abastecimentos_postos'...");
        try {
          const { error } = await supabase.rpc('execute_sql', {
            sql_query: `
              CREATE TABLE IF NOT EXISTS abastecimentos_postos (
                id SERIAL PRIMARY KEY,
                posto TEXT NOT NULL,
                placa TEXT NOT NULL,
                tipo_produto TEXT NOT NULL,
                litros NUMERIC NOT NULL,
                data_abastecimento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                km NUMERIC,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
              );
            `
          });

          if (error) {
            console.error("Erro ao criar tabela 'abastecimentos_postos':", error);
            errors++;
          } else {
            console.log("Tabela 'abastecimentos_postos' criada com sucesso!");
            createdTables++;
          }
        } catch (error) {
          console.error("Exceção ao criar tabela 'abastecimentos_postos':", error);
          errors++;
        }
      }
    }

    // Criar tabela recebimentos_combustivel se não existir
    if (!existingTables.includes('recebimentos_combustivel')) {
      console.log("Criando tabela 'recebimentos_combustivel'...");
      try {
        const { error } = await supabase.rpc('execute_sql', {
          sql_query: `
            CREATE TABLE IF NOT EXISTS recebimentos_combustivel (
              id SERIAL PRIMARY KEY,
              posto TEXT NOT NULL,
              tipo_produto TEXT NOT NULL,
              litros_recebidos NUMERIC NOT NULL,
              data_recebimento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              nota_fiscal TEXT,
              fornecedor TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
          `
        });

        if (error) {
          console.error("Erro ao criar tabela 'recebimentos_combustivel':", error);
          errors++;
        } else {
          console.log("Tabela 'recebimentos_combustivel' criada com sucesso!");
          createdTables++;
        }
      } catch (error) {
        console.error("Exceção ao criar tabela 'recebimentos_combustivel':", error);
        errors++;
      }
    }

    console.log(`Sincronização concluída: ${createdTables} tabela(s) criada(s), ${errors} erro(s)`);
    return {
      success: errors === 0,
      tablesCreated: createdTables,
      errors
    };
  } catch (error) {
    console.error("Erro na sincronização de tabelas:", error);
    return {
      success: false,
      error: String(error),
      tablesCreated: 0,
      errors: 1
    };
  }
}

/**
 * Obtém a lista de tabelas existentes no Supabase via SQL
 */
async function getExistingTables(supabase: SupabaseClient): Promise<string[]> {
  try {
    // Tentar listar tabelas através de SQL direto
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `
    });

    if (error) {
      console.error("Erro ao listar tabelas:", error);
      
      // Abordagem alternativa: tentar cada tabela que conhecemos
      return getExistingTablesAlternative(supabase);
    }

    // Extrair nomes das tabelas do resultado
    if (data && Array.isArray(data)) {
      return data.map((row: any) => row.table_name).filter(Boolean);
    }

    return [];
  } catch (error) {
    console.error("Exceção ao obter lista de tabelas:", error);
    return getExistingTablesAlternative(supabase);
  }
}

/**
 * Verifica existência de tabelas através de tentativas individuais
 */
async function getExistingTablesAlternative(supabase: SupabaseClient): Promise<string[]> {
  try {
    // Lista de possíveis tabelas que queremos verificar
    const tablesToCheck = [
      'tanques', 
      'status_tanques', 
      'controle_patio', 
      'abastecimentos', 
      'abastecimentos_postos',
      'recebimentos_combustivel'
    ];
    
    const existingTables: string[] = [];
    
    // Verificar cada tabela manualmente
    for (const table of tablesToCheck) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        // Se não houver erro, a tabela existe
        if (!error) {
          existingTables.push(table);
        }
      } catch (error) {
        // Ignorar erros - significa que a tabela não existe
        console.log(`Tabela ${table} não encontrada durante verificação alternativa`);
      }
    }
    
    return existingTables;
  } catch (error) {
    console.error("Erro na verificação alternativa de tabelas:", error);
    return [];
  }
}

/**
 * Verifica se as colunas necessárias existem em uma tabela e as adiciona se não existirem
 */
async function ensureColumnsExist(
  supabase: SupabaseClient,
  tableName: string,
  requiredColumns: Array<{
    name: string;
    type: string;
    isNullable: boolean;
    defaultValue?: string;
  }>
) {
  try {
    // Obter colunas existentes
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = '${tableName}'
          AND table_schema = 'public'
      `
    });

    if (error) {
      console.error(`Erro ao verificar colunas da tabela ${tableName}:`, error);
      return false;
    }

    const existingColumns = data.map((row: any) => row.column_name);
    console.log(`Colunas existentes na tabela ${tableName}:`, existingColumns);

    // Verificar quais colunas precisam ser adicionadas
    for (const column of requiredColumns) {
      if (!existingColumns.includes(column.name)) {
        console.log(`Adicionando coluna ${column.name} à tabela ${tableName}...`);
        
        let sql = `ALTER TABLE ${tableName} ADD COLUMN ${column.name} ${column.type}`;
        
        if (!column.isNullable) {
          if (column.defaultValue) {
            sql += ` NOT NULL DEFAULT ${column.defaultValue}`;
          } else {
            // Se a coluna não pode ser nula mas não tem valor padrão,
            // primeiro adicionamos como nulável e depois aplicamos a restrição
            sql += ` NULL`;
          }
        }
        
        const { error: alterError } = await supabase.rpc('execute_sql', {
          sql_query: sql
        });

        if (alterError) {
          console.error(`Erro ao adicionar coluna ${column.name}:`, alterError);
        } else {
          console.log(`Coluna ${column.name} adicionada com sucesso!`);
          
          // Se precisarmos definir NOT NULL depois
          if (!column.isNullable && !column.defaultValue) {
            // Primeiro definir valores para registros existentes
            const updateSql = `UPDATE ${tableName} SET ${column.name} = '' WHERE ${column.name} IS NULL`;
            await supabase.rpc('execute_sql', { sql_query: updateSql });
            
            // Depois adicionar restrição NOT NULL
            const notNullSql = `ALTER TABLE ${tableName} ALTER COLUMN ${column.name} SET NOT NULL`;
            await supabase.rpc('execute_sql', { sql_query: notNullSql });
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error(`Erro ao verificar/adicionar colunas da tabela ${tableName}:`, error);
    return false;
  }
}