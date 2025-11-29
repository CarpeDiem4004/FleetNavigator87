import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { Pool } from 'pg';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeColumnName(name: string): string {
  if (!name) return '';
  return removeAccents(name)
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function normalizeDate(value: any): string | null {
  if (!value) return null;
  
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
  }
  
  if (typeof value === 'string') {
    const parts = value.split(/[\/\-]/);
    if (parts.length === 3) {
      const [a, b, c] = parts;
      if (a.length === 4) {
        return `${a}-${b.padStart(2, '0')}-${c.padStart(2, '0')}`;
      } else {
        return `${c}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
      }
    }
  }
  
  return null;
}

function normalizeNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  
  if (typeof value === 'number') return Math.round(value);
  
  if (typeof value === 'string') {
    const cleaned = value.replace(/\./g, '').replace(',', '.').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : Math.round(num);
  }
  
  return null;
}

function normalizeYear(value: any): number | null {
  const num = normalizeNumber(value);
  if (num && num >= 1900 && num <= 2100) return num;
  return null;
}

function normalizePlaca(value: any): string | null {
  if (!value) return null;
  const placa = String(value).toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
  if (placa.length >= 6 && placa.length <= 8) {
    return placa;
  }
  return null;
}

function normalizeTipoPosse(value: any): string {
  if (!value) return 'Murici';
  
  const v = String(value).toLowerCase().trim();
  
  if (v.includes('locad') || v.includes('alugad') || v.includes('terceiro')) {
    return 'Locada';
  }
  
  if (v.includes('propri') || v.includes('proprio') || v.includes('própria') || v.includes('murici')) {
    return 'Murici';
  }
  
  if (v.length > 0) {
    return 'Locada';
  }
  
  return 'Murici';
}

function normalizeStatus(value: any): string {
  if (!value) return 'Ativo';
  
  const v = String(value).toLowerCase().trim();
  
  if (v.includes('ativo') || v.includes('operando') || v.includes('rodando')) {
    return 'Veículo Ativo';
  }
  if (v.includes('devolvido') || v.includes('inativo') || v.includes('baixado')) {
    return 'Devolvido';
  }
  if (v.includes('manutenç') || v.includes('manutenc') || v.includes('parado')) {
    return 'Em Manutenção';
  }
  
  return String(value).trim() || 'Ativo';
}

const columnMappings: { [key: string]: string[] } = {
  placa: ['placa', 'plate', 'veiculo_placa', 'placa_veiculo'],
  modelo: ['modelo', 'model', 'veiculo_modelo', 'descricao', 'bau50', 'bau'],
  marca: ['marca', 'brand', 'fabricante', 'montadora'],
  tipo_posse: ['tipo_posse', 'posse', 'tipo', 'locado_proprio', 'propriedade', 'ownership'],
  locadora: ['locadora', 'locador', 'empresa_locadora', 'fornecedor'],
  status: ['status_final', 'statusfinal', 'status', 'situacao', 'estado_operacional'],
  categoria: ['categoria', 'category', 'perfil', 'perfil_cadastro', 'tipo_veiculo'],
  projeto: ['projeto', 'project', 'cliente'],
  base: ['base', 'filial', 'unidade', 'svc', 'centro_custo'],
  ano_fabricacao: ['ano_fabricacao', 'ano_fab', 'fabricacao'],
  ano_modelo: ['ano_modelo', 'ano', 'ano_mod', 'year'],
  capacidade: ['capacidade', 'capacity', 'carga', 'peso_max'],
  km: ['km', 'quilometragem', 'odometro', 'km_atual'],
  cor: ['cor', 'color', 'pintura'],
  tipo_combustivel: ['tipo_combustivel', 'combustivel', 'fuel', 'fuel_type'],
  chassi: ['chassi', 'chassis', 'numero_chassi'],
  renavam: ['renavam', 'renavan', 'cod_renavam'],
  estado: ['estado_veiculo', 'estado', 'uf'],
  cidade_veiculo: ['cidade_veiculo', 'cidade', 'municipio'],
  rastreador: ['rastreador', 'gps', 'tracker', 'localizador'],
  operacao: ['operacao', 'operation', 'regiao', 'regional'],
  data_inicio_operacao: ['data', 'data_inicio', 'data_inicio_operacao', 'inicio_operacao', 'data_aquisicao'],
  data_fim_operacao: ['data_fim', 'data_fim_operacao', 'fim_operacao', 'data_devolucao'],
  observacao: ['observacao', 'obs', 'observacoes', 'notas', 'comentarios', 'status_dds', 'statusdds']
};

function mapColumns(row: any, normalizedHeaders: { [key: string]: string }): any {
  const mapped: any = {};
  
  for (const [dbColumn, variations] of Object.entries(columnMappings)) {
    for (const variation of variations) {
      const normalized = normalizeColumnName(variation);
      for (const [origHeader, normHeader] of Object.entries(normalizedHeaders)) {
        // Para status, garantir match exato para evitar confusão entre status_final e status_dds
        if (dbColumn === 'status') {
          // Prioridade: status_final > status (ignorar status_dds)
          if (normHeader === 'status_final' || normHeader === 'statusfinal') {
            if (row[origHeader] !== undefined && row[origHeader] !== null && row[origHeader] !== '') {
              mapped[dbColumn] = row[origHeader];
              break;
            }
          }
        } else if (dbColumn === 'observacao') {
          // Capturar status_dds como observação
          if (normHeader === 'status_dds' || normHeader === 'statusdds') {
            if (row[origHeader] !== undefined && row[origHeader] !== null && row[origHeader] !== '') {
              mapped[dbColumn] = `Status DDS: ${row[origHeader]}`;
              break;
            }
          }
        } else {
          // Match normal para outros campos
          if (normHeader === normalized || normHeader.includes(normalized) || normalized.includes(normHeader)) {
            if (row[origHeader] !== undefined && row[origHeader] !== null && row[origHeader] !== '') {
              mapped[dbColumn] = row[origHeader];
              break;
            }
          }
        }
      }
      if (mapped[dbColumn]) break;
    }
    
    // Segunda passada para status se não encontrou status_final
    if (dbColumn === 'status' && !mapped[dbColumn]) {
      for (const [origHeader, normHeader] of Object.entries(normalizedHeaders)) {
        if (normHeader === 'status' && !normHeader.includes('dds')) {
          if (row[origHeader] !== undefined && row[origHeader] !== null && row[origHeader] !== '') {
            mapped[dbColumn] = row[origHeader];
            break;
          }
        }
      }
    }
  }
  
  return mapped;
}

router.post('/importar', upload.single('file'), async (req: Request, res: Response) => {
  try {
    console.log('[VEICULOS] Iniciando importação...');
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Arquivo não enviado' });
    }
    
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    console.log('[VEICULOS] Linhas na planilha:', data.length);
    
    if (data.length === 0) {
      return res.status(400).json({ success: false, message: 'Planilha vazia' });
    }
    
    const headers = Object.keys(data[0] as object);
    const normalizedHeaders: { [key: string]: string } = {};
    headers.forEach(h => {
      normalizedHeaders[h] = normalizeColumnName(h);
    });
    
    console.log('[VEICULOS] Headers normalizados:', normalizedHeaders);
    
    const report = {
      total: data.length,
      importados: 0,
      atualizados: 0,
      ignorados: 0,
      erros: [] as { linha: number; motivo: string }[]
    };
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      const lineNum = i + 2;
      
      try {
        const mapped = mapColumns(row, normalizedHeaders);
        
        const placa = normalizePlaca(mapped.placa);
        if (!placa) {
          report.erros.push({ linha: lineNum, motivo: 'Placa inválida ou vazia' });
          report.ignorados++;
          continue;
        }
        
        const tipoPosse = mapped.locadora ? 'Locada' : normalizeTipoPosse(mapped.tipo_posse);
        
        const veiculo = {
          placa,
          modelo: mapped.modelo ? String(mapped.modelo).trim() : null,
          marca: mapped.marca ? String(mapped.marca).trim() : null,
          tipo_posse: tipoPosse,
          locadora: mapped.locadora ? String(mapped.locadora).trim() : null,
          status: normalizeStatus(mapped.status),
          categoria: mapped.categoria ? String(mapped.categoria).trim() : null,
          projeto: mapped.projeto ? String(mapped.projeto).trim() : null,
          base: mapped.base ? String(mapped.base).trim() : null,
          ano_fabricacao: normalizeYear(mapped.ano_fabricacao),
          ano_modelo: normalizeYear(mapped.ano_modelo) || normalizeYear(mapped.ano_fabricacao),
          ano: normalizeYear(mapped.ano_modelo) || normalizeYear(mapped.ano_fabricacao),
          capacidade: mapped.capacidade ? String(mapped.capacidade).trim() : null,
          km: normalizeNumber(mapped.km),
          cor: mapped.cor ? String(mapped.cor).trim() : null,
          tipo_combustivel: mapped.tipo_combustivel ? String(mapped.tipo_combustivel).trim() : null,
          chassi: mapped.chassi ? String(mapped.chassi).trim() : null,
          renavam: mapped.renavam ? String(mapped.renavam).trim() : null,
          estado: mapped.estado ? String(mapped.estado).trim().toUpperCase() : null,
          cidade_veiculo: mapped.cidade_veiculo ? String(mapped.cidade_veiculo).trim() : null,
          rastreador: mapped.rastreador ? String(mapped.rastreador).trim() : null,
          operacao: mapped.operacao ? String(mapped.operacao).trim() : null,
          data_inicio_operacao: normalizeDate(mapped.data_inicio_operacao),
          data_fim_operacao: normalizeDate(mapped.data_fim_operacao),
          observacao: mapped.observacao ? String(mapped.observacao).trim() : null
        };
        
        const existing = await pool.query('SELECT id FROM veiculos WHERE placa = $1', [placa]);
        
        if (existing.rows.length > 0) {
          await pool.query(`
            UPDATE veiculos SET
              modelo = COALESCE($2, modelo),
              marca = COALESCE($3, marca),
              tipo_posse = $4,
              locadora = COALESCE($5, locadora),
              status = COALESCE($6, status),
              categoria = COALESCE($7, categoria),
              projeto = COALESCE($8, projeto),
              base = COALESCE($9, base),
              ano_fabricacao = COALESCE($10, ano_fabricacao),
              ano_modelo = COALESCE($11, ano_modelo),
              ano = COALESCE($12, ano),
              capacidade = COALESCE($13, capacidade),
              km = COALESCE($14, km),
              cor = COALESCE($15, cor),
              tipo_combustivel = COALESCE($16, tipo_combustivel),
              chassi = COALESCE($17, chassi),
              renavam = COALESCE($18, renavam),
              estado = COALESCE($19, estado),
              cidade_veiculo = COALESCE($20, cidade_veiculo),
              rastreador = COALESCE($21, rastreador),
              operacao = COALESCE($22, operacao),
              data_inicio_operacao = COALESCE($23, data_inicio_operacao),
              data_fim_operacao = COALESCE($24, data_fim_operacao),
              observacao = COALESCE($25, observacao),
              updated_at = NOW()
            WHERE placa = $1
          `, [
            placa, veiculo.modelo, veiculo.marca, veiculo.tipo_posse, veiculo.locadora,
            veiculo.status, veiculo.categoria, veiculo.projeto, veiculo.base,
            veiculo.ano_fabricacao, veiculo.ano_modelo, veiculo.ano, veiculo.capacidade,
            veiculo.km, veiculo.cor, veiculo.tipo_combustivel, veiculo.chassi,
            veiculo.renavam, veiculo.estado, veiculo.cidade_veiculo, veiculo.rastreador,
            veiculo.operacao, veiculo.data_inicio_operacao, veiculo.data_fim_operacao,
            veiculo.observacao
          ]);
          report.atualizados++;
        } else {
          await pool.query(`
            INSERT INTO veiculos (
              placa, modelo, marca, tipo_posse, locadora, status, categoria, projeto, base,
              ano_fabricacao, ano_modelo, ano, capacidade, km, cor, tipo_combustivel,
              chassi, renavam, estado, cidade_veiculo, rastreador, operacao,
              data_inicio_operacao, data_fim_operacao, observacao, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
              $17, $18, $19, $20, $21, $22, $23, $24, $25, NOW(), NOW()
            )
          `, [
            placa, veiculo.modelo, veiculo.marca, veiculo.tipo_posse, veiculo.locadora,
            veiculo.status, veiculo.categoria, veiculo.projeto, veiculo.base,
            veiculo.ano_fabricacao, veiculo.ano_modelo, veiculo.ano, veiculo.capacidade,
            veiculo.km, veiculo.cor, veiculo.tipo_combustivel, veiculo.chassi,
            veiculo.renavam, veiculo.estado, veiculo.cidade_veiculo, veiculo.rastreador,
            veiculo.operacao, veiculo.data_inicio_operacao, veiculo.data_fim_operacao,
            veiculo.observacao
          ]);
          report.importados++;
        }
        
      } catch (err: any) {
        console.error('[VEICULOS] Erro na linha', lineNum, ':', err.message);
        report.erros.push({ linha: lineNum, motivo: err.message });
        report.ignorados++;
      }
    }
    
    console.log('[VEICULOS] Importação concluída:', report);
    
    res.json({
      success: true,
      message: 'Importação concluída',
      ...report
    });
    
  } catch (error: any) {
    console.error('[VEICULOS] Erro na importação:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/listar', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, placa, modelo, marca, tipo_posse, locadora, status, categoria, projeto, base,
        ano_fabricacao, ano_modelo, ano, capacidade, km, cor, tipo_combustivel,
        chassi, renavam, estado, cidade_veiculo, rastreador, operacao,
        data_inicio_operacao, data_fim_operacao, observacao, created_at, updated_at
      FROM veiculos
      ORDER BY placa
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('[VEICULOS] Erro ao listar:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const result = await pool.query(`
      UPDATE veiculos SET
        placa = COALESCE($2, placa),
        modelo = COALESCE($3, modelo),
        marca = COALESCE($4, marca),
        tipo_posse = COALESCE($5, tipo_posse),
        locadora = COALESCE($6, locadora),
        status = COALESCE($7, status),
        categoria = COALESCE($8, categoria),
        projeto = COALESCE($9, projeto),
        base = COALESCE($10, base),
        ano_fabricacao = COALESCE($11, ano_fabricacao),
        ano_modelo = COALESCE($12, ano_modelo),
        km = COALESCE($13, km),
        cor = COALESCE($14, cor),
        tipo_combustivel = COALESCE($15, tipo_combustivel),
        chassi = COALESCE($16, chassi),
        renavam = COALESCE($17, renavam),
        estado = COALESCE($18, estado),
        cidade_veiculo = COALESCE($19, cidade_veiculo),
        rastreador = COALESCE($20, rastreador),
        operacao = COALESCE($21, operacao),
        data_inicio_operacao = COALESCE($22, data_inicio_operacao),
        observacao = COALESCE($23, observacao),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [
      id, 
      data.placa, data.modelo, data.marca, data.tipo_posse, data.locadora,
      data.status, data.categoria, data.projeto, data.base,
      data.ano_fabricacao, data.ano_modelo, data.km, data.cor, data.tipo_combustivel,
      data.chassi, data.renavam, data.estado, data.cidade_veiculo, data.rastreador,
      data.operacao, data.data_inicio_operacao, data.observacao
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Veículo não encontrado' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('[VEICULOS] Erro ao atualizar:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Estatísticas de veículos para dashboard
router.get('/stats/distribuicao', async (req: Request, res: Response) => {
  try {
    // Distribuição por tipo de posse (Murici vs Locada)
    const posseResult = await pool.query(`
      SELECT 
        COALESCE(tipo_posse, 'Indefinido') as tipo,
        COUNT(*) as quantidade
      FROM veiculos
      WHERE base_id = 46
      GROUP BY tipo_posse
      ORDER BY quantidade DESC
    `);
    
    // Distribuição por locadora
    const locadoraResult = await pool.query(`
      SELECT 
        COALESCE(NULLIF(locadora, ''), 'Murici') as locadora,
        COUNT(*) as quantidade
      FROM veiculos
      WHERE base_id = 46
      GROUP BY locadora
      ORDER BY quantidade DESC
    `);
    
    // Distribuição por estado (UF)
    const estadoResult = await pool.query(`
      SELECT 
        COALESCE(estado, 'Não informado') as estado,
        COUNT(*) as quantidade
      FROM veiculos
      WHERE base_id = 46
      GROUP BY estado
      ORDER BY quantidade DESC
    `);
    
    // Total de veículos
    const totalResult = await pool.query(`
      SELECT COUNT(*) as total FROM veiculos WHERE base_id = 46
    `);
    
    res.json({
      success: true,
      data: {
        porPosse: posseResult.rows.map(r => ({
          name: r.tipo,
          value: parseInt(r.quantidade)
        })),
        porLocadora: locadoraResult.rows.map(r => ({
          name: r.locadora,
          value: parseInt(r.quantidade)
        })),
        porEstado: estadoResult.rows.map(r => ({
          name: r.estado,
          value: parseInt(r.quantidade)
        })),
        total: parseInt(totalResult.rows[0].total)
      }
    });
  } catch (error: any) {
    console.error('[VEICULOS] Erro ao buscar estatísticas:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
