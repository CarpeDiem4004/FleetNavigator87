/**
 * Utilitários de timezone para frontend seguindo as melhores práticas
 * FRONTEND: Recebe UTC do backend e converte para timezone local (Brasil)
 * BACKEND: Trabalha exclusivamente com UTC
 */

const BRAZIL_TIMEZONE = 'America/Sao_Paulo';
const BRAZIL_LOCALE = 'pt-BR';

/**
 * Converte uma data UTC para o timezone brasileiro
 */
export function utcToBrazilTime(utcDate: Date | string): Date {
  if (!utcDate) return new Date();
  
  const inputDate = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  if (isNaN(inputDate.getTime())) return new Date();
  
  // Converte UTC para timezone brasileiro
  return new Date(inputDate.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }));
}

/**
 * Formata uma data UTC para exibição no formato brasileiro
 */
export function formatUTCToBrazilDate(utcDate: Date | string): string {
  if (!utcDate) return '';
  
  const inputDate = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  if (isNaN(inputDate.getTime())) return '';
  
  return inputDate.toLocaleDateString(BRAZIL_LOCALE, {
    timeZone: BRAZIL_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formata uma data UTC para exibição no formato brasileiro com hora
 */
export function formatUTCToBrazilDateTime(utcDate: Date | string): string {
  if (!utcDate) return '';
  
  const inputDate = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  if (isNaN(inputDate.getTime())) return '';
  
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
 * Formata apenas a hora de uma data UTC para o timezone brasileiro
 */
export function formatUTCToBrazilTime(utcDate: Date | string): string {
  if (!utcDate) return '';
  
  const inputDate = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  if (isNaN(inputDate.getTime())) return '';
  
  return inputDate.toLocaleTimeString(BRAZIL_LOCALE, {
    timeZone: BRAZIL_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Converte uma data local brasileira para UTC (para enviar ao backend)
 */
export function brazilToUTC(brazilDate: Date | string): string {
  if (!brazilDate) return new Date().toISOString();
  
  const inputDate = typeof brazilDate === 'string' ? new Date(brazilDate) : brazilDate;
  if (isNaN(inputDate.getTime())) return new Date().toISOString();
  
  // Se a data já está em UTC, retorna como está
  if (typeof brazilDate === 'string' && brazilDate.endsWith('Z')) {
    return brazilDate;
  }
  
  // Converte data local brasileira para UTC
  return inputDate.toISOString();
}

/**
 * Obtém a data atual no timezone brasileiro
 */
export function getCurrentBrazilTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }));
}

/**
 * Formata data UTC para input datetime-local (considera timezone brasileiro)
 */
export function utcToDateTimeLocalValue(utcDate: Date | string): string {
  if (!utcDate) return '';
  
  const inputDate = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  if (isNaN(inputDate.getTime())) return '';
  
  const brazilDate = utcToBrazilTime(inputDate);
  
  const year = brazilDate.getFullYear();
  const month = (brazilDate.getMonth() + 1).toString().padStart(2, '0');
  const day = brazilDate.getDate().toString().padStart(2, '0');
  const hour = brazilDate.getHours().toString().padStart(2, '0');
  const minute = brazilDate.getMinutes().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Formata data UTC para input date (considera timezone brasileiro)
 */
export function utcToDateInputValue(utcDate: Date | string): string {
  if (!utcDate) return '';
  
  const inputDate = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  if (isNaN(inputDate.getTime())) return '';
  
  const brazilDate = utcToBrazilTime(inputDate);
  
  const year = brazilDate.getFullYear();
  const month = (brazilDate.getMonth() + 1).toString().padStart(2, '0');
  const day = brazilDate.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Processa dados da API convertendo datas UTC para timezone brasileiro
 */
export function processApiDates(data: any): any {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => processApiDates(item));
  }
  
  if (typeof data === 'object') {
    const processed: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && isUTCDateString(value)) {
        // Mantém o valor original para processamento posterior
        processed[key] = value;
      } else if (value instanceof Date) {
        processed[key] = value.toISOString();
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
 * Verifica se uma string é uma data UTC válida
 */
function isUTCDateString(str: string): boolean {
  if (typeof str !== 'string') return false;
  
  // Padrões de data UTC
  const utcPatterns = [
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/, // ISO UTC format
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?$/, // ISO without Z
  ];
  
  return utcPatterns.some(pattern => pattern.test(str)) && !isNaN(new Date(str).getTime());
}

/**
 * Converte valor de input datetime-local para UTC
 */
export function dateTimeLocalToUTC(value: string): string {
  if (!value) return new Date().toISOString();
  
  // Assume que o valor está no timezone brasileiro
  const localDate = new Date(value);
  
  // Converte para UTC considerando o timezone brasileiro
  const utcDate = new Date(localDate.toLocaleString('en-US', { timeZone: 'UTC' }));
  
  return utcDate.toISOString();
}

/**
 * Hook personalizado para usar datas com conversão UTC/Brasil
 */
export function useBrazilDateTime() {
  return {
    formatDate: formatUTCToBrazilDate,
    formatDateTime: formatUTCToBrazilDateTime,
    formatTime: formatUTCToBrazilTime,
    getCurrentTime: getCurrentBrazilTime,
    toDateTimeLocal: utcToDateTimeLocalValue,
    toDateInput: utcToDateInputValue,
    toUTC: brazilToUTC,
    fromUTC: utcToBrazilTime,
    processApiData: processApiDates
  };
}

/**
 * Inicializa configurações de timezone brasileiro
 */
export function initializeBrazilTimezone(): void {
  console.log(`[Frontend] Timezone configurado para: ${BRAZIL_TIMEZONE}`);
  
  if (typeof window !== 'undefined') {
    (window as any).BRAZIL_TIMEZONE_CONFIG = {
      timezone: BRAZIL_TIMEZONE,
      locale: BRAZIL_LOCALE,
      initialized: true
    };
    
    const now = new Date();
    const brazilDate = now.toLocaleString(BRAZIL_LOCALE, { timeZone: BRAZIL_TIMEZONE });
    console.log(`[Frontend] Data atual: ${brazilDate}`);
  }
}

export {
  BRAZIL_TIMEZONE,
  BRAZIL_LOCALE
};