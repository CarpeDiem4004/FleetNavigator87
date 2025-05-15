import { createContext, ReactNode, useContext, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  baseId?: number;
  basename?: string;
  oficina_id?: number;
  // Relação com a base
  bases?: {
    id: number;
    name: string;
  };
}

interface MockAuthContextType {
  user: User | null;
  supabaseUser: any | null; // Mantemos a interface compatível
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string) => Promise<User>;
  logout: () => Promise<void>;
  resyncSession: () => Promise<boolean>;
}

// Criar o contexto
export const MockAuthContext = createContext<MockAuthContextType | null>(null);

// Hook para usar o contexto
export const useMockAuthContext = () => {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error("useMockAuthContext deve ser usado dentro de um MockAuthProvider");
  }
  return context;
};

interface MockAuthProviderProps {
  children: ReactNode;
}

export const MockAuthProvider = ({ children }: MockAuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Função de login simulada
  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      console.log('[MockAuth] Tentando login com:', email);
      
      // Criar um usuário simulado
      const mockUser: User = {
        id: 1,
        name: email.split('@')[0],
        email: email,
        role: 'operador'
      };
      
      // Simular um atraso de rede
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUser(mockUser);
      
      // Armazenar token para uso posterior
      localStorage.setItem('authToken', 'mock-jwt-token-' + Date.now());
      
      toast({
        title: "Login bem-sucedido",
        description: `Bem-vindo, ${mockUser.name}!`,
      });
      
      return mockUser;
    } catch (error: any) {
      console.error('[MockAuth] Erro no login:', error);
      
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
  
  // Função de registro simulada
  const register = async (email: string, password: string, name: string): Promise<User> => {
    setIsLoading(true);
    try {
      console.log('[MockAuth] Tentando registrar:', email, name);
      
      // Criar um usuário simulado
      const mockUser: User = {
        id: Date.now(),
        name: name,
        email: email,
        role: 'operador'
      };
      
      // Simular um atraso de rede
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUser(mockUser);
      
      // Armazenar token para uso posterior
      localStorage.setItem('authToken', 'mock-jwt-token-' + Date.now());
      
      toast({
        title: "Registro bem-sucedido",
        description: "Sua conta foi criada com sucesso!",
      });
      
      return mockUser;
    } catch (error: any) {
      console.error('[MockAuth] Erro no registro:', error);
      
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
  
  // Função de logout simulada
  const logout = async () => {
    try {
      console.log('[MockAuth] Realizando logout');
      
      // Limpar dados de usuário
      setUser(null);
      
      // Limpar token armazenado
      localStorage.removeItem('authToken');
      
      // Tentar logout da API
      try {
        await apiRequest('POST', '/api/logout');
      } catch (apiError) {
        console.warn('[MockAuth] Erro ao fazer logout da API:', apiError);
      }
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
    } catch (error: any) {
      console.error('[MockAuth] Erro ao fazer logout:', error);
      
      toast({
        title: "Erro ao fazer logout",
        description: error.message || "Ocorreu um erro ao tentar desconectar",
        variant: "destructive",
      });
    }
  };
  
  // Função de ressincronização simulada
  const resyncSession = async (): Promise<boolean> => {
    console.log('[MockAuth] Ressinconização de sessão simulada');
    return true;
  };
  
  const contextValue: MockAuthContextType = {
    user,
    supabaseUser: user, // Usamos o mesmo user como supabaseUser para compatibilidade
    isLoading,
    login,
    register,
    logout,
    resyncSession
  };
  
  return (
    <MockAuthContext.Provider value={contextValue}>
      {children}
    </MockAuthContext.Provider>
  );
};

// Redirecionar exportações para compatibilidade com código existente
export const SupabaseAuthContext = MockAuthContext;
export const useSupabaseAuthContext = useMockAuthContext;
export const SupabaseAuthProvider = MockAuthProvider;