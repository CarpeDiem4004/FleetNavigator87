import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wrench, AlertCircle } from 'lucide-react';

// Importando imagem de fundo
import loginBackgroundImage from '@assets/image_1754587044756.png';

interface SignInProps {
  oficina?: boolean;
}

export default function SignIn({ oficina = false }: SignInProps) {
  // Campos de formulário sem pré-preenchimento
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // Estado para mensagem de erro
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const { login, user } = useAuth();
  
  // Verificar se o usuário já está logado e redirecionar se for o caso
  useEffect(() => {
    if (user) {
      // Se for usuário de oficina, redirecionar para dashboard da oficina
      if (user.role === 'oficina') {
        navigate('/oficina/dashboard');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpar mensagem de erro anterior antes de tentar novamente
    setErrorMessage('');
    
    try {
      setLoading(true);
      console.log("Tentando fazer login com:", email);
      
      // Abordagem mais direta e força armazenamento de cookies:
      // 1. Login direto com API tradicional primeiro (garante cookies de sessão)
      // 2. Sincroniza com Supabase para garantir tokens JWT
      // 3. Força salvamento de cookies
      // 4. Usa rota de emergência para garantir sessão persistente
      
      // ETAPA 1: Login direto com API de base (que funciona!)
      let userData = null;
      try {
        const loginResponse = await fetch('/api/auth/login-base', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
          credentials: 'include',  // Crucial para cookies
        });
        
        if (loginResponse.ok) {
          userData = await loginResponse.json();
          console.log("Login API de base bem-sucedido:", userData);
          
          // Login bem-sucedido - redirecionar
          if (userData.success) {
            toast({
              title: "Login realizado com sucesso!",
              description: userData.message || "Bem-vindo ao sistema!",
            });

            // Aguardar um pouco para garantir que cookies sejam definidos
            setTimeout(() => {
              // Se for usuário de oficina, redirecionar para dashboard da oficina
              if (userData.user && userData.user.role === 'oficina') {
                navigate('/oficina/dashboard');
              } else {
                navigate('/');
              }
            }, 100);
            return; // Não continuar com outros métodos de login
          }
        } else {
          console.warn("Login API de base falhou, tentando via hook...");
        }
      } catch (apiError) {
        console.error("Erro ao fazer login via API tradicional:", apiError);
      }
      
      // ETAPA 2: Se o login direto não funcionou, usar o hook
      if (!userData || !userData.success) {
        const loggedUser = await login(email, password);
        console.log("Login hook completo, resultado:", loggedUser);
      }
      
      // ETAPA 2.1: Garantir que temos o token JWT armazenado corretamente
      try {
        // Importação dinâmica para evitar dependência circular
        const supabaseModule = await import('@/lib/supabaseClient');
        const { data } = await supabaseModule.supabase.auth.getSession();
        
        if (data?.session?.access_token) {
          // Armazenar o token do Supabase no localStorage para todas as requisições
          localStorage.setItem('authToken', data.session.access_token);
          console.log("Token JWT do Supabase armazenado com sucesso");
        }
      } catch (tokenError) {
        console.error("Erro ao obter token JWT do Supabase:", tokenError);
      }
      
      // ETAPA 3: Forçar sincronização de sessão imediatamente usando a nova rota
      try {
        // Combinamos os dados de ambas fontes para máxima compatibilidade
        const user = {
          ...(userData || {}),
          ...(loggedUser || {}),
          email: email
        };
        
        console.log("Forçando sincronização de sessão com:", user.email);
        
        const syncResponse = await fetch('/api/force-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Emergency-Auth': 'true',
          },
          credentials: 'include',
          body: JSON.stringify({ 
            user: user,
            email: email
          })
        });
        
        if (syncResponse.ok) {
          console.log("Sincronização de emergência bem-sucedida!");
          
          // Mostrar mensagem de sucesso
          toast({
            title: "Login bem-sucedido",
            description: `Bem-vindo, ${user?.name || email}!`,
          });
          
          // Redirecionar com base no tipo de usuário
          if (user.role === 'oficina') {
            navigate('/oficina/dashboard');
          } else if (user.basename === "Gestão de Frotas") {
            navigate('/fleet-management');
          } else {
            navigate('/');
          }
        } else {
          console.warn("Sincronização de emergência falhou, mas continuando...");
          
          // Tentar com rota de ressincronização tradicional
          try {
            await fetch('/api/resync-session-jwt', {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                'X-Force-Sync': 'true'
              },
              body: JSON.stringify({ 
                user: user,
                email: email
              })
            });
            console.log("Ressincronização secundária feita");
          } catch (resyncError) {
            console.warn("Ressincronização secundária falhou:", resyncError);
          }
          
          // Redirecionar mesmo assim
          toast({
            title: "Login bem-sucedido",
            description: `Bem-vindo, ${user?.name || email}!`,
          });
          
          // Redirecionar com base no tipo de usuário
          if (user.role === 'oficina') {
            navigate('/oficina/dashboard');
          } else if (user.basename === "Gestão de Frotas") {
            navigate('/fleet-management');
          } else {
            navigate('/');
          }
        }
      } catch (syncError) {
        console.error("Erro na sincronização de emergência:", syncError);
        // Redirecionar mesmo assim já que o login foi bem-sucedido
        toast({
          title: "Login bem-sucedido",
          description: `Bem-vindo, ${loggedUser?.name || email}!`,
        });
        navigate('/');
      }
      
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      
      // Definir mensagem de erro
      setErrorMessage('Email ou senha incorretos. Por favor, verifique suas informações e tente novamente.');
      
      // Erro customizado para oficinas se necessário
      if (oficina) {
        toast({
          title: "Erro ao fazer login",
          description: "Verifique se suas credenciais de oficina estão corretas.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="flex min-h-screen items-center justify-center p-0 relative"
      style={{
        backgroundImage: `url(${loginBackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay escuro para melhorar legibilidade */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      {/* Conteúdo do login */}
      <div className="relative z-10 w-full max-w-sm px-4">
        <Card className="backdrop-blur-sm bg-white/60 shadow-2xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {oficina ? (
                <>
                  <Wrench className="h-8 w-8 mx-auto mb-2" />
                  Portal da Oficina
                </>
              ) : (
                "Sistema de Gestão de Frotas"
              )}
            </CardTitle>
            <CardDescription className="text-center">
              {oficina ? (
                "Acesse o sistema para gerenciar os serviços de manutenção"
              ) : (
                "Entre com suas credenciais para acessar o sistema"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Mensagem de erro */}
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className={`bg-white/50 ${errorMessage ? 'border-red-300 focus:ring-red-500' : ''}`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className={`bg-white/50 ${errorMessage ? 'border-red-300 focus:ring-red-500' : ''}`}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full font-semibold" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col">
            {oficina && (
              <div className="mb-3 text-sm text-center">
                <p className="text-primary font-medium mb-1">Oficina cadastrada?</p>
                <p className="text-muted-foreground mb-2">
                  Utilize o e-mail e senha fornecidos pelo administrador do sistema
                </p>
              </div>
            )}
            <p className="text-xs text-center text-gray-600">
              Sistema de gerenciamento de frota desenvolvido para Murici On Fleet 2.0
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}