import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useLocation } from 'wouter';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  baseId?: number;
  base_id?: number;  // Campo alternativo do servidor
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
  loginBase: (email: string, password: string) => Promise<User>;
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
  loginBase: async () => stubUser,
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
  const [, setLocation] = useLocation();
  
  // Usar o hook do Supabase para autenticação
  const {
    supabaseUser,
    loading: supabaseLoading,
    signIn: supabaseLogin,
    signOut: supabaseLogout,
    signUp: supabaseRegister,
    isAuthenticated: supabaseAuthenticated
  } = useSupabaseAuth();

  // Efeito para verificar e sincronizar o estado de autenticação
  useEffect(() => {
    const verifyAuth = async () => {
      console.log("Verificando estado de autenticação inicial...");
      
      // Se o hook do Supabase já determinou o estado de autenticação
      if (!supabaseLoading) {
        if (supabaseAuthenticated && supabaseUser) {
          // Converter o usuário do Supabase para o formato esperado pelo nosso contexto
          const userData = {
            id: supabaseUser.id ? parseInt(supabaseUser.id) : 0,
            name: supabaseUser.user_metadata?.name || 'Usuário',
            email: supabaseUser.email || '',
            role: supabaseUser.user_metadata?.role || 'operador',
            baseId: supabaseUser.user_metadata?.baseId || null,
            basename: supabaseUser.user_metadata?.basename || null,
            oficina_id: supabaseUser.user_metadata?.oficina_id || null
          };
          
          setUser(userData);
          console.log('Usuário autenticado via Supabase:', userData);
          
          // Verificar se precisamos sincronizar com a sessão tradicional
          try {
            // Obter a sessão atual para extrair o token de acesso real
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData?.session?.access_token;
            
            console.log('Sincronizando sessão com token JWT:', accessToken ? 'Disponível' : 'Indisponível');
            
            if (!accessToken) {
              console.warn('Token de acesso não disponível para sincronização');
              throw new Error('Token de acesso não disponível');
            }
            
            // Armazenar token para uso em outras requisições
            localStorage.setItem('authToken', accessToken);
            
            const syncResponse = await fetch('/api/resync-session-jwt', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
              },
              credentials: 'include'
            });
            
            if (syncResponse.ok) {
              console.log('Sessão tradicional sincronizada com Supabase');
            } else {
              console.warn('Não foi possível sincronizar a sessão tradicional');
            }
          } catch (syncError) {
            console.warn('Erro ao sincronizar sessão:', syncError);
          }
        } else {
          // Se não tem usuário no Supabase, tenta a verificação tradicional
          await checkTraditionalAuth();
        }
      } else {
        // Supabase ainda está carregando, verificar método tradicional enquanto isso
        await checkTraditionalAuth();
      }
      
      setIsLoading(false);
    };
    
    verifyAuth();
  }, [supabaseUser, supabaseLoading, supabaseAuthenticated]);
  
  // Função para verificar autenticação tradicional
  const checkTraditionalAuth = async () => {
    try {
      console.log("Verificando autenticação tradicional...");
      
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
          // Tenta verificar o token JWT
          const jwtVerifyResponse = await fetch('/api/hybrid/auth/verify', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (jwtVerifyResponse.ok) {
            // Token JWT válido
            const jwtData = await jwtVerifyResponse.json();
            console.log("Token JWT verificado com sucesso:", jwtData);
            userData = jwtData.user;
            isAuthenticated = true;
          } else {
            console.warn("Token JWT inválido ou expirado");
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
        
        // VERIFICAÇÃO DE SEGURANÇA: Operadores não podem acessar o sistema principal via verificação inicial
        // TEMPORARIAMENTE DESABILITADO PARA PERMITIR ACESSO AO SISTEMA PRINCIPAL
        /*
        if (userData.role === 'operador') {
          console.log('Operador detectado durante verificação inicial, redirecionando para base externa:', userData.basename);
          
          // Definir URL de redirecionamento baseada na base do operador
          let redirectUrl = '/';
          
          if (userData.basename) {
            switch (userData.basename.toUpperCase()) {
              case 'GP01':
                redirectUrl = '/bases/gp01/external';
                break;
              case 'GP02':
                redirectUrl = '/bases/gp02/external';
                break;
              case 'GP03':
                redirectUrl = '/bases/gp03/external';
                break;
              case 'CAMPINAS':
                redirectUrl = '/bases/campinas/external';
                break;
              case 'BRASILIA':
                redirectUrl = '/bases/brasilia/external';
                break;
              case 'SC':
              case 'SC_LAJEADO_SRS10SDD':
                redirectUrl = '/bases/sc_lajeado_srs10sdd/external';
                break;
              default:
                // Para outras bases, tentar construir URL baseada no nome
                const baseNameLower = userData.basename.toLowerCase();
                redirectUrl = `/bases/${baseNameLower}/external`;
            }
          }
          
          // Redirecionar silenciosamente sem mostrar alerta durante verificação inicial
          console.log('Redirecionando operador para:', redirectUrl);
          window.location.href = redirectUrl;
          return;
        }
        */
        
        setUser(userData);
      } else {
        console.log("Usuário não autenticado");
        setUser(null);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação tradicional:', error);
    } finally {
      setIsLoading(false);
      console.log("Verificação de autenticação completa, isLoading=false");
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      console.log("Tentando fazer login com:", email);
      
      // Sempre tentar a autenticação tradicional primeiro
      let userData = null;
      let authSuccess = false;
      
      // PASSO 1: Tentar autenticação tradicional através da API Express
      try {
        console.log("Iniciando autenticação tradicional...");
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Importante para cookies de sessão
          body: JSON.stringify({ username: email, password }),
        });
        
        if (response.ok) {
          userData = await response.json();
          console.log("Login tradicional bem-sucedido:", userData);
          authSuccess = true;
          
          // Adicionar header de verificação para garantir cookie
          const verifyResponse = await fetch('/api/user', {
            method: 'GET',
            credentials: 'include',
            headers: { 'X-Auth-Verification': 'true' }
          });
          
          if (!verifyResponse.ok) {
            console.warn("Verificação de sessão falhou após login bem-sucedido. Tentando recuperar...");
          } else {
            console.log("Sessão verificada e cookies persistidos com sucesso");
          }
        } else {
          // Verificar se é um erro de acesso negado para operadores
          if (response.status === 403) {
            try {
              const errorData = await response.json();
              if (errorData.message && errorData.message.includes('Operadores devem acessar apenas a base designada')) {
                console.log("Operador detectado tentando acessar sistema principal. Login válido mas requer redirecionamento para base.");
                
                // Lançar erro específico com informação suficiente para redirect  
                const error = new Error('OPERADOR_REDIRECT_REQUIRED');
                (error as any).originalMessage = errorData.message;
                (error as any).errorData = errorData;
                throw error;
              }
            } catch (parseError) {
              console.warn("Erro ao parsear resposta de erro:", parseError);
            }
          }
          console.warn("Autenticação tradicional falhou, tentando métodos alternativos");
        }
      } catch (tradError) {
        console.error("Erro na autenticação tradicional:", tradError);
        // Se for um erro de acesso negado para operadores, rejeitar imediatamente
        if (tradError instanceof Error && tradError.message === 'OPERADOR_REDIRECT_REQUIRED') {
          throw tradError;
        }
      }
      
      // PASSO 2: Se a autenticação tradicional falhar, tentar Supabase
      if (!authSuccess) {
        try {
          console.log("Tentando login com Supabase...");
          const loginResult = await supabaseLogin(email, password);
          const { error: loginError } = loginResult;
          
          if (loginResult && 'user' in loginResult && loginResult.user) {
            console.log("Login Supabase bem-sucedido:", loginResult.user);
            
            // Converter para o formato esperado do usuário
            const userResult = loginResult.user as any;
            userData = {
              id: userResult?.id ? parseInt(userResult.id) : 0,
              name: userResult?.user_metadata?.name || 'Usuário',
              email: userResult?.email || email,
              role: userResult?.user_metadata?.role || 'operador',
              baseId: userResult?.user_metadata?.baseId || null,
              basename: userResult?.user_metadata?.basename || null,
              oficina_id: userResult?.user_metadata?.oficina_id || null
            };
            
            authSuccess = true;
            
            // Sincronizar com sistema tradicional
            if ('session' in loginResult && loginResult.session) {
              try {
                console.log("Sincronizando sessão tradicional com Supabase...");
                const syncResponse = await fetch('/api/resync-session-jwt', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(loginResult.session as any)?.access_token}`
                  },
                  credentials: 'include'
                });
                
                if (syncResponse.ok) {
                  console.log("Sessão tradicional sincronizada após login Supabase");
                } else {
                  console.warn("Falha ao sincronizar sessão tradicional");
                }
              } catch (syncError) {
                console.warn("Erro ao sincronizar sessão:", syncError);
              }
            }
          } else if (loginError) {
            console.warn("Falha no login com Supabase:", loginError);
          }
        } catch (supabaseError) {
          console.error("Erro ao tentar login com Supabase:", supabaseError);
        }
      }
      
      // PASSO 3: Se ainda não autenticou, tentar autenticação JWT híbrida
      if (!authSuccess) {
        try {
          console.log("Tentando autenticação JWT híbrida...");
          const jwtResponse = await fetch('/api/hybrid/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          
          if (jwtResponse.ok) {
            const jwtData = await jwtResponse.json();
            
            // Armazenar o token JWT no localStorage para uso futuro
            if (jwtData.token) {
              localStorage.setItem('authToken', jwtData.token);
              console.log("Token JWT armazenado com sucesso");
              userData = jwtData.user;
              authSuccess = true;
            }
          } else {
            console.warn("Autenticação JWT híbrida falhou");
          }
        } catch (jwtError) {
          console.error("Erro na autenticação JWT híbrida:", jwtError);
        }
      }
      
      // PASSO 4: Se algum método funcionou, sincronizar entre os sistemas
      if (authSuccess && userData) {
        console.log("Autenticação bem-sucedida. Método:", 
          authSuccess ? "Tradicional -> Supabase -> JWT" : "Falha");
        
        // VERIFICAÇÃO DE SEGURANÇA: Operadores não podem acessar o sistema principal
        if (userData.role === 'operador') {
          console.log('Operador tentou fazer login no sistema principal:', userData.basename);
          
          // Definir URL de redirecionamento baseada na base do operador
          let redirectUrl = '/';
          
          if (userData.basename) {
            switch (userData.basename.toUpperCase()) {
              case 'GP01':
                redirectUrl = '/bases/gp01/external';
                break;
              case 'GP02':
                redirectUrl = '/bases/gp02/external';
                break;
              case 'GP03':
                redirectUrl = '/bases/gp03/external';
                break;
              case 'CAMPINAS':
                redirectUrl = '/bases/campinas/external';
                break;
              case 'BRASILIA':
                redirectUrl = '/bases/brasilia/external';
                break;
              case 'SC':
              case 'SC_LAJEADO_SRS10SDD':
                redirectUrl = '/bases/sc_lajeado_srs10sdd/external';
                break;
              default:
                // Para outras bases, tentar construir URL baseada no nome
                const baseNameLower = userData.basename.toLowerCase();
                redirectUrl = `/bases/${baseNameLower}/external`;
            }
          }
          
          // Lançar erro com mensagem específica para tentativa de login
          throw new Error(`Acesso restrito. Este perfil deve acessar pelo link externo específico: ${redirectUrl}`);
        }
        
        // Define o usuário no estado
        setUser(userData);
        
        // Verificar se temos usuário em um sistema mas não no outro
        if (authSuccess && !supabaseAuthenticated) {
          try {
            console.log("Sincronizando com Supabase após login tradicional...");
            await supabaseRegister(email, password, JSON.stringify({
              name: userData.name,
              role: userData.role,
              baseId: userData.baseId,
              basename: userData.basename,
              oficina_id: userData.oficina_id
            }));
            console.log("Registro Supabase realizado após login tradicional");
          } catch (syncError) {
            console.warn("Não foi possível registrar no Supabase:", syncError);
          }
        }
        
        toast({
          title: "Login bem-sucedido",
          description: `Bem-vindo, ${userData?.name || email}!`,
        });
        
        return userData as User;
      } else {
        throw new Error("Não foi possível autenticar com nenhum dos métodos disponíveis");
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      // Verificar se é um erro de operador tentando acessar sistema principal
      if (error.message && error.message.includes('Acesso restrito. Este perfil deve acessar pelo link externo específico')) {
        // Extrair URL de redirecionamento da mensagem de erro
        const redirectMatch = error.message.match(/específico: (.+)/);
        if (redirectMatch) {
          const redirectUrl = redirectMatch[1];
          
          toast({
            title: "Acesso Restrito",
            description: "Este perfil deve acessar pelo link externo específico. Você será redirecionado.",
            variant: "destructive",
          });
          
          // Aguardar um pouco para mostrar o toast e depois redirecionar
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 2000);
          
          throw error;
        }
      }
      
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

  const loginBase = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Chama o endpoint específico para login de bases
      const response = await fetch('/api/auth/login-base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro no login');
      }

      // Define o usuário no estado
      setUser(data.user);
      
      toast({
        title: "Login bem-sucedido",
        description: `Bem-vindo, ${data.user.name}!`,
      });

      return data.user;
    } catch (error) {
      console.error('Erro no login da base:', error);
      
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
      setIsLoading(true);
      
      // Primeiro tenta logout via Supabase
      let supabaseLogoutSuccess = false;
      try {
        const logoutResult = await supabaseLogout();
        if (logoutResult && 'error' in logoutResult && !logoutResult.error) {
          supabaseLogoutSuccess = true;
          console.log("Logout Supabase realizado com sucesso");
        } else if (logoutResult && 'error' in logoutResult && logoutResult.error) {
          console.warn("Erro ao fazer logout do Supabase:", logoutResult.error);
        }
      } catch (supaError) {
        console.error("Exceção ao fazer logout do Supabase:", supaError);
      }
      
      // Fazer logout tradicional independentemente do resultado do Supabase
      try {
        // Remover token JWT do localStorage
        localStorage.removeItem('authToken');
        console.log("Token JWT removido do localStorage");
        
        // Use direct fetch to avoid potential routing issues with apiRequest
        const response = await fetch('/api/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.warn('Erro ao fazer logout tradicional:', errorData.message);
        } else {
          console.log("Logout tradicional realizado com sucesso");
        }
      } catch (tradError) {
        console.warn("Erro ao fazer logout tradicional:", tradError);
      }
      
      // Resetar o estado independentemente do método
      setUser(null);
      
      // Redirecionar para a página de login
      setLocation('/');
      
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
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string): Promise<User> => {
    setIsLoading(true);
    try {
      console.log("Tentando registrar usuário:", email);
      
      // Dados do usuário para registro
      const userData = {
        name,
        role: 'operador', // Papel padrão para novos usuários
      };
      
      // Primeiro tentar registro no Supabase
      let supabaseSuccessful = false;
      let registeredUser = null;
      
      try {
        const registerResult = await supabaseRegister(email, password, JSON.stringify(userData));
        
        if (registerResult && 'user' in registerResult && registerResult.user) {
          console.log("Registro Supabase bem-sucedido:", registerResult.user);
          supabaseSuccessful = true;
          
          // Converter para o formato esperado do usuário
          const userResult = registerResult.user as any;
          registeredUser = {
            id: userResult.id ? parseInt(userResult.id) : 0,
            name: name,
            email: email,
            role: 'operador',
            baseId: null,
            basename: null,
            oficina_id: null
          };
        } else if (registerResult && 'error' in registerResult && registerResult.error) {
          console.warn("Falha no registro com Supabase:", registerResult.error);
        }
      } catch (supabaseError) {
        console.error("Erro ao tentar registro com Supabase:", supabaseError);
      }
      
      // Se o registro no Supabase falhou ou não está disponível, tentar o registro tradicional
      if (!supabaseSuccessful) {
        console.log("Tentando registro tradicional...");
        
        const response = await apiRequest('POST', '/api/register', {
          username: email,
          password: password,
          name: name,
          role: 'operador'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao registrar usuário');
        }
        
        registeredUser = await response.json();
        console.log("Registro tradicional bem-sucedido:", registeredUser);
      }
      
      // Define o usuário no estado
      setUser(registeredUser);
      
      toast({
        title: "Registro bem-sucedido",
        description: "Sua conta foi criada com sucesso!",
      });
      
      return registeredUser as User;
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
    loginBase,
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
