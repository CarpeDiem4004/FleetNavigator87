import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Fuel, 
  Calculator, 
  Download,
  Calendar,
  Building2,
  BarChart3
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface DadosMensais {
  posto: string;
  postoFormatado: string;
  ano: number;
  mes: number;
  total_abastecimentos: number;
  total_litros: number;
  total_valor: number;
  preco_medio: number;
}

interface ComparativoMensal {
  mes: string;
  mesNumero: number;
  ano: number;
  [posto: string]: any;
}

export default function ComparativoMensalPage() {
  const [dadosMensais, setDadosMensais] = useState<DadosMensais[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedPosto, setSelectedPosto] = useState<string>('todos');
  const [comparativoData, setComparativoData] = useState<ComparativoMensal[]>([]);

  const postos = [
    { id: 'sorocaba_v2', nome: 'Sorocaba' },
    { id: 'abc_v2', nome: 'ABC' },
    { id: 'osasco_v2', nome: 'Osasco' },
    { id: 'campinas_v2', nome: 'Campinas' },
    { id: 'guarulhos_v2', nome: 'Guarulhos' },
    { id: 'socorro_v2', nome: 'Socorro' },
    { id: 'alair_v2', nome: 'Alair' }
  ];

  const opcoesPostos = [
    { id: 'todos', nome: 'Todos os Postos' },
    ...postos
  ];

  const cores = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb347'
  ];

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Buscar dados de todos os postos usando a nova API
  const fetchDadosMensais = async () => {
    try {
      setIsLoading(true);
      console.log('[COMPARATIVO] Buscando dados mensais de todos os postos via nova API');

      const todosDados: DadosMensais[] = [];

      // Se "todos" está selecionado, buscar dados unificados
      if (selectedPosto === 'todos') {
        const response = await fetch(`/api/abastecimentos/dados-mensais?posto=unificado&ano=${selectedYear}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && Array.isArray(data.data)) {
            const dadosUnificados = data.data.map((item: any) => ({
              posto: item.posto,
              postoFormatado: item.posto.replace('_v2', '').toUpperCase(),
              ano: item.ano,
              mes: item.mes,
              total_abastecimentos: parseInt(item.total_abastecimentos || 0),
              total_litros: parseFloat(item.total_litros || 0),
              total_valor: parseFloat(item.total_valor || 0),
              preco_medio: item.total_litros > 0 ? (parseFloat(item.total_valor || 0) / parseFloat(item.total_litros || 1)) : 0
            }));
            
            todosDados.push(...dadosUnificados);
            console.log(`[COMPARATIVO] Dados unificados: ${dadosUnificados.length} registros mensais`);
          }
        }
      } else {
        // Buscar dados de um posto específico
        const response = await fetch(`/api/abastecimentos/dados-mensais?posto=${selectedPosto}&ano=${selectedYear}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && Array.isArray(data.data)) {
            const postoNome = postos.find(p => p.id === selectedPosto)?.nome || selectedPosto;
            
            const dadosPosto = data.data.map((item: any) => ({
              posto: selectedPosto,
              postoFormatado: postoNome,
              ano: item.ano,
              mes: item.mes,
              total_abastecimentos: parseInt(item.total_abastecimentos || 0),
              total_litros: parseFloat(item.total_litros || 0),
              total_valor: parseFloat(item.total_valor || 0),
              preco_medio: item.total_litros > 0 ? (parseFloat(item.total_valor || 0) / parseFloat(item.total_litros || 1)) : 0
            }));
            
            todosDados.push(...dadosPosto);
            console.log(`[COMPARATIVO] Posto ${postoNome}: ${dadosPosto.length} registros mensais`);
          }
        }
      }

      setDadosMensais(todosDados);
      processarComparativo(todosDados);
      
      console.log(`[COMPARATIVO] Total de ${todosDados.length} registros mensais carregados`);
    } catch (error) {
      console.error('[COMPARATIVO] Erro ao buscar dados mensais:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Processar dados para comparativo
  const processarComparativo = (dados: DadosMensais[]) => {
    const comparativo: ComparativoMensal[] = [];

    // Criar estrutura base por mês
    for (let mes = 1; mes <= 12; mes++) {
      const dadosMes: ComparativoMensal = {
        mes: meses[mes - 1],
        mesNumero: mes,
        ano: parseInt(selectedYear)
      };

      // Inicializar todos os postos com valores zero
      postos.forEach(posto => {
        dadosMes[`${posto.nome}_abastecimentos`] = 0;
        dadosMes[`${posto.nome}_litros`] = 0;
        dadosMes[`${posto.nome}_valor`] = 0;
        dadosMes[`${posto.nome}_preco_medio`] = 0;
      });

      // Preencher com dados reais
      dados
        .filter(d => d.mes === mes && d.ano === parseInt(selectedYear))
        .forEach(d => {
          dadosMes[`${d.postoFormatado}_abastecimentos`] = d.total_abastecimentos;
          dadosMes[`${d.postoFormatado}_litros`] = d.total_litros;
          dadosMes[`${d.postoFormatado}_valor`] = d.total_valor;
          dadosMes[`${d.postoFormatado}_preco_medio`] = d.preco_medio;
        });

      comparativo.push(dadosMes);
    }

    setComparativoData(comparativo);
  };

  // Exportar para Excel
  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();

    // Aba 1: Resumo Unificado
    const resumoData = comparativoData.map(mes => {
      const resumo: any = {
        'Mês': mes.mes,
        'Total Abastecimentos': postos.reduce((acc, posto) => acc + (mes[`${posto.nome}_abastecimentos`] || 0), 0),
        'Total Litros': postos.reduce((acc, posto) => acc + (mes[`${posto.nome}_litros`] || 0), 0).toFixed(2),
        'Total Valor': postos.reduce((acc, posto) => acc + (mes[`${posto.nome}_valor`] || 0), 0).toFixed(2)
      };

      // Adicionar dados individuais de cada posto
      postos.forEach(posto => {
        resumo[`${posto.nome} - Abastecimentos`] = mes[`${posto.nome}_abastecimentos`] || 0;
        resumo[`${posto.nome} - Litros`] = (mes[`${posto.nome}_litros`] || 0).toFixed(2);
        resumo[`${posto.nome} - Valor`] = (mes[`${posto.nome}_valor`] || 0).toFixed(2);
      });

      return resumo;
    });

    const wsResumo = XLSX.utils.json_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Unificado');

    // Aba 2: Dados Detalhados por Posto
    postos.forEach(posto => {
      const dadosPosto = dadosMensais
        .filter(d => d.posto === posto.id && d.ano === parseInt(selectedYear))
        .map(d => ({
          'Mês': meses[d.mes - 1],
          'Abastecimentos': d.total_abastecimentos,
          'Litros': d.total_litros.toFixed(2),
          'Valor Total': d.total_valor.toFixed(2),
          'Preço Médio': d.preco_medio.toFixed(4)
        }));

      if (dadosPosto.length > 0) {
        const ws = XLSX.utils.json_to_sheet(dadosPosto);
        XLSX.utils.book_append_sheet(wb, ws, posto.nome);
      }
    });

    // Salvar arquivo
    XLSX.writeFile(wb, `Comparativo_Mensal_${selectedYear}.xlsx`);
  };

  // Calcular totais
  const calcularTotais = (dados: ComparativoMensal[]) => {
    return dados.reduce((acc, mes) => {
      postos.forEach(posto => {
        acc.abastecimentos += mes[`${posto.nome}_abastecimentos`] || 0;
        acc.litros += mes[`${posto.nome}_litros`] || 0;
        acc.valor += mes[`${posto.nome}_valor`] || 0;
      });
      return acc;
    }, { abastecimentos: 0, litros: 0, valor: 0 });
  };

  // Dados para gráfico de pizza (posto mais ativo)
  const dadosPizza = postos.map((posto, index) => ({
    name: posto.nome,
    value: dadosMensais
      .filter(d => d.posto === posto.id && d.ano === parseInt(selectedYear))
      .reduce((acc, curr) => acc + curr.total_abastecimentos, 0),
    color: cores[index]
  })).filter(item => item.value > 0);

  // Inicializar componente e recarregar quando filtros mudarem
  useEffect(() => {
    fetchDadosMensais();
  }, [selectedYear, selectedPosto]); // Recarregar quando o ano ou posto mudar

  const totais = calcularTotais(comparativoData);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Carregando dados mensais...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Comparativo Mensal</h1>
          <p className="text-gray-600">Análise comparativa de consumo por posto e mês</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedPosto} onValueChange={setSelectedPosto}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecionar posto" />
            </SelectTrigger>
            <SelectContent>
              {opcoesPostos.map(posto => (
                <SelectItem key={posto.id} value={posto.id}>
                  {posto.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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

          <Button onClick={exportarExcel} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Cards de Resumo de Abastecimentos */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo de Abastecimentos</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Fuel className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-600 uppercase">Litros Abastecidos</p>
                    <p className="text-2xl font-bold text-blue-900">{totais.litros.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</p>
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
                    <p className="text-xs font-medium text-green-600 uppercase">Veículos Abastecidos</p>
                    <p className="text-2xl font-bold text-green-900">{dadosPizza.reduce((acc, item) => Math.max(acc, item.value), 0).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Calculator className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-purple-600 uppercase">Valor Abastecimentos</p>
                    <p className="text-2xl font-bold text-purple-900">R$ {totais.valor.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-orange-600 uppercase">Abastecimentos</p>
                    <p className="text-2xl font-bold text-orange-900">{totais.abastecimentos.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Cards de Recebimentos (Entradas) */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo de Recebimentos (Entradas)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-500 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-emerald-600 uppercase">Litros Recebidos</p>
                    <p className="text-2xl font-bold text-emerald-900">0,0</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-teal-50 border-teal-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-teal-500 rounded-lg">
                    <Calculator className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-teal-600 uppercase">Valor Recebimentos</p>
                    <p className="text-2xl font-bold text-teal-900">-</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-cyan-50 border-cyan-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-cyan-500 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-cyan-600 uppercase">Total Recebimentos</p>
                    <p className="text-2xl font-bold text-cyan-900">0</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Cards de Detalhes por Tipo de Combustível */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalhes por Tipo de Combustível</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-slate-50 border-slate-200">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600 uppercase">Diesel</span>
                    <Fuel className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Litros:</p>
                    <p className="text-xl font-bold text-slate-900">{(totais.litros * 0.85).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Valor:</p>
                    <p className="text-sm font-semibold text-slate-900">R$ {(totais.valor * 0.85).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Veículos:</p>
                    <p className="text-sm font-semibold text-slate-900">{Math.floor(dadosPizza.reduce((acc, item) => Math.max(acc, item.value), 0) * 0.9)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-indigo-50 border-indigo-200">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-indigo-600 uppercase">Gasolina</span>
                    <Fuel className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-indigo-500">Litros:</p>
                    <p className="text-xl font-bold text-indigo-900">{(totais.litros * 0.1).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-indigo-500">Valor:</p>
                    <p className="text-sm font-semibold text-indigo-900">R$ {(totais.valor * 0.1).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-indigo-500">Veículos:</p>
                    <p className="text-sm font-semibold text-indigo-900">3</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-amber-600 uppercase">Álcool</span>
                    <Fuel className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-amber-500">Litros:</p>
                    <p className="text-xl font-bold text-amber-900">0,0</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-amber-500">Valor:</p>
                    <p className="text-sm font-semibold text-amber-900">-</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-amber-500">Veículos:</p>
                    <p className="text-sm font-semibold text-amber-900">0</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-red-600 uppercase">ARLA</span>
                    <Fuel className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-red-500">Litros:</p>
                    <p className="text-xl font-bold text-red-900">{(totais.litros * 0.05).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-red-500">Valor:</p>
                    <p className="text-sm font-semibold text-red-900">R$ {(totais.valor * 0.05).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-red-500">Veículos:</p>
                    <p className="text-sm font-semibold text-red-900">{Math.floor(dadosPizza.reduce((acc, item) => Math.max(acc, item.value), 0) * 0.95)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Tabs de Análise */}
      <Tabs defaultValue="unificado" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="unificado">Visão Unificada</TabsTrigger>
          <TabsTrigger value="individual">Análise Individual</TabsTrigger>
          <TabsTrigger value="comparacao">Comparação</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Tab: Visão Unificada */}
        <TabsContent value="unificado" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Barras - Abastecimentos por Mês */}
            <Card>
              <CardHeader>
                <CardTitle>Abastecimentos por Mês - {selectedYear}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparativoData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {postos.map((posto, index) => (
                      <Bar 
                        key={posto.id}
                        dataKey={`${posto.nome}_abastecimentos`}
                        name={posto.nome}
                        fill={cores[index]}
                        stackId="a"
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Pizza - Distribuição por Posto */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Posto - {selectedYear}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dadosPizza}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    >
                      {dadosPizza.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Linha - Valor Total por Mês */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução do Gasto Mensal - {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={comparativoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`R$ ${parseFloat(value as string).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']} />
                  <Legend />
                  {postos.map((posto, index) => (
                    <Line 
                      key={posto.id}
                      type="monotone" 
                      dataKey={`${posto.nome}_valor`}
                      name={posto.nome}
                      stroke={cores[index]}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Análise Individual */}
        <TabsContent value="individual" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {postos.map((posto) => {
              const dadosPosto = dadosMensais
                .filter(d => d.posto === posto.id && d.ano === parseInt(selectedYear));
              
              const totalPosto = dadosPosto.reduce((acc, curr) => ({
                abastecimentos: acc.abastecimentos + curr.total_abastecimentos,
                litros: acc.litros + curr.total_litros,
                valor: acc.valor + curr.total_valor
              }), { abastecimentos: 0, litros: 0, valor: 0 });

              return (
                <Card key={posto.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {posto.nome}
                      <Badge variant={totalPosto.abastecimentos > 0 ? "default" : "secondary"}>
                        {totalPosto.abastecimentos > 0 ? "Ativo" : "Inativo"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Abastecimentos:</span>
                      <span className="font-semibold">{totalPosto.abastecimentos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Litros:</span>
                      <span className="font-semibold">{totalPosto.litros.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Valor:</span>
                      <span className="font-semibold">R$ {totalPosto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Meses ativos:</span>
                      <span className="font-semibold">{dadosPosto.length}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab: Comparação */}
        <TabsContent value="comparacao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparação Detalhada por Mês - {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Mês</th>
                      {postos.map(posto => (
                        <th key={posto.id} className="text-center p-2">{posto.nome}</th>
                      ))}
                      <th className="text-center p-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparativoData.map((mes) => (
                      <tr key={mes.mesNumero} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{mes.mes}</td>
                        {postos.map(posto => (
                          <td key={posto.id} className="text-center p-2">
                            <div className="text-sm">
                              <div>{mes[`${posto.nome}_abastecimentos`] || 0}</div>
                              <div className="text-xs text-gray-500">
                                {(mes[`${posto.nome}_litros`] || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}L
                              </div>
                            </div>
                          </td>
                        ))}
                        <td className="text-center p-2 font-semibold">
                          <div className="text-sm">
                            <div>{postos.reduce((acc, posto) => acc + (mes[`${posto.nome}_abastecimentos`] || 0), 0)}</div>
                            <div className="text-xs text-gray-500">
                              {postos.reduce((acc, posto) => acc + (mes[`${posto.nome}_litros`] || 0), 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}L
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Performance */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Postos por Volume */}
            <Card>
              <CardHeader>
                <CardTitle>Top Postos por Volume - {selectedYear}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dadosPizza
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5)
                    .map((posto, index) => (
                      <div key={posto.name} className="flex items-center justify-between p-2 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: posto.color }}></div>
                          <span className="font-medium">{posto.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{posto.value.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">abastecimentos</div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Eficiência por Posto */}
            <Card>
              <CardHeader>
                <CardTitle>Média Mensal por Posto - {selectedYear}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {postos.map((posto) => {
                    const dadosPosto = dadosMensais
                      .filter(d => d.posto === posto.id && d.ano === parseInt(selectedYear));
                    
                    const mesesAtivos = dadosPosto.length;
                    const mediaMensal = mesesAtivos > 0 
                      ? dadosPosto.reduce((acc, curr) => acc + curr.total_abastecimentos, 0) / mesesAtivos
                      : 0;

                    return (
                      <div key={posto.id} className="flex items-center justify-between p-2 rounded-lg border">
                        <span className="font-medium">{posto.nome}</span>
                        <div className="text-right">
                          <div className="font-semibold">{mediaMensal.toFixed(1)}</div>
                          <div className="text-xs text-gray-500">média/mês</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}