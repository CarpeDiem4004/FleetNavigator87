import { pool } from './db';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Atualiza a tabela de pneus para incluir todos os campos necessários
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

    console.log("Verificando se a tabela pneus precisa ser atualizada...");
    
    // Ler o arquivo SQL
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const sqlFilePath = path.join(__dirname, 'scripts', 'updatePneusTable.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`Arquivo SQL não encontrado: ${sqlFilePath}`);
      return;
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Executar o script SQL
    await pool.query(sqlContent);
    console.log("Tabela pneus atualizada com sucesso!");
  } catch (error) {
    console.error("Erro ao atualizar tabela pneus:", error);
  }
}