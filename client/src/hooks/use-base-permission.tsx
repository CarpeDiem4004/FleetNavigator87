import { useAuth } from "@/context/AuthContext";

// Definindo o tipo User para uso interno do hook
interface User {
  role?: string;
  baseId?: number;
  baseName?: string;
  bases?: {
    id: number;
    name: string;
  };
}

// Definindo tipo para permitir null em array de bases
type BaseIdArray = Array<number | null>;

// Mapeamento de rotas para bases
const baseRouteMap: Record<string, BaseIdArray> = {
  '/multas': [9], // Base Multas (id: 9)
  '/fines': [9], // Alias para Multas
  
  '/pneus': [10], // Base Pneus (id: 10)
  '/tires': [10], // Alias para Pneus
  
  '/line-hall': [11], // Base Line Hall (id: 11)
  
  '/gestao-de-frotas': [12], // Base Gestão de Frotas (id: 12)
  '/fleet-management': [12], // Alias para Gestão de Frotas
  
  // Rotas comuns (disponíveis para Gestão de Frotas e admin)
  '/maintenance': [12], // Apenas Gestão de Frotas
  '/vehicles': [0], // Disponível para todas as bases
  '/refueling': [0], // Disponível para todas as bases
  
  // Dashboard e usuários disponíveis apenas para admin ou bases específicas
  '/': [0], // Dashboard disponível para todos
  '/users': [0], // Usuários apenas para admin
};

// Interface para o retorno do hook
interface BasePermissionHook {
  hasPermission: (route: string) => boolean;
  getAccessibleRoutes: () => string[];
  isUserFromBase: (baseId: number) => boolean;
  getUserBase: () => {id: number | null, name: string | null};
}

// Hook para verificação de permissões baseadas na base do usuário
export const useBasePermission = (): BasePermissionHook => {
  const { user: authUser } = useAuth();
  const user = authUser as User | null;
  
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
    
    // Se a rota está marcada com 0, significa que está disponível para todas as bases
    if (baseRouteMap[route].includes(0)) {
      return true;
    }
    
    // Se o usuário não tiver uma base associada, verifica se a rota está disponível
    // apenas para usuários sem base
    if (!user?.baseId) {
      return false;
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
  const getUserBase = () => {
    // Se o usuário não existir ou não tiver base, retorna null
    if (!user || !user.baseId) {
      return { id: null, name: null };
    }
    
    // Tenta obter o nome da base da relação ou do campo baseName
    const baseName = user.bases?.name || user.baseName;
    
    return {
      id: user.baseId,
      name: baseName || null
    };
  };

  return {
    hasPermission,
    getAccessibleRoutes,
    isUserFromBase,
    getUserBase
  };
}