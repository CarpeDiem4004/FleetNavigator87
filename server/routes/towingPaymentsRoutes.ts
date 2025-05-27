/**
 * Rotas para gerenciamento financeiro de serviços de guincho
 */

import express, { Request, Response } from 'express';
import { pool } from '../db';
import { unifiedAuthMiddleware, requireRoles } from '../utils/auth-utils';
// Dados de teste removidos - sistema usa apenas dados reais do banco

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
      WHERE ts.status = 'aprovado'
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
    
    // Dados de teste desabilitados - usando apenas dados reais do banco
    console.log(`[TowingPaymentsRoutes] Retornando ${services.length} serviços reais do banco de dados`);
    
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
        COUNT(CASE WHEN status = 'aprovado' AND payment_date IS NOT NULL THEN 1 END) as paid_services,
        COUNT(CASE WHEN status = 'aprovado' AND payment_date IS NULL THEN 1 END) as pending_services,
        COALESCE(SUM(CASE WHEN status = 'aprovado' THEN actual_cost ELSE 0 END), 0) as total_value,
        COALESCE(SUM(CASE WHEN status = 'aprovado' AND payment_date IS NOT NULL THEN actual_cost ELSE 0 END), 0) as paid_value,
        COALESCE(SUM(CASE WHEN status = 'aprovado' AND payment_date IS NULL THEN actual_cost ELSE 0 END), 0) as pending_value
      FROM towing_services
      WHERE status = 'aprovado' ${dateFilter}
    `;
    
    const partnerQuery = `
      SELECT 
        tp.id,
        tp.name as partner_name,
        tp.company_name,
        COUNT(CASE WHEN ts.status = 'aprovado' THEN 1 END) as total_services,
        COUNT(CASE WHEN ts.status = 'aprovado' AND ts.payment_date IS NOT NULL THEN 1 END) as paid_services,
        COALESCE(SUM(CASE WHEN ts.status = 'aprovado' THEN ts.actual_cost ELSE 0 END), 0) as total_value,
        COALESCE(SUM(CASE WHEN ts.status = 'aprovado' AND ts.payment_date IS NOT NULL THEN ts.actual_cost ELSE 0 END), 0) as paid_value,
        COALESCE(SUM(CASE WHEN ts.status = 'aprovado' AND ts.payment_date IS NULL THEN ts.actual_cost ELSE 0 END), 0) as pending_value
      FROM towing_partners tp
      LEFT JOIN towing_services ts ON tp.id = ts.partner_id AND ts.status = 'aprovado'
      WHERE tp.isActive = true
      GROUP BY tp.id, tp.name, tp.company_name
      ORDER BY total_value DESC
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

// Rota para obter relatório detalhado de todos os serviços por parceiro
router.get('/detailed-report', async (req, res) => {
  try {
    const { start_date, end_date, partner_id } = req.query;
    
    let dateFilter = '';
    const queryParams: any[] = [];
    let paramCount = 1;
    
    if (start_date) {
      dateFilter += ` AND ts.service_date >= $${paramCount}`;
      queryParams.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      dateFilter += ` AND ts.service_date <= $${paramCount}`;
      queryParams.push(end_date);
      paramCount++;
    }
    
    let partnerFilter = '';
    if (partner_id) {
      partnerFilter = ` AND tp.id = $${paramCount}`;
      queryParams.push(parseInt(partner_id as string));
      paramCount++;
    }
    
    const query = `
      SELECT 
        ts.*,
        tp.name as partner_name,
        tp.company_name,
        tp.phone as partner_phone,
        tp.email as partner_email,
        CASE 
          WHEN ts.status = 'aprovado' THEN 'Pago'
          WHEN ts.status = 'pendente' THEN 'Pendente'
          WHEN ts.status = 'rejeitado' THEN 'Rejeitado'
          ELSE 'Aguardando'
        END as payment_status_display
      FROM towing_services ts
      INNER JOIN towing_partners tp ON ts.partner_id = tp.id
      WHERE 1=1 ${dateFilter} ${partnerFilter}
      ORDER BY ts.service_date DESC, tp.name ASC
    `;
    
    const result = await pool.query(query, queryParams);
    
    // Agrupar por parceiro para facilitar a visualização
    const servicesByPartner = {};
    let totalServices = 0;
    let totalValue = 0;
    let paidValue = 0;
    let pendingValue = 0;
    
    result.rows.forEach(service => {
      const partnerId = service.partner_id;
      
      if (!servicesByPartner[partnerId]) {
        servicesByPartner[partnerId] = {
          partner_info: {
            id: partnerId,
            name: service.partner_name,
            company_name: service.company_name,
            phone: service.partner_phone,
            email: service.partner_email
          },
          services: [],
          totals: {
            count: 0,
            total_value: 0,
            paid_value: 0,
            pending_value: 0,
            paid_count: 0,
            pending_count: 0
          }
        };
      }
      
      servicesByPartner[partnerId].services.push(service);
      servicesByPartner[partnerId].totals.count++;
      servicesByPartner[partnerId].totals.total_value += parseFloat(service.actual_cost || 0);
      
      if (service.status === 'aprovado') {
        servicesByPartner[partnerId].totals.paid_value += parseFloat(service.actual_cost || 0);
        servicesByPartner[partnerId].totals.paid_count++;
        paidValue += parseFloat(service.actual_cost || 0);
      } else {
        servicesByPartner[partnerId].totals.pending_value += parseFloat(service.actual_cost || 0);
        servicesByPartner[partnerId].totals.pending_count++;
        pendingValue += parseFloat(service.actual_cost || 0);
      }
      
      totalServices++;
      totalValue += parseFloat(service.actual_cost || 0);
    });
    
    res.status(200).json({
      summary: {
        total_services: totalServices,
        total_value: totalValue,
        paid_value: paidValue,
        pending_value: pendingValue,
        total_partners: Object.keys(servicesByPartner).length
      },
      services_by_partner: Object.values(servicesByPartner),
      all_services: result.rows
    });
  } catch (error) {
    console.error('Erro ao obter relatório detalhado:', error);
    res.status(500).json({ error: 'Erro ao obter relatório detalhado' });
  }
});

// Rota para excluir serviço de guincho (apenas administradores)
router.delete('/services/:id', unifiedAuthMiddleware, requireRoles(['admin']), async (req, res) => {
  const client = await pool.connect();
  try {
    // Verificar se o usuário é administrador
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem excluir serviços.' });
    }

    const { id } = req.params;
    const serviceId = parseInt(id);

    console.log(`[DELETE SERVICE] Tentando excluir serviço ID: ${serviceId}`);

    if (isNaN(serviceId)) {
      return res.status(400).json({ error: 'ID do serviço inválido' });
    }

    await client.query('BEGIN');

    // Verificar se o serviço existe
    const checkQuery = 'SELECT id, vehicle_plate FROM towing_services WHERE id = $1';
    const checkResult = await client.query(checkQuery, [serviceId]);

    console.log(`[DELETE SERVICE] Resultado da verificação:`, checkResult.rows);

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    // Excluir registros relacionados primeiro (se existirem)
    await client.query('DELETE FROM towing_service_notes WHERE service_id = $1', [serviceId]);
    
    // Excluir o serviço principal
    const deleteQuery = 'DELETE FROM towing_services WHERE id = $1';
    const deleteResult = await client.query(deleteQuery, [serviceId]);

    console.log(`[DELETE SERVICE] Resultado da exclusão:`, deleteResult.rowCount);

    await client.query('COMMIT');

    res.json({ 
      success: true, 
      message: 'Serviço excluído com sucesso',
      deletedServiceId: serviceId,
      affectedRows: deleteResult.rowCount 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao excluir serviço:', error);
    res.status(500).json({ error: 'Erro ao excluir serviço' });
  } finally {
    client.release();
  }
});

export default router;