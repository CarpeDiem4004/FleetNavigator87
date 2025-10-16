import { Request, Response } from 'express';
import { db } from './db';
import { pool } from './db';
import { startOfMonth, endOfMonth, subMonths, isBefore, addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PainelPrincipalData {
  id: number;
  data: Date | string; // Nome real da coluna no banco de dados
  total_km_frota: number;
  total_litros_diesel: number;
  media_diesel_km: number;
  total_manutencoes: number;
  custo_manutencoes: number;
  tempo_medio_manutencao: number;
  veiculos_ativos: number;
  veiculos_manutencao: number;
  economia_combustivel: number;
  tendencia_consumo: string;
  alertas_criticos: number;
  pneus_substituidos: number;
  base_id: number;
}

/**
 * Retorna os KPIs do dashboard no formato esperado pelo frontend
 */
export async function getDashboardKPIs(req: Request, res: Response) {
  try {
    // Buscar dados do mês atual ou do mês especificado na query
    let targetDate = new Date();
    
    if (req.query.date) {
      targetDate = new Date(req.query.date as string);
    }
    
    // Datas do mês atual e anterior
    const startOfTargetMonth = startOfMonth(targetDate);
    const endOfTargetMonth = endOfMonth(targetDate);
    const startOfPreviousMonth = startOfMonth(subMonths(targetDate, 1));
    const endOfPreviousMonth = endOfMonth(subMonths(targetDate, 1));
    
    // Formatar o mês atual para exibição (ex: "abril 2025")
    const formattedMonth = format(targetDate, 'MMMM yyyy', { locale: ptBR });

    // === CONSULTAS PARALELAS ===
    
    // 1. Veículos
    const vehiclesResult = await pool.query(
      `SELECT 
        COUNT(*) as total_vehicles,
        COUNT(CASE WHEN status = 'em_operacao' THEN 1 END) as veiculos_ativos,
        COUNT(CASE WHEN status = 'em_manutencao' THEN 1 END) as veiculos_manutencao_status,
        COUNT(CASE WHEN status = 'parado' THEN 1 END) as veiculos_parados
       FROM vehicles`
    );

    // 2. Combustível mês atual
    const fuelCurrentResult = await pool.query(
      `SELECT 
        COALESCE(SUM(quantidade_litros), 0) as total_litros,
        COALESCE(SUM(km), 0) as total_km,
        COALESCE(SUM(valor_total), 0) as custo_total,
        CASE 
          WHEN SUM(quantidade_litros) > 0 THEN ROUND(SUM(km)::numeric / SUM(quantidade_litros)::numeric, 2) 
          ELSE 0 
        END as media_km_litro
       FROM historico_consolidado_abastecimentos 
       WHERE created_at >= $1 AND created_at <= $2`,
      [startOfTargetMonth.toISOString(), endOfTargetMonth.toISOString()]
    );

    // 3. Combustível mês anterior
    const fuelPreviousResult = await pool.query(
      `SELECT 
        COALESCE(SUM(quantidade_litros), 0) as total_litros,
        COALESCE(SUM(km), 0) as total_km,
        COALESCE(SUM(valor_total), 0) as custo_total,
        CASE 
          WHEN SUM(quantidade_litros) > 0 THEN ROUND(SUM(km)::numeric / SUM(quantidade_litros)::numeric, 2) 
          ELSE 0 
        END as media_km_litro
       FROM historico_consolidado_abastecimentos 
       WHERE created_at >= $1 AND created_at <= $2`,
      [startOfPreviousMonth.toISOString(), endOfPreviousMonth.toISOString()]
    );

    // 4. Manutenção mês atual (car_receptions)
    const maintenanceCurrentResult = await pool.query(
      `SELECT 
        COUNT(*) as total_manutencoes,
        COUNT(CASE WHEN status IN ('recebido', 'em_analise', 'aguardando_pecas', 'em_reparo') THEN 1 END) as em_andamento,
        SUM(COALESCE(labor_cost::numeric, 0) + COALESCE(parts_cost::numeric, 0)) as custo_total,
        AVG(CASE WHEN created_at IS NOT NULL AND (delivered_date IS NOT NULL OR completed_date IS NOT NULL) 
                 THEN EXTRACT(days FROM COALESCE(delivered_date, completed_date) - created_at) 
                 END) as tempo_medio_dias
       FROM car_receptions 
       WHERE created_at >= $1 AND created_at <= $2`,
      [startOfTargetMonth.toISOString(), endOfTargetMonth.toISOString()]
    );

    // 5. Manutenção mês anterior
    const maintenancePreviousResult = await pool.query(
      `SELECT 
        COUNT(*) as total_manutencoes,
        SUM(COALESCE(labor_cost::numeric, 0) + COALESCE(parts_cost::numeric, 0)) as custo_total,
        AVG(CASE WHEN created_at IS NOT NULL AND (delivered_date IS NOT NULL OR completed_date IS NOT NULL) 
                 THEN EXTRACT(days FROM COALESCE(delivered_date, completed_date) - created_at) 
                 END) as tempo_medio_dias
       FROM car_receptions 
       WHERE created_at >= $1 AND created_at <= $2`,
      [startOfPreviousMonth.toISOString(), endOfPreviousMonth.toISOString()]
    );

    // 6. Top Veículos por Custo Operacional (combustível + manutenção) - com CTEs para evitar duplicação
    const topCostVehiclesResult = await pool.query(
      `WITH fuel_costs AS (
        SELECT placa, SUM(valor_total) as custo_combustivel
        FROM historico_consolidado_abastecimentos
        WHERE created_at >= $1 AND created_at <= $2
        GROUP BY placa
      ),
      maintenance_costs AS (
        SELECT placa, SUM(COALESCE(labor_cost::numeric, 0) + COALESCE(parts_cost::numeric, 0)) as custo_manutencao
        FROM car_receptions
        WHERE created_at >= $1 AND created_at <= $2
        GROUP BY placa
      )
      SELECT 
        v.placa,
        v.modelo,
        COALESCE(fc.custo_combustivel, 0) as custo_combustivel,
        COALESCE(mc.custo_manutencao, 0) as custo_manutencao,
        (COALESCE(fc.custo_combustivel, 0) + COALESCE(mc.custo_manutencao, 0)) as custo_total
      FROM vehicles v
      LEFT JOIN fuel_costs fc ON v.placa = fc.placa
      LEFT JOIN maintenance_costs mc ON v.placa = mc.placa
      WHERE (COALESCE(fc.custo_combustivel, 0) + COALESCE(mc.custo_manutencao, 0)) > 0
      ORDER BY custo_total DESC
      LIMIT 10`,
      [startOfTargetMonth.toISOString(), endOfTargetMonth.toISOString()]
    );

    // 7. Manutenções Recentes
    const maintenanceRecordsResult = await pool.query(
      `SELECT 
        cr.id,
        cr.placa,
        v.modelo,
        cr.tipo_servico as service_type,
        cr.status,
        cr.created_at as date,
        (COALESCE(cr.labor_cost::numeric, 0) + COALESCE(cr.parts_cost::numeric, 0)) as cost
       FROM car_receptions cr
       LEFT JOIN vehicles v ON cr.placa = v.placa
       WHERE cr.created_at >= $1 AND cr.created_at <= $2
       ORDER BY cr.created_at DESC
       LIMIT 10`,
      [startOfTargetMonth.toISOString(), endOfTargetMonth.toISOString()]
    );

    // 8. Distribuição de Despesas por Categoria
    const expenseDistributionResult = await pool.query(
      `SELECT 
        'Combustível' as category,
        COALESCE(SUM(valor_total), 0) as value,
        '#3b82f6' as color
       FROM historico_consolidado_abastecimentos
       WHERE created_at >= $1 AND created_at <= $2
       UNION ALL
       SELECT 
        'Manutenção' as category,
        COALESCE(SUM(labor_cost::numeric + parts_cost::numeric), 0) as value,
        '#10b981' as color
       FROM car_receptions
       WHERE created_at >= $1 AND created_at <= $2
       ORDER BY value DESC`,
      [startOfTargetMonth.toISOString(), endOfTargetMonth.toISOString()]
    );

    // 9. KM por Base/Projeto (mês atual)
    const kmPerBaseCurrentResult = await pool.query(
      `SELECT 
        COALESCE(p.nome, 'Sem Projeto') as base,
        COALESCE(SUM(hca.km), 0) as km
       FROM historico_consolidado_abastecimentos hca
       LEFT JOIN projetos p ON hca.projeto = p.nome
       WHERE hca.created_at >= $1 AND hca.created_at <= $2
       GROUP BY p.nome
       ORDER BY km DESC
       LIMIT 10`,
      [startOfTargetMonth.toISOString(), endOfTargetMonth.toISOString()]
    );

    // 10. KM por Base/Projeto (mês anterior)
    const kmPerBasePreviousResult = await pool.query(
      `SELECT 
        COALESCE(p.nome, 'Sem Projeto') as base,
        COALESCE(SUM(hca.km), 0) as km
       FROM historico_consolidado_abastecimentos hca
       LEFT JOIN projetos p ON hca.projeto = p.nome
       WHERE hca.created_at >= $1 AND hca.created_at <= $2
       GROUP BY p.nome`,
      [startOfPreviousMonth.toISOString(), endOfPreviousMonth.toISOString()]
    );

    // Processar resultados
    const vehicles = vehiclesResult.rows[0];
    const fuelCurrent = fuelCurrentResult.rows[0];
    const fuelPrevious = fuelPreviousResult.rows[0];
    const maintenanceCurrent = maintenanceCurrentResult.rows[0];
    const maintenancePrevious = maintenancePreviousResult.rows[0];
    const topCostVehicles = topCostVehiclesResult.rows;
    const maintenanceRecords = maintenanceRecordsResult.rows;
    const expenseDistribution = expenseDistributionResult.rows;
    const kmPerBaseCurrent = kmPerBaseCurrentResult.rows;
    const kmPerBasePrevious = kmPerBasePreviousResult.rows;

    // Calcular mudanças percentuais
    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    const totalKmCurrent = parseFloat(fuelCurrent.total_km) || 0;
    const totalKmPrevious = parseFloat(fuelPrevious.total_km) || 0;
    const totalLitrosCurrent = parseFloat(fuelCurrent.total_litros) || 0;
    const totalLitrosPrevious = parseFloat(fuelPrevious.total_litros) || 0;
    const custoFuelCurrent = parseFloat(fuelCurrent.custo_total) || 0;
    const custoFuelPrevious = parseFloat(fuelPrevious.custo_total) || 0;
    const mediaKmLitroCurrent = parseFloat(fuelCurrent.media_km_litro) || 0;
    const mediaKmLitroPrevious = parseFloat(fuelPrevious.media_km_litro) || 0;

    const totalManutencoesCurrent = parseInt(maintenanceCurrent.total_manutencoes) || 0;
    const totalManutencoesPrevious = parseInt(maintenancePrevious.total_manutencoes) || 0;
    const custoManutCurrent = parseFloat(maintenanceCurrent.custo_total) || 0;
    const custoManutPrevious = parseFloat(maintenancePrevious.custo_total) || 0;
    const tempoMedioCurrent = parseFloat(maintenanceCurrent.tempo_medio_dias) || 0;
    const tempoMedioPrevious = parseFloat(maintenancePrevious.tempo_medio_dias) || 0;

    // Montar resposta no formato esperado
    const response = {
      kpis: [
        {
          title: 'Veículos Ativos',
          value: parseInt(vehicles.veiculos_ativos) || 0,
          previousValue: parseInt(vehicles.veiculos_ativos) || 0,
          changePercentage: 0,
          trend: 'neutral' as const,
          isPositive: true,
          unit: 'veículos'
        },
        {
          title: 'KM Percorridos',
          value: totalKmCurrent,
          previousValue: totalKmPrevious,
          changePercentage: calcChange(totalKmCurrent, totalKmPrevious),
          trend: totalKmCurrent > totalKmPrevious ? 'up' as const : totalKmCurrent < totalKmPrevious ? 'down' as const : 'neutral' as const,
          isPositive: totalKmCurrent > totalKmPrevious,
          unit: 'km'
        },
        {
          title: 'Consumo Diesel',
          value: totalLitrosCurrent,
          previousValue: totalLitrosPrevious,
          changePercentage: calcChange(totalLitrosCurrent, totalLitrosPrevious),
          trend: totalLitrosCurrent > totalLitrosPrevious ? 'up' as const : totalLitrosCurrent < totalLitrosPrevious ? 'down' as const : 'neutral' as const,
          isPositive: false,
          unit: 'L'
        },
        {
          title: 'Média km/L',
          value: mediaKmLitroCurrent,
          previousValue: mediaKmLitroPrevious,
          changePercentage: calcChange(mediaKmLitroCurrent, mediaKmLitroPrevious),
          trend: mediaKmLitroCurrent > mediaKmLitroPrevious ? 'up' as const : mediaKmLitroCurrent < mediaKmLitroPrevious ? 'down' as const : 'neutral' as const,
          isPositive: mediaKmLitroCurrent > mediaKmLitroPrevious,
          unit: 'km/L'
        },
        {
          title: 'Custo Combustível',
          value: custoFuelCurrent,
          previousValue: custoFuelPrevious,
          changePercentage: calcChange(custoFuelCurrent, custoFuelPrevious),
          trend: custoFuelCurrent > custoFuelPrevious ? 'up' as const : custoFuelCurrent < custoFuelPrevious ? 'down' as const : 'neutral' as const,
          isPositive: custoFuelCurrent < custoFuelPrevious,
          unit: 'R$'
        },
        {
          title: 'Manutenções',
          value: totalManutencoesCurrent,
          previousValue: totalManutencoesPrevious,
          changePercentage: calcChange(totalManutencoesCurrent, totalManutencoesPrevious),
          trend: totalManutencoesCurrent > totalManutencoesPrevious ? 'up' as const : totalManutencoesCurrent < totalManutencoesPrevious ? 'down' as const : 'neutral' as const,
          isPositive: totalManutencoesCurrent < totalManutencoesPrevious,
          unit: 'ordens'
        },
        {
          title: 'Custo Manutenção',
          value: custoManutCurrent,
          previousValue: custoManutPrevious,
          changePercentage: calcChange(custoManutCurrent, custoManutPrevious),
          trend: custoManutCurrent > custoManutPrevious ? 'up' as const : custoManutCurrent < custoManutPrevious ? 'down' as const : 'neutral' as const,
          isPositive: custoManutCurrent < custoManutPrevious,
          unit: 'R$'
        },
        {
          title: 'Tempo Médio Manutenção',
          value: tempoMedioCurrent,
          previousValue: tempoMedioPrevious,
          changePercentage: calcChange(tempoMedioCurrent, tempoMedioPrevious),
          trend: tempoMedioCurrent > tempoMedioPrevious ? 'up' as const : tempoMedioCurrent < tempoMedioPrevious ? 'down' as const : 'neutral' as const,
          isPositive: tempoMedioCurrent < tempoMedioPrevious,
          unit: 'dias'
        }
      ],
      topCostVehicles: topCostVehicles.map(v => ({
        placa: v.placa,
        modelo: v.modelo,
        fuelCost: parseFloat(v.custo_combustivel) || 0,
        maintenanceCost: parseFloat(v.custo_manutencao) || 0,
        totalCost: parseFloat(v.custo_total) || 0
      })),
      maintenanceRecords: maintenanceRecords.map(m => ({
        id: m.id,
        placa: m.placa,
        vehicle: m.modelo || m.placa,
        serviceType: m.service_type || 'N/A',
        status: m.status,
        date: m.date,
        cost: parseFloat(m.cost) || 0
      })),
      kmPerBase: kmPerBaseCurrent.map(current => {
        const previous = kmPerBasePrevious.find(p => p.base === current.base);
        return {
          base: current.base,
          currentMonth: parseFloat(current.km) || 0,
          previousMonth: previous ? parseFloat(previous.km) || 0 : 0
        };
      }),
      expenseDistribution: expenseDistribution.map(e => ({
        category: e.category,
        value: parseFloat(e.value) || 0,
        color: e.color
      })),
      updateTime: new Date().toLocaleString('pt-BR'),
      period: formattedMonth
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Erro ao obter dados do dashboard:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor ao obter dados do dashboard',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

/**
 * Obtém os dados do painel principal
 */
export async function getPainelPrincipal(req: Request, res: Response) {
  try {
    // Pegar data de requisição se estiver presente
    let date: Date | undefined;
    if (req.query.date) {
      date = new Date(req.query.date as string);
    } else {
      date = new Date(); // Data atual
    }
    
    // Datas do início e fim do mês
    const startOfCurrentMonth = startOfMonth(date);
    const endOfCurrentMonth = endOfMonth(date);
    
    // Buscar registro mais recente dentro do mês especificado
    const painelResult = await pool.query(
      `SELECT * FROM painel_principal 
       WHERE data >= $1 AND data <= $2
       ORDER BY data DESC
       LIMIT 1`,
      [startOfCurrentMonth.toISOString(), endOfCurrentMonth.toISOString()]
    );
    
    if (painelResult.rows && painelResult.rows.length > 0) {
      return res.status(200).json(painelResult.rows[0]);
    } else {
      // Se não houver dados para o mês especificado, busque o registro mais recente
      const latestResult = await pool.query(
        `SELECT * FROM painel_principal 
         ORDER BY data DESC
         LIMIT 1`
      );
      
      if (latestResult.rows && latestResult.rows.length > 0) {
        return res.status(200).json({
          ...latestResult.rows[0],
          message: "Dados mais recentes disponíveis (fora do mês solicitado)"
        });
      } else {
        // Dados de exemplo para o painel principal (apenas se não houver dados no banco)
        const mockData = {
          id: 1,
          data_referencia: new Date().toISOString().split('T')[0],
          manutencoes_pendentes: 12,
          tempo_medio_manutencao: "3.5 dias",
          veiculos_parados: 8,
          dias_parados_total: 24,
          viagens_concluidas: 145,
          viagens_no_show: 5,
          viagens_canceladas_cliente: 7,
          litros_diesel_total: 8500,
          gasto_total_combustivel: 42500,
          qtd_sinistros: 3,
          qtd_roubos: 0,
          incidentes_seguranca_trabalho: 1,
          movimentacoes_pneus: 28,
          pneus_substituidos: 12,
          message: "Dados de exemplo (nenhum registro encontrado no banco de dados)"
        };
        
        return res.status(200).json(mockData);
      }
    }
  } catch (error) {
    console.error("Error fetching painel principal:", error);
    return res.status(500).json({ 
      message: "Erro ao buscar dados do painel principal", 
      error: String(error) 
    });
  }
}