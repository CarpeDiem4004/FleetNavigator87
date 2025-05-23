/**
 * Manipulador especializado para recebimentos do posto Osasco V2
 * Versão corrigida que resolve problemas de compatibilidade
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Endpoint para buscar recebimentos do posto Osasco
router.get('/', async (req, res) => {
  try {
    // Consultar registros direto da tabela
    const result = await pool.query(
      'SELECT * FROM recebimentos_posto_osasco_v2 ORDER BY created_at DESC LIMIT 50'
    );
    
    console.log(`[FixOsasco] Encontrados ${result.rowCount} recebimentos`);
    
    // Mapear para o formato esperado pelo frontend
    const mappedRecebimentos = result.rows.map(row => ({
      id: row.id,
      fornecedor: row.nome_fornecedor,
      tipo_combustivel: row.tipo_produto,
      quantidade_litros: parseFloat(row.litros_recebidos),
      valor_litro: parseFloat(row.litros_recebidos) > 0 
        ? parseFloat(row.valor_total) / parseFloat(row.litros_recebidos) 
        : 0,
      valor_total: parseFloat(row.valor_total),
      numero_nota: '(Não informado)',
      operador: row.nome_operador,
      data_entrega: new Date().toISOString().split('T')[0],
      observacoes: row.observacoes || '',
      created_at: row.created_at.toISOString()
    }));
    
    return res.json({
      success: true,
      data: mappedRecebimentos
    });
  } catch (error) {
    console.error('[FixOsasco] Erro:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar recebimentos do posto Osasco',
      error: error.message
    });
  }
});

module.exports = router;