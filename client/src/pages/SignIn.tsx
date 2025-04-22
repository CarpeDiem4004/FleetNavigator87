import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wrench } from 'lucide-react';

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
    
    try {
      setLoading(true);
      console.log("Tentando fazer login com:", email);
      
      // Usar o hook de autenticação para fazer login
      const loggedUser = await login(email, password);
      
      // Redirecionar com base no tipo de usuário
      if (loggedUser && loggedUser.role === 'oficina') {
        navigate('/oficina/dashboard');
      } else if (loggedUser && loggedUser.basename === "Gestão de Frotas") {
        navigate('/fleet-management');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
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
                  className="bg-white/50"
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
                  className="bg-white/50"
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
                  Utilize o e-mail e senha fornecidos durante o cadastro
                </p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-xs"
                  onClick={() => navigate('/oficinas/cadastro')}
                >
                  Ainda não é cadastrado? Clique aqui para se registrar
                </Button>
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