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

// Tipo para representar os dados de um veículo
interface Vehicle {
  id: number;
  plate: string;
  type: string;
  model: string;
  year: number;
  status: string;
  base: string;
}

// Dados mockados para a tabela de veículos
const mockVehicles: Vehicle[] = [
  {
    id: 1,
    plate: 'ABC-1234',
    type: 'cavalo_mecanico',
    model: 'Volvo FH 460',
    year: 2021,
    status: 'em_operacao',
    base: 'São Paulo'
  },
  {
    id: 2,
    plate: 'DEF-5678',
    type: 'carreta',
    model: 'Randon Graneleira',
    year: 2020,
    status: 'em_manutencao',
    base: 'Rio de Janeiro'
  },
  {
    id: 3,
    plate: 'GHI-9012',
    type: 'cavalo_mecanico',
    model: 'Scania R450',
    year: 2022,
    status: 'em_operacao',
    base: 'São Paulo'
  },
  {
    id: 4,
    plate: 'JKL-3456',
    type: 'van',
    model: 'Mercedes-Benz Sprinter',
    year: 2023,
    status: 'parado',
    base: 'Belo Horizonte'
  },
  {
    id: 5,
    plate: 'MNO-7890',
    type: 'utilitario',
    model: 'Ford Ranger',
    year: 2022,
    status: 'em_operacao',
    base: 'Curitiba'
  }
];

// Função para traduzir os tipos de veículos
const translateVehicleType = (type: string): string => {
  const types: Record<string, string> = {
    cavalo_mecanico: 'Cavalo Mecânico',
    carreta: 'Carreta',
    van: 'Van',
    utilitario: 'Utilitário'
  };
  return types[type] || type;
};

// Função para traduzir os status de veículos
const translateVehicleStatus = (status: string): string => {
  const statuses: Record<string, string> = {
    em_operacao: 'Em Operação',
    em_manutencao: 'Em Manutenção',
    parado: 'Parado'
  };
  return statuses[status] || status;
};

// Função para obter a classe CSS para o badge de status
const getStatusBadgeClass = (status: string): string => {
  const classes: Record<string, string> = {
    em_operacao: 'bg-green-100 text-green-800',
    em_manutencao: 'bg-yellow-100 text-yellow-800',
    parado: 'bg-red-100 text-red-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

const VehiclesNew: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    plate: '',
    type: 'cavalo_mecanico',
    model: '',
    year: new Date().getFullYear(),
    status: 'em_operacao',
    base: 'São Paulo'
  });

  // Filtrar veículos com base no termo de busca
  const filteredVehicles = vehicles.filter(
    (vehicle) => 
      vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) || 
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      translateVehicleType(vehicle.type).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Adicionar novo veículo
  const handleAddVehicle = () => {
    if (newVehicle.plate && newVehicle.model) {
      const vehicle = {
        ...newVehicle,
        id: vehicles.length + 1
      } as Vehicle;
      
      setVehicles([...vehicles, vehicle]);
      setIsAddDialogOpen(false);
      setNewVehicle({
        plate: '',
        type: 'cavalo_mecanico',
        model: '',
        year: new Date().getFullYear(),
        status: 'em_operacao',
        base: 'São Paulo'
      });
    }
  };

  return (
    <MainLayoutSimple>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Veículos</h1>
            <p className="text-gray-500">
              Gerenciamento de veículos da frota
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Veículo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Veículo</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes do veículo abaixo
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="plate" className="text-right">
                    Placa
                  </Label>
                  <Input
                    id="plate"
                    value={newVehicle.plate}
                    onChange={(e) => setNewVehicle({...newVehicle, plate: e.target.value})}
                    className="col-span-3"
                    placeholder="ABC-1234"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Tipo
                  </Label>
                  <Select 
                    value={newVehicle.type}
                    onValueChange={(value) => setNewVehicle({...newVehicle, type: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cavalo_mecanico">Cavalo Mecânico</SelectItem>
                      <SelectItem value="carreta">Carreta</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="utilitario">Utilitário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="model" className="text-right">
                    Modelo
                  </Label>
                  <Input
                    id="model"
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                    className="col-span-3"
                    placeholder="Volvo FH 460"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="year" className="text-right">
                    Ano
                  </Label>
                  <Input
                    id="year"
                    type="number"
                    value={newVehicle.year}
                    onChange={(e) => setNewVehicle({...newVehicle, year: parseInt(e.target.value)})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select 
                    value={newVehicle.status}
                    onValueChange={(value) => setNewVehicle({...newVehicle, status: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="em_operacao">Em Operação</SelectItem>
                      <SelectItem value="em_manutencao">Em Manutenção</SelectItem>
                      <SelectItem value="parado">Parado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="base" className="text-right">
                    Base
                  </Label>
                  <Select 
                    value={newVehicle.base}
                    onValueChange={(value) => setNewVehicle({...newVehicle, base: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione a base" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="São Paulo">São Paulo</SelectItem>
                      <SelectItem value="Rio de Janeiro">Rio de Janeiro</SelectItem>
                      <SelectItem value="Belo Horizonte">Belo Horizonte</SelectItem>
                      <SelectItem value="Curitiba">Curitiba</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddVehicle}>
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Lista de Veículos</CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar veículos..."
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Lista de veículos da frota</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">{vehicle.plate}</TableCell>
                    <TableCell>{translateVehicleType(vehicle.type)}</TableCell>
                    <TableCell>{vehicle.model}</TableCell>
                    <TableCell>{vehicle.year}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(vehicle.status)}`}>
                        {translateVehicleStatus(vehicle.status)}
                      </span>
                    </TableCell>
                    <TableCell>{vehicle.base}</TableCell>
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

export default VehiclesNew;