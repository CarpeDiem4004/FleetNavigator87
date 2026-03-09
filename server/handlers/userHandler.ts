import { pool } from "../db"; // conexão com PostgreSQL
import { Request, Response } from "express";

/**
 * Handler para consulta de usuários no banco de dados
 * Permite diferentes tipos de consultas com base nos parâmetros
 */
export async function consultarUsuarios(req: Request, res: Response) {
  try {
    // Parâmetros opcionais
    const { role, baseId, active } = req.query;
    let query = 'SELECT id, name, email, role, basename, base_id, oficina_id, is_active FROM users';
    const params: any[] = [];
    const conditions: string[] = [];
    
    // Adicionar filtros conforme os parâmetros recebidos
    if (role) {
      conditions.push('role = $' + (params.length + 1));
      params.push(role);
    }
    
    if (baseId) {
      conditions.push('base_id = $' + (params.length + 1));
      params.push(baseId);
    }
    
    if (active !== undefined) {
      conditions.push('is_active = $' + (params.length + 1));
      params.push(active === 'true');
    }
    
    // Adicionar os filtros à query
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Ordenar por nome
    query += ' ORDER BY name';
    
    // Executar a consulta
    const result = await pool.query(query, params);
    
    // Formatar e retornar os dados
    return res.status(200).json({
      success: true,
      count: result.rowCount,
      usuarios: result.rows
    });
  } catch (error: any) {
    console.error('Erro ao consultar usuários:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro ao consultar usuários',
      message: error.message 
    });
  }
}

/**
 * Handler para buscar um usuário específico pelo ID
 */
export async function consultarUsuarioPorId(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Verificar se o ID foi fornecido
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID do usuário não fornecido' 
      });
    }
    
    // Consultar usuário por ID
    const query = 'SELECT id, name, email, role, basename, base_id, oficina_id, is_active FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    // Verificar se encontrou o usuário
    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      });
    }
    
    // Retornar o usuário
    return res.status(200).json({
      success: true,
      usuario: result.rows[0]
    });
  } catch (error: any) {
    console.error('Erro ao consultar usuário por ID:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro ao consultar usuário',
      message: error.message 
    });
  }
}