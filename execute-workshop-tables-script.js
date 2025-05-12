/**
 * Script para criar as tabelas adicionais para o sistema de oficinas no Supabase
 * Este script lê o arquivo SQL e executa as instruções no banco de dados
 */

const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Credenciais do Supabase - lidas de variáveis de ambiente
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;
const databaseUrl = process.env.DATABASE_URL;

// Verifica se as variáveis de ambiente estão configuradas
if (!supabaseUrl || !supabaseServiceKey || !databaseUrl) {
  console.error('Erro: Variáveis de ambiente necessárias não estão configuradas.');
  console.error('Certifique-se de configurar VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_KEY e DATABASE_URL');
  process.exit(1);
}

// Inicializa o cliente Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Conexão direta ao banco Supabase via PostgreSQL
const pool = new Pool({
  connectionString: databaseUrl,
});

/**
 * Função para executar comandos SQL
 * @param {string} sqlCommand - O comando SQL a ser executado
 * @param {string} description - Descrição da operação para logging
 */
async function executeSql(sqlCommand, description) {
  console.log(`Executando: ${description}...`);
  
  const client = await pool.connect();
  try {
    await client.query(sqlCommand);
    console.log(`✅ ${description} concluído com sucesso.`);
    return true;
  } catch (error) {
    console.error(`❌ Erro em "${description}":`, error.message);
    return false;
  } finally {
    client.release();
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🔧 Iniciando criação das tabelas adicionais para o sistema de oficinas...');
  
  try {
    // Lê o arquivo SQL
    const sqlFilePath = path.join(__dirname, 'create-workshops-additional-tables-supabase.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Divide o script em comandos individuais (separados por ;)
    // Esta abordagem simples pode não funcionar para todos os casos (por exemplo, funções com ; internos)
    const sqlCommands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);
    
    console.log(`📝 Encontrados ${sqlCommands.length} comandos SQL no arquivo.`);
    
    // Executa cada comando SQL individualmente
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      const description = `Comando SQL ${i+1}/${sqlCommands.length}`;
      
      // Adiciona o ponto-e-vírgula de volta para a execução
      const result = await executeSql(`${command};`, description);
      
      if (!result) {
        console.warn(`⚠️ Continuando execução após erro no comando ${i+1}...`);
      }
    }
    
    console.log('✅ Processo de criação de tabelas concluído.');
    
    // Verifica se as tabelas principais foram criadas
    const tables = [
      'workshop_budgets',
      'workshop_documents',
      'workshop_budget_parts',
      'workshop_budget_services',
      'workshop_budget_history',
      'workshop_profiles',
      'workshop_vehicles_in_maintenance'
    ];
    
    console.log('🔍 Verificando se as tabelas foram criadas corretamente...');
    
    for (const table of tables) {
      const client = await pool.connect();
      try {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name = $1
          );
        `, [table]);
        
        const exists = result.rows[0].exists;
        console.log(`📋 Tabela ${table}: ${exists ? '✅ Criada' : '❌ Não encontrada'}`);
      } catch (error) {
        console.error(`❌ Erro ao verificar tabela ${table}:`, error.message);
      } finally {
        client.release();
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante o processo:', error);
  } finally {
    // Fecha a conexão com o pool
    await pool.end();
  }
}

// Executa a função principal
main().catch(err => {
  console.error('Erro não tratado:', err);
  process.exit(1);
});