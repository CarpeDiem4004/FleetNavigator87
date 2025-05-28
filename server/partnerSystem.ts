import type { Express } from "express";
import { pool } from './database.js';

export function setupPartnerSystem(app: Express) {
  console.log('🎯 Configurando sistema de parceiros...');

  // Rota de login para parceiros
  app.post('/partner-login', async (req, res) => {
    console.log('🎯 [PARTNER-LOGIN] Tentativa de login recebida');
    
    try {
      const { name, cnpj } = req.body;
      console.log('🎯 [PARTNER-LOGIN] Dados:', { name, cnpj: cnpj ? '***' : 'vazio' });

      if (!name || !cnpj) {
        return res.status(400).json({
          success: false,
          message: 'Nome e CNPJ são obrigatórios'
        });
      }

      // Buscar parceiro no banco
      const query = `
        SELECT id, name, cnpj, phone, address, ativo as active
        FROM towing_partners 
        WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
        AND cnpj = $2
        AND ativo = true
      `;
      
      const result = await pool.query(query, [name.trim(), cnpj.replace(/\D/g, '')]);
      
      if (result.rows.length === 0) {
        console.log('🎯 [PARTNER-LOGIN] Parceiro não encontrado');
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }

      const partner = result.rows[0];
      console.log('🎯 [PARTNER-LOGIN] Parceiro encontrado:', partner.name);
      
      // Buscar serviços pendentes do parceiro
      const servicesQuery = `
        SELECT s.id, s.vehicle_plate, s.origin_address, s.destination_address, 
               s.service_type, s.status, s.created_at, s.estimated_cost, s.actual_cost
        FROM towing_services s
        WHERE s.partner_id = $1
        AND s.status IN ('pendente', 'em_andamento', 'aguardando_aprovacao')
        ORDER BY s.created_at DESC
      `;
      
      const servicesResult = await pool.query(servicesQuery, [partner.id]);
      
      return res.json({
        success: true,
        message: 'Login realizado com sucesso',
        partner: {
          id: partner.id,
          name: partner.name,
          phone: partner.phone,
          address: partner.address,
          active: partner.active
        },
        services: servicesResult.rows
      });

    } catch (error) {
      console.error('🎯 [PARTNER-LOGIN] Erro:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  // Rota para atualizar serviço
  app.post('/partner-service-update', async (req, res) => {
    console.log('🎯 [SERVICE-UPDATE] Atualização de serviço recebida');
    
    try {
      const { serviceId, partnerId, status, actualCost, notes } = req.body;
      
      // Verificar se o serviço pertence ao parceiro
      const checkQuery = `
        SELECT id FROM towing_services 
        WHERE id = $1 AND partner_id = $2
      `;
      
      const checkResult = await pool.query(checkQuery, [serviceId, partnerId]);
      
      if (checkResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Serviço não encontrado ou acesso negado'
        });
      }

      // Atualizar o serviço
      const updateQuery = `
        UPDATE towing_services 
        SET status = $1, actual_cost = $2, notes = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4 AND partner_id = $5
        RETURNING *
      `;
      
      const updateResult = await pool.query(updateQuery, [
        status, actualCost, notes, serviceId, partnerId
      ]);
      
      console.log('🎯 [SERVICE-UPDATE] Serviço atualizado:', updateResult.rows[0]);
      
      return res.json({
        success: true,
        message: 'Serviço atualizado com sucesso',
        service: updateResult.rows[0]
      });

    } catch (error) {
      console.error('🎯 [SERVICE-UPDATE] Erro:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar serviço'
      });
    }
  });

  // Rota para listar serviços do parceiro
  app.get('/partner-services/:partnerId', async (req, res) => {
    console.log('🎯 [SERVICES-LIST] Listagem de serviços');
    
    try {
      const { partnerId } = req.params;
      
      const query = `
        SELECT s.id, s.vehicle_plate, s.origin_address, s.destination_address, 
               s.service_type, s.status, s.created_at, s.estimated_cost, s.actual_cost,
               s.notes, s.updated_at
        FROM towing_services s
        WHERE s.partner_id = $1
        ORDER BY s.created_at DESC
        LIMIT 50
      `;
      
      const result = await pool.query(query, [partnerId]);
      
      return res.json({
        success: true,
        services: result.rows
      });

    } catch (error) {
      console.error('🎯 [SERVICES-LIST] Erro:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao carregar serviços'
      });
    }
  });

  console.log('🎯 Sistema de parceiros configurado com sucesso');
}