import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { 
  Search, 
  Send, 
  MessageSquare, 
  Clock, 
  User, 
  Truck,
  Building2,
  Filter,
  History,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  X,
  ChevronRight,
  ArrowLeft,
  LogOut,
  RefreshCcw,
  Loader2,
  BarChart3
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: string;
  senderType: 'motorista' | 'operador';
  timestamp: Date;
  conversationId: string;
}

interface Conversation {
  id: string;
  vehiclePlate: string;
  driverName: string;
  base: string;
  project: string;
  balanceType: 'ticket' | 'veloe' | 'line_haul';
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  status: 'aberto' | 'em_atendimento' | 'aguardando_motorista' | 'finalizado';
  messages: Message[];
  attendanceHistory: AttendanceLog[];
}

interface AttendanceLog {
  id: string;
  action: string;
  userName: string;
  userType: string;
  timestamp: Date;
  balanceType: string;
  details?: string;
}

export default function MessagesAttendancePage() {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      vehiclePlate: 'SSX5J28',
      driverName: 'Rafael Santos',
      base: 'XPT São Mateus',
      project: 'Mercado Livre',
      balanceType: 'ticket',
      lastMessage: 'Preciso de recarga de R$ 220,00 para a viagem',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 5),
      unreadCount: 2,
      status: 'aberto',
      messages: [
        {
          id: 'm1',
          content: 'Bom dia! Preciso de recarga de R$ 220,00 para a viagem de hoje.',
          sender: 'Rafael Santos',
          senderType: 'motorista',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          conversationId: '1'
        },
        {
          id: 'm2',
          content: 'Preciso de recarga de R$ 220,00 para a viagem',
          sender: 'Rafael Santos',
          senderType: 'motorista',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          conversationId: '1'
        }
      ],
      attendanceHistory: [
        {
          id: 'h1',
          action: 'Mensagem recebida',
          userName: 'Rafael Santos',
          userType: 'Motorista',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          balanceType: 'Ticket'
        }
      ]
    },
    {
      id: '2',
      vehiclePlate: 'RUW5D84',
      driverName: 'Andrei Silva',
      base: 'XPT São Mateus',
      project: 'Shopee',
      balanceType: 'veloe',
      lastMessage: 'Cartão Veloe sem saldo, preciso abastecer',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 15),
      unreadCount: 1,
      status: 'em_atendimento',
      messages: [
        {
          id: 'm3',
          content: 'Cartão Veloe sem saldo, preciso abastecer urgente!',
          sender: 'Andrei Silva',
          senderType: 'motorista',
          timestamp: new Date(Date.now() - 1000 * 60 * 45),
          conversationId: '2'
        },
        {
          id: 'm4',
          content: 'Entendido, vou verificar o saldo disponível.',
          sender: 'Operador',
          senderType: 'operador',
          timestamp: new Date(Date.now() - 1000 * 60 * 40),
          conversationId: '2'
        },
        {
          id: 'm5',
          content: 'Cartão Veloe sem saldo, preciso abastecer',
          sender: 'Andrei Silva',
          senderType: 'motorista',
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          conversationId: '2'
        }
      ],
      attendanceHistory: [
        {
          id: 'h2',
          action: 'Mensagem recebida',
          userName: 'Andrei Silva',
          userType: 'Motorista',
          timestamp: new Date(Date.now() - 1000 * 60 * 45),
          balanceType: 'Veloe'
        },
        {
          id: 'h3',
          action: 'Mensagem enviada',
          userName: 'Operador',
          userType: 'Operador',
          timestamp: new Date(Date.now() - 1000 * 60 * 40),
          balanceType: 'Veloe',
          details: 'Respondido por: Operador'
        }
      ]
    },
    {
      id: '3',
      vehiclePlate: 'ABC1234',
      driverName: 'João Carlos',
      base: 'Line Haul',
      project: 'Line Haul',
      balanceType: 'line_haul',
      lastMessage: 'Viagem concluída, obrigado!',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
      unreadCount: 0,
      status: 'finalizado',
      messages: [
        {
          id: 'm6',
          content: 'Preciso de combustível para a rota SP-RJ',
          sender: 'João Carlos',
          senderType: 'motorista',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
          conversationId: '3'
        },
        {
          id: 'm7',
          content: 'Liberado R$ 500,00 no cartão. Boa viagem!',
          sender: 'Amanda Rocha',
          senderType: 'operador',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.5),
          conversationId: '3'
        },
        {
          id: 'm8',
          content: 'Viagem concluída, obrigado!',
          sender: 'João Carlos',
          senderType: 'motorista',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          conversationId: '3'
        }
      ],
      attendanceHistory: [
        {
          id: 'h4',
          action: 'Atendimento finalizado',
          userName: 'Amanda Rocha',
          userType: 'Operador',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          balanceType: 'Line Haul',
          details: 'Atendimento concluído com sucesso'
        }
      ]
    }
  ]);
  
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [newMessage, setNewMessage] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  const filteredConversations = conversations
    .filter(conv => {
      const matchesSearch = 
        conv.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.base.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'todos' || conv.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const newMsg: Message = {
      id: `m${Date.now()}`,
      content: newMessage,
      sender: user?.name || 'Operador',
      senderType: 'operador',
      timestamp: new Date(),
      conversationId: selectedConversation.id
    };

    const newLog: AttendanceLog = {
      id: `h${Date.now()}`,
      action: 'Mensagem enviada',
      userName: user?.name || 'Operador',
      userType: 'Operador',
      timestamp: new Date(),
      balanceType: selectedConversation.balanceType === 'ticket' ? 'Ticket' : 
                   selectedConversation.balanceType === 'veloe' ? 'Veloe' : 'Line Haul',
      details: `Respondido por: ${user?.name || 'Operador'}`
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === selectedConversation.id) {
        return {
          ...conv,
          messages: [...conv.messages, newMsg],
          attendanceHistory: [...conv.attendanceHistory, newLog],
          lastMessage: newMessage,
          lastMessageTime: new Date(),
          status: conv.status === 'aberto' ? 'em_atendimento' : conv.status,
          unreadCount: 0
        };
      }
      return conv;
    }));

    setSelectedConversation(prev => prev ? {
      ...prev,
      messages: [...prev.messages, newMsg],
      attendanceHistory: [...prev.attendanceHistory, newLog],
      lastMessage: newMessage,
      lastMessageTime: new Date(),
      status: prev.status === 'aberto' ? 'em_atendimento' : prev.status
    } : null);

    setNewMessage('');

    toast({
      title: "Mensagem enviada",
      description: "Sua resposta foi registrada no histórico."
    });
  };

  const handleStatusChange = (newStatus: string) => {
    if (!selectedConversation) return;

    const statusLog: AttendanceLog = {
      id: `h${Date.now()}`,
      action: `Status alterado para: ${
        newStatus === 'aberto' ? 'Aberto' :
        newStatus === 'em_atendimento' ? 'Em Atendimento' :
        newStatus === 'aguardando_motorista' ? 'Aguardando Motorista' :
        'Finalizado'
      }`,
      userName: user?.name || 'Operador',
      userType: 'Operador',
      timestamp: new Date(),
      balanceType: selectedConversation.balanceType === 'ticket' ? 'Ticket' : 
                   selectedConversation.balanceType === 'veloe' ? 'Veloe' : 'Line Haul'
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === selectedConversation.id) {
        return {
          ...conv,
          status: newStatus as any,
          attendanceHistory: [...conv.attendanceHistory, statusLog]
        };
      }
      return conv;
    }));

    setSelectedConversation(prev => prev ? {
      ...prev,
      status: newStatus as any,
      attendanceHistory: [...prev.attendanceHistory, statusLog]
    } : null);

    toast({
      title: "Status atualizado",
      description: `Conversa marcada como ${
        newStatus === 'aberto' ? 'Aberto' :
        newStatus === 'em_atendimento' ? 'Em Atendimento' :
        newStatus === 'aguardando_motorista' ? 'Aguardando Motorista' :
        'Finalizado'
      }`
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aberto':
        return <Badge className="bg-red-500 text-white">Aberto</Badge>;
      case 'em_atendimento':
        return <Badge className="bg-yellow-500 text-black">Em Atendimento</Badge>;
      case 'aguardando_motorista':
        return <Badge className="bg-blue-500 text-white">Aguardando</Badge>;
      case 'finalizado':
        return <Badge className="bg-green-500 text-white">Finalizado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getBalanceTypeBadge = (type: string) => {
    switch (type) {
      case 'ticket':
        return <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50">Ticket</Badge>;
      case 'veloe':
        return <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">Veloe</Badge>;
      case 'line_haul':
        return <Badge variant="outline" className="border-purple-500 text-purple-600 bg-purple-50">Line Haul</Badge>;
      default:
        return <Badge variant="outline">Outro</Badge>;
    }
  };

  const formatTime = (date: Date) => {
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

  const formatFullDate = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingCount = conversations.filter(c => c.status === 'aberto').length;
  const inProgressCount = conversations.filter(c => c.status === 'em_atendimento').length;
  const finishedCount = conversations.filter(c => c.status === 'finalizado').length;
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const handleLogout = async () => {
    await logout();
    setLocation('/signin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a365d] to-[#2d4a7c] text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <MessageSquare className="h-8 w-8" />
            <div>
              <h1 className="text-xl font-bold">Painel de Atendimento de Saldo</h1>
              <p className="text-sm text-blue-200">Ticket | Veloe | Line Haul</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-1">
                <AlertCircle className="h-5 w-5 text-red-500 mr-1" />
                <span className="text-2xl font-bold text-red-600">{pendingCount}</span>
              </div>
              <p className="text-xs text-gray-600">Abertos</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <span className="text-2xl font-bold text-yellow-600">{inProgressCount}</span>
              <p className="text-xs text-gray-600">Em Atendimento</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <span className="text-2xl font-bold text-green-600">{finishedCount}</span>
              <p className="text-xs text-gray-600">Finalizados</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <span className="text-2xl font-bold text-blue-600">{conversations.length}</span>
              <p className="text-xs text-gray-600">Total</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-1">
                <MessageCircle className="h-5 w-5 text-red-500 mr-1" />
                <span className="text-2xl font-bold text-red-600">{totalUnread}</span>
              </div>
              <p className="text-xs text-gray-600">Não Lidas</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex gap-4 h-[calc(100vh-280px)]">
          {/* Lista de Conversas */}
          <Card className="w-96 flex flex-col shadow-lg border-0">
            <CardHeader className="pb-3 border-b bg-gray-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5 text-[#1a365d]" />
                Conversas
              </CardTitle>
              
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar placa, motorista ou base..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant={statusFilter === 'todos' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('todos')}
                  className="text-xs"
                >
                  Todos
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'aberto' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('aberto')}
                  className="text-xs"
                >
                  Abertos
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'em_atendimento' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('em_atendimento')}
                  className="text-xs"
                >
                  Em Atend.
                </Button>
              </div>
            </CardHeader>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {filteredConversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversation(conv);
                      setConversations(prev => prev.map(c => 
                        c.id === conv.id ? { ...c, unreadCount: 0 } : c
                      ));
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50 border ${
                      selectedConversation?.id === conv.id 
                        ? 'bg-blue-50 border-blue-300' 
                        : 'bg-white border-gray-200'
                    } ${conv.unreadCount > 0 ? 'border-l-4 border-l-red-500' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-gray-900">{conv.vehiclePlate}</span>
                        {conv.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{formatTime(conv.lastMessageTime)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <User className="h-3 w-3" />
                      <span className="truncate">{conv.driverName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <Building2 className="h-3 w-3" />
                      <span className="truncate">{conv.base}</span>
                    </div>
                    
                    <p className="text-sm text-gray-700 truncate mb-2">{conv.lastMessage}</p>
                    
                    <div className="flex items-center gap-2">
                      {getBalanceTypeBadge(conv.balanceType)}
                      {getStatusBadge(conv.status)}
                    </div>
                  </div>
                ))}
                
                {filteredConversations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma conversa encontrada</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Área de Chat */}
          <Card className="flex-1 flex flex-col shadow-lg border-0">
            {selectedConversation ? (
              <>
                <CardHeader className="pb-3 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold font-mono">{selectedConversation.vehiclePlate}</span>
                          {getBalanceTypeBadge(selectedConversation.balanceType)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {selectedConversation.driverName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {selectedConversation.base}
                          </span>
                          <span className="flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            {selectedConversation.project}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Select
                        value={selectedConversation.status}
                        onValueChange={handleStatusChange}
                      >
                        <SelectTrigger className="w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aberto">Aberto</SelectItem>
                          <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                          <SelectItem value="aguardando_motorista">Aguardando Motorista</SelectItem>
                          <SelectItem value="finalizado">Finalizado</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowHistory(!showHistory)}
                        className={showHistory ? 'bg-blue-50' : ''}
                      >
                        <History className="h-4 w-4 mr-1" />
                        Histórico
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <div className="flex-1 flex overflow-hidden">
                  <ScrollArea className={`flex-1 ${showHistory ? 'border-r' : ''}`}>
                    <div className="p-4 space-y-4">
                      {selectedConversation.messages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.senderType === 'operador' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              msg.senderType === 'operador'
                                ? 'bg-[#1a365d] text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <div className={`flex items-center gap-2 mt-2 text-xs ${
                              msg.senderType === 'operador' ? 'text-white/70' : 'text-gray-500'
                            }`}>
                              <span>{msg.sender}</span>
                              <span>|</span>
                              <span>{formatFullDate(msg.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {showHistory && (
                    <div className="w-80 bg-gray-50 flex flex-col">
                      <div className="p-3 border-b bg-white flex items-center justify-between">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <History className="h-4 w-4" />
                          Histórico de Atendimento
                        </h3>
                        <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <ScrollArea className="flex-1">
                        <div className="p-3 space-y-3">
                          {selectedConversation.attendanceHistory
                            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                            .map(log => (
                              <div key={log.id} className="bg-white rounded-lg p-3 border text-xs">
                                <div className="flex items-center justify-between mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {log.balanceType}
                                  </Badge>
                                  <span className="text-gray-500">{formatFullDate(log.timestamp)}</span>
                                </div>
                                <p className="font-medium text-gray-900 mb-1">{log.action}</p>
                                <p className="text-gray-600">
                                  {log.userType}: {log.userName}
                                </p>
                                {log.details && (
                                  <p className="text-gray-500 mt-1 italic">{log.details}</p>
                                )}
                              </div>
                            ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t bg-white">
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
                      className="resize-none"
                      rows={2}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-[#1a365d] hover:bg-[#2d4a7c] text-white px-6"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Respondendo como: <strong>{user?.name || 'Operador'}</strong> | Enter para enviar
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">Selecione uma conversa</p>
                  <p className="text-sm">Escolha uma conversa na lista para iniciar o atendimento</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
