import { Router, Request, Response } from 'express';
import { pool } from './db';
import multer from 'multer';
import xlsx from 'xlsx';

// Middleware para verificar autenticação
function isAuthenticated(req: Request, res: Response, next: any) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  if (req.user) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Não autenticado' });
}

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

interface ExcelDate {
  v?: number | string | Date;
  t?: string;
  w?: string;
}

// Função auxiliar para converter datas do Excel
function convertExcelDate(value: any): string | null {
  if (!value) return null;
  
  if (typeof value === 'number') {
    // Data serial do Excel
    const date = new Date((value - 25569) * 86400 * 1000);
    const utcDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
    return utcDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  } else if (typeof value === 'string') {
    // Se já estiver em string, retornar
    return value;
  } else if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  
  return null;
}

// Função auxiliar para processar valores numéricos
function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

// Upload e processamento do arquivo Excel
router.post('/upload', isAuthenticated, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado' });
    }

    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
    }

    const userId = user.id;

    // Ler arquivo Excel
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });

    console.log('[INDICADORES] Abas disponíveis:', workbook.SheetNames);

    // Criar registro de upload
    const uploadResult = await pool.query(
      `INSERT INTO indicadores_uploads (filename, upload_date, user_id, total_records)
       VALUES ($1, CURRENT_DATE, $2, 0) RETURNING id`,
      [req.file.originalname, userId]
    );

    const uploadId = uploadResult.rows[0].id;
    let totalRecords = 0;

    // Processar aba "Peças"
    if (workbook.SheetNames.includes('Peças')) {
      const worksheet = workbook.Sheets['Peças'];
      const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
      
      const headers: any = data[0];
      const rows = data.slice(1);

      console.log('[INDICADORES] Processando aba Peças:', rows.length, 'linhas');

      for (const row of rows) {
        const rowData: any = row;
        const dataValue = convertExcelDate(rowData[0]);
        
        if (dataValue) {
          await pool.query(
            `INSERT INTO indicadores_pecas (
              upload_id, data, filtro_combustivel, filtro_ar, filtro_oleo,
              oleo_motor_5w30, pastilha_freio_dianteira, filtro_combustivel_master_2023,
              pastilha_freio_traseira, disco_freio_dianteiro, disco_freio_traseiro
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              uploadId,
              dataValue,
              parseNumber(rowData[1]),
              parseNumber(rowData[2]),
              parseNumber(rowData[3]),
              parseNumber(rowData[4]),
              parseNumber(rowData[5]),
              parseNumber(rowData[6]),
              parseNumber(rowData[7]),
              parseNumber(rowData[8]),
              parseNumber(rowData[9])
            ]
          );
          totalRecords++;
        }
      }
    }

    // Processar aba "Dados"
    if (workbook.SheetNames.includes('Dados')) {
      const worksheet = workbook.Sheets['Dados'];
      const data = xlsx.utils.sheet_to_json(worksheet);
      
      console.log('[INDICADORES] Processando aba Dados:', data.length, 'registros');

      for (const row of data as any[]) {
        if (row['Placa']) {
          await pool.query(
            `INSERT INTO indicadores_dados (
              upload_id, oficina_debito, atendimento, placa, modelo, km, relato, data_agenda, focal
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              uploadId,
              row['oficina em debito'] || null,
              row['Atendimento'] || null,
              row['Placa'],
              row['Modelo'] || null,
              parseNumber(row['km']),
              row['Relato '] || row['Relato'] || null,
              convertExcelDate(row['Data Agenda']),
              row['Focal'] || null
            ]
          );
          totalRecords++;
        }
      }
    }

    // Processar aba "Liberado"
    if (workbook.SheetNames.includes('Liberado')) {
      const worksheet = workbook.Sheets['Liberado'];
      const data = xlsx.utils.sheet_to_json(worksheet);
      
      console.log('[INDICADORES] Processando aba Liberado:', data.length, 'registros');

      for (const row of data as any[]) {
        if (row['Placa']) {
          await pool.query(
            `INSERT INTO indicadores_liberado (
              upload_id, data_forms, atendimento, placa, modelo, km, relato, 
              data_agenda, focal, reparo, tipo_manutencao, aprovacao, centro_custo,
              operacao, status, previsao_entrega, liberado, d_manut, status2, oficina,
              lider_base, mes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
            [
              uploadId,
              convertExcelDate(row['Data Forms']),
              row['Atendimento'] || null,
              row['Placa'],
              row['Modelo'] || null,
              parseNumber(row['km']),
              row['Relato '] || row['Relato'] || null,
              convertExcelDate(row['Data Agenda']),
              row['Focal'] || null,
              row['Reparo'] || null,
              row['Tipo de Manutenção'] || row['Tipo de manutenção'] || null,
              row['Aprovação '] || row['Aprovação'] || null,
              row['Centro de Custo'] || null,
              row['Operação'] || null,
              row['Status'] || null,
              convertExcelDate(row['Previsão de Entrega']),
              convertExcelDate(row['Liberado']),
              parseNumber(row['D+Manut']),
              row['Status2'] || null,
              row['Oficina'] || null,
              row['Lider Base'] || null,
              row['Mês'] || null
            ]
          );
          totalRecords++;
        }
      }
    }

    // Atualizar total de registros
    await pool.query(
      'UPDATE indicadores_uploads SET total_records = $1 WHERE id = $2',
      [totalRecords, uploadId]
    );

    console.log('[INDICADORES] Upload concluído:', totalRecords, 'registros processados');

    res.json({
      success: true,
      message: `Arquivo processado com sucesso! ${totalRecords} registros importados.`,
      uploadId,
      totalRecords
    });

  } catch (error) {
    console.error('[INDICADORES] Erro no upload:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar arquivo',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Listar uploads
router.get('/uploads', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT u.*, users.name as user_name
       FROM indicadores_uploads u
       LEFT JOIN users ON u.user_id = users.id
       ORDER BY u.upload_date DESC, u.created_at DESC
       LIMIT 50`
    );

    res.json({ success: true, uploads: result.rows });
  } catch (error) {
    console.error('[INDICADORES] Erro ao listar uploads:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar uploads' });
  }
});

// Buscar dados de peças
router.get('/pecas', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { uploadId } = req.query;

    let query = `
      SELECT * FROM indicadores_pecas
      WHERE upload_id = $1
      ORDER BY data DESC
    `;

    const result = await pool.query(query, [uploadId || 0]);

    res.json({ success: true, pecas: result.rows });
  } catch (error) {
    console.error('[INDICADORES] Erro ao buscar peças:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar dados de peças' });
  }
});

// Buscar dados em manutenção
router.get('/dados', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { uploadId } = req.query;

    const result = await pool.query(
      `SELECT * FROM indicadores_dados
       WHERE upload_id = $1
       ORDER BY data_agenda DESC NULLS LAST`,
      [uploadId || 0]
    );

    res.json({ success: true, dados: result.rows });
  } catch (error) {
    console.error('[INDICADORES] Erro ao buscar dados:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar dados em manutenção' });
  }
});

// Criar nova manutenção
router.post('/dados', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { upload_id, placa, modelo, km, relato, data_agenda, focal, oficina_debito, atendimento, status, pecas, base } = req.body;

    if (!placa) {
      return res.status(400).json({ success: false, message: 'Placa é obrigatória' });
    }

    // Calcular valor total das peças
    const valorTotal = pecas && pecas.length > 0 
      ? pecas.reduce((sum: number, p: {nome: string, valor: number}) => sum + (p.valor || 0), 0)
      : 0;

    // Montar descrição com peças
    let descricaoCompleta = relato || '';
    if (pecas && pecas.length > 0) {
      const pecasText = pecas
        .filter((p: {nome: string, valor: number}) => p.nome?.trim())
        .map((p: {nome: string, valor: number}) => `${p.nome} (R$ ${(p.valor || 0).toFixed(2)})`)
        .join(', ');
      if (pecasText) {
        descricaoCompleta = descricaoCompleta 
          ? `${descricaoCompleta} | Peças: ${pecasText}`
          : `Peças: ${pecasText}`;
      }
    }

    const result = await pool.query(
      `INSERT INTO indicadores_dados 
        (upload_id, placa, modelo, km, relato, data_agenda, focal, oficina_debito, atendimento, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [upload_id, placa, modelo, km || null, descricaoCompleta, data_agenda || null, focal, oficina_debito, atendimento, status || 'Em Manutenção']
    );

    // Também registrar no histórico de manutenções com valor e base
    const baseValue = base || 'LH01';
    await pool.query(
      `INSERT INTO manutencoes_historico 
        (placa, tipo, descricao, valor, status, km, data_entrada, oficina, base, data_manutencao)
       VALUES ($1, 'Corretiva', $2, $3, $4, $5, CURRENT_DATE, $6, $7, CURRENT_DATE)
       ON CONFLICT DO NOTHING`,
      [placa, descricaoCompleta || 'Manutenção registrada', valorTotal, status || 'Em Manutenção', km || 0, oficina_debito, baseValue]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[INDICADORES] Erro ao criar manutenção:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar nova manutenção' });
  }
});

// Atualizar dados em manutenção
router.put('/dados/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { placa, modelo, km, relato, data_agenda, focal, oficina_debito, atendimento, status } = req.body;

    const result = await pool.query(
      `UPDATE indicadores_dados SET 
        placa = COALESCE($1, placa),
        modelo = COALESCE($2, modelo),
        km = COALESCE($3, km),
        relato = COALESCE($4, relato),
        data_agenda = COALESCE($5, data_agenda),
        focal = COALESCE($6, focal),
        oficina_debito = COALESCE($7, oficina_debito),
        atendimento = COALESCE($8, atendimento),
        status = COALESCE($9, status),
        updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [placa, modelo, km, relato, data_agenda, focal, oficina_debito, atendimento, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Registro não encontrado' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[INDICADORES] Erro ao atualizar dados:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar registro' });
  }
});

// Buscar histórico liberado
router.get('/liberado', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { uploadId, tipoManutencao, placa } = req.query;

    let query = `SELECT * FROM indicadores_liberado WHERE upload_id = $1`;
    const params: any[] = [uploadId || 0];

    if (tipoManutencao) {
      query += ` AND tipo_manutencao ILIKE $${params.length + 1}`;
      params.push(`%${tipoManutencao}%`);
    }

    if (placa) {
      query += ` AND placa ILIKE $${params.length + 1}`;
      params.push(`%${placa}%`);
    }

    query += ` ORDER BY data_agenda DESC NULLS LAST`;

    const result = await pool.query(query, params);

    res.json({ success: true, liberado: result.rows });
  } catch (error) {
    console.error('[INDICADORES] Erro ao buscar liberado:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar histórico' });
  }
});

// Estatísticas gerais
router.get('/stats', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { uploadId } = req.query;

    const statsQuery = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM indicadores_dados WHERE upload_id = $1) as total_em_manutencao,
        (SELECT COUNT(*) FROM indicadores_liberado WHERE upload_id = $1) as total_liberado,
        (SELECT COUNT(DISTINCT placa) FROM indicadores_dados WHERE upload_id = $1) as veiculos_unicos_manutencao,
        (SELECT COUNT(DISTINCT placa) FROM indicadores_liberado WHERE upload_id = $1) as veiculos_unicos_liberado,
        (SELECT COUNT(*) FROM indicadores_liberado WHERE upload_id = $1 AND tipo_manutencao ILIKE '%preventiva%') as preventivas,
        (SELECT COUNT(*) FROM indicadores_liberado WHERE upload_id = $1 AND tipo_manutencao ILIKE '%corretiva%') as corretivas
      `,
      [uploadId]
    );

    res.json({ success: true, stats: statsQuery.rows[0] });
  } catch (error) {
    console.error('[INDICADORES] Erro ao buscar estatísticas:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar estatísticas' });
  }
});

// Buscar histórico completo de um veículo por placa (INDEPENDENTE do upload)
router.get('/veiculo/:placa', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { placa } = req.params;

    // Buscar dados consolidados da view
    const consolidado = await pool.query(
      `SELECT * FROM vw_veiculos_indicadores WHERE UPPER(TRIM(placa)) = UPPER(TRIM($1))`,
      [placa]
    );

    // Buscar histórico completo de manutenções (todos os uploads)
    const manutencoes = await pool.query(
      `SELECT il.*, u.upload_date, u.user_id
       FROM indicadores_liberado il
       LEFT JOIN indicadores_uploads u ON il.upload_id = u.id
       WHERE UPPER(TRIM(il.placa)) = UPPER(TRIM($1))
       ORDER BY il.data_agenda DESC NULLS LAST`,
      [placa]
    );

    // Buscar dados em manutenção atual
    const emManutencao = await pool.query(
      `SELECT id.*, u.upload_date
       FROM indicadores_dados id
       LEFT JOIN indicadores_uploads u ON id.upload_id = u.id
       WHERE UPPER(TRIM(id.placa)) = UPPER(TRIM($1))
       ORDER BY id.data_agenda DESC NULLS LAST`,
      [placa]
    );

    res.json({
      success: true,
      veiculo: consolidado.rows[0] || null,
      manutencoes: manutencoes.rows,
      emManutencao: emManutencao.rows,
      totalManutencoes: manutencoes.rows.length,
      totalEmManutencao: emManutencao.rows.length
    });
  } catch (error) {
    console.error('[INDICADORES] Erro ao buscar dados do veículo:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar dados do veículo' });
  }
});

// =====================================================
// ROTAS PARA MANUTENCOES_HISTORICO (NOVO FORMATO)
// =====================================================

// Upload de planilha de manutenções histórico
router.post('/manutencoes/upload', isAuthenticated, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = xlsx.utils.sheet_to_json(worksheet);

    console.log('[MANUTENCOES] Processando arquivo:', req.file.originalname);
    console.log('[MANUTENCOES] Colunas encontradas:', data.length > 0 ? Object.keys(data[0]) : 'vazio');

    let importados = 0;
    let erros = 0;
    const placasAtualizadas: string[] = [];
    const errosDetalhados: string[] = [];

    for (const row of data) {
      try {
        const placa = row['Placa'] || row['placa'] || row['PLACA'];
        if (!placa) {
          erros++;
          continue;
        }

        const dataManutencao = convertExcelDate(row['Data da Manutenção'] || row['data_manutencao'] || row['Data Manutenção'] || row['Data']);
        const tipo = row['Tipo de Manutenção'] || row['tipo'] || row['Tipo'] || row['TIPO'];
        const descricao = row['Descrição'] || row['descricao'] || row['Descrição do Serviço'] || row['DESCRIÇÃO'];
        const valorRaw = row['Valor'] || row['valor'] || row['VALOR'] || row['Custo'] || 0;
        const valor = parseNumber(valorRaw);
        const status = row['Status'] || row['status'] || row['STATUS'];
        const oficina = row['Oficina'] || row['oficina'] || row['OFICINA'];
        const km = parseNumber(row['KM'] || row['km'] || row['Km'] || row['Quilometragem']);
        const dataEntrada = convertExcelDate(row['Data de Entrada'] || row['data_entrada'] || row['Data Entrada']);
        const dataSaida = convertExcelDate(row['Data de Saída'] || row['data_saida'] || row['Data Saída']);
        const tempoTotal = parseNumber(row['Tempo de Manutenção'] || row['tempo_total'] || row['Tempo Total'] || row['Dias']);
        const base = row['Base'] || row['base'] || row['BASE'];

        await pool.query(
          `INSERT INTO manutencoes_historico 
            (placa, tipo, descricao, valor, status, km, data_entrada, data_saida, tempo_total, oficina, base, data_manutencao, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
           ON CONFLICT (placa, data_manutencao, tipo) 
           DO UPDATE SET 
             descricao = EXCLUDED.descricao,
             valor = EXCLUDED.valor,
             status = EXCLUDED.status,
             km = EXCLUDED.km,
             data_entrada = EXCLUDED.data_entrada,
             data_saida = EXCLUDED.data_saida,
             tempo_total = EXCLUDED.tempo_total,
             oficina = EXCLUDED.oficina,
             base = EXCLUDED.base,
             updated_at = NOW()`,
          [placa, tipo, descricao, valor, status, km, dataEntrada, dataSaida, tempoTotal, oficina, base, dataManutencao]
        );

        if (!placasAtualizadas.includes(placa)) {
          placasAtualizadas.push(placa);
        }
        importados++;
      } catch (rowError: any) {
        erros++;
        errosDetalhados.push(`Linha ${importados + erros}: ${rowError.message}`);
        console.error('[MANUTENCOES] Erro na linha:', rowError);
      }
    }

    console.log('[MANUTENCOES] Upload concluído:', importados, 'importados,', erros, 'erros');

    res.json({
      success: true,
      message: `Importação concluída! ${importados} registros processados.`,
      importados,
      erros,
      placasAtualizadas: placasAtualizadas.length,
      errosDetalhados: errosDetalhados.slice(0, 10)
    });

  } catch (error: any) {
    console.error('[MANUTENCOES] Erro no upload:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar arquivo',
      error: error.message
    });
  }
});

// Listar todas as manutenções do histórico com filtros
router.get('/manutencoes', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { placa, base, oficina, dataInicio, dataFim, tipo, status } = req.query;

    let query = `SELECT * FROM manutencoes_historico WHERE 1=1`;
    const params: any[] = [];

    if (placa) {
      params.push(`%${placa}%`);
      query += ` AND placa ILIKE $${params.length}`;
    }
    if (base) {
      params.push(`%${base}%`);
      query += ` AND base ILIKE $${params.length}`;
    }
    if (oficina) {
      params.push(`%${oficina}%`);
      query += ` AND oficina ILIKE $${params.length}`;
    }
    if (tipo) {
      params.push(`%${tipo}%`);
      query += ` AND tipo ILIKE $${params.length}`;
    }
    if (status) {
      params.push(`%${status}%`);
      query += ` AND status ILIKE $${params.length}`;
    }
    if (dataInicio) {
      params.push(dataInicio);
      query += ` AND data_manutencao >= $${params.length}`;
    }
    if (dataFim) {
      params.push(dataFim);
      query += ` AND data_manutencao <= $${params.length}`;
    }

    query += ` ORDER BY data_manutencao DESC NULLS LAST LIMIT 500`;

    const result = await pool.query(query, params);
    res.json({ success: true, manutencoes: result.rows });
  } catch (error) {
    console.error('[MANUTENCOES] Erro ao listar:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar manutenções' });
  }
});

// Histórico de manutenções por placa
router.get('/manutencoes/placa/:placa', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { placa } = req.params;

    // Histórico completo
    const historico = await pool.query(
      `SELECT * FROM manutencoes_historico 
       WHERE UPPER(TRIM(placa)) = UPPER(TRIM($1))
       ORDER BY data_manutencao DESC NULLS LAST`,
      [placa]
    );

    // Estatísticas do veículo
    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_manutencoes,
        SUM(COALESCE(valor, 0)) as custo_total,
        AVG(COALESCE(tempo_total, 0)) as tempo_medio,
        SUM(COALESCE(tempo_total, 0)) as dias_parados,
        MAX(km) as maior_km,
        MIN(data_manutencao) as primeira_manutencao,
        MAX(data_manutencao) as ultima_manutencao
       FROM manutencoes_historico 
       WHERE UPPER(TRIM(placa)) = UPPER(TRIM($1))`,
      [placa]
    );

    // Custos por mês
    const custosPorMes = await pool.query(
      `SELECT 
        TO_CHAR(data_manutencao, 'YYYY-MM') as mes,
        SUM(COALESCE(valor, 0)) as valor_total,
        COUNT(*) as quantidade
       FROM manutencoes_historico 
       WHERE UPPER(TRIM(placa)) = UPPER(TRIM($1))
       GROUP BY TO_CHAR(data_manutencao, 'YYYY-MM')
       ORDER BY mes DESC
       LIMIT 12`,
      [placa]
    );

    // Manutenções por tipo
    const porTipo = await pool.query(
      `SELECT 
        COALESCE(tipo, 'Não especificado') as tipo,
        COUNT(*) as quantidade,
        SUM(COALESCE(valor, 0)) as valor_total
       FROM manutencoes_historico 
       WHERE UPPER(TRIM(placa)) = UPPER(TRIM($1))
       GROUP BY tipo
       ORDER BY quantidade DESC`,
      [placa]
    );

    res.json({
      success: true,
      placa: placa.toUpperCase().trim(),
      historico: historico.rows,
      stats: statsResult.rows[0],
      custosPorMes: custosPorMes.rows,
      porTipo: porTipo.rows
    });
  } catch (error) {
    console.error('[MANUTENCOES] Erro ao buscar placa:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar histórico do veículo' });
  }
});

// Dashboard - Estatísticas gerais de manutenções
router.get('/manutencoes/dashboard', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { dataInicio, dataFim, base } = req.query;

    let whereClause = '1=1';
    const params: any[] = [];

    if (dataInicio) {
      params.push(dataInicio);
      whereClause += ` AND data_manutencao >= $${params.length}`;
    }
    if (dataFim) {
      params.push(dataFim);
      whereClause += ` AND data_manutencao <= $${params.length}`;
    }
    if (base) {
      params.push(`%${base}%`);
      whereClause += ` AND base ILIKE $${params.length}`;
    }

    // Totais gerais
    const totais = await pool.query(
      `SELECT 
        COUNT(*) as total_manutencoes,
        COUNT(DISTINCT placa) as veiculos_atendidos,
        SUM(COALESCE(valor, 0)) as custo_total,
        AVG(COALESCE(valor, 0)) as custo_medio,
        AVG(COALESCE(tempo_total, 0)) as tempo_medio,
        SUM(COALESCE(tempo_total, 0)) as dias_parados_total
       FROM manutencoes_historico 
       WHERE ${whereClause}`,
      params
    );

    // Por tipo de manutenção
    const porTipo = await pool.query(
      `SELECT 
        COALESCE(tipo, 'Não especificado') as tipo,
        COUNT(*) as quantidade,
        SUM(COALESCE(valor, 0)) as valor_total,
        AVG(COALESCE(tempo_total, 0)) as tempo_medio
       FROM manutencoes_historico 
       WHERE ${whereClause}
       GROUP BY tipo
       ORDER BY quantidade DESC`,
      params
    );

    // Por oficina
    const porOficina = await pool.query(
      `SELECT 
        COALESCE(oficina, 'Não especificada') as oficina,
        COUNT(*) as quantidade,
        SUM(COALESCE(valor, 0)) as valor_total,
        AVG(COALESCE(tempo_total, 0)) as tempo_medio
       FROM manutencoes_historico 
       WHERE ${whereClause}
       GROUP BY oficina
       ORDER BY quantidade DESC
       LIMIT 15`,
      params
    );

    // Por base
    const porBase = await pool.query(
      `SELECT 
        COALESCE(base, 'Não especificada') as base,
        COUNT(*) as quantidade,
        SUM(COALESCE(valor, 0)) as valor_total
       FROM manutencoes_historico 
       WHERE ${whereClause}
       GROUP BY base
       ORDER BY quantidade DESC`,
      params
    );

    // Ranking de placas mais caras (ordena por dias_parados se custo for zero)
    const rankingPlacas = await pool.query(
      `SELECT 
        placa,
        COUNT(*) as quantidade,
        SUM(COALESCE(valor, 0)) as custo_total,
        SUM(COALESCE(tempo_total, 0)) as dias_parados
       FROM manutencoes_historico 
       WHERE ${whereClause}
       GROUP BY placa
       ORDER BY 
         CASE WHEN SUM(COALESCE(valor, 0)) > 0 THEN SUM(COALESCE(valor, 0)) ELSE 0 END DESC,
         SUM(COALESCE(tempo_total, 0)) DESC
       LIMIT 20`,
      params
    );

    // Evolução mensal
    const evolucaoMensal = await pool.query(
      `SELECT 
        TO_CHAR(data_manutencao, 'YYYY-MM') as mes,
        COUNT(*) as quantidade,
        SUM(COALESCE(valor, 0)) as valor_total,
        COUNT(DISTINCT placa) as veiculos
       FROM manutencoes_historico 
       WHERE ${whereClause} AND data_manutencao IS NOT NULL
       GROUP BY TO_CHAR(data_manutencao, 'YYYY-MM')
       ORDER BY mes DESC
       LIMIT 12`,
      params
    );

    // Status das manutenções
    const porStatus = await pool.query(
      `SELECT 
        COALESCE(status, 'Não especificado') as status,
        COUNT(*) as quantidade
       FROM manutencoes_historico 
       WHERE ${whereClause}
       GROUP BY status
       ORDER BY quantidade DESC`,
      params
    );

    // Converter valores para números
    const formatNumericData = (rows: any[]) => rows.map(row => ({
      ...row,
      quantidade: parseInt(row.quantidade) || 0,
      valor_total: parseFloat(row.valor_total) || 0,
      tempo_medio: parseFloat(row.tempo_medio) || 0,
      custo_total: parseFloat(row.custo_total) || 0,
      dias_parados: parseInt(row.dias_parados) || 0,
      veiculos: parseInt(row.veiculos) || 0
    }));

    res.json({
      success: true,
      totais: {
        total_manutencoes: parseInt(totais.rows[0]?.total_manutencoes) || 0,
        veiculos_atendidos: parseInt(totais.rows[0]?.veiculos_atendidos) || 0,
        custo_total: parseFloat(totais.rows[0]?.custo_total) || 0,
        custo_medio: parseFloat(totais.rows[0]?.custo_medio) || 0,
        tempo_medio: parseFloat(totais.rows[0]?.tempo_medio) || 0,
        dias_parados_total: parseInt(totais.rows[0]?.dias_parados_total) || 0
      },
      porTipo: formatNumericData(porTipo.rows),
      porOficina: formatNumericData(porOficina.rows),
      porBase: formatNumericData(porBase.rows),
      rankingPlacas: formatNumericData(rankingPlacas.rows),
      evolucaoMensal: formatNumericData(evolucaoMensal.rows.reverse()),
      porStatus: formatNumericData(porStatus.rows)
    });
  } catch (error) {
    console.error('[MANUTENCOES] Erro no dashboard:', error);
    res.status(500).json({ success: false, message: 'Erro ao gerar dashboard' });
  }
});

// Listar oficinas únicas
router.get('/manutencoes/oficinas', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT oficina FROM manutencoes_historico WHERE oficina IS NOT NULL ORDER BY oficina`
    );
    res.json({ success: true, oficinas: result.rows.map(r => r.oficina) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar oficinas' });
  }
});

// Listar bases únicas
router.get('/manutencoes/bases', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT base FROM manutencoes_historico WHERE base IS NOT NULL ORDER BY base`
    );
    res.json({ success: true, bases: result.rows.map(r => r.base) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar bases' });
  }
});

// Análise de peças/serviços mais usados por tipo e modelo
router.get('/pecas/analise', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Peças/serviços mais usados geral
    const topGeral = await pool.query(`
      SELECT 
        UPPER(TRIM(descricao)) as peca,
        COUNT(*) as quantidade,
        SUM(valor) as custo_total
      FROM manutencoes_historico 
      WHERE descricao IS NOT NULL AND TRIM(descricao) != ''
      GROUP BY UPPER(TRIM(descricao))
      ORDER BY quantidade DESC
      LIMIT 15
    `);

    // Por tipo de manutenção (Preventiva/Corretiva)
    const porTipo = await pool.query(`
      SELECT 
        TRIM(tipo) as tipo,
        UPPER(TRIM(descricao)) as peca,
        COUNT(*) as quantidade,
        SUM(valor) as custo_total
      FROM manutencoes_historico 
      WHERE descricao IS NOT NULL AND TRIM(descricao) != '' AND tipo IS NOT NULL
      GROUP BY TRIM(tipo), UPPER(TRIM(descricao))
      ORDER BY tipo, quantidade DESC
    `);

    // Por modelo de veículo
    const porModelo = await pool.query(`
      SELECT 
        v.model as modelo,
        UPPER(TRIM(mh.descricao)) as peca,
        COUNT(*) as quantidade,
        SUM(mh.valor) as custo_total
      FROM manutencoes_historico mh
      JOIN vehicles v ON UPPER(TRIM(mh.placa)) = UPPER(TRIM(v.plate))
      WHERE mh.descricao IS NOT NULL AND TRIM(mh.descricao) != ''
      GROUP BY v.model, UPPER(TRIM(mh.descricao))
      ORDER BY modelo, quantidade DESC
    `);

    // Modelos únicos para filtro
    const modelos = await pool.query(`
      SELECT DISTINCT v.model 
      FROM vehicles v
      JOIN manutencoes_historico mh ON UPPER(TRIM(mh.placa)) = UPPER(TRIM(v.plate))
      WHERE v.model IS NOT NULL
      ORDER BY v.model
    `);

    // Agrupar por tipo
    const preventivas: any[] = [];
    const corretivas: any[] = [];
    porTipo.rows.forEach((row: any) => {
      const tipo = row.tipo?.trim().toUpperCase();
      if (tipo === 'PREVENTIVA') {
        preventivas.push(row);
      } else if (tipo === 'CORRETIVA') {
        corretivas.push(row);
      }
    });

    // Agrupar por modelo
    const porModeloAgrupado: Record<string, any[]> = {};
    porModelo.rows.forEach((row: any) => {
      const modelo = row.modelo || 'Sem modelo';
      if (!porModeloAgrupado[modelo]) {
        porModeloAgrupado[modelo] = [];
      }
      porModeloAgrupado[modelo].push({
        peca: row.peca,
        quantidade: parseInt(row.quantidade),
        custo_total: parseFloat(row.custo_total) || 0
      });
    });

    res.json({
      success: true,
      topGeral: topGeral.rows.map(r => ({
        peca: r.peca,
        quantidade: parseInt(r.quantidade),
        custo_total: parseFloat(r.custo_total) || 0
      })),
      preventivas: preventivas.slice(0, 10).map(r => ({
        peca: r.peca,
        quantidade: parseInt(r.quantidade),
        custo_total: parseFloat(r.custo_total) || 0
      })),
      corretivas: corretivas.slice(0, 10).map(r => ({
        peca: r.peca,
        quantidade: parseInt(r.quantidade),
        custo_total: parseFloat(r.custo_total) || 0
      })),
      porModelo: porModeloAgrupado,
      modelos: modelos.rows.map(r => r.model)
    });
  } catch (error) {
    console.error('[PECAS] Erro na análise:', error);
    res.status(500).json({ success: false, message: 'Erro ao analisar peças' });
  }
});

// Buscar dados de BIP (rastreamento de veículos)
router.get('/bip', isAuthenticated, async (req: Request, res: Response) => {
  try {
    console.log('[BIP] Buscando dados de rastreamento de veículos...');
    
    // Buscar todos os registros de BIP
    const bipResult = await pool.query(`
      SELECT 
        id, placa, ml_bip, dds_bip, base_reserva,
        ultimo_bip, motivo, observacao, dias_sem_bip, created_at
      FROM indicadores_bip
      ORDER BY dias_sem_bip DESC NULLS LAST
    `);
    
    // Calcular estatísticas
    const data = bipResult.rows;
    const total = data.length;
    const parados = data.filter(d => (d.dias_sem_bip || 0) > 7).length;
    const emOperacao = data.filter(d => (d.dias_sem_bip || 0) <= 7).length;
    
    const somasDias = data.reduce((acc, d) => acc + (d.dias_sem_bip || 0), 0);
    const mediasDiasSemBip = total > 0 ? somasDias / total : 0;
    
    console.log('[BIP] Dados encontrados:', { total, parados, emOperacao, mediasDiasSemBip: mediasDiasSemBip.toFixed(1) });
    
    res.json({
      success: true,
      data: data,
      stats: {
        total,
        parados,
        emOperacao,
        mediasDiasSemBip
      }
    });
  } catch (error) {
    console.error('[BIP] Erro ao buscar dados:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar dados de BIP' });
  }
});

export default router;
