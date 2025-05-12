/**
 * Script para criar a tabela workshop_details
 * Esta tabela armazena os detalhes adicionais das oficinas para o processo de aprovação
 */

import { pool } from '../db';

export async function createWorkshopDetailsTable() {
  try {
    // Verifica se a tabela já existe
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'workshop_details'
      );
    `);
    
    const tableExists = checkResult.rows[0].exists;
    
    if (tableExists) {
      console.log('Tabela workshop_details já existe, verificando estrutura...');
      
      // Verifica se a coluna status existe
      const columnCheckResult = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'workshop_details' 
          AND column_name = 'status'
        );
      `);
      
      const statusColumnExists = columnCheckResult.rows[0].exists;
      
      if (!statusColumnExists) {
        console.log('Adicionando coluna status à tabela workshop_details...');
        await pool.query(`
          ALTER TABLE workshop_details
          ADD COLUMN status TEXT DEFAULT 'pendente'
        `);
      }
      
      return console.log('Verificação da tabela workshop_details concluída.');
    }
    
    // Cria a tabela se não existir
    console.log('Criando tabela workshop_details...');
    
    await pool.query(`
      CREATE TABLE workshop_details (
        id SERIAL PRIMARY KEY,
        workshop_id INTEGER NOT NULL REFERENCES workshops(id),
        cnpj TEXT,
        email TEXT,
        banco TEXT,
        agencia TEXT,
        conta TEXT,
        tipo_conta TEXT,
        status TEXT DEFAULT 'pendente',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('Tabela workshop_details criada com sucesso!');
    
    // Verifica se é necessário adicionar coluna status na tabela workshops
    const workshopsColumnCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'workshops' 
        AND column_name = 'status'
      );
    `);
    
    const workshopsStatusExists = workshopsColumnCheck.rows[0].exists;
    
    if (!workshopsStatusExists) {
      console.log('Adicionando coluna status à tabela workshops...');
      await pool.query(`
        ALTER TABLE workshops
        ADD COLUMN status TEXT DEFAULT 'pendente'
      `);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao criar tabela workshop_details:', error);
    return false;
  }
}