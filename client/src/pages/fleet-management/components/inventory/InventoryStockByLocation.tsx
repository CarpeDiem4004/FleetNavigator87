import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-compat';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Eye, Search, FilterX, ArrowUpDown, Truck, Wrench, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Função auxiliar para formatação de moeda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Função para mapear categoria enum para nome legível
const getCategoryName = (category: string) => {
  const categoryMap: Record<string, string> = {
    'motor': 'Motor',
    'freios': 'Freios',
    'suspensao': 'Suspensão',
    'transmissao': 'Transmissão',
    'eletrica': 'Elétrica',
    'carroceria': 'Carroceria',
    'pneus': 'Pneus e Rodas',
    'lubrificantes': 'Lubrificantes',
    'filtros': 'Filtros',
    'acessorios': 'Acessórios',
    'ferramentas': 'Ferramentas',
    'outros': 'Outros'
  };
  
  return categoryMap[category] || category;
};

interface StockLocation {
  id: number;
  name: string;
  type: 'base' | 'workshop';
}

export default function InventoryStockByLocation() {
  const { toast } = useToast();
  const [stocks, setStocks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [activeTab, setActiveTab] = useState('bases');
  
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [bases, setBases] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);

  useEffect(() => {
    fetchLocations();
    fetchStocks();
  }, []);

  const fetchLocations = async () => {
    try {
      // Buscar bases
      const { data: basesData, error: basesError } = await supabase
        .from('bases')
        .select('id, name')
        .order('name');
      
      if (basesError) throw basesError;
      
      // Buscar oficinas
      const { data: workshopsData, error: workshopsError } = await supabase
        .from('oficinas')
        .select('id, name')
        .order('name');
      
      if (workshopsError) throw workshopsError;
      
      if (basesData) {
        setBases(basesData);
        const baseLocations = basesData.map(base => ({
          id: base.id,
          name: base.name,
          type: 'base' as const
        }));
        
        setLocations([...baseLocations]);
      }
      
      if (workshopsData) {
        setWorkshops(workshopsData);
        const workshopLocations = workshopsData.map(workshop => ({
          id: workshop.id,
          name: workshop.name,
          type: 'workshop' as const
        }));
        
        setLocations(prevLocations => [...prevLocations, ...workshopLocations]);
      }
    } catch (error: any) {
      console.error('Erro ao buscar localizações:', error);
      toast({
        title: "Erro ao carregar localizações",
        description: error.message || "Não foi possível carregar as bases e oficinas.",
        variant: "destructive",
      });
    }
  };

  const fetchStocks = async () => {
    setIsLoading(true);
    try {
      // Consulta principal para obter estoques com joins
      const { data, error } = await supabase
        .from('inventory_stock')
        .select(`
          id, 
          item_id,
          base_id,
          workshop_id,
          quantity,
          location,
          last_updated,
          notes,
          inventory_items(id, name, code, category, unit, unit_cost),
          bases(name),
          oficinas(name)
        `)
        .order('id');
      
      if (error) throw error;
      
      if (data) {
        setStocks(data);
      }
    } catch (error: any) {
      console.error('Erro ao buscar estoques:', error);
      toast({
        title: "Erro ao carregar estoques",
        description: error.message || "Não foi possível carregar os dados de estoque.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para ordenar os itens
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Inverter direção se clicar no mesmo campo
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Novo campo, começar com ascendente
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtrar estoques por base ou oficina
  const getFilteredStocks = () => {
    return stocks.filter(stock => {
      if (activeTab === 'bases' && !stock.base_id) return false;
      if (activeTab === 'workshops' && !stock.workshop_id) return false;
      return true;
    });
  };

  // Aplicar filtros e ordenação
  const filteredAndSortedStocks = getFilteredStocks()
    .filter(stock => {
      // Filtro de texto
      const itemName = stock.inventory_items?.name || '';
      const itemCode = stock.inventory_items?.code || '';
      const location = stock.location || '';
      
      const matchesSearch = searchQuery === '' || 
        itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filtro de categoria
      const matchesCategory = categoryFilter === 'all' || stock.inventory_items?.category === categoryFilter;
      
      // Filtro de localização
      let matchesLocation = true;
      if (locationFilter !== 'all') {
        if (activeTab === 'bases') {
          matchesLocation = stock.base_id === parseInt(locationFilter);
        } else {
          matchesLocation = stock.workshop_id === parseInt(locationFilter);
        }
      }
      
      return matchesSearch && matchesCategory && matchesLocation;
    })
    .sort((a, b) => {
      // Ordenação
      if (sortField === 'quantity') {
        return sortDirection === 'asc' 
          ? a.quantity - b.quantity 
          : b.quantity - a.quantity;
      } else if (sortField === 'value') {
        const valueA = a.quantity * (a.inventory_items?.unit_cost || 0);
        const valueB = b.quantity * (b.inventory_items?.unit_cost || 0);
        return sortDirection === 'asc' 
          ? valueA - valueB 
          : valueB - valueA;
      } else if (sortField === 'name' || sortField === 'code' || sortField === 'category') {
        const aValue = a.inventory_items?.[sortField] || '';
        const bValue = b.inventory_items?.[sortField] || '';
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      } else {
        // Ordenação de texto (outras colunas)
        const aValue = a[sortField]?.toString() || '';
        const bValue = b[sortField]?.toString() || '';
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
    });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
        <div>
          <CardTitle>Estoque por Localização</CardTitle>
          <CardDescription>
            Visualização de estoque dividido por bases e oficinas
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="bases" value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bases">
                <Truck className="h-4 w-4 mr-2" />
                Bases
              </TabsTrigger>
              <TabsTrigger value="workshops">
                <Wrench className="h-4 w-4 mr-2" />
                Oficinas
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex flex-col md:flex-row items-center px-6 py-4 space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex items-center space-x-2 w-full md:w-auto md:flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Pesquisar por item ou localização..." 
                className="flex-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSearchQuery('')}
                >
                  <FilterX className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 w-full md:w-auto">
              <Select 
                value={categoryFilter} 
                onValueChange={setCategoryFilter}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  <SelectItem value="motor">Motor</SelectItem>
                  <SelectItem value="freios">Freios</SelectItem>
                  <SelectItem value="suspensao">Suspensão</SelectItem>
                  <SelectItem value="transmissao">Transmissão</SelectItem>
                  <SelectItem value="eletrica">Elétrica</SelectItem>
                  <SelectItem value="carroceria">Carroceria</SelectItem>
                  <SelectItem value="pneus">Pneus e Rodas</SelectItem>
                  <SelectItem value="lubrificantes">Lubrificantes</SelectItem>
                  <SelectItem value="filtros">Filtros</SelectItem>
                  <SelectItem value="acessorios">Acessórios</SelectItem>
                  <SelectItem value="ferramentas">Ferramentas</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={locationFilter} 
                onValueChange={setLocationFilter}
              >
                <SelectTrigger className="w-full md:w-[220px]">
                  <SelectValue placeholder="Local" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Locais</SelectItem>
                  {activeTab === 'bases' 
                    ? bases.map(base => (
                        <SelectItem key={base.id} value={base.id.toString()}>
                          {base.name}
                        </SelectItem>
                      ))
                    : workshops.map(workshop => (
                        <SelectItem key={workshop.id} value={workshop.id.toString()}>
                          {workshop.name}
                        </SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="bases" className="m-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort('name')} className="cursor-pointer">
                    <div className="flex items-center">
                      Nome do Item
                      {sortField === 'name' && (
                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('code')} className="cursor-pointer">
                    <div className="flex items-center">
                      Código
                      {sortField === 'code' && (
                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead onClick={() => handleSort('quantity')} className="cursor-pointer text-right">
                    <div className="flex items-center justify-end">
                      Quantidade
                      {sortField === 'quantity' && (
                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('value')} className="cursor-pointer text-right">
                    <div className="flex items-center justify-end">
                      Valor Total
                      {sortField === 'value' && (
                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow className="animate-pulse">
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      Carregando dados de estoque...
                    </TableCell>
                  </TableRow>
                ) : filteredAndSortedStocks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      {searchQuery || categoryFilter !== 'all' || locationFilter !== 'all'
                        ? 'Nenhum item encontrado com os filtros aplicados.'
                        : 'Nenhum item em estoque nas bases.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedStocks.map((stock) => (
                    <TableRow key={stock.id}>
                      <TableCell className="font-medium">
                        {stock.inventory_items?.name || 'Item não encontrado'}
                      </TableCell>
                      <TableCell>
                        <code className="px-1 py-0.5 bg-muted rounded text-sm">
                          {stock.inventory_items?.code}
                        </code>
                      </TableCell>
                      <TableCell>{stock.bases?.name || '-'}</TableCell>
                      <TableCell>{stock.location || '-'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {stock.quantity} {stock.inventory_items?.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(stock.quantity * (stock.inventory_items?.unit_cost || 0))}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center space-x-1">
                          <Button variant="ghost" size="icon" title="Ver histórico">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-green-600 hover:text-green-700"
                            title="Adicionar ao estoque"
                          >
                            <ArrowUpCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-orange-500 hover:text-orange-600"
                            title="Baixar do estoque"
                          >
                            <ArrowDownCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="workshops" className="m-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort('name')} className="cursor-pointer">
                    <div className="flex items-center">
                      Nome do Item
                      {sortField === 'name' && (
                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('code')} className="cursor-pointer">
                    <div className="flex items-center">
                      Código
                      {sortField === 'code' && (
                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Oficina</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead onClick={() => handleSort('quantity')} className="cursor-pointer text-right">
                    <div className="flex items-center justify-end">
                      Quantidade
                      {sortField === 'quantity' && (
                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('value')} className="cursor-pointer text-right">
                    <div className="flex items-center justify-end">
                      Valor Total
                      {sortField === 'value' && (
                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow className="animate-pulse">
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      Carregando dados de estoque...
                    </TableCell>
                  </TableRow>
                ) : filteredAndSortedStocks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      {searchQuery || categoryFilter !== 'all' || locationFilter !== 'all'
                        ? 'Nenhum item encontrado com os filtros aplicados.'
                        : 'Nenhum item em estoque nas oficinas.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedStocks.map((stock) => (
                    <TableRow key={stock.id}>
                      <TableCell className="font-medium">
                        {stock.inventory_items?.name || 'Item não encontrado'}
                      </TableCell>
                      <TableCell>
                        <code className="px-1 py-0.5 bg-muted rounded text-sm">
                          {stock.inventory_items?.code}
                        </code>
                      </TableCell>
                      <TableCell>{stock.oficinas?.name || '-'}</TableCell>
                      <TableCell>{stock.location || '-'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {stock.quantity} {stock.inventory_items?.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(stock.quantity * (stock.inventory_items?.unit_cost || 0))}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center space-x-1">
                          <Button variant="ghost" size="icon" title="Ver histórico">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-green-600 hover:text-green-700"
                            title="Adicionar ao estoque"
                          >
                            <ArrowUpCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-orange-500 hover:text-orange-600"
                            title="Baixar do estoque"
                          >
                            <ArrowDownCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}