import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ErrorPage from '@/pages/ErrorPage';

// Mapeamento de códigos para nomes dos postos
const postoNomes: Record<string, string> = {
  osasco: 'Osasco',
  guarulhos: 'Guarulhos',
  saopaulo: 'São Paulo',
  campinas: 'Campinas',
  abc: 'ABC',
  socorro: 'Socorro',
  sorocaba: 'Sorocaba'
};

type PostoParams = {
  postoCode: string;
};

const PostoLoginSimples: React.FC = () => {
  const [_, navigate] = useLocation();
  const params = useParams<PostoParams>();
  const postoCode = params.postoCode?.toLowerCase() || '';
  const postoNome = postoNomes[postoCode] || postoCode.toUpperCase();
  
  const { user, login, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [username, setUsername] = useState(postoCode);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [connectError, setConnectError] = useState(false);
  
  useEffect(() => {
    // Se o usuário já estiver autenticado, redireciona para o dashboard
    if (user) {
      navigate(`/posto/${postoCode}/dashboard`);
    }
  }, [user, postoCode, navigate]);
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Preencha todos os campos.');
      return;
    }
    
    try {
      await login(username, password);
      // O redirecionamento será feito no useEffect quando o usuário for definido
    } catch (err: any) {
      if (err.message?.includes('ERR_CONNECTION_REFUSED') || 
          err.message?.includes('Failed to fetch')) {
        setConnectError(true);
      } else {
        setError(err.message || 'Falha no login. Verifique suas credenciais.');
        toast({
          title: "Erro de login",
          description: err.message || 'Falha no login. Verifique suas credenciais.',
          variant: "destructive"
        });
      }
    }
  };
  
  if (connectError) {
    return (
      <ErrorPage 
        title="Erro de Conexão"
        message="Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."
        code="ERR_CONNECTION_REFUSED"
      />
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl text-center font-bold">
            Posto {postoNome}
          </CardTitle>
          <p className="text-center text-gray-500 text-sm">
            Acesso ao sistema de abastecimento
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário do Posto</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nome do usuário"
                autoComplete="username"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
            
            <div className="text-center text-sm text-gray-500">
              <p>Usuário: nome do posto (ex: osasco)</p>
              <p>Senha padrão: murici@2025</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostoLoginSimples;