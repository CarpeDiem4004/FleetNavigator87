/**
 * Hook para manipulação de timezone do Brasil no frontend
 * Centraliza todas as operações de data/hora com fuso horário correto
 */

import { useMemo } from 'react';
import { 
  BRAZIL_TIMEZONE, 
  BRAZIL_LOCALE,
  formatBrazilDate, 
  formatBrazilDateTime, 
  formatBrazilTime,
  toBrazilTime,
  nowInBrazil,
  toDateTimeLocalValue,
  toDateInputValue,
  toBrazilISOString
} from '@shared/timezone';

export function useBrazilTimezone() {
  const timezone = useMemo(() => ({
    // Constantes
    TIMEZONE: BRAZIL_TIMEZONE,
    LOCALE: BRAZIL_LOCALE,
    
    // Funções de formatação
    formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => 
      formatBrazilDate(date, options),
    
    formatDateTime: (date: Date | string, options?: Intl.DateTimeFormatOptions) => 
      formatBrazilDateTime(date, options),
    
    formatTime: (date: Date | string, options?: Intl.DateTimeFormatOptions) => 
      formatBrazilTime(date, options),
    
    // Conversões de timezone
    toBrazilTime: (date: Date | string) => toBrazilTime(date),
    
    // Data atual
    now: () => nowInBrazil(),
    
    // Para inputs HTML
    toDateTimeLocal: (date: Date | string) => toDateTimeLocalValue(date),
    toDateInput: (date: Date | string) => toDateInputValue(date),
    
    // Para envio ao backend
    toISOString: (date: Date | string) => toBrazilISOString(date),
    
    // Formatações específicas comuns
    formatDateOnly: (date: Date | string) => 
      formatBrazilDate(date, { day: '2-digit', month: '2-digit', year: 'numeric' }),
    
    formatTimeOnly: (date: Date | string) => 
      formatBrazilTime(date, { hour: '2-digit', minute: '2-digit' }),
    
    formatFullDateTime: (date: Date | string) => 
      formatBrazilDateTime(date, { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    
    formatShortDateTime: (date: Date | string) => 
      formatBrazilDateTime(date, { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    
    // Para relatórios
    formatReportDate: (date: Date | string) => 
      formatBrazilDate(date, { 
        weekday: 'long',
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      }),
    
    // Validações
    isValid: (date: Date | string) => {
      if (!date) return false;
      const d = typeof date === 'string' ? new Date(date) : date;
      return !isNaN(d.getTime());
    },
    
    // Comparações (considerando timezone do Brasil)
    isSameDay: (date1: Date | string, date2: Date | string) => {
      const d1 = toBrazilTime(date1);
      const d2 = toBrazilTime(date2);
      return d1.toDateString() === d2.toDateString();
    },
    
    isToday: (date: Date | string) => {
      return timezone.isSameDay(date, nowInBrazil());
    },
    
    // Diferenças de tempo
    getMinutesDiff: (date1: Date | string, date2: Date | string) => {
      const d1 = toBrazilTime(date1);
      const d2 = toBrazilTime(date2);
      return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60));
    },
    
    getHoursDiff: (date1: Date | string, date2: Date | string) => {
      return Math.floor(timezone.getMinutesDiff(date1, date2) / 60);
    },
    
    getDaysDiff: (date1: Date | string, date2: Date | string) => {
      return Math.floor(timezone.getHoursDiff(date1, date2) / 24);
    }
  }), []);

  return timezone;
}

// Hook específico para formatação de listas/tabelas
export function useTableTimezone() {
  const tz = useBrazilTimezone();
  
  return useMemo(() => ({
    // Para colunas de tabela
    formatTableDate: (date: Date | string) => {
      if (!date) return '-';
      return tz.formatDateOnly(date);
    },
    
    formatTableDateTime: (date: Date | string) => {
      if (!date) return '-';
      return tz.formatShortDateTime(date);
    },
    
    formatTableTime: (date: Date | string) => {
      if (!date) return '-';
      return tz.formatTimeOnly(date);
    },
    
    // Para indicadores de tempo relativo
    getRelativeTime: (date: Date | string) => {
      if (!date) return '-';
      
      const now = tz.now();
      const target = tz.toBrazilTime(date);
      const diffMinutes = tz.getMinutesDiff(target, now);
      
      if (diffMinutes < 1) return 'Agora';
      if (diffMinutes < 60) return `${diffMinutes}min atrás`;
      
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h atrás`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d atrás`;
      
      return tz.formatDateOnly(date);
    }
  }), [tz]);
}

// Hook para formulários com campos de data
export function useFormTimezone() {
  const tz = useBrazilTimezone();
  
  return useMemo(() => ({
    // Prepara valor para input datetime-local
    prepareForDateTimeInput: (date: Date | string | null) => {
      if (!date) return '';
      return tz.toDateTimeLocal(date);
    },
    
    // Prepara valor para input date
    prepareForDateInput: (date: Date | string | null) => {
      if (!date) return '';
      return tz.toDateInput(date);
    },
    
    // Processa valor do input para envio
    processInputValue: (value: string) => {
      if (!value) return null;
      const date = new Date(value);
      return tz.isValid(date) ? tz.toISOString(date) : null;
    },
    
    // Valor padrão para "agora"
    getCurrentForInput: () => tz.toDateTimeLocal(tz.now()),
    getCurrentDateForInput: () => tz.toDateInput(tz.now())
  }), [tz]);
}