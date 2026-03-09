import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMaintenanceAuth, useMaintenanceApi } from "@/hooks/use-maintenance-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Clock, 
  Wrench, 
  CheckCircle, 
  AlertCircle, 
  Truck, 
  Calendar,
  DollarSign,
  Plus,
  LogOut,
  FileText,
  Settings
} from "lucide-react";

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

const updateStatusSchema = z.object({
  status: z.enum(['recebido', 'em_execucao', 'aguardando_peca', 'finalizado']),
  observacoes_oficina: z.string().optional(),
  data_previsao_entrega: z.string().optional(),
  valor_mao_obra: z.string().optional()
});

const addPecaSchema = z.object({
  nome_peca: z.string().min(1, "Nome da peça é obrigatório"),
  codigo_peca: z.string().optional(),
  quantidade: z.string().min(1, "Quantidade é obrigatória"),
  valor_unitario: z.string().min(1, "Valor unitário é obrigatório"),
  fornecedor: z.string().optional()
});

export default function DashboardOficina() {
  const { user, logout } = useMaintenanceAuth();
  const { makeRequest } = useMaintenanceApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedOS, setSelectedOS] = useState<any>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showPecasDialog, setShowPecasDialog] = useState(false);

  // Buscar ordens de serviço
  const { data: ordensServico, isLoading } = useQuery({
    queryKey: ['/api/maintenance/ordens-servico'],
    queryFn: () => makeRequest('/api/maintenance/ordens-servico')
  });

  // Buscar peças de uma OS específica
  const { data: pecasData } = useQuery({
    queryKey: ['/api/maintenance/ordens-servico', selectedOS?.id, 'pecas'],
    queryFn: () => makeRequest(`/api/maintenance/ordens-servico/${selectedOS.id}/pecas`),
    enabled: !!selectedOS?.id
  });

  const updateStatusForm = useForm<z.infer<typeof updateStatusSchema>>({
    resolver: zodResolver(updateStatusSchema),
    defaultValues: {
      status: 'recebido',
      observacoes_oficina: '',
      data_previsao_entrega: '',
      valor_mao_obra: ''
    }
  });

  const addPecaForm = useForm<z.infer<typeof addPecaSchema>>({
    resolver: zodResolver(addPecaSchema),
    defaultValues: {
      nome_peca: '',
      codigo_peca: '',
      quantidade: '',
      valor_unitario: '',
      fornecedor: ''
    }
  });

  // Mutation para atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: async (data: { osId: number; updates: any }) => {
      return makeRequest(`/api/maintenance/ordens-servico/${data.osId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data.updates)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance/ordens-servico'] });
      setShowUpdateDialog(false);
      toast({
        title: "Status atualizado",
        description: "O status da ordem de serviço foi atualizado com sucesso"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o status da ordem de serviço",
        variant: "destructive"
      });
    }
  });

  // Mutation para adicionar peça
  const addPecaMutation = useMutation({
    mutationFn: async (data: { osId: number; peca: any }) => {
      return makeRequest(`/api/maintenance/ordens-servico/${data.osId}/pecas`, {
        method: 'POST',
        body: JSON.stringify(data.peca)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance/ordens-servico'] });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/maintenance/ordens-servico', selectedOS?.id, 'pecas'] 
      });
      addPecaForm.reset();
      toast({
        title: "Peça adicionada",
        description: "A peça foi adicionada à ordem de serviço com sucesso"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar peça",
        description: "Não foi possível adicionar a peça",
        variant: "destructive"
      });
    }
  });

  const onUpdateStatus = (values: z.infer<typeof updateStatusSchema>) => {
    const updates: any = { status: values.status };
    
    if (values.observacoes_oficina) {
      updates.observacoes_oficina = values.observacoes_oficina;
    }
    
    if (values.data_previsao_entrega) {
      updates.data_previsao_entrega = values.data_previsao_entrega;
    }
    
    if (values.valor_mao_obra) {
      updates.valor_mao_obra = parseFloat(values.valor_mao_obra);
    }

    updateStatusMutation.mutate({
      osId: selectedOS.id,
      updates
    });
  };

  const onAddPeca = (values: z.infer<typeof addPecaSchema>) => {
    addPecaMutation.mutate({
      osId: selectedOS.id,
      peca: {
        nome_peca: values.nome_peca,
        codigo_peca: values.codigo_peca,
        quantidade: parseInt(values.quantidade),
        valor_unitario: parseFloat(values.valor_unitario),
        fornecedor: values.fornecedor
      }
    });
  };

  const openUpdateDialog = (os: any) => {
    setSelectedOS(os);
    updateStatusForm.reset({
      status: os.status === 'pendente' ? 'recebido' : os.status,
      observacoes_oficina: os.observacoes_oficina || '',
      data_previsao_entrega: os.data_previsao_entrega ? 
        new Date(os.data_previsao_entrega).toISOString().split('T')[0] : '',
      valor_mao_obra: os.valor_mao_obra ? os.valor_mao_obra.toString() : ''
    });
    setShowUpdateDialog(true);
  };

  const openPecasDialog = (os: any) => {
    setSelectedOS(os);
    setShowPecasDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Wrench className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p>Carregando ordens de serviço...</p>
        </div>
      </div>
    );
  }

  const ordens = ordensServico?.data || [];
  const totalOrdens = ordens.length;
  const ordensEmAndamento = ordens.filter((os: any) => 
    ['recebido', 'em_execucao', 'aguardando_peca'].includes(os.status)
  ).length;
  const ordensFinalizadas = ordens.filter((os: any) => os.status === 'finalizado').length;

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
                  {user?.nome_fantasia || user?.razao_social}
                </h1>
                <p className="text-sm text-gray-500">
                  CNPJ: {user?.cnpj}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordensEmAndamento}</div>
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
        </div>

        {/* Ordens de Serviço */}
        <Card>
          <CardHeader>
            <CardTitle>Ordens de Serviço</CardTitle>
            <CardDescription>
              Gerencie suas ordens de serviço e atualize o status conforme o progresso
            </CardDescription>
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
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Truck className="h-4 w-4" />
                          <span>{os.placa} - {os.marca} {os.modelo}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Criado em: {new Date(os.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      
                      <p className="mt-2 text-gray-700">{os.descricao_problema}</p>
                      
                      {os.observacoes_oficina && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                          <strong>Observações da oficina:</strong> {os.observacoes_oficina}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openUpdateDialog(os)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Atualizar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openPecasDialog(os)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Peças
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Tipo: {os.tipo_manutencao}</span>
                    {os.valor_total > 0 && (
                      <span className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        Total: R$ {parseFloat(os.valor_total).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {ordens.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma ordem de serviço encontrada</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para atualizar status */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Atualizar Ordem de Serviço</DialogTitle>
            <DialogDescription>
              OS #{selectedOS?.numero_os} - {selectedOS?.placa}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...updateStatusForm}>
            <form onSubmit={updateStatusForm.handleSubmit(onUpdateStatus)} className="space-y-4">
              <FormField
                control={updateStatusForm.control}
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
                        <SelectItem value="recebido">Recebido</SelectItem>
                        <SelectItem value="em_execucao">Em Execução</SelectItem>
                        <SelectItem value="aguardando_peca">Aguardando Peça</SelectItem>
                        <SelectItem value="finalizado">Finalizado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updateStatusForm.control}
                name="observacoes_oficina"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Adicione observações sobre o progresso..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updateStatusForm.control}
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

              <FormField
                control={updateStatusForm.control}
                name="valor_mao_obra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Mão de Obra (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={updateStatusMutation.isPending}>
                  {updateStatusMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para gerenciar peças */}
      <Dialog open={showPecasDialog} onOpenChange={setShowPecasDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Gerenciar Peças</DialogTitle>
            <DialogDescription>
              OS #{selectedOS?.numero_os} - {selectedOS?.placa}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Lista de peças existentes */}
            <div>
              <h4 className="font-medium mb-3">Peças Utilizadas</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {pecasData?.data?.map((peca: any) => (
                  <div key={peca.id} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <span className="font-medium">{peca.nome_peca}</span>
                      {peca.codigo_peca && (
                        <span className="text-sm text-gray-500 ml-2">({peca.codigo_peca})</span>
                      )}
                      <div className="text-sm text-gray-600">
                        Qtd: {peca.quantidade} | Valor: R$ {parseFloat(peca.valor_total).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {(!pecasData?.data || pecasData.data.length === 0) && (
                  <p className="text-gray-500 text-sm">Nenhuma peça adicionada ainda</p>
                )}
              </div>
            </div>

            {/* Formulário para adicionar nova peça */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Adicionar Nova Peça</h4>
              <Form {...addPecaForm}>
                <form onSubmit={addPecaForm.handleSubmit(onAddPeca)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addPecaForm.control}
                      name="nome_peca"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Peça</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Pastilha de freio" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addPecaForm.control}
                      name="codigo_peca"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código (opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: PF-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addPecaForm.control}
                      name="quantidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addPecaForm.control}
                      name="valor_unitario"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Unitário (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={addPecaForm.control}
                    name="fornecedor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fornecedor (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do fornecedor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={addPecaMutation.isPending} className="w-full">
                    {addPecaMutation.isPending ? "Adicionando..." : "Adicionar Peça"}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}