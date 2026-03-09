/**
 * Script para executar a integração do Line Hall Shopee no Supabase
 * Este script cria/atualiza as tabelas necessárias para a funcionalidade unificada
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzU3MzQyOCwiZXhwIjoyMDUzMTQ5NDI4fQ.tTaA5RnQGFo7fDQRF2FnI_rS-CDPhMFG2LqP4yE_fOw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function executeSql(query, description) {
  try {
    console.log(`\n🔄 ${description}...`);
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
    
    if (error) {
      console.error(`❌ Erro em ${description}:`, error);
      return false;
    }
    
    console.log(`✅ ${description} executado com sucesso`);
    if (data) console.log('Resultado:', data);
    return true;
  } catch (err) {
    console.error(`❌ Erro inesperado em ${description}:`, err);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando integração Line Hall Shopee...\n');

  // 1. Criar tabela linehall_fuel_card_requests
  const createLineHallTable = `
    CREATE TABLE IF NOT EXISTS linehall_fuel_card_requests (
      id SERIAL PRIMARY KEY,
      motorista_id INTEGER NOT NULL,
      motorista_nome VARCHAR(255) NOT NULL,
      motorista_cpf VARCHAR(14) NOT NULL,
      veiculo_placa VARCHAR(20) NOT NULL,
      veiculo_modelo VARCHAR(100),
      rota_origem VARCHAR(255),
      rota_destino VARCHAR(255),
      data_solicitacao DATE NOT NULL,
      horario_solicitacao TIME NOT NULL,
      km_total INTEGER,
      horario_abastecimento VARCHAR(20) CHECK (horario_abastecimento IN ('antes_17h', 'apos_18h')),
      telefone_motorista VARCHAR(20) NOT NULL,
      status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada', 'processada')),
      observacoes_operador TEXT,
      operador_aprovacao VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await executeSql(createLineHallTable, 'Criando tabela linehall_fuel_card_requests');

  // 2. Adicionar campo operador_aprovacao se não existir
  const addOperatorField = `
    DO $$ 
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'linehall_fuel_card_requests' 
                       AND column_name = 'operador_aprovacao') THEN
            ALTER TABLE linehall_fuel_card_requests 
            ADD COLUMN operador_aprovacao VARCHAR(255);
        END IF;
    END $$;
  `;

  await executeSql(addOperatorField, 'Adicionando campo operador_aprovacao');

  // 3. Criar tabela solicitacoes_fuel_card se não existir
  const createMainTable = `
    CREATE TABLE IF NOT EXISTS solicitacoes_fuel_card (
      id SERIAL PRIMARY KEY,
      tipo_cartao VARCHAR(100),
      provedor_cartao VARCHAR(100),
      numero_cartao VARCHAR(50),
      motorista VARCHAR(255),
      placa VARCHAR(20),
      km INTEGER,
      valor_solicitado DECIMAL(10,2) DEFAULT 0,
      observacoes TEXT,
      status VARCHAR(50) DEFAULT 'pendente',
      data_solicitacao TIMESTAMP DEFAULT NOW(),
      atendido_por VARCHAR(255),
      data_atendimento TIMESTAMP,
      base VARCHAR(100),
      id_rota INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await executeSql(createMainTable, 'Criando tabela solicitacoes_fuel_card');

  // 4. Criar índices
  const createIndexes = `
    CREATE INDEX IF NOT EXISTS idx_linehall_fuel_card_requests_status ON linehall_fuel_card_requests(status);
    CREATE INDEX IF NOT EXISTS idx_linehall_fuel_card_requests_motorista ON linehall_fuel_card_requests(motorista_id);
    CREATE INDEX IF NOT EXISTS idx_linehall_fuel_card_requests_data ON linehall_fuel_card_requests(data_solicitacao);
    CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_status ON solicitacoes_fuel_card(status);
    CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_data ON solicitacoes_fuel_card(data_solicitacao);
  `;

  await executeSql(createIndexes, 'Criando índices de performance');

  // 5. Criar função para updated_at
  const createUpdateFunction = `
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
  `;

  await executeSql(createUpdateFunction, 'Criando função update_updated_at_column');

  // 6. Criar triggers
  const createTriggers = `
    DROP TRIGGER IF EXISTS update_linehall_fuel_card_requests_updated_at ON linehall_fuel_card_requests;
    CREATE TRIGGER update_linehall_fuel_card_requests_updated_at 
        BEFORE UPDATE ON linehall_fuel_card_requests 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_solicitacoes_fuel_card_updated_at ON solicitacoes_fuel_card;
    CREATE TRIGGER update_solicitacoes_fuel_card_updated_at 
        BEFORE UPDATE ON solicitacoes_fuel_card 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `;

  await executeSql(createTriggers, 'Criando triggers para updated_at');

  // 7. Inserir dados de exemplo (opcional)
  const insertSampleData = `
    INSERT INTO linehall_fuel_card_requests (
      motorista_id, motorista_nome, motorista_cpf, veiculo_placa, veiculo_modelo,
      rota_origem, rota_destino, data_solicitacao, horario_solicitacao,
      km_total, horario_abastecimento, telefone_motorista, status
    ) VALUES 
    (1, 'João Silva', '123.456.789-01', 'ABC-1234', 'Volkswagen Delivery',
     'São Paulo', 'Campinas', CURRENT_DATE, '08:00:00',
     120, 'antes_17h', '(11) 99999-1234', 'pendente'),
    (2, 'Maria Santos', '987.654.321-02', 'XYZ-5678', 'Mercedes Sprinter',
     'Guarulhos', 'Santos', CURRENT_DATE, '09:30:00',
     85, 'apos_18h', '(11) 88888-5678', 'aprovada')
    ON CONFLICT DO NOTHING;
  `;

  await executeSql(insertSampleData, 'Inserindo dados de exemplo');

  // 8. Verificar resultado final
  const checkTables = `
    SELECT 
      'linehall_fuel_card_requests' as tabela,
      COUNT(*) as registros
    FROM linehall_fuel_card_requests
    UNION ALL
    SELECT 
      'solicitacoes_fuel_card' as tabela,
      COUNT(*) as registros
    FROM solicitacoes_fuel_card;
  `;

  await executeSql(checkTables, 'Verificando resultado final');

  console.log('\n🎉 Integração Line Hall Shopee concluída com sucesso!');
  console.log('📊 O sistema agora suporta:');
  console.log('   ✅ Solicitações unificadas de cartão combustível');
  console.log('   ✅ Interface consolidada para operadores');
  console.log('   ✅ Rastreamento em tempo real');
  console.log('   ✅ Histórico completo de aprovações');
}

// Executar script
main().catch(console.error);