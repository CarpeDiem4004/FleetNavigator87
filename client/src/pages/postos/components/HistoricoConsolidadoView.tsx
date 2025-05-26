import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
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
  km: number;
  tipo_combustivel: string;
  quantidade_litros: number | string;
  nome_motorista: string;
  rg_motorista?: string;
  nome_operador: string;
  valor_litro: number | string;
  valor_total: number | string;
  tipo_veiculo?: string;
  observacoes?: string;
  lavagem?: boolean;
  tipo_lavagem?: string;
  nome_posto: string; // Nome do posto no banco
  posto?: string; // Compatibilidade com código antigo
  data_hora: string;
  created_at: string;
  project?: string; // Campo de projeto em inglês
}

// Exemplo para depuração local caso a API não retorne dados
const dadosExemplo: HistoricoAbastecimentoGlobal[] = [
  {
    id: 1,
    placa: "ABC1234",
    km: 12500,
    tipo_combustivel: "Diesel S10",
    quantidade_litros: 60.5,
    nome_motorista: "João Silva",
    nome_operador: "Operador 1",
    valor_litro: 5.79,
    valor_total: 350.29,
    nome_posto: "Campinas_v2",
    data_hora: "2025-05-01T10:15:00Z",
    created_at: "2025-05-01T10:15:00Z"
  },
  {
    id: 2,
    placa: "DEF5678",
    km: 8700,
    tipo_combustivel: "Gasolina",
    quantidade_litros: 45.2,
    nome_motorista: "Maria Souza",
    nome_operador: "Operador 2",
    valor_litro: 6.19,
    valor_total: 279.79,
    nome_posto: "Alair_v2",
    data_hora: "2025-05-01T11:30:00Z",
    created_at: "2025-05-01T11:30:00Z"
  },
  {
    id: 3,
    placa: "GHI9012",
    km: 5200,
    tipo_combustivel: "Diesel Comum",
    quantidade_litros: 70.8,
    nome_motorista: "Pedro Santos",
    nome_operador: "Operador 3",
    valor_litro: 5.49,
    valor_total: 388.69,
    nome_posto: "Socorro_v2",
    data_hora: "2025-05-02T09:45:00Z",
    created_at: "2025-05-02T09:45:00Z"
  }
];

const HistoricoConsolidadoView: React.FC = () => {
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [placaFiltro, setPlacaFiltro] = useState<string>('');
  const [postoFiltro, setPostoFiltro] = useState<string>('todos');
  const [historicoFiltrado, setHistoricoFiltrado] = useState<HistoricoAbastecimentoGlobal[]>([]);
  const [postos, setPostos] = useState<string[]>([]);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());

  // Usar React Query para buscar dados do histórico consolidado
  const { 
    data: historico = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery<HistoricoAbastecimentoGlobal[]>({
    queryKey: ['/api/historico/historico-consolidado'],
    queryFn: async () => {
      console.log('[FETCH] Buscando histórico consolidado de abastecimentos');
      
      try {
        // Adicionar timestamp para evitar cache
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/historico/historico-consolidado?t=${timestamp}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
          },
          credentials: 'include',
        });
        
        if (!response.ok) {
          console.error('[FETCH] Erro na resposta:', response.status);
          throw new Error(`Erro ao buscar dados: ${response.status}`);
        }
        
        const jsonData = await response.json();
        console.log('[FETCH] Resposta do histórico consolidado:', jsonData);
        
        if (jsonData && jsonData.success === true) {
          let dados = jsonData.data || [];
          console.log('[FETCH] Dados encontrados:', dados.length);
          
          // Garantir que todos os registros tenham o campo project
          dados = dados.map((item: any) => {
            // Cria uma cópia segura do item
            const itemProcessado = {...item};
            
            // Garantir que o projeto está definido
            if (itemProcessado.project === undefined || itemProcessado.project === null) {
              itemProcessado.project = '';
            }
            return itemProcessado;
          });
          
          // Se não houver dados, usar dados de exemplo para visualização
          return dados.length > 0 ? dados : dadosExemplo;
        } else {
          console.error('[FETCH] Formato de resposta inválido:', jsonData);
          return dadosExemplo;
        }
      } catch (err: any) {
        console.error('[FETCH] Erro ao carregar histórico consolidado:', err);
        return dadosExemplo;
      }
    },
    refetchInterval: 300000, // Refetch a cada 5 minutos
    staleTime: 60000, // Considerar dados "frescos" por 1 minuto
  });
  
  // Extrair lista de postos após carregar dados
  useEffect(() => {
    if (historico && historico.length > 0) {
      try {
        // Extrair lista única de postos
        const listaPostos: string[] = Array.from(new Set(
          historico
            .filter(item => item.nome_posto) // Filtra apenas itens com nome_posto definido
            .map(item => item.nome_posto as string) // Converte para array de strings
        ));
        setPostos(listaPostos.sort());
        setLastRefreshTime(new Date());
      } catch (error) {
        console.error('[ERRO] Falha ao processar lista de postos:', error);
      }
    }
  }, [historico]);

  // Aplicar filtros quando os parâmetros mudarem
  useEffect(() => {
    if (!historico || !historico.length) {
      setHistoricoFiltrado([]);
      return;
    }
    
    console.log('[FILTRO] Aplicando filtros ao histórico. Total de registros:', historico.length);
    
    try {
      let resultados = [...historico];
      
      // Filtrar por data inicial
      if (dataInicio) {
        const dataInicioObj = new Date(dataInicio);
        dataInicioObj.setHours(0, 0, 0, 0);
        
        resultados = resultados.filter(item => {
          try {
            const itemDate = new Date(item.created_at);
            return itemDate >= dataInicioObj;
          } catch (err) {
            console.error('[FILTRO] Erro ao converter data para filtragem:', item.created_at);
            return false;
          }
        });
      }
      
      // Filtrar por data final
      if (dataFim) {
        const dataFimObj = new Date(dataFim);
        dataFimObj.setHours(23, 59, 59, 999);
        
        resultados = resultados.filter(item => {
          try {
            const itemDate = new Date(item.created_at);
            return itemDate <= dataFimObj;
          } catch (err) {
            console.error('[FILTRO] Erro ao converter data para filtragem:', item.created_at);
            return false;
          }
        });
      }
      
      // Filtrar por placa
      if (placaFiltro) {
        const placaLower = placaFiltro.toLowerCase();
        resultados = resultados.filter(item => 
          (item.placa && item.placa.toLowerCase().includes(placaLower))
        );
      }
      
      // Filtrar por posto
      if (postoFiltro && postoFiltro !== 'todos') {
        resultados = resultados.filter(item => 
          item.nome_posto === postoFiltro
        );
      }
      
      console.log('[FILTRO] Registros após aplicação dos filtros:', resultados.length);
      setHistoricoFiltrado(resultados);
    } catch (error) {
      console.error('[FILTRO] Erro ao aplicar filtros:', error);
      // Em caso de erro, usar dados sem filtro
      setHistoricoFiltrado(historico);
    }
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

    // Função auxiliar para garantir valores não-nulos
    const formatarCampo = (valor: any, padraoSeVazio = '-'): string => {
      if (valor === undefined || valor === null || valor === '') {
        return padraoSeVazio;
      }
      return String(valor);
    };

    console.log('[EXCEL] Exportando dados com o seguinte número de registros:', historicoFiltrado.length);
    
    // Log para verificar quantos registros têm project
    const comProjeto = historicoFiltrado.filter(item => item.project && item.project.trim() !== '').length;
    console.log('[EXCEL] Registros com projeto preenchido:', comProjeto);
    
    // Formatar os dados para o Excel
    const workbookData = historicoFiltrado.map(item => {
      // Log detalhado apenas para um registro de amostra
      if (item.project) {
        console.log('[EXCEL] Exemplo de registro com project:', { 
          id: item.id, 
          placa: item.placa, 
          project: item.project 
        });
      }
      
      return {
        'ID': item.id,
        'Data/Hora': formatarCampo(item.data_hora),
        'Posto': formatarCampo(item.nome_posto),
        'Placa': formatarCampo(item.placa),
        'KM': item.km || 0,
        'Tipo de Combustível': formatarCampo(item.tipo_combustivel),
        'Quantidade (L)': item.quantidade_litros || 0,
        'Motorista': formatarCampo(item.nome_motorista),
        'Operador': formatarCampo(item.nome_operador),
        'Projeto': formatarCampo(item.project),
        'Valor por Litro': item.valor_litro || 0,
        'Valor Total': item.valor_total || 0
      };
    });

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
      const nomePosto = item.nome_posto;
      if (!litrosPorPosto[nomePosto]) litrosPorPosto[nomePosto] = 0;
      if (!valorPorPosto[nomePosto]) valorPorPosto[nomePosto] = 0;
      
      litrosPorPosto[nomePosto] += litros;
      valorPorPosto[nomePosto] += valor;
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
                    onClick={() => refetch()} 
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
                      <SelectItem value="todos">Todos os Postos</SelectItem>
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
                  setPostoFiltro('todos');
                }}
                disabled={!dataInicio && !dataFim && !placaFiltro && (postoFiltro === 'todos' || !postoFiltro)}
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
            <span>Erro ao carregar dados: {String(error)}</span>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-[100px]">Data/Hora</TableHead>
                  <TableHead className="w-[100px]">Posto</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Projeto</TableHead>
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
                          {item.nome_posto.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.placa}</TableCell>
                      <TableCell>
                        {item.project || 'N/A'}
                      </TableCell>
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