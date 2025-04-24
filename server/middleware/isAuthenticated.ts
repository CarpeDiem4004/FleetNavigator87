import { Request, Response, NextFunction } from 'express';

// Re-exportar o middleware de autenticação da auth.ts para compatibilidade com código existente
export { isAuthenticated } from '../middleware/auth';

// Também exportar o isAuthenticated como isAuthenticatedBySessionOrJwt para leitura semântica mais clara
export { isAuthenticated as isAuthenticatedBySessionOrJwt } from '../middleware/auth';

/**
 * Middleware para verificar autenticação baseada em token JWT (Supabase)
 * Este middleware verifica apenas o token JWT no cabeçalho Authorization
 * e adiciona as informações do usuário a req.supabaseUser
 */
export const isJwtAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Obter o token do cabeçalho Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Token de autenticação ausente ou inválido" });
    }
    
    // Verificar configurações do Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('ERRO: Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY não definidas');
      return res.status(500).json({ message: "Erro de configuração do servidor" });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Importação dinâmica do cliente Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Verificar o token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('Erro ao validar token JWT:', error);
      return res.status(401).json({ message: "Token de autenticação inválido" });
    }
    
    // Anexar o usuário à requisição
    (req as any).supabaseUser = user;
    
    // Continuar
    next();
  } catch (error) {
    console.error('Erro ao processar token JWT:', error);
    return res.status(500).json({ message: "Erro no servidor" });
  }
};