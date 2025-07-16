import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth';
import { pool } from '../database.js';

const router = Router();

// Aplicar middleware de autenticação para todas as rotas
router.use(isAuthenticated);

// Endpoint para dados de manutenção
router.get('/maintenance', async (req, res) => {
  try {
    const { baseId, projectId, startDate, endDate } = req.query;
    
    let baseCondition = '';
    let projectCondition = '';
    let dateCondition = '';
    const params: any[] = [];
    
    // Filtros
    if (baseId) {
      baseCondition = ' AND v.base_id = $' + (params.length + 1);
      params.push(baseId);
    }
    
    if (projectId) {
      projectCondition = ' AND v.project_id = $' + (params.length + 1);
      params.push(projectId);
    }
    
    if (startDate && endDate) {
      dateCondition = ' AND mo.created_at >= $' + (params.length + 1) + ' AND mo.created_at <= $' + (params.length + 2);
      params.push(startDate);
      params.push(endDate);
    }

    // Veículos em manutenção
    const vehiclesInMaintenanceQuery = `
      SELECT COUNT(*) as count
      FROM maintenance_orders mo
      JOIN vehicles v ON mo.vehicle_id = v.id
      WHERE mo.status IN ('pendente', 'em_andamento', 'aguardando_pecas')
      ${baseCondition}
      ${projectCondition}
      ${dateCondition}
    `;

    const vehiclesInMaintenanceResult = await pool.query(vehiclesInMaintenanceQuery, params);
    const vehiclesInMaintenance = parseInt(vehiclesInMaintenanceResult.rows[0].count);

    // Tempo médio de manutenção
    const avgMaintenanceQuery = `
      SELECT AVG(
        CASE 
          WHEN mo.status = 'concluida' AND mo.completion_date IS NOT NULL 
          THEN EXTRACT(DAY FROM (mo.completion_date - mo.created_at))
          ELSE EXTRACT(DAY FROM (NOW() - mo.created_at))
        END
      ) as avg_days
      FROM maintenance_orders mo
      JOIN vehicles v ON mo.vehicle_id = v.id
      WHERE 1=1
      ${baseCondition}
      ${projectCondition}
      ${dateCondition}
    `;

    const avgMaintenanceResult = await pool.query(avgMaintenanceQuery, params);
    const averageMaintenanceDays = Math.round(parseFloat(avgMaintenanceResult.rows[0].avg_days) || 0);

    // Veículos com mais de 5 dias parados
    const vehiclesOver5DaysQuery = `
      SELECT 
        mo.id,
        v.plate,
        EXTRACT(DAY FROM (NOW() - mo.created_at)) as days_in_maintenance,
        COALESCE(w.name, o.name, 'Oficina não informada') as workshop,
        mo.created_at as entry_date
      FROM maintenance_orders mo
      JOIN vehicles v ON mo.vehicle_id = v.id
      LEFT JOIN workshops w ON mo.workshop_id = w.id
      LEFT JOIN oficinas o ON mo.oficina_id = o.id
      WHERE mo.status IN ('pendente', 'em_andamento', 'aguardando_pecas')
        AND EXTRACT(DAY FROM (NOW() - mo.created_at)) > 5
      ${baseCondition}
      ${projectCondition}
      ${dateCondition}
      ORDER BY days_in_maintenance DESC
    `;

    const vehiclesOver5DaysResult = await pool.query(vehiclesOver5DaysQuery, params);
    const vehiclesOver5Days = vehiclesOver5DaysResult.rows.map(row => ({
      id: row.id,
      plate: row.plate,
      daysInMaintenance: parseInt(row.days_in_maintenance),
      workshop: row.workshop,
      entryDate: row.entry_date
    }));

    // Custo total de manutenção
    const totalCostQuery = `
      SELECT 
        SUM(COALESCE(mo.labor_cost, 0) + COALESCE(mo.parts_cost, 0)) as total_cost,
        COUNT(*) as total_orders
      FROM maintenance_orders mo
      JOIN vehicles v ON mo.vehicle_id = v.id
      WHERE 1=1
      ${baseCondition}
      ${projectCondition}
      ${dateCondition}
    `;

    const totalCostResult = await pool.query(totalCostQuery, params);
    const totalMaintenanceCost = parseFloat(totalCostResult.rows[0].total_cost) || 0;
    const totalOrders = parseInt(totalCostResult.rows[0].total_orders) || 0;
    const averageCostPerVehicle = totalOrders > 0 ? totalMaintenanceCost / totalOrders : 0;

    res.json({
      vehiclesInMaintenance,
      averageMaintenanceDays,
      vehiclesOver5Days,
      totalMaintenanceCost,
      averageCostPerVehicle
    });

  } catch (error) {
    console.error('Erro ao obter dados de manutenção:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para dados de combustível
router.get('/fuel', async (req, res) => {
  try {
    const { baseId, projectId, startDate, endDate, period } = req.query;
    
    let baseCondition = '';
    let projectCondition = '';
    let dateCondition = '';
    const params: any[] = [];
    
    // Filtros
    if (baseId) {
      baseCondition = ' AND base_id = $' + (params.length + 1);
      params.push(baseId);
    }
    
    if (projectId) {
      projectCondition = ' AND project_id = $' + (params.length + 1);
      params.push(projectId);
    }
    
    if (startDate && endDate) {
      dateCondition = ' AND data_abastecimento >= $' + (params.length + 1) + ' AND data_abastecimento <= $' + (params.length + 2);
      params.push(startDate);
      params.push(endDate);
    } else {
      // Se não houver filtro de data, usar o mês atual
      dateCondition = ' AND data_abastecimento >= DATE_TRUNC(\'month\', NOW())';
    }

    // Função para obter dados de uma tabela específica
    const getFuelDataFromTable = async (tableName: string) => {
      const fuelQuery = `
        SELECT 
          COUNT(*) as total_refuels,
          SUM(CASE WHEN tipo_combustivel = 'Diesel' THEN litros_abastecidos ELSE 0 END) as diesel_liters,
          SUM(CASE WHEN tipo_combustivel = 'Gasolina' THEN litros_abastecidos ELSE 0 END) as gasoline_liters,
          SUM(CASE WHEN tipo_combustivel = 'Alcool' OR tipo_combustivel = 'Etanol' THEN litros_abastecidos ELSE 0 END) as alcohol_liters,
          SUM(litros_abastecidos) as total_liters,
          SUM(km_rodados) as total_km
        FROM ${tableName}
        WHERE 1=1
        ${baseCondition}
        ${projectCondition}
        ${dateCondition}
      `;

      try {
        const result = await pool.query(fuelQuery, params);
        return result.rows[0];
      } catch (error) {
        console.error(`Erro ao consultar tabela ${tableName}:`, error);
        return {
          total_refuels: 0,
          diesel_liters: 0,
          gasoline_liters: 0,
          alcohol_liters: 0,
          total_liters: 0,
          total_km: 0
        };
      }
    };

    // Lista de tabelas de abastecimento conhecidas
    const fuelTables = [
      'historico_consolidado_abastecimentos',
      'abastecimentos_posto_abc_v2',
      'abastecimentos_posto_campinas_v2',
      'abastecimentos_posto_osasco_v2',
      'abastecimentos_posto_guarulhos_v2',
      'abastecimentos_posto_socorro_v2',
      'abastecimentos_posto_sorocaba_v2',
      'abastecimentos_posto_alair_v2'
    ];

    // Tentar primeira a view consolidada
    let fuelData;
    try {
      fuelData = await getFuelDataFromTable('historico_consolidado_abastecimentos');
    } catch (error) {
      console.log('View consolidada não disponível, consultando tabelas individuais...');
      
      // Se a view não existir, consultar tabelas individuais
      const results = await Promise.all(
        fuelTables.map(table => getFuelDataFromTable(table))
      );
      
      // Consolidar resultados
      fuelData = results.reduce((acc, curr) => ({
        total_refuels: acc.total_refuels + parseInt(curr.total_refuels || 0),
        diesel_liters: acc.diesel_liters + parseFloat(curr.diesel_liters || 0),
        gasoline_liters: acc.gasoline_liters + parseFloat(curr.gasoline_liters || 0),
        alcohol_liters: acc.alcohol_liters + parseFloat(curr.alcohol_liters || 0),
        total_liters: acc.total_liters + parseFloat(curr.total_liters || 0),
        total_km: acc.total_km + parseFloat(curr.total_km || 0)
      }), {
        total_refuels: 0,
        diesel_liters: 0,
        gasoline_liters: 0,
        alcohol_liters: 0,
        total_liters: 0,
        total_km: 0
      });
    }

    // Calcular consumo médio
    const totalLiters = parseFloat(fuelData.total_liters) || 0;
    const totalKm = parseFloat(fuelData.total_km) || 0;
    const averageConsumption = totalKm > 0 ? totalLiters / totalKm : 0;

    // Dados mensais para gráfico
    const monthlyDataQuery = `
      SELECT 
        TO_CHAR(data_abastecimento, 'YYYY-MM') as month,
        COUNT(*) as refuels,
        SUM(litros_abastecidos) as liters,
        SUM(valor_total) as cost
      FROM historico_consolidado_abastecimentos
      WHERE data_abastecimento >= NOW() - INTERVAL '6 months'
      ${baseCondition}
      ${projectCondition}
      GROUP BY TO_CHAR(data_abastecimento, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 6
    `;

    let monthlyData = [];
    try {
      const monthlyResult = await pool.query(monthlyDataQuery, params);
      monthlyData = monthlyResult.rows.map(row => ({
        month: row.month,
        refuels: parseInt(row.refuels),
        liters: parseFloat(row.liters),
        cost: parseFloat(row.cost || 0)
      }));
    } catch (error) {
      console.error('Erro ao obter dados mensais:', error);
    }

    res.json({
      totalRefuels: parseInt(fuelData.total_refuels),
      totalLiters: {
        diesel: parseFloat(fuelData.diesel_liters),
        gasoline: parseFloat(fuelData.gasoline_liters),
        alcohol: parseFloat(fuelData.alcohol_liters)
      },
      averageConsumption,
      monthlyData
    });

  } catch (error) {
    console.error('Erro ao obter dados de combustível:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;