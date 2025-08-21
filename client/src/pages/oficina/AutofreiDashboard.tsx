import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Wrench, 
  Clock,
  User,
  Phone,
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Car,
  LogOut,
  FileText,
  DollarSign,
  Plus,
  Package,
  Settings,
  Eye,
  Phone as PhoneIcon
} from "lucide-react";
import { useLocation } from "wouter";

interface ServiceOrder {
  id: number;
  vehiclePlate: string;
  description: string;
  status: string;
  priority: string;
  entryDate: string;
  estimatedCompletion?: string;
  initialBudget?: string;
  finalCost?: string;
  maintenanceType: string;
}

export default function AutofreiDashboard() {
  const [, setLocation] = useLocation();
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadServiceOrders();
  }, []);

  const loadServiceOrders = async () => {
    try {
      setIsLoading(true);
      // Simulando dados para demonstração
      setTimeout(() => {
        setServiceOrders([
          {
            id: 1,
            vehiclePlate: "ABC1234",
            description: "Troca de pastilhas de freio e discos",
            status: "em_andamento",
            priority: "alta",
            entryDate: "2025-08-21",
            estimatedCompletion: "2025-08-22",
            initialBudget: "450.00",
            maintenanceType: "freios"
          },
          {
            id: 2,
            vehiclePlate: "XYZ5678",
            description: "Revisão completa e troca de filtros",
            status: "aguardando_peca",
            priority: "normal",
            entryDate: "2025-08-20",
            estimatedCompletion: "2025-08-23",
            initialBudget: "320.00",
            maintenanceType: "revisao"
          }
        ]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erro ao carregar ordens de serviço:', error);
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    setLocation('/oficina/autofrei/login');
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'em_andamento': { label: 'Em Andamento', variant: 'default' as const },
      'aguardando_peca': { label: 'Aguardando Peça', variant: 'secondary' as const },
      'concluido': { label: 'Concluído', variant: 'default' as const },
      'pendente': { label: 'Pendente', variant: 'destructive' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      'alta': { label: 'Alta', variant: 'destructive' as const },
      'normal': { label: 'Normal', variant: 'default' as const },
      'baixa': { label: 'Baixa', variant: 'secondary' as const }
    };
    
    const priorityInfo = priorityMap[priority as keyof typeof priorityMap] || { label: priority, variant: 'secondary' as const };
    return <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-blue-600 p-2 rounded-lg mr-3">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AUTOFREI</h1>
                <p className="text-sm text-gray-500">Peças e Acessórios para Veículos</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">CNPJ: 33.704.013/0001-09</p>
                <p className="text-sm text-gray-500">autofreipecas@gmail.com</p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ordens Ativas</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{serviceOrders.filter(so => so.status !== 'concluido').length}</div>
              <p className="text-xs text-muted-foreground">Em andamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aguardando Peças</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{serviceOrders.filter(so => so.status === 'aguardando_peca').length}</div>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas Hoje</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{serviceOrders.filter(so => so.status === 'concluido').length}</div>
              <p className="text-xs text-muted-foreground">Finalizadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 1.250,00</div>
              <p className="text-xs text-muted-foreground">Este mês</p>
            </CardContent>
          </Card>
        </div>

        {/* Service Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ordens de Serviço</CardTitle>
                  <CardDescription>Gerenciamento de serviços em andamento</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Ordem
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Carregando ordens de serviço...</p>
                </div>
              ) : serviceOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma ordem de serviço encontrada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {serviceOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Car className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {order.vehiclePlate}
                            </h3>
                            <p className="text-sm text-gray-500">
                              OS #{order.id}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(order.status)}
                          {getPriorityBadge(order.priority)}
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{order.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Entrada</p>
                          <p className="font-medium">{order.entryDate}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Previsão</p>
                          <p className="font-medium">{order.estimatedCompletion || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Orçamento</p>
                          <p className="font-medium">R$ {order.initialBudget}</p>
                        </div>
                        <div className="flex justify-end">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PhoneIcon className="h-5 w-5 mr-2" />
                Informações de Contato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-900">Telefone</p>
                  <p className="text-gray-600">(11) 94758-5328</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <p className="text-gray-600">autofreipecas@gmail.com</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Endereço</p>
                  <p className="text-gray-600">Av. Mutinga, 2278 - Jardim Santo Elias, São Paulo - SP</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}