import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, DollarSign, Fuel, CreditCard, Download, FileText, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

const FuelCardAnalyticsDashboard = () => {
  const [, setLocation] = useLocation();
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [projetoFilter, setProjetoFilter] = useState('all');
  const [baseFilter, setBaseFilter] = useState('all');

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
            <Button variant="outline" className="flex items-center gap-2" data-testid="button-excel">
              <Download className="h-4 w-4" />
              Exportar Excel
            </Button>
            <Button variant="outline" className="flex items-center gap-2" data-testid="button-pdf">
              <FileText className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data-inicio">Data Início</Label>
                <Input
                  id="data-inicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  data-testid="input-data-inicio"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data-fim">Data Fim</Label>
                <Input
                  id="data-fim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  data-testid="input-data-fim"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projeto">Projeto</Label>
                <Select value={projetoFilter} onValueChange={setProjetoFilter}>
                  <SelectTrigger id="projeto" data-testid="select-projeto">
                    <SelectValue placeholder="Todos os Projetos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Projetos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="base">Base</Label>
                <Select value={baseFilter} onValueChange={setBaseFilter}>
                  <SelectTrigger id="base" data-testid="select-base">
                    <SelectValue placeholder="Todas as Bases" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Bases</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consumo Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">R$ 0,00</div>
              <p className="text-xs text-muted-foreground">0 litros consumidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comparativo Período</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">+0%</div>
              <p className="text-xs text-muted-foreground">vs. período anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maior Base</CardTitle>
              <Fuel className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">-</div>
              <p className="text-xs text-muted-foreground">Nenhuma base selecionada</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Operadora Mais Usada</CardTitle>
              <CreditCard className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">-</div>
              <p className="text-xs text-muted-foreground">Nenhum dado disponível</p>
            </CardContent>
          </Card>
        </div>

        {/* Placeholder para Gráficos e Tabelas */}
        <Card>
          <CardHeader>
            <CardTitle>Dashboard em Construção</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Estrutura Básica Criada</h3>
              <p className="text-muted-foreground max-w-md">
                A estrutura base do dashboard foi criada com sucesso. 
                Os gráficos, tabelas detalhadas e funcionalidades de exportação 
                serão implementados nas próximas etapas.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default FuelCardAnalyticsDashboard;
