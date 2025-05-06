/**
 * API para gerenciamento de checklists de motoristas
 * Integra com a tabela driver_checklists do banco de dados
 */

import { pool } from './db.js';

// Função para obter todos os checklists
export async function getDriverChecklists(req, res) {
  try {
    // Forçar o Content-Type como application/json para evitar interceptação do Vite
    res.setHeader('Content-Type', 'application/json');
    
    const filters = [];
    const params = [];
    
    // Adicionar filtros opcionais
    if (req.query.driver_name) {
      params.push(req.query.driver_name);
      filters.push(`driver_name ILIKE '%' || $${params.length} || '%'`);
    }
    
    if (req.query.vehicle_plate) {
      params.push(req.query.vehicle_plate);
      filters.push(`vehicle_plate ILIKE '%' || $${params.length} || '%'`);
    }
    
    if (req.query.status) {
      params.push(req.query.status);
      filters.push(`status = $${params.length}`);
    }
    
    if (req.query.driver_type) {
      params.push(req.query.driver_type);
      filters.push(`driver_type = $${params.length}`);
    }
    
    if (req.query.source) {
      params.push(req.query.source);
      filters.push(`source = $${params.length}`);
    }

    // Adicionar filtro para viagem_id
    if (req.query.viagem_id) {
      params.push(req.query.viagem_id);
      filters.push(`viagem_id = $${params.length}`);
    }
    
    // Adicionar filtro para posto (source)
    if (req.query.posto) {
      params.push(req.query.posto);
      filters.push(`source ILIKE '%' || $${params.length} || '%'`);
    }
    
    // Montar a query com os filtros
    let query = `SELECT * FROM driver_checklists`;
    
    if (filters.length > 0) {
      query += ` WHERE ${filters.join(' AND ')}`;
    }
    
    // Adicionar ordenação e limite
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(req.query.limit || 50);
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
      filters: {
        driver_name: req.query.driver_name,
        vehicle_plate: req.query.vehicle_plate,
        status: req.query.status,
        driver_type: req.query.driver_type,
        source: req.query.source,
        posto: req.query.posto,
        viagem_id: req.query.viagem_id
      }
    });
  } catch (error) {
    console.error(`Erro ao buscar checklists:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Erro ao buscar checklists: ${error.message}` 
    });
  }
}

// Função para obter um checklist específico
export async function getDriverChecklistById(req, res) {
  try {
    // Forçar o Content-Type como application/json para evitar interceptação do Vite
    res.setHeader('Content-Type', 'application/json');
    
    const checklistId = req.params.id;
    
    if (!checklistId) {
      return res.status(400).json({
        success: false,
        error: 'ID do checklist não fornecido'
      });
    }
    
    const query = `SELECT * FROM driver_checklists WHERE id = $1`;
    const result = await pool.query(query, [checklistId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: `Checklist com ID ${checklistId} não encontrado`
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error(`Erro ao buscar checklist por ID:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Erro ao buscar checklist: ${error.message}` 
    });
  }
}

// Função para criar um novo checklist
export async function createDriverChecklist(req, res) {
  try {
    // Forçar o Content-Type como application/json para evitar interceptação do Vite
    res.setHeader('Content-Type', 'application/json');
    
    // Validar dados de entrada
    const requiredFields = ['driver_name', 'vehicle_plate'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          error: `Campo obrigatório não fornecido: ${field}`
        });
      }
    }
    
    // Preparar campos e valores
    const fields = [];
    const placeholders = [];
    const values = [];
    
    Object.entries(req.body).forEach(([key, value], index) => {
      if (value !== undefined && value !== null) {
        fields.push(key);
        placeholders.push(`$${index + 1}`);
        values.push(value);
      }
    });
    
    // Adicionar campo de status se não foi fornecido
    if (!req.body.status) {
      fields.push('status');
      placeholders.push(`$${values.length + 1}`);
      values.push('ativo');
    }
    
    // Adicionar campo source se não foi fornecido
    if (!req.body.source) {
      fields.push('source');
      placeholders.push(`$${values.length + 1}`);
      values.push(req.body.posto || 'api');
    }
    
    // Adicionar timestamps
    fields.push('created_at');
    placeholders.push(`$${values.length + 1}`);
    values.push(new Date());
    
    fields.push('updated_at');
    placeholders.push(`$${values.length + 1}`);
    values.push(new Date());
    
    // Montar a query
    const query = `
      INSERT INTO driver_checklists (${fields.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Checklist criado com sucesso'
    });
  } catch (error) {
    console.error(`Erro ao criar checklist:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Erro ao criar checklist: ${error.message}` 
    });
  }
}

// Função para atualizar um checklist
export async function updateDriverChecklist(req, res) {
  try {
    // Forçar o Content-Type como application/json para evitar interceptação do Vite
    res.setHeader('Content-Type', 'application/json');
    
    const checklistId = req.params.id;
    
    if (!checklistId) {
      return res.status(400).json({
        success: false,
        error: 'ID do checklist não fornecido'
      });
    }
    
    // Verificar se o checklist existe
    const checkQuery = `SELECT id FROM driver_checklists WHERE id = $1`;
    const checkResult = await pool.query(checkQuery, [checklistId]);
    
    if (checkResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: `Checklist com ID ${checklistId} não encontrado`
      });
    }
    
    // Preparar campos e valores para atualização
    const updates = [];
    const values = [];
    
    Object.entries(req.body).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        updates.push(`${key} = $${updates.length + 1}`);
        values.push(value);
      }
    });
    
    // Adicionar campo de atualização de timestamp
    updates.push(`updated_at = $${updates.length + 1}`);
    values.push(new Date());
    
    // Adicionar ID como último parâmetro
    values.push(checklistId);
    
    // Montar a query
    const query = `
      UPDATE driver_checklists
      SET ${updates.join(', ')}
      WHERE id = $${values.length}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Checklist atualizado com sucesso'
    });
  } catch (error) {
    console.error(`Erro ao atualizar checklist:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Erro ao atualizar checklist: ${error.message}` 
    });
  }
}

// Função para excluir um checklist
export async function deleteDriverChecklist(req, res) {
  try {
    // Forçar o Content-Type como application/json para evitar interceptação do Vite
    res.setHeader('Content-Type', 'application/json');
    
    const checklistId = req.params.id;
    
    if (!checklistId) {
      return res.status(400).json({
        success: false,
        error: 'ID do checklist não fornecido'
      });
    }
    
    // Verificar se o checklist existe
    const checkQuery = `SELECT id FROM driver_checklists WHERE id = $1`;
    const checkResult = await pool.query(checkQuery, [checklistId]);
    
    if (checkResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: `Checklist com ID ${checklistId} não encontrado`
      });
    }
    
    // Executar a exclusão
    const query = `DELETE FROM driver_checklists WHERE id = $1 RETURNING id`;
    const result = await pool.query(query, [checklistId]);
    
    res.json({
      success: true,
      data: { id: result.rows[0].id },
      message: 'Checklist excluído com sucesso'
    });
  } catch (error) {
    console.error(`Erro ao excluir checklist:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Erro ao excluir checklist: ${error.message}` 
    });
  }
}

// Função para obter checklists por posto
export async function getDriverChecklistsByPosto(req, res) {
  try {
    // Forçar o Content-Type como application/json para evitar interceptação do Vite
    res.setHeader('Content-Type', 'application/json');
    
    const postoName = req.params.posto;
    
    if (!postoName) {
      return res.status(400).json({
        success: false,
        error: 'Nome do posto não fornecido'
      });
    }
    
    // Buscar checklists associados ao posto (via campo source)
    const query = `
      SELECT * FROM driver_checklists 
      WHERE source ILIKE $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [`%${postoName}%`, req.query.limit || 50]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
      posto: postoName
    });
  } catch (error) {
    console.error(`Erro ao buscar checklists por posto:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Erro ao buscar checklists: ${error.message}` 
    });
  }
}