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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import MaintenanceChatHistory from "@/components/chat/MaintenanceChatHistory";
import { formatCurrency } from "@/lib/utils";
import { CircleAlert, BarChart3, CheckCircle, Clock, AlertCircle, FileText, Search, DollarSign, Calendar, CreditCard } from "lucide-react";
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

interface Workshop {
  id: number;
  nome: string;
  cnpj: string;
  nome_fantasia: string;
  email: string;
}

interface WorkshopBudget {
  id: number;
  workshop_id: number;
  workshop_name: string;
  total_cost: number;
  status: string;
  is_billed: boolean;
  installments: number;
  due_dates: string[];
  created_at: string;
  approved_date: string;
}

interface BillingData {
  workshopId: number;
  workshopName: string;
  totalValue: number;
  installments: number;
  dueDates: string[];
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
  
  // Estados para busca por oficina e período
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<number | null>(null);
  const [searchWorkshop, setSearchWorkshop] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [workshopBudgets, setWorkshopBudgets] = useState<WorkshopBudget[]>([]);
  const [loadingWorkshopBudgets, setLoadingWorkshopBudgets] = useState(false);
  
  // Estados para configuração de faturamento
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  const [billingData, setBillingData] = useState<BillingData>({
    workshopId: 0,
    workshopName: "",
    totalValue: 0,
    installments: 1,
    dueDates: []
  });
  
  // Estados para acompanhamento de faturamento
  const [billingTrackingData, setBillingTrackingData] = useState<any[]>([]);
  const [loadingBillingTracking, setLoadingBillingTracking] = useState(false);

  // Função para obter as solicitações de orçamento da Base Campinas
  const fetchBudgetRequests = async () => {
    try {
      setLoadingBudgetRequests(true);
      const response = await apiRequest("GET", "/api/fleet/budget-requests");
      const data = await response.json();
      console.log("Solicitações de orçamento:", data);
      setBudgetRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar solicitações de orçamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as solicitações de orçamento",
        variant: "destructive"
      });
      setBudgetRequests([]);
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

  // Carregar dados iniciais
  useEffect(() => {
    fetchMaintenancesWithChats();
    fetchBudgetRequests();
    fetchWorkshops();
    fetchBillingTrackingData();
  }, []);

  // Função para buscar oficinas
  const fetchWorkshops = async () => {
    try {
      const response = await apiRequest("GET", "/api/workshops");
      const data = await response.json();
      setWorkshops(data);
    } catch (error) {
      console.error("Erro ao buscar oficinas:", error);
    }
  };

  // Função para buscar orçamentos de uma oficina em período específico
  const fetchWorkshopBudgets = async () => {
    if (!selectedWorkshopId || !dateFrom || !dateTo) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione uma oficina e o período de data",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoadingWorkshopBudgets(true);
      const response = await apiRequest(
        "GET", 
        `/api/fleet/workshop-budgets?workshopId=${selectedWorkshopId}&dateFrom=${dateFrom}&dateTo=${dateTo}`
      );
      const data = await response.json();
      setWorkshopBudgets(data);
    } catch (error) {
      console.error("Erro ao buscar orçamentos da oficina:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os orçamentos da oficina",
        variant: "destructive"
      });
    } finally {
      setLoadingWorkshopBudgets(false);
    }
  };

  // Função para buscar dados de acompanhamento de faturamento
  const fetchBillingTrackingData = async () => {
    try {
      setLoadingBillingTracking(true);
      const response = await apiRequest("GET", "/api/fleet/billing-tracking");
      const data = await response.json();
      setBillingTrackingData(data);
    } catch (error) {
      console.error("Erro ao buscar dados de faturamento:", error);
    } finally {
      setLoadingBillingTracking(false);
    }
  };

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

  // Função para configurar faturamento de oficina
  const configureBilling = async () => {
    try {
      const selectedWorkshop = workshops.find(w => w.id === selectedWorkshopId);
      if (!selectedWorkshop) return;

      const totalValue = workshopBudgets
        .filter(b => b.status === "aprovado")
        .reduce((sum, b) => sum + b.total_cost, 0);

      setBillingData({
        workshopId: selectedWorkshop.id,
        workshopName: selectedWorkshop.nome,
        totalValue,
        installments: 1,
        dueDates: []
      });
      setBillingDialogOpen(true);
    } catch (error) {
      console.error("Erro ao configurar faturamento:", error);
    }
  };

  // Função para calcular datas de vencimento
  const calculateDueDates = (installments: number, firstDueDate: string): string[] => {
    const dates = [];
    const startDate = new Date(firstDueDate);
    
    for (let i = 0; i < installments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(startDate.getMonth() + i);
      dates.push(dueDate.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  // Função para salvar configuração de faturamento
  const saveBillingConfiguration = async () => {
    try {
      const response = await apiRequest("POST", "/api/fleet/configure-billing", {
        workshopId: billingData.workshopId,
        totalValue: billingData.totalValue,
        installments: billingData.installments,
        dueDates: billingData.dueDates,
        budgetIds: workshopBudgets.filter(b => b.status === "aprovado").map(b => b.id)
      });

      toast({
        title: "Sucesso",
        description: "Configuração de faturamento salva com sucesso",
        // @ts-ignore
        variant: "success"
      });

      setBillingDialogOpen(false);
      fetchBillingTrackingData();
      fetchWorkshopBudgets();
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a configuração de faturamento",
        variant: "destructive"
      });
    }
  };

  // Filtrar oficinas pela busca
  const filteredWorkshops = workshops.filter(workshop =>
    workshop.nome.toLowerCase().includes(searchWorkshop.toLowerCase()) ||
    workshop.cnpj.includes(searchWorkshop)
  );

  // Renderizar estatísticas
  const renderStats = () => {
    const totalNegociacao = maintenances.filter(m => m.status === "em_negociacao").length;
    const totalAprovado = maintenances.filter(m => m.status === "orcamento_aprovado").length;
    const totalPendente = maintenances.filter(m => !m.finalBudget && !m.isFinalized).length;
    const totalFaturado = billingTrackingData.reduce((sum, item) => sum + item.total_value, 0);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valor Faturado</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalFaturado)}</div>
            <p className="text-xs text-muted-foreground">
              Total de valores faturados
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
          approvedBy: "Administrador"
        }
      );
      
      toast({
        title: "Sucesso",
        description: "Solicitação de orçamento aprovada com sucesso",
        // @ts-ignore - Issue with variant type
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
        // @ts-ignore - Issue with variant type
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

        {/* Seção de Busca por Oficina e Período */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Busca de Orçamentos por Oficina
            </CardTitle>
            <CardDescription>
              Selecione uma oficina e período para visualizar orçamentos e configurar faturamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="search-workshop">Buscar Oficina</Label>
                <Input
                  id="search-workshop"
                  placeholder="Nome ou CNPJ da oficina..."
                  value={searchWorkshop}
                  onChange={(e) => setSearchWorkshop(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workshop-select">Selecionar Oficina</Label>
                <Select value={selectedWorkshopId?.toString() || ""} onValueChange={(value) => setSelectedWorkshopId(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma oficina" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredWorkshops.map((workshop) => (
                      <SelectItem key={workshop.id} value={workshop.id.toString()}>
                        {workshop.nome} - {workshop.cnpj}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-from">Data Inicial</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-to">Data Final</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchWorkshopBudgets} disabled={loadingWorkshopBudgets}>
                {loadingWorkshopBudgets ? "Carregando..." : "Buscar Orçamentos"}
              </Button>
              {workshopBudgets.length > 0 && (
                <Button onClick={configureBilling} variant="outline">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Configurar Faturamento
                </Button>
              )}
            </div>

            {/* Resultados da busca */}
            {workshopBudgets.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-4">Orçamentos Encontrados</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total de Orçamentos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{workshopBudgets.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Orçamentos Aprovados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {workshopBudgets.filter(b => b.status === "aprovado").length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Valor Total Aprovado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(
                          workshopBudgets
                            .filter(b => b.status === "aprovado")
                            .reduce((sum, b) => sum + b.total_cost, 0)
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número do Orçamento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data de Aprovação</TableHead>
                      <TableHead>Faturado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workshopBudgets.map((budget) => (
                      <TableRow key={budget.id}>
                        <TableCell className="font-medium">
                          #{budget.id}
                        </TableCell>
                        <TableCell>{formatCurrency(budget.total_cost)}</TableCell>
                        <TableCell>
                          <Badge variant={budget.status === "aprovado" ? "default" : "secondary"}>
                            {budget.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {budget.approved_date ? new Date(budget.approved_date).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={budget.is_billed ? "default" : "outline"}>
                            {budget.is_billed ? "Sim" : "Não"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cards de Acompanhamento de Faturamento */}
        {billingTrackingData.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Acompanhamento de Faturamento
              </CardTitle>
              <CardDescription>
                Valores faturados e datas de vencimento das oficinas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {billingTrackingData.map((billing, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{billing.workshop_name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Valor Total:</span>
                        <span className="font-semibold">{formatCurrency(billing.total_value)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Parcelas:</span>
                        <span className="font-semibold">{billing.installments}x</span>
                      </div>
                      {billing.due_dates && billing.due_dates.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-sm text-muted-foreground">Próximos Vencimentos:</span>
                          {billing.due_dates.slice(0, 3).map((date, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              <span className="text-xs">
                                {new Date(date).toLocaleDateString()} - {formatCurrency(billing.total_value / billing.installments)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Solicitações de Orçamento das Bases */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Solicitações Bases - Murici</CardTitle>
          <CardDescription>
            Solicitações de orçamento recebidas das bases operacionais
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
                Não há solicitações de orçamento das bases.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Base</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Valor Estimado</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Anexo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgetRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.base_name || "Base Murici"}
                    </TableCell>
                    <TableCell>
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
                    <TableCell>
                      {request.budget_file_name ? (
                        <span className="text-blue-600 flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          {request.budget_file_name}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="ml-2 h-6 px-2 py-1"
                            onClick={async () => {
                              try {
                                // Mostrar status de carregamento
                                toast({
                                  title: "Buscando anexo...",
                                  description: "Verificando disponibilidade do anexo no sistema.",
                                  duration: 3000,
                                });
                                
                                // Acessar a API para obter informações sobre o anexo
                                const response = await apiRequest("GET", `/api/fleet/budget-requests/${request.id}/download-attachment`);
                                
                                if (!response.ok) {
                                  throw new Error(`Erro de servidor: ${response.status}`);
                                }
                                
                                const attachmentInfo = await response.json();
                                console.log("Informações do anexo:", attachmentInfo);
                                
                                // Verificar se o anexo tem uma URL de download permanente
                                if (attachmentInfo.downloadUrl) {
                                  // Se tiver uma URL permanente, abrir em nova aba
                                  toast({
                                    title: "Anexo encontrado",
                                    description: "O anexo está disponível e será aberto em uma nova aba.",
                                    // @ts-ignore
                                    variant: "success",
                                    duration: 5000
                                  });
                                  window.open(attachmentInfo.downloadUrl, '_blank');
                                } else if (attachmentInfo.permanentUrl) {
                                  // Alternativa para permanentUrl
                                  toast({
                                    title: "Anexo encontrado",
                                    description: "O anexo está disponível e será aberto em uma nova aba.",
                                    // @ts-ignore
                                    variant: "success",
                                    duration: 5000
                                  });
                                  window.open(attachmentInfo.permanentUrl, '_blank');
                                } else {
                                  // Se não tiver URL de download (caso de blobs temporários)
                                  toast({
                                    title: "Anexo temporário",
                                    description: attachmentInfo.message || 
                                      `O arquivo "${request.budget_file_name}" foi criado com armazenamento temporário e só está disponível na Base ${request.base_name}. Recomendamos solicitar um novo upload com armazenamento permanente.`,
                                    duration: 8000,
                                    // @ts-ignore
                                    variant: "warning"
                                  });
                                }
                              } catch (error) {
                                console.error("Erro ao obter informações do anexo:", error);
                                
                                // Mensagem de erro mais específica
                                toast({
                                  title: "Não foi possível acessar o anexo",
                                  description: `O anexo "${request.budget_file_name}" da base ${request.base_name || "de origem"} não pode ser acessado. O arquivo pode ter sido excluído ou movido.`,
                                  variant: "destructive",
                                  duration: 8000
                                });
                              }
                            }}
                          >
                            Visualizar
                          </Button>
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Sem anexo</span>
                      )}
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

      {/* Dialog de Configuração de Faturamento */}
      <Dialog open={billingDialogOpen} onOpenChange={setBillingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Faturamento</DialogTitle>
            <DialogDescription>
              Configure o faturamento e as datas de vencimento para {billingData.workshopName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Valor Total</Label>
              <Input
                value={formatCurrency(billingData.totalValue)}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="installments">Número de Parcelas</Label>
              <Select
                value={billingData.installments.toString()}
                onValueChange={(value) => {
                  const installments = parseInt(value);
                  setBillingData(prev => ({
                    ...prev,
                    installments,
                    dueDates: []
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}x de {formatCurrency(billingData.totalValue / num)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="first-due-date">Primeira Data de Vencimento</Label>
              <Input
                id="first-due-date"
                type="date"
                value={billingData.dueDates[0] || ""}
                onChange={(e) => {
                  const firstDate = e.target.value;
                  const dueDates = calculateDueDates(billingData.installments, firstDate);
                  setBillingData(prev => ({ ...prev, dueDates }));
                }}
              />
            </div>
            {billingData.dueDates.length > 1 && (
              <div className="space-y-2">
                <Label>Datas de Vencimento</Label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {billingData.dueDates.map((date, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3 w-3" />
                      <span>{index + 1}ª parcela: {new Date(date).toLocaleDateString()}</span>
                      <span className="text-muted-foreground">
                        - {formatCurrency(billingData.totalValue / billingData.installments)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBillingDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={saveBillingConfiguration}
              disabled={billingData.dueDates.length === 0}
            >
              Salvar Configuração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AppLayout>
  );
}