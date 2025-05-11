import React, { useState, useEffect } from 'react';
import { fetchRecords } from '@/lib/supabase-client';
import { format } from 'date-fns';
import { FaGasPump, FaMoneyBillWave, FaCar, FaWater } from 'react-icons/fa';
import { BsFillFuelPumpFill } from 'react-icons/bs';
import { RiOilFill, RiGasStationFill } from 'react-icons/ri';
import { GiGasPump, GiWaterTank } from 'react-icons/gi';

interface Abastecimento {
  id: number;
  placa: string;
  km_atual: number;
  tipo_combustivel: string;
  litros?: number;
  quantidade_litros?: number; // Campo adicionado para compatibilidade com postos_v2
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
      
      // Array para armazenar todos os abastecimentos
      let todosAbastecimentos: Abastecimento[] = [];
      
      // Lista de postos para buscar abastecimentos
      const postos = [
        "osasco_v2",
        "alair_v2",
        "campinas_v2",
        "abc_v2",
        "socorro_v2",
        "sorocaba_v2"
      ];
      
      // Buscar abastecimentos para cada posto
      for (const posto of postos) {
        try {
          console.log(`[FETCH] Buscando abastecimentos do posto ${posto}`);
          
          // Formatar o nome do posto para exibição (ex: "osasco_v2" -> "Posto Osasco V2")
          const postoFormatado = `Posto ${posto.replace('_v2', '').replace('_', ' ').replace(/^\w/, c => c.toUpperCase())} V2`;
          
          // Buscar abastecimentos do posto específico
          const response = await fetch(`/api/abastecimentos/${posto}`);
          if (response.ok) {
            const data = await response.json();
            
            if (data.success && Array.isArray(data.data)) {
              // Adicionar nome do posto a cada registro
              const abastecimentosDoPosto = data.data.map((item: any) => ({
                ...item,
                posto: postoFormatado
              }));
              
              console.log(`[FETCH] Encontrados ${abastecimentosDoPosto.length} abastecimentos para ${postoFormatado}`);
              todosAbastecimentos = [...todosAbastecimentos, ...abastecimentosDoPosto];
            }
          } else {
            console.warn(`[FETCH] Erro ao buscar abastecimentos do posto ${posto}:`, response.status);
          }
        } catch (error) {
          console.error(`[FETCH] Erro ao processar abastecimentos do posto ${posto}:`, error);
        }
      }
      
      // Verificar se precisamos usar API local ou Supabase
      try {
        // 1. Tentar API local first para abastecimentos próprios
        const responsePostosProprios = await fetch('/api/abastecimentos');
        const textData = await responsePostosProprios.text();
        console.log("[FETCH] Resposta bruta da API local (postos próprios):", textData);
        
        if (responsePostosProprios.ok) {
          let data;
          try {
            data = JSON.parse(textData);
            console.log("[FETCH] Dados da API local (postos próprios) parseados:", data);
            
            if (data.success && Array.isArray(data.data)) {
              // Adicionar abastecimentos
              console.log("[FETCH] Adicionando dados da API local:", data.data.length, "registros");
              todosAbastecimentos = [...todosAbastecimentos, ...data.data];
            } else if (Array.isArray(data)) {
              // Caso a API retorne um array diretamente
              console.log("[FETCH] Adicionando array da API local:", data.length, "registros");
              todosAbastecimentos = [...todosAbastecimentos, ...data];
            } else {
              console.log("[FETCH] Formato de dados inesperado da API local:", data);
            }
          } catch (parseError) {
            console.error("[FETCH] Erro ao processar resposta da API local:", parseError);
          }
        } else {
          console.error("[FETCH] API local retornou status:", responsePostosProprios.status);
        }
      } catch (error) {
        console.error("[FETCH] Erro ao buscar abastecimentos próprios:", error);
      }
      
      try {
        // 2. Buscar abastecimentos diretos do Supabase usando a tabela correta 'abastecimentos'
        // (não 'abastecimentos_postos' que não existe)
        const response = await fetchRecords('abastecimentos', {
          limit: 500 // Aumentamos o limite para trazer mais registros
        });
        
        console.log("[FETCH] Resposta do Supabase (abastecimentos externos):", response);
        
        if (response && response.success && Array.isArray(response.data)) {
          console.log("[FETCH] Adicionando dados do Supabase:", response.data.length, "registros");
          // Adicionar os abastecimentos do Supabase
          todosAbastecimentos = [...todosAbastecimentos, ...response.data];
        }
      } catch (supabaseError) {
        console.error("[FETCH] Erro ao buscar abastecimentos do Supabase:", supabaseError);
      }
      
      try {
        // 3. Buscar abastecimentos do PostgreSQL diretamente
        const responsePG = await fetch('/api/abastecimentos/todos');
        const textPG = await responsePG.text();
        console.log("[FETCH] Resposta bruta do PostgreSQL:", textPG);
        
        if (responsePG.ok) {
          let dataPG;
          try {
            dataPG = JSON.parse(textPG);
            console.log("[FETCH] Dados do PostgreSQL parseados:", dataPG);
            
            if (dataPG.success && Array.isArray(dataPG.data)) {
              // Adicionar abastecimentos
              console.log("[FETCH] Adicionando dados do PostgreSQL:", dataPG.data.length, "registros");
              todosAbastecimentos = [...todosAbastecimentos, ...dataPG.data];
            } else if (Array.isArray(dataPG)) {
              // Caso a API retorne um array diretamente
              console.log("[FETCH] Adicionando array do PostgreSQL:", dataPG.length, "registros");
              todosAbastecimentos = [...todosAbastecimentos, ...dataPG];
            } else {
              console.log("[FETCH] Formato de dados inesperado do PostgreSQL:", dataPG);
            }
          } catch (pgParseError) {
            console.error("[FETCH] Erro ao processar resposta do PostgreSQL:", pgParseError);
          }
        } else {
          console.error("[FETCH] API PostgreSQL retornou status:", responsePG.status);
        }
      } catch (pgError) {
        console.error("[FETCH] Erro ao buscar abastecimentos do PostgreSQL:", pgError);
      }
      
      console.log("[FETCH] Total de abastecimentos combinados:", todosAbastecimentos.length);
      
      // Ordenar por data (mais recentes primeiro)
      todosAbastecimentos.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      setAbastecimentos(todosAbastecimentos);
    } catch (error) {
      console.error('Erro geral ao buscar histórico de abastecimentos:', error);
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
  
  const formatarDataHora = (dataString: string) => {
    try {
      if (!dataString) return '-';
      
      const data = new Date(dataString);
      
      // Verifica se a data é válida
      if (isNaN(data.getTime())) {
        console.warn('Data inválida:', dataString);
        return '-';
      }
      
      return format(data, 'dd/MM/yyyy HH:mm:ss');
    } catch (error) {
      console.error('Erro ao formatar data e hora:', error, 'para valor:', dataString);
      return '-';
    }
  };

  const formatarNumero = (valor: number) => {
    try {
      // Corrigir arredondamento para exibir uma casa decimal para litros
      return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(valor || 0);
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

  const handleExportarExcel = async () => {
    try {
      // Importar a biblioteca xlsx dinamicamente
      const XLSX = await import('xlsx');
      
      // Filtrar dados de acordo com a data e busca
      let dadosFiltrados = [...filteredData];
      
      // Preparar os dados para Excel
      const excelData = dadosFiltrados.map(item => ({
        'Data/Hora': formatarDataHora(item.created_at),
        'Placa': item.placa,
        'KM': item.km_atual,
        'Combustível': item.tipo_combustivel,
        'Litros': formatarNumero(item.quantidade_litros || item.litros || 0),
        'Preço/L': item.preco_litro ? `R$ ${item.preco_litro.toFixed(2)}` : ((item as any).valor_litro ? `R$ ${((item as any).valor_litro).toFixed(2)}` : '-'),
        'Valor Total': item.valor_total ? `R$ ${item.valor_total.toFixed(2)}` : '-',
        'Motorista': item.nome_motorista,
        'Operador': item.nome_operador,
        'Projeto': item.project || '-',
        'Posto': item.posto
      }));
      
      // Criar uma nova planilha
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Definir larguras de colunas para melhor visualização
      const wscols = [
        { wch: 20 }, // Data/Hora
        { wch: 10 }, // Placa
        { wch: 8 },  // KM
        { wch: 12 }, // Combustível
        { wch: 8 },  // Litros
        { wch: 10 }, // Preço/L
        { wch: 12 }, // Valor Total
        { wch: 20 }, // Motorista
        { wch: 20 }, // Operador
        { wch: 15 }, // Projeto
        { wch: 15 }  // Posto
      ];
      worksheet['!cols'] = wscols;
      
      // Criar um novo livro
      const workbook = XLSX.utils.book_new();
      
      // Adicionar a planilha ao livro
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Histórico Abastecimentos');
      
      // Gerar arquivo e fazer download
      XLSX.writeFile(workbook, `historico_abastecimentos_geral_${new Date().toISOString().slice(0, 10)}.xlsx`);
      
      console.log('Exportação concluída com sucesso');
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
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

  // Cálculos para os mostradores
  const calcularConsolidado = () => {
    const totalLitros = filteredData.reduce((sum, item) => sum + (item.quantidade_litros || item.litros || 0), 0);
    const totalValor = filteredData.reduce((sum, item) => sum + (item.valor_total || 0), 0);
    
    // Contar postos distintos
    const postos = new Set(filteredData.map(item => item.posto));
    
    // Contar motoristas distintos
    const motoristas = new Set(filteredData.map(item => item.nome_motorista));
    
    // Contar veículos distintos
    const veiculos = new Set(filteredData.map(item => item.placa));
    
    // Lista de tipos de combustível possíveis para verificação abrangente
    const dieselVariations = ['diesel', 's10', 's500', 'comum'];
    const gasolinaVariations = ['gasolina', 'gasol'];
    const alcoolVariations = ['alcool', 'álcool', 'etanol'];
    const arlaVariations = ['arla', 'arl', 'ar32'];
    
    // Função para verificar se o item tem o tipo de combustível específico
    const ehTipoCombustivel = (item: any, variations: string[]) => {
      if (!item.tipo_combustivel) return false;
      const tipo = item.tipo_combustivel.toLowerCase();
      return variations.some((v: string) => tipo.includes(v));
    };
    
    // Cálculos específicos por tipo de combustível com verificação melhorada
    const abastecimentosDiesel = filteredData.filter(item => ehTipoCombustivel(item, dieselVariations));
    const abastecimentosGasolina = filteredData.filter(item => ehTipoCombustivel(item, gasolinaVariations));
    const abastecimentosAlcool = filteredData.filter(item => ehTipoCombustivel(item, alcoolVariations));
    const abastecimentosArla = filteredData.filter(item => ehTipoCombustivel(item, arlaVariations));
    
    // Somas totais de litros (considerando quantidade_litros ou litros, conforme disponível)
    const litrosDiesel = abastecimentosDiesel.reduce((sum, item) => sum + (item.quantidade_litros || item.litros || 0), 0);
    const litrosGasolina = abastecimentosGasolina.reduce((sum, item) => sum + (item.quantidade_litros || item.litros || 0), 0);
    const litrosAlcool = abastecimentosAlcool.reduce((sum, item) => sum + (item.quantidade_litros || item.litros || 0), 0);
    const litrosArla = abastecimentosArla.reduce((sum, item) => sum + (item.quantidade_litros || item.litros || 0), 0);
      
    // Valores por tipo de combustível  
    const valorDiesel = abastecimentosDiesel.reduce((sum, item) => sum + (item.valor_total || 0), 0);
    const valorGasolina = abastecimentosGasolina.reduce((sum, item) => sum + (item.valor_total || 0), 0);
    const valorAlcool = abastecimentosAlcool.reduce((sum, item) => sum + (item.valor_total || 0), 0);
    const valorArla = abastecimentosArla.reduce((sum, item) => sum + (item.valor_total || 0), 0);
    
    // Contagem de veículos por tipo de combustível
    const veiculosDiesel = new Set(abastecimentosDiesel.map(item => item.placa)).size;
    const veiculosGasolina = new Set(abastecimentosGasolina.map(item => item.placa)).size;
    const veiculosAlcool = new Set(abastecimentosAlcool.map(item => item.placa)).size;
    const veiculosArla = new Set(abastecimentosArla.map(item => item.placa)).size;
    
    // Calcular consumo por tipo de combustível
    const consumoPorTipo = filteredData.reduce((acc, item) => {
      const tipo = item.tipo_combustivel || 'Não especificado';
      acc[tipo] = (acc[tipo] || 0) + (item.quantidade_litros || item.litros || 0);
      return acc;
    }, {} as Record<string, number>);
    
    return {
      registros: filteredData.length,
      totalLitros,
      totalValor,
      postos: postos.size,
      motoristas: motoristas.size,
      veiculos: veiculos.size,
      consumoPorTipo,
      // Estatísticas de diesel
      litrosDiesel,
      valorDiesel,
      veiculosDiesel,
      abastecimentosDiesel: abastecimentosDiesel.length,
      // Estatísticas de gasolina
      litrosGasolina,
      valorGasolina,
      veiculosGasolina,
      abastecimentosGasolina: abastecimentosGasolina.length,
      // Estatísticas de álcool
      litrosAlcool,
      valorAlcool,
      veiculosAlcool,
      abastecimentosAlcool: abastecimentosAlcool.length,
      // Estatísticas de arla
      litrosArla,
      valorArla,
      veiculosArla,
      abastecimentosArla: abastecimentosArla.length
    };
  };
  
  const dadosConsolidados = calcularConsolidado();

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
        
        
        {!isLoading && filteredData.length > 0 && (
          <div className="my-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Card de total de litros abastecidos */}
              <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="mr-4 bg-blue-100 p-3 rounded-full">
                    <FaGasPump className="h-6 w-6 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Total de Litros</h3>
                    <p className="text-xl font-bold text-blue-700">{formatarNumero(dadosConsolidados.totalLitros)}</p>
                  </div>
                </div>
              </div>
              
              {/* Card de veículos abastecidos */}
              <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="mr-4 bg-blue-100 p-3 rounded-full">
                    <FaCar className="h-6 w-6 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Veículos Abastecidos</h3>
                    <p className="text-xl font-bold text-blue-700">{dadosConsolidados.veiculos}</p>
                  </div>
                </div>
              </div>
              
              {/* Card de valor total dos abastecimentos */}
              <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="mr-4 bg-blue-100 p-3 rounded-full">
                    <FaMoneyBillWave className="h-6 w-6 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Valor Total</h3>
                    <p className="text-xl font-bold text-blue-700">{formatarPreco(dadosConsolidados.totalValor)}</p>
                  </div>
                </div>
              </div>
              
              {/* Card de registros */}
              <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="mr-4 bg-blue-100 p-3 rounded-full">
                    <BsFillFuelPumpFill className="h-6 w-6 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Abastecimentos</h3>
                    <p className="text-xl font-bold text-blue-700">{dadosConsolidados.registros}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Detalhes por Tipo de Combustível</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Card de diesel */}
              <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="mr-3 bg-blue-100 p-2 rounded-full">
                    <GiGasPump className="h-5 w-5 text-blue-700" />
                  </div>
                  <h3 className="font-medium text-gray-700">Diesel</h3>
                </div>
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-500 text-sm">Litros:</span>
                    <span className="font-bold text-blue-700">{formatarNumero(dadosConsolidados.litrosDiesel)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-500 text-sm">Valor:</span>
                    <span className="font-bold text-blue-700">{formatarPreco(dadosConsolidados.valorDiesel)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Veículos:</span>
                    <span className="font-bold text-blue-700">{dadosConsolidados.veiculosDiesel}</span>
                  </div>
                </div>
              </div>
              
              {/* Card de gasolina */}
              <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="mr-3 bg-blue-100 p-2 rounded-full">
                    <RiGasStationFill className="h-5 w-5 text-blue-700" />
                  </div>
                  <h3 className="font-medium text-gray-700">Gasolina</h3>
                </div>
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-500 text-sm">Litros:</span>
                    <span className="font-bold text-blue-700">{formatarNumero(dadosConsolidados.litrosGasolina)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-500 text-sm">Valor:</span>
                    <span className="font-bold text-blue-700">{formatarPreco(dadosConsolidados.valorGasolina)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Veículos:</span>
                    <span className="font-bold text-blue-700">{dadosConsolidados.veiculosGasolina}</span>
                  </div>
                </div>
              </div>
              
              {/* Card de álcool */}
              <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="mr-3 bg-blue-100 p-2 rounded-full">
                    <RiOilFill className="h-5 w-5 text-blue-700" />
                  </div>
                  <h3 className="font-medium text-gray-700">Álcool</h3>
                </div>
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-500 text-sm">Litros:</span>
                    <span className="font-bold text-blue-700">{formatarNumero(dadosConsolidados.litrosAlcool)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-500 text-sm">Valor:</span>
                    <span className="font-bold text-blue-700">{formatarPreco(dadosConsolidados.valorAlcool)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Veículos:</span>
                    <span className="font-bold text-blue-700">{dadosConsolidados.veiculosAlcool}</span>
                  </div>
                </div>
              </div>
              
              {/* Card de ARLA */}
              <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="mr-3 bg-blue-100 p-2 rounded-full">
                    <GiWaterTank className="h-5 w-5 text-blue-700" />
                  </div>
                  <h3 className="font-medium text-gray-700">ARLA</h3>
                </div>
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-500 text-sm">Litros:</span>
                    <span className="font-bold text-blue-700">{formatarNumero(dadosConsolidados.litrosArla)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-500 text-sm">Valor:</span>
                    <span className="font-bold text-blue-700">{formatarPreco(dadosConsolidados.valorArla)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Veículos:</span>
                    <span className="font-bold text-blue-700">{dadosConsolidados.veiculosArla}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
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
                  {filteredData.map((abast, index) => (
                    <tr key={`${abast.posto}-${abast.id}-${index}`} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4">{formatarData(abast.created_at)}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                          {abast.posto}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">{abast.placa}</td>
                      <td className="py-3 px-4">{formatarNumero(abast.km_atual)}</td>
                      <td className="py-3 px-4">{abast.tipo_combustivel}</td>
                      <td className="py-3 px-4">{formatarNumero(abast.quantidade_litros || abast.litros || 0)}</td>
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