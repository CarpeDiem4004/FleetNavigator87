import React from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import SafeLink from '@/components/SafeLink';
import PageHeader from '@/components/layout/PageHeader';
import { Truck, Phone, MapPin, Star, ArrowLeft, Mail, FileText, AlertCircle, Calendar } from 'lucide-react';

const TowingPartnerDetailPage: React.FC = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState('info');
  
  if (!id) {
    return <div>Parceiro não encontrado</div>;
  }
  
  // Buscar dados do parceiro
  const { data: partner, isLoading, error } = useQuery({
    queryKey: [`/api/towing/partners/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/towing/partners/${id}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar dados do parceiro');
      }
      return response.json();
    }
  });
  
  // Buscar solicitações do parceiro
  const { data: requests = [] } = useQuery({
    queryKey: [`/api/towing/partners/${id}/requests`],
    queryFn: async () => {
      const response = await fetch(`/api/towing/partners/${id}/requests`);
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    enabled: !!id
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
            <Button className="w-full">
              Gerar link externo
            </Button>
            <SafeLink to={`/fleet-management/towing-partners/requests/new?partner=${id}`} className="w-full">
              <Button className="w-full">
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
            <CardHeader>
              <CardTitle>Solicitações de Serviço</CardTitle>
              <CardDescription>Histórico de solicitações para este parceiro</CardDescription>
            </CardHeader>
            <CardContent>
              {requests && requests.length > 0 ? (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placa</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origem</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destino</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {requests.map((request, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{request.plate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.origin}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.destination}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${request.status === 'Concluído' ? 'bg-green-100 text-green-800' : 
                                request.status === 'Em andamento' ? 'bg-blue-100 text-blue-800' : 
                                'bg-yellow-100 text-yellow-800'}`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {request.value?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">Nenhuma solicitação encontrada</h3>
                  <p className="mt-1 text-sm text-gray-500">Este parceiro ainda não possui solicitações de serviço.</p>
                  <div className="mt-6">
                    <SafeLink to={`/fleet-management/towing-partners/requests/new?partner=${id}`}>
                      <Button>Criar nova solicitação</Button>
                    </SafeLink>
                  </div>
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
              <CardDescription>Análise de dados do parceiro</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="mt-1 text-sm text-gray-500">Estatísticas serão implementadas em breve.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TowingPartnerDetailPage;