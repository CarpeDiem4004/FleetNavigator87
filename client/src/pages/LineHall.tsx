import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Eye, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
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
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';

type TripStatusType = 'programada' | 'carregando' | 'aguardando_carga' | 'em_transito' | 'finalizada';

const getStatusBadge = (status: TripStatusType) => {
  switch (status) {
    case 'programada':
      return <Badge variant="purple">Programada</Badge>;
    case 'carregando':
      return <Badge variant="info">Carregando</Badge>;
    case 'aguardando_carga':
      return <Badge variant="warning">Aguardando carga</Badge>;
    case 'em_transito':
      return <Badge variant="success">Em trânsito</Badge>;
    case 'finalizada':
      return <Badge variant="secondary">Finalizada</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const LineHall: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    truck: '',
    destination: '',
    status: '',
  });
  
  const { data: lineHall = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/line-hall', filters],
  });
  
  const { data: vehicles = [] } = useQuery<any[]>({
    queryKey: ['/api/vehicles'],
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
  
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const filteredLineHall = React.useMemo(() => {
    // lineHall agora é sempre um array por causa do valor padrão
    return lineHall.filter((trip: any) => {
      return (
        (filters.truck === '' || trip.truckPlate === filters.truck) &&
        (filters.status === '' || trip.tripStatus === filters.status) &&
        (filters.destination === '' || trip.destination.toLowerCase().includes(filters.destination.toLowerCase()))
      );
    });
  }, [lineHall, filters]);
  
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter for truck vehicles (cavalo mecânico) and trailers (carreta)
  const getTrucks = () => {
    // vehicles agora é sempre um array por causa do valor padrão
    return vehicles.filter((v: any) => v.vehicleType === 'cavalo_mecanico');
  };
  
  const getTrailers = () => {
    // vehicles agora é sempre um array por causa do valor padrão
    return vehicles.filter((v: any) => v.vehicleType === 'carreta');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Line Hall</h2>
          <p className="mt-1 text-sm text-gray-500">Gerencie as viagens de sua frota.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Adicionar Viagem
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="truck-filter" className="block text-sm font-medium text-gray-700 mb-1">Cavalo</label>
              <Select
                value={filters.truck}
                onValueChange={(value) => handleFilterChange('truck', value)}
              >
                <SelectTrigger id="truck-filter" className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {getTrucks().map((vehicle: any) => (
                    <SelectItem key={vehicle.id} value={vehicle.plate}>
                      {vehicle.plate} - {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger id="status-filter" className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="programada">Programada</SelectItem>
                  <SelectItem value="carregando">Carregando</SelectItem>
                  <SelectItem value="aguardando_carga">Aguardando carga</SelectItem>
                  <SelectItem value="em_transito">Em trânsito</SelectItem>
                  <SelectItem value="finalizada">Finalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="destination-search" className="block text-sm font-medium text-gray-700 mb-1">Buscar por Destino</label>
              <div className="relative rounded-md shadow-sm">
                <Input
                  id="destination-search"
                  value={filters.destination}
                  onChange={(e) => handleFilterChange('destination', e.target.value)}
                  placeholder="Cidade - UF"
                  className="pr-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LineHall Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Composição
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Carregamento
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destino
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                Array(5).fill(0).map((_, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-40" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-24" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-32" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-3">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <Skeleton className="h-5 w-5 rounded-full" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                filteredLineHall.map((trip: any) => (
                  <tr key={trip.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {trip.truckPlate} + {trip.trailer1Plate}
                        {trip.trailer2Plate && ` + ${trip.trailer2Plate}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDateTime(trip.loadingTime)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{trip.destination}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(trip.tripStatus as TripStatusType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4 text-primary-600" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4 text-gray-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteClick(trip.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </Card>
      
      {/* Add Line Hall Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Viagem</DialogTitle>
            <DialogDescription>
              Preencha os detalhes da viagem para adicionar ao sistema.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="truck" className="text-sm font-medium">Cavalo</label>
              <Select>
                <SelectTrigger id="truck">
                  <SelectValue placeholder="Selecione o cavalo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {getTrucks().map((vehicle: any) => (
                      <SelectItem key={vehicle.id} value={vehicle.plate}>
                        {vehicle.plate} - {vehicle.model}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="trailer1" className="text-sm font-medium">Carreta 1</label>
              <Select>
                <SelectTrigger id="trailer1">
                  <SelectValue placeholder="Selecione a carreta 1" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {getTrailers().map((vehicle: any) => (
                      <SelectItem key={vehicle.id} value={vehicle.plate}>
                        {vehicle.plate} - {vehicle.model}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="trailer2" className="text-sm font-medium">Carreta 2 (opcional)</label>
              <Select>
                <SelectTrigger id="trailer2">
                  <SelectValue placeholder="Selecione a carreta 2 (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {getTrailers().map((vehicle: any) => (
                    <SelectItem key={vehicle.id} value={vehicle.plate}>
                      {vehicle.plate} - {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="loading-time" className="text-sm font-medium">Data/Hora de Carregamento</label>
                <Input id="loading-time" type="datetime-local" />
              </div>
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="status" className="text-sm font-medium">Status</label>
                <Select>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="programada">Programada</SelectItem>
                      <SelectItem value="carregando">Carregando</SelectItem>
                      <SelectItem value="aguardando_carga">Aguardando carga</SelectItem>
                      <SelectItem value="em_transito">Em trânsito</SelectItem>
                      <SelectItem value="finalizada">Finalizada</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="destination" className="text-sm font-medium">Destino</label>
              <Input id="destination" placeholder="Cidade - UF" />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Esta viagem será permanentemente excluída
              do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Excluir viagem
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LineHall;
