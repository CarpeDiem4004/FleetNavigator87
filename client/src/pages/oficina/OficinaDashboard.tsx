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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Wrench, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Car,
  LogOut,
  FileText,
  DollarSign,
  Plus,
  Trash2,
  Settings
} from "lucide-react";
import { useLocation } from "wouter";

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

      // Carregar dados da oficina e ordens de serviço
      const [ordersResponse, oficinaResponse] = await Promise.all([
        fetch("/api/oficina/orders", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/api/oficina/profile", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!ordersResponse.ok || !oficinaResponse.ok) {
        throw new Error("Erro ao carregar dados");
      }

      const ordersData = await ordersResponse.json();
      const oficinaData = await oficinaResponse.json();

      setOrders(ordersData);
      setOficina(oficinaData);
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
        method: "PUT",
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

    const className = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.media;

    return (
      <Badge className={className}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
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
      title: "Concluídas",
      value: orders.filter(o => o.status === "concluido").length,
      icon: CheckCircle,
      description: "Finalizadas"
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
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
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

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
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
                        {order.status === "pendente" && (
                          <Button 
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, "em_andamento")}
                          >
                            Iniciar
                          </Button>
                        )}
                        {order.status === "em_andamento" && (
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => updateOrderStatus(order.id, "aguardando_pecas")}
                          >
                            Aguardar Peças
                          </Button>
                        )}
                        {(order.status === "em_andamento" || order.status === "aguardando_pecas") && (
                          <Button 
                            size="sm"
                            variant="default"
                            onClick={() => updateOrderStatus(order.id, "concluido")}
                          >
                            Concluir
                          </Button>
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
      </div>
    </div>
  );
}