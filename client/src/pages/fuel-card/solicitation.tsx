import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CreditCard, AlertCircle } from "lucide-react";

interface Project {
  id: number;
  name: string;
  description?: string;
  bases: ProjectBase[];
}

interface ProjectBase {
  id: number;
  base_name: string;
  base_code: string;
  description?: string;
}

// Schema de validação para solicitação de cartão combustível
const solicitacaoSchema = z.object({
  placa: z.string()
    .min(7, { message: "A placa deve ter no mínimo 7 caracteres" })
    .max(8, { message: "A placa deve ter no máximo 8 caracteres" }),
  km: z.string()
    .min(1, { message: "A quilometragem é obrigatória" })
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val > 0, { 
      message: "A quilometragem deve ser um número positivo",
      path: ["km"]
    }),
  valor_solicitado: z.string()
    .min(1, { message: "O valor solicitado é obrigatório" })
    .transform(val => parseFloat(val))
    .refine(val => !isNaN(val) && val > 0, {
      message: "O valor solicitado deve ser um número positivo",
      path: ["valor_solicitado"]
    }),
  tipo_cartao: z.enum(["placa", "numero"], { 
    required_error: "Selecione o tipo de cartão"
  }),
  provedor_cartao: z.enum(["Ticket", "Alelo"], { 
    required_error: "Selecione o provedor do cartão"
  }),
  numero_cartao: z.string().optional(),
  tipo_combustivel: z.enum(["gasolina", "alcool", "diesel", "arla"], {
    required_error: "Selecione o tipo de combustível"
  }),
  litros_solicitados: z.string()
    .min(1, { message: "A quantidade de litros é obrigatória" })
    .transform(val => parseFloat(val))
    .refine(val => !isNaN(val) && val > 0, {
      message: "A quantidade de litros deve ser um número positivo",
      path: ["litros_solicitados"]
    }),
  motorista: z.string()
    .min(3, { message: "O nome do motorista deve ter no mínimo 3 caracteres" }),
  projeto_id: z.string()
    .min(1, { message: "Selecione um projeto" }),
  base_id: z.string()
    .min(1, { message: "Selecione uma base" }),
  observacoes: z.string().optional()
});

type SolicitacaoValues = z.infer<typeof solicitacaoSchema>;

export default function FuelCardSolicitation() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  
  const form = useForm<SolicitacaoValues>({
    resolver: zodResolver(solicitacaoSchema),
    defaultValues: {
      placa: "",
      km: "",
      valor_solicitado: "",
      tipo_cartao: "placa",
      provedor_cartao: "Ticket",
      numero_cartao: "",
      tipo_combustivel: "diesel",
      litros_solicitados: "",
      motorista: "",
      projeto_id: "",
      base_id: "",
      observacoes: ""
    }
  });
  
  const tipoCartao = form.watch("tipo_cartao");
  const selectedProjectId = form.watch("projeto_id");
  const selectedProject = projects.find(p => p.id.toString() === selectedProjectId);

  // Carregar projetos
  useEffect(() => {
    async function loadProjects() {
      try {
        setIsLoadingProjects(true);
        
        const response = await fetch("/api/projects-with-bases", {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include"
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          setProjects(data.data);
        } else {
          throw new Error(data.message || "Erro ao carregar projetos");
        }
      } catch (error) {
        console.error("Erro ao carregar projetos:", error);
        setError("Erro ao carregar a lista de projetos");
      } finally {
        setIsLoadingProjects(false);
      }
    }
    
    loadProjects();
  }, []);

  // Reset base selection when project changes
  useEffect(() => {
    if (selectedProjectId) {
      form.setValue("base_id", "");
    }
  }, [selectedProjectId, form]);
  
  async function onSubmit(values: SolicitacaoValues) {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Get selected base info for legacy compatibility
      const selectedBase = selectedProject?.bases.find(b => b.id.toString() === values.base_id);
      
      // Prepare data with project/base info
      const processedValues = {
        placa: values.placa,
        km: parseInt(values.km.toString()),
        valor_solicitado: parseFloat(values.valor_solicitado.toString()),
        tipo_cartao: values.tipo_cartao,
        provedor_cartao: values.provedor_cartao,
        numero_cartao: values.numero_cartao || "",
        tipo_combustivel: values.tipo_combustivel,
        litros_solicitados: parseFloat(values.litros_solicitados.toString()),
        motorista: values.motorista,
        base: selectedBase?.base_name || "",
        id_rota: selectedBase?.base_code || "",
        observacoes: values.observacoes || "",
        projeto_id: parseInt(values.projeto_id),
        base_id: parseInt(values.base_id)
      };
      
      console.log("Enviando dados da solicitação:", processedValues);
      
      const response = await fetch("/api/fuel-card-solicitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(processedValues)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Erro ao enviar solicitação");
      }
      
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de cartão combustível foi enviada com sucesso.",
      });
      
      // Redirecionar para página de confirmação
      setLocation("/fuel-card/confirmation");
      
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error);
      setError(error instanceof Error ? error.message : "Ocorreu um erro ao enviar sua solicitação");
      
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar sua solicitação. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Solicitação de Cartão Combustível</h1>
        <p className="text-muted-foreground mb-6">Preencha o formulário abaixo para solicitar um cartão de combustível</p>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Dados da Solicitação</CardTitle>
            <CardDescription>
              Informe os dados do veículo e do cartão desejado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="placa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Placa do Veículo</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC1234" {...field} />
                        </FormControl>
                        <FormDescription>
                          Informe a placa do veículo sem traços ou espaços
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="km"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quilometragem Atual</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="123456" {...field} />
                        </FormControl>
                        <FormDescription>
                          KM atual do veículo
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="valor_solicitado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Solicitado (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="150.00" {...field} />
                        </FormControl>
                        <FormDescription>
                          Valor em reais para carregar no cartão
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="tipo_cartao"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Tipo de Cartão</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="placa" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Cartão vinculado à placa do veículo
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="numero" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Cartão específico por número
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o provedor do cartão" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Ticket">Ticket</SelectItem>
                          <SelectItem value="Alelo">Alelo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Empresa que fornece o cartão de combustível
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo_combustivel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Combustível</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de combustível" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="gasolina">Gasolina</SelectItem>
                          <SelectItem value="alcool">Álcool</SelectItem>
                          <SelectItem value="diesel">Diesel</SelectItem>
                          <SelectItem value="arla">Arla</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Tipo de combustível para o veículo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="litros_solicitados"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade de Litros</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          min="0.1"
                          placeholder="Ex: 50.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Quantidade de litros de combustível necessária
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {tipoCartao === "numero" && (
                  <FormField
                    control={form.control}
                    name="numero_cartao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do Cartão</FormLabel>
                        <FormControl>
                          <Input placeholder="1234 5678 9012 3456" {...field} />
                        </FormControl>
                        <FormDescription>
                          Informe o número do cartão de combustível
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="motorista"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Motorista</FormLabel>
                      <FormControl>
                        <Input placeholder="João da Silva" {...field} />
                      </FormControl>
                      <FormDescription>
                        Nome completo do motorista solicitante
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="projeto_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Projeto</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={isLoadingProjects ? "Carregando projetos..." : "Selecione um projeto"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.id.toString()}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Selecione o projeto para esta solicitação
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="base_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!selectedProject || selectedProject.bases.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={
                                !selectedProject 
                                  ? "Selecione um projeto primeiro"
                                  : selectedProject.bases.length === 0 
                                    ? "Nenhuma base disponível"
                                    : "Selecione uma base"
                              } />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedProject?.bases.map((base) => (
                              <SelectItem key={base.id} value={base.id.toString()}>
                                {base.base_name} ({base.base_code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Base onde o veículo está alocado
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Informe detalhes adicionais, se necessário" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <CardFooter className="px-0 flex justify-between">
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => setLocation("/dashboard")}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Solicitar Cartão
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}