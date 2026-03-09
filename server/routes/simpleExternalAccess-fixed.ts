import { Router } from 'express';
import { Pool } from 'pg';
import { createHash } from 'crypto';

// Importar a conexão com o banco de dados
import { pool } from '../../server/db';

// Criar roteador Express
export const simpleExternalRouter = Router();

// Armazenar serviços de teste
export const testServices = new Map<number, any[]>();

// Adicionar um serviço de teste para um parceiro
function addTestService(partnerId: number, service: any) {
  if (!testServices.has(partnerId)) {
    testServices.set(partnerId, []);
  }
  
  testServices.get(partnerId)?.push(service);
}

// Obter serviços de teste de um parceiro
export function getTestServices(partnerId: number) {
  return testServices.get(partnerId) || [];
}

// Parceiros de teste para desenvolvimento
export const TEST_PARTNERS = [
  { id: 8, name: 'Caio ramos de Souza', token: 'teste_caio_ramos_de_souza_token' },
  { id: 9, name: 'Parceiro de Teste', token: 'teste_parceiro_token' },
  { id: 10, name: 'Auto Socorro Test', token: 'teste_auto_socorro_token' }
];

// Encontrar ID do parceiro pelo token
function findPartnerIdByToken(token: string): number | null {
  // Verificar se é token de teste
  const testPartner = TEST_PARTNERS.find(
    partner => partner.token.toLowerCase() === token.toLowerCase()
  );
  
  if (testPartner) {
    console.log(`[SimpleExternalAccess] Token de teste encontrado para parceiro: ${testPartner.name}`);
    return testPartner.id;
  }
  
  return null;
}

// Garantir que parceiro de teste existe
async function ensureTestPartnerExists(partnerId: number): Promise<boolean> {
  try {
    // Verificar se o parceiro existe
    const checkPartnerQuery = `
      SELECT id FROM towing_partners WHERE id = $1
    `;
    
    const partnerCheck = await pool.query(checkPartnerQuery, [partnerId]);
    
    // Se o parceiro não existir, criar
    if (!partnerCheck.rowCount || partnerCheck.rowCount === 0) {
      // Encontrar dados do parceiro de teste
      const testPartner = TEST_PARTNERS.find(p => p.id === partnerId);
      
      if (!testPartner) {
        console.error(`[SimpleExternalAccess] Parceiro de teste ID ${partnerId} não encontrado na lista de parceiros de teste.`);
        return false;
      }
      
      // Criar parceiro no banco
      const insertPartnerQuery = `
        INSERT INTO towing_partners (
          id, name, status, logo_url, contact_person, phone, email, address, 
          created_at, updated_at
        )
        VALUES (
          $1, $2, 'ativo', NULL, 'Contato Teste', '11999998888', 
          'teste@exemplo.com', 'Endereço de Teste', NOW(), NOW()
        )
        ON CONFLICT (id) DO NOTHING
      `;
      
      await pool.query(insertPartnerQuery, [
        partnerId,
        testPartner.name
      ]);
      
      // Criar token de acesso
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 10); // Token válido por 10 anos
      
      const insertTokenQuery = `
        INSERT INTO towing_access_tokens (
          partner_id, token, active, created_at, expires_at
        )
        VALUES (
          $1, $2, true, NOW(), $3
        )
        ON CONFLICT (token) DO NOTHING
      `;
      
      await pool.query(insertTokenQuery, [
        partnerId,
        testPartner.token,
        expiresAt
      ]);
      
      console.log(`[SimpleExternalAccess] Parceiro de teste ID ${partnerId} (${testPartner.name}) criado com sucesso.`);
    }
    
    return true;
  } catch (error) {
    console.error('[SimpleExternalAccess] Erro ao garantir existência do parceiro de teste:', error);
    return false;
  }
}

// Inicializar serviços de teste
async function initializeTestServices() {
  // Garantir que todos os parceiros de teste existem
  for (const testPartner of TEST_PARTNERS) {
    await ensureTestPartnerExists(testPartner.id);
  }
}

// Inicializar serviços de teste na inicialização do servidor
initializeTestServices().catch(error => {
  console.error('[SimpleExternalAccess] Erro ao inicializar serviços de teste:', error);
});

// Endpoint simples para validar se o token do parceiro está ativo
simpleExternalRouter.get('/simple-external/validate-token', async (req, res) => {
  try {
    const token = req.query.token as string;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token não fornecido'
      });
    }
    
    // Verificar se é um token de teste
    const testPartnerId = findPartnerIdByToken(token);
    if (testPartnerId) {
      // Encontrar dados do parceiro
      const testPartner = TEST_PARTNERS.find(p => p.id === testPartnerId);
      
      return res.status(200).json({
        success: true,
        message: 'Token válido',
        partner: {
          id: testPartner?.id,
          name: testPartner?.name,
          status: 'ativo',
          isTestPartner: true
        }
      });
    }
    
    // Verificar token no banco de dados
    const query = `
      SELECT 
        p.id, p.name, p.status, t.expires_at
      FROM 
        towing_access_tokens t
      JOIN 
        towing_partners p ON t.partner_id = p.id
      WHERE 
        t.token = $1 AND t.active = true
    `;
    
    const result = await pool.query(query, [token]);
    
    if (result.rowCount && result.rowCount > 0) {
      const partner = result.rows[0];
      
      // Verificar se o token não está expirado
      if (partner.expires_at && new Date(partner.expires_at) < new Date()) {
        return res.status(401).json({
          success: false,
          message: 'Token expirado'
        });
      }
      
      // Verificar se o parceiro está ativo
      if (partner.status !== 'ativo') {
        return res.status(403).json({
          success: false,
          message: 'Parceiro inativo'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Token válido',
        partner: {
          id: partner.id,
          name: partner.name,
          status: partner.status
        }
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }
  } catch (error) {
    console.error('[SimpleExternalAccess] Erro ao validar token:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao validar token'
    });
  }
});

// Endpoint para registrar um novo serviço de guincho via acesso externo
simpleExternalRouter.post('/simple-external/submit', async (req, res) => {
  try {
    console.log('[SimpleExternalAccess] Recebendo submissão de serviço:', req.body);
    
    // Extrair e normalizar os dados do corpo da requisição
    // Permitimos campos em português ou inglês para melhor UX
    const { 
      token,
      // Campos em inglês
      vehicle_plate, pickup_location, drop_off_location, delivery_location,
      service_description, service_type, driver_name, service_date, 
      actual_cost, km_traveled, observation, status,
      // Campos em português
      placa, local_retirada, local_entrega, servico_realizado,
      data_servico, valor, km_percorrido, observacoes,
      nome_contato, telefone_contato
    } = req.body;
    
    // Validar token
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token não fornecido'
      });
    }
    
    // Normalizar campos para garantir que temos o que precisamos
    const normalizedPlate = vehicle_plate || placa;
    const normalizedPickup = pickup_location || local_retirada;
    const normalizedDelivery = delivery_location || drop_off_location || local_entrega;
    const normalizedService = service_description || servico_realizado;
    const normalizedDate = service_date || data_servico 
      ? new Date(service_date || data_servico) 
      : new Date();
    const normalizedCost = actual_cost || valor || 0;
    const normalizedMileage = km_traveled || km_percorrido || 0;
    const normalizedNotes = observation || observacoes || '';
    const normalizedContactName = driver_name || nome_contato || '';
    const normalizedContactPhone = telefone_contato || '';
    
    // Validar campos obrigatórios
    if (!normalizedPlate) {
      return res.status(400).json({
        success: false,
        message: 'Placa do veículo é obrigatória'
      });
    }
    
    if (!normalizedPickup) {
      return res.status(400).json({
        success: false,
        message: 'Local de retirada é obrigatório'
      });
    }
    
    if (!normalizedDelivery) {
      return res.status(400).json({
        success: false,
        message: 'Local de entrega é obrigatório'
      });
    }
    
    // Verificar se é um token de teste
    const testPartnerId = findPartnerIdByToken(token);
    let partnerId = testPartnerId;
    let partnerName = '';
    
    if (!testPartnerId) {
      // Token não é de teste, verificar no banco
      const tokenQuery = `
        SELECT 
          t.partner_id, p.name
        FROM 
          towing_access_tokens t
        JOIN 
          towing_partners p ON t.partner_id = p.id
        WHERE 
          t.token = $1 AND t.active = true
          AND (t.expires_at IS NULL OR t.expires_at > NOW())
      `;
      
      const tokenResult = await pool.query(tokenQuery, [token]);
      
      if (!tokenResult.rowCount || tokenResult.rowCount === 0) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido ou expirado'
        });
      }
      
      partnerId = tokenResult.rows[0].partner_id;
      partnerName = tokenResult.rows[0].name;
    } else {
      // É um token de teste
      const testPartner = TEST_PARTNERS.find(p => p.id === testPartnerId);
      partnerName = testPartner?.name || 'Parceiro de Teste';
      
      // Garantir que o parceiro de teste existe
      await ensureTestPartnerExists(testPartnerId);
    }
    
    console.log('[SimpleExternalAccess] Token válido para parceiro ID:', partnerId);
    
    // Para tokens de teste, devolvemos uma resposta simulada em vez de tentar inserir no banco
    // Verificando novamente para garantir que tokens de teste sejam processados corretamente
    if (token.toLowerCase().includes('teste_') || testPartnerId) {
      console.log('[SimpleExternalAccess] Detectando token de teste, simulando resposta para parceiro:', partnerName);
      
      // Gerar ID único simulado para o serviço
      const mockServiceId = Math.floor(Math.random() * 10000) + 1000;
      const mockServiceDate = new Date();
      
      // Criar objeto do serviço simulado para resposta
      const mockService = {
        id: mockServiceId,
        partner_id: partnerId,
        plate: (normalizedPlate || '').toUpperCase(),
        pickup_location: normalizedPickup,
        delivery_location: normalizedDelivery,
        service_description: normalizedService || "Reboque",
        service_date: normalizedDate || mockServiceDate,
        cost: parseFloat(normalizedCost.toString()),
        mileage: parseInt(normalizedMileage?.toString() || "0"),
        notes: normalizedNotes || "",
        contact_name: normalizedContactName || "",
        contact_phone: normalizedContactPhone || "",
        status: "pending",
        created_at: mockServiceDate,
        payment_status: "pending"
      };
      
      // IMPORTANTE: Salvar no banco de dados real para que apareça na tela de aprovação
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
        normalizedService || "Reboque",
        normalizedDate || mockServiceDate,
        parseFloat(normalizedCost.toString()),
        normalizedMileage || null,
        normalizedNotes || null,
        normalizedContactName || null,
        normalizedContactPhone || null
      ];
      
      try {
        const result = await pool.query(insertQuery, values);
        
        if (result.rowCount && result.rowCount > 0) {
          const insertedData = result.rows[0];
          addTestService(partnerId, insertedData);
          
          // Sincronização bem-sucedida, não precisamos fazer mais passos extras
          const syncSuccessful = true;
          
          return res.status(201).json({
            success: true,
            message: 'Serviço registrado com sucesso',
            data: insertedData,
            requestId: insertedData.id
          });
        } else {
          return res.status(400).json({
            success: false,
            message: 'Erro ao registrar serviço no banco de dados',
            serviceInfo: mockService
          });
        }
      } catch (dbError) {
        console.error('[SimpleExternalAccess] Erro ao inserir serviço de teste no banco:', dbError);
        
        // Mesmo com erro, retornamos uma resposta positiva apenas informando que os dados foram recebidos
        return res.status(202).json({
          success: true,
          message: 'Serviço recebido com sucesso mas não foi possível persistir no banco',
          warning: 'Os dados foram recebidos mas não foi possível salvá-los no banco de dados',
          serviceInfo: mockService,
          error: dbError instanceof Error ? dbError.message : String(dbError)
        });
      }
    }
    
    // Se não for token de teste, vamos processar normalmente e inserir no banco de dados
    try {
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
        normalizedService || "Reboque",
        normalizedDate || new Date(),
        parseFloat(normalizedCost.toString()),
        normalizedMileage || 0,
        normalizedNotes || null,
        normalizedContactName || null,
        normalizedContactPhone || null
      ];
      
      console.log('[SimpleExternalAccess] Inserindo serviço no banco:', {
        partnerId, 
        plate: normalizedPlate
      });
      
      const result = await pool.query(insertQuery, values);
      
      if (result.rowCount && result.rowCount > 0) {
        const insertedData = result.rows[0];
        
        return res.status(201).json({
          success: true,
          message: 'Serviço registrado com sucesso',
          data: insertedData,
          requestId: insertedData.id
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Erro ao registrar serviço no banco de dados'
        });
      }
    } catch (dbError) {
      console.error('[SimpleExternalAccess] Erro ao inserir serviço no banco:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao processar o serviço',
        error: dbError instanceof Error ? dbError.message : String(dbError)
      });
    }
  } catch (error) {
    console.error('[SimpleExternalAccess] Erro geral ao processar requisição:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Obter serviços de guincho de teste para um parceiro
simpleExternalRouter.get('/simple-external/test-partner/:id/services', async (req, res) => {
  try {
    const partnerId = parseInt(req.params.id);
    
    if (isNaN(partnerId)) {
      return res.status(400).json({
        success: false,
        message: 'ID do parceiro inválido'
      });
    }
    
    // Buscar serviços no banco
    const query = `
      SELECT * FROM towing_service_notes 
      WHERE partner_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [partnerId]);
    
    return res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error('[SimpleExternalAccess] Erro ao buscar serviços de teste:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao buscar serviços de teste',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Obter serviços de guincho para um token específico
simpleExternalRouter.get('/simple-external/services', async (req, res) => {
  try {
    const token = req.query.token as string;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token não fornecido'
      });
    }
    
    // Verificar se é um token de teste
    const testPartnerId = findPartnerIdByToken(token);
    let partnerId: number;
    
    if (testPartnerId) {
      partnerId = testPartnerId;
    } else {
      // Verificar token no banco de dados
      const tokenQuery = `
        SELECT partner_id
        FROM towing_access_tokens
        WHERE token = $1 AND active = true
          AND (expires_at IS NULL OR expires_at > NOW())
      `;
      
      const tokenResult = await pool.query(tokenQuery, [token]);
      
      if (!tokenResult.rowCount || tokenResult.rowCount === 0) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido ou expirado'
        });
      }
      
      partnerId = tokenResult.rows[0].partner_id;
    }
    
    // Buscar serviços no banco
    const query = `
      SELECT * FROM towing_service_notes 
      WHERE partner_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [partnerId]);
    
    return res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error('[SimpleExternalAccess] Erro ao buscar serviços:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao buscar serviços',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Verificar se está tudo funcionando
simpleExternalRouter.get('/simple-external/ping', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'API de acesso externo funcionando',
    timestamp: new Date()
  });
});