import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Componentes UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/layout/PageHeader';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

// Ícones
import { FileText, ArrowLeft, Save, MapPin, Truck, AlertCircle } from 'lucide-react';

// Definição do esquema de validação
const formSchema = z.object({
  vehicle_plate: z.string()
    .min(7, { message: 'A placa do veículo deve ter pelo menos 7 caracteres' })
    .max(10, { message: 'A placa do veículo deve ter no máximo 10 caracteres' }),
  driver_name: z.string()
    .min(3, { message: 'O nome do motorista deve ter pelo menos 3 caracteres' })
    .max(100, { message: 'O nome do motorista deve ter no máximo 100 caracteres' }),
  pickup_location: z.string()
    .min(5, { message: 'O local de coleta deve ter pelo menos 5 caracteres' })
    .max(200, { message: 'O local de coleta deve ter no máximo 200 caracteres' }),
  destination: z.string()
    .min(5, { message: 'O destino deve ter pelo menos 5 caracteres' })
    .max(200, { message: 'O destino deve ter no máximo 200 caracteres' }),
  service_type: z.string({
    required_error: 'O tipo de serviço é obrigatório',
  }),
  urgency: z.enum(['baixa', 'media', 'alta'], {
    required_error: 'A urgência é obrigatória',
  }),
  partner_id: z.string({
    required_error: 'O parceiro de guincho é obrigatório',
  }),
  description: z.string()
    .max(500, { message: 'A descrição deve ter no máximo 500 caracteres' })
    .optional(),
  estimated_cost: z.coerce.number()
    .min(0, { message: 'O custo estimado deve ser maior ou igual a zero' })
    .optional(),
  // Campo reason exigido pelo backend
  reason: z.string()
    .min(5, { message: 'O motivo deve ter pelo menos 5 caracteres' })
    .max(200, { message: 'O motivo deve ter no máximo 200 caracteres' }),
});

type FormValues = z.infer<typeof formSchema>;

// Constantes
const SERVICE_TYPES = [
  { id: 'guincho_leve', name: 'Guincho Leve' },
  { id: 'guincho_pesado', name: 'Guincho Pesado' },
  { id: 'reboque_plataforma', name: 'Reboque com Plataforma' },
  { id: 'reboque_cegonha', name: 'Reboque Cegonha' },
  { id: 'socorro_mecanico', name: 'Socorro Mecânico' },
  { id: 'troca_pneus', name: 'Troca de Pneus' },
  { id: 'chaveiro', name: 'Serviço de Chaveiro' },
];

const URGENCY_LEVELS = [
  { id: 'baixa', name: 'Baixa', description: 'Não é urgente, pode aguardar até 24 horas' },
  { id: 'media', name: 'Média', description: 'Deve ser resolvido em até 6 horas' },
  { id: 'alta', name: 'Alta', description: 'Emergencial, precisa ser atendido imediatamente' },
];

// Página de criação de nova solicitação de guincho
const NewTowingRequestPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  // Buscar parceiros disponíveis
  const {
    data: partners,
    isLoading: isLoadingPartners,
    error: partnersError,
  } = useQuery<{ id: number, name: string, status: string }[]>({
    queryKey: ['/api/towing/partners'],
    enabled: !!user,
    select: (data) => data.filter(partner => partner.status === 'ativo'),
  });
  
  // Form com react-hook-form e zod
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicle_plate: '',
      driver_name: '',
      pickup_location: '',
      destination: '',
      service_type: '',
      urgency: 'media',
      partner_id: '',
      description: '',
      estimated_cost: undefined,
      reason: '', // Campo obrigatório adicionado
    }
  });
  
  // Mutação para criar solicitação
  const createRequestMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Adaptar campos para o formato aceito pelo backend
      // A tabela não tem campo "description", mas tem "vehicle_condition"
      const requestData = {
        ...data,
        vehicle_condition: data.description, // Mover descrição para campo correto
      };
      
      // Remover campo description que não existe na tabela
      delete requestData.description;
      
      const response = await apiRequest('POST', '/api/towing/requests', requestData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Solicitação criada',
        description: 'A solicitação de guincho foi enviada com sucesso.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/towing/requests'] });
      navigate('/fleet-management/towing-partners/requests');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar solicitação',
        description: error.message || 'Não foi possível criar a solicitação de guincho.',
        variant: 'destructive',
      });
    }
  });
  
  // Submit do formulário
  const onSubmit = (data: FormValues) => {
    createRequestMutation.mutate(data);
  };
  
  // Verificar permissão
  if (user && !['admin', 'gestor_frota', 'gestor', 'operador'].includes(user.role)) {
    return (
      <div className="container mx-auto py-6 space-y-8 max-w-7xl">
        <div className="flex items-center gap-2 mb-4">
          <Link to="/fleet-management/towing-partners/requests">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para criar novas solicitações de guincho.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Esta funcionalidade está disponível apenas para administradores, gestores de frota, gestores e operadores.</p>
          </CardContent>
          <CardFooter>
            <Link to="/fleet-management/towing-partners/requests">
              <Button variant="default">
                Voltar para Solicitações
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Erro ao carregar parceiros
  if (partnersError) {
    return (
      <div className="container mx-auto py-6 space-y-8 max-w-7xl">
        <div className="flex items-center gap-2 mb-4">
          <Link to="/fleet-management/towing-partners/requests">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Erro ao Carregar Dados</CardTitle>
            <CardDescription>
              Não foi possível carregar os parceiros de guincho disponíveis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-destructive gap-2">
              <AlertCircle className="h-5 w-5" />
              <p>Ocorreu um erro ao carregar os dados necessários. Tente novamente mais tarde.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Link to="/fleet-management/towing-partners/requests">
              <Button variant="default">
                Voltar para Solicitações
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-8 max-w-5xl">
      <div className="flex items-center gap-2 mb-4">
        <Link to="/fleet-management/towing-partners/requests">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </Link>
      </div>
      
      <PageHeader
        title="Nova Solicitação de Guincho"
        description="Solicite um serviço de guincho ou reboque para um veículo"
        icon={<FileText size={28} />}
      />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Veículo e Motorista</CardTitle>
              <CardDescription>
                Informe os dados do veículo e do motorista responsável
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vehicle_plate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placa do Veículo</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="ABC1D23" 
                          {...field} 
                          className="uppercase"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="driver_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Motorista</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do motorista" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Serviço</CardTitle>
              <CardDescription>
                Informe os detalhes do serviço de guincho necessário
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="service_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Serviço</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de serviço" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SERVICE_TYPES.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="urgency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urgência</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o nível de urgência" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {URGENCY_LEVELS.map((level) => (
                            <SelectItem key={level.id} value={level.id}>
                              {level.name} - {level.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="pickup_location"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Local de Coleta</FormLabel>
                      <FormControl>
                        <Input placeholder="Endereço completo onde o veículo está" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Destino</FormLabel>
                      <FormControl>
                        <Input placeholder="Endereço de destino" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Motivo da Solicitação <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Informe o motivo pelo qual está solicitando o serviço de guincho"
                          className="resize-y min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        O motivo é obrigatório para o processamento da solicitação
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Descrição da Situação</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva a situação do veículo e qualquer informação adicional relevante"
                          className="resize-y min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Parceiro e Custos</CardTitle>
              <CardDescription>
                Selecione o parceiro de guincho e informe o custo estimado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="partner_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parceiro de Guincho</FormLabel>
                      {isLoadingPartners ? (
                        <Skeleton className="h-10 w-full" />
                      ) : partners && partners.length > 0 ? (
                        <Select 
                          onValueChange={field.onChange}
                          value={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o parceiro" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {partners.map((partner) => (
                              <SelectItem key={partner.id} value={partner.id.toString()}>
                                {partner.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-sm text-destructive flex items-center gap-2 p-2 border rounded-md">
                          <AlertCircle className="h-4 w-4" />
                          Nenhum parceiro ativo disponível
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="estimated_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo Estimado (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          {...field}
                          min={0}
                          step={0.01}
                        />
                      </FormControl>
                      <FormDescription>
                        Deixe em branco se o valor ainda não for conhecido
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link to="/fleet-management/towing-partners/requests">
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={createRequestMutation.isPending || (partners?.length === 0)}
                className="gap-2"
              >
                {createRequestMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Enviar Solicitação
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
};

export default NewTowingRequestPage;