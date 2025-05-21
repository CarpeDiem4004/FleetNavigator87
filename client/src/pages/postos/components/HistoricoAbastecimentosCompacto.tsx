import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RefreshCw, Download } from "lucide-react";
import eventosBus, { EVENTOS } from '@/lib/eventosBus';

interface HistoricoAbastecimentosCompactoProps {
  posto: string;
  refreshTrigger?: number;
}

interface AbastecimentoItem {
  id: number;
  placa: string;
  km: number;
  tipo_combustivel: string;
  quantidade_litros: string | number;
  data_hora: string;
  created_at: string;
  valor_total: string | number;
}

/**
 * Componente de histórico de abastecimentos com visual compacto
 * Baseado exatamente na imagem de referência
 */
const HistoricoAbastecimentosCompacto: React.FC<HistoricoAbastecimentosCompactoProps> = ({ 
  posto,
  refreshTrigger = 0
}) => {
  const [historico, setHistorico] = useState<AbastecimentoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [placaFiltro, setPlacaFiltro] = useState('');
  const [historicoFiltrado, setHistoricoFiltrado] = useState<AbastecimentoItem[]>([]);
  
  const loadHistorico = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Usar timestamp mais específico (incluindo milissegundos) para evitar cache
      const timestamp = new Date().getTime();
      const randomParam = Math.random().toString(36).substring(7);
      
      // Processa o nome do posto para garantir consistência
      let postoProcessado = posto;
      
      // Normalizar o formato do nome do posto para compatibilidade com a API
      // Regra geral: nome do posto deve ser minúsculo com _ em vez de espaços
      postoProcessado = posto.toLowerCase().replace(/ /g, '_');
      
      // Casos específicos de normalização
      if (posto.toLowerCase().includes("guarulhos v2") || posto === "Posto Guarulhos V2" || posto === "guarulhos_v2") {
        postoProcessado = "guarulhos_v2";
        console.log("Normalizando nome do posto para guarulhos_v2");
      }
      
      console.log(`Carregando histórico para posto '${postoProcessado}' com timestamp ${timestamp} e nonce ${randomParam}`);
      
      // Usar axios diretamente na rota SQL para evitar qualquer cache ou camada de middleware
      const diretaSqlResponse = await axios.post('/api/execute-sql', {
        sql: `
          SELECT 
            id,
            placa,
            km_atual as km,
            NULL as hodometro_atual,
            tipo_combustivel,
            litros as quantidade_litros,
            'Não informado' as nome_motorista,
            NULL as rg_motorista,
            'Sistema' as nome_operador,
            valor_litro,
            valor_total,
            tipo_veiculo,
            observacoes,
            false as lavagem,
            NULL as tipo_lavagem,
            COALESCE(project, 'Não definido') as projeto,
            to_char(created_at, 'DD/MM/YYYY HH24:MI') as data_hora,
            created_at
          FROM abastecimentos_posto_guarulhos_v2
          ORDER BY created_at DESC
          LIMIT 50
        `,
        params: []
      }, {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (diretaSqlResponse.data && diretaSqlResponse.data.rows) {
        console.log(`Histórico carregado diretamente do SQL: ${diretaSqlResponse.data.rows.length} registros`);
        const dados = diretaSqlResponse.data.rows || [];
        setHistorico(dados);
        return;
      }
      
      // Tenta a rota normal como fallback
      const response = await axios.get(
        `/api/historico-direto/${encodeURIComponent(postoProcessado)}?t=${timestamp}&nocache=${randomParam}`, 
        {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
      
      if (response.data && response.data.success) {
        console.log(`Histórico carregado: ${response.data.data?.length || 0} registros para ${postoProcessado}`);
        const dados = response.data.data || [];
        setHistorico(dados);
      } else {
        setError(response.data?.error || 'Erro ao carregar o histórico');
        
        // Tenta segundo fallback
        const fallback2Response = await axios.get(
          `/api/diagnostico/historico/${encodeURIComponent(postoProcessado)}?t=${timestamp}&nocache=${randomParam}`,
          {
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          }
        );
        
        if (fallback2Response.data && fallback2Response.data.success) {
          console.log(`Segundo fallback bem-sucedido, ${fallback2Response.data.data?.length || 0} registros`);
          const dados = fallback2Response.data.data || [];
          setHistorico(dados);
          return;
        }
        
        // Ainda um terceiro fallback para garantir
        try {
          const direta2Response = await axios.get(`/api/posto-supabase/abastecimentos-direto/${postoProcessado}`);
          if (direta2Response.data) {
            const dados = Array.isArray(direta2Response.data) ? direta2Response.data : 
                         direta2Response.data.data || [];
            console.log(`Terceiro fallback bem-sucedido, ${dados.length} registros`);
            setHistorico(dados);
            return;
          }
        } catch (direta2Err) {
          console.log('Terceiro fallback falhou, continuando com outros métodos');
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar histórico:', err);
      setError(`Erro ao carregar histórico: ${err.message}`);
      
      // Tentar a rota alternativa
      try {
        const timestamp = new Date().getTime();
        // Usar constante para nome do posto
        const nomePostoNormalizado = posto.toLowerCase().replace(/ /g, '_').replace(/v2/i, 'v2');
        console.log(`Tentando fallback final com nome normalizado: ${nomePostoNormalizado}`);
        
        const fallbackResponse = await axios.get(`/api/posto-supabase/historico/${nomePostoNormalizado}?t=${timestamp}`);
        
        if (fallbackResponse.data && fallbackResponse.data.success) {
          console.log(`Fallback bem-sucedido, ${fallbackResponse.data.data?.length || 0} registros obtidos`);
          const dados = fallbackResponse.data.data || [];
          setHistorico(dados);
        }
      } catch (fallbackErr) {
        // Manter o erro original
        console.error('Todos os fallbacks falharam:', fallbackErr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Referência para controlar se o componente está montado
  const isMountedRef = useRef(true);
  const lastSuccessfulUpdateRef = useRef<Date | null>(null);
  
  // Efeito para ciclo de vida do componente
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Função para carregar dados com garantia de segurança
  const forceLoadHistorico = async (forceMsg = '') => {
    if (!isMountedRef.current) return;
    
    console.log(`${forceMsg ? `[${forceMsg}] ` : ''}Atualizando histórico forçadamente para posto ${posto}`);
    
    try {
      // Primeiro tenta o método normal
      await loadHistorico();
      
      // Registra a última atualização bem-sucedida
      lastSuccessfulUpdateRef.current = new Date();
      
    } catch (error) {
      console.error("Erro ao forçar atualização do histórico:", error);
    }
  };
  
  // Carregar dados ao montar o componente ou quando o refreshTrigger mudar
  useEffect(() => {
    console.log(`Carregando histórico do posto ${posto}, refreshTrigger: ${refreshTrigger}`);
    
    // SEQUÊNCIA DE ATUALIZAÇÕES AGRESSIVA:
    
    // 1. ATUALIZAÇÃO IMEDIATA
    forceLoadHistorico('IMEDIATO');
    
    // 2. SEQUÊNCIA DE TENTATIVAS MÚLTIPLAS EM INTERVALOS CRESCENTES
    // Matriz de intervalos de tempo (em ms)
    const updateIntervals = [300, 800, 1500, 3000, 5000, 7000];
    
    // Criar timers para cada intervalo
    const timers = updateIntervals.map((interval, index) => {
      return setTimeout(() => {
        if (isMountedRef.current) {
          forceLoadHistorico(`TENTATIVA ${index+1} - ${interval}ms`);
        }
      }, interval);
    });
    
    // 3. VERIFICAÇÃO DE DADOS A CADA 10 SEGUNDOS PARA GARANTIR ATUALIZAÇÕES
    const checkDataIntervalId = setInterval(() => {
      if (!isMountedRef.current) return;
      
      // Se não houver dados ou se a última atualização for muito antiga (+ de 20s), força uma nova
      const currentTime = new Date();
      const needsUpdate = 
        historico.length === 0 || 
        !lastSuccessfulUpdateRef.current ||
        (currentTime.getTime() - lastSuccessfulUpdateRef.current.getTime() > 20000);
      
      if (needsUpdate) {
        console.log(`[VERIFICAÇÃO] Histórico precisa de atualização, forçando nova consulta...`);
        forceLoadHistorico('VERIFICAÇÃO');
      }
    }, 10000);
    
    // 4. ATUALIZAÇÃO PERIÓDICA PARA MANTER DADOS FRESCOS
    const regularUpdateId = setInterval(() => {
      if (isMountedRef.current) {
        forceLoadHistorico('PERIÓDICA');
      }
    }, 45000);
    
    // Subscrever ao evento de abastecimento registrado
    const handleAbastecimentoRegistrado = (data: any) => {
      console.log(`[EventBus] Recebido evento de abastecimento registrado para posto: ${data?.posto}`, data);
      
      if (data?.posto && data.posto.toLowerCase().replace(/\s+/g, '_') === posto.toLowerCase().replace(/\s+/g, '_')) {
        console.log(`[EventBus] Atualizando histórico devido a novo abastecimento em ${posto}`);
        forceLoadHistorico('EVENTO-REGISTRADO');
      }
    };
    
    // Inscrever no evento de abastecimento registrado
    eventosBus.subscribe(EVENTOS.ABASTECIMENTO_REGISTRADO, handleAbastecimentoRegistrado);
    
    // Limpar todos os timers e inscrições ao desmontar
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      clearInterval(checkDataIntervalId);
      clearInterval(regularUpdateId);
      eventosBus.unsubscribe(EVENTOS.ABASTECIMENTO_REGISTRADO, handleAbastecimentoRegistrado);
    };
  }, [posto, refreshTrigger]);
  
  // Aplicar filtros quando os parâmetros mudarem
  useEffect(() => {
    if (!historico.length) {
      setHistoricoFiltrado([]);
      return;
    }
    
    console.log(`Aplicando filtros em ${historico.length} registros`);
    let resultados = [...historico];
    
    // Filtrar por data inicial
    if (dataInicio) {
      const dataInicioObj = new Date(dataInicio);
      dataInicioObj.setHours(0, 0, 0, 0);
      
      resultados = resultados.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate >= dataInicioObj;
      });
    }
    
    // Filtrar por data final
    if (dataFim) {
      const dataFimObj = new Date(dataFim);
      dataFimObj.setHours(23, 59, 59, 999);
      
      resultados = resultados.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate <= dataFimObj;
      });
    }
    
    // Filtrar por placa
    if (placaFiltro) {
      const placaLower = placaFiltro.toLowerCase();
      resultados = resultados.filter(item => 
        item.placa.toLowerCase().includes(placaLower)
      );
    }
    
    // Forçar ordenação por data (mais recente primeiro)
    resultados.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    // Debug
    if (resultados.length > 0) {
      console.log(`Registro mais recente: ${resultados[0].placa} - ${resultados[0].data_hora}`);
    }
    
    setHistoricoFiltrado(resultados);
  }, [historico, dataInicio, dataFim, placaFiltro]);

  // Exportar para Excel
  const exportToExcel = () => {
    const dadosParaExportar = historicoFiltrado.length > 0 ? historicoFiltrado : historico;
    if (dadosParaExportar.length === 0) return;
    
    const workbookData = dadosParaExportar.map(item => ({
      'Data/Hora': item.data_hora,
      'Placa': item.placa,
      'Combustível': item.tipo_combustivel,
      'Litros': typeof item.quantidade_litros === 'string' 
        ? item.quantidade_litros 
        : item.quantidade_litros.toFixed(2),
      'Valor Total': typeof item.valor_total === 'string'
        ? `R$ ${item.valor_total}`
        : `R$ ${item.valor_total.toFixed(2)}`
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(workbookData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Histórico");
    
    const date = format(new Date(), 'dd-MM-yyyy_HH-mm', {locale: ptBR});
    const fileName = `historico_${posto}_${date}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Ordenar histórico (mais recente primeiro)
  useEffect(() => {
    // Forçar atualização periódica do histórico a cada 10s para garantir exibição de novos registros
    const forceUpdateTimer = setInterval(() => {
      loadHistorico();
    }, 10000);
    
    return () => clearInterval(forceUpdateTimer);
  }, []);

  const historicoParaExibir = historicoFiltrado.length > 0 ? historicoFiltrado : historico;
  const historicoOrdenado = [...historicoParaExibir].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }).slice(0, 10); // Mostrar apenas os 10 mais recentes

  // Formatar nome do posto para exibição
  const formatarNomePosto = (nome: string) => {
    return nome.toUpperCase().replace('_', ' ');
  };

  return (
    <div className="bg-blue-100 rounded p-2 w-full">
      <div className="mb-2 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-medium">Histórico de Abastecimentos</h3>
          <p className="text-xs text-gray-600">
            {historicoFiltrado.length > 0 
              ? `${historicoFiltrado.length} registro(s) encontrado(s) - ${formatarNomePosto(posto)}`
              : `Últimos registros do posto ${formatarNomePosto(posto)}`
            }
          </p>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={loadHistorico}
            className="p-1 bg-blue-300 rounded-md hover:bg-blue-400"
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 text-blue-700" />
          </button>
          <button 
            onClick={exportToExcel}
            className="p-1 bg-blue-300 rounded-md hover:bg-blue-400"
            disabled={historico.length === 0}
          >
            <Download className="h-4 w-4 text-blue-700" />
          </button>
        </div>
      </div>
      
      {/* Filtros de busca */}
      <div className="mb-2 grid grid-cols-3 gap-2 bg-blue-50 p-2 rounded">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Data Inicial</label>
          <input 
            type="date" 
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="w-full p-1 text-xs border border-blue-200 rounded"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Data Final</label>
          <input 
            type="date" 
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="w-full p-1 text-xs border border-blue-200 rounded"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Placa</label>
          <input 
            type="text" 
            value={placaFiltro}
            onChange={(e) => setPlacaFiltro(e.target.value)}
            placeholder="Buscar por placa..."
            className="w-full p-1 text-xs border border-blue-200 rounded"
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-2">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
          <p className="text-xs text-gray-500 mt-1">Carregando...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-2 rounded-md text-xs">
          {error}
        </div>
      ) : historico.length === 0 ? (
        <div className="text-center py-2 text-xs text-gray-500">
          Nenhum registro encontrado.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-blue-300">
                <th className="py-1 px-2 text-left border-b border-blue-200">Data/Hora</th>
                <th className="py-1 px-2 text-left border-b border-blue-200">Placa</th>
                <th className="py-1 px-2 text-center border-b border-blue-200">Combustível</th>
                <th className="py-1 px-2 text-right border-b border-blue-200">Litros</th>
                <th className="py-1 px-2 text-right border-b border-blue-200">Valor</th>
                <th className="py-1 px-2 text-left border-b border-blue-200">Projeto</th>
              </tr>
            </thead>
            <tbody>
              {historicoOrdenado.map((item) => (
                <tr key={item.id} className="border-b border-blue-50">
                  <td className="py-1 px-2 whitespace-nowrap">{item.data_hora}</td>
                  <td className="py-1 px-2 whitespace-nowrap font-medium">{item.placa}</td>
                  <td className="py-1 px-2 whitespace-nowrap text-center">
                    {item.tipo_combustivel === 'ARLA' ? (
                      <span className="inline-block bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-[10px]">
                        ARLA
                      </span>
                    ) : (
                      <div className="bg-blue-200 rounded-full mx-auto w-12 h-4"></div>
                    )}
                  </td>
                  <td className="py-1 px-2 text-right whitespace-nowrap">
                    {typeof item.quantidade_litros === 'string' 
                      ? parseFloat(item.quantidade_litros).toFixed(2) 
                      : item.quantidade_litros.toFixed(2)}
                  </td>
                  <td className="py-1 px-2 text-right whitespace-nowrap">
                    R$ {typeof item.valor_total === 'string'
                      ? parseFloat(item.valor_total).toFixed(2)
                      : item.valor_total.toFixed(2)}
                  </td>
                  <td className="py-1 px-2 text-left whitespace-nowrap">
                    {item.projeto || "Não definido"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HistoricoAbastecimentosCompacto;