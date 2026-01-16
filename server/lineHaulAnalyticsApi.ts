import { Router, Request, Response } from 'express';
import { pool } from './db';

const router = Router();

router.get('/api/linehaul/analytics', async (req: Request, res: Response) => {
  try {
    const { dataInicio, dataFim, veiculo, rota } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (dataInicio) {
      whereClause += ` AND DATE(created_at) >= $${paramIndex}`;
      params.push(dataInicio);
      paramIndex++;
    }
    
    if (dataFim) {
      whereClause += ` AND DATE(created_at) <= $${paramIndex}`;
      params.push(dataFim);
      paramIndex++;
    }
    
    if (veiculo && veiculo !== 'all') {
      whereClause += ` AND veiculo_placa = $${paramIndex}`;
      params.push(veiculo);
      paramIndex++;
    }
    
    if (rota && rota !== 'all') {
      whereClause += ` AND CONCAT(COALESCE(rota_origem, ''), ' → ', COALESCE(rota_destino, '')) ILIKE $${paramIndex}`;
      params.push(`%${rota}%`);
      paramIndex++;
    }

    const cardsQuery = `
      SELECT 
        COALESCE(SUM(valor_calculado), 0) as custo_total,
        COUNT(*) as total_viagens,
        COUNT(DISTINCT CONCAT(COALESCE(rota_origem, ''), ' → ', COALESCE(rota_destino, ''))) as rotas_distintas,
        CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(valor_calculado), 0) / COUNT(*) ELSE 0 END as custo_medio
      FROM linehall_fuel_card_requests
      ${whereClause}
    `;
    
    const cardsResult = await pool.query(cardsQuery, params);
    
    const veiculoMaisCaroQuery = `
      SELECT veiculo_placa, SUM(valor_calculado) as total
      FROM linehall_fuel_card_requests
      ${whereClause}
      GROUP BY veiculo_placa
      ORDER BY total DESC
      LIMIT 1
    `;
    const veiculoResult = await pool.query(veiculoMaisCaroQuery, params);

    const rotasMaisRealizadasQuery = `
      SELECT 
        CONCAT(COALESCE(rota_origem, 'N/I'), ' → ', COALESCE(rota_destino, 'N/I')) as rota,
        COUNT(*) as quantidade
      FROM linehall_fuel_card_requests
      ${whereClause}
      GROUP BY rota_origem, rota_destino
      ORDER BY quantidade DESC
      LIMIT 10
    `;
    const rotasMaisRealizadas = await pool.query(rotasMaisRealizadasQuery, params);

    const rotasMaisCarasQuery = `
      SELECT 
        CONCAT(COALESCE(rota_origem, 'N/I'), ' → ', COALESCE(rota_destino, 'N/I')) as rota,
        SUM(valor_calculado) as valor
      FROM linehall_fuel_card_requests
      ${whereClause}
      GROUP BY rota_origem, rota_destino
      ORDER BY valor DESC
      LIMIT 10
    `;
    const rotasMaisCaras = await pool.query(rotasMaisCarasQuery, params);

    const custoPorVeiculoQuery = `
      SELECT 
        veiculo_placa as placa,
        SUM(valor_calculado) as valor
      FROM linehall_fuel_card_requests
      ${whereClause}
      GROUP BY veiculo_placa
      ORDER BY valor DESC
      LIMIT 15
    `;
    const custoPorVeiculo = await pool.query(custoPorVeiculoQuery, params);

    const evolucaoCustoQuery = `
      SELECT 
        TO_CHAR(DATE(created_at), 'DD/MM') as data,
        SUM(valor_calculado) as valor
      FROM linehall_fuel_card_requests
      ${whereClause}
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `;
    const evolucaoCusto = await pool.query(evolucaoCustoQuery, params);

    const tabelaAnaliticaQuery = `
      SELECT 
        CONCAT(COALESCE(rota_origem, 'N/I'), ' → ', COALESCE(rota_destino, 'N/I')) as rota,
        COUNT(*) as viagens,
        SUM(valor_calculado) as valor_total,
        AVG(valor_calculado) as custo_medio,
        COUNT(DISTINCT veiculo_placa) as veiculos_envolvidos
      FROM linehall_fuel_card_requests
      ${whereClause}
      GROUP BY rota_origem, rota_destino
      ORDER BY valor_total DESC
    `;
    const tabelaAnalitica = await pool.query(tabelaAnaliticaQuery, params);

    const veiculosQuery = `
      SELECT DISTINCT veiculo_placa 
      FROM linehall_fuel_card_requests 
      WHERE veiculo_placa IS NOT NULL
      ORDER BY veiculo_placa
    `;
    const veiculosResult = await pool.query(veiculosQuery);

    const rotasQuery = `
      SELECT DISTINCT CONCAT(COALESCE(rota_origem, 'N/I'), ' → ', COALESCE(rota_destino, 'N/I')) as rota
      FROM linehall_fuel_card_requests
      WHERE rota_origem IS NOT NULL OR rota_destino IS NOT NULL
      ORDER BY rota
    `;
    const rotasResult = await pool.query(rotasQuery);

    const cards = cardsResult.rows[0];
    const veiculoMaisCaro = veiculoResult.rows[0];

    res.json({
      success: true,
      data: {
        cards: {
          custoTotal: parseFloat(cards?.custo_total || 0),
          totalViagens: parseInt(cards?.total_viagens || 0),
          rotasDistintas: parseInt(cards?.rotas_distintas || 0),
          custoMedio: parseFloat(cards?.custo_medio || 0),
          veiculoMaisCaro: veiculoMaisCaro?.veiculo_placa || '-',
          veiculoMaisCaroValor: parseFloat(veiculoMaisCaro?.total || 0)
        },
        rotasMaisRealizadas: rotasMaisRealizadas.rows.map(r => ({
          rota: r.rota,
          quantidade: parseInt(r.quantidade)
        })),
        rotasMaisCaras: rotasMaisCaras.rows.map(r => ({
          rota: r.rota,
          valor: parseFloat(r.valor)
        })),
        custoPorVeiculo: custoPorVeiculo.rows.map(r => ({
          placa: r.placa,
          valor: parseFloat(r.valor)
        })),
        evolucaoCusto: evolucaoCusto.rows.map(r => ({
          data: r.data,
          valor: parseFloat(r.valor)
        })),
        tabelaAnalitica: tabelaAnalitica.rows.map(r => ({
          rota: r.rota,
          viagens: parseInt(r.viagens),
          valorTotal: parseFloat(r.valor_total),
          custoMedio: parseFloat(r.custo_medio),
          veiculosEnvolvidos: parseInt(r.veiculos_envolvidos)
        })),
        veiculos: veiculosResult.rows.map(r => r.veiculo_placa),
        rotas: rotasResult.rows.map(r => r.rota)
      }
    });
  } catch (error: any) {
    console.error('[LineHaul Analytics] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar analytics',
      error: error.message
    });
  }
});

export default router;
