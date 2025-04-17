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
import { Fuel } from 'lucide-react';
import { TabsContent } from '@/components/ui/tabs';
import { enviarParaSupabase, ENDPOINTS } from '@/constants/supabase';

// Schema de validação para o formulário de abastecimento
const abastecimentoSchema = z.object({
  placa: z.string().min(7, 'A placa deve ter no mínimo 7 caracteres').max(8, 'A placa deve ter no máximo 8 caracteres'),
  km: z.string().min(1, 'O KM é obrigatório').refine((val) => !isNaN(Number(val)), {
    message: 'KM deve ser um número válido',
  }),
  tipo: z.enum(['Diesel', 'ARLA'], {
    required_error: 'Selecione o tipo de combustível',
  }),
  quantidade: z.string().min(1, 'A quantidade é obrigatória').refine((val) => !isNaN(Number(val)), {
    message: 'Quantidade deve ser um número válido',
  }),
  projeto: z.string().min(2, 'O projeto é obrigatório'),
  motorista: z.string().min(3, 'O nome do motorista deve ter no mínimo 3 caracteres'),
  operador: z.string().min(3, 'O nome do operador deve ter no mínimo 3 caracteres'),
});

type AbastecimentoValues = z.infer<typeof abastecimentoSchema>;

interface FormularioAbastecimentoProps {
  postId: string;
}

export const FormularioAbastecimento: React.FC<FormularioAbastecimentoProps> = ({ postId }) => {
  const { toast } = useToast();
  
  const form = useForm<AbastecimentoValues>({
    resolver: zodResolver(abastecimentoSchema),
    defaultValues: {
      placa: '',
      km: '',
      tipo: undefined,
      quantidade: '',
      projeto: '',
      motorista: '',
      operador: '',
    },
  });

  async function onSubmit(data: AbastecimentoValues) {
    try {
      // Prepara os dados no formato esperado pela API
      const abastecimentoData = {
        placa: data.placa.toUpperCase(),
        km_atual: Number(data.km),
        tipo_combustivel: data.tipo,
        litros: Number(data.quantidade),
        projeto: data.projeto,
        nome_motorista: data.motorista,
        nome_operador: data.operador,
        posto: postId
      };
      
      console.log('Dados a enviar:', abastecimentoData);
      
      // Envia os dados para o Supabase
      const response = await enviarParaSupabase(ENDPOINTS.ABASTECIMENTOS, abastecimentoData);
      console.log('Resposta do servidor:', response);
      
      toast({
        title: 'Abastecimento registrado!',
        description: `Veículo ${data.placa} abastecido com sucesso.`,
      });
      
      form.reset();
    } catch (error) {
      console.error('Erro ao registrar abastecimento:', error);
      toast({
        title: 'Erro ao registrar abastecimento',
        description: 'Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      });
    }
  }

  return (
    <TabsContent value="abastecimento" className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Registro de Abastecimento
          </CardTitle>
          <CardDescription>
            Preencha todos os campos para registrar um abastecimento no posto {postId}.
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
                  name="km"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>KM Atual</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="123456" {...field} />
                      </FormControl>
                      <FormDescription>
                        Digite o KM atual do veículo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Combustível</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o combustível" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Diesel">Diesel</SelectItem>
                          <SelectItem value="ARLA">ARLA</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Selecione o tipo de combustível abastecido
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
                      <FormLabel>Quantidade (Litros)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="100" {...field} />
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
                  name="projeto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Projeto</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o projeto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="GRUPO PEREIRA">GRUPO PEREIRA</SelectItem>
                          <SelectItem value="COCA COLA">COCA COLA</SelectItem>
                          <SelectItem value="SHOPEE">SHOPEE</SelectItem>
                          <SelectItem value="MERCADO LIVRE">MERCADO LIVRE</SelectItem>
                          <SelectItem value="LINE HALL SHOPEE">LINE HALL SHOPEE</SelectItem>
                          <SelectItem value="MADEIRA MADEIRA">MADEIRA MADEIRA</SelectItem>
                          <SelectItem value="MAGALU">MAGALU</SelectItem>
                          <SelectItem value="NATURA">NATURA</SelectItem>
                          <SelectItem value="OXXO">OXXO</SelectItem>
                          <SelectItem value="PETLOVE">PETLOVE</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Selecione o projeto ao qual o veículo pertence
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
                  Registrar Abastecimento
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

export default FormularioAbastecimento;