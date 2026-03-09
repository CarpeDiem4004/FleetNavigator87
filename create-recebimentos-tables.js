/**
 * Script para criar tabelas de recebimentos de combustível para todos os postos
 */
import pg from 'pg';
const { Pool } = pg;

// Configuração da conexão
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createPostoRecebimentosTables() {
  const postos = [
    'osasco_v2',
    'alair_v2',
    'campinas_v2',
    'abc_v2',
    'socorro_v2',
    'sorocaba_v2'
  ];

  try {
    // Para cada posto, criar a tabela se não existir
    for (const posto of postos) {
      const tableName = `recebimentos_posto_${posto}`;
      
      // Verificar se a tabela já existe
      const checkQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `;
      
      const { rows } = await pool.query(checkQuery, [tableName]);
      const tableExists = rows[0].exists;
      
      if (!tableExists) {
        console.log(`Criando tabela ${tableName}...`);
        
        // Criar tabela
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS "${tableName}" (
            id SERIAL PRIMARY KEY,
            tipo_produto VARCHAR(50) NOT NULL,
            litros_recebidos NUMERIC(10, 2) NOT NULL,
            valor_total NUMERIC(10, 2) NOT NULL,
            nome_fornecedor VARCHAR(100) NOT NULL,
            nome_operador VARCHAR(100) NOT NULL,
            observacoes TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `;
        
        await pool.query(createTableQuery);
        console.log(`Tabela ${tableName} criada com sucesso!`);
      } else {
        console.log(`Tabela ${tableName} já existe.`);
      }
    }
    
    console.log('Todas as tabelas de recebimentos foram criadas ou já existiam.');
  } catch (error) {
    console.error('Erro ao criar tabelas de recebimentos:', error);
  } finally {
    // Encerrar a conexão com o banco
    pool.end();
  }
}

// Executar a função principal
createPostoRecebimentosTables();