import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Truck } from 'lucide-react';

export default function FormularioRecebimentoStandalone() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (submitting) return;
    
    setSubmitting(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      
      // Validação básica
      const requiredFields = ['fornecedor', 'tipo_combustivel', 'quantidade_litros', 'valor_litro', 'numero_nota', 'operador'];
      for (const field of requiredFields) {
        if (!formData.get(field)) {
          toast({
            title: 'Erro de validação',
            description: `O campo ${field.replace('_', ' ')} é obrigatório`,
            variant: 'destructive',
          });
          return;
        }
      }

      // Preparar dados do recebimento
      const recebimentoData = {
        fornecedor: formData.get('fornecedor') as string,
        tipo_combustivel: formData.get('tipo_combustivel') as string,
        quantidade_litros: parseFloat(formData.get('quantidade_litros') as string),
        valor_litro: parseFloat(formData.get('valor_litro') as string),
        valor_total: parseFloat(formData.get('quantidade_litros') as string) * parseFloat(formData.get('valor_litro') as string),
        numero_nota: formData.get('numero_nota') as string,
        data_entrega: formData.get('data_entrega') as string || new Date().toISOString().split('T')[0],
        operador: formData.get('operador') as string,
        observacoes: formData.get('observacoes') as string || '',
        posto: 'Posto_Remedios'
      };

      console.log('[RECEBIMENTO] Enviando dados:', recebimentoData);

      // Enviar dados para a API
      const response = await fetch('/api/recebimentos/posto_remedios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recebimentoData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Sucesso!',
          description: 'Recebimento de combustível registrado com sucesso',
        });

        // Limpar formulário
        (e.target as HTMLFormElement).reset();

        // Chamar callback de atualização se existir
        if (typeof (window as any).onSubmitSuccessPostoRemedios === 'function') {
          (window as any).onSubmitSuccessPostoRemedios();
        }
      } else {
        throw new Error(result.message || 'Erro ao registrar recebimento');
      }
    } catch (error) {
      console.error('Erro ao registrar recebimento:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao registrar recebimento',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Truck className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Registro de Recebimento de Combustível</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Fornecedor*</label>
          <input 
            name="fornecedor" 
            required 
            className="w-full border rounded p-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ minHeight: '44px', fontSize: '16px' }}
            placeholder="Nome do fornecedor"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tipo de Combustível*</label>
          <select 
            name="tipo_combustivel" 
            required 
            className="w-full border rounded p-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ minHeight: '44px', fontSize: '16px' }}
          >
            <option value="">Selecione o tipo</option>
            <option value="Diesel">Diesel</option>
            <option value="Arla">Arla</option>
            <option value="Gasolina">Gasolina</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Quantidade (Litros)*</label>
          <input 
            name="quantidade_litros" 
            type="number" 
            step="0.01" 
            required 
            className="w-full border rounded p-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ minHeight: '44px', fontSize: '16px' }}
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Valor por Litro (R$)*</label>
          <input 
            name="valor_litro" 
            type="number" 
            step="0.001" 
            required 
            className="w-full border rounded p-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ minHeight: '44px', fontSize: '16px' }}
            placeholder="0.000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Número da Nota Fiscal*</label>
          <input 
            name="numero_nota" 
            required 
            className="w-full border rounded p-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ minHeight: '44px', fontSize: '16px' }}
            placeholder="Número da NF"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Data de Entrega</label>
          <input 
            name="data_entrega" 
            type="date" 
            defaultValue={new Date().toISOString().split('T')[0]}
            className="w-full border rounded p-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ minHeight: '44px', fontSize: '16px' }}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Nome do Operador*</label>
          <input 
            name="operador" 
            required 
            className="w-full border rounded p-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ minHeight: '44px', fontSize: '16px' }}
            placeholder="Nome do operador responsável"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Observações</label>
          <textarea 
            name="observacoes" 
            rows={3}
            className="w-full border rounded p-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ fontSize: '16px' }}
            placeholder="Observações adicionais (opcional)"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          type="submit" 
          disabled={submitting}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registrando...
            </>
          ) : (
            'Registrar Recebimento'
          )}
        </Button>
      </div>
    </form>
  );
}