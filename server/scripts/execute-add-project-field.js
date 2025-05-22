/**
 * Script para executar a adição do campo "project" na tabela abastecimentos_posto_guarulhos_v2
 * Este script executa o SQL que adiciona o campo faltante
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// Configuração da conexão usando variável de ambiente
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function executeSQL(query) {
  try {
    const result = await pool.query(query);
    console.log('SQL executado com sucesso:', result);
    return result;
  } catch (error) {
    console.error('Erro ao executar SQL:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Verificando se a coluna project existe na tabela abastecimentos_posto_guarulhos_v2...');
    
    // Verificar se a coluna existe
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'abastecimentos_posto_guarulhos_v2'
        AND column_name = 'project'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log('Coluna project não existe. Adicionando...');
      
      // Executar a adição da coluna
      await executeSQL(`
        ALTER TABLE abastecimentos_posto_guarulhos_v2 
        ADD COLUMN project VARCHAR(100)
      `);
      
      console.log('Coluna project adicionada com sucesso!');
    } else {
      console.log('Coluna project já existe na tabela.');
    }
    
    // Verificar a estrutura atual da tabela
    const tableStructure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'abastecimentos_posto_guarulhos_v2'
    `);
    
    console.log('Estrutura atual da tabela abastecimentos_posto_guarulhos_v2:');
    tableStructure.rows.forEach(column => {
      console.log(`- ${column.column_name}: ${column.data_type}`);
    });
    
    console.log('Processo finalizado com sucesso!');
  } catch (error) {
    console.error('Erro durante a execução:', error);
  } finally {
    // Encerrar a conexão com o pool
    await pool.end();
  }
}

// Executar o script
main();