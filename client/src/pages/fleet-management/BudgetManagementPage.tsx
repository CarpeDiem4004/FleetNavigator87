import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import MaintenanceChatHistory from "@/components/chat/MaintenanceChatHistory";
import { formatCurrency } from "@/lib/utils";
import { CircleAlert, BarChart3, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Maintenance {
  id: number;
  vehiclePlate: string;
  vehicleModel: string;
  description: string;
  status: string;
  priority: string;
  workshopId: number;
  workshopName: string;
  baseId: number;
  baseName: string;
  responsavelNome: string;
  maintenanceChatId: number;
  initialBudget: number | null;
  finalBudget: number | null;
  kmAtual: string | null;
  prazoEstimado: string | null;
  descricaoServico: string | null;
  isFinalized: boolean;
  chatCreatedAt: string;
}

interface ChatMessage {
  id: number;
  chatId: number;
  author: string;
  authorId: number;
  authorName: string;
  message: string;
  sent_at: string;
  proposedBudget: number | null;
}

const statusMap: Record<string, { label: string; color: "default" | "primary" | "secondary" | "destructive" | "warning" | "success" }> = {
  em_negociacao: { label: "Em Negociação", color: "warning" },
  orcamento_aprovado: { label: "Orçamento Aprovado", color: "success" },
  aguardando_orcamento: { label: "Aguardando Orçamento", color: "secondary" },
  em_andamento: { label: "Em Andamento", color: "primary" },
  concluida: { label: "Concluída", color: "success" },
  pendente: { label: "Pendente", color: "default" },
  cancelada: { label: "Cancelada", color: "destructive" }
};

const priorityMap: Record<string, { label: string; color: "default" | "warning" | "destructive" }> = {
  baixa: { label: "Baixa", color: "default" },
  media: { label: "Média", color: "warning" },
  alta: { label: "Alta", color: "destructive" }
};

export default function BudgetManagementPage() {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [fetchingMessages, setFetchingMessages] = useState(false);
  const [budgetRequests, setBudgetRequests] = useState<any[]>([]);
  const [loadingBudgetRequests, setLoadingBudgetRequests] = useState(true);

  // Função para obter as solicitações de orçamento da Base Campinas
  const fetchBudgetRequests = async () => {
    try {
      setLoadingBudgetRequests(true);
      const response = await apiRequest("GET", "/api/fleet/budget-requests");
      console.log("Solicitações de orçamento:", response);
      setBudgetRequests(response);
    } catch (error) {
      console.error("Erro ao buscar solicitações de orçamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as solicitações de orçamento",
        variant: "destructive"
      });
    } finally {
      setLoadingBudgetRequests(false);
    }
  };

  // Função para obter as manutenções com chats
  const fetchMaintenancesWithChats = async () => {
    try {
      setLoading(true);
      // Usando apiRequest em vez de fetch para garantir que o token JWT seja incluído
      const response = await apiRequest("GET", "/api/fleet/maintenance-with-chats");
      
      const data = await response.json();
      setMaintenances(data);
      console.log("Manutenções com chats carregadas com sucesso:", data.length);
    } catch (error) {
      console.error("Erro ao buscar manutenções com orçamentos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as manutenções com orçamentos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para obter as mensagens de um chat específico
  const fetchChatMessages = async (maintenanceId: number) => {
    try {
      setFetchingMessages(true);
      // Usando apiRequest em vez de fetch para garantir que o token JWT seja incluído
      const response = await apiRequest("GET", `/api/workshop/maintenance-chat/${maintenanceId}`);
      
      const data = await response.json();
      setChatMessages(data.messages || []);
      console.log("Mensagens do chat carregadas com sucesso:", (data.messages || []).length);
    } catch (error) {
      console.error("Erro ao buscar mensagens do chat:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as mensagens do chat",
        variant: "destructive"
      });
      setChatMessages([]);
    } finally {
      setFetchingMessages(false);
    }
  };

  // Carregar manutenções com chats e solicitações de orçamento quando a página carrega
  useEffect(() => {
    fetchMaintenancesWithChats();
    fetchBudgetRequests();
  }, []);

  // Abrir o chat de uma manutenção
  const openChat = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    fetchChatMessages(maintenance.id);
    setChatDialogOpen(true);
  };

  // Filtrar manutenções com base na tab selecionada
  const filteredMaintenances = maintenances.filter(maintenance => {
    if (activeTab === "all") return true;
    if (activeTab === "negotiation") return maintenance.status === "em_negociacao";
    if (activeTab === "approved") return maintenance.status === "orcamento_aprovado";
    return true;
  });

  // Função para finalizar uma negociação
  const finalizeNegotiation = async (chatId: number, finalBudget: number) => {
    try {
      // Usando apiRequest em vez de fetch para garantir que o token JWT seja incluído
      const response = await apiRequest(
        "POST", 
        `/api/workshop/maintenance-chat/${chatId}/finalize`, 
        { finalBudget }
      );
      
      toast({
        title: "Sucesso",
        description: "Negociação finalizada com sucesso",
        // @ts-ignore - Há um erro de tipagem no variant, mas 'success' é válido
        variant: "success"
      });
      
      // Recarregar dados
      fetchMaintenancesWithChats();
      setChatDialogOpen(false);
    } catch (error) {
      console.error("Erro ao finalizar negociação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível finalizar a negociação",
        variant: "destructive"
      });
    }
  };

  // Renderizar estatísticas
  const renderStats = () => {
    const totalNegociacao = maintenances.filter(m => m.status === "em_negociacao").length;
    const totalAprovado = maintenances.filter(m => m.status === "orcamento_aprovado").length;
    const totalPendente = maintenances.filter(m => !m.finalBudget && !m.isFinalized).length;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Negociação</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNegociacao}</div>
            <p className="text-xs text-muted-foreground">
              Orçamentos aguardando aprovação
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAprovado}</div>
            <p className="text-xs text-muted-foreground">
              Orçamentos finalizados e aprovados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPendente}</div>
            <p className="text-xs text-muted-foreground">
              Orçamentos ainda não finalizados
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Função para aprovar uma solicitação de orçamento
  const approveBudgetRequest = async (requestId: number, approvedValue: number) => {
    try {
      const response = await apiRequest(
        "PUT",
        `/api/fleet/budget-requests/${requestId}/approve`,
        {
          approvedValue,
          approvedBy: (budgetRequests[0]?.name || "Administrador")
        }
      );
      
      toast({
        title: "Sucesso",
        description: "Solicitação de orçamento aprovada com sucesso",
        variant: "success"
      });
      
      // Recarregar dados
      fetchBudgetRequests();
    } catch (error) {
      console.error("Erro ao aprovar solicitação de orçamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar a solicitação de orçamento",
        variant: "destructive"
      });
    }
  };
  
  // Função para rejeitar uma solicitação de orçamento
  const rejectBudgetRequest = async (requestId: number, comments: string) => {
    try {
      const response = await apiRequest(
        "PUT",
        `/api/fleet/budget-requests/${requestId}/reject`,
        { comments }
      );
      
      toast({
        title: "Sucesso",
        description: "Solicitação de orçamento rejeitada",
        variant: "success"
      });
      
      // Recarregar dados
      fetchBudgetRequests();
    } catch (error) {
      console.error("Erro ao rejeitar solicitação de orçamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar a solicitação de orçamento",
        variant: "destructive"
      });
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Orçamentos</h1>
            <p className="text-muted-foreground">
              Acompanhe e aprove orçamentos de manutenção de veículos
            </p>
          </div>
          <div className="space-x-2">
            <Button onClick={() => fetchBudgetRequests()} variant="outline">
              Atualizar Solicitações
            </Button>
            <Button onClick={() => fetchMaintenancesWithChats()}>
              Atualizar Manutenções
            </Button>
          </div>
        </div>

      {/* Solicitações de Orçamento da Base Campinas */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Solicitações de Orçamento - Base Campinas</CardTitle>
          <CardDescription>
            Solicitações de orçamento recebidas da Base Campinas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingBudgetRequests ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : budgetRequests.length === 0 ? (
            <Alert variant="default" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Nenhuma solicitação encontrada</AlertTitle>
              <AlertDescription>
                Não há solicitações de orçamento da Base Campinas.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Valor Estimado</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgetRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.title}
                    </TableCell>
                    <TableCell>{request.department}</TableCell>
                    <TableCell>{request.requester_name}</TableCell>
                    <TableCell>
                      {formatCurrency(Number(request.estimated_value))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityMap[request.priority]?.color || "default"}>
                        {priorityMap[request.priority]?.label || request.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusMap[request.status]?.color || "default"}>
                        {statusMap[request.status]?.label || request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(request.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            approveBudgetRequest(request.id, Number(request.estimated_value));
                          }}
                          disabled={request.status !== "pendente"}
                        >
                          Aprovar
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => {
                            rejectBudgetRequest(request.id, "Solicitação rejeitada pela Gestão de Frotas");
                          }}
                          disabled={request.status !== "pendente"}
                        >
                          Rejeitar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {renderStats()}

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="negotiation">Em Negociação</TabsTrigger>
          <TabsTrigger value="approved">Aprovados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Orçamentos de Manutenção</CardTitle>
              <CardDescription>
                Lista de todas as manutenções com orçamentos registrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredMaintenances.length === 0 ? (
                <Alert variant="default" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Nenhum dado encontrado</AlertTitle>
                  <AlertDescription>
                    Não há orçamentos de manutenção registrados.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Oficina</TableHead>
                      <TableHead>Base</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Orçamento Inicial</TableHead>
                      <TableHead>Orçamento Final</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaintenances.map((maintenance) => (
                      <TableRow key={maintenance.maintenanceChatId}>
                        <TableCell className="font-medium">
                          {maintenance.vehiclePlate} - {maintenance.vehicleModel}
                        </TableCell>
                        <TableCell>{maintenance.workshopName}</TableCell>
                        <TableCell>{maintenance.baseName}</TableCell>
                        <TableCell>
                          <Badge variant={statusMap[maintenance.status]?.color || "default"}>
                            {statusMap[maintenance.status]?.label || maintenance.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={priorityMap[maintenance.priority]?.color || "default"}>
                            {priorityMap[maintenance.priority]?.label || maintenance.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {maintenance.initialBudget 
                            ? formatCurrency(Number(maintenance.initialBudget)) 
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {maintenance.finalBudget 
                            ? formatCurrency(Number(maintenance.finalBudget)) 
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openChat(maintenance)}
                          >
                            {maintenance.status === "em_negociacao" ? "Negociar" : "Ver Chat"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="negotiation" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Orçamentos em Negociação</CardTitle>
              <CardDescription>
                Lista de manutenções com orçamentos pendentes de aprovação
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* O mesmo conteúdo da tabela é renderizado pelo filtro */}
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredMaintenances.length === 0 ? (
                <Alert variant="default" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Nenhum dado encontrado</AlertTitle>
                  <AlertDescription>
                    Não há orçamentos em negociação no momento.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Oficina</TableHead>
                      <TableHead>Base</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Orçamento Inicial</TableHead>
                      <TableHead>Orçamento Final</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaintenances.map((maintenance) => (
                      <TableRow key={maintenance.maintenanceChatId}>
                        <TableCell className="font-medium">
                          {maintenance.vehiclePlate} - {maintenance.vehicleModel}
                        </TableCell>
                        <TableCell>{maintenance.workshopName}</TableCell>
                        <TableCell>{maintenance.baseName}</TableCell>
                        <TableCell>
                          <Badge variant={statusMap[maintenance.status]?.color || "default"}>
                            {statusMap[maintenance.status]?.label || maintenance.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={priorityMap[maintenance.priority]?.color || "default"}>
                            {priorityMap[maintenance.priority]?.label || maintenance.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {maintenance.initialBudget 
                            ? formatCurrency(Number(maintenance.initialBudget)) 
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {maintenance.finalBudget 
                            ? formatCurrency(Number(maintenance.finalBudget)) 
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openChat(maintenance)}
                          >
                            Negociar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="approved" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Orçamentos Aprovados</CardTitle>
              <CardDescription>
                Lista de manutenções com orçamentos já aprovados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* O mesmo conteúdo da tabela é renderizado pelo filtro */}
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredMaintenances.length === 0 ? (
                <Alert variant="default" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Nenhum dado encontrado</AlertTitle>
                  <AlertDescription>
                    Não há orçamentos aprovados no sistema.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Oficina</TableHead>
                      <TableHead>Base</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Orçamento Inicial</TableHead>
                      <TableHead>Orçamento Final</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaintenances.map((maintenance) => (
                      <TableRow key={maintenance.maintenanceChatId}>
                        <TableCell className="font-medium">
                          {maintenance.vehiclePlate} - {maintenance.vehicleModel}
                        </TableCell>
                        <TableCell>{maintenance.workshopName}</TableCell>
                        <TableCell>{maintenance.baseName}</TableCell>
                        <TableCell>
                          <Badge variant={statusMap[maintenance.status]?.color || "default"}>
                            {statusMap[maintenance.status]?.label || maintenance.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={priorityMap[maintenance.priority]?.color || "default"}>
                            {priorityMap[maintenance.priority]?.label || maintenance.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {maintenance.initialBudget 
                            ? formatCurrency(Number(maintenance.initialBudget)) 
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {maintenance.finalBudget 
                            ? formatCurrency(Number(maintenance.finalBudget)) 
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openChat(maintenance)}
                          >
                            Ver Chat
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para exibir o chat */}
      <Dialog open={chatDialogOpen} onOpenChange={setChatDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Negociação de Orçamento - {selectedMaintenance?.vehiclePlate} ({selectedMaintenance?.vehicleModel})
            </DialogTitle>
            <DialogDescription>
              Oficina: {selectedMaintenance?.workshopName}
            </DialogDescription>
          </DialogHeader>
          
          {fetchingMessages ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 mb-4">
                <div>
                  <span className="font-semibold text-sm">Descrição: </span>
                  <span className="text-sm">{selectedMaintenance?.description}</span>
                </div>
                <div>
                  <span className="font-semibold text-sm">Status: </span>
                  <Badge variant={statusMap[selectedMaintenance?.status || ""]?.color || "default"}>
                    {statusMap[selectedMaintenance?.status || ""]?.label || selectedMaintenance?.status}
                  </Badge>
                </div>
                
                {/* Informações do orçamento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 border-t pt-2">
                  <div>
                    <span className="font-semibold text-sm">Orçamento Inicial: </span>
                    <span className="text-sm">
                      {selectedMaintenance?.initialBudget 
                        ? formatCurrency(Number(selectedMaintenance.initialBudget)) 
                        : "Não informado"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-sm">Orçamento Final: </span>
                    <span className="text-sm">
                      {selectedMaintenance?.finalBudget 
                        ? formatCurrency(Number(selectedMaintenance.finalBudget)) 
                        : "Ainda não finalizado"}
                    </span>
                  </div>
                </div>
                
                {/* Novas informações adicionais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t pt-2 mt-1">
                  {selectedMaintenance?.vehiclePlate && (
                    <div>
                      <span className="font-semibold text-sm">Placa do Veículo (Informada): </span>
                      <span className="text-sm uppercase">{selectedMaintenance.vehiclePlate}</span>
                    </div>
                  )}

                  {selectedMaintenance?.kmAtual && (
                    <div>
                      <span className="font-semibold text-sm">Quilometragem Atual: </span>
                      <span className="text-sm">{selectedMaintenance.kmAtual} km</span>
                    </div>
                  )}
                  
                  {selectedMaintenance?.prazoEstimado && (
                    <div>
                      <span className="font-semibold text-sm">Prazo Estimado: </span>
                      <span className="text-sm">{selectedMaintenance.prazoEstimado} dias</span>
                    </div>
                  )}
                </div>
                
                {/* Descrição detalhada do serviço */}
                {selectedMaintenance?.descricaoServico && (
                  <div className="border-t pt-2 mt-1">
                    <span className="font-semibold text-sm">Descrição do Serviço: </span>
                    <p className="text-sm mt-1 text-muted-foreground bg-muted/30 p-2 rounded">
                      {selectedMaintenance.descricaoServico}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="border rounded-md p-4 h-64 overflow-y-auto">
                {selectedMaintenance && (
                  <MaintenanceChatHistory 
                    maintenanceId={selectedMaintenance.id}
                    chatId={selectedMaintenance.maintenanceChatId} 
                    initialMessages={chatMessages}
                    isWorkshop={false}
                    refreshChat={() => fetchChatMessages(selectedMaintenance.id)}
                    readOnly={selectedMaintenance.isFinalized || selectedMaintenance.status === "orcamento_aprovado"}
                  />
                )}
              </div>
              
              <DialogFooter>
                {!selectedMaintenance?.isFinalized && selectedMaintenance?.status === "em_negociacao" && (
                  <Button 
                    onClick={() => {
                      if (selectedMaintenance && selectedMaintenance.initialBudget) {
                        finalizeNegotiation(
                          selectedMaintenance.maintenanceChatId, 
                          Number(selectedMaintenance.initialBudget)
                        );
                      }
                    }}
                    variant="default"
                  >
                    Aprovar Orçamento
                  </Button>
                )}
                <Button variant="outline" onClick={() => setChatDialogOpen(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </AppLayout>
  );
}