import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { useLocation } from 'wouter';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Truck, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Wrench,
  Users,
  Package,
  BarChart3,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Route,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Download,
  Upload,
  FileSpreadsheet,
  Search,
  CalendarRange,
  MessageSquare,
  Eye
} from 'lucide-react';
import { Link } from 'wouter';

interface CocaColaBase {
  id: number;
  nome: string;
  cidade: string;
  estado: string;
  ativo: boolean;
  created_at: string;
}

interface CocaColaVehicle {
  id: number;
  placa: string;
  modelo: string;
  modal?: string;
  cartao_abastecimento?: string;
  base_id: number;
  base_nome?: string;
  status: 'disponivel' | 'rota' | 'manutencao' | 'falta_equipe' | 'aguardando_peca' | 'outro';
  status_efetivo?: string;
  observacao_diaria?: string;
  atualizado_por?: string;
  atualizado_hoje?: boolean;
  oficina?: string;
  prazo_estimado?: string;
  motivo_parado?: string;
  created_at: string;
}

interface CocaColaDailyUpdate {
  id: number;
  base_id: number;
  base_nome?: string;
  data_atualizacao: string;
  total_veiculos: number;
  veiculos_rota: number;
  veiculos_manutencao: number;
  veiculos_disponiveis: number;
  veiculos_parados: number;
  atualizado_por?: string;
  created_at: string;
}

export default function CocaColaOperacao() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [newBaseDialogOpen, setNewBaseDialogOpen] = useState(false);
  const [newVehicleDialogOpen, setNewVehicleDialogOpen] = useState(false);
  const [newBaseName, setNewBaseName] = useState('');
  const [newBaseCidade, setNewBaseCidade] = useState('');
  const [newBaseEstado, setNewBaseEstado] = useState('');
  const [newVehiclePlaca, setNewVehiclePlaca] = useState('');
  const [newVehicleModelo, setNewVehicleModelo] = useState('');
  const [newVehicleBaseId, setNewVehicleBaseId] = useState<number | null>(null);
  const [selectedBaseFilter, setSelectedBaseFilter] = useState<string>('all');
  const [selectedBaseDetail, setSelectedBaseDetail] = useState<CocaColaBase | null>(null);
  const [baseDetailDialogOpen, setBaseDetailDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [modalDate, setModalDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [modalVehicleData, setModalVehicleData] = useState<any[] | null>(null);
  const [loadingModalData, setLoadingModalData] = useState(false);

  const hoje = format(new Date(), 'yyyy-MM-dd');
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [showPeriodStats, setShowPeriodStats] = useState(false);

  const fetchWithCredentials = async (url: string) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('coca_cola_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  };

  const { data: bases = [], isLoading: loadingBases, refetch: refetchBases, error: basesError } = useQuery<CocaColaBase[]>({
    queryKey: ['/api/coca-cola/bases'],
    queryFn: () => fetchWithCredentials('/api/coca-cola/bases'),
    refetchOnWindowFocus: false,
    enabled: !!user,
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000
  });

  const { data: vehicles = [], isLoading: loadingVehicles, refetch: refetchVehicles } = useQuery<CocaColaVehicle[]>({
    queryKey: ['/api/coca-cola/vehicles'],
    queryFn: () => fetchWithCredentials('/api/coca-cola/vehicles'),
    refetchOnWindowFocus: false,
    enabled: !!user,
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000
  });

  const { data: dailyUpdates = [], refetch: refetchUpdates } = useQuery<CocaColaDailyUpdate[]>({
    queryKey: ['/api/coca-cola/daily-updates', hoje],
    queryFn: () => fetchWithCredentials(`/api/coca-cola/daily-updates?data=${hoje}`),
    refetchOnWindowFocus: false,
    enabled: !!user,
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000
  });

  const { data: allDailyUpdates = [], refetch: refetchAllUpdates } = useQuery<CocaColaDailyUpdate[]>({
    queryKey: ['/api/coca-cola/daily-updates-all'],
    queryFn: () => fetchWithCredentials('/api/coca-cola/daily-updates'),
    refetchOnWindowFocus: false,
    enabled: !!user,
    retry: 3,
    retryDelay: 1000,
    staleTime: 60000
  });

  const { data: globalDailyStats, refetch: refetchGlobalStats } = useQuery<any>({
    queryKey: ['/api/coca-cola/global-daily-stats', hoje],
    queryFn: () => fetchWithCredentials(`/api/coca-cola/global-daily-stats?data=${hoje}`),
    refetchOnWindowFocus: false,
    enabled: !!user,
    retry: 3,
    staleTime: 30000
  });

  const { data: stoppedVehiclesData, refetch: refetchStopped } = useQuery<any>({
    queryKey: ['/api/coca-cola/stopped-vehicles', hoje],
    queryFn: () => fetchWithCredentials(`/api/coca-cola/stopped-vehicles?data=${hoje}`),
    refetchOnWindowFocus: false,
    enabled: !!user,
    retry: 3,
    staleTime: 30000
  });

  const { data: periodStats, refetch: refetchPeriodStats } = useQuery<any>({
    queryKey: ['/api/coca-cola/global-period-stats', periodoInicio, periodoFim],
    queryFn: () => fetchWithCredentials(`/api/coca-cola/global-period-stats?data_inicio=${periodoInicio}&data_fim=${periodoFim}`),
    refetchOnWindowFocus: false,
    enabled: !!user && showPeriodStats && !!periodoInicio && !!periodoFim,
    retry: 2,
    staleTime: 30000
  });

  const handleConsultarPeriodo = () => {
    if (periodoInicio && periodoFim) {
      setShowPeriodStats(true);
      refetchPeriodStats();
    }
  };

  useEffect(() => {
    if (!baseDetailDialogOpen || !selectedBaseDetail) return;
    if (modalDate === hoje) {
      setModalVehicleData(null);
      return;
    }
    const loadHistoricalData = async () => {
      setLoadingModalData(true);
      try {
        const data = await fetchWithCredentials(
          `/api/coca-cola/vehicle-daily-status?base_id=${selectedBaseDetail.id}&data=${modalDate}`
        );
        const mapped = (data.data || data.vehicles || []).map((v: any) => ({
          id: v.vehicle_id || v.id,
          placa: v.placa,
          modelo: v.modelo || '',
          status: v.status,
          status_efetivo: v.status,
          observacao_diaria: v.observacao || v.observacao_diaria || '',
          atualizado_por: v.updated_by_name || '',
          atualizado_hoje: true,
          base_id: selectedBaseDetail.id,
        }));
        setModalVehicleData(mapped);
      } catch {
        setModalVehicleData([]);
      } finally {
        setLoadingModalData(false);
      }
    };
    loadHistoricalData();
  }, [modalDate, selectedBaseDetail, baseDetailDialogOpen]);

  const handleExportExcel = useCallback(() => {
    if (!selectedBaseDetail) return;
    const isToday = modalDate === hoje;
    const veiculosBase = isToday
      ? vehicles.filter(v => v.base_id === selectedBaseDetail.id)
      : (modalVehicleData || []);
    const rows = veiculosBase.map((v: any) => ({
      'Placa': v.placa || '',
      'Modelo': v.modelo || '',
      'Status': v.status_efetivo || v.status || '',
      'Observação': v.observacao_diaria || '',
      'Atualizado Por': v.atualizado_por || '',
      'Base': selectedBaseDetail.nome || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Veículos');
    const baseName = selectedBaseDetail.nome.replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `veiculos_${baseName}_${modalDate}.xlsx`);
  }, [selectedBaseDetail, modalDate, vehicles, modalVehicleData, hoje]);

  // Refetch quando o usuário mudar (após login)
  useEffect(() => {
    if (user) {
      // Pequeno delay para garantir que a sessão foi sincronizada
      const timer = setTimeout(() => {
        console.log('[COCA-COLA] Refetching bases após login...');
        refetchBases();
        refetchVehicles();
        refetchUpdates();
        refetchGlobalStats();
        refetchStopped();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const createBaseMutation = useMutation({
    mutationFn: async (data: { nome: string; cidade: string; estado: string }) => {
      return apiRequest('POST', '/api/coca-cola/bases', data);
    },
    onSuccess: () => {
      toast({ title: 'Base criada com sucesso!' });
      setNewBaseDialogOpen(false);
      setNewBaseName('');
      setNewBaseCidade('');
      setNewBaseEstado('');
      queryClient.invalidateQueries({ queryKey: ['/api/coca-cola/bases'] });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erro ao criar base' });
    }
  });

  const createVehicleMutation = useMutation({
    mutationFn: async (data: { placa: string; modelo: string; base_id: number }) => {
      return apiRequest('POST', '/api/coca-cola/vehicles', data);
    },
    onSuccess: () => {
      toast({ title: 'Veículo cadastrado com sucesso!' });
      setNewVehicleDialogOpen(false);
      setNewVehiclePlaca('');
      setNewVehicleModelo('');
      setNewVehicleBaseId(null);
      queryClient.invalidateQueries({ queryKey: ['/api/coca-cola/vehicles'] });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erro ao cadastrar veículo' });
    }
  });

  const updateVehicleStatusMutation = useMutation({
    mutationFn: async (data: { id: number; status: string; oficina?: string; prazo_estimado?: string; motivo_parado?: string }) => {
      return apiRequest('PATCH', `/api/coca-cola/vehicles/${data.id}/status`, data);
    },
    onSuccess: () => {
      toast({ title: 'Status atualizado!' });
      queryClient.invalidateQueries({ queryKey: ['/api/coca-cola/vehicles'] });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erro ao atualizar status' });
    }
  });

  const updateVehicleBaseMutation = useMutation({
    mutationFn: async (data: { id: number; base_id: number }) => {
      return apiRequest('PATCH', `/api/coca-cola/vehicles/${data.id}/base`, data);
    },
    onSuccess: () => {
      toast({ title: 'Base atualizada!' });
      queryClient.invalidateQueries({ queryKey: ['/api/coca-cola/vehicles'] });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erro ao atualizar base' });
    }
  });

  const saveDailyUpdateMutation = useMutation({
    mutationFn: async (baseId: number) => {
      const baseVehicles = vehicles.filter(v => v.base_id === baseId);
      return apiRequest('POST', '/api/coca-cola/daily-updates', {
        base_id: baseId,
        data_atualizacao: hoje,
        total_veiculos: baseVehicles.length,
        veiculos_rota: baseVehicles.filter(v => ['em_rota', 'rota', 'em_operacao'].includes(v.status_efetivo || v.status)).length,
        veiculos_manutencao: baseVehicles.filter(v => ['manutencao', 'em_manutencao'].includes(v.status_efetivo || v.status)).length,
        veiculos_disponiveis: baseVehicles.filter(v => ['disponivel', 'ativo'].includes(v.status_efetivo || v.status)).length,
        veiculos_parados: baseVehicles.filter(v => ['sem_equipe', 'baixa_venda', 'falta_equipe', 'aguardando_peca', 'parado', 'outro'].includes(v.status_efetivo || v.status)).length
      });
    },
    onSuccess: () => {
      toast({ title: 'Atualização diária salva!' });
      queryClient.invalidateQueries({ queryKey: ['/api/coca-cola/daily-updates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coca-cola/daily-updates-all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coca-cola/global-daily-stats'] });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erro ao salvar atualização' });
    }
  });

  const syncVehiclesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/coca-cola/vehicles/sync-to-main', {});
    },
    onSuccess: (data: any) => {
      toast({ 
        title: 'Sincronização concluída!', 
        description: `${data.adicionados || 0} veículos adicionados à frota principal` 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coca-cola/vehicles'] });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erro ao sincronizar veículos' });
    }
  });

  const syncFromMainMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/coca-cola/vehicles/sync-from-main', {});
    },
    onSuccess: (data: any) => {
      toast({ 
        title: 'Sincronização concluída!', 
        description: `${data.adicionados || 0} veículos importados da frota principal` 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/coca-cola/vehicles'] });
      refetchVehicles();
      refetchBases();
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erro ao importar veículos da frota principal' });
    }
  });

  const handleImportVehicles = async () => {
    if (!importFile) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const token = localStorage.getItem('jwt_token');
      const response = await fetch('/api/coca-cola/vehicles/import', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include',
        body: formData,
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast({
          title: 'Importação concluída!',
          description: `${result.inserted} inseridos, ${result.updated} atualizados`,
        });
        setImportDialogOpen(false);
        setImportFile(null);
        queryClient.invalidateQueries({ queryKey: ['/api/coca-cola/vehicles'] });
        refetchVehicles();
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro na importação',
          description: result.error || 'Erro desconhecido',
        });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao importar planilha' });
    } finally {
      setImporting(false);
    }
  };

  const saveAllDailyUpdates = async () => {
    for (const base of bases.filter(b => b.ativo)) {
      await saveDailyUpdateMutation.mutateAsync(base.id);
    }
    toast({ title: 'Todas as atualizações diárias foram salvas!' });
  };

  const totalVeiculos = globalDailyStats?.total || vehicles.length;
  const veiculosRota = globalDailyStats?.counts?.em_rota || vehicles.filter(v => v.status === 'em_rota' || v.status === 'rota').length;
  const veiculosManutencao = globalDailyStats?.counts?.em_manutencao || vehicles.filter(v => v.status === 'manutencao').length;
  const veiculosDisponiveis = globalDailyStats?.counts?.disponivel || vehicles.filter(v => v.status === 'disponivel').length;
  const veiculosParados = globalDailyStats?.counts?.parados || vehicles.filter(v => ['sem_equipe', 'baixa_venda', 'falta_equipe', 'aguardando_peca', 'outro'].includes(v.status)).length;

  const basesAtualizadasHoje = dailyUpdates.filter(u => u.data_atualizacao === hoje).map(u => u.base_id);
  const basesPendentes = bases.filter(b => b.ativo && !basesAtualizadasHoje.includes(b.id));

  const percDisponivel = globalDailyStats?.percentages?.disponivel ?? (totalVeiculos > 0 ? Math.round((veiculosDisponiveis / totalVeiculos) * 100) : 0);
  const percRota = globalDailyStats?.percentages?.em_rota ?? (totalVeiculos > 0 ? Math.round((veiculosRota / totalVeiculos) * 100) : 0);
  const percManutencao = globalDailyStats?.percentages?.em_manutencao ?? (totalVeiculos > 0 ? Math.round((veiculosManutencao / totalVeiculos) * 100) : 0);
  const percParados = globalDailyStats?.percentages?.parados ?? (totalVeiculos > 0 ? Math.round((veiculosParados / totalVeiculos) * 100) : 0);

  const filteredVehicles = selectedBaseFilter === 'all' 
    ? vehicles 
    : vehicles.filter(v => v.base_id === parseInt(selectedBaseFilter));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'disponivel':
        return <Badge className="bg-green-100 text-green-800">Disponível</Badge>;
      case 'em_rota':
      case 'rota':
        return <Badge className="bg-blue-100 text-blue-800">Em Rota</Badge>;
      case 'manutencao':
        return <Badge className="bg-orange-100 text-orange-800">Em Manutenção</Badge>;
      case 'sem_equipe':
        return <Badge className="bg-yellow-100 text-yellow-800">Sem Equipe</Badge>;
      case 'baixa_venda':
        return <Badge className="bg-purple-100 text-purple-800">Baixa Venda</Badge>;
      case 'falta_equipe':
        return <Badge className="bg-yellow-100 text-yellow-800">Falta Equipe</Badge>;
      case 'aguardando_peca':
        return <Badge className="bg-purple-100 text-purple-800">Aguard. Peça</Badge>;
      case 'outro':
        return <Badge className="bg-gray-100 text-gray-800">Outro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/fleet-management">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold flex items-center text-red-700">
                  <Truck className="mr-2 h-8 w-8" />
                  Operação Coca-Cola
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gestão de frota e disponibilidade para operações Coca-Cola
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="default" 
                className="bg-green-600 hover:bg-green-700"
                onClick={saveAllDailyUpdates}
                disabled={saveDailyUpdateMutation.isPending || bases.length === 0}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> 
                {saveDailyUpdateMutation.isPending ? 'Salvando...' : 'Salvar Atualização Diária'}
              </Button>
              <Button 
                variant="outline"
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
                onClick={() => syncVehiclesMutation.mutate()}
                disabled={syncVehiclesMutation.isPending}
              >
                <Package className="h-4 w-4 mr-2" /> 
                {syncVehiclesMutation.isPending ? 'Sincronizando...' : 'Sincronizar com Frota'}
              </Button>
              <Button 
                variant="outline"
                className="border-purple-500 text-purple-600 hover:bg-purple-50"
                onClick={() => syncFromMainMutation.mutate()}
                disabled={syncFromMainMutation.isPending}
              >
                <Download className="h-4 w-4 mr-2" /> 
                {syncFromMainMutation.isPending ? 'Importando...' : 'Importar da Frota'}
              </Button>
              <Button variant="outline" onClick={() => { refetchBases(); refetchVehicles(); refetchUpdates(); refetchGlobalStats(); refetchStopped(); }}>
                <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dashboard">
                <BarChart3 className="h-4 w-4 mr-2" /> Dashboard
              </TabsTrigger>
              <TabsTrigger value="veiculos">
                <Truck className="h-4 w-4 mr-2" /> Veículos
              </TabsTrigger>
              <TabsTrigger value="bases">
                <Building2 className="h-4 w-4 mr-2" /> Bases
              </TabsTrigger>
              <TabsTrigger value="historico">
                <Calendar className="h-4 w-4 mr-2" /> Histórico
              </TabsTrigger>
              <TabsTrigger value="usuarios" onClick={() => setLocation('/fleet-management/coca-cola/usuarios')}>
                <Users className="h-4 w-4 mr-2" /> Usuários
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Frota Disponível</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-green-600">{percDisponivel}%</span>
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{veiculosDisponiveis} veículos</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Em Rota</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-blue-600">{percRota}%</span>
                      <Route className="h-8 w-8 text-blue-500" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{veiculosRota} veículos</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Em Manutenção</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-orange-600">{percManutencao}%</span>
                      <Wrench className="h-8 w-8 text-orange-500" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{veiculosManutencao} veículos</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Parados (Outros)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-red-600">{percParados}%</span>
                      <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{veiculosParados} veículos</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border border-blue-200 bg-gradient-to-r from-blue-50 to-white">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-blue-700 text-base">
                    <CalendarRange className="w-5 h-5" />
                    Consultar Período
                  </CardTitle>
                  <CardDescription>Veja as porcentagens da frota em um período específico</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Data Inicial</Label>
                      <Input 
                        type="date" 
                        value={periodoInicio} 
                        onChange={e => { setPeriodoInicio(e.target.value); setShowPeriodStats(false); }}
                        className="w-40"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Data Final</Label>
                      <Input 
                        type="date" 
                        value={periodoFim} 
                        onChange={e => { setPeriodoFim(e.target.value); setShowPeriodStats(false); }}
                        className="w-40"
                      />
                    </div>
                    <Button 
                      onClick={handleConsultarPeriodo}
                      disabled={!periodoInicio || !periodoFim}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Search className="w-4 h-4 mr-1" /> Consultar
                    </Button>
                  </div>

                  {showPeriodStats && periodStats && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-blue-700 mb-3">
                        Resultado: {format(new Date(periodoInicio + 'T12:00:00'), 'dd/MM/yyyy')} a {format(new Date(periodoFim + 'T12:00:00'), 'dd/MM/yyyy')} 
                        <span className="text-muted-foreground ml-2">({periodStats.dias_com_dados} dias com dados)</span>
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-green-600">{periodStats.percentages?.disponivel || 0}%</p>
                          <p className="text-xs text-green-700">Frota Disponível</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-blue-600">{periodStats.percentages?.em_rota || 0}%</p>
                          <p className="text-xs text-blue-700">Em Rota</p>
                        </div>
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-orange-600">{periodStats.percentages?.em_manutencao || 0}%</p>
                          <p className="text-xs text-orange-700">Em Manutenção</p>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-red-600">{periodStats.percentages?.parados || 0}%</p>
                          <p className="text-xs text-red-700">Parados</p>
                        </div>
                      </div>

                      {periodStats.daily && periodStats.daily.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Detalhamento por dia:</p>
                          <div className="max-h-[200px] overflow-y-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-xs">Data</TableHead>
                                  <TableHead className="text-xs text-center">Disponível</TableHead>
                                  <TableHead className="text-xs text-center">Em Rota</TableHead>
                                  <TableHead className="text-xs text-center">Manutenção</TableHead>
                                  <TableHead className="text-xs text-center">Parados</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {periodStats.daily.map((day: any) => (
                                  <TableRow key={day.data}>
                                    <TableCell className="text-xs">{format(new Date(day.data + 'T12:00:00'), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell className="text-xs text-center text-green-600">{day.disponivel}</TableCell>
                                    <TableCell className="text-xs text-center text-blue-600">{day.em_rota}</TableCell>
                                    <TableCell className="text-xs text-center text-orange-600">{day.em_manutencao}</TableCell>
                                    <TableCell className="text-xs text-center text-red-600">{day.parados}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Status das Bases Hoje
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {bases.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma base cadastrada. Adicione bases na aba "Bases".
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {(() => {
                          const basesAtivas = bases.filter(b => b.ativo);
                          const totalBases = basesAtivas.length;
                          const basesPreenchidas = basesAtivas.filter(b => basesAtualizadasHoje.includes(b.id)).length;
                          const percentual = totalBases > 0 ? Math.round((basesPreenchidas / totalBases) * 100) : 0;
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-muted-foreground">
                                  {basesPreenchidas} de {totalBases} bases atualizadas
                                </span>
                                <span className={`font-bold text-lg ${percentual === 100 ? 'text-green-600' : percentual >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {percentual}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${percentual === 100 ? 'bg-green-500' : percentual >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                  style={{ width: `${percentual}%` }}
                                />
                              </div>
                            </div>
                          );
                        })()}
                        <div className="space-y-2">
                        {bases.filter(b => b.ativo).map(base => {
                          const atualizouHoje = basesAtualizadasHoje.includes(base.id);
                          const veiculosBase = vehicles.filter(v => v.base_id === base.id);
                          const totalVeiculos = veiculosBase.length;
                          const veiculosAtualizados = veiculosBase.filter(v => v.atualizado_hoje).length;
                          const percBase = totalVeiculos > 0 ? Math.round((veiculosAtualizados / totalVeiculos) * 100) : 0;
                          return (
                            <div 
                              key={base.id} 
                              className={`p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity ${atualizouHoje ? 'bg-green-50' : 'bg-red-50'}`}
                              onClick={() => {
                                setSelectedBaseDetail(base);
                                setModalDate(format(new Date(), 'yyyy-MM-dd'));
                                setModalVehicleData(null);
                                setBaseDetailDialogOpen(true);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{base.nome}</p>
                                  <p className="text-sm text-muted-foreground">{base.cidade}/{base.estado} • {veiculosBase.length} veículos</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-bold ${percBase === 100 ? 'text-green-600' : percBase > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {percBase}%
                                  </span>
                                  {atualizouHoje ? (
                                    <Badge className="bg-green-100 text-green-800">
                                      <CheckCircle2 className="h-3 w-3 mr-1" /> Atualizado
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-red-100 text-red-800">
                                      <Clock className="h-3 w-3 mr-1" /> Pendente
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {totalVeiculos > 0 && (
                                <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${percBase === 100 ? 'bg-green-500' : percBase > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${percBase}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      Veículos Parados
                    </CardTitle>
                    <CardDescription>
                      Manutenção, Sem Equipe, Baixa Venda — com observações das bases
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const stoppedBases = stoppedVehiclesData?.bases || [];
                      const totalStopped = stoppedVehiclesData?.total_parados || 0;
                      
                      if (stoppedBases.length === 0) {
                        const veiculosParadosList = vehicles.filter(v => 
                          ['manutencao', 'sem_equipe', 'baixa_venda'].includes(v.status)
                        );
                        
                        if (veiculosParadosList.length === 0) {
                          return (
                            <p className="text-center text-muted-foreground py-8">
                              Nenhum veículo parado hoje.
                            </p>
                          );
                        }

                        const basesComVeiculosParados = bases.filter(base => 
                          veiculosParadosList.some(v => v.base_id === base.id)
                        );

                        return (
                          <div className="space-y-4 max-h-[400px] overflow-y-auto">
                            {basesComVeiculosParados.map(base => {
                              const veiculosBase = veiculosParadosList.filter(v => v.base_id === base.id);
                              return (
                                <div key={base.id} className="border rounded-lg p-3">
                                  <p className="font-semibold text-sm mb-2 border-b pb-1">{base.nome} ({veiculosBase.length})</p>
                                  <div className="space-y-1">
                                    {veiculosBase.map(v => (
                                      <div key={v.id} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                                        <span className="font-medium">{v.placa}</span>
                                        <span className="text-muted-foreground">{v.modelo}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }

                      const getStatusColor = (status: string) => {
                        switch (status) {
                          case 'em_manutencao': return { bg: 'bg-orange-50', text: 'text-orange-600', label: 'Em Manutenção' };
                          case 'sem_equipe': return { bg: 'bg-yellow-50', text: 'text-yellow-600', label: 'Sem Equipe' };
                          case 'baixa_venda': return { bg: 'bg-purple-50', text: 'text-purple-600', label: 'Baixa Venda' };
                          case 'parado': return { bg: 'bg-red-50', text: 'text-red-600', label: 'Parado' };
                          default: return { bg: 'bg-gray-50', text: 'text-gray-600', label: status };
                        }
                      };

                      return (
                        <div className="space-y-4 max-h-[500px] overflow-y-auto">
                          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
                            <span className="text-sm font-semibold text-red-700">Total de veículos parados hoje: {totalStopped}</span>
                          </div>
                          {stoppedBases.map((baseGroup: any) => {
                            const byStatus: Record<string, any[]> = {};
                            baseGroup.vehicles.forEach((v: any) => {
                              if (!byStatus[v.status]) byStatus[v.status] = [];
                              byStatus[v.status].push(v);
                            });

                            return (
                              <div key={baseGroup.base_id} className="border rounded-lg p-3">
                                <p className="font-semibold text-sm mb-2 border-b pb-1">
                                  {baseGroup.base_nome} ({baseGroup.vehicles.length})
                                </p>
                                {Object.entries(byStatus).map(([status, vList]) => {
                                  const color = getStatusColor(status);
                                  return (
                                    <div key={status} className="mb-2">
                                      <p className={`text-xs font-medium ${color.text} mb-1`}>{color.label} ({vList.length})</p>
                                      <div className="space-y-1">
                                        {vList.map((v: any) => (
                                          <div key={v.id} className={`text-xs ${color.bg} p-2 rounded`}>
                                            <div className="flex justify-between items-center">
                                              <span className="font-medium">{v.placa}</span>
                                              <span className="text-muted-foreground">{v.modelo}</span>
                                            </div>
                                            {v.observacao && (
                                              <div className="mt-1 flex items-start gap-1 text-gray-600">
                                                <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                <span className="italic">{v.observacao}</span>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="veiculos" className="space-y-6 mt-6">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div className="flex gap-4 items-center">
                  <Select value={selectedBaseFilter} onValueChange={setSelectedBaseFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filtrar por base" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Bases</SelectItem>
                      {bases.map(base => (
                        <SelectItem key={base.id} value={base.id.toString()}>{base.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                    {filteredVehicles.length} veículos
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" /> Importar Planilha
                  </Button>
                  <Dialog open={newVehicleDialogOpen} onOpenChange={setNewVehicleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" /> Novo Veículo
                      </Button>
                    </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cadastrar Veículo</DialogTitle>
                      <DialogDescription>Adicione um novo veículo à frota Coca-Cola</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Placa</Label>
                        <Input 
                          value={newVehiclePlaca} 
                          onChange={e => setNewVehiclePlaca(e.target.value.toUpperCase())}
                          placeholder="ABC1234"
                        />
                      </div>
                      <div>
                        <Label>Modelo</Label>
                        <Input 
                          value={newVehicleModelo} 
                          onChange={e => setNewVehicleModelo(e.target.value)}
                          placeholder="Ex: VW Delivery 9.170"
                        />
                      </div>
                      <div>
                        <Label>Base</Label>
                        <Select value={newVehicleBaseId?.toString() || ''} onValueChange={v => setNewVehicleBaseId(parseInt(v))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a base" />
                          </SelectTrigger>
                          <SelectContent>
                            {bases.map(base => (
                              <SelectItem key={base.id} value={base.id.toString()}>{base.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewVehicleDialogOpen(false)}>Cancelar</Button>
                      <Button 
                        onClick={() => {
                          if (newVehiclePlaca && newVehicleModelo && newVehicleBaseId) {
                            createVehicleMutation.mutate({
                              placa: newVehiclePlaca,
                              modelo: newVehicleModelo,
                              base_id: newVehicleBaseId
                            });
                          }
                        }}
                        disabled={!newVehiclePlaca || !newVehicleModelo || !newVehicleBaseId}
                      >
                        Cadastrar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                </div>
              </div>

              <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5" />
                      Importar/Atualizar Veículos
                    </DialogTitle>
                    <DialogDescription>
                      Envie uma planilha Excel (.xlsx) com as colunas: Placa, Modelo, Modal, Base, Cartão de Abastecimento.
                      Se um veículo com a mesma placa já existir, seus dados serão atualizados.
                      Colunas sem dados serão deixadas em branco.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="import-vehicle-file"
                      />
                      <label htmlFor="import-vehicle-file" className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        {importFile ? (
                          <p className="text-sm font-medium">{importFile.name}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Clique para selecionar a planilha</p>
                        )}
                      </label>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800 space-y-1">
                      <p className="font-semibold">Formato esperado da planilha:</p>
                      <p>- Coluna obrigatória: <strong>Placa</strong></p>
                      <p>- Colunas opcionais: Modelo, Modal, Base, Cartão de Abastecimento</p>
                      <p>- Se a placa já existir, os dados serão atualizados</p>
                      <p>- Placas novas serão cadastradas automaticamente</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setImportDialogOpen(false); setImportFile(null); }}>
                      Cancelar
                    </Button>
                    <Button onClick={handleImportVehicles} disabled={!importFile || importing}>
                      {importing ? 'Importando...' : 'Importar'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Placa</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Modal</TableHead>
                        <TableHead>Base</TableHead>
                        <TableHead>Cartão Abast.</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Oficina/Motivo</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingVehicles ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">Carregando...</TableCell>
                        </TableRow>
                      ) : filteredVehicles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            Nenhum veículo cadastrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredVehicles.map(v => (
                          <TableRow key={v.id}>
                            <TableCell className="font-medium">{v.placa}</TableCell>
                            <TableCell>{v.modelo}</TableCell>
                            <TableCell>{v.modal || '-'}</TableCell>
                            <TableCell>
                              <Select 
                                value={v.base_id?.toString() || ''} 
                                onValueChange={(newBaseId) => updateVehicleBaseMutation.mutate({ id: v.id, base_id: parseInt(newBaseId) })}
                              >
                                <SelectTrigger className="w-[130px]">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  {bases.map(base => (
                                    <SelectItem key={base.id} value={base.id.toString()}>{base.nome}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-sm">{v.cartao_abastecimento || '-'}</TableCell>
                            <TableCell>{getStatusBadge(v.status)}</TableCell>
                            <TableCell>{v.oficina || v.motivo_parado || '-'}</TableCell>
                            <TableCell className="text-right">
                              <Select 
                                value={v.status} 
                                onValueChange={(newStatus) => updateVehicleStatusMutation.mutate({ id: v.id, status: newStatus })}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="disponivel">Disponível</SelectItem>
                                  <SelectItem value="rota">Em Rota</SelectItem>
                                  <SelectItem value="manutencao">Manutenção</SelectItem>
                                  <SelectItem value="falta_equipe">Falta Equipe</SelectItem>
                                  <SelectItem value="aguardando_peca">Aguard. Peça</SelectItem>
                                  <SelectItem value="outro">Outro</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bases" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Bases Cadastradas</h2>
                <Dialog open={newBaseDialogOpen} onOpenChange={setNewBaseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" /> Nova Base
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cadastrar Base Coca-Cola</DialogTitle>
                      <DialogDescription>Adicione uma nova unidade/CD</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Nome da Base</Label>
                        <Input 
                          value={newBaseName} 
                          onChange={e => setNewBaseName(e.target.value)}
                          placeholder="Ex: CD Recife"
                        />
                      </div>
                      <div>
                        <Label>Cidade</Label>
                        <Input 
                          value={newBaseCidade} 
                          onChange={e => setNewBaseCidade(e.target.value)}
                          placeholder="Ex: Recife"
                        />
                      </div>
                      <div>
                        <Label>Estado</Label>
                        <Input 
                          value={newBaseEstado} 
                          onChange={e => setNewBaseEstado(e.target.value.toUpperCase())}
                          placeholder="Ex: PE"
                          maxLength={2}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewBaseDialogOpen(false)}>Cancelar</Button>
                      <Button 
                        onClick={() => createBaseMutation.mutate({ nome: newBaseName, cidade: newBaseCidade, estado: newBaseEstado })}
                        disabled={!newBaseName || !newBaseCidade || !newBaseEstado}
                      >
                        Cadastrar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loadingBases ? (
                  <p>Carregando...</p>
                ) : bases.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Nenhuma base cadastrada. Clique em "Nova Base" para adicionar.
                    </CardContent>
                  </Card>
                ) : (
                  bases.map(base => {
                    const veiculosBase = vehicles.filter(v => v.base_id === base.id);
                    const atualizouHoje = basesAtualizadasHoje.includes(base.id);
                    return (
                      <Card key={base.id} className={base.ativo ? '' : 'opacity-50'}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{base.nome}</CardTitle>
                            {atualizouHoje ? (
                              <Badge className="bg-green-100 text-green-800">OK</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">Pendente</Badge>
                            )}
                          </div>
                          <CardDescription>{base.cidade}/{base.estado}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-2xl font-bold">{veiculosBase.length}</p>
                              <p className="text-sm text-muted-foreground">veículos</p>
                            </div>
                            <div className="text-right text-sm">
                              <p className="text-green-600">{veiculosBase.filter(v => v.status === 'em_rota' || v.status === 'rota').length} em rota</p>
                              <p className="text-orange-600">{veiculosBase.filter(v => v.status === 'manutencao').length} manutenção</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="historico" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Atualizações</CardTitle>
                  <CardDescription>Registro de atualizações diárias por base</CardDescription>
                </CardHeader>
                <CardContent>
                  {allDailyUpdates.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum registro de atualização encontrado.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Base</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Em Rota</TableHead>
                          <TableHead>Manutenção</TableHead>
                          <TableHead>Disponíveis</TableHead>
                          <TableHead>Parados</TableHead>
                          <TableHead>Atualizado por</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allDailyUpdates.map(update => (
                          <TableRow key={update.id}>
                            <TableCell>{(() => { try { const d = new Date(update.data_atualizacao); if (isNaN(d.getTime())) return '-'; return `${String(d.getUTCDate()).padStart(2,'0')}/${String(d.getUTCMonth()+1).padStart(2,'0')}/${d.getUTCFullYear()}`; } catch { return '-'; } })()}</TableCell>
                            <TableCell>{update.base_nome || bases.find(b => b.id === update.base_id)?.nome || '-'}</TableCell>
                            <TableCell>{update.total_veiculos}</TableCell>
                            <TableCell className="text-blue-600">{update.veiculos_rota}</TableCell>
                            <TableCell className="text-orange-600">{update.veiculos_manutencao}</TableCell>
                            <TableCell className="text-green-600">{update.veiculos_disponiveis}</TableCell>
                            <TableCell className="text-red-600">{update.veiculos_parados}</TableCell>
                            <TableCell className="text-muted-foreground">{update.atualizado_por || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialog fullscreen para mostrar veículos da base */}
      <Dialog open={baseDetailDialogOpen} onOpenChange={setBaseDetailDialogOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Truck className="h-6 w-6" />
                Veículos - {selectedBaseDetail?.nome}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={modalDate}
                  onChange={e => setModalDate(e.target.value)}
                  className="w-44"
                />
                <Button variant="outline" size="sm" onClick={handleExportExcel}>
                  <Download className="h-4 w-4 mr-2" /> Exportar Excel
                </Button>
              </div>
            </div>
            <DialogDescription>
              {selectedBaseDetail?.cidade}/{selectedBaseDetail?.estado}
              {modalDate !== hoje && <span className="ml-2 font-medium text-blue-600">— Dados de {format(new Date(modalDate + 'T12:00:00'), 'dd/MM/yyyy')}</span>}
            </DialogDescription>
          </DialogHeader>
          {selectedBaseDetail && loadingModalData && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Carregando dados...</span>
            </div>
          )}
          {selectedBaseDetail && !loadingModalData && (
            <div className="space-y-6">
              {(() => {
                const isToday = modalDate === hoje;
                const veiculosBase = isToday
                  ? vehicles.filter(v => v.base_id === selectedBaseDetail.id)
                  : (modalVehicleData || []);
                const getStatus = (v: any) => v.status_efetivo || v.status;
                const statusGroups = [
                  { key: 'emRota', label: 'Em Rota', statuses: ['em_rota', 'rota', 'em_operacao'], bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', badgeBg: 'bg-green-100' },
                  { key: 'semEquipe', label: 'Sem Equipe', statuses: ['sem_equipe', 'falta_equipe'], bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', badgeBg: 'bg-yellow-100' },
                  { key: 'manutencao', label: 'Manutenção', statuses: ['manutencao', 'em_manutencao'], bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', badgeBg: 'bg-orange-100' },
                  { key: 'baixaVenda', label: 'Baixa Venda', statuses: ['baixa_venda'], bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-600', badgeBg: 'bg-red-100' },
                  { key: 'dMais1', label: 'D+1', statuses: ['d_mais_1'], bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', badgeBg: 'bg-purple-100' },
                  { key: 'emprestado', label: 'Emprestado', statuses: ['emprestado'], bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-700', badgeBg: 'bg-indigo-100' },
                  { key: 'devolvido', label: 'Devolvido', statuses: ['devolvido'], bg: 'bg-violet-50', border: 'border-violet-300', text: 'text-violet-700', badgeBg: 'bg-violet-100' },
                  { key: 'pernoite', label: 'Pernoite', statuses: ['pernoite'], bg: 'bg-sky-50', border: 'border-sky-300', text: 'text-sky-700', badgeBg: 'bg-sky-100' },
                  { key: 'semRota', label: 'Sem Rota', statuses: ['nao_informado'], bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-600', badgeBg: 'bg-gray-100' },
                  { key: 'disponivel', label: 'Disponível', statuses: ['disponivel', 'ativo'], bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-600', badgeBg: 'bg-blue-100' },
                  { key: 'parados', label: 'Parados', statuses: ['parado', 'aguardando_peca'], bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-600', badgeBg: 'bg-rose-100' },
                ];
                const allKnownStatuses = statusGroups.flatMap(g => g.statuses);
                const outrosVeiculos = veiculosBase.filter(v => !allKnownStatuses.includes(getStatus(v)));
                const groupedData = statusGroups.map(group => ({
                  ...group,
                  vehicles: veiculosBase.filter(v => group.statuses.includes(getStatus(v)))
                })).filter(g => g.vehicles.length > 0);
                if (outrosVeiculos.length > 0) {
                  groupedData.push({
                    key: 'outros', label: 'Outros', statuses: [], bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-600', badgeBg: 'bg-slate-100',
                    vehicles: outrosVeiculos
                  });
                }
                const totalVeiculos = veiculosBase.length;
                const atualizados = veiculosBase.filter(v => v.atualizado_hoje).length;
                return (
                  <>
                    <div className="flex flex-wrap gap-3 items-center">
                      <div className="p-3 bg-gray-100 rounded-lg text-center min-w-[100px]">
                        <p className="text-2xl font-bold text-gray-800">{totalVeiculos}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      {groupedData.map(group => (
                        <div key={group.key} className={`p-3 ${group.badgeBg} rounded-lg text-center min-w-[100px]`}>
                          <p className={`text-2xl font-bold ${group.text}`}>{group.vehicles.length}</p>
                          <p className="text-xs text-muted-foreground">{group.label}</p>
                        </div>
                      ))}
                      <div className="ml-auto p-3 bg-emerald-50 rounded-lg text-center min-w-[120px]">
                        <p className="text-2xl font-bold text-emerald-700">{Math.round((atualizados / totalVeiculos) * 100)}%</p>
                        <p className="text-xs text-muted-foreground">Atualizado</p>
                      </div>
                    </div>
                    {veiculosBase.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Nenhum veículo cadastrado nesta base.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {groupedData.map(group => (
                          <div key={group.key} className={`border ${group.border} rounded-lg overflow-hidden`}>
                            <div className={`${group.badgeBg} px-4 py-2 flex items-center justify-between`}>
                              <h3 className={`font-semibold ${group.text}`}>{group.label}</h3>
                              <span className={`text-sm font-bold ${group.text}`}>{group.vehicles.length}</span>
                            </div>
                            <div className={`${group.bg} divide-y divide-gray-200 max-h-[300px] overflow-y-auto`}>
                              {group.vehicles.map(v => (
                                <div key={v.id} className="px-4 py-2 flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-sm">{v.placa}</p>
                                    {v.observacao_diaria && (
                                      <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <MessageSquare className="h-3 w-3" />
                                        {v.observacao_diaria}
                                      </p>
                                    )}
                                  </div>
                                  {v.atualizado_hoje && (
                                    <span className="text-[10px] text-green-600 whitespace-nowrap">Atualizado</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
