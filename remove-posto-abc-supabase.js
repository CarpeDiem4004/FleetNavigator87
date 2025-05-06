/**
 * Script para remover completamente o posto ABC (não ABC_v2) do banco de dados Supabase
 * Este script executa comandos SQL para remover todas as tabelas e registros relacionados ao posto ABC
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_KEY são necessárias');
  process.exit(1);
}

// Cliente Supabase com chave de serviço para ter permissões completas
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Função para verificar se uma tabela existe no Supabase
 */
async function tableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error && error.code === 'PGRST104') {
      // Tabela não existe
      return false;
    }
    
    // Se não houver erro ou o erro for diferente de 'PGRST104', a tabela existe
    return true;
  } catch (err) {
    console.error(`Erro ao verificar tabela ${tableName}:`, err.message);
    return false;
  }
}

/**
 * Função para executar comandos SQL
 * Como não podemos executar SQL arbitrário via API Supabase, 
 * vamos usar métodos alternativos para cada operação
 */
async function executeOperation(operation, tableName) {
  try {
    switch (operation) {
      case 'DROP_TABLE':
        // Não podemos executar DROP TABLE diretamente, mas podemos verificar se a tabela existe
        const exists = await tableExists(tableName);
        if (!exists) {
          console.log(`Tabela ${tableName} não existe.`);
          return { success: true, message: `Tabela ${tableName} não existe ou já foi removida.` };
        } else {
          console.log(`Tabela ${tableName} existe, mas não pode ser removida via API Supabase.`);
          return { 
            success: false, 
            message: `Tabela ${tableName} existe, mas não pode ser removida via API Supabase. Use o Console do Supabase.` 
          };
        }
        
      case 'UPDATE_USERS':
        // Atualizar usuários
        const { data, error } = await supabase
          .from('users')
          .update({ posto_id: null })
          .eq('posto_id', 'abc');
        
        if (error) {
          return { success: false, error };
        }
        return { success: true, data };
        
      default:
        return { 
          success: false, 
          error: { message: `Operação '${operation}' não suportada` } 
        };
    }
  } catch (err) {
    return { success: false, error: err };
  }
}

/**
 * Função principal que verifica e tenta remover tabelas relacionadas ao posto ABC
 */
async function removePostoABC() {
  console.log('Iniciando processo de remoção do posto ABC do Supabase...');
  
  try {
    // 1. Verificar se as tabelas existem
    console.log('Verificando tabelas relacionadas ao posto ABC...');
    
    const tablesToCheck = [
      'abastecimentos_posto_abc',
      'movimentacoes_patio_posto_abc',
      'configuracao_tanques_posto_abc'
    ];
    
    const existingTables = [];
    
    for (const tableName of tablesToCheck) {
      const exists = await tableExists(tableName);
      if (exists) {
        existingTables.push(tableName);
        console.log(`- Tabela ${tableName} encontrada.`);
      } else {
        console.log(`- Tabela ${tableName} não encontrada.`);
      }
    }
    
    if (existingTables.length === 0) {
      console.log('\nNenhuma tabela relacionada ao posto ABC foi encontrada no Supabase.');
    } else {
      console.log(`\nEncontradas ${existingTables.length} tabelas relacionadas ao posto ABC.`);
      
      console.log('\nATENÇÃO: Não é possível remover tabelas diretamente via API Supabase.');
      console.log('Para remover as tabelas, acesse o Console do Supabase e use o SQL Editor para executar os seguintes comandos:');
      
      console.log('\n-- Comandos SQL para remover tabelas do posto ABC');
      console.log('DROP TABLE IF EXISTS abastecimentos_posto_abc CASCADE;');
      console.log('DROP TABLE IF EXISTS movimentacoes_patio_posto_abc CASCADE;');
      console.log('DROP TABLE IF EXISTS configuracao_tanques_posto_abc CASCADE;');
    }
    
    // 5. Limpar registros de associação de usuários ao posto ABC
    console.log('\nRemovendo associações de usuários ao posto ABC...');
    const updateUsers = await executeOperation('UPDATE_USERS', 'users');
    
    if (updateUsers.success) {
      console.log('✓ Associações de usuários atualizadas com sucesso.');
    } else {
      console.error('✗ Erro ao atualizar associações de usuários:', updateUsers.error);
    }
    
    console.log('\nProcesso de verificação do posto ABC concluído.');
    
  } catch (error) {
    console.error('Erro durante o processo de remoção:', error);
  }
}

// Executar a função principal
removePostoABC().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});