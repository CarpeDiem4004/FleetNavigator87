import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { HardHat, ArrowLeft, Save, Phone } from 'lucide-react';
import { Link } from 'wouter';

const AcidentesTrabalhoGP03: React.FC = () => {
  const [formData, setFormData] = useState({
    colaborador: '',
    cargo: '',
    data: '',
    hora: '',
    local: '',
    tipo: '',
    gravidade: '',
    descricao: '',
    testemunhas: '',
    primeiros_socorros: '',
    hospital: '',
    medico: '',
    observacoes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Acidente de trabalho registrado!",
        description: "O registro foi enviado para análise e providências.",
      });
      setFormData({
        colaborador: '',
        cargo: '',
        data: '',
        hora: '',
        local: '',
        tipo: '',
        gravidade: '',
        descricao: '',
        testemunhas: '',
        primeiros_socorros: '',
        hospital: '',
        medico: '',
        observacoes: ''
      });
    } catch (error) {
      toast({
        title: "Erro ao registrar acidente",
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
                <h1 className="text-2xl font-bold text-gray-900">Comunicar Acidente de Trabalho</h1>
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
              <CardTitle className="flex items-center text-amber-700">
                <HardHat className="w-5 h-5 mr-2" />
                Registro de Acidente de Trabalho
              </CardTitle>
              <CardDescription>
                Reporte acidentes de trabalho e incidentes com colaboradores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="colaborador">Nome do Colaborador</Label>
                    <Input
                      id="colaborador"
                      value={formData.colaborador}
                      onChange={(e) => handleChange('colaborador', e.target.value)}
                      placeholder="Nome completo"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="cargo">Cargo/Função</Label>
                    <Input
                      id="cargo"
                      value={formData.cargo}
                      onChange={(e) => handleChange('cargo', e.target.value)}
                      placeholder="Motorista, Operador, etc."
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="data">Data do Acidente</Label>
                    <Input
                      id="data"
                      type="date"
                      value={formData.data}
                      onChange={(e) => handleChange('data', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="hora">Hora do Acidente</Label>
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
                  <Label htmlFor="local">Local do Acidente</Label>
                  <Input
                    id="local"
                    value={formData.local}
                    onChange={(e) => handleChange('local', e.target.value)}
                    placeholder="Endereço ou setor onde ocorreu"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo">Tipo de Acidente</Label>
                    <Select value={formData.tipo} onValueChange={(value) => handleChange('tipo', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="queda">Queda</SelectItem>
                        <SelectItem value="corte">Corte</SelectItem>
                        <SelectItem value="queimadura">Queimadura</SelectItem>
                        <SelectItem value="contusao">Contusão</SelectItem>
                        <SelectItem value="fratura">Fratura</SelectItem>
                        <SelectItem value="acidente_veiculo">Acidente com Veículo</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="gravidade">Gravidade</Label>
                    <Select value={formData.gravidade} onValueChange={(value) => handleChange('gravidade', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a gravidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leve">Leve</SelectItem>
                        <SelectItem value="moderada">Moderada</SelectItem>
                        <SelectItem value="grave">Grave</SelectItem>
                        <SelectItem value="fatal">Fatal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição do Acidente</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => handleChange('descricao', e.target.value)}
                    placeholder="Descreva detalhadamente como ocorreu o acidente"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="testemunhas">Testemunhas</Label>
                  <Textarea
                    id="testemunhas"
                    value={formData.testemunhas}
                    onChange={(e) => handleChange('testemunhas', e.target.value)}
                    placeholder="Nomes e contatos das testemunhas"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="primeiros_socorros">Primeiros Socorros Prestados</Label>
                  <Textarea
                    id="primeiros_socorros"
                    value={formData.primeiros_socorros}
                    onChange={(e) => handleChange('primeiros_socorros', e.target.value)}
                    placeholder="Descreva os primeiros socorros prestados"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hospital">Hospital/Clínica</Label>
                    <Input
                      id="hospital"
                      value={formData.hospital}
                      onChange={(e) => handleChange('hospital', e.target.value)}
                      placeholder="Local do atendimento médico"
                    />
                  </div>

                  <div>
                    <Label htmlFor="medico">Médico Responsável</Label>
                    <Input
                      id="medico"
                      value={formData.medico}
                      onChange={(e) => handleChange('medico', e.target.value)}
                      placeholder="Nome do médico"
                    />
                  </div>
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

                <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
                  <Save className="w-4 h-4 mr-2" />
                  Registrar Acidente de Trabalho
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AcidentesTrabalhoGP03;