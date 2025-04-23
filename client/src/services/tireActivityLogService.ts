import supabase from '@/lib/supabaseClient';
import { apiRequest } from '@/lib/queryClient';
import { User } from '@supabase/supabase-js';

export interface TireActivity {
  id?: number;
  pneu_id: number;
  usuario_id?: string;
  usuario_email?: string;
  usuario_nome?: string;
  acao: 'montagem' | 'remocao' | 'descarte' | 'manutencao' | 'cadastro' | 'atualizacao';
  detalhes?: Record<string, any>;
  data?: string;
  veiculo_placa?: string;
}

// Função para registrar atividade no Supabase
export async function logTireActivity(
  activity: TireActivity,
  supabaseUser: User | null
): Promise<boolean> {
  try {
    // Se não houver usuário autenticado, registra como anônimo
    const userIdentity = {
      usuario_id: supabaseUser?.id || 'anonimo',
      usuario_email: supabaseUser?.email || 'anonimo@sistema.local',
      usuario_nome: supabaseUser?.user_metadata?.name || supabaseUser?.email || 'Usuário Anônimo'
    };

    const logActivity = {
      ...activity,
      ...userIdentity,
      data: activity.data || new Date().toISOString()
    };

    // Registra no Supabase
    const { error } = await supabase
      .from('pneus_atividades')
      .insert(logActivity);

    if (error) {
      console.error('Erro ao registrar atividade no Supabase:', error);
      // Mesmo que falhe no Supabase, tenta registrar no banco local
      return await logTireActivityLocal(activity, userIdentity);
    }

    return true;
  } catch (error) {
    console.error('Exceção ao registrar atividade no Supabase:', error);
    return false;
  }
}

// Função para registrar atividade apenas no banco local
async function logTireActivityLocal(
  activity: TireActivity,
  userIdentity: { 
    usuario_id: string; 
    usuario_email: string; 
    usuario_nome: string; 
  }
): Promise<boolean> {
  try {
    const logActivity = {
      ...activity,
      ...userIdentity,
      data: activity.data || new Date().toISOString()
    };

    // Faz requisição para a API local
    const response = await apiRequest('POST', '/api/pneus/atividades', logActivity);
    
    if (!response.ok) {
      console.error('Erro ao registrar atividade na API local');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exceção ao registrar atividade na API local:', error);
    return false;
  }
}

// Função para obter atividades de um pneu específico
export async function getTireActivities(tireId: number): Promise<TireActivity[]> {
  try {
    // Tenta primeiro do Supabase
    const { data, error } = await supabase
      .from('pneus_atividades')
      .select('*')
      .eq('pneu_id', tireId)
      .order('data', { ascending: false });

    if (error) {
      console.error('Erro ao buscar atividades no Supabase:', error);
      // Se falhar, tenta da API local
      const response = await apiRequest('GET', `/api/pneus/atividades/${tireId}`);
      
      if (!response.ok) {
        return [];
      }
      
      return await response.json();
    }

    return data || [];
  } catch (error) {
    console.error('Exceção ao buscar atividades do pneu:', error);
    return [];
  }
}

// Função para obter atividades por usuário
export async function getUserTireActivities(userId: string): Promise<TireActivity[]> {
  try {
    // Busca do Supabase
    const { data, error } = await supabase
      .from('pneus_atividades')
      .select('*')
      .eq('usuario_id', userId)
      .order('data', { ascending: false });

    if (error) {
      console.error('Erro ao buscar atividades do usuário no Supabase:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exceção ao buscar atividades do usuário:', error);
    return [];
  }
}

// Função para obter estatísticas de atividades
export async function getTireActivityStats(): Promise<{
  totalMontagens: number;
  totalRemocoes: number;
  totalDescartes: number;
  totalManutencoes: number;
  usuariosMaisAtivos: { usuario_nome: string; total: number }[];
}> {
  try {
    // Busca estatísticas no Supabase
    const { data: montagens, error: montagensError } = await supabase
      .from('pneus_atividades')
      .select('count')
      .eq('acao', 'montagem');

    const { data: remocoes, error: remocoesError } = await supabase
      .from('pneus_atividades')
      .select('count')
      .eq('acao', 'remocao');

    const { data: descartes, error: descartesError } = await supabase
      .from('pneus_atividades')
      .select('count')
      .eq('acao', 'descarte');

    const { data: manutencoes, error: manutencoesError } = await supabase
      .from('pneus_atividades')
      .select('count')
      .eq('acao', 'manutencao');

    // Usuários mais ativos
    const { data: usuariosAtivos, error: usuariosError } = await supabase
      .from('pneus_atividades')
      .select('usuario_nome, count(*)')
      .group('usuario_nome')
      .order('count', { ascending: false })
      .limit(5);

    if (montagensError || remocoesError || descartesError || manutencoesError || usuariosError) {
      console.error('Erro ao buscar estatísticas no Supabase');
      return {
        totalMontagens: 0,
        totalRemocoes: 0,
        totalDescartes: 0,
        totalManutencoes: 0,
        usuariosMaisAtivos: []
      };
    }

    return {
      totalMontagens: montagens?.length ? Number(montagens[0].count) : 0,
      totalRemocoes: remocoes?.length ? Number(remocoes[0].count) : 0,
      totalDescartes: descartes?.length ? Number(descartes[0].count) : 0,
      totalManutencoes: manutencoes?.length ? Number(manutencoes[0].count) : 0,
      usuariosMaisAtivos: usuariosAtivos?.map(u => ({
        usuario_nome: u.usuario_nome,
        total: Number(u.count)
      })) || []
    };
  } catch (error) {
    console.error('Exceção ao buscar estatísticas de atividades:', error);
    return {
      totalMontagens: 0,
      totalRemocoes: 0,
      totalDescartes: 0,
      totalManutencoes: 0,
      usuariosMaisAtivos: []
    };
  }
}