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
import { Badge } from '@/components/ui/badge';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { 
  AlertCircle, ArrowLeft, Check, CircleDot, Clock, Trash
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
  marca: string;
  modelo: string;
  medida: string;
  tipo: string;
  motivo: string;
  observacoes: string | null;
  status: 'pendente' | 'aprovado' | 'negado' | 'concluido';
  data_solicitacao: string;
  data_aprovacao: string | null;
  aprovador_id: number | null;
  aprovador_nome: string | null;
}

// Schema de validação para o formulário de solicitação de pneus
const tireRequestSchema = z.object({
  quantidade: z.string().min(1, "Quantidade é obrigatória"),
  marca: z.string().min(1, "Marca é obrigatória"),
  modelo: z.string().min(1, "Modelo é obrigatório"),
  medida: z.string().min(1, "Medida é obrigatória"),
  tipo: z.string().min(1, "Tipo é obrigatório"),
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
    queryFn: async () => {
      const response = await apiRequest<TireRequest[]>('/api/bases/campinas/solicitacao-pneus');
      return response;
    },
  });

  // Formulário para solicitação de pneus
  const form = useForm<TireRequestFormValues>({
    resolver: zodResolver(tireRequestSchema),
    defaultValues: {
      quantidade: "1",
      marca: "",
      modelo: "",
      medida: "",
      tipo: "",
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
        marca: values.marca,
        modelo: values.modelo,
        medida: values.medida,
        tipo: values.tipo,
        motivo: values.motivo,
        observacoes: values.observacoes || null,
      };

      const response = await apiRequest('/api/bases/campinas/solicitacao-pneus', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

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
      aprovado: { color: 'bg-green-100 text-green-800', text: 'Aprovado', icon: <Check className="w-3 h-3 mr-1" /> },
      negado: { color: 'bg-red-100 text-red-800', text: 'Negado', icon: <Trash className="w-3 h-3 mr-1" /> },
      concluido: { color: 'bg-blue-100 text-blue-800', text: 'Concluído', icon: <Check className="w-3 h-3 mr-1" /> }
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
            Informe detalhes como marca, modelo, medida e a justificativa para a solicitação.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <CircleDot className="w-4 h-4 mr-2" />
              Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Nova Solicitação de Pneus</DialogTitle>
              <DialogDescription>
                Preencha os detalhes dos pneus que você precisa solicitar.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    name="marca"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a marca" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Pirelli">Pirelli</SelectItem>
                            <SelectItem value="Michelin">Michelin</SelectItem>
                            <SelectItem value="Goodyear">Goodyear</SelectItem>
                            <SelectItem value="Bridgestone">Bridgestone</SelectItem>
                            <SelectItem value="Continental">Continental</SelectItem>
                            <SelectItem value="Firestone">Firestone</SelectItem>
                            <SelectItem value="Dunlop">Dunlop</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="modelo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modelo</FormLabel>
                        <FormControl>
                          <Input placeholder="Modelo do pneu" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="medida"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medida</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 275/80R22.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="direcional">Direcional</SelectItem>
                            <SelectItem value="tracao">Tração</SelectItem>
                            <SelectItem value="misto">Misto</SelectItem>
                            <SelectItem value="liso">Liso</SelectItem>
                            <SelectItem value="borrachudo">Borrachudo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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

                <DialogFooter>
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
          ) : !tireRequests || tireRequests.length === 0 ? (
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
                    <TableHead>Marca/Modelo</TableHead>
                    <TableHead>Medida</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aprovação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tireRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.id}</TableCell>
                      <TableCell>
                        {new Date(request.data_solicitacao).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{request.marca}</div>
                        <div className="text-sm text-gray-500">{request.modelo}</div>
                      </TableCell>
                      <TableCell>{request.medida}</TableCell>
                      <TableCell className="capitalize">{request.tipo}</TableCell>
                      <TableCell className="text-center">{request.quantidade}</TableCell>
                      <TableCell>{request.usuario_nome}</TableCell>
                      <TableCell>{formatStatus(request.status)}</TableCell>
                      <TableCell>
                        {request.data_aprovacao ? (
                          <div>
                            <div className="text-xs text-gray-500">
                              {new Date(request.data_aprovacao).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="text-xs font-medium">
                              {request.aprovador_nome}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Pendente</span>
                        )}
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
            Total: {tireRequests?.length || 0} solicitações
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SolicitacaoPneusCampinas;