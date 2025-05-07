import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/AppLayout';
import HistoricoAbastecimentosTabela from '@/components/posto-remedios/HistoricoAbastecimentosTabela';
import PostoRemediosForm from '@/components/posto-remedios/PostoRemediosForm';

export default function PostoRemediosPage() {
  const { toast } = useToast();
  const [registros, setRegistros] = useState<any[]>([]);
  const [filtroPlaca, setFiltroPlaca] = useState('');
  const [loadingRegistros, setLoadingRegistros] = useState(false);

  // Carregar registros ao inicializar a página
  useEffect(() => {
    carregarRegistros();
  }, []);

  // Função para carregar registros do posto Remédios (usando rota standalone que não requer autenticação)
  const carregarRegistros = async () => {
    setLoadingRegistros(true);
    try {
      const response = await fetch(`/api/posto-remedios-standalone/abastecimentos${filtroPlaca ? `?placa=${filtroPlaca}` : ''}`);
      if (response.ok) {
        const data = await response.json();
        setRegistros(data.data || []);
      } else {
        toast({
          title: 'Erro',
          description: 'Falha ao carregar registros',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar registros',
        variant: 'destructive',
      });
    } finally {
      setLoadingRegistros(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Posto Remédios - Controle de Abastecimento e Lavagem</h1>

        <Tabs defaultValue="novo" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="novo">Novo Registro</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="novo" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Registrar Abastecimento ou Lavagem</CardTitle>
                <CardDescription>
                  Preencha os dados para registrar um abastecimento ou lavagem no Posto Remédios.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PostoRemediosForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Abastecimentos</CardTitle>
                <CardDescription>
                  Visualize os registros de abastecimento do Posto Remédios.
                </CardDescription>
                <div className="flex items-center gap-2 mt-4">
                  <Input
                    placeholder="Filtrar por placa"
                    value={filtroPlaca}
                    onChange={(e) => setFiltroPlaca(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button onClick={() => carregarRegistros()} variant="outline">
                    Filtrar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <HistoricoAbastecimentosTabela 
                  registros={registros} 
                  loading={loadingRegistros} 
                  onRefresh={carregarRegistros}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}