/**
 * Script para criar as tabelas necessárias do sistema de postos no Supabase
 * Este script executa o SQL que cria todas as tabelas e views necessárias
 */
import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

// Verificar se a DATABASE_URL está definida
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não encontrada no ambiente. Defina-a no arquivo .env ou nas variáveis de ambiente.');
  process.exit(1);
}

// Conexão com o Supabase via PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function executeSQL(query, params = []) {
  try {
    const result = await pool.query(query, params);
    return result;
  } catch (error) {
    console.error('Erro ao executar query SQL:', error);
    throw error;
  }
}

async function createTables() {
  try {
    console.log('=== CRIAÇÃO DE TABELAS DO SISTEMA DE POSTOS NO SUPABASE ===\n');
    
    // Ler o arquivo SQL
    const sqlFilePath = path.join(process.cwd(), 'create-postos-tables-supabase.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Dividir o SQL em comandos separados (por ponto e vírgula)
    const sqlCommands = sqlContent
      .split(';')
      .filter(cmd => cmd.trim() !== '')
      .map(cmd => cmd.trim() + ';');
    
    // Executar cada comando separadamente
    for (let i = 0; i < sqlCommands.length; i++) {
      const cmd = sqlCommands[i];
      console.log(`Executando comando SQL ${i + 1}/${sqlCommands.length}...`);
      
      try {
        await executeSQL(cmd);
        console.log(`✓ Comando ${i + 1} executado com sucesso.`);
      } catch (error) {
        console.error(`✗ Erro ao executar comando ${i + 1}:`, error.message);
      }
    }
    
    console.log('\nVerificando se as tabelas foram criadas...');
    
    // Verificar se as tabelas foram criadas
    const tables = [
      'configuracao_tanques',
      'abastecimentos_posto_campinas_v2',
      'recebimentos_posto_campinas_v2',
      'movimentacoes_patio_campinas_v2'
    ];
    
    for (const table of tables) {
      const checkResult = await executeSQL(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        ) as "exists";
      `, [table]);
      
      if (checkResult.rows[0].exists) {
        console.log(`✓ Tabela ${table} existe.`);
      } else {
        console.log(`✗ Tabela ${table} NÃO existe!`);
      }
    }
    
    // Verificar se a view foi criada
    const viewCheck = await executeSQL(`
      SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'historico_consolidado_postos'
      ) as "exists";
    `);
    
    if (viewCheck.rows[0].exists) {
      console.log(`✓ View historico_consolidado_postos existe.`);
    } else {
      console.log(`✗ View historico_consolidado_postos NÃO existe!`);
    }
    
    console.log('\nCriação de tabelas concluída.');
    
  } catch (error) {
    console.error('Erro geral na execução do script:', error);
  } finally {
    await pool.end();
  }
}

createTables().catch(console.error);