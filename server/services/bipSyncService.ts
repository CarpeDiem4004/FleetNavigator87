import { google } from 'googleapis';
import { Pool } from 'pg';

const SPREADSHEET_ID = '1k5C937ewZBgv_TzNuXyBLlCioA8v_3Bhy7L1ZoU8_2I';
const SHEET_NAME = "BIP's Murici";

interface BipRow {
  placa: string;
  cadastro_veic: string;
  empresa: string;
  facility: string;
  data_ultimo_bip: string;
}

function parseServiceAccountKey(): any {
  let raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error('[BIP-SYNC] GOOGLE_SERVICE_ACCOUNT_KEY não configurada');
  }
  raw = raw.trim();
  if (!raw.startsWith('{')) {
    raw = '{' + raw;
  }
  if (!raw.endsWith('}')) {
    raw = raw + '}';
  }

  try {
    return JSON.parse(raw);
  } catch (firstError: any) {
    try {
      const fixed = raw.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
      return JSON.parse(fixed);
    } catch (secondError: any) {
      try {
        const base64Decoded = Buffer.from(raw, 'base64').toString('utf-8');
        return JSON.parse(base64Decoded);
      } catch {
        console.error('[BIP-SYNC] Erro ao parsear JSON da Service Account:', firstError.message);
        throw new Error('[BIP-SYNC] GOOGLE_SERVICE_ACCOUNT_KEY não é um JSON válido: ' + firstError.message);
      }
    }
  }
}

function parseDateBR(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  const trimmed = dateStr.trim();
  const parts = trimmed.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(d.getTime())) return d;
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d;
  return null;
}

export async function syncBIP(pool: Pool): Promise<{ total: number; inseridos: number; atualizados: number; erros: number }> {
  console.log('[BIP-SYNC] Iniciando sincronização com Google Sheets...');
  const startTime = Date.now();

  const credentials = parseServiceAccountKey();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:E`,
  });

  const rows = response.data.values;
  if (!rows || rows.length < 2) {
    console.log('[BIP-SYNC] Nenhum dado encontrado na planilha');
    return { total: 0, inseridos: 0, atualizados: 0, erros: 0 };
  }

  const rawHeaders = rows[0].map((h: string) => h.trim());
  const headers = rawHeaders.map((h: string) => h.toLowerCase());
  console.log('[BIP-SYNC] Headers encontrados:', rawHeaders);

  const colPlaca = headers.findIndex((h: string) => h.includes('plate') || h.includes('placa') || h === 'shp_lg_vehicle_plate_id');
  const colCadastro = headers.findIndex((h: string) => h.includes('cadastro') || h === 'cadastro_veic');
  const colEmpresa = headers.findIndex((h: string) => h.includes('company') || h === 'shp_company_name');
  const colFacility = headers.findIndex((h: string) => h.includes('facility'));
  const colUltimoBip = headers.findIndex((h: string) => h.includes('ultimo_bip') || h.includes('data_ultimo'));

  if (colPlaca === -1) {
    throw new Error('[BIP-SYNC] Coluna de placa não encontrada. Headers: ' + headers.join(', '));
  }

  console.log(`[BIP-SYNC] Mapeamento de colunas - Placa: ${colPlaca}, Cadastro: ${colCadastro}, Empresa: ${colEmpresa}, Facility: ${colFacility}, UltimoBIP: ${colUltimoBip}`);

  const dataRows: BipRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const placa = (row[colPlaca] || '').trim().toUpperCase();
    if (!placa || placa.length < 5) continue;

    dataRows.push({
      placa,
      cadastro_veic: colCadastro >= 0 ? (row[colCadastro] || '').trim() : '',
      empresa: colEmpresa >= 0 ? (row[colEmpresa] || '').trim() : '',
      facility: colFacility >= 0 ? (row[colFacility] || '').trim() : '',
      data_ultimo_bip: colUltimoBip >= 0 ? (row[colUltimoBip] || '').trim() : '',
    });
  }

  console.log(`[BIP-SYNC] ${dataRows.length} registros válidos encontrados na planilha`);

  let inseridos = 0;
  let atualizados = 0;
  let erros = 0;

  for (const item of dataRows) {
    try {
      const ultimoBip = parseDateBR(item.data_ultimo_bip);
      let diasSemBip = 0;
      if (ultimoBip) {
        const now = new Date();
        const diffTime = now.getTime() - ultimoBip.getTime();
        diasSemBip = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      }

      const existing = await pool.query(
        'SELECT id FROM indicadores_bip WHERE placa = $1',
        [item.placa]
      );

      if (existing.rows.length > 0) {
        await pool.query(
          `UPDATE indicadores_bip SET
            ultimo_bip = $1,
            cadastro_veic = $2,
            empresa = $3,
            facility = $4,
            dias_sem_bip = $5,
            sync_source = 'google_sheets',
            last_sync_at = NOW()
          WHERE placa = $6`,
          [
            ultimoBip ? ultimoBip.toISOString().split('T')[0] : null,
            item.cadastro_veic || null,
            item.empresa || null,
            item.facility || null,
            diasSemBip,
            item.placa
          ]
        );
        atualizados++;
      } else {
        await pool.query(
          `INSERT INTO indicadores_bip (placa, ultimo_bip, cadastro_veic, empresa, facility, dias_sem_bip, sync_source, last_sync_at, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'google_sheets', NOW(), NOW())`,
          [
            item.placa,
            ultimoBip ? ultimoBip.toISOString().split('T')[0] : null,
            item.cadastro_veic || null,
            item.empresa || null,
            item.facility || null,
            diasSemBip
          ]
        );
        inseridos++;
      }
    } catch (err: any) {
      erros++;
      if (erros <= 5) {
        console.error(`[BIP-SYNC] Erro ao processar placa ${item.placa}:`, err.message);
      }
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[BIP-SYNC] Sincronização concluída em ${elapsed}s - Total: ${dataRows.length}, Inseridos: ${inseridos}, Atualizados: ${atualizados}, Erros: ${erros}`);

  return { total: dataRows.length, inseridos, atualizados, erros };
}
