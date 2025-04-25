import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
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

export default function FormularioAbastecimentoStandalone() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  // Propriedade para callback após sucesso no cadastro
  const onSubmitSuccess = (window as any).onSubmitSuccessPostoRemedios;

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

  const onSubmit = async (data: AbastecimentoFormValues) => {
    setLoading(true);
    setSuccess(false);
    
    try {
      const response = await fetch('/api/posto-remedios-standalone/abastecimentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (result.success) {
        form.reset();
        setSuccess(true);
        toast({
          title: 'Sucesso',
          description: 'Registro adicionado com sucesso',
          variant: 'default',
        });
        
        // Chamar callback para atualizar a lista de registros
        if (typeof onSubmitSuccess === 'function') {
          console.log("[FORM ABASTECIMENTO] Chamando callback de sucesso para atualizar histórico");
          onSubmitSuccess();
        }
      } else {
        toast({
          title: 'Erro',
          description: result.message || 'Erro ao adicionar registro',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao enviar dados:', error);
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

  return (
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
                          form.setValue("valor_total", parseFloat((qtd * valorLitro).toFixed(2)));
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
                          form.setValue("valor_total", parseFloat((qtd * valorLitro).toFixed(2)));
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
                    <FormLabel>Incluir Serviço de Lavagem</FormLabel>
                    <FormDescription>
                      Marque esta opção se o veículo passou por lavagem
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {form.watch("lavagem") && (
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
                <Textarea
                  placeholder="Observações adicionais sobre o abastecimento ou lavagem"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => form.reset()}
            disabled={loading}
          >
            Limpar
          </Button>
          <Button 
            type="submit" 
            disabled={loading || success}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Concluído
              </>
            ) : (
              'Registrar'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}