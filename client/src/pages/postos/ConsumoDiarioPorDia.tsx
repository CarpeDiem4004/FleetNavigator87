import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar, BarChart3, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { apiRequest } from '@/lib/queryClient';

// Interfaces para tipagem de dados
interface ConsumoDiario {
  data: string;
  litros: number;
  abastecimentos: number;
}

interface ConsumoResumo {
  totalLitros: number;
  totalAbastecimentos: number;
  mediaDiaria: number;
  diasComRegistro: number;
}

interface PostoConsumo {
  posto: string;
  tabelaOrigem: string;
  consumoDiario: ConsumoDiario[];
  resumo: ConsumoResumo;
}

interface ConsumoDiarioResponse {
  success: boolean;
  data: PostoConsumo[];
  params: {
    dias: number;
  };
}

// Componente principal da tabela de consumo por dia
const TabelaConsumoPorDia: React.FC<{ dados: PostoConsumo[] }> = ({ dados }) => {
  // Organizar dados por dia para todos os postos
  const diasUnicos = Array.from(
    new Set(
      dados.flatMap(posto => 
        posto.consumoDiario.map(dia => dia.data)
      )
    )
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).slice(0, 30); // Últimos 30 dias

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Consumo Diário por Posto (Últimos 30 dias)</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">Data</TableHead>
              {dados.map(posto => (
                <TableHead key={posto.tabelaOrigem} className="text-center min-w-[120px]">
                  {posto.posto}
                </TableHead>
              ))}
              <TableHead className="text-center font-bold min-w-[120px]">Total do Dia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {diasUnicos.map((dia, index) => {
              const totalDia = dados.reduce((total, posto) => {
                const consumoDia = posto.consumoDiario.find(c => c.data === dia);
                return total + (consumoDia?.litros || 0);
              }, 0);

              return (
                <TableRow key={dia} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">
                        Dia {index + 1}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(parseISO(dia), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </div>
                  </TableCell>
                  {dados.map(posto => {
                    const consumoDia = posto.consumoDiario.find(c => c.data === dia);
                    return (
                      <TableCell key={posto.tabelaOrigem} className="text-center">
                        {consumoDia ? (
                          <div>
                            <span className="font-semibold text-blue-600">
                              {consumoDia.litros.toLocaleString('pt-BR')} L
                            </span>
                            <div className="text-xs text-muted-foreground">
                              {consumoDia.abastecimentos} abast.
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center">
                    <span className="font-bold text-green-600 text-lg">
                      {totalDia > 0 ? `${totalDia.toLocaleString('pt-BR')} L` : '-'}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// Gráfico de consumo diário
const GraficoConsumoDiario: React.FC<{ dados: PostoConsumo[] }> = ({ dados }) => {
  // Preparar dados para o gráfico - últimos 14 dias
  const diasUnicos = Array.from(
    new Set(
      dados.flatMap(posto => 
        posto.consumoDiario.map(dia => dia.data)
      )
    )
  ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).slice(-14);

  const dadosGrafico = diasUnicos.map((dia, index) => {
    const dadosDia: any = {
      dia: `Dia ${index + 1}`,
      data: format(parseISO(dia), 'dd/MM', { locale: ptBR }),
      total: 0
    };

    dados.forEach(posto => {
      const consumoDia = posto.consumoDiario.find(c => c.data === dia);
      const litros = consumoDia?.litros || 0;
      dadosDia[posto.posto] = litros;
      dadosDia.total += litros;
    });

    return dadosDia;
  });

  const cores = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Gráfico de Consumo por Dia (Últimos 14 dias)</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={dadosGrafico}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="dia"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value}L`}
          />
          <Tooltip 
            formatter={(value, name) => [`${Number(value).toLocaleString('pt-BR')} L`, name]}
            labelFormatter={(label, payload) => {
              const item = payload?.[0]?.payload;
              return item ? `${label} (${item.data})` : label;
            }}
          />
          <Legend />
          {dados.map((posto, index) => (
            <Bar 
              key={posto.tabelaOrigem}
              dataKey={posto.posto} 
              fill={cores[index % cores.length]}
              name={posto.posto}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Cards de resumo
const CardsResumo: React.FC<{ dados: PostoConsumo[] }> = ({ dados }) => {
  const totalGeral = dados.reduce((sum, posto) => sum + posto.resumo.totalLitros, 0);
  const totalAbastecimentos = dados.reduce((sum, posto) => sum + posto.resumo.totalAbastecimentos, 0);
  const mediaDiariaGeral = dados.reduce((sum, posto) => sum + posto.resumo.mediaDiaria, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Total Consumido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {totalGeral.toLocaleString('pt-BR')} L
          </div>
          <p className="text-sm text-muted-foreground">
            Em {dados.length} postos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Total de Abastecimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {totalAbastecimentos.toLocaleString('pt-BR')}
          </div>
          <p className="text-sm text-muted-foreground">
            Operações registradas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Média Diária Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {mediaDiariaGeral.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} L
          </div>
          <p className="text-sm text-muted-foreground">
            Soma das médias por posto
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// Página Principal
const ConsumoDiarioPorDia: React.FC = () => {
  const { toast } = useToast();
  const [periodo, setPeriodo] = useState<number>(30);
  
  const { data, isLoading, error } = useQuery<ConsumoDiarioResponse>({
    queryKey: ['/api/consumo-diario-postos', periodo],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/consumo-diario-postos?dias=${periodo}`);
      return response.json();
    }
  });
  
  // Usar useEffect para mostrar toast de erro, evitando loop infinito
  useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao carregar dados",
        description: (error as Error).message || "Não foi possível obter dados dos postos",
        variant: "destructive"
      });
    }
  }, [error, toast]);
  
  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="flex items-center space-x-2 mb-6">
          <Loader2 className="h-5 w-5 animate-spin" />
          <h1 className="text-2xl font-bold">Carregando dados de consumo...</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-[180px] bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  
  if (error || !data || !data.success) {
    return (
      <div className="container py-6">
        <div className="p-6 bg-red-50 border border-red-200 rounded-md text-red-800">
          <h3 className="font-bold flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Erro ao carregar dados
          </h3>
          <p className="mt-2">
            Não foi possível obter os dados de consumo dos postos.
            Por favor, tente novamente mais tarde.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <TrendingUp className="mr-2 h-6 w-6" />
            Consumo Diário por Posto
          </h1>
          <p className="text-muted-foreground">
            Acompanhe o consumo de combustível dia a dia para todos os postos
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={periodo === 7 ? "default" : "outline"} 
            size="sm"
            onClick={() => setPeriodo(7)}
          >
            7 dias
          </Button>
          <Button 
            variant={periodo === 30 ? "default" : "outline"} 
            size="sm"
            onClick={() => setPeriodo(30)}
          >
            30 dias
          </Button>
          <Button 
            variant={periodo === 90 ? "default" : "outline"} 
            size="sm"
            onClick={() => setPeriodo(90)}
          >
            90 dias
          </Button>
        </div>
      </div>
      
      <CardsResumo dados={data.data} />
      
      <Tabs defaultValue="tabela" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="tabela" className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Tabela por Dia
          </TabsTrigger>
          <TabsTrigger value="grafico" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Gráfico
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tabela">
          <Card>
            <CardContent className="p-6">
              <TabelaConsumoPorDia dados={data.data} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="grafico">
          <Card>
            <CardContent className="p-6">
              <GraficoConsumoDiario dados={data.data} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConsumoDiarioPorDia;