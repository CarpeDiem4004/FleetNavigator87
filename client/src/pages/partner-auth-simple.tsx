import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Truck, Lock, User } from 'lucide-react';

export default function PartnerAuthSimple() {
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
      // Solução alternativa: fazer requisição direta sem fetch wrapper
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/partner/login', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      xhr.onload = function() {
        console.log('🎯 XHR Response Status:', xhr.status);
        console.log('🎯 XHR Response Text:', xhr.responseText);
        
        setLoading(false);
        
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            console.log('🎯 Parsed Data:', data);
            
            if (data.success) {
              // Salvar dados do parceiro
              localStorage.setItem('partner_data', JSON.stringify(data.partner));
              
              // Redirecionar para painel
              setLocation(`/partner/dashboard/${data.partner.id}`);
            } else {
              setError(data.message || 'Erro no login');
            }
          } catch (parseError) {
            console.error('🎯 Erro ao fazer parse:', parseError);
            setError('Erro na resposta do servidor');
          }
        } else {
          setError('Erro de conexão com o servidor');
        }
      };
      
      xhr.onerror = function() {
        setLoading(false);
        setError('Erro de rede');
      };
      
      xhr.send(JSON.stringify(formData));
      
    } catch (error) {
      console.error('🎯 Erro geral:', error);
      setLoading(false);
      setError('Erro inesperado');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Portal do Parceiro
            </CardTitle>
            <CardDescription className="text-gray-600">
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
              <Label htmlFor="name" className="text-sm font-medium">
                Nome do Parceiro
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Digite seu nome completo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                CPF/CNPJ
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10"
                  required
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
            <p className="text-sm text-gray-500">
              Problemas para acessar?{' '}
              <a href="mailto:suporte@muricilogistica.com" className="text-blue-600 hover:underline">
                Entre em contato com o suporte
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="fixed bottom-4 left-4 text-xs text-gray-500">
        © 2025 Murici Logística - Sistema de Gestão de Frota
      </div>
    </div>
  );
}