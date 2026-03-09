/**
 * Utilitários de timezone para o frontend
 * Garante que todas as datas exibidas sejam sempre no horário brasileiro
 */

const BRAZIL_TIMEZONE = 'America/Sao_Paulo';
const BRAZIL_LOCALE = 'pt-BR';

/**
 * Obtém a data atual no timezone brasileiro
 */
export function getCurrentBrazilTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }));
}

/**
 * Converte uma data para o timezone brasileiro
 */
export function toBrazilTime(date: Date | string): Date {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  return new Date(inputDate.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }));
}

/**
 * Formata uma data no padrão brasileiro (DD/MM/AAAA)
 */
export function formatBrazilDate(date: Date | string): string {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  return inputDate.toLocaleDateString(BRAZIL_LOCALE, {
    timeZone: BRAZIL_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formata uma data e hora no padrão brasileiro (DD/MM/AAAA HH:MM:SS)
 */
export function formatBrazilDateTime(date: Date | string): string {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  return inputDate.toLocaleString(BRAZIL_LOCALE, {
    timeZone: BRAZIL_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Formata apenas a hora no padrão brasileiro (HH:MM)
 */
export function formatBrazilTime(date: Date | string): string {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  return inputDate.toLocaleTimeString(BRAZIL_LOCALE, {
    timeZone: BRAZIL_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Converte uma data para string ISO no timezone brasileiro
 */
export function toBrazilISOString(date: Date | string): string {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  const brazilDate = toBrazilTime(inputDate);
  
  return brazilDate.toISOString().slice(0, 19); // Remove o Z do final
}

/**
 * Formata data para input datetime-local no timezone brasileiro
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
 * Formata data para input date no timezone brasileiro
 */
export function toDateInputValue(date: Date | string): string {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  const brazilDate = toBrazilTime(inputDate);
  
  const year = brazilDate.getFullYear();
  const month = (brazilDate.getMonth() + 1).toString().padStart(2, '0');
  const day = brazilDate.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Converte data brasileira para UTC (para enviar ao servidor)
 */
export function brazilToUTC(date: Date | string): Date {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  
  // Obtém o offset do timezone brasileiro
  const temp = new Date(inputDate.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }));
  const offset = inputDate.getTime() - temp.getTime();
  
  return new Date(inputDate.getTime() - offset);
}

/**
 * Inicializa as configurações de timezone brasileiro para o frontend
 */
export function initializeBrazilTimezone(): void {
  console.log(`[Frontend] Timezone configurado para: ${BRAZIL_TIMEZONE}`);
  
  // Definir configurações globais para o timezone brasileiro
  if (typeof window !== 'undefined') {
    // Armazenar configuração no window para uso global
    (window as any).BRAZIL_TIMEZONE_CONFIG = {
      timezone: BRAZIL_TIMEZONE,
      locale: BRAZIL_LOCALE,
      initialized: true
    };
    
    // Log data atual sem causar recursão
    const now = new Date();
    const brazilDate = now.toLocaleString(BRAZIL_LOCALE, { timeZone: BRAZIL_TIMEZONE });
    console.log(`[Frontend] Data atual: ${brazilDate}`);
  }
}

/**
 * Processa um objeto convertendo todas as datas para timezone brasileiro
 */
export function processApiDates(data: any): any {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => processApiDates(item));
  }
  
  if (typeof data === 'object') {
    const processed: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && isDateString(value)) {
        processed[key] = formatBrazilDateTime(value);
      } else if (value instanceof Date) {
        processed[key] = formatBrazilDateTime(value);
      } else if (typeof value === 'object') {
        processed[key] = processApiDates(value);
      } else {
        processed[key] = value;
      }
    }
    
    return processed;
  }
  
  return data;
}

/**
 * Verifica se uma string é uma data válida
 */
function isDateString(str: string): boolean {
  if (typeof str !== 'string') return false;
  
  // Padrões comuns de data
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO format
    /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}/ // DD/MM/YYYY
  ];
  
  return datePatterns.some(pattern => pattern.test(str)) && !isNaN(new Date(str).getTime());
}

/**
 * Hook personalizado para usar datas brasileiras
 */
export function useBrazilDate() {
  return {
    getCurrentTime: getCurrentBrazilTime,
    formatDate: formatBrazilDate,
    formatDateTime: formatBrazilDateTime,
    formatTime: formatBrazilTime,
    toDateTimeLocal: toDateTimeLocalValue,
    toDateInput: toDateInputValue,
    toBrazilTime,
    toUTC: brazilToUTC
  };
}

export {
  BRAZIL_TIMEZONE,
  BRAZIL_LOCALE
};