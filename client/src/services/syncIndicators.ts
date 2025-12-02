import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

let syncChannel: ReturnType<typeof supabase.channel> | null = null;
let isSyncing = false;
let lastSyncTime = 0;
const SYNC_DEBOUNCE_MS = 2000;

export interface IndicadoresData {
  veiculosEmManutencao: number;
  veiculosLiberados: number;
  veiculosLiberadosHoje: number;
  manutencoesPreventivas: number;
  manutencoesCorretivas: number;
  diasParados: number;
  movimentacao: {
    entraram: number;
    sairam: number;
  };
  custoTotal: number;
  sincronizacao: {
    novos: number;
    atualizados: number;
    finalizados: number;
    timestamp: string;
  };
}

export interface SyncResponse {
  success: boolean;
  indicadores: IndicadoresData;
  syncStats: {
    novos: number;
    atualizados: number;
    finalizados: number;
  };
  timestamp: string;
}

export async function syncMaintenanceIndicators(): Promise<SyncResponse | null> {
  const now = Date.now();
  if (isSyncing || (now - lastSyncTime) < SYNC_DEBOUNCE_MS) {
    console.log('[SYNC] Sincronização em andamento ou debounce ativo, ignorando...');
    return null;
  }

  isSyncing = true;
  lastSyncTime = now;

  try {
    console.log('[SYNC] Iniciando sincronização de indicadores...');
    
    const response = await fetch('/api/indicadores/update', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data: SyncResponse = await response.json();

    if (data.success) {
      console.log('[SYNC] Sincronização concluída:', data.syncStats);
      
      await queryClient.invalidateQueries({ queryKey: ['/api/indicadores'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/indicadores/dados'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/indicadores/em-manutencao'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/indicadores/resumo-custos'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/indicadores/movimentacoes'] });
      
      const event = new CustomEvent('indicadores-updated', { detail: data });
      window.dispatchEvent(event);
    }

    return data;
  } catch (error) {
    console.error('[SYNC] Erro na sincronização:', error);
    return null;
  } finally {
    isSyncing = false;
  }
}

export function initializeRealtimeSync(): void {
  if (syncChannel) {
    console.log('[REALTIME] Listener já inicializado');
    return;
  }

  console.log('[REALTIME] Inicializando listener Supabase Realtime...');

  try {
    syncChannel = supabase
      .channel('maintenance-sync')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'oficina_murici_manutencoes' 
        },
        (payload) => {
          console.log('[REALTIME] Mudança detectada na tabela oficina_murici_manutencoes:', payload.eventType);
          
          setTimeout(() => {
            syncMaintenanceIndicators();
          }, 500);
        }
      )
      .subscribe((status) => {
        console.log('[REALTIME] Status da subscription:', status);
      });

    console.log('[REALTIME] Listener configurado com sucesso');
  } catch (error) {
    console.error('[REALTIME] Erro ao configurar listener:', error);
  }
}

export function cleanupRealtimeSync(): void {
  if (syncChannel) {
    console.log('[REALTIME] Removendo listener...');
    supabase.removeChannel(syncChannel);
    syncChannel = null;
  }
}

export function subscribeToIndicadoresUpdates(callback: (data: SyncResponse) => void): () => void {
  const handler = (event: CustomEvent<SyncResponse>) => {
    callback(event.detail);
  };
  
  window.addEventListener('indicadores-updated', handler as EventListener);
  
  return () => {
    window.removeEventListener('indicadores-updated', handler as EventListener);
  };
}

export async function forceSyncIndicadores(): Promise<SyncResponse | null> {
  lastSyncTime = 0;
  isSyncing = false;
  return syncMaintenanceIndicators();
}
