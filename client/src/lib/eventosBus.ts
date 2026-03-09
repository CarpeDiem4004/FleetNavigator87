/**
 * Sistema de EventBus para comunicação entre componentes
 * Especialmente útil para coordenar atualizações de histórico
 */

type Listener = (data?: any) => void;

interface EventBus {
  listeners: Record<string, Listener[]>;
  subscribe: (event: string, callback: Listener) => void;
  unsubscribe: (event: string, callback: Listener) => void;
  publish: (event: string, data?: any) => void;
}

const eventosBus: EventBus = {
  listeners: {},

  /**
   * Inscreve um callback para um tipo de evento
   */
  subscribe(event: string, callback: Listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },

  /**
   * Remove a inscrição de um callback para um tipo de evento
   */
  unsubscribe(event: string, callback: Listener) {
    if (!this.listeners[event]) return;
    
    this.listeners[event] = this.listeners[event].filter(
      (listener) => listener !== callback
    );
  },

  /**
   * Publica um evento com dados opcionais
   */
  publish(event: string, data?: any) {
    console.log(`[EventBus] Publicando evento: ${event}`, data);
    
    if (!this.listeners[event]) return;
    
    this.listeners[event].forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[EventBus] Erro ao executar callback para evento ${event}:`, error);
      }
    });
  }
};

// Definir constantes para os tipos de eventos
export const EVENTOS = {
  ABASTECIMENTO_REGISTRADO: 'abastecimento_registrado',
  HISTORICO_ATUALIZADO: 'historico_atualizado',
  TANQUE_ATUALIZADO: 'tanque_atualizado',
  NOVO_ABASTECIMENTO: 'novo_abastecimento',
};

export default eventosBus;