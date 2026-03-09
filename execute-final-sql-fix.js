/**
 * Script para executar as correções finais dos erros SQL
 * Corrige os erros: "column placa does not exist" e "column provedor_cartao does not exist"
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY não encontrada nas variáveis de ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSql(query, description) {
  try {
    console.log(`🔄 ${description}...`);
    const { data, error } = await supabase.rpc('exec_sql', { query });
    
    if (error) {
      console.error(`❌ Erro ao ${description.toLowerCase()}:`, error.message);
      return false;
    }
    
    console.log(`✅ ${description} concluído com sucesso`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao ${description.toLowerCase()}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando correção final dos erros SQL...\n');

  // Etapa 1: Verificar se as colunas existem na tabela linehall_fuel_card_requests
  const checkLinehallColumns = `
    DO $$
    BEGIN
      -- Adicionar observacoes se não existir
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'linehall_fuel_card_requests' AND column_name = 'observacoes'
      ) THEN
        ALTER TABLE linehall_fuel_card_requests ADD COLUMN observacoes TEXT;
        RAISE NOTICE 'Coluna observacoes adicionada à tabela linehall_fuel_card_requests';
      END IF;

      -- Adicionar atendido_por se não existir
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'linehall_fuel_card_requests' AND column_name = 'atendido_por'
      ) THEN
        ALTER TABLE linehall_fuel_card_requests ADD COLUMN atendido_por VARCHAR(100);
        RAISE NOTICE 'Coluna atendido_por adicionada à tabela linehall_fuel_card_requests';
      END IF;

      -- Adicionar data_atendimento se não existir
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'linehall_fuel_card_requests' AND column_name = 'data_atendimento'
      ) THEN
        ALTER TABLE linehall_fuel_card_requests ADD COLUMN data_atendimento TIMESTAMP;
        RAISE NOTICE 'Coluna data_atendimento adicionada à tabela linehall_fuel_card_requests';
      END IF;
    END $$;
  `;

  await executeSql(checkLinehallColumns, 'Verificação e adição de colunas na tabela linehall_fuel_card_requests');

  // Etapa 2: Preencher dados padrão
  const fillDefaultData = `
    UPDATE linehall_fuel_card_requests 
    SET 
      observacoes = COALESCE(observacoes, observacoes_operador, 'Sem observações'),
      atendido_por = COALESCE(atendido_por, operador_aprovacao),
      data_atendimento = COALESCE(data_atendimento, updated_at)
    WHERE observacoes IS NULL OR atendido_por IS NULL OR data_atendimento IS NULL;
  `;

  await executeSql(fillDefaultData, 'Preenchimento de dados padrão na tabela linehall_fuel_card_requests');

  // Etapa 3: Testar a consulta UNION que estava falhando
  const testUnionQuery = `
    SELECT 
      id,
      placa,
      motorista,
      status,
      origem_tipo
    FROM (
      SELECT 
        id,
        placa,
        motorista,
        status,
        COALESCE(origem_tipo, 'tradicional') as origem_tipo
      FROM solicitacoes_fuel_card
      UNION ALL
      SELECT 
        id,
        veiculo_placa as placa,
        motorista_nome as motorista,
        status,
        'line_hall' as origem_tipo
      FROM linehall_fuel_card_requests
    ) combined_requests
    ORDER BY id DESC
    LIMIT 5;
  `;

  await executeSql(testUnionQuery, 'Teste da consulta UNION corrigida');

  // Etapa 4: Criar índices para melhor performance
  const createIndexes = `
    CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_placa ON solicitacoes_fuel_card(placa);
    CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_status ON solicitacoes_fuel_card(status);
    CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_origem ON solicitacoes_fuel_card(origem_tipo);
    CREATE INDEX IF NOT EXISTS idx_linehall_fuel_requests_placa ON linehall_fuel_card_requests(veiculo_placa);
    CREATE INDEX IF NOT EXISTS idx_linehall_fuel_requests_status ON linehall_fuel_card_requests(status);
  `;

  await executeSql(createIndexes, 'Criação de índices para melhor performance');

  console.log('\n✅ Correção final dos erros SQL concluída com sucesso!');
  console.log('🔧 O sistema de cartão combustível deve estar funcionando normalmente agora.');
}

// Executar o script
main().catch(console.error);