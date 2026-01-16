import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, DollarSign, Truck, MapPin, TrendingUp, BarChart3, 
  Calendar, Filter, RefreshCw, Download
} from 'lucide-react';
import { Link } from 'wouter';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

export default function LineHaulAnalytics() {
  const [dataInicio, setDataInicio] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [veiculoFilter, setVeiculoFilter] = useState('all');
  const [rotaFilter, setRotaFilter] = useState('all');
  const [operacaoFilter, setOperacaoFilter] = useState('all');

  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/linehaul/analytics', dataInicio, dataFim, veiculoFilter, rotaFilter, operacaoFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('dataInicio', dataInicio);
      params.append('dataFim', dataFim);
      if (veiculoFilter !== 'all') params.append('veiculo', veiculoFilter);
      if (rotaFilter !== 'all') params.append('rota', rotaFilter);
      if (operacaoFilter !== 'all') params.append('operacao', operacaoFilter);
      
      const response = await fetch(`/api/linehaul/analytics?${params.toString()}`, {
        credentials: 'include',
      });
      return response.json();
    },
  });

  const data = analyticsData?.data || {
    cards: { custoTotal: 0, totalViagens: 0, rotasDistintas: 0, custoMedio: 0, veiculoMaisCaro: '' },
    rotasMaisRealizadas: [],
    rotasMaisCaras: [],
    custoPorVeiculo: [],
    evolucaoCusto: [],
    participacaoRotas: [],
    tabelaAnalitica: [],
    veiculos: [],
    rotas: []
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/fuel-card-requests">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                Analytics Line Haul
              </h1>
              <p className="text-sm text-gray-500">Análise de rotas, custos e veículos</p>
            </div>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Operação</label>
                <Select value={operacaoFilter} onValueChange={setOperacaoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as operações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as operações</SelectItem>
                    <SelectItem value="Shopee">🟠 Shopee</SelectItem>
                    <SelectItem value="Mercado Livre">🔵 Mercado Livre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Data Início</label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Data Fim</label>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Veículo</label>
                <Select value={veiculoFilter} onValueChange={setVeiculoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os veículos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os veículos</SelectItem>
                    {data.veiculos?.map((v: string) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Rota</label>
                <Select value={rotaFilter} onValueChange={setRotaFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as rotas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as rotas</SelectItem>
                    {data.rotas?.map((r: string) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-gray-500">Carregando dados...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Custo Total</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(data.cards?.custoTotal || 0)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Total Viagens</p>
                      <p className="text-xl font-bold text-blue-600">{data.cards?.totalViagens || 0}</p>
                    </div>
                    <Truck className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Rotas Distintas</p>
                      <p className="text-xl font-bold text-purple-600">{data.cards?.rotasDistintas || 0}</p>
                    </div>
                    <MapPin className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Custo Médio/Viagem</p>
                      <p className="text-xl font-bold text-orange-600">{formatCurrency(data.cards?.custoMedio || 0)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div>
                    <p className="text-xs text-gray-500">Veículo + Caro</p>
                    <p className="text-sm font-bold text-red-600 truncate">{data.cards?.veiculoMaisCaro || '-'}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(data.cards?.veiculoMaisCaroValor || 0)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Rotas Mais Realizadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.rotasMaisRealizadas?.slice(0, 8) || []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="rota" type="category" width={120} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="quantidade" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Rotas que Mais Custam</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.rotasMaisCaras?.slice(0, 8) || []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                        <YAxis dataKey="rota" type="category" width={120} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                        <Bar dataKey="valor" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Custo por Veículo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.custoPorVeiculo?.slice(0, 10) || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="placa" tick={{ fontSize: 10 }} />
                        <YAxis tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                        <Bar dataKey="valor" fill="#8B5CF6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Evolução de Custo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.evolucaoCusto || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="data" tick={{ fontSize: 10 }} />
                        <YAxis tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                        <Line type="monotone" dataKey="valor" stroke="#F59E0B" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Tabela Analítica de Rotas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rota</TableHead>
                        <TableHead className="text-center">Viagens</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                        <TableHead className="text-right">Custo Médio</TableHead>
                        <TableHead className="text-center">Veículos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.tabelaAnalitica?.map((row: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{row.rota}</TableCell>
                          <TableCell className="text-center">{row.viagens}</TableCell>
                          <TableCell className="text-right text-green-600 font-medium">{formatCurrency(row.valorTotal)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.custoMedio)}</TableCell>
                          <TableCell className="text-center">{row.veiculosEnvolvidos}</TableCell>
                        </TableRow>
                      ))}
                      {(!data.tabelaAnalitica || data.tabelaAnalitica.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                            Nenhum dado encontrado para o período selecionado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
