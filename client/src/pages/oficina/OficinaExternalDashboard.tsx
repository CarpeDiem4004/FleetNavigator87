import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Car, 
  Plus, 
  FileText, 
  CheckCircle, 
  Clock, 
  Wrench, 
  AlertTriangle,
  User,
  Calendar,
  Settings,
  Edit,
  X,
  Eye,
  Download,
  Package2,
  Trash2
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface WorkshopData {
  id: number;
  name: string;
  cnpj: string;
  email: string;
  telefone: string;
}



interface MaintenanceRequest {
  id: number;
  vehiclePlate: string;
  description: string;
  status: string;
  priority: string;
  entryDate: string;
  customerName?: string;
}

interface CarReception {
  id: number;
  vehiclePlate: string;
  vehicleModel: string;
  serviceDescription: string;
  status: string;
  created_at: string;
  workshopId: number;
}

interface Part {
  id: string;
  name: string;
  price: number;
}

export default function OficinaExternalDashboard() {
  const [workshopData, setWorkshopData] = useState<WorkshopData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [carReceptions, setCarReceptions] = useState<CarReception[]>([]);
  // Estado isNewOSOpen removido - Apenas sistema principal pode criar OS

  // Estado osFormData removido - Apenas sistema principal pode criar OS
  const [editingOrder, setEditingOrder] = useState<MaintenanceRequest | null>(null);
  const [editForm, setEditForm] = useState({
    status: '',
    data_previsao_entrega: '',
    valor_mao_obra: '',
    valor_total_pecas: '',
    observacoes_oficina: '',
    km_veiculo: '',
    placa: '',
    modelo: '',
    descricao_servico: '',
    entrega_nome: '',
    entrega_cpf: '',
    entrega_telefone: ''
  });
  const [editingReception, setEditingReception] = useState<CarReception | null>(null);
  const [receptionEditForm, setReceptionEditForm] = useState({
    status: '',
    deliveryDeadline: '',
    laborCost: '',
    partsCost: '',
    notes: '',
    currentKm: '',
    replacedParts: ''
  });
  const [isCarFormOpen, setIsCarFormOpen] = useState(false);
  const [carFormData, setCarFormData] = useState({
    vehiclePlate: '',
    vehicleModel: '',
    vehicleType: 'carro',
    currentKm: '',
    baseId: '',
    projectId: '',
    serviceDescription: '',
    replacedParts: '',
    laborCost: '',
    partsCost: '',
    deliveryDeadline: '',
    status: 'recebido',
    notes: '',
    deliveryPersonName: '',
    deliveryPersonCpf: '',
    deliveryPersonPhone: ''
  });
  const [parts, setParts] = useState<Part[]>([]);
  const [newPartName, setNewPartName] = useState('');
  const [newPartPrice, setNewPartPrice] = useState('');

  // Função para formatar valores em moeda brasileira
  const formatCurrency = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');
    
    // Se vazio, retorna vazio
    if (!numbers) return '';
    
    // Converte para número e divide por 100 para ter centavos
    const amount = parseInt(numbers) / 100;
    
    // Formata como moeda brasileira
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Função para converter valor formatado de volta para número
  const parseCurrency = (value: string) => {
    if (!value) return 0;
    // Remove R$, espaços e pontos, substitui vírgula por ponto
    const cleanValue = value.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  };
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectBases, setSelectedProjectBases] = useState<any[]>([]);
  
  // Estados para modal de visualização detalhada
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [selectedReceptionDetails, setSelectedReceptionDetails] = useState<CarReception | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let token = urlParams.get('token');
    
    // Tentar obter token da URL também (formato /oficina/:token)
    if (!token) {
      const pathParts = window.location.pathname.split('/');
      if (pathParts[1] === 'oficina' && pathParts[2] && pathParts[2] !== 'external') {
        token = pathParts[2];
      }
    }
    
    if (!token) {
      setError('Token de acesso obrigatório. Use o link fornecido pela oficina.');
      setIsLoading(false);
      return;
    }

    validateTokenAndLoadData(token);
    loadProjects();
  }, []);

  const validateTokenAndLoadData = async (token: string) => {
    try {
      // Validar token e obter dados da oficina
      const response = await fetch(`/api/workshops/validate-token?token=${token}`);
      const data = await response.json();
      
      if (data.success) {
        setWorkshopData(data.workshop);
        await loadWorkshopData(data.workshop.id, token);
      } else {
        setError(data.message || 'Token inválido');
      }
    } catch (err) {
      setError('Erro ao validar token');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorkshopData = async (workshopId: number, token: string) => {
    try {
      // Carregar solicitações de manutenção
      const maintenanceResponse = await fetch(`/api/maintenance/workshop/${workshopId}/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (maintenanceResponse.ok) {
        const maintenanceData = await maintenanceResponse.json();
        setMaintenanceRequests(maintenanceData.requests || []);
      }

      // Carregar recepções de carros com token externo
      const receptionResponse = await fetch(`/api/oficina/car-receptions?token=${token}`);
      if (receptionResponse.ok) {
        const receptionData = await receptionResponse.json();
        console.log('Dados de recepção recebidos:', receptionData);
        // A API retorna um array diretamente, não um objeto com propriedade receptions
        setCarReceptions(Array.isArray(receptionData) ? receptionData : []);
      }
    } catch (err) {
      console.error('Erro ao carregar dados da oficina:', err);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects-with-bases');
      if (response.ok) {
        const data = await response.json();
        console.log('Projetos carregados:', data);
        setProjects(data.data || data.projects || []);
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    }
  };

  const handleProjectChange = (projectId: string) => {
    console.log('Mudança de projeto para ID:', projectId);
    console.log('Projetos disponíveis:', projects);
    
    setCarFormData(prev => ({ ...prev, projectId, baseId: '' }));
    const selectedProject = projects.find(p => p.id.toString() === projectId);
    
    console.log('Projeto selecionado:', selectedProject);
    console.log('Bases do projeto:', selectedProject?.bases);
    
    setSelectedProjectBases(selectedProject?.bases || []);
  };

  const addPart = () => {
    if (newPartName.trim() && newPartPrice.trim()) {
      const numericPrice = parseFloat(newPartPrice) || 0;
      const newPart: Part = {
        id: Date.now().toString(),
        name: newPartName.trim(),
        price: numericPrice
      };
      setParts([...parts, newPart]);
      setNewPartName('');
      setNewPartPrice('');
    }
  };

  const removePart = (partId: string) => {
    setParts(parts.filter(part => part.id !== partId));
  };

  const calculateTotalParts = () => {
    return parts.reduce((total, part) => total + part.price, 0);
  };

  const calculateTotalEstimated = () => {
    const laborCost = parseFloat(carFormData.laborCost) || 0;
    const totalParts = calculateTotalParts();
    return laborCost + totalParts;
  };

  // Função para formatar valores para exibição em moeda brasileira
  const formatDisplayCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const handleCarSubmit = async () => {
    try {
      // Validações específicas para entrega
      if (carFormData.status === 'entregue') {
        if (!carFormData.deliveryPersonName.trim()) {
          toast({
            title: "Erro",
            description: "Nome da pessoa que retira o veículo é obrigatório para status 'Entregue'",
            variant: "destructive",
          });
          return;
        }
        if (!carFormData.deliveryPersonCpf.trim()) {
          toast({
            title: "Erro",
            description: "CPF da pessoa que retira o veículo é obrigatório para status 'Entregue'",
            variant: "destructive",
          });
          return;
        }
        if (!carFormData.deliveryPersonPhone.trim()) {
          toast({
            title: "Erro",
            description: "Telefone da pessoa que retira o veículo é obrigatório para status 'Entregue'",
            variant: "destructive",
          });
          return;
        }
      }

      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      const carData = {
        ...carFormData,
        currentKm: parseInt(carFormData.currentKm) || 0,
        baseId: parseInt(carFormData.baseId) || null,
        projectId: parseInt(carFormData.projectId) || null,
        laborCost: parseCurrency(carFormData.laborCost) || 0,
        partsCost: calculateTotalParts(),
        workshopId: workshopData?.id,
        replacedParts: JSON.stringify(parts),
        // Incluir dados da pessoa que retira apenas se status for entregue
        deliveryPersonName: carFormData.status === 'entregue' ? carFormData.deliveryPersonName : null,
        deliveryPersonCpf: carFormData.status === 'entregue' ? carFormData.deliveryPersonCpf : null,
        deliveryPersonPhone: carFormData.status === 'entregue' ? carFormData.deliveryPersonPhone : null,
        deliveredDate: carFormData.status === 'entregue' ? new Date().toISOString() : null
      };

      // Se estamos editando, usar PUT, senão POST
      const isEditing = editingReception !== null;
      const url = isEditing 
        ? `/api/oficina/car-receptions/${editingReception.id}?token=${token}`
        : `/api/oficina/car-receptions?token=${token}`;
      const method = isEditing ? 'PUT' : 'POST';

      console.log('Enviando dados para:', url);
      console.log('Método:', method);
      console.log('Dados do veículo:', carData);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(carData),
      });

      console.log('Resposta da API - Status:', response.status);
      console.log('Resposta da API - Headers:', response.headers);

      if (response.ok) {
        setIsCarFormOpen(false);
        setEditingReception(null);
        setCarFormData({
          vehiclePlate: '',
          vehicleModel: '',
          vehicleType: 'carro',
          currentKm: '',
          baseId: '',
          projectId: '',
          serviceDescription: '',
          replacedParts: '',
          laborCost: '',
          partsCost: '',
          deliveryDeadline: '',
          status: 'recebido',
          notes: '',
          deliveryPersonName: '',
          deliveryPersonCpf: '',
          deliveryPersonPhone: ''
        });
        setParts([]);
        
        // Recarregar dados
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token && workshopData) {
          await loadWorkshopData(workshopData.id, token);
        }
        
        toast({
          title: "Sucesso",
          description: isEditing ? "Recepção atualizada com sucesso!" : "Veículo recebido com sucesso!",
        });
      } else {
        const errorText = await response.text();
        console.error('Erro da API (texto):', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }
        
        const errorMessage = errorData.error || errorData.message || `Erro HTTP ${response.status}`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Erro ao processar veículo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Detalhes do erro:', errorMessage);
      
      toast({
        title: "Erro",
        description: `Erro ao processar veículo: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleReceiveCar = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      if (!token || !workshopData) {
        toast({
          title: "Erro",
          description: "Token de acesso não encontrado",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/oficina/receive-car', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workshopId: workshopData.id,
          ...carFormData,
          currentKm: parseInt(carFormData.currentKm) || 0,
          projectId: parseInt(carFormData.projectId) || null,
          baseId: parseInt(carFormData.baseId) || null
        })
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Veículo recebido com sucesso!",
        });
        setIsReceiveCarOpen(false);
        setCarFormData({
          vehiclePlate: '',
          vehicleModel: '',
          vehicleType: '',
          currentKm: '',
          serviceDescription: '',
          priority: 'media',
          projectId: '',
          baseId: ''
        });
        setSelectedProjectBases([]);
        // Recarregar dados
        await loadWorkshopData(workshopData.id, token);
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.message || "Erro ao receber veículo",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro de conexão",
        variant: "destructive",
      });
    }
  };

  // Função handleCreateOS removida - Apenas sistema principal pode criar OS

  const handleEditOrder = (order: MaintenanceRequest) => {
    setEditingOrder(order);
    setEditForm({
      status: order.status || '',
      data_previsao_entrega: order.estimatedCompletion ? new Date(order.estimatedCompletion).toISOString().split('T')[0] : '',
      valor_mao_obra: (order as any).valor_mao_obra?.toString() || '',
      valor_total_pecas: (order as any).valor_total_pecas?.toString() || '',
      observacoes_oficina: (order as any).observacoes_oficina || '',
      km_veiculo: (order as any).currentKm?.toString() || '',
      placa: order.vehiclePlate || '',
      modelo: (order as any).vehicleModel || '',
      descricao_servico: order.description || '',
      entrega_nome: (order as any).deliveryPersonName || '',
      entrega_cpf: (order as any).deliveryPersonCpf || '',
      entrega_telefone: (order as any).deliveryPersonPhone || ''
    });
    
    // Carregar peças existentes se houver
    if ((order as any).replacedParts) {
      try {
        const existingParts = JSON.parse((order as any).replacedParts);
        if (Array.isArray(existingParts)) {
          setParts(existingParts.map((part: any) => ({
            id: part.id || Date.now().toString(),
            name: part.name || part.nome,
            price: typeof part.price === 'number' ? part.price : parseFloat(part.price || part.valor || '0')
          })));
        }
      } catch (e) {
        console.error('Erro ao carregar peças existentes:', e);
        setParts([]);
      }
    } else {
      setParts([]);
    }
  };

  const updateMaintenanceOrder = async () => {
    if (!editingOrder || !workshopData) return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      // Calcular total das peças
      const totalParts = parts.reduce((sum, part) => sum + part.price, 0);
      const laborCost = parseFloat(editForm.valor_mao_obra) || 0;
      const totalCost = laborCost + totalParts;
      
      console.log('Atualizando ordem de serviço:', {
        orderId: editingOrder.id,
        workshopId: workshopData.id,
        token: token ? 'presente' : 'ausente',
        formData: editForm,
        parts: parts,
        totalParts,
        laborCost,
        totalCost
      });

      const response = await fetch(`/api/workshop/${workshopData.id}/orders/${editingOrder.id}?token=${token}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: editForm.status || undefined,
          notes: editForm.observacoes_oficina || undefined,
          actualCost: totalCost > 0 ? totalCost : undefined,
          laborCost: laborCost > 0 ? laborCost : undefined,
          partsCost: totalParts > 0 ? totalParts : undefined,
          replacedParts: parts.length > 0 ? JSON.stringify(parts) : undefined,
          currentKm: editForm.km_veiculo ? parseInt(editForm.km_veiculo) : undefined,
          estimatedCompletion: editForm.data_previsao_entrega || undefined,
          completionDate: editForm.status === 'concluida' || editForm.status === 'entregue' ? new Date().toISOString() : undefined,
          deliveryPersonName: editForm.entrega_nome || undefined,
          deliveryPersonCpf: editForm.entrega_cpf || undefined,
          deliveryPersonPhone: editForm.entrega_telefone || undefined
        }),
      });

      console.log('Resposta da atualização:', response.status);

      if (response.ok) {
        setEditingOrder(null);
        setParts([]); // Limpar peças após salvar
        await loadWorkshopData(workshopData.id, token);
        toast({
          title: "Sucesso",
          description: "Ordem de serviço atualizada com sucesso!",
        });
      } else {
        const errorData = await response.json();
        console.error('Erro da API:', errorData);
        throw new Error(errorData.message || errorData.error || 'Erro ao atualizar ordem');
      }
    } catch (error) {
      console.error('Erro ao atualizar ordem:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar ordem de serviço",
        variant: "destructive",
      });
    }
  };

  // Função para abrir modal de detalhes
  const openDetailView = (reception: CarReception) => {
    setSelectedReceptionDetails(reception);
    setIsDetailViewOpen(true);
  };

  // Função para gerar PDF dos detalhes do veículo
  const generatePDF = async (reception: CarReception) => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = margin;

      // Título do relatório
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("RELATÓRIO DE MANUTENÇÃO", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Informações da oficina
      if (workshopData) {
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Oficina: ${workshopData.name}`, margin, yPosition);
        yPosition += 7;
        pdf.text(`CNPJ: ${workshopData.cnpj}`, margin, yPosition);
        yPosition += 7;
        pdf.text(`Telefone: ${workshopData.telefone}`, margin, yPosition);
        yPosition += 10;
      }

      // Linha separadora
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;

      // Dados do veículo
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("DADOS DO VEÍCULO", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Placa: ${reception.vehiclePlate}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Modelo: ${reception.vehicleModel}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Tipo: ${reception.vehicleType || 'N/A'}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Quilometragem: ${reception.currentKm?.toLocaleString() || 'N/A'} km`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Projeto: ${reception.projectName || 'N/A'}`, margin, yPosition);
      yPosition += 10;

      // Dados do serviço
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("DADOS DO SERVIÇO", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Status: ${reception.status}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Prioridade: ${reception.priority || 'N/A'}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Data de Recebimento: ${new Date(reception.created_at).toLocaleDateString('pt-BR')}`, margin, yPosition);
      yPosition += 7;
      
      if (reception.deliveryDeadline) {
        pdf.text(`Prazo de Entrega: ${new Date(reception.deliveryDeadline).toLocaleDateString('pt-BR')}`, margin, yPosition);
        yPosition += 7;
      }

      if (reception.deliveredDate) {
        pdf.text(`Data de Entrega: ${new Date(reception.deliveredDate).toLocaleDateString('pt-BR')}`, margin, yPosition);
        yPosition += 7;
      }

      yPosition += 5;

      // Descrição do serviço
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("DESCRIÇÃO DO SERVIÇO", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      const descriptionLines = pdf.splitTextToSize(reception.serviceDescription || 'N/A', pageWidth - 2 * margin);
      pdf.text(descriptionLines, margin, yPosition);
      yPosition += descriptionLines.length * 7 + 10;

      // Peças substituídas
      if (reception.replacedParts) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("PEÇAS SUBSTITUÍDAS", margin, yPosition);
        yPosition += 10;

        try {
          const parts = JSON.parse(reception.replacedParts);
          if (Array.isArray(parts) && parts.length > 0) {
            pdf.setFontSize(11);
            pdf.setFont("helvetica", "normal");
            parts.forEach((part: any, index: number) => {
              pdf.text(`${index + 1}. ${part.name || part.item} - R$ ${(part.price || part.valor || 0).toFixed(2)}`, margin, yPosition);
              yPosition += 7;
            });
          } else {
            pdf.text("Nenhuma peça substituída", margin, yPosition);
            yPosition += 7;
          }
        } catch (error) {
          pdf.text("Erro ao processar peças substituídas", margin, yPosition);
          yPosition += 7;
        }
        yPosition += 10;
      }

      // Custos
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("CUSTOS", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Custo de Peças: R$ ${Number(reception.partsCost || 0).toFixed(2)}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Custo de Mão de Obra: R$ ${Number(reception.laborCost || 0).toFixed(2)}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Total: R$ ${Number(reception.totalCost || 0).toFixed(2)}`, margin, yPosition);
      yPosition += 10;

      // Observações
      if (reception.notes) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("OBSERVAÇÕES", margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        const notesLines = pdf.splitTextToSize(reception.notes, pageWidth - 2 * margin);
        pdf.text(notesLines, margin, yPosition);
        yPosition += notesLines.length * 7 + 10;
      }

      // Dados da entrega (se disponível)
      if (reception.deliveryPersonName) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("DADOS DA ENTREGA", margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Recebido por: ${reception.deliveryPersonName}`, margin, yPosition);
        yPosition += 7;
        pdf.text(`CPF: ${reception.deliveryPersonCpf || 'N/A'}`, margin, yPosition);
        yPosition += 7;
        pdf.text(`Telefone: ${reception.deliveryPersonPhone || 'N/A'}`, margin, yPosition);
        yPosition += 7;
      }

      // Rodapé
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, pdf.internal.pageSize.getHeight() - 10);

      // Salvar o PDF
      pdf.save(`relatorio_manutencao_${reception.vehiclePlate}_${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: "PDF gerado",
        description: "Relatório gerado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório PDF",
        variant: "destructive"
      });
    }
  };

  const handleEditReception = (reception: CarReception) => {
    setEditingReception(reception);
    setReceptionEditForm({
      status: reception.status || '',
      deliveryDeadline: reception.deliveryDeadline ? new Date(reception.deliveryDeadline).toISOString().split('T')[0] : '',
      laborCost: reception.laborCost?.toString() || '',
      partsCost: reception.partsCost?.toString() || '',
      notes: reception.notes || '',
      currentKm: reception.currentKm?.toString() || '',
      replacedParts: reception.replacedParts || ''
    });
  };

  const updateCarReception = async () => {
    if (!editingReception) return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      let token = urlParams.get('token');
      
      // Tentar obter token da URL também (formato /oficina/:token)
      if (!token) {
        const pathParts = window.location.pathname.split('/');
        if (pathParts[1] === 'oficina' && pathParts[2] && pathParts[2] !== 'external') {
          token = pathParts[2];
        }
      }

      const response = await fetch(`/api/oficina/car-receptions/${editingReception.id}?token=${token}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: receptionEditForm.status || undefined,
          deliveryDeadline: receptionEditForm.deliveryDeadline || undefined,
          laborCost: receptionEditForm.laborCost ? parseFloat(receptionEditForm.laborCost) : undefined,
          partsCost: receptionEditForm.partsCost ? parseFloat(receptionEditForm.partsCost) : undefined,
          notes: receptionEditForm.notes || undefined,
          currentKm: receptionEditForm.currentKm ? parseInt(receptionEditForm.currentKm) : undefined,
          replacedParts: receptionEditForm.replacedParts || undefined
        }),
      });

      console.log('Resposta da atualização - Status:', response.status);

      if (response.ok) {
        setEditingReception(null);
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token && workshopData) {
          await loadWorkshopData(workshopData.id, token);
        }
        toast({
          title: "Sucesso",
          description: "Recepção de veículo atualizada com sucesso!",
        });
      } else {
        const errorText = await response.text();
        console.error('Erro da API na atualização (texto):', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }
        
        const errorMessage = errorData.error || errorData.message || `Erro HTTP ${response.status}`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Erro ao atualizar recepção:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar recepção de veículo",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-lg">Validando acesso...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Acesso Negado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <p className="text-muted-foreground mt-2">
              Verifique se o link está correto ou entre em contato com o administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Combinar dados de solicitações de manutenção e recepções de carros
  const allRequests = [
    ...maintenanceRequests,
    ...carReceptions.map(reception => ({
      ...reception,
      vehiclePlate: reception.vehiclePlate,
      description: reception.serviceDescription,
      status: reception.status,
      priority: 'media',
      entryDate: reception.created_at
    }))
  ];

  const pendingRequests = allRequests.filter(r => r.status === 'pendente' || r.status === 'recebido');
  const inProgressRequests = allRequests.filter(r => r.status === 'em_andamento' || r.status === 'em_reparo');
  const completedRequests = allRequests.filter(r => r.status === 'concluida' || r.status === 'entregue');

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard - {workshopData?.name}</h1>
            <p className="text-muted-foreground">
              Sistema de Gestão de Manutenção - CNPJ: {workshopData?.cnpj}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Oficina Externa
            </Badge>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-6 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Car className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Carros Recebidos</p>
                <p className="text-2xl font-bold">{carReceptions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">OS Pendentes</p>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <Wrench className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold">{inProgressRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold">{completedRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesso rápido às principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {/* Botão Receber Veículo */}
              <Button 
                onClick={() => window.location.href = `/maintenance/car-reception?external=true&token=${new URLSearchParams(window.location.search).get('token')}`}
                className="flex items-center gap-2 h-auto p-4 justify-start bg-green-600 hover:bg-green-700"
              >
                <Car className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium text-white">Receber Veículo</p>
                  <p className="text-sm opacity-80 text-white">Registrar entrada de veículo</p>
                </div>
              </Button>

              {/* Botão Nova OS - REMOVIDO: Apenas sistema principal pode criar OS */}
              
              {/* Botão Finalizar Serviço */}
              <Button variant="outline" className="flex items-center gap-2 h-auto p-4 justify-start">
                <CheckCircle className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Finalizar Serviço</p>
                  <p className="text-sm opacity-80">Concluir manutenção</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seções Principais */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recepção de Veículos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Recepção de Veículos
              </CardTitle>
              <Button 
                size="sm" 
                onClick={() => window.location.href = `/maintenance/car-reception?external=true&token=${new URLSearchParams(window.location.search).get('token')}`}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Receber Veículo
              </Button>
            </div>
            <CardDescription>
              Veículos recebidos para manutenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {carReceptions.length === 0 ? (
                <div className="text-center py-6">
                  <Car className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhum veículo recebido hoje</p>
                  <Button size="sm" className="mt-2">
                    Receber Primeiro Veículo
                  </Button>
                </div>
              ) : (
                <>
                  {carReceptions.slice(0, 3).map((reception) => (
                    <div key={reception.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{reception.vehiclePlate}</p>
                          <div className="flex items-center space-x-2">
                            {/* Botão Ver Detalhes - sempre disponível */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDetailView(reception)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver Detalhes
                            </Button>
                            
                            {/* Botão Imprimir PDF - sempre disponível */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generatePDF(reception)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Imprimir PDF
                            </Button>
                            
                            {/* Botão de Edição disponível apenas quando não está entregue */}
                            {reception.status !== "entregue" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingReception(reception);
                                  setCarFormData({
                                    vehiclePlate: reception.vehiclePlate,
                                    vehicleModel: reception.vehicleModel,
                                    vehicleType: (reception as any).vehicleType || 'carro',
                                    currentKm: (reception as any).currentKm?.toString() || '',
                                    baseId: (reception as any).baseId?.toString() || '',
                                    projectId: (reception as any).projectId?.toString() || '',
                                    serviceDescription: reception.serviceDescription,
                                    replacedParts: (reception as any).replacedParts || '',
                                    laborCost: (reception as any).laborCost ? formatCurrency(((reception as any).laborCost * 100).toString()) : '',
                                    partsCost: (reception as any).partsCost?.toString() || '',
                                    deliveryDeadline: (reception as any).deliveryDeadline ? new Date((reception as any).deliveryDeadline).toISOString().split('T')[0] : '',
                                    status: reception.status || 'recebido',
                                    notes: (reception as any).notes || '',
                                    deliveryPersonName: (reception as any).deliveryPersonName || '',
                                    deliveryPersonCpf: (reception as any).deliveryPersonCpf || '',
                                    deliveryPersonPhone: (reception as any).deliveryPersonPhone || ''
                                  });
                                  
                                  // Carregar bases do projeto selecionado
                                  if ((reception as any).projectId) {
                                    console.log('Projeto selecionado ID:', (reception as any).projectId);
                                    console.log('Projetos disponíveis:', projects);
                                    const selectedProject = projects.find(p => p.id.toString() === (reception as any).projectId?.toString());
                                    console.log('Projeto encontrado:', selectedProject);
                                    setSelectedProjectBases(selectedProject?.bases || []);
                                    console.log('Bases carregadas:', selectedProject?.bases || []);
                                  }
                                  // Carregar peças existentes
                                  try {
                                    const existingParts = JSON.parse((reception as any).replacedParts || '[]');
                                    setParts(Array.isArray(existingParts) ? existingParts : []);
                                  } catch (e) {
                                    setParts([]);
                                  }
                                  // Carregar projeto/base selecionados
                                  if ((reception as any).projectId) {
                                    const selectedProject = projects.find(p => p.id.toString() === (reception as any).projectId?.toString());
                                    setSelectedProjectBases(selectedProject?.bases || []);
                                  }
                                  setIsCarFormOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                            )}
                            
                            {/* Indicador de apenas visualização quando entregue */}
                            {reception.status === "entregue" && (
                              <span className="text-xs text-gray-500 italic">
                                Apenas visualização
                              </span>
                            )}
                            <Badge variant="outline">
                              {new Date(reception.created_at).toLocaleDateString('pt-BR')}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{reception.vehicleModel} - {reception.serviceDescription}</p>
                        <p className="text-xs text-muted-foreground mt-1 capitalize">{reception.status}</p>
                      </div>
                    </div>
                  ))}
                  {carReceptions.length > 3 && (
                    <Button variant="outline" size="sm" className="w-full">
                      Ver todos ({carReceptions.length})
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ordens de Serviço */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Ordens de Serviço
              </CardTitle>
              {/* Botão Nova OS removido - Apenas sistema principal pode criar OS */}
            </div>
            <CardDescription>
              Serviços em andamento e pendentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {maintenanceRequests.length === 0 ? (
                <div className="text-center py-6">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhuma OS pendente</p>
                  {/* Botão Criar Nova OS removido - Apenas sistema principal pode criar OS */}
                </div>
              ) : (
                <>
                  {maintenanceRequests.slice(0, 3).map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">OS #{request.id} - {request.vehiclePlate}</p>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditOrder(request)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Badge 
                              variant={
                                request.status === 'concluida' ? 'default' :
                                request.status === 'em_andamento' ? 'secondary' : 'outline'
                              }
                            >
                              {request.status === 'pendente' ? 'Pendente' :
                               request.status === 'em_andamento' ? 'Em Andamento' : 'Concluída'}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{request.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(request.entryDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {maintenanceRequests.length > 3 && (
                    <Button variant="outline" size="sm" className="w-full">
                      Ver todas ({maintenanceRequests.length})
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações da Oficina */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Informações da Oficina
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Razão Social</p>
                <p className="font-medium">{workshopData?.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">CNPJ</p>
                <p className="font-medium">{workshopData?.cnpj}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="font-medium">{workshopData?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para editar ordem de serviço */}
      <Dialog open={!!editingOrder} onOpenChange={() => setEditingOrder(null)}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Ordem de Serviço #{editingOrder?.id}</DialogTitle>
          </DialogHeader>
          
          {editingOrder && (
            <div className="space-y-6">
              {/* Seção 1: Status e Previsão */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="aguardando_pecas">Aguardando Peças</SelectItem>
                      <SelectItem value="concluida">Concluída</SelectItem>
                      <SelectItem value="entregue">Entregue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="data_previsao_entrega">Previsão de Entrega</Label>
                  <Input
                    id="data_previsao_entrega"
                    type="date"
                    value={editForm.data_previsao_entrega}
                    onChange={(e) => setEditForm(prev => ({ ...prev, data_previsao_entrega: e.target.value }))}
                  />
                </div>
              </div>

              {/* Seção 2: Dados do Veículo */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  <h3 className="text-sm font-medium">Dados do Veículo</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="placa">Placa</Label>
                    <Input
                      id="placa"
                      value={editForm.placa || editingOrder.placa}
                      onChange={(e) => setEditForm(prev => ({ ...prev, placa: e.target.value }))}
                      placeholder="ABC-1234"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="modelo">Modelo</Label>
                    <Input
                      id="modelo"
                      value={editForm.modelo || editingOrder.modelo}
                      onChange={(e) => setEditForm(prev => ({ ...prev, modelo: e.target.value }))}
                      placeholder="Ex: Mercedes Sprinter"
                    />
                  </div>

                  <div>
                    <Label htmlFor="km_veiculo">KM Atual</Label>
                    <Input
                      id="km_veiculo"
                      type="number"
                      placeholder="Ex: 45000"
                      value={editForm.km_veiculo}
                      onChange={(e) => setEditForm(prev => ({ ...prev, km_veiculo: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Seção 3: Descrição do Serviço */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <h3 className="text-sm font-medium">Descrição do Serviço</h3>
                </div>
                
                <div>
                  <Label htmlFor="descricao_servico">Descrição Detalhada</Label>
                  <Textarea
                    id="descricao_servico"
                    value={editForm.descricao_servico || editingOrder.descricao_servico}
                    onChange={(e) => setEditForm(prev => ({ ...prev, descricao_servico: e.target.value }))}
                    placeholder="Descreva detalhadamente o serviço realizado..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Seção 4: Peças e Valores */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Package2 className="h-4 w-4" />
                  <h3 className="text-sm font-medium">Peças e Valores</h3>
                </div>
                
                {/* Adicionar Nova Peça */}
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    placeholder="Nome da peça"
                    value={newPartName}
                    onChange={(e) => setNewPartName(e.target.value)}
                    className="col-span-2"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Valor (R$)"
                    value={newPartPrice}
                    onChange={(e) => setNewPartPrice(e.target.value)}
                  />
                  <Button
                    type="button"
                    onClick={addPart}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Adicionar
                  </Button>
                </div>

                {/* Lista de Peças Adicionadas */}
                {parts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">Peças utilizadas:</h4>
                    {parts.map((part) => (
                      <div
                        key={part.id}
                        className="flex items-center justify-between p-2 bg-muted rounded border"
                      >
                        <div className="flex-1">
                          <span className="text-sm font-medium">{part.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-green-600">
                            R$ {part.price.toFixed(2).replace('.', ',')}
                          </span>
                          <Button
                            type="button"
                            onClick={() => removePart(part.id)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-red-100"
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Total das Peças */}
                    <div className="flex justify-end pt-2 border-t">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Total peças: </span>
                        <span className="font-semibold text-green-600">
                          R$ {parts.reduce((sum, part) => sum + part.price, 0).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Custos */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="valor_mao_obra">Valor Mão de Obra (R$)</Label>
                    <Input
                      id="valor_mao_obra"
                      type="number"
                      step="0.01"
                      placeholder="Ex: 150.00"
                      value={editForm.valor_mao_obra}
                      onChange={(e) => setEditForm(prev => ({ ...prev, valor_mao_obra: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>Valor Total Peças (R$)</Label>
                    <div className="h-10 flex items-center justify-start bg-gray-50 border rounded-md px-3">
                      <span className="text-sm text-muted-foreground">
                        R$ {parts.reduce((sum, part) => sum + part.price, 0).toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        (calculado automaticamente)
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label>Total Estimado</Label>
                    <div className="h-10 flex items-center justify-center bg-gray-50 border rounded-md px-3">
                      <span className="font-semibold text-green-600">
                        R$ {(
                          parseFloat(editForm.valor_mao_obra || '0') + 
                          parts.reduce((sum, part) => sum + part.price, 0)
                        ).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 5: Observações */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <h3 className="text-sm font-medium">Observações Adicionais</h3>
                </div>
                
                <div>
                  <Label htmlFor="observacoes_oficina">Observações da Oficina</Label>
                  <Textarea
                    id="observacoes_oficina"
                    placeholder="Observações sobre o serviço, peças utilizadas, condições do veículo, etc..."
                    value={editForm.observacoes_oficina}
                    onChange={(e) => setEditForm(prev => ({ ...prev, observacoes_oficina: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>

              {/* Entrega do Veículo */}
              {editForm.status === 'entregue' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <h3 className="text-sm font-medium">Dados da Entrega</h3>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="entrega_nome">Nome do Responsável</Label>
                      <Input
                        id="entrega_nome"
                        value={editForm.entrega_nome || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, entrega_nome: e.target.value }))}
                        placeholder="Nome completo"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="entrega_cpf">CPF</Label>
                      <Input
                        id="entrega_cpf"
                        value={editForm.entrega_cpf || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, entrega_cpf: e.target.value }))}
                        placeholder="000.000.000-00"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="entrega_telefone">Telefone</Label>
                      <Input
                        id="entrega_telefone"
                        value={editForm.entrega_telefone || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, entrega_telefone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingOrder(null)}>
                  Cancelar
                </Button>
                <Button onClick={updateMaintenanceOrder}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>



      {/* Formulário completo de recepção de veículo */}
      {isCarFormOpen && (
        <Dialog open={isCarFormOpen} onOpenChange={() => {
          setIsCarFormOpen(false);
          setEditingReception(null);
        }}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingReception ? `Editar Recepção - ${editingReception.vehiclePlate}` : 'Receber Veículo para Manutenção'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              {/* Seção 1: Dados do Veículo */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Car className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Dados do Veículo</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plate">Placa do Veículo</Label>
                    <Input
                      id="plate"
                      value={carFormData.vehiclePlate}
                      onChange={(e) => setCarFormData(prev => ({ ...prev, vehiclePlate: e.target.value }))}
                      placeholder="ABC1234"
                      disabled={!!editingReception}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo</Label>
                    <Input
                      id="model"
                      value={carFormData.vehicleModel}
                      onChange={(e) => setCarFormData(prev => ({ ...prev, vehicleModel: e.target.value }))}
                      placeholder="Ex: Mercedes Sprinter"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Veículo</Label>
                    <Select 
                      value={carFormData.vehicleType} 
                      onValueChange={(value) => setCarFormData(prev => ({ ...prev, vehicleType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="carro">Carro</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                        <SelectItem value="caminhao">Caminhão</SelectItem>
                        <SelectItem value="moto">Moto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="km">Quilometragem Atual (km)</Label>
                    <Input
                      id="km"
                      type="number"
                      value={carFormData.currentKm}
                      onChange={(e) => setCarFormData(prev => ({ ...prev, currentKm: e.target.value }))}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="project">Projeto</Label>
                    <Select 
                      value={carFormData.projectId} 
                      onValueChange={handleProjectChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o projeto" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.length > 0 ? projects.map((project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        )) : (
                          <SelectItem value="" disabled>Carregando projetos...</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="base">Base</Label>
                    <Select 
                      value={carFormData.baseId} 
                      onValueChange={(value) => setCarFormData(prev => ({ ...prev, baseId: value }))}
                      disabled={!carFormData.projectId || selectedProjectBases.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !carFormData.projectId 
                            ? "Primeiro selecione um projeto" 
                            : selectedProjectBases.length === 0 
                              ? "Nenhuma base disponível" 
                              : "Selecione uma base"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProjectBases.length > 0 ? selectedProjectBases.map((base) => (
                          <SelectItem key={base.id} value={base.id.toString()}>
                            {base.base_name || base.name}
                          </SelectItem>
                        )) : (
                          <SelectItem value="" disabled>
                            {!carFormData.projectId ? "Primeiro selecione um projeto" : "Nenhuma base disponível"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Seção 2: Serviço e Status */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Settings className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Detalhes do Serviço</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição do Serviço</Label>
                    <Textarea
                      id="description"
                      value={carFormData.serviceDescription}
                      onChange={(e) => setCarFormData(prev => ({ ...prev, serviceDescription: e.target.value }))}
                      rows={3}
                      placeholder="Descreva o que será feito no veículo..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={carFormData.status} 
                      onValueChange={(value) => setCarFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recebido">Recebido</SelectItem>
                        <SelectItem value="em_reparo">Em Reparo</SelectItem>
                        <SelectItem value="pronto">Pronto</SelectItem>
                        <SelectItem value="entregue">Entregue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deadline">Prazo de Entrega</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={carFormData.deliveryDeadline}
                      onChange={(e) => setCarFormData(prev => ({ ...prev, deliveryDeadline: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Seção de dados da pessoa que retira - aparece apenas quando status é "entregue" */}
                {carFormData.status === 'entregue' && (
                  <div className="space-y-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-yellow-600" />
                      <h4 className="text-md font-semibold text-yellow-800">Dados da Pessoa que Retira o Veículo</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="deliveryPersonName">Nome Completo *</Label>
                        <Input
                          id="deliveryPersonName"
                          value={carFormData.deliveryPersonName}
                          onChange={(e) => setCarFormData(prev => ({ ...prev, deliveryPersonName: e.target.value }))}
                          placeholder="Nome completo da pessoa"
                          required={carFormData.status === 'entregue'}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="deliveryPersonCpf">CPF *</Label>
                        <Input
                          id="deliveryPersonCpf"
                          value={carFormData.deliveryPersonCpf}
                          onChange={(e) => {
                            // Formatação básica do CPF
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 11) {
                              value = value.replace(/(\d{3})(\d)/, '$1.$2');
                              value = value.replace(/(\d{3})(\d)/, '$1.$2');
                              value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                            }
                            setCarFormData(prev => ({ ...prev, deliveryPersonCpf: value }));
                          }}
                          placeholder="000.000.000-00"
                          maxLength={14}
                          required={carFormData.status === 'entregue'}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="deliveryPersonPhone">Telefone *</Label>
                        <Input
                          id="deliveryPersonPhone"
                          value={carFormData.deliveryPersonPhone}
                          onChange={(e) => {
                            // Formatação básica do telefone
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 11) {
                              if (value.length <= 10) {
                                value = value.replace(/(\d{2})(\d)/, '($1) $2');
                                value = value.replace(/(\d{4})(\d)/, '$1-$2');
                              } else {
                                value = value.replace(/(\d{2})(\d)/, '($1) $2');
                                value = value.replace(/(\d{5})(\d)/, '$1-$2');
                              }
                            }
                            setCarFormData(prev => ({ ...prev, deliveryPersonPhone: value }));
                          }}
                          placeholder="(11) 99999-9999"
                          maxLength={15}
                          required={carFormData.status === 'entregue'}
                        />
                      </div>
                    </div>
                    
                    <div className="text-sm text-yellow-700">
                      <strong>Atenção:</strong> Estes dados são obrigatórios para registrar a entrega do veículo.
                    </div>
                  </div>
                )}
              </div>

              {/* Seção 3: Peças e Valores */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Wrench className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Peças e Valores</h3>
                </div>
                
                {/* Adicionar nova peça */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
                    <div className="md:col-span-3 space-y-2">
                      <Label className="text-sm font-medium">Nome da Peça</Label>
                      <Input
                        placeholder="Nome da peça"
                        value={newPartName}
                        onChange={(e) => setNewPartName(e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-medium">Valor (R$)</Label>
                      <Input
                        placeholder="R$ 0,00"
                        value={newPartPrice}
                        onChange={(e) => {
                          const formatted = formatCurrency(e.target.value);
                          setNewPartPrice(formatted);
                        }}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Button
                        type="button"
                        onClick={addPart}
                        className="w-full"
                        size="default"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Lista de peças adicionadas */}
                {parts.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">Peças Adicionadas:</h4>
                    <div className="grid gap-2">
                      {parts.map((part, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                          <span className="font-medium">{part.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-semibold text-green-600">{formatDisplayCurrency(parseFloat(part.price))}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePart(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resumo de custos */}
                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="laborCost">Custo Mão de Obra (R$)</Label>
                      <Input
                        id="laborCost"
                        placeholder="R$ 0,00"
                        value={carFormData.laborCost}
                        onChange={(e) => {
                          const formatted = formatCurrency(e.target.value);
                          setCarFormData(prev => ({ ...prev, laborCost: formatted }));
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Custo das Peças</Label>
                      <Input
                        type="text"
                        value={formatDisplayCurrency(calculateTotalParts())}
                        disabled
                        className="bg-gray-100 font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-blue-200">
                    <div className="flex justify-between items-center">
                      <Label className="text-lg font-semibold">Total Estimado</Label>
                      <div className="text-2xl font-bold text-green-600">
                        {formatDisplayCurrency(calculateTotalEstimated())}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 4: Observações */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Observações Adicionais</h3>
                </div>
                
                <div className="space-y-2">
                  <Textarea
                    id="notes"
                    value={carFormData.notes}
                    onChange={(e) => setCarFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                    placeholder="Observações sobre o estado do veículo ou outros detalhes..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => {
                setIsCarFormOpen(false);
                setEditingReception(null);
                setParts([]);
              }}>
                Cancelar
              </Button>
              <Button onClick={handleCarSubmit}>
                {editingReception ? 'Atualizar Recepção' : 'Registrar Veículo'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Modal de Visualização Detalhada */}
      {isDetailViewOpen && selectedReceptionDetails && (
        <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Detalhes da Manutenção - {selectedReceptionDetails.vehiclePlate}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Dados do Veículo */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Dados do Veículo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Placa:</p>
                    <p className="font-medium">{selectedReceptionDetails.vehiclePlate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Modelo:</p>
                    <p className="font-medium">{selectedReceptionDetails.vehicleModel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tipo:</p>
                    <p className="font-medium">{(selectedReceptionDetails as any).vehicleType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Quilometragem:</p>
                    <p className="font-medium">{(selectedReceptionDetails as any).currentKm?.toLocaleString() || 'N/A'} km</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Projeto:</p>
                    <p className="font-medium">{(selectedReceptionDetails as any).projectName || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Dados do Serviço */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Dados do Serviço
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Status:</p>
                    <p className="font-medium capitalize">{selectedReceptionDetails.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Prioridade:</p>
                    <p className="font-medium capitalize">{(selectedReceptionDetails as any).priority || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Data de Recebimento:</p>
                    <p className="font-medium">{new Date(selectedReceptionDetails.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  {(selectedReceptionDetails as any).deliveryDeadline && (
                    <div>
                      <p className="text-sm text-gray-600">Prazo de Entrega:</p>
                      <p className="font-medium">{new Date((selectedReceptionDetails as any).deliveryDeadline).toLocaleDateString('pt-BR')}</p>
                    </div>
                  )}
                  {(selectedReceptionDetails as any).deliveredDate && (
                    <div>
                      <p className="text-sm text-gray-600">Data de Entrega:</p>
                      <p className="font-medium">{new Date((selectedReceptionDetails as any).deliveredDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Descrição do Serviço */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Descrição do Serviço
                </h3>
                <p className="text-gray-700">{selectedReceptionDetails.serviceDescription || 'N/A'}</p>
              </div>

              {/* Peças Substituídas */}
              {(selectedReceptionDetails as any).replacedParts && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Peças Substituídas
                  </h3>
                  <div className="space-y-2">
                    {(() => {
                      try {
                        const parts = JSON.parse((selectedReceptionDetails as any).replacedParts);
                        if (Array.isArray(parts) && parts.length > 0) {
                          return parts.map((part: any, index: number) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-white rounded">
                              <span>{part.name || part.item}</span>
                              <span className="font-medium text-green-600">
                                R$ {(part.price || part.valor || 0).toFixed(2)}
                              </span>
                            </div>
                          ));
                        } else {
                          return <p className="text-gray-600 italic">Nenhuma peça substituída</p>;
                        }
                      } catch (error) {
                        return <p className="text-red-600 italic">Erro ao processar peças substituídas</p>;
                      }
                    })()}
                  </div>
                </div>
              )}

              {/* Custos */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Custos
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Custo de Peças:</span>
                    <span className="font-medium">R$ {Number((selectedReceptionDetails as any).partsCost || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Custo de Mão de Obra:</span>
                    <span className="font-medium">R$ {Number((selectedReceptionDetails as any).laborCost || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span className="text-green-600">R$ {Number((selectedReceptionDetails as any).totalCost || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {(selectedReceptionDetails as any).notes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Observações
                  </h3>
                  <p className="text-gray-700">{(selectedReceptionDetails as any).notes}</p>
                </div>
              )}

              {/* Dados da Entrega */}
              {(selectedReceptionDetails as any).deliveryPersonName && (
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Dados da Entrega
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Recebido por:</p>
                      <p className="font-medium">{(selectedReceptionDetails as any).deliveryPersonName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">CPF:</p>
                      <p className="font-medium">{(selectedReceptionDetails as any).deliveryPersonCpf || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Telefone:</p>
                      <p className="font-medium">{(selectedReceptionDetails as any).deliveryPersonPhone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDetailViewOpen(false)}>
                Fechar
              </Button>
              <Button onClick={() => generatePDF(selectedReceptionDetails)}>
                <Download className="h-4 w-4 mr-2" />
                Imprimir PDF
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Rodapé discreto */}
      <div className="mt-16 pb-8 text-center text-gray-400 text-sm">
        Desenvolvido por Carpe Diem 4004 | suporte 11 970558053
      </div>
    </div>
  );
}