import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

// Definindo o tipo User para uso interno do hook
interface User {
  id?: number;
  name?: string;
  email?: string;
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

// Regras de correspondência entre bases e rotas
const baseRouteMapping = {
  'line hall': ['/line-hall'],
  'multas': ['/multas', '/fines'],
  'pneus': ['/pneus', '/tires'],
  'gestão de frotas': ['/gestao-de-frotas', '/fleet-management', '/maintenance'],
  'frota': ['/gestao-de-frotas', '/fleet-management', '/maintenance']
};

// Rotas básicas que todos os usuários têm acesso (exceto os que têm base específica)
const basicRoutes = ['/', '/vehicles', '/refueling'];

export function useBasePermission(): BasePermissionHook {
  const { user: authUser } = useAuth();
  const user = authUser as User | null;
  
  // Esta função verifica se uma rota está na lista de rotas para uma base específica
  const isRouteForBase = useCallback((route: string, basename: string): boolean => {
    const baseLower = basename.toLowerCase();
    
    // Verificar todas as chaves possíveis de baseRouteMapping
    for (const base in baseRouteMapping) {
      if (baseLower.includes(base)) {
        const routesForBase = baseRouteMapping[base as keyof typeof baseRouteMapping];
        if (routesForBase.includes(route)) {
          console.log(`Rota ${route} permitida para base: ${baseLower}`);
          return true;
        }
      }
    }
    return false;
  }, []);
  
  // Verifica se o usuário tem permissão para acessar a rota
  const hasPermission = useCallback((route: string): boolean => {
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
    
    // Line Hall - permite acesso somente ao Line Hall e bloqueia outras rotas
    if (user.basename === "Line Hall" || user.baseId === 11) {
      // Se o usuário for Line Hall, só mostra Line Hall no menu
      console.log("Verificando permissões do usuário Line Hall para rota:", route, user.basename, user.baseId);
      return route === '/line-hall';
    }
    
    // Verificar se o usuário tem uma base associada e se a rota corresponde a essa base
    if (user.basename) {
      if (isRouteForBase(route, user.basename)) {
        return true;
      }
    }
    
    // Se o usuário não tem base específica, permitir acesso a rotas básicas
    if (!user.baseId && !user.basename && basicRoutes.includes(route)) {
      return true;
    }
    
    return false;
  }, [user, isRouteForBase]);
  
  // Obtém todas as rotas que o usuário tem permissão para acessar
  const getAccessibleRoutes = useCallback((): string[] => {
    return allRoutes.filter(route => hasPermission(route));
  }, [hasPermission]);
  
  // Verifica se o usuário pertence a uma base específica
  const isUserFromBase = useCallback((baseId: number): boolean => {
    if (user?.role === 'admin') return true;
    return user?.baseId === baseId;
  }, [user]);
  
  // Obtém a base do usuário atual
  const getUserBase = useCallback(() => {
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