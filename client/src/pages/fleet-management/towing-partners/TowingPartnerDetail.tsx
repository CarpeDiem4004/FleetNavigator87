import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import SafeLink from '@/components/SafeLink';
import { Switch } from '@/components/ui/switch';
import { useQuery } from '@tanstack/react-query';

// Componentes UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import PageHeader from '@/components/layout/PageHeader';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Ícones
import { Truck, Phone, MapPin, Star, ArrowLeft, Mail, FileText, AlertCircle, Calendar, CheckCircle2, XCircle, Clock, Link, Copy, Check, Plus } from 'lucide-react';

interface TowingPartnerDetailProps {
  partnerId: number | string;
}

interface TowingPartner {
  id: number;
  name: string;
  company_name?: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  city?: string;
  region?: string;
  address?: string;
  contact_person?: string;
  rating?: number;
  service_types?: string[];
  payment_methods?: string[];
  cost_per_km?: number;
  available_24h?: boolean;
  can_transport_multiple?: boolean;
  notes?: string;
  status?: string;
  total_requests?: number;
  completed_requests?: number;
}

interface ServiceRequest {
  id: number;
  plate: string;
  origin: string;
  destination: string;
  status: string;
  date: string;
  value: number;
}

const TowingPartnerDetail: React.FC<TowingPartnerDetailProps> = ({ partnerId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('info');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [accessLink, setAccessLink] = useState('');
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [linkExpirationDays, setLinkExpirationDays] = useState(30);
  const [isPermanentLink, setIsPermanentLink] = useState(false);
  
  // Buscar dados do parceiro
  const { data: partner, isLoading, error } = useQuery<TowingPartner>({
    queryKey: [`/api/towing/partners/${partnerId}`],
    queryFn: async () => {
      const response = await fetch(`/api/towing/partners/${partnerId}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar dados do parceiro');
      }
      return response.json();
    }
  });
  
  // Buscar solicitações do parceiro
  const { data: requests = [] } = useQuery<ServiceRequest[]>({
    queryKey: [`/api/towing/partners/${partnerId}/requests`],
    queryFn: async () => {
      const response = await fetch(`/api/towing/partners/${partnerId}/requests`);
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    enabled: !!partnerId
  });

  // Calcular valores resumidos
  const financialSummary = React.useMemo(() => {
    if (!requests || requests.length === 0) {
      return {
        total: 0,
        totalValue: 0,
        paidValue: 0,
        pendingValue: 0
      };
    }

    // Valores para cálculos financeiros
    let totalValue = 0;
    let paidValue = 0;
    let pendingValue = 0;

    requests.forEach(req => {
      totalValue += req.value || 0;
      if (req.status === 'Concluído') {
        paidValue += req.value || 0;
      } else {
        pendingValue += req.value || 0;
      }
    });

    return {
      total: requests.length,
      totalValue,
      paidValue,
      pendingValue
    };
  }, [requests]);

  const handleCreateLink = () => {
    try {
      // Simular criação de link
      const token = `token_${partnerId}_${Date.now()}`;
      setAccessLink(`${window.location.origin}/towing-external-access/${token}`);
      setIsLinkModalOpen(true);
    } catch (error) {
      toast({
        title: "Erro ao gerar link",
        description: "Não foi possível gerar o link de acesso.",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(accessLink);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-6">
          <SafeLink to="/fleet-management/towing-partners" className="mr-4">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </SafeLink>
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
        </div>
        <div className="grid gap-4">
          <div className="h-40 bg-gray-200 animate-pulse rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
            <div className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
            <div className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
            <div className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-6">
          <SafeLink to="/fleet-management/towing-partners" className="mr-4">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </SafeLink>
          <h2 className="text-2xl font-bold">Parceiro não encontrado</h2>
        </div>
        <Card>
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Dados do parceiro não disponíveis</h3>
            <p className="text-gray-500 mb-4">Não foi possível carregar os dados deste parceiro. Verifique se o ID está correto.</p>
            <SafeLink to="/fleet-management/towing-partners">
              <Button>Ver lista de parceiros</Button>
            </SafeLink>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <SafeLink to="/fleet-management/towing-partners" className="mr-4">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </SafeLink>
        <PageHeader
          title={`Parceiro: ${partner.name}`}
          description={`Detalhes e histórico do parceiro de guincho`}
          icon={<Truck className="h-6 w-6 text-primary" />}
        />
      </div>

      {/* Resumo Financeiro */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle>Resumo Financeiro</CardTitle>
          <CardDescription>Valores pagos e pendentes dos serviços</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">Total de Serviços</p>
              <p className="text-2xl font-bold">{financialSummary.total}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Valor Total</p>
              <p className="text-2xl font-bold">R$ {financialSummary.totalValue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Valor Pago</p>
              <p className="text-2xl font-bold text-green-600">R$ {financialSummary.paidValue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Valor Pendente</p>
              <p className="text-2xl font-bold text-orange-500">R$ {financialSummary.pendingValue.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações resumidas e estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {/* Card de informações básicas */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-1">{partner.name}</h3>
              <p className="text-sm text-gray-500 mb-2">{partner.city}, {partner.region}</p>
              <div className="flex items-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < (partner.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                  />
                ))}
                <span className="text-sm ml-1">{partner.rating || 0} /5</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de atendimentos */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Atendimentos</h3>
              <p className="text-3xl font-bold mb-2">{partner.total_requests || 0}</p>
              <p className="text-sm text-gray-500">Total de solicitações</p>
              <p className="text-sm text-gray-500 mt-2">{partner.completed_requests || 0} concluídos</p>
            </div>
          </CardContent>
        </Card>

        {/* Card de status */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Status</h3>
              <Badge className={`${partner.status === 'ativo' ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 hover:bg-gray-500'}`}>
                {partner.status === 'ativo' ? 'Ativo' : 'Inativo'}
              </Badge>
              <p className="text-sm text-gray-500 mt-4">
                Parceiro disponível para serviços
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card de ações */}
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center gap-2">
            <Button className="w-full" onClick={handleCreateLink}>
              <Link className="h-4 w-4 mr-2" />
              Gerar link externo
            </Button>
            <SafeLink to={`/fleet-management/towing-partners/requests/new?partner=${partnerId}`} className="w-full">
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Nova solicitação
              </Button>
            </SafeLink>
          </CardContent>
        </Card>
      </div>

      {/* Abas de informações detalhadas */}
      <Tabs 
        defaultValue="info" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="requests">Solicitações</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        {/* Aba de informações */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Telefone</p>
                    <p className="text-gray-600">{partner.phone || "Não informado"}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">E-mail</p>
                    <p className="text-gray-600">{partner.email || "Não informado"}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Endereço</p>
                    <p className="text-gray-600">{partner.address || "Não informado"}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FileText className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">CNPJ</p>
                    <p className="text-gray-600">{partner.cnpj || "Não informado"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Serviço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Tipos de Serviço</h4>
                  <div className="flex flex-wrap gap-2">
                    {(partner.service_types || []).length > 0 ? 
                      partner.service_types?.map((type, index) => (
                        <Badge key={index} variant="secondary">{type}</Badge>
                      )) : 
                      <p className="text-gray-500 text-sm">Não informado</p>
                    }
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Formas de Pagamento</h4>
                  <div className="flex flex-wrap gap-2">
                    {(partner.payment_methods || []).length > 0 ? 
                      partner.payment_methods?.map((method, index) => (
                        <Badge key={index} variant="outline">{method}</Badge>
                      )) : 
                      <p className="text-gray-500 text-sm">Não informado</p>
                    }
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Disponibilidade</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Switch checked={partner.available_24h} disabled />
                      <Label className="ml-2">Atendimento 24h</Label>
                    </div>
                    <div className="flex items-center">
                      <Switch checked={partner.can_transport_multiple} disabled />
                      <Label className="ml-2">Transporte múltiplo</Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de solicitações */}
        <TabsContent value="requests">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Solicitações de Serviço</CardTitle>
                <CardDescription>Histórico de solicitações para este parceiro</CardDescription>
              </div>
              <SafeLink to={`/fleet-management/towing-partners/requests/new?partner=${partnerId}`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova solicitação
                </Button>
              </SafeLink>
            </CardHeader>
            <CardContent>
              {requests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.id}</TableCell>
                        <TableCell>{request.plate}</TableCell>
                        <TableCell>{request.origin}</TableCell>
                        <TableCell>{request.destination}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              request.status === 'Concluído' 
                                ? 'bg-green-500' 
                                : request.status === 'Em andamento' 
                                ? 'bg-blue-500' 
                                : 'bg-amber-500'
                            }
                          >
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{request.date}</TableCell>
                        <TableCell>R$ {request.value.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="icon" 
                              variant="ghost"
                              title="Ver detalhes"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-green-600"
                              title="Marcar como concluído"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Sem solicitações</h3>
                  <p className="text-gray-500 mb-4">Este parceiro ainda não possui solicitações de serviço registradas</p>
                  <SafeLink to={`/fleet-management/towing-partners/requests/new?partner=${partnerId}`}>
                    <Button>Registrar primeira solicitação</Button>
                  </SafeLink>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de estatísticas */}
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas de Desempenho</CardTitle>
              <CardDescription>Métricas de atendimento e eficiência</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Taxa de Conclusão</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {partner.total_requests 
                      ? Math.round((partner.completed_requests || 0) / partner.total_requests * 100) 
                      : 0}%
                  </p>
                  <p className="text-sm text-gray-500">
                    {partner.completed_requests || 0} concluídos de {partner.total_requests || 0} solicitações
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Tempo Médio</h3>
                  <p className="text-3xl font-bold text-blue-600">45 min</p>
                  <p className="text-sm text-gray-500">Tempo médio de atendimento</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Avaliação</h3>
                  <div className="flex items-center">
                    <span className="text-3xl font-bold text-amber-600 mr-2">{partner.rating || 0}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-6 w-6 ${i < (partner.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Baseado em {partner.completed_requests || 0} avaliações</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de link de acesso */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link de acesso para parceiro</DialogTitle>
            <DialogDescription>
              Compartilhe este link com o parceiro para que ele possa acessar o sistema externo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-link">Link de acesso</Label>
              <div className="flex">
                <Input
                  id="access-link"
                  value={accessLink}
                  readOnly
                  className="flex-1 rounded-r-none"
                />
                <Button
                  onClick={handleCopyLink}
                  className="rounded-l-none"
                  variant={isLinkCopied ? "outline" : "default"}
                >
                  {isLinkCopied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="expiration">Validade do link</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="permanent-link"
                    checked={isPermanentLink}
                    onCheckedChange={setIsPermanentLink}
                  />
                  <Label htmlFor="permanent-link">Link permanente</Label>
                </div>
              </div>
              <Input
                id="expiration"
                type="number"
                min="1"
                max="365"
                value={linkExpirationDays}
                onChange={(e) => setLinkExpirationDays(parseInt(e.target.value))}
                disabled={isPermanentLink}
              />
              <p className="text-sm text-gray-500">
                {isPermanentLink
                  ? "Este link não expira e será válido até ser revogado."
                  : `Este link expira em ${linkExpirationDays} dias.`}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TowingPartnerDetail;