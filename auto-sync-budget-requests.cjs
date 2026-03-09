/**
 * Script para sincronização automática das solicitações de orçamento
 * entre o PostgreSQL local e o Supabase
 * 
 * Este script pode ser executado periodicamente através de um cron job
 * para manter os dados sincronizados entre os dois bancos de dados.
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

// Função para gerar um timestamp formatado
function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
}

// Função para registrar logs
function log(message) {
  console.log(`[${getTimestamp()}] ${message}`);
}

// Função principal de sincronização
async function syncBudgetRequests() {
  let client = null;
  
  try {
    log('📊 Iniciando sincronização automática das solicitações de orçamento...');

    // Obter uma conexão do pool
    client = await pool.connect();

    // 1. Verificar se as tabelas existem nos dois bancos
    log('🔍 Verificando a existência das tabelas...');
    
    // Verificar no PostgreSQL local
    const localTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'campinas_budget_requests'
      );
    `);
    
    const localTableExists = localTableCheck.rows[0].exists;
    
    if (!localTableExists) {
      log('❌ Tabela campinas_budget_requests não existe no PostgreSQL local. Sincronização abortada.');
      return;
    }
    
    // Verificar no Supabase
    const { error: supabaseTableError } = await supabase
      .from('campinas_budget_requests')
      .select('id')
      .limit(1);
    
    if (supabaseTableError && supabaseTableError.code === 'PGRST116') {
      log('❌ Tabela campinas_budget_requests não existe no Supabase. Sincronização abortada.');
      return;
    }
    
    log('✅ Tabelas verificadas com sucesso nos dois bancos de dados.');

    // 2. Buscar os registros que foram modificados desde a última sincronização
    // Observação: Uma abordagem mais sofisticada seria rastrear quando cada registro foi sincronizado,
    // mas para simplificar, estamos obtendo todos os registros.
    log('🔍 Obtendo registros do PostgreSQL local...');
    
    const localQuery = 'SELECT * FROM campinas_budget_requests ORDER BY id';
    const localResult = await client.query(localQuery);
    
    const localRequests = localResult.rows;
    log(`✅ Encontrados ${localRequests.length} registros no PostgreSQL local`);

    if (localRequests.length === 0) {
      log('ℹ️ Não há registros para sincronizar.');
      return;
    }

    // 3. Sincronizar cada registro
    log('🔍 Verificando registros no Supabase...');
    let syncedCount = 0;
    let errorCount = 0;
    let insertedCount = 0;
    let updatedCount = 0;

    for (const request of localRequests) {
      // Verificar se o registro já existe no Supabase
      const { data: existingRecords, error: checkError } = await supabase
        .from('campinas_budget_requests')
        .select('id, updated_at')
        .eq('id', request.id)
        .maybeSingle();

      if (checkError) {
        log(`❌ Erro ao verificar registro #${request.id} no Supabase: ${checkError.message}`);
        errorCount++;
        continue;
      }

      if (existingRecords) {
        // O registro existe, verificar se precisa ser atualizado
        const localUpdatedAt = new Date(request.updated_at).getTime();
        const supabaseUpdatedAt = new Date(existingRecords.updated_at).getTime();
        
        if (localUpdatedAt > supabaseUpdatedAt) {
          // O registro local é mais recente, atualizar no Supabase
          const { error: updateError } = await supabase
            .from('campinas_budget_requests')
            .update(request)
            .eq('id', request.id);
          
          if (updateError) {
            log(`❌ Erro ao atualizar registro #${request.id} no Supabase: ${updateError.message}`);
            errorCount++;
          } else {
            log(`✓ Registro #${request.id} atualizado no Supabase`);
            syncedCount++;
            updatedCount++;
          }
        } else {
          log(`✓ Registro #${request.id} já está atualizado no Supabase`);
          syncedCount++;
        }
      } else {
        // O registro não existe no Supabase, inserir
        const { error: insertError } = await supabase
          .from('campinas_budget_requests')
          .insert(request);
        
        if (insertError) {
          log(`❌ Erro ao inserir registro #${request.id} no Supabase: ${insertError.message}`);
          errorCount++;
        } else {
          log(`✓ Registro #${request.id} inserido no Supabase`);
          syncedCount++;
          insertedCount++;
        }
      }
    }

    // 4. Resumo da sincronização
    log('\n📋 Resumo da sincronização:');
    log(`  - Total de registros processados: ${localRequests.length}`);
    log(`  - Registros sincronizados com sucesso: ${syncedCount}`);
    log(`  - Registros inseridos: ${insertedCount}`);
    log(`  - Registros atualizados: ${updatedCount}`);
    log(`  - Erros de sincronização: ${errorCount}`);
    
    if (errorCount === 0) {
      log('✅ Sincronização concluída com sucesso!');
    } else {
      log('⚠️ Sincronização concluída com erros.');
    }

  } catch (error) {
    log(`❌ Erro ao sincronizar solicitações de orçamento: ${error.message}`);
    console.error(error);
  } finally {
    // Liberar a conexão de volta para o pool
    if (client) {
      client.release();
    }
    
    // Fechar o pool
    await pool.end();
    
    log('🏁 Processo de sincronização finalizado.');
  }
}

// Executar a sincronização
syncBudgetRequests();