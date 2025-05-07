import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { 
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage 
} from '@/components/ui/form';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { 
  AlertCircle, ArrowLeft, Banknote, Check, CreditCard, 
  Download, DollarSign, MoreHorizontal 
} from 'lucide-react';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Interface para os dados de despesas
interface BaseExpense {
  id: number;
  base_id: number;
  base_name: string;
  month: number;
  year: number;
  month_name: string;
  agua: number;
  energia: number;
  funcionarios: number;
  pj: number;
  aluguel: number;
  internet: number;
  despesas_extras: number;
  total_despesas: number;
  observacoes: string | null;
  status: 'pendente' | 'atualizado' | 'atrasado';
  last_updated: string;
  updated_by_name: string | null;
}

// ID da base Campinas (presumindo que já foi criada no banco)
const CAMPINAS_BASE_ID = 9; // Ajuste este ID conforme necessário

// Schema de validação para o formulário de despesas
const expenseFormSchema = z.object({
  month: z.string().min(1, "Mês é obrigatório"),
  year: z.string().min(4, "Ano é obrigatório"),
  agua: z.string().min(1, "Valor de água é obrigatório"),
  energia: z.string().min(1, "Valor de energia é obrigatório"),
  funcionarios: z.string().min(1, "Valor para funcionários é obrigatório"),
  pj: z.string().min(1, "Valor para PJ é obrigatório"),
  aluguel: z.string().min(1, "Valor do aluguel é obrigatório"),
  internet: z.string().min(1, "Valor da internet é obrigatório"),
  despesas_extras: z.string(),
  observacoes: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

const DespesasCampinas: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Consulta para obter as despesas da base
  const { data: expenses, isLoading, error } = useQuery({
    queryKey: ['/api/bases/campinas/despesas'],
    queryFn: async () => {
      const response = await apiRequest<BaseExpense[]>('/api/bases/campinas/despesas');
      return response;
    },
  });

  // Formulário para adicionar/editar despesas
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      month: (new Date().getMonth() + 1).toString(),
      year: new Date().getFullYear().toString(),
      agua: "0",
      energia: "0",
      funcionarios: "0",
      pj: "0",
      aluguel: "0",
      internet: "0",
      despesas_extras: "0",
      observacoes: "",
    },
  });

  // Mutação para salvar despesas
  const saveMutation = useMutation({
    mutationFn: async (values: ExpenseFormValues) => {
      const numericValues = {
        base_id: CAMPINAS_BASE_ID,
        month: parseInt(values.month),
        year: parseInt(values.year),
        agua: parseFloat(values.agua),
        energia: parseFloat(values.energia),
        funcionarios: parseFloat(values.funcionarios),
        pj: parseFloat(values.pj),
        aluguel: parseFloat(values.aluguel),
        internet: parseFloat(values.internet),
        despesas_extras: parseFloat(values.despesas_extras || "0"),
        observacoes: values.observacoes,
        status: 'atualizado' as const,
      };

      const response = await apiRequest('/api/bases/campinas/despesas', {
        method: 'POST',
        body: JSON.stringify(numericValues),
      });

      return response;
    },
    onSuccess: () => {
      toast({
        title: "Despesas registradas",
        description: "As despesas foram salvas com sucesso.",
        variant: "default",
      });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/bases/campinas/despesas'] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as despesas. Tente novamente.",
        variant: "destructive",
      });
      console.error("Erro ao salvar despesas:", error);
    },
  });

  // Função para lidar com o envio do formulário
  const onSubmit = (values: ExpenseFormValues) => {
    saveMutation.mutate(values);
  };

  // Função para formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Função para obter o nome do mês
  const getMonthName = (month: number) => {
    return format(new Date(2022, month - 1, 1), 'MMMM', { locale: ptBR });
  };

  // Função para obter o status formatado
  const getStatusDisplay = (status: string) => {
    const statusMap = {
      pendente: { color: 'text-yellow-600 bg-yellow-100', text: 'Pendente' },
      atualizado: { color: 'text-green-600 bg-green-100', text: 'Atualizado' },
      atrasado: { color: 'text-red-600 bg-red-100', text: 'Atrasado' },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pendente;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  // Renderiza o componente
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/bases/campinas')}
          className="mr-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          Gestão de Despesas - Base Campinas
        </h1>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <p className="text-gray-600">
            Registre e acompanhe as despesas mensais da base Campinas.
          </p>
          <p className="text-gray-500 text-sm mt-1">
            As despesas devem ser atualizadas mensalmente.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <CreditCard className="w-4 h-4 mr-2" />
              Registrar Despesas
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[750px]">
            <DialogHeader>
              <DialogTitle>Registrar Despesas Mensais</DialogTitle>
              <DialogDescription>
                Preencha os valores das despesas do mês para a Base Campinas.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-blue-100 p-6 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mês</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Selecione o mês" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">Janeiro</SelectItem>
                            <SelectItem value="2">Fevereiro</SelectItem>
                            <SelectItem value="3">Março</SelectItem>
                            <SelectItem value="4">Abril</SelectItem>
                            <SelectItem value="5">Maio</SelectItem>
                            <SelectItem value="6">Junho</SelectItem>
                            <SelectItem value="7">Julho</SelectItem>
                            <SelectItem value="8">Agosto</SelectItem>
                            <SelectItem value="9">Setembro</SelectItem>
                            <SelectItem value="10">Outubro</SelectItem>
                            <SelectItem value="11">Novembro</SelectItem>
                            <SelectItem value="12">Dezembro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ano</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Selecione o ano" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2025">2025</SelectItem>
                            <SelectItem value="2026">2026</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="agua"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Água (R$)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="pl-8"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="energia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Energia (R$)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="pl-8"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="funcionarios"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Funcionários (R$)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="pl-8"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PJ (R$)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="pl-8"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="aluguel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aluguel (R$)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="pl-8"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="internet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Internet (R$)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="pl-8"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="despesas_extras"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Despesas Extras (R$)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-8"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações adicionais sobre as despesas deste mês"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="reset"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="mr-2"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending ? (
                      <>Salvando...</>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Salvar Despesas
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-md">
        <CardHeader className="bg-blue-50">
          <CardTitle className="flex items-center text-blue-700">
            <Banknote className="w-5 h-5 mr-2" />
            Histórico de Despesas
          </CardTitle>
          <CardDescription>
            Registro mensal de despesas da Base Campinas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <p>Carregando registros de despesas...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-500">Erro ao carregar dados de despesas</p>
              <p className="text-sm text-gray-500 mt-2">
                Verifique sua conexão e tente novamente.
              </p>
            </div>
          ) : !expenses || expenses.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">
                Nenhum registro de despesa encontrado para a Base Campinas.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Clique em "Registrar Despesas" para adicionar um novo registro.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês/Ano</TableHead>
                    <TableHead>Água</TableHead>
                    <TableHead>Energia</TableHead>
                    <TableHead>Funcionários</TableHead>
                    <TableHead>PJ</TableHead>
                    <TableHead>Aluguel</TableHead>
                    <TableHead>Internet</TableHead>
                    <TableHead>Extras</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Atualizado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        {expense.month_name || getMonthName(expense.month)}/{expense.year}
                      </TableCell>
                      <TableCell>{formatCurrency(expense.agua)}</TableCell>
                      <TableCell>{formatCurrency(expense.energia)}</TableCell>
                      <TableCell>{formatCurrency(expense.funcionarios)}</TableCell>
                      <TableCell>{formatCurrency(expense.pj)}</TableCell>
                      <TableCell>{formatCurrency(expense.aluguel)}</TableCell>
                      <TableCell>{formatCurrency(expense.internet)}</TableCell>
                      <TableCell>{formatCurrency(expense.despesas_extras)}</TableCell>
                      <TableCell className="font-bold">
                        {formatCurrency(expense.total_despesas)}
                      </TableCell>
                      <TableCell>{getStatusDisplay(expense.status)}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(expense.last_updated).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-gray-50 border-t flex justify-between">
          <div className="text-sm text-gray-500">
            Última atualização: {expenses && expenses.length > 0 
              ? new Date(expenses[0].last_updated).toLocaleString('pt-BR') 
              : 'Nunca atualizado'}
          </div>
          <Button variant="outline" size="sm" className="text-gray-500">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default DespesasCampinas;