import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

// Obter configurações do Supabase de variáveis de ambiente
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

/**
 * Middleware para verificar autenticação baseada em token JWT (Supabase)
 * Este middleware verifica o token JWT no cabeçalho Authorization
 * e adiciona as informações do usuário a req.supabaseUser
 */
export const isJwtAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verificar se as variáveis de ambiente foram definidas
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('ERRO: Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY não definidas');
      return res.status(500).json({ message: "Erro de configuração do servidor" });
    }

    // Obter o token do cabeçalho Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Token de autenticação ausente ou inválido" });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Inicializar o cliente Supabase com o token
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

/**
 * Este middleware verifica a autenticação por sessão (Express) OU por token JWT (Supabase)
 * Utilizar para endpoints que devem suportar ambos os métodos de autenticação
 */
export const isAuthenticatedBySessionOrJwt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verificar se o usuário já está autenticado por sessão
    if (req.isAuthenticated()) {
      return next();
    }
    
    // Se não tem sessão, verificar token JWT
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    // Verificar se podemos usar autenticação JWT
    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    const token = authHeader.split(' ')[1];
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    // Anexar o usuário à requisição
    (req as any).supabaseUser = user;
    
    // Continuar
    next();
  } catch (error) {
    console.error('Erro ao validar autenticação:', error);
    return res.status(500).json({ message: "Erro no servidor" });
  }
};

// Re-exportar o middleware de autenticação da auth.ts para compatibilidade com código existente
export { isAuthenticated } from '../middleware/auth';