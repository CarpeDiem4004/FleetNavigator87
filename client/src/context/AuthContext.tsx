import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase, signIn, signOut, getCurrentUser, signUp } from '@/lib/supabase';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  baseId?: number;
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
    // Check if user is logged in on page load
    const checkAuth = async () => {
      try {
        const { data, error } = await getCurrentUser();
        
        if (error) {
          // AuthSessionMissingError é esperado quando não há sessão, 
          // então não precisamos logar esse erro específico
          if (error.name !== 'AuthSessionMissingError') {
            console.error('Auth check error:', error);
          }
          setIsLoading(false);
          return;
        }
        
        if (data?.user) {
          try {
            // Fetch additional user data from Supabase
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('email', data.user.email)
              .single();
              
            if (userError) {
              if (userError.code === 'PGRST116') {
                // Usuário autenticado, mas não encontrado na tabela users
                // Isso pode acontecer se o usuário foi criado pela autenticação
                // mas não foi criado na tabela users ainda
                console.log('Usuário autenticado, mas não encontrado na tabela de usuários');
              } else {
                console.error('User data fetch error:', userError);
              }
              setIsLoading(false);
              return;
            }
            
            setUser(userData);
          } catch (err) {
            console.error('User data processing error:', err);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsLoading(true);
        
        if (event === 'SIGNED_IN' && session) {
          try {
            // Fetch user data from Supabase
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('email', session.user.email)
              .single();
              
            if (userError) {
              if (userError.code === 'PGRST116') {
                // Usuário autenticado, mas não encontrado na tabela users
                console.log('Usuário autenticado via sessão, mas não encontrado na tabela de usuários');
                
                // Se quisermos, podemos criar um registro na tabela users com informações básicas
                // Este bloco é opcional e depende das regras de negócio
                const authUser = session.user;
                if (authUser && authUser.email) {
                  const newUser = {
                    email: authUser.email,
                    name: authUser.user_metadata?.name || authUser.email.split('@')[0],
                    role: 'operador', // Papel padrão para novos usuários
                  };
                  
                  const { data: createdUser, error: createError } = await supabase
                    .from('users')
                    .insert(newUser)
                    .select()
                    .single();
                    
                  if (!createError && createdUser) {
                    setUser(createdUser);
                    console.log('Usuário criado automaticamente na tabela users');
                  } else {
                    console.error('Erro ao criar usuário na tabela users:', createError);
                  }
                }
              } else {
                console.error('User data fetch error on auth state change:', userError);
              }
            } else if (userData) {
              setUser(userData);
            }
          } catch (err) {
            console.error('Error processing auth state change:', err);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await signIn({ email, password });
      
      if (error) {
        throw error;
      }
      
      if (data.user) {
        try {
          // Fetch additional user data from Supabase
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', data.user.email)
            .single();
            
          if (userError) {
            if (userError.code === 'PGRST116') {
              // Usuário existe na autenticação mas não na tabela users
              // Vamos criar o usuário automaticamente
              console.log('Usuário autenticado, mas não encontrado na tabela users. Criando...');
              
              const authUser = data.user;
              if (!authUser.email) {
                throw new Error('Email do usuário não disponível');
              }
              
              const email = authUser.email as string;
              const newUser = {
                email: email,
                name: authUser.user_metadata?.name || email.split('@')[0],
                role: 'operador', // Papel padrão para novos usuários
              };
              
              const { data: createdUser, error: createError } = await supabase
                .from('users')
                .insert(newUser)
                .select()
                .single();
                
              if (createError) {
                console.error('Erro ao criar usuário na tabela users:', createError);
                throw createError;
              }
              
              setUser(createdUser);
              
              toast({
                title: "Login bem-sucedido",
                description: `Bem-vindo, ${createdUser.name || createdUser.email}!`,
              });
              
              return;
            } else {
              // Outro tipo de erro
              throw userError;
            }
          }
          
          setUser(userData);
          
          toast({
            title: "Login bem-sucedido",
            description: `Bem-vindo, ${userData.name || userData.email}!`,
          });
        } catch (err) {
          console.error('Erro ao processar dados do usuário:', err);
          throw err;
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = "Email ou senha incorretos";
      
      // Mensagens de erro mais específicas
      if (error.message) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = "Credenciais inválidas. Verifique seu email e senha.";
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = "Email não confirmado. Por favor, verifique seu email.";
        } else if (error.message.includes('rate limit')) {
          errorMessage = "Muitas tentativas de login. Tente novamente mais tarde.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Falha no login",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
    } catch (error: any) {
      console.error('Logout error:', error);
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
      const { data, error } = await signUp({ email, password, name });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Registro bem-sucedido",
        description: "Sua conta foi criada com sucesso! Você pode fazer login agora.",
      });
      
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = "Erro ao cadastrar usuário";
      
      // Mensagens de erro mais específicas
      if (error.message) {
        if (error.message.includes('already registered')) {
          errorMessage = "Este e-mail já está registrado.";
        } else if (error.message.includes('rate limit')) {
          errorMessage = "Muitas tentativas de cadastro. Tente novamente mais tarde.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Falha no cadastro",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
