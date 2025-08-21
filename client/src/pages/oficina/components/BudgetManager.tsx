import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calculator, FileText, Download, Eye, Plus, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import jsPDF from 'jspdf';
import PartsManager, { PartItem } from "./PartsManager";
import { formatCurrency } from "@/lib/currency";

const budgetSchema = z.object({
  carReceptionId: z.number(),
  serviceNumber: z.string(),
  laborDescription: z.string().min(1, "Descrição da mão de obra é obrigatória"),
  laborCost: z.number().min(0, "Custo da mão de obra deve ser positivo"),
  laborHours: z.number().min(0).optional(),
  partsDescription: z.string().optional(),
  partsCost: z.number().min(0).optional(),
  estimatedDays: z.number().min(1).optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  isBilled: z.boolean().default(false),
  installments: z.number().min(1).max(12).optional(),
  dueDate1: z.string().optional(),
  dueDate2: z.string().optional(),
  dueDate3: z.string().optional(),
  dueDate4: z.string().optional(),
  dueDate5: z.string().optional(),
  dueDate6: z.string().optional(),
  dueDate7: z.string().optional(),
  dueDate8: z.string().optional(),
  dueDate9: z.string().optional(),
  dueDate10: z.string().optional(),
  dueDate11: z.string().optional(),
  dueDate12: z.string().optional(),
});

type BudgetForm = z.infer<typeof budgetSchema>;

interface Budget {
  id: number;
  budget_number: string;
  service_number: string;
  labor_description: string;
  labor_cost: string;
  labor_hours?: string;
  parts_description?: string;
  parts_cost?: string;
  parts_json?: string;
  total_cost: string;
  estimated_days?: number;
  status: string;
  notes?: string;
  internal_notes?: string;
  created_at: string;
  vehicle_plate: string;
  vehicle_model: string;
  vehicle_type: string;
  service_description: string;
  approved_by_name?: string;
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

interface CarReception {
  id: number;
  serviceNumber: string;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleType: string;
  serviceDescription: string;
  status: string;
}

interface BudgetManagerProps {
  token: string;
  onClose?: () => void;
}

export default function BudgetManager({ token, onClose }: BudgetManagerProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [carReceptions, setCarReceptions] = useState<CarReception[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [parts, setParts] = useState<PartItem[]>([]);
  const [partsTotalValue, setPartsTotalValue] = useState(0);
  const { toast } = useToast();

  // Handler para mudanças nas peças
  const handlePartsChange = (updatedParts: PartItem[], totalValue: number) => {
    setParts(updatedParts);
    setPartsTotalValue(totalValue);
    // Atualizar o valor das peças no formulário
    form.setValue('partsCost', totalValue);
  };

  // Carregar peças de um orçamento existente
  const loadBudgetParts = (budget: Budget) => {
    if (budget.parts_json) {
      try {
        const parsedParts = JSON.parse(budget.parts_json) as PartItem[];
        setParts(parsedParts);
        const total = parsedParts.reduce((sum, part) => sum + part.total, 0);
        setPartsTotalValue(total);
      } catch (error) {
        console.error('Erro ao carregar peças do orçamento:', error);
        setParts([]);
        setPartsTotalValue(0);
      }
    } else {
      setParts([]);
      setPartsTotalValue(0);
    }
  };

  const form = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      laborCost: 0,
      partsCost: 0,
      laborHours: 0,
      estimatedDays: 1,
      notes: "",
      internalNotes: "",
      isBilled: false,
      installments: 1,
    },
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadBudgets();
    loadCarReceptions();
  }, []);

  const loadBudgets = async () => {
    try {
      const response = await fetch(`/api/oficina/budgets?token=${token}`);
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
    }
  };

  const loadCarReceptions = async () => {
    try {
      const response = await fetch(`/api/oficina/car-receptions?token=${token}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Filtrar apenas recebimentos que ainda não têm orçamento ou que precisam de novo orçamento
        const receptionsWithoutBudget = data.filter(reception => 
          reception.status === 'recebido' || reception.status === 'em_analise'
        );
        setCarReceptions(receptionsWithoutBudget);
      }
    } catch (error) {
      console.error("Erro ao carregar recebimentos:", error);
    }
  };

  const onSubmit = async (data: BudgetForm) => {
    setIsLoading(true);
    try {
      const url = editingBudget 
        ? `/api/oficina/budgets/${editingBudget.id}?token=${token}`
        : `/api/oficina/budgets?token=${token}`;
      
      const method = editingBudget ? 'PUT' : 'POST';
      
      // Incluir dados das peças
      const budgetData = {
        ...data,
        partsJson: parts.length > 0 ? JSON.stringify(parts) : null,
        partsCost: partsTotalValue
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(budgetData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Sucesso",
          description: result.message,
        });
        
        await loadBudgets();
        setIsDialogOpen(false);
        setEditingBudget(null);
        form.reset();
        setParts([]);
        setPartsTotalValue(0);
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao processar orçamento",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao processar orçamento:", error);
      toast({
        title: "Erro",
        description: "Erro ao processar orçamento",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDF = async (budget: Budget) => {
    try {
      const response = await fetch(`/api/oficina/budgets/${budget.id}/pdf?token=${token}`);
      const data = await response.json();
      
      if (data.success) {
        const { budget: budgetData, workshop } = data.data;
        
        // Criar PDF usando jsPDF
        const doc = new jsPDF();
        
        // Cabeçalho da oficina
        doc.setFontSize(18);
        doc.text(workshop.name, 20, 20);
        doc.setFontSize(12);
        doc.text(`CNPJ: ${workshop.cnpj}`, 20, 30);
        if (workshop.endereco) doc.text(`Endereço: ${workshop.endereco}`, 20, 40);
        if (workshop.telefone) doc.text(`Telefone: ${workshop.telefone}`, 20, 50);
        if (workshop.email) doc.text(`Email: ${workshop.email}`, 20, 60);
        
        // Título do orçamento
        doc.setFontSize(16);
        doc.text(`ORÇAMENTO Nº ${budgetData.budget_number}`, 20, 80);
        
        // Dados do serviço
        doc.setFontSize(12);
        doc.text(`Número do Serviço: ${budgetData.service_number}`, 20, 95);
        doc.text(`Veículo: ${budgetData.vehicle_plate} - ${budgetData.vehicle_model}`, 20, 105);
        doc.text(`Tipo: ${budgetData.vehicle_type}`, 20, 115);
        doc.text(`KM Atual: ${budgetData.current_km || 'N/A'}`, 20, 125);
        
        // Serviços e custos
        doc.text('SERVIÇOS:', 20, 145);
        doc.text(`Mão de obra: ${budgetData.labor_description}`, 20, 155);
        doc.text(`Custo da mão de obra: ${formatCurrency(budgetData.labor_cost)}`, 20, 165);
        
        if (budgetData.labor_hours) {
          doc.text(`Horas de trabalho: ${budgetData.labor_hours}h`, 20, 175);
        }
        
        if (budgetData.parts_description) {
          doc.text(`Peças: ${budgetData.parts_description}`, 20, 185);
          doc.text(`Custo das peças: ${formatCurrency(budgetData.parts_cost || '0')}`, 20, 195);
        }
        
        // Total
        doc.setFontSize(14);
        doc.text(`TOTAL: ${formatCurrency(budgetData.total_cost)}`, 20, 215);
        
        // Prazo estimado
        if (budgetData.estimated_days) {
          doc.setFontSize(12);
          doc.text(`Prazo estimado: ${budgetData.estimated_days} dias`, 20, 230);
        }
        
        // Observações
        if (budgetData.notes) {
          doc.text('Observações:', 20, 245);
          const splitNotes = doc.splitTextToSize(budgetData.notes, 170);
          doc.text(splitNotes, 20, 255);
        }
        
        // Rodapé
        doc.setFontSize(10);
        doc.text(`Orçamento gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 280);
        doc.text('Este orçamento tem validade de 30 dias.', 20, 290);
        
        // Baixar PDF
        doc.save(`orcamento-${budgetData.budget_number}.pdf`);
        
        toast({
          title: "Sucesso",
          description: "PDF gerado com sucesso!",
        });
      } else {
        toast({
          title: "Erro",
          description: data.message || "Erro ao gerar PDF",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF",
        variant: "destructive",
      });
    }
  };

  const openCreateDialog = () => {
    setEditingBudget(null);
    form.reset();
    setParts([]);
    setPartsTotalValue(0);
    setIsDialogOpen(true);
  };

  const openEditDialog = (budget: Budget) => {
    setEditingBudget(budget);
    // Carregar peças do orçamento
    loadBudgetParts(budget);
    form.reset({
      carReceptionId: parseInt(budget.service_number.split('-')[0]) || 0, // Tentar extrair ID
      serviceNumber: budget.service_number,
      laborDescription: budget.labor_description,
      laborCost: parseFloat(budget.labor_cost),
      laborHours: budget.labor_hours ? parseFloat(budget.labor_hours) : undefined,
      partsDescription: budget.parts_description || "",
      partsCost: budget.parts_cost ? parseFloat(budget.parts_cost) : 0,
      estimatedDays: budget.estimated_days || 1,
      notes: budget.notes || "",
      internalNotes: budget.internal_notes || "",
      isBilled: budget.is_billed || false,
      installments: budget.installments || 1,
      dueDate1: budget.due_date_1 || "",
      dueDate2: budget.due_date_2 || "",
      dueDate3: budget.due_date_3 || "",
      dueDate4: budget.due_date_4 || "",
      dueDate5: budget.due_date_5 || "",
      dueDate6: budget.due_date_6 || "",
      dueDate7: budget.due_date_7 || "",
      dueDate8: budget.due_date_8 || "",
      dueDate9: budget.due_date_9 || "",
      dueDate10: budget.due_date_10 || "",
      dueDate11: budget.due_date_11 || "",
      dueDate12: budget.due_date_12 || "",
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { variant: "secondary" as const, label: "Pendente" },
      aprovado: { variant: "success" as const, label: "Aprovado" },
      rejeitado: { variant: "destructive" as const, label: "Rejeitado" },
      revisao: { variant: "warning" as const, label: "Em Revisão" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            Sistema de Orçamentos
          </h2>
          <p className="text-muted-foreground">
            Gerencie orçamentos para os veículos recebidos
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Orçamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBudget ? "Editar Orçamento" : "Novo Orçamento"}
              </DialogTitle>
              <DialogDescription>
                {editingBudget 
                  ? "Edite as informações do orçamento"
                  : "Crie um novo orçamento para um veículo recebido"
                }
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {!editingBudget && (
                  <FormField
                    control={form.control}
                    name="carReceptionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recebimento de Veículo</FormLabel>
                        <FormControl>
                          <select 
                            value={field.value || ""}
                            onChange={(e) => {
                              const receptionId = parseInt(e.target.value) || 0;
                              const reception = carReceptions.find(r => r.id === receptionId);
                              field.onChange(receptionId);
                              if (reception) {
                                form.setValue("serviceNumber", reception.serviceNumber || "");
                              }
                            }}
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="">Selecione um recebimento</option>
                            {carReceptions.map((reception) => (
                              <option key={reception.id} value={reception.id}>
                                {reception.vehiclePlate} - {reception.vehicleModel} ({reception.serviceNumber})
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="laborDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição da Mão de Obra *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva detalhadamente os serviços a serem realizados"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="laborCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custo da Mão de Obra (R$) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="laborHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horas de Trabalho</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Gerenciador de Peças */}
                <PartsManager
                  initialParts={parts}
                  onPartsChange={handlePartsChange}
                  disabled={isLoading}
                />

                <FormField
                  control={form.control}
                  name="estimatedDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prazo Estimado (dias)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Resumo dos Totais */}
                <Card className="bg-muted/30">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Mão de obra:</span>
                        <span className="font-medium">{formatCurrency(form.watch('laborCost') || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Peças:</span>
                        <span className="font-medium">{formatCurrency(partsTotalValue)}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-primary">{formatCurrency((form.watch('laborCost') || 0) + partsTotalValue)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações para o Cliente</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Informações adicionais que serão visíveis no orçamento"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="internalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações Internas</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Notas internas da oficina (não aparecerão no orçamento)"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Seção de Faturamento */}
                <Card className="bg-blue-50/50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Informações de Faturamento
                    </CardTitle>
                    <CardDescription>
                      Configure as opções de faturamento e parcelamento do orçamento
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="isBilled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Faturado</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Marque se este orçamento foi faturado
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch('isBilled') && (
                      <>
                        <FormField
                          control={form.control}
                          name="installments"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número de Parcelas</FormLabel>
                              <FormControl>
                                <select 
                                  {...field}
                                  onChange={(e) => {
                                    const installmentCount = parseInt(e.target.value);
                                    field.onChange(installmentCount);
                                    
                                    // Limpar campos de data que não serão usados
                                    for (let i = installmentCount + 1; i <= 12; i++) {
                                      form.setValue(`dueDate${i}` as keyof BudgetForm, "");
                                    }
                                  }}
                                  className="w-full p-2 border rounded-md"
                                >
                                  {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                                    <option key={num} value={num}>{num}x</option>
                                  ))}
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Campos dinâmicos para as datas de vencimento */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm text-muted-foreground">Datas de Vencimento dos Boletos</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.from({ length: form.watch('installments') || 1 }, (_, index) => {
                              const fieldName = `dueDate${index + 1}` as keyof BudgetForm;
                              return (
                                <FormField
                                  key={fieldName}
                                  control={form.control}
                                  name={fieldName}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>{index + 1}ª Parcela</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="date"
                                          value={field.value || ""}
                                          onChange={field.onChange}
                                          onBlur={field.onBlur}
                                          name={field.name}
                                          disabled={field.disabled}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Salvando..." : (editingBudget ? "Atualizar" : "Criar Orçamento")}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de orçamentos */}
      <div className="grid gap-4">
        {budgets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum orçamento encontrado</h3>
              <p className="text-muted-foreground text-center mb-4">
                Crie seu primeiro orçamento para começar a gerenciar os custos de manutenção.
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Orçamento
              </Button>
            </CardContent>
          </Card>
        ) : (
          budgets.map((budget) => (
            <Card key={budget.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {budget.budget_number}
                    </CardTitle>
                    <CardDescription>
                      {budget.vehicle_plate} - {budget.vehicle_model} | Serviço: {budget.service_number}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(budget.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">Serviços:</h4>
                    <p className="text-sm text-muted-foreground">{budget.labor_description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Mão de obra:</span> {formatCurrency(budget.labor_cost)}
                    </div>
                    <div>
                      <span className="font-medium">Peças:</span> {formatCurrency(budget.parts_cost || '0')}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-lg">Total:</span> 
                      <span className="text-lg font-bold text-green-600 ml-2">
                        {formatCurrency(budget.total_cost)}
                      </span>
                    </div>
                  </div>

                  {budget.estimated_days && (
                    <div className="text-sm">
                      <span className="font-medium">Prazo estimado:</span> {budget.estimated_days} dias
                    </div>
                  )}

                  {budget.notes && (
                    <div className="text-sm">
                      <span className="font-medium">Observações:</span>
                      <p className="text-muted-foreground mt-1">{budget.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(budget)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generatePDF(budget)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}