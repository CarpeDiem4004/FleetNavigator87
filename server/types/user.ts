/**
 * Tipos para os usuários do sistema
 */

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  base_id: number | null;
  basename: string | null;
  oficina_id: number | null;
  is_active: boolean;
  last_login?: Date | null;
}

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: string;
  base_id: number | null;
  basename: string | null;
  oficina_id: number | null;
}