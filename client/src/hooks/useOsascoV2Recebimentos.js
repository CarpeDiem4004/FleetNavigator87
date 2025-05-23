import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook personalizado para gerenciar os recebimentos do posto Osasco V2
 * Este hook lida com a estrutura de tabela específica deste posto
 */
export default function useOsascoV2Recebimentos() {
  const { toast } = useToast();
  const [recebimentos, setRecebimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);

  // Função para forçar recarga dos dados
  const recarregarDados = useCallback(() => setReload(prev => prev + 1), []);

  // Buscar recebimentos da API
  useEffect(() => {
    const fetchRecebimentos = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/recebimentos-osasco-v2', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`Erro ao buscar recebimentos: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          setRecebimentos(data.data || []);
        } else {
          throw new Error(data.message || 'Erro desconhecido ao buscar recebimentos');
        }
      } catch (err) {
        console.error('Erro ao buscar recebimentos do posto Osasco V2:', err);
        setError(err.message);
        // Não mostrar toast por erro na busca inicial
      } finally {
        setLoading(false);
      }
    };

    fetchRecebimentos();
  }, [reload]);

  // Função para adicionar um novo recebimento
  const adicionarRecebimento = async (dadosRecebimento) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/recebimentos-osasco-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        credentials: 'include',
        body: JSON.stringify(dadosRecebimento)
      });

      if (!response.ok) {
        throw new Error(`Erro ao registrar recebimento: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Adicionar o novo recebimento ao estado
        setRecebimentos(prev => [data.data, ...prev]);
        
        toast({
          title: "Sucesso!",
          description: "Recebimento registrado com sucesso.",
        });
        
        return { success: true, data: data.data };
      } else {
        throw new Error(data.message || 'Erro desconhecido ao registrar recebimento');
      }
    } catch (err) {
      console.error('Erro ao registrar recebimento:', err);
      setError(err.message);
      
      toast({
        title: "Erro ao registrar recebimento",
        description: err.message,
        variant: "destructive",
      });
      
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    recebimentos,
    loading,
    error,
    adicionarRecebimento,
    recarregarDados
  };
}