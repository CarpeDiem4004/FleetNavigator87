/**
 * API para gerenciamento de bases híbrida
 * Funciona tanto no ambiente Replit quanto externamente
 */
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { pool } from './server/db.js';

// Criar roteador para a API
const router = express.Router();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Importar middleware unificado de autenticação
 */
import { unifiedAuthMiddleware, requireRoles } from './server/utils/auth-utils.js';

/**
 * Função para obter bases do banco de dados adequado
 * Tenta Postgres diretamente primeiro, depois Supabase
 */
async function getBases() {
  try {
    // Tentar obter bases via PostgreSQL direto
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT id, name, location, operation, type, active, has_maintenance as "hasMaintenance", has_tires as "hasTires", created_at FROM bases ORDER BY name');
      console.log(`[HybridAPI] ${result.rows.length} bases encontradas via PostgreSQL`);
      return result.rows;
    } finally {
      client.release();
    }
  } catch (pgError) {
    console.error('[HybridAPI] Erro ao buscar bases via PostgreSQL:', pgError);
    
    // Se falhar, tentar via Supabase
    try {
      const { data, error } = await supabase
        .from('bases')
        .select('id, name, location, operation, type, active, has_maintenance, has_tires, created_at')
        .order('name');
      
      if (error) throw error;
      
      // Mapear nomes de colunas para manter consistência com a resposta do PostgreSQL
      const formattedData = data.map(base => ({
        id: base.id,
        name: base.name,
        location: base.location,
        operation: base.operation,
        type: base.type,
        active: base.active,
        hasMaintenance: base.has_maintenance,
        hasTires: base.has_tires,
        created_at: base.created_at
      }));
      
      console.log(`[HybridAPI] ${formattedData.length} bases encontradas via Supabase`);
      return formattedData;
    } catch (supabaseError) {
      console.error('[HybridAPI] Erro ao buscar bases via Supabase:', supabaseError);
      throw new Error('Falha ao buscar bases de dados em ambas as fontes');
    }
  }
}

/**
 * Rota para listar todas as bases
 * GET /api/hybrid/bases
 */
router.get('/api/hybrid/bases', unifiedAuthMiddleware, async (req, res) => {
  try {
    console.log('[HybridAPI] Listando bases');
    
    // Extrair filtros da query string
    const { active, hasMaintenance, hasTires } = req.query;
    
    // Buscar todas as bases
    let bases = await getBases();
    
    // Aplicar filtros (se houver)
    if (active !== undefined) {
      const activeFilter = active === 'true';
      bases = bases.filter(base => base.active === activeFilter);
    }
    
    if (hasMaintenance !== undefined) {
      const hasMaintenanceFilter = hasMaintenance === 'true';
      bases = bases.filter(base => base.hasMaintenance === hasMaintenanceFilter);
    }
    
    if (hasTires !== undefined) {
      const hasTiresFilter = hasTires === 'true';
      bases = bases.filter(base => base.hasTires === hasTiresFilter);
    }
    
    return res.status(200).json({
      success: true,
      count: bases.length,
      bases: bases
    });
  } catch (error) {
    console.error('[HybridAPI] Erro ao listar bases:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar bases',
      error: error.message
    });
  }
});

/**
 * Rota para obter uma base pelo ID
 * GET /api/hybrid/bases/:id
 */
router.get('/api/hybrid/bases/:id', unifiedAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[HybridAPI] Buscando base com ID: ${id}`);
    
    let base;
    
    try {
      // Tentar obter base via PostgreSQL direto
      const client = await pool.connect();
      try {
        const result = await client.query(
          'SELECT id, name, location, operation, type, active, has_maintenance as "hasMaintenance", has_tires as "hasTires", created_at FROM bases WHERE id = $1',
          [id]
        );
        
        if (result.rows.length > 0) {
          base = result.rows[0];
          console.log(`[HybridAPI] Base encontrada via PostgreSQL: ${base.name}`);
        }
      } finally {
        client.release();
      }
    } catch (pgError) {
      console.error('[HybridAPI] Erro ao buscar base via PostgreSQL:', pgError);
      
      // Se falhar, tentar via Supabase
      try {
        const { data, error } = await supabase
          .from('bases')
          .select('id, name, location, operation, type, active, has_maintenance, has_tires, created_at')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          // Mapear nomes de colunas para manter consistência
          base = {
            id: data.id,
            name: data.name,
            location: data.location,
            operation: data.operation,
            type: data.type,
            active: data.active,
            hasMaintenance: data.has_maintenance,
            hasTires: data.has_tires,
            created_at: data.created_at
          };
          console.log(`[HybridAPI] Base encontrada via Supabase: ${base.name}`);
        }
      } catch (supabaseError) {
        console.error('[HybridAPI] Erro ao buscar base via Supabase:', supabaseError);
      }
    }
    
    if (!base) {
      return res.status(404).json({
        success: false,
        message: 'Base não encontrada'
      });
    }
    
    return res.status(200).json({
      success: true,
      base
    });
  } catch (error) {
    console.error('[HybridAPI] Erro ao buscar base:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar base',
      error: error.message
    });
  }
});

export default router;