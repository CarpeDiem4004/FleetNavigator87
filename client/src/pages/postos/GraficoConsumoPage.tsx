import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Calendar, TrendingUp, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon } from 'lucide-react';

interface DadosConsumo {
  posto: string;
  postoNome: string;
  ano: number;
  mes: number;
  mesNome: string;
  total_litros: number;
  total_abastecimentos: number;
  total_valor: number;
}

interface DadosGrafico {
  mes: string;
  [key: string]: number | string;
}

interface PostoResumo {
  nome: string;
  totalLitros: number;
  totalValor: number;
  totalAbastecimentos: number;
  cor: string;
}

export default function GraficoConsumoPage() {
  const [dadosConsumo, setDadosConsumo] = useState<DadosConsumo[]>([]);
  const [dadosGrafico, setDadosGrafico] = useState<DadosGrafico[]>([]);
  const [resumoPostos, setResumoPostos] = useState<PostoResumo[]>([]);
  const [selectedYear, setSelectedYear] = useState('2025');
  const [tipoGrafico, setTipoGrafico] = useState<'barras' | 'linha' | 'pizza'>('barras');
  const [isLoading, setIsLoading] = useState(false);

  const postos = [
    { id: 'campinas_v2', nome: 'CAMPINAS' },
    { id: 'osasco_v2', nome: 'OSASCO' },
    { id: 'abc_v2', nome: 'ABC' },
    { id: 'sorocaba_v2', nome: 'SOROCABA' },
    { id: 'guarulhos_v2', nome: 'GUARULHOS' },
    { id: 'socorro_v2', nome: 'SOCORRO' },
    { id: 'alair_v2', nome: 'ALAIR' }
  ];

  const cores = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb347'
  ];

  const mesesNomes = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  const fetchDadosConsumo = async () => {
    try {
      setIsLoading(true);
      console.log('[GRAFICO-CONSUMO] Buscando dados de consumo por posto');

      const todosDados: DadosConsumo[] = [];

      // Buscar dados consolidados de todos os postos da nova API
      const response = await fetch(`/api/abastecimentos/dados-mensais?ano=${selectedYear}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          const { registros_individuais } = data.data;
          
          // Mapear dados para o formato esperado
          const dadosFormatados = registros_individuais.map((item: any) => ({
            posto: item.posto_original,
            postoNome: item.posto,
            ano: item.ano,
            mes: item.mes,
            mesNome: item.mes_nome,
            total_litros: parseFloat(item.total_litros || 0),
            total_abastecimentos: parseInt(item.total_abastecimentos || 0),
            total_valor: parseFloat(item.total_valor || 0)
          }));
          
          todosDados.push(...dadosFormatados);
          console.log(`[GRAFICO-CONSUMO] Dados consolidados carregados: ${dadosFormatados.length} registros mensais`);
        }
      }

      setDadosConsumo(todosDados);
      processarDadosGrafico(todosDados);
      
      console.log(`[GRAFICO-CONSUMO] Total de ${todosDados.length} registros carregados`);
    } catch (error) {
      console.error('[GRAFICO-CONSUMO] Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processarDadosGrafico = (dados: DadosConsumo[]) => {
    // Criar estrutura para gráfico de barras/linha
    const mesesComDados = Array.from(new Set(dados.map(d => d.mes))).sort();
    const dadosProcessados: DadosGrafico[] = [];

    mesesComDados.forEach(mes => {
      const dadosMes: DadosGrafico = { mes: mesesNomes[mes - 1] };
      
      postos.forEach(posto => {
        const dadoPosto = dados.find(d => d.mes === mes && d.posto === posto.id);
        dadosMes[posto.nome] = dadoPosto?.total_litros || 0;
      });

      dadosProcessados.push(dadosMes);
    });

    setDadosGrafico(dadosProcessados);

    // Criar resumo para gráfico de pizza
    const resumo: PostoResumo[] = postos.map((posto, index) => {
      const totalLitros = dados
        .filter(d => d.posto === posto.id)
        .reduce((acc, curr) => acc + curr.total_litros, 0);
      
      const totalValor = dados
        .filter(d => d.posto === posto.id)
        .reduce((acc, curr) => acc + curr.total_valor, 0);
      
      const totalAbastecimentos = dados
        .filter(d => d.posto === posto.id)
        .reduce((acc, curr) => acc + curr.total_abastecimentos, 0);

      return {
        nome: posto.nome,
        totalLitros,
        totalValor,
        totalAbastecimentos,
        cor: cores[index % cores.length]
      };
    }).filter(posto => posto.totalLitros > 0);

    setResumoPostos(resumo);
  };

  const exportarDados = () => {
    const dadosExport = dadosConsumo.map(d => ({
      Posto: d.postoNome,
      Ano: d.ano,
      Mes: d.mesNome,
      'Total Litros': d.total_litros,
      'Total Abastecimentos': d.total_abastecimentos,
      'Total Valor (R$)': d.total_valor.toFixed(2)
    }));

    const csv = [
      Object.keys(dadosExport[0]).join(','),
      ...dadosExport.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `consumo-postos-${selectedYear}.csv`;
    link.click();
  };

  const renderGrafico = () => {
    if (dadosGrafico.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Nenhum dado disponível para exibição</p>
        </div>
      );
    }

    switch (tipoGrafico) {
      case 'barras':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dadosGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value: number) => [value.toLocaleString('pt-BR') + ' L', '']} />
              <Legend />
              {postos.map((posto, index) => (
                <Bar 
                  key={posto.id} 
                  dataKey={posto.nome} 
                  fill={cores[index % cores.length]}
                  name={posto.nome}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'linha':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={dadosGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value: number) => [value.toLocaleString('pt-BR') + ' L', '']} />
              <Legend />
              {postos.map((posto, index) => (
                <Line 
                  key={posto.id} 
                  type="monotone" 
                  dataKey={posto.nome} 
                  stroke={cores[index % cores.length]}
                  strokeWidth={3}
                  name={posto.nome}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pizza':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={resumoPostos}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ nome, totalLitros, percent }) => 
                  `${nome}: ${(percent * 100).toFixed(1)}%`
                }
                outerRadius={120}
                fill="#8884d8"
                dataKey="totalLitros"
              >
                {resumoPostos.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [value.toLocaleString('pt-BR') + ' L', 'Total']} />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  useEffect(() => {
    fetchDadosConsumo();
  }, [selectedYear]);

  const totalGeral = resumoPostos.reduce((acc, posto) => acc + posto.totalLitros, 0);
  const totalValorGeral = resumoPostos.reduce((acc, posto) => acc + posto.totalValor, 0);
  const totalAbastecimentosGeral = resumoPostos.reduce((acc, posto) => acc + posto.totalAbastecimentos, 0);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Carregando dados de consumo...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gráfico de Consumo por Posto</h1>
          <p className="text-gray-600">Análise visual do consumo de combustível por posto</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Calendar className="w-3 h-3 mr-1" />
              Período: Maio a Dezembro {selectedYear}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tipoGrafico} onValueChange={(value: 'barras' | 'linha' | 'pizza') => setTipoGrafico(value)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Tipo de Gráfico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="barras">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Barras
                </div>
              </SelectItem>
              <SelectItem value="linha">
                <div className="flex items-center gap-2">
                  <LineChartIcon className="w-4 h-4" />
                  Linha
                </div>
              </SelectItem>
              <SelectItem value="pizza">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4" />
                  Pizza
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={exportarDados} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase">Total Litros</p>
                <p className="text-2xl font-bold text-blue-900">
                  {totalGeral.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-green-600 uppercase">Total Abastecimentos</p>
                <p className="text-2xl font-bold text-green-900">
                  {totalAbastecimentosGeral.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-purple-600 uppercase">Valor Total</p>
                <p className="text-2xl font-bold text-purple-900">
                  R$ {totalValorGeral.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {tipoGrafico === 'barras' && <BarChart3 className="h-5 w-5" />}
            {tipoGrafico === 'linha' && <LineChartIcon className="h-5 w-5" />}
            {tipoGrafico === 'pizza' && <PieChartIcon className="h-5 w-5" />}
            Consumo de Combustível por Posto - {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderGrafico()}
        </CardContent>
      </Card>

      {/* Tabela de Resumo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo por Posto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Posto</th>
                  <th className="text-right p-3">Total Litros</th>
                  <th className="text-right p-3">Abastecimentos</th>
                  <th className="text-right p-3">Valor Total (R$)</th>
                  <th className="text-right p-3">Preço Médio (R$/L)</th>
                </tr>
              </thead>
              <tbody>
                {resumoPostos.map((posto) => (
                  <tr key={posto.nome} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: posto.cor }}
                        ></div>
                        {posto.nome}
                      </div>
                    </td>
                    <td className="text-right p-3">
                      {posto.totalLitros.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                    </td>
                    <td className="text-right p-3">
                      {posto.totalAbastecimentos.toLocaleString('pt-BR')}
                    </td>
                    <td className="text-right p-3">
                      {posto.totalValor.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      })}
                    </td>
                    <td className="text-right p-3">
                      R$ {posto.totalLitros > 0 ? (posto.totalValor / posto.totalLitros).toFixed(2) : '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}