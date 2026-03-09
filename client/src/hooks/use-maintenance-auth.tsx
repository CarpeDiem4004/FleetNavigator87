import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type MaintenanceUser = {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'gestor_frota' | 'oficina';
  oficina_id?: number;
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
};

type MaintenanceAuthContextType = {
  user: MaintenanceUser | null;
  isLoading: boolean;
  login: (credentials: { cnpj?: string; email?: string; password: string }) => Promise<boolean>;
  logout: () => void;
};

const MaintenanceAuthContext = createContext<MaintenanceAuthContextType | null>(null);

export function MaintenanceAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MaintenanceUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se há token armazenado
    const token = localStorage.getItem('maintenance_token');
    if (token) {
      // Verificar se o token é válido fazendo uma requisição para uma rota protegida
      verifyToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('/api/maintenance/veiculos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Token é válido, decodificar dados do usuário do token
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: payload.id,
          name: payload.name || '',
          email: payload.email,
          role: payload.role,
          oficina_id: payload.oficina_id,
          cnpj: payload.cnpj,
          razao_social: payload.razao_social,
          nome_fantasia: payload.nome_fantasia
        });
      } else {
        // Token inválido
        localStorage.removeItem('maintenance_token');
      }
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      localStorage.removeItem('maintenance_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: { cnpj?: string; email?: string; password: string }) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/maintenance/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('maintenance_token', data.token);
        setUser(data.user);
        
        toast({
          title: "Login realizado com sucesso",
          description: `Bem-vindo, ${data.user.name}!`
        });
        
        return true;
      } else {
        toast({
          title: "Erro no login",
          description: data.error || "Credenciais inválidas",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast({
        title: "Erro no login",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('maintenance_token');
    setUser(null);
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso"
    });
  };

  return (
    <MaintenanceAuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </MaintenanceAuthContext.Provider>
  );
}

export function useMaintenanceAuth() {
  const context = useContext(MaintenanceAuthContext);
  if (!context) {
    throw new Error("useMaintenanceAuth deve ser usado dentro de MaintenanceAuthProvider");
  }
  return context;
}

// Hook para fazer requisições autenticadas
export function useMaintenanceApi() {
  const makeRequest = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('maintenance_token');
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('maintenance_token');
        window.location.reload();
      }
      throw new Error(`Erro na requisição: ${response.status}`);
    }

    return response.json();
  };

  return { makeRequest };
}