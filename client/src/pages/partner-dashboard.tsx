import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Truck, 
  MapPin, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  User,
  Phone,
  Building,
  LogOut
} from 'lucide-react';

interface Partner {
  id: number;
  name: string;
  phone: string;
  address: string;
  active: boolean;
}

interface Service {
  id: number;
  vehicle_plate: string;
  origin_address: string;
  destination_address: string;
  service_type: string;
  status: string;
  created_at: string;
  estimated_cost: number;
  actual_cost: number;
  notes: string;
}

export default function PartnerDashboard() {
  const [, setLocation] = useLocation();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Verificar se o parceiro está logado
    const sessionData = localStorage.getItem('partner_session');
    if (!sessionData) {
      setLocation('/partner/access');
      return;
    }

    try {
      const data = JSON.parse(sessionData);
      if (data.success && data.partner) {
        setPartner(data.partner);
        setServices(data.services || []);
        setLoading(false);
      } else {
        throw new Error('Dados de sessão inválidos');
      }
    } catch (error) {
      console.error('Erro ao carregar sessão:', error);
      localStorage.removeItem('partner_session');
      setLocation('/partner/access');
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem('partner_session');
    setLocation('/partner/access');
  };

  const updateServiceStatus = async (serviceId: number, newStatus: string, actualCost?: number) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/partner-service-update', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      const response = await new Promise((resolve, reject) => {
        xhr.onload = function() {
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (parseError) {
              reject(new Error('Erro na resposta do servidor'));
            }
          } else {
            reject(new Error(`Erro HTTP ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => reject(new Error('Erro de conexão'));
        xhr.send(JSON.stringify({
          serviceId,
          partnerId: partner?.id,
          status: newStatus,
          actualCost,
          notes: `Status atualizado para ${newStatus} em ${new Date().toLocaleString('pt-BR')}`
        }));
      });

      // Atualizar a lista local
      setServices(prev => prev.map(service => 
        service.id === serviceId 
          ? { ...service, status: newStatus, actual_cost: actualCost || service.actual_cost }
          : service
      ));

    } catch (error: any) {
      setError(error.message || 'Erro ao atualizar serviço');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'em_andamento': return 'bg-blue-100 text-blue-800';
      case 'concluido': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendente': return <Clock className="h-4 w-4" />;
      case 'em_andamento': return <Truck className="h-4 w-4" />;
      case 'concluido': return <CheckCircle className="h-4 w-4" />;
      case 'cancelado': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Truck className="h-12 w-12 animate-pulse text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Portal do Parceiro</h1>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Informações do Parceiro */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Informações do Parceiro</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">{partner?.name}</p>
                  <p className="text-sm text-gray-500">Nome do Parceiro</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">{partner?.phone || 'Não informado'}</p>
                  <p className="text-sm text-gray-500">Telefone</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Building className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">{partner?.address || 'Não informado'}</p>
                  <p className="text-sm text-gray-500">Endereço</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Serviços</p>
                  <p className="text-2xl font-bold">{services.length}</p>
                </div>
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold">
                    {services.filter(s => s.status === 'pendente').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Em Andamento</p>
                  <p className="text-2xl font-bold">
                    {services.filter(s => s.status === 'em_andamento').length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Concluídos</p>
                  <p className="text-2xl font-bold">
                    {services.filter(s => s.status === 'concluido').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Serviços */}
        <Card>
          <CardHeader>
            <CardTitle>Serviços Ativos</CardTitle>
            <CardDescription>
              Gerencie seus serviços de guincho e atualize o status conforme necessário
            </CardDescription>
          </CardHeader>
          <CardContent>
            {services.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum serviço encontrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getStatusColor(service.status)}>
                            {getStatusIcon(service.status)}
                            <span className="ml-1">{service.status.replace('_', ' ').toUpperCase()}</span>
                          </Badge>
                          <span className="text-sm text-gray-500">#{service.id}</span>
                        </div>
                        <p className="font-medium mb-1">
                          Veículo: <span className="text-blue-600">{service.vehicle_plate}</span>
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          Tipo: {service.service_type}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(service.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-lg">
                          R$ {(service.actual_cost || service.estimated_cost || 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {service.actual_cost ? 'Valor Final' : 'Estimativa'}
                        </p>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Origem</p>
                        <p className="text-sm flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                          {service.origin_address}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Destino</p>
                        <p className="text-sm flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                          {service.destination_address}
                        </p>
                      </div>
                    </div>

                    {service.status === 'pendente' && (
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => updateServiceStatus(service.id, 'em_andamento')}
                        >
                          Iniciar Serviço
                        </Button>
                      </div>
                    )}

                    {service.status === 'em_andamento' && (
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateServiceStatus(service.id, 'concluido', service.estimated_cost)}
                        >
                          Concluir Serviço
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}