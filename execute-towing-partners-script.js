/**
 * Script para criar as tabelas necessárias para o módulo de Parceiros de Guincho no Supabase
 * Este script executa o SQL para criar as tabelas, views e inserir dados de exemplo
 */
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas.');
  console.error('Por favor, certifique-se de que VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_KEY estão definidas.');
  process.exit(1);
}

// Criar cliente Supabase com chave de serviço
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Função para verificar se as tabelas já existem
 */
async function checkTablesExist() {
  const { data, error } = await supabase
    .from('towing_partners')
    .select('id')
    .limit(1);

  if (error && error.code === '42P01') { // Código de erro para "tabela não existe"
    return false;
  }
  
  if (data && data.length > 0) {
    return true;
  }
  
  return false;
}

/**
 * Função para executar o script SQL
 */
async function executeSqlScript() {
  try {
    // Verificar se as tabelas já existem
    const tablesExist = await checkTablesExist();
    
    if (tablesExist) {
      console.log('ℹ️ As tabelas de parceiros de guincho já existem no Supabase.');
      console.log('⚠️ Se deseja recriar as tabelas, você precisa excluí-las manualmente primeiro.');
      return;
    }
    
    // Ler o arquivo SQL
    const sqlScript = fs.readFileSync('./create-towing-partners-tables-supabase.sql', 'utf8');
    
    // Dividir o script em comandos individuais
    const commands = sqlScript.split(';').filter(cmd => cmd.trim() !== '');
    
    console.log(`ℹ️ Executando ${commands.length} comandos SQL...`);
    
    // Executar cada comando separadamente
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i] + ';';
      console.log(`🔄 Executando comando ${i + 1}/${commands.length}...`);
      
      const { error } = await supabase.rpc('execute_sql', { sql_query: command });
      
      if (error) {
        console.error(`❌ Erro ao executar comando SQL ${i + 1}: ${error.message}`);
        console.error(`Comando: ${command.substring(0, 100)}...`);
      }
    }
    
    console.log('✅ Script SQL executado com sucesso!');
    console.log('✅ Tabelas para o módulo de Parceiros de Guincho criadas no Supabase.');
    
  } catch (error) {
    console.error('❌ Erro ao executar o script SQL:', error);
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando criação das tabelas de parceiros de guincho no Supabase...');
  await executeSqlScript();
}

// Executar a função principal
main().catch(err => {
  console.error('❌ Erro na execução do script:', err);
  process.exit(1);
});