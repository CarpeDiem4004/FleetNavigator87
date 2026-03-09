import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Fuel, CheckCircle2, AlertCircle } from 'lucide-react';

interface TokenInfo {
  id: number;
  project_id: number;
  base_id: number;
  project_name: string;
  base_name: string;
  is_active: boolean;
}

export default function PostPaidForm() {
  const params = useParams();
  const token = params.token as string;
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    driver_name: '',
    driver_rg: '',
    driver_phone: '',
    vehicle_plate: '',
    fuel_type: '',
    price_per_liter: '',
    liters: '',
    period: '',
    manager_name: '',
  });

  const [totalAmount, setTotalAmount] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Buscar informações do token
  const { data: tokenInfo, isLoading: loadingToken, error: tokenError } = useQuery<TokenInfo>({
    queryKey: [`/api/postpaid/token-info/${token}`],
    enabled: !!token,
  });

  // Calcular valor total automaticamente
  useEffect(() => {
    const price = parseFloat(formData.price_per_liter) || 0;
    const liters = parseFloat(formData.liters) || 0;
    setTotalAmount(price * liters);
  }, [formData.price_per_liter, formData.liters]);

  // Mutation para enviar registro
  const submitMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/postpaid/records', {
        token,
        ...formData,
        price_per_liter: parseFloat(formData.price_per_liter),
        liters: parseFloat(formData.liters),
        total_amount: totalAmount,
      });
      return response;
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: 'Registro enviado com sucesso!',
        description: 'O abastecimento foi registrado.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao enviar registro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.driver_name || !formData.driver_rg || !formData.driver_phone) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os dados do motorista.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.vehicle_plate) {
      toast({
        title: 'Placa obrigatória',
        description: 'Informe a placa do veículo.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.fuel_type || !formData.price_per_liter || !formData.liters) {
      toast({
        title: 'Dados de abastecimento incompletos',
        description: 'Preencha todos os dados do abastecimento.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.period || !formData.manager_name) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Informe o período e o nome do gestor.',
        variant: 'destructive',
      });
      return;
    }

    submitMutation.mutate();
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Loading state
  if (loadingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (tokenError || !tokenInfo || !tokenInfo.is_active) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Inválido</h2>
            <p className="text-gray-600">
              Este link de acesso não é válido ou expirou. Entre em contato com o administrador.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registro Enviado!</h2>
            <p className="text-gray-600 mb-6">
              O abastecimento foi registrado com sucesso. O valor total é de{' '}
              <span className="font-bold text-green-700">R$ {totalAmount.toFixed(2)}</span>.
            </p>
            <Button
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  driver_name: '',
                  driver_rg: '',
                  driver_phone: '',
                  vehicle_plate: '',
                  fuel_type: '',
                  price_per_liter: '',
                  liters: '',
                  period: '',
                  manager_name: '',
                });
                setTotalAmount(0);
              }}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-new-record"
            >
              Registrar Novo Abastecimento
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Fuel className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Registro de Abastecimento Pós-Pago</h1>
          <p className="text-gray-600 mt-2">
            {tokenInfo.project_name} - {tokenInfo.base_name}
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados do Motorista */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados do Motorista</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="driver_name">Nome Completo *</Label>
                  <Input
                    id="driver_name"
                    value={formData.driver_name}
                    onChange={(e) => handleChange('driver_name', e.target.value)}
                    placeholder="Digite o nome completo"
                    required
                    data-testid="input-driver-name"
                  />
                </div>
                <div>
                  <Label htmlFor="driver_rg">RG *</Label>
                  <Input
                    id="driver_rg"
                    value={formData.driver_rg}
                    onChange={(e) => handleChange('driver_rg', e.target.value)}
                    placeholder="00.000.000-0"
                    required
                    data-testid="input-driver-rg"
                  />
                </div>
                <div>
                  <Label htmlFor="driver_phone">Telefone *</Label>
                  <Input
                    id="driver_phone"
                    value={formData.driver_phone}
                    onChange={(e) => handleChange('driver_phone', e.target.value)}
                    placeholder="(00) 00000-0000"
                    required
                    data-testid="input-driver-phone"
                  />
                </div>
              </div>
            </div>

            {/* Dados do Veículo */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados do Veículo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicle_plate">Placa do Veículo *</Label>
                  <Input
                    id="vehicle_plate"
                    value={formData.vehicle_plate}
                    onChange={(e) => handleChange('vehicle_plate', e.target.value.toUpperCase())}
                    placeholder="ABC-1234"
                    required
                    data-testid="input-vehicle-plate"
                  />
                </div>
              </div>
            </div>

            {/* Dados do Abastecimento */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados do Abastecimento</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="fuel_type">Tipo de Combustível *</Label>
                  <Select value={formData.fuel_type} onValueChange={(value) => handleChange('fuel_type', value)}>
                    <SelectTrigger id="fuel_type" data-testid="select-fuel-type">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gasolina">Gasolina</SelectItem>
                      <SelectItem value="Etanol">Etanol</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="Diesel S10">Diesel S10</SelectItem>
                      <SelectItem value="GNV">GNV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="price_per_liter">Valor por Litro (R$) *</Label>
                  <Input
                    id="price_per_liter"
                    type="number"
                    step="0.01"
                    value={formData.price_per_liter}
                    onChange={(e) => handleChange('price_per_liter', e.target.value)}
                    placeholder="0.00"
                    required
                    data-testid="input-price-per-liter"
                  />
                </div>
                <div>
                  <Label htmlFor="liters">Quantidade de Litros *</Label>
                  <Input
                    id="liters"
                    type="number"
                    step="0.01"
                    value={formData.liters}
                    onChange={(e) => handleChange('liters', e.target.value)}
                    placeholder="0.00"
                    required
                    data-testid="input-liters"
                  />
                </div>
              </div>

              {/* Valor Total */}
              <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-700">Valor Total:</span>
                  <span className="text-2xl font-bold text-indigo-600" data-testid="text-total-amount">
                    R$ {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Informações Adicionais */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Adicionais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="period">Período *</Label>
                  <Select value={formData.period} onValueChange={(value) => handleChange('period', value)}>
                    <SelectTrigger id="period" data-testid="select-period">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM (Manhã)</SelectItem>
                      <SelectItem value="PM">PM (Tarde/Noite)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="manager_name">Nome do Gestor *</Label>
                  <Input
                    id="manager_name"
                    value={formData.manager_name}
                    onChange={(e) => handleChange('manager_name', e.target.value)}
                    placeholder="Digite o nome do gestor"
                    required
                    data-testid="input-manager-name"
                  />
                </div>
              </div>
            </div>

            {/* Botão de Envio */}
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 text-lg"
                disabled={submitMutation.isPending}
                data-testid="button-submit"
              >
                {submitMutation.isPending ? 'Enviando...' : 'Registrar Abastecimento'}
              </Button>
            </div>
          </form>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          Este registro será processado e faturado posteriormente
        </p>
      </div>
    </div>
  );
}
