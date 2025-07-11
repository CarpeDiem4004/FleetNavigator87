import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ArrowLeft, CheckCircle, Upload } from "lucide-react";
import { Link } from 'wouter';

const SinistrosSC: React.FC = () => {
  const [formData, setFormData] = useState({
    tipoOcorrencia: '',
    placa: '',
    motorista: '',
    dataHora: '',
    localOcorrencia: '',
    descricao: '',
    danos: '',
    autoridades: '',
    testemunhas: '',
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
          tipoOcorrencia: '',
          placa: '',
          motorista: '',
          dataHora: '',
          localOcorrencia: '',
          descricao: '',
          danos: '',
          autoridades: '',
          testemunhas: '',
          observacoes: ''
        });
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Erro ao enviar sinistro:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">
                Sinistro Comunicado!
              </h2>
              <p className="text-gray-600">
                Sua comunicação de sinistro foi enviada com sucesso. A gestão de frota será notificada.
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 py-8">
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
              <AlertTriangle className="h-10 w-10 text-red-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Comunicação de Sinistro
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
              Registrar Sinistro ou Roubo
            </CardTitle>
            <CardDescription className="text-gray-600">
              Preencha todas as informações disponíveis sobre o incidente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="tipoOcorrencia" className="text-gray-700 font-medium">
                    Tipo de Ocorrência *
                  </Label>
                  <Select onValueChange={(value) => handleInputChange('tipoOcorrencia', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="roubo">Roubo</SelectItem>
                      <SelectItem value="furto">Furto</SelectItem>
                      <SelectItem value="colisao">Colisão</SelectItem>
                      <SelectItem value="capotamento">Capotamento</SelectItem>
                      <SelectItem value="incendio">Incêndio</SelectItem>
                      <SelectItem value="vandalismo">Vandalismo</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="placa" className="text-gray-700 font-medium">
                    Placa do Veículo *
                  </Label>
                  <Input
                    id="placa"
                    placeholder="Ex: ABC1234"
                    value={formData.placa}
                    onChange={(e) => handleInputChange('placa', e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motorista" className="text-gray-700 font-medium">
                    Nome do Motorista *
                  </Label>
                  <Input
                    id="motorista"
                    placeholder="Nome completo"
                    value={formData.motorista}
                    onChange={(e) => handleInputChange('motorista', e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataHora" className="text-gray-700 font-medium">
                    Data e Hora *
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="localOcorrencia" className="text-gray-700 font-medium">
                  Local da Ocorrência *
                </Label>
                <Input
                  id="localOcorrencia"
                  placeholder="Endereço completo, pontos de referência"
                  value={formData.localOcorrencia}
                  onChange={(e) => handleInputChange('localOcorrencia', e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao" className="text-gray-700 font-medium">
                  Descrição do Ocorrido *
                </Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva detalhadamente como ocorreu o incidente"
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  required
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="danos" className="text-gray-700 font-medium">
                  Danos Identificados
                </Label>
                <Textarea
                  id="danos"
                  placeholder="Descreva os danos materiais identificados"
                  value={formData.danos}
                  onChange={(e) => handleInputChange('danos', e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="autoridades" className="text-gray-700 font-medium">
                    Autoridades Acionadas
                  </Label>
                  <Input
                    id="autoridades"
                    placeholder="Ex: Polícia Militar, Polícia Civil"
                    value={formData.autoridades}
                    onChange={(e) => handleInputChange('autoridades', e.target.value)}
                    className="h-11"
                  />
                </div>

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

              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  <strong>Importante:</strong> Em caso de acidentes com vítimas, priorize sempre o atendimento médico e o acionamento das autoridades competentes.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white h-12"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enviando...' : 'Comunicar Sinistro'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SinistrosSC;