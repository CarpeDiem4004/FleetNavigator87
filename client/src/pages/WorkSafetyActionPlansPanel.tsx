import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ClipboardList, Search, Filter, TrendingUp, 
  Calendar, RefreshCw, CheckCircle, Clock, AlertCircle, 
  Plus, Edit, Trash2, Phone, MessageCircle, ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Link } from 'wouter';

interface ActionPlan {
  id: number;
  status: string;
  data_abertura: string;
  prazo_final: string;
  origem_acao: string;
  placa: string | null;
  data_ocorrencia: string | null;
  operacao: string;
  base_operacao: string | null;
  acao_proposta: string;
  responsavel_nome: string;
  responsavel_telefone: string | null;
  responsavel_email: string | null;
  observacoes: string | null;
  data_conclusao: string | null;
  criado_por: string;
  notificado_whatsapp: boolean;
  statusAtualizado: string;
  origemLabel: string;
  statusLabel: string;
  created_at: string;
}

interface ActionPlanStats {
  emAndamento: number;
  concluidos: number;
  atrasados: number;
  total: number;
  porOrigem: { origem: string; origemLabel: string; count: number }[];
}

const ORIGIN_LABELS: Record<string, string> = {
  investigacao: 'Investigação',
  telemetria: 'Telemetria',
  gestao_relatos: 'Gestão de Relatos',
  preventiva: 'Preventiva',
  campanhas: 'Campanhas'
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  em_andamento: { label: 'Em Andamento', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Clock },
  concluido: { label: 'Concluído', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
  atrasado: { label: 'Atrasado', color: 'text-red-700', bgColor: 'bg-red-100', icon: AlertCircle }
};

function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

export default function WorkSafetyActionPlansPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterOrigem, setFilterOrigem] = useState('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ActionPlan | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    prazoFinal: '',
    origemAcao: '',
    placa: '',
    dataOcorrencia: '',
    operacao: '',
    baseOperacao: '',
    acaoProposta: '',
    responsavelNome: '',
    responsavelTelefone: '',
    responsavelEmail: '',
    observacoes: '',
    status: 'em_andamento'
  });

  const { data: plansResponse, isLoading, refetch } = useQuery({
    queryKey: ['/api/work-safety/action-plans', filterStatus, filterOrigem, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'todos') params.append('status', filterStatus);
      if (filterOrigem !== 'todos') params.append('origem', filterOrigem);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/work-safety/action-plans?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar planos: ${response.status}`);
      }
      
      return response.json();
    }
  });

  const { data: statsResponse } = useQuery({
    queryKey: ['/api/work-safety/action-plans/stats'],
    queryFn: async () => {
      const response = await fetch('/api/work-safety/action-plans/stats', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar estatísticas: ${response.status}`);
      }
      
      return response.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/work-safety/action-plans', {
        ...data,
        criadoPor: user?.name || user?.email || 'Sistema'
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Plano de ação criado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/work-safety/action-plans'] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message || 'Erro ao criar plano de ação', variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PUT', `/api/work-safety/action-plans/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Plano de ação atualizado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/work-safety/action-plans'] });
      setDialogOpen(false);
      setSelectedPlan(null);
      setIsEditing(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message || 'Erro ao atualizar plano de ação', variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/work-safety/action-plans/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Plano de ação excluído com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/work-safety/action-plans'] });
      setDeleteDialogOpen(false);
      setSelectedPlan(null);
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message || 'Erro ao excluir plano de ação', variant: 'destructive' });
    }
  });

  const notifyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/work-safety/action-plans/${id}/notify`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao preparar notificação');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.data?.whatsappUrl) {
        window.open(data.data.whatsappUrl, '_blank');
        toast({ title: 'Sucesso', description: 'Link do WhatsApp aberto. Envie a mensagem manualmente.' });
        queryClient.invalidateQueries({ queryKey: ['/api/work-safety/action-plans'] });
      }
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message || 'Erro ao notificar responsável', variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setFormData({
      prazoFinal: '',
      origemAcao: '',
      placa: '',
      dataOcorrencia: '',
      operacao: '',
      baseOperacao: '',
      acaoProposta: '',
      responsavelNome: '',
      responsavelTelefone: '',
      responsavelEmail: '',
      observacoes: '',
      status: 'em_andamento'
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsEditing(false);
    setSelectedPlan(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (plan: ActionPlan) => {
    setSelectedPlan(plan);
    setIsEditing(true);
    setFormData({
      prazoFinal: plan.prazo_final ? new Date(plan.prazo_final).toISOString().split('T')[0] : '',
      origemAcao: plan.origem_acao,
      placa: plan.placa || '',
      dataOcorrencia: plan.data_ocorrencia ? new Date(plan.data_ocorrencia).toISOString().split('T')[0] : '',
      operacao: plan.operacao,
      baseOperacao: plan.base_operacao || '',
      acaoProposta: plan.acao_proposta,
      responsavelNome: plan.responsavel_nome,
      responsavelTelefone: plan.responsavel_telefone || '',
      responsavelEmail: plan.responsavel_email || '',
      observacoes: plan.observacoes || '',
      status: plan.statusAtualizado || plan.status
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.prazoFinal || !formData.origemAcao || !formData.operacao || !formData.acaoProposta || !formData.responsavelNome) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    if (isEditing && selectedPlan) {
      updateMutation.mutate({ id: selectedPlan.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const plans: ActionPlan[] = plansResponse?.data || [];
  const stats: ActionPlanStats = statsResponse?.data || { emAndamento: 0, concluidos: 0, atrasados: 0, total: 0, porOrigem: [] };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/work-safety">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="h-7 w-7 text-[#E10613]" />
              Controle de Planos de Ação
            </h1>
            <p className="text-gray-600">Gestão de planos de ação da Segurança do Trabalho</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Em Andamento</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.emAndamento}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Atrasados</p>
                  <p className="text-2xl font-bold text-red-600">{stats.atrasados}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Concluídos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.concluidos}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-gray-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-gray-700">{stats.total}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-gray-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="text-lg">Planos de Ação</CardTitle>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar..."
                    className="pl-9 w-48"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="atrasado">Atrasado</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterOrigem} onValueChange={setFilterOrigem}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as Origens</SelectItem>
                    <SelectItem value="investigacao">Investigação</SelectItem>
                    <SelectItem value="telemetria">Telemetria</SelectItem>
                    <SelectItem value="gestao_relatos">Gestão de Relatos</SelectItem>
                    <SelectItem value="preventiva">Preventiva</SelectItem>
                    <SelectItem value="campanhas">Campanhas</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
                <Button className="bg-[#E10613] hover:bg-[#B8050F]" onClick={handleOpenCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Plano
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum plano de ação encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Operação</TableHead>
                      <TableHead>Ação Proposta</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan) => {
                      const statusConfig = STATUS_CONFIG[plan.statusAtualizado] || STATUS_CONFIG.em_andamento;
                      const StatusIcon = statusConfig.icon;
                      return (
                        <TableRow key={plan.id}>
                          <TableCell>
                            <Badge className={`${statusConfig.bgColor} ${statusConfig.color} gap-1`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{plan.origemLabel}</span>
                          </TableCell>
                          <TableCell className="font-medium">{plan.operacao}</TableCell>
                          <TableCell>
                            <span className="line-clamp-2 text-sm max-w-xs">{plan.acao_proposta}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{plan.responsavel_nome}</span>
                              {plan.responsavel_telefone && (
                                <span className="text-xs text-gray-500">{plan.responsavel_telefone}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={plan.statusAtualizado === 'atrasado' ? 'text-red-600 font-medium' : ''}>
                              {formatDate(plan.prazo_final)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {plan.placa || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {plan.responsavel_telefone && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => notifyMutation.mutate(plan.id)}
                                  title="Enviar WhatsApp"
                                >
                                  <MessageCircle className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleOpenEdit(plan)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setSelectedPlan(plan);
                                  setDeleteDialogOpen(true);
                                }}
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Editar Plano de Ação' : 'Novo Plano de Ação'}</DialogTitle>
              <DialogDescription>
                {isEditing ? 'Atualize as informações do plano de ação' : 'Preencha os dados para criar um novo plano de ação'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Origem da Ação *</Label>
                  <Select value={formData.origemAcao} onValueChange={(v) => setFormData({...formData, origemAcao: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="investigacao">Investigação</SelectItem>
                      <SelectItem value="telemetria">Telemetria</SelectItem>
                      <SelectItem value="gestao_relatos">Gestão de Relatos</SelectItem>
                      <SelectItem value="preventiva">Preventiva</SelectItem>
                      <SelectItem value="campanhas">Campanhas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prazo Final *</Label>
                  <Input
                    type="date"
                    value={formData.prazoFinal}
                    onChange={(e) => setFormData({...formData, prazoFinal: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Operação *</Label>
                  <Input
                    placeholder="Ex: MELI - Vitória"
                    value={formData.operacao}
                    onChange={(e) => setFormData({...formData, operacao: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Base (opcional)</Label>
                  <Input
                    placeholder="Base de operação"
                    value={formData.baseOperacao}
                    onChange={(e) => setFormData({...formData, baseOperacao: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Placa (opcional)</Label>
                  <Input
                    placeholder="ABC1234"
                    value={formData.placa}
                    onChange={(e) => setFormData({...formData, placa: e.target.value.toUpperCase()})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data da Ocorrência (opcional)</Label>
                  <Input
                    type="date"
                    value={formData.dataOcorrencia}
                    onChange={(e) => setFormData({...formData, dataOcorrencia: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ação Proposta *</Label>
                <Textarea
                  placeholder="Descreva a ação proposta..."
                  rows={3}
                  value={formData.acaoProposta}
                  onChange={(e) => setFormData({...formData, acaoProposta: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Responsável *</Label>
                  <Input
                    placeholder="Nome completo"
                    value={formData.responsavelNome}
                    onChange={(e) => setFormData({...formData, responsavelNome: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone do Responsável</Label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={formData.responsavelTelefone}
                    onChange={(e) => setFormData({...formData, responsavelTelefone: formatPhone(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>E-mail do Responsável</Label>
                  <Input
                    type="email"
                    placeholder="email@empresa.com"
                    value={formData.responsavelEmail}
                    onChange={(e) => setFormData({...formData, responsavelEmail: e.target.value})}
                  />
                </div>
                {isEditing && (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                        <SelectItem value="atrasado">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Observações adicionais..."
                  rows={2}
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                className="bg-[#E10613] hover:bg-[#B8050F]" 
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {isEditing ? 'Salvar Alterações' : 'Criar Plano'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir este plano de ação? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={() => selectedPlan && deleteMutation.mutate(selectedPlan.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
