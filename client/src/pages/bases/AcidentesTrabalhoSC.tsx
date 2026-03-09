import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
import { Link } from 'wouter';

const AcidentesTrabalhoSC: React.FC = () => {
  const [formData, setFormData] = useState({
    nomeColaborador: '',
    funcao: '',
    dataHora: '',
    localAcidente: '',
    tipoAcidente: '',
    partesCorpo: '',
    descricao: '',
    testemunhas: '',
    primeirosSocorro: '',
    atendimentoMedico: '',
    observacoes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simular envio para API
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSubmitSuccess(true);
      
      // Limpar formulário após sucesso
      setTimeout(() => {
        setFormData({
          nomeColaborador: '',
          funcao: '',
          dataHora: '',
          localAcidente: '',
          tipoAcidente: '',
          partesCorpo: '',
          descricao: '',
          testemunhas: '',
          primeirosSocorro: '',
          atendimentoMedico: '',
          observacoes: ''
        });
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Erro ao enviar acidente:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">
                Acidente Comunicado!
              </h2>
              <p className="text-gray-600">
                Sua comunicação de acidente foi enviada com sucesso. O setor de segurança do trabalho será notificado.
              </p>
              <Link href="/bases/sc">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar à Base SC
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <Link href="/bases/sc">
            <Button variant="ghost" className="mb-4 text-gray-600 hover:text-gray-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar à Base SC
            </Button>
          </Link>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Clock className="h-10 w-10 text-orange-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Comunicação de Acidente de Trabalho
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Base SC (Ribeirão Preto) SSP4
            </p>
          </div>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">
              Registrar Acidente de Trabalho
            </CardTitle>
            <CardDescription className="text-gray-600">
              Preencha todas as informações disponíveis sobre o acidente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nomeColaborador" className="text-gray-700 font-medium">
                    Nome do Colaborador *
                  </Label>
                  <Input
                    id="nomeColaborador"
                    placeholder="Nome completo"
                    value={formData.nomeColaborador}
                    onChange={(e) => handleInputChange('nomeColaborador', e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="funcao" className="text-gray-700 font-medium">
                    Função/Cargo *
                  </Label>
                  <Input
                    id="funcao"
                    placeholder="Ex: Motorista, Auxiliar, etc."
                    value={formData.funcao}
                    onChange={(e) => handleInputChange('funcao', e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataHora" className="text-gray-700 font-medium">
                    Data e Hora do Acidente *
                  </Label>
                  <Input
                    id="dataHora"
                    type="datetime-local"
                    value={formData.dataHora}
                    onChange={(e) => handleInputChange('dataHora', e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipoAcidente" className="text-gray-700 font-medium">
                    Tipo de Acidente *
                  </Label>
                  <Select onValueChange={(value) => handleInputChange('tipoAcidente', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="queda">Queda</SelectItem>
                      <SelectItem value="corte">Corte</SelectItem>
                      <SelectItem value="queimadura">Queimadura</SelectItem>
                      <SelectItem value="contusao">Contusão</SelectItem>
                      <SelectItem value="fratura">Fratura</SelectItem>
                      <SelectItem value="intoxicacao">Intoxicação</SelectItem>
                      <SelectItem value="acidente-transito">Acidente de Trânsito</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="localAcidente" className="text-gray-700 font-medium">
                  Local do Acidente *
                </Label>
                <Input
                  id="localAcidente"
                  placeholder="Descreva o local onde ocorreu o acidente"
                  value={formData.localAcidente}
                  onChange={(e) => handleInputChange('localAcidente', e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="partesCorpo" className="text-gray-700 font-medium">
                  Partes do Corpo Afetadas
                </Label>
                <Input
                  id="partesCorpo"
                  placeholder="Ex: Mão direita, joelho esquerdo, etc."
                  value={formData.partesCorpo}
                  onChange={(e) => handleInputChange('partesCorpo', e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao" className="text-gray-700 font-medium">
                  Descrição do Acidente *
                </Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva detalhadamente como ocorreu o acidente"
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  required
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="testemunhas" className="text-gray-700 font-medium">
                    Testemunhas
                  </Label>
                  <Input
                    id="testemunhas"
                    placeholder="Nome e contato das testemunhas"
                    value={formData.testemunhas}
                    onChange={(e) => handleInputChange('testemunhas', e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primeirosCorros" className="text-gray-700 font-medium">
                    Primeiros Socorros
                  </Label>
                  <Input
                    id="primeirosCorros"
                    placeholder="Descreva os primeiros socorros prestados"
                    value={formData.primeirosCorros}
                    onChange={(e) => handleInputChange('primeirosCorros', e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="atendimentoMedico" className="text-gray-700 font-medium">
                  Atendimento Médico
                </Label>
                <Input
                  id="atendimentoMedico"
                  placeholder="Hospital, clínica ou médico que prestou atendimento"
                  value={formData.atendimentoMedico}
                  onChange={(e) => handleInputChange('atendimentoMedico', e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes" className="text-gray-700 font-medium">
                  Observações Adicionais
                </Label>
                <Textarea
                  id="observacoes"
                  placeholder="Outras informações relevantes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-orange-800">
                  <strong>Importante:</strong> Em caso de acidentes graves, priorize sempre o atendimento médico imediato e o acionamento do SAMU (192).
                </AlertDescription>
              </Alert>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white h-12"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enviando...' : 'Comunicar Acidente'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AcidentesTrabalhoSC;