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
import { useAuth } from '@/context/AuthContext';
import { DriverAutocomplete } from '@/components/ui/driver-autocomplete';

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

const statusLabels: Record<string, string> = {
  'Programada': 'bg-blue-100 text-blue-800',
  'Em Andamento': 'bg-yellow-100 text-yellow-800',
  'Aguardando': 'bg-gray-100 text-gray-800',
  'Concluída': 'bg-green-100 text-green-800',
  'No Show': 'bg-red-100 text-red-800',
  'Cancelada pelo Cliente': 'bg-orange-100 text-orange-800'
};

export default function LineHallShopeePage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [trips, setTrips] = useState<LineHallTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para gerenciar rotas
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [isEditingRoute, setIsEditingRoute] = useState(false);
  const [showRoutes, setShowRoutes] = useState(false);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [currentRoute, setCurrentRoute] = useState({
    id: 0,
    nome_ponto_a: '',
    nome_ponto_b: '',
    km_total: 0
  });
  
  // Estados para acompanhamento de checklists e manutenção
  const [checklistStats, setChecklistStats] = useState({
    pendentes: 0,
    concluidos: 0,
    total: 0
  });
  
  const [maintenanceStats, setMaintenanceStats] = useState({
    pendentes: 0,
    emAndamento: 0,
    concluidas: 0,
    total: 0
  });
  
  const [garageStats, setGarageStats] = useState({
    total_veiculos: 0,
    media_dias: 0,
    veiculos: []
  });

  // Estado para solicitações de cartão combustível
  const [fuelCardRequests, setFuelCardRequests] = useState<FuelCardRequest[]>([]);
  const [showFuelRequests, setShowFuelRequests] = useState(false);
  const [pendingFuelRequests, setPendingFuelRequests] = useState(0);

  // Estados para veículos e motoristas cadastrados no Line Haul
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  // Form states
  const [currentTrip, setCurrentTrip] = useState<Partial<LineHallTrip>>({
    placa_cavalo: '',
    placa_carreta_1: '',
    placa_carreta_2: '',
    motorista_id: 0,
    motorista_nome: '',
    local_carregamento: '',
    local_descarregamento: '',
    horario_carregamento: '',
    status_viagem: 'Concluída',
    observacoes: '',
    rota_selecionada: '',
    data_viagem: new Date().toISOString().split('T')[0],
    km_total: 0
  });

  useEffect(() => {
    fetchTrips();
    fetchDriverStats();
    fetchRoutesData();
    fetchFuelCardRequests();
    fetchPendingLineHallRequests();
    fetchVehicles();
    fetchDrivers();
    
    // Configurar polling para atualizações automáticas do status das viagens
    const interval = setInterval(() => {
      fetchTrips();
      fetchFuelCardRequests();
      fetchPendingLineHallRequests();
    }, 30000); // Atualiza a cada 30 segundos
    
    return () => clearInterval(interval);
  }, []);

  // Função para buscar rotas cadastradas
  const fetchRoutesData = async () => {
    try {
      const response = await api.get('/line-hall/routes');
      if (response.data.success) {
        setRoutes(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar rotas:', error);
    }
  };

  // Função para buscar veículos cadastrados do Line Haul
  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      if (response.data && Array.isArray(response.data)) {
        console.log('Todos os veículos:', response.data);
        // Filtrar veículos do Line Haul - usando operacao_tipo ou base_name para identificar
        const lineHaulVehicles = response.data.filter(vehicle => 
          vehicle.operacao_tipo === 'line_hall_shopee' || 
          vehicle.basename === 'Line Haul Murici' ||
          vehicle.base_id === 2 ||
          vehicle.vehicleType === 'cavalo_mecanico' || 
          vehicle.vehicleType === 'carreta'
        );
        console.log('Veículos do Line Haul filtrados:', lineHaulVehicles);
        setVehicles(lineHaulVehicles);
      }
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
    }
  };

  // Função para buscar motoristas cadastrados do Line Haul
  const fetchDrivers = async () => {
    try {
      const response = await api.get('/drivers');
      if (response.data && Array.isArray(response.data)) {
        console.log('Todos os motoristas:', response.data);
        // Todos os motoristas por enquanto, vamos ajustar filtro depois se necessário
        setDrivers(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar motoristas:', error);
    }
  };

  const fetchTrips = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/line-hall-shopee');
      if (response.data.success) {
        setTrips(response.data.data);
      } else {
        toast({
          title: "Erro ao buscar viagens",
          description: response.data.message || "Ocorreu um erro ao buscar as viagens",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Erro ao carregar viagens:", error);
      toast({
        title: "Erro ao buscar viagens",
        description: error.message || "Ocorreu um erro ao buscar as viagens",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTrip = async () => {
    try {
      // Validar campos obrigatórios
      if (!currentTrip.placa_cavalo || !currentTrip.placa_carreta_1 || 
          !currentTrip.motorista_nome || !currentTrip.local_carregamento || 
          !currentTrip.local_descarregamento || !currentTrip.status_viagem) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive"
        });
        return;
      }

      const response = await api.post('/line-hall-shopee', currentTrip);
      
      if (response.data.success) {
        toast({
          title: "Viagem registrada",
          description: "Viagem registrada com sucesso!",
          variant: "default"
        });
        setIsCreating(false);
        fetchTrips();
        // Reset form
        setCurrentTrip({
          placa_cavalo: '',
          placa_carreta_1: '',
          placa_carreta_2: '',
          motorista_id: 0,
          motorista_nome: '',
          local_carregamento: '',
          local_descarregamento: '',
          horario_carregamento: '',
          status_viagem: 'Concluída',
          observacoes: ''
        });
      } else {
        toast({
          title: "Erro ao registrar viagem",
          description: response.data.message || "Ocorreu um erro ao registrar a viagem",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Erro ao registrar viagem:", error);
      toast({
        title: "Erro ao registrar viagem",
        description: error.message || "Ocorreu um erro ao registrar a viagem",
        variant: "destructive"
      });
    }
  };

  const handleUpdateTrip = async () => {
    try {
      if (!currentTrip.id) return;

      const response = await api.put(`/line-hall-shopee/${currentTrip.id}`, currentTrip);
      
      if (response.data.success) {
        toast({
          title: "Viagem atualizada",
          description: "Viagem atualizada com sucesso!",
          variant: "default"
        });
        setIsEditing(false);
        fetchTrips();
      } else {
        toast({
          title: "Erro ao atualizar viagem",
          description: response.data.message || "Ocorreu um erro ao atualizar a viagem",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Erro ao atualizar viagem:", error);
      toast({
        title: "Erro ao atualizar viagem",
        description: error.message || "Ocorreu um erro ao atualizar a viagem",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTrip = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta viagem? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await api.delete(`/line-hall-shopee/${id}`);
      
      if (response.data.success) {
        toast({
          title: "Viagem excluída",
          description: "Viagem excluída com sucesso!",
          variant: "default"
        });
        fetchTrips();
      } else {
        toast({
          title: "Erro ao excluir viagem",
          description: response.data.message || "Ocorreu um erro ao excluir a viagem",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Erro ao excluir viagem:", error);
      toast({
        title: "Erro ao excluir viagem",
        description: error.message || "Ocorreu um erro ao excluir a viagem",
        variant: "destructive"
      });
    }
  };

  const editTrip = (trip: LineHallTrip) => {
    setCurrentTrip(trip);
    setIsEditing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentTrip(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setCurrentTrip(prev => ({ ...prev, [name]: value }));
  };
  


  // Função para criar nova rota
  const handleCreateRoute = async () => {
    if (!currentRoute.nome_ponto_a.trim() || !currentRoute.nome_ponto_b.trim() || !currentRoute.km_total) {
      toast({
        title: "Erro de validação",
        description: "Todos os campos são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await api.post('/line-hall/routes', currentRoute);
      
      if (response.data.success) {
        toast({
          title: "Rota cadastrada",
          description: "Rota cadastrada com sucesso!",
          variant: "default"
        });
        setIsCreatingRoute(false);
        setCurrentRoute({
          id: 0,
          nome_ponto_a: '',
          nome_ponto_b: '',
          km_total: 0
        });
        fetchRoutesData();
      }
    } catch (error: any) {
      console.error("Erro ao cadastrar rota:", error);
      toast({
        title: "Erro ao cadastrar rota",
        description: error.response?.data?.message || "Ocorreu um erro ao cadastrar a rota",
        variant: "destructive"
      });
    }
  };

  // Função para editar uma rota
  const editRoute = (route: any) => {
    setCurrentRoute({
      id: route.id,
      nome_ponto_a: route.nome_ponto_a,
      nome_ponto_b: route.nome_ponto_b,
      km_total: route.km_total
    });
    setIsEditingRoute(true);
  };

  // Função para atualizar uma rota
  const handleUpdateRoute = async () => {
    try {
      if (!currentRoute.nome_ponto_a || !currentRoute.nome_ponto_b || !currentRoute.km_total) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive"
        });
        return;
      }

      const response = await api.put(`/line-hall/routes/${currentRoute.id}`, {
        nome_ponto_a: currentRoute.nome_ponto_a,
        nome_ponto_b: currentRoute.nome_ponto_b,
        km_total: currentRoute.km_total
      });

      if (response.data.success) {
        toast({
          title: "Rota atualizada",
          description: "Rota atualizada com sucesso!",
          variant: "default"
        });
        setIsEditingRoute(false);
        setCurrentRoute({
          id: 0,
          nome_ponto_a: '',
          nome_ponto_b: '',
          km_total: 0
        });
        fetchRoutesData();
      }
    } catch (error: any) {
      console.error("Erro ao atualizar rota:", error);
      toast({
        title: "Erro ao atualizar rota",
        description: error.response?.data?.message || "Ocorreu um erro ao atualizar a rota",
        variant: "destructive"
      });
    }
  };

  // Função para buscar solicitações de cartão combustível
  const fetchFuelCardRequests = async () => {
    try {
      // Adicionar timestamp para quebrar cache
      const timestamp = Date.now();
      const response = await api.get(`/line-hall/fuel-requests?_t=${timestamp}`);
      console.log('Solicitações do Line Hall API Response:', response.data);
      
      if (response.data.success) {
        setFuelCardRequests(response.data.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar solicitações de cartão:', error);
    }
  };

  // Função para buscar solicitações pendentes do Line Hall no sistema geral
  const fetchPendingLineHallRequests = async () => {
    try {
      const response = await api.get('/fuel-card-solicitations');
      if (response.data.success) {
        const allRequests = response.data.data || [];
        // Filtrar solicitações do Line Hall que estão pendentes
        const lineHallPending = allRequests.filter((request: any) => 
          (request.base === 'Line Hall Shopee' || 
           request.origem_tipo === 'line_hall' ||
           request.provedor_cartao === 'Line Hall Shopee') &&
          (request.status === 'Pendente' || request.status === 'Em Análise')
        );
        setPendingFuelRequests(lineHallPending.length);
      }
    } catch (error) {
      console.error('Erro ao buscar solicitações pendentes:', error);
    }
  };

  // Função para aprovar/rejeitar solicitação de cartão
  const handleFuelRequestAction = async (requestId: number, action: 'aprovar' | 'rejeitar', observacoes?: string) => {
    try {
      const response = await api.put(`/line-hall/fuel-requests/${requestId}`, {
        status: action === 'aprovar' ? 'aprovada' : 'rejeitada',
        observacoes_operador: observacoes
      });

      if (response.data.success) {
        toast({
          title: action === 'aprovar' ? "Solicitação Aprovada" : "Solicitação Rejeitada",
          description: `Solicitação ${action === 'aprovar' ? 'aprovada' : 'rejeitada'} com sucesso!`,
        });
        fetchFuelCardRequests(); // Atualizar lista
      }
    } catch (error) {
      console.error('Erro ao processar solicitação:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar solicitação",
        variant: "destructive",
      });
    }
  };

  // Função para obter saudação baseada no horário
  const getTimeBasedGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      return 'Bom dia';
    } else if (currentHour < 18) {
      return 'Boa tarde';
    } else {
      return 'Boa noite';
    }
  };

  // Função para logout
  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Fallback para logout direto
      window.location.href = '/api/logout';
    }
  };

  // Função para buscar estatísticas de checklist e manutenção
  const fetchDriverStats = async () => {
    try {
      // Buscar estatísticas de checklist
      const checklistResponse = await api.get('/line-hall/checklist-stats');
      if (checklistResponse.data.success) {
        setChecklistStats({
          pendentes: checklistResponse.data.pendentes || 0,
          concluidos: checklistResponse.data.concluidos || 0,
          total: checklistResponse.data.total || 0
        });
      }
      
      // Buscar estatísticas de manutenção
      const maintenanceResponse = await api.get('/line-hall/maintenance-stats');
      if (maintenanceResponse.data.success) {
        setMaintenanceStats({
          pendentes: maintenanceResponse.data.pendentes || 0,
          emAndamento: maintenanceResponse.data.emAndamento || 0,
          concluidas: maintenanceResponse.data.concluidas || 0,
          total: maintenanceResponse.data.total || 0
        });
      }
      
      // Buscar estatísticas de veículos na garagem
      const garageResponse = await api.get('/line-hall/garage-stats');
      if (garageResponse.data.success) {
        setGarageStats({
          total_veiculos: garageResponse.data.total_veiculos || 0,
          media_dias: garageResponse.data.media_dias || 0,
          veiculos: garageResponse.data.data || []
        });
      }
    } catch (error: any) {
      console.error("Erro ao buscar estatísticas:", error);
      // Usar valores padrão para casos de falha
      setChecklistStats({
        pendentes: 0,
        concluidos: 0,
        total: 0
      });
      
      setMaintenanceStats({
        pendentes: 0,
        emAndamento: 0,
        concluidas: 0,
        total: 0
      });
      
      setGarageStats({
        total_veiculos: 0,
        media_dias: 0,
        veiculos: []
      });
    }
  };

  const filteredTrips = trips.filter(trip => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (trip.placa_cavalo?.toLowerCase() || '').includes(searchLower) ||
      (trip.placa_carreta_1?.toLowerCase() || '').includes(searchLower) ||
      (trip.placa_carreta_2?.toLowerCase() || '').includes(searchLower) ||
      (trip.motorista_nome?.toLowerCase() || '').includes(searchLower) ||
      (trip.local_carregamento?.toLowerCase() || '').includes(searchLower) ||
      (trip.local_descarregamento?.toLowerCase() || '').includes(searchLower)
    );
  });

  return (
    <MainLayoutSimple>
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed relative"
        style={{
          backgroundImage: "url('/painel-background.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Overlay para melhorar legibilidade */}
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm"></div>
        
        {/* Conteúdo principal */}
        <div className="relative z-10 space-y-6 p-6">
        
        {/* Header com saudação personalizada */}
        <div className="flex justify-between items-center bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getTimeBasedGreeting()}, {user?.name || 'Usuário'}!
              </h1>
              <p className="text-gray-600">
                Bem-vindo ao Line Haul Murici
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="flex items-center space-x-2 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </Button>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Painel de Controle</h2>
            <p className="text-muted-foreground">
              Gerenciamento de viagens de Line Haul
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
              onClick={() => setLocation('/line-hall-fuel-requests')} 
              className="flex items-center relative"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Solicitações de Cartão
              {pendingFuelRequests > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse">
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
            <Dialog open={isCreatingRoute} onOpenChange={setIsCreatingRoute}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Cadastrar Nova Rota</DialogTitle>
                  <DialogDescription>
                    Preencha os dados da nova rota Line Haul. Use o botão Google Maps para consultar a distância exata.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome_ponto_a">Ponto de Origem *</Label>
                    <Input
                      id="nome_ponto_a"
                      placeholder="Ex: Rio de Janeiro, RJ"
                      value={currentRoute.nome_ponto_a}
                      onChange={(e) => setCurrentRoute(prev => ({ ...prev, nome_ponto_a: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nome_ponto_b">Ponto de Destino *</Label>
                    <Input
                      id="nome_ponto_b"
                      placeholder="Ex: São Paulo, SP"
                      value={currentRoute.nome_ponto_b}
                      onChange={(e) => setCurrentRoute(prev => ({ ...prev, nome_ponto_b: e.target.value }))}
                    />
                  </div>
                  
                  {/* Google Maps Integration - Always shows when both fields are filled */}
                  {currentRoute.nome_ponto_a.trim() !== '' && currentRoute.nome_ponto_b.trim() !== '' ? (
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border-2 border-blue-300 shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <MapPin className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Consultar Google Maps</p>
                            <p className="text-sm text-gray-600">Clique para ver a rota de <span className="font-medium">{currentRoute.nome_ponto_a}</span> até <span className="font-medium">{currentRoute.nome_ponto_b}</span></p>
                          </div>
                        </div>
                        <Button 
                          type="button"
                          onClick={() => {
                            const origem = currentRoute.nome_ponto_a.trim();
                            const destino = currentRoute.nome_ponto_b.trim();
                            const mapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(origem)}/${encodeURIComponent(destino)}`;
                            console.log('Abrindo Maps:', mapsUrl);
                            window.open(mapsUrl, '_blank');
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        >
                          <MapPin className="mr-2 h-4 w-4" />
                          Abrir Maps
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-2 text-gray-500">
                        <MapPin className="h-4 w-4" />
                        <p className="text-sm">Preencha origem e destino para consultar no Google Maps</p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="km_total">Distância Total (KM) *</Label>
                    <Input
                      id="km_total"
                      type="number"
                      placeholder="Ex: 450"
                      value={currentRoute.km_total || ''}
                      onChange={(e) => setCurrentRoute(prev => ({ ...prev, km_total: parseFloat(e.target.value) || 0 }))}
                      className="w-full"
                    />
                    {currentRoute.nome_ponto_a.trim() !== '' && currentRoute.nome_ponto_b.trim() !== '' && !currentRoute.km_total && (
                      <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>Use o botão "Abrir Maps" acima para consultar a distância exata</span>
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreatingRoute(false)}>Cancelar</Button>
                  <Button 
                    type="button" 
                    onClick={handleCreateRoute}
                    disabled={!currentRoute.nome_ponto_a || !currentRoute.nome_ponto_b || !currentRoute.km_total}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Cadastrar Rota
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button className="flex items-center">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Viagem
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Registrar Nova Viagem</DialogTitle>
                  <DialogDescription>
                    Preencha os dados da viagem do Line Haul Murici
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="placa_cavalo">Placa do Cavalo *</Label>
                      <Select 
                        name="placa_cavalo"
                        value={currentTrip.placa_cavalo || ''} 
                        onValueChange={(value) => handleSelectChange('placa_cavalo', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cavalo mecânico" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicles
                            .filter(vehicle => vehicle.vehicleType === 'cavalo_mecanico')
                            .map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.plate}>
                              {vehicle.plate} - {vehicle.model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="placa_carreta_1">Placa da Carreta 1 *</Label>
                      <Select 
                        name="placa_carreta_1"
                        value={currentTrip.placa_carreta_1 || ''} 
                        onValueChange={(value) => handleSelectChange('placa_carreta_1', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a primeira carreta" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicles
                            .filter(vehicle => vehicle.vehicleType === 'carreta')
                            .map((vehicle) => (
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
                      <Label htmlFor="placa_carreta_2">Placa da Carreta 2</Label>
                      <Select 
                        name="placa_carreta_2"
                        value={currentTrip.placa_carreta_2 || ''} 
                        onValueChange={(value) => handleSelectChange('placa_carreta_2', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a segunda carreta (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Nenhuma carreta adicional</SelectItem>
                          {vehicles
                            .filter(vehicle => vehicle.vehicleType === 'carreta' && vehicle.plate !== currentTrip.placa_carreta_1)
                            .map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.plate}>
                              {vehicle.plate} - {vehicle.model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="motorista_nome">Motorista *</Label>
                      <DriverAutocomplete
                        value={currentTrip.motorista_nome || ''}
                        onValueChange={(value) => {
                          const selectedDriver = drivers.find(driver => driver.nome === value);
                          if (selectedDriver) {
                            setCurrentTrip(prev => ({
                              ...prev,
                              motorista_nome: selectedDriver.nome,
                              motorista_id: selectedDriver.id
                            }));
                          }
                        }}
                        drivers={drivers}
                        placeholder="Selecione o motorista"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rota_selecionada">Rota Cadastrada *</Label>
                      <Select 
                        name="rota_selecionada"
                        value={currentTrip.rota_selecionada || ''} 
                        onValueChange={(value) => {
                          handleSelectChange('rota_selecionada', value);
                          if (value) {
                            const selectedRoute = routes.find(route => route.id === parseInt(value));
                            if (selectedRoute) {
                              setCurrentTrip(prev => ({
                                ...prev,
                                local_carregamento: selectedRoute.nome_ponto_a,
                                local_descarregamento: selectedRoute.nome_ponto_b,
                                km_total: selectedRoute.km_total
                              }));
                            }
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma rota cadastrada" />
                        </SelectTrigger>
                        <SelectContent>
                          {routes.map((route) => (
                            <SelectItem key={route.id} value={route.id.toString()}>
                              {route.nome_ponto_a} → {route.nome_ponto_b} ({route.km_total} km)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="text-xs text-muted-foreground">
                        A rota selecionada definirá automaticamente origem, destino e quilometragem da viagem
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="data_viagem">Data da Viagem *</Label>
                      <Input
                        id="data_viagem"
                        name="data_viagem"
                        type="date"
                        value={currentTrip.data_viagem || new Date().toISOString().split('T')[0]}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="horario_carregamento">Horário de Carregamento</Label>
                      <Input
                        id="horario_carregamento"
                        name="horario_carregamento"
                        type="time"
                        placeholder="HH:MM"
                        value={currentTrip.horario_carregamento || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status_viagem">Status da Viagem *</Label>
                      <Select 
                        name="status_viagem"
                        value={currentTrip.status_viagem} 
                        onValueChange={(value) => handleSelectChange('status_viagem', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Programada">Programada</SelectItem>
                          <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                          <SelectItem value="Aguardando">Aguardando</SelectItem>
                          <SelectItem value="Concluída">Concluída</SelectItem>
                          <SelectItem value="No Show">No Show</SelectItem>
                          <SelectItem value="Cancelada pelo Cliente">Cancelada pelo Cliente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="observacoes">Observações</Label>
                      <Input
                        id="observacoes"
                        name="observacoes"
                        placeholder="Observações sobre a viagem"
                        value={currentTrip.observacoes || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
                  <Button type="button" onClick={handleCreateTrip}>Registrar Viagem</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por placa, motorista ou local..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Cards de estatísticas - Primeira linha */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card de Checklist */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-950 dark:to-blue-900">
              <CardTitle className="flex items-center text-lg">
                <CheckSquare className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                Checklists de Motoristas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col items-center justify-center p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">{checklistStats.concluidos}</span>
                    <span className="text-sm text-muted-foreground">Concluídos</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                    <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{checklistStats.pendentes}</span>
                    <span className="text-sm text-muted-foreground">Pendentes</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total de checklists</span>
                  <span className="font-medium">{checklistStats.total}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={fetchDriverStats}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Atualizar
                  </Button>
                  <Button variant="default" size="sm" onClick={() => setLocation('/line-hall-checklists')}>
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Gerenciar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Card de Manutenção */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-100 to-orange-50 dark:from-orange-950 dark:to-orange-900">
              <CardTitle className="flex items-center text-lg">
                <Wrench className="mr-2 h-5 w-5 text-orange-600 dark:text-orange-400" />
                Solicitações de Manutenção
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center justify-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                    <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{maintenanceStats.pendentes}</span>
                    <span className="text-xs text-muted-foreground">Pendentes</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{maintenanceStats.emAndamento}</span>
                    <span className="text-xs text-muted-foreground">Em Andamento</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">{maintenanceStats.concluidas}</span>
                    <span className="text-xs text-muted-foreground">Concluídas</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total de solicitações</span>
                  <span className="font-medium">{maintenanceStats.total}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={fetchDriverStats}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Atualizar
                  </Button>
                  <Button variant="default" size="sm" onClick={() => setLocation('/line-hall-maintenance')}>
                    <Wrench className="mr-2 h-4 w-4" />
                    Gerenciar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Card de Veículos na Garagem */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-100 to-green-50 dark:from-green-950 dark:to-green-900">
              <CardTitle className="flex items-center text-lg">
                <Car className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" />
                Veículos na Garagem
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">{garageStats.total_veiculos}</span>
                    <span className="text-sm text-muted-foreground">Total de Veículos</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {garageStats.media_dias ? garageStats.media_dias.toFixed(1) : '0.0'}
                    </span>
                    <span className="text-sm text-muted-foreground">Média de Dias</span>
                  </div>
                </div>
                
                {garageStats.veiculos.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Veículos Atualmente na Garagem:</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {garageStats.veiculos.map((veiculo: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md text-sm">
                          <span className="font-medium">{veiculo.vehicle_plate}</span>
                          <Badge className={veiculo.dias_na_garagem > 5 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                            {veiculo.dias_na_garagem} dia{veiculo.dias_na_garagem !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={fetchDriverStats}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Atualizar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setLocation('/stopped-vehicles')}>
                    <Car className="mr-2 h-4 w-4" />
                    Ver Veículos Parados
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
        </div>

        {/* Cards de estatísticas - Segunda linha */}
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Card de Rotas */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-100 to-green-50 dark:from-green-950 dark:to-green-900">
              <CardTitle className="flex items-center text-lg">
                <MapPin className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" />
                Rotas Cadastradas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total de rotas</span>
                  <span className="font-bold text-2xl text-green-600 dark:text-green-400">{routes.length}</span>
                </div>
                {routes.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Menor distância</span>
                      <span className="text-sm font-medium">
                        {Math.min(...routes.map((r: any) => Number(r.km_total))).toLocaleString('pt-BR')} km
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Maior distância</span>
                      <span className="text-sm font-medium">
                        {Math.max(...routes.map((r: any) => Number(r.km_total))).toLocaleString('pt-BR')} km
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Distância média</span>
                      <span className="text-sm font-medium">
                        {Math.round(routes.reduce((acc: number, r: any) => acc + Number(r.km_total), 0) / routes.length).toLocaleString('pt-BR')} km
                      </span>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowRoutes(!showRoutes)}>
                    <FileText className="mr-2 h-4 w-4" />
                    {showRoutes ? 'Ocultar' : 'Ver Rotas'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsCreatingRoute(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Rota
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Acesso para Motoristas */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-950 dark:to-purple-900">
              <CardTitle className="flex items-center text-lg">
                <AlertCircle className="mr-2 h-5 w-5 text-purple-600 dark:text-purple-400" />
                Acesso para Motoristas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col space-y-4">
                <p className="text-sm">
                  Os motoristas podem acessar a interface dedicada para realizar checklists de veículos, 
                  solicitar manutenções e recargas de cartão de combustível.
                </p>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                  <p className="text-sm font-medium text-center">URL de acesso:</p>
                  <p className="text-sm text-center text-purple-600 dark:text-purple-400 break-all">
                    {window.location.origin}/driver-access
                  </p>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => window.open('/driver-access', '_blank')}>
                  Acessar Interface do Motorista
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card de Solicitações de Cartão Combustível - Linha independente */}
        <div className="mb-6">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-100 to-green-50 dark:from-green-950 dark:to-green-900">
              <CardTitle className="flex items-center text-lg">
                <CreditCard className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" />
                Solicitações de Cartão Combustível
                {pendingFuelRequests > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white animate-pulse">
                    {pendingFuelRequests}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col space-y-4">
                {fuelCardRequests.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {fuelCardRequests.slice(0, 6).map((request) => (
                        <div key={request.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-sm">{request.motorista_nome}</span>
                            <Badge 
                              className={
                                request.status === 'aprovada' 
                                  ? 'bg-green-100 text-green-800' 
                                  : request.status === 'rejeitada'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {request.status === 'aprovada' ? 'Aprovada' : 
                               request.status === 'rejeitada' ? 'Rejeitada' : 'Pendente'}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div><strong>Veículo:</strong> {request.veiculo_placa}</div>
                            <div><strong>Rota:</strong> {request.rota_origem} → {request.rota_destino}</div>
                            {request.status === 'aprovada' && request.valor_aprovado && (
                              <div className="text-green-600 font-medium">
                                <strong>Valor aprovado:</strong> R$ {Number(request.valor_aprovado).toFixed(2)}
                              </div>
                            )}
                            {((request as any).valor_calculado || request.valor_solicitado) && (
                              <div className="text-blue-600">
                                <strong>Valor solicitado:</strong> R$ {Number((request as any).valor_calculado || request.valor_solicitado || 0).toFixed(2)}
                              </div>
                            )}
                            {request.observacoes_operador && (
                              <div className="text-orange-600">
                                <strong>Obs:</strong> {request.observacoes_operador}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowFuelRequests(!showFuelRequests)}
                      className="w-full"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {showFuelRequests ? 'Ocultar' : 'Ver Todas as Solicitações'}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="mx-auto h-12 w-12 mb-4 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">Nenhuma solicitação de cartão combustível</p>
                    <p className="text-xs text-muted-foreground mt-1">As solicitações dos motoristas aparecerão aqui</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de solicitações de cartão combustível - só exibe quando showFuelRequests for true */}
        {showFuelRequests && fuelCardRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <CreditCard className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" />
                Todas as Solicitações de Cartão Combustível
              </CardTitle>
              <CardDescription>
                Status completo das solicitações de recarga de cartão combustível dos motoristas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Motorista</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Rota</TableHead>
                      <TableHead>Data Viagem</TableHead>
                      <TableHead>Valor Solicitado</TableHead>
                      <TableHead>Valor Aprovado</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Operador</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fuelCardRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.motorista_nome}</TableCell>
                        <TableCell>{request.veiculo_placa}</TableCell>
                        <TableCell className="text-sm">
                          {request.rota_origem} → {request.rota_destino}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(request.data_viagem), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {((request as any).valor_calculado || request.valor_solicitado) ? (
                            <span className="text-blue-600 font-medium">
                              R$ {Number((request as any).valor_calculado || request.valor_solicitado || 0).toFixed(2)}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {request.valor_aprovado ? (
                            <span className="text-green-600 font-bold">
                              R$ {Number(request.valor_aprovado).toFixed(2)}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              request.status === 'aprovada' 
                                ? 'bg-green-100 text-green-800' 
                                : request.status === 'rejeitada'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {request.status === 'aprovada' ? 'Aprovada' : 
                             request.status === 'rejeitada' ? 'Rejeitada' : 'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {request.operador_aprovacao || '-'}
                        </TableCell>
                        <TableCell className="text-sm max-w-48 truncate">
                          {request.observacoes_operador || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabela de rotas cadastradas - só exibe quando showRoutes for true */}
        {showRoutes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <MapPin className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                Rotas Cadastradas
              </CardTitle>
              <CardDescription>
                Rotas disponíveis para as viagens do Line Haul Murici
              </CardDescription>
            </CardHeader>
            <CardContent>
              {routes.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ponto A (Origem)</TableHead>
                        <TableHead>Ponto B (Destino)</TableHead>
                        <TableHead>Distância (KM)</TableHead>
                        <TableHead>Data de Cadastro</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {routes.map((route: any) => (
                        <TableRow key={route.id}>
                          <TableCell className="font-medium">{route.nome_ponto_a}</TableCell>
                          <TableCell>{route.nome_ponto_b}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {Number(route.km_total).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(route.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  const mapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(route.nome_ponto_a)}/${encodeURIComponent(route.nome_ponto_b)}`;
                                  window.open(mapsUrl, '_blank');
                                }}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <MapPin className="mr-1 h-3 w-3" />
                                Ver no Maps
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => editRoute(route)}
                                className="text-green-600 hover:text-green-800"
                              >
                                <Edit className="mr-1 h-3 w-3" />
                                Editar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Nenhuma rota cadastrada ainda</p>
                  <p className="text-sm">Clique em "Nova Rota" para adicionar a primeira rota</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="mr-2 h-5 w-5" />
              Viagens Line Haul Murici
            </CardTitle>
            <CardDescription>
              Listagem de todas as viagens registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredTrips.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">Nenhuma viagem encontrada</p>
                <p className="text-muted-foreground">Registre uma nova viagem para começar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Cavalo</TableHead>
                      <TableHead>Carreta(s)</TableHead>
                      <TableHead>Motorista</TableHead>
                      <TableHead>Origem-Destino</TableHead>
                      <TableHead>Horário Carreg.</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell className="font-medium">{trip.id}</TableCell>
                        <TableCell>{trip.placa_cavalo}</TableCell>
                        <TableCell>
                          {trip.placa_carreta_1}
                          {trip.placa_carreta_2 && <div className="text-xs text-muted-foreground">{trip.placa_carreta_2}</div>}
                        </TableCell>
                        <TableCell>{trip.motorista_nome}</TableCell>
                        <TableCell>
                          <span className="font-medium">{trip.local_carregamento}</span> 
                          <span className="mx-1">→</span> 
                          <span>{trip.local_descarregamento}</span>
                        </TableCell>
                        <TableCell>{trip.horario_carregamento || '-'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusLabels[trip.status_viagem] || 'bg-gray-100'}`}>
                            {trip.status_viagem}
                          </span>
                        </TableCell>
                        <TableCell>
                          {format(new Date(trip.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => editTrip(trip)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTrip(trip.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Viagem</DialogTitle>
            <DialogDescription>
              Atualize os dados da viagem do Line Haul Murici
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_placa_cavalo">Placa do Cavalo *</Label>
                <Input
                  id="edit_placa_cavalo"
                  name="placa_cavalo"
                  placeholder="ABC1234"
                  value={currentTrip.placa_cavalo || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_placa_carreta_1">Placa da Carreta 1 *</Label>
                <Input
                  id="edit_placa_carreta_1"
                  name="placa_carreta_1"
                  placeholder="XYZ5678"
                  value={currentTrip.placa_carreta_1 || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_placa_carreta_2">Placa da Carreta 2</Label>
                <Input
                  id="edit_placa_carreta_2"
                  name="placa_carreta_2"
                  placeholder="DEF9012"
                  value={currentTrip.placa_carreta_2 || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_motorista_nome">Nome do Motorista *</Label>
                <Input
                  id="edit_motorista_nome"
                  name="motorista_nome"
                  placeholder="Nome do Motorista"
                  value={currentTrip.motorista_nome || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_local_carregamento">Local Carregamento *</Label>
                <Input
                  id="edit_local_carregamento"
                  name="local_carregamento"
                  placeholder="Local de Carregamento"
                  value={currentTrip.local_carregamento || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_local_descarregamento">Local Descarregamento *</Label>
                <Input
                  id="edit_local_descarregamento"
                  name="local_descarregamento"
                  placeholder="Local de Descarregamento"
                  value={currentTrip.local_descarregamento || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_horario_carregamento">Horário de Carregamento</Label>
                <Input
                  id="edit_horario_carregamento"
                  name="horario_carregamento"
                  type="time"
                  placeholder="HH:MM"
                  value={currentTrip.horario_carregamento || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_status_viagem">Status da Viagem *</Label>
                <Select 
                  name="status_viagem"
                  value={currentTrip.status_viagem} 
                  onValueChange={(value) => handleSelectChange('status_viagem', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Concluída">Concluída</SelectItem>
                    <SelectItem value="No Show">No Show</SelectItem>
                    <SelectItem value="Cancelada pelo Cliente">Cancelada pelo Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_observacoes">Observações</Label>
                <Input
                  id="edit_observacoes"
                  name="observacoes"
                  placeholder="Observações sobre a viagem"
                  value={currentTrip.observacoes || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
            <Button type="button" onClick={handleUpdateTrip}>Atualizar Viagem</Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>

        {/* Dialog para editar rota */}
        <Dialog open={isEditingRoute} onOpenChange={setIsEditingRoute}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Rota</DialogTitle>
              <DialogDescription>
                Edite os dados da rota do Line Haul Murici
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_nome_ponto_a">Ponto A (Origem) *</Label>
                <Input
                  id="edit_nome_ponto_a"
                  placeholder="Ex: São Paulo - SP"
                  value={currentRoute.nome_ponto_a}
                  onChange={(e) => setCurrentRoute(prev => ({ ...prev, nome_ponto_a: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_nome_ponto_b">Ponto B (Destino) *</Label>
                <Input
                  id="edit_nome_ponto_b"
                  placeholder="Ex: Rio de Janeiro - RJ"
                  value={currentRoute.nome_ponto_b}
                  onChange={(e) => setCurrentRoute(prev => ({ ...prev, nome_ponto_b: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_km_total">Distância Total (KM) *</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit_km_total"
                    type="number"
                    placeholder="Ex: 450"
                    value={currentRoute.km_total || ''}
                    onChange={(e) => setCurrentRoute(prev => ({ ...prev, km_total: parseFloat(e.target.value) || 0 }))}
                    className="flex-1"
                  />
                  {currentRoute.nome_ponto_a && currentRoute.nome_ponto_b && (
                    <Button 
                      type="button"
                      variant="outline" 
                      size="icon"
                      onClick={() => {
                        const mapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(currentRoute.nome_ponto_a)}/${encodeURIComponent(currentRoute.nome_ponto_b)}`;
                        window.open(mapsUrl, '_blank');
                      }}
                      className="text-blue-600 hover:text-blue-800 shrink-0"
                      title="Ver rota no Google Maps"
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground text-center">
                💡 Preencha origem e destino, depois clique no ícone ao lado do campo distância para consultar no Google Maps
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditingRoute(false)}>Cancelar</Button>
              {currentRoute.nome_ponto_a && currentRoute.nome_ponto_b && (
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => {
                    const mapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(currentRoute.nome_ponto_a)}/${encodeURIComponent(currentRoute.nome_ponto_b)}`;
                    window.open(mapsUrl, '_blank');
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Ver no Maps
                </Button>
              )}
              <Button type="button" onClick={handleUpdateRoute}>Atualizar Rota</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </MainLayoutSimple>
  );
}