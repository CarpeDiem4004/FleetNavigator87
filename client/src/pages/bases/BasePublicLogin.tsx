import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, Building2, Truck, AlertCircle } from 'lucide-react';

interface BaseInfo {
  id: number;
  name: string;
  location?: string;
}

export default function BasePublicLogin() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/bases/:baseId/public/login');
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [baseInfo, setBaseInfo] = useState<BaseInfo | null>(null);
  const [loadingBase, setLoadingBase] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const baseId = params?.baseId;

  useEffect(() => {
    if (baseId) {
      fetchBaseInfo(baseId);
    }
  }, [baseId]);

  const fetchBaseInfo = async (id: string) => {
    try {
      setLoadingBase(true);
      const response = await fetch(`/api/public/bases/${id}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setBaseInfo(data.data);
      } else {
        setError('Base não encontrada');
      }
    } catch (err) {
      console.error('Erro ao buscar informações da base:', err);
      setError('Erro ao carregar informações da base');
    } finally {
      setLoadingBase(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha email e senha',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/base-auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          baseId: parseInt(baseId || '0'),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Login realizado com sucesso!',
          description: `Bem-vindo à ${baseInfo?.name || 'base'}`,
        });
        
        localStorage.setItem('base_auth_token', data.token);
        localStorage.setItem('base_user', JSON.stringify(data.user));
        localStorage.setItem('base_id', baseId || '');
        
        setLocation(`/bases/${baseId}/public`);
      } else {
        setError(data.message || 'Erro ao fazer login');
        toast({
          title: 'Erro no login',
          description: data.message || 'Verifique suas credenciais',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      setError('Erro de conexão. Tente novamente.');
      toast({
        title: 'Erro de conexão',
        description: 'Não foi possível conectar ao servidor',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingBase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-gray-300">Carregando informações da base...</p>
        </div>
      </div>
    );
  }

  if (!baseInfo && !loadingBase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-red-500/30">
          <CardHeader className="text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-400" />
            <CardTitle className="text-2xl text-white">Base não encontrada</CardTitle>
            <CardDescription className="text-gray-300">
              A base solicitada não existe ou está indisponível.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="border-gray-500 text-gray-300 hover:bg-gray-800"
            >
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJjLTIgMC00IDItNCAyczItNCAyLTQtMiAyLTQgMmMtMiAwLTQgMi00IDJzMiA0IDIgNGMwIDItMiA0LTIgNHMyIDIgNCAyYzIgMCA0LTIgNC0ycy0yIDQtMiA0YzAgMiAyIDQgMiA0czItMiA0LTJjMiAwIDQtMiA0LTJzLTItNC0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
      
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Truck className="h-8 w-8 text-blue-400" />
            <span className="text-xl tracking-tight">
              <span className="font-bold text-white">Murici</span>
              <span className="font-light text-blue-300 ml-1">On Fleet</span>
              <span className="font-light text-blue-400/70 text-sm ml-1">2.0</span>
            </span>
          </div>
          
          <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-lg p-4 border border-blue-500/30">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Building2 className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-blue-300 uppercase tracking-wider font-medium">
                Acesso Externo
              </span>
            </div>
            <CardTitle className="text-xl text-white">
              {baseInfo?.name}
            </CardTitle>
            {baseInfo?.location && (
              <CardDescription className="text-gray-400 text-sm mt-1">
                {baseInfo.location}
              </CardDescription>
            )}
          </div>

          <div className="flex items-center gap-2 justify-center">
            <Lock className="h-4 w-4 text-amber-400" />
            <p className="text-amber-400/90 text-sm">
              Área restrita - Login obrigatório
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-blue-500"
                disabled={isLoading}
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-blue-500"
                disabled={isLoading}
                data-testid="input-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-5"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Entrar
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Sistema exclusivo para operadores autorizados.
              <br />
              Contate o administrador para obter acesso.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="absolute bottom-4 text-center w-full">
        <p className="text-xs text-gray-600">
          Murici On Fleet 2.0 | Gestão de Frotas
        </p>
      </div>
    </div>
  );
}
