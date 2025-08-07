import { Request, Response } from 'express';
import { pool } from './db';
import { isAuthenticated } from './middleware/auth';

/**
 * Endpoint para obter contagem total de veículos
 */
export async function getTotalVehicles(req: Request, res: Response) {
  try {
    const query = `
      SELECT COUNT(*) as total
      FROM veiculos
      WHERE deleted_at IS NULL
    `;
    
    const result = await pool.query(query);
    
    return res.status(200).json({
      success: true,
      data: {
        total: parseInt(result.rows[0].total)
      }
    });
  } catch (error: any) {
    console.error('Erro ao obter total de veículos:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter total de veículos',
      error: error.message
    });
  }
}

/**
 * Endpoint para obter veículos em manutenção com comparativo mensal
 */
export async function getVehiclesInMaintenance(req: Request, res: Response) {
  try {
    // Total atual
    const currentQuery = `
      SELECT COUNT(*) as total
      FROM veiculos
      WHERE status = 'em_manutencao'
      AND deleted_at IS NULL
    `;
    
    // Total mês anterior (considerando o primeiro dia do mês atual)
    const lastMonthQuery = `
      SELECT COUNT(*) as total
      FROM manutencao
      WHERE created_at >= (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month')
      AND created_at < DATE_TRUNC('month', CURRENT_DATE)
      AND status NOT IN ('cancelada')
    `;
    
    const [currentResult, lastMonthResult] = await Promise.all([
      pool.query(currentQuery),
      pool.query(lastMonthQuery)
    ]);
    
    const currentTotal = parseInt(currentResult.rows[0].total);
    const lastMonthTotal = parseInt(lastMonthResult.rows[0].total);
    
    // Calcular variação percentual
    let variation = 0;
    if (lastMonthTotal > 0) {
      variation = ((currentTotal - lastMonthTotal) / lastMonthTotal) * 100;
    }
    
    return res.status(200).json({
      success: true,
      data: {
        total: currentTotal,
        previousTotal: lastMonthTotal,
        variation: Math.round(variation * 100) / 100 // Arredonda para 2 casas decimais
      }
    });
  } catch (error: any) {
    console.error('Erro ao obter veículos em manutenção:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter veículos em manutenção',
      error: error.message
    });
  }
}

/**
 * Endpoint para obter estatísticas sobre litros abastecidos com comparativo mensal
 */
export async function getFuelConsumption(req: Request, res: Response) {
  try {
    // Obter todos os nomes de tabelas de abastecimento
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE 'abastecimentos_posto_%'
      AND table_schema = 'public'
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    const tableNames = tablesResult.rows.map(row => row.table_name);
    
    if (tableNames.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          total: 0,
          previousTotal: 0,
          variation: 0
        }
      });
    }
    
    // Mês atual
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
    
    // Mês anterior
    const previousMonthStart = new Date(currentMonthStart);
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
    
    // Primeiro dia do próximo mês
    const nextMonthStart = new Date(currentMonthStart);
    nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);
    
    let totalCurrentMonth = 0;
    let totalPreviousMonth = 0;
    
    // Para cada tabela, obter a soma de litros do mês atual e anterior
    for (const tableName of tableNames) {
      // Query para o mês atual
      const currentMonthQuery = `
        SELECT COALESCE(SUM(litros), 0) as total
        FROM ${tableName}
        WHERE data_abastecimento >= $1 AND data_abastecimento < $2
      `;
      
      // Query para o mês anterior
      const previousMonthQuery = `
        SELECT COALESCE(SUM(litros), 0) as total
        FROM ${tableName}
        WHERE data_abastecimento >= $1 AND data_abastecimento < $2
      `;
      
      const [currentMonthResult, previousMonthResult] = await Promise.all([
        pool.query(currentMonthQuery, [currentMonthStart, nextMonthStart]),
        pool.query(previousMonthQuery, [previousMonthStart, currentMonthStart])
      ]);
      
      totalCurrentMonth += parseFloat(currentMonthResult.rows[0].total);
      totalPreviousMonth += parseFloat(previousMonthResult.rows[0].total);
    }
    
    // Calcular variação percentual
    let variation = 0;
    if (totalPreviousMonth > 0) {
      variation = ((totalCurrentMonth - totalPreviousMonth) / totalPreviousMonth) * 100;
    }
    
    return res.status(200).json({
      success: true,
      data: {
        total: Math.round(totalCurrentMonth),
        previousTotal: Math.round(totalPreviousMonth),
        variation: Math.round(variation * 100) / 100 // Arredonda para 2 casas decimais
      }
    });
  } catch (error: any) {
    console.error('Erro ao obter consumo de combustível:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter consumo de combustível',
      error: error.message
    });
  }
}

/**
 * Endpoint para obter estatísticas de estoque de pneus
 */
export async function getTireStockStats(req: Request, res: Response) {
  try {
    const query = `
      SELECT 
        COUNT(*) as quantidade,
        SUM(valor_atual) as valor_total
      FROM pneus
      WHERE deleted_at IS NULL
    `;
    
    const result = await pool.query(query);
    
    return res.status(200).json({
      success: true,
      data: {
        quantidade: parseInt(result.rows[0].quantidade),
        valor_total: parseFloat(result.rows[0].valor_total || '0')
      }
    });
  } catch (error: any) {
    console.error('Erro ao obter estatísticas de pneus:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas de pneus',
      error: error.message
    });
  }
}

/**
 * Função auxiliar para buscar dados de quilometragem por base
 */
async function getKmPerBaseData() {
  try {
    const query = `
      SELECT 
        project as base,
        SUM(CASE 
          WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE) 
          THEN km 
          ELSE 0 
        END) as currentMonth,
        SUM(CASE 
          WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') 
          THEN km 
          ELSE 0 
        END) as previousMonth
      FROM historico_consolidado_abastecimentos
      WHERE project IS NOT NULL 
        AND km IS NOT NULL 
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
      GROUP BY project
      HAVING SUM(km) > 0
      ORDER BY currentMonth DESC
      LIMIT 10
    `;
    
    const result = await pool.query(query);
    
    // Converter dados para formato esperado pelo frontend
    return result.rows.map(row => ({
      base: row.base,
      currentMonth: parseInt(row.currentmonth) || 0,
      previousMonth: parseInt(row.previousmonth) || 0
    }));
  } catch (error) {
    console.error('Erro ao buscar dados de quilometragem por base:', error);
    return [];
  }
}

/**
 * Endpoint para obter dados de quilometragem por base com comparativo mensal
 */
export async function getKmPerBase(req: Request, res: Response) {
  try {
    const kmPerBaseData = await getKmPerBaseData();
    
    return res.status(200).json({
      success: true,
      data: kmPerBaseData
    });
  } catch (error: any) {
    console.error('Erro ao obter dados de quilometragem por base:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter dados de quilometragem por base',
      error: error.message
    });
  }
}

/**
 * Função para registrar as rotas da API de KPIs do dashboard
 */
export function registerDashboardKpiRoutes(app: any) {
  // Rota principal para obter todos os KPIs
  app.get('/api/dashboard/kpis', isAuthenticated, async (req, res) => {
    try {
      const [vehicles, maintenance, tires, fuel, kmPerBaseData] = await Promise.all([
        getTotalVehicles(req, res).catch(() => ({ total: 0 })),
        getVehiclesInMaintenance(req, res).catch(() => ({ total: 0, previousTotal: 0, variation: 0 })),
        getTireStockStats(req, res).catch(() => ({ quantidade: 0, valor_total: 0 })),
        getFuelConsumption(req, res).catch(() => ({ total: 0, previousTotal: 0, variation: 0 })),
        getKmPerBaseData().catch(() => [])
      ]);
      
      return res.status(200).json({
        success: true,
        kpis: [
          { title: 'Disponibilidade e Utilização', metrics: [] },
          { title: 'Manutenção', metrics: [] },
          { title: 'Custos e Eficiência', metrics: [] }
        ],
        timeSeriesData: [],
        fleetAvailability: [],
        costPerKm: [],
        maintenanceTime: [],
        fuelEfficiency: [],
        kmPerBase: kmPerBaseData,
        data: {
          vehicles,
          maintenance,
          tires,
          fuel
        }
      });
    } catch (error: any) {
      console.error('Erro ao obter KPIs do dashboard:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter KPIs do dashboard',
        error: error.message
      });
    }
  });
  
  // Rotas individuais para cada KPI
  app.get('/api/dashboard/veiculos/total', isAuthenticated, getTotalVehicles);
  app.get('/api/dashboard/veiculos/manutencao', isAuthenticated, getVehiclesInMaintenance);
  app.get('/api/pneus/estatisticas/estoque', isAuthenticated, getTireStockStats);
  app.get('/api/dashboard/abastecimentos/litros', isAuthenticated, getFuelConsumption);
  
  // Rota de quilometragem por base com autenticação flexível
  app.get('/api/dashboard/km-per-base', async (req, res) => {
    console.log('[KM-PER-BASE] Processando requisição diretamente');
    
    try {
      const kmData = await getKmPerBaseData();
      console.log('[KM-PER-BASE] Dados obtidos:', kmData.length, 'registros');
      
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({
        success: true,
        data: kmData,
        message: 'Dados de quilometragem obtidos com sucesso'
      });
    } catch (error: any) {
      console.error('[KM-PER-BASE] Erro:', error);
      
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter dados de quilometragem',
        error: error.message
      });
    }
  });
}