/**
 * Gerenciador de Autenticação
 * 
 * Classe utilitária para gerenciar, diagnosticar e resolver problemas
 * de autenticação no sistema híbrido (Supabase + Express Session)
 */

import { supabase } from './supabaseClient';

export class AuthManager {
  // Nomes das chaves de armazenamento
  private static readonly SUPABASE_TOKEN_KEY = 'supabase.auth.token';
  private static readonly AUTH_TOKEN_KEY = 'authToken';
  private static readonly LEGACY_TOKEN_KEY = 'token';
  
  /**
   * Verifica se o usuário tem algum tipo de token armazenado
   */
  static hasAnyToken(): boolean {
    return !!(
      localStorage.getItem(this.SUPABASE_TOKEN_KEY) || 
      localStorage.getItem(this.AUTH_TOKEN_KEY) || 
      localStorage.getItem(this.LEGACY_TOKEN_KEY)
    );
  }
  
  /**
   * Obtém o token JWT mais recente disponível
   */
  static getLatestToken(): string | null {
    // Prioridade: authToken (mais recente) -> Supabase token -> Legacy token
    const authToken = localStorage.getItem(this.AUTH_TOKEN_KEY);
    if (authToken) return authToken;
    
    try {
      const supabaseTokenData = localStorage.getItem(this.SUPABASE_TOKEN_KEY);
      if (supabaseTokenData) {
        const data = JSON.parse(supabaseTokenData);
        if (data.currentSession?.access_token) {
          return data.currentSession.access_token;
        }
      }
    } catch (e) {
      console.error('[AuthManager] Erro ao processar token Supabase:', e);
    }
    
    return localStorage.getItem(this.LEGACY_TOKEN_KEY);
  }
  
  /**
   * Sincroniza todos os tokens disponíveis
   * Garante que estamos usando a versão mais recente em todos os lugares
   */
  static syncAllTokens(): void {
    const latestToken = this.getLatestToken();
    
    if (latestToken) {
      // Definir o token em authToken (usado pelo interceptor fetch)
      localStorage.setItem(this.AUTH_TOKEN_KEY, latestToken);
      console.log('[AuthManager] Sincronizados todos os tokens de autenticação');
    } else {
      console.warn('[AuthManager] Não foi possível encontrar nenhum token para sincronização');
    }
  }
  
  /**
   * Executa um diagnóstico completo do estado de autenticação
   */
  static async diagnoseAuthState(): Promise<{
    hasLocalTokens: boolean;
    hasSupabaseSession: boolean;
    hasServerSession: boolean;
    tokenValid: boolean;
    detailedReport: string[];
  }> {
    const report: string[] = [];
    const result = {
      hasLocalTokens: false,
      hasSupabaseSession: false,
      hasServerSession: false,
      tokenValid: false,
      detailedReport: report
    };
    
    // Verificar tokens locais
    const hasAuthToken = !!localStorage.getItem(this.AUTH_TOKEN_KEY);
    const hasSupabaseToken = !!localStorage.getItem(this.SUPABASE_TOKEN_KEY);
    const hasLegacyToken = !!localStorage.getItem(this.LEGACY_TOKEN_KEY);
    
    result.hasLocalTokens = hasAuthToken || hasSupabaseToken || hasLegacyToken;
    
    report.push(`[Tokens Locais]`);
    report.push(`- AUTH_TOKEN: ${hasAuthToken ? 'Presente' : 'Ausente'}`);
    report.push(`- SUPABASE_TOKEN: ${hasSupabaseToken ? 'Presente' : 'Ausente'}`);
    report.push(`- LEGACY_TOKEN: ${hasLegacyToken ? 'Presente' : 'Ausente'}`);
    
    // Verificar sessão Supabase
    try {
      const { data } = await supabase.auth.getSession();
      result.hasSupabaseSession = !!data.session;
      
      report.push(`\n[Sessão Supabase]`);
      report.push(`- Session: ${data.session ? 'Válida' : 'Inválida/Ausente'}`);
      if (data.session) {
        report.push(`- User: ${data.session.user?.email || 'Desconhecido'}`);
        report.push(`- Expires: ${new Date(data.session.expires_at! * 1000).toLocaleString()}`);
      }
    } catch (error) {
      report.push(`- Erro ao verificar sessão Supabase: ${error}`);
    }
    
    // Verificar sessão no servidor
    try {
      const response = await fetch('/api/auth-status', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${this.getLatestToken() || ''}`,
        }
      });
      
      const data = await response.json();
      result.hasServerSession = !!data.isAuthenticated;
      
      report.push(`\n[Sessão Express]`);
      report.push(`- Autenticado: ${data.isAuthenticated ? 'Sim' : 'Não'}`);
      report.push(`- Método: ${data.method || 'Nenhum'}`);
      report.push(`- User ID: ${data.userId || 'Desconhecido'}`);
      if (data.sessionInfo) {
        report.push(`- Session ID: ${data.sessionInfo.id || 'Desconhecido'}`);
        report.push(`- Cookie presente: ${data.sessionInfo.hasCookie ? 'Sim' : 'Não'}`);
      }
    } catch (error) {
      report.push(`- Erro ao verificar sessão Express: ${error}`);
    }
    
    // Verificar validade do token JWT
    const token = this.getLatestToken();
    if (token) {
      try {
        const { data, error } = await supabase.auth.getUser(token);
        result.tokenValid = !!data.user && !error;
        
        report.push(`\n[Token JWT]`);
        report.push(`- Válido: ${result.tokenValid ? 'Sim' : 'Não'}`);
        if (data.user) {
          report.push(`- Email: ${data.user.email}`);
          report.push(`- ID: ${data.user.id}`);
        }
        if (error) {
          report.push(`- Erro: ${error.message}`);
        }
      } catch (error) {
        report.push(`- Erro ao verificar token JWT: ${error}`);
      }
    } else {
      report.push(`\n[Token JWT]`);
      report.push(`- Nenhum token encontrado para verificação`);
    }
    
    return result;
  }
  
  /**
   * Tenta realizar ações automáticas para resolver problemas de autenticação
   */
  static async attemptAutoRecovery(): Promise<boolean> {
    console.log('[AuthManager] Iniciando tentativa de recuperação automática');
    
    // Se existe token no Supabase mas não em authToken, sincronizar
    const supabaseTokenData = localStorage.getItem(this.SUPABASE_TOKEN_KEY);
    if (supabaseTokenData && !localStorage.getItem(this.AUTH_TOKEN_KEY)) {
      try {
        const data = JSON.parse(supabaseTokenData);
        if (data.currentSession?.access_token) {
          localStorage.setItem(this.AUTH_TOKEN_KEY, data.currentSession.access_token);
          console.log('[AuthManager] Token recuperado do Supabase storage');
          
          // Tentar ressincronizar com o servidor
          await this.resyncWithServer(data.currentSession.access_token);
          return true;
        }
      } catch (e) {
        console.error('[AuthManager] Erro ao processar token Supabase:', e);
      }
    }
    
    // Tentar obter a sessão atual do Supabase
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        localStorage.setItem(this.AUTH_TOKEN_KEY, data.session.access_token);
        console.log('[AuthManager] Token recuperado da sessão atual do Supabase');
        
        // Tentar ressincronizar com o servidor
        await this.resyncWithServer(data.session.access_token);
        return true;
      }
    } catch (error) {
      console.error('[AuthManager] Erro ao obter sessão atual:', error);
    }
    
    // Nenhuma recuperação foi possível
    console.warn('[AuthManager] Não foi possível recuperar automaticamente');
    return false;
  }
  
  /**
   * Tenta ressincronizar a sessão com o servidor Express
   */
  private static async resyncWithServer(token: string): Promise<boolean> {
    try {
      // Obter o email do usuário a partir do token
      const { data } = await supabase.auth.getUser(token);
      if (!data.user?.email) {
        console.warn('[AuthManager] Não foi possível obter email do usuário para ressincronização');
        return false;
      }
      
      const email = data.user.email;
      
      // Chamar a API para ressincronizar a sessão
      const response = await fetch('/api/resync-session-jwt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          user: { email }
        })
      });
      
      const result = await response.json();
      console.log('[AuthManager] Resultado da ressincronização:', result);
      
      return response.ok;
    } catch (error) {
      console.error('[AuthManager] Erro ao ressincronizar com o servidor:', error);
      return false;
    }
  }
  
  /**
   * Limpa todos os dados de autenticação
   */
  static clearAllAuth(): void {
    localStorage.removeItem(this.SUPABASE_TOKEN_KEY);
    localStorage.removeItem(this.AUTH_TOKEN_KEY);
    localStorage.removeItem(this.LEGACY_TOKEN_KEY);
    
    // Limpar quaisquer outros itens relacionados à autenticação
    localStorage.removeItem('user');
    localStorage.removeItem('userProfile');
    
    console.log('[AuthManager] Todos os dados de autenticação foram limpos');
  }
}

// Exportar uma instância global para uso em debugging
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.__AUTH_MANAGER__ = AuthManager;
}

export default AuthManager;