import React from 'react';
import { useAuth } from '@/context/AuthContext';
import HistoricoConsolidadoView from './components/HistoricoConsolidadoView';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Redirect } from 'wouter';

const HistoricoConsolidado: React.FC = () => {
  const { user } = useAuth();

  // Verificar se o usuário é admin
  if (!user) {
    return (
      <div className="container mx-auto p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4">Carregando...</p>
      </div>
    );
  }

  // Permitimos que qualquer usuário acesse o histórico consolidado
  // Não é mais restrito apenas para administradores

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex">
            <a href="/" className="flex items-center space-x-2">
              <span className="font-bold text-xl">Murícion Fleet</span>
            </a>
          </div>
          <div className="flex-1 flex justify-center">
            <h1 className="text-2xl font-bold text-center text-primary">
              Histórico Consolidado de Abastecimentos
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {user.name} ({user.role})
            </span>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-6">
        <HistoricoConsolidadoView />
      </main>
    </div>
  );
};

export default HistoricoConsolidado;