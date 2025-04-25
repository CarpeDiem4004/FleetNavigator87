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
  
  // Definir callback global para ser usado pelo formulário
  useEffect(() => {
    // Definir a função de callback para atualizar os registros após o cadastro
    (window as any).onSubmitSuccessPostoRemedios = () => {
      console.log("[PostoRemediosStandalone] Callback de atualização chamado");
      carregarRegistros();
    };
    
    // Limpar a função quando o componente for desmontado
    return () => {
      delete (window as any).onSubmitSuccessPostoRemedios;
    };
  }, []);

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
      
      console.log("[POSTO REMEDIOS] Buscando registros em:", url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      // Log detalhado da resposta da API
      console.log("[POSTO REMEDIOS] Resposta da API completa:", data);
      console.log("[POSTO REMEDIOS] Status da API:", data.success);
      console.log("[POSTO REMEDIOS] Total de registros retornados:", data.data?.length || 0);
      
      // Se existirem registros, vamos imprimir o primeiro para depuração
      if (data.data && data.data.length > 0) {
        console.log("[POSTO REMEDIOS] Primeiro registro:", data.data[0]);
        console.log("[POSTO REMEDIOS] Campos do primeiro registro:", Object.keys(data.data[0]).join(", "));
      }
      
      if (data.success) {
        // Garantir que os campos necessários estão presentes
        const registrosFormatados = data.data.map((item: any) => ({
          id: item.id,
          placa: item.placa,
          km: item.km,
          projeto: item.projeto,
          motorista_nome: item.motorista_nome,
          motorista_rg: item.motorista_rg,
          tipo_combustivel: item.tipo_combustivel || 'N/A',
          quantidade_litros: parseFloat(item.quantidade_litros) || 0,
          valor_litro: parseFloat(item.valor_litro) || 0,
          valor_total: parseFloat(item.valor_total) || 0,
          lavagem: item.lavagem || false,
          tipo_lavagem: item.tipo_lavagem || '',
          observacoes: item.observacoes || '',
          created_at: item.created_at || item.data_registro
        }));
        
        console.log("[POSTO REMEDIOS] Registros formatados:", registrosFormatados);
        setRegistros(registrosFormatados);
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

  // Monitorar registros recebidos
  useEffect(() => {
    console.log("[POSTO REMEDIOS] Total de registros em estado:", registros?.length);
    if (registros?.length > 0) {
      console.log("[POSTO REMEDIOS] Primeiro registro:", registros[0]);
    }
  }, [registros]);

  // Carregar registros na montagem do componente
  useEffect(() => {
    console.log("[POSTO REMEDIOS] Componente montado - carregando registros");
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