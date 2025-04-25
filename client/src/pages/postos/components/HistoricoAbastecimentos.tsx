import React, { useState, useEffect, useCallback } from 'react';
import SincronizarSupabaseButton from '@/components/posto-remedios/SincronizarSupabaseButton';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface HistoricoAbastecimentosProps {
  postId: string;
  showLimparButton?: boolean;
  refreshTrigger?: number;
}

const HistoricoAbastecimentos: React.FC<HistoricoAbastecimentosProps> = ({ 
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

  // Função para carregar os dados com verificação extra de cache e timestamp único
  const fetchAbastecimentos = useCallback(async () => {
    try {
      // Criar timestamp único para evitar qualquer tipo de caching
      const uniqueTimestamp = `${new Date().getTime()}_${Math.random().toString(36).substring(2, 15)}`;
      console.log(`[HISTÓRICO] Buscando abastecimentos para posto: ${postId}, timestamp único: ${uniqueTimestamp}`);
      setIsLoading(true);
      
      // Usar o timestamp único na requisição
      const url = `/api/abastecimentos/${postId}?t=${uniqueTimestamp}`;
      console.log(`[HISTÓRICO] Fazendo requisição para: ${url}`);
      
      const response = await fetch(url, {
        // Adicionar cabeçalhos para evitar cache
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      // Verificar o tipo de resposta
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const responseData = await response.json();
        
        if (responseData.success) {
          console.log(`[HISTÓRICO] Abastecimentos obtidos com sucesso: ${responseData.data?.length || 0} registros`);
          if (responseData.data?.length > 0) {
            console.log(`[HISTÓRICO] Primeiro abastecimento: ID=${responseData.data[0].id}, Placa=${responseData.data[0].placa}, Data=${responseData.data[0].created_at}`);
          }
          setData(responseData.data || []);
          setFilteredData(responseData.data || []);
        } else {
          console.error("[HISTÓRICO] Erro ao buscar abastecimentos:", responseData.message);
          setData([]);
          setFilteredData([]);
        }
      } else {
        // Não é JSON, provavelmente HTML de erro
        const text = await response.text();
        console.error("[HISTÓRICO] Resposta não-JSON recebida:", text.substring(0, 200) + "...");
        setData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error("[HISTÓRICO] Erro ao carregar abastecimentos:", error);
      setData([]);
      setFilteredData([]);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  // Carregar dados com múltiplas verificações para garantir que os dados estejam atualizados
  useEffect(() => {
    console.log(`[HISTÓRICO] Atualizando histórico de abastecimentos, refreshTrigger = ${refreshTrigger}`);
    // Primeira busca imediata
    fetchAbastecimentos();
    
    // Segunda busca após 1 segundo para garantir que os dados mais recentes sejam obtidos
    const timer1 = setTimeout(() => {
      console.log(`[HISTÓRICO] Primeira verificação adicional após 1 segundo`);
      fetchAbastecimentos();
    }, 1000);
    
    // Terceira busca após 3 segundos para garantir que operações de banco de dados mais lentas terminem
    const timer2 = setTimeout(() => {
      console.log(`[HISTÓRICO] Segunda verificação adicional após 3 segundos`);
      fetchAbastecimentos();
    }, 3000);
    
    // Limpar os timers quando o componente for desmontado ou quando o refreshTrigger mudar
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [fetchAbastecimentos, refreshTrigger]);

  // Efeito para filtrar os dados
  useEffect(() => {
    let results = [...data];
    
    // Filtrar por termo de busca
    if (searchTerm) {
      const terms = searchTerm.toLowerCase().split(' ').filter(t => t);
      results = results.filter(item => {
        return terms.every(term => 
          (item.placa && item.placa.toLowerCase().includes(term)) ||
          (item.nome_motorista && item.nome_motorista.toLowerCase().includes(term)) ||
          (item.tipo_combustivel && item.tipo_combustivel.toLowerCase().includes(term)) ||
          (item.nome_operador && item.nome_operador.toLowerCase().includes(term)) ||
          (item.project && item.project.toLowerCase().includes(term))
        );
      });
    }
    
    // Filtrar por data de início
    if (dateStart) {
      const startDate = new Date(dateStart);
      startDate.setHours(0, 0, 0, 0);
      results = results.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate >= startDate;
      });
    }
    
    // Filtrar por data de fim
    if (dateEnd) {
      const endDate = new Date(dateEnd);
      endDate.setHours(23, 59, 59, 999);
      results = results.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate <= endDate;
      });
    }
    
    setFilteredData(results);
  }, [data, searchTerm, dateStart, dateEnd]);

  // Funções de manipulação
  const handleAtualizar = useCallback(() => {
    console.log('[HISTÓRICO] Atualizando manualmente histórico de abastecimentos');
    setIsLoading(true);
    
    // Primeira busca imediata
    fetchAbastecimentos();
    
    // Série de verificações para garantir que tenhamos os dados mais recentes
    const timer1 = setTimeout(() => {
      console.log('[HISTÓRICO] Primeira verificação adicional após atualização manual');
      fetchAbastecimentos();
    }, 1000);
    
    const timer2 = setTimeout(() => {
      console.log('[HISTÓRICO] Segunda verificação adicional após atualização manual');
      fetchAbastecimentos();
    }, 2500);
    
    const timer3 = setTimeout(() => {
      console.log('[HISTÓRICO] Última verificação adicional após atualização manual');
      fetchAbastecimentos();
      setIsLoading(false); // Garantir que o loading será removido
    }, 4000);
    
    // Limpar os timers para evitar vazamento de memória
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [fetchAbastecimentos]);

  const handleExportarExcel = useCallback(() => {
    if (filteredData.length === 0) return;
    
    const formattedData = filteredData.map(item => ({
      Data: formatarData(item.created_at),
      Hora: format(parseISO(item.created_at), 'HH:mm:ss'),
      Veículo: item.placa,
      Quilometragem: item.km_atual,
      Combustível: item.tipo_combustivel,
      Litros: item.litros,
      'Valor Unitário': item.preco_litro,
      'Valor Total': item.valor_total,
      Motorista: item.nome_motorista,
      Operador: item.nome_operador,
      Projeto: item.project || '',
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
      { wch: 12 },  // Combustível
      { wch: 8 },   // Litros
      { wch: 14 },  // Valor Unitário
      { wch: 14 },  // Valor Total
      { wch: 20 },  // Motorista
      { wch: 20 },  // Operador
      { wch: 15 },  // Projeto
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

  const handleExcluirAbastecimento = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este abastecimento?")) {
      return;
    }
    
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/abastecimentos/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      if (data.success) {
        fetchAbastecimentos();
      } else {
        alert(`Erro ao excluir: ${data.message}`);
      }
    } catch (error) {
      console.error("Erro ao excluir abastecimento:", error);
      alert("Erro ao excluir abastecimento. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLimparHistorico = async () => {
    if (!confirm(`ATENÇÃO: Tem certeza que deseja EXCLUIR TODOS os registros de abastecimento do posto ${postId}?\n\nEsta ação não pode ser desfeita!`)) {
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/abastecimentos/${postId}/limpar`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      if (data.success) {
        alert("Histórico de abastecimentos limpo com sucesso!");
        fetchAbastecimentos();
      } else {
        alert(`Erro ao limpar histórico: ${data.message}`);
      }
    } catch (error) {
      console.error("Erro ao limpar histórico:", error);
      alert("Erro ao limpar histórico. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="w-full">
      <div className="rounded-lg shadow bg-white p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Histórico de Abastecimentos</h2>
            <p className="text-sm text-gray-500">Registros de abastecimentos do Posto {postId}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Botão de atualização manual */}
            <button 
              className="px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-1 transition-colors shadow-sm"
              onClick={handleAtualizar}
              disabled={isLoading}
              title="Atualizar dados"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Atualizar</span>
            </button>
            
            {/* Botão de exportação para Excel */}
            <button 
              className="px-3 py-1.5 text-sm bg-emerald-500 text-white rounded-md hover:bg-emerald-600 flex items-center gap-1 transition-colors shadow-sm"
              onClick={handleExportarExcel}
              disabled={isLoading || filteredData.length === 0}
              title="Exportar para planilha Excel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Excel</span>
            </button>
            
            {/* Botão de sincronização com Supabase */}
            <div className="inline-block">
              <SincronizarSupabaseButton 
                posto={postId} 
                onSyncComplete={handleAtualizar} 
              />
            </div>
            
            {showLimparButton && (
              <button 
                className="px-3 py-1.5 text-sm bg-white border border-red-300 text-red-600 rounded-md hover:bg-red-50 flex items-center gap-1 transition-colors shadow-sm"
                onClick={handleLimparHistorico}
                disabled={isLoading}
                title="Limpar todo o histórico"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Limpar</span>
              </button>
            )}
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar..."
                className="pl-10 pr-4 py-1.5 w-40 md:w-56 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Filtros adicionais - datas */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Data inicial:</label>
            <input
              type="date"
              className="px-3 py-1 text-sm border border-gray-300 rounded-md"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Data final:</label>
            <input
              type="date"
              className="px-3 py-1 text-sm border border-gray-300 rounded-md"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
            <span>Atualizando histórico de abastecimentos...</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhum abastecimento encontrado.</p>
            {searchTerm && (
              <p className="text-sm mt-2">Tente ajustar o termo de busca.</p>
            )}
          </div>
        ) : (
          <div>
            {/* Header com contagem de registros e opção para ver todos */}
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gray-600">
                {filteredData.length} registros encontrados
              </div>
              <div>
                <button 
                  className="text-sm text-blue-600 hover:underline focus:outline-none"
                  onClick={() => document.getElementById('todos-registros')?.scrollIntoView({behavior: 'smooth'})}
                >
                  Ver todos
                </button>
              </div>
            </div>
            
            {/* Tabela principal - mostra apenas 3 registros recentes */}
            <div className="border rounded-lg overflow-hidden mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="py-3 px-4 text-left font-medium text-gray-700">Data</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-700">Veículo</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-700">KM</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-700">Combustível</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-700">Litros</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-700">Valor</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-700">Motorista</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-700">Operador</th>
                    {showLimparButton && <th className="py-3 px-4 text-center font-medium text-gray-700">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Mostrar apenas os 3 registros mais recentes */}
                  {filteredData.slice(0, 3).map((abast) => (
                    <tr key={abast.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm">{formatarDataHora(abast.created_at)}</td>
                      <td className="py-3 px-4 font-medium">{abast.placa}</td>
                      <td className="py-3 px-4 text-sm">{formatarNumero(abast.km_atual)}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          abast.tipo_combustivel === 'Diesel' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {abast.tipo_combustivel}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">{formatarNumero(abast.litros)}</td>
                      <td className="py-3 px-4 text-sm text-right font-medium">
                        {abast.valor_total ? formatarPreco(abast.valor_total) : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm">{abast.nome_motorista}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">{abast.nome_operador}</td>
                      {showLimparButton && (
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center space-x-1">
                            <button 
                              className="p-1.5 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                              aria-label="Editar abastecimento"
                              title="Editar registro"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button 
                              className="p-1.5 text-red-600 rounded-full hover:bg-red-100 transition-colors"
                              onClick={() => {
                                console.log("Botão Excluir clicado para ID:", abast.id);
                                handleExcluirAbastecimento(abast.id);
                              }}
                              disabled={isDeleting}
                              aria-label="Excluir abastecimento"
                              title="Excluir registro"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Área de visualização completa com barra de rolagem */}
            <div id="todos-registros" className="mt-8">
              <h3 className="text-lg font-bold mb-2">Todos os registros</h3>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-auto max-h-96"> {/* Altura máxima com rolagem */}
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-gray-50 z-10">
                      <tr className="border-b border-gray-200">
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Data</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Veículo</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">KM</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Combustível</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Litros</th>
                        <th className="py-3 px-4 text-right font-medium text-gray-700">Valor</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Motorista</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Operador</th>
                        {showLimparButton && <th className="py-3 px-4 text-center font-medium text-gray-700">Ações</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredData.map((abast) => (
                        <tr key={abast.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-sm">{formatarDataHora(abast.created_at)}</td>
                          <td className="py-3 px-4 font-medium">{abast.placa}</td>
                          <td className="py-3 px-4 text-sm">{formatarNumero(abast.km_atual)}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              abast.tipo_combustivel === 'Diesel' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {abast.tipo_combustivel}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm font-medium">{formatarNumero(abast.litros)}</td>
                          <td className="py-3 px-4 text-sm text-right font-medium">
                            {abast.valor_total ? formatarPreco(abast.valor_total) : '-'}
                          </td>
                          <td className="py-3 px-4 text-sm">{abast.nome_motorista}</td>
                          <td className="py-3 px-4 text-sm text-gray-500">{abast.nome_operador}</td>
                          {showLimparButton && (
                            <td className="py-3 px-4 text-center">
                              <div className="flex justify-center space-x-1">
                                <button 
                                  className="p-1.5 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                                  aria-label="Editar abastecimento"
                                  title="Editar registro"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button 
                                  className="p-1.5 text-red-600 rounded-full hover:bg-red-100 transition-colors"
                                  onClick={() => {
                                    console.log("Botão Excluir clicado para ID:", abast.id);
                                    handleExcluirAbastecimento(abast.id);
                                  }}
                                  disabled={isDeleting}
                                  aria-label="Excluir abastecimento"
                                  title="Excluir registro"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoricoAbastecimentos;