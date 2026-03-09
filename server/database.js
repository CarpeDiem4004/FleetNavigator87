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

// Garantir que cada nova conexão use o timezone America/Sao_Paulo
// Isso afeta NOW(), CURRENT_DATE, CURRENT_TIMESTAMP no PostgreSQL
pool.on('connect', (client) => {
  client.query("SET timezone = 'America/Sao_Paulo'").catch((err) => {
    console.error('[DB] Erro ao configurar timezone da sessão:', err.message);
  });
});

// Testar conexão
pool.query('SELECT NOW() AT TIME ZONE \'America/Sao_Paulo\' AS hora_brasil', (err, res) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('Conexão com banco de dados PostgreSQL estabelecida com sucesso!');
    console.log('[DB] Hora Brasil no banco:', res.rows[0]?.hora_brasil);
  }
});