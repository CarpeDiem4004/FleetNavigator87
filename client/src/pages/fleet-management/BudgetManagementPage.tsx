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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import MaintenanceChatHistory from "@/components/chat/MaintenanceChatHistory";
import { formatCurrency } from "@/lib/utils";
import { CircleAlert, BarChart3, CheckCircle, Clock, AlertCircle, FileText, Search, DollarSign, Calendar, CreditCard, Plus, Eye, Printer, Trash2, X } from "lucide-react";
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
  name: string;
  cnpj: string;
  address?: string;
  phone?: string;
  email: string;
  contactPerson?: string;
  workshopType?: string;
  isActive?: boolean;
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

interface BudgetRequest {
  id: number;
  budget_number?: string;
  vehicle_plate: string;
  vehicle_model: string;
  description: string;
  workshop_id: number;
  workshop_name: string;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'em_analise';
  estimated_value?: number;
  approved_value?: number;
  requester_name?: string;
  created_at: string;
  approved_at?: string;
  approved_by?: number;
  approver_name?: string;
  chassis?: string;
  km?: number;
  projeto?: string;
  parts_json?: string;
  parts_details?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

interface BudgetSummary {
  total: number;
  pendente: number;
  aprovado: number;
  em_analise: number;
  valor_total_solicitado: number;
  valor_total_aprovado: number;
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
  
  // Função para formatar datas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [fetchingMessages, setFetchingMessages] = useState(false);
  const [budgetRequests, setBudgetRequests] = useState<BudgetRequest[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [loadingBudgetRequests, setLoadingBudgetRequests] = useState(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredBudgets, setFilteredBudgets] = useState<BudgetRequest[]>([]);
  
  // Estados para busca por oficina e período
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<number | null>(null);
  const [searchWorkshop, setSearchWorkshop] = useState("");
  const [dateFrom, setDateFrom] = useState("2025-01-01");
  const [dateTo, setDateTo] = useState("2025-12-31");
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

  // Estados para solicitar novo orçamento
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    vehicle_plate: "",
    km: "",
    vehicle_model: "",
    chassis: "",
    projeto: "",
    base_id: "",
    workshop_id: "",
    description: ""
  });

  // Estados para gerenciar lista de peças/serviços
  const [budgetItems, setBudgetItems] = useState<Array<{
    name: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>>([]);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    quantity: 1,
    unit_price: 0
  });
  const [bases, setBases] = useState<{id: number, name: string, project_id?: number}[]>([]);
  const [projects, setProjects] = useState<{id: number, name: string}[]>([]);
  const [filteredBases, setFilteredBases] = useState<{id: number, name: string, project_id?: number}[]>([]);

  // Estados para aprovação/recusa de orçamentos
  const [rejectingBudget, setRejectingBudget] = useState<BudgetRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deletingBudget, setDeletingBudget] = useState<BudgetRequest | null>(null);
  
  // Estados para visualizar orçamento
  const [viewingBudget, setViewingBudget] = useState<BudgetRequest | null>(null);
  const [viewBudgetDialogOpen, setViewBudgetDialogOpen] = useState(false);

  // Função para filtrar oficinas com base na pesquisa
  const filteredWorkshops = workshops.filter(workshop => 
    (workshop.name || '').toLowerCase().includes(searchWorkshop.toLowerCase()) ||
    (workshop.cnpj || '').includes(searchWorkshop)
  );

  // Funções para gerenciar lista de peças/serviços
  const addBudgetItem = () => {
    if (!newItem.name || !newItem.description) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome e descrição da peça/serviço",
        variant: "destructive"
      });
      return;
    }

    const item = {
      ...newItem,
      unit_price: 0, // A oficina vai preencher o preço
      total_price: 0  // A oficina vai calcular o total
    };

    setBudgetItems(prev => [...prev, item]);
    setNewItem({
      name: "",
      description: "",
      quantity: 1,
      unit_price: 0
    });

    toast({
      title: "Item adicionado",
      description: "Peça/serviço adicionado à lista",
    });
  };

  const removeBudgetItem = (index: number) => {
    setBudgetItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotalBudget = () => {
    return budgetItems.reduce((total, item) => total + item.total_price, 0);
  };

  // Função para resetar o formulário de solicitação
  const resetRequestForm = () => {
    setRequestForm({
      vehicle_plate: "",
      km: "",
      vehicle_model: "",
      chassis: "",
      projeto: "",
      base_id: "",
      workshop_id: "",
      description: ""
    });
    setBudgetItems([]);
    setNewItem({
      name: "",
      description: "",
      quantity: 1,
      unit_price: 0
    });
  };

  // Função para obter os orçamentos recebidos das oficinas com filtros
  const fetchBudgetRequests = async (useFilters = false) => {
    try {
      setLoadingBudgetRequests(true);
      
      // Construir parâmetros de consulta baseados nos filtros se solicitado
      let url = `/api/campinas/budget-requests`;
      
      if (useFilters) {
        const queryParams = new URLSearchParams();
        
        // Adicionar filtro de oficina se selecionada
        if (selectedWorkshopId) {
          queryParams.append('workshop_id', selectedWorkshopId.toString());
        }
        
        // Adicionar filtros de data se especificados
        if (dateFrom) {
          queryParams.append('date_from', dateFrom);
        }
        
        if (dateTo) {
          queryParams.append('date_to', dateTo);
        }
        
        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }
      }
      
      console.log('[BudgetSearch] URL da busca:', url);
      
      const response = await apiRequest("GET", url);
      const result = await response.json();
      
      if (result.success) {
        // Processar parts_json para parts_details
        const processedData = (result.data || []).map((budget: any) => {
          let parts_details = [];
          if (budget.parts_json) {
            try {
              
              // Fazer parse duplo se necessário
              let parsed = budget.parts_json;
              if (typeof parsed === 'string') {
                parsed = JSON.parse(parsed);
              }
              if (typeof parsed === 'string') {
                parsed = JSON.parse(parsed);
              }
              
              const rawParts = Array.isArray(parsed) ? parsed : [];
              
              parts_details = rawParts.map(part => {
                // Suporte para diferentes formatos de dados
                const unitPrice = part.unitPrice || part.unit_price || part.value || 0;
                const quantity = part.quantity || 1;
                const totalPrice = part.total || part.total_price || (quantity * unitPrice);
                
                return {
                  description: part.description || part.name || 'Peça sem nome',
                  quantity: quantity,
                  unitPrice: unitPrice,
                  total: totalPrice
                };
              });
            } catch (error) {
              console.error("Erro ao fazer parse do JSON das peças:", error);
              parts_details = [];
            }
          }
          
          // FALLBACK: Se não há parts_details válidos, criar entrada genérica com a descrição
          if (!parts_details || parts_details.length === 0) {
            const estimatedValue = budget.estimated_value || budget.approved_value || 0;
            parts_details = [{
              description: budget.description || 'Serviço de manutenção',
              quantity: 1,
              unitPrice: estimatedValue,
              total: estimatedValue
            }];
          }
          
          return {
            ...budget,
            parts_details
          };
        });
        
        setBudgetRequests(processedData);
        setBudgetSummary(result.summary);
        setFilteredBudgets(processedData);
        setWorkshopBudgets(processedData); // Manter compatibilidade
        console.log(`Orçamentos carregados: ${processedData.length}`);
        
        if (useFilters) {
          toast({
            title: "Busca concluída",
            description: `${processedData.length} orçamentos encontrados para o período selecionado`,
            variant: "default"
          });
        }
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao buscar orçamentos",
          variant: "destructive"
        });
        setBudgetRequests([]);
        setFilteredBudgets([]);
        setWorkshopBudgets([]);
      }
    } catch (error) {
      console.error("Erro ao buscar orçamentos das oficinas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os orçamentos das oficinas",
        variant: "destructive"
      });
      setBudgetRequests([]);
      setFilteredBudgets([]);
      setWorkshopBudgets([]);
    } finally {
      setLoadingBudgetRequests(false);
      setLoadingWorkshopBudgets(false);
    }
  };

  // Função para aprovar orçamento
  const handleApproveBudget = async (budget: BudgetRequest) => {
    try {
      const response = await apiRequest("PUT", `/api/campinas/budget-requests/${budget.id}/approve`, {
        approvedBy: 1,
        approvedAt: new Date().toISOString()
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Orçamento aprovado com sucesso!",
          variant: "default"
        });
        // Recarregar a lista de orçamentos
        fetchBudgetRequests();
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao aprovar orçamento",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao aprovar orçamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o orçamento",
        variant: "destructive"
      });
    }
  };

  // Função para recusar orçamento
  const handleRejectBudget = async () => {
    if (!rejectingBudget || !rejectReason.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe o motivo da recusa",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiRequest("PUT", `/api/campinas/budget-requests/${rejectingBudget.id}/reject`, {
        rejectedBy: 1,
        rejectedAt: new Date().toISOString(),
        rejectionReason: rejectReason
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Orçamento recusado com sucesso!",
          variant: "default"
        });
        // Recarregar a lista de orçamentos
        fetchBudgetRequests();
        // Limpar o modal
        setRejectingBudget(null);
        setRejectReason("");
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao recusar orçamento",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao recusar orçamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível recusar o orçamento",
        variant: "destructive"
      });
    }
  };

  // Função para excluir orçamento
  const handleDeleteBudget = async () => {
    if (!deletingBudget) return;

    try {
      const response = await apiRequest("DELETE", `/api/campinas/budget-requests/${deletingBudget.id}`);
      const result = await response.json();

      if (result.success) {
        toast({
          title: "Orçamento excluído",
          description: "Orçamento excluído com sucesso",
          variant: "default"
        });
      } else {
        toast({
          title: "Erro",
          description: result.message || "Orçamento não encontrado ou já foi excluído",
          variant: "destructive"
        });
      }
      
      setDeletingBudget(null);
      fetchBudgetRequests();
      fetchBudgetSummary();
    } catch (error: any) {
      console.error("Erro ao excluir orçamento:", error);
      
      let errorMessage = "Erro ao excluir orçamento";
      if (error.message?.includes("404")) {
        errorMessage = "Orçamento não encontrado - pode ter sido excluído anteriormente";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      
      setDeletingBudget(null);
      // Atualiza a lista mesmo com erro para remover itens inexistentes
      fetchBudgetRequests();
      fetchBudgetSummary();
    }
  };

  // Função para limpar dados da AUTOFREI (apenas admin)
  const handleCleanupAutofreiData = async () => {
    const confirmed = window.confirm(
      "⚠️ ATENÇÃO: Esta ação irá limpar TODOS os dados da oficina AUTOFREI (orçamentos, faturamentos e configurações).\n\nEssa ação não pode ser desfeita. Deseja continuar?"
    );

    if (!confirmed) return;

    try {
      const response = await apiRequest("DELETE", "/api/campinas/cleanup-autofrei-data");
      const result = await response.json();

      if (result.success) {
        toast({
          title: "Limpeza concluída",
          description: `AUTOFREI: ${result.details.budgetsRemoved} orçamentos, ${result.details.billingConfigsRemoved} configs e ${result.details.tokensRemoved} tokens removidos`,
          variant: "default"
        });
        
        fetchBudgetRequests();
        fetchBudgetSummary();
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao limpar dados da AUTOFREI",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Erro ao limpar dados da AUTOFREI:", error);
      
      let errorMessage = "Erro ao limpar dados da AUTOFREI";
      if (error.message?.includes("403")) {
        errorMessage = "Acesso negado. Apenas administradores podem executar esta ação.";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Função para visualizar detalhes do orçamento
  const handleViewBudget = (budget: BudgetRequest) => {
    console.log('[ViewBudget] Budget original:', budget);
    console.log('[ViewBudget] parts_json tipo:', typeof budget.parts_json, 'valor:', budget.parts_json);
    
    // Processar parts_json para parts_details na visualização
    let processedBudget = { ...budget };
    
    // Sempre tentar processar parts_json se existir
    if (budget.parts_json) {
      try {
        // Fazer parse duplo se necessário (caso esteja como string escapada)
        let parsed = budget.parts_json;
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }
        
        const rawParts = Array.isArray(parsed) ? parsed : [];
        console.log('[ViewBudget] rawParts processados:', rawParts);
        
        if (rawParts.length > 0) {
          processedBudget.parts_details = rawParts.map(part => {
            const unitPrice = part.unitPrice || part.unit_price || part.value || 0;
            const quantity = part.quantity || 1;
            const totalPrice = part.total || part.total_price || (quantity * unitPrice);
            
            return {
              description: part.description || part.name || 'Peça sem nome',
              quantity: quantity,
              unitPrice: unitPrice,
              total: totalPrice
            };
          });
          console.log('[ViewBudget] ✅ parts_details criado do JSON:', processedBudget.parts_details);
        } else {
          // Se parts_json existe mas está vazio, criar entrada genérica
          const totalValue = budget.approved_value || budget.estimated_value || 0;
          processedBudget.parts_details = [{
            description: budget.description || 'Serviço',
            quantity: 1,
            unitPrice: totalValue,
            total: totalValue
          }];
          console.log('[ViewBudget] ⚠️ parts_json vazio, criado fallback:', processedBudget.parts_details);
        }
      } catch (error) {
        console.error("[ViewBudget] ❌ Erro ao processar parts_json:", error);
        // Em caso de erro, criar entrada genérica
        const totalValue = budget.approved_value || budget.estimated_value || 0;
        processedBudget.parts_details = [{
          description: budget.description || 'Serviço',
          quantity: 1,
          unitPrice: totalValue,
          total: totalValue
        }];
        console.log('[ViewBudget] Fallback criado após erro:', processedBudget.parts_details);
      }
    } else {
      // Se NÃO houver parts_json, criar uma entrada genérica com a descrição
      const totalValue = budget.approved_value || budget.estimated_value || 0;
      processedBudget.parts_details = [{
        description: budget.description || 'Serviço',
        quantity: 1,
        unitPrice: totalValue,
        total: totalValue
      }];
      console.log('[ViewBudget] 📝 Sem parts_json, criado fallback:', processedBudget.parts_details);
    }
    
    console.log('[ViewBudget] Budget final processado:', processedBudget);
    setViewingBudget(processedBudget);
    setViewBudgetDialogOpen(true);
  };

  // Função para imprimir orçamento
  const handlePrintBudget = () => {
    window.print();
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
  // Filtrar orçamentos por termo de busca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredBudgets(budgetRequests);
    } else {
      const filtered = budgetRequests.filter(budget => 
        budget.workshop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        budget.vehicle_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        budget.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBudgets(filtered);
    }
  }, [budgetRequests, searchTerm]);

  useEffect(() => {
    fetchMaintenancesWithChats();
    fetchBudgetRequests();
    fetchWorkshops();
    fetchBases();
    fetchProjects();
    // fetchBillingTrackingData(); // Desabilitado para evitar requisições desnecessárias
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

  // Função para buscar bases
  const fetchBases = async () => {
    try {
      const response = await apiRequest("GET", "/api/bases");
      const data = await response.json();
      // A API retorna { success: true, data: [...] }
      setBases(data.data || []);
    } catch (error) {
      console.error("Erro ao buscar bases:", error);
    }
  };

  // Função para buscar projetos
  const fetchProjects = async () => {
    try {
      const response = await apiRequest("GET", "/api/projects");
      const data = await response.json();
      setProjects(data.data || []);
    } catch (error) {
      console.error("Erro ao buscar projetos:", error);
    }
  };

  // Função para filtrar bases por projeto
  const handleProjectChange = (projectId: string) => {
    console.log("=== DEBUG FILTRO DE BASES ===");
    console.log("Projeto selecionado ID:", projectId);
    console.log("Total de bases carregadas:", bases.length);
    console.log("Primeiras 3 bases:", bases.slice(0, 3));
    
    setRequestForm(prev => ({
      ...prev, 
      projeto: projectId,
      base_id: "" // Limpa a base selecionada quando muda o projeto
    }));
    
    if (projectId) {
      // Filtrar bases pelo projeto selecionado usando projectId (camelCase do Drizzle)
      const projectIdNumber = parseInt(projectId);
      console.log("Projeto ID como número:", projectIdNumber);
      
      const basesDoProject = bases.filter(base => {
        console.log(`Base ${base.name} - projectId: ${base.projectId} (tipo: ${typeof base.projectId})`);
        return base.projectId === projectIdNumber;
      });
      
      console.log("Bases filtradas:", basesDoProject);
      setFilteredBases(basesDoProject);
    } else {
      setFilteredBases([]);
    }
  };

  // Função para submeter solicitação de orçamento
  const submitBudgetRequest = async () => {
    try {
      if (!requestForm.vehicle_plate || !requestForm.description || !requestForm.workshop_id) {
        toast({
          title: "Erro",
          description: "Placa, descrição e oficina são obrigatórios",
          variant: "destructive"
        });
        return;
      }

      const submitData = {
        ...requestForm,
        km: parseInt(requestForm.km) || 0,
        parts_json: budgetItems.length > 0 ? JSON.stringify(budgetItems) : null,
        estimated_value: calculateTotalBudget()
      };

      const response = await apiRequest("POST", "/api/campinas/budget-requests", submitData);

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Solicitação de orçamento enviada com sucesso",
          variant: "success"
        });
        
        resetRequestForm();
        setRequestDialogOpen(false);
        
        // Recarregar dados
        fetchBudgetRequests();
      } else {
        throw new Error("Erro ao enviar solicitação");
      }
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a solicitação de orçamento",
        variant: "destructive"
      });
    }
  };

  // Função para aplicar filtros nos orçamentos
  const handleFilterSearch = () => {
    console.log('[FilterSearch] Aplicando filtros:', {
      selectedWorkshopId,
      dateFrom,
      dateTo
    });
    
    // Buscar com filtros aplicados
    fetchBudgetRequests(true);
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
    if (activeTab === "approved") return maintenance.status === "aprovado";
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

      // Usar o valor total aprovado do summary se disponível, caso contrário calcular
      let totalValue = 0;
      
      if (budgetSummary && budgetSummary.valor_total_aprovado) {
        totalValue = budgetSummary.valor_total_aprovado;
      } else {
        totalValue = budgetRequests
          .filter(b => b.status === "aprovado")
          .reduce((sum, b) => sum + (b.approved_value || 0), 0);
      }

      console.log('[ConfigureFaturamento] Valor calculado:', totalValue, 'Summary:', budgetSummary);

      setBillingData({
        workshopId: selectedWorkshop.id,
        workshopName: selectedWorkshop.name,
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
        budgetIds: budgetRequests.filter(b => b.status === "aprovado").map(b => b.id)
      });

      toast({
        title: "Sucesso",
        description: "Configuração de faturamento salva com sucesso",
        // @ts-ignore
        variant: "success"
      });

      setBillingDialogOpen(false);
      fetchBillingTrackingData();
      fetchBudgetRequests();
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a configuração de faturamento",
        variant: "destructive"
      });
    }
  };


  // Renderizar estatísticas dos orçamentos
  const renderStats = () => {
    if (!budgetSummary) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="flex items-center p-6">
                <div className="w-8 h-8 bg-gray-300 rounded-lg animate-pulse mr-4"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-12 animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Orçamentos</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgetSummary.total}</div>
            <p className="text-xs text-muted-foreground">
              Orçamentos recebidos das oficinas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgetSummary.pendente}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando aprovação
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgetSummary.aprovado}</div>
            <p className="text-xs text-muted-foreground">
              Orçamentos aprovados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Solicitado</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(budgetSummary.valor_total_solicitado)}</div>
            <p className="text-xs text-muted-foreground">
              Valor total dos orçamentos
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
        `/api/campinas/budget-requests/${requestId}/approve`,
        {
          approvedBy: 1,
          approvedAt: new Date().toISOString()
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
        `/api/campinas/budget-requests/${requestId}/reject`,
        { 
          rejectedBy: 1,
          rejectedAt: new Date().toISOString(),
          rejectionReason: comments 
        }
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
            <Button onClick={() => setRequestDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Solicitar Orçamento
            </Button>
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
                        {workshop.name} - {workshop.cnpj}
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
              <Button onClick={handleFilterSearch} disabled={loadingBudgetRequests}>
                {loadingBudgetRequests ? "Carregando..." : "Buscar Orçamentos"}
              </Button>
              {budgetRequests.length > 0 && (
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
                      <div className="text-2xl font-bold">{budgetRequests.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Orçamentos Aprovados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {budgetRequests.filter(b => b.status === "aprovado").length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Valor Total Aprovado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {budgetSummary ? formatCurrency(budgetSummary.valor_total_aprovado || 0) : 'R$ 0,00'}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número do Orçamento</TableHead>
                      <TableHead>Placa do Veículo</TableHead>
                      <TableHead>Valor Solicitado</TableHead>
                      <TableHead>Valor Aprovado</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data de Aprovação</TableHead>
                      <TableHead>Faturado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgetRequests.map((budget) => (
                      <TableRow key={budget.id}>
                        <TableCell className="font-medium">
                          #{budget.id}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-blue-600">
                            {budget.vehicle_plate || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {formatCurrency(budget.estimated_value || 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {budget.approved_value ? (
                            <span className="font-medium text-green-600">
                              {formatCurrency(budget.approved_value)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="default"
                            className={
                              budget.status === 'aprovado' ? 'bg-green-100 text-green-800 border-green-300' :
                              budget.status === 'pendente' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                              budget.status === 'em_analise' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                              budget.status === 'rejeitado' ? 'bg-red-100 text-red-800 border-red-300' :
                              'bg-gray-100 text-gray-800 border-gray-300'
                            }
                          >
                            {budget.status === 'pendente' ? '⏳ Aguardando' :
                             budget.status === 'aprovado' ? '✅ Aprovado' :
                             budget.status === 'em_analise' ? '🔍 Em Análise' :
                             budget.status === 'rejeitado' ? '❌ Rejeitado' :
                             budget.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {budget.approved_at ? formatDate(budget.approved_at) : '-'}
                        </TableCell>
                        <TableCell>
                          {budget.status === 'aprovado' ? (
                            <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                              💰 Faturado
                            </Badge>
                          ) : budget.status === 'pendente' ? (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                              ⏳ Aguardando Aprovação
                            </Badge>
                          ) : budget.status === 'rejeitado' ? (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                              ❌ Não Faturado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
                              📋 Em Análise
                            </Badge>
                          )}
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

      {/* SEÇÃO REMOVIDA: Esta funcionalidade foi movida para a aba "Orçamentos das Oficinas" */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Nova Funcionalidade Disponível</AlertTitle>
            <AlertDescription>
              Os orçamentos das oficinas agora estão organizados na aba "Orçamentos das Oficinas" logo abaixo desta mensagem. 
              Clique na aba para visualizar todos os orçamentos recebidos das oficinas parceiras.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {renderStats()}

      {/* Nova seção para as Abas de Orçamentos */}
      <Tabs defaultValue="approved" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="approved">Aprovados</TabsTrigger>
          <TabsTrigger value="workshop-budgets">Orçamentos das Oficinas</TabsTrigger>
        </TabsList>
        
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
              {loadingBudgetRequests ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : budgetRequests.filter(b => b.status === 'aprovado').length === 0 ? (
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
                      <TableHead>Descrição</TableHead>
                      <TableHead>Oficina</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valor Solicitado</TableHead>
                      <TableHead>Quem Aprovou</TableHead>
                      <TableHead>Data Aprovação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgetRequests.filter(b => b.status === 'aprovado').map((budget) => (
                      <TableRow key={budget.id}>
                        <TableCell className="font-medium">
                          {budget.description}
                        </TableCell>
                        <TableCell>{budget.workshop_name}</TableCell>
                        <TableCell>
                          {budget.vehicle_plate ? `${budget.vehicle_plate} - ${budget.vehicle_model}` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                            ✅ Aprovado
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {budget.estimated_value ? formatCurrency(budget.estimated_value) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {budget.approver_name || budget.approved_by || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {budget.approved_at ? formatDate(budget.approved_at) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewBudget(budget)}
                          >
                            Ver Detalhes
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

        {/* Nova Aba: Orçamentos Recebidos das Oficinas */}
        <TabsContent value="workshop-budgets" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Orçamentos Recebidos das Oficinas</CardTitle>
              <CardDescription>
                Lista de orçamentos submetidos por oficinas parceiras para aprovação
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Campo de pesquisa */}
              <div className="mb-6">
                <Label htmlFor="search">Pesquisar por oficina, veículo ou descrição</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Digite o nome da oficina, placa do veículo ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Botão de atualizar */}
              <div className="mb-4">
                <Button 
                  onClick={fetchBudgetRequests} 
                  disabled={loadingBudgetRequests}
                  variant="outline"
                >
                  {loadingBudgetRequests ? "Carregando..." : "Atualizar Orçamentos"}
                </Button>
              </div>

              {/* Lista de orçamentos */}
              {loadingBudgetRequests ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredBudgets.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nº Orçamento</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Oficina</TableHead>
                        <TableHead>Veículo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Valor Solicitado</TableHead>
                        <TableHead>Valor Aprovado</TableHead>
                        <TableHead>Data do Orçamento</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBudgets.map((budget) => {
                        // Calcular data de vencimento (30 dias após criação)
                        const createdDate = new Date(budget.created_at);
                        const dueDate = new Date(createdDate);
                        dueDate.setDate(dueDate.getDate() + 30);
                        const isOverdue = dueDate < new Date() && budget.status === 'pendente';
                        
                        return (
                          <TableRow key={budget.id}>
                            <TableCell>
                              <span className="font-mono text-sm font-medium text-blue-600">
                                {budget.budget_number || `#${budget.id}`}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium truncate max-w-sm">
                                  {budget.description}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Solicitante: {budget.requester_name}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>{budget.workshop_name}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{budget.vehicle_plate}</p>
                                <p className="text-sm text-gray-500">{budget.vehicle_model}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="default"
                                className={
                                  budget.status === 'aprovado' ? 'bg-green-100 text-green-800 border-green-300' :
                                  budget.status === 'pendente' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                                  budget.status === 'em_analise' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                  budget.status === 'em_negociacao' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                                  budget.status === 'recusado' ? 'bg-red-100 text-red-800 border-red-300' :
                                  'bg-gray-100 text-gray-800 border-gray-300'
                                }
                              >
                                {budget.status === 'pendente' ? '⏳ Aguardando' :
                                 budget.status === 'aprovado' ? '✅ Aprovado' :
                                 budget.status === 'em_analise' ? '🔍 Em Análise' :
                                 budget.status === 'em_negociacao' ? '💬 Em Negociação' :
                                 budget.status === 'recusado' ? '❌ Recusado' :
                                 budget.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">
                                {formatCurrency(budget.estimated_value || 0)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {budget.approved_value ? (
                                <span className="font-medium text-green-600">
                                  {formatCurrency(budget.approved_value)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(budget.created_at).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <div className={`text-sm ${
                                isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'
                              }`}>
                                {dueDate.toLocaleDateString('pt-BR')}
                                {isOverdue && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <AlertCircle className="h-3 w-3" />
                                    <span className="text-xs">Vencido</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleViewBudget(budget)}
                                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver
                                </Button>
                                {(budget.status === 'em_analise' || budget.status === 'em_negociacao') && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => handleApproveBudget(budget)}
                                      className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Aprovar
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => setRejectingBudget(budget)}
                                      className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                                    >
                                      <CircleAlert className="h-4 w-4 mr-1" />
                                      Recusar
                                    </Button>
                                  </>
                                )}
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setDeletingBudget(budget)}
                                  className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Excluir
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {searchTerm ? 'Nenhum orçamento encontrado' : 'Nenhum orçamento encontrado'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm 
                      ? 'Tente ajustar sua pesquisa ou limpe o filtro.' 
                      : 'Quando as oficinas enviarem orçamentos, eles aparecerão aqui para aprovação.'}
                  </p>
                </div>
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
                    readOnly={selectedMaintenance.isFinalized || selectedMaintenance.status === "aprovado"}
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
                  // Criar array vazio para as datas de vencimento
                  const dueDates = Array(installments).fill('');
                  setBillingData(prev => ({
                    ...prev,
                    installments,
                    dueDates
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}x de {formatCurrency((billingData.totalValue || 0) / num)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Campos de data para cada parcela */}
            {billingData.installments > 0 && (
              <div className="space-y-3">
                <Label>Datas de Vencimento das Parcelas</Label>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {Array(billingData.installments).fill(null).map((_, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium whitespace-nowrap">
                          {index + 1}ª parcela:
                        </span>
                        <Input
                          type="date"
                          value={billingData.dueDates[index] || ""}
                          onChange={(e) => {
                            const newDueDates = [...billingData.dueDates];
                            newDueDates[index] = e.target.value;
                            setBillingData(prev => ({ ...prev, dueDates: newDueDates }));
                          }}
                          className="flex-1 min-w-0"
                          placeholder="dd/mm/aaaa"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatCurrency((billingData.totalValue || 0) / (billingData.installments || 1))}
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

      {/* Modal para Solicitar Orçamento */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Solicitar Orçamento</DialogTitle>
            <DialogDescription>
              Preencha as informações do veículo para solicitar um orçamento
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="placa">Placa*</Label>
              <Input
                id="placa"
                value={requestForm.vehicle_plate}
                onChange={(e) => setRequestForm(prev => ({...prev, vehicle_plate: e.target.value}))}
                placeholder="Ex: ABC-1234"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="km">KM</Label>
              <Input
                id="km"
                type="number"
                value={requestForm.km}
                onChange={(e) => setRequestForm(prev => ({...prev, km: e.target.value}))}
                placeholder="Ex: 120000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chassis">Chassis</Label>
              <Input
                id="chassis"
                value={requestForm.chassis}
                onChange={(e) => setRequestForm(prev => ({...prev, chassis: e.target.value}))}
                placeholder="Ex: 9BM958040R1234567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo</Label>
              <Select value={requestForm.vehicle_model} onValueChange={(value) => setRequestForm(prev => ({...prev, vehicle_model: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fiorino">Fiorino</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                  <SelectItem value="vuc">VUC</SelectItem>
                  <SelectItem value="toco">Toco</SelectItem>
                  <SelectItem value="truck">Truck</SelectItem>
                  <SelectItem value="cavalo_mecanico">Cavalo Mecânico</SelectItem>
                  <SelectItem value="carreta">Carreta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="projeto">Projeto</Label>
              <Select value={requestForm.projeto} onValueChange={handleProjectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="base">Base</Label>
              <Select 
                value={requestForm.base_id} 
                onValueChange={(value) => setRequestForm(prev => ({...prev, base_id: value}))}
                disabled={!requestForm.projeto}
              >
                <SelectTrigger>
                  <SelectValue placeholder={requestForm.projeto ? "Selecione a base" : "Primeiro selecione um projeto"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredBases.map((base) => (
                    <SelectItem key={base.id} value={base.id.toString()}>
                      {base.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="oficina">Oficina*</Label>
              <Select value={requestForm.workshop_id} onValueChange={(value) => setRequestForm(prev => ({...prev, workshop_id: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a oficina" />
                </SelectTrigger>
                <SelectContent>
                  {workshops.map((workshop) => (
                    <SelectItem key={workshop.id} value={workshop.id.toString()}>
                      {workshop.name} - {workshop.cnpj}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição*</Label>
            <textarea
              id="descricao"
              className="w-full min-h-[100px] px-3 py-2 border border-input bg-background rounded-md text-sm"
              value={requestForm.description}
              onChange={(e) => setRequestForm(prev => ({...prev, description: e.target.value}))}
              placeholder="Descreva detalhadamente o problema ou serviço necessário..."
            />
          </div>
          
          {/* Seção para adicionar peças/serviços */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium">Lista de Peças/Serviços</h4>
            <p className="text-xs text-gray-600">Adicione as peças ou serviços que precisam de orçamento. A oficina vai preencher os preços.</p>
            
            {/* Formulário para adicionar nova peça */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="nome-peca">Nome da Peça/Serviço</Label>
                <Input
                  id="nome-peca"
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({...prev, name: e.target.value}))}
                  placeholder="Ex: Amortecedor dianteiro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao-peca">Descrição</Label>
                <Input
                  id="descricao-peca"
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({...prev, description: e.target.value}))}
                  placeholder="Ex: Par de amortecedores lado direito"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantidade">Quantidade</Label>
                <Input
                  id="quantidade"
                  type="number"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem(prev => ({...prev, quantity: parseInt(e.target.value) || 1}))}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  type="button" 
                  onClick={addBudgetItem}
                  className="w-full"
                  variant="outline"
                >
                  Adicionar à Lista
                </Button>
              </div>
            </div>
            
            {/* Lista de peças adicionadas */}
            {budgetItems.length > 0 && (
              <div className="space-y-2">
                <Label>Peças/Serviços Adicionados ({budgetItems.length})</Label>
                <div className="border rounded-lg max-h-40 overflow-y-auto">
                  {budgetItems.map((item, index) => (
                    <div key={index} className="p-3 border-b last:border-b-0 flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-gray-600">{item.description}</p>
                        )}
                        <p className="text-xs text-gray-500">Quantidade: {item.quantity}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBudgetItem(index)}
                        className="text-red-600 hover:text-red-800 ml-2"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetRequestForm(); setRequestDialogOpen(false); }}>
              Cancelar
            </Button>
            <Button onClick={submitBudgetRequest} className="bg-green-600 hover:bg-green-700">
              Enviar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Visualizar Orçamento */}
      <Dialog open={viewBudgetDialogOpen} onOpenChange={setViewBudgetDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-blue-50 p-6">
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-gray-800">Detalhes do Orçamento</h2>
              {viewingBudget?.budget_number && (
                <span className="font-mono text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded">
                  {viewingBudget.budget_number}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">Visualização completa do orçamento para impressão</p>
          </div>
          
          {viewingBudget && (
            <div className="space-y-4">
              {/* Informações do Veículo e Status e Valores */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Informações do Veículo</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Placa:</strong> {viewingBudget.vehicle_plate}</p>
                    <p><strong>Modelo:</strong> {viewingBudget.vehicle_model}</p>
                    {viewingBudget.chassis && <p><strong>Chassis:</strong> {viewingBudget.chassis}</p>}
                    {viewingBudget.km && <p><strong>KM:</strong> {viewingBudget.km.toLocaleString()}</p>}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Status e Valores</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <strong>Status:</strong> 
                      <Badge 
                        variant={
                          viewingBudget.status === 'aprovado' ? 'default' : 
                          viewingBudget.status === 'pendente' ? 'secondary' : 
                          viewingBudget.status === 'em_analise' ? 'outline' :
                          'destructive'
                        }
                        className="ml-2"
                      >
                        {viewingBudget.status === 'pendente' ? 'Aguardando' :
                         viewingBudget.status === 'aprovado' ? 'Aprovado' :
                         viewingBudget.status === 'em_analise' ? 'Em Análise' : viewingBudget.status}
                      </Badge>
                    </div>
                    <p><strong>Valor Solicitado:</strong> {formatCurrency(viewingBudget.estimated_value || 0)}</p>
                    {viewingBudget.approved_value && (
                      <p><strong>Valor Aprovado:</strong> <span className="text-green-600 font-medium">{formatCurrency(viewingBudget.approved_value)}</span></p>
                    )}
                  </div>
                </div>
              </div>

              {/* Oficina e Datas */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Oficina</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Nome:</strong> {viewingBudget.workshop_name}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Datas</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Data do Orçamento:</strong> {new Date(viewingBudget.created_at).toLocaleDateString('pt-BR')}</p>
                    {viewingBudget.approved_at && (
                      <p><strong>Data de Aprovação:</strong> {new Date(viewingBudget.approved_at).toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Descrição do Serviço - só exibir se houver peças detalhadas */}
              {viewingBudget.parts_json && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Descrição do Serviço</h3>
                  <div className="bg-white rounded-lg p-3 text-sm border border-gray-200">
                    <p className="whitespace-pre-line">{viewingBudget.description}</p>
                  </div>
                </div>
              )}

              {/* Peças e Materiais - SEMPRE EXIBIR */}
              {viewingBudget.parts_details && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Peças e Materiais</h3>
                  <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-blue-100">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Nome/Descrição</th>
                          <th className="px-3 py-2 text-center font-medium w-24">Quantidade</th>
                          <th className="px-3 py-2 text-right font-medium w-32">Valor Unitário</th>
                          <th className="px-3 py-2 text-right font-medium w-32">Valor Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingBudget.parts_details.map((part, index) => (
                          <tr key={index} className="border-t border-gray-200">
                            <td className="px-3 py-2">{part.description}</td>
                            <td className="px-3 py-2 text-center">{part.quantity}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(part.unitPrice)}</td>
                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(part.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-blue-50 border-t-2 border-blue-200">
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-right font-semibold">Total das Peças:</td>
                          <td className="px-3 py-2 text-right font-bold text-blue-700">
                            {formatCurrency(
                              viewingBudget.parts_details.reduce((sum, part) => sum + part.total, 0)
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Solicitante e Projeto */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Solicitante</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Nome:</strong> {viewingBudget.requester_name || 'Não informado'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Projeto</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Projeto:</strong> {viewingBudget.project_name || viewingBudget.projeto || 'Não informado'}</p>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-300">
                <Button 
                  variant="outline" 
                  onClick={() => setViewBudgetDialogOpen(false)}
                  className="bg-white hover:bg-gray-100"
                >
                  Fechar
                </Button>
                <Button 
                  onClick={handlePrintBudget}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para Recusar Orçamento */}
      <Dialog open={!!rejectingBudget} onOpenChange={(open) => !open && setRejectingBudget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar Orçamento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja recusar o orçamento de "{rejectingBudget?.workshop_name}" para o veículo {rejectingBudget?.vehicle_plate}?
              Por favor, informe o motivo da recusa:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Motivo da Recusa</Label>
              <Textarea
                id="reject-reason"
                placeholder="Digite o motivo da recusa..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-1"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setRejectingBudget(null);
                setRejectReason("");
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRejectBudget}
              disabled={!rejectReason.trim()}
            >
              <CircleAlert className="h-4 w-4 mr-2" />
              Recusar Orçamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Confirmar Exclusão de Orçamento */}
      <Dialog open={!!deletingBudget} onOpenChange={(open) => !open && setDeletingBudget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir permanentemente o orçamento de "{deletingBudget?.workshop_name}" para o veículo {deletingBudget?.vehicle_plate}?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeletingBudget(null)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteBudget}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Orçamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AppLayout>
  );
}