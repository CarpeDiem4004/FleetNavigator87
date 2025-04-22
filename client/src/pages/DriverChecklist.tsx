import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import { useLocation } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  CircleCheck, 
  AlertCircle, 
  Info, 
  Truck, 
  CheckSquare, 
  XCircle, 
  Wrench as Tool, 
  CreditCard, 
  Camera, 
  Upload, 
  FileWarning,
  ShieldAlert
} from "lucide-react";

// Tipos de condição para componentes do veículo
type Condition = 'bom' | 'regular' | 'ruim' | undefined;

// Interface para o objeto do checklist
interface Checklist {
  tripId: number;
  motoristaNome: string;
  kmInicial?: number;
  kmFinal?: number;
  condicaoPneus?: Condition;
  condicaoLuzes?: Condition;
  condicaoFreios?: Condition;
  condicaoParabrisa?: Condition;
  nivelOleo?: Condition;
  nivelAgua?: Condition;
  condicaoCavalo?: Condition;
  condicaoCarreta?: Condition;
  avarias: string[];
  fotos: string[];
  observacoes?: string;
  isChecklistInicial: boolean;
}

// Interface para dados da viagem
interface TripInfo {
  id: number;
  data_viagem: string;
  cavalo_placa: string;
  carreta1_placa: string;
  carreta2_placa?: string;
  motorista_nome?: string;
  motorista_id: number;
  base_origem_nome?: string;
  base_destino_nome?: string;
  horario_carregamento: string;
  status: string;
}

// Interface para as solicitações
interface MaintenanceRequest {
  descricao: string;
  urgencia: 'baixa' | 'normal' | 'alta' | 'emergencial';
}

interface RefuelingCardRequest {
  numeroCartao?: string;
  valorSolicitado: number;
  justificativa: string;
  comprovante?: string;
}

// Componente para condição com ícones de cor
const ConditionSelect: React.FC<{
  label: string;
  value: Condition;
  onChange: (value: Condition) => void;
}> = ({ label, value, onChange }) => {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select 
        value={value || ''} 
        onValueChange={(val) => onChange(val as Condition)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecione a condição" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="bom" className="flex items-center">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              Bom
            </div>
          </SelectItem>
          <SelectItem value="regular" className="flex items-center">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
              Regular
            </div>
          </SelectItem>
          <SelectItem value="ruim" className="flex items-center">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              Ruim
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

const DriverChecklist: React.FC = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tripId, setTripId] = useState<number | null>(null);
  const [tripInfo, setTripInfo] = useState<TripInfo | null>(null);
  const [step, setStep] = useState<'info' | 'checklist' | 'requests' | 'success'>('info');
  const [progress, setProgress] = useState(0);
  
  // Checklist state
  const [checklist, setChecklist] = useState<Checklist>({
    tripId: 0,
    motoristaNome: '',
    avarias: [],
    fotos: [],
    isChecklistInicial: true
  });
  
  // Solicitações
  const [showMaintenanceRequest, setShowMaintenanceRequest] = useState(false);
  const [showRefuelingRequest, setShowRefuelingRequest] = useState(false);
  const [maintenanceRequest, setMaintenanceRequest] = useState<MaintenanceRequest>({
    descricao: '',
    urgencia: 'normal'
  });
  const [refuelingRequest, setRefuelingRequest] = useState<RefuelingCardRequest>({
    valorSolicitado: 0,
    justificativa: ''
  });
  
  // Estado para upload de imagens
  const [uploading, setUploading] = useState(false);
  const [avisoAvaria, setAvisoAvaria] = useState<string>('');
  const [avariasOptions] = useState([
    { id: 'amassado_frontal', label: 'Amassado na parte frontal' },
    { id: 'amassado_lateral', label: 'Amassado na lateral' },
    { id: 'amassado_traseiro', label: 'Amassado na parte traseira' },
    { id: 'arranhao', label: 'Arranhão na pintura' },
    { id: 'farol_quebrado', label: 'Farol/lanterna quebrado' },
    { id: 'retrovisor_quebrado', label: 'Retrovisor quebrado/danificado' },
    { id: 'para_choque_danificado', label: 'Para-choque danificado' },
    { id: 'pneu_danificado', label: 'Pneu danificado' },
    { id: 'vidro_trincado', label: 'Vidro trincado/quebrado' },
    { id: 'outro', label: 'Outro (descrever nas observações)' }
  ]);

  useEffect(() => {
    // Extrair o ID da viagem da URL
    const path = window.location.pathname;
    const match = path.match(/\/checklist\/(\d+)/);
    
    if (match && match[1]) {
      const id = parseInt(match[1]);
      setTripId(id);
      loadTripInfo(id);
    } else {
      toast({
        title: 'Link inválido',
        description: 'O link do checklist é inválido. Por favor, solicite um novo link.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  }, [toast]);

  // Carregar informações da viagem
  const loadTripInfo = async (id: number) => {
    try {
      const { data, error } = await supabase
        .from('linehall_shopee')
        .select(`
          *,
          bases_origem:base_origem_id(name),
          bases_destino:base_destino_id(name),
          motoristas:motorista_id(nome)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        toast({
          title: 'Viagem não encontrada',
          description: 'Não foi possível encontrar a viagem solicitada.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      setTripInfo({
        id: data.id,
        data_viagem: data.data_viagem,
        cavalo_placa: data.cavalo_placa,
        carreta1_placa: data.carreta1_placa,
        carreta2_placa: data.carreta2_placa,
        motorista_nome: data.motorista_nome || data.motoristas?.nome,
        motorista_id: data.motorista_id,
        base_origem_nome: data.bases_origem?.name,
        base_destino_nome: data.bases_destino?.name,
        horario_carregamento: data.horario_carregamento,
        status: data.status
      });

      // Preencher informações iniciais do checklist
      setChecklist(prev => ({
        ...prev,
        tripId: data.id,
        motoristaNome: data.motorista_nome || data.motoristas?.nome || '',
      }));

      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao carregar informações da viagem:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  // Atualizar progresso com base no passo atual
  useEffect(() => {
    switch (step) {
      case 'info':
        setProgress(25);
        break;
      case 'checklist':
        setProgress(50);
        break;
      case 'requests':
        setProgress(75);
        break;
      case 'success':
        setProgress(100);
        break;
    }
  }, [step]);

  // Função para avançar para o próximo passo
  const nextStep = () => {
    if (step === 'info') {
      setStep('checklist');
    } else if (step === 'checklist') {
      setStep('requests');
    } else if (step === 'requests') {
      submitChecklist();
    }
  };

  // Função para voltar ao passo anterior
  const prevStep = () => {
    if (step === 'checklist') {
      setStep('info');
    } else if (step === 'requests') {
      setStep('checklist');
    }
  };

  // Verificar se todos os campos necessários estão preenchidos
  const validateChecklist = (): boolean => {
    if (!checklist.motoristaNome) {
      toast({
        title: 'Campo obrigatório',
        description: 'Por favor, informe o nome do motorista.',
        variant: 'destructive',
      });
      return false;
    }

    if (checklist.isChecklistInicial && !checklist.kmInicial) {
      toast({
        title: 'Campo obrigatório',
        description: 'Por favor, informe o KM inicial do veículo.',
        variant: 'destructive',
      });
      return false;
    }

    if (!checklist.isChecklistInicial && !checklist.kmFinal) {
      toast({
        title: 'Campo obrigatório',
        description: 'Por favor, informe o KM final do veículo.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  // Função para fazer upload de uma imagem
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    setUploading(true);
    
    try {
      // Criar um nome único para o arquivo usando o ID da viagem e timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${tripId}_${Date.now()}.${fileExt}`;
      const filePath = `checklist-fotos/${fileName}`;
      
      // Upload do arquivo para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Obter URL pública do arquivo
      const { data } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);
        
      if (data) {
        // Adicionar URL à lista de fotos do checklist
        setChecklist(prev => ({
          ...prev,
          fotos: [...prev.fotos, data.publicUrl]
        }));
        
        toast({
          title: 'Imagem enviada',
          description: 'A foto foi adicionada ao checklist',
        });
      }
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast({
        title: 'Erro no upload',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Limpar o input de arquivo
      if (e.target) {
        e.target.value = '';
      }
    }
  };
  
  // Função para adicionar ou remover uma avaria da lista
  const toggleAvaria = (avariaId: string) => {
    setChecklist(prev => {
      const avarias = [...prev.avarias];
      
      if (avarias.includes(avariaId)) {
        // Remover avaria se já estiver na lista
        return { ...prev, avarias: avarias.filter(id => id !== avariaId) };
      } else {
        // Adicionar avaria se não estiver na lista
        return { ...prev, avarias: [...avarias, avariaId] };
      }
    });
  };
  
  // Função para anexar uma imagem para solicitação de recarga de cartão
  const handleCardReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    setUploading(true);
    
    try {
      // Criar um nome único para o arquivo usando o ID da viagem e timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `cartao_${tripId}_${Date.now()}.${fileExt}`;
      const filePath = `recarga-comprovantes/${fileName}`;
      
      // Upload do arquivo para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Obter URL pública do arquivo
      const { data } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);
        
      if (data) {
        // Atualizar o request com o URL do comprovante
        setRefuelingRequest(prev => ({
          ...prev,
          comprovante: data.publicUrl
        }));
        
        toast({
          title: 'Comprovante enviado',
          description: 'O comprovante foi anexado à solicitação',
        });
      }
    } catch (error) {
      console.error('Erro ao fazer upload do comprovante:', error);
      toast({
        title: 'Erro no upload',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Limpar o input de arquivo
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  // Função para enviar o checklist e as solicitações
  const submitChecklist = async () => {
    if (!validateChecklist()) return;
    
    setIsSubmitting(true);
    
    try {
      // 1. Salvar o checklist
      const { data: checklistData, error: checklistError } = await supabase
        .from('vehicle_checklist')
        .insert({
          viagem_id: checklist.tripId,
          motorista_nome: checklist.motoristaNome,
          km_inicial: checklist.isChecklistInicial ? checklist.kmInicial : null,
          km_final: !checklist.isChecklistInicial ? checklist.kmFinal : null,
          condicao_pneus: checklist.condicaoPneus,
          condicao_luzes: checklist.condicaoLuzes,
          condicao_freios: checklist.condicaoFreios,
          condicao_parabrisa: checklist.condicaoParabrisa,
          nivel_oleo: checklist.nivelOleo,
          nivel_agua: checklist.nivelAgua,
          condicao_cavalo: checklist.condicaoCavalo,
          condicao_carreta: checklist.condicaoCarreta,
          avarias: checklist.avarias,
          fotos: checklist.fotos,
          observacoes: checklist.observacoes,
          status: 'concluido',
          checklist_inicial: checklist.isChecklistInicial,
        })
        .select();

      if (checklistError) throw checklistError;
      
      // 2. Atualizar a viagem com o KM inicial/final e status de checklist
      const updateData: any = {
        checklist_status: 'concluido'
      };
      
      if (checklist.isChecklistInicial && checklist.kmInicial) {
        updateData.km_inicial = checklist.kmInicial;
      }
      
      if (!checklist.isChecklistInicial && checklist.kmFinal) {
        updateData.km_final = checklist.kmFinal;
      }
      
      const { error: updateError } = await supabase
        .from('linehall_shopee')
        .update(updateData)
        .eq('id', tripId);
        
      if (updateError) throw updateError;
      
      // 3. Salvar solicitação de manutenção (se aplicável)
      if (showMaintenanceRequest && maintenanceRequest.descricao) {
        const { error: maintenanceError } = await supabase
          .from('solicitacao_manutencao')
          .insert({
            viagem_id: tripId,
            placa_veiculo: tripInfo?.cavalo_placa,
            motorista_nome: checklist.motoristaNome,
            descricao: maintenanceRequest.descricao,
            urgencia: maintenanceRequest.urgencia,
            status: 'pendente'
          });
          
        if (maintenanceError) throw maintenanceError;
      }
      
      // 4. Salvar solicitação de recarga de cartão (se aplicável)
      if (showRefuelingRequest && refuelingRequest.valorSolicitado > 0 && refuelingRequest.justificativa) {
        const { error: refuelingError } = await supabase
          .from('solicitacao_recarga_cartao')
          .insert({
            viagem_id: tripId,
            placa_veiculo: tripInfo?.cavalo_placa,
            motorista_nome: checklist.motoristaNome,
            numero_cartao: refuelingRequest.numeroCartao,
            valor_solicitado: refuelingRequest.valorSolicitado,
            justificativa: refuelingRequest.justificativa,
            comprovante: refuelingRequest.comprovante,
            status: 'pendente'
          });
          
        if (refuelingError) throw refuelingError;
      }
      
      // 5. Mostrar mensagem de sucesso
      setStep('success');
      
    } catch (error) {
      console.error('Erro ao enviar dados do checklist:', error);
      toast({
        title: 'Erro ao salvar checklist',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Carregando Checklist</CardTitle>
            <CardDescription>Aguarde enquanto carregamos os dados da viagem...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tripInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Viagem Não Encontrada</CardTitle>
            <CardDescription>O link do checklist é inválido ou a viagem não existe.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => window.close()}>Fechar</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-center mb-1">Checklist do Veículo</h1>
          <p className="text-center text-gray-500">
            {checklist.isChecklistInicial ? 'Checklist Inicial da Viagem' : 'Checklist Final da Viagem'}
          </p>
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Informações</span>
              <span>Checklist</span>
              <span>Solicitações</span>
              <span>Conclusão</span>
            </div>
          </div>
        </div>

        {step === 'info' && (
          <Card>
            <CardHeader>
              <CardTitle>Informações da Viagem</CardTitle>
              <CardDescription>Verifique os dados da viagem e do veículo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="flex items-center mb-3">
                  <Truck className="h-5 w-5 mr-2 text-blue-600" />
                  <h3 className="font-medium">Dados da Viagem</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Data da Viagem</p>
                    <p className="font-medium">{new Date(tripInfo.data_viagem).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <p className="font-medium capitalize">{tripInfo.status.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">CD de Origem</p>
                    <p className="font-medium">{tripInfo.base_origem_nome}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">CD de Destino</p>
                    <p className="font-medium">{tripInfo.base_destino_nome}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Horário de Carregamento</p>
                    <p className="font-medium">{tripInfo.horario_carregamento}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="flex items-center mb-3">
                  <Truck className="h-5 w-5 mr-2 text-blue-600" />
                  <h3 className="font-medium">Veículos</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500">Cavalo Mecânico</p>
                    <p className="font-medium">{tripInfo.cavalo_placa}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Carreta 1</p>
                    <p className="font-medium">{tripInfo.carreta1_placa}</p>
                  </div>
                  {tripInfo.carreta2_placa && (
                    <div>
                      <p className="text-gray-500">Carreta 2</p>
                      <p className="font-medium">{tripInfo.carreta2_placa}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center mb-1">
                  <Label className="font-medium">Tipo de Checklist</Label>
                </div>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="initial"
                      checked={checklist.isChecklistInicial}
                      onChange={() => setChecklist(prev => ({ ...prev, isChecklistInicial: true }))}
                      className="h-4 w-4 text-blue-600"
                    />
                    <Label htmlFor="initial">Checklist Inicial (Saída)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="final"
                      checked={!checklist.isChecklistInicial}
                      onChange={() => setChecklist(prev => ({ ...prev, isChecklistInicial: false }))}
                      className="h-4 w-4 text-blue-600"
                    />
                    <Label htmlFor="final">Checklist Final (Retorno)</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="driver_name">Nome do Motorista</Label>
                <Input
                  id="driver_name"
                  placeholder="Informe o nome do motorista"
                  value={checklist.motoristaNome}
                  onChange={(e) => setChecklist(prev => ({ ...prev, motoristaNome: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="km">
                  {checklist.isChecklistInicial ? 'Quilometragem Inicial (KM)' : 'Quilometragem Final (KM)'}
                </Label>
                <Input
                  id="km"
                  type="number"
                  placeholder="Informe a quilometragem atual"
                  value={checklist.isChecklistInicial 
                    ? checklist.kmInicial?.toString() || '' 
                    : checklist.kmFinal?.toString() || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (checklist.isChecklistInicial) {
                      setChecklist(prev => ({ ...prev, kmInicial: isNaN(value) ? undefined : value }));
                    } else {
                      setChecklist(prev => ({ ...prev, kmFinal: isNaN(value) ? undefined : value }));
                    }
                  }}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={nextStep}>Próximo</Button>
            </CardFooter>
          </Card>
        )}

        {step === 'checklist' && (
          <Card>
            <CardHeader>
              <CardTitle>Checklist do Veículo</CardTitle>
              <CardDescription>Verifique as condições do veículo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="condicoes" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="condicoes">Condições</TabsTrigger>
                  <TabsTrigger value="avarias">Avarias</TabsTrigger>
                  <TabsTrigger value="fotos">Fotos</TabsTrigger>
                </TabsList>

                <TabsContent value="condicoes" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ConditionSelect
                      label="Condição dos Pneus"
                      value={checklist.condicaoPneus}
                      onChange={(value) => setChecklist(prev => ({ ...prev, condicaoPneus: value }))}
                    />
                    
                    <ConditionSelect
                      label="Condição das Luzes"
                      value={checklist.condicaoLuzes}
                      onChange={(value) => setChecklist(prev => ({ ...prev, condicaoLuzes: value }))}
                    />
                    
                    <ConditionSelect
                      label="Condição dos Freios"
                      value={checklist.condicaoFreios}
                      onChange={(value) => setChecklist(prev => ({ ...prev, condicaoFreios: value }))}
                    />
                    
                    <ConditionSelect
                      label="Condição do Para-brisa"
                      value={checklist.condicaoParabrisa}
                      onChange={(value) => setChecklist(prev => ({ ...prev, condicaoParabrisa: value }))}
                    />
                    
                    <ConditionSelect
                      label="Nível de Óleo"
                      value={checklist.nivelOleo}
                      onChange={(value) => setChecklist(prev => ({ ...prev, nivelOleo: value }))}
                    />
                    
                    <ConditionSelect
                      label="Nível de Água"
                      value={checklist.nivelAgua}
                      onChange={(value) => setChecklist(prev => ({ ...prev, nivelAgua: value }))}
                    />

                    <ConditionSelect
                      label="Condição do Cavalo Mecânico"
                      value={checklist.condicaoCavalo}
                      onChange={(value) => setChecklist(prev => ({ ...prev, condicaoCavalo: value }))}
                    />
                    
                    <ConditionSelect
                      label="Condição da Carreta"
                      value={checklist.condicaoCarreta}
                      onChange={(value) => setChecklist(prev => ({ ...prev, condicaoCarreta: value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observations">Observações</Label>
                    <Textarea
                      id="observations"
                      placeholder="Descreva observações adicionais sobre o estado do veículo..."
                      value={checklist.observacoes || ''}
                      onChange={(e) => setChecklist(prev => ({ ...prev, observacoes: e.target.value }))}
                      rows={4}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="avarias" className="space-y-4">
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mb-4 flex items-start">
                    <ShieldAlert className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-800 font-medium">
                        Registro de Avarias
                      </p>
                      <p className="text-xs text-amber-700">
                        Selecione todas as avarias identificadas no veículo. Recomendamos adicionar fotos de cada avaria na aba "Fotos".
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {avariasOptions.map((avaria) => (
                      <div key={avaria.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={avaria.id} 
                          checked={checklist.avarias.includes(avaria.id)}
                          onCheckedChange={() => toggleAvaria(avaria.id)}
                        />
                        <label
                          htmlFor={avaria.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {avaria.label}
                        </label>
                      </div>
                    ))}
                  </div>

                  {checklist.avarias.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="damage-observations">Detalhes das Avarias</Label>
                      <Textarea
                        id="damage-observations"
                        placeholder="Descreva em detalhes as avarias identificadas..."
                        value={avisoAvaria}
                        onChange={(e) => setAvisoAvaria(e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="fotos" className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center mb-2">
                      <Camera className="h-5 w-5 mr-2 text-blue-600" />
                      <h3 className="font-medium text-gray-900">Adicionar Fotos</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      Adicione fotos do veículo, especialmente de qualquer avaria identificada
                    </p>

                    <div className="flex items-center justify-center w-full">
                      <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            Clique para enviar foto{" "}
                            <span className="font-semibold">ou arraste e solte</span>
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG ou JPEG</p>
                        </div>
                        <input 
                          id="image-upload" 
                          type="file" 
                          accept="image/*"
                          className="hidden" 
                          onChange={handleImageUpload}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Mostrar fotos enviadas */}
                  {checklist.fotos.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium mb-2">Fotos Enviadas ({checklist.fotos.length})</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {checklist.fotos.map((foto, index) => (
                          <div key={index} className="relative aspect-square overflow-hidden rounded-md border border-gray-200">
                            <img 
                              src={foto} 
                              alt={`Foto ${index + 1}`} 
                              className="object-cover w-full h-full" 
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>Voltar</Button>
              <Button onClick={nextStep}>Próximo</Button>
            </CardFooter>
          </Card>
        )}

        {step === 'requests' && (
          <Card>
            <CardHeader>
              <CardTitle>Solicitações</CardTitle>
              <CardDescription>Registre solicitações para essa viagem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="maintenance_request"
                    checked={showMaintenanceRequest}
                    onChange={() => setShowMaintenanceRequest(!showMaintenanceRequest)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <Label htmlFor="maintenance_request" className="flex items-center">
                    <Tool className="h-4 w-4 mr-2" />
                    Solicitar Manutenção
                  </Label>
                </div>
                
                {showMaintenanceRequest && (
                  <Card className="border-blue-100">
                    <CardContent className="pt-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="maintenance_description">Descrição do Problema</Label>
                        <Textarea
                          id="maintenance_description"
                          placeholder="Descreva o problema que requer manutenção..."
                          value={maintenanceRequest.descricao}
                          onChange={(e) => setMaintenanceRequest(prev => ({ ...prev, descricao: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="urgency">Urgência</Label>
                        <Select
                          value={maintenanceRequest.urgencia}
                          onValueChange={(value: any) => setMaintenanceRequest(prev => ({ ...prev, urgencia: value }))}
                        >
                          <SelectTrigger id="urgency">
                            <SelectValue placeholder="Selecione a urgência" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baixa">Baixa</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="emergencial">Emergencial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="refueling_request"
                    checked={showRefuelingRequest}
                    onChange={() => setShowRefuelingRequest(!showRefuelingRequest)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <Label htmlFor="refueling_request" className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Solicitar Recarga de Cartão
                  </Label>
                </div>
                
                {showRefuelingRequest && (
                  <Card className="border-blue-100">
                    <CardContent className="pt-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="card_number">Número do Cartão (opcional)</Label>
                        <Input
                          id="card_number"
                          placeholder="Informe o número do cartão"
                          value={refuelingRequest.numeroCartao || ''}
                          onChange={(e) => setRefuelingRequest(prev => ({ ...prev, numeroCartao: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="amount">Valor Solicitado (R$)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="0,00"
                          value={refuelingRequest.valorSolicitado.toString()}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setRefuelingRequest(prev => ({ 
                              ...prev, 
                              valorSolicitado: isNaN(value) ? 0 : value 
                            }));
                          }}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="justification">Justificativa</Label>
                        <Textarea
                          id="justification"
                          placeholder="Justifique a necessidade de recarga..."
                          value={refuelingRequest.justificativa}
                          onChange={(e) => setRefuelingRequest(prev => ({ ...prev, justificativa: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Anexar Comprovante</Label>
                        <div className="border border-dashed border-gray-300 rounded-md p-4">
                          <div className="flex items-center justify-center flex-col">
                            <FileWarning className="h-8 w-8 text-blue-500 mb-2" />
                            <p className="text-sm text-gray-500 mb-2 text-center">
                              Anexe uma foto do comprovante de abastecimento ou nota fiscal
                            </p>
                            <label htmlFor="receipt-upload" className="inline-flex cursor-pointer">
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                disabled={uploading}
                              >
                                {uploading ? (
                                  <span className="flex items-center">
                                    <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                                    Enviando...
                                  </span>
                                ) : (
                                  <span className="flex items-center">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Selecionar Arquivo
                                  </span>
                                )}
                              </Button>
                              <input 
                                id="receipt-upload" 
                                type="file" 
                                accept="image/*"
                                className="hidden" 
                                onChange={handleCardReceiptUpload}
                                disabled={uploading}
                              />
                            </label>
                          </div>
                          
                          {refuelingRequest.comprovante && (
                            <div className="mt-3 flex items-center justify-center">
                              <div className="relative w-32 h-32 border border-gray-200 rounded overflow-hidden">
                                <img 
                                  src={refuelingRequest.comprovante} 
                                  alt="Comprovante" 
                                  className="object-cover w-full h-full" 
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => setRefuelingRequest(prev => ({ ...prev, comprovante: undefined }))}
                                    className="w-8 h-8 p-0"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>Voltar</Button>
              <Button onClick={nextStep} disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Concluir Checklist'}
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 'success' && (
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CircleCheck className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle>Checklist Concluído!</CardTitle>
              <CardDescription>Seu checklist foi registrado com sucesso.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
                <p className="text-green-800">
                  {checklist.isChecklistInicial 
                    ? `Quilometragem inicial registrada: ${checklist.kmInicial} KM` 
                    : `Quilometragem final registrada: ${checklist.kmFinal} KM`}
                </p>
              </div>
              
              {showMaintenanceRequest && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="flex items-center mb-2">
                    <Info className="h-5 w-5 mr-2 text-blue-600" />
                    <p className="font-medium text-blue-800">Solicitação de Manutenção</p>
                  </div>
                  <p className="text-blue-800 text-sm">
                    Sua solicitação de manutenção foi registrada e será analisada pela equipe responsável.
                  </p>
                </div>
              )}
              
              {showRefuelingRequest && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="flex items-center mb-2">
                    <Info className="h-5 w-5 mr-2 text-blue-600" />
                    <p className="font-medium text-blue-800">Solicitação de Recarga</p>
                  </div>
                  <p className="text-blue-800 text-sm">
                    Sua solicitação de recarga do cartão foi registrada e será analisada pela equipe responsável.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => window.close()}>Fechar</Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DriverChecklist;