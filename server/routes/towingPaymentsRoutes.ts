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
        tr.id,
        tr.partner_id,
        tr.vehicle_plate,
        tr.vehicle_model,
        tr.pickup_location,
        tr.delivery_location,
        tr.total_km,
        tr.service_value as actual_cost,
        tr.request_date as service_date,
        tr.created_at,
        tr.status,
        tr.observations,
        NULL as approved_by,
        NULL as approved_at,
        tp.name as partner_name, 
        tp.company_name,
        NULL as payment_date,
        false as is_paid
      FROM towing_requests tr
      JOIN towing_partners tp ON tr.partner_id = tp.id
      WHERE tr.status = 'aprovado' AND tp.status = 'ativo'
      
      UNION ALL
      
      SELECT 
        sg.id + 10000 as id,
        sg.parceiro_id as partner_id,
        sg.placa_veiculo as vehicle_plate,
        sg.modelo_veiculo as vehicle_model,
        sg.endereco_origem as pickup_location,
        sg.endereco_destino as delivery_location,
        sg.quilometragem as total_km,
        sg.valor as actual_cost,
        sg.data_servico as service_date,
        sg.data_lancamento as created_at,
        sg.status,
        sg.observacoes as observations,
        sg.usuario_aprovacao as approved_by,
        sg.data_aprovacao as approved_at,
        tp.name as partner_name, 
        tp.company_name,
        NULL as payment_date,
        false as is_paid
      FROM servicos_guincho sg
      JOIN towing_partners tp ON sg.parceiro_id = tp.id
      WHERE sg.status = 'aprovado' AND tp.status = 'ativo'
    `;
    
    const queryParams: any[] = [];
    let paramCount = 1;
    
    // Filtrar por status
    if (status) {
      query += ` AND sg.status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }
    
    // Filtrar por parceiro
    if (partner_id) {
      query += ` AND sg.parceiro_id = $${paramCount}`;
      queryParams.push(partner_id);
      paramCount++;
    }
    
    // Filtrar por status de pagamento (sempre false pois não há campo payment_date na tabela servicos_guincho)
    if (payment_status === 'paid') {
      query += ` AND 1 = 0`; // Nunca retorna resultados pois não há serviços pagos ainda
    } else if (payment_status === 'pending') {
      // Todos os serviços aprovados estão pendentes de pagamento
    }
    
    // Filtrar por período
    if (date_from) {
      query += ` AND sg.data_servico >= $${paramCount}`;
      queryParams.push(date_from);
      paramCount++;
    }
    
    if (date_to) {
      query += ` AND sg.data_servico <= $${paramCount}`;
      queryParams.push(date_to);
      paramCount++;
    }
    
    // Ordenação
    query += ` ORDER BY sg.data_servico DESC, sg.id DESC`;
    
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
      dateFilter = `AND data_servico >= CURRENT_DATE - INTERVAL '7 days'`;
    } else if (period === 'month') {
      dateFilter = `AND data_servico >= CURRENT_DATE - INTERVAL '30 days'`;
    } else if (period === 'year') {
      dateFilter = `AND data_servico >= CURRENT_DATE - INTERVAL '365 days'`;
    }
    
    const query = `
      SELECT 
        COUNT(*) as total_services,
        0 as paid_services,
        COUNT(*) as pending_services,
        COALESCE(SUM(CASE WHEN status = 'aprovado' THEN valor ELSE 0 END), 0) as total_value,
        0 as paid_value,
        COALESCE(SUM(CASE WHEN status = 'aprovado' THEN valor ELSE 0 END), 0) as pending_value
      FROM servicos_guincho
      WHERE status = 'aprovado' ${dateFilter}
    `;
    
    const partnerQuery = `
      SELECT 
        tp.id,
        tp.name as partner_name,
        tp.company_name,
        COUNT(CASE WHEN sg.status = 'aprovado' THEN 1 END) as total_services,
        0 as paid_services,
        COALESCE(SUM(CASE WHEN sg.status = 'aprovado' THEN sg.valor ELSE 0 END), 0) as total_value,
        0 as paid_value,
        COALESCE(SUM(CASE WHEN sg.status = 'aprovado' THEN sg.valor ELSE 0 END), 0) as pending_value
      FROM towing_partners tp
      LEFT JOIN servicos_guincho sg ON tp.id = sg.parceiro_id 
      WHERE tp.status = 'ativo' AND (sg.status = 'aprovado' OR sg.status IS NULL)
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
        sg.id,
        sg.parceiro_id as partner_id,
        sg.placa_veiculo as vehicle_plate,
        sg.modelo_veiculo as vehicle_model,
        sg.endereco_origem as pickup_location,
        sg.endereco_destino as delivery_location,
        sg.quilometragem as distance_km,
        sg.valor as cost,
        sg.data_servico as service_date,
        sg.data_lancamento as created_at,
        sg.observacoes as notes,
        sg.status,
        tp.name as partner_name,
        tp.company_name,
        tp.contact_phone as partner_phone,
        tp.contact_email as partner_email,
        CASE 
          WHEN sg.status = 'aprovado' THEN 'Pago'
          WHEN sg.status = 'pendente' THEN 'Pendente'
          WHEN sg.status = 'negado' THEN 'Rejeitado'
          ELSE 'Aguardando'
        END as payment_status_display
      FROM servicos_guincho sg
      INNER JOIN towing_partners tp ON sg.parceiro_id = tp.id
      WHERE 1=1 ${dateFilter.replace(/ts\./g, 'sg.')} ${partnerFilter}
      ORDER BY sg.data_servico DESC, tp.name ASC
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
    const checkQuery = 'SELECT id, placa_veiculo FROM servicos_guincho WHERE id = $1';
    const checkResult = await client.query(checkQuery, [serviceId]);

    console.log(`[DELETE SERVICE] Resultado da verificação:`, checkResult.rows);

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    // Excluir registros relacionados primeiro (se existirem)
    // Verificar se a tabela towing_service_notes existe antes de tentar excluir
    try {
      await client.query('DELETE FROM towing_service_notes WHERE towing_service_id = $1', [serviceId]);
    } catch (notesError) {
      // Se a tabela não existir ou a coluna for diferente, continuar sem erro
      console.log('[DELETE SERVICE] Tabela towing_service_notes não encontrada ou coluna diferente, continuando...');
    }
    
    // Excluir o serviço principal
    const deleteQuery = 'DELETE FROM servicos_guincho WHERE id = $1';
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