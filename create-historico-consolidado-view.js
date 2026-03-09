/**
 * Script para criar a view historico_consolidado_abastecimentos
 * Esta view vai consolidar os dados de todas as tabelas de abastecimentos
 * para garantir uma consulta padronizada e centralizada
 */

import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

// Configura a conexão com o PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function executeSQL(query) {
  try {
    const result = await pool.query(query);
    console.log(`Consulta SQL executada com sucesso. Linhas afetadas: ${result.rowCount || 0}`);
    return result;
  } catch (error) {
    console.error(`Erro ao executar consulta SQL: ${error.message}`);
    console.error(`Query: ${query}`);
    throw error;
  }
}

async function main() {
  try {
    console.log('Iniciando criação da view de histórico consolidado de abastecimentos...');
    
    // Lê o arquivo SQL
    const sqlQuery = fs.readFileSync('./create-historico-consolidado-view-abastecimentos.sql', 'utf8');
    
    // Executa o SQL para criar a view
    await executeSQL(sqlQuery);
    
    console.log('View historico_consolidado_abastecimentos criada com sucesso!');
    
    // Verifica se a view foi criada corretamente
    const checkResult = await executeSQL(`
      SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_name = 'historico_consolidado_abastecimentos'
      );
    `);
    
    if (checkResult.rows[0].exists) {
      console.log('✅ View criada e verificada com sucesso!');
      
      // Conta registros na view
      const countResult = await executeSQL('SELECT COUNT(*) FROM historico_consolidado_abastecimentos');
      console.log(`Total de registros na view: ${countResult.rows[0].count}`);
    } else {
      console.error('❌ View não foi criada corretamente.');
    }
    
  } catch (error) {
    console.error(`Erro ao criar view: ${error.message}`);
  } finally {
    // Fecha a conexão com o banco
    await pool.end();
  }
}

// Executa o script
main();