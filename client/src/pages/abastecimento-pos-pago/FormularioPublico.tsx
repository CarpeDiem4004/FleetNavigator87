import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Fuel, CheckCircle, AlertCircle } from 'lucide-react';

interface FormData {
  nome: string;
  cpf: string;
  placa: string;
  km: string;
  tipo_motorista: string;
  tipo_combustivel: string;
  valor_unit: string;
  valor_total: string;
  posto_id: string;
  base_id: string;
  observacoes: string;
}

export default function FormularioPublicoAbastecimento() {
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    cpf: '',
    placa: '',
    km: '',
    tipo_motorista: '',
    tipo_combustivel: '',
    valor_unit: '',
    valor_total: '',
    posto_id: '',
    base_id: '',
    observacoes: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [token, setToken] = useState<string>('');
  const [postos, setPostos] = useState<any[]>([]);
  const [bases, setBases] = useState<any[]>([]);

  useEffect(() => {
    // Extrair token da URL
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('t') || '';
    setToken(tokenFromUrl);

    if (!tokenFromUrl) {
      setMessage({ type: 'error', text: 'Link inválido - token não encontrado' });
    }

    // Carregar postos e bases disponíveis
    loadPostos();
    loadBases();
  }, []);

  const loadPostos = async () => {
    try {
      const response = await fetch('/api/admin/postos-external');
      const data = await response.json();
      if (data.success) {
        setPostos(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar postos:', error);
    }
  };

  const loadBases = async () => {
    try {
      const response = await fetch('/api/bases');
      const data = await response.json();
      if (Array.isArray(data)) {
        setBases(data.filter(base => base.active));
      }
    } catch (error) {
      console.error('Erro ao carregar bases:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const formatPlaca = (value: string) => {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
  };

  const formatMoney = (value: string) => {
    const numbers = value.replace(/[^\d,]/g, '').replace(',', '.');
    return numbers;
  };

  const calcularLitros = () => {
    const valorUnit = parseFloat(formData.valor_unit.replace(',', '.')) || 0;
    const valorTotal = parseFloat(formData.valor_total.replace(',', '.')) || 0;
    
    if (valorUnit > 0 && valorTotal > 0) {
      return (valorTotal / valorUnit).toFixed(2);
    }
    return '0.00';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setMessage({ type: 'error', text: 'Token inválido' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/abastecimento-pos-pago/submit?t=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          cpf: formData.cpf.replace(/\D/g, ''),
          placa: formData.placa.toUpperCase().trim(),
          km: parseInt(formData.km),
          valor_unit: parseFloat(formData.valor_unit.replace(',', '.')),
          valor_total: parseFloat(formData.valor_total.replace(',', '.')),
          posto_id: formData.posto_id ? parseInt(formData.posto_id) : null,
          base_id: formData.base_id ? parseInt(formData.base_id) : null
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Abastecimento registrado com sucesso!' });
        // Resetar formulário após sucesso
        setFormData({
          nome: '',
          cpf: '',
          placa: '',
          km: '',
          tipo_motorista: '',
          tipo_combustivel: '',
          valor_unit: '',
          valor_total: '',
          posto_id: '',
          base_id: '',
          observacoes: ''
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao registrar abastecimento' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Erro de conexão. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Link Inválido</h2>
              <p className="text-gray-600">Este link não possui um token válido de acesso.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center bg-blue-600 text-white">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Fuel className="h-6 w-6" />
              <CardTitle className="text-xl">Registrar Abastecimento</CardTitle>
            </div>
            <p className="text-blue-100 text-sm">Sistema Pós-Pago - Murici On Fleet</p>
          </CardHeader>

          <CardContent className="p-6">
            {message && (
              <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-center gap-2">
                  {message.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                    {message.text}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dados do Motorista */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Motorista *
                  </label>
                  <Input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    placeholder="Digite seu nome completo"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CPF *
                  </label>
                  <Input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => handleChange('cpf', formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    required
                    className="w-full"
                  />
                </div>
              </div>

              {/* Dados do Veículo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Placa do Veículo *
                  </label>
                  <Input
                    type="text"
                    value={formData.placa}
                    onChange={(e) => handleChange('placa', formatPlaca(e.target.value))}
                    placeholder="ABC1234"
                    maxLength={7}
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quilometragem Atual *
                  </label>
                  <Input
                    type="number"
                    value={formData.km}
                    onChange={(e) => handleChange('km', e.target.value)}
                    placeholder="Ex: 145000"
                    required
                    className="w-full"
                  />
                </div>
              </div>

              {/* Tipo de Motorista */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Motorista *
                </label>
                <Select value={formData.tipo_motorista} onValueChange={(value) => handleChange('tipo_motorista', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frota">Frota</SelectItem>
                    <SelectItem value="agregado">Agregado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dados do Combustível */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Combustível *
                </label>
                <Select value={formData.tipo_combustivel} onValueChange={(value) => handleChange('tipo_combustivel', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o combustível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="gasolina">Gasolina</SelectItem>
                    <SelectItem value="etanol">Etanol</SelectItem>
                    <SelectItem value="gnv">GNV</SelectItem>
                    <SelectItem value="adblue">Arla/AdBlue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Base (opcional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base (opcional)
                </label>
                <Select value={formData.base_id} onValueChange={(value) => handleChange('base_id', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma base (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {bases.map((base) => (
                      <SelectItem key={base.id} value={base.id.toString()}>
                        {base.sigla} - {base.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Valores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor por Litro (R$) *
                  </label>
                  <Input
                    type="text"
                    value={formData.valor_unit}
                    onChange={(e) => handleChange('valor_unit', formatMoney(e.target.value))}
                    placeholder="Ex: 5.89"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Total (R$) *
                  </label>
                  <Input
                    type="text"
                    value={formData.valor_total}
                    onChange={(e) => handleChange('valor_total', formatMoney(e.target.value))}
                    placeholder="Ex: 350.50"
                    required
                    className="w-full"
                  />
                </div>
              </div>

              {/* Informação de Litros Calculados */}
              {formData.valor_unit && formData.valor_total && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Litros calculados:</strong> {calcularLitros()}L
                  </p>
                </div>
              )}

              {/* Posto (opcional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Posto (opcional)
                </label>
                <Select value={formData.posto_id} onValueChange={(value) => handleChange('posto_id', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o posto (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {postos.map((posto) => (
                      <SelectItem key={posto.id} value={posto.id.toString()}>
                        {posto.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <Input
                  type="text"
                  value={formData.observacoes}
                  onChange={(e) => handleChange('observacoes', e.target.value)}
                  placeholder="Informações adicionais (opcional)"
                  className="w-full"
                />
              </div>

              {/* Botão de Envio */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Fuel className="mr-2 h-4 w-4" />
                    Registrar Abastecimento
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Sistema de Gestão de Frotas - Murici On Fleet<br />
                Todos os campos marcados com * são obrigatórios
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}