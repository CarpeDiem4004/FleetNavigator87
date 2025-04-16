import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, Bolt, Fuel, AlertTriangle } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import MaintenanceTable from '@/components/dashboard/MaintenanceTable';
import LineHallTable from '@/components/dashboard/LineHallTable';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard: React.FC = () => {
  const { data: vehicles, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ['/api/vehicles'],
  });
  
  const { data: maintenance, isLoading: isLoadingMaintenance } = useQuery({
    queryKey: ['/api/maintenance'],
  });
  
  const { data: refueling, isLoading: isLoadingRefueling } = useQuery({
    queryKey: ['/api/refueling'],
  });
  
  const { data: fines, isLoading: isLoadingFines } = useQuery({
    queryKey: ['/api/fines'],
  });
  
  // Calculate vehicle stats
  const vehicleStats = React.useMemo(() => {
    if (!vehicles) return { total: 0, active: 0, maintenance: 0, stopped: 0 };
    
    const active = vehicles.filter((v: any) => v.status === 'em_operacao').length;
    const inMaintenance = vehicles.filter((v: any) => v.status === 'em_manutencao').length;
    const stopped = vehicles.filter((v: any) => v.status === 'parado').length;
    
    return {
      total: vehicles.length,
      active,
      maintenance: inMaintenance,
      stopped
    };
  }, [vehicles]);
  
  // Calculate maintenance stats
  const maintenanceStats = React.useMemo(() => {
    if (!maintenance) return { pending: 0, ratio: 0 };
    
    const pending = maintenance.filter((m: any) => 
      m.status === 'em_andamento' || m.status === 'aguardando_pecas'
    ).length;
    
    // Mock calculation for ratio (this month's maintenance vs goal)
    const ratio = Math.min(pending / 5 * 100, 100); // 5 is a mock goal
    
    return { pending, ratio };
  }, [maintenance]);
  
  // Calculate fuel stats
  const fuelStats = React.useMemo(() => {
    if (!refueling) return { totalLiters: 0, totalCost: 0, avgConsumption: 0, trend: 0 };
    
    const totalLiters = refueling.reduce((acc: number, curr: any) => acc + parseFloat(curr.liters), 0);
    const totalCost = refueling.reduce((acc: number, curr: any) => {
      // Mocked price calculation
      const price = curr.fuelType === 'diesel' ? 5.40 : 3.20;
      return acc + (parseFloat(curr.liters) * price);
    }, 0);
    
    // Mock calculation for average consumption
    const avgConsumption = 2.8;
    
    // Mock trend (% change from last month)
    const trend = -5;
    
    return { totalLiters, totalCost, avgConsumption, trend };
  }, [refueling]);
  
  // Calculate fines stats
  const finesStats = React.useMemo(() => {
    if (!fines) return { totalValue: 0, count: 0, pending: 0, trend: 0 };
    
    const totalValue = fines.reduce((acc: number, curr: any) => acc + parseFloat(curr.value), 0);
    const count = fines.length;
    const pending = fines.filter((f: any) => f.status === 'pendente').length;
    
    // Mock trend (% change from last month)
    const trend = 12;
    
    return { totalValue, count, pending, trend };
  }, [fines]);
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Vehicles Card */}
        <StatCard
          icon={<Truck size={20} />}
          title="Total de Veículos"
          value={isLoadingVehicles ? <Skeleton className="h-6 w-12" /> : vehicleStats.total}
          iconBgColor="bg-primary-100"
          iconColor="text-primary-600"
        >
          <div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Status dos Veículos</span>
            </div>
            <div className="grid grid-cols-3 mt-2 gap-2">
              <div className="rounded-md bg-success-500 bg-opacity-10 py-1 px-2">
                <span className="text-xs font-medium text-success-500">
                  Ativos: {isLoadingVehicles ? <Skeleton className="inline-block h-3 w-6" /> : vehicleStats.active}
                </span>
              </div>
              <div className="rounded-md bg-warning-500 bg-opacity-10 py-1 px-2">
                <span className="text-xs font-medium text-warning-500">
                  Manutenção: {isLoadingVehicles ? <Skeleton className="inline-block h-3 w-6" /> : vehicleStats.maintenance}
                </span>
              </div>
              <div className="rounded-md bg-danger-500 bg-opacity-10 py-1 px-2">
                <span className="text-xs font-medium text-danger-500">
                  Parados: {isLoadingVehicles ? <Skeleton className="inline-block h-3 w-6" /> : vehicleStats.stopped}
                </span>
              </div>
            </div>
          </div>
        </StatCard>
        
        {/* Maintenance Card */}
        <StatCard
          icon={<Bolt size={20} />}
          title="Manutenções Pendentes"
          value={isLoadingMaintenance ? <Skeleton className="h-6 w-8" /> : maintenanceStats.pending}
          iconBgColor="bg-yellow-100"
          iconColor="text-yellow-600"
        >
          <div>
            <Progress value={maintenanceStats.ratio} className="h-2" />
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-500">
                Este Mês: {isLoadingMaintenance ? <Skeleton className="inline-block h-3 w-8" /> : `${Math.round(maintenanceStats.ratio)}%`}
              </span>
              <span className="text-xs text-gray-500">Meta: 25%</span>
            </div>
          </div>
        </StatCard>
        
        {/* Fuel Card */}
        <StatCard
          icon={<Fuel size={20} />}
          title="Consumo de Diesel"
          value={isLoadingRefueling ? 
            <Skeleton className="h-6 w-20" /> : 
            `${fuelStats.totalLiters.toLocaleString('pt-BR')} L`
          }
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        >
          <div>
            <div className="flex items-center">
              <span className={`text-sm ${fuelStats.trend < 0 ? 'text-green-600' : 'text-red-600'}`}>
                {isLoadingRefueling ? 
                  <Skeleton className="h-4 w-32" /> : 
                  <>
                    {fuelStats.trend < 0 ? '↓' : '↑'} {Math.abs(fuelStats.trend)}% comparado ao mês anterior
                  </>
                }
              </span>
            </div>
            <div className="grid grid-cols-2 mt-2 gap-2">
              <div className="rounded-md bg-gray-100 py-1 px-2">
                <span className="text-xs text-gray-600">
                  {isLoadingRefueling ? 
                    <Skeleton className="h-3 w-16" /> : 
                    formatCurrency(fuelStats.totalCost)
                  }
                </span>
              </div>
              <div className="rounded-md bg-gray-100 py-1 px-2">
                <span className="text-xs text-gray-600">
                  Média: {isLoadingRefueling ? 
                    <Skeleton className="inline-block h-3 w-10" /> : 
                    `${fuelStats.avgConsumption} km/L`
                  }
                </span>
              </div>
            </div>
          </div>
        </StatCard>
        
        {/* Fines Card */}
        <StatCard
          icon={<AlertTriangle size={20} />}
          title="Multas a Pagar"
          value={isLoadingFines ? 
            <Skeleton className="h-6 w-24" /> : 
            formatCurrency(finesStats.totalValue)
          }
          iconBgColor="bg-red-100"
          iconColor="text-red-600"
        >
          <div>
            <div className="flex items-center">
              <span className={`text-sm ${finesStats.trend < 0 ? 'text-green-600' : 'text-red-600'}`}>
                {isLoadingFines ? 
                  <Skeleton className="h-4 w-32" /> : 
                  <>
                    {finesStats.trend < 0 ? '↓' : '↑'} {Math.abs(finesStats.trend)}% comparado ao mês anterior
                  </>
                }
              </span>
            </div>
            <div className="grid grid-cols-2 mt-2 gap-2">
              <div className="rounded-md bg-gray-100 py-1 px-2">
                <span className="text-xs text-gray-600">
                  Infrações: {isLoadingFines ? 
                    <Skeleton className="inline-block h-3 w-6" /> : 
                    finesStats.count
                  }
                </span>
              </div>
              <div className="rounded-md bg-gray-100 py-1 px-2">
                <span className="text-xs text-gray-600">
                  Pendentes: {isLoadingFines ? 
                    <Skeleton className="inline-block h-3 w-6" /> : 
                    finesStats.pending
                  }
                </span>
              </div>
            </div>
          </div>
        </StatCard>
      </div>
      
      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MaintenanceTable />
        <LineHallTable />
      </div>
    </div>
  );
};

export default Dashboard;
