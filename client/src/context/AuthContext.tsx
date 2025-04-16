import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase, signIn, signOut, getCurrentUser } from '@/lib/supabase';

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
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
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
          console.error('Auth check error:', error);
          return;
        }
        
        if (data.user) {
          // Fetch additional user data from Supabase
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', data.user.email)
            .single();
            
          if (userError) {
            console.error('User data fetch error:', userError);
            return;
          }
          
          setUser(userData);
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
          // Fetch user data from Supabase
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', session.user.email)
            .single();
            
          if (!userError) {
            setUser(userData);
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
        // Fetch additional user data from Supabase
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', data.user.email)
          .single();
          
        if (userError) {
          throw userError;
        }
        
        setUser(userData);
        
        toast({
          title: "Login bem-sucedido",
          description: `Bem-vindo, ${userData.name || userData.email}!`,
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Falha no login",
        description: error.message || "Email ou senha incorretos",
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

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
