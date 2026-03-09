/**
 * Configuração definitiva de timezone do sistema
 * SOMENTE ADMIN PODE ALTERAR ESTA CONFIGURAÇÃO
 */

const BRAZIL_TIMEZONE = 'America/Sao_Paulo';
const BRAZIL_LOCALE = 'pt-BR';

/**
 * Configura o timezone do sistema de forma permanente
 * Esta função é executada automaticamente na inicialização do servidor
 */
function initializeSystemTimezone() {
  // Força o timezone do processo Node.js
  process.env.TZ = BRAZIL_TIMEZONE;
  
  // Configura o timezone padrão no Intl
  if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
    // Força todos os métodos de formatação a usar o timezone brasileiro
    const originalDateConstructor = Date;
    
    // Override global do Date para sempre usar timezone brasileiro
    global.Date = class extends originalDateConstructor {
      constructor(...args) {
        super(...args);
      }
      
      toLocaleString(locale = BRAZIL_LOCALE, options = {}) {
        return super.toLocaleString(locale, {
          timeZone: BRAZIL_TIMEZONE,
          ...options
        });
      }
      
      toLocaleDateString(locale = BRAZIL_LOCALE, options = {}) {
        return super.toLocaleDateString(locale, {
          timeZone: BRAZIL_TIMEZONE,
          ...options
        });
      }
      
      toLocaleTimeString(locale = BRAZIL_LOCALE, options = {}) {
        return super.toLocaleTimeString(locale, {
          timeZone: BRAZIL_TIMEZONE,
          ...options
        });
      }
    };
  }
  
  // Log de confirmação da configuração
  console.log(`[SISTEMA] Timezone configurado para: ${BRAZIL_TIMEZONE}`);
  console.log(`[SISTEMA] Data atual: ${new Date().toLocaleString(BRAZIL_LOCALE, { timeZone: BRAZIL_TIMEZONE })}`);
  console.log(`[SISTEMA] TZ environment: ${process.env.TZ}`);
  
  // Criar uma função para obter sempre a data atual no timezone brasileiro
  global.getBrazilNow = function() {
    return new Date().toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE });
  };
  
  // Função para formatar datas no padrão brasileiro
  global.formatBrazilDate = function(date) {
    const d = new Date(date);
    return d.toLocaleDateString(BRAZIL_LOCALE, { timeZone: BRAZIL_TIMEZONE });
  };
  
  global.formatBrazilDateTime = function(date) {
    const d = new Date(date);
    return d.toLocaleString(BRAZIL_LOCALE, { timeZone: BRAZIL_TIMEZONE });
  };
}

/**
 * Middleware para garantir que todas as datas sejam processadas no timezone brasileiro
 */
function enforceTimezoneMiddleware(req, res, next) {
  // Intercepta JSON.stringify para converter datas automaticamente
  const originalSend = res.send;
  res.send = function(data) {
    if (typeof data === 'object' && data !== null) {
      // Converte todas as datas para o timezone brasileiro antes de enviar
      const processedData = processObjectDates(data);
      return originalSend.call(this, processedData);
    }
    return originalSend.call(this, data);
  };
  
  next();
}

/**
 * Processa um objeto convertendo todas as datas para o timezone brasileiro
 */
function processObjectDates(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => processObjectDates(item));
  }
  
  const processed = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Date) {
      processed[key] = value.toLocaleString(BRAZIL_LOCALE, { timeZone: BRAZIL_TIMEZONE });
    } else if (typeof value === 'string' && isDateString(value)) {
      const date = new Date(value);
      processed[key] = date.toLocaleString(BRAZIL_LOCALE, { timeZone: BRAZIL_TIMEZONE });
    } else if (typeof value === 'object') {
      processed[key] = processObjectDates(value);
    } else {
      processed[key] = value;
    }
  }
  
  return processed;
}

/**
 * Verifica se uma string é uma data válida
 */
function isDateString(str) {
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
 * Retorna a data e hora atual no timezone brasileiro
 */
function getCurrentBrazilDateTime() {
  return new Date().toLocaleString(BRAZIL_LOCALE, { timeZone: BRAZIL_TIMEZONE });
}

/**
 * Converte qualquer data para o timezone brasileiro
 */
function convertToBrazilTime(date) {
  const d = new Date(date);
  return d.toLocaleString(BRAZIL_LOCALE, { timeZone: BRAZIL_TIMEZONE });
}

export {
  initializeSystemTimezone,
  enforceTimezoneMiddleware,
  getCurrentBrazilDateTime,
  convertToBrazilTime,
  BRAZIL_TIMEZONE,
  BRAZIL_LOCALE
};