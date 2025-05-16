/**
 * Rotas para o módulo de Parceiros de Guincho
 */
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { checkAuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Configurar cliente Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware para verificar autenticação
router.use(checkAuthMiddleware);

/**
 * Obter todos os parceiros de guincho
 * GET /api/towing-partners
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('towing_partners')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Erro ao buscar parceiros de guincho:', error);
      return res.status(500).json({ 
        error: true,
        message: 'Erro ao buscar parceiros de guincho',
        details: error.message
      });
    }
    
    res.json(data || []);
  } catch (error: any) {
    console.error('Erro inesperado ao buscar parceiros de guincho:', error);
    res.status(500).json({ 
      error: true,
      message: 'Erro inesperado ao buscar parceiros de guincho',
      details: error.message
    });
  }
});

/**
 * Obter parceiro de guincho por ID
 * GET /api/towing-partners/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('towing_partners')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // Nenhum registro encontrado
        return res.status(404).json({ 
          error: true,
          message: 'Parceiro de guincho não encontrado'
        });
      }
      
      console.error(`Erro ao buscar parceiro de guincho ID ${id}:`, error);
      return res.status(500).json({ 
        error: true,
        message: 'Erro ao buscar parceiro de guincho',
        details: error.message
      });
    }
    
    res.json(data);
  } catch (error: any) {
    console.error('Erro inesperado ao buscar parceiro de guincho por ID:', error);
    res.status(500).json({ 
      error: true,
      message: 'Erro inesperado ao buscar parceiro de guincho',
      details: error.message
    });
  }
});

/**
 * Criar novo parceiro de guincho
 * POST /api/towing-partners
 */
router.post('/', async (req, res) => {
  try {
    const partner = req.body;
    
    // Validação básica
    if (!partner.name || !partner.phone || !partner.city || !partner.region) {
      return res.status(400).json({
        error: true,
        message: 'Dados incompletos. Nome, telefone, cidade e região são obrigatórios'
      });
    }
    
    const { data, error } = await supabase
      .from('towing_partners')
      .insert(partner)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar parceiro de guincho:', error);
      return res.status(500).json({ 
        error: true,
        message: 'Erro ao criar parceiro de guincho',
        details: error.message
      });
    }
    
    res.status(201).json(data);
  } catch (error: any) {
    console.error('Erro inesperado ao criar parceiro de guincho:', error);
    res.status(500).json({ 
      error: true,
      message: 'Erro inesperado ao criar parceiro de guincho',
      details: error.message
    });
  }
});

/**
 * Atualizar parceiro de guincho
 * PUT /api/towing-partners/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const partner = req.body;
    
    const { data, error } = await supabase
      .from('towing_partners')
      .update(partner)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Erro ao atualizar parceiro de guincho ID ${id}:`, error);
      return res.status(500).json({ 
        error: true,
        message: 'Erro ao atualizar parceiro de guincho',
        details: error.message
      });
    }
    
    if (!data) {
      return res.status(404).json({
        error: true,
        message: 'Parceiro de guincho não encontrado'
      });
    }
    
    res.json(data);
  } catch (error: any) {
    console.error('Erro inesperado ao atualizar parceiro de guincho:', error);
    res.status(500).json({ 
      error: true,
      message: 'Erro inesperado ao atualizar parceiro de guincho',
      details: error.message
    });
  }
});

/**
 * Excluir parceiro de guincho
 * DELETE /api/towing-partners/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se há solicitações associadas
    const { data: requests, error: requestsError } = await supabase
      .from('towing_requests')
      .select('id')
      .eq('partner_id', id)
      .limit(1);
    
    if (requestsError) {
      console.error(`Erro ao verificar solicitações para o parceiro ID ${id}:`, requestsError);
      return res.status(500).json({ 
        error: true,
        message: 'Erro ao verificar solicitações existentes',
        details: requestsError.message
      });
    }
    
    // Se existem solicitações, não permite excluir
    if (requests && requests.length > 0) {
      return res.status(400).json({
        error: true,
        message: 'Não é possível excluir o parceiro pois existem solicitações associadas a ele'
      });
    }
    
    // Excluir o parceiro
    const { error } = await supabase
      .from('towing_partners')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Erro ao excluir parceiro de guincho ID ${id}:`, error);
      return res.status(500).json({ 
        error: true,
        message: 'Erro ao excluir parceiro de guincho',
        details: error.message
      });
    }
    
    res.status(204).end();
  } catch (error: any) {
    console.error('Erro inesperado ao excluir parceiro de guincho:', error);
    res.status(500).json({ 
      error: true,
      message: 'Erro inesperado ao excluir parceiro de guincho',
      details: error.message
    });
  }
});

/**
 * Criar nova solicitação de guincho
 * POST /api/towing-partners/:id/requests
 */
router.post('/:id/requests', async (req, res) => {
  try {
    const { id } = req.params;
    const request = req.body;
    
    // Verificar se o parceiro existe
    const { data: partner, error: partnerError } = await supabase
      .from('towing_partners')
      .select('id, name')
      .eq('id', id)
      .single();
    
    if (partnerError || !partner) {
      return res.status(404).json({
        error: true,
        message: 'Parceiro de guincho não encontrado'
      });
    }
    
    // Validação básica
    if (!request.pickup_location || !request.destination || !request.reason) {
      return res.status(400).json({
        error: true,
        message: 'Dados incompletos. Local de coleta, destino e motivo são obrigatórios'
      });
    }
    
    // Configurar valores adicionais
    const userId = req.user?.id || null;
    const newRequest = {
      ...request,
      partner_id: parseInt(id),
      user_id: userId,
      requested_by: req.user?.name || 'Sistema',
      status: 'solicitado'
    };
    
    // Criar a solicitação
    const { data, error } = await supabase
      .from('towing_requests')
      .insert(newRequest)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar solicitação de guincho:', error);
      return res.status(500).json({ 
        error: true,
        message: 'Erro ao criar solicitação de guincho',
        details: error.message
      });
    }
    
    res.status(201).json(data);
  } catch (error: any) {
    console.error('Erro inesperado ao criar solicitação de guincho:', error);
    res.status(500).json({ 
      error: true,
      message: 'Erro inesperado ao criar solicitação de guincho',
      details: error.message
    });
  }
});

/**
 * Obter todas as solicitações de guincho
 * GET /api/towing-partners/requests
 */
router.get('/requests/all', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('towing_requests')
      .select(`
        *,
        towing_partners (id, name, phone)
      `)
      .order('request_date', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar solicitações de guincho:', error);
      return res.status(500).json({ 
        error: true,
        message: 'Erro ao buscar solicitações de guincho',
        details: error.message
      });
    }
    
    res.json(data || []);
  } catch (error: any) {
    console.error('Erro inesperado ao buscar solicitações de guincho:', error);
    res.status(500).json({ 
      error: true,
      message: 'Erro inesperado ao buscar solicitações de guincho',
      details: error.message
    });
  }
});

/**
 * Aprovar solicitação de guincho
 * POST /api/towing-partners/requests/:requestId/approve
 */
router.post('/requests/:requestId/approve', async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?.id;
    
    // Verificar permissão (apenas gestores de frota podem aprovar)
    if (req.user?.role !== 'gestor_frota' && req.user?.role !== 'admin') {
      return res.status(403).json({
        error: true,
        message: 'Você não tem permissão para aprovar solicitações de guincho'
      });
    }
    
    // Atualizar a solicitação
    const { data, error } = await supabase
      .from('towing_requests')
      .update({
        status: 'aprovado',
        approval_user_id: userId,
        approval_date: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single();
    
    if (error) {
      console.error(`Erro ao aprovar solicitação de guincho ID ${requestId}:`, error);
      return res.status(500).json({ 
        error: true,
        message: 'Erro ao aprovar solicitação de guincho',
        details: error.message
      });
    }
    
    if (!data) {
      return res.status(404).json({
        error: true,
        message: 'Solicitação de guincho não encontrada'
      });
    }
    
    res.json(data);
  } catch (error: any) {
    console.error('Erro inesperado ao aprovar solicitação de guincho:', error);
    res.status(500).json({ 
      error: true,
      message: 'Erro inesperado ao aprovar solicitação de guincho',
      details: error.message
    });
  }
});

export default router;