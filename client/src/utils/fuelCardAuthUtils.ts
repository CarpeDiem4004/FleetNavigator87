/**
 * Utilitário específico para autenticação na página de solicitação de fuel card
 * Simplifica o processo de autenticação para evitar erros de JWT desnecessários
 */

export function isFuelCardSolicitationPage(): boolean {
  return window.location.pathname.includes('/fuel-card/solicitation');
}

export function isPublicPage(): boolean {
  const currentPath = window.location.pathname;
  return currentPath.includes('/login') || 
         currentPath.includes('/register') || 
         currentPath.includes('/fuel-card/solicitation');
}

export function shouldSkipAuthenticationCheck(): boolean {
  return isPublicPage();
}

/**
 * Configuração simplificada de fetch para páginas de fuel card
 * Evita verificações de autenticação desnecessárias
 */
export function createSimpleFetch() {
  return async (url: string, options: RequestInit = {}) => {
    // Para páginas de fuel card, usar fetch normal sem autenticação JWT
    if (isFuelCardSolicitationPage()) {
      console.log('[FuelCardAuth] Usando fetch simplificado para solicitação de fuel card');
      return fetch(url, {
        ...options,
        credentials: 'include', // Manter cookies de sessão
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
    }
    
    // Para outras páginas, usar o comportamento padrão
    return fetch(url, options);
  };
}

/**
 * Limpa tokens JWT inválidos do localStorage para evitar erros
 */
export function clearInvalidTokens() {
  try {
    const authToken = localStorage.getItem('authToken');
    if (authToken && isFuelCardSolicitationPage()) {
      // Para páginas de fuel card, não precisamos de tokens JWT
      console.log('[FuelCardAuth] Limpando token JWT desnecessário para página de fuel card');
      localStorage.removeItem('authToken');
    }
  } catch (error) {
    console.warn('[FuelCardAuth] Erro ao limpar tokens:', error);
  }
}

/**
 * Inicialização para páginas de fuel card
 */
export function initializeFuelCardAuth() {
  if (isFuelCardSolicitationPage()) {
    console.log('[FuelCardAuth] Inicializando autenticação simplificada para fuel card');
    clearInvalidTokens();
    
    // Configurar interceptador de fetch para esta página
    const originalFetch = window.fetch;
    window.fetch = createSimpleFetch();
    
    // Cleanup function para restaurar fetch original
    return () => {
      window.fetch = originalFetch;
    };
  }
  
  return () => {}; // Noop cleanup
}