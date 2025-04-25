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
            // Verificar se o token ainda é válido usando a API do servidor
            const response = await fetch('/api/auth/user', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              credentials: 'include'
            });
            
            // Verificamos novamente após a operação assíncrona
            if (!isMountedRef.current) return;
            
            if (response.ok) {
              const userData = await response.json();
              console.log('Sessão existente encontrada', userData);
              
              // Atualizar dados do usuário com os obtidos da API
              const userId = userData.id.toString();
              const email = userData.email;
              const name = userData.name || '';
              const role = userData.role || '';
              
              // Armazenar dados atualizados
              localStorage.setItem('user_id', userId);
              localStorage.setItem('user_email', email);
              localStorage.setItem('user_name', name);
              localStorage.setItem('user_role', role);
              
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
      
      // Usar apenas a autenticação híbrida via API do servidor
      console.log('Tentando autenticação via API do servidor...');
      try {
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
          console.error('Login via API falhou');
          const apiErrorData = await apiResponse.json();
          throw new Error(apiErrorData.message || 'Credenciais inválidas ou usuário não encontrado');
        }
      } catch (apiError: any) {
        // Verificar se o componente ainda está montado
        if (!isMountedRef.current) return;
        
        console.error('Erro na autenticação:', apiError);
        throw new Error(apiError.message || 'Falha na autenticação');
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
                
                // Chamar API de logout em vez de usar Supabase diretamente
                fetch('/api/auth/logout', {
                  method: 'POST',
                  credentials: 'include'
                });
                
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