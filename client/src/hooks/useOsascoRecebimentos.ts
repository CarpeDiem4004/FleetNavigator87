import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface RecebimentoOsasco {
  id: number;
  fornecedor: string;
  tipo_combustivel: string;
  quantidade_litros: number;
  valor_litro: number;
  valor_total: number;
  numero_nota: string;
  data_entrega: string;
  operador: string;
  observacoes?: string;
  created_at: string;
}

/**
 * Hook especializado para buscar recebimentos do posto Osasco V2
 * Resolve as diferenças de schema específicas deste posto
 */
export function useOsascoRecebimentos() {
  const {
    data,
    isLoading,
    error,
  } = useQuery<{success: boolean; data: RecebimentoOsasco[] | []; message?: string}, Error>({
    queryKey: ['/api/recebimentos-osasco'],
    queryFn: async () => {
      try {
        console.log('Buscando recebimentos específicos para Osasco V2...');
        // Primeiro tentamos a rota especializada
        const response = await apiRequest('GET', '/api/recebimentos-osasco');
        
        if (!response.ok) {
          // Se falhar, tentamos o endpoint alternativo como fallback
          const fallbackResponse = await apiRequest('GET', '/api/fix-osasco/recebimentos');
          console.log('Usando endpoint alternativo para Osasco V2');
          return await fallbackResponse.json();
        }
        
        return await response.json();
      } catch (err) {
        console.error('Erro ao buscar recebimentos de Osasco:', err);
        throw new Error(`Erro ao buscar recebimentos: ${(err as Error).message}`);
      }
    },
    staleTime: 60000, // 1 minuto
  });

  // Se a resposta tiver dados, retorna-os; caso contrário, retorna array vazio
  const recebimentos = data?.data || [];

  return {
    recebimentos,
    isLoading,
    error,
  };
}