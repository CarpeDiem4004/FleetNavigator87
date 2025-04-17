import { useState, useEffect, useCallback, useRef } from 'react';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
}

export default function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectIntervalMs = 3000;

  const connect = useCallback(() => {
    // Construir URL do WebSocket usando o mesmo host/porta do navegador
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log(`Conectando ao WebSocket em: ${wsUrl}`);
    
    // Fechar conexão existente se houver
    if (socketRef.current) {
      socketRef.current.close();
    }
    
    // Criar nova conexão
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    
    socket.onopen = (event) => {
      console.log('Conexão WebSocket estabelecida');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Mensagem WebSocket recebida:', data);
        setMessages(prev => [...prev, data]);
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    };
    
    socket.onclose = (event) => {
      console.log('Conexão WebSocket fechada:', event.code, event.reason);
      setIsConnected(false);
      
      // Tentar reconectar automaticamente
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        console.log(`Tentando reconectar... Tentativa ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
        setTimeout(connect, reconnectIntervalMs);
      } else {
        console.log('Máximo de tentativas de reconexão atingido');
      }
    };
    
    socket.onerror = (event) => {
      console.error('Erro na conexão WebSocket:', event);
    };
    
    return () => {
      socket.close();
    };
  }, []);

  // Enviar mensagem pelo WebSocket
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    } else {
      console.error('Não foi possível enviar mensagem: WebSocket não está conectado');
      return false;
    }
  }, []);

  // Limpar histórico de mensagens
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Conectar ao WebSocket ao montar o componente
  useEffect(() => {
    connect();
    
    // Limpar e fechar conexão ao desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    messages,
    sendMessage,
    clearMessages,
    reconnect: connect
  };
}