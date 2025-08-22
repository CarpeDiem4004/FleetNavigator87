import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  Car,
  Clock,
  User,
  Phone,
  MapPin,
  DollarSign,
  Eye,
  FileText,
  CheckCircle,
  AlertCircle,
  Calendar,
  Wrench
} from "lucide-react";
import { useLocation } from "wouter";

interface BudgetRequest {
  id: number;
  vehiclePlate: string;
  vehicleModel: string;
  description: string;
  priority: string;
  status: string;
  requestDate: string;
  deadlineDate?: string;
  estimatedValue?: number;
  requestedBy: string;
  contactPhone: string;
  location: string;
  serviceType: string;
  observations?: string;
}

export default function AutofreiSolicitacoes() {
  const [, setLocation] = useLocation();
  const [budgetRequests, setBudgetRequests] = useState<BudgetRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadBudgetRequests();
  }, []);

  const loadBudgetRequests = async () => {
    try {
      setIsLoading(true);
      // Simulando dados para demonstração - aqui conectar com API real
      setTimeout(() => {
        setBudgetRequests([
          {
            id: 1,
            vehiclePlate: "ABC1234",
            vehicleModel: "Volkswagen Constellation 24.280",
            description: "Substituição do sistema de freios e revisão completa dos discos",
            priority: "alta",
            status: "nova",
            requestDate: "2025-08-22",
            deadlineDate: "2025-08-25",
            estimatedValue: 1500.00,
            requestedBy: "João Silva - Gestor de Frotas",
            contactPhone: "(11) 99999-9999",
            location: "Base Campinas - SP",
            serviceType: "Freios",
            observations: "Veículo apresentando ruídos anômalos no sistema de freios. Urgente para frota ativa."
          },
          {
            id: 2,
            vehiclePlate: "XYZ5678",
            vehicleModel: "Mercedes-Benz Atego 1719",
            description: "Troca de filtros de ar, óleo e combustível + revisão preventiva",
            priority: "normal",
            status: "em_analise",
            requestDate: "2025-08-21",
            deadlineDate: "2025-08-28",
            estimatedValue: 800.00,
            requestedBy: "Maria Santos - Supervisora",
            contactPhone: "(11) 88888-8888",
            location: "Base São Paulo - SP",
            serviceType: "Revisão Preventiva",
            observations: "Manutenção programada conforme plano de manutenção preventiva."
          },
          {
            id: 3,
            vehiclePlate: "DEF9012",
            vehicleModel: "Iveco Daily 70C16",
            description: "Reparo no sistema elétrico e substituição de alternador",
            priority: "media",
            status: "aguardando_resposta",
            requestDate: "2025-08-20",
            deadlineDate: "2025-08-26",
            estimatedValue: 1200.00,
            requestedBy: "Carlos Oliveira - Coordenador",
            contactPhone: "(11) 77777-7777",
            location: "Base Santos - SP",
            serviceType: "Sistema Elétrico"
          }
        ]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'nova': { label: 'Nova Solicitação', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
      'em_analise': { label: 'Em Análise', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      'aguardando_resposta': { label: 'Aguardando Resposta', variant: 'outline' as const, color: 'bg-orange-100 text-orange-800' },
      'aprovada': { label: 'Aprovada', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      'rejeitada': { label: 'Rejeitada', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      'alta': { label: 'Alta Prioridade', color: 'bg-red-100 text-red-800' },
      'media': { label: 'Prioridade Média', color: 'bg-yellow-100 text-yellow-800' },
      'normal': { label: 'Prioridade Normal', color: 'bg-green-100 text-green-800' },
      'baixa': { label: 'Baixa Prioridade', color: 'bg-gray-100 text-gray-800' }
    };
    
    const priorityInfo = priorityMap[priority as keyof typeof priorityMap] || { label: priority, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={priorityInfo.color}>{priorityInfo.label}</Badge>;
  };

  const handleCreateBudget = (requestId: number) => {
    toast({
      title: "Orçamento em preparação",
      description: `Iniciando criação de orçamento para solicitação #${requestId}`,
    });
    // Aqui implementar a lógica para criar orçamento
  };

  const handleViewDetails = (requestId: number) => {
    toast({
      title: "Visualizando detalhes",
      description: `Abrindo detalhes da solicitação #${requestId}`,
    });
    // Aqui implementar navegação para detalhes
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/oficina/autofrei/dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="bg-purple-600 p-2 rounded-lg mr-3">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Solicitações de Orçamentos</h1>
                <p className="text-sm text-gray-500">Gestão de Frotas - AUTOFREI</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">CNPJ: 33.704.013/0001-09</p>
              <p className="text-sm text-gray-500">autofreipecas@gmail.com</p>
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
              <CardTitle className="text-sm font-medium">Total Solicitações</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{budgetRequests.length}</div>
              <p className="text-xs text-muted-foreground">Recebidas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novas</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{budgetRequests.filter(req => req.status === 'nova').length}</div>
              <p className="text-xs text-muted-foreground">Aguardando análise</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Análise</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{budgetRequests.filter(req => req.status === 'em_analise').length}</div>
              <p className="text-xs text-muted-foreground">Em processamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {budgetRequests.reduce((total, req) => total + (req.estimatedValue || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Estimado</p>
            </CardContent>
          </Card>
        </div>

        {/* Solicitações List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Solicitações de Orçamentos</CardTitle>
                <CardDescription>Lista de solicitações recebidas da gestão de frotas</CardDescription>
              </div>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Exportar Lista
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Carregando solicitações...</p>
              </div>
            ) : budgetRequests.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma solicitação encontrada</p>
              </div>
            ) : (
              <div className="space-y-6">
                {budgetRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-6 hover:bg-gray-50">
                    {/* Header da Solicitação */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-purple-100 p-3 rounded-lg">
                          <Car className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.vehiclePlate} - {request.vehicleModel}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Solicitação #{request.id} • {request.serviceType}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(request.status)}
                        {getPriorityBadge(request.priority)}
                      </div>
                    </div>

                    {/* Descrição */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Descrição do Serviço</h4>
                      <p className="text-gray-700">{request.description}</p>
                      {request.observations && (
                        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm text-amber-800">
                            <strong>Observações:</strong> {request.observations}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Informações da Solicitação */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Solicitado por</p>
                          <p className="font-medium">{request.requestedBy}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Contato</p>
                          <p className="font-medium">{request.contactPhone}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Localização</p>
                          <p className="font-medium">{request.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Valor Estimado</p>
                          <p className="font-medium">
                            {request.estimatedValue ? 
                              `R$ ${request.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 
                              'A consultar'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Datas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Data da Solicitação</p>
                          <p className="font-medium">{new Date(request.requestDate).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      {request.deadlineDate && (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Prazo para Resposta</p>
                            <p className="font-medium">{new Date(request.deadlineDate).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex flex-wrap gap-3">
                      <Button 
                        onClick={() => handleCreateBudget(request.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Wrench className="h-4 w-4 mr-2" />
                        Criar Orçamento
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleViewDetails(request.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                      <Button variant="outline">
                        <Phone className="h-4 w-4 mr-2" />
                        Entrar em Contato
                      </Button>
                      <Button variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Gerar PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}