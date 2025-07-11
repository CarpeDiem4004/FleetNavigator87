import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ArrowLeft, CheckCircle, History, FileText, Calendar, DollarSign, Clock, User, Car } from "lucide-react";
import { Link } from 'wouter';

interface SolicitacaoHistorico {
  id: string;
  tipoSolicitacao: string;
  numeroCartao: string;
  placaVeiculo: string;
  nomeMotorista: string;
  valorSolicitado: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  dataSolicitacao: string;
  dataResposta?: string;
  justificativa: string;
  observacoes?: string;
  observacoesGestao?: string;
}

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
  const [historico, setHistorico] = useState<SolicitacaoHistorico[]>([]);
  const [activeTab, setActiveTab] = useState('nova-solicitacao');

  useEffect(() => {
    // Carregar histórico de solicitações - simulando dados para demonstração
    const historicoMock: SolicitacaoHistorico[] = [
      {
        id: '1',
        tipoSolicitacao: 'Recarga de Saldo',
        numeroCartao: '1234567890123456',
        placaVeiculo: 'ABC1234',
        nomeMotorista: 'João Silva',
        valorSolicitado: '500.00',
        status: 'aprovado',
        dataSolicitacao: '2025-07-10T09:00:00Z',
        dataResposta: '2025-07-10T14:30:00Z',
        justificativa: 'Necessário para entregas da semana',
        observacoes: 'Urgente para rota SP-RJ',
        observacoesGestao: 'Aprovado conforme cronograma'
      },
      {
        id: '2',
        tipoSolicitacao: 'Novo Cartão',
        numeroCartao: '',
        placaVeiculo: 'XYZ5678',
        nomeMotorista: 'Maria Santos',
        valorSolicitado: '300.00',
        status: 'pendente',
        dataSolicitacao: '2025-07-11T08:15:00Z',
        justificativa: 'Novo funcionário contratado',
        observacoes: 'Primeira solicitação do motorista'
      },
      {
        id: '3',
        tipoSolicitacao: 'Substituição de Cartão',
        numeroCartao: '9876543210987654',
        placaVeiculo: 'DEF9012',
        nomeMotorista: 'Carlos Oliveira',
        valorSolicitado: '200.00',
        status: 'rejeitado',
        dataSolicitacao: '2025-07-09T16:45:00Z',
        dataResposta: '2025-07-10T10:00:00Z',
        justificativa: 'Cartão danificado',
        observacoes: 'Cartão foi danificado em acidente menor',
        observacoesGestao: 'Necessário relatório de ocorrência'
      }
    ];
    setHistorico(historicoMock);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Aprovado</Badge>;
      case 'rejeitado':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejeitado</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Desconhecido</Badge>;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simular envio para API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Adicionar nova solicitação ao histórico
      const novaSolicitacao: SolicitacaoHistorico = {
        id: Date.now().toString(),
        tipoSolicitacao: formData.tipoSolicitacao,
        numeroCartao: formData.numeroCartao,
        placaVeiculo: formData.placaVeiculo,
        nomeMotorista: formData.nomeMotorista,
        valorSolicitado: formData.valorSolicitado,
        status: 'pendente',
        dataSolicitacao: new Date().toISOString(),
        justificativa: formData.justificativa,
        observacoes: formData.observacoes || undefined
      };
      
      setHistorico(prev => [novaSolicitacao, ...prev]);
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
        setActiveTab('historico');
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
              <p className="text-sm text-gray-500">
                Você será redirecionado para o histórico automaticamente...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
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
            <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
              <CreditCard className="h-6 w-6" />
              Gestão de Cartão Combustível
            </CardTitle>
            <CardDescription className="text-gray-600">
              Solicite recarga de saldo e acompanhe suas solicitações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="nova-solicitacao" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Nova Solicitação
                </TabsTrigger>
                <TabsTrigger value="historico" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Histórico ({historico.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="nova-solicitacao" className="mt-6">
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
              </TabsContent>

              <TabsContent value="historico" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Histórico de Solicitações</h3>
                    <Badge variant="outline" className="text-cyan-600">
                      {historico.length} solicitações
                    </Badge>
                  </div>
                  
                  {historico.length === 0 ? (
                    <Card className="border-2 border-dashed border-gray-200">
                      <CardContent className="pt-6">
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-lg font-medium">Nenhuma solicitação encontrada</p>
                          <p className="text-sm">Suas solicitações de cartão combustível aparecerão aqui</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {historico.map((solicitacao) => (
                        <Card key={solicitacao.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-cyan-100 rounded-lg">
                                  <CreditCard className="h-5 w-5 text-cyan-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{solicitacao.tipoSolicitacao}</h4>
                                  <p className="text-sm text-gray-500">ID: {solicitacao.id}</p>
                                </div>
                              </div>
                              {getStatusBadge(solicitacao.status)}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                              <div className="flex items-center gap-2">
                                <Car className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">Placa: {solicitacao.placaVeiculo}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">Motorista: {solicitacao.nomeMotorista}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">Valor: R$ {solicitacao.valorSolicitado}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">Solicitação: {formatDate(solicitacao.dataSolicitacao)}</span>
                              </div>
                              {solicitacao.dataResposta && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">Resposta: {formatDate(solicitacao.dataResposta)}</span>
                                </div>
                              )}
                              {solicitacao.numeroCartao && (
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">Cartão: ****{solicitacao.numeroCartao.slice(-4)}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <div>
                                <span className="text-sm font-medium text-gray-700">Justificativa:</span>
                                <p className="text-sm text-gray-600 mt-1">{solicitacao.justificativa}</p>
                              </div>
                              {solicitacao.observacoes && (
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Observações:</span>
                                  <p className="text-sm text-gray-600 mt-1">{solicitacao.observacoes}</p>
                                </div>
                              )}
                              {solicitacao.observacoesGestao && (
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Observações da Gestão:</span>
                                  <p className="text-sm text-gray-600 mt-1">{solicitacao.observacoesGestao}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CartaoCombustivelSC;