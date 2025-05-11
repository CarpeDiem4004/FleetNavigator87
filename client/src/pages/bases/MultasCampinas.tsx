import React, { useState, useEffect } from 'react';
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
import { Textarea } from "@/components/ui/textarea";
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
    motorista: 'João Silva',
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
    motorista: 'Carlos Oliveira',
    data: '2025-04-18',
    valor: 130.16,
    pontos: 3,
    status: 'em_andamento',
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

// Lista de códigos de infração
const codigosInfracao: CodigoInfracao[] = [
  { codigo: '501-0', descricao: 'Dirigir veículo sem possuir CNH', valor: 880.41, pontos: 7 },
  { codigo: '502-9', descricao: 'Dirigir veículo com CNH cassada', valor: 880.41, pontos: 7 },
  { codigo: '503-7', descricao: 'Dirigir veículo com CNH suspensa', valor: 880.41, pontos: 7 },
  { codigo: '504-5', descricao: 'Dirigir veículo com categoria diferente da sua habilitação', valor: 880.41, pontos: 7 },
  { codigo: '505-3', descricao: 'Dirigir veículo com CNH vencida há mais de 30 dias', valor: 293.47, pontos: 3 },
  { codigo: '506-1', descricao: 'Entregar veículo à pessoa sem habilitação', valor: 880.41, pontos: 7 },
  { codigo: '507-0', descricao: 'Deixar o condutor de usar cinto de segurança', valor: 195.23, pontos: 5 },
  { codigo: '508-8', descricao: 'Transportar criança sem observar as normas de segurança', valor: 293.47, pontos: 5 },
  { codigo: '509-6', descricao: 'Dirigir sem atenção (usando celular, comendo, etc.)', valor: 130.16, pontos: 3 },
  { codigo: '510-0', descricao: 'Excesso de velocidade até 20% acima do permitido', valor: 130.16, pontos: 4 },
  { codigo: '511-8', descricao: 'Excesso de velocidade entre 20% e 50% acima do permitido', valor: 195.23, pontos: 5 },
  { codigo: '512-6', descricao: 'Excesso de velocidade acima de 50% do permitido', valor: 880.41, pontos: 7 },
  { codigo: '513-4', descricao: 'Avançar o sinal vermelho do semáforo', valor: 293.47, pontos: 7 },
  { codigo: '514-2', descricao: 'Transitar pela contramão', valor: 293.47, pontos: 7 },
  { codigo: '515-0', descricao: 'Estacionar em local proibido', valor: 130.16, pontos: 3 },
  { codigo: '516-9', descricao: 'Estacionar sobre faixa de pedestres', valor: 293.47, pontos: 5 },
  { codigo: '517-7', descricao: 'Parar sobre a faixa de pedestres na mudança de sinal', valor: 293.47, pontos: 4 },
  { codigo: '518-5', descricao: 'Não dar preferência ao pedestre na faixa', valor: 293.47, pontos: 5 },
  { codigo: '519-3', descricao: 'Dirigir sob influência de álcool', valor: 2934.70, pontos: 7 },
  { codigo: '520-7', descricao: 'Não utilizar tacógrafo quando obrigatório', valor: 1250.00, pontos: 5 },
  { codigo: '521-5', descricao: 'Conduzir veículo sem equipamento obrigatório', valor: 195.23, pontos: 3 },
  { codigo: '522-3', descricao: 'Transitar em local/horário não permitido para caminhões', valor: 130.16, pontos: 4 },
  { codigo: '523-1', descricao: 'Derramar/arremessar carga na via pública', valor: 195.23, pontos: 4 },
  { codigo: '524-0', descricao: 'Transitar com excesso de peso/dimensões', valor: 293.47, pontos: 5 },
  { codigo: '525-8', descricao: 'Transitar em faixa exclusiva de ônibus', valor: 293.47, pontos: 5 }
];

const MultasCampinas: React.FC = () => {
  const [filtro, setFiltro] = useState<'todas' | 'pendentes' | 'pagas' | 'outras'>('todas');
  const [isRegistrarMultaOpen, setIsRegistrarMultaOpen] = useState(false);
  const [formData, setFormData] = useState({
    placa: '',
    motorista: '',
    data: '',
    local: '',
    tipo: '',
    codigo: '',
    pontos: 0,
    valor: 0,
    vencimento: '',
    status: 'pendente',
    descricao: ''
  });
  
  // Simulando chamada de API com react-query
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

  const handlePlacaChange = (placa: string) => {
    const veiculo = veiculos?.find(v => v.placa === placa);
    if (veiculo) {
      setFormData(prev => ({
        ...prev,
        placa: veiculo.placa,
        motorista: veiculo.motorista
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        placa,
        motorista: ''
      }));
    }
  };

  const handleCodigoChange = (codigo: string) => {
    const infracao = codigosInfracao.find(c => c.codigo === codigo);
    if (infracao) {
      setFormData(prev => ({
        ...prev,
        codigo: infracao.codigo,
        tipo: infracao.descricao,
        valor: infracao.valor,
        pontos: infracao.pontos
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Em produção, isso enviaria os dados para a API
    console.log('Dados da multa:', formData);
    alert('Multa registrada com sucesso!');
    setIsRegistrarMultaOpen(false);
    // Resetar formulário
    setFormData({
      placa: '',
      motorista: '',
      data: '',
      local: '',
      tipo: '',
      codigo: '',
      pontos: 0,
      valor: 0,
      vencimento: '',
      status: 'pendente',
      descricao: ''
    });
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
          <Dialog open={isRegistrarMultaOpen} onOpenChange={setIsRegistrarMultaOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Registrar Nova Multa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center text-indigo-700">
                  <FileWarning className="w-5 h-5 mr-2" />
                  Registrar Nova Multa
                </DialogTitle>
                <DialogDescription>
                  Preencha os detalhes da multa abaixo
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="placa" className="text-right">
                      Placa do Veículo
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={formData.placa}
                        onValueChange={handlePlacaChange}
                        required
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione a placa" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Veículos Cadastrados</SelectLabel>
                            {isLoadingVeiculos ? (
                              <SelectItem value="carregando" disabled>
                                Carregando veículos...
                              </SelectItem>
                            ) : (
                              veiculos?.map(veiculo => (
                                <SelectItem key={veiculo.id} value={veiculo.placa}>
                                  {veiculo.placa} - {veiculo.base}
                                </SelectItem>
                              ))
                            )}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="motorista" className="text-right">
                      Motorista
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="motorista"
                        value={formData.motorista}
                        onChange={(e) => setFormData(prev => ({ ...prev, motorista: e.target.value }))}
                        className="w-full"
                        placeholder="Nome do motorista"
                        required
                        readOnly={!!formData.placa}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="data" className="text-right">
                      Data da Infração
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="data"
                        type="date"
                        value={formData.data}
                        onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                        className="w-full"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="local" className="text-right">
                      Local
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="local"
                        value={formData.local}
                        onChange={(e) => setFormData(prev => ({ ...prev, local: e.target.value }))}
                        className="w-full"
                        placeholder="Local da infração"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="codigo" className="text-right">
                      Código de Infração
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={formData.codigo}
                        onValueChange={handleCodigoChange}
                        required
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o código" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Infrações</SelectLabel>
                            {codigosInfracao.map(infracao => (
                              <SelectItem key={infracao.codigo} value={infracao.codigo}>
                                {infracao.codigo} - {infracao.descricao.substring(0, 30)}...
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="pontos" className="text-right">
                      Pontos
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="pontos"
                        type="number"
                        value={formData.pontos}
                        onChange={(e) => setFormData(prev => ({ ...prev, pontos: parseInt(e.target.value) }))}
                        className="w-full"
                        readOnly={!!formData.codigo}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="valor" className="text-right">
                      Valor (R$)
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="valor"
                        type="number"
                        step="0.01"
                        value={formData.valor}
                        onChange={(e) => setFormData(prev => ({ ...prev, valor: parseFloat(e.target.value) }))}
                        className="w-full"
                        readOnly={!!formData.codigo}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="vencimento" className="text-right">
                      Data de Vencimento
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="vencimento"
                        type="date"
                        value={formData.vencimento}
                        onChange={(e) => setFormData(prev => ({ ...prev, vencimento: e.target.value }))}
                        className="w-full"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">
                      Status
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                        required
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="em_andamento">Em andamento</SelectItem>
                            <SelectItem value="paga">Paga</SelectItem>
                            <SelectItem value="contestada">Contestada</SelectItem>
                            <SelectItem value="cancelada">Cancelada</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="descricao" className="text-right">
                      Descrição
                    </Label>
                    <div className="col-span-3">
                      <Textarea
                        id="descricao"
                        value={formData.descricao}
                        onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                        placeholder="Detalhes adicionais da infração"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button type="submit">Registrar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Placa</TableHead>
                        <TableHead>Motorista</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo de Infração</TableHead>
                        <TableHead>Pontos</TableHead>
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
                          <TableCell className="max-w-[250px] truncate" title={multa.tipo}>
                            {multa.tipo}
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {multa.pontos || 0}
                          </TableCell>
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