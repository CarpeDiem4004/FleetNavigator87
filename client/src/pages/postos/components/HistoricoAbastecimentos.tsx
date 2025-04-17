import React, { useState, useEffect } from 'react';
import { ENDPOINTS, buscarDadosSupabase } from '@/constants/supabase';
import { deleteRecord, deleteRecords, fetchRecords } from '@/lib/supabase-client';

interface HistoricoAbastecimentosProps {
  postId: string;
}

interface Abastecimento {
  id: number;
  placa: string;
  km_atual: number;
  tipo_combustivel: string;
  litros: number;
  preco_litro?: number;
  valor_total?: number;
  nome_motorista: string;
  nome_operador: string;
  project?: string;
  posto: string;
  created_at: string;
}

const HistoricoAbastecimentos: React.FC<HistoricoAbastecimentosProps> = ({ postId }) => {
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const fetchAbastecimentos = async () => {
    try {
      setIsLoading(true);
      console.log("[FETCH] Buscando abastecimentos para o posto:", postId);
      
      // Usando o cliente Supabase para buscar dados
      const data = await fetchRecords(ENDPOINTS.ABASTECIMENTOS, {
        filterColumn: 'posto',
        filterValue: postId,
        // Removemos ordenação temporariamente devido ao erro de nome de coluna
        limit: 100
      });
      
      console.log("[FETCH] Dados recuperados:", data.length);
      setAbastecimentos(data);
    } catch (error) {
      console.error('Erro ao buscar histórico de abastecimentos:', error);
      setAbastecimentos([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAbastecimentos();
    
    // Atualiza os dados a cada 2 minutos
    const interval = setInterval(() => {
      fetchAbastecimentos();
    }, 120000);
    
    return () => clearInterval(interval);
  }, [postId]);
  
  const formatarData = (dataString: string) => {
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '-';
    }
  };
  
  const formatarNumero = (valor: number) => {
    try {
      return new Intl.NumberFormat('pt-BR').format(Math.round(valor));
    } catch (error) {
      console.error('Erro ao formatar número:', error);
      return '0';
    }
  };
  
  const formatarPreco = (valor?: number) => {
    if (!valor) return '-';
    try {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    } catch (error) {
      console.error('Erro ao formatar preço:', error);
      return '-';
    }
  };
  
  const handleExcluirAbastecimento = async (id: number) => {
    console.log("Chamada função de exclusão para ID:", id);
    
    if (window.confirm('Tem certeza que deseja excluir este registro?')) {
      try {
        setIsDeleting(true);
        console.log("Iniciando exclusão do registro com ID:", id);
        
        // Usando o cliente Supabase para excluir o registro
        await deleteRecord(ENDPOINTS.ABASTECIMENTOS, id);
        
        console.log("Registro excluído com sucesso");
        
        // Atualizar a lista localmente removendo o item excluído
        setAbastecimentos(prev => {
          console.log("Atualizando estado: removendo item com ID", id);
          return prev.filter(item => item.id !== id);
        });
        
        alert('Registro excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir abastecimento:', error);
        alert('Erro ao excluir o registro. Tente novamente.');
      } finally {
        setIsDeleting(false);
      }
    } else {
      console.log("Exclusão cancelada pelo usuário");
    }
  };
  
  const handleExportarExcel = () => {
    // Filtrar dados de acordo com a data e busca
    let dadosFiltrados = [...filteredData];
    
    // Preparar dados para CSV
    const headers = [
      'Data', 'Placa', 'KM', 'Tipo Combustível', 
      'Litros', 'Preço/L', 'Valor Total', 'Motorista', 
      'Operador', 'Projeto', 'Posto'
    ];
    
    const csvData = dadosFiltrados.map(item => [
      formatarData(item.created_at),
      item.placa,
      item.km_atual.toString(),
      item.tipo_combustivel,
      formatarNumero(item.litros),
      item.preco_litro ? item.preco_litro.toFixed(2).replace('.', ',') : '-',
      item.valor_total ? item.valor_total.toFixed(2).replace('.', ',') : '-',
      item.nome_motorista,
      item.nome_operador,
      item.project || '-',
      item.posto
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
      
      // Usa um link temporário para download sem manipulação direta do DOM
      const tempLink = document.createElement('a');
      tempLink.href = url;
      tempLink.setAttribute('download', `abastecimentos_${postId}_${new Date().toISOString().slice(0, 10)}.csv`);
      tempLink.style.position = 'absolute';
      tempLink.style.visibility = 'hidden';
      
      // Evita append/remove que pode causar erros no React
      tempLink.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        })
      );
      
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
  const filteredData = abastecimentos.filter(item => {
    let passesSearch = true;
    let passesDateFilter = true;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const placaMatch = item.placa.toLowerCase().includes(term);
      const motoristaMatch = item.nome_motorista.toLowerCase().includes(term);
      let projectMatch = false;
      
      if (item.project) {
        projectMatch = item.project.toLowerCase().includes(term);
      }
      
      passesSearch = placaMatch || motoristaMatch || projectMatch;
    }
    
    if (dateStart) {
      const startDate = new Date(dateStart);
      passesDateFilter = passesDateFilter && new Date(item.created_at) >= startDate;
    }
    
    if (dateEnd) {
      const endDate = new Date(dateEnd);
      endDate.setHours(23, 59, 59, 999);
      passesDateFilter = passesDateFilter && new Date(item.created_at) <= endDate;
    }
    
    return passesSearch && passesDateFilter;
  });
  
  // Função para limpar todo o histórico de abastecimentos
  const handleLimparHistorico = async () => {
    if (window.confirm('Tem certeza que deseja limpar todo o histórico de abastecimentos? Esta ação não pode ser desfeita.')) {
      try {
        setIsLoading(true);
        console.log("[LIMPAR HISTÓRICO] Iniciando limpeza para o posto:", postId);
        
        // Usando o cliente Supabase para apagar registros com base no filtro de posto
        await deleteRecords(ENDPOINTS.ABASTECIMENTOS, 'posto', postId);
        
        console.log("[LIMPAR HISTÓRICO] Registros excluídos com sucesso");
        
        // Limpa todos os abastecimentos localmente
        setAbastecimentos([]);
        
        alert('Histórico de abastecimentos limpo com sucesso!');
      } catch (error) {
        console.error('Erro ao limpar histórico:', error);
        alert('Erro ao limpar o histórico. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log("[LIMPAR HISTÓRICO] Operação cancelada pelo usuário");
    }
  };
  
  return (
    <div className="w-full">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">Histórico de Abastecimentos</h2>
            
            <button 
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1"
              onClick={handleLimparHistorico}
              disabled={isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Limpar Histórico
            </button>
          </div>
          
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Buscar abastecimentos..."
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
        
        {isLoading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhum abastecimento encontrado.</p>
            {searchTerm && (
              <p className="text-sm mt-2">Tente ajustar o termo de busca.</p>
            )}
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-left font-medium text-gray-600">Data</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600">Veículo</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600">KM</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600">Combustível</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600">Litros</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600">Projeto</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600">Posto</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600">Motorista</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((abast) => (
                  <tr key={abast.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">{formatarData(abast.created_at)}</td>
                    <td className="py-3 px-4 font-medium">{abast.placa}</td>
                    <td className="py-3 px-4">{formatarNumero(abast.km_atual)}</td>
                    <td className="py-3 px-4">{abast.tipo_combustivel}</td>
                    <td className="py-3 px-4">{formatarNumero(abast.litros)}</td>
                    <td className="py-3 px-4">{abast.project || '-'}</td>
                    <td className="py-3 px-4">{abast.posto}</td>
                    <td className="py-3 px-4">{abast.nome_motorista}</td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-1">
                        <button 
                          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                          aria-label="Editar abastecimento"
                        >
                          Editar
                        </button>
                        <button 
                          className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                          onClick={() => {
                            console.log("Botão Excluir clicado para ID:", abast.id);
                            handleExcluirAbastecimento(abast.id);
                          }}
                          disabled={isDeleting}
                          aria-label="Excluir abastecimento"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoricoAbastecimentos;
