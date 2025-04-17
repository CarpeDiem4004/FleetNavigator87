import { useState } from 'react';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoaderCircle, LogIn, Mail, Lock } from 'lucide-react';

// Esquema de validação para o formulário de login
const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido' }),
  password: z.string().min(4, { message: 'A senha deve ter pelo menos 4 caracteres' }),
});

export default function LoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [location] = useLocation();

  // Obtenha o parâmetro de redirecionamento da URL, se existir
  const params = new URLSearchParams(location.split('?')[1]);
  const redirectTo = params.get('redirectTo') || '/';

  // Configuração do formulário com validação
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Função para lidar com o envio do formulário
  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      setIsLoading(true);
      
      // Tentativa de login
      await login(values.email, values.password);
      
      // Se o login for bem-sucedido, redirecionar para a página principal ou para onde o usuário tentou acessar
      toast({
        title: 'Login bem-sucedido',
        description: 'Bem-vindo ao sistema de gerenciamento de frotas',
      });
      
      navigate(redirectTo);
    } catch (error) {
      console.error('Erro no login:', error);
      // Já exibimos o toast no hook useAuth em caso de erro
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-primary/5">
      <div className="grid gap-8 md:grid-cols-2 max-w-5xl w-full shadow-xl rounded-xl overflow-hidden bg-white">
        {/* Formulário de login */}
        <Card className="shadow-none border-0 rounded-none">
          <CardHeader className="pt-10 pb-6">
            <div className="w-full flex justify-center mb-6">
              <LogIn className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Acesso ao Sistema</CardTitle>
            <CardDescription className="text-center">
              Digite suas credenciais para acessar o sistema de gerenciamento de frotas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="seu.email@exemplo.com" 
                            className="pl-9" 
                            {...field} 
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            className="pl-9" 
                            {...field} 
                            disabled={isLoading}
                          />
                        </div>
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
                  {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="px-6 py-4 flex flex-col items-center">
            <div className="text-sm text-muted-foreground mt-4">
              <p>Para acesso de demonstração, use:</p>
              <p className="text-muted-foreground"><strong>Email:</strong> admin@muricionfleet.com</p>
              <p className="text-muted-foreground"><strong>Senha:</strong> admin123</p>
            </div>
          </CardFooter>
        </Card>

        {/* Seção informativa */}
        <div className="hidden md:block bg-primary text-white p-8 flex flex-col justify-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Muricion Fleet Management</h2>
            <p className="text-primary-foreground/90">
              Sistema completo para controle e gerenciamento de frotas, manutenção de veículos, 
              abastecimento e controle de pátio.
            </p>
            <ul className="space-y-2 mt-6">
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-white mr-2"></div>
                <span>Gerenciamento de veículos e bases</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-white mr-2"></div>
                <span>Manutenções preventivas e corretivas</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-white mr-2"></div>
                <span>Controle de abastecimento</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-white mr-2"></div>
                <span>Gestão de pneus e multas</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-white mr-2"></div>
                <span>Operações de pátio</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}