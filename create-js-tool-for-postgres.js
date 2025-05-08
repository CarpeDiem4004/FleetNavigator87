/**
 * Script para executar os comandos SQL no Supabase
 * Use este script como alternativa caso a execução direta no Editor SQL do Supabase falhe
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração da conexão (substitua com os valores do seu projeto Supabase)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Array com os scripts SQL em ordem de execução
const sqlScripts = [
  'create-recebimentos-tables-supabase.sql',
  'create-movimentacoes-tables-supabase.sql',
  'create-abastecimentos-tables-supabase.sql',
  'create-view-historico-postos.sql',
  'create-configuracoes-tanques.sql'
];

// Função para executar um script SQL
async function executeScript(filename) {
  try {
    const filePath = path.join(__dirname, filename);
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    console.log(`\n===== Executando ${filename} =====`);
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sqlContent);
      await client.query('COMMIT');
      console.log(`✅ Sucesso: ${filename} executado com sucesso`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Erro em ${filename}:`);
      console.error(error.message);
      throw error; // Propagar o erro para interromper a execução
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Não foi possível executar ${filename}`);
    throw error;
  }
}

// Função principal que executa os scripts em ordem
async function main() {
  try {
    console.log('Iniciando criação de tabelas no Supabase...');
    
    for (const script of sqlScripts) {
      await executeScript(script);
    }
    
    console.log('\n✅ Todos os scripts foram executados com sucesso!');
    
    // Verificar a criação das tabelas
    const client = await pool.connect();
    try {
      console.log('\n===== Verificando tabelas criadas =====');
      
      // Verificar tabelas de recebimentos
      const recebimentosResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'recebimentos_posto_%'
        ORDER BY table_name
      `);
      
      console.log('Tabelas de recebimentos:');
      recebimentosResult.rows.forEach(row => console.log(`- ${row.table_name}`));
      
      // Verificar tabelas de movimentações
      const movimentacoesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'movimentacoes_patio_%'
        ORDER BY table_name
      `);
      
      console.log('\nTabelas de movimentações:');
      movimentacoesResult.rows.forEach(row => console.log(`- ${row.table_name}`));
      
      // Verificar view de histórico
      const viewResult = await client.query(`
        SELECT * FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'historico_consolidado_postos'
      `);
      
      console.log('\nView de histórico:');
      if (viewResult.rows.length > 0) {
        console.log('✅ View historico_consolidado_postos criada com sucesso');
      } else {
        console.log('❌ View historico_consolidado_postos não foi criada');
      }
      
      // Verificar configurações dos tanques
      const configResult = await client.query(`
        SELECT posto, diesel_capacidade, diesel_nivel, arla_capacidade, arla_nivel
        FROM configuracao_tanques
        ORDER BY posto
      `);
      
      console.log('\nConfigurações dos tanques:');
      configResult.rows.forEach(row => {
        console.log(`- ${row.posto}: Diesel ${row.diesel_nivel}/${row.diesel_capacidade}L, Arla ${row.arla_nivel}/${row.arla_capacidade}L`);
      });
      
    } catch (error) {
      console.error('Erro ao verificar tabelas:', error);
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Processo interrompido devido a erros.');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar o script
main().catch(console.error);