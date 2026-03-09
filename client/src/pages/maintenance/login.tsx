import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wrench, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMaintenanceAuth } from "@/hooks/use-maintenance-auth";
import { Redirect } from "wouter";

const oficinaLoginSchema = z.object({
  cnpj: z.string().min(14, "CNPJ deve ter pelo menos 14 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres")
});

export default function MaintenanceLogin() {
  const { user, isLoading, login } = useMaintenanceAuth();

  const oficinaForm = useForm<z.infer<typeof oficinaLoginSchema>>({
    resolver: zodResolver(oficinaLoginSchema),
    defaultValues: {
      cnpj: "",
      password: ""
    }
  });

  // Redireciona oficinas já autenticadas
  if (user && !isLoading && user.role === 'oficina') {
    return <Redirect to="/maintenance/dashboard-oficina" />;
  }

  // Redireciona usuários internos para o sistema principal
  if (user && !isLoading && user.role !== 'oficina') {
    return <Redirect to="/" />;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="hidden lg:block">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-600 p-3 rounded-lg">
              <Wrench className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Sistema de Manutenção</h1>
          </div>
          <p className="text-xl text-gray-600 mb-8">
            Gestão Completa de Manutenção Veicular
          </p>
          <p className="text-gray-500 mb-6">
            Controle total sobre ordens de serviço, custos de manutenção e 
            relacionamento com oficinas parceiras.
          </p>
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Para Oficinas</h3>
              </div>
              <p className="text-sm text-gray-600">
                Acesse suas ordens de serviço e atualize status em tempo real
              </p>
            </div>
          </div>
        </div>

        {/* Login Form - Apenas para Oficinas */}
        <Card className="w-full max-w-md mx-auto lg:mx-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Acesso ao Sistema</CardTitle>
            <CardDescription>
              Entre com o CNPJ da sua oficina credenciada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Oficina</span>
              </div>
              <p className="text-sm text-blue-700">
                Entre com o CNPJ da sua oficina credenciada
              </p>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}