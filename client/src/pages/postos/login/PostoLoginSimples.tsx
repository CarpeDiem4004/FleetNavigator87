import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type PostoLoginParams = {
  postoCode: string;
};

// Mapeamento de códigos para nomes dos postos
const postoNomes: Record<string, string> = {
  osasco: 'Osasco',
  guarulhos: 'Guarulhos',
  saopaulo: 'São Paulo',
  campinas: 'Campinas',
  abc: 'ABC',
  socorro: 'Socorro',
  sorocaba: 'Sorocaba'
};

const PostoLoginSimples: React.FC = () => {
  const params = useParams<PostoLoginParams>();
  const postoCode = params.postoCode?.toLowerCase() || '';
  const postoNome = postoNomes[postoCode] || postoCode.toUpperCase();
  
  const [_, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!postoCode) {
      toast({
        title: "Erro",
        description: "Código do posto não identificado",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Usando o código do posto como nome de usuário
      await login(postoCode, senha);
      
      // Se o login for bem-sucedido, redireciona para o dashboard do posto
      navigate(`/posto/${postoCode}/dashboard`);
      
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo ao sistema do posto ${postoNome}`,
      });
    } catch (error) {
      console.error("Erro no login:", error);
      toast({
        title: "Falha no login",
        description: "Senha incorreta. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-accent/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Posto {postoNome}</CardTitle>
          <CardDescription>
            Digite a senha para acessar o sistema de abastecimento
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default PostoLoginSimples;