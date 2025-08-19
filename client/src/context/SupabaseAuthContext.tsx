import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  
  const { supabaseUser } = useSupabaseAuth();

  // Funções básicas que redirecionam para AuthContext
  const login = async (email: string, password: string): Promise<User> => {
    throw new Error("Use AuthContext login method instead");
  };

  const register = async (email: string, password: string, name: string): Promise<User> => {
    throw new Error("Use AuthContext register method instead");
  };

  const logout = async (): Promise<void> => {
    setUser(null);
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