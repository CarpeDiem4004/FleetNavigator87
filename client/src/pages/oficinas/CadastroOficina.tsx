import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FileEdit, CheckCircle2, Upload, MailCheck, Building, User, Phone, Map, Wrench } from "lucide-react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";

// Schema de validação para o formulário de cadastro
const oficinaFormSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  telefone: z.string().min(10, { message: "Telefone deve ter pelo menos 10 dígitos" }),
  endereco: z.string().min(5, { message: "Endereço deve ter pelo menos 5 caracteres" }),
  cidade: z.string().min(2, { message: "Cidade deve ter pelo menos 2 caracteres" }),
  estado: z.string().length(2, { message: "Use a sigla do estado (ex: SP)" }),
  cep: z.string().min(8, { message: "CEP inválido" }).max(9, { message: "CEP inválido" }),
  responsavel: z.string().min(3, { message: "Nome do responsável deve ter pelo menos 3 caracteres" }),
  cnpj: z.string().min(14, { message: "CNPJ deve ter 14 dígitos" }).max(18, { message: "CNPJ inválido" }),
  especialidades: z.string().optional(),
  senha: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
  confirmarSenha: z.string().min(6, { message: "Confirme sua senha" }),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "As senhas não correspondem",
  path: ["confirmarSenha"],
});

// Tipo inferido do schema
type OficinaFormValues = z.infer<typeof oficinaFormSchema>;

export default function CadastroOficina() {
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
      email: "",
      telefone: "",
      endereco: "",
      cidade: "",
      estado: "",
      cep: "",
      responsavel: "",
      cnpj: "",
      especialidades: "",
      senha: "",
      confirmarSenha: "",
    },
  });

  // Função para enviar o formulário
  const onSubmit = async (data: OficinaFormValues) => {
    try {
      setSubmitting(true);
      console.log("Dados do formulário:", data);

      // Requisição para o backend
      const response = await fetch("/api/oficinas/cadastro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: data.nome,
          email: data.email,
          telefone: data.telefone,
          endereco: data.endereco,
          cidade: data.cidade,
          estado: data.estado,
          cep: data.cep,
          responsavel: data.responsavel,
          cnpj: data.cnpj.replace(/[^\d]/g, ""), // Remove caracteres não numéricos
          especialidades: data.especialidades || "Não informado",
          senha: data.senha,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao cadastrar oficina");
      }

      // Sucesso no cadastro
      setCadastroRealizado(true);
      setActiveTab("confirmacao");
      
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Você já pode acessar o sistema com seu email e senha.",
      });
    } catch (error) {
      console.error("Erro ao cadastrar oficina:", error);
      toast({
        title: "Erro no cadastro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar seu cadastro. Tente novamente.",
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

  // Máscara de formatação para CEP
  const formatarCEP = (valor: string) => {
    valor = valor.replace(/\D/g, "");
    
    if (valor.length > 8) {
      valor = valor.slice(0, 8);
    }
    
    // Formata como 00000-000
    if (valor.length > 5) {
      valor = valor.replace(/^(\d{5})(\d)/, "$1-$2");
    }
    
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
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
            <TabsTrigger value="cadastro" disabled={cadastroRealizado}>Cadastro</TabsTrigger>
            <TabsTrigger value="documentos" disabled={!cadastroRealizado}>Documentos</TabsTrigger>
            <TabsTrigger value="confirmacao" disabled={!cadastroRealizado}>Confirmação</TabsTrigger>
          </TabsList>

          <TabsContent value="cadastro">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileEdit className="h-5 w-5 mr-2" />
                  Informações da Oficina
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
                            <FormLabel className="flex items-center">
                              <Building className="h-4 w-4 mr-1 text-gray-500" />
                              Nome da Oficina
                            </FormLabel>
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
                            <FormLabel className="flex items-center">
                              <FileEdit className="h-4 w-4 mr-1 text-gray-500" />
                              CNPJ
                            </FormLabel>
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
                      {/* Email */}
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              <MailCheck className="h-4 w-4 mr-1 text-gray-500" />
                              Email de Contato
                            </FormLabel>
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

                      {/* Telefone */}
                      <FormField
                        control={form.control}
                        name="telefone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              <Phone className="h-4 w-4 mr-1 text-gray-500" />
                              Telefone
                            </FormLabel>
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
                    </div>

                    {/* Endereço */}
                    <FormField
                      control={form.control}
                      name="endereco"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Map className="h-4 w-4 mr-1 text-gray-500" />
                            Endereço Completo
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Rua, número, bairro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-3">
                      {/* Cidade */}
                      <FormField
                        control={form.control}
                        name="cidade"
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

                      {/* Estado */}
                      <FormField
                        control={form.control}
                        name="estado"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <FormControl>
                              <Input placeholder="UF" maxLength={2} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* CEP */}
                      <FormField
                        control={form.control}
                        name="cep"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CEP</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="00000-000" 
                                value={formatarCEP(field.value)}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Responsável */}
                    <FormField
                      control={form.control}
                      name="responsavel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <User className="h-4 w-4 mr-1 text-gray-500" />
                            Nome do Responsável
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Especialidades */}
                    <FormField
                      control={form.control}
                      name="especialidades"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Wrench className="h-4 w-4 mr-1 text-gray-500" />
                            Especialidades
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva as especialidades da sua oficina (ex: mecânica, elétrica, suspensão, etc.)" 
                              className="resize-none min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Descreva os serviços e especialidades que sua oficina oferece
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Senha */}
                      <FormField
                        control={form.control}
                        name="senha"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="******" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Mínimo de 6 caracteres
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Confirmar Senha */}
                      <FormField
                        control={form.control}
                        name="confirmarSenha"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Senha</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="******" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.history.back()}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit"
                        disabled={submitting}
                        className={cn(
                          "min-w-[120px]",
                          submitting ? "opacity-70 cursor-not-allowed" : ""
                        )}
                      >
                        {submitting ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processando...
                          </span>
                        ) : (
                          "Cadastrar Oficina"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Documentos Necessários
                </CardTitle>
                <CardDescription>
                  Envie os documentos necessários para validação do cadastro
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <h3 className="font-medium text-green-800">Cadastro Inicial Concluído!</h3>
                  </div>
                  <p className="text-sm text-green-700 mt-2">
                    Seu cadastro básico foi realizado com sucesso. Agora você pode fazer login no sistema e começar a usar o portal da oficina.
                  </p>
                </div>

                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-medium text-lg">Para completar sua validação, envie os seguintes documentos:</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cnpj-file" className="flex items-center">
                        <FileEdit className="h-4 w-4 mr-2 text-gray-500" />
                        Cartão CNPJ (PDF ou imagem)
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Input id="cnpj-file" type="file" className="max-w-md" />
                        <Button variant="outline" size="sm" type="button">Enviar</Button>
                      </div>
                      <p className="text-sm text-gray-500">Cartão CNPJ emitido no site da Receita Federal</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alvara-file" className="flex items-center">
                        <FileEdit className="h-4 w-4 mr-2 text-gray-500" />
                        Alvará de Funcionamento (PDF ou imagem)
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Input id="alvara-file" type="file" className="max-w-md" />
                        <Button variant="outline" size="sm" type="button">Enviar</Button>
                      </div>
                      <p className="text-sm text-gray-500">Alvará de funcionamento válido emitido pela prefeitura</p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <p className="text-sm text-gray-600">
                      O envio dos documentos é opcional nesta etapa, mas necessário para a validação completa do seu cadastro. 
                      Você pode enviar os documentos agora ou posteriormente pelo Portal da Oficina.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("cadastro")}>
                  Voltar
                </Button>
                <Button onClick={() => setActiveTab("confirmacao")}>
                  Continuar
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="confirmacao">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                  Cadastro Concluído
                </CardTitle>
                <CardDescription>
                  Sua oficina foi cadastrada com sucesso!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-center">Bem-vindo à plataforma!</h2>
                  <p className="text-center text-gray-600 max-w-lg">
                    Seu cadastro foi realizado com sucesso. Agora você pode acessar o sistema e começar a gerenciar manutenções e orçamentos.
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">Próximos Passos:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                    <li>Acesse o sistema com seu email e senha cadastrados</li>
                    <li>Complete seu perfil adicionando mais informações sobre sua oficina</li>
                    <li>Envie os documentos solicitados para validação completa</li>
                    <li>Explore o sistema e comece a receber solicitações de orçamento</li>
                  </ol>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = "/login"}
                >
                  Ir para Login
                </Button>
                <Button 
                  onClick={() => setLocation("/oficinas/onboarding")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Tutorial Inicial
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}