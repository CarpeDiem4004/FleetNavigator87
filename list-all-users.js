/**
 * Script para listar todos os usuários cadastrados no sistema
 */
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();
const { Pool } = pg;

async function listAllUsers() {
  // Criar conexão com o banco de dados usando variáveis de ambiente
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Conectando ao banco de dados...');
    
    // Consulta SQL para listar todos os usuários
    const query = `
      SELECT 
        id, 
        name, 
        email, 
        role, 
        base_id, 
        oficina_id, 
        is_active, 
        created_at, 
        updated_at 
      FROM 
        users 
      ORDER BY 
        id ASC
    `;
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      console.log('Nenhum usuário encontrado no sistema.');
      return;
    }
    
    console.log(`Total de usuários encontrados: ${result.rows.length}`);
    console.log('\n=== LISTA DE USUÁRIOS ===\n');
    
    // Exibir informações de cada usuário
    result.rows.forEach((user, index) => {
      console.log(`[${index + 1}] ID: ${user.id}`);
      console.log(`    Nome: ${user.name}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Perfil: ${user.role}`);
      console.log(`    Base ID: ${user.base_id || 'N/A'}`);
      console.log(`    Oficina ID: ${user.oficina_id || 'N/A'}`);
      console.log(`    Ativo: ${user.is_active ? 'Sim' : 'Não'}`);
      console.log(`    Criado em: ${user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}`);
      console.log(`    Atualizado em: ${user.updated_at ? new Date(user.updated_at).toLocaleString() : 'N/A'}`);
      console.log('----------------------------');
    });
    
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
  } finally {
    // Encerrar conexão com o banco de dados
    await pool.end();
  }
}

// Executar a função principal
listAllUsers().catch(err => {
  console.error('Erro ao executar script:', err);
  process.exit(1);
});