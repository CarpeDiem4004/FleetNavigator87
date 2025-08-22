import { pool } from './db';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Atualiza a tabela de pneus para incluir todos os campos necessários
 * Verifica primeiro se pneus é uma tabela real ou uma view
 */
export async function atualizarTabelaPneus() {
  try {
    // Verificar se a tabela já existe
    const checkTableQuery = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pneus')";
    const tableExistsResult = await pool.query(checkTableQuery);
    
    if (!tableExistsResult.rows[0].exists) {
      console.log("Tabela pneus não existe. Ela deve ser criada pelas migrações automáticas.");
      return;
    }

    // Verificar se pneus é uma tabela real ou uma view
    const checkTableTypeQuery = "SELECT table_type FROM information_schema.tables WHERE table_name = 'pneus'";
    const tableTypeResult = await pool.query(checkTableTypeQuery);
    
    if (tableTypeResult.rows.length > 0 && tableTypeResult.rows[0].table_type !== 'BASE TABLE') {
      console.log("Atenção: 'pneus' é uma view, não uma tabela física. Alterações de esquema não são permitidas.");
      return;
    }

    console.log("Verificando se a tabela pneus precisa ser atualizada...");
    
    // Tentar ler o arquivo SQL, com fallback para SQL inline
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const sqlFilePath = path.join(__dirname, 'scripts', 'updatePneusTable.sql');
    
    let sqlContent = '';
    
    if (fs.existsSync(sqlFilePath)) {
      sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
      console.log("SQL file encontrado e carregado:", sqlFilePath);
    } else {
      console.warn(`Arquivo SQL não encontrado: ${sqlFilePath}. Usando SQL inline como fallback.`);
      
      // SQL inline como fallback para deployment
      sqlContent = `
        -- Atualização da tabela pneus para incluir campos adicionais
        DO $$
        BEGIN
            -- Verifica e adiciona coluna código/serial
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'pneus' AND column_name = 'codigo') THEN
                ALTER TABLE pneus ADD COLUMN codigo VARCHAR(50);
            END IF;

            -- Verifica e adiciona coluna marca
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'pneus' AND column_name = 'marca') THEN
                ALTER TABLE pneus ADD COLUMN marca VARCHAR(50);
            END IF;

            -- Verifica e adiciona coluna modelo
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'pneus' AND column_name = 'modelo') THEN
                ALTER TABLE pneus ADD COLUMN modelo VARCHAR(50);
            END IF;

            -- Verifica e adiciona coluna medida
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'pneus' AND column_name = 'medida') THEN
                ALTER TABLE pneus ADD COLUMN medida VARCHAR(50);
            END IF;

            -- Verifica e adiciona coluna localizacao
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'pneus' AND column_name = 'localizacao') THEN
                ALTER TABLE pneus ADD COLUMN localizacao VARCHAR(50) DEFAULT 'almoxarifado';
            END IF;

            -- Verifica e adiciona coluna created_at
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'pneus' AND column_name = 'created_at') THEN
                ALTER TABLE pneus ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            END IF;

            -- Verifica e adiciona coluna updated_at
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'pneus' AND column_name = 'updated_at') THEN
                ALTER TABLE pneus ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            END IF;
        END$$;
      `;
    }
    
    // Executar o script SQL
    await pool.query(sqlContent);
    console.log("Tabela pneus atualizada com sucesso!");
  } catch (error) {
    console.error("Erro ao atualizar tabela pneus:", error);
    // Não relançamos o erro para não interromper a inicialização da aplicação
  }
}