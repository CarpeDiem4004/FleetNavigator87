import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  RefreshCw, 
  Download, 
  Info, 
  Search, 
  X, 
  Filter 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface HistoricoAbastecimentoGlobal {
  id: number;
  placa: string;
  km_atual: number;
  tipo_combustivel: string;
  quantidade_litros: number | string;
  nome_motorista: string;
  nome_operador: string;
  valor_litro: number | string;
  valor_total: number | string;
  posto: string;
  data_hora: string;
  created_at: string;
}

const HistoricoConsolidadoView: React.FC = () => {
  const [historico, setHistorico] = useState<HistoricoAbastecimentoGlobal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [placaFiltro, setPlacaFiltro] = useState<string>('');
  const [postoFiltro, setPostoFiltro] = useState<string>('');
  const [historicoFiltrado, setHistoricoFiltrado] = useState<HistoricoAbastecimentoGlobal[]>([]);
  const [postos, setPostos] = useState<string[]>([]);

  const loadHistorico = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Adicionar timestamp para evitar cache
      const timestamp = new Date().getTime();
      const response = await axios.get(`/api/historico/historico-consolidado?t=${timestamp}`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      console.log('Resposta do histórico consolidado:', response);
      
      if (response.data && response.data.success) {
        const dados = response.data.data || [];
        setHistorico(dados);
        
        // Extrair lista única de postos
        const listaPosto = [...new Set(dados.map((item: HistoricoAbastecimentoGlobal) => item.posto))];
        setPostos(listaPosto.sort());
        
        setLastRefreshTime(new Date());
      } else {
        setError(response.data?.error || 'Erro ao carregar o histórico consolidado');
        console.error('Erro na resposta:', response.data);
      }
    } catch (err: any) {
      console.error('Erro ao carregar histórico consolidado:', err);
      setError(`Erro ao carregar histórico: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar dados quando o componente montar
  useEffect(() => {
    console.log('Carregando histórico consolidado de todos os postos');
    loadHistorico();

    // Configurar atualização automática a cada 60 segundos
    const intervalId = setInterval(() => {
      console.log('Atualizando histórico consolidado automaticamente');
      loadHistorico();
    }, 60000); // 60 segundos

    // Limpar o intervalo quando o componente for desmontado
    return () => clearInterval(intervalId);
  }, []);
  
  // Aplicar filtros quando os parâmetros mudarem
  useEffect(() => {
    if (!historico.length) {
      setHistoricoFiltrado([]);
      return;
    }
    
    let resultados = [...historico];
    
    // Filtrar por data inicial
    if (dataInicio) {
      const dataInicioObj = new Date(dataInicio);
      dataInicioObj.setHours(0, 0, 0, 0);
      
      resultados = resultados.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate >= dataInicioObj;
      });
    }
    
    // Filtrar por data final
    if (dataFim) {
      const dataFimObj = new Date(dataFim);
      dataFimObj.setHours(23, 59, 59, 999);
      
      resultados = resultados.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate <= dataFimObj;
      });
    }
    
    // Filtrar por placa
    if (placaFiltro) {
      const placaLower = placaFiltro.toLowerCase();
      resultados = resultados.filter(item => 
        item.placa.toLowerCase().includes(placaLower)
      );
    }
    
    // Filtrar por posto
    if (postoFiltro) {
      resultados = resultados.filter(item => 
        item.posto === postoFiltro
      );
    }
    
    setHistoricoFiltrado(resultados);
  }, [historico, dataInicio, dataFim, placaFiltro, postoFiltro]);

  // Função para formatar o valor do combustível
  const formatCurrency = (value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  // Função para formatar quantidade de litros
  const formatLitros = (value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Função para exportar histórico para Excel
  const exportToExcel = () => {
    if (historicoFiltrado.length === 0) return;

    // Formatar os dados para o Excel
    const workbookData = historicoFiltrado.map(item => ({
      'ID': item.id,
      'Data/Hora': item.data_hora,
      'Posto': item.posto,
      'Placa': item.placa,
      'KM': item.km_atual,
      'Tipo de Combustível': item.tipo_combustivel,
      'Quantidade (L)': item.quantidade_litros,
      'Motorista': item.nome_motorista,
      'Operador': item.nome_operador,
      'Valor por Litro': item.valor_litro,
      'Valor Total': item.valor_total
    }));

    // Criar planilha
    const worksheet = XLSX.utils.json_to_sheet(workbookData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Histórico Consolidado");

    // Exportar para Excel
    const date = new Date();
    const formattedDate = format(date, 'dd-MM-yyyy_HH-mm', {locale: ptBR});
    const fileName = `historico_consolidado_abastecimentos_${formattedDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Calcular estatísticas
  const calcularEstatisticas = () => {
    if (historicoFiltrado.length === 0) return {
      totalRegistros: 0,
      totalLitros: 0,
      totalValor: 0,
      mediaLitrosPorAbastecimento: 0,
      mediaValorPorAbastecimento: 0,
      litrosPorPosto: {},
      valorPorPosto: {}
    };
    
    const totalRegistros = historicoFiltrado.length;
    
    let totalLitros = 0;
    let totalValor = 0;
    const litrosPorPosto: {[key: string]: number} = {};
    const valorPorPosto: {[key: string]: number} = {};
    
    historicoFiltrado.forEach(item => {
      const litros = typeof item.quantidade_litros === 'string' 
        ? parseFloat(item.quantidade_litros) 
        : item.quantidade_litros;
        
      const valor = typeof item.valor_total === 'string' 
        ? parseFloat(item.valor_total) 
        : item.valor_total;
      
      totalLitros += litros;
      totalValor += valor;
      
      // Acumular por posto
      if (!litrosPorPosto[item.posto]) litrosPorPosto[item.posto] = 0;
      if (!valorPorPosto[item.posto]) valorPorPosto[item.posto] = 0;
      
      litrosPorPosto[item.posto] += litros;
      valorPorPosto[item.posto] += valor;
    });
    
    const mediaLitrosPorAbastecimento = totalLitros / totalRegistros;
    const mediaValorPorAbastecimento = totalValor / totalRegistros;
    
    return {
      totalRegistros,
      totalLitros,
      totalValor,
      mediaLitrosPorAbastecimento,
      mediaValorPorAbastecimento,
      litrosPorPosto,
      valorPorPosto
    };
  };
  
  const estatisticas = calcularEstatisticas();

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Histórico Consolidado de Abastecimentos</CardTitle>
            <CardDescription>
              {isLoading ? 'Carregando dados...' : 
                `Visualização global de todos os postos - ${historicoFiltrado.length} registros`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadHistorico} 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Atualizar histórico</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={exportToExcel}
                    disabled={historicoFiltrado.length === 0 || isLoading}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Exportar para Excel</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      
      {/* Filtros de busca */}
      <div className="px-6 pb-2 pt-1">
        <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex-1">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="dataInicio" className="text-xs mb-1 block">Data inicial</Label>
                  <Input 
                    id="dataInicio"
                    type="date" 
                    value={dataInicio} 
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="dataFim" className="text-xs mb-1 block">Data final</Label>
                  <Input 
                    id="dataFim"
                    type="date" 
                    value={dataFim} 
                    onChange={(e) => setDataFim(e.target.value)}
                    className="h-8"
                  />
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="placaFiltro" className="text-xs mb-1 block">Placa do veículo</Label>
                  <div className="relative">
                    <Input 
                      id="placaFiltro"
                      type="text" 
                      placeholder="Buscar por placa..." 
                      value={placaFiltro} 
                      onChange={(e) => setPlacaFiltro(e.target.value)}
                      className="h-8 pl-8"
                    />
                    <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-slate-400" />
                    {placaFiltro && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute right-0 top-0 h-8 w-8 p-0"
                        onClick={() => setPlacaFiltro('')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <Label htmlFor="postoFiltro" className="text-xs mb-1 block">Posto</Label>
                  <Select value={postoFiltro} onValueChange={setPostoFiltro}>
                    <SelectTrigger id="postoFiltro" className="h-8">
                      <SelectValue placeholder="Selecione o posto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os Postos</SelectItem>
                      {postos.map(posto => (
                        <SelectItem key={posto} value={posto}>
                          {posto.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setDataInicio('');
                  setDataFim('');
                  setPlacaFiltro('');
                  setPostoFiltro('');
                }}
                disabled={!dataInicio && !dataFim && !placaFiltro && !postoFiltro}
                className="h-8"
              >
                <Filter className="h-3.5 w-3.5 mr-1" />
                Limpar filtros
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Resumo estatístico */}
      {historicoFiltrado.length > 0 && (
        <div className="px-6 pb-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="bg-blue-50 border-blue-100">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium text-blue-700">Volume Total</CardTitle>
              </CardHeader>
              <CardContent className="py-0 px-4 pb-3">
                <div className="text-2xl font-bold text-blue-800">
                  {estatisticas.totalLitros.toLocaleString('pt-BR', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })} L
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Média: {estatisticas.mediaLitrosPorAbastecimento.toLocaleString('pt-BR', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })} L por abastecimento
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-green-50 border-green-100">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium text-green-700">Valor Total</CardTitle>
              </CardHeader>
              <CardContent className="py-0 px-4 pb-3">
                <div className="text-2xl font-bold text-green-800">
                  {formatCurrency(estatisticas.totalValor)}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Média: {formatCurrency(estatisticas.mediaValorPorAbastecimento)} por abastecimento
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-purple-50 border-purple-100">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium text-purple-700">Registros</CardTitle>
              </CardHeader>
              <CardContent className="py-0 px-4 pb-3">
                <div className="text-2xl font-bold text-purple-800">
                  {estatisticas.totalRegistros} abastecimentos
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  {postoFiltro ? `Filtrados no posto ${postoFiltro.toUpperCase()}` : 'Todos os postos'}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      
      <CardContent>
        {error ? (
          <div className="flex items-center gap-2 text-destructive p-4 border border-destructive/20 rounded-md bg-destructive/10">
            <Info className="h-5 w-5" />
            <span>{error}</span>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-[100px]">Data/Hora</TableHead>
                  <TableHead className="w-[100px]">Posto</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Combustível</TableHead>
                  <TableHead className="text-right">Litros</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      {isLoading ? (
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          <span>Carregando histórico consolidado...</span>
                        </div>
                      ) : (
                        "Nenhum registro de abastecimento encontrado"
                      )}
                    </TableCell>
                  </TableRow>
                ) : historicoFiltrado.length === 0 && (dataInicio || dataFim || placaFiltro || postoFiltro) ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <Search className="h-8 w-8 mb-2 text-slate-400" />
                        <p>Nenhum registro encontrado com os filtros aplicados</p>
                        <div className="flex flex-wrap gap-2 mt-2 justify-center">
                          {placaFiltro && <Badge variant="outline">Placa: {placaFiltro}</Badge>}
                          {postoFiltro && <Badge variant="outline">Posto: {postoFiltro}</Badge>}
                          {dataInicio && <Badge variant="outline">De: {dataInicio}</Badge>}
                          {dataFim && <Badge variant="outline">Até: {dataFim}</Badge>}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  historicoFiltrado.map((item) => (
                    <TableRow key={`${item.posto}-${item.id}`}>
                      <TableCell className="font-mono text-xs">
                        {new Date(item.data_hora).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50">
                          {item.posto.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.placa}</TableCell>
                      <TableCell>
                        {item.tipo_combustivel === 'ARLA' ? (
                          <span className="text-blue-600">ARLA</span>
                        ) : (
                          <div className="w-16 h-4 rounded-full bg-blue-100 overflow-hidden">
                            <div 
                              className="h-full bg-blue-500" 
                              style={{ width: '100%' }}
                            ></div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatLitros(item.quantidade_litros)} L
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(item.valor_total)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default HistoricoConsolidadoView;