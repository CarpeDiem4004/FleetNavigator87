import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import useOsascoV2Recebimentos from '@/hooks/useOsascoV2Recebimentos';

/**
 * Componente especializado para o registro de recebimentos do posto Osasco V2
 * Este componente lida com a estrutura da tabela específica deste posto
 */
export default function RecebimentosOsascoV2() {
  const { toast } = useToast();
  const { recebimentos, loading, adicionarRecebimento } = useOsascoV2Recebimentos();
  
  // Estado local para o formulário
  const [formData, setFormData] = useState({
    fornecedor: '',
    tipo_combustivel: '',
    quantidade_litros: '',
    valor_litro: '',
    valor_total: '',
    numero_nota: '',
    data_entrega: new Date().toISOString().split('T')[0],
    operador: '',
    observacoes: ''
  });
  
  // Estado de envio do formulário
  const [submitting, setSubmitting] = useState(false);
  
  // Manipulador de campos de entrada
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updatedData = { ...prev, [name]: value };
      
      // Calcular valor total automaticamente quando quantidade e valor unitário são fornecidos
      if ((name === 'quantidade_litros' || name === 'valor_litro') && 
          updatedData.quantidade_litros && updatedData.valor_litro) {
        const qtd = parseFloat(updatedData.quantidade_litros);
        const valor = parseFloat(updatedData.valor_litro);
        if (!isNaN(qtd) && !isNaN(valor)) {
          updatedData.valor_total = (qtd * valor).toFixed(2);
        }
      }
      
      return updatedData;
    });
  };
  
  // Manipulador de campos de seleção
  const handleSelectChange = (value, name) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Validação básica do formulário
  const isFormValid = () => {
    const requiredFields = ['fornecedor', 'tipo_combustivel', 'quantidade_litros', 'valor_litro', 'numero_nota', 'data_entrega', 'operador'];
    return requiredFields.every(field => formData[field] && formData[field].trim() !== '');
  };
  
  // Manipulador de envio do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      toast({
        title: "Formulário incompleto",
        description: "Todos os campos obrigatórios devem ser preenchidos."
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Converter valores numéricos
      const dataToSubmit = {
        ...formData,
        quantidade_litros: parseFloat(formData.quantidade_litros),
        valor_litro: parseFloat(formData.valor_litro),
        valor_total: parseFloat(formData.valor_total || 0)
      };
      
      // Enviar dados para a API
      const result = await adicionarRecebimento(dataToSubmit);
      
      if (result.success) {
        // Limpar formulário após sucesso
        setFormData({
          fornecedor: '',
          tipo_combustivel: '',
          quantidade_litros: '',
          valor_litro: '',
          valor_total: '',
          numero_nota: '',
          data_entrega: new Date().toISOString().split('T')[0],
          operador: '',
          observacoes: ''
        });
      }
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
      toast({
        title: "Erro ao registrar recebimento",
        description: error.message || "Ocorreu um erro ao tentar registrar o recebimento."
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Registrar Recebimento de Combustível</CardTitle>
        <CardDescription>
          Posto Osasco V2 - Preencha os dados do recebimento de combustível
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor *</Label>
              <Input
                id="fornecedor"
                name="fornecedor"
                value={formData.fornecedor}
                onChange={handleChange}
                placeholder="Nome do fornecedor"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tipo_combustivel">Tipo de Combustível *</Label>
              <Select 
                value={formData.tipo_combustivel} 
                onValueChange={(value) => handleSelectChange(value, 'tipo_combustivel')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIESEL S10">DIESEL S10</SelectItem>
                  <SelectItem value="DIESEL S500">DIESEL S500</SelectItem>
                  <SelectItem value="ARLA 32">ARLA 32</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantidade_litros">Quantidade em Litros *</Label>
              <Input
                id="quantidade_litros"
                name="quantidade_litros"
                type="number"
                step="0.01"
                min="0"
                value={formData.quantidade_litros}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="valor_litro">Valor por Litro (R$) *</Label>
              <Input
                id="valor_litro"
                name="valor_litro"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_litro}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="valor_total">Valor Total (R$)</Label>
              <Input
                id="valor_total"
                name="valor_total"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_total}
                onChange={handleChange}
                placeholder="Calculado automaticamente"
                readOnly
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="numero_nota">Número da Nota Fiscal *</Label>
              <Input
                id="numero_nota"
                name="numero_nota"
                value={formData.numero_nota}
                onChange={handleChange}
                placeholder="Número da NF"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="data_entrega">Data de Entrega *</Label>
              <Input
                id="data_entrega"
                name="data_entrega"
                type="date"
                value={formData.data_entrega}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="operador">Nome do Operador *</Label>
              <Input
                id="operador"
                name="operador"
                value={formData.operador}
                onChange={handleChange}
                placeholder="Nome do operador"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <Label htmlFor="observacoes">Observações</Label>
            <Input
              id="observacoes"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              placeholder="Observações adicionais (opcional)"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={submitting || !isFormValid()}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : "Registrar Recebimento"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between flex-col sm:flex-row">
        <p className="text-sm text-muted-foreground mb-2 sm:mb-0">
          * Campos obrigatórios
        </p>
        <p className="text-sm text-muted-foreground">
          Registros hoje: {recebimentos.filter(r => 
            new Date(r.created_at).toDateString() === new Date().toDateString()
          ).length}
        </p>
      </CardFooter>
    </Card>
  );
}