import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { FileText, ArrowLeft, Save, Upload } from 'lucide-react';
import { Link } from 'wouter';

const SolicitacaoOrcamentoGP03: React.FC = () => {
  const [formData, setFormData] = useState({
    categoria: '',
    fornecedor: '',
    descricao: '',
    justificativa: '',
    valor_estimado: '',
    prazo: '',
    urgencia: '',
    observacoes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Solicitação de orçamento enviada!",
        description: "Sua solicitação foi enviada para análise da gestão.",
      });
      setFormData({
        categoria: '',
        fornecedor: '',
        descricao: '',
        justificativa: '',
        valor_estimado: '',
        prazo: '',
        urgencia: '',
        observacoes: ''
      });
    } catch (error) {
      toast({
        title: "Erro ao enviar solicitação",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/bases/gp03">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Solicitação de Orçamento</h1>
                <p className="text-gray-600">Base GP03 - Hortolandia</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-purple-700">
                <FileText className="w-5 h-5 mr-2" />
                Nova Solicitação de Orçamento
              </CardTitle>
              <CardDescription>
                Solicite orçamentos para serviços ou produtos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select value={formData.categoria} onValueChange={(value) => handleChange('categoria', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                        <SelectItem value="pecas">Peças</SelectItem>
                        <SelectItem value="servicos">Serviços</SelectItem>
                        <SelectItem value="equipamentos">Equipamentos</SelectItem>
                        <SelectItem value="combustivel">Combustível</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="fornecedor">Fornecedor Sugerido</Label>
                    <Input
                      id="fornecedor"
                      value={formData.fornecedor}
                      onChange={(e) => handleChange('fornecedor', e.target.value)}
                      placeholder="Nome do fornecedor (opcional)"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição do Produto/Serviço</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => handleChange('descricao', e.target.value)}
                    placeholder="Descreva detalhadamente o que precisa ser orçado"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="justificativa">Justificativa</Label>
                  <Textarea
                    id="justificativa"
                    value={formData.justificativa}
                    onChange={(e) => handleChange('justificativa', e.target.value)}
                    placeholder="Explique o motivo da solicitação"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="valor_estimado">Valor Estimado (R$)</Label>
                    <Input
                      id="valor_estimado"
                      type="number"
                      step="0.01"
                      value={formData.valor_estimado}
                      onChange={(e) => handleChange('valor_estimado', e.target.value)}
                      placeholder="0,00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="prazo">Prazo Necessário</Label>
                    <Select value={formData.prazo} onValueChange={(value) => handleChange('prazo', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o prazo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1_dia">1 dia</SelectItem>
                        <SelectItem value="3_dias">3 dias</SelectItem>
                        <SelectItem value="1_semana">1 semana</SelectItem>
                        <SelectItem value="2_semanas">2 semanas</SelectItem>
                        <SelectItem value="1_mes">1 mês</SelectItem>
                        <SelectItem value="sem_pressa">Sem pressa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="urgencia">Nível de Urgência</Label>
                  <Select value={formData.urgencia} onValueChange={(value) => handleChange('urgencia', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a urgência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => handleChange('observacoes', e.target.value)}
                    placeholder="Informações adicionais"
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                  <Save className="w-4 h-4 mr-2" />
                  Enviar Solicitação
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SolicitacaoOrcamentoGP03;