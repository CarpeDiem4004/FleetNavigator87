/**
 * Script para criar as tabelas faltantes do Posto Campinas V2
 * - recebimentos_posto_campinas_v2
 * - movimentacoes_patio_campinas_v2
 */
import pkg from 'pg';
const { Pool } = pkg;
import * as dotenv from 'dotenv';

dotenv.config();

// Conexão com o PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function executeSQL(query, params = []) {
  try {
    const result = await pool.query(query, params);
    return result;
  } catch (error) {
    console.error('Erro ao executar query SQL:', error);
    throw error;
  }
}

async function checkTableExists(tableName) {
  try {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = $1
      );
    `;
    const { rows } = await pool.query(query, [tableName]);
    return rows[0].exists;
  } catch (error) {
    console.error(`Erro ao verificar a tabela ${tableName}:`, error);
    return false;
  }
}

async function createRecebimentosTable() {
  const tableName = 'recebimentos_posto_campinas_v2';
  
  if (await checkTableExists(tableName)) {
    console.log(`A tabela ${tableName} já existe.`);
    return;
  }
  
  const createTableSQL = `
    CREATE TABLE ${tableName} (
      id SERIAL PRIMARY KEY,
      tipo_combustivel VARCHAR(20),
      quantidade_litros NUMERIC(10, 2),
      valor_litro NUMERIC(10, 3),
      valor_total NUMERIC(10, 2),
      nota_fiscal VARCHAR(50),
      fornecedor VARCHAR(100),
      data_recebimento TIMESTAMP,
      usuario_operador VARCHAR(100),
      observacoes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP
    );
  `;
  
  try {
    await executeSQL(createTableSQL);
    console.log(`Tabela ${tableName} criada com sucesso!`);
  } catch (error) {
    console.error(`Erro ao criar a tabela ${tableName}:`, error);
  }
}

async function createMovimentacoesPatioTable() {
  const tableName = 'movimentacoes_patio_campinas_v2';
  
  if (await checkTableExists(tableName)) {
    console.log(`A tabela ${tableName} já existe.`);
    return;
  }
  
  const createTableSQL = `
    CREATE TABLE ${tableName} (
      id SERIAL PRIMARY KEY,
      placa VARCHAR(8) NOT NULL,
      tipo_veiculo VARCHAR(50),
      tipo_movimentacao VARCHAR(20) NOT NULL, -- entrada ou saida
      data_hora TIMESTAMP NOT NULL,
      km NUMERIC(10, 2),
      motorista VARCHAR(100),
      origem VARCHAR(100),
      destino VARCHAR(100),
      carga VARCHAR(100),
      observacoes TEXT,
      usuario_operador VARCHAR(100),
      tempo_patio INTERVAL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP
    );
  `;
  
  try {
    await executeSQL(createTableSQL);
    console.log(`Tabela ${tableName} criada com sucesso!`);
  } catch (error) {
    console.error(`Erro ao criar a tabela ${tableName}:`, error);
  }
}

async function createHistoricoConsolidadoView() {
  const viewName = 'historico_consolidado_postos';
  
  if (await checkTableExists(viewName)) {
    console.log(`A view ${viewName} já existe.`);
    return;
  }
  
  // SQL para criar a view que vai consolidar dados de todos os postos
  const createViewSQL = `
    CREATE VIEW ${viewName} AS
    -- Abastecimentos do posto Campinas_v2
    SELECT 
      id,
      placa,
      COALESCE(km_atual, 0) AS km,
      tipo_combustivel,
      COALESCE(litros, quantidade_litros) AS quantidade_litros,
      motorista AS nome_motorista,
      motorista_rg AS rg_motorista,
      operador AS nome_operador,
      valor_litro,
      valor_total,
      tipo_veiculo,
      observacoes,
      lavagem,
      tipo_lavagem,
      TO_CHAR(COALESCE(data_registro, created_at), 'DD/MM/YYYY HH24:MI') AS data_hora,
      created_at,
      'campinas_v2' AS posto
    FROM abastecimentos_posto_campinas_v2
    
    -- Outros postos podem ser adicionados com UNION ALL
    
    -- Exemplo para um posto hipotético (adaptar conforme necessário)
    -- UNION ALL
    -- SELECT 
    --   id,
    --   placa,
    --   km,
    --   tipo_combustivel,
    --   quantidade_litros,
    --   nome_motorista,
    --   rg_motorista,
    --   nome_operador,
    --   valor_litro,
    --   valor_total,
    --   tipo_veiculo,
    --   observacoes,
    --   lavagem,
    --   tipo_lavagem,
    --   data_hora,
    --   created_at,
    --   'outro_posto' AS posto
    -- FROM abastecimentos_posto_outro_posto
  `;
  
  try {
    await executeSQL(createViewSQL);
    console.log(`View ${viewName} criada com sucesso!`);
  } catch (error) {
    console.error(`Erro ao criar a view ${viewName}:`, error);
  }
}

async function main() {
  try {
    console.log('=== CRIAÇÃO DE TABELAS FALTANTES DO POSTO CAMPINAS V2 ===\n');
    
    // Criar tabela de recebimentos
    await createRecebimentosTable();
    
    // Criar tabela de movimentações de pátio
    await createMovimentacoesPatioTable();
    
    // Criar view de histórico consolidado
    await createHistoricoConsolidadoView();
    
    console.log('\nCriação de tabelas concluída.');
    
  } catch (error) {
    console.error('Erro geral na execução do script:', error);
  } finally {
    await pool.end();
  }
}

main();