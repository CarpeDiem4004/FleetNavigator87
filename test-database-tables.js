// Script para verificar a comunicação entre tabelas do PostgreSQL local
import pkg from 'pg';
const { Pool } = pkg;

// Função para estabelecer conexão com o banco de dados
async function connectToDatabase() {
  try {
    // Configuração do PostgreSQL local (Replit)
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Testar a conexão
    await pool.query('SELECT NOW()');
    console.log('✅ Conexão com o banco de dados PostgreSQL estabelecida com sucesso.');
    
    return pool;
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados PostgreSQL:', error.message);
    throw error;
  }
}

// Função para listar todas as tabelas do banco de dados
async function listAllTables(pool) {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log(`\n📊 Total de tabelas encontradas: ${result.rowCount}`);
    console.log('📋 Lista de tabelas:');
    
    const tableNames = result.rows.map(row => row.table_name);
    tableNames.forEach((name, index) => {
      console.log(`${index + 1}. ${name}`);
    });
    
    return tableNames;
  } catch (error) {
    console.error('❌ Erro ao listar tabelas:', error.message);
    return [];
  }
}

// Função para mostrar a estrutura de uma tabela específica
async function showTableStructure(pool, tableName) {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
      ORDER BY ordinal_position;
    `, [tableName]);
    
    console.log(`\n📑 Estrutura da tabela ${tableName}:`);
    console.log('------------------------');
    result.rows.forEach(column => {
      console.log(`${column.column_name} (${column.data_type}) ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Consultar número de registros na tabela
    const countResult = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
    console.log(`\n📝 Total de registros: ${countResult.rows[0].count}`);
    
    return result.rows;
  } catch (error) {
    console.error(`❌ Erro ao mostrar estrutura da tabela ${tableName}:`, error.message);
    return [];
  }
}

// Função para testar consultas em tabelas específicas
async function testTableQueries(pool, tableName) {
  try {
    // Verificar se a tabela existe
    const tableExistsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [tableName]);
    
    if (!tableExistsResult.rows[0].exists) {
      console.log(`⚠️ A tabela ${tableName} não existe.`);
      return false;
    }
    
    // Tentar selecionar os primeiros registros
    const result = await pool.query(`
      SELECT * FROM ${tableName} LIMIT 3;
    `);
    
    console.log(`\n🔍 Primeiros registros da tabela ${tableName}:`);
    
    if (result.rows.length === 0) {
      console.log('Nenhum registro encontrado.');
      return true;
    }
    
    // Mostrar dados de forma mais organizada
    result.rows.forEach((row, index) => {
      console.log(`\nRegistro #${index + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        // Limitar o tamanho de exibição de valores muito grandes
        const displayValue = value && typeof value === 'string' && value.length > 100 
          ? value.substring(0, 100) + '...' 
          : value;
        console.log(`  ${key}: ${displayValue}`);
      });
    });
    
    return true;
  } catch (error) {
    console.error(`❌ Erro ao testar consultas na tabela ${tableName}:`, error.message);
    return false;
  }
}

// Função principal
async function main() {
  let pool = null;
  console.log('🔄 Verificando tabelas do banco de dados PostgreSQL...');
  
  try {
    // Conectar ao banco de dados
    pool = await connectToDatabase();
    
    // Listar todas as tabelas
    const tables = await listAllTables(pool);
    
    if (tables.length === 0) {
      console.log('⚠️ Nenhuma tabela encontrada no banco de dados.');
      return;
    }
    
    // Verificar tabelas importantes específicas
    const criticalTables = [
      'users', 
      'bases', 
      'veiculos', 
      'pneus', 
      'oficinas', 
      'abastecimentos',
      'abastecimentos_postos',
      'sessions',
      'posto_remedios_abastecimentos'
    ];
    
    console.log('\n🔎 Verificando tabelas críticas...');
    
    for (const tableName of criticalTables) {
      if (tables.includes(tableName)) {
        console.log(`\n✅ Tabela ${tableName} encontrada.`);
        await showTableStructure(pool, tableName);
        await testTableQueries(pool, tableName);
      } else {
        console.log(`\n❌ Tabela ${tableName} NÃO encontrada no banco de dados.`);
      }
    }
    
    console.log('\n✅ Verificação de tabelas concluída!');
  } catch (error) {
    console.error('\n❌ Erro durante a verificação de tabelas:', error);
  } finally {
    // Fechar conexão com o banco de dados
    if (pool) {
      await pool.end();
      console.log('\n👋 Conexão com o banco de dados fechada.');
    }
  }
}

// Executar o script
main().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});