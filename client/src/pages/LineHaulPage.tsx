import { useState, useEffect } from 'react';
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
  ArrowLeft,
  Edit,
  Trash2,
  ClipboardCheck,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { DriverAutocomplete } from '@/components/ui/driver-autocomplete';
import { Combobox } from '@/components/ui/combobox';
import lineHaulLayoutImage from '@assets/image_1754418722959.png';
import { apiRequest } from '@/lib/queryClient';
import LineHaulExecutiveDashboard from '@/components/LineHaulExecutiveDashboard';

// Função para formatar data brasileira (DD/MM/YYYY HH:MM) ou qualquer outro formato
function formatBrazilianDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Não informado';
  
  const str = String(dateStr).trim();
  if (!str) return 'Não informado';
  
  // Se já está no formato brasileiro DD/MM/YYYY (com ou sem hora)
  const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, '0');
    const month = brMatch[2].padStart(2, '0');
    const year = brMatch[3];
    const hours = brMatch[4] ? brMatch[4].padStart(2, '0') : null;
    const minutes = brMatch[5] ? brMatch[5].padStart(2, '0') : null;
    
    if (hours && minutes) {
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
    return `${day}/${month}/${year}`;
  }
  
  // Se é formato ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:MM:SS)
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:T(\d{1,2}):(\d{1,2}))?/);
  if (isoMatch) {
    const day = isoMatch[3].padStart(2, '0');
    const month = isoMatch[2].padStart(2, '0');
    const year = isoMatch[1];
    const hours = isoMatch[4] ? isoMatch[4].padStart(2, '0') : null;
    const minutes = isoMatch[5] ? isoMatch[5].padStart(2, '0') : null;
    
    if (hours && minutes) {
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
    return `${day}/${month}/${year}`;
  }
  
  // Tenta parsear como Date
  try {
    const date = new Date(str);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch {
    // Ignora erro
  }
  
  return str || 'Não informado';
}

interface LineHallTrip {
  id: number;
  placa_cavalo: string;
  placa_carreta_1: string;
  placa_carreta_2?: string | null;
  motorista_id: number;
  motorista_nome: string;
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
  codigo_origem?: string;
  codigo_destino?: string;
  nome_ponto_a: string;
  nome_ponto_b: string;
  km_total: number;
  observacoes?: string;
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
  km_inicial?: number;
  km_final?: number;
  condicao_pneus?: string;
  condicao_luzes?: string;
  condicao_freios?: string;
  condicao_parabrisa?: string;
  nivel_oleo?: string;
  nivel_agua?: string;
  estrutura_cavalo?: string;
  estrutura_carreta?: string;
  avarias?: string[];
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

// Função para gerar rotas aleatórias realistas
const generateRandomRoute = () => {
  const routes = [
    'São Paulo → Rio de Janeiro',
    'São Paulo → Belo Horizonte',
    'São Paulo → Campinas',
    'São Paulo → Santos',
    'São Paulo → Ribeirão Preto',
    'São Paulo → Sorocaba',
    'Rio de Janeiro → São Paulo',
    'Belo Horizonte → São Paulo',
    'Campinas → São Paulo',
    'Santos → São Paulo',
    'Guarulhos → Campinas',
    'Osasco → Santos',
    'ABC → Rio de Janeiro',
    'Sorocaba → Belo Horizonte',
    'Hortolândia → Santos'
  ];
  return routes[Math.floor(Math.random() * routes.length)];
};

// Lista de códigos de rotas pré-cadastrados
const ROUTE_CODES = [
  { code: '5022', name: 'SoC_SP_Santana', full: '[5022]SoC_SP_Santana' },
  { code: '5015', name: 'SoC_RJ_Rio de Janeiro', full: '[5015]SoC_RJ_Rio de Janeiro' },
  { code: '5037', name: 'SoC_PR_Curitiba', full: '[5037]SoC_PR_Curitiba' },
  { code: '6042', name: 'SoC_MG_Betim', full: '[6042]SoC_MG_Betim' },
  { code: '8807', name: 'SoC_SP_Louveira', full: '[8807]SoC_SP_Louveira' },
  { code: '12156', name: 'SoC_RS_Gravataí_02', full: '[12156]SoC_RS_Gravataí_02' },
  { code: '10964', name: 'SoC_SP_São Bernardo do Campo', full: '[10964]SoC_SP_São Bernardo do Campo' },
  { code: '10616', name: 'LM Hub_GO_Aparecida de Goiânia', full: '[10616]LM Hub_GO_Aparecida de Goiânia' },
  { code: '6704', name: 'SoC_SP_Cravinhos', full: '[6704]SoC_SP_Cravinhos' },
  { code: '8300', name: 'SoC_RJ_Duque de Caxias', full: '[8300]SoC_RJ_Duque de Caxias' },
  { code: '7331', name: 'SoC_SP_Guarulhos', full: '[7331]SoC_SP_Guarulhos' },
  { code: '11883', name: 'FM Hub_3PL_PR_Londrina_01', full: '[11883]FM Hub_3PL_PR_Londrina_01' },
  { code: '12158', name: 'SoC_SC_Itajaí', full: '[12158]SoC_SC_Itajaí' },
  { code: '9994', name: 'FM Hub_PR_Maringa-02', full: '[9994]FM Hub_PR_Maringa-02' },
  { code: '7915', name: 'FM Hub_RJ_Campo Grande', full: '[7915]FM Hub_RJ_Campo Grande' },
  { code: '5102', name: 'FM Hub_SP_São_Paulo_Artur_Alvim', full: '[5102]FM Hub_SP_São_Paulo_Artur_Alvim' },
  { code: '11677', name: 'SoC_SP_Franco da Rocha', full: '[11677]SoC_SP_Franco da Rocha' },
  { code: '12084', name: 'FM Hub_SP_Itaquaquecetuba', full: '[12084]FM Hub_SP_Itaquaquecetuba' },
  { code: '6891', name: 'FM Hub_RJ_Duas Pedras_Nv Fri', full: '[6891]FM Hub_RJ_Duas Pedras_Nv Fri' },
  { code: '12081', name: 'FM Hub_SP_Taubaté_02', full: '[12081]FM Hub_SP_Taubaté_02' },
  { code: '12426', name: 'FM Hub_MG_SeteLagoas', full: '[12426]FM Hub_MG_SeteLagoas' },
  { code: '10090', name: 'FM Hub_SP_Osasco_02', full: '[10090]FM Hub_SP_Osasco_02' },
  { code: '11971', name: 'FM Hub_PR_Cascavel_02', full: '[11971]FM Hub_PR_Cascavel_02' },
  { code: '9512', name: 'FM Hub_MG_Extrema', full: '[9512]FM Hub_MG_Extrema' },
  { code: '10044', name: 'LM Hub_SP_Tatuí', full: '[10044]LM Hub_SP_Tatuí' },
  { code: '6686', name: 'XPT_RJ_Itaperuna', full: '[6686]XPT_RJ_Itaperuna' },
  { code: '9659', name: 'LM Hub_PR_Paranaguá', full: '[9659]LM Hub_PR_Paranaguá' },
  { code: '9656', name: 'LM Hub_ES_São Mateus', full: '[9656]LM Hub_ES_São Mateus' },
  { code: '8814', name: 'LM Hub_ES_Linhares', full: '[8814]LM Hub_ES_Linhares' },
  { code: '6081', name: 'XPT_RS_Uruguaiana', full: '[6081]XPT_RS_Uruguaiana' },
  { code: '5069', name: 'LM Hub_RJ_Rio de Janeiro_Campo G', full: '[5069]LM Hub_RJ_Rio de Janeiro_Campo G' },
  { code: '11980', name: 'LM Hub_GO_Goiânia_Aeroporto', full: '[11980]LM Hub_GO_Goiânia_Aeroporto' },
  { code: '9798', name: 'LM Hub_PR_Maringá', full: '[9798]LM Hub_PR_Maringá' },
  { code: '5526', name: 'LM Hub_PR_Cascavel', full: '[5526]LM Hub_PR_Cascavel' },
  { code: '12370', name: 'LM Hub_MG_Contagem 02', full: '[12370]LM Hub_MG_Contagem 02' },
  { code: '12467', name: 'XPT_MG_Leopoldina_03', full: '[12467]XPT_MG_Leopoldina_03' },
  { code: '5595', name: 'LM Hub_MG_Patos de Minas', full: '[5595]LM Hub_MG_Patos de Minas' },
  { code: '7094', name: 'XPT_RS_Frederico Westphalen', full: '[7094]XPT_RS_Frederico Westphalen' },
  { code: '5592', name: 'LM Hub_SP_Araçatuba', full: '[5592]LM Hub_SP_Araçatuba' },
  { code: '11415', name: 'LM Hub_RJ_Mage', full: '[11415]LM Hub_RJ_Mage' },
  { code: '6485', name: 'LM Hub_RJ_Volta Redonda', full: '[6485]LM Hub_RJ_Volta Redonda' },
  { code: '8692', name: 'LM Hub_RJ_Duque de Caxias', full: '[8692]LM Hub_RJ_Duque de Caxias' },
  { code: '10102', name: 'LM Hub_MG_Belo Horizonte_02', full: '[10102]LM Hub_MG_Belo Horizonte_02' },
  { code: '10099', name: 'LM Hub_SP_Assis', full: '[10099]LM Hub_SP_Assis' },
  { code: '8130', name: 'LM Hub_SP_Guaratinguetá', full: '[8130]LM Hub_SP_Guaratinguetá' },
  { code: '5033', name: 'LM Hub_SP_Limeira_Campo Belo', full: '[5033]LM Hub_SP_Limeira_Campo Belo' },
  { code: '5071', name: 'LM Hub_SP_Santos_Praia Grande', full: '[5071]LM Hub_SP_Santos_Praia Grande' },
  { code: '8364', name: 'LM Hub_RS_Lajeado', full: '[8364]LM Hub_RS_Lajeado' },
  { code: '10242', name: 'LM Hub_SP_VilaGuilherme', full: '[10242]LM Hub_SP_VilaGuilherme' },
  { code: '10093', name: 'FM Hub_ES_Vila Velha', full: '[10093]FM Hub_ES_Vila Velha' },
  { code: '10703', name: 'LM Hub_SP_Santos_PraiaGrande_02', full: '[10703]LM Hub_SP_Santos_PraiaGrande_02' },
  { code: '8716', name: 'LM Hub_SP_Mogi Mirim', full: '[8716]LM Hub_SP_Mogi Mirim' },
  { code: '10098', name: 'LM Hub_SP_Zimba', full: '[10098]LM Hub_SP_Zimba' },
  { code: '5025', name: 'LM Hub_SP_Artur Alvim', full: '[5025]LM Hub_SP_Artur Alvim' },
  { code: '12781', name: 'SoC_SP_Cumbica_Guarulhos', full: '[12781]SoC_SP_Cumbica_Guarulhos' },
  { code: '7028', name: 'XPT_RJ_Saquarema', full: '[7028]XPT_RJ_Saquarema' }
];

const LineHaulPage = () => {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para dados
  const [trips, setTrips] = useState<LineHallTrip[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [garageVehicles, setGarageVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [checklists, setChecklists] = useState<DriverChecklist[]>([]);
  
  // Estados para diálogos
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [showRoutes, setShowRoutes] = useState(false);
  const [showRoutesList, setShowRoutesList] = useState(false);
  const [showNewRoute, setShowNewRoute] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [showChecklists, setShowChecklists] = useState(false);
  const [checklistFilter, setChecklistFilter] = useState<'todos' | 'concluidos' | 'pendentes'>('todos');
  const [selectedChecklist, setSelectedChecklist] = useState<DriverChecklist | null>(null);
  const [showChecklistDetails, setShowChecklistDetails] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [maintenanceFilter, setMaintenanceFilter] = useState<'todos' | 'pendentes' | 'em_andamento' | 'concluidas'>('todos');
  const [showGarage, setShowGarage] = useState(false);
  const [garageFilter, setGarageFilter] = useState<'todos' | 'cavalos' | 'carretas' | 'manutencao'>('todos');
  const [plateSearch, setPlateSearch] = useState<string>('');
  
  // Estados para estatísticas
  const [stats, setStats] = useState({
    checklistStats: { pendentes: 0, concluidos: 0, total: 0 },
    maintenanceStats: { pendentes: 0, emAndamento: 0, concluidas: 0, total: 0 },
    garageStats: { total_veiculos: 0, media_dias: 0 },
    totalRoutes: 0
  });
  

  // Estado para formulário de nova rota
  const [newRoute, setNewRoute] = useState({
    codigo_origem: '',
    codigo_destino: '',
    nome_ponto_a: '',
    nome_ponto_b: '',
    km_total: 0,
    observacoes: ''
  });
  
  // Estado para controlar o cálculo automático de distância
  const [distanceStatus, setDistanceStatus] = useState<string>('');
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  
  // Estados para Dialog de Ordem de Serviço
  const [showWorkorderDialog, setShowWorkorderDialog] = useState(false);
  const [selectedMaintenanceForWorkorder, setSelectedMaintenanceForWorkorder] = useState<MaintenanceRequest | null>(null);
  const [workshopsList, setWorkshopsList] = useState<any[]>([]);
  const [partsList, setPartsList] = useState<Array<{ name: string; value: string }>>([]);
  const [workorderForm, setWorkorderForm] = useState({
    workshopId: '',
    workshopName: '',
    serviceDescription: '',
    laborCost: '',
    partsCost: '',
    otherCosts: '',
    invoiceNumber: '',
    technicianName: '',
    partsUsed: '',
    expectedCompletionAt: '',
    notes: ''
  });

  // useEffect para calcular automaticamente a distância quando origem e destino mudam
  useEffect(() => {
    const calculateDistance = async () => {
      if (newRoute.nome_ponto_a.trim() && newRoute.nome_ponto_b.trim()) {
        setIsCalculatingDistance(true);
        setDistanceStatus('Consultando distância...');
        
        try {
          const res = await apiRequest('POST', '/api/line-hall/calculate-distance', {
            origem: newRoute.nome_ponto_a,
            destino: newRoute.nome_ponto_b
          });
          const response = await res.json();
          
          if (response.success) {
            setNewRoute(prev => ({ ...prev, km_total: response.distancia }));
            setDistanceStatus(`Distância calculada: ${response.distancia} km`);
          } else {
            setDistanceStatus(response.message || 'Não foi possível calcular a distância');
          }
        } catch (error: any) {
          console.error('Erro ao calcular distância:', error);
          setDistanceStatus('Erro ao calcular distância. Verifique os endereços informados.');
        } finally {
          setIsCalculatingDistance(false);
        }
      } else {
        setDistanceStatus('');
        setNewRoute(prev => ({ ...prev, km_total: 0 }));
      }
    };

    const timeoutId = setTimeout(calculateDistance, 1000); // Debounce de 1 segundo
    return () => clearTimeout(timeoutId);
  }, [newRoute.nome_ponto_a, newRoute.nome_ponto_b]);

  // Tipo para operações Line Haul
  interface LineHaulOperation {
    id?: number;
    motorista_id: number;
    motorista_nome: string;
    motorista_cpf?: string;
    motorista_codigo?: string;
    tipo_veiculo: 'truck' | 'cavalo_mecanico';
    placa_truck?: string;
    placa_cavalo?: string;
    placa_carreta_1?: string;
    placa_carreta_2?: string;
    rota_id: number;
    rota_nome: string;
    data_inicio: string;
    observacoes?: string;
    status: 'finalizada' | 'cancelada_cliente' | 'no_show' | 'programada';
    justificativa_no_show?: string;
    data_criacao?: string;
    created_by?: string;
  }

  // Estados para gestão de operações
  const [showOperationsManagement, setShowOperationsManagement] = useState(false);
  const [showNewOperation, setShowNewOperation] = useState(false);
  const [showOperationDetails, setShowOperationDetails] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<LineHaulOperation | null>(null);
  const [operationsData, setOperationsData] = useState<LineHaulOperation[]>([]);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [noShowJustification, setNoShowJustification] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [routeSearchTerm, setRouteSearchTerm] = useState('');
  const [isRouteDropdownOpen, setIsRouteDropdownOpen] = useState(false);
  const [pendingFuelCardRequests, setPendingFuelCardRequests] = useState(0);
  
  // Estados para importação em massa
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  const [verifyResults, setVerifyResults] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [newOperation, setNewOperation] = useState<LineHaulOperation>({
    motorista_id: 0,
    motorista_nome: '',
    tipo_veiculo: 'truck',
    placa_truck: '',
    placa_cavalo: '',
    placa_carreta_1: '',
    placa_carreta_2: '',
    rota_id: 0,
    rota_nome: '',
    data_inicio: new Date().toISOString().split('T')[0],
    observacoes: '',
    status: 'finalizada',
    justificativa_no_show: ''
  });

  useEffect(() => {
    fetchData();
    fetchPendingFuelCardRequests();
    
    // Verificar novas solicitações a cada 30 segundos
    const interval = setInterval(() => {
      fetchPendingFuelCardRequests();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Buscar solicitações pendentes do Line Haul
  const fetchPendingFuelCardRequests = async () => {
    try {
      const res = await fetch('/api/public/fuel-card/solicitations?origem_tipo=line_hall&status=Pendente&limit=100');
      const data = await res.json();
      if (data.success) {
        setPendingFuelCardRequests(data.data?.length || 0);
      }
    } catch (error) {
      console.error('Erro ao buscar solicitações pendentes:', error);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchTrips(),
        fetchRoutes(),
        fetchVehicles(),
        fetchDrivers(),
        fetchChecklists(),
        fetchStats(),
        fetchOperations(),
        fetchMaintenanceRequests()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrips = async () => {
    try {
      const res = await apiRequest('GET', '/api/line-hall-shopee');
      const response = await res.json();
      if (response.success) {
        setTrips(response.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar viagens:', error);
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await apiRequest('GET', '/api/line-hall/routes');
      const response = await res.json();
      if (response.success) {
        setRoutes(response.data || []);
        setStats(prev => ({ ...prev, totalRoutes: response.data?.length || 0 }));
      }
    } catch (error) {
      console.error('Erro ao buscar rotas:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await apiRequest('GET', '/api/vehicles');
      const response = await res.json();
      if (response && Array.isArray(response)) {
        const lineHaulVehicles = response.filter(vehicle => 
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
      const res = await apiRequest('GET', '/api/drivers');
      const response = await res.json();
      if (response && Array.isArray(response)) {
        setDrivers(response);
      }
    } catch (error) {
      console.error('Erro ao buscar motoristas:', error);
    }
  };

  const fetchChecklists = async () => {
    try {
      const res = await apiRequest('GET', '/api/line-hall/checklists');
      const response = await res.json();
      if (response.success) {
        setChecklists(response.data || []);
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
      const res = await apiRequest('GET', '/api/line-hall/maintenance-requests');
      const response = await res.json();
      if (response.success && response.data) {
        // Mapear os dados do banco para o formato esperado pela interface
        const mappedRequests: MaintenanceRequest[] = response.data.map((req: any) => ({
          id: req.id,
          vehicle_plate: req.vehicle_plate,
          vehicle_model: "Não informado", // Pode ser buscado da tabela de veículos se necessário
          driver_name: req.motorista_nome || "Não informado",
          maintenance_type: req.tipo_problema || "Não especificado",
          description: req.description,
          status: req.status,
          priority: req.urgency === 'emergencial' ? 'urgente' : 
                    req.urgency === 'alta' ? 'alta' :
                    req.urgency === 'normal' ? 'media' : 'baixa',
          created_at: req.created_at,
          updated_at: req.updated_at,
          estimated_cost: 0,
          workshop_name: "Oficina Line Haul"
        }));
        setMaintenanceRequests(mappedRequests);
      }
    } catch (error) {
      console.error('Erro ao buscar solicitações de manutenção:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Buscar estatísticas de checklist
      const checklistRes = await apiRequest('GET', '/api/line-hall/checklist-stats');
      const checklistResponse = await checklistRes.json();
      if (checklistResponse.success) {
        setStats(prev => ({
          ...prev,
          checklistStats: {
            pendentes: checklistResponse.pendentes || 0,
            concluidos: checklistResponse.concluidos || 0,
            total: checklistResponse.total || 0
          }
        }));
      }

      // Buscar estatísticas de manutenção
      const maintenanceRes = await apiRequest('GET', '/api/line-hall/maintenance-stats');
      const maintenanceResponse = await maintenanceRes.json();
      if (maintenanceResponse.success) {
        setStats(prev => ({
          ...prev,
          maintenanceStats: {
            pendentes: maintenanceResponse.pendentes || 0,
            emAndamento: maintenanceResponse.emAndamento || 0,
            concluidas: maintenanceResponse.concluidas || 0,
            total: maintenanceResponse.total || 0
          }
        }));
      }

      // Buscar estatísticas da garagem
      const garageRes = await apiRequest('GET', '/api/line-hall/garage-stats');
      const garageResponse = await garageRes.json();
      if (garageResponse.success) {
        setStats(prev => ({
          ...prev,
          garageStats: {
            total_veiculos: garageResponse.total_veiculos || 0,
            media_dias: garageResponse.media_dias || 0,
            data: garageResponse.data || []
          }
        }));
        // Popular garageVehicles com os veículos da garagem
        setGarageVehicles(garageResponse.data || []);
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

  const handleCreateRoute = async () => {
    if (!newRoute.nome_ponto_a || !newRoute.nome_ponto_b || !newRoute.km_total) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const res = await apiRequest('POST', '/api/line-hall/routes', newRoute);
      const response = await res.json();
      if (response.success) {
        // Atualiza a lista de rotas
        await fetchRoutes();
        
        toast({
          title: "Sucesso",
          description: "Rota cadastrada com sucesso!"
        });
        
        // Limpa o formulário e fecha o modal
        setNewRoute({
          codigo_origem: '',
          codigo_destino: '',
          nome_ponto_a: '',
          nome_ponto_b: '',
          km_total: 0,
          observacoes: ''
        });
        
        // Pequeno delay para garantir que a lista foi atualizada
        setTimeout(() => {
          setShowNewRoute(false);
        }, 500);
      }
    } catch (error) {
      console.error('Erro ao criar rota:', error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar rota",
        variant: "destructive"
      });
    }
  };

  const handleUpdateRoute = async () => {
    if (!editingRoute || !newRoute.nome_ponto_a || !newRoute.nome_ponto_b || !newRoute.km_total) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const res = await apiRequest('PUT', `/api/line-hall/routes/${editingRoute.id}`, newRoute);
      const response = await res.json();
      if (response.success) {
        // Atualiza a lista de rotas
        await fetchRoutes();
        
        toast({
          title: "Sucesso",
          description: "Rota atualizada com sucesso!"
        });
        
        // Limpa o formulário e fecha o modal
        setNewRoute({
          codigo_origem: '',
          codigo_destino: '',
          nome_ponto_a: '',
          nome_ponto_b: '',
          km_total: 0,
          observacoes: ''
        });
        setEditingRoute(null);
        
        // Pequeno delay para garantir que a lista foi atualizada
        setTimeout(() => {
          setShowNewRoute(false);
        }, 500);
      }
    } catch (error) {
      console.error('Erro ao atualizar rota:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar rota",
        variant: "destructive"
      });
    }
  };

  // Função para atualizar status da operação
  const handleUpdateOperationStatus = async () => {
    if (!selectedOperation || !newStatus) {
      toast({
        title: "Erro",
        description: "Selecione um novo status",
        variant: "destructive"
      });
      return;
    }

    if (newStatus === 'no_show' && !noShowJustification.trim()) {
      toast({
        title: "Erro",
        description: "Justificativa é obrigatória para status No Show",
        variant: "destructive"
      });
      return;
    }

    setIsUpdatingStatus(true);

    try {
      const response = await apiRequest(
        'PATCH',
        `/api/line-hall/operations/${selectedOperation.id}/status`,
        {
          status: newStatus,
          justificativa_no_show: newStatus === 'no_show' ? noShowJustification : null
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sucesso!",
          description: "Status atualizado com sucesso"
        });

        // Atualizar a operação selecionada
        setSelectedOperation(data.data);

        // Atualizar a lista de operações
        await fetchOperations();

        // Resetar estados de edição
        setIsEditingStatus(false);
        setNewStatus('');
        setNoShowJustification('');
      } else {
        throw new Error(data.message || 'Erro ao atualizar status');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar status da operação",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Função para processar arquivo Excel de importação
  const handleExcelFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportResults(null);
    setVerifyResults(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      // Ignorar primeira linha (cabeçalho) e processar dados
      const operations = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (row && row.length >= 7 && row[0]) {
          operations.push({
            driverId: row[0],       // [codigo]nome
            vehicleType: row[1],    // CARRETA, TRUCK
            plate: row[2],          // placas (pode ter vírgula)
            station: row[3],        // [codigo]origem
            destino: row[4],        // [codigo]destino
            sta: row[5],            // data/hora carregamento
            ata: row[6]             // data/hora fim
          });
        }
      }

      setImportPreview(operations);
      
      // Verificar motoristas e rotas automaticamente
      if (operations.length > 0) {
        setIsVerifying(true);
        try {
          const verifyResponse = await fetch('/api/line-hall/operations/verify-import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operations })
          });
          const verifyData = await verifyResponse.json();
          if (verifyData.success) {
            setVerifyResults(verifyData.data);
          }
        } catch (err) {
          console.error('Erro na verificação:', err);
        } finally {
          setIsVerifying(false);
        }
      }
      
      toast({
        title: "Arquivo carregado",
        description: `${operations.length} operações encontradas para importar`
      });
    } catch (error: any) {
      console.error('Erro ao ler arquivo Excel:', error);
      toast({
        title: "Erro",
        description: "Não foi possível ler o arquivo Excel",
        variant: "destructive"
      });
    }
  };

  // Função para executar importação em massa
  const handleBulkImport = async () => {
    if (importPreview.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhuma operação para importar",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch('/api/line-hall/operations/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations: importPreview })
      });

      const data = await response.json();

      if (data.success) {
        setImportResults(data.results);
        toast({
          title: "Importação concluída!",
          description: data.message
        });
        
        // Atualizar lista de operações E rotas
        await fetchOperations();
        await fetchRoutes();
        await fetchDrivers();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      console.error('Erro na importação:', error);
      toast({
        title: "Erro na importação",
        description: error.message || "Erro ao importar operações",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Limpar importação
  const handleClearImport = () => {
    setImportFile(null);
    setImportPreview([]);
    setImportResults(null);
    setVerifyResults(null);
  };

  const handleCreateOperation = async () => {
    if (isLoading) return; // Previne cliques duplos
    
    console.log("=== CRIAR OPERAÇÃO ===");
    console.log("Estado do formulário:", newOperation);
    console.log("Motorista ID:", newOperation.motorista_id);
    console.log("Rota ID:", newOperation.rota_id);
    console.log("Placa Truck:", newOperation.placa_truck);
    
    // Validação básica
    if (!newOperation.motorista_id || !newOperation.rota_id) {
      console.log("❌ FALHA: Motorista ou Rota não selecionados");
      toast({
        title: "Erro",
        description: "Selecione motorista e rota",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);

    // Validação específica para tipo de veículo
    if (newOperation.tipo_veiculo === 'truck' && !newOperation.placa_truck) {
      setIsLoading(false);
      toast({
        title: "Erro",
        description: "Informe a placa do truck",
        variant: "destructive"
      });
      return;
    }

    if (newOperation.tipo_veiculo === 'cavalo_mecanico' && (!newOperation.placa_cavalo || !newOperation.placa_carreta_1)) {
      setIsLoading(false);
      toast({
        title: "Erro",
        description: "Informe a placa do cavalo mecânico e primeira carreta",
        variant: "destructive"
      });
      return;
    }

    // Validação para justificativa no show
    if (newOperation.status === 'no_show' && !newOperation.justificativa_no_show.trim()) {
      setIsLoading(false);
      toast({
        title: "Erro",
        description: "Informe a justificativa para No Show",
        variant: "destructive"
      });
      return;
    }

    try {
      const operationData = {
        ...newOperation,
        data_criacao: new Date().toISOString(),
        created_by: user?.name || 'Sistema'
      };

      console.log("📤 Enviando para o backend:", operationData);
      const res = await apiRequest('POST', '/api/line-hall/operations', operationData);
      const response = await res.json();
      console.log("📥 Resposta do backend:", response);
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Operação criada com sucesso!"
        });
        setNewOperation({
          motorista_id: 0,
          motorista_nome: '',
          tipo_veiculo: 'truck',
          placa_truck: '',
          placa_cavalo: '',
          placa_carreta_1: '',
          placa_carreta_2: '',
          rota_id: 0,
          rota_nome: '',
          data_inicio: new Date().toISOString().split('T')[0],
          observacoes: '',
          status: 'finalizada',
          justificativa_no_show: ''
        });
        setShowNewOperation(false);
        await fetchOperations();
      }
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Erro ao criar operação:', error);
      setIsLoading(false);
      toast({
        title: "Erro",
        description: "Erro ao criar operação",
        variant: "destructive"
      });
    }
  };

  const fetchOperations = async () => {
    try {
      const res = await apiRequest('GET', '/api/line-hall/operations');
      const response = await res.json();
      if (response.success) {
        setOperationsData(response.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar operações:', error);
      setOperationsData([]);
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

  // Função para atualizar status de solicitação de manutenção
  const handleUpdateMaintenanceStatus = async (requestId: number, newStatus: string) => {
    try {
      const res = await apiRequest('PUT', `/api/line-hall/maintenance-requests/${requestId}/status`, {
        status: newStatus
      });
      const response = await res.json();
      
      if (response.success) {
        toast({
          title: "Status atualizado",
          description: `Solicitação ${newStatus === 'em_andamento' ? 'iniciada' : 'finalizada'} com sucesso!`
        });
        // Recarregar as solicitações
        await fetchMaintenanceRequests();
        await fetchStats();
      } else {
        toast({
          title: "Erro",
          description: response.message || "Erro ao atualizar status",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da manutenção",
        variant: "destructive"
      });
    }
  };

  // Buscar lista de oficinas
  const fetchWorkshops = async () => {
    try {
      const res = await apiRequest('GET', '/api/workshops');
      const response = await res.json();
      if (response && Array.isArray(response)) {
        setWorkshopsList(response);
      }
    } catch (error) {
      console.error('Erro ao buscar oficinas:', error);
    }
  };

  // Funções para gerenciar peças
  const addPart = () => {
    setPartsList([...partsList, { name: '', value: '' }]);
  };

  const removePart = (index: number) => {
    setPartsList(partsList.filter((_, i) => i !== index));
  };

  const updatePart = (index: number, field: 'name' | 'value', value: string) => {
    const newParts = [...partsList];
    newParts[index][field] = value;
    setPartsList(newParts);
  };

  // Calcular total de peças
  const calculatePartsCost = () => {
    return partsList.reduce((total, part) => {
      const value = parseFloat(part.value || '0');
      return total + value;
    }, 0);
  };

  // Abrir dialog de ordem de serviço
  const handleOpenWorkorderDialog = async (maintenance: MaintenanceRequest) => {
    setSelectedMaintenanceForWorkorder(maintenance);
    setPartsList([]);
    setWorkorderForm({
      workshopId: '',
      workshopName: '',
      serviceDescription: maintenance.description || '',
      laborCost: '',
      partsCost: '',
      otherCosts: '',
      invoiceNumber: '',
      technicianName: '',
      partsUsed: '',
      expectedCompletionAt: '',
      notes: ''
    });
    await fetchWorkshops();
    setShowWorkorderDialog(true);
  };

  // Submeter formulário de ordem de serviço
  const handleSubmitWorkorder = async () => {
    if (!selectedMaintenanceForWorkorder) return;
    
    if (!workorderForm.workshopName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe o nome da oficina",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Montar lista de peças para o campo partsUsed
      const partsDescription = partsList
        .filter(part => part.name.trim())
        .map(part => `${part.name} - R$ ${parseFloat(part.value || '0').toFixed(2)}`)
        .join('\n');
      
      // Calcular total de peças
      const totalPartsCost = calculatePartsCost().toFixed(2);
      
      const formData = {
        ...workorderForm,
        partsCost: totalPartsCost,
        partsUsed: partsDescription || workorderForm.partsUsed
      };
      
      const res = await apiRequest('POST', `/api/line-hall/maintenance-requests/${selectedMaintenanceForWorkorder.id}/workorders`, formData);
      const response = await res.json();
      
      if (response.success) {
        toast({
          title: "Ordem de serviço criada",
          description: "Manutenção iniciada com sucesso!"
        });
        setShowWorkorderDialog(false);
        setPartsList([]);
        await fetchMaintenanceRequests();
        await fetchStats();
      } else {
        toast({
          title: "Erro",
          description: response.message || "Erro ao criar ordem de serviço",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao criar ordem de serviço:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar ordem de serviço",
        variant: "destructive"
      });
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
            <Card className="bg-white/80 backdrop-blur-sm">
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
                  checklistFilter === 'todos' || 
                  (checklistFilter === 'concluidos' && checklist.status === 'concluido') ||
                  (checklistFilter === 'pendentes' && checklist.status === 'pendente')
                )
                .map(checklist => (
                <Card key={checklist.id} className="bg-white/80 backdrop-blur-sm">
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
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedChecklist(checklist);
                          setShowChecklistDetails(true);
                        }}
                        data-testid={`btn-ver-detalhes-checklist-${checklist.id}`}
                      >
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
            <Card className="bg-white/80 backdrop-blur-sm">
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
            <Card className="bg-white/80 backdrop-blur-sm">
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
                <Card key={request.id} className="bg-white/80 backdrop-blur-sm">
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
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          toast({
                            title: "Detalhes da Solicitação",
                            description: `Placa: ${request.vehicle_plate} | Tipo: ${request.maintenance_type} | Prioridade: ${request.priority}`
                          });
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalhes
                      </Button>
                      {request.status === 'pendente' && (
                        <Button 
                          size="sm" 
                          className="flex-1 bg-blue-500 hover:bg-blue-600"
                          onClick={() => handleOpenWorkorderDialog(request)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Iniciar Manutenção
                        </Button>
                      )}
                      {request.status === 'em_andamento' && (
                        <Button 
                          size="sm" 
                          className="flex-1 bg-green-500 hover:bg-green-600"
                          onClick={() => handleUpdateMaintenanceStatus(request.id, 'concluida')}
                        >
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
            <Card className="bg-white/80 backdrop-blur-sm">
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

            {/* Busca e Filtros de Garagem */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-green-700">
                  <Car className="h-5 w-5 mr-2" />
                  Buscar e Filtrar Veículos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input
                    placeholder="Buscar por placa..."
                    value={plateSearch}
                    onChange={(e) => setPlateSearch(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant={garageFilter === 'todos' ? 'default' : 'outline'}
                    onClick={() => setGarageFilter('todos')}
                    className="flex-1"
                  >
                    Todos ({garageVehicles.length})
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Veículos na Garagem */}
            <div className="grid gap-4">
              {garageVehicles.length > 0 ? (
                garageVehicles
                  .filter(vehicle => {
                    // Filtro por busca de placa
                    const matchesPlateSearch = plateSearch === '' || 
                      vehicle.plate.toLowerCase().includes(plateSearch.toLowerCase());
                    
                    return matchesPlateSearch;
                  })
                  .map((vehicle, index) => (
                  <Card key={index} className="bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{vehicle.plate}</h3>
                          <p className="text-sm text-gray-600">Motorista: {vehicle.driver_name}</p>
                          <p className="text-sm text-gray-600">KM Final: {vehicle.km_final}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="outline" className="border-green-500 text-green-700">
                            Na Garagem
                          </Badge>
                          <Badge variant="default" className="bg-blue-500">
                            {Math.floor(vehicle.dias_na_garagem)} dias
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-sm text-gray-700 mb-2">
                          <strong>Informações do Checklist:</strong>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p><strong>Data de Entrada:</strong> {new Date(vehicle.entry_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                          <p><strong>Dias Parado:</strong> {Math.floor(vehicle.dias_na_garagem)} dias</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="w-full">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalhes do Checklist
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <Car className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum veículo na garagem</h3>
                    <p className="text-sm text-gray-600">Todos os veículos estão em operação</p>
                  </CardContent>
                </Card>
              )}
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
              className={`text-white relative ${
                pendingFuelCardRequests > 0 
                  ? 'bg-orange-500 hover:bg-orange-600 animate-pulse' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
              onClick={() => window.open('/fuel-cards?tab=linehaul&mode=linehaul', '_blank')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Solicitações de Cartão
              {pendingFuelCardRequests > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-bounce">
                  {pendingFuelCardRequests}
                </span>
              )}
            </Button>
            <Button 
              className="bg-green-500 hover:bg-green-600 text-white"
              onClick={() => setShowRoutes(true)}
            >
              <Route className="h-4 w-4 mr-2" />
              Gerenciar Rotas ({stats.totalRoutes})
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
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
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
          <Card className="bg-white/80 backdrop-blur-sm border-orange-200">
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
          <Card className="bg-white/80 backdrop-blur-sm border-green-200">
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
              
              {/* Lista de veículos na garagem */}
              {stats.garageStats.data && stats.garageStats.data.length > 0 ? (
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {stats.garageStats.data.map((vehicle: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-200">
                      <div className="flex items-center">
                        <Car className="h-4 w-4 mr-2 text-green-600" />
                        <span className="font-semibold text-sm">{vehicle.plate}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {Math.floor(vehicle.dias_na_garagem)} dias
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm mb-4">
                  Nenhum veículo na garagem
                </div>
              )}

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
                  onClick={() => handleCardAction('gerenciar-garagem')}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Gerenciar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Acesso para Motoristas */}
          <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
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
              <Button 
                className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                onClick={() => window.open('/app/system/driver-access', '_blank')}
              >
                Acessar Interface do Motorista
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Seção inferior com rotas e nova rota */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rotas Cadastradas */}
          <Card className="bg-white/80 backdrop-blur-sm border-green-200">
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
                  <span className="text-2xl font-bold text-green-600">{routes.length}</span>
                </div>
                {routes.length > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Menor distância</span>
                      <span className="text-sm font-medium">
                        {Math.min(...routes.map(r => r.km_total))} km
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Maior distância</span>
                      <span className="text-sm font-medium">
                        {Math.max(...routes.map(r => r.km_total))} km
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Distância média</span>
                      <span className="text-sm font-medium">
                        {Math.round(routes.reduce((acc, r) => acc + r.km_total, 0) / routes.length)} km
                      </span>
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={() => setShowRoutesList(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Rotas
                </Button>
                <Button 
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => setShowNewRoute(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Rota
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Operações Line Haul */}
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-blue-700">
                <Truck className="h-5 w-5 mr-2" />
                Operações Line Haul
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Rotas em Andamento</span>
                  <span className="text-2xl font-bold text-blue-600">{operationsData.filter(op => op.status === 'em_andamento' || op.status === 'programada').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Finalizadas</span>
                  <span className="text-sm font-medium text-green-600">{operationsData.filter(op => op.status === 'finalizada').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Canceladas</span>
                  <span className="text-sm font-medium text-orange-600">{operationsData.filter(op => op.status === 'cancelada_cliente').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">No Show</span>
                  <span className="text-sm font-medium text-red-600">{operationsData.filter(op => op.status === 'no_show').length}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={() => setShowOperationsManagement(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Operações
                </Button>
                <Button 
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => setShowNewOperation(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Operação
                </Button>
              </div>
              <Button 
                className="w-full mt-2 bg-purple-500 hover:bg-purple-600 text-white"
                onClick={() => setShowImportDialog(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar Excel
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Executivo */}
        <LineHaulExecutiveDashboard />
        </>
        )}


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

        {/* Dialog para Ver Rotas */}
        <Dialog open={showRoutesList} onOpenChange={setShowRoutesList}>
          <DialogContent className="sm:max-w-[900px] max-h-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center text-blue-700">
                <Route className="h-5 w-5 mr-2" />
                Rotas Cadastradas
              </DialogTitle>
              <DialogDescription>
                Visualize todas as rotas cadastradas no sistema ({routes.length} rotas)
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3 overflow-y-auto max-h-[400px]">
              {routes.length > 0 ? (
                routes.map((route) => (
                  <Card key={route.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {route.nome_ponto_a} → {route.nome_ponto_b}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Distância:</span> {route.km_total} km
                        </p>
                        <div className="flex gap-4 mt-2">
                          <p className="text-xs text-blue-600">
                            <span className="font-medium">Carreta:</span> ~{Math.round(route.km_total / 2.5)} litros
                          </p>
                          <p className="text-xs text-green-600">
                            <span className="font-medium">Truck:</span> ~{Math.round(route.km_total / 4)} litros
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-yellow-50 hover:bg-yellow-100 border-yellow-300"
                          onClick={() => {
                            setEditingRoute(route);
                            setNewRoute({
                              codigo_origem: route.codigo_origem || '',
                              codigo_destino: route.codigo_destino || '',
                              nome_ponto_a: route.nome_ponto_a,
                              nome_ponto_b: route.nome_ponto_b,
                              km_total: route.km_total,
                              observacoes: route.observacoes || ''
                            });
                            setShowRoutesList(false);
                            setShowNewRoute(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
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
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <Route className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma rota cadastrada</h3>
                  <p className="text-gray-500">Comece cadastrando uma nova rota</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRoutesList(false)}>
                Fechar
              </Button>
              <Button 
                onClick={() => {
                  setShowRoutesList(false);
                  setShowNewRoute(true);
                }}
                className="bg-green-500 hover:bg-green-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Rota
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para Nova Rota */}
        <Dialog open={showNewRoute} onOpenChange={setShowNewRoute}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center text-green-700">
                {editingRoute ? (
                  <>
                    <Edit className="h-5 w-5 mr-2" />
                    Editar Rota
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2" />
                    Cadastrar Nova Rota
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                Preencha origem e destino - a distância será calculada automaticamente via Google Maps
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ponto_a">Ponto de Origem *</Label>
                  <Input
                    id="ponto_a"
                    placeholder="Ex: São Paulo, SP"
                    value={newRoute.nome_ponto_a}
                    onChange={(e) => setNewRoute(prev => ({ ...prev, nome_ponto_a: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ponto_b">Ponto de Destino *</Label>
                  <Input
                    id="ponto_b"
                    placeholder="Ex: Rio de Janeiro, RJ"
                    value={newRoute.nome_ponto_b}
                    onChange={(e) => setNewRoute(prev => ({ ...prev, nome_ponto_b: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo_origem">Código Origem</Label>
                  <Combobox
                    options={ROUTE_CODES.map(rc => ({ value: rc.code, label: rc.full }))}
                    value={newRoute.codigo_origem}
                    onChange={(value) => {
                      const selected = ROUTE_CODES.find(rc => rc.code === value);
                      setNewRoute(prev => ({ 
                        ...prev, 
                        codigo_origem: value,
                        nome_ponto_a: selected ? selected.name.replace(/_/g, ' ') : prev.nome_ponto_a
                      }));
                    }}
                    placeholder="Selecione código de origem..."
                    searchPlaceholder="Buscar código..."
                    emptyMessage="Código não encontrado"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo_destino">Código Destino</Label>
                  <Combobox
                    options={ROUTE_CODES.map(rc => ({ value: rc.code, label: rc.full }))}
                    value={newRoute.codigo_destino}
                    onChange={(value) => {
                      const selected = ROUTE_CODES.find(rc => rc.code === value);
                      setNewRoute(prev => ({ 
                        ...prev, 
                        codigo_destino: value,
                        nome_ponto_b: selected ? selected.name.replace(/_/g, ' ') : prev.nome_ponto_b
                      }));
                    }}
                    placeholder="Selecione código de destino..."
                    searchPlaceholder="Buscar código..."
                    emptyMessage="Código não encontrado"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                Selecione os códigos pré-cadastrados (usado para importação em massa)
              </p>
              <div className="space-y-2">
                <Label htmlFor="km_total">Distância Total (km) *</Label>
                <div className="relative">
                  <Input
                    id="km_total"
                    type="number"
                    placeholder="Será calculado automaticamente"
                    value={newRoute.km_total || ''}
                    readOnly
                    className="bg-gray-50"
                  />
                  {isCalculatingDistance && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
                  )}
                </div>
                {distanceStatus && (
                  <p className={`text-xs mt-1 ${
                    distanceStatus.includes('Erro') || distanceStatus.includes('Não foi possível') 
                      ? 'text-red-600' 
                      : distanceStatus.includes('Consultando') 
                        ? 'text-blue-600' 
                        : 'text-green-600'
                  }`}>
                    {distanceStatus}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <textarea
                  id="observacoes"
                  className="w-full p-2 border border-gray-300 rounded-md resize-none"
                  rows={3}
                  placeholder="Informações adicionais sobre a rota..."
                  value={newRoute.observacoes}
                  onChange={(e) => setNewRoute(prev => ({ ...prev, observacoes: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowNewRoute(false);
                setEditingRoute(null);
                setNewRoute({
                  codigo_origem: '',
                  codigo_destino: '',
                  nome_ponto_a: '',
                  nome_ponto_b: '',
                  km_total: 0,
                  observacoes: ''
                });
              }}>
                Cancelar
              </Button>
              <Button 
                onClick={editingRoute ? handleUpdateRoute : handleCreateRoute}
                className="bg-green-500 hover:bg-green-600"
                disabled={!newRoute.nome_ponto_a || !newRoute.nome_ponto_b || !newRoute.km_total}
              >
                {editingRoute ? (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Rota
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para Gestão de Operações */}
        <Dialog open={showOperationsManagement} onOpenChange={setShowOperationsManagement}>
          <DialogContent className="sm:max-w-[1000px] max-h-[700px]">
            <DialogHeader>
              <DialogTitle className="flex items-center text-blue-700">
                <Truck className="h-5 w-5 mr-2" />
                Gestão de Operações Line Haul
              </DialogTitle>
              <DialogDescription>
                Monitore e gerencie todas as operações de Line Haul ({operationsData.length} operações)
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 overflow-y-auto max-h-[500px]">
              {operationsData.length > 0 ? (
                <div className="grid gap-4">
                  {operationsData.map((operation, index) => (
                    <Card key={index} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {operation.motorista_nome || 'Motorista Não Informado'}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              operation.status === 'finalizada' ? 'bg-green-100 text-green-800' :
                              operation.status === 'em_andamento' ? 'bg-blue-100 text-blue-800' :
                              operation.status === 'cancelada_cliente' ? 'bg-orange-100 text-orange-800' :
                              operation.status === 'no_show' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {operation.status === 'finalizada' ? 'Finalizada' :
                               operation.status === 'em_andamento' ? 'Em Andamento' :
                               operation.status === 'cancelada_cliente' ? 'Cancelada pelo Cliente' :
                               operation.status === 'no_show' ? 'No Show' : 'Programada'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><span className="font-medium">Tipo:</span> {operation.tipo_veiculo === 'truck' ? 'Truck' : 'Cavalo Mecânico'}</p>
                            {operation.tipo_veiculo === 'truck' && operation.placa_truck && (
                              <p><span className="font-medium">Placa Truck:</span> {operation.placa_truck}</p>
                            )}
                            {operation.tipo_veiculo === 'cavalo_mecanico' && (
                              <>
                                {operation.placa_cavalo && <p><span className="font-medium">Cavalo:</span> {operation.placa_cavalo}</p>}
                                {operation.placa_carreta_1 && <p><span className="font-medium">Carreta 1:</span> {operation.placa_carreta_1}</p>}
                                {operation.placa_carreta_2 && <p><span className="font-medium">Carreta 2:</span> {operation.placa_carreta_2}</p>}
                              </>
                            )}
                            <p><span className="font-medium">Rota:</span> {operation.rota_nome}</p>
                            <p><span className="font-medium">Data Início:</span> {formatBrazilianDate(operation.data_inicio)}</p>
                            {operation.status === 'no_show' && operation.justificativa_no_show && (
                              <p><span className="font-medium">Justificativa No Show:</span> {operation.justificativa_no_show}</p>
                            )}
                            {operation.observacoes && (
                              <p><span className="font-medium">Observações:</span> {operation.observacoes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedOperation(operation);
                              setShowOperationDetails(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Detalhes
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma operação cadastrada</h3>
                  <p className="text-gray-500">Comece criando uma nova operação Line Haul</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowOperationsManagement(false)}>
                Fechar
              </Button>
              <Button 
                onClick={() => {
                  setShowOperationsManagement(false);
                  setShowNewOperation(true);
                }}
                className="bg-green-500 hover:bg-green-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Operação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para Nova Operação */}
        <Dialog open={showNewOperation} onOpenChange={setShowNewOperation}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center text-green-700">
                <Plus className="h-5 w-5 mr-2" />
                Iniciar Nova Operação
              </DialogTitle>
              <DialogDescription>
                Configure uma nova operação de Line Haul
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="motorista_select">Motorista *</Label>
                  <Combobox
                    options={drivers.map(d => ({ value: d.id.toString(), label: d.nome }))}
                    value={newOperation.motorista_id > 0 ? newOperation.motorista_id.toString() : ""}
                    onChange={(value) => {
                      const motorista = drivers.find(d => d.id.toString() === value);
                      setNewOperation(prev => ({ 
                        ...prev, 
                        motorista_id: parseInt(value),
                        motorista_nome: motorista?.nome || ''
                      }));
                    }}
                    placeholder="Digite para buscar motorista..."
                    emptyMessage="Nenhum motorista encontrado"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo_veiculo">Tipo de Veículo *</Label>
                  <Select 
                    value={newOperation.tipo_veiculo} 
                    onValueChange={(value) => {
                      setNewOperation(prev => ({ 
                        ...prev, 
                        tipo_veiculo: value,
                        // Limpar campos quando mudar tipo
                        placa_truck: '',
                        placa_cavalo: '',
                        placa_carreta_1: '',
                        placa_carreta_2: ''
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="truck">Truck</SelectItem>
                      <SelectItem value="cavalo_mecanico">Cavalo Mecânico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Campos condicionais baseado no tipo de veículo */}
              {newOperation.tipo_veiculo === 'truck' && (
                <div className="space-y-2">
                  <Label htmlFor="placa_truck">Placa do Truck *</Label>
                  <Input
                    id="placa_truck"
                    placeholder="Ex: ABC-1234"
                    value={newOperation.placa_truck}
                    onChange={(e) => setNewOperation(prev => ({ ...prev, placa_truck: e.target.value.toUpperCase() }))}
                  />
                </div>
              )}
              
              {newOperation.tipo_veiculo === 'cavalo_mecanico' && (
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="placa_cavalo">Placa do Cavalo *</Label>
                      <Input
                        id="placa_cavalo"
                        placeholder="Ex: ABC-1234"
                        value={newOperation.placa_cavalo}
                        onChange={(e) => setNewOperation(prev => ({ ...prev, placa_cavalo: e.target.value.toUpperCase() }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="placa_carreta_1">Primeira Carreta *</Label>
                      <Input
                        id="placa_carreta_1"
                        placeholder="Ex: XYZ-5678"
                        value={newOperation.placa_carreta_1}
                        onChange={(e) => setNewOperation(prev => ({ ...prev, placa_carreta_1: e.target.value.toUpperCase() }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="placa_carreta_2">Segunda Carreta (Opcional)</Label>
                    <Input
                      id="placa_carreta_2"
                      placeholder="Ex: DEF-9012"
                      value={newOperation.placa_carreta_2}
                      onChange={(e) => setNewOperation(prev => ({ ...prev, placa_carreta_2: e.target.value.toUpperCase() }))}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="rota_select">Rota *</Label>
                <div className="relative">
                  <Input
                    id="rota_select"
                    type="text"
                    placeholder="Digite para buscar uma rota..."
                    value={routeSearchTerm}
                    onChange={(e) => {
                      setRouteSearchTerm(e.target.value);
                      setIsRouteDropdownOpen(true);
                    }}
                    onFocus={() => setIsRouteDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsRouteDropdownOpen(false), 200)}
                    className="w-full"
                  />
                  {newOperation.rota_id > 0 && !routeSearchTerm && (
                    <div className="absolute inset-0 flex items-center px-3 pointer-events-none bg-white border rounded-md">
                      <span className="text-sm truncate">
                        {routes.find(r => r.id === newOperation.rota_id)?.nome_ponto_a} → {routes.find(r => r.id === newOperation.rota_id)?.nome_ponto_b}
                      </span>
                    </div>
                  )}
                  {isRouteDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {routes.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 text-center">
                          Nenhuma rota disponível. Cadastre rotas primeiro.
                        </div>
                      ) : (
                        <>
                          {routes
                            .filter(route => {
                              const searchLower = routeSearchTerm.toLowerCase();
                              const routeText = `${route.nome_ponto_a} ${route.nome_ponto_b}`.toLowerCase();
                              return routeText.includes(searchLower);
                            })
                            .map((route) => (
                              <div
                                key={route.id}
                                className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                                  newOperation.rota_id === route.id ? 'bg-blue-100' : ''
                                }`}
                                onClick={() => {
                                  setNewOperation(prev => ({ 
                                    ...prev, 
                                    rota_id: route.id,
                                    rota_nome: `${route.nome_ponto_a} → ${route.nome_ponto_b}`
                                  }));
                                  setRouteSearchTerm('');
                                  setIsRouteDropdownOpen(false);
                                }}
                              >
                                <span className="text-sm">
                                  {route.nome_ponto_a} → {route.nome_ponto_b} ({route.km_total} km)
                                </span>
                              </div>
                            ))
                          }
                          {routes.filter(route => {
                            const searchLower = routeSearchTerm.toLowerCase();
                            const routeText = `${route.nome_ponto_a} ${route.nome_ponto_b}`.toLowerCase();
                            return routeText.includes(searchLower);
                          }).length === 0 && (
                            <div className="p-4 text-sm text-gray-500 text-center">
                              Nenhuma rota encontrada para "{routeSearchTerm}"
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
                {newOperation.rota_id > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Rota selecionada: {routes.find(r => r.id === newOperation.rota_id)?.nome_ponto_a} → {routes.find(r => r.id === newOperation.rota_id)?.nome_ponto_b}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data_inicio">Data de Início *</Label>
                  <Input
                    id="data_inicio"
                    type="date"
                    value={newOperation.data_inicio}
                    onChange={(e) => setNewOperation(prev => ({ ...prev, data_inicio: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select 
                    value={newOperation.status} 
                    onValueChange={(value) => {
                      setNewOperation(prev => ({ 
                        ...prev, 
                        status: value,
                        // Limpar justificativa se não for no_show
                        justificativa_no_show: value !== 'no_show' ? '' : prev.justificativa_no_show
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="finalizada">Finalizada</SelectItem>
                      <SelectItem value="cancelada_cliente">Cancelada pelo Cliente</SelectItem>
                      <SelectItem value="no_show">No Show</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Campo condicional para justificativa do No Show */}
              {newOperation.status === 'no_show' && (
                <div className="space-y-2">
                  <Label htmlFor="justificativa_no_show">Justificativa para No Show *</Label>
                  <textarea
                    id="justificativa_no_show"
                    className="w-full p-2 border border-gray-300 rounded-md resize-none"
                    rows={3}
                    placeholder="Explique o motivo do No Show..."
                    value={newOperation.justificativa_no_show}
                    onChange={(e) => setNewOperation(prev => ({ ...prev, justificativa_no_show: e.target.value }))}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="observacoes_op">Observações</Label>
                <textarea
                  id="observacoes_op"
                  className="w-full p-2 border border-gray-300 rounded-md resize-none"
                  rows={3}
                  placeholder="Informações adicionais sobre a operação..."
                  value={newOperation.observacoes}
                  onChange={(e) => setNewOperation(prev => ({ ...prev, observacoes: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewOperation(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateOperation}
                className="bg-green-500 hover:bg-green-600"
                disabled={
                  isLoading ||
                  !newOperation.motorista_id || 
                  !newOperation.rota_id || 
                  (newOperation.tipo_veiculo === 'truck' && !newOperation.placa_truck) ||
                  (newOperation.tipo_veiculo === 'cavalo_mecanico' && (!newOperation.placa_cavalo || !newOperation.placa_carreta_1)) ||
                  (newOperation.status === 'no_show' && !newOperation.justificativa_no_show.trim())
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Iniciar Operação
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para Detalhes da Operação com Cálculo de Combustível */}
        <Dialog open={showOperationDetails} onOpenChange={setShowOperationDetails}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center text-blue-700">
                <Eye className="h-5 w-5 mr-2" />
                Detalhes da Operação
              </DialogTitle>
              <DialogDescription>
                Informações completas da operação incluindo estimativas de consumo
              </DialogDescription>
            </DialogHeader>
            {selectedOperation && (() => {
              // Buscar a rota para obter km_total
              const rota = routes.find(r => r.id === selectedOperation.rota_id);
              const kmTotal = rota?.km_total || 0;
              
              // Calcular litros estimados baseado no tipo de veículo
              const consumoPorKm = selectedOperation.tipo_veiculo === 'truck' ? 4 : 2.5; // truck: 4km/l, carreta: 2.5km/l
              const litrosEstimados = kmTotal > 0 ? (kmTotal / consumoPorKm).toFixed(1) : '0.0';
              
              // Calcular valor estimado (preço médio do diesel R$ 5,80)
              const precoDiesel = 5.80;
              const valorEstimado = (parseFloat(litrosEstimados) * precoDiesel).toFixed(2);
              
              return (
                <div className="space-y-6 py-4">
                  {/* Informações do Motorista */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Informações do Motorista
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Nome:</span>
                        <p className="font-medium text-gray-900">{selectedOperation.motorista_nome}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">ID:</span>
                        <p className="font-medium text-gray-900">#{selectedOperation.motorista_id}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">CPF:</span>
                        <p className="font-medium text-gray-900">{selectedOperation.motorista_cpf || 'Não informado'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Código:</span>
                        <p className="font-medium text-gray-900">{selectedOperation.motorista_codigo || 'Não informado'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Informações do Veículo */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                      <Truck className="h-4 w-4 mr-2" />
                      Informações do Veículo
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-gray-600">Tipo:</span>
                          <p className="font-medium text-gray-900">
                            {selectedOperation.tipo_veiculo === 'truck' ? 'Truck' : 'Cavalo Mecânico'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Consumo Médio:</span>
                          <p className="font-medium text-gray-900">
                            {consumoPorKm} km/litro
                          </p>
                        </div>
                      </div>
                      
                      {selectedOperation.tipo_veiculo === 'truck' && selectedOperation.placa_truck && (
                        <div>
                          <span className="text-gray-600">Placa Truck:</span>
                          <p className="font-medium text-gray-900">{selectedOperation.placa_truck}</p>
                        </div>
                      )}
                      
                      {selectedOperation.tipo_veiculo === 'cavalo_mecanico' && (
                        <>
                          {selectedOperation.placa_cavalo && (
                            <div>
                              <span className="text-gray-600">Placa Cavalo:</span>
                              <p className="font-medium text-gray-900">{selectedOperation.placa_cavalo}</p>
                            </div>
                          )}
                          {selectedOperation.placa_carreta_1 && (
                            <div>
                              <span className="text-gray-600">Placa Carreta 1:</span>
                              <p className="font-medium text-gray-900">{selectedOperation.placa_carreta_1}</p>
                            </div>
                          )}
                          {selectedOperation.placa_carreta_2 && (
                            <div>
                              <span className="text-gray-600">Placa Carreta 2:</span>
                              <p className="font-medium text-gray-900">{selectedOperation.placa_carreta_2}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Informações da Rota e Cálculos */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-900 mb-3 flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Rota e Estimativas de Consumo
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-gray-600">Rota:</span>
                        <p className="font-medium text-gray-900">{selectedOperation.rota_nome}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-gray-600">Distância Total:</span>
                          <p className="font-medium text-gray-900">{kmTotal} km</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Data Início:</span>
                          <p className="font-medium text-gray-900">
                            {formatBrazilianDate(selectedOperation.data_inicio)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Cálculos de Combustível */}
                      <div className="border-t border-purple-200 pt-3 mt-3">
                        <h4 className="font-semibold text-purple-800 mb-2">📊 Estimativa de Combustível:</h4>
                        <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-md">
                          <div>
                            <span className="text-gray-600">Litros Estimados:</span>
                            <p className="text-xl font-bold text-blue-600">{litrosEstimados} L</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Valor Estimado:</span>
                            <p className="text-xl font-bold text-green-600">R$ {valorEstimado}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          * Baseado no consumo médio de {consumoPorKm} km/L e preço do diesel a R$ {precoDiesel.toFixed(2)}/L
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status e Observações */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Status e Observações</h3>
                      {!isEditingStatus && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsEditingStatus(true);
                            setNewStatus(selectedOperation.status);
                            setNoShowJustification(selectedOperation.justificativa_no_show || '');
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Alterar Status
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      {!isEditingStatus ? (
                        <div>
                          <span className="text-gray-600">Status Atual:</span>
                          <div className="mt-1">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              selectedOperation.status === 'finalizada' ? 'bg-green-100 text-green-800' :
                              selectedOperation.status === 'em_andamento' ? 'bg-blue-100 text-blue-800' :
                              selectedOperation.status === 'cancelada_cliente' ? 'bg-orange-100 text-orange-800' :
                              selectedOperation.status === 'no_show' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {selectedOperation.status === 'finalizada' ? 'Finalizada' :
                               selectedOperation.status === 'em_andamento' ? 'Em Andamento' :
                               selectedOperation.status === 'cancelada_cliente' ? 'Cancelada pelo Cliente' :
                               selectedOperation.status === 'no_show' ? 'No Show' : 'Programada'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 bg-white p-3 rounded-md border border-gray-200">
                          <div className="space-y-2">
                            <Label htmlFor="new_status">Novo Status *</Label>
                            <Select value={newStatus} onValueChange={setNewStatus}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o novo status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="programada">Programada</SelectItem>
                                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                                <SelectItem value="finalizada">Finalizada</SelectItem>
                                <SelectItem value="cancelada_cliente">Cancelada pelo Cliente</SelectItem>
                                <SelectItem value="no_show">No Show</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {newStatus === 'no_show' && (
                            <div className="space-y-2">
                              <Label htmlFor="no_show_justification">Justificativa No Show *</Label>
                              <textarea
                                id="no_show_justification"
                                className="w-full p-2 border border-gray-300 rounded-md resize-none"
                                rows={3}
                                placeholder="Explique o motivo do No Show..."
                                value={noShowJustification}
                                onChange={(e) => setNoShowJustification(e.target.value)}
                              />
                            </div>
                          )}

                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setIsEditingStatus(false);
                                setNewStatus('');
                                setNoShowJustification('');
                              }}
                              disabled={isUpdatingStatus}
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600"
                              onClick={handleUpdateOperationStatus}
                              disabled={isUpdatingStatus || !newStatus || (newStatus === 'no_show' && !noShowJustification.trim())}
                            >
                              {isUpdatingStatus ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Salvando...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Salvar Status
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {selectedOperation.status === 'no_show' && selectedOperation.justificativa_no_show && (
                        <div className="bg-red-50 p-3 rounded-md mt-2">
                          <span className="text-gray-600 font-medium">Justificativa No Show:</span>
                          <p className="text-red-800 mt-1">{selectedOperation.justificativa_no_show}</p>
                        </div>
                      )}
                      
                      {selectedOperation.observacoes && (
                        <div className="bg-blue-50 p-3 rounded-md mt-2">
                          <span className="text-gray-600 font-medium">Observações:</span>
                          <p className="text-gray-900 mt-1">{selectedOperation.observacoes}</p>
                        </div>
                      )}
                      
                      {!selectedOperation.observacoes && selectedOperation.status !== 'no_show' && (
                        <p className="text-gray-400 italic">Nenhuma observação registrada</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowOperationDetails(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Detalhes do Checklist */}
        <Dialog open={showChecklistDetails} onOpenChange={setShowChecklistDetails}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-blue-600" />
                Detalhes do Checklist
              </DialogTitle>
              <DialogDescription>
                Informações completas do checklist do motorista
              </DialogDescription>
            </DialogHeader>
            
            {selectedChecklist && (() => {
              const checklistItems = [
                { key: 'condicao_pneus', label: 'Condição dos Pneus', value: selectedChecklist.condicao_pneus },
                { key: 'condicao_luzes', label: 'Condição das Luzes', value: selectedChecklist.condicao_luzes },
                { key: 'condicao_freios', label: 'Condição dos Freios', value: selectedChecklist.condicao_freios },
                { key: 'condicao_parabrisa', label: 'Condição do Parabrisa', value: selectedChecklist.condicao_parabrisa },
                { key: 'nivel_oleo', label: 'Nível do Óleo', value: selectedChecklist.nivel_oleo },
                { key: 'nivel_agua', label: 'Nível da Água', value: selectedChecklist.nivel_agua },
                { key: 'estrutura_cavalo', label: 'Estrutura do Cavalo', value: selectedChecklist.estrutura_cavalo },
                { key: 'estrutura_carreta', label: 'Estrutura da Carreta', value: selectedChecklist.estrutura_carreta },
              ];
              
              const itensVerificados = checklistItems.filter(item => 
                item.value && item.value !== '' && item.value.toLowerCase() !== 'nao_verificado' && item.value.toLowerCase() !== 'não verificado'
              );
              const itensNaoVerificados = checklistItems.filter(item => 
                !item.value || item.value === '' || item.value.toLowerCase() === 'nao_verificado' || item.value.toLowerCase() === 'não verificado'
              );

              const formatCondition = (value: string) => {
                const conditions: Record<string, { text: string; color: string }> = {
                  'bom': { text: 'Bom', color: 'text-green-600 bg-green-50' },
                  'ok': { text: 'OK', color: 'text-green-600 bg-green-50' },
                  'regular': { text: 'Regular', color: 'text-yellow-600 bg-yellow-50' },
                  'ruim': { text: 'Ruim', color: 'text-red-600 bg-red-50' },
                  'critico': { text: 'Crítico', color: 'text-red-700 bg-red-100' },
                  'baixo': { text: 'Baixo', color: 'text-orange-600 bg-orange-50' },
                  'normal': { text: 'Normal', color: 'text-green-600 bg-green-50' },
                  'alto': { text: 'Alto', color: 'text-blue-600 bg-blue-50' },
                };
                const key = value?.toLowerCase() || '';
                return conditions[key] || { text: value, color: 'text-gray-600 bg-gray-50' };
              };

              return (
              <div className="space-y-6 py-4">
                {/* Informações do Motorista e Veículo */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Motorista</p>
                    <p className="font-semibold text-lg">{selectedChecklist.driver_name}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Placa do Veículo</p>
                    <p className="font-semibold text-lg">{selectedChecklist.vehicle_plate}</p>
                  </div>
                </div>

                {/* Status e Data */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <Badge 
                      variant={selectedChecklist.status === 'concluido' ? 'default' : 'secondary'}
                      className={selectedChecklist.status === 'concluido' ? 'bg-green-500' : 'bg-yellow-500'}
                    >
                      {selectedChecklist.status === 'concluido' ? 'Concluído' : 'Pendente'}
                    </Badge>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Data do Checklist</p>
                    <p className="font-semibold">{new Date(selectedChecklist.checklist_date).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                {/* KM Inicial e Final */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">KM Inicial</p>
                    <p className="font-semibold text-xl text-green-700">
                      {selectedChecklist.km_inicial ? selectedChecklist.km_inicial.toLocaleString('pt-BR') : 'Não informado'}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">KM Final</p>
                    <p className="font-semibold text-xl text-orange-700">
                      {selectedChecklist.km_final ? selectedChecklist.km_final.toLocaleString('pt-BR') : 'Não informado'}
                    </p>
                  </div>
                </div>

                {/* KM Rodados (se ambos disponíveis) */}
                {selectedChecklist.km_inicial && selectedChecklist.km_final && (
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-500 mb-1">KM Rodados</p>
                    <p className="font-bold text-2xl text-purple-700">
                      {(selectedChecklist.km_final - selectedChecklist.km_inicial).toLocaleString('pt-BR')} km
                    </p>
                  </div>
                )}

                {/* Itens Verificados */}
                {itensVerificados.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Itens Verificados ({itensVerificados.length})
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {itensVerificados.map((item) => {
                        const condition = formatCondition(item.value || '');
                        return (
                          <div key={item.key} className={`p-2 rounded ${condition.color}`}>
                            <span className="text-sm font-medium">{item.label}:</span>
                            <span className="ml-2 text-sm font-semibold">{condition.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Itens Não Verificados */}
                {itensNaoVerificados.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-red-600" />
                      Itens Não Verificados ({itensNaoVerificados.length})
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {itensNaoVerificados.map((item) => (
                        <div key={item.key} className="p-2 rounded bg-red-100 text-red-700">
                          <span className="text-sm">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Avarias Reportadas */}
                {selectedChecklist.avarias && selectedChecklist.avarias.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-yellow-600" />
                      Avarias Reportadas
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedChecklist.avarias.map((avaria, idx) => (
                        <li key={idx} className="text-sm text-yellow-800">{avaria}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Observações */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-blue-600" />
                    Observações do Motorista
                  </p>
                  {selectedChecklist.observations ? (
                    <p className="text-gray-800">{selectedChecklist.observations}</p>
                  ) : (
                    <p className="text-gray-400 italic">Nenhuma observação registrada</p>
                  )}
                </div>

                {/* Datas de Registro */}
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-gray-500 mb-2">Informações de Registro</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Criado em: </span>
                      <span className="font-medium">
                        {selectedChecklist.created_at ? new Date(selectedChecklist.created_at).toLocaleString('pt-BR') : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Atualizado em: </span>
                      <span className="font-medium">
                        {selectedChecklist.updated_at ? new Date(selectedChecklist.updated_at).toLocaleString('pt-BR') : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              );
            })()}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowChecklistDetails(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Ordem de Serviço */}
        <Dialog open={showWorkorderDialog} onOpenChange={setShowWorkorderDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Iniciar Ordem de Serviço</DialogTitle>
              <DialogDescription>
                {selectedMaintenanceForWorkorder && (
                  <span>
                    Veículo: {selectedMaintenanceForWorkorder.vehicle_plate} | 
                    Tipo: {selectedMaintenanceForWorkorder.maintenance_type}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Oficina */}
              <div className="space-y-2">
                <Label htmlFor="workshop">Oficina *</Label>
                <Select
                  value={workorderForm.workshopId}
                  onValueChange={(value) => {
                    const workshop = workshopsList.find(w => w.id.toString() === value);
                    setWorkorderForm(prev => ({
                      ...prev,
                      workshopId: value,
                      workshopName: workshop ? (workshop.nome_fantasia || workshop.razao_social) : ''
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma oficina..." />
                  </SelectTrigger>
                  <SelectContent>
                    {workshopsList.map((workshop) => (
                      <SelectItem key={workshop.id} value={workshop.id.toString()}>
                        {workshop.nome_fantasia || workshop.razao_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Campo alternativo para nome de oficina */}
                <div className="pt-2">
                  <Label htmlFor="workshopName">Ou informe o nome da oficina manualmente:</Label>
                  <Input
                    id="workshopName"
                    value={workorderForm.workshopName}
                    onChange={(e) => setWorkorderForm(prev => ({ ...prev, workshopName: e.target.value }))}
                    placeholder="Nome da oficina"
                  />
                </div>
              </div>

              {/* Descrição do Serviço */}
              <div className="space-y-2">
                <Label htmlFor="serviceDescription">Descrição do Serviço</Label>
                <textarea
                  id="serviceDescription"
                  className="w-full min-h-[80px] p-2 border rounded-md"
                  value={workorderForm.serviceDescription}
                  onChange={(e) => setWorkorderForm(prev => ({ ...prev, serviceDescription: e.target.value }))}
                  placeholder="Descreva o serviço realizado..."
                />
              </div>

              {/* Custos Fixos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="laborCost">Mão de Obra (R$)</Label>
                  <Input
                    id="laborCost"
                    type="number"
                    step="0.01"
                    value={workorderForm.laborCost}
                    onChange={(e) => setWorkorderForm(prev => ({ ...prev, laborCost: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otherCosts">Outros (R$)</Label>
                  <Input
                    id="otherCosts"
                    type="number"
                    step="0.01"
                    value={workorderForm.otherCosts}
                    onChange={(e) => setWorkorderForm(prev => ({ ...prev, otherCosts: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Peças - Lista Dinâmica */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Peças Utilizadas</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addPart}
                    className="h-8"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Peça
                  </Button>
                </div>
                
                {partsList.length > 0 ? (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-md p-2">
                    {partsList.map((part, index) => (
                      <div key={index} className="grid grid-cols-[1fr_120px_40px] gap-2 items-center bg-gray-50 p-2 rounded">
                        <Input
                          placeholder="Nome da peça"
                          value={part.name}
                          onChange={(e) => updatePart(index, 'name', e.target.value)}
                          className="h-9"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Valor"
                          value={part.value}
                          onChange={(e) => updatePart(index, 'value', e.target.value)}
                          className="h-9"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removePart(index)}
                          className="h-9 w-9 p-0 hover:bg-red-100 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic p-2 border rounded-md text-center">
                    Nenhuma peça adicionada. Clique em "Adicionar Peça" para incluir.
                  </div>
                )}
                
                {/* Total de Peças */}
                {partsList.length > 0 && (
                  <div className="flex justify-between items-center bg-blue-50 p-2 rounded-md">
                    <span className="text-sm font-medium">Total em Peças:</span>
                    <span className="text-lg font-bold text-blue-700">
                      R$ {calculatePartsCost().toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Total Geral */}
              <div className="p-3 bg-green-50 rounded-md border-2 border-green-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">Total Geral:</span>
                  <span className="text-2xl font-bold text-green-700">
                    R$ {(
                      parseFloat(workorderForm.laborCost || '0') +
                      calculatePartsCost() +
                      parseFloat(workorderForm.otherCosts || '0')
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Informações Adicionais */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="technicianName">Técnico/Mecânico</Label>
                  <Input
                    id="technicianName"
                    value={workorderForm.technicianName}
                    onChange={(e) => setWorkorderForm(prev => ({ ...prev, technicianName: e.target.value }))}
                    placeholder="Nome do técnico"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Nº Nota Fiscal</Label>
                  <Input
                    id="invoiceNumber"
                    value={workorderForm.invoiceNumber}
                    onChange={(e) => setWorkorderForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    placeholder="Número da NF"
                  />
                </div>
              </div>

              {/* Previsão de Conclusão */}
              <div className="space-y-2">
                <Label htmlFor="expectedCompletionAt">Previsão de Conclusão</Label>
                <Input
                  id="expectedCompletionAt"
                  type="datetime-local"
                  value={workorderForm.expectedCompletionAt}
                  onChange={(e) => setWorkorderForm(prev => ({ ...prev, expectedCompletionAt: e.target.value }))}
                />
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <textarea
                  id="notes"
                  className="w-full min-h-[60px] p-2 border rounded-md"
                  value={workorderForm.notes}
                  onChange={(e) => setWorkorderForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observações adicionais..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowWorkorderDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitWorkorder} className="bg-blue-500 hover:bg-blue-600">
                Iniciar Manutenção
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para Importação em Massa */}
        <Dialog open={showImportDialog} onOpenChange={(open) => {
          setShowImportDialog(open);
          if (!open) handleClearImport();
        }}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center text-purple-700">
                <FileSpreadsheet className="h-5 w-5 mr-2" />
                Importar Operações em Massa
              </DialogTitle>
              <DialogDescription>
                Importe múltiplas operações de um arquivo Excel (.xlsx)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Instruções do formato */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Formato esperado da planilha:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li><strong>Driver ID:</strong> [CODIGO]Nome do Motorista</li>
                  <li><strong>Vehicle (tipo):</strong> CARRETA ou TRUCK</li>
                  <li><strong>Vehicle Plate:</strong> Placa (duas separadas por vírgula se carreta)</li>
                  <li><strong>Station:</strong> [CODIGO]Nome da Origem</li>
                  <li><strong>DESTINO:</strong> [CODIGO]Nome do Destino</li>
                  <li><strong>STA:</strong> Data/hora de carregamento</li>
                  <li><strong>ATA:</strong> Data/hora de fim</li>
                </ul>
              </div>

              {/* Seletor de arquivo */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelFileSelect}
                  className="hidden"
                  id="excel-upload"
                />
                <label htmlFor="excel-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">
                    {importFile ? (
                      <span className="text-green-600 font-medium">{importFile.name}</span>
                    ) : (
                      "Clique para selecionar um arquivo Excel"
                    )}
                  </p>
                </label>
              </div>

              {/* Verificação prévia - Motoristas e Rotas não encontrados */}
              {isVerifying && (
                <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                  <Loader2 className="h-5 w-5 animate-spin mr-2 text-blue-500" />
                  <span className="text-gray-600">Verificando motoristas e rotas...</span>
                </div>
              )}

              {verifyResults && !importResults && (
                <div className="space-y-3">
                  {/* Resumo da verificação */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-600 font-medium">MOTORISTAS</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-green-600 font-bold">{verifyResults.summary?.driversOk || 0} cadastrados</span>
                        <span className="text-orange-600 font-bold">{verifyResults.summary?.driversNew || 0} novos</span>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <p className="text-xs text-purple-600 font-medium">ROTAS</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-green-600 font-bold">{verifyResults.summary?.routesOk || 0} cadastradas</span>
                        <span className="text-orange-600 font-bold">{verifyResults.summary?.routesNew || 0} novas</span>
                      </div>
                    </div>
                  </div>

                  {/* Motoristas não encontrados */}
                  {verifyResults.driversNotFound?.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="flex items-center text-orange-700 mb-2">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        <span className="font-medium">{verifyResults.driversNotFound.length} motorista(s) NÃO cadastrado(s):</span>
                      </div>
                      <div className="max-h-[120px] overflow-y-auto">
                        <ul className="text-sm text-orange-600 ml-7 space-y-1">
                          {verifyResults.driversNotFound.map((d: any, i: number) => (
                            <li key={i} className="flex items-center">
                              <span className="bg-orange-100 px-2 py-0.5 rounded text-xs mr-2 font-mono">[{d.codigo}]</span>
                              {d.nome}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <p className="text-xs text-orange-500 mt-2 ml-7">
                        ⚠️ Serão criados automaticamente ao importar
                      </p>
                    </div>
                  )}

                  {/* Rotas não encontradas */}
                  {verifyResults.routesNotFound?.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="flex items-center text-amber-700 mb-2">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        <span className="font-medium">{verifyResults.routesNotFound.length} rota(s) NÃO cadastrada(s):</span>
                      </div>
                      <div className="max-h-[120px] overflow-y-auto">
                        <ul className="text-sm text-amber-600 ml-7 space-y-1">
                          {verifyResults.routesNotFound.map((r: any, i: number) => (
                            <li key={i} className="flex items-center">
                              <span className="bg-amber-100 px-2 py-0.5 rounded text-xs mr-2 font-mono">
                                [{r.codigo_origem}] → [{r.codigo_destino}]
                              </span>
                              {r.origem_nome} → {r.destino_nome}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <p className="text-xs text-amber-500 mt-2 ml-7">
                        ⚠️ Serão criadas automaticamente ao importar (km = 0)
                      </p>
                    </div>
                  )}

                  {/* Tudo OK */}
                  {verifyResults.driversNotFound?.length === 0 && verifyResults.routesNotFound?.length === 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center text-green-700">
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        <span className="font-medium">Todos os motoristas e rotas já estão cadastrados!</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Preview das operações */}
              {importPreview.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800">
                    {importPreview.length} operações encontradas:
                  </h4>
                  <div className="max-h-[200px] overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="p-2 text-left">#</th>
                          <th className="p-2 text-left">Motorista</th>
                          <th className="p-2 text-left">Veículo</th>
                          <th className="p-2 text-left">Origem → Destino</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.slice(0, 10).map((op, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2">{idx + 1}</td>
                            <td className="p-2 truncate max-w-[150px]">{op.driverId}</td>
                            <td className="p-2">{op.vehicleType}</td>
                            <td className="p-2 truncate max-w-[200px]">
                              {op.station?.split(']')[1] || op.station} → {op.destino?.split(']')[1] || op.destino}
                            </td>
                          </tr>
                        ))}
                        {importPreview.length > 10 && (
                          <tr className="border-t bg-gray-50">
                            <td colSpan={4} className="p-2 text-center text-gray-500">
                              ... e mais {importPreview.length - 10} operações
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Resultados da importação */}
              {importResults && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Resultados da importação:</h4>
                  
                  {/* Sucesso */}
                  {importResults.success?.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center text-green-700">
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        <span className="font-medium">{importResults.success.length} operações importadas com sucesso</span>
                      </div>
                    </div>
                  )}

                  {/* Motoristas criados */}
                  {importResults.driversCreated?.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center text-blue-700 mb-2">
                        <User className="h-5 w-5 mr-2" />
                        <span className="font-medium">{importResults.driversCreated.length} novos motoristas criados:</span>
                      </div>
                      <ul className="text-sm text-blue-600 ml-7 space-y-1">
                        {importResults.driversCreated.map((d: any, i: number) => (
                          <li key={i} className="flex items-center">
                            <span className="bg-blue-100 px-2 py-0.5 rounded text-xs mr-2">[{d.codigo}]</span>
                            {d.nome}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Rotas criadas */}
                  {importResults.routesCreated?.length > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <div className="flex items-center text-purple-700 mb-2">
                        <Route className="h-5 w-5 mr-2" />
                        <span className="font-medium">{importResults.routesCreated.length} novas rotas criadas:</span>
                      </div>
                      <ul className="text-sm text-purple-600 ml-7 space-y-1">
                        {importResults.routesCreated.map((r: any, i: number) => (
                          <li key={i} className="flex items-center">
                            <span className="bg-purple-100 px-2 py-0.5 rounded text-xs mr-2">
                              [{r.codigo_origem}] → [{r.codigo_destino}]
                            </span>
                            {r.nome}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-purple-500 mt-2 ml-7">
                        As rotas foram adicionadas às Rotas Cadastradas (km = 0, edite para calcular distância)
                      </p>
                    </div>
                  )}

                  {/* Erros */}
                  {importResults.errors?.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center text-red-700 mb-2">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <span className="font-medium">{importResults.errors.length} erros encontrados:</span>
                      </div>
                      <ul className="text-sm text-red-600 max-h-[100px] overflow-y-auto ml-7">
                        {importResults.errors.map((e: any, i: number) => (
                          <li key={i}>Linha {e.row}: {e.error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowImportDialog(false);
                  handleClearImport();
                }}
              >
                Fechar
              </Button>
              {importPreview.length > 0 && !importResults && (
                <Button 
                  onClick={handleBulkImport}
                  disabled={isImporting}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Importar {importPreview.length} Operações
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default LineHaulPage;