import { Request, Response } from 'express';
import { pool } from '../db';
import { z } from 'zod';

const participationSchema = z.object({
  treinamentoId: z.number().int().positive(),
  motoristaId: z.number().optional().nullable(),
  motoristaNome: z.string().min(3, "Nome é obrigatório"),
  motoristaCpf: z.string().optional().nullable(),
  base: z.string().min(1, "Base é obrigatória"),
  status: z.enum(['inscrito', 'confirmado', 'concluido', 'ausente']).default('inscrito'),
});

export async function getTrainings(req: Request, res: Response) {
  try {
    const result = await pool.query(
      `SELECT * FROM work_safety_trainings WHERE ativo = true ORDER BY nome`
    );

    return res.json({
      success: true,
      data: result.rows
    });

  } catch (error: any) {
    console.error('[WORK-SAFETY] Erro ao buscar treinamentos:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar treinamentos'
    });
  }
}

export async function createParticipation(req: Request, res: Response) {
  try {
    const validation = participationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validation.error.errors
      });
    }

    const data = validation.data;

    const existingQuery = await pool.query(
      `SELECT id FROM work_safety_training_participations 
       WHERE treinamento_id = $1 AND (motorista_cpf = $2 OR motorista_nome = $3)`,
      [data.treinamentoId, data.motoristaCpf, data.motoristaNome]
    );

    if (existingQuery.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Esta pessoa já está inscrita neste treinamento.'
      });
    }

    const result = await pool.query(
      `INSERT INTO work_safety_training_participations (
        treinamento_id, motorista_id, motorista_nome, motorista_cpf, base,
        status, data_inscricao, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())
      RETURNING *`,
      [
        data.treinamentoId,
        data.motoristaId || null,
        data.motoristaNome,
        data.motoristaCpf || null,
        data.base,
        data.status || 'inscrito'
      ]
    );

    console.log('[WORK-SAFETY] Participação registrada:', data.motoristaNome, 'no treinamento', data.treinamentoId);

    return res.status(201).json({
      success: true,
      message: 'Inscrição realizada com sucesso!',
      data: result.rows[0]
    });

  } catch (error: any) {
    console.error('[WORK-SAFETY] Erro ao registrar participação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao registrar participação'
    });
  }
}

export async function getParticipations(req: Request, res: Response) {
  try {
    const { base, treinamentoId, status } = req.query;

    let query = `
      SELECT p.*, t.nome as treinamento_nome, t.carga_horaria
      FROM work_safety_training_participations p
      LEFT JOIN work_safety_trainings t ON p.treinamento_id = t.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (base) {
      params.push(base);
      query += ` AND p.base = $${params.length}`;
    }

    if (treinamentoId) {
      params.push(treinamentoId);
      query += ` AND p.treinamento_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND p.status = $${params.length}`;
    }

    query += ' ORDER BY p.data_inscricao DESC';

    const result = await pool.query(query, params);

    return res.json({
      success: true,
      data: result.rows
    });

  } catch (error: any) {
    console.error('[WORK-SAFETY] Erro ao buscar participações:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar participações'
    });
  }
}

export async function getTrainingStats(req: Request, res: Response) {
  try {
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM work_safety_trainings WHERE ativo = true) as total_treinamentos,
        COUNT(*) as total_inscricoes,
        COUNT(*) FILTER (WHERE status = 'concluido') as concluidos,
        COUNT(*) FILTER (WHERE status = 'inscrito') as inscritos,
        COUNT(*) FILTER (WHERE status = 'confirmado') as confirmados
      FROM work_safety_training_participations
    `);

    return res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error: any) {
    console.error('[WORK-SAFETY] Erro ao buscar estatísticas de treinamentos:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas'
    });
  }
}

export async function seedDefaultTrainings(req: Request, res: Response) {
  try {
    const defaultTrainings = [
      { nome: 'Direção Defensiva', descricao: 'Treinamento de técnicas de direção defensiva e prevenção de acidentes', cargaHoraria: 8, validade: 12 },
      { nome: 'Primeiros Socorros', descricao: 'Capacitação em atendimento de primeiros socorros', cargaHoraria: 4, validade: 24 },
      { nome: 'NR-11 - Movimentação de Cargas', descricao: 'Norma regulamentadora para transporte e movimentação de materiais', cargaHoraria: 8, validade: 12 },
      { nome: 'NR-20 - Segurança com Inflamáveis', descricao: 'Segurança e saúde no trabalho com inflamáveis e combustíveis', cargaHoraria: 16, validade: 12 },
      { nome: 'Reciclagem NR-11', descricao: 'Atualização sobre movimentação de cargas', cargaHoraria: 4, validade: 12 },
    ];

    for (const training of defaultTrainings) {
      const existing = await pool.query(
        'SELECT id FROM work_safety_trainings WHERE nome = $1',
        [training.nome]
      );

      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO work_safety_trainings (nome, descricao, carga_horaria, validade, ativo, created_at)
           VALUES ($1, $2, $3, $4, true, NOW())`,
          [training.nome, training.descricao, training.cargaHoraria, training.validade]
        );
      }
    }

    return res.json({
      success: true,
      message: 'Treinamentos padrão criados com sucesso!'
    });

  } catch (error: any) {
    console.error('[WORK-SAFETY] Erro ao criar treinamentos padrão:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar treinamentos padrão'
    });
  }
}
