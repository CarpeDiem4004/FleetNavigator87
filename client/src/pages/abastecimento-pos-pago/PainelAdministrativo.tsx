import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  Fuel, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  Eye,
  FileText,
  CheckCircle,
  Clock,
  Droplet,
  Car,
  Leaf,
  Download,
  Filter,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Lightbulb,
  ExternalLink,
  Copy
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import { BarChart, Bar, PieChart as RePieChart, Pie, Cell, LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Abastecimento {
  id: number;
  nome: string;
  telefone: string;
  placa: string;
  km: number;
  tipo_combustivel: string;
  valor_total: number;
  litros: number;
  nome_gestor: string;
  foto_nota: string;
  status: 'pendente' | 'faturado' | 'pago';
  base_name: string;
  projeto_name: string;
  created_at: string;
}

interface DashboardData {
  estatisticas: {
    total_registros: number;
    valor_total: number;
    litros_total: number;
    pendentes: number;
    faturados: number;
    pagos: number;
  };
  consumo_por_base: Array<{
    base_name: string;
    total_abastecimentos: number;
    total_valor: number;
    total_litros: number;
  }>;
  pendencias: Array<{
    base_name: string;
    pendentes: number;
    valor_total_pendente: number;
  }>;
}

const FUEL_COLORS = {
  'diesel': '#FF8C00',
  'diesel s10': '#FF8C00',
  'gasolina': '#DC143C',
  'gasolina aditivada': '#DC143C',
  'etanol': '#32CD32',
  'arla': '#4169E1',
  'arla 32': '#4169E1'
};

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function PainelAdministrativoAbastecimento() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [filters, setFilters] = useState({
    base_name: '',
    tipo_combustivel: '',
    status: '',
    data_inicio: '',
    data_fim: ''
  });

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<{ success: boolean; data: DashboardData }>({
    queryKey: ['/api/admin/abastecimento-pos-pago/dashboard'],
    enabled: !!user
  });

  const { data: abastecimentosData, isLoading: abastecimentosLoading } = useQuery<{ success: boolean; data: Abastecimento[]; pagination: any }>({
    queryKey: ['/api/admin/abastecimento-pos-pago'],
    enabled: !!user
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/admin/abastecimento-pos-pago/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Erro ao atualizar status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/abastecimento-pos-pago'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/abastecimento-pos-pago/dashboard'] });
      toast({ title: "Status atualizado com sucesso!" });
    }
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">Você precisa estar logado para acessar esta página.</p>
          <Button onClick={() => window.location.href = '/login'}>
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'faturado': return 'bg-blue-100 text-blue-800';
      case 'pago': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return <Clock className="h-3 w-3" />;
      case 'faturado': return <FileText className="h-3 w-3" />;
      case 'pago': return <CheckCircle className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getAbastecimentos = () => {
    if (!abastecimentosData?.data) return [];
    let filtered = [...abastecimentosData.data];

    if (filters.base_name) {
      filtered = filtered.filter(a => a.base_name === filters.base_name);
    }
    if (filters.tipo_combustivel) {
      filtered = filtered.filter(a => a.tipo_combustivel.toLowerCase().includes(filters.tipo_combustivel.toLowerCase()));
    }
    if (filters.status) {
      filtered = filtered.filter(a => a.status === filters.status);
    }
    if (filters.data_inicio) {
      filtered = filtered.filter(a => new Date(a.created_at) >= new Date(filters.data_inicio));
    }
    if (filters.data_fim) {
      filtered = filtered.filter(a => new Date(a.created_at) <= new Date(filters.data_fim));
    }

    return filtered;
  };

  const getAnalytics = () => {
    const abastecimentos = getAbastecimentos();

    const porCombustivel = abastecimentos.reduce((acc, item) => {
      const tipo = item.tipo_combustivel.toLowerCase();
      if (!acc[tipo]) {
        acc[tipo] = { litros: 0, valor: 0, count: 0 };
      }
      acc[tipo].litros += parseFloat(String(item.litros || 0));
      acc[tipo].valor += item.valor_total || 0;
      acc[tipo].count += 1;
      return acc;
    }, {} as Record<string, { litros: number; valor: number; count: number }>);

    const totalLitros = Object.values(porCombustivel).reduce((sum, v) => sum + v.litros, 0);
    const totalValor = Object.values(porCombustivel).reduce((sum, v) => sum + v.valor, 0);

    return {
      porCombustivel,
      totalLitros,
      totalValor,
      precoMedio: totalLitros > 0 ? totalValor / totalLitros : 0,
      totalRegistros: abastecimentos.length
    };
  };

  const getChartData = () => {
    const abastecimentos = getAbastecimentos();

    const porBase = abastecimentos.reduce((acc, item) => {
      if (!acc[item.base_name]) {
        acc[item.base_name] = {};
      }
      const tipo = item.tipo_combustivel;
      if (!acc[item.base_name][tipo]) {
        acc[item.base_name][tipo] = 0;
      }
      acc[item.base_name][tipo] += parseFloat(String(item.litros || 0));
      return acc;
    }, {} as Record<string, Record<string, number>>);

    const chartData = Object.entries(porBase).map(([base, tipos]) => ({
      base,
      ...tipos
    }));

    const pieData = Object.entries(getAnalytics().porCombustivel).map(([tipo, data]) => ({
      name: tipo.toUpperCase(),
      value: data.litros
    }));

    const porMes = abastecimentos.reduce((acc, item) => {
      const mes = new Date(item.created_at).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
      if (!acc[mes]) {
        acc[mes] = { litros: 0, valor: 0 };
      }
      acc[mes].litros += parseFloat(String(item.litros || 0));
      acc[mes].valor += item.valor_total || 0;
      return acc;
    }, {} as Record<string, { litros: number; valor: number }>);

    const lineData = Object.entries(porMes).map(([mes, data]) => ({
      mes,
      litros: data.litros,
      valor: data.valor
    }));

    const porStatus = abastecimentos.reduce((acc, item) => {
      if (!acc[item.status]) {
        acc[item.status] = { count: 0, valor: 0 };
      }
      acc[item.status].count += 1;
      acc[item.status].valor += item.valor_total || 0;
      return acc;
    }, {} as Record<string, { count: number; valor: number }>);

    const statusData = Object.entries(porStatus).map(([status, data]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      quantidade: data.count,
      valor: data.valor
    }));

    return { chartData, pieData, lineData, statusData };
  };

  const getInsights = () => {
    const abastecimentos = getAbastecimentos();
    const insights: string[] = [];

    const porBase = abastecimentos.reduce((acc, item) => {
      if (!acc[item.base_name]) acc[item.base_name] = 0;
      acc[item.base_name] += parseFloat(String(item.litros || 0));
      return acc;
    }, {} as Record<string, number>);

    const baseMaisConsumo = Object.entries(porBase).sort((a, b) => b[1] - a[1])[0];
    if (baseMaisConsumo) {
      insights.push(`🏆 ${baseMaisConsumo[0]} teve o maior consumo (${baseMaisConsumo[1].toFixed(2)}L)`);
    }

    const pendentesAntigos = abastecimentos.filter(a => {
      const dias = (new Date().getTime() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return a.status === 'pendente' && dias > 7;
    });

    if (pendentesAntigos.length > 0) {
      insights.push(`⚠️ ${pendentesAntigos.length} abastecimentos pendentes há mais de 7 dias`);
    }

    const analytics = getAnalytics();
    insights.push(`💰 Preço médio por litro: ${formatCurrency(analytics.precoMedio)}`);

    const combustivelMaisUsado = Object.entries(analytics.porCombustivel).sort((a, b) => b[1].litros - a[1].litros)[0];
    if (combustivelMaisUsado) {
      insights.push(`⛽ Combustível mais usado: ${combustivelMaisUsado[0].toUpperCase()} (${combustivelMaisUsado[1].litros.toFixed(2)}L)`);
    }

    return insights;
  };

  const exportToCSV = () => {
    const abastecimentos = getAbastecimentos();
    const headers = ['Data', 'Motorista', 'Placa', 'KM', 'Combustível', 'Litros', 'Valor Total', 'Gestor', 'Base', 'Status'];
    const rows = abastecimentos.map(a => [
      formatDate(a.created_at),
      a.nome,
      a.placa,
      a.km,
      a.tipo_combustivel,
      a.litros,
      a.valor_total,
      a.nome_gestor,
      a.base_name,
      a.status
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abastecimentos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast({ title: "CSV exportado com sucesso!" });
  };

  const exportToExcel = () => {
    const abastecimentos = getAbastecimentos();
    const data = abastecimentos.map(a => ({
      'Data': formatDate(a.created_at),
      'Motorista': a.nome,
      'Telefone': a.telefone,
      'Placa': a.placa,
      'KM': a.km,
      'Combustível': a.tipo_combustivel,
      'Litros': parseFloat(String(a.litros || 0)).toFixed(2),
      'Valor Total': formatCurrency(a.valor_total),
      'Gestor': a.nome_gestor,
      'Projeto': a.projeto_name,
      'Base': a.base_name,
      'Status': a.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Abastecimentos');

    XLSX.writeFile(workbook, `abastecimentos_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: "Excel exportado com sucesso!" });
  };

  const exportToPDF = () => {
    const abastecimentos = getAbastecimentos();
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Relatório de Abastecimentos Pós-Pago', 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 25);
    doc.text(`Total de registros: ${abastecimentos.length}`, 14, 30);

    const tableData = abastecimentos.map(a => [
      formatDate(a.created_at),
      a.nome,
      a.placa,
      a.km?.toString() || '-',
      a.tipo_combustivel,
      parseFloat(String(a.litros || 0)).toFixed(2),
      formatCurrency(a.valor_total),
      a.base_name,
      a.status
    ]);

    (doc as any).autoTable({
      startY: 35,
      head: [['Data', 'Motorista', 'Placa', 'KM', 'Combustível', 'Litros', 'Valor', 'Base', 'Status']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
      margin: { top: 35 }
    });

    doc.save(`abastecimentos_${new Date().toISOString().split('T')[0]}.pdf`);
    toast({ title: "PDF exportado com sucesso!" });
  };

  const analytics = getAnalytics();
  const { chartData, pieData, lineData, statusData } = getChartData();
  const insights = getInsights();
  const bases = Array.from(new Set(abastecimentosData?.data?.map(a => a.base_name) || []));
  const tiposCombustivel = Array.from(new Set(abastecimentosData?.data?.map(a => a.tipo_combustivel) || []));

  return (
    <div className="space-y-6" data-testid="painel-administrativo-container">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema Pós-Pago</h1>
          <p className="text-gray-600">Gestão de abastecimentos e faturamento</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Exportar Relatório
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={exportToCSV} data-testid="export-csv">
              <FileText className="h-4 w-4 mr-2" />
              Exportar CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToExcel} data-testid="export-excel">
              <FileText className="h-4 w-4 mr-2" />
              Exportar Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToPDF} data-testid="export-pdf">
              <FileText className="h-4 w-4 mr-2" />
              Exportar PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">
            <TrendingUp className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="abastecimentos" data-testid="tab-abastecimentos">
            <Fuel className="h-4 w-4 mr-2" />
            Abastecimentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Filtros */}
          <Card data-testid="card-filters">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Select value={filters.base_name} onValueChange={(v) => setFilters(prev => ({ ...prev, base_name: v }))}>
                  <SelectTrigger data-testid="select-base">
                    <SelectValue placeholder="Todas as bases" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as bases</SelectItem>
                    {bases.map(base => (
                      <SelectItem key={base} value={base}>{base}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.tipo_combustivel} onValueChange={(v) => setFilters(prev => ({ ...prev, tipo_combustivel: v }))}>
                  <SelectTrigger data-testid="select-combustivel">
                    <SelectValue placeholder="Todos combustíveis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {tiposCombustivel.map(tipo => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.status} onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue placeholder="Todos status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="faturado">Faturado</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                  </SelectContent>
                </Select>

                <Input 
                  type="date" 
                  value={filters.data_inicio} 
                  onChange={(e) => setFilters(prev => ({ ...prev, data_inicio: e.target.value }))}
                  placeholder="Data início"
                  data-testid="input-data-inicio"
                />

                <Input 
                  type="date" 
                  value={filters.data_fim} 
                  onChange={(e) => setFilters(prev => ({ ...prev, data_fim: e.target.value }))}
                  placeholder="Data fim"
                  data-testid="input-data-fim"
                />
              </div>
            </CardContent>
          </Card>

          {/* Cards de Indicadores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card data-testid="card-total-registros">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Registros</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalRegistros}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-valor-total">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Valor Total</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(analytics.totalValor)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-litros-total">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Litros Total</p>
                    <p className="text-2xl font-bold text-orange-600">{analytics.totalLitros.toFixed(2)}L</p>
                  </div>
                  <Fuel className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-preco-medio">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Preço Médio/L</p>
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(analytics.precoMedio)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cards por Tipo de Combustível */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(analytics.porCombustivel).map(([tipo, data]) => {
              const Icon = tipo.includes('diesel') ? Fuel : tipo.includes('gasolina') ? Car : tipo.includes('etanol') ? Leaf : Droplet;
              return (
                <Card key={tipo} data-testid={`card-combustivel-${tipo}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{tipo.toUpperCase()}</p>
                        <p className="text-xl font-bold">{data.litros.toFixed(2)}L</p>
                        <p className="text-sm text-gray-500">{formatCurrency(data.valor)}</p>
                      </div>
                      <Icon className="h-8 w-8" style={{ color: FUEL_COLORS[tipo as keyof typeof FUEL_COLORS] || '#666' }} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Insights */}
          <Card data-testid="card-insights">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Insights Automáticos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {insights.map((insight, i) => (
                  <Alert key={i} data-testid={`insight-${i}`}>
                    <AlertDescription>{insight}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Barras - Consumo por Base */}
            <Card data-testid="card-chart-barras">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Consumo por Base
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="base" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {tiposCombustivel.map((tipo, i) => (
                      <Bar key={tipo} dataKey={tipo} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Pizza - Distribuição por Combustível */}
            <Card data-testid="card-chart-pizza">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribuição por Combustível
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value.toFixed(0)}L`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Linha - Evolução Mensal */}
            <Card data-testid="card-chart-linha">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Evolução Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ReLineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="litros" stroke="#3B82F6" name="Litros" />
                    <Line yAxisId="right" type="monotone" dataKey="valor" stroke="#10B981" name="Valor (R$)" />
                  </ReLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Barras - Status dos Pagamentos */}
            <Card data-testid="card-chart-status">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Status dos Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quantidade" fill="#3B82F6" name="Quantidade" />
                    <Bar dataKey="valor" fill="#10B981" name="Valor (R$)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba de Abastecimentos */}
        <TabsContent value="abastecimentos" className="space-y-4">
          {/* Card com Link Público */}
          <Card className="bg-blue-50 border-blue-200" data-testid="card-link-publico">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <ExternalLink className="h-5 w-5" />
                Link Público para Motoristas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-800 mb-3">
                Compartilhe este link com os motoristas para que eles possam registrar abastecimentos diretamente:
              </p>
              <div className="flex gap-2">
                <Input 
                  value={`${window.location.origin}/postpaid`}
                  readOnly
                  className="bg-white font-mono text-sm"
                  data-testid="input-link-publico"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/postpaid`);
                    toast({ title: "Link copiado com sucesso!" });
                  }}
                  data-testid="button-copiar-link"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('/postpaid', '_blank')}
                  data-testid="button-abrir-link"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-lista-abastecimentos">
            <CardHeader>
              <CardTitle>Lista de Abastecimentos ({getAbastecimentos().length})</CardTitle>
            </CardHeader>
            <CardContent>
              {getAbastecimentos().length > 0 ? (
                <div className="space-y-4">
                  {getAbastecimentos().map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-3" data-testid={`abastecimento-${item.id}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(item.status)}>
                            {getStatusIcon(item.status)}
                            <span className="ml-1 capitalize">{item.status}</span>
                          </Badge>
                          <span className="font-medium" data-testid={`text-placa-${item.id}`}>{item.placa}</span>
                          <span className="text-gray-600" data-testid={`text-motorista-${item.id}`}>{item.nome}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium" data-testid={`text-valor-${item.id}`}>{formatCurrency(item.valor_total)}</div>
                          <div className="text-sm text-gray-500">{parseFloat(String(item.litros || 0)).toFixed(2)}L</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Telefone:</span>
                          <div className="font-medium">{item.telefone}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">KM:</span>
                          <div className="font-medium">{item.km?.toLocaleString() || '-'} km</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Base:</span>
                          <div className="font-medium">{item.base_name}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Projeto:</span>
                          <div className="font-medium">{item.projeto_name}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Combustível:</span>
                          <div className="font-medium capitalize">{item.tipo_combustivel}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" data-testid={`button-detalhes-${item.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalhes
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Detalhes do Abastecimento #{item.id}</DialogTitle>
                              </DialogHeader>
                              <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                  <span className="text-xs text-gray-500">Motorista</span>
                                  <p className="font-medium">{item.nome}</p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Telefone</span>
                                  <p className="font-medium">{item.telefone}</p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Placa</span>
                                  <p className="font-medium font-mono">{item.placa}</p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Quilometragem</span>
                                  <p className="font-medium">{item.km?.toLocaleString() || '-'} km</p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Combustível</span>
                                  <p className="font-medium">{item.tipo_combustivel}</p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Litros</span>
                                  <p className="font-medium">{parseFloat(String(item.litros || 0)).toFixed(2)} L</p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Valor Total</span>
                                  <p className="font-semibold text-lg text-green-600">{formatCurrency(item.valor_total)}</p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Gestor/Coordenador</span>
                                  <p className="font-medium">{item.nome_gestor}</p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Projeto</span>
                                  <p className="font-medium">{item.projeto_name}</p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Base</span>
                                  <p className="font-medium">{item.base_name}</p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Data</span>
                                  <p className="font-medium">{formatDate(item.created_at)}</p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Status</span>
                                  <Badge className={getStatusColor(item.status)}>
                                    {item.status}
                                  </Badge>
                                </div>
                              </div>
                              
                              {item.foto_nota && (
                                <div className="mt-6">
                                  <span className="text-sm font-medium mb-2 block">Foto da Nota Fiscal</span>
                                  <div className="border rounded-lg p-2 bg-gray-50">
                                    <img
                                      src={item.foto_nota}
                                      alt="Nota Fiscal"
                                      className="w-full h-auto rounded max-h-96 object-contain"
                                    />
                                  </div>
                                  <a
                                    href={item.foto_nota}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                                  >
                                    Abrir foto em nova aba
                                  </a>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>

                        <div className="flex gap-2">
                          {item.status === 'pendente' && (
                            <Button
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'faturado' })}
                              disabled={updateStatusMutation.isPending}
                              data-testid={`button-faturar-${item.id}`}
                            >
                              Marcar como Faturado
                            </Button>
                          )}

                          {item.status === 'faturado' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'pendente' })}
                                disabled={updateStatusMutation.isPending}
                                data-testid={`button-voltar-pendente-${item.id}`}
                              >
                                Voltar para Pendente
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'pago' })}
                                disabled={updateStatusMutation.isPending}
                                data-testid={`button-pagar-${item.id}`}
                              >
                                Marcar como Pago
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Fuel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum abastecimento encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
