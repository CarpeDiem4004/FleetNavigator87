/**
 * Script para verificar todas as tabelas relacionadas ao Posto Campinas V2
 */
import pkg from 'pg';
const { Pool } = pkg;
import * as dotenv from 'dotenv';

dotenv.config();

// Conexão com o PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

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

async function getTableColumns(tableName) {
  try {
    const query = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
      ORDER BY ordinal_position;
    `;
    const { rows } = await pool.query(query, [tableName]);
    return rows;
  } catch (error) {
    console.error(`Erro ao obter colunas da tabela ${tableName}:`, error);
    return [];
  }
}

async function getRowCount(tableName) {
  try {
    const query = `SELECT COUNT(*) FROM ${tableName};`;
    const { rows } = await pool.query(query);
    return rows[0].count;
  } catch (error) {
    console.error(`Erro ao contar registros da tabela ${tableName}:`, error);
    return 0;
  }
}

async function main() {
  try {
    // Lista de tabelas para verificar
    const tablesToCheck = [
      'abastecimentos_posto_campinas_v2',       // Tabela principal de abastecimentos
      'configuracao_tanques',                    // Configuração dos tanques
      'recebimentos_posto_campinas_v2',          // Recebimentos de combustível
      'movimentacoes_patio_campinas_v2',         // Movimentações de pátio
      'campinas_budget_requests',                // Solicitações de orçamento
      'budget_attachments'                       // Anexos de orçamentos
    ];
    
    console.log('=== VERIFICAÇÃO DE TABELAS DO POSTO CAMPINAS V2 ===\n');
    
    for (const tableName of tablesToCheck) {
      const exists = await checkTableExists(tableName);
      console.log(`Tabela ${tableName}: ${exists ? 'EXISTE' : 'NÃO EXISTE'}`);
      
      if (exists) {
        const columns = await getTableColumns(tableName);
        const rowCount = await getRowCount(tableName);
        
        console.log(`  - Número de colunas: ${columns.length}`);
        console.log(`  - Número de registros: ${rowCount}`);
        
        // Listar todas as colunas
        console.log('  - Colunas:');
        columns.forEach(column => {
          console.log(`    * ${column.column_name} (${column.data_type}, ${column.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
        });
        console.log('');
      }
    }
    
    // Verificar exstência da view de histórico consolidado
    const viewExists = await checkTableExists('historico_consolidado_postos');
    console.log(`View historico_consolidado_postos: ${viewExists ? 'EXISTE' : 'NÃO EXISTE'}\n`);
    
    // Verificar se Campinas_v2 está na lista de postos
    try {
      const { rows } = await pool.query(`
        SELECT * FROM configuracao_tanques WHERE posto = 'Campinas_v2';
      `);
      
      if (rows.length > 0) {
        console.log('Configuração do Posto Campinas_v2:');
        console.log(rows[0]);
      } else {
        console.log('Configuração do Posto Campinas_v2 não encontrada na tabela configuracao_tanques');
      }
    } catch (error) {
      console.error('Erro ao verificar a configuração do posto Campinas_v2:', error);
    }
    
  } catch (error) {
    console.error('Erro geral na execução do script:', error);
  } finally {
    await pool.end();
  }
}

main();