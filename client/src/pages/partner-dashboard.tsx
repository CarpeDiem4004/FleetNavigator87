import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  const [loading, setLoading] = useState(true);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    vehiclePlate: '',
    vehicleModel: '',
    vehicleType: '',
    pickupLocation: '',
    deliveryLocation: '',
    totalKm: '',
    serviceValue: '',
    observations: ''
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
      
      // Buscar serviços do parceiro
      fetchPartnerServices(token, parsedPartner.id);
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



  const handleLogout = () => {
    localStorage.removeItem('partner_token');
    localStorage.removeItem('partner_data');
    navigate('/partner/login');
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('partner_token');
    
    if (!token || !partner) return;

    try {
      const response = await fetch(`/api/towing/partners/${partner.id}/services`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vehicle_plate: serviceForm.vehiclePlate,
          vehicle_model: serviceForm.vehicleModel,
          vehicle_type: serviceForm.vehicleType,
          pickup_location: serviceForm.pickupLocation,
          delivery_location: serviceForm.deliveryLocation,
          total_km: parseFloat(serviceForm.totalKm),
          service_value: parseFloat(serviceForm.serviceValue),
          observations: serviceForm.observations,
          status: 'pendente'
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Resetar formulário e recarregar serviços
        setServiceForm({
          vehiclePlate: '',
          vehicleModel: '',
          vehicleType: '',
          pickupLocation: '',
          deliveryLocation: '',
          totalKm: '',
          serviceValue: '',
          observations: ''
        });
        setShowServiceDialog(false);
        
        // Recarregar a lista de serviços para mostrar o novo registro
        await fetchPartnerServices(token, partner.id);
        
        alert('✅ Serviço registrado com sucesso!\n\nO serviço foi adicionado ao seu histórico e está aguardando aprovação da equipe Murici Logística.');
      } else {
        const errorData = await response.json();
        alert(`❌ Erro ao registrar serviço: ${errorData.message || 'Tente novamente.'}`);
      }
    } catch (error) {
      console.error('Erro ao registrar serviço:', error);
      alert('Erro ao registrar serviço. Tente novamente.');
    }
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
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span>Serviços Realizados</span>
                    </CardTitle>
                    <CardDescription>
                      Histórico dos seus serviços de guincho
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => setShowServiceDialog(true)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Serviço
                  </Button>
                </div>
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


          </div>
        </div>



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

        {/* Modal de Registro de Serviço */}
        <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Novo Serviço</DialogTitle>
              <DialogDescription>
                Preencha as informações do serviço de guincho realizado
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleServiceSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Placa do Veículo */}
                <div>
                  <Label htmlFor="vehiclePlate">Placa do Veículo</Label>
                  <Input
                    id="vehiclePlate"
                    value={serviceForm.vehiclePlate}
                    onChange={(e) => setServiceForm({...serviceForm, vehiclePlate: e.target.value})}
                    placeholder="ABC-1234"
                    required
                  />
                </div>

                {/* Modelo do Veículo */}
                <div>
                  <Label htmlFor="vehicleModel">Modelo do Veículo</Label>
                  <Input
                    id="vehicleModel"
                    value={serviceForm.vehicleModel}
                    onChange={(e) => setServiceForm({...serviceForm, vehicleModel: e.target.value})}
                    placeholder="Ex: Ford Transit, Mercedes Sprinter"
                    required
                  />
                </div>

                {/* Tipo de Veículo */}
                <div>
                  <Label htmlFor="vehicleType">Tipo de Veículo</Label>
                  <Select 
                    value={serviceForm.vehicleType} 
                    onValueChange={(value) => setServiceForm({...serviceForm, vehicleType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fiorino">Fiorino</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="3/4">3/4</SelectItem>
                      <SelectItem value="vuc">VUC</SelectItem>
                      <SelectItem value="toco">Toco</SelectItem>
                      <SelectItem value="truck">Truck</SelectItem>
                      <SelectItem value="cavalo">Cavalo</SelectItem>
                      <SelectItem value="carreta">Carreta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Valor do Serviço */}
                <div>
                  <Label htmlFor="serviceValue">Valor do Serviço (R$)</Label>
                  <Input
                    id="serviceValue"
                    type="number"
                    step="0.01"
                    value={serviceForm.serviceValue}
                    onChange={(e) => setServiceForm({...serviceForm, serviceValue: e.target.value})}
                    placeholder="150.00"
                    required
                  />
                </div>

                {/* Local de Retirada */}
                <div>
                  <Label htmlFor="pickupLocation">Local de Retirada</Label>
                  <Input
                    id="pickupLocation"
                    value={serviceForm.pickupLocation}
                    onChange={(e) => setServiceForm({...serviceForm, pickupLocation: e.target.value})}
                    placeholder="Endereço ou referência"
                    required
                  />
                </div>

                {/* Local de Entrega */}
                <div>
                  <Label htmlFor="deliveryLocation">Local de Entrega</Label>
                  <Input
                    id="deliveryLocation"
                    value={serviceForm.deliveryLocation}
                    onChange={(e) => setServiceForm({...serviceForm, deliveryLocation: e.target.value})}
                    placeholder="Endereço ou referência"
                    required
                  />
                </div>

                {/* KM Total */}
                <div className="md:col-span-2">
                  <Label htmlFor="totalKm">Quilometragem Total</Label>
                  <Input
                    id="totalKm"
                    type="number"
                    step="0.1"
                    value={serviceForm.totalKm}
                    onChange={(e) => setServiceForm({...serviceForm, totalKm: e.target.value})}
                    placeholder="25.5"
                    required
                  />
                </div>

                {/* Observações */}
                <div className="md:col-span-2">
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea
                    id="observations"
                    value={serviceForm.observations}
                    onChange={(e) => setServiceForm({...serviceForm, observations: e.target.value})}
                    placeholder="Informações adicionais sobre o serviço..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowServiceDialog(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Registrar Serviço
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}