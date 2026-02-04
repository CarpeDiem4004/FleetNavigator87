import { Router, Request, Response } from 'express';
import { getSupabaseAdmin } from '../services/supabaseAdmin';
import { isAuthenticated } from '../middleware/auth';

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
    
    // Verificar se o veículo pertence à base
    const { data: vehicleCheck, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, plate, base_id')
      .eq('id', vehicle_id)
      .single();
    
    if (vehicleError || !vehicleCheck) {
      return res.status(404).json({ success: false, error: 'Veículo não encontrado' });
    }
    
    if (Number(vehicleCheck.base_id) !== Number(base_id)) {
      return res.status(403).json({ success: false, error: 'Este veículo não pertence a esta base' });
    }
    
    const today = getTodayBrasil();
    
    // Verificar se já existe registro para este veículo hoje
    const { data: existing, error: checkError } = await supabase
      .from('fleet_status_daily')
      .select('id, status')
      .eq('vehicle_id', vehicle_id)
      .eq('data_atualizacao', today)
      .single();
    
    const statusAnterior = existing?.status || null;
    
    const recordData = {
      vehicle_id,
      vehicle_plate: vehicle_plate || vehicleCheck.plate,
      base_id,
      base_name,
      data_atualizacao: today,
      status,
      motivo,
      local_manutencao,
      prazo_manutencao,
      base_emprestada_id,
      base_emprestada_nome,
      data_devolucao,
      updated_by: user?.id || 1,
      updated_by_name: user?.name || 'Sistema',
      updated_at: new Date().toISOString()
    };
    
    let result;
    
    if (existing) {
      // Atualizar registro existente
      const { data, error } = await supabase
        .from('fleet_status_daily')
        .update(recordData)
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) {
        console.error('[FLEET-STATUS] Erro ao atualizar:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
      result = data;
    } else {
      // Inserir novo registro
      const { data, error } = await supabase
        .from('fleet_status_daily')
        .insert(recordData)
        .select()
        .single();
      
      if (error) {
        console.error('[FLEET-STATUS] Erro ao inserir:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
      result = data;
    }
    
    // Registrar histórico se houve mudança de status
    if (statusAnterior !== status) {
      await supabase.from('fleet_status_history').insert({
        vehicle_id,
        vehicle_plate,
        base_id,
        base_name,
        status_anterior: statusAnterior,
        status_novo: status,
        observacao: motivo,
        local_manutencao,
        prazo_manutencao,
        base_emprestada_id,
        base_emprestada_nome,
        data_devolucao,
        updated_by: user?.id || 1,
        updated_by_name: user?.name || 'Sistema',
        data_alteracao: new Date().toISOString()
      });
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
    
    // Buscar todas as bases com veículos
    const { data: basesComVeiculos, error: basesError } = await supabase
      .from('vehicles')
      .select('base_id')
      .not('base_id', 'is', null);
    
    if (basesError) {
      console.error('[FLEET-STATUS] Erro bases:', basesError);
      return res.status(500).json({ success: false, error: basesError.message });
    }
    
    const baseIds = Array.from(new Set(basesComVeiculos?.map((v: any) => v.base_id) || [])) as number[];
    
    // Buscar detalhes das bases
    const { data: bases, error: basesInfoError } = await supabase
      .from('bases')
      .select('id, name, basename')
      .in('id', baseIds);
    
    // Contar veículos por base
    const { data: veiculosPorBase, error: countError } = await supabase
      .from('vehicles')
      .select('base_id')
      .in('base_id', baseIds);
    
    // Buscar atualizações de hoje
    const { data: atualizacoesHoje, error: atualizacoesError } = await supabase
      .from('fleet_status_daily')
      .select('base_id, status')
      .eq('data_atualizacao', today);
    
    // Montar resumo por base
    const resumoPorBase = bases?.map(base => {
      const totalVeiculos = veiculosPorBase?.filter(v => v.base_id === base.id).length || 0;
      const atualizados = atualizacoesHoje?.filter(a => a.base_id === base.id).length || 0;
      const pendentes = totalVeiculos - atualizados;
      const percentual = totalVeiculos > 0 ? ((atualizados / totalVeiculos) * 100) : 0;
      
      // Contar por status
      const statusCount = atualizacoesHoje
        ?.filter(a => a.base_id === base.id)
        .reduce((acc: any, curr) => {
          acc[curr.status] = (acc[curr.status] || 0) + 1;
          return acc;
        }, {}) || {};
      
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
    }) || [];
    
    // Totais gerais
    const totalGeral = resumoPorBase.reduce((acc, base) => ({
      totalVeiculos: acc.totalVeiculos + base.totalVeiculos,
      atualizados: acc.atualizados + base.atualizados,
      pendentes: acc.pendentes + base.pendentes
    }), { totalVeiculos: 0, atualizados: 0, pendentes: 0 });
    
    const percentualGeral = totalGeral.totalVeiculos > 0 
      ? ((totalGeral.atualizados / totalGeral.totalVeiculos) * 100).toFixed(2)
      : 0;
    
    // Bases inadimplentes (com pendências)
    const basesInadimplentes = resumoPorBase.filter(b => b.inadimplente);
    
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
        resumoPorBase: resumoPorBase.sort((a, b) => Number(a.percentualAtualizado) - Number(b.percentualAtualizado)),
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
