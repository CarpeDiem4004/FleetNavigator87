import React, { useState, useEffect } from 'react';
import { useLocation, useRoute, useRouter } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, TruckIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  POSTO_OSASCO, POSTO_GUARULHOS, POSTO_SAOPAULO, POSTO_CAMPINAS,
  POSTO_ABC, POSTO_SOCORRO, POSTO_SOROCABA,
  NOME_POSTO_OSASCO, NOME_POSTO_GUARULHOS, NOME_POSTO_SAOPAULO, NOME_POSTO_CAMPINAS,
  NOME_POSTO_ABC, NOME_POSTO_SOCORRO, NOME_POSTO_SOROCABA
} from '@/constants/postos';

const SENHA_PADRAO = 'murici@2025';

interface PostoInfo {
  code: string;
  name: string;
  email: string;
}

const PostoLoginPage: React.FC = () => {
  const [, params] = useRoute('/posto/:postoCode');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [postoInfo, setPostoInfo] = useState<PostoInfo | null>(null);
  const [password, setPassword] = useState('');

  // Mapear códigos de posto para nomes e emails
  const postosMap: Record<string, PostoInfo> = {
    [POSTO_OSASCO]: { code: POSTO_OSASCO, name: NOME_POSTO_OSASCO, email: `${POSTO_OSASCO}@muricionfleet.com` },
    [POSTO_GUARULHOS]: { code: POSTO_GUARULHOS, name: NOME_POSTO_GUARULHOS, email: `${POSTO_GUARULHOS}@muricionfleet.com` },
    [POSTO_SAOPAULO]: { code: POSTO_SAOPAULO, name: NOME_POSTO_SAOPAULO, email: `${POSTO_SAOPAULO}@muricionfleet.com` },
    [POSTO_CAMPINAS]: { code: POSTO_CAMPINAS, name: NOME_POSTO_CAMPINAS, email: `${POSTO_CAMPINAS}@muricionfleet.com` },
    [POSTO_ABC]: { code: POSTO_ABC, name: NOME_POSTO_ABC, email: `${POSTO_ABC}@muricionfleet.com` },
    [POSTO_SOCORRO]: { code: POSTO_SOCORRO, name: NOME_POSTO_SOCORRO, email: `${POSTO_SOCORRO}@muricionfleet.com` },
    [POSTO_SOROCABA]: { code: POSTO_SOROCABA, name: NOME_POSTO_SOROCABA, email: `${POSTO_SOROCABA}@muricionfleet.com` },
  };

  useEffect(() => {
    console.log("PostoLoginPage: Params recebidos:", params);
    
    if (user) {
      // Se o usuário já estiver autenticado, redirecionar para a página do posto
      const postoCode = params?.postoCode;
      console.log("PostoLoginPage: Usuário autenticado, redirecionando. postoCode:", postoCode);
      
      if (postoCode && postosMap[postoCode]) {
        console.log(`PostoLoginPage: Redirecionando para dashboard do posto ${postoCode}`);
        setLocation(`/posto/${postoCode}/dashboard`);
      } else {
        console.log("PostoLoginPage: Posto não encontrado ou inválido, redirecionando para home");
        setLocation('/');
      }
    } else {
      const postoCode = params?.postoCode;
      console.log("PostoLoginPage: Usuário não autenticado, preparando formulário. postoCode:", postoCode);
      
      if (postoCode && postosMap[postoCode]) {
        console.log(`PostoLoginPage: Configurando formulário para posto ${postoCode}`);
        setPostoInfo(postosMap[postoCode]);
        setPassword(SENHA_PADRAO); // Pré-preencher a senha padrão
      } else {
        console.log("PostoLoginPage: Posto inválido ou não encontrado:", postoCode);
        toast({
          title: "Posto não encontrado",
          description: "O código do posto especificado não é válido.",
          variant: "destructive",
        });
        setLocation('/');
      }
    }
  }, [user, params, postosMap, setLocation, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!postoInfo) {
      toast({
        title: "Erro",
        description: "Informações do posto não estão disponíveis.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login(postoInfo.email, password);
      
      toast({
        title: "Login bem-sucedido",
        description: `Bem-vindo ao posto ${postoInfo.name}!`,
      });
      
      setLocation(`/posto/${postoInfo.code}/dashboard`);
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      
      toast({
        title: "Falha no login",
        description: "Credenciais inválidas. Verifique sua senha e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!postoInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto bg-primary-100 p-3 rounded-full">
            <TruckIcon className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Posto {postoInfo.name}
          </CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={postoInfo.email}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default PostoLoginPage;