import React, { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { fetchRecords } from '@/lib/supabaseClient';
import * as XLSX from 'xlsx';
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

  // Exemplo para depuração local
  const dadosExemplo: MovimentacaoPatio[] = [
    {
      id: 1,
      placa: "ABC1234",
      tipo_veiculo: "Van",
      motorista: "João Silva",
      data_entrada: "2025-05-01T08:00:00Z",
      data_saida: null,
      motivo: "Entrada para pernoite",
      observacoes: "Veículo com carga",
      posto: "Campinas_v2",
      created_at: "2025-05-01T08:00:00Z",
      nome_motorista: "João Silva",
      nome_operador: "Operador 1",
      tipo_movimento: "Entrada"
    },
    {
      id: 2,
      placa: "DEF5678",
      tipo_veiculo: "Truck",
      motorista: "Maria Souza",
      data_entrada: "2025-05-01T09:30:00Z",
      data_saida: "2025-05-01T17:45:00Z",
      motivo: "Manutenção",
      observacoes: "Troca de pneus",
      posto: "Alair_v2",
      created_at: "2025-05-01T09:30:00Z",
      nome_motorista: "Maria Souza",
      nome_operador: "Operador 2",
      tipo_movimento: "Manutenção"
    },
    {
      id: 3,
      placa: "GHI9012",
      tipo_veiculo: "Fiorino",
      motorista: "Pedro Santos",
      data_entrada: "2025-05-02T10:15:00Z",
      data_saida: null,
      motivo: "Abastecimento",
      observacoes: "",
      posto: "Guarulhos_v2",
      created_at: "2025-05-02T10:15:00Z",
      nome_motorista: "Pedro Santos",
      nome_operador: "Operador 3",
      tipo_movimento: "Abastecimento"
    }
  ];

  // Usar React Query para buscar movimentações de pátio
  const { data: movimentacoes = dadosExemplo, isLoading, refetch } = useQuery<MovimentacaoPatio[]>({
    queryKey: ['/api/patio/movimentacoes'],
    queryFn: async () => {
      console.log("[FETCH] Buscando todas as movimentações de pátio");
      
      try {
        const response = await fetch('/api/patio/movimentacoes', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
          },
          credentials: 'include',
        });
        
        if (!response.ok) {
          console.error("[FETCH] Erro na resposta:", response.status);
          return dadosExemplo; // Usar dados de exemplo para desenvolvimento
        }
        
        const result = await response.json();
        
        if (result && result.success && Array.isArray(result.data)) {
          console.log("[FETCH] Dados recuperados da API consolidada:", result.data.length);
          // Se a API retornar dados vazios, usar dados de exemplo para desenvolvimento
          return result.data.length > 0 ? result.data : dadosExemplo;
        } else {
          console.error("[FETCH] Formato de resposta inválido:", result);
          return dadosExemplo; // Usar dados de exemplo para desenvolvimento
        }
      } catch (apiError) {
        console.error("[FETCH] Erro ao buscar da API consolidada:", apiError);
        return dadosExemplo; // Usar dados de exemplo para desenvolvimento
      }
    },
    refetchInterval: 300000, // Refetch a cada 5 minutos
    staleTime: 60000, // Considerar dados "frescos" por 1 minuto
  });

  const formatarData = (dataString: string | null) => {
    if (!dataString) return '-';
    try {
      const data = new Date(dataString);
      if (isNaN(data.getTime())) return '-';
      return format(data, 'dd/MM/yyyy HH:mm');
    } catch (e) {
      console.error("Erro ao formatar data:", e);
      return '-';
    }
  };

  // Função para obter uma data válida ou undefined
  const getValidDate = (dateString: string): Date | undefined => {
    try {
      if (!dateString) return undefined;
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? undefined : date;
    } catch (error) {
      console.error("Erro ao converter data:", error);
      return undefined;
    }
  };
  
  // Calcula dias parado
  const calcularDiasParado = (dataEntrada: string, dataSaida: string | null) => {
    try {
      const entrada = new Date(dataEntrada);
      const saida = dataSaida ? new Date(dataSaida) : new Date();
      
      if (isNaN(entrada.getTime())) return '-';
      if (isNaN(saida.getTime())) return '-';
      
      const dias = Math.ceil(differenceInDays(saida, entrada));
      return dias;
    } catch (error) {
      console.error("Erro ao calcular dias parado:", error);
      return '-';
    }
  };

  // Exportar para Excel
  const handleExportarExcel = () => {
    try {
      console.log("Iniciando exportação para Excel...");
      
      // Criar uma planilha do Excel
      const workbook = XLSX.utils.book_new();
      
      // Convertemos os dados para um formato adequado para Excel
      const dadosParaExcel = filteredData.map(item => ({
        Placa: item.placa || '',
        'Tipo de Veículo': item.tipo_veiculo || '',
        Motorista: item.nome_motorista || item.motorista || '',
        Operador: item.nome_operador || '',
        Posto: item.posto || '',
        'Data Entrada': formatarData(item.data_entrada),
        'Data Saída': formatarData(item.data_saida),
        'Dias no Pátio': calcularDiasParado(item.data_entrada, item.data_saida),
        Motivo: item.motivo || '',
        'Tipo Movimento': item.tipo_movimento || '',
        Observações: item.observacoes || ''
      }));
      
      // Criar uma planilha com os dados
      const worksheet = XLSX.utils.json_to_sheet(dadosParaExcel);
      
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

  // Filtrar dados com base na pesquisa e datas
  const filteredData = Array.isArray(movimentacoes) ? movimentacoes.filter(item => {
    // 1. Filtro por texto
    const searchFields = [
      item.placa, 
      item.motorista, 
      item.nome_motorista,
      item.posto, 
      item.motivo, 
      item.tipo_veiculo,
      item.observacoes,
      item.tipo_movimento
    ].filter(Boolean).map(s => s?.toLowerCase() || '');
    
    const searchLower = searchTerm.toLowerCase();
    const passesSearch = searchTerm === '' || searchFields.some(field => field.includes(searchLower));
    
    // 2. Filtro por intervalo de datas
    let passesDateFilter = true;
    
    if (dateStart || dateEnd) {
      const startDate = getValidDate(dateStart);
      const endDate = getValidDate(dateEnd);
      
      const dataEntrada = getValidDate(item.data_entrada);
      const dataSaida = getValidDate(item.data_saida || '');
      
      if (dataEntrada) {
        // Filtro por data de entrada
        if (startDate) {
          passesDateFilter = passesDateFilter && dataEntrada >= startDate;
        }
        
        if (endDate) {
          passesDateFilter = passesDateFilter && dataEntrada <= endDate;
        }
      } else {
        // Se não temos nem data de entrada nem saída válidas, não passa no filtro
        passesDateFilter = false;
      }
    }
    
    return passesSearch && passesDateFilter;
  }) : [];

  // Debugging dos dados
  console.log('[Debug Histórico] Total de movimentações recebidas:', movimentacoes?.length || 0);
  console.log('[Debug Histórico] Amostra dos dados:', movimentacoes?.slice(0, 2));
  console.log('[Debug Histórico] Total após filtragem:', filteredData.length);
  
  // Separando veículos que ainda estão no pátio (data_saida é null) dos que já saíram
  const veiculosNoPatio = filteredData.filter(item => !item.data_saida);
  const veiculosQueJaSairam = filteredData.filter(item => item.data_saida);
  
  console.log('[Debug Histórico] Veículos no pátio:', veiculosNoPatio.length);
  console.log('[Debug Histórico] Veículos que já saíram:', veiculosQueJaSairam.length);

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
            <input
              type="date"
              className="w-full px-4 py-2 border rounded-lg"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
            />
          </div>
          
          <div className="flex-1 min-w-[280px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
            <input
              type="date"
              className="w-full px-4 py-2 border rounded-lg"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando histórico...</p>
          </div>
        ) : (
          <>
            {/* Dados recebidos */}
            {!movimentacoes || movimentacoes.length === 0 ? (
              <div className="text-center py-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum dado encontrado</h3>
                <p className="text-gray-600">
                  Não foram encontrados registros de movimentações de pátio no sistema.
                </p>
                <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-md inline-block">
                  <p>Status da API: {movimentacoes ? 'Dados recebidos (vazios)' : 'Nenhum dado recebido'}</p>
                </div>
              </div>
            ) : (
              <>
                {/* Veículos atuais no pátio */}
                <div className="mb-10">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Veículos Atualmente no Pátio ({veiculosNoPatio.length})</h2>
                  {veiculosNoPatio.length === 0 ? (
                    <p className="text-gray-500 py-4">Não há veículos no pátio que correspondam aos critérios de filtro.</p>
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
                          {veiculosNoPatio.map((veiculo, index) => (
                            <tr key={`${veiculo.id}-${index}`} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium">{veiculo.placa || 'Sem placa'}</td>
                              <td className="py-3 px-4">{veiculo.tipo_veiculo || '-'}</td>
                              <td className="py-3 px-4">{veiculo.motorista || veiculo.nome_motorista || '-'}</td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                                  {veiculo.posto || 'Indeterminado'}
                                </span>
                              </td>
                              <td className="py-3 px-4">{formatarData(veiculo.data_entrada)}</td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs font-medium">
                                  {calcularDiasParado(veiculo.data_entrada, veiculo.data_saida)} dias
                                </span>
                              </td>
                              <td className="py-3 px-4">{veiculo.motivo || veiculo.tipo_movimento || '-'}</td>
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
                          {veiculosQueJaSairam.map((veiculo, index) => (
                            <tr key={`${veiculo.id}-${index}`} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium">{veiculo.placa || 'Sem placa'}</td>
                              <td className="py-3 px-4">{veiculo.tipo_veiculo || '-'}</td>
                              <td className="py-3 px-4">{veiculo.motorista || veiculo.nome_motorista || '-'}</td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                                  {veiculo.posto || 'Indeterminado'}
                                </span>
                              </td>
                              <td className="py-3 px-4">{formatarData(veiculo.data_entrada)}</td>
                              <td className="py-3 px-4">{formatarData(veiculo.data_saida)}</td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">
                                  {calcularDiasParado(veiculo.data_entrada, veiculo.data_saida)} dias
                                </span>
                              </td>
                              <td className="py-3 px-4">{veiculo.motivo || veiculo.tipo_movimento || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {/* Status da requisição no footer */}
            <div className="mt-6 text-xs text-gray-500">
              Status: {isLoading ? 'Carregando...' : movimentacoes ? `${movimentacoes.length} registros carregados` : 'Nenhum dado carregado'}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HistoricoPatioPage;