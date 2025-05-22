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
        id, name, company_name, contact_person, phone, 
        address, city, region, status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'São Paulo', 'SP', 'ativo', NOW())
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

// Rota para envio de notificações de serviço (form simples)
router.post('/submit', async (req, res) => {
  try {
    console.log('[SimpleExternalAccess] Recebendo submissão de serviço:', req.body);
    
    const { token, plate, pickup, delivery, service, date, cost, mileage, notes, contactName, contactPhone } = req.body;
    
    // Validação de campos obrigatórios
    if (!token || !plate || !pickup || !delivery) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios não preenchidos',
        required: ['token', 'plate', 'pickup', 'delivery']
      });
    }
    
    // Normalização dos dados
    const normalizedPlate = plate.toString().toUpperCase().trim();
    const normalizedPickup = pickup.toString().trim();
    const normalizedDelivery = delivery.toString().trim();
    const normalizedService = service ? service.toString().trim() : 'Reboque';
    const normalizedDate = date ? new Date(date) : new Date();
    const normalizedCost = isNaN(parseFloat(cost?.toString() || '0')) ? 0 : parseFloat(cost?.toString() || '0');
    const normalizedMileage = isNaN(parseInt(mileage?.toString() || '0')) ? 0 : parseInt(mileage?.toString() || '0');
    const normalizedNotes = notes?.toString()?.trim() || '';
    const normalizedContactName = contactName?.toString()?.trim() || '';
    const normalizedContactPhone = contactPhone?.toString()?.trim() || '';
    
    // Verificar imediatamente se é um token de teste especial
    // Usamos toLowerCase() para evitar problemas com diferentes capitalizações e removemos acentos
    let tokenLower = token.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove acentos
      
    // Melhorar detecção de tokens normalizando espaços e underscores múltiplos
    tokenLower = tokenLower.replace(/_{2,}/g, '_'); // Substitui múltiplos underscores por um único
    tokenLower = tokenLower.replace(/\s+/g, '_');   // Substitui espaços por underscores
    tokenLower = tokenLower.replace(/__+/g, '_'); // Substitui múltiplos underscores por um só
    
    console.log(`[SimpleExternalAccess] Token normalizado para verificação: ${tokenLower}`);
    
    // Verificar se é um token de teste usando nossa função unificada
    const testPartnerId = findPartnerIdByToken(token);
    
    let partnerId: number;
    let partnerName: string;
    let companyName: string;
    
    if (testPartnerId) {
      // Encontrar informações do parceiro na lista de parceiros de teste
      const partnerInfo = TEST_PARTNERS.find(p => p.id === testPartnerId);
      
      if (partnerInfo) {
        console.log(`[SimpleExternalAccess] Detectado token de teste: ${token}`);
        console.log(`[SimpleExternalAccess] Parceiro de teste identificado: ${partnerInfo.name} (ID ${testPartnerId})`);
        
        // Criar parceiro no banco de dados se necessário
        await ensureTestPartnerExists(testPartnerId);
        
        partnerId = testPartnerId;
        partnerName = partnerInfo.name;
        companyName = partnerInfo.company;
      } else {
        return res.status(401).json({
          success: false,
          message: 'Token de teste inválido ou não encontrado'
        });
      }
    } else {
      // Se não for token de teste, verificar no banco de dados
      const tokenCheckQuery = `
        SELECT * FROM towing_access_tokens 
        WHERE token = $1 AND (expires_at IS NULL OR expires_at > NOW())
      `;
      
      const tokenResult = await pool.query(tokenCheckQuery, [token]);
      
      if (!tokenResult.rowCount || tokenResult.rowCount === 0) {
        console.error('[SimpleExternalAccess] Token inválido ou expirado:', token);
        return res.status(401).json({
          success: false,
          message: 'Token inválido ou expirado'
        });
      }
      
      partnerId = tokenResult.rows[0].partner_id;
      
      // Buscar dados do parceiro
      const partnerQuery = `
        SELECT name, company_name FROM towing_partners WHERE id = $1
      `;
      
      const partnerResult = await pool.query(partnerQuery, [partnerId]);
      
      if (!partnerResult.rowCount || partnerResult.rowCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Parceiro não encontrado'
        });
      }
      
      partnerName = partnerResult.rows[0].name;
      companyName = partnerResult.rows[0].company_name;
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
          
          // Adicionar o serviço à tabela servicos_guincho também 
          const syncQuery = `
            INSERT INTO servicos_guincho (
              id, parceiro_id, placa, origem, destino, 
              tipo_servico, data_lancamento, valor, km_reboque,
              observacoes, contato_nome, contato_telefone, status, data_criacao
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW()
            )
            ON CONFLICT (id) DO NOTHING
          `;
          
          try {
            await pool.query(syncQuery, [
              insertedData.id,
              partnerId,
              normalizedPlate.toUpperCase(),
              normalizedPickup,
              normalizedDelivery,
              normalizedService || "Reboque",
              normalizedDate || new Date(),
              parseFloat(normalizedCost.toString()),
              normalizedMileage || 0,
              normalizedNotes || "",
              normalizedContactName || "",
              normalizedContactPhone || "",
              'pending'
            ]);
          } catch (syncError) {
            console.error("[SimpleExternalAccess] Erro ao sincronizar com servicos_guincho:", syncError);
          }
          
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
          error: dbError.message
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
        error: dbError.message
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

// Rota para verificar se um token é válido - Usada pelo client para validação
router.get('/verify/:token', async (req, res) => {
  try {
    let { token } = req.params;
    console.log('[SimpleExternalAccess] Verificando token:', token);
    
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
    
    // Normalizar o token para comparação
    // Remove acentos
    let tokenLower = token.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
    // Substitui espaços por underscores
    tokenLower = tokenLower.replace(/\s+/g, '_');
    
    // Substitui múltiplos underscores por um só
    tokenLower = tokenLower.replace(/__+/g, '_');
    
    console.log(`[SimpleExternalAccess] Token normalizado para verificação: ${tokenLower}`);
    
    // Verificar se é um token de teste usando nossa função unificada
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
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }
    
    const tokenInfo = result.rows[0];
    
    return res.status(200).json({
      success: true,
      message: 'Token válido',
      data: {
        partnerId: tokenInfo.partner_id,
        partnerName: tokenInfo.partner_name,
        companyName: tokenInfo.company_name,
        expiresAt: tokenInfo.expires_at,
        isPermanent: !tokenInfo.expires_at
      }
    });
  } catch (error) {
    console.error('[SimpleExternalAccess] Erro ao verificar token:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao verificar token',
      error: error instanceof Error ? error.message : String(error)
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
    
    // Normalizar o token para facilitar a detecção
    let tokenLower = token.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
    tokenLower = tokenLower.replace(/_{2,}/g, '_'); // Substitui múltiplos underscores
    tokenLower = tokenLower.replace(/\s+/g, '_');   // Substitui espaços por underscores
    tokenLower = tokenLower.replace(/__+/g, '_');   // Substitui múltiplos underscores novamente
    
    console.log(`[SimpleExternalAccess/History] Token normalizado para verificação: ${tokenLower}`);
    
    // Verificar primeiro se é um token de teste
    let partnerId: number | null = null;
    let partnerName = '';
    let companyName = '';
    let isTestToken = false;
    
    // Usar nossa função unificada para encontrar parceiro por token
    const testPartnerId = findPartnerIdByToken(token);
    
    if (testPartnerId) {
      // Encontrar informações do parceiro na lista de parceiros de teste
      const partnerInfo = TEST_PARTNERS.find(p => p.id === testPartnerId);
      
      if (partnerInfo) {
        isTestToken = true;
        partnerId = testPartnerId;
        partnerName = partnerInfo.name;
        companyName = partnerInfo.company;
        
        console.log(`[SimpleExternalAccess/History] Detectado token de teste: ${token}`);
        console.log(`[SimpleExternalAccess/History] Parceiro identificado: ${partnerName} (ID ${partnerId})`);
        
        // Garantir que existem serviços para este parceiro
        await ensureTestServicesExist(partnerId);
      }
    }
    
    // Se não for token de teste, verificar no banco de dados
    if (!isTestToken) {
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
      console.log('[SimpleExternalAccess/History] Resultado da validação do token:', { 
        encontrado: tokenResult.rowCount && tokenResult.rowCount > 0, 
        token: token.substring(0, 6) + '...' 
      });
      
      if (!tokenResult.rowCount || tokenResult.rowCount === 0) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido ou expirado'
        });
      }
      
      partnerId = tokenResult.rows[0].partner_id;
      partnerName = tokenResult.rows[0].partner_name;
      companyName = tokenResult.rows[0].company_name;
    }
    
    if (!partnerId) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }
    
    console.log('[SimpleExternalAccess/History] Buscando histórico para parceiro ID:', partnerId);
    
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
    
    try {
      await pool.query(syncWithViewQuery, [partnerId]);
      console.log('[SimpleExternalAccess] Sincronização com view de serviços realizada');
    } catch (syncError) {
      console.error('[SimpleExternalAccess] Erro ao sincronizar com view:', syncError);
      // Continuar mesmo com erro na sincronização
    }
    
    const historyResult = await pool.query(historyQuery, [partnerId]);
    console.log('[SimpleExternalAccess] Serviços encontrados:', historyResult.rowCount);
    
    // Para tokens de teste, se não houver serviços no histórico, criamos alguns serviços simulados
    let services = historyResult.rows;
    if (isTestToken && (!historyResult.rowCount || historyResult.rowCount === 0)) {
      console.log('[SimpleExternalAccess] Gerando serviços simulados para token de teste');
      
      // Criar 2 serviços simulados para melhor visualização
      const mockService1 = {
        id: Math.floor(Math.random() * 10000) + 1000,
        plate: "ABC1234",
        pickup_location: "Av. Paulista, 1000, São Paulo, SP",
        delivery_location: "Rua Augusta, 500, São Paulo, SP",
        service_description: "Reboque",
        service_date: new Date(Date.now() - 86400000), // Ontem
        cost: 250.00,
        mileage: 12,
        status: "aprovado",
        payment_status: "pago",
        approved_at: new Date(Date.now() - 43200000), // 12 horas atrás
        created_at: new Date(Date.now() - 86400000), // Ontem
      };
      
      const mockService2 = {
        id: Math.floor(Math.random() * 10000) + 1000,
        plate: "DEF5678",
        pickup_location: "Av. Anhanguera, km 15, Goiânia, GO",
        delivery_location: "Rua José Alves, 456, Goiânia, GO",
        service_description: "Reboque de veículo quebrado",
        service_date: new Date(Date.now() - 172800000), // 2 dias atrás
        cost: 320.00,
        mileage: 35,
        status: "pendente",
        payment_status: "pendente",
        approved_at: null,
        created_at: new Date(Date.now() - 172800000), // 2 dias atrás
      };
      
      services = [mockService1, mockService2];
      
      // Inserir esses serviços mock no banco de dados para futura referência
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
          status,
          payment_status,
          created_at
        )
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12),
          ($1, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        ON CONFLICT DO NOTHING
        RETURNING id
      `;
      
      try {
        const insertResult = await pool.query(insertQuery, [
          partnerId,
          // Serviço 1
          "ABC1234",
          "Av. Paulista, 1000, São Paulo, SP",
          "Rua Augusta, 500, São Paulo, SP",
          "Reboque",
          new Date(Date.now() - 86400000),
          250.00,
          12,
          "Serviço simulado para teste",
          "aprovado",
          "pago",
          new Date(Date.now() - 86400000),
          // Serviço 2
          "DEF5678",
          "Av. Anhanguera, km 15, Goiânia, GO",
          "Rua José Alves, 456, Goiânia, GO",
          "Reboque de veículo quebrado",
          new Date(Date.now() - 172800000),
          320.00,
          35,
          "Serviço simulado para teste",
          "pendente",
          "pendente",
          new Date(Date.now() - 172800000)
        ]);
        
        console.log('[SimpleExternalAccess] Serviços simulados inseridos:', insertResult.rowCount);
      } catch (insertError) {
        console.error('[SimpleExternalAccess] Erro ao inserir serviços simulados:', insertError);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Histórico de serviços',
      data: {
        partnerId: partnerId,
        partnerName: partnerName,
        companyName: companyName,
        serviceCount: services.length,
        services: services
      }
    });
  } catch (error) {
    console.error('[SimpleExternalAccess] Erro ao obter histórico:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao obter histórico',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Rota para testar formulário de notificação
router.get('/form', (req, res) => {
  const { token } = req.query;
  
  let formHtml = `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notificação de Serviço - Muricion Fleet</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        margin: 0;
        padding: 20px;
        background-color: #f8f9fa;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      h1 {
        color: #0047b3;
        margin-top: 0;
        text-align: center;
      }
      .form-group {
        margin-bottom: 15px;
      }
      label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
      }
      input, textarea, select {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 16px;
      }
      button {
        background-color: #0047b3;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 4px;
        cursor: pointer;
        width: 100%;
        font-size: 16px;
        font-weight: 600;
        margin-top: 10px;
      }
      button:hover {
        background-color: #003380;
      }
      .logo {
        text-align: center;
        margin-bottom: 20px;
      }
      .logo img {
        max-width: 200px;
      }
      #result {
        margin-top: 20px;
        padding: 15px;
        border-radius: 4px;
        display: none;
      }
      .success {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }
      .error {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }
      .loading {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 3px solid rgba(255,255,255,.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s ease-in-out infinite;
        margin-right: 10px;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">
        <h2>Muricion Fleet</h2>
        <p>Sistema de Gestão de Frotas</p>
      </div>
      <h1>Notificação de Serviço</h1>
      <p>Utilize este formulário para notificar a realização de um serviço de guincho.</p>
      
      <form id="serviceForm">
        <input type="hidden" id="token" name="token" value="${token || ''}">
        
        <div class="form-group">
          <label for="plate">Placa do Veículo*</label>
          <input type="text" id="plate" name="plate" required placeholder="ABC1234">
        </div>
        
        <div class="form-group">
          <label for="pickup">Local de Retirada*</label>
          <input type="text" id="pickup" name="pickup" required placeholder="Ex: Av. Paulista, 1000, São Paulo">
        </div>
        
        <div class="form-group">
          <label for="delivery">Local de Entrega*</label>
          <input type="text" id="delivery" name="delivery" required placeholder="Ex: Oficina Central, Rua dos Mecânicos, 123">
        </div>
        
        <div class="form-group">
          <label for="service">Tipo de Serviço</label>
          <select id="service" name="service">
            <option value="Reboque">Reboque</option>
            <option value="Guincho">Guincho</option>
            <option value="Reboque de veículo quebrado">Reboque de veículo quebrado</option>
            <option value="Transporte de veículo">Transporte de veículo</option>
            <option value="Socorro mecânico">Socorro mecânico</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="date">Data do Serviço</label>
          <input type="datetime-local" id="date" name="date">
        </div>
        
        <div class="form-group">
          <label for="cost">Valor do Serviço (R$)</label>
          <input type="number" id="cost" name="cost" min="0" step="0.01" placeholder="0.00">
        </div>
        
        <div class="form-group">
          <label for="mileage">Quilometragem Percorrida</label>
          <input type="number" id="mileage" name="mileage" min="0" placeholder="0">
        </div>
        
        <div class="form-group">
          <label for="contactName">Nome do Contato</label>
          <input type="text" id="contactName" name="contactName" placeholder="Nome da pessoa que solicitou o serviço">
        </div>
        
        <div class="form-group">
          <label for="contactPhone">Telefone do Contato</label>
          <input type="text" id="contactPhone" name="contactPhone" placeholder="(11) 98765-4321">
        </div>
        
        <div class="form-group">
          <label for="notes">Observações</label>
          <textarea id="notes" name="notes" rows="3" placeholder="Informações adicionais sobre o serviço..."></textarea>
        </div>
        
        <button type="submit" id="submitBtn">Enviar Notificação</button>
      </form>
      
      <div id="result"></div>
    </div>
    
    <script>
      document.getElementById('serviceForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const resultDiv = document.getElementById('result');
        const submitBtn = document.getElementById('submitBtn');
        const originalBtnText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<span class="loading"></span> Enviando...';
        submitBtn.disabled = true;
        
        const formData = {
          token: document.getElementById('token').value,
          plate: document.getElementById('plate').value,
          pickup: document.getElementById('pickup').value,
          delivery: document.getElementById('delivery').value,
          service: document.getElementById('service').value,
          date: document.getElementById('date').value,
          cost: document.getElementById('cost').value,
          mileage: document.getElementById('mileage').value,
          contactName: document.getElementById('contactName').value,
          contactPhone: document.getElementById('contactPhone').value,
          notes: document.getElementById('notes').value
        };
        
        try {
          const response = await fetch('/api/towing/simple-external/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
          });
          
          const data = await response.json();
          
          resultDiv.style.display = 'block';
          
          if (response.ok) {
            resultDiv.className = 'success';
            resultDiv.innerHTML = '<h3>Serviço registrado com sucesso!</h3>' +
              '<p>O serviço foi enviado e será analisado pela equipe da Muricion.</p>' +
              '<p>Número de protocolo: <strong>' + data.requestId + '</strong></p>';
            document.getElementById('serviceForm').reset();
          } else {
            resultDiv.className = 'error';
            resultDiv.innerHTML = '<h3>Erro ao enviar notificação</h3>' +
              '<p>' + (data.message || 'Ocorreu um erro ao processar sua solicitação.') + '</p>';
          }
        } catch (error) {
          resultDiv.style.display = 'block';
          resultDiv.className = 'error';
          resultDiv.innerHTML = '<h3>Erro de conexão</h3>' +
            '<p>Não foi possível enviar sua notificação. Verifique sua conexão com a internet e tente novamente.</p>';
          console.error('Erro:', error);
        } finally {
          submitBtn.innerHTML = originalBtnText;
          submitBtn.disabled = false;
        }
      });
      
      // Set default date to current date/time
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      document.getElementById('date').value = now.toISOString().slice(0, 16);
    </script>
  </body>
  </html>
  `;
  
  res.send(formHtml);
});

export default router;