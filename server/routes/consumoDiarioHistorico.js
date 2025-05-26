/**
 * API para consulta do histórico de consumo diário
 * Permite visualizar dados coletados automaticamente à meia-noite
 */

const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * GET /api/consumo-diario-historico
 * Retorna histórico de consumo diário de todos os postos
 */
router.get('/consumo-diario-historico', async (req, res) => {
  try {
    const { periodo = 30, posto } = req.query;
    
    let query = `
      SELECT 
        data_coleta,
        posto,
        litros_consumidos,
        numero_abastecimentos,
        valor_total,
        nivel_tanque_atual,
        capacidade_maxima,
        percentual_disponivel,
        created_at
      FROM consumo_diario_historico
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    // Filtrar por posto se especificado
    if (posto) {
      query += ` AND posto = $${paramCount}`;
      params.push(posto);
      paramCount++;
    }
    
    // Filtrar por período (últimos X dias)
    query += ` AND data_coleta >= CURRENT_DATE - INTERVAL '${parseInt(periodo)} days'`;
    
    query += ` ORDER BY data_coleta DESC, posto ASC`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount
    });
    
  } catch (error) {
    console.error('Erro ao buscar histórico de consumo diário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * GET /api/consumo-diario-historico/resumo
 * Retorna resumo consolidado por período
 */
router.get('/consumo-diario-historico/resumo', async (req, res) => {
  try {
    const { periodo = 7 } = req.query;
    
    const query = `
      SELECT 
        posto,
        COUNT(*) as dias_registrados,
        SUM(litros_consumidos) as total_litros,
        SUM(numero_abastecimentos) as total_abastecimentos,
        SUM(valor_total) as total_valor,
        AVG(litros_consumidos) as media_litros_dia,
        AVG(numero_abastecimentos) as media_abastecimentos_dia,
        AVG(percentual_disponivel) as media_percentual_disponivel
      FROM consumo_diario_historico
      WHERE data_coleta >= CURRENT_DATE - INTERVAL '${parseInt(periodo)} days'
      GROUP BY posto
      ORDER BY posto ASC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows,
      periodo: parseInt(periodo)
    });
    
  } catch (error) {
    console.error('Erro ao buscar resumo de consumo diário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * POST /api/consumo-diario-historico/coletar
 * Executa coleta manual dos dados (para testes)
 */
router.post('/consumo-diario-historico/coletar', async (req, res) => {
  try {
    const { executarColetaManual } = require('../services/consumoDiarioScheduler');
    
    // Executar coleta manual
    await executarColetaManual();
    
    res.json({
      success: true,
      message: 'Coleta manual executada com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao executar coleta manual:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao executar coleta manual',
      error: error.message
    });
  }
});

/**
 * GET /api/consumo-diario-historico/tendencia
 * Retorna dados para gráfico de tendência de consumo
 */
router.get('/consumo-diario-historico/tendencia', async (req, res) => {
  try {
    const { periodo = 30, posto } = req.query;
    
    let query = `
      SELECT 
        data_coleta,
        posto,
        litros_consumidos,
        numero_abastecimentos,
        percentual_disponivel
      FROM consumo_diario_historico
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (posto) {
      query += ` AND posto = $${paramCount}`;
      params.push(posto);
      paramCount++;
    }
    
    query += ` AND data_coleta >= CURRENT_DATE - INTERVAL '${parseInt(periodo)} days'`;
    query += ` ORDER BY data_coleta ASC, posto ASC`;
    
    const result = await pool.query(query, params);
    
    // Agrupar dados por data para facilitar visualização
    const dadosAgrupados = {};
    
    result.rows.forEach(row => {
      const data = row.data_coleta;
      if (!dadosAgrupados[data]) {
        dadosAgrupados[data] = [];
      }
      dadosAgrupados[data].push({
        posto: row.posto,
        litros_consumidos: parseFloat(row.litros_consumidos),
        numero_abastecimentos: parseInt(row.numero_abastecimentos),
        percentual_disponivel: parseFloat(row.percentual_disponivel)
      });
    });
    
    res.json({
      success: true,
      data: dadosAgrupados,
      periodo: parseInt(periodo)
    });
    
  } catch (error) {
    console.error('Erro ao buscar dados de tendência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router;