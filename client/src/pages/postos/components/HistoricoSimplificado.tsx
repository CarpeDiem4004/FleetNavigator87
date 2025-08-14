import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RefreshCw, Download } from "lucide-react";
import * as XLSX from 'xlsx';

interface HistoricoSimplificadoProps {
  posto: string;
  refreshTrigger?: number;
}

interface HistoricoItem {
  id: number;
  placa: string;
  tipo_combustivel: string;
  quantidade_litros: string | number;
  data_hora: string;
  created_at: string;
  valor_total: string | number;
}

/**
 * Componente simplificado para exibição de histórico de abastecimentos
 * Seguindo exatamente o modelo da imagem de referência
 */
const HistoricoSimplificado: React.FC<HistoricoSimplificadoProps> = ({ 
  posto,
  refreshTrigger = 0
}) => {
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadHistorico = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const timestamp = new Date().getTime();
      const response = await axios.get(`/api/posto-supabase/historico-unificado/${encodeURIComponent(posto)}?t=${timestamp}`);
      
      if (response.data && response.data.success) {
        setHistorico(response.data.data || []);
      } else {
        setError(response.data?.error || 'Erro ao carregar o histórico');
      }
    } catch (err: any) {
      console.error('Erro ao carregar histórico:', err);
      setError(`Erro ao carregar histórico: ${err.message || 'Erro desconhecido'}`);
      
      // Log do erro para diagnóstico
      console.log('[HISTÓRICO SIMPLIFICADO] Erro detalhado:', {
        posto,
        error: err.message,
        status: err.response?.status
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar dados iniciais e configurar atualização automática
  useEffect(() => {
    loadHistorico();
    
    // Atualizar a cada 45 segundos
    const intervalId = setInterval(() => {
      console.log(`Atualizando histórico automaticamente para ${posto}`);
      loadHistorico();
    }, 45000);
    
    return () => clearInterval(intervalId);
  }, [posto, refreshTrigger]);

  // Exportar para Excel
  const exportToExcel = () => {
    if (historico.length === 0) return;
    
    const workbookData = historico.map(item => ({
      'Data/Hora': item.data_hora,
      'Placa': item.placa,
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

  // Formatação do titulo do posto para exibição
  const formatarNomePosto = (nome: string) => {
    return nome.toUpperCase().replace('_', ' ').replace('V2', 'V2');
  };

  const obterUltimosRegistros = () => {
    // Ordenar por data (mais recente primeiro)
    const registrosOrdenados = [...historico].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    // Retornar apenas os 10 mais recentes
    return registrosOrdenados.slice(0, 10);
  };

  return (
    <div className="bg-blue-100 rounded-lg p-3 w-full">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-md font-medium">Histórico de Abastecimentos</h3>
          <p className="text-xs text-gray-600">Últimos registros do posto {formatarNomePosto(posto)}</p>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={loadHistorico}
            className="p-1 bg-blue-300 rounded-md hover:bg-blue-400"
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 text-blue-700" />
          </button>
          <button 
            onClick={exportToExcel}
            className="p-1 bg-blue-300 rounded-md hover:bg-blue-400"
            disabled={historico.length === 0}
          >
            <Download className="h-4 w-4 text-blue-700" />
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Carregando histórico...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-2 rounded-md text-sm">
          {error}
        </div>
      ) : historico.length === 0 ? (
        <div className="text-center py-4 text-sm text-gray-500">
          Nenhum registro de abastecimento encontrado.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-300">
              <tr>
                <th className="px-2 py-1 text-xs text-left whitespace-nowrap">Data/Hora</th>
                <th className="px-2 py-1 text-xs text-left whitespace-nowrap">Placa</th>
                <th className="px-2 py-1 text-xs text-center whitespace-nowrap">Combustível</th>
                <th className="px-2 py-1 text-xs text-right whitespace-nowrap">Litros</th>
                <th className="px-2 py-1 text-xs text-right whitespace-nowrap">Valor</th>
              </tr>
            </thead>
            <tbody>
              {obterUltimosRegistros().map((item, index) => (
                <tr 
                  key={item.id} 
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'}`}
                >
                  <td className="px-2 py-1 text-xs">{item.data_hora}</td>
                  <td className="px-2 py-1 text-xs font-medium">{item.placa}</td>
                  <td className="px-2 py-1 text-xs">
                    <div className="bg-blue-200 rounded-full px-2 py-0.5 text-center text-xs mx-auto w-16">
                      {item.tipo_combustivel}
                    </div>
                  </td>
                  <td className="px-2 py-1 text-xs text-right">
                    {typeof item.quantidade_litros === 'string' 
                      ? parseFloat(item.quantidade_litros).toFixed(2) 
                      : item.quantidade_litros.toFixed(2)}
                  </td>
                  <td className="px-2 py-1 text-xs text-right">
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

export default HistoricoSimplificado;