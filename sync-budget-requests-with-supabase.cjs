/**
 * Script para sincronizar as solicitações de orçamento entre o PostgreSQL local e o Supabase
 * 
 * Este script verifica se todos os registros da tabela campinas_budget_requests 
 * no banco PostgreSQL local existem no Supabase e os sincroniza se necessário.
 */

const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do PostgreSQL local
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_SERVICE_KEY não definidas');
  process.exit(1);
}

// Inicializando o cliente Supabase
console.log(`🔄 Conectando ao Supabase: ${supabaseUrl.substring(0, 15)}...`);
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncBudgetRequests() {
  try {
    console.log('📊 Iniciando sincronização das solicitações de orçamento com o Supabase...');

    // 1. Buscar todos os registros do PostgreSQL local
    console.log('🔍 Obtendo registros do PostgreSQL local...');
    const localQuery = 'SELECT * FROM campinas_budget_requests ORDER BY id';
    const localResult = await pool.query(localQuery);
    
    const localRequests = localResult.rows;
    console.log(`✅ Encontrados ${localRequests.length} registros no PostgreSQL local`);

    if (localRequests.length === 0) {
      console.log('ℹ️ Não há registros para sincronizar.');
      return;
    }

    // 2. Verificar cada registro no Supabase
    console.log('🔍 Verificando registros no Supabase...');
    let syncedCount = 0;
    let errorCount = 0;

    for (const request of localRequests) {
      // Verificar se o registro já existe no Supabase
      const { data: existingRecords, error: checkError } = await supabase
        .from('campinas_budget_requests')
        .select('id')
        .eq('id', request.id)
        .maybeSingle();

      if (checkError) {
        console.error(`❌ Erro ao verificar registro #${request.id} no Supabase:`, checkError);
        errorCount++;
        continue;
      }

      if (existingRecords) {
        console.log(`✓ Registro #${request.id} já existe no Supabase`);
        
        // Atualizar o registro para garantir que está sincronizado
        const { error: updateError } = await supabase
          .from('campinas_budget_requests')
          .update(request)
          .eq('id', request.id);
        
        if (updateError) {
          console.error(`❌ Erro ao atualizar registro #${request.id} no Supabase:`, updateError);
          errorCount++;
        } else {
          console.log(`✓ Registro #${request.id} atualizado no Supabase`);
          syncedCount++;
        }
      } else {
        // Inserir o registro no Supabase
        const { error: insertError } = await supabase
          .from('campinas_budget_requests')
          .insert(request);
        
        if (insertError) {
          console.error(`❌ Erro ao inserir registro #${request.id} no Supabase:`, insertError);
          errorCount++;
        } else {
          console.log(`✓ Registro #${request.id} inserido no Supabase`);
          syncedCount++;
        }
      }
    }

    // 3. Resumo da sincronização
    console.log('\n📋 Resumo da sincronização:');
    console.log(`  - Total de registros processados: ${localRequests.length}`);
    console.log(`  - Registros sincronizados com sucesso: ${syncedCount}`);
    console.log(`  - Erros de sincronização: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('✅ Sincronização concluída com sucesso!');
    } else {
      console.log('⚠️ Sincronização concluída com erros.');
    }

  } catch (error) {
    console.error('❌ Erro ao sincronizar solicitações de orçamento:', error);
  } finally {
    // Fechar a conexão com o PostgreSQL
    await pool.end();
  }
}

// Executar a sincronização
syncBudgetRequests();