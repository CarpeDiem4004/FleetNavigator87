import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';

export default function TestOperatorSecurity() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testOperatorLogin = async () => {
    setLoading(true);
    setTestResult(null);
    setError(null);

    try {
      console.log('Testing operator login to main system...');
      
      const response = await fetch('/api/login-hybrid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult(`❌ SECURITY ISSUE: Operator ${email} was able to login to main system! This should be blocked.`);
        console.log('Login successful:', data);
      } else {
        const errorData = await response.json();
        
        if (response.status === 403 && errorData.message && errorData.message.includes('Operadores devem acessar apenas a base designada')) {
          setTestResult(`✅ SECURITY WORKING: Operator ${email} was correctly blocked from accessing main system.`);
          console.log('Security working correctly:', errorData.message);
        } else {
          setError(`Login failed: ${errorData.message || 'Unknown error'}`);
        }
      }
    } catch (err) {
      setError(`Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testMainSystemAccess = async () => {
    setLoading(true);
    setTestResult(null);
    setError(null);

    try {
      console.log('Testing main system access...');
      
      const response = await fetch('/', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        if (user?.role === 'operador') {
          setTestResult(`❌ SECURITY ISSUE: Operator ${user.email} can access main system! This should be blocked.`);
        } else {
          setTestResult(`✅ Non-operator user can access main system normally.`);
        }
      } else {
        if (response.status === 403 && user?.role === 'operador') {
          setTestResult(`✅ SECURITY WORKING: Operator ${user.email} was correctly blocked from main system.`);
        } else {
          setError(`Access test failed: ${response.status} ${response.statusText}`);
        }
      }
    } catch (err) {
      setError(`Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🔒 Teste de Segurança - Controle de Acesso de Operadores</CardTitle>
            <CardDescription>
              Este teste verifica se o sistema está corretamente bloqueando operadores do acesso ao sistema principal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg bg-blue-50">
              <h3 className="font-semibold mb-2">Status do Usuário Atual:</h3>
              <p><strong>Nome:</strong> {user?.name || 'Não autenticado'}</p>
              <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
              <p><strong>Função:</strong> {user?.role || 'N/A'}</p>
              <p><strong>Base:</strong> {user?.basename || 'N/A'}</p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Teste 1: Login de Operador no Sistema Principal</h3>
              <div className="space-y-2">
                <Label htmlFor="email">Email do Operador:</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Digite o email de um operador"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha:</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite a senha"
                />
              </div>
              <Button 
                onClick={testOperatorLogin}
                disabled={loading || !email || !password}
                className="w-full"
              >
                {loading ? 'Testando...' : 'Testar Login de Operador'}
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Teste 2: Acesso ao Sistema Principal</h3>
              <Button 
                onClick={testMainSystemAccess}
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                {loading ? 'Testando...' : 'Testar Acesso ao Sistema Principal'}
              </Button>
            </div>

            {testResult && (
              <Alert className={testResult.includes('✅') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <AlertDescription>{testResult}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="mt-6 p-4 border rounded-lg bg-yellow-50">
              <h4 className="font-semibold mb-2">Funcionalidades de Segurança Implementadas:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Login route blocks operators from accessing main system</li>
                <li>Authentication middleware prevents operators from accessing main system</li>
                <li>Two-layer security protection implemented</li>
                <li>Proper error handling and logging for unauthorized access attempts</li>
                <li>Base-specific redirection for operators</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}