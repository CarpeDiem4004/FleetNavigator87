/**
 * Rotas simplificadas para acesso externo de parceiros de guincho
 */

import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { pool } from '../db';

const router = express.Router();

// Rota para buscar detalhes de um parceiro pelo ID
router.get('/partner/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const result = await pool.query(
      'SELECT * FROM towing_partners WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Parceiro não encontrado' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar detalhes do parceiro:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes do parceiro' });
  }
});

// Rota para gerar token de acesso externo
router.post('/generate', async (req: Request, res: Response) => {
  try {
    // Verificar autenticação (simplificado)
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const { partner_id, expiration_days = 30 } = req.body;

    if (!partner_id) {
      return res.status(400).json({ error: 'ID do parceiro é obrigatório' });
    }

    // Gerar token único
    const token = crypto.randomBytes(16).toString('hex');
    
    // Calcular data de expiração
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(expiration_days));

    // Inserir token no banco de dados
    const insertResult = await pool.query(
      `INSERT INTO towing_access_tokens 
      (token, partner_id, created_by, expires_at) 
      VALUES ($1, $2, $3, $4)
      RETURNING id`,
      [token, partner_id, req.user?.id || 1, expiresAt.toISOString()]
    );

    // Buscar dados do parceiro
    const partnerResult = await pool.query(
      `SELECT id, name, company_name FROM towing_partners WHERE id = $1`,
      [partner_id]
    );
    
    const partner = partnerResult.rows[0];

    // Gerar a URL de acesso com o token
    const accessUrl = `${req.protocol}://${req.get('host')}/fleet-management/towing-partners/external-access/${token}`;

    res.status(201).json({
      success: true,
      token,
      partner,
      expires_at: expiresAt,
      access_url: accessUrl
    });
  } catch (error) {
    console.error('Erro ao gerar token de acesso:', error);
    res.status(500).json({ error: 'Erro ao gerar token de acesso' });
  }
});

// Rota para validar token
router.get('/validate/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ valid: false, error: 'Token não fornecido' });
    }

    // Verificar token no banco de dados
    const tokenResult = await pool.query(
      `SELECT * FROM towing_access_tokens 
      WHERE token = $1 AND active = true`,
      [token]
    );
    
    const tokenData = tokenResult.rows[0];

    if (!tokenData) {
      return res.status(404).json({ valid: false, error: 'Token inválido ou expirado' });
    }

    // Verificar se o token expirou
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();

    if (now > expiresAt) {
      return res.status(401).json({ valid: false, error: 'Token expirado' });
    }

    // Buscar informações do parceiro
    const partnerResult = await pool.query(
      `SELECT id, name, company_name FROM towing_partners
      WHERE id = $1`,
      [tokenData.partner_id]
    );
    
    const partner = partnerResult.rows[0];

    if (!partner) {
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

// Rota para registrar serviço via acesso externo
router.post('/submit', async (req: Request, res: Response) => {
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

    if (!token || !partner_id || !vehicle_plate || !pickup_location || !destination) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Verificar token no banco de dados
    const tokenResult = await pool.query(
      `SELECT * FROM towing_access_tokens 
      WHERE token = $1 AND active = true`,
      [token]
    );
    
    const tokenData = tokenResult.rows[0];

    if (!tokenData) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    // Verificar se o token expirou
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();

    if (now > expiresAt) {
      return res.status(401).json({ error: 'Token expirado' });
    }

    // Verificar se o parceiro associado ao token corresponde ao parceiro_id fornecido
    if (tokenData.partner_id !== Number(partner_id)) {
      return res.status(403).json({ error: 'ID do parceiro não corresponde ao token' });
    }

    // Registrar o serviço no banco de dados
    const serviceResult = await pool.query(
      `INSERT INTO towing_services
      (partner_id, vehicle_plate, pickup_location, destination, service_description, 
       service_type, driver_name, service_date, actual_cost, km_traveled, observation, 
       status, created_via_token)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id`,
      [
        partner_id,
        vehicle_plate,
        pickup_location,
        destination,
        service_description || '',
        service_type || 'padrao',
        driver_name || 'Não informado',
        service_date || new Date().toISOString().split('T')[0],
        actual_cost || 0,
        km_traveled || null,
        observation || null,
        'pendente',
        token
      ]
    );
    
    const service = serviceResult.rows[0];

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

export default router;