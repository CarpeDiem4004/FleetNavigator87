import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Componentes UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/layout/PageHeader';

// Ícones
import { Truck, ArrowLeft, Save, CheckCircle2 } from 'lucide-react';

// Definição do esquema de validação
const formSchema = z.object({
  name: z.string()
    .min(3, { message: 'O nome deve ter pelo menos 3 caracteres' })
    .max(100, { message: 'O nome deve ter no máximo 100 caracteres' }),
  company_document: z.string()
    .min(14, { message: 'CNPJ deve ter 14 dígitos' })
    .max(18, { message: 'CNPJ deve ter no máximo 18 caracteres' })
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .min(10, { message: 'Telefone deve ter pelo menos 10 dígitos' })
    .max(15, { message: 'Telefone deve ter no máximo 15 caracteres' }),
  email: z.string()
    .email({ message: 'Email inválido' }),
  city: z.string()
    .min(2, { message: 'Cidade deve ter pelo menos 2 caracteres' })
    .max(100, { message: 'Cidade deve ter no máximo 100 caracteres' }),
  region: z.string()
    .min(2, { message: 'Estado deve ter pelo menos 2 caracteres' })
    .max(50, { message: 'Estado deve ter no máximo 50 caracteres' }),
  address: z.string()
    .max(200, { message: 'Endereço deve ter no máximo 200 caracteres' })
    .optional()
    .or(z.literal('')),
  cost_per_km: z.preprocess(
    (val) => val === '' ? undefined : Number(val),
    z.number({ invalid_type_error: 'O valor deve ser um número' })
      .min(0, { message: 'O valor não pode ser negativo' })
      .max(1000, { message: 'O valor máximo é R$ 1.000,00 por km' })
      .optional()
  ),
  service_types: z.array(z.string())
    .min(1, { message: 'Selecione pelo menos um tipo de serviço' }),
  payment_methods: z.array(z.string())
    .min(1, { message: 'Selecione pelo menos um método de pagamento' }),
  status: z.enum(['ativo', 'pendente', 'inativo'], {
    required_error: 'Status é obrigatório',
  }),
  notes: z.string().max(500, { message: 'Observações devem ter no máximo 500 caracteres' }).optional().or(z.literal('')),
  coverage_radius: z.coerce.number().min(1, { message: 'Raio de atendimento deve ser maior que 0' }).optional(),
  has_insurance: z.boolean().default(false),
  available_24h: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

// Tipos de serviço disponíveis
const availableServiceTypes = [
  { id: 'guincho_leve', name: 'Guincho Leve' },
  { id: 'guincho_pesado', name: 'Guincho Pesado' },
  { id: 'reboque_plataforma', name: 'Reboque com Plataforma' },
  { id: 'reboque_cegonha', name: 'Reboque Cegonha' },
  { id: 'socorro_mecanico', name: 'Socorro Mecânico' },
  { id: 'troca_pneus', name: 'Troca de Pneus' },
  { id: 'chaveiro', name: 'Serviço de Chaveiro' },
];

// Métodos de pagamento disponíveis
const availablePaymentMethods = [
  { id: 'boleto', name: 'Boleto Bancário' },
  { id: 'pix', name: 'PIX' },
  { id: 'cartao_credito', name: 'Cartão de Crédito' },
  { id: 'cartao_debito', name: 'Cartão de Débito' },
  { id: 'transferencia', name: 'Transferência Bancária' },
  { id: 'dinheiro', name: 'Dinheiro' },
  { id: 'faturado', name: 'Faturado' },
];

// Estados brasileiros
const brazilianStates = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' }
];

// Página de adição de novo parceiro de guincho
const NewTowingPartnerPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  // Form com react-hook-form e zod
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      company_document: '',
      phone: '',
      email: '',
      city: '',
      region: '',
      address: '',
      cost_per_km: undefined,
      service_types: [],
      payment_methods: [],
      status: 'pendente',
      notes: '',
      has_insurance: false,
      available_24h: false,
      coverage_radius: undefined,
    }
  });
  
  // Mutação para criar parceiro
  const createPartnerMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest('POST', '/api/towing/partners', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Parceiro adicionado',
        description: 'O parceiro de guincho foi cadastrado com sucesso.',
        variant: 'default',
      });
      navigate('/fleet-management/towing-partners');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao adicionar parceiro',
        description: error.message || 'Não foi possível cadastrar o parceiro de guincho.',
        variant: 'destructive',
      });
    }
  });
  
  // Submit do formulário
  const onSubmit = (data: FormValues) => {
    createPartnerMutation.mutate(data);
  };
  
  // Verificar permissão
  if (user && !['admin', 'gestor_frota'].includes(user.role)) {
    return (
      <div className="container mx-auto py-6 space-y-8 max-w-7xl">
        <div className="flex items-center gap-2 mb-4">
          <Link to="/fleet-management/towing-partners">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para adicionar novos parceiros de guincho.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Esta funcionalidade está disponível apenas para administradores e gestores de frota.</p>
          </CardContent>
          <CardFooter>
            <Link to="/fleet-management/towing-partners">
              <Button variant="default">
                Voltar para Parceiros
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
        <Link to="/fleet-management/towing-partners">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </Link>
      </div>
      
      <PageHeader
        title="Adicionar Parceiro de Guincho"
        description="Cadastre um novo parceiro para serviços de guincho e reboque"
        icon={<Truck size={28} />}
      />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Preencha os dados principais do parceiro de guincho
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do parceiro ou empresa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="company_document"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input placeholder="00.000.000/0000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@empresa.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {brazilianStates.map((state) => (
                            <SelectItem key={state.value} value={state.value}>
                              {state.label}
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
                  name="address"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Endereço completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost_per_km"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor (R$/km)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          placeholder="0.00"
                          {...field}
                          value={field.value === undefined ? '' : field.value}
                          onChange={(e) => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Valor cobrado por quilômetro rodado
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Serviços e Pagamentos</CardTitle>
              <CardDescription>
                Defina quais serviços o parceiro oferece e as formas de pagamento aceitas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="service_types"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel>Tipos de Serviço</FormLabel>
                      <FormDescription>
                        Selecione todos os serviços oferecidos pelo parceiro.
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {availableServiceTypes.map((serviceType) => (
                        <FormField
                          key={serviceType.id}
                          control={form.control}
                          name="service_types"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={serviceType.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(serviceType.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, serviceType.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== serviceType.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {serviceType.name}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator />
              
              <FormField
                control={form.control}
                name="payment_methods"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel>Métodos de Pagamento</FormLabel>
                      <FormDescription>
                        Selecione todas as formas de pagamento aceitas pelo parceiro.
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {availablePaymentMethods.map((paymentMethod) => (
                        <FormField
                          key={paymentMethod.id}
                          control={form.control}
                          name="payment_methods"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={paymentMethod.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(paymentMethod.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, paymentMethod.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== paymentMethod.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {paymentMethod.name}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Configurações Adicionais</CardTitle>
              <CardDescription>
                Configure status, opções adicionais e observações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Parceiros com status "Pendente" não aparecem para solicitações até serem ativados.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="coverage_radius"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Raio de Atendimento (km)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" placeholder="50" {...field} />
                      </FormControl>
                      <FormDescription>
                        Distância máxima que o parceiro atende a partir da cidade base.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="has_insurance"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Possui seguro para carga e veículos
                        </FormLabel>
                        <FormDescription>
                          O parceiro possui apólice de seguro para carga e veículos transportados.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="available_24h"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Atendimento 24 horas
                        </FormLabel>
                        <FormDescription>
                          O parceiro oferece serviço de atendimento 24 horas, 7 dias por semana.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Informações adicionais, contatos alternativos, etc."
                        className="resize-y min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link to="/fleet-management/towing-partners">
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={createPartnerMutation.isPending}
                className="gap-2"
              >
                {createPartnerMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Parceiro
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

export default NewTowingPartnerPage;