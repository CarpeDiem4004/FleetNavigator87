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
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import HistoricoAbastecimentosTabela from '@/components/posto-remedios/HistoricoAbastecimentosTabela';
import FormularioAbastecimentoStandalone from '@/components/posto-remedios/FormularioAbastecimentoStandalone';

export default function PostoRemediosStandalone() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [registros, setRegistros] = useState<any[]>([]);
  const [loadingRegistros, setLoadingRegistros] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [filtroPlaca, setFiltroPlaca] = useState('');

  const carregarRegistros = async () => {
    setLoadingRegistros(true);
    try {
      let url = '/api/posto-remedios-standalone/abastecimentos';
      const params = new URLSearchParams();
      
      if (dataInicio && dataFim) {
        params.append('startDate', dataInicio);
        params.append('endDate', dataFim);
      }
      
      if (filtroPlaca) {
        params.append('placa', filtroPlaca);
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setRegistros(data.data);
      } else {
        toast({
          title: 'Erro',
          description: data.message || 'Erro ao buscar registros',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao buscar registros:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao buscar registros',
        variant: 'destructive',
      });
    } finally {
      setLoadingRegistros(false);
    }
  };

  useEffect(() => {
    carregarRegistros();
  }, []);

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Posto Remédios - Controle de Abastecimento e Lavagem</h1>
      </div>

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
              <FormularioAbastecimentoStandalone />
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                  <Input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
                  <Input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Placa</label>
                  <Input
                    placeholder="Filtrar por placa"
                    value={filtroPlaca}
                    onChange={(e) => setFiltroPlaca(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={() => carregarRegistros()} className="w-full">
                    Filtrar
                  </Button>
                </div>
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
  );
}