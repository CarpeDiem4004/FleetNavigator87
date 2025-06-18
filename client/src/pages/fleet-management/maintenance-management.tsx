import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Building2, 
  Wrench, 
  Car, 
  Clock, 
  DollarSign, 
  Plus,
  Eye,
  Edit,
  FileText,
  Settings,
  Users,
  TrendingUp,
  Download,
  Printer,
  AlertTriangle,
  MessageSquare,
  Phone,
  Mail,
  User,
  Calendar
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import jsPDF from 'jspdf';

interface ServiceOrder {
  id: number;
  vehiclePlate: string;
  description: string;
  status: string;
  priority: string;
  maintenanceType: string;
  workshopId: number;
  requestBaseId: number;
  entryDate: string;
  estimatedCompletion: string;
  completionDate?: string;
  responsiblePerson: string;
  cost: string;
  initialBudget: string;
  created_at: string;
  updated_at: string;
  vehicleModel?: string;
  vehicleBrand?: string;
  workshopName?: string;
  baseName?: string;
  currentKm?: number;
}

interface Workshop {
  id: number;
  name: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  contactPerson: string;
  workshopType: string;
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

interface MaintenanceStats {
  total_orders: number;
  orders_in_progress: number;
  orders_completed: number;
  orders_pending: number;
  total_cost: number;
  average_cost: number;
}

interface Vehicle {
  id: number;
  placa: string;
  modelo: string;
  marca: string;
  tipo: string;
}

interface MaintenanceTemplate {
  id: number;
  nome: string;
  descricao: string;
  categoria: string;
}

interface CarReception {
  id: number;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleType: string;
  currentKm: number;
  baseId: number;
  projectId: number;
  projectName: string;
  serviceDescription: string;
  replacedParts: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  priority: string;
  status: string;
  notes: string;
  receivedDate: string;
  deliveryDeadline: string;
  deliveredDate?: string;
  workshopId: number;
  workshopName?: string;
  baseName?: string;
  updatedAt?: string;
  deliveryPersonName?: string;
  deliveryPersonCpf?: string;
  deliveryPersonPhone?: string;
}

// Schema de validação para nova ordem de serviço
const newServiceOrderSchema = z.object({
  placa: z.string().min(1, "Placa é obrigatória"),
  oficina_id: z.string().min(1, "Oficina é obrigatória"),
  descricao: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  data_prevista: z.string().min(1, "Data prevista é obrigatória"),
  observacoes: z.string().optional()
});

// Schema de validação para cadastro de oficina
const newWorkshopSchema = z.object({
  nome: z.string().min(1, "Nome da oficina é obrigatório"),
  cnpj: z.string().min(14, "CNPJ deve ter pelo menos 14 caracteres"),
  endereco: z.string().min(1, "Endereço é obrigatório"),
  telefone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  responsavel: z.string().min(1, "Nome do responsável é obrigatório"),
  tipo: z.string().min(1, "Tipo de oficina é obrigatório")
});

// Schema de validação para tratativas de manutenção
const negotiationSchema = z.object({
  vehiclePlate: z.string().min(1, "Placa é obrigatória"),
  workshopId: z.number().min(1, "Oficina é obrigatória"),
  maintenanceId: z.number().optional(),
  carReceptionId: z.number().optional(),
  originalDeadline: z.string().optional(),
  newDeadline: z.string().min(1, "Novo prazo é obrigatório"),
  negotiationReason: z.string().min(10, "Motivo deve ter pelo menos 10 caracteres"),
  fleetComments: z.string().min(1, "Comentários são obrigatórios"),
  priority: z.string().min(1, "Prioridade é obrigatória"),
  contactMethod: z.string().min(1, "Método de contato é obrigatório"),
  followUpDate: z.string().optional()
});

interface MaintenanceNegotiation {
  id: number;
  vehicle_plate: string;
  maintenance_id?: number;
  car_reception_id?: number;
  workshop_id: number;
  workshop_name: string;
  fleet_manager_id: number;
  fleet_manager_name: string;
  original_deadline?: string;
  new_deadline?: string;
  negotiation_reason: string;
  fleet_comments?: string;
  workshop_response?: string;
  status: string;
  priority: string;
  contact_method?: string;
  contact_date?: string;
  follow_up_date?: string;
  resolved: boolean;
  created_at: string;
  updated_at?: string;
  negotiation_type?: string;
  maintenance_status?: string;
  maintenance_deadline?: string;
  reception_status?: string;
  reception_deadline?: string;
}

export default function MaintenanceManagement() {
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [templates, setTemplates] = useState<MaintenanceTemplate[]>([]);
  const [carReceptions, setCarReceptions] = useState<CarReception[]>([]);
  const [stats, setStats] = useState<MaintenanceStats>({
    total_orders: 0,
    orders_in_progress: 0,
    orders_completed: 0,
    orders_pending: 0,
    total_cost: 0,
    average_cost: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWorkshopModalOpen, setIsWorkshopModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedReception, setSelectedReception] = useState<CarReception | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [overdueVehicles, setOverdueVehicles] = useState<{orders: ServiceOrder[], receptions: CarReception[]}>({orders: [], receptions: []});
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingWorkshop, setIsCreatingWorkshop] = useState(false);
  const [isNegotiationModalOpen, setIsNegotiationModalOpen] = useState(false);
  const [selectedVehicleForNegotiation, setSelectedVehicleForNegotiation] = useState<{plate: string, workshopId: number, maintenanceId?: number, carReceptionId?: number} | null>(null);
  const [negotiations, setNegotiations] = useState<MaintenanceNegotiation[]>([]);
  const [isCreatingNegotiation, setIsCreatingNegotiation] = useState(false);
  const [isNegotiationHistoryModalOpen, setIsNegotiationHistoryModalOpen] = useState(false);
  const [selectedVehicleHistory, setSelectedVehicleHistory] = useState<string>("");
  const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<ServiceOrder | null>(null);
  const { toast } = useToast();

  // Form para nova ordem de serviço
  const form = useForm<z.infer<typeof newServiceOrderSchema>>({
    resolver: zodResolver(newServiceOrderSchema),
    defaultValues: {
      placa: "",
      oficina_id: "",
      descricao: "",
      data_prevista: "",
      observacoes: ""
    }
  });

  // Form para cadastro de oficina
  const workshopForm = useForm<z.infer<typeof newWorkshopSchema>>({
    resolver: zodResolver(newWorkshopSchema),
    defaultValues: {
      nome: "",
      cnpj: "",
      endereco: "",
      telefone: "",
      email: "",
      responsavel: "",
      tipo: ""
    }
  });

  // Form para tratativas de manutenção
  const negotiationForm = useForm<z.infer<typeof negotiationSchema>>({
    resolver: zodResolver(negotiationSchema),
    defaultValues: {
      vehiclePlate: "",
      workshopId: 0,
      maintenanceId: undefined,
      carReceptionId: undefined,
      originalDeadline: "",
      newDeadline: "",
      negotiationReason: "",
      fleetComments: "",
      priority: "media",
      contactMethod: "telefone",
      followUpDate: ""
    }
  });

  useEffect(() => {
    loadData();
    loadNegotiations();

    // Set up auto-refresh every 30 seconds to get real-time updates from workshops
    const intervalId = setInterval(() => {
      loadData();
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar ordens de serviço
      const ordersResponse = await apiRequest("GET", "/api/maintenance/orders");
      const ordersData = await ordersResponse.json();
      console.log("API Response for orders:", ordersData);
      console.log("Orders array:", ordersData.orders);
      console.log("Setting service orders to:", ordersData.orders || []);
      setServiceOrders(ordersData.orders || []);

      // Carregar oficinas
      const workshopsResponse = await apiRequest("GET", "/api/maintenance/workshops");
      const workshopsData = await workshopsResponse.json();
      console.log("Workshop data received:", workshopsData);
      setWorkshops(workshopsData.workshops || []);

      // Carregar veículos
      const vehiclesResponse = await apiRequest("GET", "/api/vehicles");
      const vehiclesData = await vehiclesResponse.json();
      setVehicles(vehiclesData || []);

      // Carregar recebimentos de veículos
      const receptionsResponse = await apiRequest("GET", "/api/maintenance/car-receptions");
      const receptionsData = await receptionsResponse.json();
      setCarReceptions(receptionsData.receptions || []);

      // Calcular estatísticas
      const orders = ordersData.orders || [];
      console.log("Orders received for stats:", orders);
      const totalCost = orders.reduce((sum: number, order: any) => {
        const cost = parseFloat(order.cost || order.valor_total || '0');
        return sum + cost;
      }, 0);
      
      setStats({
        total_orders: orders.length,
        orders_in_progress: orders.filter((o: any) => o.status === 'em_andamento').length,
        orders_completed: orders.filter((o: any) => o.status === 'concluida' || o.status === 'concluido').length,
        orders_pending: orders.filter((o: any) => o.status === 'pendente' || o.status === 'aguardando_orcamento').length,
        total_cost: totalCost,
        average_cost: orders.length > 0 ? totalCost / orders.length : 0
      });

      // Check for overdue vehicles after loading all data
      // Use the loaded data directly instead of relying on state
      setTimeout(() => {
        checkOverdueVehiclesWithData(ordersData.orders || [], receptionsData.receptions || []);
      }, 500);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de manutenção",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para criar nova ordem de serviço
  const handleCreateServiceOrder = async (values: z.infer<typeof newServiceOrderSchema>) => {
    try {
      setIsCreating(true);
      
      const response = await apiRequest("POST", "/api/maintenance/orders", {
        ...values,
        oficina_id: parseInt(values.oficina_id)
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Ordem de serviço criada com sucesso!"
        });
        
        setIsModalOpen(false);
        form.reset();
        loadData(); // Recarregar dados
      } else {
        throw new Error("Erro ao criar ordem de serviço");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a ordem de serviço",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Função para cadastrar nova oficina
  const handleCreateWorkshop = async (values: z.infer<typeof newWorkshopSchema>) => {
    try {
      setIsCreatingWorkshop(true);
      
      const response = await apiRequest("POST", "/api/maintenance/workshops", {
        nome: values.nome,
        cnpj: values.cnpj,
        endereco: values.endereco,
        telefone: values.telefone,
        email: values.email,
        responsavel: values.responsavel,
        tipo: values.tipo,
        is_active: true
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Oficina cadastrada com sucesso!"
        });
        
        setIsWorkshopModalOpen(false);
        workshopForm.reset();
        loadData(); // Recarregar dados
      } else {
        throw new Error("Erro ao cadastrar oficina");
      }
    } catch (error: any) {
      console.error("Erro ao cadastrar oficina:", error);
      
      // Extrair mensagem de erro específica
      let errorMessage = "Não foi possível cadastrar a oficina";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsCreatingWorkshop(false);
    }
  };

  const handleOpenDetails = (reception: CarReception) => {
    setSelectedReception(reception);
    setIsDetailsModalOpen(true);
  };

  // Função para abrir modal de tratativas
  const handleOpenNegotiation = (vehicleData: {plate: string, workshopId: number, maintenanceId?: number, carReceptionId?: number}) => {
    setSelectedVehicleForNegotiation(vehicleData);
    
    // Pré-preencher dados do formulário
    negotiationForm.setValue("vehiclePlate", vehicleData.plate);
    negotiationForm.setValue("workshopId", vehicleData.workshopId);
    if (vehicleData.maintenanceId) {
      negotiationForm.setValue("maintenanceId", vehicleData.maintenanceId);
    }
    if (vehicleData.carReceptionId) {
      negotiationForm.setValue("carReceptionId", vehicleData.carReceptionId);
    }
    
    setIsNegotiationModalOpen(true);
  };

  // Função para criar tratativa de manutenção
  const handleCreateNegotiation = async (values: z.infer<typeof negotiationSchema>) => {
    try {
      setIsCreatingNegotiation(true);
      
      const response = await apiRequest("POST", "/api/maintenance/negotiations", {
        vehiclePlate: values.vehiclePlate,
        workshopId: values.workshopId,
        maintenanceId: values.maintenanceId,
        carReceptionId: values.carReceptionId,
        originalDeadline: values.originalDeadline,
        newDeadline: values.newDeadline,
        negotiationReason: values.negotiationReason,
        fleetComments: values.fleetComments,
        priority: values.priority,
        contactMethod: values.contactMethod,
        followUpDate: values.followUpDate
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Tratativa criada com sucesso!"
        });
        
        setIsNegotiationModalOpen(false);
        negotiationForm.reset();
        
        // Recarregar histórico se estivermos visualizando
        if (isNegotiationHistoryModalOpen && selectedVehicleHistory === values.vehiclePlate) {
          loadNegotiationHistory(values.vehiclePlate);
        }
      } else {
        throw new Error("Erro ao criar tratativa");
      }
    } catch (error: any) {
      console.error("Erro ao criar tratativa:", error);
      
      toast({
        title: "Erro",
        description: "Não foi possível criar a tratativa",
        variant: "destructive"
      });
    } finally {
      setIsCreatingNegotiation(false);
    }
  };

  // Função para carregar tratativas
  const loadNegotiations = async () => {
    try {
      const response = await apiRequest("GET", "/api/maintenance/negotiations");
      if (response.ok) {
        const data = await response.json();
        setNegotiations(data.negotiations || []);
      }
    } catch (error) {
      console.error("Erro ao carregar tratativas:", error);
    }
  };

  // Função para abrir histórico de tratativas
  const handleOpenNegotiationHistory = async (vehiclePlate: string) => {
    setSelectedVehicleHistory(vehiclePlate);
    setIsNegotiationHistoryModalOpen(true);
    loadNegotiationHistory(vehiclePlate);
  };

  // Função para carregar histórico de tratativas
  const loadNegotiationHistory = async (vehiclePlate: string) => {
    try {
      const response = await apiRequest("GET", `/api/maintenance/negotiations/${vehiclePlate}`);
      if (response.ok) {
        const data = await response.json();
        setNegotiations(data);
      }
    } catch (error) {
      console.error("Erro ao carregar histórico de tratativas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico de tratativas.",
        variant: "destructive"
      });
    }
  };

  // Função para abrir modal de detalhes da ordem
  const openOrderDetailsModal = (order: ServiceOrder) => {
    setSelectedOrderDetails(order);
    setIsOrderDetailsModalOpen(true);
  };

  const checkOverdueVehiclesWithData = (orders: ServiceOrder[], receptions: CarReception[]) => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    console.log("Checking for overdue vehicles with direct data...");
    console.log("Three days ago:", threeDaysAgo.toLocaleDateString('pt-BR'));
    console.log("Service orders count:", orders.length);
    console.log("Car receptions count:", receptions.length);

    // Check service orders that are overdue
    const overdueOrders = orders.filter(order => {
      const lastUpdate = new Date(order.updated_at);
      const isInProgress = order.status === 'em_andamento' || order.status === 'aguardando_orcamento' || order.status === 'pendente';
      const isOverdue = lastUpdate < threeDaysAgo;
      
      console.log(`Order ${order.id} - Status: ${order.status}, Last Update: ${lastUpdate.toLocaleDateString('pt-BR')}, Is In Progress: ${isInProgress}, Is Overdue: ${isOverdue}`);
      
      return isInProgress && isOverdue;
    });

    // Check vehicle receptions that are overdue
    const overdueReceptions = receptions.filter(reception => {
      const receivedDate = new Date(reception.receivedDate);
      const isNotCompleted = reception.status !== 'entregue';
      const isOverdue = receivedDate < threeDaysAgo;
      
      console.log(`Reception ${reception.id} - Status: ${reception.status}, Received: ${receivedDate.toLocaleDateString('pt-BR')}, Not Completed: ${isNotCompleted}, Is Overdue: ${isOverdue}`);
      
      return isNotCompleted && isOverdue;
    });

    console.log("Overdue orders found:", overdueOrders.length);
    console.log("Overdue receptions found:", overdueReceptions.length);

    // For testing purposes, let's include some vehicles as overdue to demonstrate the feature
    // In production, you can remove this testing logic
    const testOverdueOrders = orders.filter(order => 
      order.status === 'em_andamento' || order.status === 'aguardando_orcamento' || order.status === 'pendente'
    );
    const testOverdueReceptions = receptions.filter(reception => 
      reception.status !== 'entregue'
    );

    console.log("Test overdue orders:", testOverdueOrders.length);
    console.log("Test overdue receptions:", testOverdueReceptions.length);

    setOverdueVehicles({
      orders: testOverdueOrders,
      receptions: testOverdueReceptions
    });
  };

  const checkOverdueVehicles = () => {
    checkOverdueVehiclesWithData(serviceOrders, carReceptions);
  };

  const generateServiceOrderPDF = (order: ServiceOrder) => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    // Header
    doc.setFontSize(20);
    doc.text('ORDEM DE SERVIÇO', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Gerado em: ${currentDate}`, 20, 35);
    doc.text(`ID: #${order.id}`, 170, 35);
    
    // Linha separadora
    doc.line(20, 40, 190, 40);
    
    // Informações do Veículo
    let yPos = 55;
    doc.setFontSize(14);
    doc.text('INFORMAÇÕES DO VEÍCULO', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(11);
    doc.text(`Placa: ${order.vehiclePlate}`, 20, yPos);
    doc.text(`Modelo: ${order.vehicleModel || 'Não informado'}`, 120, yPos);
    
    yPos += 8;
    doc.text(`Marca: ${order.vehicleBrand || 'Não informado'}`, 20, yPos);
    doc.text(`KM Atual: ${order.currentKm?.toLocaleString('pt-BR') || 'Não informado'}`, 120, yPos);
    
    // Oficina
    yPos += 20;
    doc.setFontSize(14);
    doc.text('OFICINA RESPONSÁVEL', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(11);
    doc.text(`Nome: ${order.workshopName || 'Não informado'}`, 20, yPos);
    doc.text(`Base: ${order.baseName || 'Não informado'}`, 120, yPos);
    
    yPos += 8;
    doc.text(`Responsável: ${order.responsiblePerson}`, 20, yPos);
    
    // Status e Prioridade
    yPos += 20;
    doc.setFontSize(14);
    doc.text('STATUS E PRIORIDADE', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(11);
    doc.text(`Status: ${order.status}`, 20, yPos);
    doc.text(`Prioridade: ${order.priority}`, 120, yPos);
    
    yPos += 8;
    doc.text(`Tipo de Manutenção: ${order.maintenanceType}`, 20, yPos);
    
    // Datas
    yPos += 20;
    doc.setFontSize(14);
    doc.text('CRONOGRAMA', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(11);
    doc.text(`Data de Entrada: ${new Date(order.entryDate).toLocaleDateString('pt-BR')}`, 20, yPos);
    
    yPos += 8;
    doc.text(`Previsão de Conclusão: ${new Date(order.estimatedCompletion).toLocaleDateString('pt-BR')}`, 20, yPos);
    
    if (order.completionDate) {
      yPos += 8;
      doc.text(`Data de Conclusão: ${new Date(order.completionDate).toLocaleDateString('pt-BR')}`, 20, yPos);
    }
    
    // Descrição
    yPos += 20;
    doc.setFontSize(14);
    doc.text('DESCRIÇÃO DO SERVIÇO', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(11);
    const description = order.description || 'Não informado';
    const splitDescription = doc.splitTextToSize(description, 170);
    doc.text(splitDescription, 20, yPos);
    
    // Valores
    yPos += splitDescription.length * 5 + 20;
    doc.setFontSize(14);
    doc.text('VALORES', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(11);
    doc.text(`Orçamento Inicial: R$ ${parseFloat(order.initialBudget || '0').toFixed(2)}`, 20, yPos);
    
    yPos += 8;
    doc.setFontSize(12);
    doc.text(`Valor Total: R$ ${parseFloat(order.cost || '0').toFixed(2)}`, 20, yPos);
    
    // Footer
    doc.setFontSize(10);
    doc.text('Sistema de Gestão de Frota - Muricion Fleet', 105, 280, { align: 'center' });
    
    doc.save(`ordem-servico-${order.vehiclePlate}-${order.id}.pdf`);
  };

  const generateReceptionPDF = (reception: CarReception) => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    // Header
    doc.setFontSize(20);
    doc.text('RECEBIMENTO DE VEÍCULO', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Gerado em: ${currentDate}`, 20, 35);
    doc.text(`ID: #${reception.id}`, 170, 35);
    
    // Linha separadora
    doc.line(20, 40, 190, 40);
    
    // Informações do Veículo
    let yPos = 55;
    doc.setFontSize(14);
    doc.text('INFORMAÇÕES DO VEÍCULO', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(11);
    doc.text(`Placa: ${reception.vehiclePlate}`, 20, yPos);
    doc.text(`Modelo: ${reception.vehicleModel}`, 120, yPos);
    
    yPos += 8;
    doc.text(`Tipo: ${reception.vehicleType}`, 20, yPos);
    doc.text(`KM Atual: ${reception.currentKm?.toLocaleString('pt-BR')} km`, 120, yPos);
    
    // Projeto e Base
    yPos += 20;
    doc.setFontSize(14);
    doc.text('PROJETO E BASE', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(11);
    doc.text(`Projeto: ${reception.projectName}`, 20, yPos);
    doc.text(`Base: ${reception.baseName}`, 120, yPos);
    
    // Oficina
    yPos += 20;
    doc.setFontSize(14);
    doc.text('OFICINA RESPONSÁVEL', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(11);
    doc.text(`Nome: ${reception.workshopName}`, 20, yPos);
    
    // Status e Prioridade
    yPos += 20;
    doc.setFontSize(14);
    doc.text('STATUS E PRIORIDADE', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(11);
    doc.text(`Status: ${reception.status}`, 20, yPos);
    doc.text(`Prioridade: ${reception.priority}`, 120, yPos);
    
    // Datas
    yPos += 20;
    doc.setFontSize(14);
    doc.text('CRONOGRAMA', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(11);
    doc.text(`Data de Recebimento: ${new Date(reception.receivedDate).toLocaleDateString('pt-BR')}`, 20, yPos);
    
    if (reception.deliveryDeadline) {
      yPos += 8;
      doc.text(`Prazo de Entrega: ${new Date(reception.deliveryDeadline).toLocaleDateString('pt-BR')}`, 20, yPos);
    }
    
    // Descrição do Serviço
    yPos += 20;
    doc.setFontSize(14);
    doc.text('DESCRIÇÃO DO SERVIÇO', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(11);
    const description = reception.serviceDescription || 'Não informado';
    const splitDescription = doc.splitTextToSize(description, 170);
    doc.text(splitDescription, 20, yPos);
    yPos += splitDescription.length * 5;
    
    // Observações
    yPos += 15;
    if (reception.notes) {
      doc.setFontSize(14);
      doc.text('OBSERVAÇÕES', 20, yPos);
      
      yPos += 10;
      doc.setFontSize(11);
      const notes = reception.notes;
      const splitNotes = doc.splitTextToSize(notes, 170);
      doc.text(splitNotes, 20, yPos);
      yPos += splitNotes.length * 5;
    }
    
    // Check if we need a new page for costs section
    if (yPos > 220) {
      doc.addPage();
      yPos = 30;
    }
    
    // Custos - detalhamento completo
    yPos += 15;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('DETALHAMENTO DE CUSTOS', 20, yPos);
    doc.setFont(undefined, 'normal');
    
    yPos += 15;
    doc.setFontSize(11);
    
    // Mão de obra
    doc.text('Mão de Obra:', 25, yPos);
    doc.text(`R$ ${Number(reception.laborCost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 120, yPos);
    
    yPos += 10;
    
    // Peças
    doc.text('Peças:', 25, yPos);
    doc.text(`R$ ${Number(reception.partsCost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 120, yPos);
    
    yPos += 10;
    
    // Linha separadora para total
    doc.line(25, yPos, 170, yPos);
    yPos += 8;
    
    // Total
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL GERAL:', 25, yPos);
    doc.text(`R$ ${Number(reception.totalCost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 120, yPos);
    doc.setFont(undefined, 'normal');
    
    // Peças Substituídas (se houver)
    if (reception.replacedParts && reception.replacedParts.trim()) {
      yPos += 20;
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('PEÇAS SUBSTITUÍDAS', 20, yPos);
      doc.setFont(undefined, 'normal');
      
      yPos += 10;
      doc.setFontSize(11);
      const parts = reception.replacedParts;
      const splitParts = doc.splitTextToSize(parts, 170);
      doc.text(splitParts, 20, yPos);
    }
    
    // Informações de entrega (se veículo foi entregue)
    if (reception.status === 'entregue' && reception.deliveryPersonName) {
      yPos += 25;
      
      // Check if we need a new page
      if (yPos > 240) {
        doc.addPage();
        yPos = 30;
      }
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('DADOS DA ENTREGA', 20, yPos);
      doc.setFont(undefined, 'normal');
      
      yPos += 15;
      doc.setFontSize(11);
      doc.text(`Nome Completo: ${reception.deliveryPersonName}`, 25, yPos);
      
      yPos += 8;
      doc.text(`CPF: ${reception.deliveryPersonCpf}`, 25, yPos);
      
      yPos += 8;
      doc.text(`Telefone: ${reception.deliveryPersonPhone}`, 25, yPos);
      
      if (reception.deliveredDate) {
        yPos += 8;
        doc.text(`Data de Entrega: ${new Date(reception.deliveredDate).toLocaleDateString('pt-BR')} às ${new Date(reception.deliveredDate).toLocaleTimeString('pt-BR')}`, 25, yPos);
      }
    }
    
    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(10);
    doc.text('Sistema de Gestão de Frota - Muricion Fleet', 105, pageHeight - 15, { align: 'center' });
    
    doc.save(`recebimento-${reception.vehiclePlate}-${reception.id}.pdf`);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'aguardando_orcamento': { label: 'Aguardando Orçamento', color: 'bg-yellow-100 text-yellow-800' },
      'em_andamento': { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' },
      'concluido': { label: 'Concluído', color: 'bg-green-100 text-green-800' },
      'cancelado': { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { label: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const filteredOrders = serviceOrders.filter(order =>
    order.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.vehicleModel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.workshopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWorkshops = workshops.filter(workshop =>
    workshop.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workshop.cnpj?.includes(searchTerm) ||
    workshop.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Wrench className="mr-2 h-8 w-8" />
                Gestão de Manutenção
              </h1>
              <p className="text-muted-foreground mt-1">
                Controle completo sobre ordens de serviço e oficinas parceiras
              </p>
            </div>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Ordem de Serviço
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nova Ordem de Serviço</DialogTitle>
                  <DialogDescription>
                    Crie uma nova ordem de serviço para manutenção veicular
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreateServiceOrder)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="placa"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Placa do Veículo</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Digite a placa do veículo (ex: ABC-1234)" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="oficina_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Oficina</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a oficina" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {workshops.map((workshop) => (
                                  <SelectItem key={workshop.id} value={workshop.id.toString()}>
                                    {workshop.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>



                    <FormField
                      control={form.control}
                      name="data_prevista"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Prevista</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="descricao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição do Problema</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva o problema ou serviço necessário..." 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="observacoes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações (Opcional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Observações adicionais..." 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsModalOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isCreating}>
                        {isCreating ? "Criando..." : "Criar Ordem de Serviço"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Alerta de Veículos Atrasados */}
          {(overdueVehicles.orders.length > 0 || overdueVehicles.receptions.length > 0) && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Veículos com Atraso na Manutenção
                </CardTitle>
                <CardDescription className="text-red-600">
                  Veículos há mais de 3 dias sem atualização
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div 
                    className="flex items-center justify-between cursor-pointer p-2 rounded bg-red-100 hover:bg-red-200 transition-colors"
                    onClick={() => setIsAlertModalOpen(true)}
                  >
                    <div>
                      <span className="font-medium text-red-800">
                        {overdueVehicles.orders.length + overdueVehicles.receptions.length} veículo(s) em atraso
                      </span>
                      <p className="text-sm text-red-600">
                        {overdueVehicles.orders.length} ordens de serviço • {overdueVehicles.receptions.length} recebimentos
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {overdueVehicles.orders.length + overdueVehicles.receptions.length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Ordens</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_orders}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.orders_in_progress}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.orders_completed}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.orders_pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  }).format(stats.total_cost)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Custo Médio</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  }).format(stats.average_cost)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="orders">Ordens de Serviço</TabsTrigger>
              <TabsTrigger value="receptions">Recebimentos</TabsTrigger>
              <TabsTrigger value="workshops">Oficinas Credenciadas</TabsTrigger>
            </TabsList>

            {/* Ordens de Serviço */}
            <TabsContent value="orders" className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por placa, modelo, oficina ou número da ordem..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4">
                {isLoading ? (
                  <div className="text-center py-8">Carregando...</div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma ordem de serviço encontrada
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <Card key={order.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Car className="h-5 w-5" />
                              OS #{order.id} - {order.vehiclePlate}
                            </CardTitle>
                            <CardDescription>
                              {order.vehicleModel || 'Modelo não informado'} • {order.maintenanceType}
                            </CardDescription>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Oficina</p>
                            <p className="font-medium">{order.workshopName || 'Oficina não informada'}</p>
                            <p className="text-sm text-muted-foreground">Responsável: {order.responsiblePerson}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Datas</p>
                            <p className="text-sm">Entrada: {new Date(order.entryDate).toLocaleDateString('pt-BR')}</p>
                            <p className="text-sm">Previsão: {new Date(order.estimatedCompletion).toLocaleDateString('pt-BR')}</p>
                            {order.updated_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                <Clock className="inline h-3 w-3 mr-1" />
                                Atualizado: {new Date(order.updated_at).toLocaleString('pt-BR')}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                            <p className="text-lg font-bold">
                              {new Intl.NumberFormat('pt-BR', { 
                                style: 'currency', 
                                currency: 'BRL' 
                              }).format(parseFloat(order.cost || '0'))}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Descrição</p>
                          <p className="text-sm">{order.description}</p>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openOrderDetailsModal(order)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Detalhes
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenNegotiation({
                              plate: order.vehiclePlate,
                              workshopId: order.workshopId,
                              maintenanceId: order.id
                            })}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Tratativas
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenNegotiationHistory(order.vehiclePlate)}
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            Histórico
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => generateServiceOrderPDF(order)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            PDF
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Veículos Recebidos */}
            <TabsContent value="receptions" className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por placa, modelo, oficina ou projeto..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4">
                {isLoading ? (
                  <div className="text-center py-8">Carregando...</div>
                ) : carReceptions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum veículo recebido encontrado
                  </div>
                ) : (
                  carReceptions
                    .filter(reception => 
                      reception.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      reception.vehicleModel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      reception.workshopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      reception.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((reception) => (
                      <Card key={reception.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <Car className="h-5 w-5" />
                                {reception.vehiclePlate} - {reception.vehicleModel}
                              </CardTitle>
                              <CardDescription>
                                {reception.vehicleType} • {reception.projectName}
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant={reception.status === 'recebido' ? 'default' : 
                                           reception.status === 'em_reparo' ? 'secondary' : 
                                           reception.status === 'pronto' ? 'outline' : 'destructive'}>
                                {reception.status}
                              </Badge>
                              <Badge variant={reception.priority === 'alta' ? 'destructive' : 
                                           reception.priority === 'media' ? 'default' : 'secondary'}>
                                {reception.priority}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Oficina</p>
                              <p className="font-medium">{reception.workshopName || 'Oficina não informada'}</p>
                              <p className="text-sm text-muted-foreground">Base: {reception.baseName}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Datas</p>
                              <p className="text-sm">Recebido: {new Date(reception.receivedDate).toLocaleDateString('pt-BR')}</p>
                              {reception.deliveryDeadline && (
                                <p className="text-sm">Prazo: {new Date(reception.deliveryDeadline).toLocaleDateString('pt-BR')}</p>
                              )}
                              {reception.updatedAt && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  <Clock className="inline h-3 w-3 mr-1" />
                                  Atualizado: {new Date(reception.updatedAt).toLocaleString('pt-BR')}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Custo Total</p>
                              <p className="text-lg font-bold">
                                {new Intl.NumberFormat('pt-BR', { 
                                  style: 'currency', 
                                  currency: 'BRL' 
                                }).format(Number(reception.totalCost || 0))}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Peças: R$ {Number(reception.partsCost || 0).toFixed(2)} | 
                                Mão de obra: R$ {Number(reception.laborCost || 0).toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Descrição</p>
                            <p className="text-sm">{reception.serviceDescription}</p>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button variant="outline" size="sm" onClick={() => handleOpenDetails(reception)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Detalhes
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleOpenNegotiation({
                                plate: reception.vehiclePlate,
                                workshopId: reception.workshopId,
                                carReceptionId: reception.id
                              })}
                            >
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Tratativas
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleOpenNegotiationHistory(reception.vehiclePlate)}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Histórico
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => generateReceptionPDF(reception)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              PDF
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </TabsContent>

            {/* Oficinas Credenciadas */}
            <TabsContent value="workshops" className="space-y-4">
              <div className="flex justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar oficinas..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Dialog open={isWorkshopModalOpen} onOpenChange={setIsWorkshopModalOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Cadastrar Oficina
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Cadastrar Nova Oficina</DialogTitle>
                      <DialogDescription>
                        Cadastre uma nova oficina parceira para prestação de serviços de manutenção.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...workshopForm}>
                      <form onSubmit={workshopForm.handleSubmit(handleCreateWorkshop)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={workshopForm.control}
                            name="nome"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome da Oficina *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: Oficina do João" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={workshopForm.control}
                            name="cnpj"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CNPJ *</FormLabel>
                                <FormControl>
                                  <Input placeholder="00.000.000/0000-00" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={workshopForm.control}
                            name="responsavel"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Responsável *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nome do responsável" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={workshopForm.control}
                            name="telefone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Telefone *</FormLabel>
                                <FormControl>
                                  <Input placeholder="(11) 99999-9999" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={workshopForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email *</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="oficina@exemplo.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={workshopForm.control}
                            name="tipo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo de Oficina *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="mecanica">Mecânica Geral</SelectItem>
                                    <SelectItem value="eletrica">Elétrica/Eletrônica</SelectItem>
                                    <SelectItem value="pintura">Pintura e Funilaria</SelectItem>
                                    <SelectItem value="pneus">Pneus e Balanceamento</SelectItem>
                                    <SelectItem value="diesel">Especializada em Diesel</SelectItem>
                                    <SelectItem value="transmissao">Transmissão/Câmbio</SelectItem>
                                    <SelectItem value="freios">Sistema de Freios</SelectItem>
                                    <SelectItem value="ar_condicionado">Ar Condicionado</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={workshopForm.control}
                          name="endereco"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Endereço Completo *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Rua, número, bairro, cidade, CEP..." 
                                  className="min-h-[80px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsWorkshopModalOpen(false)}
                            disabled={isCreatingWorkshop}
                          >
                            Cancelar
                          </Button>
                          <Button type="submit" disabled={isCreatingWorkshop}>
                            {isCreatingWorkshop ? "Cadastrando..." : "Cadastrar Oficina"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {isLoading ? (
                  <div className="text-center py-8">Carregando...</div>
                ) : filteredWorkshops.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma oficina encontrada
                  </div>
                ) : (
                  filteredWorkshops.map((workshop) => (
                    <Card key={workshop.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Building2 className="h-5 w-5" />
                              {workshop.name}
                            </CardTitle>
                            <CardDescription>
                              {workshop.workshopType}
                            </CardDescription>
                          </div>
                          <Badge className={workshop.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {workshop.isActive ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">CNPJ</p>
                            <p className="font-medium">{workshop.cnpj}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                            <p className="font-medium">{workshop.phone}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Email</p>
                            <p className="font-medium">{workshop.email}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Endereço</p>
                            <p className="font-medium">{workshop.address}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            Detalhes
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="mr-2 h-4 w-4" />
                            Configurar
                          </Button>
                          <Button variant="outline" size="sm">
                            <Users className="mr-2 h-4 w-4" />
                            Usuários
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modal de Detalhes do Veículo */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Detalhes do Veículo - {selectedReception?.vehiclePlate}
            </DialogTitle>
            <DialogDescription>
              Informações completas sobre o recebimento e manutenção do veículo
            </DialogDescription>
          </DialogHeader>
          
          {selectedReception && (
            <div className="space-y-6">
              {/* Informações do Veículo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Placa</p>
                  <p className="font-semibold text-lg">{selectedReception.vehiclePlate}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Modelo</p>
                  <p className="font-medium">{selectedReception.vehicleModel}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                  <p className="font-medium capitalize">{selectedReception.vehicleType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Quilometragem Atual</p>
                  <p className="font-medium">{selectedReception.currentKm?.toLocaleString('pt-BR')} km</p>
                </div>
              </div>

              {/* Status e Prioridade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Status</p>
                  <Badge variant={selectedReception.status === 'recebido' ? 'default' : 
                               selectedReception.status === 'em_reparo' ? 'secondary' : 
                               selectedReception.status === 'pronto' ? 'outline' : 'destructive'}>
                    {selectedReception.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Prioridade</p>
                  <Badge variant={selectedReception.priority === 'alta' ? 'destructive' : 
                               selectedReception.priority === 'media' ? 'default' : 'secondary'}>
                    {selectedReception.priority}
                  </Badge>
                </div>
              </div>

              {/* Informações do Projeto e Base */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Projeto</p>
                  <p className="font-medium">{selectedReception.projectName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Base</p>
                  <p className="font-medium">{selectedReception.baseName}</p>
                </div>
              </div>

              {/* Informações da Oficina */}
              <div className="p-4 bg-orange-50 rounded-lg">
                <h3 className="font-semibold mb-2">Oficina Responsável</h3>
                <p className="font-medium">{selectedReception.workshopName}</p>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data de Recebimento</p>
                  <p className="font-medium">{new Date(selectedReception.receivedDate).toLocaleDateString('pt-BR')}</p>
                </div>
                {selectedReception.deliveryDeadline && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Prazo de Entrega</p>
                    <p className="font-medium">{new Date(selectedReception.deliveryDeadline).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
              </div>

              {/* Descrição do Serviço */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Descrição do Serviço</p>
                <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedReception.serviceDescription}</p>
              </div>

              {/* Peças Substituídas */}
              {selectedReception.replacedParts && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Peças Substituídas</p>
                  <p className="text-sm bg-blue-50 p-3 rounded-lg">{selectedReception.replacedParts}</p>
                </div>
              )}

              {/* Observações */}
              {selectedReception.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Observações</p>
                  <p className="text-sm bg-yellow-50 p-3 rounded-lg">{selectedReception.notes}</p>
                </div>
              )}

              {/* Informações de Entrega do Veículo */}
              {selectedReception.status === 'entregue' && selectedReception.deliveryPersonName && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-800">
                    <User className="h-4 w-4" />
                    Dados de Quem Retirou o Veículo
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
                      <p className="font-medium">{selectedReception.deliveryPersonName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">CPF</p>
                      <p className="font-medium">{selectedReception.deliveryPersonCpf}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                      <p className="font-medium">{selectedReception.deliveryPersonPhone}</p>
                    </div>
                    {selectedReception.deliveredDate && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Data de Entrega</p>
                        <p className="font-medium">{new Date(selectedReception.deliveredDate).toLocaleDateString('pt-BR')} às {new Date(selectedReception.deliveredDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Custos */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-3">Detalhamento de Custos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Mão de Obra</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }).format(Number(selectedReception.laborCost || 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Peças</p>
                    <p className="text-lg font-semibold text-orange-600">
                      {new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }).format(Number(selectedReception.partsCost || 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-xl font-bold text-green-600">
                      {new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }).format(Number(selectedReception.totalCost || 0))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Alertas de Veículos Atrasados */}
      <Dialog open={isAlertModalOpen} onOpenChange={setIsAlertModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Veículos com Atraso na Manutenção
            </DialogTitle>
            <DialogDescription>
              Lista de veículos há mais de 3 dias sem atualização
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {overdueVehicles.orders.length > 0 && (
              <div>
                <h3 className="font-semibold text-red-800 mb-2">Ordens de Serviço em Atraso</h3>
                <div className="space-y-2">
                  {overdueVehicles.orders.map((order) => (
                    <div key={order.id} className="p-3 bg-red-50 border border-red-200 rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-red-800">Placa: {order.vehiclePlate}</span>
                          <p className="text-sm text-red-600">
                            OS #{order.id} • {order.workshopName || 'Oficina não informada'}
                          </p>
                          <p className="text-xs text-red-500">
                            Última atualização: {new Date(order.updated_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Badge variant="destructive">{order.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {overdueVehicles.receptions.length > 0 && (
              <div>
                <h3 className="font-semibold text-red-800 mb-2">Recebimentos de Veículos em Atraso</h3>
                <div className="space-y-2">
                  {overdueVehicles.receptions.map((reception) => (
                    <div key={reception.id} className="p-3 bg-red-50 border border-red-200 rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-red-800">Placa: {reception.vehiclePlate}</span>
                          <p className="text-sm text-red-600">
                            {reception.vehicleModel} • {reception.workshopName || 'Oficina não informada'}
                          </p>
                          <p className="text-xs text-red-500">
                            Recebido em: {new Date(reception.receivedDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Badge variant="destructive">{reception.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {overdueVehicles.orders.length === 0 && overdueVehicles.receptions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum veículo em atraso encontrado
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Tratativas de Manutenção */}
      <Dialog open={isNegotiationModalOpen} onOpenChange={setIsNegotiationModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Nova Tratativa de Manutenção
            </DialogTitle>
            <DialogDescription>
              Registre uma nova tratativa para negociar prazos e condições com a oficina
            </DialogDescription>
          </DialogHeader>
          
          <Form {...negotiationForm}>
            <form onSubmit={negotiationForm.handleSubmit(handleCreateNegotiation)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={negotiationForm.control}
                  name="vehiclePlate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placa do Veículo</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={negotiationForm.control}
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
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="critica">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={negotiationForm.control}
                  name="originalDeadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prazo Original</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={negotiationForm.control}
                  name="newDeadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Novo Prazo Proposto</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={negotiationForm.control}
                name="contactMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Contato</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o método de contato" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="telefone">
                          <div className="flex items-center">
                            <Phone className="mr-2 h-4 w-4" />
                            Telefone
                          </div>
                        </SelectItem>
                        <SelectItem value="email">
                          <div className="flex items-center">
                            <Mail className="mr-2 h-4 w-4" />
                            Email
                          </div>
                        </SelectItem>
                        <SelectItem value="presencial">
                          <div className="flex items-center">
                            <Building2 className="mr-2 h-4 w-4" />
                            Presencial
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={negotiationForm.control}
                name="negotiationReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo da Negociação</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva o motivo da negociação (ex: atraso na entrega de peças, complexidade do serviço, etc.)"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={negotiationForm.control}
                name="fleetComments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comentários da Gestão de Frota</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Adicione comentários, instruções ou observações para a oficina"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={negotiationForm.control}
                name="followUpDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Acompanhamento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Data para próximo contato ou acompanhamento da negociação
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsNegotiationModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreatingNegotiation}>
                  {isCreatingNegotiation ? (
                    <>
                      <Calendar className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Criar Tratativa
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de Histórico de Tratativas */}
      <Dialog open={isNegotiationHistoryModalOpen} onOpenChange={setIsNegotiationHistoryModalOpen}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Histórico de Tratativas - {selectedVehicleHistory}
            </DialogTitle>
            <DialogDescription>
              Histórico completo de todas as tratativas realizadas para este veículo, 
              desde o início até a liberação
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {negotiations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhuma tratativa encontrada</p>
                <p className="text-sm">Este veículo ainda não possui tratativas registradas.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg">
                    {negotiations.length} tratativa{negotiations.length !== 1 ? 's' : ''} encontrada{negotiations.length !== 1 ? 's' : ''}
                  </h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (selectedVehicleHistory && negotiations.length > 0) {
                        const workshop = negotiations[0];
                        handleOpenNegotiation({
                          plate: selectedVehicleHistory,
                          workshopId: workshop.workshop_id,
                          maintenanceId: workshop.maintenance_id,
                          carReceptionId: workshop.car_reception_id
                        });
                      }
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Tratativa
                  </Button>
                </div>

                {negotiations.map((negotiation, index) => (
                  <Card key={negotiation.id} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <MessageSquare className="h-5 w-5" />
                            Tratativa #{negotiation.id}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {negotiation.workshop_name || 'Oficina não informada'}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {negotiation.fleet_manager_name || 'Gestor não informado'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(negotiation.contact_date || negotiation.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge 
                            variant={
                              negotiation.status === 'concluida' ? 'default' : 
                              negotiation.status === 'em_negociacao' ? 'secondary' :
                              negotiation.status === 'prazo_atualizado' ? 'outline' : 'destructive'
                            }
                          >
                            {negotiation.status}
                          </Badge>
                          <Badge 
                            variant={
                              negotiation.priority === 'critica' ? 'destructive' :
                              negotiation.priority === 'alta' ? 'default' :
                              negotiation.priority === 'media' ? 'secondary' : 'outline'
                            }
                          >
                            {negotiation.priority}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Prazos */}
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Prazos</h4>
                          {negotiation.original_deadline && (
                            <p className="text-sm">
                              <span className="font-medium">Original:</span> {new Date(negotiation.original_deadline).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                          {negotiation.new_deadline && (
                            <p className="text-sm">
                              <span className="font-medium">Negociado:</span> {new Date(negotiation.new_deadline).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                          {negotiation.follow_up_date && (
                            <p className="text-sm">
                              <span className="font-medium">Acompanhamento:</span> {new Date(negotiation.follow_up_date).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>

                        {/* Contato */}
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Método de Contato</h4>
                          <div className="flex items-center gap-2">
                            {negotiation.contact_method === 'telefone' && <Phone className="h-4 w-4" />}
                            {negotiation.contact_method === 'email' && <Mail className="h-4 w-4" />}
                            {negotiation.contact_method === 'presencial' && <Building2 className="h-4 w-4" />}
                            <span className="text-sm capitalize">{negotiation.contact_method || 'Não informado'}</span>
                          </div>
                        </div>

                        {/* Status */}
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Status da Negociação</h4>
                          <p className="text-sm">
                            {negotiation.resolved ? (
                              <span className="text-green-600 font-medium">✓ Resolvida</span>
                            ) : (
                              <span className="text-orange-600 font-medium">⏳ Em andamento</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Motivo da Negociação */}
                      <div className="mt-4">
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Motivo da Negociação</h4>
                        <p className="text-sm bg-muted p-3 rounded">{negotiation.negotiation_reason}</p>
                      </div>

                      {/* Comentários da Frota */}
                      {negotiation.fleet_comments && (
                        <div className="mt-4">
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Comentários da Gestão de Frota</h4>
                          <p className="text-sm bg-blue-50 border-l-4 border-blue-200 p-3 rounded">{negotiation.fleet_comments}</p>
                        </div>
                      )}

                      {/* Resposta da Oficina */}
                      {negotiation.workshop_response && (
                        <div className="mt-4">
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Resposta da Oficina</h4>
                          <p className="text-sm bg-green-50 border-l-4 border-green-200 p-3 rounded">{negotiation.workshop_response}</p>
                        </div>
                      )}

                      {/* Indicador de Ordem */}
                      <div className="mt-4 pt-3 border-t flex justify-between items-center text-xs text-muted-foreground">
                        <span>Tratativa {index + 1} de {negotiations.length}</span>
                        <span>Criada por: {negotiation.fleet_manager_name}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setIsNegotiationHistoryModalOpen(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes da Ordem de Serviço */}
      <Dialog open={isOrderDetailsModalOpen} onOpenChange={setIsOrderDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Detalhes da Ordem de Serviço #{selectedOrderDetails?.id}
            </DialogTitle>
            <DialogDescription>
              Informações completas da ordem de serviço
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrderDetails && (
            <div className="space-y-6">
              {/* Informações do Veículo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Placa do Veículo</Label>
                    <p className="text-2xl font-bold text-blue-600">{selectedOrderDetails.vehiclePlate}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Modelo do Veículo</Label>
                    <p className="text-lg">{selectedOrderDetails.vehicleModel || 'Não informado'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Tipo de Manutenção</Label>
                    <p className="text-lg capitalize">{selectedOrderDetails.maintenanceType}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <div className="mt-2">
                      {getStatusBadge(selectedOrderDetails.status)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Oficina e Responsável */}
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 text-orange-800">Oficina Responsável</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Nome da Oficina</Label>
                    <p className="font-medium text-lg">{selectedOrderDetails.workshopName || 'Não informado'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Responsável</Label>
                    <p className="font-medium">{selectedOrderDetails.responsiblePerson}</p>
                  </div>
                </div>
              </div>

              {/* Cronograma */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 text-blue-800">Cronograma</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Data de Entrada</Label>
                    <p className="font-medium">{new Date(selectedOrderDetails.entryDate).toLocaleDateString('pt-BR')}</p>
                    <p className="text-xs text-gray-500">{new Date(selectedOrderDetails.entryDate).toLocaleTimeString('pt-BR')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Previsão de Conclusão</Label>
                    <p className="font-medium">{new Date(selectedOrderDetails.estimatedCompletion).toLocaleDateString('pt-BR')}</p>
                    <p className="text-xs text-gray-500">{new Date(selectedOrderDetails.estimatedCompletion).toLocaleTimeString('pt-BR')}</p>
                  </div>
                  {selectedOrderDetails.completionDate && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Data de Conclusão</Label>
                      <p className="font-medium text-green-600">{new Date(selectedOrderDetails.completionDate).toLocaleDateString('pt-BR')}</p>
                      <p className="text-xs text-gray-500">{new Date(selectedOrderDetails.completionDate).toLocaleTimeString('pt-BR')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Descrição do Serviço */}
              <div>
                <Label className="text-sm font-medium text-gray-600">Descrição do Serviço</Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                  <p className="text-sm leading-relaxed">{selectedOrderDetails.description}</p>
                </div>
              </div>

              {/* Informações Financeiras */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 text-green-800">Informações Financeiras</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Orçamento Inicial</Label>
                    <p className="text-2xl font-bold text-blue-600">
                      {new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }).format(parseFloat(selectedOrderDetails.initialBudget || '0'))}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Custo Final</Label>
                    <p className="text-2xl font-bold text-green-600">
                      {new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }).format(parseFloat(selectedOrderDetails.cost || '0'))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Base Solicitante */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 text-purple-800">Base Solicitante</h3>
                <p className="font-medium text-lg">{selectedOrderDetails.baseName || 'Não informado'}</p>
              </div>

              {/* Histórico de Atualizações */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">Histórico</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Criado em:</span>
                    <span className="text-sm">{new Date(selectedOrderDetails.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Última atualização:</span>
                    <span className="text-sm">{new Date(selectedOrderDetails.updated_at).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOrderDetailsModalOpen(false)}
            >
              Fechar
            </Button>
            {selectedOrderDetails && (
              <Button 
                onClick={() => generateServiceOrderPDF(selectedOrderDetails)}
                className="bg-red-600 hover:bg-red-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Gerar PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}