/**
 * Script para criar as tabelas e views necessárias para o posto Alair_v2
 * Baseado na estrutura do posto Osasco_v2
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conexão com o banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function executeScript() {
  try {
    // Ler o script SQL
    const sqlScript = fs.readFileSync(path.join(__dirname, 'create-alair-v2-tables-supabase.sql'), 'utf8');
    
    console.log('Iniciando criação das tabelas e views para o posto Alair_v2...');
    
    // Executar o script SQL
    await pool.query(sqlScript);
    
    // Verificar se todas as tabelas e views foram criadas
    console.log('Verificando tabelas e views criadas:');
    
    // Array com todas as tabelas e views que devem existir
    const tablesAndViews = [
      'abastecimentos_posto_alair_v2',
      'configuracao_tanques_alair_v2',
      'abastecimentos_posto_alair_v2_ultimos',
      'abastecimentos_posto_alair_v2_consolidado',
      'abastecimentos_posto_alair_v2_estatisticas_mensais',
      'abastecimentos_posto_alair_v2_consumo_por_veiculo',
      'abastecimentos_posto_alair_v2_comparativo_combustiveis',
    ];
    
    // Verificar cada tabela/view
    for (const tableOrView of tablesAndViews) {
      const checkQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        ) as "exists";
      `;
      
      const result = await pool.query(checkQuery, [tableOrView]);
      console.log(`- ${tableOrView}: ${result.rows[0].exists ? 'OK' : 'FALHA'}`);
    }
    
    console.log('\nScript executado com sucesso!');
  } catch (error) {
    console.error('Erro ao executar script:', error);
  } finally {
    await pool.end();
  }
}

executeScript();