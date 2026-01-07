import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

// Webhook para receber mensagens do Z-API
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    console.log('[WHATSAPP-WEBHOOK] Mensagem recebida:', JSON.stringify(data).substring(0, 200));
    
    // Estrutura esperada do Z-API
    const instanceId = data.instanceId || data.instance_id;
    const message = data.text?.message || data.message?.text || data.body || '';
    const from = data.phone || data.from || data.sender?.id || '';
    const senderName = data.senderName || data.sender?.pushName || data.pushName || '';
    const isGroup = data.isGroup || data.chat?.isGroup || false;
    const groupId = isGroup ? (data.chatId || data.chat?.id || '') : null;
    const groupName = isGroup ? (data.chat?.name || data.groupName || 'Grupo') : null;
    const mentioned = data.mentionedList || data.mentioned || [];
    
    // Verificar se é uma menção
    const isMention = mentioned.length > 0;
    
    // Buscar regras de alertas ativas
    const rulesResult = await pool.query(
      'SELECT * FROM whatsapp_alert_rules WHERE ativo = true'
    );
    
    let isAlert = false;
    let alertType = null;
    let alertPriority = 'normal';
    let matchedRuleId = null;
    
    // Verificar cada regra
    for (const rule of rulesResult.rows) {
      if (rule.tipo === 'palavra' && message.toLowerCase().includes(rule.valor.toLowerCase())) {
        isAlert = true;
        alertType = 'palavra-chave';
        alertPriority = rule.prioridade;
        matchedRuleId = rule.id;
        break;
      }
      if (rule.tipo === 'numero' && (from.includes(rule.valor) || mentioned.some((m: string) => m.includes(rule.valor)))) {
        isAlert = true;
        alertType = 'numero-mencionado';
        alertPriority = rule.prioridade;
        matchedRuleId = rule.id;
        break;
      }
    }
    
    // Se houver menção, marcar como alerta
    if (isMention && !isAlert) {
      isAlert = true;
      alertType = 'mencao';
    }
    
    // Salvar mensagem no banco
    const insertResult = await pool.query(
      `INSERT INTO whatsapp_messages (
        instance_id, grupo_id, grupo_nome, remetente_numero, remetente_nome,
        mensagem, mencionados, is_mention, is_alert, alert_type, status,
        data_mensagem
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING id`,
      [
        instanceId,
        groupId,
        groupName,
        from,
        senderName,
        message,
        mentioned,
        isMention,
        isAlert,
        alertType,
        isAlert ? 'pending' : 'normal'
      ]
    );
    
    // Se for alerta, criar evento de alerta
    if (isAlert && insertResult.rows[0]) {
      await pool.query(
        `INSERT INTO whatsapp_alert_events (
          message_id, rule_id, tipo_alerta, descricao, prioridade
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          insertResult.rows[0].id,
          matchedRuleId,
          alertType,
          `Alerta: ${alertType} - "${message.substring(0, 100)}..."`,
          alertPriority
        ]
      );
    }
    
    res.status(200).json({ success: true, received: true });
    
  } catch (error) {
    console.error('[WHATSAPP-WEBHOOK] Erro:', error);
    res.status(500).json({ success: false, error: 'Erro ao processar webhook' });
  }
});

// Listar mensagens
router.get('/messages', async (req: Request, res: Response) => {
  try {
    const { grupo, status, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM whatsapp_messages WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (grupo && grupo !== 'all') {
      query += ` AND grupo_nome = $${paramIndex}`;
      params.push(grupo);
      paramIndex++;
    }
    
    if (status && status !== 'all') {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    query += ` ORDER BY data_mensagem DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), Number(offset));
    
    const result = await pool.query(query, params);
    
    // Contar total
    let countQuery = 'SELECT COUNT(*) as total FROM whatsapp_messages WHERE 1=1';
    const countParams: any[] = [];
    let countParamIndex = 1;
    
    if (grupo && grupo !== 'all') {
      countQuery += ` AND grupo_nome = $${countParamIndex}`;
      countParams.push(grupo);
      countParamIndex++;
    }
    
    if (status && status !== 'all') {
      countQuery += ` AND status = $${countParamIndex}`;
      countParams.push(status);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
      success: true,
      data: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: Number(limit),
      offset: Number(offset)
    });
    
  } catch (error) {
    console.error('[WHATSAPP] Erro ao listar mensagens:', error);
    res.status(500).json({ success: false, error: 'Erro ao listar mensagens' });
  }
});

// Listar alertas não lidos
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const { lido = 'false', limit = 50 } = req.query;
    
    let query = `
      SELECT 
        ae.*,
        wm.mensagem,
        wm.grupo_nome,
        wm.remetente_nome,
        wm.remetente_numero,
        wm.data_mensagem
      FROM whatsapp_alert_events ae
      LEFT JOIN whatsapp_messages wm ON ae.message_id = wm.id
    `;
    
    if (lido === 'false') {
      query += ' WHERE ae.lido = false';
    }
    
    query += ' ORDER BY ae.created_at DESC LIMIT $1';
    
    const result = await pool.query(query, [Number(limit)]);
    
    // Contar não lidos
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM whatsapp_alert_events WHERE lido = false'
    );
    
    res.json({
      success: true,
      data: result.rows,
      naoLidos: parseInt(countResult.rows[0].total)
    });
    
  } catch (error) {
    console.error('[WHATSAPP] Erro ao listar alertas:', error);
    res.status(500).json({ success: false, error: 'Erro ao listar alertas' });
  }
});

// Marcar alerta como lido
router.patch('/alerts/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { lido_por } = req.body;
    
    await pool.query(
      'UPDATE whatsapp_alert_events SET lido = true, lido_por = $1, lido_em = NOW() WHERE id = $2',
      [lido_por || 'Admin', id]
    );
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('[WHATSAPP] Erro ao marcar alerta:', error);
    res.status(500).json({ success: false, error: 'Erro ao marcar alerta' });
  }
});

// Marcar mensagem como respondida
router.patch('/messages/:id/respond', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { respondido_por } = req.body;
    
    await pool.query(
      `UPDATE whatsapp_messages 
       SET respondido = true, respondido_por = $1, respondido_em = NOW(), status = 'respondido'
       WHERE id = $2`,
      [respondido_por || 'Admin', id]
    );
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('[WHATSAPP] Erro ao marcar mensagem:', error);
    res.status(500).json({ success: false, error: 'Erro ao marcar mensagem' });
  }
});

// CRUD regras de alertas
router.get('/rules', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM whatsapp_alert_rules ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('[WHATSAPP] Erro ao listar regras:', error);
    res.status(500).json({ success: false, error: 'Erro ao listar regras' });
  }
});

router.post('/rules', async (req: Request, res: Response) => {
  try {
    const { tipo, valor, descricao, prioridade = 'normal', notificar_email = false, notificar_painel = true } = req.body;
    
    const result = await pool.query(
      `INSERT INTO whatsapp_alert_rules (tipo, valor, descricao, prioridade, notificar_email, notificar_painel)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tipo, valor, descricao, prioridade, notificar_email, notificar_painel]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
    
  } catch (error) {
    console.error('[WHATSAPP] Erro ao criar regra:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar regra' });
  }
});

router.delete('/rules/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM whatsapp_alert_rules WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('[WHATSAPP] Erro ao excluir regra:', error);
    res.status(500).json({ success: false, error: 'Erro ao excluir regra' });
  }
});

// Estatísticas
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [totalMessages, todayMessages, pendingAlerts, respondedToday, grupos] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM whatsapp_messages'),
      pool.query('SELECT COUNT(*) as total FROM whatsapp_messages WHERE data_mensagem >= $1', [today]),
      pool.query('SELECT COUNT(*) as total FROM whatsapp_alert_events WHERE lido = false'),
      pool.query("SELECT COUNT(*) as total FROM whatsapp_messages WHERE respondido = true AND respondido_em >= $1", [today]),
      pool.query('SELECT DISTINCT grupo_nome FROM whatsapp_messages WHERE grupo_nome IS NOT NULL')
    ]);
    
    res.json({
      success: true,
      data: {
        totalMensagens: parseInt(totalMessages.rows[0].total),
        mensagensHoje: parseInt(todayMessages.rows[0].total),
        alertasPendentes: parseInt(pendingAlerts.rows[0].total),
        respondidasHoje: parseInt(respondedToday.rows[0].total),
        grupos: grupos.rows.map(g => g.grupo_nome).filter(Boolean)
      }
    });
    
  } catch (error) {
    console.error('[WHATSAPP] Erro ao buscar estatísticas:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar estatísticas' });
  }
});

export default router;
