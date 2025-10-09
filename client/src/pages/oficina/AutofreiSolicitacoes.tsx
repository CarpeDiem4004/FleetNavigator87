import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileText, Clock, Calendar, User, Car, MapPin, Settings, Send, Calculator, Plus, Trash2, Eye, Printer, CheckCircle, XCircle, Edit } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface BudgetRequest {
  id: number;
  vehicle_plate: string;
  vehicle_model: string;
  description: string;
  workshop_id: number;
  workshop_name: string;
  status: string;
  chassis?: string;
  km?: number;
  projeto?: string;
  project_name?: string;
  base_name?: string;
  created_at: string;
  requester_name?: string;
  estimated_value?: number;
  approved_value?: number;
}

const AUTOFREI_ID = 12;

interface Part {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit_price: string;
  isFromRequest?: boolean; // Indica se é uma peça da solicitação original
}

interface BudgetResponse {
  labor_cost: string;
  parts_cost: string;
  total_cost: string;
  estimated_days: string;
  priority: string;
  observations: string;
  parts: Part[];
}

export default function AutofreiSolicitacoes() {
  const [, setLocation] = useLocation();
  const [requests, setRequests] = useState<BudgetRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<BudgetRequest | null>(null);
  const [isResponseOpen, setIsResponseOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<BudgetResponse>({
    labor_cost: '',
    parts_cost: '',
    total_cost: '',
    estimated_days: '',
    priority: 'normal',
    observations: '',
    parts: []
  });
  const { toast } = useToast();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      
      // Token da oficina AUTOFREI
      const oficinaToken = 'auto_token_autofrei_225e2596c711cdcafa624fce2bfc6052';
      console.log('[AUTOFREI] Carregando solicitações...');
      
      // Temporariamente limpar authToken para esta requisição
      const authTokenBackup = localStorage.getItem('authToken');
      localStorage.removeItem('authToken');
      
      const response = await fetch('/api/campinas/budget-requests', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${oficinaToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Restaurar authToken original
      if (authTokenBackup) {
        localStorage.setItem('authToken', authTokenBackup);
      }
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Filtrar apenas solicitações para AUTOFREI
          const autofreiRequests = result.data.filter((request: BudgetRequest) => 
            request.workshop_id === AUTOFREI_ID
          );
          setRequests(autofreiRequests);
          console.log(`[AUTOFREI] ${autofreiRequests.length} solicitações carregadas`);
        } else {
          console.error('[AUTOFREI] Erro na resposta:', result.message);
          setRequests([]);
        }
      } else {
        console.error('[AUTOFREI] Erro HTTP:', response.status);
        setRequests([]);
        toast({
          title: "Erro",
          description: `Erro ${response.status}: Não foi possível carregar as solicitações`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('[AUTOFREI] Erro ao carregar solicitações:', error);
      setRequests([]);
      toast({
        title: "Erro",
        description: "Erro de conexão ao carregar solicitações",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pendente': { 
        label: '⏳ Pendente', 
        className: 'bg-orange-100 text-orange-800 border-orange-300'
      },
      'em_analise': { 
        label: '🔍 Em Análise', 
        className: 'bg-blue-100 text-blue-800 border-blue-300'
      },
      'aprovado': { 
        label: '✅ Aprovado', 
        className: 'bg-green-100 text-green-800 border-green-300'
      },
      'rejeitado': { 
        label: '❌ Recusado', 
        className: 'bg-red-100 text-red-800 border-red-300'
      },
      'recusado': { 
        label: '❌ Recusado', 
        className: 'bg-red-100 text-red-800 border-red-300'
      }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { label: status, className: 'bg-gray-100 text-gray-800 border-gray-300' };
    
    return <Badge variant="default" className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleOpenResponse = (request: BudgetRequest) => {
    setSelectedRequest(request);
    
    // Criar entrada genérica com a descrição do serviço
    const totalValue = parseFloat(request.estimated_value?.toString() || request.approved_value?.toString() || '0');
    const genericPart: Part = {
      id: `generic_part_${Date.now()}`,
      name: 'Serviço',
      description: request.description || 'Serviço',
      quantity: 1,
      unit_price: totalValue > 0 ? totalValue.toString() : '',
      isFromRequest: true
    };
    
    setResponse({
      labor_cost: '',
      parts_cost: '',
      total_cost: totalValue > 0 ? totalValue.toFixed(2) : '',
      estimated_days: '',
      priority: 'normal',
      observations: '',
      parts: [genericPart]
    });
    setIsResponseOpen(true);
  };

  const addPart = () => {
    const newPart: Part = {
      id: `part_${Date.now()}`,
      name: '',
      description: '',
      quantity: 1,
      unit_price: '',
      isFromRequest: false
    };
    setResponse(prev => ({
      ...prev,
      parts: [...prev.parts, newPart]
    }));
  };

  const removePart = (partId: string) => {
    setResponse(prev => ({
      ...prev,
      parts: prev.parts.filter(part => part.id !== partId)
    }));
  };

  const updatePart = (partId: string, field: keyof Omit<Part, 'id'>, value: string | number) => {
    setResponse(prev => ({
      ...prev,
      parts: prev.parts.map(part => 
        part.id === partId ? { ...part, [field]: value } : part
      )
    }));
  };

  const calculatePartsTotal = () => {
    return response.parts.reduce((total, part) => {
      const unitPrice = parseFloat(part.unit_price) || 0;
      return total + (unitPrice * part.quantity);
    }, 0);
  };

  const calculateTotal = () => {
    const laborCost = parseFloat(response.labor_cost) || 0;
    const partsTotal = calculatePartsTotal();
    return laborCost + partsTotal;
  };

  const handleCalculateTotal = () => {
    const total = calculateTotal();
    setResponse(prev => ({
      ...prev,
      total_cost: total.toFixed(2),
      parts_cost: calculatePartsTotal().toFixed(2)
    }));
  };

  const handleInputChange = (field: keyof BudgetResponse, value: string) => {
    setResponse(prev => ({ ...prev, [field]: value }));
  };

  const handleViewRequest = async (request: BudgetRequest) => {
    setSelectedRequest(request);
    
    // Carregar dados existentes se houver um orçamento salvo
    try {
      const token = localStorage.getItem('oficina_token') || 'auto_token_autofrei_225e2596c711cdcafa624fce2bfc6052';
      
      const response = await fetch(`/api/campinas/budget-requests/${request.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const budgetData = result.data;
        
        let requestParts: Part[] = [];
        
        // PRIMEIRO: Carregar peças da solicitação original (se houver)
        if (budgetData && budgetData.parts_json) {
          try {
            // O parts_json pode estar como string escapada, então precisamos fazer parse duplo
            let parsedParts = budgetData.parts_json;
            if (typeof parsedParts === 'string') {
              parsedParts = JSON.parse(parsedParts);
            }
            if (typeof parsedParts === 'string') {
              parsedParts = JSON.parse(parsedParts);
            }
            
            if (Array.isArray(parsedParts) && parsedParts.length > 0) {
              requestParts = parsedParts.map((part, index) => ({
                id: `request_part_${index}_${Date.now()}`,
                name: part.name || '',
                description: part.description || part.name || '',
                quantity: part.quantity || 1,
                unit_price: (part.unit_price || part.value || 0).toString(),
                isFromRequest: true
              }));
            } else {
              // parts_json existe mas está vazio - criar entrada genérica
              const totalValue = parseFloat(budgetData.estimated_value || budgetData.approved_value || '0');
              requestParts = [{
                id: `generic_part_${Date.now()}`,
                name: 'Serviço',
                description: budgetData.description || request.description || 'Serviço',
                quantity: 1,
                unit_price: totalValue.toString(),
                isFromRequest: true
              }];
            }
          } catch (e) {
            console.error('Erro ao processar parts_json da solicitação:', e);
            // Em caso de erro, criar entrada genérica
            const totalValue = parseFloat(budgetData.estimated_value || budgetData.approved_value || '0');
            requestParts = [{
              id: `generic_part_${Date.now()}`,
              name: 'Serviço',
              description: budgetData.description || request.description || 'Serviço',
              quantity: 1,
              unit_price: totalValue.toString(),
              isFromRequest: true
            }];
          }
        } else {
          // NÃO há parts_json - criar entrada genérica com a descrição
          const totalValue = parseFloat(budgetData.estimated_value || budgetData.approved_value || '0');
          requestParts = [{
            id: `generic_part_${Date.now()}`,
            name: 'Serviço',
            description: budgetData.description || request.description || 'Serviço',
            quantity: 1,
            unit_price: totalValue.toString(),
            isFromRequest: true
          }];
        }
        
        // Se existe um orçamento já respondido, carregar os dados salvos
        if (budgetData && budgetData.estimated_value) {
          // Calcular valores
          const partsTotal = requestParts.reduce((total, part) => total + (parseFloat(part.unit_price) * part.quantity), 0);
          const estimatedValue = parseFloat(budgetData.estimated_value) || 0;
          const laborCost = Math.max(0, estimatedValue - partsTotal);
          
          setResponse({
            labor_cost: laborCost.toString(),
            parts_cost: partsTotal.toFixed(2),
            total_cost: estimatedValue.toFixed(2),
            estimated_days: budgetData.estimated_days ? budgetData.estimated_days.toString() : '',
            priority: budgetData.priority || 'normal',
            observations: budgetData.observations || '',
            parts: requestParts
          });
        } else {
          // Orçamento novo - carregar peças da solicitação sem preços
          setResponse({
            labor_cost: '',
            parts_cost: '',
            total_cost: '',
            estimated_days: '',
            priority: 'normal',
            observations: '',
            parts: requestParts.map(part => ({ ...part, unit_price: '' })) // Limpar preços para nova cotação
          });
        }
      } else {
        console.error('Erro ao carregar dados do orçamento:', response.status);
        // Fallback para inicialização vazia com entrada genérica
        const totalValue = parseFloat(request.estimated_value?.toString() || request.approved_value?.toString() || '0');
        setResponse({
          labor_cost: '',
          parts_cost: '',
          total_cost: totalValue.toFixed(2),
          estimated_days: '',
          priority: 'normal',
          observations: '',
          parts: [{
            id: `generic_part_${Date.now()}`,
            name: 'Serviço',
            description: request.description || 'Serviço',
            quantity: 1,
            unit_price: totalValue.toString(),
            isFromRequest: true
          }]
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados existentes:', error);
      // Fallback para inicialização vazia com entrada genérica
      const totalValue = parseFloat(request.estimated_value?.toString() || request.approved_value?.toString() || '0');
      setResponse({
        labor_cost: '',
        parts_cost: '',
        total_cost: totalValue.toFixed(2),
        estimated_days: '',
        priority: 'normal',
        observations: '',
        parts: [{
          id: `generic_part_${Date.now()}`,
          name: 'Serviço',
          description: request.description || 'Serviço',
          quantity: 1,
          unit_price: totalValue.toString(),
          isFromRequest: true
        }]
      });
    }
    
    setIsResponseOpen(true);
  };

  const handlePrintRequest = async (request: BudgetRequest) => {
    try {
      let budgetData = null;
      
      // Tentar buscar dados completos do orçamento
      try {
        const token = localStorage.getItem('oficina_token') || 'auto_token_autofrei_225e2596c711cdcafa624fce2bfc6052';
        const apiResponse = await fetch(`/api/budget-requests/${request.id}/details`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (apiResponse.ok) {
          const result = await apiResponse.json();
          budgetData = result.data;
        }
      } catch (apiError) {
        console.log('Usando dados do estado local como fallback');
      }
      
      // Processar peças - usar dados da API ou dados do estado local
      let partsHtml = '';
      let partsTotal = 0;
      let partsToProcess = [];
      
      // Prioridade 1: Dados da API
      if (budgetData && budgetData.parts_json) {
        try {
          let parsedParts = budgetData.parts_json;
          if (typeof parsedParts === 'string') {
            parsedParts = JSON.parse(parsedParts);
          }
          if (typeof parsedParts === 'string') {
            parsedParts = JSON.parse(parsedParts);
          }
          
          if (Array.isArray(parsedParts) && parsedParts.length > 0) {
            partsToProcess = parsedParts;
          }
        } catch (error) {
          console.error('Erro ao processar peças:', error);
        }
      }
      
      // Prioridade 2: Usar dados do estado local se disponíveis  
      if (partsToProcess.length === 0 && response.parts && response.parts.length > 0) {
        partsToProcess = response.parts;
      }
      
      // Gerar HTML das peças
      if (partsToProcess.length > 0) {
        partsHtml = `
          <div style="margin: 20px 0;">
            <h3 style="margin-bottom: 10px;">PEÇAS DETALHADAS:</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
              <thead>
                <tr style="background-color: #f5f5f5;">
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Descrição</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Qtd</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Valor Unit.</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${partsToProcess.map(part => {
                  const quantity = part.quantity || 1;
                  const unitPrice = parseFloat(part.unit_price || part.value || 0);
                  const total = quantity * unitPrice;
                  partsTotal += total;
                  
                  return `
                    <tr>
                      <td style="border: 1px solid #ddd; padding: 8px;">${(part.name || part.description || 'N/A').toString()}</td>
                      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${quantity}</td>
                      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">R$ ${unitPrice.toFixed(2)}</td>
                      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">R$ ${total.toFixed(2)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            <div style="margin-top: 10px;">
              <strong>Subtotal Peças: R$ ${partsTotal.toFixed(2)}</strong>
            </div>
          </div>
        `;
      }

      // Criar HTML completo para impressão
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Orçamento - ${request.vehicle_plate}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { margin-bottom: 20px; }
            .title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .info-line { margin: 5px 0; }
            .section { margin: 20px 0; }
            .values { margin: 15px 0; padding: 10px; background-color: #f9f9f9; border-left: 4px solid #007bff; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
            hr { margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <h1 style="margin: 0; font-size: 18px; font-weight: bold;">Auto Center Rio de Janeiro LTDA</h1>
              <div style="text-align: right; font-size: 10px;">
                <div>${new Date().toLocaleDateString('pt-BR')}</div>
                <div>about:blank</div>
              </div>
            </div>
            <div style="font-size: 12px; margin-top: 5px;">
              <div>CNPJ: 98.765.432/0001-10</div>
              <div>Endereço: Av. Brasil, 456 - Rio de Janeiro, RJ</div>
              <div>Telefone: (21) 87654-3210</div>
              <div>Email: contato@autocenter-rj.com</div>
            </div>
          </div>
          
          <hr>
          
          <div class="title">Orçamento - ${request.vehicle_plate}</div>
          
          <div class="section">
            <div class="info-line"><strong>Veículo:</strong> ${request.vehicle_plate} - ${request.vehicle_model}</div>
            <div class="info-line"><strong>Descrição:</strong> ${request.description}</div>
            <div class="info-line"><strong>Projeto:</strong> ${budgetData?.project_name || request.project_name || 'N/A'}</div>
            <div class="info-line"><strong>Base:</strong> ${budgetData?.base_name || request.base_name || 'N/A'}</div>
            <div class="info-line"><strong>Status:</strong> ${request.status}</div>
            <div class="info-line"><strong>Data:</strong> ${formatDate(request.created_at)}</div>
            ${request.chassis ? `<div class="info-line"><strong>Chassis:</strong> ${request.chassis}</div>` : ''}
            ${request.km ? `<div class="info-line"><strong>KM:</strong> ${request.km.toLocaleString()}</div>` : ''}
            ${budgetData?.approved_by || budgetData?.approver_name ? `<div class="info-line"><strong>Aprovado por:</strong> ${budgetData.approver_name || budgetData.approved_by || 'Administrador'}</div>` : ''}
            ${budgetData?.approved_at ? `<div class="info-line"><strong>Data de aprovação:</strong> ${new Date(budgetData.approved_at).toLocaleDateString('pt-BR')}</div>` : ''}
          </div>
          
          <hr>
          
          <div class="values">
            ${request.estimated_value ? `<div><strong>Valor Estimado:</strong> R$ ${Number(request.estimated_value).toFixed(2)}</div>` : ''}
            ${request.approved_value ? `<div><strong>Valor Aprovado:</strong> R$ ${Number(request.approved_value).toFixed(2)}</div>` : ''}
          </div>
          
          ${partsHtml}
          
          <div class="footer">
            <div>Orçamento gerado em: ${new Date().toLocaleString('pt-BR')}</div>
            <div>Este orçamento tem validade de 30 dias.</div>
          </div>
        </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
        
        toast({
          title: "Sucesso",
          description: "PDF gerado com sucesso!",
        });
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF do orçamento",
        variant: "destructive",
      });
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedRequest) return;

    // Validação básica
    if (!response.labor_cost || !response.estimated_days) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha Mão de Obra e Prazo Estimado",
        variant: "destructive"
      });
      return;
    }

    // Calcular valores finais
    const partsTotal = calculatePartsTotal();
    const totalValue = calculateTotal();

    try {
      setIsSubmitting(true);
      
      const token = localStorage.getItem('oficina_token') || 'auto_token_autofrei_225e2596c711cdcafa624fce2bfc6052';
      
      const submitData = {
        request_id: selectedRequest.id,
        labor_cost: parseFloat(response.labor_cost),
        parts_cost: partsTotal,
        total_cost: totalValue,
        estimated_days: parseInt(response.estimated_days),
        priority: response.priority,
        observations: response.observations,
        workshop_id: AUTOFREI_ID,
        parts_json: JSON.stringify(response.parts.map(part => ({
          name: part.name,
          description: part.description,
          quantity: part.quantity,
          unit_price: parseFloat(part.unit_price) || 0,
          total_price: (parseFloat(part.unit_price) || 0) * part.quantity
        }))),
        parts_breakdown: response.parts.map(part => ({
          name: part.name,
          description: part.description,
          quantity: part.quantity,
          unit_price: parseFloat(part.unit_price) || 0,
          total_price: (parseFloat(part.unit_price) || 0) * part.quantity
        }))
      };

      console.log('[AUTOFREI] Enviando cotação com peças detalhadas:', submitData);
      
      const response_data = await fetch('/api/budget-requests/respond', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (response_data.ok) {
        const result = await response_data.json();
        
        if (result.success) {
          toast({
            title: "Cotação Enviada!",
            description: "Sua cotação detalhada foi enviada com sucesso para a gestão de frotas",
            variant: "default"
          });
          
          setIsResponseOpen(false);
          setSelectedRequest(null);
          
          // Recarregar lista de solicitações
          loadRequests();
        } else {
          throw new Error(result.message || 'Erro ao enviar cotação');
        }
      } else {
        throw new Error('Erro na comunicação com o servidor');
      }
      
    } catch (error) {
      console.error('[AUTOFREI] Erro ao enviar cotação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a cotação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/oficina/autofrei/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Solicitações de Orçamento</h1>
            <p className="text-gray-600">Visualize todas as solicitações recebidas da gestão de frotas</p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{requests.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {requests.filter(r => r.status === 'pendente').length}
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
                  <p className="text-sm text-gray-600">Em Análise</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {requests.filter(r => r.status === 'em_analise').length}
                  </p>
                </div>
                <Settings className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aprovados</p>
                  <p className="text-2xl font-bold text-green-600">
                    {requests.filter(r => r.status === 'aprovado').length}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botão de Atualizar */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Lista de Solicitações</h2>
          <Button onClick={loadRequests} disabled={isLoading} variant="outline">
            {isLoading ? "Carregando..." : "Atualizar"}
          </Button>
        </div>

        {/* Lista de Solicitações */}
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : requests.length > 0 ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-40">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        #{request.id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium text-sm">{request.description}</p>
                        {(request.chassis || request.km) && (
                          <p className="text-xs text-gray-500 mt-1">
                            {request.chassis && `Chassis: ${request.chassis}`}
                            {request.chassis && request.km && ' • '}
                            {request.km && `KM: ${request.km.toLocaleString()}`}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-sm">{request.vehicle_plate}</p>
                          <p className="text-xs text-gray-500">{request.vehicle_model}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.projeto ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{request.projeto}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {request.requester_name ? (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{request.requester_name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{formatDate(request.created_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {request.status === 'aprovado' ? (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewRequest(request)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handlePrintRequest(request)}
                              className="bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                            >
                              <Printer className="h-4 w-4 mr-1" />
                              Imprimir
                            </Button>
                          </>
                        ) : request.status === 'recusado' || request.status === 'rejeitado' ? (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewRequest(request)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleOpenResponse(request)}
                              className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Alterar
                            </Button>
                          </>
                        ) : request.status === 'em_negociacao' ? (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewRequest(request)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleOpenResponse(request)}
                              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Responder
                            </Button>
                          </>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => handleOpenResponse(request)}
                            className="w-full"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Responder
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Card>
            <CardContent className="text-center p-8">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma Solicitação Encontrada
              </h3>
              <p className="text-gray-600">
                Não há solicitações de orçamento para sua oficina no momento.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Resposta/Visualização */}
      <Dialog open={isResponseOpen} onOpenChange={setIsResponseOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRequest?.status === 'aprovado' ? (
                <>
                  <Eye className="h-5 w-5 text-green-500" />
                  Orçamento Aprovado #{selectedRequest?.id}
                </>
              ) : selectedRequest?.status === 'recusado' || selectedRequest?.status === 'rejeitado' ? (
                <>
                  <Edit className="h-5 w-5 text-orange-500" />
                  Alterar Orçamento #{selectedRequest?.id}
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 text-blue-500" />
                  Responder Solicitação #{selectedRequest?.id}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.vehicle_plate} - {selectedRequest?.vehicle_model}
              <br />
              <strong>Serviço:</strong> {selectedRequest?.description}
              <br />
              <div className="mt-2">
                <strong>Status:</strong> {getStatusBadge(selectedRequest?.status || '')}
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Custos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="labor_cost">Mão de Obra (R$)</Label>
                <Input
                  id="labor_cost"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={response.labor_cost}
                  onChange={(e) => handleInputChange('labor_cost', e.target.value)}
                  disabled={selectedRequest?.status === 'aprovado'}
                />
              </div>
            </div>

            {/* Seção de Peças */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Peças/Materiais</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPart}
                  className="flex items-center gap-1"
                  disabled={selectedRequest?.status === 'aprovado'}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Peça
                </Button>
              </div>

              {/* Lista de Peças */}
              {response.parts.length > 0 && (
                <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
                  {response.parts.map((part, index) => (
                    <div key={part.id} className="space-y-2 border-b border-gray-200 pb-3 last:border-b-0">
                      {part.isFromRequest && (
                        <div className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                          ⚙️ Peça da Solicitação Original
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {/* Nome */}
                        <div>
                          <Label className="text-xs text-gray-600">Nome da Peça</Label>
                          <Input
                            placeholder="Nome da peça/material"
                            value={part.name}
                            onChange={(e) => updatePart(part.id, 'name', e.target.value)}
                            disabled={selectedRequest?.status === 'aprovado' || part.isFromRequest}
                            className={part.isFromRequest ? 'bg-blue-50' : ''}
                          />
                        </div>
                        
                        {/* Descrição */}
                        <div>
                          <Label className="text-xs text-gray-600">Descrição</Label>
                          <Input
                            placeholder="Descrição detalhada"
                            value={part.description}
                            onChange={(e) => updatePart(part.id, 'description', e.target.value)}
                            disabled={selectedRequest?.status === 'aprovado' || part.isFromRequest}
                            className={part.isFromRequest ? 'bg-blue-50' : ''}
                          />
                        </div>
                        
                        {/* Quantidade */}
                        <div>
                          <Label className="text-xs text-gray-600">Qtd</Label>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Qtd"
                            value={part.quantity}
                            onChange={(e) => updatePart(part.id, 'quantity', parseInt(e.target.value) || 1)}
                            disabled={selectedRequest?.status === 'aprovado' || part.isFromRequest}
                            className={part.isFromRequest ? 'bg-blue-50' : ''}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Preço Unitário */}
                        <div className="flex-1">
                          <Label className="text-xs text-gray-600">Preço Unitário (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            value={part.unit_price}
                            onChange={(e) => updatePart(part.id, 'unit_price', e.target.value)}
                            disabled={selectedRequest?.status === 'aprovado'}
                            className="font-medium"
                          />
                        </div>
                        
                        {/* Total da Peça */}
                        <div className="w-32">
                          <Label className="text-xs text-gray-600">Total</Label>
                          <div className="h-10 bg-gray-100 border rounded px-3 flex items-center text-sm font-medium">
                            R$ {((parseFloat(part.unit_price) || 0) * part.quantity).toFixed(2)}
                          </div>
                        </div>
                        
                        {/* Botão Remover (apenas para peças adicionais) */}
                        {!part.isFromRequest && (
                          <div className="pt-5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removePart(part.id)}
                              className="text-red-600 hover:text-red-700"
                              disabled={selectedRequest?.status === 'aprovado'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Total das Peças */}
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span>Total das Peças:</span>
                      <span>R$ {calculatePartsTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {response.parts.length === 0 && (
                <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="font-medium">Nenhuma peça solicitada</p>
                  <p className="text-sm mt-1">Esta solicitação não possui lista de peças específicas.</p>
                  <p className="text-sm">Use "Adicionar Peça" para incluir materiais necessários.</p>
                </div>
              )}
            </div>

            {/* Valor Total */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-base font-medium">
                <Calculator className="h-4 w-4" />
                Valor Total (R$) *
              </Label>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Mão de Obra:</span>
                    <span>R$ {(parseFloat(response.labor_cost) || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peças/Materiais:</span>
                    <span>R$ {calculatePartsTotal().toFixed(2)}</span>
                  </div>
                  <div className="border-t border-blue-300 pt-2 flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>R$ {calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleCalculateTotal}
                className="w-full"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Atualizar Valores
              </Button>
            </div>

            {/* Prazo e Prioridade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_days">Prazo Estimado (dias) *</Label>
                <Input
                  id="estimated_days"
                  type="number"
                  min="1"
                  placeholder="Ex: 3"
                  value={response.estimated_days}
                  onChange={(e) => setResponse(prev => ({ ...prev, estimated_days: e.target.value }))}
                  disabled={selectedRequest?.status === 'aprovado'}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={response.priority} onValueChange={(value) => setResponse(prev => ({ ...prev, priority: value }))} disabled={selectedRequest?.status === 'aprovado'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                placeholder="Informações adicionais sobre o serviço, condições, garantia, etc..."
                value={response.observations}
                onChange={(e) => setResponse(prev => ({ ...prev, observations: e.target.value }))}
                rows={4}
                disabled={selectedRequest?.status === 'aprovado'}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsResponseOpen(false)}
              disabled={isSubmitting}
            >
              {selectedRequest?.status === 'aprovado' ? 'Fechar' : 'Cancelar'}
            </Button>
            
            {selectedRequest?.status === 'aprovado' && (
              <Button 
                variant="outline"
                onClick={() => selectedRequest && handlePrintRequest(selectedRequest)}
                className="flex items-center gap-1"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
            )}
            
            {selectedRequest?.status !== 'aprovado' && (
              <Button 
                onClick={handleSubmitResponse}
                disabled={isSubmitting || !response.labor_cost || !response.estimated_days}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isSubmitting ? 'Enviando...' : 
                 selectedRequest?.status === 'recusado' || selectedRequest?.status === 'rejeitado' ? 'Enviar Novamente' : 'Enviar Cotação'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}