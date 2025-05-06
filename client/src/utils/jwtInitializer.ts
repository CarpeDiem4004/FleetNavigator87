/**
 * Utilitário para inicializar e gerenciar tokens JWT
 * Este módulo garante que o token JWT seja armazenado consistentemente sob ambos os nomes
 * 'authToken' e 'jwt_token' para compatibilidade com diferentes partes do sistema
 */

// Função para sincronizar os tokens JWT entre os diferentes locais de armazenamento
export function syncJwtToken(): string | null {
  // Verificar se já temos um token JWT armazenado
  const authToken = localStorage.getItem('authToken');
  const jwtToken = localStorage.getItem('jwt_token');
  
  let tokenToUse = null;
  
  // Determinar qual token usar (preferindo 'authToken' se ambos existirem)
  if (authToken) {
    tokenToUse = authToken;
    // Garantir que 'jwt_token' também tenha o mesmo valor
    if (jwtToken !== authToken) {
      localStorage.setItem('jwt_token', authToken);
      console.log('[JWT] Sincronizando jwt_token com authToken');
    }
  } else if (jwtToken) {
    tokenToUse = jwtToken;
    // Garantir que 'authToken' também tenha o mesmo valor
    localStorage.setItem('authToken', jwtToken);
    console.log('[JWT] Sincronizando authToken com jwt_token');
  }
  
  return tokenToUse;
}

// Função para salvar um token JWT em todos os locais necessários
export function saveJwtToken(token: string): void {
  localStorage.setItem('authToken', token);
  localStorage.setItem('jwt_token', token);
  console.log('[JWT] Token JWT salvo em ambas as chaves de armazenamento');
}

// Função para limpar o token JWT de todos os locais de armazenamento
export function clearJwtToken(): void {
  localStorage.removeItem('authToken');
  localStorage.removeItem('jwt_token');
  console.log('[JWT] Token JWT removido de ambas as chaves de armazenamento');
}

// Inicializar o sistema JWT na carga da página
export function initializeJwt(): void {
  console.log('[JWT] Inicializando sistema JWT');
  syncJwtToken();
}

// Exportar uma função para obter o token JWT atual
export function getJwtToken(): string | null {
  return syncJwtToken();
}

// Auto-inicializar quando este módulo é importado
initializeJwt();