import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { CreditCard, Filter, Search, Calendar, CheckCircle2, XCircle, Clock, AlertCircle, ArrowLeft, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';

interface LineHallFuelRequest {
  id: number;
  motorista_nome: string;
  motorista_cpf: string;
  veiculo_placa: string;
  veiculo_modelo: string;
  rota_origem: string;
  rota_destino: string;
  data_viagem?: string;
  valor_solicitado?: number;
  valor_aprovado?: number;
  status: 'pendente' | 'aprovada' | 'rejeitada';
  observacoes_operador?: string;
  created_at: string;
  updated_at: string;
  operador_aprovacao?: string;
  telefone_motorista: string;
  km_total: number;
  horario_abastecimento: string;
  valor_calculado: string;
  cartao_combustivel?: string;
}

const LineHallFuelCardRequests: React.FC = () => {
  const [requests, setRequests] = useState<LineHallFuelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredRequests, setFilteredRequests] = useState<LineHallFuelRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  // Função para buscar solicitações do Line Hall
  const fetchLineHallRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/line-hall/fuel-requests', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar solicitações');
      }
      
      const data = await response.json();
      if (data.success) {
        setRequests(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error);
      toast({
        title: 'Erro ao carregar solicitações',
        description: 'Não foi possível carregar as solicitações do Line Hall',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para aprovar solicitação
  const handleApproval = async (requestId: number, action: 'aprovar' | 'rejeitar', observacoes?: string) => {
    try {
      const response = await fetch(`/api/line-hall/fuel-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: action === 'aprovar' ? 'aprovada' : 'rejeitada',
          observacoes_operador: observacoes,
          operador_aprovacao: user?.name || 'Line Hall'
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao processar solicitação');
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: action === 'aprovar' ? 'Solicitação aprovada' : 'Solicitação rejeitada',
          description: `A solicitação foi ${action === 'aprovar' ? 'aprovada' : 'rejeitada'} com sucesso`,
          variant: 'default',
        });
        fetchLineHallRequests(); // Recarregar lista
      }
    } catch (error) {
      console.error('Erro ao processar solicitação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar a solicitação',
        variant: 'destructive',
      });
    }
  };

  // Filtrar solicitações
  useEffect(() => {
    let filtered = requests;

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(req =>
        req.motorista_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.veiculo_placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.rota_origem.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.rota_destino.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  }, [requests, statusFilter, searchTerm]);

  useEffect(() => {
    fetchLineHallRequests();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'aprovada':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Aprovada</Badge>;
      case 'rejeitada':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejeitada</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Desconhecido</Badge>;
    }
  };

  const getStatusCounts = () => {
    return {
      total: requests.length,
      pendente: requests.filter(r => r.status === 'pendente').length,
      aprovada: requests.filter(r => r.status === 'aprovada').length,
      rejeitada: requests.filter(r => r.status === 'rejeitada').length,
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/line-hall-shopee">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Line Hall
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Solicitações de Cartão Combustível</h1>
                <p className="text-sm text-gray-600">Gerenciamento de solicitações do Line Hall Shopee</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm">
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts.total}</p>
                </div>
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{statusCounts.pendente}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aprovadas</p>
                  <p className="text-2xl font-bold text-green-600">{statusCounts.aprovada}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejeitadas</p>
                  <p className="text-2xl font-bold text-red-600">{statusCounts.rejeitada}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por motorista, placa, origem ou destino..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="pendente">Pendentes</SelectItem>
                    <SelectItem value="aprovada">Aprovadas</SelectItem>
                    <SelectItem value="rejeitada">Rejeitadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma solicitação encontrada</h3>
                <p className="text-gray-600">
                  {requests.length === 0 
                    ? 'Não há solicitações de cartão combustível no momento.'
                    : 'Não há solicitações que correspondam aos filtros aplicados.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{request.motorista_nome}</h3>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Veículo:</span>
                          <p>{request.veiculo_placa} - {request.veiculo_modelo}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Rota:</span>
                          <p>{request.rota_origem} → {request.rota_destino}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Quilometragem:</span>
                          <p>{request.km_total} km</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Valor Calculado:</span>
                          <p className="text-green-600 font-semibold">R$ {request.valor_calculado}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Horário de Abastecimento:</span>
                          <p>{request.horario_abastecimento === 'antes_17h' ? 'Antes das 17h' : 'Após as 18h'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Telefone:</span>
                          <p>{request.telefone_motorista}</p>
                        </div>
                      </div>
                      {request.cartao_combustivel && (
                        <div className="mt-2">
                          <span className="font-medium text-gray-600">Cartão:</span>
                          <p className="text-blue-600">{request.cartao_combustivel}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      Solicitado em {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      {request.operador_aprovacao && (
                        <span className="ml-2">• Processado por {request.operador_aprovacao}</span>
                      )}
                    </div>
                    
                    {request.status === 'pendente' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => handleApproval(request.id, 'rejeitar')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApproval(request.id, 'aprovar')}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Aprovar
                        </Button>
                      </div>
                    )}
                  </div>

                  {request.observacoes_operador && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <span className="font-medium text-gray-600">Observações do Operador:</span>
                      <p className="text-gray-800 mt-1">{request.observacoes_operador}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LineHallFuelCardRequests;