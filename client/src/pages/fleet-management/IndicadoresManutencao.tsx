import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import * as XLSX from 'xlsx';
import AppLayout from '@/components/layout/AppLayout';
import { subscribeToIndicadoresUpdates, syncMaintenanceIndicators, SyncResponse } from '@/services/syncIndicators';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ManutencaoTimeline from '@/components/ManutencaoTimeline';
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
  Filter,
  ArrowDownCircle,
  ArrowUpCircle,
  Download,
  RefreshCw,
  User
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
  base?: string;
  km: number;
  relato: string;
  data_agenda: string;
  focal: string;
  oficina_debito: string;
  atendimento: string;
  status: string;
  data_finalizacao?: string;
  data_parada?: string;
  data_inicio_manutencao?: string;
  tipo_manutencao?: string;
  total_orcamentos?: number;
  orcamentos_pendentes?: number;
  orcamentos_aprovados?: number;
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
  cadastro_veic: string | null;
  empresa: string | null;
  facility: string | null;
  sync_source: string | null;
  last_sync_at: string | null;
}

const COLORS = ['#2563eb', '#16a34a', '#eab308', '#dc2626', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

interface MaintenanceRequest {
  id: number;
  numero_os: string | null;
  placa: string;
  modelo: string | null;
  base_origem: string;
  odometro: number | null;
  relato_problema: string;
  urgencia: string;
  fotos: string[] | null;
  orcamento_previo: number | null;
  status: string;
  oficina_direcionada: string | null;
  data_agendamento: string | null;
  hora_agendamento: string | null;
  instrucoes: string | null;
  responsavel_base: string | null;
  telefone_responsavel: string | null;
  responsavel_aprovacao: string | null;
  data_aprovacao: string | null;
  observacoes: string | null;
  whatsapp_enviado: boolean;
  created_at: string;
  updated_at: string;
}

function RecebimentoOSTab() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('pendente');
  const [direcionamentoData, setDirecionamentoData] = useState({
    oficina_direcionada: '',
    data_agendamento: '',
    hora_agendamento: '',
    instrucoes: '',
    observacoes: ''
  });

  const { data: requests = [], isLoading, refetch } = useQuery<MaintenanceRequest[]>({
    queryKey: ['/api/maintenance-requests', filterStatus],
    queryFn: async () => {
      const res = await fetch(`/api/maintenance-requests?status=${filterStatus}`, { credentials: 'include' });
      const json = await res.json();
      return json.data || [];
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/maintenance-requests/stats'],
    queryFn: async () => {
      const res = await fetch('/api/maintenance-requests/stats', { credentials: 'include' });
      const json = await res.json();
      return json.data || { pendentes: 0, aprovados: 0, recusados: 0, total: 0 };
    }
  });

  const { data: oficinas = [] } = useQuery<{id: number; nome: string; categoria: string}[]>({
    queryKey: ['/api/fornecedores/oficinas'],
    queryFn: async () => {
      const res = await fetch('/api/fornecedores?categoria=Oficina', { credentials: 'include' });
      const json = await res.json();
      return json.data || json || [];
    }
  });

  const [showWhatsAppConfirm, setShowWhatsAppConfirm] = useState(false);
  const [savedRequestData, setSavedRequestData] = useState<{placa: string; oficina: string; data: string; hora: string; telefone: string; instrucoes: string} | null>(null);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/maintenance-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance-requests/stats'] });
      toast({ title: 'Sucesso', description: 'Solicitação atualizada' });
      
      if (selectedRequest?.telefone_responsavel && direcionamentoData.oficina_direcionada) {
        setSavedRequestData({
          placa: selectedRequest.placa,
          oficina: direcionamentoData.oficina_direcionada,
          data: direcionamentoData.data_agendamento,
          hora: direcionamentoData.hora_agendamento,
          telefone: selectedRequest.telefone_responsavel,
          instrucoes: direcionamentoData.instrucoes
        });
        setShowWhatsAppConfirm(true);
        setDialogOpen(false);
      } else {
        setDialogOpen(false);
      }
    }
  });

  const confirmMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/maintenance-requests/${id}/confirm`, {
        method: 'POST',
        credentials: 'include'
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance-requests/stats'] });
      toast({ title: 'Sucesso', description: 'Agendamento confirmado e WhatsApp enviado!' });
      setDialogOpen(false);
    }
  });

  const formatDateForInput = (dateStr: string | null): string => {
    if (!dateStr) return '';
    if (dateStr.includes('T')) return dateStr.split('T')[0];
    return dateStr;
  };

  const handleDirecionar = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setDirecionamentoData({
      oficina_direcionada: request.oficina_direcionada || '',
      data_agendamento: formatDateForInput(request.data_agendamento),
      hora_agendamento: request.hora_agendamento || '',
      instrucoes: request.instrucoes || '',
      observacoes: request.observacoes || ''
    });
    setDialogOpen(true);
  };

  const handleSaveDirecionamento = () => {
    if (!selectedRequest) return;
    updateMutation.mutate({
      id: selectedRequest.id,
      data: { ...direcionamentoData, status: 'aprovado' }
    });
  };

  const handleSendWhatsAppManual = () => {
    if (!selectedRequest) return;
    if (!window.confirm('Deseja enviar a notificação de confirmação via WhatsApp para o responsável da base?')) {
      return;
    }
    confirmMutation.mutate(selectedRequest.id);
  };

  const handleRecusar = (request: MaintenanceRequest) => {
    updateMutation.mutate({ id: request.id, data: { status: 'recusado' } });
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente': return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'aprovado': return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'recusado': return <Badge className="bg-red-100 text-red-800">Recusado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('all')}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-sm text-muted-foreground">Total de Solicitações</p>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer hover:shadow-md transition-shadow ${filterStatus === 'pendente' ? 'ring-2 ring-yellow-500' : ''}`} onClick={() => setFilterStatus('pendente')}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{stats?.pendentes || 0}</div>
            <p className="text-sm text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer hover:shadow-md transition-shadow ${filterStatus === 'aprovado' ? 'ring-2 ring-green-500' : ''}`} onClick={() => setFilterStatus('aprovado')}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats?.aprovados || 0}</div>
            <p className="text-sm text-muted-foreground">Aprovados</p>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer hover:shadow-md transition-shadow ${filterStatus === 'recusado' ? 'ring-2 ring-red-500' : ''}`} onClick={() => setFilterStatus('recusado')}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats?.recusados || 0}</div>
            <p className="text-sm text-muted-foreground">Recusados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownCircle className="h-5 w-5" />
                Solicitações de Manutenção
              </CardTitle>
              <CardDescription>
                Triagem e direcionamento de veículos para oficinas
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : requests.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhuma solicitação encontrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº OS</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>Problema</TableHead>
                  <TableHead>Urgência</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Abertura</TableHead>
                  <TableHead>Agendamento</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map(req => (
                  <TableRow key={req.id}>
                    <TableCell className="font-mono text-sm font-bold text-blue-700">{req.numero_os || '-'}</TableCell>
                    <TableCell className="font-medium">{req.placa}</TableCell>
                    <TableCell>{req.base_origem}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{req.relato_problema}</TableCell>
                    <TableCell>{getUrgenciaBadge(req.urgencia)}</TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell>{new Date(req.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{req.data_agendamento ? new Date(req.data_agendamento).toLocaleDateString('pt-BR') : '-'}</TableCell>
                    <TableCell className="text-sm">{req.responsavel_base || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleDirecionar(req)}>
                          <Eye className="h-4 w-4 mr-1" /> Ver/Direcionar
                        </Button>
                        {req.status === 'pendente' && (
                          <Button size="sm" variant="destructive" onClick={() => handleRecusar(req)}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRequest?.numero_os && <span className="font-mono text-blue-700">{selectedRequest.numero_os} - </span>}
              Direcionar Veículo - {selectedRequest?.placa}
            </DialogTitle>
            <DialogDescription>
              Defina a oficina e a data de agendamento para este veículo.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Nº da OS</p>
                  <p className="font-mono font-bold text-blue-700">{selectedRequest.numero_os || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Base de Origem</p>
                  <p className="font-medium">{selectedRequest.base_origem}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Urgência</p>
                  {getUrgenciaBadge(selectedRequest.urgencia)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Solicitante</p>
                  <p className="font-medium">{selectedRequest.responsavel_base || 'Não informado'}</p>
                </div>
                {selectedRequest.telefone_responsavel && (
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone do Solicitante</p>
                    <p className="font-medium">{selectedRequest.telefone_responsavel}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Data de Abertura</p>
                  <p className="font-medium">{new Date(selectedRequest.created_at).toLocaleDateString('pt-BR')} {new Date(selectedRequest.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Relato do Problema</p>
                  <p className="font-medium">{selectedRequest.relato_problema}</p>
                </div>
                {selectedRequest.odometro && (
                  <div>
                    <p className="text-sm text-muted-foreground">Odômetro</p>
                    <p className="font-medium">{selectedRequest.odometro?.toLocaleString()} km</p>
                  </div>
                )}
                {selectedRequest.orcamento_previo && (
                  <div>
                    <p className="text-sm text-muted-foreground">Orçamento Prévio</p>
                    <p className="font-medium">R$ {Number(selectedRequest.orcamento_previo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Oficina</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={direcionamentoData.oficina_direcionada}
                    onChange={(e) => setDirecionamentoData({...direcionamentoData, oficina_direcionada: e.target.value})}
                  >
                    <option value="">Selecione uma oficina</option>
                    <optgroup label="Oficinas Internas">
                      <option value="Oficina Murici">Oficina Murici</option>
                      <option value="Oficina Autofrei">Oficina Autofrei</option>
                      <option value="Oficina Alair">Oficina Alair</option>
                    </optgroup>
                    {oficinas.length > 0 && (
                      <optgroup label="Oficinas Parceiras">
                        {oficinas.slice(0, 50).map((oficina) => (
                          <option key={oficina.id} value={oficina.nome}>{oficina.nome}</option>
                        ))}
                      </optgroup>
                    )}
                    <option value="Outra">Outra (especificar nas observações)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data do Agendamento</Label>
                    <Input
                      type="date"
                      value={direcionamentoData.data_agendamento}
                      onChange={(e) => setDirecionamentoData({...direcionamentoData, data_agendamento: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <Input
                      type="time"
                      value={direcionamentoData.hora_agendamento}
                      onChange={(e) => setDirecionamentoData({...direcionamentoData, hora_agendamento: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Instruções para a Base</Label>
                  <Input
                    placeholder="Ex: Levar documentos do veículo"
                    value={direcionamentoData.instrucoes}
                    onChange={(e) => setDirecionamentoData({...direcionamentoData, instrucoes: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Input
                    placeholder="Observações adicionais"
                    value={direcionamentoData.observacoes}
                    onChange={(e) => setDirecionamentoData({...direcionamentoData, observacoes: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveDirecionamento} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" /> Salvar
            </Button>
            {selectedRequest?.telefone_responsavel && (selectedRequest?.oficina_direcionada || direcionamentoData.oficina_direcionada) && (
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white" 
                onClick={() => {
                  if (!selectedRequest) return;
                  const telefone = selectedRequest.telefone_responsavel!.replace(/\D/g, '');
                  const telefoneFormatado = telefone.startsWith('55') ? telefone : `55${telefone}`;
                  const oficina = direcionamentoData.oficina_direcionada || selectedRequest.oficina_direcionada || 'A definir';
                  const dataAgend = direcionamentoData.data_agendamento || selectedRequest.data_agendamento;
                  const dataFormatada = dataAgend 
                    ? new Date(dataAgend + 'T12:00:00').toLocaleDateString('pt-BR')
                    : 'A definir';
                  const hora = direcionamentoData.hora_agendamento || selectedRequest.hora_agendamento || 'A definir';
                  const instrucoes = direcionamentoData.instrucoes || selectedRequest.instrucoes || '';
                  const osNum = selectedRequest.numero_os || '';

                  const mensagem = `🔧 *CONFIRMAÇÃO DE AGENDAMENTO - MANUTENÇÃO*
${osNum ? `\n📋 *OS:* ${osNum}` : ''}
Olá! Informamos que o veículo *${selectedRequest.placa}* foi direcionado para manutenção.

📍 *Oficina:* ${oficina}
📅 *Data:* ${dataFormatada}
⏰ *Horário:* ${hora}
${instrucoes ? `\n📝 *Instruções:* ${instrucoes}` : ''}

Por favor, siga as orientações acima para encaminhar o veículo.

_Gestão de Frotas - Murici Transportes_`;

                  const url = `https://wa.me/${telefoneFormatado}?text=${encodeURIComponent(mensagem)}`;
                  window.open(url, '_blank');
                  toast({ title: 'WhatsApp aberto', description: 'A mensagem foi preparada para envio.' });
                }}
              >
                <span className="mr-1">📲</span> Enviar WhatsApp
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação WhatsApp */}
      <Dialog open={showWhatsAppConfirm} onOpenChange={setShowWhatsAppConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-green-600">📱</span> Enviar Atualização via WhatsApp
            </DialogTitle>
            <DialogDescription>
              Deseja enviar a confirmação do agendamento para o responsável da base?
            </DialogDescription>
          </DialogHeader>
          
          {savedRequestData && (
            <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm"><strong>Veículo:</strong> {savedRequestData.placa}</p>
              <p className="text-sm"><strong>Oficina:</strong> {savedRequestData.oficina}</p>
              <p className="text-sm"><strong>Data:</strong> {savedRequestData.data ? new Date(savedRequestData.data + 'T12:00:00').toLocaleDateString('pt-BR') : 'Não definida'}</p>
              <p className="text-sm"><strong>Horário:</strong> {savedRequestData.hora || 'Não definido'}</p>
              <p className="text-sm"><strong>Telefone:</strong> {savedRequestData.telefone}</p>
              {savedRequestData.instrucoes && (
                <p className="text-sm"><strong>Instruções:</strong> {savedRequestData.instrucoes}</p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowWhatsAppConfirm(false);
              setSavedRequestData(null);
            }}>
              Fechar
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (savedRequestData) {
                  const telefone = savedRequestData.telefone.replace(/\D/g, '');
                  const telefoneFormatado = telefone.startsWith('55') ? telefone : `55${telefone}`;
                  const dataFormatada = savedRequestData.data 
                    ? new Date(savedRequestData.data + 'T12:00:00').toLocaleDateString('pt-BR')
                    : 'A definir';
                  const mensagem = `🔧 *CONFIRMAÇÃO DE AGENDAMENTO - MANUTENÇÃO*

Olá! Informamos que o veículo *${savedRequestData.placa}* foi direcionado para manutenção.

📍 *Oficina:* ${savedRequestData.oficina}
📅 *Data:* ${dataFormatada}
⏰ *Horário:* ${savedRequestData.hora || 'A definir'}
${savedRequestData.instrucoes ? `\n📋 *Instruções:* ${savedRequestData.instrucoes}` : ''}

Por favor, siga as orientações acima para encaminhar o veículo.

_Gestão de Frotas - Murici Transportes_`;
                  
                  const url = `https://wa.me/${telefoneFormatado}?text=${encodeURIComponent(mensagem)}`;
                  window.open(url, '_blank');
                  setShowWhatsAppConfirm(false);
                  setSavedRequestData(null);
                  toast({ title: 'WhatsApp aberto', description: 'A mensagem foi preparada para envio.' });
                }
              }}
            >
              <span className="mr-2">📲</span> Abrir WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Interface para Fornecedores
interface Fornecedor {
  id: number;
  nome: string;
  cnpj: string | null;
  categoria: string | null;
  tipo_servico: string | null;
  contato_nome: string | null;
  contato_telefone: string | null;
  contato_email: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  observacoes: string | null;
  is_parceiro: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORIAS_FORNECEDOR = [
  { value: 'oficina_mecanica', label: 'Oficina Mecânica' },
  { value: 'funilaria', label: 'Funilaria' },
  { value: 'eletrica', label: 'Elétrica' },
  { value: 'pneus', label: 'Pneus' },
  { value: 'pecas', label: 'Peças' },
  { value: 'combustivel', label: 'Combustível' },
  { value: 'lubrificantes', label: 'Lubrificantes' },
  { value: 'acessorios', label: 'Acessórios' },
  { value: 'outros', label: 'Outros' },
];

const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// Componente de aba Fornecedores
function FornecedoresTab() {
  const { toast } = useToast();
  const [searchNome, setSearchNome] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterAtivo, setFilterAtivo] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedFornecedor, setSelectedFornecedor] = useState<Fornecedor | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    categoria: 'oficina_mecanica',
    tipo_servico: '',
    contato_nome: '',
    contato_telefone: '',
    contato_email: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    observacoes: '',
    is_parceiro: false,
    ativo: true
  });

  // Query para listar fornecedores
  const { data: fornecedoresData, isLoading, refetch } = useQuery<{success: boolean, data: Fornecedor[], total: number}>({
    queryKey: ['/api/indicadores/fornecedores', { search: searchNome, categoria: filterCategoria, ativo: filterAtivo }],
  });

  // Mutation para criar fornecedor
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/indicadores/fornecedores', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Fornecedor cadastrado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/indicadores/fornecedores'] });
      setShowNewModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message || 'Erro ao cadastrar fornecedor', variant: 'destructive' });
    }
  });

  // Mutation para atualizar fornecedor
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: typeof formData }) => {
      const response = await apiRequest('PATCH', `/api/indicadores/fornecedores/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Fornecedor atualizado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/indicadores/fornecedores'] });
      setShowEditModal(false);
      setSelectedFornecedor(null);
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message || 'Erro ao atualizar fornecedor', variant: 'destructive' });
    }
  });

  // Mutation para deletar fornecedor
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/indicadores/fornecedores/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Fornecedor removido com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/indicadores/fornecedores'] });
      setShowDeleteConfirm(false);
      setSelectedFornecedor(null);
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message || 'Erro ao remover fornecedor', variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      cnpj: '',
      categoria: 'oficina_mecanica',
      tipo_servico: '',
      contato_nome: '',
      contato_telefone: '',
      contato_email: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      observacoes: '',
      is_parceiro: false,
      ativo: true
    });
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setSelectedFornecedor(fornecedor);
    setFormData({
      nome: fornecedor.nome || '',
      cnpj: fornecedor.cnpj || '',
      categoria: fornecedor.categoria || 'oficina_mecanica',
      tipo_servico: fornecedor.tipo_servico || '',
      contato_nome: fornecedor.contato_nome || '',
      contato_telefone: fornecedor.contato_telefone || '',
      contato_email: fornecedor.contato_email || '',
      endereco: fornecedor.endereco || '',
      cidade: fornecedor.cidade || '',
      estado: fornecedor.estado || '',
      cep: fornecedor.cep || '',
      observacoes: fornecedor.observacoes || '',
      is_parceiro: fornecedor.is_parceiro || false,
      ativo: fornecedor.ativo !== false
    });
    setShowEditModal(true);
  };

  const handleDelete = (fornecedor: Fornecedor) => {
    setSelectedFornecedor(fornecedor);
    setShowDeleteConfirm(true);
  };

  const handleSubmitNew = () => {
    if (!formData.nome.trim()) {
      toast({ title: 'Erro', description: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleSubmitEdit = () => {
    if (!formData.nome.trim() || !selectedFornecedor) {
      toast({ title: 'Erro', description: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }
    updateMutation.mutate({ id: selectedFornecedor.id, data: formData });
  };

  const getCategoriaLabel = (value: string) => {
    const cat = CATEGORIAS_FORNECEDOR.find(c => c.value === value);
    return cat?.label || value;
  };

  const fornecedores = fornecedoresData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header com busca e botão novo */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-3 flex-1">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CNPJ ou cidade..."
              value={searchNome}
              onChange={(e) => setSearchNome(e.target.value)}
              className="pl-9"
              data-testid="input-search-fornecedor"
            />
          </div>
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="w-full md:w-48" data-testid="select-categoria-filter">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas Categorias</SelectItem>
              {CATEGORIAS_FORNECEDOR.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterAtivo} onValueChange={setFilterAtivo}>
            <SelectTrigger className="w-full md:w-36" data-testid="select-ativo-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="true">Ativo</SelectItem>
              <SelectItem value="false">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { resetForm(); setShowNewModal(true); }} data-testid="button-novo-fornecedor">
          <Plus className="h-4 w-4 mr-2" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{fornecedores.length}</p>
                <p className="text-xs text-muted-foreground">Total Fornecedores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{fornecedores.filter(f => f.ativo).length}</p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{fornecedores.filter(f => f.categoria === 'oficina_mecanica').length}</p>
                <p className="text-xs text-muted-foreground">Oficinas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{fornecedores.filter(f => f.is_parceiro).length}</p>
                <p className="text-xs text-muted-foreground">Parceiros</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de fornecedores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Lista de Fornecedores
          </CardTitle>
          <CardDescription>
            Gerencie os fornecedores do sistema de manutenção
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : fornecedores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum fornecedor encontrado</p>
              <p className="text-sm">Clique em "Novo Fornecedor" para cadastrar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Cidade/UF</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fornecedores.map((fornecedor) => (
                    <TableRow key={fornecedor.id} data-testid={`row-fornecedor-${fornecedor.id}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {fornecedor.nome}
                          {fornecedor.is_parceiro && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              Parceiro
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {fornecedor.cnpj || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getCategoriaLabel(fornecedor.categoria || '')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {fornecedor.cidade && fornecedor.estado 
                          ? `${fornecedor.cidade}/${fornecedor.estado}`
                          : fornecedor.cidade || fornecedor.estado || '-'}
                      </TableCell>
                      <TableCell>
                        {fornecedor.contato_telefone || fornecedor.contato_email || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={fornecedor.ativo ? 'default' : 'secondary'} className={fornecedor.ativo ? 'bg-green-600' : ''}>
                          {fornecedor.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(fornecedor)}
                            data-testid={`button-edit-fornecedor-${fornecedor.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(fornecedor)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`button-delete-fornecedor-${fornecedor.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Novo Fornecedor */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Fornecedor</DialogTitle>
            <DialogDescription>
              Cadastre um novo fornecedor no sistema
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2">
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Nome do fornecedor"
                data-testid="input-fornecedor-nome"
              />
            </div>
            <div>
              <Label>CNPJ</Label>
              <Input
                value={formData.cnpj}
                onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                placeholder="00.000.000/0000-00"
                data-testid="input-fornecedor-cnpj"
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={formData.categoria} onValueChange={(v) => setFormData({...formData, categoria: v})}>
                <SelectTrigger data-testid="select-fornecedor-categoria">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_FORNECEDOR.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Tipo de Serviço</Label>
              <Input
                value={formData.tipo_servico}
                onChange={(e) => setFormData({...formData, tipo_servico: e.target.value})}
                placeholder="Ex: Manutenção preventiva, reparo de motor..."
                data-testid="input-fornecedor-tipo-servico"
              />
            </div>
            <div>
              <Label>Nome do Contato</Label>
              <Input
                value={formData.contato_nome}
                onChange={(e) => setFormData({...formData, contato_nome: e.target.value})}
                placeholder="Nome"
                data-testid="input-fornecedor-contato-nome"
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={formData.contato_telefone}
                onChange={(e) => setFormData({...formData, contato_telefone: e.target.value})}
                placeholder="(00) 00000-0000"
                data-testid="input-fornecedor-telefone"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.contato_email}
                onChange={(e) => setFormData({...formData, contato_email: e.target.value})}
                placeholder="email@exemplo.com"
                data-testid="input-fornecedor-email"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Endereço</Label>
              <Input
                value={formData.endereco}
                onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                placeholder="Rua, número, bairro"
                data-testid="input-fornecedor-endereco"
              />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input
                value={formData.cidade}
                onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                placeholder="Cidade"
                data-testid="input-fornecedor-cidade"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>Estado</Label>
                <Select value={formData.estado} onValueChange={(v) => setFormData({...formData, estado: v})}>
                  <SelectTrigger data-testid="select-fornecedor-estado">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BR.map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label>CEP</Label>
                <Input
                  value={formData.cep}
                  onChange={(e) => setFormData({...formData, cep: e.target.value})}
                  placeholder="00000-000"
                  data-testid="input-fornecedor-cep"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Observações</Label>
              <Input
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                placeholder="Observações adicionais"
                data-testid="input-fornecedor-observacoes"
              />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_parceiro}
                  onChange={(e) => setFormData({...formData, is_parceiro: e.target.checked})}
                  className="w-4 h-4 rounded"
                  data-testid="checkbox-fornecedor-parceiro"
                />
                <span className="text-sm">É Parceiro</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
                  className="w-4 h-4 rounded"
                  data-testid="checkbox-fornecedor-ativo"
                />
                <span className="text-sm">Ativo</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewModal(false)}>Cancelar</Button>
            <Button onClick={handleSubmitNew} disabled={createMutation.isPending} data-testid="button-submit-novo-fornecedor">
              {createMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Fornecedor */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Fornecedor</DialogTitle>
            <DialogDescription>
              Atualize os dados do fornecedor
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2">
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Nome do fornecedor"
                data-testid="input-edit-fornecedor-nome"
              />
            </div>
            <div>
              <Label>CNPJ</Label>
              <Input
                value={formData.cnpj}
                onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                placeholder="00.000.000/0000-00"
                data-testid="input-edit-fornecedor-cnpj"
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={formData.categoria} onValueChange={(v) => setFormData({...formData, categoria: v})}>
                <SelectTrigger data-testid="select-edit-fornecedor-categoria">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_FORNECEDOR.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Tipo de Serviço</Label>
              <Input
                value={formData.tipo_servico}
                onChange={(e) => setFormData({...formData, tipo_servico: e.target.value})}
                placeholder="Ex: Manutenção preventiva, reparo de motor..."
                data-testid="input-edit-fornecedor-tipo-servico"
              />
            </div>
            <div>
              <Label>Nome do Contato</Label>
              <Input
                value={formData.contato_nome}
                onChange={(e) => setFormData({...formData, contato_nome: e.target.value})}
                placeholder="Nome"
                data-testid="input-edit-fornecedor-contato-nome"
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={formData.contato_telefone}
                onChange={(e) => setFormData({...formData, contato_telefone: e.target.value})}
                placeholder="(00) 00000-0000"
                data-testid="input-edit-fornecedor-telefone"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.contato_email}
                onChange={(e) => setFormData({...formData, contato_email: e.target.value})}
                placeholder="email@exemplo.com"
                data-testid="input-edit-fornecedor-email"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Endereço</Label>
              <Input
                value={formData.endereco}
                onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                placeholder="Rua, número, bairro"
                data-testid="input-edit-fornecedor-endereco"
              />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input
                value={formData.cidade}
                onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                placeholder="Cidade"
                data-testid="input-edit-fornecedor-cidade"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>Estado</Label>
                <Select value={formData.estado} onValueChange={(v) => setFormData({...formData, estado: v})}>
                  <SelectTrigger data-testid="select-edit-fornecedor-estado">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BR.map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label>CEP</Label>
                <Input
                  value={formData.cep}
                  onChange={(e) => setFormData({...formData, cep: e.target.value})}
                  placeholder="00000-000"
                  data-testid="input-edit-fornecedor-cep"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Observações</Label>
              <Input
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                placeholder="Observações adicionais"
                data-testid="input-edit-fornecedor-observacoes"
              />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_parceiro}
                  onChange={(e) => setFormData({...formData, is_parceiro: e.target.checked})}
                  className="w-4 h-4 rounded"
                  data-testid="checkbox-edit-fornecedor-parceiro"
                />
                <span className="text-sm">É Parceiro</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
                  className="w-4 h-4 rounded"
                  data-testid="checkbox-edit-fornecedor-ativo"
                />
                <span className="text-sm">Ativo</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancelar</Button>
            <Button onClick={handleSubmitEdit} disabled={updateMutation.isPending} data-testid="button-submit-edit-fornecedor">
              {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Exclusão */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Deseja realmente remover o fornecedor "{selectedFornecedor?.nome}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedFornecedor && deleteMutation.mutate(selectedFornecedor.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-fornecedor"
            >
              {deleteMutation.isPending ? 'Removendo...' : 'Remover'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function IndicadoresManutencao() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedUploadId, setSelectedUploadId] = useState<number | null>(null);
  const [filterTipoManutencao, setFilterTipoManutencao] = useState<string>('');
  const [filterPlaca, setFilterPlaca] = useState<string>('');
  const [searchPlaca, setSearchPlaca] = useState<string>('');
  const [filterPlacaEmManutencao, setFilterPlacaEmManutencao] = useState<string>('');
  const [filterMinhaResponsabilidade, setFilterMinhaResponsabilidade] = useState<boolean>(false);
  const [dashboardBase, setDashboardBase] = useState<string>('');
  const [activeTab, setActiveTab] = useState('dados');
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
  const [placaSearchInput, setPlacaSearchInput] = useState<string>('');
  const [showPlacaDropdown, setShowPlacaDropdown] = useState<boolean>(false);
  const [newPecas, setNewPecas] = useState<Array<{nome: string, valor: number}>>([{nome: '', valor: 0}]);
  const [editPecas, setEditPecas] = useState<Array<{nome: string, valor: number}>>([{nome: '', valor: 0}]);
  const [editSelectedProjectId, setEditSelectedProjectId] = useState<number | null>(null);
  const [editSelectedBase, setEditSelectedBase] = useState<string>('');
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
    ownership: 'Murici',
    chassi: '',
    renavam: '',
    cidade: '',
    estado: '',
    cor: '',
    operacao: '',
    locadora: '',
    status: 'em_operacao',
    base: '',
    categoria: '',
    ano_fabricacao: '',
    ano_modelo: '',
    km: '',
    rastreador: '',
    data_inicio_operacao: ''
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
  
  // Estados para modal de histórico de oficinas/orçamentos
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [selectedDadoTimeline, setSelectedDadoTimeline] = useState<Dado | null>(null);

  // Estados para exclusão de manutenção com senha
  const [showDeleteManutencaoModal, setShowDeleteManutencaoModal] = useState(false);
  const [deleteManutencaoTarget, setDeleteManutencaoTarget] = useState<Dado | null>(null);
  const [deleteManutencaoSenha, setDeleteManutencaoSenha] = useState('');

  // Estados para modal de atualização de andamento de OS direcionadas
  const [showAndamentoModal, setShowAndamentoModal] = useState(false);
  const [andamentoTarget, setAndamentoTarget] = useState<any | null>(null);
  const [andamentoData, setAndamentoData] = useState({
    status_manutencao: '',
    mecanico_responsavel: '',
    observacoes_oficina: '',
    pecas_utilizadas: '',
    valor_pecas: '',
    valor_mao_obra: ''
  });

  // Estados para modal de movimentações (entradas e saídas)
  const [showMovimentacoesModal, setShowMovimentacoesModal] = useState(false);
  const [movimentacoesPeriodo, setMovimentacoesPeriodo] = useState('30');

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

  // Efeito para sincronização automática em tempo real
  useEffect(() => {
    console.log('[INDICADORES] Inicializando listener de sincronização automática');
    
    // Sincronizar ao montar o componente
    syncMaintenanceIndicators();
    
    // Escutar atualizações automáticas
    const unsubscribe = subscribeToIndicadoresUpdates((data: SyncResponse) => {
      console.log('[INDICADORES] Dados sincronizados automaticamente:', data.syncStats);
      
      // Invalidar queries para atualizar a interface
      queryClient.invalidateQueries({ queryKey: ['/api/indicadores'] });
      queryClient.invalidateQueries({ queryKey: ['/api/indicadores/dados'] });
      queryClient.invalidateQueries({ queryKey: ['/api/indicadores/em-manutencao'] });
      queryClient.invalidateQueries({ queryKey: ['/api/indicadores/resumo-custos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/indicadores/movimentacoes'] });
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Mutation para excluir manutenção com senha de gestor
  const deleteManutencaoMutation = useMutation({
    mutationFn: async ({ id, senha_gestor }: { id: number; senha_gestor: string }) => {
      const res = await apiRequest('DELETE', `/api/indicadores/dados/${id}`, { senha_gestor });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Manutenção excluída com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/indicadores/dados'] });
      queryClient.invalidateQueries({ queryKey: ['/api/indicadores/em-manutencao'] });
      queryClient.invalidateQueries({ queryKey: ['/api/indicadores/stats'] });
      setShowDeleteManutencaoModal(false);
      setDeleteManutencaoTarget(null);
      setDeleteManutencaoSenha('');
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro', 
        description: error.message || 'Senha incorreta ou erro ao excluir',
        variant: 'destructive'
      });
    }
  });

  // Mutation para atualizar dados em manutenção
  const updateDadoMutation = useMutation({
    mutationFn: async (data: Partial<Dado> & { id: number; pecas?: Array<{nome: string, valor: number}> }) => {
      const res = await apiRequest('PUT', `/api/indicadores/dados/${data.id}`, data);
      return res.json();
    },
    onSuccess: (response) => {
      const msg = response?.orcamentoCriado 
        ? 'Registro atualizado! Orçamento enviado para aprovação.'
        : 'Registro atualizado com sucesso!';
      toast({ title: 'Sucesso', description: msg });
      queryClient.invalidateQueries({ queryKey: ['/api/indicadores/dados'] });
      queryClient.invalidateQueries({ queryKey: ['/api/indicadores/pecas/analise'] });
      setEditDialogOpen(false);
      setEditingDado(null);
      setEditPecas([{nome: '', valor: 0}]);
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  // Mutation para atualizar andamento de OS direcionadas
  const andamentoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof andamentoData }) => {
      const res = await apiRequest('PATCH', `/api/indicadores/os-andamento/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Andamento atualizado', description: 'Status da OS atualizado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/indicadores/dados'] });
      setShowAndamentoModal(false);
      setAndamentoTarget(null);
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o andamento', variant: 'destructive' });
    }
  });

  const handleEditDado = (dado: Dado) => {
    setEditingDado({ ...dado });
    setEditDialogOpen(true);
  };

  const handleSaveDado = () => {
    if (editingDado) {
      // Incluir peças válidas para criar orçamento automático
      const pecasValidas = editPecas.filter(p => p.nome.trim() !== '' && p.valor > 0);
      updateDadoMutation.mutate({
        ...editingDado,
        pecas: pecasValidas
      });
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

  const addEditPeca = () => {
    setEditPecas([...editPecas, {nome: '', valor: 0}]);
  };

  const removeEditPeca = (index: number) => {
    if (editPecas.length > 1) {
      setEditPecas(editPecas.filter((_, i) => i !== index));
    }
  };

  const updateEditPeca = (index: number, field: 'nome' | 'valor', value: string | number) => {
    const updated = [...editPecas];
    if (field === 'valor') {
      updated[index][field] = typeof value === 'string' ? parseFloat(value) || 0 : value;
    } else {
      updated[index][field] = value as string;
    }
    setEditPecas(updated);
  };

  const calcularTotalEditPecas = () => {
    return editPecas.reduce((sum, p) => sum + (p.valor || 0), 0);
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

  // Buscar movimentações de manutenção (entradas e saídas) com comparativo diário
  const { data: movimentacoesData } = useQuery<{
    success: boolean,
    periodo: number,
    comparativo: {
      entradas: { hoje: number, ontem: number, variacao: number },
      saidas: { hoje: number, ontem: number, variacao: number }
    },
    entradas: { total: number, registros: any[] },
    saidas: { total: number, registros: any[] }
  }>({
    queryKey: ['/api/indicadores/movimentacoes', { periodo: movimentacoesPeriodo }],
    queryFn: async () => {
      const res = await fetch(`/api/indicadores/movimentacoes?periodo=${movimentacoesPeriodo}`, { credentials: 'include' });
      return res.json();
    }
  });

  const movimentacoes = movimentacoesData;

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

  const syncBipMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/indicadores/bip/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao sincronizar');
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Sincronização concluída!',
        description: `Total: ${data.total}, Inseridos: ${data.inseridos}, Atualizados: ${data.atualizados}${data.erros > 0 ? `, Erros: ${data.erros}` : ''}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/indicadores/bip'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro na sincronização',
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

  // Query para buscar fornecedores para autocomplete de oficinas
  const { data: oficinasData } = useQuery<{success: boolean, data: Array<{id: number, nome: string, cnpj?: string, categoria?: string}>}>({
    queryKey: ['/api/indicadores/fornecedores', { ativo: 'true' }],
    queryFn: async () => {
      const res = await fetch('/api/indicadores/fornecedores?ativo=true', { credentials: 'include' });
      return res.json();
    }
  });

  // Lista de oficinas para autocomplete (extrai nomes dos fornecedores)
  const oficinasOptions = oficinasData?.data?.map(f => ({
    value: f.nome,
    label: f.nome
  })) || [];

  // Estado para controlar autocomplete de oficina
  const [oficinaSearch, setOficinaSearch] = useState('');
  const [showOficinaDropdown, setShowOficinaDropdown] = useState(false);
  const [editOficinaSearch, setEditOficinaSearch] = useState('');
  const [showEditOficinaDropdown, setShowEditOficinaDropdown] = useState(false);

  // Filtrar oficinas baseado na busca
  const filteredOficinas = oficinasOptions.filter(o => 
    o.label.toLowerCase().includes(oficinaSearch.toLowerCase())
  );
  const filteredEditOficinas = oficinasOptions.filter(o => 
    o.label.toLowerCase().includes(editOficinaSearch.toLowerCase())
  );

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
    mutationFn: async (data: typeof newVehicle) => {
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
      queryClient.invalidateQueries({ queryKey: ['/api/veiculos/listar'] });
      setShowNewVehicleModal(false);
      setNewVehicle({ 
        plate: '', model: '', ownership: 'Murici', chassi: '', renavam: '',
        cidade: '', estado: '', cor: '', operacao: '', locadora: '',
        status: 'em_operacao', base: '', categoria: '', ano_fabricacao: '',
        ano_modelo: '', km: '', rastreador: '', data_inicio_operacao: ''
      });
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
      // Para datas no formato YYYY-MM-DD, formatar diretamente sem usar new Date para evitar problemas de timezone
      if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = date.split('-');
        return `${day}/${month}/${year}`;
      }
      // Para outros formatos (com timestamp), usar new Date com timezone do Brasil
      const d = new Date(date);
      if (isNaN(d.getTime()) || d.getFullYear() < 1900) return '-';
      return d.toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  // Função para formatar data ISO para input HTML (yyyy-MM-dd)
  const formatDateForInput = (date: string | null | undefined): string => {
    if (!date) return '';
    try {
      // Já está no formato correto
      if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return date;
      }
      // Data com timestamp ISO - extrair apenas a parte da data
      if (typeof date === 'string' && date.includes('T')) {
        return date.split('T')[0];
      }
      // Tentar converter para Date e extrair
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
      return '';
    } catch {
      return '';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  // Função para exportar dados de Em Manutenção para Excel
  const exportEmManutencaoToExcel = () => {
    const userName = user?.name?.toLowerCase() || '';
    let dadosParaExportar = filterPlacaEmManutencao
      ? dados.filter(d => d.placa?.toUpperCase().includes(filterPlacaEmManutencao))
      : dados;
    if (filterMinhaResponsabilidade && userName) {
      dadosParaExportar = dadosParaExportar.filter(d => {
        const focal = (d.focal || '').toLowerCase();
        const atendimento = (d.atendimento || '').toLowerCase();
        const responsavel = (d.responsavel || '').toLowerCase();
        return focal.includes(userName) || atendimento.includes(userName) || responsavel.includes(userName) || (userName.includes(focal) && focal.length > 2);
      });
    }

    const dataExport = dadosParaExportar.map((dado) => {
      const dataAgenda = dado.data_agenda ? new Date(dado.data_agenda + 'T00:00:00') : null;
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const diffTime = dataAgenda ? hoje.getTime() - dataAgenda.getTime() : 0;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diasParado = diffDays >= 0 ? diffDays : 0;

      return {
        'Placa': dado.placa || '',
        'Modelo': dado.modelo || '',
        'Status': dado.status || 'Em Manutenção',
        'Oficina': dado.oficina_debito || '',
        'Relato': dado.relato || '',
        'Data Início': formatDate(dado.data_agenda),
        'Dias Parado': diasParado,
        'Responsável': dado.focal || dado.atendimento || '',
        'KM': dado.km || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Em Manutenção');
    XLSX.writeFile(workbook, `veiculos_em_manutencao_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: 'Download concluído',
      description: `${dataExport.length} registros exportados para Excel.`,
    });
  };

  // Função para exportar dados de Finalizadas para Excel
  const exportFinalizadasToExcel = () => {
    if (!finalizadasData?.data) return;

    let dadosFiltrados = finalizadasData.data;
    
    if (finalizadasSearchPlaca) {
      dadosFiltrados = dadosFiltrados.filter(d => d.placa?.toUpperCase().includes(finalizadasSearchPlaca));
    }
    if (finalizadasFilterTipo) {
      dadosFiltrados = dadosFiltrados.filter(d => d.tipo === finalizadasFilterTipo);
    }
    if (finalizadasFilterOficina) {
      dadosFiltrados = dadosFiltrados.filter(d => d.oficina?.toLowerCase().includes(finalizadasFilterOficina.toLowerCase()));
    }

    const dataExport = dadosFiltrados.map((item: any) => ({
      'Placa': item.placa || '',
      'Modelo': item.modelo || '',
      'Tipo': item.tipo || '',
      'Oficina': item.oficina || '',
      'Descrição': item.descricao || '',
      'Data Entrada': formatDate(item.data_entrada),
      'Data Saída': formatDate(item.data_saida),
      'Dias Parado': item.dias_parado || 0,
      'Valor Peças': formatCurrency(item.valor_pecas || 0),
      'Valor MO': formatCurrency(item.valor_mo || 0),
      'Valor Total': formatCurrency(item.valor_total || 0),
      'Operação': item.operacao || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Finalizadas');
    XLSX.writeFile(workbook, `manutencoes_finalizadas_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: 'Download concluído',
      description: `${dataExport.length} registros exportados para Excel.`,
    });
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-950 dark:to-indigo-900 border-purple-200 col-span-2"
                onClick={() => setShowMovimentacoesModal(true)}
                data-testid="card-movimentacoes-manutencao"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Movimentação Diária
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Entradas */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ArrowDownCircle className="h-3 w-3 text-red-500" />
                        <span>Entraram</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-red-600">
                          {movimentacoes?.comparativo?.entradas?.hoje || 0}
                        </span>
                        <span className="text-xs text-muted-foreground">hoje</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {(movimentacoes?.comparativo?.entradas?.variacao || 0) > 0 ? (
                          <span className="text-xs text-red-500 flex items-center">
                            <TrendingUp className="h-3 w-3 mr-0.5" />
                            +{movimentacoes?.comparativo?.entradas?.variacao}
                          </span>
                        ) : (movimentacoes?.comparativo?.entradas?.variacao || 0) < 0 ? (
                          <span className="text-xs text-green-500 flex items-center">
                            <TrendingUp className="h-3 w-3 mr-0.5 rotate-180" />
                            {movimentacoes?.comparativo?.entradas?.variacao}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">=</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          vs {movimentacoes?.comparativo?.entradas?.ontem || 0} ontem
                        </span>
                      </div>
                    </div>
                    
                    {/* Saídas */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ArrowUpCircle className="h-3 w-3 text-green-500" />
                        <span>Saíram</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-green-600">
                          {movimentacoes?.comparativo?.saidas?.hoje || 0}
                        </span>
                        <span className="text-xs text-muted-foreground">hoje</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {(movimentacoes?.comparativo?.saidas?.variacao || 0) > 0 ? (
                          <span className="text-xs text-green-500 flex items-center">
                            <TrendingUp className="h-3 w-3 mr-0.5" />
                            +{movimentacoes?.comparativo?.saidas?.variacao}
                          </span>
                        ) : (movimentacoes?.comparativo?.saidas?.variacao || 0) < 0 ? (
                          <span className="text-xs text-red-500 flex items-center">
                            <TrendingUp className="h-3 w-3 mr-0.5 rotate-180" />
                            {movimentacoes?.comparativo?.saidas?.variacao}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">=</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          vs {movimentacoes?.comparativo?.saidas?.ontem || 0} ontem
                        </span>
                      </div>
                    </div>
                  </div>
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
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="recebimento" data-testid="tab-recebimento" className="relative">
                <ArrowDownCircle className="h-4 w-4 mr-2" />
                Recebimento OS
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
              <TabsTrigger value="fornecedores" data-testid="tab-fornecedores">
                <Building2 className="h-4 w-4 mr-2" />
                Fornecedores
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

            {/* Aba de Recebimento de OS */}
            <TabsContent value="recebimento">
              <RecebimentoOSTab />
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
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por placa..."
                        value={filterPlacaEmManutencao}
                        onChange={(e) => setFilterPlacaEmManutencao(e.target.value.toUpperCase())}
                        className="pl-9 w-[200px]"
                        data-testid="input-busca-placa-manutencao"
                      />
                    </div>
                    <Button
                      variant={filterMinhaResponsabilidade ? 'default' : 'outline'}
                      onClick={() => setFilterMinhaResponsabilidade(v => !v)}
                      className={filterMinhaResponsabilidade ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                      title={filterMinhaResponsabilidade ? 'Mostrando apenas minha responsabilidade' : 'Filtrar pela minha responsabilidade'}
                      data-testid="btn-minha-responsabilidade"
                    >
                      <User className="h-4 w-4 mr-2" />
                      {filterMinhaResponsabilidade ? 'Minha Lista' : 'Minha Responsabilidade'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={exportEmManutencaoToExcel}
                      data-testid="btn-download-manutencao"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Excel
                    </Button>
                    <Button 
                      onClick={() => {
                      setPlacaSearchInput('');
                      setShowPlacaDropdown(false);
                      setNewDadoDialogOpen(true);
                    }}
                      data-testid="btn-nova-manutencao"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Manutenção
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const userName = user?.name?.toLowerCase() || '';
                    let dadosFiltrados = filterPlacaEmManutencao
                      ? dados.filter(d => d.placa?.toUpperCase().includes(filterPlacaEmManutencao))
                      : dados;
                    if (filterMinhaResponsabilidade && userName) {
                      dadosFiltrados = dadosFiltrados.filter(d => {
                        const focal = (d.focal || '').toLowerCase();
                        const atendimento = (d.atendimento || '').toLowerCase();
                        const responsavel = (d.responsavel || '').toLowerCase();
                        return focal.includes(userName) || atendimento.includes(userName) || responsavel.includes(userName) || userName.includes(focal) && focal.length > 2;
                      });
                    }
                    return dadosFiltrados.length > 0 ? (
                    <div className="w-full">
                      <Table className="table-fixed w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px]">Placa</TableHead>
                            <TableHead className="w-[100px]">Base</TableHead>
                            <TableHead className="w-[100px]">Modelo</TableHead>
                            <TableHead className="w-[100px]">Status</TableHead>
                            <TableHead className="w-[90px]">Orçamento</TableHead>
                            <TableHead className="w-[120px]">Oficina</TableHead>
                            <TableHead className="w-[150px]">Relato</TableHead>
                            <TableHead className="w-[80px]">Início</TableHead>
                            <TableHead className="w-[70px]">Dias</TableHead>
                            <TableHead className="w-[100px]">Responsável</TableHead>
                            <TableHead className="w-[60px] text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dadosFiltrados.map((dado) => (
                            <TableRow key={dado.id} className={dado.orcamentos_pendentes && dado.orcamentos_pendentes > 0 ? 'bg-amber-50/50' : ''}>
                              <TableCell className="font-medium text-xs">{dado.placa}</TableCell>
                              <TableCell className="text-xs truncate" title={dado.base || '-'}>{dado.base || '-'}</TableCell>
                              <TableCell className="text-xs truncate" title={dado.modelo}>{dado.modelo || '-'}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline"
                                  className={`text-xs px-1.5 py-0.5 ${
                                    dado.status === 'Finalizado' 
                                      ? 'bg-green-100 text-green-700 border-green-300' 
                                      : dado.status === 'Aguardando Peças' || dado.status === 'Aguardando Peça'
                                      ? 'bg-amber-100 text-amber-700 border-amber-300'
                                      : dado.status === 'Em Orçamento' || dado.status === 'Orçamento Aprovado'
                                      ? 'bg-purple-100 text-purple-700 border-purple-300'
                                      : 'bg-blue-100 text-blue-700 border-blue-300'
                                  }`}
                                >
                                  {dado.status || 'Em Manut.'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {dado.total_orcamentos && dado.total_orcamentos > 0 ? (
                                  <div className="flex items-center">
                                    {dado.orcamentos_pendentes && dado.orcamentos_pendentes > 0 ? (
                                      <Badge 
                                        variant="outline" 
                                        className="bg-amber-100 text-amber-700 border-amber-300 animate-pulse text-xs px-1.5"
                                        title={`${dado.orcamentos_pendentes} orçamento(s) aguardando aprovação`}
                                      >
                                        <AlertCircle className="h-3 w-3 mr-0.5" />
                                        {dado.orcamentos_pendentes}
                                      </Badge>
                                    ) : (
                                      <Badge 
                                        variant="outline" 
                                        className="bg-green-100 text-green-700 border-green-300 text-xs px-1.5"
                                        title="Todos os orçamentos aprovados"
                                      >
                                        <CheckCircle className="h-3 w-3" />
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-xs">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs truncate" title={dado.oficina_debito}>{dado.oficina_debito || '-'}</TableCell>
                              <TableCell className="text-xs truncate" title={dado.relato}>{dado.relato || '-'}</TableCell>
                              <TableCell className="text-xs">{formatDate(dado.data_agenda)}</TableCell>
                              <TableCell>
                                {(() => {
                                  if (!dado.data_agenda) return '-';
                                  
                                  const dataAgendaStr = typeof dado.data_agenda === 'string' 
                                    ? dado.data_agenda.split('T')[0] 
                                    : String(dado.data_agenda);
                                  
                                  const [year, month, day] = dataAgendaStr.split('-').map(Number);
                                  const dataAgenda = new Date(year, month - 1, day);
                                  
                                  const hoje = new Date();
                                  hoje.setHours(0, 0, 0, 0);
                                  
                                  const diffTime = hoje.getTime() - dataAgenda.getTime();
                                  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                  const diasParado = diffDays >= 0 ? diffDays : 0;
                                  return (
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs px-1.5 py-0.5 ${
                                        diasParado >= 7 ? 'bg-red-100 text-red-700 border-red-300' :
                                        diasParado >= 3 ? 'bg-amber-100 text-amber-700 border-amber-300' :
                                        'bg-green-100 text-green-700 border-green-300'
                                      }`}
                                    >
                                      {diasParado}d
                                    </Badge>
                                  );
                                })()}
                              </TableCell>
                              <TableCell className="text-xs truncate" title={`${dado.focal || ''} / ${dado.atendimento || ''}`}>
                                {dado.focal || dado.atendimento || '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-0.5">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => {
                                      setSelectedDadoTimeline(dado);
                                      setShowTimelineModal(true);
                                    }}
                                    title="Histórico de Oficinas"
                                    data-testid={`btn-historico-dado-${dado.id}`}
                                  >
                                    <History className="h-3.5 w-3.5" />
                                  </Button>
                                  {(dado as any).is_os_request ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                      onClick={() => {
                                        setAndamentoTarget(dado);
                                        setAndamentoData({
                                          status_manutencao: (dado as any).status_manutencao || 'em_andamento',
                                          mecanico_responsavel: (dado as any).responsavel || '',
                                          observacoes_oficina: (dado as any).atendimento || '',
                                          pecas_utilizadas: (dado as any).pecas_utilizadas || '',
                                          valor_pecas: (dado as any).valor_pecas || '',
                                          valor_mao_obra: (dado as any).valor_mao_obra || ''
                                        });
                                        setShowAndamentoModal(true);
                                      }}
                                      title="Atualizar andamento da OS"
                                    >
                                      <Edit className="h-3.5 w-3.5 mr-1" />
                                      Atualizar
                                    </Button>
                                  ) : (
                                    <>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => handleEditDado(dado)}
                                        data-testid={`btn-edit-dado-${dado.id}`}
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => {
                                          setDeleteManutencaoTarget(dado);
                                          setDeleteManutencaoSenha('');
                                          setShowDeleteManutencaoModal(true);
                                        }}
                                        title="Excluir manutenção"
                                        data-testid={`btn-delete-dado-${dado.id}`}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </>
                                  )}
                                </div>
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
                  );
                  })()}
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
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Manutenções Finalizadas
                      </CardTitle>
                      <CardDescription>
                        Histórico completo de manutenções finalizadas com análise por placa
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={exportFinalizadasToExcel}
                      data-testid="btn-download-finalizadas"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Excel
                    </Button>
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
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                      <CheckCircle className="h-3 w-3" />
                                      {item.status_exibicao || 'Finalizado'}
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => syncBipMutation.mutate()}
                          disabled={syncBipMutation.isPending}
                          className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                        >
                          {syncBipMutation.isPending ? (
                            <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>Sincronizando...</>
                          ) : (
                            <><RefreshCw className="h-4 w-4 mr-2" />Sync Google Sheets</>
                          )}
                        </Button>
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
                              <TableHead>Facility</TableHead>
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
                                    <TableCell>{item.facility || '-'}</TableCell>
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

            {/* Aba de Fornecedores */}
            <TabsContent value="fornecedores">
              <FornecedoresTab />
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
                        <SelectItem value="Finalizado">Finalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 relative">
                    <Label>Oficina</Label>
                    <div className="relative">
                      <Input 
                        value={editingDado.oficina_debito || ''}
                        onChange={(e) => {
                          setEditingDado({...editingDado, oficina_debito: e.target.value});
                          setEditOficinaSearch(e.target.value);
                          setShowEditOficinaDropdown(true);
                        }}
                        onFocus={() => {
                          setEditOficinaSearch(editingDado.oficina_debito || '');
                          setShowEditOficinaDropdown(true);
                        }}
                        onBlur={() => setTimeout(() => setShowEditOficinaDropdown(false), 200)}
                        placeholder="Digite para buscar oficina"
                        className="bg-orange-50 border-orange-200"
                        data-testid="input-edit-oficina"
                      />
                      {showEditOficinaDropdown && filteredEditOficinas.length > 0 && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {filteredEditOficinas.slice(0, 10).map((oficina, idx) => (
                            <div
                              key={idx}
                              className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                              onMouseDown={() => {
                                setEditingDado({...editingDado, oficina_debito: oficina.value});
                                setShowEditOficinaDropdown(false);
                              }}
                            >
                              {oficina.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
                      value={formatDateForInput((editingDado as any).data_parada)}
                      onChange={(e) => setEditingDado({...editingDado, data_parada: e.target.value} as any)}
                      className="bg-orange-50 border-orange-200"
                      data-testid="input-edit-data-parada"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Início Manutenção</Label>
                    <Input 
                      type="date"
                      value={formatDateForInput((editingDado as any).data_inicio_manutencao)}
                      onChange={(e) => setEditingDado({...editingDado, data_inicio_manutencao: e.target.value} as any)}
                      className="bg-orange-50 border-orange-200"
                      data-testid="input-edit-data-inicio"
                    />
                  </div>
                  {editingDado.status === 'Finalizado' && (
                    <div className="space-y-2">
                      <Label>Data Finalização</Label>
                      <Input 
                        type="date"
                        value={formatDateForInput((editingDado as any).data_finalizacao)}
                        onChange={(e) => setEditingDado({...editingDado, data_finalizacao: e.target.value} as any)}
                        className="bg-orange-50 border-orange-200"
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
                      value={formatDateForInput(editingDado.data_agenda)}
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

              {/* Projeto e Base */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Projeto e Base</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Projeto</Label>
                    <Select 
                      value={editSelectedProjectId?.toString() || ''}
                      onValueChange={(value) => {
                        setEditSelectedProjectId(value ? parseInt(value) : null);
                        setEditSelectedBase('');
                      }}
                    >
                      <SelectTrigger data-testid="select-edit-project" className="bg-orange-50 border-orange-200">
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
                      value={editSelectedBase}
                      onValueChange={setEditSelectedBase}
                    >
                      <SelectTrigger data-testid="select-edit-base" className="bg-orange-50 border-orange-200">
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

              {/* Relato do Problema */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Relato do Problema</h4>
                <div className="space-y-2">
                  <textarea 
                    className="w-full min-h-[100px] p-3 border rounded-md bg-orange-50 border-orange-200"
                    value={editingDado.relato || ''}
                    onChange={(e) => setEditingDado({...editingDado, relato: e.target.value})}
                    placeholder="Descreva o problema ou serviço a ser realizado..."
                    data-testid="textarea-edit-relato"
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
                    onClick={addEditPeca}
                    data-testid="button-add-edit-peca"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Peça
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {editPecas.map((peca, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-orange-50/50 rounded-lg border border-orange-200">
                      <div className="flex-1">
                        <Input 
                          value={peca.nome}
                          onChange={(e) => updateEditPeca(index, 'nome', e.target.value)}
                          placeholder="Nome da peça ou serviço"
                          className="bg-white"
                          data-testid={`input-edit-peca-nome-${index}`}
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
                            onChange={(e) => updateEditPeca(index, 'valor', e.target.value)}
                            placeholder="0,00"
                            className="pl-9 bg-white"
                            data-testid={`input-edit-peca-valor-${index}`}
                          />
                        </div>
                      </div>
                      {editPecas.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeEditPeca(index)}
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-remove-edit-peca-${index}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {calcularTotalEditPecas() > 0 && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Total:</span>
                    <span className="font-bold text-lg text-primary">{formatCurrency(calcularTotalEditPecas())}</span>
                  </div>
                )}
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
                <div className="space-y-2 relative">
                  <Label>Placa *</Label>
                  <div className="relative">
                    <Input
                      value={placaSearchInput}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase();
                        setPlacaSearchInput(value);
                        setShowPlacaDropdown(value.length > 0);
                        if (!value) {
                          setNewDado({...newDado, placa: '', modelo: ''});
                        }
                      }}
                      onFocus={() => setShowPlacaDropdown(placaSearchInput.length > 0 || vehicles.length > 0)}
                      placeholder="Digite a placa..."
                      data-testid="input-search-placa"
                    />
                    {showPlacaDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                        {vehicles
                          .filter(v => 
                            !placaSearchInput || 
                            v.plate.toUpperCase().includes(placaSearchInput) ||
                            (v.model && v.model.toUpperCase().includes(placaSearchInput))
                          )
                          .slice(0, 20)
                          .map((vehicle) => (
                            <div
                              key={vehicle.id}
                              className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm border-b last:border-b-0"
                              onClick={() => {
                                setPlacaSearchInput(vehicle.plate);
                                setNewDado({
                                  ...newDado,
                                  placa: vehicle.plate,
                                  modelo: vehicle.model || newDado.modelo
                                });
                                setShowPlacaDropdown(false);
                              }}
                            >
                              <span className="font-medium">{vehicle.plate}</span>
                              <span className="text-muted-foreground ml-2">- {vehicle.model || 'Sem modelo'}</span>
                            </div>
                          ))
                        }
                        {vehicles.filter(v => 
                          !placaSearchInput || 
                          v.plate.toUpperCase().includes(placaSearchInput) ||
                          (v.model && v.model.toUpperCase().includes(placaSearchInput))
                        ).length === 0 && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            Nenhum veículo encontrado
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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

            {/* Status, Tipo e Oficina */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Status, Tipo e Oficina</h4>
              <div className="grid grid-cols-3 gap-4">
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
                      <SelectItem value="Finalizado">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Manutenção *</Label>
                  <Select 
                    value={newDado.tipo_manutencao || ''}
                    onValueChange={(value) => setNewDado({...newDado, tipo_manutencao: value})}
                  >
                    <SelectTrigger data-testid="select-new-tipo-manutencao">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Corretiva">Corretiva</SelectItem>
                      <SelectItem value="Preventiva">Preventiva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 relative">
                  <Label>Oficina</Label>
                  <div className="relative">
                    <Input 
                      value={newDado.oficina_debito || ''}
                      onChange={(e) => {
                        setNewDado({...newDado, oficina_debito: e.target.value});
                        setOficinaSearch(e.target.value);
                        setShowOficinaDropdown(true);
                      }}
                      onFocus={() => {
                        setOficinaSearch(newDado.oficina_debito || '');
                        setShowOficinaDropdown(true);
                      }}
                      onBlur={() => setTimeout(() => setShowOficinaDropdown(false), 200)}
                      placeholder="Digite para buscar oficina"
                      data-testid="input-new-oficina"
                    />
                    {showOficinaDropdown && filteredOficinas.length > 0 && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filteredOficinas.slice(0, 10).map((oficina, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                            onMouseDown={() => {
                              setNewDado({...newDado, oficina_debito: oficina.value});
                              setShowOficinaDropdown(false);
                            }}
                          >
                            {oficina.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Novo Veículo
            </DialogTitle>
            <DialogDescription>
              Cadastre um novo veículo na frota com todas as informações
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            <div className="space-y-2">
              <Label>Placa *</Label>
              <Input 
                value={newVehicle.plate} 
                onChange={(e) => setNewVehicle({...newVehicle, plate: e.target.value.toUpperCase()})}
                placeholder="ABC1234"
                maxLength={8}
                className="font-bold"
                data-testid="input-new-vehicle-plate"
              />
            </div>
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Select 
                value={newVehicle.model} 
                onValueChange={(val) => setNewVehicle({...newVehicle, model: val})}
              >
                <SelectTrigger data-testid="select-new-vehicle-model">
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
              <Label>Chassi</Label>
              <Input 
                value={newVehicle.chassi} 
                onChange={(e) => setNewVehicle({...newVehicle, chassi: e.target.value})}
                placeholder="Chassi do veículo"
              />
            </div>
            <div className="space-y-2">
              <Label>Renavam</Label>
              <Input 
                value={newVehicle.renavam} 
                onChange={(e) => setNewVehicle({...newVehicle, renavam: e.target.value})}
                placeholder="Código Renavam"
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input 
                value={newVehicle.cidade} 
                onChange={(e) => setNewVehicle({...newVehicle, cidade: e.target.value})}
                placeholder="Cidade do veículo"
              />
            </div>
            <div className="space-y-2">
              <Label>Estado (UF)</Label>
              <Input 
                value={newVehicle.estado} 
                onChange={(e) => setNewVehicle({...newVehicle, estado: e.target.value.toUpperCase()})}
                maxLength={2}
                placeholder="SP"
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <Input 
                value={newVehicle.cor} 
                onChange={(e) => setNewVehicle({...newVehicle, cor: e.target.value})}
                placeholder="Cor do veículo"
              />
            </div>
            <div className="space-y-2">
              <Label>Operação</Label>
              <Input 
                value={newVehicle.operacao} 
                onChange={(e) => setNewVehicle({...newVehicle, operacao: e.target.value})}
                placeholder="Nome da operação"
              />
            </div>
            <div className="space-y-2">
              <Label>Locadora</Label>
              <Input 
                value={newVehicle.locadora} 
                onChange={(e) => setNewVehicle({...newVehicle, locadora: e.target.value})}
                placeholder="Nome da locadora"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Posse</Label>
              <Select 
                value={newVehicle.ownership} 
                onValueChange={(val) => setNewVehicle({...newVehicle, ownership: val})}
              >
                <SelectTrigger data-testid="select-new-vehicle-ownership">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Murici">Murici</SelectItem>
                  <SelectItem value="Locada">Locada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Input 
                value={newVehicle.status} 
                onChange={(e) => setNewVehicle({...newVehicle, status: e.target.value})}
                placeholder="em_operacao"
              />
            </div>
            <div className="space-y-2">
              <Label>SVC (Base)</Label>
              <Input 
                value={newVehicle.base} 
                onChange={(e) => setNewVehicle({...newVehicle, base: e.target.value})}
                placeholder="Base do veículo"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input 
                value={newVehicle.categoria} 
                onChange={(e) => setNewVehicle({...newVehicle, categoria: e.target.value})}
                placeholder="Categoria do veículo"
              />
            </div>
            <div className="space-y-2">
              <Label>Ano Fabricação</Label>
              <Input 
                type="number"
                value={newVehicle.ano_fabricacao} 
                onChange={(e) => setNewVehicle({...newVehicle, ano_fabricacao: e.target.value})}
                placeholder="2024"
              />
            </div>
            <div className="space-y-2">
              <Label>Ano Modelo</Label>
              <Input 
                type="number"
                value={newVehicle.ano_modelo} 
                onChange={(e) => setNewVehicle({...newVehicle, ano_modelo: e.target.value})}
                placeholder="2024"
              />
            </div>
            <div className="space-y-2">
              <Label>KM Atual</Label>
              <Input 
                type="number"
                value={newVehicle.km} 
                onChange={(e) => setNewVehicle({...newVehicle, km: e.target.value})}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Rastreador</Label>
              <Input 
                value={newVehicle.rastreador} 
                onChange={(e) => setNewVehicle({...newVehicle, rastreador: e.target.value})}
                placeholder="ID do rastreador"
              />
            </div>
            <div className="space-y-2">
              <Label>Data Início Operação</Label>
              <Input 
                type="date"
                value={newVehicle.data_inicio_operacao} 
                onChange={(e) => setNewVehicle({...newVehicle, data_inicio_operacao: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNewVehicleModal(false);
                setNewVehicle({ 
                  plate: '', model: '', ownership: 'Murici', chassi: '', renavam: '',
                  cidade: '', estado: '', cor: '', operacao: '', locadora: '',
                  status: 'em_operacao', base: '', categoria: '', ano_fabricacao: '',
                  ano_modelo: '', km: '', rastreador: '', data_inicio_operacao: ''
                });
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

      {/* Modal de Atualização de Andamento de OS Direcionada */}
      <Dialog open={showAndamentoModal} onOpenChange={(open) => {
        if (!open) { setShowAndamentoModal(false); setAndamentoTarget(null); }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar Andamento da OS</DialogTitle>
            <DialogDescription>
              {andamentoTarget && (
                <span className="font-medium">
                  {andamentoTarget.numero_os || `OS #${andamentoTarget.id}`} — Placa: {andamentoTarget.placa} | Oficina: {andamentoTarget.oficina_debito}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Status do Andamento</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={andamentoData.status_manutencao}
                onChange={(e) => setAndamentoData({ ...andamentoData, status_manutencao: e.target.value })}
              >
                <option value="em_andamento">Em Andamento</option>
                <option value="aguardando_peca">Aguardando Peça</option>
                <option value="aguardando_aprovacao">Aguardando Aprovação</option>
                <option value="finalizado">Finalizado</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Mecânico Responsável</Label>
              <Input
                value={andamentoData.mecanico_responsavel}
                onChange={(e) => setAndamentoData({ ...andamentoData, mecanico_responsavel: e.target.value })}
                placeholder="Nome do mecânico"
              />
            </div>
            <div className="space-y-2">
              <Label>Observações / Andamento</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={andamentoData.observacoes_oficina}
                onChange={(e) => setAndamentoData({ ...andamentoData, observacoes_oficina: e.target.value })}
                placeholder="Descreva o andamento atual..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Peças Utilizadas</Label>
                <Input
                  value={andamentoData.pecas_utilizadas}
                  onChange={(e) => setAndamentoData({ ...andamentoData, pecas_utilizadas: e.target.value })}
                  placeholder="Ex: Filtro óleo, correia..."
                />
              </div>
              <div className="space-y-2">
                <Label>Valor das Peças (R$)</Label>
                <Input
                  type="number"
                  value={andamentoData.valor_pecas}
                  onChange={(e) => setAndamentoData({ ...andamentoData, valor_pecas: e.target.value })}
                  placeholder="0,00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Valor Mão de Obra (R$)</Label>
              <Input
                type="number"
                value={andamentoData.valor_mao_obra}
                onChange={(e) => setAndamentoData({ ...andamentoData, valor_mao_obra: e.target.value })}
                placeholder="0,00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAndamentoModal(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (andamentoTarget) {
                  andamentoMutation.mutate({ id: andamentoTarget.id, data: andamentoData });
                }
              }}
              disabled={andamentoMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {andamentoMutation.isPending ? 'Salvando...' : 'Salvar Andamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão de Manutenção com Senha */}
      <Dialog open={showDeleteManutencaoModal} onOpenChange={(open) => {
        if (!open) {
          setShowDeleteManutencaoModal(false);
          setDeleteManutencaoTarget(null);
          setDeleteManutencaoSenha('');
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Excluir Manutenção
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este registro de manutenção? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {deleteManutencaoTarget && (
            <div className="space-y-4 py-2">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                <p className="text-sm font-medium">Placa: <span className="text-red-700">{deleteManutencaoTarget.placa}</span></p>
                <p className="text-sm text-muted-foreground">Oficina: {deleteManutencaoTarget.oficina_debito || '-'}</p>
                <p className="text-sm text-muted-foreground">Status: {deleteManutencaoTarget.status || 'Em Manutenção'}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha-gestor" className="text-sm font-medium">
                  Senha do Gestor
                </Label>
                <Input
                  id="senha-gestor"
                  type="password"
                  placeholder="Digite a senha de gestor"
                  value={deleteManutencaoSenha}
                  onChange={(e) => setDeleteManutencaoSenha(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && deleteManutencaoSenha && deleteManutencaoTarget) {
                      deleteManutencaoMutation.mutate({ id: deleteManutencaoTarget.id, senha_gestor: deleteManutencaoSenha });
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">Informe a senha fornecida pela gestão de frota para confirmar a exclusão.</p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowDeleteManutencaoModal(false);
              setDeleteManutencaoTarget(null);
              setDeleteManutencaoSenha('');
            }}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              disabled={!deleteManutencaoSenha || deleteManutencaoMutation.isPending}
              onClick={() => {
                if (deleteManutencaoTarget && deleteManutencaoSenha) {
                  deleteManutencaoMutation.mutate({ id: deleteManutencaoTarget.id, senha_gestor: deleteManutencaoSenha });
                }
              }}
            >
              {deleteManutencaoMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Histórico de Oficinas/Orçamentos */}
      <Dialog open={showTimelineModal} onOpenChange={setShowTimelineModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Oficinas - {selectedDadoTimeline?.placa}
            </DialogTitle>
            <DialogDescription>
              Visualize o histórico de oficinas e orçamentos desta manutenção
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedDadoTimeline && (
              <ManutencaoTimeline 
                manutencaoId={selectedDadoTimeline.id}
                placa={selectedDadoTimeline.placa}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTimelineModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhamento - Movimentações de Manutenção */}
      <Dialog open={showMovimentacoesModal} onOpenChange={setShowMovimentacoesModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-700">
              <TrendingUp className="h-5 w-5" />
              Movimentações de Manutenção
            </DialogTitle>
            <DialogDescription>
              Detalhamento das entradas e saídas de manutenção de hoje
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex gap-4 mb-4">
              {/* Resumo do comparativo */}
              <div className="flex gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-red-50 rounded-md">
                  <ArrowDownCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-700">
                    Entradas hoje: {movimentacoes?.comparativo?.entradas?.hoje || 0}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (ontem: {movimentacoes?.comparativo?.entradas?.ontem || 0})
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-md">
                  <ArrowUpCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-700">
                    Saídas hoje: {movimentacoes?.comparativo?.saidas?.hoje || 0}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (ontem: {movimentacoes?.comparativo?.saidas?.ontem || 0})
                  </span>
                </div>
              </div>
            </div>

            <Tabs defaultValue="entradas" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="entradas" className="flex items-center gap-2">
                  <ArrowDownCircle className="h-4 w-4 text-red-500" />
                  Entradas ({movimentacoes?.entradas?.total || 0})
                </TabsTrigger>
                <TabsTrigger value="saidas" className="flex items-center gap-2">
                  <ArrowUpCircle className="h-4 w-4 text-green-500" />
                  Saídas ({movimentacoes?.saidas?.total || 0})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="entradas">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Placa</TableHead>
                        <TableHead>Data Entrada</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Oficina</TableHead>
                        <TableHead>Base</TableHead>
                        <TableHead>KM</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movimentacoes?.entradas?.registros?.length ? (
                        movimentacoes.entradas.registros.map((item: any, idx: number) => (
                          <TableRow key={`entrada-${idx}`}>
                            <TableCell className="font-bold">{item.placa}</TableCell>
                            <TableCell>{formatDate(item.data_entrada)}</TableCell>
                            <TableCell>
                              <Badge variant={item.tipo === 'Preventiva' ? 'default' : 'destructive'}>
                                {item.tipo || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{item.descricao || '-'}</TableCell>
                            <TableCell>{item.oficina || '-'}</TableCell>
                            <TableCell>{item.base || '-'}</TableCell>
                            <TableCell>{item.km ? item.km.toLocaleString('pt-BR') : '-'}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Nenhum veículo entrou em manutenção hoje
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="saidas">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Placa</TableHead>
                        <TableHead>Data Saída</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Oficina</TableHead>
                        <TableHead>Tempo Total</TableHead>
                        <TableHead>Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movimentacoes?.saidas?.registros?.length ? (
                        movimentacoes.saidas.registros.map((item: any, idx: number) => (
                          <TableRow key={`saida-${idx}`}>
                            <TableCell className="font-bold">{item.placa}</TableCell>
                            <TableCell>{formatDate(item.data_saida)}</TableCell>
                            <TableCell>
                              <Badge variant={item.tipo === 'Preventiva' ? 'default' : 'destructive'}>
                                {item.tipo || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{item.descricao || '-'}</TableCell>
                            <TableCell>{item.oficina || '-'}</TableCell>
                            <TableCell>
                              {item.tempo_total ? `${item.tempo_total} dias` : '-'}
                            </TableCell>
                            <TableCell className="text-green-600 font-medium">
                              {item.valor ? formatCurrency(Number(item.valor)) : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Nenhum veículo saiu da manutenção hoje
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMovimentacoesModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
