import express from 'express';
import { pool } from '../db';
import { isAuthenticated } from '../middleware/auth';

const router = express.Router();

// Listar todos os cartões de combustível
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const query = `
      SELECT 
        fc.*,
        p.name as project_name,
        b.name as base_name,
        u.name as creator_name
      FROM fuel_cards fc
      LEFT JOIN projects p ON fc.project_id = p.id
      LEFT JOIN bases b ON fc.base_id = b.id
      LEFT JOIN users u ON fc.created_by = u.id
      ORDER BY fc.created_at DESC
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar cartões de combustível:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar cartão específico
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        fc.*,
        p.name as project_name,
        b.name as base_name,
        u.name as creator_name
      FROM fuel_cards fc
      LEFT JOIN projects p ON fc.project_id = p.id
      LEFT JOIN bases b ON fc.base_id = b.id
      LEFT JOIN users u ON fc.created_by = u.id
      WHERE fc.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar cartão de combustível:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar novo cartão
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const {
      card_number,
      card_type,
      provider,
      vehicle_plate,
      project_id,
      base_id,
      status,
      current_balance,
      monthly_limit,
      notes
    } = req.body;

    const user = req.user;
    
    // Validações básicas
    if (!card_number || !card_type || !provider) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }
    
    if (card_type === 'vinculado' && !vehicle_plate) {
      return res.status(400).json({ error: 'Placa do veículo é obrigatória para cartões vinculados' });
    }

    // Verificar se o número do cartão já existe
    const existingCard = await pool.query(
      'SELECT id FROM fuel_cards WHERE card_number = $1',
      [card_number]
    );
    
    if (existingCard.rows.length > 0) {
      return res.status(400).json({ error: 'Número do cartão já existe' });
    }

    // Inserir novo cartão
    const insertQuery = `
      INSERT INTO fuel_cards (
        card_number, card_type, provider, vehicle_plate, project_id, base_id,
        status, current_balance, monthly_limit, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const values = [
      card_number,
      card_type,
      provider,
      vehicle_plate || null,
      project_id || null,
      base_id || null,
      status || 'ativo',
      current_balance || '0.00',
      monthly_limit || null,
      notes || null,
      user.id
    ];
    
    const result = await pool.query(insertQuery, values);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar cartão de combustível:', error);
    if (error.code === '23505') { // Violação de chave única
      res.status(400).json({ error: 'Número do cartão já existe' });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

// Atualizar cartão existente
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      card_number,
      card_type,
      provider,
      vehicle_plate,
      project_id,
      base_id,
      status,
      current_balance,
      monthly_limit,
      notes
    } = req.body;

    // Validações básicas
    if (!card_number || !card_type || !provider) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }
    
    if (card_type === 'vinculado' && !vehicle_plate) {
      return res.status(400).json({ error: 'Placa do veículo é obrigatória para cartões vinculados' });
    }

    // Verificar se o cartão existe
    const existingCard = await pool.query(
      'SELECT id FROM fuel_cards WHERE id = $1',
      [id]
    );
    
    if (existingCard.rows.length === 0) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    // Verificar se o número do cartão já existe em outro registro
    const duplicateCard = await pool.query(
      'SELECT id FROM fuel_cards WHERE card_number = $1 AND id != $2',
      [card_number, id]
    );
    
    if (duplicateCard.rows.length > 0) {
      return res.status(400).json({ error: 'Número do cartão já existe' });
    }

    // Atualizar cartão
    const updateQuery = `
      UPDATE fuel_cards SET
        card_number = $1,
        card_type = $2,
        provider = $3,
        vehicle_plate = $4,
        project_id = $5,
        base_id = $6,
        status = $7,
        current_balance = $8,
        monthly_limit = $9,
        notes = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `;
    
    const values = [
      card_number,
      card_type,
      provider,
      vehicle_plate || null,
      project_id || null,
      base_id || null,
      status || 'ativo',
      current_balance || '0.00',
      monthly_limit || null,
      notes || null,
      id
    ];
    
    const result = await pool.query(updateQuery, values);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar cartão de combustível:', error);
    if (error.code === '23505') { // Violação de chave única
      res.status(400).json({ error: 'Número do cartão já existe' });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

// Excluir cartão
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o cartão existe
    const existingCard = await pool.query(
      'SELECT id FROM fuel_cards WHERE id = $1',
      [id]
    );
    
    if (existingCard.rows.length === 0) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    // Excluir cartão
    await pool.query('DELETE FROM fuel_cards WHERE id = $1', [id]);
    
    res.json({ message: 'Cartão excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir cartão de combustível:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar cartões por projeto
router.get('/project/:projectId', isAuthenticated, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const query = `
      SELECT 
        fc.*,
        p.name as project_name,
        b.name as base_name,
        u.name as creator_name
      FROM fuel_cards fc
      LEFT JOIN projects p ON fc.project_id = p.id
      LEFT JOIN bases b ON fc.base_id = b.id
      LEFT JOIN users u ON fc.created_by = u.id
      WHERE fc.project_id = $1
      ORDER BY fc.created_at DESC
    `;
    
    const result = await pool.query(query, [projectId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar cartões por projeto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar cartões por base
router.get('/base/:baseId', isAuthenticated, async (req, res) => {
  try {
    const { baseId } = req.params;
    
    const query = `
      SELECT 
        fc.*,
        p.name as project_name,
        b.name as base_name,
        u.name as creator_name
      FROM fuel_cards fc
      LEFT JOIN projects p ON fc.project_id = p.id
      LEFT JOIN bases b ON fc.base_id = b.id
      LEFT JOIN users u ON fc.created_by = u.id
      WHERE fc.base_id = $1
      ORDER BY fc.created_at DESC
    `;
    
    const result = await pool.query(query, [baseId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar cartões por base:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar cartões por placa
router.get('/vehicle/:plate', isAuthenticated, async (req, res) => {
  try {
    const { plate } = req.params;
    
    const query = `
      SELECT 
        fc.*,
        p.name as project_name,
        b.name as base_name,
        u.name as creator_name
      FROM fuel_cards fc
      LEFT JOIN projects p ON fc.project_id = p.id
      LEFT JOIN bases b ON fc.base_id = b.id
      LEFT JOIN users u ON fc.created_by = u.id
      WHERE UPPER(fc.vehicle_plate) = UPPER($1)
      ORDER BY fc.created_at DESC
    `;
    
    const result = await pool.query(query, [plate]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar cartões por placa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;