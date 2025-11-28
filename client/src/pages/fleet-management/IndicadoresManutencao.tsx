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
  X
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
  const [editingDado, setEditingDado] = useState<Dado | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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
              <Card>
                <CardHeader>
                  <CardTitle>Controle de Estoque de Peças</CardTitle>
                  <CardDescription>
                    Acompanhamento diário do estoque de peças
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pecas.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Filtro Comb.</TableHead>
                            <TableHead>Filtro Ar</TableHead>
                            <TableHead>Filtro Óleo</TableHead>
                            <TableHead>Óleo 5W30</TableHead>
                            <TableHead>Pastilha Freio D/</TableHead>
                            <TableHead>Pastilha Freio T/</TableHead>
                            <TableHead>Disco Freio D/</TableHead>
                            <TableHead>Disco Freio T/</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pecas.map((peca) => (
                            <TableRow key={peca.id}>
                              <TableCell className="font-medium">
                                {formatDate(peca.data)}
                              </TableCell>
                              <TableCell>{peca.filtro_combustivel || '-'}</TableCell>
                              <TableCell>{peca.filtro_ar || '-'}</TableCell>
                              <TableCell>{peca.filtro_oleo || '-'}</TableCell>
                              <TableCell>{peca.oleo_motor_5w30 || '-'}</TableCell>
                              <TableCell>{peca.pastilha_freio_dianteira || '-'}</TableCell>
                              <TableCell>{peca.pastilha_freio_traseira || '-'}</TableCell>
                              <TableCell>{peca.disco_freio_dianteiro || '-'}</TableCell>
                              <TableCell>{peca.disco_freio_traseiro || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground">
                        Nenhum dado de peças disponível. Faça o upload de uma planilha.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba de Dados (Em Manutenção) */}
            <TabsContent value="dados">
              <Card>
                <CardHeader>
                  <CardTitle>Veículos em Manutenção</CardTitle>
                  <CardDescription>
                    Lista de veículos atualmente em manutenção
                  </CardDescription>
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
                            {dashboardData.rankingPlacas.map((item, index) => {
                              const maxCusto = Math.max(...dashboardData.rankingPlacas.map(p => Number(p.custo_total)));
                              const percentual = maxCusto > 0 ? (Number(item.custo_total) / maxCusto) * 100 : 0;
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
                            })}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Registro de Manutenção</DialogTitle>
            <DialogDescription>
              Atualize as informações do veículo em manutenção
            </DialogDescription>
          </DialogHeader>
          
          {editingDado && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
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
              </div>

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
                    </SelectContent>
                  </Select>
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

              <div className="grid grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label>Relato</Label>
                <textarea 
                  className="w-full min-h-[100px] p-2 border rounded-md"
                  value={editingDado.relato || ''}
                  onChange={(e) => setEditingDado({...editingDado, relato: e.target.value})}
                  data-testid="textarea-edit-relato"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveDado} disabled={updateDadoMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateDadoMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
