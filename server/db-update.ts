import { db, pool } from './db';
import { sql } from 'drizzle-orm';

/**
 * Este script atualiza manualmente o esquema do banco de dados para adicionar os novos campos
 * à tabela de bases, necessários para a implementação do acesso dos postos.
 */
async function updateDatabaseSchema() {
  console.log('Iniciando atualização manual do esquema do banco de dados...');
  
  try {
    // Verificar se a coluna 'basename' já existe
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bases' AND column_name = 'basename'
    `;
    
    const result = await db.execute(sql.raw(checkColumnQuery));
    const basenameExists = result.rows.length > 0;
    
    if (!basenameExists) {
      console.log('Adicionando coluna basename à tabela bases...');
      await db.execute(sql.raw(`ALTER TABLE bases ADD COLUMN basename TEXT UNIQUE`));
      console.log('Coluna basename adicionada com sucesso!');
    } else {
      console.log('Coluna basename já existe na tabela bases.');
    }
    
    // Verificar se a coluna 'type' já existe
    const checkTypeColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bases' AND column_name = 'type'
    `;
    
    const typeResult = await db.execute(sql.raw(checkTypeColumnQuery));
    const typeExists = typeResult.rows.length > 0;
    
    if (!typeExists) {
      console.log('Adicionando coluna type à tabela bases...');
      await db.execute(sql.raw(`ALTER TABLE bases ADD COLUMN type TEXT`));
      console.log('Coluna type adicionada com sucesso!');
    } else {
      console.log('Coluna type já existe na tabela bases.');
    }
    
    // Verificar se a coluna 'active' já existe
    const checkActiveColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bases' AND column_name = 'active'
    `;
    
    const activeResult = await db.execute(sql.raw(checkActiveColumnQuery));
    const activeExists = activeResult.rows.length > 0;
    
    if (!activeExists) {
      console.log('Adicionando coluna active à tabela bases...');
      await db.execute(sql.raw(`ALTER TABLE bases ADD COLUMN active BOOLEAN DEFAULT TRUE`));
      console.log('Coluna active adicionada com sucesso!');
    } else {
      console.log('Coluna active já existe na tabela bases.');
    }
    
    // Atualizar bases existentes para preencher os novos campos
    const checkBasesQuery = `SELECT COUNT(*) FROM bases`;
    const basesResult = await db.execute(sql.raw(checkBasesQuery));
    const basesCount = parseInt(basesResult.rows[0].count);
    
    if (basesCount > 0) {
      console.log(`Atualizando ${basesCount} bases existentes com valores padrão para novos campos...`);
      
      // Para bases existentes, usar o name em minúsculo como basename temporário
      await db.execute(sql.raw(`
        UPDATE bases 
        SET 
          basename = LOWER(name),
          type = 'administrativo',
          active = TRUE 
        WHERE 
          basename IS NULL OR type IS NULL
      `));
      
      console.log('Bases existentes atualizadas com sucesso!');
    }
    
    console.log('Atualização do esquema concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar o esquema do banco de dados:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar a função de atualização
updateDatabaseSchema()
  .then(() => {
    console.log('Script de atualização do banco de dados executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Falha ao executar o script de atualização do banco de dados:', error);
    process.exit(1);
  });