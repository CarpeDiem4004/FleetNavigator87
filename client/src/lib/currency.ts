/**
 * Utility functions for Brazilian currency formatting
 */

/**
 * Formata um valor numérico para moeda brasileira (R$)
 * @param value - Valor numérico ou string para formatar
 * @returns String formatada em Real brasileiro (R$)
 */
export function formatCurrency(value: number | string): string {
  // Converte string para number se necessário
  const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
  
  // Usa Intl.NumberFormat com configuração brasileira
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
}

/**
 * Formata um valor numérico para moeda brasileira sem o símbolo R$
 * @param value - Valor numérico ou string para formatar
 * @returns String formatada sem o símbolo da moeda
 */
export function formatCurrencyWithoutSymbol(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
}

/**
 * Converte uma string formatada em moeda brasileira para number
 * @param formattedValue - String formatada (ex: "R$ 1.234,56")
 * @returns Valor numérico
 */
export function parseCurrency(formattedValue: string): number {
  // Remove R$, espaços e pontos de milhares, substitui vírgula por ponto
  const cleanValue = formattedValue
    .replace(/R\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  return parseFloat(cleanValue) || 0;
}

/**
 * Valida se uma string está em formato de moeda brasileira válido
 * @param value - String para validar
 * @returns Boolean indicando se é válido
 */
export function isValidCurrency(value: string): boolean {
  // Regex para formato brasileiro: R$ 1.234,56 ou 1.234,56
  const regex = /^(R\$\s?)?(\d{1,3}(\.\d{3})*|\d+)(,\d{2})?$/;
  return regex.test(value.trim());
}