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
    // Verifica se a tabela existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'workshop_details'
      );
    `);

    // Se a tabela já existe, não faz nada
    if (tableCheck.rows[0].exists) {
      console.log('Tabela workshop_details já existe.');
      return;
    }

    // Cria a tabela workshop_details
    await pool.query(`
      CREATE TABLE workshop_details (
        id SERIAL PRIMARY KEY,
        workshop_id INTEGER NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
        approval_status VARCHAR(20) NOT NULL DEFAULT 'pendente',
        rejection_reason TEXT,
        approval_date TIMESTAMP,
        approved_by INTEGER REFERENCES users(id),
        services_offered TEXT[],
        specialties TEXT[],
        operating_hours TEXT,
        payment_methods TEXT[],
        warranty_terms TEXT,
        additional_info TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Tabela workshop_details criada com sucesso.');
  } catch (error) {
    console.error('Erro ao criar tabela workshop_details:', error);
    throw error;
  }
}