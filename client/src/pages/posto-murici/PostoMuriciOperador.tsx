import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useLocation, useParams } from 'wouter';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Loader2,
  Droplet,
  Truck,
  AlertCircle,
  Fuel,
  CarFront,
  Home,
  TrendingUp,
  LogOut,
  Clock,
  RotateCcw,
  Ban,
  PlaneTakeoff,
  ArrowRightLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Schema para validação do formulário de abastecimento
const abastecimentoSchema = z.object({
  placa: z.string().min(7, 'Placa inválida').max(10, 'Placa muito longa'),
  km: z.string().min(1, 'Quilometragem obrigatória').transform(val => parseInt(val, 10)),
  tipoVeiculo: z.enum(['frota', 'agregado'], {
    required_error: 'Selecione o tipo de veículo',
  }),
  tipoCombustivel: z.enum(['diesel', 'arla'], {
    required_error: 'Selecione o tipo de combustível',
  }),
  quantidadeLitros: z.string()
    .min(1, 'Quantidade obrigatória')
    .transform(val => parseFloat(val))
    .refine(val => val > 0, 'Valor deve ser maior que zero')
    .refine(val => val < 1000, 'Valor muito alto'),
  motorista: z.string().min(3, 'Nome do motorista obrigatório'),
  rgMotorista: z.string().min(5, 'RG do motorista obrigatório'),
  observacoes: z.string().optional(),
});

// Schema para validação do formulário de movimentação de pátio
const movimentacaoSchema = z.object({
  placa: z.string().min(7, 'Placa inválida').max(10, 'Placa muito longa'),
  motorista: z.string().min(3, 'Nome do motorista obrigatório'),
  rgMotorista: z.string().min(5, 'RG do motorista obrigatório'),
  tipoOperacao: z.enum([
    'entrada_pernoite', 
    'saida_rota', 
    'saida_manutencao', 
    'descontinuacao', 
    'remanejamento_base',
    'entrada_carregamento',
    'saida_carregamento'
  ], {
    required_error: 'Selecione o tipo de operação',
  }),
  baseDestino: z.string().optional(),
  observacoes: z.string().optional(),
});

type AbastecimentoValues = z.infer<typeof abastecimentoSchema>;
type MovimentacaoValues = z.infer<typeof movimentacaoSchema>;

export default function PostoMuriciOperador() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const params = useParams();
  const [, setLocation] = useLocation();
  
  const [abastecimentoRealizado, setAbastecimentoRealizado] = useState(false);
  const [movimentacaoRealizada, setMovimentacaoRealizada] = useState(false);
  const [postoId, setPostoId] = useState<number | null>(null);
  const [postoCodigo, setPostoCodigo] = useState<string>('');
  const [postoNome, setPostoNome] = useState<string>('');

  // Obter o código do posto a partir dos parâmetros da URL
  useEffect(() => {
    if (params && params.codigo) {
      setPostoCodigo(params.codigo.toUpperCase());
    }
  }, [params]);

  // Buscar informações do posto pelo código
  const { data: postoInfo, isLoading: isLoadingPosto } = useQuery({
    queryKey: ['/api/posto-murici/postos/codigo', postoCodigo],
    queryFn: async () => {
      if (!postoCodigo) return null;
      const res = await apiRequest('GET', `/api/posto-murici/postos/codigo/${postoCodigo}`);
      return res.json();
    },
    enabled: !!postoCodigo,
    onSuccess: (data) => {
      if (data) {
        setPostoId(data.id);
        setPostoNome(data.nome);
      }
    }
  });

  // Formulário de abastecimento
  const formAbastecimento = useForm<AbastecimentoValues>({
    resolver: zodResolver(abastecimentoSchema),
    defaultValues: {
      placa: '',
      km: '',
      tipoVeiculo: 'frota',
      tipoCombustivel: 'diesel',
      quantidadeLitros: '',
      motorista: '',
      rgMotorista: '',
      observacoes: '',
    },
  });

  // Formulário de movimentação de pátio
  const formMovimentacao = useForm<MovimentacaoValues>({
    resolver: zodResolver(movimentacaoSchema),
    defaultValues: {
      placa: '',
      motorista: '',
      rgMotorista: '',
      tipoOperacao: 'entrada_pernoite',
      baseDestino: '',
      observacoes: '',
    },
  });

  // Buscar informações dos tanques do posto selecionado
  const { data: tanques, isLoading: isLoadingTanques, error: tanquesError } = useQuery({
    queryKey: ['/api/posto-murici/tanques', postoId],
    queryFn: async () => {
      if (!postoId) return null;
      const res = await apiRequest('GET', `/api/posto-murici/tanques/posto/${postoId}`);
      return res.json();
    },
    enabled: !!postoId,
  });

  // Mutação para registrar abastecimento
  const registrarAbastecimento = useMutation({
    mutationFn: async (values: AbastecimentoValues & { postoId: number }) => {
      const res = await apiRequest('POST', '/api/posto-murici/abastecimentos', values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Abastecimento registrado',
        description: 'O abastecimento foi registrado com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/posto-murici/tanques'] });
      setAbastecimentoRealizado(true);
      formAbastecimento.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao registrar abastecimento',
        description: error.message || 'Ocorreu um erro ao registrar o abastecimento',
        variant: 'destructive',
      });
    },
  });

  // Mutação para registrar movimentação de pátio
  const registrarMovimentacao = useMutation({
    mutationFn: async (values: MovimentacaoValues & { postoId: number }) => {
      const res = await apiRequest('POST', '/api/posto-murici/movimentacoes', values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Movimentação registrada',
        description: 'A movimentação de pátio foi registrada com sucesso',
      });
      setMovimentacaoRealizada(true);
      formMovimentacao.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao registrar movimentação',
        description: error.message || 'Ocorreu um erro ao registrar a movimentação de pátio',
        variant: 'destructive',
      });
    },
  });

  // Função para submeter o formulário de abastecimento
  const onSubmitAbastecimento = (values: AbastecimentoValues) => {
    if (!postoId) {
      toast({
        title: 'Erro',
        description: 'Posto não identificado',
        variant: 'destructive',
      });
      return;
    }
    
    registrarAbastecimento.mutate({
      ...values,
      postoId
    });
  };

  // Função para submeter o formulário de movimentação
  const onSubmitMovimentacao = (values: MovimentacaoValues) => {
    if (!postoId) {
      toast({
        title: 'Erro',
        description: 'Posto não identificado',
        variant: 'destructive',
      });
      return;
    }
    
    registrarMovimentacao.mutate({
      ...values,
      postoId
    });
  };

  // Verificar se há tanque com nível baixo
  const tanqueBaixo = tanques?.find((tanque: any) => {
    const percentual = (parseFloat(tanque.nivelAtual) / parseFloat(tanque.capacidadeTotal)) * 100;
    return percentual < 20;
  });

  // Calcular percentual do tanque selecionado no formulário de abastecimento
  const getTanqueInfo = (tipo: 'diesel' | 'arla') => {
    if (!tanques) return null;
    
    const tanque = tanques.find((t: any) => t.tipo === tipo);
    if (!tanque) return null;
    
    const percentual = (parseFloat(tanque.nivelAtual) / parseFloat(tanque.capacidadeTotal)) * 100;
    const valorLitro = formAbastecimento.watch('tipoVeiculo') === 'frota' 
      ? tanque.valorLitroFrota 
      : tanque.valorLitroAgregado;
    
    return {
      tanque,
      percentual,
      valorLitro,
      statusColor: 
        percentual < 10 ? 'bg-red-500' : 
        percentual < 20 ? 'bg-orange-400' : 
        percentual < 50 ? 'bg-yellow-400' : 
        'bg-green-500',
    };
  };

  // Obter informações do tanque selecionado
  const tipoCombustivel = formAbastecimento.watch('tipoCombustivel');
  const tanqueInfo = tipoCombustivel ? getTanqueInfo(tipoCombustivel as 'diesel' | 'arla') : null;

  // Calcular valor total do abastecimento
  const quantidadeLitros = formAbastecimento.watch('quantidadeLitros');
  const tipoVeiculo = formAbastecimento.watch('tipoVeiculo');
  const valorTotal = tanqueInfo && quantidadeLitros 
    ? (parseFloat(quantidadeLitros) * parseFloat(tanqueInfo.valorLitro)).toFixed(2)
    : '0.00';

  // Verificar o estado de carregamento
  if (isLoadingPosto) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center min-h-[70vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
          <h2 className="text-lg font-medium">Carregando informações do posto...</h2>
        </div>
      </div>
    );
  }

  // Verificar se o posto foi encontrado
  if (!isLoadingPosto && !postoInfo) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive" className="max-w-lg mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Posto não encontrado</AlertTitle>
          <AlertDescription>
            O posto com o código "{postoCodigo}" não foi encontrado. Verifique o código e tente novamente.
          </AlertDescription>
        </Alert>
        <div className="text-center mt-6">
          <Button variant="outline" onClick={() => setLocation('/')}>
            Voltar para o início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{postoNome} - Operador</h1>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              Operador: {user?.name || 'Não autenticado'}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="abastecimento" className="space-y-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="abastecimento" className="flex items-center space-x-2">
              <Fuel className="h-4 w-4" />
              <span>Abastecimento</span>
            </TabsTrigger>
            <TabsTrigger value="movimentacao" className="flex items-center space-x-2">
              <Truck className="h-4 w-4" />
              <span>Movimentação de Pátio</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab de Abastecimento */}
          <TabsContent value="abastecimento" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Registrar Abastecimento</CardTitle>
                    <CardDescription>
                      Preencha os dados para registrar um novo abastecimento
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {abastecimentoRealizado && (
                      <Alert className="mb-6 bg-green-50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Sucesso!</AlertTitle>
                        <AlertDescription>
                          Abastecimento registrado com sucesso.
                        </AlertDescription>
                      </Alert>
                    )}

                    <Form {...formAbastecimento}>
                      <form onSubmit={formAbastecimento.handleSubmit(onSubmitAbastecimento)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={formAbastecimento.control}
                            name="placa"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Placa do Veículo</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="ABC1234" 
                                    {...field} 
                                    className="uppercase"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={formAbastecimento.control}
                            name="km"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quilometragem Atual</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="0" 
                                    type="number" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={formAbastecimento.control}
                            name="tipoVeiculo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo de Veículo</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o tipo de veículo" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="frota">
                                      <div className="flex items-center">
                                        <Truck className="h-4 w-4 mr-2" />
                                        <span>Frota Murici</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="agregado">
                                      <div className="flex items-center">
                                        <Truck className="h-4 w-4 mr-2" />
                                        <span>Agregado</span>
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={formAbastecimento.control}
                            name="tipoCombustivel"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo de Combustível</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o combustível" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="diesel">
                                      <div className="flex items-center">
                                        <Droplet className="h-4 w-4 mr-2" />
                                        <span>Diesel</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="arla">
                                      <div className="flex items-center">
                                        <Droplet className="h-4 w-4 mr-2" />
                                        <span>Arla 32</span>
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={formAbastecimento.control}
                            name="quantidadeLitros"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quantidade de Litros</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="0" 
                                    type="number" 
                                    step="0.01"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={formAbastecimento.control}
                            name="motorista"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome do Motorista</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Nome do motorista" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                          <FormField
                            control={formAbastecimento.control}
                            name="rgMotorista"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>RG do Motorista</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="RG do motorista" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={formAbastecimento.control}
                          name="observacoes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Observações (opcional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Observações adicionais sobre o abastecimento" 
                                  className="min-h-[80px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {tanqueInfo && (
                          <div className="mt-4 p-4 border rounded-md bg-slate-50">
                            <div className="flex justify-between mb-2">
                              <span className="font-medium">Valor do litro ({tipoVeiculo === 'frota' ? 'Frota' : 'Agregado'}):</span>
                              <span>R$ {parseFloat(tanqueInfo.valorLitro).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-semibold text-lg">
                              <span>Valor total:</span>
                              <span>R$ {valorTotal}</span>
                            </div>
                          </div>
                        )}

                        <div className="pt-2">
                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={registrarAbastecimento.isPending || isLoadingTanques}
                          >
                            {registrarAbastecimento.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Registrando...
                              </>
                            ) : (
                              'Registrar Abastecimento'
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-col gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Níveis de Tanques</CardTitle>
                    <CardDescription>
                      Status atual dos tanques de combustível
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingTanques ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : tanquesError ? (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erro</AlertTitle>
                        <AlertDescription>
                          Não foi possível carregar as informações dos tanques.
                        </AlertDescription>
                      </Alert>
                    ) : tanques && tanques.length > 0 ? (
                      <div className="space-y-4">
                        {tanques.map((tanque: any) => {
                          const percentual = (parseFloat(tanque.nivelAtual) / parseFloat(tanque.capacidadeTotal)) * 100;
                          
                          return (
                            <div key={tanque.id} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-medium capitalize">
                                  {tanque.tipo === 'diesel' ? 'Diesel' : tanque.tipo === 'arla' ? 'Arla 32' : tanque.tipo}
                                </span>
                                <Badge 
                                  variant={percentual < 20 ? "destructive" : "secondary"}
                                >
                                  {percentual.toFixed(1)}%
                                </Badge>
                              </div>
                              <Progress 
                                value={percentual} 
                                className={
                                  percentual < 10 ? 'bg-red-200' : 
                                  percentual < 20 ? 'bg-orange-200' : 
                                  percentual < 50 ? 'bg-yellow-200' : 
                                  'bg-green-200'
                                }
                              />
                              <div className="flex justify-between text-sm text-muted-foreground">
                                <span>
                                  {parseFloat(tanque.nivelAtual).toFixed(2)} L
                                </span>
                                <span>
                                  {parseFloat(tanque.capacidadeTotal).toFixed(0)} L
                                </span>
                              </div>
                              
                              <div className="text-sm pt-1">
                                <div className="flex justify-between">
                                  <span>Frota:</span>
                                  <span className="font-medium">
                                    R$ {parseFloat(tanque.valorLitroFrota).toFixed(2)}/L
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Agregado:</span>
                                  <span className="font-medium">
                                    R$ {parseFloat(tanque.valorLitroAgregado).toFixed(2)}/L
                                  </span>
                                </div>
                              </div>
                              
                              {percentual < 20 && (
                                <Alert className="mt-2 py-2 border-orange-500 bg-orange-50">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertTitle className="text-sm">Nível Baixo</AlertTitle>
                                </Alert>
                              )}
                              
                              <Separator className="my-2" />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Informação</AlertTitle>
                        <AlertDescription>
                          Nenhum tanque configurado.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground">
                    Última atualização: {tanques && tanques[0]?.ultimaAtualizacao 
                      ? format(new Date(tanques[0].ultimaAtualizacao), 'dd/MM/yyyy HH:mm:ss') 
                      : 'N/A'}
                  </CardFooter>
                </Card>

                {tanqueBaixo && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Alerta de Nível Baixo</AlertTitle>
                    <AlertDescription>
                      O tanque de {tanqueBaixo.tipo === 'diesel' ? 'Diesel' : 'Arla 32'} está com nível crítico!
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tab de Movimentação de Pátio */}
          <TabsContent value="movimentacao">
            <Card>
              <CardHeader>
                <CardTitle>Registro de Movimentação de Pátio</CardTitle>
                <CardDescription>
                  Registre entradas, saídas e outras movimentações de veículos no pátio
                </CardDescription>
              </CardHeader>
              <CardContent>
                {movimentacaoRealizada && (
                  <Alert className="mb-6 bg-green-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Sucesso!</AlertTitle>
                    <AlertDescription>
                      Movimentação de pátio registrada com sucesso.
                    </AlertDescription>
                  </Alert>
                )}

                <Form {...formMovimentacao}>
                  <form onSubmit={formMovimentacao.handleSubmit(onSubmitMovimentacao)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={formMovimentacao.control}
                        name="placa"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Placa do Veículo</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="ABC1234" 
                                {...field} 
                                className="uppercase"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={formMovimentacao.control}
                        name="tipoOperacao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Operação</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo de operação" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="entrada_pernoite">
                                  <div className="flex items-center">
                                    <Home className="h-4 w-4 mr-2" />
                                    <span>Entrada para Pernoite</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="saida_rota">
                                  <div className="flex items-center">
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    <span>Saída para Rota</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="saida_manutencao">
                                  <div className="flex items-center">
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    <span>Saída para Manutenção</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="descontinuacao">
                                  <div className="flex items-center">
                                    <Ban className="h-4 w-4 mr-2" />
                                    <span>Descontinuação do Veículo</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="remanejamento_base">
                                  <div className="flex items-center">
                                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                                    <span>Remanejamento para Outra Base</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="entrada_carregamento">
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-2" />
                                    <span>Entrada para Carregamento</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="saida_carregamento">
                                  <div className="flex items-center">
                                    <PlaneTakeoff className="h-4 w-4 mr-2" />
                                    <span>Saída Após Carregamento</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={formMovimentacao.control}
                        name="motorista"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Motorista</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Nome do motorista" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={formMovimentacao.control}
                        name="rgMotorista"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>RG do Motorista</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="RG do motorista" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {formMovimentacao.watch('tipoOperacao') === 'remanejamento_base' && (
                      <FormField
                        control={formMovimentacao.control}
                        name="baseDestino"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Base de Destino</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Informe a base de destino" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={formMovimentacao.control}
                      name="observacoes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações (opcional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Observações adicionais sobre a movimentação" 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={registrarMovimentacao.isPending}
                      >
                        {registrarMovimentacao.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Registrando...
                          </>
                        ) : (
                          'Registrar Movimentação'
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}