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
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    const partnerId = tokenResult.rows[0].partner_id;
    
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
    
    const result = await pool.query(insertQuery, values);
    
    // Atualizar estatísticas do parceiro
    const updatePartnerStatsQuery = `
      UPDATE towing_partners
      SET 
        service_count = service_count + 1,
        last_service_date = NOW()
      WHERE id = $1
    `;
    
    await pool.query(updatePartnerStatsQuery, [partnerId]);
    
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

export default router;