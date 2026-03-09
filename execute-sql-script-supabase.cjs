/**
 * Script para executar arquivos SQL no Supabase
 * Use este script para criar ou atualizar tabelas e views no Supabase
 * 
 * Uso: node execute-sql-script-supabase.cjs <nome_do_arquivo.sql>
 * Exemplo: node execute-sql-script-supabase.cjs create-abc-v2-tables-supabase.sql
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

// Validar parâmetros
if (process.argv.length < 3) {
  console.error('\n❌ Erro: Você precisa especificar o arquivo SQL a ser executado.');
  console.log('\n📝 Uso correto: node execute-sql-script-supabase.cjs <nome_do_arquivo.sql>');
  console.log('   Exemplo: node execute-sql-script-supabase.cjs create-abc-v2-tables-supabase.sql\n');
  process.exit(1);
}

// Obter o nome do arquivo SQL
const sqlFileName = process.argv[2];
const sqlFilePath = path.resolve(process.cwd(), sqlFileName);

// Verificar se o arquivo existe
if (!fs.existsSync(sqlFilePath)) {
  console.error(`\n❌ Erro: O arquivo '${sqlFileName}' não foi encontrado.`);
  console.log(`   Verifique se o caminho está correto: ${sqlFilePath}\n`);
  process.exit(1);
}

// Validar configurações do Supabase
if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_SERVICE_KEY não definidas.');
  console.log('   Verifique se as variáveis estão configuradas no arquivo .env\n');
  process.exit(1);
}

// Inicializar o cliente Supabase
console.log(`\n🔄 Conectando ao Supabase: ${supabaseUrl.substring(0, 15)}...`);
const supabase = createClient(supabaseUrl, supabaseKey);

// Ler o conteúdo do arquivo SQL
console.log(`\n📂 Lendo o arquivo SQL: ${sqlFileName}`);
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Dividir o conteúdo em comandos SQL individuais
const sqlCommands = sqlContent
  .replace(/--.*$/gm, '') // Remover comentários de linha única
  .replace(/\/\*[\s\S]*?\*\//g, '') // Remover comentários de múltiplas linhas
  .split(';')
  .map(cmd => cmd.trim())
  .filter(cmd => cmd.length > 0);

console.log(`\n📊 Encontrados ${sqlCommands.length} comandos SQL para executar.`);

// Função para executar um comando SQL
async function executeSqlCommand(command, index) {
  try {
    // Exibir os primeiros 100 caracteres do comando para referência
    const commandPreview = command.length > 100 
      ? command.substring(0, 100) + '...' 
      : command;
    
    console.log(`\n🔷 Executando comando ${index + 1}/${sqlCommands.length}:`);
    console.log(`   ${commandPreview}`);
    
    // Adicionar ponto e vírgula ao comando se não tiver
    const formattedCommand = command.endsWith(';') ? command : command + ';';
    
    // Executar o comando SQL usando a API REST do Supabase
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: formattedCommand });
    
    if (error) {
      console.error(`\n❌ Erro ao executar comando ${index + 1}:`);
      console.error(`   ${error.message}`);
      return false;
    }
    
    console.log(`\n✅ Comando ${index + 1} executado com sucesso!`);
    return true;
  } catch (error) {
    console.error(`\n❌ Erro inesperado ao executar comando ${index + 1}:`);
    console.error(`   ${error.message}`);
    return false;
  }
}

// Função principal para executar todos os comandos SQL
async function executeAllCommands() {
  console.log('\n🚀 Iniciando execução dos comandos SQL...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < sqlCommands.length; i++) {
    const success = await executeSqlCommand(sqlCommands[i], i);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
  }
  
  console.log('\n📊 Resumo da execução:');
  console.log(`   ✅ ${successCount} comandos executados com sucesso`);
  console.log(`   ❌ ${errorCount} comandos com erro`);
  
  if (errorCount === 0) {
    console.log('\n🎉 Todos os comandos foram executados com sucesso!');
  } else {
    console.log('\n⚠️ Alguns comandos apresentaram erros. Verifique o log acima para mais detalhes.');
  }
}

// Verificar se a função exec_sql existe no Supabase
async function checkExecSqlFunction() {
  try {
    console.log('\n🔍 Verificando se a função exec_sql existe no Supabase...');
    
    // Tentar executar a função com um comando simples
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1;' });
    
    if (error) {
      if (error.message.includes('function "exec_sql" does not exist')) {
        console.log('\n⚠️ A função exec_sql não existe. Criando a função...');
        await createExecSqlFunction();
        return;
      }
      
      console.error('\n❌ Erro ao verificar função exec_sql:');
      console.error(`   ${error.message}`);
      process.exit(1);
    }
    
    console.log('\n✅ Função exec_sql já existe e está funcionando corretamente!');
  } catch (error) {
    console.error('\n❌ Erro inesperado ao verificar função exec_sql:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

// Criar a função exec_sql no Supabase
async function createExecSqlFunction() {
  try {
    // SQL para criar a função exec_sql (precisa de permissões de administrador)
    const createFunctionSql = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS VOID
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_query;
    END;
    $$;
    `;
    
    // Executar o SQL para criar a função
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: createFunctionSql });
    
    if (error) {
      console.error('\n❌ Erro ao criar função exec_sql:');
      console.error(`   ${error.message}`);
      console.error('\n⚠️ Você pode precisar criar a função manualmente no Editor SQL do Supabase:');
      console.error(createFunctionSql);
      process.exit(1);
    }
    
    console.log('\n✅ Função exec_sql criada com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro inesperado ao criar função exec_sql:');
    console.error(`   ${error.message}`);
    console.error('\n⚠️ Você pode precisar criar a função manualmente no Editor SQL do Supabase.');
    process.exit(1);
  }
}

// Executar o script
async function main() {
  try {
    // Verificar e, se necessário, criar a função exec_sql
    await checkExecSqlFunction();
    
    // Executar todos os comandos SQL
    await executeAllCommands();
  } catch (error) {
    console.error('\n❌ Erro inesperado:', error);
  }
}

main();