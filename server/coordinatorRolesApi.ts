import { Router } from 'express';
import { pool } from './database';
import { isAuthenticated, isAdmin } from './middleware/auth';

const router = Router();



// 1. Obter todos os papéis disponíveis
router.get('/roles', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, description, created_at, updated_at
      FROM roles
      ORDER BY name
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao obter papéis:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 2. Obter todos os usuários com seus papéis
router.get('/users-with-roles', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.is_active,
        CASE 
          WHEN ur.role_id IS NULL THEN '[]'::json
          ELSE JSON_AGG(
            JSON_BUILD_OBJECT(
              'role_id', r.id,
              'role_name', r.name,
              'role_description', r.description,
              'assigned_at', ur.created_at
            )
          )
        END as roles
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      GROUP BY u.id, u.name, u.email, u.is_active
      ORDER BY u.name
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao obter usuários com papéis:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 3. Obter projetos e bases disponíveis
router.get('/projects-bases', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const projectsResult = await pool.query(`
      SELECT id, name, description, is_active
      FROM projects
      WHERE is_active = true
      ORDER BY name
    `);
    
    const basesResult = await pool.query(`
      SELECT id, name, location as description, project_id, active as is_active
      FROM bases
      WHERE active = true
      ORDER BY name
    `);
    
    res.json({
      success: true,
      data: {
        projects: projectsResult.rows,
        bases: basesResult.rows
      }
    });
  } catch (error) {
    console.error('Erro ao obter projetos e bases:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 4. Atribuir papel a um usuário
router.post('/assign-role', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { userId, roleId } = req.body;
    
    if (!userId || !roleId) {
      return res.status(400).json({ error: 'userId e roleId são obrigatórios' });
    }
    
    // Verificar se o usuário existe
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Verificar se o papel existe
    const roleCheck = await pool.query('SELECT id FROM roles WHERE id = $1', [roleId]);
    if (roleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Papel não encontrado' });
    }
    
    // Atribuir o papel
    await pool.query(`
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, role_id) DO NOTHING
    `, [userId, roleId]);
    
    res.json({
      success: true,
      message: 'Papel atribuído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atribuir papel:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 5. Remover papel de um usuário
router.delete('/remove-role', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { userId, roleId } = req.body;
    
    if (!userId || !roleId) {
      return res.status(400).json({ error: 'userId e roleId são obrigatórios' });
    }
    
    await pool.query(`
      DELETE FROM user_roles
      WHERE user_id = $1 AND role_id = $2
    `, [userId, roleId]);
    
    res.json({
      success: true,
      message: 'Papel removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover papel:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 6. Obter coordenadores com seus escopos
router.get('/coordinators-scope', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        ARRAY_AGG(
          JSON_BUILD_OBJECT(
            'project_id', p.id,
            'project_name', p.name,
            'base_id', b.id,
            'base_name', b.name,
            'assigned_at', cs.created_at
          )
        ) as scope
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      LEFT JOIN coordinator_scope cs ON cs.user_id = u.id
      LEFT JOIN projects p ON p.id = cs.project_id
      LEFT JOIN bases b ON b.id = cs.base_id
      WHERE r.name = 'coordenador'
      GROUP BY u.id, u.name, u.email
      ORDER BY u.name
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao obter coordenadores com escopo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 7. Atribuir escopo a um coordenador
router.post('/assign-scope', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { userId, projectId, baseId } = req.body;
    
    if (!userId || !projectId || !baseId) {
      return res.status(400).json({ error: 'userId, projectId e baseId são obrigatórios' });
    }
    
    // Verificar se o usuário é coordenador
    const coordinatorCheck = await pool.query(`
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = $1 AND r.name = 'coordenador'
    `, [userId]);
    
    if (coordinatorCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Usuário não é coordenador' });
    }
    
    // Verificar se o projeto e base existem
    const projectBaseCheck = await pool.query(`
      SELECT 1 FROM projects p
      JOIN bases b ON b.project_id = p.id
      WHERE p.id = $1 AND b.id = $2
    `, [projectId, baseId]);
    
    if (projectBaseCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Projeto ou base não encontrados ou não relacionados' });
    }
    
    // Atribuir escopo
    await pool.query(`
      INSERT INTO coordinator_scope (user_id, project_id, base_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, project_id, base_id) DO NOTHING
    `, [userId, projectId, baseId]);
    
    res.json({
      success: true,
      message: 'Escopo atribuído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atribuir escopo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 8. Remover escopo de um coordenador
router.delete('/remove-scope', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { userId, projectId, baseId } = req.body;
    
    if (!userId || !projectId || !baseId) {
      return res.status(400).json({ error: 'userId, projectId e baseId são obrigatórios' });
    }
    
    await pool.query(`
      DELETE FROM coordinator_scope
      WHERE user_id = $1 AND project_id = $2 AND base_id = $3
    `, [userId, projectId, baseId]);
    
    res.json({
      success: true,
      message: 'Escopo removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover escopo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 9. Obter escopo de um coordenador específico (para uso em autenticação)
router.get('/coordinator-scope/:userId', isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verificar se o usuário pode acessar (admin ou próprio usuário)
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const result = await pool.query(`
      SELECT * FROM get_coordinator_scope($1)
    `, [userId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao obter escopo do coordenador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 10. Criar registro de escopo de coordenador (para uso durante cadastro)
router.post('/scope', isAuthenticated, async (req, res) => {
  try {
    const { userId, projectId, baseId, scopeType } = req.body;
    
    // Verificar se o usuário logado é admin ou se está criando para si mesmo
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    // Validar campos obrigatórios
    if (!userId || !scopeType) {
      return res.status(400).json({ error: 'userId e scopeType são obrigatórios' });
    }
    
    // Verificar se o usuário existe
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Inserir registro de escopo
    await pool.query(`
      INSERT INTO coordinator_scope (user_id, project_id, base_id, scope_type)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, project_id, base_id) DO NOTHING
    `, [userId, projectId || null, baseId || null, scopeType]);
    
    res.json({
      success: true,
      message: 'Escopo criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar escopo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 11. Verificar se coordenador tem acesso a projeto/base específico
router.get('/check-access/:userId/:projectId/:baseId', isAuthenticated, async (req, res) => {
  try {
    const { userId, projectId, baseId } = req.params;
    
    // Verificar se o usuário pode acessar (admin ou próprio usuário)
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const result = await pool.query(`
      SELECT coordinator_has_access($1, $2, $3) as has_access
    `, [userId, projectId, baseId]);
    
    res.json({
      success: true,
      has_access: result.rows[0].has_access
    });
  } catch (error) {
    console.error('Erro ao verificar acesso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;