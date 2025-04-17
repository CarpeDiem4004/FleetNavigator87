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
import { Truck } from 'lucide-react';
import { TabsContent } from '@/components/ui/tabs';
import { enviarParaSupabase, ENDPOINTS } from '@/constants/supabase';

// Schema de validação para o formulário de controle de pátio
const controlePatiocientema = z.object({
  placa: z.string().min(7, 'A placa deve ter no mínimo 7 caracteres').max(8, 'A placa deve ter no máximo 8 caracteres'),
  tipoMovimento: z.enum(['Entrada para pernoite', 'Saída para rota', 'Saída para manutenção'], {
    required_error: 'Selecione o tipo de movimento',
  }),
  motorista: z.string().min(3, 'O nome do motorista deve ter no mínimo 3 caracteres'),
  operador: z.string().min(3, 'O nome do operador deve ter no mínimo 3 caracteres'),
});

type ControlePatiocientes = z.infer<typeof controlePatiocientema>;

interface FormularioControlePatioProp {
  postId: string;
}

export const FormularioControlePatio: React.FC<FormularioControlePatioProp> = ({ postId }) => {
  const { toast } = useToast();
  
  const form = useForm<ControlePatiocientes>({
    resolver: zodResolver(controlePatiocientema),
    defaultValues: {
      placa: '',
      tipoMovimento: undefined,
      motorista: '',
      operador: '',
    },
  });

  async function onSubmit(data: ControlePatiocientes) {
    try {
      // Prepara os dados no formato esperado pela API
      const movimentoData = {
        placa: data.placa.toUpperCase(),
        tipo_movimento: data.tipoMovimento,
        nome_motorista: data.motorista,
        nome_operador: data.operador,
        posto: postId
      };
      
      console.log('Dados a enviar:', movimentoData);
      
      // Envia os dados para o Supabase
      const response = await enviarParaSupabase(ENDPOINTS.MOVIMENTACOES, movimentoData);
      console.log('Resposta do servidor:', response);
      
      toast({
        title: 'Movimento registrado!',
        description: `Veículo ${data.placa}: ${data.tipoMovimento} registrado com sucesso.`,
      });
      
      form.reset();
    } catch (error) {
      console.error('Erro ao registrar movimento:', error);
      toast({
        title: 'Erro ao registrar movimento',
        description: 'Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      });
    }
  }

  return (
    <TabsContent value="patio" className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Controle de Pátio
          </CardTitle>
          <CardDescription>
            Registre a entrada e saída de veículos no pátio do posto {postId}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="placa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placa do Veículo</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC1234" {...field} className="uppercase" />
                      </FormControl>
                      <FormDescription>
                        Digite a placa do veículo no formato correto
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tipoMovimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Movimento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de movimento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Entrada para pernoite">Entrada para pernoite</SelectItem>
                          <SelectItem value="Saída para rota">Saída para rota</SelectItem>
                          <SelectItem value="Saída para manutenção">Saída para manutenção</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Selecione o tipo de movimento do veículo
                      </FormDescription>
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
                        <Input placeholder="João Silva" {...field} />
                      </FormControl>
                      <FormDescription>
                        Digite o nome completo do motorista
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="operador"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Operador</FormLabel>
                      <FormControl>
                        <Input placeholder="Carlos Oliveira" {...field} />
                      </FormControl>
                      <FormDescription>
                        Digite o nome do operador responsável
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" size="lg" className="w-full md:w-auto">
                  Registrar Movimento de Veículo
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

export default FormularioControlePatio;