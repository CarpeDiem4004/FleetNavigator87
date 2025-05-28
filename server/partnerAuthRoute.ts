import { Express } from 'express';
import { pool } from './db';

export function registerPartnerAuthRoute(app: Express) {
  // Rota de autenticação específica para parceiros de guincho
  app.post('/api/auth/partner-login', async (req, res) => {
    console.log('[PartnerAuth] Rota /api/auth/partner-login chamada');
    console.log('[PartnerAuth] Dados recebidos:', req.body);
    
    // Definir o tipo de resposta como JSON
    res.setHeader('Content-Type', 'application/json');
    
    try {
      const { name, password } = req.body;
      
      console.log('[PartnerAuth] Tentativa de login para parceiro:', name);
      
      if (!name || !password) {
        console.log('[PartnerAuth] Dados faltando - nome:', !!name, 'password:', !!password);
        return res.status(400).json({
          success: false,
          message: 'Nome e senha (CPF/CNPJ) são obrigatórios'
        });
      }
      
      // Buscar parceiro pelo nome
      const partnerQuery = `
        SELECT id, name, company_name, cnpj, phone, email, city, status
        FROM towing_partners 
        WHERE LOWER(name) = LOWER($1) AND status = 'ativo'
      `;
      
      console.log('[PartnerAuth] Executando query para buscar parceiro:', name);
      const partnerResult = await pool.query(partnerQuery, [name]);
      console.log('[PartnerAuth] Resultado da busca:', partnerResult.rows.length, 'parceiros encontrados');
      
      if (partnerResult.rows.length === 0) {
        console.log('[PartnerAuth] Parceiro não encontrado ou inativo:', name);
        return res.status(401).json({
          success: false,
          message: 'Parceiro não encontrado ou inativo'
        });
      }
      
      const partner = partnerResult.rows[0];
      console.log('[PartnerAuth] Parceiro encontrado:', partner.name, 'CNPJ:', partner.cnpj);
      
      // Verificar se a senha (CPF/CNPJ) está correta
      const cleanPassword = password.replace(/[^\d]/g, '');
      const cleanCnpj = partner.cnpj ? partner.cnpj.replace(/[^\d]/g, '') : '';
      
      console.log('[PartnerAuth] Comparando senhas - Fornecida:', cleanPassword, 'Banco:', cleanCnpj);
      
      if (cleanPassword !== cleanCnpj) {
        console.log('[PartnerAuth] Senha incorreta para parceiro:', name);
        return res.status(401).json({
          success: false,
          message: 'CPF/CNPJ incorreto'
        });
      }
      
      console.log('[PartnerAuth] Login bem-sucedido para parceiro:', partner.name);
      
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
          type: 'partner'
        }
      };
      
      console.log('[PartnerAuth] Enviando resposta:', response);
      return res.json(response);
      
    } catch (error) {
      console.error('[PartnerAuth] Erro no login do parceiro:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });
}