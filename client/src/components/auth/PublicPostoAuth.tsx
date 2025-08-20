import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Fuel, AlertTriangle } from 'lucide-react';

// Tipos
interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface PublicPostoAuthProps {
  children: React.ReactNode;
  postoId: string;
  postoName: string;
}

// Componente principal
const PublicPostoAuth: React.FC<PublicPostoAuthProps> = ({ children, postoId, postoName }) => {
  const [location] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // Verificar sessão ao carregar
  useEffect(() => {
    const checkSession = async () => {
      if (!isMountedRef.current) return;
      
      setIsLoading(true);
      
      try {
        const response = await fetch('/api/auth/user', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (!isMountedRef.current) return;
        
        if (response.ok) {
          const userData = await response.json();
          console.log('PublicPostoAuth: Usuário autenticado encontrado', userData);
          
          setUser({
            id: userData.id.toString(),
            email: userData.email,
            name: userData.name || userData.email,
            role: userData.role || 'operador'
          });
        } else {
          console.log('PublicPostoAuth: Usuário não autenticado, exibindo login');
          setShowDialog(true);
        }
      } catch (error) {
        console.warn('PublicPostoAuth: Erro ao verificar sessão:', error);
        setShowDialog(true);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };
    
    isMountedRef.current = true;
    checkSession();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Função de login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isMountedRef.current) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/login-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password
        }),
        credentials: 'include'
      });
      
      if (!isMountedRef.current) return;
      
      if (response.ok) {
        const userData = await response.json();
        console.log('PublicPostoAuth: Login realizado com sucesso', userData);
        
        // Handle both response formats (direct user data or nested under user property)
        const userInfo = userData.user || userData;
        
        setUser({
          id: userInfo.id.toString(),
          email: userInfo.email,
          name: userInfo.name || userInfo.email,
          role: userInfo.role || 'operador'
        });
        
        setShowDialog(false);
        
        // Store authentication data
        if (userData.token) {
          localStorage.setItem('access_token', userData.token);
        }
        
        // Store user data for external fuel station access
        localStorage.setItem('user_id', userInfo.id.toString());
        localStorage.setItem('user_email', userInfo.email);
        localStorage.setItem('user_name', userInfo.name || '');
        localStorage.setItem('user_role', userInfo.role || 'operador');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Credenciais inválidas');
      }
    } catch (error) {
      console.error('PublicPostoAuth: Erro no login:', error);
      setError('Erro de conexão. Tente novamente.');
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  // Se estiver carregando, mostra spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Verificando autenticação...</span>
      </div>
    );
  }

  return (
    <>
      {/* Se o usuário estiver autenticado, renderiza o conteúdo */}
      {user ? (
        <>
          {/* Badge identificadora do posto e operador */}
          <div className="bg-green-50 border border-green-200 p-2 rounded-md mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <Fuel className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <span className="text-sm font-medium text-green-800">
                  {localStorage.getItem('user_basename') || `Posto ${postoName}`}
                </span>
                <span className="mx-2 text-green-500">•</span>
                <span className="text-sm text-green-700">
                  Operador: {user.name || user.email}
                </span>
              </div>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('user_id');
                localStorage.removeItem('user_email');
                localStorage.removeItem('user_name');
                localStorage.removeItem('user_role');
                localStorage.removeItem('user_base_id');
                localStorage.removeItem('user_basename');
                
                fetch('/api/auth/logout', {
                  method: 'POST',
                  credentials: 'include'
                });
                
                window.location.reload();
              }}
              className="text-xs text-green-700 hover:text-green-900 underline"
            >
              Sair
            </button>
          </div>
          {children}
        </>
      ) : (
        /* Se não estiver autenticado, mostra o diálogo de login */
        <Dialog open={showDialog} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Login para Acesso ao Posto {postoName}</DialogTitle>
              <DialogDescription>
                Digite suas credenciais para acessar o formulário de abastecimento.
              </DialogDescription>
            </DialogHeader>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="seu.email@exemplo.com"
                  value={loginData.email}
                  onChange={(e) => {
                    if (isMountedRef.current) {
                      setLoginData({ ...loginData, email: e.target.value });
                    }
                  }}
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => {
                    if (isMountedRef.current) {
                      setLoginData({ ...loginData, password: e.target.value });
                    }
                  }}
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              <DialogFooter className="pt-4">
                <p className="text-sm text-gray-500 mr-auto">
                  Contate o administrador para obter acesso ao sistema
                </p>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default PublicPostoAuth;