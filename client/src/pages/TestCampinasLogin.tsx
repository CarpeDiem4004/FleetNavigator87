import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, ExternalLink } from 'lucide-react';

const TestCampinasLogin: React.FC = () => {
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Redirecionar para tentar acessar a Base Campinas
        setLocation('/bases/campinas');
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            Teste do Sistema de Login da Base Campinas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Passos para testar:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Clique em "Fazer Logout" abaixo</li>
              <li>Você será redirecionado para /bases/campinas</li>
              <li>Como não estará logado, será redirecionado para /bases/campinas/login</li>
              <li>Verá a nova tela de login específica da Base Campinas</li>
            </ol>
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={handleLogout}
              className="w-full"
              variant="destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Fazer Logout e Testar
            </Button>
            
            <Button 
              onClick={() => setLocation('/bases/campinas')}
              className="w-full"
              variant="outline"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Ir direto para /bases/campinas
            </Button>
          </div>
          
          <div className="text-xs text-gray-600 text-center">
            <p>Credenciais para teste:</p>
            <p>Email: admin@muricionfleet.com</p>
            <p>Senha: MuricionAdmin2025</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestCampinasLogin;