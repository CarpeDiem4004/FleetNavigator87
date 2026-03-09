import { pool } from './db';

async function consultarUsuarios() {
  console.log('=== CONSULTA DE USUÁRIOS DO BANCO POSTGRESQL ===');

  try {
    // Obter um cliente do pool de conexões
    const client = await pool.connect();
    
    try {
      // Exemplo 1: Consultar todos os usuários
      console.log('\n1. Consultando todos os usuários:');
      const resultAll = await client.query('SELECT * FROM users');
      
      console.log(`Encontrados ${resultAll.rowCount} usuários.`);
      console.log('Primeiros 5 usuários:');
      console.log(JSON.stringify(resultAll.rows.slice(0, 5), null, 2));
      
      // Exemplo 2: Consultar usuários administradores
      console.log('\n2. Consultando usuários administradores:');
      const resultAdmins = await client.query('SELECT * FROM users WHERE role = $1', ['admin']);
      
      console.log(`Encontrados ${resultAdmins.rowCount} administradores.`);
      console.log(JSON.stringify(resultAdmins.rows, null, 2));
      
      // Exemplo 3: Consultar usuários por base
      console.log('\n3. Consultando usuários por base:');
      const resultByBase = await client.query(`
        SELECT users.*, bases.name as base_name
        FROM users
        JOIN bases ON users.base_id = bases.id
        WHERE users.base_id IS NOT NULL
        LIMIT 10
      `);
      
      console.log(`Encontrados ${resultByBase.rowCount} usuários com base associada.`);
      console.log(JSON.stringify(resultByBase.rows, null, 2));
      
      // Exemplo 4: Consulta com filtros diversos
      console.log('\n4. Consultando usuários com filtros avançados:');
      const resultFiltered = await client.query(`
        SELECT id, name, email, role, basename
        FROM users
        WHERE 
          is_active = true
          AND (role = $1 OR role = $2)
        ORDER BY name
        LIMIT 10
      `, ['gestor', 'operador']);
      
      console.log(`Encontrados ${resultFiltered.rowCount} gestores e operadores ativos.`);
      console.log(JSON.stringify(resultFiltered.rows, null, 2));
      
    } finally {
      // Sempre liberar o cliente de volta para o pool quando terminar
      client.release();
    }
  } catch (error) {
    console.error('Erro durante a consulta:', error);
  }
}

// Executa a função
consultarUsuarios().then(() => {
  console.log('\nConsulta finalizada.');
  process.exit(0);
});