/**
 * Rota de teste para os recebimentos do posto Osasco V2
 * Esta rota é apenas para diagnóstico
 */

import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.get('/api/teste-osasco-recebimentos', async (req, res) => {
  try {
    // Verificar se a tabela existe
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'recebimentos_posto_osasco_v2'
      );
    `);

    if (!checkResult.rows[0].exists) {
      return res.json({
        success: false,
        message: 'Tabela recebimentos_posto_osasco_v2 não existe'
      });
    }

    // Verificar colunas da tabela
    const columnsResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'recebimentos_posto_osasco_v2'
      ORDER BY ordinal_position;
    `);

    // Buscar alguns registros da tabela
    const dataResult = await pool.query(`
      SELECT * FROM recebimentos_posto_osasco_v2 LIMIT 5;
    `);

    res.json({
      success: true,
      message: 'Diagnóstico da tabela recebimentos_posto_osasco_v2',
      table_exists: true,
      columns: columnsResult.rows,
      sample_data: dataResult.rows,
      records_count: dataResult.rowCount
    });
  } catch (error) {
    console.error('Erro no diagnóstico do Osasco V2:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar tabela: ' + error.message
    });
  }
});

export default router;