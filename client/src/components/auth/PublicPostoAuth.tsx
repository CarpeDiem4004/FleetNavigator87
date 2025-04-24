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

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';
const supabase = createClient(supabaseUrl, supabaseKey);

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      });
      
      if (error) {
        throw error;
      }
      
      if (data.session && data.user) {
        // Armazenar token e informações básicas
        localStorage.setItem('access_token', data.session.access_token);
        localStorage.setItem('user_id', data.user.id);
        localStorage.setItem('user_email', loginData.email);
        
        if (data.user.user_metadata) {
          localStorage.setItem('user_name', data.user.user_metadata.name || '');
          localStorage.setItem('user_role', data.user.user_metadata.role || 'operador');
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