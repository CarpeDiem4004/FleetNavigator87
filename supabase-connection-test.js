/**
 * Script para testar a conexão com o Supabase
 * Este script verifica se é possível estabelecer uma conexão com o Supabase
 * e executar uma consulta básica.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Verificar variáveis de ambiente do Supabase
console.log('Verificando variáveis de ambiente do Supabase:');
console.log('- VITE_SUPABASE_URL disponível:', !!process.env.VITE_SUPABASE_URL);
console.log('- VITE_SUPABASE_ANON_KEY disponível:', !!process.env.VITE_SUPABASE_ANON_KEY);
console.log('- VITE_SUPABASE_SERVICE_KEY disponível:', !!process.env.VITE_SUPABASE_SERVICE_KEY);

// Mostrar primeiros caracteres da URL e chave para verificação
if (process.env.VITE_SUPABASE_URL) {
  console.log('- URL do Supabase (primeiros 15 caracteres):', 
    process.env.VITE_SUPABASE_URL.substring(0, 15) + '...');
}

if (process.env.VITE_SUPABASE_SERVICE_KEY) {
  console.log('- Chave de serviço (primeiros 10 caracteres):', 
    process.env.VITE_SUPABASE_SERVICE_KEY.substring(0, 10) + '...');
}

// Inicializar cliente Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não configuradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  console.log('\nTestando conexão com o Supabase...');
  
  try {
    // Testar com uma consulta SQL direta
    const { data: tablesData, error: sqlError } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1);
    
    if (sqlError) {
      console.log(`\n⚠️ Aviso: Não foi possível consultar a tabela users: ${sqlError.message}`);
    } else {
      console.log('\n✓ Conexão com Supabase estabelecida com sucesso!');
      console.log(`✓ Tabela users acessível - contagem: ${tablesData[0]?.count || 'N/A'}`);
    }
    
    // Testar obter as tabelas existentes usando um método alternativo
    const { data: allTables, error: listError } = await supabase
      .rpc('lista_tabelas')
      .select()
      .catch(() => {
        // Se a função RPC não existir, silenciamos o erro
        return { data: null, error: { message: "Função RPC 'lista_tabelas' não existe" } };
      });
    
    if (listError) {
      console.log(`\n⚠️ Função RPC não disponível: ${listError.message}`);
      console.log('Tentando método SQL direto para listar tabelas...');
      
      // Tentar método alternativo: consulta SQL direta
      const { data: tables, error: directError } = await supabase.rpc('exec', { 
        sql_query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'" 
      });
      
      if (directError) {
        console.log(`\n⚠️ Não foi possível listar tabelas: ${directError.message}`);
      } else if (tables && tables.length > 0) {
        console.log('\n✓ Tabelas disponíveis:');
        tables.forEach(row => {
          console.log(`- ${row.table_name}`);
        });
      }
    } else if (allTables && allTables.length > 0) {
      console.log('\n✓ Tabelas disponíveis:');
      allTables.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
    }
    
    // Testar se tabela 'users' existe
    const { data: usersExists, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (usersError) {
      console.log('\n✗ Tabela users não encontrada ou erro de acesso:', usersError.message);
    } else {
      console.log('\n✓ Tabela users acessível!');
    }
    
    // Testar tabela de posto específico (ABC_V2)
    const { data: abcExists, error: abcError } = await supabase
      .from('abastecimentos_posto_abc_v2')
      .select('id')
      .limit(1);
    
    if (abcError) {
      console.log('\n✗ Tabela abastecimentos_posto_abc_v2 não encontrada ou erro de acesso:', abcError.message);
    } else {
      console.log('\n✓ Tabela abastecimentos_posto_abc_v2 acessível!');
    }
    
    return true;
  } catch (error) {
    console.error('\n✗ Erro ao testar conexão com Supabase:', error.message);
    return false;
  }
}

// Executar teste
testConnection()
  .then(success => {
    console.log('\nTeste de conexão Supabase finalizado.');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Erro inesperado:', error);
    process.exit(1);
  });