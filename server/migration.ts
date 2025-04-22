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
    const checkEnumOficinaQuery = `
      SELECT enumlabel
      FROM pg_enum
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
      WHERE pg_type.typname = 'user_role' AND enumlabel = 'oficina'
    `;
    
    const enumOficinaResult = await pool.query(checkEnumOficinaQuery);
    
    if (enumOficinaResult.rows.length === 0) {
      console.log("Adicionando valor 'oficina' ao enum 'user_role'");
      
      // Adicionar valor 'oficina' ao enum 'user_role'
      await pool.query(`
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'oficina'
      `);
      
      console.log("Valor 'oficina' adicionado ao enum 'user_role' com sucesso");
    } else {
      console.log("Valor 'oficina' já existe no enum 'user_role'");
    }
    
    // Verificar se o tipo 'pneus' já existe no enum 'user_role'
    const checkEnumPneusQuery = `
      SELECT enumlabel
      FROM pg_enum
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
      WHERE pg_type.typname = 'user_role' AND enumlabel = 'pneus'
    `;
    
    const enumPneusResult = await pool.query(checkEnumPneusQuery);
    
    if (enumPneusResult.rows.length === 0) {
      console.log("Adicionando valor 'pneus' ao enum 'user_role'");
      
      // Adicionar valor 'pneus' ao enum 'user_role'
      await pool.query(`
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'pneus'
      `);
      
      console.log("Valor 'pneus' adicionado ao enum 'user_role' com sucesso");
    } else {
      console.log("Valor 'pneus' já existe no enum 'user_role'");
    }
    
    // Verificar se a tabela maintenance_lifecycle existe e, se não, criá-la
    const checkMaintenanceLifecycleTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'maintenance_lifecycle'
      );
    `;
    
    const maintenanceLifecycleTableResult = await pool.query(checkMaintenanceLifecycleTableQuery);
    const maintenanceLifecycleTableExists = maintenanceLifecycleTableResult.rows[0].exists;
    
    console.log("Tabela 'maintenance_lifecycle' existe:", maintenanceLifecycleTableExists);
    
    if (!maintenanceLifecycleTableExists) {
      console.log("Criando tabela 'maintenance_lifecycle'...");
      
      try {
        await pool.query(`
          CREATE TABLE maintenance_lifecycle (
            id SERIAL PRIMARY KEY,
            maintenance_id INTEGER NOT NULL UNIQUE,
            entry_date DATE NOT NULL,
            maintenance_start_date DATE,
            expected_exit_date DATE,
            actual_exit_date DATE,
            vehicle_pickup_date TIMESTAMP,
            pickup_person_name TEXT,
            pickup_person_cpf TEXT,
            pickup_comments TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `);
        
        console.log("Tabela 'maintenance_lifecycle' criada com sucesso");
      } catch (error) {
        console.error("Erro ao criar tabela 'maintenance_lifecycle':", error);
      }
    }
    
        // Verificar se o campo 'vehicle_plate' existe na tabela 'maintenance_chat'
    const checkVehiclePlateColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'maintenance_chat' AND column_name = 'vehicle_plate'
    `;
    
    const vehiclePlateResult = await pool.query(checkVehiclePlateColumnQuery);
    
    if (vehiclePlateResult.rows.length === 0) {
      console.log("Adicionando coluna 'vehicle_plate' à tabela 'maintenance_chat'");
      
      // Adicionar coluna 'vehicle_plate' à tabela 'maintenance_chat'
      await pool.query(`
        ALTER TABLE maintenance_chat 
        ADD COLUMN vehicle_plate TEXT
      `);
      
      console.log("Coluna 'vehicle_plate' adicionada com sucesso à tabela 'maintenance_chat'");
    } else {
      console.log("Coluna 'vehicle_plate' já existe na tabela 'maintenance_chat'");
    }

    console.log("Migrações concluídas com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro ao executar migrações:", error);
    return false;
  }
}