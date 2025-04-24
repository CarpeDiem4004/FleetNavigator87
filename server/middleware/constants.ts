/**
 * Constantes compartilhadas para middleware de autenticação e autorização
 */

// Lista de emails de administradores do sistema
export const ADMIN_EMAILS = [
  'joao.paulo@muricionfleet.com',
  'regio@muricionfleet.com',
  'andre.rosa@muricionfleet.com'
];

// ID da base de gestão de frotas
export const FLEET_MANAGEMENT_BASE_ID = 12;

// Função utilitária para verificar se um usuário é administrador
export function isUserAdmin(user: any): boolean {
  if (!user) return false;
  
  return (
    // Role contém 'admin' (case insensitive)
    (user.role && typeof user.role === 'string' && user.role.toLowerCase().includes('admin')) ||
    // Email está na lista de emails de administradores
    (user.email && typeof user.email === 'string' && ADMIN_EMAILS.includes(user.email.toLowerCase()))
  );
}

// Função utilitária para verificar se um usuário pertence à gestão de frotas
export function isUserInFleetManagement(user: any): boolean {
  if (!user) return false;
  
  return (
    // Usuário é admin
    isUserAdmin(user) ||
    // Usuário pertence à base de gestão de frotas
    (user.baseId === FLEET_MANAGEMENT_BASE_ID)
  );
}

// Função utilitária para verificar se um usuário pode acessar uma determinada base
export function canUserAccessBase(user: any, baseId: number | string): boolean {
  if (!user) return false;
  
  // Conversão para número se necessário
  const numericBaseId = typeof baseId === 'string' ? parseInt(baseId, 10) : baseId;
  
  return (
    // Usuário é admin (pode acessar qualquer base)
    isUserAdmin(user) ||
    // Usuário pertence à base solicitada
    (user.baseId === numericBaseId)
  );
}