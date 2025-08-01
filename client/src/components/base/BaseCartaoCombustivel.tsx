/**
 * Componente genérico de cartão combustível para bases
 * Pode ser usado por qualquer base com customização de nome e cor
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Fuel, 
  CreditCard, 
  Clock, 
  Building2, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface BaseCartaoCombustivelProps {
  baseId: number;
  baseName?: string;
  primaryColor?: string;
}

interface Project {
  id: number;
  name: string;
}

interface Base {
  id: number;
  name: string;
  location: string;
}

const formSchema = z.object({
  motorista: z.string().min(1, 'Nome do motorista é obrigatório'),
  solicitante: z.string().min(1, 'Nome do solicitante é obrigatório'),
  telefone_celular: z.string().optional(),
  placa: z.string().min(1, 'Placa do veículo é obrigatória'),
  valor: z.string().min(1, 'Valor é obrigatório'),
  projeto: z.string().min(1, 'Projeto é obrigatório'),
  base: z.string().min(1, 'Base é obrigatória'),
  tipo_cartao: z.enum(['vinculado', 'especifico'], {
    required_error: 'Tipo de cartão é obrigatório',
  }),
  provedor_cartao: z.enum(['Ticket', 'Alelo'], {
    required_error: 'Provedor do cartão é obrigatório',
  }),
  numero_cartao: z.string().optional(),
  dados_cartao_especifico: z.string().optional(),
  horario_abastecimento: z.enum(['antes_17h', 'apos_18h'], {
    required_error: 'Horário de abastecimento é obrigatório',
  }),
  observacoes: z.string().optional(),
});

export default function BaseCartaoCombustivel({ 
  baseId, 
  baseName, 
  primaryColor = '#2563eb' 
}: BaseCartaoCombustivelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      motorista: '',
      solicitante: '',
      telefone_celular: '',
      placa: '',
      valor: '',
      projeto: '',
      base: '',
      tipo_cartao: 'vinculado',
      provedor_cartao: 'Ticket',
      numero_cartao: '',
      dados_cartao_especifico: '',
      horario_abastecimento: 'antes_17h',
      observacoes: '',
    },
  });

  // Buscar projetos
  const { data: projects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/projects');
      const data = await res.json();
      return data.data || [];
    },
  });

  // Buscar bases
  const { data: bases } = useQuery<Base[]>({
    queryKey: ['/api/bases'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/bases');
      const data = await res.json();
      return data.data || [];
    },
  });

  // Mutation para criar solicitação
  const createSolicitation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      setIsSubmitting(true);
      
      // Definir o número do cartão baseado no tipo
      let finalCardNumber = '';
      if (data.tipo_cartao === 'vinculado') {
        finalCardNumber = data.placa;
      } else {
        finalCardNumber = data.dados_cartao_especifico || '';
      }

      const solicitation = {
        ...data,
        numero_cartao: finalCardNumber,
        base_id: baseId,
        base_name: baseName,
        valor: parseFloat(data.valor.replace(/[^\d.,]/g, '').replace(',', '.')),
        data_solicitacao: new Date().toISOString(),
        status: 'pendente',
        origem: 'base_system',
      };

      const res = await apiRequest('POST', '/api/fuel-card-solicitations', solicitation);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao criar solicitação');
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitação enviada com sucesso!",
        description: "Sua solicitação foi enviada e está aguardando retorno da gestão de combustível",
      });
      
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/fuel-card-solicitations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Validação adicional para cartão específico
    if (data.tipo_cartao === 'especifico' && !data.dados_cartao_especifico?.trim()) {
      form.setError('dados_cartao_especifico', {
        message: 'Dados do cartão específico são obrigatórios quando selecionado',
      });
      return;
    }

    createSolicitation.mutate(data);
  };

  const watchTipoCartao = form.watch('tipo_cartao');
  const watchProjeto = form.watch('projeto');

  // Filtrar bases baseado no projeto selecionado
  const filteredBases = bases?.filter(base => {
    if (!watchProjeto) return true;
    // Aqui você pode implementar lógica para filtrar bases por projeto
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" style={{ color: primaryColor }} />
            Solicitação de Cartão Combustível
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Preencha os dados para solicitar recarga ou novo cartão de combustível para sua base.
          </p>
        </CardContent>
      </Card>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados da Solicitação</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="motorista"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Motorista</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo do motorista" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="solicitante"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Solicitante</FormLabel>
                      <FormControl>
                        <Input placeholder="Quem está fazendo a solicitação" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                  name="telefone_celular"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone do Solicitante</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor da Recarga (R$)</FormLabel>
                      <FormControl>
                        <Input placeholder="150,00" {...field} />
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o projeto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects?.map((project) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="base"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a base" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredBases?.map((base) => (
                          <SelectItem key={base.id} value={base.id.toString()}>
                            {base.name} - {base.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipo_cartao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Cartão</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vinculado">Vinculado à placa</SelectItem>
                          <SelectItem value="especifico">Cartão específico por número</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="provedor_cartao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provedor do Cartão</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o provedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Ticket">Ticket</SelectItem>
                          <SelectItem value="Alelo">Alelo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {watchTipoCartao === 'especifico' && (
                <FormField
                  control={form.control}
                  name="dados_cartao_especifico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dados específicos do cartão</FormLabel>
                      <FormControl>
                        <Input placeholder="Número do cartão ou outras informações" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="horario_abastecimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Abastecimento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o horário" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="antes_17h">Antes das 17h</SelectItem>
                        <SelectItem value="apos_18h">Após as 18h</SelectItem>
                      </SelectContent>
                    </Select>
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
                        placeholder="Informações adicionais sobre a solicitação..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Solicitar Recarga
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}