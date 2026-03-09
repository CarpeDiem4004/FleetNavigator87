import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit, Eye, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';

type FuelType = 'diesel' | 'arla';

const getFuelBadge = (type: FuelType) => {
  switch (type) {
    case 'diesel':
      return <Badge variant="info">Diesel</Badge>;
    case 'arla':
      return <Badge variant="secondary">ARLA</Badge>;
    default:
      return <Badge>{type}</Badge>;
  }
};

const Refueling: React.FC = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    vehicle: '',
    fuelType: '',
    base: '',
  });
  
  const { data: refueling, isLoading } = useQuery({
    queryKey: ['/api/refueling', filters],
  });
  
  const { data: vehicles } = useQuery({
    queryKey: ['/api/vehicles'],
  });
  
  const { data: bases } = useQuery({
    queryKey: ['/api/bases'],
  });
  
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const filteredRefueling = React.useMemo(() => {
    if (!refueling) return [];
    
    return refueling.filter((item: any) => {
      return (
        (filters.vehicle === '' || item.vehiclePlate === filters.vehicle) &&
        (filters.fuelType === '' || item.fuelType === filters.fuelType) &&
        (filters.base === '' || item.baseId.toString() === filters.base)
      );
    });
  }, [refueling, filters]);
  
  const formatDecimal = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Abastecimentos</h2>
          <p className="mt-1 text-sm text-gray-500">Gerencie os abastecimentos da sua frota.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Adicionar Abastecimento
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="vehicle-filter" className="block text-sm font-medium text-gray-700 mb-1">Veículo</label>
              <Select
                value={filters.vehicle}
                onValueChange={(value) => handleFilterChange('vehicle', value)}
              >
                <SelectTrigger id="vehicle-filter" className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {vehicles?.map((vehicle: any) => (
                    <SelectItem key={vehicle.id} value={vehicle.plate}>
                      {vehicle.plate} - {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="fuel-type-filter" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Combustível</label>
              <Select
                value={filters.fuelType}
                onValueChange={(value) => handleFilterChange('fuelType', value)}
              >
                <SelectTrigger id="fuel-type-filter" className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="arla">ARLA</SelectItem>
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
                  {bases?.map((base: any) => (
                    <SelectItem key={base.id} value={base.id.toString()}>
                      {base.name} ({base.location})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Refueling Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Placa do Veículo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo de Combustível
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Litros
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  KM
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Motorista
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
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-16" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-16" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-28" />
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
                filteredRefueling.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.vehiclePlate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getFuelBadge(item.fuelType as FuelType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDecimal(parseFloat(item.liters))}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.km.toLocaleString('pt-BR')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bases?.find((base: any) => base.id === item.baseId)?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.driverName}
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
      
      {/* Add Refueling Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Abastecimento</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do abastecimento para adicionar ao sistema.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="vehicle" className="text-sm font-medium">Veículo</label>
              <Select>
                <SelectTrigger id="vehicle">
                  <SelectValue placeholder="Selecione o veículo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {vehicles?.map((vehicle: any) => (
                      <SelectItem key={vehicle.id} value={vehicle.plate}>
                        {vehicle.plate} - {vehicle.model}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="fuel-type" className="text-sm font-medium">Tipo de Combustível</label>
                <Select>
                  <SelectTrigger id="fuel-type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="arla">ARLA</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="liters" className="text-sm font-medium">Litros</label>
                <Input id="liters" type="number" step="0.01" placeholder="0.00" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="km" className="text-sm font-medium">KM</label>
                <Input id="km" type="number" placeholder="0" />
              </div>
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="base" className="text-sm font-medium">Base</label>
                <Select>
                  <SelectTrigger id="base">
                    <SelectValue placeholder="Selecione a base" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {bases?.map((base: any) => (
                        <SelectItem key={base.id} value={base.id.toString()}>
                          {base.name} ({base.location})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="driver-name" className="text-sm font-medium">Nome do Motorista</label>
              <Input id="driver-name" placeholder="Nome do motorista" />
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
    </div>
  );
};

export default Refueling;
