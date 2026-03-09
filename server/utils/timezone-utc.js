/**
 * Utilitários de timezone para backend seguindo as melhores práticas
 * BACKEND: Trabalha exclusivamente com UTC
 * FRONTEND: Converte UTC para timezone local (Brasil)
 */

const BRAZIL_TIMEZONE = 'America/Sao_Paulo';
const BRAZIL_LOCALE = 'pt-BR';

/**
 * Obtém a data atual sempre em UTC
 */
function getCurrentUTC() {
  return new Date();
}

/**
 * Converte uma data para UTC se não estiver
 */
function ensureUTC(date) {
  if (!date) return null;
  
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(inputDate.getTime())) return null;
  
  // Se a data já está em UTC (termina com Z ou é um objeto Date), retorna como está
  if (typeof date === 'string' && date.endsWith('Z')) {
    return new Date(date);
  }
  
  // Se é um objeto Date, assume que já está em UTC
  if (date instanceof Date) {
    return new Date(date.getTime());
  }
  
  // Para strings sem timezone, assume UTC
  return new Date(date + 'Z');
}

/**
 * Converte uma data local brasileira para UTC para armazenamento
 */
function brazilToUTC(date) {
  if (!date) return null;
  
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(inputDate.getTime())) return null;
  
  // Se a data já está em UTC, retorna como está
  if (typeof date === 'string' && date.endsWith('Z')) {
    return new Date(date);
  }
  
  // Converte data local brasileira para UTC
  const brazilDate = new Date(inputDate.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }));
  const utcDate = new Date(inputDate.getTime() - (brazilDate.getTime() - inputDate.getTime()));
  
  return utcDate;
}

/**
 * Formata uma data UTC para string ISO
 */
function formatUTCToISO(date) {
  if (!date) return null;
  
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(inputDate.getTime())) return null;
  
  return inputDate.toISOString();
}

/**
 * Middleware para garantir que todas as datas sejam salvas em UTC
 */
function utcMiddleware(req, res, next) {
  // Função helper para converter datas para UTC
  req.ensureUTC = ensureUTC;
  req.getCurrentUTC = getCurrentUTC;
  req.brazilToUTC = brazilToUTC;
  req.formatUTCToISO = formatUTCToISO;
  
  next();
}

/**
 * Processa dados de entrada convertendo datas para UTC
 */
function processInputDates(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => processInputDates(item));
  }
  
  const processed = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Date) {
      processed[key] = value.toISOString();
    } else if (typeof value === 'string' && isDateString(value)) {
      processed[key] = ensureUTC(value)?.toISOString() || value;
    } else if (typeof value === 'object') {
      processed[key] = processInputDates(value);
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
 * Processa resultados de query do banco mantendo UTC
 */
function processDatabaseResults(rows) {
  if (!Array.isArray(rows)) return rows;
  
  return rows.map(row => {
    const processedRow = { ...row };
    
    // Processa automaticamente colunas comuns de data mantendo UTC
    const commonDateColumns = ['created_at', 'updated_at', 'data', 'timestamp', 'data_hora'];
    commonDateColumns.forEach(column => {
      if (processedRow[column]) {
        // Mantém as datas em UTC - conversão será feita no frontend
        processedRow[column] = ensureUTC(processedRow[column])?.toISOString();
      }
    });
    
    return processedRow;
  });
}

/**
 * Cria uma query com timestamp atual em UTC
 */
function getUTCTimestamp() {
  return new Date().toISOString();
}

export {
  getCurrentUTC,
  ensureUTC,
  brazilToUTC,
  formatUTCToISO,
  utcMiddleware,
  processInputDates,
  processDatabaseResults,
  getUTCTimestamp,
  BRAZIL_TIMEZONE,
  BRAZIL_LOCALE
};