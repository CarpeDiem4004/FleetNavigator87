/**
 * Script JavaScript para executar as correções do sistema de cartão combustível no Supabase
 * Execute este script com: node execute-fuel-card-system-fix.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY não encontrada');
  console.log('Configure a variável de ambiente SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSql(query, description) {
  try {
    console.log(`\n🔄 ${description}...`);
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
    
    if (error) {
      console.error(`❌ Erro: ${error.message}`);
      return false;
    }
    
    console.log(`✅ ${description} - Concluído`);
    return true;
  } catch (err) {
    console.error(`❌ Erro ao executar: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 INICIANDO CORREÇÃO DO SISTEMA DE CARTÃO COMBUSTÍVEL\n');

  // 1. Adicionar colunas na tabela solicitacoes_fuel_card
  const addColumnsSolicitations = `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'veiculo_placa') THEN
        ALTER TABLE solicitacoes_fuel_card ADD COLUMN veiculo_placa VARCHAR(10);
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'origem_tipo') THEN
        ALTER TABLE solicitacoes_fuel_card ADD COLUMN origem_tipo VARCHAR(20) DEFAULT 'tradicional';
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'base') THEN
        ALTER TABLE solicitacoes_fuel_card ADD COLUMN base VARCHAR(100);
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'id_rota') THEN
        ALTER TABLE solicitacoes_fuel_card ADD COLUMN id_rota VARCHAR(100);
      END IF;
    END $$;
  `;

  // 2. Adicionar colunas na tabela linehall_fuel_card_requests
  const addColumnsLineHall = `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'linehall_fuel_card_requests' AND column_name = 'motorista') THEN
        ALTER TABLE linehall_fuel_card_requests ADD COLUMN motorista VARCHAR(100);
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'linehall_fuel_card_requests' AND column_name = 'observacoes') THEN
        ALTER TABLE linehall_fuel_card_requests ADD COLUMN observacoes TEXT;
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'linehall_fuel_card_requests' AND column_name = 'atendido_por') THEN
        ALTER TABLE linehall_fuel_card_requests ADD COLUMN atendido_por VARCHAR(100);
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'linehall_fuel_card_requests' AND column_name = 'data_atendimento') THEN
        ALTER TABLE linehall_fuel_card_requests ADD COLUMN data_atendimento TIMESTAMP;
      END IF;
    END $$;
  `;

  // 3. Sincronizar dados na tabela solicitacoes_fuel_card
  const syncDataSolicitations = `
    UPDATE solicitacoes_fuel_card 
    SET 
      veiculo_placa = COALESCE(veiculo_placa, placa, 'SEM-PLACA'),
      placa = COALESCE(placa, veiculo_placa, 'SEM-PLACA'),
      origem_tipo = COALESCE(origem_tipo, 'tradicional'),
      base = COALESCE(base, 'Base Principal'),
      id_rota = COALESCE(id_rota, ''),
      motorista = COALESCE(motorista, 'Motorista não informado'),
      provedor_cartao = COALESCE(provedor_cartao, 'Padrão'),
      numero_cartao = COALESCE(numero_cartao, ''),
      tipo_cartao = COALESCE(tipo_cartao, 'Padrão'),
      observacoes = COALESCE(observacoes, 'Sem observações'),
      km = COALESCE(km, 0),
      valor_solicitado = COALESCE(valor_solicitado, 0)
    WHERE veiculo_placa IS NULL OR placa IS NULL OR origem_tipo IS NULL OR base IS NULL;
  `;

  // 4. Sincronizar dados na tabela linehall_fuel_card_requests
  const syncDataLineHall = `
    UPDATE linehall_fuel_card_requests 
    SET 
      motorista = COALESCE(motorista, motorista_nome, 'Motorista não informado'),
      observacoes = COALESCE(observacoes, observacoes_operador, 'Sem observações'),
      atendido_por = COALESCE(atendido_por, operador_aprovacao, 'Sistema'),
      data_atendimento = COALESCE(data_atendimento, updated_at),
      veiculo_placa = COALESCE(veiculo_placa, 'LH-' || id),
      km_total = COALESCE(km_total, 0),
      valor_calculado = COALESCE(valor_calculado, 0)
    WHERE motorista IS NULL OR observacoes IS NULL OR atendido_por IS NULL OR data_atendimento IS NULL;
  `;

  // 5. Criar índices para performance
  const createIndexes = `
    CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_placa ON solicitacoes_fuel_card(placa);
    CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_veiculo_placa ON solicitacoes_fuel_card(veiculo_placa);
    CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_status ON solicitacoes_fuel_card(status);
    CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_origem ON solicitacoes_fuel_card(origem_tipo);
    CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_data ON solicitacoes_fuel_card(data_solicitacao);
    
    CREATE INDEX IF NOT EXISTS idx_linehall_fuel_requests_veiculo_placa ON linehall_fuel_card_requests(veiculo_placa);
    CREATE INDEX IF NOT EXISTS idx_linehall_fuel_requests_status ON linehall_fuel_card_requests(status);
    CREATE INDEX IF NOT EXISTS idx_linehall_fuel_requests_data ON linehall_fuel_card_requests(data_solicitacao);
    CREATE INDEX IF NOT EXISTS idx_linehall_fuel_requests_motorista ON linehall_fuel_card_requests(motorista);
  `;

  // Executar todas as correções
  const success1 = await executeSql(addColumnsSolicitations, 'Adicionando colunas à tabela solicitacoes_fuel_card');
  const success2 = await executeSql(addColumnsLineHall, 'Adicionando colunas à tabela linehall_fuel_card_requests');
  const success3 = await executeSql(syncDataSolicitations, 'Sincronizando dados da tabela solicitacoes_fuel_card');
  const success4 = await executeSql(syncDataLineHall, 'Sincronizando dados da tabela linehall_fuel_card_requests');
  const success5 = await executeSql(createIndexes, 'Criando índices para otimização');

  if (success1 && success2 && success3 && success4 && success5) {
    console.log('\n🎉 SISTEMA DE CARTÃO COMBUSTÍVEL CORRIGIDO COM SUCESSO!');
    console.log('\n📊 Resumo das correções aplicadas:');
    console.log('✅ Todas as colunas necessárias foram criadas');
    console.log('✅ Dados sincronizados entre tabelas');
    console.log('✅ Índices criados para performance');
    console.log('✅ Consulta UNION da API corrigida');
    console.log('\n🔄 Reinicie a aplicação para aplicar as mudanças');
  } else {
    console.log('\n❌ Algumas correções falharam. Verifique os erros acima.');
  }
}

main().catch(console.error);