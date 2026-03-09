/**
 * Script para criar as tabelas v2 para postos que estão faltando
 * Especificamente para Socorro_v2 e Sorocaba_v2
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createTables() {
  try {
    // Criar tabela para Socorro_v2
    const socorroTableSql = `
      CREATE TABLE IF NOT EXISTS abastecimentos_posto_socorro_v2 (
        id SERIAL PRIMARY KEY,
        placa VARCHAR(10),
        km_atual INTEGER,
        tipo_combustivel VARCHAR(20),
        litros NUMERIC(10, 2),
        motorista VARCHAR(100),
        motorista_rg VARCHAR(20),
        operador VARCHAR(100),
        valor_litro NUMERIC(10, 3),
        valor_total NUMERIC(10, 2),
        tipo_veiculo VARCHAR(50),
        observacoes TEXT,
        lavagem BOOLEAN DEFAULT FALSE,
        tipo_lavagem VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Criar tabela para Sorocaba_v2
    const sorocabaTableSql = `
      CREATE TABLE IF NOT EXISTS abastecimentos_posto_sorocaba_v2 (
        id SERIAL PRIMARY KEY,
        placa VARCHAR(10),
        km_atual INTEGER,
        tipo_combustivel VARCHAR(20),
        litros NUMERIC(10, 2),
        motorista VARCHAR(100),
        motorista_rg VARCHAR(20),
        operador VARCHAR(100),
        valor_litro NUMERIC(10, 3),
        valor_total NUMERIC(10, 2),
        tipo_veiculo VARCHAR(50),
        observacoes TEXT,
        lavagem BOOLEAN DEFAULT FALSE,
        tipo_lavagem VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Executar criação das tabelas
    console.log('Criando tabela abastecimentos_posto_socorro_v2...');
    await pool.query(socorroTableSql);
    console.log('Tabela abastecimentos_posto_socorro_v2 criada com sucesso!');

    console.log('Criando tabela abastecimentos_posto_sorocaba_v2...');
    await pool.query(sorocabaTableSql);
    console.log('Tabela abastecimentos_posto_sorocaba_v2 criada com sucesso!');

    // Criar views úteis para o posto Socorro_v2
    const socorroViewsSql = [
      `CREATE OR REPLACE VIEW abastecimentos_posto_socorro_v2_ultimos AS
       SELECT * FROM abastecimentos_posto_socorro_v2
       ORDER BY created_at DESC LIMIT 10;`,

      `CREATE OR REPLACE VIEW abastecimentos_posto_socorro_v2_estatisticas_mensais AS
       SELECT 
         date_trunc('month', created_at) as mes,
         count(*) as total_abastecimentos,
         sum(litros) as total_litros,
         sum(valor_total) as total_valor,
         avg(valor_litro) as media_valor_litro
       FROM abastecimentos_posto_socorro_v2
       GROUP BY mes
       ORDER BY mes DESC;`,

      `CREATE OR REPLACE VIEW abastecimentos_posto_socorro_v2_consumo_por_veiculo AS
       SELECT 
         placa,
         count(*) as total_abastecimentos,
         sum(litros) as total_litros,
         sum(valor_total) as total_valor,
         max(created_at) as ultimo_abastecimento
       FROM abastecimentos_posto_socorro_v2
       GROUP BY placa
       ORDER BY total_litros DESC;`,

      `CREATE OR REPLACE VIEW abastecimentos_posto_socorro_v2_comparativo_combustiveis AS
       SELECT 
         tipo_combustivel,
         count(*) as total_abastecimentos,
         sum(litros) as total_litros,
         sum(valor_total) as total_valor,
         avg(valor_litro) as media_valor_litro
       FROM abastecimentos_posto_socorro_v2
       GROUP BY tipo_combustivel
       ORDER BY total_litros DESC;`
    ];

    // Criar views úteis para o posto Sorocaba_v2
    const sorocabaViewsSql = [
      `CREATE OR REPLACE VIEW abastecimentos_posto_sorocaba_v2_ultimos AS
       SELECT * FROM abastecimentos_posto_sorocaba_v2
       ORDER BY created_at DESC LIMIT 10;`,

      `CREATE OR REPLACE VIEW abastecimentos_posto_sorocaba_v2_estatisticas_mensais AS
       SELECT 
         date_trunc('month', created_at) as mes,
         count(*) as total_abastecimentos,
         sum(litros) as total_litros,
         sum(valor_total) as total_valor,
         avg(valor_litro) as media_valor_litro
       FROM abastecimentos_posto_sorocaba_v2
       GROUP BY mes
       ORDER BY mes DESC;`,

      `CREATE OR REPLACE VIEW abastecimentos_posto_sorocaba_v2_consumo_por_veiculo AS
       SELECT 
         placa,
         count(*) as total_abastecimentos,
         sum(litros) as total_litros,
         sum(valor_total) as total_valor,
         max(created_at) as ultimo_abastecimento
       FROM abastecimentos_posto_sorocaba_v2
       GROUP BY placa
       ORDER BY total_litros DESC;`,

      `CREATE OR REPLACE VIEW abastecimentos_posto_sorocaba_v2_comparativo_combustiveis AS
       SELECT 
         tipo_combustivel,
         count(*) as total_abastecimentos,
         sum(litros) as total_litros,
         sum(valor_total) as total_valor,
         avg(valor_litro) as media_valor_litro
       FROM abastecimentos_posto_sorocaba_v2
       GROUP BY tipo_combustivel
       ORDER BY total_litros DESC;`
    ];

    // Executar criação de views para Socorro_v2
    console.log('Criando views para Socorro_v2...');
    for (const viewSql of socorroViewsSql) {
      await pool.query(viewSql);
    }
    console.log('Views para Socorro_v2 criadas com sucesso!');

    // Executar criação de views para Sorocaba_v2
    console.log('Criando views para Sorocaba_v2...');
    for (const viewSql of sorocabaViewsSql) {
      await pool.query(viewSql);
    }
    console.log('Views para Sorocaba_v2 criadas com sucesso!');

    console.log('Todas as tabelas e views foram criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
  } finally {
    pool.end();
  }
}

createTables().catch(console.error);