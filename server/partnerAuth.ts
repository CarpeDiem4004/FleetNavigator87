import { Express, Request, Response } from 'express';
import { pool } from './db';

// Middleware específico para autenticação de parceiros
export function setupPartnerAuth(app: Express) {
  // Rota completamente isolada para autenticação de parceiros
  app.use('/api/partner/*', (req: Request, res: Response, next) => {
    // Forçar headers JSON para todas as rotas de parceiros
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });

  // Rota de login específica para parceiros
  app.post('/api/partner/login', async (req: Request, res: Response) => {
    console.log('🎯 [PARTNER-AUTH] Login de parceiro iniciado');
    console.log('🎯 [PARTNER-AUTH] Body:', req.body);
    
    try {
      const { name, password } = req.body;
      
      if (!name || !password) {
        console.log('🎯 [PARTNER-AUTH] Dados incompletos');
        return res.status(400).json({
          success: false,
          message: 'Nome e CPF/CNPJ são obrigatórios'
        });
      }
      
      // Buscar parceiro
      const query = `
        SELECT id, name, company_name, cnpj, phone, email, city, status
        FROM towing_partners 
        WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) AND status = 'ativo'
      `;
      
      console.log('🎯 [PARTNER-AUTH] Buscando parceiro:', name);
      const result = await pool.query(query, [name]);
      
      if (result.rows.length === 0) {
        console.log('🎯 [PARTNER-AUTH] Parceiro não encontrado');
        return res.status(401).json({
          success: false,
          message: 'Parceiro não encontrado ou inativo'
        });
      }
      
      const partner = result.rows[0];
      
      // Validar CNPJ/CPF
      const cleanPassword = password.replace(/[^\d]/g, '');
      const cleanCnpj = partner.cnpj ? partner.cnpj.replace(/[^\d]/g, '') : '';
      
      console.log('🎯 [PARTNER-AUTH] Verificando credenciais:', {
        inputPassword: cleanPassword,
        storedCnpj: cleanCnpj
      });
      
      if (cleanPassword !== cleanCnpj) {
        console.log('🎯 [PARTNER-AUTH] Credenciais inválidas');
        return res.status(401).json({
          success: false,
          message: 'CPF/CNPJ incorreto'
        });
      }
      
      console.log('🎯 [PARTNER-AUTH] Login bem-sucedido!');
      
      // Resposta de sucesso
      const response = {
        success: true,
        message: 'Login realizado com sucesso',
        partner: {
          id: partner.id,
          name: partner.name,
          company_name: partner.company_name,
          email: partner.email,
          phone: partner.phone,
          city: partner.city,
          cnpj: partner.cnpj,
          type: 'partner'
        },
        timestamp: new Date().toISOString()
      };
      
      console.log('🎯 [PARTNER-AUTH] Enviando resposta:', response);
      return res.json(response);
      
    } catch (error) {
      console.error('🎯 [PARTNER-AUTH] Erro crítico:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  // Rota para obter serviços do parceiro
  app.get('/api/partner/:partnerId/services', async (req: Request, res: Response) => {
    try {
      const { partnerId } = req.params;
      
      const query = `
        SELECT 
          id,
          status,
          vehicle_plate,
          pickup_address,
          delivery_address,
          service_type,
          estimated_cost,
          actual_cost,
          created_at,
          updated_at
        FROM towing_services 
        WHERE partner_id = $1 
        ORDER BY created_at DESC
        LIMIT 50
      `;
      
      const result = await pool.query(query, [partnerId]);
      
      return res.json({
        success: true,
        services: result.rows
      });
      
    } catch (error) {
      console.error('🎯 [PARTNER-AUTH] Erro ao buscar serviços:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar serviços'
      });
    }
  });

  // Rota para atualizar status do serviço
  app.put('/api/partner/service/:serviceId/status', async (req: Request, res: Response) => {
    try {
      const { serviceId } = req.params;
      const { status, notes, actual_cost } = req.body;
      
      const query = `
        UPDATE towing_services 
        SET 
          status = $1,
          notes = COALESCE($2, notes),
          actual_cost = COALESCE($3, actual_cost),
          updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `;
      
      const result = await pool.query(query, [status, notes, actual_cost, serviceId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Serviço não encontrado'
        });
      }
      
      return res.json({
        success: true,
        message: 'Status atualizado com sucesso',
        service: result.rows[0]
      });
      
    } catch (error) {
      console.error('🎯 [PARTNER-AUTH] Erro ao atualizar serviço:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar serviço'
      });
    }
  });

  console.log('✅ Sistema de autenticação de parceiros configurado');
}