import express from 'express';
const router = express.Router();

// Rota para buscar todas as bases ativas
router.get('/api/bases', async (req, res) => {
  try {
    console.log('[API/BASES] Buscando todas as bases ativas...');
    
    const { pool } = await import('../database.js');
    
    const query = `
      SELECT id, name, location, basename, type, active, operation, 
             has_maintenance, has_tires, requests_enabled, 
             created_at, project_id
      FROM bases 
      WHERE active = true 
      ORDER BY name
    `;
    
    const result = await pool.query(query);
    const bases = result.rows;

    console.log(`[API/BASES] ${bases?.length || 0} bases encontradas`);
    
    // Filtrar bases para acesso externo (sem manutenção)
    const externalBases = bases.filter((base: any) => {
      const shouldInclude = base.active && base.name && !base.name.toLowerCase().includes('manutenção');
      if (!shouldInclude && base.name?.toLowerCase().includes('manutenção')) {
        console.log(`[API/BASES] Removendo base de manutenção: ${base.name}`);
      }
      return shouldInclude;
    });
    
    console.log(`[API/BASES] Bases filtradas para acesso externo: ${externalBases.length}`);

    res.json({
      success: true,
      data: externalBases,
      count: externalBases.length
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

export default router;