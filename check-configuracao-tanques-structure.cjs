/**
 * Script para verificar a estrutura da tabela configuracao_tanques_socorro_v2 no Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

// Validando configurações
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_SERVICE_KEY não definidas');
  process.exit(1);
}

// Inicializando o cliente Supabase
console.log(`🔄 Conectando ao Supabase: ${supabaseUrl.substring(0, 15)}...`);
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  try {
    // Verificar estrutura da tabela configuracao_tanques
    console.log('🔎 Verificando a estrutura da tabela configuracao_tanques_socorro_v2...');
    
    // Executar SQL para obter estrutura da tabela
    const { data: columns, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'configuracao_tanques_socorro_v2'
        ORDER BY ordinal_position;
      `
    });
    
    if (error) {
      console.error('❌ Erro ao buscar estrutura da tabela:', error);
      
      // Tentar criar a função exec_sql se ela não existir
      if (error.message.includes("function \"exec_sql\" does not exist")) {
        console.log('⚠️ A função exec_sql não existe. Vamos verificar usando a API do Supabase.');
        
        // Tentar buscar registros da tabela para inferir sua estrutura
        const { data, error: fetchError } = await supabase
          .from('configuracao_tanques_socorro_v2')
          .select('*')
          .limit(1);
        
        if (fetchError) {
          console.error('❌ Erro ao buscar dados da tabela:', fetchError);
          
          if (fetchError.code === 'PGRST116') {
            console.log('❌ A tabela configuracao_tanques_socorro_v2 não existe no Supabase.');
          }
        } else {
          console.log('✅ Conseguimos buscar dados da tabela. Aqui está a estrutura inferida:');
          
          if (data && data.length > 0) {
            const sample = data[0];
            console.log('📋 Colunas disponíveis:');
            
            for (const [key, value] of Object.entries(sample)) {
              console.log(`  - ${key}: ${typeof value} ${value === null ? '(null)' : ''}`);
            }
          } else {
            console.log('⚠️ A tabela existe, mas não tem registros para inferir sua estrutura.');
          }
        }
      }
      
      // Consultar as tabelas existentes no banco
      console.log('\n🔍 Buscando tabelas relacionadas a tanques...');
      
      const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
        sql_query: `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name LIKE '%tanque%'
          ORDER BY table_name;
        `
      });
      
      if (tablesError) {
        console.error('❌ Erro ao buscar tabelas:', tablesError);
      } else if (tables) {
        console.log('📋 Tabelas encontradas:');
        tables.forEach(t => {
          console.log(`  - ${t.table_name}`);
        });
      }
      
      return;
    }
    
    console.log('✅ Estrutura da tabela encontrada:');
    console.log('📋 Colunas:');
    
    if (columns && columns.length > 0) {
      columns.forEach(column => {
        console.log(`  - ${column.column_name}: ${column.data_type}${column.character_maximum_length ? `(${column.character_maximum_length})` : ''}`);
      });
    } else {
      console.log('⚠️ Nenhuma coluna encontrada na tabela.');
    }
    
    // Verificar registros da tabela
    console.log('\n🔍 Buscando amostra de registros...');
    
    const { data: records, error: recordsError } = await supabase
      .from('configuracao_tanques_socorro_v2')
      .select('*')
      .limit(5);
    
    if (recordsError) {
      console.error('❌ Erro ao buscar registros:', recordsError);
    } else {
      console.log(`✅ ${records.length} registros encontrados.`);
      
      if (records.length > 0) {
        console.log('\n📊 Amostra do primeiro registro:');
        console.log(JSON.stringify(records[0], null, 2));
      }
    }
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

main();