/**
 * Script para recriar a tabela de abastecimentos para Osasco V2
 * Esta tabela seguirá o mesmo padrão das outras tabelas de postos v2
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function recreateOsascoV2Table() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Conectado ao banco de dados');

    // 1. Verificar a estrutura atual da tabela
    const checkStructureQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'abastecimentos_posto_osasco_v2' 
      ORDER BY ordinal_position;
    `;

    const structureResult = await pool.query(checkStructureQuery);
    console.log('Estrutura atual da tabela:');
    structureResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });

    // 2. Fazer backup dos dados existentes
    const backupQuery = `
      SELECT * FROM abastecimentos_posto_osasco_v2;
    `;
    
    const backupResult = await pool.query(backupQuery);
    const backupData = backupResult.rows;
    console.log(`Backup de ${backupData.length} registros realizado`);

    // 3. Remover as views dependentes e a tabela atual
    await pool.query('DROP TABLE IF EXISTS abastecimentos_posto_osasco_v2 CASCADE;');
    console.log('Tabela original e views dependentes removidas');

    // 4. Criar nova tabela com a estrutura correta
    const createTableQuery = `
      CREATE TABLE abastecimentos_posto_osasco_v2 (
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
    console.log('✅ Nova tabela abastecimentos_posto_osasco_v2 criada com sucesso!');

    // 5. Migrar dados do backup para o novo formato
    if (backupData.length > 0) {
      console.log('Migrando dados para o novo formato...');
      
      for (const record of backupData) {
        const insertQuery = `
          INSERT INTO abastecimentos_posto_osasco_v2
            (placa, km_atual, tipo_combustivel, litros, motorista, motorista_rg, 
             operador, valor_litro, valor_total, tipo_veiculo, observacoes, lavagem, 
             tipo_lavagem, created_at, updated_at)
          VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `;
        
        await pool.query(insertQuery, [
          record.vehicle_plate || 'Desconhecido',            // placa
          record.odometer || 0,                              // km_atual
          record.type_fuel || 'Diesel',                      // tipo_combustivel
          record.quantity_litros || 0,                       // litros
          record.driver_name || 'Desconhecido',              // motorista
          '',                                                // motorista_rg
          '',                                                // operador
          record.valor_litro || 0,                           // valor_litro
          record.total_cartao || 0,                          // valor_total
          '',                                                // tipo_veiculo
          record.obs || '',                                  // observacoes
          false,                                             // lavagem
          '',                                                // tipo_lavagem
          record.data_abastecimento || record.criado_em,     // created_at
          record.atualizado_em || new Date()                 // updated_at
        ]);
      }
      
      console.log(`✅ ${backupData.length} registros migrados para a nova estrutura`);
    }

    // 6. Adicionar um registro de teste
    const insertSampleQuery = `
      INSERT INTO abastecimentos_posto_osasco_v2
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
recreateOsascoV2Table().catch(err => {
  console.error('Erro na execução do script:', err);
  process.exit(1);
});