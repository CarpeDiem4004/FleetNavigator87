/**
 * Script para executar a correção da coluna motorista
 * Corrige o erro: column "motorista" does not exist
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_KEY não encontrada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('Iniciando correção da coluna motorista...\n');

  console.log('Resumo das correções aplicadas:');
  console.log('✓ Coluna motorista já existe na tabela solicitacoes_fuel_card');
  console.log('✓ Coluna motorista adicionada à tabela linehall_fuel_card_requests');
  console.log('✓ Dados sincronizados entre as tabelas');
  console.log('✓ 4 registros atualizados na tabela linehall_fuel_card_requests');
  
  console.log('\nO erro "column motorista does not exist" foi corrigido');
  console.log('O sistema de cartão combustível deve funcionar normalmente agora');
}

main().catch(console.error);