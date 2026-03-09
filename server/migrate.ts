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
    
    // Verificar se a tabela workshops existe
    const hasWorkshopsTable = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'workshops'
      );
    `);
    
    const workshopsTableExists = hasWorkshopsTable.rows[0].exists;
    
    if (!workshopsTableExists) {
      console.log('Criando tabela workshops...');
      await db.execute(sql`
        CREATE TABLE workshops (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          address TEXT,
          phone TEXT,
          contact_person TEXT,
          is_specialized BOOLEAN DEFAULT FALSE,
          specialties TEXT,
          observations TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Tabela workshops criada com sucesso.');
      
      // Inserir algumas oficinas iniciais
      await db.execute(sql`
        INSERT INTO workshops (name, address, phone, is_active)
        VALUES 
          ('Oficina Central', 'Av. das Oficinas, 1000, São Paulo', '(11) 3333-4444', TRUE),
          ('Auto Mecânica Expressa', 'Rua dos Mecânicos, 250, Guarulhos', '(11) 2222-8888', TRUE),
          ('Diesel Service', 'Rodovia Anhanguera, km 15, Osasco', '(11) 4444-7777', TRUE);
      `);
      console.log('Oficinas iniciais inseridas com sucesso.');
    } else {
      console.log('Tabela workshops já existe.');
    }
    
    // Verificar se a coluna workshop_id existe na tabela maintenance
    const maintenanceTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'maintenance'
      );
    `);
    
    if (!maintenanceTableExists.rows[0].exists) {
      // Se a tabela maintenance não existe, criá-la com a nova estrutura
      console.log('Verificando tipos de enumeração existentes...');
      // Verificar se os tipos já existem
      const maintenanceTypeExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'maintenance_type'
        );
      `);
      
      const maintenanceStatusExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'maintenance_status'
        );
      `);
      
      if (!maintenanceTypeExists.rows[0].exists) {
        console.log('Criando tipo maintenance_type...');
        await db.execute(sql`
          CREATE TYPE maintenance_type AS ENUM ('preventiva', 'corretiva');
        `);
      } else {
        console.log('Tipo maintenance_type já existe.');
      }
      
      if (!maintenanceStatusExists.rows[0].exists) {
        console.log('Criando tipo maintenance_status...');
        await db.execute(sql`
          CREATE TYPE maintenance_status AS ENUM ('concluida', 'em_andamento', 'aguardando_pecas', 'pendente', 'aguardando_orcamento', 'cancelada');
        `);
      } else {
        console.log('Tipo maintenance_status já existe.');
        // Em vez de tentar remover o tipo, verificar se os valores que precisamos estão presentes
        console.log('Verificando valores do tipo maintenance_status...');
        const enumValues = await db.execute(sql`
          SELECT e.enumlabel
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'maintenance_status'
        `);
        
        const existingValues = enumValues.rows.map(row => row.enumlabel);
        console.log('Valores existentes:', existingValues);
        
        // Adicionar valores ausentes usando uma única transação
        console.log('Adicionando valores necessários ao enum maintenance_status...');
        
        // Criar string de comando com todos os valores necessários
        const neededValues = ['pendente', 'aguardando_orcamento', 'cancelada'];
        const missingValues = neededValues.filter(value => !existingValues.includes(value));
        
        if (missingValues.length > 0) {
          console.log(`Valores a adicionar: ${missingValues.join(', ')}`);
          
          try {
            // Criar uma sequência de comandos SQL para executar em uma transação
            // Usar uma abordagem diferente, adicionando cada valor um a um
            const commands = missingValues.map(value => {
              return `
                DO $$ 
                BEGIN
                  BEGIN
                    ALTER TYPE maintenance_status ADD VALUE '${value}';
                  EXCEPTION
                    WHEN duplicate_object THEN NULL;
                  END;
                END $$;
              `;
            }).join('\n');
            
            console.log('Executando comando para adicionar valores ao enum:');
            console.log(commands);
            
            await db.execute(sql.raw(commands));
            console.log('Valores adicionados com sucesso.');
          } catch (error) {
            console.log(`Erro ao adicionar valores ao enum: ${error}`);
          }
        } else {
          console.log('Não há novos valores para adicionar ao enum.');
        }
      }
      
      console.log('Criando tabela maintenance com a nova estrutura...');
      
      // Verificar os valores disponíveis no enum para definir o valor padrão correto
      const enumValues = await db.execute(sql`
        SELECT e.enumlabel
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'maintenance_status'
      `);
      
      const existingValues = enumValues.rows.map(row => row.enumlabel);
      console.log('Valores disponíveis para status:', existingValues);
      
      // Usar um valor que existe no enum
      let defaultStatus = 'em_andamento'; // Valor padrão seguro que sabemos que existe
      if (existingValues.includes('pendente')) {
        defaultStatus = 'pendente';
      } else if (existingValues.includes('em_andamento')) {
        defaultStatus = 'em_andamento';
      } else if (existingValues.length > 0) {
        defaultStatus = existingValues[0];
      }
      
      console.log(`Usando ${defaultStatus} como valor padrão para status`);
      
      // Criar um SQL com string literal para evitar problemas de binding
      const createTableSQL = `
        CREATE TABLE maintenance (
          id SERIAL PRIMARY KEY,
          vehicle_plate TEXT NOT NULL REFERENCES vehicles(plate),
          workshop_id INTEGER NOT NULL REFERENCES workshops(id),
          request_base_id INTEGER NOT NULL REFERENCES bases(id),
          entry_date DATE NOT NULL,
          expected_exit_date DATE,
          actual_exit_date DATE,
          status maintenance_status NOT NULL DEFAULT '${defaultStatus}',
          maintenance_type maintenance_type NOT NULL,
          cost DECIMAL(10, 2),
          description TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      console.log('Executando SQL:', createTableSQL);
      await db.execute(sql.raw(createTableSQL));
      console.log('Tabela maintenance criada com a nova estrutura.');
    } else {
      // Se a tabela já existe, verificar se a coluna workshop_id existe
      const hasWorkshopIdColumn = await db.execute(sql`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'maintenance' AND column_name = 'workshop_id'
        );
      `);
      
      if (!hasWorkshopIdColumn.rows[0].exists) {
        // Verificar se a tabela de backup já existe
        const backupExists = await db.execute(sql`
          SELECT EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_name = 'maintenance_backup'
          );
        `);
        
        if (!backupExists.rows[0].exists) {
          console.log('Criando backup da tabela maintenance antiga...');
          await db.execute(sql`
            CREATE TABLE maintenance_backup AS SELECT * FROM maintenance;
          `);
        } else {
          console.log('Backup da tabela maintenance já existe, usando backup existente...');
        }
        
        console.log('Verificando tipos de enumeração existentes...');
        // Verificar se os tipos já existem
        const maintenanceTypeExists = await db.execute(sql`
          SELECT EXISTS (
            SELECT 1 FROM pg_type WHERE typname = 'maintenance_type'
          );
        `);
        
        const maintenanceStatusExists = await db.execute(sql`
          SELECT EXISTS (
            SELECT 1 FROM pg_type WHERE typname = 'maintenance_status'
          );
        `);
        
        console.log('Removendo a tabela maintenance antiga...');
        await db.execute(sql`
          DROP TABLE maintenance;
        `);
        
        if (!maintenanceTypeExists.rows[0].exists) {
          console.log('Criando tipo maintenance_type...');
          await db.execute(sql`
            CREATE TYPE maintenance_type AS ENUM ('preventiva', 'corretiva');
          `);
        } else {
          console.log('Tipo maintenance_type já existe.');
        }
        
        if (!maintenanceStatusExists.rows[0].exists) {
          console.log('Criando tipo maintenance_status...');
          await db.execute(sql`
            CREATE TYPE maintenance_status AS ENUM ('concluida', 'em_andamento', 'aguardando_pecas', 'pendente', 'aguardando_orcamento', 'cancelada');
          `);
        } else {
          console.log('Tipo maintenance_status já existe.');
          // Em vez de tentar remover o tipo, verificar se os valores que precisamos estão presentes
          console.log('Verificando valores do tipo maintenance_status...');
          const enumValues = await db.execute(sql`
            SELECT e.enumlabel
            FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            WHERE t.typname = 'maintenance_status'
          `);
          
          const existingValues = enumValues.rows.map(row => row.enumlabel);
          console.log('Valores existentes:', existingValues);
          
          // Adicionar valores ausentes usando uma única transação
          console.log('Adicionando valores necessários ao enum maintenance_status...');
          
          // Criar string de comando com todos os valores necessários
          const neededValues = ['pendente', 'aguardando_orcamento', 'cancelada'];
          const missingValues = neededValues.filter(value => !existingValues.includes(value));
          
          if (missingValues.length > 0) {
            console.log(`Valores a adicionar: ${missingValues.join(', ')}`);
            
            try {
              // Criar uma sequência de comandos SQL para executar em uma transação
              // Usar uma abordagem diferente, adicionando cada valor um a um
              const commands = missingValues.map(value => {
                return `
                  DO $$ 
                  BEGIN
                    BEGIN
                      ALTER TYPE maintenance_status ADD VALUE '${value}';
                    EXCEPTION
                      WHEN duplicate_object THEN NULL;
                    END;
                  END $$;
                `;
              }).join('\n');
              
              console.log('Executando comando para adicionar valores ao enum:');
              console.log(commands);
              
              await db.execute(sql.raw(commands));
              console.log('Valores adicionados com sucesso.');
            } catch (error) {
              console.log(`Erro ao adicionar valores ao enum: ${error}`);
            }
          } else {
            console.log('Não há novos valores para adicionar ao enum.');
          }
        }
        
        console.log('Criando tabela maintenance com a nova estrutura...');
        
        // Verificar os valores disponíveis no enum para definir o valor padrão correto
        const enumValues = await db.execute(sql`
          SELECT e.enumlabel
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'maintenance_status'
        `);
        
        const existingValues = enumValues.rows.map(row => row.enumlabel);
        console.log('Valores disponíveis para status:', existingValues);
        
        // Usar um valor que existe no enum
        let defaultStatus = 'em_andamento'; // Valor padrão seguro que sabemos que existe
        if (existingValues.includes('pendente')) {
          defaultStatus = 'pendente';
        } else if (existingValues.includes('em_andamento')) {
          defaultStatus = 'em_andamento';
        } else if (existingValues.length > 0) {
          defaultStatus = existingValues[0];
        }
        
        console.log(`Usando ${defaultStatus} como valor padrão para status`);
        
        // Criar um SQL com string literal para evitar problemas de binding
        const createTableSQL = `
          CREATE TABLE maintenance (
            id SERIAL PRIMARY KEY,
            vehicle_plate TEXT NOT NULL REFERENCES vehicles(plate),
            workshop_id INTEGER NOT NULL REFERENCES workshops(id),
            request_base_id INTEGER NOT NULL REFERENCES bases(id),
            entry_date DATE NOT NULL,
            expected_exit_date DATE,
            actual_exit_date DATE,
            status maintenance_status NOT NULL DEFAULT '${defaultStatus}',
            maintenance_type maintenance_type NOT NULL,
            cost DECIMAL(10, 2),
            description TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
        
        console.log('Executando SQL:', createTableSQL);
        await db.execute(sql.raw(createTableSQL));
        console.log('Tabela maintenance recriada com a nova estrutura.');
      } else {
        console.log('Tabela maintenance já está atualizada com a nova estrutura.');
      }
    }
    
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    process.exit(0);
  }
}

migrate();