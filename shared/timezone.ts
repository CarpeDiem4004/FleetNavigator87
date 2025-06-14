/**
 * Utilitários centralizados para manipulação de timezone
 * Garante que todas as datas sejam tratadas com fuso horário do Brasil (America/Sao_Paulo)
 */

// Timezone padrão do sistema
export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

// Configuração do locale brasileiro
export const BRAZIL_LOCALE = 'pt-BR';

/**
 * Converte uma data para o timezone do Brasil
 */
export function toBrazilTime(date: Date | string): Date {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  
  // Cria uma nova data com timezone correto
  return new Date(inputDate.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }));
}

/**
 * Formata uma data para exibição no formato brasileiro com timezone correto
 */
export function formatBrazilDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options
  };
  
  return inputDate.toLocaleDateString(BRAZIL_LOCALE, defaultOptions);
}

/**
 * Formata uma data e hora para exibição no formato brasileiro com timezone correto
 */
export function formatBrazilDateTime(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    ...options
  };
  
  return inputDate.toLocaleString(BRAZIL_LOCALE, defaultOptions);
}

/**
 * Formata apenas a hora no formato brasileiro com timezone correto
 */
export function formatBrazilTime(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: BRAZIL_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  return inputDate.toLocaleTimeString(BRAZIL_LOCALE, defaultOptions);
}

/**
 * Obtém a data atual no timezone do Brasil
 */
export function nowInBrazil(): Date {
  return toBrazilTime(new Date());
}

/**
 * Converte uma data do Brasil para UTC para armazenamento no banco
 */
export function brazilToUTC(date: Date | string): Date {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  
  // Se a data já está em UTC (como do banco), retorna como está
  if (typeof date === 'string' && date.endsWith('Z')) {
    return new Date(date);
  }
  
  // Converte para UTC considerando o timezone do Brasil
  const brazilOffset = getBrazilTimezoneOffset(inputDate);
  return new Date(inputDate.getTime() + (brazilOffset * 60000));
}

/**
 * Obtém o offset do timezone do Brasil em minutos
 */
function getBrazilTimezoneOffset(date: Date): number {
  const utc = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 
                      date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
  const brazil = new Date(utc.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }));
  
  return (utc.getTime() - brazil.getTime()) / 60000;
}

/**
 * Cria uma data específica no timezone do Brasil
 */
export function createBrazilDate(year: number, month: number, day: number, 
                                hour: number = 0, minute: number = 0, second: number = 0): Date {
  // Cria a data no timezone do Brasil
  const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
  
  // Cria um objeto Date temporário para obter o timestamp correto
  const tempDate = new Date(dateString);
  const brazilTime = new Date(tempDate.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }));
  
  // Ajusta para o timezone correto
  const offset = tempDate.getTime() - brazilTime.getTime();
  return new Date(tempDate.getTime() + offset);
}

/**
 * Valida se uma string de data está no formato correto
 */
export function isValidDateString(dateString: string): boolean {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Converte data para string ISO no timezone do Brasil
 */
export function toBrazilISOString(date: Date | string): string {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  const brazilDate = toBrazilTime(inputDate);
  
  // Retorna a data no formato ISO mas com timezone do Brasil
  const year = brazilDate.getFullYear();
  const month = (brazilDate.getMonth() + 1).toString().padStart(2, '0');
  const day = brazilDate.getDate().toString().padStart(2, '0');
  const hour = brazilDate.getHours().toString().padStart(2, '0');
  const minute = brazilDate.getMinutes().toString().padStart(2, '0');
  const second = brazilDate.getSeconds().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

/**
 * Formata data para input datetime-local
 */
export function toDateTimeLocalValue(date: Date | string): string {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  const brazilDate = toBrazilTime(inputDate);
  
  const year = brazilDate.getFullYear();
  const month = (brazilDate.getMonth() + 1).toString().padStart(2, '0');
  const day = brazilDate.getDate().toString().padStart(2, '0');
  const hour = brazilDate.getHours().toString().padStart(2, '0');
  const minute = brazilDate.getMinutes().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Formata data para input date
 */
export function toDateInputValue(date: Date | string): string {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  const brazilDate = toBrazilTime(inputDate);
  
  const year = brazilDate.getFullYear();
  const month = (brazilDate.getMonth() + 1).toString().padStart(2, '0');
  const day = brazilDate.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}