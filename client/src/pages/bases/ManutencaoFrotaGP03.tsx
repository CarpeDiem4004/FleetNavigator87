import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Wrench, ArrowLeft, Save, Calendar } from 'lucide-react';
import { Link } from 'wouter';

const ManutencaoFrotaGP03: React.FC = () => {
  const [formData, setFormData] = useState({
    veiculo: '',
    tipo_manutencao: '',
    descricao: '',
    prioridade: '',
    data_solicitacao: '',
    data_preferida: '',
    quilometragem: '',
    servicos: '',
    observacoes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Solicitação de manutenção enviada!",
        description: "Sua solicitação foi enviada para a gestão de frota.",
      });
      setFormData({
        veiculo: '',
        tipo_manutencao: '',
        descricao: '',
        prioridade: '',
        data_solicitacao: '',
        data_preferida: '',
        quilometragem: '',
        servicos: '',
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
                <h1 className="text-2xl font-bold text-gray-900">Solicitação de Manutenção</h1>
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
              <CardTitle className="flex items-center text-orange-700">
                <Wrench className="w-5 h-5 mr-2" />
                Nova Solicitação de Manutenção
              </CardTitle>
              <CardDescription>
                Registre solicitações de manutenção para veículos da frota
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="veiculo">Veículo (Placa)</Label>
                    <Input
                      id="veiculo"
                      value={formData.veiculo}
                      onChange={(e) => handleChange('veiculo', e.target.value)}
                      placeholder="ABC-1234"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="tipo_manutencao">Tipo de Manutenção</Label>
                    <Select value={formData.tipo_manutencao} onValueChange={(value) => handleChange('tipo_manutencao', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preventiva">Preventiva</SelectItem>
                        <SelectItem value="corretiva">Corretiva</SelectItem>
                        <SelectItem value="revisao">Revisão</SelectItem>
                        <SelectItem value="emergencia">Emergência</SelectItem>
                        <SelectItem value="troca_oleo">Troca de Óleo</SelectItem>
                        <SelectItem value="pneus">Pneus</SelectItem>
                        <SelectItem value="freios">Freios</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição do Problema/Serviço</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => handleChange('descricao', e.target.value)}
                    placeholder="Descreva detalhadamente o problema ou serviço necessário"
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prioridade">Prioridade</Label>
                    <Select value={formData.prioridade} onValueChange={(value) => handleChange('prioridade', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a prioridade" />
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
                    <Label htmlFor="quilometragem">Quilometragem Atual</Label>
                    <Input
                      id="quilometragem"
                      type="number"
                      value={formData.quilometragem}
                      onChange={(e) => handleChange('quilometragem', e.target.value)}
                      placeholder="123456"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="data_solicitacao">Data da Solicitação</Label>
                    <Input
                      id="data_solicitacao"
                      type="date"
                      value={formData.data_solicitacao}
                      onChange={(e) => handleChange('data_solicitacao', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="data_preferida">Data Preferida</Label>
                    <Input
                      id="data_preferida"
                      type="date"
                      value={formData.data_preferida}
                      onChange={(e) => handleChange('data_preferida', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="servicos">Serviços Necessários</Label>
                  <Textarea
                    id="servicos"
                    value={formData.servicos}
                    onChange={(e) => handleChange('servicos', e.target.value)}
                    placeholder="Liste os serviços específicos necessários"
                    rows={3}
                  />
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

                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
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

export default ManutencaoFrotaGP03;