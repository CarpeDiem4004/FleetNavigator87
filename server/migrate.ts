import { db } from './db';
import { bases } from '@shared/schema';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Verificando a estrutura do banco de dados...');
  
  try {
    // Verificar se a coluna operation existe
    const hasOperationColumn = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bases' AND column_name = 'operation'
      );
    `);
    
    const operationExists = hasOperationColumn.rows[0].exists;
    
    if (!operationExists) {
      console.log('Adicionando coluna operation à tabela bases...');
      await db.execute(sql`
        ALTER TABLE bases 
        ADD COLUMN operation text;
      `);
      console.log('Coluna operation adicionada com sucesso.');
    } else {
      console.log('Coluna operation já existe.');
    }
    
    // Verificar se a coluna has_maintenance existe
    const hasMaintenanceColumn = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bases' AND column_name = 'has_maintenance'
      );
    `);
    
    const maintenanceExists = hasMaintenanceColumn.rows[0].exists;
    
    if (!maintenanceExists) {
      console.log('Adicionando coluna has_maintenance à tabela bases...');
      await db.execute(sql`
        ALTER TABLE bases 
        ADD COLUMN has_maintenance boolean DEFAULT false;
      `);
      console.log('Coluna has_maintenance adicionada com sucesso.');
    } else {
      console.log('Coluna has_maintenance já existe.');
    }
    
    // Verificar se a coluna has_tires existe
    const hasTiresColumn = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bases' AND column_name = 'has_tires'
      );
    `);
    
    const tiresExists = hasTiresColumn.rows[0].exists;
    
    if (!tiresExists) {
      console.log('Adicionando coluna has_tires à tabela bases...');
      await db.execute(sql`
        ALTER TABLE bases 
        ADD COLUMN has_tires boolean DEFAULT false;
      `);
      console.log('Coluna has_tires adicionada com sucesso.');
    } else {
      console.log('Coluna has_tires já existe.');
    }
    
    // Verificar se a coluna created_at existe
    const hasCreatedAtColumn = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bases' AND column_name = 'created_at'
      );
    `);
    
    const createdAtExists = hasCreatedAtColumn.rows[0].exists;
    
    if (!createdAtExists) {
      console.log('Adicionando coluna created_at à tabela bases...');
      await db.execute(sql`
        ALTER TABLE bases 
        ADD COLUMN created_at timestamp DEFAULT CURRENT_TIMESTAMP;
      `);
      console.log('Coluna created_at adicionada com sucesso.');
    } else {
      console.log('Coluna created_at já existe.');
    }
    
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    process.exit(0);
  }
}

migrate();