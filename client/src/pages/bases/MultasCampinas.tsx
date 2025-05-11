import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileWarning, 
  Car, 
  Calendar, 
  DollarSign, 
  UserCheck, 
  AlertCircle,
  Check,
  ChevronLeft
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';

interface Multa {
  id: number;
  placa: string;
  motorista: string;
  data: string;
  valor: number;
  status: 'pendente' | 'em_andamento' | 'paga' | 'contestada' | 'cancelada';
  tipo: string;
  local: string;
  prazo_pagamento?: string;
  detalhes?: string;
  data_registro: string;
}

const statusColors = {
  pendente: 'bg-yellow-100 text-yellow-800',
  em_andamento: 'bg-blue-100 text-blue-800',
  paga: 'bg-green-100 text-green-800',
  contestada: 'bg-purple-100 text-purple-800',
  cancelada: 'bg-gray-100 text-gray-800'
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  } catch (error) {
    return dateString || 'Data inválida';
  }
};

const mockMultas: Multa[] = [
  {
    id: 1,
    placa: 'ABC-1234',
    motorista: 'João Silva',
    data: '2025-04-15',
    valor: 293.47,
    status: 'pendente',
    tipo: 'Excesso de velocidade',
    local: 'Rodovia Anhanguera, km 120',
    prazo_pagamento: '2025-05-20',
    data_registro: '2025-04-20'
  },
  {
    id: 2,
    placa: 'DEF-5678',
    motorista: 'Carlos Oliveira',
    data: '2025-04-18',
    valor: 130.16,
    status: 'em_andamento',
    tipo: 'Estacionamento irregular',
    local: 'Av. Mofarrej, 346 - Vila Leopoldina',
    prazo_pagamento: '2025-05-25',
    data_registro: '2025-04-22'
  },
  {
    id: 3,
    placa: 'GHI-9012',
    motorista: 'Ana Souza',
    data: '2025-04-10',
    valor: 880.41,
    status: 'paga',
    tipo: 'Transitar em faixa exclusiva',
    local: 'Av. Paulista, 1000',
    prazo_pagamento: '2025-05-15',
    data_registro: '2025-04-15'
  },
  {
    id: 4,
    placa: 'JKL-3456',
    motorista: 'Marcio Pereira',
    data: '2025-04-05',
    valor: 1250.00,
    status: 'contestada',
    tipo: 'Não utilização do tacógrafo',
    local: 'Rodovia dos Bandeirantes, km 72',
    prazo_pagamento: '2025-05-10',
    data_registro: '2025-04-08'
  },
  {
    id: 5,
    placa: 'MNO-7890',
    motorista: 'Roberto Almeida',
    data: '2025-04-01',
    valor: 195.23,
    status: 'cancelada',
    tipo: 'Conduzir veículo sem equipamento obrigatório',
    local: 'Av. do Estado, 5000',
    prazo_pagamento: '2025-05-05',
    data_registro: '2025-04-03'
  }
];

const MultasCampinas: React.FC = () => {
  const [filtro, setFiltro] = useState<'todas' | 'pendentes' | 'pagas' | 'outras'>('todas');
  
  // Simulando uma chamada de API com react-query (substituir por API real posteriormente)
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/bases/campinas/multas'],
    queryFn: async () => {
      // Em produção, isso seria substituído por uma chamada real à API
      // return await apiRequest('/api/bases/campinas/multas');
      
      // Usando dados simulados por enquanto
      return new Promise<Multa[]>((resolve) => {
        setTimeout(() => resolve(mockMultas), 1000);
      });
    }
  });

  const filtrarMultas = () => {
    if (!data) return [];
    
    switch (filtro) {
      case 'pendentes':
        return data.filter(multa => multa.status === 'pendente' || multa.status === 'em_andamento');
      case 'pagas':
        return data.filter(multa => multa.status === 'paga');
      case 'outras':
        return data.filter(multa => multa.status === 'contestada' || multa.status === 'cancelada');
      default:
        return data;
    }
  };

  const multasFiltradas = filtrarMultas();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/bases/campinas">
          <Button variant="ghost" className="mb-4">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar para Base Campinas
          </Button>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <FileWarning className="w-6 h-6 mr-2 text-indigo-600" />
              Gestão de Multas - Base Campinas
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize e gerencie as notificações de multas e infrações enviadas pela gestão central.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="todas" className="w-full" onValueChange={(value) => setFiltro(value as any)}>
        <TabsList className="mb-4">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
          <TabsTrigger value="pagas">Pagas</TabsTrigger>
          <TabsTrigger value="outras">Outras</TabsTrigger>
        </TabsList>

        <TabsContent value={filtro}>
          <Card>
            <CardHeader>
              <CardTitle>Infrações de Trânsito</CardTitle>
              <CardDescription>
                Multas recebidas pelos veículos da Base Campinas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col space-y-3">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="p-4 border rounded-md bg-red-50 text-red-800">
                  <AlertCircle className="w-5 h-5 inline-block mr-2" />
                  Erro ao carregar os dados de multas. Por favor, tente novamente mais tarde.
                </div>
              ) : multasFiltradas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma multa encontrada para o filtro selecionado.
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Placa</TableHead>
                        <TableHead>Motorista</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {multasFiltradas.map((multa) => (
                        <TableRow key={multa.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <Car className="w-4 h-4 mr-2 text-gray-500" />
                              {multa.placa}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <UserCheck className="w-4 h-4 mr-2 text-gray-500" />
                              {multa.motorista}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                              {formatDate(multa.data)}
                            </div>
                          </TableCell>
                          <TableCell>{multa.tipo}</TableCell>
                          <TableCell>
                            <div className="flex items-center font-semibold">
                              <DollarSign className="w-4 h-4 mr-1 text-gray-500" />
                              {formatCurrency(multa.valor)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[multa.status] || 'bg-gray-100'}>
                              {multa.status === 'pendente' && 'Pendente'}
                              {multa.status === 'em_andamento' && 'Em andamento'}
                              {multa.status === 'paga' && 'Paga'}
                              {multa.status === 'contestada' && 'Contestada'}
                              {multa.status === 'cancelada' && 'Cancelada'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MultasCampinas;