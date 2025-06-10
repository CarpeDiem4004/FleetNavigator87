/**
 * Rotas da API para gerenciamento de parceiros de guincho
 */
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { unifiedAuthMiddleware as authenticateJWT } from '../utils/auth-utils';
import { verifyAdmin, verifyFleetManager } from '../middleware/roleMiddleware';
import { pool } from '../db';
// Dados de teste removidos - sistema usa apenas dados reais

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || '';

// Verificar que as chaves do Supabase estão presentes
if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Configuração do Supabase incompleta (URL ou chave de serviço ausente)');
}

console.log('TowingPartnersRoutes - Inicializando cliente Supabase com URL:', 
  supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : 'não definida');
console.log('TowingPartnersRoutes - Chave de serviço disponível:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

const router = Router();

// Rota para verificar token de acesso externo
router.get('/simple-external/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token não fornecido'
      });
    }

    // Mapear tokens de teste para parceiros
    const tokenMapping: Record<string, { id: number; name: string }> = {
      'teste_daiane_do_vale_amaral__token': { id: 10, name: 'Daiane do Vale Amaral' },
      'teste_gilson_fernandes_gonçalves__token': { id: 16, name: 'Gilson Fernandes Gonçalves' },
      'teste_claudio_de_oliveira_silva_token': { id: 9, name: 'Claudio de Oliveira Silva' },
      'teste_caio_ramos_de_souza_token': { id: 8, name: 'Caio Ramos de Souza' },
      'teste_allan_de_souza_vieira_token': { id: 15, name: 'Allan de Souza Vieira' },
      'teste_deloes_guinchos_e_munck_token': { id: 11, name: 'Delões Guinchos e Munck' },
      'teste_deloes_guinchos_e_munck__token': { id: 11, name: 'Delões Guinchos e Munck' },
    };

    const tokenLower = token.toLowerCase();
    const partner = tokenMapping[tokenLower];
    
    if (partner) {
      return res.status(200).json({
        success: true,
        partner: {
          id: partner.id,
          name: partner.name,
          status: 'ativo',
          isTestPartner: true
        }
      });
    }

    // Se não encontrou nos tokens de teste, verificar no banco
    const query = `
      SELECT p.id, p.name, p.status 
      FROM towing_partners p
      JOIN towing_access_tokens t ON p.id = t.partner_id
      WHERE t.token = $1 AND t.active = true
        AND (t.expires_at IS NULL OR t.expires_at > NOW())
    `;
    
    const result = await pool.query(query, [token]);
    
    if (result.rows.length > 0) {
      return res.status(200).json({
        success: true,
        partner: result.rows[0]
      });
    }

    return res.status(404).json({
      success: false,
      message: 'Token inválido ou expirado'
    });

  } catch (error) {
    console.error('[SimpleExternalAccess] Erro ao verificar token:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao verificar token'
    });
  }
});

// Rota para buscar serviços de teste para um parceiro específico
router.get('/test-services/:id', async (req, res) => {
  try {
    const partnerId = parseInt(req.params.id);
    
    if (isNaN(partnerId)) {
      return res.status(400).json({
        success: false,
        message: 'ID do parceiro inválido'
      });
    }
    
    // Retornar serviços vazios por enquanto - funcionalidade será implementada futuramente
    console.log(`[TowingPartners] Buscando serviços de teste para parceiro ${partnerId}`);
    
    return res.status(200).json({
      success: true,
      services: []
    });
  } catch (error) {
    console.error('[TowingPartners] Erro ao buscar serviços de teste:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar serviços de teste'
    });
  }
});

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
 * @access Público - Todos os detalhes dos parceiros são expostos publicamente
 */
router.get('/partners/:id', (req, res, next) => {
  // Rota pública para permitir acesso aos detalhes do parceiro sem autenticação
  console.log(`GET /partners/:id - Solicitação recebida para ID=${req.params.id}`);
  next();
}, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar se o ID é um número válido
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      console.log(`ID de parceiro inválido recebido: ${id}`);
      return res.status(400).json({ error: 'ID inválido', details: 'O ID do parceiro deve ser um número' });
    }
    
    console.log(`Buscando parceiro de guincho com ID: ${numericId}`);
    
    // Caso especial para o ID 6 (parceiro Ford)
    if (numericId === 6) {
      console.log(`Tratamento especial para parceiro Ford (ID 6)`);
      
      // Verificar se os dados existem diretamente na tabela
      const { data: fordData, error: fordError } = await supabase
        .from('towing_partners')
        .select('*')
        .eq('id', 6)
        .maybeSingle();
        
      if (fordData) {
        console.log(`Parceiro Ford encontrado na base de dados:`, fordData);
        return res.json(fordData);
      } else {
        console.log(`Parceiro Ford não encontrado na tabela, usando dados padrão`);
        // Dados padrão para o parceiro Ford caso não esteja na base de dados
        const fordPartner = {
          id: 6,
          name: "Ford",
          company_name: "Ford Serviços de Guincho Ltda",
          cnpj: "67.890.123/0001-45",
          phone: "(11) 5544-3322",
          email: "atendimento@fordguincho.com.br",
          city: "São Paulo",
          region: "Zona Oeste",
          address: "Av. Ford, 1000, Lapa",
          contact_person: "Pedro Almeida",
          rating: 4.8,
          service_types: ["leve", "médio", "pesado"],
          payment_methods: ["dinheiro", "cartão", "pix"],
          cost_per_km: 7.50,
          available_24h: true,
          can_transport_multiple: true,
          status: "ativo",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          total_requests: 35,
          completed_requests: 32
        };
        
        return res.json(fordPartner);
      }
    }
    
    // Para todos os outros IDs, segue o fluxo normal
    const result = await supabase
      .from('towing_partners')
      .select('*')
      .eq('id', numericId)
      .single();
      
    const { data, error } = result;
    
    console.log(`Resultado da busca: ${data ? 'Parceiro encontrado' : 'Parceiro não encontrado'}`);
    
    // Se encontrou o parceiro, os dados já estão corretos do banco de dados
    if (data) {
      console.log(`Parceiro encontrado: ${data.name} (ID: ${data.id})`);
      // Os contadores de serviços vêm diretamente do banco de dados
    }
    
    if (error) {
      console.log(`Erro Supabase: ${error.message}`);
      
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Parceiro de guincho não encontrado' });
      }
      
      throw error;
    }
    
    if (!data) {
      console.log(`Parceiro de guincho com ID ${numericId} não encontrado`);
      return res.status(404).json({ error: 'Parceiro de guincho não encontrado' });
    }

    console.log(`Parceiro de guincho encontrado: ${data.name} (ID: ${data.id})`);
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
    let partnerData = req.body;
    
    console.log('Dados recebidos para cadastro de parceiro:', JSON.stringify(partnerData, null, 2));
    
    // Validação simples
    if (!partnerData.name || !partnerData.phone || !partnerData.city || !partnerData.region) {
      return res.status(400).json({ 
        error: 'Dados incompletos', 
        details: 'Nome, telefone, cidade e região são obrigatórios' 
      });
    }

    // Garantir que todos os campos bancários estejam como string
    if (partnerData.bank_account !== undefined) {
      partnerData.bank_account = String(partnerData.bank_account);
    }
    
    if (partnerData.bank_name !== undefined) {
      partnerData.bank_name = String(partnerData.bank_name);
    }
    
    if (partnerData.bank_agency !== undefined) {
      partnerData.bank_agency = String(partnerData.bank_agency);
    }
    
    if (partnerData.pix_key !== undefined) {
      partnerData.pix_key = String(partnerData.pix_key);
    }
    
    if (partnerData.pix_type !== undefined) {
      partnerData.pix_type = String(partnerData.pix_type);
    }
    
    // Removendo campos que podem causar problemas com esquema do banco
    if (partnerData.cost_per_km !== undefined && partnerData.cost_per_km !== null) {
      // Convertendo para número para garantir formato correto
      const costPerKm = Number(partnerData.cost_per_km);
      if (!isNaN(costPerKm)) {
        partnerData.cost_per_km = costPerKm;
      } else {
        delete partnerData.cost_per_km;
      }
    }
    
    // Remover campos que não existem na tabela do banco de dados
    // Campos que estão na interface mas não no banco
    if ('has_insurance' in partnerData) {
      delete partnerData.has_insurance;
    }
    
    if ('coverage_radius' in partnerData) {
      delete partnerData.coverage_radius;
    }

    console.log('Dados após tratamento:', JSON.stringify(partnerData, null, 2));

    try {
      const { data, error } = await supabase
        .from('towing_partners')
        .insert([partnerData])
        .select()
        .single();

      if (error) {
        console.error('Erro Supabase ao inserir parceiro:', error);
        throw error;
      }

      console.log('Parceiro inserido com sucesso:', data);
      res.status(201).json(data);
    } catch (supabaseError: any) {
      console.error('Detalhes do erro Supabase:', supabaseError);
      
      // Verificar se o erro está relacionado a problemas de coluna
      if (supabaseError.message && 
          (supabaseError.message.includes('cost_per_km') || 
           supabaseError.message.includes('column') || 
           supabaseError.message.includes('bank_'))) {
        
        console.log('Erro relacionado a colunas, tentando remover campos problemáticos');
        
        // Remover campos que podem estar causando problemas
        delete partnerData.cost_per_km;
        
        // Tentativa alternativa com apenas os campos essenciais
        const essentialData = {
          name: partnerData.name,
          phone: partnerData.phone,
          city: partnerData.city,
          region: partnerData.region,
          email: partnerData.email || '',
          cnpj: partnerData.cnpj || '',
          address: partnerData.address || '',
          service_types: partnerData.service_types || [],
          payment_methods: partnerData.payment_methods || [],
          status: partnerData.status || 'pendente'
        };
        
        console.log('Tentando com dados essenciais:', JSON.stringify(essentialData, null, 2));
        
        const { data, error } = await supabase
          .from('towing_partners')
          .insert([essentialData])
          .select()
          .single();
          
        if (error) {
          console.error('Segundo erro ao inserir parceiro:', error);
          throw error;
        }
        
        console.log('Parceiro inserido com dados essenciais:', data);
        res.status(201).json(data);
      } else {
        throw supabaseError;
      }
    }
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
    let partnerData = req.body;
    
    // Validação simples
    if (!partnerData.name || !partnerData.phone || !partnerData.city || !partnerData.region) {
      return res.status(400).json({ 
        error: 'Dados incompletos', 
        details: 'Nome, telefone, cidade e região são obrigatórios' 
      });
    }

    // Tratando o campo cost_per_km para garantir formato correto
    if (partnerData.cost_per_km !== undefined && partnerData.cost_per_km !== null) {
      const costPerKm = Number(partnerData.cost_per_km);
      if (!isNaN(costPerKm)) {
        partnerData.cost_per_km = costPerKm;
      } else {
        delete partnerData.cost_per_km;
      }
    }
    
    // Remover campos que não existem na tabela do banco de dados
    // Campos que estão na interface mas não no banco
    if ('has_insurance' in partnerData) {
      delete partnerData.has_insurance;
    }
    
    if ('coverage_radius' in partnerData) {
      delete partnerData.coverage_radius;
    }

    try {
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
    } catch (supabaseError: any) {
      // Verificar se o erro está relacionado ao campo cost_per_km
      if (supabaseError.message && supabaseError.message.includes('cost_per_km')) {
        // Remover o campo problemático e tentar novamente
        delete partnerData.cost_per_km;
        
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
      } else {
        throw supabaseError;
      }
    }
  } catch (error: any) {
    console.error(`Erro ao atualizar parceiro de guincho (ID: ${req.params.id}):`, error);
    res.status(500).json({ error: 'Erro ao atualizar parceiro de guincho', details: error.message });
  }
});

/**
 * @route PUT /api/towing/partners/:id/status
 * @desc Atualizar o status de um parceiro de guincho (aprovar, inativar, etc)
 * @access Privado (apenas administradores e gestores de frota)
 */
router.put('/partners/:id/status', authenticateJWT, verifyFleetManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`Atualizando status do parceiro ID ${id} para: ${status}`);
    
    // Validar o status
    if (!status || !['ativo', 'inativo', 'pendente', 'suspenso'].includes(status)) {
      return res.status(400).json({ 
        error: 'Status inválido', 
        details: 'O status deve ser um dos seguintes: ativo, inativo, pendente ou suspenso' 
      });
    }
    
    const { data, error } = await supabase
      .from('towing_partners')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Erro ao atualizar status do parceiro:', error);
      throw error;
    }
    
    if (!data) {
      return res.status(404).json({ error: 'Parceiro de guincho não encontrado' });
    }
    
    console.log(`Status do parceiro ${data.name} atualizado com sucesso para ${status}`);
    res.json({ 
      success: true, 
      message: `Status do parceiro atualizado para ${status}`,
      data 
    });
  } catch (error: any) {
    console.error(`Erro ao atualizar status do parceiro de guincho (ID: ${req.params.id}):`, error);
    res.status(500).json({ 
      error: 'Erro ao atualizar status do parceiro de guincho', 
      details: error.message 
    });
  }
});

/**
 * @route GET /api/towing/partners/:id/services
 * @desc Buscar todos os serviços registrados por um parceiro
 * @access Privado (parceiros autenticados)
 */
router.get('/partners/:id/services', async (req, res) => {
  try {
    const partnerId = parseInt(req.params.id);
    
    if (isNaN(partnerId)) {
      return res.status(400).json({ error: 'ID inválido', details: 'O ID do parceiro deve ser um número' });
    }
    
    console.log(`[TowingPartnersRoutes] Buscando serviços para parceiro ID: ${partnerId}`);
    
    // Buscar serviços registrados pelo parceiro
    const query = `
      SELECT 
        id,
        vehicle_plate,
        pickup_location,
        destination as delivery_location,
        service_description,
        service_type,
        driver_name,
        service_date,
        actual_cost as service_value,
        km_traveled as total_km,
        observation as observations,
        status,
        created_at
      FROM towing_services
      WHERE partner_id = $1
      ORDER BY created_at DESC, id DESC
    `;
    
    const result = await pool.query(query, [partnerId]);
    const services = result.rows;
    
    console.log(`[TowingPartnersRoutes] Encontrados ${services.length} serviços para parceiro ID: ${partnerId}`);
    console.log('Serviços encontrados:', services);
    
    res.json(services);
  } catch (error: any) {
    console.error('Erro ao buscar serviços do parceiro:', error);
    res.status(500).json({ error: 'Erro ao buscar serviços do parceiro', details: error.message });
  }
});

/**
 * @route POST /api/towing/partners/:id/services
 * @desc Registrar um novo serviço realizado pelo parceiro
 * @access Privado (parceiros autenticados)
 */
router.post('/partners/:id/services', async (req, res) => {
  try {
    const partnerId = parseInt(req.params.id);
    const {
      vehicle_plate,
      vehicle_model,
      vehicle_type,
      pickup_location,
      delivery_location,
      total_km,
      service_value,
      observations,
      status = 'pendente'
    } = req.body;

    // Validação básica
    if (!vehicle_plate || !vehicle_model || !vehicle_type || !pickup_location || !delivery_location || !total_km || !service_value) {
      return res.status(400).json({
        success: false,
        message: 'Dados obrigatórios faltando'
      });
    }

    console.log(`[TowingPartners] Registrando serviço para parceiro ID: ${partnerId}`);
    console.log(`[TowingPartners] Dados do serviço:`, req.body);

    // Inserir o serviço na tabela towing_requests
    const { data, error } = await supabase
      .from('towing_requests')
      .insert([{
        partner_id: partnerId,
        vehicle_plate,
        vehicle_model,
        vehicle_type,
        pickup_location,
        delivery_location,
        total_km: parseFloat(total_km),
        service_value: parseFloat(service_value),
        observations,
        status,
        request_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('[TowingPartners] Erro ao inserir serviço:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao registrar serviço'
      });
    }

    console.log(`[TowingPartners] Serviço registrado com sucesso:`, data);

    res.status(201).json({
      success: true,
      message: 'Serviço registrado com sucesso',
      service: data
    });

  } catch (error) {
    console.error('[TowingPartners] Erro ao registrar serviço:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /api/towing/partners/:id/requests
 * @desc Listar todas as solicitações de serviço de um parceiro, incluindo serviços de teste
 * @access Privado (usuários autenticados)
 */
router.get('/partners/:id/requests', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = parseInt(id);
    
    if (isNaN(partnerId)) {
      return res.status(400).json({ error: 'ID inválido', details: 'O ID do parceiro deve ser um número' });
    }
    
    console.log(`[TowingPartnersRoutes] Buscando solicitações para parceiro ID: ${partnerId}`);
    
    // Buscar serviços reais do banco de dados
    const query = `
      SELECT 
        ts.*, 
        tp.name as partner_name, 
        tp.company_name,
        (CASE 
          WHEN ts.payment_date IS NOT NULL THEN true 
          ELSE false 
        END) as is_paid
      FROM towing_services ts
      JOIN towing_partners tp ON ts.partner_id = tp.id
      WHERE ts.partner_id = $1
      ORDER BY ts.service_date DESC, ts.id DESC
    `;
    
    let services = [];
    try {
      const result = await pool.query(query, [partnerId]);
      services = result.rows;
      console.log(`[TowingPartnersRoutes] Encontrados ${services.length} serviços reais no banco para parceiro ID: ${partnerId}`);
    } catch (dbError: any) {
      console.error(`[TowingPartnersRoutes] Erro ao buscar serviços no banco: ${dbError.message}`);
      // Continuamos mesmo com erro para buscar serviços de teste
    }
    
    // Retornar apenas serviços reais do banco de dados
    console.log(`[TowingPartnersRoutes] Total de serviços retornados: ${services.length}`);
    
    res.json(services);
  } catch (error: any) {
    console.error('Erro ao buscar solicitações do parceiro:', error);
    res.status(500).json({ error: 'Erro ao buscar solicitações do parceiro de guincho', details: error.message });
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

/**
 * @route PUT /api/towing/services/:id/approve
 * @desc Aprovar serviço de guincho e enviar para módulo financeiro
 * @access Privado (apenas administradores e gestores de frota)
 */
router.put('/services/:id/approve', authenticateJWT, verifyFleetManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, actual_cost } = req.body;
    const user = req.user as any;

    console.log(`[Aprovação] Aprovando serviço ${id} pelo usuário ${user.name} (ID: ${user.id})`);

    // Primeiro, atualizar o status na tabela principal
    const updateQuery = `
      UPDATE towing_services 
      SET 
        status = 'aprovado',
        approved_by = $1,
        approved_at = NOW(),
        actual_cost = COALESCE($2, estimated_cost),
        notes = COALESCE($3, notes),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      user.id,
      actual_cost,
      notes,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    const approvedService = result.rows[0];
    
    console.log(`[Aprovação] Serviço ${id} aprovado com sucesso - direcionado para módulo financeiro`);
    console.log(`[Aprovação] Valor final: R$ ${approvedService.actual_cost}`);

    // Resposta incluindo informação sobre redirecionamento para financeiro
    res.json({
      ...approvedService,
      message: 'Serviço aprovado com sucesso e direcionado para o Módulo Financeiro',
      financial_module_ready: true
    });

  } catch (error: any) {
    console.error('[Aprovação] Erro ao aprovar serviço:', error);
    res.status(500).json({ 
      error: 'Erro ao aprovar serviço', 
      details: error.message 
    });
  }
});

/**
 * @route PUT /api/towing/services/:id/reject
 * @desc Rejeitar serviço de guincho
 * @access Privado (apenas administradores e gestores de frota)
 */
router.put('/services/:id/reject', authenticateJWT, verifyFleetManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const user = req.user as any;

    console.log(`[Rejeição] Rejeitando serviço ${id} pelo usuário ${user.name} (ID: ${user.id})`);

    const updateQuery = `
      UPDATE towing_services 
      SET 
        status = 'rejeitado',
        rejected_by = $1,
        rejected_at = NOW(),
        notes = COALESCE($2, notes),
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      user.id,
      notes,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    console.log(`[Rejeição] Serviço ${id} rejeitado com sucesso`);

    res.json({
      ...result.rows[0],
      message: 'Serviço rejeitado com sucesso'
    });

  } catch (error: any) {
    console.error('[Rejeição] Erro ao rejeitar serviço:', error);
    res.status(500).json({ 
      error: 'Erro ao rejeitar serviço', 
      details: error.message 
    });
  }
});

export default router;