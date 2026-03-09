/**
 * Hook personalizado para gerenciar cache de abastecimentos de forma inteligente
 * Elimina a necessidade de window.location.reload()
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export function useAbastecimentoCache() {
  const queryClient = useQueryClient();

  // Invalida cache de histórico para um posto específico
  const invalidarHistoricoPosto = useCallback((posto: string) => {
    const postoFormatado = posto.toLowerCase();
    
    // Invalidar todas as consultas relacionadas a este posto
    const keysToInvalidate = [
      `/api/abastecimento/${postoFormatado}/historico`,
      `/api/historico-direto/posto ${postoFormatado}`,
      `/api/historico-direto/${postoFormatado}`,
      `/api/guarulhos-v2/historico`,
      `/api/osasco-v2/historico`,
      `/api/diagnostico/abastecimentos/${postoFormatado}`,
    ];

    keysToInvalidate.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });

    console.log(`Cache de histórico invalidado para posto: ${posto}`);
  }, [queryClient]);

  // Invalida cache de configuração de tanques
  const invalidarConfiguracaoTanques = useCallback((posto: string) => {
    const postoFormatado = posto.toLowerCase();
    
    queryClient.invalidateQueries({
      queryKey: [`/api/configuracao-tanques/${postoFormatado}`]
    });

    console.log(`Cache de configuração de tanques invalidado para posto: ${posto}`);
  }, [queryClient]);

  // Invalida todo o cache relacionado a um posto
  const invalidarTudoPosto = useCallback((posto: string) => {
    invalidarHistoricoPosto(posto);
    invalidarConfiguracaoTanques(posto);
    
    // Invalidar também caches globais que podem incluir dados deste posto
    queryClient.invalidateQueries({ queryKey: ['/api/dashboard/kpis'] });
    queryClient.invalidateQueries({ queryKey: ['/api/painel-principal'] });
  }, [invalidarHistoricoPosto, invalidarConfiguracaoTanques, queryClient]);

  // Força uma nova busca de dados (refetch)
  const recarregarDadosPosto = useCallback(async (posto: string) => {
    const postoFormatado = posto.toLowerCase();
    
    try {
      // Fazer refetch de todas as queries ativas relacionadas ao posto
      await queryClient.refetchQueries({
        queryKey: [`/api/abastecimento/${postoFormatado}/historico`]
      });
      
      await queryClient.refetchQueries({
        queryKey: [`/api/configuracao-tanques/${postoFormatado}`]
      });

      console.log(`Dados recarregados com sucesso para posto: ${posto}`);
    } catch (error) {
      console.error(`Erro ao recarregar dados para posto ${posto}:`, error);
    }
  }, [queryClient]);

  // Função principal a ser chamada após registro de abastecimento
  const atualizarAposRegistro = useCallback(async (posto: string) => {
    console.log(`Atualizando cache após registro de abastecimento em: ${posto}`);
    
    // 1. Invalidar caches primeiro
    invalidarTudoPosto(posto);
    
    // 2. Aguardar um momento para garantir que a inserção foi processada
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 3. Recarregar dados ativamente
    await recarregarDadosPosto(posto);
    
    console.log(`Atualização de cache concluída para posto: ${posto}`);
  }, [invalidarTudoPosto, recarregarDadosPosto]);

  // Adiciona um novo registro ao cache localmente (otimistic update)
  const adicionarRegistroOtimista = useCallback((posto: string, novoRegistro: any) => {
    const postoFormatado = posto.toLowerCase();
    const queryKey = [`/api/abastecimento/${postoFormatado}/historico`];
    
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData) return { data: [novoRegistro], count: 1 };
      
      return {
        ...oldData,
        data: [novoRegistro, ...oldData.data],
        count: oldData.count + 1
      };
    });

    console.log(`Registro adicionado otimisticamente ao cache para posto: ${posto}`);
  }, [queryClient]);

  return {
    invalidarHistoricoPosto,
    invalidarConfiguracaoTanques,
    invalidarTudoPosto,
    recarregarDadosPosto,
    atualizarAposRegistro,
    adicionarRegistroOtimista,
  };
}