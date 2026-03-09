import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function CadastroOficina() {
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    nome_oficina: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    ramo_atuacao: '',
    banco: '',
    agencia: '',
    conta: '',
    tipo_conta: '',
    veiculo_id: '',
    orcamento_url: '',
    data_entrada: '',
    previsao_entrega: '',
    data_retirada: '',
    servico_realizado: false,
    observacoes: '',
    forma_pagamento: '',
    unificar_servicos: false,
    valor_total: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Enviar dados para a API
      const response = await fetch('/api/workshops/external', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao cadastrar oficina');
      }
      
      toast({
        title: 'Cadastro realizado com sucesso',
        description: 'As informações da oficina foram enviadas para análise.',
        variant: 'default',
      });
      
      // Limpar formulário
      setForm({
        nome_oficina: '',
        cnpj: '',
        telefone: '',
        email: '',
        endereco: '',
        ramo_atuacao: '',
        banco: '',
        agencia: '',
        conta: '',
        tipo_conta: '',
        veiculo_id: '',
        orcamento_url: '',
        data_entrada: '',
        previsao_entrega: '',
        data_retirada: '',
        servico_realizado: false,
        observacoes: '',
        forma_pagamento: '',
        unificar_servicos: false,
        valor_total: '',
      });
    } catch (error) {
      console.error('Erro ao cadastrar oficina:', error);
      toast({
        title: 'Erro ao enviar cadastro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cadastro de Oficina e Orçamento</CardTitle>
        <CardDescription>
          Preencha os dados para cadastrar uma nova oficina parceira e enviar orçamentos.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-medium">Dados da Oficina</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome_oficina">Nome da Oficina *</Label>
                <Input 
                  id="nome_oficina"
                  name="nome_oficina" 
                  value={form.nome_oficina} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input 
                  id="cnpj"
                  name="cnpj" 
                  value={form.cnpj} 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input 
                  id="telefone"
                  name="telefone" 
                  value={form.telefone} 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input 
                  id="email"
                  name="email" 
                  type="email" 
                  value={form.email} 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input 
                  id="endereco"
                  name="endereco" 
                  value={form.endereco} 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ramo_atuacao">Ramo de Atuação</Label>
                <Input 
                  id="ramo_atuacao"
                  name="ramo_atuacao" 
                  value={form.ramo_atuacao} 
                  onChange={handleChange} 
                />
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-1">
            <h3 className="text-base font-medium">Dados Bancários</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="banco">Banco</Label>
                <Input 
                  id="banco"
                  name="banco" 
                  value={form.banco} 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agencia">Agência</Label>
                <Input 
                  id="agencia"
                  name="agencia" 
                  value={form.agencia} 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conta">Conta</Label>
                <Input 
                  id="conta"
                  name="conta" 
                  value={form.conta} 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo_conta">Tipo de Conta</Label>
                <Select
                  value={form.tipo_conta} 
                  onValueChange={(value) => handleSelectChange('tipo_conta', value)}
                >
                  <SelectTrigger id="tipo_conta">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Corrente">Corrente</SelectItem>
                    <SelectItem value="Poupança">Poupança</SelectItem>
                    <SelectItem value="PJ">PJ</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-1">
            <h3 className="text-base font-medium">Detalhes do Serviço</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="veiculo_id">ID do Veículo</Label>
                <Input 
                  id="veiculo_id"
                  name="veiculo_id" 
                  value={form.veiculo_id} 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor_total">Valor Total</Label>
                <Input 
                  id="valor_total"
                  name="valor_total" 
                  type="number"
                  step="0.01"
                  value={form.valor_total} 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orcamento_url">Link do Orçamento (PDF ou Google Drive)</Label>
                <Input 
                  id="orcamento_url"
                  name="orcamento_url" 
                  value={form.orcamento_url} 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                <Select
                  value={form.forma_pagamento} 
                  onValueChange={(value) => handleSelectChange('forma_pagamento', value)}
                >
                  <SelectTrigger id="forma_pagamento">
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                    <SelectItem value="Pix">Pix</SelectItem>
                    <SelectItem value="Transferência">Transferência</SelectItem>
                    <SelectItem value="Cartão">Cartão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_entrada">Data de Entrada</Label>
                <Input 
                  id="data_entrada"
                  name="data_entrada" 
                  type="date"
                  value={form.data_entrada} 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="previsao_entrega">Previsão de Entrega</Label>
                <Input 
                  id="previsao_entrega"
                  name="previsao_entrega" 
                  type="date"
                  value={form.previsao_entrega} 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_retirada">Data de Retirada</Label>
                <Input 
                  id="data_retirada"
                  name="data_retirada" 
                  type="date"
                  value={form.data_retirada} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="servico_realizado" 
                  checked={form.servico_realizado}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('servico_realizado', checked as boolean)
                  }
                />
                <label
                  htmlFor="servico_realizado"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Serviço Realizado
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="unificar_servicos" 
                  checked={form.unificar_servicos}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('unificar_servicos', checked as boolean)
                  }
                />
                <label
                  htmlFor="unificar_servicos"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Unificar Serviços
                </label>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea 
                id="observacoes"
                name="observacoes" 
                value={form.observacoes} 
                onChange={handleChange} 
                className="min-h-[120px]"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <Button 
            variant="outline" 
            type="button"
            onClick={() => {
              if (confirm('Deseja limpar o formulário? Todos os dados serão perdidos.')) {
                setForm({
                  nome_oficina: '',
                  cnpj: '',
                  telefone: '',
                  email: '',
                  endereco: '',
                  ramo_atuacao: '',
                  banco: '',
                  agencia: '',
                  conta: '',
                  tipo_conta: '',
                  veiculo_id: '',
                  orcamento_url: '',
                  data_entrada: '',
                  previsao_entrega: '',
                  data_retirada: '',
                  servico_realizado: false,
                  observacoes: '',
                  forma_pagamento: '',
                  unificar_servicos: false,
                  valor_total: '',
                });
              }
            }}
          >
            Limpar
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Orçamento'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}