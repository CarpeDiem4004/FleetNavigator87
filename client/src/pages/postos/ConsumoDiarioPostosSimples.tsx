import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Droplet, Info, Calendar, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

interface ConsumoDiarioResponse {
  success: boolean;
  data: PostoConsumo[];
  params: {
    dias: number;
  };
}

// Componente para card de resumo de posto
const PostoCard: React.FC<{ dados: PostoConsumo }> = ({ dados }) => {
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
            <p className="text-2xl font-bold">
              {dados.resumo.totalLitros.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} L
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Média Diária</p>
            <p className="text-2xl font-bold">
              {dados.resumo.mediaDiaria.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} L
            </p>
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

// Página Principal Simplificada
const ConsumoDiarioPostosSimples: React.FC = () => {
  const { toast } = useToast();
  const [periodo, setPeriodo] = useState<number>(30);
  const [hasShownError, setHasShownError] = useState<boolean>(false);
  
  const { data, isLoading, error } = useQuery<ConsumoDiarioResponse>({
    queryKey: ['/api/consumo-diario-postos', periodo],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/consumo-diario-postos?dias=${periodo}`);
      return response.json();
    },
    retry: 1
  });
  
  // Mostrar toast de erro apenas uma vez
  useEffect(() => {
    if (error && !hasShownError) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível obter dados dos postos",
        variant: "destructive"
      });
      setHasShownError(true);
    }
  }, [error, hasShownError, toast]);
  
  // Reset flag de erro quando mudar o período
  useEffect(() => {
    setHasShownError(false);
  }, [periodo]);
  
  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="flex items-center space-x-2 mb-6">
          <Loader2 className="h-5 w-5 animate-spin" />
          <h1 className="text-2xl font-bold">Carregando dados de consumo...</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-[180px] w-full bg-gray-200 animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }
  
  if (error || !data?.success) {
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
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }
  
  const postosData = data.data || [];
  
  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Consumo Diário de Postos</h1>
        
        <div className="flex space-x-2">
          {[7, 30, 90].map((dias) => (
            <Button
              key={dias}
              variant={periodo === dias ? "default" : "outline"}
              onClick={() => setPeriodo(dias)}
              size="sm"
            >
              {dias} dias
            </Button>
          ))}
        </div>
      </div>
      
      {postosData.length === 0 ? (
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
          <h3 className="font-bold">Nenhum dado encontrado</h3>
          <p className="mt-2">
            Não foram encontrados dados de consumo para o período selecionado.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {postosData.map((posto, index) => (
            <PostoCard key={index} dados={posto} />
          ))}
        </div>
      )}
      
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="font-semibold text-blue-800 mb-2">Resumo Geral</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-blue-600">Total de Postos</p>
            <p className="font-bold text-lg">{postosData.length}</p>
          </div>
          <div>
            <p className="text-blue-600">Total de Litros</p>
            <p className="font-bold text-lg">
              {postosData.reduce((acc, posto) => acc + posto.resumo.totalLitros, 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} L
            </p>
          </div>
          <div>
            <p className="text-blue-600">Total de Abastecimentos</p>
            <p className="font-bold text-lg">
              {postosData.reduce((acc, posto) => acc + posto.resumo.totalAbastecimentos, 0)}
            </p>
          </div>
          <div>
            <p className="text-blue-600">Período</p>
            <p className="font-bold text-lg">{periodo} dias</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsumoDiarioPostosSimples;