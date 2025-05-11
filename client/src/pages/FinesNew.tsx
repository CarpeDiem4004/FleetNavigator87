import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, FileEdit, Trash2, AlertCircle, FileText, Upload, Download, CheckCircle, Clock } from 'lucide-react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

// Tipo para multas
interface Fine {
  id: number;
  vehiclePlate: string;
  driver: string;
  base?: string;
  baseId?: number;
  date: string;
  location: string;
  type: string;
  infringementCode?: string; // código da infração
  points: number;
  amount: number;
  dueDate: string;
  status: 'pendente' | 'paga' | 'contestada' | 'em_andamento' | 'cancelada';
  description: string;
  notificationFileUrl?: string; // URL do arquivo de notificação
  driverSignatureUrl?: string; // URL da assinatura do motorista
  signatureDate?: string; // Data da assinatura
  lifecycle?: 'aguardando_base' | 'aguardando_assinatura' | 'assinado' | 'finalizado'; // Ciclo de vida da multa
}

// Tipo para veículos
interface Vehicle {
  id: number;
  plate: string;
  driver: string;
  base: string;
  baseId: number;
}

// Interface para códigos de infração
interface InfringementCode {
  code: string;
  description: string;
  points: number;
  amount: number;
}

// Lista de códigos de infração
const infringementCodes: InfringementCode[] = [
  { code: '501-0', description: 'Dirigir veículo sem possuir CNH', amount: 880.41, points: 7 },
  { code: '502-9', description: 'Dirigir veículo com CNH cassada', amount: 880.41, points: 7 },
  { code: '503-7', description: 'Dirigir veículo com CNH suspensa', amount: 880.41, points: 7 },
  { code: '504-5', description: 'Dirigir veículo com categoria diferente da sua habilitação', amount: 880.41, points: 7 },
  { code: '505-3', description: 'Dirigir veículo com CNH vencida há mais de 30 dias', amount: 293.47, points: 3 },
  { code: '506-1', description: 'Entregar veículo à pessoa sem habilitação', amount: 880.41, points: 7 },
  { code: '507-0', description: 'Deixar o condutor de usar cinto de segurança', amount: 195.23, points: 5 },
  { code: '508-8', description: 'Transportar criança sem observar as normas de segurança', amount: 293.47, points: 5 },
  { code: '509-6', description: 'Dirigir sem atenção (usando celular, comendo, etc.)', amount: 130.16, points: 3 },
  { code: '510-0', description: 'Excesso de velocidade até 20% acima do permitido', amount: 130.16, points: 4 },
  { code: '511-8', description: 'Excesso de velocidade entre 20% e 50% acima do permitido', amount: 195.23, points: 5 },
  { code: '512-6', description: 'Excesso de velocidade acima de 50% do permitido', amount: 880.41, points: 7 },
  { code: '513-4', description: 'Avançar o sinal vermelho do semáforo', amount: 293.47, points: 7 },
  { code: '514-2', description: 'Transitar pela contramão', amount: 293.47, points: 7 },
  { code: '515-0', description: 'Estacionar em local proibido', amount: 130.16, points: 3 },
  { code: '516-9', description: 'Estacionar sobre faixa de pedestres', amount: 293.47, points: 5 },
  { code: '517-7', description: 'Parar sobre a faixa de pedestres na mudança de sinal', amount: 293.47, points: 4 },
  { code: '518-5', description: 'Não dar preferência ao pedestre na faixa', amount: 293.47, points: 5 },
  { code: '519-3', description: 'Dirigir sob influência de álcool', amount: 2934.70, points: 7 },
  { code: '520-7', description: 'Não utilizar tacógrafo quando obrigatório', amount: 1250.00, points: 5 },
  { code: '521-5', description: 'Conduzir veículo sem equipamento obrigatório', amount: 195.23, points: 3 },
  { code: '522-3', description: 'Transitar em local/horário não permitido para caminhões', amount: 130.16, points: 4 },
  { code: '523-1', description: 'Derramar/arremessar carga na via pública', amount: 195.23, points: 4 },
  { code: '524-0', description: 'Transitar com excesso de peso/dimensões', amount: 293.47, points: 5 },
  { code: '525-8', description: 'Transitar em faixa exclusiva de ônibus', amount: 293.47, points: 5 }
];

// Dados mockados para a tabela de multas
const mockFines: Fine[] = [
  {
    id: 1,
    vehiclePlate: 'ABC-1234',
    driver: 'João Silva',
    base: 'Campinas',
    baseId: 2,
    date: '2025-03-15',
    location: 'Av. Paulista, São Paulo - SP',
    type: 'Excesso de velocidade',
    infringementCode: '510-0',
    points: 7,
    amount: 293.47,
    dueDate: '2025-04-15',
    status: 'pendente',
    description: 'Veículo flagrado a 75 km/h em via com limite de 60 km/h',
    notificationFileUrl: 'https://storage.gestaoonfleet.com.br/multas/notificacao_ABC1234_15032025.pdf',
    lifecycle: 'aguardando_base'
  },
  {
    id: 2,
    vehiclePlate: 'DEF-5678',
    driver: 'Carlos Santos',
    base: 'Campinas',
    baseId: 2,
    date: '2025-03-10',
    location: 'Rodovia Anhanguera, Campinas - SP',
    type: 'Ultrapassagem indevida',
    infringementCode: '514-2',
    points: 5,
    amount: 195.23,
    dueDate: '2025-04-10',
    status: 'paga',
    description: 'Ultrapassagem em faixa contínua',
    notificationFileUrl: 'https://storage.gestaoonfleet.com.br/multas/notificacao_DEF5678_10032025.pdf',
    driverSignatureUrl: 'https://storage.gestaoonfleet.com.br/multas/assinatura_DEF5678_15032025.pdf',
    signatureDate: '2025-03-15',
    lifecycle: 'finalizado'
  },
  {
    id: 3,
    vehiclePlate: 'GHI-9012',
    driver: 'Marcos Oliveira',
    base: 'São Paulo',
    baseId: 1,
    date: '2025-03-05',
    location: 'Rodovia Presidente Dutra, Rio de Janeiro - RJ',
    type: 'Estacionamento proibido',
    infringementCode: '515-0',
    points: 3,
    amount: 88.38,
    dueDate: '2025-04-05',
    status: 'contestada',
    description: 'Veículo estacionado em local proibido durante carga e descarga',
    notificationFileUrl: 'https://storage.gestaoonfleet.com.br/multas/notificacao_GHI9012_05032025.pdf',
    lifecycle: 'aguardando_assinatura'
  },
  {
    id: 4,
    vehiclePlate: 'ABC-1234',
    driver: 'João Silva',
    base: 'Campinas',
    baseId: 2,
    date: '2025-02-28',
    location: 'Av. Brasil, Rio de Janeiro - RJ',
    type: 'Excesso de velocidade',
    infringementCode: '512-6',
    points: 7,
    amount: 293.47,
    dueDate: '2025-03-30',
    status: 'paga',
    description: 'Veículo flagrado a 90 km/h em via com limite de 60 km/h',
    notificationFileUrl: 'https://storage.gestaoonfleet.com.br/multas/notificacao_ABC1234_28022025.pdf',
    driverSignatureUrl: 'https://storage.gestaoonfleet.com.br/multas/assinatura_ABC1234_05032025.pdf',
    signatureDate: '2025-03-05',
    lifecycle: 'finalizado'
  },
  {
    id: 5,
    vehiclePlate: 'MNO-7890',
    driver: 'Ana Souza',
    base: 'Osasco',
    baseId: 3,
    date: '2025-03-20',
    location: 'Av. Rebouças, São Paulo - SP',
    type: 'Avanço de sinal vermelho',
    infringementCode: '513-4',
    points: 7,
    amount: 293.47,
    dueDate: '2025-04-20',
    status: 'pendente',
    description: 'Veículo flagrado avançando o sinal vermelho em cruzamento',
    notificationFileUrl: 'https://storage.gestaoonfleet.com.br/multas/notificacao_MNO7890_20032025.pdf',
    driverSignatureUrl: 'https://storage.gestaoonfleet.com.br/multas/assinatura_MNO7890_26032025.pdf',
    signatureDate: '2025-03-26',
    lifecycle: 'assinado'
  }
];

// Função para traduzir os status de multa
const translateFineStatus = (status: string): string => {
  const statuses: Record<string, string> = {
    pendente: 'Pendente',
    paga: 'Paga',
    contestada: 'Contestada',
    em_andamento: 'Em andamento',
    cancelada: 'Cancelada'
  };
  return statuses[status] || status;
};

// Função para traduzir os status do ciclo de vida
const translateLifecycleStatus = (lifecycle?: string): string => {
  const lifecycles: Record<string, string> = {
    aguardando_base: 'Aguardando Base',
    aguardando_assinatura: 'Aguardando Assinatura',
    assinado: 'Assinado',
    finalizado: 'Finalizado'
  };
  return lifecycle ? lifecycles[lifecycle] || lifecycle : 'N/A';
};

// Função para obter a classe CSS para o badge de status
const getStatusBadgeClass = (status: string): string => {
  const classes: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-800',
    paga: 'bg-green-100 text-green-800',
    contestada: 'bg-blue-100 text-blue-800',
    em_andamento: 'bg-blue-100 text-blue-800',
    cancelada: 'bg-gray-100 text-gray-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

// Função para obter a classe CSS para o badge de ciclo de vida
const getLifecycleBadgeClass = (lifecycle?: string): string => {
  if (!lifecycle) return 'bg-gray-100 text-gray-800';
  
  const classes: Record<string, string> = {
    aguardando_base: 'bg-amber-100 text-amber-800',
    aguardando_assinatura: 'bg-purple-100 text-purple-800',
    assinado: 'bg-indigo-100 text-indigo-800',
    finalizado: 'bg-emerald-100 text-emerald-800'
  };
  return classes[lifecycle] || 'bg-gray-100 text-gray-800';
};

// Função para avançar o ciclo de vida da multa
const advanceLifecycle = (fine: Fine): string => {
  const currentLifecycle = fine.lifecycle || 'aguardando_base';

  // Ordem do ciclo de vida
  const lifecycleOrder = [
    'aguardando_base',
    'aguardando_assinatura',
    'assinado',
    'finalizado'
  ];

  const currentIndex = lifecycleOrder.indexOf(currentLifecycle);
  
  // Se está no último estágio ou estágio não encontrado, mantém o mesmo
  if (currentIndex === -1 || currentIndex === lifecycleOrder.length - 1) {
    return currentLifecycle;
  }

  // Avança para o próximo estágio
  return lifecycleOrder[currentIndex + 1];
};

// Função para verificar se o próximo passo é possível
const canAdvanceLifecycle = (fine: Fine): boolean => {
  const currentLifecycle = fine.lifecycle || 'aguardando_base';
  
  // Verifica se o ciclo de vida está finalizado
  if (currentLifecycle === 'finalizado') {
    return false;
  }
  
  // Verifica se há notificação anexada (necessário para avançar do aguardando_base)
  if (currentLifecycle === 'aguardando_base' && !fine.notificationFileUrl) {
    return false;
  }
  
  // Verifica se há assinatura anexada (necessário para avançar de aguardando_assinatura)
  if (currentLifecycle === 'aguardando_assinatura' && !fine.driverSignatureUrl) {
    return false;
  }
  
  return true;
};

// Função para formatar valores monetários
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Função para formatar datas
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

const FinesNew: React.FC = () => {
  const [fines, setFines] = useState<Fine[]>(mockFines);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  // State para gerenciar upload de arquivos
  const [notificationFile, setNotificationFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Estado para controle do modal de anexos
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  // Estado para armazenar a multa que está sendo editada/atualizada
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);
  // Estado para armazenar o tipo de anexo que está sendo feito
  const [attachmentType, setAttachmentType] = useState<'notification' | 'signature'>('notification');
  
  // Instância do hook toast
  const { toast } = useToast();
  
  const [newFine, setNewFine] = useState<Partial<Fine>>({
    vehiclePlate: '',
    driver: '',
    base: '',
    baseId: 0,
    date: new Date().toISOString().split('T')[0],
    location: '',
    type: '',
    infringementCode: '',
    points: 0,
    amount: 0,
    dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0], // 30 dias à frente
    status: 'pendente',
    description: '',
    lifecycle: 'aguardando_base' // Estado inicial do ciclo de vida
  });

  // Buscar todos os veículos
  const { 
    data: vehicles, 
    isLoading: isLoadingVehicles, 
    error: vehiclesError 
  } = useQuery({
    queryKey: ['/api/vehicles'],
    queryFn: async () => {
      // Em produção, isso seria substituído por uma chamada real à API
      // return await apiRequest('/api/vehicles');
      
      // Simulando dados de veículos
      return Promise.resolve<Vehicle[]>([
        { id: 1, plate: 'ABC-1234', driver: 'João Silva', base: 'Campinas', baseId: 2 },
        { id: 2, plate: 'DEF-5678', driver: 'Carlos Santos', base: 'Campinas', baseId: 2 },
        { id: 3, plate: 'GHI-9012', driver: 'Marcos Oliveira', base: 'São Paulo', baseId: 1 },
        { id: 4, plate: 'JKL-3456', driver: 'Pedro Almeida', base: 'Campinas', baseId: 2 },
        { id: 5, plate: 'MNO-7890', driver: 'Ana Souza', base: 'Osasco', baseId: 3 },
        { id: 6, plate: 'PQR-1234', driver: 'Roberto Lima', base: 'Guarulhos', baseId: 4 },
        { id: 7, plate: 'STU-5678', driver: 'Fernanda Costa', base: 'ABC', baseId: 5 },
        { id: 8, plate: 'VWX-9012', driver: 'José Oliveira', base: 'Socorro', baseId: 6 },
        { id: 9, plate: 'YZA-3456', driver: 'Camila Santos', base: 'Sorocaba', baseId: 7 },
      ]);
    }
  });

  // Filtrar multas com base no termo de busca
  const filteredFines = fines.filter(
    (fine) => 
      fine.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) || 
      fine.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fine.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fine.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fine.base && fine.base.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Lidar com a mudança da placa do veículo selecionado
  const handleVehiclePlateChange = (plate: string) => {
    const vehicle = vehicles?.find(v => v.plate === plate);
    if (vehicle) {
      setNewFine({
        ...newFine,
        vehiclePlate: vehicle.plate,
        driver: vehicle.driver,
        base: vehicle.base,
        baseId: vehicle.baseId
      });
    } else {
      setNewFine({
        ...newFine,
        vehiclePlate: plate,
        driver: '',
        base: '',
        baseId: 0
      });
    }
  };

  // Lidar com a mudança do código de infração
  const handleInfringementCodeChange = (code: string) => {
    const infringement = infringementCodes.find(i => i.code === code);
    if (infringement) {
      setNewFine({
        ...newFine,
        infringementCode: infringement.code,
        type: infringement.description,
        points: infringement.points,
        amount: infringement.amount
      });
    }
  };

  // Manipular a seleção de arquivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setNotificationFile(e.target.files[0]);
      setUploadError(null);
    }
  };

  // Função para fazer upload da notificação
  const uploadNotificationFile = async (): Promise<string | null> => {
    if (!notificationFile) return null;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simular progresso de upload (em produção, isso seria um upload real)
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(interval);
            return 100;
          }
          return newProgress;
        });
      }, 300);
      
      // Simular upload (em produção, isso seria substituído por uma chamada de API real)
      return new Promise((resolve) => {
        setTimeout(() => {
          clearInterval(interval);
          setUploadProgress(100);
          setIsUploading(false);
          
          // URL simulada do arquivo no storage
          const fileUrl = `https://storage.gestaoonfleet.com.br/multas/${Date.now()}_${notificationFile.name.replace(/\s+/g, '_')}`;
          resolve(fileUrl);
        }, 3000);
      });
    } catch (error) {
      setUploadError('Erro ao fazer upload do arquivo. Tente novamente.');
      setIsUploading(false);
      console.error('Erro no upload:', error);
      return null;
    }
  };

  // Adicionar nova multa
  const handleAddFine = async () => {
    if (newFine.vehiclePlate && newFine.type) {
      let notificationFileUrl = null;
      
      if (notificationFile) {
        notificationFileUrl = await uploadNotificationFile();
      }
      
      const fine = {
        ...newFine,
        id: fines.length + 1,
        driver: newFine.driver || 'A identificar pela base',
        status: 'pendente',
        notificationFileUrl,
        lifecycle: 'aguardando_base' // O ciclo de vida começa aguardando a base identificar o motorista
      } as Fine;
      
      setFines([...fines, fine]);
      setIsAddDialogOpen(false);
      
      // Resetar os states
      setNewFine({
        vehiclePlate: '',
        driver: '',
        base: '',
        baseId: 0,
        date: new Date().toISOString().split('T')[0],
        location: '',
        type: '',
        infringementCode: '',
        points: 0,
        amount: 0,
        dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        status: 'pendente',
        description: '',
        lifecycle: 'aguardando_base'
      });
      setNotificationFile(null);
      setUploadProgress(0);

      // Em um cenário real, isso enviaria os dados para a API
      console.log('Dados da multa enviados:', fine);
    }
  };

  return (
    <MainLayoutSimple>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Multas</h1>
            <p className="text-gray-500">
              Gestão centralizada de multas de trânsito da frota
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Registrar Multa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Nova Multa</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes da multa abaixo. O motorista será identificado pela base.
                </DialogDescription>
              </DialogHeader>
              <Alert className="mb-4 mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Importante</AlertTitle>
                <AlertDescription>
                  A multa será registrada agora, mas o motorista responsável será identificado pela base correspondente. 
                  Faça upload da notificação original para que a base possa imprimir e coletar a assinatura do motorista.
                </AlertDescription>
              </Alert>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="vehiclePlate" className="text-right">
                    Placa do Veículo
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={newFine.vehiclePlate}
                      onValueChange={handleVehiclePlateChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a placa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Veículos Cadastrados</SelectLabel>
                          {isLoadingVehicles ? (
                            <SelectItem value="loading" disabled>
                              Carregando veículos...
                            </SelectItem>
                          ) : vehiclesError ? (
                            <SelectItem value="error" disabled>
                              Erro ao carregar veículos
                            </SelectItem>
                          ) : (
                            vehicles?.map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.plate}>
                                {vehicle.plate} - {vehicle.base} ({vehicle.driver})
                              </SelectItem>
                            ))
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="driver" className="text-right">
                    Motorista
                  </Label>
                  <Input
                    id="driver"
                    value={newFine.driver || ''}
                    onChange={(e) => setNewFine({...newFine, driver: e.target.value})}
                    className="col-span-3"
                    placeholder="Será identificado pela base"
                    readOnly={!!newFine.vehiclePlate}
                    disabled
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="base" className="text-right">
                    Base
                  </Label>
                  <Input
                    id="base"
                    value={newFine.base || ''}
                    className="col-span-3"
                    placeholder="Base do veículo"
                    readOnly
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Data da Infração
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={newFine.date}
                    onChange={(e) => setNewFine({...newFine, date: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">
                    Local
                  </Label>
                  <Input
                    id="location"
                    value={newFine.location || ''}
                    onChange={(e) => setNewFine({...newFine, location: e.target.value})}
                    className="col-span-3"
                    placeholder="Local da infração"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="code" className="text-right">
                    Código de Infração
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={newFine.infringementCode}
                      onValueChange={handleInfringementCodeChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o código" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Códigos de Infração</SelectLabel>
                          {infringementCodes.map((code) => (
                            <SelectItem key={code.code} value={code.code}>
                              {code.code} - {code.description.substring(0, 30)}{code.description.length > 30 ? '...' : ''}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Tipo de Infração
                  </Label>
                  <Input
                    id="type"
                    value={newFine.type || ''}
                    onChange={(e) => setNewFine({...newFine, type: e.target.value})}
                    className="col-span-3"
                    placeholder="Tipo de infração"
                    readOnly={!!newFine.infringementCode}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="points" className="text-right">
                    Pontos
                  </Label>
                  <Input
                    id="points"
                    type="number"
                    value={newFine.points || 0}
                    onChange={(e) => setNewFine({...newFine, points: parseInt(e.target.value)})}
                    className="col-span-3"
                    readOnly={!!newFine.infringementCode}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    Valor (R$)
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={newFine.amount || 0}
                    onChange={(e) => setNewFine({...newFine, amount: parseFloat(e.target.value)})}
                    className="col-span-3"
                    readOnly={!!newFine.infringementCode}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dueDate" className="text-right">
                    Data de Vencimento
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newFine.dueDate}
                    onChange={(e) => setNewFine({...newFine, dueDate: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select 
                    value={newFine.status}
                    onValueChange={(value: any) => 
                      setNewFine({...newFine, status: value})
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="em_andamento">Em andamento</SelectItem>
                      <SelectItem value="paga">Paga</SelectItem>
                      <SelectItem value="contestada">Contestada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Descrição
                  </Label>
                  <Textarea
                    id="description"
                    value={newFine.description || ''}
                    onChange={(e) => setNewFine({...newFine, description: e.target.value})}
                    className="col-span-3"
                    placeholder="Detalhes da infração"
                  />
                </div>
                
                {/* Upload da notificação de multa */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notificationFile" className="text-right">
                    Notificação de Multa
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="notificationFile"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      disabled={isUploading}
                      className="mb-2"
                    />
                    {notificationFile && (
                      <div className="text-sm text-gray-500 mb-2">
                        Arquivo selecionado: {notificationFile.name}
                      </div>
                    )}
                    {isUploading && (
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    )}
                    {uploadError && (
                      <div className="text-sm text-red-500 mb-2">
                        {uploadError}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAddFine}
                  disabled={!newFine.vehiclePlate || !newFine.type || isUploading}
                >
                  {isUploading ? 'Enviando...' : 'Registrar Multa'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Registro de Multas</CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar multas..."
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Registro de multas da frota</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Pontos</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Documentos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFines.map((fine) => (
                  <TableRow key={fine.id}>
                    <TableCell className="font-medium">{fine.vehiclePlate}</TableCell>
                    <TableCell>{fine.driver}</TableCell>
                    <TableCell>{fine.base || 'N/A'}</TableCell>
                    <TableCell>{formatDate(fine.date)}</TableCell>
                    <TableCell>{fine.infringementCode || 'N/A'}</TableCell>
                    <TableCell className="max-w-[150px] truncate" title={fine.type}>
                      {fine.type}
                    </TableCell>
                    <TableCell className="text-center">{fine.points}</TableCell>
                    <TableCell>{formatCurrency(fine.amount)}</TableCell>
                    <TableCell>{formatDate(fine.dueDate)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(fine.status)}`}>
                        {translateFineStatus(fine.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${getLifecycleBadgeClass(fine.lifecycle)}`}>
                        {translateLifecycleStatus(fine.lifecycle)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {fine.notificationFileUrl ? (
                          <a 
                            href={fine.notificationFileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            title="Visualizar notificação"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FileText className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-gray-400" title="Sem notificação anexada">
                            <FileText className="h-4 w-4" />
                          </span>
                        )}
                        
                        {fine.driverSignatureUrl ? (
                          <a 
                            href={fine.driverSignatureUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            title="Visualizar assinatura do motorista"
                            className="text-green-600 hover:text-green-800"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-gray-400" title="Assinatura pendente">
                            <Clock className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {/* Botão para editar multa */}
                        <Button variant="outline" size="icon" title="Editar multa">
                          <FileEdit className="h-4 w-4" />
                        </Button>

                        {/* Botão para adicionar documentação */}
                        {(!fine.notificationFileUrl || !fine.driverSignatureUrl) && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            title={!fine.notificationFileUrl ? "Anexar notificação" : "Anexar assinatura do motorista"}
                            onClick={() => handleOpenAttachmentModal(fine, !fine.notificationFileUrl ? 'notification' : 'signature')}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Botão para avançar ciclo de vida */}
                        {canAdvanceLifecycle(fine) && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            title={`Avançar para ${translateLifecycleStatus(advanceLifecycle(fine))}`}
                            onClick={() => handleAdvanceLifecycle(fine)}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Botão para imprimir notificação */}
                        {fine.notificationFileUrl && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            title="Imprimir notificação"
                            onClick={() => handlePrintNotification(fine)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Botão para excluir multa */}
                        <Button variant="outline" size="icon" title="Excluir multa">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredFines.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={13} className="h-24 text-center">
                      Nenhuma multa encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayoutSimple>
  );
};

export default FinesNew;