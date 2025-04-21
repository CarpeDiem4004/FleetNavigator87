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
  'em_negociacao': 'Em Negociação',
  'orcamento_aprovado': 'Orçamento Aprovado',
  'aguardando_pecas': 'Aguardando Peças',
  'em_andamento': 'Em Andamento',
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
    case 'em_negociacao':
      variant = "secondary";
      break;
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
    case 'em_negociacao':
      return <Loader2 className="h-5 w-5 text-purple-500" />;
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
    setSelectedMaintenance(maintenance);
    setVehiclePlate(maintenance.vehiclePlate || ""); // Inicializa com a placa atual, mas pode ser modificada
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
      const chatResponse = await fetch("/api/workshop/maintenance-chat", {
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
      
      if (!chatResponse.ok) {
        throw new Error("Erro ao criar chat de orçamento");
      }
      
      const chatData = await chatResponse.json();
      
      // Guardar o ID do chat criado
      setCreatedChatId(chatData.id);
      
      // Atualizar o status da manutenção na lista local
      setMaintenanceItems(prev => 
        prev.map(item => item.id === selectedMaintenance.id 
          ? { ...item, status: 'em_negociacao' } 
          : item
        )
      );
      
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
  
  // Carregar manutenções ao montar o componente
  useEffect(() => {
    fetchMaintenance();
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
              // Encontrar uma manutenção que está aguardando orçamento
              const maintenance = maintenanceItems.find(m => m.status === 'aguardando_orcamento');
              if (maintenance) {
                setSelectedMaintenance(maintenance);
                setVehiclePlate(maintenance.vehiclePlate || "");
                setInitialBudget('');
                setKmAtual('');
                setPrazoEstimado('');
                setDescricaoServico('');
                setIsChatDialogOpen(true);
              } else {
                toast({
                  title: "Atenção",
                  description: "Não há manutenções aguardando orçamento no momento.",
                  variant: "default"
                });
              }
            }}
            variant="default"
          >
            <FileInput className="h-4 w-4 mr-2" />
            Novo Orçamento
          </Button>
          <Button onClick={fetchMaintenance} variant="outline">
            Atualizar
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
                <SelectItem value="em_negociacao">Em Negociação</SelectItem>
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
                                maintenance.status === 'em_negociacao' || 
                                maintenance.status === 'orcamento_aprovado') && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => openBudgetChat(maintenance)}
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  {maintenance.status === 'aguardando_orcamento' ? 'Enviar Orçamento' : 'Ver Negociação'}
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
      
      {/* Modal de chat de orçamento */}
      <Dialog open={isChatDialogOpen} onOpenChange={setIsChatDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {selectedMaintenance?.status === 'aguardando_orcamento'
                ? 'Enviar Orçamento'
                : 'Negociação de Orçamento'}
            </DialogTitle>
            <DialogDescription>
              {selectedMaintenance?.status === 'aguardando_orcamento'
                ? 'Preencha o valor do orçamento inicial para esta manutenção'
                : 'Acompanhe a negociação de orçamento com o gestor da frota'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMaintenance?.status === 'aguardando_orcamento' ? (
            <div className="py-4 px-1">
              {/* Card de Detalhes da Solicitação com estilo melhorado */}
              <div className="mb-5 bg-muted/20 rounded-lg p-3 border border-muted/30">
                <div className="flex items-center mb-2 text-sm font-medium text-muted-foreground">
                  <FileInput className="h-4 w-4 mr-2" />
                  <span>Detalhes da Solicitação</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="grid grid-cols-3 text-sm">
                    <span className="font-medium text-muted-foreground">Tipo de Manutenção:</span> 
                    <span className="col-span-2">{selectedMaintenance?.maintenanceType === 'preventiva' ? 'Preventiva' : 'Corretiva'}</span>
                  </div>
                  <div className="grid grid-cols-3 text-sm">
                    <span className="font-medium text-muted-foreground">Descrição Original:</span> 
                    <span className="col-span-2">{selectedMaintenance?.description}</span>
                  </div>
                </div>
              </div>
              
              {/* Formulário de novo orçamento com layout aprimorado */}
              <div className="mb-5 bg-background rounded-lg border shadow-sm">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-semibold">Novo Orçamento</h3>
                </div>
                
                <div className="p-4 space-y-5">
                  {/* Campo de placa com layout e ícone melhorados */}
                  <div>
                    <Label htmlFor="vehiclePlate" className="flex items-center text-sm font-medium">
                      <span className="mr-2">🚗</span>Placa do Veículo
                    </Label>
                    <Input
                      id="vehiclePlate"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                      placeholder="Digite a placa do veículo (ex: ABC1234)"
                      className="uppercase mt-1.5 focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  
                  {/* Grid de 2 colunas para valor e quilometragem com espaçamento melhorado */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="initialBudget" className="flex items-center text-sm font-medium">
                        <span className="mr-2">💰</span>Valor do Orçamento (R$)
                      </Label>
                      <Input
                        id="initialBudget"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        value={initialBudget}
                        onChange={(e) => setInitialBudget(e.target.value)}
                        className="mt-1.5 focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="kmAtual" className="flex items-center text-sm font-medium">
                        <span className="mr-2">🔄</span>Quilometragem Atual
                      </Label>
                      <Input
                        id="kmAtual"
                        type="number"
                        min="0"
                        placeholder="Ex: 45000"
                        value={kmAtual}
                        onChange={(e) => setKmAtual(e.target.value)}
                        className="mt-1.5 focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  
                  {/* Prazo estimado com layout melhorado */}
                  <div>
                    <Label htmlFor="prazoEstimado" className="flex items-center text-sm font-medium">
                      <span className="mr-2">⏱️</span>Prazo para Conclusão (dias)
                    </Label>
                    <Input
                      id="prazoEstimado"
                      type="number"
                      min="1"
                      placeholder="Ex: 3"
                      value={prazoEstimado}
                      onChange={(e) => setPrazoEstimado(e.target.value)}
                      className="mt-1.5 focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  
                  {/* Descrição do serviço - layout aprimorado */}
                  <div>
                    <Label htmlFor="descricaoServico" className="flex items-center text-sm font-medium">
                      <span className="mr-2">📝</span>Descrição Detalhada do Serviço
                    </Label>
                    <textarea
                      id="descricaoServico"
                      placeholder="Descreva detalhadamente o serviço a ser realizado, incluindo peças necessárias e procedimentos..."
                      value={descricaoServico}
                      onChange={(e) => setDescricaoServico(e.target.value)}
                      rows={3}
                      className="w-full mt-1.5 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
              
              {/* Barra de ações com botões reorganizados */}
              <div className="flex justify-between items-center mt-4 gap-4">
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    // Limpar todos os campos mantendo a manutenção selecionada
                    setVehiclePlate(selectedMaintenance?.vehiclePlate || ""); // Resetar para a placa original
                    setInitialBudget("");
                    setKmAtual("");
                    setPrazoEstimado("");
                    setDescricaoServico("");
                  }}
                  className="flex items-center"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Novo Orçamento
                </Button>
                
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={closeBudgetChat} size="sm">
                    Cancelar
                  </Button>
                  <Button 
                    onClick={createBudgetChat}
                    disabled={isSubmittingBudget || !vehiclePlate || !initialBudget || !kmAtual || !prazoEstimado || !descricaoServico}
                    size="sm"
                  >
                    {isSubmittingBudget && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enviar Orçamento
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
              {selectedMaintenance && (
                <ChatOficina
                  maintenanceId={selectedMaintenance.id}
                  initialBudget={initialBudget || undefined} // Passar diretamente como string
                  kmAtual={kmAtual || undefined}
                  prazoEstimado={prazoEstimado || undefined}
                  descricaoServico={descricaoServico || undefined}
                  vehiclePlate={vehiclePlate || undefined}
                  chatId={createdChatId}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Modal do ciclo de vida */}
      <Dialog open={isLifecycleDialogOpen} onOpenChange={setIsLifecycleDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ciclo de Vida da Manutenção</DialogTitle>
            <DialogDescription>
              Acompanhe e registre cada etapa do ciclo de vida do veículo durante o processo de manutenção
            </DialogDescription>
          </DialogHeader>
          
          {selectedMaintenance && (
            <MaintenanceLifecycle 
              maintenanceId={selectedMaintenance.id}
              onStatusChange={closeLifecycleDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}