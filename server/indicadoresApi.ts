import { Router, Request, Response } from 'express';
import { pool } from './db';
import multer from 'multer';
import xlsx from 'xlsx';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase para sincronização
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseClient = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

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

// Buscar dados em manutenção (exclui veículos finalizados - esses vão para aba Finalizadas)
router.get('/dados', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { uploadId } = req.query;

    // Buscar dados com informação de orçamentos pendentes
    // Pendentes = orçamentos NÃO aprovados E NÃO reprovados (status_aprovacao IS NULL ou 'pendente')
    // IMPORTANTE: Exclui veículos com status 'Finalizado' - esses aparecem na aba Finalizadas
    const result = await pool.query(
      `SELECT 
        d.*,
        COALESCE(b.name, '-') as base,
        COALESCE(orc.total_orcamentos, 0) as total_orcamentos,
        COALESCE(orc.orcamentos_pendentes, 0) as orcamentos_pendentes,
        COALESCE(orc.orcamentos_aprovados, 0) as orcamentos_aprovados
       FROM indicadores_dados d
       LEFT JOIN vehicles v ON UPPER(v.plate) = UPPER(d.placa)
       LEFT JOIN bases b ON b.id = v.base_id
       LEFT JOIN LATERAL (
         SELECT 
           COUNT(*) as total_orcamentos,
           COUNT(*) FILTER (WHERE orc.aprovado = false AND (orc.status_aprovacao IS NULL OR orc.status_aprovacao = 'pendente')) as orcamentos_pendentes,
           COUNT(*) FILTER (WHERE orc.aprovado = true) as orcamentos_aprovados
         FROM manutencao_oficinas mo
         JOIN manutencao_orcamentos orc ON orc.manutencao_oficina_id = mo.id
         WHERE mo.manutencao_id = d.id
       ) orc ON true
       WHERE d.upload_id = $1
         AND (d.status IS NULL OR d.status != 'Finalizado')
       ORDER BY d.data_agenda DESC NULLS LAST`,
      [uploadId || 0]
    );

    // Buscar OS direcionadas para Oficina Murici (coca_cola_os_requests)
    // Apenas OS com status em_andamento ou aguardando_peca (não pendentes)
    const osMuriciResult = await pool.query(
      `SELECT 
        os.id,
        os.placa,
        NULL as modelo,
        CASE 
          WHEN os.status_manutencao = 'finalizado' THEN 'Finalizado'
          WHEN os.status_manutencao = 'aguardando_peca' THEN 'Aguardando Peças'
          ELSE 'Em Manutenção'
        END as status,
        NULL as orcamento,
        os.oficina_direcionada as oficina,
        os.oficina_direcionada as oficina_debito,
        os.relato_problema as relato,
        os.data_agendamento::text as data_agenda,
        EXTRACT(DAY FROM NOW() - os.created_at)::integer as dias,
        os.mecanico_responsavel as responsavel,
        os.base_origem as base,
        os.created_at,
        0 as total_orcamentos,
        0 as orcamentos_pendentes,
        0 as orcamentos_aprovados,
        'coca_cola' as origem_os
       FROM coca_cola_os_requests os
       WHERE os.oficina_direcionada ILIKE '%murici%'
         AND os.status_manutencao IN ('em_andamento', 'aguardando_peca')
       ORDER BY os.created_at DESC`
    );

    console.log('[INDICADORES] OS Murici encontradas:', osMuriciResult.rows.length, osMuriciResult.rows.map(r => r.placa));

    // Combinar os resultados, colocando OS da Oficina Murici no início
    const dadosCombinados = [
      ...osMuriciResult.rows.map(row => ({
        ...row,
        is_oficina_murici_os: true
      })),
      ...result.rows
    ];

    console.log('[INDICADORES] Total dados combinados:', dadosCombinados.length, '(indicadores:', result.rows.length, '+ OS Murici:', osMuriciResult.rows.length, ')');

    res.json({ success: true, dados: dadosCombinados });
  } catch (error) {
    console.error('[INDICADORES] Erro ao buscar dados:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar dados em manutenção' });
  }
});

// Sincronizar TODAS as manutenções da Oficina Murici com Indicadores (busca do Supabase)
router.post('/sync-all-oficina-murici', isAuthenticated, async (req: Request, res: Response) => {
  try {
    console.log('[INDICADORES] Sincronizando TODAS as manutenções da Oficina Murici do Supabase');

    if (!supabaseClient) {
      return res.status(500).json({ success: false, message: 'Cliente Supabase não configurado' });
    }

    // Buscar upload_id mais recente
    const uploadResult = await pool.query(
      'SELECT id FROM indicadores_uploads ORDER BY upload_date DESC LIMIT 1'
    );
    const uploadId = uploadResult.rows[0]?.id || 1;

    // Buscar manutenções ativas do Supabase
    const { data: manutencoesSupabase, error: supabaseError } = await supabaseClient
      .from('oficina_murici_manutencoes')
      .select('*')
      .in('status', ['em_andamento', 'aguardando_peca']);

    if (supabaseError) {
      console.error('[INDICADORES] Erro ao buscar do Supabase:', supabaseError);
      throw new Error(`Erro Supabase: ${supabaseError.message}`);
    }

    console.log(`[INDICADORES] Encontradas ${manutencoesSupabase?.length || 0} manutenções ativas no Supabase`);

    let sincronizados = 0;
    let atualizados = 0;

    for (const manutencao of (manutencoesSupabase || [])) {
      // Mapear status
      const indicadorStatus = manutencao.status === 'aguardando_peca' ? 'Aguardando Peças' : 'Em Manutenção';

      // Verificar se já existe nos indicadores
      const existeResult = await pool.query(
        `SELECT id FROM indicadores_dados 
         WHERE placa = $1 AND status IN ('Em Manutenção', 'Aguardando Peças', 'Em Execução')`,
        [manutencao.placa]
      );

      // Buscar modelo do veículo
      const veiculoResult = await pool.query(
        'SELECT modelo FROM veiculos WHERE placa = $1',
        [manutencao.placa]
      );
      const modeloVeiculo = veiculoResult.rows[0]?.modelo || '';

      if (existeResult.rows.length > 0) {
        // Atualizar registro existente
        await pool.query(
          `UPDATE indicadores_dados 
           SET km = COALESCE($1, km),
               relato = COALESCE($2, relato),
               focal = COALESCE($3, focal),
               status = $4,
               modelo = COALESCE($5, modelo),
               updated_at = NOW()
           WHERE id = $6`,
          [
            manutencao.km || null,
            manutencao.descricao_manutencao || '',
            manutencao.mecanico || '',
            indicadorStatus,
            modeloVeiculo,
            existeResult.rows[0].id
          ]
        );
        atualizados++;
      } else {
        // Inserir novo registro
        await pool.query(
          `INSERT INTO indicadores_dados (
            upload_id, placa, modelo, km, relato, data_agenda, 
            oficina_debito, focal, status, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
          )`,
          [
            uploadId, 
            manutencao.placa, 
            modeloVeiculo, 
            manutencao.km || null, 
            manutencao.descricao_manutencao || '', 
            manutencao.created_at ? new Date(manutencao.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            'Oficina Murici', 
            manutencao.mecanico || '',
            indicadorStatus
          ]
        );
        sincronizados++;
      }
    }

    console.log(`[INDICADORES] ${sincronizados} criados, ${atualizados} atualizados da Oficina Murici`);
    res.json({ 
      success: true, 
      message: `${sincronizados} novos registros criados, ${atualizados} atualizados`,
      total: sincronizados + atualizados,
      novos: sincronizados,
      atualizados: atualizados
    });
  } catch (error) {
    console.error('[INDICADORES] Erro ao sincronizar manutenções da Oficina Murici:', error);
    res.status(500).json({ success: false, message: 'Erro ao sincronizar manutenções' });
  }
});

// Sincronizar manutenção da Oficina Murici com Indicadores (criar ou atualizar)
router.post('/sync-oficina-murici', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { placa, modelo, km, relato, oficina, mecanico, status, custo_total } = req.body;

    if (!placa) {
      return res.status(400).json({ success: false, message: 'Placa é obrigatória' });
    }

    console.log('[INDICADORES] Sincronizando manutenção da Oficina Murici:', placa, 'Status:', status);

    // Buscar upload_id mais recente
    const uploadResult = await pool.query(
      'SELECT id FROM indicadores_uploads ORDER BY upload_date DESC LIMIT 1'
    );
    const uploadId = uploadResult.rows[0]?.id || 1;

    // Mapear status da Oficina Murici para status dos Indicadores
    const mapStatus = (oficinaMuriciStatus: string): string => {
      switch (oficinaMuriciStatus) {
        case 'em_andamento': return 'Em Manutenção';
        case 'aguardando_peca': return 'Aguardando Peças';
        case 'finalizado': return 'Finalizado';
        case 'cancelado': return 'Cancelado';
        default: return 'Em Manutenção';
      }
    };
    const indicadorStatus = mapStatus(status || 'em_andamento');

    // Verificar se já existe registro para esta placa em manutenção ativa
    const existeResult = await pool.query(
      `SELECT id, status FROM indicadores_dados 
       WHERE placa = $1 AND status IN ('Em Manutenção', 'Em Execução', 'Orçamento Aprovado', 'Aguardando Peças')
       ORDER BY created_at DESC LIMIT 1`,
      [placa]
    );

    // Buscar informações do veículo
    const veiculoResult = await pool.query(
      'SELECT modelo FROM veiculos WHERE placa = $1',
      [placa]
    );
    const modeloVeiculo = veiculoResult.rows[0]?.modelo || modelo || '';

    if (existeResult.rows.length > 0) {
      // ATUALIZAR registro existente
      const existingId = existeResult.rows[0].id;
      console.log('[INDICADORES] Atualizando registro existente ID:', existingId);
      
      const updateResult = await pool.query(
        `UPDATE indicadores_dados 
         SET km = COALESCE($1, km),
             relato = COALESCE($2, relato),
             focal = COALESCE($3, focal),
             status = $4,
             modelo = COALESCE($5, modelo),
             updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [km || null, relato || '', mecanico || '', indicadorStatus, modeloVeiculo, existingId]
      );

      // Se finalizado ou cancelado, remover da lista ativa
      if (status === 'finalizado' || status === 'cancelado') {
        console.log('[INDICADORES] Manutenção finalizada/cancelada, atualizando status');
      }

      console.log('[INDICADORES] Manutenção atualizada:', updateResult.rows[0]);
      return res.json({ success: true, data: updateResult.rows[0], action: 'updated', message: 'Manutenção atualizada nos Indicadores' });
    }

    // CRIAR novo registro
    const result = await pool.query(
      `INSERT INTO indicadores_dados (
        upload_id, placa, modelo, km, relato, data_agenda, 
        oficina_debito, focal, status, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, CURRENT_DATE, $6, $7, $8, NOW()
      ) RETURNING *`,
      [uploadId, placa, modeloVeiculo, km || null, relato || '', oficina || 'Oficina Murici', mecanico || '', indicadorStatus]
    );

    console.log('[INDICADORES] Manutenção criada com sucesso:', result.rows[0]);
    res.json({ success: true, data: result.rows[0], action: 'created', message: 'Manutenção sincronizada com Indicadores' });
  } catch (error) {
    console.error('[INDICADORES] Erro ao sincronizar manutenção da Oficina Murici:', error);
    res.status(500).json({ success: false, message: 'Erro ao sincronizar manutenção' });
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
    const { placa, modelo, km, relato, data_agenda, focal, oficina_debito, atendimento, status, pecas, data_finalizacao, data_parada, data_inicio_manutencao, tipo_manutencao } = req.body;

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
        data_finalizacao = COALESCE($11, data_finalizacao),
        data_parada = COALESCE($12, data_parada),
        data_inicio_manutencao = COALESCE($13, data_inicio_manutencao),
        tipo_manutencao = COALESCE($14, tipo_manutencao),
        updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [placa, modelo, km, relato, data_agenda, focal, oficina_debito, atendimento, status, id, data_finalizacao, data_parada, data_inicio_manutencao, tipo_manutencao]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Registro não encontrado' });
    }

    let orcamentoCriado = false;
    const manutencaoData = result.rows[0];

    // SINCRONIZAÇÃO: Atualizar status do veículo Coca-Cola quando manutenção é finalizada
    if (status === 'Finalizado' && manutencaoData.placa) {
      try {
        // Buscar se existe OS Coca-Cola para esta placa
        const osResult = await pool.query(
          `SELECT os.*, ccb.id as base_id FROM coca_cola_os_requests os
           LEFT JOIN coca_cola_bases ccb ON os.base_origem ILIKE '%' || ccb.nome || '%'
           WHERE os.placa = $1 AND os.status_manutencao != 'finalizado'
           LIMIT 1`,
          [manutencaoData.placa]
        );

        if (osResult.rows.length > 0) {
          const os = osResult.rows[0];
          
          // Atualizar OS para finalizado
          await pool.query(
            `UPDATE coca_cola_os_requests SET status_manutencao = 'finalizado', updated_at = NOW() WHERE id = $1`,
            [os.id]
          );

          // Atualizar veículo para disponível
          if (os.base_id) {
            await pool.query(
              `UPDATE coca_cola_vehicles 
               SET status = 'disponivel', oficina = NULL, prazo_estimado = NULL, updated_at = NOW()
               WHERE placa = $1 AND base_id = $2`,
              [manutencaoData.placa, os.base_id]
            );
            console.log(`[CocaCola Sync] Veículo ${manutencaoData.placa} liberado após finalização da manutenção`);
          }
        }
      } catch (syncError) {
        console.error('[CocaCola Sync] Erro ao sincronizar finalização:', syncError);
      }
    }

    // Se há peças e oficina, criar orçamento pendente de aprovação
    if (pecas && pecas.length > 0 && manutencaoData.oficina_debito) {
      // Buscar ou criar registro de oficina
      let oficinaResult = await pool.query(
        `SELECT id FROM manutencao_oficinas WHERE manutencao_id = $1 LIMIT 1`,
        [id]
      );

      let manutencaoOficinaId: number;

      if (oficinaResult.rows.length === 0) {
        // Criar registro de oficina
        const novaOficina = await pool.query(
          `INSERT INTO manutencao_oficinas (manutencao_id, oficina_nome, km_envio, data_envio, status)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'ativa')
           RETURNING id`,
          [id, manutencaoData.oficina_debito, km || null]
        );
        manutencaoOficinaId = novaOficina.rows[0].id;
      } else {
        manutencaoOficinaId = oficinaResult.rows[0].id;
      }

      // Calcular valor total das peças
      const valorTotal = pecas.reduce((sum: number, p: {nome: string, valor: number}) => sum + (p.valor || 0), 0);

      // Criar descrição das peças para observação
      const descricaoPecas = pecas.map((p: {nome: string, valor: number}) => 
        `${p.nome}: R$ ${p.valor.toFixed(2)}`
      ).join('; ');

      // Criar itens JSON para armazenar
      const itensJson = JSON.stringify(pecas.map((p: {nome: string, valor: number}) => ({
        descricao: p.nome,
        valor: p.valor
      })));

      // Criar orçamento pendente de aprovação
      await pool.query(
        `INSERT INTO manutencao_orcamentos 
          (manutencao_oficina_id, valor_estimado, itens, observacao, aprovado, data_orcamento)
         VALUES ($1, $2, $3::jsonb, $4, false, CURRENT_TIMESTAMP)`,
        [manutencaoOficinaId, valorTotal, itensJson, descricaoPecas]
      );

      orcamentoCriado = true;
      console.log(`[ORCAMENTO] Orçamento criado automaticamente para manutenção ${id}: R$ ${valorTotal}`);
    }

    res.json({ success: true, data: manutencaoData, orcamentoCriado });
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
        (SELECT COUNT(*) FROM indicadores_dados WHERE upload_id = $1 AND (status IS NULL OR status != 'Finalizado')) as total_em_manutencao,
        (SELECT COUNT(*) FROM indicadores_liberado WHERE upload_id = $1) as total_liberado,
        (SELECT COUNT(DISTINCT placa) FROM indicadores_dados WHERE upload_id = $1 AND (status IS NULL OR status != 'Finalizado')) as veiculos_unicos_manutencao,
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

// Listar manutenções finalizadas com filtros (inclui veículos liberados da Oficina Murici)
router.get('/finalizadas', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { placa, oficina, tipo_manutencao, status, operacao, mes } = req.query;
    
    // Primeiro buscar manutenções finalizadas da tabela principal
    // Normalizar status para "Finalizado" na aba de finalizadas
    let queryFinalizadas = `SELECT *, 'Finalizado' as status_exibicao FROM manutencoes_finalizadas WHERE 1=1`;
    const paramsFinalizadas: any[] = [];
    let paramIndex = 1;
    
    if (placa) {
      queryFinalizadas += ` AND UPPER(placa) LIKE UPPER($${paramIndex})`;
      paramsFinalizadas.push(`%${placa}%`);
      paramIndex++;
    }
    if (oficina) {
      queryFinalizadas += ` AND UPPER(oficina) LIKE UPPER($${paramIndex})`;
      paramsFinalizadas.push(`%${oficina}%`);
      paramIndex++;
    }
    if (tipo_manutencao) {
      queryFinalizadas += ` AND tipo_manutencao = $${paramIndex}`;
      paramsFinalizadas.push(tipo_manutencao);
      paramIndex++;
    }
    if (status) {
      queryFinalizadas += ` AND status = $${paramIndex}`;
      paramsFinalizadas.push(status);
      paramIndex++;
    }
    if (operacao) {
      queryFinalizadas += ` AND operacao = $${paramIndex}`;
      paramsFinalizadas.push(operacao);
      paramIndex++;
    }
    if (mes) {
      queryFinalizadas += ` AND mes_referencia = $${paramIndex}`;
      paramsFinalizadas.push(mes);
      paramIndex++;
    }
    
    queryFinalizadas += ' ORDER BY data_agenda DESC NULLS LAST, id DESC';
    
    const resultFinalizadas = await pool.query(queryFinalizadas, paramsFinalizadas);
    
    // Buscar veículos liberados da Oficina Murici (indicadores_dados)
    // Só inclui se não há filtro de tipo_manutencao (pois não tem esse campo)
    // e não há filtro de operação (também não tem)
    let resultOficinaMurici: any[] = [];
    
    // Verificar se deve incluir veículos da Oficina Murici
    const incluirOficinaMurici = !tipo_manutencao && !operacao && 
      (!oficina || oficina.toString().toUpperCase().includes('MURICI'));
    
    if (incluirOficinaMurici) {
      let queryMurici = `
        SELECT 
          id,
          placa,
          modelo,
          km,
          relato,
          data_agenda,
          focal,
          oficina_debito as oficina,
          'Corretiva' as tipo_manutencao,
          0 as valor_orcamento,
          '' as operacao,
          status,
          'Finalizado' as status_exibicao,
          updated_at as data_liberado,
          CASE 
            WHEN data_agenda IS NOT NULL 
            THEN GREATEST(0, DATE_PART('day', updated_at - data_agenda::timestamp))::integer
            ELSE 0 
          END as dias_manutencao,
          TO_CHAR(updated_at, 'YYYY-MM') as mes_referencia,
          created_at
        FROM indicadores_dados 
        WHERE status = 'Finalizado' 
          AND oficina_debito = 'Oficina Murici'
      `;
      
      const paramsMurici: any[] = [];
      let paramMuriciIdx = 1;
      
      if (placa) {
        queryMurici += ` AND UPPER(placa) LIKE UPPER($${paramMuriciIdx})`;
        paramsMurici.push(`%${placa}%`);
        paramMuriciIdx++;
      }
      if (mes) {
        queryMurici += ` AND TO_CHAR(updated_at, 'YYYY-MM') = $${paramMuriciIdx}`;
        paramsMurici.push(mes);
        paramMuriciIdx++;
      }
      
      queryMurici += ' ORDER BY data_agenda DESC NULLS LAST';
      
      const muriciResult = await pool.query(queryMurici, paramsMurici);
      
      // Filtrar duplicatas: excluir veículos que já existem em manutencoes_finalizadas
      const placasFinalizadas = new Set(resultFinalizadas.rows.map((r: any) => r.placa?.toUpperCase()));
      resultOficinaMurici = muriciResult.rows.filter((r: any) => 
        !placasFinalizadas.has(r.placa?.toUpperCase())
      );
    }
    
    // Combinar resultados
    const allData = [...resultFinalizadas.rows, ...resultOficinaMurici];
    
    // Ordenar por data
    allData.sort((a, b) => {
      const dateA = a.data_agenda ? new Date(a.data_agenda).getTime() : 0;
      const dateB = b.data_agenda ? new Date(b.data_agenda).getTime() : 0;
      return dateB - dateA;
    });
    
    res.json({ success: true, data: allData, total: allData.length });
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

// Buscar movimentações de manutenção (entradas e saídas) com comparativo diário
router.get('/movimentacoes', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { periodo = '30' } = req.query;
    const dias = parseInt(periodo as string) || 30;
    
    console.log('[MOVIMENTACOES] Buscando movimentações dos últimos', dias, 'dias');
    
    // Buscar entradas HOJE (manutencoes_historico)
    const entradasHojeHistorico = await pool.query(`
      SELECT COUNT(*) as total
      FROM manutencoes_historico
      WHERE DATE(data_entrada) = CURRENT_DATE
        AND data_entrada IS NOT NULL
    `);
    
    // Buscar entradas HOJE (indicadores_dados - sincronizado do Supabase/Oficina Murici)
    const entradasHojeIndicadores = await pool.query(`
      SELECT COUNT(*) as total
      FROM indicadores_dados
      WHERE DATE(data_agenda) = CURRENT_DATE
        AND data_agenda IS NOT NULL
        AND status != 'Finalizado'
    `);
    
    // Buscar entradas ONTEM (manutencoes_historico)
    const entradasOntemHistorico = await pool.query(`
      SELECT COUNT(*) as total
      FROM manutencoes_historico
      WHERE DATE(data_entrada) = CURRENT_DATE - 1
        AND data_entrada IS NOT NULL
    `);
    
    // Buscar entradas ONTEM (indicadores_dados)
    const entradasOntemIndicadores = await pool.query(`
      SELECT COUNT(*) as total
      FROM indicadores_dados
      WHERE DATE(data_agenda) = CURRENT_DATE - 1
        AND data_agenda IS NOT NULL
        AND status != 'Finalizado'
    `);
    
    // Buscar saídas HOJE (de todas as tabelas)
    const saidasHojeHistorico = await pool.query(`
      SELECT COUNT(*) as total
      FROM manutencoes_historico
      WHERE DATE(data_saida) = CURRENT_DATE
        AND data_saida IS NOT NULL
    `);
    
    const saidasHojeFinalizadas = await pool.query(`
      SELECT COUNT(*) as total
      FROM manutencoes_finalizadas
      WHERE DATE(data_liberado) = CURRENT_DATE
        AND data_liberado IS NOT NULL
    `);
    
    // Também contar finalizações de indicadores_dados - usar data_finalizacao apenas
    const saidasHojeIndicadores = await pool.query(`
      SELECT COUNT(*) as total
      FROM indicadores_dados
      WHERE status = 'Finalizado'
        AND DATE(data_finalizacao) = CURRENT_DATE
    `);
    
    // Buscar saídas ONTEM (de ambas as tabelas)
    const saidasOntemHistorico = await pool.query(`
      SELECT COUNT(*) as total
      FROM manutencoes_historico
      WHERE DATE(data_saida) = CURRENT_DATE - 1
        AND data_saida IS NOT NULL
    `);
    
    const saidasOntemFinalizadas = await pool.query(`
      SELECT COUNT(*) as total
      FROM manutencoes_finalizadas
      WHERE DATE(data_liberado) = CURRENT_DATE - 1
        AND data_liberado IS NOT NULL
    `);
    
    // Também contar finalizações de indicadores_dados de ontem - usar data_finalizacao apenas
    const saidasOntemIndicadores = await pool.query(`
      SELECT COUNT(*) as total
      FROM indicadores_dados
      WHERE status = 'Finalizado'
        AND DATE(data_finalizacao) = CURRENT_DATE - 1
    `);
    
    // Buscar veículos que ENTRARAM em manutenção HOJE (para modal) - manutencoes_historico
    const entradasHistorico = await pool.query(`
      SELECT 
        id, placa, tipo, descricao, oficina, base, operacao,
        to_char(data_entrada, 'YYYY-MM-DD') as data_entrada, 
        km, status
      FROM manutencoes_historico
      WHERE DATE(data_entrada) = CURRENT_DATE
        AND data_entrada IS NOT NULL
      ORDER BY data_entrada DESC
    `);
    
    // Buscar veículos que ENTRARAM em manutenção HOJE (para modal) - indicadores_dados (Oficina Murici)
    const entradasIndicadores = await pool.query(`
      SELECT 
        id, placa, 'Corretiva' as tipo, relato as descricao, oficina_debito as oficina, 
        '' as base, '' as operacao,
        to_char(data_agenda, 'YYYY-MM-DD') as data_entrada, 
        0 as km, status
      FROM indicadores_dados
      WHERE DATE(data_agenda) = CURRENT_DATE
        AND data_agenda IS NOT NULL
        AND status != 'Finalizado'
      ORDER BY data_agenda DESC
    `);
    
    // Combinar entradas de todas as tabelas
    const todasEntradas = [...entradasHistorico.rows, ...entradasIndicadores.rows]
      .sort((a, b) => (b.data_entrada || '').localeCompare(a.data_entrada || ''));
    
    // Buscar veículos que SAÍRAM da manutenção HOJE (para modal)
    const saidas = await pool.query(`
      SELECT 
        id, placa, tipo, descricao, oficina, base, operacao,
        to_char(data_entrada, 'YYYY-MM-DD') as data_entrada, 
        to_char(data_saida, 'YYYY-MM-DD') as data_saida, 
        tempo_total, valor, status
      FROM manutencoes_historico
      WHERE DATE(data_saida) = CURRENT_DATE
        AND data_saida IS NOT NULL
      ORDER BY data_saida DESC
    `);
    
    // Também buscar das finalizadas para saídas de HOJE
    const saidasFinalizadas = await pool.query(`
      SELECT 
        id, placa, tipo_manutencao as tipo, relato as descricao, oficina as oficina, 
        '' as base, operacao, 
        to_char(data_agenda, 'YYYY-MM-DD') as data_entrada, 
        to_char(data_liberado, 'YYYY-MM-DD') as data_saida, 
        dias_manutencao as tempo_total,
        COALESCE(valor_orcamento, valor_negociado, 0) as valor, status
      FROM manutencoes_finalizadas
      WHERE DATE(data_liberado) = CURRENT_DATE
        AND data_liberado IS NOT NULL
      ORDER BY data_liberado DESC
    `);
    
    // Buscar saídas de indicadores_dados de HOJE (finalizados) - usar data_finalizacao apenas
    const saidasIndicadores = await pool.query(`
      SELECT 
        id, placa, 'Corretiva' as tipo, relato as descricao, oficina_debito as oficina, 
        '' as base, '' as operacao, 
        to_char(data_agenda, 'YYYY-MM-DD') as data_entrada, 
        to_char(data_finalizacao, 'YYYY-MM-DD') as data_saida,
        CASE 
          WHEN data_agenda IS NOT NULL AND data_finalizacao IS NOT NULL
          THEN GREATEST(0, data_finalizacao - data_agenda)::integer
          ELSE 0 
        END as tempo_total,
        0 as valor, status
      FROM indicadores_dados
      WHERE status = 'Finalizado'
        AND DATE(data_finalizacao) = CURRENT_DATE
      ORDER BY data_finalizacao DESC
    `);
    
    // Combinar saídas de todas as tabelas (ordenar por string para evitar problemas de timezone)
    const todasSaidas = [...saidas.rows, ...saidasFinalizadas.rows, ...saidasIndicadores.rows]
      .sort((a, b) => (b.data_saida || '').localeCompare(a.data_saida || ''));
    
    // Calcular totais diários (incluindo todas as fontes de dados)
    const entradasHojeTotal = parseInt(entradasHojeHistorico.rows[0]?.total || '0') +
                               parseInt(entradasHojeIndicadores.rows[0]?.total || '0');
    const entradasOntemTotal = parseInt(entradasOntemHistorico.rows[0]?.total || '0') +
                                parseInt(entradasOntemIndicadores.rows[0]?.total || '0');
    const saidasHojeTotal = parseInt(saidasHojeHistorico.rows[0]?.total || '0') + 
                            parseInt(saidasHojeFinalizadas.rows[0]?.total || '0') +
                            parseInt(saidasHojeIndicadores.rows[0]?.total || '0');
    const saidasOntemTotal = parseInt(saidasOntemHistorico.rows[0]?.total || '0') + 
                             parseInt(saidasOntemFinalizadas.rows[0]?.total || '0') +
                             parseInt(saidasOntemIndicadores.rows[0]?.total || '0');
    
    console.log('[MOVIMENTACOES] Entradas hoje:', entradasHojeTotal, 'ontem:', entradasOntemTotal);
    console.log('[MOVIMENTACOES] Saídas hoje:', saidasHojeTotal, 'ontem:', saidasOntemTotal);
    
    // Debug: mostrar primeiras 3 datas retornadas para verificar formato
    if (todasSaidas.length > 0) {
      console.log('[MOVIMENTACOES-DEBUG] Primeiras datas de saída:', todasSaidas.slice(0, 3).map(s => ({ placa: s.placa, data_saida: s.data_saida })));
    }
    
    res.json({
      success: true,
      periodo: dias,
      comparativo: {
        entradas: {
          hoje: entradasHojeTotal,
          ontem: entradasOntemTotal,
          variacao: entradasHojeTotal - entradasOntemTotal
        },
        saidas: {
          hoje: saidasHojeTotal,
          ontem: saidasOntemTotal,
          variacao: saidasHojeTotal - saidasOntemTotal
        }
      },
      entradas: {
        total: todasEntradas.length,
        registros: todasEntradas
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

// ============================================
// ROTA PRINCIPAL: Recalcular todos os indicadores (GET /api/indicadores/update)
// Sincroniza dados do Supabase automaticamente
// ============================================
router.get('/update', async (req: Request, res: Response) => {
  try {
    console.log('[INDICADORES] Recalculando todos os indicadores...');

    if (!supabaseClient) {
      console.log('[INDICADORES] Cliente Supabase não configurado, usando apenas PostgreSQL');
    }

    // Buscar upload_id mais recente
    const uploadResult = await pool.query(
      'SELECT id FROM indicadores_uploads ORDER BY upload_date DESC LIMIT 1'
    );
    const uploadId = uploadResult.rows[0]?.id || 1;

    // 1. Se tiver Supabase, sincronizar manutenções ativas
    let syncStats = { novos: 0, atualizados: 0, finalizados: 0 };
    
    if (supabaseClient) {
      // Buscar TODAS as manutenções do Supabase
      const { data: manutencoesSupabase, error: supabaseError } = await supabaseClient
        .from('oficina_murici_manutencoes')
        .select('*');

      if (!supabaseError && manutencoesSupabase) {
        console.log(`[INDICADORES] Total de manutenções no Supabase: ${manutencoesSupabase.length}`);
        
        for (const manutencao of manutencoesSupabase) {
          // Mapear status
          let indicadorStatus = 'Em Manutenção';
          if (manutencao.status === 'aguardando_peca') {
            indicadorStatus = 'Aguardando Peças';
          } else if (manutencao.status === 'finalizado') {
            indicadorStatus = 'Finalizado';
          }

          // Verificar se já existe nos indicadores (por placa - qualquer status)
          const existeResult = await pool.query(
            `SELECT id, status FROM indicadores_dados 
             WHERE placa = $1`,
            [manutencao.placa]
          );

          // Buscar modelo do veículo
          const veiculoResult = await pool.query(
            'SELECT modelo FROM veiculos WHERE placa = $1',
            [manutencao.placa]
          );
          const modeloVeiculo = veiculoResult.rows[0]?.modelo || '';

          // Usar data_hora_inicio ou created_at como data de início da manutenção (para calcular dias parados)
          // Proteção: se data_hora_inicio for muito antiga (mais de 30 dias antes do created_at) ou no futuro, usar created_at
          let dataInicio = new Date().toISOString().split('T')[0];
          const createdAtDate = manutencao.created_at ? new Date(manutencao.created_at) : new Date();
          
          if (manutencao.data_hora_inicio) {
            const dataHoraInicioDate = new Date(manutencao.data_hora_inicio);
            const hoje = new Date();
            const diffFromCreated = Math.abs(createdAtDate.getTime() - dataHoraInicioDate.getTime()) / (1000 * 60 * 60 * 24);
            
            // Se data_hora_inicio está dentro de 30 dias do created_at e não é futura, usar ela
            if (diffFromCreated <= 30 && dataHoraInicioDate <= hoje) {
              dataInicio = manutencao.data_hora_inicio.split('T')[0];
            } else {
              // Caso contrário, usar created_at do Supabase
              dataInicio = createdAtDate.toISOString().split('T')[0];
            }
          } else {
            // Se não tem data_hora_inicio, usar created_at
            dataInicio = createdAtDate.toISOString().split('T')[0];
          }

          if (existeResult.rows.length > 0) {
            // Já existe registro para esta placa - SEMPRE atualizar data_agenda com data correta de parada
            await pool.query(
              `UPDATE indicadores_dados 
               SET km = COALESCE($1, km),
                   relato = COALESCE($2, relato),
                   focal = COALESCE($3, focal),
                   status = $4,
                   modelo = COALESCE($5, modelo),
                   data_agenda = $6,
                   updated_at = NOW()
               WHERE id = $7`,
              [
                manutencao.km || null,
                manutencao.descricao_manutencao || '',
                manutencao.mecanico || '',
                indicadorStatus,
                modeloVeiculo,
                dataInicio,
                existeResult.rows[0].id
              ]
            );
            if (manutencao.status === 'finalizado') {
              syncStats.finalizados++;
            } else {
              syncStats.atualizados++;
            }
          } else {
            // Inserir novo registro
            await pool.query(
              `INSERT INTO indicadores_dados (
                upload_id, placa, modelo, km, relato, data_agenda, 
                oficina_debito, focal, status, created_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
              )`,
              [
                uploadId, 
                manutencao.placa, 
                modeloVeiculo, 
                manutencao.km || null, 
                manutencao.descricao_manutencao || '', 
                dataInicio,
                'Oficina Murici', 
                manutencao.mecanico || '',
                indicadorStatus
              ]
            );
            syncStats.novos++;
          }
        }
      }
    }

    // 2. Calcular indicadores
    // Veículos em manutenção
    const emManutencaoResult = await pool.query(`
      SELECT COUNT(*) as total FROM indicadores_dados 
      WHERE status IN ('Em Manutenção', 'Aguardando Peças', 'Em Execução', 'Orçamento Aprovado')
    `);
    
    // Veículos finalizados (hoje e nos últimos 7 dias)
    const liberadosHojeResult = await pool.query(`
      SELECT COUNT(*) as total FROM indicadores_dados 
      WHERE status = 'Finalizado' 
      AND DATE(updated_at) = CURRENT_DATE
    `);
    
    const liberadosSemanaResult = await pool.query(`
      SELECT COUNT(*) as total FROM indicadores_dados 
      WHERE status = 'Finalizado' 
      AND updated_at >= CURRENT_DATE - INTERVAL '7 days'
    `);
    
    // Manutenções preventivas e corretivas (do PostgreSQL historico)
    const preventivasResult = await pool.query(`
      SELECT COUNT(*) as total FROM manutencoes_historico 
      WHERE LOWER(tipo) LIKE '%preventiv%'
    `);
    
    const corretivasResult = await pool.query(`
      SELECT COUNT(*) as total FROM manutencoes_historico 
      WHERE LOWER(tipo) LIKE '%corretiv%' OR LOWER(tipo) NOT LIKE '%preventiv%'
    `);
    
    // Dias parados (soma de dias entre data_agenda e hoje)
    const diasParadosResult = await pool.query(`
      SELECT COALESCE(SUM(
        CASE 
          WHEN data_agenda IS NOT NULL 
          THEN (CURRENT_DATE - data_agenda)::integer
          ELSE 0 
        END
      ), 0) as total
      FROM indicadores_dados 
      WHERE status IN ('Em Manutenção', 'Aguardando Peças', 'Em Execução')
    `);
    
    // Movimentação diária - Usar indicadores_dados (sincronizado do Supabase)
    // Entraram: veículos que entraram em manutenção hoje (created_at de hoje com status em manutenção)
    const entradasHojeResult = await pool.query(`
      SELECT COUNT(*) as total FROM indicadores_dados 
      WHERE DATE(created_at AT TIME ZONE 'America/Sao_Paulo') = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date
      AND status != 'Finalizado'
    `);
    
    // Saíram: veículos finalizados hoje (status = 'Finalizado' e updated_at de hoje)
    const saidasHojeResult = await pool.query(`
      SELECT COUNT(*) as total FROM indicadores_dados 
      WHERE status = 'Finalizado'
      AND DATE(updated_at AT TIME ZONE 'America/Sao_Paulo') = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date
    `);
    
    // Também contar finalizações do dia
    const saidasHojeFinalizadas = await pool.query(`
      SELECT COUNT(*) as total FROM manutencoes_finalizadas 
      WHERE DATE(data_liberado) = CURRENT_DATE
    `);
    
    // Custo total (usar manutencoes_finalizadas que tem os custos reais)
    const custoTotalResult = await pool.query(`
      SELECT COALESCE(SUM(COALESCE(valor_orcamento, valor_negociado, 0)), 0) as total 
      FROM manutencoes_finalizadas
    `);

    // Construir resposta
    const indicadores = {
      veiculosEmManutencao: parseInt(emManutencaoResult.rows[0]?.total || '0'),
      veiculosLiberados: parseInt(liberadosSemanaResult.rows[0]?.total || '0'),
      veiculosLiberadosHoje: parseInt(liberadosHojeResult.rows[0]?.total || '0'),
      manutencoesPreventivas: parseInt(preventivasResult.rows[0]?.total || '0'),
      manutencoesCorretivas: parseInt(corretivasResult.rows[0]?.total || '0'),
      diasParados: Math.round(parseFloat(diasParadosResult.rows[0]?.total || '0')),
      movimentacao: {
        entraram: parseInt(entradasHojeResult.rows[0]?.total || '0'),
        sairam: parseInt(saidasHojeResult.rows[0]?.total || '0') + 
                parseInt(saidasHojeFinalizadas.rows[0]?.total || '0')
      },
      custoTotal: parseFloat(custoTotalResult.rows[0]?.total || '0'),
      sincronizacao: {
        novos: syncStats.novos,
        atualizados: syncStats.atualizados,
        finalizados: syncStats.finalizados,
        timestamp: new Date().toISOString()
      }
    };

    console.log('[INDICADORES] Indicadores calculados:', indicadores);
    
    res.json({
      success: true,
      indicadores,
      syncStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[INDICADORES] Erro ao recalcular indicadores:', error);
    res.status(500).json({ success: false, message: 'Erro ao recalcular indicadores' });
  }
});

// ==================== CRUD DE FORNECEDORES ====================

// Listar todos os fornecedores
router.get('/fornecedores', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { ativo, categoria, search } = req.query;
    
    let query = 'SELECT * FROM fornecedores WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (ativo !== undefined && ativo !== '') {
      query += ` AND ativo = $${paramIndex}`;
      params.push(ativo === 'true');
      paramIndex++;
    }

    if (categoria && categoria !== '') {
      query += ` AND categoria = $${paramIndex}`;
      params.push(categoria);
      paramIndex++;
    }

    if (search && search !== '') {
      query += ` AND (LOWER(nome) LIKE $${paramIndex} OR LOWER(cnpj) LIKE $${paramIndex} OR LOWER(cidade) LIKE $${paramIndex})`;
      params.push(`%${String(search).toLowerCase()}%`);
      paramIndex++;
    }

    query += ' ORDER BY nome ASC';

    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('[FORNECEDORES] Erro ao listar fornecedores:', error);
    res.status(500).json({ success: false, message: 'Erro ao listar fornecedores' });
  }
});

// Buscar fornecedor por ID
router.get('/fornecedores/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM fornecedores WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Fornecedor não encontrado' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('[FORNECEDORES] Erro ao buscar fornecedor:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar fornecedor' });
  }
});

// Criar novo fornecedor
router.post('/fornecedores', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const {
      nome,
      cnpj,
      categoria,
      tipo_servico,
      contato_nome,
      contato_telefone,
      contato_email,
      endereco,
      cidade,
      estado,
      cep,
      observacoes,
      is_parceiro,
      ativo
    } = req.body;

    if (!nome || nome.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Nome é obrigatório e deve ter pelo menos 2 caracteres' });
    }

    const result = await pool.query(
      `INSERT INTO fornecedores (
        nome, cnpj, categoria, tipo_servico, contato_nome, contato_telefone,
        contato_email, endereco, cidade, estado, cep, observacoes, is_parceiro, ativo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        nome.trim(),
        cnpj || null,
        categoria || 'oficina_mecanica',
        tipo_servico || null,
        contato_nome || null,
        contato_telefone || null,
        contato_email || null,
        endereco || null,
        cidade || null,
        estado || null,
        cep || null,
        observacoes || null,
        is_parceiro ?? false,
        ativo ?? true
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Fornecedor cadastrado com sucesso'
    });
  } catch (error) {
    console.error('[FORNECEDORES] Erro ao criar fornecedor:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar fornecedor' });
  }
});

// Atualizar fornecedor
router.patch('/fornecedores/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      nome,
      cnpj,
      categoria,
      tipo_servico,
      contato_nome,
      contato_telefone,
      contato_email,
      endereco,
      cidade,
      estado,
      cep,
      observacoes,
      is_parceiro,
      ativo
    } = req.body;

    // Verificar se o fornecedor existe
    const existing = await pool.query('SELECT id FROM fornecedores WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Fornecedor não encontrado' });
    }

    const result = await pool.query(
      `UPDATE fornecedores SET
        nome = COALESCE($1, nome),
        cnpj = $2,
        categoria = COALESCE($3, categoria),
        tipo_servico = $4,
        contato_nome = $5,
        contato_telefone = $6,
        contato_email = $7,
        endereco = $8,
        cidade = $9,
        estado = $10,
        cep = $11,
        observacoes = $12,
        is_parceiro = COALESCE($13, is_parceiro),
        ativo = COALESCE($14, ativo),
        updated_at = NOW()
      WHERE id = $15
      RETURNING *`,
      [
        nome?.trim(),
        cnpj,
        categoria,
        tipo_servico,
        contato_nome,
        contato_telefone,
        contato_email,
        endereco,
        cidade,
        estado,
        cep,
        observacoes,
        is_parceiro,
        ativo,
        id
      ]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Fornecedor atualizado com sucesso'
    });
  } catch (error) {
    console.error('[FORNECEDORES] Erro ao atualizar fornecedor:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar fornecedor' });
  }
});

// Deletar fornecedor
router.delete('/fornecedores/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar se o fornecedor existe
    const existing = await pool.query('SELECT id FROM fornecedores WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Fornecedor não encontrado' });
    }

    await pool.query('DELETE FROM fornecedores WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Fornecedor removido com sucesso'
    });
  } catch (error) {
    console.error('[FORNECEDORES] Erro ao deletar fornecedor:', error);
    res.status(500).json({ success: false, message: 'Erro ao deletar fornecedor' });
  }
});

// Listar oficinas únicas das manutenções finalizadas (para importar como fornecedores)
router.get('/fornecedores/oficinas/disponiveis', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT oficina as nome, COUNT(*) as total_manutencoes
      FROM manutencoes_finalizadas 
      WHERE oficina IS NOT NULL AND oficina != ''
      GROUP BY oficina
      ORDER BY total_manutencoes DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('[FORNECEDORES] Erro ao listar oficinas disponíveis:', error);
    res.status(500).json({ success: false, message: 'Erro ao listar oficinas' });
  }
});

export default router;
