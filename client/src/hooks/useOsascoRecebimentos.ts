/**
 * Hook personalizado para gerenciar recebimentos do posto Osasco V2
 * Lida com a API especializada que adapta os nomes dos campos
 */

import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../lib/queryClient';
import { useToast } from './use-toast';

export interface RecebimentoOsasco {
  id?: number;
  fornecedor: string;
  tipo_combustivel: string;
  quantidade_litros: string | number;
  valor_litro: string | number;
  valor_total: string | number;
  numero_nota: string;
  data_entrega: string;
  nome_operador: string;
  observacoes?: string;
  data_registro?: Date;
  data_formatada?: string;
}

interface UseOsascoRecebimentosResult {
  recebimentos: RecebimentoOsasco[];
  isLoading: boolean;
  error: string | null;
  refreshRecebimentos: () => Promise<void>;
  adicionarRecebimento: (dados: RecebimentoOsasco) => Promise<RecebimentoOsasco | null>;
  limparErro: () => void;
}

export function useOsascoRecebimentos(): UseOsascoRecebimentosResult {
  const [recebimentos, setRecebimentos] = useState<RecebimentoOsasco[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Função para buscar recebimentos com fallback para rota de teste
  const fetchRecebimentos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Primeiro, tenta a API real
      const response = await apiRequest('GET', '/api/recebimentos-osasco');
      const data = await response.json();

      if (data.success) {
        setRecebimentos(data.data || []);
        return;
      } else {
        console.warn('Rota principal falhou, tentando rota de teste:', data.message);
        
        // Se a primeira falhar, tenta a rota de teste
        const testResponse = await apiRequest('GET', '/api/teste-osasco-recebimentos');
        const testData = await testResponse.json();
        
        if (testData.success) {
          setRecebimentos(testData.data || []);
          console.log('Usando dados de teste para recebimentos Osasco');
        } else {
          throw new Error('Não foi possível obter dados de recebimentos');
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Erro ao buscar recebimentos';
      console.error('Erro ao buscar recebimentos Osasco:', errorMsg);
      setError(errorMsg);
      
      // Mostrar toast de erro
      toast({
        title: 'Erro',
        description: `Não foi possível carregar os recebimentos: ${errorMsg}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Função para adicionar um novo recebimento
  const adicionarRecebimento = useCallback(async (dados: RecebimentoOsasco): Promise<RecebimentoOsasco | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Calcular valor total caso não fornecido
      if (!dados.valor_total && dados.valor_litro && dados.quantidade_litros) {
        dados.valor_total = (
          parseFloat(dados.valor_litro.toString()) * 
          parseFloat(dados.quantidade_litros.toString())
        ).toFixed(2);
      }

      // Primeiro, tenta a API real
      const response = await apiRequest('POST', '/api/recebimentos-osasco', dados);
      const data = await response.json();

      if (data.success) {
        // Atualizar lista de recebimentos
        await fetchRecebimentos();
        
        // Notificar sucesso
        toast({
          title: 'Sucesso',
          description: 'Recebimento registrado com sucesso',
        });
        
        return data.data;
      } else {
        console.warn('API principal falhou, tentando rota de teste:', data.message);
        
        // Se a primeira falhar, tenta a rota de teste
        const testResponse = await apiRequest('POST', '/api/teste-osasco-recebimentos', dados);
        const testData = await testResponse.json();
        
        if (testData.success) {
          // Atualizar lista com dados de teste
          await fetchRecebimentos();
          
          // Notificar usando dados de teste
          toast({
            title: 'Sucesso (Modo Teste)',
            description: 'Simulação de recebimento registrada com sucesso',
          });
          
          return testData.data;
        } else {
          throw new Error(testData.message || 'Falha ao registrar recebimento');
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Erro ao registrar recebimento';
      console.error('Erro ao adicionar recebimento Osasco:', errorMsg);
      setError(errorMsg);
      
      // Mostrar toast de erro
      toast({
        title: 'Erro',
        description: `Não foi possível registrar o recebimento: ${errorMsg}`,
        variant: 'destructive',
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchRecebimentos, toast]);

  // Função para limpar erros
  const limparErro = useCallback(() => {
    setError(null);
  }, []);

  // Carregar dados quando o componente é montado
  useEffect(() => {
    fetchRecebimentos();
  }, [fetchRecebimentos]);

  return {
    recebimentos,
    isLoading,
    error,
    refreshRecebimentos: fetchRecebimentos,
    adicionarRecebimento,
    limparErro,
  };
}