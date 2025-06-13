import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, RefreshCcw, Search, Edit, Trash2, Truck, FileText, CheckSquare, Wrench, AlertCircle, Car, UserPlus, MapPin, CreditCard, LogOut } from 'lucide-react';
import { api } from '@/services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LineHallTrip {
  id: number;
  placa_cavalo: string;
  placa_carreta_1: string;
  placa_carreta_2?: string | null;
  motorista_id: number;
  motorista_nome: string;
  local_carregamento: string;
  local_descarregamento: string;
  horario_carregamento?: string | null;
  status_viagem: string;
  data_inicio: string;
  data_viagem?: string;
  data_fim?: string | null;
  observacoes?: string | null;
  rota_selecionada?: string;
  km_total?: number;
  created_at: string;
  updated_at: string;
}

interface RouteData {
  id: number;
  nome_ponto_a: string;
  nome_ponto_b: string;
  km_total: number;
}

interface Vehicle {
  id: number;
  plate: string;
  model: string;
  vehicleType: string;
  status: string;
  baseId: number;
}

interface Driver {
  id: number;
  nome: string;
  cpf: string;
  telefone?: string;
}

interface FuelCardRequest {
  id: number;
  motorista_id: number;
  motorista_nome: string;
  motorista_telefone: string;
  veiculo_placa: string;
  rota_origem: string;
  rota_destino: string;
  data_viagem: string;
  horario_carregamento: string;
  km_total: number;
  horario_abastecimento: string;
  status: 'pendente' | 'aprovada' | 'rejeitada';
  observacoes_operador?: string;
  valor_solicitado?: number;
  valor_aprovado?: number;
  valor_calculado?: number;
  operador_aprovacao?: string;
  created_at: string;
  updated_at: string;
}

export default function LineHallShopeePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [trips, setTrips] = useState<LineHallTrip[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [fuelRequests, setFuelRequests] = useState<FuelCardRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTrip, setEditingTrip] = useState<LineHallTrip | null>(null);
  const [newTrip, setNewTrip] = useState({
    placa_cavalo: '',
    placa_carreta_1: '',
    placa_carreta_2: '',
    motorista_id: '',
    local_carregamento: '',
    local_descarregamento: '',
    horario_carregamento: '',
    rota_selecionada: '',
    observacoes: ''
  });
  const [newRoute, setNewRoute] = useState({
    nome_ponto_a: '',
    nome_ponto_b: '',
    km_total: ''
  });

  // Estados para estatísticas
  const [maintenanceStats, setMaintenanceStats] = useState({
    pendentes: 0,
    em_andamento: 0,
    concluidas: 0
  });
  const [garageStats, setGarageStats] = useState<Vehicle[]>([]);
  const [pendingFuelRequests, setPendingFuelRequests] = useState(0);

  const fetchTrips = async () => {
    try {
      const response = await api.get('/line-hall-shopee');
      if (response.data.success) {
        setTrips(response.data.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar viagens:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar viagens",
        variant: "destructive",
      });
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await api.get('/line-hall/routes');
      if (response.data.success) {
        setRoutes(response.data.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar rotas:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      const allVehicles = response.data || [];
      
      console.log('Todos os veículos:', allVehicles);
      
      // Filtrar veículos do Line Hall (base_id 3 e 1)
      const lineHallVehicles = allVehicles.filter((v: any) => 
        v.baseId === 3 || v.baseId === 1
      );
      
      console.log('Veículos do Line Hall filtrados:', lineHallVehicles);
      setVehicles(lineHallVehicles);
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await api.get('/drivers');
      const allDrivers = response.data || [];
      console.log('Todos os motoristas:', allDrivers);
      setDrivers(allDrivers);
    } catch (error) {
      console.error('Erro ao buscar motoristas:', error);
    }
  };

  const fetchFuelRequests = async () => {
    try {
      const response = await api.get('/line-hall/fuel-requests');
      console.log('Solicitações do Line Hall API Response:', response.data);
      if (response.data.success) {
        setFuelRequests(response.data.data || []);
        
        // Contar solicitações pendentes
        const pending = (response.data.data || []).filter((req: FuelCardRequest) => 
          req.status === 'pendente'
        ).length;
        setPendingFuelRequests(pending);
      }
    } catch (error) {
      console.error('Erro ao buscar solicitações de cartão combustível:', error);
    }
  };

  const fetchMaintenanceStats = async () => {
    try {
      const response = await api.get('/line-hall/maintenance-stats');
      if (response.data.success) {
        setMaintenanceStats(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas de manutenção:', error);
    }
  };

  const fetchGarageStats = async () => {
    try {
      const response = await api.get('/line-hall/garage-stats');
      if (response.data.success) {
        setGarageStats(response.data.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas do pátio:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchTrips(),
        fetchRoutes(),
        fetchVehicles(),
        fetchDrivers(),
        fetchFuelRequests(),
        fetchMaintenanceStats(),
        fetchGarageStats()
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  const handleCreateTrip = async () => {
    try {
      const response = await api.post('/line-hall-shopee', newTrip);
      if (response.data.success) {
        toast({
          title: "Sucesso",
          description: "Viagem criada com sucesso!",
        });
        setIsCreatingTrip(false);
        setNewTrip({
          placa_cavalo: '',
          placa_carreta_1: '',
          placa_carreta_2: '',
          motorista_id: '',
          local_carregamento: '',
          local_descarregamento: '',
          horario_carregamento: '',
          rota_selecionada: '',
          observacoes: ''
        });
        fetchTrips();
      }
    } catch (error) {
      console.error('Erro ao criar viagem:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar viagem",
        variant: "destructive",
      });
    }
  };

  const handleCreateRoute = async () => {
    try {
      const response = await api.post('/line-hall/routes', {
        ...newRoute,
        km_total: parseInt(newRoute.km_total)
      });
      if (response.data.success) {
        toast({
          title: "Sucesso",
          description: "Rota criada com sucesso!",
        });
        setIsCreatingRoute(false);
        setNewRoute({
          nome_ponto_a: '',
          nome_ponto_b: '',
          km_total: ''
        });
        fetchRoutes();
      }
    } catch (error) {
      console.error('Erro ao criar rota:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar rota",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTrip = async (id: number) => {
    try {
      const response = await api.delete(`/line-hall-shopee/${id}`);
      if (response.data.success) {
        toast({
          title: "Sucesso",
          description: "Viagem excluída com sucesso!",
        });
        fetchTrips();
      }
    } catch (error) {
      console.error('Erro ao excluir viagem:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir viagem",
        variant: "destructive",
      });
    }
  };

  const editTrip = (trip: LineHallTrip) => {
    setEditingTrip(trip);
    setIsEditing(true);
  };

  const handleUpdateTrip = async () => {
    if (!editingTrip) return;

    try {
      const response = await api.put(`/line-hall-shopee/${editingTrip.id}`, editingTrip);
      if (response.data.success) {
        toast({
          title: "Sucesso",
          description: "Viagem atualizada com sucesso!",
        });
        setIsEditing(false);
        setEditingTrip(null);
        fetchTrips();
      }
    } catch (error) {
      console.error('Erro ao atualizar viagem:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar viagem",
        variant: "destructive",
      });
    }
  };

  // Função para logout
  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'planejada': 'bg-blue-100 text-blue-800',
      'em_andamento': 'bg-yellow-100 text-yellow-800',
      'concluida': 'bg-green-100 text-green-800',
      'cancelada': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredTrips = trips.filter(trip => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (trip.placa_cavalo?.toLowerCase() || '').includes(searchLower) ||
      (trip.placa_carreta_1?.toLowerCase() || '').includes(searchLower) ||
      (trip.motorista_nome?.toLowerCase() || '').includes(searchLower) ||
      (trip.local_carregamento?.toLowerCase() || '').includes(searchLower) ||
      (trip.local_descarregamento?.toLowerCase() || '').includes(searchLower)
    );
  });

  return (
    <MainLayoutSimple>
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat relative"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')",
        }}
      >
        {/* Overlay para melhorar legibilidade */}
        <div className="absolute inset-0 bg-white/85 backdrop-blur-sm"></div>
        
        {/* Conteúdo principal */}
        <div className="relative z-10 space-y-6 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Line Hall Shopee</h1>
              <p className="text-muted-foreground">
                Gerenciamento de viagens de Line Hall
              </p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setLocation('/vehicles')} 
                className="flex items-center"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Cadastrar Veículo
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/drivers')} 
                className="flex items-center"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Cadastrar Motorista
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/line-hall/fuel-requests')} 
                className="flex items-center relative"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Solicitações Cartão
                {pendingFuelRequests > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {pendingFuelRequests}
                  </div>
                )}
              </Button>
              <Button variant="outline" onClick={fetchTrips} className="flex items-center">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Atualizar
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLogout} 
                className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>

          {/* Estatísticas em Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Manutenções Pendentes</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{maintenanceStats.pendentes}</div>
                <p className="text-xs text-muted-foreground">
                  Requerendo atenção
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Manutenção</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{maintenanceStats.em_andamento}</div>
                <p className="text-xs text-muted-foreground">
                  Em andamento
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Veículos no Pátio</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{garageStats.length}</div>
                <p className="text-xs text-muted-foreground">
                  Disponíveis
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cartões Pendentes</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingFuelRequests}</div>
                <p className="text-xs text-muted-foreground">
                  Aguardando aprovação
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Controles e busca */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button onClick={() => setIsCreatingTrip(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Viagem
              </Button>
              <Button variant="outline" onClick={() => setIsCreatingRoute(true)}>
                <MapPin className="mr-2 h-4 w-4" />
                Nova Rota
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar viagens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>

          {/* Lista de viagens */}
          <Card>
            <CardHeader>
              <CardTitle>Viagens do Line Hall</CardTitle>
              <CardDescription>
                Gerenciamento de viagens e rotas do Line Hall Shopee
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cavalo</TableHead>
                      <TableHead>Carreta 1</TableHead>
                      <TableHead>Carreta 2</TableHead>
                      <TableHead>Motorista</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell className="font-medium">{trip.placa_cavalo}</TableCell>
                        <TableCell>{trip.placa_carreta_1}</TableCell>
                        <TableCell>{trip.placa_carreta_2 || '-'}</TableCell>
                        <TableCell>{trip.motorista_nome}</TableCell>
                        <TableCell>{trip.local_carregamento}</TableCell>
                        <TableCell>{trip.local_descarregamento}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(trip.status_viagem)}>
                            {trip.status_viagem}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {trip.data_inicio && format(new Date(trip.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => editTrip(trip)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeleteTrip(trip.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  {filteredTrips.length === 0 && (
                    <TableCaption>Nenhuma viagem encontrada.</TableCaption>
                  )}
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Dialog para criar nova viagem */}
          <Dialog open={isCreatingTrip} onOpenChange={setIsCreatingTrip}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Nova Viagem</DialogTitle>
                <DialogDescription>
                  Cadastre uma nova viagem do Line Hall
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="placa_cavalo">Placa do Cavalo</Label>
                    <Select 
                      value={newTrip.placa_cavalo} 
                      onValueChange={(value) => setNewTrip({...newTrip, placa_cavalo: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cavalo" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.filter(v => v.vehicleType === 'cavalo_mecanico').map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.plate}>
                            {vehicle.plate} - {vehicle.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="placa_carreta_1">Placa Carreta 1</Label>
                    <Select 
                      value={newTrip.placa_carreta_1} 
                      onValueChange={(value) => setNewTrip({...newTrip, placa_carreta_1: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a carreta" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.filter(v => v.vehicleType === 'carreta').map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.plate}>
                            {vehicle.plate} - {vehicle.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="placa_carreta_2">Placa Carreta 2 (Opcional)</Label>
                    <Select 
                      value={newTrip.placa_carreta_2} 
                      onValueChange={(value) => setNewTrip({...newTrip, placa_carreta_2: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a carreta (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhuma</SelectItem>
                        {vehicles.filter(v => v.vehicleType === 'carreta').map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.plate}>
                            {vehicle.plate} - {vehicle.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motorista_id">Motorista</Label>
                    <Select 
                      value={newTrip.motorista_id} 
                      onValueChange={(value) => setNewTrip({...newTrip, motorista_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o motorista" />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id.toString()}>
                            {driver.nome} - {driver.cpf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rota_selecionada">Rota</Label>
                  <Select 
                    value={newTrip.rota_selecionada} 
                    onValueChange={(value) => setNewTrip({...newTrip, rota_selecionada: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a rota" />
                    </SelectTrigger>
                    <SelectContent>
                      {routes.map((route) => (
                        <SelectItem key={route.id} value={`${route.nome_ponto_a} → ${route.nome_ponto_b}`}>
                          {route.nome_ponto_a} → {route.nome_ponto_b} ({route.km_total}km)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="local_carregamento">Local de Carregamento</Label>
                    <Input
                      id="local_carregamento"
                      value={newTrip.local_carregamento}
                      onChange={(e) => setNewTrip({...newTrip, local_carregamento: e.target.value})}
                      placeholder="Digite o local de carregamento"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="local_descarregamento">Local de Descarregamento</Label>
                    <Input
                      id="local_descarregamento"
                      value={newTrip.local_descarregamento}
                      onChange={(e) => setNewTrip({...newTrip, local_descarregamento: e.target.value})}
                      placeholder="Digite o local de descarregamento"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horario_carregamento">Horário de Carregamento</Label>
                  <Input
                    id="horario_carregamento"
                    type="datetime-local"
                    value={newTrip.horario_carregamento}
                    onChange={(e) => setNewTrip({...newTrip, horario_carregamento: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Input
                    id="observacoes"
                    value={newTrip.observacoes}
                    onChange={(e) => setNewTrip({...newTrip, observacoes: e.target.value})}
                    placeholder="Observações adicionais"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreatingTrip(false)}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleCreateTrip}>
                  Criar Viagem
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog para criar nova rota */}
          <Dialog open={isCreatingRoute} onOpenChange={setIsCreatingRoute}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Cadastrar Nova Rota</DialogTitle>
                <DialogDescription>
                  Cadastre uma nova rota para o Line Hall
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome_ponto_a">Ponto A (Origem)</Label>
                    <Input
                      id="nome_ponto_a"
                      value={newRoute.nome_ponto_a}
                      onChange={(e) => setNewRoute({...newRoute, nome_ponto_a: e.target.value})}
                      placeholder="Ex: São Paulo SP"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nome_ponto_b">Ponto B (Destino)</Label>
                    <Input
                      id="nome_ponto_b"
                      value={newRoute.nome_ponto_b}
                      onChange={(e) => setNewRoute({...newRoute, nome_ponto_b: e.target.value})}
                      placeholder="Ex: Rio de Janeiro RJ"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="km_total">Quilometragem Total</Label>
                  <Input
                    id="km_total"
                    type="number"
                    value={newRoute.km_total}
                    onChange={(e) => setNewRoute({...newRoute, km_total: e.target.value})}
                    placeholder="Ex: 430"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreatingRoute(false)}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleCreateRoute}>
                  Cadastrar Rota
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog para editar viagem */}
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Editar Viagem</DialogTitle>
                <DialogDescription>
                  Edite os dados da viagem
                </DialogDescription>
              </DialogHeader>
              {editingTrip && (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_placa_cavalo">Placa do Cavalo</Label>
                      <Select 
                        value={editingTrip.placa_cavalo} 
                        onValueChange={(value) => setEditingTrip({...editingTrip, placa_cavalo: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cavalo" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicles.filter(v => v.vehicleType === 'cavalo_mecanico').map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.plate}>
                              {vehicle.plate} - {vehicle.model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_placa_carreta_1">Placa Carreta 1</Label>
                      <Select 
                        value={editingTrip.placa_carreta_1} 
                        onValueChange={(value) => setEditingTrip({...editingTrip, placa_carreta_1: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a carreta" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicles.filter(v => v.vehicleType === 'carreta').map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.plate}>
                              {vehicle.plate} - {vehicle.model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_local_carregamento">Local de Carregamento</Label>
                      <Input
                        id="edit_local_carregamento"
                        value={editingTrip.local_carregamento}
                        onChange={(e) => setEditingTrip({...editingTrip, local_carregamento: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_local_descarregamento">Local de Descarregamento</Label>
                      <Input
                        id="edit_local_descarregamento"
                        value={editingTrip.local_descarregamento}
                        onChange={(e) => setEditingTrip({...editingTrip, local_descarregamento: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_status_viagem">Status da Viagem</Label>
                    <Select 
                      value={editingTrip.status_viagem} 
                      onValueChange={(value) => setEditingTrip({...editingTrip, status_viagem: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planejada">Planejada</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_observacoes">Observações</Label>
                      <Input
                        id="edit_observacoes"
                        name="observacoes"
                        value={editingTrip.observacoes || ''}
                        onChange={(e) => setEditingTrip({...editingTrip, observacoes: e.target.value})}
                        placeholder="Observações adicionais"
                      />
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                <Button type="button" onClick={handleUpdateTrip}>Atualizar Viagem</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </MainLayoutSimple>
  );
}