import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Hook personalizado para lidar com os recebimentos do posto Osasco V2
 * Esta implementação resolve o problema de incompatibilidade de estrutura da tabela
 */
export function useOsascoV2Recebimentos() {
  const [recebimentos, setRecebimentos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Força uma recarga dos dados
  const reloadData = () => {
    setReloadTrigger(prev => prev + 1);
  };

  // Busca os recebimentos
  useEffect(() => {
    async function fetchRecebimentos() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Tentar API direta específica para o Osasco V2
        const response = await axios.get('/api/osasco/recebimentos');
        
        if (response.data && response.data.success && response.data.data) {
          console.log("Recebimentos Osasco V2 carregados:", response.data.data.length);
          setRecebimentos(response.data.data);
        } else {
          throw new Error("Formato de resposta inválido");
        }
      } catch (err) {
        console.error("Erro ao carregar recebimentos Osasco V2:", err);
        setError(err.message || "Erro ao carregar os recebimentos");
        
        try {
          // Fallback para a API genérica
          console.log("Tentando API genérica como fallback");
          const fallbackResponse = await axios.get('/api/recebimentos/osasco_v2');
          
          if (fallbackResponse.data && fallbackResponse.data.success && fallbackResponse.data.data) {
            console.log("Recebimentos carregados via fallback:", fallbackResponse.data.data.length);
            setRecebimentos(fallbackResponse.data.data);
            setError(null); // Limpa o erro anterior se o fallback funcionar
          }
        } catch (fallbackErr) {
          console.error("Falha também no fallback:", fallbackErr);
          setError("Não foi possível carregar os recebimentos. Tente novamente mais tarde.");
        }
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchRecebimentos();
  }, [reloadTrigger]);

  // Adiciona um novo recebimento
  const adicionarRecebimento = async (dados) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Tenta a API direta
      const response = await axios.post('/api/osasco/recebimentos', dados);
      
      if (response.data && response.data.success) {
        // Adiciona o novo recebimento à lista
        setRecebimentos(prev => [response.data.data, ...prev]);
        return { success: true, message: "Recebimento registrado com sucesso!" };
      } else {
        throw new Error(response.data?.message || "Erro ao registrar recebimento");
      }
    } catch (err) {
      console.error("Erro ao adicionar recebimento:", err);
      
      try {
        // Tenta o fallback para a API genérica
        const fallbackResponse = await axios.post('/api/recebimentos/osasco_v2', dados);
        
        if (fallbackResponse.data && fallbackResponse.data.success) {
          // Recarrega os dados completamente após sucesso no fallback
          reloadData();
          return { success: true, message: "Recebimento registrado com sucesso!" };
        } else {
          throw new Error(fallbackResponse.data?.message || "Erro ao registrar recebimento");
        }
      } catch (fallbackErr) {
        setError(fallbackErr.message || "Não foi possível registrar o recebimento");
        return { 
          success: false, 
          message: fallbackErr.message || "Não foi possível registrar o recebimento. Tente novamente mais tarde." 
        };
      }
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