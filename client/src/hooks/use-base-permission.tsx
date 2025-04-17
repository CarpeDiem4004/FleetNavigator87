import { useAuth } from "@/context/AuthContext";

// Definindo o tipo User para uso interno do hook
interface User {
  role?: string;
  baseId?: number;
  basename?: string;
  bases?: {
    id: number;
    name: string;
  };
}

// Definindo tipo para permitir null em array de bases
type BaseIdArray = Array<number | null>;

// Mapeamento de rotas para bases
const baseRouteMap: Record<string, BaseIdArray> = {
  // Rotas específicas por base
  '/multas': [1], // Base Multas (id: 1)
  '/fines': [1], // Alias para Multas
  
  '/pneus': [2], // Base Pneus (id: 2)
  '/tires': [2], // Alias para Pneus
  
  '/line-hall': [3], // Base Line Hall (id: 3)
  
  '/gestao-de-frotas': [4], // Base Gestão de Frotas (id: 4)
  '/fleet-management': [4], // Alias para Gestão de Frotas
  '/maintenance': [4], // Apenas Gestão de Frotas
  
  // Rotas globais (disponíveis apenas para admin)
  '/vehicles': [null], // Apenas admin ou sem restrição de base
  '/refueling': [null], // Apenas admin ou sem restrição de base
  '/': [null], // Dashboard disponível apenas para admin ou sem restrição
  '/users': [null], // Usuários apenas para admin ou sem restrição
};

// Interface para o retorno do hook
interface BasePermissionHook {
  hasPermission: (route: string) => boolean;
  getAccessibleRoutes: () => string[];
  isUserFromBase: (baseId: number) => boolean;
  getUserBase: () => {id: number | null, name: string | null};
}

// Hook para verificação de permissões baseadas na base do usuário
export function useBasePermission(): BasePermissionHook {
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
    
    // Se a rota inclui null, significa que é apenas para admin (que já verificamos acima)
    // ou para usuários sem restrição específica de base
    if (baseRouteMap[route].includes(null)) {
      return false; // Usuários não-admin não têm acesso a rotas com null
    }
    
    // Se o usuário não tiver uma base associada, não tem acesso a rotas específicas de base
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
    
    // Tenta obter o nome da base da relação ou do campo basename
    const baseName = user.bases?.name || user.basename;
    
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