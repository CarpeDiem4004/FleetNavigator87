/**
 * Script para executar a criação das tabelas da base Goiânia no Supabase
 * Este script lê o arquivo SQL e executa as instruções no banco de dados
 * 
 * Para executar:
 * node execute-goiania-tables-script.js
 */

require('dotenv').config();
const fs = require('fs');
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// Conexão com o banco de dados via PostgreSQL direto
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Alternativa via Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Arquivo SQL a ser executado
const sqlFile = 'create-goiania-v2-tables-complete.sql';

async function executeSqlFile() {
  console.log(`Executando script SQL: ${sqlFile}`);
  
  try {
    // Ler o conteúdo do arquivo
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Dividir o conteúdo em instruções SQL individuais
    // Esta é uma abordagem simples que pode precisar de ajustes para SQL complexo
    const sqlStatements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Encontradas ${sqlStatements.length} instruções SQL para execução`);
    
    // Executar cada instrução SQL
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      console.log(`Executando instrução ${i + 1}/${sqlStatements.length}...`);
      
      try {
        // Executar via PostgreSQL direto
        await pool.query(statement);
        console.log(`✓ Instrução ${i + 1} executada com sucesso`);
      } catch (error) {
        console.error(`✗ Erro ao executar instrução ${i + 1}:`, error.message);
        console.error('SQL com erro:', statement.substring(0, 150) + '...');
        
        // Tentar novamente via Supabase se a execução direta falhar
        try {
          console.log('Tentando via Supabase...');
          const { error: supabaseError } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (supabaseError) {
            console.error('✗ Erro também via Supabase:', supabaseError.message);
          } else {
            console.log('✓ Instrução executada com sucesso via Supabase');
          }
        } catch (supabaseError) {
          console.error('✗ Erro ao tentar via Supabase:', supabaseError.message);
        }
      }
    }
    
    console.log('Execução do script SQL concluída!');
  } catch (error) {
    console.error('Erro ao processar o arquivo SQL:', error.message);
  } finally {
    // Encerrar a conexão com o pool
    await pool.end();
  }
}

// Função para verificar se a base Goiânia foi criada corretamente
async function verificarBaseGoiania() {
  try {
    console.log('\nVerificando a criação da base Goiânia...');
    
    // Verificar a tabela principal de abastecimentos
    const queryAbastecimentos = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'abastecimentos_posto_goiania_v2'
      );
    `;
    
    const resultAbastecimentos = await pool.query(queryAbastecimentos);
    
    if (resultAbastecimentos.rows[0].exists) {
      console.log('✓ Tabela abastecimentos_posto_goiania_v2 criada com sucesso');
    } else {
      console.error('✗ Tabela abastecimentos_posto_goiania_v2 não foi criada');
    }
    
    // Verificar a adição na tabela de bases
    const queryBase = `
      SELECT * FROM bases WHERE id = 10;
    `;
    
    const resultBase = await pool.query(queryBase);
    
    if (resultBase.rows.length > 0) {
      console.log('✓ Base Goiânia adicionada à tabela bases com ID 10');
      console.log('  Nome:', resultBase.rows[0].name);
      console.log('  Local:', resultBase.rows[0].location);
      console.log('  Ativo:', resultBase.rows[0].active);
    } else {
      console.error('✗ Base Goiânia não foi adicionada à tabela bases');
    }
    
    // Verificar configuração de tanques
    const queryTanques = `
      SELECT * FROM configuracao_tanques WHERE posto = 'Goiania_v2';
    `;
    
    const resultTanques = await pool.query(queryTanques);
    
    if (resultTanques.rows.length > 0) {
      console.log('✓ Configuração de tanques para Goiânia criada com sucesso');
      console.log('  Capacidade diesel:', resultTanques.rows[0].diesel_capacidade);
      console.log('  Nível diesel:', resultTanques.rows[0].diesel_nivel);
      console.log('  Valor litro diesel:', resultTanques.rows[0].diesel_valor_litro);
    } else {
      console.error('✗ Configuração de tanques para Goiânia não foi criada');
    }
    
    // Verificar view de histórico consolidado
    const queryView = `
      SELECT * FROM historico_consolidado_abastecimentos WHERE posto = 'goiania_v2' LIMIT 1;
    `;
    
    const resultView = await pool.query(queryView);
    
    if (resultView.rows.length > 0) {
      console.log('✓ View de histórico consolidado incluindo Goiânia está funcionando');
    } else {
      console.log('ℹ View de histórico consolidado não possui dados para Goiânia ainda');
    }
    
    console.log('\nVerificação da base Goiânia concluída!');
  } catch (error) {
    console.error('Erro ao verificar a base Goiânia:', error.message);
  } finally {
    // Encerrar a conexão com o pool
    await pool.end();
  }
}

// Executar o script
executeSqlFile()
  .then(() => {
    // Após executar o script, verificar se a base foi criada corretamente
    verificarBaseGoiania();
  })
  .catch(error => {
    console.error('Erro ao executar o script:', error.message);
  });