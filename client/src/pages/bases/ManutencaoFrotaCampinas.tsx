import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/hooks/use-auth';
import { VehiclePlateAutocomplete } from "@/components/vehicle-plate-autocomplete";
import { 
  Loader2, 
  FileText, 
  ClipboardList, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Calendar, 
  CalendarDays,
  Truck,
  Car, 
  Wrench, 
  User,
  LogIn,
  LogOut,
  Tag,
  AlertTriangle,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Schema de validação para solicitação de manutenção
const maintenanceRequestSchema = z.object({
  vehiclePlate: z.string().min(7, { message: "A placa do veículo é obrigatória" }).max(8),
  description: z.string().min(10, { message: "A descrição deve ter pelo menos 10 caracteres" }),
  priority: z.string({ required_error: "Selecione uma prioridade" }),
  maintenanceType: z.string({ required_error: "Selecione o tipo de manutenção" }),
  km: z.string().min(1, { message: "O hodômetro atual é obrigatório" })
    .refine(val => !isNaN(Number(val)), { message: "O hodômetro deve ser um número válido" })
});

type MaintenanceRequestForm = z.infer<typeof maintenanceRequestSchema>;

// Interface para os dados da solicitação de manutenção
interface MaintenanceRequest {
  id: number;
  vehiclePlate: string;
  description: string;
  priority: string;
  maintenanceType: string;
  status: string;
  requesterId: number;
  requesterName: string;
  createdAt: string;
  updatedAt: string;
  estimatedCompletion?: string;
  assignedTo?: string;
  workshopId?: number;
  workshopName?: string;
  comments?: string;
  resolutionNotes?: string;
  diagnostic?: string;
  cost?: number;
  entryDate?: string;
  exitDate?: string;
  vehicleType?: string;
  vehicleMileage?: number;
}

// Interface para veículo
interface Vehicle {
  id: number;
  plate: string;
  model: string;
  vehicleType: string;
  status: string;
}

// Componente principal
const ManutencaoFrotaCampinas: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  // Configuração do formulário
  const form = useForm<MaintenanceRequestForm>({
    resolver: zodResolver(maintenanceRequestSchema),
    defaultValues: {
      vehiclePlate: '',
      description: '',
      priority: '',
      maintenanceType: '',
      km: ''
    }
  });

  // Buscar solicitações e veículos ao carregar a página
  useEffect(() => {
    console.log("Componente ManutencaoFrotaCampinas inicializado");
    // Adicionando um pequeno atraso para garantir que a autenticação esteja pronta
    setTimeout(() => {
      fetchMaintenanceRequests();
      fetchVehicles();
      console.log("Requisições iniciadas após timeout");
    }, 500);
  }, []);

  // Função para atualizar o status de uma solicitação
  const updateRequestStatus = async (requestId: number, newStatus: string) => {
    try {
      // Importar apiRequest para incluir o token JWT nos cabeçalhos
      const { apiRequest } = await import('../../lib/queryClient');
      
      // Chamada para a API para atualizar o status (usando a rota específica da base Campinas ID=2)
      await apiRequest('PATCH', `/api/maintenance/base/2/${requestId}/status`, { status: newStatus });
      
      // Atualizar o estado localmente para refletir a mudança
      setRequests(requests.map(req => 
        req.id === requestId 
          ? { ...req, status: newStatus, updatedAt: new Date().toISOString() } 
          : req
      ));
      
      toast({
        title: "Status atualizado",
        description: "O status da solicitação foi atualizado com sucesso.",
        variant: "default"
      });
      
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da solicitação.",
        variant: "destructive"
      });
    }
  };

  // Função para buscar as solicitações de manutenção
  const fetchMaintenanceRequests = async () => {
    setIsLoading(true);
    try {
      // Importar apiRequest para incluir o token JWT nos cabeçalhos
      const { apiRequest } = await import('../../lib/queryClient');
      
      // Chamada real para a API usando a base de Campinas (ID: 2)
      const data = await apiRequest('GET', '/api/maintenance/base/2');
      console.log("Dados de manutenção da Base Campinas:", data);
      
      console.log("Dados brutos da API:", data);
      
      // Mapear os dados recebidos para o formato esperado pelo componente
      // com tratamento explícito de campos faltantes ou alternativos
      const formattedRequests: MaintenanceRequest[] = Array.isArray(data) ? data.map((item: any) => {
        console.log("Processando item de manutenção:", item);
        
        // Extrair valores com fallbacks seguros
        const formattedItem = {
          id: item.id,
          vehiclePlate: item.vehiclePlate || item.vehicle_plate || "",
          description: item.description || "",
          priority: item.priority || "média",
          maintenanceType: item.type || item.maintenanceType || item.maintenance_type || "corretiva",
          status: item.status || "pendente",
          requesterId: item.requesterId || user?.id || 0,
          requesterName: item.requesterName || user?.name || "Usuário",
          createdAt: item.created_at || item.createdAt || new Date().toISOString(),
          updatedAt: item.updated_at || item.updatedAt || new Date().toISOString(),
          // Diferentes nomes de campos de datas com fallbacks
          estimatedCompletion: item.expectedExitDate || item.expected_exit_date || item.estimated_completion || null,
          assignedTo: item.responsiblePerson || item.responsible_person || "",
          workshopId: item.workshopId || item.workshop_id || 1,
          workshopName: item.workshopName || "Oficina Central",
          entryDate: item.entryDate || item.entry_date || null,
          exitDate: item.actualExitDate || item.actual_exit_date || item.completion_date || null,
          comments: item.comments || item.description || "",
          vehicleType: item.vehicleType || "desconhecido",
          vehicleMileage: item.vehicleMileage || item.km_atual ? parseInt(item.km_atual) : 0
        };
        
        console.log("Item formatado:", formattedItem);
        return formattedItem;
      }) : [];
      
      setRequests(formattedRequests);
    } catch (error) {
      console.error("Erro ao buscar solicitações:", error);
      // Dados simulados para testes quando a API falhar
      const mockData: MaintenanceRequest[] = [
        {
          id: 1,
          vehiclePlate: "ABC1234",
          description: "Problema no sistema de freios, veículo fazendo barulho ao frear.",
          priority: "alta",
          maintenanceType: "corretiva",
          status: "pendente",
          requesterId: 1,
          requesterName: "Administrador",
          createdAt: "2025-05-07T10:30:00",
          updatedAt: "2025-05-07T10:30:00",
          vehicleType: "van",
          vehicleMileage: 45000
        },
        {
          id: 2,
          vehiclePlate: "DEF5678",
          description: "Troca de óleo e filtros programada.",
          priority: "média",
          maintenanceType: "preventiva",
          status: "em_andamento",
          requesterId: 1,
          requesterName: "Administrador",
          createdAt: "2025-05-05T14:20:00",
          updatedAt: "2025-05-06T09:15:00",
          estimatedCompletion: "2025-05-08T17:00:00",
          assignedTo: "Carlos Mecânico",
          workshopId: 2,
          workshopName: "Oficina Central",
          entryDate: "2025-05-06T09:00:00",
          vehicleType: "truck",
          vehicleMileage: 75000
        }
      ];
      setRequests(mockData);
      
      toast({
        title: "Erro",
        description: "Não foi possível carregar as solicitações de manutenção.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para buscar os veículos
  const fetchVehicles = async () => {
    try {
      // Importar apiRequest para incluir o token JWT nos cabeçalhos
      const { apiRequest } = await import('../../lib/queryClient');
      
      // Realizar chamada real à API
      const data = await apiRequest('GET', '/api/vehicles');
      console.log("Veículos obtidos da API:", data);
      
      // Mapear para o formato esperado pelo componente
      const formattedVehicles: Vehicle[] = Array.isArray(data) ? data.map((vehicle: any) => ({
        id: vehicle.id,
        plate: vehicle.plate,
        model: vehicle.model,
        vehicleType: vehicle.vehicleType,
        status: vehicle.status
      })) : [];
      
      if (formattedVehicles.length > 0) {
        setVehicles(formattedVehicles);
      } else {
        // Dados simulados para demonstração quando a API retornar vazio
        console.log("Usando veículos simulados para demonstração");
        const mockVehicles: Vehicle[] = [
          { id: 1, plate: "ABC1234", model: "Sprinter 415", vehicleType: "van", status: "em_operacao" },
          { id: 2, plate: "DEF5678", model: "VW 24.280", vehicleType: "truck", status: "em_operacao" },
          { id: 3, plate: "GHI9012", model: "Fiorino Furgão", vehicleType: "fiorino", status: "em_operacao" },
          { id: 4, plate: "JKL3456", model: "Sprinter 515", vehicleType: "van", status: "em_manutencao" },
          { id: 5, plate: "MNO7890", model: "Scania R450", vehicleType: "cavalo_mecanico", status: "em_operacao" }
        ];
        setVehicles(mockVehicles);
      }
    } catch (error) {
      console.error("Erro ao buscar veículos:", error);
      
      // Dados simulados para demonstração quando ocorrer erro
      const mockVehicles: Vehicle[] = [
        { id: 1, plate: "ABC1234", model: "Sprinter 415", vehicleType: "van", status: "em_operacao" },
        { id: 2, plate: "DEF5678", model: "VW 24.280", vehicleType: "truck", status: "em_operacao" },
        { id: 3, plate: "GHI9012", model: "Fiorino Furgão", vehicleType: "fiorino", status: "em_operacao" },
        { id: 4, plate: "JKL3456", model: "Sprinter 515", vehicleType: "van", status: "em_manutencao" },
        { id: 5, plate: "MNO7890", model: "Scania R450", vehicleType: "cavalo_mecanico", status: "em_operacao" }
      ];
      setVehicles(mockVehicles);
      
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de veículos do servidor.",
        variant: "destructive"
      });
    }
  };

  // Função para criar nova solicitação de manutenção
  const onSubmit = async (data: MaintenanceRequestForm) => {
    setIsLoading(true);
    try {
      console.log("Enviando solicitação:", data);
      
      // Garantir que a placa esteja em maiúsculas para corresponder ao formato do banco de dados
      const vehiclePlate = data.vehiclePlate.toUpperCase();
      
      // Preparar dados para envio à API central
      const vehicle = vehicles.find(v => v.plate === vehiclePlate);
      
      // Mapear os dados para o formato correto conforme os campos requeridos no schema de validação
      // Use apenas os campos que existem na estrutura atual da tabela manutencao
      const maintenanceData = {
        vehiclePlate: vehiclePlate,
        description: data.description,
        maintenanceType: data.maintenanceType as "preventiva" | "corretiva",
        status: "pendente",
        priority: data.priority || "média", 
        requestBaseId: 2, // Base Campinas é ID 2
        workshopId: 1, // Oficina padrão é ID 1
        vehicleMileage: parseInt(data.km) || 0, // Converter km para número
        requesterId: user?.id || 1, // ID do solicitante
        
        // Datas
        entryDate: new Date().toISOString().split('T')[0], // Data atual
        estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias
        
        // Outros campos
        responsiblePerson: "Técnico responsável",
        cost: null,
        initialBudget: null
      };
      
      // Importar apiRequest para incluir o token JWT nos cabeçalhos
      const { apiRequest } = await import('../../lib/queryClient');
      
      // Realizar chamada real à API com autenticação
      const newMaintenance = await apiRequest('POST', '/api/maintenance', maintenanceData);
      console.log("Resposta da API:", newMaintenance);
      
      console.log("Resposta bruta da API de criação:", newMaintenance);
      
      // Formatar a resposta para o formato esperado pelo componente
      // Criando um objeto de mapeamento mais claro com tratamento de nulos e conversões de tipo
      console.log("Mapeando resposta da API:", newMaintenance);
      
      const newRequest: MaintenanceRequest = {
        id: typeof newMaintenance.id === 'number' ? newMaintenance.id : parseInt(newMaintenance.id || '0'),
        vehiclePlate: newMaintenance.vehiclePlate || newMaintenance.vehicle_plate || data.vehiclePlate.toUpperCase(),
        description: newMaintenance.description || data.description,
        priority: newMaintenance.priority || data.priority || "média",
        maintenanceType: newMaintenance.maintenanceType || newMaintenance.maintenance_type || data.maintenanceType,
        status: newMaintenance.status || "pendente",
        requesterId: user?.id || 0,
        requesterName: user?.name || "Usuário",
        createdAt: newMaintenance.created_at || newMaintenance.createdAt || new Date().toISOString(),
        updatedAt: newMaintenance.updated_at || newMaintenance.updatedAt || new Date().toISOString(),
        
        // Campos de data específicos
        estimatedCompletion: newMaintenance.estimatedCompletion || newMaintenance.estimated_completion || null,
        assignedTo: newMaintenance.responsiblePerson || newMaintenance.responsible_person || "",
        
        // Campos de relacionamento
        workshopId: typeof newMaintenance.workshopId === 'number' ? 
          newMaintenance.workshopId : 
          (typeof newMaintenance.workshop_id === 'number' ? newMaintenance.workshop_id : 1),
        workshopName: newMaintenance.workshopName || "Oficina Central",
        
        // Outros campos importantes
        entryDate: newMaintenance.entryDate || newMaintenance.entry_date || new Date().toISOString(),
        exitDate: newMaintenance.completionDate || newMaintenance.completion_date || null,
        comments: data.description,
        vehicleType: vehicle?.vehicleType || "desconhecido",
        vehicleMileage: data.km ? parseInt(data.km) : 0
      };
      
      console.log("Item formatado para exibição:", newRequest);
      
      // Atualizar a interface com a nova solicitação
      setRequests([newRequest, ...requests]);
      form.reset();
      
      toast({
        title: "Sucesso",
        description: "Solicitação de manutenção criada com sucesso.",
        variant: "default"
      });
      
    } catch (error) {
      console.error("Erro ao criar solicitação:", error);
      
      // Modo de fallback para testes quando a API falhar
      // Adiciona localmente apenas para demonstração
      const vehiclePlate = data.vehiclePlate.toUpperCase();
      const vehicle = vehicles.find(v => v.plate === vehiclePlate);
      
      const newRequest: MaintenanceRequest = {
        id: Math.floor(Math.random() * 1000),
        vehiclePlate: vehiclePlate,
        description: data.description,
        priority: data.priority,
        maintenanceType: data.maintenanceType,
        status: "pendente",
        requesterId: user?.id || 0,
        requesterName: user?.name || "Usuário",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        vehicleType: vehicle?.vehicleType || "desconhecido",
        vehicleMileage: parseInt(data.km) // Adicionando o campo de quilometragem
      };
      
      setRequests([newRequest, ...requests]);
      form.reset();
      
      toast({
        title: "Erro",
        description: "Não foi possível criar a solicitação de manutenção no servidor central. Uma versão local foi criada para demonstração.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (e) {
      return "Data inválida";
    }
  };

  // Filtrar solicitações de acordo com o termo de busca
  const filteredRequests = requests.filter(request => {
    const searchLower = searchTerm.toLowerCase();
    return (
      request.vehiclePlate.toLowerCase().includes(searchLower) ||
      request.description.toLowerCase().includes(searchLower) ||
      request.status.toLowerCase().includes(searchLower) ||
      request.priority.toLowerCase().includes(searchLower) ||
      request.maintenanceType.toLowerCase().includes(searchLower) ||
      (request.workshopName && request.workshopName.toLowerCase().includes(searchLower))
    );
  });

  // Função para renderizar o badge de status
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case 'em_andamento':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300"><Wrench className="w-3 h-3 mr-1" /> Em andamento</Badge>;
      case 'concluida':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300"><CheckCircle className="w-3 h-3 mr-1" /> Concluída</Badge>;
      case 'aguardando_pecas':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300"><AlertCircle className="w-3 h-3 mr-1" /> Aguardando peças</Badge>;
      case 'aguardando_orcamento':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300"><AlertCircle className="w-3 h-3 mr-1" /> Aguardando orçamento</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Função para renderizar o badge de prioridade
  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'baixa':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Baixa</Badge>;
      case 'média':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">Média</Badge>;
      case 'alta':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Alta</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  // Função para renderizar o badge de tipo de manutenção
  const renderMaintenanceTypeBadge = (type: string) => {
    switch (type) {
      case 'preventiva':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Preventiva</Badge>;
      case 'corretiva':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Corretiva</Badge>;
      case 'preditiva':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">Preditiva</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };


  // Obter o tipo de veículo em texto
  const getVehicleTypeText = (type?: string) => {
    switch (type) {
      case 'fiorino': return 'Fiorino';
      case 'van': return 'Van';
      case 'vuc': return 'VUC';
      case 'toco': return 'Toco';
      case 'truck': return 'Truck';
      case 'cavalo_mecanico': return 'Cavalo Mecânico';
      case 'carreta': return 'Carreta';
      default: return 'Desconhecido';
    }
  };
  
  // Função para retornar o ícone do tipo de veículo
  const getVehicleTypeIcon = (type?: string) => {
    switch (type) {
      case 'van':
        return <Car className="h-4 w-4 text-blue-600" />;
      case 'truck':
        return <Truck className="h-4 w-4 text-green-600" />;
      case 'fiorino':
        return <Car className="h-4 w-4 text-cyan-600" />;
      case 'cavalo_mecanico':
        return <Truck className="h-4 w-4 text-red-600" />;
      case 'vuc':
        return <Truck className="h-4 w-4 text-purple-600" />;
      case 'toco':
        return <Truck className="h-4 w-4 text-amber-600" />;
      case 'carreta':
        return <Truck className="h-4 w-4 text-gray-600" />;
      default:
        return <Car className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manutenção de Frota</h1>
          <p className="text-muted-foreground">
            Base Campinas - Gerenciamento de solicitações de manutenção de veículos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formulário de solicitação */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Nova Solicitação</CardTitle>
            <CardDescription>
              Preencha os dados para solicitar uma manutenção de veículo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="vehiclePlate"
                  render={({ field }) => (
                    <VehiclePlateAutocomplete
                      form={form}
                      name="vehiclePlate"
                      label="Placa do Veículo"
                      helpText="Digite ou selecione a placa do veículo"
                      placeholder="Selecione ou digite a placa do veículo"
                      vehicles={vehicles}
                    />
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição do Problema/Serviço</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva detalhadamente o problema ou serviço necessário"
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="maintenanceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Manutenção</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="preventiva">Preventiva</SelectItem>
                            <SelectItem value="corretiva">Corretiva</SelectItem>
                            <SelectItem value="preditiva">Preditiva</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridade</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a prioridade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="baixa">Baixa</SelectItem>
                            <SelectItem value="média">Média</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="km"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hodômetro Atual (km)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Digite o valor atual do hodômetro"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-muted-foreground text-xs">
                        Informe o valor atual do hodômetro em quilômetros
                      </FormMessage>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Campo de data estimada para conclusão removido conforme solicitado */}
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Enviar Solicitação
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Tabela de solicitações */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Solicitações de Manutenção</CardTitle>
            <CardDescription>
              Visualize e gerencie todas as solicitações de manutenção de veículos
            </CardDescription>
            <div className="flex flex-col md:flex-row gap-2 items-start md:items-center w-full mt-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar solicitações..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="w-24"
                >
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Tabela
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="w-24"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Cartões
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && !filteredRequests.length ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredRequests.length > 0 ? (
              viewMode === 'table' ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Veículo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.vehiclePlate}</TableCell>
                          <TableCell>{renderMaintenanceTypeBadge(request.maintenanceType)}</TableCell>
                          <TableCell>{renderPriorityBadge(request.priority)}</TableCell>
                          <TableCell>{renderStatusBadge(request.status)}</TableCell>
                          <TableCell>{formatDate(request.createdAt)}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsDialogOpen(true);
                              }}
                            >
                              <ClipboardList className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRequests.map((request) => (
                    <Card key={request.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2 border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="mr-2">
                              {getVehicleTypeIcon(request.vehicleType)}
                            </div>
                            <CardTitle className="text-lg">{request.vehiclePlate}</CardTitle>
                          </div>
                          <div className="flex space-x-2">
                            {renderPriorityBadge(request.priority)}
                            {renderStatusBadge(request.status)}
                          </div>
                        </div>
                        <CardDescription className="pt-1 flex flex-wrap items-center gap-2">
                          {renderMaintenanceTypeBadge(request.maintenanceType)}
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(request.createdAt)}
                          </span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="bg-muted/30 p-3 rounded-md mb-4">
                          <p className="text-sm line-clamp-2">
                            {request.description}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2 mb-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground mb-1">Informações</span>
                            <div className="flex flex-col space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span>{request.requesterName || 'Não informado'}</span>
                              </div>
                              {request.vehicleMileage && (
                                <div className="flex items-center gap-2">
                                  <Tag className="h-3 w-3 text-muted-foreground" />
                                  <span>{request.vehicleMileage.toLocaleString('pt-BR')} km</span>
                                </div>
                              )}
                              {request.workshopName && (
                                <div className="flex items-center gap-2">
                                  <Wrench className="h-3 w-3 text-muted-foreground" />
                                  <span>{request.workshopName}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {(request.entryDate || request.estimatedCompletion || request.exitDate) && (
                            <div className="flex flex-col mt-2">
                              <span className="text-xs text-muted-foreground mb-1">Datas</span>
                              <div className="grid grid-cols-1 gap-1 text-sm">
                                {request.entryDate && (
                                  <div className="flex items-center gap-2">
                                    <LogIn className="h-3 w-3 text-muted-foreground" />
                                    <span className="truncate">Entrada: {formatDate(request.entryDate)}</span>
                                  </div>
                                )}
                                {request.estimatedCompletion && (
                                  <div className="flex items-center gap-2">
                                    <CalendarDays className="h-3 w-3 text-muted-foreground" />
                                    <span className="truncate">Previsão: {formatDate(request.estimatedCompletion)}</span>
                                  </div>
                                )}
                                {request.exitDate && (
                                  <div className="flex items-center gap-2">
                                    <LogOut className="h-3 w-3 text-muted-foreground" />
                                    <span className="truncate">Saída: {formatDate(request.exitDate)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col space-y-3">
                          <div className="flex flex-wrap gap-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updateRequestStatus(request.id, "pendente")}
                              className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300 text-xs h-7 px-2"
                              disabled={request.status === "pendente"}
                            >
                              <Clock className="mr-1 h-3 w-3" /> Pendente
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updateRequestStatus(request.id, "em_andamento")}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300 text-xs h-7 px-2"
                              disabled={request.status === "em_andamento"}
                            >
                              <Wrench className="mr-1 h-3 w-3" /> Em Andamento
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updateRequestStatus(request.id, "aguardando_pecas")}
                              className="bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300 text-xs h-7 px-2"
                              disabled={request.status === "aguardando_pecas"}
                            >
                              <AlertCircle className="mr-1 h-3 w-3" /> Aguardando Peças
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updateRequestStatus(request.id, "concluida")}
                              className="bg-green-100 hover:bg-green-200 text-green-800 border-green-300 text-xs h-7 px-2"
                              disabled={request.status === "concluida"}
                            >
                              <CheckCircle className="mr-1 h-3 w-3" /> Concluída
                            </Button>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            className="w-full text-sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setIsDialogOpen(true);
                            }}
                          >
                            <FileText className="mr-2 h-4 w-4" /> Ver Detalhes
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Truck className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhuma solicitação encontrada</h3>
                <p className="text-muted-foreground mt-2">
                  Não há solicitações de manutenção registradas.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de detalhes da solicitação */}
      {selectedRequest && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Detalhes da Manutenção
              </DialogTitle>
              <DialogDescription>
                Informações completas sobre a solicitação de manutenção
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {/* Cabeçalho com informações principais */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                <div className="col-span-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Veículo</h4>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{selectedRequest.vehiclePlate || 'N/A'}</p>
                  </div>
                </div>
                <div className="col-span-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Tipo</h4>
                  <p className="text-sm">{getVehicleTypeText(selectedRequest.vehicleType || 'desconhecido')}</p>
                </div>
                <div className="col-span-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  <div className="mt-1">{renderStatusBadge(selectedRequest.status || 'pendente')}</div>
                </div>
                <div className="col-span-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Prioridade</h4>
                  <div className="mt-1">{renderPriorityBadge(selectedRequest.priority || 'média')}</div>
                </div>
              </div>
              
              {/* Tipo de manutenção e quilometragem */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Tipo de Manutenção</h4>
                  <div className="mt-1">{renderMaintenanceTypeBadge(selectedRequest.maintenanceType || 'corretiva')}</div>
                </div>
                
                {selectedRequest.vehicleMileage && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Quilometragem</h4>
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{selectedRequest.vehicleMileage.toLocaleString('pt-BR')} km</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Descrição do problema */}
              <div className="bg-muted/30 p-3 rounded-md">
                <h4 className="text-sm font-medium text-muted-foreground">Descrição</h4>
                <p className="text-sm whitespace-pre-line mt-2">{selectedRequest.description || 'Sem descrição'}</p>
              </div>
              
              {/* Informações do solicitante e datas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Solicitante</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{selectedRequest.requesterName || 'Não informado'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Data da Solicitação</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{formatDate(selectedRequest.createdAt)}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Oficina</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{selectedRequest.workshopName || 'Não definida'}</p>
                  </div>
                </div>
              </div>
              
              {/* Datas importantes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedRequest.entryDate && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Data de Entrada</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <LogIn className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{formatDate(selectedRequest.entryDate)}</p>
                    </div>
                  </div>
                )}
                
                {selectedRequest.estimatedCompletion && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Previsão de Conclusão</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{formatDate(selectedRequest.estimatedCompletion)}</p>
                    </div>
                  </div>
                )}
                
                {selectedRequest.exitDate && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Data de Saída</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <LogOut className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{formatDate(selectedRequest.exitDate)}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Responsável técnico */}
              {selectedRequest.assignedTo && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Responsável Técnico</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{selectedRequest.assignedTo}</p>
                  </div>
                </div>
              )}
              
              {selectedRequest.cost !== undefined && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Custo</h4>
                  <p className="text-sm">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedRequest.cost)}
                  </p>
                </div>
              )}
              
              {selectedRequest.diagnostic && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Diagnóstico</h4>
                  <p className="text-sm whitespace-pre-line">{selectedRequest.diagnostic}</p>
                </div>
              )}
              
              {selectedRequest.resolutionNotes && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Notas de Resolução</h4>
                  <p className="text-sm whitespace-pre-line">{selectedRequest.resolutionNotes}</p>
                </div>
              )}
              
              {selectedRequest.comments && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Comentários/Observações</h4>
                  <p className="text-sm whitespace-pre-line">{selectedRequest.comments}</p>
                </div>
              )}
            </div>
            
            <DialogFooter className="flex-col space-y-4">
              <div className="flex flex-wrap gap-2 justify-start mb-2">
                <h4 className="text-sm font-medium w-full mb-2">Atualizar status:</h4>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    updateRequestStatus(selectedRequest.id, "pendente");
                    setIsDialogOpen(false);
                  }}
                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300"
                  disabled={selectedRequest.status === "pendente"}
                >
                  <Clock className="mr-1 h-3 w-3" /> Pendente
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    updateRequestStatus(selectedRequest.id, "em_andamento");
                    setIsDialogOpen(false);
                  }}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300"
                  disabled={selectedRequest.status === "em_andamento"}
                >
                  <Wrench className="mr-1 h-3 w-3" /> Em Andamento
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    updateRequestStatus(selectedRequest.id, "aguardando_pecas");
                    setIsDialogOpen(false);
                  }}
                  className="bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300"
                  disabled={selectedRequest.status === "aguardando_pecas"}
                >
                  <AlertCircle className="mr-1 h-3 w-3" /> Aguardando Peças
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    updateRequestStatus(selectedRequest.id, "concluida");
                    setIsDialogOpen(false);
                  }}
                  className="bg-green-100 hover:bg-green-200 text-green-800 border-green-300"
                  disabled={selectedRequest.status === "concluida"}
                >
                  <CheckCircle className="mr-1 h-3 w-3" /> Concluída
                </Button>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Fechar
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ManutencaoFrotaCampinas;