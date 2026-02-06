import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Calendar,
  Plus,
  ClipboardList,
  Send
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

interface MaintenanceRequestForm {
  placa: string;
  modelo: string;
  base_origem: string;
  odometro: string;
  relato_problema: string;
  tipo_manutencao: string;
  urgencia: string;
  responsavel_base: string;
  telefone_responsavel: string;
}

interface MaintenanceRequest {
  id: number;
  placa: string;
  modelo: string | null;
  base_origem: string;
  odometro: number | null;
  relato_problema: string;
  tipo_manutencao: string | null;
  urgencia: string;
  status: string;
  oficina_direcionada: string | null;
  data_agendamento: string | null;
  hora_agendamento: string | null;
  instrucoes: string | null;
  responsavel_base: string | null;
  telefone_responsavel: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
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
  const [, navigate] = useLocation();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<StatusUpdate>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState<MaintenanceRequestForm>({
    placa: '',
    modelo: '',
    base_origem: '',
    odometro: '',
    relato_problema: '',
    tipo_manutencao: 'corretiva',
    urgencia: 'media',
    responsavel_base: '',
    telefone_responsavel: ''
  });
  const [activeTab, setActiveTab] = useState('status');

  const baseId = user?.base_id || user?.baseId;

  const { data: baseData } = useQuery({
    queryKey: ['/api/bases', baseId],
    queryFn: async () => {
      if (!baseId) return null;
      const response = await fetch(`/api/bases/${baseId}`, {
        credentials: 'include'
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!baseId,
    staleTime: 1000 * 60 * 5,
  });

  const baseName = baseData?.name || user?.basename || 'Base';

  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => {
        if (!user) {
          console.log('[FleetStatusBase] Usuário não autenticado, redirecionando...');
          navigate('/fleet-status/login');
        } else {
          setAuthChecked(true);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [authLoading, user, navigate]);

  const userId = user?.id;
  
  const { data: vehiclesData, isLoading, refetch } = useQuery({
    queryKey: ['/api/fleet-status/public/base', baseId, 'vehicles'],
    queryFn: async () => {
      if (!baseId || !userId) return { data: [], resumo: { total: 0, atualizados: 0, pendentes: 0, percentualAtualizado: 0 } };
      const response = await fetch(`/api/fleet-status/public/base/${baseId}/vehicles?userId=${userId}`, {
        credentials: 'include'
      });
      const result = await response.json();
      return result;
    },
    enabled: !!baseId && !!userId,
    refetchInterval: 30000
  });

  const { data: myRequests = [], refetch: refetchRequests } = useQuery<MaintenanceRequest[]>({
    queryKey: ['/api/public/maintenance-requests-base', baseName],
    queryFn: async () => {
      const res = await fetch(`/api/public/coca-cola-os?base=${encodeURIComponent(baseName)}`, { credentials: 'include' });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!baseName && baseName !== 'Base',
  });

  const updateMutation = useMutation({
    mutationFn: async (data: StatusUpdate) => {
      const response = await fetch('/api/fleet-status/public/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...data, userId })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao atualizar status');
      }
      return result;
    },
    onSuccess: () => {
      toast({ title: 'Status atualizado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/fleet-status/public/base', baseId, userId] });
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

  const maintenanceMutation = useMutation({
    mutationFn: async (data: MaintenanceRequestForm) => {
      const response = await fetch('/api/maintenance-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Erro ao criar solicitação');
      }
      return result;
    },
    onSuccess: () => {
      toast({ title: 'Solicitação enviada!', description: 'A gestão de frotas receberá sua solicitação.' });
      setIsMaintenanceDialogOpen(false);
      setMaintenanceForm({
        placa: '',
        modelo: '',
        base_origem: baseName,
        odometro: '',
        relato_problema: '',
        tipo_manutencao: 'corretiva',
        urgencia: 'media',
        responsavel_base: user?.name || '',
        telefone_responsavel: ''
      });
      refetchRequests();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro ao enviar solicitação', 
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

  const openMaintenanceDialog = (vehicle?: Vehicle) => {
    setMaintenanceForm({
      placa: vehicle?.plate || '',
      modelo: vehicle ? `${vehicle.make || ''} ${vehicle.model || ''}`.trim() : '',
      base_origem: baseName,
      odometro: '',
      relato_problema: '',
      tipo_manutencao: 'corretiva',
      urgencia: 'media',
      responsavel_base: user?.name || '',
      telefone_responsavel: ''
    });
    setIsMaintenanceDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.status) {
      toast({ title: 'Selecione um status', variant: 'destructive' });
      return;
    }
    updateMutation.mutate(formData as StatusUpdate);
  };

  const handleMaintenanceSubmit = () => {
    if (!maintenanceForm.placa || !maintenanceForm.relato_problema) {
      toast({ title: 'Preencha a placa e o relato do problema', variant: 'destructive' });
      return;
    }
    maintenanceMutation.mutate(maintenanceForm);
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

  const getRequestStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente': return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'aprovado': return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'recusado': return <Badge className="bg-red-100 text-red-800">Recusado</Badge>;
      case 'em_andamento': return <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>;
      case 'finalizado': return <Badge className="bg-gray-100 text-gray-800">Finalizado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getUrgenciaBadge = (urgencia: string) => {
    switch (urgencia) {
      case 'baixa': return <Badge className="bg-green-100 text-green-800">Baixa</Badge>;
      case 'media': return <Badge className="bg-yellow-100 text-yellow-800">Média</Badge>;
      case 'alta': return <Badge className="bg-orange-100 text-orange-800">Alta</Badge>;
      case 'veiculo_parado': return <Badge className="bg-red-100 text-red-800">Veículo Parado</Badge>;
      default: return <Badge>{urgencia}</Badge>;
    }
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
            <div className="flex gap-2">
              <Button onClick={() => openMaintenanceDialog()} variant="default" size="sm" className="bg-orange-600 hover:bg-orange-700">
                <Wrench className="w-4 h-4 mr-2" />
                Solicitar Manutenção
              </Button>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="status">
                <Truck className="w-4 h-4 mr-2" />
                Status Veículos
              </TabsTrigger>
              <TabsTrigger value="solicitacoes">
                <ClipboardList className="w-4 h-4 mr-2" />
                Minhas Solicitações ({myRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="status">
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
                        <div className="mt-3 flex items-center gap-2">
                          {getStatusBadge(vehicle.statusDiario?.status || 'nao_informado')}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              openMaintenanceDialog(vehicle);
                            }}
                          >
                            <Wrench className="w-3 h-3 mr-1" />
                            Abrir OS
                          </Button>
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
            </TabsContent>

            <TabsContent value="solicitacoes">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    Solicitações de Manutenção
                  </h3>
                  <Button onClick={() => refetchRequests()} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                </div>

                {myRequests.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <ClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">Nenhuma solicitação de manutenção encontrada.</p>
                      <p className="text-sm text-gray-400 mt-1">Clique em "Solicitar Manutenção" para abrir uma nova OS.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3">
                    {myRequests.map((req) => (
                      <Card key={req.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-bold text-lg">{req.placa}</span>
                                {getRequestStatusBadge(req.status)}
                                {getUrgenciaBadge(req.urgencia)}
                              </div>
                              {req.modelo && (
                                <p className="text-sm text-gray-500">{req.modelo}</p>
                              )}
                              <p className="text-sm mt-1">{req.relato_problema}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                <span>Aberta em: {new Date(req.created_at).toLocaleDateString('pt-BR')} {new Date(req.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                {req.odometro && <span>KM: {req.odometro.toLocaleString('pt-BR')}</span>}
                              </div>
                            </div>
                            {req.status === 'aprovado' && req.oficina_direcionada && (
                              <div className="bg-green-50 p-3 rounded-lg text-sm">
                                <p className="font-medium text-green-800">Direcionado para:</p>
                                <p className="text-green-700">{req.oficina_direcionada}</p>
                                {req.data_agendamento && (
                                  <p className="text-green-600 text-xs mt-1">
                                    Agendamento: {new Date(req.data_agendamento + 'T00:00:00').toLocaleDateString('pt-BR')}
                                    {req.hora_agendamento ? ` às ${req.hora_agendamento}` : ''}
                                  </p>
                                )}
                                {req.instrucoes && (
                                  <p className="text-green-600 text-xs mt-1">
                                    Instruções: {req.instrucoes}
                                  </p>
                                )}
                              </div>
                            )}
                            {req.status === 'recusado' && req.observacoes && (
                              <div className="bg-red-50 p-3 rounded-lg text-sm">
                                <p className="font-medium text-red-800">Motivo da recusa:</p>
                                <p className="text-red-700">{req.observacoes}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog de atualização de status */}
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

      {/* Dialog de solicitação de manutenção */}
      <Dialog open={isMaintenanceDialogOpen} onOpenChange={setIsMaintenanceDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-orange-600" />
              Solicitar Manutenção
            </DialogTitle>
            <DialogDescription>
              Preencha os dados para abrir uma solicitação de manutenção para a gestão de frotas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Placa do Veículo *</Label>
                <Select
                  value={maintenanceForm.placa}
                  onValueChange={(value) => {
                    const vehicle = vehiclesData?.data?.find((v: Vehicle) => v.plate === value);
                    setMaintenanceForm({ 
                      ...maintenanceForm, 
                      placa: value,
                      modelo: vehicle ? `${vehicle.make || ''} ${vehicle.model || ''}`.trim() : maintenanceForm.modelo
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehiclesData?.data?.map((v: Vehicle) => (
                      <SelectItem key={v.id} value={v.plate}>
                        {v.plate} - {v.make} {v.model}
                      </SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Modelo</Label>
                <Input
                  value={maintenanceForm.modelo}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, modelo: e.target.value })}
                  placeholder="Modelo do veículo"
                  readOnly
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Odômetro (KM)</Label>
                <Input
                  type="number"
                  value={maintenanceForm.odometro}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, odometro: e.target.value })}
                  placeholder="Ex: 45000"
                />
              </div>
              <div>
                <Label>Tipo de Manutenção</Label>
                <Select
                  value={maintenanceForm.tipo_manutencao}
                  onValueChange={(value) => setMaintenanceForm({ ...maintenanceForm, tipo_manutencao: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corretiva">Corretiva</SelectItem>
                    <SelectItem value="preventiva">Preventiva</SelectItem>
                    <SelectItem value="pneus">Pneus</SelectItem>
                    <SelectItem value="eletrica">Elétrica</SelectItem>
                    <SelectItem value="funilaria">Funilaria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Urgência *</Label>
              <Select
                value={maintenanceForm.urgencia}
                onValueChange={(value) => setMaintenanceForm({ ...maintenanceForm, urgencia: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa - Pode aguardar</SelectItem>
                  <SelectItem value="media">Média - Precisa de atenção</SelectItem>
                  <SelectItem value="alta">Alta - Urgente</SelectItem>
                  <SelectItem value="veiculo_parado">Veículo Parado - Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Relato do Problema *</Label>
              <Textarea
                value={maintenanceForm.relato_problema}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, relato_problema: e.target.value })}
                placeholder="Descreva detalhadamente o problema do veículo..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Responsável na Base</Label>
                <Input
                  value={maintenanceForm.responsavel_base}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, responsavel_base: e.target.value })}
                  placeholder="Nome do responsável"
                />
              </div>
              <div>
                <Label>Telefone do Responsável</Label>
                <Input
                  value={maintenanceForm.telefone_responsavel}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, telefone_responsavel: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMaintenanceDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleMaintenanceSubmit} 
              disabled={maintenanceMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {maintenanceMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Enviar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
