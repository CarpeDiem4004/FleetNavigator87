import { Router } from 'express';
import { pool } from '../db.js';

const emergencyRouter = Router();

// Rota para registrar serviço de emergência
emergencyRouter.post('/submit', async (req, res) => {
  try {
    const {
      token,
      partner_id,
      vehicle_plate,
      pickup_location,
      drop_off_location,
      service_description,
      service_date,
      actual_cost,
      km_traveled,
      observation,
      driver_name
    } = req.body;

    console.log('[EmergencyRouter] Recebendo solicitação de serviço:', {
      token,
      partner_id,
      vehicle_plate,
      pickup_location,
      drop_off_location,
      service_description,
      service_type: 'guincho',
      driver_name,
      service_date,
      actual_cost,
      km_traveled,
      observation
    });

    // Verificar token e obter partner_id
    let partnerId = partner_id;
    
    if (token) {
      console.log('[EmergencyRouter] Token recebido para registro:', token);
      const tokenLower = token.toLowerCase();
      console.log('[EmergencyRouter] Token em lowercase:', tokenLower);
      
      // Mapeamento de tokens para partner IDs (mesmo do endpoint de histórico)
      const tokenMapping: Record<string, number> = {
        'teste_allan_de_souza_vieira_token': 15,
        'allan_permanente_2025_token': 15,
        'teste_claudio_de_oliveira_silva_token': 9,
        'parceiro_9_permanente_2025_token': 9,
        'teste_caio_ramos_de_souza_token': 8,
        'teste_caio_ramos_de_souza__token': 8,  // com duplo underscore
        'parceiro_8_permanente_2025_token': 8,
        'teste_daiane_do_vale_amaral_token': 10,
        'teste_daiane_do_vale_amaral__token': 10,  // com duplo underscore
        'parceiro_10_permanente_2025_token': 10, // Daiane do Vale Amaral
        'teste_gilson_fernandes_gonçalves_token': 11,
        'teste_gilson_fernandes_gonçalves__token': 11,  // com duplo underscore
        'parceiro_11_permanente_2025_token': 11, // Gilson Fernandes Gonçalves
        'ford_permanente_2025_token': 1,
        'chevrolet_permanente_2025_token': 2,
        'volkswagen_permanente_2025_token': 3,
        'parceiro_12_permanente_2025_token': 12, // Fluxo Guinchos
        'parceiro_5_permanente_2025_token': 5,   // Guincho Águia
        'parceiro_7_permanente_2025_token': 7,   // Rafael Abner Transporte
        'teste_gilson_fernandes_gonçalves': 16,
        'teste_deloes_guinchos_e_munck_token': 11,
        'teste_deloes_guinchos_e_munck__token': 11  // com duplo underscore
      };
      
      partnerId = tokenMapping[tokenLower];
      
      console.log('[EmergencyRouter] Debug token mapping:', {
        tokenLower,
        availableTokens: Object.keys(tokenMapping).filter(t => t.includes('deloes')),
        foundPartnerId: partnerId
      });
      
      if (partnerId) {
        console.log(`[EmergencyRouter] Serviço sendo criado para parceiro ID: ${partnerId}`);
      }
    }
    
    if (!partnerId) {
      console.log('[EmergencyRouter] Token não reconhecido no registro:', token);
      return res.status(404).json({ success: false, message: "Token não reconhecido" });
    }
    
    // Inserir serviço no banco
    const insertQuery = `
      INSERT INTO towing_partner_services (
        partner_id, plate, origin, destination, 
        service_type, service_date, cost, km_traveled, 
        notes, driver_name, status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', NOW())
      RETURNING *
    `;
    
    const values = [
      partnerId,
      vehicle_plate?.toUpperCase() || '',
      pickup_location || '',
      drop_off_location || '',
      'guincho',
      service_date,
      parseFloat(actual_cost?.toString() || '0'),
      parseInt(km_traveled?.toString() || '0'),
      observation || '',
      driver_name || ''
    ];
    
    const result = await pool.query(insertQuery, values);
    
    if (result.rowCount && result.rowCount > 0) {
      const insertedData = result.rows[0];
      console.log('[EmergencyRouter] Serviço registrado com sucesso. ID:', insertedData.id);
      
      return res.status(200).json({
        success: true,
        message: "Serviço registrado com sucesso",
        data: {
          id: insertedData.id,
          plate: vehicle_plate,
          status: "pending"
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Erro ao registrar serviço"
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

// Rota para buscar histórico
emergencyRouter.get('/history/:token', async (req, res) => {
  try {
    const { token } = req.params;
    console.log('[EmergencyRouter] Buscando histórico para token:', token);
    
    let partnerId;
    const tokenLower = token.toLowerCase();
    
    console.log('[EmergencyRouter] Token recebido:', token);
    console.log('[EmergencyRouter] Token em lowercase:', tokenLower);
    
    // Mapeamento de tokens para partner IDs
    const tokenMapping: Record<string, number> = {
      'teste_allan_de_souza_vieira_token': 15,
      'allan_permanente_2025_token': 15,
      'teste_claudio_de_oliveira_silva_token': 9,
      'parceiro_9_permanente_2025_token': 9,
      'teste_caio_ramos_de_souza_token': 8,
      'teste_caio_ramos_de_souza__token': 8,  // com duplo underscore
      'parceiro_8_permanente_2025_token': 8,
      'teste_daiane_do_vale_amaral_token': 10,
      'teste_daiane_do_vale_amaral__token': 10,  // com duplo underscore
      'parceiro_10_permanente_2025_token': 10, // Daiane do Vale Amaral
      'teste_gilson_fernandes_gonçalves_token': 11,
      'teste_gilson_fernandes_gonçalves__token': 11,  // com duplo underscore
      'parceiro_11_permanente_2025_token': 11, // Gilson Fernandes Gonçalves
      'ford_permanente_2025_token': 1,
      'chevrolet_permanente_2025_token': 2,
      'volkswagen_permanente_2025_token': 3,
      'parceiro_12_permanente_2025_token': 12, // Fluxo Guinchos
      'parceiro_5_permanente_2025_token': 5,   // Guincho Águia
      'parceiro_7_permanente_2025_token': 7,   // Rafael Abner Transporte
      'teste_gilson_fernandes_gonçalves': 16,
      'teste_deloes_guinchos_e_munck_token': 11,
      'teste_deloes_guinchos_e_munck__token': 11  // com duplo underscore
    };
    
    partnerId = tokenMapping[tokenLower];
    
    if (partnerId) {
      console.log(`[EmergencyRouter] Token reconhecido para parceiro ID: ${partnerId}`);
    }
    
    console.log('[EmergencyRouter] Partner ID encontrado:', partnerId);
    
    if (!partnerId) {
      return res.status(404).json({ success: false, message: "Token não reconhecido" });
    }
    
    const query = `
      SELECT * FROM towing_partner_services 
      WHERE partner_id = $1 
      ORDER BY service_date DESC, created_at DESC
    `;
    
    const result = await pool.query(query, [partnerId]);
    console.log('[EmergencyRouter] Buscando serviços para parceiro ID:', partnerId);
    console.log('[EmergencyRouter] Serviços encontrados:', result.rows.length);
    
    return res.status(200).json({
      success: true,
      services: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('[EmergencyRouter] Erro ao buscar histórico:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar histórico'
    });
  }
});

export default emergencyRouter;