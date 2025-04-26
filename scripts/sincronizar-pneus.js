/**
 * Script para sincronizar dados de pneus entre o Replit (PostgreSQL local) e o Supabase
 * 
 * Este script utiliza a tabela de controle de sincronização para:
 * 1. Identificar alterações nos dados de pneus
 * 2. Sincronizar essas alterações com o Supabase
 * 3. Registrar o status da sincronização
 */
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Verificar se as variáveis necessárias estão definidas
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não definidas.');
  console.error('Certifique-se de definir VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_KEY.');
  process.exit(1);
}

if (!databaseUrl) {
  console.error('Erro: Variável de ambiente DATABASE_URL não definida.');
  process.exit(1);
}

// Criar cliente Supabase com a chave de serviço
console.log(`Conectando ao Supabase: ${supabaseUrl.substring(0, 20)}...`);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Conectar ao PostgreSQL local
const pool = new Pool({ connectionString: databaseUrl });

// Tabelas relacionadas a pneus para sincronizar
const tabelasPneus = [
  { nome: 'pneus_completo', entity_type: 'pneu' },
  { nome: 'movimentacao_pneu', entity_type: 'movimentacao' },
  { nome: 'solicitacoes_pneus', entity_type: 'solicitacao' },
  { nome: 'montagem_pneus', entity_type: 'montagem' }
];

// Função para registrar alterações na tabela de controle de sincronização
async function registrarAlteracaoParaSincronizacao(entityType, entityId, direction, payload = null) {
  try {
    // Verificar se já existe um registro para esta entidade
    const { data: existingSync } = await supabase
      .from('sync_control')
      .select('id')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .single();
    
    const now = new Date();
    const syncData = {
      status: 'pendente',
      direction,
      payload,
      next_sync_attempt: now,
      retry_count: 0
    };
    
    // Estamos no ambiente Replit, então o update foi no Replit
    syncData.replit_last_update = now;
    
    if (existingSync) {
      // Atualizar registro existente
      await supabase
        .from('sync_control')
        .update(syncData)
        .eq('id', existingSync.id);
      
      console.log(`Atualizado registro de sincronização para ${entityType} id=${entityId}`);
    } else {
      // Criar novo registro
      await supabase
        .from('sync_control')
        .insert([{
          entity_type: entityType,
          entity_id: entityId,
          ...syncData
        }]);
      
      console.log(`Criado novo registro de sincronização para ${entityType} id=${entityId}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Erro ao registrar alteração para sincronização (${entityType} id=${entityId}):`, error);
    return false;
  }
}

// Função para sincronizar um registro específico
async function sincronizarRegistro(syncRecord) {
  try {
    console.log(`Sincronizando ${syncRecord.entity_type} id=${syncRecord.entity_id}...`);
    
    // Identificar a tabela correta com base no entity_type
    let tabela = 'pneus_completo'; // padrão
    
    switch(syncRecord.entity_type) {
      case 'pneu':
        tabela = 'pneus_completo';
        break;
      case 'movimentacao':
        tabela = 'movimentacao_pneu';
        break;
      case 'solicitacao':
        tabela = 'solicitacoes_pneus';
        break;
      case 'montagem':
        tabela = 'montagem_pneus';
        break;
    }
    
    // Obter os dados do registro no PostgreSQL local
    const query = `SELECT * FROM ${tabela} WHERE id = $1`;
    const result = await pool.query(query, [syncRecord.entity_id]);
    
    if (result.rows.length === 0) {
      console.log(`Registro ${syncRecord.entity_type} id=${syncRecord.entity_id} não encontrado no PostgreSQL local.`);
      
      // Verificar se o registro existe no Supabase (pode ter sido excluído localmente)
      const { data: supabaseRecord } = await supabase
        .from(tabela)
        .select('*')
        .eq('id', syncRecord.entity_id)
        .single();
      
      if (supabaseRecord) {
        // O registro existe no Supabase mas não no PostgreSQL local, então devemos excluí-lo do Supabase
        if (syncRecord.direction === 'replit_para_externo' || syncRecord.direction === 'bidirecional') {
          console.log(`Excluindo registro ${syncRecord.entity_type} id=${syncRecord.entity_id} do Supabase...`);
          
          const { error: deleteError } = await supabase
            .from(tabela)
            .delete()
            .eq('id', syncRecord.entity_id);
          
          if (deleteError) {
            throw new Error(`Erro ao excluir registro do Supabase: ${deleteError.message}`);
          }
          
          console.log(`Registro excluído com sucesso do Supabase.`);
        }
      }
    } else {
      // O registro existe no PostgreSQL local, então devemos atualizá-lo no Supabase
      const localRecord = result.rows[0];
      
      // Verificar se o registro já existe no Supabase
      const { data: existingRecord } = await supabase
        .from(tabela)
        .select('id')
        .eq('id', syncRecord.entity_id)
        .single();
      
      if (existingRecord) {
        // O registro já existe no Supabase, então devemos atualizá-lo
        console.log(`Atualizando registro ${syncRecord.entity_type} id=${syncRecord.entity_id} no Supabase...`);
        
        const { error: updateError } = await supabase
          .from(tabela)
          .update(localRecord)
          .eq('id', syncRecord.entity_id);
        
        if (updateError) {
          throw new Error(`Erro ao atualizar registro no Supabase: ${updateError.message}`);
        }
      } else {
        // O registro não existe no Supabase, então devemos criá-lo
        console.log(`Criando registro ${syncRecord.entity_type} id=${syncRecord.entity_id} no Supabase...`);
        
        const { error: insertError } = await supabase
          .from(tabela)
          .insert([localRecord]);
        
        if (insertError) {
          throw new Error(`Erro ao inserir registro no Supabase: ${insertError.message}`);
        }
      }
      
      console.log(`Sincronização bem-sucedida para ${syncRecord.entity_type} id=${syncRecord.entity_id}`);
    }
    
    // Atualizar o registro de sincronização para refletir o sucesso
    await supabase
      .from('sync_control')
      .update({
        status: 'sincronizado',
        last_sync_attempt: new Date(),
        error_message: null
      })
      .eq('id', syncRecord.id);
    
    // Registrar o evento de sincronização no log
    await supabase.rpc('log_sync_event', {
      p_sync_id: syncRecord.id,
      p_entity_type: syncRecord.entity_type,
      p_entity_id: syncRecord.entity_id,
      p_status: 'sincronizado',
      p_direction: syncRecord.direction
    });
    
    return true;
  } catch (error) {
    console.error(`Erro ao sincronizar ${syncRecord.entity_type} id=${syncRecord.entity_id}:`, error);
    
    // Incrementar o contador de tentativas
    const retryCount = (syncRecord.retry_count || 0) + 1;
    
    // Calcular a próxima tentativa (com backoff exponencial)
    const nextAttemptMinutes = Math.min(60, Math.pow(2, retryCount)) * 5;
    const nextAttempt = new Date();
    nextAttempt.setMinutes(nextAttempt.getMinutes() + nextAttemptMinutes);
    
    // Atualizar o registro de sincronização para refletir a falha
    await supabase
      .from('sync_control')
      .update({
        status: retryCount >= 5 ? 'erro' : 'pendente',
        retry_count: retryCount,
        next_sync_attempt: nextAttempt,
        last_sync_attempt: new Date(),
        error_message: error.message
      })
      .eq('id', syncRecord.id);
    
    // Registrar o evento de sincronização no log
    await supabase.rpc('log_sync_event', {
      p_sync_id: syncRecord.id,
      p_entity_type: syncRecord.entity_type,
      p_entity_id: syncRecord.entity_id,
      p_status: 'erro',
      p_direction: syncRecord.direction,
      p_error_message: error.message
    });
    
    return false;
  }
}

// Função para processar pendências de sincronização
async function processarSincronizacaoPendente() {
  try {
    console.log('Buscando registros pendentes de sincronização...');
    
    const { data: pendingSyncs, error } = await supabase
      .from('sync_status_view')
      .select('*')
      .in('entity_type', ['pneu', 'movimentacao', 'solicitacao', 'montagem'])
      .eq('ready_for_sync', true)
      .order('priority', { ascending: false })
      .order('next_sync_attempt', { ascending: true })
      .limit(10);
    
    if (error) {
      throw new Error(`Erro ao buscar registros pendentes: ${error.message}`);
    }
    
    if (!pendingSyncs || pendingSyncs.length === 0) {
      console.log('Não há registros de pneus pendentes de sincronização.');
      return [];
    }
    
    console.log(`Processando ${pendingSyncs.length} registros de sincronização...`);
    
    const resultados = [];
    
    for (const sync of pendingSyncs) {
      const resultado = await sincronizarRegistro(sync);
      resultados.push({
        id: sync.id,
        entity_type: sync.entity_type,
        entity_id: sync.entity_id,
        success: resultado
      });
    }
    
    return resultados;
  } catch (error) {
    console.error('Erro ao processar sincronização pendente:', error);
    return [];
  }
}

// Função para verificar alterações locais e registrá-las para sincronização
async function verificarAlteracoesLocais() {
  try {
    console.log('Verificando alterações locais nas tabelas de pneus...');
    
    for (const tabela of tabelasPneus) {
      console.log(`Verificando alterações na tabela ${tabela.nome}...`);
      
      // Buscar registros modificados recentemente (últimos 30 minutos)
      const query = `
        SELECT id FROM ${tabela.nome}
        WHERE updated_at >= NOW() - INTERVAL '30 minutes'
        ORDER BY updated_at DESC
      `;
      
      const result = await pool.query(query);
      console.log(`Encontrados ${result.rowCount} registros modificados recentemente em ${tabela.nome}.`);
      
      // Registrar cada alteração para sincronização
      for (const row of result.rows) {
        await registrarAlteracaoParaSincronizacao(
          tabela.entity_type,
          row.id.toString(),
          'replit_para_externo'
        );
      }
    }
    
    console.log('Verificação de alterações locais concluída.');
  } catch (error) {
    console.error('Erro ao verificar alterações locais:', error);
  }
}

// Função principal
async function main() {
  try {
    console.log('Iniciando processo de sincronização de pneus...');
    
    // Verificar alterações locais e registrá-las para sincronização
    await verificarAlteracoesLocais();
    
    // Processar sincronizações pendentes
    const resultados = await processarSincronizacaoPendente();
    
    console.log('\n=== RESUMO DA SINCRONIZAÇÃO ===');
    console.log(`Total de registros processados: ${resultados.length}`);
    console.log(`Sucessos: ${resultados.filter(r => r.success).length}`);
    console.log(`Falhas: ${resultados.filter(r => !r.success).length}`);
    
    console.log('\nSincronização concluída com sucesso.');
  } catch (error) {
    console.error('Erro durante o processo de sincronização:', error);
  } finally {
    // Fechar a conexão com o PostgreSQL
    await pool.end();
  }
}

// Executar o script
main();