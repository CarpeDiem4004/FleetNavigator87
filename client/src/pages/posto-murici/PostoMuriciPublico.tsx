import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Droplet, 
  Truck, 
  AlertCircle, 
  Fuel,
  Home,
  TrendingUp,
  LogOut,
  Clock,
  RotateCcw,
  Ban,
  PlaneTakeoff,
  ArrowRightLeft
} from 'lucide-react';

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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
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

export default function PostoMuriciPublico() {
  const { toast } = useToast();
  const params = useParams();
  const [, setLocation] = useLocation();
  
  const [abastecimentoRealizado, setAbastecimentoRealizado] = useState(false);
  const [movimentacaoRealizada, setMovimentacaoRealizada] = useState(false);
  const [postoId, setPostoId] = useState<number | null>(null);
  const [postoCodigo, setPostoCodigo] = useState<string>('');
  const [postoNome, setPostoNome] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tanques, setTanques] = useState<any[]>([]);

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

  // Obter o código do posto a partir dos parâmetros da URL
  useEffect(() => {
    if (params && params.codigo) {
      const codigo = params.codigo.toUpperCase();
      setPostoCodigo(codigo);
      carregarInformacoesPosto(codigo);
    }
  }, [params]);

  // Carregar informações do posto
  const carregarInformacoesPosto = async (codigo: string) => {
    try {
      setIsLoading(true);
      setErro(null);
      
      // Buscar informações do posto
      const resPostoInfo = await fetch(`/api/posto-murici/public/postos/codigo/${codigo}`);
      if (!resPostoInfo.ok) {
        throw new Error('Posto não encontrado');
      }
      
      const postoInfo = await resPostoInfo.json();
      setPostoId(postoInfo.id);
      setPostoNome(postoInfo.nome);
      
      // Buscar informações dos tanques
      const resTanques = await fetch(`/api/posto-murici/public/tanques/posto/${postoInfo.id}`);
      if (!resTanques.ok) {
        throw new Error('Erro ao carregar informações dos tanques');
      }
      
      const tanquesData = await resTanques.json();
      setTanques(tanquesData);
      
    } catch (error: any) {
      setErro(error.message || 'Erro ao carregar informações do posto');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para registrar abastecimento
  const registrarAbastecimento = async (values: AbastecimentoValues) => {
    if (!postoId) {
      toast({
        title: 'Erro',
        description: 'Posto não identificado',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const response = await fetch('/api/posto-murici/public/abastecimentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          postoId
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao registrar abastecimento');
      }
      
      toast({
        title: 'Abastecimento registrado',
        description: 'O abastecimento foi registrado com sucesso',
      });
      
      // Atualizar níveis de tanque após o abastecimento
      await carregarInformacoesPosto(postoCodigo);
      
      setAbastecimentoRealizado(true);
      formAbastecimento.reset();
      
    } catch (error: any) {
      toast({
        title: 'Erro ao registrar abastecimento',
        description: error.message || 'Ocorreu um erro ao registrar o abastecimento',
        variant: 'destructive',
      });
    }
  };

  // Função para registrar movimentação
  const registrarMovimentacao = async (values: MovimentacaoValues) => {
    if (!postoId) {
      toast({
        title: 'Erro',
        description: 'Posto não identificado',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const response = await fetch('/api/posto-murici/public/movimentacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          postoId
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao registrar movimentação');
      }
      
      toast({
        title: 'Movimentação registrada',
        description: 'A movimentação de pátio foi registrada com sucesso',
      });
      
      setMovimentacaoRealizada(true);
      formMovimentacao.reset();
      
    } catch (error: any) {
      toast({
        title: 'Erro ao registrar movimentação',
        description: error.message || 'Ocorreu um erro ao registrar a movimentação de pátio',
        variant: 'destructive',
      });
    }
  };

  // Verificar se há tanque com nível baixo
  const tanqueBaixo = tanques?.find((tanque: any) => {
    const percentual = (parseFloat(tanque.nivelAtual) / parseFloat(tanque.capacidadeTotal)) * 100;
    return percentual < 20;
  });

  // Calcular percentual do tanque selecionado no formulário de abastecimento
  const getTanqueInfo = (tipo: 'diesel' | 'arla') => {
    if (!tanques || tanques.length === 0) return null;
    
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
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center min-h-[70vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
          <h2 className="text-lg font-medium">Carregando informações do posto...</h2>
        </div>
      </div>
    );
  }

  // Verificar se ocorreu algum erro
  if (erro) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive" className="max-w-lg mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            {erro}
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
          <h1 className="text-3xl font-bold">{postoNome}</h1>
          <div className="flex items-center">
            <Badge className="text-sm">Acesso Público</Badge>
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
                      <form onSubmit={formAbastecimento.handleSubmit(registrarAbastecimento)} className="space-y-4">
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
                            disabled={formAbastecimento.formState.isSubmitting}
                          >
                            {formAbastecimento.formState.isSubmitting ? (
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
                    {tanques.length === 0 ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Informação</AlertTitle>
                        <AlertDescription>
                          Nenhum tanque configurado.
                        </AlertDescription>
                      </Alert>
                    ) : (
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
                    )}
                  </CardContent>
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
                  <form onSubmit={formMovimentacao.handleSubmit(registrarMovimentacao)} className="space-y-4">
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
                        disabled={formMovimentacao.formState.isSubmitting}
                      >
                        {formMovimentacao.formState.isSubmitting ? (
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

        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            Sistema de Gestão de Frotas Muricion Fleet - Acesso Externo - v2.0
          </p>
        </div>
      </div>
    </div>
  );
}