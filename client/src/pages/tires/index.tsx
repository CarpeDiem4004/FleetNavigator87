import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Truck,
  Package,
  CircleDollarSign,
  BarChart3,
  Search,
  Loader2,
  AlertCircle,
  CirclePlus,
  RefreshCw,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Tire {
  id: number;
  codigo: string;
  marca: string;
  modelo: string;
  medida: string;
  aro?: string;
  tipo?: string;
  veiculo_placa?: string;
  posicao?: string;
  km_atual?: number;
  status: string;
  profundidade_sulco?: number;
  localizacao?: string;
  created_at: string;
}

interface TireStatistics {
  total_pneus: number;
  disponiveis: number;
  em_uso: number;
  descartados: number;
  total_marcas: number;
  total_modelos: number;
  valor_total: number;
}

export default function TiresPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedTire, setSelectedTire] = useState<Tire | null>(null);
  const [isCreateTireDialogOpen, setIsCreateTireDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('all');

  // Buscar pneus
  const {
    data: tires = [],
    isLoading: isLoadingTires,
    isError: isErrorTires,
    refetch: refetchTires
  } = useQuery<Tire[]>({
    queryKey: ['/api/pneus/pneus'],
    refetchOnWindowFocus: false
  });

  // Buscar estatísticas
  const {
    data: statistics,
    isLoading: isLoadingStats,
    isError: isErrorStats,
    refetch: refetchStats
  } = useQuery<TireStatistics>({
    queryKey: ['/api/pneus/pneus-estatisticas'],
    refetchOnWindowFocus: false
  });

  // Filtrar pneus com base nos critérios
  const filteredTires = React.useMemo(() => {
    if (!tires || tires.length === 0) {
      return [];
    }

    return tires.filter(tire => {
      // Filtro de pesquisa
      const searchMatch = searchTerm === '' || 
        (tire.codigo && tire.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tire.marca && tire.marca.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tire.modelo && tire.modelo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tire.medida && tire.medida.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tire.veiculo_placa && tire.veiculo_placa.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filtro de marca
      const brandMatch = brandFilter === '' || tire.marca === brandFilter;
      
      // Filtro de status
      const statusMatch = statusFilter === '' || tire.status === statusFilter;
      
      // Filtro de tab
      let tabMatch = true;
      if (activeTab === 'in_use') {
        tabMatch = tire.status === 'em_uso';
      } else if (activeTab === 'available') {
        tabMatch = tire.status === 'disponivel';
      } else if (activeTab === 'discarded') {
        tabMatch = tire.status === 'descartado';
      }
      
      return searchMatch && brandMatch && statusMatch && tabMatch;
    });
  }, [tires, searchTerm, brandFilter, statusFilter, activeTab]);

  // Lista de marcas para o filtro
  const tiresBrands = React.useMemo(() => {
    if (!tires || tires.length === 0) {
      return [];
    }
    const brands = [...new Set(tires.map(tire => tire.marca))];
    return brands.sort();
  }, [tires]);

  // Função para criar tabela de pneus se não existir
  const initializeTiresTables = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('GET', '/api/pneus/criar-tabela-pneus');
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Sucesso',
          description: data.message,
        });
        
        // Recarregar dados
        refetchTires();
        refetchStats();
      } else {
        throw new Error('Erro na inicialização das tabelas');
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao inicializar as tabelas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para retornar a cor do badge com base no status
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'disponivel':
      case 'disponível':
        return 'success';
      case 'em_uso':
      case 'em uso':
        return 'default';
      case 'descartado':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Formatar o status para exibição
  const formatStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'disponivel':
      case 'disponível':
        return 'Disponível';
      case 'em_uso':
        return 'Em Uso';
      case 'descartado':
        return 'Descartado';
      default:
        return status;
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Truck className="mr-2 h-8 w-8" />
                Gestão de Pneus
              </h1>
              <p className="text-muted-foreground mt-1">
                Controle completo do ciclo de vida dos pneus da frota
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsCreateTireDialogOpen(true)}
              >
                <CirclePlus className="mr-2 h-4 w-4" />
                Novo Pneu
              </Button>
              
              <Button 
                variant="default" 
                onClick={initializeTiresTables}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Inicializar Tabelas
              </Button>
            </div>
          </div>
          
          {/* Mensagem de aviso quando a tabela não existe */}
          {(error || statsError) && (
            <Card className="border-red-500 bg-red-50 mb-4">
              <CardContent className="p-4">
                <div className="flex gap-2 items-center">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <h3 className="font-semibold text-red-700">Erro ao carregar dados de pneus</h3>
                    <p className="text-sm text-red-600">
                      Parece que as tabelas de pneus não foram inicializadas. Clique no botão verde "Inicializar Tabelas" 
                      acima para criar a estrutura necessária.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Cards de estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Pneus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {isLoadingStats ? (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : (
                      statistics?.total_pneus || 0
                    )}
                  </div>
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pneus Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {isLoadingStats ? (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : (
                      statistics?.disponiveis || 0
                    )}
                  </div>
                  <Badge 
                    variant="success" 
                    className="h-8 flex items-center justify-center"
                  >
                    Disponíveis
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pneus em Uso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {isLoadingStats ? (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : (
                      statistics?.em_uso || 0
                    )}
                  </div>
                  <Badge 
                    variant="default" 
                    className="h-8 flex items-center justify-center"
                  >
                    Em Uso
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Valor Total Estimado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {isLoadingStats ? (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : (
                      `R$ ${(statistics?.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    )}
                  </div>
                  <CircleDollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Tabs e tabela de pneus */}
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="available">Disponíveis</TabsTrigger>
                <TabsTrigger value="in_use">Em Uso</TabsTrigger>
                <TabsTrigger value="discarded">Descartados</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center space-x-2 flex-1 max-w-md">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Pesquisar pneus..." 
                  className="flex-1"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Marca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas Marcas</SelectItem>
                    {tiresBrands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos Status</SelectItem>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="em_uso">Em Uso</SelectItem>
                    <SelectItem value="descartado">Descartado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Card>
              <CardContent className="p-0">
                {isLoadingTires ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : isErrorTires ? (
                  <div className="flex flex-col items-center justify-center py-8 text-destructive">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <p>Erro ao carregar dados dos pneus</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => refetchTires()} 
                      className="mt-2"
                    >
                      Tentar Novamente
                    </Button>
                  </div>
                ) : (
                  <div className="relative overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Código</TableHead>
                          <TableHead>Marca</TableHead>
                          <TableHead>Modelo</TableHead>
                          <TableHead>Medida</TableHead>
                          <TableHead>Veículo</TableHead>
                          <TableHead>Localização</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTires.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                              <div className="flex flex-col items-center justify-center text-muted-foreground">
                                <Package className="h-8 w-8 mb-2" />
                                <p>Nenhum pneu encontrado</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTires.map((tire) => (
                            <TableRow key={tire.id} className="cursor-pointer hover:bg-secondary/20" onClick={() => setSelectedTire(tire)}>
                              <TableCell className="font-medium">{tire.codigo}</TableCell>
                              <TableCell>{tire.marca}</TableCell>
                              <TableCell>{tire.modelo}</TableCell>
                              <TableCell>{tire.medida}</TableCell>
                              <TableCell>{tire.veiculo_placa || '-'}</TableCell>
                              <TableCell>{tire.localizacao || '-'}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant={getStatusBadgeVariant(tire.status)}>
                                  {formatStatus(tire.status)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </div>
      
      {/* Dialog para visualizar detalhes do pneu */}
      <Dialog open={!!selectedTire} onOpenChange={(open) => !open && setSelectedTire(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Pneu</DialogTitle>
          </DialogHeader>
          <ScrollArea className="mt-4 max-h-[500px] pr-2">
            {selectedTire && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Código</p>
                    <p className="text-lg font-semibold">{selectedTire.codigo}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant={getStatusBadgeVariant(selectedTire.status)} className="mt-1">
                      {formatStatus(selectedTire.status)}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Marca</p>
                    <p>{selectedTire.marca}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Modelo</p>
                    <p>{selectedTire.modelo}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Medida</p>
                    <p>{selectedTire.medida}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Aro</p>
                    <p>{selectedTire.aro || '-'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Veículo</p>
                    <p>{selectedTire.veiculo_placa || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Posição</p>
                    <p>{selectedTire.posicao || '-'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Km Atual</p>
                    <p>{selectedTire.km_atual?.toLocaleString('pt-BR') || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Profundidade Sulco</p>
                    <p>{selectedTire.profundidade_sulco ? `${selectedTire.profundidade_sulco}mm` : '-'}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Localização</p>
                  <p>{selectedTire.localizacao || '-'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cadastrado em</p>
                  <p>{new Date(selectedTire.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setSelectedTire(null)}
            >
              Fechar
            </Button>
            {/* Aqui poderiam ser adicionados botões para outras ações como movimentar, editar, etc. */}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para adicionar novo pneu - será implementado posteriormente */}
    </AppLayout>
  );
}