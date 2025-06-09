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
      
      // Buscar parceiro pelo token
      if (tokenLower === 'teste_allan_de_souza_vieira_token') {
        partnerId = 15;
        console.log('[EmergencyRouter] Serviço sendo criado para Allan de Souza Vieira (ID: 15)');
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
    if (token.toLowerCase() === 'teste_allan_de_souza_vieira_token') {
      partnerId = 15;
    }
    
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