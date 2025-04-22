import { Request, Response } from 'express';
import { db, pool } from './db';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Obter dados para o Dashboard Executivo
 */
export async function getExecutiveDashboard(req: Request, res: Response) {
  try {
    // Determinar o mês de referência com base na query ou usar o mês atual
    let targetDate = new Date();
    if (req.query.date) {
      targetDate = new Date(req.query.date as string);
    }
    
    // Definir período de referência
    const startOfCurrentMonth = startOfMonth(targetDate);
    const endOfCurrentMonth = endOfMonth(targetDate);
    
    // Período do mês anterior para comparativos
    const previousMonthDate = subMonths(targetDate, 1);
    const startOfPreviousMonth = startOfMonth(previousMonthDate);
    const endOfPreviousMonth = endOfMonth(previousMonthDate);
    
    // Formatar o mês para exibição
    const formattedMonth = format(targetDate, 'MMMM yyyy', { locale: ptBR });
    
    // 1. Obter KPIs de Gastos com Combustível
    const fuelExpensesQuery = `
      SELECT 
        COALESCE(SUM(valor_total), 0) AS total_atual,
        COALESCE(SUM(litros), 0) AS litros_total
      FROM abastecimentos
      WHERE data_abastecimento >= $1 AND data_abastecimento <= $2
    `;
    
    const previousFuelExpensesQuery = `
      SELECT 
        COALESCE(SUM(valor_total), 0) AS total_anterior,
        COALESCE(SUM(litros), 0) AS litros_anterior
      FROM abastecimentos
      WHERE data_abastecimento >= $1 AND data_abastecimento <= $2
    `;
    
    // 2. Consulta para gastos com peças
    const partsExpensesQuery = `
      SELECT 
        COALESCE(SUM(custo_pecas), 0) AS total_atual
      FROM manutencoes
      WHERE data_inicio >= $1 AND data_inicio <= $2
    `;
    
    const previousPartsExpensesQuery = `
      SELECT 
        COALESCE(SUM(custo_pecas), 0) AS total_anterior
      FROM manutencoes
      WHERE data_inicio >= $1 AND data_inicio <= $2
    `;
    
    // 3. Consulta para gastos com pneus
    const tiresExpensesQuery = `
      SELECT 
        COALESCE(SUM(valor_unitario * quantidade), 0) AS total_atual
      FROM solicitacoes_pneus
      WHERE data_solicitacao >= $1 AND data_solicitacao <= $2 AND status = 'aprovada'
    `;
    
    const previousTiresExpensesQuery = `
      SELECT 
        COALESCE(SUM(valor_unitario * quantidade), 0) AS total_anterior
      FROM solicitacoes_pneus
      WHERE data_solicitacao >= $1 AND data_solicitacao <= $2 AND status = 'aprovada'
    `;
    
    // 4. Consulta para veículos inativos
    const inactiveVehiclesQuery = `
      SELECT 
        COUNT(*) AS total_atual,
        COALESCE(SUM(EXTRACT(DAY FROM (CASE 
          WHEN data_fim IS NULL THEN CURRENT_DATE 
          ELSE data_fim 
        END) - data_inicio)), 0) AS dias_total
      FROM manutencoes
      WHERE (data_inicio >= $1 AND data_inicio <= $2)
        OR (data_inicio < $1 AND (data_fim IS NULL OR data_fim > $1))
    `;
    
    const previousInactiveVehiclesQuery = `
      SELECT 
        COUNT(*) AS total_anterior,
        COALESCE(SUM(EXTRACT(DAY FROM (CASE 
          WHEN data_fim IS NULL THEN CURRENT_DATE 
          ELSE data_fim 
        END) - data_inicio)), 0) AS dias_anterior
      FROM manutencoes
      WHERE (data_inicio >= $1 AND data_inicio <= $2)
        OR (data_inicio < $1 AND (data_fim IS NULL OR data_fim > $1))
    `;
    
    // 5. Consulta para uso de pneus
    const tireUsageQuery = `
      SELECT 
        COUNT(*) AS total_atual
      FROM montagem_pneus
      WHERE data_montagem >= $1 AND data_montagem <= $2
    `;
    
    const previousTireUsageQuery = `
      SELECT 
        COUNT(*) AS total_anterior
      FROM montagem_pneus
      WHERE data_montagem >= $1 AND data_montagem <= $2
    `;
    
    // 6. Consulta para disponibilidade da frota
    const fleetAvailabilityQuery = `
      WITH total_veiculos AS (
        SELECT COUNT(DISTINCT placa) AS total FROM veiculos WHERE is_active = true
      ),
      veiculos_manutencao AS (
        SELECT COUNT(DISTINCT placa) AS em_manutencao 
        FROM manutencoes 
        WHERE (data_inicio <= $2 AND (data_fim IS NULL OR data_fim >= $1))
          AND status != 'concluida' AND status != 'cancelada'
      )
      SELECT 
        tv.total as frota_total,
        COALESCE(vm.em_manutencao, 0) as em_manutencao,
        CASE 
          WHEN tv.total > 0 THEN 
            ROUND(((tv.total - COALESCE(vm.em_manutencao, 0)) * 100.0 / tv.total), 1)
          ELSE 0
        END as disponibilidade
      FROM total_veiculos tv
      CROSS JOIN veiculos_manutencao vm
    `;
    
    const previousFleetAvailabilityQuery = `
      WITH total_veiculos AS (
        SELECT COUNT(DISTINCT placa) AS total FROM veiculos WHERE is_active = true
      ),
      veiculos_manutencao AS (
        SELECT COUNT(DISTINCT placa) AS em_manutencao 
        FROM manutencoes 
        WHERE (data_inicio <= $2 AND (data_fim IS NULL OR data_fim >= $1))
          AND status != 'concluida' AND status != 'cancelada'
      )
      SELECT 
        tv.total as frota_total,
        COALESCE(vm.em_manutencao, 0) as em_manutencao,
        CASE 
          WHEN tv.total > 0 THEN 
            ROUND(((tv.total - COALESCE(vm.em_manutencao, 0)) * 100.0 / tv.total), 1)
          ELSE 0
        END as disponibilidade
      FROM total_veiculos tv
      CROSS JOIN veiculos_manutencao vm
    `;
    
    // 7. Consulta para SLA de oficinas
    const workshopSLAQuery = `
      SELECT 
        AVG(EXTRACT(DAY FROM (CASE 
          WHEN data_fim IS NULL THEN CURRENT_DATE 
          ELSE data_fim 
        END) - data_inicio)) AS media_dias_atual
      FROM manutencoes
      WHERE data_inicio >= $1 AND data_inicio <= $2
        AND status = 'concluida'
    `;
    
    const previousWorkshopSLAQuery = `
      SELECT 
        AVG(EXTRACT(DAY FROM (CASE 
          WHEN data_fim IS NULL THEN CURRENT_DATE 
          ELSE data_fim 
        END) - data_inicio)) AS media_dias_anterior
      FROM manutencoes
      WHERE data_inicio >= $1 AND data_inicio <= $2
        AND status = 'concluida'
    `;
    
    // 8. Consulta para solicitações abertas/fechadas
    const requestsQuery = `
      SELECT 
        COUNT(*) AS total_atual,
        COUNT(*) FILTER (WHERE status = 'concluida') AS concluidas_atual,
        COUNT(*) FILTER (WHERE status != 'concluida' AND status != 'cancelada') AS abertas_atual
      FROM manutencoes
      WHERE data_inicio >= $1 AND data_inicio <= $2
    `;
    
    const previousRequestsQuery = `
      SELECT 
        COUNT(*) AS total_anterior,
        COUNT(*) FILTER (WHERE status = 'concluida') AS concluidas_anterior,
        COUNT(*) FILTER (WHERE status != 'concluida' AND status != 'cancelada') AS abertas_anterior
      FROM manutencoes
      WHERE data_inicio >= $1 AND data_inicio <= $2
    `;
    
    // 9. Consumo médio de combustível
    const avgFuelConsumptionQuery = `
      SELECT 
        CASE 
          WHEN SUM(km_atual - km_anterior) > 0 THEN 
            ROUND((SUM(litros) * 100) / SUM(km_atual - km_anterior), 2)
          ELSE 0
        END AS media_consumo_atual
      FROM abastecimentos
      WHERE data_abastecimento >= $1 AND data_abastecimento <= $2
        AND km_atual > km_anterior
    `;
    
    const previousAvgFuelConsumptionQuery = `
      SELECT 
        CASE 
          WHEN SUM(km_atual - km_anterior) > 0 THEN 
            ROUND((SUM(litros) * 100) / SUM(km_atual - km_anterior), 2)
          ELSE 0
        END AS media_consumo_anterior
      FROM abastecimentos
      WHERE data_abastecimento >= $1 AND data_abastecimento <= $2
        AND km_atual > km_anterior
    `;
    
    // 10. Consulta para consumo de combustível por base
    const fuelByBaseQuery = `
      SELECT 
        u.base,
        COALESCE(SUM(a.litros), 0) AS litros
      FROM abastecimentos a
      JOIN users u ON a.user_id = u.id
      WHERE a.data_abastecimento >= $1 AND a.data_abastecimento <= $2
      GROUP BY u.base
      ORDER BY litros DESC
    `;
    
    const previousFuelByBaseQuery = `
      SELECT 
        u.base,
        COALESCE(SUM(a.litros), 0) AS litros
      FROM abastecimentos a
      JOIN users u ON a.user_id = u.id
      WHERE a.data_abastecimento >= $1 AND a.data_abastecimento <= $2
      GROUP BY u.base
      ORDER BY litros DESC
    `;
    
    // 11. Consulta para distribuição de despesas
    const expenseDistributionQuery = `
      WITH fuel_expenses AS (
        SELECT COALESCE(SUM(valor_total), 0) AS valor FROM abastecimentos
        WHERE data_abastecimento >= $1 AND data_abastecimento <= $2
      ),
      maintenance_expenses AS (
        SELECT 
          COALESCE(SUM(custo_pecas), 0) AS pecas,
          COALESCE(SUM(custo_servico), 0) AS servico
        FROM manutencoes
        WHERE data_inicio >= $1 AND data_inicio <= $2
      ),
      tire_expenses AS (
        SELECT COALESCE(SUM(valor_unitario * quantidade), 0) AS valor
        FROM solicitacoes_pneus
        WHERE data_solicitacao >= $1 AND data_solicitacao <= $2 AND status = 'aprovada'
      )
      SELECT 
        'Combustível' AS categoria,
        fe.valor AS valor,
        '#3B82F6' AS cor
      FROM fuel_expenses fe
      UNION ALL
      SELECT 
        'Peças' AS categoria,
        me.pecas AS valor,
        '#10B981' AS cor
      FROM maintenance_expenses me
      UNION ALL
      SELECT 
        'Serviços' AS categoria,
        me.servico AS valor,
        '#F59E0B' AS cor
      FROM maintenance_expenses me
      UNION ALL
      SELECT 
        'Pneus' AS categoria,
        te.valor AS valor,
        '#EF4444' AS cor
      FROM tire_expenses te
    `;
    
    // 12. Consulta para veículos com maior custo operacional
    const topVehiclesCostQuery = `
      WITH fuel_costs AS (
        SELECT 
          placa,
          SUM(valor_total) AS custo_combustivel,
          SUM(litros) AS litros_combustivel,
          SUM(km_atual - km_anterior) AS km_percorrido
        FROM abastecimentos
        WHERE data_abastecimento >= $1 AND data_abastecimento <= $2
          AND km_atual > km_anterior
        GROUP BY placa
      ),
      maintenance_costs AS (
        SELECT 
          placa,
          SUM(custo_pecas + custo_servico) AS custo_manutencao
        FROM manutencoes
        WHERE data_inicio >= $1 AND data_inicio <= $2
        GROUP BY placa
      ),
      tire_costs AS (
        SELECT 
          sp.placa,
          SUM(sp.valor_unitario * sp.quantidade) AS custo_pneus
        FROM solicitacoes_pneus sp
        WHERE sp.data_solicitacao >= $1 AND sp.data_solicitacao <= $2
          AND sp.status = 'aprovada'
        GROUP BY sp.placa
      ),
      veiculos_info AS (
        SELECT placa, modelo FROM veiculos
      )
      SELECT 
        v.placa,
        v.modelo,
        COALESCE(fc.custo_combustivel, 0) + COALESCE(mc.custo_manutencao, 0) + COALESCE(tc.custo_pneus, 0) AS custo_total,
        COALESCE(fc.km_percorrido, 0) AS km_total,
        CASE 
          WHEN COALESCE(fc.km_percorrido, 0) > 0 THEN 
            ROUND((COALESCE(fc.custo_combustivel, 0) + COALESCE(mc.custo_manutencao, 0) + COALESCE(tc.custo_pneus, 0)) / COALESCE(fc.km_percorrido, 1), 2)
          ELSE 0
        END AS custo_por_km
      FROM veiculos_info v
      LEFT JOIN fuel_costs fc ON v.placa = fc.placa
      LEFT JOIN maintenance_costs mc ON v.placa = mc.placa
      LEFT JOIN tire_costs tc ON v.placa = tc.placa
      WHERE COALESCE(fc.custo_combustivel, 0) + COALESCE(mc.custo_manutencao, 0) + COALESCE(tc.custo_pneus, 0) > 0
      ORDER BY custo_total DESC
      LIMIT 10
    `;
    
    // 13. Consulta para manutenções recentes
    const recentMaintenancesQuery = `
      SELECT 
        m.id,
        m.data_inicio,
        m.data_fim,
        m.placa,
        v.modelo,
        m.descricao,
        m.status,
        m.custo_pecas + m.custo_servico AS custo_total,
        u.base
      FROM manutencoes m
      JOIN veiculos v ON m.placa = v.placa
      JOIN users u ON m.user_id = u.id
      WHERE m.data_inicio >= $1 AND m.data_inicio <= $2
      ORDER BY m.data_inicio DESC
      LIMIT 10
    `;
    
    // Executar todas as consultas em paralelo
    const [
      fuelExpensesResult,
      previousFuelExpensesResult,
      partsExpensesResult,
      previousPartsExpensesResult,
      tiresExpensesResult,
      previousTiresExpensesResult,
      inactiveVehiclesResult,
      previousInactiveVehiclesResult,
      tireUsageResult,
      previousTireUsageResult,
      fleetAvailabilityResult,
      previousFleetAvailabilityResult,
      workshopSLAResult,
      previousWorkshopSLAResult,
      requestsResult,
      previousRequestsResult,
      avgFuelConsumptionResult,
      previousAvgFuelConsumptionResult,
      fuelByBaseResult,
      previousFuelByBaseResult,
      expenseDistributionResult,
      topVehiclesCostResult,
      recentMaintenancesResult
    ] = await Promise.all([
      pool.query(fuelExpensesQuery, [startOfCurrentMonth.toISOString(), endOfCurrentMonth.toISOString()]),
      pool.query(previousFuelExpensesQuery, [startOfPreviousMonth.toISOString(), endOfPreviousMonth.toISOString()]),
      pool.query(partsExpensesQuery, [startOfCurrentMonth.toISOString(), endOfCurrentMonth.toISOString()]),
      pool.query(previousPartsExpensesQuery, [startOfPreviousMonth.toISOString(), endOfPreviousMonth.toISOString()]),
      pool.query(tiresExpensesQuery, [startOfCurrentMonth.toISOString(), endOfCurrentMonth.toISOString()]),
      pool.query(previousTiresExpensesQuery, [startOfPreviousMonth.toISOString(), endOfPreviousMonth.toISOString()]),
      pool.query(inactiveVehiclesQuery, [startOfCurrentMonth.toISOString(), endOfCurrentMonth.toISOString()]),
      pool.query(previousInactiveVehiclesQuery, [startOfPreviousMonth.toISOString(), endOfPreviousMonth.toISOString()]),
      pool.query(tireUsageQuery, [startOfCurrentMonth.toISOString(), endOfCurrentMonth.toISOString()]),
      pool.query(previousTireUsageQuery, [startOfPreviousMonth.toISOString(), endOfPreviousMonth.toISOString()]),
      pool.query(fleetAvailabilityQuery, [startOfCurrentMonth.toISOString(), endOfCurrentMonth.toISOString()]),
      pool.query(previousFleetAvailabilityQuery, [startOfPreviousMonth.toISOString(), endOfPreviousMonth.toISOString()]),
      pool.query(workshopSLAQuery, [startOfCurrentMonth.toISOString(), endOfCurrentMonth.toISOString()]),
      pool.query(previousWorkshopSLAQuery, [startOfPreviousMonth.toISOString(), endOfPreviousMonth.toISOString()]),
      pool.query(requestsQuery, [startOfCurrentMonth.toISOString(), endOfCurrentMonth.toISOString()]),
      pool.query(previousRequestsQuery, [startOfPreviousMonth.toISOString(), endOfPreviousMonth.toISOString()]),
      pool.query(avgFuelConsumptionQuery, [startOfCurrentMonth.toISOString(), endOfCurrentMonth.toISOString()]),
      pool.query(previousAvgFuelConsumptionQuery, [startOfPreviousMonth.toISOString(), endOfPreviousMonth.toISOString()]),
      pool.query(fuelByBaseQuery, [startOfCurrentMonth.toISOString(), endOfCurrentMonth.toISOString()]),
      pool.query(previousFuelByBaseQuery, [startOfPreviousMonth.toISOString(), endOfPreviousMonth.toISOString()]),
      pool.query(expenseDistributionQuery, [startOfCurrentMonth.toISOString(), endOfCurrentMonth.toISOString()]),
      pool.query(topVehiclesCostQuery, [startOfCurrentMonth.toISOString(), endOfCurrentMonth.toISOString()]),
      pool.query(recentMaintenancesQuery, [startOfCurrentMonth.toISOString(), endOfCurrentMonth.toISOString()])
    ]);
    
    // Processar dados dos KPIs
    const fuelExpenses = fuelExpensesResult.rows[0];
    const previousFuelExpenses = previousFuelExpensesResult.rows[0];
    const fuelExpenseChange = previousFuelExpenses.total_anterior > 0 
      ? Math.round(((fuelExpenses.total_atual - previousFuelExpenses.total_anterior) / previousFuelExpenses.total_anterior) * 100) 
      : 0;
    
    const partsExpenses = partsExpensesResult.rows[0];
    const previousPartsExpenses = previousPartsExpensesResult.rows[0];
    const partsExpenseChange = previousPartsExpenses.total_anterior > 0 
      ? Math.round(((partsExpenses.total_atual - previousPartsExpenses.total_anterior) / previousPartsExpenses.total_anterior) * 100) 
      : 0;
    
    const tiresExpenses = tiresExpensesResult.rows[0];
    const previousTiresExpenses = previousTiresExpensesResult.rows[0];
    const tiresExpenseChange = previousTiresExpenses.total_anterior > 0 
      ? Math.round(((tiresExpenses.total_atual - previousTiresExpenses.total_anterior) / previousTiresExpenses.total_anterior) * 100) 
      : 0;
    
    const inactiveVehicles = inactiveVehiclesResult.rows[0];
    const previousInactiveVehicles = previousInactiveVehiclesResult.rows[0];
    const inactiveVehiclesChange = previousInactiveVehicles.total_anterior > 0 
      ? Math.round(((inactiveVehicles.total_atual - previousInactiveVehicles.total_anterior) / previousInactiveVehicles.total_anterior) * 100) 
      : 0;
    
    const tireUsage = tireUsageResult.rows[0];
    const previousTireUsage = previousTireUsageResult.rows[0];
    const tireUsageChange = previousTireUsage.total_anterior > 0 
      ? Math.round(((tireUsage.total_atual - previousTireUsage.total_anterior) / previousTireUsage.total_anterior) * 100) 
      : 0;
    
    const fleetAvailability = fleetAvailabilityResult.rows[0];
    const previousFleetAvailability = previousFleetAvailabilityResult.rows[0];
    const fleetAvailabilityChange = previousFleetAvailability.disponibilidade > 0 
      ? Math.round(((fleetAvailability.disponibilidade - previousFleetAvailability.disponibilidade) / previousFleetAvailability.disponibilidade) * 100) 
      : 0;
    
    const workshopSLA = workshopSLAResult.rows[0];
    const previousWorkshopSLA = previousWorkshopSLAResult.rows[0];
    const workshopSLAChange = previousWorkshopSLA.media_dias_anterior > 0 
      ? Math.round(((workshopSLA.media_dias_atual - previousWorkshopSLA.media_dias_anterior) / previousWorkshopSLA.media_dias_anterior) * 100) 
      : 0;
    
    const requests = requestsResult.rows[0];
    const previousRequests = previousRequestsResult.rows[0];
    
    const avgFuelConsumption = avgFuelConsumptionResult.rows[0];
    const previousAvgFuelConsumption = previousAvgFuelConsumptionResult.rows[0];
    const avgFuelConsumptionChange = previousAvgFuelConsumption.media_consumo_anterior > 0 
      ? Math.round(((avgFuelConsumption.media_consumo_atual - previousAvgFuelConsumption.media_consumo_anterior) / previousAvgFuelConsumption.media_consumo_anterior) * 100) 
      : 0;
    
    // Processar dados de consumo por base
    const fuelByBase = fuelByBaseResult.rows;
    const previousFuelByBase = previousFuelByBaseResult.rows;
    
    // Adicionar dados de percentual de variação
    const fuelConsumptionByBase = fuelByBase.map(base => {
      const previousBase = previousFuelByBase.find(prev => prev.base === base.base);
      const previousLitros = previousBase ? parseFloat(previousBase.litros) : 0;
      const changePercentage = previousLitros > 0 
        ? Math.round(((parseFloat(base.litros) - previousLitros) / previousLitros) * 100) 
        : 0;
        
      return {
        base: base.base,
        litros: parseFloat(base.litros),
        previousLitros,
        changePercentage
      };
    });
    
    // Processar dados de distribuição de despesas
    const expenseDistribution = expenseDistributionResult.rows;
    
    // Calcular o total de despesas para obter os percentuais
    const totalExpenses = expenseDistribution.reduce((sum, item) => sum + parseFloat(item.valor), 0);
    
    // Adicionar percentual a cada item de despesa
    const processedExpenseDistribution = expenseDistribution.map(item => ({
      category: item.categoria,
      value: parseFloat(item.valor),
      percentage: totalExpenses > 0 ? Math.round((parseFloat(item.valor) / totalExpenses) * 100) : 0,
      color: item.cor
    }));
    
    // Processar dados de veículos com maior custo
    const topVehiclesCost = topVehiclesCostResult.rows.map(vehicle => ({
      plate: vehicle.placa,
      model: vehicle.modelo,
      costType: 'Operacional',
      totalCost: parseFloat(vehicle.custo_total),
      avgCostPerKm: parseFloat(vehicle.custo_por_km),
      totalKm: parseInt(vehicle.km_total)
    }));
    
    // Processar dados de manutenções recentes
    const recentMaintenances = recentMaintenancesResult.rows.map(maintenance => ({
      id: maintenance.id,
      date: format(parseISO(maintenance.data_inicio), 'dd/MM/yyyy'),
      vehiclePlate: maintenance.placa,
      vehicleModel: maintenance.modelo,
      description: maintenance.descricao,
      status: maintenance.status,
      cost: parseFloat(maintenance.custo_total),
      base: maintenance.base
    }));
    
    // Montar objeto de resposta
    const dashboardData = {
      // KPIs
      kpis: {
        fuelExpenses: {
          title: 'Gastos com Combustível',
          value: parseFloat(fuelExpenses.total_atual),
          unit: 'R$',
          previousValue: parseFloat(previousFuelExpenses.total_anterior),
          changePercentage: fuelExpenseChange,
          trend: fuelExpenseChange > 0 ? 'up' : fuelExpenseChange < 0 ? 'down' : 'neutral',
          isPositive: false,
          color: 'primary'
        },
        partsExpenses: {
          title: 'Gastos com Peças',
          value: parseFloat(partsExpenses.total_atual),
          unit: 'R$',
          previousValue: parseFloat(previousPartsExpenses.total_anterior),
          changePercentage: partsExpenseChange,
          trend: partsExpenseChange > 0 ? 'up' : partsExpenseChange < 0 ? 'down' : 'neutral',
          isPositive: false,
          color: 'warning'
        },
        tiresExpenses: {
          title: 'Gastos com Pneus',
          value: parseFloat(tiresExpenses.total_atual),
          unit: 'R$',
          previousValue: parseFloat(previousTiresExpenses.total_anterior),
          changePercentage: tiresExpenseChange,
          trend: tiresExpenseChange > 0 ? 'up' : tiresExpenseChange < 0 ? 'down' : 'neutral',
          isPositive: false,
          color: 'danger'
        },
        daysInactive: {
          title: 'Dias Inativos (Total)',
          value: parseFloat(inactiveVehicles.dias_total),
          unit: 'dias',
          previousValue: parseFloat(previousInactiveVehicles.dias_anterior),
          changePercentage: inactiveVehiclesChange,
          trend: inactiveVehiclesChange > 0 ? 'up' : inactiveVehiclesChange < 0 ? 'down' : 'neutral',
          isPositive: false,
          color: 'danger'
        },
        tireUsage: {
          title: 'Pneus Montados',
          value: parseInt(tireUsage.total_atual),
          previousValue: parseInt(previousTireUsage.total_anterior),
          changePercentage: tireUsageChange,
          trend: tireUsageChange > 0 ? 'up' : tireUsageChange < 0 ? 'down' : 'neutral',
          isPositive: true,
          color: 'info'
        },
        fleetAvailability: {
          title: 'Disponibilidade da Frota',
          value: parseFloat(fleetAvailability.disponibilidade || 0),
          unit: '%',
          previousValue: parseFloat(previousFleetAvailability.disponibilidade || 0),
          changePercentage: fleetAvailabilityChange,
          trend: fleetAvailabilityChange > 0 ? 'up' : fleetAvailabilityChange < 0 ? 'down' : 'neutral',
          isPositive: true,
          color: 'success'
        },
        workshopSLA: {
          title: 'Tempo Médio em Oficina',
          value: parseFloat(workshopSLA.media_dias_atual || 0),
          unit: 'dias',
          previousValue: parseFloat(previousWorkshopSLA.media_dias_anterior || 0),
          changePercentage: workshopSLAChange,
          trend: workshopSLAChange > 0 ? 'up' : workshopSLAChange < 0 ? 'down' : 'neutral',
          isPositive: false,
          color: 'warning'
        },
        openClosedRequests: {
          title: 'Solicitações Abertas/Concluídas',
          value: `${requests.abertas_atual}/${requests.concluidas_atual}`,
          previousValue: `${previousRequests.abertas_anterior}/${previousRequests.concluidas_anterior}`,
          color: 'primary'
        },
        avgFuelConsumption: {
          title: 'Consumo Médio de Combustível',
          value: parseFloat(avgFuelConsumption.media_consumo_atual || 0),
          unit: 'L/100km',
          previousValue: parseFloat(previousAvgFuelConsumption.media_consumo_anterior || 0),
          changePercentage: avgFuelConsumptionChange,
          trend: avgFuelConsumptionChange > 0 ? 'up' : avgFuelConsumptionChange < 0 ? 'down' : 'neutral',
          isPositive: false,
          color: 'info'
        }
      },
      
      // Gráficos
      fuelConsumptionByBase,
      expenseDistribution: processedExpenseDistribution,
      topVehiclesCost,
      recentMaintenances,
      
      // Dados de referência
      referenceDate: formattedMonth,
      updateTime: format(new Date(), 'dd/MM/yyyy HH:mm:ss')
    };
    
    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Erro ao obter dados do dashboard executivo:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor ao obter dados do dashboard executivo',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}