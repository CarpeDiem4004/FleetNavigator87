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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, addDays, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Truck, LogOut, Plus, RefreshCw, Wrench, CheckCircle, 
  AlertTriangle, Clock, Building, Car, MapPin, FileText, Camera, Upload,
  TrendingUp, TrendingDown, History, BarChart3, RotateCcw, CalendarIcon, ChevronLeft, ChevronRight
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
  const [statusUpdate, setStatusUpdate] = useState({ status: '', oficina: '', prazo_estimado: '', motivo_parado: '', base_emprestimo: '' });
  
  // Estados para abertura de OS
  const [showOpenOS, setShowOpenOS] = useState(false);
  const [osVehicle, setOsVehicle] = useState<CocaColaVehicle | null>(null);
  const [osForm, setOsForm] = useState({
    tipos: [] as string[],
    descricao: '',
    km: '',
    telefone: '',
    foto: null as File | null,
    fotoPreview: ''
  });
  
  // Estados para Mini Dashboard de Utilização
  const [showHistory, setShowHistory] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  
  // Estados para sistema de Status Diário
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showObservationDialog, setShowObservationDialog] = useState(false);
  const [observationVehicle, setObservationVehicle] = useState<{ id: number; placa: string } | null>(null);
  const [observationStatus, setObservationStatus] = useState('');
  const [observationText, setObservationText] = useState('');
    
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

  // Query para estatísticas de utilização da frota
  const { data: fleetStats, refetch: refetchStats } = useQuery<{
    atual: { total: number; disponiveis: number; em_manutencao: number; em_rota: number; sem_equipe: number; percentual_disponivel: number };
    historicoDiario: { data: string; total_mudancas: number; para_disponivel: number; para_manutencao: number; resets_automaticos: number }[];
    rankingManutencao: { placa: string; vezes_em_manutencao: number; ultima_manutencao: string }[];
  }>({
    queryKey: ['/api/coca-cola/fleet-statistics', baseId],
    queryFn: () => fetchWithAuth('/api/coca-cola/fleet-statistics?days=30'),
    enabled: !!user && baseId > 0
  });

  // Query para histórico de status dos veículos
  const { data: vehicleHistory = [] } = useQuery<{
    id: number; vehicle_id: number; placa: string; status_anterior: string; status_novo: string;
    motivo: string; tipo_alteracao: string; usuario_responsavel: string; created_at: string;
  }[]>({
    queryKey: ['/api/coca-cola/vehicle-history', baseId],
    queryFn: () => fetchWithAuth('/api/coca-cola/vehicle-history?days=7'),
    enabled: !!user && baseId > 0 && showHistory
  });

  // Query para status diário dos veículos (sistema de calendário)
  const { data: dailyStatusData, refetch: refetchDailyStatus } = useQuery<{
    success: boolean;
    data: { vehicle_id: number; placa: string; modelo: string; status: string; observacao: string | null; updated_by_name: string | null; updated_at: string | null }[];
    statusCount: { total: number; em_rota: number; em_manutencao: number; parado: number; emprestado: number; baixa_venda: number; sem_equipe: number; d_mais_1: number; pernoite: number; nao_informado: number };
    dataConsulta: string;
  }>({
    queryKey: ['/api/coca-cola/vehicle-daily-status', baseId, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => fetchWithAuth(`/api/coca-cola/vehicle-daily-status?base_id=${baseId}&data=${format(selectedDate, 'yyyy-MM-dd')}`),
    enabled: !!user && baseId > 0
  });

  // Mutation para atualizar status diário (só permite data de hoje)
  const updateDailyStatusMutation = useMutation({
    mutationFn: async (data: { vehicle_id: number; status: string; observacao?: string }) => {
      if (!isToday(selectedDate)) {
        throw new Error('Só é possível atualizar o status do dia atual');
      }
      const token = localStorage.getItem('coca_cola_token');
      const response = await fetch('/api/coca-cola/vehicle-daily-status', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        credentials: 'include',
        body: JSON.stringify({ ...data, base_id: baseId, data: format(selectedDate, 'yyyy-MM-dd') })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(err.message || 'Erro ao atualizar status');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Status diário atualizado!' });
      refetchDailyStatus();
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
    }
  });

  // Mutation para gerar status diário (iniciar dia)
  const generateDailyStatusMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('coca_cola_token');
      const response = await fetch('/api/coca-cola/generate-daily-status', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        credentials: 'include',
        body: JSON.stringify({ base_id: baseId })
      });
      if (!response.ok) throw new Error('Erro ao gerar status');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: `${data.veiculos_criados} veículo(s) inicializado(s) para hoje` });
      refetchDailyStatus();
    },
    onError: () => {
      toast({ title: 'Erro ao gerar status diário', variant: 'destructive' });
    }
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
        telefone_responsavel: osForm.telefone || '',
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
      setOsForm({ tipos: [], descricao: '', km: '', telefone: '', foto: null, fotoPreview: '' });
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
      case 'emprestado': return <Badge className="bg-cyan-500">Emprestado</Badge>;
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

  // Helper para obter o status diário de um veículo
  const getDailyStatus = (vehicleId: number): string => {
    if (!dailyStatusData?.data) return 'nao_informado';
    const found = dailyStatusData.data.find(d => d.vehicle_id === vehicleId);
    return found?.status || 'nao_informado';
  };

  // Helper para obter badge do status diário
  const getDailyStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'em_rota': { label: 'Em Rota', className: 'bg-green-500' },
      'em_manutencao': { label: 'Em Manutenção', className: 'bg-yellow-500' },
      'parado': { label: 'Parado', className: 'bg-red-500' },
      'emprestado': { label: 'Emprestado', className: 'bg-blue-500' },
      'baixa_venda': { label: 'Baixa/Venda', className: 'bg-orange-500' },
      'sem_equipe': { label: 'Sem Equipe', className: 'bg-purple-500' },
      'd_mais_1': { label: 'D+1', className: 'bg-cyan-500' },
      'pernoite': { label: 'Pernoite', className: 'bg-indigo-500' },
      'nao_informado': { label: 'Não Informado', className: 'bg-gray-400' }
    };
    const config = statusConfig[status] || statusConfig['nao_informado'];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Status que requerem observação obrigatória
  const statusRequiresObservation = (status: string) => {
    return ['d_mais_1', 'pernoite'].includes(status);
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

        {/* Mini Dashboard de Utilização da Frota */}
        {fleetStats && (
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <BarChart3 className="w-5 h-5" />
                  Utilização da Frota (30 dias)
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowHistory(true)}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <History className="w-4 h-4 mr-1" /> Histórico
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => refetchStats()}
                    className="text-green-600 border-green-300 hover:bg-green-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Percentual de Disponibilidade */}
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Disponibilidade</span>
                    {(fleetStats.atual?.percentual_disponivel || 0) >= 70 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <p className={`text-2xl font-bold ${
                    (fleetStats.atual?.percentual_disponivel || 0) >= 70 ? 'text-green-600' : 
                    (fleetStats.atual?.percentual_disponivel || 0) >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {fleetStats.atual?.percentual_disponivel || 0}%
                  </p>
                  <p className="text-xs text-gray-400">dos veículos disponíveis</p>
                </div>
                
                {/* Mudanças Recentes */}
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <span className="text-sm text-gray-500">Mudanças (7 dias)</span>
                  <p className="text-2xl font-bold text-blue-600">
                    {fleetStats.historicoDiario?.slice(0, 7).reduce((acc, d) => acc + (d.total_mudancas || 0), 0) || 0}
                  </p>
                  <p className="text-xs text-gray-400">alterações de status</p>
                </div>
                
                {/* Veículos Problemáticos */}
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <span className="text-sm text-gray-500">Em Manutenção</span>
                  <p className="text-2xl font-bold text-yellow-600">
                    {fleetStats.atual?.em_manutencao || 0}
                  </p>
                  <p className="text-xs text-gray-400">veículos atualmente</p>
                </div>
                
                {/* Top Manutenção */}
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <span className="text-sm text-gray-500">Mais em Manutenção</span>
                  {fleetStats.rankingManutencao?.length > 0 ? (
                    <>
                      <p className="text-lg font-bold text-orange-600">
                        {fleetStats.rankingManutencao[0]?.placa}
                      </p>
                      <p className="text-xs text-gray-400">
                        {fleetStats.rankingManutencao[0]?.vezes_em_manutencao}x no período
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">Sem dados</p>
                  )}
                </div>
              </div>
              
              {/* Indicador Visual de Evolução */}
              <div className="mt-4 p-3 rounded-lg bg-gray-50 border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Status da Frota:</span>
                  <Badge 
                    variant={
                      (fleetStats.atual?.percentual_disponivel || 0) >= 70 ? 'default' : 
                      (fleetStats.atual?.percentual_disponivel || 0) >= 50 ? 'secondary' : 'destructive'
                    }
                    className={
                      (fleetStats.atual?.percentual_disponivel || 0) >= 70 ? 'bg-green-500' : 
                      (fleetStats.atual?.percentual_disponivel || 0) >= 50 ? 'bg-yellow-500' : ''
                    }
                  >
                    {(fleetStats.atual?.percentual_disponivel || 0) >= 70 ? 'Ótimo' : 
                     (fleetStats.atual?.percentual_disponivel || 0) >= 50 ? 'Regular' : 'Crítico'}
                  </Badge>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      (fleetStats.atual?.percentual_disponivel || 0) >= 70 ? 'bg-green-500' : 
                      (fleetStats.atual?.percentual_disponivel || 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${fleetStats.atual?.percentual_disponivel || 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal de Histórico de Alterações */}
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Histórico de Alterações (7 dias)
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {vehicleHistory.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Nenhuma alteração registrada no período.</p>
              ) : (
                vehicleHistory.map((h) => (
                  <div key={h.id} className="p-3 bg-gray-50 rounded-lg border flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">{h.placa}</Badge>
                        <span className="text-xs text-gray-400">
                          {format(new Date(h.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-sm">
                        <Badge variant="secondary" className="text-red-600 bg-red-50">{h.status_anterior || 'N/A'}</Badge>
                        <span>→</span>
                        <Badge variant="secondary" className="text-green-600 bg-green-50">{h.status_novo}</Badge>
                      </div>
                      {h.motivo && <p className="text-xs text-gray-500 mt-1">{h.motivo}</p>}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {h.tipo_alteracao === 'manual' ? 'Manual' : 
                       h.tipo_alteracao === 'reset_diario' ? 'Reset Diário' : 
                       h.tipo_alteracao === 'os_direcionada' ? 'OS' : h.tipo_alteracao}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

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

        {/* Sistema de Status Diário com Calendário */}
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <CalendarIcon className="w-5 h-5" />
                Status Diário da Frota
              </CardTitle>
              
              {/* Navegação de Data */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="min-w-[180px] justify-center font-medium">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
                          setShowCalendar(false);
                        }
                      }}
                      locale={ptBR}
                      disabled={(date) => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                  disabled={isToday(selectedDate)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                {!isToday(selectedDate) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(new Date())}
                    className="text-purple-600"
                  >
                    Hoje
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Resumo do Dia */}
            {dailyStatusData?.statusCount && (
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 mb-4">
                <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-center">
                  <p className="text-xl font-bold text-green-600">{dailyStatusData.statusCount.em_rota}</p>
                  <p className="text-xs text-green-700">Em Rota</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-center">
                  <p className="text-xl font-bold text-yellow-600">{dailyStatusData.statusCount.em_manutencao}</p>
                  <p className="text-xs text-yellow-700">Manutenção</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-center">
                  <p className="text-xl font-bold text-red-600">{dailyStatusData.statusCount.parado}</p>
                  <p className="text-xs text-red-700">Parado</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
                  <p className="text-xl font-bold text-blue-600">{dailyStatusData.statusCount.emprestado}</p>
                  <p className="text-xs text-blue-700">Emprestado</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 text-center">
                  <p className="text-xl font-bold text-orange-600">{dailyStatusData.statusCount.baixa_venda}</p>
                  <p className="text-xs text-orange-700">Baixa/Venda</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 text-center">
                  <p className="text-xl font-bold text-purple-600">{dailyStatusData.statusCount.sem_equipe}</p>
                  <p className="text-xs text-purple-700">Sem Equipe</p>
                </div>
                <div className="bg-cyan-50 p-3 rounded-lg border border-cyan-200 text-center">
                  <p className="text-xl font-bold text-cyan-600">{dailyStatusData.statusCount.d_mais_1 || 0}</p>
                  <p className="text-xs text-cyan-700">D+1</p>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200 text-center">
                  <p className="text-xl font-bold text-indigo-600">{dailyStatusData.statusCount.pernoite || 0}</p>
                  <p className="text-xs text-indigo-700">Pernoite</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-300 text-center">
                  <p className="text-xl font-bold text-gray-600">{dailyStatusData.statusCount.nao_informado}</p>
                  <p className="text-xs text-gray-700">Não Informado</p>
                </div>
              </div>
            )}

            {/* Alerta de veículos não informados */}
            {isToday(selectedDate) && dailyStatusData?.statusCount?.nao_informado > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span className="text-amber-700 font-medium">
                    {dailyStatusData.statusCount.nao_informado} veículo(s) aguardando atualização de status
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generateDailyStatusMutation.mutate()}
                  disabled={generateDailyStatusMutation.isPending}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Iniciar Dia
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicles List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Veículos da Base {!isToday(selectedDate) && <Badge variant="secondary">Visualizando: {format(selectedDate, 'dd/MM/yyyy')}</Badge>}
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
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Status Diário com Dropdown para Hoje */}
                      {isToday(selectedDate) ? (
                        <Select
                          value={getDailyStatus(vehicle.id)}
                          onValueChange={(value) => {
                            if (statusRequiresObservation(value)) {
                              setObservationVehicle({ id: vehicle.id, placa: vehicle.placa });
                              setObservationStatus(value);
                              setObservationText('');
                              setShowObservationDialog(true);
                            } else {
                              updateDailyStatusMutation.mutate({
                                vehicle_id: vehicle.id,
                                status: value
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue>
                              {getDailyStatusBadge(getDailyStatus(vehicle.id))}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="em_rota">Em Rota</SelectItem>
                            <SelectItem value="em_manutencao">Manutenção</SelectItem>
                            <SelectItem value="parado">Parado</SelectItem>
                            <SelectItem value="emprestado">Emprestado</SelectItem>
                            <SelectItem value="baixa_venda">Baixa/Venda</SelectItem>
                            <SelectItem value="sem_equipe">Sem Equipe</SelectItem>
                            <SelectItem value="d_mais_1">D+1</SelectItem>
                            <SelectItem value="pernoite">Pernoite</SelectItem>
                            <SelectItem value="nao_informado">Não Informado</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        getDailyStatusBadge(getDailyStatus(vehicle.id))
                      )}
                      
                      <Button 
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                        onClick={() => {
                          setOsVehicle(vehicle);
                          setOsForm({ tipos: [], descricao: '', km: '', telefone: '', foto: null, fotoPreview: '' });
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
                  <SelectItem value="emprestado">Emprestado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {statusUpdate.status === 'emprestado' && (
              <div>
                <Label>Base de Destino</Label>
                <Input 
                  placeholder="Nome da base onde foi emprestado"
                  value={statusUpdate.base_emprestimo}
                  onChange={(e) => setStatusUpdate({...statusUpdate, base_emprestimo: e.target.value})}
                />
              </div>
            )}
            
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

            {/* Telefone para atualizações */}
            <div>
              <Label>Telefone para Atualizações</Label>
              <Input 
                type="tel"
                placeholder="Ex: 11999998888"
                value={osForm.telefone}
                onChange={(e) => setOsForm({...osForm, telefone: e.target.value})}
              />
              <p className="text-xs text-gray-500 mt-1">Receberá atualizações sobre o status da OS</p>
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

      {/* Diálogo de Observação para D+1 e Pernoite */}
      <Dialog open={showObservationDialog} onOpenChange={setShowObservationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {observationStatus === 'd_mais_1' ? 'D+1' : 'Pernoite'} - {observationVehicle?.placa}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="font-medium">
                Observação {observationStatus === 'd_mais_1' ? '(informar motivo do D+1)' : '(informar local do pernoite)'}
              </Label>
              <Textarea
                placeholder={observationStatus === 'd_mais_1' 
                  ? 'Descreva o motivo do D+1 (ex: atraso na carga, problema na via, etc.)'
                  : 'Informe o local onde o veículo pernoitará (ex: Posto Shell - Campinas, Pátio cliente - São Paulo, etc.)'
                }
                value={observationText}
                onChange={(e) => setObservationText(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowObservationDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  if (!observationText.trim()) {
                    toast({
                      title: 'Observação obrigatória',
                      description: 'Por favor, informe a observação para este status',
                      variant: 'destructive'
                    });
                    return;
                  }
                  if (observationVehicle) {
                    updateDailyStatusMutation.mutate({
                      vehicle_id: observationVehicle.id,
                      status: observationStatus,
                      observacao: observationText.trim()
                    });
                    setShowObservationDialog(false);
                  }
                }}
                disabled={updateDailyStatusMutation.isPending}
                className={observationStatus === 'd_mais_1' ? 'bg-cyan-500 hover:bg-cyan-600' : 'bg-indigo-500 hover:bg-indigo-600'}
              >
                {updateDailyStatusMutation.isPending ? 'Salvando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
