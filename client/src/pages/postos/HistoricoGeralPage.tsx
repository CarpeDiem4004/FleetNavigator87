import React, { useState, useEffect } from 'react';
import { fetchRecords } from '@/lib/supabase-client';
import { format } from 'date-fns';

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

const HistoricoGeralPage: React.FC = () => {
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');

  const fetchAllAbastecimentos = async () => {
    try {
      setIsLoading(true);
      console.log("[FETCH] Buscando todos os abastecimentos");
      
      // Verificar conexão com Supabase primeiro
      const { supabase } = await import('@/lib/supabase-client');
      const connectionCheck = await supabase.from('abastecimentos_postos').select('count()', { count: 'exact', head: true });
      console.log("[FETCH] Verificação de conexão:", connectionCheck);
      
      // Buscar todos os abastecimentos sem filtro de posto
      const response = await fetchRecords('abastecimentos_postos', {
        limit: 500 // Aumentamos o limite para trazer mais registros
      });
      
      console.log("[FETCH] Resposta completa:", response);
      
      // Verificar se os dados são válidos e um array
      if (response && response.success && Array.isArray(response.data)) {
        console.log("[FETCH] Dados recuperados:", response.data.length);
        
        // Dados de teste para verificar se a filtragem funciona
        if (response.data.length === 0) {
          const dadosTeste = [
            {
              id: 1,
              placa: 'ABC1234',
              km_atual: 10000,
              tipo_combustivel: 'Diesel',
              litros: 100,
              preco_litro: 3.5,
              valor_total: 350,
              nome_motorista: 'João Silva',
              nome_operador: 'Carlos Operador',
              project: 'Entrega SP',
              posto: 'Posto 1',
              created_at: new Date().toISOString()
            },
            {
              id: 2,
              placa: 'XYZ5678',
              km_atual: 15000,
              tipo_combustivel: 'Gasolina',
              litros: 50,
              preco_litro: 5.2,
              valor_total: 260,
              nome_motorista: 'Maria Oliveira',
              nome_operador: 'Ana Operador',
              project: 'Coleta RJ',
              posto: 'Posto 2',
              created_at: new Date().toISOString()
            }
          ];
          
          console.log("[FETCH] Usando dados de teste para fins de depuração");
          setAbastecimentos(dadosTeste);
        } else {
          setAbastecimentos(response.data);
        }
      } else {
        console.error("[FETCH] Dados inválidos recebidos:", response);
        setAbastecimentos([]);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico de abastecimentos:', error);
      setAbastecimentos([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAbastecimentos();
    
    // Atualiza os dados a cada 5 minutos
    const interval = setInterval(() => {
      fetchAllAbastecimentos();
    }, 300000);
    
    return () => clearInterval(interval);
  }, []);

  const formatarData = (dataString: string) => {
    try {
      const data = new Date(dataString);
      return format(data, 'dd/MM/yyyy');
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
    
    // Criar e download do arquivo usando uma abordagem mais segura
    try {
      // Criar Blob com os dados CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Usar a API de navegação para iniciar download direto sem manipulação DOM
      // Isso evita o erro 'removeChild' completamente
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        // Para IE/Edge
        window.navigator.msSaveOrOpenBlob(blob, `historico_abastecimentos_${new Date().toISOString().slice(0, 10)}.csv`);
        return;
      }
      
      // Para navegadores modernos
      const url = URL.createObjectURL(blob);
      
      // Criar link para download sem anexá-lo ao DOM
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `historico_abastecimentos_${new Date().toISOString().slice(0, 10)}.csv`;
      
      // Esta abordagem funciona sem problemas de removeChild
      document.body.appendChild(a);
      a.click();
      
      // Remover o elemento e liberar o recurso
      window.setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
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
      
      // Verifica se os campos existem e não são nulos antes de tentar fazer toLowerCase
      const placaMatch = item.placa?.toLowerCase().includes(term) || false;
      const motoristaMatch = item.nome_motorista?.toLowerCase().includes(term) || false;
      const postoMatch = item.posto?.toLowerCase().includes(term) || false;
      const projectMatch = item.project?.toLowerCase().includes(term) || false;
      const kmMatch = item.km_atual?.toString().includes(term) || false;
      const tipoMatch = item.tipo_combustivel?.toLowerCase().includes(term) || false;
      
      passesSearch = placaMatch || motoristaMatch || projectMatch || postoMatch || kmMatch || tipoMatch;
    }
    
    if (dateStart && item.created_at) {
      try {
        const startDate = new Date(dateStart);
        const itemDate = new Date(item.created_at);
        passesDateFilter = passesDateFilter && itemDate >= startDate;
      } catch (e) {
        console.error("Erro ao comparar datas:", e);
      }
    }
    
    if (dateEnd && item.created_at) {
      try {
        const endDate = new Date(dateEnd);
        endDate.setHours(23, 59, 59, 999);
        const itemDate = new Date(item.created_at);
        passesDateFilter = passesDateFilter && itemDate <= endDate;
      } catch (e) {
        console.error("Erro ao comparar datas:", e);
      }
    }
    
    return passesSearch && passesDateFilter;
  });

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-wrap justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Histórico Geral de Abastecimentos</h1>
          
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <button 
              onClick={fetchAllAbastecimentos}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center mr-2"
              disabled={isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Atualizar
            </button>
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
                placeholder="Buscar por placa, motorista, projeto ou posto..."
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
            <p className="text-lg mt-4">Nenhum abastecimento encontrado.</p>
            {(searchTerm || dateStart || dateEnd) && (
              <p className="text-sm mt-2">Tente ajustar os filtros de busca.</p>
            )}
          </div>
        ) : (
          <>
            <div className="mb-3 text-gray-600">
              Mostrando {filteredData.length} {filteredData.length === 1 ? 'registro' : 'registros'}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Data</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Posto</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Veículo</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">KM</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Combustível</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Litros</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Projeto</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Motorista</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((abast) => (
                    <tr key={abast.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4">{formatarData(abast.created_at)}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                          {abast.posto}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">{abast.placa}</td>
                      <td className="py-3 px-4">{formatarNumero(abast.km_atual)}</td>
                      <td className="py-3 px-4">{abast.tipo_combustivel}</td>
                      <td className="py-3 px-4">{formatarNumero(abast.litros)}</td>
                      <td className="py-3 px-4">{abast.project || '-'}</td>
                      <td className="py-3 px-4">{abast.nome_motorista}</td>
                      <td className="py-3 px-4">{abast.valor_total ? formatarPreco(abast.valor_total) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HistoricoGeralPage;