import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Truck, LogOut, Plus, RefreshCw, Wrench, CheckCircle, 
  AlertTriangle, Clock, Building, Car, MapPin 
} from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';

interface CocaColaUser {
  id: number;
  nome: string;
  email: string;
  base_id: number;
  tipo: string;
}

interface CocaColaBase {
  id: number;
  nome: string;
  cidade: string;
  estado: string;
}

interface CocaColaVehicle {
  id: number;
  placa: string;
  modelo: string;
  base_id: number;
  status: string;
  oficina?: string;
  prazo_estimado?: string;
  motivo_parado?: string;
}

export default function CocaColaBaseDashboard() {
  const params = useParams<{ baseId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<CocaColaUser | null>(null);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ placa: '', modelo: '', status: 'disponivel' });
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<CocaColaVehicle | null>(null);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', oficina: '', prazo_estimado: '', motivo_parado: '' });

  const baseId = parseInt(params.baseId || '0');

  useEffect(() => {
    const storedUser = localStorage.getItem('coca_cola_user');
    if (!storedUser) {
      setLocation('/coca-cola/login');
      return;
    }
    
    const parsedUser = JSON.parse(storedUser);
    
    // Verificar se o usuário tem acesso a esta base
    if (parsedUser.tipo !== 'admin' && parsedUser.base_id !== baseId) {
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão para acessar esta base',
        variant: 'destructive'
      });
      setLocation('/coca-cola/login');
      return;
    }
    
    setUser(parsedUser);
  }, [baseId, setLocation, toast]);

  const fetchWithAuth = async (url: string) => {
    const token = localStorage.getItem('coca_cola_token');
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Erro ao carregar dados');
    return response.json();
  };

  const { data: base } = useQuery<CocaColaBase>({
    queryKey: ['/api/coca-cola/bases', baseId],
    queryFn: () => fetchWithAuth(`/api/coca-cola/bases/${baseId}`),
    enabled: !!user && baseId > 0
  });

  const { data: vehicles = [], isLoading: loadingVehicles, refetch: refetchVehicles } = useQuery<CocaColaVehicle[]>({
    queryKey: ['/api/coca-cola/vehicles', 'base', baseId],
    queryFn: () => fetchWithAuth(`/api/coca-cola/vehicles?base_id=${baseId}`),
    enabled: !!user && baseId > 0
  });

  const addVehicleMutation = useMutation({
    mutationFn: async (data: typeof newVehicle) => {
      const token = localStorage.getItem('coca_cola_token');
      const response = await fetch('/api/coca-cola/vehicles', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        credentials: 'include',
        body: JSON.stringify({ ...data, base_id: baseId })
      });
      if (!response.ok) throw new Error('Erro ao adicionar veículo');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Veículo adicionado com sucesso!' });
      setShowAddVehicle(false);
      setNewVehicle({ placa: '', modelo: '', status: 'disponivel' });
      refetchVehicles();
    },
    onError: () => {
      toast({ title: 'Erro ao adicionar veículo', variant: 'destructive' });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (data: { id: number; status: string; oficina?: string; prazo_estimado?: string; motivo_parado?: string }) => {
      const token = localStorage.getItem('coca_cola_token');
      const response = await fetch(`/api/coca-cola/vehicles/${data.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erro ao atualizar veículo');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Status atualizado com sucesso!' });
      setShowUpdateStatus(false);
      setSelectedVehicle(null);
      refetchVehicles();
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('coca_cola_user');
    localStorage.removeItem('coca_cola_token');
    setLocation('/coca-cola/login');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'em_rota': return <Badge className="bg-green-500">Em Rota</Badge>;
      case 'disponivel': return <Badge className="bg-blue-500">Disponível</Badge>;
      case 'manutencao': return <Badge className="bg-yellow-500">Manutenção</Badge>;
      case 'parado': return <Badge className="bg-red-500">Parado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const vehicleStats = {
    total: vehicles.length,
    emRota: vehicles.filter(v => v.status === 'em_rota').length,
    disponiveis: vehicles.filter(v => v.status === 'disponivel').length,
    manutencao: vehicles.filter(v => v.status === 'manutencao').length,
    parados: vehicles.filter(v => v.status === 'parado').length
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-600 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{base?.nome || 'Carregando...'}</h1>
              <p className="text-sm text-red-100 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {base?.cidade}, {base?.estado}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm">Olá, {user.nome}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-red-700">
              <LogOut className="w-4 h-4 mr-1" /> Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Car className="w-8 h-8 text-gray-500" />
                <div>
                  <p className="text-2xl font-bold">{vehicleStats.total}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{vehicleStats.emRota}</p>
                  <p className="text-xs text-gray-500">Em Rota</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">{vehicleStats.disponiveis}</p>
                  <p className="text-xs text-gray-500">Disponíveis</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{vehicleStats.manutencao}</p>
                  <p className="text-xs text-gray-500">Manutenção</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{vehicleStats.parados}</p>
                  <p className="text-xs text-gray-500">Parados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Dialog open={showAddVehicle} onOpenChange={setShowAddVehicle}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="w-4 h-4 mr-1" /> Adicionar Veículo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Veículo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Placa</Label>
                  <Input 
                    placeholder="ABC-1234"
                    value={newVehicle.placa}
                    onChange={(e) => setNewVehicle({...newVehicle, placa: e.target.value.toUpperCase()})}
                  />
                </div>
                <div>
                  <Label>Modelo</Label>
                  <Input 
                    placeholder="VW Constellation"
                    value={newVehicle.modelo}
                    onChange={(e) => setNewVehicle({...newVehicle, modelo: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Status Inicial</Label>
                  <Select value={newVehicle.status} onValueChange={(v) => setNewVehicle({...newVehicle, status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disponivel">Disponível</SelectItem>
                      <SelectItem value="em_rota">Em Rota</SelectItem>
                      <SelectItem value="manutencao">Manutenção</SelectItem>
                      <SelectItem value="parado">Parado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700"
                  onClick={() => addVehicleMutation.mutate(newVehicle)}
                  disabled={addVehicleMutation.isPending}
                >
                  {addVehicleMutation.isPending ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={() => refetchVehicles()}>
            <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
          </Button>
        </div>

        {/* Vehicles List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Veículos da Base
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingVehicles ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Car className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum veículo cadastrado</p>
                <p className="text-sm">Clique em "Adicionar Veículo" para começar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {vehicles.map((vehicle) => (
                  <div 
                    key={vehicle.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <Truck className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">{vehicle.placa}</p>
                        <p className="text-sm text-gray-500">{vehicle.modelo}</p>
                        {vehicle.oficina && (
                          <p className="text-xs text-gray-400">
                            <Wrench className="w-3 h-3 inline mr-1" />
                            {vehicle.oficina}
                            {vehicle.prazo_estimado && ` - Prazo: ${format(new Date(vehicle.prazo_estimado), 'dd/MM', { locale: ptBR })}`}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getStatusBadge(vehicle.status)}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedVehicle(vehicle);
                          setStatusUpdate({
                            status: vehicle.status,
                            oficina: vehicle.oficina || '',
                            prazo_estimado: vehicle.prazo_estimado || '',
                            motivo_parado: vehicle.motivo_parado || ''
                          });
                          setShowUpdateStatus(true);
                        }}
                      >
                        Atualizar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Update Status Dialog */}
      <Dialog open={showUpdateStatus} onOpenChange={setShowUpdateStatus}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Status - {selectedVehicle?.placa}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select value={statusUpdate.status} onValueChange={(v) => setStatusUpdate({...statusUpdate, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="em_rota">Em Rota</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="parado">Parado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(statusUpdate.status === 'manutencao' || statusUpdate.status === 'parado') && (
              <>
                <div>
                  <Label>Oficina</Label>
                  <Input 
                    placeholder="Nome da oficina"
                    value={statusUpdate.oficina}
                    onChange={(e) => setStatusUpdate({...statusUpdate, oficina: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Prazo Estimado</Label>
                  <Input 
                    type="date"
                    value={statusUpdate.prazo_estimado}
                    onChange={(e) => setStatusUpdate({...statusUpdate, prazo_estimado: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Motivo</Label>
                  <Input 
                    placeholder="Descreva o motivo"
                    value={statusUpdate.motivo_parado}
                    onChange={(e) => setStatusUpdate({...statusUpdate, motivo_parado: e.target.value})}
                  />
                </div>
              </>
            )}
            
            <Button 
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (selectedVehicle) {
                  updateStatusMutation.mutate({
                    id: selectedVehicle.id,
                    ...statusUpdate
                  });
                }
              }}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
