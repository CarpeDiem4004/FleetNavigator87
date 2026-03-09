/**
 * Script para criar a tabela de recebimentos do posto Osasco V2 no Supabase
 * Este posto utiliza uma nomenclatura diferente para os campos
 */

import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Verificar se a variável de ambiente DATABASE_URL está definida
  if (!process.env.DATABASE_URL) {
    console.error('Erro: Variável de ambiente DATABASE_URL não definida');
    console.error('Por favor, configure a conexão com o banco de dados Supabase');
    return;
  }

  // Criar conexão com o banco de dados
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Conectando ao banco de dados...');
    
    // Ler o arquivo SQL
    const sqlFilePath = path.join(__dirname, 'create-osasco-v2-recebimentos-table.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Executar o script SQL
    console.log('Executando script SQL para criar tabela de recebimentos do Osasco V2...');
    await pool.query(sqlScript);
    
    console.log('✅ Tabela recebimentos_posto_osasco_v2 criada ou já existente!');
    
    // Verificar se a tabela foi criada
    const tableCheckResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'recebimentos_posto_osasco_v2'
      );
    `);
    
    if (tableCheckResult.rows[0].exists) {
      // Contar registros na tabela
      const countResult = await pool.query('SELECT COUNT(*) FROM recebimentos_posto_osasco_v2');
      console.log(`A tabela contém ${countResult.rows[0].count} registros.`);
      
      // Exibir estrutura da tabela
      const columnsResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'recebimentos_posto_osasco_v2'
        ORDER BY ordinal_position;
      `);
      
      console.log('Estrutura da tabela:');
      columnsResult.rows.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.error('❌ Erro: A tabela não foi criada corretamente.');
    }
  } catch (error) {
    console.error('Erro ao criar tabela:', error);
  } finally {
    // Fechar conexão com o banco de dados
    await pool.end();
  }
}

// Execute o script
main().catch((error) => {
  console.error('Erro na execução:', error);
  process.exit(1);
});