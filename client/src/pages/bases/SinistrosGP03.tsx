import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle, ArrowLeft, Save, Upload } from 'lucide-react';
import { Link } from 'wouter';

const SinistrosGP03: React.FC = () => {
  const [formData, setFormData] = useState({
    tipo: '',
    veiculo: '',
    motorista: '',
    data: '',
    hora: '',
    local: '',
    descricao: '',
    danos: '',
    boletim: '',
    observacoes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Sinistro registrado com sucesso!",
        description: "O registro foi enviado para análise.",
      });
      setFormData({
        tipo: '',
        veiculo: '',
        motorista: '',
        data: '',
        hora: '',
        local: '',
        descricao: '',
        danos: '',
        boletim: '',
        observacoes: ''
      });
    } catch (error) {
      toast({
        title: "Erro ao registrar sinistro",
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
                <h1 className="text-2xl font-bold text-gray-900">Comunicar Sinistro</h1>
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
              <CardTitle className="flex items-center text-red-700">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Registro de Sinistro
              </CardTitle>
              <CardDescription>
                Registre sinistros, roubos e outros incidentes envolvendo veículos da frota
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo">Tipo de Ocorrência</Label>
                    <Select value={formData.tipo} onValueChange={(value) => handleChange('tipo', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="acidente">Acidente de Trânsito</SelectItem>
                        <SelectItem value="roubo">Roubo</SelectItem>
                        <SelectItem value="furto">Furto</SelectItem>
                        <SelectItem value="vandalismo">Vandalismo</SelectItem>
                        <SelectItem value="incendio">Incêndio</SelectItem>
                        <SelectItem value="colisao">Colisão</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

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
                </div>

                <div>
                  <Label htmlFor="motorista">Motorista</Label>
                  <Input
                    id="motorista"
                    value={formData.motorista}
                    onChange={(e) => handleChange('motorista', e.target.value)}
                    placeholder="Nome do motorista"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="data">Data</Label>
                    <Input
                      id="data"
                      type="date"
                      value={formData.data}
                      onChange={(e) => handleChange('data', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="hora">Hora</Label>
                    <Input
                      id="hora"
                      type="time"
                      value={formData.hora}
                      onChange={(e) => handleChange('hora', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="local">Local da Ocorrência</Label>
                  <Input
                    id="local"
                    value={formData.local}
                    onChange={(e) => handleChange('local', e.target.value)}
                    placeholder="Endereço completo ou referência"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição do Ocorrido</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => handleChange('descricao', e.target.value)}
                    placeholder="Descreva detalhadamente o que aconteceu"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="danos">Danos Identificados</Label>
                  <Textarea
                    id="danos"
                    value={formData.danos}
                    onChange={(e) => handleChange('danos', e.target.value)}
                    placeholder="Descreva os danos ao veículo e/ou carga"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="boletim">Número do Boletim de Ocorrência</Label>
                  <Input
                    id="boletim"
                    value={formData.boletim}
                    onChange={(e) => handleChange('boletim', e.target.value)}
                    placeholder="Número do B.O. (se houver)"
                  />
                </div>

                <div>
                  <Label htmlFor="observacoes">Observações Adicionais</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => handleChange('observacoes', e.target.value)}
                    placeholder="Informações adicionais relevantes"
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                  <Save className="w-4 h-4 mr-2" />
                  Registrar Sinistro
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SinistrosGP03;