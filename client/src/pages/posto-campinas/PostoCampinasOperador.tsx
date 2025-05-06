import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Droplet, Truck, AlertCircle } from 'lucide-react';
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
  observacoes: z.string().optional(),
});

type AbastecimentoValues = z.infer<typeof abastecimentoSchema>;

export default function PostoCampinasOperador() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [abastecimentoRealizado, setAbastecimentoRealizado] = useState(false);

  // Formulário de abastecimento
  const form = useForm<AbastecimentoValues>({
    resolver: zodResolver(abastecimentoSchema),
    defaultValues: {
      placa: '',
      km: '',
      tipoVeiculo: 'frota',
      tipoCombustivel: 'diesel',
      quantidadeLitros: '',
      motorista: '',
      observacoes: '',
    },
  });

  // Buscar informações dos tanques
  const { data: tanques, isLoading: isLoadingTanques, error: tanquesError } = useQuery({
    queryKey: ['/api/posto-campinas/tanques'],
    queryFn: () => apiRequest('GET', '/api/posto-campinas/tanques').then(res => res.json()),
  });

  // Mutação para registrar abastecimento
  const registrarAbastecimento = useMutation({
    mutationFn: async (values: AbastecimentoValues) => {
      const res = await apiRequest('POST', '/api/posto-campinas/abastecimentos', values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Abastecimento registrado',
        description: 'O abastecimento foi registrado com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/posto-campinas/tanques'] });
      setAbastecimentoRealizado(true);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao registrar abastecimento',
        description: error.message || 'Ocorreu um erro ao registrar o abastecimento',
        variant: 'destructive',
      });
    },
  });

  // Função para submeter o formulário
  const onSubmit = (values: AbastecimentoValues) => {
    registrarAbastecimento.mutate(values);
  };

  // Verificar se há tanque com nível baixo
  const tanqueBaixo = tanques?.find((tanque: any) => {
    const percentual = (parseFloat(tanque.nivelAtual) / parseFloat(tanque.capacidadeTotal)) * 100;
    return percentual < 20;
  });

  // Calcular percentual do tanque selecionado
  const getTanqueInfo = (tipo: 'diesel' | 'arla') => {
    if (!tanques) return null;
    
    const tanque = tanques.find((t: any) => t.tipo === tipo);
    if (!tanque) return null;
    
    const percentual = (parseFloat(tanque.nivelAtual) / parseFloat(tanque.capacidadeTotal)) * 100;
    const valorLitro = form.watch('tipoVeiculo') === 'frota' 
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
  const tipoCombustivel = form.watch('tipoCombustivel');
  const tanqueInfo = tipoCombustivel ? getTanqueInfo(tipoCombustivel as 'diesel' | 'arla') : null;

  // Calcular valor total do abastecimento
  const quantidadeLitros = form.watch('quantidadeLitros');
  const tipoVeiculo = form.watch('tipoVeiculo');
  const valorTotal = tanqueInfo && quantidadeLitros 
    ? (parseFloat(quantidadeLitros) * parseFloat(tanqueInfo.valorLitro)).toFixed(2)
    : '0.00';

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Posto Campinas - Registrar Abastecimento</h1>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              Operador: {user?.name || 'Não autenticado'}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </Badge>
          </div>
        </div>

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

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
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
                        control={form.control}
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
                        control={form.control}
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
                        control={form.control}
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
                        control={form.control}
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
                        control={form.control}
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

                    <FormField
                      control={form.control}
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
                              {tanque.tipo === 'diesel' ? 'Diesel' : 'Arla 32'}
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
                            <Alert variant="warning" className="mt-2 py-2">
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
      </div>
    </div>
  );
}