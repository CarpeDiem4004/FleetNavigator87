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
import { Loader2, Plus, RefreshCcw, Search, Edit, Trash2, Truck, FileText, CheckSquare, Wrench, AlertCircle, Car, UserPlus, MapPin } from 'lucide-react';
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
  data_fim?: string | null;
  observacoes?: string | null;
  created_at: string;
  updated_at: string;
}

const statusLabels: Record<string, string> = {
  'Concluída': 'bg-green-100 text-green-800',
  'No Show': 'bg-red-100 text-red-800',
  'Cancelada pelo Cliente': 'bg-orange-100 text-orange-800'
};

export default function LineHallShopeePage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [trips, setTrips] = useState<LineHallTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para gerenciar rotas
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [showRoutes, setShowRoutes] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [currentRoute, setCurrentRoute] = useState({
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
    observacoes: ''
  });

  useEffect(() => {
    fetchTrips();
    fetchDriverStats();
    fetchRoutesData();
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
      <div className="space-y-6">
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
            <Button variant="outline" onClick={fetchTrips} className="flex items-center">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Dialog open={isCreatingRoute} onOpenChange={setIsCreatingRoute}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center">
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Rota
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Cadastrar Nova Rota</DialogTitle>
                  <DialogDescription>
                    Cadastre uma nova rota do Line Hall Shopee
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome_ponto_a">Ponto A (Origem) *</Label>
                    <Input
                      id="nome_ponto_a"
                      placeholder="Ex: São Paulo - SP"
                      value={currentRoute.nome_ponto_a}
                      onChange={(e) => setCurrentRoute(prev => ({ ...prev, nome_ponto_a: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nome_ponto_b">Ponto B (Destino) *</Label>
                    <Input
                      id="nome_ponto_b"
                      placeholder="Ex: Rio de Janeiro - RJ"
                      value={currentRoute.nome_ponto_b}
                      onChange={(e) => setCurrentRoute(prev => ({ ...prev, nome_ponto_b: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="km_total">Distância Total (KM) *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="km_total"
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
                  <Button type="button" variant="outline" onClick={() => setIsCreatingRoute(false)}>Cancelar</Button>
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
                  <Button type="button" onClick={handleCreateRoute}>Cadastrar Rota</Button>
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
                    Preencha os dados da viagem do Line Hall Shopee
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="placa_cavalo">Placa do Cavalo *</Label>
                      <Input
                        id="placa_cavalo"
                        name="placa_cavalo"
                        placeholder="ABC1234"
                        value={currentTrip.placa_cavalo || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="placa_carreta_1">Placa da Carreta 1 *</Label>
                      <Input
                        id="placa_carreta_1"
                        name="placa_carreta_1"
                        placeholder="XYZ5678"
                        value={currentTrip.placa_carreta_1 || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="placa_carreta_2">Placa da Carreta 2</Label>
                      <Input
                        id="placa_carreta_2"
                        name="placa_carreta_2"
                        placeholder="DEF9012"
                        value={currentTrip.placa_carreta_2 || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="motorista_nome">Nome do Motorista *</Label>
                      <Input
                        id="motorista_nome"
                        name="motorista_nome"
                        placeholder="Nome do Motorista"
                        value={currentTrip.motorista_nome || ''}
                        onChange={handleInputChange}
                      />
                      <Input
                        type="hidden"
                        name="motorista_id"
                        value={currentTrip.motorista_id || 0}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="local_carregamento">Local Carregamento *</Label>
                      <Input
                        id="local_carregamento"
                        name="local_carregamento"
                        placeholder="Local de Carregamento"
                        value={currentTrip.local_carregamento || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="local_descarregamento">Local Descarregamento *</Label>
                      <Input
                        id="local_descarregamento"
                        name="local_descarregamento"
                        placeholder="Local de Descarregamento"
                        value={currentTrip.local_descarregamento || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
        
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                
                <Button variant="outline" size="sm" onClick={fetchDriverStats}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Atualizar
                </Button>
              </div>
            </CardContent>
          </Card>
          
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

          {/* Card de Acesso */}
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
                    {window.location.origin}/line-hall-driver
                  </p>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => window.open('/line-hall-driver', '_blank')}>
                  Acessar Interface do Motorista
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de rotas cadastradas - só exibe quando showRoutes for true */}
        {showRoutes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <MapPin className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                Rotas Cadastradas
              </CardTitle>
              <CardDescription>
                Rotas disponíveis para as viagens do Line Hall Shopee
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
              Viagens Line Hall Shopee
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
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Viagem</DialogTitle>
            <DialogDescription>
              Atualize os dados da viagem do Line Hall Shopee
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
    </MainLayoutSimple>
  );
}