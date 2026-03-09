/**
 * Rotas para gerenciar projetos padronizados
 * Implementa as operações para listar e gerenciar projetos
 */

import express from 'express';
import { Pool } from 'pg';
import { unifiedAuthMiddleware, requireRoles } from "../utils/auth-utils.js";

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware para garantir que estas rotas sejam tratadas como API e não como HTML
router.use((req, res, next) => {
  // Definir cabeçalhos para evitar que o Vite intercepte a resposta
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

/**
 * Rota para obter todos os projetos
 * GET /api/projetos
 * Requer autenticação através do middleware unificado
 */
router.get('/projetos', unifiedAuthMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT id, nome, ativo, ordem
      FROM projetos
      ORDER BY ordem ASC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error: any) {
    console.error('Erro ao buscar projetos:', error);
    res.status(500).json({
      success: false,
      error: `Erro ao buscar projetos: ${error.message || 'Erro desconhecido'}`
    });
  }
});

/**
 * Rota para obter um projeto específico
 * GET /api/projetos/:id
 * Requer autenticação através do middleware unificado
 */
router.get('/projetos/:id', unifiedAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT id, nome, ativo, ordem
      FROM projetos
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error(`Erro ao buscar projeto ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: `Erro ao buscar projeto: ${error.message || 'Erro desconhecido'}`
    });
  }
});

/**
 * Rota para criar um novo projeto
 * POST /api/projetos
 * Requer autenticação e permissão de admin ou gestor via middleware unificado
 */
router.post('/projetos', unifiedAuthMiddleware, requireRoles(['admin', 'gestor']), async (req, res) => {
  try {
    const { nome, ativo = true } = req.body;
    
    if (!nome) {
      return res.status(400).json({
        success: false,
        error: 'Nome do projeto é obrigatório'
      });
    }
    
    // Obter a maior ordem existente
    const maxOrdemQuery = `SELECT COALESCE(MAX(ordem), 0) as max_ordem FROM projetos`;
    const maxOrdemResult = await pool.query(maxOrdemQuery);
    const novaOrdem = maxOrdemResult.rows[0].max_ordem + 1;
    
    const insertQuery = `
      INSERT INTO projetos (nome, ativo, ordem, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [nome, ativo, novaOrdem]);
    
    res.status(201).json({
      success: true,
      message: 'Projeto criado com sucesso',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Erro ao criar projeto:', error);
    res.status(500).json({
      success: false,
      error: `Erro ao criar projeto: ${error.message || 'Erro desconhecido'}`
    });
  }
});

/**
 * Rota para atualizar um projeto existente
 * PUT /api/projetos/:id
 * Requer autenticação e permissão de admin ou gestor via middleware unificado
 */
router.put('/projetos/:id', unifiedAuthMiddleware, requireRoles(['admin', 'gestor']), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, ativo, ordem } = req.body;
    
    if (!nome) {
      return res.status(400).json({
        success: false,
        error: 'Nome do projeto é obrigatório'
      });
    }
    
    const updateQuery = `
      UPDATE projetos
      SET nome = $1, ativo = $2, ordem = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [nome, ativo, ordem, id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Projeto atualizado com sucesso',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error(`Erro ao atualizar projeto ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: `Erro ao atualizar projeto: ${error.message || 'Erro desconhecido'}`
    });
  }
});

// Exportar o roteador
export default router;