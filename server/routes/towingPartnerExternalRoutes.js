/**
 * Rotas para acesso externo de parceiros de guincho
 * Esta API permite que parceiros de guincho registrem serviços realizados
 * através de um link exclusivo, para posterior aprovação pelo gestor de frota.
 */

const express = require('express');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Configurar cliente Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Tabela para armazenar tokens de acesso
const TOKENS_TABLE = 'towing_access_tokens';
// Tabela para armazenar serviços realizados
const SERVICES_TABLE = 'towing_services';
// Tabela de parceiros
const PARTNERS_TABLE = 'towing_partners';

/**
 * Gerar um novo token de acesso para um parceiro de guincho
 * POST /api/towing/external-access/generate
 */
router.post('/generate', async (req, res) => {
  try {
    // Verificar autenticação do usuário
    if (!req.isAuthenticated() || !['admin', 'gestor_frota'].includes(req.user?.role)) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const { partner_id, expiration_days = 30 } = req.body;

    if (!partner_id) {
      return res.status(400).json({ error: 'ID do parceiro é obrigatório' });
    }

    // Verificar se o parceiro existe
    const { data: partner, error: partnerError } = await supabase
      .from(PARTNERS_TABLE)
      .select('id, name, company_name')
      .eq('id', partner_id)
      .single();

    if (partnerError || !partner) {
      return res.status(404).json({ error: 'Parceiro não encontrado' });
    }

    // Gerar token único
    const token = crypto.randomBytes(32).toString('hex');
    
    // Calcular data de expiração
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiration_days);

    // Salvar token no banco de dados
    const { data, error } = await supabase
      .from(TOKENS_TABLE)
      .insert([
        {
          token,
          partner_id,
          created_by: req.user.id,
          expires_at: expiresAt.toISOString(),
          active: true
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Erro ao gerar token:', error);
      return res.status(500).json({ error: 'Erro ao gerar token de acesso' });
    }

    // Gerar a URL de acesso com o token
    const accessUrl = `${req.protocol}://${req.get('host')}/fleet-management/towing-partners/external-access/${token}`;

    res.status(201).json({
      token: data.token,
      partner: partner,
      expires_at: data.expires_at,
      access_url: accessUrl
    });
  } catch (error) {
    console.error('Erro ao gerar token de acesso:', error);
    res.status(500).json({ error: 'Erro ao gerar token de acesso' });
  }
});

/**
 * Validar um token de acesso
 * GET /api/towing/external-access/validate/:token
 */
router.get('/validate/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ valid: false, error: 'Token não fornecido' });
    }

    // Buscar o token no banco de dados
    const { data: tokenData, error: tokenError } = await supabase
      .from(TOKENS_TABLE)
      .select('*')
      .eq('token', token)
      .eq('active', true)
      .single();

    if (tokenError || !tokenData) {
      return res.status(404).json({ valid: false, error: 'Token inválido ou expirado' });
    }

    // Verificar se o token expirou
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();

    if (now > expiresAt) {
      return res.status(401).json({ valid: false, error: 'Token expirado' });
    }

    // Buscar informações do parceiro
    const { data: partner, error: partnerError } = await supabase
      .from(PARTNERS_TABLE)
      .select('id, name, company_name')
      .eq('id', tokenData.partner_id)
      .single();

    if (partnerError || !partner) {
      return res.status(404).json({ valid: false, error: 'Parceiro não encontrado' });
    }

    res.status(200).json({
      valid: true,
      partner,
      expires_at: tokenData.expires_at
    });
  } catch (error) {
    console.error('Erro ao validar token:', error);
    res.status(500).json({ valid: false, error: 'Erro ao validar token de acesso' });
  }
});

/**
 * Registrar um novo serviço de guincho realizado
 * POST /api/towing/external-access/submit
 */
router.post('/submit', async (req, res) => {
  try {
    const {
      token,
      partner_id,
      vehicle_plate,
      pickup_location,
      destination,
      service_description,
      service_type,
      driver_name,
      service_date,
      actual_cost,
      km_traveled,
      observation
    } = req.body;

    if (!token || !partner_id || !vehicle_plate || !pickup_location || !destination || !service_description) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Validar o token
    const { data: tokenData, error: tokenError } = await supabase
      .from(TOKENS_TABLE)
      .select('*')
      .eq('token', token)
      .eq('active', true)
      .single();

    if (tokenError || !tokenData) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    // Verificar se o token expirou
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();

    if (now > expiresAt) {
      return res.status(401).json({ error: 'Token expirado' });
    }

    // Verificar se o parceiro associado ao token corresponde ao parceiro_id fornecido
    if (tokenData.partner_id !== partner_id) {
      return res.status(403).json({ error: 'ID do parceiro não corresponde ao token' });
    }

    // Inserir o serviço no banco de dados
    const { data: service, error: serviceError } = await supabase
      .from(SERVICES_TABLE)
      .insert([
        {
          partner_id,
          vehicle_plate,
          pickup_location,
          destination,
          service_description,
          service_type,
          driver_name,
          service_date,
          actual_cost,
          km_traveled,
          observation,
          status: 'pendente',
          created_via_token: token
        }
      ])
      .select()
      .single();

    if (serviceError) {
      console.error('Erro ao registrar serviço:', serviceError);
      return res.status(500).json({ error: 'Erro ao registrar serviço' });
    }

    res.status(201).json({
      success: true,
      service_id: service.id,
      message: 'Serviço registrado com sucesso e aguardando aprovação'
    });
  } catch (error) {
    console.error('Erro ao registrar serviço:', error);
    res.status(500).json({ error: 'Erro ao registrar serviço' });
  }
});

/**
 * Listar todos os tokens de acesso (apenas para admin/gestor)
 * GET /api/towing/external-access/tokens
 */
router.get('/tokens', async (req, res) => {
  try {
    // Verificar autenticação do usuário
    if (!req.isAuthenticated() || !['admin', 'gestor_frota'].includes(req.user?.role)) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    // Buscar todos os tokens
    const { data: tokens, error } = await supabase
      .from(TOKENS_TABLE)
      .select(`
        *,
        partner:partner_id (id, name, company_name),
        created_by_user:created_by (id, name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao listar tokens:', error);
      return res.status(500).json({ error: 'Erro ao listar tokens de acesso' });
    }

    res.json(tokens);
  } catch (error) {
    console.error('Erro ao listar tokens:', error);
    res.status(500).json({ error: 'Erro ao listar tokens de acesso' });
  }
});

/**
 * Revogar um token de acesso (apenas para admin/gestor)
 * POST /api/towing/external-access/revoke/:id
 */
router.post('/revoke/:id', async (req, res) => {
  try {
    // Verificar autenticação do usuário
    if (!req.isAuthenticated() || !['admin', 'gestor_frota'].includes(req.user?.role)) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const { id } = req.params;

    // Atualizar o token para inativo
    const { data, error } = await supabase
      .from(TOKENS_TABLE)
      .update({ active: false, revoked_at: new Date().toISOString(), revoked_by: req.user.id })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao revogar token:', error);
      return res.status(500).json({ error: 'Erro ao revogar token de acesso' });
    }

    res.json({ success: true, message: 'Token revogado com sucesso', token: data });
  } catch (error) {
    console.error('Erro ao revogar token:', error);
    res.status(500).json({ error: 'Erro ao revogar token de acesso' });
  }
});

module.exports = router;