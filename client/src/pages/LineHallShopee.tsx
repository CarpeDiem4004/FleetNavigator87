import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileEdit, Trash2, Search, FileCheck, Clock, Wrench as Tool, CreditCard } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Interface para Bases (Centros de Distribuição)
interface Base {
  id: number;
  name: string;
}

// Interface para Motoristas
interface Driver {
  id: number;
  nome: string;
  telefone?: string;
}

// Interface para Veículos
interface Vehicle {
  id: number;
  plate: string;
  model: string;
  vehicle_type: string;
  status: string;
}

// Interface para Viagens
interface Trip {
  id: number;
  data_viagem: string;
  cavalo_placa: string;
  carreta1_placa: string;
  carreta2_placa?: string;
  motorista_id: number;
  motorista_nome?: string;
  motorista_telefone?: string;
  base_origem_id: number;
  base_origem_nome?: string;
  base_destino_id: number;
  base_destino_nome?: string;
  horario_carregamento: string;
  horario_descarga?: string;
  km_inicial?: number;
  km_final?: number;
  checklist_status?: string;
  status: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

const tripStatusMap: Record<string, { label: string; color: string }> = {
  'programada': { label: 'Programada', color: 'bg-blue-100 text-blue-800' },
  'carregando': { label: 'Carregando', color: 'bg-amber-100 text-amber-800' },
  'aguardando_carga': { label: 'Aguardando Carga', color: 'bg-purple-100 text-purple-800' },
  'em_transito': { label: 'Em Trânsito', color: 'bg-green-100 text-green-800' },
  'finalizada': { label: 'Finalizada', color: 'bg-gray-100 text-gray-800' }
};

const checklistStatusMap: Record<string, { label: string; color: string }> = {
  'pendente': { label: 'Pendente', color: 'bg-red-100 text-red-800' },
  'iniciado': { label: 'Iniciado', color: 'bg-yellow-100 text-yellow-800' },
  'concluido': { label: 'Concluído', color: 'bg-green-100 text-green-800' }
};

const vehicleTypeLabels: Record<string, string> = {
  'cavalo_mecanico': 'Cavalo Mecânico',
  'carreta': 'Carreta',
  'van': 'Van',
  'utilitario': 'Utilitário'
};

const LineHallShopee: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('list');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [trips, setTrips] = useState<Trip[]>([]);
  
  // Estados para formulário
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [truckPlate, setTruckPlate] = useState<string | undefined>();
  const [trailer1Plate, setTrailer1Plate] = useState<string | undefined>();
  const [trailer2Plate, setTrailer2Plate] = useState<string | undefined>();
  const [driverId, setDriverId] = useState<string | undefined>();
  const [loadingBaseId, setLoadingBaseId] = useState<string | undefined>();
  const [unloadingBaseId, setUnloadingBaseId] = useState<string | undefined>();
  const [loadingTime, setLoadingTime] = useState('');
  const [unloadingTime, setUnloadingTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dados para selects
  const [bases, setBases] = useState<Base[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [cavaloVehicles, setCavaloVehicles] = useState<Vehicle[]>([]);
  const [carretaVehicles, setCarretaVehicles] = useState<Vehicle[]>([]);

  // Carregamento de dados - Viagens
  useEffect(() => {
    const fetchTrips = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('linehall_shopee')
          .select(`
            *,
            bases_origem:base_origem_id(id, name),
            bases_destino:base_destino_id(id, name),
            motoristas:motorista_id(id, nome, telefone)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Formatar os dados para incluir os nomes das bases e motorista
        const formattedData = data.map((item: any) => ({
          id: item.id,
          data_viagem: item.data_viagem,
          cavalo_placa: item.cavalo_placa,
          carreta1_placa: item.carreta1_placa,
          carreta2_placa: item.carreta2_placa,
          motorista_id: item.motorista_id,
          motorista_nome: item.motorista_nome || item.motoristas?.nome,
          motorista_telefone: item.motorista_telefone || item.motoristas?.telefone,
          base_origem_id: item.base_origem_id,
          base_origem_nome: item.bases_origem?.name,
          base_destino_id: item.base_destino_id,
          base_destino_nome: item.bases_destino?.name,
          horario_carregamento: item.horario_carregamento,
          horario_descarga: item.horario_descarga,
          km_inicial: item.km_inicial,
          km_final: item.km_final,
          checklist_status: item.checklist_status || 'pendente',
          status: item.status,
          observacoes: item.observacoes,
          created_at: item.created_at,
          updated_at: item.updated_at
        }));

        setTrips(formattedData);
      } catch (error) {
        console.error('Erro ao buscar viagens:', error);
        toast({
          title: 'Erro ao carregar viagens',
          description: error instanceof Error ? error.message : 'Erro desconhecido',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrips();
  }, [toast]);

  // Carregar bases
  useEffect(() => {
    const fetchBases = async () => {
      try {
        const { data, error } = await supabase.from('bases').select('id, name');
        if (error) throw error;
        setBases(data || []);
      } catch (error) {
        console.error('Erro ao buscar bases:', error);
        toast({
          title: 'Erro ao carregar bases',
          description: error instanceof Error ? error.message : 'Erro desconhecido',
          variant: 'destructive',
        });
      }
    };

    fetchBases();
  }, [toast]);

  // Carregar motoristas
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        // Simulando busca de motoristas - substitua pela tabela correta
        const { data, error } = await supabase
          .from('users')
          .select('id, name as nome')
          .eq('role', 'operador');
          
        if (error) throw error;
        
        const drivers: Driver[] = data.map((user: any) => ({
          id: user.id,
          nome: user.nome,
          telefone: ''
        }));
        
        setDrivers(drivers || []);
      } catch (error) {
        console.error('Erro ao buscar motoristas:', error);
        toast({
          title: 'Erro ao carregar motoristas',
          description: error instanceof Error ? error.message : 'Erro desconhecido',
          variant: 'destructive',
        });
      }
    };

    fetchDrivers();
  }, [toast]);

  // Carregar veículos
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        // Buscar cavalos mecânicos
        const { data: cavaloData, error: cavaloError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('vehicle_type', 'cavalo_mecanico');
          
        if (cavaloError) throw cavaloError;
        setCavaloVehicles(cavaloData || []);
        
        // Buscar carretas
        const { data: carretaData, error: carretaError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('vehicle_type', 'carreta');
          
        if (carretaError) throw carretaError;
        setCarretaVehicles(carretaData || []);
        
      } catch (error) {
        console.error('Erro ao buscar veículos:', error);
        toast({
          title: 'Erro ao carregar veículos',
          description: error instanceof Error ? error.message : 'Erro desconhecido',
          variant: 'destructive',
        });
      }
    };

    fetchVehicles();
  }, [toast]);

  // Filtrar viagens
  const filteredTrips = trips.filter(
    (trip) =>
      trip.cavalo_placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.carreta1_placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.motorista_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.base_origem_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.base_destino_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trip.observacoes && trip.observacoes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Função para formatar data
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  // Função para cadastrar nova viagem
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !truckPlate || !trailer1Plate || !driverId || !loadingBaseId || !unloadingBaseId || !loadingTime) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios para continuar.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const tripData = {
        data_viagem: format(date, 'yyyy-MM-dd'),
        cavalo_placa: truckPlate,
        carreta1_placa: trailer1Plate,
        carreta2_placa: trailer2Plate || null,
        motorista_id: parseInt(driverId),
        base_origem_id: parseInt(loadingBaseId),
        base_destino_id: parseInt(unloadingBaseId),
        horario_carregamento: loadingTime,
        horario_descarga: unloadingTime || null,
        status: 'programada',
        observacoes: notes,
        checklist_status: 'pendente',
      };

      const { data, error } = await supabase
        .from('linehall_shopee')
        .insert(tripData)
        .select();

      if (error) throw error;

      toast({
        title: 'Viagem cadastrada',
        description: 'A viagem foi cadastrada com sucesso.',
        variant: 'default',
      });

      // Limpar formulário
      setDate(new Date());
      setTruckPlate(undefined);
      setTrailer1Plate(undefined);
      setTrailer2Plate(undefined);
      setDriverId(undefined);
      setLoadingBaseId(undefined);
      setUnloadingBaseId(undefined);
      setLoadingTime('');
      setUnloadingTime('');
      setNotes('');
      
      // Atualizar lista e mudar para aba de lista
      // Precisamos buscar os dados relacionados para exibição completa
      const newTrip = data[0];
      const baseOrigem = bases.find(b => b.id === newTrip.base_origem_id);
      const baseDestino = bases.find(b => b.id === newTrip.base_destino_id);
      const motorista = drivers.find(d => d.id === newTrip.motorista_id);
      
      const formattedTrip: Trip = {
        ...newTrip,
        base_origem_nome: baseOrigem?.name,
        base_destino_nome: baseDestino?.name,
        motorista_nome: motorista?.nome,
        motorista_telefone: motorista?.telefone
      };
      
      setTrips([formattedTrip, ...trips]);
      setActiveTab('list');
      
    } catch (error) {
      console.error('Erro ao cadastrar viagem:', error);
      toast({
        title: 'Erro ao cadastrar viagem',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para excluir viagem
  const handleDeleteTrip = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta viagem? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('linehall_shopee')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setTrips(trips.filter(trip => trip.id !== id));
      
      toast({
        title: 'Viagem excluída',
        description: 'A viagem foi excluída com sucesso.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao excluir viagem:', error);
      toast({
        title: 'Erro ao excluir viagem',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  // Função para gerar link para checklist
  const generateChecklistLink = (tripId: number) => {
    // Link que o motorista usará para realizar o checklist
    return `${window.location.origin}/checklist/${tripId}`;
  };

  // Função para copiar link para a área de transferência
  const copyChecklistLink = (tripId: number) => {
    const link = generateChecklistLink(tripId);
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link copiado',
      description: 'Link do checklist copiado para a área de transferência.',
      variant: 'default',
    });
  };

  return (
    <MainLayoutSimple>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Line Hall Shopee</h1>
            <p className="text-gray-500">
              Gerenciamento de viagens e operações logísticas da Shopee
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">Lista de Viagens</TabsTrigger>
            <TabsTrigger value="add">Cadastrar Viagem</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-4">
            <div className="flex justify-between items-center">
              <div></div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar viagens..."
                  className="pl-8 w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : (
                  <Table>
                    <TableCaption>Lista de viagens para a Shopee</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Placas</TableHead>
                        <TableHead>Motorista</TableHead>
                        <TableHead>Origem → Destino</TableHead>
                        <TableHead>Horário</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Checklist</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTrips.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center">
                            Nenhuma viagem encontrada.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTrips.map((trip) => (
                          <TableRow key={trip.id}>
                            <TableCell className="font-medium">
                              {formatDate(trip.data_viagem)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-xs text-gray-500">Cavalo:</span>
                                <span>{trip.cavalo_placa}</span>
                                <span className="text-xs text-gray-500 mt-1">Carreta(s):</span>
                                <span>{trip.carreta1_placa}</span>
                                {trip.carreta2_placa && <span>{trip.carreta2_placa}</span>}
                              </div>
                            </TableCell>
                            <TableCell>{trip.motorista_nome}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <span className="truncate max-w-[120px]">{trip.base_origem_nome}</span>
                                <span className="mx-1">→</span>
                                <span className="truncate max-w-[120px]">{trip.base_destino_nome}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-gray-500" />
                                  <span className="text-sm">{trip.horario_carregamento}</span>
                                </div>
                                {trip.horario_descarga && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Clock className="h-3 w-3 text-gray-500" />
                                    <span className="text-sm">{trip.horario_descarga}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={tripStatusMap[trip.status]?.color || 'bg-gray-100'}>
                                {tripStatusMap[trip.status]?.label || trip.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={checklistStatusMap[trip.checklist_status || 'pendente']?.color || 'bg-gray-100'}>
                                {checklistStatusMap[trip.checklist_status || 'pendente']?.label || 'Pendente'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  title="Enviar Link do Checklist"
                                  onClick={() => copyChecklistLink(trip.id)}
                                >
                                  <FileCheck className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  title="Editar Viagem"
                                >
                                  <FileEdit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  title="Excluir Viagem"
                                  onClick={() => handleDeleteTrip(trip.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>Nova Viagem</CardTitle>
                <CardDescription>
                  Cadastre uma nova viagem para a Shopee
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  {/* Data da Viagem */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="trip_date">Data da Viagem *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                            id="trip_date"
                          >
                            {date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Seleção de Veículos */}
                  <div>
                    <h3 className="text-md font-medium mb-2">Informações dos Veículos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="truck">Cavalo Mecânico *</Label>
                        <Select value={truckPlate} onValueChange={setTruckPlate}>
                          <SelectTrigger id="truck">
                            <SelectValue placeholder="Selecione o cavalo" />
                          </SelectTrigger>
                          <SelectContent>
                            {cavaloVehicles.map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.plate}>{vehicle.plate} - {vehicle.model}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="trailer1">Carreta 1 *</Label>
                        <Select value={trailer1Plate} onValueChange={setTrailer1Plate}>
                          <SelectTrigger id="trailer1">
                            <SelectValue placeholder="Selecione a carreta" />
                          </SelectTrigger>
                          <SelectContent>
                            {carretaVehicles.map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.plate}>{vehicle.plate} - {vehicle.model}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="trailer2">Carreta 2 (Opcional)</Label>
                        <Select value={trailer2Plate} onValueChange={setTrailer2Plate}>
                          <SelectTrigger id="trailer2">
                            <SelectValue placeholder="Selecione a carreta" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Nenhuma</SelectItem>
                            {carretaVehicles.map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.plate}>{vehicle.plate} - {vehicle.model}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Motorista */}
                  <div>
                    <h3 className="text-md font-medium mb-2">Informações do Motorista</h3>
                    <div className="space-y-2">
                      <Label htmlFor="driver">Motorista *</Label>
                      <Select value={driverId} onValueChange={setDriverId}>
                        <SelectTrigger id="driver">
                          <SelectValue placeholder="Selecione o motorista" />
                        </SelectTrigger>
                        <SelectContent>
                          {drivers.map((driver) => (
                            <SelectItem key={driver.id} value={driver.id.toString()}>{driver.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Origem e Destino */}
                  <div>
                    <h3 className="text-md font-medium mb-2">Informações da Rota</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="origin">CD de Carregamento *</Label>
                        <Select value={loadingBaseId} onValueChange={setLoadingBaseId}>
                          <SelectTrigger id="origin">
                            <SelectValue placeholder="Selecione a origem" />
                          </SelectTrigger>
                          <SelectContent>
                            {bases.map((base) => (
                              <SelectItem key={base.id} value={base.id.toString()}>{base.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="destination">CD de Descarregamento *</Label>
                        <Select value={unloadingBaseId} onValueChange={setUnloadingBaseId}>
                          <SelectTrigger id="destination">
                            <SelectValue placeholder="Selecione o destino" />
                          </SelectTrigger>
                          <SelectContent>
                            {bases.map((base) => (
                              <SelectItem key={base.id} value={base.id.toString()}>{base.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Horários */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="loading_time">Horário de Carregamento *</Label>
                      <Input
                        id="loading_time"
                        type="time"
                        value={loadingTime}
                        onChange={(e) => setLoadingTime(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="unloading_time">Horário de Descarregamento (Previsto)</Label>
                      <Input
                        id="unloading_time"
                        type="time"
                        value={unloadingTime}
                        onChange={(e) => setUnloadingTime(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* Observações */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      placeholder="Adicione informações adicionais sobre a viagem..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </CardContent>
                
                <CardContent className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      // Limpar formulário
                      setDate(new Date());
                      setTruckPlate(undefined);
                      setTrailer1Plate(undefined);
                      setTrailer2Plate(undefined);
                      setDriverId(undefined);
                      setLoadingBaseId(undefined);
                      setUnloadingBaseId(undefined);
                      setLoadingTime('');
                      setUnloadingTime('');
                      setNotes('');
                    }}
                  >
                    Limpar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Cadastrando...' : 'Cadastrar Viagem'}
                  </Button>
                </CardContent>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayoutSimple>
  );
};

export default LineHallShopee;