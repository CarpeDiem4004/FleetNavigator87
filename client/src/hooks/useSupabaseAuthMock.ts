import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Interface para o tipo de usuário simulado
export interface MockUser {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
    role?: string;
  };
}

// Interface para sessão simulada
export interface MockSession {
  access_token: string;
  user: MockUser;
}

// Interface para o hook de autenticação
export interface UseSupabaseAuthReturn {
  session: MockSession | null;
  supabaseUser: MockUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  syncLoginWithAPI: (email: string, password: string) => Promise<boolean>;
  resyncSession: () => Promise<boolean>;
}

export function useSupabaseAuth(): UseSupabaseAuthReturn {
  const [session, setSession] = useState<MockSession | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Função para fazer login
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[Mock] Tentando login com:', email);
      
      // Simular login bem-sucedido
      const mockUser: MockUser = {
        id: '1',
        email: email,
        user_metadata: {
          name: email.split('@')[0],
          role: 'operador'
        }
      };
      
      const mockSession: MockSession = {
        access_token: 'mock-jwt-token-' + Date.now(),
        user: mockUser
      };
      
      // Simular um atraso de rede
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSupabaseUser(mockUser);
      setSession(mockSession);
      
      // Armazenar token para uso posterior
      localStorage.setItem('authToken', mockSession.access_token);
      
      return { error: null };
    } catch (err) {
      console.error('Erro ao fazer login com Mock:', err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Função para criar conta
  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[Mock] Tentando registrar:', email, name);
      
      // Simular registro bem-sucedido
      const mockUser: MockUser = {
        id: Date.now().toString(),
        email: email,
        user_metadata: {
          name: name,
          role: 'operador'
        }
      };
      
      const mockSession: MockSession = {
        access_token: 'mock-jwt-token-' + Date.now(),
        user: mockUser
      };
      
      // Simular um atraso de rede
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSupabaseUser(mockUser);
      setSession(mockSession);
      
      // Armazenar token para uso posterior
      localStorage.setItem('authToken', mockSession.access_token);
      
      return { error: null };
    } catch (err) {
      console.error('Erro ao registrar com Mock:', err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Função para fazer logout
  const signOut = async () => {
    try {
      setLoading(true);
      
      console.log('[Mock] Realizando logout');
      
      // Limpar dados de sessão
      setSession(null);
      setSupabaseUser(null);
      
      // Limpar token armazenado
      localStorage.removeItem('authToken');
      
      // Também tenta fazer logout da API para limpar cookies de sessão
      try {
        const response = await apiRequest('POST', '/api/logout');
        if (!response.ok) {
          console.warn('Logout da API não foi bem-sucedido');
        }
      } catch (apiError) {
        console.warn('Erro ao fazer logout da API:', apiError);
      }
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Erro ao fazer logout",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para sincronizar login com a API existente
  const syncLoginWithAPI = async (email: string, password: string) => {
    try {
      console.log('[Mock] Sincronizando login com API');
      
      // Fazer login na API
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username: email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro de autenticação na API');
      }
      
      return true;
    } catch (err) {
      console.error('Erro ao sincronizar login com API:', err);
      return false;
    }
  };
  
  // Função para ressincronizar a sessão
  const resyncSession = async () => {
    try {
      if (!supabaseUser || !session) {
        console.log('[Mock] Não é possível ressincronizar: nenhum usuário autenticado');
        return false;
      }
      
      console.log('[Mock] Tentando ressincronizar sessão...');
      
      // Obter o token de acesso atual
      const jwt = session.access_token;
      
      // Armazenar o token no localStorage para todas as requisições
      if (jwt) {
        localStorage.setItem('authToken', jwt);
        console.log('[Mock] Token JWT armazenado no localStorage');
      }
      
      // Simular sucesso da operação
      return true;
    } catch (err) {
      console.error('[Mock] Erro ao ressincronizar sessão:', err);
      return false;
    }
  };

  return {
    session,
    supabaseUser,
    loading,
    isAuthenticated: !!session && !!supabaseUser,
    error,
    signIn,
    signUp,
    signOut,
    syncLoginWithAPI,
    resyncSession,
  };
}