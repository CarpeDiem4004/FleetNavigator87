/**
 * Hook personalizado para gerenciar recebimentos do posto Osasco V2
 * Utiliza uma API especializada devido à estrutura diferente da tabela
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface RecebimentoOsasco {
  id?: number;
  fornecedor: string;              // nome_fornecedor na tabela
  tipo_combustivel: string;        // tipo_produto na tabela
  quantidade_litros: string | number;  // litros_recebidos na tabela
  valor_litro: string | number;
  valor_total: string | number;
  numero_nota: string;
  data_entrega: string;
  nome_operador: string;
  observacoes: string;
  data_formatada?: string;
  created_at?: string;
}

export function useOsascoRecebimentos() {
  const [recebimentos, setRecebimentos] = useState<RecebimentoOsasco[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  const refreshRecebimentos = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchRecebimentos = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("Buscando recebimentos do posto Osasco V2...");
        
        const response = await fetch('/api/recebimentos/osasco_v2', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`Erro ao buscar recebimentos: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success) {
          console.log("Recebimentos do posto Osasco V2 obtidos:", result.data);
          setRecebimentos(result.data || []);
        } else {
          console.error("Erro na resposta:", result.message);
          setError(new Error(result.message));
        }
      } catch (err) {
        console.error("Erro ao buscar recebimentos:", err);
        setError(err instanceof Error ? err : new Error('Erro desconhecido ao buscar recebimentos'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecebimentos();
  }, [refreshTrigger]);

  const adicionarRecebimento = async (dados: RecebimentoOsasco) => {
    try {
      console.log("Adicionando recebimento no posto Osasco V2:", dados);
      
      // Calcular o valor total se não fornecido
      if (!dados.valor_total && dados.quantidade_litros && dados.valor_litro) {
        const qtd = typeof dados.quantidade_litros === 'string' 
          ? parseFloat(dados.quantidade_litros) 
          : dados.quantidade_litros;
          
        const valor = typeof dados.valor_litro === 'string' 
          ? parseFloat(dados.valor_litro) 
          : dados.valor_litro;
          
        dados.valor_total = (qtd * valor).toFixed(2);
      }
      
      const response = await fetch('/api/recebimentos/osasco_v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(dados),
      });

      if (!response.ok) {
        throw new Error(`Erro ao adicionar recebimento: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Recebimento registrado",
          description: "Recebimento de combustível registrado com sucesso.",
        });
        
        refreshRecebimentos();
        return { success: true, data: result.data };
      } else {
        throw new Error(result.message || 'Erro ao registrar recebimento');
      }
    } catch (err) {
      console.error("Erro ao adicionar recebimento:", err);
      
      toast({
        title: "Erro ao registrar recebimento",
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: "destructive",
      });
      
      return { success: false, error: err instanceof Error ? err : new Error('Erro desconhecido') };
    }
  };

  return {
    recebimentos,
    isLoading,
    error,
    refreshRecebimentos,
    adicionarRecebimento
  };
}