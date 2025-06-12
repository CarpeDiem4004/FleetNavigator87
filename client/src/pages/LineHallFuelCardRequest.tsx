import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CreditCard, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { useLocation } from 'wouter';

interface Driver {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
  base_id: number;
}

interface Vehicle {
  id: number;
  plate: string;
  model: string;
  make: string;
  vehicleType: string;
  baseId: number;
}

interface Route {
  id: number;
  nome_ponto_a: string;
  nome_ponto_b: string;
  km_total: number;
}

const LineHallFuelCardRequest: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    motorista_id: '',
    motorista_nome: '',
    motorista_cpf: '',
    telefone_motorista: '',
    veiculo_placa: '',
    veiculo_modelo: '',
    rota_origem: '',
    rota_destino: '',
    km_total: 0,
    horario_abastecimento: '',
    data_viagem: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchDrivers();
    fetchVehicles();
    fetchRoutes();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await apiRequest('GET', '/api/drivers');
      const data = await response.json();
      // Filtrar apenas motoristas da base Line Hall
      const lineHallDrivers = data.filter((driver: Driver) => driver.base_id === 3);
      setDrivers(lineHallDrivers);
    } catch (error) {
      console.error('Erro ao buscar motoristas:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await apiRequest('GET', '/api/vehicles');
      const data = await response.json();
      // Filtrar apenas veículos da base Line Hall
      const lineHallVehicles = data.filter((vehicle: Vehicle) => vehicle.baseId === 3 || vehicle.baseId === 1);
      setVehicles(lineHallVehicles);
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await apiRequest('GET', '/api/line-hall/routes');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRoutes(data.data);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar rotas:', error);
    }
  };

  const handleDriverChange = (driverId: string) => {
    const selectedDriver = drivers.find(d => d.id.toString() === driverId);
    if (selectedDriver) {
      setFormData(prev => ({
        ...prev,
        motorista_id: driverId,
        motorista_nome: selectedDriver.nome,
        motorista_cpf: selectedDriver.cpf,
        telefone_motorista: selectedDriver.telefone
      }));
    }
  };

  const handleVehicleChange = (vehiclePlate: string) => {
    const selectedVehicle = vehicles.find(v => v.plate === vehiclePlate);
    if (selectedVehicle) {
      setFormData(prev => ({
        ...prev,
        veiculo_placa: vehiclePlate,
        veiculo_modelo: selectedVehicle.model
      }));
    }
  };

  const handleRouteChange = (routeId: string) => {
    const selectedRoute = routes.find(r => r.id.toString() === routeId);
    if (selectedRoute) {
      setFormData(prev => ({
        ...prev,
        rota_origem: selectedRoute.nome_ponto_a,
        rota_destino: selectedRoute.nome_ponto_b,
        km_total: selectedRoute.km_total
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.motorista_id || !formData.veiculo_placa || !formData.rota_origem || !formData.horario_abastecimento) {
      toast({
        title: 'Erro de validação',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await apiRequest('POST', '/api/line-hall/fuel-requests', {
        ...formData,
        data_solicitacao: formData.data_viagem,
        horario_solicitacao: new Date().toTimeString().split(' ')[0]
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        toast({
          title: 'Solicitação enviada com sucesso!',
          description: 'Sua solicitação de recarga de cartão combustível foi registrada.',
          variant: 'default',
        });
      } else {
        throw new Error(data.message || 'Erro ao enviar solicitação');
      }
    } catch (error: any) {
      console.error('Erro ao enviar solicitação:', error);
      toast({
        title: 'Erro ao enviar solicitação',
        description: error.message || 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      motorista_id: '',
      motorista_nome: '',
      motorista_cpf: '',
      telefone_motorista: '',
      veiculo_placa: '',
      veiculo_modelo: '',
      rota_origem: '',
      rota_destino: '',
      km_total: 0,
      horario_abastecimento: '',
      data_viagem: new Date().toISOString().split('T')[0]
    });
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-md mx-auto pt-16">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Solicitação Enviada!</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Sua solicitação de recarga de cartão combustível foi registrada com sucesso e será analisada pela equipe operacional.
              </p>
              <div className="space-y-3">
                <Button onClick={resetForm} className="w-full">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Nova Solicitação
                </Button>
                <Button variant="outline" onClick={() => setLocation('/line-hall-shopee')} className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao Line Hall
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/line-hall-shopee')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Line Hall
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Solicitação de Cartão Combustível
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Preencha os dados da viagem para solicitar recarga do cartão combustível
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5 text-blue-600" />
              Nova Solicitação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Motorista */}
              <div className="space-y-2">
                <Label htmlFor="motorista">Motorista *</Label>
                <Select value={formData.motorista_id} onValueChange={handleDriverChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motorista" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id.toString()}>
                        {driver.nome} - {driver.cpf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Veículo */}
              <div className="space-y-2">
                <Label htmlFor="veiculo">Veículo *</Label>
                <Select value={formData.veiculo_placa} onValueChange={handleVehicleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.plate}>
                        {vehicle.plate} - {vehicle.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rota */}
              <div className="space-y-2">
                <Label htmlFor="rota">Rota *</Label>
                <Select onValueChange={handleRouteChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a rota ou preencha manualmente" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((route) => (
                      <SelectItem key={route.id} value={route.id.toString()}>
                        {route.nome_ponto_a} → {route.nome_ponto_b} ({route.km_total} km)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Campos manuais de rota */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origem">Origem *</Label>
                  <Input
                    id="origem"
                    value={formData.rota_origem}
                    onChange={(e) => setFormData(prev => ({ ...prev, rota_origem: e.target.value }))}
                    placeholder="Local de origem"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destino">Destino *</Label>
                  <Input
                    id="destino"
                    value={formData.rota_destino}
                    onChange={(e) => setFormData(prev => ({ ...prev, rota_destino: e.target.value }))}
                    placeholder="Local de destino"
                  />
                </div>
              </div>

              {/* KM e Data */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="km_total">Quilometragem Total *</Label>
                  <Input
                    id="km_total"
                    type="number"
                    value={formData.km_total}
                    onChange={(e) => setFormData(prev => ({ ...prev, km_total: parseInt(e.target.value) || 0 }))}
                    placeholder="KM da viagem"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_viagem">Data da Viagem *</Label>
                  <Input
                    id="data_viagem"
                    type="date"
                    value={formData.data_viagem}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_viagem: e.target.value }))}
                  />
                </div>
              </div>

              {/* Horário de Abastecimento */}
              <div className="space-y-2">
                <Label htmlFor="horario_abastecimento">Horário de Abastecimento *</Label>
                <Select value={formData.horario_abastecimento} onValueChange={(value) => setFormData(prev => ({ ...prev, horario_abastecimento: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o horário preferencial" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="antes_17h">Antes das 17h</SelectItem>
                    <SelectItem value="apos_18h">Após as 18h</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botão de envio */}
              <div className="pt-4">
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Enviar Solicitação
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Informações adicionais */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="font-medium mb-1">Informações importantes:</p>
                <ul className="space-y-1 text-xs">
                  <li>• O valor da recarga será calculado automaticamente com base na quilometragem</li>
                  <li>• A solicitação será analisada pela equipe operacional em até 24 horas</li>
                  <li>• Você receberá notificação sobre o status da solicitação</li>
                  <li>• Em caso de dúvidas, entre em contato com a central de operações</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LineHallFuelCardRequest;