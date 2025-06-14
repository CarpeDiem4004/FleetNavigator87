/**
 * Utilitários para links externos com timezone do Brasil
 * Garante que todos os links externos mantenham o horário correto
 */

import { 
  BRAZIL_TIMEZONE, 
  formatBrazilDateTime, 
  formatBrazilDate,
  formatBrazilTime,
  nowInBrazil 
} from '@shared/timezone';

/**
 * Gera parâmetros de URL com timezone do Brasil
 */
export function generateTimezoneParams(date?: Date | string): URLSearchParams {
  const currentDate = date ? (typeof date === 'string' ? new Date(date) : date) : nowInBrazil();
  
  const params = new URLSearchParams();
  params.set('timezone', BRAZIL_TIMEZONE);
  params.set('date', formatBrazilDate(currentDate));
  params.set('time', formatBrazilTime(currentDate));
  params.set('datetime', formatBrazilDateTime(currentDate));
  params.set('timestamp', currentDate.getTime().toString());
  
  return params;
}

/**
 * Adiciona parâmetros de timezone a uma URL existente
 */
export function addTimezoneToUrl(baseUrl: string, date?: Date | string): string {
  const url = new URL(baseUrl);
  const timezoneParams = generateTimezoneParams(date);
  
  // Adiciona parâmetros de timezone
  timezoneParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });
  
  return url.toString();
}

/**
 * Gera URLs para links externos com timezone correto
 */
export function generateExternalUrl(path: string, params: Record<string, string> = {}): string {
  const baseUrl = window.location.origin + path;
  const url = new URL(baseUrl);
  
  // Adiciona parâmetros customizados
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  
  // Adiciona timezone
  return addTimezoneToUrl(url.toString());
}

/**
 * Gera link para abastecimento terceiros com timezone
 */
export function generateTerceirosUrl(empresaId?: string): string {
  const params: Record<string, string> = {};
  
  if (empresaId) {
    params.empresa = empresaId;
  }
  
  return generateExternalUrl('/terceiros/abastecimento', params);
}

/**
 * Gera link para dashboard terceiros com timezone
 */
export function generateTerceirosDashboardUrl(empresaId?: string): string {
  const params: Record<string, string> = {};
  
  if (empresaId) {
    params.empresa = empresaId;
  }
  
  return generateExternalUrl('/terceiros/dashboard', params);
}

/**
 * Gera link para postos externos com timezone
 */
export function generatePostoExternoUrl(postoId: string, tipo: 'abastecimento' | 'recebimento' = 'abastecimento'): string {
  return generateExternalUrl(`/posto/${postoId}/${tipo}`);
}

/**
 * Gera link para mobile com timezone
 */
export function generateMobileUrl(projeto: string, funcionalidade: string): string {
  return generateExternalUrl(`/mobile/${projeto}/${funcionalidade}`);
}

/**
 * Parse parâmetros de timezone de uma URL
 */
export function parseTimezoneFromUrl(url: string): {
  timezone?: string;
  date?: string;
  time?: string;
  datetime?: string;
  timestamp?: number;
} {
  const urlObj = new URL(url);
  const params = urlObj.searchParams;
  
  return {
    timezone: params.get('timezone') || undefined,
    date: params.get('date') || undefined,
    time: params.get('time') || undefined,
    datetime: params.get('datetime') || undefined,
    timestamp: params.get('timestamp') ? parseInt(params.get('timestamp')!) : undefined,
  };
}

/**
 * Valida se uma URL tem timezone correto
 */
export function validateTimezoneInUrl(url: string): boolean {
  const timezoneData = parseTimezoneFromUrl(url);
  return timezoneData.timezone === BRAZIL_TIMEZONE;
}

/**
 * Corrige timezone em uma URL existente
 */
export function fixTimezoneInUrl(url: string): string {
  const urlObj = new URL(url);
  
  // Remove parâmetros de timezone antigos
  urlObj.searchParams.delete('timezone');
  urlObj.searchParams.delete('date');
  urlObj.searchParams.delete('time');
  urlObj.searchParams.delete('datetime');
  urlObj.searchParams.delete('timestamp');
  
  // Adiciona timezone correto
  return addTimezoneToUrl(urlObj.toString());
}

/**
 * Middleware para interceptar e corrigir URLs com timezone
 */
export function interceptAndFixUrls(): void {
  // Intercepta cliques em links
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const link = target.closest('a');
    
    if (link && link.href) {
      const url = new URL(link.href);
      
      // Verifica se é um link externo do sistema
      if (url.hostname === window.location.hostname) {
        const timezoneData = parseTimezoneFromUrl(link.href);
        
        // Se não tem timezone ou está incorreto, corrige
        if (!timezoneData.timezone || timezoneData.timezone !== BRAZIL_TIMEZONE) {
          event.preventDefault();
          const correctedUrl = fixTimezoneInUrl(link.href);
          window.open(correctedUrl, link.target || '_self');
        }
      }
    }
  });
  
  // Intercepta mudanças de localização
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(state, title, url) {
    if (url) {
      const correctedUrl = fixTimezoneInUrl(url.toString());
      return originalPushState.call(this, state, title, correctedUrl);
    }
    return originalPushState.call(this, state, title, url);
  };
  
  history.replaceState = function(state, title, url) {
    if (url) {
      const correctedUrl = fixTimezoneInUrl(url.toString());
      return originalReplaceState.call(this, state, title, correctedUrl);
    }
    return originalReplaceState.call(this, state, title, url);
  };
}

/**
 * Inicializa interceptação automática de URLs
 */
export function initializeTimezoneUrlFix(): void {
  // Executa quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', interceptAndFixUrls);
  } else {
    interceptAndFixUrls();
  }
}

/**
 * Formata URL para exibição com informações de timezone
 */
export function formatUrlWithTimezone(url: string): string {
  const timezoneData = parseTimezoneFromUrl(url);
  
  if (timezoneData.datetime) {
    return `${url} (${timezoneData.datetime} - ${timezoneData.timezone})`;
  }
  
  return url;
}