import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Car, ArrowLeft, Calendar, Clock, RefreshCcw } from 'lucide-react';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface StoppedVehicle {
  plate: string;
  model: string;
  vehicle_type: string;
  dias_parado: number;
  ultima_viagem: string;
  data_ultima_viagem: string;
  base_name?: string;
  status: string;
}

const StoppedVehicles: React.FC = () => {
  const [, setLocation] = useLocation();

  // Query para buscar veículos parados
  const { data: stoppedVehicles, isLoading, refetch } = useQuery({
    queryKey: ['/api/stopped-vehicles'],
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  });

  const getDaysStatusColor = (days: number) => {
    if (days <= 2) return 'bg-green-100 text-green-800';
    if (days <= 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getVehicleTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'cavalo_mecanico': 'Cavalo Mecânico',
      'carreta': 'Carreta',
      'van': 'Van',
      'vuc': 'VUC',
      'toco': 'Toco',
      'truck': 'Truck',
      'fiorino': 'Fiorino'
    };
    return types[type] || type;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setLocation('/')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Veículos Parados</h1>
            <p className="text-gray-600">Veículos atualmente estacionados na garagem</p>
          </div>
        </div>
        
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Car className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total de Veículos</p>
                <p className="text-2xl font-bold">
                  {stoppedVehicles?.data?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Média de Dias</p>
                <p className="text-2xl font-bold">
                  {stoppedVehicles?.media_dias?.toFixed(1) || '0.0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Mais de 5 Dias</p>
                <p className="text-2xl font-bold">
                  {stoppedVehicles?.data?.filter((v: StoppedVehicle) => v.dias_parado > 5).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Veículos */}
      {stoppedVehicles?.data?.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Car className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum veículo parado
            </h3>
            <p className="text-gray-600">
              Todos os veículos estão em operação ou manutenção.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {stoppedVehicles?.data?.map((vehicle: StoppedVehicle, index: number) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {vehicle.plate}
                      </h3>
                      <Badge 
                        className={getDaysStatusColor(vehicle.dias_parado)}
                      >
                        {vehicle.dias_parado} dia{vehicle.dias_parado !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Modelo</p>
                        <p className="font-medium">{vehicle.model}</p>
                      </div>
                      
                      <div>
                        <p className="text-gray-600">Tipo</p>
                        <p className="font-medium">{getVehicleTypeLabel(vehicle.vehicle_type)}</p>
                      </div>
                      
                      <div>
                        <p className="text-gray-600">Última Viagem</p>
                        <p className="font-medium">{formatDate(vehicle.data_ultima_viagem)}</p>
                      </div>
                    </div>
                    
                    {vehicle.ultima_viagem && (
                      <div>
                        <p className="text-gray-600 text-sm">Destino da Última Viagem</p>
                        <p className="font-medium text-sm">{vehicle.ultima_viagem}</p>
                      </div>
                    )}
                    
                    {vehicle.base_name && (
                      <div>
                        <p className="text-gray-600 text-sm">Base</p>
                        <Badge variant="outline">{vehicle.base_name}</Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <Badge 
                      variant={vehicle.status === 'parado' ? 'destructive' : 'secondary'}
                    >
                      {vehicle.status === 'parado' ? 'Parado' : vehicle.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoppedVehicles;