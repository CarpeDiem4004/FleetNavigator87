import React, { useState } from 'react';
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
import { Search, Plus, FileEdit, Trash2 } from 'lucide-react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Tipo para manutenção
interface Maintenance {
  id: number;
  vehiclePlate: string;
  type: 'preventiva' | 'corretiva';
  description: string;
  date: string;
  cost: number;
  status: 'concluida' | 'em_andamento' | 'aguardando_pecas';
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
    aguardando_pecas: 'Aguardando Peças'
  };
  return statuses[status] || status;
};

// Função para obter a classe CSS para o badge de status
const getStatusBadgeClass = (status: string): string => {
  const classes: Record<string, string> = {
    concluida: 'bg-green-100 text-green-800',
    em_andamento: 'bg-yellow-100 text-yellow-800',
    aguardando_pecas: 'bg-red-100 text-red-800'
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
  const [maintenance, setMaintenance] = useState<Maintenance[]>(mockMaintenance);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMaintenance, setNewMaintenance] = useState<Partial<Maintenance>>({
    vehiclePlate: '',
    type: 'preventiva',
    description: '',
    date: new Date().toISOString().split('T')[0],
    cost: 0,
    status: 'em_andamento'
  });

  // Filtrar manutenções com base no termo de busca
  const filteredMaintenance = maintenance.filter(
    (item) => 
      item.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Manutenções</h1>
            <p className="text-gray-500">
              Gestão de manutenções da frota
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Manutenção
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Nova Manutenção</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes da manutenção abaixo
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="vehiclePlate" className="text-right">
                    Placa do Veículo
                  </Label>
                  <Input
                    id="vehiclePlate"
                    value={newMaintenance.vehiclePlate}
                    onChange={(e) => setNewMaintenance({...newMaintenance, vehiclePlate: e.target.value})}
                    className="col-span-3"
                    placeholder="ABC-1234"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Tipo
                  </Label>
                  <Select 
                    value={newMaintenance.type}
                    onValueChange={(value: 'preventiva' | 'corretiva') => setNewMaintenance({...newMaintenance, type: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventiva">Preventiva</SelectItem>
                      <SelectItem value="corretiva">Corretiva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Descrição
                  </Label>
                  <Input
                    id="description"
                    value={newMaintenance.description}
                    onChange={(e) => setNewMaintenance({...newMaintenance, description: e.target.value})}
                    className="col-span-3"
                    placeholder="Troca de óleo e filtros"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Data
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={newMaintenance.date}
                    onChange={(e) => setNewMaintenance({...newMaintenance, date: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cost" className="text-right">
                    Custo (R$)
                  </Label>
                  <Input
                    id="cost"
                    type="number"
                    value={newMaintenance.cost}
                    onChange={(e) => setNewMaintenance({...newMaintenance, cost: parseFloat(e.target.value)})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select 
                    value={newMaintenance.status}
                    onValueChange={(value: 'concluida' | 'em_andamento' | 'aguardando_pecas') => 
                      setNewMaintenance({...newMaintenance, status: value})
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concluida">Concluída</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="aguardando_pecas">Aguardando Peças</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddMaintenance}>
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Registros de Manutenção</CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar manutenções..."
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Lista de manutenções registradas</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaintenance.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.vehiclePlate}</TableCell>
                    <TableCell>{translateMaintenanceType(item.type)}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{formatDate(item.date)}</TableCell>
                    <TableCell>{formatCurrency(item.cost)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(item.status)}`}>
                        {translateMaintenanceStatus(item.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="icon">
                          <FileEdit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayoutSimple>
  );
};

export default MaintenanceNew;