import { Router, Request, Response } from 'express';
import { pool } from '../db';
import fetch from 'node-fetch';

const router = Router();

const ZAPI_INSTANCE_ID = process.env.ZAPI_INSTANCE_ID;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN;

// Função para enviar notificação de alerta crítico
async function notifyCriticalAlert(alertData: {
  mensagem: string;
  remetente: string;
  grupo: string;
  tipoAlerta: string;
  ruleId?: number;
}) {
  try {
    // Buscar destinatários ativos (globais ou específicos da regra)
    let query = `
      SELECT * FROM whatsapp_critical_recipients 
      WHERE ativo = true AND (rule_id IS NULL`;
    const params: any[] = [];
    
    if (alertData.ruleId) {
      query += ` OR rule_id = $1)`;
      params.push(alertData.ruleId);
    } else {
      query += `)`;
    }
    
    const recipientsResult = await pool.query(query, params);
    
    if (recipientsResult.rows.length === 0) {
      console.log('[CRITICAL-NOTIFY] Nenhum destinatário configurado');
      return;
    }
    
    // Montar mensagem de notificação
    const notifyMessage = `🚨 *ALERTA CRÍTICO* 🚨

📍 *Grupo:* ${alertData.grupo || 'Desconhecido'}
👤 *Remetente:* ${alertData.remetente || 'Desconhecido'}
🏷️ *Tipo:* ${alertData.tipoAlerta}

💬 *Mensagem:*
${alertData.mensagem.substring(0, 500)}

_Enviado automaticamente pelo Murici On Fleet_`;

    // Enviar para cada destinatário
    for (const recipient of recipientsResult.rows) {
      try {
        const phone = recipient.telefone.replace(/\D/g, '');
        const response = await fetch(
          `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Client-Token': ZAPI_CLIENT_TOKEN || ''
            },
            body: JSON.stringify({
              phone: phone,
              message: notifyMessage
            })
          }
        );
        
        const result = await response.json();
        console.log(`[CRITICAL-NOTIFY] Notificação enviada para ${recipient.nome} (${phone}):`, result);
        
        // Registrar ação no log
        await pool.query(
          `INSERT INTO whatsapp_actions (tipo, descricao, usuario) VALUES ($1, $2, $3)`,
          ['critical_notify', `Notificação crítica enviada para ${recipient.nome}`, 'sistema']
        );
        
      } catch (sendError) {
        console.error(`[CRITICAL-NOTIFY] Erro ao enviar para ${recipient.telefone}:`, sendError);
      }
    }
    
  } catch (error) {
    console.error('[CRITICAL-NOTIFY] Erro geral:', error);
  }
}

// Webhook para receber mensagens do Z-API
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    console.log('[WHATSAPP-WEBHOOK] Payload completo:', JSON.stringify(data).substring(0, 800));
    
    // Ignorar callbacks de status (não são mensagens)
    if (data.type === 'MessageStatusCallback' || data.type === 'DeliveryCallback' || data.type === 'ReadCallback') {
      return res.status(200).json({ success: true, received: true });
    }
    
    // Estrutura Z-API - diversos formatos possíveis para o texto da mensagem
    const instanceId = data.instanceId || data.instance_id || '';
    
    // Extrair texto da mensagem de múltiplos campos possíveis
    let message = '';
    if (data.text && typeof data.text === 'object' && data.text.message) {
      message = data.text.message;
    } else if (data.text && typeof data.text === 'string') {
      message = data.text;
    } else if (data.message?.text) {
      message = data.message.text;
    } else if (data.message?.body) {
      message = data.message.body;
    } else if (data.body) {
      message = data.body;
    } else if (data.caption) {
      message = data.caption;
    }
    
    console.log('[WHATSAPP-WEBHOOK] Mensagem extraída:', message);
    
    const from = data.phone || data.from || data.sender?.id || data.chatId?.split('@')[0] || '';
    const senderName = data.senderName || data.sender?.pushName || data.pushName || data.participant?.name || '';
    const isGroup = data.isGroup || data.chat?.isGroup || (data.chatId && data.chatId.includes('@g.us')) || false;
    const groupId = isGroup ? (data.chatId || data.chat?.id || data.from || data.phone || '') : null;
    const isOutgoing = data.fromMe === true;
    
    // Melhor extração do nome do grupo
    let groupName = null;
    if (isGroup) {
      groupName = data.chat?.name || data.groupMetadata?.subject || data.groupName || data.chatName || 
                  data.name || data.participant?.groupName || 'Grupo WhatsApp';
    }
    
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
    
    // Verificar cada regra (apenas para mensagens recebidas com conteúdo)
    console.log('[WHATSAPP-WEBHOOK] Verificando regras:', rulesResult.rows.length, 'regras ativas, mensagem:', message ? `"${message}"` : '(vazia)');
    
    for (const rule of rulesResult.rows) {
      if (rule.tipo === 'palavra' && message && message.toLowerCase().includes(rule.valor.toLowerCase())) {
        console.log('[WHATSAPP-WEBHOOK] REGRA MATCH:', rule.valor, 'na mensagem:', message);
        isAlert = true;
        alertType = 'palavra-chave';
        alertPriority = rule.prioridade;
        matchedRuleId = rule.id;
        break;
      }
      if (rule.tipo === 'numero' && (from.includes(rule.valor) || mentioned.some((m: string) => m.includes(rule.valor)))) {
        console.log('[WHATSAPP-WEBHOOK] REGRA MATCH número:', rule.valor);
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
    
    // Se for grupo e tiver nome, atualizar nome do grupo em todas as mensagens anteriores
    if (isGroup && groupId && groupName && groupName !== 'Grupo WhatsApp') {
      await pool.query(
        `UPDATE whatsapp_messages 
         SET grupo_nome = $1 
         WHERE grupo_id = $2 AND (grupo_nome IS NULL OR grupo_nome != $1)`,
        [groupName, groupId]
      );
    }
    
    // Não salvar se não tiver mensagem (evitar duplicatas de status)
    if (!message && !isOutgoing) {
      console.log('[WHATSAPP-WEBHOOK] Mensagem vazia ignorada');
      return res.status(200).json({ success: true, received: true });
    }
    
    // Salvar mensagem no banco
    const insertResult = await pool.query(
      `INSERT INTO whatsapp_messages (
        instance_id, grupo_id, grupo_nome, remetente_numero, remetente_nome,
        mensagem, mencionados, is_mention, is_alert, alert_type, status,
        data_mensagem, is_outgoing
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), $12)
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
        isAlert ? 'pending' : 'normal',
        isOutgoing
      ]
    );
    
    console.log('[WHATSAPP-WEBHOOK] Mensagem salva ID:', insertResult.rows[0]?.id, 'isAlert:', isAlert);
    
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
      
      // Se for alerta crítico, enviar notificações
      if (alertPriority === 'critica') {
        notifyCriticalAlert({
          mensagem: message,
          remetente: senderName || from,
          grupo: groupName || 'Conversa privada',
          tipoAlerta: alertType || 'Alerta',
          ruleId: matchedRuleId
        });
      }
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
        wm.grupo_id,
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

// Enviar resposta via Z-API
router.post('/send-reply', async (req: Request, res: Response) => {
  try {
    const { messageId, phone, groupId, text, respondidoPor } = req.body;
    
    if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) {
      return res.status(500).json({ success: false, error: 'Credenciais Z-API não configuradas' });
    }
    
    if (!text) {
      return res.status(400).json({ success: false, error: 'Texto da mensagem é obrigatório' });
    }
    
    // Determinar o destino (grupo ou número direto)
    const destination = groupId || phone;
    if (!destination) {
      return res.status(400).json({ success: false, error: 'Destino não informado (grupo ou número)' });
    }
    
    // Enviar mensagem via Z-API
    const zapiUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (ZAPI_CLIENT_TOKEN) {
      headers['Client-Token'] = ZAPI_CLIENT_TOKEN;
    }
    
    const response = await fetch(zapiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        phone: destination,
        message: text
      })
    });
    
    const result = await response.json();
    console.log('[WHATSAPP] Resposta Z-API:', result);
    
    if (!response.ok) {
      return res.status(500).json({ success: false, error: 'Erro ao enviar mensagem', details: result });
    }
    
    // Marcar mensagem original como respondida
    if (messageId) {
      await pool.query(
        `UPDATE whatsapp_messages 
         SET respondido = true, respondido_por = $1, respondido_em = NOW(), status = 'respondido',
             resposta_texto = $2
         WHERE id = $3`,
        [respondidoPor || 'Sistema', text, messageId]
      );
      
      // Registrar ação de resposta no audit log
      await pool.query(
        `INSERT INTO wa_actions (message_id, user_name, action_type, notes, created_at)
         VALUES ($1, $2, 'reply', $3, NOW())`,
        [messageId, respondidoPor || 'Sistema', text.substring(0, 500)]
      );
    }
    
    // Salvar a resposta enviada como nova mensagem
    await pool.query(
      `INSERT INTO whatsapp_messages (
        instance_id, grupo_id, grupo_nome, remetente_numero, remetente_nome,
        mensagem, is_mention, is_alert, status, data_mensagem, is_outgoing
      ) VALUES ($1, $2, $3, $4, $5, $6, false, false, 'enviado', NOW(), true)`,
      [
        ZAPI_INSTANCE_ID,
        groupId,
        null,
        'Sistema',
        respondidoPor || 'Sistema',
        text
      ]
    );
    
    res.json({ success: true, message: 'Mensagem enviada com sucesso', zapiResponse: result });
    
  } catch (error) {
    console.error('[WHATSAPP] Erro ao enviar resposta:', error);
    res.status(500).json({ success: false, error: 'Erro ao enviar resposta' });
  }
});

// Estatísticas com KPIs executivos
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const [
      totalMessages, 
      todayMessages, 
      pendingAlerts, 
      respondedToday, 
      grupos,
      pendingNow,
      slaRisk,
      slaExceeded,
      avgResponseTime,
      topGroups
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM whatsapp_messages'),
      pool.query('SELECT COUNT(*) as total FROM whatsapp_messages WHERE data_mensagem >= $1', [today]),
      pool.query('SELECT COUNT(*) as total FROM whatsapp_alert_events WHERE lido = false'),
      pool.query("SELECT COUNT(*) as total FROM whatsapp_messages WHERE respondido = true AND respondido_em >= $1", [today]),
      pool.query(`
        SELECT DISTINCT grupo_nome 
        FROM whatsapp_messages 
        WHERE grupo_nome IS NOT NULL AND grupo_nome != ''
        ORDER BY grupo_nome
      `),
      pool.query(`SELECT COUNT(*) as total FROM whatsapp_messages 
        WHERE respondido = false AND is_outgoing = false AND data_mensagem >= $1`, [today]),
      pool.query(`SELECT COUNT(*) as total FROM whatsapp_messages 
        WHERE respondido = false AND is_outgoing = false 
        AND data_mensagem <= $1 AND data_mensagem > $2`, [fifteenMinAgo, oneHourAgo]),
      pool.query(`SELECT COUNT(*) as total FROM whatsapp_messages 
        WHERE respondido = false AND is_outgoing = false 
        AND data_mensagem <= $1`, [oneHourAgo]),
      pool.query(`
        SELECT AVG(EXTRACT(EPOCH FROM (respondido_em - data_mensagem))/60) as avg_minutes
        FROM whatsapp_messages 
        WHERE respondido = true AND respondido_em IS NOT NULL AND data_mensagem >= $1
      `, [today]),
      pool.query(`
        SELECT grupo_nome, COUNT(*) as total 
        FROM whatsapp_messages 
        WHERE grupo_nome IS NOT NULL AND data_mensagem >= NOW() - INTERVAL '7 days'
        GROUP BY grupo_nome 
        ORDER BY total DESC 
        LIMIT 5
      `)
    ]);
    
    res.json({
      success: true,
      data: {
        totalMensagens: parseInt(totalMessages.rows[0].total),
        mensagensHoje: parseInt(todayMessages.rows[0].total),
        alertasPendentes: parseInt(pendingAlerts.rows[0].total),
        respondidasHoje: parseInt(respondedToday.rows[0].total),
        grupos: grupos.rows.map(g => g.grupo_nome).filter(Boolean),
        pendentesAgora: parseInt(pendingNow.rows[0].total || 0),
        slaEmRisco: parseInt(slaRisk.rows[0].total || 0),
        slaEstourado: parseInt(slaExceeded.rows[0].total || 0),
        tempoMedioResposta: Math.round(parseFloat(avgResponseTime.rows[0].avg_minutes) || 0),
        topGrupos: topGroups.rows
      }
    });
    
  } catch (error) {
    console.error('[WHATSAPP] Erro ao buscar estatísticas:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar estatísticas' });
  }
});

// Atribuir mensagem a usuário
router.post('/assign', async (req: Request, res: Response) => {
  try {
    const { messageId, assignedTo, assignedBy, assignedByName } = req.body;
    
    await pool.query(
      `UPDATE whatsapp_messages SET assigned_to = $1, assigned_at = NOW() WHERE id = $2`,
      [assignedTo, messageId]
    );
    
    await pool.query(
      `INSERT INTO wa_actions (message_id, user_id, user_name, action_type, notes, created_at)
       VALUES ($1, $2, $3, 'assign', $4, NOW())`,
      [messageId, assignedBy, assignedByName, `Atribuído para usuário ID ${assignedTo}`]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('[WHATSAPP] Erro ao atribuir:', error);
    res.status(500).json({ success: false, error: 'Erro ao atribuir mensagem' });
  }
});

// Marcar como resolvido
router.post('/resolve', async (req: Request, res: Response) => {
  try {
    const { messageId, userId, userName } = req.body;
    
    await pool.query(
      `UPDATE whatsapp_messages SET status = 'resolvido', respondido = true, respondido_em = NOW() WHERE id = $1`,
      [messageId]
    );
    
    await pool.query(
      `INSERT INTO wa_actions (message_id, user_id, user_name, action_type, created_at)
       VALUES ($1, $2, $3, 'resolve', NOW())`,
      [messageId, userId, userName]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('[WHATSAPP] Erro ao resolver:', error);
    res.status(500).json({ success: false, error: 'Erro ao marcar como resolvido' });
  }
});

// Responder mensagem (grupos ou individual)
router.post('/reply', async (req: Request, res: Response) => {
  try {
    const { messageId, replyText, userId, userName } = req.body;
    
    if (!messageId || !replyText) {
      return res.status(400).json({ success: false, error: 'messageId e replyText sao obrigatorios' });
    }
    
    const messageResult = await pool.query(
      `SELECT * FROM whatsapp_messages WHERE id = $1`,
      [messageId]
    );
    
    if (messageResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Mensagem nao encontrada' });
    }
    
    const originalMessage = messageResult.rows[0];
    const isGroup = !!(originalMessage.grupo_id || originalMessage.grupo_nome);
    
    let sendResult;
    let targetPhone = originalMessage.remetente_numero;
    
    // Adicionar nome do usuário logado à mensagem
    const senderName = userName || 'Sistema';
    const messageWithSender = `*${senderName}:*\n${replyText}`;
    
    if (isGroup) {
      const { sendZAPIGroupMessage } = await import('../services/zapiWhatsAppService');
      const groupId = originalMessage.grupo_id || targetPhone;
      sendResult = await sendZAPIGroupMessage(groupId, messageWithSender);
    } else {
      const { sendZAPIWhatsAppMessage } = await import('../services/zapiWhatsAppService');
      sendResult = await sendZAPIWhatsAppMessage(targetPhone, messageWithSender);
    }
    
    if (!sendResult.success) {
      return res.status(500).json({ success: false, error: sendResult.error || 'Erro ao enviar resposta' });
    }
    
    await pool.query(
      `INSERT INTO whatsapp_messages (
        instance_id, grupo_id, grupo_nome, remetente_numero, remetente_nome,
        mensagem, tipo_mensagem, is_outgoing, status, respondido, respondido_por,
        respondido_em, data_mensagem, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 'text', true, 'enviado', true, $7, NOW(), NOW(), NOW()
      )`,
      [
        originalMessage.instance_id,
        originalMessage.grupo_id,
        originalMessage.grupo_nome,
        targetPhone,
        senderName,
        messageWithSender,
        senderName
      ]
    );
    
    await pool.query(
      `UPDATE whatsapp_messages SET respondido = true, respondido_por = $1, respondido_em = NOW() WHERE id = $2`,
      [senderName, messageId]
    );
    
    res.json({ 
      success: true, 
      message: 'Resposta enviada com sucesso',
      messageId: sendResult.messageId 
    });
  } catch (error: any) {
    console.error('[WHATSAPP] Erro ao responder:', error);
    res.status(500).json({ success: false, error: 'Erro ao enviar resposta' });
  }
});

// Silenciar mensagem
router.post('/snooze', async (req: Request, res: Response) => {
  try {
    const { messageId, minutes = 60, userId, userName } = req.body;
    
    const silenciadoAte = new Date(Date.now() + minutes * 60 * 1000);
    
    await pool.query(
      `UPDATE whatsapp_messages SET silenciado_ate = $1 WHERE id = $2`,
      [silenciadoAte, messageId]
    );
    
    await pool.query(
      `INSERT INTO wa_actions (message_id, user_id, user_name, action_type, notes, created_at)
       VALUES ($1, $2, $3, 'snooze', $4, NOW())`,
      [messageId, userId, userName, `Silenciado por ${minutes} minutos`]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('[WHATSAPP] Erro ao silenciar:', error);
    res.status(500).json({ success: false, error: 'Erro ao silenciar' });
  }
});

// Histórico de ações de uma mensagem
router.get('/actions/:messageId', async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM wa_actions WHERE message_id = $1 ORDER BY created_at DESC`,
      [messageId]
    );
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('[WHATSAPP] Erro ao buscar ações:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar histórico' });
  }
});

// ====================== DESTINATÁRIOS DE ALERTAS CRÍTICOS ======================

// Listar destinatários de alertas críticos
router.get('/critical-recipients', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT cr.*, r.valor as regra_valor, r.descricao as regra_descricao
       FROM whatsapp_critical_recipients cr
       LEFT JOIN whatsapp_alert_rules r ON cr.rule_id = r.id
       ORDER BY cr.created_at DESC`
    );
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('[WHATSAPP] Erro ao listar destinatários críticos:', error);
    res.status(500).json({ success: false, error: 'Erro ao listar destinatários' });
  }
});

// Criar destinatário de alerta crítico
router.post('/critical-recipients', async (req: Request, res: Response) => {
  try {
    const { nome, telefone, rule_id } = req.body;
    
    if (!nome || !telefone) {
      return res.status(400).json({ success: false, error: 'Nome e telefone são obrigatórios' });
    }
    
    const result = await pool.query(
      `INSERT INTO whatsapp_critical_recipients (nome, telefone, rule_id, ativo)
       VALUES ($1, $2, $3, true) RETURNING *`,
      [nome, telefone.replace(/\D/g, ''), rule_id || null]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[WHATSAPP] Erro ao criar destinatário crítico:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar destinatário' });
  }
});

// Atualizar destinatário de alerta crítico
router.patch('/critical-recipients/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, telefone, rule_id, ativo } = req.body;
    
    const result = await pool.query(
      `UPDATE whatsapp_critical_recipients 
       SET nome = COALESCE($1, nome),
           telefone = COALESCE($2, telefone),
           rule_id = $3,
           ativo = COALESCE($4, ativo),
           updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [nome, telefone ? telefone.replace(/\D/g, '') : null, rule_id, ativo, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Destinatário não encontrado' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[WHATSAPP] Erro ao atualizar destinatário crítico:', error);
    res.status(500).json({ success: false, error: 'Erro ao atualizar destinatário' });
  }
});

// Excluir destinatário de alerta crítico
router.delete('/critical-recipients/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM whatsapp_critical_recipients WHERE id = $1', [id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('[WHATSAPP] Erro ao excluir destinatário crítico:', error);
    res.status(500).json({ success: false, error: 'Erro ao excluir destinatário' });
  }
});

export default router;
