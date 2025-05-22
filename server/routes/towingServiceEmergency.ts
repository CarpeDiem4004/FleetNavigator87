import { Router } from 'express';
import { pool } from '../db';

/**
 * Rotas de emergência para o sistema de parceiros de guincho
 * Criadas para contornar problemas no módulo simpleExternalAccess.ts
 */
const emergencyRouter = Router();

// Rota para registro de serviços
emergencyRouter.post('/submit', async (req, res) => {
  try {
    console.log('[EmergencyRouter] Recebendo solicitação de serviço:', req.body);
    
    // Extrair dados do corpo da requisição
    const { 
      token,
      // Campos em inglês
      vehicle_plate, pickup_location, delivery_location,
      service_description, service_date, actual_cost, km_traveled, observation,
      driver_name, 
      // Campos em português
      placa, local_retirada, local_entrega, servico_realizado,
      data_servico, valor, km_percorrido, observacoes,
      nome_contato, telefone_contato
    } = req.body;
    
    // Normalizar dados
    const normalizedPlate = vehicle_plate || placa || '';
    const normalizedPickup = pickup_location || local_retirada || '';
    const normalizedDelivery = delivery_location || local_entrega || '';
    const normalizedService = service_description || servico_realizado || 'Reboque';
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
    
    // Para token de teste do Caio Ramos
    let partnerId = 8; // Default para Caio Ramos (teste)
    
    if (token && token.toLowerCase() !== 'teste_caio_ramos_de_souza_token') {
      // Verificar token no banco de dados
      try {
        const tokenQuery = `
          SELECT partner_id FROM towing_access_tokens 
          WHERE token = $1 AND active = true
        `;
        
        const tokenResult = await pool.query(tokenQuery, [token]);
        
        if (tokenResult.rowCount && tokenResult.rowCount > 0) {
          partnerId = tokenResult.rows[0].partner_id;
        }
      } catch (tokenError) {
        console.error('[EmergencyRouter] Erro ao verificar token, usando ID padrão:', tokenError);
      }
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
      normalizedPlate.toUpperCase(),
      normalizedPickup,
      normalizedDelivery,
      normalizedService,
      normalizedDate,
      parseFloat(normalizedCost.toString()),
      parseInt(normalizedMileage.toString()),
      normalizedNotes,
      normalizedContactName,
      normalizedContactPhone
    ];
    
    const result = await pool.query(insertQuery, values);
    
    if (result.rowCount && result.rowCount > 0) {
      const insertedData = result.rows[0];
      
      // Opcional: tentar sincronizar com a tabela servicos_guincho
      try {
        const syncQuery = `
          INSERT INTO servicos_guincho (
            id, parceiro_id, placa, origem, destino, 
            tipo_servico, data_lancamento, valor, km_reboque,
            observacoes, contato_nome, contato_telefone, status, data_criacao
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()
          )
          ON CONFLICT (id) DO NOTHING
        `;
        
        await pool.query(syncQuery, [
          insertedData.id,
          partnerId,
          normalizedPlate.toUpperCase(),
          normalizedPickup,
          normalizedDelivery,
          normalizedService,
          normalizedDate,
          parseFloat(normalizedCost.toString()),
          parseInt(normalizedMileage.toString()),
          normalizedNotes,
          normalizedContactName,
          normalizedContactPhone,
          'pending'
        ]);
      } catch (syncError) {
        console.error('[EmergencyRouter] Erro ao sincronizar com servicos_guincho:', syncError);
        // Ignorar erro de sincronização, o registro principal já foi salvo
      }
      
      return res.status(201).json({
        success: true,
        message: 'Serviço registrado com sucesso',
        data: insertedData
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Erro ao registrar serviço no banco de dados'
      });
    }
  } catch (error) {
    console.error('[EmergencyRouter] Erro ao processar serviço:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar o serviço',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Verificação de token (versão simplificada)
emergencyRouter.get('/verify/:token', (req, res) => {
  const token = req.params.token;
  
  if (token && token.toLowerCase() === 'teste_caio_ramos_de_souza_token') {
    return res.status(200).json({
      success: true,
      partner: {
        id: 8,
        name: 'Caio ramos de Souza',
        status: 'ativo',
        isTestPartner: true
      }
    });
  }
  
  return res.status(200).json({
    success: true,
    message: 'Verificação de token via rota de emergência'
  });
});

// Rota para teste de conexão
emergencyRouter.get('/ping', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Rota de emergência para parceiros de guincho funcionando',
    timestamp: new Date()
  });
});

export default emergencyRouter;