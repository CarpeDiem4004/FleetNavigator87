import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth';
import { pool } from '../database.js';

const router = Router();

// Aplicar middleware de autenticação para todas as rotas
router.use(isAuthenticated);

// Endpoint para dados de manutenção
router.get('/maintenance', async (req, res) => {
  try {
    console.log('[OPERATIONAL-DASHBOARD] Requisição de manutenção recebida:', req.query);
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

    // Veículos em manutenção (combinando tabelas manutencao e oficina_murici_manutencoes)
    const vehiclesInMaintenanceQuery = `
      SELECT COUNT(*) as count FROM (
        -- Tabela principal manutencao
        SELECT m.id
        FROM manutencao m
        LEFT JOIN vehicles v ON m.veiculo_id = v.id
        WHERE m.status IN ('pendente', 'em_andamento', 'aguardando_pecas')
          AND m.oficina_id IN (2, 6) -- Alair (2) e Murici (6)
        ${baseCondition.replace('v.base_id', 'm.base_id')}
        ${projectCondition}
        ${dateCondition.replace('mo.created_at', 'm.created_at')}
        
        UNION ALL
        
        -- Tabela específica Murici
        SELECT om.id
        FROM oficina_murici_manutencoes om
        WHERE om.status IN ('pendente', 'em_andamento', 'aguardando_pecas')
        ${dateCondition.replace('mo.created_at', 'om.created_at')}
      ) as combined_maintenance
    `;

    console.log('[OPERATIONAL-DASHBOARD] Query veículos em manutenção:', vehiclesInMaintenanceQuery);
    console.log('[OPERATIONAL-DASHBOARD] Parâmetros:', params);
    
    const vehiclesInMaintenanceResult = await pool.query(vehiclesInMaintenanceQuery, params);
    const vehiclesInMaintenance = parseInt(vehiclesInMaintenanceResult.rows[0].count);
    console.log('[OPERATIONAL-DASHBOARD] Veículos em manutenção encontrados:', vehiclesInMaintenance);

    // Manutenções concluídas (combinando tabelas manutencao e oficina_murici_manutencoes)
    const completedMaintenanceQuery = `
      SELECT COUNT(*) as count FROM (
        -- Tabela principal manutencao
        SELECT m.id
        FROM manutencao m
        LEFT JOIN vehicles v ON m.veiculo_id = v.id
        WHERE m.status = 'concluido'
          AND m.oficina_id IN (2, 6) -- Alair (2) e Murici (6)
        ${baseCondition.replace('v.base_id', 'm.base_id')}
        ${projectCondition}
        ${dateCondition.replace('mo.created_at', 'm.created_at')}
        
        UNION ALL
        
        -- Tabela específica Murici
        SELECT om.id
        FROM oficina_murici_manutencoes om
        WHERE om.status = 'concluido'
        ${dateCondition.replace('mo.created_at', 'om.created_at')}
      ) as completed_maintenance
    `;

    const completedMaintenanceResult = await pool.query(completedMaintenanceQuery, params);
    const completedMaintenance = parseInt(completedMaintenanceResult.rows[0].count);
    console.log('[OPERATIONAL-DASHBOARD] Manutenções concluídas encontradas:', completedMaintenance);

    // Tempo médio de manutenção (combinando tabelas manutencao e oficina_murici_manutencoes)
    const avgMaintenanceQuery = `
      SELECT AVG(days_in_maintenance) as avg_days FROM (
        -- Tabela principal manutencao
        SELECT 
          CASE 
            WHEN m.status = 'concluida' AND m.data_conclusao IS NOT NULL 
            THEN EXTRACT(DAY FROM (m.data_conclusao - m.created_at))
            ELSE EXTRACT(DAY FROM (NOW() - m.created_at))
          END as days_in_maintenance
        FROM manutencao m
        LEFT JOIN vehicles v ON m.veiculo_id = v.id
        WHERE m.oficina_id IN (2, 6) -- Alair (2) e Murici (6)
        ${baseCondition.replace('v.base_id', 'm.base_id')}
        ${projectCondition}
        ${dateCondition.replace('mo.created_at', 'm.created_at')}
        
        UNION ALL
        
        -- Tabela específica Murici
        SELECT 
          CASE 
            WHEN om.status = 'concluida' AND om.data_hora_fim IS NOT NULL 
            THEN EXTRACT(DAY FROM (om.data_hora_fim - om.created_at))
            ELSE EXTRACT(DAY FROM (NOW() - om.created_at))
          END as days_in_maintenance
        FROM oficina_murici_manutencoes om
        WHERE 1=1
        ${dateCondition.replace('mo.created_at', 'om.created_at')}
      ) as combined_days
    `;

    const avgMaintenanceResult = await pool.query(avgMaintenanceQuery, params);
    const averageMaintenanceDays = Math.round(parseFloat(avgMaintenanceResult.rows[0].avg_days) || 0);

    // Veículos com mais de 3 dias parados (combinando tabelas manutencao e oficina_murici_manutencoes)
    const vehiclesOver3DaysQuery = `
      SELECT * FROM (
        -- Tabela principal manutencao
        SELECT 
          m.id,
          COALESCE(v.plate, m.placa) as plate,
          EXTRACT(DAY FROM (NOW() - m.created_at)) as days_in_maintenance,
          w.nome as workshop,
          m.created_at as entry_date
        FROM manutencao m
        LEFT JOIN workshops w ON m.oficina_id = w.id
        LEFT JOIN vehicles v ON m.veiculo_id = v.id
        WHERE m.status IN ('pendente', 'em_andamento', 'aguardando_pecas')
          AND EXTRACT(DAY FROM (NOW() - m.created_at)) > 3
          AND m.oficina_id IN (2, 6) -- Alair (2) e Murici (6)
        ${baseCondition.replace('v.base_id', 'm.base_id')}
        ${projectCondition}
        ${dateCondition.replace('mo.created_at', 'm.created_at')}
        
        UNION ALL
        
        -- Tabela específica Murici
        SELECT 
          om.id,
          om.placa as plate,
          EXTRACT(DAY FROM (NOW() - om.created_at)) as days_in_maintenance,
          'Oficina Murici' as workshop,
          om.created_at as entry_date
        FROM oficina_murici_manutencoes om
        WHERE om.status IN ('pendente', 'em_andamento', 'aguardando_pecas')
          AND EXTRACT(DAY FROM (NOW() - om.created_at)) > 3
        ${dateCondition.replace('mo.created_at', 'om.created_at')}
      ) as combined_vehicles
      ORDER BY days_in_maintenance DESC
    `;

    const vehiclesOver3DaysResult = await pool.query(vehiclesOver3DaysQuery, params);
    const vehiclesOver3Days = vehiclesOver3DaysResult.rows.map(row => ({
      id: row.id,
      plate: row.plate,
      daysInMaintenance: parseInt(row.days_in_maintenance),
      workshop: row.workshop,
      entryDate: row.entry_date
    }));

    // Custo total de manutenção (combinando tabelas manutencao e oficina_murici_manutencoes)
    const totalCostQuery = `
      SELECT 
        SUM(total_cost) as total_cost,
        SUM(total_orders) as total_orders
      FROM (
        -- Tabela principal manutencao
        SELECT 
          SUM(COALESCE(m.custo, 0)) as total_cost,
          COUNT(*) as total_orders
        FROM manutencao m
        LEFT JOIN vehicles v ON m.veiculo_id = v.id
        WHERE m.oficina_id IN (2, 6) -- Alair (2) e Murici (6)
        ${baseCondition.replace('v.base_id', 'm.base_id')}
        ${projectCondition}
        ${dateCondition.replace('mo.created_at', 'm.created_at')}
        
        UNION ALL
        
        -- Tabela específica Murici
        SELECT 
          SUM(COALESCE(om.custo_total, 0)) as total_cost,
          COUNT(*) as total_orders
        FROM oficina_murici_manutencoes om
        WHERE 1=1
        ${dateCondition.replace('mo.created_at', 'om.created_at')}
      ) as combined_costs
    `;

    console.log('[OPERATIONAL-DASHBOARD] Query custo total:', totalCostQuery);
    console.log('[OPERATIONAL-DASHBOARD] Parâmetros para custo total:', params);

    const totalCostResult = await pool.query(totalCostQuery);
    console.log('[OPERATIONAL-DASHBOARD] Resultado custo total:', totalCostResult.rows[0]);
    
    const totalMaintenanceCost = parseFloat(totalCostResult.rows[0].total_cost) || 0;
    const totalOrders = parseInt(totalCostResult.rows[0].total_orders) || 0;
    const averageCostPerVehicle = totalOrders > 0 ? totalMaintenanceCost / totalOrders : 0;

    res.json({
      vehiclesInMaintenance,
      completedMaintenance,
      averageMaintenanceDays,
      vehiclesOver3Days,
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
      dateCondition = ' AND created_at >= $' + (params.length + 1) + ' AND created_at <= $' + (params.length + 2);
      params.push(startDate);
      params.push(endDate);
    } else {
      // Se não houver filtro de data, usar o mês atual
      dateCondition = ' AND created_at >= DATE_TRUNC(\'month\', NOW())';
    }

    // Função para obter dados de uma tabela específica
    const getFuelDataFromTable = async (tableName: string) => {
      const fuelQuery = `
        SELECT 
          COUNT(*) as total_refuels,
          SUM(CASE WHEN tipo_combustivel = 'Diesel' THEN quantidade_litros ELSE 0 END) as diesel_liters,
          SUM(CASE WHEN tipo_combustivel = 'Gasolina' THEN quantidade_litros ELSE 0 END) as gasoline_liters,
          SUM(CASE WHEN tipo_combustivel = 'Alcool' OR tipo_combustivel = 'Etanol' THEN quantidade_litros ELSE 0 END) as alcohol_liters,
          SUM(quantidade_litros) as total_liters,
          SUM(km) as total_km
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
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as refuels,
        SUM(quantidade_litros) as liters,
        SUM(valor_total) as cost
      FROM historico_consolidado_abastecimentos
      WHERE created_at >= NOW() - INTERVAL '6 months'
      ${baseCondition}
      ${projectCondition}
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
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

    // Buscar dados de fuel card
    let fuelCardData = {
      totalRequests: 0,
      totalValue: 0,
      approvedRequests: 0
    };

    try {
      // Dados da tabela solicitacoes_fuel_card
      const fuelCardQuery = `
        SELECT 
          COUNT(*) as total_requests,
          SUM(CASE WHEN status = 'atendido' THEN valor_solicitado ELSE 0 END) as total_value,
          COUNT(CASE WHEN status = 'atendido' THEN 1 ELSE NULL END) as approved_requests
        FROM solicitacoes_fuel_card
        WHERE created_at >= DATE_TRUNC('month', NOW())
      `;
      
      const fuelCardResult = await pool.query(fuelCardQuery);
      if (fuelCardResult.rows[0]) {
        fuelCardData = {
          totalRequests: parseInt(fuelCardResult.rows[0].total_requests) || 0,
          totalValue: parseFloat(fuelCardResult.rows[0].total_value) || 0,
          approvedRequests: parseInt(fuelCardResult.rows[0].approved_requests) || 0
        };
      }
    } catch (error) {
      console.error('Erro ao obter dados de fuel card:', error);
    }

    res.json({
      totalRefuels: parseInt(fuelData.total_refuels),
      totalLiters: {
        diesel: parseFloat(fuelData.diesel_liters),
        gasoline: parseFloat(fuelData.gasoline_liters),
        alcohol: parseFloat(fuelData.alcohol_liters)
      },
      averageConsumption,
      monthlyData,
      fuelCard: fuelCardData
    });

  } catch (error) {
    console.error('Erro ao obter dados de combustível:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para buscar veículos em manutenção por oficina
router.get('/vehicles-by-workshop', async (req, res) => {
  try {
    console.log('[OPERATIONAL-DASHBOARD] Requisição de veículos por oficina recebida');
    const { workshop } = req.query;

    if (!workshop) {
      return res.status(400).json({ error: 'Nome da oficina é obrigatório' });
    }

    // Query para buscar veículos de uma oficina específica
    const vehiclesQuery = `
      SELECT * FROM (
        -- Tabela principal manutencao
        SELECT 
          m.id,
          v.plate as placa,
          v.model as modelo,
          v.brand as marca,
          EXTRACT(DAY FROM NOW() - m.data_entrada) as dias_parado,
          m.data_entrada,
          m.status,
          m.descricao,
          COALESCE(m.custo, 0) as valor_total,
          w.nome as oficina
        FROM manutencao m
        JOIN vehicles v ON m.veiculo_id = v.id
        JOIN workshops w ON m.oficina_id = w.id
        WHERE m.status IN ('pendente', 'em_andamento', 'aguardando_pecas')
          AND m.oficina_id IN (2, 6)
          AND w.nome = $1
        
        UNION ALL
        
        -- Tabela específica Murici  
        SELECT 
          om.id,
          om.veiculo_placa as placa,
          om.veiculo_modelo as modelo,
          om.veiculo_marca as marca,
          EXTRACT(DAY FROM NOW() - om.data_entrada) as dias_parado,
          om.data_entrada,
          om.status,
          om.descricao_servico as descricao,
          COALESCE(om.custo_total, 0) as valor_total,
          'Oficina Murici' as oficina
        FROM oficina_murici_manutencoes om
        WHERE om.status IN ('pendente', 'em_andamento', 'aguardando_pecas')
          AND 'Oficina Murici' = $1
      ) as combined_vehicles
      ORDER BY dias_parado DESC
    `;

    const vehiclesResult = await pool.query(vehiclesQuery, [workshop]);
    console.log(`[OPERATIONAL-DASHBOARD] Veículos encontrados para ${workshop}: ${vehiclesResult.rows.length}`);

    res.json({ 
      success: true,
      vehicles: vehiclesResult.rows 
    });
  } catch (error) {
    console.error('[OPERATIONAL-DASHBOARD] Erro ao buscar veículos por oficina:', error);
    res.status(500).json({ error: 'Erro ao buscar veículos da oficina' });
  }
});

// Endpoint para dados de manutenção por oficina
router.get('/maintenance-by-workshop', async (req, res) => {
  try {
    console.log('[OPERATIONAL-DASHBOARD] Requisição de manutenção por oficina recebida');
    
    // Query para buscar dados agrupados por oficina
    const maintenanceByWorkshopQuery = `
      WITH todas_manutencoes AS (
        -- Dados da tabela principal manutencao
        SELECT 
          CASE 
            WHEN m.oficina_id = 2 THEN 'Oficina Alair'
            WHEN m.oficina_id = 6 THEN 'Oficina Murici'
            ELSE COALESCE(w.nome, 'Oficina não identificada')
          END as oficina,
          m.status,
          COALESCE(m.custo, 0) as valor_total,
          EXTRACT(DAY FROM (COALESCE(m.data_conclusao, NOW()) - m.created_at)) as dias_em_manutencao
        FROM manutencao m
        LEFT JOIN workshops w ON m.oficina_id = w.id
        WHERE m.oficina_id IN (2, 6)
        
        UNION ALL
        
        -- Dados da tabela específica da Oficina Murici
        SELECT 
          'Oficina Murici' as oficina,
          om.status,
          COALESCE(om.custo_total, 0) as valor_total,
          EXTRACT(DAY FROM (COALESCE(om.data_hora_fim, NOW()) - om.created_at)) as dias_em_manutencao
        FROM oficina_murici_manutencoes om
      )
      SELECT 
        oficina,
        COUNT(CASE WHEN status IN ('pendente', 'em_andamento', 'aguardando_pecas') THEN 1 END) as em_andamento,
        COUNT(CASE WHEN status = 'concluido' THEN 1 END) as finalizadas,
        SUM(valor_total) as valor_total,
        ROUND(AVG(dias_em_manutencao), 1) as tempo_medio_dias,
        COUNT(CASE WHEN dias_em_manutencao > 3 AND status IN ('pendente', 'em_andamento', 'aguardando_pecas') THEN 1 END) as veiculos_atrasados
      FROM todas_manutencoes
      GROUP BY oficina
      ORDER BY oficina
    `;
    
    const result = await pool.query(maintenanceByWorkshopQuery);
    
    res.json({
      workshops: result.rows
    });
    
  } catch (error) {
    console.error('Erro ao obter dados de manutenção por oficina:', error);
    res.status(500).json({ error: 'Erro ao obter dados de manutenção por oficina' });
  }
});

export default router;