import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();

// Função para obter dados financeiros de guincho
export const getTowingFinancialSummary = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { period = 'month', partner_id, start_date, end_date } = req.query;

    let dateFilter = '';
    if (start_date && end_date) {
      dateFilter = `AND tfr.service_date BETWEEN '${start_date}' AND '${end_date}'`;
    } else if (period === 'week') {
      dateFilter = `AND tfr.service_date >= CURRENT_DATE - INTERVAL '7 days'`;
    } else if (period === 'month') {
      dateFilter = `AND tfr.service_date >= CURRENT_DATE - INTERVAL '30 days'`;
    } else if (period === 'year') {
      dateFilter = `AND tfr.service_date >= CURRENT_DATE - INTERVAL '365 days'`;
    }

    const partnerFilter = partner_id ? `AND tfr.partner_id = ${partner_id}` : '';

    const summaryQuery = `
      SELECT 
        COUNT(*) as total_services,
        COUNT(CASE WHEN tfr.payment_status = 'paid' THEN 1 END) as paid_services,
        COUNT(CASE WHEN tfr.payment_status = 'pending' THEN 1 END) as pending_services,
        COALESCE(SUM(tfr.total_amount), 0) as total_value,
        COALESCE(SUM(CASE WHEN tfr.payment_status = 'paid' THEN tfr.total_amount ELSE 0 END), 0) as paid_value,
        COALESCE(SUM(CASE WHEN tfr.payment_status = 'pending' THEN tfr.total_amount ELSE 0 END), 0) as pending_value
      FROM towing_financial_records tfr
      WHERE 1=1 ${dateFilter} ${partnerFilter}
    `;

    const summaryResult = await pool.query(summaryQuery);
    const summary = summaryResult.rows[0];

    res.json({
      summary: {
        totalServices: parseInt(summary.total_services),
        paidServices: parseInt(summary.paid_services),
        pendingServices: parseInt(summary.pending_services),
        totalValue: parseFloat(summary.total_value),
        paidValue: parseFloat(summary.paid_value),
        pendingValue: parseFloat(summary.pending_value)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar resumo financeiro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Função para obter serviços financeiros detalhados
export const getTowingFinancialServices = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      partner_id, 
      payment_status, 
      start_date, 
      end_date,
      search 
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereConditions = ['1=1'];
    const queryParams: any[] = [];

    if (partner_id) {
      whereConditions.push(`tfr.partner_id = $${queryParams.length + 1}`);
      queryParams.push(partner_id);
    }

    if (payment_status) {
      whereConditions.push(`tfr.payment_status = $${queryParams.length + 1}`);
      queryParams.push(payment_status);
    }

    if (start_date && end_date) {
      whereConditions.push(`tfr.service_date BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`);
      queryParams.push(start_date, end_date);
    }

    if (search) {
      whereConditions.push(`(tfr.vehicle_plate ILIKE $${queryParams.length + 1} OR tfr.partner_name ILIKE $${queryParams.length + 1})`);
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    const servicesQuery = `
      SELECT 
        tfr.*,
        u.name as approved_by_name
      FROM towing_financial_records tfr
      LEFT JOIN users u ON tfr.approved_by = u.id
      WHERE ${whereClause}
      ORDER BY tfr.service_date DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(parseInt(limit as string), offset);

    const servicesResult = await pool.query(servicesQuery, queryParams);

    // Contar total de registros
    const countQuery = `
      SELECT COUNT(*) as total
      FROM towing_financial_records tfr
      WHERE ${whereClause}
    `;

    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    res.json({
      services: servicesResult.rows,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar serviços financeiros:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Função para processar pagamento
export const processPayment = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      payment_date, 
      payment_reference, 
      payment_method, 
      invoice_number, 
      notes 
    } = req.body;

    const userId = req.user?.id;

    const updateQuery = `
      UPDATE towing_financial_records 
      SET 
        payment_status = 'paid',
        payment_date = $1,
        payment_reference = $2,
        payment_method = $3,
        invoice_number = $4,
        notes = $5,
        payment_processed_by = $6,
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      payment_date,
      payment_reference,
      payment_method,
      invoice_number,
      notes,
      userId,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    res.json({
      message: 'Pagamento processado com sucesso',
      service: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Função para obter relatório detalhado por parceiro
export const getPartnerReport = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { start_date, end_date, partner_id } = req.query;

    let dateFilter = '';
    if (start_date && end_date) {
      dateFilter = `AND tfr.service_date BETWEEN '${start_date}' AND '${end_date}'`;
    }

    const partnerFilter = partner_id ? `AND tfr.partner_id = ${partner_id}` : '';

    const reportQuery = `
      SELECT 
        tfr.partner_id,
        tfr.partner_name,
        COUNT(*) as total_services,
        COUNT(CASE WHEN tfr.payment_status = 'paid' THEN 1 END) as paid_services,
        COUNT(CASE WHEN tfr.payment_status = 'pending' THEN 1 END) as pending_services,
        COALESCE(SUM(tfr.total_amount), 0) as total_value,
        COALESCE(SUM(CASE WHEN tfr.payment_status = 'paid' THEN tfr.total_amount ELSE 0 END), 0) as paid_value,
        COALESCE(SUM(CASE WHEN tfr.payment_status = 'pending' THEN tfr.total_amount ELSE 0 END), 0) as pending_value
      FROM towing_financial_records tfr
      WHERE 1=1 ${dateFilter} ${partnerFilter}
      GROUP BY tfr.partner_id, tfr.partner_name
      ORDER BY total_value DESC
    `;

    const result = await pool.query(reportQuery);

    res.json({
      partners: result.rows.map(row => ({
        id: row.partner_id,
        partner_name: row.partner_name,
        total_services: parseInt(row.total_services),
        paid_services: parseInt(row.paid_services),
        pending_services: parseInt(row.pending_services),
        total_value: parseFloat(row.total_value).toFixed(2),
        paid_value: parseFloat(row.paid_value).toFixed(2),
        pending_value: parseFloat(row.pending_value).toFixed(2)
      }))
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export default router;