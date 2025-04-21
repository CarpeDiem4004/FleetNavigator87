import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { queryClient } from '@/lib/queryClient';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  FileBarChart,
  Loader2,
  MessageSquare,
  Search,
  ShieldAlert,
  Truck,
  Wrench,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ChatOficina from '@/components/workshop/ChatOficina';

// Interfaces
interface Maintenance {
  id: number;
  vehicle_id: number;
  vehicle_name: string;
  description: string;
  status: string;
  priority: string;
  oficina_id: number;
  oficina_name: string;
  created_at: string;
  updated_at: string;
  base_id: number;
  base_name: string;
  responsavel_nome: string;
  maintenance_chat_id?: number;
  maintenance_chat_status?: string;
  initial_budget?: number | null;
}

interface ChatInfo {
  id: number;
  maintenanceId: number;
  initialBudget: number | null;
  finalBudget: number | null;
  isFinalized: boolean;
}

const BudgetManagementPage: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
  const [selectedMaintenanceId, setSelectedMaintenanceId] = useState<number | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Buscar manutenções com chats de orçamento
  const { data: maintenances = [], isLoading } = useQuery<Maintenance[]>({
    queryKey: ['/api/maintenance', 'with-chats'],
    queryFn: async () => {
      const res = await fetch('/api/maintenance/with-chats');
      if (!res.ok) {
        throw new Error('Falha ao buscar manutenções com chats de orçamento');
      }
      return res.json();
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Filtragem de manutenções
  const filteredMaintenances = maintenances.filter(maintenance => {
    const matchesSearch = 
      maintenance.vehicle_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maintenance.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maintenance.oficina_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maintenance.id.toString().includes(searchTerm);
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'waiting') return matchesSearch && maintenance.status === 'aguardando_orcamento';
    if (statusFilter === 'negotiating') return matchesSearch && maintenance.status === 'em_negociacao';
    if (statusFilter === 'both') return matchesSearch && ['aguardando_orcamento', 'em_negociacao'].includes(maintenance.status);
    return matchesSearch;
  });

  // Funções auxiliares
  const openChat = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    setSelectedMaintenanceId(maintenance.id);
    setSelectedChatId(maintenance.maintenance_chat_id || null);
    setChatOpen(true);
  };

  const closeChat = () => {
    setChatOpen(false);
    setSelectedChatId(null);
    setSelectedMaintenanceId(null);
    setSelectedMaintenance(null);
    // Recarregar dados após fechamento do chat
    queryClient.invalidateQueries({ queryKey: ['/api/maintenance', 'with-chats'] });
  };

  // Formatação de status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aguardando_orcamento':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Aguardando Orçamento</Badge>;
      case 'em_negociacao':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Em Negociação</Badge>;
      case 'em_andamento':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Em Andamento</Badge>;
      case 'finalizada':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Finalizada</Badge>;
      case 'cancelada':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'alta':
        return <Badge variant="destructive">Alta</Badge>;
      case 'media':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Média</Badge>;
      case 'baixa':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Baixa</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  // Formatação de data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <DollarSign className="mr-2 h-8 w-8" />
                Gestão de Orçamentos
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie orçamentos enviados pelas oficinas e realize tratativas
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Orçamentos e Negociações</CardTitle>
              <CardDescription>
                Acompanhe e gerencie as negociações de orçamentos de manutenções
              </CardDescription>
              <div className="flex flex-col sm:flex-row gap-4 mt-4 items-start sm:items-center">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por veículo, descrição ou oficina..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value)}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="waiting">Aguardando Orçamento</SelectItem>
                    <SelectItem value="negotiating">Em Negociação</SelectItem>
                    <SelectItem value="both">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Carregando orçamentos...</span>
                </div>
              ) : filteredMaintenances.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShieldAlert className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Nenhuma manutenção com orçamento encontrada</h3>
                  <p className="mt-1">
                    Não há manutenções com orçamentos ou negociações para exibir com os filtros atuais.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Veículo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Oficina</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMaintenances.map((maintenance) => (
                        <TableRow key={maintenance.id}>
                          <TableCell className="font-medium">{maintenance.id}</TableCell>
                          <TableCell>{maintenance.vehicle_name}</TableCell>
                          <TableCell className="max-w-xs truncate" title={maintenance.description}>
                            {maintenance.description}
                          </TableCell>
                          <TableCell>{maintenance.oficina_name}</TableCell>
                          <TableCell>{getStatusBadge(maintenance.status)}</TableCell>
                          <TableCell>{getPriorityBadge(maintenance.priority)}</TableCell>
                          <TableCell>{formatDate(maintenance.created_at)}</TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              onClick={() => openChat(maintenance)}
                              variant="outline"
                              className="flex items-center"
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              {maintenance.maintenance_chat_id ? 'Ver Chat' : 'Iniciar Chat'}
                            </Button>
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
      </div>

      {/* Diálogo do Chat de Orçamento */}
      <Dialog open={chatOpen} onOpenChange={(open) => !open && closeChat()}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-primary" />
              Negociação de Orçamento
              {selectedMaintenance && (
                <span className="ml-2 text-muted-foreground">
                  (Manutenção #{selectedMaintenance.id})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedMaintenanceId && (
            <div className="mt-2">
              {selectedMaintenance && (
                <div className="mb-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="font-medium">Veículo:</p>
                      <p>{selectedMaintenance.vehicle_name}</p>
                    </div>
                    <div>
                      <p className="font-medium">Oficina:</p>
                      <p>{selectedMaintenance.oficina_name}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Descrição:</p>
                    <p className="text-sm">{selectedMaintenance.description}</p>
                  </div>
                </div>
              )}
              
              <ChatOficina 
                maintenanceId={selectedMaintenanceId}
                chatId={selectedChatId}
                initialBudget={selectedMaintenance?.initial_budget || undefined}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default BudgetManagementPage;