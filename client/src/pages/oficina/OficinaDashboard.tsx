import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Wrench, 
  Clock,
  User,
  Phone,
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Car,
  LogOut,
  FileText,
  DollarSign,
  Plus,
  Package,
  Trash2,
  Settings,
  Edit,
  Eye,
  Download,
  Calculator
} from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useLocation } from "wouter";
import BudgetManager from './components/BudgetManager';

interface ServiceOrder {
  id: number;
  vehiclePlate: string;
  description: string;
  status: string;
  priority: string;
  entryDate: string;
  estimatedCompletion?: string;
  initialBudget?: string;
  finalCost?: string;
  maintenanceType: string;
  deliveryPersonName?: string;
  deliveryPersonCpf?: string;
  deliveryPersonPhone?: string;
  deliveredDate?: string;
}

interface CarReception {
  id: number;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleType: string;
  currentKm: number;
  baseId: number;
  projectName: string;
  serviceDescription: string;
  replacedParts?: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  priority: string;
  status: string;
  notes?: string;
  receivedDate: string;
  deliveredDate?: string;
  deliveryDeadline?: string;
  completedDate?: string;
  deliveryPersonName?: string;
  deliveryPersonCpf?: string;
  deliveryPersonPhone?: string;
}

interface OficinaInfo {
  id: number;
  razao_social: string;
  cnpj: string;
  email: string;
  telefone: string;
}

interface WorkPart {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface WorkDetails {
  orderId: number;
  workDescription: string;
  partsUsed: WorkPart[];
  laborHours: number;
  laborRate: number;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  completedDate: string;
  notes: string;
}

export default function OficinaDashboard() {
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [carReceptions, setCarReceptions] = useState<CarReception[]>([]);
  const [oficina, setOficina] = useState<OficinaInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [workDetails, setWorkDetails] = useState<WorkDetails>({
    orderId: 0,
    workDescription: '',
    partsUsed: [],
    laborHours: 0,
    laborRate: 50,
    laborCost: 0,
    partsCost: 0,
    totalCost: 0,
    completedDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Estado para modal de detalhes da ordem de serviço
  const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<ServiceOrder | null>(null);
  
  const [selectedReception, setSelectedReception] = useState<CarReception | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editingReception, setEditingReception] = useState<CarReception | null>(null);
  const [receptionUpdate, setReceptionUpdate] = useState({
    status: "",
    notes: "",
    estimatedCompletion: ""
  });

  // Estado para o formulário de entrega de veículos recebidos
  const [isDeliveryFormOpen, setIsDeliveryFormOpen] = useState(false);
  const [selectedDeliveryReception, setSelectedDeliveryReception] = useState<CarReception | null>(null);
  const [deliveryFormData, setDeliveryFormData] = useState({
    deliveryPersonName: "",
    deliveryPersonCpf: "",
    deliveryPersonPhone: ""
  });

  // Estado para modal de visualização detalhada
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [selectedReceptionDetails, setSelectedReceptionDetails] = useState<CarReception | null>(null);

  // Estado para o formulário de entrega de ordens de serviço
  const [isOrderDeliveryFormOpen, setIsOrderDeliveryFormOpen] = useState(false);
  const [selectedDeliveryOrder, setSelectedDeliveryOrder] = useState<ServiceOrder | null>(null);
  const [orderDeliveryFormData, setOrderDeliveryFormData] = useState({
    deliveryPersonName: "",
    deliveryPersonCpf: "",
    deliveryPersonPhone: ""
  });

  // Estado para controle de abas
  const [activeTab, setActiveTab] = useState("receptions");
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("oficina_token");
      if (!token) {
        setLocation("/maintenance/login-oficina");
        return;
      }

      // Carregar dados da oficina, ordens de serviço e recebimentos
      const [ordersResponse, oficinaResponse, receptionsResponse] = await Promise.all([
        fetch("/api/oficina/orders", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/api/oficina/profile", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/api/oficina/car-receptions", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!ordersResponse.ok || !oficinaResponse.ok || !receptionsResponse.ok) {
        throw new Error("Erro ao carregar dados");
      }

      const ordersData = await ordersResponse.json();
      const oficinaData = await oficinaResponse.json();
      const receptionsData = await receptionsResponse.json();

      setOrders(ordersData);
      setOficina(oficinaData);
      setCarReceptions(receptionsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem("oficina_token");
      const response = await fetch(`/api/oficina/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await loadData();
        toast({
          title: "Status atualizado",
          description: "Status da ordem de serviço atualizado com sucesso"
        });
      } else {
        throw new Error("Erro ao atualizar status");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive"
      });
    }
  };

  const updateReceptionStatus = async (receptionId: number, newStatus: string) => {
    // Se o status for "entregue", abrir o formulário de entrega primeiro
    if (newStatus === 'entregue') {
      const reception = carReceptions.find(r => r.id === receptionId);
      if (reception) {
        setSelectedDeliveryReception(reception);
        setDeliveryFormData({
          deliveryPersonName: "",
          deliveryPersonCpf: "",
          deliveryPersonPhone: ""
        });
        setIsDeliveryFormOpen(true);
        return;
      }
    }

    try {
      const token = localStorage.getItem("oficina_token");
      const response = await fetch(`/api/oficina/car-receptions/${receptionId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await loadData();
        toast({
          title: "Status atualizado",
          description: "Status do veículo atualizado com sucesso"
        });
      } else {
        throw new Error("Erro ao atualizar status");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do veículo",
        variant: "destructive"
      });
    }
  };

  // Função para processar a entrega com dados da pessoa que está retirando
  const processDelivery = async () => {
    if (!selectedDeliveryReception) return;

    // Validar campos obrigatórios
    if (!deliveryFormData.deliveryPersonName.trim() || 
        !deliveryFormData.deliveryPersonCpf.trim() || 
        !deliveryFormData.deliveryPersonPhone.trim()) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem("oficina_token");
      const response = await fetch(`/api/oficina/car-receptions/${selectedDeliveryReception.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: 'entregue',
          deliveryPersonName: deliveryFormData.deliveryPersonName,
          deliveryPersonCpf: deliveryFormData.deliveryPersonCpf,
          deliveryPersonPhone: deliveryFormData.deliveryPersonPhone
        })
      });

      if (response.ok) {
        setIsDeliveryFormOpen(false);
        setSelectedDeliveryReception(null);
        await loadData();
        toast({
          title: "Veículo entregue",
          description: "Veículo entregue com sucesso. Dados da pessoa que retirou foram registrados."
        });
      } else {
        throw new Error("Erro ao processar entrega");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível processar a entrega do veículo",
        variant: "destructive"
      });
    }
  };

  // Função para abrir modal de detalhes
  const openDetailView = (reception: CarReception) => {
    setSelectedReceptionDetails(reception);
    setIsDetailViewOpen(true);
  };

  // Função para gerar PDF dos detalhes do veículo
  const generatePDF = async (reception: CarReception) => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = margin;

      // Título do relatório
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("RELATÓRIO DE MANUTENÇÃO", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Informações da oficina
      if (oficina) {
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Oficina: ${oficina.razao_social}`, margin, yPosition);
        yPosition += 7;
        pdf.text(`CNPJ: ${oficina.cnpj}`, margin, yPosition);
        yPosition += 7;
        pdf.text(`Telefone: ${oficina.telefone}`, margin, yPosition);
        yPosition += 10;
      }

      // Linha separadora
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;

      // Dados do veículo
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("DADOS DO VEÍCULO", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Placa: ${reception.vehiclePlate}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Modelo: ${reception.vehicleModel}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Tipo: ${reception.vehicleType}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Quilometragem: ${reception.currentKm?.toLocaleString() || 'N/A'} km`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Projeto: ${reception.projectName || 'N/A'}`, margin, yPosition);
      yPosition += 10;

      // Dados do serviço
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("DADOS DO SERVIÇO", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Status: ${reception.status}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Prioridade: ${reception.priority}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Data de Recebimento: ${new Date(reception.receivedDate).toLocaleDateString('pt-BR')}`, margin, yPosition);
      yPosition += 7;
      
      if (reception.deliveryDeadline) {
        pdf.text(`Prazo de Entrega: ${new Date(reception.deliveryDeadline).toLocaleDateString('pt-BR')}`, margin, yPosition);
        yPosition += 7;
      }

      if (reception.deliveredDate) {
        pdf.text(`Data de Entrega: ${new Date(reception.deliveredDate).toLocaleDateString('pt-BR')}`, margin, yPosition);
        yPosition += 7;
      }

      yPosition += 5;

      // Descrição do serviço
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("DESCRIÇÃO DO SERVIÇO", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      const descriptionLines = pdf.splitTextToSize(reception.serviceDescription || 'N/A', pageWidth - 2 * margin);
      pdf.text(descriptionLines, margin, yPosition);
      yPosition += descriptionLines.length * 7 + 10;

      // Peças substituídas
      if (reception.replacedParts) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("PEÇAS SUBSTITUÍDAS", margin, yPosition);
        yPosition += 10;

        try {
          const parts = JSON.parse(reception.replacedParts);
          if (Array.isArray(parts) && parts.length > 0) {
            pdf.setFontSize(11);
            pdf.setFont("helvetica", "normal");
            parts.forEach((part: any, index: number) => {
              pdf.text(`${index + 1}. ${part.name || part.item} - R$ ${(part.price || part.valor || 0).toFixed(2)}`, margin, yPosition);
              yPosition += 7;
            });
          } else {
            pdf.text("Nenhuma peça substituída", margin, yPosition);
            yPosition += 7;
          }
        } catch (error) {
          pdf.text("Erro ao processar peças substituídas", margin, yPosition);
          yPosition += 7;
        }
        yPosition += 10;
      }

      // Custos
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("CUSTOS", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Custo de Peças: R$ ${Number(reception.partsCost || 0).toFixed(2)}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Custo de Mão de Obra: R$ ${Number(reception.laborCost || 0).toFixed(2)}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Total: R$ ${Number(reception.totalCost || 0).toFixed(2)}`, margin, yPosition);
      yPosition += 10;

      // Observações
      if (reception.notes) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("OBSERVAÇÕES", margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        const notesLines = pdf.splitTextToSize(reception.notes, pageWidth - 2 * margin);
        pdf.text(notesLines, margin, yPosition);
        yPosition += notesLines.length * 7 + 10;
      }

      // Dados da entrega (se disponível)
      if (reception.deliveryPersonName) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("DADOS DA ENTREGA", margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Recebido por: ${reception.deliveryPersonName}`, margin, yPosition);
        yPosition += 7;
        pdf.text(`CPF: ${reception.deliveryPersonCpf || 'N/A'}`, margin, yPosition);
        yPosition += 7;
        pdf.text(`Telefone: ${reception.deliveryPersonPhone || 'N/A'}`, margin, yPosition);
        yPosition += 7;
      }

      // Rodapé
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, pdf.internal.pageSize.getHeight() - 10);

      // Salvar o PDF
      pdf.save(`relatorio_manutencao_${reception.vehiclePlate}_${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: "PDF gerado",
        description: "Relatório gerado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório PDF",
        variant: "destructive"
      });
    }
  };

  const openUpdateModal = (reception: CarReception) => {
    // Salvar dados do recebimento no localStorage para edição
    localStorage.setItem('editingReception', JSON.stringify(reception));
    // Redirecionar para o formulário de recebimento em modo de edição
    setLocation('/maintenance/car-reception?edit=true&id=' + reception.id);
  };

  const updateReception = async () => {
    if (!selectedReception) return;

    try {
      const token = localStorage.getItem('oficina_token');
      if (!token) {
        toast({
          title: "Erro",
          description: "Token de autenticação não encontrado",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/oficina/car-receptions/${selectedReception.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(receptionUpdate)
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar recebimento");
      }

      toast({
        title: "Sucesso",
        description: "Status do veículo atualizado com sucesso!",
      });

      setIsUpdateModalOpen(false);
      loadData(); // Recarregar dados
    } catch (error) {
      console.error("Erro ao atualizar recebimento:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do veículo",
        variant: "destructive",
      });
    }
  };

  const openWorkModal = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setWorkDetails({
      orderId: order.id,
      workDescription: '',
      partsUsed: [],
      laborHours: 0,
      laborRate: 50,
      laborCost: 0,
      partsCost: 0,
      totalCost: 0,
      completedDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setIsWorkModalOpen(true);
  };

  const openOrderDetailsModal = (order: ServiceOrder) => {
    setSelectedOrderDetails(order);
    setIsOrderDetailsModalOpen(true);
  };

  const addPart = () => {
    const newPart: WorkPart = {
      id: Date.now().toString(),
      name: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    setWorkDetails(prev => ({
      ...prev,
      partsUsed: [...prev.partsUsed, newPart]
    }));
  };

  const updatePart = (partId: string, field: keyof WorkPart, value: string | number) => {
    setWorkDetails(prev => ({
      ...prev,
      partsUsed: prev.partsUsed.map(part => {
        if (part.id === partId) {
          const updatedPart = { ...part, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updatedPart.total = updatedPart.quantity * updatedPart.unitPrice;
          }
          return updatedPart;
        }
        return part;
      })
    }));
  };

  const removePart = (partId: string) => {
    setWorkDetails(prev => ({
      ...prev,
      partsUsed: prev.partsUsed.filter(part => part.id !== partId)
    }));
  };

  const calculateTotals = () => {
    const partsCost = workDetails.partsUsed.reduce((sum, part) => sum + part.total, 0);
    const laborCost = workDetails.laborHours * workDetails.laborRate;
    const totalCost = partsCost + laborCost;
    
    setWorkDetails(prev => ({
      ...prev,
      partsCost,
      laborCost,
      totalCost
    }));
  };

  // Recalcular totais quando partes ou trabalho mudarem
  useEffect(() => {
    calculateTotals();
  }, [workDetails.partsUsed, workDetails.laborHours, workDetails.laborRate]);

  const submitWorkDetails = async () => {
    try {
      const token = localStorage.getItem("oficina_token");
      const response = await fetch(`/api/oficina/orders/${workDetails.orderId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          workDescription: workDetails.workDescription,
          partsUsed: workDetails.partsUsed,
          laborHours: workDetails.laborHours,
          laborRate: workDetails.laborRate,
          totalCost: workDetails.totalCost,
          completedDate: workDetails.completedDate,
          notes: workDetails.notes,
          status: 'concluido'
        })
      });

      if (response.ok) {
        setIsWorkModalOpen(false);
        await loadData();
        toast({
          title: "Trabalho registrado",
          description: "Detalhes do trabalho salvos e ordem concluída com sucesso"
        });
      } else {
        throw new Error("Erro ao salvar detalhes do trabalho");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar os detalhes do trabalho",
        variant: "destructive"
      });
    }
  };

  // Função para abrir modal de entrega de ordem de serviço
  const openOrderDeliveryForm = (order: ServiceOrder) => {
    setSelectedDeliveryOrder(order);
    setOrderDeliveryFormData({
      deliveryPersonName: "",
      deliveryPersonCpf: "",
      deliveryPersonPhone: ""
    });
    setIsOrderDeliveryFormOpen(true);
  };

  // Função para processar entrega de ordem de serviço
  const submitOrderDelivery = async () => {
    if (!selectedDeliveryOrder) return;

    const { deliveryPersonName, deliveryPersonCpf, deliveryPersonPhone } = orderDeliveryFormData;

    if (!deliveryPersonName.trim() || !deliveryPersonCpf.trim() || !deliveryPersonPhone.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome completo, CPF e telefone da pessoa que está retirando o veículo",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem("oficina_token");
      const response = await fetch(`/api/oficina/orders/${selectedDeliveryOrder.id}/deliver`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          deliveryPersonName,
          deliveryPersonCpf,
          deliveryPersonPhone,
          status: 'entregue'
        })
      });

      if (response.ok) {
        setIsOrderDeliveryFormOpen(false);
        await loadData();
        toast({
          title: "Veículo entregue",
          description: "Dados da entrega registrados com sucesso"
        });
      } else {
        throw new Error("Erro ao registrar entrega");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível registrar a entrega",
        variant: "destructive"
      });
    }
  };

  const logout = () => {
    localStorage.removeItem("oficina_token");
    setLocation("/maintenance/login-oficina");
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { label: "Pendente", variant: "secondary" as const, icon: Clock },
      em_andamento: { label: "Em Andamento", variant: "default" as const, icon: Wrench },
      aguardando_pecas: { label: "Aguardando Peças", variant: "outline" as const, icon: AlertCircle },
      concluido: { label: "Concluído", variant: "success" as const, icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      baixa: "bg-green-100 text-green-800",
      media: "bg-yellow-100 text-yellow-800", 
      alta: "bg-orange-100 text-orange-800",
      urgente: "bg-red-100 text-red-800"
    };

    const safePriority = priority || 'media';
    const className = priorityConfig[safePriority as keyof typeof priorityConfig] || priorityConfig.media;

    return (
      <Badge className={className}>
        {safePriority.charAt(0).toUpperCase() + safePriority.slice(1)}
      </Badge>
    );
  };

  const getReceptionStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      recebido: { label: "Recebido", className: "bg-blue-100 text-blue-800" },
      em_analise: { label: "Em Análise", className: "bg-yellow-100 text-yellow-800" },
      aguardando_pecas: { label: "Aguardando Peças", className: "bg-orange-100 text-orange-800" },
      em_reparo: { label: "Em Reparo", className: "bg-purple-100 text-purple-800" },
      pronto: { label: "Pronto", className: "bg-green-100 text-green-800" },
      entregue: { label: "Entregue", className: "bg-gray-100 text-gray-800" }
    };

    const config = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Wrench className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: "Total de Ordens",
      value: orders.length,
      icon: FileText,
      description: "Ordens de serviço ativas"
    },
    {
      title: "Em Andamento",
      value: orders.filter(o => o.status === "em_andamento").length,
      icon: Wrench,
      description: "Sendo executadas"
    },
    {
      title: "Veículos Recebidos",
      value: carReceptions.length,
      icon: Car,
      description: "Total recebidos"
    },
    {
      title: "Pendentes",
      value: orders.filter(o => o.status === "pendente").length,
      icon: Clock,
      description: "Aguardando início"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wrench className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {oficina?.razao_social}
                </h1>
                <p className="text-sm text-gray-500">
                  CNPJ: {oficina?.cnpj}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Botão de Estoque para Oficina Alair */}
              <Button 
                onClick={() => setLocation('/oficina/alair/estoque')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Package className="h-4 w-4 mr-2" />
                Gerenciar Estoque
              </Button>
              <Button variant="outline" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button 
            onClick={() => setLocation('/maintenance/car-reception')}
            className="bg-green-600 hover:bg-green-700"
          >
            <Car className="h-4 w-4 mr-2" />
            Receber Veículo
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.description}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-full">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Navegação por Abas */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="border-b">
              <div className="flex space-x-8 px-4">
                <Button
                  variant="ghost"
                  onClick={() => setActiveTab("orders")}
                  className={`flex items-center gap-2 border-b-2 rounded-none px-0 py-3 ${
                    activeTab === "orders" 
                      ? "border-blue-500 text-blue-600" 
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Wrench className="h-4 w-4" />
                  Ordens de Serviço
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setActiveTab("receptions")}
                  className={`flex items-center gap-2 border-b-2 rounded-none px-0 py-3 ${
                    activeTab === "receptions" 
                      ? "border-blue-500 text-blue-600" 
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Car className="h-4 w-4" />
                  Recebimento de Veículos
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setActiveTab("budgets")}
                  className={`flex items-center gap-2 border-b-2 rounded-none px-0 py-3 ${
                    activeTab === "budgets" 
                      ? "border-blue-500 text-blue-600" 
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Calculator className="h-4 w-4" />
                  Orçamentos
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {activeTab === "orders" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Ordens de Serviço
            </CardTitle>
            <CardDescription>
              Gerencie as ordens de serviço da sua oficina
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma ordem de serviço encontrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">Placa: {order.vehiclePlate}</h3>
                          {getStatusBadge(order.status)}
                          {getPriorityBadge(order.priority)}
                        </div>
                        <p className="text-sm text-gray-600">{order.description}</p>
                        <p className="text-xs text-gray-500">
                          Tipo: {order.maintenanceType} | Entrada: {new Date(order.entryDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {/* Botões de Ação Padrão */}
                        <div className="flex gap-2 flex-wrap">
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => openOrderDetailsModal(order)}
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Detalhes
                          </Button>
                        </div>
                        {/* Botões de Status - Pendente */}
                        {order.status === "pendente" && (
                          <div className="flex gap-2 flex-wrap">
                            <Button 
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, "em_andamento")}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Wrench className="h-4 w-4 mr-1" />
                              Iniciar Trabalho
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => updateOrderStatus(order.id, "aguardando_pecas")}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Aguardar Peças
                            </Button>
                          </div>
                        )}
                        
                        {/* Botões de Status - Em Andamento */}
                        {order.status === "em_andamento" && (
                          <div className="flex gap-2 flex-wrap">
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => updateOrderStatus(order.id, "aguardando_pecas")}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Aguardar Peças
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, "concluido")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Finalizar Serviço
                            </Button>
                            <Button 
                              size="sm"
                              variant="secondary"
                              onClick={() => openWorkModal(order)}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Registrar Trabalho
                            </Button>
                          </div>
                        )}
                        
                        {/* Botões de Status - Aguardando Peças */}
                        {order.status === "aguardando_pecas" && (
                          <div className="flex gap-2 flex-wrap">
                            <Button 
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, "em_andamento")}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Wrench className="h-4 w-4 mr-1" />
                              Retomar Trabalho
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, "concluido")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Finalizar Serviço
                            </Button>
                          </div>
                        )}
                        
                        {/* Status de Conclusão */}
                        {order.status === "concluido" && (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Serviço Concluído
                            </Badge>
                            <Button 
                              size="sm"
                              onClick={() => openOrderDeliveryForm(order)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Car className="h-4 w-4 mr-1" />
                              Entregar Veículo
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => updateOrderStatus(order.id, "em_andamento")}
                            >
                              Reabrir
                            </Button>
                          </div>
                        )}

                        {/* Status Entregue */}
                        {order.status === "entregue" && (
                          <div className="flex flex-col gap-2">
                            <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Veículo Entregue
                            </Badge>
                            {order.deliveryPersonName && (
                              <div className="text-xs text-gray-600">
                                <p><strong>Entregue para:</strong> {order.deliveryPersonName}</p>
                                <p><strong>CPF:</strong> {order.deliveryPersonCpf}</p>
                                <p><strong>Telefone:</strong> {order.deliveryPersonPhone}</p>
                                {order.deliveredDate && (
                                  <p><strong>Data:</strong> {new Date(order.deliveredDate).toLocaleDateString('pt-BR')}</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Botão de Pausa para todos os status ativos */}
                        {!["concluido", "finalizado", "pausado"].includes(order.status) && (
                          <Button 
                            size="sm"
                            variant="ghost"
                            onClick={() => updateOrderStatus(order.id, "pausado")}
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Pausar Serviço
                          </Button>
                        )}
                        
                        {/* Status Pausado */}
                        {order.status === "pausado" && (
                          <div className="flex gap-2 flex-wrap">
                            <Button 
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, "em_andamento")}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Wrench className="h-4 w-4 mr-1" />
                              Retomar
                            </Button>
                            <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Pausado
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {(order.initialBudget || order.finalCost) && (
                      <div className="flex gap-4 text-sm">
                        {order.initialBudget && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Orçamento: R$ {order.initialBudget}</span>
                          </div>
                        )}
                        {order.finalCost && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-gray-600">Custo Final: R$ {order.finalCost}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Recebimentos de Veículos */}
        {activeTab === "receptions" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Veículos Recebidos
            </CardTitle>
            <CardDescription>
              Acompanhe o status dos veículos recebidos para manutenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            {carReceptions.length === 0 ? (
              <div className="text-center py-8">
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum veículo recebido</p>
              </div>
            ) : (
              <div className="space-y-4">
                {carReceptions.map((reception) => (
                  <div key={reception.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">Placa: {reception.vehiclePlate}</h3>
                          {getReceptionStatusBadge(reception.status)}
                          {getPriorityBadge(reception.priority)}
                        </div>
                        <p className="text-sm text-gray-600">{reception.serviceDescription}</p>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>Modelo: {reception.vehicleModel}</span>
                          <span>KM: {reception.currentKm?.toLocaleString()}</span>
                          <span>Projeto: {reception.projectName}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Recebido: {new Date(reception.receivedDate).toLocaleDateString('pt-BR')}
                          {reception.deliveryDeadline && (
                            <span> | Prazo: {new Date(reception.deliveryDeadline).toLocaleDateString('pt-BR')}</span>
                          )}
                        </p>
                      </div>
                      <div className="space-y-3">
                        <div className="text-right">
                          <div className="text-sm font-semibold text-green-600">
                            Total: R$ {Number(reception.totalCost || 0).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Peças: R$ {Number(reception.partsCost || 0).toFixed(2)} | 
                            Mão de obra: R$ {Number(reception.laborCost || 0).toFixed(2)}
                          </div>
                        </div>
                        
                        {/* Botões de Status para Veículos Recebidos */}
                        <div className="flex gap-2 flex-wrap justify-end">
                          {reception.status === "recebido" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateReceptionStatus(reception.id, "em_analise")}
                                className="bg-yellow-600 hover:bg-yellow-700 text-xs"
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                Iniciar Análise
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => updateReceptionStatus(reception.id, "aguardando_pecas")}
                                variant="outline"
                                className="text-xs"
                              >
                                Aguardar Peças
                              </Button>
                            </>
                          )}
                          
                          {reception.status === "em_analise" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateReceptionStatus(reception.id, "em_reparo")}
                                className="bg-purple-600 hover:bg-purple-700 text-xs"
                              >
                                <Wrench className="h-3 w-3 mr-1" />
                                Iniciar Reparo
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => updateReceptionStatus(reception.id, "aguardando_pecas")}
                                variant="outline"
                                className="text-xs"
                              >
                                Aguardar Peças
                              </Button>
                            </>
                          )}
                          
                          {reception.status === "em_reparo" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateReceptionStatus(reception.id, "pronto")}
                                className="bg-green-600 hover:bg-green-700 text-xs"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Concluir Reparo
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => updateReceptionStatus(reception.id, "aguardando_pecas")}
                                variant="outline"
                                className="text-xs"
                              >
                                Aguardar Peças
                              </Button>
                            </>
                          )}
                          
                          {reception.status === "aguardando_pecas" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateReceptionStatus(reception.id, "em_reparo")}
                                className="bg-purple-600 hover:bg-purple-700 text-xs"
                              >
                                <Wrench className="h-3 w-3 mr-1" />
                                Retomar Reparo
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => updateReceptionStatus(reception.id, "pronto")}
                                className="bg-green-600 hover:bg-green-700 text-xs"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Finalizar
                              </Button>
                            </>
                          )}
                          
                          {reception.status === "pronto" && (
                            <Button
                              size="sm"
                              onClick={() => updateReceptionStatus(reception.id, "entregue")}
                              className="bg-blue-600 hover:bg-blue-700 text-xs"
                            >
                              <Car className="h-3 w-3 mr-1" />
                              Marcar como Entregue
                            </Button>
                          )}
                          
                          {reception.status === "entregue" && (
                            <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1 text-xs">
                              <CheckCircle className="h-3 w-3" />
                              Entregue
                            </Badge>
                          )}
                          
                          {/* Botão de Edição disponível apenas quando não está entregue */}
                          {reception.status !== "entregue" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openUpdateModal(reception)}
                              className="text-xs"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                          )}
                          
                          {/* Botão Ver Detalhes sempre disponível */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDetailView(reception)}
                            className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver Detalhes
                          </Button>
                          
                          {/* Botão Imprimir PDF sempre disponível */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => generatePDF(reception)}
                            className="text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Imprimir PDF
                          </Button>
                          
                          {/* Indicador de apenas visualização quando entregue */}
                          {reception.status === "entregue" && (
                            <span className="text-xs text-gray-500 italic">
                              Apenas visualização
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {reception.notes && (
                      <div className="bg-gray-50 p-2 rounded text-sm">
                        <strong>Observações:</strong> {reception.notes}
                      </div>
                    )}
                    
                    {reception.replacedParts && (
                      <div className="bg-blue-50 p-2 rounded text-sm">
                        <strong>Peças substituídas:</strong>
                        <div className="mt-1 space-y-1">
                          {(() => {
                            try {
                              const parts = JSON.parse(reception.replacedParts);
                              if (Array.isArray(parts) && parts.length > 0) {
                                const totalValue = parts.reduce((sum, part) => sum + parseFloat(part.price || 0), 0);
                                return (
                                  <>
                                    {parts.map((part: any, index: number) => (
                                      <div key={index} className="flex justify-between items-center p-1 bg-white rounded text-xs">
                                        <span className="font-medium">{part.name || 'Peça não especificada'}</span>
                                        <span className="text-blue-600 font-semibold">
                                          R$ {parseFloat(part.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                    ))}
                                    <div className="flex justify-between items-center p-1 bg-green-100 rounded border border-green-300 mt-1">
                                      <span className="font-bold text-green-800 text-xs">TOTAL</span>
                                      <span className="text-xs font-bold text-green-800">
                                        R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  </>
                                );
                              } else {
                                return <span className="text-gray-600 text-xs">Nenhuma peça substituída</span>;
                              }
                            } catch (e) {
                              return <span className="text-gray-500 text-xs">{reception.replacedParts}</span>;
                            }
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Sistema de Orçamentos */}
        {activeTab === "budgets" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Sistema de Orçamentos
              </CardTitle>
              <CardDescription>
                Crie e gerencie orçamentos das ordens de serviço
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BudgetManager token={localStorage.getItem("oficina_token") || ""} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Work Details Modal */}
      <Dialog open={isWorkModalOpen} onOpenChange={setIsWorkModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Registrar Trabalho Realizado
            </DialogTitle>
            <DialogDescription>
              Registre os detalhes do trabalho realizado no veículo {selectedOrder?.vehiclePlate}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Descrição do Trabalho */}
            <div>
              <Label htmlFor="workDescription">Descrição do Trabalho Realizado *</Label>
              <Textarea
                id="workDescription"
                placeholder="Descreva detalhadamente o trabalho realizado..."
                value={workDetails.workDescription}
                onChange={(e) => setWorkDetails(prev => ({ ...prev, workDescription: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Peças Utilizadas */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <Label>Peças Utilizadas</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPart}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Peça
                </Button>
              </div>
              
              {workDetails.partsUsed.length === 0 ? (
                <div className="text-center py-4 text-gray-500 border-2 border-dashed rounded-lg">
                  Nenhuma peça adicionada. Clique em "Adicionar Peça" para registrar peças utilizadas.
                </div>
              ) : (
                <div className="space-y-3">
                  {workDetails.partsUsed.map((part) => (
                    <div key={part.id} className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg">
                      <div className="col-span-5">
                        <Input
                          placeholder="Nome da peça"
                          value={part.name}
                          onChange={(e) => updatePart(part.id, 'name', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Qtd"
                          value={part.quantity}
                          onChange={(e) => updatePart(part.id, 'quantity', Number(e.target.value))}
                          min="1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Valor unit."
                          value={part.unitPrice}
                          onChange={(e) => updatePart(part.id, 'unitPrice', Number(e.target.value))}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          value={`R$ ${part.total.toFixed(2)}`}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removePart(part.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mão de Obra */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="laborHours">Horas Trabalhadas</Label>
                <Input
                  id="laborHours"
                  type="number"
                  placeholder="8.5"
                  value={workDetails.laborHours}
                  onChange={(e) => setWorkDetails(prev => ({ ...prev, laborHours: Number(e.target.value) }))}
                  min="0"
                  step="0.5"
                />
              </div>
              <div>
                <Label htmlFor="laborRate">Valor por Hora (R$)</Label>
                <Input
                  id="laborRate"
                  type="number"
                  placeholder="50.00"
                  value={workDetails.laborRate}
                  onChange={(e) => setWorkDetails(prev => ({ ...prev, laborRate: Number(e.target.value) }))}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label>Total Mão de Obra</Label>
                <Input
                  value={`R$ ${workDetails.laborCost.toFixed(2)}`}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>

            {/* Data de Conclusão */}
            <div>
              <Label htmlFor="completedDate">Data de Conclusão</Label>
              <Input
                id="completedDate"
                type="date"
                value={workDetails.completedDate}
                onChange={(e) => setWorkDetails(prev => ({ ...prev, completedDate: e.target.value }))}
              />
            </div>

            {/* Observações */}
            <div>
              <Label htmlFor="notes">Observações Adicionais</Label>
              <Textarea
                id="notes"
                placeholder="Observações, recomendações para próximas manutenções..."
                value={workDetails.notes}
                onChange={(e) => setWorkDetails(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Resumo dos Custos */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Resumo dos Custos</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Peças:</span>
                  <span>R$ {workDetails.partsCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Mão de Obra:</span>
                  <span>R$ {workDetails.laborCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total Geral:</span>
                  <span>R$ {workDetails.totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWorkModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={submitWorkDetails}
              disabled={!workDetails.workDescription.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              Finalizar e Concluir Ordem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Reception Modal */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Atualizar Status do Veículo
            </DialogTitle>
            <DialogDescription>
              Atualize o status e observações do veículo {selectedReception?.vehiclePlate}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status */}
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select value={receptionUpdate.status} onValueChange={(value) => 
                setReceptionUpdate(prev => ({ ...prev, status: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recebido">Recebido</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="aguardando_pecas">Aguardando Peças</SelectItem>
                  <SelectItem value="em_reparo">Em Reparo</SelectItem>
                  <SelectItem value="pronto">Pronto</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Observações */}
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Digite observações sobre o andamento do serviço..."
                value={receptionUpdate.notes}
                onChange={(e) => setReceptionUpdate(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Previsão de Entrega */}
            <div>
              <Label htmlFor="estimatedCompletion">Previsão de Entrega</Label>
              <Input
                id="estimatedCompletion"
                type="date"
                value={receptionUpdate.estimatedCompletion}
                onChange={(e) => setReceptionUpdate(prev => ({ ...prev, estimatedCompletion: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={updateReception} disabled={!receptionUpdate.status}>
              Atualizar Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Form Modal */}
      <Dialog open={isDeliveryFormOpen} onOpenChange={setIsDeliveryFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados para Entrega do Veículo
            </DialogTitle>
            <DialogDescription>
              Registre os dados da pessoa que está retirando o veículo {selectedDeliveryReception?.vehiclePlate}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Nome Completo */}
            <div>
              <Label htmlFor="deliveryPersonName">Nome Completo *</Label>
              <Input
                id="deliveryPersonName"
                type="text"
                placeholder="Digite o nome completo"
                value={deliveryFormData.deliveryPersonName}
                onChange={(e) => setDeliveryFormData(prev => ({ 
                  ...prev, 
                  deliveryPersonName: e.target.value 
                }))}
              />
            </div>

            {/* CPF */}
            <div>
              <Label htmlFor="deliveryPersonCpf">CPF *</Label>
              <Input
                id="deliveryPersonCpf"
                type="text"
                placeholder="000.000.000-00"
                value={deliveryFormData.deliveryPersonCpf}
                onChange={(e) => setDeliveryFormData(prev => ({ 
                  ...prev, 
                  deliveryPersonCpf: e.target.value 
                }))}
              />
            </div>

            {/* Telefone */}
            <div>
              <Label htmlFor="deliveryPersonPhone">Telefone *</Label>
              <Input
                id="deliveryPersonPhone"
                type="text"
                placeholder="(11) 99999-9999"
                value={deliveryFormData.deliveryPersonPhone}
                onChange={(e) => setDeliveryFormData(prev => ({ 
                  ...prev, 
                  deliveryPersonPhone: e.target.value 
                }))}
              />
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Atenção</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Todos os campos são obrigatórios. Certifique-se de que os dados estão corretos antes de confirmar a entrega.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeliveryFormOpen(false);
                setSelectedDeliveryReception(null);
                setDeliveryFormData({
                  deliveryPersonName: "",
                  deliveryPersonCpf: "",
                  deliveryPersonPhone: ""
                });
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={processDelivery}
              disabled={!deliveryFormData.deliveryPersonName.trim() || 
                       !deliveryFormData.deliveryPersonCpf.trim() || 
                       !deliveryFormData.deliveryPersonPhone.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar Entrega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Entrega de Ordem de Serviço */}
      <Dialog open={isOrderDeliveryFormOpen} onOpenChange={setIsOrderDeliveryFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Entrega de Veículo - Ordem de Serviço
            </DialogTitle>
            <DialogDescription>
              {selectedDeliveryOrder && (
                <>Registre os dados da pessoa que está retirando o veículo <strong>{selectedDeliveryOrder.vehiclePlate}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Nome Completo */}
            <div>
              <Label htmlFor="orderDeliveryPersonName">Nome Completo *</Label>
              <Input
                id="orderDeliveryPersonName"
                type="text"
                placeholder="Nome completo da pessoa que está retirando o veículo"
                value={orderDeliveryFormData.deliveryPersonName}
                onChange={(e) => setOrderDeliveryFormData(prev => ({ 
                  ...prev, 
                  deliveryPersonName: e.target.value 
                }))}
              />
            </div>

            {/* CPF */}
            <div>
              <Label htmlFor="orderDeliveryPersonCpf">CPF *</Label>
              <Input
                id="orderDeliveryPersonCpf"
                type="text"
                placeholder="000.000.000-00"
                value={orderDeliveryFormData.deliveryPersonCpf}
                onChange={(e) => setOrderDeliveryFormData(prev => ({ 
                  ...prev, 
                  deliveryPersonCpf: e.target.value 
                }))}
              />
            </div>

            {/* Telefone */}
            <div>
              <Label htmlFor="orderDeliveryPersonPhone">Telefone *</Label>
              <Input
                id="orderDeliveryPersonPhone"
                type="text"
                placeholder="(11) 99999-9999"
                value={orderDeliveryFormData.deliveryPersonPhone}
                onChange={(e) => setOrderDeliveryFormData(prev => ({ 
                  ...prev, 
                  deliveryPersonPhone: e.target.value 
                }))}
              />
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Atenção</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Todos os campos são obrigatórios. Certifique-se de que os dados estão corretos antes de confirmar a entrega.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsOrderDeliveryFormOpen(false);
                setSelectedDeliveryOrder(null);
                setOrderDeliveryFormData({
                  deliveryPersonName: "",
                  deliveryPersonCpf: "",
                  deliveryPersonPhone: ""
                });
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={submitOrderDelivery}
              disabled={!orderDeliveryFormData.deliveryPersonName.trim() || 
                       !orderDeliveryFormData.deliveryPersonCpf.trim() || 
                       !orderDeliveryFormData.deliveryPersonPhone.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar Entrega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes da Ordem de Serviço */}
      <Dialog open={isOrderDetailsModalOpen} onOpenChange={setIsOrderDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalhes da Ordem de Serviço #{selectedOrderDetails?.id}
            </DialogTitle>
            <DialogDescription>
              Informações completas da ordem de serviço
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrderDetails && (
            <div className="space-y-6">
              {/* Informações do Veículo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Placa do Veículo</Label>
                  <p className="text-lg font-semibold">{selectedOrderDetails.vehiclePlate}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Tipo de Manutenção</Label>
                  <p className="text-sm">{selectedOrderDetails.maintenanceType}</p>
                </div>
              </div>

              {/* Status e Prioridade */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedOrderDetails.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Prioridade</Label>
                  <div className="mt-1">
                    {getPriorityBadge(selectedOrderDetails.priority)}
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <Label className="text-sm font-medium text-gray-600">Descrição do Serviço</Label>
                <p className="text-sm bg-gray-50 p-3 rounded-md mt-1">{selectedOrderDetails.description}</p>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Data de Entrada</Label>
                  <p className="text-sm">{new Date(selectedOrderDetails.entryDate).toLocaleDateString('pt-BR')}</p>
                </div>
                {selectedOrderDetails.estimatedCompletion && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Previsão de Conclusão</Label>
                    <p className="text-sm">{new Date(selectedOrderDetails.estimatedCompletion).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
              </div>

              {/* Valores */}
              <div className="grid grid-cols-2 gap-4">
                {selectedOrderDetails.initialBudget && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Orçamento Inicial</Label>
                    <p className="text-lg font-semibold text-blue-600">R$ {selectedOrderDetails.initialBudget}</p>
                  </div>
                )}
                {selectedOrderDetails.finalCost && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Custo Final</Label>
                    <p className="text-lg font-semibold text-green-600">R$ {selectedOrderDetails.finalCost}</p>
                  </div>
                )}
              </div>

              {/* Informações de Entrega */}
              {selectedOrderDetails.status === "entregue" && selectedOrderDetails.deliveryPersonName && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <Label className="text-sm font-medium text-green-800">Informações de Entrega</Label>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><strong>Entregue para:</strong> {selectedOrderDetails.deliveryPersonName}</p>
                    <p><strong>CPF:</strong> {selectedOrderDetails.deliveryPersonCpf}</p>
                    <p><strong>Telefone:</strong> {selectedOrderDetails.deliveryPersonPhone}</p>
                    {selectedOrderDetails.deliveredDate && (
                      <p><strong>Data de Entrega:</strong> {new Date(selectedOrderDetails.deliveredDate).toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsOrderDetailsModalOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização Detalhada */}
      <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Detalhes da Manutenção
            </DialogTitle>
            <DialogDescription>
              Visualização completa dos detalhes da manutenção do veículo
            </DialogDescription>
          </DialogHeader>
          
          {selectedReceptionDetails && (
            <div className="space-y-6">
              {/* Informações do Veículo */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-3">Dados do Veículo</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Placa</Label>
                    <p className="text-lg font-semibold">{selectedReceptionDetails.vehiclePlate}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Modelo</Label>
                    <p className="text-sm">{selectedReceptionDetails.vehicleModel}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Tipo</Label>
                    <p className="text-sm">{selectedReceptionDetails.vehicleType}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Quilometragem</Label>
                    <p className="text-sm">{selectedReceptionDetails.currentKm?.toLocaleString() || 'N/A'} km</p>
                  </div>
                </div>
              </div>

              {/* Status e Prioridade */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="mt-1">
                    {getReceptionStatusBadge(selectedReceptionDetails.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Prioridade</Label>
                  <div className="mt-1">
                    {getPriorityBadge(selectedReceptionDetails.priority)}
                  </div>
                </div>
              </div>

              {/* Projeto */}
              <div>
                <Label className="text-sm font-medium text-gray-600">Projeto</Label>
                <p className="text-sm">{selectedReceptionDetails.projectName || 'N/A'}</p>
              </div>

              {/* Descrição do Serviço */}
              <div>
                <Label className="text-sm font-medium text-gray-600">Descrição do Serviço</Label>
                <p className="text-sm bg-gray-50 p-3 rounded-md mt-1">{selectedReceptionDetails.serviceDescription}</p>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Data de Recebimento</Label>
                  <p className="text-sm">{new Date(selectedReceptionDetails.receivedDate).toLocaleDateString('pt-BR')}</p>
                </div>
                {selectedReceptionDetails.deliveryDeadline && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Prazo de Entrega</Label>
                    <p className="text-sm">{new Date(selectedReceptionDetails.deliveryDeadline).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
              </div>

              {/* Peças Substituídas */}
              {selectedReceptionDetails.replacedParts && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-3">Peças Substituídas</h3>
                  <div className="space-y-2">
                    {(() => {
                      try {
                        const parts = JSON.parse(selectedReceptionDetails.replacedParts);
                        if (Array.isArray(parts) && parts.length > 0) {
                          return parts.map((part: any, index: number) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                              <span className="font-medium">{part.name || 'Peça não especificada'}</span>
                              <span className="text-blue-600 font-semibold">
                                R$ {parseFloat(part.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          ));
                        } else {
                          return <p className="text-gray-600">Nenhuma peça substituída</p>;
                        }
                      } catch (e) {
                        return <p className="text-gray-500">{selectedReceptionDetails.replacedParts}</p>;
                      }
                    })()}
                  </div>
                </div>
              )}

              {/* Custos */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-3">Detalhamento de Custos</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Custo de Peças:</span>
                    <span className="font-semibold">R$ {Number(selectedReceptionDetails.partsCost || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Custo de Mão de Obra:</span>
                    <span className="font-semibold">R$ {Number(selectedReceptionDetails.laborCost || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-green-600">R$ {Number(selectedReceptionDetails.totalCost || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {selectedReceptionDetails.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Observações</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded-md mt-1">{selectedReceptionDetails.notes}</p>
                </div>
              )}

              {/* Informações de Entrega */}
              {selectedReceptionDetails.deliveryPersonName && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Informações de Entrega</h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Entregue para:</Label>
                      <p className="text-sm">{selectedReceptionDetails.deliveryPersonName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">CPF:</Label>
                      <p className="text-sm">{selectedReceptionDetails.deliveryPersonCpf || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Telefone:</Label>
                      <p className="text-sm">{selectedReceptionDetails.deliveryPersonPhone || 'N/A'}</p>
                    </div>
                    {selectedReceptionDetails.deliveredDate && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Data de Entrega:</Label>
                        <p className="text-sm">{new Date(selectedReceptionDetails.deliveredDate).toLocaleDateString('pt-BR')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDetailViewOpen(false)}
            >
              Fechar
            </Button>
            <Button 
              onClick={() => selectedReceptionDetails && generatePDF(selectedReceptionDetails)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Gerar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Rodapé discreto */}
      <div className="mt-16 pb-8 text-center text-gray-400 text-sm">
        Desenvolvido por Carpe Diem 4004 | suporte 11 970558053
      </div>
    </div>
  );
}