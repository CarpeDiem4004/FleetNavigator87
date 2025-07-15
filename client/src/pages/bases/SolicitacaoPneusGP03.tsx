import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { CircleDot, ArrowLeft, Save, Plus } from 'lucide-react';
import { Link } from 'wouter';

const SolicitacaoPneusGP03: React.FC = () => {
  const [formData, setFormData] = useState({
    veiculo: '',
    tipo: '',
    marca: '',
    modelo: '',
    medida: '',
    quantidade: '',
    urgencia: '',
    justificativa: '',
    observacoes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Solicitação de pneus enviada!",
        description: "Sua solicitação foi enviada para análise do time de pneus.",
      });
      setFormData({
        veiculo: '',
        tipo: '',
        marca: '',
        modelo: '',
        medida: '',
        quantidade: '',
        urgencia: '',
        justificativa: '',
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
                <h1 className="text-2xl font-bold text-gray-900">Solicitação de Pneus</h1>
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
              <CardTitle className="flex items-center text-green-700">
                <CircleDot className="w-5 h-5 mr-2" />
                Nova Solicitação de Pneus
              </CardTitle>
              <CardDescription>
                Faça solicitações de pneus para o time responsável
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
                    <Label htmlFor="tipo">Tipo de Pneu</Label>
                    <Select value={formData.tipo} onValueChange={(value) => handleChange('tipo', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="radial">Radial</SelectItem>
                        <SelectItem value="convencional">Convencional</SelectItem>
                        <SelectItem value="recapado">Recapado</SelectItem>
                        <SelectItem value="remold">Remold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="marca">Marca Preferencial</Label>
                    <Input
                      id="marca"
                      value={formData.marca}
                      onChange={(e) => handleChange('marca', e.target.value)}
                      placeholder="Michelin, Bridgestone, etc."
                    />
                  </div>

                  <div>
                    <Label htmlFor="modelo">Modelo</Label>
                    <Input
                      id="modelo"
                      value={formData.modelo}
                      onChange={(e) => handleChange('modelo', e.target.value)}
                      placeholder="Modelo do pneu"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="medida">Medida</Label>
                    <Input
                      id="medida"
                      value={formData.medida}
                      onChange={(e) => handleChange('medida', e.target.value)}
                      placeholder="275/80R22.5"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="quantidade">Quantidade</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      min="1"
                      value={formData.quantidade}
                      onChange={(e) => handleChange('quantidade', e.target.value)}
                      placeholder="2"
                      required
                    />
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
                  <Label htmlFor="justificativa">Justificativa</Label>
                  <Textarea
                    id="justificativa"
                    value={formData.justificativa}
                    onChange={(e) => handleChange('justificativa', e.target.value)}
                    placeholder="Descreva o motivo da solicitação (desgaste, furo, etc.)"
                    rows={3}
                    required
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

                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
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

export default SolicitacaoPneusGP03;