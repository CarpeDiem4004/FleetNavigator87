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
    
    // Suporte para diferentes formatos de API (v1 e v2)
    // Isso permite compatibilidade com diferentes clientes
    const {
      token,
      // Suporte para nomenclatura v1
      placa,
      local_retirada,
      local_entrega,
      servico_realizado,
      data_servico,
      valor,
      km_percorrido,
      observacoes,
      nome_contato,
      telefone_contato,
      // Suporte para nomenclatura v2
      vehicle_plate,
      pickup_location,
      delivery_location,
      drop_off_location,
      service_description,
      service_date,
      actual_cost,
      km_traveled,
      observation,
      driver_name,
      driver_phone
    } = req.body;

    console.log('[SimpleExternalAccess] Campos normalizados:', {
      vehicle: vehicle_plate || placa,
      pickup: pickup_location || local_retirada,
      delivery: delivery_location || drop_off_location || local_entrega
    });

    // Normalizar campos para permitir qualquer formato de API
    const normalizedPlate = vehicle_plate || placa;
    const normalizedPickup = pickup_location || local_retirada;
    const normalizedDelivery = delivery_location || drop_off_location || local_entrega;
    const normalizedService = service_description || servico_realizado;
    const normalizedDate = service_date || data_servico;
    const normalizedCost = actual_cost || valor;
    const normalizedMileage = km_traveled || km_percorrido;
    const normalizedNotes = observation || observacoes;
    const normalizedContactName = driver_name || nome_contato;
    const normalizedContactPhone = driver_phone || telefone_contato;

    // Validação de campos obrigatórios usando versão normalizada
    if (!token || !normalizedPlate || !normalizedPickup || !normalizedDelivery || !normalizedService || !normalizedCost) {
      console.error('[SimpleExternalAccess] Erro de validação: campos obrigatórios ausentes', { 
        token: !!token, 
        placa: !!normalizedPlate, 
        local_retirada: !!normalizedPickup, 
        local_entrega: !!normalizedDelivery, 
        servico_realizado: !!normalizedService, 
        valor: !!normalizedCost 
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
      (normalizedPlate || '').toUpperCase(),
      normalizedPickup,
      normalizedDelivery,
      normalizedService,
      normalizedDate || new Date(),
      parseFloat(normalizedCost.toString()),
      normalizedMileage || null,
      normalizedNotes || null,
      normalizedContactName || null,
      normalizedContactPhone || null
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
    let { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token não informado'
      });
    }
    
    // Decodificar token para lidar com caracteres especiais na URL
    try {
      token = decodeURIComponent(token);
    } catch (e) {
      console.log('[SimpleExternalAccess] Erro ao decodificar token, usando como está');
    }
    
    // Verificar imediatamente se é um token de teste especial
    // Usamos toLowerCase() para evitar problemas com diferentes capitalizações e removemos acentos
    let tokenLower = token.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove acentos
      
    // Melhorar detecção de tokens normalizando espaços e underscores múltiplos
    tokenLower = tokenLower.replace(/_{2,}/g, '_'); // Substitui múltiplos underscores por um único
    tokenLower = tokenLower.replace(/\s+/g, '_');   // Substitui espaços por underscores
    tokenLower = tokenLower.replace(/__+/g, '_'); // Substitui múltiplos underscores por um só
    
    console.log(`[SimpleExternalAccess] Token normalizado para verificação: ${tokenLower}`);
    
    // Verificação simplificada para tokens de teste - Abordagem eficiente para diversos formatos de token
    if (tokenLower.includes('allan') || 
        tokenLower.includes('caio') || 
        tokenLower.includes('claudio') || 
        tokenLower.includes('daiane') ||
        tokenLower.includes('deloes') ||
        tokenLower.includes('ford') || 
        tokenLower.includes('guincho')) {
      
      console.log(`[SimpleExternalAccess] Detectado token de teste: ${token}`);
      
      // Determinar qual parceiro fictício usar
      let partnerId = 999;
      let partnerName = 'S de Souza Guincho';
      let companyName = 'S de Souza Serviços de Guincho LTDA';
      
      if (tokenLower === 'teste_ford_token') {
        partnerId = 6;
        partnerName = 'Ford';
        companyName = 'Ford Serviços de Guincho Ltda';
      } else if (tokenLower === 'teste_guincho_águia_token' || tokenLower === 'teste_guincho_aguia_token') {
        partnerId = 5;
        partnerName = 'Guincho Águia';
        companyName = 'Guincho Águia LTDA';
      } else if (tokenLower === 'teste_allan_de_souza_token' ||
                 tokenLower === 'teste_allan_de_souza_vieira_token') {
        partnerId = 15;
        partnerName = 'Allan de Souza Vieira';
        companyName = 'Allan de Souza Vieira Serviços de Guincho LTDA';
      } else if (tokenLower === 'teste_caio_ramos_de_souza_token' || tokenLower.includes('caio_ramos_de_souza')) {
        partnerId = 8;
        partnerName = 'Caio Ramos de Souza';
        companyName = 'Caio Ramos de Souza Serviços de Guincho LTDA';
      } else if (tokenLower.includes('claudio_de_oliveira_silva')) {
        partnerId = 9;
        partnerName = 'Claudio de Oliveira Silva';
        companyName = 'Claudio de Oliveira Silva Serviços de Guincho LTDA';
      } else if (tokenLower.includes('daiane_do_vale_amaral')) {
        partnerId = 10;
        partnerName = 'Daiane do Vale Amaral';
        companyName = 'Daiane do Vale Amaral Serviços de Guincho LTDA';
      } else if (tokenLower.includes('deloes_guinchos_e_munck')) {
        partnerId = 11;
        partnerName = 'Delões Guinchos e Munck';
        companyName = 'Delões Guinchos e Munck LTDA';
      }
      
      return res.status(200).json({
        success: true,
        message: 'Token válido (modo de teste)',
        data: {
          partnerId,
          partnerName,
          companyName,
          expiresAt: null,
          isPermanent: true
        }
      });
    }
    
    // Query para buscar tokens válidos (sem expirar ou NULL = sem data de expiração)
    const query = `
      SELECT t.*, p.name as partner_name, p.company_name
      FROM towing_access_tokens t
      JOIN towing_partners p ON t.partner_id = p.id
      WHERE t.token = $1 AND (
        t.expires_at IS NULL 
        OR t.expires_at > NOW()
      )
    `;
    
    const result = await pool.query(query, [token]);
    
    // Se o token não foi encontrado no banco de dados, mas é um token especial para testes
    // vamos gerar uma resposta fictícia para facilitar o desenvolvimento
    if (result.rowCount === 0) {
      // Verificação de token de teste já foi feita acima - 
      // Este bloco de código antigo foi substituído por uma lógica mais robusta
      
      // Se não for um token de teste, retornar erro normal
      return res.status(404).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }
    
    // Verificar se o token está próximo de expirar (menos de 30 dias)
    const tokenData = result.rows[0];
    if (tokenData.expires_at) {
      const expiresAt = new Date(tokenData.expires_at);
      const now = new Date();
      const daysUntilExpiration = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`[SimpleExternalAccess] Token expira em ${daysUntilExpiration} dias`);
      
      // Se estiver a menos de 30 dias de expirar, renovar por mais 365 dias
      if (daysUntilExpiration < 30) {
        console.log(`[SimpleExternalAccess] Renovando token que expira em ${daysUntilExpiration} dias`);
        
        const newExpirationDate = new Date();
        newExpirationDate.setDate(newExpirationDate.getDate() + 365); // Adiciona 365 dias
        
        const updateQuery = `
          UPDATE towing_access_tokens
          SET expires_at = $1
          WHERE token = $2
          RETURNING *
        `;
        
        try {
          const updateResult = await pool.query(updateQuery, [newExpirationDate, token]);
          console.log(`[SimpleExternalAccess] Token renovado com sucesso. Nova data de expiração: ${newExpirationDate.toISOString()}`);
          tokenData.expires_at = updateResult.rows[0].expires_at;
        } catch (error) {
          console.error(`[SimpleExternalAccess] Erro ao renovar token:`, error);
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Token válido',
      data: {
        partnerId: tokenData.partner_id,
        partnerName: tokenData.partner_name,
        companyName: tokenData.company_name,
        expiresAt: tokenData.expires_at
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
    let { token } = req.params;
    console.log('[SimpleExternalAccess] Solicitação de histórico para token:', token);
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token não informado'
      });
    }
    
    // Decodificar token para lidar com caracteres especiais na URL
    try {
      token = decodeURIComponent(token);
    } catch (e) {
      console.log('[SimpleExternalAccess] Erro ao decodificar token, usando como está');
    }
    
    // Primeiro verifica se o token é válido
    // Query para verificar apenas tokens válidos que estão no banco de dados
    const tokenQuery = `
      SELECT t.*, p.name as partner_name, p.company_name
      FROM towing_access_tokens t
      JOIN towing_partners p ON t.partner_id = p.id
      WHERE t.token = $1 AND (
        t.expires_at IS NULL 
        OR t.expires_at > NOW()
      )
    `;
    
    const tokenResult = await pool.query(tokenQuery, [token]);
    console.log('[SimpleExternalAccess] Resultado da validação do token:', {
      encontrado: tokenResult.rowCount && tokenResult.rowCount > 0,
      token: token.substring(0, 5) + '...'
    });
    
    // Se o token não foi encontrado no banco de dados, mas é um token especial para testes
    if (!tokenResult.rowCount || tokenResult.rowCount === 0) {
      // Verificar se é um token de teste (formato especial)
      // Usamos toLowerCase() para evitar problemas com diferentes capitalizações e removemos acentos
      let tokenLower = token.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove acentos
      
      // Melhorar detecção de tokens normalizando espaços e underscores múltiplos
      tokenLower = tokenLower.replace(/_{2,}/g, '_'); // Substitui múltiplos underscores por um único
      tokenLower = tokenLower.replace(/\s+/g, '_');   // Substitui espaços por underscores
      tokenLower = tokenLower.replace(/__+/g, '_');   // Substitui múltiplos underscores por um só (segunda verificação)
      
      console.log(`[SimpleExternalAccess/History] Token normalizado para verificação: ${tokenLower}`);
      console.log(`[SimpleExternalAccess/History] Token original: ${token}`);
        
      // Verificação simplificada para tokens de teste - Abordagem eficiente para diversos formatos de token
      if (tokenLower.includes('allan') || 
          tokenLower.includes('caio') || 
          tokenLower.includes('claudio') || 
          tokenLower.includes('daiane') ||
          tokenLower.includes('deloes') ||
          tokenLower.includes('ford') || 
          tokenLower.includes('guincho')) {
        
        console.log(`[SimpleExternalAccess] Detectado token de teste: ${token}`);
        
        // Determinar qual parceiro fictício usar com base no token
        let partnerId = 999;
        let partnerName = 'S de Souza Guincho';
        let companyName = 'S de Souza Serviços de Guincho LTDA';
        
        if (tokenLower === 'teste_ford_token') {
          partnerId = 6;
          partnerName = 'Ford';
          companyName = 'Ford Serviços de Guincho Ltda';
        } else if (tokenLower === 'teste_guincho_aguia_token') {
          partnerId = 5;
          partnerName = 'Guincho Águia';
          companyName = 'Guincho Águia LTDA';
        } else if (tokenLower === 'teste_allan_de_souza_token' || 
                  tokenLower === 'teste_allan_de_souza_vieira_token') {
          partnerId = 15;
          partnerName = 'Allan de Souza Vieira';
          companyName = 'Allan de Souza Vieira Serviços de Guincho LTDA';
        } else if (tokenLower === 'teste_caio_ramos_de_souza_token' || tokenLower.includes('caio_ramos_de_souza')) {
          partnerId = 8;
          partnerName = 'Caio Ramos de Souza';
          companyName = 'Caio Ramos de Souza Serviços de Guincho LTDA';
        } else if (tokenLower === 'teste_claudio_de_oliveira_silva_token' || tokenLower.includes('claudio_de_oliveira_silva')) {
          partnerId = 9;
          partnerName = 'Claudio de Oliveira Silva';
          companyName = 'Claudio de Oliveira Silva Serviços de Guincho LTDA';
        } else if (tokenLower.includes('daiane_do_vale_amaral') || tokenLower.includes('daiane')) {
          partnerId = 10;
          partnerName = 'Daiane do Vale Amaral';
          companyName = 'Daiane do Vale Amaral Serviços de Guincho LTDA';
        } else if (tokenLower.includes('deloes_guinchos_e_munck') || tokenLower.includes('deloes')) {
          partnerId = 11;
          partnerName = 'Delões Guinchos e Munck';
          companyName = 'Delões Guinchos e Munck LTDA';
        }
        
        // Criar dados de histórico fictícios
        const demoServices = [
          {
            id: 12345,
            plate: 'ABC1234',
            pickup_location: 'Av. Paulista, 1000',
            delivery_location: 'Rua Augusta, 500',
            service_description: 'Reboque após acidente',
            service_date: new Date(new Date().setDate(new Date().getDate() - 5)),
            cost: 350.0,
            mileage: 15,
            status: 'approved',
            payment_status: 'paid',
            created_at: new Date(new Date().setDate(new Date().getDate() - 5))
          },
          {
            id: 12346,
            plate: 'DEF5678',
            pickup_location: 'Rod. Anhanguera, km 15',
            delivery_location: 'Oficina ABC, São Paulo',
            service_description: 'Pane elétrica',
            service_date: new Date(new Date().setDate(new Date().getDate() - 10)),
            cost: 280.0,
            mileage: 22,
            status: 'pending',
            payment_status: 'pending',
            created_at: new Date(new Date().setDate(new Date().getDate() - 10))
          }
        ];
        
        return res.status(200).json({
          success: true,
          message: 'Histórico de serviços (modo de teste)',
          data: {
            partnerId: partnerId,
            partnerName: partnerName,
            companyName: companyName,
            serviceCount: demoServices.length,
            services: demoServices
          }
        });
      }
      
      // Se não for um token de teste, retornar erro normal
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