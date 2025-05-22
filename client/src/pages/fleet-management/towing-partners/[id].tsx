import React from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SafeLink from '@/components/SafeLink';
import { Truck, Star, FileText, CheckCircle } from 'lucide-react';

const TowingPartnerDetailPage: React.FC = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = React.useState('informações');
  
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
  
  // Dados de exemplo baseados na imagem
  const servicosExemplo = [
    { id: 1, placa: 'ABC1234', origem: 'Av. Paulista, 1000', destino: 'Rua Augusta, 500', data: '15/05/2025', status: 'Concluído', valor: 350.00 },
    { id: 2, placa: 'DEF6789', origem: 'Marginal Tietê, km 15', destino: 'Centro de Manutenção', data: '18/05/2025', status: 'Em andamento', valor: 420.00 },
    { id: 3, placa: 'GHI9012', origem: 'Avenida Brasil, 500', destino: 'Oficina Central', data: '12/05/2025', status: 'Concluído', valor: 285.00 }
  ];
  
  // Usamos dados mockados para simular a interface como na imagem de exemplo
  const mockData = {
    name: partner?.name || "Ford",
    location: partner?.address || "São Paulo, Zona Oeste",
    rating: partner?.rating || 4.8,
    status: partner?.status || "Ativo",
    total_requests: partner?.total_requests || 35,
    completed_requests: partner?.completed_requests || 32,
    services: requests?.length > 0 ? requests : servicosExemplo
  };
  
  // Calcular valores resumidos com base no mockData
  const financialSummary = React.useMemo(() => {
    const services = mockData.services;
    
    if (!services || services.length === 0) {
      return {
        total: 0,
        totalValue: 0,
        paidValue: 0,
        pendingValue: 0
      };
    }

    let totalValue = 0;
    let paidValue = 0;
    let pendingValue = 0;

    services.forEach(req => {
      const value = req.valor || req.value || 0;
      totalValue += value;
      if (req.status === 'Concluído') {
        paidValue += value;
      } else {
        pendingValue += value;
      }
    });

    return {
      total: services.length,
      totalValue,
      paidValue,
      pendingValue
    };
  }, [mockData.services]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 bg-blue-50">
        <div className="animate-pulse">
          <Card className="mb-4">
            <CardContent className="p-6">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="grid grid-cols-4 gap-4">
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 bg-blue-50">
        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
          <div className="text-orange-500 mb-2">
            <FileText className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Parceiro não encontrado</h3>
          <p className="text-gray-500 mb-4">Não foi possível carregar os dados deste parceiro.</p>
          <SafeLink to="/fleet-management/towing-partners">
            <Button>Voltar para lista de parceiros</Button>
          </SafeLink>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-blue-50">
      {/* Resumo Financeiro */}
      <Card className="mb-4">
        <CardContent className="p-6">
          <h2 className="text-lg font-bold mb-1">Resumo Financeiro</h2>
          <p className="text-sm text-gray-500 mb-4">Valores pagos e pendentes dos serviços</p>
          
          <div className="grid grid-cols-4 gap-4">
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

      {/* Cards de informações */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* Card de informações básicas */}
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold">{mockData.name}</h3>
            <p className="text-sm text-gray-500">{mockData.location}</p>
            <div className="flex items-center mt-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.floor(mockData.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                />
              ))}
              <span className="text-sm ml-1">{mockData.rating}/5</span>
            </div>
          </CardContent>
        </Card>

        {/* Card de atendimentos */}
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Atendimentos</h3>
            <p className="text-3xl font-bold">{mockData.total_requests}</p>
            <p className="text-sm text-gray-500 mt-1">Total de solicitações</p>
            <p className="text-sm text-gray-500 mt-1">{mockData.completed_requests} concluídos</p>
          </CardContent>
        </Card>

        {/* Card de status */}
        <Card>
          <CardContent className="p-6 text-center flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold mb-4">Status</h3>
            <Badge className={`${mockData.status.toLowerCase() === 'ativo' ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400'}`}>
              {mockData.status}
            </Badge>
            <p className="text-sm text-gray-500 mt-4">
              Parceiro disponível para serviços
            </p>
          </CardContent>
        </Card>

        {/* Card de ações */}
        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <Button variant="outline" className="w-full flex items-center justify-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" />
              </svg>
              Gerar link externo
            </Button>
            <Button className="w-full flex items-center justify-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nova solicitação
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Abas de informações detalhadas */}
      <Tabs 
        defaultValue="informações" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <TabsList className="mb-4 bg-white">
          <TabsTrigger value="informações" className="rounded-none">Informações</TabsTrigger>
          <TabsTrigger value="solicitações" className="rounded-none">Solicitações</TabsTrigger>
          <TabsTrigger value="estatísticas" className="rounded-none">Estatísticas</TabsTrigger>
        </TabsList>

        {/* Aba de informações */}
        <TabsContent value="informações">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Detalhes do Parceiro</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Nome</p>
                  <p className="text-gray-600">{mockData.name}</p>
                </div>
                <div>
                  <p className="font-medium">CNPJ</p>
                  <p className="text-gray-600">{partner?.cnpj || "27.891.900/0001-16"}</p>
                </div>
                <div>
                  <p className="font-medium">Telefone</p>
                  <p className="text-gray-600">{partner?.phone || "(11) 95195-2440"}</p>
                </div>
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-gray-600">{partner?.email || "allan@guincho-hotmail.com"}</p>
                </div>
                <div>
                  <p className="font-medium">Endereço</p>
                  <p className="text-gray-600">{mockData.location}</p>
                </div>
                <div>
                  <p className="font-medium">Disponibilidade</p>
                  <p className="text-gray-600">24h</p>
                </div>
                <div>
                  <p className="font-medium">Raio de Cobertura</p>
                  <p className="text-gray-600">100 km</p>
                </div>
                <div>
                  <p className="font-medium">Múltiplos Veículos</p>
                  <p className="text-gray-600">Não</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de solicitações */}
        <TabsContent value="solicitações">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Solicitações de Serviço</h3>
                  <p className="text-sm text-gray-500">Histórico de solicitações para este parceiro</p>
                </div>
                <Button className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nova solicitação
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Placa</th>
                      <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Origem</th>
                      <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Destino</th>
                      <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                      <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                      <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mockData.services.map((service) => (
                      <tr key={service.id}>
                        <td className="p-3 text-sm">{service.id}</td>
                        <td className="p-3 text-sm font-medium">{service.placa}</td>
                        <td className="p-3 text-sm text-gray-500">{service.origem}</td>
                        <td className="p-3 text-sm text-gray-500">{service.destino}</td>
                        <td className="p-3">
                          <Badge className={
                            service.status === 'Concluído' 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }>
                            {service.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-gray-500">{service.data}</td>
                        <td className="p-3 text-sm">R$ {typeof service.valor === 'number' ? service.valor.toFixed(2) : service.valor}</td>
                        <td className="p-3 text-sm flex gap-2">
                          <button className="p-1 text-gray-500 hover:text-gray-700">
                            <FileText className="h-5 w-5" />
                          </button>
                          <button className="p-1 text-green-500 hover:text-green-700">
                            <CheckCircle className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de estatísticas */}
        <TabsContent value="estatísticas">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Estatísticas de Desempenho</h3>
              <p className="text-gray-500">Análise de dados e métricas de desempenho serão exibidas aqui.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TowingPartnerDetailPage;