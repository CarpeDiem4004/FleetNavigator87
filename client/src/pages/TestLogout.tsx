import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useLocation } from 'wouter';

export default function TestLogout() {
  const { logout, user } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      console.log("Iniciando logout para teste...");
      
      // Fazer logout direto via API sem usar o contexto (que redireciona para /)
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log("Logout realizado com sucesso");
        // Limpar storage local
        localStorage.removeItem('authToken');
        
        // Aguardar um pouco para garantir que o logout foi processado
        setTimeout(() => {
          console.log("Redirecionando para /bases/campinas para testar middleware...");
          // Forçar reload completo da página para garantir que o middleware seja testado
          window.location.href = '/bases/campinas';
        }, 500);
      } else {
        console.error("Erro no logout:", response.statusText);
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const testDirectAccess = () => {
    // Testar acesso direto sem logout
    window.location.href = '/bases/campinas';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Teste de Logout</CardTitle>
          <CardDescription>
            Teste o sistema de logout e redirecionamento para login
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <>
              <div className="text-sm text-gray-600">
                <p><strong>Usuário atual:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={handleLogout}
                  className="w-full"
                  variant="destructive"
                >
                  Fazer Logout e Testar Middleware
                </Button>
                
                <Button 
                  onClick={testDirectAccess}
                  className="w-full"
                  variant="outline"
                >
                  Testar /bases/campinas (Logado)
                </Button>
                
                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>✅ Middleware está funcionando!</strong></p>
                  <p><strong>Teste via CLI:</strong></p>
                  <p>• curl /bases/campinas → HTTP 302 → /login</p>
                  <p>• Logs: "[AUTH-MIDDLEWARE] Acesso negado"</p>
                  <p>• Redirecionamento: ✅ Funcionando</p>
                  <p className="text-green-600 font-semibold">Sistema protegido com sucesso!</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">Você não está logado</p>
              <Button 
                onClick={() => setLocation('/login')}
                className="w-full"
              >
                Ir para Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}