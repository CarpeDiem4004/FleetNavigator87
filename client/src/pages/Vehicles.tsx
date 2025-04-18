import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Eye, Trash2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

type VehicleStatusType = 'em_operacao' | 'em_manutencao' | 'parado';
type VehicleTypeType = 'cavalo_mecanico' | 'carreta' | 'van' | 'utilitario';

// Os nomes usados aqui devem corresponder exatamente ao que o schema e tabela esperam
interface NewVehicleData {
  plate: string;
  model: string;
  vehicleType: VehicleTypeType; // mapeado para vehicle_type na coluna
  status: VehicleStatusType;
  baseId: number; // mapeado para base_id na coluna
}

const getStatusBadge = (status: VehicleStatusType) => {
  switch (status) {
    case 'em_operacao':
      return <Badge variant="success">Em operação</Badge>;
    case 'em_manutencao':
      return <Badge variant="warning">Em manutenção</Badge>;
    case 'parado':
      return <Badge variant="danger">Parado</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const Vehicles: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    base: '',
    plate: '',
  });
  
  // Vamos garantir que a baseId seja inicializada com um valor válido
  const [newVehicle, setNewVehicle] = useState<NewVehicleData>({
    plate: '',
    model: '',
    vehicleType: 'cavalo_mecanico',
    status: 'em_operacao',
    baseId: 12, // Base "Gestão de Frotas" como padrão
  });
  
  // Obter veículos da API real
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['/api/vehicles'],
  });
  
  // Obter bases da API real
  const { data: bases } = useQuery({
    queryKey: ['/api/bases'],
  });
  
  // Mutação para adicionar novo veículo
  const addVehicleMutation = useMutation({
    mutationFn: async (newVehicleData: NewVehicleData) => {
      const response = await apiRequest('POST', '/api/vehicles', newVehicleData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao adicionar veículo");
      }
      return await response.json();
    },
    onSuccess: () => {
      // Limpar o formulário e fechar o diálogo
      setNewVehicle({
        plate: '',
        model: '',
        vehicleType: 'cavalo_mecanico',
        status: 'em_operacao',
        baseId: 12, // Base padrão "Gestão de Frotas"
      });
      setIsAddDialogOpen(false);
      
      // Atualizar os dados
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      
      // Mostrar mensagem de sucesso
      toast({
        title: "Veículo adicionado com sucesso",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar veículo",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const filteredVehicles = React.useMemo(() => {
    if (!vehicles || !Array.isArray(vehicles)) return [];
    
    return vehicles.filter((vehicle: any) => {
      return (
        (filters.status === '' || vehicle.status === filters.status) &&
        (filters.type === '' || vehicle.vehicleType === filters.type) &&
        (filters.base === '' || vehicle.baseId.toString() === filters.base) &&
        (filters.plate === '' || vehicle.plate.toLowerCase().includes(filters.plate.toLowerCase()))
      );
    });
  }, [vehicles, filters]);
  
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Veículos</h2>
          <p className="mt-1 text-sm text-gray-500">Gerencie todos os veículos da sua frota.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Adicionar Veículo
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <SelectItem value="em_operacao">Em operação</SelectItem>
                  <SelectItem value="em_manutencao">Em manutenção</SelectItem>
                  <SelectItem value="parado">Parado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="tipo-filter" className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <Select
                value={filters.type}
                onValueChange={(value) => handleFilterChange('type', value)}
              >
                <SelectTrigger id="tipo-filter" className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="cavalo_mecanico">Cavalo mecânico</SelectItem>
                  <SelectItem value="carreta">Carreta</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                  <SelectItem value="utilitario">Utilitário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="base-filter" className="block text-sm font-medium text-gray-700 mb-1">Base</label>
              <Select
                value={filters.base}
                onValueChange={(value) => handleFilterChange('base', value)}
              >
                <SelectTrigger id="base-filter" className="w-full">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {Array.isArray(bases) && bases.map((base: any) => (
                    <SelectItem key={base.id} value={base.id.toString()}>
                      {base.name} ({base.location})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="placa-search" className="block text-sm font-medium text-gray-700 mb-1">Buscar por Placa</label>
              <div className="relative rounded-md shadow-sm">
                <Input
                  id="placa-search"
                  value={filters.plate}
                  onChange={(e) => handleFilterChange('plate', e.target.value)}
                  placeholder="ABC1234"
                  className="pr-10"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Placa
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modelo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base
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
                      <Skeleton className="h-5 w-16" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-24" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-28" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-28" />
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
                filteredVehicles.map((vehicle: any) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{vehicle.plate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{vehicle.model}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {vehicle.vehicleType === 'cavalo_mecanico' ? 'Cavalo mecânico' :
                         vehicle.vehicleType === 'carreta' ? 'Carreta' :
                         vehicle.vehicleType === 'van' ? 'Van' : 'Utilitário'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(vehicle.status as VehicleStatusType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Array.isArray(bases) && bases.find((base: any) => base.id === vehicle.baseId)?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4 text-primary-600" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4 text-gray-600" />
                        </Button>
                        <Button variant="ghost" size="icon">
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
      
      {/* Add Vehicle Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Veículo</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do veículo para adicionar à frota.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="plate" className="text-sm font-medium">Placa</label>
                <Input 
                  id="plate" 
                  placeholder="ABC1234" 
                  value={newVehicle.plate}
                  onChange={(e) => setNewVehicle({...newVehicle, plate: e.target.value})}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="model" className="text-sm font-medium">Modelo</label>
                <Input 
                  id="model" 
                  placeholder="Volvo FH 540"
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="type" className="text-sm font-medium">Tipo</label>
                <Select
                  value={newVehicle.vehicleType}
                  onValueChange={(value: VehicleTypeType) => setNewVehicle({...newVehicle, vehicleType: value})}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="cavalo_mecanico">Cavalo mecânico</SelectItem>
                      <SelectItem value="carreta">Carreta</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="utilitario">Utilitário</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="status" className="text-sm font-medium">Status</label>
                <Select
                  value={newVehicle.status}
                  onValueChange={(value: VehicleStatusType) => setNewVehicle({...newVehicle, status: value})}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="em_operacao">Em operação</SelectItem>
                      <SelectItem value="em_manutencao">Em manutenção</SelectItem>
                      <SelectItem value="parado">Parado</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="base" className="text-sm font-medium">Base</label>
              <Select
                value={newVehicle.baseId.toString()}
                onValueChange={(value) => setNewVehicle({...newVehicle, baseId: parseInt(value)})}
              >
                <SelectTrigger id="base">
                  <SelectValue placeholder="Selecione a base" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {Array.isArray(bases) && bases.map((base: any) => (
                      <SelectItem key={base.id} value={base.id.toString()}>
                        {base.name} ({base.location})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                // Garantir que temos um baseId válido (baseId: 12 para "Gestão de Frotas")
                const vehicleData = {
                  ...newVehicle,
                  baseId: newVehicle.baseId || 12
                };
                console.log("Enviando veículo para a API:", vehicleData);
                addVehicleMutation.mutate(vehicleData);
              }}
              disabled={!newVehicle.plate || !newVehicle.model}
            >
              {addVehicleMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Vehicles;
