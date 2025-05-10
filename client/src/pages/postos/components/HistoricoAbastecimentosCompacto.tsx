import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RefreshCw, Download } from "lucide-react";

interface HistoricoAbastecimentosCompactoProps {
  posto: string;
  refreshTrigger?: number;
}

interface AbastecimentoItem {
  id: number;
  placa: string;
  km: number;
  tipo_combustivel: string;
  quantidade_litros: string | number;
  data_hora: string;
  created_at: string;
  valor_total: string | number;
}

/**
 * Componente de histórico de abastecimentos com visual compacto
 * Baseado exatamente na imagem de referência
 */
const HistoricoAbastecimentosCompacto: React.FC<HistoricoAbastecimentosCompactoProps> = ({ 
  posto,
  refreshTrigger = 0
}) => {
  const [historico, setHistorico] = useState<AbastecimentoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadHistorico = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const timestamp = new Date().getTime();
      const response = await axios.get(`/api/historico-direto/${encodeURIComponent(posto)}?t=${timestamp}`);
      
      if (response.data && response.data.success) {
        const dados = response.data.data || [];
        setHistorico(dados);
      } else {
        setError(response.data?.error || 'Erro ao carregar o histórico');
      }
    } catch (err: any) {
      console.error('Erro ao carregar histórico:', err);
      setError(`Erro ao carregar histórico: ${err.message}`);
      
      // Tentar a rota alternativa
      try {
        const timestamp = new Date().getTime();
        const fallbackResponse = await axios.get(`/api/posto-supabase/historico/${posto.toLowerCase()}?t=${timestamp}`);
        
        if (fallbackResponse.data && fallbackResponse.data.success) {
          const dados = fallbackResponse.data.data || [];
          setHistorico(dados);
        }
      } catch (fallbackErr) {
        // Manter o erro original
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar dados ao montar o componente
  useEffect(() => {
    loadHistorico();
    
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

  // Ordenar histórico (mais recente primeiro)
  const historicoOrdenado = [...historico].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }).slice(0, 10); // Mostrar apenas os 10 mais recentes

  // Formatar nome do posto para exibição
  const formatarNomePosto = (nome: string) => {
    return nome.toUpperCase().replace('_', ' ');
  };

  return (
    <div className="bg-blue-100 rounded p-2 w-full">
      <div className="mb-2 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-medium">Histórico de Abastecimentos</h3>
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
        <div className="text-center py-2">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
          <p className="text-xs text-gray-500 mt-1">Carregando...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-2 rounded-md text-xs">
          {error}
        </div>
      ) : historico.length === 0 ? (
        <div className="text-center py-2 text-xs text-gray-500">
          Nenhum registro encontrado.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-blue-300">
                <th className="py-1 px-2 text-left border-b border-blue-200">Data/Hora</th>
                <th className="py-1 px-2 text-left border-b border-blue-200">Placa</th>
                <th className="py-1 px-2 text-center border-b border-blue-200">Combustível</th>
                <th className="py-1 px-2 text-right border-b border-blue-200">Litros</th>
                <th className="py-1 px-2 text-right border-b border-blue-200">Valor</th>
              </tr>
            </thead>
            <tbody>
              {historicoOrdenado.map((item) => (
                <tr key={item.id} className="border-b border-blue-50">
                  <td className="py-1 px-2 whitespace-nowrap">{item.data_hora}</td>
                  <td className="py-1 px-2 whitespace-nowrap font-medium">{item.placa}</td>
                  <td className="py-1 px-2 whitespace-nowrap text-center">
                    {item.tipo_combustivel === 'ARLA' ? (
                      <span className="inline-block bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-[10px]">
                        ARLA
                      </span>
                    ) : (
                      <div className="bg-blue-200 rounded-full mx-auto w-12 h-4"></div>
                    )}
                  </td>
                  <td className="py-1 px-2 text-right whitespace-nowrap">
                    {typeof item.quantidade_litros === 'string' 
                      ? parseFloat(item.quantidade_litros).toFixed(2) 
                      : item.quantidade_litros.toFixed(2)}
                  </td>
                  <td className="py-1 px-2 text-right whitespace-nowrap">
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

export default HistoricoAbastecimentosCompacto;