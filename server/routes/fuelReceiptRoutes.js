import express from 'express';
import { Pool } from 'pg';

const router = express.Router();

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

// GET all fuel data including specific station tables (for Histórico Geral and Route Conference)
router.get('/', async (req, res) => {
  try {
    const { date, limit = 100, offset = 0 } = req.query;
    
    // Tables to query for fuel data
    const fuelTables = [
      'abastecimentos_postos',
      'fuel_card_requests', 
      'solicitacoes_fuel_card',
      'abastecimentos_supabase',
      'abastecimentos_posto_sorocaba_v2',
      'abastecimentos_posto_abc_v2',
      'abastecimentos_posto_osasco_v2',
      'abastecimentos_posto_campinas_v2',
      'abastecimentos_posto_guarulhos_v2'
    ];

    let allFuelData = [];
    let totalRecords = 0;

    // Query each table
    for (const table of fuelTables) {
      try {
        let query = '';
        let dateColumn = '';
        let plateColumn = '';
        let driverColumn = '';
        let projectColumn = '';

        // Set column mappings for each table
        switch (table) {
          case 'abastecimentos_postos':
            dateColumn = 'created_at';
            plateColumn = 'placa';
            driverColumn = 'nome_motorista';
            projectColumn = 'projeto';
            break;
          case 'fuel_card_requests':
            dateColumn = 'created_at';
            plateColumn = 'plate';
            driverColumn = 'driver_name';
            projectColumn = 'project_name';
            break;
          case 'solicitacoes_fuel_card':
            dateColumn = 'data_solicitacao';
            plateColumn = 'placa';
            driverColumn = 'motorista';
            projectColumn = 'base';
            break;
          case 'abastecimentos_supabase':
          case 'abastecimentos_posto_sorocaba_v2':
          case 'abastecimentos_posto_abc_v2':
          case 'abastecimentos_posto_osasco_v2':
          case 'abastecimentos_posto_campinas_v2':
          case 'abastecimentos_posto_guarulhos_v2':
            dateColumn = 'created_at';
            plateColumn = 'placa';
            driverColumn = 'motorista';
            projectColumn = 'projeto';
            break;
        }

        // Build query with date filter if provided
        query = `
          SELECT 
            ${dateColumn} as data,
            ${plateColumn} as placa,
            ${driverColumn} as motorista,
            ${projectColumn} as projeto,
            '${table}' as fonte
          FROM ${table}
        `;

        if (date) {
          query += ` WHERE DATE(${dateColumn}) = $1`;
          const result = await pool.query(query, [date]);
          
          const mappedData = result.rows.map(row => ({
            ...row,
            placa: row.placa?.toUpperCase() || '',
            tipo: table.includes('posto_') ? 'posto_especifico' : 
                  table === 'fuel_card_requests' ? 'solicitacao_cartao' :
                  table === 'solicitacoes_fuel_card' ? 'solicitacao_fuel_card' :
                  table === 'abastecimentos_supabase' ? 'historico_geral' : 'abastecimento'
          }));
          
          allFuelData = allFuelData.concat(mappedData);
          totalRecords += mappedData.length;
        } else {
          query += ` ORDER BY ${dateColumn} DESC LIMIT $1 OFFSET $2`;
          const result = await pool.query(query, [limit, offset]);
          
          const mappedData = result.rows.map(row => ({
            ...row,
            placa: row.placa?.toUpperCase() || '',
            tipo: table.includes('posto_') ? 'posto_especifico' : 
                  table === 'fuel_card_requests' ? 'solicitacao_cartao' :
                  table === 'solicitacoes_fuel_card' ? 'solicitacao_fuel_card' :
                  table === 'abastecimentos_supabase' ? 'historico_geral' : 'abastecimento'
          }));
          
          allFuelData = allFuelData.concat(mappedData);
          totalRecords += mappedData.length;
        }
      } catch (error) {
        console.error(`Error querying ${table}:`, error.message);
        // Continue with other tables even if one fails
      }
    }

    // Sort by date descending
    allFuelData.sort((a, b) => new Date(b.data) - new Date(a.data));

    // Apply pagination if no date filter
    if (!date) {
      const start = parseInt(offset);
      const end = start + parseInt(limit);
      allFuelData = allFuelData.slice(start, end);
    }

    res.json({
      data: allFuelData,
      total: totalRecords,
      pagination: {
        total: totalRecords,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalRecords
      }
    });
  } catch (error) {
    console.error('Error fetching fuel data:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

export default router;