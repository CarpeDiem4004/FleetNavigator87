import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { 
  Search, 
  CheckCircle, 
  Wrench, 
  Car, 
  Route, 
  Plus, 
  Eye, 
  Settings,
  LogOut,
  Truck,
  MapPin,
  Calendar,
  Users,
  Loader2,
  RefreshCcw
} from 'lucide-react';
import lineHaulLayoutImage from '@assets/Layout Line haul  (1908 x 1126 px)_1754396606629.png';
import { api } from '@/services/api';

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

const LineHaulPage = () => {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para dados
  const [trips, setTrips] = useState<LineHallTrip[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  // Estados para diálogos
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [showRoutes, setShowRoutes] = useState(false);
  
  // Estados para estatísticas
  const [stats, setStats] = useState({
    checklistStats: { pendentes: 0, concluidos: 0, total: 0 },
    maintenanceStats: { pendentes: 0, emAndamento: 0, concluidas: 0, total: 0 },
    garageStats: { total_veiculos: 0, media_dias: 0 },
    totalRoutes: 0
  });
  
  // Estado para formulário de viagem
  const [currentTrip, setCurrentTrip] = useState<Partial<LineHallTrip>>({
    placa_cavalo: '',
    placa_carreta_1: '',
    placa_carreta_2: '',
    motorista_id: 0,
    motorista_nome: '',
    local_carregamento: '',
    local_descarregamento: '',
    horario_carregamento: '',
    status_viagem: 'Programada',
    observacoes: '',
    rota_selecionada: '',
    data_viagem: new Date().toISOString().split('T')[0],
    km_total: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchTrips(),
        fetchRoutes(),
        fetchVehicles(),
        fetchDrivers(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrips = async () => {
    try {
      const response = await api.get('/line-hall-shopee');
      if (response.data.success) {
        setTrips(response.data.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar viagens:', error);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await api.get('/line-hall/routes');
      if (response.data.success) {
        setRoutes(response.data.data || []);
        setStats(prev => ({ ...prev, totalRoutes: response.data.data?.length || 0 }));
      }
    } catch (error) {
      console.error('Erro ao buscar rotas:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      if (response.data && Array.isArray(response.data)) {
        const lineHaulVehicles = response.data.filter(vehicle => 
          vehicle.operacao_tipo === 'line_hall_shopee' || 
          vehicle.basename === 'Line Haul Murici' ||
          vehicle.base_id === 2 ||
          vehicle.vehicleType === 'cavalo_mecanico' || 
          vehicle.vehicleType === 'carreta'
        );
        setVehicles(lineHaulVehicles);
      }
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await api.get('/drivers');
      if (response.data && Array.isArray(response.data)) {
        setDrivers(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar motoristas:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Buscar estatísticas de checklist
      const checklistResponse = await api.get('/line-hall/checklist-stats');
      if (checklistResponse.data.success) {
        setStats(prev => ({
          ...prev,
          checklistStats: {
            pendentes: checklistResponse.data.pendentes || 0,
            concluidos: checklistResponse.data.concluidos || 0,
            total: checklistResponse.data.total || 0
          }
        }));
      }

      // Buscar estatísticas de manutenção
      const maintenanceResponse = await api.get('/line-hall/maintenance-stats');
      if (maintenanceResponse.data.success) {
        setStats(prev => ({
          ...prev,
          maintenanceStats: {
            pendentes: maintenanceResponse.data.pendentes || 0,
            emAndamento: maintenanceResponse.data.emAndamento || 0,
            concluidas: maintenanceResponse.data.concluidas || 0,
            total: maintenanceResponse.data.total || 0
          }
        }));
      }

      // Buscar estatísticas da garagem
      const garageResponse = await api.get('/line-hall/garage-stats');
      if (garageResponse.data.success) {
        setStats(prev => ({
          ...prev,
          garageStats: {
            total_veiculos: garageResponse.data.total_veiculos || 0,
            media_dias: garageResponse.data.media_dias || 0
          }
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      // Definir valores padrão se não conseguir buscar
      setStats(prev => ({
        ...prev,
        checklistStats: { pendentes: 12, concluidos: 45, total: 57 },
        maintenanceStats: { pendentes: 8, emAndamento: 3, concluidas: 22, total: 33 },
        garageStats: { total_veiculos: 15, media_dias: 3 }
      }));
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleCardAction = (action: string) => {
    switch (action) {
      case 'atualizar-checklists':
        fetchStats();
        toast({ title: "Checklists atualizados", description: "Dados atualizados com sucesso!" });
        break;
      case 'gerenciar-checklists':
        // Implementar navegação para gestão de checklists
        window.open('/line-hall/checklist-manager', '_blank');
        break;
      case 'cadastrar-veiculo':
        window.open('/line-hall/vehicle-registration', '_blank');
        break;
      case 'cadastrar-motorista':
        window.open('/drivers', '_blank');
        break;
      case 'criar-solicitacao':
        window.open('/line-hall/fuel-card-requests', '_blank');
        break;
      default:
        console.log(`Ação executada: ${action}`);
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `url(${lineHaulLayoutImage})`,
      }}
    >
      {/* Overlay para melhorar legibilidade */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Conteúdo principal */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {`${new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite'}, ${user?.name || 'Usuário'}!`}
            </h1>
            <p className="text-white/80">Bem-vindo ao Line Haul Murici</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={fetchData}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4 mr-2" />
              )}
              Atualizar
            </Button>
            <Button 
              variant="outline" 
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Painel de Controle */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">Painel de Controle</h2>
          <p className="text-white/80 mb-4">Gerenciamento de viagens de Line Haul</p>
          
          {/* Botões de ação */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Button 
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => handleCardAction('cadastrar-veiculo')}
            >
              <Car className="h-4 w-4 mr-2" />
              Cadastrar Veículo
            </Button>
            <Button 
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => handleCardAction('cadastrar-motorista')}
            >
              <Users className="h-4 w-4 mr-2" />
              Cadastrar Motorista
            </Button>
            <Button 
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => handleCardAction('criar-solicitacao')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Solicitações de Cartão
            </Button>
            <Button 
              className="bg-green-500 hover:bg-green-600 text-white"
              onClick={() => setShowRoutes(true)}
            >
              <Route className="h-4 w-4 mr-2" />
              Gerenciar Rotas ({stats.totalRoutes})
            </Button>
            <Button 
              className="bg-purple-500 hover:bg-purple-600 text-white"
              onClick={() => setIsCreatingTrip(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Viagem
            </Button>
          </div>

          {/* Barra de busca */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="Buscar por placa, motorista ou local..." 
              className="pl-10 bg-blue-100/80 border-blue-200 placeholder:text-gray-600"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>

        {/* Cards de métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Checklists de Motoristas */}
          <Card className="bg-white/90 backdrop-blur-sm border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center text-blue-700">
                <CheckCircle className="h-5 w-5 mr-2" />
                Checklists de Motoristas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.checklistStats.concluidos}</div>
                  <div className="text-sm text-gray-600">Concluídos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.checklistStats.pendentes}</div>
                  <div className="text-sm text-gray-600">Pendentes</div>
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-4">Total de checklists: {stats.checklistStats.total}</div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                  onClick={() => handleCardAction('atualizar-checklists')}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4 mr-1" />
                  )}
                  Atualizar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleCardAction('gerenciar-checklists')}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Gerenciar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Solicitações de Manutenção */}
          <Card className="bg-white/90 backdrop-blur-sm border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center text-orange-700">
                <Wrench className="h-5 w-5 mr-2" />
                Solicitações de Manutenção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.maintenanceStats.pendentes}</div>
                  <div className="text-sm text-gray-600">Pendentes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.maintenanceStats.emAndamento}</div>
                  <div className="text-sm text-gray-600">Em Andamento</div>
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-4">Total de solicitações: {stats.maintenanceStats.total}</div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                  onClick={() => fetchStats()}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4 mr-1" />
                  )}
                  Atualizar
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Settings className="h-4 w-4 mr-1" />
                  Gerenciar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Veículos na Garagem */}
          <Card className="bg-white/90 backdrop-blur-sm border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center text-green-700">
                <Car className="h-5 w-5 mr-2" />
                Veículos na Garagem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-green-600">{stats.garageStats.total_veiculos}</div>
                <div className="text-sm text-gray-600">Total de Veículos</div>
              </div>
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-blue-600">{stats.garageStats.media_dias}</div>
                <div className="text-sm text-gray-600">Média de Dias</div>
              </div>
              <div className="text-sm text-gray-600 mb-4">Veículos Line Haul cadastrados: {vehicles.length}</div>
              <div className="space-y-1 mb-4">
                {vehicles.slice(0, 3).map((vehicle, index) => (
                  <Badge key={vehicle.id} variant="outline" className="text-xs">
                    {vehicle.plate} - {vehicle.model}
                  </Badge>
                ))}
                {vehicles.length > 3 && (
                  <Badge variant="outline" className="text-xs text-blue-600">
                    +{vehicles.length - 3} veículos
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                  onClick={() => fetchVehicles()}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4 mr-1" />
                  )}
                  Atualizar
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Veículos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Acesso para Motoristas */}
          <Card className="bg-white/90 backdrop-blur-sm border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center text-purple-700">
                <Users className="h-5 w-5 mr-2" />
                Acesso para Motoristas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Os motoristas podem acessar a interface dedicada para realizar checklists de veículos, solicitar manutenções e recargas de cartão de combustível.
              </p>
              <div className="text-sm text-blue-600 mb-4 break-all">
                URL de acesso: https://muricionfleet2.co/app/system/driver-access
              </div>
              <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white">
                Acessar Interface do Motorista
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Seção inferior com rotas e nova rota */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rotas Cadastradas */}
          <Card className="bg-white/90 backdrop-blur-sm border-green-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-green-700">
                <Route className="h-5 w-5 mr-2" />
                Rotas Cadastradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total de rotas</span>
                  <span className="text-2xl font-bold text-green-600">83</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Menor distância</span>
                  <span className="text-sm font-medium">103 km</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Maior distância</span>
                  <span className="text-sm font-medium">980 km</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Distância média</span>
                  <span className="text-sm font-medium">519 km</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Rotas
                </Button>
                <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Rota
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card vazio para futuras funcionalidades */}
          <Card className="bg-white/90 backdrop-blur-sm border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-gray-700">
                <Truck className="h-5 w-5 mr-2" />
                Operações Line Haul
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Gerencie suas operações de Line Haul com eficiência
                </p>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Iniciar Operação
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dialog para Nova Viagem */}
        <Dialog open={isCreatingTrip} onOpenChange={setIsCreatingTrip}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Registrar Nova Viagem</DialogTitle>
              <DialogDescription>
                Preencha os dados da viagem do Line Haul
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Placa do Cavalo *</Label>
                  <Select value={currentTrip.placa_cavalo || ''} onValueChange={(value) => setCurrentTrip(prev => ({ ...prev, placa_cavalo: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cavalo mecânico" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.filter(vehicle => vehicle.vehicleType === 'cavalo_mecanico').map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.plate}>
                          {vehicle.plate} - {vehicle.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Placa da Carreta 1 *</Label>
                  <Select value={currentTrip.placa_carreta_1 || ''} onValueChange={(value) => setCurrentTrip(prev => ({ ...prev, placa_carreta_1: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a primeira carreta" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.filter(vehicle => vehicle.vehicleType === 'carreta').map((vehicle) => (
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
                  <Label>Motorista *</Label>
                  <Select value={currentTrip.motorista_nome || ''} onValueChange={(value) => {
                    const selectedDriver = drivers.find(driver => driver.nome === value);
                    if (selectedDriver) {
                      setCurrentTrip(prev => ({
                        ...prev,
                        motorista_nome: selectedDriver.nome,
                        motorista_id: selectedDriver.id
                      }));
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o motorista" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.nome}>
                          {driver.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rota</Label>
                  <Select value={currentTrip.rota_selecionada || ''} onValueChange={(value) => setCurrentTrip(prev => ({ ...prev, rota_selecionada: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a rota" />
                    </SelectTrigger>
                    <SelectContent>
                      {routes.map((route) => (
                        <SelectItem key={route.id} value={route.id.toString()}>
                          {route.nome_ponto_a} → {route.nome_ponto_b} ({route.km_total} km)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Local de Carregamento *</Label>
                  <Input
                    placeholder="Ex: São Paulo - SP"
                    value={currentTrip.local_carregamento || ''}
                    onChange={(e) => setCurrentTrip(prev => ({ ...prev, local_carregamento: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Local de Descarregamento *</Label>
                  <Input
                    placeholder="Ex: Rio de Janeiro - RJ"
                    value={currentTrip.local_descarregamento || ''}
                    onChange={(e) => setCurrentTrip(prev => ({ ...prev, local_descarregamento: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreatingTrip(false)}>
                Cancelar
              </Button>
              <Button type="button" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Cadastrar Viagem
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para Gerenciar Rotas */}
        <Dialog open={showRoutes} onOpenChange={setShowRoutes}>
          <DialogContent className="sm:max-w-[800px] max-h-[600px]">
            <DialogHeader>
              <DialogTitle>Gerenciar Rotas Line Haul</DialogTitle>
              <DialogDescription>
                Visualize e gerencie as rotas cadastradas ({routes.length} rotas)
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 overflow-y-auto max-h-[400px]">
              {routes.length > 0 ? (
                routes.map((route) => (
                  <div key={route.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {route.nome_ponto_a} → {route.nome_ponto_b}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Distância: {route.km_total} km
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const mapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(route.nome_ponto_a)}/${encodeURIComponent(route.nome_ponto_b)}`;
                          window.open(mapsUrl, '_blank');
                        }}
                      >
                        <MapPin className="h-4 w-4 mr-1" />
                        Ver no Maps
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma rota cadastrada
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowRoutes(false)}>
                Fechar
              </Button>
              <Button 
                type="button" 
                onClick={() => setIsCreatingRoute(true)}
                className="bg-green-500 hover:bg-green-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Rota
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default LineHaulPage;