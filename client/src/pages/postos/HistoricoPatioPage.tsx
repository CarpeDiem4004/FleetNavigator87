import React, { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { fetchRecords } from '@/lib/supabase-client';
import { useQuery } from '@tanstack/react-query';

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
  nome_motorista?: string;
  nome_operador?: string;
  tipo_movimento?: string;
}

const HistoricoPatioPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');

  // Usar React Query para buscar movimentações de pátio
  const { data: movimentacoes = [], isLoading, refetch } = useQuery<MovimentacaoPatio[]>({
    queryKey: ['/api/patio/movimentacoes'],
    queryFn: async () => {
      console.log("[FETCH] Buscando todas as movimentações de pátio");
      
      // Estratégia 1: Usar endpoint da API (prioridade)
      try {
        const { queryClient } = await import('@/lib/queryClient');
        
        // Buscar dados usando TanStack Query
        const data = await queryClient.fetchQuery({
          queryKey: ['/api/patio/movimentacoes'],
          queryFn: async ({ queryKey }) => {
            const [url] = queryKey;
            const response = await fetch(url as string, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
              },
              credentials: 'include',
            });
            
            if (!response.ok) {
              throw new Error(`Erro HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result && result.success && Array.isArray(result.data)) {
              console.log("[FETCH] Dados recuperados da API consolidada:", result.data.length);
              return result.data;
            }
            
            throw new Error("Formato de resposta inválido da API");
          },
        });
        
        return data;
      } catch (apiError) {
        console.error("[FETCH] Erro ao buscar da API consolidada:", apiError);
      }
      
      // Estratégia 2: Buscar diretamente das tabelas usando o client Supabase
      let resultados: MovimentacaoPatio[] = [];
      
      try {
        // Buscar da tabela principal
        const responsePrincipal = await fetchRecords('movimentacoes_patio', {
          limit: 500,
          order: { column: 'created_at', ascending: false }
        });
        
        if (responsePrincipal && responsePrincipal.success && Array.isArray(responsePrincipal.data)) {
          console.log("[FETCH] Dados recuperados da tabela principal:", responsePrincipal.data.length);
          resultados = [...responsePrincipal.data];
        }
      } catch (principalError) {
        console.error("[FETCH] Erro ao buscar da tabela principal:", principalError);
      }
      
      // Buscar das tabelas específicas dos postos
      try {
        const tabelasPostos = [
          'movimentacoes_patio_alair_v2',
          'movimentacoes_patio_campinas_v2',
          'movimentacoes_patio_guarulhos_v2',
          'movimentacoes_patio_abc_v2',
          'movimentacoes_patio_socorro_v2'
        ];
        
        for (const tabela of tabelasPostos) {
          try {
            const responseEspecifica = await fetchRecords(tabela, {
              limit: 200,
              order: { column: 'created_at', ascending: false }
            });
            
            if (responseEspecifica && responseEspecifica.success && Array.isArray(responseEspecifica.data)) {
              console.log(`[FETCH] Dados recuperados da tabela ${tabela}:`, responseEspecifica.data.length);
              
              // Mapear os dados para o formato padrão
              const dadosFormatados = responseEspecifica.data.map(item => {
                // Adaptar conforme a estrutura de cada tabela
                const formatado: MovimentacaoPatio = {
                  id: item.id,
                  placa: item.placa || '',
                  tipo_veiculo: item.tipo_veiculo || '',
                  motorista: item.motorista || '',
                  nome_motorista: item.nome_motorista || item.motorista || '',
                  nome_operador: item.nome_operador || item.usuario_operador || '',
                  data_entrada: item.data_entrada || item.data_hora || '',
                  data_saida: item.data_saida || null,
                  motivo: item.motivo || item.tipo_movimentacao || '',
                  observacoes: item.observacoes || '',
                  posto: tabela.includes('alair') ? 'Alair_v2' : 
                         tabela.includes('campinas') ? 'Campinas_v2' :
                         tabela.includes('guarulhos') ? 'Guarulhos_v2' :
                         tabela.includes('abc') ? 'ABC_v2' :
                         tabela.includes('socorro') ? 'Socorro_v2' : 
                         tabela.replace('movimentacoes_patio_', ''),
                  created_at: item.created_at || item.data_hora || new Date().toISOString(),
                  tipo_movimento: item.tipo_movimento || item.tipo_movimentacao || ''
                };
                
                return formatado;
              });
              
              resultados = [...resultados, ...dadosFormatados];
            }
          } catch (tabelaError) {
            console.error(`[FETCH] Erro ao buscar dados da tabela ${tabela}:`, tabelaError);
          }
        }
      } catch (tabelasError) {
        console.error('[FETCH] Erro ao buscar tabelas específicas:', tabelasError);
      }
      
      console.log("[FETCH] Total de dados recuperados após plano B:", resultados.length);
      return resultados;
    },
    refetchInterval: 300000, // Refetch a cada 5 minutos
    staleTime: 60000, // Considerar dados "frescos" por 1 minuto
  });

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

  const handleExportarExcel = async () => {
    try {
      // Importar a biblioteca xlsx dinamicamente
      const XLSX = await import('xlsx');
      
      // Filtrar dados de acordo com a data e busca
      let dadosFiltrados = [...filteredData];
      
      // Preparar os dados para Excel com tratamento de exceções e novos campos
      const excelData = dadosFiltrados.map(item => {
        // Tratamento seguro para evitar erros ao calcular dias parado
        let diasNoPatioValue = 0;
        try {
          diasNoPatioValue = calcularDiasParado(item.data_entrada, item.data_saida);
        } catch (e) {
          console.warn('Erro ao calcular dias parado para placa', item.placa, e);
        }
        
        return {
          'Placa': item.placa || 'N/A',
          'Tipo Veículo': item.tipo_veiculo || 'N/A',
          'Motorista': item.nome_motorista || item.motorista || 'N/A',
          'Operador': item.nome_operador || 'N/A',  // Novo campo
          'Posto': item.posto || 'N/A',
          'Data Entrada': formatarData(item.data_entrada),
          'Data Saída': formatarData(item.data_saida),
          'Dias no Pátio': diasNoPatioValue,
          'Status': item.data_saida ? 'Veículo Liberado' : 'No Pátio',
          'Motivo': item.motivo || 'N/A',
          'Observações': item.observacoes || 'N/A',
          'Tipo Movimento': item.tipo_movimento || 'N/A'  // Novo campo
        };
      });
      
      // Criar uma nova planilha
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Definir larguras de colunas para melhor visualização
      const wscols = [
        { wch: 10 }, // Placa
        { wch: 12 }, // Tipo Veículo
        { wch: 20 }, // Motorista
        { wch: 20 }, // Operador
        { wch: 15 }, // Posto
        { wch: 12 }, // Data Entrada
        { wch: 12 }, // Data Saída
        { wch: 12 }, // Dias no Pátio
        { wch: 15 }, // Status
        { wch: 20 }, // Motivo
        { wch: 30 }, // Observações
        { wch: 15 }  // Tipo Movimento
      ];
      worksheet['!cols'] = wscols;
      
      // Criar um novo livro
      const workbook = XLSX.utils.book_new();
      
      // Adicionar a planilha ao livro
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Histórico Pátio');
      
      // Gerar arquivo e fazer download com data e hora para melhor identificação
      const dataHoraExportacao = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
      const fileName = `historico_patio_${dataHoraExportacao}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      console.log('Exportação concluída com sucesso:', fileName);
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      alert('Erro ao exportar dados. Por favor, tente novamente.');
    }
  };

  // Filtragem de dados
  const filteredData = movimentacoes.filter(item => {
    let passesSearch = true;
    let passesDateFilter = true;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      // Busca em vários campos com verificação de null/undefined
      const placaMatch = item.placa?.toLowerCase().includes(term) || false;
      const motoristaMatch = item.motorista?.toLowerCase().includes(term) || false;
      const nomeMotoristaMatch = item.nome_motorista?.toLowerCase().includes(term) || false;
      const postoMatch = item.posto?.toLowerCase().includes(term) || false;
      const motivoMatch = item.motivo?.toLowerCase().includes(term) || false;
      const observacoesMatch = item.observacoes?.toLowerCase().includes(term) || false;
      const tipoVeiculoMatch = item.tipo_veiculo?.toLowerCase().includes(term) || false;
      
      passesSearch = placaMatch || motoristaMatch || nomeMotoristaMatch || 
                    postoMatch || motivoMatch || observacoesMatch || tipoVeiculoMatch;
    }
    
    // Conversão segura de datas
    const getValidDate = (dateStr: string | null): Date | null => {
      if (!dateStr) return null;
      try {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
      } catch (e) {
        console.warn("Data inválida:", dateStr);
        return null;
      }
    };
    
    const dataEntrada = getValidDate(item.data_entrada);
    const dataSaida = getValidDate(item.data_saida);
    
    if (dateStart) {
      const startDate = new Date(dateStart);
      // Se não temos data de entrada válida, não passa no filtro de data de início
      if (!dataEntrada) {
        passesDateFilter = false;
      } else {
        passesDateFilter = passesDateFilter && dataEntrada >= startDate;
      }
    }
    
    if (dateEnd) {
      const endDate = new Date(dateEnd);
      endDate.setHours(23, 59, 59, 999);
      
      // Se tem data de saída válida, verificamos se está dentro do período
      // Se não tem data de saída (ainda está no pátio), verificamos se a entrada foi antes do fim do período
      if (dataSaida) {
        passesDateFilter = passesDateFilter && dataSaida <= endDate;
      } else if (dataEntrada) {
        passesDateFilter = passesDateFilter && dataEntrada <= endDate;
      } else {
        // Se não temos nem data de entrada nem saída válidas, não passa no filtro
        passesDateFilter = false;
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