import { Router } from 'express';
import { storage } from '../storage';
import { scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

const scryptAsync = promisify(scrypt);
const router = Router();

// Funções auxiliares de senha
async function comparePasswords(supplied: string, stored: string) {
  try {
    // Verificar se é hash bcrypt (começa com $2b$)
    if (stored.startsWith('$2b$')) {
      return await bcrypt.compare(supplied, stored);
    }
    
    // Formato scrypt legado
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.error('Formato de senha inválido no banco de dados');
      return false;
    }
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Erro ao comparar senhas:', error);
    return false;
  }
}

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDkwMzQ2MiwiZXhwIjoyMDYwMjc5NDYyfQ.M5Yf9Y-YRsF1hRfpZcnJHWdDR3x8T0yzIKbXZTXZQOY';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// Rota de login específica para postos externos (ABC V2)
router.post('/login-posto-externo', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('[POSTO-EXTERNO] Tentativa de login para:', email);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    // Tenta encontrar o usuário no banco local
    const user = await storage.getUserByEmail(email);
    
    if (!user) {
      console.log('[POSTO-EXTERNO] Usuário não encontrado:', email);
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    console.log('[POSTO-EXTERNO] Usuário encontrado:', { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      hasPassword: !!user.password
    });

    // Verifica se a senha está correta
    const isPasswordValid = await comparePasswords(password, user.password);
    
    if (!isPasswordValid) {
      console.log('[POSTO-EXTERNO] Senha inválida para usuário:', email);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    console.log('[POSTO-EXTERNO] Senha validada com sucesso para:', email);

    // Formata o usuário para a sessão (remove dados sensíveis como a senha)
    const userSession = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      base_id: user.baseId,
      basename: user.basename,
      isActive: user.isActive,
      _authMethod: 'posto_externo'
    };

    // Configurar headers para compatibilidade com acesso externo
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');

    // Salva o usuário na sessão
    req.login(userSession, (loginErr) => {
      if (loginErr) {
        console.error('[POSTO-EXTERNO] Erro ao salvar sessão:', loginErr);
        return res.status(500).json({ message: 'Erro ao criar sessão' });
      }

      console.log('[POSTO-EXTERNO] Login bem-sucedido para:', email);
      return res.status(200).json(userSession);
    });
  } catch (error) {
    console.error('[POSTO-EXTERNO] Erro no processamento de login:', error);
    return res.status(500).json({ message: 'Erro no servidor ao processar login' });
  }
});

// Rota de login híbrido - tenta autenticar no banco Postgres local
router.post('/login-hybrid', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Tentativa de login híbrido para:', email);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    // Tenta encontrar o usuário no banco local
    const user = await storage.getUserByEmail(email);
    
    if (!user) {
      console.log('Usuário não encontrado no banco local:', email);
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    // Verifica se a senha está correta
    const isPasswordValid = await comparePasswords(password, user.password);
    
    if (!isPasswordValid) {
      console.log('Senha inválida para usuário:', email);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // VERIFICAÇÃO DE SEGURANÇA: Operadores não podem acessar o sistema principal
    if (user.role === 'operador') {
      console.log('Tentativa de acesso ao sistema principal negada para operador:', email);
      return res.status(403).json({ 
        message: 'Operadores devem acessar apenas a base designada',
        error: 'Acesso negado - Operadores não podem acessar o sistema principal'
      });
    }

    // Formata o usuário para a sessão (remove dados sensíveis como a senha)
    const userSession = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      base_id: user.baseId,
      basename: user.basename,
      isActive: user.isActive
    };

    // Salva o usuário na sessão
    req.login(userSession, (loginErr) => {
      if (loginErr) {
        console.error('Erro ao salvar sessão:', loginErr);
        return res.status(500).json({ message: 'Erro ao criar sessão' });
      }

      console.log('Login híbrido bem-sucedido para:', email);
      return res.status(200).json(userSession);
    });
  } catch (error) {
    console.error('Erro no processamento de login híbrido:', error);
    return res.status(500).json({ message: 'Erro no servidor ao processar login' });
  }
});

// Rota para sincronizar usuários do Supabase com o sistema local
router.post('/sync-supabase-user', async (req, res) => {
  try {
    const { supabaseId, email, name, role } = req.body;

    // Verifica se já existe um usuário com este email
    const existingUser = await storage.getUserByEmail(email);

    if (existingUser) {
      // Atualiza o registro existente
      console.log(`Atualizando usuário existente com id ${existingUser.id} para supabaseId: ${supabaseId}`);
      
      // A lógica de atualização seria implementada aqui
      // Podemos adicionar isso mais tarde se necessário

      // Define a sessão com os dados do usuário existente
      const userSession = {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        base_id: existingUser.baseId,
        basename: existingUser.basename,
        isActive: existingUser.isActive
      };

      req.login(userSession, (loginErr) => {
        if (loginErr) {
          console.error('Erro ao salvar sessão após sincronização:', loginErr);
          return res.status(500).json({ message: 'Erro ao criar sessão' });
        }

        return res.status(200).json({ message: 'Usuário sincronizado com sucesso', user: userSession });
      });
    } else {
      // Não implementado: Criação de usuário no sistema local
      // Isso exigiria uma senha para o usuário local
      console.log('Usuário não encontrado no sistema local. Sincronização parcial.');
      return res.status(200).json({ message: 'Usuário não encontrado no sistema local' });
    }
  } catch (error) {
    console.error('Erro na sincronização de usuário Supabase:', error);
    return res.status(500).json({ message: 'Erro ao sincronizar usuário' });
  }
});

// Rota de login específica para bases - permite operadores acessarem suas bases
router.post('/login-base', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Tentativa de login de base para:', email);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    // Tenta encontrar o usuário no banco local
    const user = await storage.getUserByEmail(email);
    
    if (!user) {
      console.log('Usuário não encontrado no banco local:', email);
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    // Verifica se a senha está correta
    const isPasswordValid = await comparePasswords(password, user.password);
    
    if (!isPasswordValid) {
      console.log('Senha inválida para usuário:', email);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Verifica se o usuário está ativo
    if (!user.isActive) {
      console.log('Usuário inativo tentando fazer login:', email);
      return res.status(401).json({ message: 'Usuário inativo' });
    }

    // Formata o usuário para a sessão (remove dados sensíveis como a senha)
    const userSession = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      base_id: user.baseId,
      basename: user.basename,
      isActive: user.isActive
    };

    // Configura a sessão
    req.session.user = userSession;
    req.session.isAuthenticated = true;
    req.session.hybridUser = userSession;

    console.log('Login de base bem-sucedido para:', email, 'Role:', user.role, 'Base:', user.basename);
    
    res.json({ 
      message: 'Login realizado com sucesso',
      user: userSession,
      success: true
    });

  } catch (error) {
    console.error('Erro no login de base:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;