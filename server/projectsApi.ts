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
 * Obtém todos os projetos com suas bases (otimizado com diagnóstico de performance)
 */
export async function getProjectsWithBases(req: Request, res: Response) {
  const startTime = Date.now();
  const userAgent = req.get('User-Agent') || 'Desconhecido';
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
  
  console.log(`[BACKEND-PERF] 🚀 Iniciando getProjectsWithBases`);
  console.log(`[BACKEND-PERF] 📱 Device: ${isMobile ? 'MOBILE' : 'DESKTOP'}`);
  console.log(`[BACKEND-PERF] 🌐 User-Agent: ${userAgent}`);
  console.log(`[BACKEND-PERF] 📡 Origin: ${req.get('Origin') || 'Sem origem'}`);
  console.log(`[BACKEND-PERF] 🔗 Referer: ${req.get('Referer') || 'Sem referer'}`);
  
  try {
    // Medir tempo de conexão com banco
    const dbStart = Date.now();
    console.log(`[BACKEND-PERF] 🗄️ Iniciando consultas paralelas ao banco...`);
    
    const [projectsResult, basesResult] = await Promise.all([
      pool.query(`
        SELECT id, name, description, is_active 
        FROM projects 
        WHERE is_active = true 
        ORDER BY name ASC
        LIMIT 50
      `),
      pool.query(`
        SELECT pb.id, pb.project_id, pb.base_name, pb.base_code, pb.description, pb.is_active
        FROM project_bases pb
        INNER JOIN projects p ON pb.project_id = p.id
        WHERE pb.is_active = true AND p.is_active = true
        ORDER BY pb.base_name ASC
      `)
    ]);
    
    const dbTime = Date.now() - dbStart;
    console.log(`[BACKEND-PERF] ⏱️ Consultas DB: ${dbTime}ms`);
    console.log(`[BACKEND-PERF] 📊 Projetos encontrados: ${projectsResult.rows.length}`);
    console.log(`[BACKEND-PERF] 📊 Bases encontradas: ${basesResult.rows.length}`);
    
    // Medir tempo de processamento em memória
    const processStart = Date.now();
    
    // Criar mapa de bases por projeto_id para performance O(1)
    const basesMap = new Map();
    basesResult.rows.forEach(base => {
      if (!basesMap.has(base.project_id)) {
        basesMap.set(base.project_id, []);
      }
      basesMap.get(base.project_id).push({
        id: base.id,
        base_name: base.base_name,
        base_code: base.base_code,
        description: base.description,
        is_active: base.is_active
      });
    });
    
    // Combinar projetos com suas bases
    const projects = projectsResult.rows.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      is_active: project.is_active,
      bases: basesMap.get(project.id) || []
    }));
    
    const processTime = Date.now() - processStart;
    const totalTime = Date.now() - startTime;
    
    console.log(`[BACKEND-PERF] 🔄 Processamento: ${processTime}ms`);
    console.log(`[BACKEND-PERF] 🏁 TOTAL BACKEND: ${totalTime}ms`);
    
    // Alertas de performance
    if (totalTime > 1000) {
      console.warn(`[BACKEND-PERF] ⚠️ LENTO! ${totalTime}ms > 1000ms`);
      if (dbTime > 800) {
        console.warn(`[BACKEND-PERF] 🐌 PROBLEMA DE BANCO: ${dbTime}ms`);
      }
      if (processTime > 200) {
        console.warn(`[BACKEND-PERF] 🐌 PROBLEMA DE PROCESSAMENTO: ${processTime}ms`);
      }
    }
    
    // Calcular tamanho da resposta
    const responseData = {
      success: true,
      data: projects,
      count: projects.length,
      _performance: {
        totalTime,
        dbTime,
        processTime,
        isMobile,
        timestamp: new Date().toISOString()
      }
    };
    
    const responseSize = JSON.stringify(responseData).length;
    console.log(`[BACKEND-PERF] 📦 Tamanho resposta: ${responseSize} bytes (${(responseSize/1024).toFixed(2)} KB)`);
    
    return res.status(200).json(responseData);
  } catch (error: any) {
    const errorTime = Date.now() - startTime;
    console.error(`[BACKEND-PERF] 💥 ERRO após ${errorTime}ms:`, error.message);
    console.error(`[BACKEND-PERF] 📚 Stack:`, error.stack);
    
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar projetos com bases',
      error: error.message,
      _performance: {
        errorTime,
        isMobile,
        timestamp: new Date().toISOString()
      }
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