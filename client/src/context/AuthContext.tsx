import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase-compat';
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

const stubUser: User = {
  id: 0,
  name: '',
  email: '',
  role: '',
};

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

  // Simplified authentication check
  useEffect(() => {
    const verifyAuth = async () => {
      console.log("Verificando estado de autenticação inicial...");
      try {
        const response = await apiRequest('/api/user');
        if (response && response.user) {
          setUser(response.user);
        }
      } catch (error) {
        console.log('Usuário não autenticado');
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      setIsLoading(true);
      
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response && response.user) {
        setUser(response.user);
        setLocation('/dashboard');
        return response.user;
      }
      
      throw new Error('Login failed');
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginBase = async (email: string, password: string): Promise<User> => {
    return login(email, password);
  };

  const register = async (email: string, password: string, name: string): Promise<User> => {
    try {
      setIsLoading(true);
      
      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (response && response.user) {
        setUser(response.user);
        return response.user;
      }
      
      throw new Error('Registration failed');
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiRequest('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setLocation('/login');
    }
  };

  const value = {
    user,
    isLoading,
    login,
    loginBase,
    register,
    logout,
  };

  console.log("AuthContext Provider valores:", Object.keys(value));

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};