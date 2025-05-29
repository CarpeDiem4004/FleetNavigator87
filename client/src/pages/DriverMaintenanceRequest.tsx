import React, { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Wrench, AlertTriangle, Camera, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

const DriverMaintenanceRequest: React.FC = () => {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    placa_veiculo: '',
    tipo_problema: '',
    prioridade: 'media',
    descricao: '',
    local_ocorrencia: '',
    pode_continuar_viagem: 'sim',
    observacoes_adicionais: ''
  });

  const tiposProblema = [
    'Motor',
    'Freios',
    'Pneus',
    'Suspensão',
    'Elétrica',
    'Ar condicionado',
    'Direção',
    'Transmissão',
    'Combustível',
    'Carroceria',
    'Outros'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    // Validações básicas
    if (!formData.placa_veiculo || !formData.tipo_problema || !formData.descricao) {
      toast({
        title: "Campos obrigatórios",
        description: "Placa do veículo, tipo de problema e descrição são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const requestData = {
        motorista_id: parseInt(params.id as string),
        placa_veiculo: formData.placa_veiculo.toUpperCase(),
        tipo_problema: formData.tipo_problema,
        prioridade: formData.prioridade,
        descricao: formData.descricao,
        local_ocorrencia: formData.local_ocorrencia,
        pode_continuar_viagem: formData.pode_continuar_viagem === 'sim',
        observacoes_adicionais: formData.observacoes_adicionais,
        status: 'pendente',
        data_solicitacao: new Date().toISOString()
      };

      const response = await apiRequest('POST', '/api/line-hall/manutencao/solicitar', requestData);
      const data = await response.json();

      if (data.success) {
        toast({
          title: "Solicitação enviada com sucesso",
          description: "A equipe de manutenção foi notificada. Protocolo: " + data.protocolo
        });
        setLocation('/driver-access');
      } else {
        throw new Error(data.message || 'Erro ao enviar solicitação');
      }
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      toast({
        title: "Erro ao enviar solicitação",
        description: "Tente novamente ou procure ajuda",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setLocation('/driver-access')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Wrench className="h-5 w-5" />
                  <span>Solicitação de Manutenção</span>
                </CardTitle>
                <CardDescription>
                  Reporte problemas no veículo para a equipe de manutenção
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Informações do veículo */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Veículo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="placa">Placa do Veículo *</Label>
              <Input
                id="placa"
                placeholder="ABC-1234"
                value={formData.placa_veiculo}
                onChange={(e) => handleInputChange('placa_veiculo', e.target.value)}
                className="uppercase"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="local">Local onde ocorreu o problema</Label>
              <Input
                id="local"
                placeholder="Ex: Rod. BR-101, km 25, São Paulo/SP"
                value={formData.local_ocorrencia}
                onChange={(e) => handleInputChange('local_ocorrencia', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Detalhes do problema */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Problema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Problema *</Label>
              <Select value={formData.tipo_problema} onValueChange={(value) => handleInputChange('tipo_problema', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de problema" />
                </SelectTrigger>
                <SelectContent>
                  {tiposProblema.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Prioridade</Label>
              <RadioGroup
                value={formData.prioridade}
                onValueChange={(value) => handleInputChange('prioridade', value)}
                className="flex space-x-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="baixa" id="baixa" />
                  <Label htmlFor="baixa" className="text-green-700">Baixa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="media" id="media" />
                  <Label htmlFor="media" className="text-yellow-700">Média</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="alta" id="alta" />
                  <Label htmlFor="alta" className="text-red-700">Alta</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="urgente" id="urgente" />
                  <Label htmlFor="urgente" className="text-red-900 font-bold">Urgente</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição do Problema *</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva detalhadamente o problema encontrado..."
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Situação operacional */}
        <Card>
          <CardHeader>
            <CardTitle>Situação Operacional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>O veículo pode continuar a viagem?</Label>
              <RadioGroup
                value={formData.pode_continuar_viagem}
                onValueChange={(value) => handleInputChange('pode_continuar_viagem', value)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sim" id="sim" />
                  <Label htmlFor="sim" className="text-green-700">
                    Sim, pode continuar normalmente
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="com_restricao" id="com_restricao" />
                  <Label htmlFor="com_restricao" className="text-yellow-700">
                    Sim, mas com restrições (velocidade reduzida, carga limitada, etc.)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nao" id="nao" />
                  <Label htmlFor="nao" className="text-red-700">
                    Não, veículo deve parar imediatamente
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {formData.pode_continuar_viagem === 'nao' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-red-800">
                    Atenção: Veículo com problema grave
                  </span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  A central será notificada imediatamente. Aguarde instruções antes de prosseguir.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Observações adicionais */}
        <Card>
          <CardHeader>
            <CardTitle>Observações Adicionais</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Adicione informações extras que possam ajudar na resolução do problema..."
              value={formData.observacoes_adicionais}
              onChange={(e) => handleInputChange('observacoes_adicionais', e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Botão de envio */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              onClick={handleSubmit} 
              className="w-full" 
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando Solicitação...
                </>
              ) : (
                <>
                  <Wrench className="mr-2 h-4 w-4" />
                  Enviar Solicitação de Manutenção
                </>
              )}
            </Button>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-700">
                <p className="font-medium">Lembre-se:</p>
                <ul className="mt-1 space-y-1 list-disc list-inside">
                  <li>Problemas urgentes são priorizados pela equipe</li>
                  <li>Você receberá atualizações sobre o status da solicitação</li>
                  <li>Em emergências, contate também a central por telefone</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverMaintenanceRequest;