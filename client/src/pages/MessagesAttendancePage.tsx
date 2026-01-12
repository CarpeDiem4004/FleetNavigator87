import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { 
  Search, 
  Send, 
  MessageSquare, 
  Clock, 
  User, 
  Truck,
  Building2,
  History,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  X,
  ArrowLeft,
  LogOut,
  RefreshCcw,
  Loader2,
  Phone
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedMessage, setSelectedMessage] = useState<WhatsAppMessage | null>(null);
  const [stats, setStats] = useState({
    pendentes: 0,
    respondidas: 0,
    total: 0
  });

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whatsapp/messages?limit=100', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(data.data || []);
          
          const msgs = data.data || [];
          const pendentes = msgs.filter((m: WhatsAppMessage) => !m.respondido && m.is_outgoing).length;
          const respondidas = msgs.filter((m: WhatsAppMessage) => m.respondido).length;
          
          setStats({
            pendentes,
            respondidas,
            total: msgs.length
          });
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
    
    if (mensagem.includes('RECARGA DE CARTÃO APROVADA')) {
      result.type = 'aprovacao';
    } else if (mensagem.includes('SOLICITAÇÃO DE RECARGA NEGADA')) {
      result.type = 'negacao';
    } else if (mensagem.includes('ALERTA CRÍTICO')) {
      result.type = 'alerta';
    }
    
    const placaMatch = mensagem.match(/Cartão\/Placa:\*?\s*([A-Z0-9]+)/i);
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
        return <Badge className="bg-green-500 text-white">Aprovacao</Badge>;
      case 'negacao':
        return <Badge className="bg-red-500 text-white">Negacao</Badge>;
      case 'alerta':
        return <Badge className="bg-orange-500 text-white">Alerta</Badge>;
      case 'solicitacao':
        return <Badge className="bg-blue-500 text-white">Solicitacao</Badge>;
      default:
        return <Badge variant="outline">Outro</Badge>;
    }
  };

  const filteredMessages = messages.filter(msg => {
    const parsed = parseMessage(msg.mensagem);
    const matchesSearch = 
      (parsed.placa?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (parsed.motorista?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      msg.remetente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.remetente_numero.includes(searchTerm);
    
    if (statusFilter === 'aprovacao' && parsed.type !== 'aprovacao') return false;
    if (statusFilter === 'negacao' && parsed.type !== 'negacao') return false;
    if (statusFilter === 'alerta' && parsed.type !== 'alerta') return false;
    
    return searchTerm ? matchesSearch : true;
  });

  const handleLogout = async () => {
    await logout();
    setLocation('/signin');
  };

  const aprovacoes = messages.filter(m => parseMessage(m.mensagem).type === 'aprovacao').length;
  const negacoes = messages.filter(m => parseMessage(m.mensagem).type === 'negacao').length;
  const alertas = messages.filter(m => parseMessage(m.mensagem).type === 'alerta').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
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
              <p className="text-sm text-blue-200">Historico de Notificacoes WhatsApp</p>
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
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <Card className="bg-white shadow-sm border-l-4 border-l-green-500">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-1">
                <CheckCircle className="h-5 w-5 text-green-500 mr-1" />
                <span className="text-2xl font-bold text-green-600">{aprovacoes}</span>
              </div>
              <p className="text-xs text-gray-600">Aprovacoes</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border-l-4 border-l-red-500">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-1">
                <X className="h-5 w-5 text-red-500 mr-1" />
                <span className="text-2xl font-bold text-red-600">{negacoes}</span>
              </div>
              <p className="text-xs text-gray-600">Negacoes</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border-l-4 border-l-orange-500">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-1">
                <AlertCircle className="h-5 w-5 text-orange-500 mr-1" />
                <span className="text-2xl font-bold text-orange-600">{alertas}</span>
              </div>
              <p className="text-xs text-gray-600">Alertas</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border-l-4 border-l-blue-500">
            <CardContent className="p-4 text-center">
              <span className="text-2xl font-bold text-blue-600">{messages.length}</span>
              <p className="text-xs text-gray-600">Total</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border-l-4 border-l-purple-500">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-1">
                <MessageCircle className="h-5 w-5 text-purple-500 mr-1" />
                <span className="text-2xl font-bold text-purple-600">{messages.filter(m => m.is_outgoing).length}</span>
              </div>
              <p className="text-xs text-gray-600">Enviadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-4 shadow-sm">
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
                <Button
                  size="sm"
                  variant={statusFilter === 'todos' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('todos')}
                >
                  Todos
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'aprovacao' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('aprovacao')}
                  className={statusFilter === 'aprovacao' ? 'bg-green-500 hover:bg-green-600' : ''}
                >
                  Aprovacoes
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'negacao' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('negacao')}
                  className={statusFilter === 'negacao' ? 'bg-red-500 hover:bg-red-600' : ''}
                >
                  Negacoes
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'alerta' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('alerta')}
                  className={statusFilter === 'alerta' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                >
                  Alertas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Mensagens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Lista */}
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-3 border-b bg-gray-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5 text-[#1a365d]" />
                Historico de Mensagens
                <Badge variant="outline" className="ml-2">{filteredMessages.length}</Badge>
              </CardTitle>
            </CardHeader>

            <ScrollArea className="h-[500px]">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-gray-500">
                  <MessageCircle className="h-12 w-12 mb-3 opacity-30" />
                  <p>Nenhuma mensagem encontrada</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {filteredMessages.map(msg => {
                    const parsed = parseMessage(msg.mensagem);
                    return (
                      <div
                        key={msg.id}
                        onClick={() => setSelectedMessage(msg)}
                        className={`p-3 rounded-lg cursor-pointer transition-all border ${
                          selectedMessage?.id === msg.id 
                            ? 'bg-blue-50 border-blue-300' 
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {parsed.placa && (
                              <span className="font-bold font-mono text-gray-900">{parsed.placa}</span>
                            )}
                            {getTypeBadge(parsed)}
                          </div>
                          <span className="text-xs text-gray-500">{formatTime(msg.created_at)}</span>
                        </div>
                        
                        {parsed.motorista && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <User className="h-3 w-3" />
                            <span className="truncate">{parsed.motorista}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                          <Phone className="h-3 w-3" />
                          <span>{msg.remetente_numero}</span>
                        </div>
                        
                        {parsed.valor && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              R$ {parsed.valor}
                            </Badge>
                            {parsed.provedor && (
                              <Badge variant="outline" className="text-xs">
                                {parsed.provedor}
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        {parsed.aprovadoPor && (
                          <p className="text-xs text-gray-500 mt-1">
                            Por: {parsed.aprovadoPor}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Detalhes */}
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-3 border-b bg-gray-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5 text-[#1a365d]" />
                Detalhes da Mensagem
              </CardTitle>
            </CardHeader>

            {selectedMessage ? (
              <ScrollArea className="h-[500px]">
                <div className="p-4">
                  {(() => {
                    const parsed = parseMessage(selectedMessage.mensagem);
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          {getTypeBadge(parsed)}
                          <span className="text-sm text-gray-500">
                            {formatFullDate(selectedMessage.created_at)}
                          </span>
                        </div>
                        
                        {parsed.placa && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Placa/Cartao</p>
                            <p className="font-bold font-mono text-xl">{parsed.placa}</p>
                          </div>
                        )}
                        
                        {parsed.motorista && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Motorista</p>
                            <p className="font-medium">{parsed.motorista}</p>
                          </div>
                        )}
                        
                        {parsed.valor && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Valor</p>
                            <p className="font-bold text-xl text-green-600">R$ {parsed.valor}</p>
                          </div>
                        )}
                        
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
                        
                        {parsed.motivo && (
                          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <p className="text-xs text-red-500 mb-1">Motivo da Negacao</p>
                            <p className="font-medium text-red-700">{parsed.motivo}</p>
                          </div>
                        )}
                        
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Telefone Destino</p>
                          <p className="font-mono">{selectedMessage.remetente_numero}</p>
                        </div>
                        
                        <div className="p-3 bg-gray-100 rounded-lg">
                          <p className="text-xs text-gray-500 mb-2">Mensagem Completa</p>
                          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                            {selectedMessage.mensagem}
                          </pre>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px] text-gray-500">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Selecione uma mensagem</p>
                <p className="text-sm">Clique em uma mensagem para ver os detalhes</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
