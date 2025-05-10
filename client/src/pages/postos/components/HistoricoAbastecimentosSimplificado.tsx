import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  RefreshCw, 
  FileDownload,
  Search
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface HistoricoAbastecimentosSimplificadoProps {
  postId: string;
  refreshTrigger?: number;
}

/**
 * Componente simplificado que exibe o histórico de abastecimentos
 * Seguindo o layout mostrado na imagem de referência
 */
const HistoricoAbastecimentosSimplificado: React.FC<HistoricoAbastecimentosSimplificadoProps> = ({ 
  postId,
  refreshTrigger = 0,
}) => {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // Função para buscar os dados de abastecimentos
  const fetchAbastecimentos = useCallback(async () => {
    try {
      const uniqueTimestamp = `${new Date().getTime()}_${Math.random().toString(36).substring(2, 15)}`;
      console.log(`[HISTÓRICO] Buscando abastecimentos para posto: ${postId}, timestamp único: ${uniqueTimestamp}`);
      setIsLoading(true);
      
      // Primeiro tenta buscar da tabela específica do posto no Supabase (se disponível)
      try {
        const { postoSupabaseService } = await import("@/services/PostoSupabaseService");
        const tabelaExiste = await postoSupabaseService.verificarTabelaPosto(postId);
        
        if (tabelaExiste) {
          console.log(`[HISTÓRICO] Buscando histórico do Supabase para o posto ${postId}`);
          const resultado = await postoSupabaseService.obterHistorico(postId);
          
          if (resultado.success && resultado.data && resultado.data.length > 0) {
            console.log(`[HISTÓRICO] Dados obtidos diretamente do Supabase: ${resultado.data.length} registros`);
            setData(resultado.data);
            setFilteredData(resultado.data);
            setIsLoading(false);
            return;
          }
        }
      } catch (supabaseError) {
        console.error("[HISTÓRICO] Erro ao tentar acessar dados do Supabase:", supabaseError);
      }
      
      // Se não conseguiu do Supabase, tenta pela API normal
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
        }
      }
    } catch (error) {
      console.error("[HISTÓRICO] Erro ao buscar abastecimentos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  // Executar a consulta inicial e quando o trigger for atualizado
  useEffect(() => {
    console.log('[HISTÓRICO] Efeito de carga inicial/refresh disparado');
    fetchAbastecimentos();
  }, [fetchAbastecimentos, refreshTrigger]);

  // Aplicar filtros quando os critérios mudarem
  useEffect(() => {
    if (!data.length) {
      setFilteredData([]);
      return;
    }
    
    let results = [...data];
    
    // Aplicar filtro de busca (em múltiplos campos)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      results = results.filter(item => (
        (item.placa && item.placa.toLowerCase().includes(searchLower)) ||
        (item.nome_motorista && item.nome_motorista.toLowerCase().includes(searchLower)) ||
        (item.nome_operador && item.nome_operador.toLowerCase().includes(searchLower)) ||
        (item.tipo_combustivel && item.tipo_combustivel.toLowerCase().includes(searchLower))
      ));
    }
    
    // Aplicar filtro de data inicial
    if (dateStart) {
      const startDate = new Date(dateStart);
      startDate.setHours(0, 0, 0, 0);
      
      results = results.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate >= startDate;
      });
    }
    
    // Aplicar filtro de data final
    if (dateEnd) {
      const endDate = new Date(dateEnd);
      endDate.setHours(23, 59, 59, 999);
      
      results = results.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate <= endDate;
      });
    }
    
    // Ordenar por data decrescente (mais recente primeiro)
    results.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    setFilteredData(results);
  }, [data, searchTerm, dateStart, dateEnd]);

  // Estatísticas para o card de resumo
  const estatisticas = useMemo(() => {
    if (!filteredData.length) return null;
    
    const totalLitros = filteredData.reduce((sum, item) => 
      sum + (Number(item.litros || item.quantidade_litros || item.quantity_litros) || 0), 0);
    
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

  // Funções de manipulação
  const handleAtualizar = useCallback(() => {
    console.log('[HISTÓRICO] Atualizando manualmente histórico de abastecimentos');
    fetchAbastecimentos();
  }, [fetchAbastecimentos]);

  const handleExportarExcel = useCallback(() => {
    if (filteredData.length === 0) return;
    
    const formattedData = filteredData.map(item => ({
      Data: format(new Date(item.created_at), 'dd/MM/yyyy'),
      Hora: format(new Date(item.created_at), 'HH:mm:ss'),
      Veículo: item.placa,
      Quilometragem: item.km_atual || item.km,
      Hodômetro: item.hodometro_atual,
      Combustível: item.tipo_combustivel,
      Litros: item.litros || item.quantidade_litros,
      'Valor Unitário': item.valor_litro,
      'Valor Total': item.valor_total,
      Motorista: item.nome_motorista,
      Operador: item.nome_operador,
      RG: item.rg_motorista || '',
    }));
    
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Abastecimentos");
    
    const fileName = `abastecimentos_${postId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }, [filteredData, postId]);

  return (
    <div className="w-full bg-sky-100 p-2 rounded-lg shadow-sm">
      <div className="mb-2">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Histórico de Abastecimentos</h3>
            <p className="text-sm text-gray-600">Registros de abastecimento do Posto {postId}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAtualizar} 
              className="bg-blue-400 text-white hover:bg-blue-500"
            >
              {isLoading ? "Carregando..." : "Atualizar"}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportarExcel}
              className="bg-blue-400 text-white hover:bg-blue-500"
              disabled={filteredData.length === 0}
            >
              Exportar
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-1">
          <Input
            type="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="h-8 w-[130px]"
          />
          <span className="mx-1">a</span>
          <Input
            type="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="h-8 w-[130px]"
          />
        </div>
        <div className="relative">
          <Input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 w-[180px]"
          />
          <Search className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <p>Nenhum abastecimento encontrado.</p>
          {searchTerm && (
            <p className="text-sm mt-2">Tente ajustar o termo de busca.</p>
          )}
        </div>
      ) : (
        <>
          {/* Cards de estatísticas similares ao layout da imagem de referência */}
          <div className="grid grid-cols-6 gap-2 mb-4 bg-white p-3 rounded-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Registros</p>
              <p className="text-xl font-bold text-blue-700">{estatisticas?.totalRegistros}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Total de Litros</p>
              <p className="text-xl font-bold text-blue-700">{estatisticas?.totalLitros.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-xl font-bold text-blue-700">
                R$ {estatisticas?.totalValor.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Veículos</p>
              <p className="text-xl font-bold text-blue-700">{estatisticas?.placasUnicas}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Diesel</p>
              <p className="text-xl font-bold text-blue-700">{estatisticas?.dieselCount}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">ARLA</p>
              <p className="text-xl font-bold text-blue-700">{estatisticas?.arlaCount}</p>
            </div>
          </div>

          {/* Tabela simplificada */}
          <div className="overflow-x-auto bg-white rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-3 text-left">Data</th>
                  <th className="py-2 px-3 text-left">Placa</th>
                  <th className="py-2 px-3 text-left">Motorista</th>
                  <th className="py-2 px-3 text-right">Litros</th>
                  <th className="py-2 px-3 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.slice(0, 10).map((item) => (
                  <tr key={item.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-2 px-3">
                      {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="py-2 px-3">{item.placa}</td>
                    <td className="py-2 px-3">{item.nome_motorista}</td>
                    <td className="py-2 px-3 text-right">
                      {(item.litros || item.quantidade_litros || 0).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      R$ {parseFloat(item.valor_total || 0).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default HistoricoAbastecimentosSimplificado;