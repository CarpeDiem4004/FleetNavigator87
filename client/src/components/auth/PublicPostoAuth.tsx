import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { createClient } from '@supabase/supabase-js';
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
import { Loader2, Fuel } from 'lucide-react';

// Importação central do Supabase para garantir consistência
import { supabase } from '@/lib/supabase-client';

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
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar sessão ao carregar
  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      
      try {
        // Verificar se há token no localStorage
        const token = localStorage.getItem('access_token');
        
        if (token) {
          // Verificar se o token ainda é válido no Supabase
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (session) {
            console.log('Sessão existente encontrada', session);
            
            // Recuperar dados do usuário armazenados no localStorage
            const userId = localStorage.getItem('user_id') || '';
            const email = localStorage.getItem('user_email') || '';
            const name = localStorage.getItem('user_name') || '';
            const role = localStorage.getItem('user_role') || '';
            
            setUser({
              id: userId,
              email,
              name,
              role
            });
          } else {
            console.log('Token expirado ou inválido, redirecionando para login');
            // Limpar dados locais expirados
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_id');
            localStorage.removeItem('user_email');
            localStorage.removeItem('user_name');
            localStorage.removeItem('user_role');
            setLoginModalOpen(true);
          }
        } else {
          console.log('Nenhum token encontrado, exibindo modal de login');
          setLoginModalOpen(true);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        setLoginModalOpen(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, []);

  // Função de login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('Tentando login com:', { email: loginData.email });
      
      // Abordagem 1: Login via Supabase diretamente
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      });
      
      if (error) {
        console.warn('Erro na autenticação Supabase:', error.message);
        
        // Antes de desistir, vamos tentar um login alternativo via API do servidor
        try {
          console.log('Tentando autenticação via API do servidor...');
          const apiResponse = await fetch('/api/auth/login-hybrid', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: loginData.email,
              password: loginData.password
            }),
            credentials: 'include' // Importante para sessões
          });
          
          if (apiResponse.ok) {
            const userData = await apiResponse.json();
            console.log('Login via servidor bem-sucedido:', userData);
            
            // Definir usuário no estado usando os dados do servidor
            setUser({
              id: userData.id.toString(),
              email: userData.email,
              name: userData.name,
              role: userData.role
            });
            
            // Armazenar dados no localStorage
            localStorage.setItem('user_id', userData.id.toString());
            localStorage.setItem('user_email', userData.email);
            localStorage.setItem('user_name', userData.name || '');
            localStorage.setItem('user_role', userData.role || 'operador');
            
            if (userData.base_id) {
              localStorage.setItem('user_base_id', userData.base_id.toString());
              localStorage.setItem('user_basename', userData.basename || '');
            }
            
            // Fechar modal e notificar sucesso
            setLoginModalOpen(false);
            toast({
              title: "Login realizado com sucesso",
              description: `Bem-vindo ao Posto ${postoName}`,
            });
            
            return; // Sai da função se o login via API foi bem-sucedido
          } else {
            console.error('Login via API também falhou');
            throw new Error('Credenciais inválidas ou usuário não encontrado');
          }
        } catch (apiError: any) {
          console.error('Erro na autenticação alternativa:', apiError);
          throw new Error(apiError.message || 'Falha na autenticação');
        }
      }
      
      // Se chegou aqui, o login Supabase foi bem-sucedido
      if (data.session && data.user) {
        console.log('Login Supabase bem-sucedido:', data.user.email);
        
        // Armazenar token e informações básicas
        localStorage.setItem('access_token', data.session.access_token);
        localStorage.setItem('user_id', data.user.id);
        localStorage.setItem('user_email', loginData.email);
        
        if (data.user.user_metadata) {
          localStorage.setItem('user_name', data.user.user_metadata.name || '');
          localStorage.setItem('user_role', data.user.user_metadata.role || 'operador');
        }
        
        // Tenta sincronizar com o sistema interno
        try {
          await fetch('/api/auth/sync-supabase-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              supabaseId: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.name || '',
              role: data.user.user_metadata?.role || 'operador'
            }),
            credentials: 'include'
          });
        } catch (syncError) {
          console.warn('Não foi possível sincronizar com o sistema interno:', syncError);
          // Continuamos mesmo sem sincronização
        }
        
        // Definir usuário no estado
        setUser({
          id: data.user.id,
          email: loginData.email,
          name: data.user.user_metadata?.name,
          role: data.user.user_metadata?.role
        });
        
        // Fechar modal
        setLoginModalOpen(false);
        
        // Notificar sucesso
        toast({
          title: "Login realizado com sucesso",
          description: `Bem-vindo ao Posto ${postoName}`,
        });
        
        // Registrar no console quem fez login (útil para diagnóstico)
        console.log(`Usuário autenticado: ${loginData.email} (${data.user.user_metadata?.name || 'Sem nome'})`);
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      setError(error.message || 'Falha na autenticação. Verifique suas credenciais.');
      
      toast({
        title: "Falha no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirecionamento para página de registro
  const goToRegister = () => {
    // Guarda URL atual para voltar depois do registro
    localStorage.setItem('auth_redirect', location);
    window.location.href = '/register-supabase';
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

  // Modal de login
  return (
    <>
      <Dialog open={loginModalOpen} onOpenChange={setLoginModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Login para Acesso ao Posto {postoName}</DialogTitle>
            <DialogDescription>
              Digite suas credenciais para acessar o formulário de abastecimento.
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="seu.email@exemplo.com"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
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
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                disabled={isSubmitting}
                required
              />
            </div>
            
            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={goToRegister}
                disabled={isSubmitting}
              >
                Criar Conta
              </Button>
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
      
      {/* Renderiza o conteúdo apenas se o usuário estiver autenticado */}
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
                // Limpar dados de autenticação
                localStorage.removeItem('access_token');
                localStorage.removeItem('user_id');
                localStorage.removeItem('user_email');
                localStorage.removeItem('user_name');
                localStorage.removeItem('user_role');
                localStorage.removeItem('user_base_id');
                localStorage.removeItem('user_basename');
                
                // Forçar logout no Supabase
                supabase.auth.signOut();
                
                // Recarregar a página para reiniciar o fluxo de autenticação
                window.location.reload();
              }}
              className="text-xs text-green-700 hover:text-green-900 underline"
            >
              Sair
            </button>
          </div>
          {children}
        </>
      ) : null}
    </>
  );
};

export default PublicPostoAuth;