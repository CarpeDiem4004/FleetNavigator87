/**
 * Script para criar a tabela de abastecimentos para Campinas V2
 * Esta tabela segue o mesmo padrão das outras tabelas de postos v2
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function createCampinasV2Table() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Conectado ao banco de dados');

    // Verificar se a tabela já existe
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'abastecimentos_posto_campinas_v2'
      );
    `;

    const checkResult = await pool.query(checkTableQuery);
    const tableExists = checkResult.rows[0].exists;

    if (tableExists) {
      console.log('⚠️ A tabela abastecimentos_posto_campinas_v2 já existe!');
      return;
    }

    // Criar a tabela baseada na estrutura das outras tabelas
    const createTableQuery = `
      CREATE TABLE abastecimentos_posto_campinas_v2 (
        id SERIAL PRIMARY KEY,
        placa VARCHAR(20),
        km_atual INTEGER,
        tipo_combustivel VARCHAR(30),
        litros NUMERIC,
        motorista VARCHAR(100),
        motorista_rg VARCHAR(30),
        operador VARCHAR(100),
        valor_litro NUMERIC,
        valor_total NUMERIC,
        tipo_veiculo VARCHAR(50),
        observacoes TEXT,
        lavagem BOOLEAN DEFAULT false,
        tipo_lavagem VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createTableQuery);
    console.log('✅ Tabela abastecimentos_posto_campinas_v2 criada com sucesso!');

    // Adicionar alguns registros iniciais vazios para testes
    const insertSampleQuery = `
      INSERT INTO abastecimentos_posto_campinas_v2
        (placa, km_atual, tipo_combustivel, litros, motorista, motorista_rg, 
         operador, valor_litro, valor_total, tipo_veiculo, observacoes, lavagem, 
         tipo_lavagem, created_at, updated_at)
      VALUES
        ('ABC1234', 50000, 'Diesel', 100.5, 'Motorista Teste', '12345678-9', 
         'Operador Teste', 6.50, 653.25, 'Caminhão', 'Abastecimento inicial de teste', false, 
         NULL, NOW(), NOW());
    `;

    await pool.query(insertSampleQuery);
    console.log('✅ Registro de teste adicionado à tabela');

  } catch (error) {
    console.error('Erro durante a execução:', error);
  } finally {
    await pool.end();
    console.log('Conexão com o banco encerrada');
  }
}

// Executar a função principal
createCampinasV2Table().catch(err => {
  console.error('Erro na execução do script:', err);
  process.exit(1);
});