import { Request, Response } from 'express';
import { pool } from '../db';
import { z } from 'zod';

const accidentSchema = z.object({
  base: z.string().min(1, "Base é obrigatória"),
  motoristaId: z.number().optional().nullable(),
  motoristaNome: z.string().optional().nullable(),
  tipoOcorrencia: z.enum(['acidente', 'incidente', 'quase_acidente']),
  dataHora: z.string().min(1, "Data/hora é obrigatória"),
  local: z.string().min(1, "Local é obrigatório"),
  descricao: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  houveVitima: z.boolean(),
  anexoUrl: z.string().optional().nullable(),
  nomeReportante: z.string().min(3, "Nome do reportante é obrigatório"),
  telefoneReportante: z.string().min(10, "Telefone inválido"),
});

export async function createAccident(req: Request, res: Response) {
  try {
    const validation = accidentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validation.error.errors
      });
    }

    const data = validation.data;

    const result = await pool.query(
      `INSERT INTO work_safety_accidents (
        base, motorista_id, motorista_nome, tipo_ocorrencia, data_hora,
        local, descricao, houve_vitima, anexo_url, nome_reportante,
        telefone_reportante, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *`,
      [
        data.base,
        data.motoristaId || null,
        data.motoristaNome || null,
        data.tipoOcorrencia,
        data.dataHora,
        data.local,
        data.descricao,
        data.houveVitima,
        data.anexoUrl || null,
        data.nomeReportante,
        data.telefoneReportante
      ]
    );

    console.log('[WORK-SAFETY] Ocorrência registrada:', data.tipoOcorrencia, 'na base', data.base);

    return res.status(201).json({
      success: true,
      message: 'Ocorrência registrada com sucesso!',
      data: result.rows[0]
    });

  } catch (error: any) {
    console.error('[WORK-SAFETY] Erro ao registrar ocorrência:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao registrar ocorrência'
    });
  }
}

export async function getAccidents(req: Request, res: Response) {
  try {
    const { base, tipo } = req.query;

    let query = 'SELECT * FROM work_safety_accidents WHERE 1=1';
    const params: any[] = [];

    if (base) {
      params.push(base);
      query += ` AND base = $${params.length}`;
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
        COUNT(*) FILTER (WHERE tipo_ocorrencia = 'incidente') as incidentes,
        COUNT(*) FILTER (WHERE tipo_ocorrencia = 'quase_acidente') as quase_acidentes,
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
