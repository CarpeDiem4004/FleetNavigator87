import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Truck, Lock, User } from 'lucide-react';

export default function PartnerLogin() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Usar XMLHttpRequest para evitar interferência do FetchWithAuth
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/partner-simple-auth', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      const data = await new Promise((resolve, reject) => {
        xhr.onload = function() {
          console.log('🎯 Status:', xhr.status);
          console.log('🎯 Response:', xhr.responseText);
          
          if (xhr.status === 200) {
            try {
              const parsed = JSON.parse(xhr.responseText);
              resolve(parsed);
            } catch (parseError) {
              console.error('🎯 Parse Error:', parseError);
              reject(new Error('Erro ao processar resposta'));
            }
          } else {
            reject(new Error(`HTTP ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => reject(new Error('Erro de rede'));
        xhr.send(JSON.stringify(formData));
      });

      console.log('🎯 Dados recebidos:', data);

      if (data && data.success) {
        // Salvar dados do parceiro no localStorage
        localStorage.setItem('partner_data', JSON.stringify(data.partner));
        
        // Redirecionar para painel do parceiro com ID
        setLocation(`/partner/dashboard?id=${data.partner.id}`);
      } else {
        const errorMessage = data?.message || 'Credenciais inválidas. Verifique o nome do parceiro e CPF/CNPJ.';
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Portal do Parceiro
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Acesso exclusivo para parceiros de guincho cadastrados
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Nome do Parceiro
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Digite o nome cadastrado"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  CPF/CNPJ
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite seu CPF ou CNPJ"
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Use o CPF ou CNPJ cadastrado no sistema
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Problemas para acessar?{' '}
                <span className="text-blue-600 font-medium">
                  Entre em contato com o suporte
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            © 2025 Murici Logística - Sistema de Gestão de Frota
          </p>
        </div>
      </div>
    </div>
  );
}