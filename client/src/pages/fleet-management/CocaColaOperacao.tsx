import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Truck, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Wrench,
  Users,
  Package,
  BarChart3,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Route,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'wouter';

interface CocaColaBase {
  id: number;
  nome: string;
  cidade: string;
  estado: string;
  ativo: boolean;
  created_at: string;
}

interface CocaColaVehicle {
  id: number;
  placa: string;
  modelo: string;
  base_id: number;
  base_nome?: string;
  status: 'disponivel' | 'rota' | 'manutencao' | 'falta_equipe' | 'aguardando_peca' | 'outro';
  oficina?: string;
  prazo_estimado?: string;
  motivo_parado?: string;
  created_at: string;
}

interface CocaColaDailyUpdate {
  id: number;
  base_id: number;
  base_nome?: string;
  data_atualizacao: string;
  total_veiculos: number;
  veiculos_rota: number;
  veiculos_manutencao: number;
  veiculos_disponiveis: number;
  veiculos_parados: number;
  atualizado_por?: string;
  created_at: string;
}

export default function CocaColaOperacao() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [newBaseDialogOpen, setNewBaseDialogOpen] = useState(false);
  const [newVehicleDialogOpen, setNewVehicleDialogOpen] = useState(false);
  const [newBaseName, setNewBaseName] = useState('');
  const [newBaseCidade, setNewBaseCidade] = useState('');
  const [newBaseEstado, setNewBaseEstado] = useState('');
  const [newVehiclePlaca, setNewVehiclePlaca] = useState('');
  const [newVehicleModelo, setNewVehicleModelo] = useState('');
  const [newVehicleBaseId, setNewVehicleBaseId] = useState<number | null>(null);
  const [selectedBaseFilter, setSelectedBaseFilter] = useState<string>('all');

  const hoje = format(new Date(), 'yyyy-MM-dd');

  // Função customizada para fetch com credentials
  const fetchWithCredentials = async (url: string) => {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  };

  const { data: bases = [], isLoading: loadingBases, refetch: refetchBases, error: basesError } = useQuery<CocaColaBase[]>({
    queryKey: ['/api/coca-cola/bases'],
    queryFn: () => fetchWithCredentials('/api/coca-cola/bases'),
    refetchOnWindowFocus: false,
    enabled: !!user,
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000
  });

  const { data: vehicles = [], isLoading: loadingVehicles, refetch: refetchVehicles } = useQuery<CocaColaVehicle[]>({
    queryKey: ['/api/coca-cola/vehicles'],
    queryFn: () => fetchWithCredentials('/api/coca-cola/vehicles'),
    refetchOnWindowFocus: false,
    enabled: !!user,
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000
  });

  const { data: dailyUpdates = [], refetch: refetchUpdates } = useQuery<CocaColaDailyUpdate[]>({
    queryKey: ['/api/coca-cola/daily-updates', hoje],
    queryFn: () => fetchWithCredentials(`/api/coca-cola/daily-updates?data=${hoje}`),
    refetchOnWindowFocus: false,
    enabled: !!user,
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000
  });

  // Refetch quando o usuário mudar (após login)
  useEffect(() => {
    if (user) {
      // Pequeno delay para garantir que a sessão foi sincronizada
      const timer = setTimeout(() => {
        console.log('[COCA-COLA] Refetching bases após login...');
        refetchBases();
        refetchVehicles();
        refetchUpdates();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const createBaseMutation = useMutation({
    mutationFn: async (data: { nome: string; cidade: string; estado: string }) => {
      return apiRequest('POST', '/api/coca-cola/bases', data);
    },
    onSuccess: () => {
      toast({ title: 'Base criada com sucesso!' });
      setNewBaseDialogOpen(false);
      setNewBaseName('');
      setNewBaseCidade('');
      setNewBaseEstado('');
      queryClient.invalidateQueries({ queryKey: ['/api/coca-cola/bases'] });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erro ao criar base' });
    }
  });

  const createVehicleMutation = useMutation({
    mutationFn: async (data: { placa: string; modelo: string; base_id: number }) => {
      return apiRequest('POST', '/api/coca-cola/vehicles', data);
    },
    onSuccess: () => {
      toast({ title: 'Veículo cadastrado com sucesso!' });
      setNewVehicleDialogOpen(false);
      setNewVehiclePlaca('');
      setNewVehicleModelo('');
      setNewVehicleBaseId(null);
      queryClient.invalidateQueries({ queryKey: ['/api/coca-cola/vehicles'] });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erro ao cadastrar veículo' });
    }
  });

  const updateVehicleStatusMutation = useMutation({
    mutationFn: async (data: { id: number; status: string; oficina?: string; prazo_estimado?: string; motivo_parado?: string }) => {
      return apiRequest('PATCH', `/api/coca-cola/vehicles/${data.id}/status`, data);
    },
    onSuccess: () => {
      toast({ title: 'Status atualizado!' });
      queryClient.invalidateQueries({ queryKey: ['/api/coca-cola/vehicles'] });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erro ao atualizar status' });
    }
  });

  const saveDailyUpdateMutation = useMutation({
    mutationFn: async (baseId: number) => {
      const baseVehicles = vehicles.filter(v => v.base_id === baseId);
      return apiRequest('POST', '/api/coca-cola/daily-updates', {
        base_id: baseId,
        data_atualizacao: hoje,
        total_veiculos: baseVehicles.length,
        veiculos_rota: baseVehicles.filter(v => v.status === 'rota').length,
        veiculos_manutencao: baseVehicles.filter(v => v.status === 'manutencao').length,
        veiculos_disponiveis: baseVehicles.filter(v => v.status === 'disponivel').length,
        veiculos_parados: baseVehicles.filter(v => ['falta_equipe', 'aguardando_peca', 'outro'].includes(v.status)).length
      });
    },
    onSuccess: () => {
      toast({ title: 'Atualização diária salva!' });
      queryClient.invalidateQueries({ queryKey: ['/api/coca-cola/daily-updates'] });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erro ao salvar atualização' });
    }
  });

  const saveAllDailyUpdates = async () => {
    for (const base of bases.filter(b => b.ativo)) {
      await saveDailyUpdateMutation.mutateAsync(base.id);
    }
    toast({ title: 'Todas as atualizações diárias foram salvas!' });
  };

  const totalVeiculos = vehicles.length;
  const veiculosRota = vehicles.filter(v => v.status === 'rota').length;
  const veiculosManutencao = vehicles.filter(v => v.status === 'manutencao').length;
  const veiculosDisponiveis = vehicles.filter(v => v.status === 'disponivel').length;
  const veiculosParados = vehicles.filter(v => ['falta_equipe', 'aguardando_peca', 'outro'].includes(v.status)).length;

  const basesAtualizadasHoje = dailyUpdates.filter(u => u.data_atualizacao === hoje).map(u => u.base_id);
  const basesPendentes = bases.filter(b => b.ativo && !basesAtualizadasHoje.includes(b.id));

  const percDisponivel = totalVeiculos > 0 ? Math.round((veiculosDisponiveis / totalVeiculos) * 100) : 0;
  const percRota = totalVeiculos > 0 ? Math.round((veiculosRota / totalVeiculos) * 100) : 0;
  const percManutencao = totalVeiculos > 0 ? Math.round((veiculosManutencao / totalVeiculos) * 100) : 0;

  const filteredVehicles = selectedBaseFilter === 'all' 
    ? vehicles 
    : vehicles.filter(v => v.base_id === parseInt(selectedBaseFilter));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'disponivel':
        return <Badge className="bg-green-100 text-green-800">Disponível</Badge>;
      case 'rota':
        return <Badge className="bg-blue-100 text-blue-800">Em Rota</Badge>;
      case 'manutencao':
        return <Badge className="bg-orange-100 text-orange-800">Manutenção</Badge>;
      case 'falta_equipe':
        return <Badge className="bg-yellow-100 text-yellow-800">Falta Equipe</Badge>;
      case 'aguardando_peca':
        return <Badge className="bg-purple-100 text-purple-800">Aguard. Peça</Badge>;
      case 'outro':
        return <Badge className="bg-gray-100 text-gray-800">Outro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/fleet-management">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold flex items-center text-red-700">
                  <Truck className="mr-2 h-8 w-8" />
                  Operação Coca-Cola
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gestão de frota e disponibilidade para operações Coca-Cola
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="default" 
                className="bg-green-600 hover:bg-green-700"
                onClick={saveAllDailyUpdates}
                disabled={saveDailyUpdateMutation.isPending || bases.length === 0}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> 
                {saveDailyUpdateMutation.isPending ? 'Salvando...' : 'Salvar Atualização Diária'}
              </Button>
              <Button variant="outline" onClick={() => { refetchBases(); refetchVehicles(); refetchUpdates(); }}>
                <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard">
                <BarChart3 className="h-4 w-4 mr-2" /> Dashboard
              </TabsTrigger>
              <TabsTrigger value="veiculos">
                <Truck className="h-4 w-4 mr-2" /> Veículos
              </TabsTrigger>
              <TabsTrigger value="bases">
                <Building2 className="h-4 w-4 mr-2" /> Bases
              </TabsTrigger>
              <TabsTrigger value="historico">
                <Calendar className="h-4 w-4 mr-2" /> Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Frota Disponível</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-green-600">{percDisponivel}%</span>
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{veiculosDisponiveis} veículos</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Em Rota</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-blue-600">{percRota}%</span>
                      <Route className="h-8 w-8 text-blue-500" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{veiculosRota} veículos</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Em Manutenção</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-orange-600">{percManutencao}%</span>
                      <Wrench className="h-8 w-8 text-orange-500" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{veiculosManutencao} veículos</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Parados (Outros)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-red-600">{veiculosParados}</span>
                      <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Falta equipe / Peça</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Status das Bases Hoje
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {bases.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma base cadastrada. Adicione bases na aba "Bases".
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {bases.filter(b => b.ativo).map(base => {
                          const atualizouHoje = basesAtualizadasHoje.includes(base.id);
                          return (
                            <div 
                              key={base.id} 
                              className={`flex items-center justify-between p-3 rounded-lg ${atualizouHoje ? 'bg-green-50' : 'bg-red-50'}`}
                            >
                              <div>
                                <p className="font-medium">{base.nome}</p>
                                <p className="text-sm text-muted-foreground">{base.cidade}/{base.estado}</p>
                              </div>
                              {atualizouHoje ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Atualizado
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800">
                                  <Clock className="h-3 w-3 mr-1" /> Pendente
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                      Veículos em Manutenção
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {vehicles.filter(v => v.status === 'manutencao').length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum veículo em manutenção.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {vehicles.filter(v => v.status === 'manutencao').map(v => (
                          <div key={v.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                            <div>
                              <p className="font-medium">{v.placa}</p>
                              <p className="text-sm text-muted-foreground">{v.modelo}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{v.oficina || 'Oficina N/I'}</p>
                              {v.prazo_estimado && (
                                <p className="text-xs text-muted-foreground">
                                  Prazo: {format(new Date(v.prazo_estimado), 'dd/MM/yyyy')}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="veiculos" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  <Select value={selectedBaseFilter} onValueChange={setSelectedBaseFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filtrar por base" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Bases</SelectItem>
                      {bases.map(base => (
                        <SelectItem key={base.id} value={base.id.toString()}>{base.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                    {filteredVehicles.length} veículos
                  </span>
                </div>
                <Dialog open={newVehicleDialogOpen} onOpenChange={setNewVehicleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" /> Novo Veículo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cadastrar Veículo</DialogTitle>
                      <DialogDescription>Adicione um novo veículo à frota Coca-Cola</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Placa</Label>
                        <Input 
                          value={newVehiclePlaca} 
                          onChange={e => setNewVehiclePlaca(e.target.value.toUpperCase())}
                          placeholder="ABC1234"
                        />
                      </div>
                      <div>
                        <Label>Modelo</Label>
                        <Input 
                          value={newVehicleModelo} 
                          onChange={e => setNewVehicleModelo(e.target.value)}
                          placeholder="Ex: VW Delivery 9.170"
                        />
                      </div>
                      <div>
                        <Label>Base</Label>
                        <Select value={newVehicleBaseId?.toString() || ''} onValueChange={v => setNewVehicleBaseId(parseInt(v))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a base" />
                          </SelectTrigger>
                          <SelectContent>
                            {bases.map(base => (
                              <SelectItem key={base.id} value={base.id.toString()}>{base.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewVehicleDialogOpen(false)}>Cancelar</Button>
                      <Button 
                        onClick={() => {
                          if (newVehiclePlaca && newVehicleModelo && newVehicleBaseId) {
                            createVehicleMutation.mutate({
                              placa: newVehiclePlaca,
                              modelo: newVehicleModelo,
                              base_id: newVehicleBaseId
                            });
                          }
                        }}
                        disabled={!newVehiclePlaca || !newVehicleModelo || !newVehicleBaseId}
                      >
                        Cadastrar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Placa</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Base</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Oficina/Motivo</TableHead>
                        <TableHead>Prazo</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingVehicles ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell>
                        </TableRow>
                      ) : filteredVehicles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Nenhum veículo cadastrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredVehicles.map(v => (
                          <TableRow key={v.id}>
                            <TableCell className="font-medium">{v.placa}</TableCell>
                            <TableCell>{v.modelo}</TableCell>
                            <TableCell>{bases.find(b => b.id === v.base_id)?.nome || '-'}</TableCell>
                            <TableCell>{getStatusBadge(v.status)}</TableCell>
                            <TableCell>{v.oficina || v.motivo_parado || '-'}</TableCell>
                            <TableCell>
                              {v.prazo_estimado ? format(new Date(v.prazo_estimado), 'dd/MM/yyyy') : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Select 
                                value={v.status} 
                                onValueChange={(newStatus) => updateVehicleStatusMutation.mutate({ id: v.id, status: newStatus })}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="disponivel">Disponível</SelectItem>
                                  <SelectItem value="rota">Em Rota</SelectItem>
                                  <SelectItem value="manutencao">Manutenção</SelectItem>
                                  <SelectItem value="falta_equipe">Falta Equipe</SelectItem>
                                  <SelectItem value="aguardando_peca">Aguard. Peça</SelectItem>
                                  <SelectItem value="outro">Outro</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bases" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Bases Cadastradas</h2>
                <Dialog open={newBaseDialogOpen} onOpenChange={setNewBaseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" /> Nova Base
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cadastrar Base Coca-Cola</DialogTitle>
                      <DialogDescription>Adicione uma nova unidade/CD</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Nome da Base</Label>
                        <Input 
                          value={newBaseName} 
                          onChange={e => setNewBaseName(e.target.value)}
                          placeholder="Ex: CD Recife"
                        />
                      </div>
                      <div>
                        <Label>Cidade</Label>
                        <Input 
                          value={newBaseCidade} 
                          onChange={e => setNewBaseCidade(e.target.value)}
                          placeholder="Ex: Recife"
                        />
                      </div>
                      <div>
                        <Label>Estado</Label>
                        <Input 
                          value={newBaseEstado} 
                          onChange={e => setNewBaseEstado(e.target.value.toUpperCase())}
                          placeholder="Ex: PE"
                          maxLength={2}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewBaseDialogOpen(false)}>Cancelar</Button>
                      <Button 
                        onClick={() => createBaseMutation.mutate({ nome: newBaseName, cidade: newBaseCidade, estado: newBaseEstado })}
                        disabled={!newBaseName || !newBaseCidade || !newBaseEstado}
                      >
                        Cadastrar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loadingBases ? (
                  <p>Carregando...</p>
                ) : bases.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Nenhuma base cadastrada. Clique em "Nova Base" para adicionar.
                    </CardContent>
                  </Card>
                ) : (
                  bases.map(base => {
                    const veiculosBase = vehicles.filter(v => v.base_id === base.id);
                    const atualizouHoje = basesAtualizadasHoje.includes(base.id);
                    return (
                      <Card key={base.id} className={base.ativo ? '' : 'opacity-50'}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{base.nome}</CardTitle>
                            {atualizouHoje ? (
                              <Badge className="bg-green-100 text-green-800">OK</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">Pendente</Badge>
                            )}
                          </div>
                          <CardDescription>{base.cidade}/{base.estado}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-2xl font-bold">{veiculosBase.length}</p>
                              <p className="text-sm text-muted-foreground">veículos</p>
                            </div>
                            <div className="text-right text-sm">
                              <p className="text-green-600">{veiculosBase.filter(v => v.status === 'rota').length} em rota</p>
                              <p className="text-orange-600">{veiculosBase.filter(v => v.status === 'manutencao').length} manutenção</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="historico" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Atualizações</CardTitle>
                  <CardDescription>Registro de atualizações diárias por base</CardDescription>
                </CardHeader>
                <CardContent>
                  {dailyUpdates.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum registro de atualização encontrado.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Base</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Em Rota</TableHead>
                          <TableHead>Manutenção</TableHead>
                          <TableHead>Disponíveis</TableHead>
                          <TableHead>Parados</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dailyUpdates.map(update => (
                          <TableRow key={update.id}>
                            <TableCell>{format(new Date(update.data_atualizacao), 'dd/MM/yyyy')}</TableCell>
                            <TableCell>{update.base_nome || bases.find(b => b.id === update.base_id)?.nome || '-'}</TableCell>
                            <TableCell>{update.total_veiculos}</TableCell>
                            <TableCell className="text-blue-600">{update.veiculos_rota}</TableCell>
                            <TableCell className="text-orange-600">{update.veiculos_manutencao}</TableCell>
                            <TableCell className="text-green-600">{update.veiculos_disponiveis}</TableCell>
                            <TableCell className="text-red-600">{update.veiculos_parados}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
