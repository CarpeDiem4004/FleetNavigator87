import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioFrom = process.env.TWILIO_WHATSAPP_FROM;

let twilioClient: twilio.Twilio | null = null;

function getTwilioClient(): twilio.Twilio | null {
  if (!accountSid || !authToken) {
    console.log('[Twilio] Credenciais não configuradas');
    return null;
  }
  
  if (!twilioClient) {
    twilioClient = twilio(accountSid, authToken);
    console.log('[Twilio] Cliente inicializado com sucesso');
  }
  
  return twilioClient;
}

function formatPhoneForSMS(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  return `+${cleaned}`;
}

export async function sendSMSMessage(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const client = getTwilioClient();
  
  if (!client) {
    console.log('[Twilio] Cliente não disponível - credenciais não configuradas');
    return { success: false, error: 'Twilio não configurado' };
  }
  
  if (!twilioFrom) {
    console.log('[Twilio] Número de origem não configurado');
    return { success: false, error: 'Número de origem não configurado' };
  }
  
  try {
    const formattedTo = formatPhoneForSMS(to);
    const formattedFrom = formatPhoneForSMS(twilioFrom);
    
    console.log(`[Twilio SMS] Enviando mensagem:`);
    console.log(`[Twilio SMS] - From: ${formattedFrom}`);
    console.log(`[Twilio SMS] - To: ${formattedTo}`);
    
    const twilioMessage = await client.messages.create({
      from: formattedFrom,
      to: formattedTo,
      body: message
    });
    
    console.log(`[Twilio SMS] Mensagem enviada com sucesso. SID: ${twilioMessage.sid}`);
    
    return { success: true, messageId: twilioMessage.sid };
  } catch (error: any) {
    console.error('[Twilio SMS] Erro ao enviar mensagem:', error.message);
    console.error('[Twilio SMS] Código do erro:', error.code);
    return { success: false, error: error.message };
  }
}

export async function sendWhatsAppMessage(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendSMSMessage(to, message);
}

export async function sendFuelCardRechargeNotification(
  phone: string,
  placa: string,
  motorista: string,
  valorSolicitado: number,
  operador: string,
  status: 'aprovado' | 'negado',
  observacoes?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  let message = '';
  
  if (status === 'aprovado') {
    message = `RECARGA DE CARTAO APROVADA\n\n` +
      `Placa: ${placa}\n` +
      `Motorista: ${motorista}\n` +
      `Valor: R$ ${valorSolicitado.toFixed(2).replace('.', ',')}\n` +
      `Aprovado por: ${operador}\n` +
      `Data: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n\n` +
      `A recarga foi efetuada com sucesso no cartao de combustivel.`;
  } else {
    message = `SOLICITACAO DE RECARGA NEGADA\n\n` +
      `Placa: ${placa}\n` +
      `Motorista: ${motorista}\n` +
      `Valor solicitado: R$ ${valorSolicitado.toFixed(2).replace('.', ',')}\n` +
      `Analisado por: ${operador}\n` +
      `Data: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
    
    if (observacoes) {
      message += `\n\nMotivo: ${observacoes}`;
    }
  }
  
  return sendSMSMessage(phone, message);
}

export function isTwilioConfigured(): boolean {
  return !!(accountSid && authToken && twilioFrom);
}
