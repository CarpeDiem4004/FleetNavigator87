import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

export default function TestOperatorSecurity() {
  const [email, setEmail] = useState('bruno.machado@muricionfleet.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testLogin = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: email,
          password: password
        }),
      });

      const data = await response.json();
      
      setResult({
        status: response.status,
        success: response.ok,
        data: data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setResult({
        status: 'ERROR',
        success: false,
        data: { message: 'Erro de conexão', error: error.message },
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const testHybridLogin = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/auth/login-hybrid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email,
          password: password
        }),
      });

      const data = await response.json();
      
      setResult({
        status: response.status,
        success: response.ok,
        data: data,
        timestamp: new Date().toISOString(),
        route: 'hybrid'
      });
    } catch (error) {
      setResult({
        status: 'ERROR',
        success: false,
        data: { message: 'Erro de conexão', error: error.message },
        timestamp: new Date().toISOString(),
        route: 'hybrid'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Teste de Segurança - Acesso de Operadores
          </CardTitle>
          <CardDescription>
            Esta página testa se operadores conseguem acessar o sistema principal através das rotas de login.
            Operadores devem receber erro 403 (Acesso Negado) em ambas as rotas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email do Operador</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="bruno.machado@muricionfleet.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Senha</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha do operador"
              />
            </div>
            
            <div className="flex gap-4">
              <Button 
                onClick={testLogin}
                disabled={loading || !email || !password}
                variant="outline"
              >
                {loading ? 'Testando...' : 'Testar Rota Principal (/api/login)'}
              </Button>
              
              <Button 
                onClick={testHybridLogin}
                disabled={loading || !email || !password}
                variant="outline"
              >
                {loading ? 'Testando...' : 'Testar Rota Híbrida (/api/auth/login-hybrid)'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : (
                <Shield className="h-5 w-5 text-green-500" />
              )}
              Resultado do Teste {result.route === 'hybrid' ? '(Rota Híbrida)' : '(Rota Principal)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert variant={result.success ? 'destructive' : 'default'}>
                <AlertDescription>
                  {result.success ? (
                    <span className="text-red-600 font-semibold">
                      🚨 FALHA DE SEGURANÇA: Operador conseguiu fazer login!
                    </span>
                  ) : (
                    <span className="text-green-600 font-semibold">
                      ✅ SEGURANÇA OK: Operador foi bloqueado como esperado
                    </span>
                  )}
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Detalhes da Resposta:</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Status:</strong> {result.status}</div>
                  <div><strong>Sucesso:</strong> {result.success ? 'Sim' : 'Não'}</div>
                  <div><strong>Timestamp:</strong> {result.timestamp}</div>
                  <div><strong>Mensagem:</strong> {result.data.message || 'Nenhuma mensagem'}</div>
                  {result.data.error && (
                    <div><strong>Erro:</strong> {result.data.error}</div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Dados Completos:</h4>
                <pre className="text-xs overflow-x-auto bg-gray-100 p-2 rounded">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Comportamento Esperado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>• <strong>Status 403:</strong> Acesso Negado</div>
            <div>• <strong>Mensagem:</strong> "Operadores devem acessar apenas a base designada"</div>
            <div>• <strong>Erro:</strong> "Acesso negado - Operadores não podem acessar o sistema principal"</div>
            <div>• <strong>Ambas as rotas</strong> devem bloquear o acesso de operadores</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}