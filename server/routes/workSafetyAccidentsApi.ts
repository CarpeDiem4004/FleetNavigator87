import { Request, Response } from 'express';
import { pool } from '../db';
import { z } from 'zod';

const accidentSchema = z.object({
  operacao: z.string().min(1, "Operação é obrigatória"),
  reportado_por: z.string().min(3, "Nome do reportante é obrigatório"),
  email_corporativo: z.string().email("E-mail inválido"),
  telefone_whatsapp: z.string().min(10, "Telefone inválido"),
  tipo_ocorrencia: z.enum(['acidente', 'quase_acidente', 'danos_materiais', 'danos_ambientais']),
  data_hora_ocorrencia: z.string().min(1, "Data/hora é obrigatória"),
  local_ocorrencia: z.string().min(1, "Local é obrigatório"),
  descricao_ocorrencia: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  houve_vitima: z.boolean(),
  descricao_vitima: z.string().optional().nullable(),
  motorista_nome: z.string().optional().nullable(),
  placa_veiculo: z.string().optional().nullable(),
});

export async function createAccident(req: Request, res: Response) {
  try {
    const validation = accidentSchema.safeParse(req.body);
    if (!validation.success) {
      console.error('[WORK-SAFETY] Validation errors:', validation.error.errors);
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validation.error.errors
      });
    }

    const data = validation.data;

    const tableCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'work_safety_accidents'
    `);
    
    const existingColumns = tableCheck.rows.map(r => r.column_name);
    console.log('[WORK-SAFETY] Existing columns:', existingColumns);

    if (!existingColumns.includes('operacao')) {
      console.log('[WORK-SAFETY] Adding new columns to table...');
      await pool.query(`
        ALTER TABLE work_safety_accidents 
        ADD COLUMN IF NOT EXISTS operacao VARCHAR(255),
        ADD COLUMN IF NOT EXISTS email_corporativo VARCHAR(255),
        ADD COLUMN IF NOT EXISTS telefone_whatsapp VARCHAR(50),
        ADD COLUMN IF NOT EXISTS descricao_vitima TEXT,
        ADD COLUMN IF NOT EXISTS placa_veiculo VARCHAR(20)
      `);
    }

    const result = await pool.query(
      `INSERT INTO work_safety_accidents (
        operacao, nome_reportante, email_corporativo, telefone_whatsapp,
        tipo_ocorrencia, data_hora, local, descricao, houve_vitima,
        descricao_vitima, motorista_nome, placa_veiculo,
        telefone_reportante, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $4, NOW(), NOW())
      RETURNING *`,
      [
        data.operacao,
        data.reportado_por,
        data.email_corporativo,
        data.telefone_whatsapp,
        data.tipo_ocorrencia,
        data.data_hora_ocorrencia,
        data.local_ocorrencia,
        data.descricao_ocorrencia,
        data.houve_vitima,
        data.descricao_vitima || null,
        data.motorista_nome || null,
        data.placa_veiculo || null
      ]
    );

    console.log('[WORK-SAFETY] Ocorrência registrada:', data.tipo_ocorrencia, 'operação:', data.operacao);

    return res.status(201).json({
      success: true,
      message: 'Ocorrência registrada com sucesso!',
      data: result.rows[0]
    });

  } catch (error: any) {
    console.error('[WORK-SAFETY] Erro ao registrar ocorrência:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao registrar ocorrência',
      error: error.message
    });
  }
}

export async function getAccidents(req: Request, res: Response) {
  try {
    const { base, tipo, operacao } = req.query;

    let query = 'SELECT * FROM work_safety_accidents WHERE 1=1';
    const params: any[] = [];

    if (base) {
      params.push(base);
      query += ` AND base = $${params.length}`;
    }

    if (operacao) {
      params.push(operacao);
      query += ` AND operacao = $${params.length}`;
    }

    if (tipo) {
      params.push(tipo);
      query += ` AND tipo_ocorrencia = $${params.length}`;
    }

    query += ' ORDER BY data_hora DESC';

    const result = await pool.query(query, params);

    return res.json({
      success: true,
      data: result.rows
    });

  } catch (error: any) {
    console.error('[WORK-SAFETY] Erro ao buscar ocorrências:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar ocorrências'
    });
  }
}

export async function getAccidentStats(req: Request, res: Response) {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE tipo_ocorrencia = 'acidente') as acidentes,
        COUNT(*) FILTER (WHERE tipo_ocorrencia = 'quase_acidente') as quase_acidentes,
        COUNT(*) FILTER (WHERE tipo_ocorrencia = 'danos_materiais') as danos_materiais,
        COUNT(*) FILTER (WHERE tipo_ocorrencia = 'danos_ambientais') as danos_ambientais,
        COUNT(*) FILTER (WHERE houve_vitima = true) as com_vitima,
        COALESCE(
          EXTRACT(DAY FROM NOW() - MAX(data_hora) FILTER (WHERE tipo_ocorrencia = 'acidente')),
          999
        )::integer as dias_sem_acidente
      FROM work_safety_accidents
    `);

    return res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error: any) {
    console.error('[WORK-SAFETY] Erro ao buscar estatísticas:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas'
    });
  }
}
