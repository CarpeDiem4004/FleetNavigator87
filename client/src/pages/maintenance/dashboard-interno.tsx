import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMaintenanceAuth, useMaintenanceApi } from "@/hooks/use-maintenance-auth";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Plus, 
  Wrench, 
  Building2, 
  Car, 
  FileText, 
  BarChart3, 
  Calendar,
  DollarSign,
  LogOut,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit,
  Eye
} from "lucide-react";

const createOSSchema = z.object({
  veiculo_id: z.string().min(1, "Veículo é obrigatório"),
  oficina_id: z.string().min(1, "Oficina é obrigatória"),
  tipo_manutencao: z.enum(['preventiva', 'corretiva', 'preditiva', 'emergencial']),
  descricao_problema: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  km_veiculo: z.string().optional(),
  data_agendamento: z.string().optional(),
  observacoes_internas: z.string().optional()
});

const editOSSchema = z.object({
  tipo_manutencao: z.enum(['preventiva', 'corretiva', 'preditiva', 'emergencial']),
  descricao_problema: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  status: z.enum(['pendente', 'recebido', 'em_execucao', 'aguardando_peca', 'finalizado', 'cancelado']),
  km_veiculo: z.string().optional(),
  data_agendamento: z.string().optional(),
  data_previsao_entrega: z.string().optional(),
  valor_mao_obra: z.string().optional(),
  valor_total_pecas: z.string().optional(),
  observacoes_oficina: z.string().optional(),
  observacoes_internas: z.string().optional()
});

const statusColors = {
  pendente: "bg-yellow-100 text-yellow-800",
  recebido: "bg-blue-100 text-blue-800", 
  em_execucao: "bg-orange-100 text-orange-800",
  aguardando_peca: "bg-purple-100 text-purple-800",
  finalizado: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800"
};

const statusLabels = {
  pendente: "Pendente",
  recebido: "Recebido", 
  em_execucao: "Em Execução",
  aguardando_peca: "Aguardando Peça",
  finalizado: "Finalizado",
  cancelado: "Cancelado"
};

const tipoLabels = {
  preventiva: "Preventiva",
  corretiva: "Corretiva",
  preditiva: "Preditiva",
  emergencial: "Emergencial"
};

export default function DashboardInterno() {
  const { user, logout } = useMaintenanceAuth();
  const { user: authUser } = useAuth();
  const { makeRequest } = useMaintenanceApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingOS, setEditingOS] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("ordens");
  
  // Verificar se é administrador
  const isAdmin = authUser?.role === 'admin';

  // Buscar dados
  const { data: ordensServico, isLoading: loadingOrdens } = useQuery({
    queryKey: ['/api/maintenance/ordens-servico'],
    queryFn: () => makeRequest('/api/maintenance/ordens-servico')
  });

  const { data: veiculos } = useQuery({
    queryKey: ['/api/maintenance/veiculos'],
    queryFn: () => makeRequest('/api/maintenance/veiculos')
  });

  const { data: oficinas } = useQuery({
    queryKey: ['/api/maintenance/oficinas'],
    queryFn: () => makeRequest('/api/maintenance/oficinas')
  });

  const { data: relatorioCustos } = useQuery({
    queryKey: ['/api/maintenance/relatorios', 'custos_por_oficina'],
    queryFn: () => makeRequest('/api/maintenance/relatorios?tipo=custos_por_oficina&data_inicio=2024-01-01&data_fim=2024-12-31')
  });

  const { data: relatorioStatus } = useQuery({
    queryKey: ['/api/maintenance/relatorios', 'status_os'],
    queryFn: () => makeRequest('/api/maintenance/relatorios?tipo=status_os&data_inicio=2024-01-01&data_fim=2024-12-31')
  });

  const createOSForm = useForm<z.infer<typeof createOSSchema>>({
    resolver: zodResolver(createOSSchema),
    defaultValues: {
      veiculo_id: '',
      oficina_id: '',
      tipo_manutencao: 'preventiva',
      descricao_problema: '',
      km_veiculo: '',
      data_agendamento: '',
      observacoes_internas: ''
    }
  });

  const editOSForm = useForm<z.infer<typeof editOSSchema>>({
    resolver: zodResolver(editOSSchema),
    defaultValues: {
      tipo_manutencao: 'preventiva',
      descricao_problema: '',
      status: 'pendente',
      km_veiculo: '',
      data_agendamento: '',
      data_previsao_entrega: '',
      valor_mao_obra: '',
      valor_total_pecas: '',
      observacoes_oficina: '',
      observacoes_internas: ''
    }
  });

  // Mutation para criar OS
  const createOSMutation = useMutation({
    mutationFn: async (data: any) => {
      return makeRequest('/api/maintenance/ordens-servico', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance/ordens-servico'] });
      setShowCreateDialog(false);
      createOSForm.reset();
      toast({
        title: "Ordem criada",
        description: "A ordem de serviço foi criada com sucesso"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar ordem",
        description: "Não foi possível criar a ordem de serviço",
        variant: "destructive"
      });
    }
  });

  const onCreateOS = (values: z.infer<typeof createOSSchema>) => {
    const osData = {
      veiculo_id: parseInt(values.veiculo_id),
      oficina_id: parseInt(values.oficina_id),
      tipo_manutencao: values.tipo_manutencao,
      descricao_problema: values.descricao_problema,
      km_veiculo: values.km_veiculo ? parseInt(values.km_veiculo) : null,
      data_agendamento: values.data_agendamento || null,
      observacoes_internas: values.observacoes_internas || null
    };

    createOSMutation.mutate(osData);
  };

  const onEditOS = (values: z.infer<typeof editOSSchema>) => {
    if (!editingOS) return;
    
    const osData = {
      tipo_manutencao: values.tipo_manutencao,
      descricao_problema: values.descricao_problema,
      status: values.status,
      km_veiculo: values.km_veiculo ? parseInt(values.km_veiculo) : null,
      data_agendamento: values.data_agendamento || null,
      data_previsao_entrega: values.data_previsao_entrega || null,
      valor_mao_obra: values.valor_mao_obra ? parseFloat(values.valor_mao_obra) : null,
      valor_total_pecas: values.valor_total_pecas ? parseFloat(values.valor_total_pecas) : null,
      observacoes_oficina: values.observacoes_oficina || null,
      observacoes_internas: values.observacoes_internas || null
    };

    editOSMutation.mutate({ id: editingOS.id, data: osData });
  };

  const handleEditOS = (os: any) => {
    setEditingOS(os);
    editOSForm.reset({
      tipo_manutencao: os.tipo_manutencao,
      descricao_problema: os.descricao_problema,
      status: os.status,
      km_veiculo: os.km_veiculo ? os.km_veiculo.toString() : '',
      data_agendamento: os.data_agendamento ? new Date(os.data_agendamento).toISOString().split('T')[0] : '',
      data_previsao_entrega: os.data_previsao_entrega ? new Date(os.data_previsao_entrega).toISOString().split('T')[0] : '',
      valor_mao_obra: os.valor_mao_obra ? os.valor_mao_obra.toString() : '',
      valor_total_pecas: os.valor_total_pecas ? os.valor_total_pecas.toString() : '',
      observacoes_oficina: os.observacoes_oficina || '',
      observacoes_internas: os.observacoes_internas || ''
    });
    setShowEditDialog(true);
  };

  // Função para excluir ordem de serviço (apenas para administradores)
  const handleDeleteOS = async (osId: number) => {
    if (!isAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Apenas administradores podem excluir ordens de serviço.',
        variant: 'destructive'
      });
      return;
    }

    if (!confirm('Tem certeza que deseja excluir esta ordem de serviço? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await fetch(`/api/maintenance/${osId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Ordem de serviço excluída com sucesso.'
        });
        queryClient.invalidateQueries({ queryKey: ['/api/maintenance/orders'] });
      } else {
        const error = await response.json();
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao excluir ordem de serviço.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro de comunicação com o servidor.',
        variant: 'destructive'
      });
    }
  };

  if (loadingOrdens) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Wrench className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p>Carregando sistema de manutenção...</p>
        </div>
      </div>
    );
  }

  const ordens = ordensServico?.data || [];
  const vehicleList = veiculos?.data || [];
  const oficinasList = oficinas?.data || [];

  // Calcular estatísticas
  const totalOrdens = ordens.length;
  const ordensAbertas = ordens.filter((os: any) => 
    ['pendente', 'recebido', 'em_execucao', 'aguardando_peca'].includes(os.status)
  ).length;
  const ordensFinalizadas = ordens.filter((os: any) => os.status === 'finalizado').length;
  const custoTotal = ordens.reduce((acc: number, os: any) => acc + parseFloat(os.valor_total || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Sistema de Manutenção - Gestão Interna
                </h1>
                <p className="text-sm text-gray-500">
                  Bem-vindo, {user?.name}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Ordens</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrdens}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ordens Abertas</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordensAbertas}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordensFinalizadas}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {custoTotal.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ordens">Ordens de Serviço</TabsTrigger>
            <TabsTrigger value="veiculos">Veículos</TabsTrigger>
            <TabsTrigger value="oficinas">Oficinas</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>

          {/* Tab Ordens de Serviço */}
          <TabsContent value="ordens" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Ordens de Serviço</CardTitle>
                    <CardDescription>
                      Gerencie todas as ordens de serviço do sistema
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Ordem
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ordens.map((os: any) => (
                    <div key={os.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-lg">OS #{os.numero_os}</h3>
                            <Badge className={statusColors[os.status as keyof typeof statusColors]}>
                              {statusLabels[os.status as keyof typeof statusLabels]}
                            </Badge>
                            <Badge variant="outline">
                              {tipoLabels[os.tipo_manutencao as keyof typeof tipoLabels]}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center space-x-2">
                              <Car className="h-4 w-4" />
                              <span>{os.placa} - {os.marca} {os.modelo}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Building2 className="h-4 w-4" />
                              <span>{os.nome_fantasia || os.razao_social}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>Criado: {new Date(os.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                          
                          <p className="text-gray-700">{os.descricao_problema}</p>
                          
                          {os.observacoes_oficina && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                              <strong>Observações da oficina:</strong> {os.observacoes_oficina}
                            </div>
                          )}
                          
                          {os.observacoes_internas && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                              <strong>Observações internas:</strong> {os.observacoes_internas}
                            </div>
                          )}
                        </div>
                        
                        {/* Botões de ação */}
                        <div className="flex items-center space-x-2 ml-4">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Detalhes
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditOS(os)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          {isAdmin && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteOS(os.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Excluir
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Peças: {os.total_pecas || 0} | Anexos: {os.total_anexos || 0}</span>
                        {os.valor_total > 0 && (
                          <span className="flex items-center font-medium">
                            <DollarSign className="h-4 w-4 mr-1" />
                            Total: R$ {parseFloat(os.valor_total).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {ordens.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhuma ordem de serviço encontrada</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Veículos */}
          <TabsContent value="veiculos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Veículos Cadastrados</CardTitle>
                <CardDescription>
                  Lista de veículos disponíveis para manutenção
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vehicleList.map((veiculo: any) => (
                    <div key={veiculo.id} className="border rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <Car className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold">{veiculo.placa}</h3>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>Marca:</strong> {veiculo.marca}</p>
                        <p><strong>Modelo:</strong> {veiculo.modelo}</p>
                        <p><strong>Ano:</strong> {veiculo.ano}</p>
                        {veiculo.km_atual && (
                          <p><strong>KM Atual:</strong> {veiculo.km_atual.toLocaleString()}</p>
                        )}
                        <p><strong>Tipo:</strong> {veiculo.tipo_veiculo}</p>
                        {veiculo.base_name && (
                          <p><strong>Base:</strong> {veiculo.base_name}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {vehicleList.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhum veículo cadastrado</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Oficinas */}
          <TabsContent value="oficinas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Oficinas Credenciadas</CardTitle>
                <CardDescription>
                  Lista de oficinas parceiras do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {oficinasList.map((oficina: any) => (
                    <div key={oficina.id} className="border rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold">{oficina.nome_fantasia || oficina.razao_social}</h3>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p><strong>Razão Social:</strong> {oficina.razao_social}</p>
                        <p><strong>CNPJ:</strong> {oficina.cnpj}</p>
                        <p><strong>Email:</strong> {oficina.email}</p>
                        {oficina.telefone && (
                          <p><strong>Telefone:</strong> {oficina.telefone}</p>
                        )}
                        {oficina.cidade && oficina.estado && (
                          <p><strong>Localização:</strong> {oficina.cidade}/{oficina.estado}</p>
                        )}
                        {oficina.especialidades && (
                          <div>
                            <strong>Especialidades:</strong>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {JSON.parse(oficina.especialidades).map((esp: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {esp}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {oficinasList.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhuma oficina credenciada</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Relatórios */}
          <TabsContent value="relatorios" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Relatório de Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Status das Ordens</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {relatorioStatus?.data?.map((item: any) => (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className={statusColors[item.status as keyof typeof statusColors]}>
                            {statusLabels[item.status as keyof typeof statusLabels]}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{item.quantidade}</div>
                          <div className="text-sm text-gray-500">
                            R$ {parseFloat(item.valor_total || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Relatório de Custos por Oficina */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Custos por Oficina</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {relatorioCustos?.data?.slice(0, 5).map((item: any) => (
                      <div key={item.razao_social} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{item.nome_fantasia || item.razao_social}</div>
                          <div className="text-sm text-gray-500">{item.total_os} ordens</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">R$ {parseFloat(item.valor_total || 0).toFixed(2)}</div>
                          <div className="text-sm text-gray-500">
                            Média: R$ {parseFloat(item.valor_medio || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog para criar nova OS */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nova Ordem de Serviço</DialogTitle>
            <DialogDescription>
              Crie uma nova ordem de serviço para um veículo
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createOSForm}>
            <form onSubmit={createOSForm.handleSubmit(onCreateOS)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createOSForm.control}
                  name="veiculo_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Veículo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o veículo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vehicleList.map((veiculo: any) => (
                            <SelectItem key={veiculo.id} value={veiculo.id.toString()}>
                              {veiculo.placa} - {veiculo.marca} {veiculo.modelo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createOSForm.control}
                  name="oficina_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Oficina</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a oficina" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {oficinasList.map((oficina: any) => (
                            <SelectItem key={oficina.id} value={oficina.id.toString()}>
                              {oficina.nome_fantasia || oficina.razao_social}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createOSForm.control}
                  name="tipo_manutencao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Manutenção</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="preventiva">Preventiva</SelectItem>
                          <SelectItem value="corretiva">Corretiva</SelectItem>
                          <SelectItem value="preditiva">Preditiva</SelectItem>
                          <SelectItem value="emergencial">Emergencial</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createOSForm.control}
                  name="km_veiculo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>KM do Veículo</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="KM atual"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createOSForm.control}
                name="descricao_problema"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição do Problema</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva detalhadamente o problema ou serviço a ser realizado..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createOSForm.control}
                name="data_agendamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Agendamento (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createOSForm.control}
                name="observacoes_internas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações Internas (opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observações para uso interno..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={createOSMutation.isPending}>
                  {createOSMutation.isPending ? "Criando..." : "Criar Ordem"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar OS */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Editar Ordem de Serviço</DialogTitle>
            <DialogDescription>
              Edite os detalhes da ordem de serviço {editingOS?.numero_os}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editOSForm}>
            <form onSubmit={editOSForm.handleSubmit(onEditOS)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editOSForm.control}
                  name="tipo_manutencao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Manutenção</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="preventiva">Preventiva</SelectItem>
                          <SelectItem value="corretiva">Corretiva</SelectItem>
                          <SelectItem value="preditiva">Preditiva</SelectItem>
                          <SelectItem value="emergencial">Emergencial</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editOSForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="recebido">Recebido</SelectItem>
                          <SelectItem value="em_execucao">Em Execução</SelectItem>
                          <SelectItem value="aguardando_peca">Aguardando Peça</SelectItem>
                          <SelectItem value="finalizado">Finalizado</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editOSForm.control}
                name="descricao_problema"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição do Problema</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva o problema ou serviço necessário..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={editOSForm.control}
                  name="km_veiculo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>KM do Veículo</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="Ex: 45000"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editOSForm.control}
                  name="data_agendamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Agendamento</FormLabel>
                      <FormControl>
                        <Input 
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editOSForm.control}
                  name="data_previsao_entrega"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Previsão de Entrega</FormLabel>
                      <FormControl>
                        <Input 
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editOSForm.control}
                  name="valor_mao_obra"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Mão de Obra (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="Ex: 150.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editOSForm.control}
                  name="valor_total_pecas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Total Peças (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="Ex: 85.50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editOSForm.control}
                name="observacoes_oficina"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações da Oficina</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observações e comentários da oficina..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editOSForm.control}
                name="observacoes_internas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações Internas</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observações para uso interno..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditDialog(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={editOSMutation.isPending}>
                  {editOSMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}