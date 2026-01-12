import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  TrendingUp,
  User,
  Truck,
  CreditCard,
  Fuel
} from 'lucide-react';

interface WhatsAppMessage {
  id: string;
  type: 'incoming' | 'outgoing';
  category: 'solicitacao_recarga' | 'aprovacao' | 'negacao' | 'outro';
  plate: string;
  driver: string;
  content: string;
  timestamp: Date;
  status: 'pendente' | 'em_atendimento' | 'respondido' | 'finalizado';
  provider?: string;
  requestedValue?: number;
  approvedValue?: number;
  approvedBy?: string;
}

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  content: string;
  timestamp: Date;
  type: string;
}

export default function LineHaulWhatsAppPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [groupFilter, setGroupFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');

  const [stats, setStats] = useState({
    pendentesAgora: 0,
    slaEmRisco: 0,
    slaEstourado: 48,
    mensagensHoje: 4,
    respondidas: 0,
    tempoMedio: '0m'
  });

  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      severity: 'critical',
      title: 'Line Haul Murici',
      content: '*ALERTA CRITICO* - *Grupo:* Conversa privada - *Remetente:* Line Haul Murici - *Tipo:* palavra-chave - *Mensagem:* *ALERTA CRITICO* - *Grupo:* Conversa privada - *Remetente:* Line Haul Murici - *Tipo:* palavra-chave',
      timestamp: new Date(Date.now() - 1000 * 60 * 2),
      type: 'ALERTA CRITICO'
    },
    {
      id: '2',
      severity: 'critical',
      title: 'Line Haul Murici',
      content: '*ALERTA CRITICO* - *Grupo:* Conversa privada - *Remetente:* Line Haul Murici - *Tipo:* palavra-chave - *Mensagem:* *ALERTA CRITICO* - *Grupo:* Line - *Remetente:* João Paulo Carvalho - *Tipo:* palavra-chave',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      type: 'ALERTA CRITICO'
    },
    {
      id: '3',
      severity: 'critical',
      title: 'Line Haul Murici',
      content: '*ALERTA CRITICO* - *Grupo:* Conversa privada - *Remetente:* Line Haul Murici - *Tipo:* palavra-chave - *Mensagem:* *ALERTA CRITICO*',
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      type: 'ALERTA CRITICO'
    }
  ]);

  const [messages, setMessages] = useState<WhatsAppMessage[]>([
    {
      id: '1',
      type: 'incoming',
      category: 'negacao',
      plate: 'FCV3I24',
      driver: 'Wanderlei Pacheco',
      content: '*SOLICITACAO DE RECARGA NEGADA* - *Cartao/Placa:* FCV3I24 - *Motorista:* Wanderlei Pacheco soares - *Valor Solicitado:* R$ 140.00 - *Provedor:* Veloe Go - *Analisado por:* Priscila Daiane - *Data:* 12/01/2026, 09:31:42',
      timestamp: new Date(Date.now() - 1000 * 60 * 3),
      status: 'finalizado',
      provider: 'Veloe Go',
      requestedValue: 140,
      approvedBy: 'Priscila Daiane'
    },
    {
      id: '2',
      type: 'incoming',
      category: 'aprovacao',
      plate: 'FCV3I24',
      driver: 'Wanderlei Pacheco',
      content: '*RECARGA DE CARTAO APROVADA* - *Cartao/Placa:* FCV3I24 - *Motorista:* Wanderlei Pacheco soares - *Valor Liberado:* R$ 343.00 - *Provedor:* Ticket - *Aprovado por:* Priscila Daiane - *Data de Aprovacao:* 12/01/2026, 09:58:13 - A recarga foi efetuada com sucesso no cartao de combustivel!',
      timestamp: new Date(Date.now() - 1000 * 60 * 8),
      status: 'finalizado',
      provider: 'Ticket',
      approvedValue: 343,
      approvedBy: 'Priscila Daiane'
    },
    {
      id: '3',
      type: 'incoming',
      category: 'solicitacao_recarga',
      plate: 'SSX5J28',
      driver: 'Rafael Santos',
      content: 'Gestao de abastecimento Murici - Solicitacao de recarga pendente para placa SSX5J28',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      status: 'pendente',
      provider: 'Ticket',
      requestedValue: 220
    }
  ]);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge className="bg-yellow-500 text-white">Pendente</Badge>;
      case 'em_atendimento':
        return <Badge className="bg-blue-500 text-white">Em Atendimento</Badge>;
      case 'respondido':
        return <Badge className="bg-purple-500 text-white">Respondido</Badge>;
      case 'finalizado':
        return <Badge className="bg-green-500 text-white">Finalizado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'solicitacao_recarga':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-300">Solicitacao</Badge>;
      case 'aprovacao':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Aprovacao</Badge>;
      case 'negacao':
        return <Badge className="bg-red-100 text-red-700 border-red-300">Negacao</Badge>;
      default:
        return <Badge variant="outline">Outro</Badge>;
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (statusFilter !== 'todos' && msg.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
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
                className="flex items-center gap-1"
              >
                <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                Regras
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1 border-red-200 text-red-600 hover:bg-red-50"
              >
                <Bell className="h-4 w-4" />
                Notificacoes Criticas
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 py-4">
        {/* KPIs */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          <Card className="bg-white shadow-sm border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Pendentes Agora</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendentesAgora}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">SLA em Risco</p>
                <p className="text-3xl font-bold text-orange-600">{stats.slaEmRisco}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">SLA Estourado</p>
                <p className="text-3xl font-bold text-red-600">{stats.slaEstourado}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Mensagens Hoje</p>
                <p className="text-3xl font-bold text-blue-600">{stats.mensagensHoje}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Respondidas</p>
                <p className="text-3xl font-bold text-green-600">{stats.respondidas}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Tempo Medio</p>
                <p className="text-3xl font-bold text-purple-600">{stats.tempoMedio}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-2 gap-6">
          {/* Alertas Recentes */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Alertas Recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="p-3 space-y-3">
                  {alerts.map(alert => (
                    <div 
                      key={alert.id} 
                      className={`p-3 rounded-lg border-l-4 ${
                        alert.severity === 'critical' 
                          ? 'bg-red-50 border-l-red-500' 
                          : alert.severity === 'warning'
                          ? 'bg-yellow-50 border-l-yellow-500'
                          : 'bg-blue-50 border-l-blue-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={`text-xs ${
                          alert.severity === 'critical' 
                            ? 'bg-red-500 text-white' 
                            : 'bg-yellow-500 text-white'
                        }`}>
                          {alert.type}
                        </Badge>
                        <span className="text-xs text-gray-500">{formatTime(alert.timestamp)}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 mb-1">{alert.title}</p>
                      <p className="text-xs text-gray-600 line-clamp-2">{alert.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Mensagens Recentes */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  Mensagens Recentes
                </CardTitle>
              </div>
              
              <div className="flex items-center gap-2 mt-3">
                <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue placeholder="Todos os Grupos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Grupos</SelectItem>
                    <SelectItem value="line_haul">Line Haul</SelectItem>
                    <SelectItem value="gestao">Gestao</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="divide-y">
                  {filteredMessages.map(msg => (
                    <div key={msg.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Mensagem Direta</span>
                          <span className="text-xs text-gray-400">|</span>
                          <span className="text-xs text-gray-500">{formatDate(msg.timestamp)}</span>
                        </div>
                        {getStatusBadge(msg.status)}
                      </div>
                      
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Gestao de abastecimento Murici
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            *Cartao/Placa:* {msg.plate}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            *Motorista:* {msg.driver}
                          </span>
                          {msg.requestedValue && (
                            <span className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              *Valor Solicitado:* R$ {msg.requestedValue.toFixed(2)}
                            </span>
                          )}
                          {msg.approvedValue && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              *Valor Liberado:* R$ {msg.approvedValue.toFixed(2)}
                            </span>
                          )}
                          {msg.provider && (
                            <span className="flex items-center gap-1">
                              <Fuel className="h-3 w-3" />
                              *Provedor:* {msg.provider}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getCategoryBadge(msg.category)}
                        {msg.approvedBy && (
                          <span className="text-xs text-gray-500">
                            *Analisado por:* {msg.approvedBy}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
