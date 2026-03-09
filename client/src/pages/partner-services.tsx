import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, MapPin, Calendar, DollarSign, FileText, ArrowLeft } from 'lucide-react';

interface Service {
  id: number;
  vehicle_plate: string;
  vehicle_model: string;
  vehicle_type: string;
  pickup_location: string;
  delivery_location: string;
  total_km: number;
  service_value: number;
  observations?: string;
  status: string;
  request_date: string;
  created_at: string;
}

interface Partner {
  id: number;
  name: string;
  phone: string;
  email?: string;
  city: string;
}

export default function PartnerServices() {
  const [, navigate] = useLocation();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Extrair ID do parceiro da URL
  const partnerId = window.location.pathname.split('/').pop();

  useEffect(() => {
    if (partnerId) {
      fetchPartnerData();
      fetchPartnerServices();
    }
  }, [partnerId]);

  const fetchPartnerData = async () => {
    try {
      const response = await fetch(`/api/towing/partners/${partnerId}`);
      if (response.ok) {
        const partnerData = await response.json();
        setPartner(partnerData);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do parceiro:', error);
    }
  };

  const fetchPartnerServices = async () => {
    try {
      const response = await fetch(`/api/towing/partners/${partnerId}/services`);
      if (response.ok) {
        const servicesData = await response.json();
        setServices(servicesData);
      }
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pendente': { label: 'Pendente', color: 'bg-yellow-500' },
      'aprovado': { label: 'Aprovado', color: 'bg-green-500' },
      'rejeitado': { label: 'Rejeitado', color: 'bg-red-500' },
      'em_analise': { label: 'Em Análise', color: 'bg-blue-500' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, color: 'bg-gray-500' };
    
    return (
      <Badge className={`${statusInfo.color} text-white`}>
        {statusInfo.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando serviços...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/partner/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Dashboard</span>
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Serviços Prestados</h1>
                {partner && (
                  <p className="text-gray-600">{partner.name} - {partner.city}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total de Serviços</p>
                  <p className="text-2xl font-bold">{services.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Aprovados</p>
                  <p className="text-2xl font-bold text-green-600">
                    {services.filter(s => s.status === 'aprovado').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {services.filter(s => s.status === 'pendente').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(services.reduce((sum, s) => sum + s.service_value, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Serviços */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Histórico de Serviços</h2>
          
          {services.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum serviço registrado</h3>
                <p className="text-gray-600">Este parceiro ainda não registrou nenhum serviço.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {services.map((service) => (
                <Card key={service.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <Truck className="w-5 h-5 text-blue-600" />
                          <span>{service.vehicle_plate} - {service.vehicle_model}</span>
                        </CardTitle>
                        <CardDescription>
                          {service.vehicle_type.toUpperCase()} • Registrado em {formatDate(service.created_at)}
                        </CardDescription>
                      </div>
                      {getStatusBadge(service.status)}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Origem</p>
                          <p className="text-sm text-gray-600">{service.pickup_location}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Destino</p>
                          <p className="text-sm text-gray-600">{service.delivery_location}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-900">Quilometragem</p>
                        <p className="text-sm text-gray-600">{service.total_km} km</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-900">Valor</p>
                        <p className="text-sm font-semibold text-green-600">
                          {formatCurrency(service.service_value)}
                        </p>
                      </div>
                    </div>
                    
                    {service.observations && (
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium text-gray-900 mb-2">Observações</p>
                        <p className="text-sm text-gray-600">{service.observations}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}