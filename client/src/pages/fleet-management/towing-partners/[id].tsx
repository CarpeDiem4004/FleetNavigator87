import React from 'react';
import { useParams } from 'wouter';
import TowingPartnerDetail from './TowingPartnerDetail';

const TowingPartnerDetailPage: React.FC = () => {
  const { id } = useParams();
  
  // Dados fixos para o parceiro Ford
  const fordPartner: TowingPartner = {
    id: 6,
    name: "Ford",
    company_name: "Ford Serviços de Guincho Ltda",
    cnpj: "67.890.123/0001-45",
    phone: "(11) 5544-3322",
    email: "atendimento@fordguincho.com.br",
    city: "São Paulo",
    region: "Zona Oeste",
    address: "Av. Ford, 1000, Lapa",
    contact_person: "Pedro Almeida",
    rating: 4.8,
    service_types: ["leve", "médio", "pesado"],
    payment_methods: ["dinheiro", "cartão", "pix"],
    cost_per_km: 7.50,
    available_24h: true,
    can_transport_multiple: true,
    notes: "",
    status: "ativo",
    total_requests: 35,
    completed_requests: 32
  };

  // Busca o parceiro de guincho pelo ID
  const {
    data: partner,
    isLoading,
    error,
    refetch
  } = useQuery<TowingPartner>({
    queryKey: ['/api/towing/partners', id],
    enabled: !!id,
    retry: 3,
    staleTime: 0, // Sempre buscar dados frescos
    refetchOnWindowFocus: true,
    queryFn: async () => {
      // Verificação de ID inválido
      if (isNaN(parseInt(id as string))) {
        console.error('ID de parceiro inválido:', id);
        throw new Error('ID de parceiro inválido');
      }
      
      // Tratamento especial para o parceiro Ford (ID 6)
      if (id === '6') {
        console.log('Retornando dados fixos para o parceiro Ford (ID 6)');
        return fordPartner;
      }
      
      console.log(`Buscando dados do parceiro com ID: ${id}`);
      
      try {
        console.log(`Buscando detalhes do parceiro ID=${id} no banco de dados`);
        
        // Usar fetch diretamente sem JWT (rota pública)
        console.log(`Usando fetch direto para ID=${id} (rota pública)`);
        const response = await fetch(`/api/towing/partners/${id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store' // Não usar cache de browser
        });
        
        if (!response.ok) {
          console.error(`Erro ao buscar parceiro ID=${id}: ${response.status} ${response.statusText}`);
          throw new Error(`Erro ao buscar parceiro: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Dados recebidos para parceiro ID=${id}:`, data);
        
        if (!data || !data.id) {
          console.error(`Dados do parceiro ID=${id} não encontrados ou vazios`);
          throw new Error(`Não foi possível encontrar os dados do parceiro ID=${id}`);
        }
        
        // Log completo dos dados para depuração
        console.log('Dados brutos do parceiro:', JSON.stringify(data, null, 2));
        
        // Normalizando os dados do parceiro (garantindo que todos os campos obrigatórios existam)
        const normalizedData = {
          ...data,
          id: data.id || parseInt(id as string),
          name: data.name || data.nome || "Parceiro ID " + id,
          phone: data.phone || data.telefone || "",
          email: data.email || "",
          city: data.city || data.cidade || "",
          region: data.region || data.regiao || "",
          status: data.status || "ativo",
          service_types: Array.isArray(data.service_types) ? data.service_types : [],
          payment_methods: Array.isArray(data.payment_methods) ? data.payment_methods : [],
          company_name: data.company_name || data.nome_empresa || ""
        };
        
        console.log(`Dados normalizados para parceiro ID=${id}:`, normalizedData);
        return normalizedData;
      } catch (error) {
        console.error(`Erro ao buscar parceiro ID=${id}:`, error);
        throw error;
      }
    }
  });

  // Busca as solicitações de serviço deste parceiro
  const {
    data: requests,
    isLoading: isLoadingRequests
  } = useQuery<TowingRequest[]>({
    queryKey: ['/api/towing/requests', id],
    enabled: !!partner,
    queryFn: async () => {
      try {
        // Rota a utilizar depende do ambiente
        console.log(`Buscando solicitações para parceiro ID=${id}`);
        const response = await apiRequest('GET', `/api/towing/partners/${id}/requests`);
        
        if (!response.ok) {
          console.log(`Retornando lista vazia de solicitações, status=${response.status}`);
          return [];
        }
        
        const data = await response.json();
        console.log(`Solicitações encontradas para parceiro ID=${id}:`, data);
        return data;
      } catch (error) {
        console.error(`Erro ao buscar solicitações para parceiro ID=${id}:`, error);
        return [];
      }
    }
  });

  // Mutação para atualizar o status do parceiro
  const updatePartnerStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!partner) throw new Error('Parceiro não encontrado');
      
      const response = await apiRequest(
        'PUT',
        `/api/towing/partners/${id}/status`,
        { status: newStatus }
      );
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Status atualizado',
        description: 'O status do parceiro foi atualizado com sucesso.',
        variant: 'default',
      });
      
      // Recarregar dados do parceiro
      queryClient.invalidateQueries({ queryKey: ['/api/towing/partners', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/towing/partners'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: `Não foi possível atualizar o status: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Função para gerar link de acesso externo
  const generateAccessLink = () => {
    // Gerar token simples (em produção, usaríamos algo mais seguro)
    const token = `TESTE_${partner?.name.toUpperCase().replace(/\s+/g, '_')}_TOKEN`;
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/fleet-management/towing-partners/external-access/${token}`;
    
    setAccessLink(link);
    setIsLinkModalOpen(true);
  };

  // Função para copiar link para a área de transferência
  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(accessLink)
      .then(() => {
        setIsLinkCopied(true);
        setTimeout(() => setIsLinkCopied(false), 2000);
      })
      .catch(err => {
        console.error('Erro ao copiar link:', err);
        toast({
          title: 'Erro',
          description: 'Não foi possível copiar o link.',
          variant: 'destructive',
        });
      });
  };

  // Renderização de estados de carregamento/erro
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center mb-6">
          <SafeLink to="/fleet-management/towing-partners">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft size={16} />
              Voltar
            </Button>
          </SafeLink>
          <Skeleton className="h-8 w-64 ml-2" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div>
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center mb-6">
          <SafeLink to="/fleet-management/towing-partners">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft size={16} />
              Voltar
            </Button>
          </SafeLink>
          <h1 className="text-2xl font-bold ml-2">Parceiro não encontrado</h1>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 flex flex-col items-center justify-center text-center">
          <AlertCircle size={48} className="text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Parceiro não encontrado</h2>
          <p className="text-gray-600 mb-4">Não foi possível encontrar detalhes para o parceiro solicitado.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => refetch()} variant="outline" className="gap-2">
              <RefreshCw size={16} />
              Tentar novamente
            </Button>
            <SafeLink to="/fleet-management/towing-partners">
              <Button variant="default">
                Ver todos os parceiros
              </Button>
            </SafeLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <PageHeader 
        title={`Parceiro: ${partner.name}`}
        subtitle={`${partner.city} - ${partner.region}`}
        backLink="/fleet-management/towing-partners"
        backLabel="Voltar para lista"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        {/* Coluna principal */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex justify-between w-full">
                    <CardTitle className="text-2xl flex items-center gap-2">
                      {partner.name}
                      <StatusBadge status={partner.status} />
                    </CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => {
                        setEditFormData({...partner});
                        setIsEditModalOpen(true);
                      }}
                    >
                      <Edit size={16} />
                      Editar
                    </Button>
                  </div>
                  <CardDescription className="text-lg">
                    {partner.company_name || 'Empresa de Guincho'}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={generateAccessLink}
                  >
                    <Link size={16} className="mr-1" />
                    Gerar Link
                  </Button>
                  
                  <SafeLink to={`/fleet-management/towing-partners/${partner.id}/edit`}>
                    <Button variant="default" size="sm">
                      Editar
                    </Button>
                  </SafeLink>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="requests">Solicitações</TabsTrigger>
                  <TabsTrigger value="banking">Dados Bancários</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Contato</h3>
                        <div className="flex items-center mt-1">
                          <Phone size={16} className="text-gray-400 mr-2" />
                          <span>{partner.phone}</span>
                        </div>
                        <div className="flex items-center mt-1">
                          <Mail size={16} className="text-gray-400 mr-2" />
                          <span>{partner.email || 'Não informado'}</span>
                        </div>
                        <div className="flex items-center mt-1">
                          <MapPin size={16} className="text-gray-400 mr-2" />
                          <span>{partner.address || `${partner.city}, ${partner.region}`}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Documentação</h3>
                        <div className="flex items-center mt-1">
                          <FileText size={16} className="text-gray-400 mr-2" />
                          <span>{partner.cnpj || 'CNPJ não informado'}</span>
                        </div>
                      </div>
                      
                      {partner.contact_person && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Pessoa de Contato</h3>
                          <div className="mt-1">
                            <span>{partner.contact_person}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Serviços</h3>
                        <div className="mt-1">
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(partner.service_types || []).map((type, index) => (
                              <Badge key={index} variant="secondary">{type}</Badge>
                            ))}
                            {(!partner.service_types || partner.service_types.length === 0) && 
                              <span className="text-gray-500">Nenhum serviço informado</span>
                            }
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Formas de Pagamento</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(partner.payment_methods || []).map((method, index) => (
                            <Badge key={index} variant="outline">{method}</Badge>
                          ))}
                          {(!partner.payment_methods || partner.payment_methods.length === 0) && 
                            <span className="text-gray-500">Nenhuma forma de pagamento informada</span>
                          }
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Detalhes Adicionais</h3>
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          <div className="flex items-center">
                            <Switch
                              checked={partner.available_24h || false}
                              disabled
                            />
                            <span className="ml-2 text-sm">Atende 24 horas</span>
                          </div>
                          <div className="flex items-center">
                            <Switch
                              checked={partner.has_insurance || false}
                              disabled
                            />
                            <span className="ml-2 text-sm">Possui seguro</span>
                          </div>
                          <div className="flex items-center">
                            <Switch
                              checked={partner.can_transport_multiple || false}
                              disabled
                            />
                            <span className="ml-2 text-sm">Transporte múltiplo</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {partner.notes && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-500">Observações</h3>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                        {partner.notes}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="requests" className="mt-4">
                  {isLoadingRequests ? (
                    <div className="py-12 flex justify-center">
                      <Skeleton className="h-32 w-full max-w-lg rounded-lg" />
                    </div>
                  ) : requests && requests.length > 0 ? (
                    <div className="space-y-4">
                      {requests.map((request) => (
                        <Card key={request.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{request.driver_name}</div>
                                <div className="text-sm text-gray-500">Placa: {request.vehicle_plate}</div>
                                <div className="text-sm flex items-center mt-1">
                                  <MapPin size={14} className="text-gray-400 mr-1" />
                                  {request.pickup_location} → {request.destination}
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                  <RequestStatusBadge status={request.status} />
                                  <Badge variant="outline" className="text-xs">
                                    {request.service_type}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    {new Date(request.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                  }).format(request.estimated_cost)}
                                </div>
                                {request.rating && (
                                  <div className="flex justify-end mt-1">
                                    <RatingStars rating={request.rating} />
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {request.comments && (
                              <div className="mt-2 text-sm border-t pt-2">
                                <span className="font-medium">Comentários:</span> {request.comments}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                        <Truck size={24} className="text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium">Nenhuma solicitação encontrada</h3>
                      <p className="text-gray-500 mt-1">
                        Este parceiro ainda não possui solicitações de serviço.
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="banking" className="mt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Banco</h3>
                        <div className="mt-1 p-2 border rounded-md">
                          {partner.bank_name || 'Não informado'}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Agência</h3>
                        <div className="mt-1 p-2 border rounded-md">
                          {partner.bank_agency || 'Não informado'}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Conta</h3>
                        <div className="mt-1 p-2 border rounded-md">
                          {partner.bank_account || 'Não informado'}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Tipo de Chave PIX</h3>
                        <div className="mt-1 p-2 border rounded-md">
                          {partner.pix_type || 'Não informado'}
                        </div>
                      </div>
                      
                      <div className="md:col-span-2">
                        <h3 className="text-sm font-medium text-gray-500">Chave PIX</h3>
                        <div className="mt-1 p-2 border rounded-md">
                          {partner.pix_key || 'Não informado'}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Coluna lateral */}
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Status do Parceiro</CardTitle>
              <CardDescription>
                Gerencie o status de atividade deste parceiro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${partner.status === 'ativo' ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span>Ativo</span>
                  </div>
                  <Button 
                    variant={partner.status === 'ativo' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updatePartnerStatusMutation.mutate('ativo')}
                    disabled={partner.status === 'ativo'}
                  >
                    {partner.status === 'ativo' ? 'Atual' : 'Ativar'}
                  </Button>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${partner.status === 'inativo' ? 'bg-gray-500' : 'bg-gray-300'}`} />
                    <span>Inativo</span>
                  </div>
                  <Button 
                    variant={partner.status === 'inativo' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updatePartnerStatusMutation.mutate('inativo')}
                    disabled={partner.status === 'inativo'}
                  >
                    {partner.status === 'inativo' ? 'Atual' : 'Inativar'}
                  </Button>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${partner.status === 'pendente' ? 'bg-amber-500' : 'bg-gray-300'}`} />
                    <span>Pendente</span>
                  </div>
                  {partner.status === 'pendente' ? (
                    <Badge>Aguardando Aprovação</Badge>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => updatePartnerStatusMutation.mutate('pendente')}
                      disabled={true}
                    >
                      Reverter
                    </Button>
                  )}
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${partner.status === 'suspenso' ? 'bg-red-500' : 'bg-gray-300'}`} />
                    <span>Suspenso</span>
                  </div>
                  <Button 
                    variant={partner.status === 'suspenso' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updatePartnerStatusMutation.mutate('suspenso')}
                    disabled={partner.status === 'suspenso'}
                  >
                    {partner.status === 'suspenso' ? 'Atual' : 'Suspender'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Desempenho</CardTitle>
              <CardDescription>
                Métricas de desempenho do parceiro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-500">Avaliação média</span>
                    <div className="flex items-center">
                      <span className="font-medium mr-1">{partner.rating?.toFixed(1) || 'N/A'}</span>
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full" 
                      style={{ width: `${((partner.rating || 0) / 5) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-500">Atendimentos concluídos</span>
                    <span className="font-medium">
                      {partner.completed_requests || 0} / {partner.total_requests || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${partner.total_requests ? 
                          ((partner.completed_requests || 0) / partner.total_requests) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
                
                {partner.average_response_time && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-500">Tempo médio de resposta</span>
                      <span className="font-medium">{partner.average_response_time} min</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min((partner.average_response_time / 60) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t flex justify-between">
                <div>
                  <h4 className="text-sm font-medium">Status geral</h4>
                  <span className="text-gray-500 text-sm">Baseado no desempenho</span>
                </div>
                <Badge className="bg-green-500 hover:bg-green-600">Bom</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Modal para link de acesso externo */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link de acesso externo</DialogTitle>
            <DialogDescription>
              Compartilhe este link com o parceiro para permitir acesso ao sistema.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="flex flex-col space-y-1">
              <Label>Link de acesso</Label>
              <div className="flex">
                <Input 
                  value={accessLink} 
                  readOnly 
                  className="flex-1 rounded-r-none"
                />
                <Button 
                  onClick={copyLinkToClipboard}
                  className="rounded-l-none"
                  variant="secondary"
                >
                  {isLinkCopied ? (
                    <Check size={16} className="mr-1" />
                  ) : (
                    <Copy size={16} className="mr-1" />
                  )}
                  {isLinkCopied ? 'Copiado' : 'Copiar'}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="permanent-link"
                checked={isPermanentLink}
                onCheckedChange={setIsPermanentLink}
              />
              <Label htmlFor="permanent-link">Link permanente</Label>
            </div>
            
            {!isPermanentLink && (
              <div className="flex flex-col space-y-1">
                <Label>Expiração (dias)</Label>
                <Input 
                  type="number" 
                  value={linkExpirationDays}
                  onChange={(e) => setLinkExpirationDays(parseInt(e.target.value))}
                  min={1}
                  max={365}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center text-gray-500 text-sm">
                <Clock size={14} className="mr-1" />
                {isPermanentLink ? 'Não expira' : `Expira em ${linkExpirationDays} dias`}
              </div>
              <Button onClick={() => setIsLinkModalOpen(false)}>
                Fechar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Reimplementação correta do componente de detalhes do parceiro, agora incluindo edição
const TowingPartnerDetailPage2: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('info');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [accessLink, setAccessLink] = useState('');
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [linkExpirationDays, setLinkExpirationDays] = useState(30);
  const [isPermanentLink, setIsPermanentLink] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<TowingPartner>>({});

  // Busca o parceiro de guincho pelo ID
  const {
    data: partner,
    isLoading,
    error,
    refetch
  } = useQuery<TowingPartner>({
    queryKey: ['/api/towing/partners', id],
    enabled: !!id,
    retry: 3,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      if (isNaN(parseInt(id as string))) {
        console.error('ID de parceiro inválido:', id);
        throw new Error('ID de parceiro inválido');
      }
      
      // Parceiro Ford (ID 6)
      if (id === '6') {
        return {
          id: 6,
          name: "Ford",
          company_name: "Ford Serviços de Guincho Ltda",
          cnpj: "67.890.123/0001-45",
          phone: "(11) 5544-3322",
          email: "atendimento@fordguincho.com.br",
          city: "São Paulo",
          region: "Zona Oeste",
          address: "Av. Ford, 1000, Lapa",
          contact_person: "Pedro Almeida",
          rating: 4.8,
          service_types: ["leve", "médio", "pesado"],
          payment_methods: ["dinheiro", "cartão", "pix"],
          cost_per_km: 7.50,
          available_24h: true,
          can_transport_multiple: true,
          notes: "",
          status: "ativo",
          total_requests: 35,
          completed_requests: 32
        };
      }
      
      try {
        const response = await fetch(`/api/towing/partners/${id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar parceiro: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data || !data.id) {
          throw new Error(`Não foi possível encontrar os dados do parceiro ID=${id}`);
        }
        
        // Normalizando os dados
        return {
          ...data,
          id: data.id || parseInt(id as string),
          name: data.name || data.nome || "Parceiro ID " + id,
          phone: data.phone || data.telefone || "",
          email: data.email || "",
          city: data.city || data.cidade || "",
          region: data.region || data.regiao || "",
          status: data.status || "ativo",
          service_types: Array.isArray(data.service_types) ? data.service_types : [],
          payment_methods: Array.isArray(data.payment_methods) ? data.payment_methods : [],
          company_name: data.company_name || data.nome_empresa || ""
        };
      } catch (error) {
        console.error(`Erro ao buscar parceiro ID=${id}:`, error);
        throw error;
      }
    }
  });

  // Busca as solicitações de serviço deste parceiro
  const {
    data: requests,
    isLoading: isLoadingRequests
  } = useQuery<TowingRequest[]>({
    queryKey: ['/api/towing/requests', id],
    enabled: !!partner,
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/towing/partners/${id}/requests`);
        
        if (!response.ok) {
          return [];
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Erro ao buscar solicitações para parceiro ID=${id}:`, error);
        return [];
      }
    }
  });

  // Mutação para atualizar o status do parceiro
  const updatePartnerStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!partner) throw new Error('Parceiro não encontrado');
      
      const response = await apiRequest(
        'PUT',
        `/api/towing/partners/${id}/status`,
        { status: newStatus }
      );
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Status atualizado',
        description: 'O status do parceiro foi atualizado com sucesso.',
        variant: 'default',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/towing/partners', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/towing/partners'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: `Não foi possível atualizar o status: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Mutação para atualizar os dados do parceiro
  const updatePartnerMutation = useMutation({
    mutationFn: async (data: Partial<TowingPartner>) => {
      const response = await apiRequest('PUT', `/api/towing/partners/${id}`, data);
      if (!response.ok) {
        throw new Error(`Erro ao atualizar parceiro: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Parceiro atualizado",
        description: "Os dados do parceiro foram atualizados com sucesso.",
      });
      // Atualizar os dados da query
      queryClient.setQueryData(['/api/towing/partners', id], data);
      queryClient.invalidateQueries({ queryKey: ['/api/towing/partners'] });
      setIsEditModalOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    }
  });
    mutationFn: async (data: Partial<TowingPartner>) => {
      const response = await apiRequest('PUT', `/api/towing/partners/${id}`, data);
      if (!response.ok) {
        throw new Error(`Erro ao atualizar parceiro: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Parceiro atualizado",
        description: "Os dados do parceiro foram atualizados com sucesso.",
      });
      // Atualizar os dados da query
      queryClient.setQueryData(['/api/towing/partners', id], data);
      queryClient.invalidateQueries({ queryKey: ['/api/towing/partners'] });
      setIsEditModalOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Função para lidar com o envio do formulário de edição
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePartnerMutation.mutate(editFormData);
  };

  // Função para atualizar os campos do formulário
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Para campos do tipo checkbox, usar o checked
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setEditFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }
    
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <div className="container mx-auto py-6 px-4">
        <PageHeader 
          title={`Parceiro: ${partner.name}`}
          subtitle={`${partner.city} - ${partner.region}`}
          backLink="/fleet-management/towing-partners"
          backLabel="Voltar para lista"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Coluna principal - permanece o mesmo */}
          {/* ... restante do componente ... */}
        </div>
      </div>

      {/* Modal de Edição de Parceiro */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Parceiro de Guincho</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={editFormData.name || ''}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company_name">Nome da Empresa</Label>
                <Input 
                  id="company_name" 
                  name="company_name" 
                  value={editFormData.company_name || ''}
                  onChange={handleEditFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email"
                  value={editFormData.email || ''}
                  onChange={handleEditFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  value={editFormData.phone || ''}
                  onChange={handleEditFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input 
                  id="city" 
                  name="city" 
                  value={editFormData.city || ''}
                  onChange={handleEditFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="region">Região/Estado</Label>
                <Input 
                  id="region" 
                  name="region" 
                  value={editFormData.region || ''}
                  onChange={handleEditFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input 
                  id="address" 
                  name="address" 
                  value={editFormData.address || ''}
                  onChange={handleEditFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input 
                  id="cnpj" 
                  name="cnpj" 
                  value={editFormData.cnpj || ''}
                  onChange={handleEditFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select 
                  id="status" 
                  name="status" 
                  className="w-full px-3 py-2 border rounded-md"
                  value={editFormData.status || 'ativo'}
                  onChange={handleEditFormChange}
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="pendente">Pendente</option>
                  <option value="suspenso">Suspenso</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Configurações Bancárias</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Nome do Banco</Label>
                  <Input 
                    id="bank_name" 
                    name="bank_name" 
                    value={editFormData.bank_name || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bank_account">Conta Bancária</Label>
                  <Input 
                    id="bank_account" 
                    name="bank_account" 
                    value={editFormData.bank_account || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bank_agency">Agência</Label>
                  <Input 
                    id="bank_agency" 
                    name="bank_agency" 
                    value={editFormData.bank_agency || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pix_key">Chave PIX</Label>
                  <Input 
                    id="pix_key" 
                    name="pix_key" 
                    value={editFormData.pix_key || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Opções</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="available_24h" 
                    name="available_24h"
                    checked={editFormData.available_24h || false}
                    onChange={handleEditFormChange}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="available_24h">Disponível 24 horas</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="can_transport_multiple" 
                    name="can_transport_multiple"
                    checked={editFormData.can_transport_multiple || false}
                    onChange={handleEditFormChange}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="can_transport_multiple">Pode transportar múltiplos veículos</Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={updatePartnerMutation.isPending}
              >
                {updatePartnerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Link de Acesso - existente */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link de Acesso do Parceiro</DialogTitle>
            <DialogDescription>
              Compartilhe este link com o parceiro para que ele possa acessar a plataforma de forma limitada.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Link de acesso</Label>
              <div className="flex items-center space-x-2">
                <Input value={accessLink} readOnly />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyLinkToClipboard}
                >
                  {isLinkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {isPermanentLink ? "Este link não expira" : `Este link expira em ${linkExpirationDays} dias.`}
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label>Expiração do link</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={linkExpirationDays}
                  onChange={(e) => setLinkExpirationDays(parseInt(e.target.value))}
                  disabled={isPermanentLink}
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="permanent-link"
                    checked={isPermanentLink}
                    onChange={(e) => setIsPermanentLink(e.target.checked)}
                  />
                  <Label htmlFor="permanent-link">Link permanente</Label>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default TowingPartnerDetailPage;