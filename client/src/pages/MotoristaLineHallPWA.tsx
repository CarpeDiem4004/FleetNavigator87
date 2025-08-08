import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { pwaManager } from '@/utils/pwa-utils';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';
import PWAOfflineIndicator from '@/components/pwa/PWAOfflineIndicator';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Calendar,
  Play,
  CheckCircle,
  AlertCircle,
  Navigation,
  Search,
  ClipboardCheck,
  Fuel,
  Gauge,
  CheckSquare,
  XCircle,
  Camera,
  Upload,
  Save,
  RefreshCw,
  Smartphone,
  Download
} from 'lucide-react';

interface Trip {
  id: number;
  placa_cavalo: string;
  placa_carreta_1: string;
  placa_carreta_2?: string;
  motorista_nome: string;
  local_carregamento: string;
  local_descarregamento: string;
  data_viagem: string;
  horario_carregamento?: string;
  status_viagem: string;
  rota_selecionada?: string;
  km_total?: number;
  observacoes?: string;
}

interface ChecklistItem {
  id: string;
  description: string;
  status: 'pending' | 'ok' | 'problema';
  observations?: string;
  photo?: string;
}

interface Checklist {
  id?: number;
  trip_id: number;
  motorista_nome: string;
  placa_cavalo: string;
  km_inicial?: number;
  km_final?: number;
  status: 'em_andamento' | 'concluido';
  items: ChecklistItem[];
  created_at?: string;
  completed_at?: string;
}

export default function MotoristaLineHallPWA() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [motoristaName, setMotoristaName] = useState('');
  const [cpf, setCpf] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Estados para checklist
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [showChecklist, setShowChecklist] = useState(false);
  const [kmInicial, setKmInicial] = useState('');
  const [kmFinal, setKmFinal] = useState('');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    { id: '1', description: 'Verificar freios', status: 'pending' },
    { id: '2', description: 'Verificar pneus', status: 'pending' },
    { id: '3', description: 'Verificar óleo do motor', status: 'pending' },
    { id: '4', description: 'Verificar combustível', status: 'pending' },
    { id: '5', description: 'Verificar luzes e sinalização', status: 'pending' },
    { id: '6', description: 'Verificar documentação', status: 'pending' },
    { id: '7', description: 'Verificar estrutura do cavalo', status: 'pending' },
    { id: '8', description: 'Verificar estrutura da carreta', status: 'pending' },
  ]);

  const { toast } = useToast();

  useEffect(() => {
    // Initialize PWA features
    pwaManager.requestPushNotificationPermission();
    
    // Network status monitoring
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Conexão Restaurada",
        description: "Sincronizando dados...",
        duration: 3000
      });
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Modo Offline",
        description: "Trabalhando com dados locais",
        duration: 3000
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load saved data from localStorage
    loadSavedData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  const loadSavedData = () => {
    try {
      const savedTrip = localStorage.getItem('linehaul-current-trip');
      const savedChecklist = localStorage.getItem('linehaul-current-checklist');
      const savedMotorista = localStorage.getItem('linehaul-motorista-info');

      if (savedTrip) {
        setTrip(JSON.parse(savedTrip));
      }

      if (savedChecklist) {
        const parsedChecklist = JSON.parse(savedChecklist);
        setChecklist(parsedChecklist);
        setChecklistItems(parsedChecklist.items || checklistItems);
        setShowChecklist(true);
      }

      if (savedMotorista) {
        const parsedMotorista = JSON.parse(savedMotorista);
        setMotoristaName(parsedMotorista.nome || '');
        setCpf(parsedMotorista.cpf || '');
      }
    } catch (error) {
      console.error('Erro ao carregar dados salvos:', error);
    }
  };

  const saveDataLocally = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar dados localmente:', error);
    }
  };

  const syncOfflineData = async () => {
    if (!isOnline) return;

    try {
      await pwaManager.syncOfflineData();
      
      // Sync any pending checklists
      const pendingChecklists = localStorage.getItem('linehaul-pending-checklists');
      if (pendingChecklists) {
        const checklists = JSON.parse(pendingChecklists);
        for (const checklist of checklists) {
          await submitChecklistToServer(checklist);
        }
        localStorage.removeItem('linehaul-pending-checklists');
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
    }
  };

  const searchTrip = async () => {
    if (!motoristaName.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Digite seu nome para buscar a viagem",
        variant: "destructive",
        duration: 3000
      });
      return;
    }

    setSearchLoading(true);

    try {
      let tripData: Trip | null = null;

      if (isOnline) {
        // Online: fetch from API
        const response = await fetch(`/api/line-hall/trips/search?motorista=${encodeURIComponent(motoristaName)}`);
        if (response.ok) {
          const result = await response.json();
          tripData = result.data;
        }
      } else {
        // Offline: check localStorage
        const savedTrip = localStorage.getItem('linehaul-current-trip');
        if (savedTrip) {
          const parsedTrip = JSON.parse(savedTrip);
          if (parsedTrip.motorista_nome === motoristaName) {
            tripData = parsedTrip;
          }
        }
      }

      if (tripData) {
        setTrip(tripData);
        saveDataLocally('linehaul-current-trip', tripData);
        saveDataLocally('linehaul-motorista-info', { nome: motoristaName, cpf });
        
        toast({
          title: "Viagem encontrada!",
          description: `Viagem ${tripData.placa_cavalo} carregada`,
          duration: 3000
        });
      } else {
        toast({
          title: "Viagem não encontrada",
          description: isOnline ? "Nenhuma viagem ativa encontrada" : "Dados não disponíveis offline",
          variant: "destructive",
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Erro ao buscar viagem:', error);
      toast({
        title: "Erro na busca",
        description: "Não foi possível buscar a viagem",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const startChecklist = () => {
    if (!trip) return;

    const newChecklist: Checklist = {
      trip_id: trip.id,
      motorista_nome: trip.motorista_nome,
      placa_cavalo: trip.placa_cavalo,
      status: 'em_andamento',
      items: checklistItems,
      created_at: new Date().toISOString()
    };

    setChecklist(newChecklist);
    setShowChecklist(true);
    saveDataLocally('linehaul-current-checklist', newChecklist);

    toast({
      title: "Checklist iniciado",
      description: "Complete todos os itens antes de iniciar a viagem",
      duration: 3000
    });
  };

  const updateChecklistItem = (itemId: string, status: 'ok' | 'problema', observations?: string) => {
    const updatedItems = checklistItems.map(item =>
      item.id === itemId ? { ...item, status, observations } : item
    );
    
    setChecklistItems(updatedItems);

    if (checklist) {
      const updatedChecklist = { ...checklist, items: updatedItems };
      setChecklist(updatedChecklist);
      saveDataLocally('linehaul-current-checklist', updatedChecklist);
    }
  };

  const submitChecklistToServer = async (checklistData: Checklist) => {
    const response = await fetch('/api/line-hall/checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...checklistData,
        km_inicial: parseInt(kmInicial) || 0,
        km_final: parseInt(kmFinal) || 0
      })
    });

    if (!response.ok) {
      throw new Error('Falha ao enviar checklist');
    }

    return response.json();
  };

  const submitChecklist = async () => {
    if (!checklist) return;

    setUpdating(true);

    try {
      const completedChecklist = {
        ...checklist,
        km_inicial: parseInt(kmInicial) || 0,
        km_final: parseInt(kmFinal) || 0,
        status: 'concluido' as const,
        completed_at: new Date().toISOString(),
        items: checklistItems
      };

      if (isOnline) {
        // Online: submit immediately
        await submitChecklistToServer(completedChecklist);
        
        toast({
          title: "Checklist enviado!",
          description: "Checklist concluído com sucesso",
          duration: 3000
        });

        // Clear saved data
        localStorage.removeItem('linehaul-current-checklist');
      } else {
        // Offline: save for later sync
        const pendingChecklists = JSON.parse(localStorage.getItem('linehaul-pending-checklists') || '[]');
        pendingChecklists.push(completedChecklist);
        localStorage.setItem('linehaul-pending-checklists', JSON.stringify(pendingChecklists));

        toast({
          title: "Checklist salvo offline",
          description: "Será enviado quando houver conexão",
          duration: 3000
        });
      }

      setChecklist(completedChecklist);
      saveDataLocally('linehaul-current-checklist', completedChecklist);

    } catch (error) {
      console.error('Erro ao enviar checklist:', error);
      toast({
        title: "Erro ao enviar",
        description: "Checklist salvo localmente",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setUpdating(false);
    }
  };

  const getChecklistProgress = () => {
    const completed = checklistItems.filter(item => item.status !== 'pending').length;
    return Math.round((completed / checklistItems.length) * 100);
  };

  const canCompleteChecklist = () => {
    return checklistItems.every(item => item.status !== 'pending') && 
           kmInicial.trim() !== '' && 
           kmFinal.trim() !== '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      {/* PWA Components */}
      <PWAOfflineIndicator />
      <PWAInstallPrompt />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Line Haul</h1>
              <p className="text-sm text-gray-600">Portal do Motorista - PWA</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={isOnline ? "default" : "destructive"}>
              {isOnline ? "Online" : "Offline"}
            </Badge>
            {pwaManager.getInstallationStatus().isStandalone && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Smartphone className="h-3 w-3" />
                <span>App</span>
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Search Section */}
      {!trip && (
        <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-blue-600" />
              <span>Buscar Viagem</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="motorista">Nome do Motorista</Label>
                <Input
                  id="motorista"
                  placeholder="Digite seu nome completo"
                  value={motoristaName}
                  onChange={(e) => setMotoristaName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="cpf">CPF (opcional)</Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            
            <Button 
              onClick={searchTrip} 
              disabled={searchLoading || !motoristaName.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {searchLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar Viagem
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Trip Details */}
      {trip && (
        <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Truck className="h-5 w-5 text-blue-600" />
                <span>Viagem Ativa</span>
              </div>
              <Badge 
                variant={trip.status_viagem === 'ativa' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {trip.status_viagem}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Truck className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">Veículos</p>
                  <p className="text-sm text-gray-600">
                    {trip.placa_cavalo} + {trip.placa_carreta_1}
                    {trip.placa_carreta_2 && ` + ${trip.placa_carreta_2}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Navigation className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">Rota</p>
                  <p className="text-sm text-gray-600">
                    {trip.km_total ? `${trip.km_total} km` : 'Não informado'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">Origem</p>
                  <p className="text-sm text-gray-600">{trip.local_carregamento}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">Destino</p>
                  <p className="text-sm text-gray-600">{trip.local_descarregamento}</p>
                </div>
              </div>
            </div>

            {!showChecklist && (
              <Button 
                onClick={startChecklist}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Iniciar Checklist de Viagem
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Checklist Section */}
      {showChecklist && checklist && (
        <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ClipboardCheck className="h-5 w-5 text-green-600" />
                <span>Checklist de Viagem</span>
              </div>
              <Badge variant="outline">
                {getChecklistProgress()}% completo
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getChecklistProgress()}%` }}
              />
            </div>

            {/* KM Fields */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="km-inicial">KM Inicial</Label>
                <Input
                  id="km-inicial"
                  type="number"
                  placeholder="0"
                  value={kmInicial}
                  onChange={(e) => setKmInicial(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="km-final">KM Final</Label>
                <Input
                  id="km-final"
                  type="number"
                  placeholder="0"
                  value={kmFinal}
                  onChange={(e) => setKmFinal(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-3">
              {checklistItems.map((item) => (
                <Card key={item.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-sm">{item.description}</p>
                      <Badge 
                        variant={
                          item.status === 'ok' ? 'default' : 
                          item.status === 'problema' ? 'destructive' : 
                          'secondary'
                        }
                        className="text-xs"
                      >
                        {item.status === 'pending' ? 'Pendente' : 
                         item.status === 'ok' ? 'OK' : 'Problema'}
                      </Badge>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant={item.status === 'ok' ? 'default' : 'outline'}
                        onClick={() => updateChecklistItem(item.id, 'ok')}
                        className="flex-1"
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        OK
                      </Button>
                      
                      <Button
                        size="sm"
                        variant={item.status === 'problema' ? 'destructive' : 'outline'}
                        onClick={() => updateChecklistItem(item.id, 'problema')}
                        className="flex-1"
                      >
                        <XCircle className="mr-1 h-3 w-3" />
                        Problema
                      </Button>
                    </div>

                    {item.status === 'problema' && (
                      <div className="mt-3">
                        <Textarea
                          placeholder="Descreva o problema encontrado..."
                          value={item.observations || ''}
                          onChange={(e) => updateChecklistItem(item.id, 'problema', e.target.value)}
                          className="text-sm"
                          rows={2}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Submit Button */}
            <Button
              onClick={submitChecklist}
              disabled={!canCompleteChecklist() || updating}
              className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
            >
              {updating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {isOnline ? 'Enviando...' : 'Salvando...'}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isOnline ? 'Concluir Checklist' : 'Salvar Offline'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Offline Features Info */}
      {!isOnline && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-orange-800">
              <Download className="h-4 w-4" />
              <p className="text-sm">
                <strong>Modo Offline:</strong> Seus dados estão sendo salvos localmente 
                e serão sincronizados automaticamente quando você se conectar à internet.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}