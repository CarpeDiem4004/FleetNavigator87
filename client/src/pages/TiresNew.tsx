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
import { useLocation } from 'wouter';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Tipo para pneus
interface Tire {
  id: number;
  serialNumber: string;
  brand: string;
  model: string;
  size: string;
  purchaseDate: string;
  vehiclePlate: string | null;
  position: string | null;
  initialMileage: number;
  currentMileage: number;
  treadDepth: number;
  status: 'em_uso' | 'estoque' | 'descartado';
}

// Dados mockados para a tabela de pneus
const mockTires: Tire[] = [
  {
    id: 1,
    serialNumber: 'T001',
    brand: 'Pirelli',
    model: 'Formula Energy',
    size: '295/80R22.5',
    purchaseDate: '2025-01-15',
    vehiclePlate: 'ABC-1234',
    position: 'Dianteiro Direito',
    initialMileage: 0,
    currentMileage: 15000,
    treadDepth: 9.5,
    status: 'em_uso'
  },
  {
    id: 2,
    serialNumber: 'T002',
    brand: 'Bridgestone',
    model: 'Duravis R660',
    size: '295/80R22.5',
    purchaseDate: '2025-01-15',
    vehiclePlate: 'ABC-1234',
    position: 'Dianteiro Esquerdo',
    initialMileage: 0,
    currentMileage: 15000,
    treadDepth: 9.3,
    status: 'em_uso'
  },
  {
    id: 3,
    serialNumber: 'T003',
    brand: 'Goodyear',
    model: 'KMAX S',
    size: '295/80R22.5',
    purchaseDate: '2024-11-20',
    vehiclePlate: 'DEF-5678',
    position: 'Traseiro Externo Direito',
    initialMileage: 0,
    currentMileage: 25000,
    treadDepth: 7.5,
    status: 'em_uso'
  },
  {
    id: 4,
    serialNumber: 'T004',
    brand: 'Michelin',
    model: 'X Multi Z',
    size: '295/80R22.5',
    purchaseDate: '2024-12-10',
    vehiclePlate: null,
    position: null,
    initialMileage: 0,
    currentMileage: 0,
    treadDepth: 12.0,
    status: 'estoque'
  },
  {
    id: 5,
    serialNumber: 'T005',
    brand: 'Continental',
    model: 'Conti Hybrid HD3',
    size: '295/80R22.5',
    purchaseDate: '2024-10-05',
    vehiclePlate: null,
    position: null,
    initialMileage: 0,
    currentMileage: 60000,
    treadDepth: 1.2,
    status: 'descartado'
  }
];

// Função para traduzir os status de pneus
const translateTireStatus = (status: string): string => {
  const statuses: Record<string, string> = {
    em_uso: 'Em Uso',
    estoque: 'Em Estoque',
    descartado: 'Descartado'
  };
  return statuses[status] || status;
};

// Função para obter a classe CSS para o badge de status
const getStatusBadgeClass = (status: string): string => {
  const classes: Record<string, string> = {
    em_uso: 'bg-green-100 text-green-800',
    estoque: 'bg-blue-100 text-blue-800',
    descartado: 'bg-gray-100 text-gray-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

// Função para calcular a vida útil restante do pneu
const calculateTireLife = (treadDepth: number): number => {
  // Considerando 12mm como profundidade inicial e 2mm como limite mínimo
  const initialDepth = 12;
  const minDepth = 2;
  const usableDepth = initialDepth - minDepth;
  const currentUsable = treadDepth - minDepth;
  
  if (currentUsable <= 0) return 0;
  return Math.round((currentUsable / usableDepth) * 100);
};

// Função para formatar datas
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

const TiresNew: React.FC = () => {
  const [, navigate] = useLocation();
  const [tires, setTires] = useState<Tire[]>(mockTires);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTire, setNewTire] = useState<Partial<Tire>>({
    serialNumber: '',
    brand: '',
    model: '',
    size: '295/80R22.5',
    purchaseDate: new Date().toISOString().split('T')[0],
    vehiclePlate: null,
    position: null,
    initialMileage: 0,
    currentMileage: 0,
    treadDepth: 12.0,
    status: 'estoque'
  });

  // Filtrar pneus com base no termo de busca
  const filteredTires = tires.filter(
    (tire) => 
      tire.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tire.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tire.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tire.vehiclePlate && tire.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Adicionar novo pneu
  const handleAddTire = () => {
    if (newTire.serialNumber && newTire.brand && newTire.model) {
      const tire = {
        ...newTire,
        id: tires.length + 1
      } as Tire;
      
      setTires([...tires, tire]);
      setIsAddDialogOpen(false);
      setNewTire({
        serialNumber: '',
        brand: '',
        model: '',
        size: '295/80R22.5',
        purchaseDate: new Date().toISOString().split('T')[0],
        vehiclePlate: null,
        position: null,
        initialMileage: 0,
        currentMileage: 0,
        treadDepth: 12.0,
        status: 'estoque'
      });
    }
  };

  return (
    <MainLayoutSimple>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Pneus</h1>
            <p className="text-gray-500">
              Gestão e rastreamento de pneus da frota
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="flex items-center"
              onClick={() => navigate('/tires/entrada')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Entrada em Lote
            </Button>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Pneu Individual
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Novo Pneu</DialogTitle>
                  <DialogDescription>
                    Preencha os detalhes do pneu abaixo
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="serialNumber" className="text-right">
                      Nº de Série
                    </Label>
                    <Input
                      id="serialNumber"
                      value={newTire.serialNumber}
                      onChange={(e) => setNewTire({...newTire, serialNumber: e.target.value})}
                      className="col-span-3"
                      placeholder="T001"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="brand" className="text-right">
                      Marca
                    </Label>
                    <Input
                      id="brand"
                      value={newTire.brand}
                      onChange={(e) => setNewTire({...newTire, brand: e.target.value})}
                      className="col-span-3"
                      placeholder="Pirelli"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="model" className="text-right">
                      Modelo
                    </Label>
                    <Input
                      id="model"
                      value={newTire.model}
                      onChange={(e) => setNewTire({...newTire, model: e.target.value})}
                      className="col-span-3"
                      placeholder="Formula Energy"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="size" className="text-right">
                      Tamanho
                    </Label>
                    <Input
                      id="size"
                      value={newTire.size}
                      onChange={(e) => setNewTire({...newTire, size: e.target.value})}
                      className="col-span-3"
                      placeholder="295/80R22.5"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="purchaseDate" className="text-right">
                      Data de Compra
                    </Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={newTire.purchaseDate}
                      onChange={(e) => setNewTire({...newTire, purchaseDate: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="treadDepth" className="text-right">
                      Prof. Sulcos (mm)
                    </Label>
                    <Input
                      id="treadDepth"
                      type="number"
                      step="0.1"
                      value={newTire.treadDepth}
                      onChange={(e) => setNewTire({...newTire, treadDepth: parseFloat(e.target.value)})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">
                      Status
                    </Label>
                    <Select 
                      value={newTire.status}
                      onValueChange={(value: 'em_uso' | 'estoque' | 'descartado') => 
                        setNewTire({...newTire, status: value})
                      }
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="em_uso">Em Uso</SelectItem>
                        <SelectItem value="estoque">Em Estoque</SelectItem>
                        <SelectItem value="descartado">Descartado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newTire.status === 'em_uso' && (
                    <>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="vehiclePlate" className="text-right">
                          Veículo
                        </Label>
                        <Input
                          id="vehiclePlate"
                          value={newTire.vehiclePlate || ''}
                          onChange={(e) => setNewTire({...newTire, vehiclePlate: e.target.value})}
                          className="col-span-3"
                          placeholder="ABC-1234"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="position" className="text-right">
                          Posição
                        </Label>
                        <Input
                          id="position"
                          value={newTire.position || ''}
                          onChange={(e) => setNewTire({...newTire, position: e.target.value})}
                          className="col-span-3"
                          placeholder="Dianteiro Direito"
                        />
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddTire}>
                    Adicionar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Inventário de Pneus</CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar pneus..."
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Inventário de pneus da frota</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Série</TableHead>
                  <TableHead>Marca/Modelo</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Posição</TableHead>
                  <TableHead>Vida Útil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTires.map((tire) => (
                  <TableRow key={tire.id}>
                    <TableCell className="font-medium">{tire.serialNumber}</TableCell>
                    <TableCell>{tire.brand} {tire.model}</TableCell>
                    <TableCell>{tire.size}</TableCell>
                    <TableCell>{tire.vehiclePlate || '-'}</TableCell>
                    <TableCell>{tire.position || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              calculateTireLife(tire.treadDepth) > 50 
                                ? 'bg-green-500' 
                                : calculateTireLife(tire.treadDepth) > 25 
                                  ? 'bg-yellow-500' 
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${calculateTireLife(tire.treadDepth)}%` }}
                          />
                        </div>
                        <span className="text-xs">{calculateTireLife(tire.treadDepth)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(tire.status)}`}>
                        {translateTireStatus(tire.status)}
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

export default TiresNew;
