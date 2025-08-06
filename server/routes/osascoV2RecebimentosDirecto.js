/**
 * Rotas diretas para recebimentos do posto Osasco V2
 * Esta versão utiliza conexão direta com o banco de dados
 */
import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Endpoint para verificar se a tabela existe
router.get('/check-table', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'recebimentos_posto_osasco_v2'
      );
    `);
    
    return res.json({
      success: true,
      exists: result.rows[0].exists
    });
  } catch (error) {
    console.error('[OsascoV2Direto] Erro ao verificar tabela:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar existência da tabela',
      error: error.message
    });
  }
});

// Endpoint para buscar todos recebimentos
router.get('/', async (req, res) => {
  try {
    // Verificar se a tabela existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'recebimentos_posto_osasco_v2'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      return res.json({
        success: true,
        message: 'Tabela não encontrada',
        data: []
      });
    }
    
    // Consultar registros 
    const result = await pool.query(`
      SELECT *
      FROM recebimentos_posto_osasco_v2
      ORDER BY created_at DESC
      LIMIT 50
    `);
    
    console.log(`[OsascoV2Direto] Encontrados ${result.rowCount} recebimentos`);
    
    // Mapear para o formato esperado pelo frontend
    const mappedRecebimentos = result.rows.map(row => ({
      id: row.id,
      fornecedor: row.nome_fornecedor || 'Não informado',
      tipo_combustivel: row.tipo_produto || 'Diesel',
      quantidade_litros: parseFloat(row.litros_recebidos || 0),
      valor_litro: parseFloat(row.valor_litro || 0),
      valor_total: parseFloat(row.valor_total || 0),
      numero_nota: row.numero_nota_fiscal || 'Não informado',
      data_entrega: row.data_entrega || new Date().toISOString().split('T')[0],
      operador: row.nome_operador || 'Sistema',
      observacoes: row.observacoes || '',
      created_at: row.created_at ? row.created_at.toISOString() : new Date().toISOString()
    }));
    
    return res.json({
      success: true,
      data: mappedRecebimentos
    });
  } catch (error) {
    console.error('[OsascoV2Direto] Erro:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar recebimentos do posto Osasco',
      error: error.message
    });
  }
});

// Endpoint para inserir um novo recebimento
router.post('/', async (req, res) => {
  try {
    const recebimentoData = req.body;
    
    if (!recebimentoData || 
        !recebimentoData.nome_fornecedor || 
        !recebimentoData.tipo_produto || 
        !recebimentoData.litros_recebidos || 
        !recebimentoData.valor_litro || 
        !recebimentoData.valor_total) {
      return res.status(400).json({
        success: false,
        message: 'Dados incompletos para registrar recebimento'
      });
    }
    
    // Verificar se a tabela existe e criar se não existir
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'recebimentos_posto_osasco_v2'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('[OsascoV2Direto] Tabela não encontrada, criando...');
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS recebimentos_posto_osasco_v2 (
          id SERIAL PRIMARY KEY,
          nome_fornecedor VARCHAR(255) NOT NULL,
          tipo_produto VARCHAR(100) NOT NULL,
          litros_recebidos NUMERIC(10,2) NOT NULL,
          valor_litro NUMERIC(10,3) NOT NULL,
          valor_total NUMERIC(10,2) NOT NULL,
          numero_nota_fiscal VARCHAR(100),
          data_entrega DATE,
          nome_operador VARCHAR(255),
          observacoes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('[OsascoV2Direto] Tabela criada com sucesso!');
    }
    
    // Inserir o novo recebimento
    const insertQuery = `
      INSERT INTO recebimentos_posto_osasco_v2 (
        nome_fornecedor,
        tipo_produto,
        litros_recebidos,
        valor_litro,
        valor_total,
        numero_nota_fiscal,
        nome_operador,
        data_entrega,
        observacoes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    
    const values = [
      recebimentoData.nome_fornecedor,
      recebimentoData.tipo_produto,
      recebimentoData.litros_recebidos,
      recebimentoData.valor_litro,
      recebimentoData.valor_total,
      recebimentoData.numero_nota || '',
      recebimentoData.nome_operador || 'Sistema',
      recebimentoData.data_entrega || new Date(),
      recebimentoData.observacoes || ''
    ];
    
    const result = await pool.query(insertQuery, values);
    
    return res.status(201).json({
      success: true,
      message: 'Recebimento registrado com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('[OsascoV2Direto] Erro ao registrar recebimento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao registrar recebimento',
      error: error.message
    });
  }
});

export default router;