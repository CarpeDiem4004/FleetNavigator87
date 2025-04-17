import React from "react";
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

// Interface para o retorno do hook
interface BasePermissionHook {
  hasPermission: (route: string) => boolean;
  getAccessibleRoutes: () => string[];
  isUserFromBase: (baseId: number) => boolean;
  getUserBase: () => {id: number | null, name: string | null};
}

// Lista de todas as rotas disponíveis no sistema
const allRoutes = [
  '/',                // Dashboard
  '/vehicles',        // Veículos
  '/maintenance',     // Manutenções
  '/tires',           // Pneus
  '/pneus',           // Alias para Pneus
  '/refueling',       // Abastecimentos
  '/fines',           // Multas
  '/multas',          // Alias para Multas
  '/line-hall',       // Line Hall
  '/fleet-management', // Gestão de Frota
  '/gestao-de-frotas', // Alias para Gestão de Frota
  '/users'            // Usuários (só admin)
];

// Hook para verificação de permissões baseadas na base do usuário
export function useBasePermission(): BasePermissionHook {
  const { user: authUser } = useAuth();
  const user = authUser as User | null;
  
  // Verifica se o usuário tem permissão para acessar a rota
  const hasPermission = React.useCallback((route: string): boolean => {
    // Se não houver usuário, não tem permissão para nada
    if (!user) {
      return false;
    }
    
    // Administradores têm acesso a todas as rotas
    if (user.role === 'admin') {
      return true;
    }
    
    // Usuários não-admin não podem acessar a página de usuários
    if (route === '/users') {
      return false;
    }
    
    // Verificar se o usuário tem uma base associada
    if (!user.baseId && !user.basename) {
      // Sem base específica, permitir apenas acesso ao dashboard e veículos (básico)
      return route === '/' || route === '/vehicles' || route === '/refueling';
    }
    
    // Se tiver basename = "Line Hall", permitir acesso a line-hall
    if (user.basename?.toLowerCase() === 'line hall') {
      if (route === '/line-hall') {
        return true;
      }
    }
    
    // Se tiver basename = "Multas", permitir acesso a multas/fines
    if (user.basename?.toLowerCase() === 'multas') {
      if (route === '/multas' || route === '/fines') {
        return true;
      }
    }
    
    // Se tiver basename = "Pneus", permitir acesso a pneus/tires
    if (user.basename?.toLowerCase() === 'pneus') {
      if (route === '/pneus' || route === '/tires') {
        return true;
      }
    }
    
    // Se tiver basename = "Gestão de Frotas", permitir acesso a gestão de frotas e manutenção
    if (user.basename?.toLowerCase().includes('frota')) {
      if (route === '/gestao-de-frotas' || route === '/fleet-management' || route === '/maintenance') {
        return true;
      }
    }
    
    // Permitir acesso a rotas básicas para todos os usuários
    return route === '/' || route === '/vehicles' || route === '/refueling';
  }, [user]);
  
  // Obtém todas as rotas que o usuário tem permissão para acessar
  const getAccessibleRoutes = React.useCallback((): string[] => {
    return allRoutes.filter(route => hasPermission(route));
  }, [hasPermission]);
  
  // Verifica se o usuário pertence a uma base específica
  const isUserFromBase = React.useCallback((baseId: number): boolean => {
    if (user?.role === 'admin') return true;
    return user?.baseId === baseId;
  }, [user]);
  
  // Obtém a base do usuário atual
  const getUserBase = React.useCallback(() => {
    // Se o usuário não existir ou não tiver base, retorna null
    if (!user || (!user.baseId && !user.basename)) {
      return { id: null, name: null };
    }
    
    // Tenta obter o nome da base da relação ou do campo basename
    const baseName = user.bases?.name || user.basename;
    
    return {
      id: user.baseId || null,
      name: baseName || null
    };
  }, [user]);

  return {
    hasPermission,
    getAccessibleRoutes,
    isUserFromBase,
    getUserBase
  };
}