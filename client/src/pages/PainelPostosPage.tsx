import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Link } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Fuel, Droplets, ArrowRight } from 'lucide-react';

type Posto = {
  id: number;
  nome: string;
  descricao: string;
  icone: React.ReactNode;
  cor: string;
  rota: string;
};

export default function PainelPostosPage() {
  // Lista de postos disponíveis
  const postos: Posto[] = [
    {
      id: 1,
      nome: 'Posto Remédios',
      descricao: 'Controle de abastecimento e lavagem da frota no Posto Remédios.',
      icone: <Fuel className="h-10 w-10" />,
      cor: 'bg-gradient-to-br from-blue-500 to-blue-700',
      rota: '/posto-remedios'
    },
    {
      id: 2,
      nome: 'Posto Contagem',
      descricao: 'Gerenciamento de abastecimento e serviços realizados no Posto Contagem.',
      icone: <Droplets className="h-10 w-10" />,
      cor: 'bg-gradient-to-br from-green-500 to-green-700',
      rota: '/posto-contagem'
    }
  ];

  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold">Postos de Abastecimento</h1>
            <p className="text-muted-foreground mt-2">
              Selecione um posto para gerenciar abastecimentos e serviços.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {postos.map((posto) => (
              <Card key={posto.id} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
                <div className={`${posto.cor} p-4 flex justify-between items-center`}>
                  <div className="text-white">{posto.icone}</div>
                  <div className="bg-white/20 rounded-full p-2">
                    {posto.id}
                  </div>
                </div>
                <CardHeader>
                  <CardTitle>{posto.nome}</CardTitle>
                  <CardDescription>{posto.descricao}</CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-end">
                  <Button asChild variant="ghost" className="gap-2">
                    <Link href={posto.rota}>
                      Acessar <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}