/**
 * Script para verificar a estrutura das tabelas v2 dos postos
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function checkTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Verificar se as tabelas existem
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'abastecimentos_posto_%'
      ORDER BY table_name;
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    console.log('Tabelas encontradas:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });

    // Verificar estrutura das tabelas v2
    const tablesToCheck = ['abc_v2', 'socorro_v2', 'sorocaba_v2'];
    
    for (const table of tablesToCheck) {
      const tableName = `abastecimentos_posto_${table}`;
      console.log(`\nVerificando estrutura da tabela ${tableName}:`);
      
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = $1
        ORDER BY ordinal_position;
      `;
      
      const columnsResult = await pool.query(columnsQuery, [tableName]);
      
      if (columnsResult.rows.length === 0) {
        console.log(`Tabela ${tableName} não encontrada ou sem colunas!`);
      } else {
        columnsResult.rows.forEach(col => {
          console.log(`  ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
      }
    }
    
    // Verificar views
    const viewsQuery = `
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'
      AND (
        table_name LIKE 'abastecimentos_posto_abc_v2%' OR
        table_name LIKE 'abastecimentos_posto_socorro_v2%' OR
        table_name LIKE 'abastecimentos_posto_sorocaba_v2%'
      )
      ORDER BY table_name;
    `;
    
    const viewsResult = await pool.query(viewsQuery);
    console.log('\nViews encontradas:');
    viewsResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('Erro ao verificar tabelas:', error);
  } finally {
    await pool.end();
  }
}

checkTables().catch(console.error);