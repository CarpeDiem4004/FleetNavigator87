import { Router, Request, Response } from "express";
import { pool } from "../db";

const router = Router();

interface ViagensQuery {
  data_inicio?: string;
  data_fim?: string;
  placa?: string;
  rota?: string;
  valor_min?: string;
  valor_max?: string;
  page?: string;
  limit?: string;
  format?: 'json' | 'csv' | 'excel';
}

function buildWhereClause(filters: ViagensQuery) {
  const params: any[] = [];
  let paramIndex = 1;
  let whereClause = "1=1";

  if (filters.data_inicio) {
    whereClause += ` AND data_viagem >= $${paramIndex}`;
    params.push(filters.data_inicio);
    paramIndex++;
  }

  if (filters.data_fim) {
    whereClause += ` AND data_viagem <= $${paramIndex}`;
    params.push(filters.data_fim);
    paramIndex++;
  }

  if (filters.placa) {
    whereClause += ` AND UPPER(placa) LIKE UPPER($${paramIndex})`;
    params.push(`%${filters.placa}%`);
    paramIndex++;
  }

  if (filters.rota) {
    whereClause += ` AND UPPER(rota) LIKE UPPER($${paramIndex})`;
    params.push(`%${filters.rota}%`);
    paramIndex++;
  }

  if (filters.valor_min) {
    const valorMin = parseFloat(filters.valor_min);
    if (!isNaN(valorMin)) {
      whereClause += ` AND valor >= $${paramIndex}`;
      params.push(valorMin);
      paramIndex++;
    }
  }

  if (filters.valor_max) {
    const valorMax = parseFloat(filters.valor_max);
    if (!isNaN(valorMax)) {
      whereClause += ` AND valor <= $${paramIndex}`;
      params.push(valorMax);
      paramIndex++;
    }
  }

  return { whereClause, params, paramIndex };
}

router.get("/api/viagens/export", async (req: Request, res: Response) => {
  try {
    const { 
      data_inicio, 
      data_fim, 
      placa, 
      rota, 
      valor_min, 
      valor_max,
      page = "1",
      limit = "1000",
      format = "json"
    } = req.query as ViagensQuery;

    const filters = { data_inicio, data_fim, placa, rota, valor_min, valor_max };
    const { whereClause, params, paramIndex } = buildWhereClause(filters);

    let query = `
      SELECT 
        data_viagem as "Data",
        placa as "Placa",
        rota as "Rota",
        valor as "Valor"
      FROM viagens
      WHERE ${whereClause}
      ORDER BY data_viagem DESC, placa
    `;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(10000, Math.max(1, parseInt(limit) || 1000));
    
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limitNum);
    params.push((pageNum - 1) * limitNum);

    const result = await pool.query(query, params);

    const { whereClause: countWhere, params: countParams } = buildWhereClause(filters);
    const countQuery = `SELECT COUNT(*) as total FROM viagens WHERE ${countWhere}`;
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    const formattedRows = result.rows.map((row: any) => ({
      Data: row.Data ? new Date(row.Data).toISOString().split('T')[0] : '',
      Placa: row.Placa,
      Rota: row.Rota,
      Valor: parseFloat(row.Valor) || 0
    }));

    if (format === 'csv') {
      const csvHeader = 'Data,Placa,Rota,Valor\n';
      const csvRows = formattedRows.map((row: any) => 
        `${row.Data},${row.Placa},"${row.Rota}",${row.Valor.toFixed(2)}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="viagens_export.csv"');
      return res.send(csvHeader + csvRows);
    }

    if (format === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.ms-excel');
      res.setHeader('Content-Disposition', 'attachment; filename="viagens_export.xls"');
      
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head><meta charset="UTF-8"></head>
        <body>
        <table border="1">
          <thead>
            <tr>
              <th>Data</th>
              <th>Placa</th>
              <th>Rota</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      formattedRows.forEach((row: any) => {
        const valorFormatado = row.Valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        html += `
          <tr>
            <td>${row.Data}</td>
            <td>${row.Placa}</td>
            <td>${row.Rota}</td>
            <td>R$ ${valorFormatado}</td>
          </tr>
        `;
      });
      
      html += '</tbody></table></body></html>';
      return res.send(html);
    }

    res.json({
      data: formattedRows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error: any) {
    console.error("[VIAGENS] Erro ao exportar viagens:", error);
    res.status(500).json({ error: "Erro ao exportar viagens", details: error.message });
  }
});

router.get("/api/viagens/rotas", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT rota FROM viagens ORDER BY rota
    `);
    res.json(result.rows.map(r => r.rota));
  } catch (error: any) {
    console.error("[VIAGENS] Erro ao listar rotas:", error);
    res.status(500).json({ error: "Erro ao listar rotas" });
  }
});

router.get("/api/viagens/placas", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT placa FROM viagens ORDER BY placa
    `);
    res.json(result.rows.map(r => r.placa));
  } catch (error: any) {
    console.error("[VIAGENS] Erro ao listar placas:", error);
    res.status(500).json({ error: "Erro ao listar placas" });
  }
});

router.get("/api/viagens/stats", async (req: Request, res: Response) => {
  try {
    const { data_inicio, data_fim, placa, rota } = req.query as ViagensQuery;
    const filters = { data_inicio, data_fim, placa, rota };
    const { whereClause, params } = buildWhereClause(filters);

    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_viagens,
        COUNT(DISTINCT placa) as total_veiculos,
        COUNT(DISTINCT rota) as total_rotas,
        COALESCE(SUM(valor), 0) as valor_total,
        COALESCE(AVG(valor), 0) as valor_medio,
        COALESCE(MIN(valor), 0) as valor_minimo,
        COALESCE(MAX(valor), 0) as valor_maximo
      FROM viagens
      WHERE ${whereClause}
    `, params);

    const stats = result.rows[0];
    res.json({
      total_viagens: parseInt(stats.total_viagens) || 0,
      total_veiculos: parseInt(stats.total_veiculos) || 0,
      total_rotas: parseInt(stats.total_rotas) || 0,
      valor_total: parseFloat(stats.valor_total) || 0,
      valor_medio: parseFloat(stats.valor_medio) || 0,
      valor_minimo: parseFloat(stats.valor_minimo) || 0,
      valor_maximo: parseFloat(stats.valor_maximo) || 0
    });
  } catch (error: any) {
    console.error("[VIAGENS] Erro ao obter estatísticas:", error);
    res.status(500).json({ error: "Erro ao obter estatísticas" });
  }
});

router.post("/api/viagens", async (req: Request, res: Response) => {
  try {
    const { data_viagem, placa, rota, valor } = req.body;

    if (!data_viagem || !placa || !rota) {
      return res.status(400).json({ error: "Campos obrigatórios: data_viagem, placa, rota" });
    }

    const result = await pool.query(
      `INSERT INTO viagens (data_viagem, placa, rota, valor) VALUES ($1, $2, $3, $4) RETURNING *`,
      [data_viagem, placa.toUpperCase(), rota, parseFloat(valor) || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error("[VIAGENS] Erro ao criar viagem:", error);
    res.status(500).json({ error: "Erro ao criar viagem", details: error.message });
  }
});

router.post("/api/viagens/bulk", async (req: Request, res: Response) => {
  try {
    const { viagens } = req.body;

    if (!Array.isArray(viagens) || viagens.length === 0) {
      return res.status(400).json({ error: "Array de viagens é obrigatório" });
    }

    const values = viagens.map((v: any, i: number) => {
      const base = i * 4;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
    }).join(', ');

    const params: any[] = [];
    viagens.forEach((v: any) => {
      params.push(v.data_viagem, v.placa?.toUpperCase(), v.rota, parseFloat(v.valor) || 0);
    });

    const result = await pool.query(
      `INSERT INTO viagens (data_viagem, placa, rota, valor) VALUES ${values} RETURNING *`,
      params
    );

    res.status(201).json({ inserted: result.rowCount, viagens: result.rows });
  } catch (error: any) {
    console.error("[VIAGENS] Erro ao inserir viagens em lote:", error);
    res.status(500).json({ error: "Erro ao inserir viagens", details: error.message });
  }
});

export default router;
