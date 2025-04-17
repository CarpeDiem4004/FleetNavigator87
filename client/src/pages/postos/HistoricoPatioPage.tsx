import React, { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { fetchRecords } from '@/lib/supabase-client';

interface MovimentacaoPatio {
  id: number;
  placa: string;
  tipo_veiculo: string;
  motorista: string;
  data_entrada: string;
  data_saida: string | null;
  motivo: string;
  observacoes: string;
  posto: string;
  created_at: string;
}

const HistoricoPatioPage: React.FC = () => {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoPatio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');

  const fetchAllMovimentacoes = async () => {
    try {
      setIsLoading(true);
      console.log("[FETCH] Buscando todas as movimentações de pátio");
      
      // Buscar todas as movimentações sem filtro de posto
      const data = await fetchRecords('movimentacoes_patio', {
        limit: 500 // Aumentamos o limite para trazer mais registros
      });
      
      console.log("[FETCH] Dados recuperados:", data.length);
      setMovimentacoes(data);
    } catch (error) {
      console.error('Erro ao buscar histórico de movimentações de pátio:', error);
      setMovimentacoes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllMovimentacoes();
    
    // Atualiza os dados a cada 5 minutos
    const interval = setInterval(() => {
      fetchAllMovimentacoes();
    }, 300000);
    
    return () => clearInterval(interval);
  }, []);

  const formatarData = (dataString: string | null) => {
    if (!dataString) return '-';
    try {
      const data = new Date(dataString);
      return format(data, 'dd/MM/yyyy');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '-';
    }
  };

  const calcularDiasParado = (dataEntrada: string, dataSaida: string | null) => {
    try {
      const entrada = new Date(dataEntrada);
      const saida = dataSaida ? new Date(dataSaida) : new Date();
      return differenceInDays(saida, entrada);
    } catch (error) {
      console.error('Erro ao calcular dias parado:', error);
      return 0;
    }
  };

  const handleExportarExcel = () => {
    // Filtrar dados de acordo com a data e busca
    let dadosFiltrados = [...filteredData];
    
    // Preparar dados para CSV
    const headers = [
      'Placa', 'Tipo Veículo', 'Motorista', 'Posto', 
      'Data Entrada', 'Data Saída', 'Dias Parado', 
      'Motivo', 'Observações'
    ];
    
    const csvData = dadosFiltrados.map(item => [
      item.placa,
      item.tipo_veiculo || '-',
      item.motorista,
      item.posto,
      formatarData(item.data_entrada),
      formatarData(item.data_saida),
      calcularDiasParado(item.data_entrada, item.data_saida).toString(),
      item.motivo || '-',
      item.observacoes || '-'
    ]);
    
    // Combinar headers e dados
    const csvContent = [
      headers.join(';'),
      ...csvData.map(row => row.join(';'))
    ].join('\n');
    
    // Criar e download do arquivo de forma segura sem manipulação direta do DOM
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Criar um link de download diretamente como um elemento <a> no DOM
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `historico_patio_${new Date().toISOString().slice(0, 10)}.csv`;
      
      // Importante: Não adicionar o elemento ao DOM para evitar falhas de removeChild
      downloadLink.click();
      
      // Libera o URL object para evitar memory leak
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Erro ao criar arquivo para download:', error);
      alert('Erro ao exportar dados. Por favor, tente novamente.');
    }
  };

  // Filtragem de dados
  const filteredData = movimentacoes.filter(item => {
    let passesSearch = true;
    let passesDateFilter = true;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const placaMatch = item.placa.toLowerCase().includes(term);
      const motoristaMatch = item.motorista?.toLowerCase().includes(term) || false;
      const postoMatch = item.posto?.toLowerCase().includes(term) || false;
      const motivoMatch = item.motivo?.toLowerCase().includes(term) || false;
      
      passesSearch = placaMatch || motoristaMatch || postoMatch || motivoMatch;
    }
    
    if (dateStart) {
      const startDate = new Date(dateStart);
      passesDateFilter = passesDateFilter && new Date(item.data_entrada) >= startDate;
    }
    
    if (dateEnd) {
      const endDate = new Date(dateEnd);
      endDate.setHours(23, 59, 59, 999);
      
      // Se tem data de saída, verificamos se está dentro do período
      // Se não tem data de saída (ainda está no pátio), verificamos se a entrada foi antes do fim do período
      if (item.data_saida) {
        passesDateFilter = passesDateFilter && new Date(item.data_saida) <= endDate;
      } else {
        passesDateFilter = passesDateFilter && new Date(item.data_entrada) <= endDate;
      }
    }
    
    return passesSearch && passesDateFilter;
  });

  // Separando veículos que ainda estão no pátio (data_saida é null) dos que já saíram
  const veiculosNoPatio = filteredData.filter(item => !item.data_saida);
  const veiculosQueJaSairam = filteredData.filter(item => item.data_saida);

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-wrap justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Histórico de Veículos no Pátio</h1>
          
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <button 
              onClick={handleExportarExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              disabled={isLoading || filteredData.length === 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar Excel
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex-1 min-w-[280px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por placa, motorista, posto ou motivo..."
                className="w-full px-4 py-2 border rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="flex-1 min-w-[280px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Data inicial</label>
            <input
              type="date"
              className="w-full px-4 py-2 border rounded-lg"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
            />
          </div>
          
          <div className="flex-1 min-w-[280px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Data final</label>
            <input
              type="date"
              className="w-full px-4 py-2 border rounded-lg"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-500">Carregando dados...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg mt-4">Nenhum veículo no pátio encontrado.</p>
            {(searchTerm || dateStart || dateEnd) && (
              <p className="text-sm mt-2">Tente ajustar os filtros de busca.</p>
            )}
          </div>
        ) : (
          <>
            {/* Seção de veículos atualmente no pátio */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Veículos Atualmente no Pátio ({veiculosNoPatio.length})</h2>
              {veiculosNoPatio.length === 0 ? (
                <p className="text-gray-500 py-4">Não há veículos no pátio atualmente.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Placa</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Tipo</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Motorista</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Posto</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Data Entrada</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Dias Parado</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {veiculosNoPatio.map((veiculo) => (
                        <tr key={veiculo.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{veiculo.placa}</td>
                          <td className="py-3 px-4">{veiculo.tipo_veiculo || '-'}</td>
                          <td className="py-3 px-4">{veiculo.motorista}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                              {veiculo.posto}
                            </span>
                          </td>
                          <td className="py-3 px-4">{formatarData(veiculo.data_entrada)}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs font-medium">
                              {calcularDiasParado(veiculo.data_entrada, veiculo.data_saida)} dias
                            </span>
                          </td>
                          <td className="py-3 px-4">{veiculo.motivo || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Histórico (veículos que já saíram) */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Histórico de Saídas ({veiculosQueJaSairam.length})</h2>
              {veiculosQueJaSairam.length === 0 ? (
                <p className="text-gray-500 py-4">Não há histórico de saídas no período filtrado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Placa</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Tipo</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Motorista</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Posto</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Entrada</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Saída</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Dias no Pátio</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {veiculosQueJaSairam.map((veiculo) => (
                        <tr key={veiculo.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{veiculo.placa}</td>
                          <td className="py-3 px-4">{veiculo.tipo_veiculo || '-'}</td>
                          <td className="py-3 px-4">{veiculo.motorista}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                              {veiculo.posto}
                            </span>
                          </td>
                          <td className="py-3 px-4">{formatarData(veiculo.data_entrada)}</td>
                          <td className="py-3 px-4">{formatarData(veiculo.data_saida)}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">
                              {calcularDiasParado(veiculo.data_entrada, veiculo.data_saida)} dias
                            </span>
                          </td>
                          <td className="py-3 px-4">{veiculo.motivo || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HistoricoPatioPage;