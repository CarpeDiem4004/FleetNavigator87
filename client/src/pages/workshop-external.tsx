import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Wrench, Car, Calendar, Clock, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface ServiceOrder {
  id: number;
  vehiclePlate: string;
  vehicleModel?: string;
  vehicleBrand?: string;
  description: string;
  status: string;
  priority: string;
  serviceType: string;
  estimatedCost?: string;
  actualCost?: string;
  startDate: string;
  estimatedCompletion?: string;
  completionDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkshopInfo {
  workshopId: number;
  workshopName: string;
  orders: ServiceOrder[];
  total: number;
}

export default function WorkshopExternal() {
  const [location] = useLocation();
  const [workshopData, setWorkshopData] = useState<WorkshopInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    notes: '',
    actualCost: ''
  });

  // Extrair workshopId e token da URL
  const urlParams = new URLSearchParams(location.split('?')[1]);
  const workshopId = location.split('/')[2];
  const token = urlParams.get('token');

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
      in_progress: { label: "Em Andamento", color: "bg-blue-100 text-blue-800" },
      completed: { label: "Concluído", color: "bg-green-100 text-green-800" },
      cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, color: "bg-gray-100 text-gray-800" };
    
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      low: { label: "Baixa", color: "bg-green-100 text-green-800" },
      medium: { label: "Média", color: "bg-yellow-100 text-yellow-800" },
      high: { label: "Alta", color: "bg-red-100 text-red-800" }
    };
    
    const priorityInfo = priorityMap[priority as keyof typeof priorityMap] || { label: priority, color: "bg-gray-100 text-gray-800" };
    
    return <Badge className={priorityInfo.color}>{priorityInfo.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: string | undefined) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  useEffect(() => {
    const fetchWorkshopOrders = async () => {
      if (!workshopId || !token) {
        setError("ID da oficina ou token de acesso não fornecido");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/workshop/${workshopId}/orders?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Erro ao carregar ordens de serviço');
        }

        if (!data.success) {
          throw new Error(data.message || 'Falha na resposta da API');
        }

        setWorkshopData(data);
      } catch (err) {
        console.error("Erro ao buscar ordens:", err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkshopOrders();
  }, [workshopId, token]);

  const handleUpdateOrder = async () => {
    if (!selectedOrder || !workshopId || !token) return;

    setUpdateLoading(true);
    try {
      const response = await fetch(`/api/workshop/${workshopId}/orders/${selectedOrder.id}?token=${token}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: updateForm.status || undefined,
          notes: updateForm.notes || undefined,
          actualCost: updateForm.actualCost ? parseFloat(updateForm.actualCost) : undefined,
          completionDate: updateForm.status === 'completed' ? new Date().toISOString() : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao atualizar ordem');
      }

      // Recarregar dados
      window.location.reload();
    } catch (err) {
      console.error("Erro ao atualizar ordem:", err);
      alert(err instanceof Error ? err.message : 'Erro ao atualizar ordem');
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando ordens de serviço...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Erro de Acesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Wrench className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Painel da Oficina - Ordens de Serviço
              </h1>
              <p className="text-gray-600">
                Oficina ID: {workshopId} • {workshopData?.total || 0} ordem(s) de serviço
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {workshopData?.orders && workshopData.orders.length > 0 ? (
          <div className="grid gap-6">
            {workshopData.orders.map((order) => (
              <Card key={order.id} className="w-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <Car className="h-5 w-5 text-blue-600" />
                      Ordem #{order.id} - {order.vehiclePlate}
                      {order.vehicleModel && (
                        <span className="text-sm font-normal text-gray-600">
                          ({order.vehicleBrand} {order.vehicleModel})
                        </span>
                      )}
                    </CardTitle>
                    <div className="flex gap-2">
                      {getStatusBadge(order.status)}
                      {getPriorityBadge(order.priority)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Descrição */}
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Descrição do Serviço</Label>
                      <p className="mt-1 text-sm">{order.description}</p>
                    </div>

                    {/* Tipo de Serviço */}
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Tipo de Manutenção</Label>
                      <p className="mt-1 text-sm">{order.serviceType}</p>
                    </div>

                    {/* Datas */}
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Data de Entrada</Label>
                      <p className="mt-1 text-sm flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(order.startDate)}
                      </p>
                    </div>

                    {order.estimatedCompletion && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Previsão de Conclusão</Label>
                        <p className="mt-1 text-sm flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDate(order.estimatedCompletion)}
                        </p>
                      </div>
                    )}

                    {/* Custos */}
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Orçamento Inicial</Label>
                      <p className="mt-1 text-sm font-medium text-green-600">
                        {formatCurrency(order.estimatedCost)}
                      </p>
                    </div>

                    {order.actualCost && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Custo Final</Label>
                        <p className="mt-1 text-sm font-medium text-blue-600">
                          {formatCurrency(order.actualCost)}
                        </p>
                      </div>
                    )}

                    {/* Observações */}
                    {order.notes && (
                      <div className="md:col-span-2 lg:col-span-3">
                        <Label className="text-sm font-medium text-gray-600">Observações</Label>
                        <p className="mt-1 text-sm bg-gray-50 p-3 rounded-md">{order.notes}</p>
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  {/* Atualização de Status */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Atualizar Status da Ordem</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`status-${order.id}`}>Novo Status</Label>
                        <select
                          id={`status-${order.id}`}
                          className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                          value={selectedOrder?.id === order.id ? updateForm.status : ''}
                          onChange={(e) => {
                            setSelectedOrder(order);
                            setUpdateForm(prev => ({ ...prev, status: e.target.value }));
                          }}
                        >
                          <option value="">Manter atual ({order.status})</option>
                          <option value="pending">Pendente</option>
                          <option value="in_progress">Em Andamento</option>
                          <option value="completed">Concluído</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor={`cost-${order.id}`}>Custo Final (R$)</Label>
                        <Input
                          id={`cost-${order.id}`}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={selectedOrder?.id === order.id ? updateForm.actualCost : ''}
                          onChange={(e) => {
                            setSelectedOrder(order);
                            setUpdateForm(prev => ({ ...prev, actualCost: e.target.value }));
                          }}
                        />
                      </div>

                      <div className="flex items-end">
                        <Button
                          onClick={handleUpdateOrder}
                          disabled={!selectedOrder || selectedOrder.id !== order.id || updateLoading}
                          className="w-full"
                        >
                          {updateLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Atualizar
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`notes-${order.id}`}>Observações Adicionais</Label>
                      <Textarea
                        id={`notes-${order.id}`}
                        placeholder="Adicione observações sobre o serviço..."
                        value={selectedOrder?.id === order.id ? updateForm.notes : ''}
                        onChange={(e) => {
                          setSelectedOrder(order);
                          setUpdateForm(prev => ({ ...prev, notes: e.target.value }));
                        }}
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma Ordem de Serviço
              </h3>
              <p className="text-gray-600">
                Não há ordens de serviço pendentes para esta oficina no momento.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}