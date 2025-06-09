import { useState, useEffect } from 'react';
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
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Payment {
  id: number;
  service_id: number;
  partner_id: number;
  partner_name: string;
  vehicle_plate: string;
  service_value: string;
  payment_status: 'pendente' | 'pago' | 'em_processamento' | 'cancelado';
  payment_date: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  service_table: string;
}

interface PaymentSummary {
  total_services: number;
  paid_services: number;
  pending_services: number;
  processing_services: number;
  total_value: string;
  paid_value: string;
  pending_value: string;
}

interface PartnerSummary {
  id: number;
  partner_name: string;
  total_services: number;
  paid_services: number;
  pending_services: number;
  total_value: string;
  paid_value: string;
  pending_value: string;
}

export default function FinanceiroGuincho() {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPartner, setSelectedPartner] = useState('');
  const [activeTab, setActiveTab] = useState('report');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar resumo financeiro
  const { data: financialSummary, isLoading: summaryLoading } = useQuery({
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
  const { data: partnerReport, isLoading: reportLoading } = useQuery({
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

  // Buscar resumo financeiro
  const { data: summary } = useQuery<PaymentSummary>({
    queryKey: ['/api/towing/payments/summary'],
  });

  // Buscar resumo por parceiro
  const { data: partnerSummary = [] } = useQuery<PartnerSummary[]>({
    queryKey: ['/api/towing/payments/by-partner'],
  });

  // Mutation para atualizar pagamento
  const updatePaymentMutation = useMutation({
    mutationFn: async (data: { id: number; paymentData: any }) => {
      const response = await fetch(`/api/towing/payments/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.paymentData),
      });
      if (!response.ok) throw new Error('Erro ao atualizar pagamento');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/towing/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/towing/payments/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/towing/payments/by-partner'] });
      toast({ title: 'Sucesso', description: 'Pagamento atualizado com sucesso!' });
      setIsEditModalOpen(false);
      setSelectedPayment(null);
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao atualizar pagamento', variant: 'destructive' });
    },
  });

  // Mutation para criar pagamento
  const createPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await fetch('/api/towing/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      if (!response.ok) throw new Error('Erro ao criar pagamento');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/towing/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/towing/payments/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/towing/payments/by-partner'] });
      toast({ title: 'Sucesso', description: 'Pagamento criado com sucesso!' });
      setIsCreateModalOpen(false);
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao criar pagamento', variant: 'destructive' });
    },
  });

  // Mutation para excluir pagamento
  const deletePaymentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/towing/payments/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao excluir pagamento');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/towing/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/towing/payments/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/towing/payments/by-partner'] });
      toast({ title: 'Sucesso', description: 'Pagamento excluído com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao excluir pagamento', variant: 'destructive' });
    },
  });

  // Mutation para excluir serviço de guincho
  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: number) => {
      // Usar apiRequest para garantir autenticação adequada
      const response = await apiRequest('DELETE', `/api/towing/payments/services/${serviceId}`);
      return response;
    },
    onSuccess: (data) => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['/api/towing/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/towing/payments/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/towing/payments/by-partner'] });
      queryClient.invalidateQueries({ queryKey: ['/api/towing/payments/detailed-report'] });
      
      // Forçar um refetch imediato
      queryClient.refetchQueries({ queryKey: ['/api/towing/payments'] });
      
      toast({ 
        title: 'Sucesso', 
        description: `Serviço #${data.deletedServiceId} excluído com sucesso!`
      });
    },
    onError: (error: Error) => {
      console.error('Erro ao excluir serviço:', error);
      toast({ 
        title: 'Erro', 
        description: error.message || 'Erro ao excluir serviço', 
        variant: 'destructive' 
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pago':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pendente':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'em_processamento':
        return <CreditCard className="w-4 h-4 text-blue-500" />;
      case 'cancelado':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return 'bg-green-100 text-green-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'em_processamento':
        return 'bg-blue-100 text-blue-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value: string | number | null | undefined) => {
    const numericValue = parseFloat(String(value || 0));
    if (isNaN(numericValue)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numericValue);
  };

  const handleQuickStatusUpdate = (payment: Payment, newStatus: string) => {
    const updateData = {
      paymentStatus: newStatus,
      paymentDate: newStatus === 'pago' ? new Date().toISOString() : null,
      paymentMethod: payment.payment_method,
      paymentReference: payment.payment_reference,
      notes: payment.notes,
    };

    updatePaymentMutation.mutate({
      id: payment.id,
      paymentData: updateData,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Módulo Financeiro - Serviços de Guincho</h1>
          <p className="text-gray-600 mt-2">Gerencie pagamentos e acompanhe o faturamento dos serviços prestados</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Pagamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Novo Pagamento</DialogTitle>
            </DialogHeader>
            <CreatePaymentForm 
              onSubmit={(data) => createPaymentMutation.mutate(data)}
              isLoading={createPaymentMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros para Relatório Detalhado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Relatório Detalhado de Serviços por Parceiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
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
                  {detailedReport?.services_by_partner?.map((partner: any) => (
                    <SelectItem key={partner.partner_info.id} value={partner.partner_info.id.toString()}>
                      {partner.partner_info.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Geral do Relatório */}
      {detailedReport?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Serviços</p>
                  <p className="text-2xl font-bold">{detailedReport.summary.total_services}</p>
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
                  <p className="text-2xl font-bold">{detailedReport.summary.total_partners}</p>
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
                  <p className="text-2xl font-bold">R$ {detailedReport.summary.total_value?.toFixed(2)}</p>
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
                  <p className="text-2xl font-bold text-green-600">R$ {detailedReport.summary.paid_value?.toFixed(2)}</p>
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
                  <p className="text-2xl font-bold text-yellow-600">R$ {detailedReport.summary.pending_value?.toFixed(2)}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Serviços Detalhados por Parceiro */}
      {detailedReport?.services_by_partner && detailedReport.services_by_partner.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Serviços por Parceiro</h2>
          {detailedReport.services_by_partner.map((partnerData: any) => (
            <Card key={partnerData.partner_info.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{partnerData.partner_info.name}</CardTitle>
                    {partnerData.partner_info.company_name && (
                      <p className="text-sm text-gray-600">{partnerData.partner_info.company_name}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                      {partnerData.partner_info.phone && (
                        <span>📞 {partnerData.partner_info.phone}</span>
                      )}
                      {partnerData.partner_info.email && (
                        <span>📧 {partnerData.partner_info.email}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      R$ {partnerData.totals.total_value.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {partnerData.totals.count} serviços
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        {partnerData.totals.paid_count} pagos
                      </Badge>
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        {partnerData.totals.pending_count} pendentes
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Nº Serviço</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Data</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Placa</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Serviço</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Origem → Destino</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Motorista</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Valor</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partnerData.services.map((service: any, index: number) => (
                        <tr key={service.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              #{index + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {service.service_date ? format(new Date(service.service_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">{service.vehicle_plate}</td>
                          <td className="px-4 py-3 text-sm">{service.service_type}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="text-xs">
                              <div>📍 {service.pickup_location}</div>
                              <div>🎯 {service.destination}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{service.driver_name || '-'}</td>
                          <td className="px-4 py-3 text-sm font-bold text-blue-600">
                            R$ {parseFloat(service.actual_cost || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge 
                              variant={service.status === 'aprovado' ? 'default' : 'secondary'}
                              className={service.status === 'aprovado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                            >
                              {service.payment_status_display}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (window.confirm(`Tem certeza que deseja excluir o serviço #${index + 1}? Esta ação não pode ser desfeita.`)) {
                                  deleteServiceMutation.mutate(service.id);
                                }
                              }}
                              disabled={deleteServiceMutation.isPending}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {reportLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando relatório detalhado...</p>
          </CardContent>
        </Card>
      )}



      {/* Resumo por Parceiro */}
      {partnerSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Resumo por Parceiro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Parceiro</th>
                    <th className="text-center p-2">Serviços</th>
                    <th className="text-center p-2">Pagos</th>
                    <th className="text-right p-2">Valor Total</th>
                    <th className="text-right p-2">Valor Pago</th>
                    <th className="text-right p-2">Pendente</th>
                  </tr>
                </thead>
                <tbody>
                  {partnerSummary.map((partner) => (
                    <tr key={partner.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{partner.partner_name}</td>
                      <td className="text-center p-2">{partner.total_services}</td>
                      <td className="text-center p-2">
                        <Badge variant="outline" className="text-green-600">
                          {partner.paid_services}
                        </Badge>
                      </td>
                      <td className="text-right p-2">{formatCurrency(partner.total_value)}</td>
                      <td className="text-right p-2 text-green-600">{formatCurrency(partner.paid_value)}</td>
                      <td className="text-right p-2 text-yellow-600">{formatCurrency(partner.pending_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum pagamento registrado ainda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Serviço</th>
                    <th className="text-left p-3">Parceiro</th>
                    <th className="text-left p-3">Veículo</th>
                    <th className="text-right p-3">Valor</th>
                    <th className="text-center p-3">Status</th>
                    <th className="text-center p-3">Data Pagamento</th>
                    <th className="text-center p-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="text-sm">
                          <div className="font-medium">Serviço #{payment.service_id}</div>
                          <div className="text-gray-500">
                            {format(new Date(payment.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">{payment.partner_name}</td>
                      <td className="p-3 font-mono">{payment.vehicle_plate}</td>
                      <td className="p-3 text-right font-bold">{formatCurrency(payment.service_value)}</td>
                      <td className="p-3 text-center">
                        <Badge className={getStatusColor(payment.payment_status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(payment.payment_status)}
                            {payment.payment_status.replace('_', ' ')}
                          </span>
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        {payment.payment_date 
                          ? format(new Date(payment.payment_date), 'dd/MM/yyyy', { locale: ptBR })
                          : '-'
                        }
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {payment.payment_status === 'pendente' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickStatusUpdate(payment, 'pago')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setIsEditModalOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deletePaymentMutation.mutate(payment.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Pagamento</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <EditPaymentForm
              payment={selectedPayment}
              onSubmit={(data) => 
                updatePaymentMutation.mutate({
                  id: selectedPayment.id,
                  paymentData: data,
                })
              }
              isLoading={updatePaymentMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente de formulário para criar pagamento
function CreatePaymentForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    serviceId: '',
    partnerId: '',
    vehiclePlate: '',
    serviceValue: '',
    paymentStatus: 'pendente',
    paymentMethod: '',
    paymentReference: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      serviceId: parseInt(formData.serviceId),
      partnerId: parseInt(formData.partnerId),
      vehiclePlate: formData.vehiclePlate,
      serviceValue: parseFloat(formData.serviceValue),
      paymentStatus: formData.paymentStatus,
      paymentMethod: formData.paymentMethod || null,
      paymentReference: formData.paymentReference || null,
      notes: formData.notes || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="serviceId">ID do Serviço</Label>
          <Input
            id="serviceId"
            type="number"
            value={formData.serviceId}
            onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="partnerId">ID do Parceiro</Label>
          <Input
            id="partnerId"
            type="number"
            value={formData.partnerId}
            onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="vehiclePlate">Placa do Veículo</Label>
        <Input
          id="vehiclePlate"
          value={formData.vehiclePlate}
          onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="serviceValue">Valor do Serviço (R$)</Label>
        <Input
          id="serviceValue"
          type="number"
          step="0.01"
          value={formData.serviceValue}
          onChange={(e) => setFormData({ ...formData, serviceValue: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="paymentStatus">Status do Pagamento</Label>
        <Select value={formData.paymentStatus} onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="em_processamento">Em Processamento</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="paymentMethod">Método de Pagamento</Label>
        <Input
          id="paymentMethod"
          value={formData.paymentMethod}
          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
          placeholder="PIX, Transferência, etc."
        />
      </div>

      <div>
        <Label htmlFor="paymentReference">Referência do Pagamento</Label>
        <Input
          id="paymentReference"
          value={formData.paymentReference}
          onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
          placeholder="Comprovante, ID da transação, etc."
        />
      </div>

      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Criando...' : 'Criar Pagamento'}
      </Button>
    </form>
  );
}

// Componente de formulário para editar pagamento
function EditPaymentForm({ payment, onSubmit, isLoading }: { payment: Payment; onSubmit: (data: any) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    paymentStatus: payment.payment_status,
    paymentMethod: payment.payment_method || '',
    paymentReference: payment.payment_reference || '',
    notes: payment.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      paymentStatus: formData.paymentStatus,
      paymentDate: formData.paymentStatus === 'pago' ? new Date().toISOString() : payment.payment_date,
      paymentMethod: formData.paymentMethod || null,
      paymentReference: formData.paymentReference || null,
      notes: formData.notes || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-3 rounded-lg mb-4">
        <div className="text-sm text-gray-600">
          <div><strong>Serviço:</strong> #{payment.service_id}</div>
          <div><strong>Parceiro:</strong> {payment.partner_name}</div>
          <div><strong>Veículo:</strong> {payment.vehicle_plate}</div>
          <div><strong>Valor:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(payment.service_value))}</div>
        </div>
      </div>

      <div>
        <Label htmlFor="paymentStatus">Status do Pagamento</Label>
        <Select value={formData.paymentStatus} onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="em_processamento">Em Processamento</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="paymentMethod">Método de Pagamento</Label>
        <Input
          id="paymentMethod"
          value={formData.paymentMethod}
          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
          placeholder="PIX, Transferência, etc."
        />
      </div>

      <div>
        <Label htmlFor="paymentReference">Referência do Pagamento</Label>
        <Input
          id="paymentReference"
          value={formData.paymentReference}
          onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
          placeholder="Comprovante, ID da transação, etc."
        />
      </div>

      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Salvando...' : 'Salvar Alterações'}
      </Button>
    </form>
  );
}