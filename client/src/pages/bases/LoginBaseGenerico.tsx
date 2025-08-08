import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Eye, EyeOff, Building2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';

interface BaseInfo {
  id: number;
  name: string;
  location?: string;
  basename?: string;
  operation: string;
}

const LoginBaseGenerico: React.FC = () => {
  const [match, params] = useRoute('/bases/:baseId/login');
  const { loginBase } = useAuth();
  
  const [baseInfo, setBaseInfo] = useState<BaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLogging, setIsLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Pegar parâmetro de redirecionamento da URL
  const urlParams = new URLSearchParams(window.location.search);
  const redirectTo = urlParams.get('redirect');

  useEffect(() => {
    if (match && params?.baseId) {
      fetchBaseInfo(params.baseId);
    }
  }, [match, params?.baseId]);

  const fetchBaseInfo = async (baseId: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('[LoginBaseGenerico] Buscando base:', baseId);

      // Se baseId é um número puro, busca diretamente por ID
      const baseIdNum = parseInt(baseId);
      if (!isNaN(baseIdNum)) {
        const response = await fetch(`/api/bases/${baseIdNum}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          setBaseInfo(data.data);
          console.log('[LoginBaseGenerico] Base encontrada:', data.data.name);
          return;
        }
      }

      // Se não é número ou não encontrou por ID, tenta buscar por basename
      const response = await fetch(`/api/bases?basename=${baseId}`);
      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        const base = data.data[0];
        setBaseInfo(base);
        console.log('[LoginBaseGenerico] Base encontrada por basename:', base.name);
      } else {
        setError(`Base não encontrada: ${baseId}`);
        console.error('[LoginBaseGenerico] Base não encontrada:', baseId);
      }
    } catch (error) {
      console.error('[LoginBaseGenerico] Erro ao buscar base:', error);
      setError('Erro ao carregar informações da base');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!baseInfo) {
      setError('Informações da base não carregadas');
      return;
    }

    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setIsLogging(true);
    setError(null);

    try {
      console.log('[LoginBaseGenerico] Tentando login para base:', baseInfo.name);
      
      const result = await loginBase(formData.email, formData.password, baseInfo.id);
      
      if (result.success) {
        console.log('[LoginBaseGenerico] Login realizado com sucesso');
        
        // REGRA DE OURO: Após login bem-sucedido, vai para onde foi solicitado
        if (redirectTo === 'cartao-combustivel') {
          console.log('[LoginBaseGenerico] Redirecionando para cartão combustível');
          window.location.href = `/bases/${baseInfo.id}/cartao-combustivel`;
        } else {
          console.log('[LoginBaseGenerico] Redirecionando para dashboard da base');
          window.location.href = `/bases/${baseInfo.id}`;
        }
      } else {
        console.error('[LoginBaseGenerico] Erro no login:', result.message);
        setError(result.message || 'Credenciais inválidas. Verifique seu email e senha.');
      }
    } catch (error) {
      console.error('[LoginBaseGenerico] Erro durante login:', error);
      setError('Erro interno. Tente novamente em alguns instantes.');
    } finally {
      setIsLogging(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando informações da base...</p>
        </div>
      </div>
    );
  }

  if (error && !baseInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Erro ao Carregar Base</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-center mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {baseInfo?.name}
          </CardTitle>
          {baseInfo?.location && (
            <p className="text-sm text-gray-600">{baseInfo.location}</p>
          )}
          <p className="text-sm text-blue-600 font-medium">
            {redirectTo === 'cartao-combustivel' ? 'Acesso ao Cartão Combustível' : 'Acesso à Base'}
          </p>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="seu@email.com"
                required
                disabled={isLogging}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Sua senha"
                  required
                  disabled={isLogging}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLogging}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLogging}
            >
              {isLogging ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Murici On Fleet 2.0 - Sistema de Gestão de Frota
            </p>
            {baseInfo?.operation && (
              <p className="text-xs text-blue-600 font-medium mt-1">
                {baseInfo.operation}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginBaseGenerico;