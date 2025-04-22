import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Loader2 } from 'lucide-react';
import { TabsContent } from '@/components/ui/tabs';

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
  onRegistroSucesso?: () => void;
}

export const FormularioControlePatio: React.FC<FormularioControlePatioProp> = ({ postId, onRegistroSucesso }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
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
      setIsSubmitting(true);
      
      // Prepara os dados no formato esperado pela API
      // Capitaliza a primeira letra do posto
      const formatPosto = (posto: string) => {
        return posto.charAt(0).toUpperCase() + posto.slice(1);
      };
      
      const movimentoData = {
        placa: data.placa.toUpperCase(),
        tipo_movimento: data.tipoMovimento,
        nome_motorista: data.motorista,
        nome_operador: data.operador,
        posto: formatPosto(postId) // Primeira letra maiúscula
      };
      
      console.log('Dados a enviar:', movimentoData);
      
      toast({
        title: 'Enviando dados',
        description: 'Aguarde enquanto registramos a movimentação...',
      });
      
      // Nova implementação: usando a API do servidor diretamente
      const response = await fetch('/api/registro/movimentacao-patio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(movimentoData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao registrar movimento');
      }
      
      const result = await response.json();
      console.log('Resposta do servidor:', result);
      
      toast({
        title: 'Movimento registrado!',
        description: `Veículo ${data.placa}: ${data.tipoMovimento} registrado com sucesso.`,
      });
      
      form.reset();
      
      // Notifica o componente pai para atualizar o histórico
      if (onRegistroSucesso) {
        console.log("[PATIO] Notificando componente pai para atualizar histórico de movimentações");
        onRegistroSucesso();
      }
    } catch (error) {
      console.error('Erro ao registrar movimento:', error);
      toast({
        title: 'Erro ao registrar movimento',
        description: error instanceof Error ? error.message : 'Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
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
                      <FormControl>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value || ""}
                          onChange={e => field.onChange(e.target.value)}
                        >
                          <option value="">Selecione o tipo de movimento</option>
                          <option value="Entrada para pernoite">Entrada para pernoite</option>
                          <option value="Saída para rota">Saída para rota</option>
                          <option value="Saída para manutenção">Saída para manutenção</option>
                        </select>
                      </FormControl>
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
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full md:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    "Registrar Movimento de Veículo"
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

export default FormularioControlePatio;