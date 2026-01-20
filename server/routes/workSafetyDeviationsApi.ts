import { Request, Response } from 'express';
import { pool } from '../db';
import { insertWorkSafetyDeviationSchema } from '@shared/schema';

const DEVIATION_TYPES = {
  excesso_velocidade: 'Excesso de velocidade',
  jornada_acima_permitido: 'Jornada acima do permitido',
  falha_checklist: 'Falha no checklist',
  nao_uso_epi: 'Não uso de EPI',
  uso_indevido_veiculo: 'Uso indevido do veículo',
  avaria_conducao_inadequada: 'Avaria por condução inadequada',
  descumprimento_procedimento: 'Descumprimento de procedimento operacional',
  outro: 'Outro'
};

const STATUS_LABELS = {
  registrado: 'Registrado',
  em_acompanhamento: 'Em Acompanhamento',
  tratado: 'Tratado',
  recorrente: 'Recorrente'
};

const RECURRENCE_DAYS = 90;

async function checkRecurrence(motoristaNome: string, tipoDesvio: string): Promise<{ isRecurrent: boolean; count: number }> {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM work_safety_deviations 
       WHERE motorista_nome = $1 
       AND tipo_desvio = $2 
       AND data_desvio >= NOW() - INTERVAL '${RECURRENCE_DAYS} days'`,
      [motoristaNome, tipoDesvio]
    );
    const count = parseInt(result.rows[0].count) || 0;
    return { isRecurrent: count > 0, count: count + 1 };
  } catch (error) {
    console.error('[DESVIOS] Erro ao verificar reincidência:', error);
    return { isRecurrent: false, count: 1 };
  }
}

export async function createDeviation(req: Request, res: Response) {
  try {
    const data = req.body;
    
    const validation = insertWorkSafetyDeviationSchema.safeParse(data);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validation.error.errors
      });
    }

    const { isRecurrent, count } = await checkRecurrence(data.motoristaNome, data.tipoDesvio);

    const result = await pool.query(
      `INSERT INTO work_safety_deviations (
        placa, motorista_nome, motorista_cpf, motorista_id, data_desvio, tipo_desvio,
        observacoes, anexo_url, responsavel_registro, base_operacao, status,
        reincidente, quantidade_desvios, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING *`,
      [
        data.placa.toUpperCase(),
        data.motoristaNome,
        data.motoristaCpf || null,
        data.motoristaId || null,
        data.dataDesvio,
        data.tipoDesvio,
        data.observacoes || null,
        data.anexoUrl || null,
        data.responsavelRegistro,
        data.baseOperacao,
        isRecurrent ? 'recorrente' : 'registrado',
        isRecurrent,
        count
      ]
    );

    console.log('[DESVIOS] Desvio registrado:', result.rows[0].id, 'Motorista:', data.motoristaNome);

    return res.status(201).json({
      success: true,
      message: isRecurrent 
        ? `Desvio registrado com sucesso! ATENÇÃO: Este é o ${count}º desvio deste tipo para o motorista nos últimos ${RECURRENCE_DAYS} dias.`
        : 'Desvio registrado com sucesso!',
      data: result.rows[0],
      isRecurrent,
      deviationCount: count
    });

  } catch (error: any) {
    console.error('[DESVIOS] Erro ao registrar desvio:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao registrar desvio.'
    });
  }
}

export async function getDeviations(req: Request, res: Response) {
  try {
    const { base, motorista, placa, tipoDesvio, status, dataInicio, dataFim, search } = req.query;
    const user = (req as any).user;

    let query = `SELECT * FROM work_safety_deviations WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (user && user.role !== 'admin' && user.role !== 'ceo' && user.role !== 'gerente_geral' && user.base) {
      query += ` AND base_operacao = $${paramIndex}`;
      params.push(user.base);
      paramIndex++;
    }

    if (base) {
      query += ` AND base_operacao = $${paramIndex}`;
      params.push(base);
      paramIndex++;
    }

    if (motorista) {
      query += ` AND motorista_nome ILIKE $${paramIndex}`;
      params.push(`%${motorista}%`);
      paramIndex++;
    }

    if (placa) {
      query += ` AND placa ILIKE $${paramIndex}`;
      params.push(`%${placa}%`);
      paramIndex++;
    }

    if (tipoDesvio) {
      query += ` AND tipo_desvio = $${paramIndex}`;
      params.push(tipoDesvio);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (dataInicio) {
      query += ` AND data_desvio >= $${paramIndex}`;
      params.push(dataInicio);
      paramIndex++;
    }

    if (dataFim) {
      query += ` AND data_desvio <= $${paramIndex}`;
      params.push(dataFim);
      paramIndex++;
    }

    if (search) {
      query += ` AND (motorista_nome ILIKE $${paramIndex} OR placa ILIKE $${paramIndex} OR observacoes ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY data_desvio DESC, created_at DESC`;

    const result = await pool.query(query, params);

    return res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error: any) {
    console.error('[DESVIOS] Erro ao listar desvios:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao listar desvios.'
    });
  }
}

export async function getDeviationById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM work_safety_deviations WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Desvio não encontrado.'
      });
    }

    return res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error: any) {
    console.error('[DESVIOS] Erro ao buscar desvio:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao buscar desvio.'
    });
  }
}

export async function updateDeviationStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, observacoes } = req.body;

    console.log('[DESVIOS-DEBUG] updateDeviationStatus chamado - id:', id, 'body:', req.body);

    if (!status) {
      console.log('[DESVIOS-DEBUG] Status não informado');
      return res.status(400).json({
        success: false,
        message: 'Status não informado.'
      });
    }

    if (!['registrado', 'em_acompanhamento', 'tratado', 'recorrente'].includes(status)) {
      console.log('[DESVIOS-DEBUG] Status inválido:', status);
      return res.status(400).json({
        success: false,
        message: 'Status inválido.'
      });
    }

    console.log('[DESVIOS-DEBUG] Executando UPDATE para id:', id, 'novo status:', status);
    
    const result = await pool.query(
      `UPDATE work_safety_deviations 
       SET status = $1, observacoes = COALESCE($2, observacoes), updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, observacoes, id]
    );

    console.log('[DESVIOS-DEBUG] Resultado UPDATE:', result.rows.length, 'rows');

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Desvio não encontrado.'
      });
    }

    console.log('[DESVIOS] Status atualizado:', id, 'Novo status:', status, 'DB status:', result.rows[0].status);

    return res.json({
      success: true,
      message: 'Status atualizado com sucesso!',
      data: result.rows[0]
    });

  } catch (error: any) {
    console.error('[DESVIOS] Erro ao atualizar status:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao atualizar status.'
    });
  }
}

export async function getDeviationStats(req: Request, res: Response) {
  try {
    const { base, dataInicio, dataFim } = req.query;
    const user = (req as any).user;

    let baseFilter = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (user && user.role !== 'admin' && user.role !== 'ceo' && user.role !== 'gerente_geral' && user.base) {
      baseFilter = ` AND base_operacao = $${paramIndex}`;
      params.push(user.base);
      paramIndex++;
    } else if (base) {
      baseFilter = ` AND base_operacao = $${paramIndex}`;
      params.push(base);
      paramIndex++;
    }

    let dateFilter = '';
    if (dataInicio) {
      dateFilter += ` AND data_desvio >= $${paramIndex}`;
      params.push(dataInicio);
      paramIndex++;
    }
    if (dataFim) {
      dateFilter += ` AND data_desvio <= $${paramIndex}`;
      params.push(dataFim);
      paramIndex++;
    }

    const totalQuery = await pool.query(
      `SELECT COUNT(*) as total FROM work_safety_deviations WHERE 1=1 ${baseFilter} ${dateFilter}`,
      params
    );

    const byStatusQuery = await pool.query(
      `SELECT status, COUNT(*) as count FROM work_safety_deviations 
       WHERE 1=1 ${baseFilter} ${dateFilter}
       GROUP BY status ORDER BY count DESC`,
      params
    );

    const byTypeQuery = await pool.query(
      `SELECT tipo_desvio, COUNT(*) as count FROM work_safety_deviations 
       WHERE 1=1 ${baseFilter} ${dateFilter}
       GROUP BY tipo_desvio ORDER BY count DESC`,
      params
    );

    const topDriversQuery = await pool.query(
      `SELECT motorista_nome, COUNT(*) as count, 
              BOOL_OR(reincidente) as is_recurrent
       FROM work_safety_deviations 
       WHERE 1=1 ${baseFilter} ${dateFilter}
       GROUP BY motorista_nome 
       ORDER BY count DESC 
       LIMIT 10`,
      params
    );

    const recurrentCountQuery = await pool.query(
      `SELECT COUNT(DISTINCT motorista_nome) as count 
       FROM work_safety_deviations 
       WHERE reincidente = true ${baseFilter} ${dateFilter}`,
      params
    );

    const byBaseQuery = await pool.query(
      `SELECT base_operacao, COUNT(*) as count FROM work_safety_deviations 
       WHERE 1=1 ${dateFilter}
       GROUP BY base_operacao ORDER BY count DESC`,
      params.slice(base || (user && user.role !== 'admin') ? 1 : 0)
    );

    return res.json({
      success: true,
      data: {
        total: parseInt(totalQuery.rows[0].total) || 0,
        recurrentDrivers: parseInt(recurrentCountQuery.rows[0].count) || 0,
        byStatus: byStatusQuery.rows.map(row => ({
          status: row.status,
          label: STATUS_LABELS[row.status as keyof typeof STATUS_LABELS] || row.status,
          count: parseInt(row.count)
        })),
        byType: byTypeQuery.rows.map(row => ({
          type: row.tipo_desvio,
          label: DEVIATION_TYPES[row.tipo_desvio as keyof typeof DEVIATION_TYPES] || row.tipo_desvio,
          count: parseInt(row.count)
        })),
        topDrivers: topDriversQuery.rows.map(row => ({
          name: row.motorista_nome,
          count: parseInt(row.count),
          isRecurrent: row.is_recurrent
        })),
        byBase: byBaseQuery.rows.map(row => ({
          base: row.base_operacao,
          count: parseInt(row.count)
        }))
      }
    });

  } catch (error: any) {
    console.error('[DESVIOS] Erro ao buscar estatísticas:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao buscar estatísticas.'
    });
  }
}

export async function deleteDeviation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM work_safety_deviations WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Desvio não encontrado.'
      });
    }

    console.log('[DESVIOS] Desvio excluído:', id);

    return res.json({
      success: true,
      message: 'Desvio excluído com sucesso!'
    });

  } catch (error: any) {
    console.error('[DESVIOS] Erro ao excluir desvio:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao excluir desvio.'
    });
  }
}

export async function cleanupTestData(req: Request, res: Response) {
  const client = await pool.connect();
  
  try {
    const user = (req as any).user;
    
    if (!user || (user.role !== 'admin' && user.role !== 'ceo')) {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem executar esta ação.'
      });
    }

    const TEST_NAME_PATTERNS = [
      'teste', 'test', 'tes', 'eee', 'aaa', 'bbb', 'demo', 'sample', 
      'exemplo', 'dummy', 'fake', 'mock', 'xxx', 'yyy', 'zzz', 'usuario teste',
      'motorista teste', 'driver test', 'condutor teste'
    ];
    
    const TEST_PLATE_PATTERNS = [
      'ABC1234', 'ABC123', 'EEE3', 'EE33', 'SEE333', 'RER333', 'TEST1234',
      'TESTE123', 'XXX1234', 'YYY1234', 'ZZZ1234', 'AAA1234', 'BBB1234'
    ];

    await client.query('BEGIN');

    const findTestQuery = `
      SELECT id, motorista_nome, placa, base_operacao, data_desvio 
      FROM work_safety_deviations 
      WHERE 
        -- Nomes genéricos de teste (case insensitive, nome exato)
        LOWER(TRIM(motorista_nome)) IN (${TEST_NAME_PATTERNS.map((_, i) => `$${i + 1}`).join(', ')})
        OR
        -- Placas fictícias conhecidas (match exato)
        UPPER(placa) IN (${TEST_PLATE_PATTERNS.map((_, i) => `$${i + 1 + TEST_NAME_PATTERNS.length}`).join(', ')})
    `;

    const allPatterns = [...TEST_NAME_PATTERNS, ...TEST_PLATE_PATTERNS];
    const testRecords = await client.query(findTestQuery, allPatterns);

    if (testRecords.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.json({
        success: true,
        message: 'Nenhum dado de teste encontrado para remoção.',
        deletedCount: 0,
        deletedRecords: []
      });
    }

    const idsToDelete = testRecords.rows.map(r => r.id);
    
    const deleteQuery = `
      DELETE FROM work_safety_deviations 
      WHERE id = ANY($1::int[])
      RETURNING id, motorista_nome, placa, base_operacao
    `;
    
    const deleteResult = await client.query(deleteQuery, [idsToDelete]);

    const auditQuery = `
      INSERT INTO audit_log (
        action, entity_type, entity_id, user_email, user_role, 
        details, ip_address, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `;
    
    const auditDetails = JSON.stringify({
      action: 'cleanup_test_data',
      deletedCount: deleteResult.rows.length,
      deletedRecords: deleteResult.rows.map(r => ({
        id: r.id,
        motorista: r.motorista_nome,
        placa: r.placa,
        base: r.base_operacao
      })),
      criteria: {
        testNamePatterns: TEST_NAME_PATTERNS,
        testPlatePatterns: TEST_PLATE_PATTERNS
      },
      timestamp: new Date().toISOString()
    });

    try {
      await client.query(auditQuery, [
        'cleanup_test_data',
        'work_safety_deviations',
        idsToDelete.join(','),
        user.email || 'unknown',
        user.role || 'admin',
        auditDetails,
        req.ip || 'unknown'
      ]);
    } catch (auditError) {
      console.log('[DESVIOS] Tabela audit_log não existe, continuando sem log de auditoria');
    }

    await client.query('COMMIT');

    console.log(`[DESVIOS] Limpeza de dados de teste executada por ${user.email}. Registros removidos: ${deleteResult.rows.length}`);

    return res.json({
      success: true,
      message: `Dados de teste removidos com sucesso.`,
      deletedCount: deleteResult.rows.length,
      deletedRecords: deleteResult.rows.map(r => ({
        id: r.id,
        motorista: r.motorista_nome,
        placa: r.placa,
        base: r.base_operacao
      })),
      executedBy: user.email,
      executedAt: new Date().toISOString()
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('[DESVIOS] Erro ao limpar dados de teste:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao limpar dados de teste.',
      error: error.message
    });
  } finally {
    client.release();
  }
}

export const deviationTypes = DEVIATION_TYPES;
export const statusLabels = STATUS_LABELS;
