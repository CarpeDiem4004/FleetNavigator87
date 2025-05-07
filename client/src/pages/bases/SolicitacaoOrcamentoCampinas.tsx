import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/hooks/use-auth';
import { Loader2, FileText, ClipboardList, CheckCircle, AlertCircle, Clock } from 'lucide-react';

// Schema de validação para solicitação de orçamento
const budgetRequestSchema = z.object({
  title: z.string().min(5, { message: "O título deve ter pelo menos 5 caracteres" }),
  description: z.string().min(10, { message: "A descrição deve ter pelo menos 10 caracteres" }),
  priority: z.string({ required_error: "Selecione uma prioridade" }),
  estimated_value: z.string().min(1, { message: "Informe um valor estimado" }),
  department: z.string().min(3, { message: "Informe o departamento" })
});

type BudgetRequestForm = z.infer<typeof budgetRequestSchema>;

// Interface para os dados da solicitação de orçamento
interface BudgetRequest {
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
  budget_file_url?: string; // URL para o arquivo de orçamento (PDF/imagem)
  budget_file_name?: string; // Nome do arquivo de orçamento
  invoice_file_url?: string; // URL para a nota fiscal (PDF/imagem)
  invoice_file_name?: string; // Nome do arquivo da nota fiscal
  pending_invoice?: boolean; // Indica se está pendente o envio da NF após aprovação
}

// Componente principal
const SolicitacaoOrcamentoCampinas: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [requests, setRequests] = useState<BudgetRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<BudgetRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isInvoiceUploadDialogOpen, setIsInvoiceUploadDialogOpen] = useState(false);
  const [approvalComments, setApprovalComments] = useState('');
  const [approvedValue, setApprovedValue] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Estados para lidar com arquivos
  const [budgetFile, setBudgetFile] = useState<File | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [budgetFileName, setBudgetFileName] = useState('');
  const [invoiceFileName, setInvoiceFileName] = useState('');

  // Configuração do formulário
  const form = useForm<BudgetRequestForm>({
    resolver: zodResolver(budgetRequestSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: '',
      estimated_value: '',
      department: ''
    }
  });

  // Buscar solicitações ao carregar a página
  useEffect(() => {
    fetchBudgetRequests();
  }, []);

  // Função para buscar as solicitações de orçamento
  const fetchBudgetRequests = async () => {
    setIsLoading(true);
    try {
      // Chamada para a API - dados simulados por enquanto
      // Quando a API for implementada, substituir por fetch real
      setTimeout(() => {
        const mockData: BudgetRequest[] = [
          {
            id: 1,
            title: "Compra de equipamentos para manutenção",
            description: "Necessário adquirir ferramentas especializadas para a oficina de Campinas",
            priority: "alta",
            status: "pendente",
            requester_id: 1,
            requester_name: "Administrador",
            created_at: "2025-05-07T10:30:00",
            updated_at: "2025-05-07T10:30:00",
            estimated_value: "5000.00",
            department: "Manutenção"
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
            comments: "Aprovado com valor reduzido"
          },
          {
            id: 3,
            title: "Material de escritório",
            description: "Suprimentos para o departamento administrativo",
            priority: "baixa",
            status: "rejeitado",
            requester_id: 3,
            requester_name: "Maria Oliveira",
            created_at: "2025-05-04T11:45:00",
            updated_at: "2025-05-04T16:30:00",
            estimated_value: "1200.00",
            department: "Administração",
            comments: "Solicitar novamente no próximo mês"
          }
        ];
        setRequests(mockData);
        setIsLoading(false);
      }, 800);
    } catch (error) {
      console.error("Erro ao buscar solicitações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as solicitações de orçamento.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Função para criar nova solicitação de orçamento
  const onSubmit = async (data: BudgetRequestForm) => {
    if (!budgetFile) {
      toast({
        title: "Arquivo necessário",
        description: "É necessário anexar um documento de orçamento para enviar a solicitação.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Simulando uma chamada para a API
      // Substituir por uma chamada real quando a API estiver disponível
      console.log("Enviando solicitação:", data);
      console.log("Enviando arquivo:", budgetFile);
      
      // Em uma implementação real, aqui você enviaria os dados do formulário
      // junto com o arquivo para o servidor, provavelmente usando FormData
      
      setTimeout(() => {
        // Adicionar a nova solicitação à lista
        const newRequest: BudgetRequest = {
          id: Math.floor(Math.random() * 1000),
          title: data.title,
          description: data.description,
          priority: data.priority,
          status: "pendente",
          requester_id: user?.id || 0,
          requester_name: user?.name || "Usuário",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          estimated_value: data.estimated_value,
          department: data.department,
          budget_file_name: budgetFile.name,
          budget_file_url: URL.createObjectURL(budgetFile) // Simulando URL
        };
        
        setRequests([newRequest, ...requests]);
        form.reset();
        setBudgetFile(null);
        setBudgetFileName('');
        
        toast({
          title: "Sucesso",
          description: "Solicitação de orçamento criada com sucesso.",
          variant: "default"
        });
        
        setIsLoading(false);
      }, 800);
    } catch (error) {
      console.error("Erro ao criar solicitação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a solicitação de orçamento.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Função para aprovar uma solicitação
  const approveRequest = async () => {
    if (!selectedRequest) return;
    
    setIsLoading(true);
    try {
      // Simulando a chamada para a API
      setTimeout(() => {
        const updatedRequests = requests.map(req => {
          if (req.id === selectedRequest.id) {
            return {
              ...req,
              status: "aprovado",
              approved_value: approvedValue,
              approved_by: user?.name || "Usuário",
              approved_at: new Date().toISOString(),
              comments: approvalComments,
              updated_at: new Date().toISOString(),
              pending_invoice: true // Marca como pendente de NF após aprovação
            };
          }
          return req;
        });
        
        setRequests(updatedRequests);
        setIsApproveDialogOpen(false);
        setSelectedRequest(null);
        setApprovalComments('');
        setApprovedValue('');
        
        toast({
          title: "Aprovada",
          description: "Solicitação de orçamento aprovada com sucesso. Aguardando nota fiscal.",
          variant: "default"
        });
        
        setIsLoading(false);
      }, 800);
    } catch (error) {
      console.error("Erro ao aprovar solicitação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar a solicitação.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Função para rejeitar uma solicitação
  const rejectRequest = async () => {
    if (!selectedRequest) return;
    
    setIsLoading(true);
    try {
      // Simulando a chamada para a API
      setTimeout(() => {
        const updatedRequests = requests.map(req => {
          if (req.id === selectedRequest.id) {
            return {
              ...req,
              status: "rejeitado",
              comments: rejectionReason,
              updated_at: new Date().toISOString()
            };
          }
          return req;
        });
        
        setRequests(updatedRequests);
        setIsRejectDialogOpen(false);
        setSelectedRequest(null);
        setRejectionReason('');
        
        toast({
          title: "Rejeitada",
          description: "Solicitação de orçamento rejeitada.",
          variant: "default"
        });
        
        setIsLoading(false);
      }, 800);
    } catch (error) {
      console.error("Erro ao rejeitar solicitação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar a solicitação.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Função para formatar valor monetário
  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  // Função para renderizar o badge de status
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case 'aprovado':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300"><CheckCircle className="w-3 h-3 mr-1" /> Aprovado</Badge>;
      case 'rejeitado':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300"><AlertCircle className="w-3 h-3 mr-1" /> Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Função para renderizar o badge de prioridade
  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'baixa':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Baixa</Badge>;
      case 'média':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">Média</Badge>;
      case 'alta':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Alta</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };
  
  // Função para lidar com upload de orçamento
  const handleBudgetFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBudgetFile(file);
      setBudgetFileName(file.name);
    }
  };
  
  // Função para lidar com upload de nota fiscal
  const handleInvoiceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setInvoiceFile(file);
      setInvoiceFileName(file.name);
    }
  };
  
  // Função para salvar orçamento anexado
  const saveBudgetFile = async () => {
    if (!selectedRequest || !budgetFile) return;
    
    setIsLoading(true);
    try {
      // Simulando upload do arquivo
      // Em uma implementação real, você enviaria o arquivo para o servidor
      console.log("Enviando arquivo de orçamento:", budgetFile);
      
      setTimeout(() => {
        // Atualizar a solicitação com as informações do arquivo
        const updatedRequests = requests.map(req => {
          if (req.id === selectedRequest.id) {
            return {
              ...req,
              budget_file_name: budgetFile.name,
              budget_file_url: URL.createObjectURL(budgetFile), // Simulando URL
              updated_at: new Date().toISOString()
            };
          }
          return req;
        });
        
        setRequests(updatedRequests);
        setBudgetFile(null);
        setBudgetFileName('');
        
        toast({
          title: "Orçamento Anexado",
          description: "O arquivo de orçamento foi anexado com sucesso.",
          variant: "default"
        });
        
        setIsLoading(false);
        setIsDialogOpen(false);
      }, 800);
    } catch (error) {
      console.error("Erro ao salvar arquivo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível anexar o arquivo de orçamento.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };
  
  // Função para salvar nota fiscal anexada
  const saveInvoiceFile = async () => {
    if (!selectedRequest || !invoiceFile) return;
    
    setIsLoading(true);
    try {
      // Simulando upload do arquivo
      console.log("Enviando arquivo de nota fiscal:", invoiceFile);
      
      setTimeout(() => {
        // Atualizar a solicitação com as informações do arquivo
        const updatedRequests = requests.map(req => {
          if (req.id === selectedRequest.id) {
            return {
              ...req,
              invoice_file_name: invoiceFile.name,
              invoice_file_url: URL.createObjectURL(invoiceFile), // Simulando URL
              pending_invoice: false, // Marca como não pendente após anexar NF
              updated_at: new Date().toISOString()
            };
          }
          return req;
        });
        
        setRequests(updatedRequests);
        setInvoiceFile(null);
        setInvoiceFileName('');
        
        toast({
          title: "Nota Fiscal Anexada",
          description: "A nota fiscal foi anexada com sucesso.",
          variant: "default"
        });
        
        setIsLoading(false);
        setIsInvoiceUploadDialogOpen(false);
      }, 800);
    } catch (error) {
      console.error("Erro ao salvar arquivo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível anexar a nota fiscal.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Solicitação de Orçamento</h1>
          <p className="text-muted-foreground">
            Base Campinas - Gerencie solicitações de orçamento para aprovação
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formulário de solicitação */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Nova Solicitação</CardTitle>
            <CardDescription>
              Preencha os dados para solicitar um novo orçamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Título da solicitação" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva detalhadamente o que está sendo solicitado"
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departamento</FormLabel>
                        <FormControl>
                          <Input placeholder="Departamento" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="estimated_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Estimado (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0,00"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a prioridade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="média">Média</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div>
                  <FormLabel>Arquivo de Orçamento</FormLabel>
                  <div className="mt-1">
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleBudgetFileChange}
                      className="cursor-pointer"
                    />
                    <FormDescription className="mt-1 text-xs">
                      Anexe um documento com o orçamento (PDF, JPG ou PNG). Máximo 5MB.
                    </FormDescription>
                  </div>
                  {budgetFileName && (
                    <div className="flex items-center mt-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4 mr-1" />
                      {budgetFileName}
                    </div>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading || !budgetFile}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Enviar Solicitação
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Tabela de solicitações */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Solicitações de Orçamento</CardTitle>
            <CardDescription>
              Visualize e gerencie todas as solicitações de orçamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !requests.length ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : requests.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.title}</TableCell>
                        <TableCell>{formatCurrency(request.estimated_value)}</TableCell>
                        <TableCell>{renderPriorityBadge(request.priority)}</TableCell>
                        <TableCell>{renderStatusBadge(request.status)}</TableCell>
                        <TableCell>{formatDate(request.created_at)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setIsDialogOpen(true);
                            }}
                          >
                            <ClipboardList className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhuma solicitação encontrada</h3>
                <p className="text-muted-foreground mt-2">
                  Não há solicitações de orçamento registradas.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de detalhes da solicitação */}
      {selectedRequest && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Solicitação</DialogTitle>
              <DialogDescription>
                Informações completas sobre a solicitação de orçamento
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  <div className="mt-1">{renderStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Prioridade</h4>
                  <div className="mt-1">{renderPriorityBadge(selectedRequest.priority)}</div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Título</h4>
                <p className="text-sm">{selectedRequest.title}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Descrição</h4>
                <p className="text-sm whitespace-pre-line">{selectedRequest.description}</p>
              </div>
              
              {selectedRequest.budget_file_url && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Arquivo de Orçamento</h4>
                  <div className="flex items-center mt-1">
                    <FileText className="h-4 w-4 mr-1 text-blue-600" />
                    <a 
                      href={selectedRequest.budget_file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {selectedRequest.budget_file_name}
                    </a>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Departamento</h4>
                  <p className="text-sm">{selectedRequest.department}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Valor Estimado</h4>
                  <p className="text-sm">{formatCurrency(selectedRequest.estimated_value)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Solicitante</h4>
                  <p className="text-sm">{selectedRequest.requester_name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Data da Solicitação</h4>
                  <p className="text-sm">{formatDate(selectedRequest.created_at)}</p>
                </div>
              </div>
              
              {selectedRequest.status === 'aprovado' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Aprovado por</h4>
                      <p className="text-sm">{selectedRequest.approved_by}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Valor Aprovado</h4>
                      <p className="text-sm">{selectedRequest.approved_value ? formatCurrency(selectedRequest.approved_value) : '-'}</p>
                    </div>
                  </div>
                  
                  {selectedRequest.pending_invoice && (
                    <div className="mt-4 flex flex-col">
                      <div className="flex items-center text-sm text-amber-600 font-medium mb-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Pendente: Envio de Nota Fiscal
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => {
                          setIsDialogOpen(false);
                          setIsInvoiceUploadDialogOpen(true);
                        }}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        Anexar Nota Fiscal
                      </Button>
                    </div>
                  )}
                  
                  {selectedRequest.invoice_file_url && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Nota Fiscal</h4>
                      <div className="flex items-center mt-1">
                        <FileText className="h-4 w-4 mr-1 text-green-600" />
                        <a 
                          href={selectedRequest.invoice_file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {selectedRequest.invoice_file_name}
                        </a>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {selectedRequest.comments && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Comentários/Observações</h4>
                  <p className="text-sm whitespace-pre-line">{selectedRequest.comments}</p>
                </div>
              )}
            </div>
            
            <DialogFooter className="flex justify-between items-center">
              {selectedRequest.status === 'pendente' && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setIsRejectDialogOpen(true);
                    }}
                    className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                  >
                    Rejeitar
                  </Button>
                  <Button
                    onClick={() => {
                      setIsDialogOpen(false);
                      setIsApproveDialogOpen(true);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Aprovar
                  </Button>
                </div>
              )}
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de aprovação */}
      {selectedRequest && (
        <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aprovar Solicitação</DialogTitle>
              <DialogDescription>
                Confirme os detalhes para aprovar esta solicitação de orçamento.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div>
                <FormLabel>Valor Aprovado (R$)</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Valor aprovado"
                  value={approvedValue}
                  onChange={(e) => setApprovedValue(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <FormLabel>Comentários/Observações</FormLabel>
                <Textarea
                  placeholder="Adicione comentários ou observações sobre a aprovação"
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  className="mt-1 min-h-[100px]"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={approveRequest}
                disabled={isLoading || !approvedValue}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Confirmar Aprovação"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de rejeição */}
      {selectedRequest && (
        <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rejeitar Solicitação</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja rejeitar esta solicitação de orçamento?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="py-4">
              <FormLabel>Motivo da Rejeição</FormLabel>
              <Textarea
                placeholder="Informe o motivo da rejeição"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1 min-h-[100px]"
              />
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsRejectDialogOpen(false)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={rejectRequest}
                disabled={isLoading || !rejectionReason}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Confirmar Rejeição"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Modal para envio de nota fiscal */}
      {selectedRequest && (
        <Dialog open={isInvoiceUploadDialogOpen} onOpenChange={setIsInvoiceUploadDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Anexar Nota Fiscal</DialogTitle>
              <DialogDescription>
                Anexe a nota fiscal para a solicitação de orçamento aprovada.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <FormLabel>Nota Fiscal (PDF/Imagem)</FormLabel>
                <div className="mt-1">
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleInvoiceFileChange}
                    className="cursor-pointer"
                  />
                  <FormDescription className="mt-1 text-xs">
                    Anexe o arquivo da nota fiscal (PDF, JPG ou PNG). Máximo 5MB.
                  </FormDescription>
                </div>
                {invoiceFileName && (
                  <div className="flex items-center mt-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 mr-1" />
                    {invoiceFileName}
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInvoiceUploadDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={saveInvoiceFile}
                disabled={isLoading || !invoiceFile}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Nota Fiscal"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SolicitacaoOrcamentoCampinas;