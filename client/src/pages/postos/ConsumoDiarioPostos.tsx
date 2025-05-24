import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Droplet, Info, BarChart3, Calendar, List } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// Usando componente ProtectedRoute no App.tsx em vez de hook
import { apiRequest } from '@/lib/queryClient';

// Interfaces para tipagem de dados
interface ConsumoResumo {
  totalLitros: number;
  totalAbastecimentos: number;
  mediaDiaria: number;
  diasComRegistro: number;
}

interface ConsumoDiario {
  data: string;
  litros: number;
  abastecimentos: number;
}

interface PostoConsumo {
  posto: string;
  tabelaOrigem: string;
  consumoDiario: ConsumoDiario[];
  resumo: ConsumoResumo;
}

interface PostoConsumoDetalhado extends PostoConsumo {
  ultimosAbastecimentos: AbastecimentoDetalhe[];
}

interface AbastecimentoDetalhe {
  id: number;
  data_hora: string;
  placa: string;
  litros: number;
  km: number;
  motorista: string;
  projeto: string;
}

interface ConsumoDiarioResponse {
  success: boolean;
  data: PostoConsumo[];
  params: {
    dias: number;
  };
}

interface ConsumoDiarioDetalhadoResponse {
  success: boolean;
  data: PostoConsumoDetalhado;
  params: {
    dias: number;
  };
}

// Componente para Visualização de Resumo
const ResumoConsumoCard: React.FC<{ dados: PostoConsumo }> = ({ dados }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center">
          <Droplet className="h-5 w-5 mr-2 text-blue-500" />
          {dados.posto}
        </CardTitle>
        <CardDescription>
          Consumo dos últimos {dados.resumo.diasComRegistro} dias
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{dados.resumo.totalLitros.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} L</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Média Diária</p>
            <p className="text-2xl font-bold">{dados.resumo.mediaDiaria.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} L</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Abastecimentos</p>
            <p className="text-xl font-semibold">{dados.resumo.totalAbastecimentos}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Dias c/ Registro</p>
            <p className="text-xl font-semibold">{dados.resumo.diasComRegistro}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente para Gráfico de Consumo Diário
const GraficoConsumoDiario: React.FC<{ dados: ConsumoDiario[] }> = ({ dados }) => {
  // Ordenar dados por data (do mais antigo para o mais recente)
  const dadosOrdenados = [...dados].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  
  // Formatar datas para o gráfico
  const dadosFormatados = dadosOrdenados.map(item => ({
    ...item,
    dataFormatada: format(new Date(item.data), 'dd/MM', { locale: ptBR })
  }));

  return (
    <div className="w-full h-[300px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={dadosFormatados}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="dataFormatada" />
          <YAxis />
          <Tooltip 
            formatter={(value: number) => [`${value.toLocaleString('pt-BR')} litros`, 'Consumo']}
            labelFormatter={(label) => `Data: ${label}`}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="litros" 
            name="Litros Consumidos"
            stroke="#2563eb" 
            activeDot={{ r: 8 }} 
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Componente para Comparativo entre Postos
const ComparativoPostos: React.FC<{ dados: PostoConsumo[] }> = ({ dados }) => {
  // Ordenar postos por consumo total (decrescente)
  const postosOrdenados = [...dados].sort((a, b) => b.resumo.totalLitros - a.resumo.totalLitros);
  
  // Criar dados para o gráfico
  const dadosGrafico = postosOrdenados.map(posto => ({
    nome: posto.posto,
    litros: posto.resumo.totalLitros,
    abastecimentos: posto.resumo.totalAbastecimentos
  }));

  return (
    <div className="w-full h-[400px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        {/* Usando BarChart do recharts, não o ícone do lucide-react */}
        <BarChart
          data={dadosGrafico}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
          barSize={35}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="nome" 
            angle={-45} 
            textAnchor="end" 
            height={70}
            interval={0}
          />
          <YAxis />
          <Tooltip 
            formatter={(value: number, name: string) => {
              if (name === "litros") return [`${value.toLocaleString('pt-BR')} litros`, 'Consumo'];
              return [`${value} abastecimentos`, 'Abastecimentos'];
            }}
          />
          <Legend />
          <Bar dataKey="litros" name="Litros Consumidos" fill="#2563eb" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Componente para Lista de Abastecimentos
const ListaAbastecimentos: React.FC<{ abastecimentos: AbastecimentoDetalhe[] }> = ({ abastecimentos }) => {
  return (
    <div className="mt-4 rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Placa</TableHead>
            <TableHead>Litros</TableHead>
            <TableHead>KM</TableHead>
            <TableHead>Motorista</TableHead>
            <TableHead>Projeto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {abastecimentos.length > 0 ? (
            abastecimentos.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {format(new Date(item.data_hora), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </TableCell>
                <TableCell>{item.placa}</TableCell>
                <TableCell>{item.litros.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</TableCell>
                <TableCell>{item.km.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</TableCell>
                <TableCell>{item.motorista || 'N/A'}</TableCell>
                <TableCell>{item.projeto || 'N/A'}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                Nenhum abastecimento encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

// Componente principal para Detalhes de um Posto
const DetalhesPostoConsumo: React.FC<{ postoId: string }> = ({ postoId }) => {
  const { toast } = useToast();
  const [periodo, setPeriodo] = useState<number>(30);
  
  const { data, isLoading, error } = useQuery<ConsumoDiarioDetalhadoResponse>({
    queryKey: [`/api/consumo-diario-postos/${postoId}`, periodo],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/consumo-diario-postos/${postoId}?dias=${periodo}`);
      return response.json();
    }
  });
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-[300px] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    );
  }
  
  if (error || !data || !data.success) {
    toast({
      title: "Erro ao carregar dados",
      description: error ? (error as Error).message : "Não foi possível obter dados do posto",
      variant: "destructive"
    });
    
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-md text-red-800">
        <h3 className="font-bold flex items-center">
          <Info className="mr-2 h-5 w-5" />
          Erro ao carregar dados
        </h3>
        <p className="mt-2">
          Não foi possível obter os dados de consumo para o posto {postoId}.
          Por favor, tente novamente mais tarde.
        </p>
      </div>
    );
  }
  
  const postoData = data.data;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{postoData.posto}</h2>
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
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart className="h-5 w-5 mr-2" />
            Consumo Diário
          </CardTitle>
          <CardDescription>
            Histórico de consumo dos últimos {periodo} dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GraficoConsumoDiario dados={postoData.consumoDiario} />
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{postoData.resumo.totalLitros.toLocaleString('pt-BR')} L</p>
            <p className="text-sm text-muted-foreground">Em {postoData.resumo.diasComRegistro} dias com registro</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Média Diária</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{postoData.resumo.mediaDiaria.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} L</p>
            <p className="text-sm text-muted-foreground">Por dia de operação</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Abastecimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{postoData.resumo.totalAbastecimentos}</p>
            <p className="text-sm text-muted-foreground">Total no período</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <List className="h-5 w-5 mr-2" />
            Últimos Abastecimentos
          </CardTitle>
          <CardDescription>
            Os {postoData.ultimosAbastecimentos.length} abastecimentos mais recentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ListaAbastecimentos abastecimentos={postoData.ultimosAbastecimentos} />
        </CardContent>
      </Card>
    </div>
  );
};

// Página Principal
const ConsumoDiarioPostos: React.FC = () => {
  // A proteção da rota é feita pelo componente ProtectedRoute no App.tsx
  const { toast } = useToast();
  const [selectedPosto, setSelectedPosto] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<number>(30);
  const [activeTab, setActiveTab] = useState<string>("resumo");
  
  const { data, isLoading, error } = useQuery<ConsumoDiarioResponse>({
    queryKey: ['/api/consumo-diario-postos', periodo],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/consumo-diario-postos?dias=${periodo}`);
      return response.json();
    }
  });
  
  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="flex items-center space-x-2 mb-6">
          <Loader2 className="h-5 w-5 animate-spin" />
          <h1 className="text-2xl font-bold">Carregando dados de consumo...</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-[180px] w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  if (error || !data || !data.success) {
    toast({
      title: "Erro ao carregar dados",
      description: error ? (error as Error).message : "Não foi possível obter dados dos postos",
      variant: "destructive"
    });
    
    return (
      <div className="container py-6">
        <div className="p-6 bg-red-50 border border-red-200 rounded-md text-red-800">
          <h3 className="font-bold flex items-center">
            <Info className="mr-2 h-5 w-5" />
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
  
  // Se um posto foi selecionado, mostrar detalhes
  if (selectedPosto) {
    return (
      <div className="container py-6">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setSelectedPosto(null)}
            className="mb-4"
          >
            ← Voltar para lista de postos
          </Button>
          
          <DetalhesPostoConsumo postoId={selectedPosto} />
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Consumo Diário de Combustível</h1>
          <p className="text-muted-foreground">
            Acompanhe o consumo de combustível por posto em diferentes períodos
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
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="resumo" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Resumo
          </TabsTrigger>
          <TabsTrigger value="comparativo" className="flex items-center">
            <BarChart className="h-4 w-4 mr-2" />
            Comparativo
          </TabsTrigger>
          <TabsTrigger value="calendario" className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Histórico
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="resumo">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.data.map((posto) => (
              <div key={posto.tabelaOrigem} onClick={() => setSelectedPosto(posto.tabelaOrigem.replace('abastecimentos_posto_', ''))}>
                <ResumoConsumoCard dados={posto} />
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="comparativo">
          <Card>
            <CardHeader>
              <CardTitle>Comparativo de Consumo entre Postos</CardTitle>
              <CardDescription>
                Consumo total por posto nos últimos {periodo} dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComparativoPostos dados={data.data} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="calendario">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Consumo Diário</CardTitle>
              <CardDescription>
                Selecione um posto para ver o histórico detalhado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {data.data.map((posto) => (
                  <Button 
                    key={posto.tabelaOrigem} 
                    variant="outline"
                    className="h-auto py-4 justify-start text-left"
                    onClick={() => setSelectedPosto(posto.tabelaOrigem.replace('abastecimentos_posto_', ''))}
                  >
                    <div>
                      <p className="font-bold">{posto.posto}</p>
                      <p className="text-sm text-muted-foreground">
                        {posto.resumo.totalLitros.toLocaleString('pt-BR')} litros em {posto.resumo.diasComRegistro} dias
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConsumoDiarioPostos;