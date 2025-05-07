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
  '/',                                 // Dashboard
  '/executive-dashboard',              // Dashboard Executivo
  '/vehicles',                         // Veículos
  '/drivers',                          // Motoristas
  '/maintenance',                      // Manutenções
  '/manutencao',                       // Alias para Manutenções
  '/tires',                            // Pneus
  '/pneus',                            // Alias para Pneus
  '/refueling',                        // Abastecimentos
  '/abastecimento',                    // Alias para Abastecimentos
  '/fuel-card',                        // Cartão de Combustível
  '/fuel-card-requests',               // Painel de Solicitações Fuel Card
  '/posto-remedios',                   // Posto Remédios
  '/cartao-abastecimento',             // Cartão de Abastecimento
  '/fines',                            // Multas
  '/multas',                           // Alias para Multas
  '/line-hall',                        // Line Hall (antigo)
  '/line-hall-shopee',                 // Line Hall Shopee (novo)
  '/fleet-management',                 // Gestão de Frota
  '/gestao-de-frotas',                 // Alias para Gestão de Frota
  '/fleet-management/inventory',       // Gestão de Estoque
  '/fleet-management/maintenance',     // Sistema de Manutenção
  '/fleet-management/workshops',       // Oficinas Credenciadas
  '/fleet-management/budgets',         // Orçamentos
  '/work-safety',                      // Segurança do Trabalho
  '/seguranca-trabalho',               // Alias para Segurança do Trabalho
  '/theft',                            // Roubo
  '/roubo',                            // Alias para Roubo
  '/sinister',                         // Sinistro
  '/sinistro',                         // Alias para Sinistro
  '/accidents',                        // Acidentes
  '/acidentes',                        // Alias para Acidentes
  '/users',                            // Usuários (só admin)
  '/bases',                            // Bases (só admin)
  '/bases/campinas',                   // Base Campinas
  '/bases/campinas/despesas',          // Despesas Campinas
  '/bases/campinas/solicitacao-pneus', // Solicitação de Pneus
  '/bases/campinas/solicitacao-orcamento', // Solicitação de Orçamento
  '/bases/campinas/manutencao-frota',  // Manutenção de Frota
  '/postos/visao-geral',               // Visão Geral dos Postos
  '/postos'                            // Postos de Abastecimento
];

// Regras de correspondência entre bases e rotas específicas
const baseRouteMapping = {
  'line hall': ['/line-hall', '/line-hall-shopee'],
  'multas': ['/multas', '/fines'],
  'pneus': ['/pneus', '/tires'],
  'campinas': [
    '/bases/campinas',
    '/bases/campinas/despesas',
    '/bases/campinas/solicitacao-pneus',
    '/bases/campinas/solicitacao-orcamento',
    '/bases/campinas/manutencao-frota'
  ],
  'gestão de frotas': [
    '/gestao-de-frotas', 
    '/fleet-management', 
    '/executive-dashboard',
    '/fleet-management/inventory',
    '/fleet-management/maintenance',
    '/fleet-management/workshops',
    '/maintenance', 
    '/manutencao',
    '/vehicles', 
    '/refueling',
    '/abastecimento',
    '/tires',
    '/pneus',
    '/fines',
    '/multas',
    '/line-hall-shopee',
    '/fuel-card',
    '/fuel-card-requests'
  ],
  'frota': [
    '/gestao-de-frotas', 
    '/fleet-management', 
    '/executive-dashboard',
    '/fleet-management/inventory',
    '/fleet-management/maintenance',
    '/fleet-management/workshops',
    '/maintenance', 
    '/manutencao',
    '/vehicles', 
    '/refueling',
    '/abastecimento',
    '/tires',
    '/pneus',
    '/fines',
    '/multas',
    '/line-hall-shopee',
    '/fuel-card',
    '/fuel-card-requests'
  ],
  'segurança do trabalho': [
    '/work-safety',
    '/seguranca-trabalho'
  ],
  'sinistro': [
    '/theft',
    '/roubo',
    '/sinister',
    '/sinistro',
    '/accidents',
    '/acidentes'
  ]
};

// Rotas básicas que TODAS as bases têm acesso (modelo padrão de acesso para qualquer base)
const basicRoutes = [
  '/',                                   // Dashboard
  '/executive-dashboard',                // Dashboard Executivo
  '/vehicles',                           // Cadastro e gestão de veículos
  '/drivers',                            // Cadastro e gestão de motoristas
  '/maintenance',                        // Solicitações de manutenção
  '/manutencao',                         // Alias para manutenção
  '/tires',                              // Solicitações de pneus
  '/pneus',                              // Alias para pneus
  '/refueling',                          // Registros de abastecimento
  '/fuel-card',                          // Cartão de Combustível
  '/fuel-card-requests',                 // Painel de Solicitações Fuel Card
  '/posto-remedios',                     // Posto Remédios
  '/cartao-abastecimento',               // Cartão de Abastecimento
  '/work-safety',                        // Informar acidentes de trabalho
  '/seguranca-trabalho',                 // Alias para segurança do trabalho
  '/theft',                              // Registro de roubos
  '/roubo',                              // Alias para roubo
  '/sinister',                           // Registros de sinistros
  '/sinistro',                           // Alias para sinistro
  '/accidents',                          // Registros de acidentes
  '/acidentes',                          // Alias para acidentes
  '/postos/visao-geral',                 // Visão Geral dos Postos
  '/postos',                             // Postos de Abastecimento
  '/bases',                              // Bases
  '/bases/campinas',                     // Base Campinas
  '/bases/campinas/despesas',            // Despesas Campinas
  '/bases/campinas/solicitacao-pneus',   // Solicitação de Pneus
  '/bases/campinas/solicitacao-orcamento', // Solicitação de Orçamento
  '/bases/campinas/manutencao-frota',    // Manutenção de Frota
  '/users'                               // Página de Usuários (acesso para todos, verificação adicional feita no hasPermission)
];

export const useBasePermission = (): BasePermissionHook => {
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
    // Se for um link '#' usado para menus com subitens, sempre permitir
    if (route === '#') {
      return true;
    }
    
    // Se não houver usuário, não tem permissão para nada
    if (!user) {
      console.log(`Permission denied - No user`);
      return false;
    }
    
    // Administradores têm acesso a todas as rotas
    // Verificamos admin com case-insensitive e também verificamos emails específicos de admin
    if (
      user.role?.toLowerCase() === 'admin' || 
      (user.email && ['joao.paulo@muricionfleet.com', 'regio@muricionfleet.com', 'andre.rosa@muricionfleet.com'].includes(user.email.toLowerCase()))
    ) {
      console.log(`Permission granted for admin user to route: ${route} (admin role: ${user.role}, email: ${user.email})`);
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
    if ((route === '/users' || route === '/bases') && 
        user.role?.toLowerCase() !== 'admin' && 
        user.role?.toUpperCase() !== 'ADMIN') {
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
      const hasAccess = route === '/line-hall' || route === '/line-hall-shopee' || route === '/';
      console.log(`Line Hall user permission check for route ${route}: ${hasAccess ? 'GRANTED' : 'DENIED'} (baseId=${user.baseId}, basename=${user.basename})`);
      return hasAccess;
    }
    
    // Gestão de Frotas - permite acesso a rotas relacionadas à frota, MAS NÃO AO DASHBOARD
    if (user.basename === "Gestão de Frotas" || user.baseId === 12) {
      // Rotas acessíveis - removida a rota '/' (dashboard)
      const frotaRoutes = [
        '/gestao-de-frotas', 
        '/fleet-management',                          // Página principal da Gestão de Frotas
        '/executive-dashboard',                       // Dashboard Executivo
        '/fleet-management/maintenance',              // Sistema de manutenção
        '/fleet-management/budgets',                  // Sistema de orçamentos
        '/fleet-management/workshops',                // Oficinas credenciadas
        '/fleet-management/inventory',                // Gestão de estoque
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
        '/fuel-card',                                 // Cartão de Combustível
        '/fuel-card-requests',                        // Painel de Solicitações Fuel Card
        '/posto-remedios',                            // Posto Remédios
        '/cartao-abastecimento',                     // Cartão de Abastecimento
        '/tires',                                     // Pneus
        '/fines',                                     // Multas
        '/line-hall-shopee',                          // Line Hall Shopee
        '/accidents',                                 // Acidentes/Roubos
        '/work-safety',                               // Segurança do Trabalho
        '/postos/visao-geral',                        // Visão Geral dos Postos
        '/postos'                                     // Postos de Abastecimento
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
    
    // Pneus - permite acesso somente aos pneus (sem acesso ao dashboard)
    if (user.basename === "Pneus" || user.baseId === 10 || user.role === 'pneus') {
      // Lista de rotas permitidas para usuários de pneus
      const tiresRoutes = ['/pneus', '/tires', '/tires/entrada'];
      const hasAccess = tiresRoutes.includes(route);
      console.log(`Pneus user permission check for route ${route}: ${hasAccess ? 'GRANTED' : 'DENIED'}`);
      
      // NEGAR explicitamente o acesso ao dashboard - o redirecionamento será feito pelo ProtectedRoute
      if (route === '/') {
        console.log(`Acesso NEGADO ao dashboard para usuário de Pneus`);
        return false;
      }
      
      return hasAccess;
    }
    
    // Usuário Micael - acesso específico para Goiânia SGO4
    if (user.email === "micael@muricionfleet.com" || 
        (user.name === "micael" && user.baseId === 101 && user.basename === "Goiânia SGO4")) {
      
      // Permitir acesso à manutenção e pneus + dashboard
      const micaelRoutes = ['/', '/maintenance', '/manutencao', '/tires', '/pneus'];
      const hasAccess = micaelRoutes.includes(route);
      
      // Negar explicitamente acesso ao painel de controle
      if (route === '/control-panel' || route === '/dashboard/control') {
        console.log(`Acesso NEGADO ao painel de controle para usuário Micael`);
        return false;
      }
      
      console.log(`Usuário Micael permission check for route ${route}: ${hasAccess ? 'GRANTED' : 'DENIED'}`);
      return hasAccess;
    }
    
    // Modelo padrão de base - TODAS as bases têm acesso a estas funcionalidades
    if (user.baseId || user.basename) {
      // Primeiro, verificar se a rota está nas rotas básicas (modelo padrão para todas as bases)
      if (basicRoutes.includes(route)) {
        console.log(`Acesso PERMITIDO para base ${user.basename || user.baseId} à rota básica: ${route}`);
        return true;
      }
      
      // Depois, verificar se a base tem permissões adicionais específicas via mapeamento
      if (user.basename) {
        const hasSpecificAccess = isRouteForBase(route, user.basename);
        if (hasSpecificAccess) {
          console.log(`Acesso PERMITIDO para base específica "${user.basename}" à rota: ${route}`);
          return true;
        }
      }
      
      console.log(`Acesso NEGADO para base ${user.basename || user.baseId} à rota não básica: ${route}`);
      return false;
    }
    
    // Se o usuário não tem base específica (caso raro), permitir apenas rotas básicas
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
    if (user?.role === 'admin' || user?.role === 'ADMIN') return true;
    return user?.baseId === baseId;
  }, [user]);
  
  // Obtém a base do usuário atual
  const getUserBase = useCallback(() => {
    // Se o usuário não existir ou não tiver base, retorna null
    if (!user || (!user.baseId && !user.basename)) {
      return { id: null, name: null };
    }
    
    // Tenta obter o nome da base da relação ou do campo basename
    // Temos que fazer uma verificação de tipo para baseName
    const baseName = user.bases?.name || user.basename || null;
    
    return {
      id: user.baseId || null,
      name: baseName
    };
  }, [user]);

  return {
    hasPermission,
    getAccessibleRoutes,
    isUserFromBase,
    getUserBase
  };
}