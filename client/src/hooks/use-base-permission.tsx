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
  'gestão de frotas': [
    '/gestao-de-frotas', 
    '/fleet-management', 
    '/maintenance', 
    '/vehicles', 
    '/refueling',
    '/tires',
    '/fines'
  ],
  'frota': [
    '/gestao-de-frotas', 
    '/fleet-management', 
    '/maintenance', 
    '/vehicles', 
    '/refueling',
    '/tires',
    '/fines'
  ]
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
      console.log(`Permission denied - No user`);
      return false;
    }
    
    // Administradores têm acesso a todas as rotas
    if (user.role === 'admin') {
      console.log(`Permission granted for admin user to route: ${route}`);
      return true;
    }
    
    // Usuários não-admin não podem acessar a página de usuários
    if (route === '/users') {
      console.log(`Permission denied for non-admin user to /users`);
      return false;
    }
    
    // Line Hall - permite acesso somente ao Line Hall e bloqueia outras rotas
    if (user.basename === "Line Hall" || user.baseId === 11) {
      // Se o usuário for Line Hall, só mostra Line Hall no menu
      const hasAccess = route === '/line-hall';
      console.log(`Line Hall user permission check for route ${route}: ${hasAccess ? 'GRANTED' : 'DENIED'} (baseId=${user.baseId}, basename=${user.basename})`);
      return hasAccess;
    }
    
    // Gestão de Frotas - permite acesso a todas as rotas relacionadas a frotas
    if (user.basename === "Gestão de Frotas" || user.baseId === 12) {
      console.log("VERIFICANDO USUÁRIO DE GESTÃO DE FROTAS:", user);
      
      const frotaRoutes = [
        '/', 
        '/gestao-de-frotas', 
        '/fleet-management', 
        '/maintenance', 
        '/vehicles', 
        '/refueling',
        '/tires',
        '/fines',
        '/accidents',
        '/work-safety'
      ];
      
      // Debug - imprime todas as rotas que o usuário pode acessar
      console.log("Rotas permitidas para Gestão de Frotas:", frotaRoutes.join(", "));
      
      const hasAccess = frotaRoutes.includes(route);
      console.log(`Gestão de Frotas user permission check for route ${route}: ${hasAccess ? 'GRANTED' : 'DENIED'} (baseId=${user.baseId}, basename=${user.basename})`);
      
      // Se a rota for fleet-management, sempre permitir para usuários de Gestão de Frotas
      if (route === '/fleet-management') {
        console.log("ACESSO ESPECIAL GARANTIDO para /fleet-management");
        return true;
      }
      
      return hasAccess;
    }
    
    // Verificar se o usuário tem uma base associada e se a rota corresponde a essa base
    if (user.basename) {
      const hasAccess = isRouteForBase(route, user.basename);
      console.log(`User with base "${user.basename}" permission check for route ${route} using baseRouteMapping: ${hasAccess ? 'GRANTED' : 'DENIED'}`);
      if (hasAccess) {
        return true;
      }
    }
    
    // Se o usuário não tem base específica, permitir acesso a rotas básicas
    if (!user.baseId && !user.basename && basicRoutes.includes(route)) {
      console.log(`Permission granted for user without base to basic route: ${route}`);
      return true;
    }
    
    console.log(`Permission denied by default for route: ${route} (user: ${user.email}, baseId: ${user.baseId}, basename: ${user.basename})`);
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