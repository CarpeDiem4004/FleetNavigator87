import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Settings, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Package, 
  User, 
  Calendar,
  Smartphone,
  Eye,
  MessageSquare,
  Filter,
  RefreshCw,
  Send
} from "lucide-react";

const statusLabels = {
  pendente: 'Pendente',
  em_analise: 'Em Análise',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
  em_separacao: 'Em Separação',
  pronto_retirada: 'Pronto Retirada',
  entregue: 'Entregue',
  cancelado: 'Cancelado'
};

const statusColors = {
  pendente: 'bg-yellow-100 text-yellow-800',
  em_analise: 'bg-blue-100 text-blue-800',
  aprovado: 'bg-green-100 text-green-800',
  rejeitado: 'bg-red-100 text-red-800',
  em_separacao: 'bg-purple-100 text-purple-800',
  pronto_retirada: 'bg-cyan-100 text-cyan-800',
  entregue: 'bg-gray-100 text-gray-800',
  cancelado: 'bg-gray-100 text-gray-800'
};

const urgencyColors = {
  baixa: 'text-green-600',
  normal: 'text-blue-600',
  alta: 'text-orange-600',
  urgente: 'text-red-600'
};

const equipmentTypeLabels = {
  notebook: 'Notebook',
  celular: 'Celular',
  email: 'Email',
  chip: 'Chip'
};

export default function EquipmentRequestsAdmin() {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch requests with filters
  const { data: requestsData, isLoading, refetch } = useQuery({
    queryKey: ['equipment-requests', statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('equipment_type', typeFilter);
      
      const response = await apiRequest("GET", `/api/equipment-requests?${params}`);
      return response.json();
    }
  });

  const requests = requestsData?.data || [];
  const stats = requestsData?.stats || {};

  // Filter by search term
  const filteredRequests = requests.filter((request: any) =>
    (request.requester_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (request.requester_department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (request.equipment_description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (request.id || '').toString().includes(searchTerm)
  );

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: number, comments: string }) => {
      const response = await apiRequest("PUT", `/api/equipment-requests/${id}/approve`, {
        manager_comments: comments
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Solicitação aprovada com sucesso!", variant: "default" });
      queryClient.invalidateQueries({ queryKey: ['equipment-requests'] });
      setDialogOpen(false);
      setComments('');
    },
    onError: () => {
      toast({ title: "Erro ao aprovar solicitação", variant: "destructive" });
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number, reason: string }) => {
      const response = await apiRequest("PUT", `/api/equipment-requests/${id}/reject`, {
        rejection_reason: reason
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Solicitação rejeitada", variant: "default" });
      queryClient.invalidateQueries({ queryKey: ['equipment-requests'] });
      setDialogOpen(false);
      setRejectionReason('');
    },
    onError: () => {
      toast({ title: "Erro ao rejeitar solicitação", variant: "destructive" });
    }
  });

  // WhatsApp status notification mutation
  const whatsappMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiRequest("POST", `/api/equipment-requests/${requestId}/send-whatsapp-status`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Mensagem WhatsApp enviada com sucesso!", variant: "default" });
    },
    onError: () => {
      toast({ title: "Erro ao enviar mensagem WhatsApp", variant: "destructive" });
    }
  });

  const handleAction = (request: any, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setDialogOpen(true);
  };

  const confirmAction = () => {
    if (!selectedRequest || !actionType) return;

    if (actionType === 'approve') {
      approveMutation.mutate({ id: selectedRequest.id, comments });
    } else {
      rejectMutation.mutate({ id: selectedRequest.id, reason: rejectionReason });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR') + ' ' + 
           new Date(dateString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const openWhatsApp = (request: any) => {
    // Mapear status para mensagem
    const statusMessages = {
      pendente: '⏳ Aguardando Análise',
      em_analise: '🔍 Em Análise',
      aprovado: '✅ APROVADO',
      rejeitado: '❌ REJEITADO',
      em_separacao: '📦 Em Separação',
      pronto_retirada: '✅ Pronto para Retirada',
      entregue: '✅ ENTREGUE',
      cancelado: '❌ CANCELADO'
    };

    const statusMessage = statusMessages[request.status as keyof typeof statusMessages] || request.status;
    
    // Montar mensagem personalizada
    let message = `📋 *Status da Solicitação*\n\n🔢 *Protocolo:* #${request.id}\n📱 *Tipo:* ${request.equipment_type.toUpperCase()}\n⚡ *Status:* ${statusMessage}`;
    
    // Adicionar informações específicas por status
    if (request.status === 'aprovado' && request.manager_comments) {
      message += `\n💬 *Comentários:* ${request.manager_comments}`;
    }
    
    if (request.status === 'rejeitado' && request.rejection_reason) {
      message += `\n❌ *Motivo:* ${request.rejection_reason}`;
    }
    
    if (request.status === 'pronto_retirada') {
      message += `\n\n🏢 Seu equipamento está pronto para retirada!\nEntre em contato para agendar.`;
    }
    
    if (request.status === 'entregue') {
      message += `\n\n🎉 Equipamento entregue com sucesso!`;
    }
    
    message += `\n\n📅 *Última atualização:* ${new Date().toLocaleDateString('pt-BR')}`;

    // Formatar número do WhatsApp (remover caracteres especiais)
    const cleanPhone = request.whatsapp_phone.replace(/\D/g, '');
    
    // Codificar mensagem para URL
    const encodedMessage = encodeURIComponent(message);
    
    // Criar link do WhatsApp
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    
    // Abrir WhatsApp
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Gerenciar Solicitações de Equipamentos
        </h1>
        <p className="text-muted-foreground">
          Gerencie e aprove solicitações de notebook, email, telefone e chip
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-center">{stats.total || 0}</div>
            <div className="text-sm text-muted-foreground text-center">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-center text-yellow-600">{stats.pendente || 0}</div>
            <div className="text-sm text-muted-foreground text-center">Pendente</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-center text-blue-600">{stats.em_analise || 0}</div>
            <div className="text-sm text-muted-foreground text-center">Em Análise</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-center text-green-600">{stats.aprovado || 0}</div>
            <div className="text-sm text-muted-foreground text-center">Aprovado</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-center text-red-600">{stats.rejeitado || 0}</div>
            <div className="text-sm text-muted-foreground text-center">Rejeitado</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-center text-gray-600">{stats.entregue || 0}</div>
            <div className="text-sm text-muted-foreground text-center">Entregue</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <Input
                placeholder="Nome, departamento ou descrição"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(equipmentTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitações ({filteredRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Urgência</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request: any) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-mono">#{request.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.requester_name}</div>
                          <div className="text-sm text-muted-foreground">{request.requester_department}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {equipmentTypeLabels[request.equipment_type as keyof typeof equipmentTypeLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={urgencyColors[request.urgency_level as keyof typeof urgencyColors]}>
                          {request.urgency_level.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[request.status as keyof typeof statusColors]}>
                          {statusLabels[request.status as keyof typeof statusLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(request.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(request);
                              setActionType(null);
                              setDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {request.whatsapp_phone && (
                            <Button
                              size="sm"
                              variant="outline"
                              className={
                                request.status !== 'pendente' 
                                  ? "text-green-600 hover:text-green-700 border-green-500 bg-green-50" 
                                  : "text-green-600 hover:text-green-700"
                              }
                              onClick={() => openWhatsApp(request)}
                              title={
                                request.status !== 'pendente'
                                  ? `Notificar mudança de status para: ${statusLabels[request.status as keyof typeof statusLabels]}`
                                  : "Enviar status via WhatsApp"
                              }
                            >
                              <Send className="h-4 w-4" />
                              {request.status !== 'pendente' && (
                                <span className="ml-1 text-xs font-semibold">!</span>
                              )}
                            </Button>
                          )}
                          {request.status === 'pendente' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-600 hover:text-blue-700"
                                onClick={() => handleAction(request, 'approve')}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleAction(request, 'reject')}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhuma solicitação encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {!actionType ? 'Detalhes da Solicitação' : 
               actionType === 'approve' ? 'Aprovar Solicitação' : 'Rejeitar Solicitação'}
            </DialogTitle>
            <DialogDescription>
              Protocolo: #{selectedRequest?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Dados Pessoais */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-900 border-b pb-2">Dados Pessoais</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Solicitante</label>
                    <div className="text-sm">{selectedRequest.requester_name}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">CPF</label>
                    <div className="text-sm">{selectedRequest.requester_cpf}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <div className="text-sm">{selectedRequest.requester_email}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Telefone</label>
                    <div className="text-sm">{selectedRequest.requester_phone}</div>
                  </div>
                </div>
              </div>

              {/* Dados Profissionais */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-900 border-b pb-2">Dados Profissionais</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Endereço da Base</label>
                    <div className="text-sm bg-gray-50 p-2 rounded">{selectedRequest.requester_base_address}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Nome do Projeto</label>
                      <div className="text-sm">{selectedRequest.project_name}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Base</label>
                      <div className="text-sm">{selectedRequest.base_name}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Departamento</label>
                      <div className="text-sm">{selectedRequest.requester_department}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Função</label>
                      <div className="text-sm">{selectedRequest.requester_function}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dados do Gestor */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-900 border-b pb-2">Dados do Gestor</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Nome do Gestor</label>
                    <div className="text-sm">{selectedRequest.manager_approval}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Telefone do Gestor</label>
                    <div className="text-sm">{selectedRequest.manager_phone}</div>
                  </div>
                </div>
              </div>

              {/* Solicitação de Equipamento */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-900 border-b pb-2">Solicitação de Equipamento</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Tipo de Equipamento</label>
                      <div className="text-sm">
                        {equipmentTypeLabels[selectedRequest.equipment_type as keyof typeof equipmentTypeLabels]}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Urgência</label>
                      <div className={`text-sm ${urgencyColors[selectedRequest.urgency_level as keyof typeof urgencyColors]}`}>
                        {selectedRequest.urgency_level.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Justificativa</label>
                    <div className="text-sm bg-gray-50 p-3 rounded">
                      {selectedRequest.justification}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">WhatsApp para Notificações</label>
                    <div className="text-sm">{selectedRequest.whatsapp_phone}</div>
                  </div>
                </div>
              </div>

              {actionType === 'approve' && (
                <div>
                  <label className="text-sm font-medium">Comentários (Opcional)</label>
                  <Textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Adicione comentários sobre a aprovação..."
                    rows={3}
                  />
                </div>
              )}

              {actionType === 'reject' && (
                <div>
                  <label className="text-sm font-medium">Motivo da Rejeição*</label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explique o motivo da rejeição..."
                    rows={3}
                    required
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {actionType ? 'Cancelar' : 'Fechar'}
            </Button>
            {actionType && (
              <Button
                onClick={confirmAction}
                disabled={
                  approveMutation.isPending || 
                  rejectMutation.isPending ||
                  (actionType === 'reject' && !rejectionReason.trim())
                }
                variant={actionType === 'approve' ? 'default' : 'destructive'}
              >
                {approveMutation.isPending || rejectMutation.isPending ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : null}
                {actionType === 'approve' ? 'Aprovar' : 'Rejeitar'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}