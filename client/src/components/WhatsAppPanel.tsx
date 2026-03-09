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
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
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
  X,
  Send,
  Reply,
  BellOff,
  History
} from 'lucide-react';

interface WhatsAppMessage {
  id: number;
  grupo_id: string;
  grupo_nome: string;
  remetente_nome: string;
  remetente_numero: string;
  mensagem: string;
  is_alert: boolean;
  alert_type: string;
  status: string;
  respondido: boolean;
  respondido_por: string;
  data_mensagem: string;
  is_outgoing: boolean;
}

interface WhatsAppAlert {
  id: number;
  message_id: number;
  tipo_alerta: string;
  descricao: string;
  prioridade: string;
  lido: boolean;
  mensagem: string;
  grupo_id: string;
  grupo_nome: string;
  remetente_nome: string;
  remetente_numero: string;
  data_mensagem: string;
}

interface WhatsAppStats {
  totalMensagens: number;
  mensagensHoje: number;
  alertasPendentes: number;
  respondidasHoje: number;
  grupos: string[];
  pendentesAgora: number;
  slaEmRisco: number;
  slaEstourado: number;
  tempoMedioResposta: number;
  topGrupos: { grupo_nome: string; total: number }[];
}

interface AlertRule {
  id: number;
  tipo: string;
  valor: string;
  descricao: string;
  prioridade: string;
  ativo: boolean;
}

interface CriticalRecipient {
  id: number;
  nome: string;
  telefone: string;
  rule_id: number | null;
  ativo: boolean;
  regra_valor?: string;
  regra_descricao?: string;
}

export default function WhatsAppPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedGrupo, setSelectedGrupo] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRulesDialog, setShowRulesDialog] = useState(false);
  const [showRecipientsDialog, setShowRecipientsDialog] = useState(false);
  const [newRule, setNewRule] = useState({ tipo: 'palavra', valor: '', descricao: '', prioridade: 'normal' });
  const [newRecipient, setNewRecipient] = useState({ nome: '', telefone: '', rule_id: null as number | null });
  const [replyingTo, setReplyingTo] = useState<WhatsAppMessage | null>(null);
  const [replyText, setReplyText] = useState('');

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

  const { data: recipients, refetch: refetchRecipients } = useQuery<{ data: CriticalRecipient[] }>({
    queryKey: ['/api/whatsapp/critical-recipients'],
  });

  const createRecipientMutation = useMutation({
    mutationFn: async (recipient: typeof newRecipient) => {
      const response = await fetch('/api/whatsapp/critical-recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipient),
      });
      return response.json();
    },
    onSuccess: () => {
      refetchRecipients();
      setNewRecipient({ nome: '', telefone: '', rule_id: null });
      toast({ title: 'Destinatário adicionado com sucesso' });
    },
  });

  const deleteRecipientMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/whatsapp/critical-recipients/${id}`, { method: 'DELETE' });
      return response.json();
    },
    onSuccess: () => {
      refetchRecipients();
      toast({ title: 'Destinatário removido' });
    },
  });

  const toggleRecipientMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: number; ativo: boolean }) => {
      const response = await fetch(`/api/whatsapp/critical-recipients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo }),
      });
      return response.json();
    },
    onSuccess: () => {
      refetchRecipients();
    },
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

  const sendReplyMutation = useMutation({
    mutationFn: async ({ messageId, phone, groupId, text }: { messageId: number; phone: string; groupId: string; text: string }) => {
      const response = await fetch('/api/whatsapp/send-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          phone,
          groupId,
          text,
          respondidoPor: user?.name || user?.email || 'Sistema'
        }),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: 'Resposta enviada com sucesso!' });
        setReplyingTo(null);
        setReplyText('');
        refetchMessages();
        refetchStats();
      } else {
        toast({ title: 'Erro ao enviar resposta', description: data.error, variant: 'destructive' });
      }
    },
    onError: () => {
      toast({ title: 'Erro ao enviar resposta', variant: 'destructive' });
    },
  });

  const handleSendReply = () => {
    if (!replyingTo || !replyText.trim()) return;
    const userName = user?.name || user?.email || 'Sistema';
    const formattedMessage = `${userName}: ${replyText.trim()}`;
    sendReplyMutation.mutate({
      messageId: replyingTo.id,
      phone: replyingTo.remetente_numero,
      groupId: replyingTo.grupo_id,
      text: formattedMessage
    });
  };

  const resolveMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await fetch('/api/whatsapp/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          userId: user?.id,
          userName: user?.name || user?.email || 'Sistema'
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      refetchMessages();
      refetchStats();
      toast({ title: 'Mensagem marcada como resolvida' });
    },
  });

  const snoozeMutation = useMutation({
    mutationFn: async ({ messageId, minutes }: { messageId: number; minutes: number }) => {
      const response = await fetch('/api/whatsapp/snooze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          minutes,
          userId: user?.id,
          userName: user?.name || user?.email || 'Sistema'
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      refetchMessages();
      toast({ title: 'Mensagem silenciada por 1 hora' });
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
          <Button variant="outline" size="sm" onClick={() => setShowRecipientsDialog(true)} className="border-red-200 text-red-600 hover:bg-red-50">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Notificações Críticas
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="pt-3 pb-3">
            <div className="text-center">
              <p className="text-xs text-red-600 font-medium">Pendentes Agora</p>
              <p className="text-2xl font-bold text-red-700">{stats?.data?.pendentesAgora || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-3 pb-3">
            <div className="text-center">
              <p className="text-xs text-orange-600 font-medium">SLA em Risco</p>
              <p className="text-2xl font-bold text-orange-700">{stats?.data?.slaEmRisco || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-100 to-red-200 border-red-300">
          <CardContent className="pt-3 pb-3">
            <div className="text-center">
              <p className="text-xs text-red-700 font-medium">SLA Estourado</p>
              <p className="text-2xl font-bold text-red-800">{stats?.data?.slaEstourado || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-3 pb-3">
            <div className="text-center">
              <p className="text-xs text-blue-600 font-medium">Mensagens Hoje</p>
              <p className="text-2xl font-bold text-blue-700">{stats?.data?.mensagensHoje || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-3 pb-3">
            <div className="text-center">
              <p className="text-xs text-green-600 font-medium">Respondidas</p>
              <p className="text-2xl font-bold text-green-700">{stats?.data?.respondidasHoje || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-3 pb-3">
            <div className="text-center">
              <p className="text-xs text-purple-600 font-medium">Tempo Médio</p>
              <p className="text-2xl font-bold text-purple-700">{stats?.data?.tempoMedioResposta || 0}m</p>
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
                        <div className="flex gap-1">
                          {!alert.lido && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setReplyingTo({
                                  id: alert.message_id,
                                  grupo_id: alert.grupo_id,
                                  grupo_nome: alert.grupo_nome,
                                  remetente_nome: alert.remetente_nome,
                                  remetente_numero: alert.remetente_numero,
                                  mensagem: alert.mensagem,
                                  is_alert: true,
                                  alert_type: alert.tipo_alerta,
                                  status: 'pending',
                                  respondido: false,
                                  respondido_por: '',
                                  data_mensagem: alert.data_mensagem,
                                  is_outgoing: false
                                })}
                                title="Responder"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Reply className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => markAlertReadMutation.mutate(alert.id)}
                                title="Marcar como lido"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
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
                      className={`p-3 rounded-lg border ${msg.is_outgoing ? 'bg-green-50 border-green-200' : msg.is_alert ? 'bg-orange-50 border-orange-200' : 'bg-white'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                              {msg.grupo_nome || 'Mensagem Direta'}
                            </Badge>
                            <span className="text-xs text-gray-500">{formatDate(msg.data_mensagem)}</span>
                            {msg.is_outgoing && (
                              <Badge variant="outline" className="text-blue-600 border-blue-600">
                                Enviada
                              </Badge>
                            )}
                            {msg.respondido && !msg.is_outgoing && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Respondido por {msg.respondido_por}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-800">{msg.remetente_nome || 'Desconhecido'}</p>
                          <p className="text-sm mt-1 text-gray-600">{msg.mensagem}</p>
                        </div>
                        {!msg.respondido && !msg.is_outgoing && (
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setReplyingTo(msg)}
                              title="Responder"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Reply className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => resolveMutation.mutate(msg.id)}
                              title="Marcar como resolvido"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => snoozeMutation.mutate({ messageId: msg.id, minutes: 60 })}
                              title="Silenciar 1h"
                              className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            >
                              <BellOff className="h-4 w-4" />
                            </Button>
                          </div>
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

      {/* Dialog de Resposta */}
      <Dialog open={!!replyingTo} onOpenChange={(open) => !open && setReplyingTo(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Reply className="h-5 w-5 text-blue-600" />
              Responder Mensagem
            </DialogTitle>
            <DialogDescription>
              Enviando resposta como: <strong>{user?.name || user?.email || 'Sistema'}</strong>
            </DialogDescription>
          </DialogHeader>
          
          {replyingTo && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                    {replyingTo.grupo_nome || 'Mensagem Direta'}
                  </Badge>
                  <span className="text-xs text-gray-500">{formatDate(replyingTo.data_mensagem)}</span>
                </div>
                <p className="text-sm font-medium">{replyingTo.remetente_nome || 'Desconhecido'}</p>
                <p className="text-sm text-gray-600 mt-1">{replyingTo.mensagem}</p>
              </div>

              <div>
                <Label htmlFor="reply-text">Sua resposta</Label>
                <Textarea
                  id="reply-text"
                  placeholder="Digite sua resposta..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setReplyingTo(null); setReplyText(''); }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSendReply}
              disabled={!replyText.trim() || sendReplyMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {sendReplyMutation.isPending ? (
                <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar Resposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Destinatários Críticos */}
      <Dialog open={showRecipientsDialog} onOpenChange={setShowRecipientsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Notificações de Alertas Críticos
            </DialogTitle>
            <DialogDescription>
              Configure números de telefone para receber notificações quando alertas críticos forem detectados
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <Input 
                placeholder="Nome"
                value={newRecipient.nome}
                onChange={(e) => setNewRecipient({ ...newRecipient, nome: e.target.value })}
              />
              <Input 
                placeholder="Telefone (ex: 5511999999999)"
                value={newRecipient.telefone}
                onChange={(e) => setNewRecipient({ ...newRecipient, telefone: e.target.value })}
              />
              <Select 
                value={newRecipient.rule_id?.toString() || 'global'} 
                onValueChange={(v) => setNewRecipient({ ...newRecipient, rule_id: v === 'global' ? null : parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Regra específica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Todas as regras</SelectItem>
                  {rules?.data?.filter(r => r.prioridade === 'critica').map((rule) => (
                    <SelectItem key={rule.id} value={rule.id.toString()}>
                      {rule.valor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={() => createRecipientMutation.mutate(newRecipient)} 
                disabled={!newRecipient.nome || !newRecipient.telefone}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>

            <div className="border rounded-lg">
              <div className="p-3 bg-red-50 border-b font-medium text-sm text-red-700 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Destinatários Configurados
              </div>
              <ScrollArea className="h-[200px]">
                {recipients?.data?.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Nenhum destinatário configurado. Adicione números para receber alertas críticos.
                  </div>
                ) : (
                  <div className="divide-y">
                    {recipients?.data?.map((recipient) => (
                      <div key={recipient.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${recipient.ativo ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <div>
                            <span className="font-medium">{recipient.nome}</span>
                            <p className="text-xs text-gray-500">{recipient.telefone}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {recipient.rule_id ? `Regra: ${recipient.regra_valor}` : 'Todas as regras'}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => toggleRecipientMutation.mutate({ id: recipient.id, ativo: !recipient.ativo })}
                            title={recipient.ativo ? 'Desativar' : 'Ativar'}
                          >
                            {recipient.ativo ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteRecipientMutation.mutate(recipient.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <strong>Como funciona:</strong> Quando um alerta com prioridade "Crítica" for detectado, 
              todos os destinatários ativos receberão uma mensagem no WhatsApp com os detalhes do alerta.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecipientsDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
