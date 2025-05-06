/**
 * Script para criar a tabela de abastecimentos para o Posto Alair V2
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Configuração da conexão com o PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function executarScript() {
  try {
    console.log('Iniciando criação da tabela do Posto Alair V2...');
    
    // Lê o arquivo SQL
    const sqlPath = path.join(__dirname, 'criar-tabela-alair-v2.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Executa o script SQL
    await pool.query(sql);
    
    console.log('Script SQL para Posto Alair V2 executado com sucesso!');
    console.log('Tabela posto_murici_alair_v2 criada e configuração de tanques inserida.');
    
    // Verifica se a tabela foi criada
    const result = await pool.query('SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)', ['posto_murici_alair_v2']);
    
    if (result.rows[0].exists) {
      console.log('✅ Tabela posto_murici_alair_v2 confirmada no banco de dados.');
      
      // Conta o número de registros
      const countResult = await pool.query('SELECT COUNT(*) FROM posto_murici_alair_v2');
      console.log(`✅ Número de registros na tabela: ${countResult.rows[0].count}`);
      
      // Verifica a configuração do tanque
      const tanqueResult = await pool.query('SELECT * FROM configuracao_tanques WHERE posto = $1', ['Alair_v2']);
      if (tanqueResult.rows.length > 0) {
        console.log('✅ Configuração do tanque para Posto Alair V2 confirmada:');
        console.log(`   - Capacidade Diesel: ${tanqueResult.rows[0].diesel_capacidade}L`);
        console.log(`   - Nível Diesel: ${tanqueResult.rows[0].diesel_nivel}L`);
        console.log(`   - Valor Diesel: R$ ${tanqueResult.rows[0].diesel_valor_litro}/L`);
      } else {
        console.log('❌ Configuração do tanque não encontrada. Verifique o script SQL.');
      }
    } else {
      console.log('❌ Falha ao criar a tabela. Verifique o script SQL.');
    }
  } catch (err) {
    console.error('Erro ao executar o script:', err);
  } finally {
    // Fecha a conexão com o banco de dados
    await pool.end();
  }
}

// Executa o script
executarScript();