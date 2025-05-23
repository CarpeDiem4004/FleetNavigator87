import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, Save } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import useOsascoV2Recebimentos from '@/hooks/useOsascoV2Recebimentos';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

const RecebimentosOsascoV2 = ({ className = "" }) => {
  const [formData, setFormData] = useState({
    fornecedor: '',
    tipo_combustivel: '',
    quantidade_litros: '',
    valor_litro: '',
    valor_total: '',
    numero_nota: '',
    operador: '',
    data_entrega: format(new Date(), 'yyyy-MM-dd'),
    observacoes: ''
  });

  const [isCalculating, setIsCalculating] = useState(false);
  const { adicionarRecebimento, isLoading, error, reloadData } = useOsascoV2Recebimentos();
  const { toast } = useToast();

  // Manipuladores de formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Calcular valor total automático quando quantidade ou valor por litro mudar
    if ((name === 'quantidade_litros' || name === 'valor_litro') && 
        formData.quantidade_litros && formData.valor_litro) {
      setIsCalculating(true);
      const qtd = parseFloat(name === 'quantidade_litros' ? value : formData.quantidade_litros);
      const val = parseFloat(name === 'valor_litro' ? value : formData.valor_litro);
      
      if (!isNaN(qtd) && !isNaN(val)) {
        const total = (qtd * val).toFixed(2);
        setFormData(prev => ({ ...prev, valor_total: total }));
      }
      setIsCalculating(false);
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.fornecedor || !formData.tipo_combustivel || 
        !formData.quantidade_litros || !formData.valor_litro) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await adicionarRecebimento(formData);
      
      if (result.success) {
        toast({
          title: "Recebimento registrado",
          description: "O recebimento foi registrado com sucesso!",
          variant: "default"
        });
        
        // Resetar formulário
        setFormData({
          fornecedor: '',
          tipo_combustivel: '',
          quantidade_litros: '',
          valor_litro: '',
          valor_total: '',
          numero_nota: '',
          operador: '',
          data_entrega: format(new Date(), 'yyyy-MM-dd'),
          observacoes: ''
        });
        
        // Recarregar dados do histórico
        reloadData();
      } else {
        throw new Error(result.message || "Erro ao registrar recebimento");
      }
    } catch (err) {
      toast({
        title: "Erro ao registrar",
        description: err.message || "Não foi possível registrar o recebimento. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className={`shadow-md ${className}`}>
      <CardHeader className="bg-blue-50">
        <CardTitle className="text-lg font-semibold text-blue-800">
          Registrar Recebimento de Combustível
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro: {error}
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor</Label>
              <Input
                id="fornecedor"
                name="fornecedor"
                value={formData.fornecedor}
                onChange={handleChange}
                placeholder="Nome do fornecedor"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tipo_combustivel">Tipo de Combustível</Label>
              <Select 
                value={formData.tipo_combustivel} 
                onValueChange={(value) => handleSelectChange('tipo_combustivel', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o combustível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="Diesel S10">Diesel S10</SelectItem>
                  <SelectItem value="ARLA">ARLA 32</SelectItem>
                  <SelectItem value="Gasolina">Gasolina</SelectItem>
                  <SelectItem value="Etanol">Etanol</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantidade_litros">Quantidade em Litros</Label>
              <Input
                id="quantidade_litros"
                name="quantidade_litros"
                type="number"
                min="0"
                step="0.01"
                value={formData.quantidade_litros}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="valor_litro">Valor por Litro (R$)</Label>
              <Input
                id="valor_litro"
                name="valor_litro"
                type="number"
                min="0"
                step="0.01"
                value={formData.valor_litro}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="valor_total">Valor Total (R$)</Label>
              <div className="relative">
                <Input
                  id="valor_total"
                  name="valor_total"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.valor_total}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={isCalculating ? "bg-gray-100" : ""}
                />
                {isCalculating && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="numero_nota">Número da Nota Fiscal</Label>
              <Input
                id="numero_nota"
                name="numero_nota"
                value={formData.numero_nota}
                onChange={handleChange}
                placeholder="Nº da NF-e"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="data_entrega">Data de Entrega</Label>
              <Input
                id="data_entrega"
                name="data_entrega"
                type="date"
                value={formData.data_entrega}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="operador">Nome do Operador</Label>
              <Input
                id="operador"
                name="operador"
                value={formData.operador}
                onChange={handleChange}
                placeholder="Nome do operador"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Input
              id="observacoes"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              placeholder="Observações adicionais"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Registrar Recebimento
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RecebimentosOsascoV2;