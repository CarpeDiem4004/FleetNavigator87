import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { 
  Eye, 
  Check, 
  X, 
  Clock, 
  FileText, 
  Calculator,
  Wrench,
  Calendar,
  DollarSign,
  User,
  Phone,
  Mail,
  Car,
  CheckCircle,
  XCircle,
  Printer,
  CreditCard
} from "lucide-react";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface PartDetail {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface WorkshopBudget {
  id: number;
  car_reception_id: number;
  service_number: string;
  budget_number: string;
  workshop_id: number;
  workshop_cnpj: string;
  labor_description: string;
  labor_cost: string;
  labor_hours: string;
  parts_description: string;
  parts_cost: string;
  parts_json: string;
  total_cost: string;
  estimated_days: number;
  status: string;
  approved_by: number;
  approved_date: string;
  approved_by_name: string;
  approved_by_email: string;
  rejection_reason: string;
  notes: string;
  internal_notes: string;
  created_at: string;
  updated_at: string;
  workshop_name: string;
  workshop_cnpj_full: string;
  workshop_phone: string;
  workshop_email: string;
  vehicle_plate: string;
  vehicle_model: string;
  vehicle_type: string;
  service_description: string;
  current_km: number;
  base_id: number;
  project_id: number;
  base_name: string;
  project_name: string;
  parts_details: PartDetail[];
  is_billed?: boolean;
  installments?: number;
  due_date_1?: string;
  due_date_2?: string;
  due_date_3?: string;
  due_date_4?: string;
  due_date_5?: string;
  due_date_6?: string;
  due_date_7?: string;
  due_date_8?: string;
  due_date_9?: string;
  due_date_10?: string;
  due_date_11?: string;
  due_date_12?: string;
}

export default function WorkshopBudgets() {
  const [budgets, setBudgets] = useState<WorkshopBudget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBudget, setSelectedBudget] = useState<WorkshopBudget | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<'aprovado' | 'rejeitado' | 'revisao'>('aprovado');
  const [statusNotes, setStatusNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadBudgets();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
  };

  const loadBudgets = async () => {
    try {
      setIsLoading(true);
      
      // Construir query string com filtros de data
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const url = `/api/fleet/workshop-budgets${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setBudgets(data.budgets);
      } else {
        toast({
          title: "Erro",
          description: data.message || "Erro ao carregar orçamentos",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar orçamentos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar orçamentos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateBudgetStatus = async () => {
    if (!selectedBudget) return;

    try {
      const response = await fetch(`/api/fleet/workshop-budgets/${selectedBudget.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: statusAction,
          rejection_reason: statusAction === 'rejeitado' ? rejectionReason : null,
          notes: statusNotes || null
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sucesso",
          description: data.message,
        });
        await loadBudgets();
        setIsStatusDialogOpen(false);
        setStatusNotes('');
        setRejectionReason('');
      } else {
        toast({
          title: "Erro",
          description: data.message || "Erro ao atualizar status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { variant: "secondary" as const, label: "Pendente", icon: Clock },
      aprovado: { variant: "success" as const, label: "Aprovado", icon: Check },
      rejeitado: { variant: "destructive" as const, label: "Rejeitado", icon: X },
      revisao: { variant: "warning" as const, label: "Em Revisão", icon: Eye },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const openStatusDialog = (budget: WorkshopBudget, action: 'aprovado' | 'rejeitado' | 'revisao') => {
    setSelectedBudget(budget);
    setStatusAction(action);
    setIsStatusDialogOpen(true);
  };

  const generatePDF = (budget: WorkshopBudget) => {
    try {
      // Criar novo documento PDF
      const pdf = new jsPDF();
      
      // Configurações
      const pageWidth = pdf.internal.pageSize.width;
      const margin = 20;
      let yPosition = margin;
      
      // Título
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ORÇAMENTO DE SERVIÇO APROVADO', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      // Número do orçamento
      pdf.setFontSize(12);
      pdf.text(`Orçamento: ${budget.budget_number}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;
      
      // Informações da oficina
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('OFICINA RESPONSÁVEL', margin, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Nome: ${budget.workshop_name}`, margin, yPosition);
      yPosition += 5;
      pdf.text(`CNPJ: ${budget.workshop_cnpj}`, margin, yPosition);
      yPosition += 5;
      if (budget.workshop_phone) {
        pdf.text(`Telefone: ${budget.workshop_phone}`, margin, yPosition);
        yPosition += 5;
      }
      if (budget.workshop_email) {
        pdf.text(`Email: ${budget.workshop_email}`, margin, yPosition);
        yPosition += 5;
      }
      yPosition += 10;
      
      // Informações do veículo
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DADOS DO VEÍCULO', margin, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Placa: ${budget.vehicle_plate}`, margin, yPosition);
      pdf.text(`Modelo: ${budget.vehicle_model}`, margin + 80, yPosition);
      yPosition += 5;
      pdf.text(`Tipo: ${budget.vehicle_type}`, margin, yPosition);
      pdf.text(`KM Atual: ${budget.current_km?.toLocaleString() || 'N/A'}`, margin + 80, yPosition);
      yPosition += 5;
      pdf.text(`Projeto: ${budget.project_name || 'N/A'}`, margin, yPosition);
      pdf.text(`Base: ${budget.base_name || 'N/A'}`, margin + 80, yPosition);
      yPosition += 15;
      
      // Detalhes do serviço
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DETALHES DO SERVIÇO', margin, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Descrição da Mão de Obra:', margin, yPosition);
      yPosition += 5;
      const laborLines = pdf.splitTextToSize(budget.labor_description, pageWidth - 2 * margin);
      pdf.text(laborLines, margin, yPosition);
      yPosition += laborLines.length * 5 + 5;
      
      // Custos
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CUSTOS', margin, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Mão de Obra: ${formatCurrency(parseFloat(budget.labor_cost))}`, margin, yPosition);
      pdf.text(`Horas: ${budget.labor_hours}`, margin + 100, yPosition);
      yPosition += 5;
      pdf.text(`Peças: ${formatCurrency(parseFloat(budget.parts_cost))}`, margin, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`TOTAL: ${formatCurrency(parseFloat(budget.total_cost))}`, margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Prazo Estimado: ${budget.estimated_days} dias`, margin, yPosition);
      yPosition += 15;
      
      // Informações da aprovação
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('APROVAÇÃO', margin, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Aprovado por: ${budget.approved_by_name} (${budget.approved_by_email})`, margin, yPosition);
      yPosition += 5;
      pdf.text(`Data da Aprovação: ${formatDate(budget.approved_date)}`, margin, yPosition);
      yPosition += 5;
      pdf.text(`Orçamento Criado em: ${formatDate(budget.created_at)}`, margin, yPosition);
      yPosition += 15;
      
      // Detalhes das peças (se houver)
      if (budget.parts_details && budget.parts_details.length > 0) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('DETALHES DAS PEÇAS', margin, yPosition);
        yPosition += 10;
        
        // Criar tabela de peças
        const tableColumns = ['Descrição', 'Qtd', 'Valor Unit.', 'Total'];
        const tableRows = budget.parts_details.map(part => [
          part.description,
          part.quantity.toString(),
          formatCurrency(part.unitPrice),
          formatCurrency(part.total)
        ]);
        
        (pdf as any).autoTable({
          startY: yPosition,
          head: [tableColumns],
          body: tableRows,
          margin: { left: margin, right: margin },
          styles: { fontSize: 9 },
          headStyles: { fillColor: [66, 66, 66] }
        });
      }
      
      // Rodapé
      const finalY = pdf.internal.pageSize.height - 20;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Documento gerado pelo sistema Murici On Fleet 2.0', pageWidth / 2, finalY, { align: 'center' });
      pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, finalY + 5, { align: 'center' });
      
      // Salvar PDF
      pdf.save(`Orçamento_${budget.budget_number}_${budget.vehicle_plate}.pdf`);
      
      toast({
        title: "Sucesso",
        description: "PDF gerado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF",
        variant: "destructive",
      });
    }
  };

  const openDetailDialog = (budget: WorkshopBudget) => {
    setSelectedBudget(budget);
    setIsDetailDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando orçamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Orçamentos</h1>
          <p className="text-muted-foreground">
            Acompanhe e aprove solicitações de orçamento de manutenção de veículos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadBudgets}>
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros de Data */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Filtre os orçamentos por período de criação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start-date">Data Início</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">Data Fim</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={loadBudgets} className="flex-1">
                Aplicar Filtros
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  loadBudgets();
                }}
              >
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{budgets.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">
                  {budgets.filter(b => b.status === 'pendente').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aprovados</p>
                <p className="text-2xl font-bold">
                  {budgets.filter(b => b.status === 'aprovado').length}
                </p>
              </div>
              <Check className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(budgets.reduce((sum, b) => sum + parseFloat(b.total_cost), 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Orçamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitações de Orçamento</CardTitle>
          <CardDescription>
            Lista de todos os orçamentos submetidos pelas oficinas parceiras
          </CardDescription>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum orçamento encontrado</h3>
              <p className="text-muted-foreground text-center">
                Quando as oficinas enviarem orçamentos, eles aparecerão aqui para aprovação.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orçamento</TableHead>
                  <TableHead>Oficina</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell>
                      <div className="font-medium">{budget.budget_number}</div>
                      <div className="text-sm text-muted-foreground">
                        Serviço: {budget.service_number}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{budget.workshop_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {budget.workshop_cnpj}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{budget.vehicle_plate}</div>
                      <div className="text-sm text-muted-foreground">
                        {budget.vehicle_model}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{budget.labor_description}</div>
                      {budget.estimated_days && (
                        <div className="text-sm text-muted-foreground">
                          {budget.estimated_days} dias
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold">{formatCurrency(budget.total_cost)}</div>
                      <div className="text-sm text-muted-foreground">
                        MO: {formatCurrency(budget.labor_cost)} | 
                        Peças: {formatCurrency(budget.parts_cost || '0')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(budget.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(budget.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetailDialog(budget)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {budget.status === 'aprovado' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => generatePDF(budget)}
                            title="Imprimir PDF"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        )}
                        
                        
                        {budget.status === 'pendente' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => openStatusDialog(budget, 'aprovado')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => openStatusDialog(budget, 'rejeitado')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Orçamento</DialogTitle>
            <DialogDescription>
              {selectedBudget?.budget_number} - {selectedBudget?.workshop_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBudget && (
            <div className="space-y-6">
              {/* Informações do Veículo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Informações do Veículo
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Placa</Label>
                    <p className="text-sm">{selectedBudget.vehicle_plate}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Modelo</Label>
                    <p className="text-sm">{selectedBudget.vehicle_model}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Tipo</Label>
                    <p className="text-sm">{selectedBudget.vehicle_type}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">KM Atual</Label>
                    <p className="text-sm">{selectedBudget.current_km?.toLocaleString() || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Projeto</Label>
                    <p className="text-sm">{selectedBudget.project_name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Base</Label>
                    <p className="text-sm">{selectedBudget.base_name || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Informações da Oficina */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Oficina Responsável
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Nome</Label>
                    <p className="text-sm">{selectedBudget.workshop_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">CNPJ</Label>
                    <p className="text-sm">{selectedBudget.workshop_cnpj}</p>
                  </div>
                  {selectedBudget.workshop_phone && (
                    <div>
                      <Label className="text-sm font-medium">Telefone</Label>
                      <p className="text-sm flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {selectedBudget.workshop_phone}
                      </p>
                    </div>
                  )}
                  {selectedBudget.workshop_email && (
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {selectedBudget.workshop_email}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status e Aprovação */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {selectedBudget.status === 'aprovado' ? <CheckCircle className="h-5 w-5 text-green-600" /> :
                     selectedBudget.status === 'rejeitado' ? <XCircle className="h-5 w-5 text-red-600" /> :
                     <Clock className="h-5 w-5 text-orange-600" />}
                    Status do Orçamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        selectedBudget.status === 'aprovado' ? 'default' : 
                        selectedBudget.status === 'rejeitado' ? 'destructive' : 
                        selectedBudget.status === 'revisao' ? 'secondary' : 
                        'outline'
                      }>
                        {selectedBudget.status === 'pendente' && 'Pendente'}
                        {selectedBudget.status === 'aprovado' && 'Aprovado'}
                        {selectedBudget.status === 'rejeitado' && 'Rejeitado'}
                        {selectedBudget.status === 'revisao' && 'Em Revisão'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Orçamento criado em {formatDate(selectedBudget.created_at)}
                      </span>
                    </div>

                    {/* Informações de Aprovação/Rejeição */}
                    {selectedBudget.status !== 'pendente' && selectedBudget.approved_by_name && (
                      <div className={`p-4 rounded-lg border ${
                        selectedBudget.status === 'aprovado' ? 'bg-green-50 border-green-200' :
                        selectedBudget.status === 'rejeitado' ? 'bg-red-50 border-red-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <User className={`h-4 w-4 ${
                            selectedBudget.status === 'aprovado' ? 'text-green-700' :
                            selectedBudget.status === 'rejeitado' ? 'text-red-700' :
                            'text-blue-700'
                          }`} />
                          <span className={`font-medium ${
                            selectedBudget.status === 'aprovado' ? 'text-green-800' :
                            selectedBudget.status === 'rejeitado' ? 'text-red-800' :
                            'text-blue-800'
                          }`}>
                            {selectedBudget.status === 'aprovado' ? 'Aprovado por:' :
                             selectedBudget.status === 'rejeitado' ? 'Rejeitado por:' :
                             'Processado por:'}
                          </span>
                        </div>
                        <div className={`text-sm ${
                          selectedBudget.status === 'aprovado' ? 'text-green-700' :
                          selectedBudget.status === 'rejeitado' ? 'text-red-700' :
                          'text-blue-700'
                        }`}>
                          <p className="font-semibold">{selectedBudget.approved_by_name}</p>
                          <p>{selectedBudget.approved_by_email}</p>
                          {selectedBudget.approved_date && (
                            <p className="mt-1">Em {formatDate(selectedBudget.approved_date)}</p>
                          )}
                          {selectedBudget.rejection_reason && (
                            <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded">
                              <p className="font-medium text-red-800">Motivo da rejeição:</p>
                              <p className="text-red-700 italic">"{selectedBudget.rejection_reason}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Informações de Faturamento */}
              {selectedBudget.is_billed && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Informações de Faturamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <Badge variant="success" className="flex w-fit items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Faturado
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Parcelas</Label>
                        <p className="text-lg font-bold">
                          {selectedBudget.installments || 1}x de {formatCurrency((parseFloat(selectedBudget.total_cost) / (selectedBudget.installments || 1)).toString())}
                        </p>
                      </div>
                    </div>

                    {/* Datas de Vencimento */}
                    {selectedBudget.installments && selectedBudget.installments > 0 && (
                      <div>
                        <Label className="text-sm font-medium mb-3 block">Datas de Vencimento</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          {Array.from({ length: selectedBudget.installments }).map((_, index) => {
                            const dueDate = (selectedBudget as any)[`due_date_${index + 1}`];
                            console.log(`🔍 Debug parcela ${index + 1}:`, {
                              dueDate,
                              type: typeof dueDate,
                              selectedBudgetKeys: Object.keys(selectedBudget).filter(key => key.includes('due_date')),
                              selectedBudget: selectedBudget
                            });
                            if (!dueDate) return null;
                            
                            // Função para formatar data corretamente
                            const formatDate = (dateString: string) => {
                              try {
                                console.log(`📅 Formatando data parcela ${index + 1}:`, dateString, 'Tipo:', typeof dateString);
                                
                                if (!dateString) {
                                  console.log(`❌ Data vazia ou nula para parcela ${index + 1}`);
                                  return 'Data não definida';
                                }
                                
                                // Se a data já está no formato YYYY-MM-DD, usar diretamente
                                const date = new Date(dateString + 'T12:00:00.000Z'); // Usar meio-dia UTC para evitar problemas de timezone
                                const formatted = date.toLocaleDateString('pt-BR');
                                
                                console.log('Data formatada:', formatted);
                                return formatted;
                              } catch (error) {
                                console.error('Erro ao formatar data:', dateString, error);
                                return 'Data inválida';
                              }
                            };
                            
                            return (
                              <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    {index + 1}ª parcela
                                  </p>
                                  <p className="text-sm font-medium">
                                    {formatDate(dueDate)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Serviços e Custos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Detalhes do Orçamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Descrição do Serviço</Label>
                    <p className="text-sm">{selectedBudget.labor_description}</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Mão de Obra</Label>
                      <p className="text-lg font-bold">{formatCurrency(selectedBudget.labor_cost)}</p>
                      {selectedBudget.labor_hours && (
                        <p className="text-sm text-muted-foreground">{selectedBudget.labor_hours}h</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Peças</Label>
                      <p className="text-lg font-bold">{formatCurrency(selectedBudget.parts_cost || '0')}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Total</Label>
                      <p className="text-xl font-bold text-primary">{formatCurrency(selectedBudget.total_cost)}</p>
                    </div>
                  </div>

                  {/* Detalhes das Peças */}
                  {selectedBudget.parts_details && selectedBudget.parts_details.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Detalhamento das Peças</Label>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Qtd</TableHead>
                            <TableHead>Valor Unit.</TableHead>
                            <TableHead>Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedBudget.parts_details.map((part, index) => (
                            <TableRow key={index}>
                              <TableCell>{part.description}</TableCell>
                              <TableCell>{part.quantity}</TableCell>
                              <TableCell>{formatCurrency(part.unitPrice)}</TableCell>
                              <TableCell>{formatCurrency(part.total)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {selectedBudget.estimated_days && (
                    <div>
                      <Label className="text-sm font-medium">Prazo Estimado</Label>
                      <p className="text-sm flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {selectedBudget.estimated_days} dias
                      </p>
                    </div>
                  )}

                  {selectedBudget.notes && (
                    <div>
                      <Label className="text-sm font-medium">Observações</Label>
                      <p className="text-sm">{selectedBudget.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Mudança de Status */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusAction === 'aprovado' ? 'Aprovar' : statusAction === 'rejeitado' ? 'Rejeitar' : 'Solicitar Revisão'} Orçamento
            </DialogTitle>
            <DialogDescription>
              {selectedBudget?.budget_number} - {formatCurrency(selectedBudget?.total_cost || '0')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {statusAction === 'rejeitado' && (
              <div>
                <Label htmlFor="rejection_reason">Motivo da Rejeição</Label>
                <Textarea
                  id="rejection_reason"
                  placeholder="Explique o motivo da rejeição..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="status_notes">Observações (Opcional)</Label>
              <Textarea
                id="status_notes"
                placeholder="Observações adicionais..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={updateBudgetStatus}
                variant={statusAction === 'rejeitado' ? 'destructive' : 'default'}
              >
                {statusAction === 'aprovado' ? 'Aprovar' : statusAction === 'rejeitado' ? 'Rejeitar' : 'Solicitar Revisão'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}