/**
 * Script simplificado para testar a conexão com o Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Inicializar cliente Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('=== Teste Simples de Conexão com Supabase ===');
console.log('URL:', supabaseUrl?.substring(0, 15) + '...');
console.log('Chave disponível:', !!supabaseServiceKey);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não configuradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSimpleConnection() {
  try {
    // Testar uma consulta simples
    console.log('\nTestando acesso à tabela users...');
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email')
      .limit(3);
    
    if (error) {
      console.error('❌ Erro ao acessar tabela users:', error.message);
    } else {
      console.log('✅ Conexão com Supabase estabelecida!');
      console.log('✅ Dados recuperados da tabela users:');
      console.log(data);
    }
    
    // Testar acesso a uma tabela de abastecimentos específica
    console.log('\nTestando acesso à tabela abastecimentos_posto_abc_v2...');
    const { data: abcData, error: abcError } = await supabase
      .from('abastecimentos_posto_abc_v2')
      .select('id, placa, tipo_combustivel')
      .limit(3);
    
    if (abcError) {
      console.error('❌ Erro ao acessar tabela abastecimentos_posto_abc_v2:', abcError.message);
    } else {
      console.log('✅ Dados recuperados da tabela abastecimentos_posto_abc_v2:');
      console.log(abcData);
    }
    
    return !error && !abcError;
  } catch (e) {
    console.error('❌ Erro inesperado:', e.message);
    return false;
  }
}

testSimpleConnection()
  .then(success => {
    console.log('\nTeste finalizado. Resultado:', success ? 'SUCESSO' : 'FALHA');
    process.exit(success ? 0 : 1);
  });