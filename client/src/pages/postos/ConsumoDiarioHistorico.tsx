import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, TrendingUp, BarChart3, Filter, Download, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoricoConsumo {
  data_coleta: string;
  posto: string;
  litros_consumidos: number;
  numero_abastecimentos: number;
  valor_total: number;
  nivel_tanque_atual: number;
  capacidade_maxima: number;
  percentual_disponivel: number;
  created_at: string;
}

interface ResumoConsumo {
  posto: string;
  dias_registrados: number;
  total_litros: number;
  total_abastecimentos: number;
  total_valor: number;
  media_litros_dia: number;
  media_abastecimentos_dia: number;
  media_percentual_disponivel: number;
}

export default function ConsumoDiarioHistorico() {
  const [filtroPostos, setFiltroPostos] = useState<string>('todos');
  const [periodoDias, setPeriodoDias] = useState<number>(30);
  const [activeTab, setActiveTab] = useState('historico');

  // Query para histórico completo
  const { data: historico, isLoading: loadingHistorico, refetch: refetchHistorico } = useQuery<HistoricoConsumo[]>({
    queryKey: ['consumo-diario-historico', filtroPostos, periodoDias],
    queryFn: async () => {
      const params = new URLSearchParams({
        periodo: periodoDias.toString(),
        ...(filtroPostos !== 'todos' && { posto: filtroPostos })
      });
      
      const response = await fetch(`/api/consumo-diario-historico?${params}`);
      if (!response.ok) throw new Error('Erro ao carregar histórico');
      const result = await response.json();
      return result.data;
    }
  });

  // Query para resumo consolidado
  const { data: resumo, isLoading: loadingResumo } = useQuery<ResumoConsumo[]>({
    queryKey: ['consumo-diario-resumo', periodoDias],
    queryFn: async () => {
      const response = await fetch(`/api/consumo-diario-historico/resumo?periodo=${periodoDias}`);
      if (!response.ok) throw new Error('Erro ao carregar resumo');
      const result = await response.json();
      return result.data;
    }
  });

  // Função para executar coleta manual
  const executarColetaManual = async () => {
    try {
      const response = await fetch('/api/consumo-diario-historico/coletar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        refetchHistorico();
        alert('Coleta manual executada com sucesso!');
      } else {
        alert('Erro ao executar coleta manual');
      }
    } catch (error) {
      console.error('Erro na coleta manual:', error);
      alert('Erro ao executar coleta manual');
    }
  };

  const postos = ['Abc_v2', 'Alair_v2', 'Campinas_v2', 'Osasco_v2', 'Socorro_v2', 'Sorocaba_v2'];

  // Agrupar histórico por data
  const historicoAgrupado = historico?.reduce((acc, item) => {
    const data = item.data_coleta;
    if (!acc[data]) acc[data] = [];
    acc[data].push(item);
    return acc;
  }, {} as Record<string, HistoricoConsumo[]>) || {};

  const datasOrdenadas = Object.keys(historicoAgrupado).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Histórico de Consumo Diário</h1>
          <p className="text-gray-600 mt-1">
            Dados coletados automaticamente à meia-noite de todos os postos
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={executarColetaManual}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Coletar Agora
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetchHistorico()}
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={periodoDias.toString()} onValueChange={(value) => setPeriodoDias(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">Últimos 15 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Posto</label>
              <Select value={filtroPostos} onValueChange={setFiltroPostos}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os postos</SelectItem>
                  {postos.map(posto => (
                    <SelectItem key={posto} value={posto}>{posto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="historico">Histórico Detalhado</TabsTrigger>
          <TabsTrigger value="resumo">Resumo Consolidado</TabsTrigger>
        </TabsList>

        {/* Tab Histórico Detalhado */}
        <TabsContent value="historico" className="space-y-4">
          {loadingHistorico ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : datasOrdenadas.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum registro encontrado para o período selecionado</p>
                <Button onClick={executarColetaManual} className="mt-4">
                  Executar Primeira Coleta
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {datasOrdenadas.map(data => (
                <Card key={data}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {(() => {
                        try {
                          const [year, month, day] = data.split('-');
                          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day) + 1);
                          return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
                        } catch (error) {
                          return data;
                        }
                      })()}
                    </CardTitle>
                    <CardDescription>
                      {historicoAgrupado[data].length} posto(s) registrados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {historicoAgrupado[data].map(registro => (
                        <div key={`${data}-${registro.posto}`} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">{registro.posto}</h4>
                            <Badge variant="outline">
                              {Number(registro.percentual_disponivel || 0).toFixed(1)}%
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Litros consumidos:</span>
                              <span className="font-medium">{Number(registro.litros_consumidos || 0).toFixed(2)}L</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Abastecimentos:</span>
                              <span className="font-medium">{registro.numero_abastecimentos}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Valor total:</span>
                              <span className="font-medium">R$ {Number(registro.valor_total || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Nível tanque:</span>
                              <span className="font-medium">{Number(registro.nivel_tanque_atual || 0).toFixed(0)}L</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab Resumo Consolidado */}
        <TabsContent value="resumo" className="space-y-4">
          {loadingResumo ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : !resumo || resumo.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum dado de resumo disponível</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {resumo.map(posto => (
                <Card key={posto.posto}>
                  <CardHeader>
                    <CardTitle>{posto.posto}</CardTitle>
                    <CardDescription>
                      {posto.dias_registrados} dias registrados nos últimos {periodoDias} dias
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Total de litros</p>
                        <p className="text-lg font-semibold">{Number(posto.total_litros || 0).toFixed(2)}L</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total abastecimentos</p>
                        <p className="text-lg font-semibold">{posto.total_abastecimentos}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Valor total</p>
                        <p className="text-lg font-semibold">R$ {Number(posto.total_valor || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Média disponível</p>
                        <p className="text-lg font-semibold">{Number(posto.media_percentual_disponivel || 0).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Média litros/dia</p>
                        <p className="text-lg font-semibold">{Number(posto.media_litros_dia || 0).toFixed(2)}L</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Média abast./dia</p>
                        <p className="text-lg font-semibold">{Number(posto.media_abastecimentos_dia || 0).toFixed(1)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Informações sobre o sistema */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Sistema de Coleta Automática</h4>
              <p className="text-blue-700 text-sm mt-1">
                Os dados são coletados automaticamente todos os dias à meia-noite (00:00). 
                O sistema registra o consumo do dia anterior, níveis de tanque e estatísticas de abastecimento 
                para cada um dos 6 postos ativos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}