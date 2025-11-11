import { useState, useMemo, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Laptop, Smartphone, Monitor, Printer, Plus, Edit, Trash2, UserCheck, Settings, FileText, Download, Search, History, Clock, Wrench, Paperclip, Eye, Upload, RefreshCw, ClipboardList, CheckCircle, RotateCcw, Share, Copy, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

// Schema para validação do formulário de equipamento
const equipmentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(['notebook', 'celular', 'tablet', 'desktop', 'monitor', 'impressora', 'scanner', 'roteador', 'telefone_fixo', 'camera', 'projetor', 'outros']),
  ownership_type: z.enum(['proprio', 'alugado']).default('proprio'),
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
  email: 'Email',
  chip: 'Chip',
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

const ownershipTypeLabels = {
  proprio: 'Próprio',
  alugado: 'Alugado'
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
  const [forceRefreshKey, setForceRefreshKey] = useState(0);
  const [selectedTermToView, setSelectedTermToView] = useState<any>(null);
  const [isViewTermDialogOpen, setIsViewTermDialogOpen] = useState(false);
  const [selectedEquipmentForReturn, setSelectedEquipmentForReturn] = useState<any>(null);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: '',
      type: undefined,
      ownership_type: 'proprio',
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
  const { data: equipmentsResponse, isLoading, refetch: refetchEquipments } = useQuery({
    queryKey: ['/api/equipment-list', forceRefreshKey],
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
  
  const equipments = equipmentsResponse?.data || [];
  console.log('Equipamentos carregados:', equipments.length, equipments);

  // Query para dashboard
  const { data: dashboardResponse, refetch: refetchDashboard } = useQuery({
    queryKey: ['/api/equipment-dashboard', forceRefreshKey],
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
  
  const dashboard = dashboardResponse?.data;
  console.log('Dashboard carregado:', dashboard);

  // Query para buscar termos de responsabilidade
  const { data: responsibilityTermsResponse, refetch: refetchTerms } = useQuery({
    queryKey: ['/api/equipment/equipment-responsibility-terms'],
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
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

  // Resetar estado de loading quando o modal for fechado
  useEffect(() => {
    if (!isReturnDialogOpen) {
      setIsProcessingReturn(false);
    }
  }, [isReturnDialogOpen]);

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
    mutationFn: (data: EquipmentFormData) => apiRequest('POST', '/api/equipment', data),
    onSuccess: async (response) => {
      console.log('Equipamento criado com sucesso:', response);
      
      // Forçar atualização mudando a chave
      setForceRefreshKey(prev => prev + 1);
      
      // Limpar todo o cache do React Query
      queryClient.clear();
      
      // Aguardar um pouco para garantir que o backend processou
      setTimeout(() => {
        setForceRefreshKey(prev => prev + 1);
      }, 500);
      
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
      setIsCreateDialogOpen(false);
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
    mutationFn: (data: ResponsibilityTermFormData) => apiRequest('POST', '/api/equipment/equipment-responsibility-terms', data),
    onSuccess: () => {
      // Invalidar todas as queries relacionadas para refletir as mudanças
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-list'] });
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/equipment/equipment-responsibility-terms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-movements'] });
      
      // Forçar atualização imediata com refetch específico dos termos
      setForceRefreshKey(prev => prev + 1);
      refetchEquipments();
      refetchDashboard();
      refetchTerms(); // NOVO: refetch específico para termos
      
      setIsTermDialogOpen(false);
      setSelectedEquipmentForTerm(null);
      termForm.reset();
      
      // Mudar para a aba de termos para mostrar o novo termo
      setActiveTab('terms');
      
      toast({
        title: "Sucesso",
        description: "Termo de responsabilidade criado! Equipamento agora está 'Em Uso' e aparece na aba Termos.",
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
      
      const response = await fetch(`/api/equipment/equipment-responsibility-terms/${termId}/upload`, {
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
      queryClient.invalidateQueries({ queryKey: ['/api/equipment/equipment-responsibility-terms'] });
      queryClient.refetchQueries({ queryKey: ['/api/equipment/equipment-responsibility-terms'] });
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

  const onTermSubmit = async (data: ResponsibilityTermFormData) => {
    if (selectedEquipmentForTerm) {
      try {
        // Gerar o PDF
        const doc = generateTermPDF(data, selectedEquipmentForTerm);
        const pdfBlob = doc.output('blob');
        
        // Criar FormData com os dados do termo + PDF
        const formData = new FormData();
        formData.append('equipment_id', selectedEquipmentForTerm.id.toString());
        formData.append('full_name', data.full_name);
        formData.append('cpf', data.cpf);
        formData.append('phone', data.phone);
        formData.append('department', data.department);
        formData.append('address', data.address);
        formData.append('condition_at_assignment', data.condition_at_assignment);
        formData.append('notes', data.notes || '');
        formData.append('term_content', `Termo de Responsabilidade para ${selectedEquipmentForTerm.name}`);
        
        // Anexar o PDF
        const filename = `termo_${selectedEquipmentForTerm.id}_${Date.now()}.pdf`;
        formData.append('signed_document', pdfBlob, filename);
        
        // Enviar para o backend
        const response = await fetch('/api/equipment/equipment-responsibility-terms/create-with-pdf', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Erro ao criar termo com PDF');
        }
        
        const result = await response.json();
        
        // Atualizar cache e fechar diálogo
        queryClient.invalidateQueries({ queryKey: ['/api/equipment-list'] });
        queryClient.invalidateQueries({ queryKey: ['/api/equipment-dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['/api/equipment/equipment-responsibility-terms'] });
        
        setIsTermDialogOpen(false);
        setSelectedEquipmentForTerm(null);
        termForm.reset();
        
        toast({
          title: "Sucesso",
          description: "Termo criado e PDF salvo automaticamente!",
        });
        
        // Também baixar o PDF para o usuário
        handleDownloadTerm(data, selectedEquipmentForTerm);
        
      } catch (error) {
        console.error('Erro ao criar termo:', error);
        toast({
          title: "Erro",
          description: "Erro ao criar termo de responsabilidade.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCreateTerm = (equipment: any) => {
    // Verificar se já existe um termo ativo para este equipamento
    const existingActiveTerm = responsibilityTerms?.find(
      term => term.equipment_id === equipment.id && term.is_active
    );
    
    if (existingActiveTerm) {
      toast({
        title: "Termo já existe",
        description: `Equipamento já possui um termo ativo. Para criar um novo termo, primeiro marque o atual como devolvido.`,
        variant: "destructive",
      });
      return;
    }
    
    // Verificar se o equipamento está disponível para criar termo
    if (equipment.status !== 'disponivel') {
      toast({
        title: "Equipamento indisponível",
        description: `Equipamento não está disponível (Status: ${equipment.status}). Apenas equipamentos disponíveis podem ter termos criados.`,
        variant: "destructive",
      });
      return;
    }
    
    setSelectedEquipmentForTerm(equipment);
    setIsTermDialogOpen(true);
  };

  const handleViewTerm = async (equipment: any) => {
    try {
      const response = await apiRequest('GET', `/api/equipment/equipment-responsibility-terms/equipment/${equipment.id}/active`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setSelectedTermToView(data.data);
        setIsViewTermDialogOpen(true);
      } else {
        toast({
          title: "Termo não encontrado",
          description: "Não foi encontrado um termo ativo para este equipamento.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Erro ao buscar termo:', error);
      const errorMessage = error?.message || error?.error || "Erro ao buscar termo de responsabilidade.";
      const isAuthError = errorMessage.includes("autenticado") || errorMessage.includes("Token");
      
      toast({
        title: isAuthError ? "Sessão expirada" : "Erro",
        description: isAuthError ? "Sua sessão expirou. Por favor, faça login novamente." : errorMessage,
        variant: "destructive",
      });
      
      if (isAuthError) {
        setTimeout(() => window.location.href = '/login', 2000);
      }
    }
  };

  const handleReturnEquipment = async (equipment: any) => {
    try {
      const response = await apiRequest('GET', `/api/equipment/equipment-responsibility-terms/equipment/${equipment.id}/active`);
      const data = await response.json();
      
      if (data.success && data.data) {
        // Se houver termo ativo, abre o diálogo completo de devolução
        setSelectedEquipmentForReturn(equipment);
        setSelectedTermToView(data.data);
        setIsReturnDialogOpen(true);
      } else {
        // Se não houver termo, permite devolução simplificada (apenas muda status para disponível)
        setSelectedEquipmentForReturn(equipment);
        setSelectedTermToView(null); // Sem termo ativo
        setIsReturnDialogOpen(true);
      }
    } catch (error: any) {
      console.error('Erro ao buscar termo para devolução:', error);
      const errorMessage = error?.message || error?.error || "Erro ao buscar termo para devolução.";
      const isAuthError = errorMessage.includes("autenticado") || errorMessage.includes("Token");
      
      if (isAuthError) {
        toast({
          title: "Sessão expirada",
          description: "Sua sessão expirou. Por favor, faça login novamente.",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = '/login', 2000);
      } else {
        // Se der erro mas não for de autenticação, permite devolução simplificada mesmo assim
        setSelectedEquipmentForReturn(equipment);
        setSelectedTermToView(null);
        setIsReturnDialogOpen(true);
      }
    }
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
    const equipmentName = (equipment.name || 'equipamento').replace(/[^a-zA-Z0-9]/g, '_');
    const userName = (termData.full_name || 'usuario').replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`termo_responsabilidade_${equipmentName}_${userName}.pdf`);
  };

  const handleEdit = (equipment: any) => {
    setEditingEquipment(equipment);
    form.reset({
      name: equipment.name,
      type: equipment.type,
      ownership_type: equipment.ownership_type ?? 'proprio',
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

  const handleCreateNew = () => {
    setEditingEquipment(null); // Garantir que não está editando
    form.reset();
    setIsCreateDialogOpen(true);
  };

  const handleExportToExcel = () => {
    try {
      // Preparar dados para exportação
      const exportData = equipments.map((equipment: any) => ({
        'ID': equipment.id,
        'Nome': equipment.name,
        'Tipo': equipmentTypeLabels[equipment.type as keyof typeof equipmentTypeLabels] || equipment.type,
        'Marca': equipment.brand || '-',
        'Modelo': equipment.model || '-',
        'Número de Série': equipment.serial_number || '-',
        'Patrimônio': equipment.patrimony_number || '-',
        'Status': equipmentStatusLabels[equipment.status as keyof typeof equipmentStatusLabels] || equipment.status,
        'Condição': equipmentConditionLabels[equipment.condition as keyof typeof equipmentConditionLabels] || equipment.condition,
        'Tipo de Propriedade': ownershipTypeLabels[equipment.ownership_type as keyof typeof ownershipTypeLabels] || equipment.ownership_type,
        'Localização': equipment.location || '-',
        'Fornecedor': equipment.supplier || '-',
        'Data de Compra': equipment.purchase_date || '-',
        'Valor de Compra': equipment.purchase_value || '-',
        'Garantia Expira': equipment.warranty_expires || '-',
        'Observações': equipment.notes || '-',
        'Criado em': equipment.created_at ? new Date(equipment.created_at).toLocaleDateString('pt-BR') : '-',
        'Atualizado em': equipment.updated_at ? new Date(equipment.updated_at).toLocaleDateString('pt-BR') : '-',
      }));

      // Criar planilha
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipamentos');

      // Ajustar largura das colunas
      const columnWidths = [
        { wch: 5 },  // ID
        { wch: 25 }, // Nome
        { wch: 15 }, // Tipo
        { wch: 15 }, // Marca
        { wch: 20 }, // Modelo
        { wch: 20 }, // Número de Série
        { wch: 12 }, // Patrimônio
        { wch: 12 }, // Status
        { wch: 12 }, // Condição
        { wch: 18 }, // Tipo de Propriedade
        { wch: 25 }, // Localização
        { wch: 20 }, // Fornecedor
        { wch: 15 }, // Data de Compra
        { wch: 15 }, // Valor de Compra
        { wch: 15 }, // Garantia Expira
        { wch: 30 }, // Observações
        { wch: 15 }, // Criado em
        { wch: 15 }, // Atualizado em
      ];
      worksheet['!cols'] = columnWidths;

      // Gerar e baixar arquivo
      const fileName = `equipamentos_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Exportação concluída!",
        description: `Arquivo ${fileName} foi baixado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar o arquivo Excel. Tente novamente.",
        variant: "destructive",
      });
    }
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
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleExportToExcel}
            title="Exportar todos os equipamentos para Excel"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
          <Button variant="outline" onClick={() => setIsShareDialogOpen(true)}>
            <Share className="mr-2 h-4 w-4" />
            Link Solicitação Equipamento
          </Button>
          <Link href="/equipment/requests/admin">
            <Button variant="secondary">
              <ClipboardList className="mr-2 h-4 w-4" />
              Gerenciar Solicitações
            </Button>
          </Link>
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Equipamento
          </Button>
        </div>
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
        <button
          onClick={() => setActiveTab('collaborators')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'collaborators' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Colaboradores com Equipamentos
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
                  <div className="text-2xl font-bold">{dashboard.total}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Disponíveis ({dashboard.disponivel})</CardTitle>
                  <div className="h-4 w-4 rounded-full bg-green-500"></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard.disponivel}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Em Uso ({dashboard.em_uso})</CardTitle>
                  <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard.em_uso}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Em Manutenção ({dashboard.manutencao})</CardTitle>
                  <div className="h-4 w-4 rounded-full bg-red-500"></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard.manutencao}</div>
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
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por nome, tipo, marca, modelo, série ou patrimônio..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      // Forçar atualização mudando a chave
                      setForceRefreshKey(prev => prev + 1);
                      
                      // Limpar completamente o cache
                      queryClient.clear();
                      
                      toast({
                        title: "Lista atualizada",
                        description: "A lista de equipamentos foi atualizada com sucesso!",
                      });
                    }}
                    title="Atualizar Lista"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
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
                      <th className="text-left p-2">Patrimônio</th>
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
                          <span className="font-mono text-sm">{equipment.patrimony_number || 'N/A'}</span>
                        </td>
                        <td className="p-2">
                          {equipment.status === 'disponivel' ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              {equipmentStatusLabels[equipment.status]}
                            </Badge>
                          ) : equipment.status === 'em_uso' ? (
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                              {equipmentStatusLabels[equipment.status]}
                            </Badge>
                          ) : equipment.status === 'manutencao' ? (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                              {equipmentStatusLabels[equipment.status]}
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              {equipmentStatusLabels[equipment.status]}
                            </Badge>
                          )}
                        </td>
                        <td className="p-2">{equipmentConditionLabels[equipment.condition]}</td>
                        <td className="p-2">
                          <div className="flex gap-1">
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
                            
                            {/* Botões condicionais baseados no status */}
                            {equipment.status === 'em_uso' ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewTerm(equipment)}
                                  title="Ver Termo de Responsabilidade"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReturnEquipment(equipment)}
                                  title="Registrar Devolução/Baixa"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCreateTerm(equipment)}
                                title={equipment.status !== 'disponivel' ? 'Apenas equipamentos disponíveis podem ter termos criados' : 'Criar Termo de Responsabilidade'}
                                disabled={equipment.status !== 'disponivel'}
                                className={equipment.status !== 'disponivel' ? 'opacity-50 cursor-not-allowed' : ''}
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                            )}
                            
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
              <CardTitle>Histórico de Termos de Responsabilidade</CardTitle>
              <CardDescription>
                Visualize todos os termos de responsabilidade (ativos e devolvidos)
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
                      <th className="text-left p-2">Data de Devolução</th>
                      <th className="text-left p-2">Status</th>
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
                          {term.returned_at ? (
                            <span className="text-sm">
                              {new Date(term.returned_at).toLocaleDateString('pt-BR')}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-2">
                          {term.is_active ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                              Devolvido
                            </Badge>
                          )}
                        </td>
                        <td className="p-2">
                          <div className="flex gap-1 flex-wrap">
                            {/* Botão Visualizar/Editar Termo */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTermToView(term);
                                setIsViewTermDialogOpen(true);
                              }}
                              title="Visualizar Detalhes do Termo"
                              data-testid={`button-view-term-${term.id}`}
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>

                            {/* Botão Download PDF Original */}
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
                              data-testid={`button-download-term-${term.id}`}
                            >
                              <Download className="h-4 w-4 text-gray-600" />
                            </Button>

                            {/* Botão Anexar/Ver Documento Assinado */}
                            {!term.signed_document_url ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedTermForUpload(term);
                                  setIsUploadDialogOpen(true);
                                }}
                                title="Anexar Termo Assinado"
                                data-testid={`button-upload-term-${term.id}`}
                              >
                                <Paperclip className="h-4 w-4 text-orange-600" />
                              </Button>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(term.signed_document_url, '_blank')}
                                  title="Ver Termo Assinado"
                                  data-testid={`button-view-signed-${term.id}`}
                                >
                                  <FileText className="h-4 w-4 text-green-600" />
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
                                  data-testid={`button-download-signed-${term.id}`}
                                >
                                  <Download className="h-4 w-4 text-green-600" />
                                </Button>
                              </>
                            )}

                            {/* Botão Compartilhar */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const termUrl = `${window.location.origin}/equipment/${term.equipment_id}/term/${term.id}`;
                                navigator.clipboard.writeText(termUrl).then(() => {
                                  toast({
                                    title: "Link copiado!",
                                    description: "Link do termo copiado para a área de transferência",
                                  });
                                });
                              }}
                              title="Compartilhar Link do Termo"
                              data-testid={`button-share-term-${term.id}`}
                            >
                              <Share className="h-4 w-4 text-purple-600" />
                            </Button>

                            {/* Botão Marcar como Devolvido (apenas para termos ativos) */}
                            {term.is_active && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // Buscar equipamento e abrir modal de devolução
                                  const equipment = equipments.find(eq => eq.id === term.equipment_id);
                                  if (equipment) {
                                    handleReturnEquipment(equipment);
                                  }
                                }}
                                title="Registrar Devolução"
                                data-testid={`button-return-term-${term.id}`}
                              >
                                <RotateCcw className="h-4 w-4 text-red-600" />
                              </Button>
                            )}

                            {/* Botão Duplicar Termo */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const equipment = equipments.find(eq => eq.id === term.equipment_id);
                                if (equipment && equipment.status === 'disponivel') {
                                  // Pré-preencher form com dados do termo anterior
                                  termForm.reset({
                                    equipment_id: term.equipment_id,
                                    full_name: term.full_name,
                                    cpf: term.cpf,
                                    phone: term.phone,
                                    department: term.department,
                                    address: term.address,
                                    condition_at_assignment: 'novo',
                                    notes: '',
                                  });
                                  setSelectedEquipmentForTerm(equipment);
                                  setIsTermDialogOpen(true);
                                } else {
                                  toast({
                                    title: "Equipamento indisponível",
                                    description: "O equipamento não está disponível para um novo termo.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              title="Duplicar Termo (mesmo responsável)"
                              data-testid={`button-copy-term-${term.id}`}
                            >
                              <Copy className="h-4 w-4 text-indigo-600" />
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

      {/* Aba de Colaboradores com Equipamentos */}
      {activeTab === 'collaborators' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Colaboradores com Equipamentos
              </CardTitle>
              <CardDescription>
                Visualização consolidada de todos os colaboradores que possuem equipamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <CollaboratorsWithEquipmentTable />
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
                    name="ownership_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Propriedade</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione se é próprio ou alugado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(ownershipTypeLabels).map(([value, label]) => (
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

      {/* Dialog para Visualizar Termo */}
      <Dialog open={isViewTermDialogOpen} onOpenChange={setIsViewTermDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Termo de Responsabilidade</DialogTitle>
            <DialogDescription>
              Visualização do termo ativo para: {selectedTermToView?.equipment_name}
            </DialogDescription>
          </DialogHeader>

          {selectedTermToView && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Equipamento</Label>
                  <p className="text-sm">{selectedTermToView.equipment_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Marca/Modelo</Label>
                  <p className="text-sm">{selectedTermToView.equipment_brand || 'N/A'} {selectedTermToView.equipment_model || ''}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Número de Série</Label>
                  <p className="text-sm">{selectedTermToView.equipment_serial || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Número do Patrimônio</Label>
                  <p className="text-sm">{selectedTermToView.equipment_patrimony || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Responsável</Label>
                  <p className="text-sm">{selectedTermToView.full_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">CPF</Label>
                  <p className="text-sm">{selectedTermToView.cpf}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Departamento</Label>
                  <p className="text-sm">{selectedTermToView.department}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Cargo</Label>
                  <p className="text-sm">{selectedTermToView.position || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Data de Entrega</Label>
                  <p className="text-sm">
                    {selectedTermToView.delivered_at 
                      ? new Date(selectedTermToView.delivered_at).toLocaleDateString('pt-BR')
                      : new Date(selectedTermToView.created_at).toLocaleDateString('pt-BR')
                    }
                  </p>
                </div>
              </div>

              {selectedTermToView.address && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Endereço</Label>
                  <p className="text-sm">{selectedTermToView.address}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsViewTermDialogOpen(false)}>
                  Fechar
                </Button>
                <Button onClick={() => {
                  if (selectedTermToView) {
                    const termData = {
                      full_name: selectedTermToView.full_name,
                      cpf: selectedTermToView.cpf,
                      phone: selectedTermToView.phone || '',
                      department: selectedTermToView.department,
                      address: selectedTermToView.address || '',
                      position: selectedTermToView.position || '',
                      condition_at_assignment: selectedTermToView.condition_at_assignment,
                      notes: selectedTermToView.notes || ''
                    };
                    const equipment = {
                      name: selectedTermToView.equipment_name,
                      type: selectedTermToView.equipment_type,
                      brand: selectedTermToView.equipment_brand || '',
                      model: selectedTermToView.equipment_model || '',
                      serial_number: selectedTermToView.equipment_serial || '',
                      patrimony_number: selectedTermToView.equipment_patrimony || ''
                    };
                    handleDownloadTerm(termData, equipment);
                  }
                }}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para Registrar Devolução */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Devolução do Equipamento</DialogTitle>
            <DialogDescription>
              Registre a devolução do equipamento: {selectedEquipmentForReturn?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedTermToView ? (
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">
                  <strong>Responsável:</strong> {selectedTermToView.full_name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Departamento:</strong> {selectedTermToView.department}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Data de Entrega:</strong> {
                    selectedTermToView.delivered_at 
                      ? new Date(selectedTermToView.delivered_at).toLocaleDateString('pt-BR')
                      : new Date(selectedTermToView.created_at).toLocaleDateString('pt-BR')
                  }
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Aviso:</strong> Este equipamento não possui termo de responsabilidade ativo. 
                  A devolução irá apenas atualizar o status para "Disponível".
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="condition_at_return">Condição do Equipamento na Devolução</Label>
              <select 
                id="condition_at_return" 
                className="w-full p-2 border rounded-md"
                defaultValue="otimo"
              >
                <option value="novo">Novo</option>
                <option value="otimo">Ótimo</option>
                <option value="bom">Bom</option>
                <option value="regular">Regular</option>
                <option value="ruim">Ruim</option>
                <option value="quebrado">Quebrado</option>
              </select>
            </div>

            <div>
              <Label htmlFor="return_notes">Observações (opcional)</Label>
              <textarea 
                id="return_notes"
                className="w-full p-2 border rounded-md"
                rows={3}
                placeholder="Observações sobre a devolução do equipamento..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsReturnDialogOpen(false)} disabled={isProcessingReturn}>
                Cancelar
              </Button>
              <Button 
                onClick={async () => {
                  if (!selectedEquipmentForReturn || isProcessingReturn) return;
                  
                  setIsProcessingReturn(true);
                  
                  try {
                    const conditionSelect = document.getElementById('condition_at_return') as HTMLSelectElement;
                    const notesTextarea = document.getElementById('return_notes') as HTMLTextAreaElement;
                    
                    if (selectedTermToView) {
                      // Se houver termo, registra devolução completa
                      const response = await apiRequest('PUT', `/api/equipment/equipment-responsibility-terms/${selectedTermToView.id}/return`, {
                        condition_at_return: conditionSelect.value,
                        notes: notesTextarea.value || null,
                      });

                      const data = await response.json();
                      
                      if (data.success) {
                        toast({
                          title: "Devolução registrada",
                          description: "O equipamento foi marcado como devolvido com sucesso!",
                        });
                        
                        // Forçar atualização
                        setForceRefreshKey(prev => prev + 1);
                        queryClient.clear();
                        
                        setIsReturnDialogOpen(false);
                        setIsProcessingReturn(false);
                      }
                    } else {
                      // Se não houver termo, apenas atualiza status do equipamento para disponível
                      console.log('🔄 [SIMPLE-RETURN] Devolução simplificada (sem termo)');
                      console.log('📋 [SIMPLE-RETURN] Equipment ID:', selectedEquipmentForReturn.id);
                      console.log('📋 [SIMPLE-RETURN] Novo status: disponivel');
                      console.log('📋 [SIMPLE-RETURN] Condição:', conditionSelect.value);
                      
                      const updateData = {
                        ...selectedEquipmentForReturn,
                        status: 'disponivel',
                        condition: conditionSelect.value,
                      };
                      
                      console.log('📤 [SIMPLE-RETURN] Enviando PUT:', updateData);
                      
                      const response = await apiRequest('PUT', `/api/equipment/${selectedEquipmentForReturn.id}`, updateData);
                      
                      console.log('📥 [SIMPLE-RETURN] Response status:', response.status);
                      
                      if (response.ok) {
                        const data = await response.json();
                        console.log('✅ [SIMPLE-RETURN] Resposta:', data);
                        
                        toast({
                          title: "Equipamento devolvido",
                          description: "O equipamento foi marcado como disponível!",
                        });
                        
                        // Forçar atualização
                        setForceRefreshKey(prev => prev + 1);
                        queryClient.clear();
                        
                        setIsReturnDialogOpen(false);
                        setIsProcessingReturn(false);
                      } else {
                        const data = await response.json();
                        console.error('❌ [SIMPLE-RETURN] Erro na resposta:', data);
                        throw new Error(data.message || "Erro ao devolver equipamento");
                      }
                    }
                  } catch (error) {
                    console.error('Erro ao registrar devolução:', error);
                    toast({
                      title: "Erro",
                      description: "Erro ao registrar devolução do equipamento.",
                      variant: "destructive",
                    });
                    setIsProcessingReturn(false);
                  }
                }}
                disabled={isProcessingReturn}
              >
                {isProcessingReturn ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-white"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar Devolução
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para compartilhar link de solicitação */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share className="h-5 w-5" />
              Link para Solicitação de Equipamentos
            </DialogTitle>
            <DialogDescription>
              Compartilhe este link com sua equipe para que possam solicitar equipamentos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Link para compartilhar:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={`${window.location.origin}/equipment/request`}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/equipment/request`);
                    toast({
                      title: "Link copiado!",
                      description: "O link foi copiado para a área de transferência",
                    });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>📱 <strong>Como usar:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Envie este link para sua equipe via WhatsApp, email ou Slack</li>
                <li>Colaboradores podem preencher o formulário diretamente</li>
                <li>Solicitações aparecerão na aba "Gerenciar Solicitações"</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsShareDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente para tabela de colaboradores com equipamentos
function CollaboratorsWithEquipmentTable() {
  const { data: collaborators, isLoading, error } = useQuery({
    queryKey: ['/api/equipment/collaborators'],
    queryFn: () => apiRequest('GET', '/api/equipment/collaborators')
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Carregando colaboradores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Erro ao carregar colaboradores com equipamentos</p>
      </div>
    );
  }

  const collaboratorsList = collaborators?.data || [];

  if (collaboratorsList.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Nenhum colaborador com equipamentos encontrado</p>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b bg-gray-50">
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Nome</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">CPF</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Telefone</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Projeto</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Base</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Equipamentos</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Tipos</th>
        </tr>
      </thead>
      <tbody>
        {collaboratorsList.map((collaborator, index) => (
          <tr key={collaborator.cpf} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td className="px-4 py-3 text-sm text-gray-900">{collaborator.fullName}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{collaborator.cpf}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{collaborator.phone}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{collaborator.project || '-'}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{collaborator.base || '-'}</td>
            <td className="px-4 py-3 text-sm text-center">
              <Badge variant="secondary">{collaborator.equipmentCount}</Badge>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">{collaborator.equipmentTypes}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}