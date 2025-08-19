import { useState, useEffect } from "react";

// Define o tipo de retorno do hook
export interface UseFetchWithAuthReturn {
  isReady: boolean;
  lastError: Error | null;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export function useFetchWithAuth(): UseFetchWithAuthReturn {
  const [isReady, setIsReady] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  // Marca o hook como "pronto" após a inicialização
  useEffect(() => {
    setIsReady(true);
  }, []);

  // Função para fazer fetch com token de autenticação do localStorage
  async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
    try {
      const headers = new Headers(options.headers);

      // Tentar pegar o token do localStorage
      const token = localStorage.getItem("auth_token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      return response;
    } catch (error) {
      setLastError(error as Error);
      throw error;
    }
  }

  return { isReady, lastError, apiFetch };
}

export default useFetchWithAuth;