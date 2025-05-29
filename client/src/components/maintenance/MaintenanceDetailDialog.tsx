import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Calendar } from 'lucide-react';
import { DatePicker } from "@/components/ui/date-picker";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";

// Tipo para os componentes trocados
interface ReplacedPart {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface Workshop {
  id: number;
  name: string;
  isActive: boolean;
}

interface Maintenance {
  id: number;
  vehiclePlate: string;
  vehicleModel?: string;
  workshopId: number;
  workshopName?: string; 
  maintenanceType: 'preventiva' | 'corretiva';
  description: string;
  entryDate: string;
  estimatedCompletion?: string;
  completionDate?: string;
  status: 'pendente' | 'aguardando_orcamento' | 'aguardando_peca' | 'em_andamento' | 'concluida' | 'cancelada';
  cost?: number;
  initialBudget?: number;
  requestBaseId: number;
  requestBaseName?: string;
  responsiblePerson?: string;
  priority?: string;
  created_at: string;
  updated_at: string;
  servicePerformed?: string;
  replacedParts?: ReplacedPart[];
}

interface MaintenanceDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  maintenance: Maintenance | null;
  workshops: Workshop[];
  onUpdate: () => void;
}

export default function MaintenanceDetailDialog({
  isOpen,
  onClose,
  maintenance,
  workshops,
  onUpdate
}: MaintenanceDetailDialogProps) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<{
    status: Maintenance['status'];
    workshopId: number;
    servicePerformed: string;
    estimatedCompletion: Date | null;
    completionDate: Date | null;
    cost: string;
    replacedParts: ReplacedPart[];
    // Campos específicos para aguardando_peca
    pendingPartDescription: string;
    pendingPartValue: string;
    pendingPartSupplier: string;
    pendingPartPhone: string;
    pendingPartDeadline: Date | null;
    // Campos para oficina parceira
    usedPartnerWorkshop: boolean;
    partnerWorkshopName: string;
    laborCost: string;
    mechanicName: string;
  }>({
    status: 'pendente',
    workshopId: 0,
    servicePerformed: '',
    estimatedCompletion: null,
    completionDate: null,
    cost: '',
    replacedParts: [],
    // Campos específicos para aguardando_peca
    pendingPartDescription: '',
    pendingPartValue: '',
    pendingPartSupplier: '',
    pendingPartPhone: '',
    pendingPartDeadline: null,
    // Campos para oficina parceira
    usedPartnerWorkshop: false,
    partnerWorkshopName: '',
    laborCost: '',
    mechanicName: ''
  });

  // Tipo para tradução dos status
  const statusLabels: Record<Maintenance['status'], string> = {
    pendente: 'Pendente',
    aguardando_orcamento: 'Aguardando Orçamento',
    aguardando_peca: 'Aguardando Peça',
    em_andamento: 'Em Andamento',
    concluida: 'Concluída',
    cancelada: 'Cancelada'
  };

  // Próximos status disponíveis com base no status atual
  const getNextAvailableStatuses = (currentStatus: Maintenance['status']): Maintenance['status'][] => {
    switch(currentStatus) {
      case 'pendente':
        return ['pendente', 'aguardando_orcamento', 'aguardando_peca', 'cancelada'];
      case 'aguardando_orcamento':
        return ['aguardando_orcamento', 'aguardando_peca', 'em_andamento', 'cancelada'];
      case 'aguardando_peca':
        return ['aguardando_peca', 'em_andamento', 'cancelada'];
      case 'em_andamento':
        return ['em_andamento', 'aguardando_peca', 'concluida', 'cancelada'];
      case 'concluida':
        return ['concluida'];
      case 'cancelada':
        return ['cancelada'];
      default:
        return [];
    }
  };

  // Inicializar o formulário quando o modal for aberto
  useEffect(() => {
    if (maintenance) {
      setFormData({
        status: maintenance.status,
        workshopId: maintenance.workshopId,
        servicePerformed: maintenance.servicePerformed || '',
        estimatedCompletion: maintenance.estimatedCompletion ? new Date(maintenance.estimatedCompletion) : null,
        completionDate: maintenance.completionDate ? new Date(maintenance.completionDate) : null,
        cost: maintenance.cost?.toString() || '',
        replacedParts: maintenance.replacedParts || [],
        // Campos específicos para aguardando_peca
        pendingPartDescription: '',
        pendingPartValue: '',
        pendingPartSupplier: '',
        pendingPartPhone: '',
        pendingPartDeadline: null,
        // Campos para oficina parceira
        usedPartnerWorkshop: false,
        partnerWorkshopName: '',
        laborCost: '',
        mechanicName: ''
      });
    }
  }, [maintenance]);

  // Função para adicionar uma nova peça
  const addReplacedPart = () => {
    setFormData(prev => ({
      ...prev,
      replacedParts: [
        ...prev.replacedParts,
        {
          id: Date.now().toString(),
          name: '',
          quantity: 1,
          unitPrice: 0
        }
      ]
    }));
  };

  // Função para remover uma peça
  const removeReplacedPart = (id: string) => {
    setFormData(prev => ({
      ...prev,
      replacedParts: prev.replacedParts.filter(part => part.id !== id)
    }));
  };

  // Função para atualizar uma peça
  const updateReplacedPart = (id: string, field: keyof ReplacedPart, value: any) => {
    setFormData(prev => ({
      ...prev,
      replacedParts: prev.replacedParts.map(part => 
        part.id === id ? { ...part, [field]: value } : part
      )
    }));
  };

  // Calcular valor total das peças
  const getTotalPartsValue = () => {
    return formData.replacedParts.reduce((total, part) => {
      return total + (part.quantity * part.unitPrice);
    }, 0).toFixed(2);
  };

  // Calcular custo total (peças + mão de obra)
  const getTotalCost = () => {
    const partsTotal = parseFloat(getTotalPartsValue());
    const laborCost = parseFloat(formData.laborCost) || 0;
    return (partsTotal + laborCost).toFixed(2);
  };

  // Mutação para atualizar manutenção
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!maintenance) return null;
      try {
        const response = await apiRequest('PUT', `/api/oficina-murici/maintenance/${maintenance.id}`, data);
        return await response.json();
      } catch (error) {
        console.error('Erro ao atualizar manutenção:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Manutenção atualizada",
        description: "Os dados da manutenção foram atualizados com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance'] });
      onUpdate();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Ocorreu um erro ao atualizar a manutenção.",
        variant: "destructive",
      });
    }
  });

  // Função para enviar o formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!maintenance) return;

    const updatedData: any = {
      status: formData.status,
      workshopId: formData.workshopId,
      servicePerformed: formData.servicePerformed,
      estimatedCompletion: formData.estimatedCompletion ? format(formData.estimatedCompletion, 'yyyy-MM-dd') : null,
      completionDate: formData.completionDate ? format(formData.completionDate, 'yyyy-MM-dd') : null,
      cost: parseFloat(getTotalCost()), // Custo calculado automaticamente
      replacedParts: formData.replacedParts,
      // Novos campos de oficina parceira
      mechanicName: formData.mechanicName,
      usedPartnerWorkshop: formData.usedPartnerWorkshop,
      partnerWorkshopName: formData.usedPartnerWorkshop ? formData.partnerWorkshopName : null,
      laborCost: formData.usedPartnerWorkshop ? parseFloat(formData.laborCost || '0') : 0
    };

    // Adicionar campos específicos para aguardando_peca
    if (formData.status === 'aguardando_peca') {
      updatedData.pendingPartDescription = formData.pendingPartDescription;
      updatedData.pendingPartValue = formData.pendingPartValue ? parseFloat(formData.pendingPartValue) : null;
      updatedData.pendingPartSupplier = formData.pendingPartSupplier;
      updatedData.pendingPartPhone = formData.pendingPartPhone;
      updatedData.pendingPartDeadline = formData.pendingPartDeadline ? format(formData.pendingPartDeadline, 'yyyy-MM-dd') : null;
    }

    updateMutation.mutate(updatedData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Manutenção</DialogTitle>
          <DialogDescription>
            Atualize os detalhes da manutenção do veículo {maintenance?.vehiclePlate}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Status e Oficina */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status da Manutenção</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => {
                  console.log('Status selecionado:', value);
                  console.log('Comparação aguardando_peca:', value === 'aguardando_peca');
                  console.log('Tipo do valor:', typeof value);
                  setFormData({...formData, status: value as Maintenance['status']});
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {getNextAvailableStatuses(maintenance?.status || 'pendente').map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Oficina */}
            <div className="space-y-2">
              <Label htmlFor="workshopId">Oficina</Label>
              <Select 
                value={formData.workshopId.toString()} 
                onValueChange={(value) => setFormData({...formData, workshopId: parseInt(value, 10)})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a oficina" />
                </SelectTrigger>
                <SelectContent>
                  {workshops.map((workshop) => (
                    <SelectItem key={workshop.id} value={workshop.id.toString()}>
                      {workshop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mecânico Responsável */}
          <div className="space-y-2">
            <Label htmlFor="mechanicName">Mecânico Responsável</Label>
            <Input
              id="mechanicName"
              value={formData.mechanicName}
              onChange={(e) => setFormData({...formData, mechanicName: e.target.value})}
              placeholder="Nome do mecânico responsável"
            />
          </div>

          {/* Oficina Parceira */}
          <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="usedPartnerWorkshop"
                checked={formData.usedPartnerWorkshop}
                onChange={(e) => setFormData({...formData, usedPartnerWorkshop: e.target.checked})}
                className="rounded border-gray-300"
              />
              <Label htmlFor="usedPartnerWorkshop" className="font-medium">
                Utilizou Oficina Parceira?
              </Label>
            </div>

            {formData.usedPartnerWorkshop && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome da Oficina */}
                <div className="space-y-2">
                  <Label htmlFor="partnerWorkshopName">Nome da Oficina Parceira</Label>
                  <Input
                    id="partnerWorkshopName"
                    value={formData.partnerWorkshopName}
                    onChange={(e) => setFormData({...formData, partnerWorkshopName: e.target.value})}
                    placeholder="Nome da oficina terceirizada"
                  />
                </div>

                {/* Valor da Mão de Obra */}
                <div className="space-y-2">
                  <Label htmlFor="laborCost">Valor da Mão de Obra (R$)</Label>
                  <Input
                    id="laborCost"
                    type="number"
                    value={formData.laborCost}
                    onChange={(e) => setFormData({...formData, laborCost: e.target.value})}
                    placeholder="0,00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Campos específicos para aguardando_peca */}
          {console.log('Verificando se deve mostrar campos:', { status: formData.status, shouldShow: formData.status === 'aguardando_peca' })}
          {formData.status === 'aguardando_peca' && (
            <div className="space-y-4 p-4 border rounded-lg bg-orange-50">
              <h3 className="font-semibold text-orange-800">Informações da Peça Aguardada</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Descrição da Peça */}
                <div className="space-y-2">
                  <Label htmlFor="pendingPartDescription">Descrição da Peça *</Label>
                  <Input
                    id="pendingPartDescription"
                    value={formData.pendingPartDescription}
                    onChange={(e) => setFormData({...formData, pendingPartDescription: e.target.value})}
                    placeholder="Ex: Filtro de óleo, pastilha de freio..."
                    required
                  />
                </div>

                {/* Valor */}
                <div className="space-y-2">
                  <Label htmlFor="pendingPartValue">Valor (R$) *</Label>
                  <Input
                    id="pendingPartValue"
                    type="number"
                    value={formData.pendingPartValue}
                    onChange={(e) => setFormData({...formData, pendingPartValue: e.target.value})}
                    placeholder="0,00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fornecedor */}
                <div className="space-y-2">
                  <Label htmlFor="pendingPartSupplier">Fornecedor *</Label>
                  <Input
                    id="pendingPartSupplier"
                    value={formData.pendingPartSupplier}
                    onChange={(e) => setFormData({...formData, pendingPartSupplier: e.target.value})}
                    placeholder="Nome do fornecedor"
                    required
                  />
                </div>

                {/* Telefone */}
                <div className="space-y-2">
                  <Label htmlFor="pendingPartPhone">Telefone *</Label>
                  <Input
                    id="pendingPartPhone"
                    value={formData.pendingPartPhone}
                    onChange={(e) => setFormData({...formData, pendingPartPhone: e.target.value})}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
              </div>

              {/* Prazo */}
              <div className="space-y-2">
                <Label>Prazo de Entrega *</Label>
                <DatePicker
                  date={formData.pendingPartDeadline}
                  setDate={(date) => setFormData({...formData, pendingPartDeadline: date})}
                  locale={ptBR}
                />
              </div>
            </div>
          )}

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data Estimada de Conclusão */}
            <div className="space-y-2">
              <Label>Previsão de Conclusão</Label>
              <DatePicker
                date={formData.estimatedCompletion}
                setDate={(date) => setFormData({...formData, estimatedCompletion: date})}
                locale={ptBR}
              />
            </div>

            {/* Data de Conclusão */}
            <div className="space-y-2">
              <Label>Data de Conclusão</Label>
              <DatePicker
                date={formData.completionDate}
                setDate={(date) => setFormData({...formData, completionDate: date})}
                locale={ptBR}
              />
            </div>
          </div>

          {/* Serviço Realizado */}
          <div className="space-y-2">
            <Label htmlFor="servicePerformed">Serviço Realizado</Label>
            <Textarea
              id="servicePerformed"
              value={formData.servicePerformed}
              onChange={(e) => setFormData({...formData, servicePerformed: e.target.value})}
              placeholder="Descreva o serviço realizado"
              className="min-h-[100px]"
            />
          </div>

          {/* Custo Total Calculado */}
          <div className="space-y-4 p-4 border rounded-lg bg-green-50">
            <h3 className="font-semibold text-green-800">Resumo de Custos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Total das Peças:</Label>
                <div className="text-lg font-bold text-green-700">
                  R$ {getTotalPartsValue()}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Mão de Obra:</Label>
                <div className="text-lg font-bold text-blue-700">
                  R$ {parseFloat(formData.laborCost || '0').toFixed(2)}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Custo Total:</Label>
                <div className="text-xl font-bold text-gray-900">
                  R$ {getTotalCost()}
                </div>
              </div>
            </div>
          </div>

          {/* Peças Trocadas */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Peças Trocadas</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={addReplacedPart}
              >
                Adicionar Peça
              </Button>
            </div>

            {formData.replacedParts.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Nenhuma peça adicionada</p>
            ) : (
              <div className="space-y-4">
                {formData.replacedParts.map((part) => (
                  <div key={part.id} className="flex flex-col space-y-2 p-3 border rounded-md">
                    <div className="flex justify-between">
                      <Label>Nome da Peça</Label>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeReplacedPart(part.id)}
                        className="h-6 text-destructive hover:text-destructive"
                      >
                        Remover
                      </Button>
                    </div>
                    <Input
                      value={part.name}
                      onChange={(e) => updateReplacedPart(part.id, 'name', e.target.value)}
                      placeholder="Nome da peça"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Quantidade</Label>
                        <Input
                          type="number"
                          value={part.quantity}
                          onChange={(e) => updateReplacedPart(part.id, 'quantity', parseInt(e.target.value, 10) || 0)}
                          min="1"
                          placeholder="1"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Valor Unitário (R$)</Label>
                        <Input
                          type="number"
                          value={part.unitPrice}
                          onChange={(e) => updateReplacedPart(part.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                    <div className="text-right text-sm font-medium">
                      Subtotal: R$ {(part.quantity * part.unitPrice).toFixed(2)}
                    </div>
                  </div>
                ))}

                <div className="flex justify-between items-center p-3 bg-primary/5 rounded-md">
                  <span className="font-medium">Total das Peças:</span>
                  <span className="font-bold">R$ {getTotalPartsValue()}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}