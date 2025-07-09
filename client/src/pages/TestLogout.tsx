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
      await logout();
      // Após o logout, redirecionar para /bases/campinas para testar o middleware
      setTimeout(() => {
        // Forçar reload completo da página para garantir que o middleware seja testado
        window.location.href = '/bases/campinas';
      }, 1000);
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
                  Fazer Logout e Testar
                </Button>
                
                <Button 
                  onClick={testDirectAccess}
                  className="w-full"
                  variant="outline"
                >
                  Testar Acesso Direto (Sem Logout)
                </Button>
                
                <p className="text-xs text-gray-500">
                  <strong>Teste 1:</strong> Primeiro botão faz logout e redireciona para /bases/campinas<br/>
                  <strong>Teste 2:</strong> Segundo botão vai direto (deve funcionar pois você está logado)
                </p>
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