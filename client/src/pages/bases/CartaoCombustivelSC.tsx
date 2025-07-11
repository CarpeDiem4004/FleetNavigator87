import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, ArrowLeft, CheckCircle, Car, Clock, MapPin } from "lucide-react";
import { Link } from 'wouter';

const CartaoCombustivelSC: React.FC = () => {
  const [formData, setFormData] = useState({
    tipoSolicitacao: '',
    numeroCartao: '',
    placaVeiculo: '',
    nomeMotorista: '',
    valorSolicitado: '',
    justificativa: '',
    horarioAbastecimento: '',
    localPreferencia: '',
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
          tipoSolicitacao: '',
          numeroCartao: '',
          placaVeiculo: '',
          nomeMotorista: '',
          valorSolicitado: '',
          justificativa: '',
          horarioAbastecimento: '',
          localPreferencia: '',
          observacoes: ''
        });
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">
                Solicitação Enviada!
              </h2>
              <p className="text-gray-600">
                Sua solicitação de cartão combustível foi enviada com sucesso e está aguardando retorno da gestão de combustível.
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
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 py-8">
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
              <CreditCard className="h-10 w-10 text-cyan-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Cartão Combustível
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
              Solicitação de Recarga de Saldo
            </CardTitle>
            <CardDescription className="text-gray-600">
              Solicite recarga de saldo para cartões de combustível
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="tipoSolicitacao" className="text-gray-700 font-medium">
                    Tipo de Solicitação *
                  </Label>
                  <Select onValueChange={(value) => handleInputChange('tipoSolicitacao', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recarga-saldo">Recarga de Saldo</SelectItem>
                      <SelectItem value="novo-cartao">Novo Cartão</SelectItem>
                      <SelectItem value="substituicao">Substituição de Cartão</SelectItem>
                      <SelectItem value="desbloqueio">Desbloqueio de Cartão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numeroCartao" className="text-gray-700 font-medium">
                    Número do Cartão
                  </Label>
                  <Input
                    id="numeroCartao"
                    placeholder="Ex: 1234567890123456"
                    value={formData.numeroCartao}
                    onChange={(e) => handleInputChange('numeroCartao', e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="placaVeiculo" className="text-gray-700 font-medium">
                    Placa do Veículo *
                  </Label>
                  <Input
                    id="placaVeiculo"
                    placeholder="Ex: ABC1234"
                    value={formData.placaVeiculo}
                    onChange={(e) => handleInputChange('placaVeiculo', e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nomeMotorista" className="text-gray-700 font-medium">
                    Nome do Motorista *
                  </Label>
                  <Input
                    id="nomeMotorista"
                    placeholder="Nome completo"
                    value={formData.nomeMotorista}
                    onChange={(e) => handleInputChange('nomeMotorista', e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valorSolicitado" className="text-gray-700 font-medium">
                    Valor Solicitado *
                  </Label>
                  <Input
                    id="valorSolicitado"
                    type="number"
                    step="0.01"
                    placeholder="R$ 0,00"
                    value={formData.valorSolicitado}
                    onChange={(e) => handleInputChange('valorSolicitado', e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horarioAbastecimento" className="text-gray-700 font-medium">
                    Horário de Abastecimento *
                  </Label>
                  <Select onValueChange={(value) => handleInputChange('horarioAbastecimento', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o horário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="antes-17h">Antes das 17h</SelectItem>
                      <SelectItem value="apos-18h">Após as 18h</SelectItem>
                      <SelectItem value="qualquer-horario">Qualquer horário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="localPreferencia" className="text-gray-700 font-medium">
                  Local de Preferência para Abastecimento
                </Label>
                <Input
                  id="localPreferencia"
                  placeholder="Ex: Posto Shell - Av. Principal, 123"
                  value={formData.localPreferencia}
                  onChange={(e) => handleInputChange('localPreferencia', e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="justificativa" className="text-gray-700 font-medium">
                  Justificativa *
                </Label>
                <Textarea
                  id="justificativa"
                  placeholder="Descreva o motivo da solicitação"
                  value={formData.justificativa}
                  onChange={(e) => handleInputChange('justificativa', e.target.value)}
                  required
                  rows={3}
                  className="resize-none"
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

              <Alert className="border-cyan-200 bg-cyan-50">
                <CreditCard className="h-4 w-4" />
                <AlertDescription className="text-cyan-800">
                  <strong>Importante:</strong> Todas as solicitações são analisadas pela gestão de combustível. O prazo para aprovação é de até 48 horas úteis.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white h-12"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enviando...' : 'Solicitar Recarga'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CartaoCombustivelSC;