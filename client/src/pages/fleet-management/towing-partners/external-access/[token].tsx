import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, MapPin, Calendar, DollarSign, User, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Partner {
  id: number;
  name: string;
  company_name: string;
  token_expires_at?: string;
}

interface Service {
  id: number;
  vehicle_plate: string;
  pickup_location: string;
  destination: string;
  service_description: string;
  service_type: string;
  driver_name: string;
  service_date: string;
  actual_cost?: number;
  km_traveled?: number;
  observation?: string;
  status: string;
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
}

interface ServiceHistory {
  partner: Partner;
  services: Service[];
  total: number;
  has_more: boolean;
}

export default function ExternalAccessPage() {
  const { token } = useParams();
  const { toast } = useToast();
  
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Form state
  const [formData, setFormData] = useState({
    vehicle_plate: '',
    pickup_location: '',
    destination: '',
    service_description: '',
    service_type: 'reboque',
    driver_name: '',
    service_date: new Date().toISOString().split('T')[0],
    actual_cost: '',
    km_traveled: '',
    observation: ''
  });

  // Validar token e carregar dados do parceiro
  useEffect(() => {
    if (!token) return;

    const validateToken = async () => {
      try {
        // Validação local dos tokens permanentes
        const validTokens = {
          'ALLAN_PERMANENTE_2025_TOKEN': {
            id: 15,
            name: 'Allan de Souza Vieira',
            company_name: 'Allan de Souza Vieira',
            token_expires_at: null
          },
          'FORD_PERMANENTE_2025_TOKEN': {
            id: 1,
            name: 'Guincho Rápido Ltda',
            company_name: 'Ford',
            token_expires_at: null
          },
          'CHEVROLET_PERMANENTE_2025_TOKEN': {
            id: 2,
            name: 'Guincho Seguro S.A.',
            company_name: 'Chevrolet',
            token_expires_at: null
          },
          'VOLKSWAGEN_PERMANENTE_2025_TOKEN': {
            id: 3,
            name: 'Guincho Estrela',
            company_name: 'Volkswagen',
            token_expires_at: null
          },
          'PARCEIRO_5_PERMANENTE_2025_TOKEN': {
            id: 5,
            name: 'Guincho Águia',
            company_name: 'Guincho Águia',
            token_expires_at: null
          },
          'PARCEIRO_6_PERMANENTE_2025_TOKEN': {
            id: 6,
            name: 'Ford',
            company_name: 'Ford',
            token_expires_at: null
          },
          'PARCEIRO_7_PERMANENTE_2025_TOKEN': {
            id: 7,
            name: 'Rafael Abner Transporte',
            company_name: 'Rafael Abner Transporte',
            token_expires_at: null
          },
          'PARCEIRO_8_PERMANENTE_2025_TOKEN': {
            id: 8,
            name: 'Caio Ramos de Souza',
            company_name: 'Caio Ramos de Souza',
            token_expires_at: null
          },
          'PARCEIRO_9_PERMANENTE_2025_TOKEN': {
            id: 9,
            name: 'Claudio de Oliveira Silva',
            company_name: 'Claudio de Oliveira Silva',
            token_expires_at: null
          },
          'PARCEIRO_10_PERMANENTE_2025_TOKEN': {
            id: 10,
            name: 'Daiane do Vale Amaral',
            company_name: 'Daiane do Vale Amaral',
            token_expires_at: null
          },
          'PARCEIRO_11_PERMANENTE_2025_TOKEN': {
            id: 11,
            name: 'Delões Guinchos e Munck',
            company_name: 'Delões Guinchos e Munck',
            token_expires_at: null
          },
          'PARCEIRO_12_PERMANENTE_2025_TOKEN': {
            id: 12,
            name: 'Fluxo Guinchos',
            company_name: 'Fluxo Guinchos',
            token_expires_at: null
          }
        };

        console.log('[ExternalAccess] Validando token:', token);

        if (validTokens[token]) {
          setPartner(validTokens[token]);
          console.log(`[ExternalAccess] Token válido para parceiro: ${validTokens[token].name}`);
        } else {
          toast({
            title: "Acesso Negado",
            description: "Token inválido ou expirado. Entre em contato com o administrador.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('[ExternalAccess] Erro ao validar token:', error);
        toast({
          title: "Erro de Conexão",
          description: "Não foi possível validar o acesso. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token, toast]);

  // Atualização automática do histórico a cada 30 segundos
  useEffect(() => {
    if (!showHistory || !token) return;

    const interval = setInterval(() => {
      loadHistory();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [showHistory, token]);

  // Carregar histórico de serviços
  const loadHistory = async () => {
    if (!token) return;

    try {
      const response = await fetch(`/api/towing/external/history/${token}`);
      const data = await response.json();

      if (data.success) {
        setServices(data.services);
        setShowHistory(true);
      } else {
        toast({
          title: "Erro",
          description: data.error || "Não foi possível carregar o histórico",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[ExternalAccess] Erro ao carregar histórico:', error);
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível carregar o histórico",
        variant: "destructive",
      });
    }
  };

  // Enviar novo serviço
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/towing/external/submit-service', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          ...formData,
          actual_cost: formData.actual_cost ? parseFloat(formData.actual_cost) : null,
          km_traveled: formData.km_traveled ? parseFloat(formData.km_traveled) : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Serviço Registrado",
          description: `Serviço #${data.service_id} registrado com sucesso!`,
        });

        // Limpar formulário
        setFormData({
          vehicle_plate: '',
          pickup_location: '',
          destination: '',
          service_description: '',
          service_type: 'reboque',
          driver_name: '',
          service_date: new Date().toISOString().split('T')[0],
          actual_cost: '',
          km_traveled: '',
          observation: ''
        });

        // Recarregar histórico se estiver visível
        if (showHistory) {
          loadHistory();
        }
      } else {
        toast({
          title: "Erro ao Registrar",
          description: data.error || "Não foi possível registrar o serviço",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[ExternalAccess] Erro ao enviar serviço:', error);
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível enviar o serviço. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'rejeitado':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Validando acesso...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <CardTitle className="text-red-600">Acesso Negado</CardTitle>
            <CardDescription>
              Token inválido ou expirado. Entre em contato com o administrador.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Portal de Serviços - {partner.name}
          </h1>
          <p className="text-gray-600">
            Registre os serviços de guincho realizados e acompanhe o histórico
          </p>
          {partner.company_name && (
            <p className="text-sm text-gray-500 mt-1">{partner.company_name}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário de Registro */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Registrar Novo Serviço
              </CardTitle>
              <CardDescription>
                Preencha os dados do serviço de guincho realizado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="vehicle_plate">Placa do Veículo *</Label>
                  <Input
                    id="vehicle_plate"
                    value={formData.vehicle_plate}
                    onChange={(e) => setFormData(prev => ({...prev, vehicle_plate: e.target.value.toUpperCase()}))}
                    placeholder="ABC-1234"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="pickup_location">Local de Origem *</Label>
                  <Input
                    id="pickup_location"
                    value={formData.pickup_location}
                    onChange={(e) => setFormData(prev => ({...prev, pickup_location: e.target.value}))}
                    placeholder="Endereço ou ponto de referência"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="destination">Destino *</Label>
                  <Input
                    id="destination"
                    value={formData.destination}
                    onChange={(e) => setFormData(prev => ({...prev, destination: e.target.value}))}
                    placeholder="Endereço de destino"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="service_type">Tipo de Serviço</Label>
                  <Select value={formData.service_type} onValueChange={(value) => setFormData(prev => ({...prev, service_type: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reboque">Reboque</SelectItem>
                      <SelectItem value="socorro">Socorro</SelectItem>
                      <SelectItem value="transporte">Transporte</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="driver_name">Nome do Motorista</Label>
                  <Input
                    id="driver_name"
                    value={formData.driver_name}
                    onChange={(e) => setFormData(prev => ({...prev, driver_name: e.target.value}))}
                    placeholder="Nome do motorista responsável"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="service_date">Data do Serviço</Label>
                    <Input
                      id="service_date"
                      type="date"
                      value={formData.service_date}
                      onChange={(e) => setFormData(prev => ({...prev, service_date: e.target.value}))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="actual_cost">Valor Cobrado (R$)</Label>
                    <Input
                      id="actual_cost"
                      type="number"
                      step="0.01"
                      value={formData.actual_cost}
                      onChange={(e) => setFormData(prev => ({...prev, actual_cost: e.target.value}))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="km_traveled">Quilometragem (km)</Label>
                  <Input
                    id="km_traveled"
                    type="number"
                    value={formData.km_traveled}
                    onChange={(e) => setFormData(prev => ({...prev, km_traveled: e.target.value}))}
                    placeholder="Distância percorrida"
                  />
                </div>

                <div>
                  <Label htmlFor="service_description">Descrição do Serviço</Label>
                  <Textarea
                    id="service_description"
                    value={formData.service_description}
                    onChange={(e) => setFormData(prev => ({...prev, service_description: e.target.value}))}
                    placeholder="Descreva brevemente o serviço realizado"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="observation">Observações</Label>
                  <Textarea
                    id="observation"
                    value={formData.observation}
                    onChange={(e) => setFormData(prev => ({...prev, observation: e.target.value}))}
                    placeholder="Observações adicionais (opcional)"
                    rows={2}
                  />
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Registrando...' : 'Registrar Serviço'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Histórico */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Histórico de Serviços
              </CardTitle>
              <CardDescription>
                Acompanhe os serviços registrados e seus status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showHistory ? (
                <div className="text-center py-8">
                  <Button onClick={loadHistory} variant="outline">
                    Carregar Histórico
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {services.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Nenhum serviço registrado ainda
                    </p>
                  ) : (
                    services.map((service) => (
                      <div key={service.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-blue-500" />
                            <span className="font-medium">{service.vehicle_plate}</span>
                          </div>
                          {getStatusBadge(service.status)}
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            <span>{service.pickup_location} → {service.destination}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(service.service_date).toLocaleDateString('pt-BR')}</span>
                          </div>
                          {service.actual_cost && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-3 h-3" />
                              <span>R$ {service.actual_cost.toFixed(2)}</span>
                            </div>
                          )}
                          {service.driver_name && (
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3" />
                              <span>{service.driver_name}</span>
                            </div>
                          )}
                        </div>

                        {service.service_description && (
                          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            {service.service_description}
                          </p>
                        )}

                        {service.rejection_reason && (
                          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            <strong>Motivo da rejeição:</strong> {service.rejection_reason}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}