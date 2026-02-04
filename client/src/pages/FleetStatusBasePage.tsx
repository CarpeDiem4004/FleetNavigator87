import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Truck, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Wrench, 
  ArrowLeftRight, 
  Users,
  RefreshCw,
  Save,
  Calendar
} from 'lucide-react';

interface Vehicle {
  id: number;
  plate: string;
  model: string;
  make: string;
  vehicle_type: string;
  status: string;
  base_id: number;
  statusDiario: {
    id: number;
    status: string;
    motivo: string;
    local_manutencao: string;
    prazo_manutencao: string;
    base_emprestada_nome: string;
    data_devolucao: string;
  } | null;
  atualizado: boolean;
}

interface StatusUpdate {
  vehicle_id: number;
  vehicle_plate: string;
  base_id: number;
  base_name: string;
  status: string;
  motivo?: string;
  local_manutencao?: string;
  prazo_manutencao?: string;
  base_emprestada_id?: number;
  base_emprestada_nome?: string;
  data_devolucao?: string;
}

const STATUS_OPTIONS = [
  { value: 'em_rota', label: 'Em Rota', icon: Truck, color: 'bg-green-500' },
  { value: 'sem_equipe', label: 'Sem Equipe', icon: Users, color: 'bg-yellow-500' },
  { value: 'manutencao', label: 'Em Manutenção', icon: Wrench, color: 'bg-red-500' },
  { value: 'emprestado', label: 'Emprestado', icon: ArrowLeftRight, color: 'bg-blue-500' },
  { value: 'devolvido', label: 'Devolvido', icon: CheckCircle, color: 'bg-purple-500' },
  { value: 'nao_informado', label: 'Não Informado', icon: AlertCircle, color: 'bg-gray-500' },
];

export default function FleetStatusBasePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<StatusUpdate>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const baseId = user?.base_id || user?.baseId;
  const baseName = user?.basename || user?.name || 'Base';

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/fleet-status/login';
    }
  }, [authLoading, user]);

  const { data: vehiclesData, isLoading, refetch } = useQuery({
    queryKey: ['/api/fleet-status/base', baseId, 'vehicles'],
    queryFn: async () => {
      if (!baseId) return { data: [], resumo: { total: 0, atualizados: 0, pendentes: 0, percentualAtualizado: 0 } };
      const response = await fetch(`/api/fleet-status/base/${baseId}/vehicles`, {
        credentials: 'include'
      });
      const result = await response.json();
      return result;
    },
    enabled: !!baseId,
    refetchInterval: 30000
  });

  const updateMutation = useMutation({
    mutationFn: async (data: StatusUpdate) => {
      return apiRequest('POST', '/api/fleet-status/daily', data);
    },
    onSuccess: () => {
      toast({ title: 'Status atualizado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/fleet-status/base'] });
      setIsDialogOpen(false);
      setSelectedVehicle(null);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro ao atualizar status', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const openUpdateDialog = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData({
      vehicle_id: vehicle.id,
      vehicle_plate: vehicle.plate,
      base_id: baseId!,
      base_name: baseName,
      status: vehicle.statusDiario?.status || 'nao_informado',
      motivo: vehicle.statusDiario?.motivo || '',
      local_manutencao: vehicle.statusDiario?.local_manutencao || '',
      prazo_manutencao: vehicle.statusDiario?.prazo_manutencao || '',
      base_emprestada_nome: vehicle.statusDiario?.base_emprestada_nome || '',
      data_devolucao: vehicle.statusDiario?.data_devolucao || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.status) {
      toast({ title: 'Selecione um status', variant: 'destructive' });
      return;
    }
    updateMutation.mutate(formData as StatusUpdate);
  };

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    if (!statusOption) return <Badge variant="secondary">Não Informado</Badge>;
    
    const Icon = statusOption.icon;
    return (
      <Badge className={`${statusOption.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {statusOption.label}
      </Badge>
    );
  };

  const filteredVehicles = vehiclesData?.data?.filter((v: Vehicle) => 
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const today = new Date().toLocaleDateString('pt-BR');

  if (!baseId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
            <p className="text-gray-600">
              Você precisa estar vinculado a uma base para acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Truck className="w-6 h-6" />
                Status da Frota - {baseName}
              </CardTitle>
              <CardDescription className="mt-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Atualização diária - {today}
              </CardDescription>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-blue-50">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {vehiclesData?.resumo?.total || 0}
                </div>
                <div className="text-sm text-gray-600">Total de Veículos</div>
              </CardContent>
            </Card>
            <Card className="bg-green-50">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-green-600">
                  {vehiclesData?.resumo?.atualizados || 0}
                </div>
                <div className="text-sm text-gray-600">Atualizados</div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-yellow-600">
                  {vehiclesData?.resumo?.pendentes || 0}
                </div>
                <div className="text-sm text-gray-600">Pendentes</div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {vehiclesData?.resumo?.percentualAtualizado || 0}%
                </div>
                <div className="text-sm text-gray-600">Progresso</div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-4">
            <Input
              placeholder="Buscar por placa ou modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">Carregando veículos...</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredVehicles.map((vehicle: Vehicle) => (
                <Card 
                  key={vehicle.id} 
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    vehicle.atualizado ? 'border-green-200' : 'border-yellow-200'
                  }`}
                  onClick={() => openUpdateDialog(vehicle)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-lg">{vehicle.plate}</div>
                        <div className="text-sm text-gray-500">
                          {vehicle.make} {vehicle.model}
                        </div>
                        <div className="text-xs text-gray-400 capitalize">
                          {vehicle.vehicle_type?.replace('_', ' ')}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {vehicle.atualizado ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-500" />
                        )}
                      </div>
                    </div>
                    <div className="mt-3">
                      {getStatusBadge(vehicle.statusDiario?.status || 'nao_informado')}
                    </div>
                    {vehicle.statusDiario?.motivo && (
                      <div className="mt-2 text-xs text-gray-500 truncate">
                        {vehicle.statusDiario.motivo}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Atualizar Status - {selectedVehicle?.plate}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Status do Veículo *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {formData.status === 'sem_equipe' && (
              <div>
                <Label>Motivo</Label>
                <Textarea
                  value={formData.motivo || ''}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  placeholder="Descreva o motivo..."
                />
              </div>
            )}

            {formData.status === 'manutencao' && (
              <>
                <div>
                  <Label>Local da Manutenção</Label>
                  <Input
                    value={formData.local_manutencao || ''}
                    onChange={(e) => setFormData({ ...formData, local_manutencao: e.target.value })}
                    placeholder="Ex: Oficina XYZ"
                  />
                </div>
                <div>
                  <Label>Prazo Previsto</Label>
                  <Input
                    type="date"
                    value={formData.prazo_manutencao || ''}
                    onChange={(e) => setFormData({ ...formData, prazo_manutencao: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Observação</Label>
                  <Textarea
                    value={formData.motivo || ''}
                    onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                    placeholder="Descreva o problema..."
                  />
                </div>
              </>
            )}

            {formData.status === 'emprestado' && (
              <>
                <div>
                  <Label>Base Destino</Label>
                  <Input
                    value={formData.base_emprestada_nome || ''}
                    onChange={(e) => setFormData({ ...formData, base_emprestada_nome: e.target.value })}
                    placeholder="Nome da base que recebeu"
                  />
                </div>
                <div>
                  <Label>Previsão de Retorno</Label>
                  <Input
                    type="date"
                    value={formData.data_devolucao || ''}
                    onChange={(e) => setFormData({ ...formData, data_devolucao: e.target.value })}
                  />
                </div>
              </>
            )}

            {formData.status === 'devolvido' && (
              <div>
                <Label>Data da Devolução</Label>
                <Input
                  type="date"
                  value={formData.data_devolucao || ''}
                  onChange={(e) => setFormData({ ...formData, data_devolucao: e.target.value })}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
