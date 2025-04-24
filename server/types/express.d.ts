import { User as SupabaseUser } from '@supabase/supabase-js';

declare global {
  namespace Express {
    // Estender a interface User (para autenticação por sessão)
    interface User {
      id: number;
      email: string;
      name?: string;
      role?: string;
      password?: string;
      baseId?: number | null;
      basename?: string | null;
      oficina_id?: number | null;
      is_active?: boolean;
    }

    // Estender a interface Request
    interface Request {
      supabaseUser?: SupabaseUser;
    }
  }
}