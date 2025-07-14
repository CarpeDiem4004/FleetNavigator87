import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { MapPin, Fuel, Calendar, User, Car, FileText } from 'lucide-react';
import { formatUTCToBrazilDate as formatDate } from '@/utils/timezone-brazil';
import PublicPostoAuth from '@/components/auth/PublicPostoAuth';

interface FuelRecord {
  id: number;
  data_abastecimento: string;
  veiculo: string;
  motorista: string;
  placa: string;
  quilometragem: number;
  tipo_combustivel: string;
  quantidade_litros: number;
  valor_total: number;
  observacoes?: string;
  posto_origem: string;
  created_at: string;
}

export default function PublicPostoGP01() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [operatorInfo, setOperatorInfo] = useState<any>(null);
  const [formData, setFormData] = useState({
    veiculo: '',
    motorista: '',
    placa: '',
    quilometragem: '',
    tipo_combustivel: '',
    quantidade_litros: '',
    valor_total: '',
    observacoes: ''
  });
  const [fuelHistory, setFuelHistory] = useState<FuelRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadFuelHistory();
    }
  }, [isAuthenticated]);

  const loadFuelHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/historico-direto/GP01');
      if (response.ok) {
        const data = await response.json();
        setFuelHistory(data);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.veiculo || !formData.motorista || !formData.placa) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/abastecimento-direto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          quilometragem: parseInt(formData.quilometragem) || 0,
          quantidade_litros: parseFloat(formData.quantidade_litros) || 0,
          valor_total: parseFloat(formData.valor_total) || 0,
          posto_origem: 'GP01',
          operador: operatorInfo?.name || 'Operador GP01',
          data_abastecimento: new Date().toISOString()
        })
      });

      if (response.ok) {
        toast({
          title: "Sucesso!",
          description: "Abastecimento registrado com sucesso.",
          variant: "default"
        });
        
        // Reset form
        setFormData({
          veiculo: '',
          motorista: '',
          placa: '',
          quilometragem: '',
          tipo_combustivel: '',
          quantidade_litros: '',
          valor_total: '',
          observacoes: ''
        });
        
        // Reload history
        loadFuelHistory();
      } else {
        throw new Error('Erro ao registrar abastecimento');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o abastecimento.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isAuthenticated) {
    return (
      <PublicPostoAuth 
        onAuthSuccess={(operatorData) => {
          setIsAuthenticated(true);
          setOperatorInfo(operatorData);
        }}
        stationName="GP01 - VARGEM GRANDE"
        stationCode="GP01"
        projectName="GRUPO PEREIRA"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-600 rounded-full">
              <MapPin className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">GP01 - VARGEM GRANDE</h1>
              <p className="text-gray-600">GRUPO PEREIRA | Vargem Grande, SP</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>Operador: {operatorInfo?.name || 'Operador GP01'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Data: {formatDate(new Date())}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário de Abastecimento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="h-5 w-5 text-green-600" />
                Registrar Abastecimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="veiculo">Veículo *</Label>
                    <Input
                      id="veiculo"
                      value={formData.veiculo}
                      onChange={(e) => handleInputChange('veiculo', e.target.value)}
                      placeholder="Ex: Caminhão Mercedes"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="motorista">Motorista *</Label>
                    <Input
                      id="motorista"
                      value={formData.motorista}
                      onChange={(e) => handleInputChange('motorista', e.target.value)}
                      placeholder="Nome do motorista"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="placa">Placa *</Label>
                    <Input
                      id="placa"
                      value={formData.placa}
                      onChange={(e) => handleInputChange('placa', e.target.value.toUpperCase())}
                      placeholder="ABC1234"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="quilometragem">Quilometragem</Label>
                    <Input
                      id="quilometragem"
                      type="number"
                      value={formData.quilometragem}
                      onChange={(e) => handleInputChange('quilometragem', e.target.value)}
                      placeholder="Ex: 150000"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tipo_combustivel">Tipo de Combustível</Label>
                  <Select value={formData.tipo_combustivel} onValueChange={(value) => handleInputChange('tipo_combustivel', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="Gasolina">Gasolina</SelectItem>
                      <SelectItem value="Etanol">Etanol</SelectItem>
                      <SelectItem value="GNV">GNV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantidade_litros">Quantidade (Litros)</Label>
                    <Input
                      id="quantidade_litros"
                      type="number"
                      step="0.01"
                      value={formData.quantidade_litros}
                      onChange={(e) => handleInputChange('quantidade_litros', e.target.value)}
                      placeholder="Ex: 50.5"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="valor_total">Valor Total (R$)</Label>
                    <Input
                      id="valor_total"
                      type="number"
                      step="0.01"
                      value={formData.valor_total}
                      onChange={(e) => handleInputChange('valor_total', e.target.value)}
                      placeholder="Ex: 350.75"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => handleInputChange('observacoes', e.target.value)}
                    placeholder="Observações adicionais..."
                    rows={3}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700" 
                  disabled={loading}
                >
                  {loading ? 'Registrando...' : 'Registrar Abastecimento'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Histórico de Abastecimentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Histórico Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">
                    Carregando histórico...
                  </div>
                ) : fuelHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum abastecimento registrado ainda.
                  </div>
                ) : (
                  fuelHistory.map((record) => (
                    <div key={record.id} className="p-4 border rounded-lg bg-white shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Car className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{record.veiculo}</span>
                        <span className="text-sm text-gray-500">({record.placa})</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>Motorista: {record.motorista}</div>
                        <div>Data: {formatDate(new Date(record.data_abastecimento))}</div>
                        <div>Combustível: {record.tipo_combustivel}</div>
                        <div>Litros: {record.quantidade_litros}L</div>
                        <div>Valor: R$ {record.valor_total?.toFixed(2) || '0.00'}</div>
                        <div>KM: {record.quilometragem || 'N/A'}</div>
                      </div>
                      {record.observacoes && (
                        <div className="mt-2 text-sm text-gray-600 italic">
                          {record.observacoes}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}