import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, FileDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AdministrativoPostoViewProps {
  posto: string;
  refreshTrigger?: number;
}

interface HistoricoAbastecimento {
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
  lavagem: boolean;
  tipo_lavagem?: string;
  data_hora: string;
  created_at: string;
}

/**
 * Componente para visualização administrativa dos postos com layout simplificado
 * Seguindo o design da imagem de referência
 */
const AdministrativoPostoView: React.FC<AdministrativoPostoViewProps> = ({ 
  posto,
  refreshTrigger = 0
}) => {
  const [historico, setHistorico] = useState<HistoricoAbastecimento[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredHistorico, setFilteredHistorico] = useState<HistoricoAbastecimento[]>([]);

  // Carregar o histórico de abastecimentos
  const loadHistorico = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Prevenção de cache adicionando timestamp na URL
      const timestamp = new Date().getTime();
      
      // Usar a nova rota direta para evitar problemas com interceptação do Vite
      const response = await axios.get(`/api/posto-supabase/historico-unificado/${encodeURIComponent(posto)}?t=${timestamp}`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      console.log('Resposta do histórico:', response);
      
      if (response.data && response.data.success) {
        setHistorico(response.data.data || []);
      } else {
        setError(response.data?.error || 'Erro ao carregar o histórico');
        console.error('Erro na resposta:', response.data);
      }
    } catch (err: any) {
      console.error('Erro ao carregar histórico:', err);
      setError(`Erro ao carregar histórico: ${err.message || 'Erro desconhecido'}`);
      
      // Log do erro para diagnóstico
      console.log('[ADMINISTRATIVO POSTO] Erro detalhado:', {
        posto,
        error: err.message,
        status: err.response?.status
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar dados quando o componente montar ou quando o refreshTrigger mudar
  useEffect(() => {
    console.log(`Carregando histórico do posto ${posto}, refreshTrigger: ${refreshTrigger}`);
    loadHistorico();

    // Configurar atualização automática a cada 45 segundos
    const intervalId = setInterval(() => {
      console.log(`Atualizando histórico automaticamente para ${posto}`);
      loadHistorico();
    }, 45000); // 45 segundos

    // Limpar o intervalo quando o componente for desmontado
    return () => clearInterval(intervalId);
  }, [posto, refreshTrigger]);

  // Aplicar filtros quando os critérios mudarem
  useEffect(() => {
    if (!historico.length) {
      setFilteredHistorico([]);
      return;
    }
    
    let results = [...historico];
    
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
    
    setFilteredHistorico(results);
  }, [historico, searchTerm, dateStart, dateEnd]);

  // Função para exportar histórico para Excel
  const exportToExcel = () => {
    if (filteredHistorico.length === 0) return;

    // Formatar os dados para o Excel
    const workbookData = filteredHistorico.map(item => ({
      'Data/Hora': item.data_hora,
      'Placa': item.placa,
      'KM': item.km,
      'Tipo de Combustível': item.tipo_combustivel,
      'Quantidade (L)': item.quantidade_litros,
      'Motorista': item.nome_motorista,
      'RG Motorista': item.rg_motorista || '-',
      'Operador': item.nome_operador,
      'Valor por Litro': item.valor_litro,
      'Valor Total': item.valor_total,
      'Tipo de Veículo': item.tipo_veiculo || '-',
      'Lavagem': item.lavagem ? 'Sim' : 'Não',
      'Observações': item.observacoes || '-'
    }));

    // Criar planilha
    const worksheet = XLSX.utils.json_to_sheet(workbookData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Histórico");

    // Exportar para Excel
    const date = new Date();
    const formattedDate = format(date, 'dd-MM-yyyy_HH-mm', {locale: ptBR});
    const fileName = `historico_posto_${posto}_${formattedDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Calcular estatísticas para os cards de resumo
  const estatisticas = useMemo(() => {
    if (!filteredHistorico.length) {
      return {
        totalRegistros: 0,
        totalLitros: 0,
        totalValor: 0,
        veiculosUnicos: 0,
        dieselCount: 0,
        arlaCount: 0
      };
    }
    
    const totalLitros = filteredHistorico.reduce((sum, item) => {
      const litros = typeof item.quantidade_litros === 'string' 
        ? parseFloat(item.quantidade_litros) 
        : (item.quantidade_litros || 0);
      return sum + litros;
    }, 0);
    
    const totalValor = filteredHistorico.reduce((sum, item) => {
      const valor = typeof item.valor_total === 'string' 
        ? parseFloat(item.valor_total) 
        : (item.valor_total || 0);
      return sum + valor;
    }, 0);
    
    const dieselCount = filteredHistorico.filter(item => 
      item.tipo_combustivel?.toLowerCase() === 'diesel').length;
    
    const arlaCount = filteredHistorico.filter(item => 
      item.tipo_combustivel?.toLowerCase() === 'arla').length;
    
    const placasUnicas = new Set(filteredHistorico.map(item => item.placa));
    
    return {
      totalRegistros: filteredHistorico.length,
      totalLitros,
      totalValor,
      veiculosUnicos: placasUnicas.size,
      dieselCount,
      arlaCount
    };
  }, [filteredHistorico]);

  return (
    <div className="w-full bg-sky-100 p-4 rounded-lg">
      <div className="mb-3">
        <h2 className="text-lg font-semibold">Histórico de Abastecimentos</h2>
        <p className="text-sm text-gray-600">Registros de abastecimento do Posto {posto}</p>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Button 
            onClick={loadHistorico} 
            disabled={isLoading}
            className="bg-blue-400 text-white hover:bg-blue-500"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
          
          <Button 
            onClick={exportToExcel} 
            disabled={filteredHistorico.length === 0}
            className="bg-blue-400 text-white hover:bg-blue-500"
            size="sm"
          >
            <FileDown className="h-4 w-4 mr-1" />
            Exportar
          </Button>
        </div>
        
        <div className="flex items-center ml-auto">
          <Input
            type="search"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-40 h-8"
          />
        </div>
      </div>
      
      {/* Campo de filtro de datas */}
      <div className="flex flex-wrap gap-2 mb-4">
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
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          {error}
        </div>
      ) : (
        <>
          {/* Cards estatísticos no estilo da imagem de referência */}
          <div className="bg-white rounded-md p-3 mb-4 grid grid-cols-6 gap-2 text-center">
            <div>
              <div className="text-sm text-gray-500">Registros</div>
              <div className="text-xl font-bold text-blue-700">{estatisticas.totalRegistros}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total de Litros</div>
              <div className="text-xl font-bold text-blue-700">{estatisticas.totalLitros.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Valor Total</div>
              <div className="text-xl font-bold text-blue-700">
                R$ {estatisticas.totalValor.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Veículos</div>
              <div className="text-xl font-bold text-blue-700">{estatisticas.veiculosUnicos}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Diesel</div>
              <div className="text-xl font-bold text-blue-700">{estatisticas.dieselCount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">ARLA</div>
              <div className="text-xl font-bold text-blue-700">{estatisticas.arlaCount}</div>
            </div>
          </div>
          
          {/* Tabela de resultados */}
          {filteredHistorico.length === 0 ? (
            <div className="bg-white p-6 text-center text-gray-500 rounded-md">
              Nenhum registro de abastecimento encontrado.
            </div>
          ) : (
            <div className="bg-white rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Placa
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Motorista
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Litros
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHistorico.slice(0, 15).map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {item.data_hora}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.placa}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {item.nome_motorista}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                        {typeof item.quantidade_litros === 'number' 
                          ? item.quantidade_litros.toFixed(2) 
                          : parseFloat(item.quantidade_litros as string).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        R$ {typeof item.valor_total === 'number' 
                          ? item.valor_total.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) 
                          : parseFloat(item.valor_total as string).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdministrativoPostoView;