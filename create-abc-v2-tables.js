/**
 * Script para criar a tabela v2 para o posto ABC_v2 que está faltando
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createAbcV2Tables() {
  try {
    // Criar tabela para ABC_v2
    const abcTableSql = `
      CREATE TABLE IF NOT EXISTS abastecimentos_posto_abc_v2 (
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

    // Executar criação da tabela
    console.log('Criando tabela abastecimentos_posto_abc_v2...');
    await pool.query(abcTableSql);
    console.log('Tabela abastecimentos_posto_abc_v2 criada com sucesso!');

    // Criar views úteis para o posto ABC_v2
    const abcViewsSql = [
      `CREATE OR REPLACE VIEW abastecimentos_posto_abc_v2_ultimos AS
       SELECT * FROM abastecimentos_posto_abc_v2
       ORDER BY created_at DESC LIMIT 10;`,

      `CREATE OR REPLACE VIEW abastecimentos_posto_abc_v2_estatisticas_mensais AS
       SELECT 
         date_trunc('month', created_at) as mes,
         count(*) as total_abastecimentos,
         sum(litros) as total_litros,
         sum(valor_total) as total_valor,
         avg(valor_litro) as media_valor_litro
       FROM abastecimentos_posto_abc_v2
       GROUP BY mes
       ORDER BY mes DESC;`,

      `CREATE OR REPLACE VIEW abastecimentos_posto_abc_v2_consumo_por_veiculo AS
       SELECT 
         placa,
         count(*) as total_abastecimentos,
         sum(litros) as total_litros,
         sum(valor_total) as total_valor,
         max(created_at) as ultimo_abastecimento
       FROM abastecimentos_posto_abc_v2
       GROUP BY placa
       ORDER BY total_litros DESC;`,

      `CREATE OR REPLACE VIEW abastecimentos_posto_abc_v2_comparativo_combustiveis AS
       SELECT 
         tipo_combustivel,
         count(*) as total_abastecimentos,
         sum(litros) as total_litros,
         sum(valor_total) as total_valor,
         avg(valor_litro) as media_valor_litro
       FROM abastecimentos_posto_abc_v2
       GROUP BY tipo_combustivel
       ORDER BY total_litros DESC;`
    ];

    // Executar criação de views para ABC_v2
    console.log('Criando views para ABC_v2...');
    for (const viewSql of abcViewsSql) {
      await pool.query(viewSql);
    }
    console.log('Views para ABC_v2 criadas com sucesso!');

    console.log('Todas as tabelas e views para ABC_v2 foram criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
  } finally {
    pool.end();
  }
}

createAbcV2Tables().catch(console.error);