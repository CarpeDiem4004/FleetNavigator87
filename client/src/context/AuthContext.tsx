import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string) => Promise<User>;
  logout: () => Promise<void>;
}

// Criando um stub do usuário para o contexto inicial
const stubUser: User = {
  id: 0,
  name: '',
  email: '',
  role: '',
};

// Criando o contexto com valores iniciais adequados
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => stubUser,
  register: async () => stubUser,
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

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      console.log("Tentando fazer login com:", email);
      
      // Tenta primeiro a rota de autenticação JWT híbrida
      let response;
      let jwtResponse = null;
      
      try {
        console.log("Tentando autenticação JWT híbrida...");
        jwtResponse = await fetch('/api/hybrid/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        
        if (jwtResponse.ok) {
          const jwtData = await jwtResponse.json();
          
          // Armazenar o token JWT no localStorage para uso futuro
          if (jwtData.token) {
            localStorage.setItem('authToken', jwtData.token);
            console.log("Token JWT armazenado com sucesso");
          }
          
          // Continuar com a autenticação tradicional para manter a sessão
          console.log("Autenticação JWT bem-sucedida, estabelecendo sessão...");
        }
      } catch (jwtError) {
        console.error("Erro na autenticação JWT:", jwtError);
      }
      
      // Sempre usa a autenticação tradicional para estabelecer a sessão
      console.log("Estabelecendo sessão via autenticação tradicional...");
      response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username: email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Erro na resposta de login:", response.status, errorData);
        throw new Error(errorData.message || 'Erro de autenticação');
      }
      
      const userData = await response.json();
      console.log("Login bem-sucedido:", userData);
      
      setUser(userData);
      
      // Forçar uma verificação de autenticação após o login
      setTimeout(() => {
        fetch('/api/user', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })
        .then(res => res.json())
        .then(data => {
          console.log("Verificação pós-login:", data);
        })
        .catch(error => {
          console.error("Erro na verificação pós-login:", error);
        });
      }, 500);
      
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

  const logout = async () => {
    try {
      // Remover token JWT do localStorage
      localStorage.removeItem('authToken');
      console.log("Token JWT removido do localStorage");
      
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

  const register = async (email: string, password: string, name: string): Promise<User> => {
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
