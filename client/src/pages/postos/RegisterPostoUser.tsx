import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { createClient } from '@supabase/supabase-js';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function RegisterPostoUser() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Efeito para verificar redirecionamento após registro
  useEffect(() => {
    const redirectUrl = localStorage.getItem('auth_redirect');
    if (!redirectUrl) {
      // Se não houver URL de redirecionamento, definir um padrão
      localStorage.setItem('auth_redirect', '/posto/osasco/public');
    }
  }, []);

  // Atualizar valores do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Registrar novo usuário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validações básicas
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      setIsSubmitting(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Registrar no Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.nome,
            role: 'operador'
          }
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário');
      }

      console.log('Usuário criado no Supabase:', authData.user.id);

      // 2. Registrar no sistema local se configurado
      try {
        // Tenta registrar o usuário na API Express
        const apiResponse = await apiRequest('POST', '/api/register', {
          username: formData.email,
          password: formData.password,
          name: formData.nome,
          role: 'operador',
          supabase_uid: authData.user.id // Vincula com o ID do Supabase
        });

        if (apiResponse.ok) {
          console.log('Usuário registrado com sucesso na API local');
        } else {
          console.warn('Não foi possível registrar usuário na API local, mas o registro no Supabase foi bem-sucedido');
        }
      } catch (apiError) {
        // Se falhar no registro da API, apenas loga o erro
        // O usuário ainda pode prosseguir pois o Supabase já tem o registro
        console.error('Erro ao registrar na API local:', apiError);
      }

      // 3. Loga automaticamente o usuário
      const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (sessionError) {
        throw new Error(sessionError.message);
      }

      if (sessionData.session) {
        // Armazenar token e informações básicas
        localStorage.setItem('access_token', sessionData.session.access_token);
        localStorage.setItem('user_id', authData.user.id);
        localStorage.setItem('user_email', formData.email);
        localStorage.setItem('user_name', formData.nome);
        localStorage.setItem('user_role', 'operador');

        // Notificar sucesso
        toast({
          title: 'Cadastro realizado com sucesso!',
          description: 'Você foi autenticado automaticamente',
        });

        // Redirecionar para a página de origem
        const redirectUrl = localStorage.getItem('auth_redirect') || '/posto/osasco/public';
        navigate(redirectUrl);
      }
    } catch (error: any) {
      console.error('Erro no registro:', error);
      setError(error.message || 'Erro ao criar conta. Tente novamente.');

      toast({
        title: 'Falha no cadastro',
        description: error.message || 'Não foi possível criar sua conta',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Voltar para a página anterior
  const handleGoBack = () => {
    const redirectUrl = localStorage.getItem('auth_redirect') || '/posto/osasco/public';
    navigate(redirectUrl);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoBack}
            className="absolute left-4 top-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <CardTitle className="text-center">Cadastro de Operador</CardTitle>
          <CardDescription className="text-center">
            Crie sua conta para acessar o sistema de postos
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                name="nome"
                placeholder="Seu nome completo"
                value={formData.nome}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu.email@exemplo.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                disabled={isSubmitting}
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500">
                A senha deve ter pelo menos 6 caracteres
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
            </div>
          </form>
        </CardContent>
        
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando conta...
              </>
            ) : (
              'Criar Conta'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}