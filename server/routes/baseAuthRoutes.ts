import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'murici-on-fleet-base-auth-secret-2025';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, baseId } = req.body;

    console.log('[BASE-AUTH] Tentativa de login:', { email, baseId });

    if (!email || !password || !baseId) {
      return res.status(400).json({
        success: false,
        message: 'Email, senha e ID da base são obrigatórios',
      });
    }

    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: 'Erro de configuração do servidor',
      });
    }

    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.log('[BASE-AUTH] Usuário não encontrado:', email);
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas',
      });
    }

    const user = users[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('[BASE-AUTH] Senha inválida para:', email);
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas',
      });
    }

    const { data: userBases, error: basesError } = await supabase
      .from('user_bases')
      .select('*')
      .eq('user_id', user.id)
      .eq('base_id', baseId)
      .eq('is_active', true)
      .limit(1);

    let hasAccess = false;
    let baseRole = 'operador_base';

    if (user.role === 'admin' || user.role === 'ceo' || user.role === 'gerente_geral') {
      hasAccess = true;
      baseRole = 'admin_base';
      console.log('[BASE-AUTH] Acesso admin garantido para:', email);
    } else if (userBases && userBases.length > 0) {
      hasAccess = true;
      baseRole = userBases[0].role;
      console.log('[BASE-AUTH] Acesso via user_bases:', { email, baseRole });
    } else if (user.base_id === baseId) {
      hasAccess = true;
      console.log('[BASE-AUTH] Acesso via base_id do usuário:', email);
    }

    if (!hasAccess) {
      console.log('[BASE-AUTH] Acesso negado - usuário não vinculado à base:', { email, baseId });
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para acessar esta base',
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        baseId: baseId,
        baseRole: baseRole,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
      },
      JWT_SECRET
    );

    console.log('[BASE-AUTH] Login bem-sucedido:', { email, baseId, baseRole });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        baseRole,
      },
    });
  } catch (error) {
    console.error('[BASE-AUTH] Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

router.post('/verify', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const { baseId } = req.body;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        valid: false,
        message: 'Token não fornecido',
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: number;
        email: string;
        baseId: number;
        baseRole: string;
      };

      if (baseId && decoded.baseId !== baseId) {
        return res.status(403).json({
          valid: false,
          message: 'Token não é válido para esta base',
        });
      }

      res.json({
        valid: true,
        user: {
          id: decoded.userId,
          email: decoded.email,
          baseId: decoded.baseId,
          baseRole: decoded.baseRole,
        },
      });
    } catch (jwtError) {
      console.error('[BASE-AUTH] Token inválido:', jwtError);
      return res.status(401).json({
        valid: false,
        message: 'Token inválido ou expirado',
      });
    }
  } catch (error) {
    console.error('[BASE-AUTH] Erro na verificação:', error);
    res.status(500).json({
      valid: false,
      message: 'Erro interno do servidor',
    });
  }
});

router.post('/check-access', async (req: Request, res: Response) => {
  try {
    const { userId, baseId } = req.body;

    if (!userId || !baseId) {
      return res.status(400).json({
        hasAccess: false,
        message: 'userId e baseId são obrigatórios',
      });
    }

    if (!supabase) {
      return res.status(500).json({
        hasAccess: false,
        message: 'Erro de configuração do servidor',
      });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        hasAccess: false,
        message: 'Usuário não encontrado',
      });
    }

    if (['admin', 'ceo', 'gerente_geral'].includes(user.role)) {
      return res.json({
        hasAccess: true,
        role: 'admin_base',
        message: 'Acesso administrativo',
      });
    }

    const { data: userBases, error: basesError } = await supabase
      .from('user_bases')
      .select('*')
      .eq('user_id', userId)
      .eq('base_id', baseId)
      .eq('is_active', true)
      .limit(1);

    if (userBases && userBases.length > 0) {
      return res.json({
        hasAccess: true,
        role: userBases[0].role,
        message: 'Acesso autorizado via vínculo direto',
      });
    }

    if (user.base_id === baseId) {
      return res.json({
        hasAccess: true,
        role: 'operador_base',
        message: 'Acesso autorizado via base principal',
      });
    }

    res.json({
      hasAccess: false,
      message: 'Usuário não tem acesso a esta base',
    });
  } catch (error) {
    console.error('[BASE-AUTH] Erro ao verificar acesso:', error);
    res.status(500).json({
      hasAccess: false,
      message: 'Erro interno do servidor',
    });
  }
});

router.post('/add-user-to-base', async (req: Request, res: Response) => {
  try {
    const { userId, baseId, role = 'operador_base' } = req.body;

    if (!userId || !baseId) {
      return res.status(400).json({
        success: false,
        message: 'userId e baseId são obrigatórios',
      });
    }

    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: 'Erro de configuração do servidor',
      });
    }

    const { data: existing, error: checkError } = await supabase
      .from('user_bases')
      .select('*')
      .eq('user_id', userId)
      .eq('base_id', baseId)
      .limit(1);

    if (existing && existing.length > 0) {
      const { error: updateError } = await supabase
        .from('user_bases')
        .update({ role, is_active: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('base_id', baseId);

      if (updateError) throw updateError;

      return res.json({
        success: true,
        message: 'Vínculo atualizado com sucesso',
      });
    }

    const { error: insertError } = await supabase
      .from('user_bases')
      .insert({
        user_id: userId,
        base_id: baseId,
        role,
        is_active: true,
      });

    if (insertError) throw insertError;

    res.json({
      success: true,
      message: 'Vínculo criado com sucesso',
    });
  } catch (error) {
    console.error('[BASE-AUTH] Erro ao adicionar usuário à base:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

router.get('/user-bases/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: 'Erro de configuração do servidor',
      });
    }

    const { data: userBases, error } = await supabase
      .from('user_bases')
      .select(`
        *,
        bases:base_id (id, name, location)
      `)
      .eq('user_id', parseInt(userId))
      .eq('is_active', true);

    if (error) throw error;

    res.json({
      success: true,
      data: userBases,
    });
  } catch (error) {
    console.error('[BASE-AUTH] Erro ao buscar bases do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

export default router;
