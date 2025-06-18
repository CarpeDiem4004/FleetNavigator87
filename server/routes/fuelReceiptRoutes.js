const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Create pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper function to get table name based on station
const getTableName = (station) => {
  const tableMap = {
    'abc': 'recebimentos_posto_abc_v2',
    'campinas': 'recebimentos_posto_campinas_v2',
    'guarulhos': 'recebimentos_posto_guarulhos_v2',
    'osasco': 'recebimentos_posto_osasco_v2',
    'socorro': 'recebimentos_posto_socorro_v2',
    'sorocaba': 'recebimentos_posto_sorocaba_v2',
    'alair': 'recebimentos_posto_alair_v2'
  };
  return tableMap[station.toLowerCase()] || null;
};

// GET all fuel receipts for a specific station
router.get('/station/:station', async (req, res) => {
  try {
    const { station } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const tableName = getTableName(station);
    if (!tableName) {
      return res.status(400).json({ error: 'Invalid station name' });
    }

    const query = `
      SELECT 
        id,
        tipo_produto,
        litros_recebidos,
        valor_litro,
        valor_total,
        nome_fornecedor,
        nome_operador,
        numero_nota_fiscal,
        data_recebimento,
        observacoes,
        status,
        posto_origem,
        tanque_numero,
        densidade,
        temperatura,
        created_at,
        updated_at
      FROM ${tableName}
      WHERE status = 'ativo'
      ORDER BY data_recebimento DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);
    
    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) FROM ${tableName} WHERE status = 'ativo'`;
    const countResult = await pool.query(countQuery);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      data: result.rows,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching fuel receipts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET consolidated view of all fuel receipts
router.get('/consolidated', async (req, res) => {
  try {
    const { limit = 100, offset = 0, station } = req.query;
    
    let query = `
      SELECT 
        id,
        tipo_produto,
        litros_recebidos,
        valor_litro,
        valor_total,
        nome_fornecedor,
        nome_operador,
        numero_nota_fiscal,
        data_recebimento,
        observacoes,
        status,
        posto_origem,
        tanque_numero,
        densidade,
        temperatura,
        created_at,
        updated_at
      FROM vw_recebimentos_combustivel_consolidado
      WHERE status = 'ativo'
    `;

    const params = [];
    let paramIndex = 1;

    if (station) {
      query += ` AND posto_origem = $${paramIndex}`;
      params.push(station.toUpperCase() + '_V2');
      paramIndex++;
    }

    query += ` ORDER BY data_recebimento DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) FROM vw_recebimentos_combustivel_consolidado WHERE status = 'ativo'`;
    const countParams = [];
    if (station) {
      countQuery += ` AND posto_origem = $1`;
      countParams.push(station.toUpperCase() + '_V2');
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      data: result.rows,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching consolidated fuel receipts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST new fuel receipt
router.post('/station/:station', async (req, res) => {
  try {
    const { station } = req.params;
    const {
      tipo_produto,
      litros_recebidos,
      valor_litro,
      valor_total,
      nome_fornecedor,
      nome_operador,
      numero_nota_fiscal,
      observacoes,
      tanque_numero,
      densidade,
      temperatura
    } = req.body;

    // Validate required fields
    if (!tipo_produto || !litros_recebidos || !valor_total || !nome_fornecedor || !nome_operador) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const tableName = getTableName(station);
    if (!tableName) {
      return res.status(400).json({ error: 'Invalid station name' });
    }

    const query = `
      INSERT INTO ${tableName} (
        tipo_produto,
        litros_recebidos,
        valor_litro,
        valor_total,
        nome_fornecedor,
        nome_operador,
        numero_nota_fiscal,
        observacoes,
        tanque_numero,
        densidade,
        temperatura,
        posto_origem
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      tipo_produto,
      parseFloat(litros_recebidos),
      valor_litro ? parseFloat(valor_litro) : null,
      parseFloat(valor_total),
      nome_fornecedor,
      nome_operador,
      numero_nota_fiscal || null,
      observacoes || null,
      tanque_numero ? parseInt(tanque_numero) : null,
      densidade ? parseFloat(densidade) : null,
      temperatura ? parseFloat(temperatura) : null,
      station.toUpperCase() + '_V2'
    ];

    const result = await pool.query(query, values);
    
    res.status(201).json({
      message: 'Fuel receipt created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating fuel receipt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update fuel receipt
router.put('/station/:station/:id', async (req, res) => {
  try {
    const { station, id } = req.params;
    const {
      tipo_produto,
      litros_recebidos,
      valor_litro,
      valor_total,
      nome_fornecedor,
      nome_operador,
      numero_nota_fiscal,
      observacoes,
      tanque_numero,
      densidade,
      temperatura,
      status
    } = req.body;

    const tableName = getTableName(station);
    if (!tableName) {
      return res.status(400).json({ error: 'Invalid station name' });
    }

    const query = `
      UPDATE ${tableName} SET
        tipo_produto = $1,
        litros_recebidos = $2,
        valor_litro = $3,
        valor_total = $4,
        nome_fornecedor = $5,
        nome_operador = $6,
        numero_nota_fiscal = $7,
        observacoes = $8,
        tanque_numero = $9,
        densidade = $10,
        temperatura = $11,
        status = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `;

    const values = [
      tipo_produto,
      parseFloat(litros_recebidos),
      valor_litro ? parseFloat(valor_litro) : null,
      parseFloat(valor_total),
      nome_fornecedor,
      nome_operador,
      numero_nota_fiscal || null,
      observacoes || null,
      tanque_numero ? parseInt(tanque_numero) : null,
      densidade ? parseFloat(densidade) : null,
      temperatura ? parseFloat(temperatura) : null,
      status || 'ativo',
      parseInt(id)
    ];

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fuel receipt not found' });
    }

    res.json({
      message: 'Fuel receipt updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating fuel receipt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE fuel receipt (soft delete)
router.delete('/station/:station/:id', async (req, res) => {
  try {
    const { station, id } = req.params;

    const tableName = getTableName(station);
    if (!tableName) {
      return res.status(400).json({ error: 'Invalid station name' });
    }

    const query = `
      UPDATE ${tableName} SET
        status = 'inativo',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, status
    `;

    const result = await pool.query(query, [parseInt(id)]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fuel receipt not found' });
    }

    res.json({
      message: 'Fuel receipt deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting fuel receipt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET statistics for a station
router.get('/station/:station/stats', async (req, res) => {
  try {
    const { station } = req.params;
    
    const query = `SELECT * FROM get_estatisticas_recebimento($1)`;
    const result = await pool.query(query, [station.toUpperCase() + '_V2']);
    
    if (result.rows.length === 0) {
      return res.json({
        total_recebimentos: 0,
        total_litros: 0,
        total_valor: 0,
        ultimo_recebimento: null,
        produtos_tipos: []
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching station statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET overall statistics
router.get('/stats/overall', async (req, res) => {
  try {
    const query = `SELECT * FROM get_estatisticas_recebimento()`;
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      return res.json({
        total_recebimentos: 0,
        total_litros: 0,
        total_valor: 0,
        ultimo_recebimento: null,
        produtos_tipos: []
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching overall statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;