import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Truck, LogOut, Plus, RefreshCw, Wrench, CheckCircle, 
  AlertTriangle, Clock, Building, Car, MapPin, FileText, Camera, Upload
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
  
  // Estados para abertura de OS
  const [showOpenOS, setShowOpenOS] = useState(false);
  const [osVehicle, setOsVehicle] = useState<CocaColaVehicle | null>(null);
  const [osForm, setOsForm] = useState({
    tipos: [] as string[],
    descricao: '',
    km: '',
    foto: null as File | null,
    fotoPreview: ''
  });
    
  const TIPOS_MANUTENCAO = [
    { id: 'mecanica', label: 'Mecânica' },
    { id: 'eletrica', label: 'Elétrica' },
    { id: 'funilaria', label: 'Funilaria' },
    { id: 'pneus', label: 'Pneus' },
    { id: 'revisao', label: 'Revisão' }
  ];

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

  // Query para buscar OS pendentes da base
  const { data: osPendentes = [], refetch: refetchOS } = useQuery<any[]>({
    queryKey: ['/api/public/coca-cola-os', 'base', base?.nome],
    queryFn: async () => {
      try {
        const baseName = base?.nome ? `Coca Cola - ${base.nome}` : '';
        const response = await fetch(`/api/public/coca-cola-os?base=${encodeURIComponent(baseName)}`);
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data.filter((r: any) => r.status === 'pendente') : [];
      } catch {
        return [];
      }
    },
    enabled: !!user && !!base?.nome
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

  // Mutation para criar OS
  const createOSMutation = useMutation({
    mutationFn: async () => {
      if (!osVehicle || !base) throw new Error('Dados incompletos');
      
      const tiposLabels = TIPOS_MANUTENCAO
        .filter(t => osForm.tipos.includes(t.id))
        .map(t => t.label)
        .join(', ');
      
      const descricaoCompleta = tiposLabels 
        ? `[${tiposLabels}] ${osForm.descricao}`
        : osForm.descricao;
      
      const payload = {
        placa: osVehicle.placa,
        modelo: osVehicle.modelo,
        base_origem: `Coca Cola - ${base.nome}`,
        odometro: osForm.km || null,
        relato_problema: descricaoCompleta,
        urgencia: 'media',
        responsavel_base: user?.nome || 'Operador',
        telefone_responsavel: '',
        fotos: osForm.fotoPreview ? [osForm.fotoPreview] : []
      };
      
      const response = await fetch('/api/public/maintenance-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Erro ao criar OS');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'OS aberta com sucesso!', description: 'Aguarde o direcionamento da Gestão de Frotas.' });
      setShowOpenOS(false);
      setOsVehicle(null);
      setOsForm({ tipos: [], descricao: '', km: '', foto: null, fotoPreview: '' });
      refetchOS();
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao abrir OS', description: error.message, variant: 'destructive' });
    }
  });

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOsForm({
        ...osForm,
        foto: file,
        fotoPreview: URL.createObjectURL(file)
      });
    }
  };

  const toggleTipoManutencao = (tipo: string) => {
    const tipos = osForm.tipos.includes(tipo)
      ? osForm.tipos.filter(t => t !== tipo)
      : [...osForm.tipos, tipo];
    setOsForm({ ...osForm, tipos });
  };

  const handleLogout = () => {
    localStorage.removeItem('coca_cola_user');
    localStorage.removeItem('coca_cola_token');
    setLocation('/coca-cola/login');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'em_rota': return <Badge className="bg-green-500">Em Rota</Badge>;
      case 'disponivel': return <Badge className="bg-blue-500">Disponível</Badge>;
      case 'manutencao': return <Badge className="bg-yellow-500">Em Manutenção</Badge>;
      case 'sem_equipe': return <Badge className="bg-orange-500">Sem Equipe</Badge>;
      case 'baixa_venda': return <Badge className="bg-purple-500">Baixa Venda</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const vehicleStats = {
    total: vehicles.length,
    emRota: vehicles.filter(v => v.status === 'em_rota').length,
    disponiveis: vehicles.filter(v => v.status === 'disponivel').length,
    manutencao: vehicles.filter(v => v.status === 'manutencao').length,
    parados: vehicles.filter(v => ['sem_equipe', 'baixa_venda'].includes(v.status)).length
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
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
          
          {/* Card OS Pendentes */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <FileText className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-orange-600">{osPendentes.length}</p>
                  <p className="text-xs text-orange-600 font-medium">OS Pendentes</p>
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
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(vehicle.status)}
                      <Button 
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                        onClick={() => {
                          setOsVehicle(vehicle);
                          setOsForm({ tipos: [], descricao: '', km: '', foto: null, fotoPreview: '' });
                          setShowOpenOS(true);
                        }}
                      >
                        <Wrench className="w-4 h-4 mr-1" />
                        Abrir OS
                      </Button>
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
                  <SelectItem value="manutencao">Em Manutenção</SelectItem>
                  <SelectItem value="sem_equipe">Sem Equipe</SelectItem>
                  <SelectItem value="baixa_venda">Baixa Venda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {statusUpdate.status === 'manutencao' && (
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

      {/* Modal Abrir OS */}
      <Dialog open={showOpenOS} onOpenChange={setShowOpenOS}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-500" />
              Abrir Ordem de Serviço
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Veículo preenchido automaticamente */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Veículo</p>
              <p className="font-bold text-lg">{osVehicle?.placa} - {osVehicle?.modelo}</p>
            </div>
            
            {/* Tipo de Manutenção - Checklist */}
            <div>
              <Label className="text-sm font-medium">Tipo de Manutenção</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {TIPOS_MANUTENCAO.map((tipo) => (
                  <div key={tipo.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={tipo.id}
                      checked={osForm.tipos.includes(tipo.id)}
                      onCheckedChange={() => toggleTipoManutencao(tipo.id)}
                    />
                    <label htmlFor={tipo.id} className="text-sm cursor-pointer">{tipo.label}</label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Descrição do Defeito */}
            <div>
              <Label>Descrição do Defeito</Label>
              <Textarea 
                placeholder="Descreva o problema relatado pelo motorista/operador..."
                value={osForm.descricao}
                onChange={(e) => setOsForm({...osForm, descricao: e.target.value})}
                rows={3}
              />
            </div>
            
            {/* Quilometragem */}
            <div>
              <Label>Quilometragem (KM)</Label>
              <Input 
                type="number"
                placeholder="Ex: 125000"
                value={osForm.km}
                onChange={(e) => setOsForm({...osForm, km: e.target.value})}
              />
            </div>
            
            {/* Upload de Foto */}
            <div>
              <Label>Foto do Problema (opcional)</Label>
              <input
                id="os-foto-input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFotoChange}
                className="hidden"
              />
              
              {osForm.fotoPreview ? (
                <div className="relative mt-2">
                  <img 
                    src={osForm.fotoPreview} 
                    alt="Preview" 
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setOsForm({...osForm, foto: null, fotoPreview: ''})}
                  >
                    Remover
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => document.getElementById('os-foto-input')?.click()}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Tirar Foto / Selecionar
                </Button>
              )}
            </div>
            
            {/* Botão Enviar */}
            <Button 
              className="w-full bg-amber-500 hover:bg-amber-600"
              onClick={() => createOSMutation.mutate()}
              disabled={createOSMutation.isPending || osForm.tipos.length === 0 || !osForm.descricao}
            >
              {createOSMutation.isPending ? (
                'Enviando...'
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar OS
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
