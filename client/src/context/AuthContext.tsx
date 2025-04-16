import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  baseId?: number;
  baseName?: string;
  // Relação com a base
  bases?: {
    id: number;
    name: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    
    // Verificar se o usuário está autenticado ao carregar a página
    const checkAuth = async () => {
      try {
        console.log("Verificando autenticação...");
        
        const response = await fetch('/api/user', {
          method: 'GET',
          credentials: 'include', // Importante para enviar cookies de sessão
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        // Verificação crítica: se o componente foi desmontado, não atualize o estado
        if (!isMounted) return;
        
        if (!response.ok) {
          if (response.status === 401) {
            console.log('Nenhuma sessão de usuário encontrada');
          } else {
            console.error('Erro ao verificar autenticação:', response.statusText);
          }
          setIsLoading(false);
          return;
        }
        
        const userData = await response.json();
        console.log("Usuário autenticado encontrado:", userData);
        setUser(userData);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
      } finally {
        if (isMounted) {
          console.log("Verificação de autenticação completa, isLoading=false");
          setIsLoading(false);
        }
      }
    };

    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log("Tentando fazer login com:", email);
      
      const response = await apiRequest('POST', '/api/login', {
        username: email,
        password: password
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro de autenticação');
      }
      
      const userData = await response.json();
      console.log("Login bem-sucedido:", userData);
      
      setUser(userData);
      
      toast({
        title: "Login bem-sucedido",
        description: `Bem-vindo, ${userData.name || userData.email}!`,
      });
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

  const logout = async () => {
    try {
      const response = await apiRequest('POST', '/api/logout');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao fazer logout');
      }
      
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

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      console.log("Tentando registrar usuário:", email);
      
      const response = await apiRequest('POST', '/api/register', {
        username: email,
        password: password,
        name: name,
        role: 'operador' // Papel padrão para novos usuários
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao registrar usuário');
      }
      
      const userData = await response.json();
      console.log("Registro bem-sucedido:", userData);
      
      setUser(userData);
      
      toast({
        title: "Registro bem-sucedido",
        description: "Sua conta foi criada com sucesso!",
      });
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

  // Garantindo que todos os valores são exportados corretamente
  const contextValue: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout
  };
  
  // Verificação para debug
  console.log("AuthContext Provider valores:", 
    Object.keys(contextValue).map(key => `${key}: ${typeof contextValue[key as keyof AuthContextType]}`)
  );
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
