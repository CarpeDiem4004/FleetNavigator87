import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  Loader2,
  Info
} from 'lucide-react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { useToast } from '@/hooks/use-toast';
import { 
  TireRequest, 
  getAllTireRequests, 
  respondTireRequest 
} from '@/services/tireRequestsService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Função para traduzir status de solicitações de pneus
const translateRequestStatus = (status: string): string => {
  const statuses: Record<string, string> = {
    pendente: 'Pendente',
    aprovado: 'Aprovado',
    negado: 'Negado',
    em_analise: 'Em Análise',
    concluido: 'Concluído'
  };
  return statuses[status] || status;
};

// Função para obter a classe CSS para o badge de status de requisição
const getRequestStatusBadgeClass = (status: string): string => {
  const classes: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-800',
    aprovado: 'bg-green-100 text-green-800',
    negado: 'bg-red-100 text-red-800',
    em_analise: 'bg-blue-100 text-blue-800',
    concluido: 'bg-purple-100 text-purple-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

// Função para formatar datas
const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    return dateString;
  }
};

// Função para gerar o ícone de acordo com o status
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'aprovado':
      return <CheckCircle className="mr-1 h-4 w-4 text-green-600" />;
    case 'negado':
      return <XCircle className="mr-1 h-4 w-4 text-red-600" />;
    case 'em_analise':
      return <AlertCircle className="mr-1 h-4 w-4 text-blue-600" />;
    case 'concluido':
      return <CheckCircle className="mr-1 h-4 w-4 text-purple-600" />;
    default:
      return <Clock className="mr-1 h-4 w-4 text-yellow-600" />;
  }
};

const SolicitacoesPneus: React.FC = () => {
  const { toast } = useToast();
  const [tireRequests, setTireRequests] = useState<TireRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<TireRequest | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Form state
  const [responseStatus, setResponseStatus] = useState<string>('');
  const [responseDate, setResponseDate] = useState<string>('');
  const [responseComments, setResponseComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Carregar solicitações de pneus
  useEffect(() => {
    const loadTireRequests = async () => {
      setIsLoading(true);
      try {
        // Filtrar por status se necessário
        const filters = statusFilter ? { status: statusFilter } : undefined;
        const response = await getAllTireRequests(filters);
        
        if (response.success) {
          setTireRequests(response.data);
        } else {
          toast({
            title: "Erro ao carregar solicitações",
            description: "Não foi possível carregar a lista de solicitações de pneus.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Erro ao buscar solicitações de pneus:", error);
        toast({
          title: "Erro ao carregar solicitações",
          description: error instanceof Error ? error.message : "Erro desconhecido",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTireRequests();
  }, [toast, statusFilter]);
  
  // Filtrar solicitações com base no termo de busca
  const filteredRequests = tireRequests.filter(
    (request) => 
      (request.base_nome && request.base_nome.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (request.usuario_nome && request.usuario_nome.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (request.placa_veiculo && request.placa_veiculo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (request.medida && request.medida.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Abrir o diálogo de resposta
  const openResponseDialog = (request: TireRequest) => {
    setSelectedRequest(request);
    setResponseStatus(request.status);
    setResponseDate(request.data_previsao || '');
    setResponseComments(request.observacoes_aprovacao || '');
    setResponseDialogOpen(true);
  };
  
  // Responder à solicitação
  const handleRespond = async () => {
    if (!selectedRequest || !selectedRequest.id) {
      toast({
        title: "Erro",
        description: "Solicitação inválida ou não selecionada.",
        variant: "destructive"
      });
      return;
    }
    
    if (responseStatus === 'aprovado' && !responseDate) {
      toast({
        title: "Erro",
        description: "É necessário informar uma data de previsão ao aprovar a solicitação.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await respondTireRequest(
        selectedRequest.id,
        responseStatus as any, // Convertemos o tipo para compatibilidade
        responseDate,
        responseComments
      );
      
      if (response.success) {
        // Atualizar a lista de solicitações
        setTireRequests(tireRequests.map(req => 
          req.id === selectedRequest.id ? {...req, 
            status: responseStatus as "pendente" | "aprovado" | "negado" | "em_analise" | "concluido",
            data_previsao: responseDate,
            observacoes_aprovacao: responseComments
          } : req
        ));
        
        setResponseDialogOpen(false);
        
        toast({
          title: "Resposta enviada",
          description: "A solicitação foi atualizada com sucesso.",
          variant: "default"
        });
      } else {
        throw new Error(response.error || "Erro ao responder à solicitação");
      }
    } catch (error) {
      console.error("Erro ao responder à solicitação:", error);
      toast({
        title: "Erro ao responder",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <MainLayoutSimple>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestão de Solicitações de Pneus</h1>
        </div>
        
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Filtros e Pesquisa</CardTitle>
            <CardDescription>
              Filtre e pesquise solicitações para encontrar o que você precisa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-3 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Pesquisar por base, usuário, placa ou medida..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="aprovado">Aprovados</SelectItem>
                  <SelectItem value="negado">Negados</SelectItem>
                  <SelectItem value="concluido">Concluídos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Carregando solicitações...</span>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <Info className="h-12 w-12 mx-auto mb-2" />
                <p>Nenhuma solicitação encontrada com os filtros atuais.</p>
              </div>
            ) : (
              <Table>
                <TableCaption>Lista de solicitações de pneus ({filteredRequests.length})</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Base</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Medida</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.base_nome || '-'}</TableCell>
                      <TableCell>{request.usuario_nome || '-'}</TableCell>
                      <TableCell>{request.placa_veiculo || '-'}</TableCell>
                      <TableCell>{request.quantidade}</TableCell>
                      <TableCell>{request.medida}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{request.motivo}</TableCell>
                      <TableCell>
                        <Badge className={getRequestStatusBadgeClass(request.status)}>
                          {getStatusIcon(request.status)}
                          {translateRequestStatus(request.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{request.data_previsao ? formatDate(request.data_previsao) : '-'}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openResponseDialog(request)}
                        >
                          Responder
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Diálogo para responder à solicitação */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Responder Solicitação de Pneus</DialogTitle>
            <DialogDescription>
              Informe o status, prazo de atendimento e observações para esta solicitação
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {selectedRequest && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">Base:</div>
                <div>{selectedRequest.base_nome}</div>
                
                <div className="font-medium">Solicitante:</div>
                <div>{selectedRequest.usuario_nome}</div>
                
                <div className="font-medium">Veículo:</div>
                <div>{selectedRequest.placa_veiculo || '-'}</div>
                
                <div className="font-medium">Medida:</div>
                <div>{selectedRequest.medida}</div>
                
                <div className="font-medium">Quantidade:</div>
                <div>{selectedRequest.quantidade}</div>
                
                <div className="font-medium">Solicitado em:</div>
                <div>{formatDate(selectedRequest.data_solicitacao)}</div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status da Solicitação</label>
              <Select value={responseStatus} onValueChange={setResponseStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="negado">Negado</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Previsão de Entrega/Troca</label>
              <div className="relative">
                <Calendar className="absolute left-2 top-3 h-4 w-4 text-gray-500" />
                <Input
                  type="date"
                  className="pl-8"
                  value={responseDate}
                  onChange={(e) => setResponseDate(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {responseStatus === 'aprovado' ? 'Obrigatório para aprovação' : 'Opcional'}
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Observações</label>
              <Textarea
                placeholder="Informe detalhes adicionais sobre a resposta..."
                value={responseComments}
                onChange={(e) => setResponseComments(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setResponseDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleRespond} 
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Resposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayoutSimple>
  );
};

export default SolicitacoesPneus;