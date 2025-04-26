/**
 * Script para verificar a tabela de usuários no banco de dados PostgreSQL
 */
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function main() {
  try {
    console.log('Iniciando verificação da tabela de usuários...');

    // Verificar se temos a variável DATABASE_URL
    if (!process.env.DATABASE_URL) {
      console.error('Erro: DATABASE_URL não encontrada nas variáveis de ambiente');
      return;
    }

    console.log('Conectando ao banco de dados...');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    // Verificar se a tabela users existe
    console.log('\nVerificando se a tabela users existe...');
    const tableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      ) as exists;
    `;
    
    const tableResult = await pool.query(tableQuery);
    const tableExists = tableResult.rows[0].exists;
    
    console.log(`Tabela users existe: ${tableExists}`);

    if (tableExists) {
      // Verificar estrutura da tabela
      console.log('\nObtendo estrutura da tabela users:');
      const structureQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users'
        ORDER BY ordinal_position;
      `;
      
      const structureResult = await pool.query(structureQuery);
      console.log('Estrutura da tabela users:');
      structureResult.rows.forEach(column => {
        console.log(`- ${column.column_name}: ${column.data_type} (Nullable: ${column.is_nullable}, Default: ${column.column_default || 'none'})`);
      });

      // Verificar constraints da tabela
      console.log('\nVerificando constraints da tabela users:');
      const constraintsQuery = `
        SELECT 
          c.conname as constraint_name,
          c.contype as constraint_type,
          pg_get_constraintdef(c.oid) as constraint_definition
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        JOIN pg_class cl ON cl.oid = c.conrelid
        WHERE n.nspname = 'public' AND cl.relname = 'users';
      `;
      
      const constraintsResult = await pool.query(constraintsQuery);
      console.log('Constraints da tabela users:');
      if (constraintsResult.rows.length === 0) {
        console.log('Nenhuma constraint encontrada');
      } else {
        constraintsResult.rows.forEach(constraint => {
          console.log(`- ${constraint.constraint_name} (${constraint.constraint_type}): ${constraint.constraint_definition}`);
        });
      }

      // Verificar se a tabela tem dados
      console.log('\nVerificando dados na tabela users:');
      const countQuery = `SELECT COUNT(*) FROM users;`;
      const countResult = await pool.query(countQuery);
      console.log(`Total de registros: ${countResult.rows[0].count}`);

      // Obter uma amostra dos dados (sem senhas)
      if (parseInt(countResult.rows[0].count) > 0) {
        console.log('\nAmostra de dados (5 primeiros registros, sem senhas):');
        const sampleQuery = `
          SELECT id, name, email, role, base_id, is_active
          FROM users
          ORDER BY id
          LIMIT 5;
        `;
        
        const sampleResult = await pool.query(sampleQuery);
        sampleResult.rows.forEach(user => {
          console.log(`- ID ${user.id}: ${user.name} (${user.email}) - Role: ${user.role}`);
        });
      }

      // Verificar se podemos fazer inserção de teste
      console.log('\nTestando inserção de usuário:');
      try {
        const testUserEmail = `test_${Date.now()}@example.com`;
        const insertQuery = `
          INSERT INTO users (name, email, password, role, is_active)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id;
        `;
        
        const insertResult = await pool.query(insertQuery, [
          'Test User', 
          testUserEmail, 
          'test_password_hash_123456789', 
          'colaborador',
          true
        ]);
        
        console.log(`Usuário de teste inserido com sucesso! ID: ${insertResult.rows[0].id}`);
        
        // Remover usuário de teste
        await pool.query('DELETE FROM users WHERE email = $1', [testUserEmail]);
        console.log('Usuário de teste removido com sucesso!');
      } catch (insertError) {
        console.error('Erro ao inserir usuário de teste:', insertError.message);
        console.error('Detalhes do erro:', insertError);
      }
    } else {
      // Se a tabela não existir, criar uma estrutura básica
      console.log('\nA tabela users não existe. Deseja criar? (Não implementado neste script)');
    }

    // Encerrar conexão
    await pool.end();
    console.log('\nVerificação concluída!');
  } catch (error) {
    console.error('Erro ao verificar tabela de usuários:', error);
  }
}

main();