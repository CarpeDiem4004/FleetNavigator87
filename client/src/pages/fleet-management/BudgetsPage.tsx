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
  const queryClient = useQueryClient();
  
  // Carregar todos os chats de orçamentos
  const { data: budgetChats = [], isLoading } = useQuery<BudgetChat[]>({
    queryKey: ['/api/fleet/budget-chats', { status: activeTab }],
    queryFn: async () => {
      let url = '/api/fleet/budget-chats';
      
      // Adicionar filtro por status se necessário
      if (activeTab !== 'todos') {
        url += `?status=${activeTab}`;
      }
      
      const response = await apiRequest('GET', url);
      return await response.json();
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
  
  // Abrir diálogo de chat para negociação
  const handleOpenChatDialog = (chat: BudgetChat) => {
    setSelectedChat(chat);
    setIsChatDialogOpen(true);
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
                  {budgetChats.filter(chat => !chat.isFinalized && chat.maintenanceStatus === 'em_negociacao').length}
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
                      !chat.isFinalized && chat.maintenanceStatus === 'em_negociacao'
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