import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  DollarSign, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus,
  Edit,
  Trash2,
  Calculator,
  TrendingUp,
  Users,
  Truck,
  Eye,
  FileText,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FinancialService {
  id: number;
  guincho_service_id: number;
  partner_id: number;
  partner_name: string;
  vehicle_plate: string;
  service_description: string;
  service_date: string;
  total_amount: string | number;
  pickup_location: string;
  destination: string;
  approved_at: string;
  approved_by: number;
  payment_status: 'pending' | 'paid' | 'cancelled';
  payment_date?: string;
  payment_reference?: string;
  payment_method?: string;
  payment_number?: string;
  notes?: string;
  created_at: string;
}

interface FinancialSummary {
  summary: {
    totalServices: number;
    paidServices: number;
    pendingServices: number;
    totalValue: number;
    paidValue: number;
    pendingValue: number;
  };
}

interface PartnerReport {
  partners: Array<{
    id: number;
    partner_name: string;
    total_services: number;
    paid_services: number;
    pending_services: number;
    total_value: string;
    paid_value: string;
    pending_value: string;
  }>;
}

export default function FinanceiroGuincho() {
  const [selectedService, setSelectedService] = useState<FinancialService | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPartner, setSelectedPartner] = useState('');
  const [activeTab, setActiveTab] = useState('services');
  const [paymentData, setPaymentData] = useState({
    payment_date: '',
    payment_reference: '',
    payment_method: '',
    invoice_number: '',
    notes: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar resumo financeiro
  const { data: financialSummary, isLoading: summaryLoading } = useQuery<FinancialSummary>({
    queryKey: ['/api/towing/financial/summary', startDate, endDate, selectedPartner || undefined],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (selectedPartner) params.append('partner_id', selectedPartner);
      
      const response = await fetch(`/api/towing/financial/summary?${params}`);
      if (!response.ok) throw new Error('Erro ao buscar resumo financeiro');
      return response.json();
    },
  });

  // Buscar serviços financeiros
  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ['/api/towing/financial/services', startDate, endDate, selectedPartner || undefined],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (selectedPartner) params.append('partner_id', selectedPartner);
      
      const response = await fetch(`/api/towing/financial/services?${params}`);
      if (!response.ok) throw new Error('Erro ao buscar serviços');
      return response.json();
    },
  });

  // Buscar relatório por parceiro
  const { data: partnerReport, isLoading: reportLoading } = useQuery<PartnerReport>({
    queryKey: ['/api/towing/financial/report', startDate, endDate, selectedPartner || undefined],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (selectedPartner) params.append('partner_id', selectedPartner);
      
      const response = await fetch(`/api/towing/financial/report?${params}`);
      if (!response.ok) throw new Error('Erro ao buscar relatório');
      return response.json();
    },
  });

  // Processar pagamento
  const processPaymentMutation = useMutation({
    mutationFn: async (serviceId: number) => {
      const response = await fetch(`/api/towing/financial/payment/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...paymentData,
          payment_date: paymentData.payment_date || new Date().toISOString().split('T')[0]
        })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao processar pagamento');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Pagamento processado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/towing/financial/services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/towing/financial/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/towing/financial/report'] });
      setIsPaymentModalOpen(false);
      setSelectedService(null);
      setPaymentData({
        payment_date: '',
        payment_reference: '',
        payment_method: '',
        invoice_number: '',
        notes: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar pagamento",
        variant: "destructive",
      });
    },
  });

  // Excluir serviço financeiro
  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: number) => {
      const response = await fetch(`/api/towing/financial/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir serviço');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Serviço excluído com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/towing/financial/services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/towing/financial/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/towing/financial/report'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir serviço",
        variant: "destructive",
      });
    },
  });

  const handleProcessPayment = () => {
    if (!selectedService) return;
    processPaymentMutation.mutate(selectedService.id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Pago</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Pendente</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const services = servicesData?.services || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Módulo Financeiro - Serviços de Guincho</h1>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label className="text-sm font-medium">Data Inicial</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-48"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">Data Final</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-48"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">Parceiro</Label>
              <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Todos os parceiros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os parceiros</SelectItem>
                  {partnerReport?.partners?.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id.toString()}>
                      {partner.partner_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Financeiro */}
      {financialSummary?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Serviços</p>
                  <p className="text-2xl font-bold">{financialSummary.summary.totalServices}</p>
                </div>
                <Truck className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Parceiros Ativos</p>
                  <p className="text-2xl font-bold">{partnerReport?.partners?.length || 0}</p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold">R$ {financialSummary.summary.totalValue?.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Pago</p>
                  <p className="text-2xl font-bold text-green-600">R$ {financialSummary.summary.paidValue?.toFixed(2)}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Pendente</p>
                  <p className="text-2xl font-bold text-orange-500">R$ {financialSummary.summary.pendingValue?.toFixed(2)}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Abas */}
      <div className="flex space-x-1 border-b">
        <Button
          variant={activeTab === 'services' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('services')}
          className="rounded-b-none"
        >
          Serviços Aprovados
        </Button>
        <Button
          variant={activeTab === 'partners' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('partners')}
          className="rounded-b-none"
        >
          Relatório por Parceiros
        </Button>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'services' && (
        <Card>
          <CardHeader>
            <CardTitle>Serviços Aprovados - Gestão de Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {servicesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Parceiro</th>
                      <th className="text-left p-3">Veículo</th>
                      <th className="text-left p-3">Data Serviço</th>
                      <th className="text-center p-3">Valor</th>
                      <th className="text-center p-3">Status</th>
                      <th className="text-center p-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service: FinancialService) => (
                      <tr key={service.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">{service.partner_name}</td>
                        <td className="p-3">{service.vehicle_plate}</td>
                        <td className="p-3">
                          {format(new Date(service.service_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </td>
                        <td className="p-3 text-center">R$ {parseFloat(String(service.total_amount || 0)).toFixed(2)}</td>
                        <td className="p-3 text-center">{getStatusBadge(service.payment_status)}</td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center space-x-2">
                            {service.payment_status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedService(service);
                                  setIsPaymentModalOpen(true);
                                }}
                              >
                                <CreditCard className="w-4 h-4 mr-1" />
                                Processar Pagamento
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedService(service);
                                setIsDetailsModalOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Detalhes
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm('Tem certeza de que deseja excluir este serviço financeiro?')) {
                                  deleteServiceMutation.mutate(service.id);
                                }
                              }}
                              disabled={deleteServiceMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'partners' && (
        <Card>
          <CardHeader>
            <CardTitle>Relatório por Parceiros</CardTitle>
          </CardHeader>
          <CardContent>
            {reportLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Parceiro</th>
                      <th className="text-center p-3">Total de Serviços</th>
                      <th className="text-center p-3">Valor Total</th>
                      <th className="text-center p-3">Valor Pago</th>
                      <th className="text-center p-3">Valor Pendente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partnerReport?.partners?.map((partner) => (
                      <tr key={partner.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium">{partner.partner_name}</td>
                        <td className="p-3 text-center">{partner.total_services}</td>
                        <td className="p-3 text-center">R$ {parseFloat(partner.total_value).toFixed(2)}</td>
                        <td className="p-3 text-center text-green-600">R$ {parseFloat(partner.paid_value).toFixed(2)}</td>
                        <td className="p-3 text-center text-orange-500">R$ {parseFloat(partner.pending_value).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Processamento de Pagamento */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Processar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedService && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Detalhes do Serviço</h4>
                <p><strong>Parceiro:</strong> {selectedService.partner_name}</p>
                <p><strong>Veículo:</strong> {selectedService.vehicle_plate}</p>
                <p><strong>Valor:</strong> R$ {parseFloat(String(selectedService.total_amount || 0)).toFixed(2)}</p>
                <p><strong>Local:</strong> {selectedService.pickup_location} → {selectedService.destination}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="payment_date">Data do Pagamento</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={paymentData.payment_date}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="payment_method">Método de Pagamento</Label>
                <Select
                  value={paymentData.payment_method}
                  onValueChange={(value) => setPaymentData({ ...paymentData, payment_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Transferência">Transferência Bancária</SelectItem>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="payment_reference">Referência do Pagamento</Label>
                <Input
                  id="payment_reference"
                  placeholder="Ex: PIX-20250609-001"
                  value={paymentData.payment_reference}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_reference: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="invoice_number">Número da Nota Fiscal</Label>
                <Input
                  id="invoice_number"
                  placeholder="Ex: NF-2025-001"
                  value={paymentData.invoice_number}
                  onChange={(e) => setPaymentData({ ...paymentData, invoice_number: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Observações sobre o pagamento..."
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleProcessPayment}
                disabled={processPaymentMutation.isPending}
              >
                {processPaymentMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Confirmar Pagamento'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes do Serviço */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Detalhes do Serviço de Guincho
            </DialogTitle>
          </DialogHeader>
          
          {selectedService && (
            <div className="space-y-6">
              {/* Informações Gerais */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Truck className="w-5 h-5 mr-2" />
                    Informações Gerais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-semibold">ID do Serviço</Label>
                      <p className="text-sm text-muted-foreground">#{selectedService.id}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Parceiro</Label>
                      <p className="text-sm">{selectedService.partner_name}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Veículo</Label>
                      <p className="text-sm">{selectedService.vehicle_plate}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Data do Serviço</Label>
                      <p className="text-sm">
                        {format(new Date(selectedService.service_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                    <div>
                      <Label className="font-semibold">Status do Pagamento</Label>
                      <div className="mt-1">
                        {getStatusBadge(selectedService.payment_status)}
                      </div>
                    </div>
                    <div>
                      <Label className="font-semibold">Valor Total</Label>
                      <p className="text-sm font-bold text-green-600">
                        R$ {parseFloat(String(selectedService.total_amount || 0)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Descrição do Serviço */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Descrição do Serviço</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedService.service_description || 'Nenhuma descrição disponível'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Localização */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações de Localização</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="font-semibold">Local de Coleta</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedService.pickup_location || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <Label className="font-semibold">Destino</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedService.destination || 'Não informado'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Informações de Aprovação */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Aprovação e Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-semibold">Data de Aprovação</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedService.approved_at 
                          ? format(new Date(selectedService.approved_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                          : 'Não aprovado'}
                      </p>
                    </div>
                    <div>
                      <Label className="font-semibold">Aprovado por (ID)</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedService.approved_by || 'Não informado'}
                      </p>
                    </div>
                    {selectedService.payment_date && (
                      <div>
                        <Label className="font-semibold">Data do Pagamento</Label>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(selectedService.payment_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    )}
                    {selectedService.payment_method && (
                      <div>
                        <Label className="font-semibold">Método de Pagamento</Label>
                        <p className="text-sm text-muted-foreground">
                          {selectedService.payment_method}
                        </p>
                      </div>
                    )}
                    {selectedService.payment_reference && (
                      <div>
                        <Label className="font-semibold">Referência do Pagamento</Label>
                        <p className="text-sm text-muted-foreground">
                          {selectedService.payment_reference}
                        </p>
                      </div>
                    )}
                    {selectedService.payment_number && (
                      <div>
                        <Label className="font-semibold">Número do Pagamento</Label>
                        <p className="text-sm text-muted-foreground">
                          {selectedService.payment_number}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <div className="flex justify-end pt-4">
            <Button onClick={() => setIsDetailsModalOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}