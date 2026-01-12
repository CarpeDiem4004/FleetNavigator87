import fetch from 'node-fetch';

const ZAPI_INSTANCE_ID = process.env.ZAPI_INSTANCE_ID;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN;

function formatPhoneForZAPI(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  return cleaned;
}

export async function sendZAPIWhatsAppMessage(
  to: string, 
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) {
    console.log('[Z-API] Credenciais não configuradas');
    return { success: false, error: 'Z-API não configurado' };
  }
  
  try {
    const formattedPhone = formatPhoneForZAPI(to);
    
    console.log(`[Z-API] Enviando mensagem para ${formattedPhone}`);
    
    const url = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Client-Token': ZAPI_CLIENT_TOKEN || ''
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message: message
      })
    });
    
    const data = await response.json() as any;
    
    const msgId = data.zapiMessageId || data.messageId || data.id || data.zaapId;
    
    if (response.ok && msgId) {
      console.log(`[Z-API] Mensagem enviada com sucesso. ID: ${msgId}`);
      return { success: true, messageId: msgId };
    } else {
      console.error('[Z-API] Erro na resposta:', data);
      return { success: false, error: data.error || data.message || 'Erro ao enviar mensagem' };
    }
  } catch (error: any) {
    console.error('[Z-API] Erro ao enviar mensagem:', error.message);
    return { success: false, error: error.message };
  }
}

export interface FuelCardNotificationData {
  phone: string;
  placa: string;
  motorista: string;
  valorSolicitado: number;
  operador: string;
  status: 'aprovado' | 'negado';
  provedor?: string;
  dataUso?: string;
  observacoes?: string;
}

export async function sendFuelCardRechargeNotificationZAPI(
  data: FuelCardNotificationData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { phone, placa, motorista, valorSolicitado, operador, status, provedor, dataUso, observacoes } = data;
  
  let message = '';
  const dataAtual = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  
  if (status === 'aprovado') {
    message = `✅ *RECARGA DE CARTÃO APROVADA*\n\n`;
    message += `🚗 *Cartão/Placa:* ${placa}\n`;
    message += `👤 *Motorista:* ${motorista}\n`;
    message += `💰 *Valor Liberado:* R$ ${valorSolicitado.toFixed(2).replace('.', ',')}\n`;
    
    if (provedor) {
      message += `🏪 *Provedor:* ${provedor}\n`;
    }
    
    if (dataUso) {
      message += `📅 *Data de Uso:* ${dataUso}\n`;
    }
    
    message += `👨‍💼 *Aprovado por:* ${operador}\n`;
    message += `🕐 *Data da Aprovação:* ${dataAtual}\n\n`;
    message += `✨ A recarga foi efetuada com sucesso no cartão de combustível!`;
    
  } else {
    message = `❌ *SOLICITAÇÃO DE RECARGA NEGADA*\n\n`;
    message += `🚗 *Cartão/Placa:* ${placa}\n`;
    message += `👤 *Motorista:* ${motorista}\n`;
    message += `💰 *Valor Solicitado:* R$ ${valorSolicitado.toFixed(2).replace('.', ',')}\n`;
    
    if (provedor) {
      message += `🏪 *Provedor:* ${provedor}\n`;
    }
    
    message += `👨‍💼 *Analisado por:* ${operador}\n`;
    message += `🕐 *Data:* ${dataAtual}`;
    
    if (observacoes) {
      message += `\n\n📝 *Motivo:* ${observacoes}`;
    }
  }
  
  return sendZAPIWhatsAppMessage(phone, message);
}

export function isZAPIConfigured(): boolean {
  return !!(ZAPI_INSTANCE_ID && ZAPI_TOKEN);
}

export async function sendZAPIGroupMessage(
  groupId: string, 
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) {
    console.log('[Z-API] Credenciais nao configuradas');
    return { success: false, error: 'Z-API nao configurado' };
  }
  
  try {
    // Formatar o chatId corretamente para grupos
    let chatId = groupId;
    
    // Se já tem @g.us, manter como está
    if (!chatId.includes('@g.us')) {
      // Remover sufixo -group se existir
      chatId = chatId.replace('-group', '');
      // Adicionar @g.us para formato de grupo
      chatId = chatId + '@g.us';
    }
    
    console.log(`[Z-API] Enviando mensagem para grupo. ChatId original: ${groupId}, formatado: ${chatId}`);
    
    const url = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Client-Token': ZAPI_CLIENT_TOKEN || ''
      },
      body: JSON.stringify({
        phone: chatId,
        message: message
      })
    });
    
    const data = await response.json() as any;
    
    console.log(`[Z-API] Resposta do envio para grupo:`, JSON.stringify(data));
    
    const msgId = data.zapiMessageId || data.messageId || data.id || data.zaapId;
    
    if (response.ok && msgId) {
      console.log(`[Z-API] Mensagem enviada para grupo com sucesso. ID: ${msgId}`);
      return { success: true, messageId: msgId };
    } else {
      console.error('[Z-API] Erro na resposta do grupo:', data);
      return { success: false, error: data.error || data.message || 'Erro ao enviar mensagem para grupo' };
    }
  } catch (error: any) {
    console.error('[Z-API] Erro ao enviar mensagem para grupo:', error.message);
    return { success: false, error: error.message };
  }
}
