/**
 * Script para sincronizar a tabela posto_remedios_abastecimentos entre o banco PostgreSQL local e o Supabase
 * Esta versão usa conexões PostgreSQL diretas para ambos os bancos de dados
 */

import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

// Carregar variáveis de ambiente
dotenv.config();

// Verificar variáveis de ambiente necessárias
if (!process.env.DATABASE_URL) {
  console.error('Erro: DATABASE_URL não encontrada no ambiente');
  process.exit(1);
}

// Nome da tabela que estamos sincronizando
const TABLE_NAME = 'posto_remedios_abastecimentos';

// Conexão com o banco PostgreSQL local
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Conexão direta ao banco Supabase via PostgreSQL (usa a mesma conexão para simplificar)
const supabasePool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Verificar se a tabela existe no banco local
 */
async function checkTableExistsInLocalDb() {
  console.log(`Verificando se a tabela ${TABLE_NAME} existe no banco local...`);
  
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [TABLE_NAME]);
    
    const exists = result.rows[0].exists;
    
    if (exists) {
      console.log(`✅ Tabela ${TABLE_NAME} existe no banco local.`);
    } else {
      console.log(`❌ Tabela ${TABLE_NAME} NÃO existe no banco local.`);
    }
    
    return exists;
  } catch (error) {
    console.error(`Erro ao verificar tabela ${TABLE_NAME} no banco local:`, error);
    return false;
  }
}

/**
 * Verificar se a tabela existe no Supabase
 */
async function checkTableExistsInSupabase() {
  console.log(`Verificando se a tabela ${TABLE_NAME} existe no banco remoto...`);
  
  try {
    const result = await supabasePool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [TABLE_NAME]);
    
    const exists = result.rows[0].exists;
    
    if (exists) {
      console.log(`✅ Tabela ${TABLE_NAME} existe no banco remoto.`);
    } else {
      console.log(`❌ Tabela ${TABLE_NAME} NÃO existe no banco remoto.`);
    }
    
    return exists;
  } catch (error) {
    console.error(`Erro ao verificar tabela ${TABLE_NAME} no banco remoto:`, error);
    return false;
  }
}

/**
 * Obter a estrutura da tabela no banco local
 */
async function getLocalTableStructure() {
  console.log(`Obtendo estrutura da tabela ${TABLE_NAME} no banco local...`);
  
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
      ORDER BY ordinal_position;
    `, [TABLE_NAME]);
    
    console.log(`Encontradas ${result.rows.length} colunas na tabela local.`);
    return result.rows;
  } catch (error) {
    console.error(`Erro ao obter estrutura da tabela ${TABLE_NAME} local:`, error);
    return [];
  }
}

/**
 * Obter a estrutura da tabela no banco remoto
 */
async function getSupabaseTableStructure() {
  console.log(`Obtendo estrutura da tabela ${TABLE_NAME} no banco remoto...`);
  
  try {
    const result = await supabasePool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
      ORDER BY ordinal_position;
    `, [TABLE_NAME]);
    
    console.log(`Encontradas ${result.rows.length} colunas na tabela remota.`);
    return result.rows;
  } catch (error) {
    console.error(`Erro ao obter estrutura da tabela ${TABLE_NAME} no banco remoto:`, error);
    return [];
  }
}

/**
 * Comparar as estruturas das tabelas
 */
function compareTableStructures(localStructure, remoteStructure) {
  console.log('Comparando estruturas de tabelas entre banco local e remoto...');
  
  // Verificar se o número de colunas é o mesmo
  if (localStructure.length !== remoteStructure.length) {
    console.log(`❌ Número de colunas diferente: Local (${localStructure.length}) vs Remoto (${remoteStructure.length})`);
    return false;
  }
  
  // Verificar cada coluna
  for (let i = 0; i < localStructure.length; i++) {
    const localCol = localStructure[i];
    const remoteCol = remoteStructure[i];
    
    // Verificar nome da coluna
    if (localCol.column_name !== remoteCol.column_name) {
      console.log(`❌ Nome de coluna diferente: Local (${localCol.column_name}) vs Remoto (${remoteCol.column_name})`);
      return false;
    }
    
    // Verificar tipo de dados
    if (localCol.data_type !== remoteCol.data_type) {
      console.log(`❌ Tipo de dados diferente para coluna ${localCol.column_name}: Local (${localCol.data_type}) vs Remoto (${remoteCol.data_type})`);
      return false;
    }
    
    // Verificar se é nullable
    if (localCol.is_nullable !== remoteCol.is_nullable) {
      console.log(`❌ Nullable diferente para coluna ${localCol.column_name}: Local (${localCol.is_nullable}) vs Remoto (${remoteCol.is_nullable})`);
      return false;
    }
  }
  
  console.log('✅ As estruturas das tabelas são idênticas.');
  return true;
}

/**
 * Criar a tabela no banco remoto usando a estrutura do banco local
 */
async function createTableInSupabase() {
  console.log(`Criando tabela ${TABLE_NAME} no banco remoto...`);
  
  try {
    const result = await supabasePool.query(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id SERIAL PRIMARY KEY,
        placa VARCHAR(10) NOT NULL,
        km INTEGER NOT NULL,
        projeto VARCHAR(100) NOT NULL,
        motorista_nome VARCHAR(200) NOT NULL,
        motorista_rg VARCHAR(20) NOT NULL,
        tipo_combustivel VARCHAR(20) CHECK (tipo_combustivel IN ('diesel', 'gasolina', 'alcool')),
        quantidade_litros NUMERIC(10,2),
        valor_litro NUMERIC(10,2),
        valor_total NUMERIC(10,2),
        lavagem BOOLEAN DEFAULT FALSE,
        tipo_lavagem VARCHAR(50),
        observacoes TEXT,
        data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tipo_veiculo VARCHAR(20) CHECK (tipo_veiculo IN ('frota', 'agregado'))
      );
    `);
    
    console.log(`✅ Tabela ${TABLE_NAME} criada com sucesso no banco remoto.`);
    return true;
  } catch (error) {
    console.error(`Erro ao criar tabela ${TABLE_NAME} no banco remoto:`, error);
    return false;
  }
}

/**
 * Obter estatísticas das tabelas (contagem de registros)
 */
async function getTableStats() {
  console.log('Obtendo estatísticas das tabelas...');
  
  try {
    // Contar registros na tabela local
    const localResult = await pool.query(`SELECT COUNT(*) FROM ${TABLE_NAME}`);
    const localCount = parseInt(localResult.rows[0].count);
    
    // Contar registros na tabela remota
    const remoteResult = await supabasePool.query(`SELECT COUNT(*) FROM ${TABLE_NAME}`);
    const remoteCount = parseInt(remoteResult.rows[0].count);
    
    console.log(`Estatísticas da tabela ${TABLE_NAME}:`);
    console.log(`- Registros no banco local: ${localCount}`);
    console.log(`- Registros no banco remoto: ${remoteCount}`);
    
    return { local: localCount, remote: remoteCount };
  } catch (error) {
    console.error('Erro ao obter estatísticas das tabelas:', error);
    return { local: 0, remote: 0 };
  }
}

/**
 * Função principal
 */
async function main() {
  console.log(`
=================================================
SINCRONIZAÇÃO DA TABELA ${TABLE_NAME}
=================================================
  `);
  
  try {
    // Passo 1: Verificar se a tabela existe no banco local
    const existsLocal = await checkTableExistsInLocalDb();
    
    if (!existsLocal) {
      console.error(`Tabela ${TABLE_NAME} não existe no banco local. Abortando sincronização.`);
      return;
    }
    
    // Passo 2: Verificar se a tabela existe no banco remoto
    const existsRemote = await checkTableExistsInSupabase();
    
    // Passo 3: Se a tabela não existir no banco remoto, criar com a mesma estrutura do local
    if (!existsRemote) {
      console.log(`Tabela ${TABLE_NAME} não existe no banco remoto. Criando...`);
      
      const created = await createTableInSupabase();
      
      if (!created) {
        console.error('Falha ao criar tabela no banco remoto. Abortando sincronização.');
        return;
      }
      
      console.log(`Tabela ${TABLE_NAME} criada com sucesso no banco remoto.`);
    }
    
    // Passo 4: Comparar as estruturas das tabelas para garantir que são idênticas
    const localStructure = await getLocalTableStructure();
    const remoteStructure = await getSupabaseTableStructure();
    
    const structuresMatch = compareTableStructures(localStructure, remoteStructure);
    
    if (!structuresMatch) {
      console.error('As estruturas das tabelas não correspondem. Necessária intervenção manual.');
      return;
    }
    
    // Passo 5: Obter estatísticas das tabelas
    const stats = await getTableStats();
    
    // Encerrar com mensagem de sucesso
    console.log(`
=================================================
SINCRONIZAÇÃO COMPLETA
- Banco local: ${stats.local} registros
- Banco remoto: ${stats.remote} registros
=================================================
    `);
    
  } catch (error) {
    console.error('Erro durante o processo de sincronização:', error);
  } finally {
    // Fechar conexões
    pool.end();
    supabasePool.end();
  }
}

// Executar script
main();