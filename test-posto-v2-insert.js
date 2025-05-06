/**
 * Script para testar a inserção de registros nas tabelas de postos v2
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function testPostoInserts() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Postos V2 para testar - verificar se há argumento de linha de comando
    let postosV2 = ['abc_v2', 'socorro_v2', 'sorocaba_v2'];
    
    // Se foi especificado um posto específico como argumento
    if (process.argv.length > 2) {
      const postoArg = process.argv[2].toLowerCase();
      console.log(`Testando apenas o posto específico: ${postoArg}`);
      postosV2 = [postoArg];
    }
    
    for (const posto of postosV2) {
      const tableName = `abastecimentos_posto_${posto}`;
      console.log(`\nTestando inserção na tabela ${tableName}...`);
      
      // Criando dados de teste para inserção
      const testData = {
        placa: 'TST1234',
        km_atual: 50000,
        tipo_combustivel: 'Diesel',
        litros: 100.50,
        motorista: 'Motorista Teste',
        motorista_rg: '123456789',
        operador: 'Operador Teste',
        valor_litro: 5.50,
        valor_total: 552.75,
        tipo_veiculo: 'Caminhão',
        observacoes: 'Registro de teste de inserção',
        lavagem: false,
        tipo_lavagem: null
      };
      
      // Montando a query de inserção
      const insertQuery = `
        INSERT INTO "${tableName}" (
          placa,
          km_atual,
          tipo_combustivel,
          litros,
          motorista,
          motorista_rg,
          operador,
          valor_litro,
          valor_total,
          tipo_veiculo,
          observacoes,
          lavagem,
          tipo_lavagem,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()
        ) RETURNING *
      `;
      
      const values = [
        testData.placa,
        testData.km_atual,
        testData.tipo_combustivel,
        testData.litros,
        testData.motorista,
        testData.motorista_rg,
        testData.operador,
        testData.valor_litro,
        testData.valor_total,
        testData.tipo_veiculo,
        testData.observacoes,
        testData.lavagem,
        testData.tipo_lavagem
      ];
      
      // Executando a inserção
      const result = await pool.query(insertQuery, values);
      
      if (result.rows.length > 0) {
        console.log(`✅ Registro inserido com sucesso na tabela ${tableName}`);
        console.log('ID do registro:', result.rows[0].id);
      } else {
        console.log(`❌ Falha ao inserir registro na tabela ${tableName}`);
      }
      
      // Verificando se o registro foi inserido corretamente
      const selectQuery = `SELECT * FROM "${tableName}" WHERE placa = $1 ORDER BY created_at DESC LIMIT 1`;
      const selectResult = await pool.query(selectQuery, [testData.placa]);
      
      if (selectResult.rows.length > 0) {
        console.log(`✅ Registro encontrado na tabela ${tableName}`);
        console.log('Dados do registro:', selectResult.rows[0]);
      } else {
        console.log(`❌ Registro não encontrado na tabela ${tableName}`);
      }
    }
    
  } catch (error) {
    console.error('Erro ao testar inserções:', error);
  } finally {
    await pool.end();
  }
}

testPostoInserts().catch(console.error);