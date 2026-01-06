import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle, ArrowLeft, CheckCircle, Phone, User, MapPin, Calendar, FileText } from 'lucide-react';
import { Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const BASES_DISPONIVEIS = [
  'Guarulhos', 'Osasco', 'Cajamar', 'Embu', 'Barueri', 
  'Campinas', 'Ribeirão Preto', 'Sorocaba', 'Santos', 'São José dos Campos',
  'Mauá', 'Santo André', 'Diadema', 'São Bernardo', 'Jundiaí'
];

export default function WorkSafetyReportAccident() {
  const { toast } = useToast();
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    base: '',
    motoristaNome: '',
    tipoOcorrencia: 'incidente' as 'acidente' | 'incidente' | 'quase_acidente',
    dataHora: '',
    local: '',
    descricao: '',
    houveVitima: false,
    nomeReportante: '',
    telefoneReportante: '',
  });

  const { data: motoristasData } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['/api/work-safety/drivers'],
    enabled: false,
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('/api/work-safety/accidents', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      setSuccess(true);
      toast({
        title: 'Ocorrência registrada!',
        description: 'A ocorrência foi registrada com sucesso no sistema.',
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
    if (!formData.base || !formData.tipoOcorrencia || !formData.dataHora || !formData.local || !formData.descricao || !formData.nomeReportante || !formData.telefoneReportante) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios.',
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

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto bg-green-100 rounded-full p-4 mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700">Ocorrência Registrada!</CardTitle>
            <CardDescription>
              A ocorrência foi registrada com sucesso no sistema de Segurança do Trabalho.
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
              setFormData({
                base: '',
                motoristaNome: '',
                tipoOcorrencia: 'incidente',
                dataHora: '',
                local: '',
                descricao: '',
                houveVitima: false,
                nomeReportante: '',
                telefoneReportante: '',
              });
            }} data-testid="button-new-report">
              Registrar Nova Ocorrência
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-6">
          <Link href="/work-safety/portal">
            <Button variant="ghost" className="text-white hover:bg-white/20" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Portal
            </Button>
          </Link>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8" />
              <div>
                <CardTitle className="text-2xl">Relatar Acidente / Incidente</CardTitle>
                <CardDescription className="text-red-100">
                  Preencha todos os campos para registrar a ocorrência
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base">Base *</Label>
                  <Select value={formData.base} onValueChange={(v) => setFormData({...formData, base: v})}>
                    <SelectTrigger data-testid="select-base">
                      <SelectValue placeholder="Selecione a base" />
                    </SelectTrigger>
                    <SelectContent>
                      {BASES_DISPONIVEIS.map((base) => (
                        <SelectItem key={base} value={base}>{base}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motoristaNome">Motorista Envolvido</Label>
                  <Input
                    id="motoristaNome"
                    placeholder="Nome do motorista (opcional)"
                    value={formData.motoristaNome}
                    onChange={(e) => setFormData({...formData, motoristaNome: e.target.value})}
                    data-testid="input-driver-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Ocorrência *</Label>
                <RadioGroup
                  value={formData.tipoOcorrencia}
                  onValueChange={(v) => setFormData({...formData, tipoOcorrencia: v as any})}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="acidente" id="acidente" data-testid="radio-accident" />
                    <Label htmlFor="acidente" className="font-normal cursor-pointer">Acidente</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="incidente" id="incidente" data-testid="radio-incident" />
                    <Label htmlFor="incidente" className="font-normal cursor-pointer">Incidente</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="quase_acidente" id="quase_acidente" data-testid="radio-near-miss" />
                    <Label htmlFor="quase_acidente" className="font-normal cursor-pointer">Quase Acidente</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataHora">Data e Hora *</Label>
                  <Input
                    id="dataHora"
                    type="datetime-local"
                    value={formData.dataHora}
                    onChange={(e) => setFormData({...formData, dataHora: e.target.value})}
                    data-testid="input-datetime"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="local">Local *</Label>
                  <Input
                    id="local"
                    placeholder="Local da ocorrência"
                    value={formData.local}
                    onChange={(e) => setFormData({...formData, local: e.target.value})}
                    data-testid="input-location"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição da Ocorrência *</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva detalhadamente o que aconteceu..."
                  rows={4}
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  data-testid="textarea-description"
                />
              </div>

              <div className="space-y-2">
                <Label>Houve Vítima? *</Label>
                <RadioGroup
                  value={formData.houveVitima ? 'sim' : 'nao'}
                  onValueChange={(v) => setFormData({...formData, houveVitima: v === 'sim'})}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="vitima-sim" data-testid="radio-victim-yes" />
                    <Label htmlFor="vitima-sim" className="font-normal cursor-pointer">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="vitima-nao" data-testid="radio-victim-no" />
                    <Label htmlFor="vitima-nao" className="font-normal cursor-pointer">Não</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados do Reportante
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nomeReportante">Nome Completo *</Label>
                    <Input
                      id="nomeReportante"
                      placeholder="Nome de quem está reportando"
                      value={formData.nomeReportante}
                      onChange={(e) => setFormData({...formData, nomeReportante: e.target.value})}
                      data-testid="input-reporter-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefoneReportante">Telefone *</Label>
                    <Input
                      id="telefoneReportante"
                      placeholder="(00) 00000-0000"
                      value={formData.telefoneReportante}
                      onChange={(e) => setFormData({...formData, telefoneReportante: formatPhone(e.target.value)})}
                      data-testid="input-reporter-phone"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={mutation.isPending}
                data-testid="button-submit"
              >
                {mutation.isPending ? 'Registrando...' : 'Registrar Ocorrência'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
