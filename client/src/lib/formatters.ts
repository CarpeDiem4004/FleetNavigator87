/**
 * Formata um valor numérico em formato de moeda (R$)
 * @param value - O valor a ser formatado
 * @returns String formatada no padrão de moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata uma data no padrão brasileiro (DD/MM/YYYY)
 * @param date - A data a ser formatada
 * @returns String formatada no padrão DD/MM/YYYY
 */
export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Formata uma data com horas no padrão brasileiro (DD/MM/YYYY HH:MM)
 * @param date - A data a ser formatada
 * @returns String formatada no padrão DD/MM/YYYY HH:MM
 */
export function formatDateTime(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Formata um número com duas casas decimais
 * @param value - O valor a ser formatado
 * @returns String com duas casas decimais
 */
export function formatDecimal(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

/**
 * Formata um volume em litros
 * @param value - O valor em litros
 * @returns String formatada (ex: 10,5 L)
 */
export function formatVolume(value: number): string {
  return `${formatDecimal(value)} L`;
}

/**
 * Formata um percentual
 * @param value - O valor percentual (0-100)
 * @returns String formatada (ex: 75%)
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}