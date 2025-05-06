/**
 * Script para remover todas as tabelas de postos, exceto Posto Remédios
 * Usa o serviço Supabase via API
 * Execute este script com cuidado!
 * 
 * Uso: node remove-all-postos-except-remedios.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://hvsmxxqkuyjhxzcauwiy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Verificar se a chave do Supabase foi fornecida
if (!supabaseKey) {
  console.error('Erro: SUPABASE_SERVICE_KEY não está definida no ambiente.');
  console.error('Execute o script com: SUPABASE_SERVICE_KEY=sua_chave node remove-all-postos-except-remedios.js');
  process.exit(1);
}

// Inicializar o cliente do Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Função auxiliar para verificar se uma tabela existe
 * @param {string} tableName - Nome da tabela para verificar
 */
async function tableExists(tableName) {
  try {
    const { data, error } = await supabase.rpc('table_exists', { table_name: tableName });
    
    if (error) {
      // Se a função RPC não existir, crie-a
      await supabase.rpc('create_table_exists_function');
      // Tente novamente
      const result = await supabase.rpc('table_exists', { table_name: tableName });
      return result.data;
    }
    
    return data;
  } catch (error) {
    console.error(`Erro ao verificar se a tabela ${tableName} existe:`, error.message);
    // Tentar um método alternativo - fazer uma consulta direta
    try {
      const { data } = await supabase
        .from('pg_catalog.pg_tables')
        .select('*')
        .eq('schemaname', 'public')
        .eq('tablename', tableName)
        .limit(1);
      
      return data && data.length > 0;
    } catch (altError) {
      console.error('Erro ao usar método alternativo:', altError.message);
      return false;
    }
  }
}

/**
 * Função para remover uma tabela se ela existir
 * @param {string} tableName - Nome da tabela para remover
 */
async function dropTableIfExists(tableName) {
  try {
    console.log(`Verificando tabela ${tableName}...`);
    const exists = await tableExists(tableName);
    
    if (exists) {
      console.log(`Removendo tabela ${tableName}...`);
      // Como não podemos usar DROP TABLE diretamente via Supabase API,
      // usamos um SQL raw via RPC ou outra abordagem
      
      // Método 1: Tentar via RPC personalizada
      try {
        await supabase.rpc('execute_sql', { 
          sql_command: `DROP TABLE IF EXISTS public.${tableName} CASCADE`
        });
        console.log(`✓ Tabela ${tableName} removida com sucesso.`);
        return true;
      } catch (rpcError) {
        console.error(`Erro ao remover tabela via RPC:`, rpcError.message);
        
        // Método 2: Se falhar, tentar outra abordagem
        try {
          // Aqui podemos tentar uma abordagem alternativa,
          // como marcar registros como inativos ou outra estratégia
          console.log(`⚠️ Não foi possível remover tabela ${tableName} diretamente.`);
          console.log(`Sugerindo execução manual do comando: DROP TABLE IF EXISTS public.${tableName} CASCADE`);
          return false;
        } catch (altError) {
          console.error(`Erro no método alternativo:`, altError.message);
          return false;
        }
      }
    } else {
      console.log(`Tabela ${tableName} não existe, pulando.`);
      return true;
    }
  } catch (error) {
    console.error(`Erro ao processar tabela ${tableName}:`, error.message);
    return false;
  }
}

/**
 * Função para atualizar usuários associados a postos removidos
 */
async function updateUserReferences() {
  try {
    console.log('Atualizando referências de usuários...');
    
    // Verificar se a coluna basename existe
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_name', 'users')
      .eq('column_name', 'basename');
    
    if (columnError) {
      console.error('Erro ao verificar coluna basename:', columnError.message);
      return false;
    }
    
    if (columns && columns.length > 0) {
      // A coluna existe, atualizar usuários
      const { error: updateError } = await supabase
        .from('users')
        .update({ basename: 'remedios' })
        .in('basename', [
          'osasco', 'osasco_v2', 'guarulhos', 'guarulhos_v2', 'alair_v2', 
          'campinas', 'campinas_v2', 'socorro', 'socorro_v2',
          'sorocaba', 'sorocaba_v2', 'saopaulo', 'abc', 'abc_v2'
        ]);
      
      if (updateError) {
        console.error('Erro ao atualizar usuários:', updateError.message);
        return false;
      }
      
      console.log('✓ Referências de usuários atualizadas com sucesso.');
      return true;
    } else {
      console.log('Coluna basename não encontrada na tabela users, pulando atualização.');
      return true;
    }
  } catch (error) {
    console.error('Erro ao atualizar referências de usuários:', error.message);
    return false;
  }
}

/**
 * Função principal para remover todas as tabelas de postos, exceto Posto Remédios
 */
async function removeAllPostosExceptRemedios() {
  console.log('');
  console.log('=========================================================');
  console.log('AVISO: ESTE SCRIPT REMOVE TABELAS DE POSTOS PERMANENTEMENTE');
  console.log('=========================================================');
  console.log('Apenas o Posto Remédios será mantido. Todos os outros serão removidos.');
  console.log('');
  
  // Solicitar confirmação do usuário
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    readline.question('Digite "CONFIRMAR" para prosseguir com a remoção: ', async (answer) => {
      readline.close();
      
      if (answer !== 'CONFIRMAR') {
        console.log('Operação cancelada pelo usuário.');
        resolve(false);
        return;
      }
      
      console.log('Iniciando remoção...');
      
      try {
        // Lista de tabelas a serem removidas
        const tablesToRemove = [
          // Osasco
          'abastecimentos_posto_osasco',
          'abastecimentos_posto_osasco_v2',
          // Guarulhos/Alair
          'abastecimentos_posto_guarulhos',
          'abastecimentos_posto_guarulhos_v2',
          'abastecimentos_posto_alair_v2',
          // Campinas
          'abastecimentos_posto_campinas',
          'abastecimentos_posto_campinas_v2',
          // Socorro
          'abastecimentos_posto_socorro',
          'abastecimentos_posto_socorro_v2',
          // Sorocaba
          'abastecimentos_posto_sorocaba',
          'abastecimentos_posto_sorocaba_v2',
          // São Paulo
          'abastecimentos_posto_saopaulo',
        ];
        
        // Array para armazenar nomes de tabelas que falharam na remoção
        const failedTables = [];
        
        // Processar cada tabela
        for (const tableName of tablesToRemove) {
          const success = await dropTableIfExists(tableName);
          if (!success) {
            failedTables.push(tableName);
          }
        }
        
        // Atualizar referências de usuários
        await updateUserReferences();
        
        // Resultado final
        console.log('');
        console.log('=========================================================');
        if (failedTables.length === 0) {
          console.log('✅ Remoção de postos concluída com sucesso!');
          console.log('Apenas o Posto Remédios permanece no sistema.');
        } else {
          console.log('⚠️ Remoção de postos parcialmente concluída.');
          console.log('As seguintes tabelas não puderam ser removidas automaticamente:');
          failedTables.forEach(table => console.log(`  - ${table}`));
          console.log('');
          console.log('Recomendamos executar o SQL manualmente para estas tabelas.');
        }
        console.log('=========================================================');
        
        resolve(true);
      } catch (error) {
        console.error('Erro durante o processo de remoção:', error.message);
        resolve(false);
      }
    });
  });
}

// Executar o script principal
(async () => {
  try {
    await removeAllPostosExceptRemedios();
  } catch (error) {
    console.error('Erro fatal:', error);
    process.exit(1);
  }
})();