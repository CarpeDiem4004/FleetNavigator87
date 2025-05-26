import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-compat';
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
  ShieldAlert,
  Loader2,
  Droplets,
  Gauge,
  Fuel
} from "lucide-react";

// Tipos de condição para componentes do veículo
type Condition = 'bom' | 'regular' | 'ruim' | undefined;

// Interface para o objeto do checklist
interface Checklist {
  tripId: number | null;
  motoristaNome: string;
  motoristaId: number;
  kmAtual?: number;
  condicaoPneus?: Condition;
  condicaoLuzes?: Condition;
  condicaoFreios?: Condition;
  condicaoParabrisa?: Condition;
  nivelOleo?: Condition;
  nivelAgua?: Condition;
  estruturaCavalo?: Condition;
  estruturaCarreta?: Condition;
  avarias: string[];
  fotos: string[];
  observacoes?: string;
}

// Interface para as solicitações
interface MaintenanceRequest {
  descricao: string;
  urgencia: 'baixa' | 'normal' | 'alta' | 'emergencial';
  plate?: string;
}

interface FuelCardRequest {
  numeroCartao: string;
  valorSolicitado: number;
  kmAtual: string;
  destino: string;
  observacoes?: string;
}

// Componente para condição com ícones de cor
const ConditionSelect: React.FC<{
  label: string;
  value: Condition;
  onChange: (value: Condition) => void;
  icon?: React.ReactNode;
}> = ({ label, value, onChange, icon }) => {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {icon && icon}
        {label}
      </Label>
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

const LineHallDriverPage: React.FC = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'auth' | 'menu' | 'checklist' | 'maintenance' | 'fuelcard' | 'fuel-request' | 'success'>('auth');
  const [progress, setProgress] = useState(0);
  const [cpf, setCpf] = useState<string>('');
  const [motorista, setMotorista] = useState<{id: number, nome: string, cpf: string} | null>(null);
  const [vehicles, setVehicles] = useState<{placa: string, tipo: string}[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  
  // Checklist state
  const [checklist, setChecklist] = useState<Checklist>({
    tripId: null,
    motoristaNome: '',
    motoristaId: 0,
    avarias: [],
    fotos: []
  });
  
  // Solicitações
  const [maintenanceRequest, setMaintenanceRequest] = useState<MaintenanceRequest>({
    descricao: '',
    urgencia: 'normal'
  });
  
  const [fuelCardRequest, setFuelCardRequest] = useState<FuelCardRequest>({
    numeroCartao: '',
    valorSolicitado: 0,
    kmAtual: '',
    destino: '',
    observacoes: ''
  });

  // Estado para solicitação de abastecimento
  const [fuelRequest, setFuelRequest] = useState({
    vehiclePlate: '',
    kmAtual: 0,
    litrosEstimados: 0,
    localAbastecimento: '',
    justificativa: '',
    urgencia: 'normal' as 'baixa' | 'normal' | 'alta',
    tipoCombustivel: 'diesel' as 'diesel' | 'gasolina' | 'etanol'
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

  // Atualizar progresso com base no passo atual
  useEffect(() => {
    switch (step) {
      case 'auth':
        setProgress(10);
        break;
      case 'menu':
        setProgress(40);
        break;
      case 'checklist':
      case 'maintenance':
      case 'fuelcard':
        setProgress(75);
        break;
      case 'fuel-request':
        setProgress(75);
        break;
      case 'success':
        setProgress(100);
        break;
    }
  }, [step]);

  // Verificar o motorista por CPF
  const verificarMotorista = async () => {
    if (!cpf || cpf.length < 11) {
      toast({
        title: 'CPF inválido',
        description: 'Por favor, informe um CPF válido.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Limpar formatação do CPF
      const cpfLimpo = cpf.replace(/\D/g, '');
      
      // Buscar motorista via API específica do Line Hall
      const response = await fetch('/api/line-hall/drivers');
      if (!response.ok) {
        throw new Error('Erro ao buscar motoristas');
      }
      
      const text = await response.text();
      let drivers;
      
      try {
        drivers = JSON.parse(text);
      } catch (jsonError) {
        console.error('Erro ao fazer parse da resposta JSON:', text);
        throw new Error('Resposta inválida do servidor');
      }
      
      if (!Array.isArray(drivers)) {
        console.error('Resposta não é um array:', drivers);
        throw new Error('Formato de dados inválido');
      }
      
      const motoristaEncontrado = drivers.find((d: any) => d.cpf === cpfLimpo);

      if (!motoristaEncontrado) {
        toast({
          title: 'Motorista não encontrado',
          description: 'CPF não encontrado no sistema. Por favor, verifique se o CPF está correto ou entre em contato com o suporte.',
          variant: 'destructive',
        });
        return;
      }

      setMotorista({
        id: motoristaEncontrado.id,
        nome: motoristaEncontrado.nome,
        cpf: motoristaEncontrado.cpf
      });

      // Atualizar o checklist com informações do motorista
      setChecklist(prev => ({
        ...prev,
        motoristaNome: motoristaEncontrado.nome,
        motoristaId: motoristaEncontrado.id
      }));

      // Buscar veículos associados ao Line Hall
      await fetchVehicles();

      toast({
        title: 'Motorista identificado',
        description: `Bem-vindo, ${motoristaEncontrado.nome}!`,
      });

      // Avançar para o menu principal
      setStep('menu');
      
    } catch (error) {
      console.error('Erro ao verificar motorista:', error);
      toast({
        title: 'Erro ao verificar motorista',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar veículos da frota
  const fetchVehicles = async () => {
    try {
      // Buscar cavalos e carretas do Line Hall
      const { data, error } = await supabase
        .from('linehall_shopee')
        .select('cavalo_placa, carreta1_placa, carreta2_placa')
        .order('data_viagem', { ascending: false })
        .limit(20);
      
      if (error) throw error;

      const uniqueVehicles = new Set<string>();
      const vehiclesList: {placa: string, tipo: string}[] = [];
      
      if (data && data.length > 0) {
        data.forEach(item => {
          // Adicionar cavalos
          if (item.cavalo_placa && !uniqueVehicles.has(item.cavalo_placa)) {
            uniqueVehicles.add(item.cavalo_placa);
            vehiclesList.push({ placa: item.cavalo_placa, tipo: 'cavalo' });
          }
          
          // Adicionar carretas
          if (item.carreta1_placa && !uniqueVehicles.has(item.carreta1_placa)) {
            uniqueVehicles.add(item.carreta1_placa);
            vehiclesList.push({ placa: item.carreta1_placa, tipo: 'carreta' });
          }
          
          if (item.carreta2_placa && !uniqueVehicles.has(item.carreta2_placa)) {
            uniqueVehicles.add(item.carreta2_placa);
            vehiclesList.push({ placa: item.carreta2_placa, tipo: 'carreta' });
          }
        });
      }
      
      setVehicles(vehiclesList);
      
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
      toast({
        title: 'Erro ao carregar veículos',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  // Função para fazer upload de uma imagem
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    setUploading(true);
    
    try {
      // Criar um nome único para o arquivo usando o ID do motorista e timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `linehall_${motorista?.id}_${Date.now()}.${fileExt}`;
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
          description: 'A foto foi adicionada ao registro',
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
  
  // Função para anexar comprovante para solicitação de recarga
  const handleCardReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    setUploading(true);
    
    try {
      // Criar um nome único para o arquivo usando o ID do motorista e timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `fuel_card_${motorista?.id}_${Date.now()}.${fileExt}`;
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
        // Adicionar URL ao comprovante da solicitação de recarga
        setFuelCardRequest(prev => ({
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

  // Funções para submeter os formulários
  const submitChecklist = async () => {
    if (!selectedVehicle) {
      toast({
        title: 'Selecione um veículo',
        description: 'Por favor, selecione um veículo para continuar.',
        variant: 'destructive',
      });
      return;
    }

    if (!checklist.kmAtual) {
      toast({
        title: 'Quilometragem necessária',
        description: 'Por favor, informe a quilometragem atual do veículo.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Salvar o checklist no banco de dados
      const { data: checklistData, error: checklistError } = await supabase
        .from('vehicle_checklist')
        .insert({
          motorista_id: motorista?.id,
          motorista_nome: checklist.motoristaNome,
          placa_veiculo: selectedVehicle,
          km_atual: checklist.kmAtual,
          condicao_pneus: checklist.condicaoPneus,
          condicao_luzes: checklist.condicaoLuzes,
          condicao_freios: checklist.condicaoFreios,
          condicao_parabrisa: checklist.condicaoParabrisa,
          nivel_oleo: checklist.nivelOleo,
          nivel_agua: checklist.nivelAgua,
          estrutura_cavalo: checklist.estruturaCavalo,
          estrutura_carreta: checklist.estruturaCarreta,
          avarias: checklist.avarias,
          fotos: checklist.fotos,
          observacoes: checklist.observacoes,
          tipo: 'line_hall',
          status: 'concluido'
        })
        .select();

      if (checklistError) throw checklistError;
      
      // Mostrar mensagem de sucesso
      toast({
        title: 'Checklist enviado',
        description: 'O checklist do veículo foi registrado com sucesso!',
      });
      
      // Voltar para o menu
      setStep('menu');
      
    } catch (error) {
      console.error('Erro ao enviar checklist:', error);
      toast({
        title: 'Erro ao salvar checklist',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitMaintenanceRequest = async () => {
    if (!selectedVehicle) {
      toast({
        title: 'Selecione um veículo',
        description: 'Por favor, selecione um veículo para continuar.',
        variant: 'destructive',
      });
      return;
    }

    if (!maintenanceRequest.descricao) {
      toast({
        title: 'Descrição necessária',
        description: 'Por favor, descreva o problema para solicitação de manutenção.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Salvar a solicitação de manutenção
      const { error: maintenanceError } = await supabase
        .from('solicitacao_manutencao')
        .insert({
          motorista_id: motorista?.id,
          motorista_nome: motorista?.nome,
          placa_veiculo: selectedVehicle,
          descricao: maintenanceRequest.descricao,
          urgencia: maintenanceRequest.urgencia,
          origem: 'line_hall',
          status: 'pendente'
        });
        
      if (maintenanceError) throw maintenanceError;
      
      // Mostrar mensagem de sucesso
      toast({
        title: 'Solicitação enviada',
        description: 'Sua solicitação de manutenção foi registrada e será analisada pela equipe.',
      });
      
      // Limpar formulário
      setMaintenanceRequest({
        descricao: '',
        urgencia: 'normal'
      });
      
      // Voltar para o menu
      setStep('menu');
      
    } catch (error) {
      console.error('Erro ao enviar solicitação de manutenção:', error);
      toast({
        title: 'Erro ao salvar solicitação',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitFuelCardRequest = async () => {
    if (!selectedVehicle) {
      toast({
        title: 'Selecione um veículo',
        description: 'Por favor, selecione um veículo para continuar.',
        variant: 'destructive',
      });
      return;
    }

    if (!fuelCardRequest.numeroCartao) {
      toast({
        title: 'Número do cartão necessário',
        description: 'Por favor, informe o número do cartão de combustível.',
        variant: 'destructive',
      });
      return;
    }

    if (!fuelCardRequest.valorSolicitado || fuelCardRequest.valorSolicitado <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Por favor, informe um valor válido para a recarga.',
        variant: 'destructive',
      });
      return;
    }

    if (!fuelCardRequest.justificativa) {
      toast({
        title: 'Justificativa necessária',
        description: 'Por favor, informe a justificativa para a recarga do cartão.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Enviar solicitação para API do sistema (conectando ao módulo Fuel Card)
      const response = await fetch('/api/fuel-card/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plate: selectedVehicle,
          km_atual: fuelCardRequest.kmAtual,
          card_number: fuelCardRequest.numeroCartao,
          amount: fuelCardRequest.valorSolicitado,
          destino: fuelCardRequest.destino,
          observacoes: fuelCardRequest.observacoes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao processar solicitação de recarga');
      }
      
      // Backup - salvar também na tabela do Supabase caso precisemos
      const { error: supabaseError } = await supabase
        .from('fuel_card_requests')
        .insert({
          motorista_id: motorista?.id,
          motorista_nome: motorista?.nome,
          placa_veiculo: selectedVehicle,
          numero_cartao: fuelCardRequest.numeroCartao,
          valor_solicitado: fuelCardRequest.valorSolicitado,
          justificativa: fuelCardRequest.justificativa,
          comprovante: fuelCardRequest.comprovante,
          status: 'pendente'
        });
      
      if (supabaseError) {
        console.warn('Aviso: Falha no backup para Supabase:', supabaseError);
      }
      
      // Mostrar mensagem de sucesso
      toast({
        title: 'Solicitação enviada',
        description: 'Sua solicitação de recarga de cartão foi registrada e será analisada pela equipe.',
      });
      
      // Limpar formulário
      setFuelCardRequest({
        numeroCartao: '',
        valorSolicitado: 0,
        kmAtual: '',
        destino: '',
        observacoes: ''
      });
      
      // Voltar para o menu
      setStep('menu');
      
    } catch (error) {
      console.error('Erro ao enviar solicitação de recarga:', error);
      toast({
        title: 'Erro ao salvar solicitação',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderização da tela de autenticação por CPF
  const renderAuthScreen = () => {
    const formatCPF = (value: string) => {
      // Remove tudo que não é número
      const numbersOnly = value.replace(/\D/g, '');
      
      // Aplica a formatação de CPF (000.000.000-00)
      let formattedCPF = numbersOnly;
      if (numbersOnly.length > 3) {
        formattedCPF = `${numbersOnly.slice(0, 3)}.${numbersOnly.slice(3)}`;
      }
      if (numbersOnly.length > 6) {
        formattedCPF = `${formattedCPF.slice(0, 7)}.${formattedCPF.slice(7)}`;
      }
      if (numbersOnly.length > 9) {
        formattedCPF = `${formattedCPF.slice(0, 11)}-${formattedCPF.slice(11, 13)}`;
      }
      
      return formattedCPF;
    };

    const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCpf(formatCPF(e.target.value));
    };

    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Acesso Motorista</CardTitle>
          <CardDescription className="text-center">
            Digite seu CPF para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCPFChange}
                maxLength={14}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={verificarMotorista}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              'Acessar'
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // Renderização do menu principal
  const renderMenuScreen = () => {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Menu do Motorista</CardTitle>
          <CardDescription className="text-center">
            Olá, {motorista?.nome}! O que você deseja fazer?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vehicle">Selecione o veículo</Label>
            <Select 
              value={selectedVehicle} 
              onValueChange={setSelectedVehicle}
            >
              <SelectTrigger id="vehicle">
                <SelectValue placeholder="Selecione o veículo" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.placa} value={vehicle.placa}>
                    {vehicle.placa} ({vehicle.tipo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 pt-4">
            <Button
              className="flex items-center gap-2"
              onClick={() => setStep('checklist')}
              disabled={!selectedVehicle}
            >
              <CheckSquare className="h-5 w-5" />
              Realizar Checklist do Veículo
            </Button>
            
            <Button
              className="flex items-center gap-2"
              onClick={() => setStep('maintenance')}
              disabled={!selectedVehicle}
              variant="outline"
            >
              <Tool className="h-5 w-5" />
              Solicitar Manutenção
            </Button>
            
            <Button
              className="flex items-center gap-2"
              onClick={() => setStep('fuel-request')}
              disabled={!selectedVehicle}
              variant="outline"
            >
              <CreditCard className="h-5 w-5" />
              Solicitar Abastecimento
            </Button>
            
            <Button
              className="flex items-center gap-2"
              onClick={() => setStep('fuelcard')}
              disabled={!selectedVehicle}
              variant="outline"
            >
              <CreditCard className="h-5 w-5" />
              Solicitar Recarga de Cartão
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="destructive" 
            onClick={() => {
              setStep('auth');
              setMotorista(null);
              setCpf('');
              setSelectedVehicle('');
            }}
          >
            Sair
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // Renderização da tela de checklist
  const renderChecklistScreen = () => {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Checklist do Veículo</CardTitle>
          <CardDescription>
            Veículo: {selectedVehicle}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* KM atual */}
            <div className="space-y-2">
              <Label htmlFor="km" className="flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Quilometragem Atual
              </Label>
              <Input
                id="km"
                type="number"
                placeholder="Informe o KM atual"
                value={checklist.kmAtual || ''}
                onChange={(e) => setChecklist(prev => ({ ...prev, kmAtual: parseInt(e.target.value) || 0 }))}
              />
            </div>

            {/* Condição dos pneus */}
            <ConditionSelect
              label="Condição dos Pneus"
              value={checklist.condicaoPneus}
              onChange={(value) => setChecklist(prev => ({ ...prev, condicaoPneus: value }))}
            />

            {/* Condição das luzes */}
            <ConditionSelect
              label="Condição das Luzes/Faróis"
              value={checklist.condicaoLuzes}
              onChange={(value) => setChecklist(prev => ({ ...prev, condicaoLuzes: value }))}
            />

            {/* Condição dos freios */}
            <ConditionSelect
              label="Condição dos Freios"
              value={checklist.condicaoFreios}
              onChange={(value) => setChecklist(prev => ({ ...prev, condicaoFreios: value }))}
            />

            {/* Nível de óleo */}
            <ConditionSelect
              label="Nível de Óleo"
              value={checklist.nivelOleo}
              onChange={(value) => setChecklist(prev => ({ ...prev, nivelOleo: value }))}
              icon={<Droplets className="h-4 w-4" />}
            />

            {/* Nível de água */}
            <ConditionSelect
              label="Nível de Água"
              value={checklist.nivelAgua}
              onChange={(value) => setChecklist(prev => ({ ...prev, nivelAgua: value }))}
            />

            {/* Estrutura do cavalo */}
            <ConditionSelect
              label="Estrutura do Cavalo"
              value={checklist.estruturaCavalo}
              onChange={(value) => setChecklist(prev => ({ ...prev, estruturaCavalo: value }))}
              icon={<Truck className="h-4 w-4" />}
            />

            {/* Estrutura da carreta */}
            <ConditionSelect
              label="Estrutura da Carreta"
              value={checklist.estruturaCarreta}
              onChange={(value) => setChecklist(prev => ({ ...prev, estruturaCarreta: value }))}
            />
          </div>

          <Separator />

          {/* Avarias */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <FileWarning className="h-4 w-4" />
              Avarias Detectadas
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {avariasOptions.map((avaria) => (
                <div key={avaria.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={`avaria-${avaria.id}`}
                    checked={checklist.avarias.includes(avaria.id)}
                    onCheckedChange={() => toggleAvaria(avaria.id)}
                  />
                  <Label
                    htmlFor={`avaria-${avaria.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {avaria.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Upload de fotos */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Anexar Fotos do Veículo
            </Label>
            <div className="space-y-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="cursor-pointer"
              />
              {uploading && (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Enviando imagem...</span>
                </div>
              )}
              
              {/* Preview das fotos */}
              {checklist.fotos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {checklist.fotos.map((foto, index) => (
                    <div key={index} className="relative">
                      <img
                        src={foto}
                        alt={`Foto ${index + 1}`}
                        className="object-cover h-20 w-full rounded-md"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
                        onClick={() => {
                          setChecklist(prev => ({
                            ...prev,
                            fotos: prev.fotos.filter((_, i) => i !== index)
                          }));
                        }}
                      >
                        <XCircle className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações Adicionais</Label>
            <Textarea
              id="observacoes"
              placeholder="Descreva outras observações importantes"
              value={checklist.observacoes || ''}
              onChange={(e) => setChecklist(prev => ({ ...prev, observacoes: e.target.value }))}
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setStep('menu')}
            disabled={isSubmitting}
          >
            Voltar
          </Button>
          <Button 
            onClick={submitChecklist}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Checklist'
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // Renderização da tela de solicitação de manutenção
  const renderMaintenanceScreen = () => {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Solicitar Manutenção</CardTitle>
          <CardDescription>
            Veículo: {selectedVehicle}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Descrição do problema */}
          <div className="space-y-2">
            <Label htmlFor="descricao" className="flex items-center gap-2">
              <Tool className="h-4 w-4" />
              Descrição do Problema
            </Label>
            <Textarea
              id="descricao"
              placeholder="Descreva detalhadamente o problema que necessita de manutenção"
              value={maintenanceRequest.descricao}
              onChange={(e) => setMaintenanceRequest(prev => ({ ...prev, descricao: e.target.value }))}
              rows={5}
            />
          </div>

          {/* Urgência */}
          <div className="space-y-2">
            <Label htmlFor="urgencia">Nível de Urgência</Label>
            <Select 
              value={maintenanceRequest.urgencia} 
              onValueChange={(val) => setMaintenanceRequest(prev => ({ 
                ...prev, 
                urgencia: val as 'baixa' | 'normal' | 'alta' | 'emergencial' 
              }))}
            >
              <SelectTrigger id="urgencia">
                <SelectValue placeholder="Selecione o nível de urgência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa" className="flex items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    Baixa
                  </div>
                </SelectItem>
                <SelectItem value="normal" className="flex items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    Normal
                  </div>
                </SelectItem>
                <SelectItem value="alta" className="flex items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                    Alta
                  </div>
                </SelectItem>
                <SelectItem value="emergencial" className="flex items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    Emergencial
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setStep('menu')}
            disabled={isSubmitting}
          >
            Voltar
          </Button>
          <Button 
            onClick={submitMaintenanceRequest}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Solicitação'
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // Renderização da tela de solicitação de recarga de cartão
  const renderFuelCardScreen = () => {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Solicitar Recarga de Cartão de Abastecimento</CardTitle>
          <CardDescription>
            Veículo: {selectedVehicle}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Número do cartão */}
          <div className="space-y-2">
            <Label htmlFor="numeroCartao" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Número do Cartão
            </Label>
            <Input
              id="numeroCartao"
              placeholder="Informe o número do cartão de abastecimento"
              value={fuelCardRequest.numeroCartao}
              onChange={(e) => setFuelCardRequest(prev => ({ ...prev, numeroCartao: e.target.value }))}
            />
          </div>

          {/* Valor da recarga */}
          <div className="space-y-2">
            <Label htmlFor="valorSolicitado">Valor da Recarga (R$)</Label>
            <Input
              id="valorSolicitado"
              type="number"
              placeholder="0,00"
              value={fuelCardRequest.valorSolicitado || ''}
              onChange={(e) => setFuelCardRequest(prev => ({ 
                ...prev, 
                valorSolicitado: parseFloat(e.target.value) || 0
              }))}
            />
          </div>

          {/* Justificativa */}
          <div className="space-y-2">
            <Label htmlFor="justificativa">Justificativa</Label>
            <Textarea
              id="justificativa"
              placeholder="Informe o motivo para a recarga do cartão de abastecimento"
              value={fuelCardRequest.justificativa}
              onChange={(e) => setFuelCardRequest(prev => ({ ...prev, justificativa: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Upload de comprovante */}
          <div className="space-y-2">
            <Label htmlFor="comprovante" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Anexar Comprovante (opcional)
            </Label>
            <Input
              id="comprovante"
              type="file"
              accept="image/*"
              onChange={handleCardReceiptUpload}
              disabled={uploading}
              className="cursor-pointer"
            />
            {uploading && (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Enviando arquivo...</span>
              </div>
            )}
            
            {/* Preview do comprovante */}
            {fuelCardRequest.comprovante && (
              <div className="mt-2">
                <div className="relative inline-block">
                  <img
                    src={fuelCardRequest.comprovante}
                    alt="Comprovante"
                    className="object-cover h-32 rounded-md"
                  />
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
                    onClick={() => {
                      setFuelCardRequest(prev => ({
                        ...prev,
                        comprovante: undefined
                      }));
                    }}
                  >
                    <XCircle className="h-3 w-3 text-white" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setStep('menu')}
            disabled={isSubmitting}
          >
            Voltar
          </Button>
          <Button 
            onClick={submitFuelCardRequest}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Solicitação'
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // Função para enviar solicitação de abastecimento
  const submitFuelRequest = async () => {
    if (!motorista || !selectedVehicle) return;

    setIsSubmitting(true);
    try {
      const requestData = {
        motorista_id: motorista.id,
        motorista_nome: motorista.nome,
        vehicle_plate: selectedVehicle,
        km_atual: fuelRequest.kmAtual,
        litros_estimados: fuelRequest.litrosEstimados,
        local_abastecimento: fuelRequest.localAbastecimento,
        justificativa: fuelRequest.justificativa,
        urgencia: fuelRequest.urgencia,
        tipo_combustivel: fuelRequest.tipoCombustivel,
        status: 'pendente'
      };

      const response = await fetch('/api/line-hall/fuel-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        toast({
          title: "Solicitação enviada!",
          description: "Sua solicitação de abastecimento foi enviada com sucesso. Você será notificado quando for aprovada.",
        });
        setStep('success');
      } else {
        throw new Error('Falha ao enviar solicitação');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar solicitação de abastecimento",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tela de solicitação de abastecimento
  const renderFuelRequestScreen = () => {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Solicitar Abastecimento
          </CardTitle>
          <CardDescription>
            Solicite autorização para abastecer o veículo {selectedVehicle}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quilometragem Atual */}
            <div className="space-y-2">
              <Label htmlFor="km-atual">Quilometragem Atual *</Label>
              <Input
                id="km-atual"
                type="number"
                placeholder="Ex: 150000"
                value={fuelRequest.kmAtual || ''}
                onChange={(e) => setFuelRequest(prev => ({ 
                  ...prev, 
                  kmAtual: parseInt(e.target.value) || 0 
                }))}
              />
            </div>

            {/* Litros Estimados */}
            <div className="space-y-2">
              <Label htmlFor="litros">Litros Estimados *</Label>
              <Input
                id="litros"
                type="number"
                placeholder="Ex: 200"
                value={fuelRequest.litrosEstimados || ''}
                onChange={(e) => setFuelRequest(prev => ({ 
                  ...prev, 
                  litrosEstimados: parseInt(e.target.value) || 0 
                }))}
              />
            </div>

            {/* Tipo de Combustível */}
            <div className="space-y-2">
              <Label htmlFor="combustivel">Tipo de Combustível *</Label>
              <Select 
                value={fuelRequest.tipoCombustivel} 
                onValueChange={(value) => setFuelRequest(prev => ({ 
                  ...prev, 
                  tipoCombustivel: value as 'diesel' | 'gasolina' | 'etanol' 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o combustível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="gasolina">Gasolina</SelectItem>
                  <SelectItem value="etanol">Etanol</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Urgência */}
            <div className="space-y-2">
              <Label htmlFor="urgencia">Urgência *</Label>
              <Select 
                value={fuelRequest.urgencia} 
                onValueChange={(value) => setFuelRequest(prev => ({ 
                  ...prev, 
                  urgencia: value as 'baixa' | 'normal' | 'alta' 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a urgência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Local de Abastecimento */}
          <div className="space-y-2">
            <Label htmlFor="local">Local de Abastecimento *</Label>
            <Input
              id="local"
              placeholder="Ex: Posto Shell - Rod. Dutra km 225"
              value={fuelRequest.localAbastecimento}
              onChange={(e) => setFuelRequest(prev => ({ 
                ...prev, 
                localAbastecimento: e.target.value 
              }))}
            />
          </div>

          {/* Justificativa */}
          <div className="space-y-2">
            <Label htmlFor="justificativa">Justificativa *</Label>
            <Textarea
              id="justificativa"
              placeholder="Descreva o motivo da solicitação de abastecimento..."
              value={fuelRequest.justificativa}
              onChange={(e) => setFuelRequest(prev => ({ 
                ...prev, 
                justificativa: e.target.value 
              }))}
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline"
            onClick={() => setStep('menu')}
            disabled={isSubmitting}
          >
            Voltar
          </Button>
          <Button 
            onClick={submitFuelRequest}
            disabled={isSubmitting || !fuelRequest.kmAtual || !fuelRequest.litrosEstimados || 
                     !fuelRequest.localAbastecimento || !fuelRequest.justificativa}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Solicitação'
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-primary py-4 px-6 shadow-md">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-white text-2xl font-bold">Portal do Motorista - Line Hall</h1>
        </div>
      </header>
      
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="w-full mb-6">
            <Progress value={progress} className="h-2" />
          </div>
          
          {step === 'auth' && renderAuthScreen()}
          {step === 'menu' && renderMenuScreen()}
          {step === 'checklist' && renderChecklistScreen()}
          {step === 'maintenance' && renderMaintenanceScreen()}
          {step === 'fuelcard' && renderFuelCardScreen()}
          {step === 'fuel-request' && renderFuelRequestScreen()}
        </div>
      </main>
      
      <footer className="bg-slate-100 py-3 px-6 border-t">
        <div className="max-w-4xl mx-auto text-center text-sm text-slate-600">
          Sistema de Gestão de Frotas &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default LineHallDriverPage;