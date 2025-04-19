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
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Search, Plus, FileEdit, Trash2, MapPin, Loader2 } from 'lucide-react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Tipo para viagens
interface Trip {
  id: number;
  origin: string;
  destination: string;
  truckPlate: string;
  trailer1Plate: string;
  trailer2Plate: string | null;
  driver: string;
  phone: string;
  departureDate: string;
  loadingTime: string;
  arrivalDate: string;
  unloadingTime: string;
  status: 'no_show' | 'cancelada_pelo_cliente' | 'concluida';
  notes: string | null;
}

// Dados mockados para a tabela de viagens
const mockTrips: Trip[] = [
  {
    id: 1,
    origin: 'São Paulo, SP',
    destination: 'Rio de Janeiro, RJ',
    truckPlate: 'ABC-1234',
    trailer1Plate: 'XYZ-9876',
    trailer2Plate: null,
    driver: 'João Silva',
    phone: '(11) 98765-4321',
    departureDate: '2025-04-15',
    loadingTime: '08:00',
    arrivalDate: '2025-04-16',
    unloadingTime: '14:30',
    status: 'concluida',
    notes: null
  },
  {
    id: 2,
    origin: 'Belo Horizonte, MG',
    destination: 'Brasília, DF',
    truckPlate: 'DEF-5678',
    trailer1Plate: 'UVW-5432',
    trailer2Plate: 'RST-1098',
    driver: 'Carlos Santos',
    phone: '(31) 99876-5432',
    departureDate: '2025-04-16',
    loadingTime: '07:30',
    arrivalDate: '2025-04-18',
    unloadingTime: '10:00',
    status: 'no_show',
    notes: 'Motorista não compareceu no horário agendado'
  },
  {
    id: 3,
    origin: 'Curitiba, PR',
    destination: 'Porto Alegre, RS',
    truckPlate: 'GHI-9012',
    trailer1Plate: 'JKL-6543',
    trailer2Plate: null,
    driver: 'Marcos Oliveira',
    phone: '(41) 98888-7777',
    departureDate: '2025-04-10',
    loadingTime: '09:00',
    arrivalDate: '2025-04-11',
    unloadingTime: '15:45',
    status: 'concluida',
    notes: null
  },
  {
    id: 4,
    origin: 'Salvador, BA',
    destination: 'Recife, PE',
    truckPlate: 'JKL-3456',
    trailer1Plate: 'MNO-2109',
    trailer2Plate: null,
    driver: 'Ana Souza',
    phone: '(71) 99999-8888',
    departureDate: '2025-04-14',
    loadingTime: '06:45',
    arrivalDate: '2025-04-16',
    unloadingTime: '11:30',
    status: 'cancelada_pelo_cliente',
    notes: 'Cliente cancelou devido a problemas no estoque'
  },
  {
    id: 5,
    origin: 'São Paulo, SP',
    destination: 'Goiânia, GO',
    truckPlate: 'MNO-7890',
    trailer1Plate: 'PQR-3456',
    trailer2Plate: 'STU-7654',
    driver: 'Pedro Costa',
    phone: '(11) 97777-6666',
    departureDate: '2025-04-13',
    loadingTime: '08:15',
    arrivalDate: '2025-04-15',
    unloadingTime: '16:00',
    status: 'concluida',
    notes: null
  }
];

// Função para traduzir os status de viagem
const translateTripStatus = (status: string): string => {
  const statuses: Record<string, string> = {
    no_show: 'No Show',
    cancelada_pelo_cliente: 'Cancelada pelo Cliente',
    concluida: 'Concluída'
  };
  return statuses[status] || status;
};

// Função para obter a classe CSS para o badge de status
const getStatusBadgeClass = (status: string): string => {
  const classes: Record<string, string> = {
    no_show: 'bg-red-100 text-red-800',
    cancelada_pelo_cliente: 'bg-yellow-100 text-yellow-800',
    concluida: 'bg-green-100 text-green-800'
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<number | null>(null);
  const [newTrip, setNewTrip] = useState<Partial<Trip>>({
    origin: '',
    destination: '',
    truckPlate: '',
    trailer1Plate: '',
    trailer2Plate: null,
    driver: '',
    phone: '',
    departureDate: new Date().toISOString().split('T')[0],
    loadingTime: '08:00',
    arrivalDate: new Date(Date.now() + 2*24*60*60*1000).toISOString().split('T')[0],
    unloadingTime: '16:00',
    status: 'concluida',
    notes: null
  });
  
  // Buscar dados da API em vez de usar dados mockados
  const { data: apiTrips = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/line-hall'],
    retry: 1,
    staleTime: 60000,
    refetchOnWindowFocus: false
  });
  
  // Mutation para excluir uma viagem
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/line-hall/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir viagem');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Recarregar os dados após a exclusão bem-sucedida
      queryClient.invalidateQueries({ queryKey: ['/api/line-hall'] });
      
      toast({
        title: "Viagem excluída",
        description: "A viagem foi excluída com sucesso.",
        variant: "default"
      });
      
      // Também excluir localmente para resposta imediata na UI
      if (tripToDelete !== null) {
        setTrips(trips.filter(trip => trip.id !== tripToDelete));
      }
      
      // Fechar o diálogo de confirmação
      setIsDeleteDialogOpen(false);
      setTripToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir viagem",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      
      // Fechar o diálogo de confirmação mesmo em caso de erro
      setIsDeleteDialogOpen(false);
    }
  });
  
  // Função para iniciar o processo de exclusão
  const handleDeleteClick = (tripId: number) => {
    setTripToDelete(tripId);
    setIsDeleteDialogOpen(true);
  };
  
  // Função para confirmar a exclusão
  const confirmDelete = () => {
    if (tripToDelete !== null) {
      deleteMutation.mutate(tripToDelete);
    }
  };

  // Filtrar viagens com base no termo de busca
  const tripsToUse = Array.isArray(apiTrips) && apiTrips.length > 0 ? apiTrips : trips;
  const filteredTrips = tripsToUse.filter(
    (trip: any) => 
      (trip.origin?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      trip.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.truckPlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.driver?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Adicionar nova viagem
  const handleAddTrip = () => {
    if (newTrip.origin && newTrip.destination && newTrip.truckPlate && newTrip.trailer1Plate && newTrip.driver) {
      const trip = {
        ...newTrip,
        id: trips.length + 1
      } as Trip;
      
      setTrips([...trips, trip]);
      setIsAddDialogOpen(false);
      setNewTrip({
        origin: '',
        destination: '',
        truckPlate: '',
        trailer1Plate: '',
        trailer2Plate: null,
        driver: '',
        phone: '',
        departureDate: new Date().toISOString().split('T')[0],
        loadingTime: '08:00',
        arrivalDate: new Date(Date.now() + 2*24*60*60*1000).toISOString().split('T')[0],
        unloadingTime: '16:00',
        status: 'concluida',
        notes: null
      });
    }
  };

  return (
    <MainLayoutSimple>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Line Hall</h1>
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
                  <Label htmlFor="truckPlate" className="text-right">
                    Placa Cavalo
                  </Label>
                  <Input
                    id="truckPlate"
                    value={newTrip.truckPlate}
                    onChange={(e) => setNewTrip({...newTrip, truckPlate: e.target.value})}
                    className="col-span-3"
                    placeholder="ABC-1234"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="trailer1Plate" className="text-right">
                    Placa 1ª Carreta
                  </Label>
                  <Input
                    id="trailer1Plate"
                    value={newTrip.trailer1Plate}
                    onChange={(e) => setNewTrip({...newTrip, trailer1Plate: e.target.value})}
                    className="col-span-3"
                    placeholder="XYZ-9876"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="trailer2Plate" className="text-right">
                    Placa 2ª Carreta
                  </Label>
                  <Input
                    id="trailer2Plate"
                    value={newTrip.trailer2Plate || ''}
                    onChange={(e) => setNewTrip({...newTrip, trailer2Plate: e.target.value || null})}
                    className="col-span-3"
                    placeholder="Opcional"
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
                  <Label htmlFor="phone" className="text-right">
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    value={newTrip.phone}
                    onChange={(e) => setNewTrip({...newTrip, phone: e.target.value})}
                    className="col-span-3"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="departureDate" className="text-right">
                    Data Saída
                  </Label>
                  <Input
                    id="departureDate"
                    type="date"
                    value={newTrip.departureDate}
                    onChange={(e) => setNewTrip({...newTrip, departureDate: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="loadingTime" className="text-right">
                    Horário Carregamento
                  </Label>
                  <Input
                    id="loadingTime"
                    type="time"
                    value={newTrip.loadingTime}
                    onChange={(e) => setNewTrip({...newTrip, loadingTime: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="arrivalDate" className="text-right">
                    Data Chegada
                  </Label>
                  <Input
                    id="arrivalDate"
                    type="date"
                    value={newTrip.arrivalDate}
                    onChange={(e) => setNewTrip({...newTrip, arrivalDate: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unloadingTime" className="text-right">
                    Horário Descarregamento
                  </Label>
                  <Input
                    id="unloadingTime"
                    type="time"
                    value={newTrip.unloadingTime}
                    onChange={(e) => setNewTrip({...newTrip, unloadingTime: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select 
                    value={newTrip.status}
                    onValueChange={(value: 'no_show' | 'cancelada_pelo_cliente' | 'concluida') => 
                      setNewTrip({...newTrip, status: value})
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_show">No Show</SelectItem>
                      <SelectItem value="cancelada_pelo_cliente">Cancelada pelo Cliente</SelectItem>
                      <SelectItem value="concluida">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                  <TableHead>Veículos</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Datas</TableHead>
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
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="text-xs">
                          <span className="font-medium">Cavalo:</span> {trip.truckPlate}
                        </div>
                        <div className="text-xs mt-1">
                          <span className="font-medium">1ª Carreta:</span> {trip.trailer1Plate}
                        </div>
                        {trip.trailer2Plate && (
                          <div className="text-xs mt-1">
                            <span className="font-medium">2ª Carreta:</span> {trip.trailer2Plate}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div>{trip.driver}</div>
                        <div className="text-xs text-muted-foreground">{trip.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="text-xs">
                          <span className="font-medium">Saída:</span> {formatDate(trip.departureDate)}
                        </div>
                        <div className="text-xs">
                          <span className="font-medium">Carregamento:</span> {trip.loadingTime}
                        </div>
                        <div className="text-xs mt-1">
                          <span className="font-medium">Chegada:</span> {formatDate(trip.arrivalDate)}
                        </div>
                        <div className="text-xs">
                          <span className="font-medium">Descarregamento:</span> {trip.unloadingTime}
                        </div>
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
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleDeleteClick(trip.id)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending && tripToDelete === trip.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-600" />
                          )}
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
      
      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta viagem? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayoutSimple>
  );
};

export default LineHallNew;