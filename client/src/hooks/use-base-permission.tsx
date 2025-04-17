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
  '/multas': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], // Base Multas
  '/fines': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], // Alias para Multas
  
  '/pneus': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], // Base Pneus
  '/tires': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], // Alias para Pneus
  
  '/line-hall': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], // Base Line Hall
  
  '/gestao-de-frotas': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], // Base Gestão de Frotas
  '/fleet-management': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], // Alias para Gestão de Frotas
  '/maintenance': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], // Gestão de Frotas
  
  // Rotas globais (disponíveis apenas para admin)
  '/vehicles': [null], // Apenas admin
  '/refueling': [null], // Apenas admin
  '/': [null], // Dashboard apenas para admin
  '/users': [null], // Usuários apenas para admin
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
    
    // Se o usuário não tiver uma base associada, só pode acessar rotas sem restrição
    if (!user?.baseId) {
      // Por enquanto, permitir acesso a dashboard e veículos para todos
      return route === '/' || route === '/vehicles';
    }
    
    // Rotas administrativas restritas
    if (route === '/users') {
      return false; // Somente para admin
    }
    
    // Map route to expected baseId
    // Multas - baseId 1
    if ((route === '/multas' || route === '/fines') && user.baseId === 1) {
      return true;
    }
    
    // Pneus - baseId 2
    if ((route === '/pneus' || route === '/tires') && user.baseId === 2) {
      return true;
    }
    
    // Line Hall - baseId 3 
    if (route === '/line-hall' && user.baseId === 3) {
      return true;
    }
    
    // Gestão de Frotas - baseId 4
    if ((route === '/gestao-de-frotas' || route === '/fleet-management' || route === '/maintenance') 
      && user.baseId === 4) {
      return true;
    }
    
    // Se o baseId não for exatamente 1, 2, 3 ou 4, permitir acesso a rota com mesmo nome
    const baseName = user.basename?.toLowerCase() || '';
    if (baseName === 'line hall' && route === '/line-hall') {
      return true;
    }
    if (baseName === 'multas' && (route === '/multas' || route === '/fines')) {
      return true;
    }
    if (baseName === 'pneus' && (route === '/pneus' || route === '/tires')) {
      return true;
    }
    if (baseName === 'gestao de frotas' && 
        (route === '/gestao-de-frotas' || route === '/fleet-management' || route === '/maintenance')) {
      return true;
    }
    
    // Caso contrário, permitir acesso ao dashboard, veículos e abastecimentos para todos
    return route === '/' || route === '/vehicles' || route === '/refueling';
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