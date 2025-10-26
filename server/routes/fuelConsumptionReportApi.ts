import { Request, Response } from 'express';
import { storage } from '../storage';

/**
 * Relatório de Consumo de Combustível
 * Mostra consumo tanto em postos quanto em cartões, com medições por base e provedor
 */

interface ConsumptionData {
  posto: {
    total_litros: number;
    total_valor: number;
    por_base: Array<{
      base: string;
      litros: number;
      valor: number;
      registros: number;
    }>;
  };
  cartao: {
    total_litros: number;
    total_valor: number;
    por_base: Array<{
      base: string;
      litros: number;
      valor: number;
      registros: number;
    }>;
    por_provedor: {
      ticket: {
        litros: number;
        valor: number;
        registros: number;
      };
      veloe: {
        litros: number;
        valor: number;
        registros: number;
      };
    };
  };
  total_geral: {
    litros: number;
    valor: number;
  };
}

export async function getFuelConsumptionReport(req: Request, res: Response) {
  try {
    const { start_date, end_date, base } = req.query;

    // Query para consumo em POSTOS
    let postoQuery = `
      SELECT 
        COALESCE(base_name, projeto, 'Não informado') as base,
        SUM(CAST(litros AS NUMERIC)) as total_litros,
        SUM(CAST(valor_total AS NUMERIC)) as total_valor,
        COUNT(*) as registros
      FROM abastecimentos_postos
      WHERE 1=1
    `;

    const postoParams: any[] = [];
    let paramCount = 1;

    if (start_date) {
      postoQuery += ` AND created_at >= $${paramCount}`;
      postoParams.push(start_date);
      paramCount++;
    }

    if (end_date) {
      postoQuery += ` AND created_at <= $${paramCount}`;
      postoParams.push(end_date);
      paramCount++;
    }

    if (base) {
      postoQuery += ` AND (base_name = $${paramCount} OR projeto = $${paramCount})`;
      postoParams.push(base);
      paramCount++;
    }

    postoQuery += ` GROUP BY base_name, projeto ORDER BY total_valor DESC`;

    const postoResult = await storage.query(postoQuery, postoParams);

    // Query para consumo em CARTÕES
    let cartaoQuery = `
      SELECT 
        COALESCE(base, 'Não informado') as base,
        provedor_cartao,
        SUM(CAST(COALESCE(litros_solicitados, 0) AS NUMERIC)) as total_litros,
        SUM(CAST(COALESCE(valor_solicitado, 0) AS NUMERIC)) as total_valor,
        COUNT(*) as registros
      FROM solicitacoes_fuel_card
      WHERE status IN ('Recarga Efetuada', 'atendido')
    `;

    const cartaoParams: any[] = [];
    paramCount = 1;

    if (start_date) {
      cartaoQuery += ` AND COALESCE(data_uso, data_solicitacao) >= $${paramCount}`;
      cartaoParams.push(start_date);
      paramCount++;
    }

    if (end_date) {
      cartaoQuery += ` AND COALESCE(data_uso, data_solicitacao) <= $${paramCount}`;
      cartaoParams.push(end_date);
      paramCount++;
    }

    if (base) {
      cartaoQuery += ` AND base = $${paramCount}`;
      cartaoParams.push(base);
      paramCount++;
    }

    cartaoQuery += ` GROUP BY base, provedor_cartao ORDER BY total_valor DESC`;

    const cartaoResult = await storage.query(cartaoQuery, cartaoParams);

    // Processar dados de postos
    const postoPorBase = postoResult.rows.map((row: any) => ({
      base: row.base || 'Não informado',
      litros: parseFloat(row.total_litros) || 0,
      valor: parseFloat(row.total_valor) || 0,
      registros: parseInt(row.registros) || 0
    }));

    const postoTotalLitros = postoPorBase.reduce((sum, b) => sum + b.litros, 0);
    const postoTotalValor = postoPorBase.reduce((sum, b) => sum + b.valor, 0);

    // Processar dados de cartões
    const cartaoPorBase: Map<string, { litros: number; valor: number; registros: number }> = new Map();
    let ticketLitros = 0;
    let ticketValor = 0;
    let ticketRegistros = 0;
    let veloeLitros = 0;
    let veloeValor = 0;
    let veloeRegistros = 0;

    cartaoResult.rows.forEach((row: any) => {
      const base = row.base || 'Não informado';
      const litros = parseFloat(row.total_litros) || 0;
      const valor = parseFloat(row.total_valor) || 0;
      const registros = parseInt(row.registros) || 0;
      const provedor = (row.provedor_cartao || '').toLowerCase();

      // Agregar por base
      const baseData = cartaoPorBase.get(base) || { litros: 0, valor: 0, registros: 0 };
      baseData.litros += litros;
      baseData.valor += valor;
      baseData.registros += registros;
      cartaoPorBase.set(base, baseData);

      // Agregar por provedor
      if (provedor.includes('ticket')) {
        ticketLitros += litros;
        ticketValor += valor;
        ticketRegistros += registros;
      } else if (provedor.includes('veloe') || provedor.includes('alelo')) {
        veloeLitros += litros;
        veloeValor += valor;
        veloeRegistros += registros;
      }
    });

    const cartaoPorBaseArray = Array.from(cartaoPorBase.entries()).map(([base, data]) => ({
      base,
      ...data
    })).sort((a, b) => b.valor - a.valor);

    const cartaoTotalLitros = cartaoPorBaseArray.reduce((sum, b) => sum + b.litros, 0);
    const cartaoTotalValor = cartaoPorBaseArray.reduce((sum, b) => sum + b.valor, 0);

    // Montar resposta
    const report: ConsumptionData = {
      posto: {
        total_litros: postoTotalLitros,
        total_valor: postoTotalValor,
        por_base: postoPorBase
      },
      cartao: {
        total_litros: cartaoTotalLitros,
        total_valor: cartaoTotalValor,
        por_base: cartaoPorBaseArray,
        por_provedor: {
          ticket: {
            litros: ticketLitros,
            valor: ticketValor,
            registros: ticketRegistros
          },
          veloe: {
            litros: veloeLitros,
            valor: veloeValor,
            registros: veloeRegistros
          }
        }
      },
      total_geral: {
        litros: postoTotalLitros + cartaoTotalLitros,
        valor: postoTotalValor + cartaoTotalValor
      }
    };

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Erro ao gerar relatório de consumo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao gerar relatório de consumo',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Busca lista de bases disponíveis para filtro
 */
export async function getBasesForFilter(req: Request, res: Response) {
  try {
    // Buscar bases de postos
    const postoBases = await storage.query(`
      SELECT DISTINCT COALESCE(base_name, projeto) as base
      FROM abastecimentos_postos
      WHERE COALESCE(base_name, projeto) IS NOT NULL
      ORDER BY COALESCE(base_name, projeto)
    `);

    // Buscar bases de cartões
    const cartaoBases = await storage.query(`
      SELECT DISTINCT base
      FROM solicitacoes_fuel_card
      WHERE base IS NOT NULL
      ORDER BY base
    `);

    // Combinar e remover duplicatas
    const allBases = new Set<string>();
    postoBases.rows.forEach((row: any) => row.base && allBases.add(row.base));
    cartaoBases.rows.forEach((row: any) => row.base && allBases.add(row.base));

    const bases = Array.from(allBases).sort();

    res.json({ success: true, data: bases });
  } catch (error) {
    console.error('Erro ao buscar bases:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar bases',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
