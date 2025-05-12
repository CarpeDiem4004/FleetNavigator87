import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { createClient } from '@supabase/supabase-js';

// Configuração do WebSocket para Neon
neonConfig.webSocketConstructor = ws;

// Valores de conexão com o Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDg5ODIwNiwiZXhwIjoyMDYwMjc0MjA2fQ.bvwwqQBQVUOlyHYMsX9C5dSQhsQYI2r8qmqRBHgG_0Y';

// Inicialização Supabase
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Verificação da string de conexão para o PostgreSQL/Neon
if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL não está definido. Apenas o Supabase será usado para persistência de dados.");
}

// Inicialização do pool de conexão para o banco de dados PostgreSQL/Neon
export const pool = process.env.DATABASE_URL 
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

// Inicialização do Drizzle ORM
export const db = pool 
  ? drizzle(pool, { schema })
  : null;

// Função para verificar o estado da conexão com o Supabase
export async function checkSupabaseConnection() {
  try {
    // Tentar fazer uma operação simples para verificar a conexão
    const { data, error } = await supabaseClient
      .from('users')
      .select('count(*)', { count: 'exact', head: true });
    
    if (!error) {
      console.log('✅ Conexão com Supabase estabelecida com sucesso.');
      return true;
    }
    
    // Tentar outra tabela se a primeira falhar
    const { error: error2 } = await supabaseClient
      .from('bases')
      .select('count(*)', { count: 'exact', head: true });
    
    if (!error2) {
      console.log('✅ Conexão com Supabase estabelecida com sucesso (via tabela bases).');
      return true;
    }
    
    console.error('❌ Falha ao conectar com Supabase:', error);
    return false;
  } catch (err) {
    console.error('❌ Erro ao verificar conexão com Supabase:', err);
    return false;
  }
}

// Verificar conexão ao inicializar
checkSupabaseConnection().then(connected => {
  if (connected) {
    console.log('Sistema utilizando Supabase para persistência de dados.');
  } else {
    console.warn('⚠️ Falha ao conectar com Supabase. Verificando conexão com PostgreSQL/Neon...');
    if (pool) {
      pool.query('SELECT 1').then(() => {
        console.log('✅ Conexão com PostgreSQL/Neon estabelecida com sucesso.');
      }).catch(err => {
        console.error('❌ Falha ao conectar com PostgreSQL/Neon:', err);
      });
    }
  }
});