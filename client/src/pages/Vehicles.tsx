import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Plus, Search, Edit, Eye, Trash2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { validateAndFormatPlate, applyPlateMask, getPlateFormatHint } from '@/lib/plate-utils';
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
  make: string; // marca do veículo
  year?: number; // ano do veículo
  fuelType?: string; // tipo de combustível
  mediaConsumoCombutivel?: number; // média de consumo em km/l
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
      return <Badge variant="default">{status}</Badge>;
  }
};

const Vehicles: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [location] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    base: '',
    plate: '',
  });

  // Handle URL parameters to set initial filters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const statusParam = urlParams.get('status');
    const baseParam = urlParams.get('base');
    
    if (statusParam || baseParam) {
      setFilters(prev => ({
        ...prev,
        status: statusParam || '',
        base: baseParam || ''
      }));
    }
  }, [location]);
  
  // Vamos garantir que a baseId seja inicializada com um valor válido
  const [newVehicle, setNewVehicle] = useState<NewVehicleData>({
    plate: '',
    model: '',
    vehicleType: 'cavalo_mecanico',
    status: 'em_operacao',
    baseId: 12, // Base "Gestão de Frotas" como padrão
    make: '',
    year: undefined,
    fuelType: 'Diesel',
    mediaConsumoCombutivel: undefined,
  });
  const [plateValidation, setPlateValidation] = useState<ReturnType<typeof validateAndFormatPlate> | null>(null);

  // Função para lidar com mudança de base e definir consumo automático para Line Hall
  const handleBaseChange = (baseId: string) => {
    const baseIdNumber = parseInt(baseId);
    setNewVehicle(prev => ({
      ...prev, 
      baseId: baseIdNumber,
      // Se for Line Hall Shopee (base_id 3), definir consumo automático de 2.5 km/l
      mediaConsumoCombutivel: baseIdNumber === 3 ? 2.5 : prev.mediaConsumoCombutivel
    }));
    
    if (baseIdNumber === 3) {
      toast({
        title: "Consumo definido automaticamente",
        description: "Média de 2.5 km/l aplicada para veículos do Line Hall Shopee",
      });
    }
  };
  
  // Obter veículos da API real  
  const { data: vehicles, isLoading, error } = useQuery({
    queryKey: ['/api/vehicles'],
    retry: 3,
    retryDelay: 1000,
    onError: (err) => {
      console.error("❌ ERRO NA QUERY VEÍCULOS:", err);
    },
    onSuccess: (data) => {
      console.log("✅ QUERY VEÍCULOS SUCESSO:", data);
    }
  });

  console.log("🚗 QUERY STATE COMPLETO:", { 
    vehicles, 
    vehiclesType: typeof vehicles,
    vehiclesIsArray: Array.isArray(vehicles),
    vehiclesLength: vehicles ? (Array.isArray(vehicles) ? vehicles.length : 'não-array') : 'undefined',
    isLoading, 
    error 
  });
  
  // Obter bases da API real
  const { data: bases, error: basesError } = useQuery({
    queryKey: ['/api/bases'],
    onError: (err) => {
      console.error("❌ ERRO NA QUERY BASES:", err);
    },
    onSuccess: (data) => {
      console.log("✅ QUERY BASES SUCESSO:", data);
    }
  });

  console.log("🏢 BASES STATE:", { bases, basesError });
  
  // Mutação para adicionar novo veículo
  const addVehicleMutation = useMutation({
    mutationFn: async (newVehicleData: NewVehicleData) => {
      console.log("Enviando dados para criação do veículo:", JSON.stringify(newVehicleData, null, 2));
      const response = await apiRequest('POST', '/api/vehicles', newVehicleData);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro retornado pela API:", errorData);
        throw new Error(errorData.message || "Erro ao adicionar veículo");
      }
      
      const resultData = await response.json();
      console.log("Veículo criado com sucesso:", JSON.stringify(resultData, null, 2));
      return resultData;
    },
    onSuccess: (data) => {
      console.log("Mutação concluída com sucesso, dados retornados:", data);
      
      // Atualizar a lista de veículos após a adição bem-sucedida
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      
      // Fechar o diálogo de adição
      setIsAddDialogOpen(false);
      
      // Limpar o formulário e definir valores padrão
      setNewVehicle({
        plate: '',
        model: '',
        vehicleType: 'cavalo_mecanico',
        status: 'em_operacao',
        baseId: 12,
        make: '',
        year: undefined,
        fuelType: 'Diesel',
        mediaConsumoCombutivel: undefined,
      });
      setPlateValidation(null);
      
      toast({
        title: "Veículo adicionado com sucesso",
        description: `O veículo ${data.plate} foi registrado no sistema.`,
        variant: "default"
      });
    },
    onError: (error: Error) => {
      console.error("Erro na mutação:", error);
      toast({
        title: "Erro ao adicionar veículo",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutação para excluir veículo
  const deleteVehicleMutation = useMutation({
    mutationFn: async (vehicleId: number) => {
      console.log(`Excluindo veículo ID: ${vehicleId}`);
      const response = await apiRequest('DELETE', `/api/vehicles/${vehicleId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro retornado pela API:", errorData);
        throw new Error(errorData.message || "Erro ao excluir veículo");
      }
      
      return vehicleId;
    },
    onSuccess: (vehicleId) => {
      console.log(`Veículo ID ${vehicleId} excluído com sucesso`);
      
      // Atualizar a lista de veículos após a exclusão bem-sucedida
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      
      toast({
        title: "Veículo excluído com sucesso",
        description: "O veículo foi removido do sistema.",
        variant: "default"
      });
    },
    onError: (error: Error) => {
      console.error("Erro ao excluir veículo:", error);
      toast({
        title: "Erro ao excluir veículo",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const filteredVehicles = React.useMemo(() => {
    console.log("🚗 PROCESSANDO VEÍCULOS:");
    console.log("- Dados brutos:", vehicles);
    console.log("- Tipo:", typeof vehicles);
    console.log("- É array?", Array.isArray(vehicles));
    console.log("- Filtros:", filters);
    
    // Se não há dados ainda, retorna array vazio
    if (!vehicles) {
      console.log("❌ Sem dados de veículos");
      return [];
    }
    
    // Verificar se é array direto ou está dentro de um objeto
    let vehiclesArray: any[] = [];
    if (Array.isArray(vehicles)) {
      vehiclesArray = vehicles;
      console.log("✅ Dados são array direto");
    } else if (vehicles && typeof vehicles === 'object') {
      console.log("⚠️ Dados não são array, verificando estrutura...");
      const vehiclesObj = vehicles as any;
      if (vehiclesObj.data && Array.isArray(vehiclesObj.data)) {
        vehiclesArray = vehiclesObj.data;
        console.log("✅ Encontrado array em vehicles.data");
      } else {
        console.log("❌ Estrutura de dados não reconhecida:", vehicles);
        return [];
      }
    } else {
      console.log("❌ Tipo de dados inválido:", typeof vehicles);
      return [];
    }
    
    if (vehiclesArray.length === 0) {
      console.log("⚠️ Array vazio");
      return [];
    }
    
    console.log(`📋 ${vehiclesArray.length} veículos para filtrar`);
    
    // Aplicar filtros
    const filtered = vehiclesArray.filter((vehicle: any) => {
      if (!vehicle) return false;
      
      const statusMatch = !filters.status || vehicle.status === filters.status;
      const typeMatch = !filters.type || vehicle.vehicleType === filters.type;
      const baseMatch = !filters.base || vehicle.baseId?.toString() === filters.base;
      const plateMatch = !filters.plate || vehicle.plate?.toLowerCase().includes(filters.plate.toLowerCase());
      
      return statusMatch && typeMatch && baseMatch && plateMatch;
    });
    
    console.log(`🎯 ${filtered.length} veículos após filtros`);
    return filtered;
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
                  {(() => {
                    // Handle different API response structures safely
                    try {
                      let baseData = [];
                      
                      if (bases && typeof bases === 'object') {
                        if ((bases as any)?.data && Array.isArray((bases as any).data)) {
                          baseData = (bases as any).data;
                        } else if (Array.isArray(bases)) {
                          baseData = bases;
                        }
                      }
                      
                      if (Array.isArray(baseData) && baseData.length > 0) {
                        return baseData.map((base: any) => (
                          <SelectItem key={base.id} value={base.id.toString()}>
                            {base.name} {base.location ? `(${base.location})` : ''}
                          </SelectItem>
                        ));
                      }
                    } catch (error) {
                      console.error('Erro ao processar bases no filtro:', error);
                    }
                    
                    // Fallback option
                    return <SelectItem value="12">Gestão de Frotas</SelectItem>;
                  })()}
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
                      {(() => {
                        try {
                          let baseData = [];
                          if (bases && typeof bases === 'object') {
                            if ((bases as any)?.data && Array.isArray((bases as any).data)) {
                              baseData = (bases as any).data;
                            } else if (Array.isArray(bases)) {
                              baseData = bases;
                            }
                          }
                          return baseData.find((base: any) => base.id === vehicle.baseId)?.name || '-';
                        } catch (error) {
                          return '-';
                        }
                      })()}
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
                          onClick={() => {
                            if (window.confirm(`Tem certeza que deseja excluir o veículo ${vehicle.plate}?`)) {
                              deleteVehicleMutation.mutate(vehicle.id);
                            }
                          }}
                          disabled={deleteVehicleMutation.isPending}
                        >
                          {deleteVehicleMutation.isPending && deleteVehicleMutation.variables === vehicle.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-600" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              
              {/* No data row */}
              {!isLoading && (!filteredVehicles || filteredVehicles.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <p className="text-lg font-medium">Nenhum veículo encontrado</p>
                      <p className="text-sm">Verifique os filtros aplicados ou adicione um novo veículo.</p>
                    </div>
                  </td>
                </tr>
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Veículo</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do veículo para adicionar à frota.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="plate" className="text-sm font-medium">Placa *</label>
                <div className="relative">
                  <Input 
                    id="plate" 
                    placeholder="ABC1234 ou ABC1D23" 
                    value={newVehicle.plate}
                    onChange={(e) => {
                      const maskedValue = applyPlateMask(e.target.value);
                      setNewVehicle({...newVehicle, plate: maskedValue});
                      
                      const validation = validateAndFormatPlate(maskedValue);
                      setPlateValidation(validation);
                    }}
                    className={`uppercase pr-10 ${
                      plateValidation?.isValid === true ? 'border-green-500' : 
                      plateValidation?.isValid === false && newVehicle.plate.length > 0 ? 'border-red-500' : ''
                    }`}
                    maxLength={8}
                  />
                  {plateValidation && newVehicle.plate.length > 0 && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {plateValidation.isValid ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {newVehicle.plate.length > 0 && (
                  <p className={`text-xs ${
                    plateValidation?.isValid ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {plateValidation?.isValid ? 
                      `✓ Placa válida - Formato ${plateValidation.type}${plateValidation.type === 'antiga' ? ' (ABC-1234)' : ' (ABC1D23)'}` :
                      getPlateFormatHint(newVehicle.plate)
                    }
                  </p>
                )}
              </div>
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="make" className="text-sm font-medium">Marca *</label>
                <Input 
                  id="make" 
                  placeholder="Ex: Ford"
                  value={newVehicle.make}
                  onChange={(e) => setNewVehicle({...newVehicle, make: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="model" className="text-sm font-medium">Modelo</label>
                <Input 
                  id="model" 
                  placeholder="Ex: Cargo"
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="year" className="text-sm font-medium">Ano</label>
                <Input 
                  id="year" 
                  type="number"
                  placeholder="Ex: 2023"
                  value={newVehicle.year || ''}
                  onChange={(e) => setNewVehicle({...newVehicle, year: e.target.value ? parseInt(e.target.value) : undefined})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="type" className="text-sm font-medium">Tipo de Veículo *</label>
                <Select
                  value={newVehicle.vehicleType || "cavalo_mecanico"}
                  onValueChange={(value: VehicleTypeType) => setNewVehicle({...newVehicle, vehicleType: value})}
                >
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent position="popper">
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
                <label htmlFor="fuelType" className="text-sm font-medium">Tipo de Combustível</label>
                <Select
                  value={newVehicle.fuelType || "Diesel"}
                  onValueChange={(value) => setNewVehicle({...newVehicle, fuelType: value})}
                >
                  <SelectTrigger id="fuelType" className="w-full">
                    <SelectValue placeholder="Selecione o combustível" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectGroup>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="Gasolina">Gasolina</SelectItem>
                      <SelectItem value="Etanol">Etanol</SelectItem>
                      <SelectItem value="GNV">GNV</SelectItem>
                      <SelectItem value="Flex">Flex</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="mediaConsumo" className="text-sm font-medium">Média de Consumo (km/l)</label>
                <Input 
                  id="mediaConsumo" 
                  type="number"
                  step="0.1"
                  placeholder="Ex: 2.5"
                  value={newVehicle.mediaConsumoCombutivel || ''}
                  onChange={(e) => setNewVehicle({...newVehicle, mediaConsumoCombutivel: e.target.value ? parseFloat(e.target.value) : undefined})}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="status" className="text-sm font-medium">Status</label>
                <Select
                  value={newVehicle.status || "em_operacao"}
                  onValueChange={(value: VehicleStatusType) => setNewVehicle({...newVehicle, status: value})}
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent position="popper">
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
                value={newVehicle.baseId ? newVehicle.baseId.toString() : "12"}
                onValueChange={handleBaseChange}
              >
                <SelectTrigger id="base" className="w-full">
                  <SelectValue placeholder="Selecione a base" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectGroup>
                    {(() => {
                      // Handle different API response structures safely
                      try {
                        let baseData = [];
                        
                        if (bases && typeof bases === 'object') {
                          if ((bases as any)?.data && Array.isArray((bases as any).data)) {
                            baseData = (bases as any).data;
                          } else if (Array.isArray(bases)) {
                            baseData = bases;
                          }
                        }
                        
                        if (Array.isArray(baseData) && baseData.length > 0) {
                          return baseData.map((base: any) => (
                            <SelectItem key={base.id} value={base.id.toString()}>
                              {base.name} {base.location ? `(${base.location})` : ''}
                            </SelectItem>
                          ));
                        }
                      } catch (error) {
                        console.error('Erro ao processar bases:', error);
                      }
                      
                      // Fallback option
                      return <SelectItem value="12">Gestão de Frotas</SelectItem>;
                    })()}
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
                // Validar placa antes de enviar
                if (!plateValidation?.isValid) {
                  toast({
                    title: 'Placa inválida',
                    description: 'Digite uma placa válida no formato antigo (ABC1234) ou Mercosul (ABC1D23).',
                    variant: 'destructive'
                  });
                  return;
                }
                
                // Garantir que temos um baseId válido (baseId: 12 para "Gestão de Frotas")
                const vehicleData = {
                  ...newVehicle,
                  plate: plateValidation.formatted, // Usar a placa formatada
                  baseId: newVehicle.baseId || 12
                };
                console.log("Enviando veículo para a API:", vehicleData);
                addVehicleMutation.mutate(vehicleData);
              }}
              disabled={!newVehicle.plate || !newVehicle.make || !plateValidation?.isValid}
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
