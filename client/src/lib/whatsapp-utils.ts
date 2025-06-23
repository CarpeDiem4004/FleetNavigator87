/**
 * Utilitários para integração com WhatsApp Web
 * Sistema de resposta automática para solicitações de saldo de cartões combustível
 */

export interface WhatsAppMessage {
  phoneNumber: string;
  message: string;
}

/**
 * Formatar número de telefone para padrão internacional
 * Remove caracteres especiais e adiciona código do país se necessário
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Se já começa com 55 (código do Brasil), retorna como está
  if (cleanPhone.startsWith('55')) {
    return cleanPhone;
  }
  
  // Se tem 11 dígitos (celular brasileiro), adiciona código do país
  if (cleanPhone.length === 11) {
    return `55${cleanPhone}`;
  }
  
  // Se tem 10 dígitos (fixo brasileiro), adiciona código do país
  if (cleanPhone.length === 10) {
    return `55${cleanPhone}`;
  }
  
  // Para outros casos, assume que já está no formato correto
  return cleanPhone;
}

/**
 * Gerar mensagem padrão para resposta de saldo de cartão combustível
 */
export function generateFuelCardMessage(
  motorista: string,
  placa: string,
  status: string,
  valorSolicitado?: number,
  observacoes?: string
): string {
  let message = `Olá ${motorista}!\n\n`;
  
  switch (status.toLowerCase()) {
    case 'recarga efetuada':
      message += `✅ Sua solicitação de recarga foi APROVADA!\n\n`;
      message += `🚛 Veículo: ${placa}\n`;
      if (valorSolicitado) {
        message += `💰 Valor: R$ ${valorSolicitado.toFixed(2)}\n`;
      }
      message += `\n📋 Status: Recarga efetuada com sucesso\n`;
      if (observacoes) {
        message += `\n📝 Observações: ${observacoes}\n`;
      }
      message += `\nJá pode abastecer! 🚀`;
      break;
      
    case 'em análise':
      message += `⏳ Sua solicitação está EM ANÁLISE\n\n`;
      message += `🚛 Veículo: ${placa}\n`;
      if (valorSolicitado) {
        message += `💰 Valor solicitado: R$ ${valorSolicitado.toFixed(2)}\n`;
      }
      message += `\n📋 Nossa equipe está analisando sua solicitação.\n`;
      message += `Em breve você receberá uma resposta. 📞`;
      break;
      
    case 'negado':
      message += `❌ Sua solicitação foi NEGADA\n\n`;
      message += `🚛 Veículo: ${placa}\n`;
      if (valorSolicitado) {
        message += `💰 Valor solicitado: R$ ${valorSolicitado.toFixed(2)}\n`;
      }
      if (observacoes) {
        message += `\n📝 Motivo: ${observacoes}\n`;
      }
      message += `\nEntre em contato para mais informações. 📞`;
      break;
      
    default:
      message += `📋 Atualização sobre sua solicitação de recarga\n\n`;
      message += `🚛 Veículo: ${placa}\n`;
      if (valorSolicitado) {
        message += `💰 Valor: R$ ${valorSolicitado.toFixed(2)}\n`;
      }
      message += `📊 Status: ${status}\n`;
      if (observacoes) {
        message += `\n📝 Informações: ${observacoes}\n`;
      }
  }
  
  message += `\n\n---\n📱 Mensagem automática do Sistema de Gestão de Frota`;
  
  return message;
}

/**
 * Gerar URL do WhatsApp Web com mensagem pré-formatada
 */
export function generateWhatsAppURL(phoneNumber: string, message: string): string {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

/**
 * Abrir WhatsApp Web em nova aba
 */
export function openWhatsAppWeb(phoneNumber: string, message: string): void {
  const url = generateWhatsAppURL(phoneNumber, message);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Verificar se um número de telefone é válido
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Aceita números com 10, 11 dígitos (Brasil) ou com código do país
  return cleanPhone.length >= 10 && cleanPhone.length <= 15;
}

/**
 * Extrair número de telefone de texto com observações
 * Busca padrões comuns de telefone em strings
 */
export function extractPhoneFromText(text: string): string | null {
  if (!text) return null;
  
  // Padrões comuns de telefone brasileiro
  const phonePatterns = [
    /(?:Tel(?:efone)?:?\s*)?(?:\+?55\s*)?(?:\(?)(\d{2})(?:\)?)?\s*(?:9?\d{4})[^\d]*(\d{4})/gi,
    /(?:\+?55\s*)?(?:\(?)(\d{2})(?:\)?)?\s*(?:9)(\d{4})[^\d]*(\d{4})/gi,
    /(?:\(?)(\d{2})(?:\)?)?\s*(\d{4,5})[^\d]*(\d{4})/gi
  ];
  
  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match && match[0]) {
      // Limpar e formatar o número encontrado
      const cleanNumber = match[0].replace(/\D/g, '');
      if (cleanNumber.length >= 10) {
        return cleanNumber;
      }
    }
  }
  
  return null;
}

/**
 * Verificar se a solicitação é do Line Hall (deve ser excluída do WhatsApp)
 */
export function isLineHallRequest(solicitation: any): boolean {
  return (
    solicitation.origem_tipo === 'line_hall' ||
    solicitation.base?.toLowerCase().includes('line hall') ||
    solicitation.tipo_cartao?.toLowerCase().includes('line hall')
  );
}