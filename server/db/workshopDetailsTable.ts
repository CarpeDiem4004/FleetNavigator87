/**
 * Módulo para criar a tabela workshop_details no Supabase
 * Esta tabela armazena detalhes adicionais de cada oficina
 */

import { pool } from '../db';

/**
 * Cria a tabela workshop_details no banco de dados
 * @returns Promise vazia que é resolvida quando a tabela for criada
 */
export async function createWorkshopDetailsTable() {
  try {
    // Primeiro, verifica se a tabela já existe
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'workshop_details'
      );
    `);

    const tableExists = checkResult.rows[0].exists;

    if (!tableExists) {
      // Cria a tabela se não existir
      await pool.query(`
        CREATE TABLE IF NOT EXISTS workshop_details (
          id SERIAL PRIMARY KEY,
          workshop_id INTEGER NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
          bank_name VARCHAR(100),
          bank_agency VARCHAR(20),
          bank_account VARCHAR(30),
          account_type VARCHAR(30),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          notes TEXT,
          approval_status VARCHAR(20) DEFAULT 'pendente',
          rejection_reason TEXT,
          approved_by INTEGER REFERENCES users(id),
          approval_date TIMESTAMP WITH TIME ZONE,
          legal_representative VARCHAR(100),
          legal_document VARCHAR(20),
          insurance_details TEXT,
          payment_terms TEXT,
          service_warranty VARCHAR(100)
        );
      `);

      console.log('Tabela workshop_details criada com sucesso');
    } else {
      console.log('Tabela workshop_details já existe');
      
      // Verifica se a coluna service_warranty existe
      const columnCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'workshop_details'
          AND column_name = 'service_warranty'
        );
      `);
      
      const columnExists = columnCheck.rows[0].exists;
      
      if (!columnExists) {
        // Adiciona a coluna se não existir
        await pool.query(`
          ALTER TABLE workshop_details 
          ADD COLUMN service_warranty VARCHAR(100);
        `);
        console.log('Coluna service_warranty adicionada à tabela workshop_details');
      }
    }

    // Cria um índice para melhorar a performance de buscas por workshop_id
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_workshop_details_workshop_id 
      ON workshop_details(workshop_id);
    `);
    
    // Cria um índice para melhorar a performance de buscas por status de aprovação
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_workshop_details_approval_status 
      ON workshop_details(approval_status);
    `);

    return Promise.resolve();
  } catch (error) {
    console.error('Erro ao criar tabela workshop_details:', error);
    return Promise.reject(error);
  }
}