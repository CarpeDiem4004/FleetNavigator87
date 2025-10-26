import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/components/layout/AppLayout';
import { FuelIcon, CreditCard, MapPin, TrendingUp, DollarSign, Droplets } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ConsumptionData {
  posto: {
    total_litros: number;
    total_valor: number;
    por_base: Array<{
      base: string;
      litros: number;
      valor: number;
      registros: number;
    }>;
  };
  cartao: {
    total_litros: number;
    total_valor: number;
    por_base: Array<{
      base: string;
      litros: number;
      valor: number;
      registros: number;
    }>;
    por_provedor: {
      ticket: {
        litros: number;
        valor: number;
        registros: number;
      };
      veloe: {
        litros: number;
        valor: number;
        registros: number;
      };
    };
  };
  total_geral: {
    litros: number;
    valor: number;
  };
}

export default function FuelConsumptionReport() {
  const [selectedBase, setSelectedBase] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Buscar bases disponíveis
  const { data: basesData } = useQuery<{ success: boolean; data: string[] }>({
    queryKey: ['/api/fuel-consumption-bases'],
  });

  // Buscar dados do relatório
  const { data: reportData, isLoading, refetch } = useQuery<{ success: boolean; data: ConsumptionData }>({
    queryKey: ['/api/fuel-consumption-report', { start_date: startDate, end_date: endDate, base: selectedBase }],
    enabled: false, // Só busca quando clicar em aplicar filtros
  });

  const report = reportData?.data;

  const handleApplyFilters = () => {
    refetch();
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedBase('');
    setTimeout(() => refetch(), 100);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-6 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FuelIcon className="h-8 w-8 text-blue-600" />
            Relatório de Consumo de Combustível
          </h1>
          <p className="text-gray-600 mt-2">Visão completa do consumo em postos e cartões por base e provedor</p>
        </div>

        {/* Filtros */}
        <Card className="mb-8 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-gray-600 block mb-2">Data Inicial</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-gray-600 block mb-2">Data Final</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-gray-600 block mb-2">Base</label>
                <Select value={selectedBase} onValueChange={setSelectedBase}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Todas as bases" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as bases</SelectItem>
                    {basesData?.data?.map((base) => (
                      <SelectItem key={base} value={base}>{base}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleApplyFilters}
                  className="h-10 px-6 bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Carregando...' : 'Aplicar'}
                </Button>
                <Button 
                  onClick={handleResetFilters}
                  variant="outline"
                  className="h-10 px-6"
                >
                  Limpar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas Principais */}
        {report && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Total Geral - Litros */}
              <Card className="shadow-sm border-l-4 border-l-blue-600">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Consumo Total
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-gray-900">
                    {report.total_geral.litros.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">litros</p>
                </CardContent>
              </Card>

              {/* Total Geral - Valor */}
              <Card className="shadow-sm border-l-4 border-l-green-600">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Valor Total
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-gray-900">
                    {formatCurrency(report.total_geral.valor)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">investido em combustível</p>
                </CardContent>
              </Card>

              {/* Distribuição Posto vs Cartão */}
              <Card className="shadow-sm border-l-4 border-l-purple-600">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Distribuição
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Postos:</span>
                      <span className="font-semibold">{((report.posto.total_valor / report.total_geral.valor) * 100 || 0).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cartões:</span>
                      <span className="font-semibold">{((report.cartao.total_valor / report.total_geral.valor) * 100 || 0).toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Consumo em Postos */}
            <Card className="mb-8 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
                <div className="flex items-center gap-3">
                  <FuelIcon className="h-6 w-6 text-blue-700" />
                  <div>
                    <CardTitle className="text-xl font-semibold">Consumo em Postos de Gasolina</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatCurrency(report.posto.total_valor)} • {report.posto.total_litros.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} litros
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {report.posto.por_base.length === 0 ? (
                  <p className="text-center text-gray-500 py-6">Nenhum consumo em postos no período selecionado</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="text-left p-3 font-semibold text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Base
                            </div>
                          </th>
                          <th className="text-right p-3 font-semibold text-sm text-gray-700">Litros</th>
                          <th className="text-right p-3 font-semibold text-sm text-gray-700">Valor</th>
                          <th className="text-right p-3 font-semibold text-sm text-gray-700">Registros</th>
                          <th className="text-right p-3 font-semibold text-sm text-gray-700">% do Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.posto.por_base.map((base, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="p-3 font-medium">{base.base}</td>
                            <td className="p-3 text-right">{base.litros.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}L</td>
                            <td className="p-3 text-right font-medium">{formatCurrency(base.valor)}</td>
                            <td className="p-3 text-right">{base.registros}</td>
                            <td className="p-3 text-right">
                              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                                {((base.valor / report.posto.total_valor) * 100).toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Consumo em Cartões */}
            <Card className="mb-8 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-green-700" />
                  <div>
                    <CardTitle className="text-xl font-semibold">Consumo em Cartões de Abastecimento</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatCurrency(report.cartao.total_valor)} • {report.cartao.total_litros.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} litros
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Resumo por Provedor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b">
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-green-800 flex items-center gap-2">
                        💳 TICKET
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-700">Valor:</span>
                          <span className="font-bold text-green-900">{formatCurrency(report.cartao.por_provedor.ticket.valor)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-700">Litros:</span>
                          <span className="font-medium">{report.cartao.por_provedor.ticket.litros.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}L</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-700">Recargas:</span>
                          <span className="font-medium">{report.cartao.por_provedor.ticket.registros}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-purple-800 flex items-center gap-2">
                        💳 VELOE GO
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-700">Valor:</span>
                          <span className="font-bold text-purple-900">{formatCurrency(report.cartao.por_provedor.veloe.valor)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-700">Litros:</span>
                          <span className="font-medium">{report.cartao.por_provedor.veloe.litros.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}L</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-700">Recargas:</span>
                          <span className="font-medium">{report.cartao.por_provedor.veloe.registros}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabela por Base */}
                {report.cartao.por_base.length === 0 ? (
                  <p className="text-center text-gray-500 py-6">Nenhum consumo em cartões no período selecionado</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="text-left p-3 font-semibold text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Base
                            </div>
                          </th>
                          <th className="text-right p-3 font-semibold text-sm text-gray-700">Litros</th>
                          <th className="text-right p-3 font-semibold text-sm text-gray-700">Valor</th>
                          <th className="text-right p-3 font-semibold text-sm text-gray-700">Registros</th>
                          <th className="text-right p-3 font-semibold text-sm text-gray-700">% do Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.cartao.por_base.map((base, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="p-3 font-medium">{base.base}</td>
                            <td className="p-3 text-right">{base.litros.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}L</td>
                            <td className="p-3 text-right font-medium">{formatCurrency(base.valor)}</td>
                            <td className="p-3 text-right">{base.registros}</td>
                            <td className="p-3 text-right">
                              <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                                {((base.valor / report.cartao.total_valor) * 100).toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!report && !isLoading && (
          <Card className="shadow-sm">
            <CardContent className="py-12 text-center text-gray-500">
              <FuelIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">Selecione os filtros e clique em "Aplicar"</p>
              <p className="text-sm">para visualizar o relatório de consumo de combustível</p>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <Card className="shadow-sm">
            <CardContent className="py-12 text-center">
              <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Gerando relatório...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
