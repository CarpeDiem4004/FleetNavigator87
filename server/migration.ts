import { pool } from './db';

export async function runMigrations() {
  try {
    console.log("Iniciando migrações...");

    // Verificar se a tabela 'workshops' existe no esquema público
    const checkWorkshopsTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'workshops'
      );
    `;
    
    const workshopsTableResult = await pool.query(checkWorkshopsTableQuery);
    const workshopsTableExists = workshopsTableResult.rows[0].exists;
    
    console.log("Tabela 'workshops' existe:", workshopsTableExists);
    
    // Verificar a estrutura da tabela workshops
    if (workshopsTableExists) {
      console.log("Verificando colunas da tabela 'workshops'...");
      const columnsQuery = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'workshops'
      `;
      const columnsResult = await pool.query(columnsQuery);
      console.log("Colunas existentes na tabela 'workshops':", columnsResult.rows);
    }
    
    // Verificar se a coluna 'oficina_id' já existe na tabela 'users'
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'oficina_id'
    `;
    
    const { rows } = await pool.query(checkColumnQuery);
    
    if (rows.length === 0) {
      console.log("Adicionando coluna 'oficina_id' à tabela 'users'");
      
      // Adicionar coluna 'oficina_id' à tabela 'users'
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN oficina_id INTEGER REFERENCES workshops(id)
      `);
      
      console.log("Coluna 'oficina_id' adicionada com sucesso");
    } else {
      console.log("Coluna 'oficina_id' já existe na tabela 'users'");
    }
    
    // Verificar se o tipo 'oficina' já existe no enum 'user_role'
    const checkEnumQuery = `
      SELECT enumlabel
      FROM pg_enum
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
      WHERE pg_type.typname = 'user_role' AND enumlabel = 'oficina'
    `;
    
    const enumResult = await pool.query(checkEnumQuery);
    
    if (enumResult.rows.length === 0) {
      console.log("Adicionando valor 'oficina' ao enum 'user_role'");
      
      // Adicionar valor 'oficina' ao enum 'user_role'
      await pool.query(`
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'oficina'
      `);
      
      console.log("Valor 'oficina' adicionado ao enum 'user_role' com sucesso");
    } else {
      console.log("Valor 'oficina' já existe no enum 'user_role'");
    }
    
    console.log("Migrações concluídas com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro ao executar migrações:", error);
    return false;
  }
}