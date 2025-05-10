import { Router } from 'express';
import { pool } from '../db';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

/**
 * Rota para buscar o histórico consolidado de abastecimentos de todos os postos
 * Requer autenticação de admin
 */
router.get('/historico-consolidado', isAuthenticated, async (req, res) => {
  try {
    // Com o middleware isAuthenticated, sabemos que o usuário está autenticado
    // Seja por sessão, token JWT ou Supabase
    console.log('Acesso ao histórico consolidado:', {
      isAuthenticated: req.isAuthenticated(),
      hasAuthHeader: !!req.headers.authorization,
      user: req.user ? {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      } : 'Sem informações do usuário'
    });

    // Obter parâmetros de paginação e filtros
    const { 
      page = '1', 
      limit = '50', 
      placa = '', 
      posto = '', 
      combustivel = '',
      dataInicio = '',
      dataFim = '' 
    } = req.query;
    
    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 50;
    const offset = (pageNumber - 1) * limitNumber;
    
    // Construir a consulta com condições de filtro
    let whereConditions = [];
    let queryParams: any[] = [];
    let paramIndex = 1;
    
    if (placa) {
      whereConditions.push(`UPPER(placa) LIKE UPPER($${paramIndex})`);
      queryParams.push(`%${placa}%`);
      paramIndex++;
    }
    
    if (posto) {
      whereConditions.push(`UPPER(nome_posto) LIKE UPPER($${paramIndex})`);
      queryParams.push(`%${posto}%`);
      paramIndex++;
    }
    
    if (combustivel) {
      whereConditions.push(`UPPER(tipo_combustivel) LIKE UPPER($${paramIndex})`);
      queryParams.push(`%${combustivel}%`);
      paramIndex++;
    }
    
    if (dataInicio) {
      whereConditions.push(`created_at >= $${paramIndex}`);
      queryParams.push(new Date(dataInicio as string));
      paramIndex++;
    }
    
    if (dataFim) {
      whereConditions.push(`created_at <= $${paramIndex}`);
      // Adicionar 1 dia à data final para incluir todo o dia
      const endDate = new Date(dataFim as string);
      endDate.setDate(endDate.getDate() + 1);
      queryParams.push(endDate);
      paramIndex++;
    }
    
    // Construir a cláusula WHERE
    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';
    
    // Consulta para obter o total de registros
    const countQuery = `
      SELECT COUNT(*) as total
      FROM historico_consolidado_abastecimentos
      ${whereClause}
    `;
    
    // Consulta para obter os registros paginados
    const dataQuery = `
      SELECT 
        id,
        placa,
        km,
        tipo_combustivel,
        quantidade_litros,
        nome_motorista,
        rg_motorista,
        nome_operador,
        valor_litro,
        valor_total,
        tipo_veiculo,
        observacoes,
        lavagem,
        tipo_lavagem,
        nome_posto,
        data_hora,
        created_at
      FROM historico_consolidado_abastecimentos
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    // Adicionar os parâmetros de paginação
    queryParams.push(limitNumber, offset);
    
    // Executar ambas as consultas
    const countResult = await pool.query(countQuery, queryParams.slice(0, paramIndex - 1));
    const dataResult = await pool.query(dataQuery, queryParams);
    
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNumber);
    
    return res.status(200).json({
      success: true,
      data: dataResult.rows,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Erro ao buscar histórico consolidado:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar histórico consolidado de abastecimentos'
    });
  }
});

/**
 * Rota para buscar estatísticas consolidadas de todos os postos
 * Requer autenticação de admin
 */
router.get('/estatisticas-consolidadas', isAuthenticated, async (req, res) => {
  try {
    // Verificar se o usuário é admin
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Esta função é exclusiva para administradores.'
      });
    }
    
    const { periodo = '30' } = req.query;
    const dias = parseInt(periodo as string) || 30;
    
    // Consulta para estatísticas por posto
    const estatisticasPorPosto = `
      SELECT 
        nome_posto,
        COUNT(*) as total_abastecimentos,
        ROUND(SUM(quantidade_litros)::numeric, 2) as total_litros,
        ROUND(SUM(valor_total)::numeric, 2) as valor_total
      FROM historico_consolidado_abastecimentos
      WHERE created_at >= NOW() - INTERVAL '${dias} days'
      GROUP BY nome_posto
      ORDER BY total_abastecimentos DESC
    `;
    
    // Consulta para estatísticas por tipo de combustível
    const estatisticasPorCombustivel = `
      SELECT 
        tipo_combustivel,
        COUNT(*) as total_abastecimentos,
        ROUND(SUM(quantidade_litros)::numeric, 2) as total_litros,
        ROUND(SUM(valor_total)::numeric, 2) as valor_total,
        ROUND(AVG(valor_litro)::numeric, 2) as preco_medio_litro
      FROM historico_consolidado_abastecimentos
      WHERE created_at >= NOW() - INTERVAL '${dias} days'
      GROUP BY tipo_combustivel
      ORDER BY total_litros DESC
    `;
    
    // Consulta para os 10 veículos com maior consumo
    const topVeiculos = `
      SELECT 
        placa,
        COUNT(*) as total_abastecimentos,
        ROUND(SUM(quantidade_litros)::numeric, 2) as total_litros,
        ROUND(SUM(valor_total)::numeric, 2) as valor_total
      FROM historico_consolidado_abastecimentos
      WHERE created_at >= NOW() - INTERVAL '${dias} days'
      GROUP BY placa
      ORDER BY total_litros DESC
      LIMIT 10
    `;
    
    // Consulta para estatísticas diárias dos últimos 30 dias
    const estatisticasDiarias = `
      SELECT 
        TO_CHAR(DATE_TRUNC('day', created_at), 'DD/MM/YYYY') as data,
        COUNT(*) as total_abastecimentos,
        ROUND(SUM(quantidade_litros)::numeric, 2) as total_litros,
        ROUND(SUM(valor_total)::numeric, 2) as valor_total
      FROM historico_consolidado_abastecimentos
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY DATE_TRUNC('day', created_at) DESC
    `;
    
    // Executar todas as consultas
    const [porPostoResult, porCombustivelResult, topVeiculosResult, diariasResult] = await Promise.all([
      pool.query(estatisticasPorPosto),
      pool.query(estatisticasPorCombustivel),
      pool.query(topVeiculos),
      pool.query(estatisticasDiarias)
    ]);
    
    return res.status(200).json({
      success: true,
      data: {
        por_posto: porPostoResult.rows,
        por_combustivel: porCombustivelResult.rows,
        top_veiculos: topVeiculosResult.rows,
        diarias: diariasResult.rows,
        periodo_dias: dias
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas consolidadas:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar estatísticas consolidadas de abastecimentos'
    });
  }
});

export default router;