import React from 'react';
import { useAuth } from '@/context/auth-context';
import AdminLayout from '@/layouts/AdminLayout';
import HistoricoConsolidadoView from './components/HistoricoConsolidadoView';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Redirect } from 'wouter';

const HistoricoConsolidado: React.FC = () => {
  const { user } = useAuth();

  // Verificar se o usuário é admin
  if (!user) {
    return <div>Carregando...</div>;
  }

  // Se não for admin, redirecionar para a home
  if (user.role !== 'admin') {
    return (
      <AdminLayout>
        <Card className="mx-auto max-w-2xl">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Acesso Restrito</AlertTitle>
              <AlertDescription>
                Apenas administradores podem acessar a visualização consolidada de postos.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <HistoricoConsolidadoView />
      </div>
    </AdminLayout>
  );
};

export default HistoricoConsolidado;