import { db, pool } from './db';
import { sql } from 'drizzle-orm';

async function seedBases() {
  console.log('Iniciando criação direta de bases no banco de dados...');
  
  const bases = [
    { nome: 'Osasco', basename: 'osasco', tipo: 'posto' },
    { nome: 'Guarulhos', basename: 'guarulhos', tipo: 'posto' },
    { nome: 'São Paulo', basename: 'saopaulo', tipo: 'posto' },
    { nome: 'Campinas', basename: 'campinas', tipo: 'posto' },
    { nome: 'ABC', basename: 'abc', tipo: 'posto' },
    { nome: 'Socorro', basename: 'socorro', tipo: 'posto' },
    { nome: 'Sorocaba', basename: 'sorocaba', tipo: 'posto' },
    { nome: 'Multas', basename: 'multas', tipo: 'operacional' },
    { nome: 'Pneus', basename: 'pneus', tipo: 'operacional' },
    { nome: 'Gestão de Frotas', basename: 'frotas', tipo: 'administrativo' },
    { nome: 'Line Hall', basename: 'linehall', tipo: 'operacional' }
  ];
  
  for (const base of bases) {
    try {
      // Verificar se a base já existe
      const checkQuery = `
        SELECT id FROM bases WHERE basename = $1
      `;
      const checkResult = await db.execute(sql.raw(checkQuery, [base.basename]));
      
      if (checkResult.rows.length === 0) {
        // Base não existe, criar
        console.log(`Criando base ${base.nome}...`);
        
        const insertQuery = `
          INSERT INTO bases (name, basename, type, active, location) 
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `;
        
        const result = await db.execute(sql.raw(
          insertQuery, 
          [base.nome, base.basename, base.tipo, true, `Localização de ${base.nome}`]
        ));
        
        const baseId = result.rows[0].id;
        console.log(`Base ${base.nome} criada com ID ${baseId}`);
      } else {
        console.log(`Base ${base.nome} já existe com ID ${checkResult.rows[0].id}`);
      }
    } catch (error) {
      console.error(`Erro ao processar base ${base.nome}:`, error);
    }
  }
  
  console.log('Processo de criação de bases concluído!');
}

// Função para criar usuários padrão para postos após a criação das bases
async function criarUsuariosPosto() {
  console.log('Iniciando criação de usuários para postos...');
  
  const SENHA_PADRAO = 'murici@2025';
  
  const postos = [
    { nome: 'osasco', displayName: 'Osasco' },
    { nome: 'guarulhos', displayName: 'Guarulhos' },
    { nome: 'saopaulo', displayName: 'São Paulo' },
    { nome: 'campinas', displayName: 'Campinas' },
    { nome: 'abc', displayName: 'ABC' },
    { nome: 'socorro', displayName: 'Socorro' },
    { nome: 'sorocaba', displayName: 'Sorocaba' },
  ];
  
  for (const posto of postos) {
    try {
      // Verificar se o usuário já existe
      const email = `${posto.nome}@muricionfleet.com`;
      
      const checkUserQuery = `
        SELECT id FROM users WHERE email = $1
      `;
      const userResult = await db.execute(sql.raw(checkUserQuery, [email]));
      
      if (userResult.rows.length === 0) {
        // Buscar ID da base
        const getBaseQuery = `
          SELECT id FROM bases WHERE basename = $1
        `;
        const baseResult = await db.execute(sql.raw(getBaseQuery, [posto.nome]));
        
        if (baseResult.rows.length === 0) {
          console.error(`Base com basename ${posto.nome} não encontrada. Não é possível criar usuário.`);
          continue;
        }
        
        const baseId = baseResult.rows[0].id;
        
        console.log(`Criando usuário para posto ${posto.displayName} associado à base ID ${baseId}...`);
        
        // Criando o usuário
        const insertUserQuery = `
          INSERT INTO users (name, email, password, role, base_id, basename) 
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `;
        
        const result = await db.execute(sql.raw(
          insertUserQuery, 
          [posto.displayName, email, SENHA_PADRAO, 'gestor', baseId, posto.nome]
        ));
        
        console.log(`Usuário para posto ${posto.displayName} criado com ID ${result.rows[0].id}`);
      } else {
        console.log(`Usuário para posto ${posto.displayName} já existe com ID ${userResult.rows[0].id}`);
      }
    } catch (error) {
      console.error(`Erro ao criar usuário para posto ${posto.displayName}:`, error);
    }
  }
  
  console.log('Criação de usuários para postos concluída!');
}

// Executar o seed
async function run() {
  try {
    await seedBases();
    await criarUsuariosPosto();
    console.log('Script executado com sucesso!');
  } catch (error) {
    console.error('Erro ao executar script:', error);
  } finally {
    await pool.end();
  }
}

run();