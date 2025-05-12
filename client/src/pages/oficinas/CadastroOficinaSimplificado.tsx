import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, CheckCircle2, User, Phone, Map, LandmarkIcon, BadgeCheck } from "lucide-react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Schema de validação para o formulário de cadastro
const oficinaFormSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  cnpj: z.string().min(14, { message: "CNPJ deve ter 14 dígitos" }).max(18, { message: "CNPJ inválido" }),
  telefone: z.string().min(10, { message: "Telefone deve ter pelo menos 10 dígitos" }),
  email: z.string().email({ message: "Email inválido" }),
  endereco: z.string().min(5, { message: "Endereço deve ter pelo menos 5 caracteres" }),
  ramoAtuacao: z.string().min(2, { message: "Informe o ramo de atuação" }),
  banco: z.string().min(2, { message: "Informe o banco" }),
  agencia: z.string().min(2, { message: "Informe a agência" }),
  conta: z.string().min(2, { message: "Informe o número da conta" }),
  tipoConta: z.string().min(1, { message: "Selecione o tipo de conta" }),
});

// Tipo inferido do schema
type OficinaFormValues = z.infer<typeof oficinaFormSchema>;

/**
 * Página de cadastro simplificado de oficina 
 * Esta página também serve como ponto de acesso alternativo para oficinas quando 
 * a rota /oficina não estiver funcionando corretamente
 */
export default function CadastroOficinaSimplificado() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("cadastro");
  const [submitting, setSubmitting] = useState(false);
  const [cadastroRealizado, setCadastroRealizado] = useState(false);

  // Form com validação do Zod
  const form = useForm<OficinaFormValues>({
    resolver: zodResolver(oficinaFormSchema),
    defaultValues: {
      nome: "",
      cnpj: "",
      telefone: "",
      email: "",
      endereco: "",
      ramoAtuacao: "",
      banco: "",
      agencia: "",
      conta: "",
      tipoConta: "",
    },
  });

  // Função para enviar o formulário
  const onSubmit = async (data: OficinaFormValues) => {
    try {
      setSubmitting(true);
      console.log("Dados do formulário:", data);

      // Envio dos dados para o backend
      const response = await fetch('/api/workshops/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        // Tentar obter a mensagem de erro do servidor
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `Erro no cadastro: ${response.status}`);
        } catch (parseError) {
          // Se não conseguir analisar a resposta JSON, usar mensagem genérica
          throw new Error(`Erro no cadastro: ${response.status}`);
        }
      }
      
      const result = await response.json();
      
      // Sucesso no cadastro
      setCadastroRealizado(true);
      setActiveTab("confirmacao");
      
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Seus dados foram registrados. A análise será feita em breve pela equipe de gestão de frotas.",
      });
    } catch (error) {
      console.error("Erro ao cadastrar oficina:", error);
      // Verificar se a mensagem de erro é sobre CNPJ duplicado
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro ao processar seu cadastro.";
      const isDuplicateCNPJ = errorMessage.includes("CNPJ") && errorMessage.includes("exist");
      
      toast({
        title: isDuplicateCNPJ ? "CNPJ já cadastrado" : "Erro no cadastro",
        description: isDuplicateCNPJ 
          ? "Este CNPJ já está registrado no sistema. Se você já possui cadastro, entre em contato com a central de atendimento."
          : errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Máscara de formatação para CNPJ
  const formatarCNPJ = (valor: string) => {
    valor = valor.replace(/\D/g, "");
    
    if (valor.length > 14) {
      valor = valor.slice(0, 14);
    }
    
    // Formata como 00.000.000/0000-00
    valor = valor.replace(/^(\d{2})(\d)/, "$1.$2");
    valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    valor = valor.replace(/\.(\d{3})(\d)/, ".$1/$2");
    valor = valor.replace(/(\d{4})(\d)/, "$1-$2");
    
    return valor;
  };

  // Máscara de formatação para telefone
  const formatarTelefone = (valor: string) => {
    valor = valor.replace(/\D/g, "");
    
    if (valor.length > 11) {
      valor = valor.slice(0, 11);
    }
    
    // Formata como (00) 00000-0000 ou (00) 0000-0000
    if (valor.length > 2) {
      valor = valor.replace(/^(\d{2})(\d)/, "($1) $2");
    }
    
    if (valor.length > 10) {
      valor = valor.replace(/(\d{5})(\d)/, "$1-$2");
    } else if (valor.length > 6) {
      valor = valor.replace(/(\d{4})(\d)/, "$1-$2");
    }
    
    return valor;
  };

  return (
    <div className="container mx-auto py-8 px-4 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Building className="h-12 w-12 mx-auto text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold">Cadastro de Oficina</h1>
          <p className="text-gray-600 mt-2">
            Preencha o formulário abaixo para se cadastrar como oficina parceira
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
            <TabsTrigger value="cadastro" disabled={cadastroRealizado}>Cadastro</TabsTrigger>
            <TabsTrigger value="confirmacao" disabled={!cadastroRealizado}>Confirmação</TabsTrigger>
          </TabsList>

          <TabsContent value="cadastro">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Dados da Oficina
                </CardTitle>
                <CardDescription>
                  Forneça os dados cadastrais da sua oficina
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Nome da Oficina */}
                      <FormField
                        control={form.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome da Oficina *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome completo da oficina" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* CNPJ */}
                      <FormField
                        control={form.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNPJ</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="00.000.000/0000-00" 
                                value={formatarCNPJ(field.value)}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Telefone */}
                      <FormField
                        control={form.control}
                        name="telefone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="(00) 00000-0000" 
                                value={formatarTelefone(field.value)}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Email */}
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="email@oficina.com.br" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Endereço */}
                    <FormField
                      control={form.control}
                      name="endereco"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço</FormLabel>
                          <FormControl>
                            <Input placeholder="Rua, número, bairro, cidade, estado" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Ramo de Atuação */}
                    <FormField
                      control={form.control}
                      name="ramoAtuacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ramo de Atuação</FormLabel>
                          <FormControl>
                            <Input placeholder="Mecânica, Elétrica, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <CardTitle className="text-lg mt-6 mb-2">Dados Bancários</CardTitle>

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Banco */}
                      <FormField
                        control={form.control}
                        name="banco"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Banco</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome do banco" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Agência */}
                      <FormField
                        control={form.control}
                        name="agencia"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Agência</FormLabel>
                            <FormControl>
                              <Input placeholder="Número da agência" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Conta */}
                      <FormField
                        control={form.control}
                        name="conta"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Conta</FormLabel>
                            <FormControl>
                              <Input placeholder="Número da conta" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Tipo de Conta */}
                      <FormField
                        control={form.control}
                        name="tipoConta"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Conta</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="corrente">Corrente</SelectItem>
                                <SelectItem value="poupanca">Poupança</SelectItem>
                                <SelectItem value="conjunta">Conjunta</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => form.reset()}
                      >
                        Limpar Formulário
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={submitting}
                      >
                        {submitting ? "Enviando..." : "Enviar Cadastro"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="confirmacao">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
                  Cadastro Recebido
                </CardTitle>
                <CardDescription>
                  Seu cadastro foi recebido com sucesso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-6">
                  <CheckCircle2 className="h-16 w-16 mx-auto text-green-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Obrigado por se cadastrar!</h3>
                  <p className="text-gray-600 mb-6">
                    Recebemos sua solicitação de cadastro. Em breve entraremos em contato para continuar o processo 
                    e fornecer as informações para acesso ao sistema.
                  </p>
                  <h4 className="font-medium text-lg mb-2">Próximos passos:</h4>
                  <ol className="text-left space-y-2 mb-6">
                    <li className="flex items-start">
                      <BadgeCheck className="h-5 w-5 mr-2 text-green-600 mt-0.5" />
                      <span>Análise inicial dos dados fornecidos</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-5 w-5 mr-2 flex items-center justify-center rounded-full bg-gray-200 text-xs font-bold">2</span>
                      <span>Contato para confirmação de dados e envio de documentação</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-5 w-5 mr-2 flex items-center justify-center rounded-full bg-gray-200 text-xs font-bold">3</span>
                      <span>Criação de acesso ao sistema e envio de credenciais</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-5 w-5 mr-2 flex items-center justify-center rounded-full bg-gray-200 text-xs font-bold">4</span>
                      <span>Início das operações como oficina parceira</span>
                    </li>
                  </ol>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button 
                  onClick={() => setLocation("/")}
                  variant="outline"
                  className="mr-2"
                >
                  Voltar para a página inicial
                </Button>
                <Button 
                  onClick={() => window.location.href = "/contato"}
                >
                  Fale Conosco
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}