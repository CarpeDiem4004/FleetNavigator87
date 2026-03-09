import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  DollarSign,
  Car,
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';

interface RankingBase {
  base: string;
  total_solicitado: number;
  quantidade_solicitacoes: number;
}

interface RankingVeiculo {
  placa: string;
  total_solicitado: number;
  quantidade_solicitacoes: number;
  base: string;
}

interface InconsistenciaVeiculo {
  placa: string;
  base?: string;
  quantidade_rotas?: number;
  total_solicitado?: number;
}

interface RelatorioConsumoData {
  ranking_bases: RankingBase[];
  ranking_veiculos: RankingVeiculo[];
  inconsistencias_solicitou_mas_nao_rodou: InconsistenciaVeiculo[];
  inconsistencias_rodou_mas_nao_solicitou: InconsistenciaVeiculo[];
  totais: {
    total_solicitacoes: number;
    total_valor_solicitado: number;
    total_veiculos_rodaram: number;
    total_bases: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

const RelatorioConsumo = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  const { data: relatorioData, isLoading, isFetching, refetch } = useQuery<{ success: boolean; data: RelatorioConsumoData }>({
    queryKey: ['/api/relatorio/consumo', selectedDate],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/relatorio/consumo?data=${selectedDate}`);
      return res.json();
    },
    enabled: false,
  });

  const handleGenerateReport = async () => {
    await refetch();
  };

  const handleExportCSV = () => {
    if (!relatorioData?.data) {
      toast({
        title: "Erro",
        description: "Gere o relatório primeiro antes de exportar",
        variant: "destructive",
      });
      return;
    }

    const data = relatorioData.data;
    const csvRows: string[] = [];

    // Cabeçalho
    csvRows.push('RELATÓRIO DE CONSUMO E ANÁLISE');
    csvRows.push(`Data: ${new Date(selectedDate).toLocaleDateString('pt-BR')}`);
    csvRows.push('');

    // Totalizadores
    csvRows.push('TOTALIZADORES');
    csvRows.push('Métrica,Valor');
    csvRows.push(`Total de Solicitações,${data.totais.total_solicitacoes}`);
    csvRows.push(`Total Valor Solicitado,R$ ${data.totais.total_valor_solicitado.toFixed(2)}`);
    csvRows.push(`Total de Veículos que Rodaram,${data.totais.total_veiculos_rodaram}`);
    csvRows.push(`Total de Bases,${data.totais.total_bases}`);
    csvRows.push('');

    // Ranking de Bases
    csvRows.push('RANKING DE BASES (Por Valor Solicitado)');
    csvRows.push('Posição,Base,Valor Total Solicitado,Quantidade de Solicitações');
    data.ranking_bases.forEach((item, index) => {
      csvRows.push(`${index + 1},${item.base},R$ ${item.total_solicitado.toFixed(2)},${item.quantidade_solicitacoes}`);
    });
    csvRows.push('');

    // Ranking de Veículos
    csvRows.push('RANKING DE VEÍCULOS (Por Valor Solicitado)');
    csvRows.push('Posição,Placa,Base,Valor Total Solicitado,Quantidade de Solicitações');
    data.ranking_veiculos.forEach((item, index) => {
      csvRows.push(`${index + 1},${item.placa},${item.base},R$ ${item.total_solicitado.toFixed(2)},${item.quantidade_solicitacoes}`);
    });
    csvRows.push('');

    // Inconsistências - Solicitou mas não rodou
    csvRows.push('INCONSISTÊNCIAS - SOLICITOU MAS NÃO RODOU');
    csvRows.push('Placa,Base,Valor Total Solicitado');
    data.inconsistencias_solicitou_mas_nao_rodou.forEach((item) => {
      csvRows.push(`${item.placa},${item.base || 'N/A'},R$ ${(item.total_solicitado || 0).toFixed(2)}`);
    });
    csvRows.push('');

    // Inconsistências - Rodou mas não solicitou
    csvRows.push('INCONSISTÊNCIAS - RODOU MAS NÃO SOLICITOU');
    csvRows.push('Placa,Quantidade de Rotas');
    data.inconsistencias_rodou_mas_nao_solicitou.forEach((item) => {
      csvRows.push(`${item.placa},${item.quantidade_rotas || 0}`);
    });
    csvRows.push('');

    // Dados Unificados com Status
    csvRows.push('DADOS UNIFICADOS - TODOS OS VEÍCULOS');
    csvRows.push('Placa,Base,Valor Total Solicitado,Status');
    
    // Criar mapa de todos os veículos
    const allVehicles = new Map<string, { placa: string; base: string; valor: number; status: string }>();
    
    // Veículos que solicitaram
    data.ranking_veiculos.forEach(v => {
      const key = `${v.placa}|${v.base}`;
      allVehicles.set(key, {
        placa: v.placa,
        base: v.base,
        valor: v.total_solicitado,
        status: 'Solicitou'
      });
    });
    
    // Atualizar status se também rodaram
    data.ranking_veiculos.forEach(v => {
      // Verificar se não está na lista de "solicitou mas não rodou"
      const isInconsis = data.inconsistencias_solicitou_mas_nao_rodou.find(i => i.placa === v.placa);
      if (!isInconsis) {
        const key = `${v.placa}|${v.base}`;
        const vehicle = allVehicles.get(key);
        if (vehicle) {
          vehicle.status = 'Rodou e Solicitou';
        }
      }
    });
    
    // Veículos que solicitaram mas não rodaram
    data.inconsistencias_solicitou_mas_nao_rodou.forEach(v => {
      const key = `${v.placa}|${v.base || 'N/A'}`;
      allVehicles.set(key, {
        placa: v.placa,
        base: v.base || 'N/A',
        valor: v.total_solicitado || 0,
        status: 'Solicitou sem Rodar'
      });
    });
    
    // Veículos que rodaram mas não solicitaram
    data.inconsistencias_rodou_mas_nao_solicitou.forEach(v => {
      const key = `${v.placa}|N/A`;
      allVehicles.set(key, {
        placa: v.placa,
        base: 'N/A',
        valor: 0,
        status: 'Rodou sem Solicitar'
      });
    });
    
    // Exportar todos os veículos
    Array.from(allVehicles.values()).forEach(vehicle => {
      csvRows.push(`${vehicle.placa},${vehicle.base},R$ ${vehicle.valor.toFixed(2)},${vehicle.status}`);
    });

    // Gerar e baixar CSV
    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_consumo_${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: "Relatório exportado com sucesso!",
    });
  };

  const data = relatorioData?.data;

  return (
    <MainLayoutSimple title="Relatório e Análise de Consumo">
      <div className="space-y-6">
        {/* Filtros e Ações */}
        <Card>
          <CardHeader>
            <CardTitle>Gerar Relatório de Conferência</CardTitle>
            <CardDescription>
              Selecione uma data para gerar o relatório comparativo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="date">Data para Análise</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  data-testid="input-date"
                />
              </div>
              <div className="flex gap-2 items-end">
                <Button 
                  onClick={handleGenerateReport}
                  disabled={isLoading || isFetching}
                  data-testid="button-generate-report"
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  {(isLoading || isFetching) ? 'Gerando...' : 'Gerar Relatório'}
                </Button>
                {data && (
                  <Button
                    onClick={handleExportCSV}
                    variant="outline"
                    data-testid="button-export-csv"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar CSV
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Totalizadores */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Solicitações</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-solicitacoes">
                  {data.totais.total_solicitacoes}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total Solicitado</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-valor-total">
                  R$ {data.totais.total_valor_solicitado.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Veículos que Rodaram</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-veiculos-rodaram">
                  {data.totais.total_veiculos_rodaram}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Bases</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-bases">
                  {data.totais.total_bases}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs com Rankings e Inconsistências */}
        {data && (
          <Tabs defaultValue="ranking-bases" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="ranking-bases">Ranking Bases</TabsTrigger>
              <TabsTrigger value="ranking-veiculos">Ranking Veículos</TabsTrigger>
              <TabsTrigger value="solicitou-nao-rodou">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Solicitou/Não Rodou
              </TabsTrigger>
              <TabsTrigger value="rodou-nao-solicitou">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Rodou/Não Solicitou
              </TabsTrigger>
            </TabsList>

            {/* Ranking de Bases */}
            <TabsContent value="ranking-bases" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Tabela */}
                <Card>
                  <CardHeader>
                    <CardTitle>Bases que Mais Solicitaram</CardTitle>
                    <CardDescription>Ordenado por valor total solicitado</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Base</TableHead>
                          <TableHead>Qtd</TableHead>
                          <TableHead>Valor Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.ranking_bases.slice(0, 10).map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>{item.base}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{item.quantidade_solicitacoes}</Badge>
                            </TableCell>
                            <TableCell className="text-green-600 font-medium">
                              R$ {item.total_solicitado.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Gráfico de Barras */}
                <Card>
                  <CardHeader>
                    <CardTitle>Gráfico de Bases</CardTitle>
                    <CardDescription>Top 8 bases por valor solicitado</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={data.ranking_bases.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="base" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                        />
                        <Legend />
                        <Bar dataKey="total_solicitado" fill="#8884d8" name="Valor Solicitado" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico de Pizza */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Base</CardTitle>
                  <CardDescription>Proporção do valor total solicitado</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={data.ranking_bases.slice(0, 8)}
                        dataKey="total_solicitado"
                        nameKey="base"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        fill="#8884d8"
                        label={(entry) => `${entry.base}: R$ ${entry.total_solicitado.toFixed(0)}`}
                      >
                        {data.ranking_bases.slice(0, 8).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Ranking de Veículos */}
            <TabsContent value="ranking-veiculos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Veículos que Mais Solicitaram</CardTitle>
                  <CardDescription>Ordenado por valor total solicitado</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Placa</TableHead>
                        <TableHead>Base</TableHead>
                        <TableHead>Qtd</TableHead>
                        <TableHead>Valor Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.ranking_veiculos.slice(0, 20).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="font-mono font-bold">{item.placa}</TableCell>
                          <TableCell>{item.base}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.quantidade_solicitacoes}</Badge>
                          </TableCell>
                          <TableCell className="text-green-600 font-medium">
                            R$ {item.total_solicitado.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Gráfico de Barras para Veículos */}
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Veículos</CardTitle>
                  <CardDescription>Valor solicitado por veículo</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={data.ranking_veiculos.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="placa" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                      <Legend />
                      <Bar dataKey="total_solicitado" fill="#00C49F" name="Valor Solicitado" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inconsistências - Solicitou mas não rodou */}
            <TabsContent value="solicitou-nao-rodou">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    Veículos que Solicitaram mas Não Rodaram
                  </CardTitle>
                  <CardDescription>
                    Veículos com solicitação de saldo mas sem registro de rota
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.inconsistencias_solicitou_mas_nao_rodou.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      <p>Nenhuma inconsistência encontrada!</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Placa</TableHead>
                          <TableHead>Base</TableHead>
                          <TableHead>Valor Total Solicitado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.inconsistencias_solicitou_mas_nao_rodou.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono font-bold">{item.placa}</TableCell>
                            <TableCell>{item.base || 'N/A'}</TableCell>
                            <TableCell className="text-red-600 font-medium">
                              R$ {(item.total_solicitado || 0).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inconsistências - Rodou mas não solicitou */}
            <TabsContent value="rodou-nao-solicitou">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Veículos que Rodaram mas Não Solicitaram
                  </CardTitle>
                  <CardDescription>
                    Veículos com registro de rota mas sem solicitação de saldo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.inconsistencias_rodou_mas_nao_solicitou.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      <p>Nenhuma inconsistência encontrada!</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Placa</TableHead>
                          <TableHead>Quantidade de Rotas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.inconsistencias_rodou_mas_nao_solicitou.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono font-bold">{item.placa}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.quantidade_rotas || 0}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Mensagem inicial */}
        {!data && !isLoading && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Selecione uma data e clique em "Gerar Relatório" para visualizar a análise</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayoutSimple>
  );
};

export default RelatorioConsumo;
