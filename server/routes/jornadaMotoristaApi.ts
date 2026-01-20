import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

// Configurações de jornada (em horas)
const JORNADA_PADRAO = 8;
const JORNADA_LIMITE = 10;
const JORNADA_ALERTA = 0.8; // 80% da jornada limite
const INTERJORNADA_HORAS = 11; // Horas de descanso obrigatório

// Calcular horas trabalhadas
function calcularHorasTrabalhadas(inicio: Date, fim: Date | null): number {
  const fimDate = fim || new Date();
  const diffMs = fimDate.getTime() - inicio.getTime();
  return diffMs / (1000 * 60 * 60);
}

// Determinar status da jornada
function determinarStatus(horasTrabalhadas: number, fimJornada: Date | null): string {
  if (fimJornada) return 'encerrada';
  if (horasTrabalhadas >= JORNADA_LIMITE) return 'excedido';
  if (horasTrabalhadas >= JORNADA_LIMITE * JORNADA_ALERTA) return 'proximo_limite';
  if (horasTrabalhadas <= JORNADA_PADRAO) return 'dentro_limite';
  return 'em_andamento';
}

// GET - Listar todas as jornadas com filtros
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, data, motorista } = req.query;
    
    let query = `
      SELECT 
        id, motorista_id, motorista_nome, veiculo_id, placa_cavalo,
        placa_carreta_1, placa_carreta_2, rota_id, rota_nome,
        base_id, base_nome, inicio_jornada, fim_jornada,
        horas_trabalhadas, status_jornada, observacoes,
        created_at, updated_at, created_by
      FROM jornada_motorista
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (status && status !== 'todos') {
      params.push(status);
      query += ` AND status_jornada = $${params.length}`;
    }
    
    if (data) {
      params.push(data);
      query += ` AND DATE(inicio_jornada) = $${params.length}`;
    }
    
    if (motorista) {
      params.push(`%${motorista}%`);
      query += ` AND motorista_nome ILIKE $${params.length}`;
    }
    
    query += ' ORDER BY inicio_jornada DESC LIMIT 100';
    
    const result = await pool.query(query, params);
    
    // Recalcular status em tempo real para jornadas em andamento
    const jornadas = result.rows.map(j => {
      if (!j.fim_jornada) {
        const horasTrabalhadas = calcularHorasTrabalhadas(new Date(j.inicio_jornada), null);
        const statusAtual = determinarStatus(horasTrabalhadas, null);
        return {
          ...j,
          horas_trabalhadas: horasTrabalhadas.toFixed(2),
          status_jornada: statusAtual
        };
      }
      return j;
    });
    
    res.json({ success: true, data: jornadas });
  } catch (error: any) {
    console.error('[JORNADA API] Erro ao listar jornadas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Estatísticas de jornadas em tempo real
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    
    // Buscar jornadas ativas (sem fim_jornada)
    const ativasResult = await pool.query(`
      SELECT id, inicio_jornada, fim_jornada, motorista_nome
      FROM jornada_motorista
      WHERE fim_jornada IS NULL
    `);
    
    let dentroLimite = 0;
    let proximoLimite = 0;
    let excedido = 0;
    
    ativasResult.rows.forEach(j => {
      const horas = calcularHorasTrabalhadas(new Date(j.inicio_jornada), null);
      if (horas >= JORNADA_LIMITE) excedido++;
      else if (horas >= JORNADA_LIMITE * JORNADA_ALERTA) proximoLimite++;
      else dentroLimite++;
    });
    
    // Total em operação
    const totalOperacao = ativasResult.rows.length;
    
    // Jornadas do dia
    const diaResult = await pool.query(`
      SELECT COUNT(*) as total FROM jornada_motorista
      WHERE DATE(inicio_jornada) = $1
    `, [hoje]);
    
    res.json({
      success: true,
      data: {
        total_operacao: totalOperacao,
        dentro_limite: dentroLimite,
        proximo_limite: proximoLimite,
        excedido: excedido,
        jornadas_hoje: parseInt(diaResult.rows[0]?.total || '0')
      }
    });
  } catch (error: any) {
    console.error('[JORNADA API] Erro ao buscar stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Jornadas ativas em tempo real (para o dashboard)
router.get('/ativas', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, motorista_id, motorista_nome, placa_cavalo,
        placa_carreta_1, rota_nome, base_nome, inicio_jornada
      FROM jornada_motorista
      WHERE fim_jornada IS NULL
      ORDER BY inicio_jornada ASC
    `);
    
    const jornadas = result.rows.map(j => {
      const horasTrabalhadas = calcularHorasTrabalhadas(new Date(j.inicio_jornada), null);
      const status = determinarStatus(horasTrabalhadas, null);
      return {
        ...j,
        horas_trabalhadas: horasTrabalhadas.toFixed(2),
        status_jornada: status
      };
    });
    
    res.json({ success: true, data: jornadas });
  } catch (error: any) {
    console.error('[JORNADA API] Erro ao buscar jornadas ativas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Iniciar nova jornada
router.post('/iniciar', async (req: Request, res: Response) => {
  try {
    const {
      motorista_id, motorista_nome, veiculo_id, placa_cavalo,
      placa_carreta_1, placa_carreta_2, rota_id, rota_nome,
      base_id, base_nome, observacoes, created_by
    } = req.body;
    
    if (!motorista_nome || !placa_cavalo) {
      return res.status(400).json({ success: false, error: 'Motorista e placa são obrigatórios' });
    }
    
    // Verificar se motorista já tem jornada ativa
    const jornadaAtiva = await pool.query(`
      SELECT id FROM jornada_motorista
      WHERE motorista_nome = $1 AND fim_jornada IS NULL
    `, [motorista_nome]);
    
    if (jornadaAtiva.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Este motorista já possui uma jornada em andamento' 
      });
    }

    // Verificar interjornada (descanso obrigatório de 11h)
    const ultimaJornada = await pool.query(`
      SELECT fim_jornada, interjornada_fim
      FROM jornada_motorista
      WHERE motorista_nome = $1 AND status_jornada = 'encerrada'
      ORDER BY fim_jornada DESC
      LIMIT 1
    `, [motorista_nome]);
    
    if (ultimaJornada.rows.length > 0) {
      const fimJornada = new Date(ultimaJornada.rows[0].fim_jornada);
      const interjornadaFim = ultimaJornada.rows[0].interjornada_fim 
        ? new Date(ultimaJornada.rows[0].interjornada_fim)
        : new Date(fimJornada.getTime() + INTERJORNADA_HORAS * 60 * 60 * 1000);
      
      const agora = new Date();
      
      if (agora < interjornadaFim) {
        const tempoRestante = (interjornadaFim.getTime() - agora.getTime()) / (1000 * 60 * 60);
        const horasRestantes = Math.floor(tempoRestante);
        const minutosRestantes = Math.round((tempoRestante - horasRestantes) * 60);
        
        return res.status(400).json({ 
          success: false, 
          error: `Motorista em descanso obrigatório (interjornada de 11h). Faltam ${horasRestantes}h ${minutosRestantes}min para liberação.`
        });
      }
    }
    
    const result = await pool.query(`
      INSERT INTO jornada_motorista (
        motorista_id, motorista_nome, veiculo_id, placa_cavalo,
        placa_carreta_1, placa_carreta_2, rota_id, rota_nome,
        base_id, base_nome, inicio_jornada, status_jornada,
        observacoes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), 'em_andamento', $11, $12)
      RETURNING *
    `, [
      motorista_id || null, motorista_nome, veiculo_id || null, placa_cavalo,
      placa_carreta_1 || null, placa_carreta_2 || null, rota_id || null, rota_nome || null,
      base_id || null, base_nome || null, observacoes || null, created_by || null
    ]);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('[JORNADA API] Erro ao iniciar jornada:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Encerrar jornada (agora calcula interjornada_fim = fim + 11h)
router.post('/encerrar/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { observacoes } = req.body;
    
    // Buscar jornada
    const jornada = await pool.query(`
      SELECT inicio_jornada FROM jornada_motorista WHERE id = $1 AND fim_jornada IS NULL
    `, [id]);
    
    if (jornada.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Jornada não encontrada ou já encerrada' });
    }
    
    const horasTrabalhadas = calcularHorasTrabalhadas(new Date(jornada.rows[0].inicio_jornada), new Date());
    
    // Calcular interjornada_fim = agora + 11 horas
    const result = await pool.query(`
      UPDATE jornada_motorista
      SET fim_jornada = NOW(),
          interjornada_fim = NOW() + INTERVAL '${INTERJORNADA_HORAS} hours',
          horas_trabalhadas = $1,
          status_jornada = 'encerrada',
          observacoes = COALESCE($2, observacoes),
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [horasTrabalhadas.toFixed(2), observacoes || null, id]);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('[JORNADA API] Erro ao encerrar jornada:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Motoristas em interjornada (descanso obrigatório)
router.get('/interjornada', async (req: Request, res: Response) => {
  try {
    const agora = new Date();
    
    // Buscar jornadas encerradas onde interjornada_fim ainda não passou
    // ou buscar jornadas encerradas nas últimas 24h sem interjornada_fim calculado
    const result = await pool.query(`
      SELECT 
        id, motorista_id, motorista_nome, placa_cavalo, 
        placa_carreta_1, rota_nome, base_nome,
        fim_jornada, interjornada_fim,
        horas_trabalhadas
      FROM jornada_motorista
      WHERE status_jornada = 'encerrada'
        AND fim_jornada IS NOT NULL
        AND (
          -- Jornadas com interjornada_fim ainda no futuro
          (interjornada_fim IS NOT NULL AND interjornada_fim > NOW())
          OR
          -- Jornadas sem interjornada_fim mas encerradas nas últimas 11h
          (interjornada_fim IS NULL AND fim_jornada > NOW() - INTERVAL '${INTERJORNADA_HORAS} hours')
        )
      ORDER BY fim_jornada DESC
    `);
    
    const motoristas = result.rows.map(j => {
      const fimJornada = new Date(j.fim_jornada);
      // Se não tem interjornada_fim, calcular (fim + 11h)
      const interjornadaFim = j.interjornada_fim 
        ? new Date(j.interjornada_fim) 
        : new Date(fimJornada.getTime() + INTERJORNADA_HORAS * 60 * 60 * 1000);
      
      const tempoDescansado = (agora.getTime() - fimJornada.getTime()) / (1000 * 60 * 60);
      const tempoRestante = (interjornadaFim.getTime() - agora.getTime()) / (1000 * 60 * 60);
      
      let status = 'liberado';
      if (tempoRestante > 2) status = 'em_descanso';
      else if (tempoRestante > 0) status = 'proximo_liberacao';
      
      return {
        ...j,
        interjornada_fim: interjornadaFim.toISOString(),
        tempo_descansado_horas: Math.max(0, tempoDescansado).toFixed(2),
        tempo_restante_horas: Math.max(0, tempoRestante).toFixed(2),
        status_interjornada: status
      };
    });
    
    // Separar em descanso e liberados
    const emDescanso = motoristas.filter(m => m.status_interjornada !== 'liberado');
    const liberados = motoristas.filter(m => m.status_interjornada === 'liberado');
    
    res.json({ 
      success: true, 
      data: {
        em_descanso: emDescanso.length,
        liberados: liberados.length,
        motoristas: motoristas
      }
    });
  } catch (error: any) {
    console.error('[JORNADA API] Erro ao buscar interjornada:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Verificar se motorista pode iniciar nova jornada (verifica interjornada)
router.get('/pode-iniciar/:motoristaNome', async (req: Request, res: Response) => {
  try {
    const { motoristaNome } = req.params;
    
    // Verificar se tem jornada ativa
    const jornadaAtiva = await pool.query(`
      SELECT id FROM jornada_motorista
      WHERE motorista_nome = $1 AND fim_jornada IS NULL
    `, [motoristaNome]);
    
    if (jornadaAtiva.rows.length > 0) {
      return res.json({ 
        success: true, 
        pode_iniciar: false, 
        motivo: 'Motorista já possui jornada em andamento'
      });
    }
    
    // Verificar interjornada (última jornada encerrada)
    const ultimaJornada = await pool.query(`
      SELECT fim_jornada, interjornada_fim
      FROM jornada_motorista
      WHERE motorista_nome = $1 AND status_jornada = 'encerrada'
      ORDER BY fim_jornada DESC
      LIMIT 1
    `, [motoristaNome]);
    
    if (ultimaJornada.rows.length > 0) {
      const fimJornada = new Date(ultimaJornada.rows[0].fim_jornada);
      const interjornadaFim = ultimaJornada.rows[0].interjornada_fim 
        ? new Date(ultimaJornada.rows[0].interjornada_fim)
        : new Date(fimJornada.getTime() + INTERJORNADA_HORAS * 60 * 60 * 1000);
      
      const agora = new Date();
      
      if (agora < interjornadaFim) {
        const tempoRestante = (interjornadaFim.getTime() - agora.getTime()) / (1000 * 60 * 60);
        const horasRestantes = Math.floor(tempoRestante);
        const minutosRestantes = Math.round((tempoRestante - horasRestantes) * 60);
        
        return res.json({ 
          success: true, 
          pode_iniciar: false, 
          motivo: `Motorista em descanso obrigatório (interjornada de 11h). Faltam ${horasRestantes}h ${minutosRestantes}min`,
          interjornada_fim: interjornadaFim.toISOString(),
          tempo_restante_horas: tempoRestante.toFixed(2)
        });
      }
    }
    
    res.json({ success: true, pode_iniciar: true });
  } catch (error: any) {
    console.error('[JORNADA API] Erro ao verificar interjornada:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Buscar uma jornada específica
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT * FROM jornada_motorista WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Jornada não encontrada' });
    }
    
    const jornada = result.rows[0];
    if (!jornada.fim_jornada) {
      jornada.horas_trabalhadas = calcularHorasTrabalhadas(new Date(jornada.inicio_jornada), null).toFixed(2);
      jornada.status_jornada = determinarStatus(parseFloat(jornada.horas_trabalhadas), null);
    }
    
    res.json({ success: true, data: jornada });
  } catch (error: any) {
    console.error('[JORNADA API] Erro ao buscar jornada:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
