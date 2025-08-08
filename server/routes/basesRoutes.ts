import express from 'express';
const router = express.Router();

// Rota para buscar todas as bases ou por basename
router.get('/api/bases', async (req, res) => {
  try {
    const { basename } = req.query;
    console.log('[API/BASES] Buscando bases...', { basename });
    
    const { pool } = await import('../database.js');
    
    let query = `
      SELECT id, name, location, basename, type, active, operation, 
             has_maintenance, has_tires, requests_enabled, 
             created_at, project_id
      FROM bases 
    `;
    let params: any[] = [];
    
    if (basename && typeof basename === 'string') {
      query += ` WHERE basename = $1`;
      params = [basename];
    }
    
    query += ` ORDER BY name`;
    
    const result = await pool.query(query, params);
    const bases = result.rows;

    console.log(`[API/BASES] ${bases?.length || 0} bases encontradas`);

    res.json({ 
      success: true, 
      data: bases 
    });
    
  } catch (error: any) {
    console.error('[API/BASES] Erro interno:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor', 
      error: error.message 
    });
  }
});

// Rota para verificar acesso de usuário a uma base específica - REGRA DE OURO
router.post('/api/bases/:baseId/check-access', async (req, res) => {
  try {
    const { baseId } = req.params;
    const user = req.user;
    
    console.log(`[API/BASES] Verificando acesso à base ${baseId} para usuário:`, user?.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }
    
    const { pool } = await import('../database.js');
    
    // Usar função do banco para verificar acesso
    const accessQuery = `SELECT check_user_base_access($1, $2) as has_access`;
    const accessResult = await pool.query(accessQuery, [user.id, parseInt(baseId)]);
    const hasAccess = accessResult.rows[0]?.has_access || false;
    
    console.log(`[API/BASES] Acesso à base ${baseId}: ${hasAccess ? 'PERMITIDO' : 'NEGADO'}`);
    
    if (!hasAccess) {
      // Buscar informações da base para retornar detalhes
      const baseQuery = `SELECT id, name, basename FROM bases WHERE id = $1`;
      const baseResult = await pool.query(baseQuery, [baseId]);
      const baseInfo = baseResult.rows[0];
      
      return res.status(403).json({
        success: false,
        message: 'Acesso negado à base',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            base_id: user.base_id,
            basename: user.basename
          },
          base: baseInfo,
          reason: 'Usuário não tem permissão para acessar esta base'
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Acesso permitido',
      data: {
        hasAccess: true,
        user: {
          id: user.id,
          name: user.name,
          role: user.role
        }
      }
    });
    
  } catch (error: any) {
    console.error('[API/BASES] Erro na verificação de acesso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Rota para buscar uma base específica por ID ou basename
router.get('/api/bases/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    console.log(`[API/BASES] Buscando base: ${identifier}`);
    
    const { pool } = await import('../database.js');
    
    let query = `
      SELECT id, name, location, basename, type, active, operation, 
             has_maintenance, has_tires, requests_enabled, 
             created_at, project_id
      FROM bases 
      WHERE 
    `;
    let params: any[] = [];
    
    // Verificar se é um número (ID) ou string (basename)
    if (/^\d+$/.test(identifier)) {
      query += 'id = $1';
      params = [parseInt(identifier)];
    } else {
      query += 'basename = $1';
      params = [identifier];
    }
    
    const result = await pool.query(query, params);
    const base = result.rows[0];
    
    if (!base) {
      console.log(`[API/BASES] Base não encontrada: ${identifier}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Base não encontrada',
        data: null
      });
    }

    console.log(`[API/BASES] Base encontrada: ${base.name}`);
    res.json({ 
      success: true, 
      data: base 
    });
    
  } catch (error: any) {
    console.error('[API/BASES] Erro interno:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor', 
      error: error.message 
    });
  }
});

// Rota para atualizar uma base específica (PUT e PATCH)
router.put('/api/bases/:id', async (req, res) => {
  await handleBaseUpdate(req, res);
});

router.patch('/api/bases/:id', async (req, res) => {
  await handleBaseUpdate(req, res);
});

// Função para lidar com atualização de base
async function handleBaseUpdate(req: any, res: any) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`[API/BASES] Atualizando base ID ${id}:`, updateData);
    
    const { pool } = await import('../database.js');
    
    // Construir query de atualização dinamicamente
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    
    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum campo para atualizar fornecido'
      });
    }
    
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const query = `
      UPDATE bases 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [parseInt(id), ...values]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Base não encontrada'
      });
    }
    
    const updatedBase = result.rows[0];
    console.log(`[API/BASES] Base atualizada com sucesso: ${updatedBase.name}`);
    
    res.json({
      success: true,
      message: 'Base atualizada com sucesso',
      data: updatedBase
    });
    
  } catch (error: any) {
    console.error('[API/BASES] Erro ao atualizar base:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}

export default router;