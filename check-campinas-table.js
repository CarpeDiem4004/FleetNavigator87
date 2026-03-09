/**
 * Script para verificar se a tabela campinas_budget_requests existe
 * e mostrar informações sobre ela
 */
const { Pool } = require('pg');

async function main() {
  // Criar uma conexão com o banco de dados
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Verificando se a tabela campinas_budget_requests existe...');
    
    // Verificar se a tabela existe
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'campinas_budget_requests'
      ) AS "exists";
    `;
    
    const tableCheck = await pool.query(tableCheckQuery);
    const tableExists = tableCheck.rows[0].exists;
    
    console.log('Tabela campinas_budget_requests existe:', tableExists);
    
    if (tableExists) {
      // Verificar a estrutura da tabela
      const structureQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'campinas_budget_requests'
        ORDER BY ordinal_position;
      `;
      
      const structureResult = await pool.query(structureQuery);
      console.log('Estrutura da tabela:');
      structureResult.rows.forEach(column => {
        console.log(`  - ${column.column_name} (${column.data_type}, ${column.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
      });
      
      // Verificar contagem de registros
      const countQuery = 'SELECT COUNT(*) FROM campinas_budget_requests';
      const countResult = await pool.query(countQuery);
      console.log('Número total de registros:', countResult.rows[0].count);
      
      // Mostrar amostra de registros se houver algum
      if (parseInt(countResult.rows[0].count) > 0) {
        console.log('Amostra dos primeiros registros:');
        const sampleResult = await pool.query(
          'SELECT id, title, requester_name, created_at, status, base_id, base_name FROM campinas_budget_requests LIMIT 3'
        );
        
        sampleResult.rows.forEach(row => {
          console.log(`  - ID: ${row.id}, Título: ${row.title}, Solicitante: ${row.requester_name}, Status: ${row.status}, Base: ${row.base_name || "N/A"}`);
        });
      } else {
        console.log('A tabela não contém nenhum registro.');
      }
    }
  } catch (error) {
    console.error('Erro ao verificar tabela campinas_budget_requests:', error);
  } finally {
    // Fechar a conexão com o banco
    await pool.end();
  }
}

main();