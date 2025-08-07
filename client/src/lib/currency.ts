/**
 * Utilitários para formatação de moeda brasileira
 */

/**
 * Formata um valor numérico para moeda brasileira (Real)
 * @param value - Valor numérico ou string para formatar
 * @returns String formatada como R$ 1.234,56
 */
export function formatCurrency(value: number | string): string {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) {
    return 'R$ 0,00';
  }
  
  return numericValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Formata um valor numérico para moeda brasileira sem símbolo
 * @param value - Valor numérico ou string para formatar
 * @returns String formatada como 1.234,56
 */
export function formatCurrencyValue(value: number | string): string {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) {
    return '0,00';
  }
  
  return numericValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Converte string formatada para número
 * @param formattedValue - String formatada como "R$ 1.234,56" ou "1.234,56"
 * @returns Número convertido
 */
export function parseCurrency(formattedValue: string): number {
  if (!formattedValue) return 0;
  
  // Remove símbolos e espaços, substitui vírgula por ponto
  const cleaned = formattedValue
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  return parseFloat(cleaned) || 0;
}