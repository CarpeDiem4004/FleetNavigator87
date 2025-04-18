import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Truck, FileBarChart, ListChecks, CalendarDays, Wrench, Building2, ArrowRight } from 'lucide-react';
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  Sistema de Manutenção
                </CardTitle>
                <CardDescription>
                  Acompanhe todas as manutenções
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Gerencie todo o ciclo de manutenções, desde a solicitação até a conclusão. Acompanhe o status, histórico de serviços e custos de manutenção por veículo.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/fleet-management/maintenance">
                    Gerenciar Manutenções <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Oficinas Credenciadas
                </CardTitle>
                <CardDescription>
                  Gerencie oficinas parceiras
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Cadastre e gerencie as oficinas parceiras autorizadas para realizar serviços em sua frota. Mantenha um registro de especialidades e qualidade de serviço.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/fleet-management/workshops">
                    Gerenciar Oficinas <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <FileBarChart className="h-5 w-5 text-primary" />
                  Análise de Operações
                </CardTitle>
                <CardDescription>
                  Avalie o desempenho operacional
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Monitore indicadores de desempenho da sua frota, incluindo custos operacionais, eficiência de combustível e disponibilidade de veículos.</p>
              </CardContent>
              <CardFooter>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
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
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}