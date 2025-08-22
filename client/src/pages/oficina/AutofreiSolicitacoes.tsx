import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Clock, Calendar, User, Car, MapPin, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface BudgetRequest {
  id: number;
  vehicle_plate: string;
  vehicle_model: string;
  description: string;
  workshop_id: number;
  workshop_name: string;
  status: string;
  chassis?: string;
  km?: number;
  projeto?: string;
  created_at: string;
  requester_name?: string;
  estimated_value?: number;
  approved_value?: number;
}

const AUTOFREI_ID = 12;

export default function AutofreiSolicitacoes() {
  const [, setLocation] = useLocation();
  const [requests, setRequests] = useState<BudgetRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/campinas/budget-requests', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Filtrar apenas solicitações para AUTOFREI
          const autofreiRequests = result.data.filter((request: BudgetRequest) => 
            request.workshop_id === AUTOFREI_ID
          );
          setRequests(autofreiRequests);
          console.log(`Solicitações carregadas para AUTOFREI: ${autofreiRequests.length}`);
        } else {
          console.error('Erro na resposta da API:', result.message);
          setRequests([]);
        }
      } else {
        console.error('Erro ao carregar solicitações:', response.status);
        setRequests([]);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as solicitações",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      setRequests([]);
      toast({
        title: "Erro",
        description: "Erro de conexão ao carregar solicitações",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pendente': { label: 'Pendente', variant: 'secondary' as const },
      'em_analise': { label: 'Em Análise', variant: 'outline' as const },
      'aprovado': { label: 'Aprovado', variant: 'default' as const },
      'rejeitado': { label: 'Rejeitado', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { label: status, variant: 'secondary' as const };
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/oficina/autofrei/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Solicitações de Orçamento</h1>
            <p className="text-gray-600">Visualize todas as solicitações recebidas da gestão de frotas</p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{requests.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {requests.filter(r => r.status === 'pendente').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Em Análise</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {requests.filter(r => r.status === 'em_analise').length}
                  </p>
                </div>
                <Settings className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aprovados</p>
                  <p className="text-2xl font-bold text-green-600">
                    {requests.filter(r => r.status === 'aprovado').length}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botão de Atualizar */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Lista de Solicitações</h2>
          <Button onClick={loadRequests} disabled={isLoading} variant="outline">
            {isLoading ? "Carregando..." : "Atualizar"}
          </Button>
        </div>

        {/* Lista de Solicitações */}
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : requests.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {requests.map((request) => (
              <Card key={request.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        #{request.id}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {request.description}
                      </CardDescription>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Informações do Veículo */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Car className="h-4 w-4" />
                    <span className="font-medium">{request.vehicle_plate}</span>
                    <span>-</span>
                    <span>{request.vehicle_model}</span>
                  </div>

                  {/* Chassis e KM */}
                  {(request.chassis || request.km) && (
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {request.chassis && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Chassis:</span>
                          <span>{request.chassis}</span>
                        </div>
                      )}
                      {request.km && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">KM:</span>
                          <span>{request.km.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Projeto */}
                  {request.projeto && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">Projeto:</span>
                      <span>{request.projeto}</span>
                    </div>
                  )}

                  {/* Solicitante */}
                  {request.requester_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span className="font-medium">Solicitante:</span>
                      <span>{request.requester_name}</span>
                    </div>
                  )}

                  {/* Data */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Data:</span>
                    <span>{formatDate(request.created_at)}</span>
                  </div>

                  {/* Ações */}
                  <div className="pt-3 border-t">
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => toast({
                        title: "Funcionalidade em desenvolvimento",
                        description: "Em breve você poderá responder às solicitações diretamente aqui"
                      })}
                    >
                      Responder Solicitação
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center p-8">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma Solicitação Encontrada
              </h3>
              <p className="text-gray-600">
                Não há solicitações de orçamento para sua oficina no momento.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}