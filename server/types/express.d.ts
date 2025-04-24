// tipos/express.d.ts
import { User } from '../../shared/schema';

declare global {
  namespace Express {
    export interface Request {
      supabaseUser?: {
        id: string;
        email: string;
        role?: string;
        [key: string]: any;
      };
    }
    
    // Expandir a interface User para incluir os campos relevantes do nosso sistema
    export interface User {
      id: number;
      email: string;
      role: 'admin' | 'gestor' | 'operador' | 'oficina' | 'pneus';
      baseId?: number | null;
      basename?: string | null;
      oficina_id?: number | null;
      [key: string]: any;
    }
  }
}

// Esta exportação vazia é necessária para o TypeScript considerar este arquivo como um módulo
export {};