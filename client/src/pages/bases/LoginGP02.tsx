import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Building2 } from 'lucide-react';

export default function LoginGP02() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('[LoginGP02] Tentando fazer login com email:', email);
      const user = await login(email, password);
      console.log('[LoginGP02] Login bem-sucedido, usuário:', user);
      
      // Verificar se o usuário pertence à base GP02 (ID 150)
      if (user.baseId !== 150 && user.basename !== 'GP02') {
        console.log('[LoginGP02] Usuário não pertence à base GP02. BaseId:', user.baseId, 'Basename:', user.basename);
        throw new Error('Usuário não tem acesso a esta base');
      }
      
      console.log('[LoginGP02] Redirecionando para /bases/gp02');
      setLocation('/bases/gp02'); // Redireciona para a dashboard principal da base GP02
    } catch (err: any) {
      console.error('[LoginGP02] Erro durante login:', err);
      
      // Verificar se é um erro específico de operador que precisa ser redirecionado
      if (err.message === 'OPERADOR_REDIRECT_REQUIRED') {
        console.log('[LoginGP02] Operador detectado - login válido, redirecionando para base GP02');
        
        // Para operadores, tentamos primeiro verificar se é da base GP02
        const errorData = (err as any).errorData;
        console.log('[LoginGP02] Dados do erro do operador:', errorData);
        
        // Fazer uma verificação direta se o usuário pertence à base GP02
        try {
          const verifyResponse = await fetch('/api/verify-base-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ 
              email: email, 
              baseId: 150, 
              basename: 'GP02'
            })
          });
          
          if (verifyResponse.ok) {
            const userData = await verifyResponse.json();
            console.log('[LoginGP02] Usuário GP02 verificado:', userData);
            setError('Login realizado com sucesso! Redirecionando...');
            
            setTimeout(() => {
              setLocation('/bases/gp02');
            }, 1000);
            return;
          }
        } catch (verifyError) {
          console.error('[LoginGP02] Erro ao verificar acesso à base:', verifyError);
        }
        
        setError('Usuário não tem acesso à base GP02 - Jacarei');
        return;
      }
      
      setError('Credenciais inválidas. Verifique seu email e senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-blue-600 mr-2" />
            <span className="text-2xl font-bold text-gray-800">Murici On Fleet 2.0</span>
          </div>
          <CardTitle className="text-xl text-gray-800">
            GP02 - Jacarei (SP)
          </CardTitle>
          <CardDescription>
            Acesso à Base GP02 - GRUPO PEREIRA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
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
      </Card>
    </div>
  );
}