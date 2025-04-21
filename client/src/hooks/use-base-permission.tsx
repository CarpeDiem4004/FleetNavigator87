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
  oficina_id?: number;
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
    
    // Oficinas têm acesso apenas à rota de dashboard da oficina
    if (user.role === 'oficina') {
      const oficinaRoutes = ['/oficina/dashboard', '/oficinas/dashboard'];
      const hasAccess = oficinaRoutes.includes(route);
      console.log(`Oficina user permission check for route ${route}: ${hasAccess ? 'GRANTED' : 'DENIED'} (oficina_id=${user.oficina_id})`);
      return hasAccess;
    }
    
    // Usuários não-admin não podem acessar a página de usuários ou bases
    if (route === '/users' || route === '/bases') {
      console.log(`Permission denied for non-admin user to ${route}`);
      return false;
    }
    
    // Sempre permitir acesso à dashboard
    if (route === '/') {
      return true;
    }
    
    // Line Hall - permite acesso somente ao Line Hall e bloqueia outras rotas específicas
    if (user.basename === "Line Hall" || user.baseId === 11) {
      // Se o usuário for Line Hall, só mostra Line Hall no menu e dashboard
      const hasAccess = route === '/line-hall' || route === '/';
      console.log(`Line Hall user permission check for route ${route}: ${hasAccess ? 'GRANTED' : 'DENIED'} (baseId=${user.baseId}, basename=${user.basename})`);
      return hasAccess;
    }
    
    // Gestão de Frotas - permite acesso a rotas relacionadas à frota, MAS NÃO AO DASHBOARD
    if (user.basename === "Gestão de Frotas" || user.baseId === 12) {
      // Rotas acessíveis - removida a rota '/' (dashboard)
      const frotaRoutes = [
        '/gestao-de-frotas', 
        '/fleet-management',                          // Página principal da Gestão de Frotas
        '/fleet-management/maintenance',              // Sistema de manutenção
        '/fleet-management/budgets',                  // Sistema de orçamentos
        '/fleet-management/workshops',                // Oficinas credenciadas
        '/fleet-management/operational-analysis',     // Análise da operação  
        '/fleet-management/fleet-overview',           // Visão geral da frota
        '/fleet-management/downtime-analysis',        // Dias de veículos parados em manutenção
        '/fleet-management/downtime',                 // Alias para dias parados
        '/fleet-management/operation',                // Alias para análise de operação
        '/fleet-management/overview',                 // Alias para visão geral
        '/maintenance',                               // Sistema de manutenção (rota antiga)
        '/manutencao',                                // Solicitações de manutenção
        '/tratativa-manutencao',                      // Tratativas de manutenção
        '/vehicles',                                  // Veículos
        '/refueling',                                 // Abastecimentos
        '/tires',                                     // Pneus
        '/fines',                                     // Multas
        '/accidents',                                 // Acidentes/Roubos
        '/work-safety'                                // Segurança do Trabalho
      ];
      
      const hasAccess = frotaRoutes.includes(route);
      
      // Se estiver tentando acessar o dashboard, redirecionar para página de redirecionamento
      if (route === '/') {
        console.log(`Usuário de Gestão de Frotas tentando acessar o dashboard - redirecionando para /fleet-redirect`);
        
        // Redirecionar programaticamente para a página de redirecionamento
        setTimeout(() => {
          window.location.href = '/fleet-redirect';
        }, 100);
        
        // Temporariamente permitir acesso ao dashboard enquanto redireciona
        return true;
      }
      
      if (hasAccess) {
        console.log(`Acesso PERMITIDO para usuário de Gestão de Frotas à rota: ${route}`);
        return true;
      } else {
        console.log(`Acesso NEGADO para usuário de Gestão de Frotas à rota: ${route}`);
        return false;
      }
    }
    
    // Multas - permite acesso somente às multas
    if (user.basename === "Multas" || user.baseId === 9) {
      const hasAccess = route === '/multas' || route === '/fines' || route === '/';
      console.log(`Multas user permission check for route ${route}: ${hasAccess ? 'GRANTED' : 'DENIED'}`);
      return hasAccess;
    }
    
    // Pneus - permite acesso somente aos pneus
    if (user.basename === "Pneus" || user.baseId === 10) {
      const hasAccess = route === '/pneus' || route === '/tires' || route === '/';
      console.log(`Pneus user permission check for route ${route}: ${hasAccess ? 'GRANTED' : 'DENIED'}`);
      return hasAccess;
    }
    
    // Para outras bases específicas, usar o mapeamento
    if (user.basename) {
      const hasAccess = isRouteForBase(route, user.basename);
      console.log(`User with base "${user.basename}" permission check for route ${route}: ${hasAccess ? 'GRANTED' : 'DENIED'}`);
      return hasAccess;
    }
    
    // Se o usuário não tem base específica mas não é admin, permitir apenas rotas básicas
    if (!user.baseId && !user.basename) {
      const hasAccess = basicRoutes.includes(route);
      console.log(`User without specific base permission check for route ${route}: ${hasAccess ? 'GRANTED' : 'DENIED'}`);
      return hasAccess;
    }
    
    // Negar acesso por padrão
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