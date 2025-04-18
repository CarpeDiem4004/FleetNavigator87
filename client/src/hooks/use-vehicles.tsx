import { useQuery } from '@tanstack/react-query';

export interface Vehicle {
  id: number;
  plate: string;
  model: string;
  vehicleType: string;
  status: string;
  baseId: number;
}

/**
 * Hook customizado para carregar e compartilhar veículos em todo o aplicativo
 * Este hook garante que os veículos serão atualizados automaticamente 
 * quando novos forem adicionados ao banco de dados
 */
export function useVehicles() {
  const { 
    data: vehicles = [], 
    isLoading,
    isError,
    error
  } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
    refetchOnWindowFocus: true,
    refetchInterval: 15000, // Atualiza a cada 15 segundos
    staleTime: 10000, // Considera os dados obsoletos após 10 segundos
  });

  return {
    vehicles,
    isLoading,
    isError,
    error
  };
}