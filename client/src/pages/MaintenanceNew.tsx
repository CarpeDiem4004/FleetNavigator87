import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, FileEdit, Trash2, Filter, X, Download, Upload, Eye, FileSpreadsheet, Clock, Package, CheckCircle, DollarSign } from 'lucide-react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Tipo para manutenção
interface Maintenance {
  id: number;
  vehiclePlate: string;
  type: 'preventiva' | 'corretiva';
  description: string;
  date: string;
  cost: number;
  status: 'concluida' | 'em_andamento' | 'aguardando_pecas' | 'motor' | 'turbina' | 'funilaria' | 'bomba' | 'bico';
  workshopName?: string; // Added workshop name field
  deadline?: string;      // Added deadline field
  valor?: number;          // Added valor field
}

// Dados mockados para a tabela de manutenções
const mockMaintenance: Maintenance[] = [
  {
    id: 1,
    vehiclePlate: 'ABC-1234',
    type: 'preventiva',
    description: 'Troca de óleo e filtros',
    date: '2025-04-10',
    cost: 850,
    status: 'concluida'
  },
  {
    id: 2,
    vehiclePlate: 'DEF-5678',
    type: 'corretiva',
    description: 'Reparo do sistema de freios',
    date: '2025-04-08',
    cost: 1250,
    status: 'em_andamento'
  },
  {
    id: 3,
    vehiclePlate: 'GHI-9012',
    type: 'corretiva',
    description: 'Substituição da embreagem',
    date: '2025-04-05',
    cost: 2100,
    status: 'aguardando_pecas'
  },
  {
    id: 4,
    vehiclePlate: 'ABC-1234',
    type: 'preventiva',
    description: 'Alinhamento e balanceamento',
    date: '2025-03-25',
    cost: 350,
    status: 'concluida'
  },
  {
    id: 5,
    vehiclePlate: 'MNO-7890',
    type: 'corretiva',
    description: 'Reparo do alternador',
    date: '2025-04-02',
    cost: 780,
    status: 'concluida'
  }
];

// Função para traduzir os tipos de manutenção
const translateMaintenanceType = (type: string): string => {
  const types: Record<string, string> = {
    preventiva: 'Preventiva',
    corretiva: 'Corretiva'
  };
  return types[type] || type;
};

// Função para traduzir os status de manutenção
const translateMaintenanceStatus = (status: string): string => {
  const statuses: Record<string, string> = {
    concluida: 'Concluída',
    em_andamento: 'Em Andamento',
    aguardando_pecas: 'Aguardando Peças',
    motor: 'Motor',
    turbina: 'Turbina',
    funilaria: 'Funilaria',
    bomba: 'Bomba',
    bico: 'Bico'
  };
  return statuses[status] || status;
};

// Função para obter a classe CSS para o badge de status
const getStatusBadgeClass = (status: string): string => {
  const classes: Record<string, string> = {
    concluida: 'bg-green-100 text-green-800',
    em_andamento: 'bg-yellow-100 text-yellow-800',
    aguardando_pecas: 'bg-red-100 text-red-800',
    motor: 'bg-blue-100 text-blue-800',
    turbina: 'bg-purple-100 text-purple-800',
    funilaria: 'bg-indigo-100 text-indigo-800',
    bomba: 'bg-teal-100 text-teal-800',
    bico: 'bg-pink-100 text-pink-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

// Função para formatar valores monetários
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Função para formatar datas
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

const MaintenanceNew: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [plateFilter, setPlateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMaintenance, setNewMaintenance] = useState<Partial<Maintenance>>({
    vehiclePlate: '',
    type: 'preventiva',
    description: '',
    date: new Date().toISOString().split('T')[0],
    cost: 0,
    status: 'em_andamento'
  });

  // Buscar dados reais da API de manutenção
  const { data: maintenanceData = [], isLoading, error } = useQuery({
    queryKey: ['/api/maintenance'],
    queryFn: async () => {
      const response = await fetch('/api/maintenance');
      if (!response.ok) {
        throw new Error('Erro ao carregar manutenções');
      }
      return response.json();
    }
  });

  // Filtrar manutenções com base nos filtros aplicados
  const filteredMaintenance = maintenanceData.filter((item: any) => {
    const matchesSearch = item.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlate = !plateFilter || item.vehiclePlate?.toLowerCase().includes(plateFilter.toLowerCase());
    const matchesStatus = !statusFilter || item.status === statusFilter;
    
    return matchesSearch && matchesPlate && matchesStatus;
  });

  // Obter lista única de placas para o filtro
  const uniquePlates = Array.from(new Set(maintenanceData.map((item: any) => item.vehiclePlate).filter(Boolean)));

  // Limpar todos os filtros
  const clearFilters = () => {
    setSearchTerm('');
    setPlateFilter('');
    setStatusFilter('');
  };

  // Adicionar nova manutenção
  const handleAddMaintenance = () => {
    if (newMaintenance.vehiclePlate && newMaintenance.description) {
      const item = {
        ...newMaintenance,
        id: maintenance.length + 1
      } as Maintenance;

      setMaintenance([...maintenance, item]);
      setIsAddDialogOpen(false);
      setNewMaintenance({
        vehiclePlate: '',
        type: 'preventiva',
        description: '',
        date: new Date().toISOString().split('T')[0],
        cost: 0,
        status: 'em_andamento'
      });
    }
  };

  return (
    <MainLayoutSimple>
      <div className="space-y-6 px-4 py-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Oficina Murici</h1>
            <p className="text-gray-500">
              Gerenciamento de manutenções da frota
            </p>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3">
            <Button className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar Excel
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Importar Excel
            </Button>
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              Nova Manutenção
            </Button>
          </div>
        </div>

        {/* Cards de estatísticas melhorados */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Total de Manutenções</div>
                  <div className="text-2xl font-bold">{maintenanceData.length}</div>
                </div>
                <FileEdit className="h-6 w-6 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Em Andamento</div>
                  <div className="text-2xl font-bold">
                    {maintenanceData.filter((item: any) => item.status === 'em_andamento').length}
                  </div>
                </div>
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Aguardando Peça</div>
                  <div className="text-2xl font-bold">
                    {maintenanceData.filter((item: any) => item.status === 'aguardando_peca').length}
                  </div>
                </div>
                <Package className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Finalizadas</div>
                  <div className="text-2xl font-bold">
                    {maintenanceData.filter((item: any) => item.status === 'concluida').length}
                  </div>
                </div>
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Valor Total</div>
                  <div className="text-lg font-bold text-red-600">
                    R$ {maintenanceData.reduce((total: number, m: any) => 
                      total + parseFloat(m.cost || m.custo || '0'), 0
                    ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <span className="text-lg font-bold text-red-600">R$</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Aguardando Peça</div>
                  <div className="text-2xl font-bold text-blue-500">
                    {maintenanceData.filter((item: any) => item.status === 'aguardando_pecas').length}
                  </div>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="h-4 w-4 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Finalizadas</div>
                  <div className="text-2xl font-bold text-green-600">
                    {maintenanceData.filter((item: any) => item.status === 'concluida').length}
                  </div>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="h-4 w-4 bg-green-600 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Valor Total</div>
                  <div className="text-lg font-bold text-red-600">
                    {formatCurrency(
                      maintenanceData.reduce((sum: number, item: any) => 
                        sum + parseFloat(item.cost || item.custo || 0), 0
                      )
                    )}
                  </div>
                </div>
                <div className="text-xs text-red-600 font-medium">R$</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botões de filtros rápidos */}
        <div className="flex flex-wrap gap-2">
          <Button 
            size="sm" 
            variant={statusFilter === '' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('')}
            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
          >
            Todas ({maintenanceData.length})
          </Button>
          <Button 
            size="sm" 
            variant={statusFilter === 'em_andamento' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('em_andamento')}
            className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
          >
            Em Andamento ({maintenanceData.filter((item: any) => item.status === 'em_andamento').length})
          </Button>
          <Button 
            size="sm" 
            variant={statusFilter === 'aguardando_peca' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('aguardando_peca')}
            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
          >
            Ag. Peça ({maintenanceData.filter((item: any) => item.status === 'aguardando_peca').length})
          </Button>
          <Button 
            size="sm" 
            variant={statusFilter === 'concluida' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('concluida')}
            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
          >
            Finalizadas ({maintenanceData.filter((item: any) => item.status === 'concluida').length})
          </Button>
        </div>

        {/* Sistema de busca */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por placa, mecânico..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>

              {/* Filtro por placa específica */}
              <Select value={plateFilter} onValueChange={setPlateFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por placa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as placas</SelectItem>
                  {uniquePlates.map((plate: string, index: number) => (
                    <SelectItem key={`${plate}-${index}`} value={plate}>
                      {plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Botão ver todas as manutenções */}
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => {
                  setSearchTerm('');
                  setPlateFilter('');
                  setStatusFilter('');
                }}
              >
                <Eye className="h-4 w-4" />
                Ver Todas
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados da busca */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Histórico de Manutenções</span>
              <span className="text-sm font-normal text-gray-500">
                {filteredMaintenance.length} de {maintenanceData.length} registros
              </span>
            </CardTitle>
            <CardDescription>
              {plateFilter ? 
                `Histórico de manutenções do veículo ${plateFilter}` : 
                'Histórico completo das manutenções realizadas'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Carregando manutenções...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <p className="text-red-500 mb-2">Erro ao carregar manutenções</p>
                  <p className="text-gray-500 text-sm">{error.message}</p>
                </div>
              </div>
            )}

            {!isLoading && !error && filteredMaintenance.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhuma manutenção encontrada</p>
                {(searchTerm || plateFilter || statusFilter) && (
                  <Button 
                    variant="link" 
                    onClick={clearFilters}
                    className="mt-2"
                  >
                    Limpar filtros para ver todas
                  </Button>
                )}
              </div>
            )}

            {!isLoading && !error && filteredMaintenance.length > 0 && (
              <Table>
                <TableCaption>Lista de manutenções registradas</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>KM</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mecânico</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaintenance.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.vehiclePlate || item.placa}</TableCell>
                      <TableCell>{item.km_atual || 0}</TableCell>
                      <TableCell>{item.description || item.descricao}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={item.status === 'concluida' ? 'default' : 
                                  item.status === 'em_andamento' ? 'secondary' : 'outline'}
                          className={getStatusBadgeClass(item.status)}
                        >
                          {translateMaintenanceStatus(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.responsavel || '-'}</TableCell>
                      <TableCell>
                        {item.data_agendada ? 
                          formatDate(item.data_agendada) : 
                          '-'
                        }
                      </TableCell>
                      <TableCell>
                        {item.data_solicitacao ? 
                          formatDate(item.data_solicitacao) : 
                          '-'
                        }
                      </TableCell>
                      <TableCell>
                        {item.cost || item.custo ? 
                          formatCurrency(parseFloat(item.cost || item.custo)) : 
                          '-'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          {/* Botão de visualizar sempre disponível */}
                          <Button variant="outline" size="icon" className="h-8 w-8">
                            <Eye className="h-3 w-3" />
                          </Button>
                          
                          {/* Botão de imprimir sempre disponível */}
                          <Button variant="outline" size="icon" className="h-8 w-8">
                            <FileSpreadsheet className="h-3 w-3" />
                          </Button>
                          
                          {/* Botão de editar apenas se não estiver finalizada */}
                          {item.status !== 'concluida' && (
                            <Button variant="outline" size="icon" className="h-8 w-8">
                              <FileEdit className="h-3 w-3" />
                            </Button>
                          )}
                          
                          {/* Botão de excluir apenas para admin */}
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            disabled={item.status === 'concluida'}
                          >
                            <Trash2 className="h-3 w-3" />
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
      </div>
    </MainLayoutSimple>
  );
};

export default MaintenanceNew;