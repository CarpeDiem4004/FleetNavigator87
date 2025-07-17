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
 * Retorna os KPIs do dashboard
 */
export async function getDashboardKPIs(req: Request, res: Response) {
  try {
    // Buscar dados do mês atual ou do mês especificado na query
    let targetDate = new Date();
    
    if (req.query.date) {
      targetDate = new Date(req.query.date as string);
    }
    
    // Datas do mês atual
    const startOfTargetMonth = startOfMonth(targetDate);
    const endOfTargetMonth = endOfMonth(targetDate);
    
    // Formatar o mês atual para exibição (ex: "abril 2025")
    const formattedMonth = format(targetDate, 'MMMM yyyy', { locale: ptBR });

    // Calcular dados reais do banco de dados
    // 1. Buscar dados de manutenção (car_receptions + maintenance_orders)
    const carReceptionsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_car_receptions,
        COUNT(CASE WHEN status IN ('recebido', 'em_analise', 'aguardando_pecas', 'em_reparo') THEN 1 END) as veiculos_em_manutencao,
        COUNT(CASE WHEN status = 'pronto' THEN 1 END) as veiculos_prontos,
        COUNT(CASE WHEN status = 'entregue' THEN 1 END) as veiculos_entregues,
        SUM(CASE WHEN labor_cost IS NOT NULL THEN labor_cost::numeric ELSE 0 END + CASE WHEN parts_cost IS NOT NULL THEN parts_cost::numeric ELSE 0 END) as custo_total_car_receptions,
        AVG(CASE WHEN created_at IS NOT NULL AND (delivered_date IS NOT NULL OR completed_date IS NOT NULL) 
                 THEN EXTRACT(days FROM COALESCE(delivered_date, completed_date) - created_at) 
                 END) as tempo_medio_manutencao
       FROM car_receptions 
       WHERE created_at >= $1 AND created_at <= $2`,
      [startOfTargetMonth.toISOString(), endOfTargetMonth.toISOString()]
    );

    // 2. Buscar dados da tabela maintenance_orders (se existir)
    const maintenanceOrdersResult = await pool.query(
      `SELECT 
        COUNT(*) as total_maintenance_orders,
        COUNT(CASE WHEN status IN ('pendente', 'em_andamento', 'aguardando_pecas', 'aguardando_orcamento') THEN 1 END) as manutencoes_pendentes,
        SUM(CASE WHEN actual_cost IS NOT NULL THEN actual_cost::numeric ELSE 0 END) as custo_total_maintenance
       FROM maintenance_orders 
       WHERE created_at >= $1 AND created_at <= $2`,
      [startOfTargetMonth.toISOString(), endOfTargetMonth.toISOString()]
    );

    // 3. Buscar dados de veículos ativos
    const vehiclesResult = await pool.query(
      `SELECT 
        COUNT(*) as total_vehicles,
        COUNT(CASE WHEN status = 'em_operacao' THEN 1 END) as veiculos_ativos,
        COUNT(CASE WHEN status = 'em_manutencao' THEN 1 END) as veiculos_manutencao_status,
        COUNT(CASE WHEN status = 'parado' THEN 1 END) as veiculos_parados
       FROM vehicles`
    );

    // 4. Buscar dados de combustível do mês atual
    const fuelResult = await pool.query(
      `SELECT 
        COALESCE(SUM(quantity_litros), 0) as total_litros_diesel,
        COALESCE(SUM(km), 0) as total_km_frota,
        CASE 
          WHEN SUM(quantity_litros) > 0 THEN ROUND(SUM(km)::numeric / SUM(quantity_litros)::numeric, 2) 
          ELSE 0 
        END as media_diesel_km
       FROM historico_consolidado_abastecimentos 
       WHERE created_at >= $1 AND created_at <= $2`,
      [startOfTargetMonth.toISOString(), endOfTargetMonth.toISOString()]
    );

    // Processar os resultados
    const carReceptions = carReceptionsResult.rows[0];
    const maintenanceOrders = maintenanceOrdersResult.rows[0];
    const vehicles = vehiclesResult.rows[0];
    const fuel = fuelResult.rows[0];

    // Calcular métricas consolidadas
    const totalManutencoes = parseInt(carReceptions.total_car_receptions) + parseInt(maintenanceOrders.total_maintenance_orders);
    const custoManutencoes = parseFloat(carReceptions.custo_total_car_receptions || 0) + parseFloat(maintenanceOrders.custo_total_maintenance || 0);
    const veiculosEmManutencao = parseInt(carReceptions.veiculos_em_manutencao) + parseInt(maintenanceOrders.manutencoes_pendentes);
    const tempoMedioManutencao = parseFloat(carReceptions.tempo_medio_manutencao || 0);

    // Tentativa de usar a tabela painel_principal para dados atualizados pelo cron
    const painelResult = await pool.query(
      `SELECT * FROM painel_principal 
       WHERE data >= $1
       ORDER BY data DESC
       LIMIT 1`,
      [startOfTargetMonth.toISOString()]
    );

    if (painelResult.rows && painelResult.rows.length > 0) {
      // Se temos dados do painel principal, combinamos com os dados reais
      const painelInfo = painelResult.rows[0];
      
      // Atualizar com dados reais quando disponíveis
      const updatedPainelInfo = {
        ...painelInfo,
        total_manutencoes: totalManutencoes || painelInfo.total_manutencoes,
        custo_manutencoes: custoManutencoes || painelInfo.custo_manutencoes,
        tempo_medio_manutencao: tempoMedioManutencao || painelInfo.tempo_medio_manutencao,
        veiculos_ativos: parseInt(vehicles.veiculos_ativos) || painelInfo.veiculos_ativos,
        veiculos_manutencao: veiculosEmManutencao || painelInfo.veiculos_manutencao,
        total_km_frota: parseInt(fuel.total_km_frota) || painelInfo.total_km_frota,
        total_litros_diesel: parseInt(fuel.total_litros_diesel) || painelInfo.total_litros_diesel,
        media_diesel_km: parseFloat(fuel.media_diesel_km) || painelInfo.media_diesel_km,
        mes_referencia: formattedMonth,
        fonte: "dados_reais_combinados"
      };
      
      return res.status(200).json(updatedPainelInfo);
    } else {
      // Usar dados calculados dos bancos reais
      const dashboardData: PainelPrincipalData = {
        id: 0,
        data: format(targetDate, 'yyyy-MM-dd'),
        total_km_frota: parseInt(fuel.total_km_frota) || 0,
        total_litros_diesel: parseInt(fuel.total_litros_diesel) || 0,
        media_diesel_km: parseFloat(fuel.media_diesel_km) || 0,
        total_manutencoes: totalManutencoes || 0,
        custo_manutencoes: custoManutencoes || 0,
        tempo_medio_manutencao: tempoMedioManutencao || 0,
        veiculos_ativos: parseInt(vehicles.veiculos_ativos) || 0,
        veiculos_manutencao: veiculosEmManutencao || 0,
        economia_combustivel: 0, // Calcular se necessário
        tendencia_consumo: 'estável',
        alertas_criticos: 0, // Calcular se necessário
        pneus_substituidos: 0, // Calcular se necessário
        base_id: 1
      };
      
      return res.status(200).json({
        ...dashboardData,
        mes_referencia: formattedMonth,
        fonte: "dados_reais_calculados"
      });
    }
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