import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Fuel, Plus, Search, Eye, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FuelReceipt {
  id: number;
  tipo_produto: string;
  litros_recebidos: number;
  valor_litro?: number;
  valor_total: number;
  nome_fornecedor: string;
  nome_operador: string;
  numero_nota_fiscal?: string;
  data_recebimento: string;
  observacoes?: string;
  status: string;
  posto_origem: string;
  tanque_numero?: number;
  densidade?: number;
  temperatura?: number;
  created_at: string;
  updated_at: string;
}

interface FuelReceiptStats {
  total_recebimentos: number;
  total_litros: number;
  total_valor: number;
  ultimo_recebimento: string;
  produtos_tipos: string[];
}

const stations = [
  { id: 'abc', name: 'ABC V2', value: 'abc' },
  { id: 'campinas', name: 'Campinas V2', value: 'campinas' },
  { id: 'guarulhos', name: 'Guarulhos V2', value: 'guarulhos' },
  { id: 'osasco', name: 'Osasco V2', value: 'osasco' },
  { id: 'socorro', name: 'Socorro V2', value: 'socorro' },
  { id: 'sorocaba', name: 'Sorocaba V2', value: 'sorocaba' },
  { id: 'alair', name: 'Alair V2', value: 'alair' }
];

const fuelTypes = [
  'Gasolina Comum',
  'Gasolina Aditivada',
  'Etanol',
  'Diesel S10',
  'Diesel S500',
  'GNV'
];

export default function FuelReceiptsPage() {
  const [receipts, setReceipts] = useState<FuelReceipt[]>([]);
  const [stats, setStats] = useState<FuelReceiptStats | null>(null);
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('consolidated');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStation, setFilterStation] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    tipo_produto: '',
    litros_recebidos: '',
    valor_litro: '',
    valor_total: '',
    nome_fornecedor: '',
    nome_operador: '',
    numero_nota_fiscal: '',
    observacoes: '',
    tanque_numero: '',
    densidade: '',
    temperatura: ''
  });

  const fetchConsolidatedReceipts = async () => {
    setLoading(true);
    try {
      const url = filterStation 
        ? `/api/fuel-receipts/consolidated?station=${filterStation}&limit=100`
        : '/api/fuel-receipts/consolidated?limit=100';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.data) {
        setReceipts(data.data);
      }
    } catch (error) {
      console.error('Error fetching consolidated receipts:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar recebimentos consolidados',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStationReceipts = async (station: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/fuel-receipts/station/${station}?limit=100`);
      const data = await response.json();
      
      if (data.data) {
        setReceipts(data.data);
      }
    } catch (error) {
      console.error('Error fetching station receipts:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar recebimentos do posto',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/fuel-receipts/stats/overall');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStation) {
      toast({
        title: 'Erro',
        description: 'Selecione um posto para registrar o recebimento',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch(`/api/fuel-receipts/station/${selectedStation}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Recebimento registrado com sucesso',
        });
        
        setShowAddDialog(false);
        setFormData({
          tipo_produto: '',
          litros_recebidos: '',
          valor_litro: '',
          valor_total: '',
          nome_fornecedor: '',
          nome_operador: '',
          numero_nota_fiscal: '',
          observacoes: '',
          tanque_numero: '',
          densidade: '',
          temperatura: ''
        });
        
        // Refresh data
        if (activeTab === 'consolidated') {
          fetchConsolidatedReceipts();
        } else {
          fetchStationReceipts(activeTab);
        }
        fetchStats();
      } else {
        throw new Error(result.error || 'Erro ao registrar recebimento');
      }
    } catch (error: any) {
      console.error('Error submitting receipt:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao registrar recebimento',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: number, station: string) => {
    if (!confirm('Tem certeza que deseja excluir este recebimento?')) {
      return;
    }

    try {
      const response = await fetch(`/api/fuel-receipts/station/${station}/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Recebimento excluído com sucesso',
        });
        
        // Refresh data
        if (activeTab === 'consolidated') {
          fetchConsolidatedReceipts();
        } else {
          fetchStationReceipts(activeTab);
        }
        fetchStats();
      } else {
        throw new Error(result.error || 'Erro ao excluir recebimento');
      }
    } catch (error: any) {
      console.error('Error deleting receipt:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir recebimento',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchStats();
    fetchConsolidatedReceipts();
  }, []);

  useEffect(() => {
    if (activeTab === 'consolidated') {
      fetchConsolidatedReceipts();
    } else {
      fetchStationReceipts(activeTab);
    }
  }, [activeTab, filterStation]);

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = searchTerm === '' || 
      receipt.nome_fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.nome_operador.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.tipo_produto.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtrar por data de início
    const matchesStartDate = dateStart === '' || 
      new Date(receipt.data_recebimento) >= new Date(dateStart + 'T00:00:00');
    
    // Filtrar por data de fim
    const matchesEndDate = dateEnd === '' || 
      new Date(receipt.data_recebimento) <= new Date(dateEnd + 'T23:59:59');
    
    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatLiters = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value) + ' L';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sistema de Recebimento de Combustível</h1>
          <p className="text-muted-foreground">Gestão completa de recebimentos dos postos</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Recebimento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Novo Recebimento</DialogTitle>
              <DialogDescription>
                Preencha os dados do recebimento de combustível
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="station">Posto *</Label>
                  <Select value={selectedStation} onValueChange={setSelectedStation} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o posto" />
                    </SelectTrigger>
                    <SelectContent>
                      {stations.map((station) => (
                        <SelectItem key={station.id} value={station.value}>
                          {station.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tipo_produto">Tipo de Produto *</Label>
                  <Select value={formData.tipo_produto} onValueChange={(value) => setFormData({...formData, tipo_produto: value})} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o combustível" />
                    </SelectTrigger>
                    <SelectContent>
                      {fuelTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="litros_recebidos">Litros Recebidos *</Label>
                  <Input
                    id="litros_recebidos"
                    type="number"
                    step="0.01"
                    value={formData.litros_recebidos}
                    onChange={(e) => setFormData({...formData, litros_recebidos: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="valor_litro">Valor por Litro</Label>
                  <Input
                    id="valor_litro"
                    type="number"
                    step="0.001"
                    value={formData.valor_litro}
                    onChange={(e) => setFormData({...formData, valor_litro: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="valor_total">Valor Total *</Label>
                  <Input
                    id="valor_total"
                    type="number"
                    step="0.01"
                    value={formData.valor_total}
                    onChange={(e) => setFormData({...formData, valor_total: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome_fornecedor">Nome do Fornecedor *</Label>
                  <Input
                    id="nome_fornecedor"
                    value={formData.nome_fornecedor}
                    onChange={(e) => setFormData({...formData, nome_fornecedor: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nome_operador">Nome do Operador *</Label>
                  <Input
                    id="nome_operador"
                    value={formData.nome_operador}
                    onChange={(e) => setFormData({...formData, nome_operador: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero_nota_fiscal">Número da NF</Label>
                  <Input
                    id="numero_nota_fiscal"
                    value={formData.numero_nota_fiscal}
                    onChange={(e) => setFormData({...formData, numero_nota_fiscal: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tanque_numero">Número do Tanque</Label>
                  <Input
                    id="tanque_numero"
                    type="number"
                    value={formData.tanque_numero}
                    onChange={(e) => setFormData({...formData, tanque_numero: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="densidade">Densidade</Label>
                  <Input
                    id="densidade"
                    type="number"
                    step="0.0001"
                    value={formData.densidade}
                    onChange={(e) => setFormData({...formData, densidade: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="temperatura">Temperatura (°C)</Label>
                  <Input
                    id="temperatura"
                    type="number"
                    step="0.1"
                    value={formData.temperatura}
                    onChange={(e) => setFormData({...formData, temperatura: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Registrar Recebimento
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Recebimentos</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_recebimentos}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Litros</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatLiters(Number(stats.total_litros))}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(Number(stats.total_valor))}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Último Recebimento</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {stats.ultimo_recebimento 
                  ? format(new Date(stats.ultimo_recebimento), 'dd/MM/yyyy', { locale: ptBR })
                  : 'Nenhum'
                }
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por fornecedor, operador ou produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="dateStart">Data Inicial</Label>
              <Input
                id="dateStart"
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="dateEnd">Data Final</Label>
              <Input
                id="dateEnd"
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
              />
            </div>
            
            {activeTab === 'consolidated' && (
              <div>
                <Label htmlFor="filterStation">Filtrar por Posto</Label>
                <Select value={filterStation} onValueChange={setFilterStation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os postos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os postos</SelectItem>
                    {stations.map((station) => (
                      <SelectItem key={station.id} value={station.value.toUpperCase() + '_V2'}>
                        {station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          {(searchTerm || dateStart || dateEnd || filterStation) && (
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {filteredReceipts.length} registros encontrados
                {(dateStart || dateEnd) && (
                  <span> • Filtrado por data: {dateStart || '...'} a {dateEnd || '...'}</span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setDateStart('');
                  setDateEnd('');
                  setFilterStation('');
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Tables */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="consolidated">Consolidado</TabsTrigger>
          {stations.map((station) => (
            <TabsTrigger key={station.id} value={station.value}>
              {station.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'consolidated' 
                  ? 'Recebimentos Consolidados' 
                  : `Recebimentos - ${stations.find(s => s.value === activeTab)?.name}`
                }
              </CardTitle>
              <CardDescription>
                Total de {filteredReceipts.length} recebimentos encontrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Posto</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Litros</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Operador</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReceipts.map((receipt, index) => (
                      <TableRow key={`${receipt.posto_origem}-${receipt.id}-${index}`}>
                        <TableCell>
                          {format(new Date(receipt.data_recebimento), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{receipt.posto_origem}</Badge>
                        </TableCell>
                        <TableCell>{receipt.tipo_produto}</TableCell>
                        <TableCell>{formatLiters(receipt.litros_recebidos)}</TableCell>
                        <TableCell>{formatCurrency(receipt.valor_total)}</TableCell>
                        <TableCell>{receipt.nome_fornecedor}</TableCell>
                        <TableCell>{receipt.nome_operador}</TableCell>
                        <TableCell>
                          <Badge variant={receipt.status === 'ativo' ? 'default' : 'secondary'}>
                            {receipt.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleDelete(receipt.id, receipt.posto_origem.toLowerCase().replace('_v2', ''))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}