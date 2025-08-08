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
import { Search, Plus, FileEdit, Trash2, Filter, X } from 'lucide-react';
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

          {/* Estatísticas rápidas */}
          <div className="flex gap-4">
            <Card className="p-4 min-w-[120px]">
              <CardContent className="p-0">
                <div className="text-2xl font-bold text-blue-600">{maintenanceData.length}</div>
                <div className="text-sm text-gray-500">Total</div>
              </CardContent>
            </Card>
            <Card className="p-4 min-w-[120px]">
              <CardContent className="p-0">
                <div className="text-2xl font-bold text-yellow-600">
                  {maintenanceData.filter((item: any) => item.status === 'em_andamento').length}
                </div>
                <div className="text-sm text-gray-500">Em Andamento</div>
              </CardContent>
            </Card>
            <Card className="p-4 min-w-[120px]">
              <CardContent className="p-0">
                <div className="text-2xl font-bold text-green-600">
                  {maintenanceData.filter((item: any) => item.status === 'concluida').length}
                </div>
                <div className="text-sm text-gray-500">Finalizadas</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sistema de busca e filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar por Placa de Veículo
            </CardTitle>
            <CardDescription>
              Encontre o histórico de manutenções de um veículo específico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Campo de busca geral */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por placa ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtro por placa específica */}
              <Select value={plateFilter} onValueChange={setPlateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por placa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as placas</SelectItem>
                  {uniquePlates.map((plate: string) => (
                    <SelectItem key={plate} value={plate}>
                      {plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtro por status */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="aguardando_pecas">Aguardando Peças</SelectItem>
                  <SelectItem value="motor">Motor</SelectItem>
                  <SelectItem value="turbina">Turbina</SelectItem>
                  <SelectItem value="funilaria">Funilaria</SelectItem>
                  <SelectItem value="bomba">Bomba</SelectItem>
                  <SelectItem value="bico">Bico</SelectItem>
                </SelectContent>
              </Select>

              {/* Botão limpar filtros */}
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Limpar
              </Button>
            </div>

            {/* Filtros ativos */}
            {(searchTerm || plateFilter || statusFilter) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {searchTerm && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Busca: "{searchTerm}"
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSearchTerm('')}
                    />
                  </Badge>
                )}
                {plateFilter && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Placa: {plateFilter}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setPlateFilter('')}
                    />
                  </Badge>
                )}
                {statusFilter && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Status: {translateMaintenanceStatus(statusFilter)}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setStatusFilter('')}
                    />
                  </Badge>
                )}
              </div>
            )}
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
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="icon">
                            <FileEdit className="h-4 w-4" />
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