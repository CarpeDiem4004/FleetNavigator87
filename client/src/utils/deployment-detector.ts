/**
 * Utilitário para detectar ambiente de deployment e ajustar configurações
 */

export interface DeploymentConfig {
  isReplit: boolean;
  isDevelopment: boolean;
  isProduction: boolean;
  baseUrl: string;
  apiUrl: string;
  requiresJWT: boolean;
}

export function getDeploymentConfig(): DeploymentConfig {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  // Detectar ambiente Replit
  const isReplit = hostname.includes('replit.dev') || hostname.includes('picard.replit.dev');
  
  // Detectar desenvolvimento local
  const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';
  
  // Ambiente de produção (fora do Replit e localhost)
  const isProduction = !isReplit && !isDevelopment;
  
  // URL base
  const baseUrl = `${protocol}//${hostname}${port ? `:${port}` : ''}`;
  
  // URL da API - ajustar conforme o ambiente
  let apiUrl = baseUrl;
  if (isProduction) {
    // Em produção externa, pode precisar de ajustes na URL da API
    apiUrl = baseUrl;
  }
  
  // JWT é obrigatório em produção externa
  const requiresJWT = isProduction;
  
  return {
    isReplit,
    isDevelopment,
    isProduction,
    baseUrl,
    apiUrl,
    requiresJWT
  };
}

export function isExternalDeployment(): boolean {
  const config = getDeploymentConfig();
  return config.isProduction;
}

export function getAuthenticationStrategy(): 'session' | 'jwt' | 'hybrid' {
  const config = getDeploymentConfig();
  
  if (config.isDevelopment) {
    return 'session'; // Desenvolvimento usa sessões
  } else if (config.isReplit) {
    return 'hybrid'; // Replit usa híbrido (sessão + JWT)
  } else {
    return 'jwt'; // Produção externa usa apenas JWT
  }
}