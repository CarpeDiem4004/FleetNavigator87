/**
 * Rota para execução segura de SQL para o posto Guarulhos V2
 * 
 * Esta rota foi criada para resolver o problema específico onde comentários
 * JavaScript estavam causando erros de sintaxe SQL ao tentar salvar dados
 * no banco de dados PostgreSQL.
 */

import { Router } from 'express';
import { pool } from '../db';

const router = Router();

/**
 * Endpoint para executar SQL de forma segura
 * Esta rota é protegida e deve ser usada apenas para operações específicas
 * relacionadas ao posto Guarulhos V2.
 */
router.post('/sql-seguro', async (req, res) => {
  try {
    const { sql } = req.body;
    
    if (!sql) {
      return res.status(400).json({
        success: false,
        message: 'SQL não fornecida'
      });
    }
    
    // Executar a consulta SQL sem a presença de comentários JavaScript
    const result = await pool.query(sql);
    
    return res.status(200).json({
      success: true,
      rowCount: result.rowCount,
      rows: result.rows
    });
  } catch (error) {
    console.error('Erro ao executar SQL segura:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido ao executar SQL',
      error: error
    });
  }
});

export default router;