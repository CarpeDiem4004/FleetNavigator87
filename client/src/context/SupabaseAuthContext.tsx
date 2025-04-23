import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  baseId?: number;
  basename?: string;
  oficina_id?: number;  // ID da oficina associada ao usuário (se for oficina)
  // Relação com a base
  bases?: {
    id: number;
    name: string;
  };
}

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseAuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string) => Promise<User>;
  logout: () => Promise<void>;
}

// Cria o contexto de autenticação
export const SupabaseAuthContext = createContext<AuthContextType | null>(null);

// Hook para usar o contexto de autenticação
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
  const {
    supabaseUser,
    loading: supabaseLoading,
    signIn,
    signUp,
    signOut,
    syncLoginWithAPI,
  } = useSupabaseAuth();
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Obtém informações do usuário da API após autenticação no Supabase
  useEffect(() => {
    const fetchUserFromAPI = async () => {
      if (supabaseUser) {
        try {
          const response = await apiRequest('GET', '/api/user');
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // Se o usuário estiver autenticado no Supabase mas não na API,
            // tenta sincronizar o login entre os sistemas
            console.log('Usuário autenticado no Supabase mas não na API. Tentando sincronizar...');
          }
        } catch (error) {
          console.error('Erro ao obter dados do usuário da API:', error);
        }
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    };

    fetchUserFromAPI();
  }, [supabaseUser]);

  // Sincronização de loading state
  useEffect(() => {
    if (!supabaseLoading && isLoading) {
      setIsLoading(false);
    }
  }, [supabaseLoading, isLoading]);

  // Função para fazer login usando Supabase e API
  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      // Primeiro tenta login no Supabase
      const { error } = await signIn(email, password);
      
      if (error) {
        throw error;
      }
      
      // Após login no Supabase, sincroniza com a API
      const syncSuccess = await syncLoginWithAPI(email, password);
      
      if (!syncSuccess) {
        throw new Error('Falha ao sincronizar login com a API');
      }
      
      // Busca os dados do usuário da API para completar o login
      const response = await apiRequest('GET', '/api/user');
      
      if (!response.ok) {
        throw new Error('Falha ao obter dados do usuário da API');
      }
      
      const userData = await response.json();
      setUser(userData);
      
      toast({
        title: "Login bem-sucedido",
        description: `Bem-vindo, ${userData.name || userData.email}!`,
      });
      
      return userData;
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      toast({
        title: "Falha no login",
        description: error.message || "Credenciais inválidas. Verifique seu email e senha.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para registrar novo usuário
  const register = async (email: string, password: string, name: string): Promise<User> => {
    setIsLoading(true);
    try {
      // Registra no Supabase
      const { error } = await signUp(email, password, name);
      
      if (error) {
        throw error;
      }
      
      // Registra na API
      const response = await apiRequest('POST', '/api/register', {
        username: email,
        password: password,
        name: name,
        role: 'operador' // Papel padrão para novos usuários
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao registrar usuário na API');
      }
      
      const userData = await response.json();
      setUser(userData);
      
      toast({
        title: "Registro bem-sucedido",
        description: "Sua conta foi criada com sucesso!",
      });
      
      return userData;
    } catch (error: any) {
      console.error('Erro no registro:', error);
      
      toast({
        title: "Falha no registro",
        description: error.message || "Erro ao cadastrar usuário",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para fazer logout
  const logout = async () => {
    try {
      // Logout do Supabase (que também fará logout da API)
      await signOut();
      
      setUser(null);
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error);
      
      toast({
        title: "Erro ao fazer logout",
        description: error.message || "Ocorreu um erro ao tentar desconectar",
        variant: "destructive",
      });
    }
  };

  const contextValue: AuthContextType = {
    user,
    supabaseUser,
    isLoading,
    login,
    register,
    logout
  };

  return (
    <SupabaseAuthContext.Provider value={contextValue}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};