import { Request, Response } from 'express';
import { pool } from './db';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Obter dados para o Dashboard Executivo
 * Usa as tabelas indicadores_dados e indicadores_liberado para estatísticas de manutenção
 */
export async function getExecutiveDashboard(req: Request, res: Response) {
  try {
    // Capturar parâmetros de data
    let targetDate = new Date();
    if (req.query.date) {
      targetDate = new Date(req.query.date as string);
    }
    
    // Parâmetros de data inicial e final para filtros
    const startDateParam = req.query.startDate as string | undefined;
    const endDateParam = req.query.endDate as string | undefined;
    
    console.log('[EXECUTIVE-DASHBOARD] Parâmetros recebidos:', { 
      date: req.query.date, 
      startDate: startDateParam, 
      endDate: endDateParam 
    });
    
    // Formatar o mês para exibição
    const formattedMonth = format(targetDate, 'MMMM yyyy', { locale: ptBR });
    
    // Construir cláusula WHERE para filtro de datas
    let dateWhereClause = '';
    let dateWhereParams: string[] = [];
    
    if (startDateParam && endDateParam) {
      dateWhereClause = `WHERE data_agenda >= $1 AND data_agenda <= $2`;
      dateWhereParams = [startDateParam, endDateParam];
    } else if (startDateParam) {
      dateWhereClause = `WHERE data_agenda >= $1`;
      dateWhereParams = [startDateParam];
    } else if (endDateParam) {
      dateWhereClause = `WHERE data_agenda <= $1`;
      dateWhereParams = [endDateParam];
    }
    
    // Consulta para estatísticas de manutenção da tabela indicadores_dados
    const maintenanceStatsQuery = `
      SELECT 
        COUNT(*) AS total_em_manutencao,
        COUNT(CASE WHEN status = 'Finalizado' OR status = 'Liberado' THEN 1 END) AS total_finalizado,
        COUNT(CASE WHEN status = 'Em Manutenção' THEN 1 END) AS em_manutencao,
        COUNT(CASE WHEN status = 'Aguardando Peça' THEN 1 END) AS aguardando_peca,
        COUNT(CASE WHEN status = 'Em Orçamento' THEN 1 END) AS em_orcamento,
        COUNT(CASE WHEN status = 'Aguardando Aprovação' THEN 1 END) AS aguardando_aprovacao,
        COUNT(CASE WHEN status = 'Em Execução' THEN 1 END) AS em_execucao,
        COUNT(CASE WHEN status = 'Liberado' THEN 1 END) AS liberados,
        COUNT(DISTINCT placa) AS veiculos_unicos
      FROM indicadores_dados
      ${dateWhereClause}
    `;
    
    // Construir cláusula WHERE para liberados (usa data_saida)
    let liberadosWhereClause = '';
    let liberadosWhereParams: string[] = [];
    
    if (startDateParam && endDateParam) {
      liberadosWhereClause = `WHERE data_saida >= $1 AND data_saida <= $2`;
      liberadosWhereParams = [startDateParam, endDateParam];
    } else if (startDateParam) {
      liberadosWhereClause = `WHERE data_saida >= $1`;
      liberadosWhereParams = [startDateParam];
    } else if (endDateParam) {
      liberadosWhereClause = `WHERE data_saida <= $1`;
      liberadosWhereParams = [endDateParam];
    }
    
    // Consulta para veículos liberados
    const liberadosQuery = `
      SELECT 
        COUNT(*) AS total_liberados,
        COUNT(CASE WHEN TRIM(tipo_manutencao) ILIKE '%preventiva%' THEN 1 END) AS preventivas,
        COUNT(CASE WHEN TRIM(tipo_manutencao) ILIKE '%corretiva%' THEN 1 END) AS corretivas
      FROM indicadores_liberado
      ${liberadosWhereClause}
    `;
    
    // Consulta para manutenções recentes
    const recentMaintenancesQuery = `
      SELECT 
        id, placa, modelo, status, 
        oficina_debito as oficina, km, 
        relato as descricao, data_agenda as data_inicio,
        0 as custo_total
      FROM indicadores_dados
      ${dateWhereClause}
      ORDER BY data_agenda DESC NULLS LAST
      LIMIT 15
    `;
    
    // Consulta para quilometragem por base (usar tabela existente)
    const kmPerBaseQuery = `
      SELECT 
        COALESCE(b.nome, 'Sem Base') as base,
        COUNT(v.id) as total_veiculos
      FROM veiculos v
      LEFT JOIN bases b ON v.base_id = b.id
      GROUP BY b.nome
      ORDER BY total_veiculos DESC
      LIMIT 10
    `;
    
    console.log('[EXECUTIVE-DASHBOARD] Executando consultas...');
    
    // Executar todas as consultas em paralelo
    const [
      maintenanceStatsResult,
      liberadosResult,
      recentMaintenancesResult,
      kmPerBaseResult
    ] = await Promise.all([
      pool.query(maintenanceStatsQuery, dateWhereParams),
      pool.query(liberadosQuery, liberadosWhereParams),
      pool.query(recentMaintenancesQuery, dateWhereParams),
      pool.query(kmPerBaseQuery).catch(() => ({ rows: [] }))
    ]);
    
    console.log('[EXECUTIVE-DASHBOARD] Resultados:', {
      maintenanceStats: maintenanceStatsResult.rows[0],
      liberados: liberadosResult.rows[0],
      recentMaintenances: recentMaintenancesResult.rows.length
    });
    
    // Processar estatísticas de manutenção
    const maintenanceStats = maintenanceStatsResult.rows[0] || {
      total_em_manutencao: 0,
      total_finalizado: 0,
      em_manutencao: 0,
      aguardando_peca: 0,
      em_orcamento: 0,
      aguardando_aprovacao: 0,
      em_execucao: 0,
      liberados: 0,
      veiculos_unicos: 0
    };
    
    // Processar dados de veículos liberados
    const liberadosStats = liberadosResult.rows[0] || {
      total_liberados: 0,
      preventivas: 0,
      corretivas: 0
    };
    
    // Processar dados de manutenções recentes
    const maintenanceRecords = recentMaintenancesResult.rows.map(maintenance => {
      let formattedDate = 'N/A';
      try {
        if (maintenance.data_inicio) {
          const d = new Date(maintenance.data_inicio);
          formattedDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        }
      } catch (e) {
        formattedDate = 'N/A';
      }
      
      // Extrair grupo do relato (se existir formato [Grupo])
      let serviceType = 'Manutenção Geral';
      if (maintenance.descricao) {
        const match = maintenance.descricao.match(/\[([^\]]+)\]/);
        if (match) {
          serviceType = match[1];
        } else if (maintenance.descricao.length > 50) {
          serviceType = maintenance.descricao.substring(0, 50) + '...';
        } else {
          serviceType = maintenance.descricao;
        }
      }
      
      return {
        id: maintenance.id,
        date: formattedDate,
        placa: maintenance.placa,
        vehicle: maintenance.modelo || 'N/A',
        serviceType: serviceType,
        status: maintenance.status || 'Em Manutenção',
        oficina: maintenance.oficina || 'N/A',
        km: maintenance.km || 0,
        cost: parseFloat(maintenance.custo_total) || 0
      };
    });
    
    // Processar dados de KM por base
    const kmPerBase = kmPerBaseResult.rows.map(row => ({
      base: row.base,
      currentMonth: parseInt(row.total_veiculos) || 0,
      previousMonth: 0
    }));
    
    // Montar objeto de resposta
    const dashboardData = {
      // KPIs básicos (placeholder para outros dados)
      kpis: {
        vehiclesInMaintenance: {
          title: 'Veículos em Manutenção',
          value: parseInt(maintenanceStats.total_em_manutencao) || 0,
          color: 'warning'
        },
        vehiclesReleased: {
          title: 'Veículos Liberados',
          value: parseInt(liberadosStats.total_liberados) || 0,
          color: 'success'
        },
        preventive: {
          title: 'Manutenções Preventivas',
          value: parseInt(liberadosStats.preventivas) || 0,
          color: 'info'
        },
        corrective: {
          title: 'Manutenções Corretivas',
          value: parseInt(liberadosStats.corretivas) || 0,
          color: 'warning'
        }
      },
      
      // Dados de gráficos
      kmPerBase,
      expenseDistribution: [],
      topVehiclesCost: [],
      maintenanceRecords,
      
      // Estatísticas de manutenção do módulo Indicadores
      maintenanceStats: {
        totalEmManutencao: parseInt(maintenanceStats.total_em_manutencao) || 0,
        totalFinalizado: parseInt(maintenanceStats.total_finalizado) || 0,
        emManutencao: parseInt(maintenanceStats.em_manutencao) || 0,
        aguardandoPeca: parseInt(maintenanceStats.aguardando_peca) || 0,
        emOrcamento: parseInt(maintenanceStats.em_orcamento) || 0,
        aguardandoAprovacao: parseInt(maintenanceStats.aguardando_aprovacao) || 0,
        emExecucao: parseInt(maintenanceStats.em_execucao) || 0,
        liberados: parseInt(maintenanceStats.liberados) || 0,
        veiculosUnicos: parseInt(maintenanceStats.veiculos_unicos) || 0,
        totalLiberados: parseInt(liberadosStats.total_liberados) || 0,
        preventivas: parseInt(liberadosStats.preventivas) || 0,
        corretivas: parseInt(liberadosStats.corretivas) || 0
      },
      
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
