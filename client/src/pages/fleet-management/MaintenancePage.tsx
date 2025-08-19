import React, { useState, useEffect } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import MaintenanceDetailDialog from '@/components/maintenance/MaintenanceDetailDialog';
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
  XCircle,
  ClipboardList,
  AlertTriangle,
  AlertCircle,
  User,
  FileBarChart as FileSpreadsheet,
  MoreHorizontal,
  Calendar,
  CircleCheck,
  Search
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { Vehicle, useVehicles } from '@/hooks/use-vehicles';

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

interface Maintenance {
  id: number;
  vehiclePlate: string;
  vehicleModel?: string;
  workshopId: number;
  workshopName?: string; 
  maintenanceType: 'preventiva' | 'corretiva'; // Campo corrigido
  description: string;
  entryDate: string;
  estimatedCompletion?: string; // Campo alinhado
  completionDate?: string; // Campo alinhado
  status: 'pendente' | 'aguardando_orcamento' | 'em_andamento' | 'concluida' | 'cancelada';
  cost?: number;
  initialBudget?: number; // Campo adicionado
  requestBaseId: number;
  requestBaseName?: string;
  responsiblePerson?: string;
  priority?: string; // Campo adicionado
  created_at: string;
  updated_at: string;
  // Novos campos obrigatórios
  vehicleKm?: number;
  projectId?: number;
  projectName?: string;
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
  const [datesDialogOpen, setDatesDialogOpen] = useState(false);
  // Diálogo de detalhes da manutenção
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  // Adicionar valor padrão necessário para evitar problemas com SelectItem
  const [selectedStatus, setSelectedStatus] = useState<Maintenance['status']>('pendente');
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [filterBaseId, setFilterBaseId] = useState<number | null>(null);
  // Estado para busca por placa
  const [searchPlate, setSearchPlate] = useState('');
  const [filteredMaintenances, setFilteredMaintenances] = useState<Maintenance[]>([]);
  
  // Função para lidar com a busca por placa
  const handlePlateSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchPlate(e.target.value.toUpperCase());
  };
  // Estado para formulário de datas
  const [dateFormData, setDateFormData] = useState({
    entryDate: '',
    estimatedCompletion: '',
    completionDate: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<Maintenance>>({
    vehiclePlate: '',
    workshopId: 0,
    maintenanceType: 'corretiva',
    description: '',
    entryDate: new Date().toISOString().split('T')[0],
    estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pendente',
    priority: 'média',
    cost: undefined,
    initialBudget: undefined,
    requestBaseId: user?.baseId || 0,
    responsiblePerson: 'Técnico responsável',
    vehicleKm: undefined,
    projectId: undefined
  });

  // Carregar bases
  const { data: basesResponse } = useQuery<Base[]>({
    queryKey: ['/api/bases'],
    refetchOnWindowFocus: false
  });

  // Extrair dados da resposta
  const bases = (basesResponse as any)?.data || basesResponse || [];

  // Carregar projetos
  const { data: projectsResponse } = useQuery({
    queryKey: ['/api/projects'],
    refetchOnWindowFocus: false
  });

  // Extrair dados da resposta
  const projects = (projectsResponse as any)?.data || projectsResponse || [];

  // Carregar project-bases para filtrar bases por projeto
  const { data: projectBasesResponse } = useQuery({
    queryKey: ['/api/project-bases'],
    refetchOnWindowFocus: false
  });

  // Extrair dados da resposta (pode vir como {success: true, data: []} ou diretamente como [])
  const projectBases = (projectBasesResponse as any)?.data || projectBasesResponse || [];

  // Estado para bases filtradas baseado no projeto selecionado
  const [filteredBases, setFilteredBases] = useState<Base[]>([]);

  // Filtrar bases baseado no projeto selecionado
  const selectedProjectId = formData.projectId;
  
  useEffect(() => {
    console.log('Filtro de bases - Debug:');
    console.log('selectedProjectId:', selectedProjectId);
    console.log('projectBases.length:', projectBases.length);
    console.log('bases.length:', bases.length);
    
    if (!selectedProjectId || !projectBases.length || !bases.length) {
      console.log('Condição não atendida - limpando filteredBases');
      setFilteredBases([]);
      return;
    }

    // Filtrar bases que pertencem ao projeto selecionado
    const projectBasesForProject = projectBases.filter((pb: any) => 
      pb.project_id === Number(selectedProjectId)
    );
    
    console.log('Projeto selecionado:', selectedProjectId);
    console.log('ProjectBases para projeto:', projectBasesForProject);

    // Mapear para as bases completas
    const basesForProject = projectBasesForProject
      .map((pb: any) => bases.find((base: Base) => base.id === pb.base_id))
      .filter(Boolean);

    console.log('Bases filtradas:', basesForProject);
    setFilteredBases(basesForProject);
  }, [selectedProjectId, projectBases, bases]);

  // Reset base selection when project changes
  useEffect(() => {
    if (selectedProjectId) {
      setFormData(prev => ({ ...prev }));
    }
  }, [selectedProjectId]);

  // Carregar oficinas ativas
  const { data: workshops = [] } = useQuery<Workshop[]>({
    queryKey: ['/api/workshops', { active: true }],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/workshops?active=true');
      if (!res.ok) {
        throw new Error(`Erro ao buscar oficinas: ${res.status}`);
      }
      return res.json();
    },
    refetchOnWindowFocus: false,
    retry: 3 // Tenta novamente em caso de falha
  });

  // Carregar veículos usando o hook customizado para garantir consistência em todo o aplicativo
  const { vehicles = [] } = useVehicles();

  // Carregar manutenções com base no filtro e na base do usuário
  const { data: maintenances = [], isLoading, refetch: refetchMaintenances } = useQuery<Maintenance[]>({
    queryKey: ['/api/maintenance/orders', { baseId: filterBaseId, status: activeTab !== 'all' ? activeTab : null }],
    queryFn: async () => {
      let url = '/api/maintenance/orders';
      const params = new URLSearchParams();
      
      // Se o usuário não for admin ou gestor_frota e tiver uma baseId, filtrar por essa base
      if (user && user.role !== 'admin' && user.role !== 'gestor_frota' && user.baseId) {
        params.append('baseId', user.baseId.toString());
      } else if (filterBaseId) {
        // Se houver um filtro de base selecionado, aplicar esse filtro (apenas para admin ou gestor_frota)
        params.append('baseId', filterBaseId.toString());
      }
      
      if (activeTab !== 'all') {
        params.append('status', activeTab);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log(`Buscando manutenções com os parâmetros: ${params.toString()}`);
      // Usar apiRequest para garantir que o token JWT seja incluído
      const res = await apiRequest('GET', url);
      if (!res.ok) {
        throw new Error(`Erro ao buscar manutenções: ${res.status}`);
      }
      return res.json();
    },
    refetchOnWindowFocus: true, // Atualiza ao focar a janela
    refetchInterval: 10000, // Atualiza a cada 10 segundos
    retry: 3 // Tenta novamente em caso de falha
  });
  
  // Consulta específica para solicitações pendentes da Base Campinas
  const { data: campinasRequests = [] } = useQuery<Maintenance[]>({
    queryKey: ['/api/maintenance/orders', { baseId: 2, status: 'pendente' }],
    queryFn: async () => {
      const url = '/api/maintenance/orders?baseId=2&status=pendente';
      console.log(`Buscando manutenções com os parâmetros: baseId=2&status=pendente`);
      // Usar apiRequest para garantir que o token JWT seja incluído
      const res = await apiRequest('GET', url);
      if (!res.ok) {
        throw new Error(`Erro ao buscar manutenções: ${res.status}`);
      }
      return res.json();
    },
    refetchOnWindowFocus: true,
    refetchInterval: 5000, // Atualiza a cada 5 segundos
    retry: 3 // Tenta novamente em caso de falha
  });

  // Mutation para criar manutenção
  const createMaintenanceMutation = useMutation({
    mutationFn: async (data: Partial<Maintenance>) => {
      const response = await apiRequest('POST', '/api/maintenance/orders', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Manutenção registrada com sucesso',
      });
      // Invalidar todas as consultas relacionadas à manutenção para forçar a atualização dos dados
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      
      // Forçar atualizações específicas para o card de solicitações das bases
      refetchMaintenances(); 
      
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
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance/orders'] });
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
  
  // Mutation para atualizar datas da manutenção
  const updateMaintenanceDatesMutation = useMutation({
    mutationFn: async ({ id, dates }: { id: number; dates: Partial<typeof dateFormData> }) => {
      const response = await apiRequest('PATCH', `/api/maintenance/${id}/dates`, dates);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Datas atualizadas com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      setDatesDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar datas',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Mutation para excluir manutenção
  const deleteMaintenanceMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/maintenance/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao excluir manutenção');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Manutenção excluída com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir manutenção',
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
    // Converter valores para números quando necessário
    const numericFields = ['workshopId', 'requestBaseId', 'projectId'];
    const processedValue = numericFields.includes(name) ? (value === "0" ? undefined : parseInt(value)) : value;
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value ? parseFloat(value) : undefined }));
  };
  
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateFormData(prev => ({ ...prev, [name]: value }));
  };

  // Função para excluir manutenção
  const handleDeleteMaintenance = async (id: number) => {
    const maintenance = maintenances?.find(m => m.id === id);
    if (!maintenance) return;

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a OS #${id} do veículo ${maintenance.vehiclePlate}?\n\nEsta ação não pode ser desfeita.`
    );

    if (confirmed) {
      deleteMaintenanceMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação dos campos obrigatórios
    if (!formData.vehiclePlate || !formData.workshopId || !formData.maintenanceType || !formData.entryDate || !formData.estimatedCompletion || !formData.responsiblePerson || !formData.description || !formData.vehicleKm || !formData.projectId) {
      toast({
        title: 'Dados incompletos',
        description: 'Por favor, preencha todos os campos obrigatórios: placa, km, descrição do problema, projeto, base, data de envio do carro e oficina',
        variant: 'destructive'
      });
      return;
    }

    const dataToSubmit = {...formData};
    
    // Para usuários que não são nem admin nem gestor_frota, forçar o uso da sua própria base
    if (user && user.role !== 'admin' && user.role !== 'gestor_frota' && user.baseId) {
      dataToSubmit.requestBaseId = user.baseId;
      console.log(`Usuário regular: usando baseId ${user.baseId} para a manutenção`);
    } else if (!dataToSubmit.requestBaseId && user?.baseId) {
      // Adicionar requestBaseId se não estiver definido
      dataToSubmit.requestBaseId = user.baseId;
    }
    
    // Verificar se a base foi definida corretamente
    if (!dataToSubmit.requestBaseId) {
      toast({
        title: 'Base não selecionada',
        description: 'Por favor, selecione uma base solicitante',
        variant: 'destructive'
      });
      return;
    }

    createMaintenanceMutation.mutate(dataToSubmit);
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
      maintenanceType: 'corretiva',
      description: '',
      entryDate: new Date().toISOString().split('T')[0],
      estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pendente',
      priority: 'média',
      cost: undefined,
      initialBudget: undefined,
      requestBaseId: user?.baseId || 0,
      responsiblePerson: 'Técnico responsável',
      vehicleKm: undefined,
      projectId: undefined
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
  
  const openDatesDialog = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    // Preencher o formulário com as datas atuais da manutenção
    setDateFormData({
      entryDate: maintenance.entryDate || '',
      estimatedCompletion: maintenance.estimatedCompletion || '',
      completionDate: maintenance.completionDate || ''
    });
    setDatesDialogOpen(true);
  };
  
  // Função para abrir o diálogo de detalhes da manutenção
  const openDetailDialog = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    setDetailDialogOpen(true);
  };
  
  const handleDateUpdate = () => {
    if (!selectedMaintenance) return;
    
    // Verificar quais datas foram alteradas
    const datesToUpdate: Partial<typeof dateFormData> = {};
    if (dateFormData.entryDate) {
      datesToUpdate.entryDate = dateFormData.entryDate;
    }
    if (dateFormData.estimatedCompletion) {
      datesToUpdate.estimatedCompletion = dateFormData.estimatedCompletion;
    }
    if (dateFormData.completionDate) {
      datesToUpdate.completionDate = dateFormData.completionDate;
    }
    
    // Enviar apenas datas válidas
    if (Object.keys(datesToUpdate).length > 0) {
      updateMaintenanceDatesMutation.mutate({
        id: selectedMaintenance.id,
        dates: datesToUpdate
      });
    } else {
      toast({
        title: 'Nenhuma data para atualizar',
        description: 'Por favor, informe pelo menos uma data para atualizar.',
        variant: 'destructive'
      });
    }
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
    if (!Array.isArray(bases) || bases.length === 0) {
      return 'Base Desconhecida';
    }
    const base = bases.find(b => b.id === baseId);
    return base ? base.name : 'Base Desconhecida';
  };

  // Função para encontrar nome da oficina pelo ID
  const getWorkshopName = (workshopId: number) => {
    if (!Array.isArray(workshops) || workshops.length === 0) {
      return 'Oficina Desconhecida';
    }
    const workshop = workshops.find(w => w.id === workshopId);
    return workshop ? workshop.name : 'Oficina Desconhecida';
  };

  // Função para encontrar detalhes do veículo pela placa
  const getVehicleDetails = (plate: string) => {
    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      return plate || "Placa não disponível";
    }
    const vehicle = vehicles.find((v: Vehicle) => v.plate === plate);
    return vehicle ? `${plate} - ${vehicle.model}` : plate;
  };
  
  // Comentário: removemos a função duplicada handlePlateSearch
  
  // useEffect para filtrar as manutenções com base no termo de busca
  useEffect(() => {
    if (!maintenances || !Array.isArray(maintenances)) {
      setFilteredMaintenances([]);
      return;
    }
    
    if (!searchPlate) {
      setFilteredMaintenances(maintenances);
      return;
    }
    
    const filtered = maintenances.filter(maintenance => 
      maintenance.vehiclePlate.toUpperCase().includes(searchPlate)
    );
    setFilteredMaintenances(filtered);
  }, [maintenances, searchPlate]);

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

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {maintenances && Array.isArray(maintenances) ? maintenances.filter(m => m.status === 'pendente').length : 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Em Andamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {maintenances && Array.isArray(maintenances) ? maintenances.filter(m => m.status === 'em_andamento' || m.status === 'aguardando_orcamento').length : 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Concluídas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {maintenances && Array.isArray(maintenances) ? maintenances.filter(m => m.status === 'concluida').length : 0}
                </div>
              </CardContent>
            </Card>
            {/* Card de solicitações ocultado conforme solicitado */}
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
                {/* Filtro de bases ocultado conforme solicitado */}
                {/* Para usuários que não são nem admin nem gestor_frota, mostrar um badge indicando sua base */}
                {user && user.role !== 'admin' && user.role !== 'gestor_frota' && user.baseId && (
                  <div className="flex items-center">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 h-9 px-3">
                      <Building2 className="mr-1 h-4 w-4" />
                      Base: {user.basename || getBaseName(user.baseId)}
                    </Badge>
                  </div>
                )}
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
              {/* Campo de busca por placa */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar por placa de veículo..."
                    value={searchPlate}
                    onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
                    className="pl-9 w-full"
                  />
                </div>
                {searchPlate && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSearchPlate('')}
                    className="h-10"
                  >
                    Limpar
                  </Button>
                )}
              </div>
              
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : !filteredMaintenances || !Array.isArray(filteredMaintenances) || filteredMaintenances.length === 0 ? (
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
                        <TableHead>Responsável</TableHead>
                        <TableHead>Base Solicitante</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMaintenances && Array.isArray(filteredMaintenances) ? filteredMaintenances.map((maintenance) => (
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
                            {maintenance.maintenanceType === 'preventiva' ? (
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
                            {formatDate(maintenance.estimatedCompletion)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={maintenance.status} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1 text-muted-foreground" />
                              {maintenance.responsiblePerson || 'Não informado'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getBaseName(maintenance.requestBaseId)}
                          </TableCell>
                          <TableCell className="text-right">
                            {(['pendente', 'aguardando_orcamento', 'em_andamento'].includes(maintenance.status) || 
                              user?.role === 'admin' || user?.role === 'gestor_frota') && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Abrir menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openDetailDialog(maintenance)}>
                                    <Wrench className="h-4 w-4 mr-2" />
                                    Detalhes da Manutenção
                                  </DropdownMenuItem>
                                  {['pendente', 'aguardando_orcamento', 'em_andamento'].includes(maintenance.status) && (
                                    <DropdownMenuItem onClick={() => openStatusDialog(maintenance)}>
                                      <CircleCheck className="h-4 w-4 mr-2" />
                                      Atualizar Status
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => openDatesDialog(maintenance)}>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Atualizar Datas
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => window.open(`/files/maintenance/${maintenance.id}`, '_blank')}
                                    disabled={true} // Implementação futura
                                  >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Ver Documentos
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => window.open(`/maintenance/${maintenance.id}/report`, '_blank')}
                                    disabled={true} // Implementação futura
                                  >
                                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                                    Exportar Relatório
                                  </DropdownMenuItem>
                                  {(user?.role === 'admin' || user?.role === 'gestor_frota') && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => handleDeleteMaintenance(maintenance.id)}
                                        className="text-red-600 hover:text-red-700 focus:text-red-700"
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Excluir OS
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      )) : null}
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
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Nova Manutenção</DialogTitle>
            <DialogDescription>
              Preencha os dados para registrar uma manutenção de veículo
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="py-4">
              <div className="space-y-4">
                {/* Veículo */}
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="vehiclePlate">
                    Veículo (Placa) <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.vehiclePlate || "default"} 
                    onValueChange={(value) => handleSelectChange('vehiclePlate', value)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione o veículo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Selecione um veículo</SelectItem>
                      {!Array.isArray(vehicles) || vehicles.length === 0 ? (
                        <SelectItem value="loading">Carregando veículos...</SelectItem>
                      ) : (
                        vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.plate}>
                            {vehicle.plate} - {vehicle.model}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quilometragem */}
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="vehicleKm">
                    Quilometragem (KM) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="vehicleKm"
                    name="vehicleKm"
                    type="number"
                    min="0"
                    value={formData.vehicleKm?.toString() || ''}
                    onChange={handleNumberInputChange}
                    className="h-10"
                    placeholder="Ex: 45000"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Oficina */}
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="workshopId">
                      Oficina <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={formData.workshopId ? formData.workshopId.toString() : "0"} 
                      onValueChange={(value) => handleSelectChange('workshopId', value)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecione a oficina" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Selecione uma oficina</SelectItem>
                        {Array.isArray(workshops) ? workshops.map((workshop) => (
                          <SelectItem key={workshop.id} value={workshop.id.toString()}>
                            {workshop.name}
                          </SelectItem>
                        )) : <SelectItem value="-1">Erro ao carregar oficinas</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Base Solicitante */}
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="requestBaseId">
                      Base Solicitante <span className="text-red-500">*</span>
                    </Label>
                    {user && user.role !== 'admin' && user.role !== 'gestor_frota' && user.baseId ? (
                      // Para usuários que não são admin nem gestor_frota, mostrar um campo desabilitado com sua própria base
                      <div className="flex items-center h-10 px-3 border rounded-md border-input bg-muted/50">
                        <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{user.basename || getBaseName(user.baseId)}</span>
                      </div>
                    ) : (
                      // Para administradores e gestores de frota, mostrar o dropdown de seleção
                      <Select 
                        value={formData.requestBaseId ? formData.requestBaseId.toString() : "0"} 
                        onValueChange={(value) => handleSelectChange('requestBaseId', value)}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Selecione a base" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Selecione uma base</SelectItem>
                          {Array.isArray(bases) ? bases.map((base) => (
                            <SelectItem key={base.id} value={base.id.toString()}>
                              {base.name}
                            </SelectItem>
                          )) : <SelectItem value="-1">Erro ao carregar bases</SelectItem>}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {/* Projeto */}
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="projectId">
                    Projeto <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.projectId ? formData.projectId.toString() : "0"} 
                    onValueChange={(value) => handleSelectChange('projectId', value)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione o projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Selecione um projeto</SelectItem>
                      {Array.isArray(projects) && projects.length > 0 ? (
                        projects.map((project: any) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="-1">Carregando projetos...</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Base (Opcional) - Aparece apenas quando um projeto for selecionado */}
                {selectedProjectId && (
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="requestBaseId">
                      Base (Opcional)
                    </Label>
                    <Select 
                      value={formData.requestBaseId ? formData.requestBaseId.toString() : "0"} 
                      onValueChange={(value) => handleSelectChange('requestBaseId', value)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecione uma base" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Selecione uma base</SelectItem>
                        {filteredBases.length > 0 ? (
                          filteredBases.map((base: Base) => (
                            <SelectItem key={base.id} value={base.id.toString()}>
                              {base.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="-1" disabled>Nenhuma base</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Tipo de Manutenção */}
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="maintenanceType">
                      Tipo de Manutenção <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={formData.maintenanceType || "corretiva"} 
                      onValueChange={(value) => handleSelectChange('maintenanceType', value)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preventiva">Preventiva</SelectItem>
                        <SelectItem value="corretiva">Corretiva</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Data de Envio do Carro */}
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="entryDate">
                      Data de Envio do Carro <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="entryDate"
                      name="entryDate"
                      type="date"
                      value={formData.entryDate}
                      onChange={handleInputChange}
                      className="h-10"
                      required
                    />
                  </div>

                  {/* Previsão de Saída */}
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="estimatedCompletion">
                      Previsão de Saída <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="estimatedCompletion"
                      name="estimatedCompletion"
                      type="date"
                      value={formData.estimatedCompletion}
                      onChange={handleInputChange}
                      className="h-10"
                      required
                    />
                  </div>
                </div>

                {/* Descrição do Problema */}
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="description">
                    Descrição do Problema <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Descreva o problema ou serviço a ser realizado"
                    required
                  />
                </div>

                {/* Responsável pela Manutenção */}
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="responsiblePerson">
                    Responsável pela Manutenção <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="responsiblePerson"
                    name="responsiblePerson"
                    value={formData.responsiblePerson || ''}
                    onChange={handleInputChange}
                    className="h-10"
                    placeholder="Nome do responsável pela manutenção"
                    required
                  />
                </div>

                {/* Custo Estimado */}
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="cost">
                    Custo Estimado (R$)
                  </Label>
                  <div className="relative">
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
                      className="pl-9 h-10"
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 flex-wrap">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMaintenanceMutation.isPending} className="min-w-[150px]">
                {createMaintenanceMutation.isPending ? (
                  <span className="flex items-center justify-center">
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
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Atualizar Status da Manutenção</DialogTitle>
            <DialogDescription>
              {selectedMaintenance && (
                <div className="mt-2">
                  <span className="font-medium">Veículo:</span> {getVehicleDetails(selectedMaintenance.vehiclePlate)}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="current-status">
                  Status Atual
                </Label>
                <div className="flex items-center h-10 pl-3 border rounded-md border-input bg-muted/50">
                  {selectedMaintenance && <StatusBadge status={selectedMaintenance.status} />}
                </div>
              </div>
              
              <div className="flex flex-col space-y-1.5">
                <Label className="mb-2">
                  Selecione o Novo Status
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  {selectedMaintenance && Array.isArray(getNextAvailableStatuses(selectedMaintenance.status)) && getNextAvailableStatuses(selectedMaintenance.status).map(status => (
                    <Button
                      key={status}
                      type="button"
                      variant={selectedStatus === status ? "default" : "outline"}
                      className="justify-start h-10"
                      onClick={() => setSelectedStatus(status)}
                    >
                      <div className="flex items-center">
                        {status === 'aguardando_orcamento' && <FileText className="w-4 h-4 mr-2" />}
                        {status === 'em_andamento' && <Wrench className="w-4 h-4 mr-2" />}
                        {status === 'concluida' && <CheckCircle2 className="w-4 h-4 mr-2" />}
                        {status === 'cancelada' && <XCircle className="w-4 h-4 mr-2" />}
                        {status === 'pendente' && <Clock className="w-4 h-4 mr-2" />}
                        {status === 'pendente' && 'Pendente'}
                        {status === 'aguardando_orcamento' && 'Aguardando Orçamento'}
                        {status === 'em_andamento' && 'Em Andamento'}
                        {status === 'concluida' && 'Concluída'}
                        {status === 'cancelada' && 'Cancelada'}
                      </div>
                    </Button>
                  ))}
                </div>
                
                {selectedStatus === 'cancelada' && (
                  <div className="flex items-start p-3 mt-2 text-sm rounded-md bg-red-50 text-red-700 border border-red-200">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Atenção</p>
                      <p>Cancelar uma manutenção não pode ser desfeito e o veículo voltará ao status "em operação".</p>
                    </div>
                  </div>
                )}
                
                {selectedStatus === 'concluida' && (
                  <div className="flex items-start p-3 mt-2 text-sm rounded-md bg-green-50 text-green-700 border border-green-200">
                    <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Concluindo manutenção</p>
                      <p>Ao marcar como concluída, o veículo terá seu status alterado para "em operação".</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 flex-wrap">
            <Button type="button" variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleStatusChange}
              disabled={!selectedStatus || updateMaintenanceStatusMutation.isPending}
              className="min-w-[150px]"
            >
              {updateMaintenanceStatusMutation.isPending ? (
                <span className="flex items-center justify-center">
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
      
      {/* Diálogo para atualizar datas */}
      <Dialog open={datesDialogOpen} onOpenChange={setDatesDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Atualizar Datas da Manutenção</DialogTitle>
            <DialogDescription>
              {selectedMaintenance && (
                <div className="mt-2">
                  <span className="font-medium">Veículo:</span> {getVehicleDetails(selectedMaintenance.vehiclePlate)}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="entryDate">Data de Entrada</Label>
                <Input
                  id="entryDate"
                  name="entryDate"
                  type="date"
                  value={dateFormData.entryDate}
                  onChange={handleDateInputChange}
                />
              </div>
              
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="estimatedCompletion">Previsão de Conclusão</Label>
                <Input
                  id="estimatedCompletion"
                  name="estimatedCompletion"
                  type="date"
                  value={dateFormData.estimatedCompletion}
                  onChange={handleDateInputChange}
                />
              </div>
              
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="completionDate">Data de Conclusão</Label>
                <Input
                  id="completionDate"
                  name="completionDate"
                  type="date"
                  value={dateFormData.completionDate}
                  onChange={handleDateInputChange}
                />
                <p className="text-sm text-muted-foreground">
                  Apenas para manutenções concluídas ou em fase final
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 flex-wrap">
            <Button type="button" variant="outline" onClick={() => setDatesDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleDateUpdate}
              disabled={updateMaintenanceDatesMutation.isPending}
              className="min-w-[150px]"
            >
              {updateMaintenanceDatesMutation.isPending ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                  Processando...
                </span>
              ) : (
                <span>Atualizar Datas</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para detalhes da manutenção */}
      {selectedMaintenance && (
        <MaintenanceDetailDialog
          isOpen={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maintenance={selectedMaintenance}
          workshops={workshops}
          onUpdate={() => {
            setDetailDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['/api/maintenance/orders'] });
          }}
        />
      )}
    </AppLayout>
  );
}