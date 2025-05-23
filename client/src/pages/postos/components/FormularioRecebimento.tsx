import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { TruckIcon } from 'lucide-react';
import { TabsContent } from '@/components/ui/tabs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Schema de validação para o formulário de recebimento de combustível
const recebimentoSchema = z.object({
  tipo_produto: z.enum(['Diesel', 'ARLA'], {
    required_error: 'Selecione o tipo de produto',
  }),
  litros_recebidos: z.string().min(1, 'A quantidade é obrigatória').refine((val) => !isNaN(Number(val)), {
    message: 'Quantidade deve ser um número válido',
  }),
  valor_total: z.string().min(1, 'O valor total é obrigatório').refine((val) => !isNaN(Number(val)), {
    message: 'Valor total deve ser um número válido',
  }),
  nome_fornecedor: z.string().min(3, 'O nome do fornecedor deve ter no mínimo 3 caracteres'),
  nome_operador: z.string().min(3, 'O nome do operador deve ter no mínimo 3 caracteres'),
  observacoes: z.string().optional(),
});

type RecebimentoValues = z.infer<typeof recebimentoSchema>;

interface FormularioRecebimentoProps {
  postId: string;
  onSuccess?: () => void;
}

export const FormularioRecebimento: React.FC<FormularioRecebimentoProps> = ({ postId, onSuccess }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<RecebimentoValues>({
    resolver: zodResolver(recebimentoSchema),
    defaultValues: {
      tipo_produto: undefined,
      litros_recebidos: '',
      valor_total: '',
      nome_fornecedor: '',
      nome_operador: '',
      observacoes: '',
    },
  });

  // Usando TanStack Query para mutação
  const mutation = useMutation({
    mutationFn: async (data: RecebimentoValues) => {
      const formattedData = {
        ...data,
        litros_recebidos: Number(data.litros_recebidos),
        valor_total: Number(data.valor_total),
      };
      
      const response = await apiRequest('POST', `/api/recebimentos/${postId.toLowerCase()}`, formattedData);
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Recebimento registrado com sucesso:', data);
      
      // Invalidar queries relevantes para atualizar dados na UI
      queryClient.invalidateQueries({ queryKey: [`/api/recebimentos/${postId.toLowerCase()}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/configuracao-tanques/${postId}`] });
      
      toast({
        title: 'Recebimento registrado!',
        description: `${form.getValues().litros_recebidos} litros de ${form.getValues().tipo_produto} recebidos com sucesso.`,
      });
      
      form.reset();
      
      // Chamar callback de sucesso, se fornecido
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error('Erro ao registrar recebimento:', error);
      toast({
        title: 'Erro ao registrar recebimento',
        description: error.message || 'Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      });
    }
  });

  const onSubmit = (data: RecebimentoValues) => {
    console.log('Enviando dados:', data);
    mutation.mutate(data);
  };

  return (
    <TabsContent value="recebimento" className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TruckIcon className="h-5 w-5" />
            Recebimento de Combustível no Tanque
          </CardTitle>
          <CardDescription>
            Registre o recebimento de combustível no tanque do posto {postId}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="tipo_produto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Produto Recebido</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o produto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Diesel">Diesel</SelectItem>
                          <SelectItem value="ARLA">ARLA</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Selecione o tipo de produto recebido
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="litros_recebidos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade Recebida (Litros)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="1000" {...field} />
                      </FormControl>
                      <FormDescription>
                        Digite a quantidade em litros
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valor_total"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Total (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="5000.00" step="0.01" {...field} />
                      </FormControl>
                      <FormDescription>
                        Digite o valor total da compra
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nome_fornecedor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Fornecedor</FormLabel>
                      <FormControl>
                        <Input placeholder="Petrobras, Shell, etc" {...field} />
                      </FormControl>
                      <FormDescription>
                        Digite o nome do fornecedor
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="nome_operador"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Operador</FormLabel>
                      <FormControl>
                        <Input placeholder="Carlos Oliveira" {...field} />
                      </FormControl>
                      <FormDescription>
                        Digite o nome do operador responsável pelo recebimento
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Observações (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Observações adicionais sobre o recebimento..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Informações adicionais relevantes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" size="lg" className="w-full md:w-auto">
                  Registrar Recebimento no Tanque
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4 text-sm text-muted-foreground">
          <p>Data e hora serão registradas automaticamente.</p>
        </CardFooter>
      </Card>
    </TabsContent>
  );
};

export default FormularioRecebimento;