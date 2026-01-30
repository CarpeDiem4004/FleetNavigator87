import { useState, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Fuel, CreditCard, Download, FileText, ArrowLeft, AlertCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

interface AnalyticsData {
  kpis: {
    consumoTotal: {
      valor: number;
      litros: number;
      totalSolicitacoes: number;
      precoMedioLitro: number;
    };
    comparativoPeriodoAnterior: {
      diferenca: number;
      percentual: number;
      valorAnterior: number;
    };
    maiorBase: {
      base: string;
      total: number;
    };
    veiculoMaisConsumiu: {
      placa: string;
      litros: number;
      valor: number;
      quantidade_abastecimentos: number;
    };
    operadoraMaisUtilizada: {
      operadora: string;
      total: number;
      quantidade: number;
    };
  };
  graficos: {
    mensal: Array<{ mes: string; valor: string; litros: string; quantidade: string }>;
    porBase: Array<{ base: string; total: string; litros: string; quantidade: string }>;
    porOperadora: Array<{ operadora: string; total: string; litros: string; quantidade: string }>;
  };
  tabelas: {
    rankingVeiculos: Array<{
      placa: string;
      base: string;
      litros_total: string;
      valor_total: string;
      quantidade_abastecimentos: string;
      valor_medio: string;
      km_atual: number | null;
    }>;
  };
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d8'];

const FuelCardAnalyticsDashboard = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [baseFilter, setBaseFilter] = useState('all');

  // Construir query string para a API
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    if (baseFilter && baseFilter !== 'all') params.append('base', baseFilter);
    return params.toString();
  }, [dataInicio, dataFim, baseFilter]);

  // Buscar dados de analytics
  const { data: analyticsData, isLoading, error } = useQuery<{ success: boolean; data: AnalyticsData }>({
    queryKey: ['/api/fuel-card/analytics', queryParams],
    queryFn: async () => {
      const url = queryParams 
        ? `/api/fuel-card/analytics?${queryParams}`
        : '/api/fuel-card/analytics';
      const response = await apiRequest('GET', url);
      return response.json();
    },
    enabled: !!dataInicio && !!dataFim,
  });

  // Buscar bases únicas para o filtro
  const { data: basesData } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['/api/public/projects-with-bases'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/public/projects-with-bases');
      return response.json();
    },
  });

  const bases = useMemo(() => {
    if (!basesData?.data) return [];
    const allBases: string[] = [];
    basesData.data.forEach((project: any) => {
      project.bases?.forEach((base: any) => {
        if (base.base_name && !allBases.includes(base.base_name)) {
          allBases.push(base.base_name);
        }
      });
    });
    return allBases.sort();
  }, [basesData]);

  const analytics = analyticsData?.data;

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Formatar número
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Exportar para Excel
  const handleExportExcel = () => {
    if (!analytics) {
      toast({
        title: 'Aviso',
        description: 'Nenhum dado disponível para exportar',
        variant: 'destructive',
      });
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      // Aba 1: KPIs
      const kpisData = [
        ['Indicador', 'Valor'],
        ['Consumo Total (R$)', analytics.kpis.consumoTotal.valor],
        ['Litros Totais', analytics.kpis.consumoTotal.litros],
        ['Total de Solicitações', analytics.kpis.consumoTotal.totalSolicitacoes],
        ['Preço Médio por Litro (R$)', analytics.kpis.consumoTotal.precoMedioLitro],
        ['', ''],
        ['Comparativo Período Anterior', ''],
        ['Diferença (R$)', analytics.kpis.comparativoPeriodoAnterior.diferenca],
        ['Percentual (%)', analytics.kpis.comparativoPeriodoAnterior.percentual],
        ['', ''],
        ['Maior Base', analytics.kpis.maiorBase.base],
        ['Valor (R$)', analytics.kpis.maiorBase.total],
      ];
      const wsKPIs = XLSX.utils.aoa_to_sheet(kpisData);
      XLSX.utils.book_append_sheet(wb, wsKPIs, 'KPIs');

      // Aba 2: Ranking de Veículos
      const rankingData = [
        ['Placa', 'Base', 'Litros Total', 'Valor Total (R$)', 'Qtd Abastecimentos', 'Valor Médio (R$)', 'KM Atual'],
        ...analytics.tabelas.rankingVeiculos.map(v => [
          v.placa,
          v.base || 'Não especificado',
          parseFloat(v.litros_total),
          parseFloat(v.valor_total),
          parseInt(v.quantidade_abastecimentos),
          parseFloat(v.valor_medio),
          v.km_atual || 0,
        ]),
      ];
      const wsRanking = XLSX.utils.aoa_to_sheet(rankingData);
      XLSX.utils.book_append_sheet(wb, wsRanking, 'Ranking Veículos');

      // Aba 3: Consumo por Base
      const basesData = [
        ['Base', 'Valor Total (R$)', 'Litros', 'Quantidade'],
        ...analytics.graficos.porBase.map(b => [
          b.base,
          parseFloat(b.total),
          parseFloat(b.litros),
          parseInt(b.quantidade),
        ]),
      ];
      const wsBases = XLSX.utils.aoa_to_sheet(basesData);
      XLSX.utils.book_append_sheet(wb, wsBases, 'Consumo por Base');

      // Aba 4: Consumo por Operadora
      const operadorasData = [
        ['Operadora', 'Valor Total (R$)', 'Litros', 'Quantidade'],
        ...analytics.graficos.porOperadora.map(o => [
          o.operadora,
          parseFloat(o.total),
          parseFloat(o.litros),
          parseInt(o.quantidade),
        ]),
      ];
      const wsOperadoras = XLSX.utils.aoa_to_sheet(operadorasData);
      XLSX.utils.book_append_sheet(wb, wsOperadoras, 'Consumo por Operadora');

      // Gerar arquivo
      const fileName = `Analise_Consumo_${dataInicio}_${dataFim}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: 'Exportação concluída',
        description: `Arquivo ${fileName} baixado com sucesso!`,
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao exportar dados para Excel',
        variant: 'destructive',
      });
    }
  };

  // Preparar dados para gráficos
  const chartDataMensal = useMemo(() => {
    return analytics?.graficos.mensal.map(item => ({
      mes: item.mes,
      valor: parseFloat(item.valor),
      litros: parseFloat(item.litros),
    })) || [];
  }, [analytics]);

  const chartDataBase = useMemo(() => {
    return analytics?.graficos.porBase.map(item => {
      // Registros sem base são do Line Haul (já tratados no backend, mas garantindo aqui também)
      const baseName = item.base && item.base.trim() !== '' ? item.base : 'Line Haul';
      return {
        base: baseName.length > 20 ? baseName.substring(0, 20) + '...' : baseName,
        total: parseFloat(item.total),
      };
    }) || [];
  }, [analytics]);

  const chartDataOperadora = useMemo(() => {
    return analytics?.graficos.porOperadora
      .filter(item => item.operadora && item.operadora.toLowerCase() !== 'alelo')
      .map(item => ({
        name: item.operadora || 'Sem Operadora',
        value: parseFloat(item.total),
      })) || [];
  }, [analytics]);

  // Dados do gráfico mensal detalhado por operadora (Ticket vs Veloe)
  const chartDataMensalPorOperadora = useMemo(() => {
    const graficos = analytics?.graficos as any;
    if (!graficos?.mensalPorOperadora) return [];
    
    // Agrupar por mês e criar colunas para cada operadora
    const mesesMap = new Map<string, { mes: string; Ticket: number; 'Veloe Go': number; Total: number }>();
    
    graficos.mensalPorOperadora.forEach((item: any) => {
      const mes = item.mes;
      const operadora = item.operadora;
      const valor = parseFloat(item.valor) || 0;
      
      if (!mesesMap.has(mes)) {
        mesesMap.set(mes, { mes, Ticket: 0, 'Veloe Go': 0, Total: 0 });
      }
      
      const mesData = mesesMap.get(mes)!;
      if (operadora === 'Ticket') {
        mesData.Ticket = valor;
      } else if (operadora === 'Veloe Go') {
        mesData['Veloe Go'] = valor;
      }
      mesData.Total += valor;
    });
    
    return Array.from(mesesMap.values()).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [analytics]);

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => setLocation('/fuel-card-requests')}
              className="flex items-center gap-2"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              <BarChart3 className="inline-block mr-2" />
              Análise de Consumo de Combustível
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-2" 
              data-testid="button-excel"
              onClick={handleExportExcel}
              disabled={!analytics}
            >
              <Download className="h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data-inicio">Data Início *</Label>
                <Input
                  id="data-inicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  data-testid="input-data-inicio"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data-fim">Data Fim *</Label>
                <Input
                  id="data-fim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  data-testid="input-data-fim"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base">Base</Label>
                <Select value={baseFilter} onValueChange={setBaseFilter}>
                  <SelectTrigger id="base" data-testid="select-base">
                    <SelectValue placeholder="Todas as Bases" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Bases</SelectItem>
                    {bases.map(base => (
                      <SelectItem key={base} value={base}>{base}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!dataInicio || !dataFim ? (
              <p className="text-sm text-muted-foreground mt-4">
                * Selecione o período para visualizar os dados
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-3 w-40" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200">
            <CardContent className="flex items-center gap-3 py-6">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Erro ao carregar dados</p>
                <p className="text-sm text-red-700">Tente novamente mais tarde ou ajuste os filtros.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && !analytics && dataInicio && dataFim && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum dado encontrado</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Não foram encontradas solicitações de combustível para o período selecionado.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Data Display */}
        {analytics && !isLoading && !error && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Consumo Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(analytics.kpis.consumoTotal.valor)}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(analytics.kpis.consumoTotal.litros)} litros | {analytics.kpis.consumoTotal.totalSolicitacoes} solicitações
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Comparativo Período</CardTitle>
                  {analytics.kpis.comparativoPeriodoAnterior.diferenca >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${analytics.kpis.comparativoPeriodoAnterior.diferenca >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {analytics.kpis.comparativoPeriodoAnterior.diferenca >= 0 ? '+' : ''}{formatNumber(analytics.kpis.comparativoPeriodoAnterior.percentual)}%
                  </div>
                  <p className="text-xs text-muted-foreground">vs. período anterior</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Maior Base</CardTitle>
                  <Fuel className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-purple-600 truncate">{analytics.kpis.maiorBase.base || '-'}</div>
                  <p className="text-xs text-muted-foreground">{formatCurrency(analytics.kpis.maiorBase.total)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Operadora Mais Usada</CardTitle>
                  <CreditCard className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-orange-600">{analytics.kpis.operadoraMaisUtilizada.operadora || '-'}</div>
                  <p className="text-xs text-muted-foreground">{formatCurrency(analytics.kpis.operadoraMaisUtilizada.total)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico Mensal Detalhado por Operadora */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Consumo Mensal por Operadora (Ticket vs Veloe)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={chartDataMensalPorOperadora}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="Ticket" stackId="a" fill="#8884d8" name="Ticket" />
                    <Bar dataKey="Veloe Go" stackId="a" fill="#82ca9d" name="Veloe Go" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráficos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Gráfico Mensal */}
              <Card>
                <CardHeader>
                  <CardTitle>Consumo Mensal (Total)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartDataMensal}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Line type="monotone" dataKey="valor" stroke="#8884d8" name="Valor (R$)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Gráfico por Operadora */}
              <Card>
                <CardHeader>
                  <CardTitle>Consumo por Operadora</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartDataOperadora}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartDataOperadora.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico por Base */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Consumo por Base (Top 10)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartDataBase} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="base" type="category" width={150} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="total" fill="#82ca9d" name="Valor Total (R$)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Ranking de Veículos */}
            <Card>
              <CardHeader>
                <CardTitle>Ranking de Veículos (Top 50)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Placa</TableHead>
                        <TableHead>Base</TableHead>
                        <TableHead className="text-right">Litros Total</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                        <TableHead className="text-right">Qtd Abastecimentos</TableHead>
                        <TableHead className="text-right">Valor Médio</TableHead>
                        <TableHead className="text-right">KM Atual</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.tabelas.rankingVeiculos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            Nenhum veículo encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        analytics.tabelas.rankingVeiculos.map((veiculo, index) => (
                          <TableRow key={veiculo.placa}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell className="font-mono font-bold">{veiculo.placa}</TableCell>
                            <TableCell className="text-sm">{veiculo.base || 'Não especificado'}</TableCell>
                            <TableCell className="text-right">{formatNumber(parseFloat(veiculo.litros_total))}</TableCell>
                            <TableCell className="text-right">{formatCurrency(parseFloat(veiculo.valor_total))}</TableCell>
                            <TableCell className="text-right">{veiculo.quantidade_abastecimentos}</TableCell>
                            <TableCell className="text-right">{formatCurrency(parseFloat(veiculo.valor_medio))}</TableCell>
                            <TableCell className="text-right">{veiculo.km_atual ? formatNumber(veiculo.km_atual) : '-'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default FuelCardAnalyticsDashboard;
