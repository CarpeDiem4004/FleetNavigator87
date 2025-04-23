import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, CheckCircle2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import HistoricoAbastecimentosTabela from '@/components/posto-remedios/HistoricoAbastecimentosTabela';

// Esquema de validação para o formulário de abastecimento
const abastecimentoFormSchema = z.object({
  placa: z.string().min(1, { message: 'Placa é obrigatória' }),
  km: z.coerce.number().min(1, { message: 'Quilometragem é obrigatória' }),
  projeto: z.string().min(1, { message: 'Projeto é obrigatório' }),
  motorista_nome: z.string().min(1, { message: 'Nome do motorista é obrigatório' }),
  motorista_rg: z.string().min(1, { message: 'RG do motorista é obrigatório' }),
  tipo_combustivel: z.string().optional(),
  quantidade_litros: z.coerce.number().optional(),
  valor_litro: z.coerce.number().optional(),
  valor_total: z.coerce.number().optional(),
  lavagem: z.boolean().default(false),
  tipo_lavagem: z.string().optional(),
  observacoes: z.string().optional(),
});

type AbastecimentoFormValues = z.infer<typeof abastecimentoFormSchema>;

export default function PostoRemediosPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registros, setRegistros] = useState<any[]>([]);
  const [filtroPlaca, setFiltroPlaca] = useState('');
  const [loadingRegistros, setLoadingRegistros] = useState(false);

  const form = useForm<AbastecimentoFormValues>({
    resolver: zodResolver(abastecimentoFormSchema),
    defaultValues: {
      placa: '',
      km: undefined,
      projeto: '',
      motorista_nome: '',
      motorista_rg: '',
      tipo_combustivel: 'diesel',
      quantidade_litros: undefined,
      valor_litro: undefined,
      valor_total: undefined,
      lavagem: false,
      tipo_lavagem: '',
      observacoes: '',
    },
  });

  // Carregar registros ao inicializar a página
  useEffect(() => {
    carregarRegistros();
  }, []);

  // Função para carregar registros do posto Remédios
  const carregarRegistros = async () => {
    setLoadingRegistros(true);
    try {
      const response = await fetch(`/api/posto-remedios/abastecimentos${filtroPlaca ? `?placa=${filtroPlaca}` : ''}`);
      if (response.ok) {
        const data = await response.json();
        setRegistros(data.data || []);
      } else {
        toast({
          title: 'Erro',
          description: 'Falha ao carregar registros',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar registros',
        variant: 'destructive',
      });
    } finally {
      setLoadingRegistros(false);
    }
  };

  // Função para enviar o formulário
  const onSubmit = async (values: AbastecimentoFormValues) => {
    setLoading(true);
    try {
      const response = await fetch('/api/posto-remedios/abastecimentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        setSuccess(true);
        toast({
          title: 'Sucesso',
          description: 'Registro adicionado com sucesso',
        });
        form.reset();
        // Recarregar registros após adicionar um novo
        carregarRegistros();
      } else {
        const errorData = await response.json();
        toast({
          title: 'Erro',
          description: errorData.message || 'Falha ao registrar',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao processar a solicitação',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  // Opções de projetos
  const projetosOptions = [
    'GRUPO PEREIRA',
    'COCA COLA',
    'SHOPEE',
    'MERCADO LIVRE',
    'LINE HALL SHOPEE',
    'FULL MELI',
    'MADEIRA MADEIRA',
    'MAGALU',
    'NATURA',
    'OXXO',
    'PETLOVE',
    'REMÉDIOS',
    'Outro'
  ];

  // Formatar data
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR');
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Posto Remédios - Controle de Abastecimento e Lavagem</h1>

        <Tabs defaultValue="novo" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="novo">Novo Registro</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="novo" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Registrar Abastecimento ou Lavagem</CardTitle>
                <CardDescription>
                  Preencha os dados para registrar um abastecimento ou lavagem no Posto Remédios.
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                              <Input placeholder="ABC1234" {...field} />
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
                            <FormLabel>Quilometragem</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="100000" {...field} />
                            </FormControl>
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
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o projeto" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {projetosOptions.map((projeto) => (
                                  <SelectItem key={projeto} value={projeto}>
                                    {projeto}
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
                        name="motorista_nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Motorista</FormLabel>
                            <FormControl>
                              <Input placeholder="João da Silva" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="motorista_rg"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>RG do Motorista</FormLabel>
                            <FormControl>
                              <Input placeholder="12.345.678-9" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h3 className="text-lg font-medium mb-4">Dados do Abastecimento</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="tipo_combustivel"
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
                                  <SelectItem value="diesel">Diesel</SelectItem>
                                  <SelectItem value="gasolina">Gasolina</SelectItem>
                                  <SelectItem value="alcool">Álcool</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="quantidade_litros"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantidade (L)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  placeholder="0.00" 
                                  {...field} 
                                  onChange={(e) => {
                                    field.onChange(e);
                                    // Calcular valor total automaticamente se tiver valor por litro
                                    const qtd = parseFloat(e.target.value);
                                    const valorLitro = form.getValues("valor_litro");
                                    if (!isNaN(qtd) && valorLitro) {
                                      form.setValue("valor_total", (qtd * valorLitro).toFixed(2));
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="valor_litro"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valor por Litro (R$)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  placeholder="0.00" 
                                  {...field} 
                                  onChange={(e) => {
                                    field.onChange(e);
                                    // Calcular valor total automaticamente se tiver quantidade
                                    const valorLitro = parseFloat(e.target.value);
                                    const qtd = form.getValues("quantidade_litros");
                                    if (!isNaN(valorLitro) && qtd) {
                                      form.setValue("valor_total", (qtd * valorLitro).toFixed(2));
                                    }
                                  }}
                                />
                              </FormControl>
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
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  placeholder="0.00" 
                                  {...field} 
                                  className="bg-gray-50"
                                  readOnly
                                />
                              </FormControl>
                              <FormDescription>
                                Calculado automaticamente
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h3 className="text-lg font-medium mb-4">Dados da Lavagem</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="lavagem"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Realizar lavagem</FormLabel>
                                <FormDescription>
                                  Marque esta opção se o veículo passou por lavagem
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        {form.watch('lavagem') && (
                          <FormField
                            control={form.control}
                            name="tipo_lavagem"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo de Lavagem</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o tipo de lavagem" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="simples">Simples</SelectItem>
                                    <SelectItem value="completa">Completa</SelectItem>
                                    <SelectItem value="motor">Motor</SelectItem>
                                    <SelectItem value="chassi">Chassi</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="observacoes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Observações adicionais" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading || success}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {success && <CheckCircle2 className="mr-2 h-4 w-4" />}
                      {loading ? 'Enviando...' : success ? 'Registrado com sucesso!' : 'Registrar'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Registros</CardTitle>
                <CardDescription>
                  Visualize o histórico de abastecimentos e lavagens registrados no Posto Remédios.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Filtrar por placa"
                      value={filtroPlaca}
                      onChange={(e) => setFiltroPlaca(e.target.value)}
                    />
                  </div>
                  <Button onClick={carregarRegistros} disabled={loadingRegistros}>
                    {loadingRegistros ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      'Filtrar'
                    )}
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-2 text-left">Data</th>
                        <th className="px-4 py-2 text-left">Placa</th>
                        <th className="px-4 py-2 text-left">KM</th>
                        <th className="px-4 py-2 text-left">Motorista</th>
                        <th className="px-4 py-2 text-left">Projeto</th>
                        <th className="px-4 py-2 text-left">Combustível</th>
                        <th className="px-4 py-2 text-left">Litros</th>
                        <th className="px-4 py-2 text-left">Valor</th>
                        <th className="px-4 py-2 text-left">Lavagem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingRegistros ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-2 text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          </td>
                        </tr>
                      ) : registros.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-2 text-center">
                            Nenhum registro encontrado
                          </td>
                        </tr>
                      ) : (
                        registros.map((registro) => (
                          <tr key={registro.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2">{formatarData(registro.data_registro)}</td>
                            <td className="px-4 py-2">{registro.placa}</td>
                            <td className="px-4 py-2">{registro.km}</td>
                            <td className="px-4 py-2">{registro.motorista_nome}</td>
                            <td className="px-4 py-2">{registro.projeto}</td>
                            <td className="px-4 py-2">{registro.tipo_combustivel || '-'}</td>
                            <td className="px-4 py-2">{registro.quantidade_litros || '-'}</td>
                            <td className="px-4 py-2">
                              {registro.valor_total
                                ? `R$ ${Number(registro.valor_total).toFixed(2)}`
                                : '-'}
                            </td>
                            <td className="px-4 py-2">
                              {registro.lavagem ? registro.tipo_lavagem || 'Sim' : 'Não'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <p className="text-sm text-gray-500">
                  Total de registros: {registros.length}
                </p>
                <Button variant="outline" onClick={carregarRegistros}>
                  Atualizar
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}