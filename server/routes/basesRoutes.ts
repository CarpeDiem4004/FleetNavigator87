import express from 'express';
const router = express.Router();

// Rota para buscar todas as bases
router.get('/api/bases', async (req, res) => {
  try {
    console.log('[API/BASES] Buscando todas as bases...');
    
    const { pool } = await import('../database.js');
    
    const query = `
      SELECT id, name, location, basename, type, active, operation, 
             has_maintenance, has_tires, requests_enabled, 
             created_at, project_id
      FROM bases 
      ORDER BY name
    `;
    
    const result = await pool.query(query);
    const bases = result.rows;

    console.log(`[API/BASES] ${bases?.length || 0} bases encontradas`);

    res.json(bases);
    
  } catch (error: any) {
    console.error('[API/BASES] Erro interno:', error);
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
        message: 'Base não encontrada' 
      });
    }

    console.log(`[API/BASES] Base encontrada: ${base.name}`);
    res.json(base);
    
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