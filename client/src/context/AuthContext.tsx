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
        
        // Verificar se temos um token JWT armazenado
        const authToken = localStorage.getItem('authToken');
        let authSource = 'sessão';
        let isAuthenticated = false;
        let userData = null;
        
        // Se temos token JWT, tenta verificar ele primeiro
        if (authToken) {
          console.log("Token JWT encontrado, tentando verificar...");
          authSource = 'token';
          
          try {
            // Tenta verificar o token JWT usando a rota simplificada
            console.log("Tentando verificar token na rota simplificada...");
            let jwtVerifyResponse = await fetch('/auth/verify', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            // Se falhar com a rota simplificada, tenta a rota tradicional
            if (!jwtVerifyResponse.ok) {
              console.log("Verificação na rota simplificada falhou, tentando rota tradicional...");
              jwtVerifyResponse = await fetch('/api/hybrid/auth/verify', {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${authToken}`,
                  'Content-Type': 'application/json'
                }
              });
            }
            
            if (jwtVerifyResponse.ok) {
              // Token JWT válido
              const jwtData = await jwtVerifyResponse.json();
              console.log("Token JWT verificado com sucesso:", jwtData);
              userData = jwtData.user;
              isAuthenticated = true;
            } else {
              console.warn("Token JWT inválido ou expirado em ambas as rotas");
              // Remove o token inválido
              localStorage.removeItem('authToken');
            }
          } catch (jwtError) {
            console.error("Erro ao verificar token JWT:", jwtError);
          }
        }
        
        // Se não conseguiu autenticar com JWT, tenta sessão tradicional
        if (!isAuthenticated) {
          console.log("Tentando verificar sessão tradicional...");
          
          const response = await fetch('/api/user', {
            method: 'GET',
            credentials: 'include', // Importante para enviar cookies de sessão
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          // Verificação crítica: se o componente foi desmontado, não atualize o estado
          if (!isMounted) return;
          
          if (response.ok) {
            userData = await response.json();
            isAuthenticated = true;
            authSource = 'sessão';
            console.log("Sessão tradicional verificada com sucesso");
          } else {
            if (response.status === 401) {
              console.log('Nenhuma sessão de usuário encontrada');
            } else {
              console.error('Erro ao verificar autenticação de sessão:', response.statusText);
            }
          }
        }
        
        // Atualiza o estado com base no resultado da autenticação
        if (isAuthenticated && userData) {
          console.log(`Usuário autenticado via ${authSource}:`, userData);
          setUser(userData);
        } else {
          console.log("Usuário não autenticado");
          setUser(null);
        }
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
      let userData = null;
      let authSuccess = false;
      
      try {
        console.log("Tentando autenticação JWT híbrida (rota simplificada)...");
        let jwtResponse = await fetch('/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        
        // Se falhar com a rota simplificada, tenta a rota tradicional
        if (!jwtResponse.ok) {
          console.log("Login via rota simplificada falhou, tentando rota tradicional...");
          jwtResponse = await fetch('/api/hybrid/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });
        }
        
        if (jwtResponse.ok) {
          const jwtData = await jwtResponse.json();
          
          // Armazenar o token JWT no localStorage para uso futuro
          if (jwtData.token) {
            localStorage.setItem('authToken', jwtData.token);
            console.log("Token JWT armazenado com sucesso");
            userData = jwtData.user;
            authSuccess = true;
            
            // Verifica o token imediatamente para garantir que está funcionando
            try {
              console.log("Verificando token JWT recém-obtido...");
              // Tenta verificar com a rota simplificada primeiro
              let verifyResponse = await fetch('/auth/verify', {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${jwtData.token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              // Se falhar, tenta a rota tradicional
              if (!verifyResponse.ok) {
                console.log("Verificação via rota simplificada falhou, tentando rota tradicional...");
                verifyResponse = await fetch('/api/hybrid/auth/verify', {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${jwtData.token}`,
                    'Content-Type': 'application/json'
                  }
                });
              }
              
              if (verifyResponse.ok) {
                console.log("Token JWT verificado com sucesso");
              } else {
                console.warn("Falha na verificação do token JWT em ambas as rotas");
              }
            } catch (verifyError) {
              console.error("Erro ao verificar token JWT:", verifyError);
            }
          }
        } else {
          console.warn("Autenticação JWT falhou em ambas as rotas, status:", jwtResponse.status);
          try {
            const errorData = await jwtResponse.json();
            console.warn("Erro JWT:", errorData);
          } catch (e) {
            // Ignora erro de parsing
          }
        }
      } catch (jwtError) {
        console.error("Erro na tentativa de autenticação JWT:", jwtError);
      }
      
      // Se a autenticação JWT falhar, tenta a autenticação tradicional
      if (!authSuccess) {
        console.log("Tentando autenticação tradicional...");
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
          console.error("Erro na resposta de login:", response.status, errorData);
          throw new Error(errorData.message || 'Erro de autenticação');
        }
        
        userData = await response.json();
        console.log("Login tradicional bem-sucedido:", userData);
      } else {
        console.log("Usando dados de usuário da autenticação JWT:", userData);
      }
      
      // Define o usuário no estado, independente do método de autenticação usado
      setUser(userData);
      
      // Forçar uma verificação de autenticação após o login
      setTimeout(async () => {
        const authToken = localStorage.getItem('authToken');
        const headers: HeadersInit = { 
          'Content-Type': 'application/json'
        };
        
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        try {
          // Tenta primeiro com a rota simplificada
          console.log("Verificação pós-login (rota simplificada)...");
          let verifyResponse = await fetch('/auth/verify', {
            method: 'GET',
            credentials: 'include',
            headers
          });
          
          // Se falhar, tenta com a rota tradicional
          if (!verifyResponse.ok) {
            console.log("Verificação pós-login falhou, tentando rota alternativa...");
            verifyResponse = await fetch('/api/hybrid/auth/verify', {
              method: 'GET',
              credentials: 'include',
              headers
            });
          }
          
          if (verifyResponse.ok) {
            const data = await verifyResponse.json();
            console.log("Verificação pós-login bem-sucedida:", data);
          } else {
            console.warn("Verificação pós-login falhou em ambas as rotas");
          }
        } catch (error) {
          console.error("Erro na verificação pós-login:", error);
        }
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
