/**
 * Componente específico para gerenciar recebimentos do Posto Osasco V2
 * Utiliza o hook personalizado para conectar com a API especializada
 */

import React, { useState } from 'react';
import { useOsascoRecebimentos, type RecebimentoOsasco } from '../../hooks/useOsascoRecebimentos';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const RecebimentosOsasco: React.FC = () => {
  const { recebimentos, isLoading, error, refreshRecebimentos, adicionarRecebimento } = useOsascoRecebimentos();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<RecebimentoOsasco>({
    fornecedor: '',
    tipo_combustivel: 'Diesel S-10',
    quantidade_litros: '',
    valor_litro: '',
    valor_total: '',
    numero_nota: '',
    data_entrega: format(new Date(), 'yyyy-MM-dd'),
    nome_operador: '',
    observacoes: ''
  });

  const resetForm = () => {
    setFormData({
      fornecedor: '',
      tipo_combustivel: 'Diesel S-10',
      quantidade_litros: '',
      valor_litro: '',
      valor_total: '',
      numero_nota: '',
      data_entrega: format(new Date(), 'yyyy-MM-dd'),
      nome_operador: '',
      observacoes: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Se mudar quantidade_litros ou valor_litro, calcular o valor_total
    if (name === 'quantidade_litros' || name === 'valor_litro') {
      const litros = name === 'quantidade_litros' ? value : formData.quantidade_litros;
      const valorLitro = name === 'valor_litro' ? value : formData.valor_litro;
      
      if (litros && valorLitro) {
        const total = (parseFloat(litros.toString()) * parseFloat(valorLitro.toString())).toFixed(2);
        setFormData({
          ...formData,
          [name]: value,
          valor_total: total
        });
        return;
      }
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await adicionarRecebimento(formData);
    if (result) {
      resetForm();
      setShowForm(false);
    }
  };

  const formatarData = (dataStr: string) => {
    try {
      return format(new Date(dataStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return dataStr;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="bg-primary/5">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recebimentos de Combustível - Osasco V2</CardTitle>
              <CardDescription>
                Registro e histórico de recebimentos de combustível para o posto
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refreshRecebimentos()}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Atualizar
              </Button>
              <Button
                variant={showForm ? "secondary" : "default"}
                size="sm"
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? 'Cancelar' : 'Novo Recebimento'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
              <p className="font-medium">Erro ao carregar recebimentos:</p>
              <p>{error}</p>
            </div>
          )}
          
          {showForm && (
            <div className="mb-8 p-4 border rounded-md">
              <h3 className="text-lg font-bold mb-4">Registrar Recebimento</h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fornecedor">Fornecedor</Label>
                  <Input
                    id="fornecedor"
                    name="fornecedor"
                    value={formData.fornecedor}
                    onChange={handleInputChange}
                    placeholder="Nome do fornecedor"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tipo_combustivel">Tipo de Combustível</Label>
                  <select
                    id="tipo_combustivel"
                    name="tipo_combustivel"
                    value={formData.tipo_combustivel}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="Diesel S-10">Diesel S-10</option>
                    <option value="Diesel Comum">Diesel Comum</option>
                    <option value="Arla 32">Arla 32</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quantidade_litros">Quantidade (litros)</Label>
                  <Input
                    id="quantidade_litros"
                    name="quantidade_litros"
                    type="number"
                    value={formData.quantidade_litros}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="valor_litro">Valor por Litro (R$)</Label>
                  <Input
                    id="valor_litro"
                    name="valor_litro"
                    type="number"
                    value={formData.valor_litro}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="valor_total">Valor Total (R$)</Label>
                  <Input
                    id="valor_total"
                    name="valor_total"
                    type="number"
                    value={formData.valor_total}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    readOnly
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="numero_nota">Número da Nota Fiscal</Label>
                  <Input
                    id="numero_nota"
                    name="numero_nota"
                    value={formData.numero_nota}
                    onChange={handleInputChange}
                    placeholder="NF-000000"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="data_entrega">Data de Entrega</Label>
                  <Input
                    id="data_entrega"
                    name="data_entrega"
                    type="date"
                    value={formData.data_entrega}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nome_operador">Nome do Operador</Label>
                  <Input
                    id="nome_operador"
                    name="nome_operador"
                    value={formData.nome_operador}
                    onChange={handleInputChange}
                    placeholder="Nome do operador responsável"
                    required
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="observacoes">Observações (opcional)</Label>
                  <Textarea
                    id="observacoes"
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleInputChange}
                    placeholder="Observações sobre o recebimento"
                    rows={3}
                  />
                </div>
                
                <div className="md:col-span-2 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Registrar Recebimento
                  </Button>
                </div>
              </form>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : recebimentos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum recebimento de combustível registrado.</p>
              <p className="text-sm">Clique em "Novo Recebimento" para adicionar o primeiro registro.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2">Data</th>
                    <th className="p-2">Fornecedor</th>
                    <th className="p-2">Combustível</th>
                    <th className="p-2">Quantidade</th>
                    <th className="p-2">Valor/L</th>
                    <th className="p-2">Total</th>
                    <th className="p-2">NF</th>
                    <th className="p-2">Operador</th>
                  </tr>
                </thead>
                <tbody>
                  {recebimentos.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">{item.data_formatada || formatarData(item.data_entrega)}</td>
                      <td className="p-2">{item.fornecedor}</td>
                      <td className="p-2">{item.tipo_combustivel}</td>
                      <td className="p-2">{typeof item.quantidade_litros === 'number' 
                        ? item.quantidade_litros.toFixed(2) 
                        : item.quantidade_litros} L</td>
                      <td className="p-2">R$ {typeof item.valor_litro === 'number' 
                        ? item.valor_litro.toFixed(3) 
                        : item.valor_litro}</td>
                      <td className="p-2">R$ {typeof item.valor_total === 'number' 
                        ? item.valor_total.toFixed(2) 
                        : item.valor_total}</td>
                      <td className="p-2">{item.numero_nota}</td>
                      <td className="p-2">{item.nome_operador}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RecebimentosOsasco;