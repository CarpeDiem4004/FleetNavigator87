/**
 * Script para adicionar o campo "media_consumo_combustivel" na tabela de veículos
 * Este campo armazenará a média de consumo de combustível em km/l
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function adicionarCampoMediaConsumo() {
  try {
    console.log('Iniciando atualização da tabela de veículos...');
    
    // Verificar se a tabela vehicles existe
    const tabelaExiste = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'vehicles'
      );
    `);
    
    if (!tabelaExiste.rows[0].exists) {
      console.log('Tabela vehicles não encontrada. Criando tabela...');
      await pool.query(`
        CREATE TABLE vehicles (
          id SERIAL PRIMARY KEY,
          plate VARCHAR(10) NOT NULL UNIQUE,
          make VARCHAR(100) NOT NULL,
          model VARCHAR(100) NOT NULL,
          year INTEGER,
          vehicle_type VARCHAR(50),
          status VARCHAR(50) DEFAULT 'em_operacao',
          base_id INTEGER,
          fuel_type VARCHAR(50),
          media_consumo_combustivel DECIMAL(5,2),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Tabela vehicles criada com sucesso!');
    } else {
      // Verificar se a coluna media_consumo_combustivel já existe
      const colunaExiste = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'vehicles' 
          AND column_name = 'media_consumo_combustivel'
        );
      `);
      
      if (!colunaExiste.rows[0].exists) {
        console.log('Adicionando coluna media_consumo_combustivel...');
        await pool.query(`
          ALTER TABLE vehicles 
          ADD COLUMN media_consumo_combustivel DECIMAL(5,2) DEFAULT NULL;
        `);
        
        console.log('Coluna media_consumo_combustivel adicionada com sucesso!');
        
        // Adicionar comentário na coluna para documentação
        await pool.query(`
          COMMENT ON COLUMN vehicles.media_consumo_combustivel 
          IS 'Média de consumo de combustível em km/l';
        `);
      } else {
        console.log('Coluna media_consumo_combustivel já existe.');
      }
    }
    
    // Verificar a estrutura atual da tabela
    const estrutura = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'vehicles'
      ORDER BY ordinal_position;
    `);
    
    console.log('Estrutura atual da tabela vehicles:');
    estrutura.rows.forEach(coluna => {
      console.log(`- ${coluna.column_name}: ${coluna.data_type} (${coluna.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
  } catch (error) {
    console.error('Erro ao atualizar tabela de veículos:', error);
  } finally {
    await pool.end();
  }
}

adicionarCampoMediaConsumo();