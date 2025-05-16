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
import { insertData, checkConnection } from '@/lib/supabaseClient';

// Schema de validação para o formulário de recebimento de combustível
const recebimentoSchema = z.object({
  tipo: z.enum(['Diesel', 'ARLA'], {
    required_error: 'Selecione o tipo de produto',
  }),
  quantidade: z.string().min(1, 'A quantidade é obrigatória').refine((val) => !isNaN(Number(val)), {
    message: 'Quantidade deve ser um número válido',
  }),
  operador: z.string().min(3, 'O nome do operador deve ter no mínimo 3 caracteres'),
});

type RecebimentoValues = z.infer<typeof recebimentoSchema>;

interface FormularioRecebimentoProps {
  postId: string;
}

export const FormularioRecebimento: React.FC<FormularioRecebimentoProps> = ({ postId }) => {
  const { toast } = useToast();
  
  const form = useForm<RecebimentoValues>({
    resolver: zodResolver(recebimentoSchema),
    defaultValues: {
      tipo: undefined,
      quantidade: '',
      operador: '',
    },
  });

  async function onSubmit(data: RecebimentoValues) {
    try {
      // Prepara os dados no formato esperado pela API
      const recebimentoData = {
        tipo_produto: data.tipo,
        litros_recebidos: Number(data.quantidade),
        nome_operador: data.operador,
        posto: postId
      };
      
      console.log('Dados a enviar:', recebimentoData);
      
      // Verifica conexão com Supabase antes de tentar enviar
      toast({
        title: 'Verificando conexão',
        description: 'Aguarde enquanto verificamos a conexão com o servidor...',
      });
      
      const conexaoSupabase = await checkConnection();
      if (!conexaoSupabase) {
        throw new Error('Não foi possível conectar ao servidor Supabase. Verifique sua conexão e tente novamente mais tarde.');
      }
      
      // Tenta criar a tabela, se necessário, usando localStorage como fallback
      try {
        // Envia os dados para o Supabase usando o cliente de serviço (contorna RLS)
        const response = await insertData('recebimentos_combustivel', recebimentoData);
        console.log('Resposta do servidor:', response);
      } catch (error: any) {
        console.error('Erro ao inserir no Supabase:', error);
        
        // Se a tabela não existir, salvamos localmente e mostramos uma mensagem
        if (error.code === '42P01' || (error.message && error.message.includes("relation") && error.message.includes("does not exist"))) {
          // Salvar no localStorage como fallback
          const localKey = `recebimentos_combustivel_${postId}`;
          const storedData = localStorage.getItem(localKey);
          const recebimentos = storedData ? JSON.parse(storedData) : [];
          
          // Adicionar o novo recebimento com um ID gerado e timestamp
          recebimentos.push({
            ...recebimentoData,
            id: Date.now(),
            created_at: new Date().toISOString()
          });
          
          // Salvar de volta no localStorage
          localStorage.setItem(localKey, JSON.stringify(recebimentos));
          
          console.log('Dados salvos localmente como fallback:', recebimentos);
          throw new Error('A tabela de recebimentos não existe no servidor. Os dados foram salvos localmente como fallback.');
        } else {
          throw error; // Propagar outros erros
        }
      }
      
      toast({
        title: 'Recebimento registrado!',
        description: `${data.quantidade} litros de ${data.tipo} recebidos com sucesso.`,
      });
      
      form.reset();
    } catch (error) {
      console.error('Erro ao registrar recebimento:', error);
      toast({
        title: 'Erro ao registrar recebimento',
        description: error instanceof Error ? error.message : 'Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      });
    }
  }

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
                  name="tipo"
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
                  name="quantidade"
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
                  name="operador"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
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