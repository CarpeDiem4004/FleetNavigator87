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
   * Limpa completamente todos os tokens e estado de autenticação
   */
  static clearAllAuthState(): void {
    console.log('[AuthManager] Limpando completamente o estado de autenticação');
    
    // Remover todos os tokens do localStorage
    localStorage.removeItem(this.AUTH_TOKEN_KEY);
    localStorage.removeItem(this.SUPABASE_TOKEN_KEY);
    localStorage.removeItem(this.LEGACY_TOKEN_KEY);
    
    // Limpar sessão do Supabase
    try {
      supabase.auth.signOut();
    } catch (error) {
      console.warn('[AuthManager] Erro ao fazer logout do Supabase:', error);
    }
    
    console.log('[AuthManager] Estado de autenticação completamente limpo');
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
    
    // PASSO 1: Verificar token no localStorage
    const authToken = localStorage.getItem(this.AUTH_TOKEN_KEY);
    if (authToken) {
      console.log('[AuthManager] Token encontrado em authToken, verificando validade...');
      try {
        // Verificar se o token é válido
        const { data, error } = await supabase.auth.getUser(authToken);
        if (!error && data.user) {
          console.log('[AuthManager] Token em authToken é válido para:', data.user.email);
          
          // Ressincronizar com o servidor
          const syncResult = await this.resyncWithServer(authToken);
          if (syncResult) {
            console.log('[AuthManager] Sessão ressincronizada com sucesso usando token existente');
            return true;
          }
        } else {
          console.warn('[AuthManager] Token em authToken é inválido, removendo...');
          localStorage.removeItem(this.AUTH_TOKEN_KEY);
        }
      } catch (e) {
        console.error('[AuthManager] Erro ao verificar token em authToken:', e);
      }
    }
    
    // SISTEMA DE EMERGÊNCIA DESABILITADO
    // Motivo: Estava causando login automático indesejado e conflitos de sessão
    console.log('[AuthManager] Sistema de emergência desabilitado para evitar login automático');
    
    // PASSO 2: Se não tem token válido em authToken, verificar no Supabase storage
    const supabaseTokenData = localStorage.getItem(this.SUPABASE_TOKEN_KEY);
    if (supabaseTokenData) {
      try {
        console.log('[AuthManager] Verificando tokens no Supabase storage...');
        let token = null;
        
        // Tentar extrair o token da sessão armazenada
        try {
          const data = JSON.parse(supabaseTokenData);
          // Verificar formato atual
          if (data.currentSession?.access_token) {
            token = data.currentSession.access_token;
          } 
          // Verificar formato alternativo
          else if (data.session?.access_token) {
            token = data.session.access_token;
          }
        } catch (parseError) {
          console.error('[AuthManager] Erro ao analisar token do Supabase storage:', parseError);
        }
        
        if (token) {
          console.log('[AuthManager] Token encontrado no Supabase storage, verificando validade...');
          
          // Verificar se o token é válido
          const { data, error } = await supabase.auth.getUser(token);
          if (!error && data.user) {
            console.log('[AuthManager] Token do Supabase storage é válido para:', data.user.email);
            
            // Salvar em authToken
            localStorage.setItem(this.AUTH_TOKEN_KEY, token);
            
            // Ressincronizar com o servidor
            const syncResult = await this.resyncWithServer(token);
            if (syncResult) {
              console.log('[AuthManager] Sessão ressincronizada com sucesso usando token do Supabase');
              return true;
            }
          } else {
            console.warn('[AuthManager] Token do Supabase storage é inválido');
          }
        }
      } catch (e) {
        console.error('[AuthManager] Erro ao processar token do Supabase storage:', e);
      }
    }
    
    // PASSO 3: Tentar obter uma nova sessão do Supabase
    try {
      console.log('[AuthManager] Tentando obter sessão atual do Supabase...');
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        console.log('[AuthManager] Nova sessão do Supabase obtida para:', data.session.user?.email);
        
        // Salvar token
        localStorage.setItem(this.AUTH_TOKEN_KEY, data.session.access_token);
        
        // Ressincronizar com o servidor
        const syncResult = await this.resyncWithServer(data.session.access_token);
        if (syncResult) {
          console.log('[AuthManager] Sessão ressincronizada com sucesso usando nova sessão');
          return true;
        }
      } else {
        console.log('[AuthManager] Nenhuma sessão ativa encontrada no Supabase');
      }
    } catch (error) {
      console.error('[AuthManager] Erro ao obter sessão atual do Supabase:', error);
    }
    
    // PASSO 4: Tentar verificar se há uma sessão Express tradicional ativa
    try {
      console.log('[AuthManager] Verificando sessão tradicional Express...');
      const response = await fetch('/api/user', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'X-Auth-Check': 'true'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('[AuthManager] Sessão tradicional ativa encontrada para:', userData.email);
        
        // Se temos sessão tradicional mas não JWT, tentar forçar um token JWT
        try {
          console.log('[AuthManager] Tentando obter token JWT para a sessão tradicional...');
          const tokenResponse = await fetch('/api/get-jwt-token', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: userData.email })
          });
          
          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            if (tokenData.token) {
              console.log('[AuthManager] Token JWT obtido com sucesso para sessão tradicional');
              localStorage.setItem(this.AUTH_TOKEN_KEY, tokenData.token);
              return true;
            }
          }
        } catch (tokenError) {
          console.error('[AuthManager] Erro ao obter token JWT para sessão tradicional:', tokenError);
        }
        
        // Mesmo sem token JWT, temos uma sessão válida
        return true;
      }
    } catch (sessionError) {
      console.error('[AuthManager] Erro ao verificar sessão tradicional:', sessionError);
    }
    
    // Nenhuma recuperação foi possível
    console.warn('[AuthManager] Não foi possível recuperar automaticamente a sessão');
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