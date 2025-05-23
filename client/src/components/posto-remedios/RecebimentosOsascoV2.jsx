import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Fuel } from "lucide-react";
import useOsascoV2Recebimentos from '@/hooks/useOsascoV2Recebimentos';
import { Textarea } from "@/components/ui/textarea";

/**
 * Componente especializado para o registro de recebimentos do posto Osasco V2
 * Este componente lida com a estrutura da tabela específica deste posto
 */
export default function RecebimentosOsascoV2() {
  const { toast } = useToast();
  const { recebimentos, loading, adicionarRecebimento } = useOsascoV2Recebimentos();
  
  // Estado local para o formulário
  const [formData, setFormData] = useState({
    tipo_produto: 'Diesel',
    litros_recebidos: '',
    valor_total: '',
    nome_fornecedor: '',
    nome_operador: '',
    observacoes: ''
  });
  
  // Estado de envio do formulário
  const [submitting, setSubmitting] = useState(false);
  
  // Manipulador de campos de entrada
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Manipulador de campos de seleção
  const handleSelectChange = (value, name) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Validação básica do formulário
  const isFormValid = () => {
    const requiredFields = ['tipo_produto', 'litros_recebidos', 'valor_total', 'nome_fornecedor', 'nome_operador'];
    return requiredFields.every(field => formData[field] && String(formData[field]).trim() !== '');
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
      
      // Calcular o valor do litro a partir do valor total e litros recebidos
      const litros = parseFloat(formData.litros_recebidos);
      const valorTotal = parseFloat(formData.valor_total);
      const valorLitro = valorTotal / litros;
      
      // Usar os dados do formulário diretamente, pois o hook useOsascoV2Recebimentos já faz a conversão de nomes de campos
      const dados = {
        nome_fornecedor: formData.nome_fornecedor,
        tipo_produto: formData.tipo_produto,
        litros_recebidos: litros,
        valor_litro: valorLitro.toFixed(3), // Usar 3 decimais para valor_litro
        valor_total: valorTotal.toFixed(2), // Certificar que valor_total está no formato correto
        numero_nota: 'NF' + new Date().toISOString().split('T')[0].replace(/-/g, ''), // Número automático baseado na data
        data_entrega: new Date().toISOString().split('T')[0],  // Data atual
        nome_operador: formData.nome_operador,
        observacoes: formData.observacoes || ''
      };
      
      const resultado = await adicionarRecebimento(dados);
      
      if (resultado.success) {
        toast({
          title: "Sucesso!",
          description: "Recebimento registrado com sucesso."
        });
        
        // Limpar formulário
        setFormData({
          tipo_produto: 'Diesel',
          litros_recebidos: '',
          valor_total: '',
          nome_fornecedor: '',
          nome_operador: '',
          observacoes: ''
        });
      }
    } catch (error) {
      console.error("Erro ao registrar recebimento:", error);
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao tentar registrar o recebimento."
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Fuel className="h-5 w-5 text-primary" />
          <CardTitle>Recebimento de Combustível no Tanque</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Registre o recebimento de combustível no tanque do posto osasco_v2.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_produto">Tipo de Produto Recebido</Label>
              <Select 
                value={formData.tipo_produto} 
                onValueChange={(value) => handleSelectChange(value, 'tipo_produto')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de produto recebido" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="DIESEL S10">DIESEL S10</SelectItem>
                  <SelectItem value="DIESEL S500">DIESEL S500</SelectItem>
                  <SelectItem value="ARLA 32">ARLA 32</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="litros_recebidos">Quantidade Recebida (Litros)</Label>
              <Input
                id="litros_recebidos"
                name="litros_recebidos"
                type="number"
                step="0.01"
                min="0"
                value={formData.litros_recebidos}
                onChange={handleChange}
                placeholder="Digite a quantidade em litros"
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
                placeholder="Digite o valor total da compra"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nome_fornecedor">Nome do Fornecedor</Label>
              <Input
                id="nome_fornecedor"
                name="nome_fornecedor"
                value={formData.nome_fornecedor}
                onChange={handleChange}
                placeholder="Digite o nome do fornecedor"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nome_operador">Nome do Operador</Label>
              <Input
                id="nome_operador"
                name="nome_operador"
                value={formData.nome_operador}
                onChange={handleChange}
                placeholder="Digite o nome do operador responsável pelo recebimento"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (Opcional)</Label>
            <Textarea
              id="observacoes"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              placeholder="Informações adicionais relevantes"
              rows={3}
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
            ) : "Registrar Recebimento no Tanque"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}