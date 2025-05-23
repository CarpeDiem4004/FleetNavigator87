import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, TruckIcon, DropletIcon, PlusCircleIcon, MapPinIcon } from 'lucide-react';
import FormularioRecebimento from './components/FormularioRecebimento';
import HistoricoRecebimentos from './components/HistoricoRecebimentos';
import { useAuth } from '@/context/AuthContext';
import { Link, Redirect } from 'wouter';

const EntradaCombustivelPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedPosto, setSelectedPosto] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<string>('historico');

  // Lista de postos disponíveis
  const postos = [
    { id: 'osasco_v2', nome: 'Posto Osasco V2' },
    { id: 'alair_v2', nome: 'Posto Alair V2' },
    { id: 'campinas_v2', nome: 'Posto Campinas V2' },
    { id: 'abc_v2', nome: 'Posto ABC V2' },
    { id: 'socorro_v2', nome: 'Posto Socorro V2' },
    { id: 'sorocaba_v2', nome: 'Posto Sorocaba V2' },
    { id: 'guarulhos_v2', nome: 'Posto Guarulhos V2' }
  ];

  // Verificar se o usuário está autenticado
  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <TruckIcon className="h-8 w-8 text-primary" />
              Entradas de Combustível
            </h1>
            <p className="mt-1 text-gray-500">
              Registre e gerencie entradas de combustível nos postos
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link href="/postos/visao-geral">
              <Button variant="outline" className="mr-2">
                <MapPinIcon className="mr-2 h-4 w-4" />
                Visão Geral dos Postos
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Seletor de posto */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Selecione o Posto</CardTitle>
          <CardDescription>
            Escolha o posto para gerenciar entradas de combustível
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/2">
              <Select
                value={selectedPosto}
                onValueChange={(value) => {
                  setSelectedPosto(value);
                  // Reset para visualização de histórico ao trocar de posto
                  setSelectedTab('historico');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um posto..." />
                </SelectTrigger>
                <SelectContent>
                  {postos.map((posto) => (
                    <SelectItem key={posto.id} value={posto.id}>
                      {posto.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedPosto && (
              <div className="flex gap-2">
                <Link href={`/posto/${selectedPosto}`}>
                  <Button variant="outline">
                    Ir para Posto Completo
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo principal - exibido apenas quando um posto é selecionado */}
      {selectedPosto ? (
        <div>
          <Tabs 
            value={selectedTab} 
            onValueChange={setSelectedTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="historico" className="flex items-center gap-2">
                <DropletIcon className="h-4 w-4" />
                <span>Histórico de Entradas</span>
              </TabsTrigger>
              <TabsTrigger value="registrar" className="flex items-center gap-2">
                <PlusCircleIcon className="h-4 w-4" />
                <span>Registrar Nova Entrada</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="historico" className="py-4">
              <HistoricoRecebimentos postId={selectedPosto} />
            </TabsContent>

            <TabsContent value="registrar" className="py-4">
              <FormularioRecebimento 
                postId={selectedPosto} 
                onSuccess={() => setSelectedTab('historico')}
              />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <Card className="bg-muted/40">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="h-16 w-16 text-muted-foreground opacity-40 mb-4" />
            <h3 className="text-xl font-medium text-muted-foreground">Selecione um posto para começar</h3>
            <p className="text-muted-foreground mt-2 text-center max-w-md">
              Escolha um posto na lista acima para visualizar o histórico de entradas ou registrar novas entradas de combustível.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EntradaCombustivelPage;