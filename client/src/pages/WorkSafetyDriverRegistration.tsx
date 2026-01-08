import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, User, Phone, Mail, CreditCard, FileCheck, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  nomeCompleto: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z.string().min(11, 'CPF inválido').max(14, 'CPF inválido'),
  rg: z.string().min(5, 'RG inválido').max(20, 'RG inválido'),
  baseAtuacao: z.string().min(1, 'Selecione a base de atuação'),
  categoriaContrato: z.string().min(1, 'Selecione a categoria de contrato'),
  milhaAtuacao: z.string().min(1, 'Selecione a milha de atuação'),
  telefoneMotorista: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('E-mail inválido'),
  possuiEar: z.enum(['true', 'false']),
  numeroCnh: z.string().min(1, 'Número da CNH é obrigatório'),
  categoriaCnh: z.string().min(1, 'Selecione a categoria da CNH'),
  dataEmissaoCnh: z.string().min(1, 'Data de emissão da CNH é obrigatória'),
  cadastradoDds: z.enum(['true', 'false']),
  cadastradoVecFleet: z.enum(['true', 'false']),
  pgrAprovado: z.enum(['true', 'false']),
  nomeResponsavel: z.string().min(3, 'Nome do responsável é obrigatório'),
  telefoneResponsavel: z.string().min(10, 'Telefone do responsável inválido'),
});

type FormData = z.infer<typeof formSchema>;

function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
}

function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

export default function WorkSafetyDriverRegistration() {
  const { toast } = useToast();
  const [showPgrWarning, setShowPgrWarning] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [bases, setBases] = useState<string[]>([]);
  const [isLoadingBases, setIsLoadingBases] = useState(true);
  const [basesError, setBasesError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    
    const fetchBases = async (): Promise<void> => {
      try {
        setIsLoadingBases(true);
        setBasesError(null);
        
        console.log('[WorkSafety] Fetching bases, attempt:', retryCount + 1);
        
        const response = await fetch('/api/work-safety/bases', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        console.log('[WorkSafety] Response status:', response.status);
        
        const contentType = response.headers.get('content-type');
        console.log('[WorkSafety] Content-Type:', contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
          if (retryCount < maxRetries) {
            retryCount++;
            console.log('[WorkSafety] Retrying due to invalid content-type...');
            await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
            return fetchBases();
          }
          throw new Error('Resposta inválida do servidor');
        }
        
        const text = await response.text();
        console.log('[WorkSafety] Response text length:', text.length);
        
        let data;
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error('[WorkSafety] JSON parse error:', parseError);
          if (retryCount < maxRetries) {
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
            return fetchBases();
          }
          throw new Error('Erro ao processar resposta do servidor');
        }
        
        if (isMounted) {
          if (data.success && Array.isArray(data.data)) {
            setBases(data.data);
            console.log('[WorkSafety] Bases loaded successfully:', data.data.length);
          } else {
            throw new Error('Formato de dados inválido');
          }
        }
      } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || 'Erro desconhecido';
        console.error('[WorkSafety] Error fetching bases:', errorMessage, error);
        if (isMounted) {
          setBasesError(errorMessage);
        }
      } finally {
        if (isMounted) {
          setIsLoadingBases(false);
        }
      }
    };

    fetchBases();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeCompleto: '',
      cpf: '',
      rg: '',
      baseAtuacao: '',
      categoriaContrato: '',
      milhaAtuacao: '',
      telefoneMotorista: '',
      email: '',
      possuiEar: 'false',
      numeroCnh: '',
      categoriaCnh: '',
      dataEmissaoCnh: '',
      cadastradoDds: 'false',
      cadastradoVecFleet: 'false',
      pgrAprovado: 'false',
      nomeResponsavel: '',
      telefoneResponsavel: '',
    },
  });

  const pgrValue = form.watch('pgrAprovado');

  useEffect(() => {
    setShowPgrWarning(pgrValue === 'false');
  }, [pgrValue]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/work-safety/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          possuiEar: data.possuiEar === 'true',
          pgrAprovado: data.pgrAprovado === 'true',
          cadastradoDds: data.cadastradoDds === 'true',
          cadastradoVecFleet: data.cadastradoVecFleet === 'true',
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Erro ao cadastrar motorista');
      }
      return result;
    },
    onSuccess: () => {
      setSubmitSuccess(true);
      toast({
        title: 'Cadastro realizado!',
        description: 'Motorista cadastrado com sucesso no sistema de Segurança do Trabalho.',
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro no cadastro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (data.pgrAprovado === 'false') {
      toast({
        title: 'PGR não aprovado',
        description: 'Não é possível cadastrar motorista com PGR não aprovado.',
        variant: 'destructive',
      });
      return;
    }
    mutation.mutate(data);
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Cadastro Realizado!</h2>
            <p className="text-gray-600 mb-6">
              O motorista foi cadastrado com sucesso no sistema de Segurança do Trabalho.
            </p>
            <Button
              onClick={() => {
                setSubmitSuccess(false);
                form.reset();
              }}
              className="w-full"
              data-testid="button-new-registration"
            >
              Fazer Novo Cadastro
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Segurança do Trabalho</h1>
          <p className="text-blue-200">Cadastro de Motoristas - Murici On Fleet</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Formulário de Cadastro
            </CardTitle>
            <CardDescription className="text-blue-100">
              Preencha todos os campos obrigatórios para registrar o motorista
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Dados do Motorista
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nomeCompleto"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Nome Completo *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Digite o nome completo"
                              {...field}
                              data-testid="input-nome-completo"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="000.000.000-00"
                              {...field}
                              onChange={(e) => field.onChange(formatCPF(e.target.value))}
                              data-testid="input-cpf"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RG *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="00.000.000-0"
                              {...field}
                              data-testid="input-rg"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="baseAtuacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base de Atuação *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-base">
                                <SelectValue placeholder="Selecione a base" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {bases.map((base: string) => (
                                <SelectItem key={base} value={base}>
                                  {base}
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
                      name="categoriaContrato"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria de Contrato *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-categoria-contrato">
                                <SelectValue placeholder="Selecione a categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="agregado">Agregado</SelectItem>
                              <SelectItem value="tac">TAC</SelectItem>
                              <SelectItem value="clt">CLT</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="milhaAtuacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qual Milha Atuará? *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-milha-atuacao">
                                <SelectValue placeholder="Selecione a milha" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="line_haul">Line Haul</SelectItem>
                              <SelectItem value="middle_mile">Middle Mile</SelectItem>
                              <SelectItem value="lm">LM</SelectItem>
                              <SelectItem value="fm">FM</SelectItem>
                              <SelectItem value="melione">Melione</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="telefoneMotorista"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone do Motorista *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <Input
                                className="pl-10"
                                placeholder="(00) 00000-0000"
                                {...field}
                                onChange={(e) => field.onChange(formatPhone(e.target.value))}
                                data-testid="input-telefone"
                              />
                            </div>
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
                          <FormLabel>E-mail *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <Input
                                className="pl-10"
                                type="email"
                                placeholder="email@exemplo.com"
                                {...field}
                                data-testid="input-email"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="numeroCnh"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número da CNH *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <Input
                                className="pl-10"
                                placeholder="00000000000"
                                {...field}
                                data-testid="input-cnh"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="categoriaCnh"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria da CNH *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-categoria-cnh">
                                <SelectValue placeholder="Selecione a categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="A">A - Motocicleta</SelectItem>
                              <SelectItem value="B">B - Automóvel</SelectItem>
                              <SelectItem value="C">C - Caminhão</SelectItem>
                              <SelectItem value="D">D - Ônibus</SelectItem>
                              <SelectItem value="E">E - Veículo articulado</SelectItem>
                              <SelectItem value="AB">AB - Moto + Carro</SelectItem>
                              <SelectItem value="AC">AC - Moto + Caminhão</SelectItem>
                              <SelectItem value="AD">AD - Moto + Ônibus</SelectItem>
                              <SelectItem value="AE">AE - Moto + Articulado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dataEmissaoCnh"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Emissão da CNH *</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              data-testid="input-data-emissao-cnh"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cadastradoDds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cadastrado no DDS? *</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="true" id="dds-yes" data-testid="radio-dds-yes" />
                                <Label htmlFor="dds-yes">Sim</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="false" id="dds-no" data-testid="radio-dds-no" />
                                <Label htmlFor="dds-no">Não</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cadastradoVecFleet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cadastrado no VEC Fleet? *</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="true" id="vec-yes" data-testid="radio-vec-yes" />
                                <Label htmlFor="vec-yes">Sim</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="false" id="vec-no" data-testid="radio-vec-no" />
                                <Label htmlFor="vec-no">Não</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="possuiEar"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Possui EAR? *</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="true" id="ear-yes" data-testid="radio-ear-yes" />
                                <Label htmlFor="ear-yes">Sim</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="false" id="ear-no" data-testid="radio-ear-no" />
                                <Label htmlFor="ear-no">Não</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pgrAprovado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PGR Aprovado? *</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="true" id="pgr-yes" data-testid="radio-pgr-yes" />
                                <Label htmlFor="pgr-yes">Sim</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="false" id="pgr-no" data-testid="radio-pgr-no" />
                                <Label htmlFor="pgr-no">Não</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {showPgrWarning && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Atenção!</AlertTitle>
                    <AlertDescription>
                      Não é possível cadastrar motorista com PGR não aprovado. O PGR deve estar aprovado para prosseguir com o cadastro.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                    <FileCheck className="w-4 h-4" />
                    Dados do Responsável pelo Cadastro
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nomeResponsavel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Responsável *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nome completo do responsável"
                              {...field}
                              data-testid="input-responsavel"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="telefoneResponsavel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone do Responsável *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <Input
                                className="pl-10"
                                placeholder="(00) 00000-0000"
                                {...field}
                                onChange={(e) => field.onChange(formatPhone(e.target.value))}
                                data-testid="input-telefone-responsavel"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-lg"
                  disabled={mutation.isPending || showPgrWarning}
                  data-testid="button-submit"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Cadastrar Motorista
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-blue-200 text-sm mt-6">
          Murici On Fleet 2.0 - Segurança do Trabalho
        </p>
      </div>
    </div>
  );
}
