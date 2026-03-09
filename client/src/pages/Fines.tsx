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

type FineStatusType = 'pendente' | 'paga' | 'contestada';

const getStatusBadge = (status: FineStatusType) => {
  switch (status) {
    case 'pendente':
      return <Badge variant="warning">Pendente</Badge>;
    case 'paga':
      return <Badge variant="success">Paga</Badge>;
    case 'contestada':
      return <Badge variant="info">Contestada</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const Fines: React.FC = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    vehicle: '',
    status: '',
    driver: '',
  });
  
  const { data: fines, isLoading } = useQuery({
    queryKey: ['/api/fines', filters],
  });
  
  const { data: vehicles } = useQuery({
    queryKey: ['/api/vehicles'],
  });
  
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const filteredFines = React.useMemo(() => {
    if (!fines) return [];
    
    return fines.filter((fine: any) => {
      return (
        (filters.vehicle === '' || fine.vehiclePlate === filters.vehicle) &&
        (filters.status === '' || fine.status === filters.status) &&
        (filters.driver === '' || fine.driver.toLowerCase().includes(filters.driver.toLowerCase()))
      );
    });
  }, [fines, filters]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Multas</h2>
          <p className="mt-1 text-sm text-gray-500">Gerencie as multas da sua frota.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Adicionar Multa
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
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="paga">Paga</SelectItem>
                  <SelectItem value="contestada">Contestada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="driver-search" className="block text-sm font-medium text-gray-700 mb-1">Buscar por Motorista</label>
              <div className="relative rounded-md shadow-sm">
                <Input
                  id="driver-search"
                  value={filters.driver}
                  onChange={(e) => handleFilterChange('driver', e.target.value)}
                  placeholder="Nome do motorista"
                  className="pr-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fines Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Placa do Veículo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo de Infração
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Motorista
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
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
                      <Skeleton className="h-5 w-28" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-28" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-24" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-20" />
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
                filteredFines.map((fine: any) => (
                  <tr key={fine.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{fine.vehiclePlate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{fine.infraction}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{fine.driver}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(fine.date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(fine.status as FineStatusType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(parseFloat(fine.value))}</div>
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
      
      {/* Add Fine Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Multa</DialogTitle>
            <DialogDescription>
              Preencha os detalhes da multa para adicionar ao sistema.
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
            
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="infraction" className="text-sm font-medium">Tipo de Infração</label>
              <Input id="infraction" placeholder="Descreva a infração" />
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="driver" className="text-sm font-medium">Motorista</label>
              <Input id="driver" placeholder="Nome do motorista" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="date" className="text-sm font-medium">Data</label>
                <Input id="date" type="date" />
              </div>
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="value" className="text-sm font-medium">Valor (R$)</label>
                <Input id="value" type="number" step="0.01" placeholder="0.00" />
              </div>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="status" className="text-sm font-medium">Status</label>
              <Select>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="paga">Paga</SelectItem>
                    <SelectItem value="contestada">Contestada</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
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

export default Fines;
