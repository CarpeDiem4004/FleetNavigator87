import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Clock, User, Car, AlertCircle, CheckCircle, XCircle, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface MaintenanceRequest {
  id: number;
  motorista_id: number;
  motorista_nome: string;
  vehicle_plate: string;
  description: string;
  urgency: 'baixa' | 'normal' | 'alta' | 'emergencial';
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  created_at: string;
  updated_at: string;
  completed_at?: string;
  notes?: string;
  approved_by?: string;
}

interface VehicleHistory {
  id: number;
  vehicle_plate: string;
  event_type: string;
  description: string;
  metadata: any;
  created_at: string;
  created_by?: string;
}

const LineHallMaintenanceManager: React.FC = () => {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    notes: '',
    approved_by: 'Administrador'
  });
  const [selectedPlate, setSelectedPlate] = useState<string>('');

  // Buscar todas as solicitações de manutenção
  const { data: maintenanceRequests = [], isLoading } = useQuery<MaintenanceRequest[]>({
    queryKey: ['/api/line-hall/maintenance-requests'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/line-hall/maintenance-requests');
      const data = await response.json();
      return data.data || [];
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Buscar histórico de uma placa específica
  const { data: plateHistory = [], isLoading: historyLoading } = useQuery<VehicleHistory[]>({
    queryKey: ['/api/vehicles/history', selectedPlate],
    queryFn: async () => {
      if (!selectedPlate) return [];
      const response = await apiRequest('GET', `/api/vehicles/${selectedPlate}/history`);
      const data = await response.json();
      return data.history || [];
    },
    enabled: !!selectedPlate,
  });

  // Mutation para atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes, approved_by }: { 
      id: number; 
      status: string; 
      notes: string; 
      approved_by: string; 
    }) => {
      const response = await apiRequest('PUT', `/api/line-hall/maintenance-requests/${id}/status`, {
        status,
        notes,
        approved_by
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Status atualizado",
        description: "O status da solicitação foi atualizado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/line-hall/maintenance-requests'] });
      setSelectedRequest(null);
      setStatusUpdate({ status: '', notes: '', approved_by: 'Administrador' });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o status da solicitação.",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'em_andamento':
        return <Wrench className="w-4 h-4 text-blue-500" />;
      case 'concluida':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelada':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'em_andamento':
        return 'bg-blue-100 text-blue-800';
      case 'concluida':
        return 'bg-green-100 text-green-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergencial':
        return 'bg-red-100 text-red-800';
      case 'alta':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'baixa':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = () => {
    if (!selectedRequest || !statusUpdate.status) {
      toast({
        title: "Dados incompletos",
        description: "Selecione um status para continuar.",
        variant: "destructive",
      });
      return;
    }

    updateStatusMutation.mutate({
      id: selectedRequest.id,
      status: statusUpdate.status,
      notes: statusUpdate.notes,
      approved_by: statusUpdate.approved_by
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gerenciamento de Manutenções - Line Hall</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Car className="w-4 h-4 mr-2" />
              Histórico por Placa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Histórico da Placa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="plate-input">Placa do Veículo</Label>
                <input
                  id="plate-input"
                  type="text"
                  placeholder="Digite a placa (ex: ABC1234)"
                  value={selectedPlate}
                  onChange={(e) => setSelectedPlate(e.target.value.toUpperCase())}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              {historyLoading && (
                <div className="text-center">Carregando histórico...</div>
              )}
              
              {plateHistory.length > 0 && (
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {plateHistory.map((entry) => (
                    <Card key={entry.id} className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{entry.description}</p>
                          <p className="text-sm text-gray-600">
                            Tipo: {entry.event_type}
                          </p>
                          {entry.metadata && (
                            <p className="text-xs text-gray-500 mt-1">
                              {JSON.stringify(entry.metadata, null, 2)}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              
              {selectedPlate && plateHistory.length === 0 && !historyLoading && (
                <p className="text-center text-gray-500">
                  Nenhum histórico encontrado para esta placa.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {maintenanceRequests.map((request) => (
          <Card key={request.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(request.status)}
                    Solicitação #{request.id}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(request.status)}>
                      {request.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge className={getUrgencyColor(request.urgency)}>
                      {request.urgency.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedRequest(request)}
                    >
                      Atualizar Status
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Atualizar Status - Solicitação #{request.id}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="status-select">Novo Status</Label>
                        <Select onValueChange={(value) => setStatusUpdate(prev => ({ ...prev, status: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="em_andamento">Em Andamento</SelectItem>
                            <SelectItem value="concluida">Concluída</SelectItem>
                            <SelectItem value="cancelada">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea
                          id="notes"
                          placeholder="Adicione observações sobre a atualização..."
                          value={statusUpdate.notes}
                          onChange={(e) => setStatusUpdate(prev => ({ ...prev, notes: e.target.value }))}
                        />
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={handleStatusUpdate}
                          disabled={updateStatusMutation.isPending || !statusUpdate.status}
                        >
                          {updateStatusMutation.isPending ? 'Atualizando...' : 'Atualizar Status'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{request.motorista_nome}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-gray-500" />
                    <span className="font-mono">{request.vehicle_plate}</span>
                  </div>
                </div>
                
                <div className="col-span-2">
                  <p className="text-sm text-gray-600 mb-2">Descrição:</p>
                  <p className="text-sm">{request.description}</p>
                  
                  {request.notes && (
                    <>
                      <p className="text-sm text-gray-600 mt-4 mb-2">Observações:</p>
                      <p className="text-sm bg-gray-50 p-2 rounded">{request.notes}</p>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t text-xs text-gray-500">
                <span>Criado em: {new Date(request.created_at).toLocaleString('pt-BR')}</span>
                {request.approved_by && (
                  <span>Aprovado por: {request.approved_by}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {maintenanceRequests.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma solicitação de manutenção encontrada.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LineHallMaintenanceManager;