import { Router, Request, Response } from 'express';
import { getSupabaseAdmin } from '../services/supabaseAdmin';
import { isAuthenticated } from '../middleware/auth';
import { pool } from '../db';

const router = Router();
const supabase = getSupabaseAdmin();

// Função para obter data atual no timezone do Brasil
function getTodayBrasil(): string {
  const now = new Date();
  const brasiliaTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  return brasiliaTime.toISOString().split('T')[0];
}

// Roles administrativas que podem ver todas as bases
const ADMIN_ROLES = ['admin', 'ceo', 'gerente_geral', 'gestor_frota'];

// Função para verificar se usuário tem acesso à base
function userHasAccessToBase(user: any, baseId: number): boolean {
  if (!user) return false;
  if (ADMIN_ROLES.includes(user.role)) return true;
  if (user.base_id && Number(user.base_id) === Number(baseId)) return true;
  return false;
}

// Função para verificar se usuário é admin
function isAdminUser(user: any): boolean {
  if (!user) return false;
  return ADMIN_ROLES.includes(user.role);
}

// ========== FLEET STATUS DAILY - CRUD ==========

// GET - Listar status diário de veículos por base (com validação de acesso)
router.get('/api/fleet-status/daily', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { base_id, data, status } = req.query;
    
    // Usuários de base só podem ver sua própria base
    const targetBaseId = base_id ? Number(base_id) : (user?.base_id ? Number(user.base_id) : null);
    
    if (!isAdminUser(user) && targetBaseId && !userHasAccessToBase(user, targetBaseId)) {
      return res.status(403).json({ success: false, error: 'Acesso negado a esta base' });
    }
    
    let query = supabase
      .from('fleet_status_daily')
      .select('*')
      .order('data_atualizacao', { ascending: false });
    
    // Se não é admin, forçar filtro pela base do usuário
    if (!isAdminUser(user) && user?.base_id) {
      query = query.eq('base_id', user.base_id);
    } else if (targetBaseId) {
      query = query.eq('base_id', targetBaseId);
    }
    
    if (data) {
      query = query.eq('data_atualizacao', data);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: records, error } = await query;
    
    if (error) {
      console.error('[FLEET-STATUS] Erro ao buscar status diário:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    res.json({ success: true, data: records });
  } catch (error: any) {
    console.error('[FLEET-STATUS] Erro:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Buscar veículos de uma base com status do dia atual (com validação de acesso)
router.get('/api/fleet-status/base/:baseId/vehicles', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { baseId } = req.params;
    const today = getTodayBrasil();
    
    // Validar acesso à base
    if (!userHasAccessToBase(user, Number(baseId))) {
      return res.status(403).json({ success: false, error: 'Você não tem acesso a esta base' });
    }
    
    // Buscar veículos da base
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, plate, model, make, vehicle_type, status, base_id')
      .eq('base_id', baseId)
      .order('plate');
    
    if (vehiclesError) {
      console.error('[FLEET-STATUS] Erro ao buscar veículos:', vehiclesError);
      return res.status(500).json({ success: false, error: vehiclesError.message });
    }
    
    // Buscar status do dia para esses veículos
    const vehicleIds = vehicles?.map(v => v.id) || [];
    
    const { data: statusData, error: statusError } = await supabase
      .from('fleet_status_daily')
      .select('*')
      .in('vehicle_id', vehicleIds)
      .eq('data_atualizacao', today);
    
    if (statusError) {
      console.error('[FLEET-STATUS] Erro ao buscar status:', statusError);
    }
    
    // Combinar veículos com status
    const vehiclesWithStatus = vehicles?.map(vehicle => {
      const statusRecord = statusData?.find(s => s.vehicle_id === vehicle.id);
      return {
        ...vehicle,
        statusDiario: statusRecord || null,
        atualizado: !!statusRecord
      };
    }) || [];
    
    const totalVeiculos = vehiclesWithStatus.length;
    const atualizados = vehiclesWithStatus.filter(v => v.atualizado).length;
    const pendentes = totalVeiculos - atualizados;
    const percentual = totalVeiculos > 0 ? ((atualizados / totalVeiculos) * 100).toFixed(2) : 0;
    
    res.json({ 
      success: true, 
      data: vehiclesWithStatus,
      resumo: {
        total: totalVeiculos,
        atualizados,
        pendentes,
        percentualAtualizado: percentual
      }
    });
  } catch (error: any) {
    console.error('[FLEET-STATUS] Erro:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Rota pública para buscar veículos de uma base (usado quando autenticação é via localStorage)
// Esta rota busca os veículos diretamente pela base sem exigir sessão do servidor
router.get('/api/fleet-status/public/base/:baseId/vehicles', async (req: Request, res: Response) => {
  try {
    const { baseId } = req.params;
    const { userId } = req.query;
    const today = getTodayBrasil();
    
    console.log(`[FLEET-STATUS-PUBLIC] Buscando veículos do PostgreSQL local - BaseId: ${baseId}, UserId: ${userId}`);
    
    // Buscar veículos da base do PostgreSQL local
    const vehiclesResult = await pool.query(
      `SELECT id, plate, model, make, vehicle_type, status, base_id 
       FROM vehicles 
       WHERE base_id = $1 
       ORDER BY plate`,
      [baseId]
    );
    
    const vehicles = vehiclesResult.rows;
    
    console.log(`[FLEET-STATUS-PUBLIC] Encontrados ${vehicles.length} veículos no PostgreSQL local`);
    
    // Buscar status do dia para esses veículos (do PostgreSQL local)
    const vehicleIds = vehicles.map((v: any) => v.id);
    
    let statusData: any[] = [];
    if (vehicleIds.length > 0) {
      const statusResult = await pool.query(
        `SELECT * FROM fleet_status_daily 
         WHERE vehicle_id = ANY($1) AND data_atualizacao = $2`,
        [vehicleIds, today]
      );
      statusData = statusResult.rows;
    }
    
    // Combinar veículos com status
    const vehiclesWithStatus = vehicles.map((vehicle: any) => {
      const statusRecord = statusData.find((s: any) => s.vehicle_id === vehicle.id);
      return {
        ...vehicle,
        statusDiario: statusRecord || null,
        atualizado: !!statusRecord
      };
    });
    
    const totalVeiculos = vehiclesWithStatus.length;
    const atualizados = vehiclesWithStatus.filter((v: any) => v.atualizado).length;
    const pendentes = totalVeiculos - atualizados;
    const percentual = totalVeiculos > 0 ? ((atualizados / totalVeiculos) * 100).toFixed(2) : 0;
    
    console.log(`[FLEET-STATUS-PUBLIC] Retornando ${totalVeiculos} veículos para base ${baseId}`);
    
    res.json({ 
      success: true, 
      data: vehiclesWithStatus,
      resumo: {
        total: totalVeiculos,
        atualizados,
        pendentes,
        percentualAtualizado: percentual
      }
    });
  } catch (error: any) {
    console.error('[FLEET-STATUS-PUBLIC] Erro:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Dashboard público (permite acesso de qualquer usuário autenticado via localStorage)
router.get('/api/fleet-status/public/dashboard', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const today = getTodayBrasil();
    
    console.log('[FLEET-STATUS-PUBLIC-DASHBOARD] Buscando dados do PostgreSQL local - userId:', userId);
    
    // Buscar todas as bases com veículos do PostgreSQL local
    const basesComVeiculosResult = await pool.query(
      `SELECT DISTINCT base_id FROM vehicles WHERE base_id IS NOT NULL`
    );
    const baseIds = basesComVeiculosResult.rows.map((r: any) => r.base_id);
    
    console.log(`[FLEET-STATUS-PUBLIC-DASHBOARD] Encontradas ${baseIds.length} bases com veículos`);
    
    if (baseIds.length === 0) {
      return res.json({ 
        success: true, 
        data: {
          dataReferencia: today,
          totais: { totalVeiculos: 0, atualizados: 0, pendentes: 0, percentualAtualizado: 0, totalBases: 0, basesInadimplentes: 0 },
          resumoPorBase: [],
          basesInadimplentes: []
        }
      });
    }
    
    // Buscar detalhes das bases
    const basesResult = await pool.query(
      `SELECT id, name, basename FROM bases WHERE id = ANY($1)`,
      [baseIds]
    );
    const bases = basesResult.rows;
    
    // Contar veículos por base
    const veiculosPorBaseResult = await pool.query(
      `SELECT base_id, COUNT(*) as total FROM vehicles WHERE base_id = ANY($1) GROUP BY base_id`,
      [baseIds]
    );
    const veiculosPorBase = veiculosPorBaseResult.rows;
    
    // Buscar atualizações de hoje
    const atualizacoesResult = await pool.query(
      `SELECT base_id, status FROM fleet_status_daily WHERE data_atualizacao = $1`,
      [today]
    );
    const atualizacoesHoje = atualizacoesResult.rows;
    
    // Montar resumo por base
    const resumoPorBase = bases.map((base: any) => {
      const veiculosBase = veiculosPorBase.find((v: any) => v.base_id === base.id);
      const totalVeiculos = veiculosBase ? parseInt(veiculosBase.total) : 0;
      const atualizados = atualizacoesHoje.filter((a: any) => a.base_id === base.id).length;
      const pendentes = totalVeiculos - atualizados;
      const percentual = totalVeiculos > 0 ? ((atualizados / totalVeiculos) * 100) : 0;
      
      // Contar por status
      const statusCount = atualizacoesHoje
        .filter((a: any) => a.base_id === base.id)
        .reduce((acc: any, curr: any) => {
          acc[curr.status] = (acc[curr.status] || 0) + 1;
          return acc;
        }, {});
      
      return {
        baseId: base.id,
        baseName: base.name || base.basename,
        totalVeiculos,
        atualizados,
        pendentes,
        percentualAtualizado: percentual.toFixed(2),
        statusCount,
        inadimplente: pendentes > 0
      };
    });
    
    // Totais gerais
    const totalGeral = resumoPorBase.reduce((acc: any, base: any) => ({
      totalVeiculos: acc.totalVeiculos + base.totalVeiculos,
      atualizados: acc.atualizados + base.atualizados,
      pendentes: acc.pendentes + base.pendentes
    }), { totalVeiculos: 0, atualizados: 0, pendentes: 0 });
    
    const percentualGeral = totalGeral.totalVeiculos > 0 
      ? ((totalGeral.atualizados / totalGeral.totalVeiculos) * 100).toFixed(2)
      : 0;
    
    // Bases inadimplentes (com pendências)
    const basesInadimplentes = resumoPorBase.filter((b: any) => b.inadimplente);
    
    console.log(`[FLEET-STATUS-PUBLIC-DASHBOARD] Total: ${totalGeral.totalVeiculos} veículos, ${resumoPorBase.length} bases`);
    
    res.json({ 
      success: true, 
      data: {
        dataReferencia: today,
        totais: {
          ...totalGeral,
          percentualAtualizado: percentualGeral,
          totalBases: resumoPorBase.length,
          basesInadimplentes: basesInadimplentes.length
        },
        resumoPorBase: resumoPorBase.sort((a: any, b: any) => Number(a.percentualAtualizado) - Number(b.percentualAtualizado)),
        basesInadimplentes
      }
    });
  } catch (error: any) {
    console.error('[FLEET-STATUS-PUBLIC-DASHBOARD] Erro:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Atualização pública de status (validação via userId no body)
router.post('/api/fleet-status/public/daily', async (req: Request, res: Response) => {
  try {
    const { 
      userId,
      vehicle_id, 
      vehicle_plate, 
      base_id, 
      base_name, 
      status, 
      motivo,
      local_manutencao,
      prazo_manutencao,
      base_emprestada_id,
      base_emprestada_nome,
      data_devolucao
    } = req.body;
    
    console.log('[FLEET-STATUS-PUBLIC-DAILY] Requisição recebida:', { userId, vehicle_id, base_id, status });
    
    // Validar campos obrigatórios
    if (!vehicle_id || !base_id || !status) {
      return res.status(400).json({ success: false, error: 'Campos obrigatórios: vehicle_id, base_id, status' });
    }
    
    // Validar usuário via userId
    let user: any = null;
    if (userId) {
      const userResult = await pool.query(
        `SELECT id, name, role, base_id FROM users WHERE id = $1`,
        [Number(userId)]
      );
      if (userResult.rows.length > 0) {
        user = userResult.rows[0];
      }
    }
    
    if (!user) {
      console.log('[FLEET-STATUS-PUBLIC-DAILY] Usuário não encontrado:', userId);
      return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
    }
    
    // Validar acesso à base
    if (!userHasAccessToBase(user, Number(base_id))) {
      return res.status(403).json({ success: false, error: 'Você não tem acesso a esta base' });
    }
    
    // Verificar se o veículo pertence à base (usando PostgreSQL local)
    const vehicleResult = await pool.query(
      `SELECT id, plate, base_id FROM vehicles WHERE id = $1`,
      [vehicle_id]
    );
    
    if (vehicleResult.rows.length === 0) {
      console.log(`[FLEET-STATUS-PUBLIC-DAILY] Veículo não encontrado no PostgreSQL local: ${vehicle_id}`);
      return res.status(404).json({ success: false, error: 'Veículo não encontrado' });
    }
    
    const vehicleCheck = vehicleResult.rows[0];
    
    if (Number(vehicleCheck.base_id) !== Number(base_id)) {
      return res.status(403).json({ success: false, error: 'Este veículo não pertence a esta base' });
    }
    
    const today = getTodayBrasil();
    
    // Verificar se já existe registro para este veículo hoje (PostgreSQL local)
    const existingResult = await pool.query(
      `SELECT id, status FROM fleet_status_daily WHERE vehicle_id = $1 AND data_atualizacao = $2`,
      [vehicle_id, today]
    );
    
    const existing = existingResult.rows[0] || null;
    const statusAnterior = existing?.status || null;
    
    let result;
    
    if (existing) {
      // Atualizar registro existente
      const updateResult = await pool.query(
        `UPDATE fleet_status_daily SET
          vehicle_plate = $1,
          base_id = $2,
          base_name = $3,
          status = $4,
          motivo = $5,
          local_manutencao = $6,
          prazo_manutencao = $7,
          base_emprestada_id = $8,
          base_emprestada_nome = $9,
          data_devolucao = $10,
          updated_by = $11,
          updated_by_name = $12,
          updated_at = NOW()
        WHERE id = $13
        RETURNING *`,
        [
          vehicle_plate || vehicleCheck.plate,
          base_id,
          base_name,
          status,
          motivo || null,
          local_manutencao || null,
          prazo_manutencao || null,
          base_emprestada_id || null,
          base_emprestada_nome || null,
          data_devolucao || null,
          user?.id || 1,
          user?.name || 'Sistema',
          existing.id
        ]
      );
      result = updateResult.rows[0];
    } else {
      // Inserir novo registro
      const insertResult = await pool.query(
        `INSERT INTO fleet_status_daily (
          vehicle_id, vehicle_plate, base_id, base_name, data_atualizacao,
          status, motivo, local_manutencao, prazo_manutencao,
          base_emprestada_id, base_emprestada_nome, data_devolucao,
          updated_by, updated_by_name, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        RETURNING *`,
        [
          vehicle_id,
          vehicle_plate || vehicleCheck.plate,
          base_id,
          base_name,
          today,
          status,
          motivo || null,
          local_manutencao || null,
          prazo_manutencao || null,
          base_emprestada_id || null,
          base_emprestada_nome || null,
          data_devolucao || null,
          user?.id || 1,
          user?.name || 'Sistema'
        ]
      );
      result = insertResult.rows[0];
    }
    
    // Registrar histórico se houve mudança de status (PostgreSQL local)
    if (statusAnterior !== status) {
      await pool.query(
        `INSERT INTO fleet_status_history (
          vehicle_id, vehicle_plate, base_id, base_name,
          status_anterior, status_novo, observacao,
          local_manutencao, prazo_manutencao,
          base_emprestada_id, base_emprestada_nome, data_devolucao,
          updated_by, updated_by_name, data_alteracao
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())`,
        [
          vehicle_id,
          vehicle_plate,
          base_id,
          base_name,
          statusAnterior,
          status,
          motivo || null,
          local_manutencao || null,
          prazo_manutencao || null,
          base_emprestada_id || null,
          base_emprestada_nome || null,
          data_devolucao || null,
          user?.id || 1,
          user?.name || 'Sistema'
        ]
      );
    }
    
    console.log(`[FLEET-STATUS-PUBLIC-DAILY] Status atualizado: ${vehicle_plate} -> ${status}`);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[FLEET-STATUS-PUBLIC-DAILY] Erro:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Criar/Atualizar status diário de um veículo (com validação de acesso)
router.post('/api/fleet-status/daily', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { 
      vehicle_id, 
      vehicle_plate, 
      base_id, 
      base_name, 
      status, 
      motivo,
      local_manutencao,
      prazo_manutencao,
      base_emprestada_id,
      base_emprestada_nome,
      data_devolucao
    } = req.body;
    
    // Validar campos obrigatórios
    if (!vehicle_id || !base_id || !status) {
      return res.status(400).json({ success: false, error: 'Campos obrigatórios: vehicle_id, base_id, status' });
    }
    
    // Validar acesso à base
    if (!userHasAccessToBase(user, Number(base_id))) {
      return res.status(403).json({ success: false, error: 'Você não tem acesso a esta base' });
    }
    
    // Verificar se o veículo pertence à base (usando PostgreSQL local)
    const vehicleResult = await pool.query(
      `SELECT id, plate, base_id FROM vehicles WHERE id = $1`,
      [vehicle_id]
    );
    
    if (vehicleResult.rows.length === 0) {
      console.log(`[FLEET-STATUS] Veículo não encontrado no PostgreSQL local: ${vehicle_id}`);
      return res.status(404).json({ success: false, error: 'Veículo não encontrado' });
    }
    
    const vehicleCheck = vehicleResult.rows[0];
    
    if (Number(vehicleCheck.base_id) !== Number(base_id)) {
      return res.status(403).json({ success: false, error: 'Este veículo não pertence a esta base' });
    }
    
    const today = getTodayBrasil();
    
    // Verificar se já existe registro para este veículo hoje (PostgreSQL local)
    const existingResult = await pool.query(
      `SELECT id, status FROM fleet_status_daily WHERE vehicle_id = $1 AND data_atualizacao = $2`,
      [vehicle_id, today]
    );
    
    const existing = existingResult.rows[0] || null;
    const statusAnterior = existing?.status || null;
    
    let result;
    
    if (existing) {
      // Atualizar registro existente
      const updateResult = await pool.query(
        `UPDATE fleet_status_daily SET
          vehicle_plate = $1,
          base_id = $2,
          base_name = $3,
          status = $4,
          motivo = $5,
          local_manutencao = $6,
          prazo_manutencao = $7,
          base_emprestada_id = $8,
          base_emprestada_nome = $9,
          data_devolucao = $10,
          updated_by = $11,
          updated_by_name = $12,
          updated_at = NOW()
        WHERE id = $13
        RETURNING *`,
        [
          vehicle_plate || vehicleCheck.plate,
          base_id,
          base_name,
          status,
          motivo || null,
          local_manutencao || null,
          prazo_manutencao || null,
          base_emprestada_id || null,
          base_emprestada_nome || null,
          data_devolucao || null,
          user?.id || 1,
          user?.name || 'Sistema',
          existing.id
        ]
      );
      result = updateResult.rows[0];
    } else {
      // Inserir novo registro
      const insertResult = await pool.query(
        `INSERT INTO fleet_status_daily (
          vehicle_id, vehicle_plate, base_id, base_name, data_atualizacao,
          status, motivo, local_manutencao, prazo_manutencao,
          base_emprestada_id, base_emprestada_nome, data_devolucao,
          updated_by, updated_by_name, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        RETURNING *`,
        [
          vehicle_id,
          vehicle_plate || vehicleCheck.plate,
          base_id,
          base_name,
          today,
          status,
          motivo || null,
          local_manutencao || null,
          prazo_manutencao || null,
          base_emprestada_id || null,
          base_emprestada_nome || null,
          data_devolucao || null,
          user?.id || 1,
          user?.name || 'Sistema'
        ]
      );
      result = insertResult.rows[0];
    }
    
    // Registrar histórico se houve mudança de status (PostgreSQL local)
    if (statusAnterior !== status) {
      await pool.query(
        `INSERT INTO fleet_status_history (
          vehicle_id, vehicle_plate, base_id, base_name,
          status_anterior, status_novo, observacao,
          local_manutencao, prazo_manutencao,
          base_emprestada_id, base_emprestada_nome, data_devolucao,
          updated_by, updated_by_name, data_alteracao
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())`,
        [
          vehicle_id,
          vehicle_plate,
          base_id,
          base_name,
          statusAnterior,
          status,
          motivo || null,
          local_manutencao || null,
          prazo_manutencao || null,
          base_emprestada_id || null,
          base_emprestada_nome || null,
          data_devolucao || null,
          user?.id || 1,
          user?.name || 'Sistema'
        ]
      );
    }
    
    // Atualizar alertas da base
    await atualizarAlertaBase(base_id, base_name);
    
    console.log(`[FLEET-STATUS] Status atualizado: ${vehicle_plate} -> ${status}`);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[FLEET-STATUS] Erro:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Atualização em lote de status (com validação de acesso)
router.post('/api/fleet-status/daily/bulk', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { updates } = req.body;
    const user = req.user as any;
    const today = getTodayBrasil();
    
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ success: false, error: 'Lista de atualizações obrigatória' });
    }
    
    // Verificar acesso a todas as bases envolvidas
    const baseIds = Array.from(new Set(updates.map((u: any) => Number(u.base_id))));
    for (const baseId of baseIds) {
      if (!userHasAccessToBase(user, baseId)) {
        return res.status(403).json({ success: false, error: `Você não tem acesso à base ${baseId}` });
      }
    }
    
    // Verificar se todos os veículos pertencem às bases corretas
    const vehicleIds = updates.map((u: any) => u.vehicle_id);
    const { data: vehiclesCheck, error: vehiclesCheckError } = await supabase
      .from('vehicles')
      .select('id, base_id')
      .in('id', vehicleIds);
    
    if (vehiclesCheckError) {
      return res.status(500).json({ success: false, error: 'Erro ao verificar veículos' });
    }
    
    const vehicleBaseMap = new Map(vehiclesCheck?.map(v => [v.id, v.base_id]) || []);
    for (const update of updates) {
      const vehicleBaseId = vehicleBaseMap.get(update.vehicle_id);
      if (!vehicleBaseId || Number(vehicleBaseId) !== Number(update.base_id)) {
        return res.status(403).json({ 
          success: false, 
          error: `Veículo ${update.vehicle_id} não pertence à base informada` 
        });
      }
    }
    
    const results = [];
    const errors = [];
    
    for (const update of updates) {
      try {
        const { data: existing } = await supabase
          .from('fleet_status_daily')
          .select('id, status')
          .eq('vehicle_id', update.vehicle_id)
          .eq('data_atualizacao', today)
          .single();
        
        const recordData = {
          ...update,
          data_atualizacao: today,
          updated_by: user?.id || 1,
          updated_by_name: user?.name || 'Sistema',
          updated_at: new Date().toISOString()
        };
        
        if (existing) {
          const { data, error } = await supabase
            .from('fleet_status_daily')
            .update(recordData)
            .eq('id', existing.id)
            .select()
            .single();
          
          if (error) throw error;
          results.push(data);
          
          if (existing.status !== update.status) {
            await supabase.from('fleet_status_history').insert({
              vehicle_id: update.vehicle_id,
              vehicle_plate: update.vehicle_plate,
              base_id: update.base_id,
              base_name: update.base_name,
              status_anterior: existing.status,
              status_novo: update.status,
              observacao: update.motivo,
              updated_by: user?.id || 1,
              updated_by_name: user?.name || 'Sistema'
            });
          }
        } else {
          const { data, error } = await supabase
            .from('fleet_status_daily')
            .insert(recordData)
            .select()
            .single();
          
          if (error) throw error;
          results.push(data);
          
          await supabase.from('fleet_status_history').insert({
            vehicle_id: update.vehicle_id,
            vehicle_plate: update.vehicle_plate,
            base_id: update.base_id,
            base_name: update.base_name,
            status_anterior: null,
            status_novo: update.status,
            observacao: update.motivo,
            updated_by: user?.id || 1,
            updated_by_name: user?.name || 'Sistema'
          });
        }
      } catch (err: any) {
        errors.push({ vehicle_id: update.vehicle_id, error: err.message });
      }
    }
    
    // Atualizar alertas para bases afetadas
    const affectedBaseIds = Array.from(new Set(updates.map((u: any) => u.base_id))) as number[];
    for (const baseIdToUpdate of affectedBaseIds) {
      const baseUpdate = updates.find((u: any) => u.base_id === baseIdToUpdate);
      await atualizarAlertaBase(baseIdToUpdate, baseUpdate?.base_name || '');
    }
    
    res.json({ 
      success: true, 
      data: results, 
      errors: errors.length > 0 ? errors : null,
      message: `${results.length} atualizações realizadas, ${errors.length} erros`
    });
  } catch (error: any) {
    console.error('[FLEET-STATUS] Erro bulk:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== FLEET STATUS HISTORY ==========

// GET - Histórico de alterações (com validação de acesso)
router.get('/api/fleet-status/history', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { base_id, vehicle_id, data_inicio, data_fim, limit = 100 } = req.query;
    
    let query = supabase
      .from('fleet_status_history')
      .select('*')
      .order('data_alteracao', { ascending: false })
      .limit(Number(limit));
    
    // Usuários de base só podem ver histórico de sua própria base
    if (!isAdminUser(user) && user?.base_id) {
      query = query.eq('base_id', user.base_id);
    } else if (base_id) {
      // Admin pode filtrar por base específica
      if (!isAdminUser(user) && !userHasAccessToBase(user, Number(base_id))) {
        return res.status(403).json({ success: false, error: 'Acesso negado a esta base' });
      }
      query = query.eq('base_id', base_id);
    }
    
    if (vehicle_id) {
      query = query.eq('vehicle_id', vehicle_id);
    }
    
    if (data_inicio) {
      query = query.gte('data_alteracao', data_inicio);
    }
    
    if (data_fim) {
      query = query.lte('data_alteracao', data_fim);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[FLEET-STATUS] Erro histórico:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('[FLEET-STATUS] Erro:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== FLEET UPDATE ALERTS ==========

// GET - Alertas de bases inadimplentes (apenas admins)
router.get('/api/fleet-status/alerts', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    
    // Apenas administradores podem ver alertas de todas as bases
    if (!isAdminUser(user)) {
      return res.status(403).json({ success: false, error: 'Apenas administradores podem acessar esta função' });
    }
    
    const { data: targetDateParam } = req.query;
    const targetDate = (targetDateParam as string) || getTodayBrasil();
    
    const { data, error } = await supabase
      .from('fleet_update_alerts')
      .select('*')
      .eq('data_referencia', targetDate)
      .order('percentual_atualizado', { ascending: true });
    
    if (error) {
      console.error('[FLEET-STATUS] Erro alertas:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('[FLEET-STATUS] Erro:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Dashboard com métricas gerais (apenas admins)
router.get('/api/fleet-status/dashboard', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    
    // Apenas administradores podem ver o dashboard geral
    if (!isAdminUser(user)) {
      return res.status(403).json({ success: false, error: 'Apenas administradores podem acessar o dashboard' });
    }
    
    const today = getTodayBrasil();
    
    console.log('[FLEET-STATUS-DASHBOARD] Buscando dados do PostgreSQL local');
    
    // Buscar todas as bases com veículos do PostgreSQL local
    const basesComVeiculosResult = await pool.query(
      `SELECT DISTINCT base_id FROM vehicles WHERE base_id IS NOT NULL`
    );
    const baseIds = basesComVeiculosResult.rows.map((r: any) => r.base_id);
    
    console.log(`[FLEET-STATUS-DASHBOARD] Encontradas ${baseIds.length} bases com veículos`);
    
    if (baseIds.length === 0) {
      return res.json({ 
        success: true, 
        data: {
          dataReferencia: today,
          totais: { totalVeiculos: 0, atualizados: 0, pendentes: 0, percentualAtualizado: 0, totalBases: 0, basesInadimplentes: 0 },
          resumoPorBase: [],
          basesInadimplentes: []
        }
      });
    }
    
    // Buscar detalhes das bases
    const basesResult = await pool.query(
      `SELECT id, name, basename FROM bases WHERE id = ANY($1)`,
      [baseIds]
    );
    const bases = basesResult.rows;
    
    // Contar veículos por base
    const veiculosPorBaseResult = await pool.query(
      `SELECT base_id, COUNT(*) as total FROM vehicles WHERE base_id = ANY($1) GROUP BY base_id`,
      [baseIds]
    );
    const veiculosPorBase = veiculosPorBaseResult.rows;
    
    // Buscar atualizações de hoje
    const atualizacoesResult = await pool.query(
      `SELECT base_id, status FROM fleet_status_daily WHERE data_atualizacao = $1`,
      [today]
    );
    const atualizacoesHoje = atualizacoesResult.rows;
    
    // Montar resumo por base
    const resumoPorBase = bases.map((base: any) => {
      const veiculosBase = veiculosPorBase.find((v: any) => v.base_id === base.id);
      const totalVeiculos = veiculosBase ? parseInt(veiculosBase.total) : 0;
      const atualizados = atualizacoesHoje.filter((a: any) => a.base_id === base.id).length;
      const pendentes = totalVeiculos - atualizados;
      const percentual = totalVeiculos > 0 ? ((atualizados / totalVeiculos) * 100) : 0;
      
      // Contar por status
      const statusCount = atualizacoesHoje
        .filter((a: any) => a.base_id === base.id)
        .reduce((acc: any, curr: any) => {
          acc[curr.status] = (acc[curr.status] || 0) + 1;
          return acc;
        }, {});
      
      return {
        baseId: base.id,
        baseName: base.name || base.basename,
        totalVeiculos,
        atualizados,
        pendentes,
        percentualAtualizado: percentual.toFixed(2),
        statusCount,
        inadimplente: pendentes > 0
      };
    });
    
    // Totais gerais
    const totalGeral = resumoPorBase.reduce((acc: any, base: any) => ({
      totalVeiculos: acc.totalVeiculos + base.totalVeiculos,
      atualizados: acc.atualizados + base.atualizados,
      pendentes: acc.pendentes + base.pendentes
    }), { totalVeiculos: 0, atualizados: 0, pendentes: 0 });
    
    const percentualGeral = totalGeral.totalVeiculos > 0 
      ? ((totalGeral.atualizados / totalGeral.totalVeiculos) * 100).toFixed(2)
      : 0;
    
    // Bases inadimplentes (com pendências)
    const basesInadimplentes = resumoPorBase.filter((b: any) => b.inadimplente);
    
    console.log(`[FLEET-STATUS-DASHBOARD] Total: ${totalGeral.totalVeiculos} veículos, ${resumoPorBase.length} bases`);
    
    res.json({ 
      success: true, 
      data: {
        dataReferencia: today,
        totais: {
          ...totalGeral,
          percentualAtualizado: percentualGeral,
          totalBases: resumoPorBase.length,
          basesInadimplentes: basesInadimplentes.length
        },
        resumoPorBase: resumoPorBase.sort((a: any, b: any) => Number(a.percentualAtualizado) - Number(b.percentualAtualizado)),
        basesInadimplentes
      }
    });
  } catch (error: any) {
    console.error('[FLEET-STATUS] Erro dashboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== FUNÇÕES AUXILIARES ==========

async function atualizarAlertaBase(baseId: number, baseName: string) {
  try {
    const today = getTodayBrasil();
    
    // Contar veículos da base
    const { count: totalVeiculos } = await supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('base_id', baseId);
    
    // Contar atualizações de hoje
    const { count: atualizados } = await supabase
      .from('fleet_status_daily')
      .select('id', { count: 'exact', head: true })
      .eq('base_id', baseId)
      .eq('data_atualizacao', today);
    
    const pendentes = (totalVeiculos || 0) - (atualizados || 0);
    const percentual = totalVeiculos && totalVeiculos > 0 
      ? ((atualizados || 0) / totalVeiculos * 100).toFixed(2) 
      : '0';
    
    let status = 'pendente';
    if (pendentes === 0) {
      status = 'completo';
    } else if ((atualizados || 0) > 0) {
      status = 'parcial';
    }
    
    // Verificar se já existe alerta para hoje
    const { data: existing } = await supabase
      .from('fleet_update_alerts')
      .select('id')
      .eq('base_id', baseId)
      .eq('data_referencia', today)
      .single();
    
    const alertData = {
      base_id: baseId,
      base_name: baseName,
      data_referencia: today,
      total_veiculos: totalVeiculos || 0,
      veiculos_atualizados: atualizados || 0,
      veiculos_pendentes: pendentes,
      percentual_atualizado: percentual,
      status,
      updated_at: new Date().toISOString()
    };
    
    if (existing) {
      await supabase
        .from('fleet_update_alerts')
        .update(alertData)
        .eq('id', existing.id);
    } else {
      await supabase
        .from('fleet_update_alerts')
        .insert(alertData);
    }
  } catch (error) {
    console.error('[FLEET-STATUS] Erro ao atualizar alerta:', error);
  }
}

export default router;
