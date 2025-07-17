import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function TestLoginBase() {
  const [email, setEmail] = useState('bruno.machado@muricionfleet.com');
  const [password, setPassword] = useState('gp03@123');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/auth/login-base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
        console.log('Login bem-sucedido:', data);
      } else {
        setError(data.message || 'Erro no login');
        console.error('Erro no login:', data);
      }
    } catch (error) {
      setError('Erro de conexão');
      console.error('Erro de conexão:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Teste Login Base
          </CardTitle>
          <CardDescription className="text-center">
            Teste do sistema de autenticação para operadores de base
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite o email"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                'Testar Login'
              )}
            </Button>
          </form>

          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className="mt-4" variant="default">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold">Login realizado com sucesso!</div>
                <div className="mt-2 text-sm">
                  <strong>Usuário:</strong> {result.user?.name} ({result.user?.email})
                  <br />
                  <strong>Role:</strong> {result.user?.role}
                  <br />
                  <strong>Base:</strong> {result.user?.basename} (ID: {result.user?.base_id})
                  <br />
                  <strong>Ativo:</strong> {result.user?.isActive ? 'Sim' : 'Não'}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-6 text-sm text-gray-600">
            <h3 className="font-semibold mb-2">Credenciais de Teste:</h3>
            <p><strong>Email:</strong> bruno.machado@muricionfleet.com</p>
            <p><strong>Senha:</strong> gp03@123</p>
            <p><strong>Role:</strong> operador</p>
            <p><strong>Base:</strong> GP03</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}