import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Building2, Target, BarChart3, Download, Calendar } from 'lucide-react';
import { FaGasPump, FaProjectDiagram, FaBuilding } from 'react-icons/fa';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ComparativoData {
  resumo_executivo: {
    total_registros: number;
    total_projetos: number;
    total_bases: number;
    postos_analisados: number;
    periodo: string;
  };
  analise_por_projeto: Array<{
    projeto: string;
    posto: string;
    total_litros: number;
    total_abastecimentos: number;
    total_veiculos: number;
    total_valor: number;
    meses_ativos: number;
    historico_mensal: Array<{
      mes: number;
      mes_nome: string;
      litros: number;
      valor: number;
    }>;
    media_mensal_litros: number;
    tendencia_projecao: number;
  }>;
  analise_por_base: Array<{
    base: string;
    posto: string;
    total_litros: number;
    total_abastecimentos: number;
    total_veiculos: number;
    total_valor: number;
    projetos_associados: string[];
    meses_ativos: number;
  }>;
  consolidado_por_posto: Array<{
    posto: string;
    total_litros: number;
    total_abastecimentos: number;
    total_valor: number;
    projetos_unicos: string[];
    bases_unicas: string[];
    maior_projeto: { nome: string; litros: number };
    maior_base: { nome: string; litros: number };
  }>;
  top_performers: {
    projetos: Array<{
      projeto: string;
      posto: string;
      total_litros: number;
      total_valor: number;
      tendencia_projecao: number;
    }>;
    bases: Array<{
      base: string;
      posto: string;
      total_litros: number;
      total_valor: number;
      projetos_associados: string[];
    }>;
  };
}

const ComparativoProjetoBasePage: React.FC = () => {
  const { toast } = useToast();
  const [data, setData] = useState<ComparativoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [anoSelecionado, setAnoSelecionado] = useState('2025');
  const [visualizacao, setVisualizacao] = useState<'projeto' | 'base' | 'consolidado'>('projeto');

  const carregarDados = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(`/api/abastecimentos/comparativo-projeto-base?ano=${anoSelecionado}`);
      
      if (response.success) {
        setData(response.data);
      } else {
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar o comparativo",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar comparativo:', error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message || "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [anoSelecionado]);

  const formatarNumero = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(valor);
  };

  const formatarMoeda = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(valor);
  };

  const getTendenciaIcon = (projecao: number, atual: number) => {
    if (projecao > atual * 1.1) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (projecao < atual * 0.9) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <BarChart3 className="w-4 h-4 text-blue-600" />;
  };

  const exportarCSV = () => {
    if (!data) return;

    let csvContent = "";
    
    if (visualizacao === 'projeto') {
      csvContent = "Projeto,Posto,Total Litros,Abastecimentos,Veículos,Valor Total,Projeção Anual\n";
      data.analise_por_projeto.forEach(item => {
        csvContent += `${item.projeto},${item.posto},${item.total_litros},${item.total_abastecimentos},${item.total_veiculos},${item.total_valor},${item.tendencia_projecao}\n`;
      });
    } else if (visualizacao === 'base') {
      csvContent = "Base,Posto,Total Litros,Abastecimentos,Valor Total,Projetos Associados\n";
      data.analise_por_base.forEach(item => {
        csvContent += `${item.base},${item.posto},${item.total_litros},${item.total_abastecimentos},${item.total_valor},"${item.projetos_associados.join(', ')}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `comparativo_${visualizacao}_${anoSelecionado}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Comparativo por Projeto e Base</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Erro ao carregar dados</h1>
        <Button onClick={carregarDados}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comparativo por Projeto e Base</h1>
          <p className="text-gray-600 mt-1">{data.resumo_executivo.periodo}</p>
        </div>
        <div className="flex gap-3">
          <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportarCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* KPIs Executivos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Registros</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatarNumero(data.resumo_executivo.total_registros)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FaProjectDiagram className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Projetos Ativos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.resumo_executivo.total_projetos}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FaBuilding className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Bases Operacionais</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.resumo_executivo.total_bases}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FaGasPump className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Postos Analisados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.resumo_executivo.postos_analisados}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seletor de Visualização */}
      <div className="flex gap-2">
        <Button 
          variant={visualizacao === 'projeto' ? 'default' : 'outline'} 
          onClick={() => setVisualizacao('projeto')}
        >
          <Target className="w-4 h-4 mr-2" />
          Por Projeto
        </Button>
        <Button 
          variant={visualizacao === 'base' ? 'default' : 'outline'} 
          onClick={() => setVisualizacao('base')}
        >
          <Building2 className="w-4 h-4 mr-2" />
          Por Base
        </Button>
        <Button 
          variant={visualizacao === 'consolidado' ? 'default' : 'outline'} 
          onClick={() => setVisualizacao('consolidado')}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Consolidado
        </Button>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              Top 5 Projetos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.top_performers.projetos.slice(0, 5).map((projeto, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{projeto.projeto}</p>
                    <p className="text-sm text-gray-600">{projeto.posto}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{formatarNumero(projeto.total_litros)}L</p>
                    <div className="flex items-center text-sm text-gray-600">
                      {getTendenciaIcon(projeto.tendencia_projecao, projeto.total_litros)}
                      <span className="ml-1">
                        {formatarNumero(projeto.tendencia_projecao)}L/ano
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-purple-600" />
              Top 5 Bases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.top_performers.bases.slice(0, 5).map((base, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{base.base}</p>
                    <p className="text-sm text-gray-600">{base.posto}</p>
                    <p className="text-xs text-gray-500">
                      {base.projetos_associados.length} projeto(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-600">{formatarNumero(base.total_litros)}L</p>
                    <p className="text-sm text-gray-600">{formatarMoeda(base.total_valor)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Principal */}
      <Card>
        <CardHeader>
          <CardTitle>
            Análise Detalhada - {visualizacao === 'projeto' ? 'Por Projeto' : visualizacao === 'base' ? 'Por Base' : 'Consolidado por Posto'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {visualizacao === 'projeto' && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Posto</TableHead>
                    <TableHead className="text-right">Litros</TableHead>
                    <TableHead className="text-right">Abastecimentos</TableHead>
                    <TableHead className="text-right">Veículos</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">Média Mensal</TableHead>
                    <TableHead className="text-right">Projeção Anual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.analise_por_projeto
                    .sort((a, b) => b.total_litros - a.total_litros)
                    .map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.projeto}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.posto}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatarNumero(item.total_litros)}L
                      </TableCell>
                      <TableCell className="text-right">{item.total_abastecimentos}</TableCell>
                      <TableCell className="text-right">{item.total_veiculos}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatarMoeda(item.total_valor)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatarNumero(item.media_mensal_litros)}L
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          {getTendenciaIcon(item.tendencia_projecao, item.total_litros)}
                          <span className="ml-2 font-mono">
                            {formatarNumero(item.tendencia_projecao)}L
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {visualizacao === 'base' && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Base</TableHead>
                    <TableHead>Posto</TableHead>
                    <TableHead className="text-right">Litros</TableHead>
                    <TableHead className="text-right">Abastecimentos</TableHead>
                    <TableHead className="text-right">Veículos</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead>Projetos Associados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.analise_por_base
                    .sort((a, b) => b.total_litros - a.total_litros)
                    .map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.base}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.posto}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatarNumero(item.total_litros)}L
                      </TableCell>
                      <TableCell className="text-right">{item.total_abastecimentos}</TableCell>
                      <TableCell className="text-right">{item.total_veiculos}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatarMoeda(item.total_valor)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.projetos_associados.slice(0, 3).map((projeto, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {projeto}
                            </Badge>
                          ))}
                          {item.projetos_associados.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{item.projetos_associados.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {visualizacao === 'consolidado' && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Posto</TableHead>
                    <TableHead className="text-right">Total Litros</TableHead>
                    <TableHead className="text-right">Abastecimentos</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead>Maior Projeto</TableHead>
                    <TableHead>Maior Base</TableHead>
                    <TableHead className="text-center">Projetos</TableHead>
                    <TableHead className="text-center">Bases</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.consolidado_por_posto
                    .sort((a, b) => b.total_litros - a.total_litros)
                    .map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        <Badge variant="outline" className="mr-2">{item.posto}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-lg font-bold text-blue-600">
                        {formatarNumero(item.total_litros)}L
                      </TableCell>
                      <TableCell className="text-right">{item.total_abastecimentos}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatarMoeda(item.total_valor)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.maior_projeto.nome}</p>
                          <p className="text-sm text-gray-600">
                            {formatarNumero(item.maior_projeto.litros)}L
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.maior_base.nome}</p>
                          <p className="text-sm text-gray-600">
                            {formatarNumero(item.maior_base.litros)}L
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {item.projetos_unicos.length}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {item.bases_unicas.length}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComparativoProjetoBasePage;