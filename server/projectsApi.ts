import type { Request, Response } from "express";
import pkg from 'pg';
const { Pool } = pkg;

// Configuração do pool PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Obtém todos os projetos ativos
 */
export async function getProjects(req: Request, res: Response) {
  try {
    const query = `
      SELECT 
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at
      FROM projects 
      WHERE is_active = true 
      ORDER BY name ASC
    `;
    
    const result = await pool.query(query);
    
    return res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Erro ao buscar projetos:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar projetos',
      error: error.message
    });
  }
}

/**
 * Obtém todas as bases de um projeto específico
 */
export async function getProjectBases(req: Request, res: Response) {
  try {
    const { projectId } = req.params;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'ID do projeto é obrigatório'
      });
    }
    
    const query = `
      SELECT 
        pb.id,
        pb.project_id,
        pb.base_name,
        pb.base_code,
        pb.description,
        pb.is_active,
        pb.created_at,
        pb.updated_at,
        p.name as project_name
      FROM project_bases pb
      INNER JOIN projects p ON pb.project_id = p.id
      WHERE pb.project_id = $1 AND pb.is_active = true
      ORDER BY pb.base_name ASC
    `;
    
    const result = await pool.query(query, [projectId]);
    
    return res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      project_id: projectId
    });
  } catch (error: any) {
    console.error('Erro ao buscar bases do projeto:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar bases do projeto',
      error: error.message
    });
  }
}

/**
 * Obtém todos os projetos com suas bases
 */
export async function getProjectsWithBases(req: Request, res: Response) {
  try {
    const query = `
      SELECT 
        p.id as project_id,
        p.name as project_name,
        p.description as project_description,
        p.is_active as project_active,
        pb.id as base_id,
        pb.base_name,
        pb.base_code,
        pb.description as base_description,
        pb.is_active as base_active
      FROM projects p
      LEFT JOIN project_bases pb ON p.id = pb.project_id
      WHERE p.is_active = true AND (pb.is_active = true OR pb.id IS NULL)
      ORDER BY p.name ASC, pb.base_name ASC
    `;
    
    const result = await pool.query(query);
    
    // Agrupar dados por projeto
    const projectsMap = new Map();
    
    result.rows.forEach(row => {
      const projectId = row.project_id;
      
      if (!projectsMap.has(projectId)) {
        projectsMap.set(projectId, {
          id: row.project_id,
          name: row.project_name,
          description: row.project_description,
          is_active: row.project_active,
          bases: []
        });
      }
      
      // Adicionar base se existir
      if (row.base_id) {
        projectsMap.get(projectId).bases.push({
          id: row.base_id,
          base_name: row.base_name,
          base_code: row.base_code,
          description: row.base_description,
          is_active: row.base_active
        });
      }
    });
    
    const projects = Array.from(projectsMap.values());
    
    return res.status(200).json({
      success: true,
      data: projects,
      count: projects.length
    });
  } catch (error: any) {
    console.error('Erro ao buscar projetos com bases:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar projetos com bases',
      error: error.message
    });
  }
}

/**
 * Cria um novo projeto
 */
export async function createProject(req: Request, res: Response) {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nome do projeto é obrigatório'
      });
    }
    
    const query = `
      INSERT INTO projects (name, description) 
      VALUES ($1, $2) 
      RETURNING *
    `;
    
    const result = await pool.query(query, [name, description || null]);
    
    return res.status(201).json({
      success: true,
      message: 'Projeto criado com sucesso',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Erro ao criar projeto:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar projeto',
      error: error.message
    });
  }
}

/**
 * Cria uma nova base para um projeto
 */
export async function createProjectBase(req: Request, res: Response) {
  try {
    const { projectId } = req.params;
    const { base_name, base_code, description } = req.body;
    
    if (!projectId || !base_name) {
      return res.status(400).json({
        success: false,
        message: 'ID do projeto e nome da base são obrigatórios'
      });
    }
    
    const query = `
      INSERT INTO project_bases (project_id, base_name, base_code, description) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      projectId, 
      base_name, 
      base_code || null, 
      description || null
    ]);
    
    return res.status(201).json({
      success: true,
      message: 'Base criada com sucesso',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Erro ao criar base:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar base',
      error: error.message
    });
  }
}