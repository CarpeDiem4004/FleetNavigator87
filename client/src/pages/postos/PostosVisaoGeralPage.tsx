import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { AlertTriangle, ArrowDown, ArrowUp, Filter, ChevronRight, Droplet, Fuel, Info } from 'lucide-react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

// Interfaces para os tipos de dados
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

// Função para formatação de números
const formatarNumero = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR').format(Math.round(valor));
};

// Função para formatação de percentual
const formatarPercentual = (valor: number): string => {
  return valor.toFixed(1).replace('.', ',') + '%';
};

export default function PostosVisaoGeralPage() {
  const [, setLocation] = useLocation();
  const [ordenarPor, setOrdenarPor] = useState<string>('nome');
  const [direcao, setDirecao] = useState<'asc' | 'desc'>('asc');
  const [somenteComAlerta, setSomenteComAlerta] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Buscar dados dos postos
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/postos', ordenarPor, direcao, somenteComAlerta],
    queryFn: async () => {
      const res = await fetch(`/api/postos?ordenarPor=${ordenarPor}&direcao=${direcao}&somenteComAlerta=${somenteComAlerta}`);
      if (!res.ok) {
        throw new Error('Erro ao buscar dados dos postos');
      }
      const data = await res.json();
      return data.data as PostoResumo[];
    }
  });

  // Buscar novamente quando as opções de ordenação ou filtro mudarem
  useEffect(() => {
    refetch();
  }, [ordenarPor, direcao, somenteComAlerta, refetch]);

  // Determinar a classe de cor com base no nível de alerta
  const getAlertColorClass = (posto: PostoResumo): string => {
    if (posto.alerta_nivel_baixo) {
      return 'bg-red-50 border-red-300';
    }
    if (posto.percentual < 30) {
      return 'bg-amber-50 border-amber-300';
    }
    return 'bg-white border-gray-200';
  };

  // Determinar a classe de cor para o indicador de nível
  const getNivelColorClass = (percentual: number): string => {
    if (percentual < 15) {
      return 'text-red-600';
    }
    if (percentual < 30) {
      return 'text-amber-500';
    }
    return 'text-green-600';
  };

  // Função para lidar com a mudança na ordenação
  const handleSortChange = (coluna: string) => {
    if (ordenarPor === coluna) {
      setDirecao(direcao === 'asc' ? 'desc' : 'asc');
    } else {
      setOrdenarPor(coluna);
      setDirecao('asc');
    }
  };

  // Ícone de ordenação
  const SortIcon = ({ coluna }: { coluna: string }) => {
    if (ordenarPor !== coluna) return null;
    return direcao === 'asc' ? <ArrowUp className="inline-block ml-1 h-4 w-4" /> : <ArrowDown className="inline-block ml-1 h-4 w-4" />;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-wrap justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Visão Geral dos Postos de Abastecimento</h1>
          
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <div className="flex items-center space-x-2">
              <Switch 
                id="alerta-switch" 
                checked={somenteComAlerta} 
                onCheckedChange={setSomenteComAlerta}
              />
              <Label htmlFor="alerta-switch" className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                Somente com alerta
              </Label>
            </div>
            
            <div>
              <Select value={ordenarPor} onValueChange={setOrdenarPor}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nome">Nome</SelectItem>
                  <SelectItem value="volume_atual">Volume Atual</SelectItem>
                  <SelectItem value="percentual">Percentual</SelectItem>
                  <SelectItem value="total_litros">Total Abastecido</SelectItem>
                  <SelectItem value="total_abastecimentos">Nº Abastecimentos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDirecao(direcao === 'asc' ? 'desc' : 'asc')}
              className="flex items-center"
            >
              {direcao === 'asc' ? (
                <>
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Crescente
                </>
              ) : (
                <>
                  <ArrowDown className="h-4 w-4 mr-2" />
                  Decrescente
                </>
              )}
            </Button>
            
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'cards' | 'table')} className="w-auto">
              <TabsList className="grid w-36 grid-cols-2">
                <TabsTrigger value="cards">Cards</TabsTrigger>
                <TabsTrigger value="table">Tabela</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-500">Carregando postos...</p>
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-red-500">
            <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
            <p>Erro ao carregar dados dos postos. Por favor, tente novamente.</p>
            <Button onClick={() => refetch()} className="mt-4">
              Tentar novamente
            </Button>
          </div>
        ) : (
          <>
            {data && data.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Filter className="h-10 w-10 mx-auto mb-2" />
                <p>Nenhum posto encontrado com os filtros atuais.</p>
              </div>
            ) : (
              <>
                {viewMode === 'cards' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data?.map((posto) => (
                      <Card 
                        key={posto.id} 
                        className={`transition-all hover:shadow-lg cursor-pointer ${getAlertColorClass(posto)}`}
                        onClick={() => setLocation(`/postos/${posto.id}`)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div>
                              <CardTitle className="flex items-center">
                                {posto.nome}
                                {posto.alerta_nivel_baixo && (
                                  <AlertTriangle className="ml-2 h-5 w-5 text-red-500" />
                                )}
                              </CardTitle>
                              <CardDescription>{posto.localizacao}</CardDescription>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg font-bold ${getNivelColorClass(posto.percentual)}`}>
                                {formatarPercentual(posto.percentual)}
                              </div>
                              <CardDescription>Capacidade</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-4">
                            <div 
                              className={`absolute h-full ${posto.percentual < 15 ? 'bg-red-500' : 
                                posto.percentual < 30 ? 'bg-amber-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(100, posto.percentual)}%` }}
                            ></div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-gray-500">Volume Atual:</div>
                              <div className="font-medium">{formatarNumero(posto.volume_atual)} L</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Capacidade Total:</div>
                              <div className="font-medium">{formatarNumero(posto.capacidade_total)} L</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Total Abastecimentos:</div>
                              <div className="font-medium">{formatarNumero(posto.total_abastecimentos)}</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Total Litros:</div>
                              <div className="font-medium">{formatarNumero(posto.total_litros)} L</div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="border-t pt-4 flex justify-between text-xs text-gray-500">
                          <div className="flex items-center">
                            <Info className="h-3 w-3 mr-1" />
                            Atualizado em: {format(new Date(posto.ultima_atualizacao), 'dd/MM/yyyy HH:mm')}
                          </div>
                          <div className="flex items-center text-blue-600">
                            Ver detalhes <ChevronRight className="h-4 w-4 ml-1" />
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="cursor-pointer" onClick={() => handleSortChange('nome')}>
                            Nome <SortIcon coluna="nome" />
                          </TableHead>
                          <TableHead>Localização</TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSortChange('volume_atual')}>
                            Volume Atual <SortIcon coluna="volume_atual" />
                          </TableHead>
                          <TableHead>Capacidade Total</TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSortChange('percentual')}>
                            Percentual <SortIcon coluna="percentual" />
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSortChange('total_abastecimentos')}>
                            Total Abastecimentos <SortIcon coluna="total_abastecimentos" />
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSortChange('total_litros')}>
                            Total Litros <SortIcon coluna="total_litros" />
                          </TableHead>
                          <TableHead>Alerta</TableHead>
                          <TableHead>Última Atualização</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.map((posto) => (
                          <TableRow 
                            key={posto.id} 
                            className={posto.alerta_nivel_baixo ? 'bg-red-50' : ''}
                          >
                            <TableCell className="font-medium">{posto.nome}</TableCell>
                            <TableCell>{posto.localizacao}</TableCell>
                            <TableCell>{formatarNumero(posto.volume_atual)} L</TableCell>
                            <TableCell>{formatarNumero(posto.capacidade_total)} L</TableCell>
                            <TableCell>
                              <span className={getNivelColorClass(posto.percentual)}>
                                {formatarPercentual(posto.percentual)}
                              </span>
                            </TableCell>
                            <TableCell>{formatarNumero(posto.total_abastecimentos)}</TableCell>
                            <TableCell>{formatarNumero(posto.total_litros)} L</TableCell>
                            <TableCell>
                              {posto.alerta_nivel_baixo && (
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                              )}
                            </TableCell>
                            <TableCell>{format(new Date(posto.ultima_atualizacao), 'dd/MM/yyyy HH:mm')}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setLocation(`/postos/${posto.id}`)}
                              >
                                Detalhes
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}