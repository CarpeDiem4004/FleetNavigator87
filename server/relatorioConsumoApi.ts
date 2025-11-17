import { Request, Response } from 'express';
import { pool } from './db';

interface RankingBase {
  base: string;
  total_solicitado: number;
  quantidade_solicitacoes: number;
}

interface RankingVeiculo {
  placa: string;
  total_solicitado: number;
  quantidade_solicitacoes: number;
  base: string;
}

interface InconsistenciaVeiculo {
  placa: string;
  base?: string;
  quantidade_rotas?: number;
  total_solicitado?: number;
}

interface RelatorioConsumoResponse {
  ranking_bases: RankingBase[];
  ranking_veiculos: RankingVeiculo[];
  inconsistencias_solicitou_mas_nao_rodou: InconsistenciaVeiculo[];
  inconsistencias_rodou_mas_nao_solicitou: InconsistenciaVeiculo[];
  totais: {
    total_solicitacoes: number;
    total_valor_solicitado: number;
    total_veiculos_rodaram: number;
    total_bases: number;
  };
}

/**
 * Gera relatório de consumo baseado em rotas e solicitações de saldo
 * GET /api/relatorio/consumo?data=YYYY-MM-DD
 */
export const getRelatorioConsumo = async (req: Request, res: Response) => {
  try {
    const { data } = req.query;

    if (!data || typeof data !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Parâmetro "data" é obrigatório no formato YYYY-MM-DD'
      });
    }

    console.log('[RELATORIO_CONSUMO] Gerando relatório para data:', data);

    // 1. RANKING DE BASES (bases que mais solicitaram saldo)
    const rankingBasesQuery = `
      SELECT 
        COALESCE(UPPER(base), 'SEM BASE') as base,
        COUNT(*) as quantidade_solicitacoes,
        SUM(COALESCE(valor_solicitado, 0)) as total_solicitado
      FROM solicitacoes_fuel_card
      WHERE DATE(data_solicitacao) = $1
        AND status != 'rejeitada'
      GROUP BY COALESCE(UPPER(base), 'SEM BASE')
      ORDER BY total_solicitado DESC;
    `;

    const rankingBasesResult = await pool.query(rankingBasesQuery, [data]);
    const ranking_bases: RankingBase[] = rankingBasesResult.rows.map(row => ({
      base: row.base,
      total_solicitado: parseFloat(row.total_solicitado) || 0,
      quantidade_solicitacoes: parseInt(row.quantidade_solicitacoes) || 0
    }));

    // 2. RANKING DE VEÍCULOS (carros que mais solicitaram saldo)
    const rankingVeiculosQuery = `
      SELECT 
        UPPER(placa) as placa,
        COALESCE(UPPER(base), 'SEM BASE') as base,
        COUNT(*) as quantidade_solicitacoes,
        SUM(COALESCE(valor_solicitado, 0)) as total_solicitado
      FROM solicitacoes_fuel_card
      WHERE DATE(data_solicitacao) = $1
        AND status != 'rejeitada'
        AND placa IS NOT NULL
      GROUP BY UPPER(placa), COALESCE(UPPER(base), 'SEM BASE')
      ORDER BY total_solicitado DESC;
    `;

    const rankingVeiculosResult = await pool.query(rankingVeiculosQuery, [data]);
    const ranking_veiculos: RankingVeiculo[] = rankingVeiculosResult.rows.map(row => ({
      placa: row.placa,
      base: row.base,
      total_solicitado: parseFloat(row.total_solicitado) || 0,
      quantidade_solicitacoes: parseInt(row.quantidade_solicitacoes) || 0
    }));

    // 3. INCONSISTÊNCIAS: Solicitou mas não rodou
    // (veículos que solicitaram saldo mas não aparecem no arquivo de rotas importado)
    const solicitouNaoRodouQuery = `
      SELECT 
        UPPER(s.placa) as placa,
        COALESCE(UPPER(s.base), 'SEM BASE') as base,
        SUM(COALESCE(s.valor_solicitado, 0)) as total_solicitado,
        COUNT(*) as quantidade_solicitacoes
      FROM solicitacoes_fuel_card s
      WHERE DATE(s.data_solicitacao) = $1
        AND s.status != 'rejeitada'
        AND s.placa IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 
          FROM conferencia_rotas_dados r
          WHERE UPPER(r.placa) = UPPER(s.placa)
            AND r.data = $1
        )
      GROUP BY UPPER(s.placa), COALESCE(UPPER(s.base), 'SEM BASE')
      ORDER BY total_solicitado DESC;
    `;

    const solicitouNaoRodouResult = await pool.query(solicitouNaoRodouQuery, [data]);
    const inconsistencias_solicitou_mas_nao_rodou: InconsistenciaVeiculo[] = solicitouNaoRodouResult.rows.map(row => ({
      placa: row.placa,
      base: row.base,
      total_solicitado: parseFloat(row.total_solicitado) || 0
    }));

    // 4. INCONSISTÊNCIAS: Rodou mas não solicitou
    // (veículos que aparecem no arquivo de rotas mas não solicitaram saldo)
    const rodouNaoSolicitouQuery = `
      SELECT 
        UPPER(r.placa) as placa,
        COUNT(*) as quantidade_rotas
      FROM conferencia_rotas_dados r
      WHERE r.data = $1
        AND r.placa IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 
          FROM solicitacoes_fuel_card s
          WHERE UPPER(s.placa) = UPPER(r.placa)
            AND DATE(s.data_solicitacao) = $1
            AND s.status != 'rejeitada'
        )
      GROUP BY UPPER(r.placa)
      ORDER BY quantidade_rotas DESC;
    `;

    const rodouNaoSolicitouResult = await pool.query(rodouNaoSolicitouQuery, [data]);
    const inconsistencias_rodou_mas_nao_solicitou: InconsistenciaVeiculo[] = rodouNaoSolicitouResult.rows.map(row => ({
      placa: row.placa,
      quantidade_rotas: parseInt(row.quantidade_rotas) || 0
    }));

    // 5. TOTALIZADORES (queries separadas para precisão)
    // Total de solicitações e valor
    const solicitacoesQuery = `
      SELECT 
        COUNT(DISTINCT id) as total_solicitacoes,
        SUM(COALESCE(valor_solicitado, 0)) as total_valor_solicitado,
        COUNT(DISTINCT COALESCE(UPPER(base), 'SEM BASE')) as total_bases
      FROM solicitacoes_fuel_card
      WHERE DATE(data_solicitacao) = $1
        AND status != 'rejeitada';
    `;

    const solicitacoesResult = await pool.query(solicitacoesQuery, [data]);
    const solicitacoesRow = solicitacoesResult.rows[0];

    // Total de veículos que rodaram
    const veiculosRodaramQuery = `
      SELECT COUNT(DISTINCT UPPER(placa)) as total_veiculos_rodaram
      FROM conferencia_rotas_dados
      WHERE data = $1
        AND placa IS NOT NULL;
    `;

    const veiculosRodaramResult = await pool.query(veiculosRodaramQuery, [data]);
    const veiculosRodaramRow = veiculosRodaramResult.rows[0];

    const totais = {
      total_solicitacoes: parseInt(solicitacoesRow.total_solicitacoes) || 0,
      total_valor_solicitado: parseFloat(solicitacoesRow.total_valor_solicitado) || 0,
      total_veiculos_rodaram: parseInt(veiculosRodaramRow.total_veiculos_rodaram) || 0,
      total_bases: parseInt(solicitacoesRow.total_bases) || 0
    };

    const response: RelatorioConsumoResponse = {
      ranking_bases,
      ranking_veiculos,
      inconsistencias_solicitou_mas_nao_rodou,
      inconsistencias_rodou_mas_nao_solicitou,
      totais
    };

    console.log('[RELATORIO_CONSUMO] Relatório gerado com sucesso:', {
      bases: ranking_bases.length,
      veiculos: ranking_veiculos.length,
      solicitou_nao_rodou: inconsistencias_solicitou_mas_nao_rodou.length,
      rodou_nao_solicitou: inconsistencias_rodou_mas_nao_solicitou.length
    });

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('[RELATORIO_CONSUMO] Erro ao gerar relatório:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório de consumo',
      error: (error as Error).message
    });
  }
};
