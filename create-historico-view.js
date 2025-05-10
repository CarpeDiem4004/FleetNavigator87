/**
 * Script para criar a view historico_consolidado_abastecimentos no Supabase
 * Esta view é necessária para a página de histórico consolidado funcionar
 */

import pg from 'pg';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const { Pool } = pg;

// Verificar se temos a variável DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('ERRO: Variável de ambiente DATABASE_URL não encontrada');
  console.error('Por favor, verifique se o banco de dados está configurado corretamente');
  process.exit(1);
}

// Configurar conexão com o banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  let client;

  try {
    console.log('Conectando ao banco de dados...');
    client = await pool.connect();
    
    // Verificar se a view já existe
    const checkViewQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'historico_consolidado_abastecimentos'
      );
    `;
    
    const checkResult = await client.query(checkViewQuery);
    
    if (checkResult.rows[0].exists) {
      console.log('A view historico_consolidado_abastecimentos já existe. Removendo...');
      await client.query('DROP VIEW historico_consolidado_abastecimentos;');
      console.log('View removida com sucesso.');
    }
    
    // Construir a query para criar a view
    console.log('Criando a view historico_consolidado_abastecimentos...');
    
    const createViewQuery = `
CREATE OR REPLACE VIEW historico_consolidado_abastecimentos AS
SELECT 
    id, 
    placa, 
    km_atual AS km,
    tipo_combustivel,
    litros AS quantidade_litros,
    motorista AS nome_motorista,
    motorista_rg AS rg_motorista,
    operador AS nome_operador,
    valor_litro,
    valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    'Osasco_v2' AS nome_posto,
    TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at
FROM abastecimentos_posto_osasco_v2

UNION ALL

SELECT 
    id, 
    placa, 
    km_atual AS km,
    tipo_combustivel,
    litros AS quantidade_litros,
    motorista AS nome_motorista,
    motorista_rg AS rg_motorista,
    operador AS nome_operador,
    valor_litro,
    valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    'ABC_v2' AS nome_posto,
    TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at
FROM abastecimentos_posto_abc_v2

UNION ALL

SELECT 
    id, 
    placa, 
    km_atual AS km,
    tipo_combustivel,
    litros AS quantidade_litros,
    motorista AS nome_motorista,
    motorista_rg AS rg_motorista,
    operador AS nome_operador,
    valor_litro,
    valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    'Socorro_v2' AS nome_posto,
    TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at
FROM abastecimentos_posto_socorro_v2

UNION ALL

SELECT 
    id, 
    placa, 
    km_atual AS km,
    tipo_combustivel,
    litros AS quantidade_litros,
    motorista AS nome_motorista,
    motorista_rg AS rg_motorista,
    operador AS nome_operador,
    valor_litro,
    valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    'Sorocaba_v2' AS nome_posto,
    TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at
FROM abastecimentos_posto_sorocaba_v2

UNION ALL

SELECT 
    id, 
    placa, 
    km_atual AS km,
    tipo_combustivel,
    litros AS quantidade_litros,
    motorista AS nome_motorista,
    motorista_rg AS rg_motorista,
    operador AS nome_operador,
    valor_litro,
    valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    'Campinas_v2' AS nome_posto,
    TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at
FROM abastecimentos_posto_campinas_v2

UNION ALL

SELECT 
    id, 
    placa, 
    km,
    tipo_combustivel,
    quantidade_litros,
    motorista_nome AS nome_motorista,
    motorista_rg AS rg_motorista,
    NULL AS nome_operador,
    valor_litro,
    valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    'Remedios' AS nome_posto,
    TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at
FROM posto_remedios_abastecimentos

ORDER BY created_at DESC;
    `;
    
    await client.query(createViewQuery);
    
    console.log('View historico_consolidado_abastecimentos criada com sucesso!');
    
    // Verificar se a view foi criada corretamente
    const testQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'historico_consolidado_abastecimentos'
      );
    `;
    
    const testResult = await client.query(testQuery);
    
    if (testResult.rows[0].exists) {
      console.log('✅ Verificação concluída: A view foi criada corretamente!');
      
      // Testar a view com uma consulta simples
      console.log('Testando a view com uma consulta...');
      
      const countQuery = `
        SELECT COUNT(*) as total FROM historico_consolidado_abastecimentos;
      `;
      
      const countResult = await client.query(countQuery);
      
      console.log(`Total de registros na view: ${countResult.rows[0].total}`);
      
      const sampleQuery = `
        SELECT * FROM historico_consolidado_abastecimentos LIMIT 1;
      `;
      
      const sampleResult = await client.query(sampleQuery);
      
      if (sampleResult.rows.length > 0) {
        console.log('Exemplo de registro:');
        console.log(JSON.stringify(sampleResult.rows[0], null, 2));
      } else {
        console.log('A view não contém registros.');
      }
    } else {
      console.log('❌ Erro: A view não foi criada corretamente.');
    }
    
  } catch (error) {
    console.error('Erro ao executar o script:', error);
  } finally {
    if (client) {
      client.release();
    }
    
    // Encerrar o pool de conexões
    await pool.end();
    console.log('Conexão encerrada.');
  }
}

main().catch(console.error);