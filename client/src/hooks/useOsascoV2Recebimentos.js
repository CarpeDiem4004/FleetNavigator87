import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from "@/lib/queryClient";

/**
 * Hook personalizado para gerenciar os recebimentos do posto Osasco V2
 * Esta implementação se conecta diretamente à API personalizada para o posto Osasco
 * que possui uma estrutura de tabela diferente dos outros postos
 */
function useOsascoV2Recebimentos() {
  const [recebimentos, setRecebimentos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Função para recarregar os dados
  const reloadData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Efeito para carregar os dados dos recebimentos
  useEffect(() => {
    const fetchRecebimentos = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("[FETCH] Buscando recebimentos para o posto Osasco V2...");
        const res = await apiRequest('GET', '/api/recebimentos-osasco-v2');
        const data = await res.json();
        
        if (data.success) {
          console.log("Dados recebidos do Osasco V2:", data.data.length, "recebimentos");
          setRecebimentos(data.data);
        } else {
          throw new Error(data.message || 'Erro ao buscar recebimentos');
        }
      } catch (err) {
        console.error("Erro ao buscar recebimentos do posto Osasco V2:", err);
        setError(err.message || 'Erro ao carregar recebimentos');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecebimentos();
  }, [refreshTrigger]);

  // Função para adicionar um novo recebimento
  const adicionarRecebimento = async (formData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await apiRequest('POST', '/api/recebimentos-osasco-v2', formData);
      const data = await res.json();
      
      if (data.success) {
        // Adicionar novo recebimento ao estado e ordenar por data
        setRecebimentos(prev => [data.data, ...prev].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        ));
        return { success: true, data: data.data };
      } else {
        throw new Error(data.message || 'Erro ao registrar recebimento');
      }
    } catch (err) {
      console.error("Erro ao adicionar recebimento:", err);
      setError(err.message || 'Erro ao registrar recebimento');
      return { success: false, message: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    recebimentos,
    isLoading,
    error,
    adicionarRecebimento,
    reloadData
  };
}

export default useOsascoV2Recebimentos;