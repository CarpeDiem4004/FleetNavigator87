import { Request, Response } from 'express';
import { pool } from '../db';

export async function createAccident(req: Request, res: Response) {
  try {
    const data = req.body;
    
    console.log('[WORK-SAFETY] Recebendo dados de acidente:', Object.keys(data));

    const result = await pool.query(
      `INSERT INTO work_safety_accidents (
        operacao, reportado_por, email_corporativo, telefone_whatsapp,
        coordenador_base, nome_responsavel_meli, milha, regional, base_unidade,
        endereco_ocorrencia, id_rota, transit_time_orh, inicio_rota,
        data_ocorrencia, horario_ocorrencia, causa_imediata, descricao_detalhada,
        placa_veiculo, modelo_veiculo, ano_veiculo, frota_fixa, tipo_frota,
        terceiro_envolvido, nome_colaborador, id_matricula, funcao, idade,
        contratacao, data_admissao, data_primeira_habilitacao,
        partes_corpo_atingidas, dias_afastado, foi_socorrido, atendimento_medico,
        local_atendimento, houve_internacao, nome_medico_crm, cid,
        registro_policial, protocolo_bo, estado_saude_envolvidos, status,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, 'reportado',
        NOW(), NOW()
      ) RETURNING *`,
      [
        data.operacao || null,
        data.reportado_por || null,
        data.email_corporativo || null,
        data.telefone_whatsapp || null,
        data.coordenador_base || null,
        data.nome_responsavel_meli || null,
        data.milha || null,
        data.regional || null,
        data.base_unidade || null,
        data.endereco_ocorrencia || null,
        data.id_rota || null,
        data.transit_time_orh || null,
        data.inicio_rota || null,
        data.data_ocorrencia || null,
        data.horario_ocorrencia || null,
        data.causa_imediata || null,
        data.descricao_detalhada || null,
        data.placa_veiculo || null,
        data.modelo_veiculo || null,
        data.ano_veiculo || null,
        data.frota_fixa || null,
        data.tipo_frota || null,
        data.terceiro_envolvido || false,
        data.nome_colaborador || null,
        data.id_matricula || null,
        data.funcao || null,
        data.idade || null,
        data.contratacao || null,
        data.data_admissao || null,
        data.data_primeira_habilitacao || null,
        data.partes_corpo_atingidas || null,
        data.dias_afastado || null,
        data.foi_socorrido || null,
        data.atendimento_medico || null,
        data.local_atendimento || null,
        data.houve_internacao || null,
        data.nome_medico_crm || null,
        data.cid || null,
        data.registro_policial || null,
        data.protocolo_bo || null,
        data.estado_saude_envolvidos || null
      ]
    );

    console.log('[WORK-SAFETY] Ocorrência registrada:', result.rows[0].id, 'operação:', data.operacao);

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
      query += ` AND base_unidade = $${params.length}`;
    }

    if (operacao) {
      params.push(operacao);
      query += ` AND operacao = $${params.length}`;
    }

    if (tipo) {
      params.push(tipo);
      query += ` AND causa_imediata = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

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
        COUNT(*) FILTER (WHERE causa_imediata ILIKE '%colisão%' OR causa_imediata ILIKE '%atropelamento%' OR causa_imediata ILIKE '%capotamento%') as acidentes,
        COUNT(*) FILTER (WHERE causa_imediata ILIKE '%quase%' OR causa_imediata IS NULL) as quase_acidentes,
        COUNT(*) FILTER (WHERE causa_imediata ILIKE '%dano%' OR causa_imediata ILIKE '%avaria%') as danos_materiais,
        COUNT(*) FILTER (WHERE causa_imediata ILIKE '%ambiental%' OR causa_imediata ILIKE '%incêndio%') as danos_ambientais,
        COUNT(*) FILTER (WHERE terceiro_envolvido = true) as com_vitima,
        COALESCE(
          EXTRACT(DAY FROM NOW() - MAX(created_at)),
          0
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
