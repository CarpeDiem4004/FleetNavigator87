import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Fuel, CheckCircle, AlertCircle, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface RecebimentoData {
  tipo_produto: string;
  litros_recebidos: number;
  valor_total: number;
  nome_fornecedor: string;
  nome_operador: string;
  observacoes: string;
}

export default function PostoABCV2() {
  const { user } = useAuth();
  const operatorName = user?.name || 'Operador ABC V2';
  
  const [formData, setFormData] = useState<RecebimentoData>({
    tipo_produto: 'diesel',
    litros_recebidos: 0,
    valor_total: 0,
    nome_fornecedor: '',
    nome_operador: operatorName, // Preenchimento automático baseado no usuário logado
    observacoes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  // Atualizar nome do operador quando o usuário mudar
  React.useEffect(() => {
    if (user?.name) {
      setFormData(prev => ({
        ...prev,
        nome_operador: user.name
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/postos-externos/abc-v2/recebimentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Erro ao registrar recebimento');
      }

      setIsSubmitted(true);
      toast({
        title: "Recebimento registrado com sucesso!",
        description: "Os dados foram salvos no sistema.",
      });

      // Reset form
      setFormData({
        tipo_produto: 'diesel',
        litros_recebidos: 0,
        valor_total: 0,
        nome_fornecedor: '',
        nome_operador: operatorName, // Mantém preenchimento automático baseado no usuário logado
        observacoes: ''
      });
    } catch (error) {
      toast({
        title: "Erro ao registrar recebimento",
        description: "Tente novamente ou entre em contato com o suporte.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsSubmitted(false), 3000);
    }
  };

  const handleInputChange = (field: keyof RecebimentoData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Posto ABC V2</h1>
              <p className="text-gray-600">Sistema de Registro de Recebimentos</p>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {isSubmitted && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Recebimento registrado com sucesso! Os dados foram salvos no sistema.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-blue-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Fuel className="w-6 h-6" />
              Registrar Recebimento de Combustível
            </CardTitle>
            <CardDescription className="text-blue-100">
              Preencha os dados do recebimento de combustível no Posto ABC V2
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo de Produto */}
              <div className="space-y-2">
                <Label htmlFor="tipo_produto" className="text-sm font-medium">
                  Tipo de Produto *
                </Label>
                <Select 
                  value={formData.tipo_produto} 
                  onValueChange={(value) => handleInputChange('tipo_produto', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de combustível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="gasolina">Gasolina</SelectItem>
                    <SelectItem value="etanol">Etanol</SelectItem>
                    <SelectItem value="arla32">ARLA 32</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Litros Recebidos */}
              <div className="space-y-2">
                <Label htmlFor="litros_recebidos" className="text-sm font-medium">
                  Litros Recebidos *
                </Label>
                <Input
                  id="litros_recebidos"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 1500.00"
                  value={formData.litros_recebidos || ''}
                  onChange={(e) => handleInputChange('litros_recebidos', parseFloat(e.target.value) || 0)}
                  required
                  className="text-lg"
                />
              </div>

              {/* Valor Total */}
              <div className="space-y-2">
                <Label htmlFor="valor_total" className="text-sm font-medium">
                  Valor Total (R$) *
                </Label>
                <Input
                  id="valor_total"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 7500.00"
                  value={formData.valor_total || ''}
                  onChange={(e) => handleInputChange('valor_total', parseFloat(e.target.value) || 0)}
                  required
                  className="text-lg"
                />
              </div>

              {/* Nome do Fornecedor */}
              <div className="space-y-2">
                <Label htmlFor="nome_fornecedor" className="text-sm font-medium">
                  Nome do Fornecedor *
                </Label>
                <Input
                  id="nome_fornecedor"
                  type="text"
                  placeholder="Ex: Distribuidora de Combustíveis ABC Ltda"
                  value={formData.nome_fornecedor}
                  onChange={(e) => handleInputChange('nome_fornecedor', e.target.value)}
                  required
                  className="text-lg"
                />
              </div>

              {/* Nome do Operador */}
              <div className="space-y-2">
                <Label htmlFor="nome_operador" className="text-sm font-medium">
                  Nome do Operador *
                </Label>
                <Input
                  id="nome_operador"
                  type="text"
                  placeholder="Ex: João Silva"
                  value={formData.nome_operador}
                  onChange={(e) => handleInputChange('nome_operador', e.target.value)}
                  required
                  className="text-lg"
                />
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="observacoes" className="text-sm font-medium">
                  Observações
                </Label>
                <Textarea
                  id="observacoes"
                  placeholder="Informações adicionais sobre o recebimento..."
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Registrando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Registrar Recebimento
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Informações Importantes:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Todos os campos marcados com (*) são obrigatórios</li>
                  <li>• Os dados serão registrados em tempo real no sistema</li>
                  <li>• Em caso de dúvidas, entre em contato com o suporte</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}