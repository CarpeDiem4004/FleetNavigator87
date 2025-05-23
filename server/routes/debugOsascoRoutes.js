/**
 * Rotas de debug para recebimentos do posto Osasco
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
    console.error('[DebugOsasco] Erro ao verificar tabela:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar existência da tabela',
      error: error.message
    });
  }
});

// Endpoint para buscar recebimentos
router.get('/recebimentos', async (req, res) => {
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
    
    // Consultar colunas da tabela
    const columns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'recebimentos_posto_osasco_v2'
    `);
    
    const columnNames = columns.rows.map(col => col.column_name);
    console.log('Colunas disponíveis em recebimentos_posto_osasco_v2:', columnNames);
    
    // Consultar registros 
    const result = await pool.query(`
      SELECT *
      FROM recebimentos_posto_osasco_v2
      ORDER BY created_at DESC
      LIMIT 50
    `);
    
    console.log(`[DebugOsasco] Encontrados ${result.rowCount} recebimentos`);
    
    // Mapear para o formato esperado pelo frontend
    const mappedRecebimentos = result.rows.map(row => ({
      id: row.id,
      fornecedor: row.nome_fornecedor || 'Não informado',
      tipo_combustivel: row.tipo_produto || 'Diesel',
      quantidade_litros: parseFloat(row.litros_recebidos || 0),
      valor_litro: parseFloat(row.valor_litro || 0),
      valor_total: parseFloat(row.valor_total || 0),
      numero_nota: row.numero_nota || 'Não informado',
      data_entrega: row.data_entrega || new Date().toISOString().split('T')[0],
      operador: row.nome_operador || 'Sistema',
      observacoes: row.observacoes || '',
      created_at: row.created_at ? row.created_at.toISOString() : new Date().toISOString()
    }));
    
    return res.json({
      success: true,
      data: mappedRecebimentos,
      originalCount: result.rowCount,
      columns: columnNames
    });
  } catch (error) {
    console.error('[DebugOsasco] Erro:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar recebimentos do posto Osasco',
      error: error.message
    });
  }
});

export default router;