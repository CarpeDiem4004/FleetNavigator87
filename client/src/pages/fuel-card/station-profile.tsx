import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
  CheckCircle2,
  Clock,
  CreditCard,
  Filter,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  TrendingUp,
  Truck,
  User,
  XCircle,
  Fuel,
  PlusCircle
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { FuelStation, StationTank } from "@/types/fuel-stations"; 
import { Progress } from "@/components/ui/progress";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Definindo os tipos para o sistema
type FuelCardSolicitation = {
  id: number;
  placa: string;
  km: number;
  tipo_cartao: string;
  provedor_cartao: string;
  numero_cartao?: string;
  motorista: string;
  observacoes?: string;
  status: 'pendente' | 'atendido' | 'rejeitado';
  data_solicitacao: string;
  data_atendimento?: string;
  atendido_por?: string;
  valor_solicitado?: number;
  base?: string;
  id_rota?: string;
  posto_id?: number;
};

// Por enquanto vamos simular esses dados, depois buscaremos da API
const mockStations: FuelStation[] = [
  {
    id: 1,
    nome: "Posto ABC - Matriz",
    endereco: "Av. Brasil, 1500, São Paulo - SP",
    telefone: "(11) 3456-7890",
    responsavel: "Carlos Silva",
    status: "ativo",
    capacidade_total: 45000,
    volume_atual: 32500,
    ultima_medicao: "2025-05-19T10:30:00Z",
    tipo: "próprio",
    latitude: -23.5505,
    longitude: -46.6333
  },
  {
    id: 2,
    nome: "Posto ABC - Filial Campinas",
    endereco: "Rodovia Anhanguera, KM 95, Campinas - SP",
    telefone: "(19) 3456-7890",
    responsavel: "Ana Oliveira",
    status: "ativo",
    capacidade_total: 30000,
    volume_atual: 18500,
    ultima_medicao: "2025-05-19T09:15:00Z",
    tipo: "próprio",
    latitude: -22.9064,
    longitude: -47.0616
  },
  {
    id: 3,
    nome: "Posto Parceiro Petrobras",
    endereco: "Rodovia Presidente Dutra, KM 230, Guarulhos - SP",
    telefone: "(11) 2456-7890",
    responsavel: "Roberto Mendes",
    status: "parceiro",
    capacidade_total: 60000,
    volume_atual: 48000,
    ultima_medicao: "2025-05-18T16:45:00Z",
    tipo: "parceiro",
    latitude: -23.4543,
    longitude: -46.5238
  }
];

const mockTanks: Record<number, StationTank[]> = {
  1: [
    { id: 1, posto_id: 1, tipo_combustivel: "Diesel S10", capacidade: 20000, nivel_atual: 15000, ultima_medicao: "2025-05-19T10:30:00Z", status: "operacional" },
    { id: 2, posto_id: 1, tipo_combustivel: "Diesel Comum", capacidade: 15000, nivel_atual: 9500, ultima_medicao: "2025-05-19T10:30:00Z", status: "operacional" },
    { id: 3, posto_id: 1, tipo_combustivel: "Arla 32", capacidade: 10000, nivel_atual: 8000, ultima_medicao: "2025-05-19T10:30:00Z", status: "operacional" }
  ],
  2: [
    { id: 4, posto_id: 2, tipo_combustivel: "Diesel S10", capacidade: 15000, nivel_atual: 8500, ultima_medicao: "2025-05-19T09:15:00Z", status: "operacional" },
    { id: 5, posto_id: 2, tipo_combustivel: "Diesel Comum", capacidade: 10000, nivel_atual: 6000, ultima_medicao: "2025-05-19T09:15:00Z", status: "operacional" },
    { id: 6, posto_id: 2, tipo_combustivel: "Arla 32", capacidade: 5000, nivel_atual: 4000, ultima_medicao: "2025-05-19T09:15:00Z", status: "operacional" }
  ],
  3: [
    { id: 7, posto_id: 3, tipo_combustivel: "Diesel S10", capacidade: 30000, nivel_atual: 26000, ultima_medicao: "2025-05-18T16:45:00Z", status: "operacional" },
    { id: 8, posto_id: 3, tipo_combustivel: "Diesel Comum", capacidade: 20000, nivel_atual: 15000, ultima_medicao: "2025-05-18T16:45:00Z", status: "operacional" },
    { id: 9, posto_id: 3, tipo_combustivel: "Arla 32", capacidade: 10000, nivel_atual: 7000, ultima_medicao: "2025-05-18T16:45:00Z", status: "em_manutenção" }
  ]
};

const mockSolicitations: FuelCardSolicitation[] = [
  {
    id: 1,
    placa: "ABC1234",
    km: 45678,
    tipo_cartao: "placa",
    provedor_cartao: "Ticket",
    motorista: "João Silva",
    observacoes: "Abastecimento urgente",
    status: "pendente",
    data_solicitacao: "2025-05-19T08:30:00Z",
    valor_solicitado: 250,
    base: "São Paulo",
    id_rota: "SP-001",
    posto_id: 1
  },
  {
    id: 2,
    placa: "DEF5678",
    km: 78945,
    tipo_cartao: "numero",
    provedor_cartao: "Alelo",
    numero_cartao: "1234-5678",
    motorista: "Maria Souza",
    status: "pendente",
    data_solicitacao: "2025-05-19T09:15:00Z",
    valor_solicitado: 300,
    base: "Campinas",
    id_rota: "CP-002",
    posto_id: 2
  },
  {
    id: 3,
    placa: "GHI9012",
    km: 123456,
    tipo_cartao: "placa",
    provedor_cartao: "Ticket",
    motorista: "Pedro Almeida",
    status: "atendido",
    data_solicitacao: "2025-05-18T14:00:00Z",
    data_atendimento: "2025-05-18T15:30:00Z",
    atendido_por: "Ana Operadora",
    valor_solicitado: 200,
    base: "São Paulo",
    id_rota: "SP-003",
    posto_id: 1
  },
  {
    id: 4,
    placa: "JKL3456",
    km: 65432,
    tipo_cartao: "numero",
    provedor_cartao: "Alelo",
    numero_cartao: "8765-4321",
    motorista: "Carlos Ferreira",
    status: "rejeitado",
    data_solicitacao: "2025-05-18T16:45:00Z",
    data_atendimento: "2025-05-18T17:30:00Z",
    atendido_por: "Roberto Supervisor",
    valor_solicitado: 150,
    base: "Guarulhos",
    id_rota: "GRU-001",
    posto_id: 3
  },
  {
    id: 5,
    placa: "MNO7890",
    km: 34567,
    tipo_cartao: "placa",
    provedor_cartao: "Ticket",
    motorista: "Ana Paula",
    observacoes: "Viagem intermunicipal",
    status: "pendente",
    data_solicitacao: "2025-05-19T10:00:00Z",
    valor_solicitado: 400,
    base: "Campinas",
    id_rota: "CP-005",
    posto_id: 2
  }
];

export default function StationProfile() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedStation, setSelectedStation] = useState<number>(1);
  
  // Buscar os postos da API (simulado por enquanto)
  const { data: stations, isLoading: isLoadingStations } = useQuery({
    queryKey: ['/api/fuel-stations'],
    queryFn: () => Promise.resolve(mockStations)
  });
  
  // Buscar os tanques do posto selecionado
  const { data: tanks } = useQuery({
    queryKey: ['/api/fuel-stations', selectedStation, 'tanks'],
    queryFn: () => Promise.resolve(mockTanks[selectedStation] || [])
  });
  
  // Buscar solicitações pendentes para o posto selecionado
  const { data: solicitations, isLoading: isLoadingSolicitations } = useQuery({
    queryKey: ['/api/fuel-card-solicitations', { stationId: selectedStation }],
    queryFn: () => Promise.resolve(mockSolicitations.filter(s => s.posto_id === selectedStation))
  });
  
  const currentStation = stations?.find(s => s.id === selectedStation);
  const pendingSolicitations = solicitations?.filter(s => s.status === 'pendente') || [];
  
  const handleStatusChange = async (id: number, newStatus: 'atendido' | 'rejeitado') => {
    try {
      // Simulando resposta da API por enquanto
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: newStatus === 'atendido' ? "Solicitação atendida" : "Solicitação rejeitada",
        description: "Status da solicitação atualizado com sucesso.",
      });
      
      // Em produção, use o código abaixo para chamar a API real
      // const response = await fetch(`/api/fuel-card-solicitations/${id}/status`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ status: newStatus }),
      // });
      
      // Atualiza a lista
      queryClient.invalidateQueries({ queryKey: ['/api/fuel-card-solicitations'] });
      
    } catch (error) {
      toast({
        title: "Erro ao processar",
        description: "Não foi possível atualizar o status da solicitação.",
        variant: "destructive",
      });
    }
  };
  
  if (isLoadingStations) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center p-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="ml-3 text-xl">Carregando informações dos postos...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Perfil do Posto</h1>
          <p className="text-muted-foreground">Gestão de postos e solicitações de abastecimento</p>
        </div>
        
        <div className="flex gap-2 items-center">
          <Select value={selectedStation.toString()} onValueChange={(value) => setSelectedStation(Number(value))}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Selecione um posto" />
            </SelectTrigger>
            <SelectContent>
              {stations?.map(station => (
                <SelectItem key={station.id} value={station.id.toString()}>
                  {station.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/fuel-stations'] })}>
            <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
          </Button>
        </div>
      </div>
      
      {currentStation && (
        <>
          <Card className="mb-8">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{currentStation.nome}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <MapPin className="h-4 w-4 mr-1" /> {currentStation.endereco}
                  </CardDescription>
                </div>
                <Badge className={currentStation.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                  {currentStation.status === 'ativo' ? 'Ativo' : 'Parceiro'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Responsável</p>
                    <p className="font-medium">{currentStation.responsavel}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{currentStation.telefone}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Fuel className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Última Medição</p>
                    <p className="font-medium">{format(new Date(currentStation.ultima_medicao), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Capacidade de Armazenamento</span>
                  <span className="text-sm font-medium">{Math.round((currentStation.volume_atual / currentStation.capacidade_total) * 100)}%</span>
                </div>
                <Progress value={(currentStation.volume_atual / currentStation.capacidade_total) * 100} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Volume atual: {currentStation.volume_atual.toLocaleString('pt-BR')} L</span>
                  <span>Capacidade: {currentStation.capacidade_total.toLocaleString('pt-BR')} L</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-[400px]">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="solicitations">
                Solicitações
                {pendingSolicitations.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{pendingSolicitations.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Tanques de Combustível</CardTitle>
                    <CardDescription>Capacidade e níveis atuais</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Nível Atual</TableHead>
                          <TableHead>Capacidade</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tanks?.map(tank => (
                          <TableRow key={tank.id}>
                            <TableCell className="font-medium">{tank.tipo_combustivel}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Progress value={(tank.nivel_atual / tank.capacidade) * 100} className="w-24 h-2" />
                                <span className="text-sm">{tank.nivel_atual.toLocaleString('pt-BR')} L</span>
                              </div>
                            </TableCell>
                            <TableCell>{tank.capacidade.toLocaleString('pt-BR')} L</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={tank.status === 'operacional' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}>
                                {tank.status === 'operacional' ? 'Operacional' : 'Em Manutenção'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Consumo Recente</CardTitle>
                    <CardDescription>Últimos 7 dias de abastecimentos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="text-center">
                        <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Gráfico de consumo será exibido aqui</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="solicitations" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl">Solicitações de Cartão Combustível</CardTitle>
                      <CardDescription>Gerencie as solicitações para este posto</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => window.location.href = '/fuel-card/solicitation'}>
                      <PlusCircle className="h-4 w-4 mr-2" /> Nova Solicitação
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoadingSolicitations ? (
                    <div className="flex justify-center items-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2">Carregando solicitações...</span>
                    </div>
                  ) : solicitations && solicitations.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Placa</TableHead>
                          <TableHead>KM</TableHead>
                          <TableHead>Motorista</TableHead>
                          <TableHead>Base</TableHead>
                          <TableHead>ID Rota</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {solicitations.map((solicitation) => (
                          <TableRow key={solicitation.id}>
                            <TableCell className="font-medium">{solicitation.id}</TableCell>
                            <TableCell>{solicitation.placa}</TableCell>
                            <TableCell>{solicitation.km}</TableCell>
                            <TableCell>{solicitation.motorista}</TableCell>
                            <TableCell>{solicitation.base || '-'}</TableCell>
                            <TableCell>{solicitation.id_rota || '-'}</TableCell>
                            <TableCell>
                              {solicitation.valor_solicitado 
                                ? `R$ ${solicitation.valor_solicitado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : 'R$ 150,00'}
                            </TableCell>
                            <TableCell>{format(new Date(solicitation.data_solicitacao), 'dd/MM/yyyy HH:mm')}</TableCell>
                            <TableCell>
                              <StatusBadge status={solicitation.status} />
                            </TableCell>
                            <TableCell>
                              {solicitation.status === 'pendente' && (
                                <div className="flex space-x-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="h-8 px-2 text-green-600"
                                    onClick={() => handleStatusChange(solicitation.id, 'atendido')}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-1" /> Atender
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="h-8 px-2 text-red-600"
                                    onClick={() => handleStatusChange(solicitation.id, 'rejeitado')}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" /> Rejeitar
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-8 text-center">
                      <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">Nenhuma solicitação encontrada</h3>
                      <p className="text-muted-foreground">
                        Não há solicitações de cartão combustível para este posto.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pendente':
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pendente</Badge>;
    case 'atendido':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Atendido</Badge>;
    case 'rejeitado':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejeitado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}