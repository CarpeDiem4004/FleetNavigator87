/**
 * Script para criar as tabelas específicas do Line Hall Shopee no Supabase
 * Execute este script com: node create-linehall-tables-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ VITE_SUPABASE_SERVICE_ROLE_KEY não encontrada nas variáveis de ambiente');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function executeSql(query, description) {
  try {
    console.log(`🔄 ${description}...`);
    const { data, error } = await supabase.rpc('execute_sql', { query });
    
    if (error) {
      console.error(`❌ Erro ao ${description.toLowerCase()}:`, error);
      return false;
    }
    
    console.log(`✅ ${description} - Sucesso`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao ${description.toLowerCase()}:`, error);
    return false;
  }
}

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName);
    
    return data && data.length > 0;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando criação das tabelas do Line Hall Shopee no Supabase...\n');

  // 1. Criar tabela linehall_maintenance
  const createMaintenanceTable = `
    CREATE TABLE IF NOT EXISTS linehall_maintenance (
        id SERIAL PRIMARY KEY,
        motorista_id INTEGER NOT NULL,
        motorista_nome VARCHAR(255) NOT NULL,
        vehicle_plate VARCHAR(10) NOT NULL,
        description TEXT NOT NULL,
        urgency VARCHAR(20) DEFAULT 'normal',
        status VARCHAR(20) DEFAULT 'pendente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        notes TEXT NULL,
        approved_by VARCHAR(255) NULL
    );
  `;
  
  await executeSql(createMaintenanceTable, 'Criando tabela linehall_maintenance');

  // 2. Criar tabela linehall_fuel_cards
  const createFuelCardsTable = `
    CREATE TABLE IF NOT EXISTS linehall_fuel_cards (
        id SERIAL PRIMARY KEY,
        motorista_id INTEGER NOT NULL,
        motorista_nome VARCHAR(255) NOT NULL,
        numero_cartao VARCHAR(50) NOT NULL,
        valor_solicitado DECIMAL(10,2) NOT NULL,
        justificativa TEXT NOT NULL,
        vehicle_plate VARCHAR(10),
        comprovante_url TEXT,
        status VARCHAR(20) DEFAULT 'pendente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP NULL,
        approved_by VARCHAR(255) NULL
    );
  `;
  
  await executeSql(createFuelCardsTable, 'Criando tabela linehall_fuel_cards');

  // 3. Inserir dados de exemplo para manutenções
  const insertMaintenanceData = `
    INSERT INTO linehall_maintenance (motorista_id, motorista_nome, vehicle_plate, description, urgency, status) 
    VALUES
    (2, 'João Silva', 'ABC1234', 'Revisão preventiva - Line Hall', 'normal', 'pendente'),
    (2, 'João Silva', 'DEF5678', 'Problema no freio - Line Hall', 'alta', 'em_andamento'),
    (2, 'João Silva', 'GHI9012', 'Troca de óleo - Line Hall', 'normal', 'concluida')
    ON CONFLICT DO NOTHING;
  `;
  
  await executeSql(insertMaintenanceData, 'Inserindo dados de exemplo - manutenções');

  // 4. Inserir dados de exemplo para cartões combustível
  const insertFuelCardsData = `
    INSERT INTO linehall_fuel_cards (motorista_id, motorista_nome, numero_cartao, valor_solicitado, justificativa, vehicle_plate, status) 
    VALUES
    (2, 'João Silva', 'LH001234', 500.00, 'Viagem longa São Paulo - Salvador', 'ABC1234', 'pendente'),
    (2, 'João Silva', 'LH001234', 300.00, 'Retorno Salvador - São Paulo', 'ABC1234', 'aprovada')
    ON CONFLICT DO NOTHING;
  `;
  
  await executeSql(insertFuelCardsData, 'Inserindo dados de exemplo - cartões combustível');

  // 5. Verificar se as tabelas foram criadas
  console.log('\n📊 Verificando tabelas criadas...');
  
  const maintenanceExists = await checkTableExists('linehall_maintenance');
  const fuelCardsExists = await checkTableExists('linehall_fuel_cards');
  
  console.log(`• linehall_maintenance: ${maintenanceExists ? '✅ Criada' : '❌ Não encontrada'}`);
  console.log(`• linehall_fuel_cards: ${fuelCardsExists ? '✅ Criada' : '❌ Não encontrada'}`);

  if (maintenanceExists && fuelCardsExists) {
    console.log('\n🎉 Todas as tabelas do Line Hall Shopee foram criadas com sucesso!');
    console.log('O sistema está pronto para usar as funcionalidades específicas do Line Hall.');
  } else {
    console.log('\n⚠️ Algumas tabelas não foram criadas. Verifique os logs de erro acima.');
  }
}

// Executar script
main().catch(console.error);