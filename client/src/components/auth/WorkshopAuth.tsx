import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Building2, Lock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WorkshopUser {
  id: number;
  razao_social: string;
  cnpj: string;
  email: string;
  telefone: string;
}

interface WorkshopAuthProps {
  children: React.ReactNode;
  workshopName?: string;
}

interface LoginResponse {
  token: string;
  oficina: WorkshopUser;
}

const WorkshopAuth: React.FC<WorkshopAuthProps> = ({ children, workshopName = "Oficina" }) => {
  const { toast } = useToast();
  const [user, setUser] = useState<WorkshopUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginData, setLoginData] = useState({ cnpj: '', password: '' });
  const isMountedRef = useRef(true);

  // Verificar autenticação existente
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('workshop_token');
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/oficina/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const userData = await response.json();
          if (isMountedRef.current) {
            setUser({
              id: userData.id,
              razao_social: userData.razao_social || userData.nome,
              cnpj: userData.cnpj,
              email: userData.email,
              telefone: userData.telefone
            });
          }
        } else {
          // Token inválido, remover
          localStorage.removeItem('workshop_token');
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        localStorage.removeItem('workshop_token');
      }

      if (isMountedRef.current) {
        setIsLoading(false);
      }
    };

    checkAuth();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/oficina/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem('workshop_token', data.token);
        
        if (isMountedRef.current) {
          setUser(data.oficina);
          toast({
            title: "Login realizado com sucesso",
            description: `Bem-vindo(a), ${data.oficina.razao_social}!`
          });
        }
      } else {
        throw new Error(data.message || 'Erro no login');
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      if (isMountedRef.current) {
        setError(error.message || 'Erro ao fazer login');
        toast({
          title: "Erro no login",
          description: error.message || 'Verifique suas credenciais',
          variant: "destructive"
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('workshop_token');
    setUser(null);
    setLoginData({ cnpj: '', password: '' });
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso"
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // User is authenticated
  if (user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <Building2 className="h-6 w-6 text-blue-600" />
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {user.razao_social}
                  </h1>
                  <p className="text-sm text-gray-500">CNPJ: {user.cnpj}</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    );
  }

  // Login form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Acesso para Oficinas
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sistema de Gestão de Manutenção - {workshopName}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Login da Oficina
            </CardTitle>
            <CardDescription>
              Faça login com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={loginData.cnpj}
                  onChange={(e) => setLoginData(prev => ({ ...prev, cnpj: e.target.value }))}
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fazendo login...
                  </>
                ) : (
                  <>
                    <User className="mr-2 h-4 w-4" />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <strong>Credenciais de teste:</strong><br />
                CNPJ: 12.345.678/0001-90<br />
                Senha: senha123
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkshopAuth;