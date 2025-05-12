/**
 * Serviço de envio de e-mail para o sistema
 * Este módulo contém função para enviar e-mails usando a API REST
 */

import * as nodemailer from 'nodemailer';

/**
 * Configuração do serviço de e-mail
 * No ambiente de produção, usa as variáveis de ambiente
 * No ambiente de desenvolvimento, usa ethereal.email para teste
 */
let transporter: nodemailer.Transporter;

/**
 * Inicializa o transporter do nodemailer
 * Função chamada automaticamente na primeira vez que o módulo é carregado
 */
async function initializeTransporter() {
  // Em produção, usamos as credenciais configuradas
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    console.log('Serviço de e-mail configurado com credenciais reais');
    return;
  }

  // Em desenvolvimento, usamos o serviço de teste ethereal.email
  const testAccount = await nodemailer.createTestAccount();
  
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  
  console.log('Serviço de e-mail configurado com ethereal.email (desenvolvimento)');
  console.log('Usuário de teste:', testAccount.user);
  console.log('Senha de teste:', testAccount.pass);
}

// Inicializa o transporter na primeira vez que o módulo é carregado
initializeTransporter().catch(error => {
  console.error('Erro ao inicializar o serviço de e-mail:', error);
});

/**
 * Envia um e-mail
 * @param to E-mail do destinatário
 * @param subject Assunto do e-mail
 * @param html Conteúdo HTML do e-mail
 * @returns Informações sobre o envio do e-mail
 */
export async function sendEmail(to: string, subject: string, html: string) {
  try {
    // Se o transporter ainda não estiver inicializado, inicializa
    if (!transporter) {
      await initializeTransporter();
    }
    
    const fromEmail = process.env.EMAIL_FROM || 'sistema@muricilogistica.com.br';
    const fromName = process.env.EMAIL_FROM_NAME || 'Sistema Murici Logística';
    
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    });
    
    // Para testes em desenvolvimento, mostra a URL de preview
    if (info.messageId && process.env.NODE_ENV !== 'production') {
      console.log('URL de preview do e-mail:', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    throw error;
  }
}