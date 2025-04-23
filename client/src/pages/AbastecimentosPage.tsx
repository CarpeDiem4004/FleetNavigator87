import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Fuel, MapPin, Calendar, BarChart, ArrowRight, Droplets, Car, Wallet } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

// Tipo para a estrutura de dados de um posto
type Posto = {
  id: number;
  nome: string;
  localizacao: string;
  tiposCombustivel: string[];
  ultimoAbastecimento: string;
  totalAbastecido: number;
  limiteMensal?: number;
  consumoAtual?: number;
  porcentagemConsumo?: number;
  cor: string;
  icone: React.ReactNode;
  rota: string;
};

export default function AbastecimentosPage() {
  const { toast } = useToast();
  const [postos, setPostos] = useState<Posto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Aqui seria feita uma chamada API para obter os dados dos postos
    // Simulando dados para demonstração
    const postosData: Posto[] = [
      {
        id: 1,
        nome: 'Posto Remédios',
        localizacao: 'Rua dos Remédios, 123',
        tiposCombustivel: ['Diesel S10', 'Gasolina', 'Etanol'],
        ultimoAbastecimento: '2025-04-20',
        totalAbastecido: 3500,
        limiteMensal: 5000,
        consumoAtual: 2350,
        porcentagemConsumo: 47,
        cor: 'bg-gradient-to-br from-blue-500 to-blue-700',
        icone: <Fuel className="h-10 w-10" />,
        rota: '/posto-remedios',
      },
      {
        id: 2,
        nome: 'Posto Contagem',
        localizacao: 'Av. Contagem, 456',
        tiposCombustivel: ['Diesel S10', 'Diesel Comum'],
        ultimoAbastecimento: '2025-04-22',
        totalAbastecido: 4200,
        limiteMensal: 7500,
        consumoAtual: 4200,
        porcentagemConsumo: 56,
        cor: 'bg-gradient-to-br from-green-500 to-green-700',
        icone: <Droplets className="h-10 w-10" />,
        rota: '/posto-contagem',
      },
      {
        id: 3,
        nome: 'Posto Alair',
        localizacao: 'Rua Alair Rodrigues, 789',
        tiposCombustivel: ['Diesel S10', 'AdBlue'],
        ultimoAbastecimento: '2025-04-21',
        totalAbastecido: 2100,
        limiteMensal: 6500,
        consumoAtual: 2100,
        porcentagemConsumo: 32,
        cor: 'bg-gradient-to-br from-purple-500 to-purple-700',
        icone: <Fuel className="h-10 w-10" />,
        rota: '/posto-alair',
      },
      {
        id: 4,
        nome: 'Posto São Paulo',
        localizacao: 'Av. Paulista, 1000',
        tiposCombustivel: ['Diesel S10', 'Gasolina Aditivada'],
        ultimoAbastecimento: '2025-04-23',
        totalAbastecido: 1800,
        limiteMensal: 8000,
        consumoAtual: 1800,
        porcentagemConsumo: 22.5,
        cor: 'bg-gradient-to-br from-red-500 to-red-700',
        icone: <Fuel className="h-10 w-10" />,
        rota: '/posto/saopaulo',
      },
      {
        id: 5,
        nome: 'Posto ABC',
        localizacao: 'Rua ABC, 200',
        tiposCombustivel: ['Diesel S10', 'Gasolina', 'Etanol'],
        ultimoAbastecimento: '2025-04-19',
        totalAbastecido: 3200,
        limiteMensal: 6000,
        consumoAtual: 3200,
        porcentagemConsumo: 53.3,
        cor: 'bg-gradient-to-br from-yellow-500 to-yellow-700',
        icone: <Fuel className="h-10 w-10" />,
        rota: '/posto/abc',
      },
      {
        id: 6,
        nome: 'Posto Guarulhos',
        localizacao: 'Av. Guarulhos, 500',
        tiposCombustivel: ['Diesel S10', 'Gasolina Comum'],
        ultimoAbastecimento: '2025-04-18',
        totalAbastecido: 2700,
        limiteMensal: 7000,
        consumoAtual: 2700,
        porcentagemConsumo: 38.6,
        cor: 'bg-gradient-to-br from-indigo-500 to-indigo-700',
        icone: <Fuel className="h-10 w-10" />,
        rota: '/posto/guarulhos',
      },
    ];

    setPostos(postosData);
    setIsLoading(false);
  }, []);

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <div className="flex flex-col gap-6">
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm">
            <h1 className="text-3xl font-bold text-blue-900">Postos de Abastecimento</h1>
            <p className="text-muted-foreground mt-2">
              Visão geral de todos os postos de abastecimento disponíveis para a frota. Clique em um posto para ver detalhes e gerenciar abastecimentos.
            </p>
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="border border-blue-200 rounded-lg px-4 py-3 bg-white flex items-center gap-2">
                <Fuel className="text-blue-700" />
                <div>
                  <h4 className="font-medium text-sm">Total de Postos</h4>
                  <p className="text-lg font-semibold">{postos.length}</p>
                </div>
              </div>
              <div className="border border-green-200 rounded-lg px-4 py-3 bg-white flex items-center gap-2">
                <Car className="text-green-700" />
                <div>
                  <h4 className="font-medium text-sm">Veículos Abastecidos</h4>
                  <p className="text-lg font-semibold">127</p>
                </div>
              </div>
              <div className="border border-purple-200 rounded-lg px-4 py-3 bg-white flex items-center gap-2">
                <Droplets className="text-purple-700" />
                <div>
                  <h4 className="font-medium text-sm">Combustível Utilizado</h4>
                  <p className="text-lg font-semibold">15.430L</p>
                </div>
              </div>
              <div className="border border-yellow-200 rounded-lg px-4 py-3 bg-white flex items-center gap-2">
                <Wallet className="text-yellow-700" />
                <div>
                  <h4 className="font-medium text-sm">Valor Total</h4>
                  <p className="text-lg font-semibold">R$ 98.750,00</p>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de cards de postos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {postos.map(posto => (
              <Card key={posto.id} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-200">
                <div className={`${posto.cor} p-4 flex justify-between items-center`}>
                  <div className="text-white">{posto.icone}</div>
                  <div className="bg-white/20 rounded-full p-2">
                    {posto.id}
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle>{posto.nome}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {posto.localizacao}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Último Abastecimento
                        </p>
                        <p className="text-sm font-medium">{formatarData(posto.ultimoAbastecimento)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Droplets className="w-3 h-3" />
                          Total Abastecido
                        </p>
                        <p className="text-sm font-medium">{posto.totalAbastecido.toLocaleString('pt-BR')}L</p>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Fuel className="w-3 h-3" />
                          Tipos de Combustível
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {posto.tiposCombustivel.map(tipo => (
                            <span key={tipo} className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">
                              {tipo}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {posto.limiteMensal && posto.consumoAtual && posto.porcentagemConsumo && (
                      <div className="pt-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <BarChart className="w-3 h-3" />
                            Consumo Mensal
                          </span>
                          <span className="text-xs font-medium">
                            {posto.porcentagemConsumo.toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={posto.porcentagemConsumo} 
                          className="h-2 bg-gray-200"
                          indicatorColor={
                            posto.porcentagemConsumo > 80 
                              ? 'bg-red-500' 
                              : posto.porcentagemConsumo > 60 
                                ? 'bg-amber-500' 
                                : 'bg-green-500'
                          }
                        />
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs font-medium">
                            R$ {posto.consumoAtual.toLocaleString('pt-BR')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            de R$ {posto.limiteMensal.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="default" className="gap-2 w-full">
                    <Link href={posto.rota}>
                      Ver Detalhes <ArrowRight className="h-4 w-4" />
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