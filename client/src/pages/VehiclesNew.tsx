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
import { Search, Plus, FileEdit, Trash2, Upload, AlertTriangle, FileText, ExternalLink, File, AlertCircle, Clock, FileWarning } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import CadastroFrota from '@/components/vehicle/CadastroFrota';
import { useToast } from '@/hooks/use-toast';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Função auxiliar para obter o token JWT
const getAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  const token = localStorage.getItem('jwt_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Fetch autenticado - adiciona automaticamente o token JWT
const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const headers = getAuthHeaders();
  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {})
    },
    credentials: 'include'
  });
};

// Tipo para representar os dados de um veículo
interface Vehicle {
  id: number;
  placa: string; // Nota: usando os campos em português como no exemplo enviado
  marca: string;
  modelo: string;
  base_id: number;
  base_nome?: string;
  status: string;
  cartao_combustivel?: string;
  cartao_abastecimento?: string;
  crlv_url?: string;
  crlv_validade?: string;
  antt_url?: string;
  isTemporary?: boolean;
  deactivationDate?: string;
  created_at?: string;
  updated_at?: string;
}

// Função para calcular estatísticas de documentos
const calculateDocumentStats = (vehicles: Vehicle[]) => {
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  let expired = 0;
  let expiringSoon = 0;
  let missingDocs = 0;
  
  vehicles.forEach(v => {
    // Verificar documentos faltando (CRLV ou ANTT)
    if (!v.crlv_url && !v.antt_url) {
      missingDocs++;
    }
    
    // Verificar validade do CRLV
    if (v.crlv_validade) {
      const expirationDate = new Date(v.crlv_validade);
      if (expirationDate < today) {
        expired++;
      } else if (expirationDate <= thirtyDaysFromNow) {
        expiringSoon++;
      }
    }
  });
  
  return { expired, expiringSoon, missingDocs, total: vehicles.length };
};

// Função para traduzir os tipos de veículos
const translateVehicleType = (type: string): string => {
  const types: Record<string, string> = {
    cavalo_mecanico: 'Cavalo Mecânico',
    carreta: 'Carreta',
    van: 'Van',
    utilitario: 'Utilitário'
  };
  return types[type] || type;
};

// Função para traduzir os status de veículos
const translateVehicleStatus = (status: string): string => {
  const statuses: Record<string, string> = {
    em_operacao: 'Em Operação',
    em_manutencao: 'Em Manutenção',
    parado: 'Parado'
  };
  return statuses[status] || status;
};

// Função para obter a classe CSS para o badge de status
const getStatusBadgeClass = (status: string): string => {
  const classes: Record<string, string> = {
    em_operacao: 'bg-green-100 text-green-800',
    em_manutencao: 'bg-yellow-100 text-yellow-800',
    parado: 'bg-red-100 text-red-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

// Schema de validação para edição de veículos
const editVehicleSchema = z.object({
  plate: z.string().min(1, "Placa é obrigatória"),
  model: z.string().min(1, "Modelo é obrigatório"),
  vehicleType: z.string().min(1, "Tipo de veículo é obrigatório"),
  status: z.string().min(1, "Status é obrigatório"),
  baseId: z.number().min(1, "Base é obrigatória"),
  cartaoAbastecimento: z.string().optional(),
  isTemporary: z.boolean().default(false),
  deactivationDate: z.string().optional(),
}).refine(data => {
  // Se isTemporary for true, deactivationDate é obrigatório
  if (data.isTemporary && !data.deactivationDate) {
    return false;
  }
  return true;
}, {
  message: "Data de desativação é obrigatória para veículos temporários",
  path: ["deactivationDate"],
});

// Componente de formulário para edição de veículos
interface EditVehicleFormProps {
  vehicle: Vehicle;
  onUpdate: (data: any) => void;
  onCancel: () => void;
}

const EditVehicleForm: React.FC<EditVehicleFormProps> = ({ vehicle, onUpdate, onCancel }) => {
  const [bases, setBases] = useState<any[]>([]);
  
  const form = useForm<z.infer<typeof editVehicleSchema>>({
    resolver: zodResolver(editVehicleSchema),
    defaultValues: {
      plate: vehicle.placa || "",
      model: vehicle.modelo || "",
      vehicleType: vehicle.marca || "cavalo_mecanico",
      status: vehicle.status || "em_operacao",
      baseId: vehicle.base_id || 1,
      cartaoAbastecimento: vehicle.cartao_abastecimento || vehicle.cartao_combustivel || "",
      isTemporary: vehicle.isTemporary || false,
      deactivationDate: vehicle.deactivationDate || "",
    },
  });

  // Carregar bases disponíveis
  useEffect(() => {
    const fetchBases = async () => {
      try {
        const response = await fetchWithAuth('/api/bases');
        if (response.ok) {
          const result = await response.json();
          setBases(result.success && result.data ? result.data : []);
        }
      } catch (error) {
        console.error("Erro ao carregar bases:", error);
      }
    };
    fetchBases();
  }, []);

  const onSubmit = (data: z.infer<typeof editVehicleSchema>) => {
    onUpdate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="plate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Placa</FormLabel>
              <FormControl>
                <Input placeholder="Digite a placa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modelo</FormLabel>
              <FormControl>
                <Input placeholder="Digite o modelo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vehicleType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Veículo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cavalo_mecanico">Cavalo Mecânico</SelectItem>
                  <SelectItem value="carreta">Carreta</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                  <SelectItem value="fiorino">Fiorino</SelectItem>
                  <SelectItem value="vuc">VUC</SelectItem>
                  <SelectItem value="toco">Toco</SelectItem>
                  <SelectItem value="truck">Truck</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="em_operacao">Em Operação</SelectItem>
                  <SelectItem value="em_manutencao">Em Manutenção</SelectItem>
                  <SelectItem value="parado">Parado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="baseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base</FormLabel>
              <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a base" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {bases.map((base) => (
                    <SelectItem key={base.id} value={base.id.toString()}>
                      {base.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cartaoAbastecimento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cartão de Abastecimento</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: 5431-1234-5678-9012" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="border-t pt-4 mt-6">
          <h3 className="text-sm font-medium mb-4">Configuração Temporária</h3>
          
          <FormField
            control={form.control}
            name="isTemporary"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-is-temporary"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Veículo Temporário</FormLabel>
                  <FormDescription>
                    Marque esta opção se o veículo for temporário. Veículos temporários expirados não poderão solicitar combustível.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {form.watch("isTemporary") && (
            <FormField
              control={form.control}
              name="deactivationDate"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Data de Desativação *</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field}
                      data-testid="input-deactivation-date"
                    />
                  </FormControl>
                  <FormDescription>
                    Data em que o veículo será automaticamente desativado
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            Salvar Alterações
          </Button>
        </div>
      </form>
    </Form>
  );
};

const VehiclesNew: React.FC = () => {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBaseFilter, setSelectedBaseFilter] = useState<string>('');
  const [availableBases, setAvailableBases] = useState<{id: number; name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("list");
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);
  const [documentosDialogOpen, setDocumentosDialogOpen] = useState(false);
  const [selectedVehicleDocumentos, setSelectedVehicleDocumentos] = useState<Vehicle | null>(null);
  
  // Estados para importação de bases
  const [isImportBasesDialogOpen, setIsImportBasesDialogOpen] = useState(false);
  const [selectedBasesFileName, setSelectedBasesFileName] = useState<string | null>(null);
  const [parsedBasesData, setParsedBasesData] = useState<{placa: string; base: string}[] | null>(null);
  const [isUploadingBases, setIsUploadingBases] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    resumo: { total: number; atualizados: number; placasNaoEncontradas: number; basesNaoEncontradas: number };
    detalhes: { placasNaoEncontradas: string[]; basesNaoEncontradas: string[]; erros: string[] };
  } | null>(null);

  // Estados para importação de cartões de abastecimento
  const [isImportCartoesDialogOpen, setIsImportCartoesDialogOpen] = useState(false);
  const [selectedCartoesFileName, setSelectedCartoesFileName] = useState<string | null>(null);
  const [parsedCartoesData, setParsedCartoesData] = useState<{placa: string; cartao: string}[] | null>(null);
  const [isUploadingCartoes, setIsUploadingCartoes] = useState(false);
  const [isParsingCartoesFile, setIsParsingCartoesFile] = useState(false);
  const [importCartoesResult, setImportCartoesResult] = useState<{
    success: boolean;
    resumo: { total: number; atualizados: number; placasNaoEncontradas: number };
    detalhes: { placasNaoEncontradas: string[]; erros: string[] };
  } | null>(null);

  // Estados para importação completa de veículos
  const [isImportCompleteDialogOpen, setIsImportCompleteDialogOpen] = useState(false);
  const [selectedCompleteFileName, setSelectedCompleteFileName] = useState<string | null>(null);
  const [parsedCompleteData, setParsedCompleteData] = useState<{placa: string; marca: string; modelo: string; projeto: string; base: string; cartao: string}[] | null>(null);
  const [isUploadingComplete, setIsUploadingComplete] = useState(false);
  const [isParsingCompleteFile, setIsParsingCompleteFile] = useState(false);
  const [importCompleteResult, setImportCompleteResult] = useState<{
    success: boolean;
    resumo: { total: number; atualizados: number; criados: number; basesNaoEncontradas: number; projetosNaoEncontrados: number; erros: number };
    detalhes: { atualizados: { placa: string; campos: string[] }[]; basesNaoEncontradas: string[]; projetosNaoEncontrados: string[]; erros: string[] };
  } | null>(null);

  // Função para carregar veículos usando a API REST
  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      // Buscar todos os veículos usando a API REST com autenticação JWT
      console.log('[Vehicles] Iniciando busca de veículos...');
      console.log('[Vehicles] Token JWT disponível:', !!localStorage.getItem('jwt_token'));
      
      const vehiclesResponse = await fetchWithAuth('/api/vehicles');
      console.log('[Vehicles] Resposta recebida, status:', vehiclesResponse.status);
      
      if (!vehiclesResponse.ok) {
        const errorText = await vehiclesResponse.text();
        console.error('[Vehicles] Erro HTTP:', vehiclesResponse.status, errorText);
        throw new Error(`Erro ao buscar veículos: ${vehiclesResponse.status} - ${errorText}`);
      }
      
      const vehiclesData = await vehiclesResponse.json();
      console.log('[Vehicles] Veículos recebidos:', vehiclesData?.length || 0, 'registros');
      
      // Buscar bases para mapear os nomes
      const basesResponse = await fetchWithAuth('/api/bases');
      
      if (!basesResponse.ok) {
        throw new Error(`Erro ao buscar bases: ${basesResponse.status}`);
      }
      
      const basesData = await basesResponse.json();
      console.log('Bases recebidas da API:', basesData);
      
      // Extrair o array de bases do objeto retornado
      const basesArray = basesData.success && basesData.data ? basesData.data : [];
      console.log('Array de bases extraído:', basesArray);
      
      // Criar um mapa de bases por ID para facilitar a busca
      const basesMap = new Map();
      basesArray.forEach((base: any) => {
        basesMap.set(base.id, base.name || base.nome);
      });
      
      // Salvar lista de bases disponíveis para o filtro
      setAvailableBases(basesArray.map((base: any) => ({
        id: base.id,
        name: base.name || base.nome
      })));
      
      // Adicionar nome da base a cada veículo e mapear campos
      const vehiclesWithBaseNames = vehiclesData.map((vehicle: any) => {
        return {
          id: vehicle.id,
          placa: vehicle.plate || '',
          marca: vehicle.vehicleType || '', // Nota: ajustado para camelCase do schema
          modelo: vehicle.model || '',
          base_id: vehicle.baseId,
          status: vehicle.status || '',
          base_nome: basesMap.get(vehicle.baseId) || 'Sem base',
          cartao_abastecimento: vehicle.cartaoAbastecimento || vehicle.cartao_abastecimento || null,
        };
      });
      
      setVehicles(vehiclesWithBaseNames);
    } catch (error) {
      console.error('[Vehicles] Erro ao buscar veículos:', error);
      console.error('[Vehicles] Tipo do erro:', error?.constructor?.name);
      console.error('[Vehicles] Mensagem:', error instanceof Error ? error.message : String(error));
      toast({
        title: 'Erro ao carregar veículos',
        description: error instanceof Error ? error.message : 'Erro de rede. Verifique sua conexão.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Carregar veículos quando o componente é montado
  useEffect(() => {
    fetchVehicles();
  }, []);

  // Filtrar veículos com base no termo de busca e base selecionada
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch = !searchTerm || 
      (vehicle.placa && vehicle.placa.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (vehicle.marca && vehicle.marca.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (vehicle.modelo && vehicle.modelo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (vehicle.base_nome && vehicle.base_nome.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesBase = !selectedBaseFilter || vehicle.base_id?.toString() === selectedBaseFilter;
    
    return matchesSearch && matchesBase;
  });

  // Excluir veículo usando a API REST
  const handleDeleteVehicle = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      console.log(`Excluindo veículo com ID ${id} via API REST`);
      const response = await fetchWithAuth(`/api/vehicles/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir veículo');
      }
      
      // Atualizar estado local removendo o veículo
      setVehicles(vehicles.filter(vehicle => vehicle.id !== id));
      
      toast({
        title: "Veículo excluído",
        description: "O veículo foi excluído com sucesso.",
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao excluir veículo:", error);
      toast({
        title: "Erro ao excluir veículo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  // Função para abrir o diálogo de edição
  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsEditDialogOpen(true);
  };

  // Função para editar veículo
  const handleUpdateVehicle = async (vehicleData: any) => {
    if (!editingVehicle) return;

    try {
      console.log(`Editando veículo com ID ${editingVehicle.id} via API REST`);
      
      // Mapear campos do frontend para o formato esperado pelo backend
      const mappedData: any = {};
      if (vehicleData.plate !== undefined) mappedData.plate = vehicleData.plate;
      if (vehicleData.model !== undefined) mappedData.model = vehicleData.model;
      if (vehicleData.vehicleType !== undefined) mappedData.vehicleType = vehicleData.vehicleType;
      if (vehicleData.status !== undefined) mappedData.status = vehicleData.status;
      if (vehicleData.baseId !== undefined) mappedData.baseId = vehicleData.baseId;
      if (vehicleData.cartaoAbastecimento !== undefined) mappedData.cartaoAbastecimento = vehicleData.cartaoAbastecimento;
      if (vehicleData.isTemporary !== undefined) mappedData.isTemporary = vehicleData.isTemporary;
      if (vehicleData.deactivationDate !== undefined) mappedData.deactivationDate = vehicleData.deactivationDate;
      
      console.log('Dados mapeados para envio:', mappedData);
      
      const response = await fetchWithAuth(`/api/vehicles/${editingVehicle.id}`, {
        method: 'PUT',
        body: JSON.stringify(mappedData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar veículo');
      }
      
      const updatedVehicle = await response.json();
      
      // Atualizar estado local
      setVehicles(vehicles.map(vehicle => 
        vehicle.id === editingVehicle.id ? {
          ...vehicle,
          placa: updatedVehicle.plate || vehicle.placa,
          marca: updatedVehicle.vehicleType || vehicle.marca,
          modelo: updatedVehicle.model || vehicle.modelo,
          status: updatedVehicle.status || vehicle.status,
          base_id: updatedVehicle.baseId || vehicle.base_id,
          cartao_abastecimento: updatedVehicle.cartaoAbastecimento || vehicle.cartao_abastecimento
        } : vehicle
      ));
      
      setIsEditDialogOpen(false);
      setEditingVehicle(null);
      
      toast({
        title: "Veículo atualizado",
        description: "O veículo foi atualizado com sucesso.",
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao atualizar veículo:", error);
      toast({
        title: "Erro ao atualizar veículo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  // Função para importar planilha de manutenção
  const handleImportMaintenance = async () => {
    if (!selectedFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo Excel para importar.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const token = localStorage.getItem('jwt_token');
      const response = await fetch('/api/maintenance/import', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao importar planilha');
      }

      const result = await response.json();
      
      // Recarregar lista de veículos
      await fetchVehicles();
      
      setIsImportDialogOpen(false);
      setSelectedFile(null);
      
      toast({
        title: "Importação concluída",
        description: `${result.updated} veículos foram marcados como "Em Manutenção"`,
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao importar planilha:", error);
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Função para processar arquivo Excel imediatamente quando selecionado
  const handleBasesFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedBasesFileName(null);
      setParsedBasesData(null);
      return;
    }
    
    setSelectedBasesFileName(file.name);
    setIsParsingFile(true);
    setParsedBasesData(null);
    
    try {
      // Ler o arquivo IMEDIATAMENTE para evitar NotReadableError
      const arrayBuffer = await file.arrayBuffer();
      
      // Importar a biblioteca xlsx dinamicamente
      const XLSX = await import('xlsx');
      
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      
      // Mapear os dados para o formato esperado pela API
      const mappedData = jsonData.map((row: any) => {
        const placa = row.placa || row.Placa || row.PLACA || row.plate || row.Plate || Object.values(row)[0];
        const base = row.base || row.Base || row.BASE || row.base_nome || row.Base_Nome || Object.values(row)[1];
        return { placa: String(placa || ''), base: String(base || '') };
      });
      
      // Filtrar linhas válidas
      const validData = mappedData.filter(item => item.placa && item.base);
      
      if (validData.length === 0) {
        throw new Error('Nenhuma linha válida encontrada.');
      }
      
      setParsedBasesData(validData);
      toast({
        title: "Arquivo processado",
        description: `${validData.length} linhas válidas encontradas`,
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      setSelectedBasesFileName(null);
      setParsedBasesData(null);
      toast({
        title: "Erro ao ler arquivo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsParsingFile(false);
      // Limpar input para permitir reselecionar o mesmo arquivo
      e.target.value = '';
    }
  };

  // Função para importar planilha de bases (atualizar placa -> base)
  const handleImportBases = async () => {
    if (!parsedBasesData || parsedBasesData.length === 0) {
      toast({
        title: "Nenhum arquivo processado",
        description: "Por favor, selecione um arquivo Excel para importar.",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingBases(true);
    setImportResult(null);
    
    try {
      // Enviar dados já processados para a API
      const response = await fetchWithAuth('/api/vehicles/import-spreadsheet', {
        method: 'POST',
        body: JSON.stringify({ data: parsedBasesData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao importar planilha');
      }

      const result = await response.json();
      setImportResult(result);
      
      // Recarregar lista de veículos
      await fetchVehicles();
      
      toast({
        title: "Importacao concluida",
        description: `${result.resumo.atualizados} veiculos atualizados de ${result.resumo.total} linhas`,
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao importar planilha:", error);
      toast({
        title: "Erro na importacao",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsUploadingBases(false);
    }
  };

  // Função para processar arquivo de cartões quando selecionado
  const handleCartoesFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedCartoesFileName(null);
      setParsedCartoesData(null);
      return;
    }
    
    setSelectedCartoesFileName(file.name);
    setIsParsingCartoesFile(true);
    setParsedCartoesData(null);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      
      const mappedData = jsonData.map((row: any) => {
        const placa = row.placa || row.Placa || row.PLACA || row.plate || row.Plate || Object.values(row)[0];
        const cartao = row.cartao || row.Cartao || row.CARTAO || row.cartao_abastecimento || row.Cartao_Abastecimento || row.card || row.Card || Object.values(row)[1];
        return { placa: String(placa || '').trim().toUpperCase(), cartao: String(cartao || '').trim() };
      });
      
      const validData = mappedData.filter(item => item.placa && item.cartao);
      
      if (validData.length === 0) {
        throw new Error('Nenhuma linha válida encontrada. Verifique se a planilha tem colunas "Placa" e "Cartão".');
      }
      
      setParsedCartoesData(validData);
      toast({
        title: "Arquivo processado",
        description: `${validData.length} linhas válidas encontradas`,
        variant: "default"
      });
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: "Erro ao processar arquivo",
        description: error instanceof Error ? error.message : "Formato inválido",
        variant: "destructive"
      });
      setSelectedCartoesFileName(null);
    } finally {
      setIsParsingCartoesFile(false);
    }
  };

  // Função para enviar dados de cartões para o servidor
  const handleImportCartoes = async () => {
    if (!parsedCartoesData || parsedCartoesData.length === 0) {
      toast({
        title: "Nenhum dado para importar",
        description: "Por favor, selecione um arquivo válido primeiro.",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingCartoes(true);
    
    try {
      const response = await fetchWithAuth('/api/vehicles/import-cartoes', {
        method: 'POST',
        body: JSON.stringify({ dados: parsedCartoesData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao importar cartões');
      }

      const result = await response.json();
      setImportCartoesResult(result);
      
      await fetchVehicles();
      
      toast({
        title: "Importação concluída",
        description: `${result.resumo.atualizados} veículos atualizados de ${result.resumo.total} linhas`,
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao importar cartões:", error);
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsUploadingCartoes(false);
    }
  };

  // Função para processar arquivo de importação completa
  const handleCompleteFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedCompleteFileName(null);
      setParsedCompleteData(null);
      return;
    }
    
    setSelectedCompleteFileName(file.name);
    setIsParsingCompleteFile(true);
    setParsedCompleteData(null);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      
      const mappedData = jsonData.map((row: any) => {
        const normalizedRow: any = {};
        Object.keys(row).forEach(key => {
          const cleanKey = key.replace(/[:\s]/g, '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          normalizedRow[cleanKey] = row[key];
        });
        
        const placa = normalizedRow.placa || normalizedRow.plate || '';
        const marca = normalizedRow.marca || normalizedRow.make || '';
        const modelo = normalizedRow.modelo || normalizedRow.model || '';
        const base = normalizedRow.base || normalizedRow.unidade || '';
        const projeto = normalizedRow.projeto || normalizedRow.project || '';
        const cartao = normalizedRow.cartao || normalizedRow.placadocartao || normalizedRow.placacartao || normalizedRow.placadocartao || normalizedRow.cartaoabastecimento || normalizedRow.card || '';
        return { 
          placa: String(placa || '').trim().toUpperCase(), 
          marca: String(marca || '').trim(),
          modelo: String(modelo || '').trim(),
          projeto: String(projeto || '').trim(),
          base: String(base || '').trim(),
          cartao: String(cartao || '').trim()
        };
      });
      
      const validData = mappedData.filter(item => item.placa);
      
      if (validData.length === 0) {
        throw new Error('Nenhuma linha com placa válida encontrada.');
      }
      
      setParsedCompleteData(validData);
      toast({
        title: "Arquivo processado",
        description: `${validData.length} linhas com placa encontradas`,
        variant: "default"
      });
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: "Erro ao processar arquivo",
        description: error instanceof Error ? error.message : "Formato inválido",
        variant: "destructive"
      });
      setSelectedCompleteFileName(null);
    } finally {
      setIsParsingCompleteFile(false);
    }
  };

  const handleImportComplete = async () => {
    if (!parsedCompleteData || parsedCompleteData.length === 0) {
      toast({
        title: "Nenhum dado para importar",
        description: "Por favor, selecione um arquivo válido primeiro.",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingComplete(true);
    try {
      const response = await fetchWithAuth('/api/vehicles/import-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dados: parsedCompleteData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao importar');
      }

      const result = await response.json();
      setImportCompleteResult(result);
      
      await fetchVehicles();
      
      toast({
        title: "Importação concluída",
        description: `${result.resumo.atualizados} atualizados, ${result.resumo.criados} novos veículos`,
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao importar:", error);
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsUploadingComplete(false);
    }
  };

  return (
    <MainLayoutSimple>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Veículos</h1>
            <p className="text-gray-500">
              Gerenciamento de veículos da frota
            </p>
          </div>
        </div>

        {/* Cards de Estatísticas de Documentos */}
        {(() => {
          const stats = calculateDocumentStats(vehicles);
          return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total de Veículos</p>
                      <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 font-medium">CRLV Vencido</p>
                      <p className="text-2xl font-bold text-red-700">{stats.expired}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-600 font-medium">Vence em 30 dias</p>
                      <p className="text-2xl font-bold text-yellow-700">{stats.expiringSoon}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-gray-200 bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Sem Documentos</p>
                      <p className="text-2xl font-bold text-gray-700">{stats.missingDocs}</p>
                    </div>
                    <FileWarning className="h-8 w-8 text-gray-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })()}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">Lista de Veículos</TabsTrigger>
            <TabsTrigger value="add">Cadastrar Veículo</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex gap-2">
                <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Importar Manutencao
                    </Button>
                  </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Importar Planilha de Manutenção</DialogTitle>
                    <DialogDescription>
                      Selecione um arquivo Excel (.xlsx) com as placas dos veículos em manutenção.
                      Os veículos serão marcados como "Em Manutenção" automaticamente.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="import-file">Arquivo Excel</Label>
                      <Input
                        id="import-file"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                      {selectedFile && (
                        <p className="text-sm text-gray-500">
                          Arquivo selecionado: {selectedFile.name}
                        </p>
                      )}
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                          <p className="font-medium mb-1">Formato do arquivo:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>A planilha deve conter uma coluna chamada "Placa"</li>
                            <li>As placas devem estar no formato ABC1234 ou ABC1D23</li>
                            <li>Veículos já em manutenção serão ignorados</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsImportDialogOpen(false);
                        setSelectedFile(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleImportMaintenance}
                      disabled={!selectedFile || isUploading}
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Importando...
                        </>
                      ) : (
                        'Importar'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Botão de Importar Bases */}
              <Dialog open={isImportBasesDialogOpen} onOpenChange={(open) => {
                setIsImportBasesDialogOpen(open);
                if (!open) {
                  setSelectedBasesFileName(null);
                  setParsedBasesData(null);
                  setImportResult(null);
                }
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 ml-2">
                    <File className="h-4 w-4" />
                    Atualizar Bases
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Importar Planilha de Placas e Bases</DialogTitle>
                    <DialogDescription>
                      Atualize as bases dos veiculos em massa. Envie uma planilha com as colunas "Placa" e "Base".
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="import-bases-file">Arquivo Excel (.xlsx ou .xls)</Label>
                      <Input
                        id="import-bases-file"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleBasesFileSelect}
                        disabled={isParsingFile}
                      />
                      {isParsingFile && (
                        <p className="text-sm text-blue-600 flex items-center gap-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600" />
                          Processando arquivo...
                        </p>
                      )}
                      {selectedBasesFileName && parsedBasesData && (
                        <p className="text-sm text-green-600">
                          Arquivo: {selectedBasesFileName} ({parsedBasesData.length} linhas prontas)
                        </p>
                      )}
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium mb-1">Formato da planilha:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Coluna 1: <strong>Placa</strong> (ex: GAX9F44)</li>
                            <li>Coluna 2: <strong>Base</strong> (ex: GP02 JACAREI, LH01 LINE HALL)</li>
                            <li>Placas nao encontradas serao ignoradas</li>
                            <li>Bases serao identificadas pelo nome (busca aproximada)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    {/* Resultado da importação */}
                    {importResult && (
                      <div className={`border rounded-lg p-4 ${importResult.resumo.atualizados > 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                        <h4 className="font-medium mb-2">Resultado da Importacao:</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Total de linhas: <strong>{importResult.resumo.total}</strong></div>
                          <div>Veiculos atualizados: <strong className="text-green-600">{importResult.resumo.atualizados}</strong></div>
                          <div>Placas nao encontradas: <strong className="text-yellow-600">{importResult.resumo.placasNaoEncontradas}</strong></div>
                          <div>Bases nao encontradas: <strong className="text-red-600">{importResult.resumo.basesNaoEncontradas}</strong></div>
                        </div>
                        
                        {importResult.detalhes.basesNaoEncontradas.length > 0 && (
                          <div className="mt-3 text-sm">
                            <p className="font-medium text-red-600">Bases nao encontradas:</p>
                            <p className="text-gray-600">{importResult.detalhes.basesNaoEncontradas.join(', ')}</p>
                          </div>
                        )}
                        
                        {importResult.detalhes.placasNaoEncontradas.length > 0 && (
                          <div className="mt-2 text-sm">
                            <p className="font-medium text-yellow-600">Placas nao encontradas (primeiras 20):</p>
                            <p className="text-gray-600 text-xs">{importResult.detalhes.placasNaoEncontradas.slice(0, 20).join(', ')}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsImportBasesDialogOpen(false);
                        setSelectedBasesFileName(null);
                        setParsedBasesData(null);
                        setImportResult(null);
                      }}
                    >
                      Fechar
                    </Button>
                    <Button 
                      onClick={handleImportBases}
                      disabled={!parsedBasesData || isUploadingBases || isParsingFile}
                    >
                      {isUploadingBases ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Enviando...
                        </>
                      ) : (
                        'Importar Planilha'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Botão de Importar Cartões de Abastecimento */}
              <Dialog open={isImportCartoesDialogOpen} onOpenChange={(open) => {
                setIsImportCartoesDialogOpen(open);
                if (!open) {
                  setSelectedCartoesFileName(null);
                  setParsedCartoesData(null);
                  setImportCartoesResult(null);
                }
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 ml-2">
                    <Upload className="h-4 w-4" />
                    Importar Cartões
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Importar Cartões de Abastecimento</DialogTitle>
                    <DialogDescription>
                      Atualize os cartões de abastecimento dos veículos em massa. Envie uma planilha com as colunas "Placa" e "Cartão".
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="import-cartoes-file">Arquivo Excel (.xlsx ou .xls)</Label>
                      <Input
                        id="import-cartoes-file"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleCartoesFileSelect}
                        disabled={isParsingCartoesFile}
                      />
                      {isParsingCartoesFile && (
                        <p className="text-sm text-blue-600 flex items-center gap-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600" />
                          Processando arquivo...
                        </p>
                      )}
                      {selectedCartoesFileName && parsedCartoesData && (
                        <p className="text-sm text-green-600">
                          Arquivo: {selectedCartoesFileName} ({parsedCartoesData.length} linhas prontas)
                        </p>
                      )}
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex gap-2">
                        <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium mb-1">Formato do arquivo:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Coluna 1: <strong>Placa</strong> do veículo (ex: ABC1234)</li>
                            <li>Coluna 2: <strong>Cartão</strong> de abastecimento (ex: 5431-1234-5678-9012)</li>
                            <li>A primeira linha deve conter os cabeçalhos</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    {/* Preview dos dados */}
                    {parsedCartoesData && parsedCartoesData.length > 0 && (
                      <div className="border rounded-lg p-3 bg-gray-50 max-h-40 overflow-y-auto">
                        <p className="font-medium text-sm mb-2">Preview (primeiras 5 linhas):</p>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-1 px-2">Placa</th>
                              <th className="text-left py-1 px-2">Cartão</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsedCartoesData.slice(0, 5).map((item, idx) => (
                              <tr key={idx} className="border-b last:border-0">
                                <td className="py-1 px-2 font-mono">{item.placa}</td>
                                <td className="py-1 px-2 font-mono">{item.cartao}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                    {/* Resultado da importação */}
                    {importCartoesResult && (
                      <div className={`border rounded-lg p-4 ${importCartoesResult.resumo.atualizados > 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                        <h4 className="font-medium mb-2">Resultado da Importação:</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Total de linhas: <strong>{importCartoesResult.resumo.total}</strong></div>
                          <div>Veículos atualizados: <strong className="text-green-600">{importCartoesResult.resumo.atualizados}</strong></div>
                          <div>Placas não encontradas: <strong className="text-yellow-600">{importCartoesResult.resumo.placasNaoEncontradas}</strong></div>
                        </div>
                        
                        {importCartoesResult.detalhes.placasNaoEncontradas.length > 0 && (
                          <div className="mt-2 text-sm">
                            <p className="font-medium text-yellow-600">Placas não encontradas (primeiras 20):</p>
                            <p className="text-gray-600 text-xs">{importCartoesResult.detalhes.placasNaoEncontradas.slice(0, 20).join(', ')}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsImportCartoesDialogOpen(false);
                        setSelectedCartoesFileName(null);
                        setParsedCartoesData(null);
                        setImportCartoesResult(null);
                      }}
                    >
                      Fechar
                    </Button>
                    <Button 
                      onClick={handleImportCartoes}
                      disabled={!parsedCartoesData || isUploadingCartoes || isParsingCartoesFile}
                    >
                      {isUploadingCartoes ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Enviando...
                        </>
                      ) : (
                        'Importar Cartões'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* Importar Planilha Completa */}
              <Dialog open={isImportCompleteDialogOpen} onOpenChange={(open) => {
                setIsImportCompleteDialogOpen(open);
                if (!open) {
                  setSelectedCompleteFileName(null);
                  setParsedCompleteData(null);
                  setImportCompleteResult(null);
                }
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 ml-2">
                    <Upload className="h-4 w-4" />
                    Importar Planilha
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Importar Planilha Completa de Veículos</DialogTitle>
                    <DialogDescription>
                      Atualize dados dos veículos em massa. Campos vazios na planilha serão ignorados (sem perda de dados existentes).
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="import-complete-file">Arquivo Excel (.xlsx ou .xls)</Label>
                      <Input
                        id="import-complete-file"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleCompleteFileSelect}
                        disabled={isParsingCompleteFile}
                      />
                      {isParsingCompleteFile && (
                        <p className="text-sm text-blue-600 flex items-center gap-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600" />
                          Processando arquivo...
                        </p>
                      )}
                      {selectedCompleteFileName && parsedCompleteData && (
                        <p className="text-sm text-green-600">
                          Arquivo: {selectedCompleteFileName} ({parsedCompleteData.length} linhas prontas)
                        </p>
                      )}
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex gap-2">
                        <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium mb-1">Formato do arquivo:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li><strong>Placa</strong> (obrigatório) - Placa do veículo</li>
                            <li><strong>Marca</strong> - Marca do veículo (ex: VAN, TRUCK)</li>
                            <li><strong>Modelo</strong> - Modelo do veículo (ex: Sprinter 313)</li>
                            <li><strong>Projeto</strong> - Nome do projeto (ex: LINE HALL, COCA-COLA)</li>
                            <li><strong>Base</strong> - Nome da base/unidade</li>
                            <li><strong>Cartão</strong> - Placa do cartão de abastecimento</li>
                          </ul>
                          <p className="mt-2 text-xs text-blue-600">Campos vazios serão ignorados, mantendo os dados atuais do veículo.</p>
                        </div>
                      </div>
                    </div>
                    
                    {parsedCompleteData && parsedCompleteData.length > 0 && (
                      <div className="border rounded-lg p-3 bg-gray-50 max-h-48 overflow-y-auto">
                        <p className="font-medium text-sm mb-2">Preview (primeiras 5 linhas):</p>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-1 px-1">Placa</th>
                              <th className="text-left py-1 px-1">Marca</th>
                              <th className="text-left py-1 px-1">Modelo</th>
                              <th className="text-left py-1 px-1">Projeto</th>
                              <th className="text-left py-1 px-1">Base</th>
                              <th className="text-left py-1 px-1">Cartão</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsedCompleteData.slice(0, 5).map((item, idx) => (
                              <tr key={idx} className="border-b last:border-0">
                                <td className="py-1 px-1 font-mono">{item.placa}</td>
                                <td className="py-1 px-1">{item.marca || '-'}</td>
                                <td className="py-1 px-1">{item.modelo || '-'}</td>
                                <td className="py-1 px-1">{item.projeto || '-'}</td>
                                <td className="py-1 px-1">{item.base || '-'}</td>
                                <td className="py-1 px-1">{item.cartao || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                    {importCompleteResult && (
                      <div className={`border rounded-lg p-3 ${importCompleteResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <p className="font-medium text-sm mb-2">Resultado da importação:</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Total processado: <strong>{importCompleteResult.resumo.total}</strong></div>
                          <div>Atualizados: <strong className="text-blue-600">{importCompleteResult.resumo.atualizados}</strong></div>
                          <div>Novos criados: <strong className="text-green-600">{importCompleteResult.resumo.criados}</strong></div>
                          <div>Bases não encontradas: <strong className="text-orange-600">{importCompleteResult.resumo.basesNaoEncontradas}</strong></div>
                          {importCompleteResult.resumo.projetosNaoEncontrados > 0 && (
                            <div>Projetos não encontrados: <strong className="text-orange-600">{importCompleteResult.resumo.projetosNaoEncontrados}</strong></div>
                          )}
                        </div>
                        {importCompleteResult.detalhes.basesNaoEncontradas.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-orange-700">Bases não reconhecidas:</p>
                            <p className="text-xs text-orange-600">{importCompleteResult.detalhes.basesNaoEncontradas.join(', ')}</p>
                          </div>
                        )}
                        {importCompleteResult.detalhes.projetosNaoEncontrados && importCompleteResult.detalhes.projetosNaoEncontrados.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-orange-700">Projetos não reconhecidos:</p>
                            <p className="text-xs text-orange-600">{importCompleteResult.detalhes.projetosNaoEncontrados.join(', ')}</p>
                          </div>
                        )}
                        {importCompleteResult.detalhes.erros.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-red-700">Erros:</p>
                            {importCompleteResult.detalhes.erros.map((erro, idx) => (
                              <p key={idx} className="text-xs text-red-600">{erro}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsImportCompleteDialogOpen(false);
                        setSelectedCompleteFileName(null);
                        setParsedCompleteData(null);
                        setImportCompleteResult(null);
                      }}
                    >
                      Fechar
                    </Button>
                    <Button 
                      onClick={handleImportComplete}
                      disabled={!parsedCompleteData || isUploadingComplete || isParsingCompleteFile}
                    >
                      {isUploadingComplete ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Importando...
                        </>
                      ) : (
                        'Importar Dados'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              </div>
              
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar veículos..."
                  className="pl-8 w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select
                value={selectedBaseFilter}
                onValueChange={(value) => setSelectedBaseFilter(value)}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Filtrar por Base" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as Bases</SelectItem>
                  {availableBases.map((base) => (
                    <SelectItem key={base.id} value={base.id.toString()}>
                      {base.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : (
                  <Table>
                    <TableCaption>Lista de veículos da frota</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Placa</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Base</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVehicles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            Nenhum veículo encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredVehicles.map((vehicle) => (
                          <TableRow key={vehicle.id}>
                            <TableCell className="font-medium">{vehicle.placa}</TableCell>
                            <TableCell>{vehicle.marca}</TableCell>
                            <TableCell>{vehicle.modelo}</TableCell>
                            <TableCell>{vehicle.base_nome}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(vehicle.status)}`}>
                                {translateVehicleStatus(vehicle.status)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  onClick={() => {
                                    setSelectedVehicleDocumentos(vehicle);
                                    setDocumentosDialogOpen(true);
                                  }}
                                  title="Ver Documentos do Veículo"
                                  data-testid={`button-documentos-${vehicle.placa}`}
                                >
                                  <FileText className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  onClick={() => handleEditVehicle(vehicle)}
                                >
                                  <FileEdit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  onClick={() => handleDeleteVehicle(vehicle.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="add">
            <CadastroFrota onVehicleAdded={() => {
              fetchVehicles();
              setActiveTab("list"); // Mudar para a aba de lista após adicionar
            }} />
          </TabsContent>
        </Tabs>

        {/* Diálogo de edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Veículo</DialogTitle>
              <DialogDescription>
                Atualize as informações do veículo selecionado.
              </DialogDescription>
            </DialogHeader>
            {editingVehicle && (
              <EditVehicleForm 
                vehicle={editingVehicle}
                onUpdate={handleUpdateVehicle}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setEditingVehicle(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de Documentos do Veículo */}
        <Dialog open={documentosDialogOpen} onOpenChange={setDocumentosDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Documentos do Veículo - {selectedVehicleDocumentos?.placa}
              </DialogTitle>
              <DialogDescription>
                Documentos e certificados anexados ao veículo
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              {/* CRLV */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <File className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">CRLV</p>
                    <p className="text-sm text-gray-500">Certificado de Registro e Licenciamento</p>
                  </div>
                </div>
                {selectedVehicleDocumentos?.crlv_url ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(selectedVehicleDocumentos.crlv_url, '_blank')}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Visualizar
                  </Button>
                ) : (
                  <Badge variant="secondary">Não anexado</Badge>
                )}
              </div>

              {/* ANTT */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <File className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">ANTT</p>
                    <p className="text-sm text-gray-500">Registro Nacional de Transportadores</p>
                  </div>
                </div>
                {selectedVehicleDocumentos?.antt_url ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(selectedVehicleDocumentos.antt_url, '_blank')}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Visualizar
                  </Button>
                ) : (
                  <Badge variant="secondary">Não anexado</Badge>
                )}
              </div>

              {/* Cartão de Abastecimento */}
              {selectedVehicleDocumentos?.cartao_abastecimento && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <File className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Cartão de Abastecimento</p>
                      <p className="text-sm text-gray-500">Número: {selectedVehicleDocumentos.cartao_abastecimento}</p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800">Cadastrado</Badge>
                </div>
              )}

              {/* Mensagem se não houver documentos */}
              {!selectedVehicleDocumentos?.crlv_url && !selectedVehicleDocumentos?.antt_url && !selectedVehicleDocumentos?.cartao_abastecimento && (
                <div className="text-center py-6 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhum documento anexado a este veículo</p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setDocumentosDialogOpen(false)}>
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayoutSimple>
  );
};

export default VehiclesNew;