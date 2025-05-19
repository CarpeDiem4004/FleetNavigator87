import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatCurrency, formatDate } from '@/lib/formatters';
import PageHeader from '@/components/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, BanknoteIcon, CheckCircleIcon, ClockIcon, FilterIcon, FileTextIcon, RefreshCwIcon, BadgeAlertIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Tooltip,
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TowingService {
  id: number;
  partner_id: number;
  partner_name: string;
  company_name: string;
  vehicle_plate: string;
  pickup_location: string;
  destination: string;
  service_description?: string;
  service_type: string;
  driver_name?: string;
  service_date: string;
  actual_cost: number;
  km_traveled?: number;
  observation?: string;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'concluido';
  payment_date?: string;
  payment_reference?: string;
  payment_processed_by?: number;
  is_paid: boolean;
  created_at: string;
}

interface FinancialSummary {
  total_services: number;
  paid_services: number;
  pending_services: number;
  total_cost: number;
  paid_amount: number;
  pending_amount: number;
}

interface PartnerSummary {
  id: number;
  name: string;
  company_name: string;
  service_count: number;
  total_amount: number;
  paid_services: number;
  paid_amount: number;
}

interface SummaryData {
  summary: FinancialSummary;
  partners: PartnerSummary[];
}

export default function TowingPaymentsPage() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('pending');
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [filters, setFilters] = useState({
    partner_id: '',
    date_from: '',
    date_to: '',
  });
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<'week' | 'month' | 'year'>('month');

  // Buscar lista de serviços
  const { data: services, isLoading, refetch } = useQuery<TowingService[]>({
    queryKey: ['/api/towing/payments/services', selectedTab, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedTab === 'pending') params.append('payment_status', 'pending');
      if (selectedTab === 'paid') params.append('payment_status', 'paid');
      if (filters.partner_id) params.append('partner_id', filters.partner_id);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      
      const response = await apiRequest('GET', `/api/towing/payments/services?${params.toString()}`);
      return await response.json();
    },
  });

  // Buscar resumo financeiro
  const { data: summaryData, isLoading: isLoadingSummary } = useQuery<SummaryData>({
    queryKey: ['/api/towing/payments/summary', periodFilter],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/towing/payments/summary?period=${periodFilter}`);
      return await response.json();
    },
  });

  // Mutação para marcar serviços como pagos
  const markAsPaidMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/towing/payments/mark-as-paid', {
        service_ids: selectedServices,
        payment_date: paymentDate,
        payment_reference: paymentReference,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Pagamento registrado',
        description: `${selectedServices.length} serviço(s) marcado(s) como pago(s) com sucesso.`,
      });
      setIsPaymentModalOpen(false);
      setSelectedServices([]);
      setPaymentReference('');
      queryClient.invalidateQueries({ queryKey: ['/api/towing/payments/services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/towing/payments/summary'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao registrar pagamento',
        description: error.message || 'Ocorreu um erro ao processar o pagamento.',
        variant: 'destructive',
      });
    },
  });

  // Mutação para cancelar pagamento
  const cancelPaymentMutation = useMutation({
    mutationFn: async (serviceIds: number[]) => {
      const response = await apiRequest('POST', '/api/towing/payments/cancel-payment', {
        service_ids: serviceIds,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Pagamento cancelado',
        description: 'O registro de pagamento foi cancelado com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/towing/payments/services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/towing/payments/summary'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao cancelar pagamento',
        description: error.message || 'Ocorreu um erro ao cancelar o pagamento.',
        variant: 'destructive',
      });
    },
  });

  // Função para lidar com seleção de serviços
  const handleSelectService = (serviceId: number) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  // Função para selecionar/desselecionar todos os serviços
  const handleSelectAllServices = () => {
    if (services) {
      if (selectedServices.length === services.length) {
        setSelectedServices([]);
      } else {
        setSelectedServices(services.map(service => service.id));
      }
    }
  };

  // Função para processar o pagamento
  const handlePayment = () => {
    if (selectedServices.length === 0) {
      toast({
        title: 'Seleção vazia',
        description: 'Selecione pelo menos um serviço para registrar o pagamento.',
        variant: 'destructive',
      });
      return;
    }

    setIsPaymentModalOpen(true);
  };

  // Função para confirmar o pagamento
  const confirmPayment = () => {
    if (!paymentDate) {
      toast({
        title: 'Data obrigatória',
        description: 'Informe a data de pagamento.',
        variant: 'destructive',
      });
      return;
    }

    markAsPaidMutation.mutate();
  };

  // Função para cancelar o pagamento de um serviço
  const handleCancelPayment = (serviceId: number) => {
    if (confirm('Tem certeza que deseja cancelar o registro de pagamento deste serviço?')) {
      cancelPaymentMutation.mutate([serviceId]);
    }
  };

  // Função para lidar com a mudança de filtros
  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Aplicar filtros
  const applyFilters = () => {
    refetch();
  };

  // Limpar filtros
  const clearFilters = () => {
    setFilters({
      partner_id: '',
      date_from: '',
      date_to: '',
    });
    setTimeout(() => refetch(), 0);
  };

  // Calcular total selecionado
  const calculateSelectedTotal = () => {
    if (!services) return 0;
    return services
      .filter(service => selectedServices.includes(service.id))
      .reduce((total, service) => total + (service.actual_cost || 0), 0);
  };

  // Verificar se todos os serviços estão selecionados
  const allSelected = services && services.length > 0 && selectedServices.length === services.length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader 
        title="Gestão Financeira de Guincho" 
        icon={<BanknoteIcon className="h-6 w-6" />} 
      />
      
      {/* Resumo financeiro */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Resumo Financeiro</CardTitle>
            <Select value={periodFilter} onValueChange={(value) => setPeriodFilter(value as any)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Período</SelectLabel>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mês</SelectItem>
                  <SelectItem value="year">Ano</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <CardDescription>Visão geral dos pagamentos de serviços de guincho</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSummary ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-background p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Serviços</h3>
                <div className="text-2xl font-bold">{summaryData?.summary.total_services || 0}</div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                    Pagos: {summaryData?.summary.paid_services || 0}
                  </span>
                  <span className="flex items-center">
                    <ClockIcon className="h-4 w-4 text-amber-500 mr-1" />
                    Pendentes: {summaryData?.summary.pending_services || 0}
                  </span>
                </div>
              </div>
              
              <div className="bg-background p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Total</h3>
                <div className="text-2xl font-bold">{formatCurrency(summaryData?.summary.total_cost || 0)}</div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                    Pago: {formatCurrency(summaryData?.summary.paid_amount || 0)}
                  </span>
                  <span className="flex items-center">
                    <ClockIcon className="h-4 w-4 text-amber-500 mr-1" />
                    Pendente: {formatCurrency(summaryData?.summary.pending_amount || 0)}
                  </span>
                </div>
              </div>
              
              <div className="bg-background p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Taxa de Pagamento</h3>
                <div className="text-2xl font-bold">
                  {summaryData?.summary.total_services 
                    ? `${Math.round((summaryData.summary.paid_services / summaryData.summary.total_services) * 100)}%` 
                    : '0%'}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ 
                      width: `${summaryData?.summary.total_services 
                        ? Math.round((summaryData.summary.paid_services / summaryData.summary.total_services) * 100) 
                        : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tabela de parceiros */}
          {summaryData?.partners && summaryData.partners.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Top Parceiros</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parceiro</TableHead>
                    <TableHead className="text-right">Serviços</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">Pagos</TableHead>
                    <TableHead className="text-right">% Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaryData.partners.slice(0, 5).map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell>{partner.company_name || partner.name}</TableCell>
                      <TableCell className="text-right">{partner.service_count}</TableCell>
                      <TableCell className="text-right">{formatCurrency(partner.total_amount)}</TableCell>
                      <TableCell className="text-right">{partner.paid_services} ({formatCurrency(partner.paid_amount)})</TableCell>
                      <TableCell className="text-right">
                        {partner.service_count > 0 
                          ? `${Math.round((partner.paid_services / partner.service_count) * 100)}%` 
                          : '0%'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Lista de serviços */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Serviços de Guincho</CardTitle>
              <CardDescription>Gerenciamento de pagamentos de serviços</CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={handlePayment} 
                disabled={selectedServices.length === 0 || selectedTab === 'paid'}
              >
                <BanknoteIcon className="h-4 w-4 mr-2" />
                Registrar Pagamento
              </Button>
              
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              >
                <FilterIcon className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => refetch()}
              >
                <RefreshCwIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Filtros */}
          {isFilterExpanded && (
            <div className="mt-4 p-4 border rounded-lg bg-background">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="partner_id">Parceiro</Label>
                  <Input
                    id="partner_id"
                    placeholder="ID do parceiro"
                    value={filters.partner_id}
                    onChange={(e) => handleFilterChange('partner_id', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date_from">Data inicial</Label>
                  <Input
                    id="date_from"
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date_to">Data final</Label>
                  <Input
                    id="date_to"
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={clearFilters} className="mr-2">
                  Limpar
                </Button>
                <Button onClick={applyFilters}>
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending">Pendentes</TabsTrigger>
              <TabsTrigger value="paid">Pagos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {services && services.length > 0 ? (
                    <>
                      <div className="rounded-md border mb-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-10">
                                <Checkbox 
                                  checked={allSelected} 
                                  onCheckedChange={handleSelectAllServices}
                                />
                              </TableHead>
                              <TableHead>Parceiro</TableHead>
                              <TableHead>Veículo</TableHead>
                              <TableHead>Data</TableHead>
                              <TableHead>Origem/Destino</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {services.map((service) => (
                              <TableRow key={service.id}>
                                <TableCell>
                                  <Checkbox 
                                    checked={selectedServices.includes(service.id)} 
                                    onCheckedChange={() => handleSelectService(service.id)}
                                  />
                                </TableCell>
                                <TableCell>{service.company_name || service.partner_name}</TableCell>
                                <TableCell>{service.vehicle_plate}</TableCell>
                                <TableCell>{formatDate(service.service_date)}</TableCell>
                                <TableCell>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="cursor-help truncate block max-w-xs">
                                          {service.pickup_location.substring(0, 20)}...
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-sm">
                                        <p><strong>Origem:</strong> {service.pickup_location}</p>
                                        <p><strong>Destino:</strong> {service.destination}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(service.actual_cost)}
                                </TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                    ${service.status === 'aprovado' ? 'bg-green-100 text-green-800' : 
                                      service.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' : 
                                      'bg-gray-100 text-gray-800'}`}
                                  >
                                    {service.status === 'aprovado' ? 'Aprovado' : 
                                     service.status === 'pendente' ? 'Pendente' : 
                                     service.status}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          {selectedServices.length} de {services.length} serviços selecionados
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Total selecionado</div>
                          <div className="text-xl font-bold">{formatCurrency(calculateSelectedTotal())}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <ClockIcon className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">Nenhum serviço pendente de pagamento</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Todos os serviços de guincho já foram pagos ou não existem serviços pendentes.
                      </p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="paid">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {services && services.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Parceiro</TableHead>
                            <TableHead>Veículo</TableHead>
                            <TableHead>Data do Serviço</TableHead>
                            <TableHead>Data de Pagamento</TableHead>
                            <TableHead>Referência</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {services.map((service) => (
                            <TableRow key={service.id}>
                              <TableCell>{service.company_name || service.partner_name}</TableCell>
                              <TableCell>{service.vehicle_plate}</TableCell>
                              <TableCell>{formatDate(service.service_date)}</TableCell>
                              <TableCell>{service.payment_date ? formatDate(service.payment_date) : '-'}</TableCell>
                              <TableCell>{service.payment_reference || '-'}</TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(service.actual_cost)}
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleCancelPayment(service.id)}
                                >
                                  <BadgeAlertIcon className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <FileTextIcon className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">Nenhum serviço pago encontrado</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Não há registros de pagamentos de serviços de guincho.
                      </p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Modal de Pagamento */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do pagamento para {selectedServices.length} serviço(s) selecionado(s).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment_date">Data do Pagamento</Label>
              <Input
                id="payment_date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_reference">Referência do Pagamento (opcional)</Label>
              <Input
                id="payment_reference"
                placeholder="Ex: Número do comprovante, transferência, etc."
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
            </div>
            <div className="pt-2">
              <div className="text-sm text-muted-foreground">Total a pagar</div>
              <div className="text-2xl font-bold">{formatCurrency(calculateSelectedTotal())}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmPayment} 
              disabled={markAsPaidMutation.isPending}
            >
              {markAsPaidMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar Pagamento'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}