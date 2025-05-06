/**
 * Página de acesso direto a postos
 * Esta página permite acesso rápido e direto a todos os postos sem depender do domínio personalizado
 */

import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FuelIcon, HomeIcon, ArrowRightIcon, InfoIcon, AlertTriangleIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Lista de todos os postos disponíveis
// A partir de Maio/2025, apenas o Posto Remédios está disponível
const postosList = [
  { id: 'posto-remedios', nome: 'Posto Remédios', version: 'atual' },
];

const PostoAcessoDireto: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [statusInfo, setStatusInfo] = useState<Record<string, any>>({});

  // Função para verificar status do acesso
  const verificarAcesso = async () => {
    try {
      const response = await fetch('/api/postos/diagnostico');
      const data = await response.json();
      setStatusInfo(data);
      
      toast({
        title: data.isAuthenticated ? 'Usuário autenticado' : 'Não autenticado',
        description: data.isAuthenticated 
          ? `Conectado como ${data.user?.email}` 
          : 'Faça login para acessar os postos',
        variant: data.isAuthenticated ? 'default' : 'destructive',
      });
    } catch (error) {
      console.error('Erro ao verificar acesso:', error);
      toast({
        title: 'Erro ao verificar acesso',
        description: 'Não foi possível verificar o status de autenticação',
        variant: 'destructive',
      });
    }
  };

  // Função para acessar um posto diretamente
  const acessarPosto = (postoId: string) => {
    if (!user) {
      toast({
        title: 'Acesso negado',
        description: 'Você precisa estar logado para acessar este posto',
        variant: 'destructive',
      });
      setLocation('/login');
      return;
    }
    
    setLocation(`/posto/${postoId}`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Acesso Direto a Postos</h1>
        <div className="flex gap-2">
          <Button onClick={verificarAcesso} variant="outline">
            <InfoIcon className="mr-2 h-4 w-4" />
            Verificar Status
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <HomeIcon className="mr-2 h-4 w-4" />
              Voltar ao Início
            </Link>
          </Button>
        </div>
      </div>

      {statusInfo.host && (
        <Card>
          <CardHeader className="bg-muted/50">
            <CardTitle>Informações de Diagnóstico</CardTitle>
            <CardDescription>Detalhes sobre sua conexão e autenticação</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Host atual:</p>
                <p className="text-sm">{statusInfo.host}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Status de autenticação:</p>
                <p className="text-sm">
                  {statusInfo.isAuthenticated 
                    ? <span className="text-green-600 font-medium">Autenticado</span>
                    : <span className="text-red-600 font-medium">Não autenticado</span>
                  }
                </p>
              </div>
              {statusInfo.isAuthenticated && statusInfo.user && (
                <>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Usuário:</p>
                    <p className="text-sm">{statusInfo.user.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Função:</p>
                    <p className="text-sm">{statusInfo.user.role}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
          {!statusInfo.isAuthenticated && (
            <CardFooter className="bg-amber-50 border-t border-amber-200">
              <div className="flex items-center text-amber-700">
                <AlertTriangleIcon className="h-5 w-5 mr-2" />
                <p className="text-sm">Você precisa estar autenticado para acessar os postos.</p>
              </div>
            </CardFooter>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {postosList.map((posto) => (
          <Card key={posto.id} className="overflow-hidden">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center">
                <FuelIcon className="h-5 w-5 mr-2 text-primary" />
                {posto.nome}
                <span className="ml-2 text-xs bg-secondary/20 px-2 py-1 rounded">
                  {posto.version}
                </span>
              </CardTitle>
              <CardDescription>Posto de Abastecimento</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm">
                ID: <span className="font-mono">{posto.id}</span>
              </p>
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-muted/10 pt-3">
              <Button 
                onClick={() => acessarPosto(posto.id)}
                variant="default"
                className="w-full"
              >
                Acessar Posto
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PostoAcessoDireto;