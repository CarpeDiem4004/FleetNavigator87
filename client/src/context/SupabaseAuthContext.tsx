import { createContext, ReactNode, useContext } from 'react';
import { User as SupabaseAuthUser } from '@supabase/supabase-js';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  baseId?: number;
  basename?: string;
  oficina_id?: number;
}

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseAuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string) => Promise<User>;
  logout: () => Promise<void>;
  resyncSession: () => Promise<boolean>;
}

// Contexto básico
export const SupabaseAuthContext = createContext<AuthContextType | null>(null);

// Hook para usar o contexto
export const useSupabaseAuthContext = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error("useSupabaseAuthContext deve ser usado dentro de um SupabaseAuthProvider");
  }
  return context;
};

interface SupabaseAuthProviderProps {
  children: ReactNode;
}

export const SupabaseAuthProvider = ({ children }: SupabaseAuthProviderProps) => {
  // Contexto simplificado que redireciona para AuthContext principal
  const user = null;
  const isLoading = false;
  const supabaseUser = null;

  // Funções básicas que redirecionam para AuthContext
  const login = async (email: string, password: string): Promise<User> => {
    throw new Error("Use AuthContext login method instead");
  };

  const register = async (email: string, password: string, name: string): Promise<User> => {
    throw new Error("Use AuthContext register method instead");
  };

  const logout = async (): Promise<void> => {
    // Redireciona para AuthContext principal
    throw new Error("Use AuthContext logout method instead");
  };

  const resyncSession = async (): Promise<boolean> => {
    return false;
  };

  const value = {
    user,
    supabaseUser,
    isLoading,
    login,
    register,
    logout,
    resyncSession,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};