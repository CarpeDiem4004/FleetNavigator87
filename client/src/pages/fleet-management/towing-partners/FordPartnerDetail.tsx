import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import SafeLink from '@/components/SafeLink';
import { Switch } from '@/components/ui/switch';

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

// Componente dedicado para o parceiro Ford
const FordPartnerDetail: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('info');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [accessLink, setAccessLink] = useState('');
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [linkExpirationDays, setLinkExpirationDays] = useState(30);
  const [isPermanentLink, setIsPermanentLink] = useState(false);

  // Dados fixos do parceiro Ford
  const partner = {
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

  // Dados de exemplo para solicitações
  const [requests, setRequests] = useState([
    {
      id: 1,
      partner_id: 6,
      vehicle_plate: "ABC1234",
      driver_name: "João Silva",
      pickup_location: "Av. Paulista, 1000",
      destination: "Rua Augusta, 500",
      status: "concluido",
      created_at: "2025-05-15T14:30:00Z",
      service_type: "leve",
      urgency: "media",
      estimated_cost: 350,
      rating: 5,
      comments: "Ótimo serviço, muito rápido",
      is_paid: false
    },
    {
      id: 2,
      partner_id: 6,
      vehicle_plate: "DEF5678",
      driver_name: "Maria Souza",
      pickup_location: "Marginal Tietê, km 15",
      destination: "Centro de Manutenção",
      status: "em_andamento",
      created_at: "2025-05-18T09:15:00Z",
      service_type: "médio",
      urgency: "alta",
      estimated_cost: 420,
      rating: null,
      comments: null,
      is_paid: false
    }
  ]);

  // Função para gerar link de acesso externo
  const handleGenerateLink = async () => {
    try {
      // Simulando chamada à API
      setTimeout(() => {
        const token = "ford_unique_token_" + Date.now();
        const baseUrl = window.location.origin;
        // Incluir parâmetro is_permanent na URL se o link for permanente
        const externalUrl = `${baseUrl}/fleet-management/towing-partners/external-access/${token}${isPermanentLink ? '?permanent=true' : ''}`;
        
        setAccessLink(externalUrl);
        setIsLinkModalOpen(true);
        
        toast({
          title: "Link gerado com sucesso",
          description: `O link ${isPermanentLink ? 'permanente' : 'temporário'} de acesso foi gerado e está pronto para ser compartilhado`,
          variant: "default",
        });
      }, 500);
    } catch (error) {
      console.error("Erro ao gerar link externo:", error);
      toast({
        title: "Erro ao gerar link",
        description: "Não foi possível gerar o link de acesso externo",
        variant: "destructive",
      });
    }
  };

  // Função para copiar link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(accessLink);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 3000);
    
    toast({
      title: "Link copiado",
      description: "Link copiado para a área de transferência",
      variant: "default",
    });
  };
  
  // Função para marcar solicitação como paga
  const handleMarkAsPaid = (requestId: number) => {
    try {
      // Aqui seria feita uma chamada à API para atualizar o status de pagamento
      // Por enquanto, apenas atualizamos o estado local
      const updatedRequests = requests.map(req => 
        req.id === requestId ? { ...req, is_paid: true } : req
      );
      setRequests(updatedRequests);
      
      toast({
        title: "Pagamento registrado",
        description: `O pagamento da solicitação #${requestId} foi registrado com sucesso`,
        variant: "default",
      });
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      toast({
        title: "Erro ao registrar pagamento",
        description: "Não foi possível registrar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  // Função para confirmar conclusão de serviço
  const handleConfirmCompletion = (requestId: number) => {
    try {
      // Aqui seria feita uma chamada à API para atualizar o status
      // Por enquanto, apenas atualizamos o estado local
      const updatedRequests = requests.map(req => 
        req.id === requestId ? { ...req, status: "concluido" } : req
      );
      setRequests(updatedRequests);
      
      toast({
        title: "Serviço concluído",
        description: `A solicitação #${requestId} foi marcada como concluída`,
        variant: "default",
      });
    } catch (error) {
      console.error("Erro ao confirmar conclusão:", error);
      toast({
        title: "Erro ao confirmar conclusão",
        description: "Não foi possível confirmar a conclusão do serviço. Tente novamente.",
        variant: "destructive",
      });
    }
  };

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
          subtitle={`Detalhes e histórico do parceiro de guincho`}
          icon={<Truck className="h-6 w-6" />}
        />
      </div>

      {/* Primeira seção: Informações rápidas e ações */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="bg-blue-100 inline-flex rounded-full p-3 mb-3">
                <Truck className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="font-medium text-lg">{partner.name}</h3>
              <p className="text-muted-foreground text-sm">{partner.city}, {partner.region}</p>
              <div className="flex justify-center items-center mt-2">
                <Star className="h-4 w-4 text-amber-500 mr-1" />
                <span className="font-medium">{partner.rating}</span>
                <span className="text-sm text-muted-foreground ml-1">/5</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-medium">Atendimentos</h3>
              <div className="mt-2 text-2xl font-bold">{partner.total_requests || 0}</div>
              <p className="text-sm text-muted-foreground">Total de solicitações</p>
              <div className="mt-1 text-sm">
                <span className="text-green-500 font-medium">{partner.completed_requests || 0}</span> concluídos
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-medium">Status</h3>
              <div className="mt-2">
                <Badge className={
                  partner.status === 'ativo' ? 'bg-green-100 text-green-800' : 
                  partner.status === 'inativo' ? 'bg-red-100 text-red-800' : 
                  'bg-amber-100 text-amber-800'
                }>
                  {partner.status === 'ativo' ? 'Ativo' : 
                   partner.status === 'inativo' ? 'Inativo' : 'Pendente'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {partner.status === 'ativo' 
                  ? 'Parceiro disponível para serviços' 
                  : partner.status === 'inativo' 
                  ? 'Parceiro indisponível no momento' 
                  : 'Aguardando aprovação'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center space-y-3">
            <Button 
              onClick={handleGenerateLink}
              className="w-full"
              variant="outline"
            >
              <Link className="h-4 w-4 mr-2" />
              Gerar link externo
            </Button>
            
            <SafeLink to={`/fleet-management/towing-partners/requests/new?partner=${partner.id}`} className="w-full">
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Nova solicitação
              </Button>
            </SafeLink>
          </CardContent>
        </Card>
      </div>

      {/* Abas de informações e histórico */}
      <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="requests">Solicitações</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados do Parceiro</CardTitle>
                <CardDescription>Informações gerais do parceiro de guincho</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                  <span className="text-muted-foreground">Nome:</span>
                  <span className="font-medium">{partner.name}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                  <span className="text-muted-foreground">Empresa:</span>
                  <span>{partner.company_name}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                  <span className="text-muted-foreground">CNPJ:</span>
                  <span>{partner.cnpj}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                  <span className="text-muted-foreground">Responsável:</span>
                  <span>{partner.contact_person}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                  <span className="text-muted-foreground">Telefone:</span>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{partner.phone}</span>
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                  <span className="text-muted-foreground">E-mail:</span>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{partner.email}</span>
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                  <span className="text-muted-foreground">Endereço:</span>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{partner.address}</span>
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                  <span className="text-muted-foreground">Cidade/Região:</span>
                  <span>{partner.city} - {partner.region}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Detalhes de Serviço</CardTitle>
                <CardDescription>Capacidades e características de atendimento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-[160px_1fr] gap-2 items-center">
                  <span className="text-muted-foreground">Tipos de serviço:</span>
                  <div className="flex flex-wrap gap-2">
                    {partner.service_types?.map((type, index) => (
                      <Badge key={index} variant="outline">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-[160px_1fr] gap-2 items-center">
                  <span className="text-muted-foreground">Formas de pagamento:</span>
                  <div className="flex flex-wrap gap-2">
                    {partner.payment_methods?.map((method, index) => (
                      <Badge key={index} variant="outline">
                        {method}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-[160px_1fr] gap-2 items-center">
                  <span className="text-muted-foreground">Custo por KM:</span>
                  <span>R$ {partner.cost_per_km?.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-[160px_1fr] gap-2 items-center">
                  <span className="text-muted-foreground">Atende 24h:</span>
                  <span>{partner.available_24h ? 'Sim' : 'Não'}</span>
                </div>
                <div className="grid grid-cols-[160px_1fr] gap-2 items-center">
                  <span className="text-muted-foreground">Transporte múltiplo:</span>
                  <span>{partner.can_transport_multiple ? 'Sim' : 'Não'}</span>
                </div>
                <div className="grid grid-cols-[160px_1fr] gap-2 items-center">
                  <span className="text-muted-foreground">Possui seguro:</span>
                  <span>{partner.has_insurance ? 'Sim' : 'Não'}</span>
                </div>
                <div className="grid grid-cols-[160px_1fr] gap-2 items-center">
                  <span className="text-muted-foreground">Raio de cobertura:</span>
                  <span>{partner.coverage_radius ? `${partner.coverage_radius} km` : 'Não informado'}</span>
                </div>
                <div className="grid grid-cols-[160px_1fr] gap-2 items-start">
                  <span className="text-muted-foreground">Observações:</span>
                  <span>{partner.notes || 'Nenhuma observação registrada'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="requests" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Solicitações de Serviço</CardTitle>
                <CardDescription>Histórico de solicitações para este parceiro</CardDescription>
              </div>
              <SafeLink to={`/fleet-management/towing-partners/requests/new?partner=${partner.id}`}>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova solicitação
                </Button>
              </SafeLink>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
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
                        <TableCell>{request.vehicle_plate}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{request.pickup_location}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{request.destination}</TableCell>
                        <TableCell>
                          <Badge className={
                            request.status === 'concluido' ? 'bg-green-100 text-green-800' : 
                            request.status === 'cancelado' ? 'bg-red-100 text-red-800' : 
                            request.status === 'em_andamento' ? 'bg-blue-100 text-blue-800' :
                            request.status === 'aprovado' ? 'bg-purple-100 text-purple-800' :
                            'bg-amber-100 text-amber-800'
                          }>
                            {request.status === 'concluido' ? 'Concluído' : 
                             request.status === 'cancelado' ? 'Cancelado' : 
                             request.status === 'em_andamento' ? 'Em andamento' :
                             request.status === 'aprovado' ? 'Aprovado' : 'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(request.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>R$ {request.estimated_cost.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <SafeLink to={`/fleet-management/towing-partners/requests/${request.id}`}>
                              <Button variant="ghost" size="sm" title="Ver detalhes">
                                <FileText className="h-4 w-4" />
                                <span className="sr-only">Detalhes</span>
                              </Button>
                            </SafeLink>
                            {request.status === 'concluido' && !request.is_paid && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="Marcar como pago"
                                onClick={() => handleMarkAsPaid(request.id)}
                              >
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span className="sr-only">Aprovar Pagamento</span>
                              </Button>
                            )}
                            {request.status === 'em_andamento' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="Confirmar conclusão"
                                onClick={() => handleConfirmCompletion(request.id)}
                              >
                                <Check className="h-4 w-4 text-blue-500" />
                                <span className="sr-only">Confirmar Conclusão</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Atendimento</CardTitle>
                <CardDescription>Desempenho e métricas do parceiro</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Avaliação Média</h4>
                    <div className="flex items-center">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`h-5 w-5 ${star <= Math.round(partner.rating) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <span className="ml-2 font-medium">{partner.rating}</span>
                      <span className="text-sm text-muted-foreground ml-1">/5</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Taxa de Conclusão</h4>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ width: `${partner.completed_requests && partner.total_requests ? (partner.completed_requests / partner.total_requests * 100) : 0}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-sm text-muted-foreground">
                        {partner.completed_requests || 0} concluídos
                      </span>
                      <span className="text-sm font-medium">
                        {partner.total_requests ? Math.round(partner.completed_requests / partner.total_requests * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Serviços por Tipo</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Leve</span>
                        <div className="flex-1 mx-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium">65%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Médio</span>
                        <div className="flex-1 mx-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium">25%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Pesado</span>
                        <div className="flex-1 mx-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium">10%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Performance Mensal</CardTitle>
                <CardDescription>Histórico recente de serviços</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Últimos 3 meses</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Maio/2025</span>
                        <div className="flex-1 mx-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium">12 serviços</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Abril/2025</span>
                        <div className="flex-1 mx-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium">9 serviços</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Março/2025</span>
                        <div className="flex-1 mx-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '47%' }}></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium">7 serviços</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-3">Tempo médio de atendimento</h4>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="rounded-full bg-blue-100 p-2">
                          <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="ml-2">45 minutos</span>
                      </div>
                      <div className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                        -15% vs média
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-3">Localidades mais atendidas</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-red-500 mr-2" />
                          <span>Zona Oeste</span>
                        </div>
                        <span className="font-medium">60%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-red-500 mr-2" />
                          <span>Centro</span>
                        </div>
                        <span className="font-medium">25%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-red-500 mr-2" />
                          <span>Zona Sul</span>
                        </div>
                        <span className="font-medium">15%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal para exibir e copiar o link de acesso externo */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link de acesso externo</DialogTitle>
            <DialogDescription>
              Um link {isPermanentLink ? 'permanente' : 'temporário'} para o parceiro Ford foi gerado. Compartilhe este link para que o parceiro possa registrar serviços prestados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Switch 
                id="permanent-link"
                checked={isPermanentLink}
                onCheckedChange={setIsPermanentLink}
              />
              <Label htmlFor="permanent-link">Link permanente (sem expiração)</Label>
            </div>

            {!isPermanentLink && (
              <div className="space-y-2">
                <Label htmlFor="expiration">Expiração do link (em dias)</Label>
                <Input 
                  id="expiration" 
                  type="number" 
                  value={linkExpirationDays}
                  onChange={(e) => setLinkExpirationDays(parseInt(e.target.value))}
                  min="1"
                  max="365"
                />
                <p className="text-sm text-muted-foreground">
                  Este link expirará após {linkExpirationDays} dias
                </p>
              </div>
            )}
            
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
                  type="button"
                  variant={isLinkCopied ? "default" : "secondary"}
                  className="rounded-l-none"
                  onClick={handleCopyLink}
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

export default FordPartnerDetail;