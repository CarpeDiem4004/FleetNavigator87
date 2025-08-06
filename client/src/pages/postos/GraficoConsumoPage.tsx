import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Calendar, TrendingUp, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, Car, Target, Filter } from 'lucide-react';

interface DadosConsumo {
  posto: string;
  postoNome: string;
  ano: number;
  mes: number;
  mesNome: string;
  total_litros: number;
  total_abastecimentos: number;
  total_veiculos?: number;
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
  totalVeiculos?: number;
  cor: string;
}

// Interfaces para o comparativo por projeto e base
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
    total_litros: number;
    total_abastecimentos: number;
    total_valor: number;
    postos_atendidos: string[];
    consumo_medio_mensal: number;
  }>;
  analise_por_base: Array<{
    base: string;
    total_litros: number;
    total_abastecimentos: number;
    total_valor: number;
    postos_utilizados: string[];
    consumo_medio_mensal: number;
  }>;
  top_performers: {
    projetos: Array<{
      projeto: string;
      total_litros: number;
      postos_atendidos: number;
    }>;
    bases: Array<{
      base: string;
      total_litros: number;
      postos_utilizados: number;
    }>;
  };
}

// Interfaces para o comparativo mensal detalhado
interface ComparativoMensalData {
  resumo_executivo: {
    total_registros_mensais: number;
    total_projetos_analisados: number;
    total_bases_analisadas: number;
    postos_disponiveis: number;
    periodo_analise: string;
    meses_com_dados: number;
  };
  projetos_posto_favorito: {
    [projeto: string]: {
      posto_favorito: string;
      consumo_posto_favorito: number;
      total_postos_utilizados: number;
      detalhes_por_posto: {
        [posto: string]: {
          total_litros: number;
          total_valor: number;
          meses_ativo: number;
          abastecimentos: number;
        };
      };
    };
  };
  bases_posto_favorito: {
    [base: string]: {
      posto_favorito: string;
      consumo_posto_favorito: number;
      total_postos_utilizados: number;
      detalhes_por_posto: {
        [posto: string]: {
          total_litros: number;
          total_valor: number;
          meses_ativo: number;
          abastecimentos: number;
        };
      };
    };
  };
  consolidado_mensal: Array<{
    mes: number;
    mes_nome: string;
    ano: number;
    total_litros: number;
    total_valor: number;
    total_abastecimentos: number;
    total_projetos: number;
    total_bases: number;
    total_postos: number;
  }>;
}

export default function GraficoConsumoPage() {
  const [dadosConsumo, setDadosConsumo] = useState<DadosConsumo[]>([]);
  const [dadosGrafico, setDadosGrafico] = useState<DadosGrafico[]>([]);
  const [resumoPostos, setResumoPostos] = useState<PostoResumo[]>([]);
  const [selectedYear, setSelectedYear] = useState('2025');
  const [tipoGrafico, setTipoGrafico] = useState<'barras' | 'linha' | 'pizza'>('barras');
  const [metrica, setMetrica] = useState<'litros' | 'valor' | 'veiculos'>('litros');
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para o comparativo por projeto e base
  const [comparativoData, setComparativoData] = useState<ComparativoData | null>(null);
  const [isLoadingComparativo, setIsLoadingComparativo] = useState(false);
  const [activeTab, setActiveTab] = useState('graficos');
  
  // Estados para o comparativo mensal detalhado
  const [comparativoMensalData, setComparativoMensalData] = useState<ComparativoMensalData | null>(null);
  const [isLoadingComparativoMensal, setIsLoadingComparativoMensal] = useState(false);
  
  // Estados para drill-down de projetos
  const [selectedProjeto, setSelectedProjeto] = useState<string | null>(null);
  const [showBasesRanking, setShowBasesRanking] = useState(false);

  const postos = [
    { id: 'campinas_v2', nome: 'CAMPINAS' },
    { id: 'osasco_v2', nome: 'OSASCO' },
    { id: 'abc_v2', nome: 'ABC' },
    { id: 'sorocaba_v2', nome: 'SOROCABA' },
    { id: 'socorro_v2', nome: 'SOCORRO' },
    { id: 'alair_v2', nome: 'ALAIR' }
  ];

  const cores = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'
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
            total_veiculos: parseInt(item.veiculos_unicos || 0),
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
        if (metrica === 'litros') {
          dadosMes[posto.nome] = dadoPosto?.total_litros || 0;
        } else if (metrica === 'valor') {
          dadosMes[posto.nome] = dadoPosto?.total_valor || 0;
        } else if (metrica === 'veiculos') {
          dadosMes[posto.nome] = dadoPosto?.total_veiculos || 0;
        }
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

      const totalVeiculos = dados
        .filter(d => d.posto === posto.id)
        .reduce((acc, curr) => acc + (curr.total_veiculos || 0), 0);

      return {
        nome: posto.nome,
        totalLitros,
        totalValor,
        totalAbastecimentos,
        totalVeiculos,
        cor: cores[index % cores.length]
      };
    }).filter(posto => posto.totalLitros > 0);

    setResumoPostos(resumo);
  };

  // Função para buscar dados do comparativo por projeto e base
  const fetchComparativo = async () => {
    try {
      setIsLoadingComparativo(true);
      console.log('[COMPARATIVO] Buscando dados comparativo por projeto e base');

      const response = await fetch(`/api/abastecimentos/comparativo-projeto-base?ano=${selectedYear}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          setComparativoData(data.data);
          console.log('[COMPARATIVO] Dados carregados:', data.data.resumo_executivo);
        } else {
          console.error('[COMPARATIVO] Erro na resposta:', data.message);
        }
      }
    } catch (error) {
      console.error('[COMPARATIVO] Erro ao buscar dados:', error);
    } finally {
      setIsLoadingComparativo(false);
    }
  };

  // Função para buscar dados do comparativo mensal detalhado
  const fetchComparativoMensal = async () => {
    try {
      setIsLoadingComparativoMensal(true);
      console.log('[COMPARATIVO-MENSAL] Buscando análise mensal detalhada');

      const response = await fetch(`/api/abastecimentos/comparativo-mensal-detalhado?ano=${selectedYear}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          setComparativoMensalData(data.data);
          console.log('[COMPARATIVO-MENSAL] Dados carregados:', data.data.resumo_executivo);
        } else {
          console.error('[COMPARATIVO-MENSAL] Erro na resposta:', data.message);
        }
      }
    } catch (error) {
      console.error('[COMPARATIVO-MENSAL] Erro ao buscar dados:', error);
    } finally {
      setIsLoadingComparativoMensal(false);
    }
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

  const exportarComparativo = () => {
    if (!comparativoData) return;

    const dadosExport = [
      ...comparativoData.analise_por_projeto.map(p => ({
        Tipo: 'PROJETO',
        Nome: p.projeto,
        'Total Litros': p.total_litros,
        'Total Abastecimentos': p.total_abastecimentos,
        'Total Valor (R$)': p.total_valor.toFixed(2),
        'Consumo Médio Mensal': p.consumo_medio_mensal.toFixed(1),
        'Postos/Bases': p.postos_atendidos.join('; ')
      })),
      ...comparativoData.analise_por_base.map(b => ({
        Tipo: 'BASE',
        Nome: b.base,
        'Total Litros': b.total_litros,
        'Total Abastecimentos': b.total_abastecimentos,
        'Total Valor (R$)': b.total_valor.toFixed(2),
        'Consumo Médio Mensal': b.consumo_medio_mensal.toFixed(1),
        'Postos/Bases': b.postos_utilizados.join('; ')
      }))
    ];

    const csv = [
      Object.keys(dadosExport[0]).join(','),
      ...dadosExport.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `comparativo-projeto-base-${selectedYear}.csv`;
    link.click();
  };

  const exportarMensal = () => {
    if (!comparativoMensalData) return;

    // Exportar dados de postos favoritos dos projetos
    const projetosData = Object.entries(comparativoMensalData.projetos_posto_favorito).map(([projeto, data]) => ({
      Tipo: 'PROJETO',
      Nome: projeto,
      'Posto Favorito': data.posto_favorito,
      'Consumo Posto Favorito (L)': data.consumo_posto_favorito.toFixed(1),
      'Total Postos Utilizados': data.total_postos_utilizados,
      'Outros Postos': Object.keys(data.detalhes_por_posto).filter(p => p !== data.posto_favorito).join('; ')
    }));

    // Exportar dados de postos favoritos das bases
    const basesData = Object.entries(comparativoMensalData.bases_posto_favorito).map(([base, data]) => ({
      Tipo: 'BASE',
      Nome: base,
      'Posto Favorito': data.posto_favorito,
      'Consumo Posto Favorito (L)': data.consumo_posto_favorito.toFixed(1),
      'Total Postos Utilizados': data.total_postos_utilizados,
      'Outros Postos': Object.keys(data.detalhes_por_posto).filter(p => p !== data.posto_favorito).join('; ')
    }));

    // Exportar consolidado mensal
    const mensalData = comparativoMensalData.consolidado_mensal.map(m => ({
      Tipo: 'MENSAL',
      Nome: `${m.mes_nome}/${m.ano}`,
      'Posto Favorito': '-',
      'Consumo Posto Favorito (L)': m.total_litros.toFixed(1),
      'Total Postos Utilizados': m.total_postos,
      'Outros Postos': `${m.total_projetos} projetos, ${m.total_bases} bases, ${m.total_abastecimentos} abastecimentos`
    }));

    const dadosExport = [...projetosData, ...basesData, ...mensalData];

    const csv = [
      Object.keys(dadosExport[0]).join(','),
      ...dadosExport.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analise-mensal-postos-favoritos-${selectedYear}.csv`;
    link.click();
  };

  // Função para processar dados de projetos por mês
  const getProjetosPorMes = () => {
    if (!comparativoMensalData) return [];
    
    const projetosPorMes: Record<string, any> = {};
    
    comparativoMensalData.consolidado_mensal.forEach(mes => {
      const chave = mes.mes_nome;
      projetosPorMes[chave] = {
        mes: chave,
        total_projetos: mes.total_projetos,
        total_litros: mes.total_litros,
        total_valor: mes.total_valor,
        total_abastecimentos: mes.total_abastecimentos
      };
    });
    
    return Object.values(projetosPorMes);
  };

  // Função para obter ranking das bases por projeto
  const getBasesRankingPorProjeto = (projeto: string) => {
    if (!comparativoMensalData) return [];
    
    // Buscar dados do projeto selecionado
    const projetoData = comparativoMensalData.projetos_posto_favorito[projeto];
    if (!projetoData) return [];
    
    // Processar detalhes por posto para criar ranking das bases
    const basesRanking: Array<{
      posto: string;
      total_litros: number;
      total_valor: number;
      meses_ativo: number;
      abastecimentos: number;
      percentual: string;
    }> = [];
    
    Object.entries(projetoData.detalhes_por_posto).forEach(([posto, dados]) => {
      basesRanking.push({
        posto: posto,
        total_litros: dados.total_litros,
        total_valor: dados.total_valor,
        meses_ativo: dados.meses_ativo,
        abastecimentos: dados.abastecimentos,
        percentual: ((dados.total_litros / projetoData.consumo_posto_favorito) * 100).toFixed(1)
      });
    });
    
    return basesRanking.sort((a, b) => b.total_litros - a.total_litros);
  };

  // Função para lidar com clique no projeto
  const handleProjetoClick = (projeto: string) => {
    setSelectedProjeto(projeto);
    setShowBasesRanking(true);
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
              <Tooltip formatter={(value: number) => {
                const suffix = metrica === 'litros' ? ' L' : metrica === 'valor' ? '' : ' veículos';
                const formattedValue = metrica === 'valor' 
                  ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : value.toLocaleString('pt-BR') + suffix;
                return [formattedValue, ''];
              }} />
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
              <Tooltip formatter={(value: number) => {
                const suffix = metrica === 'litros' ? ' L' : metrica === 'valor' ? '' : ' veículos';
                const formattedValue = metrica === 'valor' 
                  ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : value.toLocaleString('pt-BR') + suffix;
                return [formattedValue, ''];
              }} />
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
                dataKey={metrica === 'litros' ? 'totalLitros' : metrica === 'valor' ? 'totalValor' : 'totalVeiculos'}
              >
                {resumoPostos.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => {
                const suffix = metrica === 'litros' ? ' L' : metrica === 'valor' ? '' : ' veículos';
                const formattedValue = metrica === 'valor' 
                  ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : value.toLocaleString('pt-BR') + suffix;
                return [formattedValue, 'Total'];
              }} />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  useEffect(() => {
    fetchDadosConsumo();
    if (activeTab === 'comparativo') {
      fetchComparativo();
    }
    if (activeTab === 'mensal') {
      fetchComparativoMensal();
    }
  }, [selectedYear, activeTab]);

  useEffect(() => {
    if (dadosConsumo.length > 0) {
      processarDadosGrafico(dadosConsumo);
    }
  }, [metrica]);

  const totalGeral = resumoPostos.reduce((acc, posto) => acc + posto.totalLitros, 0);
  const totalValorGeral = resumoPostos.reduce((acc, posto) => acc + posto.totalValor, 0);
  const totalAbastecimentosGeral = resumoPostos.reduce((acc, posto) => acc + posto.totalAbastecimentos, 0);
  const totalVeiculosGeral = resumoPostos.reduce((acc, posto) => acc + (posto.totalVeiculos || 0), 0);

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
          <h1 className="text-3xl font-bold text-gray-900">Análise de Consumo por Posto</h1>
          <p className="text-gray-600">Análise visual e comparativa do consumo de combustível</p>
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

          {activeTab === 'graficos' && (
            <>
              <Select value={metrica} onValueChange={(value: 'litros' | 'valor' | 'veiculos') => setMetrica(value)}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Métrica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="litros">Litros</SelectItem>
                  <SelectItem value="valor">Valor (R$)</SelectItem>
                  <SelectItem value="veiculos">Veículos</SelectItem>
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
            </>
          )}
          
          {activeTab === 'comparativo' && (
            <Button onClick={exportarComparativo} variant="outline" disabled={!comparativoData}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Comparativo
            </Button>
          )}
          
          {activeTab === 'mensal' && (
            <Button onClick={exportarMensal} variant="outline" disabled={!comparativoMensalData}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Análise Mensal
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="graficos" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Gráficos por Posto
          </TabsTrigger>
          <TabsTrigger value="comparativo" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Comparativo Projeto & Base
          </TabsTrigger>
          <TabsTrigger value="mensal" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Análise Mensal
          </TabsTrigger>
        </TabsList>

        {/* Tab Content - Gráficos por Posto */}
        <TabsContent value="graficos" className="space-y-6">
          {/* Resumo Geral */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <Car className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-orange-600 uppercase">Total Veículos</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {totalVeiculosGeral.toLocaleString('pt-BR')}
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
                {metrica === 'litros' ? 'Consumo de Combustível' : metrica === 'valor' ? 'Valor Gasto' : 'Veículos Abastecidos'} por Posto - {selectedYear}
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
        </TabsContent>

        {/* Tab Content - Comparativo por Projeto e Base */}
        <TabsContent value="comparativo" className="space-y-6">
          {isLoadingComparativo ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Carregando dados comparativos...</p>
              </div>
            </div>
          ) : comparativoData ? (
            <>
              {/* Resumo Executivo */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-indigo-50 border-indigo-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-indigo-500 rounded-lg">
                        <Target className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-indigo-600 uppercase">Total Registros</p>
                        <p className="text-2xl font-bold text-indigo-900">
                          {comparativoData.resumo_executivo.total_registros.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-cyan-50 border-cyan-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-cyan-500 rounded-lg">
                        <Filter className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-cyan-600 uppercase">Total Projetos</p>
                        <p className="text-2xl font-bold text-cyan-900">
                          {comparativoData.resumo_executivo.total_projetos}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-emerald-50 border-emerald-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-500 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-emerald-600 uppercase">Total Bases</p>
                        <p className="text-2xl font-bold text-emerald-900">
                          {comparativoData.resumo_executivo.total_bases}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-amber-500 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-amber-600 uppercase">Postos Analisados</p>
                        <p className="text-2xl font-bold text-amber-900">
                          {comparativoData.resumo_executivo.postos_analisados}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top 5 Projetos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Top 5 Projetos por Consumo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {comparativoData.top_performers.projetos.slice(0, 5).map((projeto, index) => (
                      <div key={projeto.projeto} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium">{projeto.projeto}</p>
                            <p className="text-sm text-gray-600">{projeto.postos_atendidos} postos atendidos</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{projeto.total_litros.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}L</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top 5 Bases */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Top 5 Bases por Consumo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {comparativoData.top_performers.bases.slice(0, 5).map((base, index) => (
                      <div key={base.base} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium">{base.base}</p>
                            <p className="text-sm text-gray-600">{base.postos_utilizados} postos utilizados</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{base.total_litros.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}L</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">Nenhum dado comparativo disponível para este período</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Content - Análise Mensal */}
        <TabsContent value="mensal" className="space-y-6">
          {isLoadingComparativoMensal ? (
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Carregando análise mensal detalhada...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : comparativoMensalData ? (
            <>
              {/* Resumo Executivo da Análise Mensal */}
              <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Resumo da Análise Mensal Detalhada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-white/70 rounded-lg">
                      <p className="text-sm text-gray-600">Registros Mensais</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {comparativoMensalData.resumo_executivo.total_registros_mensais}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-white/70 rounded-lg">
                      <p className="text-sm text-gray-600">Projetos Analisados</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {comparativoMensalData.resumo_executivo.total_projetos_analisados}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-white/70 rounded-lg">
                      <p className="text-sm text-gray-600">Bases Analisadas</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {comparativoMensalData.resumo_executivo.total_bases_analisadas}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-white/70 rounded-lg">
                      <p className="text-sm text-gray-600">Meses com Dados</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {comparativoMensalData.resumo_executivo.meses_com_dados}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Projetos e Postos Favoritos */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Projetos - Posto Favorito de Cada Um
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {Object.entries(comparativoMensalData.projetos_posto_favorito).map(([projeto, data]) => (
                        <div key={projeto} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-lg">{projeto}</h4>
                            <Badge variant="secondary">{data.total_postos_utilizados} postos</Badge>
                          </div>
                          <div className="bg-green-50 p-3 rounded-md border border-green-200">
                            <p className="text-sm text-green-700 font-medium">🏆 Posto Favorito:</p>
                            <p className="font-bold text-green-800">{data.posto_favorito}</p>
                            <p className="text-sm text-green-600">
                              {data.consumo_posto_favorito.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}L consumidos
                            </p>
                          </div>
                          {data.total_postos_utilizados > 1 && (
                            <div className="mt-2 text-xs text-gray-500">
                              + {data.total_postos_utilizados - 1} outros postos utilizados
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Bases - Posto Favorito de Cada Uma
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {Object.entries(comparativoMensalData.bases_posto_favorito).map(([base, data]) => (
                        <div key={base} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-lg">{base}</h4>
                            <Badge variant="secondary">{data.total_postos_utilizados} postos</Badge>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                            <p className="text-sm text-blue-700 font-medium">🏆 Posto Favorito:</p>
                            <p className="font-bold text-blue-800">{data.posto_favorito}</p>
                            <p className="text-sm text-blue-600">
                              {data.consumo_posto_favorito.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}L consumidos
                            </p>
                          </div>
                          {data.total_postos_utilizados > 1 && (
                            <div className="mt-2 text-xs text-gray-500">
                              + {data.total_postos_utilizados - 1} outros postos utilizados
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico de Projetos por Mês - Interativo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Projetos Ativos por Mês - {selectedYear}
                    <Badge variant="outline" className="ml-2">Clique para ver bases</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={getProjetosPorMes()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip formatter={(value: number, name: string) => {
                        if (name === 'total_litros') {
                          return [`${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}L`, 'Total Litros'];
                        }
                        if (name === 'total_valor') {
                          return [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Total Valor'];
                        }
                        return [value.toLocaleString('pt-BR'), name];
                      }} />
                      <Legend />
                      <Bar dataKey="total_projetos" fill="#8884d8" name="Projetos Ativos" />
                      <Bar dataKey="total_litros" fill="#82ca9d" name="Total Litros" />
                      <Bar dataKey="total_abastecimentos" fill="#ffc658" name="Abastecimentos" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Gráfico Interativo de Projetos Clicáveis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Ranking dos Projetos - Clique para Ver Bases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(comparativoMensalData.projetos_posto_favorito)
                      .sort(([,a], [,b]) => b.consumo_posto_favorito - a.consumo_posto_favorito)
                      .slice(0, 12)
                      .map(([projeto, data]) => (
                      <div 
                        key={projeto} 
                        className="p-4 border rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                        onClick={() => handleProjetoClick(projeto)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-sm">{projeto}</h4>
                          <Badge variant="outline" className="text-xs">{data.total_postos_utilizados} postos</Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-600">Posto Favorito:</p>
                          <p className="font-bold text-blue-800 text-sm">{data.posto_favorito}</p>
                          <p className="text-xs text-gray-500">
                            {data.consumo_posto_favorito.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}L
                          </p>
                        </div>
                        <div className="mt-2 text-right">
                          <span className="text-xs text-blue-600 hover:text-blue-800">📊 Ver Ranking →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Modal/Dialog para Ranking das Bases */}
              {showBasesRanking && selectedProjeto && (
                <Card className="border-2 border-blue-200 bg-blue-50">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Ranking das Bases - {selectedProjeto}
                      </CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowBasesRanking(false)}
                      >
                        ✕ Fechar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getBasesRankingPorProjeto(selectedProjeto).map((base, index) => (
                        <div key={base.posto} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                              {index + 1}
                            </Badge>
                            <div>
                              <p className="font-medium">{base.posto}</p>
                              <p className="text-sm text-gray-600">
                                {base.abastecimentos} abastecimentos em {base.meses_ativo} meses
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{base.total_litros.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}L</p>
                            <p className="text-sm text-gray-500">{base.percentual}% do projeto</p>
                            <p className="text-xs text-gray-400">
                              R$ {base.total_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Consolidado Mensal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Evolução Mensal do Consumo - {selectedYear}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={comparativoMensalData.consolidado_mensal} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes_nome" />
                      <YAxis />
                      <Tooltip formatter={(value: number, name: string) => {
                        if (name === 'total_litros') {
                          return [`${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}L`, 'Total Litros'];
                        }
                        if (name === 'total_valor') {
                          return [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Total Valor'];
                        }
                        return [value.toLocaleString('pt-BR'), name];
                      }} />
                      <Legend />
                      <Bar dataKey="total_litros" fill="#8884d8" name="Litros" />
                      <Bar dataKey="total_abastecimentos" fill="#82ca9d" name="Abastecimentos" />
                      <Bar dataKey="total_projetos" fill="#ffc658" name="Projetos Ativos" />
                      <Bar dataKey="total_bases" fill="#ff7c7c" name="Bases Ativas" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">Nenhum dado de análise mensal disponível para este período</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}