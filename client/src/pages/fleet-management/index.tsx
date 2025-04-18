import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, FileBarChart, ListChecks, CalendarDays } from 'lucide-react';

// Renomeado para corresponder à importação em App.tsx
export default function FleetManagement() {
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
                  <FileBarChart className="h-5 w-5 text-primary" />
                  Análise de Operações
                </CardTitle>
                <CardDescription>
                  Avalie o desempenho operacional da frota
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Monitore indicadores de desempenho da sua frota, incluindo custos operacionais, eficiência de combustível e disponibilidade de veículos.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-primary" />
                  Planejamento de Manutenção
                </CardTitle>
                <CardDescription>
                  Programe e acompanhe manutenções
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Crie e gerencie planos de manutenção preventiva baseados em quilometragem ou tempo, reduzindo quebras e prolongando a vida útil dos veículos.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Gestão de Renovação de Frota
                </CardTitle>
                <CardDescription>
                  Planeje a renovação de veículos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Determine o momento ideal para substituir veículos com base na idade, quilometragem, custos de manutenção e valor de revenda.</p>
              </CardContent>
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
                    <p className="text-3xl font-bold mt-2">143</p>
                    <div className="text-sm text-muted-foreground mt-1">Frota ativa</div>
                  </div>

                  <div className="bg-accent rounded-lg p-4">
                    <h3 className="text-lg font-medium">Veículos Disponíveis</h3>
                    <p className="text-3xl font-bold mt-2">112</p>
                    <div className="text-sm text-muted-foreground mt-1">78% da frota</div>
                  </div>

                  <div className="bg-accent rounded-lg p-4">
                    <h3 className="text-lg font-medium">Em Manutenção</h3>
                    <p className="text-3xl font-bold mt-2">31</p>
                    <div className="text-sm text-muted-foreground mt-1">22% da frota</div>
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