import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Fuel, 
  Plus, 
  ExternalLink, 
  Copy, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  Eye,
  Search,
  Calendar,
  FileText,
  Settings,
  CheckCircle,
  Clock,
  CreditCard
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';

interface Abastecimento {
  id: number;
  nome: string;
  cpf: string;
  placa: string;
  km: number;
  tipo_motorista: string;
  tipo_combustivel: string;
  valor_unit: number;
  valor_total: number;
  litros: number;
  status: 'pendente' | 'faturado' | 'pago';
  base_name: string;
  projeto_name: string;
  posto_name?: string;
  created_at: string;
}

interface Token {
  id: number;
  token: string;
  base_name: string;
  projeto_name: string;
  ativo: boolean;
  expires_at: string;
  created_at: string;
}

interface Posto {
  id: number;
  nome: string;
  cnpj: string;
  ativo: boolean;
}

interface DashboardStats {
  total_registros: number;
  valor_total: number;
  litros_total: number;
  pendentes: number;
  faturados: number;
  pagos: number;
}

export default function PainelAdministrativoAbastecimento() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filters, setFilters] = useState({
    status: '',
    base_id: '',
    projeto_id: ''
  });
  const [newToken, setNewToken] = useState({ base_id: '', projeto_id: '', expires_days: 90 });

  // Só renderizar e fazer chamadas se o usuário estiver autenticado
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">Você precisa estar logado para acessar esta página.</p>
          <Button onClick={() => window.location.href = '/login'}>
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  // Função para lidar com mudança de projeto (limpar base quando trocar projeto)
  const handleProjectChange = (projetoId: string, isFilter: boolean = false) => {
    if (isFilter) {
      setFilters({
        ...filters,
        projeto_id: projetoId,
        base_id: '' // Limpar seleção de base
      });
    } else {
      setNewToken({
        ...newToken,
        projeto_id: projetoId,
        base_id: '' // Limpar seleção de base
      });
    }
  };

  // Obter bases filtradas pelo projeto selecionado
  const getFilteredBases = (selectedProjectId: string) => {
    if (!projectsWithBasesData || !selectedProjectId) return [];
    const projects = (projectsWithBasesData as any)?.data || [];
    const project = projects.find((p: any) => p.id.toString() === selectedProjectId);
    return project?.bases || [];
  };
  const [newPosto, setNewPosto] = useState({ nome: '', cnpj: '' });

  const queryClient = useQueryClient();

  // Queries - só executar se usuário estiver autenticado
  const { data: dashboardData } = useQuery({
    queryKey: ['/api/admin/abastecimento-pos-pago/dashboard'],
    enabled: activeTab === 'dashboard' && !!user && !authLoading
  });

  const { data: abastecimentosData } = useQuery({
    queryKey: ['/api/admin/abastecimento-pos-pago', filters],
    enabled: activeTab === 'abastecimentos' && !!user && !authLoading
  });

  const { data: tokensData } = useQuery({
    queryKey: ['/api/admin/form-tokens'],
    enabled: activeTab === 'tokens' && !!user && !authLoading
  });

  const { data: postosData } = useQuery({
    queryKey: ['/api/admin/postos-external'],
    enabled: activeTab === 'postos' && !!user && !authLoading
  });

  const { data: projectsWithBasesData } = useQuery({
    queryKey: ['/api/projects-with-bases'],
    enabled: !!user && !authLoading
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest(`/api/admin/abastecimento-pos-pago/${id}/status`, 'PATCH', { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/abastecimento-pos-pago'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/abastecimento-pos-pago/dashboard'] });
    }
  });

  const createTokenMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest('/api/admin/form-tokens', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/form-tokens'] });
      setNewToken({ base_id: '', projeto_id: '', expires_days: 90 });
    }
  });

  const createPostoMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest('/api/admin/postos-external', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/postos-external'] });
      setNewPosto({ nome: '', cnpj: '' });
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const generatePublicLink = (token: string) => {
    return `${window.location.origin}/abastecimento-pos-pago?t=${token}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'faturado': return 'bg-blue-100 text-blue-800';
      case 'pago': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return <Clock className="h-3 w-3" />;
      case 'faturado': return <FileText className="h-3 w-3" />;
      case 'pago': return <CheckCircle className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema Pós-Pago</h1>
          <p className="text-gray-600">Gestão de abastecimentos e faturamento</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">
            <TrendingUp className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="abastecimentos">
            <Fuel className="h-4 w-4 mr-2" />
            Abastecimentos
          </TabsTrigger>
          <TabsTrigger value="tokens">
            <ExternalLink className="h-4 w-4 mr-2" />
            Links/Tokens
          </TabsTrigger>
          <TabsTrigger value="postos">
            <Settings className="h-4 w-4 mr-2" />
            Postos
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {(dashboardData as any)?.data && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Registros</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {(dashboardData as any).data.estatisticas.total_registros}
                        </p>
                      </div>
                      <Fuel className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Valor Total</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency((dashboardData as any).data.estatisticas.valor_total)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Litros Total</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {parseFloat((dashboardData as any).data.estatisticas.litros_total).toFixed(2)}L
                        </p>
                      </div>
                      <Fuel className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pendentes</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {dashboardData.data.estatisticas.pendentes}
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Status dos Pagamentos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <span>Pendentes</span>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {dashboardData.data.estatisticas.pendentes}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span>Faturados</span>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">
                          {dashboardData.data.estatisticas.faturados}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Pagos</span>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          {dashboardData.data.estatisticas.pagos}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pendências de Faturamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashboardData.data.pendencias?.length > 0 ? (
                      <div className="space-y-2">
                        {dashboardData.data.pendencias.slice(0, 5).map((pendencia: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="truncate">{pendencia.base_name || 'Base'}</span>
                            <span className="font-medium text-red-600">
                              {formatCurrency(pendencia.valor_total_pendente)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Nenhuma pendência encontrada</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Abastecimentos Tab */}
        <TabsContent value="abastecimentos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Filtros</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ status: '', base_id: '', projeto_id: '' })}
                >
                  Limpar Filtros
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="faturado">Faturado</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                  </SelectContent>
                </Select>

                <Select 
                  value={filters.base_id} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, base_id: value }))}
                  disabled={!filters.projeto_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={filters.projeto_id ? "Selecione uma base" : "Selecione um projeto primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as bases</SelectItem>
                    {getFilteredBases(filters.projeto_id).map((base: any) => (
                      <SelectItem key={base.id} value={base.id.toString()}>
                        {base.base_name || base.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.projeto_id} onValueChange={(value) => handleProjectChange(value, true)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os projetos</SelectItem>
                    {(((projectsWithBasesData as any)?.data) || []).map((projeto: any) => (
                      <SelectItem key={projeto.id} value={projeto.id.toString()}>
                        {projeto.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Abastecimentos</CardTitle>
            </CardHeader>
            <CardContent>
              {abastecimentosData?.data?.length > 0 ? (
                <div className="space-y-4">
                  {abastecimentosData.data.map((item: Abastecimento) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(item.status)}>
                            {getStatusIcon(item.status)}
                            <span className="ml-1 capitalize">{item.status}</span>
                          </Badge>
                          <span className="font-medium">{item.placa}</span>
                          <span className="text-gray-600">{item.nome}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(item.valor_total)}</div>
                          <div className="text-sm text-gray-500">{item.litros.toFixed(2)}L</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Base:</span>
                          <div className="font-medium">{item.base_name}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Projeto:</span>
                          <div className="font-medium">{item.projeto_name}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Combustível:</span>
                          <div className="font-medium capitalize">{item.tipo_combustivel}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Data:</span>
                          <div className="font-medium">{formatDate(item.created_at)}</div>
                        </div>
                      </div>

                      {item.status === 'pendente' && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'faturado' })}
                            disabled={updateStatusMutation.isPending}
                          >
                            Marcar como Faturado
                          </Button>
                        </div>
                      )}

                      {item.status === 'faturado' && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'pendente' })}
                            disabled={updateStatusMutation.isPending}
                          >
                            Voltar para Pendente
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'pago' })}
                            disabled={updateStatusMutation.isPending}
                          >
                            Marcar como Pago
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Fuel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum abastecimento encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tokens Tab */}
        <TabsContent value="tokens" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Criar Novo Token</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={newToken.projeto_id} onValueChange={(value) => handleProjectChange(value, false)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o projeto primeiro" />
                  </SelectTrigger>
                  <SelectContent>
                    {(((projectsWithBasesData as any)?.data) || []).map((projeto: any) => (
                      <SelectItem key={projeto.id} value={projeto.id.toString()}>
                        {projeto.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={newToken.base_id} 
                  onValueChange={(value) => setNewToken(prev => ({ ...prev, base_id: value }))}
                  disabled={!newToken.projeto_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={newToken.projeto_id ? "Selecione uma base" : "Selecione um projeto primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getFilteredBases(newToken.projeto_id).map((base: any) => (
                      <SelectItem key={base.id} value={base.id.toString()}>
                        {base.base_name || base.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button 
                  onClick={() => createTokenMutation.mutate(newToken)}
                  disabled={!newToken.base_id || !newToken.projeto_id || createTokenMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Token
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tokens Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              {tokensData?.data?.length > 0 ? (
                <div className="space-y-4">
                  {tokensData.data.map((token: Token) => (
                    <div key={token.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-medium">{token.base_name} - {token.projeto_name}</div>
                          <div className="text-sm text-gray-500">
                            Criado em: {formatDate(token.created_at)}
                          </div>
                          {token.expires_at && (
                            <div className="text-sm text-gray-500">
                              Expira em: {formatDate(token.expires_at)}
                            </div>
                          )}
                        </div>
                        <Badge className={token.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {token.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="text-sm text-gray-500">Token:</label>
                          <div className="flex items-center gap-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1 truncate">
                              {token.token}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(token.token)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm text-gray-500">Link Público:</label>
                          <div className="flex items-center gap-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1 truncate">
                              {generatePublicLink(token.token)}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(generatePublicLink(token.token))}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(generatePublicLink(token.token), '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ExternalLink className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum token encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Postos Tab */}
        <TabsContent value="postos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Novo Posto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Nome do posto"
                  value={newPosto.nome}
                  onChange={(e) => setNewPosto(prev => ({ ...prev, nome: e.target.value }))}
                />
                <Input
                  placeholder="CNPJ"
                  value={newPosto.cnpj}
                  onChange={(e) => setNewPosto(prev => ({ ...prev, cnpj: e.target.value }))}
                />
                <Button 
                  onClick={() => createPostoMutation.mutate(newPosto)}
                  disabled={!newPosto.nome || createPostoMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Posto
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Postos Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              {postosData?.data?.length > 0 ? (
                <div className="space-y-4">
                  {postosData.data.map((posto: Posto) => (
                    <div key={posto.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{posto.nome}</div>
                          <div className="text-sm text-gray-500">CNPJ: {posto.cnpj}</div>
                        </div>
                        <Badge className={posto.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {posto.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum posto cadastrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}