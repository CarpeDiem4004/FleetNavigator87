import { Request, Response } from 'express';
import { pool } from './db';

/**
 * API de Analytics para Fuel Card
 * Retorna KPIs, gráficos e dados agregados para o dashboard de análise de consumo
 */

interface AnalyticsFilters {
  dataInicio?: string;
  dataFim?: string;
  projeto?: string;
  base?: string;
  placa?: string;
  motorista?: string;
  operadora?: string;
}

export async function getFuelCardAnalytics(req: Request, res: Response) {
  try {
    const filters: AnalyticsFilters = {
      dataInicio: req.query.dataInicio as string,
      dataFim: req.query.dataFim as string,
      projeto: req.query.projeto as string,
      base: req.query.base as string,
      placa: req.query.placa as string,
      motorista: req.query.motorista as string,
      operadora: req.query.operadora as string,
    };

    console.log('[ANALYTICS-API] Filtros recebidos:', filters);

    // Construir WHERE clause baseado nos filtros
    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Filtro de data (sempre usar data_solicitacao como base)
    if (filters.dataInicio) {
      whereConditions.push(`data_solicitacao >= $${paramIndex}::timestamp`);
      queryParams.push(`${filters.dataInicio} 00:00:00`);
      paramIndex++;
    }
    if (filters.dataFim) {
      whereConditions.push(`data_solicitacao <= $${paramIndex}::timestamp`);
      queryParams.push(`${filters.dataFim} 23:59:59`);
      paramIndex++;
    }

    // Outros filtros
    if (filters.base && filters.base !== 'all') {
      whereConditions.push(`base = $${paramIndex}`);
      queryParams.push(filters.base);
      paramIndex++;
    }
    if (filters.placa && filters.placa !== 'all') {
      whereConditions.push(`placa = $${paramIndex}`);
      queryParams.push(filters.placa);
      paramIndex++;
    }
    if (filters.motorista && filters.motorista !== 'all') {
      whereConditions.push(`motorista ILIKE $${paramIndex}`);
      queryParams.push(`%${filters.motorista}%`);
      paramIndex++;
    }
    if (filters.operadora && filters.operadora !== 'all') {
      whereConditions.push(`provedor_cartao = $${paramIndex}`);
      queryParams.push(filters.operadora);
      paramIndex++;
    }

    // Sempre filtrar apenas solicitações atendidas
    whereConditions.push("(status = 'Recarga Efetuada' OR status = 'atendido')");

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    console.log('[ANALYTICS-API] WHERE clause:', whereClause);
    console.log('[ANALYTICS-API] Query params:', queryParams);

    // === KPIs ===
    
    // 1. Consumo Total do Período
    const consumoTotalQuery = `
      SELECT 
        COALESCE(SUM(valor_solicitado), 0) as valor_total,
        COALESCE(SUM(litros_solicitados), 0) as litros_total,
        COUNT(*) as total_solicitacoes,
        CASE 
          WHEN SUM(litros_solicitados) > 0 
          THEN SUM(valor_solicitado) / SUM(litros_solicitados)
          ELSE 0
        END as preco_medio_litro
      FROM solicitacoes_fuel_card
      ${whereClause}
    `;

    const consumoTotal = await pool.query(consumoTotalQuery, queryParams);

    // 2. Comparativo com Período Anterior (mesma quantidade de dias)
    let comparativoPeriodoAnterior = { diferenca: 0, percentual: 0, valorAnterior: 0 };
    
    if (filters.dataInicio && filters.dataFim) {
      const dataInicioDate = new Date(filters.dataInicio);
      const dataFimDate = new Date(filters.dataFim);
      const diffDays = Math.ceil((dataFimDate.getTime() - dataInicioDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const dataInicioAnterior = new Date(dataInicioDate);
      dataInicioAnterior.setDate(dataInicioAnterior.getDate() - diffDays);
      
      const dataFimAnterior = new Date(dataInicioDate);
      dataFimAnterior.setDate(dataFimAnterior.getDate() - 1);

      const comparativoQuery = `
        SELECT COALESCE(SUM(valor_solicitado), 0) as valor_total
        FROM solicitacoes_fuel_card
        WHERE data_solicitacao >= $1::timestamp 
          AND data_solicitacao <= $2::timestamp
          AND (status = 'Recarga Efetuada' OR status = 'atendido')
      `;
      
      const periodoAnterior = await pool.query(comparativoQuery, [
        `${dataInicioAnterior.toISOString().split('T')[0]} 00:00:00`,
        `${dataFimAnterior.toISOString().split('T')[0]} 23:59:59`
      ]);

      const valorAtual = parseFloat(consumoTotal.rows[0].valor_total);
      const valorAnterior = parseFloat(periodoAnterior.rows[0].valor_total);
      
      comparativoPeriodoAnterior = {
        diferenca: valorAtual - valorAnterior,
        percentual: valorAnterior > 0 ? ((valorAtual - valorAnterior) / valorAnterior) * 100 : 0,
        valorAnterior
      };
    }

    // 3. Maior Base Consumidora (tratando registros Line Haul)
    const maiorBaseQuery = `
      SELECT 
        CASE 
          WHEN origem_tipo = 'line_hall' OR (base IS NULL OR TRIM(base) = '') THEN 'Line Haul'
          ELSE base
        END as base,
        SUM(valor_solicitado) as total
      FROM solicitacoes_fuel_card
      ${whereClause}
      GROUP BY CASE 
          WHEN origem_tipo = 'line_hall' OR (base IS NULL OR TRIM(base) = '') THEN 'Line Haul'
          ELSE base
        END
      ORDER BY total DESC
      LIMIT 1
    `;

    const maiorBase = await pool.query(maiorBaseQuery, queryParams);

    // 4. Veículo que Mais Consumiu
    const veiculoTopQuery = `
      SELECT 
        placa,
        SUM(litros_solicitados) as litros,
        SUM(valor_solicitado) as valor,
        COUNT(*) as quantidade_abastecimentos
      FROM solicitacoes_fuel_card
      ${whereClause}
      GROUP BY placa
      ORDER BY litros DESC
      LIMIT 1
    `;

    const veiculoTop = await pool.query(veiculoTopQuery, queryParams);

    // 5. Operadora Mais Utilizada
    const operadoraTopQuery = `
      SELECT 
        COALESCE(provedor_cartao, 'Não especificado') as operadora,
        SUM(valor_solicitado) as total,
        COUNT(*) as quantidade
      FROM solicitacoes_fuel_card
      ${whereClause}
      GROUP BY provedor_cartao
      ORDER BY total DESC
      LIMIT 1
    `;

    const operadoraTop = await pool.query(operadoraTopQuery, queryParams);

    // === GRÁFICOS ===

    // 1. Gráfico Mensal
    const graficoMensalQuery = `
      SELECT 
        TO_CHAR(data_solicitacao, 'YYYY-MM') as mes,
        SUM(valor_solicitado) as valor,
        SUM(litros_solicitados) as litros,
        COUNT(*) as quantidade
      FROM solicitacoes_fuel_card
      ${whereClause}
      GROUP BY TO_CHAR(data_solicitacao, 'YYYY-MM')
      ORDER BY mes
    `;

    const graficoMensal = await pool.query(graficoMensalQuery, queryParams);

    // 1.1 Gráfico Mensal por Operadora (Ticket vs Veloe) - SEM FILTRO DE DATA
    // Este gráfico mostra todos os meses disponíveis independente da seleção de período
    const graficoMensalPorOperadoraQuery = `
      SELECT 
        TO_CHAR(data_solicitacao, 'YYYY-MM') as mes,
        CASE 
          WHEN UPPER(COALESCE(provedor_cartao, '')) LIKE '%TICKET%' THEN 'Ticket'
          WHEN UPPER(COALESCE(provedor_cartao, '')) LIKE '%VELOE%' THEN 'Veloe Go'
          ELSE 'Outros'
        END as operadora,
        SUM(valor_solicitado) as valor
      FROM solicitacoes_fuel_card
      WHERE data_solicitacao IS NOT NULL
      GROUP BY TO_CHAR(data_solicitacao, 'YYYY-MM'), 
        CASE 
          WHEN UPPER(COALESCE(provedor_cartao, '')) LIKE '%TICKET%' THEN 'Ticket'
          WHEN UPPER(COALESCE(provedor_cartao, '')) LIKE '%VELOE%' THEN 'Veloe Go'
          ELSE 'Outros'
        END
      ORDER BY mes, operadora
    `;
    const graficoMensalPorOperadora = await pool.query(graficoMensalPorOperadoraQuery);

    // 1.2 Gráfico Mensal Bases vs Line Haul - SEM FILTRO DE DATA (histórico completo)
    const graficoMensalPorBaseQuery = `
      SELECT 
        TO_CHAR(data_solicitacao, 'YYYY-MM') as mes,
        CASE 
          WHEN origem_tipo = 'line_hall' OR (base IS NULL OR TRIM(base) = '') THEN 'Line Haul'
          ELSE 'Bases'
        END as categoria,
        SUM(valor_solicitado) as valor
      FROM solicitacoes_fuel_card
      WHERE data_solicitacao IS NOT NULL
      GROUP BY TO_CHAR(data_solicitacao, 'YYYY-MM'), 
        CASE 
          WHEN origem_tipo = 'line_hall' OR (base IS NULL OR TRIM(base) = '') THEN 'Line Haul'
          ELSE 'Bases'
        END
      ORDER BY mes, categoria
    `;
    const graficoMensalPorBase = await pool.query(graficoMensalPorBaseQuery);

    // 2. Gráfico por Base (registros Line Haul são identificados pelo campo origem_tipo)
    const graficoPorBaseQuery = `
      SELECT 
        CASE 
          WHEN origem_tipo = 'line_hall' OR (base IS NULL OR TRIM(base) = '') THEN 'Line Haul'
          ELSE base
        END as base,
        SUM(valor_solicitado) as total,
        SUM(litros_solicitados) as litros,
        COUNT(*) as quantidade
      FROM solicitacoes_fuel_card
      ${whereClause}
      GROUP BY CASE 
          WHEN origem_tipo = 'line_hall' OR (base IS NULL OR TRIM(base) = '') THEN 'Line Haul'
          ELSE base
        END
      ORDER BY total DESC
      LIMIT 10
    `;

    const graficoPorBase = await pool.query(graficoPorBaseQuery, queryParams);

    // 3. Gráfico por Operadora
    const graficoPorOperadoraQuery = `
      SELECT 
        COALESCE(provedor_cartao, 'Não especificado') as operadora,
        SUM(valor_solicitado) as total,
        SUM(litros_solicitados) as litros,
        COUNT(*) as quantidade
      FROM solicitacoes_fuel_card
      ${whereClause}
      GROUP BY provedor_cartao
      ORDER BY total DESC
    `;

    const graficoPorOperadora = await pool.query(graficoPorOperadoraQuery, queryParams);

    // === TABELAS ===

    // 1. Ranking de Veículos
    const rankingVeiculosQuery = `
      SELECT 
        placa,
        base,
        SUM(litros_solicitados) as litros_total,
        SUM(valor_solicitado) as valor_total,
        COUNT(*) as quantidade_abastecimentos,
        AVG(valor_solicitado) as valor_medio,
        MAX(km_veiculo) as km_atual
      FROM solicitacoes_fuel_card
      ${whereClause}
      GROUP BY placa, base
      ORDER BY valor_total DESC
      LIMIT 50
    `;

    const rankingVeiculos = await pool.query(rankingVeiculosQuery, queryParams);

    // 2. Transações Detalhadas (paginadas)
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = (page - 1) * limit;

    const transacoesQuery = `
      SELECT 
        id,
        data_solicitacao,
        placa,
        motorista,
        base,
        valor_solicitado,
        litros_solicitados,
        provedor_cartao,
        km_veiculo,
        status,
        tipo_combustivel
      FROM solicitacoes_fuel_card
      ${whereClause}
      ORDER BY data_solicitacao DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const transacoes = await pool.query(transacoesQuery, [...queryParams, limit, offset]);

    // Contar total de transações para paginação
    const countQuery = `
      SELECT COUNT(*) as total
      FROM solicitacoes_fuel_card
      ${whereClause}
    `;
    const totalCount = await pool.query(countQuery, queryParams);

    // === RESPOSTA FINAL ===

    const response = {
      success: true,
      data: {
        kpis: {
          consumoTotal: {
            valor: parseFloat(consumoTotal.rows[0].valor_total),
            litros: parseFloat(consumoTotal.rows[0].litros_total),
            totalSolicitacoes: parseInt(consumoTotal.rows[0].total_solicitacoes),
            precoMedioLitro: parseFloat(consumoTotal.rows[0].preco_medio_litro)
          },
          comparativoPeriodoAnterior,
          maiorBase: maiorBase.rows[0] || { base: '-', total: 0 },
          veiculoMaisConsumiu: veiculoTop.rows[0] || { placa: '-', litros: 0, valor: 0, quantidade_abastecimentos: 0 },
          operadoraMaisUtilizada: operadoraTop.rows[0] || { operadora: '-', total: 0, quantidade: 0 }
        },
        graficos: {
          mensal: graficoMensal.rows,
          mensalPorOperadora: graficoMensalPorOperadora.rows,
          mensalPorBase: graficoMensalPorBase.rows,
          porBase: graficoPorBase.rows,
          porOperadora: graficoPorOperadora.rows
        },
        tabelas: {
          rankingVeiculos: rankingVeiculos.rows,
          transacoes: {
            data: transacoes.rows,
            pagination: {
              page,
              limit,
              total: parseInt(totalCount.rows[0].total),
              totalPages: Math.ceil(parseInt(totalCount.rows[0].total) / limit)
            }
          }
        }
      }
    };

    console.log('[ANALYTICS-API] Resposta gerada com sucesso');
    
    return res.json(response);

  } catch (error) {
    console.error('[ANALYTICS-API] Erro ao buscar analytics:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar dados de analytics',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
