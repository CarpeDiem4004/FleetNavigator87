/**
 * Sistema de Acesso Externo para Parceiros de Guincho
 * Permite que parceiros registrem serviços através de links únicos
 */

import { Router, Request, Response } from 'express';
import { pool } from '../database.js';

const router = Router();

// Validar token de acesso de parceiro
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        valid: false,
        error: 'Token não fornecido'
      });
    }

    console.log(`[ExternalAccess] Validando token: ${token}`);

    // Buscar parceiro pelo token
    const query = `
      SELECT id, name, company_name, external_access_token, token_expires_at
      FROM towing_partners 
      WHERE external_access_token = $1 
      AND status = 'ativo'
      AND (token_expires_at IS NULL OR token_expires_at > NOW())
    `;

    const result = await pool.query(query, [token]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        valid: false,
        error: 'Token inválido ou expirado'
      });
    }

    const partner = result.rows[0];

    res.status(200).json({
      valid: true,
      partner: {
        id: partner.id,
        name: partner.name,
        company_name: partner.company_name,
        token_expires_at: partner.token_expires_at
      }
    });

  } catch (error) {
    console.error('[ExternalAccess] Erro ao validar token:', error);
    res.status(500).json({
      valid: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Registrar novo serviço via acesso externo
router.post('/submit-service', async (req: Request, res: Response) => {
  try {
    const {
      token,
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

    if (!token || !vehicle_plate || !pickup_location || !destination) {
      return res.status(400).json({
        success: false,
        error: 'Dados obrigatórios: token, placa do veículo, local de origem e destino'
      });
    }

    console.log(`[ExternalAccess] Registrando serviço via token: ${token}`);

    // Validar token e obter parceiro
    const partnerQuery = `
      SELECT id, name 
      FROM towing_partners 
      WHERE external_access_token = $1 
      AND status = 'ativo'
      AND (token_expires_at IS NULL OR token_expires_at > NOW())
    `;

    const partnerResult = await pool.query(partnerQuery, [token]);

    if (partnerResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido ou expirado'
      });
    }

    const partner = partnerResult.rows[0];

    // Inserir o serviço
    const insertQuery = `
      INSERT INTO towing_services (
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
        status,
        created_via_token,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pendente', $12, NOW())
      RETURNING id
    `;

    const values = [
      partner.id,
      vehicle_plate.toUpperCase(),
      pickup_location,
      destination,
      service_description,
      service_type || 'reboque',
      driver_name,
      service_date || new Date().toISOString().split('T')[0],
      actual_cost ? parseFloat(actual_cost) : null,
      km_traveled ? parseFloat(km_traveled) : null,
      observation,
      token
    ];

    const serviceResult = await pool.query(insertQuery, values);
    const serviceId = serviceResult.rows[0].id;

    console.log(`[ExternalAccess] Serviço ${serviceId} registrado para parceiro ${partner.name}`);

    res.status(201).json({
      success: true,
      message: 'Serviço registrado com sucesso',
      service_id: serviceId,
      partner_name: partner.name
    });

  } catch (error) {
    console.error('[ExternalAccess] Erro ao registrar serviço:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar histórico de serviços do parceiro
router.get('/history/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    console.log(`[ExternalAccess] Buscando histórico para token: ${token}`);

    // Validar token e obter parceiro
    const partnerQuery = `
      SELECT id, name 
      FROM towing_partners 
      WHERE external_access_token = $1 
      AND status = 'ativo'
      AND (token_expires_at IS NULL OR token_expires_at > NOW())
    `;

    const partnerResult = await pool.query(partnerQuery, [token]);

    if (partnerResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido ou expirado'
      });
    }

    const partner = partnerResult.rows[0];

    // Buscar serviços do parceiro (incluindo serviços das tabelas principais)
    const servicesQuery = `
      SELECT DISTINCT
        COALESCE(ts.id, tps.id) as id,
        COALESCE(ts.vehicle_plate, tps.vehicle_plate) as vehicle_plate,
        COALESCE(ts.pickup_location, tps.pickup_location) as pickup_location,
        COALESCE(ts.destination, tps.destination) as destination,
        COALESCE(ts.service_description, tps.service_description) as service_description,
        COALESCE(ts.service_type, tps.service_type) as service_type,
        COALESCE(ts.driver_name, tps.driver_name) as driver_name,
        COALESCE(ts.service_date, tps.service_date) as service_date,
        COALESCE(ts.actual_cost, tps.actual_cost) as actual_cost,
        COALESCE(ts.km_traveled, tps.km_traveled) as km_traveled,
        COALESCE(ts.observation, tps.observation) as observation,
        COALESCE(ts.status, tps.status) as status,
        COALESCE(ts.created_at, tps.created_at) as created_at,
        COALESCE(ts.approved_at, tps.approved_at) as approved_at,
        COALESCE(ts.rejected_at, tps.rejected_at) as rejected_at,
        COALESCE(ts.rejection_reason, tps.rejection_reason) as rejection_reason,
        'external' as source_table
      FROM towing_services ts
      WHERE ts.partner_id = $1 AND ts.created_via_token IS NOT NULL
      
      UNION ALL
      
      SELECT DISTINCT
        tps.id,
        tps.vehicle_plate,
        tps.pickup_location,
        tps.destination,
        tps.service_description,
        tps.service_type,
        tps.driver_name,
        tps.service_date,
        tps.actual_cost,
        tps.km_traveled,
        tps.observation,
        tps.status,
        tps.created_at,
        tps.approved_at,
        tps.rejected_at,
        tps.rejection_reason,
        'main' as source_table
      FROM towing_partner_services tps
      WHERE tps.partner_id = $1
      
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;

    const servicesResult = await pool.query(servicesQuery, [partner.id, limit, offset]);

    // Contar total de serviços (incluindo ambas as tabelas)
    const countQuery = `
      SELECT COUNT(*) as total FROM (
        SELECT id FROM towing_services WHERE partner_id = $1 AND created_via_token IS NOT NULL
        UNION ALL
        SELECT id FROM towing_partner_services WHERE partner_id = $1
      ) as combined_services
    `;
    const countResult = await pool.query(countQuery, [partner.id]);

    res.status(200).json({
      success: true,
      partner: {
        id: partner.id,
        name: partner.name
      },
      services: servicesResult.rows,
      total: parseInt(countResult.rows[0].total),
      has_more: (parseInt(offset as string) + parseInt(limit as string)) < parseInt(countResult.rows[0].total)
    });

  } catch (error) {
    console.error('[ExternalAccess] Erro ao buscar histórico:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Gerar novo token para parceiro (apenas admin)
router.post('/generate-token', async (req: Request, res: Response) => {
  try {
    const { partner_id, expires_in_days = 30 } = req.body;

    if (!partner_id) {
      return res.status(400).json({
        success: false,
        error: 'ID do parceiro é obrigatório'
      });
    }

    // Gerar token único
    const token = `partner_${partner_id}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Calcular data de expiração
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expires_in_days);

    // Atualizar parceiro com novo token
    const updateQuery = `
      UPDATE towing_partners 
      SET external_access_token = $1, token_expires_at = $2, updated_at = NOW()
      WHERE id = $3 AND status = 'ativo'
      RETURNING id, name, company_name
    `;

    const result = await pool.query(updateQuery, [token, expiresAt, partner_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Parceiro não encontrado ou inativo'
      });
    }

    const partner = result.rows[0];

    console.log(`[ExternalAccess] Token gerado para parceiro ${partner.name}: ${token}`);

    res.status(200).json({
      success: true,
      partner: {
        id: partner.id,
        name: partner.name,
        company_name: partner.company_name
      },
      token: token,
      expires_at: expiresAt,
      access_url: `/fleet-management/towing-partners/external-access/${token}`
    });

  } catch (error) {
    console.error('[ExternalAccess] Erro ao gerar token:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Teste de conectividade
router.get('/ping', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Sistema de acesso externo operacional',
    timestamp: new Date().toISOString()
  });
});

export default router;