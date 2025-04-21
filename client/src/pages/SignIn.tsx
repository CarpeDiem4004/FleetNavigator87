import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Importando imagem de fundo
import loginBackgroundImage from '@/assets/login-background.jpeg';

export default function SignIn() {
  const [email, setEmail] = useState('rogerio@muricionfleet.com');
  const [password, setPassword] = useState('Murici@rogerio25');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      console.log("Tentando fazer login com:", email);
      
      // Usar o hook de autenticação para fazer login
      await login(email, password);
      
      // Redirecionar após login bem-sucedido
      navigate('/');
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      // Não é necessário mostrar toast aqui pois o componente AuthContext já faz isso
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
      <div className="relative z-10 w-full max-w-md px-4">
        <Card className="backdrop-blur-sm bg-white/90 shadow-2xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Sistema de Gestão de Frotas
            </CardTitle>
            <CardDescription className="text-center">
              Entre com suas credenciais para acessar o sistema
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
                  className="bg-white/80"
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
                  className="bg-white/80"
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
            <p className="text-xs text-center text-gray-600">
              Sistema de gerenciamento de frota desenvolvido para Murici Logística
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}