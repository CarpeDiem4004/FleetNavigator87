import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle, Phone, User, Mail, Clock, Shield, Car, Users, Stethoscope, FileText, Building2, MapPin, Calendar, Truck, UserCircle, ClipboardList } from 'lucide-react';
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

const MILHAS = [
  { value: 'first_mile_fm', label: 'First Mile - FM' },
  { value: 'melione_fm', label: 'Melione - FM' },
  { value: 'line_haul_lh', label: 'Line Haul - LH' },
  { value: 'last_mile_lm', label: 'Last Mile - LM' },
  { value: 'middle_mile_mm', label: 'Middle Mile - MM' },
  { value: 'na', label: 'N/A' }
];

const REGIONAIS = [
  'MEGAS OTR', 'SPI', 'SPII', 'SPIII', 'FULLFBM', 'SPIO', 'RIES', 'MG', 'NONECO', 'SUL', 'N/A'
];

const CAUSAS_IMEDIATAS = [
  'Agressão Física',
  'Assalto',
  'Ataque de animais',
  'Atropelamento de animal',
  'Atropelamento de Pedestre',
  'Capotamento',
  'Colisão Frontal',
  'Colisão Traseira',
  'Colisão Lateral',
  'Engavetamento',
  'Incêndio',
  'Mal súbito',
  'Tombamento',
  'Colisão com objeto/estrutura',
  'Não relacionado ao trânsito (Queda, torção, pega inadequada de pacotes, etc.)'
];

const MODELOS_VEICULO = [
  'Caminhão',
  'Carreta',
  'Fiorino',
  'Motocicleta',
  'Utilitário',
  'Van Branca/Murici',
  'Van Amarela Meli (Adesivada)',
  'Veículo de Passeio',
  'N/A'
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
    coordenadorBase: '',
    nomeResponsavelMeli: '',
    milha: '',
    regional: '',
    baseUnidade: '',
    enderecoOcorrencia: '',
    idRota: '',
    transitTimeOrh: '',
    inicioRota: '',
    dataOcorrencia: '',
    horarioOcorrencia: '',
    causaImediata: '',
    descricaoDetalhada: '',
    placaVeiculo: '',
    modeloVeiculo: '',
    anoVeiculo: '',
    frotaFixa: '',
    tipoFrota: '',
    tipoFrotaOutro: '',
    terceiroEnvolvido: '',
    nomeColaborador: '',
    idMatricula: '',
    funcao: '',
    funcaoOutro: '',
    idade: '',
    contratacao: '',
    contratacaoOutro: '',
    dataAdmissao: '',
    dataPrimeiraHabilitacao: '',
    partesCorpoAtingidas: '',
    diasAfastado: '',
    foiSocorrido: '',
    atendimentoMedico: '',
    localAtendimento: '',
    houveInternacao: '',
    nomeMedicoCrm: '',
    cid: '',
    registroPolicial: '',
    protocoloBO: '',
    estadoSaudeEnvolvidos: '',
  });

  const isMeliOperation = formData.operacao === 'Mercado Livre (MELI)';

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/work-safety/accidents', {
        operacao: data.operacao === 'Outro' ? data.operacaoOutro : data.operacao,
        reportado_por: data.reportadoPor,
        email_corporativo: data.emailCorporativo,
        telefone_whatsapp: data.telefoneWhatsApp,
        coordenador_base: data.coordenadorBase,
        nome_responsavel_meli: data.nomeResponsavelMeli,
        milha: data.milha,
        regional: data.regional,
        base_unidade: data.baseUnidade,
        endereco_ocorrencia: data.enderecoOcorrencia,
        id_rota: data.idRota,
        transit_time_orh: data.transitTimeOrh,
        inicio_rota: data.inicioRota,
        data_ocorrencia: data.dataOcorrencia,
        horario_ocorrencia: data.horarioOcorrencia,
        causa_imediata: data.causaImediata,
        descricao_detalhada: data.descricaoDetalhada,
        placa_veiculo: data.placaVeiculo,
        modelo_veiculo: data.modeloVeiculo,
        ano_veiculo: data.anoVeiculo,
        frota_fixa: data.frotaFixa,
        tipo_frota: data.tipoFrota === 'Outro' ? data.tipoFrotaOutro : data.tipoFrota,
        terceiro_envolvido: data.terceiroEnvolvido === 'sim',
        nome_colaborador: data.nomeColaborador,
        id_matricula: data.idMatricula,
        funcao: data.funcao === 'Outro' ? data.funcaoOutro : data.funcao,
        idade: data.idade,
        contratacao: data.contratacao === 'Outro' ? data.contratacaoOutro : data.contratacao,
        data_admissao: data.dataAdmissao,
        data_primeira_habilitacao: data.dataPrimeiraHabilitacao,
        partes_corpo_atingidas: data.partesCorpoAtingidas,
        dias_afastado: data.diasAfastado,
        foi_socorrido: data.foiSocorrido,
        atendimento_medico: data.atendimentoMedico,
        local_atendimento: data.localAtendimento,
        houve_internacao: data.houveInternacao,
        nome_medico_crm: data.nomeMedicoCrm,
        cid: data.cid,
        registro_policial: data.registroPolicial,
        protocolo_bo: data.protocoloBO,
        estado_saude_envolvidos: data.estadoSaudeEnvolvidos,
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
    mutation.mutate(formData);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const totalSections = 7;

  const validateSection2 = () => {
    const required = [
      { field: formData.operacao, name: 'Operação' },
      { field: formData.reportadoPor, name: 'Reportado Por' },
      { field: formData.emailCorporativo, name: 'E-mail Corporativo' },
      { field: formData.telefoneWhatsApp, name: 'Telefone WhatsApp' },
      { field: formData.coordenadorBase, name: 'Coordenador da Base' },
    ];
    const missing = required.filter(r => !r.field.trim());
    if (missing.length > 0) {
      toast({ title: 'Campos obrigatórios', description: `Preencha: ${missing.map(m => m.name).join(', ')}`, variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validateSection3 = () => {
    const required = [
      { field: formData.milha, name: 'Milha' },
      { field: formData.regional, name: 'Regional' },
      { field: formData.baseUnidade, name: 'Base/Unidade' },
      { field: formData.enderecoOcorrencia, name: 'Endereço da Ocorrência' },
    ];
    const missing = required.filter(r => !r.field.trim());
    if (missing.length > 0) {
      toast({ title: 'Campos obrigatórios', description: `Preencha: ${missing.map(m => m.name).join(', ')}`, variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validateSection4 = () => {
    const required = [
      { field: formData.dataOcorrencia, name: 'Data da Ocorrência' },
      { field: formData.horarioOcorrencia, name: 'Horário da Ocorrência' },
      { field: formData.causaImediata, name: 'Causa Imediata' },
      { field: formData.descricaoDetalhada, name: 'Descrição Detalhada' },
    ];
    const missing = required.filter(r => !r.field.trim());
    if (missing.length > 0) {
      toast({ title: 'Campos obrigatórios', description: `Preencha: ${missing.map(m => m.name).join(', ')}`, variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validateSection5 = () => {
    const required = [
      { field: formData.placaVeiculo, name: 'Placa do Veículo' },
      { field: formData.modeloVeiculo, name: 'Modelo do Veículo' },
      { field: formData.frotaFixa, name: 'Frota Fixa' },
      { field: formData.terceiroEnvolvido, name: 'Terceiro Envolvido' },
    ];
    const missing = required.filter(r => !r.field.trim());
    if (missing.length > 0) {
      toast({ title: 'Campos obrigatórios', description: `Preencha: ${missing.map(m => m.name).join(', ')}`, variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validateSection6 = () => {
    const required = [
      { field: formData.nomeColaborador, name: 'Nome do Colaborador' },
      { field: formData.funcao, name: 'Função' },
      { field: formData.contratacao, name: 'Contratação' },
    ];
    const missing = required.filter(r => !r.field.trim());
    if (missing.length > 0) {
      toast({ title: 'Campos obrigatórios', description: `Preencha: ${missing.map(m => m.name).join(', ')}`, variant: 'destructive' });
      return false;
    }
    return true;
  };

  const goToSection = (nextSection: number) => {
    if (nextSection > currentSection) {
      if (currentSection === 2 && !validateSection2()) return;
      if (currentSection === 3 && !validateSection3()) return;
      if (currentSection === 4 && !validateSection4()) return;
      if (currentSection === 5 && !validateSection5()) return;
      if (currentSection === 6 && !validateSection6()) return;
    }
    setCurrentSection(nextSection);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center bg-[#1C1C1C] border-[#333]">
          <CardHeader>
            <div className="mx-auto bg-[#0E0E0E] rounded-full p-4 mb-4 border-2 border-[#2ECC71]">
              <CheckCircle className="h-12 w-12 text-[#2ECC71]" />
            </div>
            <CardTitle className="text-2xl text-[#2ECC71]">Comunicação Registrada!</CardTitle>
            <CardDescription className="text-[#8C8C8C]">
              A ocorrência foi comunicada com sucesso. A equipe de Segurança do Trabalho irá analisar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/work-safety/portal">
              <Button className="w-full bg-[#E10613] hover:bg-[#B8050F] text-white" data-testid="button-back-portal">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Portal
              </Button>
            </Link>
            <Button variant="outline" className="w-full border-[#333] text-[#F5F5F5] hover:bg-[#333]" onClick={() => {
              setSuccess(false);
              setCurrentSection(1);
              setFormData({
                operacao: '', operacaoOutro: '', reportadoPor: '', emailCorporativo: '', telefoneWhatsApp: '',
                coordenadorBase: '', nomeResponsavelMeli: '', milha: '', regional: '', baseUnidade: '',
                enderecoOcorrencia: '', idRota: '', transitTimeOrh: '', inicioRota: '', dataOcorrencia: '',
                horarioOcorrencia: '', causaImediata: '', descricaoDetalhada: '', placaVeiculo: '',
                modeloVeiculo: '', anoVeiculo: '', frotaFixa: '', tipoFrota: '', tipoFrotaOutro: '',
                terceiroEnvolvido: '', nomeColaborador: '', idMatricula: '', funcao: '', funcaoOutro: '',
                idade: '', contratacao: '', contratacaoOutro: '', dataAdmissao: '', dataPrimeiraHabilitacao: '',
                partesCorpoAtingidas: '', diasAfastado: '', foiSocorrido: '', atendimentoMedico: '',
                localAtendimento: '', houveInternacao: '', nomeMedicoCrm: '', cid: '', registroPolicial: '',
                protocoloBO: '', estadoSaudeEnvolvidos: '',
              });
            }} data-testid="button-new-report">
              Registrar Nova Comunicação
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderProgressBar = () => (
    <div className="flex items-center justify-center gap-1 mb-6">
      {Array.from({ length: totalSections }, (_, i) => (
        <div key={i} className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
            currentSection > i + 1 ? 'bg-[#2ECC71] text-white' :
            currentSection === i + 1 ? 'bg-[#E10613] text-white' : 'bg-[#333] text-[#8C8C8C]'
          }`}>
            {currentSection > i + 1 ? '✓' : i + 1}
          </div>
          {i < totalSections - 1 && (
            <div className={`w-6 h-1 ${currentSection > i + 1 ? 'bg-[#2ECC71]' : 'bg-[#333]'}`}></div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0E0E0E] py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6">
          <Link href="/work-safety/portal">
            <Button variant="ghost" className="text-[#F5F5F5] hover:bg-[#1C1C1C]" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Portal
            </Button>
          </Link>
        </div>

        <Card className="shadow-xl mb-4 bg-[#1C1C1C] border-[#333]">
          <CardHeader className="bg-[#E10613] text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8" />
              <div>
                <CardTitle className="text-2xl">ACIDENTES & INCIDENTES MURICI</CardTitle>
                <CardDescription className="text-white/90">
                  PRAZO DE ENVIO DAS INFORMAÇÕES: 4 horas (a partir do momento da ocorrência)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {renderProgressBar()}

        {currentSection === 1 && (
          <Card className="shadow-xl bg-white border-gray-200">
            <CardHeader className="border-b bg-white">
              <CardTitle className="text-xl font-bold text-gray-900">ACIDENTES & INCIDENTES MURICI</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6 bg-white">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <p className="font-semibold text-yellow-800">
                  PRAZO PARA ENVIO DAS INFORMAÇÕES: 4 horas (a partir do momento da ocorrência)
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Deverão ser reportadas aqui:</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-2">
                    <span className="font-semibold text-red-700">• Acidentes:</span>
                    <span className="text-gray-700">ocorrências que causem lesões ou fatalidade ao motorista e/ou terceiros;</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-orange-700">• Quase Acidentes <em>(Near Miss)</em>:</span>
                    <span className="text-gray-700">ocorrências que possuem potencial de causar lesão ou morte ao motorista e/ou terceiros, como queda de materiais, falha no equipamento, etc.;</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-yellow-700">• Danos Materiais:</span>
                    <span className="text-gray-700">ocorrências que não possuem potencial de lesão, mas que resultou em avaria do veículo, equipamentos, estruturas ou pacotes;</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-green-700">• Danos Ambientais:</span>
                    <span className="text-gray-700">ocorrências que não possuem potencial de lesão, mas que resultou em danos ao meio ambiente (contaminação do solo, do ar, da água, poluição, etc).</span>
                  </li>
                </ul>
                <p className="text-sm text-gray-600 italic">Em caso de dúvidas, entre em contato com a Segurança do Trabalho.</p>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-gray-800 mb-4 text-center">Fluxo de Comunicação de Acidentes</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-[#E10613] text-white rounded-lg p-3 text-center">
                    <div className="font-bold text-sm">1° COMUNICAÇÃO</div>
                    <div className="text-[11px] mt-2">Comunicar imediatamente a equipe de segurança do trabalho e sinistro, através do reporte inicial nos grupos COLISÃO ou MURICI ACIDENTES.</div>
                  </div>
                  
                  <div className="bg-[#C70510] text-white rounded-lg p-3 text-center">
                    <div className="font-bold text-sm">2° INFORMAÇÕES</div>
                    <div className="text-[11px] mt-2">Coletar todas as informações da ocorrência de forma detalhada.</div>
                  </div>
                  
                  <div className="bg-[#A5040D] text-white rounded-lg p-3 text-center">
                    <div className="font-bold text-sm">3° REPORTE</div>
                    <div className="text-[11px] mt-2">Realizar o preenchimento do forms, no prazo de 4hs.</div>
                  </div>

                  <div className="bg-[#2ECC71] text-white rounded-lg p-3 text-center">
                    <div className="font-bold text-sm">4° COLETA DE DADOS</div>
                    <div className="text-[11px] mt-2">Enviar as fotos, atestados, BO, demais documentos e informações comportamentais para realizarmos a INVESTIGAÇÃO DO ACIDENTE.</div>
                  </div>
                  
                  <div className="bg-[#27ae60] text-white rounded-lg p-3 text-center">
                    <div className="font-bold text-sm">5° TREINAMENTOS</div>
                    <div className="text-[11px] mt-2">Checar se o colaborador envolvido na ocorrência está com todos os treinamentos realizados.</div>
                  </div>
                  
                  <div className="bg-[#1e8449] text-white rounded-lg p-3 text-center">
                    <div className="font-bold text-sm">6° REUNIÃO</div>
                    <div className="text-[11px] mt-2">Participação na reunião de investigação de acidente.</div>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full bg-[#E10613] hover:bg-[#B8050F]"
                onClick={() => setCurrentSection(2)}
              >
                Continuar para a próxima seção <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {currentSection === 2 && (
          <Card className="shadow-xl bg-white border-gray-200">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#E10613]" />
                <div className="bg-[#E10613]/10 text-[#E10613] px-3 py-1 rounded-full text-sm font-medium">Seção 2 de {totalSections}</div>
              </div>
              <CardTitle className="text-xl mt-2 text-gray-900">Formulário de Registro de Ocorrência | Operações Murici</CardTitle>
              <CardDescription className="text-gray-600">Atenção às descrições, pois orientam como devem ser feitos os preenchimentos.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6 bg-white">
              <div className="space-y-4">
                <Label className="text-base font-semibold text-gray-900">Operação *</Label>
                <RadioGroup
                  value={formData.operacao}
                  onValueChange={(v) => setFormData({...formData, operacao: v})}
                  className="grid grid-cols-1 md:grid-cols-2 gap-2"
                >
                  {OPERACOES.map((op) => (
                    <div key={op} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 border">
                      <RadioGroupItem value={op} id={`op-${op}`} />
                      <Label htmlFor={`op-${op}`} className="font-normal cursor-pointer flex-1">{op}</Label>
                    </div>
                  ))}
                </RadioGroup>
                {formData.operacao === 'Outro' && (
                  <Input
                    placeholder="Especifique a operação"
                    value={formData.operacaoOutro}
                    onChange={(e) => setFormData({...formData, operacaoOutro: e.target.value})}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-900">Reportado Por *</Label>
                  <Input
                    placeholder="Nome completo"
                    value={formData.reportadoPor}
                    onChange={(e) => setFormData({...formData, reportadoPor: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-900">E-mail Corporativo *</Label>
                  <Input
                    type="email"
                    placeholder="email@empresa.com.br"
                    value={formData.emailCorporativo}
                    onChange={(e) => setFormData({...formData, emailCorporativo: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-900">Telefone (WhatsApp) *</Label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={formData.telefoneWhatsApp}
                    onChange={(e) => setFormData({...formData, telefoneWhatsApp: formatPhone(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-900">Coordenador da Base/Unidade *</Label>
                  <Input
                    placeholder="Nome completo do coordenador"
                    value={formData.coordenadorBase}
                    onChange={(e) => setFormData({...formData, coordenadorBase: e.target.value})}
                  />
                </div>
              </div>

              {isMeliOperation && (
                <div className="space-y-2 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Label>Nome completo do responsável Meli</Label>
                  <p className="text-xs text-gray-500">Somente para Operações MELI. Cliente para reporte, dúvidas, informações e contato com a transportadora. Se não houver, marcar como N/A</p>
                  <Input
                    placeholder="Nome ou N/A"
                    value={formData.nomeResponsavelMeli}
                    onChange={(e) => setFormData({...formData, nomeResponsavelMeli: e.target.value})}
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setCurrentSection(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button className="flex-1 bg-[#E10613] hover:bg-[#B8050F]" onClick={() => goToSection(3)}>
                  Continuar <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentSection === 3 && (
          <Card className="shadow-xl bg-white border-gray-200">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#E10613]" />
                <div className="bg-[#E10613]/10 text-[#E10613] px-3 py-1 rounded-full text-sm font-medium">Seção 3 de {totalSections}</div>
              </div>
              <CardTitle className="text-xl mt-2 text-gray-900">Localização e Rota</CardTitle>
              <CardDescription className="text-gray-600">Informações sobre milha, regional e local da ocorrência.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-semibold text-gray-900">Milha *</Label>
                <p className="text-sm text-gray-500">Somente em casos de operações MELI</p>
                <RadioGroup
                  value={formData.milha}
                  onValueChange={(v) => setFormData({...formData, milha: v})}
                  className="grid grid-cols-1 md:grid-cols-2 gap-2"
                >
                  {MILHAS.map((m) => (
                    <div key={m.value} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 border">
                      <RadioGroupItem value={m.value} id={`milha-${m.value}`} />
                      <Label htmlFor={`milha-${m.value}`} className="font-normal cursor-pointer flex-1">{m.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">Regional *</Label>
                <p className="text-sm text-gray-500">Somente em casos de operações MELI</p>
                <RadioGroup
                  value={formData.regional}
                  onValueChange={(v) => setFormData({...formData, regional: v})}
                  className="grid grid-cols-2 md:grid-cols-4 gap-2"
                >
                  {REGIONAIS.map((r) => (
                    <div key={r} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 border">
                      <RadioGroupItem value={r} id={`regional-${r}`} />
                      <Label htmlFor={`regional-${r}`} className="font-normal cursor-pointer flex-1 text-sm">{r}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>BASE / UNIDADE *</Label>
                  <p className="text-xs text-gray-500">Escreva o nome da Base (código e local). Exemplo: SPR1 - Curitiba</p>
                  <Input
                    placeholder="SPR1 - Curitiba"
                    value={formData.baseUnidade}
                    onChange={(e) => setFormData({...formData, baseUnidade: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Endereço da Ocorrência *</Label>
                  <p className="text-xs text-gray-500">Informar o Endereço completo, incluindo o CEP.</p>
                  <Input
                    placeholder="Rua, número, bairro, cidade - CEP"
                    value={formData.enderecoOcorrencia}
                    onChange={(e) => setFormData({...formData, enderecoOcorrencia: e.target.value})}
                  />
                </div>
              </div>

              {isMeliOperation && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="space-y-2">
                    <Label>ID da Rota</Label>
                    <p className="text-xs text-gray-500">Conforme informado no Logístico</p>
                    <Input
                      placeholder="ID da rota"
                      value={formData.idRota}
                      onChange={(e) => setFormData({...formData, idRota: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Transit Time / ORH da rota</Label>
                    <p className="text-xs text-gray-500">Conforme informado no Logístico</p>
                    <Input
                      placeholder="Transit time"
                      value={formData.transitTimeOrh}
                      onChange={(e) => setFormData({...formData, transitTimeOrh: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Início da Rota</Label>
                    <p className="text-xs text-gray-500">Informar quando a rota foi iniciada</p>
                    <Input
                      type="time"
                      value={formData.inicioRota}
                      onChange={(e) => setFormData({...formData, inicioRota: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setCurrentSection(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button className="flex-1 bg-[#E10613] hover:bg-[#B8050F]" onClick={() => goToSection(4)}>
                  Continuar <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentSection === 4 && (
          <Card className="shadow-xl bg-white border-gray-200">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#E10613]" />
                <div className="bg-[#E10613]/10 text-[#E10613] px-3 py-1 rounded-full text-sm font-medium">Seção 4 de {totalSections}</div>
              </div>
              <CardTitle className="text-xl mt-2 text-gray-900">Dados da Ocorrência</CardTitle>
              <CardDescription className="text-gray-600">Data, hora, causa e descrição detalhada do ocorrido.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data da Ocorrência *</Label>
                  <Input
                    type="date"
                    value={formData.dataOcorrencia}
                    onChange={(e) => setFormData({...formData, dataOcorrencia: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horário da Ocorrência *</Label>
                  <Input
                    type="time"
                    value={formData.horarioOcorrencia}
                    onChange={(e) => setFormData({...formData, horarioOcorrencia: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">Causa Imediata *</Label>
                <RadioGroup
                  value={formData.causaImediata}
                  onValueChange={(v) => setFormData({...formData, causaImediata: v})}
                  className="grid grid-cols-1 md:grid-cols-2 gap-2"
                >
                  {CAUSAS_IMEDIATAS.map((causa, idx) => (
                    <div key={idx} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 border">
                      <RadioGroupItem value={causa} id={`causa-${idx}`} />
                      <Label htmlFor={`causa-${idx}`} className="font-normal cursor-pointer flex-1 text-sm">{causa}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>DESCRIÇÃO DETALHADA DA OCORRIDO *</Label>
                <p className="text-xs text-gray-500">Esclarecer: como aconteceu; qual sentido e lado da via; se trata-se de via urbana, rodovia, etc.; se estava cumprindo rota ou retornando/saindo do SVC; se durante o trajeto residência-trabalho; se haviam condições climáticas ou intervenções de terceiros e qualquer outro detalhe relatado que tenha contribuído com o ocorrido.</p>
                <Textarea
                  placeholder="Descreva detalhadamente o que aconteceu..."
                  rows={6}
                  value={formData.descricaoDetalhada}
                  onChange={(e) => setFormData({...formData, descricaoDetalhada: e.target.value})}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setCurrentSection(3)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button className="flex-1 bg-[#E10613] hover:bg-[#B8050F]" onClick={() => goToSection(5)}>
                  Continuar <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentSection === 5 && (
          <Card className="shadow-xl bg-white border-gray-200">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-[#E10613]" />
                <div className="bg-[#E10613]/10 text-[#E10613] px-3 py-1 rounded-full text-sm font-medium">Seção 5 de {totalSections}</div>
              </div>
              <CardTitle className="text-xl mt-2 text-gray-900">Dados do Veículo</CardTitle>
              <CardDescription className="text-gray-600">Informações sobre o veículo envolvido na ocorrência.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Identificador/Placa - Veículo Murici *</Label>
                  <p className="text-xs text-gray-500">Caso não se aplique, preencher com N/A</p>
                  <Input
                    placeholder="ABC-1234 ou N/A"
                    value={formData.placaVeiculo}
                    onChange={(e) => setFormData({...formData, placaVeiculo: e.target.value.toUpperCase()})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ano do Veículo *</Label>
                  <p className="text-xs text-gray-500">Caso não se aplique, preencher com 0000</p>
                  <Input
                    placeholder="2024 ou 0000"
                    value={formData.anoVeiculo}
                    onChange={(e) => setFormData({...formData, anoVeiculo: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Modelo do Veículo *</Label>
                  <Select value={formData.modeloVeiculo} onValueChange={(v) => setFormData({...formData, modeloVeiculo: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {MODELOS_VEICULO.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">Frota Fixa? *</Label>
                <p className="text-sm text-gray-500">No que se refere ao cumprimento de Rotas</p>
                <RadioGroup
                  value={formData.frotaFixa}
                  onValueChange={(v) => setFormData({...formData, frotaFixa: v})}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2"><RadioGroupItem value="sim" id="frota-sim" /><Label htmlFor="frota-sim">SIM</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="nao" id="frota-nao" /><Label htmlFor="frota-nao">NÃO</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="na" id="frota-na" /><Label htmlFor="frota-na">N/A</Label></div>
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">Tipo de Frota *</Label>
                <RadioGroup
                  value={formData.tipoFrota}
                  onValueChange={(v) => setFormData({...formData, tipoFrota: v})}
                  className="grid grid-cols-1 md:grid-cols-2 gap-2"
                >
                  <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 border">
                    <RadioGroupItem value="alugado" id="tipo-alugado" /><Label htmlFor="tipo-alugado">Alugado</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 border">
                    <RadioGroupItem value="frota_propria" id="tipo-propria" /><Label htmlFor="tipo-propria">Frota Própria Murici</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 border">
                    <RadioGroupItem value="agregado" id="tipo-agregado" /><Label htmlFor="tipo-agregado">Agregado (pertence ao motorista)</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 border">
                    <RadioGroupItem value="Outro" id="tipo-outro" /><Label htmlFor="tipo-outro">Outro</Label>
                  </div>
                </RadioGroup>
                {formData.tipoFrota === 'Outro' && (
                  <Input placeholder="Especifique" value={formData.tipoFrotaOutro} onChange={(e) => setFormData({...formData, tipoFrotaOutro: e.target.value})} />
                )}
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">Terceiro (Comunidade) Envolvido? *</Label>
                <RadioGroup
                  value={formData.terceiroEnvolvido}
                  onValueChange={(v) => setFormData({...formData, terceiroEnvolvido: v})}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2"><RadioGroupItem value="sim" id="terceiro-sim" /><Label htmlFor="terceiro-sim">SIM</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="nao" id="terceiro-nao" /><Label htmlFor="terceiro-nao">NÃO</Label></div>
                </RadioGroup>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setCurrentSection(4)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button className="flex-1 bg-[#E10613] hover:bg-[#B8050F]" onClick={() => goToSection(6)}>
                  Continuar <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentSection === 6 && (
          <Card className="shadow-xl bg-white border-gray-200">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-[#E10613]" />
                <div className="bg-[#E10613]/10 text-[#E10613] px-3 py-1 rounded-full text-sm font-medium">Seção 6 de {totalSections}</div>
              </div>
              <CardTitle className="text-xl mt-2 text-gray-900">Dados do Colaborador</CardTitle>
              <CardDescription className="text-gray-600">Informações sobre o motorista/colaborador envolvido.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo do Colaborador *</Label>
                  <p className="text-xs text-gray-500">Nome do Driver/Ajudante/Outro MURICI</p>
                  <Input
                    placeholder="Nome completo"
                    value={formData.nomeColaborador}
                    onChange={(e) => setFormData({...formData, nomeColaborador: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ID ou Matrícula do Motorista</Label>
                  <p className="text-xs text-gray-500">Meli: Logístico / Femsa: Trixlog. Caso não se aplique, preencher com 000</p>
                  <Input
                    placeholder="ID/Matrícula ou 000"
                    value={formData.idMatricula}
                    onChange={(e) => setFormData({...formData, idMatricula: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">FUNÇÃO *</Label>
                <RadioGroup
                  value={formData.funcao}
                  onValueChange={(v) => setFormData({...formData, funcao: v})}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center space-x-2"><RadioGroupItem value="motorista" id="func-motorista" /><Label htmlFor="func-motorista">MOTORISTA</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="ajudante" id="func-ajudante" /><Label htmlFor="func-ajudante">AJUDANTE</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="Outro" id="func-outro" /><Label htmlFor="func-outro">Outro</Label></div>
                </RadioGroup>
                {formData.funcao === 'Outro' && (
                  <Input placeholder="Especifique a função" value={formData.funcaoOutro} onChange={(e) => setFormData({...formData, funcaoOutro: e.target.value})} />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>IDADE *</Label>
                  <Input
                    placeholder="Idade"
                    value={formData.idade}
                    onChange={(e) => setFormData({...formData, idade: e.target.value})}
                  />
                </div>
                <div className="space-y-4">
                  <Label className="text-base font-semibold">CONTRATAÇÃO *</Label>
                  <RadioGroup
                    value={formData.contratacao}
                    onValueChange={(v) => setFormData({...formData, contratacao: v})}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2"><RadioGroupItem value="clt" id="cont-clt" /><Label htmlFor="cont-clt">CLT</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="tac" id="cont-tac" /><Label htmlFor="cont-tac">TAC</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="agregado" id="cont-agregado" /><Label htmlFor="cont-agregado">AGREGADO</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Outro" id="cont-outro" /><Label htmlFor="cont-outro">Outro</Label></div>
                  </RadioGroup>
                  {formData.contratacao === 'Outro' && (
                    <Input placeholder="Especifique" value={formData.contratacaoOutro} onChange={(e) => setFormData({...formData, contratacaoOutro: e.target.value})} />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Admissão *</Label>
                  <Input
                    type="date"
                    value={formData.dataAdmissao}
                    onChange={(e) => setFormData({...formData, dataAdmissao: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Primeira Habilitação *</Label>
                  <p className="text-xs text-gray-500">Exemplo: 22/10/2010</p>
                  <Input
                    type="date"
                    value={formData.dataPrimeiraHabilitacao}
                    onChange={(e) => setFormData({...formData, dataPrimeiraHabilitacao: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setCurrentSection(5)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button className="flex-1 bg-[#E10613] hover:bg-[#B8050F]" onClick={() => goToSection(7)}>
                  Continuar <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentSection === 7 && (
          <Card className="shadow-xl bg-white border-gray-200">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-[#E10613]" />
                <div className="bg-[#E10613]/10 text-[#E10613] px-3 py-1 rounded-full text-sm font-medium">Seção 7 de {totalSections}</div>
              </div>
              <CardTitle className="text-xl mt-2 text-gray-900">Informações Complementares</CardTitle>
              <CardDescription className="text-gray-600">Sobre saúde dos envolvidos, registro policial, etc.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Parte(s) do corpo atingida(s) *</Label>
                    <p className="text-xs text-gray-500">Caso não se aplique, preencher com N/A</p>
                    <Input
                      placeholder="Descrição ou N/A"
                      value={formData.partesCorpoAtingidas}
                      onChange={(e) => setFormData({...formData, partesCorpoAtingidas: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dias que permanecerá afastado das atividades *</Label>
                    <p className="text-xs text-gray-500">Caso não se aplique, preencher com N/A</p>
                    <Input
                      placeholder="Número de dias ou N/A"
                      value={formData.diasAfastado}
                      onChange={(e) => setFormData({...formData, diasAfastado: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Foi socorrido? Por quem? *</Label>
                  <p className="text-xs text-gray-500">Caso não se aplique, preencher com N/A</p>
                  <Textarea
                    placeholder="Descreva ou N/A"
                    value={formData.foiSocorrido}
                    onChange={(e) => setFormData({...formData, foiSocorrido: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Atendimento Médico? *</Label>
                    <RadioGroup
                      value={formData.atendimentoMedico}
                      onValueChange={(v) => setFormData({...formData, atendimentoMedico: v})}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2"><RadioGroupItem value="sim" id="atend-sim" /><Label htmlFor="atend-sim">SIM</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="nao" id="atend-nao" /><Label htmlFor="atend-nao">NÃO</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="na" id="atend-na" /><Label htmlFor="atend-na">N/A</Label></div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">LOCAL DE ATENDIMENTO *</Label>
                    <RadioGroup
                      value={formData.localAtendimento}
                      onValueChange={(v) => setFormData({...formData, localAtendimento: v})}
                      className="flex flex-wrap gap-2"
                    >
                      <div className="flex items-center space-x-2"><RadioGroupItem value="ambulatorio" id="local-amb" /><Label htmlFor="local-amb" className="text-sm">AMBULATÓRIO</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="unidade_saude" id="local-us" /><Label htmlFor="local-us" className="text-sm">UNIDADE DE SAÚDE</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="na" id="local-na" /><Label htmlFor="local-na" className="text-sm">N/A</Label></div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Houve internação? *</Label>
                    <RadioGroup
                      value={formData.houveInternacao}
                      onValueChange={(v) => setFormData({...formData, houveInternacao: v})}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2"><RadioGroupItem value="sim" id="int-sim" /><Label htmlFor="int-sim">SIM</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="nao" id="int-nao" /><Label htmlFor="int-nao">NÃO</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="na" id="int-na" /><Label htmlFor="int-na">N/A</Label></div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label>Nome Completo do Médico e CRM *</Label>
                    <p className="text-xs text-gray-500">Caso não se aplique, preencher com N/A</p>
                    <Input
                      placeholder="Nome - CRM ou N/A"
                      value={formData.nomeMedicoCrm}
                      onChange={(e) => setFormData({...formData, nomeMedicoCrm: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CID (Código Internacional de Doenças) *</Label>
                    <p className="text-xs text-gray-500">Caso não se aplique, preencher com N/A</p>
                    <Input
                      placeholder="CID ou N/A"
                      value={formData.cid}
                      onChange={(e) => setFormData({...formData, cid: e.target.value})}
                    />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Registro Policial? *</Label>
                    <RadioGroup
                      value={formData.registroPolicial}
                      onValueChange={(v) => setFormData({...formData, registroPolicial: v})}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2"><RadioGroupItem value="sim" id="pol-sim" /><Label htmlFor="pol-sim">SIM</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="nao" id="pol-nao" /><Label htmlFor="pol-nao">NÃO</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="na" id="pol-na" /><Label htmlFor="pol-na">N/A</Label></div>
                    </RadioGroup>
                  </div>
                </div>

                {formData.registroPolicial === 'sim' && (
                  <div className="space-y-2 p-4 bg-[#E10613]/10 rounded-lg border border-[#E10613]/30">
                    <Label>Protocolo Boletim de Ocorrência</Label>
                    <p className="text-xs text-gray-500">Em caso de Registro Policial (BO), informe o Protocolo gerado.</p>
                    <Input
                      placeholder="Protocolo do BO"
                      value={formData.protocoloBO}
                      onChange={(e) => setFormData({...formData, protocoloBO: e.target.value})}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Descreva o Estado de saúde dos envolvidos *</Label>
                  <p className="text-xs text-gray-500">Terceiro(s) (comunidade) e colaborador(es) Murici</p>
                  <Textarea
                    placeholder="Descreva o estado de saúde..."
                    rows={4}
                    value={formData.estadoSaudeEnvolvidos}
                    onChange={(e) => setFormData({...formData, estadoSaudeEnvolvidos: e.target.value})}
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1 border-[#333] text-[#F5F5F5] hover:bg-[#333]" onClick={() => setCurrentSection(6)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-[#E10613] hover:bg-[#B8050F]"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? 'Registrando...' : 'Registrar Ocorrência'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="text-center mt-6 text-[#8C8C8C] text-sm">
          <Shield className="inline h-4 w-4 mr-1 text-[#E10613]" />
          Murici Transportes - Segurança em primeiro lugar
        </div>
      </div>
    </div>
  );
}
