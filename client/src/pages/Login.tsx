import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'E-mail inválido' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, isLoading } = useAuth();
  const [_, navigate] = useLocation();

  // Efeito para redirecionar se já estiver logado
  useEffect(() => {
    if (user && !isLoading) {
      console.log("Login: usuário já autenticado, redirecionando para /");
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    console.log("Tentando fazer login com:", data.email);
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      console.log("Login bem-sucedido, redirecionando...");
      navigate('/');
    } catch (error) {
      console.error('Login falhou:', error);
      // O toast error já é mostrado no contexto de autenticação
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Sistema de Gestão de Frotas
          </CardTitle>
          <CardDescription className="text-center">
            Entre com suas credenciais para acessar o sistema
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
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="seu.email@exemplo.com" 
                        type="email" 
                        autoComplete="email"
                        disabled={isSubmitting} 
                        {...field} 
                      />
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
                      <Input 
                        placeholder="Sua senha" 
                        type="password" 
                        autoComplete="current-password"
                        disabled={isSubmitting} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="text-sm text-gray-600 my-2">
                <p>Para testar login como admin:</p>
                <ul className="list-disc pl-5 text-xs">
                  <li>Email: admin@muricionfleet.com</li>
                  <li>Senha: MuricionAdmin2025</li>
                </ul>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center">
            Não tem uma conta? <Link href="/register" className="text-primary hover:underline">Cadastre-se</Link>
          </div>
          <p className="text-xs text-center text-gray-500">
            Este é um sistema de gerenciamento de frota desenvolvido para fins de demonstração.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}