import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from '@/components/ui/card';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Wrench, 
  Search, 
  DollarSign, 
  FilterIcon,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  FileText
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/utils';
import ChatOficina from '@/components/workshop/ChatOficina';

// Interfaces
interface BudgetChat {
  id: number;
  maintenanceId: number;
  initialBudget: number;
  finalBudget: number | null;
  isFinalized: boolean;
  created_at: string;
  updated_at: string;
  maintenanceDescription?: string;
  maintenanceVehiclePlate?: string;
  workshopName?: string;
  maintenanceStatus?: string;
}

// Interface para solicitações de orçamento da Base Campinas
interface CampinasBudgetRequest {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  requester_id: number;
  requester_name: string;
  created_at: string;
  updated_at: string;
  estimated_value: string;
  department: string;
  approved_value?: string;
  approved_by?: string;
  approved_at?: string;
  comments?: string;
  budget_file_url?: string;
  budget_file_name?: string;
  invoice_file_url?: string;
  invoice_file_name?: string;
  pending_invoice?: boolean;
  base_id?: number;
  base_name?: string;
}

// Componente para exibir o status de negociação
const BudgetStatusBadge = ({ status, isFinalized }: { status: string, isFinalized: boolean }) => {
  if (isFinalized) {
    return (
      <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="h-3 w-3" />
        Aprovado
      </Badge>
    );
  }
  
  switch(status) {
    case 'aguardando_orcamento':
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3" />
          Aguardando Orçamento
        </Badge>
      );
    case 'em_negociacao':
    case 'em_andamento':
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
          <MessageSquare className="h-3 w-3" />
          Em Negociação
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {status}
        </Badge>
      );
  }
};

export default function BudgetsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('negociacao');
  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<BudgetChat | null>(null);
  const [selectedCampinasRequest, setSelectedCampinasRequest] = useState<CampinasBudgetRequest | null>(null);
  const [isCampinasRequestDialogOpen, setIsCampinasRequestDialogOpen] = useState(false);
  const [showCampinasRequests, setShowCampinasRequests] = useState(false);
  const queryClient = useQueryClient();
  
  // Carregar todos os chats de orçamentos
  const { data: budgetChats = [], isLoading } = useQuery<BudgetChat[]>({
    queryKey: ['/api/fleet/budget-chats', { status: activeTab }],
    queryFn: async () => {
      try {
        let url = '/api/fleet/budget-chats';
        
        // Adicionar filtro por status se necessário
        if (activeTab !== 'todos') {
          url += `?status=${activeTab}`;
        }
        
        const response = await apiRequest('GET', url);
        if (!response.ok) {
          console.error(`Erro ao buscar orçamentos: ${response.status} ${response.statusText}`);
          return [];
        }
        return await response.json();
      } catch (error) {
        console.error("Erro ao buscar orçamentos:", error);
        return [];
      }
    },
    retry: false
  });
  
  // Carregar solicitações de orçamento da Base Campinas
  const { data: campinasRequests = [], isLoading: isLoadingCampinasRequests } = useQuery<CampinasBudgetRequest[]>({
    queryKey: ['/api/campinas/budget-requests'],
    queryFn: async () => {
      try {
        // Simulação temporária de dados - Em produção, isso deve fazer uma chamada real à API
        // Quando a API estiver disponível, substituir este código por uma chamada fetch real
        return [
          {
            id: 1,
            title: "Compra de equipamentos para manutenção",
            description: "Necessário adquirir ferramentas especializadas para a oficina de Campinas",
            priority: "alta",
            status: "aprovado",
            requester_id: 1,
            requester_name: "Administrador",
            created_at: "2025-05-07T10:30:00",
            updated_at: "2025-05-07T15:30:00",
            estimated_value: "5000.00",
            department: "Manutenção",
            approved_value: "4800.00",
            approved_by: "João Silva",
            approved_at: "2025-05-07T15:30:00",
            comments: "Aprovado com pequeno ajuste de valor",
            budget_file_name: "orcamento_equipamentos.pdf",
            budget_file_url: "#",
            base_id: 2,
            base_name: "Base Campinas",
            pending_invoice: true
          },
          {
            id: 2,
            title: "Reforma do espaço de lazer",
            description: "Reforma da área de descanso dos motoristas na base Campinas",
            priority: "média",
            status: "aprovado",
            requester_id: 1,
            requester_name: "Administrador",
            created_at: "2025-05-05T14:20:00",
            updated_at: "2025-05-06T09:15:00",
            estimated_value: "8500.00",
            department: "Infraestrutura",
            approved_value: "8000.00",
            approved_by: "João Silva",
            approved_at: "2025-05-06T09:15:00",
            comments: "Aprovado com valor reduzido",
            budget_file_name: "orcamento_reforma.pdf",
            budget_file_url: "#",
            invoice_file_name: "nota_fiscal_reforma.pdf",
            invoice_file_url: "#",
            base_id: 2,
            base_name: "Base Campinas",
            pending_invoice: false
          }
        ];
        
        // Código para a implementação real
        /*
        const response = await apiRequest('GET', '/api/campinas/budget-requests');
        return await response.json();
        */
      } catch (error) {
        console.error("Erro ao buscar solicitações de orçamento da Base Campinas:", error);
        return [];
      }
    }
  });
  
  // Filtrar budgetChats com base no searchTerm
  const filteredBudgetChats = budgetChats.filter(chat => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (chat.maintenanceDescription?.toLowerCase().includes(searchLower)) ||
      (chat.maintenanceVehiclePlate?.toLowerCase().includes(searchLower)) ||
      (chat.workshopName?.toLowerCase().includes(searchLower))
    );
  });
  
  // Filtrar solicitações de orçamento da Base Campinas com base no searchTerm
  const filteredCampinasRequests = campinasRequests.filter(request => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      request.title.toLowerCase().includes(searchLower) ||
      request.description.toLowerCase().includes(searchLower) ||
      request.department.toLowerCase().includes(searchLower) ||
      request.requester_name.toLowerCase().includes(searchLower)
    );
  });
  
  // Função para exibir detalhes da solicitação de orçamento da Base Campinas
  const handleOpenCampinasRequestDialog = (request: CampinasBudgetRequest) => {
    if (isMounted.current) {
      setSelectedCampinasRequest(request);
      setTimeout(() => {
        if (isMounted.current) {
          setIsCampinasRequestDialogOpen(true);
        }
      }, 10);
    }
  };
  
  // Referência para verificar se o componente está montado
  const isMounted = React.useRef(true);
  
  // Efeito para limpar a referência quando o componente desmontar
  React.useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Abrir diálogo de chat para negociação
  const handleOpenChatDialog = (chat: BudgetChat) => {
    if (isMounted.current) {
      setSelectedChat(chat);
      // Atraso pequeno para garantir que o estado anterior seja processado
      setTimeout(() => {
        if (isMounted.current) {
          setIsChatDialogOpen(true);
        }
      }, 10);
    }
  };
  
  // Função para formatar data
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <DollarSign className="mr-2 h-8 w-8" />
                Orçamentos
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie os orçamentos de manutenção enviados pelas oficinas
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Em Negociação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {budgetChats.filter(chat => !chat.isFinalized && (chat.maintenanceStatus === 'em_negociacao' || chat.maintenanceStatus === 'em_andamento')).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Aguardando Orçamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {budgetChats.filter(chat => !chat.isFinalized && chat.maintenanceStatus === 'aguardando_orcamento').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Aprovados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {budgetChats.filter(chat => chat.isFinalized).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Diálogo para o chat de orçamento */}
          {isChatDialogOpen && (
            <Dialog open={isChatDialogOpen} onOpenChange={setIsChatDialogOpen}>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Negociação de Orçamento</DialogTitle>
                  <DialogDescription>
                    {selectedChat?.workshopName && (
                      <span className="font-medium">Oficina: {selectedChat.workshopName}</span>
                    )}
                    {selectedChat?.maintenanceVehiclePlate && (
                      <span className="ml-2 font-medium">| Veículo: {selectedChat.maintenanceVehiclePlate}</span>
                    )}
                  </DialogDescription>
                </DialogHeader>
                
                {selectedChat && (
                  <div className="mt-4">
                    <ChatOficina 
                      maintenanceId={selectedChat.maintenanceId} 
                      chatId={selectedChat.id}
                    />
                  </div>
                )}
                
                <DialogFooter className="mt-4">
                  <Button onClick={() => {
                    setIsChatDialogOpen(false);
                    // Atualizar dados após fechar
                    queryClient.invalidateQueries({ queryKey: ['/api/fleet/budget-chats'] });
                  }}>
                    Fechar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Card para orçamentos da Base Campinas */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center">
                    <Building2 className="mr-2 h-5 w-5" />
                    Solicitações de Orçamento - Base Campinas
                  </CardTitle>
                  <CardDescription>
                    Visualize as solicitações de orçamento da Base Campinas
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowCampinasRequests(!showCampinasRequests)}
                  className="flex items-center gap-1"
                >
                  {showCampinasRequests ? 'Ocultar Solicitações' : 'Mostrar Solicitações'}
                </Button>
              </div>
            </CardHeader>
            
            {showCampinasRequests && (
              <CardContent>
                <div className="mb-4">
                  <div className="relative w-full md:w-[250px] ml-auto">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Buscar solicitações..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <CampinasBudgetTable 
                  requests={filteredCampinasRequests} 
                  isLoading={isLoadingCampinasRequests}
                  onOpenDetails={handleOpenCampinasRequestDialog}
                />
              </CardContent>
            )}
          </Card>
          
          {/* Modal para visualizar detalhes da solicitação da Base Campinas */}
          {selectedCampinasRequest && (
            <Dialog open={isCampinasRequestDialogOpen} onOpenChange={setIsCampinasRequestDialogOpen}>
              <DialogContent className="max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>Detalhes da Solicitação de Orçamento</DialogTitle>
                  <DialogDescription>
                    Base Campinas - {formatDate(selectedCampinasRequest.created_at)}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Título</h4>
                    <p className="text-base font-medium">{selectedCampinasRequest.title}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Descrição</h4>
                    <p className="text-sm whitespace-pre-line">{selectedCampinasRequest.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Departamento</h4>
                      <p className="text-sm">{selectedCampinasRequest.department}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Prioridade</h4>
                      <div className="mt-1">
                        <PriorityBadge priority={selectedCampinasRequest.priority} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Solicitante</h4>
                      <p className="text-sm">{selectedCampinasRequest.requester_name}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                      <div className="mt-1">
                        <CampinasBudgetStatusBadge status={selectedCampinasRequest.status} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Valor Estimado</h4>
                      <p className="text-sm">{formatCurrency(parseFloat(selectedCampinasRequest.estimated_value))}</p>
                    </div>
                    {selectedCampinasRequest.approved_value && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Valor Aprovado</h4>
                        <p className="text-sm">{formatCurrency(parseFloat(selectedCampinasRequest.approved_value))}</p>
                      </div>
                    )}
                  </div>
                  
                  {selectedCampinasRequest.approved_by && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Aprovado por</h4>
                      <p className="text-sm">{selectedCampinasRequest.approved_by}</p>
                    </div>
                  )}
                  
                  {selectedCampinasRequest.comments && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Comentários/Observações</h4>
                      <p className="text-sm whitespace-pre-line">{selectedCampinasRequest.comments}</p>
                    </div>
                  )}
                  
                  {selectedCampinasRequest.budget_file_url && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Arquivo de Orçamento</h4>
                      <div className="flex items-center mt-1">
                        <FileText className="h-4 w-4 mr-1 text-blue-600" />
                        <a 
                          href={selectedCampinasRequest.budget_file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {selectedCampinasRequest.budget_file_name}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {selectedCampinasRequest.invoice_file_url && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Nota Fiscal</h4>
                      <div className="flex items-center mt-1">
                        <FileText className="h-4 w-4 mr-1 text-green-600" />
                        <a 
                          href={selectedCampinasRequest.invoice_file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {selectedCampinasRequest.invoice_file_name}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {selectedCampinasRequest.pending_invoice && (
                    <div className="mt-2">
                      <div className="flex items-center text-sm text-amber-600 font-medium">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Pendente: Envio de Nota Fiscal
                      </div>
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button onClick={() => setIsCampinasRequestDialogOpen(false)}>
                    Fechar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Card para orçamentos de manutenção */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Orçamentos de Manutenção</CardTitle>
                  <CardDescription>
                    Acompanhe e gerencie os orçamentos das oficinas
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="negociacao" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-between items-center mb-4">
                  <TabsList>
                    <TabsTrigger value="negociacao">Em Negociação</TabsTrigger>
                    <TabsTrigger value="aguardando">Aguardando Orçamento</TabsTrigger>
                    <TabsTrigger value="aprovados">Aprovados</TabsTrigger>
                    <TabsTrigger value="todos">Todos</TabsTrigger>
                  </TabsList>
                  
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Buscar orçamentos..."
                      className="pl-8 w-[250px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <TabsContent value="negociacao" className="space-y-4">
                  <BudgetTable 
                    budgetChats={filteredBudgetChats.filter(chat => 
                      !chat.isFinalized && (chat.maintenanceStatus === 'em_negociacao' || chat.maintenanceStatus === 'em_andamento')
                    )} 
                    isLoading={isLoading}
                    onOpenChat={handleOpenChatDialog}
                  />
                </TabsContent>
                
                <TabsContent value="aguardando" className="space-y-4">
                  <BudgetTable 
                    budgetChats={filteredBudgetChats.filter(chat => 
                      !chat.isFinalized && chat.maintenanceStatus === 'aguardando_orcamento'
                    )} 
                    isLoading={isLoading}
                    onOpenChat={handleOpenChatDialog}
                  />
                </TabsContent>
                
                <TabsContent value="aprovados" className="space-y-4">
                  <BudgetTable 
                    budgetChats={filteredBudgetChats.filter(chat => 
                      chat.isFinalized
                    )} 
                    isLoading={isLoading}
                    onOpenChat={handleOpenChatDialog}
                  />
                </TabsContent>
                
                <TabsContent value="todos" className="space-y-4">
                  <BudgetTable 
                    budgetChats={filteredBudgetChats} 
                    isLoading={isLoading}
                    onOpenChat={handleOpenChatDialog}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

interface BudgetTableProps {
  budgetChats: BudgetChat[];
  isLoading: boolean;
  onOpenChat: (chat: BudgetChat) => void;
}

// Status Badge para solicitações da Base Campinas
const CampinasBudgetStatusBadge = ({ status }: { status: string }) => {
  switch(status.toLowerCase()) {
    case 'aprovado':
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3" />
          Aprovado
        </Badge>
      );
    case 'pendente':
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3" />
          Pendente
        </Badge>
      );
    case 'rejeitado':
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200">
          <AlertCircle className="h-3 w-3" />
          Rejeitado
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {status}
        </Badge>
      );
  }
};

// Priority Badge para solicitações da Base Campinas
const PriorityBadge = ({ priority }: { priority: string }) => {
  switch(priority.toLowerCase()) {
    case 'alta':
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200">
          Alta
        </Badge>
      );
    case 'média':
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-700 border-yellow-200">
          Média
        </Badge>
      );
    case 'baixa':
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
          Baixa
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          {priority}
        </Badge>
      );
  }
};

function BudgetTable({ budgetChats, isLoading, onOpenChat }: BudgetTableProps) {
  // Função para formatar data
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  if (budgetChats.length === 0) {
    return (
      <div className="text-center py-12 border rounded-md bg-gray-50">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600">Nenhum orçamento encontrado</h3>
        <p className="text-gray-500 mt-1">Não há orçamentos nesta categoria ou com os filtros aplicados.</p>
      </div>
    );
  }
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Veículo</TableHead>
          <TableHead>Oficina</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Data Início</TableHead>
          <TableHead>Orçamento Inicial</TableHead>
          <TableHead>Orçamento Final</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {budgetChats.map((chat) => (
          <TableRow key={chat.id}>
            <TableCell className="font-medium">{chat.maintenanceVehiclePlate || 'N/D'}</TableCell>
            <TableCell>{chat.workshopName || 'N/D'}</TableCell>
            <TableCell className="max-w-[200px] truncate">
              {chat.maintenanceDescription || 'Sem descrição'}
            </TableCell>
            <TableCell>{formatDate(chat.created_at)}</TableCell>
            <TableCell>{formatCurrency(chat.initialBudget)}</TableCell>
            <TableCell>{chat.finalBudget ? formatCurrency(chat.finalBudget) : '-'}</TableCell>
            <TableCell>
              <BudgetStatusBadge status={chat.maintenanceStatus || ''} isFinalized={chat.isFinalized} />
            </TableCell>
            <TableCell className="text-right">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onOpenChat(chat)}
                className="w-full md:w-auto"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {chat.isFinalized ? 'Ver' : 'Negociar'}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Interface para a tabela de solicitações de orçamento da Base Campinas
interface CampinasBudgetTableProps {
  requests: CampinasBudgetRequest[];
  isLoading: boolean;
  onOpenDetails: (request: CampinasBudgetRequest) => void;
}

// Componente de tabela para solicitações de orçamento da Base Campinas
function CampinasBudgetTable({ requests, isLoading, onOpenDetails }: CampinasBudgetTableProps) {
  // Função para formatar data
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  if (requests.length === 0) {
    return (
      <div className="text-center py-12 border rounded-md bg-gray-50">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600">Nenhuma solicitação encontrada</h3>
        <p className="text-gray-500 mt-1">Não há solicitações de orçamento da Base Campinas ou com os filtros aplicados.</p>
      </div>
    );
  }
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Solicitante</TableHead>
          <TableHead>Departamento</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Valor Estimado</TableHead>
          <TableHead>Prioridade</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell className="font-medium max-w-[200px] truncate">{request.title}</TableCell>
            <TableCell>{request.requester_name}</TableCell>
            <TableCell>{request.department}</TableCell>
            <TableCell>{formatDate(request.created_at)}</TableCell>
            <TableCell>{formatCurrency(parseFloat(request.estimated_value))}</TableCell>
            <TableCell>
              <PriorityBadge priority={request.priority} />
            </TableCell>
            <TableCell>
              <CampinasBudgetStatusBadge status={request.status} />
            </TableCell>
            <TableCell className="text-right">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onOpenDetails(request)}
                className="w-full md:w-auto"
              >
                <FileText className="h-4 w-4 mr-2" />
                Detalhes
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}