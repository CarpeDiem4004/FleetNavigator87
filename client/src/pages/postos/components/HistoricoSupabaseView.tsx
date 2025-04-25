import React, { useState, useEffect, useCallback } from 'react';
import SincronizarSupabaseButton from '@/components/posto-remedios/SincronizarSupabaseButton';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { postoSupabaseService } from '@/services/PostoSupabaseService';

interface HistoricoSupabaseViewProps {
  posto: string;
  showLimparButton?: boolean;
  refreshTrigger?: number;
}

const HistoricoSupabaseView: React.FC<HistoricoSupabaseViewProps> = ({ 
  posto,
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
  const [error, setError] = useState<string | null>(null);

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

  const formatarValor = (valor: number) => {
    if (valor === undefined || valor === null) return '-';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Carregar dados da view consolidada específica do posto
  const fetchHistorico = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`[HISTÓRICO SUPABASE] Buscando histórico para posto: ${posto}`);
      
      const result = await postoSupabaseService.obterHistorico(posto);
      
      if (result.success) {
        console.log(`[HISTÓRICO SUPABASE] Dados obtidos com sucesso: ${result.data.length} registros`);
        if (result.data.length > 0) {
          console.log(`[HISTÓRICO SUPABASE] Primeiro registro: Placa=${result.data[0].placa}, Data=${result.data[0].data_registro || result.data[0].created_at}`);
        }
        setData(result.data);
        setFilteredData(result.data);
      } else {
        console.error('[HISTÓRICO SUPABASE] Erro ao buscar histórico:', result.message);
        setError(result.message || 'Erro ao buscar dados do histórico');
        setData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error('[HISTÓRICO SUPABASE] Erro ao carregar histórico:', error);
      setError('Falha ao carregar os dados. Verifique sua conexão.');
      setData([]);
      setFilteredData([]);
    } finally {
      setIsLoading(false);
    }
  }, [posto]);

  // Carregar dados com múltiplas verificações para garantir que os dados estejam atualizados
  useEffect(() => {
    console.log(`[HISTÓRICO SUPABASE] Atualizando histórico, refreshTrigger = ${refreshTrigger}`);
    // Primeira busca imediata
    fetchHistorico();
    
    // Segunda busca após 1 segundo para garantir que os dados mais recentes sejam obtidos
    const timer = setTimeout(() => {
      console.log('[HISTÓRICO SUPABASE] Executando busca de verificação após delay');
      fetchHistorico();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [fetchHistorico, refreshTrigger]);

  // Filtro combinado (termo de busca e datas)
  useEffect(() => {
    if (!data.length) {
      setFilteredData([]);
      return;
    }

    let result = [...data];

    // Aplicar filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => {
        return (
          (item.placa && item.placa.toLowerCase().includes(term)) ||
          (item.motorista && item.motorista.toLowerCase().includes(term)) ||
          (item.motorista_nome && item.motorista_nome.toLowerCase().includes(term)) ||
          (item.motorista_rg && item.motorista_rg.toLowerCase().includes(term)) ||
          (item.operador && item.operador.toLowerCase().includes(term)) ||
          (item.nome_operador && item.nome_operador.toLowerCase().includes(term)) ||
          (item.tipo_combustivel && item.tipo_combustivel.toLowerCase().includes(term))
        );
      });
    }

    // Aplicar filtro de data inicial
    if (dateStart) {
      const startDate = new Date(dateStart);
      startDate.setHours(0, 0, 0, 0);
      
      result = result.filter(item => {
        const itemDate = item.data_registro || item.created_at;
        if (!itemDate) return true;
        
        const date = new Date(itemDate);
        return date >= startDate;
      });
    }

    // Aplicar filtro de data final
    if (dateEnd) {
      const endDate = new Date(dateEnd);
      endDate.setHours(23, 59, 59, 999);
      
      result = result.filter(item => {
        const itemDate = item.data_registro || item.created_at;
        if (!itemDate) return true;
        
        const date = new Date(itemDate);
        return date <= endDate;
      });
    }

    setFilteredData(result);
  }, [data, searchTerm, dateStart, dateEnd]);

  // Exportar para Excel
  const exportToExcel = () => {
    const exportData = filteredData.map(item => ({
      'Placa': item.placa || '',
      'Data': formatarDataHora(item.data_registro || item.created_at || ''),
      'Hodômetro': item.hodometro_atual || item.km_atual || 0,
      'Combustível': item.tipo_combustivel || '',
      'Litros': item.litros || item.quantidade_litros || item.quantity_litros || 0,
      'Valor Litro': item.valor_litro || item.preco_litro || 0,
      'Valor Total': item.valor_total || 0,
      'Motorista': item.motorista || item.motorista_nome || item.nome_motorista || '',
      'RG Motorista': item.motorista_rg || item.rg_motorista || '',
      'Operador': item.operador || item.nome_operador || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Abastecimentos");
    
    // Ajustar largura das colunas
    const maxWidth = exportData.reduce((width, item) => {
      return Math.max(width, item['Motorista']?.length || 0, item['Placa']?.length || 0);
    }, 10);
    
    worksheet["!cols"] = [
      { width: 10 }, // Placa
      { width: 20 }, // Data
      { width: 10 }, // Hodômetro
      { width: 15 }, // Combustível
      { width: 8 }, // Litros
      { width: 10 }, // Valor Litro
      { width: 10 }, // Valor Total
      { width: maxWidth }, // Motorista
      { width: 15 }, // RG Motorista
      { width: maxWidth } // Operador
    ];
    
    XLSX.writeFile(workbook, `Abastecimentos_${posto}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Histórico de Abastecimentos</h2>
        <div className="flex space-x-2">
          <button
            onClick={exportToExcel}
            disabled={filteredData.length === 0}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Exportar Excel
          </button>
          
          <SincronizarSupabaseButton posto={posto} onSyncComplete={fetchHistorico} />
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar por placa, motorista, RG..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div>
            <label className="block text-sm">Data Inicial:</label>
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm">Data Final:</label>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="px-3 py-2 border rounded"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-100 border border-red-200 text-red-700 rounded">
          <strong>Erro:</strong> {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="sticky top-0 bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">Placa</th>
                <th className="px-4 py-2 border">Data</th>
                <th className="px-4 py-2 border">Hodômetro</th>
                <th className="px-4 py-2 border">Combustível</th>
                <th className="px-4 py-2 border">Litros</th>
                <th className="px-4 py-2 border">Valor/Litro</th>
                <th className="px-4 py-2 border">Valor Total</th>
                <th className="px-4 py-2 border">Motorista</th>
                <th className="px-4 py-2 border">RG</th>
                <th className="px-4 py-2 border">Operador</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={item.id || index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="px-4 py-2 border">{item.placa || '-'}</td>
                  <td className="px-4 py-2 border">{formatarDataHora(item.data_registro || item.created_at || '')}</td>
                  <td className="px-4 py-2 border text-right">{formatarNumero(item.hodometro_atual || item.km_atual || 0)}</td>
                  <td className="px-4 py-2 border">
                    <span 
                      className={`px-2 py-1 rounded ${
                        item.tipo_combustivel?.toLowerCase().includes('diesel') 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : item.tipo_combustivel?.toLowerCase().includes('arla') 
                          ? 'bg-blue-100 text-blue-800'
                          : item.tipo_combustivel?.toLowerCase().includes('gasolina')
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {item.tipo_combustivel || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-2 border text-right">{formatarNumero(item.litros || item.quantidade_litros || item.quantity_litros || 0)}</td>
                  <td className="px-4 py-2 border text-right">{formatarValor(item.valor_litro || item.preco_litro || 0)}</td>
                  <td className="px-4 py-2 border text-right">{formatarValor(item.valor_total || 0)}</td>
                  <td className="px-4 py-2 border">{item.motorista || item.motorista_nome || item.nome_motorista || '-'}</td>
                  <td className="px-4 py-2 border">{item.motorista_rg || item.rg_motorista || '-'}</td>
                  <td className="px-4 py-2 border">{item.operador || item.nome_operador || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 rounded text-center">
          Nenhum abastecimento encontrado.
        </div>
      )}
    </div>
  );
};

export default HistoricoSupabaseView;