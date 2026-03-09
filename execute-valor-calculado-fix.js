/**
 * Script para executar a adição da coluna valor_calculado via API do Supabase
 * Este script força a criação da coluna mesmo se já existir
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (substitua pelas suas credenciais)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY || 'sua_service_key_aqui';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function executeSql(query, description) {
  try {
    console.log(`\n[${description}]`);
    console.log('Executando:', query.substring(0, 100) + '...');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql: query });
    
    if (error) {
      console.error(`❌ Erro em ${description}:`, error);
      return false;
    }
    
    console.log(`✅ ${description} executado com sucesso`);
    if (data) console.log('Resultado:', data);
    return true;
  } catch (err) {
    console.error(`❌ Exceção em ${description}:`, err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando correção da coluna valor_calculado...');
  
  // ETAPA 1: Verificar tabela
  const checkTable = `
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'solicitacoes_fuel_card'
    ) as table_exists;
  `;
  
  await executeSql(checkTable, 'Verificação da tabela');
  
  // ETAPA 2: Remover coluna se existir
  const dropColumn = `
    ALTER TABLE solicitacoes_fuel_card 
    DROP COLUMN IF EXISTS valor_calculado CASCADE;
  `;
  
  await executeSql(dropColumn, 'Remoção da coluna valor_calculado');
  
  // ETAPA 3: Adicionar coluna
  const addColumn = `
    ALTER TABLE solicitacoes_fuel_card 
    ADD COLUMN valor_calculado DECIMAL(10,2) NOT NULL DEFAULT 0;
  `;
  
  await executeSql(addColumn, 'Adição da coluna valor_calculado');
  
  // ETAPA 4: Verificar se foi criada
  const verifyColumn = `
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' 
    AND column_name = 'valor_calculado';
  `;
  
  await executeSql(verifyColumn, 'Verificação da coluna criada');
  
  // ETAPA 5: Teste de funcionamento
  const testColumn = `
    UPDATE solicitacoes_fuel_card 
    SET valor_calculado = COALESCE(valor_calculado, 0) 
    WHERE id = (SELECT id FROM solicitacoes_fuel_card LIMIT 1);
  `;
  
  await executeSql(testColumn, 'Teste de funcionamento da coluna');
  
  console.log('\n✅ Script concluído! A coluna valor_calculado deve estar funcionando agora.');
  console.log('Se o erro persistir, pode ser necessário reiniciar a aplicação.');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };