/**
 * Rota para executar SQL de forma segura usando parâmetros
 * Esta rota evita o problema de sintaxe SQL com comentários JavaScript
 */

import { Router } from 'express';
import { pool } from '../db';

const router = Router();

/**
 * Executa uma consulta SQL com parâmetros de forma segura
 * Isso evita problemas de sintaxe SQL com comentários JavaScript
 */
router.post('/sql-seguro', async (req, res) => {
  try {
    const { query, params } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Parâmetro 'query' é obrigatório"
      });
    }

    // Validar se o usuário está autenticado, exceto para operações de postos
    const isPostoRelated = (
      query.toLowerCase().includes('abastecimentos_posto') || 
      query.toLowerCase().includes('recebimentos_posto') ||
      query.toLowerCase().includes('movimentacoes_patio_')
    );

    if (!isPostoRelated && !req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: "Não autenticado"
      });
    }

    // Executar a consulta SQL
    const result = await pool.query(query, params || []);

    return res.status(200).json({
      success: true,
      rows: result.rows,
      rowCount: result.rowCount,
      fields: result.fields
    });
  } catch (error: any) {
    console.error('Erro ao executar SQL seguro:', error);
    return res.status(500).json({
      success: false,
      message: `Erro ao executar SQL: ${error.message}`,
      error: String(error)
    });
  }
});

export default router;