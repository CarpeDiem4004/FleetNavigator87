import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { 
  Search, 
  MessageSquare, 
  Clock, 
  User, 
  Truck,
  History,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  X,
  ArrowLeft,
  LogOut,
  RefreshCcw,
  Phone,
  Smartphone,
  Users,
  Building2,
  Calendar,
  Send,
  Loader2
} from 'lucide-react';

interface WhatsAppMessage {
  id: number;
  instance_id: string;
  grupo_id?: string;
  grupo_nome?: string;
  remetente_numero: string;
  remetente_nome: string;
  mensagem: string;
  tipo_mensagem: string;
  is_outgoing: boolean;
  is_alert: boolean;
  status: string;
  respondido: boolean;
  respondido_por?: string;
  respondido_em?: string;
  data_mensagem: string;
  created_at: string;
}

interface ParsedMessage {
  type: 'aprovacao' | 'negacao' | 'solicitacao' | 'alerta' | 'outro';
  placa?: string;
  motorista?: string;
  valor?: string;
  provedor?: string;
  aprovadoPor?: string;
  data?: string;
  motivo?: string;
}

export default function MessagesAttendancePage() {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedMessage, setSelectedMessage] = useState<WhatsAppMessage | null>(null);
  const [activeTab, setActiveTab] = useState<string>('individual');
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const sendReply = async () => {
    if (!selectedMessage || !replyText.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem para responder",
        variant: "destructive"
      });
      return;
    }

    setIsSendingReply(true);
    try {
      const response = await fetch('/api/whatsapp/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messageId: selectedMessage.id,
          replyText: replyText.trim(),
          userId: user?.id,
          userName: user?.name || 'Operador'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Enviado!",
          description: "Resposta enviada com sucesso via WhatsApp",
        });
        setReplyText('');
        fetchMessages();
      } else {
        throw new Error(data.error || 'Erro ao enviar resposta');
      }
    } catch (error: any) {
      console.error('Erro ao enviar resposta:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao enviar resposta",
        variant: "destructive"
      });
    } finally {
      setIsSendingReply(false);
    }
  };

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whatsapp/messages?limit=200', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(data.data || []);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      toast({
        title: "Erro",
        description: "Nao foi possivel carregar as mensagens",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const parseMessage = (mensagem: string): ParsedMessage => {
    const result: ParsedMessage = { type: 'outro' };
    
    if (mensagem.includes('RECARGA DE CARTÃO APROVADA') || mensagem.includes('RECARGA DE CARTAO APROVADA')) {
      result.type = 'aprovacao';
    } else if (mensagem.includes('SOLICITAÇÃO DE RECARGA NEGADA') || mensagem.includes('SOLICITACAO DE RECARGA NEGADA')) {
      result.type = 'negacao';
    } else if (mensagem.includes('ALERTA CRÍTICO') || mensagem.includes('ALERTA CRITICO')) {
      result.type = 'alerta';
    }
    
    const placaMatch = mensagem.match(/Cartão\/Placa:\*?\s*([A-Z0-9]+)/i) || mensagem.match(/Cartao\/Placa:\*?\s*([A-Z0-9]+)/i);
    if (placaMatch) result.placa = placaMatch[1];
    
    const motoristaMatch = mensagem.match(/Motorista:\*?\s*([^\n*]+)/i);
    if (motoristaMatch) result.motorista = motoristaMatch[1].trim();
    
    const valorMatch = mensagem.match(/Valor (?:Liberado|Solicitado):\*?\s*R\$\s*([\d.,]+)/i);
    if (valorMatch) result.valor = valorMatch[1];
    
    const provedorMatch = mensagem.match(/Provedor:\*?\s*([^\n*]+)/i);
    if (provedorMatch) result.provedor = provedorMatch[1].trim();
    
    const aprovadoMatch = mensagem.match(/(?:Aprovado por|Analisado por):\*?\s*([^\n*]+)/i);
    if (aprovadoMatch) result.aprovadoPor = aprovadoMatch[1].trim();
    
    const motivoMatch = mensagem.match(/Motivo:\*?\s*([^\n]+)/i);
    if (motivoMatch) result.motivo = motivoMatch[1].trim();
    
    return result;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeBadge = (parsed: ParsedMessage) => {
    switch (parsed.type) {
      case 'aprovacao':
        return <Badge className="bg-green-500 text-white text-xs">Aprovado</Badge>;
      case 'negacao':
        return <Badge className="bg-red-500 text-white text-xs">Negado</Badge>;
      case 'alerta':
        return <Badge className="bg-orange-500 text-white text-xs">Alerta</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Outro</Badge>;
    }
  };

  const getProviderBadge = (provedor?: string) => {
    if (!provedor) return null;
    const colors: Record<string, string> = {
      'Ticket': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Veloe': 'bg-purple-100 text-purple-800 border-purple-300',
      'Line Haul': 'bg-blue-100 text-blue-800 border-blue-300',
    };
    const colorClass = colors[provedor] || 'bg-gray-100 text-gray-800 border-gray-300';
    return <Badge variant="outline" className={`text-xs ${colorClass}`}>{provedor}</Badge>;
  };

  const individualMessages = messages.filter(msg => !msg.grupo_id && !msg.grupo_nome);
  const groupMessages = messages.filter(msg => msg.grupo_id || msg.grupo_nome);

  const filterMessages = (msgs: WhatsAppMessage[]) => {
    return msgs.filter(msg => {
      const parsed = parseMessage(msg.mensagem);
      const matchesSearch = 
        (parsed.placa?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (parsed.motorista?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        msg.remetente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.remetente_numero.includes(searchTerm) ||
        (msg.grupo_nome?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (statusFilter === 'aprovacao' && parsed.type !== 'aprovacao') return false;
      if (statusFilter === 'negacao' && parsed.type !== 'negacao') return false;
      if (statusFilter === 'alerta' && parsed.type !== 'alerta') return false;
      
      return searchTerm ? matchesSearch : true;
    });
  };

  const filteredIndividual = filterMessages(individualMessages);
  const filteredGroups = filterMessages(groupMessages);

  const handleLogout = async () => {
    await logout();
    setLocation('/signin');
  };

  const individualStats = {
    aprovacoes: individualMessages.filter(m => parseMessage(m.mensagem).type === 'aprovacao').length,
    negacoes: individualMessages.filter(m => parseMessage(m.mensagem).type === 'negacao').length,
    alertas: individualMessages.filter(m => parseMessage(m.mensagem).type === 'alerta').length,
  };

  const groupStats = {
    grupos: Array.from(new Set(groupMessages.map(m => m.grupo_nome || m.grupo_id))).length,
    mensagens: groupMessages.length,
  };

  const renderMessageCard = (msg: WhatsAppMessage, isGroup: boolean = false) => {
    const parsed = parseMessage(msg.mensagem);
    const isSelected = selectedMessage?.id === msg.id;
    
    return (
      <div
        key={msg.id}
        onClick={() => setSelectedMessage(msg)}
        className={`p-3 rounded-lg cursor-pointer transition-all border mb-2 ${
          isSelected 
            ? 'bg-blue-50 border-blue-300 shadow-md' 
            : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            {isGroup ? (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-sm text-blue-700 truncate max-w-[150px]">
                  {msg.grupo_nome || 'Grupo'}
                </span>
              </div>
            ) : parsed.placa ? (
              <span className="font-bold font-mono text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                {parsed.placa}
              </span>
            ) : null}
            {getTypeBadge(parsed)}
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap">{formatTime(msg.created_at)}</span>
        </div>
        
        {parsed.motorista && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <User className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{parsed.motorista}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <Phone className="h-3 w-3 flex-shrink-0" />
          <span className="font-mono">{msg.remetente_numero}</span>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {parsed.valor && (
            <Badge variant="outline" className="text-xs font-medium bg-green-50 text-green-700 border-green-200">
              R$ {parsed.valor}
            </Badge>
          )}
          {getProviderBadge(parsed.provedor)}
        </div>
        
        {parsed.aprovadoPor && (
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Por: {parsed.aprovadoPor}
          </p>
        )}

        {isGroup && (
          <p className="text-xs text-gray-600 mt-2 line-clamp-2 italic">
            {msg.mensagem.substring(0, 100)}...
          </p>
        )}
      </div>
    );
  };

  const renderMessageDetails = () => {
    if (!selectedMessage) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
          <MessageSquare className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">Selecione uma mensagem</p>
          <p className="text-sm">Clique em uma mensagem para ver os detalhes</p>
        </div>
      );
    }

    const parsed = parseMessage(selectedMessage.mensagem);
    const isGroup = !!(selectedMessage.grupo_id || selectedMessage.grupo_nome);

    return (
      <ScrollArea className="h-[calc(100vh-380px)]">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isGroup ? (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Users className="h-3 w-3 mr-1" />
                  Grupo
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <Smartphone className="h-3 w-3 mr-1" />
                  Individual
                </Badge>
              )}
              {getTypeBadge(parsed)}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              {formatFullDate(selectedMessage.created_at)}
            </div>
          </div>

          {isGroup && selectedMessage.grupo_nome && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-500 mb-1 font-medium">Nome do Grupo</p>
              <p className="font-bold text-blue-800">{selectedMessage.grupo_nome}</p>
            </div>
          )}
          
          {parsed.placa && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Placa/Cartao</p>
              <p className="font-bold font-mono text-2xl text-gray-900">{parsed.placa}</p>
            </div>
          )}
          
          {parsed.motorista && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-gray-400" />
                <p className="text-xs text-gray-500">Motorista</p>
              </div>
              <p className="font-medium text-gray-800">{parsed.motorista}</p>
            </div>
          )}
          
          {parsed.valor && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-green-600 mb-1">Valor</p>
              <p className="font-bold text-2xl text-green-700">R$ {parsed.valor}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3">
            {parsed.provedor && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Provedor</p>
                <p className="font-medium">{parsed.provedor}</p>
              </div>
            )}
            
            {parsed.aprovadoPor && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Atendido por</p>
                <p className="font-medium">{parsed.aprovadoPor}</p>
              </div>
            )}
          </div>
          
          {parsed.motivo && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-xs text-red-500 font-medium">Motivo da Negacao</p>
              </div>
              <p className="font-medium text-red-700">{parsed.motivo}</p>
            </div>
          )}
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Phone className="h-4 w-4 text-gray-400" />
              <p className="text-xs text-gray-500">Telefone Destino</p>
            </div>
            <p className="font-mono text-gray-700">{selectedMessage.remetente_numero}</p>
          </div>
          
          <div className="p-3 bg-gray-100 rounded-lg">
            <p className="text-xs text-gray-500 mb-2 font-medium">Mensagem Completa</p>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
              {selectedMessage.mensagem}
            </pre>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <History className="h-4 w-4 text-blue-500" />
              <p className="text-xs text-blue-600 font-medium">Historico de Auditoria</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-gray-600">
                <span>Mensagem enviada</span>
                <span className="text-xs">{formatFullDate(selectedMessage.created_at)}</span>
              </div>
              {selectedMessage.is_outgoing && (
                <div className="flex items-center justify-between text-gray-600">
                  <span>Tipo: Notificacao automatica</span>
                  <Badge variant="outline" className="text-xs">Sistema</Badge>
                </div>
              )}
              {selectedMessage.respondido && selectedMessage.respondido_por && (
                <div className="flex items-center justify-between text-gray-600">
                  <span>Respondido por: {selectedMessage.respondido_por}</span>
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Respondido</Badge>
                </div>
              )}
            </div>
          </div>

          {/* Caixa de Resposta */}
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Send className="h-4 w-4 text-green-600" />
              <p className="text-xs text-green-700 font-medium">
                Responder {isGroup ? 'no Grupo' : 'Mensagem'}
              </p>
            </div>
            <div className="space-y-2">
              <Textarea
                placeholder={`Digite sua resposta${isGroup ? ' para o grupo' : ''}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[80px] bg-white"
                disabled={isSendingReply}
              />
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReplyText('')}
                  disabled={isSendingReply || !replyText}
                >
                  Limpar
                </Button>
                <Button
                  size="sm"
                  onClick={sendReply}
                  disabled={isSendingReply || !replyText.trim()}
                  className="bg-[#25D366] hover:bg-[#128C7E] text-white"
                >
                  {isSendingReply ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1" />
                      Enviar WhatsApp
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a365d] to-[#2d4a7c] text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/fuel-card-requests')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            <div className="h-6 w-px bg-white/30" />
            <MessageSquare className="h-8 w-8" />
            <div>
              <h1 className="text-xl font-bold">Painel de Atendimento de Saldo</h1>
              <p className="text-sm text-blue-200">Ticket | Veloe | Line Haul</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={fetchMessages}
              disabled={isLoading}
            >
              <RefreshCcw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <span className="text-sm text-blue-200">{user?.name || 'Operador'}</span>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-1" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Tabs Principais */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList className="bg-white shadow-sm border p-1">
              <TabsTrigger 
                value="individual" 
                className="flex items-center gap-2 data-[state=active]:bg-[#1a365d] data-[state=active]:text-white px-6"
              >
                <Smartphone className="h-4 w-4" />
                Mensagens Individuais
                <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-800">
                  {individualMessages.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="grupos" 
                className="flex items-center gap-2 data-[state=active]:bg-[#1a365d] data-[state=active]:text-white px-6"
              >
                <Users className="h-4 w-4" />
                Mensagens de Grupos
                <Badge variant="secondary" className="ml-1 bg-purple-100 text-purple-800">
                  {groupMessages.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Mensagens Individuais */}
          <TabsContent value="individual" className="space-y-4 mt-0">
            {/* KPIs Individuais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-white shadow-sm border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Aprovacoes</p>
                      <p className="text-2xl font-bold text-green-600">{individualStats.aprovacoes}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-sm border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Negacoes</p>
                      <p className="text-2xl font-bold text-red-600">{individualStats.negacoes}</p>
                    </div>
                    <X className="h-8 w-8 text-red-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-sm border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Alertas</p>
                      <p className="text-2xl font-bold text-orange-600">{individualStats.alertas}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-orange-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-sm border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Total</p>
                      <p className="text-2xl font-bold text-blue-600">{individualMessages.length}</p>
                    </div>
                    <MessageCircle className="h-8 w-8 text-blue-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filtros */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar placa, motorista ou telefone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    {['todos', 'aprovacao', 'negacao', 'alerta'].map(filter => (
                      <Button
                        key={filter}
                        size="sm"
                        variant={statusFilter === filter ? 'default' : 'outline'}
                        onClick={() => setStatusFilter(filter)}
                        className={statusFilter === filter ? (
                          filter === 'aprovacao' ? 'bg-green-500 hover:bg-green-600' :
                          filter === 'negacao' ? 'bg-red-500 hover:bg-red-600' :
                          filter === 'alerta' ? 'bg-orange-500 hover:bg-orange-600' : ''
                        ) : ''}
                      >
                        {filter === 'todos' ? 'Todas' : 
                         filter === 'aprovacao' ? 'Aprovadas' :
                         filter === 'negacao' ? 'Negadas' : 'Alertas'}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista + Detalhes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="shadow-lg border-0">
                <CardHeader className="pb-3 border-b bg-gray-50">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Smartphone className="h-5 w-5 text-[#1a365d]" />
                    Conversas Individuais
                    <Badge variant="outline" className="ml-2">{filteredIndividual.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <ScrollArea className="h-[calc(100vh-500px)] min-h-[400px]">
                  {isLoading ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : filteredIndividual.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
                      <MessageCircle className="h-12 w-12 mb-3 opacity-30" />
                      <p>Nenhuma mensagem encontrada</p>
                    </div>
                  ) : (
                    <div className="p-3">
                      {filteredIndividual.map(msg => renderMessageCard(msg, false))}
                    </div>
                  )}
                </ScrollArea>
              </Card>

              <Card className="shadow-lg border-0">
                <CardHeader className="pb-3 border-b bg-gray-50">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <History className="h-5 w-5 text-[#1a365d]" />
                    Detalhes da Mensagem
                  </CardTitle>
                </CardHeader>
                {renderMessageDetails()}
              </Card>
            </div>
          </TabsContent>

          {/* Tab Mensagens de Grupos */}
          <TabsContent value="grupos" className="space-y-4 mt-0">
            {/* KPIs Grupos */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Card className="bg-white shadow-sm border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Grupos Ativos</p>
                      <p className="text-2xl font-bold text-purple-600">{groupStats.grupos}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-sm border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Total Mensagens</p>
                      <p className="text-2xl font-bold text-blue-600">{groupStats.mensagens}</p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-blue-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-sm border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Modo</p>
                      <p className="text-lg font-bold text-green-600">Interativo</p>
                    </div>
                    <Send className="h-8 w-8 text-green-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Info Box */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <MessageCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Monitoramento e Resposta de Grupos</p>
                    <p className="text-sm text-green-600">
                      Visualize mensagens de grupos de WhatsApp e responda diretamente pelo painel.
                      Selecione uma mensagem para ver os detalhes e enviar respostas.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filtros Grupos */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar grupo, placa, motorista ou telefone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    {['todos', 'aprovacao', 'negacao', 'alerta'].map(filter => (
                      <Button
                        key={filter}
                        size="sm"
                        variant={statusFilter === filter ? 'default' : 'outline'}
                        onClick={() => setStatusFilter(filter)}
                        className={statusFilter === filter ? (
                          filter === 'aprovacao' ? 'bg-green-500 hover:bg-green-600' :
                          filter === 'negacao' ? 'bg-red-500 hover:bg-red-600' :
                          filter === 'alerta' ? 'bg-orange-500 hover:bg-orange-600' : ''
                        ) : ''}
                      >
                        {filter === 'todos' ? 'Todas' : 
                         filter === 'aprovacao' ? 'Aprovadas' :
                         filter === 'negacao' ? 'Negadas' : 'Alertas'}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista + Detalhes Grupos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="shadow-lg border-0">
                <CardHeader className="pb-3 border-b bg-gray-50">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-purple-600" />
                    Mensagens de Grupos
                    <Badge variant="outline" className="ml-2">{filteredGroups.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <ScrollArea className="h-[calc(100vh-500px)] min-h-[400px]">
                  {isLoading ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : filteredGroups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
                      <Users className="h-12 w-12 mb-3 opacity-30" />
                      <p>Nenhuma mensagem de grupo</p>
                    </div>
                  ) : (
                    <div className="p-3">
                      {filteredGroups.map(msg => renderMessageCard(msg, true))}
                    </div>
                  )}
                </ScrollArea>
              </Card>

              <Card className="shadow-lg border-0">
                <CardHeader className="pb-3 border-b bg-gray-50">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <History className="h-5 w-5 text-purple-600" />
                    Detalhes da Mensagem
                  </CardTitle>
                </CardHeader>
                {renderMessageDetails()}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
