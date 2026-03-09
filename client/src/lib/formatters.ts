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
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR').format(dateObj);
}

/**
 * Formata uma data com horas no padrão brasileiro (DD/MM/YYYY HH:MM)
 * @param date - A data a ser formatada
 * @returns String formatada no padrão DD/MM/YYYY HH:MM
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
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
  return `${value.toFixed(1).replace('.', ',')} L`;
}

/**
 * Formata um percentual
 * @param value - O valor percentual (0-100)
 * @returns String formatada (ex: 75%)
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(0)}%`;
}

/**
 * Formata um número para exibição em português
 * @param value - O valor numérico
 * @returns String formatada com separador de milhares
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Formata uma distância em quilômetros
 * @param value - O valor em quilômetros
 * @returns String formatada (ex: 10.500 km)
 */
export function formatDistance(value: number): string {
  return `${new Intl.NumberFormat('pt-BR').format(value)} km`;
}

/**
 * Trunca uma string caso exceda o tamanho máximo
 * @param text - O texto a ser truncado
 * @param maxLength - Tamanho máximo permitido
 * @returns String truncada com reticências
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}