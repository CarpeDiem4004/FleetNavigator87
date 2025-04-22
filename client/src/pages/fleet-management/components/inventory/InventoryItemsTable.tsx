import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
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
import { Eye, Edit, Trash2, Search, FilterX, ArrowUpDown } from 'lucide-react';
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

export default function InventoryItemsTable() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      if (data) {
        setItems(data);
      }
    } catch (error: any) {
      console.error('Erro ao buscar itens:', error);
      toast({
        title: "Erro ao carregar itens",
        description: error.message || "Não foi possível carregar os itens de estoque.",
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

  // Aplicar filtros e ordenação
  const filteredAndSortedItems = [...items]
    .filter(item => {
      // Filtro de texto
      const matchesSearch = searchQuery === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Filtro de categoria
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Ordenação
      if (sortField === 'unit_cost') {
        return sortDirection === 'asc' 
          ? a.unit_cost - b.unit_cost 
          : b.unit_cost - a.unit_cost;
      } else if (sortField === 'minimum_stock') {
        return sortDirection === 'asc' 
          ? a.minimum_stock - b.minimum_stock 
          : b.minimum_stock - a.minimum_stock;
      } else {
        // Ordenação de texto (name, code, category)
        const aValue = a[sortField] || '';
        const bValue = b[sortField] || '';
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
    });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
        <div>
          <CardTitle>Itens Cadastrados</CardTitle>
          <CardDescription>
            Todos os itens disponíveis no sistema
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex items-center px-6 py-4 space-x-4">
          <div className="flex items-center space-x-2 flex-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar por nome, código ou descrição..." 
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
          <Select 
            value={categoryFilter} 
            onValueChange={setCategoryFilter}
          >
            <SelectTrigger className="w-[180px]">
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
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort('name')} className="cursor-pointer">
                <div className="flex items-center">
                  Nome
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
              <TableHead onClick={() => handleSort('category')} className="cursor-pointer">
                <div className="flex items-center">
                  Categoria
                  {sortField === 'category' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead onClick={() => handleSort('minimum_stock')} className="cursor-pointer text-right">
                <div className="flex items-center justify-end">
                  Estoque Mínimo
                  {sortField === 'minimum_stock' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('unit_cost')} className="cursor-pointer text-right">
                <div className="flex items-center justify-end">
                  Custo Unitário
                  {sortField === 'unit_cost' && (
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
                  Carregando itens...
                </TableCell>
              </TableRow>
            ) : filteredAndSortedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  {searchQuery || categoryFilter !== 'all' 
                    ? 'Nenhum item encontrado com os filtros aplicados.'
                    : 'Nenhum item cadastrado no sistema.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <code className="px-1 py-0.5 bg-muted rounded text-sm">{item.code}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getCategoryName(item.category)}</Badge>
                  </TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right">{item.minimum_stock}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unit_cost)}</TableCell>
                  <TableCell>
                    <div className="flex justify-center space-x-1">
                      <Button variant="ghost" size="icon" title="Ver detalhes">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Editar item">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-600"
                        title="Excluir item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}