import { Router, Request, Response } from 'express';
import { pool } from './db';

function isAuthenticated(req: Request, res: Response, next: any) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  if (req.user) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Não autenticado' });
}

const router = Router();

router.post('/oficina', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { manutencao_id, oficina_nome, oficina_id, km_envio } = req.body;

    if (!manutencao_id || !oficina_nome) {
      return res.status(400).json({ 
        success: false, 
        message: 'manutencao_id e oficina_nome são obrigatórios' 
      });
    }

    const result = await pool.query(
      `INSERT INTO manutencao_oficinas (manutencao_id, oficina_nome, oficina_id, km_envio, data_envio, status)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, 'ativa')
       RETURNING *`,
      [manutencao_id, oficina_nome, oficina_id || null, km_envio || null]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[MANUTENCAO_HISTORICO] Erro ao adicionar oficina:', error);
    res.status(500).json({ success: false, message: 'Erro ao adicionar oficina' });
  }
});

router.patch('/oficina/:id/trocar', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { motivo_troca, nova_oficina_nome, nova_oficina_id, km_envio } = req.body;

    if (!motivo_troca || !nova_oficina_nome) {
      return res.status(400).json({ 
        success: false, 
        message: 'motivo_troca e nova_oficina_nome são obrigatórios' 
      });
    }

    const oficinaAtual = await pool.query(
      'SELECT * FROM manutencao_oficinas WHERE id = $1',
      [id]
    );

    if (oficinaAtual.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Registro não encontrado' });
    }

    const manutencaoId = oficinaAtual.rows[0].manutencao_id;

    await pool.query(
      `UPDATE manutencao_oficinas 
       SET data_retorno = CURRENT_TIMESTAMP, motivo_troca = $2, status = 'finalizada'
       WHERE id = $1`,
      [id, motivo_troca]
    );

    const novaOficina = await pool.query(
      `INSERT INTO manutencao_oficinas (manutencao_id, oficina_nome, oficina_id, km_envio, data_envio, status)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, 'ativa')
       RETURNING *`,
      [manutencaoId, nova_oficina_nome, nova_oficina_id || null, km_envio || null]
    );

    res.json({ 
      success: true, 
      message: 'Oficina trocada com sucesso',
      data: novaOficina.rows[0] 
    });
  } catch (error) {
    console.error('[MANUTENCAO_HISTORICO] Erro ao trocar oficina:', error);
    res.status(500).json({ success: false, message: 'Erro ao trocar oficina' });
  }
});

router.post('/oficina/:id/orcamento', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { valor_estimado, valor_pecas, valor_mao_obra, itens, observacao } = req.body;

    const oficinaCheck = await pool.query(
      'SELECT id FROM manutencao_oficinas WHERE id = $1',
      [id]
    );

    if (oficinaCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Oficina não encontrada' });
    }

    const result = await pool.query(
      `INSERT INTO manutencao_orcamentos 
       (manutencao_oficina_id, valor_estimado, valor_pecas, valor_mao_obra, itens, observacao, data_orcamento)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, valor_estimado || 0, valor_pecas || 0, valor_mao_obra || 0, 
       itens ? JSON.stringify(itens) : null, observacao || null]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[MANUTENCAO_HISTORICO] Erro ao adicionar orçamento:', error);
    res.status(500).json({ success: false, message: 'Erro ao adicionar orçamento' });
  }
});

router.patch('/orcamento/:id/aprovar', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { aprovado } = req.body;

    const result = await pool.query(
      `UPDATE manutencao_orcamentos SET aprovado = $2 WHERE id = $1 RETURNING *`,
      [id, aprovado !== undefined ? aprovado : true]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Orçamento não encontrado' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[MANUTENCAO_HISTORICO] Erro ao aprovar orçamento:', error);
    res.status(500).json({ success: false, message: 'Erro ao aprovar orçamento' });
  }
});

router.get('/:manutencaoId/historico', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { manutencaoId } = req.params;

    // Buscar histórico de oficinas na tabela manutencao_oficinas
    const oficinas = await pool.query(
      `SELECT 
        mo.*,
        (
          SELECT json_agg(
            json_build_object(
              'id', orc.id,
              'valor_estimado', orc.valor_estimado,
              'valor_pecas', orc.valor_pecas,
              'valor_mao_obra', orc.valor_mao_obra,
              'itens', orc.itens,
              'aprovado', orc.aprovado,
              'data_orcamento', orc.data_orcamento,
              'observacao', orc.observacao
            ) ORDER BY orc.data_orcamento
          )
          FROM manutencao_orcamentos orc
          WHERE orc.manutencao_oficina_id = mo.id
        ) as orcamentos
       FROM manutencao_oficinas mo
       WHERE mo.manutencao_id = $1
       ORDER BY mo.data_envio ASC`,
      [manutencaoId]
    );

    let oficinasResult = oficinas.rows;

    // Se não houver histórico, criar um registro virtual com a oficina atual do indicadores_dados
    if (oficinasResult.length === 0) {
      const dadosAtuais = await pool.query(
        `SELECT id, oficina_debito, created_at, placa, status
         FROM indicadores_dados 
         WHERE id = $1`,
        [manutencaoId]
      );
      
      if (dadosAtuais.rows.length > 0 && dadosAtuais.rows[0].oficina_debito) {
        oficinasResult = [{
          id: null,
          manutencao_id: parseInt(manutencaoId),
          oficina_nome: dadosAtuais.rows[0].oficina_debito,
          oficina_id: null,
          data_envio: dadosAtuais.rows[0].created_at,
          data_retorno: null,
          km_envio: null,
          motivo_troca: null,
          status: dadosAtuais.rows[0].status === 'Em Manutenção' ? 'ativo' : 'concluido',
          orcamentos: null,
          is_virtual: true // Indicador de que é um registro virtual
        }];
      }
    }

    const totalOrcamentos = await pool.query(
      `SELECT 
        COUNT(*) as total_orcamentos,
        SUM(CASE WHEN orc.aprovado = true THEN 1 ELSE 0 END) as aprovados,
        SUM(CASE WHEN orc.aprovado = false OR orc.aprovado IS NULL THEN orc.valor_estimado ELSE 0 END) as total_reprovado,
        SUM(CASE WHEN orc.aprovado = true THEN orc.valor_estimado ELSE 0 END) as total_aprovado
       FROM manutencao_oficinas mo
       JOIN manutencao_orcamentos orc ON orc.manutencao_oficina_id = mo.id
       WHERE mo.manutencao_id = $1`,
      [manutencaoId]
    );

    res.json({
      success: true,
      data: {
        oficinas: oficinasResult,
        resumo: totalOrcamentos.rows[0] || {
          total_orcamentos: 0,
          aprovados: 0,
          total_reprovado: 0,
          total_aprovado: 0
        }
      }
    });
  } catch (error) {
    console.error('[MANUTENCAO_HISTORICO] Erro ao buscar histórico:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar histórico' });
  }
});

router.get('/placa/:placa/historico', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { placa } = req.params;

    const manutencoes = await pool.query(
      `SELECT 
        id.id,
        id.placa,
        id.relato,
        id.status,
        id.oficina_debito as oficina_atual,
        id.data_agenda,
        id.km,
        id.created_at
       FROM indicadores_dados id
       WHERE id.placa = $1
       ORDER BY id.created_at DESC`,
      [placa.toUpperCase()]
    );

    const historicoCompleto = [];

    for (const manut of manutencoes.rows) {
      const oficinas = await pool.query(
        `SELECT 
          mo.*,
          (
            SELECT json_agg(
              json_build_object(
                'id', orc.id,
                'valor_estimado', orc.valor_estimado,
                'valor_pecas', orc.valor_pecas,
                'valor_mao_obra', orc.valor_mao_obra,
                'itens', orc.itens,
                'aprovado', orc.aprovado,
                'data_orcamento', orc.data_orcamento
              ) ORDER BY orc.data_orcamento
            )
            FROM manutencao_orcamentos orc
            WHERE orc.manutencao_oficina_id = mo.id
          ) as orcamentos
         FROM manutencao_oficinas mo
         WHERE mo.manutencao_id = $1
         ORDER BY mo.data_envio ASC`,
        [manut.id]
      );

      historicoCompleto.push({
        ...manut,
        historico_oficinas: oficinas.rows
      });
    }

    res.json({ success: true, data: historicoCompleto });
  } catch (error) {
    console.error('[MANUTENCAO_HISTORICO] Erro ao buscar histórico por placa:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar histórico' });
  }
});

router.delete('/orcamento/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM manutencao_orcamentos WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Orçamento não encontrado' });
    }

    res.json({ success: true, message: 'Orçamento removido' });
  } catch (error) {
    console.error('[MANUTENCAO_HISTORICO] Erro ao remover orçamento:', error);
    res.status(500).json({ success: false, message: 'Erro ao remover orçamento' });
  }
});

export default router;
