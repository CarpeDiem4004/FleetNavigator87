/**
 * Rotas para acesso externo simplificado de parceiros de guincho
 * Permite que parceiros enviem informações de serviços realizados
 * através de links externos sem necessidade de login
 */

import express from 'express';
import { pool } from '../db';

const router = express.Router();

// Rota para envio de notificações de serviço (form simples)
router.post('/submit', async (req, res) => {
  try {
    console.log('[SimpleExternalAccess] Recebendo submissão de serviço:', req.body);
    
    const {
      token,
      placa,
      local_retirada,
      local_entrega,
      servico_realizado,
      data_servico,
      valor,
      km_percorrido,
      observacoes,
      nome_contato,
      telefone_contato
    } = req.body;

    // Validação de campos obrigatórios
    if (!token || !placa || !local_retirada || !local_entrega || !servico_realizado || !valor) {
      console.error('[SimpleExternalAccess] Erro de validação: campos obrigatórios ausentes', { 
        token: !!token, 
        placa: !!placa, 
        local_retirada: !!local_retirada, 
        local_entrega: !!local_entrega, 
        servico_realizado: !!servico_realizado, 
        valor: !!valor 
      });
      
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios não informados'
      });
    }

    // Verificar se o token é válido
    const tokenCheckQuery = `
      SELECT * FROM towing_access_tokens 
      WHERE token = $1 AND (expires_at IS NULL OR expires_at > NOW())
    `;
    
    const tokenResult = await pool.query(tokenCheckQuery, [token]);
    
    if (tokenResult.rowCount === 0) {
      console.error('[SimpleExternalAccess] Token inválido ou expirado:', token);
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    const partnerId = tokenResult.rows[0].partner_id;
    console.log('[SimpleExternalAccess] Token válido para parceiro ID:', partnerId);
    
    // Registrar o serviço na tabela towing_service_notes
    const insertQuery = `
      INSERT INTO towing_service_notes (
        partner_id, 
        plate, 
        pickup_location, 
        delivery_location, 
        service_description, 
        service_date, 
        cost, 
        mileage, 
        notes,
        contact_name,
        contact_phone,
        status,
        created_at,
        payment_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', NOW(), 'pending')
      RETURNING *
    `;
    
    const values = [
      partnerId,
      placa.toUpperCase(),
      local_retirada,
      local_entrega,
      servico_realizado,
      data_servico || new Date(),
      parseFloat(valor),
      km_percorrido || null,
      observacoes || null,
      nome_contato || null,
      telefone_contato || null
    ];
    
    console.log('[SimpleExternalAccess] Tentando inserir registro com valores:', values);
    const result = await pool.query(insertQuery, values);
    console.log('[SimpleExternalAccess] Registro inserido com sucesso, ID:', result.rows[0].id);
    
    // Atualizar estatísticas do parceiro
    const updatePartnerStatsQuery = `
      UPDATE towing_partners
      SET 
        service_count = COALESCE(service_count, 0) + 1,
        last_service_date = NOW()
      WHERE id = $1
      RETURNING service_count
    `;
    
    const updateResult = await pool.query(updatePartnerStatsQuery, [partnerId]);
    console.log('[SimpleExternalAccess] Estatísticas do parceiro atualizadas, total de serviços:', 
      updateResult.rows[0]?.service_count || 'N/A');
    
    return res.status(201).json({
      success: true,
      message: 'Serviço registrado com sucesso',
      data: result.rows[0]
    });
    
  } catch (error: any) {
    console.error('[SimpleExternalAccess] Erro ao processar submissão:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar o serviço',
      error: error.message
    });
  }
});

// Rota para verificar se um token é válido
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token não informado'
      });
    }
    
    const query = `
      SELECT t.*, p.name as partner_name, p.company_name
      FROM towing_access_tokens t
      JOIN towing_partners p ON t.partner_id = p.id
      WHERE t.token = $1 AND (t.expires_at IS NULL OR t.expires_at > NOW())
    `;
    
    const result = await pool.query(query, [token]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Token válido',
      data: {
        partnerId: result.rows[0].partner_id,
        partnerName: result.rows[0].partner_name,
        companyName: result.rows[0].company_name,
        expiresAt: result.rows[0].expires_at
      }
    });
    
  } catch (error: any) {
    console.error('[SimpleExternalAccess] Erro ao verificar token:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar token',
      error: error.message
    });
  }
});

// Rota para obter histórico de serviços para um token específico
router.get('/history/:token', async (req, res) => {
  try {
    console.log('[SimpleExternalAccess] Solicitação de histórico para token:', req.params.token);
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token não informado'
      });
    }
    
    // Primeiro verifica se o token é válido
    const tokenQuery = `
      SELECT t.*, p.name as partner_name, p.company_name
      FROM towing_access_tokens t
      JOIN towing_partners p ON t.partner_id = p.id
      WHERE t.token = $1 AND (t.expires_at IS NULL OR t.expires_at > NOW())
    `;
    
    const tokenResult = await pool.query(tokenQuery, [token]);
    console.log('[SimpleExternalAccess] Resultado da validação do token:', {
      encontrado: tokenResult.rowCount > 0,
      token: token.substring(0, 5) + '...'
    });
    
    if (tokenResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }
    
    const partnerId = tokenResult.rows[0].partner_id;
    console.log('[SimpleExternalAccess] Buscando histórico para parceiro ID:', partnerId);
    
    // Busca os serviços desse parceiro
    const historyQuery = `
      SELECT 
        id, 
        plate, 
        pickup_location, 
        delivery_location, 
        service_description, 
        service_date, 
        cost, 
        mileage, 
        status, 
        payment_status,
        approved_at,
        created_at
      FROM towing_service_notes
      WHERE partner_id = $1
      ORDER BY created_at DESC
    `;
    
    const historyResult = await pool.query(historyQuery, [partnerId]);
    console.log('[SimpleExternalAccess] Serviços encontrados:', historyResult.rowCount);
    
    // Verificar se os serviços estão no banco de dados
    if (historyResult.rowCount === 0) {
      console.log('[SimpleExternalAccess] Verificando todos os serviços na tabela:');
      const allServicesQuery = `SELECT COUNT(*) as total FROM towing_service_notes`;
      const allServicesResult = await pool.query(allServicesQuery);
      console.log('[SimpleExternalAccess] Total de serviços na tabela:', allServicesResult.rows[0].total);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Histórico de serviços',
      data: {
        partnerId: partnerId,
        partnerName: tokenResult.rows[0].partner_name,
        companyName: tokenResult.rows[0].company_name,
        serviceCount: historyResult.rowCount,
        services: historyResult.rows
      }
    });
    
  } catch (error: any) {
    console.error('[SimpleExternalAccess] Erro ao obter histórico:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter histórico de serviços',
      error: error.message
    });
  }
});

export default router;