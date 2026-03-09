import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabaseClient';

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
  loginBase: (email: string, password: string, baseId?: number) => Promise<User>;
  register: (email: string, password: string, name: string) => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

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

// Chave para armazenar usuário no localStorage (para persistência entre navegações SPA)
const AUTH_USER_KEY = 'auth_user_session';
const AUTH_TIMESTAMP_KEY = 'auth_user_timestamp';
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 horas em ms

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Função para salvar usuário no localStorage
  const saveUserToStorage = (userData: User) => {
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
      localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
    } catch (e) {
      console.warn('[AuthContext] Erro ao salvar usuário no localStorage:', e);
    }
  };

  // Função para recuperar usuário do localStorage
  const getUserFromStorage = (): User | null => {
    try {
      const storedUser = localStorage.getItem(AUTH_USER_KEY);
      const timestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY);
      
      if (!storedUser || !timestamp) return null;
      
      // Verificar se a sessão expirou
      const age = Date.now() - parseInt(timestamp, 10);
      if (age > SESSION_MAX_AGE) {
        clearUserStorage();
        return null;
      }
      
      return JSON.parse(storedUser) as User;
    } catch (e) {
      console.warn('[AuthContext] Erro ao recuperar usuário do localStorage:', e);
      return null;
    }
  };

  // Função para limpar localStorage
  const clearUserStorage = () => {
    try {
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TIMESTAMP_KEY);
    } catch (e) {
      console.warn('[AuthContext] Erro ao limpar localStorage:', e);
    }
  };

  /**
   * VERIFICAÇÃO DE AUTENTICAÇÃO COM BEARER TOKEN (Supabase Auth)
   * 
   * Fluxo:
   * 1. Verificar se há sessão Supabase ativa
   * 2. Se sim, obter access_token e chamar /api/user com Bearer Token
   * 3. Se não, verificar localStorage como fallback
   * 
   * Por que Bearer Token:
   * - Não depende de cookies (resolve problema do domínio customizado)
   * - Token enviado explicitamente no header Authorization
   * - Funciona em qualquer domínio
   */
  useEffect(() => {
    const checkAuth = async () => {
      console.log("[Auth] Verificando autenticação via Supabase...");
      
      try {
        // PASSO 1: Verificar sessão Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.warn("[Auth] Erro ao obter sessão Supabase:", sessionError.message);
        }
        
        if (session?.access_token) {
          console.log("[Auth] Sessão Supabase encontrada, verificando com backend...");
          
          // PASSO 2: Chamar /api/user com Bearer Token
          const response = await fetch('/api/user', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            cache: 'no-store'
          });
          
          if (response.ok) {
            const userData = await response.json();
            console.log("[Auth] Usuário autenticado via Bearer Token:", userData.email);
            
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
            saveUserToStorage(formattedUser);
            setIsLoading(false);
            return;
          } else {
            console.log("[Auth] Bearer Token inválido ou usuário não encontrado no backend");
          }
        }
        
        // PASSO 3: Fallback - verificar localStorage
        console.log("[Auth] Sem sessão Supabase, verificando localStorage...");
        const storedUser = getUserFromStorage();
        if (storedUser) {
          console.log("[Auth] Usuário recuperado do localStorage:", storedUser.email);
          setUser(storedUser);
        } else {
          console.log("[Auth] Nenhuma sessão encontrada");
          setUser(null);
        }
        
      } catch (error) {
        console.error("[Auth] Erro ao verificar autenticação:", error);
        // Em caso de erro, tentar localStorage
        const storedUser = getUserFromStorage();
        if (storedUser) {
          console.log("[Auth] Usuário recuperado do localStorage após erro:", storedUser.email);
          setUser(storedUser);
        } else {
          setUser(null);
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
    
    // Escutar mudanças de autenticação do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[Auth] Estado de autenticação mudou:", event);
      
      if (event === 'SIGNED_IN' && session?.access_token) {
        // Usuário logou no Supabase, buscar dados do backend
        try {
          const response = await fetch('/api/user', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
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
            saveUserToStorage(formattedUser);
          }
        } catch (error) {
          console.error("[Auth] Erro ao sincronizar após login Supabase:", error);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        clearUserStorage();
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Login - verifica credenciais diretamente no backend (banco local)
   * 
   * Fluxo:
   * 1. Enviar email/password para o backend
   * 2. Backend valida e retorna JWT + dados do usuário
   * 3. JWT salvo no localStorage para requisições subsequentes
   */
  const login = async (email: string, password: string): Promise<User> => {
    console.log("[Auth] Tentando login:", email);
    
    try {
      // Autenticar diretamente no backend com email/password
      const response = await fetch('/api/auth/login-base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Usuário não encontrado no sistema');
      }
      
      const responseData = await response.json();
      const userData = responseData.user;
      
      // Salvar token JWT para requisições subsequentes
      if (responseData.token) {
        localStorage.setItem('jwt_token', responseData.token);
      }
      
      console.log("[Auth] Login completo:", userData.email);
      
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
      saveUserToStorage(formattedUser);
      
      toast({
        title: "Login realizado",
        description: `Bem-vindo, ${userData.name}!`,
      });

      return formattedUser;
    } catch (error) {
      console.error("[Auth] Erro no login:", error);
      toast({
        title: "Erro no login",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      throw error;
    }
  };

  /**
   * Login de base - verifica credenciais diretamente no backend (banco local)
   */
  const loginBase = async (email: string, password: string, baseId?: number): Promise<User> => {
    console.log("[Auth] Tentando login de base:", email, "Base ID:", baseId);
    
    try {
      // Autenticar diretamente no backend com email/password
      const response = await fetch('/api/auth/login-base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, baseId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Credenciais inválidas');
      }
      
      const responseData = await response.json();
      const userData = responseData.user;
      
      // Salvar token JWT se retornado pelo backend
      if (responseData.token) {
        localStorage.setItem('jwt_token', responseData.token);
      }
      
      console.log("[Auth] loginBase - Usuário autenticado:", userData.email);
      
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
      saveUserToStorage(formattedUser); // Persistir no localStorage
      
      toast({
        title: "Login realizado",
        description: `Bem-vindo à base, ${formattedUser.name}!`,
      });

      return formattedUser;
    } catch (error) {
      console.error("[loginBase] Erro:", error);
      toast({
        title: "Erro no login",
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
      saveUserToStorage(formattedUser); // Persistir no localStorage
      
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

  /**
   * Logout - Desconecta do Supabase e limpa estado local
   */
  const logout = async (): Promise<void> => {
    console.log("[Auth] Fazendo logout...");
    
    try {
      // Limpar JWT do localStorage
      localStorage.removeItem('jwt_token');
      
      // Também chamar logout do backend (para limpar qualquer sessão residual)
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {
        // Ignorar erro no logout do backend
      });
      
      // Fazer logout do Supabase se houver sessão ativa
      await supabase.auth.signOut().catch(() => {});
    } catch (error) {
      console.error("[Auth] Erro no logout:", error);
    }
    
    clearUserStorage();
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