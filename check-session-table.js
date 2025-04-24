// Script para verificar a tabela de sessões no PostgreSQL
import pkg from 'pg';
const { Pool } = pkg;

// Configuração do PostgreSQL local (Replit)
const postgresConfig = {
  connectionString: process.env.DATABASE_URL,
};

async function main() {
  console.log('🔎 Verificando tabela de sessões no PostgreSQL...');
  
  const pool = new Pool(postgresConfig);
  
  try {
    // Verificar se existe uma tabela 'session' ou 'sessions'
    const sessionTablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('session', 'sessions')
      ORDER BY table_name;
    `);
    
    if (sessionTablesResult.rows.length === 0) {
      console.log('❌ Nenhuma tabela de sessão (session/sessions) encontrada no banco de dados.');
      return;
    }
    
    console.log(`✅ Tabelas de sessão encontradas: ${sessionTablesResult.rows.map(r => r.table_name).join(', ')}`);
    
    // Para cada tabela encontrada, verificar sua estrutura e conteúdo
    for (const row of sessionTablesResult.rows) {
      const tableName = row.table_name;
      console.log(`\n📋 Analisando tabela: ${tableName}`);
      
      // Verificar estrutura
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);
      
      console.log(`📊 Estrutura da tabela ${tableName}:`);
      console.log('------------------------');
      columnsResult.rows.forEach(column => {
        console.log(`${column.column_name} (${column.data_type}) ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      
      // Contar registros
      const countResult = await pool.query(`
        SELECT COUNT(*) FROM ${tableName};
      `);
      
      const count = parseInt(countResult.rows[0].count);
      console.log(`\n📈 Total de registros: ${count}`);
      
      if (count > 0) {
        // Mostrar alguns registros de exemplo
        const samplesResult = await pool.query(`
          SELECT * FROM ${tableName} LIMIT 2;
        `);
        
        console.log('\n📝 Exemplos de registros:');
        samplesResult.rows.forEach((record, index) => {
          console.log(`\nRegistro #${index + 1}:`);
          Object.entries(record).forEach(([key, value]) => {
            // Para valores JSON, mostrar de forma legível
            if (typeof value === 'object' && value !== null) {
              console.log(`  ${key}: ${JSON.stringify(value, null, 2)}`);
            } else {
              // Limitar o tamanho de valores muito grandes
              const displayValue = value && typeof value === 'string' && value.length > 100 
                ? value.substring(0, 100) + '...' 
                : value;
              console.log(`  ${key}: ${displayValue}`);
            }
          });
        });
      } else {
        console.log('🔍 Nenhum registro encontrado nesta tabela.');
      }
      
      // Verificar se a tabela está sendo usada pela configuração de sessão
      console.log('\n🔄 Verificando uso da tabela com express-session:');
      console.log('- A configuração que você forneceu usa a tabela "sessions"');
      if (tableName === 'sessions') {
        console.log('✅ O nome da tabela coincide com o configurado no express-session.');
      } else {
        console.log('⚠️ O nome da tabela não coincide com o configurado no express-session.');
        console.log('   Configure para usar a tabela existente ou crie a tabela "sessions".');
      }
    }
    
    // Recomendações para correção de problemas
    console.log('\n🔧 Recomendações:');
    
    if (sessionTablesResult.rows.some(r => r.table_name === 'sessions')) {
      console.log('✅ A tabela "sessions" já existe. Está tudo correto para uso com express-session.');
    } else if (sessionTablesResult.rows.some(r => r.table_name === 'session')) {
      console.log('1. Renomear a tabela "session" para "sessions" para corresponder à configuração:');
      console.log('   ALTER TABLE session RENAME TO sessions;');
      console.log('   ou');
      console.log('2. Modificar a configuração do express-session para usar a tabela "session" existente:');
      console.log('   store: new PgSession({');
      console.log('     pool,'); 
      console.log('     tableName: \'session\' // em vez de \'sessions\'');
      console.log('   }),');
    } else {
      console.log('1. Criar a tabela "sessions" requerida pelo connect-pg-simple:');
      console.log(`
CREATE TABLE sessions (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);
CREATE INDEX IDX_sessions_expire ON sessions(expire);
      `);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar a tabela de sessões:', error.message);
  } finally {
    await pool.end();
    console.log('\n👋 Verificação concluída!');
  }
}

main().catch(console.error);