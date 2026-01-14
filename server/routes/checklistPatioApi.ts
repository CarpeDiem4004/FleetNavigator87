import { Router, Request, Response } from 'express';
import { pool } from '../db';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(process.cwd(), 'uploads', 'checklist-patio');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

const router = Router();

const CHECKLIST_ITENS_PADRAO = [
  { categoria: 'Pneus', item: 'Pneus em bom estado (sem cortes, bolhas ou desgaste excessivo)' },
  { categoria: 'Pneus', item: 'Pressão dos pneus adequada' },
  { categoria: 'Pneus', item: 'Estepe presente e em condições de uso' },
  { categoria: 'Iluminação', item: 'Faróis funcionando corretamente' },
  { categoria: 'Iluminação', item: 'Lanternas traseiras funcionando' },
  { categoria: 'Iluminação', item: 'Setas/piscas funcionando' },
  { categoria: 'Iluminação', item: 'Luz de ré funcionando' },
  { categoria: 'Iluminação', item: 'Luz de freio funcionando' },
  { categoria: 'Freios', item: 'Freio de serviço funcionando' },
  { categoria: 'Freios', item: 'Freio de estacionamento funcionando' },
  { categoria: 'Freios', item: 'Sistema de freio a ar sem vazamentos' },
  { categoria: 'Retrovisores', item: 'Retrovisores em bom estado e ajustados' },
  { categoria: 'Retrovisores', item: 'Espelhos laterais sem trincas' },
  { categoria: 'Fluidos', item: 'Nível de óleo do motor adequado' },
  { categoria: 'Fluidos', item: 'Nível de água do radiador adequado' },
  { categoria: 'Fluidos', item: 'Sem vazamentos visíveis (óleo, combustível, água)' },
  { categoria: 'Carroceria', item: 'Portas funcionando corretamente' },
  { categoria: 'Carroceria', item: 'Lacres em bom estado' },
  { categoria: 'Carroceria', item: 'Lona/baú sem danos aparentes' },
  { categoria: 'Documentação', item: 'Documento do veículo presente' },
  { categoria: 'Documentação', item: 'Licenciamento em dia' },
  { categoria: 'Segurança', item: 'Extintor presente e dentro da validade' },
  { categoria: 'Segurança', item: 'Triângulo de sinalização presente' },
  { categoria: 'Segurança', item: 'Macaco e chave de roda presentes' },
  { categoria: 'Geral', item: 'Condições gerais do veículo adequadas para operação' }
];

router.get('/itens-padrao', (_req: Request, res: Response) => {
  res.json({ success: true, data: CHECKLIST_ITENS_PADRAO });
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const { placa, base, status, data_inicio, data_fim, limit = 50 } = req.query;
    
    let query = `
      SELECT cp.*, 
        (SELECT COUNT(*) FROM checklist_patio_itens WHERE checklist_id = cp.id AND status = 'nao') as itens_reprovados,
        (SELECT COUNT(*) FROM checklist_patio_fotos WHERE checklist_id = cp.id) as total_fotos
      FROM checklist_patio cp
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (placa) {
      query += ` AND (cp.placa_cavalo ILIKE $${paramIndex} OR cp.placa_carreta_1 ILIKE $${paramIndex} OR cp.placa_carreta_2 ILIKE $${paramIndex})`;
      params.push(`%${placa}%`);
      paramIndex++;
    }
    if (base) {
      query += ` AND cp.base_nome ILIKE $${paramIndex}`;
      params.push(`%${base}%`);
      paramIndex++;
    }
    if (status) {
      query += ` AND cp.status_checklist = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    if (data_inicio) {
      query += ` AND cp.created_at >= $${paramIndex}`;
      params.push(data_inicio);
      paramIndex++;
    }
    if (data_fim) {
      query += ` AND cp.created_at <= $${paramIndex}`;
      params.push(data_fim);
      paramIndex++;
    }

    query += ` ORDER BY cp.created_at DESC LIMIT $${paramIndex}`;
    params.push(Number(limit));

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('[CHECKLIST-PATIO] Erro ao listar:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const statsQuery = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status_checklist = 'aprovado') as aprovados,
        COUNT(*) FILTER (WHERE status_checklist = 'aprovado_com_observacoes') as aprovados_observacoes,
        COUNT(*) FILTER (WHERE status_checklist = 'reprovado') as reprovados,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as hoje
      FROM checklist_patio
    `);

    const recorrentesQuery = await pool.query(`
      SELECT placa_cavalo, COUNT(*) as total_reprovacoes
      FROM checklist_patio
      WHERE status_checklist = 'reprovado'
      GROUP BY placa_cavalo
      HAVING COUNT(*) > 1
      ORDER BY total_reprovacoes DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        ...statsQuery.rows[0],
        placas_recorrentes: recorrentesQuery.rows
      }
    });
  } catch (error: any) {
    console.error('[CHECKLIST-PATIO] Erro stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/historico/:placa', async (req: Request, res: Response) => {
  try {
    const { placa } = req.params;
    
    const result = await pool.query(`
      SELECT cp.*,
        (SELECT COUNT(*) FROM checklist_patio_itens WHERE checklist_id = cp.id AND status = 'nao') as itens_reprovados,
        (SELECT COUNT(*) FROM checklist_patio_fotos WHERE checklist_id = cp.id) as total_fotos
      FROM checklist_patio cp
      WHERE cp.placa_cavalo ILIKE $1 
         OR cp.placa_carreta_1 ILIKE $1 
         OR cp.placa_carreta_2 ILIKE $1
      ORDER BY cp.created_at DESC
      LIMIT 50
    `, [`%${placa}%`]);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('[CHECKLIST-PATIO] Erro histórico:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const checklistResult = await pool.query(
      'SELECT * FROM checklist_patio WHERE id = $1',
      [id]
    );

    if (checklistResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Checklist não encontrado' });
    }

    const itensResult = await pool.query(
      'SELECT * FROM checklist_patio_itens WHERE checklist_id = $1 ORDER BY id',
      [id]
    );

    const fotosResult = await pool.query(
      'SELECT * FROM checklist_patio_fotos WHERE checklist_id = $1 ORDER BY id',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...checklistResult.rows[0],
        itens: itensResult.rows,
        fotos: fotosResult.rows
      }
    });
  } catch (error: any) {
    console.error('[CHECKLIST-PATIO] Erro ao buscar:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      placa_cavalo,
      placa_carreta_1,
      placa_carreta_2,
      tipo_operacao,
      tipo_veiculo,
      base_nome,
      operador_nome,
      operador_telefone,
      quilometragem,
      observacao_geral,
      itens,
      fotos
    } = req.body;

    if (!placa_cavalo || !operador_nome) {
      return res.status(400).json({
        success: false,
        message: 'Placa do cavalo e nome do operador são obrigatórios'
      });
    }

    const itensNao = itens?.filter((i: any) => i.status === 'nao') || [];
    let status_checklist = 'aprovado';
    if (itensNao.length > 3) {
      status_checklist = 'reprovado';
    } else if (itensNao.length > 0 || observacao_geral) {
      status_checklist = 'aprovado_com_observacoes';
    }

    const checklistResult = await pool.query(`
      INSERT INTO checklist_patio (
        placa_cavalo, placa_carreta_1, placa_carreta_2, tipo_operacao, tipo_veiculo,
        base_nome, operador_nome, operador_telefone, quilometragem,
        observacao_geral, status_checklist, finalizado, finalizado_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      placa_cavalo.toUpperCase(),
      placa_carreta_1?.toUpperCase() || null,
      placa_carreta_2?.toUpperCase() || null,
      tipo_operacao || 'Line Haul',
      tipo_veiculo || null,
      base_nome,
      operador_nome,
      operador_telefone,
      quilometragem,
      observacao_geral,
      status_checklist
    ]);

    const checklistId = checklistResult.rows[0].id;

    if (itens && itens.length > 0) {
      for (const item of itens) {
        await pool.query(`
          INSERT INTO checklist_patio_itens (checklist_id, categoria, item, status, observacao)
          VALUES ($1, $2, $3, $4, $5)
        `, [checklistId, item.categoria, item.item, item.status, item.observacao]);
      }
    }

    if (fotos && fotos.length > 0) {
      for (const foto of fotos) {
        await pool.query(`
          INSERT INTO checklist_patio_fotos (checklist_id, item_id, url_foto, descricao)
          VALUES ($1, $2, $3, $4)
        `, [checklistId, foto.item_id || null, foto.url_foto, foto.descricao]);
      }
    }

    console.log(`[CHECKLIST-PATIO] Novo checklist criado: ${checklistId} - Placa: ${placa_cavalo} - Status: ${status_checklist}`);

    res.json({
      success: true,
      message: 'Checklist registrado com sucesso',
      data: { id: checklistId, status_checklist }
    });
  } catch (error: any) {
    console.error('[CHECKLIST-PATIO] Erro ao criar:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/fotos', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { url_foto, item_id, descricao } = req.body;

    const result = await pool.query(`
      INSERT INTO checklist_patio_fotos (checklist_id, item_id, url_foto, descricao)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [id, item_id || null, url_foto, descricao]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('[CHECKLIST-PATIO] Erro ao adicionar foto:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/upload-foto', upload.single('foto'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { checklist_id, posicao, descricao } = req.body;

    if (!file) {
      return res.status(400).json({ success: false, message: 'Nenhuma foto enviada' });
    }

    if (!checklist_id) {
      return res.status(400).json({ success: false, message: 'ID do checklist é obrigatório' });
    }

    const url_foto = `/uploads/checklist-patio/${file.filename}`;

    const result = await pool.query(`
      INSERT INTO checklist_patio_fotos (checklist_id, item_id, url_foto, descricao, posicao)
      VALUES ($1, NULL, $2, $3, $4)
      RETURNING *
    `, [checklist_id, url_foto, descricao || null, posicao || null]);

    console.log(`[CHECKLIST-PATIO] Foto enviada: ${file.filename} para checklist ${checklist_id}`);

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('[CHECKLIST-PATIO] Erro ao fazer upload de foto:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export function registerChecklistPatioRoutes(app: any) {
  console.log('[CHECKLIST-PATIO] Registrando rotas de Checklist de Pátio');
  app.use('/api/checklist-patio', router);
}

export default router;
