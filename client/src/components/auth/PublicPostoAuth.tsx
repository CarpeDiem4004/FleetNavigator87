import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { Loader2, Fuel, AlertTriangle } from 'lucide-react';
import { useSafeDialog } from '@/hooks/use-safe-dialog';

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
  const dialogState = useSafeDialog(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // Verificar sessão ao carregar
  useEffect(() => {
    const checkSession = async () => {
      // Verificamos se o componente ainda está montado antes de fazer qualquer mudança
      if (!isMountedRef.current) return;
      
      setIsLoading(true);
      
      try {
        // Verificar se há token no localStorage
        const token = localStorage.getItem('access_token');
        
        if (token) {
          try {
            // Verificar se o token ainda é válido no Supabase
            const { data: { session }, error } = await supabase.auth.getSession();
            
            // Verificamos novamente após a operação assíncrona
            if (!isMountedRef.current) return;
            
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
              
              // Usar setTimeout para que o DOM termine as atualizações pendentes
              setTimeout(() => {
                if (isMountedRef.current) {
                  dialogState.open();
                }
              }, 0);
            }
          } catch (authError) {
            // Verificamos novamente após a operação assíncrona
            if (!isMountedRef.current) return;
            
            console.warn('Erro ao verificar autenticação:', authError);
            // Usamos o mesmo padrão assíncrono para abrir o diálogo com segurança
            setTimeout(() => {
              if (isMountedRef.current) {
                dialogState.open();
              }
            }, 0);
          }
        } else {
          console.log('Nenhum token encontrado, exibindo modal de login');
          // Usar setTimeout para que o DOM termine as atualizações pendentes
          setTimeout(() => {
            if (isMountedRef.current) {
              dialogState.open();
            }
          }, 0);
        }
      } catch (error) {
        // Verificamos novamente após a operação assíncrona
        if (!isMountedRef.current) return;
        
        console.error('Erro ao verificar sessão:', error);
        // Usar setTimeout para que o DOM termine as atualizações pendentes
        setTimeout(() => {
          if (isMountedRef.current) {
            dialogState.open();
          }
        }, 0);
      } finally {
        // Verificamos novamente antes de atualizar o estado
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };
    
    // Configurar a flag de montagem
    isMountedRef.current = true;
    
    // Executa a verificação de forma assíncrona para evitar problemas de renderização
    setTimeout(checkSession, 0);
    
    return () => {
      // Marcamos que o componente foi desmontado
      isMountedRef.current = false;
    };
  }, []);

  // Função de login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se o componente ainda está montado
    if (!isMountedRef.current) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('Tentando login com:', { email: loginData.email });
      
      // Primeiro armazenamos as informações de login
      const email = loginData.email;
      const password = loginData.password;
      
      // Abordagem 1: Login via Supabase diretamente
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });
        
        // Verificar se o componente ainda está montado após operação assíncrona
        if (!isMountedRef.current) return;
        
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
                email: email,
                password: password
              }),
              credentials: 'include' // Importante para sessões
            });
            
            // Verificar se o componente ainda está montado
            if (!isMountedRef.current) return;
            
            if (apiResponse.ok) {
              const userData = await apiResponse.json();
              console.log('Login via servidor bem-sucedido:', userData);
              
              // Armazenar dados no localStorage (sem depender do estado do componente)
              localStorage.setItem('user_id', userData.id.toString());
              localStorage.setItem('user_email', userData.email);
              localStorage.setItem('user_name', userData.name || '');
              localStorage.setItem('user_role', userData.role || 'operador');
              localStorage.setItem('auth_token', userData.token || '');
              
              if (userData.base_id) {
                localStorage.setItem('user_base_id', userData.base_id.toString());
                localStorage.setItem('user_basename', userData.basename || '');
              }
              
              // Fechar modal e atualizar estado de forma segura usando setTimeout
              setTimeout(() => {
                if (isMountedRef.current) {
                  // Definir usuário no estado
                  setUser({
                    id: userData.id.toString(),
                    email: userData.email,
                    name: userData.name,
                    role: userData.role
                  });
                  
                  // Fechar diálogo de forma segura
                  dialogState.close();
                  
                  // Notificar sucesso
                  toast({
                    title: "Login realizado com sucesso",
                    description: `Bem-vindo ao Posto ${postoName}`,
                  });
                }
              }, 0);
              
              return; // Sai da função se o login via API foi bem-sucedido
            } else {
              console.error('Login via API também falhou');
              throw new Error('Credenciais inválidas ou usuário não encontrado');
            }
          } catch (apiError: any) {
            // Verificar se o componente ainda está montado
            if (!isMountedRef.current) return;
            
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
          localStorage.setItem('user_email', email);
          
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
          
          // Atualizar estados de forma segura usando setTimeout
          setTimeout(() => {
            if (isMountedRef.current) {
              // Definir usuário no estado
              setUser({
                id: data.user.id,
                email: email,
                name: data.user.user_metadata?.name,
                role: data.user.user_metadata?.role
              });
              
              // Fechar modal com segurança
              dialogState.close();
              
              // Notificar sucesso
              toast({
                title: "Login realizado com sucesso",
                description: `Bem-vindo ao Posto ${postoName}`,
              });
            }
          }, 0);
          
          // Registrar no console quem fez login (útil para diagnóstico)
          console.log(`Usuário autenticado: ${email} (${data.user.user_metadata?.name || 'Sem nome'})`);
        }
      } catch (supabaseError: any) {
        console.error('Erro ao interagir com Supabase:', supabaseError);
        
        // Verificar se componente ainda está montado
        if (!isMountedRef.current) return;
        
        throw new Error(supabaseError.message || 'Falha ao conectar com serviço de autenticação');
      }
    } catch (error: any) {
      // Verificar novamente se o componente está montado
      if (!isMountedRef.current) return;
      
      console.error('Erro no login:', error);
      
      // Atualizar estados com segurança
      setTimeout(() => {
        if (isMountedRef.current) {
          setError(error.message || 'Falha na autenticação. Verifique suas credenciais.');
          
          toast({
            title: "Falha no login",
            description: error.message || "Credenciais inválidas",
            variant: "destructive",
          });
        }
      }, 0);
    } finally {
      // Verificar se o componente ainda está montado antes de atualizar estados
      if (isMountedRef.current) {
        setTimeout(() => {
          if (isMountedRef.current) {
            setIsSubmitting(false);
          }
        }, 0);
      }
    }
  };

  // Função de redirecionamento para registro removida conforme solicitado
  // Apenas administradores podem criar novas contas

  // Se estiver carregando, mostra spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Verificando autenticação...</span>
      </div>
    );
  }

  // Define o componente de login fora do componente principal para evitar inconsistência de hooks
  const renderLoginDialog = () => {
    if (!dialogState.isOpen) return null;
    
    return (
      <Dialog open={true} onOpenChange={dialogState.setIsOpen}>
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
    );
  };
  
  // Modal de login
  return (
    <>
      {/* Renderiza o diálogo apenas quando necessário */}
      {renderLoginDialog()}
      
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