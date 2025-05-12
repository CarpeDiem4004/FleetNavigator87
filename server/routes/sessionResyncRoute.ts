/**
 * Rota para ressincronização de sessão
 * Resolve o problema de 401 após reinicialização do servidor
 * ou mudança de domínio
 */
import { Request, Response } from 'express';
import { Pool } from 'pg';

let pool: Pool;

// Inicializar o pool (chamado de routes.ts)
export function initResyncRoutes(pgPool: Pool) {
  pool = pgPool;
}

// Handler para a rota de ressincronização
export async function resyncSession(req: Request, res: Response) {
  try {
    console.log("[ResyncSession] Tentando sincronizar sessão");
    
    if (!req.body || (!req.body.user && !req.body.email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Dados do usuário não fornecidos" 
      });
    }
    
    // Obter informações do usuário a partir do corpo da requisição
    const { user, email } = req.body;
    
    // Tentar localizar o usuário no banco de dados
    let dbUser;
    
    if (user && user.id) {
      // Se tiver ID, buscar diretamente
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [user.id]);
      
      if (result && result.rows && result.rows.length > 0) {
        dbUser = result.rows[0];
      } else {
        // Tentar na tabela usuarios (compatibilidade)
        const tradResult = await pool.query('SELECT * FROM usuarios WHERE id = $1', [user.id]);
        if (tradResult && tradResult.rows && tradResult.rows.length > 0) {
          dbUser = tradResult.rows[0];
        }
      }
    } else if (email) {
      // Buscar por email se não tiver ID
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (result && result.rows && result.rows.length > 0) {
        dbUser = result.rows[0];
      } else {
        // Tentar na tabela usuarios (compatibilidade)
        const tradResult = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (tradResult && tradResult.rows && tradResult.rows.length > 0) {
          dbUser = tradResult.rows[0];
        }
      }
    }
    
    if (!dbUser) {
      return res.status(404).json({ 
        success: false, 
        message: "Usuário não encontrado no banco de dados" 
      });
    }
    
    console.log(`[ResyncSession] Usuário encontrado: ${dbUser.email}`);
    
    // Criar sessão manualmente se req.login estiver disponível
    if (typeof req.login === 'function') {
      req.login(dbUser, (err) => {
        if (err) {
          console.error("[ResyncSession] Erro ao fazer login:", err);
          return res.status(500).json({ 
            success: false, 
            message: "Erro ao recriar sessão" 
          });
        }
        
        if (req.session) {
          // Definir flags explícitas na sessão
          // @ts-ignore - propriedades adicionais
          req.session.authenticated = true;
          // @ts-ignore
          req.session.user = {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role
          };
          
          // Garantir que a sessão seja persistida
          req.session.save((err) => {
            if (err) {
              console.warn("[ResyncSession] Aviso ao salvar sessão:", err);
            }
            
            console.log(`[ResyncSession] Sessão recriada com sucesso para ${dbUser.email}`);
            return res.status(200).json({ 
              success: true, 
              message: "Sessão ressincronizada com sucesso",
              user: {
                id: dbUser.id,
                name: dbUser.name,
                email: dbUser.email,
                role: dbUser.role,
                baseId: dbUser.baseId || dbUser.base_id,
                basename: dbUser.basename
              }
            });
          });
        } else {
          console.error("[ResyncSession] req.session não disponível!");
          return res.status(500).json({ 
            success: false, 
            message: "Objeto de sessão não disponível" 
          });
        }
      });
    } else {
      console.error("[ResyncSession] req.login não está disponível, Passport pode não estar configurado");
      return res.status(500).json({ 
        success: false, 
        message: "Sistema de autenticação não disponível" 
      });
    }
  } catch (error) {
    console.error("[ResyncSession] Erro ao ressincronizar sessão:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erro interno ao processar solicitação de ressincronização" 
    });
  }
}