import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RefreshCw, Download } from "lucide-react";
import * as XLSX from 'xlsx';
import { Input } from "@/components/ui/input";

interface HistoricoPostoNovoProps {
  posto: string;
  refreshTrigger?: number;
}

interface HistoricoItem {
  id: number;
  placa: string;
  km: number;
  tipo_combustivel: string;
  quantidade_litros: string | number;
  data_hora: string;
  created_at: string;
  valor_total: string | number;
}

const HistoricoPostoNovo: React.FC<HistoricoPostoNovoProps> = ({ 
  posto,
  refreshTrigger = 0
}) => {
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [filteredData, setFilteredData] = useState<HistoricoItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Carregar histórico de abastecimentos
  const loadHistorico = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const timestamp = new Date().getTime();
      const response = await axios.get(`/api/posto-supabase/historico-unificado/${encodeURIComponent(posto)}?t=${timestamp}`);
      
      if (response.data && response.data.success) {
        const dados = response.data.data || [];
        setHistorico(dados);
        setFilteredData(dados);
      } else {
        setError(response.data?.error || 'Erro ao carregar o histórico');
      }
    } catch (err: any) {
      console.error('Erro ao carregar histórico:', err);
      setError(`Erro ao carregar histórico: ${err.message || 'Erro desconhecido'}`);
      
      // Log do erro para diagnóstico
      console.log('[HISTÓRICO POSTO NOVO] Erro detalhado:', {
        posto,
        error: err.message,
        status: err.response?.status
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar dados e configurar atualização automática
  useEffect(() => {
    loadHistorico();
    
    const intervalId = setInterval(() => {
      console.log(`Atualizando histórico automaticamente para ${posto}`);
      loadHistorico();
    }, 45000);
    
    return () => clearInterval(intervalId);
  }, [posto, refreshTrigger]);

  // Aplicar filtros quando os critérios mudarem
  useEffect(() => {
    if (!historico.length) {
      setFilteredData([]);
      return;
    }
    
    let results = [...historico];
    
    // Filtrar por termo de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      results = results.filter(item => (
        (item.placa && item.placa.toLowerCase().includes(searchLower)) ||
        (item.tipo_combustivel && item.tipo_combustivel.toLowerCase().includes(searchLower))
      ));
    }
    
    // Filtrar por data inicial
    if (dataInicio) {
      const startDate = new Date(dataInicio);
      startDate.setHours(0, 0, 0, 0);
      
      results = results.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate >= startDate;
      });
    }
    
    // Filtrar por data final
    if (dataFim) {
      const endDate = new Date(dataFim);
      endDate.setHours(23, 59, 59, 999);
      
      results = results.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate <= endDate;
      });
    }
    
    // Ordenar por data (mais recente primeiro)
    results.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    setFilteredData(results);
  }, [historico, searchTerm, dataInicio, dataFim]);

  // Exportar para Excel
  const exportToExcel = () => {
    if (filteredData.length === 0) return;
    
    const workbookData = filteredData.map(item => ({
      'Data/Hora': item.data_hora,
      'Veículo': item.placa,
      'KM': item.km,
      'Combustível': item.tipo_combustivel,
      'Litros': typeof item.quantidade_litros === 'string' 
        ? item.quantidade_litros 
        : item.quantidade_litros.toFixed(2),
      'Valor Total': typeof item.valor_total === 'string'
        ? `R$ ${item.valor_total}`
        : `R$ ${item.valor_total.toFixed(2)}`
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(workbookData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Histórico");
    
    const date = format(new Date(), 'dd-MM-yyyy_HH-mm', {locale: ptBR});
    const fileName = `historico_${posto}_${date}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Calcular estatísticas
  const estatisticas = useMemo(() => {
    if (!filteredData.length) {
      return {
        totalRegistros: 0,
        totalLitros: 0,
        valorTotal: 0,
        veiculosUnicos: 0,
        dieselCount: 0,
        arlaCount: 0
      };
    }
    
    const totalLitros = filteredData.reduce((sum, item) => {
      const litros = typeof item.quantidade_litros === 'string' 
        ? parseFloat(item.quantidade_litros) 
        : (item.quantidade_litros || 0);
      return sum + litros;
    }, 0);
    
    const valorTotal = filteredData.reduce((sum, item) => {
      const valor = typeof item.valor_total === 'string' 
        ? parseFloat(item.valor_total) 
        : (item.valor_total || 0);
      return sum + valor;
    }, 0);
    
    const placasUnicas = new Set(filteredData.map(item => item.placa));
    
    const dieselCount = filteredData.filter(item => 
      item.tipo_combustivel?.toLowerCase().includes('diesel')).length;
    
    const arlaCount = filteredData.filter(item => 
      item.tipo_combustivel?.toLowerCase().includes('arla')).length;
    
    return {
      totalRegistros: filteredData.length,
      totalLitros,
      valorTotal,
      veiculosUnicos: placasUnicas.size,
      dieselCount,
      arlaCount
    };
  }, [filteredData]);

  // Formatar nome do posto para exibição
  const formatarNomePosto = (nome: string) => {
    return nome.replace('_', ' ').toLowerCase();
  };

  return (
    <div className="bg-blue-100 rounded p-3 w-full">
      <div className="mb-2">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-md font-medium">Histórico de Abastecimentos</h3>
            <p className="text-xs text-gray-700">Registros de abastecimento do Posto {formatarNomePosto(posto)}</p>
          </div>
          <div className="flex gap-1">
            <button 
              onClick={loadHistorico}
              className="p-1 bg-blue-300 rounded-md hover:bg-blue-400 flex items-center text-xs"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar
            </button>
            <button 
              onClick={exportToExcel}
              className="p-1 bg-blue-300 rounded-md hover:bg-blue-400 flex items-center text-xs"
            >
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </button>
          </div>
        </div>
        
        <div className="flex gap-2 mt-2">
          <Input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="h-8 w-[120px] text-xs"
          />
          <span className="text-xs self-center">a</span>
          <Input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="h-8 w-[120px] text-xs"
          />
          <div className="ml-auto">
            <Input
              type="search"
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 w-[200px] text-xs"
            />
          </div>
        </div>
      </div>
      
      {/* Cards estatísticos */}
      <div className="grid grid-cols-5 gap-2 mb-2">
        <div className="bg-white p-2 rounded-md text-center">
          <div className="text-xs text-gray-600">Registros</div>
          <div className="font-bold text-blue-800">{estatisticas.totalRegistros}</div>
        </div>
        <div className="bg-green-50 p-2 rounded-md text-center">
          <div className="text-xs text-gray-600">Total de Litros</div>
          <div className="font-bold text-blue-800">{estatisticas.totalLitros.toFixed(0)}</div>
        </div>
        <div className="bg-yellow-50 p-2 rounded-md text-center">
          <div className="text-xs text-gray-600">Valor Total</div>
          <div className="font-bold text-orange-600">
            R$ {estatisticas.valorTotal.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
        </div>
        <div className="bg-blue-50 p-2 rounded-md text-center">
          <div className="text-xs text-gray-600">Veículos</div>
          <div className="font-bold text-blue-800">{estatisticas.veiculosUnicos}</div>
        </div>
        <div className="bg-indigo-50 p-2 rounded-md text-center">
          <div className="text-xs text-gray-600">Diesel</div>
          <div className="font-bold text-blue-800">{estatisticas.dieselCount}</div>
        </div>
        <div className="bg-cyan-50 p-2 rounded-md text-center col-start-5">
          <div className="text-xs text-gray-600">ARLA</div>
          <div className="font-bold text-blue-800">{estatisticas.arlaCount}</div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-3">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
          <p className="text-sm text-gray-500">Carregando histórico...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-2 rounded-md text-sm">
          {error}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-3 text-sm text-gray-500">
          Nenhum registro de abastecimento encontrado.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded">
          <table className="w-full text-xs">
            <thead className="bg-blue-300">
              <tr>
                <th className="px-3 py-1 text-left">Data/Hora</th>
                <th className="px-3 py-1 text-left">Veículo</th>
                <th className="px-3 py-1 text-right">km</th>
                <th className="px-3 py-1 text-center">Combustível</th>
                <th className="px-3 py-1 text-right">Litros</th>
                <th className="px-3 py-1 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.slice(0, 10).map((item, index) => (
                <tr 
                  key={item.id} 
                  className={index % 2 === 0 ? 'bg-white' : 'bg-blue-50'}
                >
                  <td className="px-3 py-1">{item.data_hora}</td>
                  <td className="px-3 py-1 font-medium">{item.placa}</td>
                  <td className="px-3 py-1 text-right">{item.km}</td>
                  <td className="px-3 py-1">
                    <div className="bg-blue-200 rounded-full px-2 py-0.5 text-center mx-auto w-16">
                      {item.tipo_combustivel}
                    </div>
                  </td>
                  <td className="px-3 py-1 text-right">
                    {typeof item.quantidade_litros === 'string' 
                      ? parseFloat(item.quantidade_litros).toFixed(0) 
                      : item.quantidade_litros.toFixed(0)}
                  </td>
                  <td className="px-3 py-1 text-right">
                    R$ {typeof item.valor_total === 'string'
                      ? parseFloat(item.valor_total).toFixed(2)
                      : item.valor_total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HistoricoPostoNovo;