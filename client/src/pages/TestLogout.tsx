import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'wouter';

const TestLogout: React.FC = () => {
  const { logout, user } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation('/bases/campinas/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Teste de Logout</CardTitle>
          <CardDescription>
            Teste para verificar o redirecionamento após logout
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            <p><strong>Usuário:</strong> {user?.name || 'Não autenticado'}</p>
            <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={handleLogout} variant="destructive">
              Logout e ir para Login Campinas
            </Button>
            <Button onClick={() => setLocation('/bases/campinas/login')} variant="outline">
              Ir para Login Campinas
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestLogout;