import { createClient } from '@supabase/supabase-js';
import { pool } from './db';

// Credenciais do Supabase (usando as mesmas do arquivo principal)
const supabaseUrl = process.env.SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';

// Inicializa cliente do Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarSchemas() {
  console.log('=== VERIFICAÇÃO DE SCHEMAS E TABELAS ===');

  try {
    console.log('\n1. Verificando schemas diretamente pelo pool do PostgreSQL:');
    const client = await pool.connect();
    
    try {
      // Consultar schemas
      const schemaResult = await client.query(`
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name NOT LIKE 'pg_%' 
          AND schema_name != 'information_schema'
      `);
      
      console.log('Schemas disponíveis:');
      schemaResult.rows.forEach(row => console.log(`- ${row.schema_name}`));
      
      // Consultar tabelas nos schemas principais
      console.log('\nTabelas por schema:');
      for (const schema of ['public', 'auth', 'storage']) {
        const tableResult = await client.query(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = $1
            AND table_type = 'BASE TABLE'
        `, [schema]);
        
        console.log(`\nSchema: ${schema}`);
        if (tableResult.rows.length === 0) {
          console.log('  Nenhuma tabela encontrada ou sem permissão para visualizar');
        } else {
          tableResult.rows.forEach(row => console.log(`  - ${row.table_name}`));
        }
      }
      
      // Testar autorização no Supabase
      console.log('\n2. Verificando acesso ao Supabase:');
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.error('Erro ao verificar sessão:', authError);
      } else {
        console.log('Status da sessão:', authData.session ? 'Ativa' : 'Inativa');
      }
      
      // Consultar usuários no banco "local" em vez do Supabase
      console.log('\n3. Consultando usuários no banco PostgreSQL local:');
      const userResult = await client.query('SELECT * FROM users LIMIT 5');
      
      if (userResult.rows.length > 0) {
        console.log(`Encontrados ${userResult.rows.length} usuários:`);
        console.log(JSON.stringify(userResult.rows, null, 2));
      } else {
        console.log('Nenhum usuário encontrado ou tabela não existe');
      }
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro não tratado:', error);
  }
}

// Executa a função
verificarSchemas().then(() => {
  console.log('\nVerificação finalizada.');
  process.exit(0);
});