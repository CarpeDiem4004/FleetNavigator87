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

    // Criar registro de histórico de oficina se a oficina foi informada
    if (oficina_debito && result.rows[0]?.id) {
      await pool.query(
        `INSERT INTO manutencao_oficinas (manutencao_id, oficina_nome, km_envio, data_envio, status)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'ativa')
         ON CONFLICT DO NOTHING`,
        [result.rows[0].id, oficina_debito, km || null]
      );
    }

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

// Histórico de manutenções por placa (usando manutencoes_finalizadas para custos corretos)
router.get('/manutencoes/placa/:placa', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { placa } = req.params;

    // Histórico completo da tabela manutencoes_finalizadas (tem custos reais)
    const historico = await pool.query(
      `SELECT 
        id,
        placa,
        modelo,
        km,
        relato as descricao,
        data_agenda as data_manutencao,
        oficina,
        tipo_manutencao as tipo,
        status,
        status2,
        dias_manutencao as tempo_total,
        COALESCE(valor_orcamento, valor_negociado, 0) as valor
       FROM manutencoes_finalizadas 
       WHERE UPPER(TRIM(placa)) = UPPER(TRIM($1))
       ORDER BY data_agenda DESC NULLS LAST`,
      [placa]
    );

    // Estatísticas do veículo usando manutencoes_finalizadas
    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_manutencoes,
        SUM(COALESCE(valor_orcamento, valor_negociado, 0)) as custo_total,
        AVG(COALESCE(dias_manutencao, 0)) as tempo_medio,
        SUM(COALESCE(dias_manutencao, 0)) as dias_parados,
        MAX(km) as maior_km,
        MIN(data_agenda) as primeira_manutencao,
        MAX(data_agenda) as ultima_manutencao
       FROM manutencoes_finalizadas 
       WHERE UPPER(TRIM(placa)) = UPPER(TRIM($1))`,
      [placa]
    );

    // Custos por mês usando manutencoes_finalizadas
    const custosPorMes = await pool.query(
      `SELECT 
        TO_CHAR(data_agenda, 'YYYY-MM') as mes,
        SUM(COALESCE(valor_orcamento, valor_negociado, 0)) as valor_total,
        COUNT(*) as quantidade
       FROM manutencoes_finalizadas 
       WHERE UPPER(TRIM(placa)) = UPPER(TRIM($1))
       GROUP BY TO_CHAR(data_agenda, 'YYYY-MM')
       ORDER BY mes DESC
       LIMIT 12`,
      [placa]
    );

    // Manutenções por tipo usando manutencoes_finalizadas
    const porTipo = await pool.query(
      `SELECT 
        COALESCE(tipo_manutencao, 'Não especificado') as tipo,
        COUNT(*) as quantidade,
        SUM(COALESCE(valor_orcamento, valor_negociado, 0)) as valor_total
       FROM manutencoes_finalizadas 
       WHERE UPPER(TRIM(placa)) = UPPER(TRIM($1))
       GROUP BY tipo_manutencao
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
    let whereClauseFinalizadas = '1=1';
    const params: any[] = [];
    const paramsFinalizadas: any[] = [];

    if (dataInicio) {
      params.push(dataInicio);
      whereClause += ` AND data_manutencao >= $${params.length}`;
      paramsFinalizadas.push(dataInicio);
      whereClauseFinalizadas += ` AND data_agenda >= $${paramsFinalizadas.length}`;
    }
    if (dataFim) {
      params.push(dataFim);
      whereClause += ` AND data_manutencao <= $${params.length}`;
      paramsFinalizadas.push(dataFim);
      whereClauseFinalizadas += ` AND data_agenda <= $${paramsFinalizadas.length}`;
    }
    if (base) {
      params.push(`%${base}%`);
      whereClause += ` AND base ILIKE $${params.length}`;
      paramsFinalizadas.push(`%${base}%`);
      whereClauseFinalizadas += ` AND operacao ILIKE $${paramsFinalizadas.length}`;
    }

    // Totais gerais de manutencoes_historico
    const totaisHistorico = await pool.query(
      `SELECT 
        COUNT(*) as total_manutencoes,
        COUNT(DISTINCT placa) as veiculos_atendidos,
        AVG(COALESCE(tempo_total, 0)) as tempo_medio,
        SUM(COALESCE(tempo_total, 0)) as dias_parados_total
       FROM manutencoes_historico 
       WHERE ${whereClause}`,
      params
    );

    // Totais de custos de manutencoes_finalizadas (que tem os valores corretos)
    const totaisCustos = await pool.query(
      `SELECT 
        SUM(COALESCE(valor_orcamento, valor_negociado, 0)) as custo_total,
        AVG(COALESCE(valor_orcamento, valor_negociado, 0)) as custo_medio
       FROM manutencoes_finalizadas 
       WHERE ${whereClauseFinalizadas}`,
      paramsFinalizadas
    );

    const totais = {
      rows: [{
        total_manutencoes: totaisHistorico.rows[0]?.total_manutencoes || 0,
        veiculos_atendidos: totaisHistorico.rows[0]?.veiculos_atendidos || 0,
        custo_total: totaisCustos.rows[0]?.custo_total || 0,
        custo_medio: totaisCustos.rows[0]?.custo_medio || 0,
        tempo_medio: totaisHistorico.rows[0]?.tempo_medio || 0,
        dias_parados_total: totaisHistorico.rows[0]?.dias_parados_total || 0
      }]
    };

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

    // Ranking de placas mais caras (usando custos de manutencoes_finalizadas)
    const rankingPlacas = await pool.query(
      `SELECT 
        mf.placa,
        COUNT(*) as quantidade,
        SUM(COALESCE(mf.valor_orcamento, mf.valor_negociado, 0)) as custo_total,
        SUM(COALESCE(mf.dias_manutencao, 0)) as dias_parados
       FROM manutencoes_finalizadas mf
       WHERE ${whereClauseFinalizadas.replace(/data_agenda/g, 'mf.data_agenda').replace(/operacao/g, 'mf.operacao')}
       GROUP BY mf.placa
       ORDER BY 
         SUM(COALESCE(mf.valor_orcamento, mf.valor_negociado, 0)) DESC
       LIMIT 20`,
      paramsFinalizadas
    );

    // Evolução mensal (usando custos de manutencoes_finalizadas)
    const evolucaoMensal = await pool.query(
      `SELECT 
        TO_CHAR(data_agenda, 'YYYY-MM') as mes,
        COUNT(*) as quantidade,
        SUM(COALESCE(valor_orcamento, valor_negociado, 0)) as valor_total,
        COUNT(DISTINCT placa) as veiculos
       FROM manutencoes_finalizadas 
       WHERE ${whereClauseFinalizadas} AND data_agenda IS NOT NULL
       GROUP BY TO_CHAR(data_agenda, 'YYYY-MM')
       ORDER BY mes DESC
       LIMIT 12`,
      paramsFinalizadas
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
    
    // Calcular total de dias parados (soma de todos os dias_sem_bip)
    const totalDiasParados = data.reduce((acc, d) => acc + (d.dias_sem_bip || 0), 0);
    const mediasDiasSemBip = total > 0 ? totalDiasParados / total : 0;
    
    // Calcular variação em relação ao dia anterior (simulação baseada nos dados)
    // A variação seria: se ontem cada veículo tinha 1 dia a menos, então a diferença é o número de veículos parados
    const variacaoDiasParados = parados; // Cada veículo parado adiciona 1 dia por dia
    
    console.log('[BIP] Dados encontrados:', { 
      total, 
      parados, 
      emOperacao, 
      totalDiasParados,
      mediasDiasSemBip: mediasDiasSemBip.toFixed(1),
      variacaoDiasParados
    });
    
    res.json({
      success: true,
      data: data,
      stats: {
        total,
        parados,
        emOperacao,
        mediasDiasSemBip,
        totalDiasParados,
        variacaoDiasParados
      }
    });
  } catch (error) {
    console.error('[BIP] Erro ao buscar dados:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar dados de BIP' });
  }
});

// Buscar veículos para aba Cadastro
router.get('/vehicles', isAuthenticated, async (req: Request, res: Response) => {
  try {
    console.log('[VEHICLES] Buscando veículos...');
    
    const result = await pool.query(`
      SELECT id, plate, model, ownership, status, base_id
      FROM vehicles
      ORDER BY plate
    `);
    
    console.log('[VEHICLES] Veículos encontrados:', result.rows.length);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('[VEHICLES] Erro ao buscar veículos:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar veículos' });
  }
});

// Atualizar veículo (ownership)
router.put('/vehicles/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ownership } = req.body;
    
    console.log('[VEHICLES] Atualizando veículo ID:', id, 'ownership:', ownership);
    
    const result = await pool.query(`
      UPDATE vehicles
      SET ownership = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [ownership, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Veículo não encontrado' });
    }
    
    console.log('[VEHICLES] Veículo atualizado com sucesso');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[VEHICLES] Erro ao atualizar veículo:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar veículo' });
  }
});

// Criar novo veículo
router.post('/vehicles', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { 
      plate, model, ownership, chassi, renavam, cidade, estado, cor, 
      operacao, locadora, status, base, categoria, ano_fabricacao, 
      ano_modelo, km, rastreador, data_inicio_operacao 
    } = req.body;
    
    if (!plate) {
      return res.status(400).json({ success: false, message: 'Placa é obrigatória' });
    }
    
    console.log('[VEHICLES] Criando veículo:', plate, model, ownership);
    
    // Verificar se já existe
    const existing = await pool.query('SELECT id FROM vehicles WHERE UPPER(plate) = UPPER($1)', [plate]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Veículo já cadastrado' });
    }
    
    const result = await pool.query(`
      INSERT INTO vehicles (
        plate, model, ownership, chassi, renavam, cidade_veiculo, estado, cor,
        operacao, locadora, status, base, categoria, ano_fabricacao, 
        ano_modelo, km, rastreador, data_inicio_operacao, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
      RETURNING *
    `, [
      plate.toUpperCase(), 
      model || null, 
      ownership || 'Murici',
      chassi || null,
      renavam || null,
      cidade || null,
      estado || null,
      cor || null,
      operacao || null,
      locadora || null,
      status || 'em_operacao',
      base || null,
      categoria || null,
      ano_fabricacao || null,
      ano_modelo || null,
      km || null,
      rastreador || null,
      data_inicio_operacao || null
    ]);
    
    console.log('[VEHICLES] Veículo criado com sucesso');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[VEHICLES] Erro ao criar veículo:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar veículo' });
  }
});

// Atualizar dados de BIP de um veículo
router.put('/bip/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ultimo_bip, ml_bip, dds_bip, motivo, observacao, base_reserva } = req.body;
    
    console.log('[BIP] Atualizando registro ID:', id, req.body);
    
    // Calcular dias sem BIP baseado na data do ultimo_bip
    let dias_sem_bip = 0;
    if (ultimo_bip) {
      const ultimoBipDate = new Date(ultimo_bip);
      const hoje = new Date();
      const diffTime = Math.abs(hoje.getTime() - ultimoBipDate.getTime());
      dias_sem_bip = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    const result = await pool.query(`
      UPDATE indicadores_bip
      SET 
        ultimo_bip = $1,
        ml_bip = $2,
        dds_bip = $3,
        motivo = $4,
        observacao = $5,
        base_reserva = $6,
        dias_sem_bip = $7
      WHERE id = $8
      RETURNING *
    `, [
      ultimo_bip || null,
      ml_bip || null,
      dds_bip || null,
      motivo || null,
      observacao || null,
      base_reserva || null,
      dias_sem_bip,
      id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Registro não encontrado' });
    }
    
    console.log('[BIP] Registro atualizado com sucesso:', result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[BIP] Erro ao atualizar registro:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar registro de BIP' });
  }
});

// ==================== MANUTENÇÕES FINALIZADAS ====================

// Listar manutenções finalizadas com filtros
router.get('/finalizadas', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { placa, oficina, tipo_manutencao, status, operacao, mes } = req.query;
    
    let query = 'SELECT * FROM manutencoes_finalizadas WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (placa) {
      query += ` AND UPPER(placa) LIKE UPPER($${paramIndex})`;
      params.push(`%${placa}%`);
      paramIndex++;
    }
    if (oficina) {
      query += ` AND UPPER(oficina) LIKE UPPER($${paramIndex})`;
      params.push(`%${oficina}%`);
      paramIndex++;
    }
    if (tipo_manutencao) {
      query += ` AND tipo_manutencao = $${paramIndex}`;
      params.push(tipo_manutencao);
      paramIndex++;
    }
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    if (operacao) {
      query += ` AND operacao = $${paramIndex}`;
      params.push(operacao);
      paramIndex++;
    }
    if (mes) {
      query += ` AND mes_referencia = $${paramIndex}`;
      params.push(mes);
      paramIndex++;
    }
    
    query += ' ORDER BY data_agenda DESC NULLS LAST, id DESC';
    
    const result = await pool.query(query, params);
    
    res.json({ success: true, data: result.rows, total: result.rows.length });
  } catch (error) {
    console.error('[FINALIZADAS] Erro ao listar:', error);
    res.status(500).json({ success: false, message: 'Erro ao listar manutenções finalizadas' });
  }
});

// Histórico por placa
router.get('/finalizadas/historico/:placa', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { placa } = req.params;
    
    const result = await pool.query(`
      SELECT * FROM manutencoes_finalizadas 
      WHERE UPPER(placa) = UPPER($1)
      ORDER BY data_agenda DESC NULLS LAST, id DESC
    `, [placa]);
    
    // Calcular estatísticas da placa
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_manutencoes,
        SUM(COALESCE(valor_orcamento, 0)) as custo_total,
        SUM(COALESCE(dias_manutencao, 0)) as dias_parados_total,
        AVG(COALESCE(dias_manutencao, 0)) as media_dias
      FROM manutencoes_finalizadas 
      WHERE UPPER(placa) = UPPER($1)
    `, [placa]);
    
    res.json({ 
      success: true, 
      data: result.rows, 
      stats: stats.rows[0],
      total: result.rows.length 
    });
  } catch (error) {
    console.error('[FINALIZADAS] Erro ao buscar histórico:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar histórico da placa' });
  }
});

// Upload de arquivo Excel de manutenções finalizadas
router.post('/finalizadas/upload', isAuthenticated, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    const headers: any[] = data[0] as any[];
    const rows = data.slice(1);
    
    console.log('[FINALIZADAS] Headers encontrados:', headers);
    console.log('[FINALIZADAS] Total de linhas:', rows.length);
    
    let imported = 0;
    let errors = 0;
    
    for (const row of rows) {
      const rowData: any[] = row as any[];
      
      // Pular linhas vazias
      if (!rowData[0]) continue;
      
      try {
        await pool.query(`
          INSERT INTO manutencoes_finalizadas (
            placa, validacao, modelo, km, relato, data_agenda, focal, reparo,
            tipo_manutencao, aprovacao, valor_orcamento, valor_negociado,
            centro_custo, operacao, status, previsao_entrega, data_liberado,
            dias_manutencao, status2, oficina, lider_base, mes_referencia
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        `, [
          rowData[0] || null,                                    // placa
          rowData[1] || null,                                    // validacao
          rowData[2] || null,                                    // modelo
          parseNumber(rowData[3]),                               // km
          rowData[4] || null,                                    // relato
          convertExcelDate(rowData[5]),                          // data_agenda
          rowData[6] || null,                                    // focal
          rowData[7] || null,                                    // reparo
          rowData[8] || null,                                    // tipo_manutencao
          rowData[9] || null,                                    // aprovacao
          parseNumber(rowData[10]),                              // valor_orcamento
          parseNumber(rowData[11]),                              // valor_negociado
          rowData[12] || null,                                   // centro_custo
          rowData[13] || null,                                   // operacao
          rowData[14] || null,                                   // status
          convertExcelDate(rowData[15]),                         // previsao_entrega
          convertExcelDate(rowData[16]),                         // data_liberado
          parseNumber(rowData[17]),                              // dias_manutencao
          rowData[18] || null,                                   // status2
          rowData[19] || null,                                   // oficina
          rowData[20] || null,                                   // lider_base
          rowData[21] || null                                    // mes_referencia
        ]);
        imported++;
      } catch (err) {
        errors++;
        console.error('[FINALIZADAS] Erro na linha:', rowData[0], err);
      }
    }
    
    console.log('[FINALIZADAS] Import concluído:', imported, 'registros,', errors, 'erros');
    
    res.json({ 
      success: true, 
      message: `Importação concluída: ${imported} registros importados, ${errors} erros`,
      imported,
      errors
    });
  } catch (error) {
    console.error('[FINALIZADAS] Erro no upload:', error);
    res.status(500).json({ success: false, message: 'Erro ao processar arquivo' });
  }
});

// Estatísticas gerais das manutenções finalizadas
router.get('/finalizadas/stats', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Totais gerais
    const totais = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT placa) as veiculos_unicos,
        SUM(COALESCE(valor_orcamento, 0)) as custo_total,
        SUM(COALESCE(dias_manutencao, 0)) as dias_parados_total,
        AVG(COALESCE(dias_manutencao, 0)) as media_dias
      FROM manutencoes_finalizadas
    `);
    
    // Por tipo de manutenção
    const porTipo = await pool.query(`
      SELECT 
        tipo_manutencao,
        COUNT(*) as quantidade
      FROM manutencoes_finalizadas
      WHERE tipo_manutencao IS NOT NULL
      GROUP BY tipo_manutencao
      ORDER BY quantidade DESC
    `);
    
    // Por oficina (top 10)
    const porOficina = await pool.query(`
      SELECT 
        oficina,
        COUNT(*) as quantidade
      FROM manutencoes_finalizadas
      WHERE oficina IS NOT NULL
      GROUP BY oficina
      ORDER BY quantidade DESC
      LIMIT 10
    `);
    
    // Por operação
    const porOperacao = await pool.query(`
      SELECT 
        operacao,
        COUNT(*) as quantidade
      FROM manutencoes_finalizadas
      WHERE operacao IS NOT NULL
      GROUP BY operacao
      ORDER BY quantidade DESC
    `);
    
    // Por status2 (prazo)
    const porPrazo = await pool.query(`
      SELECT 
        status2,
        COUNT(*) as quantidade
      FROM manutencoes_finalizadas
      WHERE status2 IS NOT NULL
      GROUP BY status2
      ORDER BY quantidade DESC
    `);
    
    // Meses disponíveis
    const meses = await pool.query(`
      SELECT DISTINCT mes_referencia
      FROM manutencoes_finalizadas
      WHERE mes_referencia IS NOT NULL
      ORDER BY mes_referencia
    `);
    
    res.json({ 
      success: true,
      totais: totais.rows[0],
      porTipo: porTipo.rows,
      porOficina: porOficina.rows,
      porOperacao: porOperacao.rows,
      porPrazo: porPrazo.rows,
      meses: meses.rows.map(r => r.mes_referencia)
    });
  } catch (error) {
    console.error('[FINALIZADAS] Erro nas estatísticas:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar estatísticas' });
  }
});

// Limpar tabela de manutenções finalizadas
router.delete('/finalizadas/clear', isAuthenticated, async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM manutencoes_finalizadas');
    res.json({ success: true, message: 'Tabela limpa com sucesso' });
  } catch (error) {
    console.error('[FINALIZADAS] Erro ao limpar:', error);
    res.status(500).json({ success: false, message: 'Erro ao limpar tabela' });
  }
});

// Buscar movimentações de manutenção (entradas e saídas)
router.get('/movimentacoes', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { periodo = '30' } = req.query;
    const dias = parseInt(periodo as string) || 30;
    
    console.log('[MOVIMENTACOES] Buscando movimentações dos últimos', dias, 'dias');
    
    // Buscar veículos que ENTRARAM em manutenção no período
    const entradas = await pool.query(`
      SELECT 
        id, placa, tipo, descricao, oficina, base, operacao,
        data_entrada, km, status
      FROM manutencoes_historico
      WHERE data_entrada >= CURRENT_DATE - INTERVAL '${dias} days'
        AND data_entrada IS NOT NULL
      ORDER BY data_entrada DESC
    `);
    
    // Buscar veículos que SAÍRAM da manutenção no período
    const saidas = await pool.query(`
      SELECT 
        id, placa, tipo, descricao, oficina, base, operacao,
        data_entrada, data_saida, tempo_total, valor, status
      FROM manutencoes_historico
      WHERE data_saida >= CURRENT_DATE - INTERVAL '${dias} days'
        AND data_saida IS NOT NULL
      ORDER BY data_saida DESC
    `);
    
    // Também buscar das finalizadas para saídas
    const saidasFinalizadas = await pool.query(`
      SELECT 
        id, placa, tipo_manutencao as tipo, descricao, oficina_debito as oficina, 
        base, operacao, data_entrada, data_saida, tempo_total,
        COALESCE(valor_orcamento, valor_negociado, 0) as valor, status
      FROM manutencoes_finalizadas
      WHERE data_saida >= CURRENT_DATE - INTERVAL '${dias} days'
        AND data_saida IS NOT NULL
      ORDER BY data_saida DESC
    `);
    
    // Combinar saídas de ambas as tabelas
    const todasSaidas = [...saidas.rows, ...saidasFinalizadas.rows]
      .sort((a, b) => new Date(b.data_saida).getTime() - new Date(a.data_saida).getTime());
    
    console.log('[MOVIMENTACOES] Entradas:', entradas.rows.length, 'Saídas:', todasSaidas.length);
    
    res.json({
      success: true,
      periodo: dias,
      entradas: {
        total: entradas.rows.length,
        registros: entradas.rows
      },
      saidas: {
        total: todasSaidas.length,
        registros: todasSaidas
      }
    });
  } catch (error) {
    console.error('[MOVIMENTACOES] Erro ao buscar movimentações:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar movimentações' });
  }
});

export default router;
