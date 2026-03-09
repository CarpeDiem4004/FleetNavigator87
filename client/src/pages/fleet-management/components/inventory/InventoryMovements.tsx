import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-compat';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Eye, Download, Search, FilterX, ArrowUpDown, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Função auxiliar para formatação de moeda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Função para obter o tipo de movimentação
const getMovementTypeName = (type: string) => {
  const types: Record<string, string> = {
    'entrada': 'Entrada',
    'saida': 'Saída',
    'transferencia': 'Transferência',
    'ajuste': 'Ajuste',
    'descarte': 'Descarte'
  };
  
  return types[type] || type;
};

// Função para obter os estilos do badge baseado no tipo
const getMovementTypeStyle = (type: string) => {
  const styles: Record<string, string> = {
    'entrada': 'bg-green-100 text-green-800 border-green-300',
    'saida': 'bg-orange-100 text-orange-800 border-orange-300',
    'transferencia': 'bg-blue-100 text-blue-800 border-blue-300',
    'ajuste': 'bg-purple-100 text-purple-800 border-purple-300',
    'descarte': 'bg-red-100 text-red-800 border-red-300',
  };
  
  return styles[type] || 'bg-gray-100 text-gray-800 border-gray-300';
};

export default function InventoryMovements() {
  const { toast } = useToast();
  const [movements, setMovements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showNewMovementForm, setShowNewMovementForm] = useState(false);

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    setIsLoading(true);
    try {
      // Consulta principal para obter movimentações com joins
      const { data, error } = await supabase
        .from('inventory_movements')
        .select(`
          id, 
          item_id, 
          source_base_id,
          source_workshop_id,
          destination_base_id,
          destination_workshop_id,
          vehicle_plate,
          maintenance_id,
          quantity,
          movement_type,
          unit_cost,
          total_cost,
          requested_by,
          approved_by,
          document_number,
          reason_for_movement,
          notes,
          created_at,
          inventory_items(name, code, category, unit),
          veiculos!inventory_movements_vehicle_plate_fkey(model),
          users!inventory_movements_requested_by_fkey(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        setMovements(data);
      }
    } catch (error: any) {
      console.error('Erro ao buscar movimentações:', error);
      toast({
        title: "Erro ao carregar movimentações",
        description: error.message || "Não foi possível carregar as movimentações de estoque.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para ordenar as movimentações
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Inverter direção se clicar no mesmo campo
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Novo campo, começar com descendente para datas (mais recentes primeiro)
      setSortField(field);
      setSortDirection(field === 'created_at' ? 'desc' : 'asc');
    }
  };

  // Aplicar filtros e ordenação
  const filteredAndSortedMovements = [...movements]
    .filter(movement => {
      // Filtro de texto
      const itemName = movement.inventory_items?.name || '';
      const itemCode = movement.inventory_items?.code || '';
      const documentNumber = movement.document_number || '';
      const reasonForMovement = movement.reason_for_movement || '';
      
      const matchesSearch = searchQuery === '' || 
        itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reasonForMovement.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filtro de tipo de movimentação
      const matchesType = typeFilter === 'all' || movement.movement_type === typeFilter;
      
      // Filtro de data
      let matchesDateRange = true;
      if (dateRange.from) {
        const movementDate = new Date(movement.created_at);
        matchesDateRange = movementDate >= dateRange.from;
        
        if (dateRange.to) {
          // Se data final também foi selecionada
          const endOfDay = new Date(dateRange.to);
          endOfDay.setHours(23, 59, 59, 999);
          matchesDateRange = matchesDateRange && movementDate <= endOfDay;
        }
      }
      
      return matchesSearch && matchesType && matchesDateRange;
    })
    .sort((a, b) => {
      // Ordenação
      if (sortField === 'created_at') {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return sortDirection === 'asc' 
          ? dateA.getTime() - dateB.getTime() 
          : dateB.getTime() - dateA.getTime();
      } else if (sortField === 'quantity') {
        return sortDirection === 'asc' 
          ? a.quantity - b.quantity 
          : b.quantity - a.quantity;
      } else if (sortField === 'total_cost') {
        return sortDirection === 'asc' 
          ? a.total_cost - b.total_cost 
          : b.total_cost - a.total_cost;
      } else {
        // Ordenação de texto
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
          <CardTitle>Movimentações de Estoque</CardTitle>
          <CardDescription>
            Histórico de todas as movimentações de itens no sistema
          </CardDescription>
        </div>
        <Button onClick={() => setShowNewMovementForm(!showNewMovementForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Movimentação
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row items-center px-6 py-4 space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex items-center space-x-2 w-full md:w-auto md:flex-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar item, documento..." 
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
              value={typeFilter} 
              onValueChange={setTypeFilter}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Tipo de Movimentação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="ajuste">Ajuste</SelectItem>
                <SelectItem value="descarte">Descarte</SelectItem>
              </SelectContent>
            </Select>
            
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Selecionar período"
              className="w-full md:w-auto"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort('created_at')} className="cursor-pointer w-[140px]">
                <div className="flex items-center">
                  Data/Hora
                  {sortField === 'created_at' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead onClick={() => handleSort('quantity')} className="cursor-pointer text-right">
                <div className="flex items-center justify-end">
                  Qtd.
                  {sortField === 'quantity' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </TableHead>
              <TableHead>Origem/Destino</TableHead>
              <TableHead onClick={() => handleSort('total_cost')} className="cursor-pointer text-right">
                <div className="flex items-center justify-end">
                  Valor Total
                  {sortField === 'total_cost' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </TableHead>
              <TableHead>Solicitado Por</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="animate-pulse">
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  Carregando movimentações...
                </TableCell>
              </TableRow>
            ) : filteredAndSortedMovements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  {searchQuery || typeFilter !== 'all' || dateRange.from 
                    ? 'Nenhuma movimentação encontrada com os filtros aplicados.'
                    : 'Nenhuma movimentação de estoque registrada no sistema.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedMovements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{movement.inventory_items?.name || 'Item não encontrado'}</div>
                    <div className="text-xs text-gray-500">
                      <code>{movement.inventory_items?.code}</code>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={getMovementTypeStyle(movement.movement_type)}
                    >
                      {getMovementTypeName(movement.movement_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {movement.quantity} {movement.inventory_items?.unit}
                  </TableCell>
                  <TableCell>
                    {movement.movement_type === 'transferencia' ? (
                      <div className="text-sm">
                        <div>De: {/* Origem */}</div>
                        <div>→</div>
                        <div>Para: {/* Destino */}</div>
                      </div>
                    ) : (
                      <div className="text-sm">
                        {movement.vehicle_plate && (
                          <div>
                            Veículo: {movement.vehicle_plate}
                            {movement.veiculos?.model && ` (${movement.veiculos.model})`}
                          </div>
                        )}
                        {movement.document_number && (
                          <div>Doc: {movement.document_number}</div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(movement.total_cost)}
                  </TableCell>
                  <TableCell>
                    {movement.users?.name || `ID: ${movement.requested_by}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center space-x-1">
                      <Button variant="ghost" size="icon" title="Ver detalhes">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Baixar comprovante">
                        <Download className="h-4 w-4" />
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