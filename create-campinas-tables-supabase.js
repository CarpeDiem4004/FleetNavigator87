/**
 * Script para criar as tabelas da Base Campinas no Supabase
 * Este script verifica se as tabelas existem e as cria se não existirem
 */

import { promises as fs } from 'fs';
import { config } from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configurar variáveis de ambiente
config();

// Obter o diretório atual do arquivo
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurar conexão com o banco de dados Supabase
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log('Iniciando criação das tabelas da Base Campinas no Supabase...');

  try {
    // Verificar se a tabela de solicitações de orçamento da Base Campinas existe
    const checkBudgetTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'campinas_budget_requests'
      );
    `);

    if (!checkBudgetTable.rows[0].exists) {
      console.log('Criando tabela campinas_budget_requests...');
      // Ler o arquivo SQL e executar
      const sql = await fs.readFile('./create-base-campinas-tables-supabase.sql', 'utf8');
      await pool.query(sql);
      console.log('Tabelas da Base Campinas criadas com sucesso!');
    } else {
      console.log('Tabela campinas_budget_requests já existe.');
    }

    // Verificar se as tabelas foram criadas corretamente
    const tables = [
      'campinas_budget_requests',
      'campinas_expenses',
      'campinas_tire_requests',
      'campinas_fleet_maintenance'
    ];

    for (const table of tables) {
      const checkResult = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${table}'
        );
      `);
      
      if (checkResult.rows[0].exists) {
        console.log(`✅ Tabela ${table} existe.`);
        
        // Verificar se há registros na tabela
        const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`   - Registros: ${countResult.rows[0].count}`);
      } else {
        console.log(`❌ Tabela ${table} NÃO existe!`);
      }
    }

    console.log('Processo concluído com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
  } finally {
    await pool.end();
  }
}

main();