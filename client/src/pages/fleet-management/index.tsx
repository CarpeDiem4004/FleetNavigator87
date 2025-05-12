import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
  Truck, 
  FileBarChart, 
  ListChecks, 
  CalendarDays, 
  Wrench, 
  Building2, 
  Building,
  ArrowRight,
  DollarSign,
  MessageSquare,
  AlertCircle,
  Package,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';

// Interfaces
interface Vehicle {
  id: number;
  status: string;
}

interface Maintenance {
  id: number;
  status: string;
}

// Renomeado para corresponder à importação em App.tsx
export default function FleetManagement() {
  // Buscar dados de veículos e manutenções para o dashboard
  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
    refetchOnWindowFocus: false
  });

  const { data: maintenances = [] } = useQuery<Maintenance[]>({
    queryKey: ['/api/maintenance'],
    refetchOnWindowFocus: false
  });
  
  // Buscar oficinas pendentes de aprovação
  const { data: pendingWorkshops = [] } = useQuery({
    queryKey: ['/api/workshops/pending'],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      try {
        const response = await fetch('/api/workshops/pending', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (!response.ok) {
          console.error(`Erro ao buscar oficinas pendentes: ${response.status}`);
          return [];
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar oficinas pendentes:', error);
        return [];
      }
    }
  });

  // Calcular estatísticas
  const totalVehicles = vehicles.length;
  const vehiclesInMaintenance = vehicles.filter(v => v.status === 'em_manutencao').length;
  const availableVehicles = totalVehicles - vehiclesInMaintenance;
  
  const pendingMaintenances = maintenances.filter(m => m.status === 'pendente').length;
  const inProgressMaintenances = maintenances.filter(m => ['aguardando_orcamento', 'em_andamento'].includes(m.status)).length;
  
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Truck className="mr-2 h-8 w-8" />
                Gestão de Frota
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie todos os aspectos da sua frota de veículos
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wrench className="h-5 w-5 text-primary" />
                  Sistema de Manutenção
                </CardTitle>
              </CardHeader>
              <CardFooter className="mt-auto">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/fleet-management/maintenance">
                    Acessar <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="h-5 w-5 text-primary" />
                  Oficina Murici
                </CardTitle>
              </CardHeader>
              <CardFooter className="mt-auto">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/oficina/murici">
                    Acessar <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5 text-primary" />
                  Estoque de Peças
                </CardTitle>
              </CardHeader>
              <CardFooter className="mt-auto">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/fleet-management/parts-inventory">
                    Acessar <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Negociação de Orçamentos
                </CardTitle>
              </CardHeader>
              <CardFooter className="mt-auto">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/fleet-management/budgets">
                    Acessar <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                  Oficinas Credenciadas
                  <div className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full ml-1">
                    Nova
                  </div>
                </CardTitle>
              </CardHeader>
              <CardFooter className="mt-auto">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/fleet-management/workshops">
                    Acessar <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Análise de Operações
                </CardTitle>
              </CardHeader>
              <CardFooter className="mt-auto">
                <Button variant="outline" className="w-full" disabled>
                  Em breve <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Visão Geral da Frota</CardTitle>
                <CardDescription>Resumo do estado atual dos veículos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-accent rounded-lg p-4">
                    <h3 className="text-lg font-medium">Total de Veículos</h3>
                    <p className="text-3xl font-bold mt-2">{totalVehicles || '0'}</p>
                    <div className="text-sm text-muted-foreground mt-1">Frota cadastrada</div>
                  </div>

                  <div className="bg-accent rounded-lg p-4">
                    <h3 className="text-lg font-medium">Veículos Disponíveis</h3>
                    <p className="text-3xl font-bold mt-2">{availableVehicles || '0'}</p>
                    <div className="text-sm text-muted-foreground mt-1">
                      {totalVehicles ? `${Math.round((availableVehicles / totalVehicles) * 100)}% da frota` : 'Sem dados'}
                    </div>
                  </div>

                  <div className="bg-accent rounded-lg p-4">
                    <h3 className="text-lg font-medium">Em Manutenção</h3>
                    <p className="text-3xl font-bold mt-2">{vehiclesInMaintenance || '0'}</p>
                    <div className="text-sm text-muted-foreground mt-1">
                      {totalVehicles ? `${Math.round((vehiclesInMaintenance / totalVehicles) * 100)}% da frota` : 'Sem dados'}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                  <Card className="bg-slate-50">
                    <CardHeader className="py-2 px-4">
                      <CardTitle className="text-sm">Manutenções pendentes</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-4">
                      <p className="text-2xl font-bold">{pendingMaintenances}</p>
                      <Button variant="link" className="p-0 h-auto" asChild>
                        <Link href="/fleet-management/maintenance?status=pendente">
                          Ver todas <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-50">
                    <CardHeader className="py-2 px-4">
                      <CardTitle className="text-sm">Manutenções em andamento</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-4">
                      <p className="text-2xl font-bold">{inProgressMaintenances}</p>
                      <Button variant="link" className="p-0 h-auto" asChild>
                        <Link href="/fleet-management/maintenance?status=em_andamento">
                          Ver todas <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className={`${pendingWorkshops.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50'}`}>
                    <CardHeader className="py-2 px-4">
                      <CardTitle className={`text-sm flex items-center ${pendingWorkshops.length > 0 ? 'text-amber-700' : ''}`}>
                        {pendingWorkshops.length > 0 && (
                          <AlertCircle className="h-4 w-4 mr-1 text-amber-500" />
                        )}
                        Oficinas pendentes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-4">
                      <p className={`text-2xl font-bold ${pendingWorkshops.length > 0 ? 'text-amber-600' : ''}`}>
                        {pendingWorkshops.length}
                      </p>
                      <Button 
                        variant="link" 
                        className={`p-0 h-auto ${pendingWorkshops.length > 0 ? 'text-amber-600' : ''}`} 
                        asChild
                      >
                        <Link href="/fleet-management/workshops/approval">
                          Aprovar oficinas <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}