import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Truck, FileText, Clock } from 'lucide-react';

export default function PartnerAccess() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    cnpj: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🎯 Enviando dados para /partner-login:', formData);

      // Usar XMLHttpRequest direto para evitar middleware
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/partner-login', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      const response = await new Promise((resolve, reject) => {
        xhr.onload = function() {
          console.log('🎯 Status Response:', xhr.status);
          console.log('🎯 Response Text:', xhr.responseText);
          
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (parseError) {
              console.error('🎯 Erro parsing JSON:', parseError);
              reject(new Error('Erro na resposta do servidor'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.message || 'Erro de autenticação'));
            } catch {
              reject(new Error(`Erro HTTP ${xhr.status}`));
            }
          }
        };
        
        xhr.onerror = () => reject(new Error('Erro de conexão'));
        xhr.send(JSON.stringify(formData));
      });

      console.log('🎯 Login bem-sucedido:', response);
      
      // Salvar dados do parceiro
      localStorage.setItem('partner_session', JSON.stringify(response));
      
      // Redirecionar para dashboard do parceiro
      setLocation('/partner/dashboard');

    } catch (error: any) {
      console.error('🎯 Erro no login:', error);
      setError(error.message || 'Erro no login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8">
        {/* Formulário de Login */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Acesso Parceiros</CardTitle>
            <CardDescription>
              Entre com suas credenciais para acessar seus serviços
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Parceiro</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Digite o nome exato do parceiro"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value.replace(/\D/g, '') }))}
                  placeholder="Digite apenas os números do CNPJ"
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

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
                  'Entrar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Painel Informativo */}
        <div className="space-y-6">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Portal de Parceiros
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Gerencie seus serviços de guincho e acompanhe solicitações em tempo real
            </p>
          </div>

          <div className="grid gap-4">
            <div className="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-sm">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Gerenciar Serviços</h3>
                <p className="text-gray-600">Visualize e atualize o status dos seus serviços de guincho</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-sm">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Acompanhamento Real</h3>
                <p className="text-gray-600">Receba notificações e atualize serviços em tempo real</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-sm">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Truck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Histórico Completo</h3>
                <p className="text-gray-600">Acesse o histórico completo de todos os seus serviços</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Credenciais de Teste</h4>
            <p className="text-blue-700 text-sm mb-2">
              <strong>Nome:</strong> Allan de Souza Vieira<br />
              <strong>CNPJ:</strong> 12345678000190
            </p>
            <p className="text-blue-600 text-xs">
              Use estas credenciais para testar o sistema
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}