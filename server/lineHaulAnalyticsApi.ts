import { Router, Request, Response } from 'express';
import { pool } from './db';

const router = Router();

router.get('/api/linehaul/analytics', async (req: Request, res: Response) => {
  try {
    const { dataInicio, dataFim, veiculo, rota, operacao } = req.query;
    
    let whereClause = `WHERE (origem_tipo = 'line_hall' OR base ILIKE '%line%hall%' OR base ILIKE '%line%haul%' OR provedor_cartao ILIKE '%line%')`;
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
      whereClause += ` AND placa = $${paramIndex}`;
      params.push(veiculo);
      paramIndex++;
    }
    
    if (rota && rota !== 'all') {
      whereClause += ` AND id_rota ILIKE $${paramIndex}`;
      params.push(`%${rota}%`);
      paramIndex++;
    }
    
    if (operacao && operacao !== 'all') {
      whereClause += ` AND observacoes ILIKE $${paramIndex}`;
      params.push(`%Operação: ${operacao}%`);
      paramIndex++;
    }

    const cardsQuery = `
      SELECT 
        COALESCE(SUM(valor_solicitado), 0) as custo_total,
        COUNT(*) as total_viagens,
        COUNT(DISTINCT id_rota) as rotas_distintas,
        CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(valor_solicitado), 0) / COUNT(*) ELSE 0 END as custo_medio
      FROM solicitacoes_fuel_card
      ${whereClause}
    `;
    
    const cardsResult = await pool.query(cardsQuery, params);
    
    const veiculoMaisCaroQuery = `
      SELECT placa, SUM(valor_solicitado) as total
      FROM solicitacoes_fuel_card
      ${whereClause}
      GROUP BY placa
      ORDER BY total DESC
      LIMIT 1
    `;
    const veiculoResult = await pool.query(veiculoMaisCaroQuery, params);

    const rotasMaisRealizadasQuery = `
      SELECT 
        CASE 
          WHEN rota_origem IS NOT NULL AND rota_origem != '' AND rota_destino IS NOT NULL AND rota_destino != ''
          THEN SUBSTRING(rota_origem FROM 1 FOR 20) || ' → ' || SUBSTRING(rota_destino FROM 1 FOR 20)
          WHEN id_rota IS NOT NULL AND id_rota != '' THEN id_rota
          ELSE COALESCE(provedor_cartao, 'Sem Rota')
        END as rota,
        COUNT(*) as quantidade
      FROM solicitacoes_fuel_card
      ${whereClause}
      GROUP BY rota
      ORDER BY quantidade DESC
      LIMIT 10
    `;
    const rotasMaisRealizadas = await pool.query(rotasMaisRealizadasQuery, params);

    const rotasMaisCarasQuery = `
      SELECT 
        CASE 
          WHEN rota_origem IS NOT NULL AND rota_origem != '' AND rota_destino IS NOT NULL AND rota_destino != ''
          THEN SUBSTRING(rota_origem FROM 1 FOR 20) || ' → ' || SUBSTRING(rota_destino FROM 1 FOR 20)
          WHEN id_rota IS NOT NULL AND id_rota != '' THEN id_rota
          ELSE COALESCE(provedor_cartao, 'Sem Rota')
        END as rota,
        SUM(valor_solicitado) as valor
      FROM solicitacoes_fuel_card
      ${whereClause}
      GROUP BY rota
      ORDER BY valor DESC
      LIMIT 10
    `;
    const rotasMaisCaras = await pool.query(rotasMaisCarasQuery, params);

    const custoPorVeiculoQuery = `
      SELECT 
        placa,
        SUM(valor_solicitado) as valor
      FROM solicitacoes_fuel_card
      ${whereClause}
      GROUP BY placa
      ORDER BY valor DESC
      LIMIT 15
    `;
    const custoPorVeiculo = await pool.query(custoPorVeiculoQuery, params);

    const evolucaoCustoQuery = `
      SELECT 
        TO_CHAR(DATE(created_at), 'DD/MM') as data,
        SUM(valor_solicitado) as valor
      FROM solicitacoes_fuel_card
      ${whereClause}
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `;
    const evolucaoCusto = await pool.query(evolucaoCustoQuery, params);

    const tabelaAnaliticaQuery = `
      SELECT 
        CASE 
          WHEN rota_origem IS NOT NULL AND rota_origem != '' AND rota_destino IS NOT NULL AND rota_destino != ''
          THEN SUBSTRING(rota_origem FROM 1 FOR 25) || ' → ' || SUBSTRING(rota_destino FROM 1 FOR 25)
          WHEN id_rota IS NOT NULL AND id_rota != '' THEN id_rota
          ELSE COALESCE(provedor_cartao, 'Sem Rota')
        END as rota,
        COUNT(*) as viagens,
        SUM(valor_solicitado) as valor_total,
        AVG(valor_solicitado) as custo_medio,
        COUNT(DISTINCT placa) as veiculos_envolvidos
      FROM solicitacoes_fuel_card
      ${whereClause}
      GROUP BY rota
      ORDER BY valor_total DESC
    `;
    const tabelaAnalitica = await pool.query(tabelaAnaliticaQuery, params);

    const veiculosQuery = `
      SELECT DISTINCT placa 
      FROM solicitacoes_fuel_card 
      ${whereClause}
      ORDER BY placa
    `;
    const veiculosResult = await pool.query(veiculosQuery, params);

    const rotasQuery = `
      SELECT DISTINCT COALESCE(id_rota, 'Sem Rota') as rota
      FROM solicitacoes_fuel_card
      ${whereClause}
      ORDER BY rota
    `;
    const rotasResult = await pool.query(rotasQuery, params);

    const comparativoOperacoesQuery = `
      SELECT 
        CASE 
          WHEN observacoes ILIKE '%Mercado Livre%' THEN 'Mercado Livre'
          WHEN observacoes ILIKE '%Shopee%' OR base ILIKE '%SHOPEE%' THEN 'Shopee'
          ELSE 'Shopee'
        END as operacao,
        COUNT(*) as solicitacoes,
        SUM(valor_solicitado) as valor_total
      FROM solicitacoes_fuel_card
      WHERE origem_tipo = 'line_hall' OR base ILIKE '%line%hall%' OR base ILIKE '%line%haul%' OR provedor_cartao ILIKE '%line%'
      GROUP BY operacao
      ORDER BY valor_total DESC
    `;
    const comparativoOperacoes = await pool.query(comparativoOperacoesQuery);

    const rotasABQuery = `
      SELECT 
        COALESCE(NULLIF(rota_origem, ''), 'N/A') || ' → ' || COALESCE(NULLIF(rota_destino, ''), 'N/A') as rota,
        COUNT(*) as quantidade,
        SUM(valor_solicitado) as valor_total
      FROM solicitacoes_fuel_card
      ${whereClause}
        AND (rota_origem IS NOT NULL AND rota_origem != '' OR rota_destino IS NOT NULL AND rota_destino != '')
      GROUP BY rota_origem, rota_destino
      ORDER BY quantidade DESC
      LIMIT 15
    `;
    const rotasAB = await pool.query(rotasABQuery, params);

    // Query para exportação detalhada com datas
    const rotasDetalhadasQuery = `
      SELECT 
        CASE 
          WHEN rota_origem IS NOT NULL AND rota_origem != '' AND rota_destino IS NOT NULL AND rota_destino != ''
          THEN rota_origem || ' → ' || rota_destino
          WHEN id_rota IS NOT NULL AND id_rota != '' THEN id_rota
          ELSE COALESCE(provedor_cartao, 'Sem Rota')
        END as rota,
        placa,
        motorista,
        valor_solicitado,
        data_solicitacao,
        data_uso,
        status
      FROM solicitacoes_fuel_card
      ${whereClause}
      ORDER BY data_solicitacao DESC
    `;
    const rotasDetalhadas = await pool.query(rotasDetalhadasQuery, params);

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
          veiculoMaisCaro: veiculoMaisCaro?.placa || '-',
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
        veiculos: veiculosResult.rows.map(r => r.placa),
        rotas: rotasResult.rows.map(r => r.rota),
        comparativoOperacoes: comparativoOperacoes.rows.map(r => ({
          operacao: r.operacao,
          solicitacoes: parseInt(r.solicitacoes),
          valorTotal: parseFloat(r.valor_total)
        })),
        rotasAB: rotasAB.rows.map(r => ({
          rota: r.rota,
          quantidade: parseInt(r.quantidade),
          valorTotal: parseFloat(r.valor_total)
        })),
        rotasDetalhadas: rotasDetalhadas.rows.map(r => ({
          rota: r.rota,
          placa: r.placa,
          motorista: r.motorista,
          valor: parseFloat(r.valor_solicitado || 0),
          dataSolicitacao: r.data_solicitacao,
          dataUso: r.data_uso,
          status: r.status
        }))
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
