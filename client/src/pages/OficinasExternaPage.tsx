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
import { Toaster } from "@/components/ui/toaster";
import { Check, ArrowLeft } from "lucide-react";

export default function OficinasExternaPage() {
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [credenciais, setCredenciais] = useState<{email: string, senha: string} | null>(null);
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
    placa_veiculo: '',
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
    const { name, value } = e.target;
    
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
      
      const responseData = await response.json();
      
      // Verificar se o servidor retornou credenciais
      if (responseData.credenciais) {
        setCredenciais(responseData.credenciais);
      }
      
      setIsSuccess(true);
      
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
        placa_veiculo: '',
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

  const handleReset = () => {
    setIsSuccess(false);
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
      placa_veiculo: '',
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
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {isSuccess ? (
          <Card className="w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Cadastro Enviado com Sucesso!</CardTitle>
              <CardDescription>
                Suas informações foram recebidas e serão analisadas pela equipe de gestão de frotas.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {credenciais ? (
                <div className="border border-green-200 rounded-lg p-6 mb-4 bg-green-50">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">
                    Credenciais de Acesso
                  </h3>
                  <div className="grid gap-2 mb-4 text-left">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm text-gray-600">Email:</span>
                      <code className="bg-white px-3 py-1 rounded border">
                        {credenciais.email}
                      </code>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm text-gray-600">Senha:</span>
                      <code className="bg-white px-3 py-1 rounded border">
                        {credenciais.senha}
                      </code>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Guarde essas informações! Você precisará delas para acessar o portal da Murici Logística.
                  </p>
                  <p className="text-xs text-gray-500">
                    Você pode fazer login no sistema com estas credenciais após a aprovação do seu cadastro.
                  </p>
                </div>
              ) : null}
              <p className="text-gray-500 mb-3">
                Em caso de dúvidas, entre em contato com a equipe de gestão de frotas da Murici.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={handleReset} className="space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Cadastrar nova oficina</span>
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <>
            <div className="text-center mb-8">
              <img 
                src="https://muriciloc.com.br/wp-content/themes/murici/img/logo-murici.png" 
                alt="Murici Logística" 
                className="h-16 mx-auto mb-4" 
              />
              <h1 className="text-3xl font-bold">Cadastro de Oficina e Orçamento</h1>
              <p className="text-gray-500 mt-2">
                Preencha o formulário abaixo para se cadastrar como parceiro da Murici Logística
              </p>
            </div>

            <Card className="w-full shadow-md">
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Dados da Oficina</h3>
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

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Dados Bancários</h3>
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

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Detalhes do Serviço</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="placa_veiculo">Placa do Veículo</Label>
                        <Input 
                          id="placa_veiculo"
                          name="placa_veiculo" 
                          value={form.placa_veiculo} 
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

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="observacoes">Observações sobre o Serviço</Label>
                        <Textarea 
                          id="observacoes"
                          name="observacoes" 
                          value={form.observacoes} 
                          onChange={handleChange} 
                          className="min-h-[120px]"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t p-6">
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
                          placa_veiculo: '',
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
                    Limpar Formulário
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-6"
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar Cadastro'}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            <div className="mt-8 text-center text-sm text-gray-500">
              <p>© {new Date().getFullYear()} Murici Logística - Todos os direitos reservados</p>
            </div>
          </>
        )}
      </div>
      <Toaster />
    </div>
  );
}