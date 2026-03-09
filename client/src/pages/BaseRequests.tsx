import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useParams, useLocation } from 'wouter';
import { Loader2, Plus, Clock, AlertCircle, CheckCircle, Send, FileEdit, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Definir esquema para o formulário de solicitação
const requestFormSchema = z.object({
  baseId: z.coerce.number().min(1, "Base é obrigatória"),
  requestType: z.string().min(1, "Tipo de solicitação é obrigatório"),
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres").max(100, "Título muito longo"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  priority: z.string().default("normal"),
  vehiclePlate: z.string().optional(),
});

// Esquema para o formulário de atualização/tratativa
const updateFormSchema = z.object({
  message: z.string().min(3, "Mensagem deve ter pelo menos 3 caracteres"),
  newStatus: z.string().optional(),
});

// Função auxiliar para mapear status para badges
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pendente':
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pendente</Badge>;
    case 'em_analise':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Em análise</Badge>;
    case 'em_andamento':
      return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Em andamento</Badge>;
    case 'aguardando_informacao':
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Aguardando informação</Badge>;
    case 'concluido':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Concluído</Badge>;
    case 'cancelado':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Função auxiliar para mapear tipo de solicitação para texto
const getRequestTypeText = (type: string) => {
  switch (type) {
    case 'manutencao': return 'Manutenção';
    case 'pneus': return 'Pneus';
    case 'roubo': return 'Roubo';
    case 'sinistro': return 'Sinistro';
    case 'acidente': return 'Acidente';
    case 'seguranca': return 'Segurança do trabalho';
    default: return type;
  }
};

// Função auxiliar para formatar data
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '';
  try {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return dateString;
  }
};

const BaseRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('minhas');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Formulário para criar nova solicitação
  const form = useForm<z.infer<typeof requestFormSchema>>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      baseId: user?.baseId || 0,
      requestType: '',
      title: '',
      description: '',
      priority: 'normal',
      vehiclePlate: '',
    },
  });

  // Formulário para adicionar atualização/tratativa
  const updateForm = useForm<z.infer<typeof updateFormSchema>>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: {
      message: '',
      newStatus: '',
    },
  });

  // Buscar dados iniciais ao montar o componente
  useEffect(() => {
    if (user?.baseId) {
      form.setValue('baseId', user.baseId);
    }
  }, [user, form]);

  // Consulta para obter as bases
  const { data: bases, isLoading: basesLoading } = useQuery({
    queryKey: ['/api/bases'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/bases');
      return await res.json();
    },
  });

  // Consulta para obter os veículos da base do usuário
  const { data: vehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['/api/vehicles'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/vehicles');
      return await res.json();
    },
    enabled: !!user?.baseId,
  });

  // Consulta para obter as solicitações da base do usuário
  const { data: baseRequests, isLoading: requestsLoading, refetch: refetchRequests } = useQuery({
    queryKey: [`/api/bases/${user?.baseId}/requests`],
    queryFn: async () => {
      if (!user?.baseId) throw new Error("Usuário sem base");
      const res = await apiRequest('GET', `/api/bases/${user.baseId}/requests`);
      return await res.json();
    },
    enabled: !!user?.baseId,
  });

  // Consulta para obter detalhes de uma solicitação específica (incluindo atualizações)
  const { data: requestDetails, isLoading: detailsLoading, refetch: refetchDetails } = useQuery({
    queryKey: [`/api/base-requests/${selectedRequest?.id}`],
    queryFn: async () => {
      if (!selectedRequest?.id) throw new Error("Solicitação não selecionada");
      const res = await apiRequest('GET', `/api/base-requests/${selectedRequest.id}`);
      return await res.json();
    },
    enabled: !!selectedRequest?.id,
  });

  // Mutação para criar uma nova solicitação
  const createRequestMutation = useMutation({
    mutationFn: async (data: z.infer<typeof requestFormSchema>) => {
      const res = await apiRequest('POST', '/api/base-requests', data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao criar solicitação');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitação criada",
        description: "Sua solicitação foi criada com sucesso.",
      });
      form.reset();
      setCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/bases/${user?.baseId}/requests`] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar solicitação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para adicionar uma atualização/tratativa
  const addUpdateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof updateFormSchema>) => {
      if (!selectedRequest?.id) throw new Error("Solicitação não selecionada");
      const res = await apiRequest('POST', `/api/base-requests/${selectedRequest.id}/updates`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao adicionar tratativa');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Tratativa adicionada",
        description: "Sua mensagem foi adicionada com sucesso.",
      });
      updateForm.reset();
      refetchDetails();
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar tratativa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filtrar solicitações com base na aba ativa
  const filteredRequests = baseRequests?.filter((req: any) => {
    if (activeTab === 'minhas') {
      return req.requesterUserId === user?.id;
    } else if (activeTab === 'pendentes') {
      return ['pendente', 'em_analise', 'aguardando_informacao', 'em_andamento'].includes(req.status);
    } else if (activeTab === 'concluidas') {
      return ['concluido', 'cancelado'].includes(req.status);
    }
    return true;
  }) || [];

  // Manipular envio do formulário de solicitação
  const onSubmitRequest = async (data: z.infer<typeof requestFormSchema>) => {
    createRequestMutation.mutate(data);
  };

  // Manipular envio do formulário de atualização
  const onSubmitUpdate = async (data: z.infer<typeof updateFormSchema>) => {
    addUpdateMutation.mutate(data);
  };

  // Função para visualizar detalhes de uma solicitação
  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  // Renderizar página de carregamento
  if (basesLoading || vehiclesLoading || requestsLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Solicitações da Base</h1>
          <p className="text-muted-foreground">
            Gerenciamento de solicitações de manutenção, pneus e outros serviços.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova Solicitação
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="minhas">Minhas Solicitações</TabsTrigger>
          <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
          <TabsTrigger value="concluidas">Concluídas</TabsTrigger>
        </TabsList>

        <TabsContent value="minhas" className="mt-4">
          {filteredRequests.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertTitle>Nenhuma solicitação encontrada</AlertTitle>
              <AlertDescription>
                Você ainda não criou nenhuma solicitação. Use o botão "Nova Solicitação" para criar uma.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableCaption>Lista de suas solicitações</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request: any) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.id}</TableCell>
                    <TableCell>{request.title}</TableCell>
                    <TableCell>{getRequestTypeText(request.requestType)}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="capitalize">{request.priority}</TableCell>
                    <TableCell>{formatDate(request.createdAt)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewRequest(request)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="pendentes" className="mt-4">
          {filteredRequests.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4 mr-2" />
              <AlertTitle>Nenhuma solicitação pendente</AlertTitle>
              <AlertDescription>
                Não há solicitações pendentes no momento.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableCaption>Lista de solicitações pendentes</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request: any) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.id}</TableCell>
                    <TableCell>{request.title}</TableCell>
                    <TableCell>{getRequestTypeText(request.requestType)}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="capitalize">{request.priority}</TableCell>
                    <TableCell>{request.requesterUserId === user?.id ? 'Você' : 'Outro usuário'}</TableCell>
                    <TableCell>{formatDate(request.createdAt)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewRequest(request)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="concluidas" className="mt-4">
          {filteredRequests.length === 0 ? (
            <Alert>
              <Clock className="h-4 w-4 mr-2" />
              <AlertTitle>Nenhuma solicitação concluída</AlertTitle>
              <AlertDescription>
                Não há solicitações concluídas no momento.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableCaption>Lista de solicitações concluídas</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Concluída em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request: any) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.id}</TableCell>
                    <TableCell>{request.title}</TableCell>
                    <TableCell>{getRequestTypeText(request.requestType)}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="capitalize">{request.priority}</TableCell>
                    <TableCell>{request.requesterUserId === user?.id ? 'Você' : 'Outro usuário'}</TableCell>
                    <TableCell>{formatDate(request.resolvedAt || request.updatedAt)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewRequest(request)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog para criar nova solicitação */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nova Solicitação</DialogTitle>
            <DialogDescription>
              Crie uma nova solicitação para a base. Preencha todos os campos obrigatórios.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitRequest)} className="space-y-4">
              <FormField
                control={form.control}
                name="baseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                      disabled={!!user?.baseId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a base" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bases?.map((base: any) => (
                          <SelectItem key={base.id} value={base.id.toString()}>
                            {base.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requestType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Solicitação</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de solicitação" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                        <SelectItem value="pneus">Pneus</SelectItem>
                        <SelectItem value="roubo">Roubo</SelectItem>
                        <SelectItem value="sinistro">Sinistro</SelectItem>
                        <SelectItem value="acidente">Acidente</SelectItem>
                        <SelectItem value="seguranca">Segurança do trabalho</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                        placeholder="Descreva detalhadamente sua solicitação..." 
                        className="min-h-[120px]"
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
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a prioridade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehiclePlate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Veículo (opcional)</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o veículo (se aplicável)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vehicles?.map((vehicle: any) => (
                            <SelectItem key={vehicle.id} value={vehicle.plate}>
                              {vehicle.plate} - {vehicle.model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Selecione apenas se a solicitação for relacionada a um veículo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createRequestMutation.isPending}
                >
                  {createRequestMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>Criar Solicitação</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para visualizar detalhes da solicitação */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Solicitação #{selectedRequest?.id}</DialogTitle>
            <DialogDescription>
              {selectedRequest?.title}
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : requestDetails ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Tipo</h4>
                  <p>{getRequestTypeText(requestDetails.request.requestType)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Status</h4>
                  <p>{getStatusBadge(requestDetails.request.status)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Prioridade</h4>
                  <p className="capitalize">{requestDetails.request.priority}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Data de criação</h4>
                  <p>{formatDate(requestDetails.request.createdAt)}</p>
                </div>
                {requestDetails.request.vehiclePlate && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Veículo</h4>
                    <p>{requestDetails.request.vehiclePlate}</p>
                  </div>
                )}
                {requestDetails.request.assignedUserId && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Responsável</h4>
                    <p>ID: {requestDetails.request.assignedUserId}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Descrição</h4>
                <Card>
                  <CardContent className="pt-4">
                    <p className="whitespace-pre-line">{requestDetails.request.description}</p>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">Atualizações e Tratativas</h3>
                {requestDetails.updates.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <AlertTitle>Sem atualizações</AlertTitle>
                    <AlertDescription>
                      Esta solicitação ainda não possui atualizações ou tratativas.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {requestDetails.updates.map((update: any) => (
                      <Card key={update.id}>
                        <CardHeader className="py-3">
                          <div className="flex justify-between items-center">
                            <div className="font-medium">{update.userName} <span className="text-sm text-muted-foreground">({update.userRole})</span></div>
                            <div className="text-sm text-muted-foreground">{formatDate(update.createdAt)}</div>
                          </div>
                        </CardHeader>
                        <CardContent className="py-0">
                          <p className="whitespace-pre-line">{update.message}</p>
                        </CardContent>
                        {update.newStatus && (
                          <CardFooter className="py-2 border-t text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <FileEdit className="h-3 w-3 mr-1" />
                              Alterou o status para: {getStatusBadge(update.newStatus)}
                            </div>
                          </CardFooter>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Formulário para adicionar uma nova atualização */}
              {['concluido', 'cancelado'].includes(requestDetails.request.status) ? (
                <Alert>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <AlertTitle>Solicitação finalizada</AlertTitle>
                  <AlertDescription>
                    Esta solicitação já foi {requestDetails.request.status === 'concluido' ? 'concluída' : 'cancelada'} e não pode receber novas atualizações.
                  </AlertDescription>
                </Alert>
              ) : (
                <Form {...updateForm}>
                  <form onSubmit={updateForm.handleSubmit(onSubmitUpdate)} className="space-y-4">
                    <FormField
                      control={updateForm.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nova atualização</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Adicione informações ou atualizações sobre esta solicitação..." 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={updateForm.control}
                      name="newStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alterar status (opcional)</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Manter status atual" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Manter status atual</SelectItem>
                              <SelectItem value="em_analise">Em análise</SelectItem>
                              <SelectItem value="em_andamento">Em andamento</SelectItem>
                              <SelectItem value="aguardando_informacao">Aguardando informação</SelectItem>
                              <SelectItem value="concluido">Concluído</SelectItem>
                              <SelectItem value="cancelado">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Selecione apenas se deseja alterar o status da solicitação
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit"
                      disabled={addUpdateMutation.isPending}
                      className="w-full"
                    >
                      {addUpdateMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Enviar Atualização
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertTitle>Erro ao carregar detalhes</AlertTitle>
              <AlertDescription>
                Não foi possível carregar os detalhes desta solicitação.
              </AlertDescription>
            </Alert>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BaseRequests;