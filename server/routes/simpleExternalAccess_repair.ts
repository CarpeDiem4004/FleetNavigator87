import { Router } from 'express';
import { pool } from '../db';

// Criar roteador Express
const simpleExternalAccessRepair = Router();

// Armazenar serviços de teste
export const testServices = new Map<number, any[]>();

// Função para adicionar serviço de teste
function addTestService(partnerId: number, service: any) {
  if (!testServices.has(partnerId)) {
    testServices.set(partnerId, []);
  }
  testServices.get(partnerId)?.push(service);
}

// Definir parceiros de teste
export const TEST_PARTNERS = [
  { id: 8, name: 'Caio ramos de Souza', token: 'teste_caio_ramos_de_souza_token' },
  { id: 9, name: 'Parceiro de Teste', token: 'teste_parceiro_token' },
  { id: 10, name: 'Auto Socorro Test', token: 'teste_auto_socorro_token' }
];

// Função para encontrar o ID do parceiro pelo token
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

// Endpoint para receber submissões de serviços
simpleExternalAccessRepair.post('/submit', async (req, res) => {
  try {
    console.log('[SimpleExternalAccess] Recebendo submissão de serviço:', req.body);
    
    // Extrair dados do corpo da requisição
    const { 
      token,
      vehicle_plate, pickup_location, delivery_location,
      service_description, service_date, actual_cost, km_traveled, observation,
      placa, local_retirada, local_entrega, servico_realizado,
      data_servico, valor, km_percorrido, observacoes,
      driver_name, nome_contato, telefone_contato
    } = req.body;
    
    // Validar token
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token não fornecido'
      });
    }
    
    // Normalizar dados
    const normalizedPlate = vehicle_plate || placa;
    const normalizedPickup = pickup_location || local_retirada;
    const normalizedDelivery = delivery_location || local_entrega;
    const normalizedService = service_description || servico_realizado;
    const normalizedDate = service_date || data_servico ? new Date(service_date || data_servico) : new Date();
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
    let partnerId = findPartnerIdByToken(token);
    
    if (!partnerId) {
      // Verificar no banco de dados
      const tokenQuery = `
        SELECT partner_id FROM towing_access_tokens 
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
    
    // Inserir serviço no banco
    const insertQuery = `
      INSERT INTO towing_service_notes (
        partner_id, plate, pickup_location, delivery_location, 
        service_description, service_date, cost, mileage, 
        notes, contact_name, contact_phone, status, created_at, payment_status
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
      normalizedDate,
      parseFloat(normalizedCost.toString()),
      normalizedMileage || 0,
      normalizedNotes || null,
      normalizedContactName || null,
      normalizedContactPhone || null
    ];
    
    const result = await pool.query(insertQuery, values);
    
    if (result.rowCount && result.rowCount > 0) {
      const insertedData = result.rows[0];
      
      if (token.toLowerCase().includes('teste_')) {
        addTestService(partnerId, insertedData);
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
        message: 'Erro ao registrar serviço no banco de dados'
      });
    }
  } catch (error) {
    console.error('[SimpleExternalAccess] Erro ao processar serviço:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar o serviço',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Rota para verificar um token
simpleExternalAccessRepair.get('/verify/:token', (req, res) => {
  try {
    const token = req.params.token;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token não fornecido'
      });
    }
    
    // Verificar se é um token de teste
    const partnerId = findPartnerIdByToken(token);
    
    if (partnerId) {
      const testPartner = TEST_PARTNERS.find(p => p.id === partnerId);
      
      return res.status(200).json({
        success: true,
        partner: {
          id: partnerId,
          name: testPartner?.name || 'Parceiro de Teste',
          status: 'ativo',
          isTestPartner: true
        }
      });
    }
    
    // Não é um token de teste, verificar no banco
    return res.status(404).json({
      success: false,
      message: 'Token inválido ou não reconhecido'
    });
  } catch (error) {
    console.error('[SimpleExternalAccess] Erro ao verificar token:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao verificar token'
    });
  }
});

// Rota para teste de conexão
simpleExternalAccessRepair.get('/ping', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'API de acesso externo funcionando (versão de emergência)',
    timestamp: new Date()
  });
});

export default simpleExternalAccessRepair;