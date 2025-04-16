import { useAuth } from "@/context/AuthContext";

// Definindo tipo para permitir null em array de bases
type BaseIdArray = Array<number | null>;

// Mapeamento de rotas para bases
const baseRouteMap: Record<string, BaseIdArray> = {
  '/multas': [1], // Base Multas (id: 1)
  '/fines': [1], // Alias para Multas
  
  '/pneus': [2], // Base Pneus (id: 2)
  '/tires': [2], // Alias para Pneus
  
  '/line-hall': [3], // Base Line Hall (id: 3)
  
  '/gestao-de-frotas': [4], // Base Gestão de Frotas (id: 4)
  '/fleet-management': [4], // Alias para Gestão de Frotas
  
  // Rotas comuns (disponíveis para Gestão de Frotas e admin)
  '/maintenance': [4], // Apenas Gestão de Frotas
  '/vehicles': [null], // Disponível para todas as bases
  '/refueling': [null], // Disponível para todas as bases
  
  // Dashboard e usuários disponíveis apenas para admin ou bases específicas
  '/': [null], // Dashboard disponível para todos
  '/users': [null], // Usuários apenas para admin
};

export function useBasePermission() {
  const { user } = useAuth();
  
  // Verifica se o usuário tem permissão para acessar a rota
  const hasPermission = (route: string): boolean => {
    // Administradores têm acesso a todas as rotas
    if (user?.role === 'admin') {
      return true;
    }
    
    // Verifica se a rota existe no mapeamento
    if (!baseRouteMap[route]) {
      // Se a rota não estiver no mapeamento, consideramos permissão negada
      return false;
    }
    
    // Se o mapeamento da rota for null, a rota está disponível para todas as bases
    if (baseRouteMap[route].includes(null)) {
      return true;
    }
    
    // Se o usuário não tiver uma base associada, verifica se a rota está disponível
    // apenas para usuários sem base
    if (!user?.baseId) {
      return baseRouteMap[route].includes(0);
    }
    
    // Verifica se a baseId do usuário está na lista de bases permitidas para a rota
    return baseRouteMap[route].includes(user.baseId);
  };
  
  // Obtém todas as rotas que o usuário tem permissão para acessar
  const getAccessibleRoutes = (): string[] => {
    return Object.keys(baseRouteMap).filter(route => hasPermission(route));
  };
  
  // Verifica se o usuário pertence a uma base específica
  const isUserFromBase = (baseId: number): boolean => {
    if (user?.role === 'admin') return true;
    return user?.baseId === baseId;
  };
  
  // Obtém a base do usuário atual
  const getUserBase = (): {id: number | null, name: string | null} => {
    return {
      id: user?.baseId || null,
      name: user?.baseName || null
    };
  };

  return {
    hasPermission,
    getAccessibleRoutes,
    isUserFromBase,
    getUserBase
  };
}