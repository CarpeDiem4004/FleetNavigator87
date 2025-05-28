import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Truck, User, Phone, Mail, MapPin, LogOut, FileText, Clock, Plus, Route, Calculator } from 'lucide-react';

interface Partner {
  id: number;
  name: string;
  company_name: string;
  email: string;
  phone: string;
  city: string;
  type: string;
}

export default function PartnerDashboard() {
  const [, navigate] = useLocation();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [services, setServices] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRouteDialog, setShowRouteDialog] = useState(false);
  const [routeForm, setRouteForm] = useState({
    origin: '',
    destination: '',
    totalKm: '',
    description: '',
    vehiclePlate: ''
  });

  useEffect(() => {
    // Verificar se há token e dados do parceiro
    const token = localStorage.getItem('partner_token');
    const partnerData = localStorage.getItem('partner_data');

    if (!token || !partnerData) {
      navigate('/partner/login');
      return;
    }

    try {
      const parsedPartner = JSON.parse(partnerData);
      setPartner(parsedPartner);
      
      // Buscar serviços e rotas do parceiro
      fetchPartnerServices(token, parsedPartner.id);
      fetchPartnerRoutes(token, parsedPartner.id);
    } catch (error) {
      console.error('Erro ao carregar dados do parceiro:', error);
      navigate('/partner/login');
    }
  }, [navigate]);

  const fetchPartnerServices = async (token: string, partnerId: number) => {
    try {
      const response = await fetch(`/api/towing/partners/${partnerId}/services`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPartnerRoutes = async (token: string, partnerId: number) => {
    try {
      const response = await fetch(`/api/towing/partners/${partnerId}/routes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoutes(data.routes || []);
      }
    } catch (error) {
      console.error('Erro ao buscar rotas:', error);
    }
  };

  const handleRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('partner_token');
    
    if (!token || !partner) return;

    try {
      const response = await fetch(`/api/towing/partners/${partner.id}/routes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(routeForm)
      });

      if (response.ok) {
        // Resetar formulário e recarregar rotas
        setRouteForm({
          origin: '',
          destination: '',
          totalKm: '',
          description: '',
          vehiclePlate: ''
        });
        setShowRouteDialog(false);
        fetchPartnerRoutes(token, partner.id);
      }
    } catch (error) {
      console.error('Erro ao cadastrar rota:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('partner_token');
    localStorage.removeItem('partner_data');
    navigate('/partner/login');
  };

  if (!partner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Portal do Parceiro</h1>
                <p className="text-sm text-gray-500">Bem-vindo, {partner.name}</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informações do Parceiro */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Informações do Parceiro</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Nome</p>
                  <p className="text-sm text-gray-900">{partner.name}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Empresa</p>
                  <p className="text-sm text-gray-900">{partner.company_name}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{partner.phone}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{partner.email}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{partner.city}</span>
                </div>

                <div className="pt-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Parceiro Ativo
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Serviços Realizados */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Serviços Realizados</span>
                </CardTitle>
                <CardDescription>
                  Histórico dos seus serviços de guincho
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Carregando serviços...</p>
                  </div>
                ) : services.length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum serviço registrado ainda</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Os serviços realizados aparecerão aqui após aprovação
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {services.map((service: any, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge 
                                variant={service.status === 'aprovado' ? 'default' : 'secondary'}
                              >
                                {service.status}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                Serviço #{service.id}
                              </span>
                            </div>
                            <p className="text-sm text-gray-900 mb-1">
                              <strong>Veículo:</strong> {service.vehicle_plate}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>De:</strong> {service.pickup_location}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Para:</strong> {service.destination}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(service.service_date).toLocaleDateString('pt-BR')}</span>
                            </div>
                            {service.cost && (
                              <p className="text-sm font-medium text-green-600 mt-1">
                                R$ {parseFloat(service.cost).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card de Cadastro de Rotas */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2">
                    <Route className="w-5 h-5" />
                    <span>Cadastro de Rotas</span>
                  </CardTitle>
                  <Button 
                    onClick={() => setShowRouteDialog(true)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Rota
                  </Button>
                </div>
                <CardDescription>
                  Registre rotas com origem, destino e quilometragem total
                </CardDescription>
              </CardHeader>
              <CardContent>
                {routes.length === 0 ? (
                  <div className="text-center py-8">
                    <Route className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhuma rota cadastrada</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Registre suas rotas para melhor controle
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {routes.map((route: any, index) => (
                      <div key={index} className="border rounded-lg p-3 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm">
                              {route.origin} → {route.destination}
                            </h4>
                            <p className="text-xs text-gray-600 mt-1">
                              <strong>Distância:</strong> {route.total_km} km
                            </p>
                            {route.vehicle_plate && (
                              <p className="text-xs text-blue-600">
                                Veículo: {route.vehicle_plate}
                              </p>
                            )}
                            {route.description && (
                              <p className="text-xs text-gray-500 mt-1">
                                {route.description}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(route.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal para Cadastro de Rota */}
        {showRouteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Cadastrar Nova Rota</CardTitle>
                <CardDescription>
                  Registre uma rota com origem, destino e quilometragem
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRouteSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Origem</label>
                    <input
                      type="text"
                      value={routeForm.origin}
                      onChange={(e) => setRouteForm({...routeForm, origin: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Local de origem"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Destino</label>
                    <input
                      type="text"
                      value={routeForm.destination}
                      onChange={(e) => setRouteForm({...routeForm, destination: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Local de destino"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Quilometragem Total (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={routeForm.totalKm}
                      onChange={(e) => setRouteForm({...routeForm, totalKm: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.0"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Placa do Veículo (opcional)</label>
                    <input
                      type="text"
                      value={routeForm.vehiclePlate}
                      onChange={(e) => setRouteForm({...routeForm, vehiclePlate: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: ABC-1234"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Observações (opcional)</label>
                    <textarea
                      value={routeForm.description}
                      onChange={(e) => setRouteForm({...routeForm, description: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Observações sobre a rota"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowRouteDialog(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Cadastrar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Instruções */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Como Funciona</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Receba Solicitações</h3>
                <p className="text-sm text-gray-600">
                  A equipe da Murici Logística entrará em contato quando precisar dos seus serviços
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Realize o Serviço</h3>
                <p className="text-sm text-gray-600">
                  Execute o serviço de guincho conforme solicitado e registre os detalhes
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Receba o Pagamento</h3>
                <p className="text-sm text-gray-600">
                  Após aprovação, o pagamento será processado conforme acordado
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}