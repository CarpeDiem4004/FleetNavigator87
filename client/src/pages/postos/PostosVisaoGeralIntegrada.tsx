import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { AlertTriangle, DropletIcon, Filter, Fuel, LogIn, RefreshCw, Search, BarChart4, Calendar, Clock } from 'lucide-react';
import ConsumoDiarioHistorico from './ConsumoDiarioHistorico';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import clsx from 'clsx';


interface PostoResumo {
  id: number;
  nome: string;
  localizacao: string;
  capacidade_total: number;
  volume_atual: number;
  total_abastecimentos: number;
  total_litros: number;
  alerta_nivel_baixo: boolean;
  percentual: number;
  ultima_atualizacao: string;
}

interface ConsumoDiario {
  dia: number;
  data: string;
  osasco_v2: number;
  alair_v2: number;
  campinas_v2: number;
  abc_v2: number;
  socorro_v2: number;
  sorocaba_v2: number;
  total: number;
}

// Função para formatação de números
const formatarNumero = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR').format(Math.round(valor));
};

// Função para formatação de percentual
const formatarPercentual = (valor: number): string => {
  return Number(valor).toFixed(1).replace('.', ',') + '%';
};

export default function PostosVisaoGeralIntegrada() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [periodoDias, setPeriodoDias] = useState(30);
  const [filtros, setFiltros] = useState({
    mostrarApenasAlertas: false,
    ordenarPor: 'nome', // 'nome', 'nivel' ou 'localizacao'
  });
  const { toast } = useToast();

  // Buscar lista de postos
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['/api/postos'],
    queryFn: async () => {
      const res = await fetch('/api/postos');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao buscar dados dos postos');
      }
      const data = await res.json();
      return data.data as PostoResumo[];
    }
  });

  // Buscar dados de consumo diário
  const { data: consumoDiarioData, isLoading: isLoadingConsumo } = useQuery({
    queryKey: ['/api/consumo-diario-postos-simplificado', periodoDias],
    queryFn: async () => {
      const res = await fetch(`/api/consumo-diario-postos-simplificado?dias=${periodoDias}`);
      if (!res.ok) {
        throw new Error('Erro ao buscar dados de consumo diário');
      }
      const data = await res.json();
      return data.data as ConsumoDiario[];
    },
    enabled: activeTab === 'consumo-diario'
  });

  // Determinar a classe de cor para o indicador de nível
  const getAlertColorClass = (posto: PostoResumo): string => {
    if (posto.percentual < 15) {
      return 'text-red-500 bg-red-50';
    }
    if (posto.percentual < 30) {
      return 'text-amber-500 bg-amber-50';
    }
    return 'text-green-500 bg-green-50';
  };

  // Filtragem e ordenação dos postos
  const postosFiltrados = React.useMemo(() => {
    if (!data) return [];
    
    // Aplicar filtro de pesquisa
    let resultado = data.filter(posto => 
      posto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      posto.localizacao.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Aplicar filtro de alertas
    if (filtros.mostrarApenasAlertas) {
      resultado = resultado.filter(posto => posto.alerta_nivel_baixo);
    }
    
    // Aplicar ordenação
    switch (filtros.ordenarPor) {
      case 'nivel':
        resultado.sort((a, b) => a.percentual - b.percentual);
        break;
      case 'localizacao':
        resultado.sort((a, b) => a.localizacao.localeCompare(b.localizacao));
        break;
      case 'nome':
      default:
        resultado.sort((a, b) => a.nome.localeCompare(b.nome));
        break;
    }
    
    return resultado;
  }, [data, searchTerm, filtros.mostrarApenasAlertas, filtros.ordenarPor]);

  // Componente de carregamento
  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-500">Carregando dados dos postos...</p>
          </div>
        </div>
      </div>
    );
  }

  // Componente de erro
  if (isError) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-8 text-red-500">
            <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
            <p>{error instanceof Error ? error.message : 'Erro ao carregar dados dos postos.'}</p>
            {error instanceof Error && error.message.includes('autenticado') ? (
              <Button className="mt-4" onClick={() => setLocation('/auth')}>
                <LogIn className="mr-2 h-4 w-4" />
                Fazer login
              </Button>
            ) : (
              <Button className="mt-4" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Visão Geral dos Postos de Abastecimento</h1>
          <p className="text-gray-500 mt-1">
            Monitore o status e consumo de todos os postos de abastecimento da frota
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="visao-geral" className="flex items-center gap-2">
            <DropletIcon className="h-4 w-4" />
            Status dos Postos
          </TabsTrigger>
          <TabsTrigger value="consumo-diario" className="flex items-center gap-2">
            <BarChart4 className="h-4 w-4" />
            Consumo Diário
          </TabsTrigger>
          <TabsTrigger value="historico-automatico" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Histórico Automático
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="mt-6">
          {/* Filtros e pesquisa */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por nome ou localização"
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      Filtros
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuCheckboxItem
                      checked={filtros.mostrarApenasAlertas}
                      onCheckedChange={(checked) => 
                        setFiltros(prev => ({ ...prev, mostrarApenasAlertas: checked as boolean }))
                      }
                    >
                      Apenas postos com alerta
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Ordenar por
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuCheckboxItem
                      checked={filtros.ordenarPor === 'nome'}
                      onCheckedChange={() => 
                        setFiltros(prev => ({ ...prev, ordenarPor: 'nome' }))
                      }
                    >
                      Nome
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={filtros.ordenarPor === 'nivel'}
                      onCheckedChange={() => 
                        setFiltros(prev => ({ ...prev, ordenarPor: 'nivel' }))
                      }
                    >
                      Nível (crescente)
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={filtros.ordenarPor === 'localizacao'}
                      onCheckedChange={() => 
                        setFiltros(prev => ({ ...prev, ordenarPor: 'localizacao' }))
                      }
                    >
                      Localização
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Contadores */}
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="bg-gray-50 px-3 py-1 rounded-full text-sm">
                Total de postos: <span className="font-medium">{data?.length || 0}</span>
              </div>
              <div className="bg-red-50 px-3 py-1 rounded-full text-sm text-red-700">
                Postos em alerta: <span className="font-medium">{data?.filter(p => p.alerta_nivel_baixo).length || 0}</span>
              </div>
              <div className="bg-blue-50 px-3 py-1 rounded-full text-sm text-blue-700">
                Volume total: <span className="font-medium">{formatarNumero(data?.reduce((acc, p) => acc + p.volume_atual, 0) || 0)} L</span>
              </div>
            </div>
          </div>
          
          {/* Grid de cards dos postos */}
          {postosFiltrados.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">Nenhum posto encontrado com os filtros aplicados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {postosFiltrados.map((posto) => (
                <Card 
                  key={posto.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setLocation(`/postos/${posto.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          {posto.nome}
                          {posto.alerta_nivel_baixo && (
                            <AlertTriangle className="ml-2 h-4 w-4 text-red-500" />
                          )}
                        </CardTitle>
                        <CardDescription className="text-base">{posto.localizacao}</CardDescription>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={clsx(
                          "py-1 px-2 rounded-full",
                          getAlertColorClass(posto)
                        )}
                      >
                        {formatarPercentual(posto.percentual)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="mb-2">
                      <div className="text-sm text-gray-500 mb-1">Nível do Tanque</div>
                      <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={clsx(
                            "absolute h-full",
                            posto.percentual < 15 
                              ? "bg-red-500" 
                              : posto.percentual < 30 
                                ? "bg-amber-500" 
                                : "bg-green-500"
                          )}
                          style={{ width: `${Math.min(100, posto.percentual)}%` }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                          {formatarNumero(posto.volume_atual)} / {formatarNumero(posto.capacidade_total)} L
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center">
                          <DropletIcon className="h-4 w-4 mr-1 text-blue-500" />
                          <span className="text-sm text-gray-500">Abastecimentos</span>
                        </div>
                        <p className="font-medium">{formatarNumero(posto.total_abastecimentos)}</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center">
                          <Fuel className="h-4 w-4 mr-1 text-blue-500" />
                          <span className="text-sm text-gray-500">Total Abastecido</span>
                        </div>
                        <p className="font-medium">{formatarNumero(posto.total_litros)} L</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="text-xs text-gray-500 border-t pt-3">
                    Atualizado em: {posto.ultima_atualizacao ? format(new Date(posto.ultima_atualizacao), 'dd/MM/yyyy HH:mm') : 'Não disponível'}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="consumo-diario" className="mt-6">
          {/* Seção de Consumo Diário */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Consumo Diário por Posto
                </h3>
                <p className="text-gray-500 text-sm">Visualize o consumo dia a dia de todos os postos</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={periodoDias === 15 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriodoDias(15)}
                >
                  15 dias
                </Button>
                <Button
                  variant={periodoDias === 30 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriodoDias(30)}
                >
                  30 dias
                </Button>
                <Button
                  variant={periodoDias === 90 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriodoDias(90)}
                >
                  90 dias
                </Button>
              </div>
            </div>
          </div>

          {isLoadingConsumo ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-500">Carregando dados de consumo...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dia
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Osasco V2
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Alair V2
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Campinas V2
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ABC V2
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Socorro V2
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sorocaba V2
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {consumoDiarioData?.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Dia {item.dia}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.data ? format(new Date(item.data), 'dd/MM/yyyy') : 'Data inválida'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatarNumero(item.osasco_v2)} L
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatarNumero(item.alair_v2)} L
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatarNumero(item.campinas_v2)} L
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatarNumero(item.abc_v2)} L
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatarNumero(item.socorro_v2)} L
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatarNumero(item.sorocaba_v2)} L
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right bg-blue-50">
                          {formatarNumero(item.total)} L
                        </td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                          Nenhum dado de consumo encontrado para o período selecionado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="historico-automatico" className="mt-6">
          <ConsumoDiarioHistorico />
        </TabsContent>
      </Tabs>
    </div>
  );
}