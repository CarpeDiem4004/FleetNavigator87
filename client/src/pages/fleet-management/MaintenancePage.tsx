import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Wrench, 
  Plus, 
  CalendarClock, 
  Truck, 
  Building2, 
  DollarSign, 
  FileText,
  CheckCircle2,
  Clock,
  ClipboardList,
  AlertTriangle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';

// Interfaces
interface Base {
  id: number;
  name: string;
}

interface Workshop {
  id: number;
  name: string;
  isActive: boolean;
}

interface Vehicle {
  id: number;
  plate: string;
  model: string;
  type: string;
  status: string;
}

interface Maintenance {
  id: number;
  vehiclePlate: string;
  vehicleModel?: string;
  workshopId: number;
  workshopName?: string; 
  type: 'preventiva' | 'corretiva';
  description: string;
  entryDate: string;
  expectedExitDate: string;
  actualExitDate?: string;
  status: 'pendente' | 'aguardando_orcamento' | 'em_andamento' | 'concluida' | 'cancelada';
  cost?: number;
  requestBaseId: number;
  requestBaseName?: string;
  created_at: string;
  updated_at: string;
}

// Componente para exibir o status com ícone apropriado
const StatusBadge = ({ status }: { status: Maintenance['status'] }) => {
  switch(status) {
    case 'pendente':
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3" />
          Pendente
        </Badge>
      );
    case 'aguardando_orcamento':
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
          <ClipboardList className="h-3 w-3" />
          Aguardando Orçamento
        </Badge>
      );
    case 'em_andamento':
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-indigo-50 text-indigo-700 border-indigo-200">
          <Wrench className="h-3 w-3" />
          Em Andamento
        </Badge>
      );
    case 'concluida':
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3" />
          Concluída
        </Badge>
      );
    case 'cancelada':
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3 w-3" />
          Cancelada
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {status}
        </Badge>
      );
  }
};

export default function MaintenancePage() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Maintenance['status']>('pendente');
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [filterBaseId, setFilterBaseId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<Maintenance>>({
    vehiclePlate: '',
    workshopId: 0,
    type: 'corretiva',
    description: '',
    entryDate: new Date().toISOString().split('T')[0],
    expectedExitDate: '',
    status: 'pendente',
    cost: undefined,
    requestBaseId: user?.baseId || 0
  });

  // Carregar bases
  const { data: bases = [] } = useQuery<Base[]>({
    queryKey: ['/api/bases'],
    refetchOnWindowFocus: false
  });

  // Carregar oficinas ativas
  const { data: workshops = [] } = useQuery<Workshop[]>({
    queryKey: ['/api/workshops', { active: true }],
    queryFn: async () => {
      const res = await fetch('/api/workshops?active=true');
      return res.json();
    },
    refetchOnWindowFocus: false
  });

  // Carregar veículos
  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
    refetchOnWindowFocus: false
  });

  // Carregar manutenções com base no filtro
  const { data: maintenances = [], isLoading } = useQuery<Maintenance[]>({
    queryKey: ['/api/maintenance', { baseId: filterBaseId, status: activeTab !== 'all' ? activeTab : null }],
    queryFn: async () => {
      let url = '/api/maintenance';
      const params = new URLSearchParams();
      
      if (filterBaseId) {
        params.append('baseId', filterBaseId.toString());
      }
      
      if (activeTab !== 'all') {
        params.append('status', activeTab);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url);
      return res.json();
    },
    refetchOnWindowFocus: false
  });

  // Mutation para criar manutenção
  const createMaintenanceMutation = useMutation({
    mutationFn: async (data: Partial<Maintenance>) => {
      const response = await apiRequest('POST', '/api/maintenance', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Manutenção registrada com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao registrar manutenção',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Mutation para atualizar status da manutenção
  const updateMaintenanceStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest('PATCH', `/api/maintenance/${id}/status`, { status });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Status atualizado com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      setStatusDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Manipuladores de eventos
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value ? parseFloat(value) : undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehiclePlate || !formData.workshopId || !formData.entryDate || !formData.expectedExitDate) {
      toast({
        title: 'Dados incompletos',
        description: 'Por favor, preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    // Adicionar requestBaseId se não estiver definido
    if (!formData.requestBaseId && user?.baseId) {
      formData.requestBaseId = user.baseId;
    }

    createMaintenanceMutation.mutate(formData);
  };

  const handleStatusChange = () => {
    if (!selectedMaintenance || !selectedStatus) return;
    
    updateMaintenanceStatusMutation.mutate({
      id: selectedMaintenance.id,
      status: selectedStatus
    });
  };

  const openNewMaintenanceDialog = () => {
    setFormData({
      vehiclePlate: '',
      workshopId: 0,
      type: 'corretiva',
      description: '',
      entryDate: new Date().toISOString().split('T')[0],
      expectedExitDate: '',
      status: 'pendente',
      cost: undefined,
      requestBaseId: user?.baseId || 0
    });
    setIsOpen(true);
  };

  const openStatusDialog = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    // Definir um valor inicial válido baseado no primeiro status disponível
    const availableStatuses = getNextAvailableStatuses(maintenance.status);
    if (availableStatuses.length > 0) {
      setSelectedStatus(availableStatuses[0] as Maintenance['status']);
    } else {
      setSelectedStatus('pendente');
    }
    setStatusDialogOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
  };

  // Função para formatar data
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Função para encontrar nome da base pelo ID
  const getBaseName = (baseId: number) => {
    const base = bases.find(b => b.id === baseId);
    return base ? base.name : 'Base Desconhecida';
  };

  // Função para encontrar nome da oficina pelo ID
  const getWorkshopName = (workshopId: number) => {
    const workshop = workshops.find(w => w.id === workshopId);
    return workshop ? workshop.name : 'Oficina Desconhecida';
  };

  // Função para encontrar detalhes do veículo pela placa
  const getVehicleDetails = (plate: string) => {
    const vehicle = vehicles.find(v => v.plate === plate);
    return vehicle ? `${plate} - ${vehicle.model}` : plate;
  };

  // Próximos status disponíveis com base no status atual
  const getNextAvailableStatuses = (currentStatus: Maintenance['status']): Maintenance['status'][] => {
    switch(currentStatus) {
      case 'pendente':
        return ['aguardando_orcamento', 'cancelada'] as Maintenance['status'][];
      case 'aguardando_orcamento':
        return ['em_andamento', 'cancelada'] as Maintenance['status'][];
      case 'em_andamento':
        return ['concluida', 'cancelada'] as Maintenance['status'][];
      case 'concluida':
        return [] as Maintenance['status'][];
      case 'cancelada':
        return [] as Maintenance['status'][];
      default:
        return [] as Maintenance['status'][];
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Wrench className="mr-2 h-8 w-8" />
                Gestão de Manutenções
              </h1>
              <p className="text-muted-foreground mt-1">
                Acompanhe e gerencie todas as manutenções da frota
              </p>
            </div>
            <Button onClick={openNewMaintenanceDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Manutenção
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {maintenances.filter(m => m.status === 'pendente').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Em Andamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {maintenances.filter(m => m.status === 'em_andamento' || m.status === 'aguardando_orcamento').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Concluídas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {maintenances.filter(m => m.status === 'concluida').length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Manutenções</CardTitle>
                  <CardDescription>
                    Histórico e status de manutenções de veículos
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select 
                    value={filterBaseId?.toString() || ""}
                    onValueChange={(value) => setFilterBaseId(value ? parseInt(value) : null)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por base" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as bases</SelectItem>
                      {bases.map((base) => (
                        <SelectItem key={base.id} value={base.id.toString()}>
                          {base.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-5">
                  <TabsTrigger value="all">Todas</TabsTrigger>
                  <TabsTrigger value="pendente">Pendentes</TabsTrigger>
                  <TabsTrigger value="aguardando_orcamento">Orçamento</TabsTrigger>
                  <TabsTrigger value="em_andamento">Em Andamento</TabsTrigger>
                  <TabsTrigger value="concluida">Concluídas</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : maintenances.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhuma manutenção encontrada</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {activeTab !== 'all' 
                      ? `Não há manutenções com o status "${activeTab}"` 
                      : 'Registre manutenções para acompanhar o status dos veículos'
                    }
                  </p>
                  <Button onClick={openNewMaintenanceDialog} variant="outline" className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar Manutenção
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Veículo</TableHead>
                        <TableHead>Oficina</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Entrada</TableHead>
                        <TableHead>Previsão</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Base Solicitante</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenances.map((maintenance) => (
                        <TableRow key={maintenance.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <Truck className="h-4 w-4 mr-1 text-muted-foreground" />
                              {getVehicleDetails(maintenance.vehiclePlate)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Building2 className="h-4 w-4 mr-1 text-muted-foreground" />
                              {getWorkshopName(maintenance.workshopId)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {maintenance.type === 'preventiva' ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Preventiva
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                Corretiva
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <CalendarClock className="h-4 w-4 mr-1 text-muted-foreground" />
                              {formatDate(maintenance.entryDate)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDate(maintenance.expectedExitDate)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={maintenance.status} />
                          </TableCell>
                          <TableCell>
                            {getBaseName(maintenance.requestBaseId)}
                          </TableCell>
                          <TableCell className="text-right">
                            {['pendente', 'aguardando_orcamento', 'em_andamento'].includes(maintenance.status) && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openStatusDialog(maintenance)}
                              >
                                Atualizar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Diálogo para criar nova manutenção */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Registrar Nova Manutenção</DialogTitle>
            <DialogDescription>
              Preencha os dados para registrar uma manutenção de veículo
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="vehiclePlate" className="text-right">
                    Veículo *
                  </Label>
                  <Select 
                    value={formData.vehiclePlate || ""} 
                    onValueChange={(value) => handleSelectChange('vehiclePlate', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o veículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.plate}>
                          {vehicle.plate} - {vehicle.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="workshopId" className="text-right">
                    Oficina *
                  </Label>
                  <Select 
                    value={formData.workshopId ? formData.workshopId.toString() : ""} 
                    onValueChange={(value) => handleSelectChange('workshopId', value)}
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
                <div>
                  <Label htmlFor="type" className="text-right">
                    Tipo de Manutenção *
                  </Label>
                  <Select 
                    value={formData.type || "corretiva"} 
                    onValueChange={(value) => handleSelectChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventiva">Preventiva</SelectItem>
                      <SelectItem value="corretiva">Corretiva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="requestBaseId" className="text-right">
                    Base Solicitante *
                  </Label>
                  <Select 
                    value={formData.requestBaseId ? formData.requestBaseId.toString() : ""} 
                    onValueChange={(value) => handleSelectChange('requestBaseId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a base" />
                    </SelectTrigger>
                    <SelectContent>
                      {bases.map((base) => (
                        <SelectItem key={base.id} value={base.id.toString()}>
                          {base.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="entryDate" className="text-right">
                    Data de Entrada *
                  </Label>
                  <Input
                    id="entryDate"
                    name="entryDate"
                    type="date"
                    value={formData.entryDate}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expectedExitDate" className="text-right">
                    Previsão de Saída *
                  </Label>
                  <Input
                    id="expectedExitDate"
                    name="expectedExitDate"
                    type="date"
                    value={formData.expectedExitDate}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description" className="text-right">
                    Descrição do Serviço *
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-1"
                    rows={3}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="cost" className="text-right">
                    Custo Estimado (R$)
                  </Label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      id="cost"
                      name="cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cost?.toString() || ''}
                      onChange={handleNumberInputChange}
                      className="pl-9"
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMaintenanceMutation.isPending}>
                {createMaintenanceMutation.isPending ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                    Processando...
                  </span>
                ) : (
                  <span>Registrar Manutenção</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para atualizar status */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Atualizar Status</DialogTitle>
            <DialogDescription>
              Altere o status da manutenção do veículo {selectedMaintenance?.vehiclePlate}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="current-status" className="text-right">
                  Status Atual
                </Label>
                <div className="mt-2">
                  {selectedMaintenance && <StatusBadge status={selectedMaintenance.status} />}
                </div>
              </div>
              <div>
                <Label htmlFor="new-status" className="text-right">
                  Novo Status
                </Label>
                <Select
                  value={selectedStatus}
                  onValueChange={(value) => {
                    // Garantir que o valor seja um dos tipos válidos de status de manutenção
                    setSelectedStatus(value as Maintenance['status']);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o novo status" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedMaintenance && getNextAvailableStatuses(selectedMaintenance.status).map(status => (
                      <SelectItem key={status} value={status}>
                        {status === 'pendente' && 'Pendente'}
                        {status === 'aguardando_orcamento' && 'Aguardando Orçamento'}
                        {status === 'em_andamento' && 'Em Andamento'}
                        {status === 'concluida' && 'Concluída'}
                        {status === 'cancelada' && 'Cancelada'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedStatus === 'cancelada' && (
                  <p className="text-xs text-red-500 mt-1">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                    Atenção: Cancelar uma manutenção não pode ser desfeito.
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleStatusChange}
              disabled={!selectedStatus || updateMaintenanceStatusMutation.isPending}
            >
              {updateMaintenanceStatusMutation.isPending ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                  Processando...
                </span>
              ) : (
                <span>Atualizar Status</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}