/**
 * Rotas da API para gerenciamento de parceiros de guincho
 */
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { unifiedAuthMiddleware as authenticateJWT } from '../utils/auth-utils';
import { verifyAdmin, verifyFleetManager } from '../middleware/roleMiddleware';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const router = Router();

/**
 * @route GET /api/towing/partners
 * @desc Listar todos os parceiros de guincho
 * @access Privado (usuários autenticados)
 */
router.get('/partners', authenticateJWT, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('towing_partners')
      .select('*')
      .order('name');

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Erro ao buscar parceiros de guincho:', error);
    res.status(500).json({ error: 'Erro ao buscar parceiros de guincho', details: error.message });
  }
});

/**
 * @route GET /api/towing/partners/summary
 * @desc Obter resumo dos parceiros de guincho com estatísticas
 * @access Privado (usuários autenticados)
 */
router.get('/partners/summary', authenticateJWT, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('towing_partners_summary')
      .select('*')
      .order('name');

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Erro ao buscar resumo de parceiros de guincho:', error);
    res.status(500).json({ error: 'Erro ao buscar resumo de parceiros de guincho', details: error.message });
  }
});

/**
 * @route GET /api/towing/partners/:id
 * @desc Obter detalhes de um parceiro de guincho específico
 * @access Privado (usuários autenticados)
 */
router.get('/partners/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('towing_partners')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ error: 'Parceiro de guincho não encontrado' });
    }

    res.json(data);
  } catch (error: any) {
    console.error(`Erro ao buscar parceiro de guincho (ID: ${req.params.id}):`, error);
    res.status(500).json({ error: 'Erro ao buscar parceiro de guincho', details: error.message });
  }
});

/**
 * @route POST /api/towing/partners
 * @desc Criar um novo parceiro de guincho
 * @access Privado (apenas administradores e gestores de frota)
 */
router.post('/partners', authenticateJWT, verifyFleetManager, async (req, res) => {
  try {
    const partnerData = req.body;
    
    // Validação simples
    if (!partnerData.name || !partnerData.phone || !partnerData.city || !partnerData.region) {
      return res.status(400).json({ 
        error: 'Dados incompletos', 
        details: 'Nome, telefone, cidade e região são obrigatórios' 
      });
    }

    const { data, error } = await supabase
      .from('towing_partners')
      .insert([partnerData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error: any) {
    console.error('Erro ao criar parceiro de guincho:', error);
    res.status(500).json({ error: 'Erro ao criar parceiro de guincho', details: error.message });
  }
});

/**
 * @route PUT /api/towing/partners/:id
 * @desc Atualizar um parceiro de guincho existente
 * @access Privado (apenas administradores e gestores de frota)
 */
router.put('/partners/:id', authenticateJWT, verifyFleetManager, async (req, res) => {
  try {
    const { id } = req.params;
    const partnerData = req.body;
    
    // Validação simples
    if (!partnerData.name || !partnerData.phone || !partnerData.city || !partnerData.region) {
      return res.status(400).json({ 
        error: 'Dados incompletos', 
        details: 'Nome, telefone, cidade e região são obrigatórios' 
      });
    }

    const { data, error } = await supabase
      .from('towing_partners')
      .update(partnerData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ error: 'Parceiro de guincho não encontrado' });
    }

    res.json(data);
  } catch (error: any) {
    console.error(`Erro ao atualizar parceiro de guincho (ID: ${req.params.id}):`, error);
    res.status(500).json({ error: 'Erro ao atualizar parceiro de guincho', details: error.message });
  }
});

/**
 * @route DELETE /api/towing/partners/:id
 * @desc Excluir um parceiro de guincho
 * @access Privado (apenas administradores)
 */
router.delete('/partners/:id', authenticateJWT, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se existem solicitações associadas a este parceiro
    const { data: requests, error: requestsError } = await supabase
      .from('towing_requests')
      .select('id')
      .eq('partner_id', id);
      
    if (requestsError) throw requestsError;
    
    if (requests && requests.length > 0) {
      return res.status(400).json({ 
        error: 'Não é possível excluir', 
        details: 'Existem solicitações de serviço associadas a este parceiro' 
      });
    }

    const { error } = await supabase
      .from('towing_partners')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Parceiro de guincho excluído com sucesso' });
  } catch (error: any) {
    console.error(`Erro ao excluir parceiro de guincho (ID: ${req.params.id}):`, error);
    res.status(500).json({ error: 'Erro ao excluir parceiro de guincho', details: error.message });
  }
});

/**
 * @route GET /api/towing/requests
 * @desc Listar todas as solicitações de serviço de guincho
 * @access Privado (usuários autenticados)
 */
router.get('/requests', authenticateJWT, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = supabase
      .from('towing_requests')
      .select(`
        *,
        towing_partners(id, name, phone)
      `)
      .order('request_date', { ascending: false });
      
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Erro ao buscar solicitações de guincho:', error);
    res.status(500).json({ error: 'Erro ao buscar solicitações de guincho', details: error.message });
  }
});

/**
 * @route GET /api/towing/requests/:id
 * @desc Obter detalhes de uma solicitação específica
 * @access Privado (usuários autenticados)
 */
router.get('/requests/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('towing_requests')
      .select(`
        *,
        towing_partners(id, name, phone, email, city, region)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ error: 'Solicitação de guincho não encontrada' });
    }

    res.json(data);
  } catch (error: any) {
    console.error(`Erro ao buscar solicitação de guincho (ID: ${req.params.id}):`, error);
    res.status(500).json({ error: 'Erro ao buscar solicitação de guincho', details: error.message });
  }
});

/**
 * @route POST /api/towing/requests
 * @desc Criar uma nova solicitação de serviço de guincho
 * @access Privado (usuários autenticados)
 */
router.post('/requests', authenticateJWT, async (req, res) => {
  try {
    const requestData = {
      ...req.body,
      user_id: (req as any).user.id,
      requested_by: (req as any).user.name
    };
    
    // Validação básica
    if (!requestData.partner_id || !requestData.pickup_location || !requestData.destination || !requestData.reason) {
      return res.status(400).json({ 
        error: 'Dados incompletos', 
        details: 'Parceiro, local de retirada, destino e motivo são obrigatórios' 
      });
    }

    const { data, error } = await supabase
      .from('towing_requests')
      .insert([requestData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error: any) {
    console.error('Erro ao criar solicitação de guincho:', error);
    res.status(500).json({ error: 'Erro ao criar solicitação de guincho', details: error.message });
  }
});

/**
 * @route PUT /api/towing/requests/:id
 * @desc Atualizar uma solicitação de serviço existente
 * @access Privado (usuários autenticados)
 */
router.put('/requests/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const requestData = req.body;
    const user = (req as any).user;
    
    // Verificar permissão (apenas criador da solicitação ou administrador pode editar)
    const { data: existingRequest, error: fetchError } = await supabase
      .from('towing_requests')
      .select('user_id, status')
      .eq('id', id)
      .single();
      
    if (fetchError) throw fetchError;
    
    if (!existingRequest) {
      return res.status(404).json({ error: 'Solicitação de guincho não encontrada' });
    }
    
    // Verificar se o usuário tem permissão para editar
    const isAdmin = user.role === 'admin';
    const isGestor = user.role === 'gestor_frota';
    const isOwner = existingRequest.user_id === user.id;
    
    if (!isAdmin && !isGestor && !isOwner) {
      return res.status(403).json({ 
        error: 'Acesso negado', 
        details: 'Você não tem permissão para editar esta solicitação' 
      });
    }
    
    // Não permitir editar solicitações concluídas ou canceladas
    if (['concluido', 'cancelado'].includes(existingRequest.status) && !isAdmin) {
      return res.status(400).json({ 
        error: 'Operação não permitida', 
        details: 'Não é possível editar solicitações concluídas ou canceladas' 
      });
    }

    const { data, error } = await supabase
      .from('towing_requests')
      .update(requestData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error(`Erro ao atualizar solicitação de guincho (ID: ${req.params.id}):`, error);
    res.status(500).json({ error: 'Erro ao atualizar solicitação de guincho', details: error.message });
  }
});

/**
 * @route PUT /api/towing/requests/:id/status
 * @desc Atualizar o status de uma solicitação de serviço (aprovar, concluir, cancelar)
 * @access Privado (apenas administradores e gestores para algumas operações)
 */
router.put('/requests/:id/status', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const user = (req as any).user;
    
    if (!status || !['solicitado', 'aprovado', 'em_andamento', 'concluido', 'cancelado'].includes(status)) {
      return res.status(400).json({ 
        error: 'Status inválido', 
        details: 'O status deve ser um dos valores permitidos' 
      });
    }
    
    // Verificar permissão (regras específicas para cada status)
    const { data: existingRequest, error: fetchError } = await supabase
      .from('towing_requests')
      .select('status, user_id')
      .eq('id', id)
      .single();
      
    if (fetchError) throw fetchError;
    
    if (!existingRequest) {
      return res.status(404).json({ error: 'Solicitação de guincho não encontrada' });
    }
    
    // Regras de permissão para mudança de status
    const isAdmin = user.role === 'admin';
    const isGestor = user.role === 'gestor_frota';
    const isOwner = existingRequest.user_id === user.id;
    
    // Apenas admin e gestor_frota podem aprovar solicitações
    if (status === 'aprovado' && !isAdmin && !isGestor) {
      return res.status(403).json({ 
        error: 'Acesso negado', 
        details: 'Apenas administradores e gestores de frota podem aprovar solicitações' 
      });
    }
    
    // Qualquer um pode cancelar sua própria solicitação se ainda não aprovada
    if (status === 'cancelado' && existingRequest.status === 'solicitado' && !isOwner && !isAdmin && !isGestor) {
      return res.status(403).json({ 
        error: 'Acesso negado', 
        details: 'Você não tem permissão para cancelar esta solicitação' 
      });
    }
    
    // Apenas admin e gestor podem cancelar após aprovação
    if (status === 'cancelado' && existingRequest.status !== 'solicitado' && !isAdmin && !isGestor) {
      return res.status(403).json({ 
        error: 'Acesso negado', 
        details: 'Apenas administradores e gestores podem cancelar solicitações já aprovadas' 
      });
    }
    
    // Preparar dados para atualização
    const updateData: any = { status };
    
    // Adicionar informações de aprovação se estiver aprovando
    if (status === 'aprovado') {
      updateData.approval_user_id = user.id;
      updateData.approval_date = new Date().toISOString();
    }
    
    // Adicionar notas se fornecidas
    if (notes) {
      updateData.notes = notes;
    }

    const { data, error } = await supabase
      .from('towing_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error(`Erro ao atualizar status da solicitação (ID: ${req.params.id}):`, error);
    res.status(500).json({ error: 'Erro ao atualizar status da solicitação', details: error.message });
  }
});

/**
 * @route POST /api/towing/ratings
 * @desc Adicionar uma avaliação para um serviço de guincho
 * @access Privado (usuários autenticados)
 */
router.post('/ratings', authenticateJWT, async (req, res) => {
  try {
    const { request_id, partner_id, rating, comments } = req.body;
    const user_id = (req as any).user.id;
    
    // Validação básica
    if (!request_id || !partner_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: 'Solicitação, parceiro e avaliação (1-5) são obrigatórios' 
      });
    }
    
    // Verificar se o serviço foi concluído
    const { data: request, error: requestError } = await supabase
      .from('towing_requests')
      .select('status, user_id')
      .eq('id', request_id)
      .single();
      
    if (requestError) throw requestError;
    
    if (!request) {
      return res.status(404).json({ error: 'Solicitação de guincho não encontrada' });
    }
    
    if (request.status !== 'concluido') {
      return res.status(400).json({ 
        error: 'Avaliação não permitida', 
        details: 'Só é possível avaliar serviços concluídos' 
      });
    }
    
    // Verificar se o usuário tem permissão para avaliar (deve ser o solicitante ou admin)
    if (request.user_id !== user_id && (req as any).user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Acesso negado', 
        details: 'Você não tem permissão para avaliar este serviço' 
      });
    }
    
    // Verificar se já existe uma avaliação para esta solicitação
    const { data: existingRating, error: ratingError } = await supabase
      .from('towing_ratings')
      .select('id')
      .eq('request_id', request_id)
      .single();
      
    if (ratingError && !ratingError.message.includes('No rows found')) throw ratingError;
    
    if (existingRating) {
      return res.status(400).json({ 
        error: 'Duplicidade', 
        details: 'Este serviço já foi avaliado' 
      });
    }

    // Criar a avaliação
    const { data, error } = await supabase
      .from('towing_ratings')
      .insert([{
        request_id,
        partner_id,
        user_id,
        rating,
        comments
      }])
      .select()
      .single();

    if (error) throw error;

    // Atualizar a avaliação média do parceiro
    const { data: ratings, error: avgError } = await supabase
      .from('towing_ratings')
      .select('rating')
      .eq('partner_id', partner_id);
      
    if (avgError) throw avgError;
    
    if (ratings && ratings.length > 0) {
      const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      
      await supabase
        .from('towing_partners')
        .update({ rating: avgRating.toFixed(1) })
        .eq('id', partner_id);
    }

    res.status(201).json(data);
  } catch (error: any) {
    console.error('Erro ao criar avaliação:', error);
    res.status(500).json({ error: 'Erro ao criar avaliação', details: error.message });
  }
});

export default router;