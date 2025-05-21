/**
 * Rotas para gerenciamento financeiro de serviços de guincho
 */

import express, { Request, Response } from 'express';
import { pool } from '../db';
import { unifiedAuthMiddleware, requireRoles } from '../utils/auth-utils';
import { getTestServices } from './simpleExternalAccess';

const router = express.Router();

// Listar todos os serviços de guincho para pagamento
router.get('/services', unifiedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { status, partner_id, payment_status, date_from, date_to, include_test } = req.query;
    
    let query = `
      SELECT 
        ts.*, 
        tp.name as partner_name, 
        tp.company_name,
        (CASE 
          WHEN ts.payment_date IS NOT NULL THEN true 
          ELSE false 
        END) as is_paid
      FROM towing_services ts
      JOIN towing_partners tp ON ts.partner_id = tp.id
      WHERE 1=1
    `;
    
    const queryParams: any[] = [];
    let paramCount = 1;
    
    // Filtrar por status
    if (status) {
      query += ` AND ts.status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }
    
    // Filtrar por parceiro
    if (partner_id) {
      query += ` AND ts.partner_id = $${paramCount}`;
      queryParams.push(partner_id);
      paramCount++;
    }
    
    // Filtrar por status de pagamento
    if (payment_status === 'paid') {
      query += ` AND ts.payment_date IS NOT NULL`;
    } else if (payment_status === 'pending') {
      query += ` AND ts.payment_date IS NULL`;
    }
    
    // Filtrar por período
    if (date_from) {
      query += ` AND ts.service_date >= $${paramCount}`;
      queryParams.push(date_from);
      paramCount++;
    }
    
    if (date_to) {
      query += ` AND ts.service_date <= $${paramCount}`;
      queryParams.push(date_to);
      paramCount++;
    }
    
    // Ordenação
    query += ` ORDER BY ts.service_date DESC, ts.id DESC`;
    
    const result = await pool.query(query, queryParams);
    let services = result.rows;
    
    // Incluir serviços de teste armazenados em memória, se solicitado
    // ou se não houver nenhum filtro especificado (para garantir retrocompatibilidade)
    const shouldIncludeTestServices = include_test === 'true' || (!include_test && !status && !payment_status);
    
    if (shouldIncludeTestServices && partner_id) {
      // Buscar serviços de teste para o parceiro específico
      const partnerIdNum = parseInt(partner_id as string);
      if (!isNaN(partnerIdNum)) {
        console.log(`[TowingPaymentsRoutes] Buscando serviços de teste para parceiro ID: ${partnerIdNum}`);
        const testServicesList = getTestServices(partnerIdNum);
        
        if (testServicesList && testServicesList.length > 0) {
          console.log(`[TowingPaymentsRoutes] Encontrados ${testServicesList.length} serviços de teste para o parceiro ID: ${partnerIdNum}`);
          
          // Formatar os serviços de teste para corresponder ao formato esperado pela UI
          const formattedTestServices = testServicesList.map(service => {
            return {
              ...service,
              partner_name: service.partner_name || "Parceiro Teste",
              company_name: service.company_name || "Empresa Teste",
              is_paid: service.payment_status === "paid",
              is_test_service: true  // Marca para identificar serviços de teste
            };
          });
          
          // Combinar os resultados
          services = [...formattedTestServices, ...services];
        } else {
          console.log(`[TowingPaymentsRoutes] Nenhum serviço de teste encontrado para o parceiro ID: ${partnerIdNum}`);
        }
      }
    }
    
    res.status(200).json(services);
  } catch (error) {
    console.error('Erro ao listar serviços de guincho:', error);
    res.status(500).json({ error: 'Erro ao listar serviços de guincho' });
  }
});

// Marcar serviços como pagos
router.post('/mark-as-paid', unifiedAuthMiddleware, requireRoles(['admin', 'gestor_frota']), async (req: Request, res: Response) => {
  try {
    const { service_ids, payment_date, payment_reference } = req.body;
    
    if (!service_ids || !Array.isArray(service_ids) || service_ids.length === 0) {
      return res.status(400).json({ error: 'IDs de serviços são obrigatórios' });
    }
    
    // Data de pagamento (hoje se não especificado)
    const paymentDate = payment_date ? payment_date : new Date().toISOString().split('T')[0];
    
    // Inicia uma transação
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Atualiza cada serviço
      for (const serviceId of service_ids) {
        await client.query(
          `UPDATE towing_services 
           SET payment_date = $1, 
               payment_reference = $2, 
               payment_processed_by = $3, 
               status = CASE WHEN status = 'pendente' THEN 'aprovado' ELSE status END
           WHERE id = $4`,
          [paymentDate, payment_reference || null, req.user?.id, serviceId]
        );
      }
      
      await client.query('COMMIT');
      
      res.status(200).json({ 
        success: true, 
        message: `${service_ids.length} serviço(s) marcado(s) como pago(s)`,
        services_updated: service_ids 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao marcar serviços como pagos:', error);
    res.status(500).json({ error: 'Erro ao marcar serviços como pagos' });
  }
});

// Cancelar pagamento de serviços
router.post('/cancel-payment', unifiedAuthMiddleware, requireRoles(['admin', 'gestor_frota']), async (req: Request, res: Response) => {
  try {
    const { service_ids } = req.body;
    
    if (!service_ids || !Array.isArray(service_ids) || service_ids.length === 0) {
      return res.status(400).json({ error: 'IDs de serviços são obrigatórios' });
    }
    
    // Inicia uma transação
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Atualiza cada serviço
      for (const serviceId of service_ids) {
        await client.query(
          `UPDATE towing_services 
           SET payment_date = NULL, 
               payment_reference = NULL,
               payment_processed_by = NULL
           WHERE id = $1`,
          [serviceId]
        );
      }
      
      await client.query('COMMIT');
      
      res.status(200).json({ 
        success: true, 
        message: `Pagamento de ${service_ids.length} serviço(s) cancelado(s)`,
        services_updated: service_ids 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao cancelar pagamento de serviços:', error);
    res.status(500).json({ error: 'Erro ao cancelar pagamento de serviços' });
  }
});

// Obter resumo financeiro
router.get('/summary', unifiedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFilter = '';
    
    if (period === 'week') {
      dateFilter = `AND service_date >= CURRENT_DATE - INTERVAL '7 days'`;
    } else if (period === 'month') {
      dateFilter = `AND service_date >= CURRENT_DATE - INTERVAL '30 days'`;
    } else if (period === 'year') {
      dateFilter = `AND service_date >= CURRENT_DATE - INTERVAL '365 days'`;
    }
    
    const query = `
      SELECT 
        COUNT(*) as total_services,
        COUNT(CASE WHEN payment_date IS NOT NULL THEN 1 END) as paid_services,
        COUNT(CASE WHEN payment_date IS NULL THEN 1 END) as pending_services,
        SUM(actual_cost) as total_cost,
        SUM(CASE WHEN payment_date IS NOT NULL THEN actual_cost ELSE 0 END) as paid_amount,
        SUM(CASE WHEN payment_date IS NULL THEN actual_cost ELSE 0 END) as pending_amount
      FROM towing_services
      WHERE 1=1 ${dateFilter}
    `;
    
    const partnerQuery = `
      SELECT 
        tp.id,
        tp.name,
        tp.company_name,
        COUNT(ts.id) as service_count,
        SUM(ts.actual_cost) as total_amount,
        COUNT(CASE WHEN ts.payment_date IS NOT NULL THEN 1 END) as paid_services,
        SUM(CASE WHEN ts.payment_date IS NOT NULL THEN ts.actual_cost ELSE 0 END) as paid_amount
      FROM towing_partners tp
      LEFT JOIN towing_services ts ON tp.id = ts.partner_id
      WHERE 1=1 ${dateFilter}
      GROUP BY tp.id, tp.name, tp.company_name
      ORDER BY total_amount DESC
      LIMIT 10
    `;
    
    const result = await pool.query(query);
    const partnerResult = await pool.query(partnerQuery);
    
    res.status(200).json({
      summary: result.rows[0],
      partners: partnerResult.rows
    });
  } catch (error) {
    console.error('Erro ao obter resumo financeiro:', error);
    res.status(500).json({ error: 'Erro ao obter resumo financeiro' });
  }
});

export default router;