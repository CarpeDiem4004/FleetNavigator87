// Simple API endpoint for drivers that bypasses middleware conflicts
const { pool } = require('./database.js');

async function handleDriversRequest(req, res) {
  try {
    console.log('Simple Drivers API - Processing request');
    
    // Set JSON headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    const query = `
      SELECT 
        m.id,
        m.nome,
        m.cpf,
        m.telefone,
        m.base_id,
        m.created_at,
        b.name as base_nome
      FROM motoristas m
      LEFT JOIN bases b ON m.base_id = b.id
      ORDER BY m.created_at DESC
    `;
    
    const result = await pool.query(query);
    console.log('Simple Drivers API - Found', result.rows.length, 'drivers');
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Simple Drivers API - Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching drivers',
      error: error.message
    });
  }
}

module.exports = { handleDriversRequest };