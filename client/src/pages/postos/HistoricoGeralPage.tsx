import React, { useState, useEffect } from 'react';
import { supabase, fetchRecords } from '@/lib/supabase-compat';
import { format } from 'date-fns';
import { FaGasPump, FaMoneyBillWave, FaCar, FaWater, FaProjectDiagram, FaTruck, FaTrash } from 'react-icons/fa';
import { BsFillFuelPumpFill } from 'react-icons/bs';
import { RiOilFill, RiGasStationFill } from 'react-icons/ri';
import { GiGasPump, GiWaterTank } from 'react-icons/gi';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Building2 } from 'lucide-react';


// Interface para os dados de recebimentos (entradas) de combustível
interface Recebimento {
  id: number;
  tipo_produto: string;
  quantidade: number;
  valor: number;
  fornecedor: string;
  posto: string;
  data_recebimento?: string;
  created_at: string;
  updated_at?: string;
  observacoes?: string;
}

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
  project?: string;  // Nome usado em algumas tabelas
  projeto?: string;  // Nome usado em outras tabelas
  base_name?: string; // Campo para base específica registrada
  posto: string;
  created_at: string;
}

// Interfaces para comparativo de tendências
interface DadoMensal {
  mes: number;
  ano_atual: number;
  ano_anterior: number;
  litros_atual: number;
  litros_anterior: number;
  variacao_litros: number;
  abastecimentos_atual: number;
  abastecimentos_anterior: number;
  variacao_abastecimentos: number;
  valor_atual: number;
  valor_anterior: number;
  variacao_valor: number;
  tendencia_litros: 'alta' | 'baixa' | 'estavel';
  tendencia_abastecimentos: 'alta' | 'baixa' | 'estavel';
}

interface PostoTendencia {
  posto: string;
  posto_nome: string;
  dados_mensais: DadoMensal[];
  total_litros_atual: number;
  total_litros_anterior: number;
  total_abastecimentos_atual: number;
  total_abastecimentos_anterior: number;
}

interface TendenciaResponse {
  success: boolean;
  data: {
    consolidado: DadoMensal[];
    por_posto: PostoTendencia[];
    anos_comparados: number[];
  };
  parametros: {
    ano_atual: number;
    ano_anterior: number;
  };
}

const HistoricoGeralPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Verificar se é admin
  const isAdmin = user?.role === 'admin';
  
  // Log temporário para debug
  console.log('DEBUG - User object:', user, 'isAdmin:', isAdmin);
  
  // Função para obter a base específica registrada ou fazer fallback para mapeamento
  const getBaseFromAbastecimento = (item: any): string => {
    // Prioridade 1: Usar base_name se disponível (base específica registrada)
    if (item.base_name && item.base_name.trim() !== '') {
      console.log(`[BASE_MAPPING] Usando base específica registrada: ${item.base_name}`);
      return item.base_name;
    }
    
    // Prioridade 2: Fallback para mapeamento baseado em posto/projeto (apenas para registros antigos)
    const posto = item.posto || '';
    const projeto = item.project || item.projeto || '';
    
    if (!posto && !projeto) return '-';
    
    const postoLower = posto?.toLowerCase() || '';
    const projectoUpper = projeto?.toUpperCase() || '';
    
    console.log(`[BASE_MAPPING] Fallback - mapeando posto: "${posto}" e projeto: "${projeto}"`);
    
    // Mapeamento de posto para base genérica (apenas para registros antigos sem base_name)
    const postoToBaseMap: Record<string, string> = {
      'posto osasco v2': 'OSASCO',
      'posto abc v2': 'ABC', 
      'posto alair v2': 'ALAIR',
      'posto campinas v2': 'CAMPINAS',
      'posto socorro v2': 'SOCORRO',
      'posto sorocaba v2': 'SOROCABA',
      'posto guarulhos v2': 'GUARULHOS',
      'posto goiania v2': 'GOIÂNIA',
      'posto sao paulo v2': 'SÃO PAULO',
      'posto remedios': 'REMÉDIOS'
    };
    
    let baseEspecifica = postoToBaseMap[postoLower];
    
    if (!baseEspecifica) {
      if (postoLower.includes('osasco')) baseEspecifica = 'OSASCO';
      else if (postoLower.includes('abc')) baseEspecifica = 'ABC';
      else if (postoLower.includes('alair')) baseEspecifica = 'ALAIR';
      else if (postoLower.includes('campinas')) baseEspecifica = 'CAMPINAS';
      else if (postoLower.includes('socorro')) baseEspecifica = 'SOCORRO';
      else if (postoLower.includes('sorocaba')) baseEspecifica = 'SOROCABA';
      else if (postoLower.includes('guarulhos')) baseEspecifica = 'GUARULHOS';
      else if (postoLower.includes('goiania')) baseEspecifica = 'GOIÂNIA';
      else if (postoLower.includes('sao paulo') || postoLower.includes('são paulo')) baseEspecifica = 'SÃO PAULO';
      else if (postoLower.includes('remedios') || postoLower.includes('remédios')) baseEspecifica = 'REMÉDIOS';
    }
    
    if (baseEspecifica) {
      console.log(`[BASE_MAPPING] Base genérica encontrada: ${baseEspecifica}`);
      return baseEspecifica;
    }
    
    console.log(`[BASE_MAPPING] Fallback final: ${projectoUpper || '-'}`);
    return projectoUpper || '-';
  };

  // Implementação local da função fetchRecords para evitar problemas de importação
  const fetchRecords = async (
    table: string,
    options: { 
      columns?: string; 
      filter?: Record<string, any>;
      order?: { column: string; ascending?: boolean };
      limit?: number;
      single?: boolean;
    } = {}
  ): Promise<{ success: boolean; data?: any; error?: any }> => {
    try {
      let query = supabase.from(table).select(options.columns || '*');
      
      // Aplicar filtros
      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (typeof value === 'object' && 'op' in value && 'value' in value) {
              // Filtro avançado com operador personalizado
              const { op, value: filterValue } = value as { op: string; value: any };
              switch (op) {
                case 'eq': query = query.eq(key, filterValue); break;
                case 'neq': query = query.neq(key, filterValue); break;
                case 'gt': query = query.gt(key, filterValue); break;
                case 'gte': query = query.gte(key, filterValue); break;
                case 'lt': query = query.lt(key, filterValue); break;
                case 'lte': query = query.lte(key, filterValue); break;
                case 'like': query = query.like(key, `%${filterValue}%`); break;
                case 'ilike': query = query.ilike(key, `%${filterValue}%`); break;
                case 'in': query = query.in(key, filterValue); break;
                default: query = query.eq(key, filterValue);
              }
            } else {
              // Filtro simples por igualdade
              query = query.eq(key, value);
            }
          }
        });
      }
      
      // Aplicar ordenação
      if (options.order) {
        const { column, ascending = true } = options.order;
        query = query.order(column, { ascending });
      }
      
      // Aplicar limite
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      // Executar a consulta
      const { data, error } = options.single 
        ? await query.single() 
        : await query;
      
      if (error) {
        console.error(`Erro ao buscar registros de ${table}:`, error);
        return { success: false, error };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error(`Exceção ao buscar registros de ${table}:`, error);
      return { success: false, error: error instanceof Error ? error.message : error };
    }
  };
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  
  // Estado para armazenar dados consolidados incluindo recebimentos
  const [dadosConsolidados, setDadosConsolidados] = useState({
    registros: 0,
    totalLitros: 0,
    totalValor: 0,
    postos: 0,
    motoristas: 0,
    veiculos: 0,
    consumoPorTipo: {} as Record<string, number>,
    
    // Dados de diesel
    litrosDiesel: 0,
    valorDiesel: 0,
    veiculosDiesel: 0,
    
    // Dados de gasolina
    litrosGasolina: 0,
    valorGasolina: 0,
    veiculosGasolina: 0,
    
    // Dados de álcool
    litrosAlcool: 0,
    valorAlcool: 0,
    veiculosAlcool: 0,
    
    // Dados de arla
    litrosArla: 0,
    valorArla: 0,
    veiculosArla: 0,
    
    // Dados de recebimentos (entradas)
    litrosRecebidos: 0,
    valorRecebimentos: 0,
    totalRecebimentos: 0,
    
    // Projetos ordenados por consumo
    projetosOrdenados: [] as [string, number][]
  });

  // Estado para armazenar dados de recebimentos
  const [recebimentos, setRecebimentos] = useState<Recebimento[]>([]);

  // Estados para comparativo de tendências
  const [tendenciaData, setTendenciaData] = useState<TendenciaResponse | null>(null);
  const [isLoadingTendencia, setIsLoadingTendencia] = useState(false);
  const [tendenciaError, setTendenciaError] = useState<string | null>(null);
  const [showTendencias, setShowTendencias] = useState(false);

  // Função para buscar dados de tendência
  const fetchTendenciaData = async () => {
    setIsLoadingTendencia(true);
    setTendenciaError(null);
    try {
      // Usar ano atual automaticamente
      const anoAtual = new Date().getFullYear();
      const response = await apiRequest('GET', `/api/abastecimentos/comparativo-tendencia?ano=${anoAtual}`);
      const data = await response.json();
      
      console.log('[TENDÊNCIA] Resposta da API:', data);
      console.log('[TENDÊNCIA] anos_comparados:', data.data?.anos_comparados, 'tipo:', typeof data.data?.anos_comparados);
      
      if (data.success) {
        setTendenciaData(data);
        console.log('[TENDÊNCIA] Dados carregados com sucesso:', {
          consolidado: data.data?.consolidado?.length || 0,
          postos: data.data?.por_posto?.length || 0,
          anos: data.data?.anos_comparados
        });
      } else {
        const errorMsg = data.message || 'Erro na resposta da API';
        setTendenciaError(errorMsg);
        console.error('[TENDÊNCIA] Erro na resposta:', data);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      setTendenciaError(errorMsg);
      console.error('[TENDÊNCIA] Erro ao buscar dados:', error);
    } finally {
      setIsLoadingTendencia(false);
    }
  };

  // Componente para indicador de tendência
  const IndicadorTendencia: React.FC<{ variacao: number; tendencia: string }> = ({ variacao, tendencia }) => {
    const getTendenciaIcon = () => {
      if (tendencia === 'alta') return <TrendingUp className="w-4 h-4 text-green-600" />;
      if (tendencia === 'baixa') return <TrendingDown className="w-4 h-4 text-red-600" />;
      return <Minus className="w-4 h-4 text-gray-600" />;
    };

    const getTendenciaColor = () => {
      if (tendencia === 'alta') return 'bg-green-100 text-green-800 border-green-200';
      if (tendencia === 'baixa') return 'bg-red-100 text-red-800 border-red-200';
      return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium ${getTendenciaColor()}`}>
        {getTendenciaIcon()}
        <span>{variacao > 0 ? '+' : ''}{variacao.toFixed(1)}%</span>
      </div>
    );
  };

  // Arrays de dados para interface
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  // Função para excluir um abastecimento (apenas para admin)
  const handleDeleteAbastecimento = async (abastecimento: Abastecimento) => {
    if (!isAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Apenas administradores podem excluir registros',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir o abastecimento da placa ${abastecimento.placa}?`)) {
      return;
    }

    try {
      // Usar nome original do posto se disponível, senão tentar converter o formatado de volta
      const postoParaAPI = (abastecimento as any).postoOriginal || 
                          abastecimento.posto.toLowerCase()
                            .replace('posto ', '')
                            .replace(' v2', '_v2')
                            .replace(' ', '_');
      
      console.log(`[DELETE] Excluindo abastecimento ID ${abastecimento.id} do posto ${abastecimento.posto} (API: ${postoParaAPI})`);
      
      const response = await apiRequest(
        'DELETE', 
        `/api/abastecimentos/${postoParaAPI}/${abastecimento.id}`
      );

      if (response.ok) {
        const result = await response.json();
        console.log('[DELETE] Sucesso:', result);
        
        // Remover da lista local
        setAbastecimentos(prev => 
          prev.filter(item => !(item.id === abastecimento.id && item.posto === abastecimento.posto))
        );
        
        toast({
          title: 'Abastecimento excluído',
          description: `Registro da placa ${abastecimento.placa} foi removido com sucesso`,
        });
        
        // Atualizar dados - recarregar tudo
        await fetchAllAbastecimentos();
        
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir registro');
      }
    } catch (error) {
      console.error('[DELETE] Erro:', error);
      toast({
        title: 'Erro ao excluir',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };
  
  // Função para buscar recebimentos (entradas) de combustível de todos os postos
  const fetchAllRecebimentos = async () => {
    try {
      console.log("[FETCH] Buscando recebimentos de combustível");
      
      // Array para armazenar todos os recebimentos
      let todosRecebimentos: Recebimento[] = [];
      
      // Lista de postos para buscar recebimentos
      const postos = [
        "osasco_v2",
        "alair_v2",
        "campinas_v2", 
        "abc_v2",
        "socorro_v2",
        "sorocaba_v2",
        "guarulhos_v2"
      ];
      
      // Buscar recebimentos de cada posto
      for (const posto of postos) {
        const { success, data, error } = await fetchRecords(`recebimentos_posto_${posto}`, {
          order: { column: 'created_at', ascending: false }
        });
        
        if (success && data) {
          console.log(`[FETCH] Encontrados ${data.length} recebimentos em ${posto}`);
          
          // Adicionar nome do posto a cada registro e adicionar ao array
          const recebimentosComPosto = data.map((item: any) => ({
            ...item,
            posto: posto
          }));
          
          todosRecebimentos = [...todosRecebimentos, ...recebimentosComPosto];
        } else if (error) {
          console.error(`[FETCH] Erro ao buscar recebimentos de ${posto}:`, error);
        }
      }
      
      // Ordenar por data
      todosRecebimentos.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      console.log(`[FETCH] Total de ${todosRecebimentos.length} recebimentos encontrados`);
      setRecebimentos(todosRecebimentos);
      
      // Recalcular dados consolidados
      return todosRecebimentos;
    } catch (error) {
      console.error("[FETCH] Erro ao buscar recebimentos:", error);
      return [];
    }
  };

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
        "sorocaba_v2",
        "guarulhos_v2"  // Adicionando posto Guarulhos para incluir abastecimentos com projeto MANUTENÇÃO
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
              const abastecimentosDoPosto = data.data.map((item: any, index: number) => {
                // Log para verificar alguns registros de exemplo (apenas os primeiros 3)
                if (index < 3) {
                  console.log(`[DEBUG] Amostra de abastecimento do posto ${posto}:`, {
                    id: item.id,
                    placa: item.placa,
                    project: item.project,
                    litros: item.quantidade_litros || item.litros
                  });
                }
                
                return {
                  ...item,
                  posto: postoFormatado,
                  postoOriginal: posto  // Guardar nome original para operações de backend
                };
              });
              
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
    const carregarDados = async () => {
      try {
        await fetchAllAbastecimentos();
        await fetchAllRecebimentos();
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };
    
    carregarDados();
    
    // Atualiza os dados a cada 5 minutos
    const interval = setInterval(() => {
      fetchAllAbastecimentos();
      fetchAllRecebimentos();
    }, 300000);
    
    return () => clearInterval(interval);
  }, []);

  const formatarData = (dataString: string) => {
    try {
      if (!dataString) return '-';
      const data = new Date(dataString);
      if (isNaN(data.getTime())) return '-';
      
      // Garantir que apenas a data seja mostrada, sem horário
      const dataFormatada = format(data, 'dd/MM/yyyy');
      console.log(`[DEBUG] Formatando data: ${dataString} -> ${dataFormatada}`);
      return dataFormatada;
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
    if (isExporting) return; // Evita cliques múltiplos
    
    try {
      setIsExporting(true);
      
      // Importar a biblioteca xlsx dinamicamente
      const XLSX = await import('xlsx');
      
      // Filtrar dados de acordo com a data e busca
      let dadosFiltrados = [...filteredData];
      
      // Função segura para formatar valores numéricos
      const formatarValorExcel = (valor: any): number => {
        if (valor === null || valor === undefined || isNaN(Number(valor))) {
          return 0;
        }
        return Number(valor);
      };
      
      // Função segura para formatar texto
      const formatarTextoExcel = (texto: any): string => {
        if (texto === null || texto === undefined) {
          return '';
        }
        return String(texto);
      };
      
      console.log(`Preparando exportação para ${dadosFiltrados.length} registros...`);
      
      // Preparar os dados para Excel com tratamento seguro para todos os campos
      const excelData = dadosFiltrados.map(item => {
        try {
          // Garantir valores numéricos válidos
          const kmAtual = formatarValorExcel(item.km_atual);
          const quantidadeLitros = formatarValorExcel(item.quantidade_litros || item.litros);
          const precoLitro = formatarValorExcel(item.preco_litro || (item as any).valor_litro);
          const valorTotal = formatarValorExcel(item.valor_total);
          
          // Garantir valores de texto válidos
          const placa = formatarTextoExcel(item.placa);
          const tipoCombustivel = formatarTextoExcel(item.tipo_combustivel);
          const nomeMotorista = formatarTextoExcel(item.nome_motorista);
          const nomeOperador = formatarTextoExcel(item.nome_operador);
          // Considerar tanto o campo project quanto o campo projeto
          const projeto = formatarTextoExcel(item.project || (item as any).projeto || 'OUTRO');
          const posto = formatarTextoExcel(item.posto);
          
          // Garantir data válida (apenas data, sem horário)
          let dataFormatada = '-';
          try {
            if (item.created_at) {
              const data = new Date(item.created_at);
              if (!isNaN(data.getTime())) {
                dataFormatada = format(data, 'dd/MM/yyyy');
              }
            }
          } catch (e) {
            console.warn('Erro ao formatar data:', e);
          }
          
          // Usar a base específica registrada no abastecimento se disponível
          let baseInfo = getBaseFromAbastecimento(item);
          
          return {
            'Data': dataFormatada,
            'Placa': placa,
            'KM': kmAtual,
            'Combustível': tipoCombustivel,
            'Litros': quantidadeLitros,
            'Preço/L': precoLitro ? `R$ ${precoLitro.toFixed(2)}` : '-',
            'Valor Total': valorTotal ? `R$ ${valorTotal.toFixed(2)}` : '-',
            'Motorista': nomeMotorista,
            'Operador': nomeOperador,
            'Projeto': projeto || '-',
            'Base': baseInfo,
            'Posto': posto
          };
        } catch (itemError) {
          console.error('Erro ao processar item para Excel:', itemError, item);
          // Retorna um objeto com valores padrão em caso de erro
          return {
            'Data': '-',
            'Placa': item.placa || '-',
            'KM': 0,
            'Combustível': '-',
            'Litros': 0,
            'Preço/L': '-',
            'Valor Total': '-',
            'Motorista': '-',
            'Operador': '-',
            'Projeto': '-',
            'Base': '-',
            'Posto': item.posto || '-'
          };
        }
      });
      
      console.log('Criando planilha de Excel...');
      
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
        { wch: 30 }, // Base
        { wch: 15 }  // Posto
      ];
      worksheet['!cols'] = wscols;
      
      // Criar um novo livro
      const workbook = XLSX.utils.book_new();
      
      // Adicionar a planilha ao livro
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Histórico Abastecimentos');
      
      console.log('Exportando arquivo Excel...');
      
      // Gerar arquivo e fazer download
      XLSX.writeFile(workbook, `historico_abastecimentos_geral_${new Date().toISOString().slice(0, 10)}.xlsx`);
      
      console.log('Exportação concluída com sucesso');
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      alert('Erro ao exportar dados. Por favor, tente novamente.');
    } finally {
      setIsExporting(false);
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
      
      // Amplia busca para incluir mais variações do campo projeto (project/projeto)
      const projetoRaw = item.project || item.projeto;
      const projectMatch = projetoRaw ? String(projetoRaw).toLowerCase().includes(term) : false;
      
      const kmMatch = item.km_atual?.toString().includes(term) || false;
      const tipoMatch = item.tipo_combustivel?.toLowerCase().includes(term) || false;
      
      passesSearch = placaMatch || motoristaMatch || projectMatch || postoMatch || kmMatch || tipoMatch;
    }
    
    if (dateStart && item.created_at) {
      try {
        // Criar data do filtro em UTC para evitar problemas de fuso horário
        const [year, month, day] = dateStart.split('-').map(Number);
        const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        
        // Processar data do item
        const itemDate = new Date(item.created_at);
        const itemDateUTC = new Date(Date.UTC(
          itemDate.getFullYear(),
          itemDate.getMonth(),
          itemDate.getDate(),
          0, 0, 0, 0
        ));
        
        const passes = itemDateUTC >= startDate;
        
        // Debug log melhorado
        if (dateStart === '2025-08-02') {
          console.log(`[DATE_FILTER] Data inicial - Item: ${item.created_at} -> ${itemDateUTC.toISOString().split('T')[0]} >= Filtro: ${dateStart} -> ${startDate.toISOString().split('T')[0]} = ${passes}`);
        }
        
        passesDateFilter = passesDateFilter && passes;
      } catch (e) {
        console.error("Erro ao comparar datas:", e);
      }
    }
    
    if (dateEnd && item.created_at) {
      try {
        // Criar data do filtro em UTC
        const [year, month, day] = dateEnd.split('-').map(Number);
        const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
        
        const itemDate = new Date(item.created_at);
        const passes = itemDate <= endDate;
        
        // Debug log melhorado
        if (dateEnd === '2025-08-02') {
          console.log(`[DATE_FILTER] Data final - Item: ${item.created_at} -> ${itemDate.toISOString()} <= Filtro: ${dateEnd} -> ${endDate.toISOString()} = ${passes}`);
        }
        
        passesDateFilter = passesDateFilter && passes;
      } catch (e) {
        console.error("Erro ao comparar datas:", e);
      }
    }
    
    return passesSearch && passesDateFilter;
  });

  // Debug logs para entender o filtro
  React.useEffect(() => {
    if (dateStart || dateEnd) {
      console.log(`[FILTER_DEBUG] ========================================`);
      console.log(`[FILTER_DEBUG] Total abastecimentos: ${abastecimentos.length}, Filtrados: ${filteredData.length}`);
      console.log(`[FILTER_DEBUG] Filtros ativos - Data inicial: ${dateStart || 'não definida'}, Data final: ${dateEnd || 'não definida'}`);
      
      if (abastecimentos.length > 0) {
        const sampleDates = abastecimentos.slice(0, 10).map(item => {
          const itemDate = new Date(item.created_at);
          return {
            id: item.id,
            created_at: item.created_at,
            placa: item.placa,
            formatted_date: itemDate.toLocaleDateString('pt-BR'),
            iso_date: itemDate.toISOString().split('T')[0]
          };
        });
        console.log(`[FILTER_DEBUG] Amostra de 10 registros com datas:`, sampleDates);
        
        // Verificar se há dados para a data específica selecionada
        if (dateStart) {
          const selectedRecords = abastecimentos.filter(item => {
            const itemDate = new Date(item.created_at);
            const itemDateISO = itemDate.toISOString().split('T')[0];
            return itemDateISO === dateStart;
          });
          console.log(`[FILTER_DEBUG] Registros para ${dateStart}: ${selectedRecords.length}`);
          if (selectedRecords.length > 0) {
            console.log(`[FILTER_DEBUG] Primeiros 3 registros da data selecionada:`, selectedRecords.slice(0, 3).map(r => ({
              id: r.id,
              placa: r.placa,
              created_at: r.created_at,
              posto: r.posto
            })));
          }
        }
      }
      console.log(`[FILTER_DEBUG] ========================================`);
    }
  }, [dateStart, dateEnd, abastecimentos.length, filteredData.length]);

  // Cálculos para os mostradores
  const calcularConsolidado = () => {
    // Função para extrair litros com segurança de qualquer formato
    const extrairLitrosSeguro = (item: Abastecimento): number => {
      // Verificar todos os possíveis campos que podem conter quantidade em litros
      const litrosRaw = item.quantidade_litros || item.litros || 0;
      // Converter para número se for string
      const litros = typeof litrosRaw === 'string' ? parseFloat(litrosRaw) : litrosRaw;
      // Retornar 0 se não for um número válido
      return isNaN(litros) ? 0 : litros;
    };
    
    // Calcular total de litros com extração segura
    const totalLitros = filteredData.reduce((sum, item) => sum + extrairLitrosSeguro(item), 0);
    
    // Calcular valor total considerando todos os formatos possíveis
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
    
    // Cálculos para os dados de recebimentos (entradas)
    // Total de litros recebidos
    const litrosRecebidos = recebimentos.reduce((sum, item) => {
      return sum + (item.quantidade || 0);
    }, 0);
    
    // Total do valor dos recebimentos
    const valorRecebimentos = recebimentos.reduce((sum, item) => {
      return sum + (item.valor || 0);
    }, 0);
    
    // Total de recebimentos (contagem)
    const totalRecebimentos = recebimentos.length;
    
    // Somas totais de litros usando a função segura de extração de litros
    const litrosDiesel = abastecimentosDiesel.reduce((sum, item) => sum + extrairLitrosSeguro(item), 0);
    const litrosGasolina = abastecimentosGasolina.reduce((sum, item) => sum + extrairLitrosSeguro(item), 0);
    const litrosAlcool = abastecimentosAlcool.reduce((sum, item) => sum + extrairLitrosSeguro(item), 0);
    const litrosArla = abastecimentosArla.reduce((sum, item) => sum + extrairLitrosSeguro(item), 0);
      
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
    
    // Função para normalizar nomes de projetos
    const normalizarNomeProjeto = (projetoRaw: string | null | undefined): string => {
      if (projetoRaw === null || projetoRaw === undefined || projetoRaw === '' || projetoRaw === '-') {
        return 'OUTRO';
      }
      
      // Converter para string caso seja outro tipo
      let projeto = String(projetoRaw).trim().toUpperCase();
      
      // Verificar se o valor parece ser um número (normalmente seria um código ou string)
      if (projeto && !isNaN(parseFloat(projeto))) {
        console.log("[DEBUG] Projeto com valor numérico:", projeto);
        return 'NÃO ESPECIFICADO';
      }
      
      // Limitar o tamanho da string do projeto para evitar valores muito longos
      if (projeto.length > 100) {
        projeto = projeto.substring(0, 100) + '...';
      }
      
      // Remover valores que parecem ser litros concatenados
      if (projeto.includes('.00')) {
        console.log("[DEBUG] Projeto com formato suspeito de litros:", projeto);
        return 'NÃO ESPECIFICADO';
      }
      
      // Lista de projetos conhecidos para normalizar nomes - atualizada
      const projetosConhecidos = [
        'SHOPEE',
        'MERCADO LIVRE',
        'COCA COLA',
        'GRUPO PEREIRA',
        'MADEIRA MADEIRA',
        'OXXO',
        'MANUTENÇÃO',
        'MAGALU',
        'NATURA',
        'LINE HALL SHOPEE',
        'FULL MELI',
        'PETLOVE',
        'USO OPERACIONAL'
      ];
      
      // Log para diagnóstico
      console.log(`[NORMALIZAÇÃO] Tentando normalizar projeto: "${projeto}"`);
      
      // Verificação específica para "MANUTENÇÃO" com diferentes variações
      if (projeto === "MANUTENÇÃO" || projeto === "MANUTENCAO" || 
          projeto.includes("MANUTEN") || projeto.includes("MANUTEN")) {
        console.log(`[NORMALIZAÇÃO] Correspondência para MANUTENÇÃO: ${projeto}`);
        return "MANUTENÇÃO";
      }
      
      // Verificar se o projeto é similar a algum conhecido
      for (const projetoConhecido of projetosConhecidos) {
        // Verificar similaridade (contém parte do nome ou é muito similar)
        if (
          projeto.includes(projetoConhecido) || 
          projetoConhecido.includes(projeto) ||
          // Para casos como "SHOP", "COCACOLA" etc.
          (projetoConhecido.replace(/\s+/g, '').includes(projeto) || projeto.includes(projetoConhecido.replace(/\s+/g, '')))
        ) {
          console.log(`[NORMALIZAÇÃO] Correspondência para ${projetoConhecido}: ${projeto}`);
          return projetoConhecido;
        }
      }
      
      return projeto;
    };
    
    // Calcular consumo por projeto com tratamento adequado e melhorado
    const consumoPorProjeto = filteredData.reduce((acc, item) => {
      // Unificar campo de projeto (pode estar como project ou projeto dependendo do posto)
      // Verificar todos os possíveis campos que podem conter o nome do projeto
      const projetoRaw = item.project || item.projeto || '';
      
      // Substituir "NÃO ESPECIFICADO" por "OUTRO" e tratar outros casos com normalização
      let projeto = "OUTRO";
      if (projetoRaw && projetoRaw !== "" && projetoRaw !== "NÃO ESPECIFICADO") {
        projeto = normalizarNomeProjeto(projetoRaw);
      }
      
      // Extrair litros com segurança, garantindo que valores numéricos sejam tratados corretamente
      // Usando a mesma lógica da função extrairLitrosSeguro
      const litrosRaw = item.quantidade_litros || item.litros || 0;
      const litros = typeof litrosRaw === 'string' ? parseFloat(litrosRaw) : litrosRaw;
      const litrosValidos = isNaN(litros) ? 0 : litros;
      
      // Log de diagnóstico apenas para valores significativos (mais de 10 litros)
      if (litrosValidos > 10) {
        console.log(`[INFO] Abastecimento computado: ${item.placa} - ${litrosValidos.toFixed(2)}L - Projeto: ${projeto}`);
      }
      
      // Registrar todos os abastecimentos com litros > 0
      if (litrosValidos > 0) {
        acc[projeto] = (acc[projeto] || 0) + litrosValidos;
      }
      
      return acc;
    }, {} as Record<string, number>);
    
    // Log detalhado do consumo por projeto
    console.log("[RELATÓRIO] Total de litros por projeto:", consumoPorProjeto);
    
    // Ordenar projetos por consumo (do maior para o menor)
    const projetosOrdenados = Object.entries(consumoPorProjeto)
      .sort(([, litrosA], [, litrosB]) => litrosB - litrosA)
      .slice(0, 10); // Top 10 projetos
    
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
      abastecimentosArla: abastecimentosArla.length,
      // Estatísticas de recebimentos (entradas)
      litrosRecebidos,
      valorRecebimentos,
      totalRecebimentos,
      // Estatísticas por projeto
      consumoPorProjeto,
      projetosOrdenados
    };
  };
  
  // Atualizar o estado com os dados calculados
  useEffect(() => {
    const dados = calcularConsolidado();
    setDadosConsolidados(prev => ({
      ...prev,
      ...dados
    }));
  }, [abastecimentos]);
  
  // Log para debug da exibição de projetos
  useEffect(() => {
    console.log("[DEBUG] Projetos ordenados:", dadosConsolidados.projetosOrdenados);
    console.log("[DEBUG] Verificando dados dos projetos:", {
      temProjetos: dadosConsolidados.projetosOrdenados && dadosConsolidados.projetosOrdenados.length > 0,
      qtdProjetos: dadosConsolidados.projetosOrdenados ? dadosConsolidados.projetosOrdenados.length : 0,
      tipoVariavel: typeof dadosConsolidados.projetosOrdenados
    });
  }, [dadosConsolidados.projetosOrdenados]);

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
              onClick={() => {
                setShowTendencias(!showTendencias);
                if (!showTendencias && !tendenciaData) {
                  fetchTendenciaData();
                }
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors flex items-center mr-2"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {showTendencias ? 'Ocultar Análise' : 'Análise Tendência'}
            </button>
            <button 
              onClick={handleExportarExcel}
              className={`px-4 py-2 ${isExporting ? 'bg-gray-500 cursor-wait' : 'bg-green-600 hover:bg-green-700'} text-white rounded-md flex items-center`}
              disabled={isLoading || isExporting || filteredData.length === 0}
            >
              {isExporting ? (
                <>
                  <div className="inline-block h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                  Exportando...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Exportar Excel
                </>
              )}
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
        
        {/* Cards Informativos Visuais */}
        {!isLoading && filteredData.length > 0 && (
          <>
            {/* Resumo de Abastecimentos */}
            <div className="my-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">Resumo de Abastecimentos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 font-medium">Litros Abastecidos</p>
                      <p className="text-2xl font-bold text-blue-800">
                        {dadosConsolidados.totalLitros?.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) || '0'}
                      </p>
                    </div>
                    <BsFillFuelPumpFill className="text-blue-500 text-3xl" />
                  </div>
                </div>
                
                <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-700 font-medium">Veículos Abastecidos</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {dadosConsolidados.veiculos || 0}
                      </p>
                    </div>
                    <FaCar className="text-blue-600 text-3xl" />
                  </div>
                </div>
                
                <div className="bg-blue-200 border border-blue-400 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-800 font-medium">Valor Abastecimentos</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {dadosConsolidados.totalValor ? `R$ ${isNaN(dadosConsolidados.totalValor) ? 'NaN' : dadosConsolidados.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'R$ 0,00'}
                      </p>
                    </div>
                    <FaMoneyBillWave className="text-blue-700 text-3xl" />
                  </div>
                </div>
                
                <div className="bg-blue-300 border border-blue-500 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-900 font-medium">Abastecimentos</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {filteredData.length}
                      </p>
                    </div>
                    <BsFillFuelPumpFill className="text-blue-800 text-3xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* Resumo de Recebimentos (Entradas) */}
            <div className="my-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">Resumo de Recebimentos (Entradas)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 font-medium">Litros Recebidos</p>
                      <p className="text-2xl font-bold text-green-800">
                        {dadosConsolidados.litrosRecebidos?.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) || '0,0'}
                      </p>
                    </div>
                    <GiWaterTank className="text-green-500 text-3xl" />
                  </div>
                </div>
                
                <div className="bg-green-100 border border-green-300 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-700 font-medium">Valor Recebimentos</p>
                      <p className="text-2xl font-bold text-green-900">
                        {dadosConsolidados.valorRecebimentos ? `R$ ${dadosConsolidados.valorRecebimentos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'R$ 0,00'}
                      </p>
                    </div>
                    <FaMoneyBillWave className="text-green-600 text-3xl" />
                  </div>
                </div>
                
                <div className="bg-green-200 border border-green-400 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-800 font-medium">Total Recebimentos</p>
                      <p className="text-2xl font-bold text-green-900">
                        {dadosConsolidados.totalRecebimentos || 0}
                      </p>
                    </div>
                    <FaTruck className="text-green-700 text-3xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* Detalhes por Tipo de Combustível */}
            <div className="my-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">Detalhes por Tipo de Combustível</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Diesel */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-blue-800 font-medium">Diesel</h3>
                    <RiOilFill className="text-blue-500 text-2xl" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-blue-600">
                      Litros: <span className="font-semibold">{dadosConsolidados.litrosDiesel?.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) || '0,0'}</span>
                    </p>
                    <p className="text-sm text-blue-600">
                      Valor: <span className="font-semibold">{dadosConsolidados.valorDiesel ? `R$ ${dadosConsolidados.valorDiesel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}</span>
                    </p>
                    <p className="text-sm text-blue-600">
                      Veículos: <span className="font-semibold">{dadosConsolidados.veiculosDiesel || 0}</span>
                    </p>
                  </div>
                </div>
                
                {/* Gasolina */}
                <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-blue-800 font-medium">Gasolina</h3>
                    <RiGasStationFill className="text-blue-600 text-2xl" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-blue-700">
                      Litros: <span className="font-semibold">{dadosConsolidados.litrosGasolina?.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) || '0,0'}</span>
                    </p>
                    <p className="text-sm text-blue-700">
                      Valor: <span className="font-semibold">{dadosConsolidados.valorGasolina ? `R$ ${dadosConsolidados.valorGasolina.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}</span>
                    </p>
                    <p className="text-sm text-blue-700">
                      Veículos: <span className="font-semibold">{dadosConsolidados.veiculosGasolina || 0}</span>
                    </p>
                  </div>
                </div>
                
                {/* Álcool */}
                <div className="bg-blue-200 border border-blue-400 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-blue-800 font-medium">Álcool</h3>
                    <GiGasPump className="text-blue-700 text-2xl" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-blue-800">
                      Litros: <span className="font-semibold">{dadosConsolidados.litrosAlcool?.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) || '0,0'}</span>
                    </p>
                    <p className="text-sm text-blue-800">
                      Valor: <span className="font-semibold">{dadosConsolidados.valorAlcool ? `R$ ${dadosConsolidados.valorAlcool.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}</span>
                    </p>
                    <p className="text-sm text-blue-800">
                      Veículos: <span className="font-semibold">{dadosConsolidados.veiculosAlcool || 0}</span>
                    </p>
                  </div>
                </div>
                
                {/* ARLA */}
                <div className="bg-blue-300 border border-blue-500 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-blue-900 font-medium">ARLA</h3>
                    <FaWater className="text-blue-800 text-2xl" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-blue-900">
                      Litros: <span className="font-semibold">{dadosConsolidados.litrosArla?.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) || '0,0'}</span>
                    </p>
                    <p className="text-sm text-blue-900">
                      Valor: <span className="font-semibold">{dadosConsolidados.valorArla ? `R$ ${dadosConsolidados.valorArla.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}</span>
                    </p>
                    <p className="text-sm text-blue-900">
                      Veículos: <span className="font-semibold">{dadosConsolidados.veiculosArla || 0}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
        {!isLoading && filteredData.length > 0 && (
          <div className="my-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Consumo de Combustível por Projeto</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Card de total de litros abastecidos */}
              <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="mr-4 bg-blue-100 p-3 rounded-full">
                    <FaGasPump className="h-6 w-6 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Litros Abastecidos</h3>
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
                    <h3 className="text-sm font-medium text-gray-500">Valor Abastecimentos</h3>
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
            
            {/* Nova seção para mostrar dados de recebimentos */}
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Resumo de Recebimentos (Entradas)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Card de litros recebidos */}
              <div className="bg-green-50 p-4 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="mr-4 bg-green-100 p-3 rounded-full">
                    <FaGasPump className="h-6 w-6 text-green-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Litros Recebidos</h3>
                    <p className="text-xl font-bold text-green-700">{formatarNumero(dadosConsolidados.litrosRecebidos || 0)}</p>
                  </div>
                </div>
              </div>
              
              {/* Card de valor dos recebimentos */}
              <div className="bg-green-50 p-4 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="mr-4 bg-green-100 p-3 rounded-full">
                    <FaMoneyBillWave className="h-6 w-6 text-green-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Valor Recebimentos</h3>
                    <p className="text-xl font-bold text-green-700">{formatarPreco(dadosConsolidados.valorRecebimentos || 0)}</p>
                  </div>
                </div>
              </div>
              
              {/* Card de total de recebimentos */}
              <div className="bg-green-50 p-4 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="mr-4 bg-green-100 p-3 rounded-full">
                    <FaTruck className="h-6 w-6 text-green-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Total Recebimentos</h3>
                    <p className="text-xl font-bold text-green-700">{dadosConsolidados.totalRecebimentos || 0}</p>
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
            
            {/* Card para projetos que mais consumiram combustível - Versão aprimorada */}
            <div className="mt-6 bg-blue-50 p-5 rounded-lg shadow-sm border border-blue-200">
              <div className="flex items-center mb-4">
                <div className="mr-3 bg-blue-100 p-3 rounded-full">
                  <FaProjectDiagram className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-medium text-lg text-gray-700">Consumo de Combustível por Projeto</h3>
                  <p className="text-xs text-gray-500">Relatório detalhado mostrando litros abastecidos por projeto e porcentagem em relação ao total</p>
                </div>
              </div>
              
              {dadosConsolidados.projetosOrdenados.length > 0 ? (
                <div className="space-y-3">
                  {/* Cabeçalho aprimorado */}
                  <div className="flex items-center text-sm font-medium text-white bg-blue-600 py-2 px-3 rounded-t-md">
                    <div className="w-12 text-center">#</div>
                    <div className="flex-1">Projeto</div>
                    <div className="w-36 text-right">Litros</div>
                    <div className="w-28 text-right">% do Total</div>
                  </div>
                  
                  {/* Lista de projetos com dados */}
                  {dadosConsolidados.projetosOrdenados.map(([projeto, litros], index) => {
                    // Calcular a porcentagem do total, com verificação para evitar NaN
                    // Garantindo que estamos trabalhando com números
                    const litrosNum = typeof litros === 'string' ? parseFloat(litros) : litros;
                    const totalLitros = dadosConsolidados.totalLitros;
                    const porcentagem = totalLitros > 0 
                      ? (litrosNum / totalLitros) * 100
                      : 0;
                    
                    // Determinar a cor com base na posição
                    const corPosicao = index === 0 
                      ? 'bg-blue-600' 
                      : index === 1 
                        ? 'bg-blue-500' 
                        : index === 2 
                          ? 'bg-blue-400' 
                          : 'bg-blue-300';
                          
                    return (
                      <div key={index} className="flex items-center justify-between py-3 border-b border-blue-100 hover:bg-blue-50 transition-colors">
                        <div className="w-12 flex justify-center">
                          <span className={`${corPosicao} text-white rounded-full w-7 h-7 flex items-center justify-center font-bold shadow-sm`}>
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-gray-800">{projeto}</span>
                        </div>
                        <div className="w-36 text-right">
                          <span className="font-bold text-blue-700">{formatarNumero(litros)}</span>
                          <span className="text-sm text-gray-500 ml-1">L</span>
                        </div>
                        <div className="w-28 text-right">
                          <span className="inline-block min-w-[3rem] bg-blue-100 text-blue-800 font-semibold py-1 px-2 rounded-full text-xs">
                            {porcentagem.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Lista de projetos conhecidos não utilizados */}
                  {(() => {
                    // Lista completa de projetos conhecidos - atualizada
                    const projetosConhecidos = [
                      'SHOPEE',
                      'MERCADO LIVRE',
                      'COCA COLA',
                      'GRUPO PEREIRA',
                      'MADEIRA MADEIRA',
                      'OXXO',
                      'MANUTENÇÃO',
                      'MAGALU',
                      'NATURA',
                      'LINE HALL SHOPEE',
                      'FULL MELI',
                      'PETLOVE',
                      'USO OPERACIONAL'
                    ];
                    
                    // Projetos que já estão sendo exibidos nos dados
                    const projetosExibidos = dadosConsolidados.projetosOrdenados.map(([projeto]) => projeto);
                    
                    // Filtrar projetos que não estão sendo utilizados
                    const projetosNaoUtilizados = projetosConhecidos.filter(
                      projeto => !projetosExibidos.includes(projeto)
                    );
                    
                    // Renderizar projetos não utilizados em cinza
                    return projetosNaoUtilizados.map((projeto, index) => (
                      <div key={`unused-${index}`} className="flex items-center justify-between py-2 border-b border-blue-100 text-gray-400 hover:bg-gray-50 transition-colors">
                        <div className="w-12 flex justify-center">
                          <span className="bg-gray-200 text-gray-500 rounded-full w-7 h-7 flex items-center justify-center font-bold">
                            -
                          </span>
                        </div>
                        <div className="flex-1">
                          <span className="font-medium">{projeto}</span>
                        </div>
                        <div className="w-36 text-right">
                          <span className="font-bold">0</span>
                          <span className="text-sm ml-1">L</span>
                        </div>
                        <div className="w-28 text-right">
                          <span className="inline-block min-w-[3rem] bg-gray-100 text-gray-400 font-semibold py-1 px-2 rounded-full text-xs">
                            0.0%
                          </span>
                        </div>
                      </div>
                    ));
                  })()}
                  
                  {/* Linha de Total com design destacado */}
                  <div className="flex items-center justify-between py-3 px-3 mt-2 bg-blue-600 text-white rounded-b-md">
                    <div className="w-12"></div>
                    <div className="flex-1 font-bold">Total Geral</div>
                    <div className="w-36 text-right">
                      <span className="font-bold text-white text-lg">{formatarNumero(dadosConsolidados.totalLitros)}</span>
                      <span className="text-xs text-blue-100 ml-1">Litros</span>
                    </div>
                    <div className="w-28 text-right">
                      <span className="inline-block min-w-[3rem] bg-white text-blue-800 font-bold py-1 px-3 rounded-full text-xs">
                        100%
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6">
                  <p className="text-gray-500 italic mb-2">Nenhum projeto identificado nos abastecimentos.</p>
                  <p className="text-sm text-gray-400">Certifique-se de que os abastecimentos incluem informação de projeto.</p>
                </div>
              )}
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
                    <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Base</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Motorista</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Valor</th>
                    {isAdmin && (
                      <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Ações</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((abast, index) => {
                    const projeto = abast.project || abast.projeto || '-';
                    const baseInfo = getBaseFromAbastecimento(abast);
                    
                    return (
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
                        <td className="py-3 px-4">{projeto}</td>
                        <td className="py-3 px-4 text-xs text-gray-600">
                          <span className="max-w-xs truncate block" title={baseInfo}>
                            {baseInfo}
                          </span>
                        </td>
                        <td className="py-3 px-4">{abast.nome_motorista}</td>
                        <td className="py-3 px-4">{abast.valor_total ? formatarPreco(abast.valor_total) : '-'}</td>
                        {isAdmin && (
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleDeleteAbastecimento(abast)}
                              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-md transition-colors"
                              title="Excluir abastecimento"
                            >
                              Excluir
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Seção de Comparativo Mensal com Indicadores de Tendência */}
        {showTendencias && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <div className="flex items-center gap-2 mb-6">
              <FaProjectDiagram className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Comparativo Mensal com Indicadores de Tendência</h2>
            </div>

            {tendenciaData && tendenciaData.data && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="text-sm">
                      {Array.isArray(tendenciaData.data.anos_comparados) ? 
                        tendenciaData.data.anos_comparados.join(' vs ') : 
                        tendenciaData.data.anos_comparados || '2024 vs 2025'
                      }
                    </Badge>
                    <span className="text-sm text-gray-600">
                      Comparação de consumo mensal entre anos
                    </span>
                  </div>

                  {/* Resumo consolidado (todos os postos) */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Consumo Consolidado - Todos os Postos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Tabela com indicadores de tendência consolidados */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tendenciaData.data.consolidado && tendenciaData.data.consolidado.slice(0, 6).map((item) => (
                          <div key={item.mes} className="bg-gray-50 rounded-lg p-4 border">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-bold text-lg text-gray-800">{meses[item.mes - 1] || 'Mês'}</span>
                              <IndicadorTendencia variacao={item.variacao_litros || 0} tendencia={item.tendencia_litros || 'estavel'} />
                            </div>
                            <div className="text-sm text-gray-600 space-y-2">
                              <div className="flex justify-between">
                                <span>{item.ano_anterior || '2024'}:</span>
                                <span className="font-medium">{(item.litros_anterior || 0).toLocaleString('pt-BR')} L</span>
                              </div>
                              <div className="flex justify-between">
                                <span>{item.ano_atual || '2025'}:</span>
                                <span className="font-medium text-blue-600">{(item.litros_atual || 0).toLocaleString('pt-BR')} L</span>
                              </div>
                              <div className="flex justify-between border-t pt-2">
                                <span>Abastecimentos:</span>
                                <span className="font-medium">{item.abastecimentos_atual || 0} ({item.abastecimentos_anterior || 0})</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Análise individual por posto */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {tendenciaData.data.por_posto && tendenciaData.data.por_posto.filter(posto => posto.total_litros_atual > 0 || posto.total_litros_anterior > 0).map((posto, index) => (
                      <Card key={posto.posto}>
                        <CardHeader>
                          <CardTitle className="text-lg">{posto.posto_nome || 'Posto'}</CardTitle>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {(posto.total_litros_atual || 0).toLocaleString('pt-BR')} L ({tendenciaData.data.anos_comparados && tendenciaData.data.anos_comparados[1] || '2025'})
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {(posto.total_litros_anterior || 0).toLocaleString('pt-BR')} L ({tendenciaData.data.anos_comparados && tendenciaData.data.anos_comparados[0] || '2024'})
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {/* Indicadores de tendência por posto em grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {posto.dados_mensais && posto.dados_mensais.slice(0, 6).map((item) => (
                              <div key={item.mes} className="bg-gray-50 rounded-lg p-3 border">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-sm text-gray-700">{(meses[item.mes - 1] || 'Mês').substring(0, 3)}</span>
                                  <IndicadorTendencia variacao={item.variacao_litros || 0} tendencia={item.tendencia_litros || 'estavel'} />
                                </div>
                                <div className="text-xs text-gray-600 space-y-1">
                                  <div className="flex justify-between">
                                    <span>{item.ano_anterior || '2024'}:</span>
                                    <span className="font-medium">{(item.litros_anterior || 0).toLocaleString('pt-BR')} L</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>{item.ano_atual || '2025'}:</span>
                                    <span className="font-medium text-blue-600">{(item.litros_atual || 0).toLocaleString('pt-BR')} L</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Resumo do posto */}
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-blue-800">Total do Posto:</span>
                              <div className="flex gap-2">
                                <span className="text-sm text-blue-600">
                                  {(posto.total_litros_anterior || 0) > 0 ? 
                                    (((posto.total_litros_atual || 0) - (posto.total_litros_anterior || 0)) / (posto.total_litros_anterior || 1) * 100).toFixed(1) + '%' :
                                    'N/A'
                                  }
                                </span>
                                {(posto.total_litros_atual || 0) > (posto.total_litros_anterior || 0) ? 
                                  <TrendingUp className="w-4 h-4 text-green-600" /> : 
                                  (posto.total_litros_atual || 0) < (posto.total_litros_anterior || 0) ?
                                  <TrendingDown className="w-4 h-4 text-red-600" /> :
                                  <Minus className="w-4 h-4 text-gray-600" />
                                }
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {isLoadingTendencia && (
                <div className="flex items-center justify-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                  <span className="ml-2">Carregando análise de tendência...</span>
                </div>
              )}

              {tendenciaError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">Erro ao carregar análise: {tendenciaError}</p>
                </div>
              )}
              
              {!isLoadingTendencia && !tendenciaError && (!tendenciaData || !tendenciaData.data) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">Nenhum dado encontrado para análise de tendência. Certifique-se de que há dados suficientes para comparação.</p>
                </div>
              )}
          </div>
        )}

      </div>
    </div>
  );
};

export default HistoricoGeralPage;