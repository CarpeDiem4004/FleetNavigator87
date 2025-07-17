import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Laptop, Smartphone, Monitor, Printer, Plus, Edit, Trash2, UserCheck, Settings, FileText, Download, Search, History, Clock, Wrench, Paperclip, Eye, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

// Schema para validação do formulário de equipamento
const equipmentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(['notebook', 'celular', 'tablet', 'desktop', 'monitor', 'impressora', 'scanner', 'roteador', 'telefone_fixo', 'camera', 'projetor', 'outros']),
  brand: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  patrimony_number: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_value: z.string().optional(),
  supplier: z.string().optional(),
  warranty_expires: z.string().optional(),
  condition: z.enum(['novo', 'otimo', 'bom', 'regular', 'ruim', 'defeituoso']).default('novo'),
  status: z.enum(['disponivel', 'em_uso', 'manutencao', 'descartado', 'perdido', 'roubado']).default('disponivel'),
  location: z.string().optional(),
  notes: z.string().optional(),
});

// Schema para termo de responsabilidade
const responsibilityTermSchema = z.object({
  equipment_id: z.number(),
  full_name: z.string().min(1, "Nome completo é obrigatório"),
  cpf: z.string().min(11, "CPF deve ter 11 dígitos").max(14, "CPF inválido"),
  phone: z.string().min(10, "Telefone é obrigatório"),
  department: z.string().min(1, "Departamento é obrigatório"),
  address: z.string().min(1, "Endereço é obrigatório"),
  condition_at_assignment: z.enum(['novo', 'otimo', 'bom', 'regular', 'ruim', 'defeituoso']),
  notes: z.string().optional(),
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;
type ResponsibilityTermFormData = z.infer<typeof responsibilityTermSchema>;

const equipmentTypeLabels = {
  notebook: 'Notebook',
  celular: 'Celular',
  tablet: 'Tablet',
  desktop: 'Desktop',
  monitor: 'Monitor',
  impressora: 'Impressora',
  scanner: 'Scanner',
  roteador: 'Roteador',
  telefone_fixo: 'Telefone Fixo',
  camera: 'Câmera',
  projetor: 'Projetor',
  outros: 'Outros'
};

const equipmentStatusLabels = {
  disponivel: 'Disponível',
  em_uso: 'Em Uso',
  manutencao: 'Manutenção',
  descartado: 'Descartado',
  perdido: 'Perdido',
  roubado: 'Roubado'
};

const equipmentConditionLabels = {
  novo: 'Novo',
  otimo: 'Ótimo',
  bom: 'Bom',
  regular: 'Regular',
  ruim: 'Ruim',
  defeituoso: 'Defeituoso'
};

const getEquipmentIcon = (type: string) => {
  switch (type) {
    case 'notebook':
      return <Laptop className="h-4 w-4" />;
    case 'celular':
      return <Smartphone className="h-4 w-4" />;
    case 'monitor':
      return <Monitor className="h-4 w-4" />;
    case 'impressora':
      return <Printer className="h-4 w-4" />;
    default:
      return <Settings className="h-4 w-4" />;
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'disponivel':
      return 'default';
    case 'em_uso':
      return 'secondary';
    case 'manutencao':
      return 'destructive';
    default:
      return 'outline';
  }
};

export default function Equipment() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<any>(null);
  const [isTermDialogOpen, setIsTermDialogOpen] = useState(false);
  const [selectedEquipmentForTerm, setSelectedEquipmentForTerm] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('equipments');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipmentForHistory, setSelectedEquipmentForHistory] = useState<any>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedTermForUpload, setSelectedTermForUpload] = useState<any>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: '',
      type: undefined,
      brand: '',
      model: '',
      serial_number: '',
      patrimony_number: '',
      purchase_date: '',
      purchase_value: '',
      supplier: '',
      warranty_expires: '',
      condition: 'novo',
      status: 'disponivel',
      location: '',
      notes: '',
    },
  });

  const termForm = useForm<ResponsibilityTermFormData>({
    resolver: zodResolver(responsibilityTermSchema),
    defaultValues: {
      equipment_id: 0,
      full_name: '',
      cpf: '',
      phone: '',
      department: '',
      address: '',
      condition_at_assignment: 'novo',
      notes: '',
    },
  });

  // Query para buscar equipamentos
  const { data: equipmentsResponse, isLoading } = useQuery({
    queryKey: ['/api/equipment-list'],
  });
  
  const equipments = equipmentsResponse?.data || [];

  // Query para dashboard
  const { data: dashboard } = useQuery({
    queryKey: ['/api/equipment-dashboard'],
  });

  // Query para buscar termos de responsabilidade
  const { data: responsibilityTermsResponse } = useQuery({
    queryKey: ['/api/equipment-responsibility-terms'],
  });
  
  const responsibilityTerms = responsibilityTermsResponse?.data || [];

  // Query para buscar histórico de movimentação
  const { data: equipmentMovementsResponse } = useQuery({
    queryKey: ['/api/equipment-movements', selectedEquipmentForHistory?.id],
    enabled: !!selectedEquipmentForHistory,
  });
  
  const equipmentMovements = equipmentMovementsResponse?.data || [];

  // Query para buscar histórico de manutenção
  const { data: equipmentMaintenanceResponse } = useQuery({
    queryKey: ['/api/equipment-maintenance', selectedEquipmentForHistory?.id],
    enabled: !!selectedEquipmentForHistory,
  });
  
  const equipmentMaintenance = equipmentMaintenanceResponse?.data || [];

  // Filtrar equipamentos baseado na busca
  const filteredEquipments = useMemo(() => {
    if (!searchTerm) return equipments;
    
    return equipments.filter((equipment: any) =>
      equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (equipment.brand && equipment.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (equipment.model && equipment.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (equipment.serial_number && equipment.serial_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (equipment.patrimony_number && equipment.patrimony_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      equipmentTypeLabels[equipment.type].toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipmentStatusLabels[equipment.status].toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [equipments, searchTerm]);

  // Mutation para criar equipamento
  const createEquipmentMutation = useMutation({
    mutationFn: (data: EquipmentFormData) => apiRequest('POST', '/api/equipment-create', data),
    onSuccess: (response) => {
      console.log('Equipamento criado com sucesso:', response);
      
      // Invalidar todas as queries relacionadas a equipamentos
      console.log('Invalidando queries...');
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-list'] });
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-responsibility-terms'] });
      
      // Forçar refetch das queries
      console.log('Forçando refetch...');
      queryClient.refetchQueries({ queryKey: ['/api/equipment-list'] });
      queryClient.refetchQueries({ queryKey: ['/api/equipment-dashboard'] });
      
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Equipamento criado com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao criar equipamento:', error);
      toast({
        title: "Erro",
        description: `Erro ao criar equipamento: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar equipamento
  const updateEquipmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EquipmentFormData }) =>
      apiRequest('PUT', `/api/equipment/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-list'] });
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-dashboard'] });
      setEditingEquipment(null);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Equipamento atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar equipamento",
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar equipamento
  const deleteEquipmentMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/equipment/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/equipment'] });
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-dashboard'] });
      toast({
        title: "Sucesso",
        description: "Equipamento deletado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao deletar equipamento",
        variant: "destructive",
      });
    },
  });

  // Mutation para criar termo de responsabilidade
  const createTermMutation = useMutation({
    mutationFn: (data: ResponsibilityTermFormData) => apiRequest('POST', '/api/equipment-responsibility-terms', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/equipment'] });
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-responsibility-terms'] });
      setIsTermDialogOpen(false);
      setSelectedEquipmentForTerm(null);
      termForm.reset();
      toast({
        title: "Sucesso",
        description: "Termo de responsabilidade criado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro", 
        description: "Erro ao criar termo de responsabilidade",
        variant: "destructive",
      });
    },
  });

  // Mutation para upload de arquivo
  const uploadTermMutation = useMutation({
    mutationFn: async ({ termId, file }: { termId: number; file: File }) => {
      const formData = new FormData();
      formData.append('signed_document', file);
      
      // Use the same token extraction method as apiRequest
      const token = localStorage.getItem('jwt_token') || sessionStorage.getItem('emergencyToken');
      
      const response = await fetch(`/api/equipment-responsibility-terms/${termId}/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Upload error:', errorData);
        throw new Error(`Erro no upload do arquivo: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Force refetch the data immediately
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-responsibility-terms'] });
      queryClient.refetchQueries({ queryKey: ['/api/equipment-responsibility-terms'] });
      setIsUploadDialogOpen(false);
      setSelectedTermForUpload(null);
      setUploadFile(null);
      toast({
        title: "Sucesso",
        description: "Documento anexado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao anexar documento",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EquipmentFormData) => {
    if (editingEquipment) {
      updateEquipmentMutation.mutate({ id: editingEquipment.id, data });
    } else {
      createEquipmentMutation.mutate(data);
    }
  };

  const onTermSubmit = (data: ResponsibilityTermFormData) => {
    if (selectedEquipmentForTerm) {
      // Gerar e baixar o PDF automaticamente
      handleDownloadTerm(data, selectedEquipmentForTerm);
      
      // Criar o termo no banco de dados
      createTermMutation.mutate({
        ...data,
        equipment_id: selectedEquipmentForTerm.id,
        term_content: `Termo de Responsabilidade para ${selectedEquipmentForTerm.name}`,
      });
    }
  };

  const handleCreateTerm = (equipment: any) => {
    setSelectedEquipmentForTerm(equipment);
    setIsTermDialogOpen(true);
  };

  const generateTermPDF = (termData: ResponsibilityTermFormData, equipment: any) => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMO DE RESPONSABILIDADE', 105, 20, { align: 'center' });
    
    // Subtítulo
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('CONTROLE DE EQUIPAMENTOS', 105, 30, { align: 'center' });
    
    // Informações do equipamento
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO EQUIPAMENTO:', 20, 50);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Equipamento: ${equipment.name}`, 20, 60);
    doc.text(`Tipo: ${equipmentTypeLabels[equipment.type]}`, 20, 70);
    doc.text(`Marca/Modelo: ${equipment.brand || 'N/A'} ${equipment.model || ''}`, 20, 80);
    doc.text(`Número de Série: ${equipment.serial_number || 'N/A'}`, 20, 90);
    doc.text(`Número do Patrimônio: ${equipment.patrimony_number || 'N/A'}`, 20, 100);
    doc.text(`Condição: ${equipmentConditionLabels[termData.condition_at_assignment]}`, 20, 110);
    
    // Dados do responsável
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO RESPONSÁVEL:', 20, 130);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome Completo: ${termData.full_name}`, 20, 140);
    doc.text(`CPF: ${termData.cpf}`, 20, 150);
    doc.text(`Telefone: ${termData.phone}`, 20, 160);
    doc.text(`Departamento: ${termData.department}`, 20, 170);
    doc.text(`Endereço: ${termData.address}`, 20, 180);
    
    // Termo de responsabilidade
    doc.setFont('helvetica', 'bold');
    doc.text('TERMO DE RESPONSABILIDADE:', 20, 200);
    
    doc.setFont('helvetica', 'normal');
    const termoText = `
Eu, ${termData.full_name}, portador do CPF ${termData.cpf}, declaro ter recebido em perfeito estado de funcionamento e conservação o equipamento descrito acima, comprometendo-me a:

1. Utilizar o equipamento exclusivamente para atividades profissionais relacionadas ao meu trabalho na empresa;
2. Manter o equipamento em bom estado de conservação;
3. Não permitir o uso do equipamento por terceiros;
4. Comunicar imediatamente qualquer defeito, dano ou perda do equipamento;
5. Devolver o equipamento quando solicitado ou ao me desligar da empresa;
6. Responsabilizar-me por eventuais danos causados por uso inadequado.

Declaro estar ciente de que sou responsável pelo equipamento até sua devolução formal.
    `;
    
    const splitText = doc.splitTextToSize(termoText, 170);
    doc.text(splitText, 20, 210);
    
    // Observações
    if (termData.notes) {
      doc.text('Observações:', 20, 260);
      const notesText = doc.splitTextToSize(termData.notes, 170);
      doc.text(notesText, 20, 270);
    }
    
    // Assinaturas
    doc.text('_________________________', 20, 280);
    doc.text('Assinatura do Responsável', 20, 290);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 300);
    
    doc.text('_________________________', 120, 280);
    doc.text('Assinatura do Gestor', 120, 290);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 120, 300);
    
    return doc;
  };

  const handleDownloadTerm = (termData: ResponsibilityTermFormData, equipment: any) => {
    const doc = generateTermPDF(termData, equipment);
    doc.save(`termo_responsabilidade_${equipment.name.replace(/[^a-zA-Z0-9]/g, '_')}_${termData.full_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  const handleEdit = (equipment: any) => {
    setEditingEquipment(equipment);
    form.reset({
      name: equipment.name,
      type: equipment.type,
      brand: equipment.brand || '',
      model: equipment.model || '',
      serial_number: equipment.serial_number || '',
      patrimony_number: equipment.patrimony_number || '',
      purchase_date: equipment.purchase_date || '',
      purchase_value: equipment.purchase_value || '',
      supplier: equipment.supplier || '',
      warranty_expires: equipment.warranty_expires || '',
      condition: equipment.condition,
      status: equipment.status,
      location: equipment.location || '',
      notes: equipment.notes || '',
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja deletar este equipamento?')) {
      deleteEquipmentMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsCreateDialogOpen(false);
    setEditingEquipment(null);
    form.reset();
  };

  if (isLoading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Controle de Equipamentos</h1>
          <p className="text-muted-foreground">
            Gerencie notebooks, celulares e outros equipamentos da empresa
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Equipamento
        </Button>
      </div>

      {/* Abas */}
      <div className="flex space-x-1 border-b">
        <button
          onClick={() => setActiveTab('equipments')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'equipments' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Equipamentos
        </button>
        <button
          onClick={() => setActiveTab('terms')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'terms' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Termos de Responsabilidade
        </button>
      </div>

      {/* Conteúdo das abas */}
      {activeTab === 'equipments' && (
        <div className="space-y-6">
          {/* Dashboard Cards */}
          {dashboard && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Equipamentos</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard.total_equipments}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
                  <div className="h-4 w-4 rounded-full bg-green-500"></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard.available_equipments}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Em Uso</CardTitle>
                  <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard.in_use_equipments}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Em Manutenção</CardTitle>
                  <div className="h-4 w-4 rounded-full bg-red-500"></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard.maintenance_equipments}</div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Tabela de Equipamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Equipamentos</CardTitle>
              <CardDescription>
                {filteredEquipments.length} de {equipments.length} equipamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Campo de Busca */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome, tipo, marca, modelo, série ou patrimônio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Equipamento</th>
                      <th className="text-left p-2">Tipo</th>
                      <th className="text-left p-2">Marca/Modelo</th>
                      <th className="text-left p-2">Número de Série</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Condição</th>
                      <th className="text-left p-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEquipments.map((equipment: any) => (
                      <tr key={equipment.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            {getEquipmentIcon(equipment.type)}
                            <span className="font-medium">{equipment.name}</span>
                          </div>
                        </td>
                        <td className="p-2">{equipmentTypeLabels[equipment.type]}</td>
                        <td className="p-2">{equipment.brand} {equipment.model}</td>
                        <td className="p-2">{equipment.serial_number || 'N/A'}</td>
                        <td className="p-2">
                          <Badge variant={getStatusBadgeVariant(equipment.status)}>
                            {equipmentStatusLabels[equipment.status]}
                          </Badge>
                        </td>
                        <td className="p-2">{equipmentConditionLabels[equipment.condition]}</td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(equipment)}
                              title="Editar Equipamento"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedEquipmentForHistory(equipment);
                                setIsHistoryDialogOpen(true);
                              }}
                              title="Ver Histórico"
                            >
                              <History className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCreateTerm(equipment)}
                              title="Criar Termo de Responsabilidade"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(equipment.id)}
                              title="Deletar Equipamento"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Aba de Termos de Responsabilidade */}
      {activeTab === 'terms' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Termos de Responsabilidade Ativos</CardTitle>
              <CardDescription>
                Visualize e gerencie termos de responsabilidade para equipamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Equipamento</th>
                      <th className="text-left p-2">Responsável</th>
                      <th className="text-left p-2">CPF</th>
                      <th className="text-left p-2">Departamento</th>
                      <th className="text-left p-2">Data de Entrega</th>
                      <th className="text-left p-2">Documento</th>
                      <th className="text-left p-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responsibilityTerms.map((term: any) => (
                      <tr key={term.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            {getEquipmentIcon(term.equipment_type)}
                            <span className="font-medium">{term.equipment_name}</span>
                          </div>
                        </td>
                        <td className="p-2">{term.full_name}</td>
                        <td className="p-2">{term.cpf}</td>
                        <td className="p-2">{term.department}</td>
                        <td className="p-2">
                          {new Date(term.assigned_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-2">
                          {term.signed_document_url ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Assinado
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              Pendente
                            </Badge>
                          )}
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Recriar o PDF com os dados do termo
                                const equipment = {
                                  name: term.equipment_name,
                                  type: term.equipment_type,
                                  brand: '',
                                  model: '',
                                  serial_number: term.equipment_serial || '',
                                  patrimony_number: ''
                                };
                                const termData = {
                                  full_name: term.full_name,
                                  cpf: term.cpf,
                                  phone: term.phone,
                                  department: term.department,
                                  address: term.address,
                                  condition_at_assignment: term.condition_at_assignment,
                                  notes: term.notes || ''
                                };
                                handleDownloadTerm(termData, equipment);
                              }}
                              title="Baixar PDF do Termo Original"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {!term.signed_document_url ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedTermForUpload(term);
                                  setIsUploadDialogOpen(true);
                                }}
                                title="Anexar Termo Assinado"
                              >
                                <Paperclip className="h-4 w-4" />
                              </Button>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(term.signed_document_url, '_blank')}
                                  title="Ver Termo Assinado"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Criar um link temporário para download
                                    const link = document.createElement('a');
                                    link.href = term.signed_document_url;
                                    link.download = `termo_assinado_${term.equipment_name}_${term.full_name}.${term.signed_document_url.split('.').pop()}`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                  title="Baixar Termo Assinado"
                                >
                                  <Download className="h-4 w-4 text-green-600" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Diálogos */}
      <Dialog open={isCreateDialogOpen || !!editingEquipment} onOpenChange={handleDialogClose}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEquipment ? 'Editar Equipamento' : 'Novo Equipamento'}
              </DialogTitle>
              <DialogDescription>
                {editingEquipment 
                  ? 'Atualize as informações do equipamento'
                  : 'Cadastre um novo equipamento no sistema'
                }
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Nome do Equipamento</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Notebook Dell Inspiron 15" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(equipmentTypeLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
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
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Dell, Apple, Samsung" {...field} />
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
                          <Input placeholder="Ex: Inspiron 15 3000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serial_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Série</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: ABC123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="patrimony_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do Patrimônio</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: PAT001234" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purchase_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Compra</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purchase_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor de Compra</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="Ex: 2500.00" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="supplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fornecedor</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Dell Brasil" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="warranty_expires"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Garantia até</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condição</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a condição" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(equipmentConditionLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
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
                            {Object.entries(equipmentStatusLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
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
                    name="location"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Localização</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Escritório São Paulo - Sala 201" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Informações adicionais sobre o equipamento..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createEquipmentMutation.isPending || updateEquipmentMutation.isPending}>
                    {editingEquipment ? 'Atualizar' : 'Criar'} Equipamento
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      {/* Dialog para termo de responsabilidade */}
      <Dialog open={isTermDialogOpen} onOpenChange={setIsTermDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Termo de Responsabilidade</DialogTitle>
            <DialogDescription>
              Criar termo de responsabilidade para o equipamento: {selectedEquipmentForTerm?.name}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...termForm}>
            <form onSubmit={termForm.handleSubmit(onTermSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={termForm.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo da pessoa responsável" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={termForm.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF *</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={termForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone *</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={termForm.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departamento *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: TI, Recursos Humanos, Logística" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={termForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Endereço *</FormLabel>
                      <FormControl>
                        <Input placeholder="Endereço completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={termForm.control}
                  name="condition_at_assignment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condição do Equipamento *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a condição" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(equipmentConditionLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={termForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Informações adicionais sobre o termo de responsabilidade..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setIsTermDialogOpen(false)}>
                  Cancelar
                </Button>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      const formData = termForm.getValues();
                      if (selectedEquipmentForTerm && formData.full_name && formData.cpf) {
                        handleDownloadTerm(formData, selectedEquipmentForTerm);
                      } else {
                        toast({
                          title: "Erro",
                          description: "Preencha pelo menos o nome e CPF para gerar o PDF",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar PDF
                  </Button>
                  <Button type="submit" disabled={createTermMutation.isPending}>
                    <FileText className="mr-2 h-4 w-4" />
                    Criar Termo e Baixar PDF
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Histórico */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Histórico de Movimentação e Manutenção
            </DialogTitle>
            <DialogDescription>
              {selectedEquipmentForHistory?.name} - Histórico completo do equipamento
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Histórico de Movimentação */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Movimentação</h3>
              {equipmentMovements.length > 0 ? (
                <div className="space-y-2">
                  {equipmentMovements.map((movement: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="font-medium">{movement.action}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{movement.description}</p>
                          {movement.responsible && (
                            <p className="text-sm text-gray-500">Responsável: {movement.responsible}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {new Date(movement.date).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(movement.date).toLocaleTimeString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <History className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <p>Nenhuma movimentação registrada</p>
                </div>
              )}
            </div>

            {/* Histórico de Manutenção */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Manutenção</h3>
              {equipmentMaintenance.length > 0 ? (
                <div className="space-y-2">
                  {equipmentMaintenance.map((maintenance: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="font-medium">{maintenance.type}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{maintenance.description}</p>
                          {maintenance.cost && (
                            <p className="text-sm text-green-600 font-medium">
                              Custo: R$ {parseFloat(maintenance.cost).toFixed(2)}
                            </p>
                          )}
                          {maintenance.technician && (
                            <p className="text-sm text-gray-500">Técnico: {maintenance.technician}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {new Date(maintenance.date).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(maintenance.date).toLocaleTimeString('pt-BR')}
                          </p>
                          {maintenance.status && (
                            <Badge variant={maintenance.status === 'completed' ? 'default' : 'secondary'}>
                              {maintenance.status === 'completed' ? 'Concluído' : 'Pendente'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <p>Nenhuma manutenção registrada</p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsHistoryDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Upload */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Anexar Termo Assinado</DialogTitle>
            <DialogDescription>
              Faça upload do documento assinado (PDF, JPG, PNG)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedTermForUpload && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">Equipamento: {selectedTermForUpload.equipment_name}</p>
                <p className="text-sm text-gray-600">Responsável: {selectedTermForUpload.full_name}</p>
              </div>
            )}
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setUploadFile(e.target.files[0]);
                  }
                }}
                className="hidden"
                id="upload-file"
              />
              <label htmlFor="upload-file" className="cursor-pointer">
                <div className="space-y-2">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Clique para selecionar um arquivo
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, JPG, PNG (máx. 10MB)
                  </p>
                </div>
              </label>
            </div>
            
            {uploadFile && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">{uploadFile.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUploadFile(null)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (selectedTermForUpload && uploadFile) {
                  uploadTermMutation.mutate({
                    termId: selectedTermForUpload.id,
                    file: uploadFile,
                  });
                }
              }}
              disabled={!uploadFile || uploadTermMutation.isPending}
            >
              {uploadTermMutation.isPending ? 'Enviando...' : 'Anexar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}