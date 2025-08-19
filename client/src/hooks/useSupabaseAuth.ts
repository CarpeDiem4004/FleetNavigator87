import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session, User, AuthChangeEvent, SupabaseClient } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

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
  resyncSession: () => Promise<boolean>;
}

export function useSupabaseAuth(): UseSupabaseAuthReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    
    // Função simplificada para verificar sessão
    const checkSession = async () => {
      if (!isMounted) return;
      
      try {
        console.log("[useSupabaseAuth] Verificando sessão...");
        
        // Obter sessão atual do Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.warn("[useSupabaseAuth] Erro ao obter sessão:", error);
          setError(error);
        } else if (session) {
          console.log("[useSupabaseAuth] Sessão encontrada:", session.user?.email);
          setSession(session);
          setSupabaseUser(session.user);
        } else {
          console.log("[useSupabaseAuth] Nenhuma sessão encontrada");
        }
      } catch (error) {
        if (isMounted) {
          console.error("[useSupabaseAuth] Erro ao verificar sessão:", error);
          setError(error as Error);
        }
      }
    };
    
    checkSession();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Funções básicas para compatibilidade
  const signIn = async (email: string, password: string) => {
    return { error: new Error("Use AuthContext login instead") };
  };

  const signUp = async (email: string, password: string, name: string) => {
    return { error: new Error("Use AuthContext register instead") };
  };

  const signOut = async () => {
    setSession(null);
    setSupabaseUser(null);
  };

  const syncLoginWithAPI = async (email: string, password: string) => {
    return false;
  };

  const resyncSession = async () => {
    return false;
  };

  return {
    session,
    supabaseUser,
    loading,
    isAuthenticated: !!session,
    error,
    signIn,
    signUp,
    signOut,
    syncLoginWithAPI,
    resyncSession,
  };
}