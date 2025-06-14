/**
 * Utilitários de timezone para o backend
 * Garante que todas as operações de data/hora usem o fuso horário do Brasil
 */

const BRAZIL_TIMEZONE = 'America/Sao_Paulo';
const BRAZIL_LOCALE = 'pt-BR';

/**
 * Converte uma data para o timezone do Brasil
 */
function toBrazilTime(date) {
  if (!date) return null;
  
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(inputDate.getTime())) return null;
  
  // Cria uma nova data com timezone correto
  return new Date(inputDate.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }));
}

/**
 * Formata uma data para exibição no formato brasileiro com timezone correto
 */
function formatBrazilDate(date, options = {}) {
  if (!date) return '';
  
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(inputDate.getTime())) return '';
  
  const defaultOptions = {
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
function formatBrazilDateTime(date, options = {}) {
  if (!date) return '';
  
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(inputDate.getTime())) return '';
  
  const defaultOptions = {
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
function formatBrazilTime(date, options = {}) {
  if (!date) return '';
  
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(inputDate.getTime())) return '';
  
  const defaultOptions = {
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
function nowInBrazil() {
  return toBrazilTime(new Date());
}

/**
 * Converte uma data do Brasil para UTC para armazenamento no banco
 */
function brazilToUTC(date) {
  if (!date) return null;
  
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(inputDate.getTime())) return null;
  
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
function getBrazilTimezoneOffset(date) {
  const utc = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 
                      date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
  const brazil = new Date(utc.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }));
  
  return (utc.getTime() - brazil.getTime()) / 60000;
}

/**
 * Cria uma data específica no timezone do Brasil
 */
function createBrazilDate(year, month, day, hour = 0, minute = 0, second = 0) {
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
 * Converte data para string ISO no timezone do Brasil
 */
function toBrazilISOString(date) {
  if (!date) return '';
  
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(inputDate.getTime())) return '';
  
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
 * Configura o timezone padrão do processo Node.js
 */
function configureBrazilTimezone() {
  // Define o timezone padrão do processo
  process.env.TZ = BRAZIL_TIMEZONE;
  
  console.log(`[Timezone] Configurado para: ${BRAZIL_TIMEZONE}`);
  console.log(`[Timezone] Data atual: ${formatBrazilDateTime(new Date())}`);
}

/**
 * Middleware para adicionar funções de timezone ao objeto req
 */
function timezoneMiddleware(req, res, next) {
  req.timezone = {
    toBrazilTime,
    formatBrazilDate,
    formatBrazilDateTime,
    formatBrazilTime,
    nowInBrazil,
    brazilToUTC,
    createBrazilDate,
    toBrazilISOString
  };
  next();
}

/**
 * Processa resultados de query do banco para converter datas
 */
function processDatabaseDates(rows, dateColumns = []) {
  if (!Array.isArray(rows)) return rows;
  
  return rows.map(row => {
    const processedRow = { ...row };
    
    // Processa colunas específicas de data
    dateColumns.forEach(column => {
      if (processedRow[column]) {
        processedRow[column] = toBrazilTime(processedRow[column]);
      }
    });
    
    // Processa automaticamente colunas comuns de data
    const commonDateColumns = ['created_at', 'updated_at', 'data', 'timestamp', 'data_hora'];
    commonDateColumns.forEach(column => {
      if (processedRow[column] && !dateColumns.includes(column)) {
        processedRow[column] = toBrazilTime(processedRow[column]);
      }
    });
    
    return processedRow;
  });
}

export {
  BRAZIL_TIMEZONE,
  BRAZIL_LOCALE,
  toBrazilTime,
  formatBrazilDate,
  formatBrazilDateTime,
  formatBrazilTime,
  nowInBrazil,
  brazilToUTC,
  createBrazilDate,
  toBrazilISOString,
  configureBrazilTimezone,
  timezoneMiddleware,
  processDatabaseDates
};