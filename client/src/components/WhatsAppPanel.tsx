import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Search,
  RefreshCcw,
  Settings,
  Plus,
  Trash2,
  Eye,
  Check,
  X
} from 'lucide-react';

interface WhatsAppMessage {
  id: number;
  grupo_nome: string;
  remetente_nome: string;
  remetente_numero: string;
  mensagem: string;
  is_alert: boolean;
  alert_type: string;
  status: string;
  respondido: boolean;
  data_mensagem: string;
}

interface WhatsAppAlert {
  id: number;
  tipo_alerta: string;
  descricao: string;
  prioridade: string;
  lido: boolean;
  mensagem: string;
  grupo_nome: string;
  remetente_nome: string;
  data_mensagem: string;
}

interface WhatsAppStats {
  totalMensagens: number;
  mensagensHoje: number;
  alertasPendentes: number;
  respondidasHoje: number;
  grupos: string[];
}

interface AlertRule {
  id: number;
  tipo: string;
  valor: string;
  descricao: string;
  prioridade: string;
  ativo: boolean;
}

export default function WhatsAppPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedGrupo, setSelectedGrupo] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRulesDialog, setShowRulesDialog] = useState(false);
  const [newRule, setNewRule] = useState({ tipo: 'palavra', valor: '', descricao: '', prioridade: 'normal' });

  const { data: stats, refetch: refetchStats } = useQuery<{ data: WhatsAppStats }>({
    queryKey: ['/api/whatsapp/stats'],
    refetchInterval: 30000,
  });

  const { data: messages, isLoading: loadingMessages, refetch: refetchMessages } = useQuery<{ data: WhatsAppMessage[], total: number }>({
    queryKey: ['/api/whatsapp/messages', selectedGrupo, selectedStatus],
    refetchInterval: 15000,
  });

  const { data: alerts, refetch: refetchAlerts } = useQuery<{ data: WhatsAppAlert[], naoLidos: number }>({
    queryKey: ['/api/whatsapp/alerts'],
    refetchInterval: 10000,
  });

  const { data: rules, refetch: refetchRules } = useQuery<{ data: AlertRule[] }>({
    queryKey: ['/api/whatsapp/rules'],
  });

  const markAlertReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/whatsapp/alerts/${id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lido_por: 'Admin' }),
      });
      return response.json();
    },
    onSuccess: () => {
      refetchAlerts();
      refetchStats();
    },
  });

  const markRespondedMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/whatsapp/messages/${id}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respondido_por: 'Admin' }),
      });
      return response.json();
    },
    onSuccess: () => {
      refetchMessages();
      refetchStats();
      toast({ title: 'Mensagem marcada como respondida' });
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: async (rule: typeof newRule) => {
      const response = await fetch('/api/whatsapp/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });
      return response.json();
    },
    onSuccess: () => {
      refetchRules();
      setNewRule({ tipo: 'palavra', valor: '', descricao: '', prioridade: 'normal' });
      toast({ title: 'Regra criada com sucesso' });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/whatsapp/rules/${id}`, { method: 'DELETE' });
      return response.json();
    },
    onSuccess: () => {
      refetchRules();
      toast({ title: 'Regra excluída' });
    },
  });

  const refreshAll = () => {
    refetchStats();
    refetchMessages();
    refetchAlerts();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      'baixa': 'bg-gray-500',
      'normal': 'bg-blue-500',
      'alta': 'bg-orange-500',
      'critica': 'bg-red-500',
    };
    return colors[priority] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <MessageSquare className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Central WhatsApp Clientes</h2>
            <p className="text-sm text-gray-500">Monitoramento de mensagens e alertas</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshAll}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowRulesDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Regras
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Alertas Pendentes</p>
                <p className="text-3xl font-bold text-red-700">{alerts?.naoLidos || 0}</p>
              </div>
              <Bell className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Mensagens Hoje</p>
                <p className="text-3xl font-bold text-blue-700">{stats?.data?.mensagensHoje || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Respondidas Hoje</p>
                <p className="text-3xl font-bold text-green-700">{stats?.data?.respondidasHoje || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Grupos Ativos</p>
                <p className="text-3xl font-bold text-purple-700">{stats?.data?.grupos?.length || 0}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-red-500" />
              Alertas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {alerts?.data?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mb-2 text-green-500" />
                  <p>Nenhum alerta pendente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts?.data?.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`p-3 rounded-lg border ${alert.lido ? 'bg-gray-50' : 'bg-red-50 border-red-200'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getPriorityBadge(alert.prioridade)}>
                              {alert.prioridade}
                            </Badge>
                            <span className="text-xs text-gray-500">{formatDate(alert.data_mensagem)}</span>
                          </div>
                          <p className="text-sm font-medium">{alert.grupo_nome}</p>
                          <p className="text-xs text-gray-600">{alert.remetente_nome}</p>
                          <p className="text-sm mt-1 text-gray-700 line-clamp-2">{alert.mensagem}</p>
                        </div>
                        {!alert.lido && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => markAlertReadMutation.mutate(alert.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              Mensagens Recentes
            </CardTitle>
            <div className="flex gap-2 mt-2">
              <Select value={selectedGrupo} onValueChange={setSelectedGrupo}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Grupos</SelectItem>
                  {stats?.data?.grupos?.map((grupo) => (
                    <SelectItem key={grupo} value={grupo}>{grupo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="respondido">Respondidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCcw className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : messages?.data?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mb-2" />
                  <p>Nenhuma mensagem encontrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages?.data?.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`p-3 rounded-lg border ${msg.is_alert ? 'bg-orange-50 border-orange-200' : 'bg-white'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-700">{msg.grupo_nome || 'Direto'}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{formatDate(msg.data_mensagem)}</span>
                            {msg.respondido && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Respondido
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-800">{msg.remetente_nome}</p>
                          <p className="text-sm mt-1 text-gray-600">{msg.mensagem}</p>
                        </div>
                        {!msg.respondido && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => markRespondedMutation.mutate(msg.id)}
                            title="Marcar como respondido"
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showRulesDialog} onOpenChange={setShowRulesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Regras de Alertas</DialogTitle>
            <DialogDescription>
              Configure palavras-chave e números para gerar alertas automáticos
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <Select value={newRule.tipo} onValueChange={(v) => setNewRule({ ...newRule, tipo: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="palavra">Palavra-chave</SelectItem>
                  <SelectItem value="numero">Número</SelectItem>
                </SelectContent>
              </Select>
              <Input 
                placeholder={newRule.tipo === 'palavra' ? 'Ex: atraso, urgente' : 'Ex: 5511999999999'}
                value={newRule.valor}
                onChange={(e) => setNewRule({ ...newRule, valor: e.target.value })}
              />
              <Select value={newRule.prioridade} onValueChange={(v) => setNewRule({ ...newRule, prioridade: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => createRuleMutation.mutate(newRule)} disabled={!newRule.valor}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>

            <div className="border rounded-lg">
              <div className="p-3 bg-gray-50 border-b font-medium text-sm">Regras Ativas</div>
              <ScrollArea className="h-[200px]">
                {rules?.data?.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">Nenhuma regra configurada</div>
                ) : (
                  <div className="divide-y">
                    {rules?.data?.map((rule) => (
                      <div key={rule.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{rule.tipo}</Badge>
                          <span className="font-medium">{rule.valor}</span>
                          <Badge className={getPriorityBadge(rule.prioridade)}>{rule.prioridade}</Badge>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteRuleMutation.mutate(rule.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRulesDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
