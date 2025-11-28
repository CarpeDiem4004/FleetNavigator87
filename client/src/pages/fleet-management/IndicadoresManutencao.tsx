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
  Edit,
  Save,
  X,
  Plus
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

  const handleCreateDado = () => {
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

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
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
              <TabsTrigger value="liberado" data-testid="tab-liberado">
                <CheckCircle className="h-4 w-4 mr-2" />
                Liberado
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(pecasAnalise.porModelo)
                          .filter(([modelo]) => !selectedModeloPeca || modelo === selectedModeloPeca)
                          .slice(0, selectedModeloPeca ? 1 : 6)
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

            {/* Aba de Liberado */}
            <TabsContent value="liberado">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Manutenções Liberadas</CardTitle>
                  <CardDescription>
                    Registro completo de manutenções concluídas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo de Manutenção</Label>
                        <Select value={filterTipoManutencao} onValueChange={setFilterTipoManutencao}>
                          <SelectTrigger data-testid="select-tipo-manutencao">
                            <SelectValue placeholder="Todos os tipos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Todos os tipos</SelectItem>
                            <SelectItem value="Preventiva">Preventiva</SelectItem>
                            <SelectItem value="Corretiva">Corretiva</SelectItem>
                            <SelectItem value="Motor">Motor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Placa</Label>
                        <Input
                          placeholder="Filtrar por placa..."
                          value={filterPlaca}
                          onChange={(e) => setFilterPlaca(e.target.value)}
                          data-testid="input-filter-placa"
                        />
                      </div>
                    </div>

                    {liberado.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Placa</TableHead>
                              <TableHead>Modelo</TableHead>
                              <TableHead>Operação</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>D+Manut</TableHead>
                              <TableHead>Oficina</TableHead>
                              <TableHead>Focal</TableHead>
                              <TableHead>Centro Custo</TableHead>
                              <TableHead>Data Agenda</TableHead>
                              <TableHead>Liberado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {liberado.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.placa}</TableCell>
                                <TableCell>{item.modelo || '-'}</TableCell>
                                <TableCell>{item.operacao || '-'}</TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={
                                      item.tipo_manutencao?.toLowerCase().includes('preventiva')
                                        ? 'default'
                                        : 'destructive'
                                    }
                                  >
                                    {item.tipo_manutencao || '-'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={item.status2?.includes('Fora do Prazo') ? 'destructive' : 'outline'}>
                                    {item.status2 || item.status || '-'}
                                  </Badge>
                                </TableCell>
                                <TableCell>{item.d_manut || '-'}</TableCell>
                                <TableCell className="max-w-xs truncate">{item.oficina || '-'}</TableCell>
                                <TableCell>{item.focal || '-'}</TableCell>
                                <TableCell>{item.centro_custo || '-'}</TableCell>
                                <TableCell>{formatDate(item.data_agenda)}</TableCell>
                                <TableCell>{formatDate(item.liberado)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">
                          Nenhum registro de manutenção liberada encontrado.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
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
              Editar Registro de Manutenção
            </DialogTitle>
            <DialogDescription>
              Atualize as informações do veículo em manutenção
            </DialogDescription>
          </DialogHeader>
          
          {editingDado && (
            <div className="grid gap-6 py-4">
              {/* Resumo do Veículo */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold">{editingDado.placa}</p>
                    <p className="text-sm text-muted-foreground">{editingDado.modelo || 'Modelo não informado'}</p>
                  </div>
                  <Badge variant={
                    editingDado.status === 'Liberado' ? 'default' :
                    editingDado.status === 'Em Orçamento' ? 'secondary' :
                    editingDado.status === 'Aguardando Peça' ? 'outline' :
                    'destructive'
                  } className="text-sm px-3 py-1">
                    {editingDado.status || 'Em Manutenção'}
                  </Badge>
                </div>
              </div>

              {/* Dados do Veículo */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Dados do Veículo</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Placa</Label>
                    <Input 
                      value={editingDado.placa || ''}
                      onChange={(e) => setEditingDado({...editingDado, placa: e.target.value})}
                      data-testid="input-edit-placa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Modelo</Label>
                    <Input 
                      value={editingDado.modelo || ''}
                      onChange={(e) => setEditingDado({...editingDado, modelo: e.target.value})}
                      data-testid="input-edit-modelo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>KM</Label>
                    <Input 
                      type="number"
                      value={editingDado.km || ''}
                      onChange={(e) => setEditingDado({...editingDado, km: parseInt(e.target.value) || 0})}
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
                      <SelectTrigger data-testid="select-edit-status">
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
                      data-testid="input-edit-oficina"
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
                      value={(editingDado as any).data_parada || ''}
                      onChange={(e) => setEditingDado({...editingDado, data_parada: e.target.value} as any)}
                      data-testid="input-edit-data-parada"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Início Manutenção</Label>
                    <Input 
                      type="date"
                      value={(editingDado as any).data_inicio_manutencao || ''}
                      onChange={(e) => setEditingDado({...editingDado, data_inicio_manutencao: e.target.value} as any)}
                      data-testid="input-edit-data-inicio"
                    />
                  </div>
                  {editingDado.status === 'Finalizado' && (
                    <div className="space-y-2">
                      <Label>Data Finalização</Label>
                      <Input 
                        type="date"
                        value={(editingDado as any).data_finalizacao || ''}
                        onChange={(e) => setEditingDado({...editingDado, data_finalizacao: e.target.value} as any)}
                        data-testid="input-edit-data-finalizacao"
                      />
                    </div>
                  )}
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
                      data-testid="input-edit-data-agenda"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Focal</Label>
                    <Input 
                      value={editingDado.focal || ''}
                      onChange={(e) => setEditingDado({...editingDado, focal: e.target.value})}
                      data-testid="input-edit-focal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Atendimento</Label>
                    <Input 
                      value={editingDado.atendimento || ''}
                      onChange={(e) => setEditingDado({...editingDado, atendimento: e.target.value})}
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
                    className="w-full min-h-[120px] p-3 border rounded-md bg-background"
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
            <Button onClick={handleSaveDado} disabled={updateDadoMutation.isPending}>
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
                  <Label>Modelo</Label>
                  <Input 
                    value={newDado.modelo || ''}
                    onChange={(e) => setNewDado({...newDado, modelo: e.target.value})}
                    placeholder="Preenchido automaticamente"
                    readOnly
                    className="bg-muted"
                    data-testid="input-new-modelo"
                  />
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
    </AppLayout>
  );
}
