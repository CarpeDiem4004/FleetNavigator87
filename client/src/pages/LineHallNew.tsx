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
import { Search, Plus, FileEdit, Trash2, MapPin } from 'lucide-react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Tipo para viagens
interface Trip {
  id: number;
  origin: string;
  destination: string;
  distance: number;
  vehiclePlate: string;
  driver: string;
  startDate: string;
  estimatedArrival: string;
  actualArrival: string | null;
  status: 'programada' | 'carregando' | 'aguardando_carga' | 'em_transito' | 'finalizada';
  cargo: string;
  cargoWeight: number;
  notes: string | null;
}

// Dados mockados para a tabela de viagens
const mockTrips: Trip[] = [
  {
    id: 1,
    origin: 'São Paulo, SP',
    destination: 'Rio de Janeiro, RJ',
    distance: 430,
    vehiclePlate: 'ABC-1234',
    driver: 'João Silva',
    startDate: '2025-04-15',
    estimatedArrival: '2025-04-16',
    actualArrival: null,
    status: 'em_transito',
    cargo: 'Produtos Eletrônicos',
    cargoWeight: 12500,
    notes: null
  },
  {
    id: 2,
    origin: 'Belo Horizonte, MG',
    destination: 'Brasília, DF',
    distance: 740,
    vehiclePlate: 'DEF-5678',
    driver: 'Carlos Santos',
    startDate: '2025-04-16',
    estimatedArrival: '2025-04-18',
    actualArrival: null,
    status: 'programada',
    cargo: 'Produtos Alimentícios',
    cargoWeight: 18000,
    notes: 'Carga refrigerada'
  },
  {
    id: 3,
    origin: 'Curitiba, PR',
    destination: 'Porto Alegre, RS',
    distance: 540,
    vehiclePlate: 'GHI-9012',
    driver: 'Marcos Oliveira',
    startDate: '2025-04-10',
    estimatedArrival: '2025-04-11',
    actualArrival: '2025-04-11',
    status: 'finalizada',
    cargo: 'Peças Automotivas',
    cargoWeight: 15000,
    notes: null
  },
  {
    id: 4,
    origin: 'Salvador, BA',
    destination: 'Recife, PE',
    distance: 850,
    vehiclePlate: 'JKL-3456',
    driver: 'Ana Souza',
    startDate: '2025-04-14',
    estimatedArrival: '2025-04-16',
    actualArrival: null,
    status: 'carregando',
    cargo: 'Produtos Têxteis',
    cargoWeight: 9000,
    notes: 'Atraso no carregamento'
  },
  {
    id: 5,
    origin: 'São Paulo, SP',
    destination: 'Goiânia, GO',
    distance: 920,
    vehiclePlate: 'MNO-7890',
    driver: 'Pedro Costa',
    startDate: '2025-04-13',
    estimatedArrival: '2025-04-15',
    actualArrival: null,
    status: 'aguardando_carga',
    cargo: 'Produtos Diversos',
    cargoWeight: 14000,
    notes: 'Aguardando liberação da mercadoria'
  }
];

// Função para traduzir os status de viagem
const translateTripStatus = (status: string): string => {
  const statuses: Record<string, string> = {
    programada: 'Programada',
    carregando: 'Carregando',
    aguardando_carga: 'Aguardando Carga',
    em_transito: 'Em Trânsito',
    finalizada: 'Finalizada'
  };
  return statuses[status] || status;
};

// Função para obter a classe CSS para o badge de status
const getStatusBadgeClass = (status: string): string => {
  const classes: Record<string, string> = {
    programada: 'bg-blue-100 text-blue-800',
    carregando: 'bg-purple-100 text-purple-800',
    aguardando_carga: 'bg-yellow-100 text-yellow-800',
    em_transito: 'bg-orange-100 text-orange-800',
    finalizada: 'bg-green-100 text-green-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

// Função para formatar datas
const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

// Função para formatar peso (kg para toneladas)
const formatWeight = (weightKg: number): string => {
  const weightTon = weightKg / 1000;
  return `${weightTon.toFixed(1)} t`;
};

const LineHallNew: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTrip, setNewTrip] = useState<Partial<Trip>>({
    origin: '',
    destination: '',
    distance: 0,
    vehiclePlate: '',
    driver: '',
    startDate: new Date().toISOString().split('T')[0],
    estimatedArrival: new Date(Date.now() + 2*24*60*60*1000).toISOString().split('T')[0], // 2 dias à frente
    actualArrival: null,
    status: 'programada',
    cargo: '',
    cargoWeight: 0,
    notes: null
  });

  // Filtrar viagens com base no termo de busca
  const filteredTrips = trips.filter(
    (trip) => 
      trip.origin.toLowerCase().includes(searchTerm.toLowerCase()) || 
      trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.cargo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Adicionar nova viagem
  const handleAddTrip = () => {
    if (newTrip.origin && newTrip.destination && newTrip.vehiclePlate && newTrip.driver) {
      const trip = {
        ...newTrip,
        id: trips.length + 1
      } as Trip;
      
      setTrips([...trips, trip]);
      setIsAddDialogOpen(false);
      setNewTrip({
        origin: '',
        destination: '',
        distance: 0,
        vehiclePlate: '',
        driver: '',
        startDate: new Date().toISOString().split('T')[0],
        estimatedArrival: new Date(Date.now() + 2*24*60*60*1000).toISOString().split('T')[0],
        actualArrival: null,
        status: 'programada',
        cargo: '',
        cargoWeight: 0,
        notes: null
      });
    }
  };

  return (
    <MainLayoutSimple>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Linha de Transporte</h1>
            <p className="text-gray-500">
              Gestão de viagens e transporte de carga
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Programar Viagem
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Programar Nova Viagem</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes da viagem abaixo
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="origin" className="text-right">
                    Origem
                  </Label>
                  <Input
                    id="origin"
                    value={newTrip.origin}
                    onChange={(e) => setNewTrip({...newTrip, origin: e.target.value})}
                    className="col-span-3"
                    placeholder="Cidade, UF"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="destination" className="text-right">
                    Destino
                  </Label>
                  <Input
                    id="destination"
                    value={newTrip.destination}
                    onChange={(e) => setNewTrip({...newTrip, destination: e.target.value})}
                    className="col-span-3"
                    placeholder="Cidade, UF"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="distance" className="text-right">
                    Distância (km)
                  </Label>
                  <Input
                    id="distance"
                    type="number"
                    value={newTrip.distance}
                    onChange={(e) => setNewTrip({...newTrip, distance: parseInt(e.target.value)})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="vehiclePlate" className="text-right">
                    Veículo
                  </Label>
                  <Input
                    id="vehiclePlate"
                    value={newTrip.vehiclePlate}
                    onChange={(e) => setNewTrip({...newTrip, vehiclePlate: e.target.value})}
                    className="col-span-3"
                    placeholder="Placa do veículo"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="driver" className="text-right">
                    Motorista
                  </Label>
                  <Input
                    id="driver"
                    value={newTrip.driver}
                    onChange={(e) => setNewTrip({...newTrip, driver: e.target.value})}
                    className="col-span-3"
                    placeholder="Nome do motorista"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startDate" className="text-right">
                    Data de Saída
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newTrip.startDate}
                    onChange={(e) => setNewTrip({...newTrip, startDate: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="estimatedArrival" className="text-right">
                    Chegada Prevista
                  </Label>
                  <Input
                    id="estimatedArrival"
                    type="date"
                    value={newTrip.estimatedArrival}
                    onChange={(e) => setNewTrip({...newTrip, estimatedArrival: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select 
                    value={newTrip.status}
                    onValueChange={(value: 'programada' | 'carregando' | 'aguardando_carga' | 'em_transito' | 'finalizada') => 
                      setNewTrip({...newTrip, status: value})
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="programada">Programada</SelectItem>
                      <SelectItem value="carregando">Carregando</SelectItem>
                      <SelectItem value="aguardando_carga">Aguardando Carga</SelectItem>
                      <SelectItem value="em_transito">Em Trânsito</SelectItem>
                      <SelectItem value="finalizada">Finalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cargo" className="text-right">
                    Carga
                  </Label>
                  <Input
                    id="cargo"
                    value={newTrip.cargo}
                    onChange={(e) => setNewTrip({...newTrip, cargo: e.target.value})}
                    className="col-span-3"
                    placeholder="Tipo de carga"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cargoWeight" className="text-right">
                    Peso (kg)
                  </Label>
                  <Input
                    id="cargoWeight"
                    type="number"
                    value={newTrip.cargoWeight}
                    onChange={(e) => setNewTrip({...newTrip, cargoWeight: parseInt(e.target.value)})}
                    className="col-span-3"
                  />
                </div>
                {newTrip.status === 'finalizada' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="actualArrival" className="text-right">
                      Chegada Real
                    </Label>
                    <Input
                      id="actualArrival"
                      type="date"
                      value={newTrip.actualArrival || ''}
                      onChange={(e) => setNewTrip({...newTrip, actualArrival: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    Observações
                  </Label>
                  <Input
                    id="notes"
                    value={newTrip.notes || ''}
                    onChange={(e) => setNewTrip({...newTrip, notes: e.target.value})}
                    className="col-span-3"
                    placeholder="Observações adicionais"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddTrip}>
                  Programar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Viagens</CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar viagens..."
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Programação de viagens da frota</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Rota</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Datas</TableHead>
                  <TableHead>Carga</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1 text-blue-500" />
                          <span className="font-medium">{trip.origin}</span>
                        </div>
                        <div className="flex items-center mt-1">
                          <MapPin className="h-3 w-3 mr-1 text-red-500" />
                          <span>{trip.destination}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{trip.distance} km</div>
                      </div>
                    </TableCell>
                    <TableCell>{trip.vehiclePlate}</TableCell>
                    <TableCell>{trip.driver}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="text-xs">
                          <span className="font-medium">Saída:</span> {formatDate(trip.startDate)}
                        </div>
                        <div className="text-xs mt-1">
                          <span className="font-medium">Chegada Prev.:</span> {formatDate(trip.estimatedArrival)}
                        </div>
                        {trip.actualArrival && (
                          <div className="text-xs mt-1">
                            <span className="font-medium">Chegada Real:</span> {formatDate(trip.actualArrival)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="text-sm">{trip.cargo}</div>
                        <div className="text-xs text-muted-foreground">{formatWeight(trip.cargoWeight)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(trip.status)}`}>
                        {translateTripStatus(trip.status)}
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

export default LineHallNew;