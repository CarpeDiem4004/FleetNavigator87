import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  RefreshCw, 
  FileSpreadsheet, 
  Search, 
  Calendar,
  Filter
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface HistoricoAbastecimentosOptimizedProps {
  postId: string;
  showLimparButton?: boolean;
  refreshTrigger?: number;
}

const HistoricoAbastecimentosOptimized: React.FC<HistoricoAbastecimentosOptimizedProps> = ({ 
  postId,
  showLimparButton = false,
  refreshTrigger = 0,
}) => {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string,
    direction: 'ascending' | 'descending'
  }>({ key: 'created_at', direction: 'descending' });

  // Funções de formatação
  const formatarData = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return dateString || '-';
    }
  };

  const formatarDataHora = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data e hora:", error);
      return dateString || '-';
    }
  };

  const formatarNumero = (numero: number) => {
    if (numero === undefined || numero === null) return '-';
    return numero.toLocaleString('pt-BR');
  };

  const formatarPreco = (preco: number) => {
    if (preco === undefined || preco === null) return '-';
    return `R$ ${preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Função para ordenar dados
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Função para carregar os dados com verificação extra de cache e timestamp único
  const fetchAbastecimentos = useCallback(async () => {
    try {
      // Criar timestamp único para evitar qualquer tipo de caching
      const uniqueTimestamp = `${new Date().getTime()}_${Math.random().toString(36).substring(2, 15)}`;
      console.log(`[HISTÓRICO] Buscando abastecimentos para posto: ${postId}, timestamp único: ${uniqueTimestamp}`);
      setIsLoading(true);
      
      // NOVO: Primeiro tenta buscar da tabela específica do posto no Supabase (se disponível)
      let dadosSupabase = null;
      
      try {
        // Importação dinâmica para não quebrar o build se o serviço não estiver disponível
        const { postoSupabaseService } = await import("@/services/PostoSupabaseService");
        
        // Verifica primeiro se a tabela deste posto existe
        const tabelaExiste = await postoSupabaseService.verificarTabelaPosto(postId);
        
        if (tabelaExiste) {
          console.log(`[HISTÓRICO] Buscando histórico do Supabase para o posto ${postId}`);
          
          // Busca os dados diretamente do Supabase
          const resultado = await postoSupabaseService.obterHistorico(postId);
          
          if (resultado.success && resultado.data && resultado.data.length > 0) {
            console.log(`[HISTÓRICO] Dados obtidos diretamente do Supabase: ${resultado.data.length} registros`);
            setData(resultado.data);
            setFilteredData(resultado.data);
            setIsLoading(false);
            return; // Encerra a função aqui se conseguiu os dados do Supabase
          } else {
            console.log(`[HISTÓRICO] Nenhum dado encontrado no Supabase ou erro. Continuando com API.`);
          }
        } else {
          console.log(`[HISTÓRICO] Tabela para posto ${postId} não existe no Supabase. Continuando com API.`);
        }
      } catch (supabaseError) {
        console.error("[HISTÓRICO] Erro ao tentar acessar dados do Supabase:", supabaseError);
      }
      
      // EXISTENTE: Continua com a API normal se não conseguiu dados do Supabase
      // Usar o timestamp único na requisição
      const url = `/api/abastecimentos/${postId}?t=${uniqueTimestamp}`;
      console.log(`[HISTÓRICO] Fazendo requisição para API: ${url}`);
      
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const historicoData = result.data || [];
          console.log(`[HISTÓRICO] Dados obtidos via API: ${historicoData.length} registros`);
          setData(historicoData);
          setFilteredData(historicoData);
        } else {
          console.error("[HISTÓRICO] API retornou erro:", result);
        }
      } else {
        console.error("[HISTÓRICO] Erro HTTP:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("[HISTÓRICO] Erro ao buscar abastecimentos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  // Executar a consulta inicial (uma vez) e quando o trigger for atualizado
  useEffect(() => {
    console.log('[HISTÓRICO] Efeito de carga inicial/refresh disparado');
    fetchAbastecimentos();
  }, [fetchAbastecimentos, refreshTrigger]);

  // Aplicar filtros quando os critérios mudarem
  useEffect(() => {
    console.log('[HISTÓRICO] Aplicando filtros ao histórico de abastecimentos');
    if (!data.length) {
      setFilteredData([]);
      return;
    }
    
    let results = [...data];
    
    // Aplicar ordenação
    results.sort((a, b) => {
      const valueA = a[sortConfig.key];
      const valueB = b[sortConfig.key];
      
      if (valueA === valueB) return 0;
      
      // Ordenação específica para datas
      if (sortConfig.key === 'created_at') {
        const dateA = new Date(valueA || 0).getTime();
        const dateB = new Date(valueB || 0).getTime();
        return (sortConfig.direction === 'ascending' ? dateA - dateB : dateB - dateA);
      }
      
      // Ordenação para valores numéricos
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return (sortConfig.direction === 'ascending' ? valueA - valueB : valueB - valueA);
      }
      
      // Ordenação para strings
      const stringA = String(valueA || '').toLowerCase();
      const stringB = String(valueB || '').toLowerCase();
      
      if (stringA < stringB) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (stringA > stringB) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
    
    // Aplicar filtro de busca (em múltiplos campos)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      results = results.filter(item => {
        return (
          (item.placa && item.placa.toLowerCase().includes(searchLower)) ||
          (item.nome_motorista && item.nome_motorista.toLowerCase().includes(searchLower)) ||
          (item.nome_operador && item.nome_operador.toLowerCase().includes(searchLower)) ||
          (item.tipo_combustivel && item.tipo_combustivel.toLowerCase().includes(searchLower))
        );
      });
    }
    
    // Aplicar filtro de data inicial
    if (dateStart) {
      const startDate = new Date(dateStart);
      startDate.setHours(0, 0, 0, 0); // Início do dia
      
      results = results.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate >= startDate;
      });
    }
    
    // Aplicar filtro de data final
    if (dateEnd) {
      const endDate = new Date(dateEnd);
      endDate.setHours(23, 59, 59, 999); // Fim do dia
      
      results = results.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate <= endDate;
      });
    }
    
    setFilteredData(results);
  }, [data, searchTerm, dateStart, dateEnd, sortConfig]);

  // Funções de manipulação
  const handleAtualizar = useCallback(() => {
    console.log('[HISTÓRICO] Atualizando manualmente histórico de abastecimentos');
    fetchAbastecimentos();
  }, [fetchAbastecimentos]);

  const handleExportarExcel = useCallback(() => {
    if (filteredData.length === 0) return;
    
    const formattedData = filteredData.map(item => ({
      Data: formatarData(item.created_at),
      Hora: format(parseISO(item.created_at), 'HH:mm:ss'),
      Veículo: item.placa,
      Quilometragem: item.km_atual,
      Hodômetro: item.hodometro_atual,
      Combustível: item.tipo_combustivel,
      Litros: item.litros,
      'Valor Unitário': item.valor_litro,
      'Valor Total': item.valor_total,
      Motorista: item.nome_motorista,
      Operador: item.nome_operador,
      Posto: item.posto,
      RG: item.rg_motorista || '',
    }));
    
    // Criar uma planilha
    const ws = XLSX.utils.json_to_sheet(formattedData);
    
    // Definir larguras de colunas para melhor visualização
    const wscols = [
      { wch: 10 },  // Data
      { wch: 10 },  // Hora
      { wch: 10 },  // Placa
      { wch: 12 },  // KM
      { wch: 12 },  // Hodômetro
      { wch: 12 },  // Combustível
      { wch: 8 },   // Litros
      { wch: 14 },  // Valor Unitário
      { wch: 14 },  // Valor Total
      { wch: 20 },  // Motorista
      { wch: 20 },  // Operador
      { wch: 15 },  // Posto
      { wch: 15 }   // RG
    ];
    ws['!cols'] = wscols;
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Abastecimentos");
    
    // Salvar o arquivo com nome descritivo
    const fileName = `abastecimentos_${postId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }, [filteredData, postId]);

  const getSortingIndicator = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' 
      ? <span className="ml-1">▲</span> 
      : <span className="ml-1">▼</span>;
  };

  // Estatísticas para o card de resumo
  const estatisticas = useMemo(() => {
    if (!filteredData.length) return null;
    
    const totalLitros = filteredData.reduce((sum, item) => 
      sum + (Number(item.litros) || 0), 0);
    
    const totalValor = filteredData.reduce((sum, item) => 
      sum + (Number(item.valor_total) || 0), 0);
    
    const dieselCount = filteredData.filter(item => 
      item.tipo_combustivel?.toLowerCase() === 'diesel').length;
    
    const arlaCount = filteredData.filter(item => 
      item.tipo_combustivel?.toLowerCase() === 'arla').length;
    
    const placasUnicas = new Set(filteredData.map(item => item.placa));
    
    return {
      totalRegistros: filteredData.length,
      totalLitros,
      totalValor,
      dieselCount,
      arlaCount,
      placasUnicas: placasUnicas.size
    };
  }, [filteredData]);
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-lg">Histórico de Abastecimentos</CardTitle>
            <CardDescription>
              {isLoading ? 'Carregando dados...' : 
                `Registros de abastecimentos do Posto ${postId}`}
            </CardDescription>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAtualizar} 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="ml-2 hidden md:inline">Atualizar</span>
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
                    onClick={handleExportarExcel}
                    disabled={isLoading || filteredData.length === 0}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span className="ml-2 hidden md:inline">Exportar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Exportar para Excel</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 w-[140px] md:w-[180px]"
              />
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-gray-400" />
            <Input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="h-8 w-[130px]"
            />
            <span className="mx-1 text-gray-400">a</span>
            <Input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="h-8 w-[130px]"
            />
          </div>
        </div>
      </CardHeader>
      
      {isLoading ? (
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      ) : filteredData.length === 0 ? (
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <p>Nenhum abastecimento encontrado.</p>
            {searchTerm && (
              <p className="text-sm mt-2">Tente ajustar o termo de busca.</p>
            )}
          </div>
        </CardContent>
      ) : (
        <>
          {/* Card com estatísticas */}
          {estatisticas && (
            <div className="mx-4 my-2">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                  <p className="text-xs text-blue-600 font-medium">Registros</p>
                  <p className="text-lg font-bold text-blue-700">{estatisticas.totalRegistros}</p>
                </div>
                <div className="bg-green-50 border border-green-100 p-3 rounded-lg">
                  <p className="text-xs text-green-600 font-medium">Total de Litros</p>
                  <p className="text-lg font-bold text-green-700">{formatarNumero(estatisticas.totalLitros)}</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg">
                  <p className="text-xs text-amber-600 font-medium">Valor Total</p>
                  <p className="text-lg font-bold text-amber-700">{formatarPreco(estatisticas.totalValor)}</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 p-3 rounded-lg">
                  <p className="text-xs text-purple-600 font-medium">Veículos</p>
                  <p className="text-lg font-bold text-purple-700">{estatisticas.placasUnicas}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                  <p className="text-xs text-blue-600 font-medium">Diesel</p>
                  <p className="text-lg font-bold text-blue-700">{estatisticas.dieselCount}</p>
                </div>
                <div className="bg-cyan-50 border border-cyan-100 p-3 rounded-lg">
                  <p className="text-xs text-cyan-600 font-medium">ARLA</p>
                  <p className="text-lg font-bold text-cyan-700">{estatisticas.arlaCount}</p>
                </div>
              </div>
            </div>
          )}
          
          <CardContent className="pt-2">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="w-[140px] cursor-pointer hover:bg-gray-50"
                      onClick={() => requestSort('created_at')}
                    >
                      Data/Hora {getSortingIndicator('created_at')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => requestSort('placa')}
                    >
                      Veículo {getSortingIndicator('placa')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => requestSort('km_atual')}
                    >
                      KM {getSortingIndicator('km_atual')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => requestSort('tipo_combustivel')}
                    >
                      Combustível {getSortingIndicator('tipo_combustivel')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 text-right"
                      onClick={() => requestSort('litros')}
                    >
                      Litros {getSortingIndicator('litros')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 text-right"
                      onClick={() => requestSort('valor_total')}
                    >
                      Valor {getSortingIndicator('valor_total')}
                    </TableHead>
                    <TableHead>Motorista</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {formatarDataHora(item.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.placa}
                      </TableCell>
                      <TableCell>
                        {formatarNumero(item.km_atual)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.tipo_combustivel === 'Diesel' ? 'default' : 'secondary'}>
                          {item.tipo_combustivel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatarNumero(item.litros)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatarPreco(item.valor_total)}
                      </TableCell>
                      <TableCell>
                        {item.nome_motorista || item.motorista || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
};

export default HistoricoAbastecimentosOptimized;