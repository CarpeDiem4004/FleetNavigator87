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
  RefreshCcw,
  ArrowLeft
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

interface DriverChecklist {
  id: number;
  driver_id: number;
  driver_name: string;
  vehicle_plate: string;
  checklist_date: string;
  status: 'pendente' | 'concluido';
  observations?: string;
  created_at: string;
  updated_at: string;
}

interface MaintenanceRequest {
  id: number;
  vehicle_plate: string;
  vehicle_model?: string;
  driver_name?: string;
  maintenance_type: string;
  description: string;
  status: 'pendente' | 'em_andamento' | 'concluida';
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  created_at: string;
  updated_at: string;
  estimated_cost?: number;
  workshop_name?: string;
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
  const [checklists, setChecklists] = useState<DriverChecklist[]>([]);
  
  // Estados para diálogos
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [showRoutes, setShowRoutes] = useState(false);
  const [showChecklists, setShowChecklists] = useState(false);
  const [checklistFilter, setChecklistFilter] = useState<'todos' | 'concluidos' | 'pendentes'>('todos');
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [maintenanceFilter, setMaintenanceFilter] = useState<'todos' | 'pendentes' | 'em_andamento' | 'concluidas'>('todos');
  const [showGarage, setShowGarage] = useState(false);
  const [garageFilter, setGarageFilter] = useState<'todos' | 'cavalos' | 'carretas' | 'manutencao'>('todos');
  
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
        fetchChecklists(),
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

  const fetchChecklists = async () => {
    try {
      const response = await api.get('/line-hall/checklists');
      if (response.data.success) {
        setChecklists(response.data.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar checklists:', error);
      // Dados simulados para demonstração
      const mockChecklists: DriverChecklist[] = [
        {
          id: 1,
          driver_id: 6,
          driver_name: 'Adeilton Lima Cavalcante',
          vehicle_plate: 'FNJ2854',
          checklist_date: '2025-08-05',
          status: 'concluido',
          observations: 'Checklist completo - veículo em boas condições',
          created_at: '2025-08-05T09:30:00Z',
          updated_at: '2025-08-05T09:45:00Z'
        },
        {
          id: 2,
          driver_id: 7,
          driver_name: 'João Silva Santos',
          vehicle_plate: 'ABC1234',
          checklist_date: '2025-08-05',
          status: 'pendente',
          observations: '',
          created_at: '2025-08-05T08:00:00Z',
          updated_at: '2025-08-05T08:00:00Z'
        }
      ];
      setChecklists(mockChecklists);
    }
  };

  // Estado para solicitações de manutenção
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);

  const fetchMaintenanceRequests = async () => {
    try {
      // Por enquanto usando dados simulados - futuramente conectar com API real
      const mockMaintenanceRequests: MaintenanceRequest[] = [
        {
          id: 1,
          vehicle_plate: "FNJ2854",
          vehicle_model: "Volkswagen Constellation",
          driver_name: "Adeilton Lima Cavalcante",
          maintenance_type: "Preventiva",
          description: "Troca de óleo e filtros - manutenção programada",
          status: "pendente",
          priority: "media",
          created_at: "2025-08-05T10:30:00Z",
          updated_at: "2025-08-05T10:30:00Z",
          estimated_cost: 450.00,
          workshop_name: "Oficina Line Haul SP"
        },
        {
          id: 2,
          vehicle_plate: "ABC1234",
          vehicle_model: "Mercedes-Benz Actros",
          driver_name: "João Silva Santos",
          maintenance_type: "Corretiva",
          description: "Problema no sistema de freios - pedal está mole, necessário verificação urgente",
          status: "em_andamento",
          priority: "urgente",
          created_at: "2025-08-04T14:15:00Z",
          updated_at: "2025-08-05T08:30:00Z",
          estimated_cost: 1200.00,
          workshop_name: "Auto Mecânica São Paulo"
        },
        {
          id: 3,
          vehicle_plate: "XYZ5678",
          vehicle_model: "Scania R450",
          driver_name: "Maria Santos",
          maintenance_type: "Preventiva",
          description: "Revisão dos 10.000 km - troca de filtros e verificação geral",
          status: "concluida",
          priority: "baixa",
          created_at: "2025-08-03T09:00:00Z",
          updated_at: "2025-08-04T16:45:00Z",
          estimated_cost: 680.00,
          workshop_name: "Oficina Scania Autorizada"
        },
        {
          id: 4,
          vehicle_plate: "DEF9012",
          vehicle_model: "Volvo FH540",
          driver_name: "Carlos Pereira",
          maintenance_type: "Corretiva",
          description: "Vazamento de óleo no motor - necessário reparo imediato",
          status: "pendente",
          priority: "alta",
          created_at: "2025-08-05T11:45:00Z",
          updated_at: "2025-08-05T11:45:00Z",
          estimated_cost: 850.00,
          workshop_name: "Oficina Volvo"
        }
      ];
      setMaintenanceRequests(mockMaintenanceRequests);
    } catch (error) {
      console.error('Erro ao buscar solicitações de manutenção:', error);
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

  const handleCardAction = async (action: string) => {
    switch (action) {
      case 'atualizar-checklists':
        setIsLoading(true);
        await fetchStats();
        await fetchChecklists();
        setIsLoading(false);
        toast({ title: "Checklists atualizados", description: "Dados atualizados com sucesso!" });
        break;
      case 'gerenciar-checklists':
        setIsLoading(true);
        await fetchChecklists();
        setIsLoading(false);
        setShowChecklists(true);
        break;
      case 'gerenciar-manutencao':
        setIsLoading(true);
        await fetchMaintenanceRequests();
        setIsLoading(false);
        setShowMaintenance(true);
        break;
      case 'gerenciar-garagem':
        setIsLoading(true);
        await fetchVehicles();
        await fetchStats();
        setIsLoading(false);
        setShowGarage(true);
        break;
      case 'cadastrar-veiculo':
        window.open('/vehicles', '_blank');
        break;
      case 'cadastrar-motorista':
        window.open('/drivers', '_blank');
        break;
      case 'criar-solicitacao':
        window.open('/fuel-cards', '_blank');
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
              {showChecklists ? 'Checklists de Motoristas' : `${new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite'}, ${user?.name || 'Usuário'}!`}
            </h1>
            <p className="text-white/80">
              {showChecklists ? 'Visualização e gerenciamento de checklists' : 'Bem-vindo ao Line Haul Murici'}
            </p>
          </div>
          <div className="flex gap-2">
            {showChecklists && (
              <Button 
                variant="outline" 
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={() => setShowChecklists(false)}
              >
                <Car className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            )}
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

        {/* Interface condicional - Dashboard, Checklists, Manutenção ou Garagem */}
        {showChecklists ? (
          <div className="space-y-6">
            {/* Filtros de Checklist */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-700">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Filtrar Checklists
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button 
                    variant={checklistFilter === 'todos' ? 'default' : 'outline'}
                    onClick={() => setChecklistFilter('todos')}
                    className="flex-1"
                  >
                    Todos ({checklists.length})
                  </Button>
                  <Button 
                    variant={checklistFilter === 'concluidos' ? 'default' : 'outline'}
                    onClick={() => setChecklistFilter('concluidos')}
                    className="flex-1"
                  >
                    Concluídos ({checklists.filter(c => c.status === 'concluido').length})
                  </Button>
                  <Button 
                    variant={checklistFilter === 'pendentes' ? 'default' : 'outline'}
                    onClick={() => setChecklistFilter('pendentes')}
                    className="flex-1"
                  >
                    Pendentes ({checklists.filter(c => c.status === 'pendente').length})
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Checklists */}
            <div className="grid gap-4">
              {checklists
                .filter(checklist => 
                  checklistFilter === 'todos' || checklist.status === checklistFilter
                )
                .map(checklist => (
                <Card key={checklist.id} className="bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{checklist.driver_name}</h3>
                        <p className="text-sm text-gray-600">Placa: {checklist.vehicle_plate}</p>
                        <p className="text-sm text-gray-600">Data: {new Date(checklist.checklist_date).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <Badge 
                        variant={checklist.status === 'concluido' ? 'default' : 'secondary'}
                        className={checklist.status === 'concluido' ? 'bg-green-500' : 'bg-yellow-500'}
                      >
                        {checklist.status === 'concluido' ? 'Concluído' : 'Pendente'}
                      </Badge>
                    </div>
                    {checklist.observations && (
                      <p className="text-sm text-gray-700 mb-3">
                        <strong>Observações:</strong> {checklist.observations}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalhes
                      </Button>
                      {checklist.status === 'pendente' && (
                        <Button size="sm" className="flex-1 bg-green-500 hover:bg-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Marcar como Concluído
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : showMaintenance ? (
          <div className="space-y-6">
            {/* Header com botão voltar para Manutenção */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-orange-700">
                  <span className="flex items-center">
                    <Wrench className="h-5 w-5 mr-2" />
                    Gerenciar Solicitações de Manutenção
                  </span>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowMaintenance(false)}
                    className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar ao Dashboard
                  </Button>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Filtros de Manutenção */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-700">
                  <Wrench className="h-5 w-5 mr-2" />
                  Filtrar Solicitações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant={maintenanceFilter === 'todos' ? 'default' : 'outline'}
                    onClick={() => setMaintenanceFilter('todos')}
                    className="flex-1"
                  >
                    Todos ({maintenanceRequests.length})
                  </Button>
                  <Button 
                    variant={maintenanceFilter === 'pendentes' ? 'default' : 'outline'}
                    onClick={() => setMaintenanceFilter('pendentes')}
                    className="flex-1"
                  >
                    Pendentes ({maintenanceRequests.filter(m => m.status === 'pendente').length})
                  </Button>
                  <Button 
                    variant={maintenanceFilter === 'em_andamento' ? 'default' : 'outline'}
                    onClick={() => setMaintenanceFilter('em_andamento')}
                    className="flex-1"
                  >
                    Em Andamento ({maintenanceRequests.filter(m => m.status === 'em_andamento').length})
                  </Button>
                  <Button 
                    variant={maintenanceFilter === 'concluidas' ? 'default' : 'outline'}
                    onClick={() => setMaintenanceFilter('concluidas')}
                    className="flex-1"
                  >
                    Concluídas ({maintenanceRequests.filter(m => m.status === 'concluida').length})
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Solicitações de Manutenção */}
            <div className="grid gap-4">
              {maintenanceRequests
                .filter(request => 
                  maintenanceFilter === 'todos' || request.status === maintenanceFilter
                )
                .map(request => (
                <Card key={request.id} className="bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{request.vehicle_plate} - {request.vehicle_model}</h3>
                        <p className="text-sm text-gray-600">Motorista: {request.driver_name}</p>
                        <p className="text-sm text-gray-600">Tipo: {request.maintenance_type}</p>
                        <p className="text-sm text-gray-600">Data: {new Date(request.created_at).toLocaleDateString('pt-BR')}</p>
                        {request.workshop_name && (
                          <p className="text-sm text-gray-600">Oficina: {request.workshop_name}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          variant="default"
                          className={
                            request.status === 'concluida' ? 'bg-green-500' :
                            request.status === 'em_andamento' ? 'bg-blue-500' :
                            'bg-yellow-500'
                          }
                        >
                          {request.status === 'concluida' ? 'Concluída' :
                           request.status === 'em_andamento' ? 'Em Andamento' :
                           'Pendente'}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={
                            request.priority === 'urgente' ? 'border-red-500 text-red-700' :
                            request.priority === 'alta' ? 'border-orange-500 text-orange-700' :
                            request.priority === 'media' ? 'border-yellow-500 text-yellow-700' :
                            'border-gray-500 text-gray-700'
                          }
                        >
                          {request.priority === 'urgente' ? 'Urgente' :
                           request.priority === 'alta' ? 'Alta' :
                           request.priority === 'media' ? 'Média' :
                           'Baixa'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-gray-700">
                        <strong>Descrição:</strong> {request.description}
                      </p>
                      {request.estimated_cost && (
                        <p className="text-sm text-gray-700 mt-1">
                          <strong>Custo Estimado:</strong> R$ {request.estimated_cost.toFixed(2)}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalhes
                      </Button>
                      {request.status === 'pendente' && (
                        <Button size="sm" className="flex-1 bg-blue-500 hover:bg-blue-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Iniciar Manutenção
                        </Button>
                      )}
                      {request.status === 'em_andamento' && (
                        <Button size="sm" className="flex-1 bg-green-500 hover:bg-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Finalizar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : showGarage ? (
          <div className="space-y-6">
            {/* Header com botão voltar para Garagem */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-green-700">
                  <span className="flex items-center">
                    <Car className="h-5 w-5 mr-2" />
                    Gerenciar Veículos na Garagem
                  </span>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowGarage(false)}
                    className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar ao Dashboard
                  </Button>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Filtros de Garagem */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-green-700">
                  <Car className="h-5 w-5 mr-2" />
                  Filtrar Veículos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant={garageFilter === 'todos' ? 'default' : 'outline'}
                    onClick={() => setGarageFilter('todos')}
                    className="flex-1"
                  >
                    Todos ({vehicles.length})
                  </Button>
                  <Button 
                    variant={garageFilter === 'cavalos' ? 'default' : 'outline'}
                    onClick={() => setGarageFilter('cavalos')}
                    className="flex-1"
                  >
                    Cavalos ({vehicles.filter(v => v.vehicleType === 'cavalo_mecanico').length})
                  </Button>
                  <Button 
                    variant={garageFilter === 'carretas' ? 'default' : 'outline'}
                    onClick={() => setGarageFilter('carretas')}
                    className="flex-1"
                  >
                    Carretas ({vehicles.filter(v => v.vehicleType === 'carreta').length})
                  </Button>
                  <Button 
                    variant={garageFilter === 'manutencao' ? 'default' : 'outline'}
                    onClick={() => setGarageFilter('manutencao')}
                    className="flex-1"
                  >
                    Em Manutenção ({vehicles.filter(v => v.status === 'em_manutencao').length})
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Veículos na Garagem */}
            <div className="grid gap-4">
              {vehicles
                .filter(vehicle => {
                  if (garageFilter === 'todos') return true;
                  if (garageFilter === 'cavalos') return vehicle.vehicleType === 'cavalo_mecanico';
                  if (garageFilter === 'carretas') return vehicle.vehicleType === 'carreta';
                  if (garageFilter === 'manutencao') return vehicle.status === 'em_manutencao';
                  return true;
                })
                .map(vehicle => (
                <Card key={vehicle.id} className="bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{vehicle.plate}</h3>
                        <p className="text-sm text-gray-600">Modelo: {vehicle.model}</p>
                        <p className="text-sm text-gray-600">Tipo: {vehicle.vehicleType === 'cavalo_mecanico' ? 'Cavalo Mecânico' : vehicle.vehicleType === 'carreta' ? 'Carreta' : vehicle.vehicleType}</p>
                        <p className="text-sm text-gray-600">Operação: {vehicle.operacao_tipo || 'Line Haul'}</p>
                        {vehicle.basename && (
                          <p className="text-sm text-gray-600">Base: {vehicle.basename}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          variant="default"
                          className={
                            vehicle.status === 'ativo' ? 'bg-green-500' :
                            vehicle.status === 'em_manutencao' ? 'bg-orange-500' :
                            vehicle.status === 'inativo' ? 'bg-red-500' :
                            'bg-gray-500'
                          }
                        >
                          {vehicle.status === 'ativo' ? 'Ativo' :
                           vehicle.status === 'em_manutencao' ? 'Em Manutenção' :
                           vehicle.status === 'inativo' ? 'Inativo' :
                           vehicle.status || 'Indefinido'}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={
                            vehicle.vehicleType === 'cavalo_mecanico' ? 'border-blue-500 text-blue-700' :
                            vehicle.vehicleType === 'carreta' ? 'border-green-500 text-green-700' :
                            'border-gray-500 text-gray-700'
                          }
                        >
                          {vehicle.vehicleType === 'cavalo_mecanico' ? 'Cavalo' :
                           vehicle.vehicleType === 'carreta' ? 'Carreta' :
                           vehicle.vehicleType || 'Outro'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      {vehicle.year && (
                        <p className="text-sm text-gray-700">
                          <strong>Ano:</strong> {vehicle.year}
                        </p>
                      )}
                      {vehicle.color && (
                        <p className="text-sm text-gray-700">
                          <strong>Cor:</strong> {vehicle.color}
                        </p>
                      )}
                      {vehicle.lastMaintenanceDate && (
                        <p className="text-sm text-gray-700">
                          <strong>Última Manutenção:</strong> {new Date(vehicle.lastMaintenanceDate).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalhes
                      </Button>
                      <Button size="sm" className="flex-1 bg-orange-500 hover:bg-orange-600">
                        <Wrench className="h-4 w-4 mr-1" />
                        Solicitar Manutenção
                      </Button>
                      <Button size="sm" className="flex-1 bg-blue-500 hover:bg-blue-600">
                        <Settings className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <>
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
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleCardAction('gerenciar-manutencao')}
                >
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
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleCardAction('gerenciar-garagem')}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Gerenciar
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
        </>
        )}

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