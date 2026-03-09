import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Shield, FileSignature, FileSearch, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AccidentsPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <AlertCircle className="mr-2 h-8 w-8" />
                Sinistros e Roubos
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestão de ocorrências, sinistros e roubos da frota
              </p>
            </div>
            <Button>
              <FileSignature className="mr-2 h-4 w-4" />
              Registrar Nova Ocorrência
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">24</CardTitle>
                <CardDescription>Total de Ocorrências (2025)</CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">16</CardTitle>
                <CardDescription>Sinistros</CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">8</CardTitle>
                <CardDescription>Roubos/Furtos</CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">R$ 132.450</CardTitle>
                <CardDescription>Prejuízo Estimado</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSearch className="h-5 w-5 text-primary" />
                  Ocorrências Recentes
                </CardTitle>
                <CardDescription>
                  Últimos sinistros e roubos registrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      id: 1,
                      vehicle: 'ABC-1234',
                      type: 'Sinistro',
                      date: '15/04/2025',
                      location: 'Rodovia Dutra, km 230',
                      status: 'Em análise'
                    },
                    {
                      id: 2,
                      vehicle: 'DEF-5678',
                      type: 'Roubo',
                      date: '10/04/2025',
                      location: 'São Paulo, SP',
                      status: 'Reportado à polícia'
                    },
                    {
                      id: 3,
                      vehicle: 'GHI-9012',
                      type: 'Sinistro',
                      date: '02/04/2025',
                      location: 'Campinas, SP',
                      status: 'Concluído'
                    }
                  ].map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{item.vehicle} - {item.type}</h3>
                          <p className="text-sm text-muted-foreground">{item.date} • {item.location}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'Concluído' 
                            ? 'bg-green-100 text-green-800' 
                            : item.status === 'Em análise'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Análise de Ocorrências
                </CardTitle>
                <CardDescription>
                  Distribuição por tipo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm">Colisão</span>
                      </div>
                      <span className="text-sm font-medium">42%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm">Roubo</span>
                      </div>
                      <span className="text-sm font-medium">33%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '33%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-sm">Tombamento</span>
                      </div>
                      <span className="text-sm font-medium">15%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-sm">Outros</span>
                      </div>
                      <span className="text-sm font-medium">10%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}