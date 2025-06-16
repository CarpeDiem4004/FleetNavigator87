import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Building2, 
  Wrench, 
  Car, 
  Clock, 
  DollarSign, 
  Plus,
  Eye,
  Edit,
  FileText,
  Settings,
  Users,
  TrendingUp
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ServiceOrder {
  id: number;
  numero_ordem: string;
  placa: string;
  modelo: string;
  tipo_servico: string;
  descricao: string;
  status: string;
  data_entrada: string;
  data_prevista: string;
  data_conclusao?: string;
  valor_pecas: number;
  valor_mao_obra: number;
  valor_total: number;
  oficina_id: number;
  oficina_nome: string;
  oficina_cnpj: string;
}

interface Workshop {
  id: number;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  telefone: string;
  email: string;
  endereco: string;
  is_active: boolean;
}

interface MaintenanceStats {
  total_orders: number;
  orders_in_progress: number;
  orders_completed: number;
  orders_pending: number;
  total_cost: number;
  average_cost: number;
}

export default function MaintenanceManagement() {
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [stats, setStats] = useState<MaintenanceStats>({
    total_orders: 0,
    orders_in_progress: 0,
    orders_completed: 0,
    orders_pending: 0,
    total_cost: 0,
    average_cost: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar ordens de serviço
      const ordersResponse = await apiRequest("GET", "/api/maintenance/orders");
      const ordersData = await ordersResponse.json();
      setServiceOrders(ordersData.orders || []);

      // Carregar oficinas
      const workshopsResponse = await apiRequest("GET", "/api/maintenance/workshops");
      const workshopsData = await workshopsResponse.json();
      setWorkshops(workshopsData.workshops || []);

      // Calcular estatísticas
      const orders = ordersData.orders || [];
      const totalCost = orders.reduce((sum: number, order: ServiceOrder) => sum + order.valor_total, 0);
      
      setStats({
        total_orders: orders.length,
        orders_in_progress: orders.filter((o: ServiceOrder) => o.status === 'em_andamento').length,
        orders_completed: orders.filter((o: ServiceOrder) => o.status === 'concluido').length,
        orders_pending: orders.filter((o: ServiceOrder) => o.status === 'aguardando_orcamento').length,
        total_cost: totalCost,
        average_cost: orders.length > 0 ? totalCost / orders.length : 0
      });

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de manutenção",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'aguardando_orcamento': { label: 'Aguardando Orçamento', color: 'bg-yellow-100 text-yellow-800' },
      'em_andamento': { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' },
      'concluido': { label: 'Concluído', color: 'bg-green-100 text-green-800' },
      'cancelado': { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { label: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const filteredOrders = serviceOrders.filter(order =>
    order.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.oficina_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.numero_ordem.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWorkshops = workshops.filter(workshop =>
    workshop.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workshop.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workshop.cnpj.includes(searchTerm)
  );

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Wrench className="mr-2 h-8 w-8" />
                Gestão de Manutenção
              </h1>
              <p className="text-muted-foreground mt-1">
                Controle completo sobre ordens de serviço e oficinas parceiras
              </p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Ordem de Serviço
            </Button>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Ordens</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_orders}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.orders_in_progress}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.orders_completed}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.orders_pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  }).format(stats.total_cost)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Custo Médio</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  }).format(stats.average_cost)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="orders">Ordens de Serviço</TabsTrigger>
              <TabsTrigger value="workshops">Oficinas Credenciadas</TabsTrigger>
            </TabsList>

            {/* Ordens de Serviço */}
            <TabsContent value="orders" className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por placa, modelo, oficina ou número da ordem..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4">
                {isLoading ? (
                  <div className="text-center py-8">Carregando...</div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma ordem de serviço encontrada
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <Card key={order.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Car className="h-5 w-5" />
                              OS #{order.numero_ordem} - {order.placa}
                            </CardTitle>
                            <CardDescription>
                              {order.modelo} • {order.tipo_servico}
                            </CardDescription>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Oficina</p>
                            <p className="font-medium">{order.oficina_nome}</p>
                            <p className="text-sm text-muted-foreground">{order.oficina_cnpj}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Datas</p>
                            <p className="text-sm">Entrada: {new Date(order.data_entrada).toLocaleDateString('pt-BR')}</p>
                            <p className="text-sm">Previsão: {new Date(order.data_prevista).toLocaleDateString('pt-BR')}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                            <p className="text-lg font-bold">
                              {new Intl.NumberFormat('pt-BR', { 
                                style: 'currency', 
                                currency: 'BRL' 
                              }).format(order.valor_total)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Descrição</p>
                          <p className="text-sm">{order.descricao}</p>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            Detalhes
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Oficinas Credenciadas */}
            <TabsContent value="workshops" className="space-y-4">
              <div className="flex justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar oficinas..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Oficina
                </Button>
              </div>

              <div className="grid gap-4">
                {isLoading ? (
                  <div className="text-center py-8">Carregando...</div>
                ) : filteredWorkshops.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma oficina encontrada
                  </div>
                ) : (
                  filteredWorkshops.map((workshop) => (
                    <Card key={workshop.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Building2 className="h-5 w-5" />
                              {workshop.nome_fantasia}
                            </CardTitle>
                            <CardDescription>
                              {workshop.razao_social}
                            </CardDescription>
                          </div>
                          <Badge className={workshop.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {workshop.is_active ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">CNPJ</p>
                            <p className="font-medium">{workshop.cnpj}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                            <p className="font-medium">{workshop.telefone}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Email</p>
                            <p className="font-medium">{workshop.email}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Endereço</p>
                            <p className="font-medium">{workshop.endereco}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            Detalhes
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="mr-2 h-4 w-4" />
                            Configurar
                          </Button>
                          <Button variant="outline" size="sm">
                            <Users className="mr-2 h-4 w-4" />
                            Usuários
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}