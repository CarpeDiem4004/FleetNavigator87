import { Request, Response } from 'express';
import { pool } from '../db';
import { insertWorkSafetyDriverSchema } from '@shared/schema';
import { z } from 'zod';

function formatCPF(cpf: string): string {
  const numbers = cpf.replace(/\D/g, '');
  if (numbers.length !== 11) return cpf;
  return `${numbers.slice(0,3)}.${numbers.slice(3,6)}.${numbers.slice(6,9)}-${numbers.slice(9)}`;
}

function validateCPF(cpf: string): boolean {
  const numbers = cpf.replace(/\D/g, '');
  if (numbers.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numbers)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers.charAt(10))) return false;
  
  return true;
}

export async function createWorkSafetyDriver(req: Request, res: Response) {
  try {
    const data = req.body;
    
    if (!validateCPF(data.cpf)) {
      return res.status(400).json({ 
        success: false, 
        message: 'CPF inválido. Verifique os dígitos informados.' 
      });
    }
    
    if (data.pgrAprovado === false) {
      return res.status(400).json({ 
        success: false, 
        message: 'Não é possível cadastrar motorista com PGR não aprovado. O PGR deve estar aprovado para prosseguir.' 
      });
    }
    
    const cpfFormatted = formatCPF(data.cpf);
    
    const existingQuery = await pool.query(
      'SELECT id FROM work_safety_drivers WHERE cpf = $1',
      [cpfFormatted]
    );
    
    if (existingQuery.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'CPF já cadastrado no sistema. Cada motorista deve ter um CPF único.' 
      });
    }
    
    const result = await pool.query(
      `INSERT INTO work_safety_drivers (
        nome_completo, cpf, base_atuacao, telefone_motorista, email,
        possui_ear, numero_cnh, pgr_aprovado, nome_responsavel, telefone_responsavel,
        created_at, updated_at, ativo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), true)
      RETURNING *`,
      [
        data.nomeCompleto,
        cpfFormatted,
        data.baseAtuacao,
        data.telefoneMotorista,
        data.email,
        data.possuiEar || false,
        data.numeroCnh,
        data.pgrAprovado || false,
        data.nomeResponsavel,
        data.telefoneResponsavel
      ]
    );
    
    console.log('[WORK-SAFETY] Motorista cadastrado:', result.rows[0].nome_completo);
    
    return res.status(201).json({
      success: true,
      message: 'Motorista cadastrado com sucesso!',
      data: result.rows[0]
    });
    
  } catch (error: any) {
    console.error('[WORK-SAFETY] Erro ao cadastrar motorista:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({ 
        success: false, 
        message: 'CPF já cadastrado no sistema.' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao cadastrar motorista.' 
    });
  }
}

export async function getWorkSafetyDrivers(req: Request, res: Response) {
  try {
    const { base, pgrStatus, possuiEar, search } = req.query;
    const user = (req as any).user;
    
    let query = `
      SELECT 
        id,
        nome_completo,
        cpf,
        base_atuacao,
        telefone_motorista,
        email,
        possui_ear,
        numero_cnh,
        pgr_aprovado,
        nome_responsavel,
        telefone_responsavel,
        created_at,
        updated_at,
        ativo
      FROM work_safety_drivers
      WHERE ativo = true
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    const isAdmin = user && ['admin', 'ceo', 'gerente_geral'].includes(user.role);
    if (!isAdmin && user?.base_id) {
      query += ` AND base_atuacao = $${paramIndex}`;
      params.push(user.base_id);
      paramIndex++;
    }
    
    if (base && base !== 'all') {
      query += ` AND base_atuacao = $${paramIndex}`;
      params.push(base);
      paramIndex++;
    }
    
    if (pgrStatus && pgrStatus !== 'all') {
      query += ` AND pgr_aprovado = $${paramIndex}`;
      params.push(pgrStatus === 'approved');
      paramIndex++;
    }
    
    if (possuiEar && possuiEar !== 'all') {
      query += ` AND possui_ear = $${paramIndex}`;
      params.push(possuiEar === 'yes');
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (nome_completo ILIKE $${paramIndex} OR cpf ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ' ORDER BY updated_at DESC';
    
    const result = await pool.query(query, params);
    
    return res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('[WORK-SAFETY] Erro ao buscar motoristas:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar motoristas.' 
    });
  }
}

export async function getWorkSafetyDriverById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM work_safety_drivers WHERE id = $1 AND ativo = true',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Motorista não encontrado.' 
      });
    }
    
    return res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('[WORK-SAFETY] Erro ao buscar motorista:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar motorista.' 
    });
  }
}

export async function updateWorkSafetyDriver(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;
    
    if (data.pgrAprovado === false) {
      return res.status(400).json({ 
        success: false, 
        message: 'PGR deve estar aprovado para atualizar o cadastro.' 
      });
    }
    
    if (data.cpf && !validateCPF(data.cpf)) {
      return res.status(400).json({ 
        success: false, 
        message: 'CPF inválido.' 
      });
    }
    
    const cpfFormatted = data.cpf ? formatCPF(data.cpf) : undefined;
    
    if (cpfFormatted) {
      const existingQuery = await pool.query(
        'SELECT id FROM work_safety_drivers WHERE cpf = $1 AND id != $2',
        [cpfFormatted, id]
      );
      
      if (existingQuery.rows.length > 0) {
        return res.status(409).json({ 
          success: false, 
          message: 'CPF já cadastrado para outro motorista.' 
        });
      }
    }
    
    const result = await pool.query(
      `UPDATE work_safety_drivers SET
        nome_completo = COALESCE($1, nome_completo),
        cpf = COALESCE($2, cpf),
        base_atuacao = COALESCE($3, base_atuacao),
        telefone_motorista = COALESCE($4, telefone_motorista),
        email = COALESCE($5, email),
        possui_ear = COALESCE($6, possui_ear),
        numero_cnh = COALESCE($7, numero_cnh),
        pgr_aprovado = COALESCE($8, pgr_aprovado),
        nome_responsavel = COALESCE($9, nome_responsavel),
        telefone_responsavel = COALESCE($10, telefone_responsavel),
        updated_at = NOW()
      WHERE id = $11 AND ativo = true
      RETURNING *`,
      [
        data.nomeCompleto,
        cpfFormatted,
        data.baseAtuacao,
        data.telefoneMotorista,
        data.email,
        data.possuiEar,
        data.numeroCnh,
        data.pgrAprovado,
        data.nomeResponsavel,
        data.telefoneResponsavel,
        id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Motorista não encontrado.' 
      });
    }
    
    return res.json({
      success: true,
      message: 'Motorista atualizado com sucesso!',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('[WORK-SAFETY] Erro ao atualizar motorista:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar motorista.' 
    });
  }
}

export async function deleteWorkSafetyDriver(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE work_safety_drivers SET ativo = false, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Motorista não encontrado.' 
      });
    }
    
    return res.json({
      success: true,
      message: 'Motorista removido com sucesso!'
    });
    
  } catch (error) {
    console.error('[WORK-SAFETY] Erro ao remover motorista:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao remover motorista.' 
    });
  }
}

export async function getWorkSafetyBases(req: Request, res: Response) {
  try {
    const result = await pool.query(
      `SELECT DISTINCT base_atuacao FROM work_safety_drivers WHERE ativo = true ORDER BY base_atuacao`
    );
    
    const basesQuery = await pool.query(`SELECT DISTINCT name FROM bases ORDER BY name`);
    
    const allBases = new Set<string>();
    basesQuery.rows.forEach(row => allBases.add(row.name));
    result.rows.forEach(row => allBases.add(row.base_atuacao));
    
    return res.json({
      success: true,
      data: Array.from(allBases).sort()
    });
    
  } catch (error) {
    console.error('[WORK-SAFETY] Erro ao buscar bases:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar bases.' 
    });
  }
}

export async function getWorkSafetyStats(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const isAdmin = user && ['admin', 'ceo', 'gerente_geral'].includes(user.role);
    
    let baseFilter = '';
    const params: any[] = [];
    
    if (!isAdmin && user?.base_id) {
      baseFilter = 'AND base_atuacao = $1';
      params.push(user.base_id);
    }
    
    const statsQuery = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE pgr_aprovado = true) as pgr_aprovados,
        COUNT(*) FILTER (WHERE possui_ear = true) as com_ear,
        COUNT(DISTINCT base_atuacao) as total_bases
      FROM work_safety_drivers 
      WHERE ativo = true ${baseFilter}`,
      params
    );
    
    return res.json({
      success: true,
      data: {
        total: parseInt(statsQuery.rows[0].total) || 0,
        pgrAprovados: parseInt(statsQuery.rows[0].pgr_aprovados) || 0,
        comEar: parseInt(statsQuery.rows[0].com_ear) || 0,
        totalBases: parseInt(statsQuery.rows[0].total_bases) || 0
      }
    });
    
  } catch (error) {
    console.error('[WORK-SAFETY] Erro ao buscar estatísticas:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar estatísticas.' 
    });
  }
}
