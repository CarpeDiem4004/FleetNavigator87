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
  CheckCircle, 
  AlertCircle, 
  Car,
  LogOut,
  FileText,
  DollarSign,
  Plus,
  Trash2,
  Settings,
  Edit
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
  
  const [selectedReception, setSelectedReception] = useState<CarReception | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [receptionUpdate, setReceptionUpdate] = useState({
    status: "",
    notes: "",
    estimatedCompletion: ""
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

  const openUpdateModal = (reception: CarReception) => {
    setSelectedReception(reception);
    setReceptionUpdate({
      status: reception.status,
      notes: reception.notes || "",
      estimatedCompletion: reception.deliveryDeadline ? 
        new Date(reception.deliveryDeadline).toISOString().split('T')[0] : ""
    });
    setIsUpdateModalOpen(true);
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
                          <>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => updateOrderStatus(order.id, "aguardando_pecas")}
                            >
                              Aguardar Peças
                            </Button>
                            <Button 
                              size="sm"
                              variant="default"
                              onClick={() => openWorkModal(order)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Registrar Trabalho
                            </Button>
                          </>
                        )}
                        {order.status === "aguardando_pecas" && (
                          <>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => updateOrderStatus(order.id, "em_andamento")}
                            >
                              Retomar
                            </Button>
                            <Button 
                              size="sm"
                              variant="default"
                              onClick={() => openWorkModal(order)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Registrar Trabalho
                            </Button>
                          </>
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

        {/* Veículos Recebidos */}
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
                      <div className="text-right space-y-2">
                        <div className="text-sm font-semibold text-green-600">
                          Total: R$ {reception.totalCost.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Peças: R$ {reception.partsCost.toFixed(2)} | 
                          Mão de obra: R$ {reception.laborCost.toFixed(2)}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => openUpdateModal(reception)}
                          className="text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Atualizar
                        </Button>
                      </div>
                    </div>
                    
                    {reception.notes && (
                      <div className="bg-gray-50 p-2 rounded text-sm">
                        <strong>Observações:</strong> {reception.notes}
                      </div>
                    )}
                    
                    {reception.replacedParts && (
                      <div className="bg-blue-50 p-2 rounded text-sm">
                        <strong>Peças substituídas:</strong> {reception.replacedParts}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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
    </div>
  );
}