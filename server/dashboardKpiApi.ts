import { Request, Response } from 'express';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { pool } from './db';

/**
 * Endpoint para obter contagem total de veículos
 */
export async function getTotalVehicles(req: Request, res: Response) {
  try {
    // Buscar o total de veículos cadastrados
    const vehiclesQuery = `
      SELECT COUNT(*) as total
      FROM veiculos
      WHERE deleted_at IS NULL
    `;

    const result = await pool.query(vehiclesQuery);
    const total = parseInt(result.rows[0].total) || 0;

    return res.status(200).json({
      success: true,
      data: {
        total
      }
    });
  } catch (error) {
    console.error('Erro ao obter total de veículos:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter total de veículos',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Endpoint para obter veículos em manutenção com comparativo mensal
 */
export async function getVehiclesInMaintenance(req: Request, res: Response) {
  try {
    const today = new Date();
    const currentMonth = startOfMonth(today);
    const previousMonth = startOfMonth(subMonths(today, 1));
    
    // Buscar veículos em manutenção no mês atual
    const currentQuery = `
      SELECT COUNT(DISTINCT vehicle_plate) as total
      FROM maintenance_requests
      WHERE status IN ('pendente', 'aguardando_orcamento', 'em_andamento')
      AND entry_date >= $1
    `;
    
    // Buscar veículos em manutenção no mês anterior
    const previousQuery = `
      SELECT COUNT(DISTINCT vehicle_plate) as total
      FROM maintenance_requests
      WHERE status IN ('pendente', 'aguardando_orcamento', 'em_andamento')
      AND entry_date >= $1 AND entry_date < $2
    `;
    
    const [currentResult, previousResult] = await Promise.all([
      pool.query(currentQuery, [currentMonth.toISOString()]),
      pool.query(previousQuery, [previousMonth.toISOString(), currentMonth.toISOString()])
    ]);
    
    const currentTotal = parseInt(currentResult.rows[0].total) || 0;
    const previousTotal = parseInt(previousResult.rows[0].total) || 0;
    
    // Calcular variação percentual
    let variation = 0;
    if (previousTotal > 0) {
      variation = Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
    }
    
    return res.status(200).json({
      success: true,
      data: {
        total: currentTotal,
        previousTotal,
        variation
      }
    });
  } catch (error) {
    console.error('Erro ao obter veículos em manutenção:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter veículos em manutenção',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Endpoint para obter estatísticas sobre litros abastecidos com comparativo mensal
 */
export async function getFuelConsumption(req: Request, res: Response) {
  try {
    const today = new Date();
    const currentMonth = startOfMonth(today);
    const previousMonth = startOfMonth(subMonths(today, 1));
    
    // Buscar litros abastecidos no mês atual
    const currentQuery = `
      SELECT COALESCE(SUM(litros), 0) as total_litros
      FROM abastecimentos
      WHERE data_abastecimento >= $1
    `;
    
    // Buscar litros abastecidos no mês anterior
    const previousQuery = `
      SELECT COALESCE(SUM(litros), 0) as total_litros
      FROM abastecimentos
      WHERE data_abastecimento >= $1 AND data_abastecimento < $2
    `;
    
    const [currentResult, previousResult] = await Promise.all([
      pool.query(currentQuery, [currentMonth.toISOString()]),
      pool.query(previousQuery, [previousMonth.toISOString(), currentMonth.toISOString()])
    ]);
    
    const currentTotal = parseFloat(currentResult.rows[0].total_litros) || 0;
    const previousTotal = parseFloat(previousResult.rows[0].total_litros) || 0;
    
    // Calcular variação percentual
    let variation = 0;
    if (previousTotal > 0) {
      variation = Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
    }
    
    return res.status(200).json({
      success: true,
      data: {
        total: Math.round(currentTotal),
        previousTotal: Math.round(previousTotal),
        variation
      }
    });
  } catch (error) {
    console.error('Erro ao obter consumo de combustível:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter consumo de combustível',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Função para registrar as rotas da API de KPIs do dashboard
 */
export function registerDashboardKpiRoutes(app: any) {
  app.get('/api/dashboard/veiculos/total', getTotalVehicles);
  app.get('/api/dashboard/veiculos/manutencao', getVehiclesInMaintenance);
  app.get('/api/dashboard/abastecimentos/litros', getFuelConsumption);
}