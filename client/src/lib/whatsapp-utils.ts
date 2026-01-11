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
  valorSolicitado?: number | string,
  observacoes?: string,
  motivoNegacao?: string | null,
  provedor?: string | null,
  placaCartao?: string | null,
  dataUso?: string | null
): string {
  let message = `Ola ${motorista}!\n\n`;
  
  const valor = valorSolicitado ? parseFloat(valorSolicitado.toString()) : null;
  
  const formatProvedor = (p: string) => {
    if (p.toLowerCase().includes('veloe')) return 'Veloe';
    if (p.toLowerCase().includes('ticket')) return 'Ticket';
    return p;
  };
  
  switch (status.toLowerCase()) {
    case 'recarga efetuada':
      message += `Sua solicitacao de recarga foi APROVADA!\n\n`;
      message += `Veiculo: ${placa}\n`;
      if (valor && !isNaN(valor)) {
        message += `Valor: R$ ${valor.toFixed(2)}\n`;
      }
      if (provedor) {
        message += `Provedor: ${formatProvedor(provedor)}\n`;
      }
      if (placaCartao) {
        message += `Placa Cartao: ${placaCartao}\n`;
      }
      if (dataUso) {
        message += `Data de Uso: ${dataUso}\n`;
      }
      message += `\nStatus: Recarga efetuada com sucesso\n`;
      if (observacoes) {
        message += `\nObservacoes: ${observacoes}\n`;
      }
      message += `\nJa pode abastecer!`;
      break;
      
    case 'em análise':
      message += `Sua solicitacao esta EM ANALISE\n\n`;
      message += `Veiculo: ${placa}\n`;
      if (valor && !isNaN(valor)) {
        message += `Valor solicitado: R$ ${valor.toFixed(2)}\n`;
      }
      if (provedor) {
        message += `Provedor: ${formatProvedor(provedor)}\n`;
      }
      if (placaCartao) {
        message += `Placa Cartao: ${placaCartao}\n`;
      }
      message += `\nNossa equipe esta analisando sua solicitacao.\n`;
      message += `Em breve voce recebera uma resposta.`;
      break;
      
    case 'negado':
      message += `Sua solicitacao foi NEGADA\n\n`;
      message += `Veiculo: ${placa}\n`;
      if (valor && !isNaN(valor)) {
        message += `Valor solicitado: R$ ${valor.toFixed(2)}\n`;
      }
      if (provedor) {
        message += `Provedor: ${formatProvedor(provedor)}\n`;
      }
      if (placaCartao) {
        message += `Placa Cartao: ${placaCartao}\n`;
      }
      const motivoParaExibir = motivoNegacao && motivoNegacao.trim() ? motivoNegacao : observacoes;
      if (motivoParaExibir) {
        message += `\nMotivo da Negacao: ${motivoParaExibir}\n`;
      }
      message += `\nEntre em contato para mais informacoes.`;
      break;
      
    default:
      message += `Atualizacao sobre sua solicitacao de recarga\n\n`;
      message += `Veiculo: ${placa}\n`;
      if (valor && !isNaN(valor)) {
        message += `Valor: R$ ${valor.toFixed(2)}\n`;
      }
      if (provedor) {
        message += `Provedor: ${formatProvedor(provedor)}\n`;
      }
      if (placaCartao) {
        message += `Placa Cartao: ${placaCartao}\n`;
      }
      message += `Status: ${status}\n`;
      if (observacoes) {
        message += `\nInformacoes: ${observacoes}\n`;
      }
  }
  
  message += `\n\n---\nMensagem automatica do Sistema de Gestao de Frota`;
  
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

/**
 * Gerar mensagem consolidada para aprovação em lote
 * Lista todas as placas aprovadas com saldo disponível
 */
export function generateBatchApprovalMessage(
  approvedSolicitations: Array<{
    placa: string;
    motorista: string;
    valor_solicitado?: number | string;
    provedor_cartao?: string;
    data_abastecimento?: string;
    placa_cartao?: string;
    numero_cartao?: string;
  }>,
  baseName: string
): string {
  const totalApproved = approvedSolicitations.length;
  const totalValue = approvedSolicitations.reduce((sum, sol) => {
    const valor = sol.valor_solicitado ? parseFloat(sol.valor_solicitado.toString()) : 0;
    return sum + (isNaN(valor) ? 0 : valor);
  }, 0);

  let message = `*APROVACAO EM LOTE - ${baseName.toUpperCase()}*\n\n`;
  message += `${totalApproved} solicitacoes foram APROVADAS!\n`;
  message += `Valor total: R$ ${totalValue.toFixed(2)}\n\n`;
  message += `*VEICULOS COM SALDO DISPONIVEL:*\n\n`;

  approvedSolicitations.forEach((sol, index) => {
    const valor = sol.valor_solicitado ? parseFloat(sol.valor_solicitado.toString()) : 0;
    message += `${index + 1}. *${sol.placa}*\n`;
    message += `   Motorista: ${sol.motorista}\n`;
    message += `   Valor: R$ ${isNaN(valor) ? '0.00' : valor.toFixed(2)}\n`;
    
    if (sol.provedor_cartao) {
      const provedor = sol.provedor_cartao.toLowerCase().includes('veloe') ? 'Veloe' : 
                       sol.provedor_cartao.toLowerCase().includes('ticket') ? 'Ticket' : 
                       sol.provedor_cartao;
      message += `   Provedor: ${provedor}\n`;
    }
    
    const placaCartao = sol.placa_cartao || sol.numero_cartao;
    if (placaCartao) {
      message += `   Placa Cartao: ${placaCartao}\n`;
    }
    
    if (sol.data_abastecimento) {
      message += `   Data de Uso: ${sol.data_abastecimento}\n`;
    }
    
    message += `\n`;
  });

  message += `Todos os veiculos ja podem abastecer!\n\n`;
  message += `---\nMensagem automatica do Sistema de Gestao de Frota`;

  return message;
}