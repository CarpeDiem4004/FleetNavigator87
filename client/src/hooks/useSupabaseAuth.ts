import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Interface para o tipo de usuário do Supabase
export interface SupabaseUser {
  email: string;
  id: string;
  name?: string;
  role?: string;
}

// Interface para o hook de autenticação
export interface UseSupabaseAuthReturn {
  session: Session | null;
  supabaseUser: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  syncLoginWithAPI: (email: string, password: string) => Promise<boolean>;
}

export function useSupabaseAuth(): UseSupabaseAuthReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Função para obter e definir a sessão atual
    const setSupabaseSession = async () => {
      try {
        setLoading(true);
        
        // Obter a sessão atual do Supabase
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        setSession(currentSession);
        
        if (currentSession?.user) {
          setSupabaseUser(currentSession.user);
        }
      } catch (err) {
        console.error('Erro ao obter sessão do Supabase:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    // Obter a sessão inicial
    setSupabaseSession();

    // Configurar listener para mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setSupabaseUser(newSession?.user || null);
      setLoading(false);
    });

    // Limpar o subscription quando o componente for desmontado
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Função para fazer login com Supabase
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        throw signInError;
      }
      
      if (data?.user) {
        setSupabaseUser(data.user);
        setSession(data.session);
        return { error: null };
      }
      
      return { error: new Error("Erro ao fazer login: usuário não encontrado") };
    } catch (err) {
      console.error('Erro ao fazer login com Supabase:', err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Função para criar conta com Supabase
  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'operador', // Papel padrão
          },
        },
      });
      
      if (signUpError) {
        throw signUpError;
      }
      
      if (data?.user) {
        // Criar registro na tabela users no banco de dados
        const { error: userInsertError } = await supabase.from('users').insert([
          {
            email,
            name,
            role: 'operador',
          },
        ]);
        
        if (userInsertError) {
          console.error('Erro ao criar perfil do usuário:', userInsertError);
          // Não tratamos como erro fatal para o registro
        }
        
        setSupabaseUser(data.user);
        setSession(data.session);
        return { error: null };
      }
      
      return { error: new Error("Erro ao fazer registro: não foi possível criar o usuário") };
    } catch (err) {
      console.error('Erro ao registrar com Supabase:', err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Função para fazer logout com Supabase
  const signOut = async () => {
    try {
      setLoading(true);
      
      await supabase.auth.signOut();
      
      // Também tenta fazer logout da API para limpar cookies de sessão
      try {
        const response = await apiRequest('POST', '/api/logout');
        if (!response.ok) {
          console.warn('Logout da API não foi bem-sucedido, mas logout do Supabase foi completado');
        }
      } catch (apiError) {
        console.warn('Erro ao fazer logout da API:', apiError);
      }
      
      setSession(null);
      setSupabaseUser(null);
      
    } catch (err) {
      console.error('Erro ao fazer logout do Supabase:', err);
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
  };
}