import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wrench, Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMaintenanceAuth } from "@/hooks/use-maintenance-auth";
import { Redirect } from "wouter";

const oficinaLoginSchema = z.object({
  cnpj: z.string().min(14, "CNPJ deve ter pelo menos 14 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres")
});

const internalLoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres")
});

export default function MaintenanceLogin() {
  const { user, isLoading, login } = useMaintenanceAuth();
  const [activeTab, setActiveTab] = useState("oficina");

  const oficinaForm = useForm<z.infer<typeof oficinaLoginSchema>>({
    resolver: zodResolver(oficinaLoginSchema),
    defaultValues: {
      cnpj: "",
      password: ""
    }
  });

  const internalForm = useForm<z.infer<typeof internalLoginSchema>>({
    resolver: zodResolver(internalLoginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  if (user) {
    return <Redirect to="/maintenance/dashboard" />;
  }

  const onOficinaSubmit = async (values: z.infer<typeof oficinaLoginSchema>) => {
    const success = await login({
      cnpj: values.cnpj,
      password: values.password
    });
    
    if (success) {
      // Redirect será feito automaticamente pelo useMaintenanceAuth
    }
  };

  const onInternalSubmit = async (values: z.infer<typeof internalLoginSchema>) => {
    const success = await login({
      email: values.email,
      password: values.password
    });
    
    if (success) {
      // Redirect será feito automaticamente pelo useMaintenanceAuth
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="text-center lg:text-left space-y-6">
          <div className="flex items-center justify-center lg:justify-start space-x-3">
            <div className="bg-blue-600 p-3 rounded-lg">
              <Wrench className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Sistema de Manutenção
            </h1>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              Gestão Completa de Manutenção Veicular
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Controle total sobre ordens de serviço, custos de manutenção e relacionamento com oficinas parceiras.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <Building2 className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-800">Para Oficinas</h3>
              <p className="text-sm text-gray-600">
                Acesse suas ordens de serviço e atualize status em tempo real
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <User className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-800">Gestão Interna</h3>
              <p className="text-sm text-gray-600">
                Controle completo de veículos, oficinas e relatórios
              </p>
            </div>
          </div>
        </div>

        {/* Login Forms */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Acesso ao Sistema</CardTitle>
            <CardDescription>
              Escolha seu tipo de acesso abaixo
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="oficina" className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4" />
                  <span>Oficina</span>
                </TabsTrigger>
                <TabsTrigger value="internal" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Interno</span>
                </TabsTrigger>
              </TabsList>

              {/* Login para Oficinas */}
              <TabsContent value="oficina" className="space-y-4">
                <div className="text-center text-sm text-gray-600 mb-4">
                  Entre com o CNPJ da sua oficina credenciada
                </div>
                
                <Form {...oficinaForm}>
                  <form onSubmit={oficinaForm.handleSubmit(onOficinaSubmit)} className="space-y-4">
                    <FormField
                      control={oficinaForm.control}
                      name="cnpj"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNPJ da Oficina</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="00.000.000/0000-00"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={oficinaForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Digite sua senha"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Entrando..." : "Entrar como Oficina"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Login para Usuários Internos */}
              <TabsContent value="internal" className="space-y-4">
                <div className="text-center text-sm text-gray-600 mb-4">
                  Acesso restrito para equipe Murici
                </div>
                
                <Form {...internalForm}>
                  <form onSubmit={internalForm.handleSubmit(onInternalSubmit)} className="space-y-4">
                    <FormField
                      control={internalForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="seu@email.com"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={internalForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Digite sua senha"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Entrando..." : "Entrar no Sistema"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}