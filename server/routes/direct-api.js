/**
 * Rotas API diretas que evitam a interceptação do Vite
 */

import express from 'express';
import { Pool } from 'pg';
import { formatPostoName } from '../utils/posto-utils.js';

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Rota para obter histórico de um posto específico da view consolidada
router.get('/historico/:posto', async (req, res) => {
  try {
    // Forçar o Content-Type como application/json para evitar interceptação do Vite
    res.setHeader('Content-Type', 'application/json');
    
    const postoName = formatPostoName(req.params.posto);
    const viewName = `abastecimentos_posto_${postoName.toLowerCase()}_consolidado`;
    
    // Verificar se a view existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as "exists";
    `;
    
    const checkResult = await pool.query(checkQuery, [viewName]);
    
    if (!checkResult.rows[0].exists) {
      return res.status(404).json({ 
        success: false, 
        error: `View consolidada para posto ${postoName} não encontrada.` 
      });
    }
    
    // Obter dados da view
    const dataQuery = `SELECT * FROM "${viewName}" ORDER BY data_hora DESC`;
    const result = await pool.query(dataQuery);
    
    return res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
      posto: postoName
    });
  } catch (error) {
    console.error(`Erro ao consultar histórico da view para posto ${req.params.posto}:`, error);
    return res.status(500).json({ 
      success: false, 
      error: `Erro ao consultar histórico: ${error.message}` 
    });
  }
});

// Rota para obter estatísticas mensais
router.get('/estatisticas-mensais/:posto', async (req, res) => {
  try {
    // Forçar o Content-Type como application/json para evitar interceptação do Vite
    res.setHeader('Content-Type', 'application/json');
    
    const postoName = formatPostoName(req.params.posto);
    const viewName = `abastecimentos_posto_${postoName.toLowerCase()}_estatisticas_mensais`;
    
    // Verificar se a view existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as "exists";
    `;
    
    const checkResult = await pool.query(checkQuery, [viewName]);
    
    if (!checkResult.rows[0].exists) {
      return res.status(404).json({ 
        success: false, 
        error: `View de estatísticas mensais para posto ${postoName} não encontrada.` 
      });
    }
    
    // Obter dados da view
    const dataQuery = `SELECT * FROM "${viewName}" ORDER BY ano DESC, mes DESC LIMIT 12`;
    const result = await pool.query(dataQuery);
    
    return res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
      posto: postoName
    });
  } catch (error) {
    console.error(`Erro ao consultar estatísticas mensais para posto ${req.params.posto}:`, error);
    return res.status(500).json({ 
      success: false, 
      error: `Erro ao consultar estatísticas mensais: ${error.message}` 
    });
  }
});

// Rota para obter consumo por veículo
router.get('/consumo-por-veiculo/:posto', async (req, res) => {
  try {
    // Forçar o Content-Type como application/json para evitar interceptação do Vite
    res.setHeader('Content-Type', 'application/json');
    
    const postoName = formatPostoName(req.params.posto);
    const viewName = `abastecimentos_posto_${postoName.toLowerCase()}_consumo_por_veiculo`;
    
    // Verificar se a view existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as "exists";
    `;
    
    const checkResult = await pool.query(checkQuery, [viewName]);
    
    if (!checkResult.rows[0].exists) {
      return res.status(404).json({ 
        success: false, 
        error: `View de consumo por veículo para posto ${postoName} não encontrada.` 
      });
    }
    
    // Obter dados da view
    const dataQuery = `SELECT * FROM "${viewName}" ORDER BY total_litros DESC LIMIT 20`;
    const result = await pool.query(dataQuery);
    
    return res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
      posto: postoName
    });
  } catch (error) {
    console.error(`Erro ao consultar consumo por veículo para posto ${req.params.posto}:`, error);
    return res.status(500).json({ 
      success: false, 
      error: `Erro ao consultar consumo por veículo: ${error.message}` 
    });
  }
});

export default router;