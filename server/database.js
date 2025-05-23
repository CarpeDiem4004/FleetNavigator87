/**
 * Configuração do banco de dados PostgreSQL
 * Este arquivo é usado para conectar ao banco de dados Postgres
 */
import pkg from 'pg';
const { Pool } = pkg;

// Criar pool de conexões
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Testar conexão
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('Conexão com banco de dados PostgreSQL estabelecida com sucesso!');
  }
});