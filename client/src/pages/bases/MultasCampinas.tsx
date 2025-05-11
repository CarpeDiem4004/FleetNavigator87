import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
  ChevronLeft,
  Plus,
  X
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Multa {
  id: number;
  placa: string;
  motorista: string;
  data: string;
  valor: number;
  status: 'pendente' | 'em_andamento' | 'paga' | 'contestada' | 'cancelada';
  tipo: string;
  local: string;
  pontos?: number;
  prazo_pagamento?: string;
  detalhes?: string;
  data_registro: string;
  base?: string;
}

interface Veiculo {
  id: number;
  placa: string;
  motorista: string;
  base: string;
  baseId: number;
}

interface CodigoInfracao {
  codigo: string;
  descricao: string;
  valor: number;
  pontos: number;
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

// Dados simulados - Em produção, seriam buscados do banco de dados
const mockMultas: Multa[] = [
  {
    id: 1,
    placa: 'ABC-1234',
    motorista: 'A identificar pela base',
    data: '2025-04-15',
    valor: 293.47,
    pontos: 4,
    status: 'pendente',
    tipo: 'Excesso de velocidade',
    local: 'Rodovia Anhanguera, km 120',
    prazo_pagamento: '2025-05-20',
    data_registro: '2025-04-20',
    base: 'Campinas'
  },
  {
    id: 2,
    placa: 'DEF-5678',
    motorista: 'A identificar pela base',
    data: '2025-04-18',
    valor: 130.16,
    pontos: 3,
    status: 'pendente',
    tipo: 'Estacionamento irregular',
    local: 'Av. Mofarrej, 346 - Vila Leopoldina',
    prazo_pagamento: '2025-05-25',
    data_registro: '2025-04-22',
    base: 'Campinas'
  },
  {
    id: 3,
    placa: 'GHI-9012',
    motorista: 'Ana Souza',
    data: '2025-04-10',
    valor: 880.41,
    pontos: 7,
    status: 'paga',
    tipo: 'Transitar em faixa exclusiva',
    local: 'Av. Paulista, 1000',
    prazo_pagamento: '2025-05-15',
    data_registro: '2025-04-15',
    base: 'Campinas'
  },
  {
    id: 4,
    placa: 'JKL-3456',
    motorista: 'Marcio Pereira',
    data: '2025-04-05',
    valor: 1250.00,
    pontos: 5,
    status: 'contestada',
    tipo: 'Não utilização do tacógrafo',
    local: 'Rodovia dos Bandeirantes, km 72',
    prazo_pagamento: '2025-05-10',
    data_registro: '2025-04-08',
    base: 'Campinas'
  },
  {
    id: 5,
    placa: 'MNO-7890',
    motorista: 'Roberto Almeida',
    data: '2025-04-01',
    valor: 195.23,
    pontos: 3,
    status: 'cancelada',
    tipo: 'Conduzir veículo sem equipamento obrigatório',
    local: 'Av. do Estado, 5000',
    prazo_pagamento: '2025-05-05',
    data_registro: '2025-04-03',
    base: 'Campinas'
  }
];

// Lista de veículos cadastrados no sistema
const mockVeiculos: Veiculo[] = [
  { id: 1, placa: 'ABC-1234', motorista: 'João Silva', base: 'Campinas', baseId: 2 },
  { id: 2, placa: 'DEF-5678', motorista: 'Carlos Oliveira', base: 'Campinas', baseId: 2 },
  { id: 3, placa: 'GHI-9012', motorista: 'Ana Souza', base: 'Campinas', baseId: 2 },
  { id: 4, placa: 'JKL-3456', motorista: 'Marcio Pereira', base: 'Campinas', baseId: 2 },
  { id: 5, placa: 'MNO-7890', motorista: 'Roberto Almeida', base: 'Campinas', baseId: 2 },
  { id: 6, placa: 'PQR-0123', motorista: 'Fernanda Dias', base: 'Campinas', baseId: 2 },
  { id: 7, placa: 'STU-4567', motorista: 'Lucas Barbosa', base: 'Campinas', baseId: 2 },
  { id: 8, placa: 'VWX-8901', motorista: 'Amanda Costa', base: 'Campinas', baseId: 2 }
];

const MultasCampinas: React.FC = () => {
  const [filtro, setFiltro] = useState<'todas' | 'pendentes' | 'pagas' | 'outras'>('todas');
  const [isIdentificarMotoristaOpen, setIsIdentificarMotoristaOpen] = useState(false);
  const [multaSelecionada, setMultaSelecionada] = useState<Multa | null>(null);
  const [motoristaIdentificado, setMotoristaIdentificado] = useState('');
  
  // Simulando chamada de API com react-query
  const { data, isLoading, error, refetch } = useQuery({
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

  // Buscar veículos da base
  const { data: veiculos, isLoading: isLoadingVeiculos } = useQuery({
    queryKey: ['/api/veiculos/base/2'],
    queryFn: async () => {
      // Em produção, isso seria substituído por uma chamada real à API
      // return await apiRequest('/api/veiculos/base/2');
      
      // Usando dados simulados por enquanto
      return new Promise<Veiculo[]>((resolve) => {
        setTimeout(() => resolve(mockVeiculos), 500);
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

  // Função para identificar o motorista responsável por uma multa
  const handleIdentificarMotorista = (multa: Multa) => {
    setMultaSelecionada(multa);
    setMotoristaIdentificado('');
    setIsIdentificarMotoristaOpen(true);
  };

  // Função para salvar a identificação do motorista
  const handleSalvarIdentificacao = async () => {
    if (multaSelecionada && motoristaIdentificado) {
      // Aqui seria implementada a chamada à API para atualizar o motorista da multa
      console.log(`Multa ID ${multaSelecionada.id} - Motorista identificado: ${motoristaIdentificado}`);
      
      // Simulando uma atualização no frontend
      if (data) {
        const multasAtualizadas = data.map(multa => 
          multa.id === multaSelecionada.id 
            ? { ...multa, motorista: motoristaIdentificado, status: 'em_andamento' as const } 
            : multa
        );
        
        // Em um ambiente real, isso seria feito pela API
        // Após a chamada à API, faríamos o refetch dos dados
        setTimeout(() => {
          refetch();
        }, 500);
      }
      
      setIsIdentificarMotoristaOpen(false);
      setMultaSelecionada(null);
      setMotoristaIdentificado('');
      
      // Exibir mensagem de sucesso
      alert('Motorista identificado com sucesso!');
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
          
          {/* Dialog para identificar motorista responsável pela multa */}
          <Dialog open={isIdentificarMotoristaOpen} onOpenChange={setIsIdentificarMotoristaOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center text-indigo-700">
                  <UserCheck className="w-5 h-5 mr-2" />
                  Identificar Motorista Responsável
                </DialogTitle>
                <DialogDescription>
                  Identifique o motorista responsável pela multa abaixo:
                </DialogDescription>
              </DialogHeader>
              
              {multaSelecionada && (
                <div className="py-4">
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="font-semibold text-right">Placa:</div>
                    <div className="col-span-3">{multaSelecionada.placa}</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="font-semibold text-right">Data:</div>
                    <div className="col-span-3">{formatDate(multaSelecionada.data)}</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="font-semibold text-right">Infração:</div>
                    <div className="col-span-3">{multaSelecionada.tipo}</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="font-semibold text-right">Local:</div>
                    <div className="col-span-3">{multaSelecionada.local}</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="font-semibold text-right">Valor:</div>
                    <div className="col-span-3">{formatCurrency(multaSelecionada.valor)}</div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4 mt-6">
                    <Label htmlFor="motorista-responsavel" className="text-right">
                      Motorista Responsável
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={motoristaIdentificado}
                        onValueChange={setMotoristaIdentificado}
                        required
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o motorista" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Motoristas da Base</SelectLabel>
                            {isLoadingVeiculos ? (
                              <SelectItem value="carregando" disabled>
                                Carregando motoristas...
                              </SelectItem>
                            ) : (
                              veiculos
                                ?.filter(v => v.baseId === 2) // Filtrando motoristas da base Campinas
                                .map(v => (
                                  <SelectItem key={v.id} value={v.motorista}>
                                    {v.motorista} - {v.placa}
                                  </SelectItem>
                                ))
                            )}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsIdentificarMotoristaOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSalvarIdentificacao} disabled={!motoristaIdentificado}>
                  Confirmar Identificação
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-6">
        <Tabs defaultValue="todas" className="w-full">
          <TabsList className="grid w-full sm:w-auto grid-cols-4 sm:inline-flex">
            <TabsTrigger value="todas" onClick={() => setFiltro('todas')}>
              Todas ({data?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="pendentes" onClick={() => setFiltro('pendentes')}>
              Pendentes ({data?.filter(m => m.status === 'pendente' || m.status === 'em_andamento').length || 0})
            </TabsTrigger>
            <TabsTrigger value="pagas" onClick={() => setFiltro('pagas')}>
              Pagas ({data?.filter(m => m.status === 'paga').length || 0})
            </TabsTrigger>
            <TabsTrigger value="outras" onClick={() => setFiltro('outras')}>
              Outras ({data?.filter(m => m.status === 'contestada' || m.status === 'cancelada').length || 0})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Multas Registradas</CardTitle>
          <CardDescription>
            {isLoading ? 'Carregando multas...' : 
             error ? 'Erro ao carregar multas' : 
             `Mostrando ${multasFiltradas.length} ${multasFiltradas.length === 1 ? 'multa' : 'multas'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Placa</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Infração</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20 float-right" /></TableCell>
                    </TableRow>
                  ))
                ) : multasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Nenhuma multa encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  multasFiltradas.map(multa => (
                    <TableRow key={multa.id}>
                      <TableCell className="font-medium">{multa.placa}</TableCell>
                      <TableCell>
                        {multa.motorista === 'A identificar pela base' ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                            A identificar
                          </Badge>
                        ) : multa.motorista}
                      </TableCell>
                      <TableCell>{formatDate(multa.data)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{multa.tipo}</TableCell>
                      <TableCell>{formatCurrency(multa.valor)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[multa.status]}>
                          {multa.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {multa.motorista === 'A identificar pela base' ? (
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => handleIdentificarMotorista(multa)}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Identificar
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm">
                            Detalhes
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultasCampinas;