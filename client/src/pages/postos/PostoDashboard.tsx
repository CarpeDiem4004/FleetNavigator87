import React, { useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TruckIcon, DropletIcon, ClipboardListIcon, LogOutIcon } from 'lucide-react';
import FormularioAbastecimento from './components/FormularioAbastecimento';
import StatusTanquePosto from './components/StatusTanquePosto';

import {
  POSTO_OSASCO, POSTO_GUARULHOS, POSTO_SAOPAULO, POSTO_CAMPINAS,
  POSTO_ABC, POSTO_SOCORRO, POSTO_SOROCABA,
  NOME_POSTO_OSASCO, NOME_POSTO_GUARULHOS, NOME_POSTO_SAOPAULO, NOME_POSTO_CAMPINAS,
  NOME_POSTO_ABC, NOME_POSTO_SOCORRO, NOME_POSTO_SOROCABA
} from '@/constants/postos';

const postosMap: Record<string, string> = {
  [POSTO_OSASCO]: NOME_POSTO_OSASCO,
  [POSTO_GUARULHOS]: NOME_POSTO_GUARULHOS,
  [POSTO_SAOPAULO]: NOME_POSTO_SAOPAULO,
  [POSTO_CAMPINAS]: NOME_POSTO_CAMPINAS,
  [POSTO_ABC]: NOME_POSTO_ABC,
  [POSTO_SOCORRO]: NOME_POSTO_SOCORRO,
  [POSTO_SOROCABA]: NOME_POSTO_SOROCABA,
};

const PostoDashboard: React.FC = () => {
  const [, params] = useRoute('/posto/:postoCode/dashboard');
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const postoCode = params?.postoCode || '';
  const postoName = postosMap[postoCode] || 'Desconhecido';

  useEffect(() => {
    if (!user) {
      setLocation(`/posto/${postoCode}`);
      return;
    }

    // Verificar se o usuário tem permissão para acessar este posto
    if (user.basename !== postoCode) {
      toast({
        title: "Acesso negado",
        description: `Você não tem permissão para acessar o Posto ${postoName}.`,
        variant: "destructive",
      });
      
      logout().then(() => {
        setLocation(`/posto/${postoCode}`);
      });
    }
  }, [user, postoCode, postoName, setLocation, logout, toast]);

  const handleLogout = async () => {
    try {
      await logout();
      setLocation(`/posto/${postoCode}`);
      
      toast({
        title: "Logout realizado",
        description: "Você saiu com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro ao tentar fazer logout.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Posto {postoName}</h1>
          <p className="text-muted-foreground">Painel de Controle</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" size="icon" onClick={handleLogout}>
            <LogOutIcon className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <Tabs defaultValue="abastecimento" className="space-y-6">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="abastecimento" className="flex items-center gap-2">
            <DropletIcon className="h-4 w-4" />
            <span className="hidden md:inline">Abastecimento</span>
          </TabsTrigger>
          <TabsTrigger value="tanques" className="flex items-center gap-2">
            <TruckIcon className="h-4 w-4" />
            <span className="hidden md:inline">Status dos Tanques</span>
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <ClipboardListIcon className="h-4 w-4" />
            <span className="hidden md:inline">Histórico</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="abastecimento" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Resumo</CardTitle>
                <CardDescription>
                  Visão geral das operações de hoje
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Abastecimentos Hoje</p>
                    <p className="text-2xl font-bold">15</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Diesel (L)</p>
                    <p className="text-2xl font-bold">750</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">ARLA (L)</p>
                    <p className="text-2xl font-bold">125</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Veículos Atendidos</p>
                    <p className="text-2xl font-bold">12</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <FormularioAbastecimento postoCode={postoCode} />
          </div>
        </TabsContent>

        <TabsContent value="tanques">
          <div className="grid gap-6 md:grid-cols-2">
            <StatusTanquePosto postoCode={postoCode} />
            
            <Card>
              <CardHeader>
                <CardTitle>Recebimento de Combustível</CardTitle>
                <CardDescription>
                  Registre a entrada de combustível nos tanques
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-16 text-muted-foreground">
                  Implementação pendente
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Operações</CardTitle>
              <CardDescription>
                Registro de abastecimentos e movimentações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-16 text-muted-foreground">
                Implementação pendente
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PostoDashboard;