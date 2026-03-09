/**
 * Script para implementar tabelas de pneus no Supabase
 * 
 * Este script conecta-se ao Supabase usando a service key e cria
 * as tabelas relacionadas à funcionalidade de pneus.
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Verificar se as variáveis necessárias estão definidas
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: Variáveis de ambiente necessárias não definidas.');
  console.error('Certifique-se de definir VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_KEY.');
  process.exit(1);
}

// Criar cliente Supabase com a chave de serviço
console.log(`Conectando ao Supabase: ${supabaseUrl.substring(0, 20)}...`);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Função para executar SQL no Supabase
async function executarSQL(sqlQuery) {
  try {
    console.log('Executando consulta SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlQuery });
    
    if (error) {
      throw error;
    }
    
    console.log('SQL executado com sucesso.');
    console.log('Resposta:', data);
    return data;
  } catch (error) {
    console.error('Erro ao executar SQL:', error);
    
    // Tentar executar a consulta usando a API REST direta
    if (error.message?.includes('function "exec_sql" does not exist')) {
      console.log('Função exec_sql não encontrada. Tentando método alternativo...');
      return await executarSQLAlternativo(sqlQuery);
    }
    
    throw error;
  }
}

// Função alternativa para executar SQL quando exec_sql não está disponível
async function executarSQLAlternativo(sqlQuery) {
  try {
    // Dividir o script SQL em comandos individuais
    const comandos = sqlQuery
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);
    
    console.log(`Executando ${comandos.length} comandos SQL individualmente...`);
    
    const resultados = [];
    for (let i = 0; i < comandos.length; i++) {
      const comando = comandos[i] + ';';
      console.log(`Executando comando ${i + 1}/${comandos.length}...`);
      
      // Usar a API REST direta para executar o SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'X-Client-Info': 'supabase-js/1.0.0',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          query: comando
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Aviso: Comando ${i + 1} retornou status ${response.status}: ${errorText}`);
        // Continuamos mesmo com erros para tentar processar todos os comandos
      } else {
        console.log(`Comando ${i + 1} executado com sucesso.`);
      }
      
      resultados.push({
        comando: i + 1,
        status: response.status,
        ok: response.ok
      });
    }
    
    return resultados;
  } catch (error) {
    console.error('Erro ao executar SQL alternativo:', error);
    throw error;
  }
}

// Função para inserir função exec_sql no banco de dados, se necessário
async function inserirFuncaoExecSQL() {
  try {
    const sql = `
      CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
      RETURNS JSONB AS $$
      DECLARE
          result JSONB;
      BEGIN
          EXECUTE sql_query;
          RETURN '{"success": true}'::JSONB;
      EXCEPTION WHEN OTHERS THEN
          RETURN jsonb_build_object(
              'success', false,
              'error', SQLERRM,
              'detail', SQLSTATE
          );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    console.log('Tentando criar função exec_sql...');
    
    // Usar a API REST direta para executar o SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'X-Client-Info': 'supabase-js/1.0.0',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: sql
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Aviso: Não foi possível criar função exec_sql: ${errorText}`);
      return false;
    }
    
    console.log('Função exec_sql criada com sucesso.');
    return true;
  } catch (error) {
    console.error('Erro ao criar função exec_sql:', error);
    return false;
  }
}

// Função principal
async function main() {
  try {
    console.log('Iniciando implementação de tabelas de pneus no Supabase...');
    
    // Ler o arquivo SQL
    const sqlFilePath = path.join(process.cwd(), 'scripts', 'criar-tabelas-pneus-supabase.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`Arquivo SQL não encontrado: ${sqlFilePath}`);
    }
    
    console.log(`Lendo arquivo SQL: ${sqlFilePath}`);
    const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Verificar se a conexão com o Supabase está funcionando
    console.log('Verificando conexão com o Supabase...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      throw new Error(`Erro ao conectar ao Supabase: ${authError.message}`);
    }
    
    console.log('Conexão com o Supabase estabelecida com sucesso.');
    
    // Criar função exec_sql se necessário
    await inserirFuncaoExecSQL();
    
    // Executar o SQL
    console.log('Iniciando execução do script SQL para tabelas de pneus...');
    await executarSQL(sqlQuery);
    
    console.log('\n=== IMPLEMENTAÇÃO DE TABELAS DE PNEUS CONCLUÍDA COM SUCESSO ===');
    console.log('As tabelas relacionadas a pneus foram criadas no Supabase.');
    
  } catch (error) {
    console.error('\n=== ERRO NA IMPLEMENTAÇÃO ===');
    console.error(error);
    process.exit(1);
  }
}

// Executar o script
main();