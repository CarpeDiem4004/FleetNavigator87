import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileBarChart, 
  Upload, 
  Package, 
  Wrench, 
  CheckCircle, 
  BarChart3,
  TrendingUp,
  DollarSign,
  Clock,
  Car,
  Search,
  Calendar,
  Building2,
  FileSpreadsheet,
  AlertTriangle,
  AlertCircle,
  Edit,
  Save,
  X,
  Plus,
  Radio,
  MapPin,
  Truck,
  Trash2,
  Eye,
  History,
  Filter
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

interface UploadRecord {
  id: number;
  filename: string;
  upload_date: string;
  total_records: number;
  user_name: string;
  processed_at: string;
}

interface Peca {
  id: number;
  data: string;
  filtro_combustivel: number;
  filtro_ar: number;
  filtro_oleo: number;
  oleo_motor_5w30: number;
  pastilha_freio_dianteira: number;
  filtro_combustivel_master_2023: number;
  pastilha_freio_traseira: number;
  disco_freio_dianteiro: number;
  disco_freio_traseiro: number;
}

interface Dado {
  id: number;
  placa: string;
  modelo: string;
  km: number;
  relato: string;
  data_agenda: string;
  focal: string;
  oficina_debito: string;
  atendimento: string;
  status: string;
}

interface Liberado {
  id: number;
  placa: string;
  modelo: string;
  km: number;
  relato: string;
  data_agenda: string;
  focal: string;
  reparo: string;
  tipo_manutencao: string;
  data_forms: string;
  atendimento: string;
  aprovacao: string;
  centro_custo: string;
  operacao: string;
  status: string;
  previsao_entrega: string;
  liberado: string;
  d_manut: number;
  status2: string;
  oficina: string;
  lider_base: string;
  mes: string;
}

interface Stats {
  total_em_manutencao: number;
  total_liberado: number;
  veiculos_unicos_manutencao: number;
  veiculos_unicos_liberado: number;
  preventivas: number;
  corretivas: number;
}

interface DashboardData {
  totais: {
    total_manutencoes: number;
    veiculos_atendidos: number;
    custo_total: number;
    custo_medio: number;
    tempo_medio: number;
    dias_parados_total: number;
  };
  porTipo: Array<{ tipo: string; quantidade: number; valor_total: number; tempo_medio: number }>;
  porOficina: Array<{ oficina: string; quantidade: number; valor_total: number; tempo_medio: number }>;
  porBase: Array<{ base: string; quantidade: number; valor_total: number }>;
  rankingPlacas: Array<{ placa: string; quantidade: number; custo_total: number; dias_parados: number }>;
  evolucaoMensal: Array<{ mes: string; quantidade: number; valor_total: number; veiculos: number }>;
  porStatus: Array<{ status: string; quantidade: number }>;
}

interface PecaAnalise {
  peca: string;
  quantidade: number;
  custo_total: number;
}

interface PecasAnaliseData {
  topGeral: PecaAnalise[];
  preventivas: PecaAnalise[];
  corretivas: PecaAnalise[];
  porModelo: Record<string, PecaAnalise[]>;
  modelos: string[];
}

interface ManutencaoHistorico {
  id: number;
  placa: string;
  tipo: string;
  descricao: string;
  valor: number;
  status: string;
  km: number;
  data_entrada: string;
  data_saida: string;
  tempo_total: number;
  oficina: string;
  base: string;
  data_manutencao: string;
}

interface BipData {
  id: number;
  placa: string;
  ml_bip: string | null;
  dds_bip: string | null;
  base_reserva: string | null;
  ultimo_bip: string | null;
  motivo: string | null;
  observacao: string | null;
  dias_sem_bip: number;
  created_at: string;
}

const COLORS = ['#2563eb', '#16a34a', '#eab308', '#dc2626', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

export default function IndicadoresManutencao() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedUploadId, setSelectedUploadId] = useState<number | null>(null);
  const [filterTipoManutencao, setFilterTipoManutencao] = useState<string>('');
  const [filterPlaca, setFilterPlaca] = useState<string>('');
  const [searchPlaca, setSearchPlaca] = useState<string>('');
  const [dashboardBase, setDashboardBase] = useState<string>('');
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedModeloPeca, setSelectedModeloPeca] = useState<string>('');
  const [editingDado, setEditingDado] = useState<Dado | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newDadoDialogOpen, setNewDadoDialogOpen] = useState(false);
  const [newDado, setNewDado] = useState<Partial<Dado>>({
    placa: '',
    modelo: '',
    status: 'Em Manutenção',
    oficina_debito: '',
    km: 0,
    relato: '',
    data_agenda: new Date().toISOString().split('T')[0],
    focal: '',
    atendimento: ''
  });
  const [newPecas, setNewPecas] = useState<Array<{nome: string, valor: number}>>([{nome: '', valor: 0}]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedGrupo, setSelectedGrupo] = useState<string>('');
  const [selectedSubgrupo, setSelectedSubgrupo] = useState<string>('');
  const [bipSearchPlaca, setBipSearchPlaca] = useState<string>('');
  const [bipFilterMotivo, setBipFilterMotivo] = useState<string>('');
  const [bipDateStart, setBipDateStart] = useState<string>('');
  const [bipDateEnd, setBipDateEnd] = useState<string>('');
  const [editingBip, setEditingBip] = useState<any | null>(null);
  const [bipEditData, setBipEditData] = useState({
    ultimo_bip: '',
    ml_bip: '',
    dds_bip: '',
    motivo: '',
    observacao: '',
    base_reserva: ''
  });
  
  // Estados para aba Cadastro
  const [cadastroSearchPlaca, setCadastroSearchPlaca] = useState<string>('');
  const [cadastroFilterOwnership, setCadastroFilterOwnership] = useState<string>('');
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null);
  const [showNewVehicleModal, setShowNewVehicleModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    plate: '',
    model: '',
    ownership: 'Murici'
  });
  const [uploadingVeiculos, setUploadingVeiculos] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importReport, setImportReport] = useState<{
    total: number;
    importados: number;
    atualizados: number;
    ignorados: number;
    erros: { linha: number; motivo: string }[];
  } | null>(null);
  const [showVeiculoDetails, setShowVeiculoDetails] = useState(false);
  const [selectedVeiculo, setSelectedVeiculo] = useState<any | null>(null);
  const [veiculoEditData, setVeiculoEditData] = useState<any>({});
  
  // Estado para estatísticas de distribuição de veículos
  const [veiculosStats, setVeiculosStats] = useState<{
    porPosse: { name: string; value: number }[];
    porLocadora: { name: string; value: number }[];
    porEstado: { name: string; value: number }[];
    total: number;
  } | null>(null);

  // Estados para aba Finalizadas
  const [finalizadasSearchPlaca, setFinalizadasSearchPlaca] = useState<string>('');
  const [finalizadasFilterTipo, setFinalizadasFilterTipo] = useState<string>('');
  const [finalizadasFilterOficina, setFinalizadasFilterOficina] = useState<string>('');
  const [finalizadasFilterOperacao, setFinalizadasFilterOperacao] = useState<string>('');
  const [finalizadasFilterMes, setFinalizadasFilterMes] = useState<string>('');
  const [finalizadasFileToUpload, setFinalizadasFileToUpload] = useState<File | null>(null);
  const [uploadingFinalizadas, setUploadingFinalizadas] = useState(false);
  const [showHistoricoPlaca, setShowHistoricoPlaca] = useState(false);
  const [selectedPlacaHistorico, setSelectedPlacaHistorico] = useState<string>('');

  // Lista de modelos de veículos disponíveis
  const modelosVeiculos = [
    'ACCELO 1016', 'ACCELO 1017', 'ACCELO 817', 'ACCELO 1316',
    'Sprinter 313', 'DELIVERY 9.180', 'DELIVERY 13.180 6x2',
    'FORD TRANSIT 350 FL', 'FORD TRANSIT 350 CL', 'FORD RENT',
    'MASTER FURGAO L1', 'Fiorino Endurance Evo 1.4 2P',
    'IVECO 35S1', 'TECTOR 170E21', 'CONSTELLATION 17.190', 'CONSTELLATION 26.320',
    'ACTROS 2548 LS 6X2', 'ACTROS 2651 LS 6X4',
    'VM 360', 'Atego 2426', 'Atego 2429', 'Atego 1719', 'Atego 1317',
    'TECTOR 24-320-CL', 'FH 540',
    'FURGAO CARGA GERAL', 'BITREM CARGA GERAL DIANTEIRO', 'BITREM CARGA GERAL TRASEIRO',
    'E-Jumpy Furgão 2P', 'JAC iEV1200T AT 4x2 2P',
    'Partner Rapid Business Pack 1.4 2P', 'Kangoo Z.E. MAXI 5 Lugares 2P',
    'EXPERT-CARGO-1.5-TURBO-DIESEL', 'E-EXPERT-CARGO-1.5-TURBO-DIESEL',
    'Ducato Chassi 2.3 2P', 'MB Accelo 815 MT 4x2 4.8 2P',
    'CITROEN JUMPY', 'FORD/CARGO 2422 CNL',
    '25 390 CTC 6X2', '17.190 CRM 4X2 4P', '24.280 CRM 6X2', '13.180 DRC 6X2',
    'Foton Ewonder'
  ];

  // Grupos e Subgrupos de Manutenção
  const gruposManutencao: Record<string, string[]> = {
    'Motor': [
      'Bomba de óleo',
      'Caixa de Direção',
      'Polia do Alternador',
      'Silencioso (intermediário e traseiro)',
      'Correia',
      'Radiador',
      'Turbina',
      'Bomba e Bico Injetor'
    ],
    'Transmissão': [
      'Articulação da caixa',
      'Coifa da Transmissão',
      'Cruzeta do Cardan',
      'Embreagem',
      'Homocinética',
      'Manga de eixo',
      'Retentor do diferencial/Caixa',
      'Retentor do Volante do Motor',
      'Rolamento de roda Diant. e Tras.',
      'Rolamento do Cardan',
      'Suporte da caixa de marcha'
    ],
    'Suspensão': [
      'Amortecedores Diant. e Tras.',
      'Batente do Amortecedor',
      'Bieleta (Suspensão)',
      'Braço auxiliar',
      'Bucha da barra estabilizadora',
      'Bucha do leque (Bandeja)',
      'Coifa da suspensão',
      'Coxim do amortecedor',
      'Cubo de roda',
      'Feixe de mola',
      'Pivô da suspensão',
      'Terminal da direção'
    ],
    'Freios': [
      'Cilindro de freio',
      'Disco de freio',
      'Fluido de freio',
      'Lona (sapata) de freio',
      'Pastilha de freio',
      'Tambor de freio'
    ],
    'Acessórios': [
      'Filtro de Ar condicionado',
      'Higienização do Ar condicionado',
      'Troca de baterias',
      'Bateria'
    ],
    'Pneu': [
      'Pneu e Válvula do Pneu',
      'Rolamento de roda Diant. e Tras.',
      'Pneus'
    ],
    'Elétrica': [
      'Pane elétrica',
      'Sistema elétrico',
      'Alternador',
      'Motor de partida'
    ],
    'Revisão': [
      'Revisão geral',
      'Troca de óleo e filtros',
      'Revisão freio e óleo',
      'Revisão/Troca de óleo/freios'
    ]
  };

  // Mutation para atualizar dados em manutenção
  const updateDadoMutation = useMutation({
    mutationFn: async (data: Partial<Dado> & { id: number }) => {
      const res = await apiRequest('PUT', `/api/indicadores/dados/${data.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Registro atualizado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/indicadores/dados'] });
      setEditDialogOpen(false);
      setEditingDado(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  const handleEditDado = (dado: Dado) => {
    setEditingDado({ ...dado });
    setEditDialogOpen(true);
  };

  const handleSaveDado = () => {
    if (editingDado) {
      updateDadoMutation.mutate(editingDado);
    }
  };

  // Mutation para criar nova manutenção
  const createDadoMutation = useMutation({
    mutationFn: async (data: Partial<Dado> & { pecas?: Array<{nome: string, valor: number}> }) => {
      const res = await apiRequest('POST', '/api/indicadores/dados', {
        ...data,
        upload_id: currentUploadId
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Nova manutenção registrada!' });
      queryClient.invalidateQueries({ queryKey: ['/api/indicadores/dados'] });
      queryClient.invalidateQueries({ queryKey: ['/api/indicadores/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/indicadores/pecas/analise'] });
      setNewDadoDialogOpen(false);
      setNewDado({
        placa: '',
        modelo: '',
        status: 'Em Manutenção',
        oficina_debito: '',
        km: 0,
        relato: '',
        data_agenda: new Date().toISOString().split('T')[0],
        focal: '',
        atendimento: ''
      });
      setNewPecas([{nome: '', valor: 0}]);
      setSelectedGrupo('');
      setSelectedSubgrupo('');
      setSelectedProjectId(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  const addPeca = () => {
    setNewPecas([...newPecas, {nome: '', valor: 0}]);
  };

  const removePeca = (index: number) => {
    if (newPecas.length > 1) {
      setNewPecas(newPecas.filter((_, i) => i !== index));
    }
  };

  const updatePeca = (index: number, field: 'nome' | 'valor', value: string | number) => {
    const updated = [...newPecas];
    if (field === 'valor') {
      updated[index][field] = typeof value === 'string' ? parseFloat(value) || 0 : value;
    } else {
      updated[index][field] = value as string;
    }
    setNewPecas(updated);
  };

  const calcularTotalPecas = () => {
    return newPecas.reduce((sum, p) => sum + (p.valor || 0), 0);
  };

  const handleCreateDado = async () => {
    if (!newDado.placa) {
      toast({ title: 'Erro', description: 'Placa é obrigatória', variant: 'destructive' });
      return;
    }
    const pecasValidas = newPecas.filter(p => p.nome.trim() !== '');
    
    // Montar descrição com grupo e subgrupo
    let descricaoCompleta = '';
    if (selectedGrupo) {
      descricaoCompleta = `[${selectedGrupo}]`;
      if (selectedSubgrupo) {
        descricaoCompleta += ` ${selectedSubgrupo}`;
      }
    }
    if (newDado.relato) {
      descricaoCompleta = descricaoCompleta 
        ? `${descricaoCompleta} - ${newDado.relato}`
        : newDado.relato;
    }

    // Se o modelo foi selecionado para um veículo sem modelo, atualizar o veículo
    const selectedVehicle = vehicles.find(v => v.plate === newDado.placa);
    if (selectedVehicle && newDado.modelo && (!selectedVehicle.model || selectedVehicle.model === 'Não informado')) {
      try {
        await fetch(`/api/vehicles/${selectedVehicle.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: newDado.modelo }),
          credentials: 'include'
        });
        queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
        toast({ title: 'Sucesso', description: `Modelo do veículo ${newDado.placa} atualizado para ${newDado.modelo}` });
      } catch (error) {
        console.error('Erro ao atualizar modelo do veículo:', error);
      }
    }

    createDadoMutation.mutate({
      ...newDado,
      relato: descricaoCompleta || newDado.relato,
      grupo: selectedGrupo,
      subgrupo: selectedSubgrupo,
      pecas: pecasValidas
    } as any);
  };

  // Buscar uploads
  const { data: uploadsData, isLoading: uploadsLoading } = useQuery<{uploads: UploadRecord[]}>({
    queryKey: ['/api/indicadores/uploads'],
  });

  const uploads = uploadsData?.uploads || [];
  const latestUpload = uploads.length > 0 ? uploads[0] : null;
  const currentUploadId = selectedUploadId || latestUpload?.id || 0;

  // Buscar estatísticas
  const { data: statsData } = useQuery<{stats: Stats}>({
    queryKey: ['/api/indicadores/stats', { uploadId: currentUploadId }],
    enabled: currentUploadId > 0,
  });

  const stats = statsData?.stats;

  // Buscar dados de peças
  const { data: pecasData } = useQuery<{pecas: Peca[]}>({
    queryKey: ['/api/indicadores/pecas', { uploadId: currentUploadId }],
    enabled: currentUploadId > 0,
  });

  const pecas = pecasData?.pecas || [];

  // Buscar dados em manutenção
  const { data: dadosData } = useQuery<{dados: Dado[]}>({
    queryKey: ['/api/indicadores/dados', { uploadId: currentUploadId }],
    enabled: currentUploadId > 0,
  });

  const dados = dadosData?.dados || [];

  // Buscar histórico liberado
  const { data: liberadoData } = useQuery<{liberado: Liberado[]}>({
    queryKey: ['/api/indicadores/liberado', { uploadId: currentUploadId, tipoManutencao: filterTipoManutencao, placa: filterPlaca }],
    enabled: currentUploadId > 0,
  });

  const liberado = liberadoData?.liberado || [];

  // Buscar dashboard de manutenções histórico
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<DashboardData | null>({
    queryKey: ['/api/indicadores/manutencoes/dashboard', { base: dashboardBase }],
    queryFn: async (): Promise<DashboardData | null> => {
      const params = new URLSearchParams();
      if (dashboardBase) params.append('base', dashboardBase);
      const res = await fetch(`/api/indicadores/manutencoes/dashboard?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        return {
          totais: data.totais,
          porTipo: data.porTipo || [],
          porOficina: data.porOficina || [],
          porBase: data.porBase || [],
          rankingPlacas: data.rankingPlacas || [],
          evolucaoMensal: data.evolucaoMensal || [],
          porStatus: data.porStatus || []
        } as DashboardData;
      }
      return null;
    }
  });

  // Buscar bases disponíveis
  const { data: basesData } = useQuery<{success: boolean, bases: string[]}>({
    queryKey: ['/api/indicadores/manutencoes/bases'],
    queryFn: async () => {
      const res = await fetch('/api/indicadores/manutencoes/bases', { credentials: 'include' });
      return res.json();
    }
  });

  // Buscar estatísticas de distribuição de veículos
  const { data: veiculosStatsData } = useQuery<{success: boolean, data: typeof veiculosStats}>({
    queryKey: ['/api/veiculos/stats/distribuicao'],
    queryFn: async () => {
      const res = await fetch('/api/veiculos/stats/distribuicao', { credentials: 'include' });
      return res.json();
    }
  });

  const veiculosDistribuicao = veiculosStatsData?.data;

  // Buscar veículos cadastrados
  const { data: vehiclesData } = useQuery<Array<{id: number, plate: string, model: string}>>({
    queryKey: ['/api/vehicles'],
  });

  const vehicles = vehiclesData || [];

  // Buscar análise de peças por tipo e modelo
  const { data: pecasAnaliseData } = useQuery<{success: boolean} & PecasAnaliseData>({
    queryKey: ['/api/indicadores/pecas/analise'],
    queryFn: async () => {
      const res = await fetch('/api/indicadores/pecas/analise', { credentials: 'include' });
      return res.json();
    }
  });

  const pecasAnalise = pecasAnaliseData;

  // Buscar todos os projetos do sistema
  const { data: projectsData } = useQuery<{success: boolean, data: Array<{id: number, name: string}>}>({
    queryKey: ['/api/projects'],
  });

  const allProjects = projectsData?.data || [];

  // Buscar bases filtradas pelo projeto selecionado
  const { data: allBasesData } = useQuery<{success: boolean, data: Array<{id: number, name: string, project_id: number}>}>({
    queryKey: ['/api/bases', { project_id: selectedProjectId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedProjectId) params.append('project_id', selectedProjectId.toString());
      const res = await fetch(`/api/bases?${params}`, { credentials: 'include' });
      return res.json();
    }
  });

  const allBases = allBasesData?.data || [];

  // Buscar histórico por placa
  const { data: placaData, isLoading: placaLoading } = useQuery({
    queryKey: ['/api/indicadores/manutencoes/placa', searchPlaca],
    queryFn: async () => {
      if (!searchPlaca) return null;
      const res = await fetch(`/api/indicadores/manutencoes/placa/${encodeURIComponent(searchPlaca)}`, { credentials: 'include' });
      const data = await res.json();
      return data;
    },
    enabled: !!searchPlaca && searchPlaca.length >= 3,
  });

  // Buscar manutenções finalizadas
  const { data: finalizadasData, isLoading: finalizadasLoading, refetch: refetchFinalizadas } = useQuery<{success: boolean, data: any[], total: number}>({
    queryKey: ['/api/indicadores/finalizadas', { placa: finalizadasSearchPlaca, tipo: finalizadasFilterTipo, oficina: finalizadasFilterOficina, operacao: finalizadasFilterOperacao, mes: finalizadasFilterMes }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (finalizadasSearchPlaca) params.append('placa', finalizadasSearchPlaca);
      if (finalizadasFilterTipo) params.append('tipo_manutencao', finalizadasFilterTipo);
      if (finalizadasFilterOficina) params.append('oficina', finalizadasFilterOficina);
      if (finalizadasFilterOperacao) params.append('operacao', finalizadasFilterOperacao);
      if (finalizadasFilterMes) params.append('mes', finalizadasFilterMes);
      const res = await fetch(`/api/indicadores/finalizadas?${params}`, { credentials: 'include' });
      return res.json();
    }
  });

  // Buscar estatísticas de manutenções finalizadas
  const { data: finalizadasStatsData } = useQuery<{success: boolean, totais: any, porTipo: any[], porOficina: any[], porOperacao: any[], porPrazo: any[], meses: string[]}>({
    queryKey: ['/api/indicadores/finalizadas/stats'],
    queryFn: async () => {
      const res = await fetch('/api/indicadores/finalizadas/stats', { credentials: 'include' });
      return res.json();
    }
  });

  // Buscar histórico de uma placa específica nas finalizadas
  const { data: historicoPlacaData, isLoading: historicoPlacaLoading } = useQuery<{success: boolean, data: any[], stats: any, total: number}>({
    queryKey: ['/api/indicadores/finalizadas/historico', selectedPlacaHistorico],
    queryFn: async () => {
      const res = await fetch(`/api/indicadores/finalizadas/historico/${encodeURIComponent(selectedPlacaHistorico)}`, { credentials: 'include' });
      return res.json();
    },
    enabled: !!selectedPlacaHistorico && showHistoricoPlaca,
  });

  // Buscar dados do BIP (rastreamento de veículos)
  const { data: bipData, isLoading: bipLoading } = useQuery<{success: boolean, data: BipData[], stats: {total: number, parados: number, emOperacao: number, mediasDiasSemBip: number, totalDiasParados: number, variacaoDiasParados: number}}>({
    queryKey: ['/api/indicadores/bip'],
    queryFn: async () => {
      const res = await fetch('/api/indicadores/bip', { credentials: 'include' });
      return res.json();
    }
  });

  // Mutation para atualizar BIP
  const updateBipMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: typeof bipEditData }) => {
      const response = await fetch(`/api/indicadores/bip/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso!',
        description: 'Registro de BIP atualizado com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/indicadores/bip'] });
      setEditingBip(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Função para abrir modal de edição BIP
  const handleEditBip = (item: BipData) => {
    setEditingBip(item);
    setBipEditData({
      ultimo_bip: item.ultimo_bip ? new Date(item.ultimo_bip).toISOString().split('T')[0] : '',
      ml_bip: item.ml_bip ? new Date(item.ml_bip).toISOString().split('T')[0] : '',
      dds_bip: item.dds_bip ? new Date(item.dds_bip).toISOString().split('T')[0] : '',
      motivo: item.motivo || '',
      observacao: item.observacao || '',
      base_reserva: item.base_reserva || ''
    });
  };

  // Função para salvar edição BIP
  const handleSaveBip = () => {
    if (editingBip) {
      updateBipMutation.mutate({ id: editingBip.id, data: bipEditData });
    }
  };

  // Query para buscar veículos para a aba Cadastro (tabela veiculos)
  const { data: cadastroVehiclesData, isLoading: cadastroVehiclesLoading, refetch: refetchVeiculos } = useQuery<{success: boolean, data: Array<{id: number, placa: string, modelo: string, tipo_posse: string, status: string, categoria: string, locadora: string, ano: number, chassi: string, renavam: string, cidade_veiculo: string, estado: string, cor: string, operacao: string, base: string, data_inicio_operacao: string}>}>({
    queryKey: ['/api/veiculos/listar'],
    queryFn: async () => {
      const res = await fetch('/api/veiculos/listar', { credentials: 'include' });
      return res.json();
    }
  });

  // Função de upload de planilha de veículos
  const handleVeiculosUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingVeiculos(true);
    setUploadProgress(0);
    setImportReport(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/veiculos/importar', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (result.success) {
        setImportReport({
          total: result.total,
          importados: result.importados,
          atualizados: result.atualizados,
          ignorados: result.ignorados,
          erros: result.erros || []
        });
        toast({
          title: 'Importação concluída!',
          description: `${result.importados} novos, ${result.atualizados} atualizados`,
        });
        refetchVeiculos();
      } else {
        toast({
          title: 'Erro na importação',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploadingVeiculos(false);
      event.target.value = '';
    }
  };

  // Mutation para atualizar veículo (tabela veiculos)
  const updateVeiculoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const response = await fetch(`/api/veiculos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso!',
        description: 'Veículo atualizado com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/veiculos/listar'] });
      setEditingVehicle(null);
      setShowVeiculoDetails(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para criar veículo
  const createVehicleMutation = useMutation({
    mutationFn: async (data: { plate: string, model: string, ownership: string }) => {
      const response = await fetch('/api/indicadores/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar veículo');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso!',
        description: 'Veículo cadastrado com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/indicadores/vehicles'] });
      setShowNewVehicleModal(false);
      setNewVehicle({ plate: '', model: '', ownership: 'Murici' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para upload original
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/indicadores/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao fazer upload');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Upload realizado!',
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/indicadores'] });
      setSelectedFile(null);
      setSelectedUploadId(data.uploadId);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro no upload',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para upload de manutenções histórico
  const uploadManutencoesHistoricoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/indicadores/manutencoes/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao fazer upload');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Importação concluída!',
        description: `${data.importados} registros importados, ${data.placasAtualizadas} placas atualizadas.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/indicadores/manutencoes/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/indicadores/manutencoes/bases'] });
      queryClient.invalidateQueries({ queryKey: ['/api/indicadores/manutencoes/placa'] });
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro na importação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleUploadHistorico = () => {
    if (selectedFile) {
      uploadManutencoesHistoricoMutation.mutate(selectedFile);
    }
  };

  // Função para upload de manutenções finalizadas
  const handleFinalizadasUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFinalizadas(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/indicadores/finalizadas/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Importação concluída!',
          description: `${data.imported} registros importados, ${data.errors} erros.`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/indicadores/finalizadas'] });
        queryClient.invalidateQueries({ queryKey: ['/api/indicadores/finalizadas/stats'] });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: 'Erro na importação',
        description: error instanceof Error ? error.message : 'Erro ao processar arquivo',
        variant: 'destructive',
      });
    } finally {
      setUploadingFinalizadas(false);
      event.target.value = '';
    }
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime()) || d.getFullYear() < 1900) return '-';
      return d.toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <FileBarChart className="mr-2 h-8 w-8" />
                Indicadores de Manutenção
              </h1>
              <p className="text-muted-foreground mt-1">
                Análise completa de estoque de peças, manutenções e histórico
              </p>
            </div>
          </div>

          {/* Estatísticas Gerais */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Em Manutenção
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_em_manutencao}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.veiculos_unicos_manutencao} veículos únicos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Liberado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_liberado}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.veiculos_unicos_liberado} veículos únicos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Preventivas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.preventivas}</div>
                  <p className="text-xs text-muted-foreground mt-1">Manutenções</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Corretivas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.corretivas}</div>
                  <p className="text-xs text-muted-foreground mt-1">Manutenções</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Total Dias Parados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                    {(bipData?.stats?.totalDiasParados || 0).toLocaleString('pt-BR')}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {(bipData?.stats?.variacaoDiasParados || 0) > 0 ? (
                      <>
                        <TrendingUp className="h-3 w-3 text-red-500" />
                        <span className="text-xs text-red-500 font-medium">
                          +{bipData?.stats?.variacaoDiasParados} vs ontem
                        </span>
                      </>
                    ) : (bipData?.stats?.variacaoDiasParados || 0) < 0 ? (
                      <>
                        <TrendingUp className="h-3 w-3 text-green-500 rotate-180" />
                        <span className="text-xs text-green-500 font-medium">
                          {bipData?.stats?.variacaoDiasParados} vs ontem
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        veículos parados
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="upload" data-testid="tab-upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="pecas" data-testid="tab-pecas">
                <Package className="h-4 w-4 mr-2" />
                Peças
              </TabsTrigger>
              <TabsTrigger value="dados" data-testid="tab-dados">
                <Wrench className="h-4 w-4 mr-2" />
                Em Manutenção
              </TabsTrigger>
              <TabsTrigger value="finalizadas" data-testid="tab-finalizadas">
                <History className="h-4 w-4 mr-2" />
                Finalizadas
              </TabsTrigger>
              <TabsTrigger value="bip" data-testid="tab-bip">
                <Radio className="h-4 w-4 mr-2" />
                BIP
              </TabsTrigger>
              <TabsTrigger value="cadastro" data-testid="tab-cadastro">
                <Truck className="h-4 w-4 mr-2" />
                Cadastro
              </TabsTrigger>
              <TabsTrigger value="dashboards" data-testid="tab-dashboards">
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboards
              </TabsTrigger>
            </TabsList>

            {/* Aba de Upload */}
            <TabsContent value="upload">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload de Planilha de Indicadores</CardTitle>
                    <CardDescription>
                      Envie a planilha Excel com dados de Peças, Dados e Liberado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="file">Arquivo Excel (.xlsx)</Label>
                        <Input
                          id="file"
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileChange}
                          disabled={uploadMutation.isPending}
                          data-testid="input-file-indicadores"
                        />
                        {selectedFile && (
                          <p className="text-sm text-muted-foreground">
                            Arquivo selecionado: {selectedFile.name}
                          </p>
                        )}
                      </div>

                      <Button
                        onClick={handleUpload}
                        disabled={!selectedFile || uploadMutation.isPending}
                        className="w-full"
                        data-testid="button-upload-indicadores"
                      >
                        {uploadMutation.isPending ? (
                          <>Processando...</>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Enviar e Processar
                          </>
                        )}
                      </Button>

                      {uploads.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-lg font-semibold mb-2">Histórico de Uploads</h3>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {uploads.map((upload) => (
                              <div
                                key={upload.id}
                                className={`p-3 border rounded-lg cursor-pointer hover:bg-accent ${
                                  currentUploadId === upload.id ? 'bg-accent border-primary' : ''
                                }`}
                                onClick={() => setSelectedUploadId(upload.id)}
                                data-testid={`upload-item-${upload.id}`}
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-medium">{upload.filename}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {formatDate(upload.upload_date)} - {upload.total_records} registros
                                    </p>
                                  </div>
                                  {currentUploadId === upload.id && (
                                    <Badge variant="default">Selecionado</Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Upload de Histórico de Manutenções</CardTitle>
                    <CardDescription>
                      Planilha com: Placa, Data, Tipo, Descrição, Valor, Status, Oficina, KM, Base
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="file-historico">Arquivo Excel (.xlsx)</Label>
                        <Input
                          id="file-historico"
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileChange}
                          disabled={uploadManutencoesHistoricoMutation.isPending}
                          data-testid="input-file-historico"
                        />
                      </div>

                      <Button
                        onClick={handleUploadHistorico}
                        disabled={!selectedFile || uploadManutencoesHistoricoMutation.isPending}
                        className="w-full"
                        variant="secondary"
                        data-testid="button-upload-historico"
                      >
                        {uploadManutencoesHistoricoMutation.isPending ? (
                          <>Importando...</>
                        ) : (
                          <>
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Importar Histórico
                          </>
                        )}
                      </Button>

                      <div className="p-4 bg-muted rounded-lg text-sm">
                        <p className="font-medium mb-2">Colunas esperadas:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>Placa</li>
                          <li>Data da Manutenção</li>
                          <li>Tipo de Manutenção</li>
                          <li>Descrição</li>
                          <li>Valor</li>
                          <li>Status</li>
                          <li>Oficina</li>
                          <li>KM</li>
                          <li>Data de Entrada</li>
                          <li>Data de Saída</li>
                          <li>Tempo de Manutenção (dias)</li>
                          <li>Base</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Aba de Peças */}
            <TabsContent value="pecas">
              <div className="space-y-6">
                {/* Top Peças/Serviços Geral */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5" />
                      Peças/Serviços Mais Utilizados
                    </CardTitle>
                    <CardDescription>
                      Ranking geral de peças e serviços mais frequentes nas manutenções
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pecasAnalise?.topGeral && pecasAnalise.topGeral.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          {pecasAnalise.topGeral.slice(0, 8).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-lg w-8 text-center text-primary">{idx + 1}º</span>
                                <span className="font-medium truncate max-w-[200px]">{item.peca}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <Badge variant="secondary">{item.quantidade}x</Badge>
                                {item.custo_total > 0 && (
                                  <span className="text-sm text-muted-foreground">{formatCurrency(item.custo_total)}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pecasAnalise.topGeral.slice(0, 8)} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis dataKey="peca" type="category" width={120} tick={{fontSize: 11}} />
                              <Tooltip />
                              <Bar dataKey="quantidade" fill="#2563eb" name="Quantidade" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">
                          Nenhum dado de manutenção disponível para análise.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Por Tipo de Manutenção */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Preventivas */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        Manutenções Preventivas
                      </CardTitle>
                      <CardDescription>Peças mais usadas em manutenções preventivas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {pecasAnalise?.preventivas && pecasAnalise.preventivas.length > 0 ? (
                        <div className="space-y-2">
                          {pecasAnalise.preventivas.slice(0, 6).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 border-b">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-green-600">{idx + 1}.</span>
                                <span className="text-sm truncate max-w-[180px]">{item.peca}</span>
                              </div>
                              <Badge variant="outline" className="bg-green-50">{item.quantidade}x</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Corretivas */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-orange-600">
                        <AlertTriangle className="h-5 w-5" />
                        Manutenções Corretivas
                      </CardTitle>
                      <CardDescription>Peças mais usadas em manutenções corretivas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {pecasAnalise?.corretivas && pecasAnalise.corretivas.length > 0 ? (
                        <div className="space-y-2">
                          {pecasAnalise.corretivas.slice(0, 6).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 border-b">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-orange-600">{idx + 1}.</span>
                                <span className="text-sm truncate max-w-[180px]">{item.peca}</span>
                              </div>
                              <Badge variant="outline" className="bg-orange-50">{item.quantidade}x</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Por Modelo de Veículo */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Car className="h-5 w-5" />
                          Peças por Modelo de Veículo
                        </CardTitle>
                        <CardDescription>Análise de peças mais utilizadas por modelo</CardDescription>
                      </div>
                      <div className="w-64">
                        <Select value={selectedModeloPeca} onValueChange={setSelectedModeloPeca}>
                          <SelectTrigger data-testid="select-modelo-peca">
                            <SelectValue placeholder="Selecione um modelo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Todos os modelos</SelectItem>
                            {pecasAnalise?.modelos?.map((modelo) => (
                              <SelectItem key={modelo} value={modelo}>{modelo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {pecasAnalise?.porModelo && Object.keys(pecasAnalise.porModelo).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Object.entries(pecasAnalise.porModelo)
                          .filter(([modelo]) => !selectedModeloPeca || modelo === selectedModeloPeca)
                          .map(([modelo, pecasModelo]) => (
                            <Card key={modelo} className="border-2">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                  <Car className="h-4 w-4 text-primary" />
                                  {modelo}
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <div className="space-y-1">
                                  {pecasModelo.slice(0, 5).map((peca, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-dashed">
                                      <span className="truncate max-w-[140px]">{peca.peca}</span>
                                      <Badge variant="secondary" className="ml-2">{peca.quantidade}x</Badge>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Car className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">
                          Nenhum dado disponível por modelo.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Aba de Dados (Em Manutenção) */}
            <TabsContent value="dados">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Veículos em Manutenção</CardTitle>
                    <CardDescription>
                      Lista de veículos atualmente em manutenção
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => setNewDadoDialogOpen(true)}
                    data-testid="btn-nova-manutencao"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Manutenção
                  </Button>
                </CardHeader>
                <CardContent>
                  {dados.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Placa</TableHead>
                            <TableHead>Modelo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Oficina</TableHead>
                            <TableHead>KM</TableHead>
                            <TableHead>Relato</TableHead>
                            <TableHead>Data Agenda</TableHead>
                            <TableHead>Focal</TableHead>
                            <TableHead>Atendimento</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dados.map((dado) => (
                            <TableRow key={dado.id}>
                              <TableCell className="font-medium">{dado.placa}</TableCell>
                              <TableCell>{dado.modelo || '-'}</TableCell>
                              <TableCell>
                                <Badge variant={
                                  dado.status === 'Liberado' ? 'default' :
                                  dado.status === 'Em Orçamento' ? 'secondary' :
                                  dado.status === 'Aguardando Peça' ? 'outline' :
                                  'destructive'
                                }>
                                  {dado.status || 'Em Manutenção'}
                                </Badge>
                              </TableCell>
                              <TableCell>{dado.oficina_debito || '-'}</TableCell>
                              <TableCell>{dado.km ? dado.km.toLocaleString() : '-'}</TableCell>
                              <TableCell className="max-w-xs truncate" title={dado.relato}>{dado.relato || '-'}</TableCell>
                              <TableCell>{formatDate(dado.data_agenda)}</TableCell>
                              <TableCell>{dado.focal || '-'}</TableCell>
                              <TableCell>{dado.atendimento || '-'}</TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditDado(dado)}
                                  data-testid={`btn-edit-dado-${dado.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Wrench className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground">
                        Nenhum veículo em manutenção no momento.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba de Finalizadas */}
            <TabsContent value="finalizadas">
              <div className="space-y-6">
                {/* Cards de estatísticas */}
                {finalizadasStatsData?.totais && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Total Manutenções
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {Number(finalizadasStatsData.totais.total || 0).toLocaleString('pt-BR')}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Veículos Únicos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {Number(finalizadasStatsData.totais.veiculos_unicos || 0).toLocaleString('pt-BR')}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Custo Total
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                          {formatCurrency(Number(finalizadasStatsData.totais.custo_total || 0))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Dias Parados Total
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {Number(finalizadasStatsData.totais.dias_parados_total || 0).toLocaleString('pt-BR')}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Média Dias
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {Number(finalizadasStatsData.totais.media_dias || 0).toFixed(1)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Upload e Filtros */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Manutenções Finalizadas
                    </CardTitle>
                    <CardDescription>
                      Histórico completo de manutenções finalizadas com análise por placa
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Upload de arquivo */}
                      <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex-1">
                          <Label htmlFor="finalizadas-upload" className="text-sm font-medium">
                            Importar Planilha de Manutenções Finalizadas
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Arquivo Excel com dados de manutenções concluídas
                          </p>
                        </div>
                        <div>
                          <Input
                            id="finalizadas-upload"
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFinalizadasUpload}
                            disabled={uploadingFinalizadas}
                            className="w-64"
                            data-testid="input-finalizadas-upload"
                          />
                        </div>
                        {uploadingFinalizadas && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 animate-spin" />
                            Processando...
                          </div>
                        )}
                      </div>

                      {/* Filtros */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="space-y-2">
                          <Label>Buscar Placa</Label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Placa..."
                              value={finalizadasSearchPlaca}
                              onChange={(e) => setFinalizadasSearchPlaca(e.target.value.toUpperCase())}
                              className="pl-10"
                              data-testid="input-finalizadas-placa"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo Manutenção</Label>
                          <Select value={finalizadasFilterTipo} onValueChange={setFinalizadasFilterTipo}>
                            <SelectTrigger data-testid="select-finalizadas-tipo">
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Todos</SelectItem>
                              <SelectItem value="Preventiva">Preventiva</SelectItem>
                              <SelectItem value="Corretiva">Corretiva</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Oficina</Label>
                          <Input
                            placeholder="Filtrar oficina..."
                            value={finalizadasFilterOficina}
                            onChange={(e) => setFinalizadasFilterOficina(e.target.value)}
                            data-testid="input-finalizadas-oficina"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Operação</Label>
                          <Select value={finalizadasFilterOperacao} onValueChange={setFinalizadasFilterOperacao}>
                            <SelectTrigger data-testid="select-finalizadas-operacao">
                              <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Todas</SelectItem>
                              {finalizadasStatsData?.porOperacao?.map((op: any) => (
                                <SelectItem key={op.operacao} value={op.operacao}>
                                  {op.operacao} ({op.quantidade})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Mês</Label>
                          <Select value={finalizadasFilterMes} onValueChange={setFinalizadasFilterMes}>
                            <SelectTrigger data-testid="select-finalizadas-mes">
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Todos os meses</SelectItem>
                              {finalizadasStatsData?.meses?.map((mes: string) => (
                                <SelectItem key={mes} value={mes}>{mes}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Tabela de dados */}
                      {finalizadasLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : finalizadasData?.data && finalizadasData.data.length > 0 ? (
                        <div className="overflow-x-auto">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-muted-foreground">
                              {finalizadasData.total.toLocaleString('pt-BR')} registros encontrados
                            </span>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Placa</TableHead>
                                <TableHead>Modelo</TableHead>
                                <TableHead>Oficina</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>D+Manut</TableHead>
                                <TableHead>Prazo</TableHead>
                                <TableHead>Data Agenda</TableHead>
                                <TableHead>Liberado</TableHead>
                                <TableHead className="max-w-xs">Relato</TableHead>
                                <TableHead>Focal</TableHead>
                                <TableHead>Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {finalizadasData.data.slice(0, 100).map((item: any) => (
                                <TableRow key={item.id} className="hover:bg-muted/50">
                                  <TableCell className="font-mono font-bold text-primary">{item.placa}</TableCell>
                                  <TableCell className="max-w-[120px] truncate text-sm" title={item.modelo}>{item.modelo || '-'}</TableCell>
                                  <TableCell className="max-w-[120px] truncate text-sm" title={item.oficina}>{item.oficina || '-'}</TableCell>
                                  <TableCell>
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                                      item.tipo_manutencao === 'Preventiva' 
                                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                        : 'bg-orange-100 text-orange-700 border border-orange-200'
                                    }`}>
                                      <Wrench className="h-3 w-3" />
                                      {item.tipo_manutencao || '-'}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                                      item.status === 'Em Manutenção' 
                                        ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                        : item.status === 'Liberado'
                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                                    }`}>
                                      {item.status === 'Liberado' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                      {item.status || '-'}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                                      (item.dias_manutencao || 0) > 7 
                                        ? 'bg-red-100 text-red-700' 
                                        : (item.dias_manutencao || 0) > 3
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-green-100 text-green-700'
                                    }`}>
                                      {item.dias_manutencao || 0}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                                      item.status2 === 'Fora do Prazo' 
                                        ? 'bg-red-100 text-red-700 border border-red-200' 
                                        : 'bg-green-100 text-green-700 border border-green-200'
                                    }`}>
                                      {item.status2 === 'Fora do Prazo' ? <AlertCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                                      {item.status2 || '-'}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{formatDate(item.data_agenda)}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{formatDate(item.data_liberado)}</TableCell>
                                  <TableCell className="max-w-[200px] truncate text-sm" title={item.relato}>{item.relato || '-'}</TableCell>
                                  <TableCell className="text-sm">{item.focal || '-'}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => {
                                        setSelectedPlacaHistorico(item.placa);
                                        setShowHistoricoPlaca(true);
                                      }}
                                      data-testid={`btn-historico-${item.id}`}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {finalizadasData.data.length > 100 && (
                            <p className="text-sm text-muted-foreground text-center mt-4">
                              Mostrando 100 de {finalizadasData.total.toLocaleString('pt-BR')} registros. Use os filtros para refinar a busca.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <History className="mx-auto h-12 w-12 text-muted-foreground" />
                          <p className="mt-2 text-muted-foreground">
                            Nenhuma manutenção finalizada encontrada.
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Importe uma planilha Excel para começar.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Modal de Histórico por Placa */}
                <Dialog open={showHistoricoPlaca} onOpenChange={setShowHistoricoPlaca}>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Car className="h-5 w-5" />
                        Histórico de Manutenções - {selectedPlacaHistorico}
                      </DialogTitle>
                      <DialogDescription>
                        Todas as manutenções registradas para esta placa
                      </DialogDescription>
                    </DialogHeader>
                    
                    {historicoPlacaLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : historicoPlacaData?.data ? (
                      <div className="space-y-4">
                        {/* Estatísticas da placa */}
                        {historicoPlacaData.stats && (
                          <div className="grid grid-cols-4 gap-4">
                            <Card>
                              <CardContent className="pt-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold">
                                    {historicoPlacaData.stats.total_manutencoes}
                                  </div>
                                  <p className="text-sm text-muted-foreground">Manutenções</p>
                                </div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="pt-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-red-600">
                                    {formatCurrency(Number(historicoPlacaData.stats.custo_total || 0))}
                                  </div>
                                  <p className="text-sm text-muted-foreground">Custo Total</p>
                                </div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="pt-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold">
                                    {historicoPlacaData.stats.dias_parados_total}
                                  </div>
                                  <p className="text-sm text-muted-foreground">Dias Parados</p>
                                </div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="pt-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold">
                                    {Number(historicoPlacaData.stats.media_dias || 0).toFixed(1)}
                                  </div>
                                  <p className="text-sm text-muted-foreground">Média Dias</p>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}

                        {/* Lista de manutenções */}
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Oficina</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>D+Manut</TableHead>
                                <TableHead className="text-right">Custo</TableHead>
                                <TableHead>Relato</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {historicoPlacaData.data.map((item: any) => (
                                <TableRow key={item.id}>
                                  <TableCell>{formatDate(item.data_agenda)}</TableCell>
                                  <TableCell>{item.oficina || '-'}</TableCell>
                                  <TableCell>
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                                      item.tipo_manutencao === 'Preventiva' 
                                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                        : 'bg-orange-100 text-orange-700 border border-orange-200'
                                    }`}>
                                      <Wrench className="h-3 w-3" />
                                      {item.tipo_manutencao || '-'}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                                      item.status2 === 'Fora do Prazo' 
                                        ? 'bg-red-100 text-red-700 border border-red-200' 
                                        : 'bg-green-100 text-green-700 border border-green-200'
                                    }`}>
                                      {item.status2 === 'Fora do Prazo' ? <AlertCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                                      {item.status2 || '-'}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                                      (item.dias_manutencao || 0) > 7 
                                        ? 'bg-red-100 text-red-700' 
                                        : (item.dias_manutencao || 0) > 3
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-green-100 text-green-700'
                                    }`}>
                                      {item.dias_manutencao || 0}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {(item.valor_orcamento || item.valor_negociado) 
                                      ? formatCurrency(Number(item.valor_negociado || item.valor_orcamento || 0))
                                      : <span className="text-muted-foreground">-</span>
                                    }
                                  </TableCell>
                                  <TableCell className="max-w-xs truncate" title={item.relato}>{item.relato || '-'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">Nenhum histórico encontrado.</p>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>

            {/* Aba de BIP - Rastreamento de Veículos */}
            <TabsContent value="bip">
              <div className="space-y-6">
                {/* Cards de Resumo BIP */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        Total Veículos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{bipData?.stats?.total || 0}</div>
                      <p className="text-xs text-muted-foreground">registrados</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Veículos Parados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{bipData?.stats?.parados || 0}</div>
                      <p className="text-xs text-muted-foreground">sem BIP recente</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Em Operação
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{bipData?.stats?.emOperacao || 0}</div>
                      <p className="text-xs text-muted-foreground">com BIP ativo</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Média Dias Parado
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">
                        {(bipData?.stats?.mediasDiasSemBip || 0).toFixed(1)}
                      </div>
                      <p className="text-xs text-muted-foreground">dias sem BIP</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Total Dias Parados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                        {(bipData?.stats?.totalDiasParados || 0).toLocaleString('pt-BR')}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {(bipData?.stats?.variacaoDiasParados || 0) > 0 ? (
                          <>
                            <TrendingUp className="h-3 w-3 text-red-500" />
                            <span className="text-xs text-red-500 font-medium">
                              +{bipData?.stats?.variacaoDiasParados} vs ontem
                            </span>
                          </>
                        ) : (bipData?.stats?.variacaoDiasParados || 0) < 0 ? (
                          <>
                            <TrendingUp className="h-3 w-3 text-green-500 rotate-180" />
                            <span className="text-xs text-green-500 font-medium">
                              {bipData?.stats?.variacaoDiasParados} vs ontem
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Sem variação
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabela de BIP */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Radio className="h-5 w-5" />
                          Histórico de BIP por Veículo
                        </CardTitle>
                        <CardDescription>
                          Rastreamento de dias de operação e tempo parado de cada veículo
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2 items-end">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Placa</label>
                          <Input 
                            placeholder="Buscar placa..." 
                            value={bipSearchPlaca}
                            onChange={(e) => setBipSearchPlaca(e.target.value.toUpperCase())}
                            className="w-32"
                            data-testid="input-bip-search-placa"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Motivo</label>
                          <Select value={bipFilterMotivo} onValueChange={setBipFilterMotivo}>
                            <SelectTrigger className="w-36" data-testid="select-bip-motivo">
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Todos</SelectItem>
                              <SelectItem value="Manutenção">Manutenção</SelectItem>
                              <SelectItem value="Reserva">Reserva</SelectItem>
                              <SelectItem value="Sinistro">Sinistro</SelectItem>
                              <SelectItem value="Outros">Outros</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Data Início</label>
                          <Input 
                            type="date"
                            value={bipDateStart}
                            onChange={(e) => setBipDateStart(e.target.value)}
                            className="w-36"
                            data-testid="input-bip-date-start"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Data Fim</label>
                          <Input 
                            type="date"
                            value={bipDateEnd}
                            onChange={(e) => setBipDateEnd(e.target.value)}
                            className="w-36"
                            data-testid="input-bip-date-end"
                          />
                        </div>
                        {(bipSearchPlaca || bipFilterMotivo || bipDateStart || bipDateEnd) && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setBipSearchPlaca('');
                              setBipFilterMotivo('');
                              setBipDateStart('');
                              setBipDateEnd('');
                            }}
                            data-testid="button-bip-clear-filters"
                          >
                            Limpar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {bipLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : bipData?.data && bipData.data.length > 0 ? (
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="font-bold">Placa</TableHead>
                              <TableHead>Último BIP</TableHead>
                              <TableHead>ML BIP</TableHead>
                              <TableHead>DDS BIP</TableHead>
                              <TableHead className="text-center">Dias Parado</TableHead>
                              <TableHead className="text-center">Dias Rodados</TableHead>
                              <TableHead>Motivo</TableHead>
                              <TableHead>Base Reserva</TableHead>
                              <TableHead>Observação</TableHead>
                              <TableHead className="text-center">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bipData.data
                              .filter((item) => {
                                const matchPlaca = !bipSearchPlaca || item.placa?.toUpperCase().includes(bipSearchPlaca);
                                const matchMotivo = !bipFilterMotivo || item.motivo?.includes(bipFilterMotivo);
                                
                                let matchDateStart = true;
                                let matchDateEnd = true;
                                
                                if (bipDateStart && item.ultimo_bip) {
                                  const itemDate = new Date(item.ultimo_bip);
                                  const startDate = new Date(bipDateStart);
                                  matchDateStart = itemDate >= startDate;
                                }
                                
                                if (bipDateEnd && item.ultimo_bip) {
                                  const itemDate = new Date(item.ultimo_bip);
                                  const endDate = new Date(bipDateEnd);
                                  endDate.setHours(23, 59, 59, 999);
                                  matchDateEnd = itemDate <= endDate;
                                }
                                
                                return matchPlaca && matchMotivo && matchDateStart && matchDateEnd;
                              })
                              .sort((a, b) => (b.dias_sem_bip || 0) - (a.dias_sem_bip || 0))
                              .slice(0, 100)
                              .map((item) => {
                                const diasParado = item.dias_sem_bip || 0;
                                const diasRodados = Math.max(0, 30 - diasParado);
                                
                                let bgColor = 'bg-green-100 text-green-800';
                                if (diasParado > 30) {
                                  bgColor = 'bg-red-100 text-red-800';
                                } else if (diasParado > 7) {
                                  bgColor = 'bg-orange-100 text-orange-800';
                                }
                                
                                return (
                                  <TableRow key={item.id} data-testid={`bip-row-${item.id}`}>
                                    <TableCell className="font-bold">{item.placa}</TableCell>
                                    <TableCell>{formatDate(item.ultimo_bip)}</TableCell>
                                    <TableCell>{formatDate(item.ml_bip)}</TableCell>
                                    <TableCell>{formatDate(item.dds_bip)}</TableCell>
                                    <TableCell className="text-center">
                                      <span className={`inline-flex items-center justify-center min-w-[60px] px-3 py-1 rounded-full text-sm font-semibold ${bgColor}`}>
                                        {diasParado}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <span className="inline-flex items-center justify-center min-w-[60px] px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                        {diasRodados}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{item.motivo || '-'}</Badge>
                                    </TableCell>
                                    <TableCell>{item.base_reserva || '-'}</TableCell>
                                    <TableCell className="max-w-xs truncate" title={item.observacao || ''}>
                                      {item.observacao || '-'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditBip(item)}
                                        data-testid={`button-edit-bip-${item.id}`}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Radio className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">
                          Nenhum registro de BIP encontrado.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Gráfico de Distribuição por Dias Parado */}
                {bipData?.data && bipData.data.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Distribuição por Dias Parado</CardTitle>
                      <CardDescription>Quantidade de veículos por faixa de dias sem BIP</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={(() => {
                            const faixas = [
                              { faixa: '0-7 dias', min: 0, max: 7, count: 0 },
                              { faixa: '8-15 dias', min: 8, max: 15, count: 0 },
                              { faixa: '16-30 dias', min: 16, max: 30, count: 0 },
                              { faixa: '31-60 dias', min: 31, max: 60, count: 0 },
                              { faixa: '61-90 dias', min: 61, max: 90, count: 0 },
                              { faixa: '+90 dias', min: 91, max: 9999, count: 0 },
                            ];
                            
                            bipData.data.forEach((item) => {
                              const dias = item.dias_sem_bip || 0;
                              const faixa = faixas.find(f => dias >= f.min && dias <= f.max);
                              if (faixa) faixa.count++;
                            });
                            
                            return faixas;
                          })()}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="faixa" tick={{ fontSize: 11 }} />
                          <YAxis />
                          <Tooltip formatter={(value: number) => [value, 'Veículos']} />
                          <Bar dataKey="count" fill="#2563eb" name="Veículos" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Aba de Cadastro */}
            <TabsContent value="cadastro">
              <div className="space-y-6">
                {/* Upload de Planilha */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Importar Planilha de Veículos
                    </CardTitle>
                    <CardDescription>
                      Envie uma planilha Excel (.xlsx) com os dados dos veículos para importação automática
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <label className="cursor-pointer">
                          <Input
                            type="file"
                            accept=".xlsx,.xls"
                            className="hidden"
                            onChange={handleVeiculosUpload}
                            disabled={uploadingVeiculos}
                            data-testid="input-upload-veiculos"
                          />
                          <Button variant="outline" disabled={uploadingVeiculos} asChild>
                            <span>
                              <FileSpreadsheet className="h-4 w-4 mr-2" />
                              {uploadingVeiculos ? 'Importando...' : 'Selecionar Arquivo'}
                            </span>
                          </Button>
                        </label>
                        {uploadingVeiculos && (
                          <div className="flex-1 max-w-xs">
                            <Progress value={uploadProgress} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">{uploadProgress}%</p>
                          </div>
                        )}
                      </div>
                      
                      {importReport && (
                        <div className="bg-muted p-4 rounded-lg">
                          <h4 className="font-semibold mb-2">Relatório de Importação</h4>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Total:</span>
                              <span className="ml-2 font-bold">{importReport.total}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Novos:</span>
                              <span className="ml-2 font-bold text-green-600">{importReport.importados}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Atualizados:</span>
                              <span className="ml-2 font-bold text-blue-600">{importReport.atualizados}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Ignorados:</span>
                              <span className="ml-2 font-bold text-orange-600">{importReport.ignorados}</span>
                            </div>
                          </div>
                          {importReport.erros.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm text-red-600 font-semibold">Erros ({importReport.erros.length}):</p>
                              <div className="max-h-32 overflow-y-auto mt-1">
                                {importReport.erros.slice(0, 10).map((err, i) => (
                                  <p key={i} className="text-xs text-red-500">
                                    Linha {err.linha}: {err.motivo}
                                  </p>
                                ))}
                                {importReport.erros.length > 10 && (
                                  <p className="text-xs text-muted-foreground">...e mais {importReport.erros.length - 10} erros</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Cards de Resumo Cadastro */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Total Veículos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{cadastroVehiclesData?.data?.length || 0}</div>
                      <p className="text-xs text-muted-foreground">cadastrados</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Murici
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {cadastroVehiclesData?.data?.filter(v => v.tipo_posse === 'Murici').length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">veículos</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        Locados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">
                        {cadastroVehiclesData?.data?.filter(v => v.tipo_posse === 'Locada').length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">veículos</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Sem Definição
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-600">
                        {cadastroVehiclesData?.data?.filter(v => !v.tipo_posse || (v.tipo_posse !== 'Murici' && v.tipo_posse !== 'Locada')).length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">veículos</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabela de Veículos */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Truck className="h-5 w-5" />
                          Cadastro de Veículos
                        </CardTitle>
                        <CardDescription>
                          Gerencie os veículos e defina se são próprios ou locados
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2 items-end">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Placa</label>
                          <Input 
                            placeholder="Buscar placa..." 
                            value={cadastroSearchPlaca}
                            onChange={(e) => setCadastroSearchPlaca(e.target.value.toUpperCase())}
                            className="w-32"
                            data-testid="input-cadastro-search-placa"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
                          <Select value={cadastroFilterOwnership} onValueChange={setCadastroFilterOwnership}>
                            <SelectTrigger className="w-32" data-testid="select-cadastro-ownership">
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Todos</SelectItem>
                              <SelectItem value="Murici">Murici</SelectItem>
                              <SelectItem value="Locada">Locada</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          onClick={() => setShowNewVehicleModal(true)}
                          data-testid="button-new-vehicle"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Novo Veículo
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {cadastroVehiclesLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : cadastroVehiclesData?.data && cadastroVehiclesData.data.length > 0 ? (
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-100">
                              <TableHead className="font-bold w-24">Placa</TableHead>
                              <TableHead className="w-40">Modelo</TableHead>
                              <TableHead className="w-32">Locadora</TableHead>
                              <TableHead className="w-28">Status</TableHead>
                              <TableHead className="w-24">Cidade</TableHead>
                              <TableHead className="w-16">UF</TableHead>
                              <TableHead className="w-20">SVC</TableHead>
                              <TableHead className="w-24 text-center">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {cadastroVehiclesData.data
                              .filter((item) => {
                                const matchPlaca = !cadastroSearchPlaca || item.placa?.toUpperCase().includes(cadastroSearchPlaca);
                                const matchOwnership = !cadastroFilterOwnership || item.tipo_posse === cadastroFilterOwnership;
                                return matchPlaca && matchOwnership;
                              })
                              .sort((a, b) => (a.placa || '').localeCompare(b.placa || ''))
                              .slice(0, 100)
                              .map((item, index) => (
                                <TableRow 
                                  key={item.id} 
                                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50 cursor-pointer`}
                                  data-testid={`cadastro-row-${item.id}`}
                                  onClick={() => {
                                    setSelectedVeiculo(item);
                                    setVeiculoEditData({...item});
                                    setShowVeiculoDetails(true);
                                  }}
                                >
                                  <TableCell className="font-bold text-blue-700">{item.placa}</TableCell>
                                  <TableCell className="text-sm">{item.modelo || '-'}</TableCell>
                                  <TableCell>
                                    <span className={`font-medium ${item.locadora ? 'text-orange-600' : 'text-blue-600'}`}>
                                      {item.locadora || 'Murici'}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <span className={`text-sm font-medium ${
                                      item.status?.toLowerCase().includes('ativo') || item.status?.includes('LHS') 
                                        ? 'text-green-600' 
                                        : item.status?.toLowerCase().includes('devol') 
                                          ? 'text-red-600'
                                          : 'text-gray-600'
                                    }`}>
                                      {item.status || '-'}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-sm">{item.cidade_veiculo || '-'}</TableCell>
                                  <TableCell className="text-sm">{item.estado || '-'}</TableCell>
                                  <TableCell className="text-sm font-medium">{item.base || '-'}</TableCell>
                                  <TableCell className="text-center">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedVeiculo(item);
                                        setVeiculoEditData({...item});
                                        setShowVeiculoDetails(true);
                                      }}
                                      data-testid={`button-details-${item.id}`}
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      Detalhes
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Truck className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">
                          Nenhum veículo cadastrado. Importe uma planilha para começar.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Modal de Detalhes do Veículo */}
              <Dialog open={showVeiculoDetails} onOpenChange={setShowVeiculoDetails}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Detalhes do Veículo - {selectedVeiculo?.placa}
                    </DialogTitle>
                    <DialogDescription>
                      Visualize e edite todas as informações do veículo
                    </DialogDescription>
                  </DialogHeader>
                  
                  {selectedVeiculo && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Placa</Label>
                        <Input 
                          value={veiculoEditData.placa || ''} 
                          onChange={(e) => setVeiculoEditData({...veiculoEditData, placa: e.target.value.toUpperCase()})}
                          className="font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Modelo</Label>
                        <Input 
                          value={veiculoEditData.modelo || ''} 
                          onChange={(e) => setVeiculoEditData({...veiculoEditData, modelo: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Chassi</Label>
                        <Input 
                          value={veiculoEditData.chassi || ''} 
                          onChange={(e) => setVeiculoEditData({...veiculoEditData, chassi: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Renavam</Label>
                        <Input 
                          value={veiculoEditData.renavam || ''} 
                          onChange={(e) => setVeiculoEditData({...veiculoEditData, renavam: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cidade</Label>
                        <Input 
                          value={veiculoEditData.cidade_veiculo || ''} 
                          onChange={(e) => setVeiculoEditData({...veiculoEditData, cidade_veiculo: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Estado (UF)</Label>
                        <Input 
                          value={veiculoEditData.estado || ''} 
                          onChange={(e) => setVeiculoEditData({...veiculoEditData, estado: e.target.value.toUpperCase()})}
                          maxLength={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cor</Label>
                        <Input 
                          value={veiculoEditData.cor || ''} 
                          onChange={(e) => setVeiculoEditData({...veiculoEditData, cor: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Operação</Label>
                        <Input 
                          value={veiculoEditData.operacao || ''} 
                          onChange={(e) => setVeiculoEditData({...veiculoEditData, operacao: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Locadora</Label>
                        <Input 
                          value={veiculoEditData.locadora || ''} 
                          onChange={(e) => setVeiculoEditData({...veiculoEditData, locadora: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo de Posse</Label>
                        <Select 
                          value={veiculoEditData.tipo_posse || ''} 
                          onValueChange={(val) => setVeiculoEditData({...veiculoEditData, tipo_posse: val})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Murici">Murici</SelectItem>
                            <SelectItem value="Locada">Locada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Status Final</Label>
                        <Input 
                          value={veiculoEditData.status || ''} 
                          onChange={(e) => setVeiculoEditData({...veiculoEditData, status: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>SVC (Base)</Label>
                        <Input 
                          value={veiculoEditData.base || ''} 
                          onChange={(e) => setVeiculoEditData({...veiculoEditData, base: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Input 
                          value={veiculoEditData.categoria || ''} 
                          onChange={(e) => setVeiculoEditData({...veiculoEditData, categoria: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ano Fabricação</Label>
                        <Input 
                          type="number"
                          value={veiculoEditData.ano_fabricacao || ''} 
                          onChange={(e) => setVeiculoEditData({...veiculoEditData, ano_fabricacao: parseInt(e.target.value) || null})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ano Modelo</Label>
                        <Input 
                          type="number"
                          value={veiculoEditData.ano_modelo || ''} 
                          onChange={(e) => setVeiculoEditData({...veiculoEditData, ano_modelo: parseInt(e.target.value) || null})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>KM Atual</Label>
                        <Input 
                          type="number"
                          value={veiculoEditData.km || ''} 
                          onChange={(e) => setVeiculoEditData({...veiculoEditData, km: parseInt(e.target.value) || null})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rastreador</Label>
                        <Input 
                          value={veiculoEditData.rastreador || ''} 
                          onChange={(e) => setVeiculoEditData({...veiculoEditData, rastreador: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Data Início Operação</Label>
                        <Input 
                          type="date"
                          value={veiculoEditData.data_inicio_operacao || ''} 
                          onChange={(e) => setVeiculoEditData({...veiculoEditData, data_inicio_operacao: e.target.value})}
                        />
                      </div>
                    </div>
                  )}
                  
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setShowVeiculoDetails(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={() => {
                        updateVeiculoMutation.mutate({ id: selectedVeiculo.id, data: veiculoEditData });
                        setShowVeiculoDetails(false);
                      }}
                      disabled={updateVeiculoMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Aba de Dashboards */}
            <TabsContent value="dashboards">
              <div className="space-y-6">
                {/* Filtros do Dashboard */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle>Dashboard de Manutenções</CardTitle>
                        <CardDescription>Análise visual do histórico de manutenções</CardDescription>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-48">
                          <Select value={dashboardBase} onValueChange={setDashboardBase}>
                            <SelectTrigger data-testid="select-dashboard-base">
                              <SelectValue placeholder="Todas as bases" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Todas as bases</SelectItem>
                              {basesData?.bases?.map((base) => (
                                <SelectItem key={base} value={base}>{base}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Buscar placa..." 
                            value={searchPlaca}
                            onChange={(e) => setSearchPlaca(e.target.value.toUpperCase())}
                            className="w-40"
                            data-testid="input-search-placa"
                          />
                          <Button variant="outline" size="icon">
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Cards de Resumo */}
                {dashboardData?.totais && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Wrench className="h-4 w-4" />
                          Total
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardData.totais.total_manutencoes}</div>
                        <p className="text-xs text-muted-foreground">manutenções</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Car className="h-4 w-4" />
                          Veículos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardData.totais.veiculos_atendidos}</div>
                        <p className="text-xs text-muted-foreground">atendidos</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Custo Total
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                          {formatCurrency(Number(dashboardData.totais.custo_total))}
                        </div>
                        <p className="text-xs text-muted-foreground">investido</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Custo Médio
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(Number(dashboardData.totais.custo_medio))}
                        </div>
                        <p className="text-xs text-muted-foreground">por manutenção</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Tempo Médio
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {Number(dashboardData.totais.tempo_medio || 0).toFixed(1)}
                        </div>
                        <p className="text-xs text-muted-foreground">dias</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Dias Parados
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                          {Number(dashboardData.totais.dias_parados_total || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">total</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Gráficos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gráfico por Tipo */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Manutenções por Tipo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {dashboardData?.porTipo && dashboardData.porTipo.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={dashboardData.porTipo}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ tipo, quantidade, percent }) => `${tipo}: ${quantidade} (${(percent * 100).toFixed(0)}%)`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="quantidade"
                            >
                              {dashboardData.porTipo.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => [value, 'Quantidade']} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                          Nenhum dado disponível
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Gráfico por Oficina */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top Oficinas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {dashboardData?.porOficina && dashboardData.porOficina.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={dashboardData.porOficina.slice(0, 10)} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="oficina" type="category" width={100} tick={{ fontSize: 11 }} />
                            <Tooltip 
                              formatter={(value: number, name: string) => [
                                name === 'quantidade' ? value : formatCurrency(value),
                                name === 'quantidade' ? 'Quantidade' : 'Valor'
                              ]}
                            />
                            <Bar dataKey="quantidade" fill="#2563eb" name="quantidade" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                          Nenhum dado disponível
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Evolução Mensal */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Evolução Mensal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {dashboardData?.evolucaoMensal && dashboardData.evolucaoMensal.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={dashboardData.evolucaoMensal}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip 
                              formatter={(value: number, name: string) => [
                                name === 'valor_total' ? formatCurrency(value) : value,
                                name === 'valor_total' ? 'Custo Total' : name === 'quantidade' ? 'Quantidade' : 'Veículos'
                              ]}
                            />
                            <Legend />
                            <Area yAxisId="left" type="monotone" dataKey="quantidade" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.6} name="Quantidade" />
                            <Line yAxisId="right" type="monotone" dataKey="valor_total" stroke="#dc2626" name="Custo" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                          Nenhum dado disponível
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Por Base */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Manutenções por Base</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {dashboardData?.porBase && dashboardData.porBase.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={dashboardData.porBase}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="base" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                            <YAxis />
                            <Tooltip 
                              formatter={(value: number, name: string) => [
                                name === 'valor_total' ? formatCurrency(value) : value,
                                name === 'valor_total' ? 'Custo' : 'Quantidade'
                              ]}
                            />
                            <Legend />
                            <Bar dataKey="quantidade" fill="#16a34a" name="Quantidade" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                          Nenhum dado disponível
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Gráficos de Distribuição de Veículos */}
                <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Truck className="h-5 w-5 text-blue-600" />
                      Distribuição da Frota
                    </CardTitle>
                    <CardDescription>Análise da composição e pulverização dos veículos</CardDescription>
                  </CardHeader>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gráfico Murici vs Locados */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Murici vs Locados</CardTitle>
                      <CardDescription>Distribuição por tipo de posse</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {veiculosDistribuicao?.porPosse && veiculosDistribuicao.porPosse.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={veiculosDistribuicao.porPosse.map((item, idx) => ({
                                ...item,
                                name: `${item.name}: ${item.value} (${((item.value / (veiculosDistribuicao?.total || 1)) * 100).toFixed(1)}%)`
                              }))}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name }) => name}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {veiculosDistribuicao.porPosse.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : index === 1 ? '#3b82f6' : '#6b7280'} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => [value, 'Quantidade']} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                          Nenhum dado disponível
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Gráfico por Locadora */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Distribuição por Locadora</CardTitle>
                      <CardDescription>Quantidade de veículos por locadora</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {veiculosDistribuicao?.porLocadora && veiculosDistribuicao.porLocadora.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={veiculosDistribuicao.porLocadora.slice(0, 10)} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(value: number) => [value, 'Veículos']} />
                            <Bar dataKey="value" fill="#3b82f6" name="Veículos" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                          Nenhum dado disponível
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Gráfico por Estado */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pulverização por Estado (UF)</CardTitle>
                    <CardDescription>Distribuição geográfica dos veículos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {veiculosDistribuicao?.porEstado && veiculosDistribuicao.porEstado.length > 0 ? (
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={veiculosDistribuicao.porEstado}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis />
                          <Tooltip formatter={(value: number) => [value, 'Veículos']} />
                          <Bar dataKey="value" fill="#22c55e" name="Veículos" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                        Nenhum dado disponível
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Ranking de Placas Mais Caras */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-red-500" />
                      Ranking das Placas Mais Caras
                    </CardTitle>
                    <CardDescription>Top 20 veículos com maior custo de manutenção</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dashboardData?.rankingPlacas && dashboardData.rankingPlacas.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-16">#</TableHead>
                              <TableHead>Placa</TableHead>
                              <TableHead className="text-center">Manutenções</TableHead>
                              <TableHead className="text-right">Custo Total</TableHead>
                              <TableHead className="text-center">Dias Parados</TableHead>
                              <TableHead className="w-48">Proporção</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(() => {
                              const maxCusto = Math.max(...dashboardData.rankingPlacas.map(p => Number(p.custo_total)));
                              const maxDias = Math.max(...dashboardData.rankingPlacas.map(p => Number(p.dias_parados)));
                              const usarDias = maxCusto === 0 && maxDias > 0;
                              
                              const sortedData = usarDias 
                                ? [...dashboardData.rankingPlacas].sort((a, b) => Number(b.dias_parados) - Number(a.dias_parados))
                                : dashboardData.rankingPlacas;
                              
                              return sortedData.map((item, index) => {
                                const percentual = usarDias
                                  ? (maxDias > 0 ? (Number(item.dias_parados) / maxDias) * 100 : 0)
                                  : (maxCusto > 0 ? (Number(item.custo_total) / maxCusto) * 100 : 0);
                                return (
                                  <TableRow key={item.placa}>
                                    <TableCell className="font-bold">
                                      {index + 1}º
                                    </TableCell>
                                    <TableCell>
                                      <Button 
                                        variant="link" 
                                        className="p-0 h-auto font-medium"
                                        onClick={() => setSearchPlaca(item.placa)}
                                      >
                                        {item.placa}
                                      </Button>
                                    </TableCell>
                                    <TableCell className="text-center">{item.quantidade}</TableCell>
                                    <TableCell className="text-right font-semibold text-red-600">
                                      {formatCurrency(Number(item.custo_total))}
                                    </TableCell>
                                    <TableCell className="text-center">{item.dias_parados || 0}</TableCell>
                                    <TableCell>
                                      <Progress value={percentual} className="h-2" />
                                    </TableCell>
                                  </TableRow>
                                );
                              });
                            })()}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        Nenhum dado disponível. Faça o upload de uma planilha de histórico.
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Histórico por Placa (quando pesquisar) */}
                {searchPlaca && placaData?.success && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Car className="h-5 w-5" />
                        Histórico do Veículo: {searchPlaca}
                      </CardTitle>
                      <CardDescription>
                        {placaData.stats?.total_manutencoes || 0} manutenções registradas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {placaData.stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground">Custo Total</p>
                            <p className="text-xl font-bold text-red-600">
                              {formatCurrency(Number(placaData.stats.custo_total))}
                            </p>
                          </div>
                          <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground">Dias Parados</p>
                            <p className="text-xl font-bold">{placaData.stats.dias_parados || 0}</p>
                          </div>
                          <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground">Maior KM</p>
                            <p className="text-xl font-bold">{(placaData.stats.maior_km || 0).toLocaleString()}</p>
                          </div>
                          <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground">Tempo Médio</p>
                            <p className="text-xl font-bold">{Number(placaData.stats.tempo_medio || 0).toFixed(1)} dias</p>
                          </div>
                        </div>
                      )}

                      {/* Custos por Mês */}
                      {placaData.custosPorMes && placaData.custosPorMes.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-semibold mb-4">Custos por Mês</h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={[...placaData.custosPorMes].reverse()}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                              <YAxis />
                              <Tooltip formatter={(value: number) => [formatCurrency(value), 'Custo']} />
                              <Bar dataKey="valor_total" fill="#dc2626" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Lista de Manutenções */}
                      {placaData.historico && placaData.historico.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-4">Linha do Tempo</h4>
                          <div className="space-y-3">
                            {placaData.historico.slice(0, 10).map((item: ManutencaoHistorico, index: number) => (
                              <div key={item.id} className="flex gap-4 p-3 border rounded-lg">
                                <div className="flex-shrink-0 w-20 text-center">
                                  <p className="text-sm font-medium">{formatDate(item.data_manutencao)}</p>
                                  <Badge variant={item.tipo?.toLowerCase().includes('preventiva') ? 'default' : 'destructive'}>
                                    {item.tipo || 'N/A'}
                                  </Badge>
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">{item.descricao || 'Sem descrição'}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.oficina && `Oficina: ${item.oficina}`}
                                    {item.km && ` | KM: ${item.km.toLocaleString()}`}
                                    {item.tempo_total && ` | ${item.tempo_total} dias`}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-red-600">{formatCurrency(Number(item.valor))}</p>
                                  <Badge variant="outline">{item.status || 'N/A'}</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialog de Edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Editar Manutenção
            </DialogTitle>
            <DialogDescription>
              Atualize as informações do veículo em manutenção
            </DialogDescription>
          </DialogHeader>
          
          {editingDado && (
            <div className="grid gap-6 py-4">
              {/* Dados do Veículo */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Dados do Veículo</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Placa</Label>
                    <Input 
                      value={editingDado.placa || ''}
                      onChange={(e) => setEditingDado({...editingDado, placa: e.target.value})}
                      className="bg-orange-50 border-orange-200"
                      data-testid="input-edit-placa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Modelo</Label>
                    <Input 
                      value={editingDado.modelo || ''}
                      onChange={(e) => setEditingDado({...editingDado, modelo: e.target.value})}
                      className="bg-orange-50 border-orange-200"
                      data-testid="input-edit-modelo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>KM</Label>
                    <Input 
                      type="number"
                      value={editingDado.km || ''}
                      onChange={(e) => setEditingDado({...editingDado, km: parseInt(e.target.value) || 0})}
                      className="bg-orange-50 border-orange-200"
                      data-testid="input-edit-km"
                    />
                  </div>
                </div>
              </div>

              {/* Status e Oficina */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Status e Oficina</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select 
                      value={editingDado.status || 'Em Manutenção'}
                      onValueChange={(value) => setEditingDado({...editingDado, status: value})}
                    >
                      <SelectTrigger data-testid="select-edit-status" className="bg-orange-50 border-orange-200">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Em Manutenção">Em Manutenção</SelectItem>
                        <SelectItem value="Em Orçamento">Em Orçamento</SelectItem>
                        <SelectItem value="Aguardando Peça">Aguardando Peça</SelectItem>
                        <SelectItem value="Aguardando Aprovação">Aguardando Aprovação</SelectItem>
                        <SelectItem value="Em Execução">Em Execução</SelectItem>
                        <SelectItem value="Liberado">Liberado</SelectItem>
                        <SelectItem value="Finalizado">Finalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Oficina</Label>
                    <Input 
                      value={editingDado.oficina_debito || ''}
                      onChange={(e) => setEditingDado({...editingDado, oficina_debito: e.target.value})}
                      placeholder="Nome da oficina"
                      className="bg-orange-50 border-orange-200"
                      data-testid="input-edit-oficina"
                    />
                  </div>
                </div>
              </div>

              {/* Datas da Manutenção */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Datas da Manutenção</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data Parada do Veículo</Label>
                    <Input 
                      type="date"
                      value={(editingDado as any).data_parada || ''}
                      onChange={(e) => setEditingDado({...editingDado, data_parada: e.target.value} as any)}
                      className="bg-orange-50 border-orange-200"
                      data-testid="input-edit-data-parada"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Início Manutenção</Label>
                    <Input 
                      type="date"
                      value={(editingDado as any).data_inicio_manutencao || ''}
                      onChange={(e) => setEditingDado({...editingDado, data_inicio_manutencao: e.target.value} as any)}
                      className="bg-orange-50 border-orange-200"
                      data-testid="input-edit-data-inicio"
                    />
                  </div>
                </div>
              </div>

              {/* Agendamento e Responsáveis */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Agendamento e Responsáveis</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Data Agenda</Label>
                    <Input 
                      type="date"
                      value={editingDado.data_agenda || ''}
                      onChange={(e) => setEditingDado({...editingDado, data_agenda: e.target.value})}
                      className="bg-orange-50 border-orange-200"
                      data-testid="input-edit-data-agenda"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Focal</Label>
                    <Input 
                      value={editingDado.focal || ''}
                      onChange={(e) => setEditingDado({...editingDado, focal: e.target.value})}
                      className="bg-orange-50 border-orange-200"
                      data-testid="input-edit-focal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Atendimento</Label>
                    <Input 
                      value={editingDado.atendimento || ''}
                      onChange={(e) => setEditingDado({...editingDado, atendimento: e.target.value})}
                      className="bg-orange-50 border-orange-200"
                      data-testid="input-edit-atendimento"
                    />
                  </div>
                </div>
              </div>

              {/* Relato do Problema */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Relato do Problema</h4>
                <div className="space-y-2">
                  <textarea 
                    className="w-full min-h-[120px] p-3 border rounded-md bg-orange-50 border-orange-200"
                    value={editingDado.relato || ''}
                    onChange={(e) => setEditingDado({...editingDado, relato: e.target.value})}
                    placeholder="Descreva o problema ou serviço a ser realizado..."
                    data-testid="textarea-edit-relato"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveDado} disabled={updateDadoMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              {updateDadoMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Nova Manutenção */}
      <Dialog open={newDadoDialogOpen} onOpenChange={setNewDadoDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nova Manutenção
            </DialogTitle>
            <DialogDescription>
              Registre um novo veículo em manutenção
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* Dados do Veículo */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Dados do Veículo</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Placa *</Label>
                  <Select 
                    value={newDado.placa || ''}
                    onValueChange={(value) => {
                      const selectedVehicle = vehicles.find(v => v.plate === value);
                      setNewDado({
                        ...newDado, 
                        placa: value,
                        modelo: selectedVehicle?.model || newDado.modelo
                      });
                    }}
                  >
                    <SelectTrigger data-testid="select-new-placa">
                      <SelectValue placeholder="Selecione o veículo" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.plate}>
                          {vehicle.plate} - {vehicle.model || 'Sem modelo'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Modelo {(!newDado.modelo || newDado.modelo === 'Não informado') && <span className="text-orange-500 text-xs">(Selecione para atualizar)</span>}</Label>
                  {newDado.modelo && newDado.modelo !== 'Não informado' ? (
                    <Input 
                      value={newDado.modelo || ''}
                      readOnly
                      className="bg-muted"
                      data-testid="input-new-modelo"
                    />
                  ) : (
                    <Select 
                      value={newDado.modelo || ''}
                      onValueChange={(value) => setNewDado({...newDado, modelo: value})}
                    >
                      <SelectTrigger data-testid="select-new-modelo" className="bg-orange-50 border-orange-300">
                        <SelectValue placeholder="Selecione o modelo" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {modelosVeiculos.map((modelo) => (
                          <SelectItem key={modelo} value={modelo}>{modelo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>KM</Label>
                  <Input 
                    type="number"
                    value={newDado.km || ''}
                    onChange={(e) => setNewDado({...newDado, km: parseInt(e.target.value) || 0})}
                    placeholder="0"
                    data-testid="input-new-km"
                  />
                </div>
              </div>
            </div>

            {/* Status e Oficina */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Status e Oficina</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={newDado.status || 'Em Manutenção'}
                    onValueChange={(value) => setNewDado({...newDado, status: value})}
                  >
                    <SelectTrigger data-testid="select-new-status">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Em Manutenção">Em Manutenção</SelectItem>
                      <SelectItem value="Em Orçamento">Em Orçamento</SelectItem>
                      <SelectItem value="Aguardando Peça">Aguardando Peça</SelectItem>
                      <SelectItem value="Aguardando Aprovação">Aguardando Aprovação</SelectItem>
                      <SelectItem value="Em Execução">Em Execução</SelectItem>
                      <SelectItem value="Liberado">Liberado</SelectItem>
                      <SelectItem value="Finalizado">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Oficina</Label>
                  <Input 
                    value={newDado.oficina_debito || ''}
                    onChange={(e) => setNewDado({...newDado, oficina_debito: e.target.value})}
                    placeholder="Nome da oficina"
                    data-testid="input-new-oficina"
                  />
                </div>
              </div>
            </div>

            {/* Datas da Manutenção */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Datas da Manutenção</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Data Parada do Veículo</Label>
                  <Input 
                    type="date"
                    value={(newDado as any).data_parada || ''}
                    onChange={(e) => setNewDado({...newDado, data_parada: e.target.value} as any)}
                    data-testid="input-new-data-parada"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Início Manutenção</Label>
                  <Input 
                    type="date"
                    value={(newDado as any).data_inicio_manutencao || ''}
                    onChange={(e) => setNewDado({...newDado, data_inicio_manutencao: e.target.value} as any)}
                    data-testid="input-new-data-inicio"
                  />
                </div>
                {newDado.status === 'Finalizado' && (
                  <div className="space-y-2">
                    <Label>Data Finalização</Label>
                    <Input 
                      type="date"
                      value={(newDado as any).data_finalizacao || ''}
                      onChange={(e) => setNewDado({...newDado, data_finalizacao: e.target.value} as any)}
                      data-testid="input-new-data-finalizacao"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Projeto e Base */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Projeto e Base</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Projeto</Label>
                  <Select 
                    value={selectedProjectId?.toString() || ''}
                    onValueChange={(value) => {
                      setSelectedProjectId(value ? parseInt(value) : null);
                      setNewDado({...newDado, base: ''} as any);
                    }}
                  >
                    <SelectTrigger data-testid="select-new-project">
                      <SelectValue placeholder="Todos os Projetos" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="">Todos os Projetos</SelectItem>
                      {allProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>{project.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Base</Label>
                  <Select 
                    value={(newDado as any).base || ''}
                    onValueChange={(value) => setNewDado({...newDado, base: value} as any)}
                  >
                    <SelectTrigger data-testid="select-new-base">
                      <SelectValue placeholder="Selecione a base" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="">Todas as Bases</SelectItem>
                      {allBases.map((base) => (
                        <SelectItem key={base.id} value={base.name}>{base.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Grupo e Subgrupo */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Categoria da Manutenção</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Grupo</Label>
                  <Select 
                    value={selectedGrupo}
                    onValueChange={(value) => {
                      setSelectedGrupo(value);
                      setSelectedSubgrupo('');
                    }}
                  >
                    <SelectTrigger data-testid="select-new-grupo">
                      <SelectValue placeholder="Selecione o grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Selecione o grupo</SelectItem>
                      {Object.keys(gruposManutencao).map((grupo) => (
                        <SelectItem key={grupo} value={grupo}>{grupo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subgrupo</Label>
                  <Select 
                    value={selectedSubgrupo}
                    onValueChange={setSelectedSubgrupo}
                    disabled={!selectedGrupo}
                  >
                    <SelectTrigger data-testid="select-new-subgrupo">
                      <SelectValue placeholder={selectedGrupo ? "Selecione o subgrupo" : "Selecione o grupo primeiro"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="">Selecione o subgrupo</SelectItem>
                      {selectedGrupo && gruposManutencao[selectedGrupo]?.map((subgrupo) => (
                        <SelectItem key={subgrupo} value={subgrupo}>{subgrupo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Agendamento e Responsáveis */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Agendamento e Responsáveis</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Data Agenda</Label>
                  <Input 
                    type="date"
                    value={newDado.data_agenda || ''}
                    onChange={(e) => setNewDado({...newDado, data_agenda: e.target.value})}
                    data-testid="input-new-data-agenda"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Focal</Label>
                  <Input 
                    value={newDado.focal || ''}
                    onChange={(e) => setNewDado({...newDado, focal: e.target.value})}
                    placeholder="Nome do focal"
                    data-testid="input-new-focal"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Atendimento</Label>
                  <Input 
                    value={newDado.atendimento || ''}
                    onChange={(e) => setNewDado({...newDado, atendimento: e.target.value})}
                    placeholder="Código de atendimento"
                    data-testid="input-new-atendimento"
                  />
                </div>
              </div>
            </div>

            {/* Relato do Problema */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Relato do Problema</h4>
              <div className="space-y-2">
                <textarea 
                  className="w-full min-h-[100px] p-3 border rounded-md bg-background"
                  value={newDado.relato || ''}
                  onChange={(e) => setNewDado({...newDado, relato: e.target.value})}
                  placeholder="Descreva o problema ou serviço a ser realizado..."
                  data-testid="textarea-new-relato"
                />
              </div>
            </div>

            {/* Peças e Valores */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Peças e Valores</h4>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addPeca}
                  data-testid="button-add-peca"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Peça
                </Button>
              </div>
              
              <div className="space-y-3">
                {newPecas.map((peca, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <Input 
                        value={peca.nome}
                        onChange={(e) => updatePeca(index, 'nome', e.target.value)}
                        placeholder="Nome da peça ou serviço"
                        data-testid={`input-peca-nome-${index}`}
                      />
                    </div>
                    <div className="w-36">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                        <Input 
                          type="number"
                          step="0.01"
                          min="0"
                          value={peca.valor || ''}
                          onChange={(e) => updatePeca(index, 'valor', e.target.value)}
                          placeholder="0,00"
                          className="pl-9"
                          data-testid={`input-peca-valor-${index}`}
                        />
                      </div>
                    </div>
                    {newPecas.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removePeca(index)}
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-remove-peca-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {calcularTotalPecas() > 0 && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="font-bold text-lg text-primary">{formatCurrency(calcularTotalPecas())}</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setNewDadoDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleCreateDado} disabled={createDadoMutation.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              {createDadoMutation.isPending ? 'Registrando...' : 'Registrar Manutenção'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de BIP */}
      <Dialog open={!!editingBip} onOpenChange={(open) => !open && setEditingBip(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5" />
              Editar BIP - {editingBip?.placa}
            </DialogTitle>
            <DialogDescription>
              Atualize as datas e informações do BIP do veículo
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ultimo_bip">Último BIP</Label>
                <Input
                  id="ultimo_bip"
                  type="date"
                  value={bipEditData.ultimo_bip}
                  onChange={(e) => setBipEditData({...bipEditData, ultimo_bip: e.target.value})}
                  data-testid="input-edit-ultimo-bip"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ml_bip">ML BIP</Label>
                <Input
                  id="ml_bip"
                  type="date"
                  value={bipEditData.ml_bip}
                  onChange={(e) => setBipEditData({...bipEditData, ml_bip: e.target.value})}
                  data-testid="input-edit-ml-bip"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dds_bip">DDS BIP</Label>
                <Input
                  id="dds_bip"
                  type="date"
                  value={bipEditData.dds_bip}
                  onChange={(e) => setBipEditData({...bipEditData, dds_bip: e.target.value})}
                  data-testid="input-edit-dds-bip"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo</Label>
                <Select 
                  value={bipEditData.motivo} 
                  onValueChange={(val) => setBipEditData({...bipEditData, motivo: val})}
                >
                  <SelectTrigger id="motivo" data-testid="select-edit-motivo">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Reserva">Reserva</SelectItem>
                    <SelectItem value="Sinistro">Sinistro</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="base_reserva">Base Reserva</Label>
              <Input
                id="base_reserva"
                value={bipEditData.base_reserva}
                onChange={(e) => setBipEditData({...bipEditData, base_reserva: e.target.value})}
                placeholder="Ex: PTL01, LH01..."
                data-testid="input-edit-base-reserva"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacao">Observação</Label>
              <Input
                id="observacao"
                value={bipEditData.observacao}
                onChange={(e) => setBipEditData({...bipEditData, observacao: e.target.value})}
                placeholder="Observações adicionais..."
                data-testid="input-edit-observacao"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBip(null)} data-testid="button-cancel-bip">
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveBip} 
              disabled={updateBipMutation.isPending}
              data-testid="button-save-bip"
            >
              {updateBipMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Novo Veículo */}
      <Dialog open={showNewVehicleModal} onOpenChange={setShowNewVehicleModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Novo Veículo
            </DialogTitle>
            <DialogDescription>
              Cadastre um novo veículo na frota
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-plate">Placa *</Label>
              <Input
                id="new-plate"
                value={newVehicle.plate}
                onChange={(e) => setNewVehicle({...newVehicle, plate: e.target.value.toUpperCase()})}
                placeholder="ABC1234"
                maxLength={8}
                data-testid="input-new-vehicle-plate"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-model">Modelo</Label>
              <Select 
                value={newVehicle.model} 
                onValueChange={(val) => setNewVehicle({...newVehicle, model: val})}
              >
                <SelectTrigger id="new-model" data-testid="select-new-vehicle-model">
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  {modelosVeiculos.map((modelo) => (
                    <SelectItem key={modelo} value={modelo}>{modelo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-ownership">Tipo</Label>
              <Select 
                value={newVehicle.ownership} 
                onValueChange={(val) => setNewVehicle({...newVehicle, ownership: val})}
              >
                <SelectTrigger id="new-ownership" data-testid="select-new-vehicle-ownership">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Murici">Murici</SelectItem>
                  <SelectItem value="Locada">Locada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNewVehicleModal(false);
                setNewVehicle({ plate: '', model: '', ownership: 'Murici' });
              }}
              data-testid="button-cancel-new-vehicle"
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (!newVehicle.plate) {
                  toast({
                    title: 'Erro',
                    description: 'Placa é obrigatória',
                    variant: 'destructive',
                  });
                  return;
                }
                createVehicleMutation.mutate(newVehicle);
              }}
              disabled={createVehicleMutation.isPending}
              data-testid="button-create-vehicle"
            >
              {createVehicleMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Cadastrando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
