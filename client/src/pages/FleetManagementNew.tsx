import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, FileEdit, Eye, Wrench, Timer, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Tipo para pedidos de manutenção
interface MaintenanceRequest {
  id: number;
  vehiclePlate: string;
  baseId: number;
  baseName: string;
  requestDate: string;
  problem: string;
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  status: 'aguardando_analise' | 'aguardando_orcamento' | 'aguardando_aprovacao' | 'em_manutencao' | 'concluida' | 'cancelada';
  workshopId?: number;
  workshopName?: string;
  estimatedCost?: number;
  estimatedTime?: string; // em dias
  approvalDate?: string;
  startDate?: string;
  endDate?: string;
  observations?: string;
  statusHistory: StatusHistoryItem[];
}

// Tipo para histórico de status
interface StatusHistoryItem {
  id: number;
  date: string;
  status: string;
  observations: string;
  userId: number;
  userName: string;
}

// Tipo para oficinas
interface Workshop {
  id: number;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  specialties: string[];
}

// Dados mockados para pedidos de manutenção
const mockMaintenanceRequests: MaintenanceRequest[] = [
  {
    id: 1,
    vehiclePlate: 'ABC-1234',
    baseId: 1,
    baseName: 'São Paulo',
    requestDate: '2025-04-10',
    problem: 'Problema na embreagem, dificuldade para engatar marchas',
    priority: 'alta',
    status: 'em_manutencao',
    workshopId: 2,
    workshopName: 'Oficina Diesel Master',
    estimatedCost: 3500,
    estimatedTime: '3',
    approvalDate: '2025-04-11',
    startDate: '2025-04-12',
    observations: 'Peças sendo substituídas. Previsão de entrega em 3 dias.',
    statusHistory: [
      {
        id: 1,
        date: '2025-04-10T10:30:00Z',
        status: 'aguardando_analise',
        observations: 'Pedido recebido da base de São Paulo',
        userId: 1,
        userName: 'Ana Silva'
      },
      {
        id: 2,
        date: '2025-04-10T14:15:00Z',
        status: 'aguardando_orcamento',
        observations: 'Enviado para orçamento na Oficina Diesel Master',
        userId: 1,
        userName: 'Ana Silva'
      },
      {
        id: 3,
        date: '2025-04-11T09:20:00Z',
        status: 'aguardando_aprovacao',
        observations: 'Orçamento recebido: R$ 3.500,00 com prazo de 3 dias',
        userId: 2,
        userName: 'Carlos Santos'
      },
      {
        id: 4,
        date: '2025-04-11T11:45:00Z',
        status: 'em_manutencao',
        observations: 'Orçamento aprovado, veículo encaminhado para manutenção',
        userId: 3,
        userName: 'Marcos Oliveira'
      }
    ]
  },
  {
    id: 2,
    vehiclePlate: 'DEF-5678',
    baseId: 2,
    baseName: 'Rio de Janeiro',
    requestDate: '2025-04-09',
    problem: 'Falha no sistema de freios ABS',
    priority: 'urgente',
    status: 'aguardando_aprovacao',
    workshopId: 1,
    workshopName: 'Rede Pneus Auto Center',
    estimatedCost: 4200,
    estimatedTime: '2',
    observations: 'Aguardando aprovação do orçamento pela gerência',
    statusHistory: [
      {
        id: 5,
        date: '2025-04-09T08:15:00Z',
        status: 'aguardando_analise',
        observations: 'Pedido urgente recebido da base do Rio de Janeiro',
        userId: 2,
        userName: 'Carlos Santos'
      },
      {
        id: 6,
        date: '2025-04-09T09:30:00Z',
        status: 'aguardando_orcamento',
        observations: 'Enviado para orçamento urgente na Rede Pneus',
        userId: 2,
        userName: 'Carlos Santos'
      },
      {
        id: 7,
        date: '2025-04-09T15:40:00Z',
        status: 'aguardando_aprovacao',
        observations: 'Orçamento recebido: R$ 4.200,00 com prazo de 2 dias',
        userId: 1,
        userName: 'Ana Silva'
      }
    ]
  },
  {
    id: 3,
    vehiclePlate: 'GHI-9012',
    baseId: 3,
    baseName: 'Belo Horizonte',
    requestDate: '2025-04-05',
    problem: 'Manutenção preventiva - troca de óleo e filtros',
    priority: 'baixa',
    status: 'concluida',
    workshopId: 3,
    workshopName: 'Posto Truck Stop',
    estimatedCost: 850,
    estimatedTime: '1',
    approvalDate: '2025-04-05',
    startDate: '2025-04-06',
    endDate: '2025-04-06',
    observations: 'Manutenção concluída dentro do prazo',
    statusHistory: [
      {
        id: 8,
        date: '2025-04-05T11:20:00Z',
        status: 'aguardando_analise',
        observations: 'Pedido de manutenção preventiva recebido',
        userId: 3,
        userName: 'Marcos Oliveira'
      },
      {
        id: 9,
        date: '2025-04-05T13:00:00Z',
        status: 'aguardando_orcamento',
        observations: 'Enviado para orçamento no Posto Truck Stop',
        userId: 3,
        userName: 'Marcos Oliveira'
      },
      {
        id: 10,
        date: '2025-04-05T14:30:00Z',
        status: 'aguardando_aprovacao',
        observations: 'Orçamento recebido: R$ 850,00 com prazo de 1 dia',
        userId: 1,
        userName: 'Ana Silva'
      },
      {
        id: 11,
        date: '2025-04-05T15:15:00Z',
        status: 'em_manutencao',
        observations: 'Orçamento aprovado, veículo encaminhado para manutenção',
        userId: 2,
        userName: 'Carlos Santos'
      },
      {
        id: 12,
        date: '2025-04-06T16:45:00Z',
        status: 'concluida',
        observations: 'Manutenção concluída e veículo liberado',
        userId: 3,
        userName: 'Marcos Oliveira'
      }
    ]
  },
  {
    id: 4,
    vehiclePlate: 'JKL-3456',
    baseId: 1,
    baseName: 'São Paulo',
    requestDate: '2025-04-11',
    problem: 'Vazamento de óleo no motor',
    priority: 'media',
    status: 'aguardando_orcamento',
    observations: 'Enviado para orçamento em duas oficinas para comparação',
    statusHistory: [
      {
        id: 13,
        date: '2025-04-11T09:10:00Z',
        status: 'aguardando_analise',
        observations: 'Novo pedido recebido da base de São Paulo',
        userId: 1,
        userName: 'Ana Silva'
      },
      {
        id: 14,
        date: '2025-04-11T10:45:00Z',
        status: 'aguardando_orcamento',
        observations: 'Enviado para orçamento em duas oficinas para comparação',
        userId: 1,
        userName: 'Ana Silva'
      }
    ]
  },
  {
    id: 5,
    vehiclePlate: 'MNO-7890',
    baseId: 2,
    baseName: 'Rio de Janeiro',
    requestDate: '2025-04-08',
    problem: 'Problema elétrico no painel, luzes de alerta acendendo',
    priority: 'media',
    status: 'aguardando_analise',
    observations: 'Aguardando análise da equipe técnica',
    statusHistory: [
      {
        id: 15,
        date: '2025-04-08T16:30:00Z',
        status: 'aguardando_analise',
        observations: 'Pedido recebido no final do expediente, será analisado na manhã seguinte',
        userId: 2,
        userName: 'Carlos Santos'
      }
    ]
  }
];

// Dados mockados para oficinas
const mockWorkshops: Workshop[] = [
  {
    id: 1,
    name: 'Rede Pneus Auto Center',
    phone: '(11) 3456-7890',
    address: 'Av. Brasil, 1500',
    city: 'São Paulo',
    state: 'SP',
    specialties: ['Freios', 'Suspensão', 'Pneus']
  },
  {
    id: 2,
    name: 'Oficina Diesel Master',
    phone: '(11) 2345-6789',
    address: 'Rua das Oficinas, 450',
    city: 'São Paulo',
    state: 'SP',
    specialties: ['Motor', 'Câmbio', 'Embreagem']
  },
  {
    id: 3,
    name: 'Posto Truck Stop',
    phone: '(31) 3456-7890',
    address: 'Rodovia BR-381, Km 450',
    city: 'Belo Horizonte',
    state: 'MG',
    specialties: ['Manutenção Preventiva', 'Troca de Óleo', 'Filtros']
  }
];

// Função para traduzir os status de manutenção
const translateMaintenanceStatus = (status: string): string => {
  const statuses: Record<string, string> = {
    aguardando_analise: 'Aguardando Análise',
    aguardando_orcamento: 'Aguardando Orçamento',
    aguardando_aprovacao: 'Aguardando Aprovação',
    em_manutencao: 'Em Manutenção',
    concluida: 'Concluída',
    cancelada: 'Cancelada'
  };
  return statuses[status] || status;
};

// Função para traduzir as prioridades
const translatePriority = (priority: string): string => {
  const priorities: Record<string, string> = {
    baixa: 'Baixa',
    media: 'Média',
    alta: 'Alta',
    urgente: 'Urgente'
  };
  return priorities[priority] || priority;
};

// Função para obter a classe CSS para o badge de status
const getStatusBadgeClass = (status: string): string => {
  const classes: Record<string, string> = {
    aguardando_analise: 'bg-blue-100 text-blue-800',
    aguardando_orcamento: 'bg-purple-100 text-purple-800',
    aguardando_aprovacao: 'bg-yellow-100 text-yellow-800',
    em_manutencao: 'bg-orange-100 text-orange-800',
    concluida: 'bg-green-100 text-green-800',
    cancelada: 'bg-red-100 text-red-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

// Função para obter a classe CSS para o badge de prioridade
const getPriorityBadgeClass = (priority: string): string => {
  const classes: Record<string, string> = {
    baixa: 'bg-green-100 text-green-800',
    media: 'bg-blue-100 text-blue-800',
    alta: 'bg-orange-100 text-orange-800',
    urgente: 'bg-red-100 text-red-800'
  };
  return classes[priority] || 'bg-gray-100 text-gray-800';
};

// Função para formatar datas
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

// Função para formatar valores monetários
const formatCurrency = (value: number | undefined): string => {
  if (value === undefined) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Função para formatar data e hora
const formatDateTime = (dateTimeString: string): string => {
  const date = new Date(dateTimeString);
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
};

// Componente para os ícones de status
const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'aguardando_analise':
      return <AlertCircle className="h-5 w-5 text-blue-500" />;
    case 'aguardando_orcamento':
      return <Clock className="h-5 w-5 text-purple-500" />;
    case 'aguardando_aprovacao':
      return <Timer className="h-5 w-5 text-yellow-500" />;
    case 'em_manutencao':
      return <Wrench className="h-5 w-5 text-orange-500" />;
    case 'concluida':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'cancelada':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-gray-500" />;
  }
};

const FleetManagementNew: React.FC = () => {
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>(mockMaintenanceRequests);
  const [workshops, setWorkshops] = useState<Workshop[]>(mockWorkshops);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isAddStatusDialogOpen, setIsAddStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<{
    status: string;
    observations: string;
    estimatedCost?: number;
    estimatedTime?: string;
    workshopId?: number;
  }>({
    status: '',
    observations: ''
  });

  // Filtrar pedidos de manutenção com base no termo de busca
  const filteredRequests = maintenanceRequests.filter(
    (request) => 
      request.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) || 
      request.baseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.problem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.workshopName && request.workshopName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filtrar por status atual
  const getRequestsByStatus = (status?: string | string[]) => {
    if (!status) return filteredRequests;
    
    if (Array.isArray(status)) {
      return filteredRequests.filter(request => status.includes(request.status));
    }
    
    return filteredRequests.filter(request => request.status === status);
  };

  // Adicionar nova atualização de status
  const handleAddStatusUpdate = () => {
    if (!selectedRequest || !newStatus.status || !newStatus.observations) return;
    
    const updatedRequest = { ...selectedRequest };
    const date = new Date().toISOString();
    
    // Atualizar histórico de status
    updatedRequest.statusHistory = [
      ...updatedRequest.statusHistory,
      {
        id: Date.now(),
        date,
        status: newStatus.status,
        observations: newStatus.observations,
        userId: 1, // ID do usuário atual
        userName: 'Ana Silva' // Nome do usuário atual
      }
    ];
    
    // Atualizar o status atual
    updatedRequest.status = newStatus.status as any;
    
    // Atualizar outros campos com base no status
    if (newStatus.status === 'aguardando_aprovacao') {
      updatedRequest.estimatedCost = newStatus.estimatedCost;
      updatedRequest.estimatedTime = newStatus.estimatedTime;
      
      if (newStatus.workshopId) {
        const workshop = workshops.find(w => w.id === newStatus.workshopId);
        if (workshop) {
          updatedRequest.workshopId = workshop.id;
          updatedRequest.workshopName = workshop.name;
        }
      }
    } else if (newStatus.status === 'em_manutencao') {
      updatedRequest.approvalDate = date.split('T')[0];
      updatedRequest.startDate = date.split('T')[0];
    } else if (newStatus.status === 'concluida') {
      updatedRequest.endDate = date.split('T')[0];
    }
    
    // Atualizar observações
    updatedRequest.observations = newStatus.observations;
    
    // Atualizar o estado
    const updatedRequests = maintenanceRequests.map(req => 
      req.id === selectedRequest.id ? updatedRequest : req
    );
    
    setMaintenanceRequests(updatedRequests);
    setIsAddStatusDialogOpen(false);
    setNewStatus({ status: '', observations: '' });
    setSelectedRequest(updatedRequest);
  };

  // Componente para o histórico de status
  const StatusHistory = ({ history }: { history: StatusHistoryItem[] }) => (
    <div className="space-y-4 max-h-96 overflow-y-auto p-2">
      {history.map((item) => (
        <div key={item.id} className="border p-3 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <StatusIcon status={item.status} />
            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(item.status)}`}>
              {translateMaintenanceStatus(item.status)}
            </span>
            <span className="text-sm text-muted-foreground ml-auto">
              {formatDateTime(item.date)}
            </span>
          </div>
          <p className="text-sm mb-1">{item.observations}</p>
          <p className="text-xs text-muted-foreground">Por: {item.userName}</p>
        </div>
      ))}
    </div>
  );

  return (
    <MainLayoutSimple>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Gestão de Frota</h1>
            <p className="text-gray-500">
              Controle e acompanhamento de pedidos de manutenção
            </p>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Todos os Pedidos</TabsTrigger>
            <TabsTrigger value="pending">Aguardando Análise</TabsTrigger>
            <TabsTrigger value="estimate">Aguardando Orçamento</TabsTrigger>
            <TabsTrigger value="approval">Aguardando Aprovação</TabsTrigger>
            <TabsTrigger value="inprogress">Em Manutenção</TabsTrigger>
            <TabsTrigger value="completed">Concluídos</TabsTrigger>
          </TabsList>
          
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">
                Pedidos de Manutenção
              </h3>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar pedidos..."
                className="pl-8 w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Base</TableHead>
                      <TableHead>Problema</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Oficina</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getRequestsByStatus().map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.vehiclePlate}</TableCell>
                        <TableCell>{request.baseName}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={request.problem}>
                          {request.problem}
                        </TableCell>
                        <TableCell>{formatDate(request.requestDate)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityBadgeClass(request.priority)}`}>
                            {translatePriority(request.priority)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(request.status)}`}>
                            {translateMaintenanceStatus(request.status)}
                          </span>
                        </TableCell>
                        <TableCell>{request.workshopName || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsDetailsDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsAddStatusDialogOpen(true);
                                setNewStatus({ 
                                  status: '',
                                  observations: ''
                                });
                              }}
                            >
                              <FileEdit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Base</TableHead>
                      <TableHead>Problema</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getRequestsByStatus('aguardando_analise').map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.vehiclePlate}</TableCell>
                        <TableCell>{request.baseName}</TableCell>
                        <TableCell className="max-w-[300px] truncate" title={request.problem}>
                          {request.problem}
                        </TableCell>
                        <TableCell>{formatDate(request.requestDate)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityBadgeClass(request.priority)}`}>
                            {translatePriority(request.priority)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsDetailsDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsAddStatusDialogOpen(true);
                                setNewStatus({ 
                                  status: 'aguardando_orcamento',
                                  observations: ''
                                });
                              }}
                            >
                              <FileEdit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="estimate" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Base</TableHead>
                      <TableHead>Problema</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Oficina</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getRequestsByStatus('aguardando_orcamento').map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.vehiclePlate}</TableCell>
                        <TableCell>{request.baseName}</TableCell>
                        <TableCell className="max-w-[300px] truncate" title={request.problem}>
                          {request.problem}
                        </TableCell>
                        <TableCell>{formatDate(request.requestDate)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityBadgeClass(request.priority)}`}>
                            {translatePriority(request.priority)}
                          </span>
                        </TableCell>
                        <TableCell>{request.workshopName || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsDetailsDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsAddStatusDialogOpen(true);
                                setNewStatus({ 
                                  status: 'aguardando_aprovacao',
                                  observations: ''
                                });
                              }}
                            >
                              <FileEdit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="approval" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Base</TableHead>
                      <TableHead>Problema</TableHead>
                      <TableHead>Oficina</TableHead>
                      <TableHead>Custo Estimado</TableHead>
                      <TableHead>Tempo Estimado</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getRequestsByStatus('aguardando_aprovacao').map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.vehiclePlate}</TableCell>
                        <TableCell>{request.baseName}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={request.problem}>
                          {request.problem}
                        </TableCell>
                        <TableCell>{request.workshopName}</TableCell>
                        <TableCell>{formatCurrency(request.estimatedCost)}</TableCell>
                        <TableCell>{request.estimatedTime} dias</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsDetailsDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsAddStatusDialogOpen(true);
                                setNewStatus({ 
                                  status: 'em_manutencao',
                                  observations: 'Orçamento aprovado, veículo encaminhado para manutenção'
                                });
                              }}
                            >
                              <FileEdit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="inprogress" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Base</TableHead>
                      <TableHead>Problema</TableHead>
                      <TableHead>Oficina</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>Previsão</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getRequestsByStatus('em_manutencao').map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.vehiclePlate}</TableCell>
                        <TableCell>{request.baseName}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={request.problem}>
                          {request.problem}
                        </TableCell>
                        <TableCell>{request.workshopName}</TableCell>
                        <TableCell>{formatDate(request.startDate)}</TableCell>
                        <TableCell>
                          {request.startDate && request.estimatedTime
                            ? formatDate(
                                new Date(
                                  new Date(request.startDate).getTime() + 
                                  parseInt(request.estimatedTime) * 24 * 60 * 60 * 1000
                                ).toISOString().split('T')[0]
                              )
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsDetailsDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsAddStatusDialogOpen(true);
                                setNewStatus({ 
                                  status: 'concluida',
                                  observations: 'Manutenção concluída e veículo liberado'
                                });
                              }}
                            >
                              <FileEdit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Base</TableHead>
                      <TableHead>Problema</TableHead>
                      <TableHead>Oficina</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>Conclusão</TableHead>
                      <TableHead>Custo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getRequestsByStatus('concluida').map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.vehiclePlate}</TableCell>
                        <TableCell>{request.baseName}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={request.problem}>
                          {request.problem}
                        </TableCell>
                        <TableCell>{request.workshopName}</TableCell>
                        <TableCell>{formatDate(request.startDate)}</TableCell>
                        <TableCell>{formatDate(request.endDate)}</TableCell>
                        <TableCell>{formatCurrency(request.estimatedCost)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => {
                              setSelectedRequest(request);
                              setIsDetailsDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de detalhes do pedido */}
      {selectedRequest && (
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Pedido de Manutenção</DialogTitle>
              <DialogDescription>
                Informações e histórico do pedido de manutenção
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Informações do Pedido</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="font-medium">Veículo:</div>
                    <div className="col-span-2">{selectedRequest.vehiclePlate}</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="font-medium">Base:</div>
                    <div className="col-span-2">{selectedRequest.baseName}</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="font-medium">Data do Pedido:</div>
                    <div className="col-span-2">{formatDate(selectedRequest.requestDate)}</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="font-medium">Prioridade:</div>
                    <div className="col-span-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityBadgeClass(selectedRequest.priority)}`}>
                        {translatePriority(selectedRequest.priority)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="font-medium">Status:</div>
                    <div className="col-span-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(selectedRequest.status)}`}>
                        {translateMaintenanceStatus(selectedRequest.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="font-medium">Problema:</div>
                    <div className="col-span-2">{selectedRequest.problem}</div>
                  </div>
                  
                  {selectedRequest.workshopName && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="font-medium">Oficina:</div>
                      <div className="col-span-2">{selectedRequest.workshopName}</div>
                    </div>
                  )}
                  
                  {selectedRequest.estimatedCost !== undefined && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="font-medium">Custo Estimado:</div>
                      <div className="col-span-2">{formatCurrency(selectedRequest.estimatedCost)}</div>
                    </div>
                  )}
                  
                  {selectedRequest.estimatedTime && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="font-medium">Tempo Estimado:</div>
                      <div className="col-span-2">{selectedRequest.estimatedTime} dias</div>
                    </div>
                  )}
                  
                  {selectedRequest.approvalDate && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="font-medium">Data de Aprovação:</div>
                      <div className="col-span-2">{formatDate(selectedRequest.approvalDate)}</div>
                    </div>
                  )}
                  
                  {selectedRequest.startDate && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="font-medium">Data de Início:</div>
                      <div className="col-span-2">{formatDate(selectedRequest.startDate)}</div>
                    </div>
                  )}
                  
                  {selectedRequest.endDate && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="font-medium">Data de Conclusão:</div>
                      <div className="col-span-2">{formatDate(selectedRequest.endDate)}</div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="font-medium">Observações:</div>
                    <div className="col-span-2">{selectedRequest.observations || '-'}</div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button 
                    onClick={() => {
                      setIsDetailsDialogOpen(false);
                      setIsAddStatusDialogOpen(true);
                      setNewStatus({ 
                        status: '',
                        observations: ''
                      });
                    }}
                    className="w-full"
                  >
                    Atualizar Status
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Histórico de Status</h3>
                <StatusHistory history={selectedRequest.statusHistory} />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de atualização de status */}
      {selectedRequest && (
        <Dialog open={isAddStatusDialogOpen} onOpenChange={setIsAddStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Atualizar Status</DialogTitle>
              <DialogDescription>
                Atualize o status do pedido de manutenção para o veículo {selectedRequest.vehiclePlate}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="status">Novo Status</Label>
                <Select 
                  value={newStatus.status}
                  onValueChange={(value) => setNewStatus({...newStatus, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o novo status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aguardando_analise">Aguardando Análise</SelectItem>
                    <SelectItem value="aguardando_orcamento">Aguardando Orçamento</SelectItem>
                    <SelectItem value="aguardando_aprovacao">Aguardando Aprovação</SelectItem>
                    <SelectItem value="em_manutencao">Em Manutenção</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {newStatus.status === 'aguardando_orcamento' && (
                <div className="space-y-2">
                  <Label htmlFor="workshop">Oficina</Label>
                  <Select 
                    value={newStatus.workshopId?.toString()}
                    onValueChange={(value) => setNewStatus({...newStatus, workshopId: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a oficina" />
                    </SelectTrigger>
                    <SelectContent>
                      {workshops.map((workshop) => (
                        <SelectItem key={workshop.id} value={workshop.id.toString()}>
                          {workshop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {newStatus.status === 'aguardando_aprovacao' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="workshop">Oficina</Label>
                    <Select 
                      value={newStatus.workshopId?.toString()}
                      onValueChange={(value) => setNewStatus({...newStatus, workshopId: parseInt(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a oficina" />
                      </SelectTrigger>
                      <SelectContent>
                        {workshops.map((workshop) => (
                          <SelectItem key={workshop.id} value={workshop.id.toString()}>
                            {workshop.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="estimatedCost">Custo Estimado (R$)</Label>
                    <Input
                      id="estimatedCost"
                      type="number"
                      step="0.01"
                      value={newStatus.estimatedCost || ''}
                      onChange={(e) => setNewStatus({...newStatus, estimatedCost: parseFloat(e.target.value)})}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="estimatedTime">Tempo Estimado (dias)</Label>
                    <Input
                      id="estimatedTime"
                      type="number"
                      value={newStatus.estimatedTime || ''}
                      onChange={(e) => setNewStatus({...newStatus, estimatedTime: e.target.value})}
                      placeholder="1"
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={newStatus.observations}
                  onChange={(e) => setNewStatus({...newStatus, observations: e.target.value})}
                  placeholder="Detalhes sobre a atualização de status"
                  rows={4}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddStatusDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddStatusUpdate}>
                Atualizar Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </MainLayoutSimple>
  );
};

export default FleetManagementNew;