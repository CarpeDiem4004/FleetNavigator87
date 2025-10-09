import { Request, Response, NextFunction } from 'express';
import { pool } from '../db';

/**
 * Middleware para autenticar oficinas através de tokens customizados
 * Suporta tanto tokens antigos (tabela workshops) quanto novos (workshop_access_tokens)
 */
export const workshopAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[WorkshopAuth] Token não fornecido no header Authorization');
      return res.status(401).json({ 
        success: false,
        message: "Token de autenticação não fornecido" 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verificar se é um token de oficina (auto_token_...)
    if (!token.startsWith('auto_token_')) {
      console.log('[WorkshopAuth] Token fornecido não é um token de oficina válido');
      return res.status(401).json({ 
        success: false,
        message: "Token de autenticação inválido" 
      });
    }

    console.log('[WorkshopAuth] Verificando token de oficina:', token.substring(0, 20) + '...');

    // Primeira tentativa: Verificar na tabela workshops (tokens antigos)
    let workshopResult = await pool.query(
      'SELECT id, razao_social, nome_fantasia, email, status FROM workshops WHERE token = $1 AND status = $2',
      [token, 'ativo']
    );

    if (workshopResult.rows.length > 0) {
      const workshop = workshopResult.rows[0];
      console.log(`[WorkshopAuth] Oficina autenticada: ${workshop.razao_social} (ID: ${workshop.id})`);
      
      // Anexar dados da oficina à requisição
      (req as any).workshop = {
        id: workshop.id,
        name: workshop.nome_fantasia || workshop.razao_social,
        email: workshop.email,
        source: 'workshops'
      };
      
      return next();
    }

    // Segunda tentativa: Verificar na tabela workshop_access_tokens (tokens novos)
    const accessTokenQuery = `
      SELECT 
        o.id,
        COALESCE(o.nome_fantasia, o.razao_social) as name,
        o.email,
        o.status,
        wat.access_token,
        wat.expires_at
      FROM workshop_access_tokens wat
      JOIN oficinas o ON wat.workshop_id = o.id
      WHERE wat.access_token = $1 
        AND wat.is_active = true 
        AND wat.expires_at > NOW() 
        AND o.status = 'ativo'
    `;

    const accessTokenResult = await pool.query(accessTokenQuery, [token]);

    if (accessTokenResult.rows.length > 0) {
      const workshop = accessTokenResult.rows[0];
      console.log(`[WorkshopAuth] Oficina autenticada via access_token: ${workshop.name} (ID: ${workshop.id})`);
      
      // Atualizar último uso do token
      await pool.query(
        'UPDATE workshop_access_tokens SET last_used = NOW() WHERE access_token = $1',
        [token]
      );
      
      // Anexar dados da oficina à requisição
      (req as any).workshop = {
        id: workshop.id,
        name: workshop.name,
        email: workshop.email,
        source: 'workshop_access_tokens'
      };
      
      return next();
    }

    // Token não encontrado em nenhuma das tabelas
    console.log('[WorkshopAuth] Token de oficina não encontrado ou inválido');
    return res.status(401).json({ 
      success: false,
      message: "Token de autenticação inválido ou expirado" 
    });

  } catch (error) {
    console.error('[WorkshopAuth] Erro ao validar token de oficina:', error);
    return res.status(500).json({ 
      success: false,
      message: "Erro interno ao validar autenticação" 
    });
  }
};
