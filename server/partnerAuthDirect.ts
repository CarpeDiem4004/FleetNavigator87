import type { Express, Request, Response } from "express";

// Implementação completamente isolada da autenticação de parceiros
export function setupDirectPartnerAuth(app: Express) {
  console.log('🚀 Registrando rota de parceiros com máxima prioridade');
  
  // Middleware específico para esta rota que evita conflitos
  app.use('/api/partner-auth-direct', (req, res, next) => {
    console.log('🚀 [MIDDLEWARE-PARTNER] Interceptando requisição para rota de parceiros');
    
    // Definir headers explicitamente
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });

  app.post('/api/partner-auth-direct', async (req: Request, res: Response) => {
    console.log('🚀 [PARTNER-AUTH-DIRECT] EXECUTANDO ROTA ISOLADA');
    
    try {
      const { name, cnpj } = req.body;
      console.log('🚀 [PARTNER-AUTH-DIRECT] Dados recebidos:', { 
        name: name || 'VAZIO', 
        cnpj: cnpj ? '***' + cnpj.slice(-4) : 'VAZIO' 
      });

      if (!name || !cnpj) {
        console.log('🚀 [PARTNER-AUTH-DIRECT] Dados inválidos - retornando erro 400');
        return res.status(400).json({
          success: false,
          message: 'Nome e CNPJ são obrigatórios'
        });
      }

      // Importar pool diretamente sem cache
      delete require.cache[require.resolve('./database.js')];
      const { pool } = require('./database.js');

      console.log('🚀 [PARTNER-AUTH-DIRECT] Executando query no banco de dados...');
      
      // Query simplificada
      const query = `
        SELECT id, name, cnpj, phone, address, status
        FROM towing_partners 
        WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
        AND cnpj = $2
        AND status = 'ativo'
        LIMIT 1
      `;
      
      const cleanCnpj = cnpj.replace(/\D/g, '');
      const result = await pool.query(query, [name.trim(), cleanCnpj]);
      
      console.log('🚀 [PARTNER-AUTH-DIRECT] Resultado da query:', {
        rowCount: result.rows.length,
        encontrado: result.rows.length > 0
      });
      
      if (result.rows.length === 0) {
        console.log('🚀 [PARTNER-AUTH-DIRECT] Parceiro não encontrado - retornando erro 401');
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }

      const partner = result.rows[0];
      console.log('🚀 [PARTNER-AUTH-DIRECT] Parceiro encontrado:', partner.name);
      
      const response = {
        success: true,
        message: 'Login realizado com sucesso',
        partner: {
          id: partner.id,
          name: partner.name,
          phone: partner.phone,
          address: partner.address,
          status: partner.status
        },
        services: [],
        timestamp: new Date().toISOString()
      };

      console.log('🚀 [PARTNER-AUTH-DIRECT] Enviando resposta de sucesso');
      return res.status(200).json(response);

    } catch (error: any) {
      console.error('🚀 [PARTNER-AUTH-DIRECT] ERRO CRÍTICO:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  });
  
  console.log('🚀 [PARTNER-AUTH-DIRECT] Rota registrada com sucesso');
}