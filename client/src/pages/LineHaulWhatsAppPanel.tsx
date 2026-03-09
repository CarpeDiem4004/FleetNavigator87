import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { 
  MessageSquare, 
  Clock, 
  AlertTriangle,
  AlertCircle,
  Bell,
  RefreshCcw,
  Settings,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  User,
  Users,
  Truck,
  CreditCard,
  Fuel,
  Send,
  History,
  X,
  Eye,
  Lock,
  Unlock,
  MessageCircle
} from 'lucide-react';

interface WhatsAppMessage {
  id: string;
  type: 'incoming' | 'outgoing';
  senderType: 'automatico' | 'operador' | 'sistema' | 'motorista';
  category: 'solicitacao_recarga' | 'aprovacao' | 'negacao' | 'outro';
  conversationType: 'grupo' | 'individual';
  groupName?: string;
  plate: string;
  driver: string;
  base?: string;
  content: string;
  timestamp: Date;
  status: 'pendente' | 'em_atendimento' | 'respondido' | 'finalizado';
  attendantId?: string;
  attendantName?: string;
  provider?: string;
  requestedValue?: number;
  approvedValue?: number;
  approvedBy?: string;
}

interface Conversation {
  id: string;
  type: 'grupo' | 'individual';
  name: string;
  project?: string;
  plate?: string;
  base?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  status: 'pendente' | 'em_atendimento' | 'finalizado';
  attendantId?: string;
  attendantName?: string;
  messages: WhatsAppMessage[];
}

interface AttendanceLog {
  id: string;
  action: string;
  userName: string;
  timestamp: Date;
  type: 'inicio' | 'resposta' | 'finalizacao' | 'sistema';
}

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  keyword: string;
  timestamp: Date;
  conversationId?: string;
}

export default function LineHaulWhatsAppPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationFilter, setConversationFilter] = useState<'todos' | 'grupos' | 'individuais'>('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [newMessage, setNewMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const [stats, setStats] = useState({
    pendentesAgora: 3,
    slaEmRisco: 1,
    slaEstourado: 48,
    mensagensHoje: 4,
    respondidas: 12,
    tempoMedio: '5m'
  });

  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      severity: 'critical',
      title: 'LINE HAUL',
      keyword: 'ALERTA CRITICO',
      timestamp: new Date(Date.now() - 1000 * 60 * 2),
      conversationId: '1'
    },
    {
      id: '2',
      severity: 'critical',
      title: 'LINE HAUL',
      keyword: 'ALERTA CRITICO',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      conversationId: '2'
    },
    {
      id: '3',
      severity: 'warning',
      title: 'ABASTECIMENTO',
      keyword: 'URGENTE',
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      conversationId: '3'
    }
  ]);

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      type: 'grupo',
      name: 'Gestao Line Haul',
      project: 'Line Haul',
      lastMessage: 'Solicitacao de recarga pendente',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 3),
      unreadCount: 2,
      status: 'pendente',
      messages: [
        {
          id: 'm1',
          type: 'incoming',
          senderType: 'motorista',
          category: 'solicitacao_recarga',
          conversationType: 'grupo',
          groupName: 'Gestao Line Haul',
          plate: 'SSX5J28',
          driver: 'Rafael Santos',
          content: 'Preciso de recarga R$ 220,00 para viagem SP-RJ',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          status: 'pendente',
          provider: 'Ticket',
          requestedValue: 220
        },
        {
          id: 'm2',
          type: 'incoming',
          senderType: 'motorista',
          category: 'solicitacao_recarga',
          conversationType: 'grupo',
          groupName: 'Gestao Line Haul',
          plate: 'SSX5J28',
          driver: 'Rafael Santos',
          content: 'Aguardando liberacao',
          timestamp: new Date(Date.now() - 1000 * 60 * 3),
          status: 'pendente'
        }
      ]
    },
    {
      id: '2',
      type: 'individual',
      name: 'Wanderlei Pacheco',
      plate: 'FCV3I24',
      base: 'Line Haul',
      lastMessage: 'Recarga aprovada R$ 343,00',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 8),
      unreadCount: 0,
      status: 'finalizado',
      attendantId: '1',
      attendantName: 'Priscila Daiane',
      messages: [
        {
          id: 'm3',
          type: 'incoming',
          senderType: 'motorista',
          category: 'solicitacao_recarga',
          conversationType: 'individual',
          plate: 'FCV3I24',
          driver: 'Wanderlei Pacheco',
          content: 'Preciso de recarga Ticket R$ 343,00',
          timestamp: new Date(Date.now() - 1000 * 60 * 45),
          status: 'finalizado',
          provider: 'Ticket',
          requestedValue: 343
        },
        {
          id: 'm4',
          type: 'outgoing',
          senderType: 'operador',
          category: 'aprovacao',
          conversationType: 'individual',
          plate: 'FCV3I24',
          driver: 'Wanderlei Pacheco',
          content: 'Recarga aprovada! Valor R$ 343,00 liberado no cartao Ticket.',
          timestamp: new Date(Date.now() - 1000 * 60 * 8),
          status: 'finalizado',
          attendantId: '1',
          attendantName: 'Priscila Daiane',
          approvedValue: 343
        }
      ]
    },
    {
      id: '3',
      type: 'individual',
      name: 'Andrei Silva',
      plate: 'RUW5D84',
      base: 'XPT Sao Mateus',
      lastMessage: 'Cartao Veloe sem saldo',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 15),
      unreadCount: 1,
      status: 'em_atendimento',
      attendantId: user?.id?.toString(),
      attendantName: user?.name || 'Operador',
      messages: [
        {
          id: 'm5',
          type: 'incoming',
          senderType: 'motorista',
          category: 'solicitacao_recarga',
          conversationType: 'individual',
          plate: 'RUW5D84',
          driver: 'Andrei Silva',
          base: 'XPT Sao Mateus',
          content: 'Cartao Veloe sem saldo, preciso abastecer urgente',
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          status: 'em_atendimento',
          provider: 'Veloe Go',
          requestedValue: 180
        }
      ]
    },
    {
      id: '4',
      type: 'grupo',
      name: 'Abastecimento Murici',
      project: 'Abastecimento',
      lastMessage: 'Nova solicitacao de abastecimento',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 20),
      unreadCount: 3,
      status: 'pendente',
      messages: []
    }
  ]);

  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([
    {
      id: 'l1',
      action: 'Mensagem recebida',
      userName: 'Sistema',
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      type: 'sistema'
    },
    {
      id: 'l2',
      action: 'Atendimento iniciado',
      userName: user?.name || 'Operador',
      timestamp: new Date(Date.now() - 1000 * 60 * 40),
      type: 'inicio'
    },
    {
      id: 'l3',
      action: 'Resposta enviada',
      userName: user?.name || 'Operador',
      timestamp: new Date(Date.now() - 1000 * 60 * 8),
      type: 'resposta'
    }
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Atualizado",
      description: "Dados atualizados com sucesso"
    });
    setIsLoading(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleSelectConversation = (conv: Conversation) => {
    if (conv.status === 'pendente') {
      const updatedConv = {
        ...conv,
        status: 'em_atendimento' as const,
        attendantId: user?.id?.toString(),
        attendantName: user?.name || 'Operador',
        unreadCount: 0
      };
      
      setConversations(prev => prev.map(c => 
        c.id === conv.id ? updatedConv : c
      ));
      
      setSelectedConversation(updatedConv);
      
      setAttendanceLogs(prev => [...prev, {
        id: `l${Date.now()}`,
        action: 'Atendimento iniciado',
        userName: user?.name || 'Operador',
        timestamp: new Date(),
        type: 'inicio'
      }]);
      
      toast({
        title: "Atendimento iniciado",
        description: `Voce assumiu o atendimento de ${conv.name}`
      });
    } else {
      setSelectedConversation({...conv, unreadCount: 0});
      setConversations(prev => prev.map(c => 
        c.id === conv.id ? {...c, unreadCount: 0} : c
      ));
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    const canRespond = !selectedConversation.attendantId || 
                       selectedConversation.attendantId === user?.id?.toString();
    
    if (!canRespond) {
      toast({
        title: "Bloqueado",
        description: `Este atendimento esta com ${selectedConversation.attendantName}`,
        variant: "destructive"
      });
      return;
    }

    const newMsg: WhatsAppMessage = {
      id: `m${Date.now()}`,
      type: 'outgoing',
      senderType: 'operador',
      category: 'outro',
      conversationType: selectedConversation.type,
      plate: selectedConversation.plate || '',
      driver: selectedConversation.name,
      content: newMessage,
      timestamp: new Date(),
      status: 'respondido',
      attendantId: user?.id?.toString(),
      attendantName: user?.name || 'Operador'
    };

    const updatedConv = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, newMsg],
      lastMessage: newMessage,
      lastMessageTime: new Date(),
      status: 'em_atendimento' as const
    };

    setSelectedConversation(updatedConv);
    setConversations(prev => prev.map(c => 
      c.id === selectedConversation.id ? updatedConv : c
    ));

    setAttendanceLogs(prev => [...prev, {
      id: `l${Date.now()}`,
      action: 'Resposta enviada',
      userName: user?.name || 'Operador',
      timestamp: new Date(),
      type: 'resposta'
    }]);

    setNewMessage('');
    toast({ title: "Mensagem enviada" });
  };

  const handleFinishAttendance = () => {
    if (!selectedConversation) return;

    const updatedConv = {
      ...selectedConversation,
      status: 'finalizado' as const
    };

    setSelectedConversation(updatedConv);
    setConversations(prev => prev.map(c => 
      c.id === selectedConversation.id ? updatedConv : c
    ));

    setAttendanceLogs(prev => [...prev, {
      id: `l${Date.now()}`,
      action: 'Atendimento finalizado',
      userName: user?.name || 'Operador',
      timestamp: new Date(),
      type: 'finalizacao'
    }]);

    toast({
      title: "Atendimento finalizado",
      description: "A conversa foi marcada como concluida"
    });
  };

  const filteredConversations = conversations.filter(conv => {
    if (conversationFilter === 'grupos' && conv.type !== 'grupo') return false;
    if (conversationFilter === 'individuais' && conv.type !== 'individual') return false;
    if (statusFilter !== 'todos' && conv.status !== statusFilter) return false;
    return true;
  }).sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge className="bg-yellow-500 text-white text-xs">Pendente</Badge>;
      case 'em_atendimento':
        return <Badge className="bg-blue-500 text-white text-xs">Em Atendimento</Badge>;
      case 'finalizado':
        return <Badge className="bg-green-500 text-white text-xs">Finalizado</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">-</Badge>;
    }
  };

  const getSenderBadge = (senderType: string) => {
    switch (senderType) {
      case 'automatico':
        return <Badge variant="outline" className="text-xs border-purple-300 text-purple-600">Auto</Badge>;
      case 'operador':
        return <Badge variant="outline" className="text-xs border-blue-300 text-blue-600">Operador</Badge>;
      case 'sistema':
        return <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">Sistema</Badge>;
      case 'motorista':
        return <Badge variant="outline" className="text-xs border-green-300 text-green-600">Motorista</Badge>;
      default:
        return null;
    }
  };

  const canRespond = selectedConversation && 
    (!selectedConversation.attendantId || selectedConversation.attendantId === user?.id?.toString());

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b shadow-sm sticky top-0 z-10">
          <div className="max-w-[1800px] mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setLocation('/line-haul')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
                <div className="h-6 w-px bg-gray-300" />
                <MessageSquare className="h-6 w-6 text-[#DB0145]" />
                <h1 className="text-lg font-bold text-gray-900">Central WhatsApp Clientes</h1>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCcw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-1" />
                  Regras
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Bell className="h-4 w-4 mr-1" />
                  Notificacoes Criticas
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1800px] mx-auto px-4 py-4">
          {/* KPIs */}
          <div className="grid grid-cols-6 gap-3 mb-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className={`shadow-sm cursor-help ${stats.pendentesAgora > 0 ? 'border-l-4 border-l-yellow-500' : 'border-l-4 border-l-gray-300'}`}>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-gray-500">Pendentes Agora</p>
                    <p className={`text-2xl font-bold ${stats.pendentesAgora > 0 ? 'text-yellow-600' : 'text-gray-500'}`}>
                      {stats.pendentesAgora}
                    </p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mensagens aguardando primeiro atendimento</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className={`shadow-sm cursor-help ${stats.slaEmRisco > 0 ? 'border-l-4 border-l-orange-500' : 'border-l-4 border-l-gray-300'}`}>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-gray-500">SLA em Risco</p>
                    <p className={`text-2xl font-bold ${stats.slaEmRisco > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                      {stats.slaEmRisco}
                    </p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>Atendimentos proximos de estourar o SLA (15 min)</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className={`shadow-sm cursor-help ${stats.slaEstourado > 0 ? 'border-l-4 border-l-red-500 bg-red-50' : 'border-l-4 border-l-gray-300'}`}>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-gray-500">SLA Estourado</p>
                    <p className={`text-2xl font-bold ${stats.slaEstourado > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {stats.slaEstourado}
                    </p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>Atendimentos que ultrapassaram o tempo limite</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="shadow-sm cursor-help border-l-4 border-l-blue-400">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-gray-500">Mensagens Hoje</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.mensagensHoje}</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total de mensagens recebidas hoje</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="shadow-sm cursor-help border-l-4 border-l-green-500">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-gray-500">Respondidas</p>
                    <p className="text-2xl font-bold text-green-600">{stats.respondidas}</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mensagens respondidas hoje</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="shadow-sm cursor-help border-l-4 border-l-purple-400">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-gray-500">Tempo Medio</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.tempoMedio}</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tempo medio de primeira resposta</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Alertas Criticos - Compacto */}
          {alerts.filter(a => a.severity === 'critical').length > 0 && (
            <Card className="mb-4 bg-red-50 border-red-200 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-semibold text-red-700 text-sm">Alertas Criticos</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {alerts.filter(a => a.severity === 'critical').map(alert => (
                    <div 
                      key={alert.id}
                      className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-red-200"
                    >
                      <Badge className="bg-red-600 text-white text-xs">{alert.title}</Badge>
                      <span className="text-xs text-gray-600">Palavra-chave: "{alert.keyword}"</span>
                      <span className="text-xs text-gray-400">{formatTime(alert.timestamp)}</span>
                      <Button size="sm" variant="outline" className="h-6 text-xs">
                        Abrir Conversa
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Layout Principal - 3 Colunas */}
          <div className="grid grid-cols-12 gap-4 h-[calc(100vh-280px)]">
            {/* Coluna 1: Lista de Conversas */}
            <Card className="col-span-3 shadow-sm flex flex-col">
              <CardHeader className="pb-2 border-b">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Conversas
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">{filteredConversations.length}</Badge>
                </div>
                
                {/* Toggle Grupos/Individuais */}
                <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                  <Button
                    size="sm"
                    variant={conversationFilter === 'todos' ? 'default' : 'ghost'}
                    onClick={() => setConversationFilter('todos')}
                    className="flex-1 h-7 text-xs"
                  >
                    Todos
                  </Button>
                  <Button
                    size="sm"
                    variant={conversationFilter === 'grupos' ? 'default' : 'ghost'}
                    onClick={() => setConversationFilter('grupos')}
                    className="flex-1 h-7 text-xs"
                  >
                    <Users className="h-3 w-3 mr-1" />
                    Grupos
                  </Button>
                  <Button
                    size="sm"
                    variant={conversationFilter === 'individuais' ? 'default' : 'ghost'}
                    onClick={() => setConversationFilter('individuais')}
                    className="flex-1 h-7 text-xs"
                  >
                    <User className="h-3 w-3 mr-1" />
                    Individuais
                  </Button>
                </div>
              </CardHeader>
              
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-2">
                  {filteredConversations.map(conv => (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`p-3 rounded-lg cursor-pointer transition-all border ${
                        selectedConversation?.id === conv.id 
                          ? 'bg-blue-50 border-blue-300 shadow-sm' 
                          : 'bg-white border-gray-100 hover:bg-gray-50'
                      } ${conv.unreadCount > 0 ? 'border-l-4 border-l-red-500' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {conv.type === 'grupo' ? (
                            <Users className="h-3 w-3 text-purple-500" />
                          ) : (
                            <User className="h-3 w-3 text-blue-500" />
                          )}
                          <span className="font-medium text-sm truncate max-w-[120px]">{conv.name}</span>
                          {conv.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">{formatTime(conv.lastMessageTime)}</span>
                      </div>
                      
                      {conv.plate && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-1">
                          <Truck className="h-2.5 w-2.5" />
                          <span>{conv.plate}</span>
                          {conv.base && <span>| {conv.base}</span>}
                        </div>
                      )}
                      
                      {conv.project && (
                        <Badge variant="outline" className="text-[10px] mb-1 h-4">{conv.project}</Badge>
                      )}
                      
                      <p className="text-xs text-gray-600 truncate">{conv.lastMessage}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        {getStatusBadge(conv.status)}
                        {conv.attendantName && conv.status === 'em_atendimento' && (
                          <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Lock className="h-2.5 w-2.5" />
                            {conv.attendantName}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            {/* Coluna 2: Conversa Ativa */}
            <Card className="col-span-6 shadow-sm flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Header da Conversa */}
                  <CardHeader className="pb-2 border-b bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{selectedConversation.name}</span>
                          {selectedConversation.plate && (
                            <Badge variant="outline" className="text-xs">{selectedConversation.plate}</Badge>
                          )}
                          {getStatusBadge(selectedConversation.status)}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Atendente: <strong>{selectedConversation.attendantName || 'Nao atribuido'}</strong>
                          </span>
                          {selectedConversation.base && (
                            <span>| Base: {selectedConversation.base}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {selectedConversation.status === 'em_atendimento' && canRespond && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-green-600 border-green-300 hover:bg-green-50"
                            onClick={handleFinishAttendance}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Finalizar
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setSelectedConversation(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Mensagens */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {selectedConversation.messages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.type === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              msg.type === 'outgoing'
                                ? 'bg-[#DB0145] text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {getSenderBadge(msg.senderType)}
                              {msg.attendantName && (
                                <span className={`text-xs ${msg.type === 'outgoing' ? 'text-white/80' : 'text-gray-500'}`}>
                                  {msg.attendantName}
                                </span>
                              )}
                            </div>
                            <p className="text-sm">{msg.content}</p>
                            {msg.requestedValue && (
                              <p className={`text-xs mt-1 ${msg.type === 'outgoing' ? 'text-white/80' : 'text-gray-500'}`}>
                                Valor: R$ {msg.requestedValue.toFixed(2)} | {msg.provider}
                              </p>
                            )}
                            <p className={`text-[10px] mt-2 ${msg.type === 'outgoing' ? 'text-white/60' : 'text-gray-400'}`}>
                              {formatTime(msg.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input de Mensagem */}
                  <div className="p-3 border-t bg-white">
                    {canRespond ? (
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Digite sua mensagem..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          className="resize-none text-sm"
                          rows={2}
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                          className="bg-[#DB0145] hover:bg-[#B8033B] text-white px-4"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
                        <Lock className="h-4 w-4" />
                        <span>Atendimento bloqueado - Em atendimento por: <strong>{selectedConversation.attendantName}</strong></span>
                      </div>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">
                      Logado como: <strong>{user?.name || 'Operador'}</strong>
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Selecione uma conversa</p>
                    <p className="text-sm">Clique em uma conversa para iniciar o atendimento</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Coluna 3: Historico e Acoes */}
            <Card className="col-span-3 shadow-sm flex flex-col">
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Historico do Atendimento
                </CardTitle>
              </CardHeader>
              
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                  {attendanceLogs
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                    .map(log => (
                      <div 
                        key={log.id}
                        className={`p-2 rounded-lg border text-xs ${
                          log.type === 'inicio' ? 'bg-blue-50 border-blue-200' :
                          log.type === 'resposta' ? 'bg-green-50 border-green-200' :
                          log.type === 'finalizacao' ? 'bg-purple-50 border-purple-200' :
                          'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{log.action}</span>
                          <span className="text-gray-400">{formatTime(log.timestamp)}</span>
                        </div>
                        <p className="text-gray-600">{log.userName}</p>
                      </div>
                    ))}
                </div>
              </ScrollArea>

              {selectedConversation && (
                <div className="p-3 border-t bg-gray-50">
                  <p className="text-xs font-medium text-gray-700 mb-2">Acoes Rapidas</p>
                  <div className="space-y-2">
                    <Button size="sm" variant="outline" className="w-full text-xs justify-start">
                      <CheckCircle className="h-3 w-3 mr-2 text-green-600" />
                      Aprovar Recarga
                    </Button>
                    <Button size="sm" variant="outline" className="w-full text-xs justify-start">
                      <XCircle className="h-3 w-3 mr-2 text-red-600" />
                      Negar Solicitacao
                    </Button>
                    <Button size="sm" variant="outline" className="w-full text-xs justify-start">
                      <Eye className="h-3 w-3 mr-2 text-blue-600" />
                      Ver Historico Completo
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
