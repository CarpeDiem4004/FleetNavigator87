import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Componentes UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Ícones
import { Truck, AlertCircle, Loader2 } from 'lucide-react';

// Esquema de validação para o formulário
const serviceSchema = z.object({
  vehicle_plate: z.string().min(1, 'A placa do veículo é obrigatória'),
  pickup_location: z.string().min(1, 'O local de coleta é obrigatório'),
  destination: z.string().min(1, 'O destino é obrigatório'),
  service_description: z.string().min(1, 'A descrição do serviço é obrigatória'),
  service_type: z.string().min(1, 'O tipo de serviço é obrigatório'),
  driver_name: z.string().min(1, 'O nome do motorista é obrigatório'),
  service_date: z.string().min(1, 'A data do serviço é obrigatória'),
  actual_cost: z.string().min(1, 'O custo real é obrigatório'),
  km_traveled: z.string().optional(),
  observation: z.string().optional(),
});

type FormValues = z.infer<typeof serviceSchema>;

// Interface para o parceiro de guincho
interface TowingPartner {
  id: number;
  name: string;
  company_name?: string;
}

// Página de acesso externo para parceiros de guincho
const ExternalAccessPage: React.FC = () => {
  const { token } = useParams();
  const { toast } = useToast();
  const [partner, setPartner] = useState<TowingPartner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  // Formulário para envio de serviços realizados
  const form = useForm<FormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      vehicle_plate: '',
      pickup_location: '',
      destination: '',
      service_description: '',
      service_type: '',
      driver_name: '',
      service_date: new Date().toISOString().split('T')[0], // Data atual como padrão
      actual_cost: '',
      km_traveled: '',
      observation: '',
    },
  });

  // Verificar a validade do token e buscar os dados do parceiro
  useEffect(() => {
    const validateToken = async () => {
      try {
        // Obter dados do parceiro pelo token de acesso
        const response = await fetch(`/api/towing/external-access/validate/${token}`);
        
        if (!response.ok) {
          setTokenValid(false);
          setIsLoading(false);
          return;
        }
        
        const data = await response.json();
        
        if (data.valid && data.partner) {
          setPartner(data.partner);
          setTokenValid(true);
        } else {
          setTokenValid(false);
        }
      } catch (error) {
        console.error('Erro ao validar token:', error);
        setTokenValid(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    validateToken();
  }, [token]);
  
  // Função para enviar os dados do serviço
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Formatar os dados para envio
      const serviceData = {
        ...data,
        partner_id: partner?.id,
        token: token,
        actual_cost: parseFloat(data.actual_cost),
        km_traveled: data.km_traveled ? parseFloat(data.km_traveled) : undefined,
        status: 'pendente'
      };
      
      // Enviar os dados para a API
      const response = await fetch('/api/towing/external-access/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      });
      
      if (!response.ok) {
        throw new Error('Falha ao enviar os dados do serviço');
      }
      
      // Resetar o formulário
      form.reset();
      
      // Mostrar mensagem de sucesso
      toast({
        title: 'Serviço registrado com sucesso',
        description: 'O serviço foi registrado e aguarda aprovação do gestor de frota.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao enviar os dados do serviço:', error);
      
      // Mostrar mensagem de erro
      toast({
        title: 'Erro ao registrar serviço',
        description: 'Ocorreu um erro ao registrar o serviço. Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Exibir loading enquanto verifica o token
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Verificando acesso...</p>
      </div>
    );
  }
  
  // Exibir mensagem se o token for inválido
  if (tokenValid === false) {
    return (
      <div className="container mx-auto py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Acesso Inválido</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <AlertCircle className="h-16 w-16 text-destructive mb-4" />
            <p className="text-center mb-4">
              O link de acesso é inválido ou expirou. Por favor, entre em contato com o gestor de frota para obter um novo link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="h-6 w-6 text-primary" />
            <CardTitle>Portal de Parceiros - Registro de Serviços</CardTitle>
          </div>
          <CardDescription>
            Bem-vindo, {partner?.company_name || partner?.name}. Utilize este formulário para registrar os serviços de guincho realizados.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="vehicle_plate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placa do Veículo*</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="service_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Serviço*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de serviço" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="guincho_leve">Guincho Leve</SelectItem>
                          <SelectItem value="guincho_pesado">Guincho Pesado</SelectItem>
                          <SelectItem value="assistencia_local">Assistência Local</SelectItem>
                          <SelectItem value="troca_pneu">Troca de Pneu</SelectItem>
                          <SelectItem value="resgate">Resgate</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="driver_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Motorista*</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do motorista" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="service_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data do Serviço*</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="pickup_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local de Coleta*</FormLabel>
                      <FormControl>
                        <Input placeholder="Endereço de coleta" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destino*</FormLabel>
                      <FormControl>
                        <Input placeholder="Endereço de destino" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="actual_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor do Serviço (R$)*</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          placeholder="0.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="km_traveled"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quilômetros Percorridos</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          min="0" 
                          placeholder="0" 
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
                name="service_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição do Serviço*</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva detalhes do serviço realizado"
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="observation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observações adicionais sobre o serviço"
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : 'Registrar Serviço'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        
        <CardFooter className="flex flex-col items-center text-center border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Este portal é exclusivo para parceiros autorizados da Murici Logística.
            Os serviços registrados aqui serão avaliados pelo setor de Gestão de Frota.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ExternalAccessPage;