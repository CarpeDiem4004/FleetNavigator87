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

// Tipo para abastecimento
interface Refueling {
  id: number;
  vehiclePlate: string;
  date: string;
  fuelType: 'diesel' | 'arla';
  liters: number;
  pricePerLiter: number;
  totalPrice: number;
  mileage: number;
  station: string;
  driver: string;
  notes: string | null;
}

// Dados mockados para a tabela de abastecimentos
const mockRefueling: Refueling[] = [
  {
    id: 1,
    vehiclePlate: 'ABC-1234',
    date: '2025-04-12',
    fuelType: 'diesel',
    liters: 150,
    pricePerLiter: 5.40,
    totalPrice: 810,
    mileage: 56789,
    station: 'Posto Shell - São Paulo',
    driver: 'João Silva',
    notes: null
  },
  {
    id: 2,
    vehiclePlate: 'DEF-5678',
    date: '2025-04-11',
    fuelType: 'diesel',
    liters: 170,
    pricePerLiter: 5.38,
    totalPrice: 914.60,
    mileage: 34521,
    station: 'Posto Ipiranga - Rio de Janeiro',
    driver: 'Carlos Santos',
    notes: null
  },
  {
    id: 3,
    vehiclePlate: 'ABC-1234',
    date: '2025-04-10',
    fuelType: 'arla',
    liters: 20,
    pricePerLiter: 3.20,
    totalPrice: 64,
    mileage: 56400,
    station: 'Posto Shell - São Paulo',
    driver: 'João Silva',
    notes: 'Abastecimento de arla após viagem longa'
  },
  {
    id: 4,
    vehiclePlate: 'GHI-9012',
    date: '2025-04-09',
    fuelType: 'diesel',
    liters: 120,
    pricePerLiter: 5.42,
    totalPrice: 650.40,
    mileage: 23050,
    station: 'Posto Petrobras - Curitiba',
    driver: 'Marcos Oliveira',
    notes: null
  },
  {
    id: 5,
    vehiclePlate: 'JKL-3456',
    date: '2025-04-08',
    fuelType: 'diesel',
    liters: 80,
    pricePerLiter: 5.35,
    totalPrice: 428,
    mileage: 12450,
    station: 'Posto Ipiranga - Belo Horizonte',
    driver: 'Ana Souza',
    notes: null
  }
];

// Função para traduzir os tipos de combustível
const translateFuelType = (type: string): string => {
  const types: Record<string, string> = {
    diesel: 'Diesel',
    arla: 'Arla 32'
  };
  return types[type] || type;
};

// Função para obter a classe CSS para o badge de tipo de combustível
const getFuelBadgeClass = (type: string): string => {
  const classes: Record<string, string> = {
    diesel: 'bg-yellow-100 text-yellow-800',
    arla: 'bg-blue-100 text-blue-800'
  };
  return classes[type] || 'bg-gray-100 text-gray-800';
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

const RefuelingNew: React.FC = () => {
  const [refueling, setRefueling] = useState<Refueling[]>(mockRefueling);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRefueling, setNewRefueling] = useState<Partial<Refueling>>({
    vehiclePlate: '',
    date: new Date().toISOString().split('T')[0],
    fuelType: 'diesel',
    liters: 0,
    pricePerLiter: 5.40,
    totalPrice: 0,
    mileage: 0,
    station: '',
    driver: '',
    notes: null
  });

  // Filtrar abastecimentos com base no termo de busca
  const filteredRefueling = refueling.filter(
    (item) => 
      item.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.station.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.driver.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcular preço total ao alterar litros ou preço por litro
  const calculateTotalPrice = (liters: number, pricePerLiter: number): number => {
    return Number((liters * pricePerLiter).toFixed(2));
  };

  // Atualizar litros e recalcular preço total
  const handleLitersChange = (value: string) => {
    const liters = parseFloat(value);
    const pricePerLiter = newRefueling.pricePerLiter || 0;
    const totalPrice = calculateTotalPrice(liters, pricePerLiter);
    
    setNewRefueling({
      ...newRefueling,
      liters,
      totalPrice
    });
  };

  // Atualizar preço por litro e recalcular preço total
  const handlePricePerLiterChange = (value: string) => {
    const pricePerLiter = parseFloat(value);
    const liters = newRefueling.liters || 0;
    const totalPrice = calculateTotalPrice(liters, pricePerLiter);
    
    setNewRefueling({
      ...newRefueling,
      pricePerLiter,
      totalPrice
    });
  };

  // Adicionar novo abastecimento
  const handleAddRefueling = () => {
    if (newRefueling.vehiclePlate && newRefueling.liters && newRefueling.station && newRefueling.driver) {
      const item = {
        ...newRefueling,
        id: refueling.length + 1
      } as Refueling;
      
      setRefueling([...refueling, item]);
      setIsAddDialogOpen(false);
      setNewRefueling({
        vehiclePlate: '',
        date: new Date().toISOString().split('T')[0],
        fuelType: 'diesel',
        liters: 0,
        pricePerLiter: 5.40,
        totalPrice: 0,
        mileage: 0,
        station: '',
        driver: '',
        notes: null
      });
    }
  };

  return (
    <MainLayoutSimple>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Abastecimentos</h1>
            <p className="text-gray-500">
              Controle de abastecimentos da frota
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Registrar Abastecimento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Novo Abastecimento</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes do abastecimento abaixo
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="vehiclePlate" className="text-right">
                    Placa do Veículo
                  </Label>
                  <Input
                    id="vehiclePlate"
                    value={newRefueling.vehiclePlate}
                    onChange={(e) => setNewRefueling({...newRefueling, vehiclePlate: e.target.value})}
                    className="col-span-3"
                    placeholder="ABC-1234"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Data
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={newRefueling.date}
                    onChange={(e) => setNewRefueling({...newRefueling, date: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fuelType" className="text-right">
                    Tipo de Combustível
                  </Label>
                  <Select 
                    value={newRefueling.fuelType}
                    onValueChange={(value: 'diesel' | 'arla') => 
                      setNewRefueling({...newRefueling, fuelType: value})
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="arla">Arla 32</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="liters" className="text-right">
                    Litros
                  </Label>
                  <Input
                    id="liters"
                    type="number"
                    step="0.01"
                    value={newRefueling.liters || ''}
                    onChange={(e) => handleLitersChange(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pricePerLiter" className="text-right">
                    Preço por Litro
                  </Label>
                  <Input
                    id="pricePerLiter"
                    type="number"
                    step="0.01"
                    value={newRefueling.pricePerLiter || ''}
                    onChange={(e) => handlePricePerLiterChange(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="totalPrice" className="text-right">
                    Valor Total
                  </Label>
                  <Input
                    id="totalPrice"
                    type="number"
                    step="0.01"
                    value={newRefueling.totalPrice || ''}
                    disabled
                    className="col-span-3 bg-gray-50"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="mileage" className="text-right">
                    Quilometragem
                  </Label>
                  <Input
                    id="mileage"
                    type="number"
                    value={newRefueling.mileage || ''}
                    onChange={(e) => setNewRefueling({...newRefueling, mileage: parseInt(e.target.value)})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="station" className="text-right">
                    Posto
                  </Label>
                  <Input
                    id="station"
                    value={newRefueling.station || ''}
                    onChange={(e) => setNewRefueling({...newRefueling, station: e.target.value})}
                    className="col-span-3"
                    placeholder="Nome do Posto - Cidade"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="driver" className="text-right">
                    Motorista
                  </Label>
                  <Input
                    id="driver"
                    value={newRefueling.driver || ''}
                    onChange={(e) => setNewRefueling({...newRefueling, driver: e.target.value})}
                    className="col-span-3"
                    placeholder="Nome do Motorista"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    Observações
                  </Label>
                  <Input
                    id="notes"
                    value={newRefueling.notes || ''}
                    onChange={(e) => setNewRefueling({...newRefueling, notes: e.target.value})}
                    className="col-span-3"
                    placeholder="Observações adicionais"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddRefueling}>
                  Registrar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Histórico de Abastecimentos</CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar abastecimentos..."
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Histórico de abastecimentos da frota</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Litros</TableHead>
                  <TableHead>Preço/L</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Posto</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRefueling.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDate(item.date)}</TableCell>
                    <TableCell className="font-medium">{item.vehiclePlate}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${getFuelBadgeClass(item.fuelType)}`}>
                        {translateFuelType(item.fuelType)}
                      </span>
                    </TableCell>
                    <TableCell>{item.liters.toFixed(2)}</TableCell>
                    <TableCell>{formatCurrency(item.pricePerLiter)}</TableCell>
                    <TableCell>{formatCurrency(item.totalPrice)}</TableCell>
                    <TableCell>{item.station}</TableCell>
                    <TableCell>{item.driver}</TableCell>
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

export default RefuelingNew;