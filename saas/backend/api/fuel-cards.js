const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Get fuel card requests for a base
router.get('/bases/:baseId/fuel-cards', async (req, res) => {
  try {
    const { baseId } = req.params;
    const { page = 1, limit = 50, status } = req.query;
    const offset = (page - 1) * limit;

    // Build query with optional status filter
    let query = `
      SELECT 
        fcr.id,
        fcr.numero_cartao,
        fcr.provedor_cartao,
        fcr.valor_solicitado,
        fcr.status,
        fcr.observacoes,
        fcr.created_at,
        fcr.updated_at,
        u.name as solicitante_nome,
        u.email as solicitante_email,
        b.name as base_nome
      FROM fuel_card_requests fcr
      LEFT JOIN users u ON fcr.user_id = u.id
      LEFT JOIN bases b ON fcr.base_id = b.id
      WHERE fcr.base_id = $1
    `;
    
    const queryParams = [baseId];
    
    if (status) {
      query += ' AND fcr.status = $2';
      queryParams.push(status);
    }
    
    query += ' ORDER BY fcr.created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
    queryParams.push(limit, offset);

    const cardsResult = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM fuel_card_requests WHERE base_id = $1';
    const countParams = [baseId];
    
    if (status) {
      countQuery += ' AND status = $2';
      countParams.push(status);
    }

    const totalResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: cardsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(totalResult.rows[0].count),
        pages: Math.ceil(totalResult.rows[0].count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching fuel cards:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create new fuel card request
router.post('/bases/:baseId/fuel-cards', async (req, res) => {
  try {
    const { baseId } = req.params;
    const { 
      numero_cartao, 
      provedor_cartao, 
      valor_solicitado, 
      observacoes,
      tipo_solicitacao = 'recarga'
    } = req.body;

    // Validation
    if (!numero_cartao || !provedor_cartao) {
      return res.status(400).json({ 
        success: false, 
        error: 'Card number and provider are required' 
      });
    }

    // Check if user has access to this base
    if (req.user.base_id !== parseInt(baseId) && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied to this base' 
      });
    }

    const insertResult = await pool.query(
      `INSERT INTO fuel_card_requests 
       (base_id, numero_cartao, provedor_cartao, valor_solicitado, observacoes, tipo_solicitacao, user_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendente', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [baseId, numero_cartao, provedor_cartao, valor_solicitado || 0, observacoes, tipo_solicitacao, req.user.id]
    );

    // Log the action
    await pool.query(
      `INSERT INTO audit_logs (table_name, action, user_id, base_id, record_id, details, created_at)
       VALUES ('fuel_card_requests', 'CREATE', $1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      [req.user.id, baseId, insertResult.rows[0].id, JSON.stringify({
        numero_cartao,
        provedor_cartao,
        valor_solicitado,
        tipo_solicitacao
      })]
    );

    res.status(201).json({
      success: true,
      message: 'Fuel card request created successfully',
      data: insertResult.rows[0]
    });

  } catch (error) {
    console.error('Error creating fuel card request:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get specific fuel card request
router.get('/fuel-cards/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        fcr.*,
        u.name as solicitante_nome,
        u.email as solicitante_email,
        b.name as base_nome,
        b.basename as base_code
      FROM fuel_card_requests fcr
      LEFT JOIN users u ON fcr.user_id = u.id
      LEFT JOIN bases b ON fcr.base_id = b.id
      WHERE fcr.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Fuel card request not found' 
      });
    }

    const request = result.rows[0];

    // Check access permissions
    if (req.user.base_id !== request.base_id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied' 
      });
    }

    res.json({
      success: true,
      data: request
    });

  } catch (error) {
    console.error('Error fetching fuel card request:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Update fuel card request status
router.patch('/fuel-cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, observacoes_admin } = req.body;

    // Only admin or gestor_combustivel can update status
    if (!['admin', 'gestor_combustivel'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
      });
    }

    const updateResult = await pool.query(
      `UPDATE fuel_card_requests 
       SET status = $1, observacoes_admin = $2, updated_at = CURRENT_TIMESTAMP, updated_by = $3
       WHERE id = $4
       RETURNING *`,
      [status, observacoes_admin, req.user.id, id]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Fuel card request not found' 
      });
    }

    // Log the action
    await pool.query(
      `INSERT INTO audit_logs (table_name, action, user_id, record_id, details, created_at)
       VALUES ('fuel_card_requests', 'UPDATE', $1, $2, $3, CURRENT_TIMESTAMP)`,
      [req.user.id, id, JSON.stringify({ status, observacoes_admin })]
    );

    res.json({
      success: true,
      message: 'Fuel card request updated successfully',
      data: updateResult.rows[0]
    });

  } catch (error) {
    console.error('Error updating fuel card request:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get fuel card statistics for a base
router.get('/bases/:baseId/fuel-cards/stats', async (req, res) => {
  try {
    const { baseId } = req.params;
    const { period = '30' } = req.query; // days

    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pending_requests,
        COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as approved_requests,
        COUNT(CASE WHEN status = 'rejeitado' THEN 1 END) as rejected_requests,
        COALESCE(SUM(CASE WHEN status = 'aprovado' THEN valor_solicitado ELSE 0 END), 0) as approved_amount,
        COALESCE(AVG(CASE WHEN status = 'aprovado' THEN valor_solicitado END), 0) as avg_approved_amount
      FROM fuel_card_requests 
      WHERE base_id = $1 
        AND created_at >= CURRENT_DATE - INTERVAL '${period} days'
    `, [baseId]);

    // Get trend data (last 7 days)
    const trendResult = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as requests_count,
        COALESCE(SUM(valor_solicitado), 0) as total_amount
      FROM fuel_card_requests 
      WHERE base_id = $1 
        AND created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [baseId]);

    res.json({
      success: true,
      data: {
        summary: statsResult.rows[0],
        trend: trendResult.rows
      }
    });

  } catch (error) {
    console.error('Error fetching fuel card stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

module.exports = router;