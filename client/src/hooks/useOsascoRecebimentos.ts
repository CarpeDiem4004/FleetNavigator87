/**
 * Hook personalizado para gerenciar recebimentos do posto Osasco V2
 * Utiliza uma API especializada devido à estrutura diferente da tabela
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

// Definição do tipo para recebimentos específicos do posto Osasco
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
}

export function useOsascoRecebimentos() {
  const [recebimentos, setRecebimentos] = useState<RecebimentoOsasco[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar recebimentos do posto Osasco V2
  const fetchRecebimentos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch('/api/recebimentos/osasco_v2', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar recebimentos');
      }

      if (data.data && Array.isArray(data.data)) {
        // Mapear os dados para o formato esperado
        const formattedData = data.data.map((item: any) => ({
          id: item.id,
          fornecedor: item.nome_fornecedor,
          tipo_combustivel: item.tipo_produto,
          quantidade_litros: item.litros_recebidos,
          valor_litro: item.valor_litro,
          valor_total: item.valor_total,
          numero_nota: item.numero_nota,
          data_entrega: item.data_entrega ? new Date(item.data_entrega).toISOString().split('T')[0] : '',
          nome_operador: item.nome_operador,
          observacoes: item.observacoes || '',
          data_formatada: formatarDataBR(item.data_entrega || item.created_at)
        }));
        
        setRecebimentos(formattedData);
      } else {
        // Se não houver dados, definir como array vazio
        setRecebimentos([]);
      }
    } catch (err: any) {
      console.error('Erro ao buscar recebimentos Osasco V2:', err);
      setError(err.message || 'Falha ao carregar recebimentos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Formatar data para o formato brasileiro (DD/MM/YYYY)
  const formatarDataBR = (dataStr: string) => {
    if (!dataStr) return '';
    
    try {
      const data = new Date(dataStr);
      return data.toLocaleDateString('pt-BR');
    } catch (error) {
      return dataStr;
    }
  };

  // Função para adicionar novo recebimento
  const adicionarRecebimento = async (dados: RecebimentoOsasco) => {
    setIsLoading(true);
    setError(null);

    try {
      // Mapear os dados para o formato esperado pela API
      const payload = {
        nome_fornecedor: dados.fornecedor,
        tipo_produto: dados.tipo_combustivel,
        litros_recebidos: typeof dados.quantidade_litros === 'string' 
          ? parseFloat(dados.quantidade_litros) 
          : dados.quantidade_litros,
        valor_litro: typeof dados.valor_litro === 'string' 
          ? parseFloat(dados.valor_litro) 
          : dados.valor_litro,
        valor_total: typeof dados.valor_total === 'string' 
          ? parseFloat(dados.valor_total) 
          : dados.valor_total,
        numero_nota: dados.numero_nota,
        data_entrega: dados.data_entrega,
        nome_operador: dados.nome_operador,
        observacoes: dados.observacoes
      };

      const token = localStorage.getItem('jwtToken');
      const response = await fetch('/api/recebimentos/osasco_v2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Erro ao registrar recebimento');
      }

      // Atualizar a lista de recebimentos após adicionar um novo
      await fetchRecebimentos();
      
      toast({
        title: 'Recebimento registrado com sucesso',
        description: 'O novo recebimento foi registrado e os níveis do tanque foram atualizados.',
      });
      
      return true;
    } catch (err: any) {
      console.error('Erro ao adicionar recebimento:', err);
      setError(err.message || 'Falha ao registrar recebimento');
      
      toast({
        title: 'Erro ao registrar recebimento',
        description: err.message || 'Ocorreu um problema ao registrar o recebimento.',
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar recebimentos ao montar o componente
  useEffect(() => {
    fetchRecebimentos();
  }, [fetchRecebimentos]);

  // Função para atualizar manualmente os recebimentos
  const refreshRecebimentos = useCallback(() => {
    fetchRecebimentos();
  }, [fetchRecebimentos]);

  return {
    recebimentos,
    isLoading,
    error,
    refreshRecebimentos,
    adicionarRecebimento
  };
}