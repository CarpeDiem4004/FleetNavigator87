import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useSupabaseAuthContext } from '@/context/SupabaseAuthContext';

interface LoginWithSupabaseProps {
  oficina?: boolean;
}

export default function LoginWithSupabase({ oficina = false }: LoginWithSupabaseProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, user, supabaseUser } = useSupabaseAuthContext();
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  // Redirecionar se o usuário já estiver autenticado
  useEffect(() => {
    if (user || supabaseUser) {
      navigate('/');
    }
  }, [user, supabaseUser, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log("Tentando fazer login com:", email);
      
      await login(email, password);
      
      // Verifica se o usuário é de oficina e ajusta o redirecionamento
      if (oficina) {
        navigate('/oficina/dashboard');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas. Verifique seu email e senha.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {oficina ? 'Acesso para Oficinas' : 'Sistema de Gestão de Frotas'}
          </CardTitle>
          <CardDescription className="text-center">
            {oficina 
              ? 'Entre com suas credenciais para acessar o painel da oficina'
              : 'Entre com suas credenciais para acessar o sistema'
            }
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
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
        <CardFooter className="flex flex-col space-y-2">
          {!oficina && (
            <div className="text-sm text-center">
              Não tem uma conta? <a href="/register" className="text-primary hover:underline">Cadastre-se</a>
            </div>
          )}
          <p className="text-xs text-center text-gray-500">
            {oficina 
              ? 'Painel exclusivo para oficinas credenciadas' 
              : 'Sistema de gerenciamento de frota desenvolvido para fins de demonstração'
            }
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}