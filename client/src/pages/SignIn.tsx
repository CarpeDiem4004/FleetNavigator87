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
import loginBackgroundImage from '@/assets/login-background.jpeg';

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
      
      // Limpar qualquer sessão existente
      document.cookie = "connect.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      localStorage.removeItem('authToken');
      
      // Usar o hook de autenticação para fazer login
      const loggedUser = await login(email, password);
      
      // Sucesso no login - aguardar um pouco para garantir que os cookies sejam salvos
      toast({
        title: "Login bem-sucedido",
        description: `Bem-vindo, ${loggedUser?.name || email}!`,
      });
      
      console.log("Login bem-sucedido, estabelecendo sessão...");
      
      // Pequeno atraso para garantir que os cookies sejam salvos
      setTimeout(() => {
        // Verificar API de usuário para confirmar persistência de sessão
        fetch('/api/user', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'X-Auth-Verification': 'true',
            'Content-Type': 'application/json'
          }
        }).then(response => {
          if (response.ok) {
            console.log("Sessão verificada com sucesso, redirecionando...");
            
            // Redirecionar com base no tipo de usuário
            if (loggedUser && loggedUser.role === 'oficina') {
              navigate('/oficina/dashboard');
            } else if (loggedUser && loggedUser.basename === "Gestão de Frotas") {
              navigate('/fleet-management');
            } else {
              navigate('/');
            }
          } else {
            console.warn("Sessão não pôde ser verificada, mas login foi bem-sucedido");
            // Redirecionar mesmo assim, já que o login foi bem-sucedido
            if (loggedUser && loggedUser.role === 'oficina') {
              navigate('/oficina/dashboard');
            } else if (loggedUser && loggedUser.basename === "Gestão de Frotas") {
              navigate('/fleet-management');
            } else {
              navigate('/');
            }
          }
        }).catch(err => {
          console.error("Erro ao verificar sessão:", err);
          // Redirecionar mesmo assim
          navigate('/');
        });
      }, 1000); // Aguardar 1 segundo
      
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
              Sistema de gerenciamento de frota desenvolvido para Murici Logística
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}