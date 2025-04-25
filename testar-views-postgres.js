/**
 * Script para testar a consulta direto nas views PostgreSQL
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configuração do dotenv
dotenv.config();

const { Pool } = pg;

async function testarViews() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // 1. Listar todas as tabelas/views relacionadas a postos
    console.log("--- Listando tabelas e views de postos ---");
    const queryTables = `
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public'
        AND (
          table_name LIKE 'abastecimentos_posto_%' 
          OR table_name LIKE 'posto_%' 
          OR table_name LIKE '%_posto_%'
        )
      ORDER BY table_name;
    `;
    
    const resultTables = await pool.query(queryTables);
    console.log(`Encontradas ${resultTables.rows.length} tabelas/views:`);
    
    // Filtrar views específicas do Posto Alair
    const alairViews = resultTables.rows
      .filter(row => row.table_name.includes('alair'))
      .map(row => row.table_name);
    console.log("Views do Posto Alair:");
    console.table(alairViews);
    
    // 2. Consultar a view consolidada do Posto Alair
    console.log("\n--- Consultando dados da view consolidada do Posto Alair ---");
    const viewName = 'abastecimentos_posto_alair_consolidado';
    const queryView = `SELECT * FROM "${viewName}" LIMIT 10`;
    
    const resultView = await pool.query(queryView);
    console.log(`Registros na view ${viewName}: ${resultView.rows.length}`);
    
    if (resultView.rows.length > 0) {
      console.log("Primeiro registro:");
      console.log(resultView.rows[0]);
    } else {
      console.log("Nenhum registro encontrado na view consolidada.");
    }
    
    // 3. Verificar estrutura da view
    console.log("\n--- Estrutura da view consolidada ---");
    const queryStructure = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position;
    `;
    
    const resultStructure = await pool.query(queryStructure, [viewName]);
    console.log(`Colunas da view ${viewName}:`);
    console.table(resultStructure.rows.map(row => ({
      column: row.column_name,
      type: row.data_type
    })));
    
    console.log("\nTestes concluídos com sucesso!");
  } catch (error) {
    console.error("Erro ao testar views:", error);
  } finally {
    await pool.end();
  }
}

testarViews().catch(console.error);