import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Fuel, TruckIcon, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RecebimentoData {
  tipo_produto: string;
  litros_recebidos: string;
  valor_total: string;
  nome_fornecedor: string;
  nome_operador: string;
  numero_nota_fiscal: string;
  observacoes: string;
}

export default function PostoCampinasV2() {
  const [formData, setFormData] = useState<RecebimentoData>({
    tipo_produto: '',
    litros_recebidos: '',
    valor_total: '',
    nome_fornecedor: '',
    nome_operador: '',
    numero_nota_fiscal: '',
    observacoes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [valorPorLitro, setValorPorLitro] = useState<string>('');
  const { toast } = useToast();

  // Calcular valor por litro automaticamente
  React.useEffect(() => {
    const litros = parseFloat(formData.litros_recebidos);
    const total = parseFloat(formData.valor_total);
    if (litros > 0 && total > 0) {
      const valorLitro = total / litros;
      setValorPorLitro(valorLitro.toFixed(4));
    } else {
      setValorPorLitro('');
    }
  }, [formData.litros_recebidos, formData.valor_total]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/postos-externos/campinas-v2/recebimentos', {
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
        tipo_produto: '',
        litros_recebidos: '',
        valor_total: '',
        nome_fornecedor: '',
        nome_operador: '',
        numero_nota_fiscal: '',
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

  const handleInputChange = (field: keyof RecebimentoData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Posto Campinas V2</h1>
              <p className="text-gray-600">Sistema de Registro de Operações</p>
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

        {/* Card Principal */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-white border-b">
            <CardTitle className="text-xl font-bold text-gray-900">Registrar Operações</CardTitle>
            <CardDescription className="text-gray-600">
              Selecione o tipo de operação que deseja registrar
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-0">
            <Tabs defaultValue="recebimento" className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-none bg-gray-100">
                <TabsTrigger 
                  value="abastecimento" 
                  className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                  disabled
                >
                  <Fuel className="w-4 h-4" />
                  Abastecimento
                </TabsTrigger>
                <TabsTrigger 
                  value="recebimento" 
                  className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                >
                  <TruckIcon className="w-4 h-4" />
                  Recebimento
                </TabsTrigger>
                <TabsTrigger 
                  value="controle" 
                  className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                  disabled
                >
                  <Building2 className="w-4 h-4" />
                  Controle de Pátio
                </TabsTrigger>
              </TabsList>

              <TabsContent value="recebimento" className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-6">
                    <TruckIcon className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Recebimento de Combustível no Tanque
                    </h2>
                  </div>
                  <p className="text-sm text-gray-600 mb-6">
                    Registre o recebimento de combustível no tanque do posto campinas_v2.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Tipo de Produto */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Tipo de Produto Recebido
                        </Label>
                        <Select 
                          value={formData.tipo_produto} 
                          onValueChange={(value) => handleInputChange('tipo_produto', value)}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Selecione o produto" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="diesel">Diesel</SelectItem>
                            <SelectItem value="gasolina_comum">Gasolina Comum</SelectItem>
                            <SelectItem value="gasolina_aditivada">Gasolina Aditivada</SelectItem>
                            <SelectItem value="etanol">Etanol</SelectItem>
                            <SelectItem value="arla32">ARLA 32</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">Selecione o tipo de produto recebido</p>
                      </div>

                      {/* Quantidade Recebida */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Quantidade Recebida (Litros)
                        </Label>
                        <Input
                          type="text"
                          placeholder="1000"
                          value={formData.litros_recebidos}
                          onChange={(e) => handleInputChange('litros_recebidos', e.target.value)}
                          required
                          className="h-12"
                        />
                        <p className="text-xs text-gray-500">Digite a quantidade em litros</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Valor Total */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Valor Total (R$)
                        </Label>
                        <Input
                          type="text"
                          placeholder="5000,00"
                          value={formData.valor_total}
                          onChange={(e) => handleInputChange('valor_total', e.target.value)}
                          required
                          className="h-12"
                        />
                        <p className="text-xs text-gray-500">Digite o valor total da compra</p>
                      </div>

                      {/* Número da Nota Fiscal */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Número da Nota Fiscal
                        </Label>
                        <Input
                          type="text"
                          placeholder="NF123456"
                          value={formData.numero_nota_fiscal}
                          onChange={(e) => handleInputChange('numero_nota_fiscal', e.target.value)}
                          required
                          className="h-12"
                        />
                        <p className="text-xs text-gray-500">Digite o número da nota fiscal</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Nome do Fornecedor */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Nome do Fornecedor
                        </Label>
                        <Input
                          type="text"
                          placeholder="Petrobras, Shell, etc"
                          value={formData.nome_fornecedor}
                          onChange={(e) => handleInputChange('nome_fornecedor', e.target.value)}
                          required
                          className="h-12"
                        />
                        <p className="text-xs text-gray-500">Digite o nome do fornecedor</p>
                      </div>

                      {/* Nome do Operador */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Nome do Operador
                        </Label>
                        <Input
                          type="text"
                          placeholder="Carlos Oliveira"
                          value={formData.nome_operador}
                          onChange={(e) => handleInputChange('nome_operador', e.target.value)}
                          required
                          className="h-12"
                        />
                        <p className="text-xs text-gray-500">Digite o nome do operador responsável pelo recebimento</p>
                      </div>
                    </div>

                    {/* Observações */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Observações (Opcional)
                      </Label>
                      <Textarea
                        placeholder="Observações adicionais sobre o recebimento..."
                        value={formData.observacoes}
                        onChange={(e) => handleInputChange('observacoes', e.target.value)}
                        className="min-h-[100px]"
                      />
                      <p className="text-xs text-gray-500">Informações adicionais relevantes</p>
                    </div>

                    {/* Botão de Submit */}
                    <div className="flex justify-end pt-4">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium"
                      >
                        {isLoading ? "Registrando..." : "Registrar Recebimento no Tanque"}
                      </Button>
                    </div>

                    {/* Footer Info */}
                    <div className="flex justify-between items-center text-xs text-gray-500 pt-4 border-t">
                      <span>Data e hora serão registradas automaticamente.</span>
                      {valorPorLitro && (
                        <span className="font-medium">
                          Valor por litro: R$ {valorPorLitro}
                        </span>
                      )}
                    </div>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}