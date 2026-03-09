/**
 * Script para corrigir problemas na tabela de recebimentos do posto Osasco V2
 */

import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.get('/diagnostico', async (req, res) => {
  try {
    // Verificar se a tabela existe
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'recebimentos_posto_osasco_v2'
      );
    `;
    
    const tableExistsResult = await pool.query(checkTableQuery);
    
    if (!tableExistsResult.rows[0].exists) {
      return res.json({
        success: false,
        message: "Tabela recebimentos_posto_osasco_v2 não existe",
        action: "criar_tabela"
      });
    }
    
    // Verificar colunas da tabela
    const checkColumnsQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'recebimentos_posto_osasco_v2'
      ORDER BY ordinal_position;
    `;
    
    const columnsResult = await pool.query(checkColumnsQuery);
    
    // Verificar registros na tabela
    const countQuery = `
      SELECT COUNT(*) as total FROM recebimentos_posto_osasco_v2;
    `;
    
    const countResult = await pool.query(countQuery);
    
    // Buscar amostra de dados
    const sampleQuery = `
      SELECT * FROM recebimentos_posto_osasco_v2 
      ORDER BY id DESC LIMIT 5;
    `;
    
    const sampleResult = await pool.query(sampleQuery);
    
    return res.json({
      success: true,
      message: "Diagnóstico concluído",
      table_exists: true,
      columns: columnsResult.rows,
      record_count: countResult.rows[0].total,
      sample_data: sampleResult.rows
    });
  } catch (error) {
    console.error("Erro ao diagnosticar tabela:", error);
    return res.status(500).json({
      success: false,
      message: "Erro no diagnóstico: " + error.message,
      error: error
    });
  }
});

router.get('/corrigir', async (req, res) => {
  try {
    // Verificar se a tabela existe
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'recebimentos_posto_osasco_v2'
      );
    `;
    
    const tableExistsResult = await pool.query(checkTableQuery);
    
    if (!tableExistsResult.rows[0].exists) {
      // Criar a tabela se não existir
      const createTableQuery = `
        CREATE TABLE recebimentos_posto_osasco_v2 (
          id SERIAL PRIMARY KEY,
          nome_fornecedor VARCHAR(255) NOT NULL,
          tipo_produto VARCHAR(100) NOT NULL,
          litros_recebidos NUMERIC(10,2) NOT NULL,
          valor_litro NUMERIC(10,3) NOT NULL,
          valor_total NUMERIC(10,2) NOT NULL,
          numero_nota VARCHAR(100) NOT NULL,
          data_entrega DATE NOT NULL,
          nome_operador VARCHAR(255) NOT NULL,
          observacoes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      await pool.query(createTableQuery);
      
      return res.json({
        success: true,
        message: "Tabela recebimentos_posto_osasco_v2 criada com sucesso",
        action_taken: "create_table"
      });
    }
    
    // Verificar se todas as colunas necessárias existem
    const requiredColumns = [
      'nome_fornecedor', 
      'tipo_produto', 
      'litros_recebidos', 
      'valor_litro', 
      'valor_total', 
      'numero_nota', 
      'data_entrega', 
      'nome_operador', 
      'observacoes'
    ];
    
    const checkColumnsQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'recebimentos_posto_osasco_v2';
    `;
    
    const columnsResult = await pool.query(checkColumnsQuery);
    const existingColumns = columnsResult.rows.map(row => row.column_name);
    
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      // Adicionar colunas faltantes
      for (const column of missingColumns) {
        let dataType = 'VARCHAR(255)';
        
        if (column === 'litros_recebidos' || column === 'valor_litro' || column === 'valor_total') {
          dataType = 'NUMERIC(10,2)';
        } else if (column === 'data_entrega') {
          dataType = 'DATE';
        } else if (column === 'observacoes') {
          dataType = 'TEXT';
        }
        
        const addColumnQuery = `
          ALTER TABLE recebimentos_posto_osasco_v2
          ADD COLUMN IF NOT EXISTS ${column} ${dataType};
        `;
        
        await pool.query(addColumnQuery);
      }
      
      return res.json({
        success: true,
        message: `Colunas faltantes adicionadas: ${missingColumns.join(', ')}`,
        action_taken: "add_columns",
        columns_added: missingColumns
      });
    }
    
    // Verificar dados de exemplo para testar integração
    const countQuery = `
      SELECT COUNT(*) as total FROM recebimentos_posto_osasco_v2;
    `;
    
    const countResult = await pool.query(countQuery);
    
    if (parseInt(countResult.rows[0].total) === 0) {
      // Adicionar dados de exemplo
      const sampleDataQuery = `
        INSERT INTO recebimentos_posto_osasco_v2 
        (nome_fornecedor, tipo_produto, litros_recebidos, valor_litro, valor_total, 
         numero_nota, data_entrega, nome_operador, observacoes)
        VALUES 
        ('Petrobras', 'Diesel S-10', 1000.00, 5.69, 5690.00, 'NF-123456', '2025-05-23', 'José Silva', 'Recebimento teste'),
        ('Ipiranga', 'Diesel Comum', 800.00, 5.29, 4232.00, 'NF-654321', '2025-05-22', 'Maria Souza', 'Segundo recebimento teste');
      `;
      
      await pool.query(sampleDataQuery);
      
      return res.json({
        success: true,
        message: "Dados de exemplo adicionados para teste",
        action_taken: "add_sample_data"
      });
    }
    
    return res.json({
      success: true,
      message: "Tabela está correta e possui dados",
      record_count: countResult.rows[0].total,
      action_taken: "none"
    });
    
  } catch (error) {
    console.error("Erro ao corrigir tabela:", error);
    return res.status(500).json({
      success: false,
      message: "Erro na correção: " + error.message,
      error: error
    });
  }
});

export default router;