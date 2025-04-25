import React, { useState, useEffect, useCallback } from 'react';
import { deleteRecord, deleteRecords, fetchRecords } from '@/lib/supabase-client';
import SincronizarSupabaseButton from '@/components/posto-remedios/SincronizarSupabaseButton';

interface HistoricoAbastecimentosProps {
  postId: string;
  showLimparButton?: boolean;
  refreshTrigger?: number;
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

const HistoricoAbastecimentos: React.FC<HistoricoAbastecimentosProps> = ({ postId, showLimparButton = true, refreshTrigger = 0 }) => {
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Função para capitalizar a primeira letra
  const formatPosto = (posto: string) => {
    return posto.charAt(0).toUpperCase() + posto.slice(1);
  };
  
  const fetchAbastecimentos = async () => {
    try {
      setIsLoading(true);
      console.log("[FETCH] Buscando abastecimentos para o posto:", postId);
      
      // Verificar se é o posto Remédios para usar o endpoint específico
      const isPostoRemedios = 
        postId.toLowerCase() === 'remédios' || 
        postId.toLowerCase() === 'remedios' ||
        postId.toLowerCase() === 'posto remédios' ||
        postId.toLowerCase() === 'posto remedios';
      
      // Se for o posto Remédios, usar o endpoint específico para ele
      if (isPostoRemedios) {
        try {
          console.log("[FETCH] Usando endpoint específico para Posto Remédios");
          const response = await fetch('/api/posto-remedios-standalone/abastecimentos');
          const data = await response.json();
          
          console.log("[FETCH] Resposta do endpoint do Posto Remédios:", data);
          
          if (data.success && data.data && Array.isArray(data.data)) {
            // Ordenar por data (mais recentes primeiro)
            const resultados = data.data.sort((a: any, b: any) => {
              return new Date(b.created_at || b.data_registro).getTime() - 
                     new Date(a.created_at || a.data_registro).getTime();
            });
            
            console.log("[FETCH] Dados recuperados via endpoint do Posto Remédios:", resultados.length);
            
            // Adaptar o formato dos dados para corresponder ao modelo esperado
            const abastecimentosFormatados = resultados.map((item: any) => ({
              id: item.id,
              placa: item.placa,
              km_atual: item.km,
              tipo_combustivel: item.tipo_combustivel || 'N/A',
              litros: item.quantidade_litros,
              preco_litro: item.valor_litro,
              valor_total: item.valor_total,
              nome_motorista: item.motorista_nome,
              nome_operador: 'Sistema', // Não tem esse campo no modelo específico
              project: item.projeto,
              posto: 'Remédios',
              created_at: item.created_at || item.data_registro
            }));
            
            // Atualizar o estado com os dados
            setAbastecimentos(abastecimentosFormatados as Abastecimento[]);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error("[FETCH] Erro ao buscar pelo endpoint do Posto Remédios:", error);
        }
      }
      
      // Usar o endpoint genérico para abastecimentos (para outros postos)
      try {
        const response = await fetch(`/api/abastecimentos/${postId}`);
        const data = await response.json();
        
        console.log("[FETCH] Resposta do endpoint de abastecimentos:", data);
        
        if (data.success && data.data && Array.isArray(data.data) && data.data.length > 0) {
          // Ordenar por data (mais recentes primeiro)
          const resultados = data.data.sort((a: any, b: any) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
          
          console.log("[FETCH] Dados recuperados via endpoint de abastecimentos:", resultados.length);
          
          // Atualizar o estado com os dados
          setAbastecimentos(resultados as Abastecimento[]);
          setIsLoading(false);
          return;
        } else {
          console.log("[FETCH] Endpoint de abastecimentos não retornou dados, tentando métodos alternativos");
        }
      } catch (error) {
        console.error("[FETCH] Erro ao buscar pelo endpoint de abastecimentos, tentando métodos alternativos:", error);
      }
      
      // Método alternativo 1: Usar API de diagnóstico
      try {
        const response = await fetch(`/api/diagnostico/abastecimentos/${postId}`);
        const data = await response.json();
        
        console.log("[FETCH] Resposta da API de diagnóstico:", data);
        
        if (data.success && data.data && Array.isArray(data.data) && data.data.length > 0) {
          // Ordenar por data (mais recentes primeiro)
          const resultados = data.data.sort((a: any, b: any) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
          
          console.log("[FETCH] Dados recuperados via API de diagnóstico:", resultados.length);
          
          // Atualizar o estado com os dados
          setAbastecimentos(resultados as Abastecimento[]);
          setIsLoading(false);
          return;
        } else {
          console.log("[FETCH] API de diagnóstico não retornou dados, tentando próximo método");
        }
      } catch (error) {
        console.error("[FETCH] Erro ao buscar pela API de diagnóstico, tentando próximo método:", error);
      }
      
      // Método alternativo 2: Buscar pelo Supabase (método anterior)
      const formattedPostName = formatPosto(postId);
      console.log("[FETCH] Tentando via Supabase com nome formatado:", formattedPostName);
      
      const response = await fetchRecords('abastecimentos_postos', {
        filter: { posto: formattedPostName },
        limit: 100
      });
      
      console.log("[FETCH] Resposta da busca via Supabase:", response);
      
      // Processar resultados
      let dadosCombinados: Abastecimento[] = [];
      
      if (response.success && response.data && Array.isArray(response.data)) {
        console.log("[FETCH] Dados recuperados via Supabase:", response.data.length);
        dadosCombinados = response.data;
      }
      
      // Ordenar por data (mais recentes primeiro)
      dadosCombinados.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      console.log("[FETCH] Total de dados combinados:", dadosCombinados.length);
      
      // Atualizar o estado com os dados combinados
      setAbastecimentos(dadosCombinados as Abastecimento[]);
      
      // Verificar se não encontrou nada
      if (dadosCombinados.length === 0) {
        console.log("[FETCH] Nenhum dado recuperado em nenhum método");
      }
    } catch (error) {
      console.error('Erro ao buscar histórico de abastecimentos:', error);
      setAbastecimentos([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Adicionar botão de atualização manual
  const handleAtualizar = useCallback(() => {
    // Exibe um indicador de carregamento
    setIsLoading(true);
    
    // Aguarda um momento para garantir que o estado seja atualizado
    setTimeout(() => {
      fetchAbastecimentos();
    }, 300);
  }, []);
  
  // Efeito para carregar dados iniciais e configurar atualização automática
  useEffect(() => {
    console.log("[HISTORICO] Montando componente - buscando dados");
    fetchAbastecimentos();
    
    // Atualiza os dados a cada 1 minuto
    const interval = setInterval(() => {
      console.log("[HISTORICO] Atualizando dados automaticamente");
      fetchAbastecimentos();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [postId]);
  
  // Efeito para reagir a mudanças no refreshTrigger (atualizações forçadas)
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log("[HISTORICO] Atualizando dados por causa do refreshTrigger:", refreshTrigger);
      fetchAbastecimentos();
    }
  }, [refreshTrigger]);
  
  // Força a atualização ao clicar no botão "Ver Histórico" através da detecção de rota
  useEffect(() => {
    // Verifica se o URL contém um marcador para atualizar o histórico 
    if (window.location.hash === '#historicos-section') {
      console.log("[HISTORICO] Hash detectado - atualizando dados");
      fetchAbastecimentos();
    }
    
    // Observer para detecção de scrolling para a seção de históricos
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            console.log("[HISTORICO] Seção visível - atualizando dados");
            fetchAbastecimentos();
          }
        });
      },
      { threshold: 0.1 } // 10% visível é suficiente para disparar
    );
    
    // Observe a seção de históricos
    const historicosSection = document.getElementById('historicos-section');
    if (historicosSection) {
      observer.observe(historicosSection);
    }
    
    return () => {
      if (historicosSection) {
        observer.unobserve(historicosSection);
      }
    };
  }, []);
  
  const formatarData = (dataString: string) => {
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '-';
    }
  };
  
  const formatarDataHora = (dataString: string) => {
    try {
      const data = new Date(dataString);
      return data.toLocaleString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data e hora:', error);
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
        await deleteRecord('abastecimentos_postos', id);
        
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
        'Litros': item.litros,
        'Preço/L': item.preco_litro ? `R$ ${item.preco_litro.toFixed(2)}` : '-',
        'Valor Total': item.valor_total ? `R$ ${item.valor_total.toFixed(2)}` : '-',
        'Motorista': item.nome_motorista,
        'Operador': item.nome_operador,
        'Projeto': item.project || '-',
        'Posto': item.posto
      }));
      
      // Criar uma nova planilha
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Criar um novo livro
      const workbook = XLSX.utils.book_new();
      
      // Adicionar a planilha ao livro
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Abastecimentos');
      
      // Gerar arquivo e fazer download
      XLSX.writeFile(workbook, `abastecimentos_${formatPosto(postId)}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      
      console.log('Exportação concluída com sucesso');
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      alert('Erro ao exportar dados. Por favor, tente novamente.');
    }
  };
  
  // Filtragem de dados
  const filteredData = Array.isArray(abastecimentos) ? abastecimentos.filter((item) => {
    let passesSearch = true;
    let passesDateFilter = true;
    
    // Verificação de busca por texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      // Uso do optional chaining para evitar erros
      const placaMatch = item?.placa ? item.placa.toLowerCase().includes(term) : false;
      const motoristaMatch = item?.nome_motorista ? item.nome_motorista.toLowerCase().includes(term) : false;
      let projectMatch = false;
      
      if (item?.project) {
        projectMatch = item.project.toLowerCase().includes(term);
      }
      
      passesSearch = placaMatch || motoristaMatch || projectMatch;
    }
    
    // Filtro por data
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
  }) : [];
  
  // Função para limpar todo o histórico de abastecimentos
  const handleLimparHistorico = async () => {
    if (window.confirm('Tem certeza que deseja limpar todo o histórico de abastecimentos? Esta ação não pode ser desfeita.')) {
      try {
        setIsLoading(true);
        console.log("[LIMPAR HISTÓRICO] Iniciando limpeza para o posto:", postId);
        
        // Busca todos os IDs de abastecimentos para este posto
        const response = await fetchRecords('abastecimentos_postos', {
          filter: { posto: formatPosto(postId) }
        });
        
        // Verificar se a resposta foi bem-sucedida e tem dados
        if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
          // Extrai os IDs para excluir
          const ids = response.data.map((reg: any) => reg.id);
          
          // Exclui todos os registros de uma vez
          await deleteRecords('abastecimentos_postos', ids);
          console.log("[LIMPAR HISTÓRICO] Registros excluídos com sucesso");
        } else {
          console.log("[LIMPAR HISTÓRICO] Nenhum registro encontrado para excluir");
        }
        
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
            
            {/* Botão de atualização manual */}
            <button 
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1"
              onClick={handleAtualizar}
              disabled={isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Atualizar
            </button>
            
            {/* Botão de exportação para Excel */}
            <button 
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-1"
              onClick={handleExportarExcel}
              disabled={isLoading || filteredData.length === 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar Excel
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
                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1"
                onClick={handleLimparHistorico}
                disabled={isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Limpar Histórico
              </button>
            )}
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
                  {showLimparButton && <th className="py-3 px-4 text-left font-medium text-gray-600">Ações</th>}
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
                    {showLimparButton && (
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
                    )}
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
