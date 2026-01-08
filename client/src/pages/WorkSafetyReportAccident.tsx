import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle, Phone, User, Mail, Clock, Shield, FileText, Users, AlertCircle, Leaf, Wrench } from 'lucide-react';
import { Link } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const OPERACOES = [
  'Coca-Cola Femsa',
  'Mercado Livre (MELI)',
  'Shopee',
  'Pet Love',
  'Natura',
  'Madeira Madeira',
  'Oxco',
  'Grupo Pereira',
  'Magalu',
  'Royal Canin',
  'Cacau Show',
  'Murici (administrativo)',
  'Outro'
];

export default function WorkSafetyReportAccident() {
  const { toast } = useToast();
  const [currentSection, setCurrentSection] = useState(1);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    operacao: '',
    operacaoOutro: '',
    reportadoPor: '',
    emailCorporativo: '',
    telefoneWhatsApp: '',
    tipoOcorrencia: '' as 'acidente' | 'quase_acidente' | 'danos_materiais' | 'danos_ambientais' | '',
    dataHoraOcorrencia: '',
    localOcorrencia: '',
    descricaoOcorrencia: '',
    houveVitima: '',
    descricaoVitima: '',
    motoristaNome: '',
    placaVeiculo: '',
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/work-safety/accidents', {
        operacao: data.operacao === 'Outro' ? data.operacaoOutro : data.operacao,
        reportado_por: data.reportadoPor,
        email_corporativo: data.emailCorporativo,
        telefone_whatsapp: data.telefoneWhatsApp,
        tipo_ocorrencia: data.tipoOcorrencia,
        data_hora_ocorrencia: data.dataHoraOcorrencia,
        local_ocorrencia: data.localOcorrencia,
        descricao_ocorrencia: data.descricaoOcorrencia,
        houve_vitima: data.houveVitima === 'sim',
        descricao_vitima: data.descricaoVitima,
        motorista_nome: data.motoristaNome,
        placa_veiculo: data.placaVeiculo,
      });
      return response;
    },
    onSuccess: () => {
      setSuccess(true);
      toast({
        title: 'Ocorrência registrada!',
        description: 'A comunicação foi registrada com sucesso no sistema.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao registrar',
        description: error.message || 'Ocorreu um erro ao registrar a ocorrência.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.operacao || !formData.reportadoPor || !formData.emailCorporativo || !formData.telefoneWhatsApp) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }
    if (!formData.tipoOcorrencia || !formData.dataHoraOcorrencia || !formData.localOcorrencia || !formData.descricaoOcorrencia) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos da ocorrência.',
        variant: 'destructive',
      });
      return;
    }
    mutation.mutate(formData);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const canAdvanceToSection2 = () => {
    return true;
  };

  const canAdvanceToSection3 = () => {
    if (!formData.operacao) return false;
    if (formData.operacao === 'Outro' && !formData.operacaoOutro) return false;
    if (!formData.reportadoPor || !formData.emailCorporativo || !formData.telefoneWhatsApp) return false;
    return true;
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto bg-green-100 rounded-full p-4 mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700">Comunicação Registrada!</CardTitle>
            <CardDescription>
              A ocorrência foi comunicada com sucesso. A equipe de Segurança do Trabalho irá analisar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/work-safety/portal">
              <Button className="w-full" data-testid="button-back-portal">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Portal
              </Button>
            </Link>
            <Button variant="outline" className="w-full" onClick={() => {
              setSuccess(false);
              setCurrentSection(1);
              setFormData({
                operacao: '',
                operacaoOutro: '',
                reportadoPor: '',
                emailCorporativo: '',
                telefoneWhatsApp: '',
                tipoOcorrencia: '',
                dataHoraOcorrencia: '',
                localOcorrencia: '',
                descricaoOcorrencia: '',
                houveVitima: '',
                descricaoVitima: '',
                motoristaNome: '',
                placaVeiculo: '',
              });
            }} data-testid="button-new-report">
              Registrar Nova Comunicação
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6">
          <Link href="/work-safety/portal">
            <Button variant="ghost" className="text-white hover:bg-white/20" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Portal
            </Button>
          </Link>
        </div>

        <Card className="shadow-xl mb-4">
          <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8" />
              <div>
                <CardTitle className="text-2xl">ACIDENTES & INCIDENTES MURICI</CardTitle>
                <CardDescription className="text-red-100">
                  Comunicação de Ocorrências de Segurança do Trabalho
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentSection >= 1 ? 'bg-white text-blue-600' : 'bg-white/30 text-white'} font-bold`}>1</div>
          <div className={`w-12 h-1 ${currentSection >= 2 ? 'bg-white' : 'bg-white/30'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentSection >= 2 ? 'bg-white text-blue-600' : 'bg-white/30 text-white'} font-bold`}>2</div>
          <div className={`w-12 h-1 ${currentSection >= 3 ? 'bg-white' : 'bg-white/30'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentSection >= 3 ? 'bg-white text-blue-600' : 'bg-white/30 text-white'} font-bold`}>3</div>
        </div>

        {currentSection === 1 && (
          <Card className="shadow-xl">
            <CardHeader className="border-b">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">Seção 1 de 3</div>
              </div>
              <CardTitle className="text-xl mt-2">Informações Importantes</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
                  <Clock className="h-5 w-5" />
                  PRAZO DE ENVIO DAS INFORMAÇÕES: 4 horas (a partir do momento da ocorrência)
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Deverão ser reportadas aqui:</h3>
                
                <div className="grid gap-3">
                  <div className="flex gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-red-700">Acidentes:</span>
                      <span className="text-gray-700"> ocorrências que causem lesões ou fatalidade ao motorista e/ou terceiros;</span>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-orange-700">Quase Acidentes (Near Miss):</span>
                      <span className="text-gray-700"> ocorrências que possuem potencial de causar lesão ou morte ao motorista e/ou terceiros, como queda de materiais, falha no equipamento, etc;</span>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                    <Wrench className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-yellow-700">Danos Materiais:</span>
                      <span className="text-gray-700"> ocorrências que não possuem potencial de lesão, mas que resultou em avaria do veículo, equipamentos, estruturas ou pacotes;</span>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                    <Leaf className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-green-700">Danos Ambientais:</span>
                      <span className="text-gray-700"> ocorrências que não possuem potencial de lesão, mas que resultou em danos ao meio ambiente (contaminação do solo, do ar, da água, poluição, etc).</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm">
                  Em caso de dúvidas, entre em contato com a Segurança do Trabalho.
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border">
                <h4 className="font-semibold text-gray-800 mb-4 text-center">Fluxo de Comunicação de Acidente</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-center text-sm">
                  <div className="bg-blue-600 text-white rounded-lg p-3">
                    <div className="font-bold mb-1">1° COMUNICAÇÃO</div>
                    <div className="text-xs opacity-90">Comunique imediatamente o trabalho e sinistro através do registro desta COLISÃO ou MURICI ACIDENTES</div>
                  </div>
                  <div className="bg-blue-500 text-white rounded-lg p-3">
                    <div className="font-bold mb-1">2° INFORMAÇÕES</div>
                    <div className="text-xs opacity-90">Coletar todas as informações da ocorrência de forma detalhada</div>
                  </div>
                  <div className="bg-blue-400 text-white rounded-lg p-3">
                    <div className="font-bold mb-1">3° REPORTE</div>
                    <div className="text-xs opacity-90">Realizar o preenchimento do forms, no prazo de 6hrs</div>
                  </div>
                  <div className="bg-green-600 text-white rounded-lg p-3">
                    <div className="font-bold mb-1">4° COLETA DE DADOS</div>
                    <div className="text-xs opacity-90">Envio de fotos, enviando informações comportamentais para INVESTIGAÇÃO DO ACIDENTE</div>
                  </div>
                  <div className="bg-green-500 text-white rounded-lg p-3">
                    <div className="font-bold mb-1">5° TREINAMENTOS</div>
                    <div className="text-xs opacity-90">Checar se o colaborador envolvido na ocorrência está com todos os treinamentos realizados</div>
                  </div>
                  <div className="bg-green-400 text-white rounded-lg p-3">
                    <div className="font-bold mb-1">6° REUNIÃO</div>
                    <div className="text-xs opacity-90">Participação na reunião de investigação de acidente</div>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => setCurrentSection(2)}
                data-testid="button-next-section-1"
              >
                Continuar para a próxima seção
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {currentSection === 2 && (
          <Card className="shadow-xl">
            <CardHeader className="border-b">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">Seção 2 de 3</div>
              </div>
              <CardTitle className="text-xl mt-2">Formulário de Registro de Ocorrência | Operações Murici</CardTitle>
              <CardDescription>Atenção às descrições, pois orientam como devem ser feitos os preenchimentos.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-semibold">Operação *</Label>
                <RadioGroup
                  value={formData.operacao}
                  onValueChange={(v) => setFormData({...formData, operacao: v})}
                  className="grid grid-cols-1 md:grid-cols-2 gap-2"
                >
                  {OPERACOES.map((op) => (
                    <div key={op} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value={op} id={`op-${op}`} data-testid={`radio-operacao-${op.toLowerCase().replace(/[^a-z]/g, '-')}`} />
                      <Label htmlFor={`op-${op}`} className="font-normal cursor-pointer flex-1">{op}</Label>
                    </div>
                  ))}
                </RadioGroup>

                {formData.operacao === 'Outro' && (
                  <div className="ml-6 space-y-2">
                    <Label htmlFor="operacaoOutro">Especifique a operação *</Label>
                    <Input
                      id="operacaoOutro"
                      placeholder="Digite o nome da operação"
                      value={formData.operacaoOutro}
                      onChange={(e) => setFormData({...formData, operacaoOutro: e.target.value})}
                      data-testid="input-operacao-outro"
                    />
                  </div>
                )}
              </div>

              <div className="border-t pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reportadoPor" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Reportado Por *
                  </Label>
                  <p className="text-sm text-gray-500">Nome completo da pessoa que está registrando essa comunicação.</p>
                  <Input
                    id="reportadoPor"
                    placeholder="Texto de resposta curta"
                    value={formData.reportadoPor}
                    onChange={(e) => setFormData({...formData, reportadoPor: e.target.value})}
                    data-testid="input-reportado-por"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailCorporativo" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    E-mail Corporativo *
                  </Label>
                  <Input
                    id="emailCorporativo"
                    type="email"
                    placeholder="Texto de resposta curta"
                    value={formData.emailCorporativo}
                    onChange={(e) => setFormData({...formData, emailCorporativo: e.target.value})}
                    data-testid="input-email-corporativo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefoneWhatsApp" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone (WhatsApp) *
                  </Label>
                  <Input
                    id="telefoneWhatsApp"
                    placeholder="(00) 00000-0000"
                    value={formData.telefoneWhatsApp}
                    onChange={(e) => setFormData({...formData, telefoneWhatsApp: formatPhone(e.target.value)})}
                    data-testid="input-telefone-whatsapp"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCurrentSection(1)}
                  data-testid="button-back-section-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    if (canAdvanceToSection3()) {
                      setCurrentSection(3);
                    } else {
                      toast({
                        title: 'Campos obrigatórios',
                        description: 'Por favor, preencha todos os campos obrigatórios.',
                        variant: 'destructive',
                      });
                    }
                  }}
                  data-testid="button-next-section-2"
                >
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentSection === 3 && (
          <Card className="shadow-xl">
            <CardHeader className="border-b">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">Seção 3 de 3</div>
              </div>
              <CardTitle className="text-xl mt-2">Detalhes da Ocorrência</CardTitle>
              <CardDescription>Preencha os detalhes do acidente/incidente.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Tipo de Ocorrência *</Label>
                  <RadioGroup
                    value={formData.tipoOcorrencia}
                    onValueChange={(v) => setFormData({...formData, tipoOcorrencia: v as any})}
                    className="grid grid-cols-1 md:grid-cols-2 gap-2"
                  >
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100">
                      <RadioGroupItem value="acidente" id="tipo-acidente" data-testid="radio-tipo-acidente" />
                      <Label htmlFor="tipo-acidente" className="font-normal cursor-pointer flex-1">
                        <span className="font-semibold text-red-700">Acidente</span>
                        <p className="text-xs text-gray-600">Lesões ou fatalidade</p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100">
                      <RadioGroupItem value="quase_acidente" id="tipo-quase" data-testid="radio-tipo-quase" />
                      <Label htmlFor="tipo-quase" className="font-normal cursor-pointer flex-1">
                        <span className="font-semibold text-orange-700">Quase Acidente (Near Miss)</span>
                        <p className="text-xs text-gray-600">Potencial de causar lesão</p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-yellow-200 bg-yellow-50 hover:bg-yellow-100">
                      <RadioGroupItem value="danos_materiais" id="tipo-danos" data-testid="radio-tipo-danos" />
                      <Label htmlFor="tipo-danos" className="font-normal cursor-pointer flex-1">
                        <span className="font-semibold text-yellow-700">Danos Materiais</span>
                        <p className="text-xs text-gray-600">Avaria em veículo/equipamentos</p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100">
                      <RadioGroupItem value="danos_ambientais" id="tipo-ambientais" data-testid="radio-tipo-ambientais" />
                      <Label htmlFor="tipo-ambientais" className="font-normal cursor-pointer flex-1">
                        <span className="font-semibold text-green-700">Danos Ambientais</span>
                        <p className="text-xs text-gray-600">Contaminação/poluição</p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataHoraOcorrencia">Data e Hora da Ocorrência *</Label>
                    <Input
                      id="dataHoraOcorrencia"
                      type="datetime-local"
                      value={formData.dataHoraOcorrencia}
                      onChange={(e) => setFormData({...formData, dataHoraOcorrencia: e.target.value})}
                      data-testid="input-data-hora"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="localOcorrencia">Local da Ocorrência *</Label>
                    <Input
                      id="localOcorrencia"
                      placeholder="Endereço ou descrição do local"
                      value={formData.localOcorrencia}
                      onChange={(e) => setFormData({...formData, localOcorrencia: e.target.value})}
                      data-testid="input-local"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="motoristaNome">Nome do Motorista Envolvido</Label>
                    <Input
                      id="motoristaNome"
                      placeholder="Nome completo (opcional)"
                      value={formData.motoristaNome}
                      onChange={(e) => setFormData({...formData, motoristaNome: e.target.value})}
                      data-testid="input-motorista"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="placaVeiculo">Placa do Veículo</Label>
                    <Input
                      id="placaVeiculo"
                      placeholder="ABC-1234 (opcional)"
                      value={formData.placaVeiculo}
                      onChange={(e) => setFormData({...formData, placaVeiculo: e.target.value.toUpperCase()})}
                      data-testid="input-placa"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricaoOcorrencia">Descrição da Ocorrência *</Label>
                  <Textarea
                    id="descricaoOcorrencia"
                    placeholder="Descreva detalhadamente o que aconteceu..."
                    rows={4}
                    value={formData.descricaoOcorrencia}
                    onChange={(e) => setFormData({...formData, descricaoOcorrencia: e.target.value})}
                    data-testid="textarea-descricao"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Houve Vítima? *</Label>
                  <RadioGroup
                    value={formData.houveVitima}
                    onValueChange={(v) => setFormData({...formData, houveVitima: v})}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sim" id="vitima-sim" data-testid="radio-vitima-sim" />
                      <Label htmlFor="vitima-sim" className="font-normal cursor-pointer">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="nao" id="vitima-nao" data-testid="radio-vitima-nao" />
                      <Label htmlFor="vitima-nao" className="font-normal cursor-pointer">Não</Label>
                    </div>
                  </RadioGroup>

                  {formData.houveVitima === 'sim' && (
                    <div className="ml-6 space-y-2">
                      <Label htmlFor="descricaoVitima">Descreva a situação da vítima</Label>
                      <Textarea
                        id="descricaoVitima"
                        placeholder="Estado de saúde, tipo de lesão, atendimento médico..."
                        rows={3}
                        value={formData.descricaoVitima}
                        onChange={(e) => setFormData({...formData, descricaoVitima: e.target.value})}
                        data-testid="textarea-vitima"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setCurrentSection(2)}
                    data-testid="button-back-section-2"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    disabled={mutation.isPending}
                    data-testid="button-submit"
                  >
                    {mutation.isPending ? 'Registrando...' : 'Registrar Ocorrência'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="text-center mt-6 text-white/80 text-sm">
          <Shield className="inline h-4 w-4 mr-1" />
          Murici Transportes - Segurança em primeiro lugar
        </div>
      </div>
    </div>
  );
}
