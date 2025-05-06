import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, UserCog, Users } from 'lucide-react';

export default function PostoCampinasIndex() {
  const { user, isLoading } = useAuth();
  const [_, setLocation] = useLocation();
  
  // Redirecionar baseado no papel do usuário
  useEffect(() => {
    if (isLoading) return;
    
    if (user) {
      if (user.role === 'admin') {
        setLocation('/posto-campinas/admin');
      } else {
        setLocation('/posto-campinas/operador');
      }
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="text-3xl font-bold">Posto Campinas</h1>
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Acesso não autorizado</CardTitle>
              <CardDescription>
                Você precisa estar autenticado para acessar esta página.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => setLocation('/auth')}
              >
                Fazer Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col items-center justify-center gap-6">
        <h1 className="text-3xl font-bold">Posto Campinas</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Escolha uma das opções abaixo para acessar o sistema de gestão do Posto Campinas.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mt-6">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Operador
              </CardTitle>
              <CardDescription>
                Registro de abastecimentos e monitoramento de tanques
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-end">
              <Button 
                onClick={() => setLocation('/posto-campinas/operador')}
                className="w-full"
              >
                Acessar Painel de Operador
              </Button>
            </CardContent>
          </Card>
          
          {user.role === 'admin' && (
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  Administrador
                </CardTitle>
                <CardDescription>
                  Gestão de tanques, relatórios e configurações
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-end">
                <Button 
                  onClick={() => setLocation('/posto-campinas/admin')}
                  className="w-full"
                  variant="secondary"
                >
                  Acessar Painel Administrativo
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}