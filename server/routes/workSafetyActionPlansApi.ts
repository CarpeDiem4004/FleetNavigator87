import { Request, Response } from 'express';
import { pool } from '../db';
import { insertWorkSafetyActionPlanSchema } from '@shared/schema';

const ORIGIN_LABELS: Record<string, string> = {
  investigacao: 'Investigação',
  telemetria: 'Telemetria',
  gestao_relatos: 'Gestão de Relatos',
  preventiva: 'Preventiva',
  campanhas: 'Campanhas'
};

const STATUS_LABELS: Record<string, string> = {
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  atrasado: 'Atrasado'
};

function checkIfOverdue(prazoFinal: Date, status: string): string {
  if (status === 'concluido') return 'concluido';
  const now = new Date();
  const prazo = new Date(prazoFinal);
  if (prazo < now) return 'atrasado';
  return 'em_andamento';
}

export async function createActionPlan(req: Request, res: Response) {
  try {
    const data = req.body;
    
    const validation = insertWorkSafetyActionPlanSchema.safeParse(data);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validation.error.errors
      });
    }

    const result = await pool.query(
      `INSERT INTO work_safety_action_plans (
        status, data_abertura, prazo_final, origem_acao, placa, data_ocorrencia,
        operacao, base_operacao, acao_proposta, responsavel_nome, responsavel_telefone,
        responsavel_email, observacoes, criado_por, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      RETURNING *`,
      [
        data.status || 'em_andamento',
        data.dataAbertura || new Date(),
        data.prazoFinal,
        data.origemAcao,
        data.placa || null,
        data.dataOcorrencia || null,
        data.operacao,
        data.baseOperacao || null,
        data.acaoProposta,
        data.responsavelNome,
        data.responsavelTelefone || null,
        data.responsavelEmail || null,
        data.observacoes || null,
        data.criadoPor
      ]
    );

    console.log('[PLANO-ACAO] Plano criado:', result.rows[0].id);

    return res.status(201).json({
      success: true,
      message: 'Plano de ação criado com sucesso!',
      data: result.rows[0]
    });

  } catch (error: any) {
    console.error('[PLANO-ACAO] Erro ao criar plano:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao criar plano de ação.'
    });
  }
}

export async function getActionPlans(req: Request, res: Response) {
  try {
    const { status, origem, operacao, responsavel, dataInicio, dataFim, search } = req.query;

    let query = `SELECT * FROM work_safety_action_plans WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (status && status !== 'todos') {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (origem && origem !== 'todos') {
      query += ` AND origem_acao = $${paramIndex}`;
      params.push(origem);
      paramIndex++;
    }

    if (operacao) {
      query += ` AND operacao ILIKE $${paramIndex}`;
      params.push(`%${operacao}%`);
      paramIndex++;
    }

    if (responsavel) {
      query += ` AND responsavel_nome ILIKE $${paramIndex}`;
      params.push(`%${responsavel}%`);
      paramIndex++;
    }

    if (dataInicio) {
      query += ` AND data_abertura >= $${paramIndex}`;
      params.push(dataInicio);
      paramIndex++;
    }

    if (dataFim) {
      query += ` AND data_abertura <= $${paramIndex}`;
      params.push(dataFim);
      paramIndex++;
    }

    if (search) {
      query += ` AND (acao_proposta ILIKE $${paramIndex} OR responsavel_nome ILIKE $${paramIndex} OR operacao ILIKE $${paramIndex} OR placa ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY 
      CASE 
        WHEN status = 'atrasado' THEN 1
        WHEN status = 'em_andamento' THEN 2
        WHEN status = 'concluido' THEN 3
      END,
      prazo_final ASC`;

    const result = await pool.query(query, params);

    const plans = result.rows.map(row => ({
      ...row,
      statusAtualizado: checkIfOverdue(row.prazo_final, row.status),
      origemLabel: ORIGIN_LABELS[row.origem_acao] || row.origem_acao,
      statusLabel: STATUS_LABELS[checkIfOverdue(row.prazo_final, row.status)] || row.status
    }));

    return res.json({
      success: true,
      data: plans,
      total: plans.length
    });

  } catch (error: any) {
    console.error('[PLANO-ACAO] Erro ao buscar planos:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao buscar planos de ação.'
    });
  }
}

export async function getActionPlanStats(req: Request, res: Response) {
  try {
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'em_andamento' AND prazo_final >= NOW()) as em_andamento,
        COUNT(*) FILTER (WHERE status = 'concluido') as concluidos,
        COUNT(*) FILTER (WHERE status != 'concluido' AND prazo_final < NOW()) as atrasados,
        COUNT(*) as total
      FROM work_safety_action_plans
    `);

    const originStats = await pool.query(`
      SELECT origem_acao, COUNT(*) as count
      FROM work_safety_action_plans
      GROUP BY origem_acao
      ORDER BY count DESC
    `);

    const stats = statsResult.rows[0];

    return res.json({
      success: true,
      data: {
        emAndamento: parseInt(stats.em_andamento) || 0,
        concluidos: parseInt(stats.concluidos) || 0,
        atrasados: parseInt(stats.atrasados) || 0,
        total: parseInt(stats.total) || 0,
        porOrigem: originStats.rows.map(row => ({
          origem: row.origem_acao,
          origemLabel: ORIGIN_LABELS[row.origem_acao] || row.origem_acao,
          count: parseInt(row.count)
        }))
      }
    });

  } catch (error: any) {
    console.error('[PLANO-ACAO] Erro ao buscar estatísticas:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao buscar estatísticas.'
    });
  }
}

export async function getActionPlanById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM work_safety_action_plans WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plano de ação não encontrado.'
      });
    }

    const plan = result.rows[0];
    return res.json({
      success: true,
      data: {
        ...plan,
        statusAtualizado: checkIfOverdue(plan.prazo_final, plan.status),
        origemLabel: ORIGIN_LABELS[plan.origem_acao] || plan.origem_acao,
        statusLabel: STATUS_LABELS[checkIfOverdue(plan.prazo_final, plan.status)] || plan.status
      }
    });

  } catch (error: any) {
    console.error('[PLANO-ACAO] Erro ao buscar plano:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao buscar plano de ação.'
    });
  }
}

export async function updateActionPlan(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;

    const checkResult = await pool.query(
      `SELECT * FROM work_safety_action_plans WHERE id = $1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plano de ação não encontrado.'
      });
    }

    let dataConclusao = null;
    if (data.status === 'concluido' && checkResult.rows[0].status !== 'concluido') {
      dataConclusao = new Date();
    }

    const result = await pool.query(
      `UPDATE work_safety_action_plans SET
        status = COALESCE($1, status),
        prazo_final = COALESCE($2, prazo_final),
        origem_acao = COALESCE($3, origem_acao),
        placa = COALESCE($4, placa),
        data_ocorrencia = COALESCE($5, data_ocorrencia),
        operacao = COALESCE($6, operacao),
        base_operacao = COALESCE($7, base_operacao),
        acao_proposta = COALESCE($8, acao_proposta),
        responsavel_nome = COALESCE($9, responsavel_nome),
        responsavel_telefone = COALESCE($10, responsavel_telefone),
        responsavel_email = COALESCE($11, responsavel_email),
        observacoes = COALESCE($12, observacoes),
        data_conclusao = COALESCE($13, data_conclusao),
        updated_at = NOW()
      WHERE id = $14
      RETURNING *`,
      [
        data.status,
        data.prazoFinal,
        data.origemAcao,
        data.placa,
        data.dataOcorrencia,
        data.operacao,
        data.baseOperacao,
        data.acaoProposta,
        data.responsavelNome,
        data.responsavelTelefone,
        data.responsavelEmail,
        data.observacoes,
        dataConclusao,
        id
      ]
    );

    console.log('[PLANO-ACAO] Plano atualizado:', id);

    return res.json({
      success: true,
      message: 'Plano de ação atualizado com sucesso!',
      data: result.rows[0]
    });

  } catch (error: any) {
    console.error('[PLANO-ACAO] Erro ao atualizar plano:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao atualizar plano de ação.'
    });
  }
}

export async function deleteActionPlan(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const checkResult = await pool.query(
      `SELECT * FROM work_safety_action_plans WHERE id = $1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plano de ação não encontrado.'
      });
    }

    await pool.query(`DELETE FROM work_safety_action_plans WHERE id = $1`, [id]);

    console.log('[PLANO-ACAO] Plano excluído:', id);

    return res.json({
      success: true,
      message: 'Plano de ação excluído com sucesso!'
    });

  } catch (error: any) {
    console.error('[PLANO-ACAO] Erro ao excluir plano:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao excluir plano de ação.'
    });
  }
}

export async function notifyResponsible(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM work_safety_action_plans WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plano de ação não encontrado.'
      });
    }

    const plan = result.rows[0];

    if (!plan.responsavel_telefone) {
      return res.status(400).json({
        success: false,
        message: 'Telefone do responsável não cadastrado.'
      });
    }

    const phone = plan.responsavel_telefone.replace(/\D/g, '');
    const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`;

    const prazoFormatado = new Date(plan.prazo_final).toLocaleDateString('pt-BR');
    const message = `🔔 *PLANO DE AÇÃO - SEGURANÇA DO TRABALHO*\n\n` +
      `Olá ${plan.responsavel_nome},\n\n` +
      `Você foi designado como responsável por um plano de ação:\n\n` +
      `📋 *Ação:* ${plan.acao_proposta}\n` +
      `🏢 *Operação:* ${plan.operacao}\n` +
      `📅 *Prazo:* ${prazoFormatado}\n` +
      `📌 *Origem:* ${ORIGIN_LABELS[plan.origem_acao] || plan.origem_acao}\n` +
      (plan.placa ? `🚗 *Placa:* ${plan.placa}\n` : '') +
      `\nPor favor, acompanhe e conclua a ação dentro do prazo.\n\n` +
      `_Murici Transportes - Segurança do Trabalho_`;

    await pool.query(
      `UPDATE work_safety_action_plans SET notificado_whatsapp = true, data_notificacao = NOW() WHERE id = $1`,
      [id]
    );

    return res.json({
      success: true,
      message: 'Dados para notificação preparados com sucesso!',
      data: {
        phone: formattedPhone,
        message: message,
        whatsappUrl: `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
      }
    });

  } catch (error: any) {
    console.error('[PLANO-ACAO] Erro ao preparar notificação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao preparar notificação.'
    });
  }
}
