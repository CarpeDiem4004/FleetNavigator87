import React, { useState, useEffect } from 'react';
import { ENDPOINTS, buscarDadosSupabase } from '@/constants/supabase';

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
  
  const fetchAbastecimentos = async () => {
    try {
      setIsLoading(true);
      const queryParams = `posto=eq.${postId}&order=created_at.desc&limit=100`;
      const data = await buscarDadosSupabase(ENDPOINTS.ABASTECIMENTOS, queryParams);
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
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };
  
  const formatarNumero = (valor: number) => {
    return new Intl.NumberFormat('pt-BR').format(Math.round(valor));
  };
  
  const formatarPreco = (valor?: number) => {
    if (!valor) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
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
    
    // Criar e download do arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `abastecimentos_${postId}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Filtragem de dados
  const filteredData = abastecimentos.filter(item => {
    let passesSearch = true;
    let passesDateFilter = true;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      passesSearch = 
        item.placa.toLowerCase().includes(term) ||
        item.nome_motorista.toLowerCase().includes(term) ||
        (item.project && item.project.toLowerCase().includes(term));
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
  
  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-4">Histórico de Abastecimentos</h2>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="relative flex-grow">
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
          
          <div className="flex flex-wrap gap-2">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Data Inicial</label>
              <input 
                type="date" 
                className="px-3 py-2 border rounded-lg" 
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Data Final</label>
              <input 
                type="date" 
                className="px-3 py-2 border rounded-lg" 
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
              />
            </div>
            
            <div className="flex items-end">
              <button 
                className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2"
                onClick={handleExportarExcel}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar
              </button>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhum abastecimento encontrado.</p>
            {(searchTerm || dateStart || dateEnd) && (
              <p className="text-sm mt-2">Tente ajustar os filtros de busca.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b text-left">Data</th>
                  <th className="py-2 px-4 border-b text-left">Placa</th>
                  <th className="py-2 px-4 border-b text-left">KM</th>
                  <th className="py-2 px-4 border-b text-left">Tipo</th>
                  <th className="py-2 px-4 border-b text-left">Litros</th>
                  <th className="py-2 px-4 border-b text-left">Projeto</th>
                  <th className="py-2 px-4 border-b text-left">Motorista</th>
                  <th className="py-2 px-4 border-b text-left">Operador</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((abast) => (
                  <tr key={abast.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{formatarData(abast.created_at)}</td>
                    <td className="py-2 px-4 border-b font-medium">{abast.placa}</td>
                    <td className="py-2 px-4 border-b">{formatarNumero(abast.km_atual)}</td>
                    <td className="py-2 px-4 border-b">
                      <span className={"inline-block px-2 py-1 rounded-md " + 
                        (abast.tipo_combustivel === 'Diesel' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-blue-100 text-blue-800')
                      }>
                        {abast.tipo_combustivel}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b font-medium">{formatarNumero(abast.litros)}</td>
                    <td className="py-2 px-4 border-b">{abast.project || '-'}</td>
                    <td className="py-2 px-4 border-b">{abast.nome_motorista}</td>
                    <td className="py-2 px-4 border-b">{abast.nome_operador}</td>
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
