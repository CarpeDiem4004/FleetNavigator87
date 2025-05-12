/**
 * Hook para verificação de permissões
 * Permite verificar se o usuário tem as permissões (roles) necessárias para acessar determinadas funcionalidades
 */

import { useAuth } from '@/context/AuthContext';

/**
 * Hook que verifica se o usuário atual tem permissão baseado em seu papel (role)
 * 
 * @example
 * // Verifica se o usuário é admin
 * const hasAdminAccess = usePermission(['admin']);
 * 
 * // Verifica se o usuário é admin ou gestor de frota
 * const hasManagementAccess = usePermission(['admin', 'gestor_frota']);
 */
export default function usePermission(allowedRoles: string[]) {
  const { user } = useAuth();

  // Se não houver um usuário autenticado, retorna false
  if (!user) {
    return false;
  }

  // Usuário admin tem acesso completo a tudo
  if (user.role === 'admin') {
    return true;
  }

  // Verifica se o papel do usuário está na lista de papéis permitidos
  return allowedRoles.includes(user.role);
}