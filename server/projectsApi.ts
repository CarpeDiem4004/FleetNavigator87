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
    
    console.log(`[DEBUG] getProjects - Query executada: ${query}`);
    console.log(`[DEBUG] getProjects - Resultados encontrados: ${result.rows.length}`);
    console.log(`[DEBUG] getProjects - Projetos ativos:`, result.rows.map(p => `${p.id}: ${p.name} (${p.is_active})`));
    
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
  const isMobileRequest = req.get('X-Mobile-Request') === 'true';
  const origin = req.get('Origin') || 'Sem origem';
  const referer = req.get('Referer') || 'Sem referer';
  
  console.log(`[PROJECTS-API] 🚀 REQUISIÇÃO RECEBIDA - getProjectsWithBases`);
  console.log(`[PROJECTS-API] 📱 Device: ${isMobile ? 'MOBILE' : 'DESKTOP'} (Header: ${isMobileRequest})`);
  console.log(`[PROJECTS-API] 🌐 User-Agent: ${userAgent}`);
  console.log(`[PROJECTS-API] 📡 Origin: ${origin}`);
  console.log(`[PROJECTS-API] 🔗 Referer: ${referer}`);
  console.log(`[PROJECTS-API] 🔒 Todos os Headers:`, req.headers);
  console.log(`[PROJECTS-API] 🎯 URL completa: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
  console.log(`[PROJECTS-API] 📊 Método: ${req.method}`);
  console.log(`[PROJECTS-API] 🔑 Session ID: ${(req as any).sessionID || 'Não definido'}`);
  console.log(`[PROJECTS-API] 👤 Usuário: ${(req as any).user?.id || 'Não autenticado'}`);
  
  // Log específico para detecção de problemas mobile
  if (isMobile || isMobileRequest) {
    console.log(`[MOBILE-API-DEBUG] 📱 PROCESSANDO REQUISIÇÃO MOBILE`);
    console.log(`[MOBILE-API-DEBUG] 🔍 Headers críticos:`, {
      accept: req.get('Accept'),
      contentType: req.get('Content-Type'),
      authorization: req.get('Authorization') ? 'Presente' : 'Ausente',
      cookie: req.get('Cookie') ? 'Presente' : 'Ausente',
      xMobileRequest: req.get('X-Mobile-Request')
    });
  }
  
  try {
    // Headers específicos para mobile com CORS melhorado
    if (isMobile || isMobileRequest) {
      const allowedOrigins = [
        'https://38c24b99-832f-4a3d-ad77-ec177e172dd1-00-1ruweyufd75y7.picard.replit.dev',
        'https://muricionfleet-joaopaulo60.replit.app',
        req.get('Origin')
      ].filter(Boolean);
      
      res.set('Access-Control-Allow-Origin', allowedOrigins[0] || '*');
      res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Mobile-Request, Cookie');
      res.set('Access-Control-Allow-Credentials', 'true');
      res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
      res.set('Vary', 'User-Agent, X-Mobile-Request, Origin');
      
      console.log(`[PROJECTS-API] 📱 Headers CORS configurados para mobile`);
      console.log(`[PROJECTS-API] 🌐 Origin permitida: ${allowedOrigins[0] || '*'}`);
    }
    
    // Medir tempo de conexão com banco
    const dbStart = Date.now();
    console.log(`[PROJECTS-API] 🗄️ Iniciando consultas paralelas ao banco...`);
    
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
    console.log(`[PROJECTS-API] ⏱️ Consultas DB: ${dbTime}ms`);
    console.log(`[PROJECTS-API] 📊 Projetos encontrados: ${projectsResult.rows.length}`);
    console.log(`[PROJECTS-API] 📊 Bases encontradas: ${basesResult.rows.length}`);
    
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
    
    // Aplicar compressão específica para mobile
    if (isMobile) {
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutos cache para mobile
      res.set('Vary', 'User-Agent');
      res.set('Content-Encoding', 'gzip');
    }
    
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