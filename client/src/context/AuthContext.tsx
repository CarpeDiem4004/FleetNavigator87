import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  baseId?: number;
  base_id?: number;
  basename?: string;
  oficina_id?: number;
  bases?: {
    id: number;
    name: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginBase: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // VERIFICAÇÃO SIMPLES: Apenas autenticação por sessão
  useEffect(() => {
    const checkAuth = async () => {
      console.log("Verificando autenticação tradicional...");
      
      try {
        const response = await fetch('/api/user', {
          method: 'GET',
          credentials: 'include', // CRÍTICO: incluir cookies
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log("Sessão encontrada:", userData);
          
          const formattedUser: User = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            baseId: userData.base_id || userData.baseId,
            basename: userData.basename,
            oficina_id: userData.oficina_id
          };
          
          setUser(formattedUser);
          console.log("Usuário autenticado:", formattedUser);
        } else {
          console.log("Nenhuma sessão encontrada");
          setUser(null);
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        setUser(null);
      }
      
      setIsLoading(false);
      console.log("Verificação concluída, isLoading=false");
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    console.log("Tentando login:", email);
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username: email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro no login');
      }

      const userData = await response.json();
      console.log("Login bem-sucedido:", userData);
      
      const formattedUser: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        baseId: userData.base_id || userData.baseId,
        basename: userData.basename,
        oficina_id: userData.oficina_id
      };

      setUser(formattedUser);
      
      toast({
        title: "Login realizado",
        description: `Bem-vindo, ${userData.name}!`,
      });

      return formattedUser;
    } catch (error) {
      console.error("Erro no login:", error);
      toast({
        title: "Erro no login",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      throw error;
    }
  };

  const loginBase = async (email: string, password: string): Promise<User> => {
    console.log("Tentando login de base:", email);
    
    try {
      const response = await fetch('/api/login-base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username: email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro no login da base');
      }

      const userData = await response.json();
      console.log("Login de base bem-sucedido:", userData);
      
      const formattedUser: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        baseId: userData.base_id || userData.baseId,
        basename: userData.basename,
        oficina_id: userData.oficina_id
      };

      setUser(formattedUser);
      
      toast({
        title: "Login realizado",
        description: `Bem-vindo à base, ${userData.name}!`,
      });

      return formattedUser;
    } catch (error) {
      console.error("Erro no login da base:", error);
      toast({
        title: "Erro no login da base",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<User> => {
    console.log("Tentando registro:", email);
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro no registro');
      }

      const userData = await response.json();
      console.log("Registro bem-sucedido:", userData);
      
      const formattedUser: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        baseId: userData.base_id || userData.baseId,
        basename: userData.basename,
        oficina_id: userData.oficina_id
      };

      setUser(formattedUser);
      
      toast({
        title: "Conta criada",
        description: `Bem-vindo, ${userData.name}!`,
      });

      return formattedUser;
    } catch (error) {
      console.error("Erro no registro:", error);
      toast({
        title: "Erro no registro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    console.log("Fazendo logout...");
    
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        console.log("Logout bem-sucedido");
      } else {
        console.warn("Erro no logout, mas continuando...");
      }
    } catch (error) {
      console.error("Erro no logout:", error);
    }
    
    setUser(null);
    setLocation('/login');
    
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
  };

  console.log("AuthContext Provider valores:", [
    "user: " + (user ? "object" : "null"),
    "isLoading: " + typeof isLoading,
    "login: " + typeof login,
    "loginBase: " + typeof loginBase,
    "register: " + typeof register,
    "logout: " + typeof logout
  ]);

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    loginBase,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};