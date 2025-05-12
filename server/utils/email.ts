/**
 * Utilitário para envio de emails
 * Utiliza SendGrid ou um método de fallback para ambientes de desenvolvimento
 */

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Envia um email usando SendGrid ou um fallback
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Verifica se as configurações de SENDGRID estão disponíveis
  if (process.env.SENDGRID_API_KEY) {
    return await sendWithSendGrid(options);
  } else {
    // Fallback para desenvolvimento: apenas loga os detalhes do email
    return logEmailForDevelopment(options);
  }
}

/**
 * Envia email usando SendGrid
 */
async function sendWithSendGrid(options: EmailOptions): Promise<boolean> {
  try {
    // Importa apenas quando necessário para não afetar o ambiente de desenvolvimento
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to: options.to,
      from: process.env.EMAIL_FROM || 'no-reply@muricionfleet.com',
      subject: options.subject,
      text: options.text,
      html: options.html || options.text.replace(/\n/g, '<br>')
    };
    
    await sgMail.send(msg);
    console.log(`Email enviado com sucesso para ${options.to}`);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email via SendGrid:', error);
    return false;
  }
}

/**
 * Método de fallback para desenvolvimento
 * Apenas loga os detalhes do email que seria enviado
 */
function logEmailForDevelopment(options: EmailOptions): boolean {
  console.log('==========================================');
  console.log('SIMULAÇÃO DE ENVIO DE EMAIL');
  console.log('==========================================');
  console.log(`Para: ${options.to}`);
  console.log(`Assunto: ${options.subject}`);
  console.log('------------------------------------------');
  console.log('Conteúdo:');
  console.log(options.text);
  console.log('==========================================');
  console.log('Para enviar emails reais, configure a API key do SendGrid');
  console.log('no arquivo .env: SENDGRID_API_KEY=sua_api_key');
  console.log('==========================================');
  
  return true;
}