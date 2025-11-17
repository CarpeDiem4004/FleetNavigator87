import { Router, Request, Response } from 'express';
import { pool } from './db';
import multer from 'multer';
import xlsx from 'xlsx';
import { isAuthenticated } from './middleware';

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
              data_agenda, focal, reparo, tipo_manutencao
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
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
              row['Tipo de Manutenção'] || row['Tipo de manutenção'] || null
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

export default router;
