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
 * Script para verificar e relatar incompatibilidades de tabelas entre Replit e Supabase
 * 
 * Obs: Esta versão não usa a função execute_sql para criação de tabelas.
 * Ela analisa quais tabelas existem e gera comandos SQL que podem ser executados
 * manualmente no Console SQL do Supabase.
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

    // 3. Verificar tabelas faltantes baseado no mapeamento
    const missingTables = [];
    const sqlCommands = [];
    const checkedTables = [];
    
    // Definições das tabelas que precisamos
    const tableDefinitions = {
      'status_tanques': {
        columns: [
          { name: 'id', type: 'SERIAL PRIMARY KEY' },
          { name: 'posto', type: 'TEXT NOT NULL' },
          { name: 'diesel_capacidade', type: 'NUMERIC NOT NULL DEFAULT 20000' },
          { name: 'diesel_nivel', type: 'NUMERIC NOT NULL DEFAULT 15000' },
          { name: 'arla_capacidade', type: 'NUMERIC NOT NULL DEFAULT 1000' },
          { name: 'arla_nivel', type: 'NUMERIC NOT NULL DEFAULT 750' },
          { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP' }
        ]
      },
      'controle_patio': {
        columns: [
          { name: 'id', type: 'SERIAL PRIMARY KEY' },
          { name: 'posto', type: 'TEXT NOT NULL' },
          { name: 'placa', type: 'TEXT NOT NULL' },
          { name: 'motorista', type: 'TEXT NOT NULL' },
          { name: 'data_entrada', type: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP' },
          { name: 'data_saida', type: 'TIMESTAMP WITH TIME ZONE' },
          { name: 'status', type: "TEXT NOT NULL DEFAULT 'no_patio'" },
          { name: 'observacoes', type: 'TEXT' },
          { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP' }
        ]
      },
      'abastecimentos_postos': {
        columns: [
          { name: 'id', type: 'SERIAL PRIMARY KEY' },
          { name: 'posto', type: 'TEXT NOT NULL' },
          { name: 'placa', type: 'TEXT NOT NULL' },
          { name: 'tipo_produto', type: 'TEXT NOT NULL' },
          { name: 'litros', type: 'NUMERIC NOT NULL' },
          { name: 'data_abastecimento', type: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP' },
          { name: 'km', type: 'NUMERIC' },
          { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP' }
        ]
      },
      'recebimentos_combustivel': {
        columns: [
          { name: 'id', type: 'SERIAL PRIMARY KEY' },
          { name: 'posto', type: 'TEXT NOT NULL' },
          { name: 'tipo_produto', type: 'TEXT NOT NULL' },
          { name: 'litros_recebidos', type: 'NUMERIC NOT NULL' },
          { name: 'data_recebimento', type: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP' },
          { name: 'nota_fiscal', type: 'TEXT' },
          { name: 'fornecedor', type: 'TEXT' },
          { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP' }
        ]
      }
    };

    // Primeiro, verificar se a tabela status_tanques existe, e se não, verificar se 'tanques' existe
    if (!existingTables.includes('status_tanques')) {
      if (existingTables.includes('tanques')) {
        console.log("A tabela 'tanques' existe no Supabase e será usada como 'status_tanques'");
        checkedTables.push('status_tanques');
        
        // Verificar se a tabela 'tanques' tem todas as colunas necessárias
        await ensureColumnsExist(supabase, 'tanques', [
          { name: 'diesel_capacidade', type: 'numeric', isNullable: false },
          { name: 'diesel_nivel', type: 'numeric', isNullable: false },
          { name: 'arla_capacidade', type: 'numeric', isNullable: false },
          { name: 'arla_nivel', type: 'numeric', isNullable: false },
          { name: 'posto', type: 'text', isNullable: false }
        ]);
      } else {
        // A tabela status_tanques não existe e precisa ser criada
        console.log("A tabela 'status_tanques' não foi encontrada no Supabase.");
        missingTables.push('status_tanques');
        
        // Gerar SQL para criar a tabela
        let sql = `CREATE TABLE IF NOT EXISTS status_tanques (`;
        sql += tableDefinitions.status_tanques.columns.map(col => `${col.name} ${col.type}`).join(', ');
        sql += `);`;
        sqlCommands.push(sql);
      }
    } else {
      checkedTables.push('status_tanques');
    }

    // Verificar a tabela controle_patio
    if (!existingTables.includes('controle_patio')) {
      console.log("A tabela 'controle_patio' não foi encontrada no Supabase.");
      missingTables.push('controle_patio');
      
      // Gerar SQL para criar a tabela
      let sql = `CREATE TABLE IF NOT EXISTS controle_patio (`;
      sql += tableDefinitions.controle_patio.columns.map(col => `${col.name} ${col.type}`).join(', ');
      sql += `);`;
      sqlCommands.push(sql);
    } else {
      checkedTables.push('controle_patio');
      await ensureColumnsExist(supabase, 'controle_patio', [
        { name: 'posto', type: 'text', isNullable: false },
        { name: 'placa', type: 'text', isNullable: false },
        { name: 'motorista', type: 'text', isNullable: false },
        { name: 'data_entrada', type: 'timestamp with time zone', isNullable: false },
        { name: 'data_saida', type: 'timestamp with time zone', isNullable: true },
        { name: 'status', type: 'text', isNullable: false },
        { name: 'observacoes', type: 'text', isNullable: true }
      ]);
    }

    // Verificar a tabela abastecimentos_postos
    if (!existingTables.includes('abastecimentos_postos')) {
      if (existingTables.includes('abastecimentos')) {
        console.log("A tabela 'abastecimentos' existe no Supabase e será usada como 'abastecimentos_postos'");
        checkedTables.push('abastecimentos_postos');
        
        // Verificar se a tabela 'abastecimentos' tem todas as colunas necessárias
        await ensureColumnsExist(supabase, 'abastecimentos', [
          { name: 'posto', type: 'text', isNullable: false },
          { name: 'placa', type: 'text', isNullable: false },
          { name: 'tipo_produto', type: 'text', isNullable: false },
          { name: 'litros', type: 'numeric', isNullable: false },
          { name: 'data_abastecimento', type: 'timestamp with time zone', isNullable: false },
          { name: 'km', type: 'numeric', isNullable: true }
        ]);
      } else {
        // A tabela abastecimentos_postos não existe e precisa ser criada
        console.log("A tabela 'abastecimentos_postos' não foi encontrada no Supabase.");
        missingTables.push('abastecimentos_postos');
        
        // Gerar SQL para criar a tabela
        let sql = `CREATE TABLE IF NOT EXISTS abastecimentos_postos (`;
        sql += tableDefinitions.abastecimentos_postos.columns.map(col => `${col.name} ${col.type}`).join(', ');
        sql += `);`;
        sqlCommands.push(sql);
      }
    } else {
      checkedTables.push('abastecimentos_postos');
    }

    // Verificar a tabela recebimentos_combustivel
    if (!existingTables.includes('recebimentos_combustivel')) {
      console.log("A tabela 'recebimentos_combustivel' não foi encontrada no Supabase.");
      missingTables.push('recebimentos_combustivel');
      
      // Gerar SQL para criar a tabela
      let sql = `CREATE TABLE IF NOT EXISTS recebimentos_combustivel (`;
      sql += tableDefinitions.recebimentos_combustivel.columns.map(col => `${col.name} ${col.type}`).join(', ');
      sql += `);`;
      sqlCommands.push(sql);
    } else {
      checkedTables.push('recebimentos_combustivel');
      await ensureColumnsExist(supabase, 'recebimentos_combustivel', [
        { name: 'posto', type: 'text', isNullable: false },
        { name: 'tipo_produto', type: 'text', isNullable: false },
        { name: 'litros_recebidos', type: 'numeric', isNullable: false },
        { name: 'data_recebimento', type: 'timestamp with time zone', isNullable: false },
        { name: 'nota_fiscal', type: 'text', isNullable: true },
        { name: 'fornecedor', type: 'text', isNullable: true }
      ]);
    }

    // Informar sobre os comandos SQL para criação de tabelas faltantes
    if (missingTables.length > 0) {
      console.log(`Foram encontradas ${missingTables.length} tabelas faltantes: ${missingTables.join(', ')}`);
      console.log("Execute os seguintes comandos SQL no Console do Supabase para criar as tabelas faltantes:");
      sqlCommands.forEach(cmd => console.log(`\n${cmd}`));
    } else {
      console.log("Todas as tabelas necessárias já existem no Supabase!");
    }

    console.log(`Sincronização concluída: ${checkedTables.length} tabela(s) verificadas, ${missingTables.length} tabela(s) faltantes`);
    return {
      success: true,
      tablesCreated: 0,  // Não criamos tabelas automaticamente
      errors: 0,
      missingTables,
      sqlCommands,
      checkedTables
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
 * Obtém a lista de tabelas existentes no Supabase 
 * 
 * Obs: Esta função não usa mais execute_sql e sempre usa a abordagem alternativa
 * que verifica a existência de cada tabela individualmente, pois a função SQL
 * pode não estar disponível em todos os projetos Supabase.
 */
async function getExistingTables(supabase: SupabaseClient): Promise<string[]> {
  console.log("Verificando tabelas existentes via abordagem alternativa...");
  return getExistingTablesAlternative(supabase);
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
 * 
 * Esta versão não usa a função execute_sql e trabalha com os dados diretamente.
 * Limitação: Não é possível adicionar colunas diretamente via API Supabase,
 * então só verificamos se as colunas existem.
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
    console.log(`Verificando estrutura da tabela ${tableName}...`);
    
    // Tentamos buscar um registro para analisar a estrutura
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`Erro ao acessar tabela ${tableName}:`, error);
      return false;
    }
    
    // Se temos dados, podemos verificar as colunas
    if (data && data.length > 0) {
      const existingColumns = Object.keys(data[0]);
      console.log(`Colunas existentes na tabela ${tableName}:`, existingColumns);
      
      // Verificar quais colunas estão faltando
      const missingColumns = requiredColumns.filter(col => 
        !existingColumns.includes(col.name)
      );
      
      if (missingColumns.length > 0) {
        console.log(`Atenção: As seguintes colunas estão faltando na tabela ${tableName}:`, 
          missingColumns.map(col => col.name));
        console.log(`Não é possível adicionar colunas automaticamente via API Supabase.`);
        console.log(`Recomendamos adicionar estas colunas manualmente no console SQL do Supabase.`);
        
        for (const column of missingColumns) {
          console.log(`SQL para adicionar coluna: ALTER TABLE ${tableName} ADD COLUMN ${column.name} ${column.type};`);
        }
      } else {
        console.log(`A tabela ${tableName} possui todas as colunas necessárias.`);
      }
    } else {
      console.log(`A tabela ${tableName} existe, mas está vazia. Não é possível verificar colunas.`);
    }
    
    return true;
  } catch (error) {
    console.error(`Erro ao verificar estrutura da tabela ${tableName}:`, error);
    return false;
  }
}