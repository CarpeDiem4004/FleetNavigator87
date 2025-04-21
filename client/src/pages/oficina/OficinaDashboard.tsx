import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Loader2, CheckCircle, Clock, AlertTriangle, XCircle, MessageSquare, FileInput, Calendar, ReceiptText, RefreshCw } from "lucide-react";
import ChatOficina from "@/components/workshop/ChatOficina";
import MaintenanceLifecycle from "@/components/workshop/MaintenanceLifecycle";

// Interface para as manutenções
interface Maintenance {
  id: number;
  vehiclePlate: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  estimatedCompletion: string;
  actualCompletion: string | null;
  workshopId: number;
  requestBaseId: number;
  maintenanceType: string;
  vehicleModel?: string;
}

// Função para formatar data
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
};

// Tradução dos status para exibição
const statusTranslation: Record<string, string> = {
  'pendente': 'Pendente',
  'aguardando_orcamento': 'Aguardando Orçamento',
  'em_andamento': 'Em Andamento / Negociação',
  'orcamento_aprovado': 'Orçamento Aprovado',
  'aguardando_pecas': 'Aguardando Peças',
  'concluida': 'Concluída',
  'cancelada': 'Cancelada'
};

// Componente para exibir o badge com cor conforme o status
const StatusBadge = ({ status }: { status: string }) => {
  let variant: "default" | "destructive" | "outline" | "secondary" = "default";
  
  switch (status) {
    case 'pendente':
      variant = "outline";
      break;
    case 'aguardando_orcamento':
      variant = "secondary";
      break;
    // Removido caso em_negociacao, usando em_andamento
    case 'orcamento_aprovado':
      variant = "default";
      break;
    case 'aguardando_pecas':
      variant = "outline";
      break;
    case 'em_andamento':
      variant = "default";
      break;
    case 'concluida':
      variant = "default"; // Verde já é o padrão
      break;
    case 'cancelada':
      variant = "destructive";
      break;
    default:
      variant = "outline";
  }
  
  return (
    <Badge variant={variant}>
      {statusTranslation[status] || status}
    </Badge>
  );
};

// Componente para ícone do status
const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'pendente':
      return <Clock className="h-5 w-5 text-yellow-500" />;
    case 'aguardando_orcamento':
      return <AlertTriangle className="h-5 w-5 text-blue-500" />;
    // Substituído pelo caso em_andamento
    case 'orcamento_aprovado':
      return <CheckCircle className="h-5 w-5 text-blue-600" />;
    case 'aguardando_pecas':
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    case 'em_andamento':
      return <Loader2 className="h-5 w-5 text-blue-700 animate-spin" />;
    case 'concluida':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'cancelada':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-500" />;
  }
};

// Interface para os veículos
interface Vehicle {
  id: number;
  plate: string;
  model: string;
  make: string;
  year: string;
  base_id: number;
}

export default function OficinaDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [maintenanceItems, setMaintenanceItems] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [isLifecycleDialogOpen, setIsLifecycleDialogOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
  const [initialBudget, setInitialBudget] = useState<string>("");
  const [kmAtual, setKmAtual] = useState<string>("");
  const [prazoEstimado, setPrazoEstimado] = useState<string>("");
  const [descricaoServico, setDescricaoServico] = useState<string>("");
  const [vehiclePlate, setVehiclePlate] = useState<string>("");
  const [isSubmittingBudget, setIsSubmittingBudget] = useState(false);
  const [createdChatId, setCreatedChatId] = useState<number | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  
  // Função para buscar manutenções da oficina
  const fetchMaintenance = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/workshop/maintenance");
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar manutenções: ${response.statusText}`);
      }
      
      const data = await response.json();
      setMaintenanceItems(data.items || []);
    } catch (error) {
      console.error("Erro ao buscar manutenções da oficina:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as manutenções. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Atualizar status de uma manutenção
  const updateMaintenanceStatus = async (id: number, newStatus: string) => {
    try {
      setUpdating(id);
      const response = await fetch(`/api/workshop/maintenance/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao atualizar status: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Atualizar a lista local
      setMaintenanceItems(prev => 
        prev.map(item => item.id === id ? { ...item, status: newStatus } : item)
      );
      
      toast({
        title: "Sucesso",
        description: "Status da manutenção atualizado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };
  
  // Função para abrir o chat de orçamento
  const openBudgetChat = (maintenance: Maintenance) => {
    console.log("Abrindo formulário para manutenção:", maintenance.id);
    
    // Verificar se a lista de veículos já foi carregada
    if (vehicles.length === 0 && !loadingVehicles) {
      fetchVehicles();
    }
    
    setSelectedMaintenance(maintenance);
    setVehiclePlate(""); // Agora iniciamos vazio para o usuário selecionar
    setInitialBudget("");
    setKmAtual("");
    setPrazoEstimado("");
    setDescricaoServico("");
    setIsChatDialogOpen(true);
  };
  
  // Função para fechar o chat de orçamento
  const closeBudgetChat = () => {
    setIsChatDialogOpen(false);
    setSelectedMaintenance(null);
    setCreatedChatId(null);
  };
  
  // Função para abrir o diálogo do ciclo de vida
  const openLifecycleDialog = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    setIsLifecycleDialogOpen(true);
  };
  
  // Função para fechar o diálogo do ciclo de vida
  const closeLifecycleDialog = () => {
    setIsLifecycleDialogOpen(false);
    fetchMaintenance(); // Atualizar a lista após alterações no ciclo de vida
  };
  
  // Função para criar um novo chat com orçamento inicial
  const createBudgetChat = async () => {
    if (!selectedMaintenance || !vehiclePlate || !initialBudget || !kmAtual || !prazoEstimado || !descricaoServico) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos do orçamento, incluindo a placa do veículo.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmittingBudget(true);
      
      // Criar o chat de orçamento
      const response = await fetch("/api/workshop/maintenance-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          maintenanceId: selectedMaintenance.id,
          vehiclePlate: vehiclePlate.toUpperCase(),  // Enviar a placa digitada pela oficina
          initialBudget: initialBudget, // Enviar como string, sem converter para número
          kmAtual: kmAtual,
          prazoEstimado: prazoEstimado,
          descricaoServico: descricaoServico,
          isFinalized: false
        })
      });
      
      if (!response.ok) {
        throw new Error("Erro ao criar chat de orçamento");
      }
      
      const data = await response.json();
      
      // Atualizar o ID do chat criado
      setCreatedChatId(data.id);
      
      // Atualizar a lista de manutenções com um pequeno atraso
      // para garantir que o status foi atualizado no banco de dados
      setTimeout(() => {
        fetchMaintenance();
      }, 500);
      
      // Fechar o diálogo e mostrar mensagem de sucesso
      setIsChatDialogOpen(false);
      
      toast({
        title: "Sucesso",
        description: "Orçamento enviado para análise.",
      });
      
    } catch (error) {
      console.error("Erro ao criar chat de orçamento:", error);
      toast({
        title: "Erro",
        description: "Falha ao enviar orçamento. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingBudget(false);
    }
  };
  
  // Função para buscar veículos cadastrados
  const fetchVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const response = await fetch("/api/workshop/vehicles");
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar veículos: ${response.statusText}`);
      }
      
      const data = await response.json();
      setVehicles(data.data || []);
    } catch (error) {
      console.error("Erro ao buscar veículos cadastrados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de veículos. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoadingVehicles(false);
    }
  };
  
  // Carregar manutenções e veículos ao montar o componente
  useEffect(() => {
    fetchMaintenance();
    fetchVehicles();
  }, []);
  
  // Filtrar manutenções com base no status selecionado
  const filteredMaintenance = filterStatus && filterStatus !== "todos"
    ? maintenanceItems.filter(item => item.status === filterStatus)
    : maintenanceItems;
  
  // Contagem de manutenções por status
  const pendingCount = maintenanceItems.filter(m => m.status === 'pendente').length;
  const awaitingQuoteCount = maintenanceItems.filter(m => m.status === 'aguardando_orcamento').length;
  const inProgressCount = maintenanceItems.filter(m => m.status === 'em_andamento').length;
  const completedCount = maintenanceItems.filter(m => m.status === 'concluida').length;
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portal da Oficina</h1>
          <p className="text-muted-foreground">
            Gerencie as manutenções designadas para sua oficina
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              // Vamos criar um formulário para novo orçamento independente de haver manutenções elegíveis
              if (maintenanceItems.length > 0) {
                // Criar um objeto de manutenção sintético com os dados mínimos necessários
                // Usaremos a primeira manutenção disponível, independente do status
                const maintenance = maintenanceItems[0];
                console.log("Abrindo formulário para a primeira manutenção disponível:", maintenance.id);
                
                // Verificar se a lista de veículos já foi carregada
                if (vehicles.length === 0 && !loadingVehicles) {
                  fetchVehicles();
                }
                
                // Configurar o formulário
                setSelectedMaintenance(maintenance);
                setVehiclePlate(""); // Campo vazio para seleção do usuário
                setInitialBudget('');
                setKmAtual('');
                setPrazoEstimado('');
                setDescricaoServico('');
                setIsChatDialogOpen(true);
              } else {
                toast({
                  title: "Atenção",
                  description: "Não há manutenções disponíveis no momento.",
                  variant: "default"
                });
                console.log("Nenhuma manutenção disponível para criar orçamento.");
              }
            }}
            variant="default"
          >
            <FileInput className="h-4 w-4 mr-2" />
            Novo Orçamento
          </Button>
          <Button 
            onClick={() => {
              // Forçar atualização dos dados
              fetchMaintenance();
              toast({
                title: "Lista Atualizada",
                description: "Os dados foram atualizados com sucesso."
              });
            }} 
            variant="outline"
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar Lista
          </Button>
        </div>
      </div>
      
      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Manutenções aguardando início
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Orçamento</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{awaitingQuoteCount}</div>
            <p className="text-xs text-muted-foreground">
              Orçamentos a enviar
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Loader2 className="h-4 w-4 text-blue-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">
              Serviços em execução
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">
              Serviços finalizados
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filtros e tabela */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Manutenções</CardTitle>
          <CardDescription>
            Lista de todas as manutenções atribuídas à sua oficina
          </CardDescription>
          
          <div className="flex space-x-2 pt-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="aguardando_orcamento">Aguardando Orçamento</SelectItem>
                {/* Removido item em_negociacao, usando em_andamento */}
                <SelectItem value="orcamento_aprovado">Orçamento Aprovado</SelectItem>
                <SelectItem value="aguardando_pecas">Aguardando Peças</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Carregando manutenções...</span>
            </div>
          ) : filteredMaintenance.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Nenhuma manutenção encontrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>Lista de manutenções atribuídas à oficina.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead className="w-[100px]">Placa</TableHead>
                    <TableHead className="w-[180px]">Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-[120px]">Data</TableHead>
                    <TableHead className="w-[150px]">Status</TableHead>
                    <TableHead className="w-[200px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaintenance.map((maintenance) => (
                    <TableRow key={maintenance.id}>
                      <TableCell className="font-medium">{maintenance.id}</TableCell>
                      <TableCell className="font-medium">{maintenance.vehiclePlate}</TableCell>
                      <TableCell>{maintenance.maintenanceType}</TableCell>
                      <TableCell>{maintenance.description}</TableCell>
                      <TableCell>{formatDate(maintenance.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <StatusIcon status={maintenance.status} />
                          <StatusBadge status={maintenance.status} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {maintenance.status !== 'concluida' && maintenance.status !== 'cancelada' && (
                            <>
                              <Select
                                disabled={updating === maintenance.id}
                                onValueChange={(value) => updateMaintenanceStatus(maintenance.id, value)}
                              >
                                <SelectTrigger className="w-[160px]">
                                  <SelectValue placeholder="Atualizar Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  {maintenance.status !== 'pendente' && (
                                    <SelectItem value="pendente">Pendente</SelectItem>
                                  )}
                                  {maintenance.status !== 'aguardando_orcamento' && (
                                    <SelectItem value="aguardando_orcamento">Aguardando Orçamento</SelectItem>
                                  )}
                                  {maintenance.status !== 'aguardando_pecas' && (
                                    <SelectItem value="aguardando_pecas">Aguardando Peças</SelectItem>
                                  )}
                                  {maintenance.status !== 'em_andamento' && (
                                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                                  )}
                                  <SelectItem value="concluida">Concluída</SelectItem>
                                  <SelectItem value="cancelada">Cancelada</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              {/* Botão para chat de orçamento */}
                              {(maintenance.status === 'aguardando_orcamento' || 
                                maintenance.status === 'em_andamento' ||  
                                maintenance.status === 'orcamento_aprovado') && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => openBudgetChat(maintenance)}
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  {maintenance.status === 'aguardando_orcamento' ? 'Enviar Orçamento' : 
                                   maintenance.status === 'em_andamento' ? 'Atualizar Orçamento' :
                                   'Ver Negociação'}
                                </Button>
                              )}
                              
                              {/* Botão para gerenciar ciclo de vida */}
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => openLifecycleDialog(maintenance)}
                              >
                                <Calendar className="h-4 w-4 mr-1" />
                                Ciclo de Vida
                              </Button>
                            </>
                          )}
                          
                          {updating === maintenance.id && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
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
      
      {/* Informações da oficina */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Oficina</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Nome:</strong> {user?.name || "-"}</p>
            <p><strong>Email:</strong> {user?.email || "-"}</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Modal de chat de orçamento - Nova versão sem renderização condicional */}
      <Dialog 
        open={isChatDialogOpen && selectedMaintenance !== null}
        onOpenChange={(open) => {
          if (!open) {
            // Fechar o diálogo
            setIsChatDialogOpen(false);
            
            // Sempre atualizar os dados quando o diálogo é fechado
            // Isso garante que qualquer alteração de status seja refletida na lista
            setTimeout(() => {
              fetchMaintenance();
            }, 500);
            
            // Limpar ID do chat criado se existir
            if (createdChatId) {
              setCreatedChatId(null);
            }
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle>
              Novo Orçamento
            </DialogTitle>
            <DialogDescription className="text-xs">
              Preencha todas as informações do orçamento incluindo a placa do veículo
            </DialogDescription>
          </DialogHeader>
          
          {selectedMaintenance && (
            <div className="py-2">
              {/* Detalhes da Solicitação - Versão simplificada */}
              <div className="mb-3 p-2 border text-xs rounded bg-muted/10">
                <div className="flex items-center gap-1 mb-1 text-xs font-medium">
                  <FileInput className="h-3 w-3" />
                  <span>Detalhes da Solicitação</span>
                </div>
                <div className="grid grid-cols-1 gap-0.5">
                  <div className="flex text-xs">
                    <span className="font-medium w-28">Tipo:</span> 
                    <span>{selectedMaintenance.maintenanceType === 'preventiva' ? 'Preventiva' : 'Corretiva'}</span>
                  </div>
                  <div className="flex text-xs">
                    <span className="font-medium w-28">Descrição:</span> 
                    <span className="truncate">{selectedMaintenance.description}</span>
                  </div>
                </div>
              </div>
              
              {/* Formulário de novo orçamento simplificado */}
              <form onSubmit={(e) => {
                e.preventDefault();
                createBudgetChat();
              }}>
                <div className="mb-3 border rounded">
                  <div className="p-2 border-b bg-muted/10">
                    <h3 className="text-sm font-medium">Novo Orçamento</h3>
                  </div>
                  
                  <div className="p-3 space-y-3">
                    {/* Campo de placa (Input ou Select) com opção de adicionar manualmente */}
                    <div>
                      <Label htmlFor="vehiclePlate" className="text-xs font-medium flex items-center">
                        <span className="mr-1">🚗</span>Placa do Veículo
                      </Label>
                      <div className="space-y-2">
                        {/* Seletor de veículos */}
                        <div className="flex gap-2 items-center">
                          <div className="flex-1">
                            <Select
                              value={vehiclePlate}
                              onValueChange={(value) => setVehiclePlate(value)}
                            >
                              <SelectTrigger className="mt-1 h-9 text-sm">
                                <SelectValue placeholder="Selecione um veículo" />
                              </SelectTrigger>
                              <SelectContent>
                                {!loadingVehicles && vehicles.map((vehicle) => (
                                  <SelectItem key={vehicle.id} value={vehicle.plate}>
                                    {vehicle.plate} - {vehicle.make} {vehicle.model} ({vehicle.year})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {/* Indicador de carregamento */}
                          {loadingVehicles && (
                            <div className="flex items-center ml-2">
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              <span className="text-xs">Carregando...</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Opção de digitar placa manualmente */}
                        {vehicles.length === 0 && !loadingVehicles && (
                          <div className="text-xs text-muted-foreground">
                            Nenhum veículo encontrado. Digite a placa manualmente abaixo.
                          </div>
                        )}
                        
                        {/* Campo para digitação manual */}
                        <Input
                          id="vehiclePlateManual"
                          value={vehiclePlate}
                          onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                          placeholder="Digite a placa do veículo manualmente"
                          className="uppercase mt-1 h-8 text-sm"
                        />
                        <div className="text-xs text-muted-foreground">
                          Você pode selecionar um veículo ou digitar a placa manualmente.
                        </div>
                      </div>
                    </div>
                    
                    {/* Grid de 2 colunas para valor e quilometragem */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="initialBudget" className="text-xs font-medium flex items-center">
                          <span className="mr-1">💰</span>Valor (R$)
                        </Label>
                        <Input
                          id="initialBudget"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          value={initialBudget}
                          onChange={(e) => setInitialBudget(e.target.value)}
                          className="mt-1 h-8 text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="kmAtual" className="text-xs font-medium flex items-center">
                          <span className="mr-1">🔄</span>Quilometragem
                        </Label>
                        <Input
                          id="kmAtual"
                          type="number"
                          min="0"
                          placeholder="Ex: 45000"
                          value={kmAtual}
                          onChange={(e) => setKmAtual(e.target.value)}
                          className="mt-1 h-8 text-sm"
                        />
                      </div>
                    </div>
                    
                    {/* Prazo estimado */}
                    <div>
                      <Label htmlFor="prazoEstimado" className="text-xs font-medium flex items-center">
                        <span className="mr-1">⏱️</span>Prazo para Conclusão (dias)
                      </Label>
                      <Input
                        id="prazoEstimado"
                        type="number"
                        min="1"
                        placeholder="Ex: 3"
                        value={prazoEstimado}
                        onChange={(e) => setPrazoEstimado(e.target.value)}
                        className="mt-1 h-8 text-sm"
                      />
                    </div>
                    
                    {/* Descrição do serviço */}
                    <div>
                      <Label htmlFor="descricaoServico" className="text-xs font-medium flex items-center">
                        <span className="mr-1">📝</span>Descrição do Serviço
                      </Label>
                      <textarea
                        id="descricaoServico"
                        placeholder="Descreva o serviço a ser realizado..."
                        value={descricaoServico}
                        onChange={(e) => setDescricaoServico(e.target.value)}
                        rows={2}
                        className="w-full mt-1 resize-none rounded-md border text-sm border-input p-2"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Barra de ações */}
                <div className="flex justify-between items-center gap-2">
                  <Button 
                    type="button"
                    variant="ghost" 
                    onClick={() => {
                      // Limpar campos
                      setVehiclePlate(""); // Agora não preenche automaticamente
                      setInitialBudget("");
                      setKmAtual("");
                      setPrazoEstimado("");
                      setDescricaoServico("");
                    }}
                    className="flex items-center h-8 text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Novo
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => {
                        setIsChatDialogOpen(false);
                      }} 
                      size="sm" 
                      className="h-8 text-xs"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isSubmittingBudget || !vehiclePlate || !initialBudget || !kmAtual || !prazoEstimado || !descricaoServico}
                      size="sm"
                      className="h-8 text-xs"
                    >
                      {isSubmittingBudget && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Enviar Orçamento
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Modal do ciclo de vida */}
      {isLifecycleDialogOpen && selectedMaintenance && (
        <Dialog open={true} onOpenChange={(open) => !open && setIsLifecycleDialogOpen(false)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ciclo de Vida da Manutenção</DialogTitle>
              <DialogDescription>
                Acompanhe e registre cada etapa do ciclo de vida do veículo durante o processo de manutenção
              </DialogDescription>
            </DialogHeader>
            
            <MaintenanceLifecycle 
              maintenanceId={selectedMaintenance.id}
              onStatusChange={closeLifecycleDialog}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}