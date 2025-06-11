import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CreditCard, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// Schema de validação para solicitação pública
const publicFuelRequestSchema = z.object({
  plate: z.string().min(1, { message: 'A placa do veículo é obrigatória' }),
  cardNumber: z.string().min(1, { message: 'O número do cartão é obrigatório' }),
  amount: z.string().min(1, { message: 'O valor da recarga é obrigatório' }),
  reason: z.string().min(1, { message: 'O motivo da recarga é obrigatório' }),
  requestedBy: z.string().min(1, { message: 'Nome do solicitante é obrigatório' }),
  fuelType: z.string().min(1, { message: 'O tipo de combustível é obrigatório' }),
  baseId: z.string().optional(),
  phone: z.string().min(1, { message: 'Telefone é obrigatório' }),
  email: z.string().email({ message: 'E-mail inválido' }),
});

type PublicFuelRequestForm = z.infer<typeof publicFuelRequestSchema>;

interface Project {
  id: number;
  name: string;
  bases?: Base[];
}

interface Base {
  id: number;
  name: string;
}

export default function FuelCardSolicitation() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<PublicFuelRequestForm>({
    resolver: zodResolver(publicFuelRequestSchema),
    defaultValues: {
      plate: '',
      cardNumber: '',
      amount: '',
      reason: '',
      requestedBy: '',
      fuelType: '',
      baseId: '',
      phone: '',
      email: '',
    },
  });

  const selectedBaseId = form.watch('baseId');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await apiRequest('GET', '/api/public/projects-with-bases');
        const data = await response.json();
        
        if (data.success) {
          setProjects(data.data);
        }
      } catch (error) {
        console.error('Erro ao carregar projetos:', error);
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar os projetos disponíveis',
          variant: 'destructive',
        });
      }
    };

    fetchProjects();
  }, [toast]);

  const onSubmit = async (data: PublicFuelRequestForm) => {
    try {
      setIsSubmitting(true);

      // Encontrar a base selecionada para incluir o nome
      let selectedBaseName = '';
      let selectedProjectName = '';
      
      if (data.baseId) {
        for (const project of projects) {
          const base = project.bases?.find(b => b.id.toString() === data.baseId);
          if (base) {
            selectedBaseName = base.name;
            selectedProjectName = project.name;
            break;
          }
        }
      }

      const requestData = {
        ...data,
        baseName: selectedBaseName,
        projectName: selectedProjectName,
        amount: parseFloat(data.amount),
        status: 'pendente',
        requestType: 'public',
      };

      const response = await apiRequest('POST', '/api/fuel-card/public-request', requestData);
      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
        setSubmissionId(result.data.id);
        toast({
          title: 'Solicitação enviada com sucesso!',
          description: 'Sua solicitação foi registrada e será analisada pela equipe responsável.',
        });
        form.reset();
      } else {
        throw new Error(result.message || 'Erro ao enviar solicitação');
      }
    } catch (error: any) {
      console.error('Erro ao enviar solicitação:', error);
      toast({
        title: 'Erro ao enviar solicitação',
        description: error.message || 'Não foi possível enviar sua solicitação. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsSuccess(false);
    setSubmissionId(null);
    form.reset();
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Solicitação Enviada!
            </h2>
            <p className="text-gray-600 mb-6">
              Sua solicitação de recarga foi registrada com sucesso e será analisada pela equipe responsável.
            </p>
            {submissionId && (
              <p className="text-sm text-gray-500 mb-6">
                Protocolo: <span className="font-mono font-bold">#{submissionId}</span>
              </p>
            )}
            <Button onClick={resetForm} className="w-full">
              <Send className="w-4 h-4 mr-2" />
              Nova Solicitação
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <CreditCard className="w-6 h-6" />
              Solicitação de Recarga de Cartão Combustível
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Preencha todos os campos para solicitar uma recarga no seu cartão de abastecimento
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="requestedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Solicitante *</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome completo" {...field} />
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
                        <FormLabel>Telefone *</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="plate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Placa do Veículo *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="ABC-1234" 
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cardNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do Cartão *</FormLabel>
                        <FormControl>
                          <Input placeholder="Número do cartão combustível" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fuelType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Combustível *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o combustível" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="diesel">Diesel</SelectItem>
                            <SelectItem value="arla">Arla 32</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor da Recarga (R$) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0" 
                            placeholder="150.00" 
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
                  name="baseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base/Projeto (opcional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma base" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects.map((project) => (
                            project.bases?.map((base) => (
                              <SelectItem key={base.id} value={base.id.toString()}>
                                {project.name} - {base.name}
                              </SelectItem>
                            ))
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo da Solicitação *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva o motivo da solicitação de recarga"
                          className="resize-none"
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Informações importantes:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Sua solicitação será analisada pela equipe responsável</li>
                        <li>• Você receberá uma confirmação por e-mail</li>
                        <li>• O prazo de processamento é de até 24 horas</li>
                        <li>• Mantenha os dados do cartão sempre atualizados</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando Solicitação...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Solicitação
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}