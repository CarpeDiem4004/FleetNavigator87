import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Adiciona log para diagnóstico de conexão
console.log("[db.ts] Inicializando conexão com o banco de dados");

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Adiciona configuração adicional para melhorar a estabilidade
  max: 20, // número máximo de clientes
  idleTimeoutMillis: 30000, // tempo máximo que um cliente pode ficar ocioso
  connectionTimeoutMillis: 10000 // tempo máximo para estabelecer uma conexão
});

// Teste de conexão inicial
pool.query('SELECT NOW()')
  .then(result => {
    console.log('[db.ts] Conexão com o banco de dados estabelecida com sucesso:', result.rows[0]);
  })
  .catch(err => {
    console.error('[db.ts] Erro ao conectar com o banco de dados:', err);
  });

export const db = drizzle(pool);