/**
 * Definições de tipos para usuários do sistema
 * Este arquivo contém interfaces relacionadas a autenticação e usuários
 */

/**
 * Interface que define a estrutura de um usuário autenticado
 * Esta estrutura é mais simples que o User completo e é usada durante a autenticação
 */
export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'gestor' | 'operador' | 'oficina' | 'pneus' | 'posto' | 'gestor_frota';
  base_id: number | null;
  basename: string | null;
  oficina_id: number | null;
}

/**
 * Interface que representa a estrutura do usuário conforme armazenado no banco de dados
 * Inclui campos como senha e status de ativação
 */
export interface User extends AuthenticatedUser {
  password: string;
  isActive: boolean;
  lastLogin?: Date | null;
}