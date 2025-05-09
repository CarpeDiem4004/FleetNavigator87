import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { 
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage 
} from '@/components/ui/form';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import {
  HoverCard, HoverCardContent, HoverCardTrigger
} from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { 
  AlertCircle, ArrowLeft, Check, CircleDot, Clock, Trash, 
  Eye, Info as InfoIcon, RefreshCcw as Repeat, CheckCheck
} from 'lucide-react';
import { useLocation } from 'wouter';

// ID da base Campinas (presumindo que já foi criada no banco)
const CAMPINAS_BASE_ID = 9; // Ajuste este ID conforme necessário

// Interface para solicitações de pneus
interface TireRequest {
  id: number;
  base_id: number;
  base_nome: string;
  usuario_id: number;
  usuario_nome: string;
  quantidade: number;
  placa_veiculo: string;
  km_veiculo: number;
  medida: string;
  motivo: string;
  observacoes: string | null;
  status: 'pendente' | 'aprovado' | 'negado' | 'em_analise' | 'concluido';
  data_solicitacao: string;
  data_aprovacao: string | null;
  aprovador_id: number | null;
  aprovador_nome: string | null;
  data_previsao: string | null;
  observacoes_aprovacao: string | null;
}

// Schema de validação para o formulário de solicitação de pneus
const tireRequestSchema = z.object({
  quantidade: z.string().min(1, "Quantidade é obrigatória"),
  placa_veiculo: z.string().min(1, "Placa do veículo é obrigatória"),
  km_veiculo: z.string().min(1, "Quilometragem do veículo é obrigatória"),
  medida: z.string().min(1, "Medida é obrigatória"),
  motivo: z.string().min(5, "Motivo é obrigatório e deve ter pelo menos 5 caracteres"),
  observacoes: z.string().optional(),
});

type TireRequestFormValues = z.infer<typeof tireRequestSchema>;

const SolicitacaoPneusCampinas: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Consulta para obter as solicitações de pneus
  const { data: tireRequests, isLoading, error } = useQuery({
    queryKey: ['/api/bases/campinas/solicitacao-pneus'],
    // Utilizando o queryFn padrão do TanStack Query que está configurado no queryClient
  });

  // Formulário para solicitação de pneus
  const form = useForm<TireRequestFormValues>({
    resolver: zodResolver(tireRequestSchema),
    defaultValues: {
      quantidade: "1",
      placa_veiculo: "",
      km_veiculo: "",
      medida: "",
      motivo: "",
      observacoes: "",
    },
  });

  // Mutação para salvar solicitação de pneus
  const saveMutation = useMutation({
    mutationFn: async (values: TireRequestFormValues) => {
      const requestData = {
        base_id: CAMPINAS_BASE_ID,
        quantidade: parseInt(values.quantidade),
        placa_veiculo: values.placa_veiculo.toUpperCase(),
        km_veiculo: parseInt(values.km_veiculo),
        medida: values.medida,
        motivo: values.motivo,
        observacoes: values.observacoes || null,
      };

      // Usar a função apiRequest com os parâmetros corretos
      const response = await apiRequest(
        'POST',
        '/api/bases/campinas/solicitacao-pneus',
        requestData
      );

      return response;
    },
    onSuccess: () => {
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de pneus foi enviada com sucesso.",
        variant: "default",
      });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/bases/campinas/solicitacao-pneus'] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar",
        description: "Ocorreu um erro ao enviar a solicitação. Tente novamente.",
        variant: "destructive",
      });
      console.error("Erro ao enviar solicitação:", error);
    },
  });

  // Função para lidar com o envio do formulário
  const onSubmit = (values: TireRequestFormValues) => {
    saveMutation.mutate(values);
  };

  // Função para formatar o status da solicitação
  const formatStatus = (status: string) => {
    const statusMap = {
      pendente: { color: 'bg-yellow-100 text-yellow-800', text: 'Pendente', icon: <Clock className="w-3 h-3 mr-1" /> },
      em_analise: { color: 'bg-blue-100 text-blue-800', text: 'Em Análise', icon: <Repeat className="w-3 h-3 mr-1" /> },
      aprovado: { color: 'bg-green-100 text-green-800', text: 'Aprovado', icon: <Check className="w-3 h-3 mr-1" /> },
      negado: { color: 'bg-red-100 text-red-800', text: 'Negado', icon: <Trash className="w-3 h-3 mr-1" /> },
      concluido: { color: 'bg-indigo-100 text-indigo-800', text: 'Concluído', icon: <CheckCheck className="w-3 h-3 mr-1" /> }
    };

    const { color, text, icon } = statusMap[status as keyof typeof statusMap] || statusMap.pendente;

    return (
      <Badge className={`flex items-center ${color}`}>
        {icon} {text}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/bases/campinas')}
          className="mr-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          Solicitação de Pneus - Base Campinas
        </h1>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <p className="text-gray-600">
            Solicite pneus para a equipe de gestão de pneus.
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Informe detalhes como placa e quilometragem do veículo, medida do pneu e a justificativa para a solicitação.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <CircleDot className="w-4 h-4 mr-2" />
              Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto pt-6 pb-6">
            <DialogHeader className="mb-4">
              <DialogTitle>Nova Solicitação de Pneus</DialogTitle>
              <DialogDescription>
                Preencha os detalhes dos pneus que você precisa solicitar.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="quantidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Quantidade de pneus"
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
                    name="placa_veiculo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Placa do Veículo</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: ABC1234" 
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="km_veiculo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>KM do Veículo</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Quilometragem atual" 
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
                  name="medida"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medida do Pneu</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 275/80R22.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="motivo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo da Solicitação</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o motivo da solicitação"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações adicionais"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="mt-6 pt-4">
                  <Button
                    type="reset"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="mr-2"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {saveMutation.isPending ? (
                      <>Enviando...</>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Enviar Solicitação
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-md">
        <CardHeader className="bg-green-50">
          <CardTitle className="flex items-center text-green-700">
            <CircleDot className="w-5 h-5 mr-2" />
            Solicitações de Pneus
          </CardTitle>
          <CardDescription>
            Histórico de solicitações da Base Campinas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <p>Carregando solicitações...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-500">Erro ao carregar solicitações</p>
              <p className="text-sm text-gray-500 mt-2">
                Verifique sua conexão e tente novamente.
              </p>
            </div>
          ) : !tireRequests || !Array.isArray(tireRequests) || tireRequests.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">
                Nenhuma solicitação de pneus encontrada para a Base Campinas.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Clique em "Nova Solicitação" para solicitar pneus.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">ID</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>KM</TableHead>
                    <TableHead>Medida</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Previsão</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(tireRequests) && tireRequests.map((request) => (
                    <TableRow key={request.id} className="group">
                      <TableCell className="font-medium">{request.id}</TableCell>
                      <TableCell>
                        {new Date(request.data_solicitacao).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="uppercase font-medium">{request.placa_veiculo}</TableCell>
                      <TableCell>{request.km_veiculo?.toLocaleString('pt-BR') || '-'}</TableCell>
                      <TableCell>{request.medida}</TableCell>
                      <TableCell className="text-center">{request.quantidade}</TableCell>
                      <TableCell>{request.usuario_nome}</TableCell>
                      <TableCell>{formatStatus(request.status)}</TableCell>
                      <TableCell>
                        {request.data_previsao ? (
                          <div className="flex items-center">
                            <span className="text-green-600 font-medium">
                              {new Date(request.data_previsao).toLocaleDateString('pt-BR')}
                            </span>
                            {request.observacoes_aprovacao && (
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 ml-1">
                                    <InfoIcon className="h-4 w-4 text-blue-600" />
                                  </Button>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80 p-4">
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-semibold">Observações da gestão de pneus:</h4>
                                    <p className="text-sm">{request.observacoes_aprovacao}</p>
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {request.status === 'aprovado' ? 'Não definida' : 'Aguardando'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="h-4 w-4 mr-1" />
                              Detalhes
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                              <DialogTitle>Detalhes da Solicitação #{request.id}</DialogTitle>
                              <DialogDescription>
                                Informações completas sobre esta solicitação de pneus
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Status</h4>
                                  <div>{formatStatus(request.status)}</div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Data da Solicitação</h4>
                                  <div className="text-sm">
                                    {new Date(request.data_solicitacao).toLocaleDateString('pt-BR', { 
                                      day: '2-digit', 
                                      month: '2-digit', 
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Placa do Veículo</h4>
                                  <div className="text-sm uppercase font-medium">{request.placa_veiculo}</div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Quilometragem</h4>
                                  <div className="text-sm">{request.km_veiculo?.toLocaleString('pt-BR') || '-'} km</div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Medida do Pneu</h4>
                                  <div className="text-sm">{request.medida}</div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Quantidade</h4>
                                  <div className="text-sm">{request.quantidade} unidades</div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium mb-1">Solicitante</h4>
                                <div className="text-sm">{request.usuario_nome}</div>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium mb-1">Motivo da Solicitação</h4>
                                <div className="text-sm border rounded-md p-3 bg-gray-50">{request.motivo}</div>
                              </div>
                              
                              {request.observacoes && (
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Observações</h4>
                                  <div className="text-sm border rounded-md p-3 bg-gray-50">{request.observacoes}</div>
                                </div>
                              )}
                              
                              {request.status !== 'pendente' && (
                                <div className="border-t pt-4 mt-4">
                                  <h4 className="text-sm font-medium mb-2">Informações da Resposta</h4>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    {request.data_aprovacao && (
                                      <div>
                                        <h5 className="text-xs text-gray-500 mb-1">Data da Resposta</h5>
                                        <div className="text-sm">
                                          {new Date(request.data_aprovacao).toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                          })}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {request.aprovador_nome && (
                                      <div>
                                        <h5 className="text-xs text-gray-500 mb-1">Responsável</h5>
                                        <div className="text-sm">{request.aprovador_nome}</div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {request.data_previsao && (
                                    <div className="mt-3">
                                      <h5 className="text-xs text-gray-500 mb-1">Previsão de Entrega/Troca</h5>
                                      <div className="text-sm font-medium text-green-600">
                                        {new Date(request.data_previsao).toLocaleDateString('pt-BR', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric'
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {request.observacoes_aprovacao && (
                                    <div className="mt-3">
                                      <h5 className="text-xs text-gray-500 mb-1">Observações da Gestão de Pneus</h5>
                                      <div className="text-sm border rounded-md p-3 bg-blue-50 text-blue-800">
                                        {request.observacoes_aprovacao}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-gray-50 border-t p-4">
          <p className="text-sm text-gray-500">
            Total: {Array.isArray(tireRequests) ? tireRequests.length : 0} solicitações
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SolicitacaoPneusCampinas;