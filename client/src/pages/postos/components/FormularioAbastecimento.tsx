import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Fuel, CheckCircle2 } from 'lucide-react';
import { TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { insertData, checkConnection } from '@/lib/supabase-client';

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [registroSucesso, setRegistroSucesso] = useState(false);
  
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(data: AbastecimentoValues) {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Prepara os dados no formato esperado pela API
      // Capitaliza a primeira letra do posto
      const formatPosto = (posto: string) => {
        return posto.charAt(0).toUpperCase() + posto.slice(1);
      };
      
      const abastecimentoData = {
        placa: data.placa.toUpperCase(),
        km_atual: Number(data.km),
        tipo_combustivel: data.tipo,
        litros: Number(data.quantidade),
        projeto: data.projeto,
        nome_motorista: data.motorista,
        nome_operador: data.operador,
        posto: formatPosto(postId), // Primeira letra maiúscula
        data_hora: new Date().toISOString() // Adiciona a data e hora atual
      };
      
      console.log('Dados a enviar:', abastecimentoData);
      
      // Verifica conexão com a internet antes de enviar
      if (!navigator.onLine) {
        throw new Error('Sem conexão com a internet. Verifique sua rede e tente novamente.');
      }
      
      // Verifica conectividade com Supabase antes de tentar enviar
      toast({
        title: 'Verificando conexão',
        description: 'Aguarde enquanto verificamos a conexão com o servidor...',
      });
      
      const conexaoSupabase = await checkConnection();
      if (!conexaoSupabase) {
        throw new Error('Não foi possível conectar ao servidor Supabase. Verifique sua conexão e tente novamente mais tarde.');
      }
      
      // Envia os dados para o Supabase usando o cliente de serviço para contornar RLS
      const response = await insertData('abastecimentos_postos', abastecimentoData);
      console.log('Resposta do servidor:', response);
      
      toast({
        title: 'Abastecimento registrado!',
        description: `Veículo ${data.placa} abastecido com sucesso.`,
      });
      
      // Mostra a tela de registro bem-sucedido com opções para o usuário
      setRegistroSucesso(true);
      
      // Exibimos o toast de sucesso
      setSuccessMessage('Abastecimento registrado com sucesso!');
      
      // Limpa o formulário 
      form.reset();
    } catch (error: any) {
      console.error('Erro ao registrar abastecimento:', error);
      
      // Mensagem de erro mais específica
      let errorMessage = 'Verifique sua conexão e tente novamente.';
      
      // Tentativa de melhorar a mensagem de erro com base no tipo
      if (error.name === 'AbortError') {
        errorMessage = 'O servidor demorou muito para responder. Tente novamente mais tarde.';
      } else if (error.message && error.message.includes('Failed to fetch')) {
        errorMessage = 'Falha na conexão com o servidor. Verifique se você tem acesso à internet.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Erro ao registrar abastecimento',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
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
              {successMessage && (
                <div className="col-span-full mb-4">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 text-sm text-green-800 dark:text-green-400">
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-2 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                      </svg>
                      {successMessage}
                    </div>
                  </div>
                </div>
              )}
              
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
                      <FormControl>
                        <select
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        >
                          <option value="" disabled>Selecione o combustível</option>
                          <option value="Diesel">Diesel</option>
                          <option value="ARLA">ARLA</option>
                        </select>
                      </FormControl>
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
                      <FormControl>
                        <select
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        >
                          <option value="" disabled>Selecione o projeto</option>
                          <option value="GRUPO PEREIRA">GRUPO PEREIRA</option>
                          <option value="COCA COLA">COCA COLA</option>
                          <option value="SHOPEE">SHOPEE</option>
                          <option value="MERCADO LIVRE">MERCADO LIVRE</option>
                          <option value="LINE HALL SHOPEE">LINE HALL SHOPEE</option>
                          <option value="MADEIRA MADEIRA">MADEIRA MADEIRA</option>
                          <option value="MAGALU">MAGALU</option>
                          <option value="NATURA">NATURA</option>
                          <option value="OXXO">OXXO</option>
                          <option value="PETLOVE">PETLOVE</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </FormControl>
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
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full md:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                      Enviando...
                    </>
                  ) : (
                    'Registrar Abastecimento'
                  )}
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