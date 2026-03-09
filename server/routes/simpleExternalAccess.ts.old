/**
 * Rotas para acesso externo simplificado de parceiros de guincho
 * Permite que parceiros enviem informações de serviços realizados
 * através de links externos sem necessidade de login
 */

import express from 'express';
import { pool } from '../db';

const router = express.Router();

// Armazenamento temporário de serviços de teste (apenas em memória)
// Estrutura: { partnerId: [serviços] }
export const testServices = new Map<number, any[]>();

// Função para adicionar um novo serviço de teste
function addTestService(partnerId: number, service: any) {
  if (!testServices.has(partnerId)) {
    testServices.set(partnerId, []);
  }
  const services = testServices.get(partnerId);
  services?.push(service);
  
  // Limitar a 20 serviços por parceiro para evitar consumo excessivo de memória
  if (services && services.length > 20) {
    services.shift(); // Remove o mais antigo
  }
}

// Função para acessar os serviços de teste de um parceiro específico
export function getTestServices(partnerId: number) {
  return testServices.get(partnerId) || [];
}

// Lista de parceiros de teste para facilitar a geração de dados e a consistência
export const TEST_PARTNERS = [
  { id: 5, name: "Guincho Águia", company: "Guincho Águia LTDA", tokens: ["teste_guincho_aguia_token"] },
  { id: 6, name: "Ford", company: "Ford Serviços de Guincho Ltda", tokens: ["teste_ford_token"] },
  { id: 8, name: "Caio Ramos de Souza", company: "Ramos Guincho Express", tokens: ["teste_caio_ramos_de_souza_token"] },
  { id: 9, name: "Claudio de Oliveira Silva", company: "Oliveira Auto Socorro", tokens: ["teste_claudio_de_oliveira_token"] },
  { id: 10, name: "Daiane do Vale Amaral", company: "Vale Serviços de Guincho", tokens: ["teste_daiane_do_vale_token"] },
  { id: 11, name: "Delões Guinchos e Munck", company: "Delões Guinchos e Munck LTDA", tokens: ["teste_deloes_guinchos_token"] },
  { id: 12, name: "Fluxo Guinchos", company: "Fluxo Guinchos e Serviços LTDA", tokens: ["teste_fluxo_guinchos_token"] },
  { id: 15, name: "Allan de Souza Vieira", company: "Vieira Serviços Automotivos", tokens: ["teste_allan_de_souza_vieira_token"] }
];

// Função para encontrar o ID do parceiro pelo token
function findPartnerIdByToken(token: string): number | null {
  const normalizedToken = token.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/_{2,}/g, '_')
    .replace(/\s+/g, '_')
    .replace(/__+/g, '_');
  
  for (const partner of TEST_PARTNERS) {
    // Verificar tokens exatos
    if (partner.tokens.some(t => normalizedToken === t.toLowerCase())) {
      return partner.id;
    }
    
    // Verificar correspondências parciais de nomes no token
    const partnerNameNormalized = partner.name.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '_');
    
    if (normalizedToken.includes(partnerNameNormalized) || 
        normalizedToken.includes(partner.name.toLowerCase().split(' ')[0])) {
      return partner.id;
    }
  }
  
  return null;
}

// Função para verificar e criar o parceiro de teste no banco de dados
async function ensureTestPartnerExists(partnerId: number): Promise<boolean> {
  try {
    // Verificar se o parceiro já existe
    const checkQuery = `
      SELECT COUNT(*) as count 
      FROM towing_partners 
      WHERE id = $1
    `;
    
    const checkResult = await pool.query(checkQuery, [partnerId]);
    const partnerExists = parseInt(checkResult.rows[0].count, 10) > 0;
    
    if (partnerExists) {
      console.log(`[TestServices] Parceiro ID ${partnerId} já existe no banco de dados.`);
      return true;
    }
    
    // Buscar informações do parceiro
    const partnerInfo = TEST_PARTNERS.find(p => p.id === partnerId);
    if (!partnerInfo) {
      console.log(`[TestServices] Não foi possível encontrar informações para o parceiro ID ${partnerId}.`);
      return false;
    }
    
    console.log(`[TestServices] Criando parceiro de teste ID ${partnerId} (${partnerInfo.name})...`);
    
    // Inserir o parceiro no banco de dados
    const insertQuery = `
      INSERT INTO towing_partners (
        id, name, company_name, contact_name, contact_phone, 
        address, created_at, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), true)
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    `;
    
    const insertResult = await pool.query(insertQuery, [
      partnerId,
      partnerInfo.name,
      partnerInfo.company,
      `Contato ${partnerInfo.name}`,
      '11999999999',
      'Endereço não disponível'
    ]);
    
    if (insertResult.rowCount && insertResult.rowCount > 0) {
      console.log(`[TestServices] Parceiro ID ${partnerId} criado com sucesso.`);
      return true;
    } else {
      console.log(`[TestServices] Parceiro ID ${partnerId} já existia ou não pôde ser criado.`);
      return partnerExists;
    }
  } catch (error) {
    console.error(`[TestServices] Erro ao verificar/criar parceiro ID ${partnerId}:`, error);
    return false;
  }
}

// Função para gerar serviços de teste para um parceiro específico
async function ensureTestServicesExist(partnerId: number): Promise<void> {
  try {
    // Primeiro, garantir que o parceiro existe
    const partnerExists = await ensureTestPartnerExists(partnerId);
    if (!partnerExists) {
      console.log(`[TestServices] Não foi possível criar serviços para parceiro ID ${partnerId} pois ele não existe.`);
      return;
    }
    
    // Verificar se já existem serviços para este parceiro no banco de dados
    const checkQuery = `
      SELECT COUNT(*) as count 
      FROM towing_service_notes 
      WHERE partner_id = $1
    `;
    
    const checkResult = await pool.query(checkQuery, [partnerId]);
    const serviceCount = parseInt(checkResult.rows[0].count, 10);
    
    // Se já existirem serviços, não precisamos criar novos
    if (serviceCount > 0) {
      console.log(`[TestServices] Parceiro ID ${partnerId} já possui ${serviceCount} serviços no banco de dados.`);
      return;
    }
    
    console.log(`[TestServices] Criando serviços de teste para parceiro ID ${partnerId}...`);
    
    // Buscar informações do parceiro
    const partnerInfo = TEST_PARTNERS.find(p => p.id === partnerId);
    const partnerName = partnerInfo ? partnerInfo.name : `Parceiro ID ${partnerId}`;
    // Dados para serviços de teste variados
    const plates = ['ABC1234', 'DEF5678', 'GHI9012', 'JKL3456', 'MNO7890'];
    const pickupLocations = [
      'Av. Paulista, 1000, São Paulo, SP',
      'Rua Augusta, 500, São Paulo, SP',
      'Av. Anhanguera, km 15, Goiânia, GO',
      'Rod. Pres. Dutra, km 230, São José dos Campos, SP',
      'Av. Brasil, 2500, Rio de Janeiro, RJ'
    ];
    const deliveryLocations = [
      'Oficina Central, Rua dos Mecânicos, 123, São Paulo, SP',
      'Concessionária AutoStar, Av. Rebouças, 789, São Paulo, SP',
      'Centro Automotivo Silva, Rua da Industria, 456, Campinas, SP',
      'Estacionamento Shopping Center, Av. Comercial, 1000, Rio de Janeiro, RJ',
      'Base Muricion Logística, Rua Transportadora, 555, Guarulhos, SP'
    ];
    const serviceTypes = ['Reboque', 'Guincho', 'Reboque de veículo quebrado', 'Transporte de veículo', 'Socorro mecânico'];
    const statuses = ['aprovado', 'pendente', 'rejeitado'];
    const paymentStatuses = ['pago', 'pendente', 'cancelado'];
    
    // Criar entre 2 e 4 serviços para cada parceiro
    const numServices = Math.floor(Math.random() * 3) + 2; // 2 a 4 serviços
    const insertValues = [];
    const insertParams = [];
    
    for (let i = 0; i < numServices; i++) {
      const randomDays = Math.floor(Math.random() * 30) + 1; // 1 a 30 dias atrás
      const serviceDate = new Date(Date.now() - (randomDays * 86400000));
      const createdAt = new Date(serviceDate.getTime() - (Math.random() * 86400000)); // Criado antes da data do serviço
      
      const plate = plates[Math.floor(Math.random() * plates.length)];
      const pickup = pickupLocations[Math.floor(Math.random() * pickupLocations.length)];
      const delivery = deliveryLocations[Math.floor(Math.random() * deliveryLocations.length)];
      const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const paymentStatus = status === 'aprovado' ? 
        paymentStatuses[Math.floor(Math.random() * 2)] : // só pode ser pago ou pendente se aprovado
        'pendente';
      
      const kmDistance = Math.floor(Math.random() * 50) + 5; // 5 a 55 km
      const baseCost = 150;
      const costPerKm = 3.5;
      const serviceCost = baseCost + (kmDistance * costPerKm);
      
      // Aprovado há algumas horas atrás se o status for aprovado
      const approvedAt = status === 'aprovado' ? 
        new Date(serviceDate.getTime() + (Math.random() * 43200000)) : // até 12h depois
        null;
      
      insertValues.push(`($${insertParams.length + 1}, $${insertParams.length + 2}, $${insertParams.length + 3}, 
                           $${insertParams.length + 4}, $${insertParams.length + 5}, $${insertParams.length + 6}, 
                           $${insertParams.length + 7}, $${insertParams.length + 8}, $${insertParams.length + 9}, 
                           $${insertParams.length + 10}, $${insertParams.length + 11}, $${insertParams.length + 12},
                           $${insertParams.length + 13})`);
                           
      insertParams.push(
        partnerId,           // partner_id
        plate,               // plate
        pickup,              // pickup_location
        delivery,            // delivery_location
        serviceType,         // service_description
        serviceDate,         // service_date
        serviceCost,         // cost
        kmDistance,          // mileage
        `Serviço de teste para ${partnerName}`, // notes
        status,              // status
        paymentStatus,       // payment_status
        approvedAt,          // approved_at
        createdAt            // created_at
      );
    }
    
    // Inserir todos os serviços de uma vez
    const insertQuery = `
      INSERT INTO towing_service_notes (
        partner_id, plate, pickup_location, delivery_location, 
        service_description, service_date, cost, mileage, notes,
        status, payment_status, approved_at, created_at
      )
      VALUES ${insertValues.join(', ')}
      ON CONFLICT DO NOTHING
      RETURNING id
    `;
    
    const insertResult = await pool.query(insertQuery, insertParams);
    console.log(`[TestServices] Criados ${insertResult.rowCount} serviços de teste para parceiro ID ${partnerId}.`);
    
    // Sincronizar com a tabela de serviços guincho para garantir visibilidade em todas as views
    try {
      const syncQuery = `
        INSERT INTO servicos_guincho (
          id, parceiro_id, placa, origem, destino, 
          tipo_servico, data_lancamento, valor, km_reboque, 
          observacoes, status, data_aprovacao
        )
        SELECT 
          id, partner_id, plate, pickup_location, delivery_location,
          service_description, service_date, cost, mileage,
          notes, status, approved_at
        FROM towing_service_notes 
        WHERE partner_id = $1
        ON CONFLICT (id) DO NOTHING
      `;
      
      await pool.query(syncQuery, [partnerId]);
      console.log(`[TestServices] Serviços sincronizados com a tabela de serviços guincho para parceiro ID ${partnerId}.`);
    } catch (syncError) {
      console.error(`[TestServices] Erro ao sincronizar serviços para parceiro ID ${partnerId}:`, syncError);
    }
  } catch (error) {
    console.error(`[TestServices] Erro ao criar serviços de teste para parceiro ID ${partnerId}:`, error);
  }
}

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

    // Normalizar campos para permitir qualquer formato de API
    const normalizedPlate = vehicle_plate || placa || '';
    const normalizedPickup = pickup_location || local_retirada || '';
    const normalizedDelivery = delivery_location || drop_off_location || local_entrega || '';
    const normalizedService = service_description || servico_realizado || '';
    const normalizedDate = service_date || data_servico || '';
    const normalizedCost = actual_cost || valor || 0;
    const normalizedMileage = km_traveled || km_percorrido || 0;
    const normalizedNotes = observation || observacoes || '';
    const normalizedContactName = driver_name || nome_contato || '';
    const normalizedContactPhone = driver_phone || telefone_contato || '';

    console.log('[SimpleExternalAccess] Campos normalizados:', {
      vehicle: normalizedPlate,
      pickup: normalizedPickup,
      delivery: normalizedDelivery,
      cost: normalizedCost,
      token: token
    });

    // Debugging para entender o problema
    console.log('[SimpleExternalAccess] Valores originais dos campos críticos:', {
      token_original: token,
      placa_original: placa,
      vehicle_plate_original: vehicle_plate,
      pickup_original: pickup_location,
      local_retirada_original: local_retirada,
      delivery_original: delivery_location,
      local_entrega_original: local_entrega,
      valor_original: valor,
      actual_cost_original: actual_cost
    });

    // Simplificar validação - testes manuais indicam um problema com a validação anterior
    const validToken = !!token;
    const validPlate = !!normalizedPlate;
    const validPickup = !!normalizedPickup;
    const validDelivery = !!normalizedDelivery;
    const validCost = normalizedCost > 0;

    if (!validToken || !validPlate || !validPickup || !validDelivery || !validCost) {
      console.error('[SimpleExternalAccess] Erro de validação simplificada:', { 
        validToken,
        validPlate,
        validPickup,
        validDelivery,
        validCost
      });
      
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios não informados: token, placa, locais de retirada/entrega, e valor'
      });
    }

    // Normalizar o token para detecção
    let tokenLower = token.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Melhorar detecção de tokens normalizando espaços e underscores múltiplos
    tokenLower = tokenLower.replace(/_{2,}/g, '_'); // Substitui múltiplos underscores por um único
    tokenLower = tokenLower.replace(/\s+/g, '_');   // Substitui espaços por underscores
    tokenLower = tokenLower.replace(/__+/g, '_');   // Substitui múltiplos underscores por um só (segunda verificação)
    
    // Verificação simplificada para tokens de teste - mesma verificação usada na rota /verify
    let partnerId = null;
    let partnerName = '';
    let companyName = '';
    
    // Verificar se é um token de teste
    if (tokenLower.includes('allan') || 
        tokenLower.includes('caio') || 
        tokenLower.includes('claudio') || 
        tokenLower.includes('daiane') || 
        tokenLower.includes('deloes') || 
        tokenLower.includes('fluxo_guinchos')) {
      
      console.log('[SimpleExternalAccess] Detectado token de teste na submissão:', token);
      
      // Determinar o parceiro com base no token
      if (tokenLower.includes('allan')) {
        partnerId = 15;
        partnerName = "Allan de Souza Vieira";
        companyName = "Vieira Serviços Automotivos";
      } else if (tokenLower.includes('caio')) {
        partnerId = 16;
        partnerName = "Caio Ramos de Souza";
        companyName = "Ramos Guincho Express";
      } else if (tokenLower.includes('claudio')) {
        partnerId = 17;
        partnerName = "Claudio de Oliveira Silva";
        companyName = "Oliveira Auto Socorro";
      } else if (tokenLower.includes('daiane')) {
        partnerId = 10;
        partnerName = "Daiane do Vale Amaral";
        companyName = "Vale Serviços de Guincho";
      } else if (tokenLower.includes('deloes')) {
        partnerId = 11;
        partnerName = "Delões Guinchos e Munck";
        companyName = "Delões Guinchos e Munck LTDA";
      } else if (tokenLower.includes('fluxo')) {
        partnerId = 12;
        partnerName = "Fluxo Guinchos";
        companyName = "Fluxo Guinchos e Serviços LTDA";
      }
      
      console.log('[SimpleExternalAccess] Identificado parceiro para token de teste:', { 
        partnerId, 
        partnerName
      });
    } else {
      // Se não for token de teste, verificar no banco de dados
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
      
      partnerId = tokenResult.rows[0].partner_id;
    }
    
    console.log('[SimpleExternalAccess] Token válido para parceiro ID:', partnerId);
    
    // Para tokens de teste, devolvemos uma resposta simulada em vez de tentar inserir no banco
    // Verificando novamente para garantir que tokens de teste sejam processados corretamente
    if (token.toLowerCase().includes('teste_') ||
        tokenLower.includes('allan') || 
        tokenLower.includes('caio') || 
        tokenLower.includes('claudio') || 
        tokenLower.includes('daiane') || 
        tokenLower.includes('deloes') || 
        tokenLower.includes('fluxo_guinchos')) {
      
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
        console.log('[SimpleExternalAccess] Salvando serviço de teste no banco de dados com valores:', values);
        const result = await pool.query(insertQuery, values);
        
        // Atualizar o mockService com o ID real do banco de dados
        mockService.id = result.rows[0].id;
        
        console.log(`[SimpleExternalAccess] Serviço de teste ID:${result.rows[0].id} salvo no banco para parceiro ID:${partnerId}`);
        
        // Também salvar no armazenamento temporário para compatibilidade
        addTestService(partnerId, mockService);
        
        return res.status(201).json({
          success: true,
          message: 'Serviço registrado com sucesso (modo de teste)',
          data: mockService
        });
      } catch (insertError) {
        console.error('[SimpleExternalAccess] Erro ao salvar serviço de teste no banco:', insertError);
        
        // Fallback para o comportamento anterior
        addTestService(partnerId, mockService);
        
        return res.status(201).json({
          success: true,
          message: 'Serviço registrado com sucesso (modo de teste - apenas memória)',
          data: mockService
        });
      }
    }
    
    // Para tokens reais, registrar efetivamente no banco de dados
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
    
    // Verificação para tokens de teste usando nossa função unificada
    const testPartnerId = findPartnerIdByToken(token);
    
    if (testPartnerId) {
      // Encontrar informações do parceiro na lista de parceiros de teste
      const partnerInfo = TEST_PARTNERS.find(p => p.id === testPartnerId);
      
      if (partnerInfo) {
        console.log(`[SimpleExternalAccess] Detectado token de teste: ${token}`);
        console.log(`[SimpleExternalAccess] Parceiro de teste identificado: ${partnerInfo.name} (ID ${testPartnerId})`);
        
        // Garantir que existem serviços para este parceiro
        await ensureTestServicesExist(testPartnerId);
        
        return res.status(200).json({
          success: true,
          message: 'Token válido (modo de teste)',
          data: {
            partnerId: testPartnerId,
            partnerName: partnerInfo.name,
            companyName: partnerInfo.company,
            expiresAt: null,
            isPermanent: true
          }
        });
      }
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
// Inicializar serviços de teste para todos os parceiros
async function initializeTestServices() {
  console.log('[TestServices] Inicializando serviços de teste para todos os parceiros...');
  for (const partner of TEST_PARTNERS) {
    await ensureTestServicesExist(partner.id);
  }
  console.log('[TestServices] Inicialização de serviços de teste concluída.');
}

// Executar a inicialização em segundo plano sem bloquear o servidor
setTimeout(async () => {
  try {
    await initializeTestServices();
  } catch (error) {
    console.error('[TestServices] Erro na inicialização de serviços de teste:', error);
  }
}, 5000); // Aguardar 5 segundos após o início do servidor

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
        
      // Utilizar nossa função centralizada para detectar parceiros de teste
      const testPartnerId = findPartnerIdByToken(token);
      
      if (testPartnerId) {
        // Buscar informações do parceiro na nossa lista de parceiros de teste
        const partnerInfo = TEST_PARTNERS.find(p => p.id === testPartnerId);
        
        if (partnerInfo) {
          console.log(`[SimpleExternalAccess/History] Detectado token de teste: ${token}`);
          console.log(`[SimpleExternalAccess/History] Parceiro identificado: ${partnerInfo.name} (ID ${testPartnerId})`);
          
          partnerId = testPartnerId;
          partnerName = partnerInfo.name;
          companyName = partnerInfo.company;
          
          // Garantir que existem serviços para este parceiro
          await ensureTestServicesExist(partnerId);
        } else {
          return res.status(401).json({
            success: false,
            message: 'Token inválido ou expirado'
          });
        }
      } else {
        return res.status(401).json({
          success: false,
          message: 'Token inválido ou expirado'
        });
      }
        
        // Verificar se temos serviços simulados salvos para este parceiro
        let demoServices = testServices.get(partnerId) || [];
        
        // Se não tivermos serviços salvos, criar alguns exemplos padrão
        if (demoServices.length === 0) {
        demoServices = [
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
      }
      
      console.log(`[SimpleExternalAccess] Retornando ${demoServices.length} serviços simulados para parceiro ID: ${partnerId}`);
        
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
    
    // Sincronizar com a view de serviços para garantir consistência
    const syncWithViewQuery = `
      INSERT INTO servicos_guincho (
        id, parceiro_id, placa, origem, destino, 
        tipo_servico, data_lancamento, valor, km_percorrido, 
        observacoes, status, prioridade
      )
      SELECT 
        id, partner_id, plate, pickup_location, delivery_location,
        service_description, service_date, cost, mileage,
        notes, status, priority
      FROM towing_service_notes 
      WHERE partner_id = $1
      ON CONFLICT (id) DO NOTHING
    `;
    
    try {
      await pool.query(syncWithViewQuery, [partnerId]);
      console.log('[SimpleExternalAccess] Sincronização com view de serviços realizada');
    } catch (syncError) {
      console.error('[SimpleExternalAccess] Erro ao sincronizar com view:', syncError);
      // Continuar mesmo com erro na sincronização
    }
    
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