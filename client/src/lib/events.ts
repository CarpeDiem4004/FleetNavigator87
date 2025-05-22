/**
 * Sistema de eventos simples para comunicação entre componentes
 * 
 * Este módulo implementa um sistema de eventos pub/sub para permitir
 * que componentes se comuniquem sem acoplamento direto.
 */

type EventHandler = (data: any) => void;

export const EVENTOS = {
  ABASTECIMENTO_REGISTRADO: 'ABASTECIMENTO_REGISTRADO',
  HISTORICO_ATUALIZADO: 'HISTORICO_ATUALIZADO',
  TANQUE_ATUALIZADO: 'TANQUE_ATUALIZADO',
  NOVO_ABASTECIMENTO: 'NOVO_ABASTECIMENTO',
  ATUALIZAR_HISTORICO: 'ATUALIZAR_HISTORICO'
};

class EventBus {
  private events: { [key: string]: EventHandler[] } = {};

  constructor() {
    console.log('EventBus inicializado');
  }

  /**
   * Registra um handler para um evento
   */
  on(event: string, callback: EventHandler) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    console.log(`EventBus: Registrado listener para ${event}, total: ${this.events[event].length}`);
    return this;
  }

  /**
   * Remove um handler de um evento
   */
  off(event: string, callback: EventHandler) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
      console.log(`EventBus: Removido listener de ${event}, restantes: ${this.events[event].length}`);
    }
    return this;
  }

  /**
   * Dispara um evento para todos os handlers registrados
   */
  emit(event: string, data?: any) {
    console.log(`EventBus: Emitindo evento ${event} com dados:`, data);
    if (this.events[event]) {
      this.events[event].forEach(callback => {
        callback(data);
      });
    }
    return this;
  }

  /**
   * Limpa todos os eventos
   */
  clear() {
    this.events = {};
    return this;
  }
}

// Singleton para compartilhar a mesma instância de eventos em toda a aplicação
export const eventosBus = new EventBus();