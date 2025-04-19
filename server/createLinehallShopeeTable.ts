import { db } from "./db";
import { sql } from "drizzle-orm";

async function createLinehallShopeeTable() {
  console.log("Iniciando criação da tabela linehall_shopee...");
  
  try {
    // Verificar tabelas existentes
    const tablesResult = await db.execute(sql`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
    `);
    console.log("Tabelas existentes:", tablesResult.rows.map(r => r.table_name));

    // Criar o enum linehall_status
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'linehall_status') THEN
          CREATE TYPE linehall_status AS ENUM ('agendado', 'carregando', 'em_transito', 'descarregando', 'finalizado', 'cancelado');
        END IF;
      END $$;
    `);
    console.log("Enum linehall_status criado ou já existente");
    
    // Criar a tabela linehall_shopee
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS linehall_shopee (
        id SERIAL PRIMARY KEY,
        data_viagem DATE NOT NULL,
        cavalo_placa TEXT NOT NULL REFERENCES vehicles(plate),
        carreta1_placa TEXT NOT NULL,
        carreta2_placa TEXT,
        motorista_id INTEGER NOT NULL REFERENCES users(id),
        base_origem_id INTEGER NOT NULL REFERENCES bases(id),
        base_destino_id INTEGER NOT NULL REFERENCES bases(id),
        horario_carregamento TEXT NOT NULL,
        status linehall_status DEFAULT 'agendado',
        observacoes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log("Tabela linehall_shopee criada com sucesso!");
  } catch (error) {
    console.error("Erro ao criar tabela linehall_shopee:", error);
    throw error;
  }
}

// Executar a função
createLinehallShopeeTable()
  .then(() => {
    console.log("Processo de criação concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erro durante o processo:", error);
    process.exit(1);
  });