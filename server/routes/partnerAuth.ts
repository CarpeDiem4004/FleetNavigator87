import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../database.js';

const router = Router();

// Login para parceiros de guincho
router.post('/partner-login', async (req, res) => {
  try {
    const { name, password } = req.body;
    
    console.log('[PartnerAuth] Tentativa de login para parceiro:', name);
    
    if (!name || !password) {
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
    
    const partnerResult = await pool.query(partnerQuery, [name]);
    
    if (partnerResult.rows.length === 0) {
      console.log('[PartnerAuth] Parceiro não encontrado ou inativo:', name);
      return res.status(401).json({
        success: false,
        message: 'Parceiro não encontrado ou inativo'
      });
    }
    
    const partner = partnerResult.rows[0];
    
    // Verificar se a senha (CPF/CNPJ) está correta
    // Remove formatação para comparação
    const cleanPassword = password.replace(/[^\d]/g, '');
    const cleanCnpj = partner.cnpj ? partner.cnpj.replace(/[^\d]/g, '') : '';
    
    if (cleanPassword !== cleanCnpj) {
      console.log('[PartnerAuth] Senha incorreta para parceiro:', name);
      return res.status(401).json({
        success: false,
        message: 'CPF/CNPJ incorreto'
      });
    }
    
    // Gerar token JWT para o parceiro
    const token = jwt.sign(
      { 
        id: partner.id,
        name: partner.name,
        company_name: partner.company_name,
        type: 'partner',
        role: 'partner'
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );
    
    // Atualizar token de acesso externo na tabela
    const updateTokenQuery = `
      UPDATE towing_partners 
      SET external_access_token = $1, token_expires_at = NOW() + INTERVAL '24 hours'
      WHERE id = $2
    `;
    
    await pool.query(updateTokenQuery, [token, partner.id]);
    
    console.log('[PartnerAuth] Login bem-sucedido para parceiro:', partner.name);
    
    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      partner: {
        id: partner.id,
        name: partner.name,
        company_name: partner.company_name,
        email: partner.email,
        phone: partner.phone,
        city: partner.city,
        type: 'partner'
      }
    });
    
  } catch (error) {
    console.error('[PartnerAuth] Erro no login do parceiro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Verificar token do parceiro
router.get('/partner-verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }
    
    // Verificar JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    if (decoded.type !== 'partner') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido para parceiro'
      });
    }
    
    // Verificar se o parceiro ainda existe e está ativo
    const partnerQuery = `
      SELECT id, name, company_name, cnpj, phone, email, city, status
      FROM towing_partners 
      WHERE id = $1 AND status = 'ativo'
    `;
    
    const partnerResult = await pool.query(partnerQuery, [decoded.id]);
    
    if (partnerResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Parceiro não encontrado ou inativo'
      });
    }
    
    const partner = partnerResult.rows[0];
    
    res.json({
      success: true,
      partner: {
        id: partner.id,
        name: partner.name,
        company_name: partner.company_name,
        email: partner.email,
        phone: partner.phone,
        city: partner.city,
        type: 'partner'
      }
    });
    
  } catch (error) {
    console.error('[PartnerAuth] Erro na verificação do token:', error);
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
});

// Logout do parceiro
router.post('/partner-logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      
      // Remover token da tabela
      await pool.query(
        'UPDATE towing_partners SET external_access_token = NULL, token_expires_at = NULL WHERE id = $1',
        [decoded.id]
      );
    }
    
    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
    
  } catch (error) {
    console.error('[PartnerAuth] Erro no logout:', error);
    res.json({
      success: true,
      message: 'Logout realizado'
    });
  }
});

export default router;