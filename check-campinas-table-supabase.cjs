/**
 * Script para verificar se a tabela campinas_budget_requests existe no Supabase
 * e mostrar informações sobre ela
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
    console.log('🔎 Verificando se a tabela campinas_budget_requests existe no Supabase...');
    
    // Verificar se a tabela existe
    const { data: tables, error: tableError } = await supabase
      .from('campinas_budget_requests')
      .select('*')
      .limit(1);
    
    if (tableError) {
      if (tableError.code === 'PGRST116') {
        console.log('❌ Tabela campinas_budget_requests NÃO existe no Supabase');
        console.log('⚠️ O erro sugere que a tabela precisa ser criada.');
        console.log(`⚙️ Detalhes do erro: ${tableError.message}`);
        console.log('');
        console.log('🔧 Você pode criar a tabela executando o script create-base-campinas-tables-supabase.js');
      } else {
        console.error('❌ Erro ao verificar tabela:', tableError);
      }
      return;
    }
    
    console.log('✅ Tabela campinas_budget_requests EXISTE no Supabase');
    
    // Obter contagem de registros
    const { count, error: countError } = await supabase
      .from('campinas_budget_requests')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Erro ao contar registros:', countError);
      return;
    }
    
    console.log(`📊 Total de registros: ${count}`);
    
    // Obter amostra de registros
    const { data: records, error: recordsError } = await supabase
      .from('campinas_budget_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recordsError) {
      console.error('❌ Erro ao obter registros:', recordsError);
      return;
    }
    
    console.log('📝 Amostra dos registros mais recentes:');
    
    if (records.length === 0) {
      console.log('  Nenhum registro encontrado na tabela.');
    } else {
      records.forEach(record => {
        console.log(`  - ID: ${record.id}, Título: ${record.title}, Solicitante: ${record.requester_name}, Status: ${record.status}, Base: ${record.base_name || 'N/A'}`);
      });
    }
    
    console.log('✅ Verificação concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

main();