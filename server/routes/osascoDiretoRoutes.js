/**
 * Rotas diretas para o posto Osasco V2 sem usar as rotas genéricas
 * Esta implementação acessa diretamente a tabela de recebimentos
 */

import express from 'express';
const router = express.Router();
import { pool } from '../db.js';

// Obter recebimentos para o posto Osasco V2
router.get('/recebimentos', async (req, res) => {
  try {
    console.log('[OsascoDireto] Consultando recebimentos do posto Osasco V2');
    
    // Verificar se a tabela existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'recebimentos_posto_osasco_v2'
      );
    `;
    
    const tableExists = await pool.query(checkQuery);
    
    if (!tableExists.rows[0].exists) {
      return res.json({
        success: true,
        message: "Tabela de recebimentos do posto Osasco V2 não existe",
        data: [],
        count: 0
      });
    }
    
    // Buscar dados com campos corretos
    const query = `
      SELECT 
        id,
        nome_fornecedor,
        tipo_produto,
        litros_recebidos,
        valor_litro,
        valor_total,
        numero_nota,
        nome_operador,
        data_entrega,
        observacoes,
        created_at
      FROM recebimentos_posto_osasco_v2
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    
    // Mapear os campos para o formato esperado pelo frontend
    const formattedData = result.rows.map(row => ({
      id: row.id,
      fornecedor: row.nome_fornecedor,
      tipo_combustivel: row.tipo_produto,
      quantidade_litros: row.litros_recebidos,
      valor_litro: row.valor_litro,
      valor_total: row.valor_total,
      numero_nota: row.numero_nota,
      operador: row.nome_operador,
      nome_operador: row.nome_operador,
      data_entrega: row.data_entrega,
      observacoes: row.observacoes,
      data_formatada: new Date(row.created_at).toLocaleDateString('pt-BR') + ' ' + 
                     new Date(row.created_at).toLocaleTimeString('pt-BR'),
      created_at: row.created_at
    }));
    
    return res.json({
      success: true,
      count: result.rowCount,
      data: formattedData
    });
  } catch (error) {
    console.error('[OsascoDireto] Erro ao consultar recebimentos:', error);
    return res.status(500).json({
      success: false,
      message: "Erro ao consultar recebimentos: " + error.message,
      data: []
    });
  }
});

// Adicionar recebimento para o posto Osasco V2
router.post('/recebimentos', async (req, res) => {
  try {
    console.log('[OsascoDireto] Registrando novo recebimento');
    
    const {
      fornecedor,
      tipo_combustivel,
      quantidade_litros,
      valor_litro,
      valor_total,
      numero_nota,
      operador,
      data_entrega,
      observacoes
    } = req.body;
    
    // Validação básica
    if (!fornecedor || !tipo_combustivel || !quantidade_litros || !valor_litro) {
      return res.status(400).json({
        success: false,
        message: "Dados incompletos para registro de recebimento"
      });
    }
    
    // Criar tabela se não existir
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS recebimentos_posto_osasco_v2 (
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    await pool.query(createTableQuery);
    
    // Inserir dados
    const insertQuery = `
      INSERT INTO recebimentos_posto_osasco_v2 (
        nome_fornecedor,
        tipo_produto,
        litros_recebidos,
        valor_litro,
        valor_total,
        numero_nota,
        data_entrega,
        nome_operador,
        observacoes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      fornecedor,
      tipo_combustivel,
      quantidade_litros,
      valor_litro,
      valor_total,
      numero_nota || '',
      data_entrega || new Date(),
      operador || 'Sistema',
      observacoes || ''
    ];
    
    const result = await pool.query(insertQuery, values);
    const row = result.rows[0];
    
    // Formatar resposta
    const formattedData = {
      id: row.id,
      fornecedor: row.nome_fornecedor,
      tipo_combustivel: row.tipo_produto,
      quantidade_litros: row.litros_recebidos,
      valor_litro: row.valor_litro,
      valor_total: row.valor_total,
      numero_nota: row.numero_nota,
      operador: row.nome_operador,
      nome_operador: row.nome_operador,
      data_entrega: row.data_entrega,
      observacoes: row.observacoes,
      data_formatada: new Date(row.created_at).toLocaleDateString('pt-BR') + ' ' + 
                     new Date(row.created_at).toLocaleTimeString('pt-BR'),
      created_at: row.created_at
    };
    
    return res.status(201).json({
      success: true,
      message: "Recebimento registrado com sucesso",
      data: formattedData
    });
  } catch (error) {
    console.error('[OsascoDireto] Erro ao registrar recebimento:', error);
    return res.status(500).json({
      success: false,
      message: "Erro ao registrar recebimento: " + error.message
    });
  }
});

module.exports = router;