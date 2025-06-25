import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Car, 
  Plus, 
  FileText, 
  CheckCircle, 
  Clock, 
  Wrench, 
  AlertTriangle,
  User,
  Calendar,
  Settings,
  Edit,
  X
} from 'lucide-react';

interface WorkshopData {
  id: number;
  name: string;
  cnpj: string;
  email: string;
  telefone: string;
}



interface MaintenanceRequest {
  id: number;
  vehiclePlate: string;
  description: string;
  status: string;
  priority: string;
  entryDate: string;
  customerName?: string;
}

interface CarReception {
  id: number;
  vehiclePlate: string;
  vehicleModel: string;
  serviceDescription: string;
  status: string;
  created_at: string;
  workshopId: number;
}

export default function OficinaExternalDashboard() {
  const [workshopData, setWorkshopData] = useState<WorkshopData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [carReceptions, setCarReceptions] = useState<CarReception[]>([]);
  const [isNewOSOpen, setIsNewOSOpen] = useState(false);

  const [osFormData, setOSFormData] = useState({
    vehiclePlate: '',
    description: '',
    priority: 'media',
    estimatedCost: ''
  });
  const [editingOrder, setEditingOrder] = useState<MaintenanceRequest | null>(null);
  const [editForm, setEditForm] = useState({
    status: '',
    data_previsao_entrega: '',
    valor_mao_obra: '',
    valor_total_pecas: '',
    observacoes_oficina: '',
    km_veiculo: ''
  });
  const [editingReception, setEditingReception] = useState<CarReception | null>(null);
  const [receptionEditForm, setReceptionEditForm] = useState({
    status: '',
    deliveryDeadline: '',
    laborCost: '',
    partsCost: '',
    notes: '',
    currentKm: '',
    replacedParts: ''
  });
  const [isCarFormOpen, setIsCarFormOpen] = useState(false);
  const [carFormData, setCarFormData] = useState({
    vehiclePlate: '',
    vehicleModel: '',
    vehicleType: 'carro',
    currentKm: '',
    baseId: '',
    projectId: '',
    serviceDescription: '',
    replacedParts: '',
    laborCost: '',
    partsCost: '',
    deliveryDeadline: '',
    status: 'recebido',
    notes: '',
    deliveryPersonName: '',
    deliveryPersonCpf: '',
    deliveryPersonPhone: ''
  });
  const [parts, setParts] = useState<{ name: string; price: string }[]>([]);
  const [newPartName, setNewPartName] = useState('');
  const [newPartPrice, setNewPartPrice] = useState('');

  // Função para formatar valores em moeda brasileira
  const formatCurrency = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');
    
    // Se vazio, retorna vazio
    if (!numbers) return '';
    
    // Converte para número e divide por 100 para ter centavos
    const amount = parseInt(numbers) / 100;
    
    // Formata como moeda brasileira
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Função para converter valor formatado de volta para número
  const parseCurrency = (value: string) => {
    if (!value) return 0;
    // Remove R$, espaços e pontos, substitui vírgula por ponto
    const cleanValue = value.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  };
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectBases, setSelectedProjectBases] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
      setError('Token de acesso obrigatório. Use o link fornecido pela oficina.');
      setIsLoading(false);
      return;
    }

    validateTokenAndLoadData(token);
    loadProjects();
  }, []);

  const validateTokenAndLoadData = async (token: string) => {
    try {
      // Validar token e obter dados da oficina
      const response = await fetch(`/api/maintenance/workshops/validate-token?token=${token}`);
      const data = await response.json();
      
      if (data.success) {
        setWorkshopData(data.workshop);
        await loadWorkshopData(data.workshop.id, token);
      } else {
        setError(data.message || 'Token inválido');
      }
    } catch (err) {
      setError('Erro ao validar token');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorkshopData = async (workshopId: number, token: string) => {
    try {
      // Carregar solicitações de manutenção
      const maintenanceResponse = await fetch(`/api/maintenance/workshop/${workshopId}/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (maintenanceResponse.ok) {
        const maintenanceData = await maintenanceResponse.json();
        setMaintenanceRequests(maintenanceData.requests || []);
      }

      // Carregar recepções de carros com token externo
      const receptionResponse = await fetch(`/api/oficina/car-receptions?token=${token}`);
      if (receptionResponse.ok) {
        const receptionData = await receptionResponse.json();
        console.log('Dados de recepção recebidos:', receptionData);
        // A API retorna um array diretamente, não um objeto com propriedade receptions
        setCarReceptions(Array.isArray(receptionData) ? receptionData : []);
      }
    } catch (err) {
      console.error('Erro ao carregar dados da oficina:', err);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects-with-bases');
      if (response.ok) {
        const data = await response.json();
        console.log('Projetos carregados:', data);
        setProjects(data.data || data.projects || []);
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    }
  };

  const handleProjectChange = (projectId: string) => {
    console.log('Mudança de projeto para ID:', projectId);
    console.log('Projetos disponíveis:', projects);
    
    setCarFormData(prev => ({ ...prev, projectId, baseId: '' }));
    const selectedProject = projects.find(p => p.id.toString() === projectId);
    
    console.log('Projeto selecionado:', selectedProject);
    console.log('Bases do projeto:', selectedProject?.bases);
    
    setSelectedProjectBases(selectedProject?.bases || []);
  };

  const addPart = () => {
    if (newPartName.trim() && newPartPrice.trim()) {
      // Converte o valor formatado para número antes de salvar
      const numericPrice = parseCurrency(newPartPrice);
      setParts([...parts, { name: newPartName.trim(), price: numericPrice.toString() }]);
      setNewPartName('');
      setNewPartPrice('');
    }
  };

  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const calculateTotalParts = () => {
    return parts.reduce((total, part) => total + parseFloat(part.price || '0'), 0);
  };

  const calculateTotalEstimated = () => {
    const laborCost = parseCurrency(carFormData.laborCost) || 0;
    const totalParts = calculateTotalParts();
    return laborCost + totalParts;
  };

  // Função para formatar valores para exibição em moeda brasileira
  const formatDisplayCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const handleCarSubmit = async () => {
    try {
      // Validações específicas para entrega
      if (carFormData.status === 'entregue') {
        if (!carFormData.deliveryPersonName.trim()) {
          toast({
            title: "Erro",
            description: "Nome da pessoa que retira o veículo é obrigatório para status 'Entregue'",
            variant: "destructive",
          });
          return;
        }
        if (!carFormData.deliveryPersonCpf.trim()) {
          toast({
            title: "Erro",
            description: "CPF da pessoa que retira o veículo é obrigatório para status 'Entregue'",
            variant: "destructive",
          });
          return;
        }
        if (!carFormData.deliveryPersonPhone.trim()) {
          toast({
            title: "Erro",
            description: "Telefone da pessoa que retira o veículo é obrigatório para status 'Entregue'",
            variant: "destructive",
          });
          return;
        }
      }

      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      const carData = {
        ...carFormData,
        currentKm: parseInt(carFormData.currentKm) || 0,
        baseId: parseInt(carFormData.baseId) || null,
        projectId: parseInt(carFormData.projectId) || null,
        laborCost: parseCurrency(carFormData.laborCost) || 0,
        partsCost: calculateTotalParts(),
        workshopId: workshopData?.id,
        replacedParts: JSON.stringify(parts),
        // Incluir dados da pessoa que retira apenas se status for entregue
        deliveryPersonName: carFormData.status === 'entregue' ? carFormData.deliveryPersonName : null,
        deliveryPersonCpf: carFormData.status === 'entregue' ? carFormData.deliveryPersonCpf : null,
        deliveryPersonPhone: carFormData.status === 'entregue' ? carFormData.deliveryPersonPhone : null,
        deliveredDate: carFormData.status === 'entregue' ? new Date().toISOString() : null
      };

      // Se estamos editando, usar PUT, senão POST
      const isEditing = editingReception !== null;
      const url = isEditing 
        ? `/api/oficina/car-receptions/${editingReception.id}?token=${token}`
        : `/api/oficina/car-receptions?token=${token}`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(carData),
      });

      if (response.ok) {
        setIsCarFormOpen(false);
        setEditingReception(null);
        setCarFormData({
          vehiclePlate: '',
          vehicleModel: '',
          vehicleType: 'carro',
          currentKm: '',
          baseId: '',
          projectId: '',
          serviceDescription: '',
          replacedParts: '',
          laborCost: '',
          partsCost: '',
          deliveryDeadline: '',
          status: 'recebido',
          notes: '',
          deliveryPersonName: '',
          deliveryPersonCpf: '',
          deliveryPersonPhone: ''
        });
        setParts([]);
        
        // Recarregar dados
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token && workshopData) {
          await loadWorkshopData(workshopData.id, token);
        }
        
        toast({
          title: "Sucesso",
          description: isEditing ? "Recepção atualizada com sucesso!" : "Veículo recebido com sucesso!",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar veículo');
      }
    } catch (error) {
      console.error('Erro ao processar veículo:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar veículo",
        variant: "destructive",
      });
    }
  };

  const handleReceiveCar = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      if (!token || !workshopData) {
        toast({
          title: "Erro",
          description: "Token de acesso não encontrado",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/oficina/receive-car', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workshopId: workshopData.id,
          ...carFormData,
          currentKm: parseInt(carFormData.currentKm) || 0,
          projectId: parseInt(carFormData.projectId) || null,
          baseId: parseInt(carFormData.baseId) || null
        })
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Veículo recebido com sucesso!",
        });
        setIsReceiveCarOpen(false);
        setCarFormData({
          vehiclePlate: '',
          vehicleModel: '',
          vehicleType: '',
          currentKm: '',
          serviceDescription: '',
          priority: 'media',
          projectId: '',
          baseId: ''
        });
        setSelectedProjectBases([]);
        // Recarregar dados
        await loadWorkshopData(workshopData.id, token);
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.message || "Erro ao receber veículo",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro de conexão",
        variant: "destructive",
      });
    }
  };

  const handleCreateOS = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      if (!token || !workshopData) {
        toast({
          title: "Erro",
          description: "Token de acesso não encontrado",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/oficina/create-service-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workshopId: workshopData.id,
          ...osFormData,
          estimatedCost: parseFloat(osFormData.estimatedCost) || 0
        })
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Ordem de serviço criada com sucesso!",
        });
        setIsNewOSOpen(false);
        setOSFormData({
          vehiclePlate: '',
          description: '',
          priority: 'media',
          estimatedCost: ''
        });
        // Recarregar dados
        await loadWorkshopData(workshopData.id, token);
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.message || "Erro ao criar ordem de serviço",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro de conexão",
        variant: "destructive",
      });
    }
  };

  const handleEditOrder = (order: MaintenanceRequest) => {
    setEditingOrder(order);
    setEditForm({
      status: order.status || '',
      data_previsao_entrega: order.estimatedCompletion ? new Date(order.estimatedCompletion).toISOString().split('T')[0] : '',
      valor_mao_obra: (order as any).valor_mao_obra?.toString() || '',
      valor_total_pecas: (order as any).valor_total_pecas?.toString() || '',
      observacoes_oficina: (order as any).observacoes_oficina || '',
      km_veiculo: (order as any).currentKm?.toString() || ''
    });
  };

  const updateMaintenanceOrder = async () => {
    if (!editingOrder) return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      const response = await fetch(`/oficina/external/ordens-servico/${editingOrder.id}?token=${token}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: editForm.status || undefined,
          data_previsao_entrega: editForm.data_previsao_entrega || undefined,
          valor_mao_obra: editForm.valor_mao_obra ? parseFloat(editForm.valor_mao_obra) : undefined,
          valor_total_pecas: editForm.valor_total_pecas ? parseFloat(editForm.valor_total_pecas) : undefined,
          observacoes_oficina: editForm.observacoes_oficina || undefined,
          km_veiculo: editForm.km_veiculo ? parseInt(editForm.km_veiculo) : undefined
        }),
      });

      if (response.ok) {
        setEditingOrder(null);
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token && workshopData) {
          await loadWorkshopData(workshopData.id, token);
        }
        toast({
          title: "Sucesso",
          description: "Ordem de serviço atualizada com sucesso!",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar ordem');
      }
    } catch (error) {
      console.error('Erro ao atualizar ordem:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar ordem de serviço",
        variant: "destructive",
      });
    }
  };

  const handleEditReception = (reception: CarReception) => {
    setEditingReception(reception);
    setReceptionEditForm({
      status: reception.status || '',
      deliveryDeadline: reception.deliveryDeadline ? new Date(reception.deliveryDeadline).toISOString().split('T')[0] : '',
      laborCost: reception.laborCost?.toString() || '',
      partsCost: reception.partsCost?.toString() || '',
      notes: reception.notes || '',
      currentKm: reception.currentKm?.toString() || '',
      replacedParts: reception.replacedParts || ''
    });
  };

  const updateCarReception = async () => {
    if (!editingReception) return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      const response = await fetch(`/oficina/external/car-receptions/${editingReception.id}?token=${token}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: receptionEditForm.status || undefined,
          deliveryDeadline: receptionEditForm.deliveryDeadline || undefined,
          laborCost: receptionEditForm.laborCost ? parseFloat(receptionEditForm.laborCost) : undefined,
          partsCost: receptionEditForm.partsCost ? parseFloat(receptionEditForm.partsCost) : undefined,
          notes: receptionEditForm.notes || undefined,
          currentKm: receptionEditForm.currentKm ? parseInt(receptionEditForm.currentKm) : undefined,
          replacedParts: receptionEditForm.replacedParts || undefined
        }),
      });

      if (response.ok) {
        setEditingReception(null);
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token && workshopData) {
          await loadWorkshopData(workshopData.id, token);
        }
        toast({
          title: "Sucesso",
          description: "Recepção de veículo atualizada com sucesso!",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar recepção');
      }
    } catch (error) {
      console.error('Erro ao atualizar recepção:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar recepção de veículo",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-lg">Validando acesso...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Acesso Negado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <p className="text-muted-foreground mt-2">
              Verifique se o link está correto ou entre em contato com o administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingRequests = maintenanceRequests.filter(r => r.status === 'pendente');
  const inProgressRequests = maintenanceRequests.filter(r => r.status === 'em_andamento');
  const completedRequests = maintenanceRequests.filter(r => r.status === 'concluida');

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard - {workshopData?.name}</h1>
            <p className="text-muted-foreground">
              Sistema de Gestão de Manutenção - CNPJ: {workshopData?.cnpj}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Oficina Externa
            </Badge>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-6 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Car className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Carros Recebidos</p>
                <p className="text-2xl font-bold">{carReceptions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">OS Pendentes</p>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <Wrench className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold">{inProgressRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold">{completedRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesso rápido às principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {/* Botão Receber Veículo */}
              <Button 
                onClick={() => window.location.href = `/maintenance/car-reception?external=true&token=${new URLSearchParams(window.location.search).get('token')}`}
                className="flex items-center gap-2 h-auto p-4 justify-start bg-green-600 hover:bg-green-700"
              >
                <Car className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium text-white">Receber Veículo</p>
                  <p className="text-sm opacity-80 text-white">Registrar entrada de veículo</p>
                </div>
              </Button>

              {/* Botão Nova OS */}
              <Dialog open={isNewOSOpen} onOpenChange={setIsNewOSOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 h-auto p-4 justify-start">
                    <FileText className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium">Nova OS</p>
                      <p className="text-sm opacity-80">Criar ordem de serviço</p>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Nova Ordem de Serviço</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="osVehiclePlate">Placa do Veículo</Label>
                      <Input
                        id="osVehiclePlate"
                        value={osFormData.vehiclePlate}
                        onChange={(e) => setOSFormData(prev => ({ ...prev, vehiclePlate: e.target.value.toUpperCase() }))}
                        placeholder="ABC1234"
                      />
                    </div>
                    <div>
                      <Label htmlFor="osDescription">Descrição do Serviço</Label>
                      <Textarea
                        id="osDescription"
                        value={osFormData.description}
                        onChange={(e) => setOSFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descreva detalhadamente o serviço..."
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="osPriority">Prioridade</Label>
                      <Select onValueChange={(value) => setOSFormData(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a prioridade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="urgente">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="estimatedCost">Custo Estimado (R$)</Label>
                      <Input
                        id="estimatedCost"
                        type="number"
                        step="0.01"
                        value={osFormData.estimatedCost}
                        onChange={(e) => setOSFormData(prev => ({ ...prev, estimatedCost: e.target.value }))}
                        placeholder="150.00"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleCreateOS} className="flex-1">
                        Criar OS
                      </Button>
                      <Button variant="outline" onClick={() => setIsNewOSOpen(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              {/* Botão Finalizar Serviço */}
              <Button variant="outline" className="flex items-center gap-2 h-auto p-4 justify-start">
                <CheckCircle className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Finalizar Serviço</p>
                  <p className="text-sm opacity-80">Concluir manutenção</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seções Principais */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recepção de Veículos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Recepção de Veículos
              </CardTitle>
              <Button 
                size="sm" 
                onClick={() => window.location.href = `/maintenance/car-reception?external=true&token=${new URLSearchParams(window.location.search).get('token')}`}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Receber Veículo
              </Button>
            </div>
            <CardDescription>
              Veículos recebidos para manutenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {carReceptions.length === 0 ? (
                <div className="text-center py-6">
                  <Car className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhum veículo recebido hoje</p>
                  <Button size="sm" className="mt-2">
                    Receber Primeiro Veículo
                  </Button>
                </div>
              ) : (
                <>
                  {carReceptions.slice(0, 3).map((reception) => (
                    <div key={reception.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{reception.vehiclePlate}</p>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingReception(reception);
                                setCarFormData({
                                  vehiclePlate: reception.vehiclePlate,
                                  vehicleModel: reception.vehicleModel,
                                  vehicleType: (reception as any).vehicleType || 'carro',
                                  currentKm: (reception as any).currentKm?.toString() || '',
                                  baseId: (reception as any).baseId?.toString() || '',
                                  projectId: (reception as any).projectId?.toString() || '',
                                  serviceDescription: reception.serviceDescription,
                                  replacedParts: (reception as any).replacedParts || '',
                                  laborCost: (reception as any).laborCost ? formatCurrency(((reception as any).laborCost * 100).toString()) : '',
                                  partsCost: (reception as any).partsCost?.toString() || '',
                                  deliveryDeadline: (reception as any).deliveryDeadline ? new Date((reception as any).deliveryDeadline).toISOString().split('T')[0] : '',
                                  status: reception.status || 'recebido',
                                  notes: (reception as any).notes || '',
                                  deliveryPersonName: (reception as any).deliveryPersonName || '',
                                  deliveryPersonCpf: (reception as any).deliveryPersonCpf || '',
                                  deliveryPersonPhone: (reception as any).deliveryPersonPhone || ''
                                });
                                
                                // Carregar bases do projeto selecionado
                                if ((reception as any).projectId) {
                                  console.log('Projeto selecionado ID:', (reception as any).projectId);
                                  console.log('Projetos disponíveis:', projects);
                                  const selectedProject = projects.find(p => p.id.toString() === (reception as any).projectId?.toString());
                                  console.log('Projeto encontrado:', selectedProject);
                                  setSelectedProjectBases(selectedProject?.bases || []);
                                  console.log('Bases carregadas:', selectedProject?.bases || []);
                                }
                                // Carregar peças existentes
                                try {
                                  const existingParts = JSON.parse((reception as any).replacedParts || '[]');
                                  setParts(Array.isArray(existingParts) ? existingParts : []);
                                } catch (e) {
                                  setParts([]);
                                }
                                // Carregar projeto/base selecionados
                                if ((reception as any).projectId) {
                                  const selectedProject = projects.find(p => p.id.toString() === (reception as any).projectId?.toString());
                                  setSelectedProjectBases(selectedProject?.bases || []);
                                }
                                setIsCarFormOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Badge variant="outline">
                              {new Date(reception.created_at).toLocaleDateString('pt-BR')}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{reception.vehicleModel} - {reception.serviceDescription}</p>
                        <p className="text-xs text-muted-foreground mt-1 capitalize">{reception.status}</p>
                      </div>
                    </div>
                  ))}
                  {carReceptions.length > 3 && (
                    <Button variant="outline" size="sm" className="w-full">
                      Ver todos ({carReceptions.length})
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ordens de Serviço */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Ordens de Serviço
              </CardTitle>
              <Dialog open={isNewOSOpen} onOpenChange={setIsNewOSOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nova OS
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
            <CardDescription>
              Serviços em andamento e pendentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {maintenanceRequests.length === 0 ? (
                <div className="text-center py-6">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhuma OS pendente</p>
                  <Button size="sm" className="mt-2">
                    Criar Nova OS
                  </Button>
                </div>
              ) : (
                <>
                  {maintenanceRequests.slice(0, 3).map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">OS #{request.id} - {request.vehiclePlate}</p>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditOrder(request)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Badge 
                              variant={
                                request.status === 'concluida' ? 'default' :
                                request.status === 'em_andamento' ? 'secondary' : 'outline'
                              }
                            >
                              {request.status === 'pendente' ? 'Pendente' :
                               request.status === 'em_andamento' ? 'Em Andamento' : 'Concluída'}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{request.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(request.entryDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {maintenanceRequests.length > 3 && (
                    <Button variant="outline" size="sm" className="w-full">
                      Ver todas ({maintenanceRequests.length})
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações da Oficina */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Informações da Oficina
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Razão Social</p>
                <p className="font-medium">{workshopData?.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">CNPJ</p>
                <p className="font-medium">{workshopData?.cnpj}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="font-medium">{workshopData?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para editar ordem de serviço */}
      <Dialog open={!!editingOrder} onOpenChange={() => setEditingOrder(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Ordem de Serviço</DialogTitle>
          </DialogHeader>
          
          {editingOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="awaiting_parts">Aguardando Peças</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="data_previsao_entrega">Previsão de Entrega</Label>
                  <Input
                    id="data_previsao_entrega"
                    type="date"
                    value={editForm.data_previsao_entrega}
                    onChange={(e) => setEditForm(prev => ({ ...prev, data_previsao_entrega: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="km_veiculo">KM Atual</Label>
                  <Input
                    id="km_veiculo"
                    type="number"
                    placeholder="Ex: 45000"
                    value={editForm.km_veiculo}
                    onChange={(e) => setEditForm(prev => ({ ...prev, km_veiculo: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="valor_mao_obra">Valor Mão de Obra (R$)</Label>
                  <Input
                    id="valor_mao_obra"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 150.00"
                    value={editForm.valor_mao_obra}
                    onChange={(e) => setEditForm(prev => ({ ...prev, valor_mao_obra: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="valor_total_pecas">Valor Total Peças (R$)</Label>
                  <Input
                    id="valor_total_pecas"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 85.50"
                    value={editForm.valor_total_pecas}
                    onChange={(e) => setEditForm(prev => ({ ...prev, valor_total_pecas: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes_oficina">Observações da Oficina</Label>
                <Textarea
                  id="observacoes_oficina"
                  placeholder="Observações sobre o serviço, peças utilizadas, etc..."
                  value={editForm.observacoes_oficina}
                  onChange={(e) => setEditForm(prev => ({ ...prev, observacoes_oficina: e.target.value }))}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingOrder(null)}>
                  Cancelar
                </Button>
                <Button onClick={updateMaintenanceOrder}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      {editingOrder && (
        <Dialog open={true} onOpenChange={() => setEditingOrder(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Editar Ordem de Serviço #{editingOrder.id}</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">Status</Label>
                <Select 
                  value={editForm.status} 
                  onValueChange={(value) => setEditForm({...editForm, status: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="data_previsao" className="text-right">Previsão Entrega</Label>
                <Input
                  id="data_previsao"
                  type="date"
                  value={editForm.data_previsao_entrega}
                  onChange={(e) => setEditForm({...editForm, data_previsao_entrega: e.target.value})}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="km_veiculo" className="text-right">KM Veículo</Label>
                <Input
                  id="km_veiculo"
                  type="number"
                  value={editForm.km_veiculo}
                  onChange={(e) => setEditForm({...editForm, km_veiculo: e.target.value})}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="valor_mao_obra" className="text-right">Valor Mão de Obra</Label>
                <Input
                  id="valor_mao_obra"
                  type="number"
                  step="0.01"
                  value={editForm.valor_mao_obra}
                  onChange={(e) => setEditForm({...editForm, valor_mao_obra: e.target.value})}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="valor_total_pecas" className="text-right">Valor Peças</Label>
                <Input
                  id="valor_total_pecas"
                  type="number"
                  step="0.01"
                  value={editForm.valor_total_pecas}
                  onChange={(e) => setEditForm({...editForm, valor_total_pecas: e.target.value})}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="observacoes" className="text-right">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={editForm.observacoes_oficina}
                  onChange={(e) => setEditForm({...editForm, observacoes_oficina: e.target.value})}
                  className="col-span-3"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingOrder(null)}>
                Cancelar
              </Button>
              <Button onClick={updateMaintenanceOrder}>
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Formulário completo de recepção de veículo */}
      {isCarFormOpen && (
        <Dialog open={isCarFormOpen} onOpenChange={() => {
          setIsCarFormOpen(false);
          setEditingReception(null);
        }}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingReception ? `Editar Recepção - ${editingReception.vehiclePlate}` : 'Receber Veículo para Manutenção'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              {/* Seção 1: Dados do Veículo */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Car className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Dados do Veículo</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plate">Placa do Veículo</Label>
                    <Input
                      id="plate"
                      value={carFormData.vehiclePlate}
                      onChange={(e) => setCarFormData(prev => ({ ...prev, vehiclePlate: e.target.value }))}
                      placeholder="ABC1234"
                      disabled={!!editingReception}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo</Label>
                    <Input
                      id="model"
                      value={carFormData.vehicleModel}
                      onChange={(e) => setCarFormData(prev => ({ ...prev, vehicleModel: e.target.value }))}
                      placeholder="Ex: Mercedes Sprinter"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Veículo</Label>
                    <Select 
                      value={carFormData.vehicleType} 
                      onValueChange={(value) => setCarFormData(prev => ({ ...prev, vehicleType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="carro">Carro</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                        <SelectItem value="caminhao">Caminhão</SelectItem>
                        <SelectItem value="moto">Moto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="km">Quilometragem Atual (km)</Label>
                    <Input
                      id="km"
                      type="number"
                      value={carFormData.currentKm}
                      onChange={(e) => setCarFormData(prev => ({ ...prev, currentKm: e.target.value }))}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="project">Projeto</Label>
                    <Select 
                      value={carFormData.projectId} 
                      onValueChange={handleProjectChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o projeto" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="base">Base</Label>
                    <Select 
                      value={carFormData.baseId} 
                      onValueChange={(value) => setCarFormData(prev => ({ ...prev, baseId: value }))}
                      disabled={!carFormData.projectId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Primeiro selecione um projeto" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProjectBases.map((base) => (
                          <SelectItem key={base.id} value={base.id.toString()}>
                            {base.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Seção 2: Serviço e Status */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Settings className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Detalhes do Serviço</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição do Serviço</Label>
                    <Textarea
                      id="description"
                      value={carFormData.serviceDescription}
                      onChange={(e) => setCarFormData(prev => ({ ...prev, serviceDescription: e.target.value }))}
                      rows={3}
                      placeholder="Descreva o que será feito no veículo..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={carFormData.status} 
                      onValueChange={(value) => setCarFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recebido">Recebido</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                        <SelectItem value="entregue">Entregue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deadline">Prazo de Entrega</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={carFormData.deliveryDeadline}
                      onChange={(e) => setCarFormData(prev => ({ ...prev, deliveryDeadline: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Seção de dados da pessoa que retira - aparece apenas quando status é "entregue" */}
                {carFormData.status === 'entregue' && (
                  <div className="space-y-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-yellow-600" />
                      <h4 className="text-md font-semibold text-yellow-800">Dados da Pessoa que Retira o Veículo</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="deliveryPersonName">Nome Completo *</Label>
                        <Input
                          id="deliveryPersonName"
                          value={carFormData.deliveryPersonName}
                          onChange={(e) => setCarFormData(prev => ({ ...prev, deliveryPersonName: e.target.value }))}
                          placeholder="Nome completo da pessoa"
                          required={carFormData.status === 'entregue'}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="deliveryPersonCpf">CPF *</Label>
                        <Input
                          id="deliveryPersonCpf"
                          value={carFormData.deliveryPersonCpf}
                          onChange={(e) => {
                            // Formatação básica do CPF
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 11) {
                              value = value.replace(/(\d{3})(\d)/, '$1.$2');
                              value = value.replace(/(\d{3})(\d)/, '$1.$2');
                              value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                            }
                            setCarFormData(prev => ({ ...prev, deliveryPersonCpf: value }));
                          }}
                          placeholder="000.000.000-00"
                          maxLength={14}
                          required={carFormData.status === 'entregue'}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="deliveryPersonPhone">Telefone *</Label>
                        <Input
                          id="deliveryPersonPhone"
                          value={carFormData.deliveryPersonPhone}
                          onChange={(e) => {
                            // Formatação básica do telefone
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 11) {
                              if (value.length <= 10) {
                                value = value.replace(/(\d{2})(\d)/, '($1) $2');
                                value = value.replace(/(\d{4})(\d)/, '$1-$2');
                              } else {
                                value = value.replace(/(\d{2})(\d)/, '($1) $2');
                                value = value.replace(/(\d{5})(\d)/, '$1-$2');
                              }
                            }
                            setCarFormData(prev => ({ ...prev, deliveryPersonPhone: value }));
                          }}
                          placeholder="(11) 99999-9999"
                          maxLength={15}
                          required={carFormData.status === 'entregue'}
                        />
                      </div>
                    </div>
                    
                    <div className="text-sm text-yellow-700">
                      <strong>Atenção:</strong> Estes dados são obrigatórios para registrar a entrega do veículo.
                    </div>
                  </div>
                )}
              </div>

              {/* Seção 3: Peças e Valores */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Wrench className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Peças e Valores</h3>
                </div>
                
                {/* Adicionar nova peça */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
                    <div className="md:col-span-3 space-y-2">
                      <Label className="text-sm font-medium">Nome da Peça</Label>
                      <Input
                        placeholder="Nome da peça"
                        value={newPartName}
                        onChange={(e) => setNewPartName(e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-medium">Valor (R$)</Label>
                      <Input
                        placeholder="R$ 0,00"
                        value={newPartPrice}
                        onChange={(e) => {
                          const formatted = formatCurrency(e.target.value);
                          setNewPartPrice(formatted);
                        }}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Button
                        type="button"
                        onClick={addPart}
                        className="w-full"
                        size="default"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Lista de peças adicionadas */}
                {parts.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">Peças Adicionadas:</h4>
                    <div className="grid gap-2">
                      {parts.map((part, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                          <span className="font-medium">{part.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-semibold text-green-600">{formatDisplayCurrency(parseFloat(part.price))}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePart(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resumo de custos */}
                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="laborCost">Custo Mão de Obra (R$)</Label>
                      <Input
                        id="laborCost"
                        placeholder="R$ 0,00"
                        value={carFormData.laborCost}
                        onChange={(e) => {
                          const formatted = formatCurrency(e.target.value);
                          setCarFormData(prev => ({ ...prev, laborCost: formatted }));
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Custo das Peças</Label>
                      <Input
                        type="text"
                        value={formatDisplayCurrency(calculateTotalParts())}
                        disabled
                        className="bg-gray-100 font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-blue-200">
                    <div className="flex justify-between items-center">
                      <Label className="text-lg font-semibold">Total Estimado</Label>
                      <div className="text-2xl font-bold text-green-600">
                        {formatDisplayCurrency(calculateTotalEstimated())}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 4: Observações */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Observações Adicionais</h3>
                </div>
                
                <div className="space-y-2">
                  <Textarea
                    id="notes"
                    value={carFormData.notes}
                    onChange={(e) => setCarFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                    placeholder="Observações sobre o estado do veículo ou outros detalhes..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => {
                setIsCarFormOpen(false);
                setEditingReception(null);
                setParts([]);
              }}>
                Cancelar
              </Button>
              <Button onClick={handleCarSubmit}>
                {editingReception ? 'Atualizar Recepção' : 'Registrar Veículo'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}